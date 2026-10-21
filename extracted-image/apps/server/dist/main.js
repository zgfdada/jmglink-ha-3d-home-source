import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import Fastify from "fastify";
import { WebSocketServer } from "ws";
import { loadEnvFiles } from "./config/envFile.js";
import { HaConfigStore } from "./config/haConfigStore.js";
import { loadRuntimeConfig } from "./config/runtime.js";
import { HomeAssistantClient } from "./ha/HomeAssistantClient.js";
import { ProjectStore } from "./projects/ProjectStore.js";
import { registerHaRoutes } from "./routes/haRoutes.js";
import { registerProjectRoutes } from "./routes/projectRoutes.js";
import { ClientGateway } from "./websocket/clientGateway.js";
loadEnvFiles();
const config = loadRuntimeConfig();
const haConfigStore = await HaConfigStore.create(config.dataDir);
if (config.mode !== "addon") {
    const storedHaConfig = await haConfigStore.load();
    if (storedHaConfig)
        config.ha = haConfigStore.toRuntimeHa(storedHaConfig);
}
const app = Fastify({ logger: { level: process.env.LOG_LEVEL ?? "info" }, bodyLimit: 15 * 1024 * 1024 });
const gateway = new ClientGateway();
const ha = new HomeAssistantClient(config);
const supervisorTokenRaw = process.env.SUPERVISOR_TOKEN;
const supervisorTokenTrimmed = supervisorTokenRaw?.trim();
app.log.info({
    runtime: {
        mode: config.mode,
        buildVersion: process.env.HA3D_BUILD_VERSION ?? "dev",
        port: config.port,
        dataDir: config.dataDir,
        assetDir: config.assetDir,
        haRestUrl: config.ha.restUrl,
        hasHaToken: Boolean(config.ha.token),
        hasSupervisorToken: Boolean(supervisorTokenTrimmed),
        supervisorToken: {
            envPresent: supervisorTokenRaw !== undefined,
            rawLength: supervisorTokenRaw?.length ?? 0,
            trimmedLength: supervisorTokenTrimmed?.length ?? 0,
        },
    },
}, "Runtime configuration loaded");
const projectStore = await ProjectStore.create(config.dataDir);
function collectBoundEntityIds(project) {
    const ids = new Set();
    for (const floor of project.floors) {
        for (const device of floor.devices)
            if (device.entityId)
                ids.add(device.entityId);
        for (const room of floor.rooms) {
            for (const groups of Object.values(room.bindings ?? {})) {
                for (const binding of Object.values(groups))
                    for (const entityId of binding.entityIds)
                        ids.add(entityId);
            }
        }
    }
    return [...ids];
}
function refreshBoundEntityFilter() {
    try {
        const project = projectStore.getProject();
        const boundIds = project ? collectBoundEntityIds(project) : [];
        ha.setBoundEntityFilter(boundIds.length ? new Set(boundIds) : null);
    }
    catch (error) {
        // A failed filter refresh must not break project persistence; keep broadcasting everything.
        console.warn("Failed to refresh bound entity filter", error);
    }
}
projectStore.onProjectSaved(() => refreshBoundEntityFilter());
refreshBoundEntityFilter();
app.setErrorHandler((error, request, reply) => {
    request.log.error({ err: error }, "Request failed");
    if (error.validation) {
        return reply.code(400).send({
            error: "Validation failed",
            details: error.validation.map((item) => ({ field: item.instancePath || item.params?.missingProperty || "request", message: item.message })),
        });
    }
    const statusCode = error.statusCode && error.statusCode >= 400 ? error.statusCode : 500;
    const message = statusCode >= 500 && process.env.NODE_ENV === "production" ? "Internal server error" : error.message;
    return reply.code(statusCode).send({ error: message });
});
await app.register(cors, { origin: true });
await registerHaRoutes(app, ha, projectStore, haConfigStore, gateway);
await registerProjectRoutes(app, projectStore, gateway);
app.get("/api/health", async () => ({ ok: true, mode: config.mode, timestamp: new Date().toISOString() }));
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webDist = path.resolve(__dirname, "../../web/dist");
if (existsSync(webDist)) {
    await app.register(fastifyStatic, { root: webDist, prefix: "/", maxAge: 0, etag: true, lastModified: true });
    app.setNotFoundHandler(async (request, reply) => {
        if (request.url.startsWith("/api") || request.url.startsWith("/ws")) {
            return reply.code(404).send({ error: "Not found" });
        }
        return reply.sendFile("index.html");
    });
}
else {
    app.log.warn({ webDist }, "Web build not found; serving API only");
}
ha.on("status", (payload) => {
    app.log.info({ ha: payload }, "Home Assistant connection status");
    gateway.broadcast({ type: "ha.status", payload });
});
ha.on("entity_updated", (payload) => gateway.broadcast({ type: "ha.entity_updated", payload }));
ha.on("entity_updates", (payload) => gateway.broadcast({ type: "ha.entity_updated", payload }));
ha.on("entities_synced", (payload) => gateway.broadcast({ type: "ha.entities_synced", payload }));
ha.on("ha_error", (payload) => {
    app.log.warn({ ha: payload }, "Home Assistant connection error");
    gateway.broadcast({ type: "ha.error", payload });
});
let address;
try {
    address = await app.listen({ host: "0.0.0.0", port: config.port });
}
catch (error) {
    if (error.code === "EADDRINUSE") {
        app.log.error({ port: config.port }, `Port ${config.port} is already in use. Stop the existing process or set PORT to another value in .env.local.`);
        process.exit(1);
    }
    throw error;
}
const wss = new WebSocketServer({ server: app.server, path: "/ws" });
gateway.attach(wss, {
    getProject: () => projectStore.getProject(),
    saveProject: (project) => projectStore.saveProject(project),
    performAction: (action) => ha.performAction(action),
});
await ha.connect();
app.log.info(`HA 3D Home server running at ${address}`);
const shutdown = async () => {
    ha.close();
    gateway.close();
    await app.close();
};
process.once("SIGINT", () => { void shutdown(); });
process.once("SIGTERM", () => { void shutdown(); });
