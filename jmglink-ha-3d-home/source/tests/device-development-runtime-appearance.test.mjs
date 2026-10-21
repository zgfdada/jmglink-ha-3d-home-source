import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import Fastify from "fastify";
import { DevicePlatformStore } from "../apps/server/src/device-platform/DevicePlatformStore.js";
import { registerDevicePlatformRoutes } from "../apps/server/src/routes/devicePlatformRoutes.js";
import { validateProjectCapabilities } from "../apps/server/src/device-platform/capabilityValidation.js";
import { normalizeModelTemplate } from "../apps/server/src/device-platform/devicePlatformSchema.js";
import {
  resolveWasherRuntime,
  washerRuntimeLabel,
  washerRuntimeTitle,
} from "../apps/web/src/domain/washer-runtime.js";
import {
  appearanceIssues,
  initialAppearance,
  runtimeDisplayIssues,
  runtimeTemplateVariables,
  stateChoices,
} from "../apps/web/src/app/device-development-center/project-runtime-model.js";
import {
  modelMaterialPalette,
  overrideModelMaterial,
} from "../apps/web/src/domain/model-material-colors.js";

test("N5 text status accepts HA values and offers only real Chinese capability variables", () => {
  const capabilities = [
    {
      capabilityId: "status",
      name: "运行状态",
      kind: "status",
      dataType: "string",
    },
    {
      capabilityId: "remaining",
      name: "剩余时间",
      kind: "number",
      dataType: "number",
    },
  ];
  const binding = {
    capabilityMappings: {
      status: { entityId: "sensor.status" },
      remaining: { entityId: "sensor.remaining" },
    },
  };
  const device = {
    entities: [
      {
        entityId: "sensor.status",
        state: "work",
        attributes: { phase: "洗涤" },
      },
      {
        entityId: "sensor.remaining",
        state: "48",
        attributes: { unit_of_measurement: "min" },
      },
    ],
  };
  const config = {
    statusCapabilityId: "status",
    remainingCapabilityId: "remaining",
    runningStates: ["work", "working"],
    endingStates: ["待机"],
    titleTemplate: "{device.name}",
    idleTemplate: "待机中",
    runningTemplate:
      "剩余 {剩余时间} 分钟 · 预计 {{time.now} + {剩余时间}} 结束",
  };
  assert.deepEqual(
    runtimeDisplayIssues(config, capabilities, binding, device),
    [],
  );
  assert.ok(
    !validateProjectCapabilities(
      { capabilities, runtimeDisplay: config },
      binding,
      device,
    ).issues.some((item) => item.reason.includes("不存在该状态")),
  );
  const tokens = runtimeTemplateVariables(capabilities, binding, device).map(
    (item) => item.token,
  );
  assert.ok(tokens.includes("{运行状态}"));
  assert.ok(!tokens.some((token) => token.includes(".属性.")));
  assert.ok(tokens.includes("{{time.now} + {剩余时间}}"));
  assert.ok(
    !tokens.some(
      (token) =>
        token.includes("remaining.minutes") || token.includes("end.time"),
    ),
  );
  const runtime = resolveWasherRuntime(
    null,
    {
      deviceEntities: device.entities,
      deviceCapabilityBindings: {
        status: ["sensor.status"],
        remaining: ["sensor.remaining"],
      },
      deviceCapabilityNames: { status: "运行状态", remaining: "剩余时间" },
      deviceDisplayName: "洗衣机",
    },
    config,
  );
  assert.match(
    washerRuntimeLabel(
      runtime,
      new Date("2026-10-01T10:00:00+08:00").getTime(),
    ),
    /剩余 48 分钟 · 预计 \d{2}:\d{2} 结束/,
  );
});

test("N6 groups original material colors and overrides only the chosen group", () => {
  const makeMaterial = (hex) => ({
    color: {
      getHexString: () => hex.slice(1),
      set(value) {
        this.value = value;
      },
    },
    metalness: 0.25,
    roughness: 0.75,
    clone() {
      return { ...this, color: { ...this.color } };
    },
  });
  const white = makeMaterial("#ffffff");
  const black = makeMaterial("#222222");
  const root = {
    traverse(visitor) {
      visitor({ isMesh: true, material: [white, black] });
      visitor({ isMesh: true, material: white });
    },
  };
  assert.deepEqual(modelMaterialPalette(root), [
    { color: "#ffffff", count: 2 },
    { color: "#222222", count: 1 },
  ]);
  assert.equal(overrideModelMaterial(white, { materialColors: {} }), white);
  const appearance = { materialColors: { "#222222": "#ff0000" } };
  assert.equal(overrideModelMaterial(white, appearance), white);
  const updated = overrideModelMaterial(black, appearance);
  assert.notEqual(updated, black);
  assert.equal(updated.color.value, "#ff0000");
  assert.equal(black.color.value, undefined);
});

test("N5 preserves missing enum values, rejects conflicting states, and renders safe fallback", () => {
  const status = {
    capabilityId: "program",
    kind: "enum",
    enumValues: [
      { value: "washing", label: "洗涤中", status: "valid" },
      { value: "spin", label: "脱水", status: "missing" },
    ],
  };
  const choices = stateChoices(status, null);
  assert.equal(choices.find((item) => item.value === "spin").missing, true);
  assert.equal(
    stateChoices(status, {
      state: "spin",
      attributes: { options: ["washing"] },
    }).find((item) => item.value === "spin").missing,
    true,
  );
  const config = {
    statusCapabilityId: "program",
    runningStates: ["washing"],
    endingStates: ["spin"],
    titleTemplate: "{device.name}",
    idleTemplate: "待机中",
    runningTemplate: "剩余 {remaining.minutes | --} 分钟",
  };
  const binding = {
    capabilityMappings: {
      program: { entityId: "select.program", attribute: "state" },
    },
  };
  const device = {
    entities: [
      { entityId: "select.program", state: "washing", attributes: {} },
    ],
  };
  assert.match(
    runtimeDisplayIssues(config, [status], binding, device).join(" "),
    /已不存在状态/,
  );
  assert.match(
    runtimeDisplayIssues(
      { ...config, endingStates: ["washing"] },
      [status],
      binding,
      device,
    ).join(" "),
    /不能同时/,
  );
  const runtime = resolveWasherRuntime(
    null,
    {
      deviceEntities: device.entities,
      deviceCapabilityBindings: { program: ["select.program"] },
      deviceDisplayName: "洗衣机",
    },
    config,
  );
  assert.equal(runtime.running, true);
  assert.equal(washerRuntimeTitle(runtime, "默认"), "洗衣机");
  assert.equal(washerRuntimeLabel(runtime), "剩余 -- 分钟");
  assert.ok(!/null|undefined|NaN/.test(washerRuntimeLabel(runtime)));
});

test("N5/N6 isolated APIs persist project configuration without modifying shared model", async () => {
  const temporary = await mkdtemp(path.join(tmpdir(), "ha3d-n5n6-"));
  const app = Fastify();
  try {
    const store = await DevicePlatformStore.create(
      path.join(temporary, "data"),
      path.join(temporary, "assets"),
    );
    await store.upsertDeviceTemplate({
      id: "custom.project",
      name: "测试设备",
      capabilities: [
        {
          capabilityId: "program",
          name: "程序",
          kind: "enum",
          dataType: "enum",
          enumValues: [
            { value: "washing", label: "洗涤中" },
            { value: "finished", label: "完成" },
          ],
        },
        {
          capabilityId: "remaining",
          name: "剩余时间",
          kind: "number",
          dataType: "number",
        },
      ],
    });
    await store.upsertBinding({
      deviceId: "device-one",
      deviceTemplateId: "custom.project",
      selectedEntityIds: ["select.program", "sensor.remaining"],
      capabilityBindings: {
        program: ["select.program"],
        remaining: ["sensor.remaining"],
      },
    });
    await registerDevicePlatformRoutes(app, store, {
      getDevices: () => [{ id: "device-one", name: "设备" }],
      getEntities: () => [
        {
          deviceId: "device-one",
          entityId: "select.program",
          domain: "select",
          state: "washing",
          attributes: { options: ["washing", "finished"] },
        },
        {
          deviceId: "device-one",
          entityId: "sensor.remaining",
          domain: "sensor",
          state: "48",
          attributes: { unit_of_measurement: "min" },
        },
      ],
    });
    const base = "/api/device-platform/projects/custom.project";
    const invalid = await app.inject({
      method: "PUT",
      url: `${base}/runtime-display`,
      payload: {
        runtimeDisplay: {
          statusCapabilityId: "program",
          runningStates: ["washing"],
          endingStates: ["washing"],
        },
      },
    });
    assert.equal(invalid.statusCode, 400);
    const saved = await app.inject({
      method: "PUT",
      url: `${base}/runtime-display`,
      payload: {
        runtimeDisplay: {
          statusCapabilityId: "program",
          remainingCapabilityId: "remaining",
          runningStates: ["washing"],
          endingStates: ["finished"],
          titleTemplate: "{device.name}",
          idleTemplate: "待机中",
          runningTemplate: "剩余 {remaining.minutes | --} 分钟",
        },
      },
    });
    assert.equal(saved.statusCode, 200);
    const model = store
      .getModelTemplates()
      .find((item) => item.id === "custom.water-purifier");
    const before = structuredClone(model);
    const appearance = {
      ...initialAppearance(model),
      dimensions: { width: 0.8, depth: 0.3, height: 1.2 },
      color: "#123456",
      colorOverride: true,
      materialColors: { "#ffffff": "#ff0000" },
      animation: {
        statusCapabilityId: "program",
        remainingCapabilityId: "remaining",
        activeStates: ["washing"],
      },
    };
    const appearanceResponse = await app.inject({
      method: "PUT",
      url: `${base}/appearance`,
      payload: { modelTemplateId: model.id, appearance },
    });
    assert.equal(appearanceResponse.statusCode, 200);
    const project = store
      .getDeviceTemplates()
      .find((item) => item.id === "custom.project");
    assert.equal(project.runtimeDisplay.statusCapabilityId, "program");
    assert.equal(project.appearance.dimensions.width, 0.8);
    assert.equal(project.appearance.materialColors["#ffffff"], "#ff0000");
    assert.equal(project.modelTemplateId, model.id);
    assert.deepEqual(
      store.getModelTemplates().find((item) => item.id === model.id).dimensions,
      before.dimensions,
    );
    assert.equal(
      store.getBindings().find((item) => item.deviceTemplateId === project.id)
        .modelTemplateId,
      model.id,
    );
    assert.deepEqual(
      appearanceIssues(project, model, project.capabilities),
      [],
    );
    assert.equal(
      validateProjectCapabilities(
        project,
        store.getBindings()[0],
        { entities: [] },
        store.getModelTemplates(),
      ).issues.some(
        (item) => item.page === "运行浮窗" && item.reason.includes("缺失"),
      ),
      false,
    );
    const reloaded = await DevicePlatformStore.create(
      path.join(temporary, "data"),
      path.join(temporary, "assets"),
    );
    assert.equal(
      reloaded.getDeviceTemplates().find((item) => item.id === project.id)
        .appearance.color,
      "#123456",
    );
    store.modelTemplates.push(
      normalizeModelTemplate(
        { id: "custom.missing-upload", name: "缺失文件模型" },
        {
          sourceOverride: {
            type: "upload",
            url: "./api/device-platform/model-files/missing.glb",
          },
        },
      ),
    );
    await store.saveProjectAppearance(
      project.id,
      "custom.missing-upload",
      appearance,
    );
    const missing = await app.inject({
      method: "GET",
      url: `${base}/capability-validation`,
    });
    assert.equal(missing.statusCode, 200);
    assert.ok(
      missing
        .json()
        .issues.some(
          (item) =>
            item.page === "3D 外观" && item.reason.includes("模型文件不可用"),
        ),
    );
    assert.equal(missing.json().publishBlocked, true);
  } finally {
    await app.close();
    await rm(temporary, { recursive: true, force: true });
  }
});
