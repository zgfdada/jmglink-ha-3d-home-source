import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { WebSocket } from "ws";
import { normalizeAddonRuntimeOptions } from "../apps/server/src/config/addonRuntimeOptions.js";
import { EntityHistoryStore } from "../apps/server/src/ha/EntityHistoryStore.js";
import {
  createResourceMonitor,
  normalizeResourceLogIntervalMinutes,
} from "../apps/server/src/observability/resourceMonitor.js";
import { ClientGateway } from "../apps/server/src/websocket/clientGateway.js";

test("add-on runtime limits use safe defaults and clamp configured values", () => {
  assert.deepEqual(normalizeAddonRuntimeOptions(), {
    nodeMaxOldSpaceMb: 256,
    niceLevel: 10,
    resourceLogIntervalMinutes: 5,
  });
  assert.deepEqual(
    normalizeAddonRuntimeOptions({
      node_max_old_space_mb: 9999,
      nice_level: -4,
      resource_log_interval_minutes: 0,
    }),
    {
      nodeMaxOldSpaceMb: 512,
      niceLevel: 0,
      resourceLogIntervalMinutes: 0,
    },
  );
});

test("resource monitor can be disabled and produces bounded snapshots on demand", () => {
  const entries = [];
  const monitor = createResourceMonitor({
    logger: { info: (data) => entries.push(data) },
    intervalMinutes: 0,
    collect: () => ({ websocketClients: 2 }),
  });
  assert.equal(normalizeResourceLogIntervalMinutes("invalid"), 5);
  assert.equal(monitor.enabled, false);
  const snapshot = monitor.sample();
  assert.equal(snapshot.websocketClients, 2);
  assert.ok(Number.isFinite(snapshot.rssMiB));
  assert.ok(snapshot.rssMiB >= 0);
  assert.equal(entries.length, 1);
  monitor.stop();
});

test("entity history persistence coalesces concurrent updates and flushes on close", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "ha3d-history-"));
  try {
    const store = await EntityHistoryStore.create(directory);
    await Promise.all(
      Array.from({ length: 25 }, (_, index) =>
        store.rememberEntities([
          {
            entityId: `sensor.resource_${index}`,
            domain: "sensor",
            name: `Resource ${index}`,
            state: String(index),
            attributes: { sample: index },
          },
        ]),
      ),
    );
    await store.close();
    const saved = JSON.parse(
      await readFile(path.join(directory, "ha-entity-history.json"), "utf8"),
    );
    assert.equal(saved.entities.length, 25);
    assert.equal(store.getResourceStats().historyPendingWrites, 0);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

class FakeSocket extends EventEmitter {
  readyState = WebSocket.OPEN;
  bufferedAmount = 0;
  sent = [];
  terminated = false;
  send(message, callback) {
    this.sent.push(message);
    callback?.();
  }
  close() {
    this.readyState = WebSocket.CLOSED;
    this.emit("close");
  }
  terminate() {
    this.terminated = true;
    this.readyState = WebSocket.CLOSED;
  }
}

test("websocket gateway drops slow clients and detaches its server listener", () => {
  const server = new EventEmitter();
  const gateway = new ClientGateway({ maxBufferedBytes: 8, maxClients: 2 });
  gateway.attach(server);
  const client = new FakeSocket();
  server.emit("connection", client);
  assert.equal(gateway.getResourceStats().websocketClients, 1);
  client.bufferedAmount = 9;
  gateway.broadcast({ type: "test" });
  assert.equal(client.terminated, true);
  assert.equal(gateway.getResourceStats().websocketClients, 0);
  gateway.close();
  assert.equal(server.listenerCount("connection"), 0);
});
