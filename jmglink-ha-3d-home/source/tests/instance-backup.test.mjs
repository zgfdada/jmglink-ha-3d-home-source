import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, readdir, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { request } from "node:http";
import path from "node:path";
import Fastify from "fastify";
import { ProjectStore } from "../apps/server/src/projects/ProjectStore.js";
import { SidebarStore } from "../apps/server/src/sidebar/SidebarStore.js";
import { DevicePlatformStore } from "../apps/server/src/device-platform/DevicePlatformStore.js";
import { ControlLibraryStore } from "../apps/server/src/control-library/ControlLibraryStore.js";
import {
  exportInstance,
  restoreInstance,
  registerInstanceBackup,
  validateInstanceBackup,
} from "../apps/server/src/routes/instanceBackup.js";
import { defaultSidebar } from "../packages/schema/src/sidebar.js";
import {
  exportSidebarPart,
  importSidebarPart,
} from "../packages/schema/src/sidebar-transfer.js";

test("sidebar fragments retain code and remap conflicting widget references", () => {
  const original = defaultSidebar();
  const widget = exportSidebarPart(original, "widget", "weather");
  const merged = importSidebarPart(original, widget);
  assert.equal(merged.widgets.length, 2);
  assert.equal(merged.pages.length, 1);
  assert.equal(merged.widgets[1].html, original.widgets[0].html);
  const page = importSidebarPart(
    original,
    exportSidebarPart(original, "page", "home"),
  );
  assert.equal(page.pages.length, 2);
  assert.notEqual(page.pages[1].id, "home");
  assert.equal(page.pages[1].items[0].widgetId, page.widgets[1].id);
  assert.deepEqual(
    importSidebarPart(original, exportSidebarPart(original)),
    original,
  );
  assert.throws(() => importSidebarPart(original, {}));
});

test("instance import keeps JSON limits and errors isolated, rejects a concurrent upload and recovers after disconnect", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "ha3d-instance-http-"));
  const app = Fastify({ bodyLimit: 1024 });
  let slowStarted;
  const started = new Promise((resolve) => {
    slowStarted = resolve;
  });
  app.addHook("preParsing", async (req, reply, payload) => {
    if (req.headers["x-test-slow"]) slowStarted();
    return payload;
  });
  app.post("/ordinary", async (req) => req.body);
  try {
    const state = await stores(dir);
    await registerInstanceBackup(app, { ...state, dataDir: dir });
    const backup = await exportInstance(
      state.projects,
      state.platform,
      state.sidebars,
    );
    const payload = { confirm: true, backup };
    assert.equal(
      (
        await app.inject({
          method: "POST",
          url: "/ordinary",
          payload: { text: "x".repeat(2048) },
        })
      ).statusCode,
      413,
    );
    assert.equal(
      (
        await app.inject({
          method: "POST",
          url: "/api/instance-backup",
          headers: { "content-type": "application/json" },
          payload: '{"confirm":',
        })
      ).statusCode,
      400,
    );
    assert.equal(
      (
        await app.inject({
          method: "POST",
          url: "/api/instance-backup",
          payload,
        })
      ).statusCode,
      200,
    );
    const update = state.sidebars.replaceState.bind(state.sidebars);
    let fail = true;
    state.sidebars.replaceState = async (value) => {
      if (fail) {
        fail = false;
        throw Error("disk failure after other stores changed");
      }
      return update(value);
    };
    const changed = structuredClone(payload);
    changed.backup.projects[0].name = "Must not survive";
    assert.equal(
      (
        await app.inject({
          method: "POST",
          url: "/api/instance-backup",
          payload: changed,
        })
      ).statusCode,
      500,
    );
    assert.equal(state.projects.getProject().name, backup.projects[0].name);
    await app.listen({ host: "127.0.0.1", port: 0 });
    const base = `http://127.0.0.1:${app.server.address().port}`;
    const slow = request(base + "/api/instance-backup", {
      method: "POST",
      headers: { "content-type": "application/json", "x-test-slow": "yes" },
    });
    slow.on("error", () => {});
    slow.write('{"confirm":true,');
    await started;
    const response = await fetch(base + "/api/instance-backup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    assert.equal(response.status, 409);
    await response.text();
    await new Promise((resolve) => {
      slow.once("close", resolve);
      slow.destroy();
    });
    const retry = await fetch(base + "/api/instance-backup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    assert.equal(retry.status, 200, await retry.text());
  } finally {
    await app.close();
    await rm(dir, { recursive: true, force: true });
  }
});

async function stores(root) {
  const projects = await ProjectStore.create(root);
  const platform = await DevicePlatformStore.create(
    root,
    path.join(root, "assets"),
  );
  platform.controlLibrary = await ControlLibraryStore.create(root, platform);
  const sidebars = await SidebarStore.create(root);
  return { projects, platform, sidebars };
}
test("complete instance restores projects, floor drafts, published UI, models and device history into a fresh store", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "ha3d-instance-test-"));
  try {
    const a = await stores(path.join(dir, "a")),
      b = await stores(path.join(dir, "b"));
    const p = structuredClone(a.projects.getProject());
    p.id = "source-house";
    p.name = "Source";
    p.floors.push({
      ...structuredClone(p.floors[0]),
      id: "upstairs",
      name: "F2",
    });
    await a.projects.replaceAll(
      [p, { ...structuredClone(p), id: "second-house", name: "Second" }],
      p.id,
    );
    const sidebar = defaultSidebar(),
      draft = structuredClone(sidebar);
    draft.pages[0].name = "Draft";
    await a.sidebars.replaceState({
      [p.id]: {
        floorId: p.floors[0].id,
        revision: 7,
        draft,
        published: sidebar,
      },
      ["floor:" + JSON.stringify([p.id, "upstairs"])]: {
        revision: 1,
        draft: sidebar,
        published: draft,
      },
    });
    a.platform.projectDrafts = [
      { projectId: "custom.example", name: "editing record" },
    ];
    await a.platform.persistAll();
    const glb = Buffer.alloc(32);
    glb.write("glTF");
    a.platform.modelTemplates.push({
      id: "custom.backup-model",
      name: "Backup model",
      source: {
        type: "upload",
        url: "./api/device-platform/model-files/backup.glb",
        fileName: "backup.glb",
        mimeType: "model/gltf-binary",
      },
    });
    await writeFile(path.join(a.platform.modelAssetDir, "backup.glb"), glb);
    await a.platform.persistAll();
    const snapshot = await exportInstance(a.projects, a.platform, a.sidebars);
    assert.equal(snapshot.projects.length, 2);
    assert.equal("haConfig" in snapshot, false);
    await restoreInstance(snapshot, b.projects, b.platform, b.sidebars);
    const reopened = await stores(path.join(dir, "b"));
    assert.equal(reopened.projects.currentProjectId, p.id);
    assert.equal(reopened.projects.listProjects().length, 2);
    assert.equal(reopened.sidebars.get(p.id).draft.pages[0].name, "Draft");
    assert.equal(reopened.sidebars.get(p.id).published.pages[0].name, "主页");
    assert.equal(Object.keys(reopened.sidebars.state).length, 2);
    assert.equal(
      (await reopened.platform.exportBundle()).assets[0].dataBase64,
      glb.toString("base64"),
    );
    assert.deepEqual(reopened.platform.projectDrafts, a.platform.projectDrafts);
    assert.deepEqual(
      reopened.platform.controlLibrary.export(),
      a.platform.controlLibrary.export(),
    );
    const invalid = structuredClone(snapshot);
    invalid.sidebars[p.id] = null;
    assert.throws(() => validateInstanceBackup(invalid), /侧栏/);
    assert.equal(reopened.projects.currentProjectId, p.id);
    const update = b.sidebars.replaceState.bind(b.sidebars);
    let fail = true;
    b.sidebars.replaceState = async (state) => {
      if (fail) {
        fail = false;
        throw Error("simulated write failure");
      }
      return update(state);
    };
    const changed = structuredClone(snapshot);
    changed.projects[0].name = "Must roll back";
    await assert.rejects(
      restoreInstance(changed, b.projects, b.platform, b.sidebars),
      /simulated/,
    );
    assert.equal(b.projects.getProject(p.id).name, "Source");
    b.sidebars.replaceState = update;
    const app = Fastify();
    await registerInstanceBackup(app, { ...b, dataDir: path.join(dir, "b") });
    assert.equal(
      (
        await app.inject({
          method: "POST",
          url: "/api/instance-backup",
          payload: { backup: snapshot },
        })
      ).statusCode,
      400,
    );
    assert.equal(
      (
        await app.inject({
          method: "POST",
          url: "/api/instance-backup",
          headers: { "sec-fetch-site": "cross-site" },
          payload: { backup: snapshot, confirm: true },
        })
      ).statusCode,
      403,
    );
    const response = await app.inject({
      method: "POST",
      url: "/api/instance-backup",
      payload: { backup: snapshot, confirm: true },
    });
    assert.equal(response.statusCode, 200, response.body);
    assert.equal(
      (await readdir(path.join(dir, "b", "instance-backups"))).length,
      1,
    );
    assert.equal(
      (await app.inject("/api/instance-backup")).json().format,
      "ha3d-instance-backup",
    );
    const streamed = (await app.inject("/api/instance-backup")).json();
    assert.equal(
      streamed.devicePlatform.assets[0].dataBase64,
      glb.toString("base64"),
    );
    assert.deepEqual(
      streamed.deviceHistory.projectDrafts,
      snapshot.deviceHistory.projectDrafts,
    );
    assert.deepEqual(streamed.sidebars, b.sidebars.state);
    await app.close();
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
