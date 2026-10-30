import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import Fastify from "fastify";
import * as THREE from "three";
import {
  MotionLibraryStore,
  registerMotionLibraryRoutes,
} from "../apps/server/src/motion-library/MotionLibraryStore.js";
import { DevicePlatformStore } from "../apps/server/src/device-platform/DevicePlatformStore.js";
import {
  builtinMotionResources,
  motionResourceRule,
  normalizeMotionResource,
  normalizeMotionLibraryPackage,
} from "../packages/schema/src/motion-library.js";
import {
  MOTION_EFFECTS,
  normalizePartMotionRules,
} from "../packages/schema/src/part-motion.js";
import { createPartMotionEngine } from "../apps/web/src/domain/part-motion-engine.js";

test("all builtin motion resources use the existing engine, portable snapshots survive library changes", () => {
  const resources = builtinMotionResources();
  assert.deepEqual(
    resources.map((r) => r.effect.type),
    Object.keys(MOTION_EFFECTS),
  );
  assert.equal(resources.length, 9);
  for (const resource of resources) {
    const root = new THREE.Group(),
      mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshStandardMaterial(),
      );
    root.add(mesh);
    const snapshot = motionResourceRule(resource, { targets: ["root/0"] });
    const engine = createPartMotionEngine(root, [snapshot]);
    for (let i = 0; i < 12; i++) engine.update({ demo: "on" }, i / 10, 0.1);
    engine.update({ demo: "off" }, 2, 0.1);
    engine.dispose();
    mesh.geometry.dispose();
    mesh.material.dispose();
    assert.deepEqual(normalizePartMotionRules([snapshot])[0], snapshot);
  }
  assert.throws(
    () =>
      normalizeMotionResource({
        ...resources[3],
        effect: { type: "scale", from: 0, to: 2 },
      }),
    /缩放值/,
  );
  assert.throws(
    () =>
      normalizeMotionResource({
        ...resources[7],
        effect: {
          type: "flow",
          path: [
            [0, 0, 0],
            [0, 0, 0],
          ],
        },
      }),
    /重合/,
  );
  assert.throws(
    () =>
      normalizeMotionResource({
        ...resources[0],
        effect: { type: "execute", script: "bad" },
      }),
    /不支持/,
  );
});

test("motion library CRUD is persistent, guarded, restores builtins and preserves configured rules", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "ha3d-motion-test-"));
  const app = Fastify();
  try {
    const store = await MotionLibraryStore.create(directory);
    await registerMotionLibraryRoutes(app, store);
    const initial = (await app.inject({ url: "/api/motion-library" })).json();
    assert.equal(initial.resources.length, 9);
    assert.equal(initial.revision, 0);
    const base = initial.resources.find((r) => r.effect.type === "scan");
    const created = await app.inject({
      method: "POST",
      url: "/api/motion-library",
      payload: {
        expectedRevision: 0,
        resource: {
          ...base,
          name: "车辆能量扫光",
          effect: { ...base.effect, color: "#00ffcc", speed: 2 },
        },
      },
    });
    assert.equal(created.statusCode, 200);
    const custom = created.json().item;
    assert.equal(custom.builtin, false);
    assert.match(custom.id, /^custom\.motion\./);
    const rule = motionResourceRule(custom, {
      id: "rule-car",
      capabilityId: "charging",
      targets: ["root/0"],
    });
    let result = await app.inject({
      method: "PUT",
      url: `/api/motion-library/${custom.id}`,
      payload: { expectedRevision: 0, resource: custom },
    });
    assert.equal(result.statusCode, 409);
    result = await app.inject({
      method: "PUT",
      url: `/api/motion-library/${custom.id}`,
      payload: {
        expectedRevision: 1,
        resource: {
          ...custom,
          effect: { ...custom.effect, speed: 3 },
          name: "通用能量扫光",
        },
      },
    });
    assert.equal(result.statusCode, 200);
    assert.equal(result.json().item.version, 2);
    assert.equal(rule.effect.speed, 2);
    assert.equal(rule.motionResourceId, custom.id);
    const reopened = await MotionLibraryStore.create(directory);
    assert.equal(
      reopened.list().find((r) => r.id === custom.id).effect.speed,
      3,
    );
    assert.equal(reopened.revision, 2);
    result = await app.inject({
      method: "PUT",
      url: `/api/motion-library/${base.id}`,
      payload: {
        expectedRevision: 2,
        resource: {
          ...base,
          name: "定制默认扫光",
          effect: { ...base.effect, width: 0.4 },
        },
      },
    });
    assert.equal(result.statusCode, 200);
    result = await app.inject({
      method: "PUT",
      url: `/api/motion-library/${base.id}`,
      payload: {
        expectedRevision: 3,
        resource: { ...base, effect: { type: "visible", to: 0 } },
      },
    });
    assert.equal(result.statusCode, 400);
    result = await app.inject({
      method: "DELETE",
      url: `/api/motion-library/${base.id}`,
      payload: { expectedRevision: 3 },
    });
    assert.equal(result.statusCode, 400);
    result = await app.inject({
      method: "POST",
      url: `/api/motion-library/${base.id}/reset`,
      payload: { expectedRevision: 3 },
    });
    assert.equal(result.statusCode, 200);
    assert.deepEqual(result.json().item, base);
    result = await app.inject({
      method: "DELETE",
      url: `/api/motion-library/${custom.id}`,
      payload: { expectedRevision: 4 },
    });
    assert.equal(result.statusCode, 200);
    assert.equal(store.list().length, 9);
    assert.equal(rule.effect.speed, 2);
    assert.equal((await MotionLibraryStore.create(directory)).list().length, 9);
    const previous = store.export();
    assert.throws(
      () =>
        normalizeMotionLibraryPackage({ ...previous, resources: [base, base] }),
      /重复/,
    );
    await assert.rejects(
      () =>
        store.restore({
          ...previous,
          resources: [{ ...base, effect: { type: "script" } }],
        }),
      /不支持/,
    );
    assert.deepEqual(store.export(), previous);
    const results = await Promise.allSettled([
      store.save({ ...base, name: "并发 A" }, undefined, 5),
      store.save({ ...base, name: "并发 B" }, undefined, 5),
    ]);
    assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
    assert.equal(store.revision, 6);
  } finally {
    await app.close();
    await rm(directory, { recursive: true, force: true });
  }
});

test("global device and instance backup carries motion library; old bundles preserve current library", async () => {
  const directory = await mkdtemp(
    path.join(os.tmpdir(), "ha3d-motion-backup-"),
  );
  try {
    const platform = await DevicePlatformStore.create(
      path.join(directory, "data"),
      path.join(directory, "assets"),
    );
    platform.motionLibrary = await MotionLibraryStore.create(
      path.join(directory, "data"),
    );
    const custom = await platform.motionLibrary.save({
      ...builtinMotionResources()[8],
      name: "实例内的扫光",
    });
    const bundle = await platform.exportBundle();
    assert.ok(bundle.motionLibrary.resources.some((r) => r.id === custom.id));
    const restored = await DevicePlatformStore.create(
      path.join(directory, "restore"),
      path.join(directory, "assets-restore"),
    );
    restored.motionLibrary = await MotionLibraryStore.create(
      path.join(directory, "restore"),
    );
    await restored.importBundle(bundle);
    assert.equal(restored.motionLibrary.list().length, 10);
    const legacy = structuredClone(bundle);
    delete legacy.motionLibrary;
    await restored.importBundle(legacy);
    assert.equal(restored.motionLibrary.list().length, 10);
    const invalid = structuredClone(bundle);
    invalid.motionLibrary.resources[0].effect.type = "unknown";
    await assert.rejects(() => restored.importBundle(invalid), /不支持/);
    assert.equal(restored.motionLibrary.list().length, 10);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
