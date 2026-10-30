import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  createWebglPreviewPool,
  modelPreviewSignature,
} from "../apps/web/src/domain/webgl-preview-pool.js";

test("preview contexts are capped and queued previews receive released slots", async () => {
  const pool = createWebglPreviewPool(2);
  const started = [];
  const releaseA = pool.request(() => started.push("a"));
  const releaseB = pool.request(() => started.push("b"));
  const releaseC = pool.request(() => started.push("c"));
  assert.deepEqual(started, ["a", "b"]);
  assert.deepEqual(pool.status(), { active: 2, waiting: 1 });
  releaseA();
  await Promise.resolve();
  assert.deepEqual(started, ["a", "b", "c"]);
  assert.deepEqual(pool.status(), { active: 2, waiting: 0 });
  releaseB();
  releaseC();
  releaseA();
  assert.deepEqual(pool.status(), { active: 0, waiting: 0 });
});

test("cancelled queued previews never initialize a renderer", async () => {
  const pool = createWebglPreviewPool(1);
  const releaseA = pool.request(() => {});
  let started = false;
  const releaseB = pool.request(() => {
    started = true;
  });
  releaseB();
  releaseA();
  await Promise.resolve();
  assert.equal(started, false);
  assert.deepEqual(pool.status(), { active: 0, waiting: 0 });
});

test("unmount cleanup cannot grant a slot to another preview whose DOM ref is already detached", async () => {
  const pool = createWebglPreviewPool(1);
  const releaseA = pool.request(() => {});
  let host = {
      replaceChildren() {
        throw Error("Must not run during unmount");
      },
    },
    started = false;
  const releaseB = pool.request(() => {
    started = true;
    host.replaceChildren();
  });
  host = null;
  releaseA();
  releaseB();
  await Promise.resolve();
  assert.equal(started, false);
  assert.deepEqual(pool.status(), { active: 0, waiting: 0 });
});

test("finished thumbnails release contexts so more visible models than the limit can all render", async () => {
  const pool = createWebglPreviewPool(2),
    captured = [];
  for (let index = 0; index < 8; index++) {
    const release = pool.request(() => {
      queueMicrotask(() => {
        captured.push(index);
        release();
      });
    });
  }
  for (let frame = 0; frame < 16; frame++) await Promise.resolve();
  assert.deepEqual(captured, [0, 1, 2, 3, 4, 5, 6, 7]);
  assert.deepEqual(pool.status(), { active: 0, waiting: 0 });
});

test("detached or failed preview jobs cannot leak a context or block the next job", async () => {
  const pool = createWebglPreviewPool(1),
    errors = [];
  pool.request(() => false);
  assert.deepEqual(pool.status(), { active: 0, waiting: 0 });
  pool.request(
    () => {
      throw new TypeError("Detached renderer");
    },
    (error) => errors.push(error.name),
  );
  const release = pool.request(() => {});
  assert.deepEqual(errors, ["TypeError"]);
  assert.deepEqual(pool.status(), { active: 1, waiting: 0 });
  release();
  await Promise.resolve();
  assert.deepEqual(pool.status(), { active: 0, waiting: 0 });
});

test("equivalent model data retains a signature across new object instances", () => {
  const model = {
    id: "washer",
    source: { type: "gltf", url: "/washer.glb" },
    materialColors: { door: "#ffffff" },
  };
  assert.equal(
    modelPreviewSignature(model),
    modelPreviewSignature(structuredClone(model)),
  );
  assert.notEqual(
    modelPreviewSignature(model),
    modelPreviewSignature({ ...model, scale: 1.2 }),
  );
});

test("closing the device development center rebuilds only the home scene", async () => {
  const [app, home, preview] = await Promise.all([
    readFile(new URL("../apps/web/src/app/app.js", import.meta.url), "utf8"),
    readFile(
      new URL("../apps/web/src/app/home-view.js", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL(
        "../apps/web/src/app/device-development-center/model-preview.jsx",
        import.meta.url,
      ),
      "utf8",
    ),
  ]);
  assert.match(app, /sceneResumeKey: homeSceneResumeKey/);
  assert.doesNotMatch(app, /legacyDeviceCenter/);
  assert.match(home, /!sceneSuspended && e\.jsx\(Qs, \{\s*key: sceneResumeKey/);
  assert.match(app, /sceneSuspended: nextCenterOpen \|\| Boolean\(sidebarCenterOpen\)/);
  assert.match(preview, /renderer\.forceContextLoss\(\)/);
  assert.match(preview, /webglPreviewPool\.request/);
});
