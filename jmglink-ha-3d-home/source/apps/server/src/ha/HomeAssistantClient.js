import { EventEmitter } from "node:events";
import {entityOnlyEntities} from "../../../../packages/schema/src/entity-only-device.js";
import { WebSocket } from "ws";
import { homeAssistantBaseUrlFromRestUrl } from "../config/runtime.js";
import { translatedEntityLabels } from "./entityTranslations.js";
const supportedDomains = new Set([
  "light",
  "switch",
  "cover",
  "climate",
  "sensor",
  "binary_sensor",
  "camera",
  "fan",
  "media_player",
  "alarm_control_panel",
  "select",
  "number",
  "button",
]);
const createHttpError = (message, statusCode) =>
  Object.assign(new Error(message), { statusCode });
function nonEmptyString(value) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}
export function extractAssistPipelineResult(value) {
  if (!value || typeof value !== "object") return {};
  const intentOutput = value;
  const response =
    intentOutput.response && typeof intentOutput.response === "object"
      ? intentOutput.response
      : {};
  const responseSpeech =
    response.speech && typeof response.speech === "object"
      ? response.speech
      : {};
  const legacySpeech =
    intentOutput.speech && typeof intentOutput.speech === "object"
      ? intentOutput.speech
      : {};
  const responsePlain =
    responseSpeech.plain && typeof responseSpeech.plain === "object"
      ? responseSpeech.plain
      : {};
  const legacyPlain =
    legacySpeech.plain && typeof legacySpeech.plain === "object"
      ? legacySpeech.plain
      : {};
  return {
    // Current HA puts speech under intent_output.response; older releases and
    // some custom pipeline integrations expose it directly on intent_output.
    speech:
      nonEmptyString(responsePlain.speech) ??
      nonEmptyString(legacyPlain.speech),
    responseType:
      nonEmptyString(response.response_type) ??
      nonEmptyString(intentOutput.response_type),
    data: response.data ?? intentOutput.data,
  };
}
export class HomeAssistantClient extends EventEmitter {
  config;
  entities = new Map();
  areas = new Map();
  devices = new Map();
  registryByEntity = new Map();
  translationResources = {};
  translationCache;
  translationLoad;
  socket;
  reconnectTimer;
  discoveryRefreshTimer;
  reconnectAttempt = 0;
  websocketReady = false;
  synchronizing = false;
  coreStopping = false;
  lastError;
  nextCommandId = 2;
  pendingCommands = new Map();
  boundEntityFilter = null;
  pendingEntityUpdates = new Map();
  entityUpdateFlushTimer;
  weatherSyncInFlight = false;
  weatherSyncPending = false;
  weatherSyncAt = 0;
  static weatherSyncMinIntervalMs = 5000;
  assistPipelinesCache = null;
  assistPipelinesCacheAt = 0;
  assistPipelinesUnsupported = false;
  static assistPipelinesCacheTtlMs = 5 * 60_000;
  historyStore;
  devicePlatformStore;
  constructor(config, historyStore, devicePlatformStore) {
    super();
    this.config = config;
    this.historyStore = historyStore;
    this.devicePlatformStore = devicePlatformStore;
    this.restoreHistory();
  }
  restoreHistory() {
    this.entities = new Map(
      (this.historyStore?.getEntities() ?? []).map((entity) => [
        entity.entityId,
        entity,
      ]),
    );
    this.areas = new Map(
      (this.historyStore?.getAreas() ?? []).map((area) => [area.id, area]),
    );
    this.devices = new Map(
      (this.historyStore?.getDevices() ?? []).map((device) => [
        device.id,
        device,
      ]),
    );
  }
  async configure(ha) {
    this.config = { ...this.config, ha };
    this.restoreHistory();
    this.registryByEntity.clear();
    this.clearPendingEntityUpdates();
    this.clearRuntimeCaches();
    await this.reconnect();
  }
  async connect() {
    if (!this.config.ha.token) {
      this.websocketReady = false;
      this.lastError = undefined;
      this.emit("status", {
        connected: false,
        mode: this.config.mode,
        mock: true,
        configured: false,
      });
      return;
    }
    try {
      this.synchronizing = true;
      this.lastError = undefined;
      await this.syncFromRest();
      this.openWebSocket();
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : String(error);
      this.websocketReady = false;
      this.emit("status", {
        connected: false,
        mode: this.config.mode,
        mock: false,
        configured: true,
        error: this.lastError,
      });
      this.scheduleReconnect();
    }
  }
  async reconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }
    this.reconnectAttempt = 0;
    this.websocketReady = false;
    if (this.discoveryRefreshTimer) clearTimeout(this.discoveryRefreshTimer);
    this.discoveryRefreshTimer = undefined;
    if (this.socket) {
      const socket = this.socket;
      this.rejectPendingCommands(
        new Error("Home Assistant reconnect requested"),
      );
      this.socket = undefined;
      socket.terminate();
    }
    await this.connect();
  }
  close() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = undefined;
    if (this.discoveryRefreshTimer) clearTimeout(this.discoveryRefreshTimer);
    this.discoveryRefreshTimer = undefined;
    this.clearPendingEntityUpdates();
    this.websocketReady = false;
    this.socket?.terminate();
    this.socket = undefined;
    this.rejectPendingCommands(new Error("Home Assistant connection closed"));
    this.clearRuntimeCaches();
    this.removeAllListeners();
  }
  clearRuntimeCaches() {
    this.translationCache = undefined;
    this.translationLoad = undefined;
    this.translationResources = {};
    this.assistPipelinesCache = null;
    this.assistPipelinesCacheAt = 0;
    this.weatherSyncInFlight = false;
    this.weatherSyncPending = false;
    this.weatherSyncAt = 0;
  }
  getResourceStats() {
    return {
      haEntities: this.entities.size,
      haAreas: this.areas.size,
      haDevices: this.devices.size,
      haPendingCommands: this.pendingCommands.size,
      haPendingEntityUpdates: this.pendingEntityUpdates.size,
      haEventListeners: this.eventNames().reduce(
        (total, name) => total + this.listenerCount(name),
        0,
      ),
    };
  }
  getStatus() {
    const entities = this.getEntities();
    return {
      mode: this.config.mode,
      configured: Boolean(this.config.ha.token),
      connected: this.websocketReady && !this.synchronizing,
      synchronizing: this.websocketReady && this.synchronizing && !this.coreStopping,
      mock: !this.config.ha.token,
      reconnecting: Boolean(this.config.ha.token) && (!this.websocketReady || this.synchronizing),
      entityCount: entities.length,
      areaCount: this.getAreas().length,
      deviceCount: this.getDevices().length,
      historicalEntityCount: entities.filter(
        (entity) => entity.historical,
      ).length,
      developmentEntityCount: entities.filter(
        (entity) => entity.source === "development",
      ).length,
      canConfigure: this.config.mode !== "addon",
      restUrl:
        this.config.mode === "addon"
          ? undefined
          : homeAssistantBaseUrlFromRestUrl(this.config.ha.restUrl),
      error: this.websocketReady ? undefined : this.lastError,
    };
  }
  getEntities() {
    const bindings = new Map(
      (this.devicePlatformStore?.getBindings() ?? []).map((binding) => [
        binding.deviceId,
        binding,
      ]),
    );
    const models = new Map(
      (this.devicePlatformStore?.getModelTemplates() ?? []).map((model) => [
        model.id,
        model,
      ]),
    );
    const templates = new Map(
      (this.devicePlatformStore?.getDeviceTemplates() ?? []).map((template) => [
        template.id,
        template,
      ]),
    );
    const entities = this.websocketReady
      ? [...this.entities.values()]
      : (this.historyStore?.getEntities() ?? [...this.entities.values()]);
    const projectEntities = entityOnlyEntities([...bindings.values()], [...templates.values()], entities);
    return [...entities,...projectEntities].map((entity) => {
      const binding = entity.deviceId
        ? bindings.get(entity.deviceId)
        : undefined;
      if (!binding) return entity;
      return {
        ...entity,
        deviceTemplateId: binding.deviceTemplateId,
        deviceTemplateName: templates.get(binding.deviceTemplateId)?.name,
        deviceControlPanelId: binding.controlPanelTemplateId,
        deviceModel: binding.modelTemplateId
          ? (() => {
              const model = models.get(binding.modelTemplateId);
              const project = templates.get(binding.deviceTemplateId);
              if (!model) return undefined;
              const appearance = project?.appearance;
              if (!appearance) return model;
              const animation = appearance.animation;
                    return {
                        ...model,
                        ...appearance,
                        projectAppearance: true,
                runtimeEffect: animation?.statusCapabilityId
                  ? {
                      type:
                        model.source?.shape === "washing-machine"
                          ? "top-load-washer"
                          : "capability-runtime",
                      statusCapabilityId: animation.statusCapabilityId,
                      remainingCapabilityId: animation.remainingCapabilityId,
                      activeStates: animation.activeStates.join(","),
                    }
                  : model.runtimeEffect,
              };
            })()
          : undefined,
      };
    });
  }
  getAreas() {
    const areas = this.websocketReady
      ? [...this.areas.values()]
      : (this.historyStore?.getAreas() ?? [...this.areas.values()]);
    return areas.sort((first, second) =>
      first.name.localeCompare(second.name),
    );
  }
  getDevices() {
    const devices = this.websocketReady
      ? [...this.devices.values()]
      : (this.historyStore?.getDevices() ?? [...this.devices.values()]);
    return devices.sort((first, second) =>
      first.name.localeCompare(second.name, "zh-Hans-CN"),
    );
  }
  getRoomBindingSuggestions(project) {
    const normalized = (value) => value.trim().toLocaleLowerCase();
    const placedEntityIds = new Set(
      project.floors.flatMap((floor) =>
        floor.devices.map((device) => device.entityId),
      ),
    );
    const suggestions = [];
    for (const floor of project.floors) {
      for (const room of floor.rooms) {
        if (floor.devices.some((device) => device.roomId === room.id)) continue;
        const roomName = normalized(room.name);
        const area = [...this.areas.values()].find((candidate) => {
          const areaName = normalized(candidate.name);
          return (
            areaName === roomName ||
            areaName.includes(roomName) ||
            roomName.includes(areaName)
          );
        });
        if (!area) continue;
        const entityIds = this.getEntities()
          .filter(
            (entity) =>
              entity.areaId === area.id &&
              supportedDomains.has(entity.domain) &&
              !placedEntityIds.has(entity.entityId),
          )
          .map((entity) => entity.entityId);
        if (entityIds.length)
          suggestions.push({
            floorId: floor.id,
            roomId: room.id,
            roomName: room.name,
            areaId: area.id,
            areaName: area.name,
            entityIds,
          });
      }
    }
    return suggestions;
  }
  queueEntityUpdate(entity) {
    if (this.boundEntityFilter && !this.boundEntityFilter.has(entity.entityId))
      return;
    this.pendingEntityUpdates.set(entity.entityId, entity);
    if (!this.entityUpdateFlushTimer) {
      this.entityUpdateFlushTimer = setTimeout(() => {
        this.entityUpdateFlushTimer = undefined;
        this.flushPendingEntityUpdates();
      }, 150);
      this.entityUpdateFlushTimer.unref?.();
    }
  }
  flushPendingEntityUpdates() {
    if (!this.pendingEntityUpdates.size) return;
    const updates = [...this.pendingEntityUpdates.values()];
    this.pendingEntityUpdates.clear();
    this.emit("entity_updates", updates);
  }
  clearPendingEntityUpdates() {
    if (this.entityUpdateFlushTimer) clearTimeout(this.entityUpdateFlushTimer);
    this.entityUpdateFlushTimer = undefined;
    this.pendingEntityUpdates.clear();
  }
  setBoundEntityFilter(entityIds) {
    this.boundEntityFilter = entityIds === null ? null : new Set(entityIds);
    if (this.boundEntityFilter) {
      for (const entityId of [...this.pendingEntityUpdates.keys()]) {
        if (!this.boundEntityFilter.has(entityId))
          this.pendingEntityUpdates.delete(entityId);
      }
    }
  }
  async performAction(action) {
    const entity = this.entities.get(action.entityId);
    if (!entity) throw new Error(`Unknown entity ${action.entityId}`);
    if (this.config.ha.token && entity.source !== "development")
      await this.callHomeAssistantService(action);
    const next = this.applyLocalAction(entity, action);
    this.entities.set(next.entityId, next);
    this.emit("entity_updated", next);
    return next;
  }
  async processConversation(input) {
    if (!this.config.ha.token)
      throw new Error("Home Assistant is not configured");
    const url = this.resolveHaPath("/api/conversation/process");
    const tryBody = (agentId) =>
      JSON.stringify({
        text: input.text,
        language: input.language ?? "zh-CN",
        agent_id: agentId,
        conversation_id: input.conversation_id,
      });
    const attempt = async (body) => {
      console.log("[ha][conversation] request", { url, body });
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.ha.token}`,
          "Content-Type": "application/json",
        },
        body,
      });
      console.log("[ha][conversation] response", {
        status: response.status,
        ok: response.ok,
        contentType: response.headers.get("content-type"),
      });
      return response;
    };
    const first = await attempt(tryBody(input.agent_id));
    if (first.ok) {
      const data = await first.json();
      console.log("[ha][conversation] parsed", {
        responseType: data.response?.response_type,
        code: data.response?.data?.code,
        message: data.response?.data?.message,
      });
      return data;
    }
    const firstBody = await first.text().catch(() => "");
    console.log("[ha][conversation] non-2xx body", {
      status: first.status,
      body: firstBody.slice(0, 500),
    });
    if (first.status !== 400 || !input.pipeline_id)
      throw createHttpError(
        `Conversation request failed: ${first.status}`,
        first.status,
      );
    console.log("[ha][conversation] retry with pipeline_id as agent_id", {
      agentId: input.pipeline_id,
    });
    const second = await attempt(tryBody(input.pipeline_id));
    if (second.ok) {
      const data = await second.json();
      console.log("[ha][conversation] retry parsed", {
        responseType: data.response?.response_type,
        code: data.response?.data?.code,
        message: data.response?.data?.message,
      });
      return data;
    }
    const secondBody = await second.text().catch(() => "");
    console.log("[ha][conversation] retry non-2xx body", {
      status: second.status,
      body: secondBody.slice(0, 500),
    });
    throw createHttpError(
      `Conversation request failed: ${second.status}`,
      second.status,
    );
  }
  async getAssistPipelines() {
    if (!this.config.ha.token) {
      const mockList = [
        { id: "mock-default", name: "默认助手（Mock）", language: "zh-CN" },
        { id: "mock-extended", name: "扩展助手（Mock）", language: "zh-CN" },
      ];
      console.log(
        "[ha][assist_pipeline] mock mode, return built-in pipelines",
        { count: mockList.length },
      );
      return mockList;
    }
    const now = Date.now();
    if (
      this.assistPipelinesCache &&
      now - this.assistPipelinesCacheAt <
        HomeAssistantClient.assistPipelinesCacheTtlMs
    ) {
      console.log("[ha][assist_pipeline] cache hit", {
        count: this.assistPipelinesCache.length,
        ageMs: now - this.assistPipelinesCacheAt,
      });
      return this.assistPipelinesCache;
    }
    if (!this.socket || !this.websocketReady) {
      console.log(
        "[ha][assist_pipeline] websocket not ready, fallback to default pipeline",
      );
      return [
        { id: "default", name: "默认助手（WS 未就绪）", language: "zh-CN" },
      ];
    }
    const startedAt = Date.now();
    console.log("[ha][assist_pipeline] ws request", {
      type: "assist_pipeline/pipeline/list",
    });
    try {
      const result = await this.sendCommand(
        this.socket,
        "assist_pipeline/pipeline/list",
        {},
      );
      const durationMs = Date.now() - startedAt;
      const raw = Array.isArray(result) ? result : (result?.pipelines ?? []);
      const list = raw.map((item) => ({
        id: String(item?.id ?? item?.pipeline_id ?? ""),
        name: String(item?.name ?? item?.title ?? item?.id ?? "未命名助手"),
        language:
          typeof item?.language === "string" ? item.language : undefined,
      }));
      const filtered = list.filter((item) => item.id);
      console.log("[ha][assist_pipeline] ws parsed", {
        count: filtered.length,
        durationMs,
        sample: filtered.slice(0, 3),
      });
      this.assistPipelinesCache = filtered;
      this.assistPipelinesCacheAt = Date.now();
      return filtered;
    } catch (error) {
      const durationMs = Date.now() - startedAt;
      console.log("[ha][assist_pipeline] ws failed", {
        durationMs,
        error: error instanceof Error ? error.message : String(error),
      });
      this.emit("ha_error", {
        message: error instanceof Error ? error.message : String(error),
        source: "assist_pipeline",
      });
      return (
        this.assistPipelinesCache ?? [
          { id: "default", name: "默认助手（获取失败）", language: "zh-CN" },
        ]
      );
    }
  }
  getCameraEntity(entityId) {
    return this.requireCameraEntity(entityId);
  }
  async getCameraStream(entityId) {
    this.requireCameraEntity(entityId);
    if (!this.config.ha.token)
      throw createHttpError("Home Assistant is not configured", 503);
    let hlsPath;
    let mjpegPath;
    if (this.socket && this.websocketReady) {
      try {
        const result = await this.sendCommand(this.socket, "camera/stream", {
          entity_id: entityId,
        });
        hlsPath = this.normalizeCameraPath(
          result.hls_path ?? result.hlsPath ?? result.url,
        );
        mjpegPath = this.normalizeCameraPath(
          result.mjpeg_path ?? result.mjpegPath,
        );
      } catch (error) {
        this.emit("ha_error", {
          message: error instanceof Error ? error.message : String(error),
          source: "camera_stream",
        });
      }
    }
    const snapshotPath = `/api/camera_proxy/${encodeURIComponent(entityId)}`;
    const source = mjpegPath ? "mjpeg" : hlsPath ? "hls" : "snapshot";
    return { source, snapshotPath, hlsPath, mjpegPath };
  }
  async fetchCameraPath(path, signal) {
    if (!this.config.ha.token)
      throw createHttpError("Home Assistant is not configured", 503);
    const response = await fetch(this.resolveHaPath(path), {
      headers: { Authorization: `Bearer ${this.config.ha.token}` },
      signal,
    });
    return response;
  }
  async syncFromRest() {
    const states = await this.fetchStates();
    this.restoreHistory();
    this.registryByEntity.clear();
    const liveEntities = new Map();
    for (const state of states) {
      const entity = this.toEntity(state);
      // REST states do not contain the current registry relationship. Never
      // carry a historical device/area assignment into online discovery.
      liveEntities.set(entity.entityId, {
        ...entity,
        areaId: undefined,
        deviceId: undefined,
        registryId: undefined,
        integration: undefined,
        translationKey: undefined,
        stateLabels: undefined,
      });
    }
    this.entities = liveEntities;
    this.areas = new Map();
    this.devices = new Map();
    this.emit("entities_synced", this.getEntities());
  }
  openWebSocket() {
    if (
      this.socket &&
      (this.socket.readyState === WebSocket.CONNECTING ||
        this.socket.readyState === WebSocket.OPEN)
    )
      return;
    const socket = new WebSocket(this.config.ha.websocketUrl, {
      headers: { Authorization: `Bearer ${this.config.ha.token}` },
    });
    this.socket = socket;
    socket.on("message", (data) =>
      this.handleWebSocketMessage(socket, data.toString()),
    );
    socket.on("error", (error) =>
      this.emit("ha_error", { message: error.message, source: "websocket" }),
    );
    socket.on("close", () => {
      if (this.socket !== socket) return;
      if (this.discoveryRefreshTimer) clearTimeout(this.discoveryRefreshTimer);
      this.discoveryRefreshTimer = undefined;
      this.rejectPendingCommands(new Error("Home Assistant WebSocket closed"));
      this.socket = undefined;
      const wasReady = this.websocketReady;
      this.websocketReady = false;
      this.emit("status", {
        connected: false,
        mode: this.config.mode,
        mock: false,
        configured: true,
        reconnecting: true,
      });
      if (wasReady || this.config.ha.token) this.scheduleReconnect();
    });
  }
  handleWebSocketMessage(socket, raw) {
    let message;
    try {
      message = JSON.parse(raw);
    } catch {
      return;
    }
    if (message.type === "auth_required") {
      socket.send(
        JSON.stringify({ type: "auth", access_token: this.config.ha.token }),
      );
      return;
    }
    if (message.type === "auth_ok") {
      this.websocketReady = true;
      this.synchronizing = true;
      this.coreStopping = false;
      this.lastError = undefined;
      this.reconnectAttempt = 0;
      this.emit("status", {
        connected: false,
        synchronizing: true,
        reconnecting: true,
        mode: this.config.mode,
        mock: false,
        configured: true,
      });
      socket.send(
        JSON.stringify({
          id: 1,
          type: "subscribe_events",
          event_type: "state_changed",
        }),
      );
      for (const eventType of [
        "homeassistant_stop",
        "homeassistant_started",
        "entity_registry_updated",
        "device_registry_updated",
        "area_registry_updated",
      ]) {
        void this.sendCommand(socket, "subscribe_events", {
          event_type: eventType,
        }).catch((error) =>
          this.emit("ha_error", {
            message: error instanceof Error ? error.message : String(error),
            source: "registry_subscription",
          }),
        );
      }
      void this.finishConnectionSync(socket);
      void this.syncWeatherForecasts(socket);
      return;
    }
    if (message.type === "auth_invalid") {
      this.lastError = "Home Assistant WebSocket authentication failed";
      this.emit("ha_error", {
        message: "Home Assistant WebSocket authentication failed",
      });
      socket.close();
      return;
    }
    if (message.type === "result") {
      const result = message;
      if (typeof result.id === "number") {
        const pending = this.pendingCommands.get(result.id);
        if (pending) {
          if (!result.success) {
            this.pendingCommands.delete(result.id);
            clearTimeout(pending.timer);
            pending.reject(
              new Error(
                result.error?.message ??
                  "Home Assistant WebSocket request failed",
              ),
            );
          } else if (!pending.onEvent) {
            this.pendingCommands.delete(result.id);
            clearTimeout(pending.timer);
            pending.resolve(result.result);
          }
        }
      }
      return;
    }
    if (message.type !== "event") return;
    const id = typeof message.id === "number" ? message.id : undefined;
    if (id !== undefined) {
      const pending = this.pendingCommands.get(id);
      if (pending?.onEvent) {
        try {
          pending.onEvent(message);
        } catch (err) {
          console.log(
            "[ha][ws] event handler error",
            err instanceof Error ? err.message : String(err),
          );
        }
      }
    }
    const event = message.event;
    if (event?.event_type === "homeassistant_stop") {
      this.synchronizing = true;
      this.coreStopping = true;
      this.emit("status", {...this.getStatus(), synchronizing:false, connected:false, reconnecting:true});
      return;
    }
    if (event?.event_type === "homeassistant_started") {
      this.coreStopping = false;
      void this.finishConnectionSync(socket);
      return;
    }
    if (
      [
        "entity_registry_updated",
        "device_registry_updated",
        "area_registry_updated",
      ].includes(event?.event_type)
    ) {
      this.scheduleDiscoveryRefresh(socket);
      return;
    }
    if (
      event?.event_type !== "state_changed" ||
      !event.data?.entity_id
    )
      return;
    if (!event.data.new_state) {
      this.entities.delete(event.data.entity_id);
      this.emit("entities_synced", this.getEntities());
      return;
    }
    const entity = this.toEntity(event.data.new_state);
    this.entities.set(entity.entityId, entity);
    void this.historyStore?.rememberEntities([entity]);
    this.queueEntityUpdate(entity);
    if (entity.domain === "weather") void this.syncWeatherForecasts(socket);
  }
  async finishConnectionSync(socket) {
    try {
      const config = await this.sendCommand(socket, "get_config");
      if (config?.state && config.state !== "RUNNING") {
        this.coreStopping = true;
        this.emit("status", this.getStatus());
        return;
      }
      const states = await this.fetchStates();
      await this.syncRegistriesFromWebSocket(socket, states);
      if (this.socket !== socket || !this.websocketReady) return;
      this.synchronizing = false;
      this.emit("status", {...this.getStatus(), reconnecting:false});
    } catch (error) {
      this.emit("ha_error", {message: error instanceof Error ? error.message : String(error), source:"connection_sync"});
      if(this.socket === socket) socket.close();
    }
  }
  scheduleReconnect() {
    if (!this.config.ha.token || this.reconnectTimer) return;
    const delay =
      Math.min(30_000, 1_000 * 2 ** this.reconnectAttempt) +
      Math.floor(Math.random() * 350);
    this.reconnectAttempt += 1;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = undefined;
      void this.connect();
    }, delay);
    this.reconnectTimer.unref?.();
  }
  scheduleDiscoveryRefresh(socket) {
    if (this.discoveryRefreshTimer) clearTimeout(this.discoveryRefreshTimer);
    this.discoveryRefreshTimer = setTimeout(() => {
      this.discoveryRefreshTimer = undefined;
      if (this.socket !== socket || !this.websocketReady) return;
      void this.refreshDiscovery().catch((error) =>
        this.emit("ha_error", {
          message: error instanceof Error ? error.message : String(error),
          source: "discovery_refresh",
        }),
      );
    }, 350);
    this.discoveryRefreshTimer.unref?.();
  }
  async refreshDiscovery() {
    const socket = this.socket;
    if (!socket || !this.websocketReady) return false;
    const states = await this.fetchStates();
    await this.syncRegistriesFromWebSocket(socket, states);
    return true;
  }
  async fetchStates() {
    const response = await fetch(`${this.config.ha.restUrl}/states`, {
      headers: { Authorization: `Bearer ${this.config.ha.token}` },
    });
    if (!response.ok) throw new Error(`HA states failed: ${response.status}`);
    return await response.json();
  }
  async syncRegistriesFromWebSocket(socket, states) {
    try {
      const [rawAreas, rawDevices, entities] = await Promise.all([
        this.sendCommand(socket, "config/area_registry/list"),
        this.sendCommand(socket, "config/device_registry/list"),
        this.sendCommand(socket, "config/entity_registry/list"),
      ]);
      const translations = await this.loadEntityTranslations(socket, entities);
      if (this.socket !== socket || !this.websocketReady)
        throw new Error("Home Assistant connection changed during registry sync");
      if (states) {
        this.entities = new Map(
          states.map((state) => {
            const entity = this.toEntity(state);
            return [entity.entityId, entity];
          }),
        );
      }
      this.areas = new Map(
        rawAreas.map((area) => [
          area.area_id,
          { id: area.area_id, name: area.name },
        ]),
      );
      const previousDevices = new Map(
        (this.historyStore?.getDevices() ?? [...this.devices.values()]).map(
          (device) => [device.id, device],
        ),
      );
      this.devices = new Map(
        rawDevices.map((device) => [
          device.id,
          {
            id: device.id,
            name:
              device.name_by_user ??
              device.name ??
              previousDevices.get(device.id)?.name ??
              device.id,
            manufacturer:
              device.manufacturer ??
              previousDevices.get(device.id)?.manufacturer,
            model:
              device.model ??
              device.model_id ??
              previousDevices.get(device.id)?.model,
            areaId: device.area_id ?? previousDevices.get(device.id)?.areaId,
            integration: Array.isArray(device.config_entries)
              ? device.config_entries.join(",")
              : previousDevices.get(device.id)?.integration,
            source: "ha",
            historical: false,
          },
        ]),
      );
      const deviceAreas = new Map(
        [...this.devices.values()].map((device) => [device.id, device.areaId]),
      );
      this.registryByEntity = new Map(
        entities.map((entity) => [
          entity.entity_id,
          {
            registryId: entity.id,
            deviceId: entity.device_id,
            areaId:
              entity.area_id ??
              (entity.device_id
                ? deviceAreas.get(entity.device_id)
                : undefined),
            integration: entity.platform,
            translationKey: entity.translation_key,
          },
        ]),
      );
      for (const [entityId, entity] of this.entities) {
        const registry = this.registryByEntity.get(entityId);
        this.entities.set(entityId, {
          ...entity,
          registryId: registry?.registryId,
          areaId: registry?.areaId,
          deviceId: registry?.deviceId,
          integration: registry?.integration,
          translationKey: registry?.translationKey,
          stateLabels: translatedEntityLabels(entity, registry, translations),
        });
      }
      await this.devicePlatformStore?.reconcileEntityRegistry?.(entities);
      await Promise.all([
        this.historyStore?.rememberEntities(this.getEntities()),
        this.historyStore?.rememberAreas(this.getAreas()),
        this.historyStore?.rememberDevices(this.getDevices()),
      ]);
      this.emit("entities_synced", this.getEntities());
    } catch (error) {
      this.emit("ha_error", {
        message: error instanceof Error ? error.message : String(error),
        source: "registry",
      });
      if (states) throw error;
    }
  }
  async loadEntityTranslations(socket, entries) {
    const integrations = [
      ...new Set(entries
        .filter((entry) => entry.translation_key && entry.platform)
        .map((entry) => entry.platform)),
    ].sort();
    const domains = [
      ...new Set(entries
        .map((entry) => entry.entity_id?.split(".")[0])
        .filter(Boolean)),
    ].sort();
    const key = JSON.stringify([integrations, domains]);
    const cached = this.translationCache;
    if (
      cached?.socket === socket && cached.key === key &&
      Date.now() - cached.at < cached.ttl
    )
      return cached.resources;
    if (
      this.translationLoad?.socket === socket &&
      this.translationLoad.key === key
    )
      return this.translationLoad.promise;
    const load = { socket, key };
    load.promise = (async () => {
      const requests = [
        ...(integrations.length ? [{ category: "entity", integration: integrations }] : []),
        ...(domains.length ? [{ category: "entity_component", integration: domains }] : []),
      ];
      const results = await Promise.allSettled(requests.map((request) =>
        this.sendCommand(socket, "frontend/get_translations", {
          language: "zh-Hans", ...request,
        }),
      ));
      const resources = Object.assign({}, ...results
        .filter((result) => result.status === "fulfilled")
        .map((result) => result.value?.resources ?? {}));
      if (this.socket === socket && this.websocketReady) {
        this.translationResources = resources;
        this.translationCache = {
          socket, key, resources, at: Date.now(),
          ttl: results.some((result) => result.status === "rejected")
            ? 30_000 : 60 * 60_000,
        };
      }
      return resources;
    })();
    this.translationLoad = load;
    try {
      return await load.promise;
    } finally {
      if (this.translationLoad === load) this.translationLoad = undefined;
    }
  }
  async syncWeatherForecasts(socket) {
    if (this.weatherSyncInFlight) {
      this.weatherSyncPending = true;
      return;
    }
    if (
      Date.now() - this.weatherSyncAt <
      HomeAssistantClient.weatherSyncMinIntervalMs
    )
      return;
    this.weatherSyncInFlight = true;
    try {
      await this.syncWeatherForecastsFromWebSocket(socket);
      this.weatherSyncAt = Date.now();
      if (this.weatherSyncPending) {
        this.weatherSyncPending = false;
        void this.syncWeatherForecasts(socket);
      }
    } finally {
      this.weatherSyncInFlight = false;
    }
  }
  async syncWeatherForecastsFromWebSocket(socket) {
    const weatherEntityIds = [...this.entities.values()]
      .filter((entity) => entity.domain === "weather")
      .map((entity) => entity.entityId);
    if (!weatherEntityIds.length) return;
    const forecast = await this.fetchWeatherForecasts(
      socket,
      weatherEntityIds,
      "daily",
    )
      .catch(() =>
        this.fetchWeatherForecasts(socket, weatherEntityIds, "hourly"),
      )
      .catch((error) => {
        this.emit("ha_error", {
          message: error instanceof Error ? error.message : String(error),
          source: "weather_forecast",
        });
        return undefined;
      });
    if (!forecast) return;
    let changed = false;
    for (const entityId of weatherEntityIds) {
      const entity = this.entities.get(entityId);
      const items = forecast.get(entityId);
      if (!entity || !items?.length) continue;
      this.entities.set(entityId, {
        ...entity,
        attributes: { ...entity.attributes, forecast: items },
      });
      changed = true;
    }
    if (changed) this.emit("entities_synced", this.getEntities());
  }
  async fetchWeatherForecasts(socket, entityIds, forecastType) {
    const result = await this.sendCommand(socket, "call_service", {
      domain: "weather",
      service: "get_forecasts",
      service_data: { type: forecastType },
      target: { entity_id: entityIds },
      return_response: true,
    });
    const response = this.extractWeatherForecastResponse(result);
    const forecasts = new Map();
    for (const entityId of entityIds) {
      const entityForecast = response[entityId];
      if (!entityForecast || typeof entityForecast !== "object") continue;
      const items = entityForecast.forecast;
      if (Array.isArray(items))
        forecasts.set(
          entityId,
          items
            .filter((item) => Boolean(item && typeof item === "object"))
            .slice(0, 96),
        );
    }
    if (!forecasts.size)
      throw new Error(
        `Home Assistant returned no ${forecastType} weather forecast data`,
      );
    return forecasts;
  }
  extractWeatherForecastResponse(result) {
    if (!result || typeof result !== "object") return {};
    const wrapped = result;
    const response =
      wrapped.response && typeof wrapped.response === "object"
        ? wrapped.response
        : result;
    return response;
  }
  sendCommand(socket, type, payload = {}) {
    if (socket.readyState !== WebSocket.OPEN)
      return Promise.reject(
        new Error("Home Assistant WebSocket is not connected"),
      );
    const id = this.nextCommandId;
    this.nextCommandId += 1;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingCommands.delete(id);
        reject(new Error(`Home Assistant request timed out: ${type}`));
      }, 10_000);
      this.pendingCommands.set(id, {
        resolve: (value) => resolve(value),
        reject,
        timer,
      });
      socket.send(JSON.stringify({ id, type, ...payload }));
    });
  }
  sendCommandWithEvents(socket, type, payload, onEvent, timeoutMs = 60_000) {
    return new Promise((resolve, reject) => {
      const id = this.nextCommandId;
      this.nextCommandId += 1;
      const timer = setTimeout(() => {
        this.pendingCommands.delete(id);
        reject(new Error(`Home Assistant request timed out: ${type}`));
      }, timeoutMs);
      this.pendingCommands.set(id, {
        resolve: (value) => resolve(value),
        reject,
        timer,
        onEvent,
      });
      socket.send(JSON.stringify({ id, type, ...payload }));
    });
  }
  async runAssistPipeline(input) {
    if (!this.socket || !this.websocketReady)
      throw new Error("Home Assistant WebSocket not ready");
    const socket = this.socket;
    const startedAt = Date.now();
    console.log("[ha][assist_pipeline][run] start", {
      pipelineId: input.pipelineId,
      text: input.text,
    });
    return new Promise((resolve, reject) => {
      let resolved = false;
      let commandId;
      const settle = (pending, ok, value, err) => {
        if (!pending) return;
        if (commandId !== undefined) this.pendingCommands.delete(commandId);
        clearTimeout(pending.timer);
        if (ok) pending.resolve(value);
        else pending.reject(err ?? new Error("Assist pipeline failed"));
      };
      const onEvent = (message) => {
        const id = typeof message.id === "number" ? message.id : undefined;
        if (id !== undefined) commandId = id;
        const event = message.event ?? {};
        const data = event.data ?? {};
        if (event.type === "intent-end" && data.intent_output && !resolved) {
          const result = extractAssistPipelineResult(data.intent_output);
          if (!result.speech) return;
          resolved = true;
          resolve({
            speech: result.speech,
            responseType: result.responseType,
            data: result.data,
          });
          if (commandId !== undefined) {
            const pending = this.pendingCommands.get(commandId);
            settle(pending, true, { pipeline: String(data.pipeline ?? "") });
          }
          return;
        }
        if (event.type === "run-end" && !resolved) {
          resolved = true;
          const result = extractAssistPipelineResult(data.intent_output);
          const err = result.speech
            ? undefined
            : createHttpError(
                "Assist pipeline completed without a text response",
                422,
              );
          if (result.speech)
            resolve({
              speech: result.speech,
              responseType: result.responseType,
              data: result.data,
            });
          else reject(err);
          if (commandId !== undefined) {
            const pending = this.pendingCommands.get(commandId);
            settle(pending, Boolean(result.speech), { pipeline: "" }, err);
          }
          return;
        }
        if (event.type === "error" && !resolved) {
          resolved = true;
          const errMessage = data.message ?? "Assist pipeline 错误";
          reject(new Error(errMessage));
          if (commandId !== undefined) {
            const pending = this.pendingCommands.get(commandId);
            settle(pending, false, undefined, new Error(errMessage));
          }
        }
      };
      this.sendCommandWithEvents(
        socket,
        "assist_pipeline/run",
        {
          start_stage: "intent",
          end_stage: "intent",
          input: { text: input.text },
          pipeline: input.pipelineId,
        },
        onEvent,
      ).catch((err) => {
        if (!resolved) reject(err);
      });
    }).then(
      (result) => {
        console.log("[ha][assist_pipeline][run] done", {
          durationMs: Date.now() - startedAt,
          responseType: result.responseType,
        });
        return result;
      },
      (err) => {
        console.log("[ha][assist_pipeline][run] failed", {
          durationMs: Date.now() - startedAt,
          error: err instanceof Error ? err.message : String(err),
        });
        throw err;
      },
    );
  }
  requireCameraEntity(entityId) {
    const entity = this.entities.get(entityId);
    if (!entity) throw createHttpError(`Unknown entity ${entityId}`, 404);
    if (entity.domain !== "camera")
      throw createHttpError(`${entityId} is not a camera entity`, 400);
    return entity;
  }
  normalizeCameraPath(value) {
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) {
      try {
        const url = new URL(trimmed);
        return `${url.pathname}${url.search}`;
      } catch {
        return undefined;
      }
    }
    return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  }
  resolveHaPath(path) {
    const normalized = this.normalizeCameraPath(path);
    if (!normalized)
      throw createHttpError("Invalid Home Assistant camera path", 400);
    const restUrl = this.config.ha.restUrl.replace(/\/+$/, "");
    if (normalized === "/api" || normalized.startsWith("/api/"))
      return `${restUrl}${normalized.slice(4)}`;
    const coreUrl = restUrl.replace(/\/api$/, "");
    return `${coreUrl}${normalized}`;
  }
  rejectPendingCommands(error) {
    for (const pending of this.pendingCommands.values()) {
      clearTimeout(pending.timer);
      pending.reject(error);
    }
    this.pendingCommands.clear();
  }
  toEntity(item) {
    const entityId = String(item.entity_id);
    const [domain] = entityId.split(".");
    const registry = this.registryByEntity.get(entityId);
    const previous = this.entities.get(entityId);
    return {
      entityId,
      domain,
      name: String(
        item.attributes?.friendly_name ?? previous?.name ?? entityId,
      ),
      state: String(item.state),
      attributes: item.attributes ?? {},
      areaId: registry?.areaId ?? previous?.areaId,
      deviceId: registry?.deviceId ?? previous?.deviceId,
      registryId: registry?.registryId ?? previous?.registryId,
      integration: registry?.integration ?? previous?.integration,
      translationKey: registry?.translationKey ?? previous?.translationKey,
      stateLabels: registry
        ? translatedEntityLabels(
            { entityId, domain, state: String(item.state), attributes: item.attributes ?? {} },
            registry,
            this.translationResources,
          )
        : previous?.stateLabels,
      lastChanged: item.last_changed,
      lastUpdated: item.last_updated,
    };
  }
  applyLocalAction(entity, action) {
    if (action.type === "toggle") {
      if (entity.domain !== "cover")
        return { ...entity, state: entity.state === "on" ? "off" : "on" };
      const open =
        entity.state === "open" ||
        Number(entity.attributes.current_position ?? 0) > 0;
      return {
        ...entity,
        state: open ? "closed" : "open",
        attributes: { ...entity.attributes, current_position: open ? 0 : 100 },
      };
    }
    if (action.type === "turn_on")
      return entity.domain === "cover"
        ? {
            ...entity,
            state: "open",
            attributes: { ...entity.attributes, current_position: 100 },
          }
        : { ...entity, state: "on" };
    if (action.type === "turn_off")
      return entity.domain === "cover"
        ? {
            ...entity,
            state: "closed",
            attributes: { ...entity.attributes, current_position: 0 },
          }
        : { ...entity, state: "off" };
    if (action.type === "set_brightness")
      return {
        ...entity,
        state: "on",
        attributes: { ...entity.attributes, brightness: action.brightness },
      };
    if (action.type === "set_color_temperature")
      return {
        ...entity,
        state: "on",
        attributes: {
          ...entity.attributes,
          color_temp_kelvin: action.colorTempKelvin,
          color_mode: "color_temp",
        },
      };
    if (action.type === "set_rgb_color")
      return {
        ...entity,
        state: "on",
        attributes: {
          ...entity.attributes,
          rgb_color: action.rgbColor,
          color_mode: "rgb",
        },
      };
    if (action.type === "set_cover_position")
      return {
        ...entity,
        state: action.position > 0 ? "open" : "closed",
        attributes: { ...entity.attributes, current_position: action.position },
      };
    if (action.type === "set_temperature")
      return {
        ...entity,
        attributes: { ...entity.attributes, temperature: action.temperature },
      };
    if (action.type === "set_hvac_mode")
      return { ...entity, state: action.mode };
    if (action.type === "set_fan_percentage")
      return {
        ...entity,
        attributes: { ...entity.attributes, percentage: action.percentage },
      };
    if (action.type === "select_option")
      return { ...entity, state: String(action.option) };
    if (action.type === "set_value")
      return { ...entity, state: String(action.value) };
    if (action.type === "press")
      return {
        ...entity,
        state: new Date().toISOString(),
        lastChanged: new Date().toISOString(),
      };
    return entity;
  }
  async callHomeAssistantService(action) {
    const [domain] = action.entityId.split(".");
    const services = {
      turn_on: domain === "cover" ? "open_cover" : "turn_on",
      turn_off: domain === "cover" ? "close_cover" : "turn_off",
      toggle: "toggle",
      set_brightness: "turn_on",
      set_color_temperature: "turn_on",
      set_rgb_color: "turn_on",
      set_cover_position: "set_cover_position",
      set_temperature: "set_temperature",
      set_hvac_mode: "set_hvac_mode",
      set_fan_percentage: "set_percentage",
      select_option: "select_option",
      set_value: "set_value",
      press: "press",
    };
    const allowed = {
      select_option: ["select", "input_select"],
      set_value: ["number", "input_number"],
      press: ["button", "input_button"],
    };
    if (allowed[action.type] && !allowed[action.type].includes(domain))
      throw new Error(`Action ${action.type} is not supported for ${domain}`);
    const service = services[action.type];
    if (!service)
      throw new Error(`Unsupported Home Assistant action ${action.type}`);
    const body = { entity_id: action.entityId };
    if (action.type === "set_brightness") body.brightness = action.brightness;
    if (action.type === "set_color_temperature")
      body.color_temp_kelvin = action.colorTempKelvin;
    if (action.type === "set_rgb_color") body.rgb_color = action.rgbColor;
    if (action.type === "set_cover_position") body.position = action.position;
    if (action.type === "set_temperature")
      body.temperature = action.temperature;
    if (action.type === "set_hvac_mode") body.hvac_mode = action.mode;
    if (action.type === "set_fan_percentage")
      body.percentage = action.percentage;
    if (action.type === "select_option") body.option = action.option;
    if (action.type === "set_value") body.value = action.value;
    const response = await fetch(
      `${this.config.ha.restUrl}/services/${domain}/${service}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.ha.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );
    if (!response.ok) throw new Error(`HA service failed: ${response.status}`);
  }
}
