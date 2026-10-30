import test from "node:test";
import assert from "node:assert/strict";
import {
  doorSensorCandidates,
  isDoorSensorOpen,
} from "../apps/web/src/domain/door-sensor.js";

test("门磁候选包含普通 sensor，不隐藏辅助或不可用实体，支持名称及 ID 多关键词搜索", () => {
  const list = [
    {
      entityId: "sensor.entry_door_state",
      name: "入户门 门状态",
      domain: "sensor",
      state: "已上锁",
      attributes: { device_class: "enum" },
      hidden: true,
    },
    {
      entityId: "binary_sensor.balcony_contact",
      name: "阳台门磁",
      domain: "binary_sensor",
      state: "unavailable",
    },
    { entityId: "sensor.temperature", name: "室内温度", domain: "sensor" },
    { entityId: "switch.door_light", name: "入户门灯", domain: "switch" },
    { entityId: "binary_sensor.motion", name: "人体", domain: "binary_sensor" },
  ];
  const entities = Object.fromEntries(list.map((e) => [e.entityId, e]));
  assert.equal(doorSensorCandidates(entities).length, 4);
  assert.deepEqual(
    doorSensorCandidates(entities, "入户门 DOOR_STATE").map((e) => e.entityId),
    ["sensor.entry_door_state"],
  );
  assert.equal(doorSensorCandidates(entities, "阳台")[0].state, "unavailable");
  assert.equal(doorSensorCandidates(entities, "不存在").length, 0);
  assert.equal(
    doorSensorCandidates(entities)[0].entityId,
    "sensor.entry_door_state",
  );
});

test("2D 与 3D 共用物理开合判断，中文枚举与传统门磁兼容", () => {
  for (const state of [
    "on",
    "OPEN",
    "opened",
    "opening",
    "detected",
    "unsafe",
    "unlocked",
    "门虚掩",
    "门未关(童锁开，反锁关）",
    "门未关好（童锁关，反锁开）",
    "已打开",
  ])
    assert.equal(isDoorSensorOpen({ state }), true, state);
  for (const state of [
    "off",
    "closed",
    "unknown",
    "unavailable",
    "offline",
    "已上锁",
    "已开锁",
    "已开锁(童锁开，反锁开)",
    "解除门虚掩",
    "解除门虚掩(童锁关，反锁开)",
    "已关闭",
    "门已关闭",
  ])
    assert.equal(isDoorSensorOpen({ state }), false, state);
  assert.equal(isDoorSensorOpen(undefined), false);
});
