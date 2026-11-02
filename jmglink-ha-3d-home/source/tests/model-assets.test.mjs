import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import {
  createModelAsset,
  createModelLoadQueue,
  createLatestModelTask,
  loadModelAsset,
  modelLoadQueue,
} from "../apps/web/src/domain/model-assets.js";

test("model decoding stays serial and cancelled queued tasks never execute", async () => {
  const queue = createModelLoadQueue(),
    order = [];
  let finish;
  const first = queue.run(
    () =>
      new Promise((resolve) => {
        order.push("first");
        finish = resolve;
      }),
  );
  await Promise.resolve();
  const cancel = new AbortController();
  const skipped = queue.run(() => order.push("wrong"), {
    signal: cancel.signal,
  });
  const rejection = assert.rejects(skipped, { name: "AbortError" });
  const background = queue.run(() => order.push("background"), {
    background: true,
  });
  const interactive = queue.run(() => order.push("interactive"));
  cancel.abort();
  await rejection;
  assert.equal(queue.status().active, 1);
  finish();
  await Promise.all([first, background, interactive]);
  assert.deepEqual(order, ["first", "interactive", "background"]);
  assert.deepEqual(queue.status(), { active: 0, waiting: 0 });
});

test("new import invalidates all older results, including after editor exit", () => {
  const tasks = createLatestModelTask();
  const a = tasks.start(),
    b = tasks.start();
  assert.equal(a.signal.aborted, true);
  assert.equal(a.isCurrent(), false);
  assert.equal(b.isCurrent(), true);
  tasks.cancel();
  assert.equal(b.isCurrent(), false);
});

test("shared model geometry and bitmap survive preview changes until their final owner releases", () => {
  const bitmap = {
      close() {
        counts.bitmap++;
      },
    },
    texture = new THREE.Texture(bitmap);
  const geometry = new THREE.BoxGeometry(),
    material = new THREE.MeshStandardMaterial({ map: texture });
  const scene = new THREE.Group();
  scene.add(
    new THREE.Mesh(geometry, material),
    new THREE.Mesh(geometry, material),
  );
  const counts = { geometry: 0, material: 0, texture: 0, bitmap: 0 };
  geometry.addEventListener("dispose", () => counts.geometry++);
  material.addEventListener("dispose", () => counts.material++);
  texture.addEventListener("dispose", () => counts.texture++);
  const asset = createModelAsset({ scene }),
    a = asset.instantiate(),
    b = asset.instantiate();
  assert.notEqual(a.scene.children[0].material, material);
  assert.equal(a.scene.children[0].geometry, geometry);
  assert.equal(a.scene.children[0].material, a.scene.children[1].material);
  a.scene.children[0].position.x = 4;
  assert.equal(b.scene.children[0].position.x, 0);
  asset.release();
  a.release();
  a.release();
  assert.deepEqual(counts, { geometry: 0, material: 0, texture: 0, bitmap: 0 });
  b.release();
  assert.deepEqual(counts, { geometry: 1, material: 1, texture: 1, bitmap: 1 });
  assert.throws(() => asset.instantiate());
});

test("thirty mount cycles release every model resource without increasing live ownership", () => {
  let disposed = 0;
  for (let i = 0; i < 30; i++) {
    const scene = new THREE.Group(),
      geometry = new THREE.BoxGeometry();
    geometry.addEventListener("dispose", () => disposed++);
    scene.add(new THREE.Mesh(geometry, new THREE.MeshStandardMaterial()));
    const asset = createModelAsset({ scene }),
      preview = asset.instantiate();
    preview.release();
    asset.release();
    assert.equal(disposed, i + 1);
  }
});

test("a cancelled file read holds its decoding slot until it settles and then releases it", async () => {
  let finish;
  const controller = new AbortController();
  const loading = loadModelAsset(
    {
      name: "slow.glb",
      arrayBuffer: () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    },
    { signal: controller.signal },
  );
  const rejected = assert.rejects(loading, { name: "AbortError" });
  await Promise.resolve();
  controller.abort();
  assert.equal(modelLoadQueue.status().active, 1);
  finish(new ArrayBuffer(0));
  await rejected;
  await Promise.resolve();
  assert.deepEqual(modelLoadQueue.status(), { active: 0, waiting: 0 });
});

test("failed instance creation does not retain its source geometry", () => {
  const scene = new THREE.Group(),
    geometry = new THREE.BoxGeometry(),
    material = new THREE.MeshStandardMaterial();
  let disposed = 0;
  geometry.addEventListener("dispose", () => disposed++);
  material.clone = () => {
    throw Error("instance failure");
  };
  scene.add(new THREE.Mesh(geometry, material));
  const asset = createModelAsset({ scene });
  assert.throws(() => asset.instantiate(), /instance failure/);
  asset.release();
  assert.equal(disposed, 1);
});

test("timed out uncancellable reads release the queue after their late result settles", async () => {
  let finish;
  const loading = loadModelAsset(
    {
      name: "slow.glb",
      arrayBuffer: () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    },
    { timeoutMs: 5 },
  );
  const rejected = assert.rejects(loading, { name: "TimeoutError" });
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal(modelLoadQueue.status().active, 1);
  finish(new ArrayBuffer(0));
  await rejected;
  assert.deepEqual(modelLoadQueue.status(), { active: 0, waiting: 0 });
});
