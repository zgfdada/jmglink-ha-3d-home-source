import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import Fastify from "fastify";
import {
  defaultSidebar,
  normalizeSidebar,
} from "../packages/schema/src/sidebar.js";
import {
  SidebarStore,
  registerSidebarRoutes,
} from "../apps/server/src/sidebar/SidebarStore.js";

test("侧边栏草稿隔离、发布、重启恢复及并发冲突", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "ha3d-sidebar-"));
  try {
    const store = await SidebarStore.create(dir),
      draft = defaultSidebar();
    draft.pages[0].name = "新的天气导航";
    const first = await store.update("project", { revision: 0, draft });
    assert.equal(first.draft.pages[0].name, "新的天气导航");
    assert.equal(first.published.pages[0].name, "主页");
    await assert.rejects(store.update("project", { revision: 0, draft }), {
      statusCode: 409,
    });
    const published = await store.update(
      "project",
      { revision: 1, draft },
      true,
    );
    assert.deepEqual(published.draft, published.published);
    const restarted = await SidebarStore.create(dir);
    assert.deepEqual(restarted.get("project"), published);
    published.draft.pages[0].name = "不能修改内存";
    assert.notEqual(
      restarted.get("project").draft.pages[0].name,
      "不能修改内存",
    );
    assert.equal(restarted.get("other").revision, 0);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
test("侧边栏拒绝断裂引用、重复标识和无效布局", () => {
  const source = defaultSidebar();
  assert.deepEqual(normalizeSidebar(source), source);
  for (const mutate of [
    (d) => (d.widgets = []),
    (d) => d.pages.push(d.pages[0]),
    (d) => d.pages[0].items.push(d.pages[0].items[0]),
    (d) => (d.width = 2000),
    (d) => (d.pages = []),
    (d) => (d.widgets[0].js = "a".repeat(1000001)),
  ]) {
    const value = structuredClone(source);
    mutate(value);
    assert.throws(() => normalizeSidebar(value));
  }
});
test("侧边栏路由校验真实项目、JSON、跨站修改和草稿版本", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "ha3d-sidebar-routes-")),
    app = Fastify();
  try {
    const store = await SidebarStore.create(dir);
    let changes = 0;
    await registerSidebarRoutes(
      app,
      store,
      { getProject: (id) => (id === "p" ? { id } : undefined) },
      () => changes++,
    );
    assert.equal(
      (await app.inject({ url: "/api/sidebar/none" })).statusCode,
      404,
    );
    assert.equal(
      (await app.inject({ url: "/api/sidebar/p" })).json().revision,
      0,
    );
    const route = {
      method: "PUT",
      url: "/api/sidebar/p/draft",
      payload: { revision: 0, draft: defaultSidebar() },
    };
    assert.equal(
      (
        await app.inject({
          ...route,
          headers: { "sec-fetch-site": "cross-site" },
        })
      ).statusCode,
      403,
    );
    assert.equal(
      (
        await app.inject({
          ...route,
          headers: { origin: "https://foreign.invalid" },
        })
      ).statusCode,
      403,
    );
    assert.equal(
      (
        await app.inject({
          ...route,
          headers: {
            "sec-fetch-site": "same-origin",
            origin: "https://ingress.example",
          },
        })
      ).statusCode,
      200,
    );
    assert.equal(changes, 1);
    assert.equal((await app.inject(route)).statusCode, 409);
    assert.equal(
      (
        await app.inject({
          ...route,
          url: "/api/sidebar/p/publish",
          payload: { revision: 1, draft: defaultSidebar() },
        })
      ).statusCode,
      200,
    );
  } finally {
    await app.close();
    await rm(dir, { recursive: true, force: true });
  }
});

 test("旧天气控件迁移为完整代码控件且保留绑定与布局", () => {
 const config=defaultSidebar();
 const w=config.widgets[0];
 assert.equal(w.kind,'custom');
 for(const key of ['html','css','js'])assert.ok(w[key].length>100);
 w.kind='weather';w.html='';w.css='';w.js='';delete w.entityDomain;w.entityId='weather.home';
 const migrated=normalizeSidebar(config);
 assert.equal(migrated.widgets[0].kind,'custom');
 assert.equal(migrated.widgets[0].entityDomain,'weather');
 assert.equal(migrated.widgets[0].entityId,'weather.home');
 assert.deepEqual(migrated.pages,config.pages);
 const edited=structuredClone(migrated);edited.widgets[0].html='<b>我的天气</b>';
 assert.equal(normalizeSidebar(edited).widgets[0].html,'<b>我的天气</b>');
 });

test("能耗示例保留交互源码、属性匹配及导航颜色", () => {
 const config=normalizeSidebar(defaultSidebar());
 assert.equal(config.pages[0].name,'主页');
 assert.ok(config.pages[0].items.some(i=>i.widgetId==='energy'));
 const energy=config.widgets.find(w=>w.id==='energy');
 assert.equal(energy.scriptMode,'dom');
 assert.equal(energy.entityAttribute,'monthlist');
 assert.ok(energy.js.includes("customElements.define"));
 assert.ok(energy.js.includes('ResizeObserver'));
 assert.ok(energy.js.length>24000);
 config.pages[0].color='#ff8833';
 assert.equal(normalizeSidebar(config).pages[0].color,'#ff8833');
});

test("能耗名称优先实体 title，并允许自定义覆盖", async () => {
 const {energyAccountName}=await import('../packages/schema/src/energy-account.js');
 const e={entityId:'sensor.energy',name:'电费 1234',attributes:{title:'家庭住宅',friendly_name:'电费 1234'}};
 assert.equal(energyAccountName(e),'家庭住宅');
 assert.equal(energyAccountName(e,{'sensor.energy':'车库'}),'车库');
 assert.equal(energyAccountName(e,{'sensor.energy':'  '}),'家庭住宅');
 delete e.attributes.title;
 assert.equal(energyAccountName(e),'电费 1234');
});
