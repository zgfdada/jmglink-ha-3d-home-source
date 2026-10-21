import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import Fastify from "fastify";

import { aggregateDeviceObjects } from "../apps/server/src/device-platform/deviceAggregation.js";
import { EntityHistoryStore } from "../apps/server/src/ha/EntityHistoryStore.js";
import { HomeAssistantClient } from "../apps/server/src/ha/HomeAssistantClient.js";
import { registerHaRoutes } from "../apps/server/src/routes/haRoutes.js";

test("development-center refresh endpoint invokes a fresh HA discovery scan", async () => {
  const app = Fastify();
  let scans = 0;
  try {
    await registerHaRoutes(app, {
      refreshDiscovery: async () => {
        scans += 1;
        return true;
      },
    });
    const response = await app.inject({
      method: "POST",
      url: "/api/ha/discovery/refresh",
    });
    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.json(), { refreshed: true });
    assert.equal(scans, 1);
  } finally {
    await app.close();
  }
});

test("online discovery uses only current HA registries while offline discovery keeps history", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "ha3d-current-registry-"));
  let history;
  try {
    history = await EntityHistoryStore.create(directory);
    await history.rememberDevices([
      { id: "old-washer", name: "旧洗衣机", areaId: "laundry" },
    ]);
    await history.rememberEntities([
      {
        entityId: "sensor.washer_old",
        name: "旧状态",
        state: "idle",
        deviceId: "old-washer",
      },
      {
        entityId: "sensor.washer_shared",
        name: "旧洗衣机状态",
        state: "idle",
        deviceId: "old-washer",
      },
    ]);

    const client = new HomeAssistantClient(
      {
        mode: "standalone",
        ha: { token: "test-token", restUrl: "http://127.0.0.1:8123/api" },
      },
      history,
    );
    assert.deepEqual(client.getDevices().map((device) => device.id), [
      "old-washer",
    ]);
    assert.equal(client.getEntities().every((entity) => entity.historical), true);

    client.fetchStates = async () => [
      {
        entity_id: "sensor.washer_shared",
        state: "running",
        attributes: { friendly_name: "新洗衣机状态" },
      },
      {
        entity_id: "sensor.washer_new",
        state: "42",
        attributes: { friendly_name: "新洗衣机剩余时间" },
      },
    ];
    await client.syncFromRest();
    assert.deepEqual(client.getDevices().map((device) => device.id), [
      "old-washer",
    ], "REST 已通但 WebSocket 尚未就绪时仍使用离线历史");

    const socket = {};
    client.socket = socket;
    client.websocketReady = true;
    assert.deepEqual(client.getDevices(), [], "当前注册表未完成前不展示旧设备");
    assert.deepEqual(
      client.getEntities().map((entity) => entity.entityId).sort(),
      ["sensor.washer_new", "sensor.washer_shared"],
    );
    assert.equal(client.getEntities().every((entity) => !entity.deviceId), true);

    client.sendCommand = async (_socket, command) => {
      if (command === "config/area_registry/list")
        return [{ area_id: "laundry", name: "阳台" }];
      if (command === "config/device_registry/list")
        return [{ id: "new-washer", name: "新洗衣机", area_id: "laundry" }];
      if (command === "config/entity_registry/list")
        return ["sensor.washer_shared", "sensor.washer_new"].map(
          (entityId) => ({
            id: `registry-${entityId}`,
            entity_id: entityId,
            device_id: "new-washer",
            platform: "washer",
          }),
        );
      throw new Error(`Unexpected command: ${command}`);
    };
    await client.syncRegistriesFromWebSocket(socket);

    const current = aggregateDeviceObjects({
      devices: client.getDevices(),
      entities: client.getEntities(),
      templates: [],
      bindings: [],
    });
    assert.deepEqual(current.map((device) => device.id), ["new-washer"]);
    assert.deepEqual(current[0].entityIds.sort(), [
      "sensor.washer_new",
      "sensor.washer_shared",
    ]);
    assert.equal(current[0].historical, false);

    client.handleWebSocketMessage(socket, JSON.stringify({
      type: "event",
      event: {
        event_type: "state_changed",
        data: { entity_id: "sensor.washer_new", new_state: null },
      },
    }));
    assert.deepEqual(client.getEntities().map((entity) => entity.entityId), [
      "sensor.washer_shared",
    ], "HA 删除实体的事件应立即从在线快照移除");

    client.fetchStates = async () => [];
    client.sendCommand = async () => [];
    assert.equal(await client.refreshDiscovery(), true);
    assert.deepEqual(client.getDevices(), [], "手动扫描必须重新读取当前 HA 注册表");
    assert.deepEqual(client.getEntities(), []);
    assert.equal(client.getStatus().deviceCount, 0);

    client.websocketReady = false;
    assert.equal(await client.refreshDiscovery(), false);
    assert.deepEqual(
      client.getDevices().map((device) => device.id).sort(),
      ["new-washer", "old-washer"],
      "离线时才恢复已记录的设备",
    );
    assert.equal(client.getEntities().every((entity) => entity.historical), true);
    assert.equal(client.getStatus().deviceCount, 2);
  } finally {
    await history?.close();
    await rm(directory, { recursive: true, force: true });
  }
});
