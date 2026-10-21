import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import Fastify from "fastify";
import {
  addRuleToken,
  defaultSelectedEntityIds,
  entityTypeLabel,
  recordedEntityIds,
  PROJECT_STEPS,
  rankProjectCandidates,
  resolveProjectConnection,
} from "../apps/web/src/app/device-development-center/project-basic.js";
import { normalizeDeviceTemplate } from "../apps/server/src/device-platform/devicePlatformSchema.js";
import { DevicePlatformStore } from "../apps/server/src/device-platform/DevicePlatformStore.js";
import { registerDevicePlatformRoutes } from "../apps/server/src/routes/devicePlatformRoutes.js";
import { buildCustomDeviceProjects } from "../apps/web/src/app/device-development-center/project-home.js";

const devices = [
  {
    id: "ha-one",
    name: "波轮洗衣机",
    manufacturer: "Midea",
    model: "TB12",
    entities: [
      {
        entityId: "switch.washer",
        state: "on",
        domain: "switch",
        registryId: "reg-one",
      },
    ],
  },
  {
    id: "ha-two",
    name: "客厅灯",
    manufacturer: "Yeelight",
    model: "YL1",
    entities: [
      {
        entityId: "light.living",
        state: "on",
        domain: "light",
        registryId: "reg-two",
      },
    ],
  },
];

test("old center-only API routes are removed while project data routes remain", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "ha3d-single-center-"));
  const app = Fastify();
  try {
    const store = await DevicePlatformStore.create(directory, path.join(directory, "assets"));
    await registerDevicePlatformRoutes(app, store, { getDevices: async () => [] });
    assert.equal((await app.inject({ method: "GET", url: "/api/device-platform" })).statusCode, 200);
    assert.equal((await app.inject({ method: "POST", url: "/api/device-platform/clone", payload: {} })).statusCode, 404);
    assert.equal((await app.inject({ method: "GET", url: "/api/device-platform/export" })).statusCode, 404);
    assert.equal((await app.inject({ method: "PUT", url: "/api/device-platform/control-panels/custom.test", payload: {} })).statusCode, 404);
    assert.equal((await app.inject({ method: "PUT", url: "/api/device-platform/bindings/test", payload: {} })).statusCode, 404);
    assert.equal((await app.inject({ method: "DELETE", url: "/api/device-platform/bindings/test" })).statusCode, 404);
  } finally {
    await app.close();
    await rm(directory, { recursive: true, force: true });
  }
});

test("N3 has seven steps and rule edits only alter candidate scan input", () => {
  assert.equal(PROJECT_STEPS.length, 7);
  assert.deepEqual(addRuleToken(["Midea"], "midea"), ["Midea"]);
  const oldRules = { manufacturers: ["Midea"] };
  const newRules = { manufacturers: ["Yeelight"] };
  assert.deepEqual(
    rankProjectCandidates(devices, oldRules, "ha-one").map((item) => item.id),
    ["ha-one"],
  );
  assert.deepEqual(
    rankProjectCandidates(devices, newRules, "ha-one").map((item) => item.id),
    ["ha-one", "ha-two"],
  );
  assert.deepEqual(defaultSelectedEntityIds(devices[0], null), []);
  const normalized = normalizeDeviceTemplate({
    id: "custom.project",
    name: "项目",
    category: "appliance",
    subCategory: "洗衣机",
    manufacturer: "Midea",
    model: "TB12",
  });
  assert.equal(normalized.subCategory, "洗衣机");
  assert.equal(normalized.manufacturer, "Midea");
  assert.equal(normalized.model, "TB12");
});

test("N3 restores only persisted entity selections or legacy capability mappings", () => {
  const device = {
    entities: [
      { entityId: "sensor.one" },
      { entityId: "sensor.two" },
      { entityId: "sensor.three" },
      { entityId: "sensor.four" },
    ],
  };
  const legacy = {
    capabilityBindings: {
      temperature: ["sensor.one"],
      humidity: ["sensor.three"],
    },
  };
  assert.deepEqual(recordedEntityIds(legacy), ["sensor.one", "sensor.three"]);
  assert.deepEqual(defaultSelectedEntityIds(device, legacy), [
    "sensor.one",
    "sensor.three",
  ]);
  assert.deepEqual(
    defaultSelectedEntityIds(device, {
      ...legacy,
      selectedEntityIds: ["sensor.two"],
    }),
    ["sensor.two"],
  );
  assert.deepEqual(defaultSelectedEntityIds(device, null), []);
  assert.equal(entityTypeLabel("binary_sensor"), "二值传感器");
  assert.equal(entityTypeLabel("sensor"), "传感器");
});

test("N3 distinguishes missing HA devices from temporary offline devices", () => {
  const binding = { deviceId: "ha-one" };
  assert.equal(
    resolveProjectConnection(null, devices, { connected: true }).id,
    "unbound",
  );
  assert.equal(
    resolveProjectConnection(binding, [], { connected: true }).id,
    "missing",
  );
  assert.equal(
    resolveProjectConnection(binding, [], { connected: false }).id,
    "offline",
  );
  assert.equal(
    resolveProjectConnection(binding, [{ ...devices[0], historical: true }], {
      connected: true,
    }).id,
    "missing",
  );
  assert.equal(
    resolveProjectConnection(binding, devices, { connected: false }).id,
    "offline",
  );
  assert.equal(
    resolveProjectConnection(binding, devices, { connected: true }).id,
    "online",
  );
});

test("N3 project cards count explicitly selected entities before capability mapping", () => {
  const projects = buildCustomDeviceProjects(
    {
      deviceTemplates: [{ id: "custom.project", name: "项目", builtin: false }],
      modelTemplates: [],
      controlPanels: [],
      bindings: [
        {
          deviceId: "ha-one",
          deviceTemplateId: "custom.project",
          selectedEntityIds: ["switch.washer"],
          capabilityBindings: {},
        },
      ],
    },
    devices,
  );
  assert.deepEqual(projects[0].entityIds, ["switch.washer"]);
});

test("N3 binding API changes devices only after explicit request and tracks registry-stable entity rename", async () => {
  const temporary = await mkdtemp(path.join(tmpdir(), "ha3d-n3-api-"));
  const app = Fastify();
  try {
    const store = await DevicePlatformStore.create(
      path.join(temporary, "data"),
      path.join(temporary, "assets"),
    );
    await store.upsertDeviceTemplate({
      id: "custom.n3-project",
      name: "洗衣机",
      matchRules: { manufacturers: ["Midea"] },
    });
    await registerDevicePlatformRoutes(app, store, {
      getDevices: () => devices.map(({ entities, ...device }) => device),
      getEntities: () =>
        devices.flatMap((device) =>
          device.entities.map((entity) => ({
            ...entity,
            deviceId: device.id,
            name: entity.entityId,
          })),
        ),
    });
    await store.upsertDeviceTemplate({
      id: "custom.n3-project",
      name: "洗衣机",
      matchRules: { manufacturers: ["Yeelight"] },
    });
    assert.equal(
      store.getBindings().length,
      0,
      "changing rules must not create a binding",
    );
    const first = await app.inject({
      method: "POST",
      url: "/api/device-platform/projects/custom.n3-project/rebind",
      payload: { deviceId: "ha-one", selectedEntityIds: ["switch.washer"] },
    });
    assert.equal(first.statusCode, 200);
    assert.equal(
      first.json().binding.entityRegistryRefs[0].registryId,
      "reg-one",
    );
    await store.upsertDeviceTemplate({
      id: "custom.n3-other",
      name: "另一个项目",
    });
    const occupied = await app.inject({
      method: "POST",
      url: "/api/device-platform/projects/custom.n3-other/rebind",
      payload: { deviceId: "ha-one", selectedEntityIds: ["switch.washer"] },
    });
    assert.equal(occupied.statusCode, 400);
    assert.match(occupied.json().error, /已绑定到其他设备项目/);
    await store.upsertBinding({
      deviceId: "ha-one",
      deviceTemplateId: "custom.n3-project",
      capabilityBindings: { power: ["switch.washer"] },
    });
    assert.equal(
      await store.reconcileEntityRegistry([
        { id: "reg-one", entity_id: "switch.washer_renamed" },
      ]),
      1,
    );
    const renamed = store.getBindings()[0];
    assert.deepEqual(renamed.selectedEntityIds, ["switch.washer_renamed"]);
    assert.deepEqual(renamed.capabilityBindings.power, [
      "switch.washer_renamed",
    ]);
    const badEntity = await app.inject({
      method: "POST",
      url: "/api/device-platform/projects/custom.n3-project/rebind",
      payload: { deviceId: "ha-two", selectedEntityIds: ["switch.washer"] },
    });
    assert.equal(badEntity.statusCode, 400);
    assert.equal(store.getBindings()[0].deviceId, "ha-one");
    const second = await app.inject({
      method: "POST",
      url: "/api/device-platform/projects/custom.n3-project/rebind",
      payload: { deviceId: "ha-two", selectedEntityIds: ["light.living"] },
    });
    assert.equal(second.statusCode, 200);
    assert.deepEqual(second.json().removedDeviceIds, ["ha-one"]);
    assert.equal(store.getBindings().length, 1);
    assert.equal(store.getBindings()[0].deviceId, "ha-two");
  } finally {
    await app.close();
    await rm(temporary, { recursive: true, force: true });
  }
});
