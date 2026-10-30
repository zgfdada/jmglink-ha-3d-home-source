import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import Fastify from "fastify";
import * as THREE from "three";
import {
  builtinMotionResources,
  motionResourceRule,
} from "../packages/schema/src/motion-library.js";
import {
  normalizeMotionLogic,
  validateMotionOutput,
} from "../packages/schema/src/motion-code.js";
import {
  motionWorkerSource,
  registerMotionWorkerRoute,
} from "../apps/server/src/routes/motionWorker.js";
import { createPartMotionEngine } from "../apps/web/src/domain/part-motion-engine.js";
import { createSurfaceScan } from "../apps/web/src/domain/surface-scan.js";
import { DevicePlatformStore } from "../apps/server/src/device-platform/DevicePlatformStore.js";

test("all nine resources expose executable logic and worker rejects bad syntax and invalid results", () => {
  const messages = [],
    context = vm.createContext({
      self: { postMessage: (data) => messages.push(structuredClone(data)) },
    });
  vm.runInContext(motionWorkerSource(), context);
  const send = (data) => {
    context.input = data;
    vm.runInContext("self.onmessage({data:input})", context, { timeout: 2000 });
    return messages.at(-1);
  };
  for (const resource of builtinMotionResources()) {
    assert.match(resource.effect.program.code, /function update/);
    assert.equal(
      send({ type: "compile", code: resource.effect.program.code }).type,
      "ready",
    );
    const result = send({
      type: "sample",
      id: 1,
      context: {
        time: 1,
        delta: 1 / 60,
        value: resource.effect.to,
        angle: 45,
        phase: 0.2,
        params: resource.effect,
      },
    });
    assert.equal(result.type, "result", resource.name);
    assert.ok(Object.keys(result.result).length);
  }
  assert.equal(
    send({ type: "compile", code: "function update(" }).type,
    "error",
  );
  send({
    type: "compile",
    code: "function update(ctx){return {value:Infinity};}",
  });
  assert.equal(send({ type: "sample", id: 2, context: {} }).type, "error");
  send({
    type: "compile",
    code: 'function update(){return {value:typeof self.fetch === "undefined" ? 1 : 2};}',
  });
  assert.equal(send({ type: "sample", id: 3, context: {} }).result.value, 1);
  assert.throws(() => validateMotionOutput({ offset: [0, NaN, 0] }));
  assert.throws(() => validateMotionOutput({ progress: Array(33).fill(0) }));
  assert.throws(() => validateMotionOutput(Promise.resolve({ value: 1 })));
  assert.throws(() =>
    normalizeMotionLogic({ version: 1, code: "x".repeat(24001) }),
  );
  send({
    type: "compile",
    code: "let count=0;function update(){return {value:++count};}",
  });
  assert.equal(
    send({ type: "sample", id: 10, instance: "a", context: {} }).result.value,
    1,
  );
  assert.equal(
    send({ type: "sample", id: 11, instance: "b", context: {} }).result.value,
    1,
  );
  assert.equal(
    send({ type: "sample", id: 12, instance: "a", context: {} }).result.value,
    2,
  );
  send({ type: "release", instance: "a" });
  assert.equal(
    send({ type: "sample", id: 13, instance: "a", context: {} }).result.value,
    1,
  );
});

test("worker endpoint blocks network and nested workers with a scoped policy", async () => {
  const app = Fastify();
  try {
    await registerMotionWorkerRoute(app);
    const result = await app.inject({ url: "/api/motion-runtime-worker.js" });
    assert.equal(result.statusCode, 200);
    assert.match(result.headers["content-type"], /javascript/);
    assert.match(
      result.headers["content-security-policy"],
      /connect-src 'none'/,
    );
    assert.match(
      result.headers["content-security-policy"],
      /worker-src 'none'/,
    );
    assert.equal(result.headers["cache-control"], "no-store");
  } finally {
    await app.close();
  }
});

test("code drives real model transforms, shared programs keep separate instance values and dispose cleanly", async () => {
  const oldWorker = globalThis.Worker,
    oldDocument = globalThis.document,
    workers = [];
  class TestWorker {
    constructor() {
      workers.push(this);
      this.context = vm.createContext({
        self: {
          postMessage: (data) =>
            queueMicrotask(() => {
              if (!this.terminated)
                this.onmessage?.({ data: structuredClone(data) });
            }),
        },
      });
      vm.runInContext(motionWorkerSource(), this.context);
    }
    postMessage(data) {
      queueMicrotask(() => {
        if (this.terminated) return;
        this.context.input = structuredClone(data);
        try {
          vm.runInContext("self.onmessage({data:input})", this.context, {
            timeout: 2000,
          });
        } catch {
          this.onerror?.();
        }
      });
    }
    terminate() {
      this.terminated = true;
    }
  }
  globalThis.Worker = TestWorker;
  globalThis.document = { baseURI: "http://localhost/" };
  const a = new THREE.Group(),
    b = new THREE.Group();
  let first, second;
  try {
    const resource = builtinMotionResources()[0];
    resource.transitionMs = 0;
    resource.effect.program = {
      version: 1,
      code: "function update(ctx){return {offset:[ctx.value,0,0]};}",
    };
    first = createPartMotionEngine(a, [
      motionResourceRule(
        { ...resource, effect: { ...resource.effect, to: 1 } },
        { transitionMs: 0 },
      ),
    ]);
    second = createPartMotionEngine(b, [
      motionResourceRule(
        { ...resource, effect: { ...resource.effect, to: 2 } },
        { transitionMs: 0 },
      ),
    ]);
    assert.equal(workers.length, 1);
    assert.equal(first.update({ demo: "on" }, 0, 0.1), true);
    for (let i = 0; i < 6; i++) {
      first.update({ demo: "on" }, i / 10, 0.1);
      second.update({ demo: "on" }, i / 10, 0.1);
      for (let q = 0; q < 4; q++) await Promise.resolve();
    }
    assert.equal(a.position.x, 1);
    assert.equal(b.position.x, 2);
    assert.equal(a.position.y, 0);
    assert.deepEqual(first.codeStatus().errors, []);
    first.dispose();
    assert.equal(workers[0].terminated, undefined);
    second.dispose();
    assert.equal(workers[0].terminated, true);
  } finally {
    first?.dispose();
    second?.dispose();
    if (oldWorker === undefined) delete globalThis.Worker;
    else globalThis.Worker = oldWorker;
    if (oldDocument === undefined) delete globalThis.document;
    else globalThis.document = oldDocument;
  }
});

test("custom shader is used by the real surface overlay and preserves original geometry", () => {
  const geometry = new THREE.BoxGeometry(1, 1, 1),
    material = new THREE.MeshStandardMaterial(),
    mesh = new THREE.Mesh(geometry, material);
  const fragment = "void main(){gl_FragColor=vec4(0.0,1.0,0.0,1.0);}";
  const scan = createSurfaceScan(mesh, { fragment });
  assert.equal(scan.overlays[0].overlay.material.fragmentShader, fragment);
  assert.equal(scan.overlays[0].overlay.geometry, geometry);
  scan.dispose();
  assert.equal(mesh.material, material);
  assert.equal(mesh.children.length, 0);
  geometry.dispose();
  material.dispose();
});

test("motion code and shader survive disk reopen and portable device package export", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "ha3d-code-"));
  try {
    const store = await DevicePlatformStore.create(
      path.join(directory, "data"),
      path.join(directory, "assets"),
    );
    await store.upsertDeviceTemplate({
      id: "custom.code",
      name: "代码动效设备",
      capabilities: [
        {
          capabilityId: "state",
          name: "状态",
          kind: "status",
          dataType: "string",
        },
      ],
    });
    const model = store.getModelTemplates().find((m) => m.source);
    const resource = builtinMotionResources().find(
      (r) => r.effect.type === "scan",
    );
    resource.effect.program = {
      version: 1,
      code: "// https://docs.example.invalid/algorithm\nfunction update(ctx){return {phase:ctx.time%1};}",
    };
    resource.effect.shader = {
      fragment:
        "// https://docs.example.invalid/shader\nvoid main(){gl_FragColor=vec4(1.0);}",
    };
    const rule = motionResourceRule(resource, {
      id: "sample",
      capabilityId: "state",
    });
    await store.saveProjectAppearance("custom.code", model.id, {
      partMotionRules: [rule],
    });
    const reopened = await DevicePlatformStore.create(
      path.join(directory, "data"),
      path.join(directory, "assets"),
    );
    const exported = await reopened.exportProjectPackage("custom.code");
    assert.deepEqual(
      exported.modelConfig.partMotionRules[0].effect.program,
      resource.effect.program,
    );
    assert.deepEqual(
      exported.modelConfig.partMotionRules[0].effect.shader,
      resource.effect.shader,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
