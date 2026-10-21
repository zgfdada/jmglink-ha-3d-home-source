import assert from "node:assert/strict";
import test from "node:test";
import { translatedEntityLabels } from "../apps/server/src/ha/entityTranslations.js";
import { HomeAssistantClient } from "../apps/server/src/ha/HomeAssistantClient.js";

test("HA translations use integration and entity keys, then device class and domain fallbacks", () => {
  const entity = {
    entityId: "select.washer_program",
    domain: "select",
    state: "standard",
    attributes: {
      options: ["standard", "fast", "unknown_mode"],
      device_class: "program",
    },
  };
  const resources = {
    "component.washer.entity.select.program.state.fast": "速洗",
    "component.other.entity.select.program.state.fast": "其他设备的快速",
    "component.select.entity_component.program.state.standard": "标准程序",
    "component.select.entity_component._.state.standard": "默认标准",
    "component.select.entity_component._.state.unknown_mode": "通用名称",
    "component.washer.entity.select.program.state.unsupported_mode":
      "未经支持的模式",
  };
  assert.deepEqual(
    translatedEntityLabels(
      entity,
      { integration: "washer", translationKey: "program" },
      resources,
    ),
    { standard: "标准程序", fast: "速洗", unknown_mode: "通用名称" },
  );
  assert.equal(
    translatedEntityLabels(
      entity,
      { integration: "other", translationKey: "program" },
      resources,
    ).fast,
    "其他设备的快速",
  );
  assert.equal(
    translatedEntityLabels(
      entity,
      { integration: "other", translationKey: "different" },
      resources,
    ).fast,
    undefined,
  );
});

test("registry synchronization loads and caches HA Chinese labels and retains them on state changes", async () => {
  const client = new HomeAssistantClient({
    mode: "standalone",
    ha: { token: "test-token" },
  });
  const socket = {};
  client.socket = socket;
  client.websocketReady = true;
  client.entities.set("select.program", {
    entityId: "select.program",
    domain: "select",
    state: "standard",
    attributes: { options: ["standard", "fast"] },
  });
  let translationCalls = 0;
  client.sendCommand = async (_socket, command, payload) => {
    if (command === "config/area_registry/list") return [];
    if (command === "config/device_registry/list")
      return [{ id: "washer", name: "洗衣机" }];
    if (command === "config/entity_registry/list")
      return [
        {
          id: "registry-program",
          entity_id: "select.program",
          device_id: "washer",
          platform: "example_integration",
          translation_key: "program",
        },
      ];
    if (command === "frontend/get_translations") {
      translationCalls += 1;
      assert.equal(payload.language, "zh-Hans");
      return {
        resources:
          payload.category === "entity"
            ? {
                "component.example_integration.entity.select.program.state.fast":
                  "集成提供的速洗",
              }
            : {},
      };
    }
    throw new Error("Unexpected command");
  };
  await client.syncRegistriesFromWebSocket(socket);
  assert.equal(client.getEntities()[0].stateLabels.fast, "集成提供的速洗");
  assert.equal(translationCalls, 2);
  await client.syncRegistriesFromWebSocket(socket);
  assert.equal(translationCalls, 2, "重复扫描复用当前连接的翻译缓存");
  client.handleWebSocketMessage(
    socket,
    JSON.stringify({
      type: "event",
      event: {
        event_type: "state_changed",
        data: {
          entity_id: "select.program",
          new_state: {
            entity_id: "select.program",
            state: "fast",
            attributes: { options: ["standard", "fast"] },
          },
        },
      },
    }),
  );
  assert.equal(client.getEntities()[0].state, "fast");
  assert.equal(client.getEntities()[0].stateLabels.fast, "集成提供的速洗");
  client.clearPendingEntityUpdates();
});

test("unsupported translation endpoints fall back without breaking live entity discovery", async () => {
  const client = new HomeAssistantClient({ mode: "standalone", ha: {} });
  const socket = {};
  client.socket = socket;
  client.websocketReady = true;
  client.sendCommand = async () => {
    throw new Error("unsupported");
  };
  assert.deepEqual(
    await client.loadEntityTranslations(socket, [
      {
        entity_id: "select.program",
        platform: "test",
        translation_key: "program",
      },
    ]),
    {},
  );
});
