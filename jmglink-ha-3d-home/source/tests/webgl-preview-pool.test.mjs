import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  createWebglPreviewPool,
  modelPreviewSignature,
} from "../apps/web/src/domain/webgl-preview-pool.js";

test("preview contexts are capped and queued previews receive released slots", () => {
  const pool = createWebglPreviewPool(2);
  const started = [];
  const releaseA = pool.request(() => started.push("a"));
  const releaseB = pool.request(() => started.push("b"));
  const releaseC = pool.request(() => started.push("c"));
  assert.deepEqual(started, ["a", "b"]);
  assert.deepEqual(pool.status(), { active: 2, waiting: 1 });
  releaseA();
  assert.deepEqual(started, ["a", "b", "c"]);
  assert.deepEqual(pool.status(), { active: 2, waiting: 0 });
  releaseB();
  releaseC();
  releaseA();
  assert.deepEqual(pool.status(), { active: 0, waiting: 0 });
});

test("cancelled queued previews never initialize a renderer", () => {
  const pool = createWebglPreviewPool(1);
  const releaseA = pool.request(() => {});
  let started = false;
  const releaseB = pool.request(() => { started = true; });
  releaseB();
  releaseA();
  assert.equal(started, false);
  assert.deepEqual(pool.status(), { active: 0, waiting: 0 });
});

test("equivalent model data retains a signature across new object instances", () => {
  const model = { id: "washer", source: { type: "gltf", url: "/washer.glb" }, materialColors: { door: "#ffffff" } };
  assert.equal(modelPreviewSignature(model), modelPreviewSignature(structuredClone(model)));
  assert.notEqual(modelPreviewSignature(model), modelPreviewSignature({ ...model, scale: 1.2 }));
});

test("closing the device development center rebuilds only the home scene", async () => {
  const [app, home, preview] = await Promise.all([
    readFile(new URL("../apps/web/src/app/app.js", import.meta.url), "utf8"),
    readFile(new URL("../apps/web/src/app/home-view.js", import.meta.url), "utf8"),
    readFile(new URL("../apps/web/src/app/device-development-center/model-preview.jsx", import.meta.url), "utf8"),
  ]);
  assert.match(app, /sceneResumeKey: homeSceneResumeKey/);
  assert.doesNotMatch(app, /legacyDeviceCenter/);
  assert.match(home, /e\.jsx\(Qs, \{\s*key: sceneResumeKey/);
  assert.match(preview, /renderer\.forceContextLoss\(\)/);
  assert.match(preview, /webglPreviewPool\.request/);
});
