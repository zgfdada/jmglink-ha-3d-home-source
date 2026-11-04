import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { BoxGeometry, Group, Mesh, MeshStandardMaterial } from "three";
import {
  createRuntimeModelGlow,
  disposeRuntimeModelGlow,
  updateRuntimeModelGlow,
} from "../apps/web/src/domain/runtime-model-glow.js";

test("generic running effect adds subtle blue outlines without changing model materials", () => {
  const root = new Group();
  const geometry = new BoxGeometry(0.6, 0.9, 0.5);
  const original = new MeshStandardMaterial({ color: "#dc7650" });
  const body = new Mesh(geometry, original);
  root.add(body);

  const effect = createRuntimeModelGlow(root);
  assert.equal(effect.shells.length, 2);
  assert.equal(effect.edges.length, 1);
  assert.equal(body.material, original);
  assert.equal(body.children.length, 3);
  assert.equal(effect.shells[0].scale.x, 1.045);
  assert.ok(effect.edges[0].geometry.getAttribute("position").count > 0);
  assert.equal(effect.shells[0].material.transparent, true);
  assert.equal(effect.shells[0].material.depthWrite, false);
  assert.equal(effect.shells[0].material.color.getHex(), 0x58b8ff);
  // Running effects must not add a camera-facing halo or illuminate nearby surfaces.
  const sceneEffects = [];
  root.traverse((part) => {
    if (part.isSprite || part.isLight) sceneEffects.push(part);
  });
  assert.deepEqual(sceneEffects, []);
  assert.deepEqual(root.children, [body]);
  const start = effect.shells[0].material.opacity;
  updateRuntimeModelGlow(effect, 0.6);
  assert.notEqual(effect.shells[0].material.opacity, start);

  disposeRuntimeModelGlow(effect);
  assert.equal(body.children.length, 0);
  assert.equal(root.children.length, 1);
  assert.equal(body.material, original);
  assert.equal(geometry.getAttribute("position").count, 24);
  geometry.dispose();
  original.dispose();
});

test("runtime preview and uploaded device no longer spin the complete model", async () => {
  const [scene, preview] = await Promise.all([
    readFile(new URL("../apps/web/src/app/scene.js", import.meta.url), "utf8"),
    readFile(
      new URL("../apps/web/src/app/device-development-center/model-preview.jsx", import.meta.url),
      "utf8",
    ),
  ]);
  assert.equal(scene.includes("s.rotation.y += Math.min(delta, 0.1) * 0.24"), false);
  assert.equal(preview.includes("animationTarget.rotation.y +="), false);
  assert.ok(scene.includes("createRuntimeModelGlow(root)"));
  assert.ok(preview.includes("createRuntimeModelGlow(root)"));
});
