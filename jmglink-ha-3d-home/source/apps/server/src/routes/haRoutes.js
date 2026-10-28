import {registerCameraPtzRoutes} from "./cameraPtz.js";
import { Readable } from "node:stream";
import { haConfigFromConnectionInput } from "../config/runtime.js";
const kindFromDomain = (domain) => {
    const supported = ["light", "switch", "cover", "climate", "sensor", "binary_sensor", "camera", "fan", "media_player", "alarm_control_panel", "select", "number", "button"];
    return supported.includes(domain) ? domain : "custom";
};
const actionBodySchema = {
    type: "object",
    required: ["type", "entityId"],
    additionalProperties: false,
    properties: {
        type: { type: "string", enum: ["turn_on", "turn_off", "toggle", "set_brightness", "set_color_temperature", "set_rgb_color", "set_cover_position", "set_temperature", "set_hvac_mode", "set_fan_percentage", "select_option", "set_value", "press"] },
        entityId: { type: "string", minLength: 3, maxLength: 255, pattern: "^[a-z0-9_]+\\.[a-z0-9_]+$" },
        brightness: { type: "number", minimum: 0, maximum: 255 },
        colorTempKelvin: { type: "number", minimum: 1000, maximum: 12000 },
        rgbColor: {
            type: "array",
            minItems: 3,
            maxItems: 3,
            items: { type: "number", minimum: 0, maximum: 255 },
        },
        position: { type: "number", minimum: 0, maximum: 100 },
        temperature: { type: "number", minimum: 5, maximum: 40 },
        mode: { type: "string", minLength: 1, maxLength: 64 },
        percentage: { type: "number", minimum: 0, maximum: 100 },
        option: { type: "string", maxLength: 255 },
        value: { type: "number" },
    },
    allOf: [
        { if: { properties: { type: { const: "set_brightness" } } }, then: { required: ["brightness"] } },
        { if: { properties: { type: { const: "set_color_temperature" } } }, then: { required: ["colorTempKelvin"] } },
        { if: { properties: { type: { const: "set_rgb_color" } } }, then: { required: ["rgbColor"] } },
        { if: { properties: { type: { const: "set_cover_position" } } }, then: { required: ["position"] } },
        { if: { properties: { type: { const: "set_temperature" } } }, then: { required: ["temperature"] } },
        { if: { properties: { type: { const: "set_hvac_mode" } } }, then: { required: ["mode"] } },
        { if: { properties: { type: { const: "set_fan_percentage" } } }, then: { required: ["percentage"] } },
        { if: { properties: { type: { const: "select_option" } } }, then: { required: ["option"] } },
        { if: { properties: { type: { const: "set_value" } } }, then: { required: ["value"] } },
    ],
};
const bindingRequestSchema = {
    type: "object",
    required: ["suggestions"],
    additionalProperties: false,
    properties: {
        suggestions: {
            type: "array",
            minItems: 1,
            maxItems: 100,
            items: {
                type: "object",
                required: ["floorId", "roomId", "areaId", "entityIds"],
                additionalProperties: true,
                properties: {
                    floorId: { type: "string", minLength: 1 },
                    roomId: { type: "string", minLength: 1 },
                    areaId: { type: "string", minLength: 1 },
                    entityIds: { type: "array", minItems: 1, items: { type: "string", minLength: 3 } },
                },
            },
        },
    },
};
const entityIdParamsSchema = {
    type: "object",
    required: ["entityId"],
    additionalProperties: false,
    properties: {
        entityId: { type: "string", minLength: 3, maxLength: 255, pattern: "^[a-z0-9_]+\\.[a-z0-9_]+$" },
    },
};
const cameraProxyQuerySchema = {
    type: "object",
    required: ["path"],
    additionalProperties: false,
    properties: {
        path: { type: "string", minLength: 1, maxLength: 2048 },
    },
};
const haConfigBodySchema = {
    type: "object",
    required: ["url", "token"],
    additionalProperties: false,
    properties: {
        url: { type: "string", minLength: 8, maxLength: 512 },
        token: { type: "string", minLength: 1, maxLength: 4096 },
    },
};
const conversationBodySchema = {
    type: "object", required: ["text"], additionalProperties: false,
    properties: { text: { type: "string", minLength: 1, maxLength: 2000 }, language: { type: "string", maxLength: 16 }, conversation_id: { type: "string", maxLength: 128 }, device_id: { type: "string", maxLength: 128 }, pipeline_id: { type: "string", maxLength: 128 } },
};
const cameraPathPrefixes = ["/api/camera_proxy/", "/api/camera_proxy_stream/", "/api/hls/", "/api/stream/", "/media/"];
function errorStatus(error, fallback = 502) {
    return typeof error === "object" && error && "statusCode" in error && typeof error.statusCode === "number"
        ? error.statusCode
        : fallback;
}
function errorMessage(error, fallback) {
    return error instanceof Error ? error.message : fallback;
}
function isSafeCameraPath(path) {
    if (!path.startsWith("/") || path.startsWith("//") || path.includes("\0") || path.includes(".."))
        return false;
    if (/^[a-z][a-z0-9+.-]*:/i.test(path))
        return false;
    const pathOnly = path.split(/[?#]/, 1)[0];
    return cameraPathPrefixes.some((prefix) => pathOnly.startsWith(prefix));
}
function cameraProxyUrl(path) {
    return `./api/ha/camera-proxy?path=${encodeURIComponent(path)}`;
}
function hlsManifestProxyUrl(path) {
    return `camera-proxy?path=${encodeURIComponent(path)}`;
}
function resolveHlsReference(currentPath, reference) {
    if (/^[a-z][a-z0-9+.-]*:/i.test(reference)) {
        try {
            const url = new URL(reference);
            return `${url.pathname}${url.search}`;
        }
        catch {
            return reference;
        }
    }
    if (reference.startsWith("/"))
        return reference;
    const basePath = currentPath.startsWith("/") ? currentPath : `/${currentPath}`;
    const baseDir = basePath.slice(0, basePath.lastIndexOf("/") + 1);
    const resolved = new URL(reference, `http://ha3d.local${baseDir}`);
    return `${resolved.pathname}${resolved.search}`;
}
function rewriteHlsManifest(manifest, currentPath) {
    return manifest.split(/\r?\n/).map((line) => {
        const trimmed = line.trim();
        if (!trimmed)
            return line;
        if (trimmed.startsWith("#")) {
            return line.replace(/URI="([^"]+)"/g, (_match, uri) => {
                const resolved = resolveHlsReference(currentPath, uri);
                return isSafeCameraPath(resolved) ? `URI="${hlsManifestProxyUrl(resolved)}"` : `URI="${uri}"`;
            });
        }
        const resolved = resolveHlsReference(currentPath, trimmed);
        return isSafeCameraPath(resolved) ? hlsManifestProxyUrl(resolved) : line;
    }).join("\n");
}
async function sendUpstreamCameraResponse(reply, response, path) {
    if (!response.ok) {
        return reply.code(response.status).send({ error: `Camera proxy failed: ${response.status}` });
    }
    const contentType = response.headers.get("content-type") ?? "application/octet-stream";
    reply.header("Cache-Control", "no-store");
    reply.header("X-Content-Type-Options", "nosniff");
    if (path && (contentType.includes("mpegurl") || path.endsWith(".m3u8"))) {
        reply.type("application/vnd.apple.mpegurl");
        return reply.send(rewriteHlsManifest(await response.text(), path));
    }
    if (!response.body)
        return reply.code(502).send({ error: "Camera response did not include a body" });
    reply.type(contentType);
    return reply.send(Readable.fromWeb(response.body));
}
export async function registerHaRoutes(app, ha, store, haConfigStore, gateway) {
    registerCameraPtzRoutes(app,ha,store);
    app.get("/api/ha/status", async () => ha.getStatus());
    app.get("/api/ha/entities", async () => ({ entities: ha.getEntities() }));
    app.get("/api/ha/entity-names", async () => ({ names: Object.fromEntries([...(ha.historyStore?.getEntities() ?? []), ...ha.getEntities()].map((entity) => [entity.entityId, entity.name])) }));
    app.get("/api/ha/areas", async () => ({ areas: ha.getAreas() }));
    app.get("/api/ha/devices", async () => ({ devices: ha.getDevices() }));
    app.post("/api/ha/discovery/refresh", async (_request, reply) => {
        try {
            return { refreshed: await ha.refreshDiscovery() };
        }
        catch (error) {
            return reply.code(502).send({ error: error instanceof Error ? error.message : "HA 设备列表刷新失败" });
        }
    });
    app.get("/api/ha/assist-pipelines", async (_request, reply) => {
        try {
            const pipelines = await ha.getAssistPipelines();
            return { pipelines };
        }
        catch (error) {
            return reply.code(502).send({ error: error instanceof Error ? error.message : "Assist pipeline request failed" });
        }
    });
    app.get("/api/ha/entities/:entityId", async (request, reply) => {
        const entity = ha.getEntities().find((item) => item.entityId === request.params.entityId);
        if (!entity)
            return reply.code(404).send({ error: "Entity not found" });
        return { entity };
    });
    app.post("/api/ha/actions", { schema: { body: actionBodySchema } }, async (request, reply) => {
        try {
            return { entity: await ha.performAction(request.body) };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Home Assistant action failed";
            const status = message.startsWith("Unknown entity") ? 404 : 502;
            return reply.code(status).send({ error: message });
        }
    });
    app.post("/api/ha/conversation", { schema: { body: conversationBodySchema } }, async (request, reply) => {
        const status = ha.getStatus();
        if (!status.configured)
            return reply.code(503).send({ error: "Home Assistant is not configured" });
        try {
            if (request.body.pipeline_id) {
                if (request.body.pipeline_id.startsWith("mock-")) {
                    return { response: { speech: { plain: { speech: `（Mock）已收到：${request.body.text}` } }, response_type: "action_done" } };
                }
                const result = await ha.runAssistPipeline({ text: request.body.text, pipelineId: request.body.pipeline_id });
                return {
                    response: {
                        speech: { plain: { speech: result.speech } },
                        response_type: result.responseType,
                        data: result.data,
                    },
                };
            }
            return await ha.processConversation({
                text: request.body.text,
                language: request.body.language ?? "zh-CN",
                conversation_id: request.body.conversation_id,
                device_id: request.body.device_id,
            });
        }
        catch (error) {
            return reply.code(errorStatus(error)).send({ error: errorMessage(error, "Conversation request failed") });
        }
    });
    app.post("/api/ha/reconnect", async (_request, reply) => {
        try {
            await ha.reconnect();
            return { status: ha.getStatus() };
        }
        catch (error) {
            return reply.code(502).send({ error: error instanceof Error ? error.message : "Home Assistant reconnect failed" });
        }
    });
    app.post("/api/ha/config", { schema: { body: haConfigBodySchema } }, async (request, reply) => {
        if (!ha.getStatus().canConfigure)
            return reply.code(403).send({ error: "Add-on 模式由 Home Assistant Supervisor 管理连接配置" });
        try {
            const runtimeHa = haConfigFromConnectionInput(request.body);
            await haConfigStore.save(request.body);
            await ha.configure(runtimeHa);
            const status = ha.getStatus();
            gateway?.broadcast({ type: "ha.status", payload: status });
            return { status };
        }
        catch (error) {
            return reply.code(400).send({ error: error instanceof Error ? error.message : "Home Assistant 配置保存失败" });
        }
    });
    app.get("/api/ha/cameras/:entityId/stream", { schema: { params: entityIdParamsSchema } }, async (request, reply) => {
        try {
            const stream = await ha.getCameraStream(request.params.entityId);
            const encodedEntityId = encodeURIComponent(request.params.entityId);
            return {
                source: stream.source,
                snapshotUrl: `./api/ha/cameras/${encodedEntityId}/snapshot`,
                mjpegUrl: stream.mjpegPath ? `./api/ha/cameras/${encodedEntityId}/mjpeg?path=${encodeURIComponent(stream.mjpegPath)}` : null,
                hlsUrl: stream.hlsPath ? cameraProxyUrl(stream.hlsPath) : null,
            };
        }
        catch (error) {
            return reply.code(errorStatus(error)).send({ error: errorMessage(error, "Camera stream request failed") });
        }
    });
    app.get("/api/ha/cameras/:entityId/snapshot", { schema: { params: entityIdParamsSchema } }, async (request, reply) => {
        try {
            ha.getCameraEntity(request.params.entityId);
            const response = await ha.fetchCameraPath(`/api/camera_proxy/${encodeURIComponent(request.params.entityId)}`);
            return await sendUpstreamCameraResponse(reply, response);
        }
        catch (error) {
            return reply.code(errorStatus(error)).send({ error: errorMessage(error, "Camera snapshot request failed") });
        }
    });
    app.get("/api/ha/cameras/:entityId/mjpeg", { schema: { params: entityIdParamsSchema } }, async (request, reply) => {
        try {
            ha.getCameraEntity(request.params.entityId);
            const path = request.query.path ?? `/api/camera_proxy_stream/${encodeURIComponent(request.params.entityId)}`;
            if (!isSafeCameraPath(path))
                return reply.code(400).send({ error: "Invalid camera stream path" });
            const response = await ha.fetchCameraPath(path);
            return await sendUpstreamCameraResponse(reply, response, path);
        }
        catch (error) {
            return reply.code(errorStatus(error)).send({ error: errorMessage(error, "Camera MJPEG request failed") });
        }
    });
    app.get("/api/ha/camera-proxy", { schema: { querystring: cameraProxyQuerySchema } }, async (request, reply) => {
        if (!isSafeCameraPath(request.query.path))
            return reply.code(400).send({ error: "Invalid camera proxy path" });
        try {
            const response = await ha.fetchCameraPath(request.query.path);
            return await sendUpstreamCameraResponse(reply, response, request.query.path);
        }
        catch (error) {
            return reply.code(errorStatus(error)).send({ error: errorMessage(error, "Camera proxy request failed") });
        }
    });
    app.get("/api/ha/binding-suggestions", async (_request, reply) => {
        const project = store.getProject();
        if (!project)
            return reply.code(404).send({ error: "Project not found" });
        return { suggestions: ha.getRoomBindingSuggestions(project) };
    });
    app.post("/api/ha/binding-suggestions/apply", { schema: { body: bindingRequestSchema } }, async (request, reply) => {
        const project = store.getProject();
        if (!project)
            return reply.code(404).send({ error: "Project not found" });
        const allowed = ha.getRoomBindingSuggestions(project);
        const requested = new Set(request.body.suggestions.map((item) => `${item.floorId}:${item.roomId}:${item.areaId}:${[...item.entityIds].sort().join(",")}`));
        const confirmed = allowed.filter((item) => requested.has(`${item.floorId}:${item.roomId}:${item.areaId}:${[...item.entityIds].sort().join(",")}`));
        if (!confirmed.length)
            return reply.code(400).send({ error: "No valid binding suggestion selected" });
        const entities = new Map(ha.getEntities().map((entity) => [entity.entityId, entity]));
        const allPlaced = new Set(project.floors.flatMap((floor) => floor.devices.map((device) => device.entityId)));
        const next = structuredClone(project);
        for (const suggestion of confirmed) {
            const floor = next.floors.find((item) => item.id === suggestion.floorId);
            const room = floor?.rooms.find((item) => item.id === suggestion.roomId);
            if (!floor || !room || floor.devices.some((device) => device.roomId === room.id))
                continue;
            const center = [room.polygon.reduce((sum, point) => sum + point[0], 0) / room.polygon.length, room.polygon.reduce((sum, point) => sum + point[1], 0) / room.polygon.length];
            for (const entityId of suggestion.entityIds) {
                if (allPlaced.has(entityId))
                    continue;
                const entity = entities.get(entityId);
                if (!entity)
                    continue;
                floor.devices.push({ id: `device-${Date.now()}-${floor.devices.length}`, entityId, kind: kindFromDomain(entity.domain), floorId: floor.id, roomId: room.id, position: [center[0], entity.domain === "light" ? Math.max(2.3, floor.height - 0.2) : 1.2, center[1]], rotation: [0, 0, 0] });
                allPlaced.add(entityId);
            }
        }
        const saved = await store.saveProject(next);
        gateway?.broadcast({ type: "project.updated", payload: saved });
        return { project: saved };
    });
}
