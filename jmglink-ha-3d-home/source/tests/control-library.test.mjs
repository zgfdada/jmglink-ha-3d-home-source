import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import Fastify from "fastify";
import { build } from "esbuild";
import {
  builtinControls,
  editableLibraryControl,
  effectiveControl,
  controlUnit,
  normalizeControlValues,
  resolvePropertyStyle,
  normalizeLibraryControl,
  normalizeLibraryPackage,
  attachLibraryControl,
  CONTROL_PACKAGE_FORMAT,
  withControlPropertyDefault,
} from "../packages/schema/src/control-library.js";
import {
  ControlLibraryStore,
  registerControlLibraryRoutes,
} from "../apps/server/src/control-library/ControlLibraryStore.js";
import { normalizeControlPanelTemplate } from "../apps/server/src/device-platform/devicePlatformSchema.js";
import { DevicePlatformStore } from "../apps/server/src/device-platform/DevicePlatformStore.js";
const custom = () => ({
  ...builtinControls().find(
    (item) => item.type === "number" && item.variant === "metric",
  ),
  id: "custom.test-number",
  name: "测试数值",
  style: { color: "#aaffdd" },
  ui: {
    kind: "column",
    children: [
      { kind: "label" },
      {
        kind: "row",
        children: [
          { kind: "value", style: { fontSize: "30px" } },
          { kind: "unit" },
        ],
      },
    ],
  },
});
const bundle = (controls) => ({
  format: CONTROL_PACKAGE_FORMAT,
  schemaVersion: 1,
  controls,
});
test("资源库API数据展开保留引用元数据，39种控件列表与预览可执行渲染", async () => {
  const controls = builtinControls().map((item) => ({
    ...normalizeLibraryControl(item), references: [{ panelId: "test-panel" }],
  }));
  for (const item of controls) {
    const expanded = editableLibraryControl(item);
    assert.deepEqual(expanded.references, item.references);
    assert.notEqual(expanded.references, item.references);
    assert.equal(normalizeLibraryControl(expanded).references, undefined);
  }
  // Execute the real JSX component tree without DOM/browser access. Stub hooks
  // seed the post-fetch state, so rendering includes cards and every Preview.
  const result = await build({
    entryPoints: [new URL("../apps/web/src/app/device-development-center/control-library.jsx", import.meta.url).pathname.replace(/^\/(\w:)/, "$1")],
    bundle: true, write: false, format: "cjs", platform: "node",
    jsxFactory: "React.createElement", jsxFragment: "React.Fragment",
    loader: { ".css": "empty" },
    plugins: [{ name: "render-test-hooks", setup(builder) {
      builder.onLoad({ filter: /vendor[\\/]react\.js$/ }, () => ({ contents: `
        let first = true;
        export const a = {
          Fragment: 'fragment',
          useState(initial) { const value = first ? ${JSON.stringify(controls)} : typeof initial === 'function' ? initial() : initial; first = false; return [value, () => {}]; },
          useEffect() {}, useMemo(fn) { return fn(); }, useRef() { return { current: null }; },
          createElement(type, props, ...children) { return typeof type === 'function' ? type(props || {}) : { type, props, children }; }
        };`, loader: "js" }));
    } }],
  });
  const module = { exports: {} };
  new Function("module", "exports", result.outputFiles[0].text)(module, module.exports);
  const tree = module.exports.default({ notify() {} });
  const count = (node) => !node || typeof node !== "object" ? 0 :
    Array.isArray(node) ? node.reduce((sum, child) => sum + count(child), 0) :
      (node.type === "article" ? 1 : 0) + count(node.children);
  assert.equal(count(tree), 39);
});
test("内置大字默认居中，实例覆盖保留；环形无重复值，引用文本突出显示", async () => {
  const metric = normalizeLibraryControl(builtinControls().find((c) => c.id === "builtin.number.metric"));
  const legacy = { ...metric, properties: metric.properties.map((p) =>
    p.key === "valueAlign" ? { ...p, default: "flex-start" } : p) };
  const normalized = normalizeLibraryControl(legacy);
  assert.equal(normalized.properties.find((p) => p.key === "valueAlign").default, "center");
  const instance = { type: "number", variant: "metric", libraryDefinition: legacy };
  assert.equal(effectiveControl(instance).props.valueAlign, "center");
  assert.equal(effectiveControl({ ...instance, props: { valueAlign: "flex-end" } }).props.valueAlign, "flex-end");
  const ring = editableLibraryControl(builtinControls().find((c) => c.id === "builtin.progress.circle"));
  assert.deepEqual(ring.ui.children.map((n) => n.kind), ["row", "progress"]);
  const quote = editableLibraryControl(builtinControls().find((c) => c.id === "builtin.text.quote"));
  assert.equal(quote.ui.children[1].children[0].style.fontSize, "28px");
  assert.equal(quote.properties.find((p) => p.key === "valueAlign").default, "center");
  assert.equal(quote.ui.children[1].style.justifyContent, "{{props.valueAlign}}");
  const quoteInstance = { type: "text", variant: "quote", libraryDefinition: { ...quote, properties: quote.properties.filter((p) => p.key !== "valueAlign") } };
  assert.equal(effectiveControl(quoteInstance).props.valueAlign, "center");
  assert.equal(effectiveControl({ ...quoteInstance, props: { valueAlign: "flex-start" } }).props.valueAlign, "flex-start");
  assert.equal(withControlPropertyDefault(quote, "valueAlign", "flex-end").properties.find((p) => p.key === "valueAlign").default, "flex-end");
  for (const id of ["builtin.slider.steps", "builtin.number.stepper", "builtin.progress.line", "builtin.progress.steps"]) {
    const item = normalizeLibraryControl(builtinControls().find((c) => c.id === id));
    assert.equal(item.properties.find((p) => p.key === "valueAlign").default, "center", id);
    assert.equal(normalizeLibraryControl({ ...item, properties: item.properties.filter((p) => p.key !== "valueAlign") }).properties.find((p) => p.key === "valueAlign").default, "center", id);
    const legacyItem = { ...item, properties: item.properties.map((p) => p.key === "valueAlign" ? { ...p, default: "flex-start" } : p) };
    assert.equal(effectiveControl({ type: item.type, variant: item.variant, libraryDefinition: legacyItem }).props.valueAlign, "center", id);
    assert.equal(effectiveControl({ type: item.type, variant: item.variant, libraryDefinition: legacyItem, props: { valueAlign: "flex-end" } }).props.valueAlign, "flex-end", id);
  }
  await sandbox(async (dir) => {
    const store = await ControlLibraryStore.create(dir);
    await store.update(metric.id, normalized);
    const reopened = await ControlLibraryStore.create(dir);
    assert.equal(reopened.list().find((c) => c.id === metric.id).properties.find((p) => p.key === "valueAlign").default, "center");
  });
});
async function sandbox(fn) {
  const dir = await mkdtemp(path.join(os.tmpdir(), "ha3d-control-library-"));
  try {
    return await fn(dir);
  } finally {
    assert.ok(path.basename(dir).startsWith("ha3d-control-library-"));
    await rm(dir, { recursive: true, force: true });
  }
}
test("编辑器默认属性进入保存请求，API落盘后重建Store仍保留，旧面板快照不变", () =>
  sandbox(async (dir) => {
    const store = await ControlLibraryStore.create(dir);
    const original = editableLibraryControl(store.list().find((c) => c.id === "builtin.number.metric"));
    const frozen = attachLibraryControl({ id: "placed", type: "number", props: { valueAlign: "flex-end" } }, original);
    const edited = withControlPropertyDefault(original, "valueAlign", "center");
    const withUnit = withControlPropertyDefault(edited, "unit", "min");
    assert.equal(effectiveControl({ libraryDefinition: withUnit }).props.valueAlign, "center");
    assert.throws(() => withControlPropertyDefault(edited, "valueAlign", "invalid"));
    assert.throws(() => withControlPropertyDefault(edited, "unregistered", "center"));
    const app = Fastify();
    await registerControlLibraryRoutes(app, store);
    try {
      const saved = await app.inject({ method: "PUT", url: "/api/control-library/" + edited.id, payload: withUnit });
      assert.equal(saved.statusCode, 200);
      const disk = JSON.parse(await readFile(path.join(dir, "control-library.json"), "utf8"));
      assert.equal(disk.controls.find((c) => c.id === edited.id).properties.find((p) => p.key === "valueAlign").default, "center");
      const reopened = await ControlLibraryStore.create(dir);
      const loaded = reopened.list().find((c) => c.id === edited.id);
      assert.equal(loaded.version, 2);
      assert.equal(effectiveControl({ libraryDefinition: loaded }).props.unit, "min");
      assert.equal(effectiveControl({ libraryDefinition: loaded }).props.valueAlign, "center");
      // Changing to a non-default alignment must also survive; a hardcoded center cannot pass.
      await reopened.update(loaded.id, withControlPropertyDefault(loaded, "valueAlign", "flex-start"));
      const again = await ControlLibraryStore.create(dir);
      assert.equal(effectiveControl({ libraryDefinition: again.list().find((c) => c.id === edited.id) }).props.valueAlign, "flex-start");
      assert.equal(effectiveControl(frozen).props.valueAlign, "flex-end");
    } finally {
      await app.close();
    }
    const editor = await readFile(new URL("../apps/web/src/app/device-development-center/control-library.jsx", import.meta.url), "utf8");
    assert.match(editor, /onDefaultChange=\{changeDefault\}/);
    assert.match(editor, /withControlPropertyDefault\(parsed, key, value\)/);
  }));
test("现有13类39风格均为可验证的库控件；老面板自动附加快照", () => {
  const items = builtinControls();
  assert.equal(items.length, 39);
  assert.equal(new Set(items.map((item) => item.type)).size, 13);
  items.forEach(normalizeLibraryControl);
  const panel = normalizeControlPanelTemplate({
    id: "custom.panel",
    sections: [
      {
        id: "main",
        controls: [
          {
            id: "remaining",
            type: "number",
            variant: "metric",
            capabilityId: "time",
          },
        ],
      },
    ],
  });
  assert.equal(
    panel.sections[0].controls[0].libraryControlId,
    "builtin.number.metric",
  );
  assert.equal(panel.sections[0].controls[0].libraryDefinition.version, 1);
});
test("控件库 CRUD、重复ID、版本递增、引用删除与重启持久化", () =>
  sandbox(async (dir) => {
    const frozen = attachLibraryControl(
      { id: "placed", type: "number", label: "剩余时间" },
      custom(),
    );
    const store = await ControlLibraryStore.create(dir, {
      getControlPanels: () => [
        {
          id: "custom.panel",
          name: "洗衣机面板",
          sections: [{ controls: [frozen] }],
        },
      ],
    });
    const app = Fastify();
    await registerControlLibraryRoutes(app, store);
    try {
      let result = await app.inject({
        method: "GET",
        url: "/api/control-library",
      });
      assert.equal(result.json().controls.length, 39);
      result = await app.inject({
        method: "POST",
        url: "/api/control-library",
        payload: custom(),
      });
      assert.equal(result.statusCode, 200);
      result = await app.inject({
        method: "POST",
        url: "/api/control-library",
        payload: custom(),
      });
      assert.equal(result.statusCode, 400);
      result = await app.inject({
        method: "PUT",
        url: "/api/control-library/custom.test-number",
        payload: { ...custom(), name: "第二版" },
      });
      assert.equal(result.json().item.version, 2);
      assert.equal(frozen.libraryDefinition.name, "测试数值");
      assert.equal(frozen.libraryControlVersion, 1);
      result = await app.inject({
        method: "GET",
        url: "/api/control-library/custom.test-number",
      });
      assert.equal(result.json().references.length, 1);
      result = await app.inject({
        method: "DELETE",
        url: "/api/control-library/custom.test-number",
      });
      assert.equal(result.statusCode, 400);
      result = await app.inject({
        method: "DELETE",
        url: "/api/control-library/custom.test-number?confirm=true",
      });
      assert.equal(result.statusCode, 200);
      result = await app.inject({
        method: "DELETE",
        url: "/api/control-library/builtin.number.metric?confirm=true",
      });
      assert.equal(result.statusCode, 200);
      const reopened = await ControlLibraryStore.create(dir);
      assert.equal(reopened.list().length, 38);
      assert.equal(
        reopened.list().some((c) => c.id === "builtin.number.metric"),
        false,
      );
      assert.equal(frozen.libraryDefinition.ui.kind, "column");
    } finally {
      await app.close();
    }
  }));
test("导入导出独立ID，拒绝脚本、全局样式、非法动作和过深UI", () =>
  sandbox(async (dir) => {
    const store = await ControlLibraryStore.create(dir);
    const [item] = await store.import(bundle([custom()]));
    assert.match(item.id, /^custom\.import-/);
    assert.equal(item.ui.kind, "column");
    assert.equal(normalizeLibraryPackage(store.export()).length, 40);
    assert.throws(
      () => store.import({ format: "wrong", controls: [] }),
      /格式|JSON/,
    );
    assert.throws(
      () =>
        normalizeLibraryControl({ ...custom(), style: { position: "fixed" } }),
      /样式/,
    );
    assert.throws(
      () =>
        normalizeLibraryControl({
          ...custom(),
          style: { background: "url(https://example.test/x)" },
        }),
      /外部资源/,
    );
    assert.throws(
      () =>
        normalizeLibraryControl({
          ...custom(),
          ui: { kind: "script", text: "alert(1)" },
        }),
      /节点/,
    );
    assert.throws(
      () =>
        normalizeLibraryControl({
          ...custom(),
          ui: { kind: "button", action: "fetch" },
        }),
      /动作/,
    );
    assert.throws(
      () =>
        normalizeLibraryControl({
          ...custom(),
          ui: { kind: "text", onClick: "alert(1)" },
        }),
      /属性/,
    );
    assert.throws(
      () =>
        normalizeLibraryControl({
          ...custom(),
          ui: { kind: "native" },
          dataTypes: ["boolean"],
        }),
      /兼容/,
    );
    let ui = { kind: "value" };
    for (let i = 0; i < 10; i++) ui = { kind: "column", children: [ui] };
    assert.throws(() => normalizeLibraryControl({ ...custom(), ui }), /超限/);
    assert.equal(store.list().length, 40);
  }));
test("并发更新串行保存，面板与库备份保留自定义UI及固定版本", () =>
  sandbox(async (dir) => {
    const platform = await DevicePlatformStore.create(
      path.join(dir, "source"),
      path.join(dir, "assets"),
    );
    const library = await ControlLibraryStore.create(
      path.join(dir, "source"),
      platform,
    );
    platform.controlLibrary = library;
    await library.create(custom());
    await Promise.all([
      library.update(custom().id, { ...custom(), name: "A" }),
      library.update(custom().id, { ...custom(), name: "B" }),
    ]);
    assert.equal(library.list().find((c) => c.id === custom().id).version, 3);
    const frozen = attachLibraryControl(
      {
        id: "control",
        type: "number",
        label: "数值",
        grid: { x: 0, y: 0, w: 2 },
      },
      custom(),
    );
    await platform.upsertControlPanel({
      id: "custom.panel",
      name: "测试面板",
      sections: [{ id: "main", controls: [frozen] }],
    });
    const exported = await platform.exportBundle();
    assert.equal(exported.controlLibrary.controls.length, 40);
    const target = await DevicePlatformStore.create(
      path.join(dir, "target"),
      path.join(dir, "assets2"),
    );
    target.controlLibrary = await ControlLibraryStore.create(
      path.join(dir, "target"),
      target,
    );
    await target.importBundle(exported);
    assert.equal(
      target.controlLibrary.list().find((c) => c.id === custom().id).version,
      3,
    );
    const restored = target
      .getControlPanels()
      .find((p) => p.id === "custom.panel").sections[0].controls[0];
    assert.equal(restored.libraryControlVersion, 1);
    assert.equal(restored.libraryDefinition.ui.kind, "column");
  }));

test("39种内置风格展开为可编辑节点，标题图标占位符和多类型适配可保存", () => {
  for (const definition of builtinControls()) {
    const expanded = editableLibraryControl(definition);
    const normalized = normalizeLibraryControl(expanded);
    assert.ok(!JSON.stringify(normalized.ui).includes('"kind":"native"'));
    assert.ok(JSON.stringify(normalized.ui).includes('"kind":"label"'));
    assert.ok(JSON.stringify(normalized.ui).includes('"kind":"icon"'));
    assert.equal(normalized.id, definition.id);
  }
  const flexible = normalizeLibraryControl({
    ...editableLibraryControl(custom()),
    dataTypes: ["string", "number", "boolean", "enum", "action"],
  });
  assert.equal(flexible.dataTypes.length, 5);
  assert.throws(
    () => normalizeLibraryControl({ ...flexible, dataTypes: [] }),
    /兼容/,
  );
  assert.throws(
    () =>
      normalizeLibraryControl({
        ...flexible,
        ui: { kind: "options", mode: "script" },
      }),
    /模式/,
  );
});
test("回退保存前一版本，重启后仍可回退且不改面板快照", () =>
  sandbox(async (dir) => {
    let store = await ControlLibraryStore.create(dir);
    const first = await store.create(custom());
    const frozen = attachLibraryControl(
      { id: "placed", label: "原名称" },
      first,
    );
    const second = await store.update(first.id, { ...first, name: "第二版" });
    assert.equal(second.version, 2);
    store = await ControlLibraryStore.create(dir);
    const app = Fastify();
    await registerControlLibraryRoutes(app, store);
    try {
      const response = await app.inject({
        method: "POST",
        url: "/api/control-library/" + first.id + "/rollback",
      });
      assert.equal(response.statusCode, 200);
      assert.equal(response.json().item.name, first.name);
      assert.equal(response.json().item.version, 3);
      assert.equal(frozen.libraryDefinition.version, 1);
      assert.equal(frozen.label, "原名称");
      const restored = await ControlLibraryStore.create(dir);
      assert.equal((await restored.rollback(first.id)).name, "第二版");
      await assert.rejects(restored.rollback("builtin.select.radio"), /上一版/);
    } finally {
      await app.close();
    }
  }));

test("注册属性生成实例值、单位覆盖与自动回退，保存备份保留注册与自定义值", () => {
  const definition = normalizeLibraryControl({
    ...custom(),
    properties: [
      { key: "unit", label: "单位", type: "string", default: "秒" },
      { key: "hideUnit", label: "隐藏单位", type: "boolean", default: false },
      {
        key: "align",
        label: "数值对齐",
        type: "select",
        options: [
          { value: "center", label: "居中" },
          { value: "flex-start", label: "左对齐" },
        ],
        default: "center",
      },
    ],
  });
  let c = effectiveControl(
    attachLibraryControl(
      {
        id: "metric",
        label: "时间",
        props: { unit: "分钟", align: "flex-start" },
      },
      definition,
    ),
  );
  assert.equal(controlUnit(c, { unit: "s" }), "分钟");
  assert.equal(c.props.align, "flex-start");
  assert.equal(
    resolvePropertyStyle({ justifyContent: "{{props.align}}" }, c.props)
      .justifyContent,
    "flex-start",
  );
  c = effectiveControl({ ...c, props: { unit: "", hideUnit: false } });
  assert.equal(controlUnit(c, { unit: "s" }), "s");
  c = effectiveControl({ ...c, props: { hideUnit: true } });
  assert.equal(controlUnit(c, { unit: "s" }), "");
  const panel = normalizeControlPanelTemplate({
    id: "custom.properties",
    sections: [
      {
        id: "main",
        controls: [{ ...c, props: { unit: "小时", align: "center" } }],
      },
    ],
  });
  assert.equal(panel.sections[0].controls[0].props.unit, "小时");
  assert.equal(
    panel.sections[0].controls[0].libraryDefinition.properties.length,
    3,
  );
  assert.throws(
    () => normalizeControlValues(definition, { align: "bogus" }),
    /选项/,
  );
  assert.throws(
    () => normalizeControlValues(definition, { hideUnit: "yes" }),
    /布尔/,
  );
  assert.deepEqual(
    resolvePropertyStyle(
      { background: "{{props.color}}" },
      { color: "url(https://example.com/tracker)" },
    ),
    {},
  );
  assert.throws(
    () =>
      normalizeLibraryControl({
        ...custom(),
        properties: [{ key: "unit", type: "number" }],
      }),
    /不兼容/,
  );
  assert.throws(
    () =>
      normalizeLibraryControl({
        ...custom(),
        properties: [
          { key: "a", type: "string" },
          { key: "a", type: "string" },
        ],
      }),
    /重复/,
  );
});
