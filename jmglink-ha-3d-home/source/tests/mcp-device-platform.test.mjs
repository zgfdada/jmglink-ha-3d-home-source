import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import Fastify from "fastify";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { ProjectStore } from "../apps/server/src/projects/ProjectStore.js";
import { SidebarStore } from "../apps/server/src/sidebar/SidebarStore.js";
import { DevicePlatformStore } from "../apps/server/src/device-platform/DevicePlatformStore.js";
import { MotionLibraryStore } from "../apps/server/src/motion-library/MotionLibraryStore.js";
import { ControlLibraryStore } from "../apps/server/src/control-library/ControlLibraryStore.js";
import { createInstanceWriteGate } from "../apps/server/src/instance-write-gate.js";
import { startMcp } from "../apps/server/src/mcp/server.js";
import { SCOPES, hash } from "../apps/server/src/mcp/store.js";
import {
  parseModelFile,
  inspectModelDocument,
} from "../apps/server/src/mcp/model-parts.js";

async function fixture(t) {
  const dir = await mkdtemp(path.join(os.tmpdir(), "ha3d-mcp-device-"));
  const projects = await ProjectStore.create(path.join(dir, "data")),
    sidebars = await SidebarStore.create(path.join(dir, "data"));
  const platform = await DevicePlatformStore.create(
    path.join(dir, "data"),
    path.join(dir, "assets"),
  );
  platform.motionLibrary = await MotionLibraryStore.create(
    path.join(dir, "data"),
  );
  platform.controlLibrary = await ControlLibraryStore.create(
    path.join(dir, "data"),
    platform,
  );
  const ha = {
    config: { ha: { token: "upstream-test-only" } },
    getStatus: () => ({ connected: true, mock: false }),
    getDevices: () => [{ id: "speaker", name: "音响" }],
    getEntities: () => [
      {
        entityId: "input_boolean.speaker",
        domain: "input_boolean",
        name: "音响模拟",
        state: "off",
        attributes: { options: ["on", "off"], access_token: "must-not-leak" },
        deviceId: "speaker",
      },
      {
        entityId: "media_player.music",
        domain: "media_player",
        name: "播放器",
        state: "idle",
        attributes: {},
        deviceId: "music",
      },
    ],
  };
  const app = Fastify(),
    service = await startMcp({
      app,
      projects,
      sidebars,
      platform,
      ha,
      writeGate: createInstanceWriteGate(),
      directory: path.join(dir, "private"),
      port: 0,
      host: "127.0.0.1",
      sharedAccess: true,
    });
  await app.ready();
  service.store.state.connections.ha.enabled = true;
  const client = service.store.state.clients.find(
    (c) => c.id === "shared-agents",
  );
  client.scopes = [...SCOPES];
  client.resources.entities = ["*"];
  const engine = service.engine,
    device = engine.devicePlatform,
    projectId = projects.getProject().id;
  const sdk = new Client({ name: "device-platform-test", version: "1.0.0" });
  await sdk.connect(
    new StreamableHTTPClientTransport(
      new URL(`http://127.0.0.1:${service.listener.address().port}/mcp`),
    ),
  );
  t.after(async () => {
    await sdk.close();
    await service.close();
    await app.close();
    assert.ok(
      path
        .resolve(dir)
        .startsWith(path.resolve(os.tmpdir()) + path.sep + "ha3d-mcp-device-"),
    );
    await rm(dir, { recursive: true, force: true });
  });
  const plan = (operation, value, deviceProjectId, library = false) =>
    device.plan(
      client,
      {
        projectId,
        deviceProjectId,
        operation,
        value,
        expectedRevision: device.revision(),
      },
      library,
    );
  const apply = (p) =>
    engine.apply(client, { planId: p.id, idempotencyKey: "apply-" + p.id });
  return {
    dir,
    projects,
    platform,
    client,
    engine,
    device,
    projectId,
    sdk,
    plan,
    apply,
  };
}
const capability = {
  capabilityId: "status",
  name: "音响状态",
  kind: "status",
  dataType: "boolean",
  access: "read",
  required: true,
  allowedDomains: ["input_boolean"],
};
const gltf = {
  asset: { version: "2.0" },
  scene: 0,
  scenes: [{ name: "单只音箱", nodes: [0] }],
  nodes: [
    { name: "Speaker", children: [1] },
    { name: "Wave", translation: [0, 1, 0], scale: [0.001, 0.001, 0.001] },
  ],
};

test("MCP设备平台真实SDK发现、创建绑定映射、CAS、幂等、回滚与磁盘重开", async (t) => {
  const f = await fixture(t);
  const tools = (await f.sdk.listTools()).tools.map((t) => t.name);
  for (const name of [
    "home3d.device.plan",
    "home3d.model.parts_get",
    "home3d.transfer.stage",
    "home3d.device.preview",
    "ha.entities.details",
  ])
    assert.ok(tools.includes(name));
  const first = await f.plan("create", {
    id: "custom.speaker",
    name: "单只音箱",
    manufacturer: "模拟",
    category: "media",
    model: "reuse",
  });
  assert.ok(
    !f.platform.getDeviceTemplates().some((d) => d.id === "custom.speaker"),
    "planning must not change live business state",
  );
  const created = await f.apply(first);
  assert.equal(created.status, "applied");
  assert.deepEqual(await f.apply(first), created);
  await f.apply(
    await f.plan(
      "extra_entities",
      { entityIds: ["input_boolean.speaker"] },
      "custom.speaker",
    ),
  );
  await f.apply(
    await f.plan(
      "capabilities",
      {
        capabilities: [capability],
        mappings: {
          status: { entityId: "input_boolean.speaker", attribute: "state" },
        },
      },
      "custom.speaker",
    ),
  );
  assert.equal(
    f.device.get(f.client, {
      projectId: f.projectId,
      deviceProjectId: "custom.speaker",
    }).binding.capabilityMappings.status.entityId,
    "input_boolean.speaker",
  );
  const stale = await f.plan("basic", { name: "stale" }, "custom.speaker");
  const changed = await f.apply(
    await f.plan("basic", { name: "updated" }, "custom.speaker"),
  );
  await assert.rejects(
    () => f.apply(stale),
    (e) => e.code === "REVISION_CONFLICT",
  );
  const rollback = await f.engine.rollback(f.client, changed.id);
  await f.apply(rollback);
  assert.equal(f.device.device("custom.speaker").name, "单只音箱");
  const reopened = await DevicePlatformStore.create(
    path.join(f.dir, "data"),
    path.join(f.dir, "assets"),
  );
  assert.equal(
    reopened.getBindings().find((b) => b.deviceTemplateId === "custom.speaker")
      .extraEntityIds[0],
    "input_boolean.speaker",
  );
  const details = await f.sdk.callTool({
    name: "ha.entities.details",
    arguments: { entityIds: ["input_boolean.speaker"] },
  });
  assert.ok(!JSON.stringify(details).includes("must-not-leak"));
});

test("分块上传与重复分块、模型入库、原始部件身份、资源规则、离线模拟及文件恢复", async (t) => {
  const f = await fixture(t),
    bytes = Buffer.from(JSON.stringify(gltf)),
    sha256 = hash(bytes.toString());
  const initial = await f.device.transfers.stage(f.client, {
    fileName: "speaker.gltf",
    totalBytes: bytes.length,
    sha256,
    offset: 0,
    dataBase64: bytes.subarray(0, 64).toString("base64"),
  });
  const continuation = {
    transferId: initial.transferId,
    offset: 64,
    dataBase64: bytes.subarray(64).toString("base64"),
  };
  const done = await f.device.transfers.stage(f.client, continuation);
  assert.equal(done.complete, true);
  assert.deepEqual(
    await f.device.transfers.stage(f.client, continuation),
    done,
  );
  await assert.rejects(
    () => f.device.transfers.stage(f.client, { ...continuation, offset: 1 }),
    (e) => e.code === "REVISION_CONFLICT",
  );
  const model = {
    id: "custom.speaker-model",
    name: "单只浅色音箱",
    dimensions: { width: 0.2, depth: 0.2, height: 0.3 },
    furnitureEnabled: true,
  };
  const saved = await f.apply(
    await f.plan(
      "model_file",
      { model, transferId: done.transferId },
      undefined,
      true,
    ),
  );
  assert.equal(saved.result.realDeviceActions, false);
  const parts = await f.device.parts(f.client, {
    projectId: f.projectId,
    modelId: model.id,
  });
  assert.equal(parts.reliable, true);
  assert.equal(parts.parts.find((p) => p.path === "root/0/0").name, "Wave");
  await f.apply(
    await f.plan("create", { id: "custom.speaker", name: "单只音箱" }),
  );
  await f.apply(
    await f.plan(
      "extra_entities",
      { entityIds: ["input_boolean.speaker"] },
      "custom.speaker",
    ),
  );
  await f.apply(
    await f.plan(
      "capabilities",
      {
        capabilities: [capability],
        mappings: {
          status: { entityId: "input_boolean.speaker", attribute: "state" },
        },
      },
      "custom.speaker",
    ),
  );
  await f.apply(
    await f.plan(
      "appearance",
      {
        modelTemplateId: model.id,
        appearance: { dimensions: model.dimensions },
      },
      "custom.speaker",
    ),
  );
  await f.apply(
    await f.plan(
      "motion_save",
      {
        resource: {
          name: "音波循环",
          effect: { type: "scale", axis: "y", from: 1, to: 2 },
        },
      },
      undefined,
      true,
    ),
  );
  const resource = f.platform.motionLibrary
    .list()
    .find((r) => r.name === "音波循环");
  const rule = {
    id: "wave",
    name: "蓝色声波",
    targets: ["root/0/0"],
    capabilityId: "status",
    motionResourceId: resource.id,
    condition: { operator: "eq", value: "on" },
  };
  await f.apply(await f.plan("motions", { rules: [rule] }, "custom.speaker"));
  const savedRule =
    f.device.device("custom.speaker").appearance.partMotionRules[0];
  assert.equal(savedRule.targetNames["root/0/0"], "Wave");
  assert.equal(savedRule.effect.to, 2);
  const preview = await f.device.preview(f.client, {
    projectId: f.projectId,
    deviceProjectId: "custom.speaker",
    values: { status: "on" },
  });
  assert.equal(preview.rules[0].matched, true);
  assert.equal(preview.visualVerified, false);
  assert.equal(preview.executesCustomCode, false);
  assert.equal(
    (
      await f.device.preview(f.client, {
        projectId: f.projectId,
        deviceProjectId: "custom.speaker",
        values: { status: "on" },
        offline: true,
      })
    ).rules[0].matched,
    false,
  );
  await assert.rejects(
    () =>
      f.plan(
        "motions",
        {
          rules: [
            { ...rule, targetNames: { "root/0/0": "中文显示名不可作为身份" } },
          ],
        },
        "custom.speaker",
      ),
    (e) => e.code === "REVISION_CONFLICT",
  );
  await assert.rejects(
    () => f.plan("model_delete", { modelId: model.id }, undefined, true),
    (e) => e.code === "RESOURCE_DENIED",
  );
  const update = await f.apply(
    await f.plan(
      "model_file",
      { model: { ...model, name: "新模型名称" }, transferId: done.transferId },
      undefined,
      true,
    ),
  );
  const undo = await f.engine.rollback(f.client, update.id);
  await f.apply(undo);
  assert.equal(
    f.platform.getModelTemplates().find((m) => m.id === model.id).name,
    model.name,
  );
});

test("读写范围、实体撤权和脚本权限在计划与应用时再次检查", async (t) => {
  const f = await fixture(t),
    reader = {
      ...f.client,
      scopes: ["home3d.catalog.read", "home3d.project.read"],
    };
  await assert.rejects(
    () =>
      f.device.plan(reader, {
        projectId: f.projectId,
        operation: "create",
        value: { name: "denied" },
        expectedRevision: f.device.revision(),
      }),
    (e) => e.code === "FORBIDDEN_SCOPE",
  );
  await f.apply(await f.plan("create", { id: "custom.speaker", name: "音响" }));
  const bind = await f.plan(
    "extra_entities",
    { entityIds: ["input_boolean.speaker"] },
    "custom.speaker",
  );
  f.client.resources.entities = ["media_player.music"];
  await assert.rejects(
    () => f.apply(bind),
    (e) => e.code === "RESOURCE_DENIED",
  );
  f.client.resources.entities = ["*"];
  f.client.scopes = f.client.scopes.filter((s) => s !== "home3d.code.write");
  await assert.rejects(
    () =>
      f.plan(
        "motion_save",
        {
          resource: {
            name: "custom",
            effect: {
              type: "scale",
              program: {
                version: 1,
                code: "function update(ctx){return {value:2};}",
              },
            },
          },
        },
        undefined,
        true,
      ),
    (e) => e.code === "FORBIDDEN_SCOPE",
  );
  const other = await f.projects.createProject({ name: "other" });
  f.client.resources.projects = [f.projectId];
  assert.throws(
    () => f.device.list(f.client, { projectId: f.projectId }),
    (e) => e.code === "RESOURCE_DENIED",
  );
  assert.ok(other.id);
});

test("GLB外部URI、模型节点循环、复杂部件不可静态确认，均不触发远程加载", () => {
  assert.throws(
    () =>
      parseModelFile(
        Buffer.from(
          JSON.stringify({
            ...gltf,
            buffers: [{ uri: "http://external.invalid/model.bin" }],
          }),
        ),
        "unsafe.gltf",
      ),
    (e) => e.code === "RESOURCE_DENIED",
  );
  assert.throws(
    () =>
      inspectModelDocument({
        ...gltf,
        nodes: [{ name: "loop", children: [0] }],
      }),
    (e) => e.code === "VALIDATION_FAILED",
  );
  const complex = inspectModelDocument({
    ...gltf,
    nodes: [{ name: "camera", camera: 0 }],
  });
  assert.equal(complex.reliable, false);
  const duplicates = inspectModelDocument({
    ...gltf,
    nodes: [{ name: "same", children: [1] }, { name: "same" }],
  });
  assert.equal(duplicates.parts[1].identityTrusted, false);
});

test("本地设备发布沿用模拟警告门槛，设备包导入不复制HA绑定，控件与动效包可复用", async (t) => {
  const f = await fixture(t);
  await f.apply(
    await f.plan("create", {
      id: "custom.lifecycle",
      name: "复用单件",
      category: "media",
      manufacturer: "模拟辅助实体",
      model: "现有资源",
    }),
  );
  await f.apply(
    await f.plan(
      "extra_entities",
      { entityIds: ["input_boolean.speaker"] },
      "custom.lifecycle",
    ),
  );
  await f.apply(
    await f.plan(
      "capabilities",
      {
        capabilities: [capability],
        mappings: {
          status: { entityId: "input_boolean.speaker", attribute: "state" },
        },
      },
      "custom.lifecycle",
    ),
  );
  const model = f.platform
    .getModelTemplates()
    .find((m) => m.source.type === "procedural");
  await f.apply(
    await f.plan(
      "appearance",
      {
        modelTemplateId: model.id,
        appearance: { dimensions: { width: 0.2, depth: 0.2, height: 0.3 } },
      },
      "custom.lifecycle",
    ),
  );
  await f.apply(
    await f.plan(
      "runtime_display",
      {
        runtimeDisplay: {
          statusCapabilityId: "status",
          runningStates: ["on"],
          endingStates: [],
          titleTemplate: "模拟单件",
        },
      },
      "custom.lifecycle",
    ),
  );
  await f.apply(
    await f.plan(
      "control_panel",
      {
        panel: {
          name: "单件控制",
          sections: [
            {
              id: "main",
              title: "模拟状态",
              controls: [
                {
                  id: "status",
                  type: "status",
                  capabilityId: "status",
                  label: "状态",
                },
              ],
            },
          ],
        },
      },
      "custom.lifecycle",
    ),
  );
  const diagnostic = await f.device.diagnostics(f.client, {
    projectId: f.projectId,
    deviceProjectId: "custom.lifecycle",
  });
  assert.equal(
    diagnostic.publishBlocked,
    false,
    JSON.stringify(diagnostic.checks),
  );
  await f.apply(await f.plan("test_simulation", {}, "custom.lifecycle"));
  await f.apply(
    await f.plan(
      "release_draft",
      { version: "1.0.0", notes: "仅模拟验收" },
      "custom.lifecycle",
    ),
  );
  await assert.rejects(
    () => f.plan("publish_local", {}, "custom.lifecycle"),
    (e) => e.code === "VALIDATION_FAILED",
  );
  const published = await f.apply(
    await f.plan(
      "publish_local",
      { confirmWarnings: true },
      "custom.lifecycle",
    ),
  );
  assert.equal(published.result.realDeviceActions, false);
  assert.equal(
    f.platform.getProjectLifecycle("custom.lifecycle").test.mode,
    "simulation",
  );
  const exported = await f.sdk.callTool({
    name: "home3d.device.package_export",
    arguments: { projectId: f.projectId, deviceProjectId: "custom.lifecycle" },
  });
  assert.ok(!exported.isError);
  const transfer = JSON.parse(exported.content[0].text);
  const downloaded = await f.device.transfers.read(
    f.client,
    transfer.transferId,
    0,
  );
  assert.equal(downloaded.complete, true);
  const portable = JSON.parse(Buffer.from(downloaded.dataBase64, "base64"));
  assert.equal(portable.bindings, undefined);
  assert.equal(portable.binding, undefined);
  const imported = await f.apply(
    await f.plan("import_package", { transferId: transfer.transferId }),
  );
  assert.equal(imported.result.result.requiresHaRematch, true);
  assert.equal(
    f.platform
      .getBindings()
      .find((b) => b.deviceTemplateId === imported.result.result.projectId),
    undefined,
  );
  const libraryExport = await f.sdk.callTool({
    name: "home3d.library.export",
    arguments: { projectId: f.projectId, kind: "motions" },
  });
  const motionTransfer = JSON.parse(libraryExport.content[0].text);
  const oldCount = f.platform.motionLibrary.list().length;
  await f.apply(
    await f.plan(
      "motion_import",
      { transferId: motionTransfer.transferId },
      undefined,
      true,
    ),
  );
  assert.equal(f.platform.motionLibrary.list().length, oldCount * 2);
  const control = f.platform.controlLibrary
    .list()
    .find((c) => c.type === "text");
  await f.apply(
    await f.plan(
      "control_save",
      { control: { ...control, id: "custom.test-status", name: "可复用状态" } },
      undefined,
      true,
    ),
  );
  await f.apply(
    await f.plan(
      "control_delete",
      { controlId: "custom.test-status" },
      undefined,
      true,
    ),
  );
  assert.ok(
    !f.platform.controlLibrary
      .list()
      .some((c) => c.id === "custom.test-status"),
  );
  await assert.rejects(
    () =>
      f.device.transfers.bytes(
        { ...f.client, id: "other-client" },
        transfer.transferId,
      ),
    (e) => e.code === "RESOURCE_DENIED",
  );
});
