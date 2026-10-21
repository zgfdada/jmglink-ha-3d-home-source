import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import Fastify from "fastify";
import { DevicePlatformStore } from "../apps/server/src/device-platform/DevicePlatformStore.js";
import { registerDevicePlatformRoutes } from "../apps/server/src/routes/devicePlatformRoutes.js";
import { capabilityHealth } from "../apps/server/src/device-platform/projectLifecycle.js";
import { validateProjectCapabilities } from "../apps/server/src/device-platform/capabilityValidation.js";

test("single unknown entity is pending, not evidence that HA or the device is offline", () => {
  const entity = {
    entityId: "select.program",
    domain: "select",
    state: "unknown",
    attributes: { options: ["normal"] },
  };
  assert.deepEqual(capabilityHealth(entity, true), {
    available: false,
    availability: "unknown",
    label: "状态待同步",
  });
  assert.equal(capabilityHealth(entity, false).availability, "ha_offline");
  assert.equal(
    capabilityHealth({ ...entity, state: "unavailable" }, true).label,
    "实体不可用",
  );
  const validation = validateProjectCapabilities(
    { capabilities: [{ capabilityId: "program", dataType: "enum" }] },
    {
      capabilityMappings: {
        program: { entityId: entity.entityId, attribute: "state" },
      },
    },
    { entities: [entity] },
  );
  assert.equal(validation.publishBlocked, false);
  assert.equal(validation.issues[0].reason, "映射实体状态待同步");
});

test("N8/N9 isolate simulation, guard real HA control, retain immutable releases and rematch imports", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "ha3d-n8n9-"));
  const app = Fastify();
  try {
    const store = await DevicePlatformStore.create(
      path.join(directory, "data"),
      path.join(directory, "assets"),
    );
    await store.upsertModelTemplate({
      id: "custom.model-test",
      name: "测试模型",
      source: { type: "procedural", shape: "box" },
    });
    await store.upsertControlPanel({
      id: "custom.panel-test",
      name: "测试面板",
      sections: [
        {
          id: "main",
          title: "控制",
          controls: [
            {
              id: "power",
              label: "电源",
              type: "toggle",
              capabilityId: "power",
              grid: { x: 0, y: 0, w: 2 },
            },
          ],
        },
      ],
    });
    await store.upsertDeviceTemplate({
      id: "custom.project-test",
      name: "测试设备",
      description: "https://ha.example.invalid/api",
      category: "appliance",
      manufacturer: "测试厂商",
      model: "T1",
      modelTemplateId: "custom.model-test",
      controlPanelTemplateId: "custom.panel-test",
      capabilities: [
        {
          capabilityId: "running",
          name: "运行状态",
          kind: "status",
          dataType: "boolean",
        },
        {
          capabilityId: "power",
          name: "电源",
          kind: "toggle",
          dataType: "boolean",
          access: "read-write",
        },
      ],
      runtimeDisplay: {
        statusCapabilityId: "running",
        runningStates: ["on"],
        titleTemplate: "{device.name}",
        idleTemplate: "待机",
        runningTemplate: "运行中",
      },
      appearance: {
        dimensions: { width: 0.5, depth: 0.5, height: 1 },
        animation: { statusCapabilityId: "running", activeStates: ["on"] },
      },
    });
    await store.upsertBinding({
      deviceId: "device-test",
      deviceTemplateId: "custom.project-test",
      selectedEntityIds: ["switch.test"],
      capabilityMappings: {
        running: { entityId: "switch.test", attribute: "state" },
        power: { entityId: "switch.test", attribute: "state" },
      },
    });
    let connected = false;
    let entityState = "off";
    const actions = [];
    const ha = {
      getDevices: () => [{ id: "device-test", name: "测试设备" }],
      getEntities: () => [
        {
          entityId: "switch.test",
          domain: "switch",
          state: entityState,
          attributes: {},
        },
      ],
      getStatus: () => ({ connected, mock: false }),
      performAction: async (action) => {
        actions.push(action);
        return {
          entityId: action.entityId,
          state: action.type === "turn_on" ? "on" : "off",
        };
      },
    };
    await registerDevicePlatformRoutes(app, store, ha);
    const root = "/api/device-platform/projects/custom.project-test";
    const diagnostics = await app.inject({
      method: "GET",
      url: `${root}/diagnostics`,
    });
    assert.equal(diagnostics.statusCode, 200);
    assert.equal(diagnostics.json().haConnected, false);
    assert.equal(diagnostics.json().publishBlocked, false);
    const original = store
      .getDeviceTemplates()
      .find((item) => item.id === "custom.project-test");
    await store.upsertDeviceTemplate({
      ...original,
      manufacturer: "",
      model: "",
    });
    const incompleteInfo = (
      await app.inject({ method: "GET", url: `${root}/diagnostics` })
    ).json();
    assert.equal(incompleteInfo.publishBlocked, false);
    assert.equal(
      incompleteInfo.checks.find((item) => item.page === "基础信息")?.severity,
      "warning",
    );
    await store.upsertDeviceTemplate(original);
    assert.equal(
      (
        await app.inject({
          method: "POST",
          url: `${root}/test-action`,
          payload: { capabilityId: "power", value: true, confirmReal: true },
        })
      ).statusCode,
      400,
    );
    connected = true;
    entityState = "unknown";
    const pending = (
      await app.inject({ method: "GET", url: `${root}/diagnostics` })
    ).json();
    assert.equal(pending.haConnected, true);
    assert.equal(pending.capabilities[0].availability, "unknown");
    assert.equal(pending.capabilities[0].availabilityLabel, "状态待同步");
    assert.equal(
      pending.checks.some((item) => item.reason.includes("设备暂时离线")),
      false,
    );
    entityState = "off";
    assert.equal(
      (
        await app.inject({
          method: "POST",
          url: `${root}/test-action`,
          payload: { capabilityId: "power", value: true },
        })
      ).statusCode,
      400,
    );
    assert.equal(
      (
        await app.inject({
          method: "POST",
          url: `${root}/test-action`,
          payload: { capabilityId: "running", value: true, confirmReal: true },
        })
      ).statusCode,
      400,
    );
    assert.equal(
      (
        await app.inject({
          method: "POST",
          url: `${root}/test-action`,
          payload: { capabilityId: "power", value: "bad", confirmReal: true },
        })
      ).statusCode,
      400,
    );
    assert.equal(actions.length, 0);
    const real = await app.inject({
      method: "POST",
      url: `${root}/test-action`,
      payload: { capabilityId: "power", value: true, confirmReal: true },
    });
    assert.equal(real.statusCode, 200);
    assert.deepEqual(actions, [{ entityId: "switch.test", type: "turn_on" }]);
    assert.equal(
      (await app.inject({ method: "GET", url: `${root}/publish-check` })).json()
        .publishBlocked,
      true,
    );
    assert.equal(
      (
        await app.inject({
          method: "POST",
          url: `${root}/test-complete`,
          payload: { mode: "simulation" },
        })
      ).statusCode,
      200,
    );
    assert.equal(
      (
        await app.inject({
          method: "PUT",
          url: `${root}/release-draft`,
          payload: {
            version: "1.0.0",
            channel: "internal",
            visibility: "private",
            notes: "首次",
          },
        })
      ).statusCode,
      200,
    );
    assert.equal(
      (
        await app.inject({
          method: "POST",
          url: `${root}/publish`,
          payload: {},
        })
      ).statusCode,
      400,
    );
    assert.equal(
      (
        await app.inject({
          method: "POST",
          url: `${root}/publish`,
          payload: { confirmWarnings: true },
        })
      ).statusCode,
      200,
    );
    const exported = (
      await app.inject({ method: "GET", url: `${root}/package?version=1.0.0` })
    ).json();
    assert.equal(exported.format, "ha3d-device-project");
    assert.equal(exported.manifest.requiresHaRematch, true);
    assert.equal(exported.project.description, "");
    assert.equal(JSON.stringify(exported).includes("switch.test"), false);
    assert.equal(exported.version.number, "1.0.0");
    assert.equal(
      (await app.inject({ method: "GET", url: `${root}/release/1.0.0` })).json()
        .project.name,
      "测试设备",
    );
    const changed = store
      .getDeviceTemplates()
      .find((item) => item.id === "custom.project-test");
    await store.upsertDeviceTemplate({ ...changed, name: "修改后的草稿" });
    const oldVersion = (
      await app.inject({ method: "GET", url: `${root}/package?version=1.0.0` })
    ).json();
    assert.equal(oldVersion.project.name, "测试设备");
    assert.equal(
      store.getProjectLifecycle("custom.project-test").draft.version,
      "1.0.1",
    );
    assert.equal(
      store.getProjectLifecycle("custom.project-test").releases[0].current,
      true,
    );
    await app.inject({
      method: "PUT",
      url: `${root}/release-draft`,
      payload: { version: "1.0.0" },
    });
    assert.equal(
      (
        await app.inject({
          method: "POST",
          url: `${root}/publish`,
          payload: { confirmWarnings: true },
        })
      ).statusCode,
      400,
    );
    const imported = await app.inject({
      method: "POST",
      url: "/api/device-platform/projects/import-package",
      payload: exported,
    });
    assert.equal(imported.statusCode, 200);
    assert.notEqual(imported.json().projectId, "custom.project-test");
    assert.equal(
      store
        .getBindings()
        .some((item) => item.deviceTemplateId === imported.json().projectId),
      false,
    );
    const incomplete = await app.inject({
      method: "POST",
      url: "/api/device-platform/projects/import-package",
      payload: { ...exported, model: null, panel: null },
    });
    assert.equal(incomplete.statusCode, 200);
    assert.equal(
      store
        .getDeviceTemplates()
        .find((item) => item.id === incomplete.json().projectId)
        .modelTemplateId,
      undefined,
    );
    const loaded = await DevicePlatformStore.create(
      path.join(directory, "data"),
      path.join(directory, "assets"),
    );
    assert.equal(
      loaded.getProjectLifecycle("custom.project-test").releases.length,
      1,
    );
  } finally {
    await app.close();
    await rm(directory, { recursive: true, force: true });
  }
});
