import { registerInstanceBackup } from "./routes/instanceBackup.js";
import {registerMotionWorkerRoute} from './routes/motionWorker.js';
import {MotionLibraryStore,registerMotionLibraryRoutes} from './motion-library/MotionLibraryStore.js';
import { registerSidebarServices } from "./sidebar/SidebarServices.js";
import { resolveSidebarEntities } from "../../../packages/schema/src/sidebar-bindings.js";
import { SidebarStore, registerSidebarRoutes } from "./sidebar/SidebarStore.js";
import { ControlLibraryStore, registerControlLibraryRoutes } from "./control-library/ControlLibraryStore.js";
import { existsSync } from "node:fs";
import { setDefaultResultOrder } from "node:dns";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "@fastify/cors";
import {registerWebUi} from './routes/webUi.js';
import {registerClientErrorRoutes} from './routes/clientErrors.js';
import Fastify from "fastify";
import { WebSocketServer } from "ws";
import { loadEnvFiles } from "./config/envFile.js";
import { HaConfigStore } from "./config/haConfigStore.js";
import { loadRuntimeConfig } from "./config/runtime.js";
import { DevicePlatformStore } from "./device-platform/DevicePlatformStore.js";
import { HomeAssistantClient } from "./ha/HomeAssistantClient.js";
import { collectLiveEntityIds } from "./ha/boundEntityFilter.js";
import { EntityHistoryStore } from "./ha/EntityHistoryStore.js";
import { createResourceMonitor } from "./observability/resourceMonitor.js";
import { ProjectStore } from "./projects/ProjectStore.js";
import { registerHaRoutes } from "./routes/haRoutes.js";
import { registerDevicePlatformRoutes } from "./routes/devicePlatformRoutes.js";
import { registerProjectRoutes } from "./routes/projectRoutes.js";
import { ClientGateway } from "./websocket/clientGateway.js";
import { VoiceAssistant, registerVoiceAssistantRoutes } from "./voice-assistant/VoiceAssistant.js";
import { registerSkillPackageRoutes } from "./voice-assistant/SkillPackages.js";
setDefaultResultOrder("ipv4first");
loadEnvFiles();
const config = loadRuntimeConfig();
const haConfigStore = await HaConfigStore.create(config.dataDir);
if (config.mode !== "addon") {
  const storedHaConfig = await haConfigStore.load();
  if (storedHaConfig) config.ha = haConfigStore.toRuntimeHa(storedHaConfig);
}
// A 15 MB binary model expands by roughly one third when sent as a JSON data URL.
const app = Fastify({
  logger: { level: process.env.LOG_LEVEL ?? "info" },
  bodyLimit: 22 * 1024 * 1024,
});
await registerClientErrorRoutes(app);
await registerMotionWorkerRoute(app);
await registerSkillPackageRoutes(app);
const gateway = new ClientGateway();
const supervisorTokenRaw = process.env.SUPERVISOR_TOKEN;
const supervisorTokenTrimmed = supervisorTokenRaw?.trim();
app.log.info(
  {
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
  },
  "Runtime configuration loaded",
);
const projectStore = await ProjectStore.create(config.dataDir);
const sidebarStore = await SidebarStore.create(config.dataDir);
let sidebarChanged = () => {};
await registerSidebarRoutes(app, sidebarStore, projectStore, () => sidebarChanged());
const devicePlatformStore = await DevicePlatformStore.create(
  config.dataDir,
  config.assetDir,
);
const controlLibrary = await ControlLibraryStore.create(config.dataDir, devicePlatformStore);
devicePlatformStore.controlLibrary = controlLibrary;
await registerControlLibraryRoutes(app, controlLibrary);
const motionLibrary=await MotionLibraryStore.create(config.dataDir);
devicePlatformStore.motionLibrary=motionLibrary;
await registerMotionLibraryRoutes(app,motionLibrary);
function collectBoundEntityIds(project) {
  const ids = new Set();
  for (const floor of project.floors) {
    for (const device of floor.devices)
      if (device.entityId) ids.add(device.entityId);
    for (const room of floor.rooms) {
      for (const groups of Object.values(room.bindings ?? {})) {
        for (const binding of Object.values(groups))
          for (const entityId of binding.entityIds) ids.add(entityId);
      }
    }
  }
  return [...ids];
}
const historicalEntityIds = projectStore.listProjects().flatMap(({ id }) => {
  const project = projectStore.getProject(id);
  return project ? collectBoundEntityIds(project) : [];
});
const entityHistoryStore = await EntityHistoryStore.create(config.dataDir, {
  seedEntityIds: historicalEntityIds,
  includeDevelopmentEntities: process.env.HA3D_ENABLE_DEV_ENTITIES === "true",
});
const ha = new HomeAssistantClient(
  config,
  entityHistoryStore,
  devicePlatformStore,
);
registerSidebarServices(app,ha,sidebarStore,projectStore);
function refreshBoundEntityFilter() {
  try {
    const project = projectStore.getProject();
    const boundIds = collectLiveEntityIds(project, ha.getEntities(), devicePlatformStore.getBindings());
    const sidebar = sidebarStore.get(project.id);
    for (const config of [sidebar.draft, sidebar.published]) {
      for (const widget of config.widgets) for (const id of resolveSidebarEntities(widget, {}, ha.getEntities()).ids) boundIds.add(id);
      for (const page of config.pages) for (const item of page.items) for (const id of resolveSidebarEntities(config.widgets.find(w=>w.id===item.widgetId), item, ha.getEntities()).ids) boundIds.add(id);
    }
    for (const entity of ha.getEntities()) if (entity.domain === "weather" || entity.domain === "sun") boundIds.add(entity.entityId);
    ha.setBoundEntityFilter(boundIds.size ? boundIds : null);
  } catch (error) {
    // A failed filter refresh must not break project persistence; keep broadcasting everything.
    console.warn("Failed to refresh bound entity filter", error);
  }
}
sidebarChanged = refreshBoundEntityFilter;
const unsubscribeProjectSaved = projectStore.onProjectSaved(() =>
  refreshBoundEntityFilter(),
);
refreshBoundEntityFilter();
app.addHook("onResponse", async (request, reply) => {
  if (!["GET", "HEAD", "OPTIONS"].includes(request.method) &&
      request.url.startsWith("/api/device-platform/") && reply.statusCode < 400) {
    refreshBoundEntityFilter();
  }
});
app.setErrorHandler((error, request, reply) => {
  if (request.method === "PUT" && request.url.startsWith("/api/projects/")) {
    request.log.warn({event:"project-save-request-error",code:error.code || "request-error",validation:error.validation?.map(item=>({path:item.instancePath,keyword:item.keyword}))},"Project save request failed before completion");
  }
  request.log.error({ err: error }, "Request failed");
  if (error.validation) {
    return reply.code(400).send({
      error: "Validation failed",
      details: error.validation.map((item) => ({
        field: item.instancePath || item.params?.missingProperty || "request",
        message: item.message,
      })),
    });
  }
  const statusCode =
    error.statusCode && error.statusCode >= 400 ? error.statusCode : 500;
  const message =
    statusCode >= 500 && process.env.NODE_ENV === "production"
      ? "Internal server error"
      : error.message;
  return reply.code(statusCode).send({ error: message });
});
await app.register(cors, { origin: true });
await registerHaRoutes(app, ha, projectStore, haConfigStore, gateway);
await registerVoiceAssistantRoutes(app, await VoiceAssistant.create(config.dataDir, ha));
await registerDevicePlatformRoutes(app, devicePlatformStore, ha);
await registerProjectRoutes(app, projectStore, gateway, devicePlatformStore);
await registerInstanceBackup(app,{projects:projectStore,platform:devicePlatformStore,sidebars:sidebarStore,dataDir:config.dataDir,onRestored:()=>{refreshBoundEntityFilter();sidebarChanged();}});
app.get("/api/health", async () => ({
  ok: true,
  mode: config.mode,
  timestamp: new Date().toISOString(),
}));
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webDist = path.resolve(__dirname, "../../web/dist");
if (existsSync(webDist)) {
  await registerWebUi(app,webDist);
} else {
  app.log.warn({ webDist }, "Web build not found; serving API only");
}
const onHaStatus = (payload) => {
  app.log.info({ ha: payload }, "Home Assistant connection status");
  gateway.broadcast({ type: "ha.status", payload });
};
const onHaEntityUpdated = (payload) =>
  gateway.broadcast({ type: "ha.entity_updated", payload });
const onHaEntityUpdates = (payload) =>
  gateway.broadcast({ type: "ha.entity_updated", payload });
const onHaEntitiesSynced = (payload) => {
  refreshBoundEntityFilter();
  gateway.broadcast({ type: "ha.entities_synced", payload });
};
const onHaError = (payload) => {
  app.log.warn({ ha: payload }, "Home Assistant connection error");
  gateway.broadcast({ type: "ha.error", payload });
};
ha.on("status", onHaStatus);
ha.on("entity_updated", onHaEntityUpdated);
ha.on("entity_updates", onHaEntityUpdates);
ha.on("entities_synced", onHaEntitiesSynced);
ha.on("ha_error", onHaError);
let address;
try {
  address = await app.listen({ host: "0.0.0.0", port: config.port });
} catch (error) {
  if (error.code === "EADDRINUSE") {
    app.log.error(
      { port: config.port },
      `Port ${config.port} is already in use. Stop the existing process or set PORT to another value in .env.local.`,
    );
    process.exit(1);
  }
  throw error;
}
const wss = new WebSocketServer({
  server: app.server,
  path: "/ws",
  maxPayload: 24 * 1024 * 1024,
  perMessageDeflate: false,
  clientTracking: false,
});
gateway.attach(wss, {
  getProject: () => projectStore.getProject(),
  saveProject: (project) => projectStore.saveProject(project),
  performAction: (action) => ha.performAction(action),
});
await ha.connect();
const resourceMonitor = createResourceMonitor({
  logger: app.log,
  intervalMinutes: process.env.HA3D_RESOURCE_LOG_INTERVAL_MINUTES,
  collect: () => ({
    ...gateway.getResourceStats(),
    ...ha.getResourceStats(),
    ...entityHistoryStore.getResourceStats(),
  }),
});
app.log.info(
  {
    resourceMonitor: {
      enabled: resourceMonitor.enabled,
      intervalMinutes: resourceMonitor.intervalMinutes,
    },
  },
  "Resource monitor configured",
);
app.log.info(`HA 3D Home server running at ${address}`);
let shutdownPromise;
const shutdown = () => {
  if (shutdownPromise)
    return shutdownPromise;
  shutdownPromise = (async () => {
    resourceMonitor.stop();
    unsubscribeProjectSaved();
    ha.off("status", onHaStatus);
    ha.off("entity_updated", onHaEntityUpdated);
    ha.off("entity_updates", onHaEntityUpdates);
    ha.off("entities_synced", onHaEntitiesSynced);
    ha.off("ha_error", onHaError);
    ha.close();
    gateway.close();
    await entityHistoryStore.close();
    await new Promise((resolve) => wss.close(() => resolve()));
    await app.close();
  })();
  return shutdownPromise;
};
process.once("SIGINT", () => {
  void shutdown();
});
process.once("SIGTERM", () => {
  void shutdown();
});
