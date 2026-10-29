import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { disableSceneEffectPicking, configureDeviceModelPicking } from "../apps/web/src/domain/scene-picking.js";
import { createRuntimeModelGlow, disposeRuntimeModelGlow } from "../apps/web/src/domain/runtime-model-glow.js";
import { createPartMotionEngine } from "../apps/web/src/domain/part-motion-engine.js";
import { normalizePartMotionRules } from "../packages/schema/src/part-motion.js";

test("light selection decorations cannot intercept a click below the lamp", () => {
  const root = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.098, 0.108, 0.018, 48));
  const effects = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.56, 0.7), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.008 }));
  effects.add(frame);
  root.add(body, effects);
  root.updateMatrixWorld(true);
  const ray = new THREE.Raycaster(new THREE.Vector3(0, -0.2, 2), new THREE.Vector3(0, 0, -1));
  assert.equal(ray.intersectObject(root, true)[0].object, frame);
  disableSceneEffectPicking(effects);
  assert.equal(ray.intersectObject(root, true).length, 0);
  ray.set(new THREE.Vector3(0, 2, 0), new THREE.Vector3(0, -1, 0));
  assert.equal(ray.intersectObject(root, true)[0].object, body);
  for (const mesh of [body, frame]) { mesh.geometry.dispose(); mesh.material.dispose(); }
});

test("nested light beams and floor glow allow selection of a device behind them", () => {
  const root = new THREE.Group();
  const effects = new THREE.Group();
  const nested = new THREE.Group();
  const beam = new THREE.Mesh(new THREE.ConeGeometry(0.44, 1.28, 40, 1, true), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
  const device = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1));
  device.position.z = -1;
  nested.add(beam);
  effects.add(nested);
  root.add(effects, device);
  root.updateMatrixWorld(true);
  const ray = new THREE.Raycaster(new THREE.Vector3(0, 0, 2), new THREE.Vector3(0, 0, -1));
  assert.equal(ray.intersectObject(root, true)[0].object, beam);
  disableSceneEffectPicking(effects);
  assert.equal(ray.intersectObject(root, true)[0].object, device);
  for (const mesh of [beam, device]) { mesh.geometry.dispose(); mesh.material.dispose(); }
});

test("generic model picking follows a moving part and excludes hidden or transparent parts", () => {
  const root = new THREE.Group();
  const part = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), new THREE.MeshStandardMaterial());
  root.add(part);
  configureDeviceModelPicking(root);
  const configuredRaycast = part.raycast;
  configureDeviceModelPicking(root);
  assert.equal(part.raycast, configuredRaycast, "re-render must not stack raycast wrappers");
  const ray = new THREE.Raycaster(new THREE.Vector3(0, 0, 2), new THREE.Vector3(0, 0, -1));
  root.updateMatrixWorld(true);
  assert.equal(ray.intersectObject(root, true)[0].object, part);
  part.position.x = 0.4;
  root.updateMatrixWorld(true);
  assert.equal(ray.intersectObject(root, true).length, 0);
  ray.set(new THREE.Vector3(0.4, 0, 2), new THREE.Vector3(0, 0, -1));
  assert.equal(ray.intersectObject(root, true)[0].object, part);
  root.visible = false;
  assert.equal(ray.intersectObject(root, true).length, 0);
  root.visible = true;
  part.visible = false;
  assert.equal(ray.intersectObject(root, true).length, 0);
  part.visible = true;
  part.material.transparent = true;
  part.material.opacity = 0;
  assert.equal(ray.intersectObject(root, true).length, 0);
  part.material.opacity = 0.4;
  assert.equal(ray.intersectObject(root, true)[0].object, part, "visible translucent model surfaces remain selectable");
  root.userData.partMotionOverlay = true;
  assert.equal(ray.intersectObject(root, true).length, 0);
  part.geometry.dispose(); part.material.dispose();
});

test("custom model glow shells, edges and halo never enlarge the physical hit area", () => {
  const root = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.9, 0.5), new THREE.MeshStandardMaterial());
  root.add(body);
  configureDeviceModelPicking(root);
  const glow = createRuntimeModelGlow(root);
  root.updateMatrixWorld(true);
  const ray = new THREE.Raycaster(new THREE.Vector3(0.4, 0, 2), new THREE.Vector3(0, 0, -1));
  assert.equal(ray.intersectObject(root, true).length, 0);
  ray.set(new THREE.Vector3(0, 0, 2), new THREE.Vector3(0, 0, -1));
  assert.ok(ray.intersectObject(root, true).every(hit => hit.object === body));
  assert.ok(ray.intersectObject(root, true).length > 0);
  disposeRuntimeModelGlow(glow);
  body.geometry.dispose(); body.material.dispose();
});

test("a flow path outside a custom device remains visible without becoming clickable", () => {
  const root = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), new THREE.MeshStandardMaterial());
  root.add(body);
  configureDeviceModelPicking(root);
  const engine = createPartMotionEngine(root, normalizePartMotionRules([{
    id: "flow", name: "流光", targets: ["root/0"], capabilityId: "state",
    condition: { operator: "eq", value: "on" },
    effect: { type: "flow", path: [[0.3, 0, 0], [0.6, 0, 0]] },
  }]));
  engine.update({ state: "on" });
  assert.ok(body.children.some(child => child.userData.partMotionOverlay && child.visible));
  root.updateMatrixWorld(true);
  const ray = new THREE.Raycaster(new THREE.Vector3(0.45, 0, 2), new THREE.Vector3(0, 0, -1));
  assert.equal(ray.intersectObject(root, true).length, 0);
  engine.dispose();
  body.geometry.dispose(); body.material.dispose();
});
