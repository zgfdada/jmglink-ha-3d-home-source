import test from "node:test";
import assert from "node:assert/strict";
import { missingDevicePlacements, replacementCandidates, replaceDevicePlacement } from "../apps/web/src/domain/missing-device-placement.js";
import { buildDeviceLibrary } from "../apps/web/src/domain/device-library.js";
import { normalizeFloorplanProject } from "../packages/schema/src/index.js";

const old = { id: "placed", entityId: "switch.old", deviceId: "washer", position: [1, 0, 1.7], rotation: [0, -1.57, 0], scale: [1, 2, 1], roomId: "balcony", verticalReference: { targetType: "floor", offset: 0 }, modelId: "washer" };
const current = { entityId: "switch.new", deviceId: "washer", name: "洗衣机", domain: "switch", deviceTemplateId: "custom.washer" };
const entities = { [current.entityId]: current };

test("在线时标记失效摆放，离线和 unknown/unavailable 不误报", () => {
  const floor = { devices: [old] };
  assert.deepEqual(missingDevicePlacements(floor, entities, false), []);
  assert.deepEqual(missingDevicePlacements(floor, entities, true), [old]);
  assert.deepEqual(missingDevicePlacements(floor, {}, true), [old]);
  assert.deepEqual(replacementCandidates(floor, old, {}), []);
  for (const state of ["unknown", "unavailable"]) assert.deepEqual(missingDevicePlacements(floor, { "switch.old": { state } }, true), []);
});

test("替换保留空间信息并恢复实体关联；删除后设备重新可放置", () => {
  const updated = replaceDevicePlacement(old, current, { modelId: "washer", customModel: { source: "model.glb" } }, "switch");
  for (const key of ["id", "position", "rotation", "scale", "roomId", "verticalReference"]) assert.deepEqual(updated[key], old[key]);
  assert.equal(updated.entityId, current.entityId);
  assert.equal(updated.deviceTemplateId, "custom.washer");
  assert.equal(updated.name, "洗衣机");
  const normalized = normalizeFloorplanProject({ floors: [{ id: "floor", devices: [updated] }] });
  assert.equal(normalized.floors[0].devices[0].name, "洗衣机");
  assert.deepEqual(missingDevicePlacements({ devices: [updated] }, entities, true), []);
  assert.equal(buildDeviceLibrary(Object.values(entities), [updated], () => true, () => 0).available.length, 0);
  assert.equal(buildDeviceLibrary(Object.values(entities), [], () => true, () => 0).available.length, 1);
  const plain = replaceDevicePlacement(updated, { entityId: "light.other" }, { modelId: "light" }, "light");
  assert.equal(plain.deviceTemplateId, undefined);
  assert.equal(plain.customModel, undefined);
});

test("候选优先同设备，排除其他已摆放实体及同物理设备", () => {
  const other = { entityId: "switch.other", deviceId: "occupied", name: "其他设备" };
  const all = { ...entities, other, sibling: { ...other, entityId: "sensor.other" }, free: { entityId: "light.free", name: "灯" } };
  const candidates = replacementCandidates({ devices: [old, { id: "other", ...other }] }, old, all);
  assert.deepEqual(candidates.map((entity) => entity.entityId), [current.entityId, "light.free"]);
});
