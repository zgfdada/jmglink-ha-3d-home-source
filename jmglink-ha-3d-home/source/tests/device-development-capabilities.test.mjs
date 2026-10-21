import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import Fastify from "fastify";
import { DevicePlatformStore } from "../apps/server/src/device-platform/DevicePlatformStore.js";
import { aggregateDeviceObjects } from "../apps/server/src/device-platform/deviceAggregation.js";
import { registerDevicePlatformRoutes } from "../apps/server/src/routes/devicePlatformRoutes.js";
import {
  capabilityMapping,
  capabilityFromEntity,
  capabilityStepState,
  mappingStatus,
  selectedDeviceEntities,
  syncEnumValues,
  unboundCapabilities,
  unusedBoundEntities,
} from "../apps/web/src/app/device-development-center/capability-model.js";
import { applyBasicProjectDraft } from "../apps/web/src/app/device-development-center/project-basic.js";

test("N4 HA enum sync preserves manual values and flags disappeared options", () => {
  const current = [
    { label: "标准", value: "standard", source: "ha", status: "valid" },
    { label: "轻柔", value: "gentle", source: "ha", status: "valid" },
    { label: "桶自洁", value: "tub_clean", source: "manual", status: "valid" },
  ];
  const next = syncEnumValues(current, ["standard", "quick"]);
  assert.deepEqual(
    next.map((item) => [item.value, item.source, item.status]),
    [
      ["standard", "ha", "valid"],
      ["gentle", "ha", "missing"],
      ["tub_clean", "manual", "valid"],
      ["quick", "ha", "new"],
    ],
  );
  assert.equal(syncEnumValues(next, ["standard", "quick"])[3].status, "valid");
});

test("N4 only offers selected HA entities that have no capability mapping", () => {
  const capabilities = [
    { capabilityId: "power", name: "电源" },
    { capabilityId: "status", name: "运行状态" },
  ];
  const selectedEntities = [
    { entityId: "switch.power", domain: "switch", name: "电源" },
    {
      entityId: "select.program",
      domain: "select",
      name: "模式",
      attributes: { options: ["standard", "quick"] },
    },
  ];
  const mappings = { power: { entityId: "switch.power", attribute: "state" } };
  const device = {
    entities: [
      ...selectedEntities,
      { entityId: "sensor.not_selected", domain: "sensor", name: "未选" },
    ],
  };
  assert.deepEqual(
    selectedDeviceEntities(device, {
      selectedEntityIds: selectedEntities.map((item) => item.entityId),
      capabilityBindings: { old: ["sensor.not_selected"] },
    }).map((item) => item.entityId),
    ["switch.power", "select.program"],
  );
  assert.deepEqual(
    selectedDeviceEntities(device, {
      selectedEntityIds: [],
      capabilityBindings: { old: ["sensor.not_selected"] },
    }),
    [],
  );
  assert.deepEqual(
    unboundCapabilities(capabilities, mappings).map(
      (item) => item.capabilityId,
    ),
    ["status"],
  );
  assert.deepEqual(
    unusedBoundEntities(selectedEntities, mappings).map(
      (item) => item.entityId,
    ),
    ["select.program"],
  );
  const suggested = capabilityFromEntity(selectedEntities[1], capabilities);
  assert.equal(suggested.capabilityId, "program");
  assert.equal(suggested.kind, "enum");
  assert.deepEqual(
    suggested.enumValues.map((item) => item.value),
    ["standard", "quick"],
  );
  assert.equal(
    capabilityFromEntity(selectedEntities[1], [...capabilities, suggested])
      .capabilityId,
    "program-2",
  );
  assert.deepEqual(
    unusedBoundEntities(selectedEntities, {
      ...mappings,
      status: { entityId: "select.program", attribute: "state" },
    }),
    [],
  );
});

test("N4 explicit mappings do not silently auto-bind an intentionally cleared ability", () => {
  const result = aggregateDeviceObjects({
    devices: [{ id: "ha-one", name: "设备" }],
    entities: [
      {
        entityId: "select.program",
        deviceId: "ha-one",
        domain: "select",
        state: "standard",
        attributes: { options: ["standard"] },
      },
    ],
    templates: [
      {
        id: "custom.project",
        enabled: true,
        capabilities: [
          { capabilityId: "program", kind: "enum", allowedDomains: ["select"] },
        ],
      },
    ],
    bindings: [
      {
        deviceId: "ha-one",
        deviceTemplateId: "custom.project",
        mappingMode: "explicit",
        capabilityBindings: {},
      },
    ],
  });
  assert.deepEqual(result[0].capabilityBindings, {});
});

test("N4 mapping diagnostics catch missing attributes, type mismatch and required gaps", () => {
  const capability = {
    capabilityId: "remaining_time",
    dataType: "number",
    required: true,
  };
  const device = {
    entities: [
      {
        entityId: "sensor.remaining",
        domain: "sensor",
        state: "12",
        attributes: { unit_of_measurement: "min" },
      },
    ],
  };
  assert.equal(
    mappingStatus(
      capability,
      { entityId: "sensor.remaining", attribute: "state" },
      device,
    ).id,
    "bound",
  );
  assert.equal(
    mappingStatus(
      capability,
      { entityId: "sensor.remaining", attribute: "missing" },
      device,
    ).id,
    "missing",
  );
  assert.equal(
    mappingStatus(
      { ...capability, dataType: "boolean" },
      { entityId: "sensor.remaining", attribute: "state" },
      device,
    ).id,
    "mismatch",
  );
  const offline = {
    entities: [{ ...device.entities[0], state: "unavailable" }],
  };
  assert.equal(
    mappingStatus(
      capability,
      { entityId: "sensor.remaining", attribute: "state" },
      offline,
    ).id,
    "unavailable",
  );
  assert.equal(
    capabilityStepState(
      [capability],
      { capabilityBindings: { remaining_time: ["sensor.remaining"] } },
      offline,
    ),
    "complete",
  );
  assert.equal(capabilityStepState([capability], null, device), "problem");
  const pending = { entities: [{ ...device.entities[0], state: "unknown" }] };
  assert.deepEqual(
    mappingStatus(
      capability,
      { entityId: "sensor.remaining", attribute: "state" },
      pending,
    ),
    {
      id: "pending",
      label: "已绑定 · 状态未知",
    },
  );
  assert.equal(
    capabilityStepState(
      [capability],
      { capabilityBindings: { remaining_time: ["sensor.remaining"] } },
      pending,
    ),
    "complete",
  );
  assert.equal(
    mappingStatus(
      capability,
      { entityId: "sensor.remaining", attribute: "state" },
      pending,
      { connected: false },
    ).label,
    "HA 离线",
  );
  assert.equal(
    capabilityMapping(
      { capabilityBindings: { remaining_time: ["sensor.remaining"] } },
      "remaining_time",
    ).entityId,
    "sensor.remaining",
  );
  const latest = applyBasicProjectDraft(
    {
      id: "custom.one",
      capabilities: [capability],
      modelTemplateId: "custom.model",
    },
    { name: " 新名称 ", category: "appliance" },
  );
  assert.deepEqual(latest.capabilities, [capability]);
  assert.equal(latest.modelTemplateId, "custom.model");
});

test("N4 capability API atomically saves mappings and requires dependency confirmation", async () => {
  const temporary = await mkdtemp(path.join(tmpdir(), "ha3d-n4-api-"));
  const app = Fastify();
  try {
    const store = await DevicePlatformStore.create(
      path.join(temporary, "data"),
      path.join(temporary, "assets"),
    );
    await store.upsertControlPanel({
      id: "custom.panel",
      name: "控制面板",
      deviceTemplateId: "custom.project",
      sections: [
        {
          title: "控制",
          controls: [
            {
              id: "power-control",
              type: "toggle",
              label: "电源",
              capabilityId: "power",
            },
          ],
        },
      ],
    });
    await store.upsertDeviceTemplate({
      id: "custom.project",
      name: "设备项目",
      controlPanelTemplateId: "custom.panel",
      capabilities: [
        {
          capabilityId: "power",
          name: "开关",
          kind: "toggle",
          dataType: "boolean",
          allowedDomains: ["switch"],
        },
      ],
    });
    await store.upsertBinding({
      deviceId: "device-1",
      deviceTemplateId: "custom.project",
      selectedEntityIds: ["switch.power", "select.program"],
      capabilityBindings: { power: ["switch.power"] },
    });
    let mockEntities = [
      {
        entityId: "switch.power",
        deviceId: "device-1",
        domain: "switch",
        state: "on",
        attributes: {},
      },
      {
        entityId: "select.program",
        deviceId: "device-1",
        domain: "select",
        state: "standard",
        attributes: { options: ["standard"] },
      },
    ];
    await registerDevicePlatformRoutes(app, store, {
      getDevices: () => [{ id: "device-1", name: "设备" }],
      getEntities: () => mockEntities,
    });
    const endpoint =
      "/api/device-platform/projects/custom.project/capabilities";
    const dependencies = await app.inject({
      method: "GET",
      url: `${endpoint}/dependencies/power`,
    });
    assert.equal(
      dependencies.statusCode,
      404,
      "dependency URL must use its dedicated route",
    );
    const dep = await app.inject({
      method: "GET",
      url: "/api/device-platform/projects/custom.project/capability-dependencies/power",
    });
    assert.equal(dep.statusCode, 200);
    assert.equal(dep.json().dependencies[0].page, "控制面板");
    const capabilities = [
      {
        capabilityId: "power",
        name: "电源",
        kind: "toggle",
        dataType: "boolean",
        group: "core",
        required: true,
        allowedDomains: ["switch"],
      },
      {
        capabilityId: "program",
        name: "模式选择",
        kind: "enum",
        dataType: "enum",
        group: "core",
        required: false,
        allowedDomains: ["select"],
        enumValues: [
          { label: "标准", value: "standard", source: "ha", status: "valid" },
        ],
      },
    ];
    const mappings = {
      power: { entityId: "switch.power", attribute: "state" },
      program: { entityId: "select.program", attribute: "state" },
    };
    const saved = await app.inject({
      method: "PUT",
      url: endpoint,
      payload: { capabilities, mappings },
    });
    assert.equal(saved.statusCode, 200);
    assert.equal(saved.json().binding.mappingMode, "explicit");
    assert.equal(
      saved.json().binding.capabilityMappings.program.entityId,
      "select.program",
    );
    assert.deepEqual(saved.json().binding.capabilityBindings.program, [
      "select.program",
    ]);
    assert.equal(
      store.getDeviceTemplates().find((item) => item.id === "custom.project")
        .capabilities[1].enumValues[0].source,
      "ha",
    );
    const validation = await app.inject({
      method: "GET",
      url: "/api/device-platform/projects/custom.project/capability-validation",
    });
    assert.equal(validation.statusCode, 200);
    assert.equal(validation.json().publishBlocked, false);
    mockEntities = mockEntities.map((entity) =>
      entity.entityId === "switch.power"
        ? { ...entity, domain: "sensor", state: "12" }
        : entity,
    );
    const mismatch = await app.inject({
      method: "GET",
      url: "/api/device-platform/projects/custom.project/capability-validation",
    });
    assert.equal(mismatch.json().publishBlocked, true);
    assert.match(mismatch.json().issues[0].reason, /类型不匹配/);
    mockEntities = mockEntities.map((entity) =>
      entity.entityId === "switch.power"
        ? { ...entity, domain: "switch", state: "on" }
        : entity,
    );
    const invalid = await app.inject({
      method: "PUT",
      url: endpoint,
      payload: {
        capabilities,
        mappings: {
          power: { entityId: "switch.not_selected", attribute: "state" },
        },
      },
    });
    assert.equal(invalid.statusCode, 400);
    assert.equal(
      store.getBindings().find((item) => item.deviceId === "device-1")
        .capabilityMappings.power.entityId,
      "switch.power",
    );
    const incompatible = capabilities.map((item) =>
      item.capabilityId === "power" ? { ...item, dataType: "number" } : item,
    );
    const typeRejected = await app.inject({
      method: "PUT",
      url: endpoint,
      payload: { capabilities: incompatible, mappings },
    });
    assert.equal(typeRejected.statusCode, 400);
    const typeConfirmed = await app.inject({
      method: "PUT",
      url: endpoint,
      payload: {
        capabilities: incompatible,
        mappings,
        acknowledgedCapabilityIds: ["power"],
      },
    });
    assert.equal(typeConfirmed.statusCode, 200);
    assert.equal(typeConfirmed.json().item.capabilities[0].dataType, "number");
    const restored = await app.inject({
      method: "PUT",
      url: endpoint,
      payload: { capabilities, mappings },
    });
    assert.equal(restored.statusCode, 200);
    const rejected = await app.inject({
      method: "PUT",
      url: endpoint,
      payload: {
        capabilities: capabilities.slice(1),
        mappings: { program: mappings.program },
      },
    });
    assert.equal(rejected.statusCode, 400);
    assert.match(rejected.json().error, /需确认依赖影响/);
    const confirmed = await app.inject({
      method: "PUT",
      url: endpoint,
      payload: {
        capabilities: capabilities.slice(1),
        mappings: { program: mappings.program },
        acknowledgedCapabilityIds: ["power"],
      },
    });
    assert.equal(confirmed.statusCode, 200);
    assert.equal(confirmed.json().item.capabilities.length, 1);
    assert.equal(
      store.getControlPanels().find((item) => item.id === "custom.panel")
        .sections[0].controls[0].capabilityId,
      "power",
      "dependent control remains for explicit repair",
    );
    const dangling = await app.inject({
      method: "GET",
      url: "/api/device-platform/projects/custom.project/capability-validation",
    });
    assert.equal(dangling.json().publishBlocked, true);
    assert.equal(dangling.json().issues[0].reason, "引用能力已删除");
  } finally {
    await app.close();
    await rm(temporary, { recursive: true, force: true });
  }
});
