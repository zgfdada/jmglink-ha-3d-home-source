import {
  modelPartLabel,
  normalizePartLabels,
} from "../packages/schema/src/model-part-labels.js";
import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  normalizePartMotionRules,
  partMotionIssues,
  motionCapabilityValues,
} from "../packages/schema/src/part-motion.js";
import {
  createPartMotionEngine,
  modelPartIndex,
} from "../apps/web/src/domain/part-motion-engine.js";
import { DevicePlatformStore } from "../apps/server/src/device-platform/DevicePlatformStore.js";
import { registerDevicePlatformRoutes } from "../apps/server/src/routes/devicePlatformRoutes.js";
import Fastify from "fastify";
import { capabilityDependencies } from "../apps/server/src/device-platform/capabilityDependencies.js";
const rule = (effect = {}, extra = {}) =>
  normalizePartMotionRules([
    {
      id: "r",
      name: "测试动效",
      targets: ["root/0"],
      capabilityId: "state",
      condition: { operator: "eq", value: "on" },
      transitionMs: 0,
      effect: { type: "translate", axis: "x", to: 1, ...effect },
      ...extra,
    },
  ])[0];
function fixture() {
  const root = new THREE.Group();
  root.name = "设备";
  const shared = new THREE.MeshStandardMaterial({ color: "#ffffff" });
  const a = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), shared);
  a.name = "同名部件";
  const b = a.clone();
  b.position.x = 2;
  root.add(a, b);
  return { root, a, b, shared };
}
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-5, `${a} ≠ ${b}`);
test("部件路径区分同名零件；位移只作用指定实例并可恢复", () => {
  const { root, a, b, shared } = fixture();
  const entries = modelPartIndex(root);
  assert.equal(entries[1].name, entries[2].name);
  assert.notEqual(entries[1].path, entries[2].path);
  const engine = createPartMotionEngine(root, [rule()]);
  engine.update({ state: "on" });
  close(a.position.x, 1);
  close(b.position.x, 2);
  engine.update({ state: "off" });
  close(a.position.x, 0);
  engine.dispose();
  assert.equal(a.material, shared);
  close(a.position.x, 0);
});
test("数值连续映射、过渡、优先级和离线恢复没有累积漂移", () => {
  const { root, a } = fixture();
  const low = rule(
    {},
    {
      mapping: { enabled: true, inputMin: 0, inputMax: 100 },
      condition: { operator: "gte", value: "0" },
    },
  );
  const high = rule(
    { to: 3 },
    { id: "higher", priority: 10, condition: { operator: "eq", value: "100" } },
  );
  const engine = createPartMotionEngine(root, [low, high]);
  engine.update({ state: 50 });
  close(a.position.x, 0.5);
  engine.update({ state: 100 });
  close(a.position.x, 3);
  for (let i = 0; i < 100; i++) engine.update({ state: 100 });
  close(a.position.x, 3);
  engine.update({ state: 100 }, 0, 0.016, { available: false });
  close(a.position.x, 0);
  engine.dispose();
  const slow = createPartMotionEngine(root, [
    rule({ to: 2 }, { transitionMs: 300 }),
  ]);
  slow.update({ state: "on" });
  assert.ok(a.position.x > 0 && a.position.x < 2);
  for (let i = 0; i < 100; i++) slow.update({ state: "on" });
  close(a.position.x, 2);
  slow.dispose();
});
test("旋转轴心、持续旋转、缩放、显隐和保持末态有效", () => {
  let f = fixture(),
    engine = createPartMotionEngine(f.root, [
      rule({ type: "rotate", axis: "z", to: 90, pivot: [1, 0, 0] }),
    ]);
  engine.update({ state: "on" });
  close(f.a.rotation.z, Math.PI / 2);
  close(f.a.position.x, 1);
  close(f.a.position.y, -1);
  engine.dispose();
  engine = createPartMotionEngine(f.root, [
    rule({ type: "spin", axis: "y", to: 90 }, { endBehavior: "hold" }),
  ]);
  for (let i = 0; i < 10; i++) engine.update({ state: "on" }, 0, 0.1);
  close(f.a.rotation.y, Math.PI / 2);
  engine.update({ state: "off" });
  close(f.a.rotation.y, Math.PI / 2);
  engine.update({ state: "unavailable" });
  close(f.a.rotation.y, 0);
  engine.dispose();
  engine = createPartMotionEngine(f.root, [rule({ type: "scale", to: 2 })]);
  engine.update({ state: "on" });
  close(f.a.scale.x, 2);
  engine.dispose();
  engine = createPartMotionEngine(f.root, [rule({ type: "visible", to: 0 })]);
  engine.update({ state: "on" });
  assert.equal(f.a.visible, false);
  engine.dispose();
  assert.equal(f.a.visible, true);
});
test("材质克隆隔离、发光呼吸与颜色恢复不污染共享材质", () => {
  const { root, a, b, shared } = fixture();
  const engine = createPartMotionEngine(root, [
    rule({ type: "emissive", color: "#ff0000", intensity: 2, mode: "breathe" }),
  ]);
  engine.update({ state: "on" }, 0, 0.1);
  assert.equal(a.material.emissive.getHexString(), "ff0000");
  assert.equal(b.material.emissive.getHexString(), "000000");
  assert.equal(shared.emissive.getHexString(), "000000");
  const old = a.material.emissiveIntensity;
  engine.update({ state: "on" }, 10, 0.1);
  assert.notEqual(a.material.emissiveIntensity, old);
  engine.dispose();
  assert.equal(a.material, shared);
  const color = createPartMotionEngine(root, [
    rule({ type: "color", color: "#00ff00" }),
  ]);
  color.update({ state: "on" });
  assert.equal(a.material.color.getHexString(), "00ff00");
  color.dispose();
  assert.equal(shared.color.getHexString(), "ffffff");
});
test("路径流光沿坐标推进，暂停冻结，卸载清理全部几何和材质", () => {
  const { root, a } = fixture();
  const engine = createPartMotionEngine(root, [
    rule({
      type: "flow",
      path: [
        [0, 0, 0],
        [0, 1, 0],
      ],
    }),
  ]);
  engine.update({ state: "on" }, 0, 0.1);
  const group = a.children.find((n) => n.userData.partMotionOverlay);
  assert.ok(group);
  const before = group.children[1].position.y;
  engine.update({ state: "on" }, 10, 0.1);
  assert.notEqual(group.children[1].position.y, before);
  const frozen = group.children[1].position.clone();
  engine.update({ state: "on" }, 20, 0);
  assert.ok(group.children[1].position.equals(frozen));
  let disposed = 0;
  group.children.forEach((n) =>
    n.geometry.addEventListener("dispose", () => disposed++),
  );
  engine.dispose();
  assert.equal(a.children.length, 0);
  assert.equal(disposed, 6);
  assert.equal(engine.update({ state: "on" }), false);
});
test("规则校验阻止脚本路径、无效范围、缺失能力与父子重复目标；换模型身份不误绑定", () => {
  assert.throws(() => rule({ type: "eval" }));
  assert.throws(() => rule({}, { targets: ["root/__proto__"] }));
  assert.throws(() => rule({ type: "flow", path: [[0, 0, 0]] }));
  assert.throws(() =>
    rule({}, { mapping: { enabled: true, inputMin: 1, inputMax: 1 } }),
  );
  assert.throws(() => normalizePartMotionRules([rule(), rule()]));
  assert.ok(partMotionIssues([rule()], []).length);
  assert.ok(
    partMotionIssues(
      [rule({}, { targets: ["root", "root/0"] })],
      [{ capabilityId: "state" }],
    ).some((s) => s.includes("父部件")),
  );
  const { root, a } = fixture();
  const stale = rule({}, { targetNames: { "root/0": "已更换部件" } });
  assert.ok(
    partMotionIssues([stale], [{ capabilityId: "state" }], modelPartIndex(root))
      .length,
  );
  const engine = createPartMotionEngine(root, [stale]);
  engine.update({ state: "on" });
  close(a.position.x, 0);
  engine.dispose();
});
test("实时能力读取使用已保存的属性映射且不会访问原型属性", () => {
  const e = {
    deviceEntities: [
      { entityId: "sensor.test", state: "on", attributes: { temperature: 65 } },
    ],
    deviceCapabilityBindings: { power: ["sensor.test"] },
    deviceCapabilityMappings: {
      temperature: { entityId: "sensor.test", attribute: "temperature" },
      blocked: { entityId: "sensor.test", attribute: "__proto__" },
    },
  };
  const values = motionCapabilityValues(e);
  assert.equal(values.power, "on");
  assert.equal(values.temperature, 65);
  assert.equal(values.blocked, undefined);
});
test("部件规则经过真实 API、磁盘重开、导出保留；删除能力有依赖警告", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "part-motion-"));
  const app = Fastify();
  try {
    const store = await DevicePlatformStore.create(
      path.join(dir, "data"),
      path.join(dir, "assets"),
    );
    await store.upsertDeviceTemplate({
      id: "custom.motion",
      name: "动效设备",
      capabilities: [
        {
          capabilityId: "state",
          name: "运行状态",
          kind: "status",
          dataType: "string",
        },
      ],
    });
    const model = store.getModelTemplates().find((m) => m.source);
    assert.ok(model);
    await registerDevicePlatformRoutes(app, store, {
      getDevices: () => [],
      getEntities: () => [],
    });
    const url = "/api/device-platform/projects/custom.motion/appearance";
    const payload = {
      modelTemplateId: model.id,
      appearance: {
        dimensions: { width: 1, height: 1, depth: 1 },
        partLabels: { "root/0": "中文加热器" },
        partMotionRules: [rule()],
      },
    };
    const saved = await app.inject({ method: "PUT", url, payload });
    assert.equal(saved.statusCode, 200, saved.body);
    const reopened = await DevicePlatformStore.create(
      path.join(dir, "data"),
      path.join(dir, "assets"),
    );
    const project = reopened
      .getDeviceTemplates()
      .find((p) => p.id === "custom.motion");
    assert.deepEqual(project.appearance.partMotionRules, [rule()]);
    assert.equal(project.appearance.partLabels["root/0"], "中文加热器");
    assert.deepEqual(
      (await reopened.exportProjectPackage(project.id)).modelConfig
        .partMotionRules,
      [rule()],
    );
    assert.ok(
      capabilityDependencies(project, [], [], "state").some((d) =>
        d.component.includes("部件动效"),
      ),
    );
    const bad = await app.inject({
      method: "PUT",
      url,
      payload: {
        ...payload,
        appearance: {
          ...payload.appearance,
          partMotionRules: [rule({}, { capabilityId: "missing" })],
        },
      },
    });
    assert.equal(bad.statusCode, 404);
    assert.deepEqual(
      store.getDeviceTemplates().find((p) => p.id === project.id).appearance
        .partMotionRules,
      [rule()],
    );
    const removed = await app.inject({ method: "PUT", url, payload: {
      ...payload, appearance: { ...payload.appearance, partMotionRules: [] },
    }});
    assert.equal(removed.statusCode, 200, removed.body);
    const afterDelete = await DevicePlatformStore.create(path.join(dir,"data"),path.join(dir,"assets"));
    const deletedProject = afterDelete.getDeviceTemplates().find(p => p.id === project.id);
    assert.deepEqual(deletedProject.appearance.partMotionRules, [], "删除后重开磁盘不能恢复旧规则");
    assert.deepEqual((await afterDelete.exportProjectPackage(project.id)).modelConfig.partMotionRules, []);
    assert.ok(!capabilityDependencies(deletedProject,[],[],"state").some(d => d.component.includes("部件动效")));
  } finally {
    await app.close();
    await rm(dir, { recursive: true, force: true });
  }
});

test("部件默认中文、重名路径别名与原始节点标识分离", () => {
  assert.equal(
    modelPartLabel({ path: "root/0", name: "Heater_Coil", mesh: true }),
    "加热管",
  );
  assert.equal(
    modelPartLabel({ path: "root/1", name: "WaterTank", mesh: true }),
    "水箱",
  );
  assert.equal(
    modelPartLabel({ path: "root/3", name: "UnknownMesh", mesh: true }),
    "网格部件 3",
  );
  assert.equal(
    modelPartLabel(
      { path: "root/0", name: "Heater_Coil" },
      { "root/0": "左侧加热器" },
    ),
    "左侧加热器",
  );
  assert.throws(() => normalizePartLabels({ "root/0": "Heater" }));
  assert.throws(() => normalizePartLabels({ "__proto__/x": "加热管" }));
});

test('数值映射可连续驱动发光强度',()=>{const {root,a}=fixture();const engine=createPartMotionEngine(root,[rule({type:'emissive',color:'#ff0000',from:0,to:4},{mapping:{enabled:true,inputMin:0,inputMax:100},condition:{operator:'gte',value:'0'}})]);engine.update({state:50});close(a.material.emissiveIntensity,2);engine.update({state:100});close(a.material.emissiveIntensity,4);engine.dispose();});
