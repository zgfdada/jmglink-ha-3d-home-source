import Fastify from "fastify";
import path from "node:path";
import { ProjectStore } from "../../apps/server/src/projects/ProjectStore.js";
import { DevicePlatformStore } from "../../apps/server/src/device-platform/DevicePlatformStore.js";
import { SidebarStore } from "../../apps/server/src/sidebar/SidebarStore.js";
import { ControlLibraryStore } from "../../apps/server/src/control-library/ControlLibraryStore.js";
import { createInstanceWriteGate } from "../../apps/server/src/instance-write-gate.js";
import { registerInstanceBackup } from "../../apps/server/src/routes/instanceBackup.js";

const dataDir = process.argv[2];
const projects = await ProjectStore.create(dataDir);
const platform = await DevicePlatformStore.create(
  dataDir,
  path.join(dataDir, "assets"),
);
platform.controlLibrary = await ControlLibraryStore.create(dataDir, platform);
const sidebars = await SidebarStore.create(dataDir);
platform.projectReleases = Array.from({ length: 8 }, (_, id) => ({
  id,
  code: "历史记录".repeat(250_000),
}));
await platform.persistAll();
const app = Fastify();
await registerInstanceBackup(app, {
  projects,
  platform,
  sidebars,
  dataDir,
  writeGate: createInstanceWriteGate(),
});
app.get("/health", async () => ({
  ok: true,
  heapLimitMiB: Math.round(
    (await import("node:v8")).getHeapStatistics().heap_size_limit / 1024 / 1024,
  ),
}));
await app.listen({ host: "127.0.0.1", port: 0 });
process.send({ port: app.server.address().port });
process.on("message", async () => {
  await app.close();
  process.exit(0);
});
