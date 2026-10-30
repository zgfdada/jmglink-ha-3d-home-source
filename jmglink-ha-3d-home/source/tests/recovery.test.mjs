import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import * as THREE from "three";

import {
  CABINET_FURNITURE_KINDS,
  isCabinetFurniture,
  normalizeFurnitureElevation,
} from "../apps/web/src/domain/furniture.js";
import {
  normalizeVanityMirrorCabinet,
  VANITY_MIRROR_DEFAULTS,
} from "../packages/schema/src/vanity-mirror-cabinet.js";
import { translateFurnitureFromPointer } from "../apps/web/src/domain/furniture-pointer.js";
import {
  isWallTranslationHandleHit,
  wallEndpointHitRadius,
} from "../apps/web/src/domain/wall-handle-hit.js";
import { resizeFloorHeight } from "../apps/web/src/domain/floor-height.js";
import {
  buildDeviceLibrary,
  resolveDeviceLibraryAreaId,
} from "../apps/web/src/domain/device-library.js";
import { resolveWasherRuntime, washerRuntimeLabel, washerRuntimeTitle } from "../apps/web/src/domain/washer-runtime.js";
import { collectLiveEntityIds } from "../apps/server/src/ha/boundEntityFilter.js";

import {
  diamondShowerOutline,
  normalizeShowerCornerCut,
  pointInShowerOutline,
  showerEnclosureOutline,
  showerGlassSegments,
} from "../apps/web/src/domain/bathroom-fixtures.js";
import {
  cabinetFrontDepth,
  cabinetLayoutBounds,
  createCabinetSegments,
  createSegmentedCabinetConnectorPanels,
  createSegmentedCabinetShelfLayout,
  findCabinetSegmentRelations,
  mergeCollinearCabinetSegments,
  moveCabinetJunction,
  normalizeCabinetDoorCount,
  normalizeCabinetUpperDepth,
  normalizeSegmentedCabinetHeights,
  resizeCabinetDepthFromBack,
  segmentedCabinetDisplaySize,
  setCabinetDoorFront,
  snapCabinetJunctionToRelations,
  splitCabinetSegment,
  translateCabinetSegment,
} from "../apps/web/src/domain/cabinet-layout.js";
import {
  bindVerticalReference,
  isVerticalReferenceCandidate,
  rebaseVerticalReference,
  resolveFloorVerticalElevations,
} from "../apps/web/src/domain/vertical-reference.js";
import {
  deriveRoomsFromWalls,
  normalizeFloorplanProject,
  normalizeFurniture,
  validateFloorplanProject,
} from "../packages/schema/src/index.js";
import {
  clampOpeningsToWalls,
  getCollinearWallChain,
  mergeWallChain,
  straightenWallChain,
  transformCollinearWallChain,
} from "../apps/web/src/domain/wall-straightening.js";
import {
  alignDevicesOnLine,
  distributeDevicesEvenly,
  inspectDeviceLine,
} from "../apps/web/src/domain/device-arrangement.js";
import {
  createControlRadioGroupName,
  CUSTOM_DEVICE_FILTER,
  isCustomDeviceEntity,
  mergeEntityActionResult,
  resolveDeviceDisplayName,
  resolveBoundDevicePresentation,
  resolveDeviceModelFootprint,
  resolveLiveDeviceModel,
  resolveStableEntityOptions,
  resolveStableEntitySelection,
} from "../apps/web/src/domain/device-platform-presentation.js";
import {
  filterDevicesByTemplateRules,
  matchesDeviceTemplateRules,
} from "../apps/web/src/domain/device-template-matching.js";
import { parseModelTemplateJson } from "../apps/web/src/domain/model-template-import.js";
import { inspectGltfModelParameters } from "../apps/web/src/domain/model-file-parameters.js";
import {
  snapCreationPointToAlignment,
  snapPointToAlignment,
  snapTranslationToAlignment,
} from "../apps/web/src/domain/alignment-guides.js";
import {
  isVirtualWall,
  pointAlongWall,
  splitWallSegment,
} from "../apps/web/src/domain/walls.js";
import {
  createEntityPlaceholder,
  developmentDevices,
  developmentEntities,
  EntityHistoryStore,
} from "../apps/server/src/ha/EntityHistoryStore.js";
import { DevicePlatformStore } from "../apps/server/src/device-platform/DevicePlatformStore.js";
import {
  aggregateDeviceObjects,
  selectOperationalStateEntityId,
} from "../apps/server/src/device-platform/deviceAggregation.js";

import {
  builtinDeviceTemplates,
  normalizeDeviceTemplate,
  normalizeModelTemplate,
  normalizePanelControl,
  starterCustomModelTemplates,
} from "../apps/server/src/device-platform/devicePlatformSchema.js";
import { loadRuntimeConfig } from "../apps/server/src/config/runtime.js";
import {
  COMPLETE_BACKUP_FORMAT,
  createCompleteBackup,
  importProjectPayload,
  parseProjectImport,
} from "../apps/server/src/routes/projectRoutes.js";

test("select controls support dropdown and tiled radio presentation", () => {
  assert.equal(
    normalizePanelControl({ type: "select", selectStyle: "radio" }).selectStyle,
    "radio",
  );
  assert.equal(
    normalizePanelControl({ type: "select", selectStyle: "unsupported" })
      .selectStyle,
    "dropdown",
  );
  assert.equal(
    normalizePanelControl({ type: "status", selectStyle: "radio" }).selectStyle,
    undefined,
  );
});

test("entity action updates preserve custom device presentation metadata", () => {
  const current = {
    entityId: "switch.washer_power",
    state: "off",
    attributes: { friendly_name: "洗衣机电源" },
    deviceId: "washer-device",
    deviceControlPanelId: "custom.washer-panel",
    deviceCapabilityBindings: { power: ["switch.washer_power"] },
  };
  const updated = {
    entityId: "switch.washer_power",
    state: "on",
    attributes: { friendly_name: "洗衣机电源" },
  };
  assert.deepEqual(mergeEntityActionResult(current, updated), {
    ...current,
    ...updated,
  });
});

test("select options keep the entity-declared order after a selection", () => {
  assert.deepEqual(
    resolveStableEntityOptions({
      state: "强洗",
      attributes: { options: ["标准", "速洗", "家纺", "强洗"] },
    }),
    ["标准", "速洗", "家纺", "强洗"],
  );
  assert.deepEqual(
    resolveStableEntityOptions({
      state: "桶自洁",
      attributes: { options: ["标准", "速洗", "标准"] },
    }),
    ["标准", "速洗", "桶自洁"],
  );
});

test("select controls keep the last valid highlight through transient states", () => {
  const options = ["标准", "速洗", "桶自洁"];
  assert.equal(
    resolveStableEntitySelection(
      { state: "桶自洁", attributes: { options } },
      "标准",
    ),
    "桶自洁",
  );
  assert.equal(
    resolveStableEntitySelection(
      { state: "unknown", attributes: { options } },
      "桶自洁",
    ),
    "桶自洁",
  );
  assert.equal(
    resolveStableEntitySelection(
      { state: "unavailable", attributes: { options } },
      "速洗",
    ),
    "速洗",
  );
  assert.equal(
    resolveStableEntitySelection(
      { state: "标准", attributes: { options } },
      "桶自洁",
    ),
    "标准",
  );
});

test("duplicate device panels use independent radio groups", () => {
  const compactPanel = createControlRadioGroupName(
    "washer-device",
    "program-control",
    ":r1:",
  );
  const desktopPanel = createControlRadioGroupName(
    "washer-device",
    "program-control",
    ":r2:",
  );
  assert.notEqual(compactPanel, desktopPanel);
  assert.match(compactPanel, /washer-device-program-control/);
});

test("complete project backups include and restore the global device platform", async () => {
  const project = {
    id: "project-current",
    name: "完整备份测试",
    createdAt: "2026-09-01T00:00:00.000Z",
    floors: [],
  };
  const devicePlatform = {
    format: "ha3d-device-platform",
    version: 1,
    deviceTemplates: [{ id: "custom.washer" }],
    modelTemplates: [{ id: "custom.washer-model" }],
    controlPanels: [{ id: "custom.washer-panel" }],
    bindings: [{ deviceId: "washer" }],
    suppressedBuiltinIds: ["device:builtin.generic"],
    assets: [
      { modelTemplateId: "custom.washer-model", dataBase64: "Z2xURg==" },
    ],
  };
  const bundle = createCompleteBackup(project, devicePlatform);
  assert.equal(bundle.format, COMPLETE_BACKUP_FORMAT);
  assert.equal(bundle.version, 1);
  assert.deepEqual(parseProjectImport(bundle), { project, devicePlatform });

  const calls = [];
  const platform = {
    async exportBundle() {
      return { format: "ha3d-device-platform", version: 1, assets: [] };
    },
    async importBundle(value) {
      calls.push(["platform", value]);
    },
  };
  const store = {
    async saveProject(value) {
      calls.push(["project", value]);
      return value;
    },
  };
  const current = {
    id: "project-current",
    createdAt: "2026-08-01T00:00:00.000Z",
  };
  const restored = await importProjectPayload(store, platform, current, bundle);
  assert.equal(calls[0][0], "platform");
  assert.equal(calls[1][0], "project");
  assert.equal(restored.id, current.id);
  assert.equal(restored.createdAt, current.createdAt);
});

test("legacy project JSON remains importable without replacing device platform data", async () => {
  const legacyProject = { id: "old-id", name: "旧项目", floors: [] };
  assert.deepEqual(parseProjectImport(legacyProject), {
    project: legacyProject,
    devicePlatform: undefined,
  });
  let platformTouched = false;
  const restored = await importProjectPayload(
    {
      async saveProject(value) {
        return value;
      },
    },
    {
      async exportBundle() {
        platformTouched = true;
      },
      async importBundle() {
        platformTouched = true;
      },
    },
    { id: "current-id", createdAt: "created" },
    legacyProject,
  );
  assert.equal(platformTouched, false);
  assert.equal(restored.id, "current-id");
});

test("failed complete project restore rolls the device platform back", async () => {
  const previousPlatform = {
    format: "ha3d-device-platform",
    version: 1,
    assets: [],
  };
  const nextPlatform = {
    format: "ha3d-device-platform",
    version: 1,
    deviceTemplates: [{ id: "custom.next" }],
    assets: [],
  };
  const importedBundles = [];
  await assert.rejects(
    importProjectPayload(
      {
        async saveProject() {
          throw new Error("project validation failed");
        },
      },
      {
        async exportBundle() {
          return previousPlatform;
        },
        async importBundle(value) {
          importedBundles.push(value);
        },
      },
      { id: "current-id", createdAt: "created" },
      createCompleteBackup({ id: "backup-id", name: "损坏项目" }, nextPlatform),
    ),
    /project validation failed/,
  );
  assert.deepEqual(importedBundles, [nextPlatform, previousPlatform]);
});











test("project entity ids become clearly marked offline history placeholders", () => {
  const entity = createEntityPlaceholder("light.kitchen_ceiling");
  assert.equal(entity.entityId, "light.kitchen_ceiling");
  assert.equal(entity.domain, "light");
  assert.equal(entity.state, "unavailable");
  assert.equal(entity.historical, true);
  assert.equal(entity.attributes.ha3d_historical, true);
  assert.equal(createEntityPlaceholder("invalid entity"), undefined);
});

test("local development catalog exposes a bindable washing machine", () => {
  const entities = developmentEntities();
  assert.equal(entities.length, 13);
  assert.equal(entities[0].entityId, "switch.dev_washing_machine_power");
  assert.equal(new Set(entities.map((entity) => entity.deviceId)).size, 1);
  assert.deepEqual(
    [...new Set(entities.map((entity) => entity.domain))].sort(),
    ["binary_sensor", "button", "number", "select", "sensor", "switch"],
  );
  assert.equal(
    entities.every((entity) => entity.attributes.ha3d_development === true),
    true,
  );
  assert.equal(developmentDevices()[0].id, entities[0].deviceId);
});

test("washing machine device aggregates all entities into one configured object", () => {
  const entities = developmentEntities();
  const devices = aggregateDeviceObjects({
    devices: developmentDevices(),
    entities,
    templates: builtinDeviceTemplates(),
    bindings: [],
  });
  assert.equal(devices.length, 1);
  assert.equal(devices[0].deviceTemplateId, "builtin.washing-machine");
  assert.equal(devices[0].entityIds.length, 13);
  assert.deepEqual(devices[0].capabilityBindings.power, [
    "switch.dev_washing_machine_power",
  ]);
  assert.deepEqual(devices[0].capabilityBindings.program, [
    "select.dev_washing_machine_program",
  ]);
  assert.deepEqual(devices[0].capabilityBindings.start, [
    "button.dev_washing_machine_start",
  ]);
  assert.equal(devices[0].development, true);
});

test("bound device entities lock their configured device type and model", () => {
  const entity = {
    entityId: "switch.washer",
    deviceTemplateId: "custom.washer",
    deviceTemplateName: "滚筒洗衣机",
    deviceModel: {
      id: "custom.washer-model",
      name: "洗衣机模型",
      enabled: true,
      source: { type: "procedural", shape: "washing-machine" },
      dimensions: { width: 0.6, depth: 0.65, height: 0.85 },
    },
  };
  const presentation = resolveBoundDevicePresentation(
    entity,
    "switch.washing_machine",
  );
  assert.equal(presentation.locked, true);
  assert.equal(presentation.templateName, "滚筒洗衣机");
  assert.equal(presentation.modelId, "switch.washing_machine");
  assert.equal(presentation.customModel.dimensions.width, 0.6);
  entity.deviceModel.dimensions.width = 1.2;
  assert.equal(presentation.customModel.dimensions.width, 0.6);
});

test("partial binding updates preserve the selected model and control panel", async () => {
  const directory = await mkdtemp(
    path.join(os.tmpdir(), "ha3d-binding-merge-"),
  );
  try {
    const store = await DevicePlatformStore.create(
      directory,
      path.join(directory, "assets"),
    );
    await store.upsertBinding({
      deviceId: "washer-1",
      deviceTemplateId: "builtin.washing-machine",
      modelTemplateId: "builtin.washing-machine",
      controlPanelTemplateId: "builtin.washing-machine",
      capabilityBindings: { power: ["switch.washer_power"] },
    });
    await store.upsertBinding({
      deviceId: "washer-1",
      deviceTemplateId: "builtin.washing-machine",
      capabilityBindings: { power: ["switch.washer_power"] },
    });
    const binding = store.getBindings()[0];
    assert.equal(binding.modelTemplateId, "builtin.washing-machine");
    assert.equal(binding.controlPanelTemplateId, "builtin.washing-machine");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("legacy bindings recover the unique model and panel associated with their template", async () => {
  const directory = await mkdtemp(
    path.join(os.tmpdir(), "ha3d-binding-references-"),
  );
  const collection = (items) =>
    JSON.stringify({ version: 1, updatedAt: new Date().toISOString(), items });
  try {
    await writeFile(
      path.join(directory, "device-templates.json"),
      collection([
        {
          id: "custom.top-loader",
          name: "顶开式洗衣机",
          category: "custom",
          capabilities: [],
        },
      ]),
    );
    await writeFile(
      path.join(directory, "model-templates.json"),
      collection([
        {
          id: "custom.top-loader-model",
          name: "顶开式洗衣机模型",
          deviceTemplateId: "custom.top-loader",
          source: { type: "procedural", shape: "washing-machine" },
        },
      ]),
    );
    await writeFile(
      path.join(directory, "control-panel-templates.json"),
      collection([
        {
          id: "custom.top-loader-panel",
          name: "顶开式洗衣机面板",
          deviceTemplateId: "custom.top-loader",
          sections: [],
        },
      ]),
    );
    await writeFile(
      path.join(directory, "device-bindings.json"),
      collection([
        {
          deviceId: "ha-washer-1",
          deviceTemplateId: "custom.top-loader",
          capabilityBindings: {},
        },
      ]),
    );

    const store = await DevicePlatformStore.create(
      directory,
      path.join(directory, "assets"),
    );
    const binding = store.getBindings()[0];
    assert.equal(binding.modelTemplateId, "custom.top-loader-model");
    assert.equal(binding.controlPanelTemplateId, "custom.top-loader-panel");

    const persisted = JSON.parse(
      await readFile(path.join(directory, "device-bindings.json"), "utf8"),
    );
    assert.equal(persisted.items[0].modelTemplateId, "custom.top-loader-model");
    assert.equal(
      persisted.items[0].controlPanelTemplateId,
      "custom.top-loader-panel",
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("incomplete binding saves infer unique associated resources immediately", async () => {
  const directory = await mkdtemp(
    path.join(os.tmpdir(), "ha3d-binding-save-defaults-"),
  );
  try {
    const store = await DevicePlatformStore.create(
      directory,
      path.join(directory, "assets"),
    );
    await store.upsertDeviceTemplate({
      id: "custom.top-loader",
      name: "顶开式洗衣机",
      capabilities: [],
    });
    await store.upsertModelTemplate({
      id: "custom.top-loader-model",
      name: "顶开式洗衣机模型",
      deviceTemplateId: "custom.top-loader",
      source: { type: "procedural", shape: "washing-machine" },
    });
    await store.upsertControlPanel({
      id: "custom.top-loader-panel",
      name: "顶开式洗衣机面板",
      deviceTemplateId: "custom.top-loader",
      sections: [],
    });
    const binding = await store.upsertBinding({
      deviceId: "ha-washer-1",
      deviceTemplateId: "custom.top-loader",
      capabilityBindings: {},
    });
    assert.equal(binding.modelTemplateId, "custom.top-loader-model");
    assert.equal(binding.controlPanelTemplateId, "custom.top-loader-panel");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("custom device templates expose a dedicated device-library type", () => {
  assert.equal(CUSTOM_DEVICE_FILTER, "custom_device");
  assert.equal(
    isCustomDeviceEntity({ deviceTemplateId: "custom.washing-machine" }),
    true,
  );
  assert.equal(
    isCustomDeviceEntity({ deviceTemplateId: "builtin.washing-machine" }),
    false,
  );
  assert.equal(isCustomDeviceEntity({ domain: "switch" }), false);
});

test("template reference devices can be filtered by the current match rules", () => {
  const devices = [
    {
      id: "washer",
      name: "波轮洗衣机",
      manufacturer: "Midea",
      model: "TB12U2",
      entities: [
        {
          entityId: "sensor.washer_status",
          name: "运行状态",
          domain: "sensor",
          integration: "midea_ac_lan",
          attributes: { device_class: "enum" },
        },
      ],
    },
    {
      id: "tracker",
      name: "2312DRA50C",
      manufacturer: "Xiaomi",
      model: "2312DRA50C",
      entities: [],
    },
  ];
  const rules = {
    names: ["洗衣机"],
    manufacturers: ["Midea"],
    models: ["TB12U2"],
    integrations: ["midea_ac_lan"],
    entityDomains: ["sensor"],
  };
  assert.equal(matchesDeviceTemplateRules(devices[0], rules), true);
  assert.deepEqual(
    filterDevicesByTemplateRules(devices, rules).map((device) => device.id),
    ["washer"],
  );
});

test("device summaries prefer the first mapped status capability", () => {
  const template = {
    capabilities: [
      { capabilityId: "power", kind: "toggle" },
      { capabilityId: "running", kind: "status", name: "运行状态" },
      { capabilityId: "fault", kind: "status", name: "故障" },
    ],
  };
  assert.equal(
    selectOperationalStateEntityId(template, {
      power: ["switch.washer"],
      running: ["sensor.washer_running"],
      fault: ["sensor.washer_fault"],
    }),
    "sensor.washer_running",
  );
});

test("bound entities use their HA device name instead of a representative entity name", () => {
  const entity = {
    entityId: "switch.washer_power",
    deviceId: "washer-1",
    name: "洗衣机 电源",
  };
  assert.equal(
    resolveDeviceDisplayName(entity, [{ id: "washer-1", name: "波轮洗衣机" }]),
    "波轮洗衣机",
  );
  assert.equal(resolveDeviceDisplayName(entity, []), "洗衣机 电源");
});

test("2D custom-model footprints follow the live 3D model dimensions, anchor and scale", () => {
  const placedDevice = {
    scale: [2, 1, 0.5],
    customModel: {
      source: { type: "procedural", shape: "washing-machine" },
      dimensions: { width: 0.5, depth: 0.4, height: 0.8 },
    },
  };
  const entity = {
    deviceModel: {
      source: { type: "procedural", shape: "washing-machine" },
      dimensions: { width: 0.6, depth: 0.8, height: 0.9 },
      scale: 1.5,
      anchor: { x: 0.2, y: 0, z: -0.1 },
    },
  };
  assert.equal(
    resolveLiveDeviceModel(entity, placedDevice),
    entity.deviceModel,
  );
  const footprint = resolveDeviceModelFootprint(entity, placedDevice);
  assert.ok(Math.abs(footprint.width - 1.8) < 1e-9);
  assert.ok(Math.abs(footprint.depth - 0.6) < 1e-9);
  assert.equal(footprint.x, 0.4);
  assert.equal(footprint.y, -0.05);
  assert.equal(footprint.model, entity.deviceModel);
});

test("floorplans preserve per-device rotation for procedural custom models", () => {
  const project = normalizeFloorplanProject({
    id: "procedural-model",
    name: "程序化模型",
    floors: [
      {
        id: "floor-1",
        name: "一层",
        walls: [],
        rooms: [],
        openings: [],
        furniture: [],
        devices: [
          {
            id: "washer",
            entityId: "switch.washer",
            deviceId: "ha-washer",
            deviceTemplateId: "custom.washer",
            position: [0, 0, 0],
            rotation: [0, -Math.PI / 2, 0],
            customModel: {
              id: "custom.washer-model",
              name: "洗衣机模型",
              source: { type: "procedural", shape: "washing-machine" },
              dimensions: { width: 0.6, depth: 0.65, height: 0.85 },
              rotation: { x: 15, y: 90, z: -10 },
              anchor: { x: 0.1, y: 0.2, z: -0.1 },
              placement: "floor",
              elevation: 0.05,
              color: "#eef2f5",
            },
          },
        ],
      },
    ],
  });
  const device = project.floors[0].devices[0];
  const model = device.customModel;
  assert.equal(model.source.shape, "washing-machine");
  assert.deepEqual(device.rotation, [0, -Math.PI / 2, 0]);
  assert.equal(model.rotation, undefined);
  assert.deepEqual(model.anchor, { x: 0.1, y: 0.2, z: -0.1 });
});

test("global device platform persists custom washer templates and exports uploaded GLB", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "ha3d-platform-"));
  const assetDir = path.join(directory, "assets");
  try {
    const store = await DevicePlatformStore.create(directory, assetDir);
    const clone = await store.upsertDeviceTemplate({
      ...store.getDeviceTemplates().find((item) => item.id === "builtin.washing-machine"),
      id: "custom.my-washer",
      name: "我的洗衣机",
      builtin: false,
    });
    assert.equal(clone.builtin, false);
    await store.upsertModelTemplate(
      {
        id: "custom.my-washer-model",
        name: "洗衣机 GLB",
        deviceTemplateId: clone.id,
        source: { type: "upload" },
        dimensions: { width: 0.62, depth: 0.68, height: 0.86 },
      },
      {
        name: "washer.glb",
        dataUrl: `data:model/gltf-binary;base64,${Buffer.from("glTF\u0002\u0000\u0000\u0000").toString("base64")}`,
      },
    );
    await store.upsertBinding({
      deviceId: "ha3d-development-washing-machine",
      deviceTemplateId: clone.id,
      modelTemplateId: "custom.my-washer-model",
      controlPanelTemplateId: "builtin.washing-machine",
      capabilityBindings: {
        power: "switch.dev_washing_machine_power",
        program: ["select.dev_washing_machine_program"],
      },
    });
    const reloaded = await DevicePlatformStore.create(directory, assetDir);
    assert.equal(
      reloaded.getDeviceTemplates().some((item) => item.id === clone.id),
      true,
    );
    assert.equal(
      reloaded.getBindings()[0].modelTemplateId,
      "custom.my-washer-model",
    );
    const exported = await reloaded.exportBundle();
    assert.equal(exported.global, true);
    assert.equal(exported.assets.length, 1);
    assert.equal(exported.assets[0].dataBase64.length > 0, true);
    const importedDirectory = path.join(directory, "imported");
    const imported = await DevicePlatformStore.create(
      importedDirectory,
      path.join(importedDirectory, "assets"),
    );
    await imported.importBundle(exported);
    assert.equal(
      imported.getBindings()[0].deviceTemplateId,
      "custom.my-washer",
    );
    assert.equal((await imported.exportBundle()).assets.length, 1);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("deleting referenced custom templates can safely unlink device bindings", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "ha3d-delete-"));
  const assetDir = path.join(directory, "assets");
  try {
    const store = await DevicePlatformStore.create(directory, assetDir);
    const template = await store.upsertDeviceTemplate({
      ...store.getDeviceTemplates().find((item) => item.id === "builtin.washing-machine"),
      id: "custom.delete-washer",
      name: "待删除洗衣机",
      builtin: false,
    });
    const panel = await store.upsertControlPanel({
      ...store.getControlPanels().find((item) => item.id === "builtin.washing-machine"),
      id: "custom.delete-panel",
      name: "待删除面板",
      builtin: false,
    });
    await store.upsertBinding({
      deviceId: "washer-to-unlink",
      deviceTemplateId: template.id,
      controlPanelTemplateId: panel.id,
      capabilityBindings: { power: "switch.washer_power" },
    });

    await assert.rejects(
      store.delete("panel", panel.id),
      /仍被 1 个设备绑定引用/,
    );
    await store.delete("panel", panel.id, { unlinkReferences: true });
    assert.equal(store.getBindings()[0].controlPanelTemplateId, undefined);

    await store.delete("device", template.id, { unlinkReferences: true });
    assert.equal(store.getBindings().length, 0);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("deleted builtin device templates also suppress paired resources", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "ha3d-builtins-"));
  const assetDir = path.join(directory, "assets");
  try {
    const store = await DevicePlatformStore.create(directory, assetDir);
    assert.equal(
      store.getDeviceTemplates().some((item) => item.id === "builtin.generic"),
      true,
    );
    await store.delete("device", "builtin.generic", {
      unlinkReferences: true,
    });
    assert.equal(
      store.getDeviceTemplates().some((item) => item.id === "builtin.generic"),
      false,
    );
    assert.equal(
      store.getModelTemplates().some((item) => item.id === "builtin.generic"),
      false,
    );
    assert.equal(
      store.getControlPanels().some((item) => item.id === "builtin.generic"),
      false,
    );
    const reloaded = await DevicePlatformStore.create(directory, assetDir);
    assert.equal(
      reloaded
        .getDeviceTemplates()
        .some((item) => item.id === "builtin.generic"),
      false,
    );
    const exported = await reloaded.exportBundle();
    assert.deepEqual(exported.suppressedBuiltinIds, [
      "device:builtin.generic",
      "model:builtin.generic",
      "panel:builtin.generic",
    ]);
    const importedDirectory = path.join(directory, "imported");
    const imported = await DevicePlatformStore.create(
      importedDirectory,
      path.join(importedDirectory, "assets"),
    );
    await imported.importBundle(exported);
    assert.equal(
      imported
        .getDeviceTemplates()
        .some((item) => item.id === "builtin.generic"),
      false,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("exported procedural and embedded model templates can be reopened", () => {
  const procedural = parseModelTemplateJson(
    JSON.stringify({
      version: 1,
      items: [
        {
          id: "custom.washer-model",
          name: "洗衣机模型",
          source: { type: "procedural", shape: "washing-machine" },
        },
      ],
    }),
  );
  assert.equal(procedural.model.source.shape, "washing-machine");
  assert.equal(procedural.previewUrl, null);

  const uploaded = parseModelTemplateJson(
    JSON.stringify({
      modelTemplates: [
        {
          id: "custom.uploaded-model",
          name: "上传模型",
          source: { type: "upload", fileName: "device.glb" },
        },
      ],
      assets: [
        {
          modelTemplateId: "custom.uploaded-model",
          fileName: "device.glb",
          mimeType: "model/gltf-binary",
          dataBase64: "Z2xURg==",
        },
      ],
    }),
  );
  assert.equal(uploaded.file.name, "device.glb");
  assert.match(uploaded.previewUrl, /^data:model\/gltf-binary;base64,/);
});

test("imported GLTF geometry and material populate model parameters", () => {
  const scene = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({
    color: "#aabbcc",
    roughness: 0.37,
    metalness: 0.22,
  });
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.72, 1.92, 0.67),
    material,
  );
  scene.add(mesh);
  assert.deepEqual(inspectGltfModelParameters(scene), {
    dimensions: { width: 0.72, depth: 0.67, height: 1.92 },
    dimensionAdjusted: false,
    color: "#aabbcc",
    roughness: 0.37,
    metalness: 0.22,
  });
  assert.throws(() => inspectGltfModelParameters(new THREE.Group()), /几何体/);
  mesh.geometry.dispose();
  material.dispose();
});

test("legacy device-only suppressions migrate to paired models and panels", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "ha3d-builtins-old-"));
  const assetDir = path.join(directory, "assets");
  try {
    await writeFile(
      path.join(directory, "suppressed-builtin-templates.json"),
      JSON.stringify({ items: ["device:builtin.washing-machine"] }),
    );
    const store = await DevicePlatformStore.create(directory, assetDir);
    assert.equal(
      store
        .getDeviceTemplates()
        .some((item) => item.id === "builtin.washing-machine"),
      false,
    );
    assert.equal(
      store
        .getModelTemplates()
        .some((item) => item.id === "builtin.washing-machine"),
      false,
    );
    assert.equal(
      store
        .getControlPanels()
        .some((item) => item.id === "builtin.washing-machine"),
      false,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("device templates keep standard HA services and reject arbitrary service names", () => {
  const template = normalizeDeviceTemplate({
    id: "custom.safe-services",
    name: "标准服务",
    capabilities: [
      {
        capabilityId: "power",
        name: "电源",
        kind: "toggle",
        allowedDomains: ["switch"],
        services: { on: "switch.turn_on", off: "switch.delete_everything" },
      },
    ],
  });
  assert.deepEqual(template.capabilities[0].services, { on: "switch.turn_on" });
});

test("Chinese capability ids receive unique stable fallbacks", () => {
  const template = normalizeDeviceTemplate({
    id: "custom.chinese-capabilities",
    name: "中文能力",
    capabilities: [
      { capabilityId: "运行状态", name: "运行状态" },
      { capabilityId: "运行模式", name: "运行模式" },
      { capabilityId: "---", name: "启停" },
    ],
  });
  assert.deepEqual(
    template.capabilities.map((item) => item.capabilityId),
    ["capability-1", "capability-2", "capability-3"],
  );
  assert.deepEqual(
    template.capabilities.map((item) => item.name),
    ["运行状态", "运行模式", "启停"],
  );
});

test("one HA device cannot be placed twice across floorplans", () => {
  const project = normalizeFloorplanProject({
    id: "device-dedup",
    name: "设备去重",
    floors: [
      {
        id: "floor-1",
        name: "一层",
        walls: [],
        rooms: [],
        openings: [],
        furniture: [],
        devices: [
          {
            id: "washer-a",
            entityId: "switch.washer",
            deviceId: "ha-device-washer",
            position: [0, 0, 0],
          },
          {
            id: "washer-b",
            entityId: "sensor.washer_status",
            deviceId: "ha-device-washer",
            position: [1, 0, 0],
          },
        ],
      },
    ],
  });
  const result = validateFloorplanProject(project);
  assert.equal(result.valid, false);
  assert.equal(
    result.issues.some((issue) => issue.includes("不能在户型中重复放置")),
    true,
  );
});

test("device library picks climate over earlier auxiliary switches for the same HA device", () => {
  const entities = [
    { entityId: "switch.bedroom_display", domain: "switch", deviceId: "bedroom" },
    { entityId: "climate.bedroom", domain: "climate", deviceId: "bedroom" },
    { entityId: "switch.study_display", domain: "switch", deviceId: "study" },
    { entityId: "climate.study", domain: "climate", deviceId: "study" },
    { entityId: "switch.living_display", domain: "switch", deviceId: "living" },
    { entityId: "climate.living", domain: "climate", deviceId: "living" },
    { entityId: "switch.floor_ac_power", domain: "switch", deviceId: "floor-ac" },
    { entityId: "climate.floor_ac", domain: "climate", deviceId: "floor-ac" },
    { entityId: "switch.plug", domain: "switch", deviceId: "plug" },
  ];
  const { unplaced, available } = buildDeviceLibrary(
    entities,
    [{ entityId: "climate.floor_ac" }],
    () => true,
    (first, second) =>
      Number(first.domain === "climate") - Number(second.domain === "climate"),
  );
  assert.equal(unplaced.some((entity) => entity.deviceId === "floor-ac"), false);
  assert.deepEqual(
    available.map((entity) => entity.entityId),
    ["switch.plug", "climate.bedroom", "climate.study", "climate.living"],
  );
  assert.equal(available.filter((entity) => entity.domain === "climate").length, 3);
});

test("room filter uniquely infers an unassigned climate area without changing HA data", () => {
  const areas = [
    { id: "home-main-bedroom", name: "大步家 主卧" },
    { id: "home-second-bedroom", name: "大步家 次卧" },
    { id: "other-living", name: "临安的家 客厅" },
    { id: "home-living", name: "大步家 客厅" },
  ];
  const mainAc = { domain: "climate", name: "主卧空调 温控器" };
  assert.equal(resolveDeviceLibraryAreaId(mainAc, areas), "home-main-bedroom");
  assert.equal(mainAc.areaId, undefined);
  assert.equal(
    resolveDeviceLibraryAreaId(
      { domain: "climate", name: "次卧空调 温控器" },
      areas,
    ),
    "home-second-bedroom",
  );
  assert.equal(
    resolveDeviceLibraryAreaId(
      { domain: "climate", name: "客厅空调" },
      areas,
    ),
    undefined,
  );
  assert.equal(
    resolveDeviceLibraryAreaId(
      { domain: "climate", name: "主卧空调", areaId: "manual" },
      areas,
    ),
    "manual",
  );
});

test("entity history also restores HA device registry metadata", async () => {
  const directory = await mkdtemp(
    path.join(os.tmpdir(), "ha3d-device-history-"),
  );
  try {
    const store = await EntityHistoryStore.create(directory);
    await store.rememberDevices([
      {
        id: "washer-device",
        name: "阳台洗衣机",
        manufacturer: "Example",
        model: "WM-1",
        areaId: "balcony",
      },
    ]);
    const reloaded = await EntityHistoryStore.create(directory);
    assert.deepEqual(reloaded.getDevices()[0], {
      id: "washer-device",
      name: "阳台洗衣机",
      manufacturer: "Example",
      model: "WM-1",
      areaId: "balcony",
      integration: undefined,
      historical: true,
      source: "history",
    });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("entity history persists useful attributes without HA credentials", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "ha3d-history-"));
  try {
    const store = await EntityHistoryStore.create(directory);
    await store.rememberEntities([
      {
        entityId: "camera.front_door",
        domain: "camera",
        name: "Front door",
        state: "idle",
        attributes: {
          friendly_name: "Front door",
          access_token: "must-not-be-written",
          entity_picture:
            "/api/camera_proxy/camera.front_door?token=must-not-be-written",
        },
      },
    ]);
    const raw = await readFile(
      path.join(directory, "ha-entity-history.json"),
      "utf8",
    );
    assert.equal(raw.includes("must-not-be-written"), false);
    assert.equal(raw.includes("Front door"), true);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("cabinet furniture kinds are exposed through a named domain module", () => {
  assert.deepEqual(
    [...CABINET_FURNITURE_KINDS],
    [
      "wardrobe",
      "cabinet",
      "tv_stand",
      "bookshelf",
      "sideboard",
      "shoe_cabinet",
      "nightstand",
    ],
  );
  assert.equal(isCabinetFurniture("cabinet"), true);
  assert.equal(isCabinetFurniture("sofa"), false);
});

test("furniture elevation accepts finite values and clamps the UI range", () => {
  assert.equal(normalizeFurnitureElevation(1.25), 1.25);
  assert.equal(normalizeFurnitureElevation(-1), 0);
  assert.equal(normalizeFurnitureElevation(20), 12);
  assert.equal(normalizeFurnitureElevation("invalid"), 0);
});

test("shower enclosure styles share one furniture kind and preserve dimensions", () => {
  const shower = normalizeFurniture(
    {
      id: "shower-1",
      kind: "shower_enclosure",
      showerStyle: "diamond",
      width: 1.2,
      depth: 0.9,
      height: 2.1,
      showerCornerCut: 0.3,
    },
    "floor-1",
  );
  assert.equal(shower.kind, "shower_enclosure");
  assert.equal(shower.showerStyle, "diamond");
  assert.deepEqual(
    [shower.width, shower.depth, shower.height, shower.showerCornerCut],
    [1.2, 0.9, 2.1, 0.3],
  );
  assert.deepEqual(diamondShowerOutline(1.2, 0.9, 0.3), [
    [-0.6, -0.45],
    [0.6, -0.45],
    [0.6, 0.15000000000000002],
    [0.3, 0.45],
    [-0.6, 0.45],
  ]);
  assert.equal(showerGlassSegments(1.2, 0.9, "diamond", 0.3).length, 3);
  assert.equal(showerGlassSegments(1.2, 0.9, "rectangular", 0.3).length, 2);
  assert.equal(showerGlassSegments(1.2, 0.9, "curved", 0.3).length, 16);
  for (const style of ["diamond", "rectangular", "curved"]) {
    const outline = showerEnclosureOutline(1.2, 0.9, style, 0.3);
    assert.deepEqual(outline[0], [-0.6, -0.45]);
    assert.deepEqual(outline[1], [0.6, -0.45]);
    assert.ok(Math.abs(outline.at(-1)[0] + 0.6) < 1e-10);
    assert.ok(Math.abs(outline.at(-1)[1] - 0.45) < 1e-10);
    assert.equal(pointInShowerOutline([0, 0], outline), true);
    assert.equal(
      pointInShowerOutline([0.59, 0.44], outline),
      style === "rectangular",
    );
  }
  assert.equal(normalizeShowerCornerCut(9, 0.9, 0.9), 0.37);
  assert.equal(
    normalizeFurniture({ kind: "shower_diamond" }, "floor-1").kind,
    "shower_enclosure",
  );
  assert.equal(
    normalizeFurniture({ kind: "shower_diamond" }, "floor-1").showerStyle,
    "diamond",
  );
  assert.equal(
    normalizeFurniture(
      { kind: "shower_enclosure", showerStyle: "curved" },
      "floor-1",
    ).showerStyle,
    "curved",
  );
  assert.equal(
    normalizeFurniture(
      { kind: "shower_enclosure", showerStyle: "invalid" },
      "floor-1",
    ).showerStyle,
    "diamond",
  );
});

test("sprayer and compact toilet are independent built-in furniture", () => {
  const fixture = normalizeFurniture({ kind: "shower_fixture" }, "floor-1");
  assert.equal(fixture.kind, "shower_fixture");
  assert.deepEqual(
    [fixture.width, fixture.depth, fixture.height],
    [0.25, 0.35, 2.05],
  );
  const toilet = normalizeFurniture({ kind: "toilet" }, "floor-1");
  assert.equal(toilet.kind, "toilet");
  assert.deepEqual(
    [toilet.width, toilet.depth, toilet.height],
    [0.43, 0.68, 0.48],
  );
  const oldToilet = normalizeFurniture(
    { kind: "toilet", width: 0.7, depth: 0.72, height: 0.78 },
    "floor-1",
  );
  assert.deepEqual(
    [oldToilet.width, oldToilet.depth, oldToilet.height],
    [0.43, 0.68, 0.48],
  );
});

test("vanity mirror cabinet preserves independently adjustable component dimensions", () => {
  const defaults = normalizeFurniture(
    { kind: "vanity_mirror_cabinet" },
    "floor-1",
  );
  assert.equal(defaults.kind, "vanity_mirror_cabinet");
  assert.equal(defaults.width, VANITY_MIRROR_DEFAULTS.width);
  assert.equal(defaults.depth, VANITY_MIRROR_DEFAULTS.depth);
  assert.equal(
    defaults.height,
    defaults.vanityHeight + defaults.mirrorGap + defaults.mirrorHeight,
  );

  const configured = normalizeFurniture(
    {
      ...defaults,
      width: 1.25,
      depth: 0.62,
      vanityHeight: 0.9,
      basinWidth: 0.58,
      basinDepth: 0.39,
      mirrorWidth: 1.1,
      mirrorDepth: 0.2,
      mirrorHeight: 0.85,
      mirrorGap: 0.32,
      height: 8,
    },
    "floor-1",
  );
  assert.deepEqual(
    [
      configured.width,
      configured.depth,
      configured.basinWidth,
      configured.basinDepth,
    ],
    [1.25, 0.62, 0.58, 0.39],
  );
  assert.deepEqual(
    [configured.mirrorWidth, configured.mirrorDepth, configured.mirrorHeight],
    [1.1, 0.2, 0.85],
  );
  assert.equal(configured.height, 2.07);
  assert.deepEqual(normalizeFurniture(configured, "floor-1"), configured);

  const resized = normalizeVanityMirrorCabinet({
    ...configured,
    width: 0.6,
    depth: 0.38,
  });
  assert.equal(resized.mirrorWidth, 0.6);
  assert.equal(resized.basinWidth, 0.5);
  assert.equal(resized.mirrorDepth, 0.2);
  assert.equal(resized.basinDepth, 0.3);
});

test("vanity mirror cabinet is available in the editor and rendered in 3D", async () => {
  const editor = await readFile(
    new URL("../apps/web/src/app/floorplan-editor.js", import.meta.url),
    "utf8",
  );
  const scene = await readFile(
    new URL("../apps/web/src/app/scene.js", import.meta.url),
    "utf8",
  );
  assert.match(editor, /vanity_mirror_cabinet:\s*\{\s*label:\s*"洗漱台镜柜"/);
  for (const field of [
    "vanityHeight",
    "basinWidth",
    "basinDepth",
    "mirrorWidth",
    "mirrorDepth",
    "mirrorHeight",
    "mirrorGap",
  ]) {
    assert.match(editor, new RegExp(`\\[\\s*"${field}"\\s*,`));
  }
  assert.match(
    scene,
    /e\.kind === "vanity_mirror_cabinet" &&\s*t\.jsx\(VanityMirrorCabinetFixture/,
  );
});

test("recovered schema preserves elevation and remains backward compatible", () => {
  const floorId = "floor-1";
  const current = normalizeFurniture(
    { id: "cabinet-1", kind: "cabinet", elevation: 1.25 },
    floorId,
  );
  const legacy = normalizeFurniture(
    { id: "cabinet-2", kind: "cabinet" },
    floorId,
  );

  assert.equal(current.elevation, 1.25);
  assert.equal(legacy.elevation, 0);
});

test("legacy cabinet furniture migrates to a four-edge boundary", () => {
  const furniture = normalizeFurniture(
    {
      id: "legacy-tv-stand",
      kind: "tv_stand",
      width: 1.8,
      depth: 0.38,
      height: 0.34,
    },
    "floor-1",
  );
  assert.equal(furniture.kind, "cabinet");
  assert.equal(furniture.cabinetStyle, "tv");
  assert.equal(furniture.cabinetDepth, 0.38);
  assert.equal(furniture.cabinetSegments.length, 4);
  assert.equal(furniture.cabinetSegments[0].isDoorFront, true);
  assert.deepEqual(
    furniture.cabinetSegments.map((segment) => segment.start),
    [
      [-0.9, -0.19],
      [0.9, -0.19],
      [0.9, 0.19],
      [-0.9, 0.19],
    ],
  );
});

test("centerline cabinets migrate to a closed four-edge footprint", () => {
  const furniture = normalizeFurniture(
    {
      id: "centerline-cabinet",
      kind: "cabinet",
      width: 2.9,
      depth: 0.6,
      cabinetDepth: 0.6,
      cabinetSegments: [
        { id: "legacy-centerline", start: [-1.45, 0], end: [1.45, 0] },
      ],
    },
    "floor-1",
  );
  assert.equal(furniture.cabinetSegments.length, 4);
  assert.equal(furniture.width, 2.9);
  assert.equal(furniture.depth, 0.6);
  furniture.cabinetSegments.forEach((segment, index, segments) => {
    assert.deepEqual(
      segment.end,
      segments[(index + 1) % segments.length].start,
    );
  });
});

test("editable cabinets preserve the segmented connected style", () => {
  const furniture = normalizeFurniture(
    {
      id: "segmented-cabinet",
      kind: "cabinet",
      cabinetStyle: "segmented",
      cabinetSegments: [
        { id: "a", start: [-1, -0.3], end: [1, -0.3] },
        { id: "b", start: [1, -0.3], end: [1, 0.3] },
        { id: "c", start: [1, 0.3], end: [-1, 0.3] },
        { id: "d", start: [-1, 0.3], end: [-1, -0.3] },
      ],
    },
    "floor-1",
  );
  assert.equal(furniture.cabinetStyle, "segmented");
  assert.equal(furniture.cabinetSegments.length, 4);
});

test("segmented cabinet dimensions keep a valid automatic upper section", () => {
  assert.deepEqual(normalizeSegmentedCabinetHeights(2.4, 0.8, 0.6), {
    sectionOneHeight: 0.8,
    hollowHeight: 0.6,
    sectionTwoHeight: 1,
  });
  assert.deepEqual(normalizeSegmentedCabinetHeights(1, 0.95, 0.5), {
    sectionOneHeight: 0.9,
    hollowHeight: 0,
    sectionTwoHeight: 0.1,
  });
  assert.equal(normalizeCabinetDoorCount(4.6), 5);
  assert.equal(normalizeCabinetDoorCount(99), 12);
  assert.equal(normalizeCabinetUpperDepth(0.35, 0.6), 0.35);
  assert.equal(normalizeCabinetUpperDepth(0, 0.6), 0.1);
});

test("segmented cabinet builds a rounded projecting shelf instead of inner fillets", () => {
  const shelf = createSegmentedCabinetShelfLayout({
    length: 1.6,
    cabinetDepth: 0.6,
    sectionOneHeight: 0.8,
  });
  assert.deepEqual(shelf, {
    length: 1.6,
    depth: 0.6,
    frontLip: 0,
    radius: 0.096,
    thickness: 0.055,
    bottom: 0.745,
  });
});

test("segmented cabinet keeps the hollow back and side connector panels", () => {
  const lower = createCabinetSegments(1.6, 0.6);
  const panels = createSegmentedCabinetConnectorPanels(lower, {
    upperSegments: resizeCabinetDepthFromBack(lower, 0.4, 0.6),
    sectionOneHeight: 0.8,
    hollowHeight: 0.4,
  });

  assert.equal(panels.length, 3);
  assert.deepEqual(
    panels.map((panel) => panel.id),
    ["segment-2", "segment-3", "segment-4"],
  );
  assert.ok(panels.every((panel) => Math.abs(panel.bottom - 0.79) < 1e-9));
  assert.ok(panels.every((panel) => Math.abs(panel.height - 0.42) < 1e-9));
  assert.ok(panels.every((panel) => panel.thickness === 0.036));
  assert.deepEqual(panels[1].center, [0, 0.282]);
  assert.equal(panels[0].frontEnd, "start");
  assert.ok(Math.abs(panels[0].lowerFrontX + 0.3) < 1e-9);
  assert.ok(Math.abs(panels[0].upperFrontX + 0.1) < 1e-9);
  assert.ok(panels[0].curveX > panels[0].upperFrontX);
  assert.equal(panels[1].frontEnd, undefined);
  assert.equal(panels[2].frontEnd, "end");
  assert.ok(Math.abs(panels[2].lowerFrontX - 0.3) < 1e-9);
  assert.ok(Math.abs(panels[2].upperFrontX - 0.1) < 1e-9);
  assert.ok(panels[2].curveX < panels[2].upperFrontX);
});

test("segmented cabinet upper depth keeps the back plane fixed", () => {
  const lower = createCabinetSegments(2, 0.6);
  const deeperLower = resizeCabinetDepthFromBack(lower, 0.8, 0.6);
  assert.equal(cabinetFrontDepth(deeperLower, 0.6), 0.8);
  assert.deepEqual(deeperLower[0].start, [-1, -0.5]);
  assert.deepEqual(deeperLower[2].start, [1, 0.3]);
  const upper = resizeCabinetDepthFromBack(lower, 0.3, 0.6);
  assert.deepEqual(upper[0].start, [-1, 0]);
  assert.deepEqual(upper[0].end, [1, 0]);
  assert.deepEqual(upper[2].start, [1, 0.3]);
  assert.deepEqual(upper[2].end, [-1, 0.3]);

  const sideFront = setCabinetDoorFront(lower, "segment-2");
  const sideUpper = resizeCabinetDepthFromBack(sideFront, 0.4, 0.6);
  assert.deepEqual(sideUpper[1].start, [-0.6, -0.3]);
  assert.deepEqual(sideUpper[1].end, [-0.6, 0.3]);
  assert.deepEqual(sideUpper[3].start, [-1, 0.3]);
  assert.deepEqual(sideUpper[3].end, [-1, -0.3]);
  assert.deepEqual(segmentedCabinetDisplaySize(lower, 0.3, 0.6), {
    width: 2,
    depth: 0.6,
  });
  assert.deepEqual(segmentedCabinetDisplaySize(lower, 0.8, 0.6), {
    width: 2,
    depth: 0.8,
  });
});

test("schema persists cabinet doors and segmented section configuration", () => {
  const furniture = normalizeFurniture(
    {
      id: "configured-segmented-cabinet",
      kind: "cabinet",
      height: 2.4,
      depth: 0.6,
      cabinetStyle: "segmented",
      cabinetDoorCount: 4,
      cabinetSectionOneHeight: 0.8,
      cabinetHollowHeight: 0.6,
      cabinetUpperDepth: 0.35,
    },
    "floor-1",
  );
  assert.equal(furniture.cabinetDoorCount, 4);
  assert.equal(furniture.cabinetSectionOneHeight, 0.8);
  assert.equal(furniture.cabinetHollowHeight, 0.6);
  assert.equal(furniture.cabinetUpperDepth, 0.35);
});

test("cabinet segments split, form corners, and merge only when collinear", () => {
  const rectangle = createCabinetSegments(2, 0.6);
  assert.equal(rectangle.length, 4);
  const split = splitCabinetSegment(rectangle, "segment-1");
  assert.equal(split.ok, true);
  assert.equal(split.segments.length, 5);
  const corner = moveCabinetJunction(split.segments, [0, -0.3], [0, -0.8]);
  assert.equal(mergeCollinearCabinetSegments(corner).ok, false);
  assert.deepEqual(corner[0].end, [0, -0.8]);
  assert.deepEqual(corner[1].start, [0, -0.8]);
  const restored = moveCabinetJunction(corner, [0, -0.8], [0, -0.3]);
  const merged = mergeCollinearCabinetSegments(restored);
  assert.equal(merged.ok, true);
  assert.equal(merged.segments.length, 4);
  assert.deepEqual(cabinetLayoutBounds(rectangle, 0.6), {
    minX: -1,
    maxX: 1,
    minY: -0.3,
    maxY: 0.3,
    width: 2,
    depth: 0.6,
  });
});

test("cabinet segment translation preserves connected junctions", () => {
  const translated = translateCabinetSegment(
    createCabinetSegments(2, 0.6),
    "segment-1",
    [0, -0.25],
  );
  assert.deepEqual(translated[0], {
    id: "segment-1",
    start: [-1, -0.55],
    end: [1, -0.55],
    isDoorFront: true,
  });
  assert.deepEqual(translated[1].start, [1, -0.55]);
  assert.deepEqual(translated[3].end, [-1, -0.55]);
});

test("cabinet door front selection persists on exactly one boundary edge", () => {
  const segments = setCabinetDoorFront(
    createCabinetSegments(2, 0.6),
    "segment-3",
  );
  assert.deepEqual(
    segments
      .filter((segment) => segment.isDoorFront)
      .map((segment) => segment.id),
    ["segment-3"],
  );
  const furniture = normalizeFurniture(
    { id: "front-cabinet", kind: "cabinet", cabinetSegments: segments },
    "floor-1",
  );
  assert.deepEqual(
    furniture.cabinetSegments
      .filter((segment) => segment.isDoorFront)
      .map((segment) => segment.id),
    ["segment-3"],
  );
});

test("cabinet junctions snap to parallel and perpendicular edge relations", () => {
  const rectangle = createCabinetSegments(2, 0.6);
  const snap = snapCabinetJunctionToRelations(
    rectangle,
    rectangle[0].end,
    [1.02, -0.02],
  );
  assert.equal(snap.relation?.type, "parallel");
  const moved = moveCabinetJunction(rectangle, rectangle[0].end, snap.point);
  const relations = findCabinetSegmentRelations(moved, snap.relation.activeId);
  assert.equal(
    relations.some(
      (relation) =>
        relation.type === "parallel" &&
        relation.referenceId === snap.relation.referenceId,
    ),
    true,
  );
});

test("custom models require explicit furniture enablement", () => {
  assert.equal(
    normalizeModelTemplate({
      id: "custom.regular-model",
      source: { type: "procedural", shape: "box" },
    }).furnitureEnabled,
    false,
  );
  const starters = starterCustomModelTemplates();
  assert.deepEqual(
    starters.map((model) => model.id),
    [
      "custom.pipeline-water-dispenser",
      "custom.water-purifier",
      "custom.gas-water-heater",
      "custom.wifi-router",
    ],
  );
  assert.ok(
    starters.every((model) => !model.builtin && model.furnitureEnabled),
  );
});

test("vertical references follow chained furniture and device surfaces", () => {
  const floor = {
    devices: [
      {
        id: "router",
        position: [0, 0, 0],
        customModel: { dimensions: { height: 0.08 }, scale: 1 },
        verticalReference: {
          targetType: "furniture",
          targetId: "cabinet",
          surface: "top",
          offset: 0.02,
        },
      },
    ],
    furniture: [
      { id: "cabinet", height: 0.8, elevation: 0.1 },
      {
        id: "shelf",
        height: 0.3,
        elevation: 0,
        verticalReference: {
          targetType: "device",
          targetId: "router",
          surface: "top",
          offset: 0.05,
        },
      },
    ],
  };
  const values = resolveFloorVerticalElevations(floor);
  assert.equal(values.get("furniture:cabinet"), 0.1);
  assert.equal(values.get("device:router"), 0.92);
  assert.equal(values.get("furniture:shelf"), 1.05);
});

test("vertical references use the rendered height of builtin floor air conditioners", () => {
  const floor = {
    devices: [
      {
        id: "floor-ac",
        entityId: "climate.floor_ac",
        modelId: "climate.floor_ac",
        position: [0, 0, 0],
      },
    ],
    furniture: [
      {
        id: "pipeline-machine",
        height: 0.48,
        elevation: 0,
        verticalReference: {
          targetType: "device",
          targetId: "floor-ac",
          surface: "top",
          offset: 0,
        },
      },
    ],
  };

  const editorValues = resolveFloorVerticalElevations(floor);
  const homeValues = resolveFloorVerticalElevations(
    floor,
    {},
    { presentation: true },
  );
  assert.equal(editorValues.get("furniture:pipeline-machine"), 1.08 * 1.12);
  assert.equal(homeValues.get("furniture:pipeline-machine"), 1.08 * 1.18);
});

test("vertical references use live configured model height and placed Y scale", () => {
  const floor = {
    devices: [
      {
        id: "custom-device",
        entityId: "sensor.custom_device",
        position: [0, 0, 0],
        scale: [1, 1.5, 1],
      },
    ],
    furniture: [
      {
        id: "attached-item",
        height: 0.1,
        elevation: 0,
        verticalReference: {
          targetType: "device",
          targetId: "custom-device",
          surface: "top",
          offset: 0,
        },
      },
    ],
  };
  const entities = {
    "sensor.custom_device": {
      deviceModel: {
        enabled: true,
        source: { type: "procedural", shape: "box" },
        dimensions: { width: 0.4, height: 0.8, depth: 0.3 },
        scale: 1.25,
      },
    },
  };

  const values = resolveFloorVerticalElevations(floor, entities);
  assert.equal(values.get("furniture:attached-item"), 1.5);
});

test("vertical references use the same default device scale as the 3D scene", () => {
  const floor = {
    devices: [
      {
        id: "washer",
        entityId: "switch.washer",
        modelId: "switch.washing_machine",
        position: [0, 0, 0],
      },
    ],
    furniture: [
      {
        id: "purifier",
        height: 0.46,
        elevation: 0,
        verticalReference: {
          targetType: "device",
          targetId: "washer",
          surface: "top",
          offset: 0,
        },
      },
    ],
  };
  const entities = {
    "switch.washer": {
      deviceModel: {
        enabled: true,
        source: { type: "upload", url: "./washer.glb" },
        dimensions: { width: 0.6, height: 0.85, depth: 0.65 },
        scale: 1,
      },
    },
  };

  const editorValues = resolveFloorVerticalElevations(floor, entities);
  const homeValues = resolveFloorVerticalElevations(floor, entities, {
    presentation: true,
  });
  assert.equal(editorValues.get("furniture:purifier"), 0.85 * 1.24);
  assert.equal(homeValues.get("furniture:purifier"), 0.85 * 1.12);
});

test("changing a vertical reference preserves the current bottom elevation", () => {
  const floor = {
    devices: [],
    furniture: [
      { id: "table", height: 0.75, elevation: 0 },
      { id: "router", height: 0.08, elevation: 1.1 },
    ],
  };
  assert.deepEqual(
    rebaseVerticalReference(
      floor,
      "furniture",
      "router",
      "furniture",
      "table",
      "top",
    ),
    {
      targetType: "furniture",
      targetId: "table",
      surface: "top",
      offset: 0.3500000000000001,
    },
  );
});

test("binding a vertical reference snaps directly to the selected surface", () => {
  assert.deepEqual(bindVerticalReference("furniture", "tv-stand", "top"), {
    targetType: "furniture",
    targetId: "tv-stand",
    surface: "top",
    offset: 0,
  });
});

test("vertical reference candidates require footprint overlap and exclude lights", () => {
  const base = {
    candidateType: "device",
    currentItem: {
      id: "current",
      position: [0, 0],
      width: 0.4,
      depth: 0.4,
      rotation: 0,
    },
    currentId: "current",
    currentType: "furniture",
  };
  assert.equal(
    isVerticalReferenceCandidate({
      ...base,
      candidate: {
        id: "router",
        roomId: "another-room",
        entityId: "sensor.router",
        position: [0.1, 0, 0.1],
      },
      entity: { entityId: "sensor.router", domain: "sensor" },
    }),
    true,
  );
  assert.equal(
    isVerticalReferenceCandidate({
      ...base,
      candidate: {
        id: "far-router",
        roomId: "living-room",
        entityId: "sensor.router",
        position: [3, 0, 3],
      },
    }),
    false,
  );
  assert.equal(
    isVerticalReferenceCandidate({
      ...base,
      candidate: {
        id: "downlight",
        roomId: "living-room",
        kind: "light",
        entityId: "light.downlight",
        modelId: "light.downlight",
        position: [0, 0, 0],
      },
      entity: { entityId: "light.downlight", domain: "light" },
    }),
    false,
  );
});

test("vertical reference candidates recalculate after the selected object moves", () => {
  const candidate = {
    id: "cabinet",
    position: [0, 0],
    width: 1,
    depth: 0.5,
    rotation: Math.PI / 8,
  };
  const input = {
    candidate,
    candidateType: "furniture",
    currentId: "appliance",
    currentType: "furniture",
  };
  assert.equal(
    isVerticalReferenceCandidate({
      ...input,
      currentItem: {
        id: "appliance",
        position: [0.2, 0],
        width: 0.3,
        depth: 0.3,
        rotation: 0,
      },
    }),
    true,
  );
  assert.equal(
    isVerticalReferenceCandidate({
      ...input,
      currentItem: {
        id: "appliance",
        position: [2, 0],
        width: 0.3,
        depth: 0.3,
        rotation: 0,
      },
    }),
    false,
  );
});

test("connected crooked wall segments are ordered and straightened horizontally", () => {
  const walls = [
    { id: "middle", start: [2, 0.08], end: [4, -0.04] },
    { id: "last", start: [6, 0.02], end: [4, -0.04] },
    { id: "first", start: [0, 0], end: [2, 0.08] },
  ];
  const result = straightenWallChain(walls, ["first", "middle", "last"]);

  assert.equal(result.ok, true);
  assert.equal(result.axis, "horizontal");
  assert.deepEqual(result.orderedWallIds, ["last", "middle", "first"]);
  const selectedPoints = result.walls.flatMap((wall) => [wall.start, wall.end]);
  assert.equal(new Set(selectedPoints.map((point) => point[1])).size, 1);
  assert.equal(selectedPoints[0][1], 0.01);
});

test("straightening keeps reversed segments connected and moves attached walls", () => {
  const walls = [
    { id: "first", start: [0, 0], end: [2, 0.2] },
    { id: "second", start: [4, 0], end: [2, 0.2] },
    { id: "attached", start: [2, 0.2], end: [2, 2] },
  ];
  const result = straightenWallChain(walls, ["first", "second"]);

  assert.equal(result.ok, true);
  const first = result.walls.find((wall) => wall.id === "first");
  const second = result.walls.find((wall) => wall.id === "second");
  const attached = result.walls.find((wall) => wall.id === "attached");
  assert.deepEqual(first.end, [2, 0]);
  assert.deepEqual(second.end, [2, 0]);
  assert.deepEqual(attached.start, [2, 0]);
});

test("short topology split segments are included in a long wall chain", () => {
  const walls = [
    { id: "long-right", start: [6, 6.6], end: [4.4646, 6.5589] },
    { id: "short-split", start: [4.4646, 6.5589], end: [4.4, 6.5576] },
    { id: "middle", start: [4.4, 6.5576], end: [2.7228, 6.5254] },
    { id: "long-left", start: [2.7228, 6.5254], end: [1.4, 6.5] },
  ];
  const result = straightenWallChain(
    walls,
    walls.map((wall) => wall.id),
  );

  assert.equal(result.ok, true);
  assert.equal(result.axis, "horizontal");
  assert.equal(result.changed, true);
  assert.equal(
    new Set(result.walls.flatMap((wall) => [wall.start[1], wall.end[1]])).size,
    1,
  );
});

test("disconnected or branched selections are rejected without changing walls", () => {
  const disconnected = [
    { id: "first", start: [0, 0], end: [1, 0.1] },
    { id: "second", start: [2, 0], end: [3, 0] },
  ];
  const branch = [
    { id: "a", start: [0, 0], end: [1, 0.1] },
    { id: "b", start: [1, 0.1], end: [2, 0] },
    { id: "c", start: [1, 0.1], end: [1, 1] },
  ];

  const disconnectedResult = straightenWallChain(disconnected, [
    "first",
    "second",
  ]);
  const branchResult = straightenWallChain(branch, ["a", "b", "c"]);
  assert.equal(disconnectedResult.ok, false);
  assert.equal(disconnectedResult.reason, "disconnected");
  assert.strictEqual(disconnectedResult.walls, disconnected);
  assert.equal(branchResult.ok, false);
  assert.equal(branchResult.reason, "branched");
});

test("openings remain inside a shortened wall after straightening", () => {
  const openings = [{ id: "door", wallId: "wall", offset: 4.8, width: 1 }];
  const walls = [{ id: "wall", start: [0, 0], end: [4, 0] }];

  assert.deepEqual(clampOpeningsToWalls(openings, walls), [
    { id: "door", wallId: "wall", offset: 3.5, width: 1 },
  ]);
});

test("dragged points snap independently to vertical and horizontal guides", () => {
  const result = snapPointToAlignment(
    [1.94, 3.04],
    [
      { id: "wall", kind: "wall", point: [2, 0] },
      { id: "device", kind: "device", point: [5, 3] },
    ],
    { threshold: 0.1 },
  );

  assert.deepEqual(result.point, [2, 3]);
  assert.deepEqual(
    result.guides.map((guide) => [
      guide.axis,
      guide.coordinate,
      guide.targetId,
    ]),
    [
      ["vertical", 2, "wall"],
      ["horizontal", 3, "device"],
    ],
  );
  assert.deepEqual(
    result.guides.map((guide) => guide.source),
    [
      [2, 3],
      [2, 3],
    ],
  );
});

test("wall translations align their midpoint without changing wall length", () => {
  const result = snapTranslationToAlignment(
    [
      [0, 0],
      [2, 0],
      [1, 0],
    ],
    [{ id: "device", kind: "device", point: [1, 1] }],
    [0.05, 0.97],
    { threshold: 0.1 },
  );

  assert.deepEqual(result.delta, [0, 1]);
  assert.equal(result.guides.length, 2);
});

test("wall midpoint translation does not snap along the wall toward nearby endpoints", () => {
  const result = snapTranslationToAlignment(
    [[1, 0]],
    [{ id: "nearby-endpoint", kind: "wall", point: [1.08, 1] }],
    [0.03, 0.96],
    { threshold: 0.1, axes: [1] },
  );

  assert.deepEqual(result.delta, [0.03, 1]);
  assert.deepEqual(
    result.guides.map((guide) => guide.axis),
    ["horizontal"],
  );
});

test("wall midpoint drag keeps endpoint magnetism behind Shift", async () => {
  const editorSource = await readFile(
    new URL("../apps/web/src/app/floorplan-editor.js", import.meta.url),
    "utf8",
  );
  assert.match(editorSource, /snapToWalls:\s*e\.shiftKey/);
  assert.match(
    editorSource,
    /axes:\s*e\.shiftKey\s*\?\s*\[0, 1\]\s*:\s*normalAxes/,
  );
});

test("short wall endpoints cannot steal the midpoint translation handle", async () => {
  const endpointRadius = wallEndpointHitRadius(0.8, 0.28);
  assert.ok(Math.abs(endpointRadius - 0.176) < 1e-9);
  assert.ok(endpointRadius < 0.28);
  assert.equal(isWallTranslationHandleHit([0.4, 0.22], [0.4, 0.22]), true);
  assert.equal(isWallTranslationHandleHit([0, 0], [0.4, 0.22]), false);

  const editorSource = await readFile(
    new URL("../apps/web/src/app/floorplan-editor.js", import.meta.url),
    "utf8",
  );
  assert.match(editorSource, /r:\s*endpointHitRadius/);
  assert.match(
    editorSource,
    /isWallTranslationHandleHit\([\s\S]*?startWallTranslation\(event\)/,
  );
});

test("new walls and devices use alignment guides before placement", () => {
  const targets = [
    { id: "wall-target", kind: "wall", point: [2, 0] },
    { id: "device-target", kind: "device", point: [5, 3] },
  ];
  const devicePlacement = snapCreationPointToAlignment([1.94, 3.04], targets, {
    threshold: 0.1,
  });
  const horizontalWall = snapCreationPointToAlignment([1.94, 3.04], targets, {
    threshold: 0.1,
    prioritySnap: { kind: "axis" },
    draftStart: [0, 3.04],
  });

  assert.deepEqual(devicePlacement.point, [2, 3]);
  assert.deepEqual(horizontalWall.point, [2, 3.04]);
  assert.deepEqual(horizontalWall.guides.map((guide) => guide.axis).sort(), [
    "horizontal",
    "vertical",
  ]);
});

test("endpoint and wall snaps keep priority over creation alignment", () => {
  const result = snapCreationPointToAlignment(
    [1.96, 2.04],
    [{ id: "device", kind: "device", point: [2, 2] }],
    {
      threshold: 0.1,
      prioritySnap: { kind: "endpoint" },
      draftStart: [0, 0],
    },
  );

  assert.deepEqual(result, { point: [1.96, 2.04], guides: [] });
});

test("aligned wall chains merge and keep openings at their world positions", () => {
  const walls = [
    { id: "middle", start: [2, 0], end: [4, 0], thickness: 0.14 },
    { id: "right", start: [6, 0], end: [4, 0], thickness: 0.14 },
    { id: "left", start: [0, 0], end: [2, 0], thickness: 0.14 },
    { id: "branch", start: [2, 0], end: [2, 2], thickness: 0.14 },
  ];
  const openings = [{ id: "door", wallId: "right", offset: 1.5, width: 0.8 }];
  const result = mergeWallChain(walls, openings, ["left", "middle", "right"], {
    retainedWallId: "middle",
  });

  assert.equal(result.ok, true);
  assert.equal(result.retainedWallId, "middle");
  assert.deepEqual(result.removedWallIds.sort(), ["left", "right"]);
  const merged = result.walls.find((wall) => wall.id === "middle");
  assert.deepEqual(merged.start, [0, 0]);
  assert.deepEqual(merged.end, [6, 0]);
  assert.equal(
    result.walls.some((wall) => wall.id === "branch"),
    true,
  );
  assert.deepEqual(result.openings[0], {
    id: "door",
    wallId: "middle",
    offset: 4.5,
    width: 0.8,
  });
});

test("bent wall chains are rejected by merge", () => {
  const walls = [
    { id: "first", start: [0, 0], end: [2, 0] },
    { id: "second", start: [2, 0], end: [2, 2] },
  ];
  const result = mergeWallChain(walls, [], ["first", "second"]);

  assert.equal(result.ok, false);
  assert.equal(result.reason, "not-collinear");
  assert.strictEqual(result.walls, walls);
});

test("a wall splits at an exact distance and moves later openings", () => {
  const walls = [
    {
      id: "wall",
      start: [1, 2],
      end: [7, 2],
      thickness: 0.14,
      height: 2.8,
      virtual: true,
    },
  ];
  const openings = [
    { id: "left-window", wallId: "wall", offset: 1, width: 0.6 },
    { id: "right-door", wallId: "wall", offset: 5, width: 0.8 },
  ];
  const result = splitWallSegment(walls, openings, "wall", 3, {
    createWallId: () => "wall-split",
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.splitPoint, [4, 2]);
  assert.deepEqual(result.walls, [
    { ...walls[0], end: [4, 2] },
    { ...walls[0], id: "wall-split", start: [4, 2] },
  ]);
  assert.deepEqual(result.openings, [
    openings[0],
    { ...openings[1], wallId: "wall-split", offset: 2 },
  ]);
  assert.equal(isVirtualWall(result.walls[1]), true);
});

test("wall split rejects endpoints and door or window intersections", () => {
  const walls = [{ id: "wall", start: [0, 0], end: [4, 0] }];
  const openings = [{ id: "door", wallId: "wall", offset: 2, width: 0.9 }];

  assert.equal(
    splitWallSegment(walls, openings, "wall", 0.1).reason,
    "invalid-distance",
  );
  assert.equal(
    splitWallSegment(walls, openings, "wall", 2).reason,
    "intersects-opening",
  );
  assert.deepEqual(pointAlongWall(walls[0], 1.5), [1.5, 0]);
});

test("schema migrates legacy transparent boundaries to virtual walls", () => {
  const project = normalizeFloorplanProject({
    name: "virtual-wall-test",
    floors: [
      {
        id: "floor",
        name: "一层",
        level: 1,
        height: 2.8,
        rooms: [],
        openings: [],
        devices: [],
        furniture: [],
        walls: [
          { id: "legacy", start: [0, 0], end: [1, 0], transparent: true },
          { id: "current", start: [0, 1], end: [1, 1], virtual: true },
        ],
      },
    ],
  });

  assert.equal(project.floors[0].walls[0].virtual, true);
  assert.equal(project.floors[0].walls[0].transparent, undefined);
  assert.equal(project.floors[0].walls[1].virtual, true);
  assert.equal(isVirtualWall(project.floors[0].walls[0]), true);
});

test("virtual walls still close rooms in the topology model", () => {
  const walls = [
    { id: "top", start: [0, 0], end: [4, 0] },
    { id: "right", start: [4, 0], end: [4, 3] },
    { id: "bottom", start: [4, 3], end: [0, 3] },
    { id: "virtual-left", start: [0, 3], end: [0, 0], virtual: true },
  ];

  const rooms = deriveRoomsFromWalls(walls);
  assert.equal(rooms.length, 1);
  assert.equal(rooms[0].polygon.length, 4);
});

test("collinear wall segments expose one handle span and translate as a chain", () => {
  const walls = [
    { id: "left", start: [0, 0], end: [2, 0] },
    { id: "right", start: [4, 0], end: [2, 0] },
    { id: "attached", start: [2, 0], end: [2, 2] },
  ];
  const inspection = getCollinearWallChain(walls, ["left", "right"]);

  assert.equal(inspection.ok, true);
  assert.deepEqual(inspection.start, [0, 0]);
  assert.deepEqual(inspection.end, [4, 0]);
  assert.equal(inspection.startWallId, "left");
  assert.equal(inspection.endWallId, "right");

  const result = transformCollinearWallChain(
    walls,
    [{ id: "door", wallId: "right", offset: 1, width: 0.8 }],
    ["left", "right"],
    { type: "translate", delta: [1, 1] },
  );
  assert.equal(result.ok, true);
  assert.deepEqual(result.walls, [
    { ...walls[0], start: [1, 1], end: [3, 1] },
    { ...walls[1], start: [5, 1], end: [3, 1] },
    { ...walls[2], start: [3, 1] },
  ]);
  assert.deepEqual(result.openings, [
    { id: "door", wallId: "right", offset: 1, width: 0.8 },
  ]);
});

test("resizing a collinear wall chain moves internal joints proportionally", () => {
  const walls = [
    { id: "left", start: [0, 0], end: [2, 0] },
    { id: "right", start: [2, 0], end: [4, 0] },
  ];
  const result = transformCollinearWallChain(
    walls,
    [{ id: "window", wallId: "left", offset: 1, width: 0.5 }],
    ["left", "right"],
    {
      type: "resize",
      endpoint: "start",
      point: [-2, 0],
    },
  );

  assert.equal(result.ok, true);
  assert.deepEqual(result.walls, [
    { ...walls[0], start: [-2, 0], end: [1, 0] },
    { ...walls[1], start: [1, 0], end: [4, 0] },
  ]);
  assert.deepEqual(result.openings, [
    { id: "window", wallId: "left", offset: 1.5, width: 0.5 },
  ]);
});

test("devices align to the line between the farthest selected pair", () => {
  const devices = [
    { id: "left", position: [0, 1, 0] },
    {
      id: "middle",
      position: [1, 1, 1],
      lightStrip: {
        shape: "line",
        points: [
          [1, 1],
          [2, 1],
        ],
      },
    },
    { id: "right", position: [4, 1, 0] },
    { id: "other", position: [7, 1, 3] },
  ];
  const result = alignDevicesOnLine(devices, ["left", "middle", "right"]);

  assert.equal(result.ok, true);
  assert.deepEqual(result.devices[1].position, [1, 1, 0]);
  assert.deepEqual(result.devices[1].lightStrip.points, [
    [1, 0],
    [2, 0],
  ]);
  assert.strictEqual(result.devices[3], devices[3]);
  assert.equal(
    inspectDeviceLine(result.devices, ["left", "middle", "right"]).aligned,
    true,
  );
});

test("already aligned devices are distributed evenly with fixed endpoints", () => {
  const devices = [
    { id: "left", position: [0, 0, 0] },
    { id: "near", position: [0.5, 0, 0] },
    { id: "far", position: [3.5, 0, 0] },
    { id: "right", position: [6, 0, 0] },
  ];
  const result = distributeDevicesEvenly(
    devices,
    devices.map((device) => device.id),
  );

  assert.equal(result.ok, true);
  assert.deepEqual(
    result.devices.map((device) => device.position),
    [
      [0, 0, 0],
      [2, 0, 0],
      [4, 0, 0],
      [6, 0, 0],
    ],
  );
});

test("cabinet junction handles take priority over the bounded rotation hit area", async () => {
  const editor = await readFile(
    new URL("../apps/web/src/app/floorplan-editor.js", import.meta.url),
    "utf8",
  );
  const selectedHandles = editor.slice(
    editor.indexOf('className: "selected-furniture-handles"'),
  );
  const rotationHitArea = selectedHandles.indexOf(
    '"furniture-handle-hitarea rotate"',
  );
  const junctionHandle = selectedHandles.indexOf('"cabinet-junction-handle"');
  assert.ok(rotationHitArea >= 0 && junctionHandle > rotationHitArea);
  assert.match(
    selectedHandles,
    /R\.kind === "cabinet"\s*\? Math\.min\(0\.28, cabinetLabelUnit \* 18\)/,
  );
});

test("furniture pointer translation preserves the grab offset and snaps movement", () => {
  assert.deepEqual(
    translateFurnitureFromPointer([2, 3], [2.4, 3.2], [3.1, 4.05]),
    [2.7, 3.8499999999999996],
  );
  assert.deepEqual(
    translateFurnitureFromPointer([2, 3], [2.4, 3.2], [3.1, 4.05], 0.1),
    [2.7, 3.8],
  );
  assert.deepEqual(
    translateFurnitureFromPointer([2, 3], [2.4, 3.2], [2.4, 3.2], 0.1),
    [2, 3],
  );
});

test("furniture uses left-click selection and right-button whole-object drag", async () => {
  const editor = await readFile(
    new URL("../apps/web/src/app/floorplan-editor.js", import.meta.url),
    "utf8",
  );
  assert.match(editor, /event\.button !== 2/);
  assert.match(
    editor,
    /onPointerDownCapture: \(r\) =>\s*dragFurnitureWithRightButton\(e, r\)/,
  );
  assert.match(
    editor,
    /onPointerDownCapture: \(e\) =>\s*dragFurnitureWithRightButton\(R, e\)/,
  );
  assert.match(
    editor,
    /onClick: \(r\) =>\s*kn\(\{ type: "furniture", id: e\.id \}, r\)/,
  );
});

test("changing storey height keeps full-height walls aligned and preserves shorter walls", () => {
  const floor = {
    height: 2.8,
    walls: [
      { id: "full", height: 2.8 },
      { id: "short", height: 2.1 },
      { id: "legacy-tall", height: 3 },
    ],
  };
  const lowered = resizeFloorHeight(floor, 2.64);
  assert.equal(lowered.height, 2.64);
  assert.deepEqual(
    lowered.walls.map((wall) => wall.height),
    [2.64, 2.1, 2.64],
  );
  assert.deepEqual(
    floor.walls.map((wall) => wall.height),
    [2.8, 2.1, 3],
  );
  assert.deepEqual(
    resizeFloorHeight(lowered, 3).walls.map((wall) => wall.height),
    [3, 2.1, 3],
  );
});

test("3D scene uses physical furniture height instead of presentation compression", async () => {
  const scene = await readFile(
    new URL("../apps/web/src/app/scene.js", import.meta.url),
    "utf8",
  );
  assert.match(scene, /scale: \[1, 1, 1\],\s*children: t\.jsxs\(Gt/);
  assert.match(scene, /wallHeight = Math\.min\(S\.height, e\.height\)/);
  assert.doesNotMatch(scene, /function xn\(/);
});

test("home uses the published sidebar and keeps connection and voice controls", async () => {
  const home = await readFile(
    new URL("../apps/web/src/app/home-view.js", import.meta.url),
    "utf8",
  );
  const app = await readFile(
    new URL("../apps/web/src/app/app.js", import.meta.url),
    "utf8",
  );
  assert.match(home, /e\.jsx\(PublishedSidebar, \{ projectId: t\.id, entities: F/);
  assert.doesNotMatch(home, /e\.jsx\(mn, \{/);
  assert.match(
    home,
    /Xe &&\s*a !== "loading" &&\s*e\.jsxs\("button", \{\s*className: "home-tools-item"/,
  );
  assert.doesNotMatch(home, /className: `corner-dock-action voice-toggle/);
  assert.match(app, /voiceAssistant: r\.jsx\(et, \{\}\)/);
});

test("washer runtime resolves bound status, remaining time, and standby", () => {
  const effect = {
    type: "top-load-washer",
    statusCapabilityId: "running-status",
    remainingCapabilityId: "remaining-time",
    activeStates: "running,washing",
  };
  const entity = {
    deviceCapabilityBindings: {
      "running-status": ["sensor.washer_running_status"],
      "remaining-time": ["sensor.washer_remain_time"],
    },
    deviceEntities: [
      { entityId: "sensor.washer_running_status", state: "washing" },
      { entityId: "sensor.washer_remain_time", state: "1.5", attributes: { unit_of_measurement: "h" } },
    ],
  };
  const resolved = resolveWasherRuntime(effect, entity);
  assert.equal(resolved.running, true);
  assert.equal(resolved.state, "washing");
  assert.equal(resolved.remainingMinutes, 90);
  assert.equal(resolved.statusEntityId, "sensor.washer_running_status");
  assert.equal(resolved.remainingEntityId, "sensor.washer_remain_time");
  entity.deviceEntities[0].state = "standby";
  assert.equal(resolveWasherRuntime(effect, entity).running, false);
  assert.equal(resolveWasherRuntime(undefined, entity), null);
  const automatic = resolveWasherRuntime(
    { type: "top-load-washer" },
    {
      deviceOperationalState: entity.deviceEntities[0],
      deviceEntities: entity.deviceEntities,
    },
  );
  assert.equal(automatic.remainingMinutes, 90);
  assert.equal(automatic.running, false);
  entity.deviceEntities[0].state = "work";
  entity.deviceEntities[1].state = "4";
  entity.deviceEntities[1].attributes.unit_of_measurement = "min";
  const working = resolveWasherRuntime(
    { type: "top-load-washer" },
    {
      deviceOperationalState: entity.deviceEntities[0],
      deviceEntities: entity.deviceEntities,
    },
  );
  assert.equal(working.running, true);
  assert.equal(working.remainingMinutes, 4);
  assert.equal(
    washerRuntimeLabel(working, new Date(2026, 8, 30, 12, 0).getTime()),
    "剩余 4 分钟 · 预计 12:04 结束",
  );
  assert.equal(washerRuntimeLabel(automatic), null);
  assert.equal(
    resolveWasherRuntime({ type: "top-load-washer", activeStates: "" }, entity).running,
    false,
  );
  assert.equal(
    normalizeModelTemplate({
      id: "custom.washer-test",
      runtimeEffect: effect,
    }).runtimeEffect.statusCapabilityId,
    "running-status",
  );
  assert.equal(
    normalizeModelTemplate({
      id: "custom.washer-disabled",
      runtimeEffect: { type: "top-load-washer", activeStates: "" },
    }).runtimeEffect.activeStates,
    "",
  );
});

test("washer chip templates resolve device state and attribute variables", () => {
  const effect = {
    type: "top-load-washer",
    statusCapabilityId: "running-status",
    remainingCapabilityId: "remaining-time",
  };
  const template = normalizeDeviceTemplate({
    id: "custom.washer-chip",
    capabilities: [
      { capabilityId: "running-status", name: "运行状态" },
      { capabilityId: "remaining-time", name: "剩余时间" },
      { capabilityId: "program", name: "程序" },
    ],
    statusDisplay: {
      titleTemplate: "{device.name} · {程序}",
      statusTemplate: "{运行状态} | {剩余时间}分钟 | {{time.now} + {剩余时间}} | {剩余时间.属性.unit_of_measurement}",
    },
  });
  assert.equal(template.statusDisplay.titleTemplate, "{device.name} · {程序}");
  const aggregated = aggregateDeviceObjects({
    devices: [{ id: "washer", name: "波轮洗衣机" }],
    entities: [{ entityId: "switch.washer_power", deviceId: "washer", domain: "switch", state: "on" }],
    templates: [template],
    bindings: [{ deviceId: "washer", deviceTemplateId: template.id }],
  });
  assert.deepEqual(aggregated[0].statusDisplay, template.statusDisplay);
  assert.equal(aggregated[0].capabilityNames["remaining-time"], "剩余时间");
  const start = new Date(2026, 8, 30, 13, 48).getTime();
  const runtime = resolveWasherRuntime(effect, {
    deviceDisplayName: "波轮洗衣机",
    deviceCapabilityNames: aggregated[0].capabilityNames,
    deviceCapabilityBindings: {
      "running-status": ["sensor.washer_running_status"],
      "remaining-time": ["sensor.washer_remain_time"],
      program: ["sensor.washer_mode"],
    },
    deviceEntities: [
      { entityId: "sensor.washer_running_status", state: "work", attributes: { program: "标准" } },
      { entityId: "sensor.washer_remain_time", state: "8", lastUpdated: new Date(start).toISOString(), attributes: { unit_of_measurement: "min" } },
      { entityId: "sensor.washer_mode", state: "快速" },
    ],
  }, template.statusDisplay);
  assert.equal(washerRuntimeTitle(runtime, "默认名称", start), "波轮洗衣机 · 快速");
  assert.equal(washerRuntimeLabel(runtime, start), "work | 8分钟 | 13:56 | min");
  const updatedRuntime = {
    ...runtime,
    deviceEntities: runtime.deviceEntities.map((entity) =>
      entity.entityId === "sensor.washer_remain_time"
        ? { ...entity, state: "3", lastUpdated: new Date(start + 5 * 60_000).toISOString() }
        : entity,
    ),
  };
  assert.equal(
    washerRuntimeLabel(updatedRuntime, start + 5 * 60_000),
    "work | 3分钟 | 13:56 | min",
  );
  assert.equal(
    washerRuntimeLabel({ ...updatedRuntime, statusTemplate: "{time.now} | {剩余时间} | {{time.now} + {剩余时间}}" }, start + 5 * 60_000),
    "13:53 | 3 | 13:56",
  );
  assert.equal(
    washerRuntimeLabel({ ...runtime, statusTemplate: "{{time.now} + {程序}}" }, start),
    "—",
  );
  const hourly = {
    ...runtime,
    deviceEntities: runtime.deviceEntities.map((entity) =>
      entity.entityId === "sensor.washer_remain_time"
        ? { ...entity, state: "1", attributes: { unit_of_measurement: "h" } }
        : entity,
    ),
    statusTemplate: "{剩余时间}小时 | {{time.now} + {剩余时间}}",
  };
  assert.equal(washerRuntimeLabel(hourly, start + 30 * 60_000), "1小时 | 15:18");
  assert.equal(
    washerRuntimeLabel({ ...runtime, statusTemplate: "{capability.remaining-time.state|countdown}分钟 | {{time.now} + {capability.remaining-time.state}}" }, start + 5 * 60_000),
    "3分钟 | 13:56",
  );
  assert.equal(
    washerRuntimeLabel({ ...runtime, capabilityNames: { ...runtime.capabilityNames, program: "剩余时间" }, statusTemplate: "{剩余时间}" }, start),
    "—",
  );
  assert.equal(washerRuntimeLabel({ ...runtime, running: false }, start), null);
  assert.equal(washerRuntimeTitle({ ...runtime, running: false }, "默认名称", start), "默认名称");
});

test("new project runtime owns washer chip text configuration", async () => {
  const editor = await readFile(
    new URL("../apps/web/src/app/device-development-center/project-runtime.jsx", import.meta.url),
    "utf8",
  );
  assert.match(editor, /浮窗标题模板/);
  assert.match(editor, /运行中文本模板/);
  assert.match(editor, /\{\{time\.now\} \+ \{剩余时间\}\}/);
  const app = await readFile(new URL("../apps/web/src/app/app.js", import.meta.url), "utf8");
  assert.match(app, /deviceStatusDisplay: device\?\.statusDisplay/);
  assert.match(app, /deviceCapabilityNames: device\?\.capabilityNames/);
});

test("placed devices stream their status and remaining-time sibling entities", () => {
  const project = {
    floors: [{
      devices: [{ entityId: "switch.washer_power" }],
      rooms: [],
    }],
  };
  const entities = [
    { entityId: "switch.washer_power", deviceId: "washer" },
    { entityId: "sensor.washer_running_status", deviceId: "washer" },
    { entityId: "sensor.washer_remain_time", deviceId: "washer" },
    { entityId: "sensor.other_state", deviceId: "other" },
  ];
  assert.deepEqual([...collectLiveEntityIds(project, entities)].sort(), [
    "sensor.washer_remain_time",
    "sensor.washer_running_status",
    "switch.washer_power",
  ]);
  assert.deepEqual([...collectLiveEntityIds({ floors: [] }, entities)], []);
});

test("placed entity-only models stream external entities without claiming their device", () => {
  const project = {floors:[{devices:[{entityId:"sensor.project_car",deviceId:"project:car"}],rooms:[]}]};
  const entities = [
    {entityId:"sensor.project_car",deviceId:"project:car"},
    {entityId:"device_tracker.car"},
    {entityId:"sensor.charge",deviceId:"other"},
    {entityId:"sensor.unrelated",deviceId:"other"},
  ];
  const binding = {deviceId:"project:car",extraEntityIds:["device_tracker.car"],
    capabilityBindings:{charge:["sensor.charge"]},capabilityMappings:{position:{entityId:"sensor.position"}}};
  assert.deepEqual([...collectLiveEntityIds(project,entities,[binding])].sort(),
    ["device_tracker.car","sensor.charge","sensor.position","sensor.project_car"]);
  assert.deepEqual([...collectLiveEntityIds({floors:[]},entities,[binding])],[]);
  const modified={...binding,extraEntityIds:["device_tracker.replacement"]};
  const refreshed=collectLiveEntityIds(project,entities,[modified]);
  assert.equal(refreshed.has("device_tracker.replacement"),true);
  assert.equal(refreshed.has("device_tracker.car"),false);
});

test("homepage presence keeps streaming after deleting its model and binding", () => {
  const entities = [
    {entityId:"device_tracker.car",domain:"device_tracker",state:"home",deviceId:null},
    {entityId:"person.owner",domain:"person",state:"home"},
    {entityId:"sensor.unused",domain:"sensor"},
  ];
  const project={floors:[{devices:[{entityId:"light.hall"}],rooms:[]}]};
  const before=collectLiveEntityIds(project,entities,[{deviceId:"deleted",extraEntityIds:["sensor.unused"]}]);
  const after=collectLiveEntityIds(project,entities,[]);
  assert.deepEqual([...after].sort(),["device_tracker.car","light.hall","person.owner"]);
  assert.deepEqual([...after],[...before]);
  assert.equal(after.has("sensor.unused"),false);
  assert.equal(collectLiveEntityIds({floors:[]},entities).has("device_tracker.car"),true);
});

test("default washer status follows HA remaining-time updates", () => {
  const start = new Date(2026, 8, 30, 13, 48).getTime();
  const runtime = {
    running: true,
    remainingMinutes: 8,
    remainingUpdatedAt: new Date(start).toISOString(),
  };
  assert.equal(washerRuntimeLabel(runtime, start), "剩余 8 分钟 · 预计 13:56 结束");
  assert.equal(washerRuntimeLabel({ ...runtime, remainingMinutes: 3 }, start + 5 * 60_000), "剩余 3 分钟 · 预计 13:56 结束");
  assert.equal(washerRuntimeLabel({ ...runtime, running: false }, start), null);
});

test("scene device loading uses aggregated bindings instead of the raw HA registry", async () => {
  const app = await readFile(
    new URL("../apps/web/src/app/app.js", import.meta.url),
    "utf8",
  );
  assert.match(
    app,
    /async function fetchHaDevices\(\)\s*\{[\s\S]*?fetch\("\.\/api\/device-platform\/devices"\)/,
  );
  assert.match(app, /deviceCapabilityBindings: device\?\.capabilityBindings/);
  assert.match(app, /const deviceEntities = \(device\?\.entityIds \?\? \[\]\)/);
});

test("washer running chip stays visible without selection and hides when idle", async () => {
  const scene = await readFile(
    new URL("../apps/web/src/app/scene.js", import.meta.url),
    "utf8",
  );
  assert.match(scene, /Z =\s*washerRuntime !== null\s*\? washerRuntime\.running/);
  assert.match(scene, /Z &&\s*t\.jsx\(ni, \{/);
});


test("runtime no longer initializes the removed online library in either deployment mode",()=>{for(const env of [{SUPERVISOR_TOKEN:'test-only'},{HA3D_MODE:'standalone',HA3D_MODEL_LIBRARY_GITEA_URL:'https://unused.example'}])assert.equal('modelLibrary' in loadRuntimeConfig(env),false);});
