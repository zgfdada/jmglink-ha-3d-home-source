import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import Fastify from "fastify";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { sampleProject } from "@ha3d/schema";
import { ProjectStore } from "../apps/server/src/projects/ProjectStore.js";
import { SidebarStore } from "../apps/server/src/sidebar/SidebarStore.js";
import { createInstanceWriteGate } from "../apps/server/src/instance-write-gate.js";
import { startMcp } from "../apps/server/src/mcp/server.js";
import { SCOPES, hash, clean } from "../apps/server/src/mcp/store.js";
import {
  validateNrTab,
  staticLightAction,
  NodeRedAdapter,
} from "../apps/server/src/mcp/adapters.js";
import { passiveSidebar } from "../apps/server/src/mcp/engine.js";

async function setup(t, sharedAccess = false) {
  const dir = await mkdtemp(path.join(tmpdir(), "ha3d-mcp-"));
  const projects = await ProjectStore.create(dir),
    sidebars = await SidebarStore.create(dir);
  const current = projects.getProject();
  const ha = {
    config: {
      ha: {
        token: "private-upstream-secret",
        restUrl: "http://ha.invalid/api",
      },
    },
    getStatus: () => ({ connected: true }),
    getEntities: () => [
      {
        entityId: "light.allowed",
        name: "灯",
        domain: "light",
        state: "off",
        token: "hidden",
      },
      { entityId: "light.denied", state: "on" },
    ],
    websocketReady: true,
    socket: {},
    sendCommand: async (s, type, body) =>
      type === "input_boolean/list" ? [] : { id: "new_helper", ...body },
  };
  const models = [];
  const platform = {
    getModelTemplates: () => models,
    upsertModelTemplate: async (model) => {
      models.push(model);
      return model;
    },
  };
  const app = Fastify({ logger: false });
  const service = await startMcp({
    app,
    config: {},
    projects,
    sidebars,
    platform,
    ha,
    writeGate: createInstanceWriteGate(),
    directory: path.join(dir, "private"),
    port: 0,
    host: "127.0.0.1",
    sharedAccess,
  });
  await app.ready();
  const bootstrap = JSON.parse(
    await readFile(path.join(dir, "private", "bootstrap.json"), "utf8"),
  );
  const created = await service.store.createClient({
    name: "test",
    scopes: SCOPES,
    resources: {
      projects: [current.id],
      entities: ["light.allowed"],
      tabs: ["tab-a"],
    },
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
  });
  const client = service.store.principal(created.token);
  const base = "http://127.0.0.1:" + service.listener.address().port;
  t.after(async () => {
    await service.close();
    await app.close();
    assert.ok(
      path
        .resolve(dir)
        .startsWith(path.resolve(tmpdir()) + path.sep + "ha3d-mcp-"),
    );
    await rm(dir, { recursive: true, force: true });
  });
  return {
    dir,
    projects,
    sidebars,
    current,
    service,
    app,
    bootstrap,
    client,
    token: created.token,
    base,
    ha,
    models,
  };
}
const patch = (f) => ({
  projectId: f.current.id,
  operations: [
    {
      floorId: f.current.floors[0].id,
      collection: "furniture",
      value: {
        id: "mcp-test-furniture",
        name: "测试柜",
        kind: "cabinet",
        position: [1, 1],
        rotation: 0,
        width: 1,
        depth: 0.5,
        height: 1,
      },
    },
  ],
});

test("独立端口真实SDK握手、tools/resources/prompts、无密钥拒绝与管理员隔离", async (t) => {
  const f = await setup(t);
  assert.equal(
    (
      await fetch(f.base + "/mcp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      })
    ).status,
    401,
  );
  const denied = await f.app.inject({
    method: "GET",
    url: "/api/mcp-admin/state",
    headers: { "x-mcp-admin": f.token },
  });
  assert.equal(denied.statusCode, 403);
  const sdk = new Client({ name: "integration", version: "1" });
  const transport = new StreamableHTTPClientTransport(
    new URL(f.base + "/mcp"),
    { requestInit: { headers: { Authorization: "Bearer " + f.token } } },
  );
  await sdk.connect(transport);
  t.after(() => sdk.close());
  const tools = await sdk.listTools();
  assert.ok(tools.tools.some((t) => t.name === "changes.apply"));
  const response = await sdk.callTool({
    name: "system.capabilities",
    arguments: {},
  });
  assert.equal(response.isError, undefined);
  assert.ok(!JSON.stringify(response).includes("private-upstream-secret"));
  assert.equal((await sdk.listResources()).resources.length, 1);
  assert.equal((await sdk.listPrompts()).prompts.length, 1);
  const dangerous = await sdk.callTool({
    name: "ha.action.plan",
    arguments: { service: "light.turn_on", entityId: "light.denied", data: {} },
  });
  assert.equal(dangerous.isError, true);
  const state = await f.app.inject({
    method: "GET",
    url: "/api/mcp-admin/state",
    headers: { "x-mcp-admin": f.bootstrap.adminKey },
  });
  assert.equal(state.statusCode, 200);
  assert.ok(!state.body.includes(f.token));
  const csrf = await f.app.inject({
    method: "POST",
    url: "/api/mcp-admin/settings",
    headers: {
      "x-mcp-admin": f.bootstrap.adminKey,
      Origin: "http://evil.invalid",
    },
    payload: {},
  });
  assert.equal(csrf.statusCode, 403);
});
test("真实项目草稿、批准、共享存储应用、幂等及恢复闭环", async (t) => {
  const f = await setup(t),
    engine = f.service.engine,
    plan = await engine.planProject(f.client, patch(f));
  assert.equal(f.projects.getProject().version, f.current.version);
  await assert.rejects(
    engine.apply(f.client, { planId: plan.id, idempotencyKey: "apply-key-1" }),
    (e) => e.code === "APPROVAL_REQUIRED",
  );
  await f.service.store.approve(plan.id);
  const result = await engine.apply(f.client, {
    planId: plan.id,
    idempotencyKey: "apply-key-1",
  });
  assert.equal(result.status, "applied");
  assert.ok(
    f.projects
      .getProject()
      .floors[0].furniture.some((x) => x.id === "mcp-test-furniture"),
  );
  assert.equal(
    (
      await engine.apply(f.client, {
        planId: plan.id,
        idempotencyKey: "apply-key-1",
      })
    ).result.version,
    result.result.version,
  );
  const undo = await engine.rollback(f.client, plan.id);
  await f.service.store.approve(undo.id);
  await engine.apply(f.client, {
    planId: undo.id,
    idempotencyKey: "undo-key-1",
  });
  assert.ok(
    !f.projects
      .getProject()
      .floors[0].furniture.some((x) => x.id === "mcp-test-furniture"),
  );
});
test("版本冲突拒绝覆盖、批准绑定哈希、客户端过期撤销及资源范围", async (t) => {
  const f = await setup(t),
    e = f.service.engine,
    p = await e.planProject(f.client, patch(f));
  await f.service.store.approve(p.id);
  await f.projects.saveProject(
    { ...f.projects.getProject(), name: "网页修改" },
    { expectedVersion: f.current.version },
  );
  await assert.rejects(
    e.apply(f.client, { planId: p.id, idempotencyKey: "conflict-key" }),
    (err) => err.code === "REVISION_CONFLICT",
  );
  assert.equal(f.projects.getProject().name, "网页修改");
  const next = await e.planProject(
    f.client,
    patch({ ...f, current: f.projects.getProject() }),
  );
  await f.service.store.approve(next.id);
  f.service.store.plan(next.id, f.client).payload.operations[0].value.name =
    "tampered";
  await assert.rejects(
    e.apply(f.client, { planId: next.id, idempotencyKey: "tamper-key" }),
    (err) => err.code === "APPROVAL_REQUIRED",
  );
  assert.throws(
    () => e.project(f.client, "other"),
    (err) => err.code === "RESOURCE_DENIED",
  );
  f.client.revoked = true;
  await assert.rejects(
    e.planProject(f.client, patch(f)),
    (err) => err.code === "AUTH_REQUIRED",
  );
});
test("只读客户端拒绝写入、秘密字段脱敏、连接默认关闭", async (t) => {
  const f = await setup(t);
  const ro = f.service.store.principal(f.bootstrap.clientToken);
  await assert.rejects(
    f.service.engine.planProject(ro, patch(f)),
    (e) => e.code === "FORBIDDEN_SCOPE",
  );
  assert.throws(
    () => f.service.engine.haAdapter.entities(f.client),
    (e) => e.code === "UNSUPPORTED_CAPABILITY",
  );
  assert.deepEqual(
    clean({ token: "secret", nested: { password: "secret", ok: 1 } }),
    { nested: { ok: 1 } },
  );
  f.service.store.state.connections.ha.enabled = true;
  const entities = f.service.engine.haAdapter.entities(f.client);
  assert.equal(entities.length, 1);
  assert.equal(entities[0].entityId, "light.allowed");
});
test("侧边栏被动模式拒绝脚本，可信模式可草稿且审批后才发布", async (t) => {
  const f = await setup(t);
  assert.throws(() =>
    passiveSidebar({ widgets: [{ js: 'fetch("https://evil.invalid")' }] }),
  );
  const draft = f.sidebars.get(
    f.sidebars.floorKey(f.current, f.current.floors[0].id),
  ).draft;
  const p = await f.service.engine.planSidebar(f.client, {
    projectId: f.current.id,
    floorId: f.current.floors[0].id,
    draft,
    publish: true,
  });
  await f.service.store.approve(p.id);
  const r = await f.service.engine.apply(f.client, {
    planId: p.id,
    idempotencyKey: "sidebar-key",
  });
  assert.equal(r.status, "applied");
  assert.ok(r.result.revision > 0);
});
test("模型进入实际模型库，HA与Node-RED外部连接只由管理员启用", async (t) => {
  const f = await setup(t);
  const p = await f.service.engine.planModel(f.client, {
    projectId: f.current.id,
    name: "灯体",
    width: 0.2,
    depth: 0.2,
    height: 0.1,
    color: "#ffffff",
  });
  await f.service.store.approve(p.id);
  await f.service.engine.apply(f.client, {
    planId: p.id,
    idempotencyKey: "model-key",
  });
  assert.equal(f.models.length, 1);
  assert.equal(f.models[0].source.shape, "box");
  const response = await f.app.inject({
    method: "POST",
    url: "/api/mcp-admin/settings",
    headers: { "x-mcp-admin": f.bootstrap.adminKey },
    payload: {
      enabled: true,
      haEnabled: true,
      nodeRedEnabled: true,
      nodeRedUrl: "http://nr.invalid:1880",
      nodeRedToken: "sensitive-token",
    },
  });
  assert.equal(response.statusCode, 200);
  const raw = await readFile(f.service.store.file, "utf8");
  assert.ok(!raw.includes("sensitive-token"));
  assert.equal(
    f.service.store.decrypt(f.service.store.state.connections.nodered.secret),
    "sensitive-token",
  );
});
test("Node-RED受限节点、动态动作拒绝，可信代码明确单独授权", () => {
  const client = {
    scopes: ["nodered.flow.deploy", "ha.service.call"],
    resources: { tabs: ["tab-a"], entities: ["light.allowed"] },
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
  };
  const basic = [
    { id: "tab-a", type: "tab", label: "演示" },
    {
      id: "a",
      z: "tab-a",
      type: "inject",
      payload: "1",
      payloadType: "num",
      wires: [],
    },
  ];
  assert.equal(validateNrTab(client, basic, "tab-a", []), basic);
  assert.throws(() =>
    validateNrTab(
      client,
      [
        ...basic,
        { id: "func", z: "tab-a", type: "function", func: "return msg;" },
      ],
      "tab-a",
      [],
    ),
  );
  const trusted = { ...client, scopes: [...client.scopes, "nodered.trusted"] };
  assert.doesNotThrow(() =>
    validateNrTab(
      trusted,
      [
        ...basic,
        { id: "func", z: "tab-a", type: "function", func: "return msg;" },
      ],
      "tab-a",
      [],
    ),
  );
  assert.throws(() =>
    staticLightAction(client, {
      service: "lock.unlock",
      entityId: "lock.front",
    }),
  );
  assert.throws(() =>
    staticLightAction(client, {
      service: "light.turn_on",
      entityId: "light.denied",
    }),
  );
});
test("Node-RED部署保留范围外配置、rev冲突拒绝，超时不自动重发", async (t) => {
  const f = await setup(t);
  const state = f.service.store.state;
  state.connections.nodered = {
    enabled: true,
    url: "http://nr.invalid",
    secret: f.service.store.encrypt("nr-secret"),
  };
  let current = {
      rev: "1",
      flows: [
        { id: "tab-a", type: "tab" },
        { id: "outside", type: "tab" },
      ],
    },
    writes = 0;
  f.service.engine.nr.fetcher = async (url, opts) => {
    if (opts.method === "POST") {
      writes++;
      const body = JSON.parse(opts.body);
      assert.equal(body.rev, current.rev);
      assert.ok(body.flows.some((n) => n.id === "outside"));
      current = { rev: "2", flows: body.flows };
      return new Response(JSON.stringify({ rev: "2" }));
    }
    return new Response(JSON.stringify(current));
  };
  const p = await f.service.engine.planNr(f.client, {
    tabId: "tab-a",
    nodes: [{ id: "tab-a", type: "tab", label: "new" }],
  });
  await f.service.store.approve(p.id);
  await f.service.engine.apply(f.client, {
    planId: p.id,
    idempotencyKey: "nr-key",
  });
  assert.equal(writes, 1);
  await f.service.engine.apply(f.client, {
    planId: p.id,
    idempotencyKey: "nr-key",
  });
  assert.equal(writes, 1);
  const next = await f.service.engine.planNr(f.client, {
    tabId: "tab-a",
    nodes: [{ id: "tab-a", type: "tab", label: "other" }],
  });
  await f.service.store.approve(next.id);
  current.rev = "3";
  await assert.rejects(
    f.service.engine.apply(f.client, {
      planId: next.id,
      idempotencyKey: "nr-conflict",
    }),
    (e) => e.code === "REVISION_CONFLICT",
  );
  assert.equal(writes, 1);
});

test("HA辅助实体创建回读、静态自动化初始禁用，超时结果未知不重发", async (t) => {
  const f = await setup(t);
  f.service.store.state.connections.ha.enabled = true;
  const helpers = [];
  let sends = 0;
  f.ha.sendCommand = async (socket, type, body) => {
    if (type === "input_boolean/list") return structuredClone(helpers);
    sends++;
    const item = { id: "mcp_helper", ...body };
    helpers.push(item);
    return item;
  };
  const p = await f.service.engine.planHa(f.client, "ha-helper", {
    name: "MCP测试",
  });
  await f.service.store.approve(p.id);
  const result = await f.service.engine.apply(f.client, {
    planId: p.id,
    idempotencyKey: "helper-key",
  });
  assert.equal(result.result.created.id, "mcp_helper");
  assert.equal(sends, 1);
  assert.ok(!f.client.resources.entities.includes("input_boolean.mcp_helper"));
  let saved,
    writes = 0;
  f.service.engine.haAdapter.fetcher = async (url, opts) => {
    if (opts.method === "POST") {
      writes++;
      saved = JSON.parse(opts.body);
      assert.equal(saved.initial_state, false);
    }
    return new Response(JSON.stringify(saved));
  };
  const a = await f.service.engine.planHa(f.client, "ha-automation", {
    alias: "测试定时",
    at: "12:00:00",
    actions: [
      {
        service: "light.turn_on",
        entityId: "light.allowed",
        data: { brightness: 100 },
      },
    ],
  });
  await f.service.store.approve(a.id);
  const applied = await f.service.engine.apply(f.client, {
    planId: a.id,
    idempotencyKey: "automation-key",
  });
  assert.equal(applied.result.initiallyDisabled, true);
  assert.equal(writes, 1);
  const action = await f.service.engine.planHa(f.client, "ha-action", {
    service: "light.turn_on",
    entityId: "light.allowed",
    data: {},
  });
  await f.service.store.approve(action.id);
  f.service.engine.haAdapter.fetcher = async () => {
    writes++;
    throw Error("network timeout");
  };
  await assert.rejects(
    f.service.engine.apply(f.client, {
      planId: action.id,
      idempotencyKey: "unknown-key",
    }),
    (e) => e.code === "RESULT_UNKNOWN",
  );
  const before = writes;
  const status = await f.service.engine.apply(f.client, {
    planId: action.id,
    idempotencyKey: "unknown-key",
  });
  assert.equal(status.status, "unknown");
  assert.equal(writes, before);
});
test("完整项目替换及可信侧边栏／Node-RED配置仍需批准，不能凭参数获得可信权限", async (t) => {
  const f = await setup(t);
  const replacement = { ...structuredClone(f.current), name: "完整编辑测试" };
  const p = await f.service.engine.planFullProject(f.client, {
    projectId: f.current.id,
    project: replacement,
  });
  await assert.rejects(
    f.service.engine.apply(f.client, {
      planId: p.id,
      idempotencyKey: "full-key",
    }),
    (e) => e.code === "APPROVAL_REQUIRED",
  );
  await f.service.store.approve(p.id);
  await f.service.engine.apply(f.client, {
    planId: p.id,
    idempotencyKey: "full-key",
  });
  assert.equal(f.projects.getProject().name, "完整编辑测试");
  const denied = await f.app.inject({
    method: "POST",
    url: "/api/mcp-admin/clients",
    headers: { "x-mcp-admin": f.bootstrap.adminKey },
    payload: {
      name: "bad",
      scopes: ["nodered.trusted"],
      resources: { projects: [], entities: [], tabs: [] },
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    },
  });
  assert.equal(denied.statusCode, 403);
  const current = f.service.store.plan(p.id, f.client);
  current.status = "applying";
  await f.service.store.persist();
  await f.service.store.recover();
  assert.equal(current.status, "unknown");
});

test("完整管理通配范围支持新建复制与删除计划，删除必须CAS且保留最后项目", async (t) => {
  const f = await setup(t);
  f.client.resources.projects = ["*"];
  const plan = await f.service.engine.planCreateProject(f.client, {
    name: "新项目",
    sourceProjectId: f.current.id,
  });
  await f.service.store.approve(plan.id);
  const result = await f.service.engine.apply(f.client, {
    planId: plan.id,
    idempotencyKey: "project-create-key",
  });
  assert.ok(result.result.projectId);
  assert.equal(f.projects.listProjects().length, 2);
  const deletion = await f.service.engine.planDeleteProject(f.client, {
    projectId: result.result.projectId,
  });
  await f.service.store.approve(deletion.id);
  await f.service.engine.apply(f.client, {
    planId: deletion.id,
    idempotencyKey: "project-delete-key",
  });
  assert.equal(f.projects.listProjects().length, 1);
  await assert.rejects(
    f.service.engine.planDeleteProject(f.client, { projectId: f.current.id }),
    (e) => e.code === "RESOURCE_DENIED",
  );
  assert.ok(f.service.store.plan(deletion.id, f.client).before.floors.length);
});
test("可信Node-RED完整配置明确覆盖共享对象，受限客户端不能使用全流程通配", async (t) => {
  const f = await setup(t);
  f.client.resources.tabs = ["*"];
  let current = {
    rev: "r1",
    flows: [
      { id: "target", type: "tab" },
      { id: "outside", type: "tab" },
      { id: "shared", type: "server", name: "old" },
    ],
  };
  let posted;
  f.service.store.state.connections.nodered = {
    enabled: true,
    url: "http://nr.invalid",
    secret: f.service.store.encrypt("secret"),
  };
  f.service.engine.nr.fetcher = async (url, opts) => {
    if (opts.method === "POST") {
      posted = JSON.parse(opts.body);
      return new Response(JSON.stringify({ rev: "r2" }));
    }
    return new Response(JSON.stringify(current));
  };
  const nodes = [
    { id: "target", type: "tab" },
    {
      id: "function",
      type: "function",
      z: "target",
      func: "return msg;",
      wires: [],
    },
    { id: "shared", type: "server", name: "changed" },
  ];
  const plan = await f.service.engine.planNr(f.client, {
    tabId: "target",
    nodes,
  });
  await f.service.store.approve(plan.id);
  await f.service.engine.apply(f.client, {
    planId: plan.id,
    idempotencyKey: "trusted-nr-key",
  });
  assert.ok(posted.flows.some((n) => n.id === "outside"));
  assert.equal(posted.flows.filter((n) => n.id === "shared").length, 1);
  assert.equal(posted.flows.find((n) => n.id === "shared").name, "changed");
  f.client.scopes = f.client.scopes.filter((s) => s !== "nodered.trusted");
  await assert.rejects(
    f.service.engine.nr.read(f.client, "outside"),
    (e) => e.code === "RESOURCE_DENIED",
  );
});

test("管理员修改既有Agent权限保持密钥，立即使用新权限并使旧批准失效", async (t) => {
  const f = await setup(t),
    engine = f.service.engine;
  const plan = await engine.planProject(f.client, patch(f));
  await f.service.store.approve(plan.id);
  const originalDigest = f.client.digest,
    originalExpiry = f.client.expiresAt;
  const payload = {
    name: "重命名Agent",
    scopes: ["home3d.project.read", "home3d.catalog.read"],
    resources: structuredClone(f.client.resources),
    expiresAt: originalExpiry,
    revision: 0,
    trustedCode: false,
  };
  const denied = await f.app.inject({
    method: "POST",
    url: "/api/mcp-admin/clients/" + f.client.id + "/update",
    headers: { "x-mcp-admin": f.token },
    payload,
  });
  assert.equal(denied.statusCode, 403);
  const response = await f.app.inject({
    method: "POST",
    url: "/api/mcp-admin/clients/" + f.client.id + "/update",
    headers: { "x-mcp-admin": f.bootstrap.adminKey },
    payload,
  });
  assert.equal(response.statusCode, 200);
  const result = response.json();
  assert.equal(result.keyUnchanged, true);
  assert.equal(result.client.name, "重命名Agent");
  assert.equal(result.client.revision, 1);
  assert.ok(!response.body.includes(f.token));
  assert.ok(!response.body.includes(originalDigest));
  assert.equal(f.service.store.principal(f.token), f.client);
  assert.equal(f.client.digest, originalDigest);
  assert.equal(f.client.expiresAt, originalExpiry);
  assert.equal(f.service.store.plan(plan.id, f.client).approval, undefined);
  await assert.rejects(
    engine.planProject(f.client, patch(f)),
    (e) => e.code === "FORBIDDEN_SCOPE",
  );
  const stale = await f.app.inject({
    method: "POST",
    url: "/api/mcp-admin/clients/" + f.client.id + "/update",
    headers: { "x-mcp-admin": f.bootstrap.adminKey },
    payload,
  });
  assert.equal(stale.statusCode, 409);
  const grant = { ...payload, scopes: SCOPES, trustedCode: true, revision: 1 };
  const updated = await f.app.inject({
    method: "POST",
    url: "/api/mcp-admin/clients/" + f.client.id + "/update",
    headers: { "x-mcp-admin": f.bootstrap.adminKey },
    payload: grant,
  });
  assert.equal(updated.statusCode, 200);
  assert.equal(f.service.store.principal(f.token).scopes.length, SCOPES.length);
  await assert.rejects(
    engine.apply(f.client, {
      planId: plan.id,
      idempotencyKey: "permissions-changed",
    }),
    (e) => e.code === "APPROVAL_REQUIRED",
  );
  f.client.revoked = true;
  const revoked = await f.app.inject({
    method: "POST",
    url: "/api/mcp-admin/clients/" + f.client.id + "/update",
    headers: { "x-mcp-admin": f.bootstrap.adminKey },
    payload: { ...grant, revision: 2 },
  });
  assert.equal(revoked.statusCode, 409);
});

test("Node-RED Basic认证加密、不回显、保留与切换保护", async (t) => {
  const f = await setup(t);
  const save = (payload) =>
    f.app.inject({
      method: "POST",
      url: "/api/mcp-admin/settings",
      headers: { "x-mcp-admin": f.bootstrap.adminKey },
      payload: {
        enabled: true,
        haEnabled: false,
        nodeRedEnabled: true,
        nodeRedUrl: "http://nr.invalid:1880",
        ...payload,
      },
    });
  const basic = {
    nodeRedAuthMode: "basic",
    nodeRedUsername: "test-admin",
    nodeRedPassword: "fake:password测试",
  };
  assert.equal((await save(basic)).statusCode, 200);
  const encrypted = f.service.store.state.connections.nodered.secret;
  let captured;
  const adapter = new NodeRedAdapter(f.service.store, async (url, options) => {
    captured = { url, ...options };
    return new Response(JSON.stringify({ rev: "one", flows: [] }));
  });
  await adapter.flows();
  assert.equal(
    captured.headers.Authorization,
    "Basic " + Buffer.from("test-admin:fake:password测试").toString("base64"),
  );
  assert.equal(captured.redirect, "error");
  const raw = await readFile(f.service.store.file, "utf8");
  assert.ok(!raw.includes(basic.nodeRedUsername));
  assert.ok(!raw.includes(basic.nodeRedPassword));
  const state = await f.app.inject({
    url: "/api/mcp-admin/state",
    headers: { "x-mcp-admin": f.bootstrap.adminKey },
  });
  assert.ok(!state.body.includes(basic.nodeRedPassword));
  assert.ok(!state.body.includes(basic.nodeRedUsername));
  assert.equal(state.json().connections.nodered.authMode, "basic");
  assert.equal((await save({ nodeRedAuthMode: "basic" })).statusCode, 200);
  assert.equal(f.service.store.state.connections.nodered.secret, encrypted);
  for (const invalid of [
    { nodeRedAuthMode: "bearer" },
    { nodeRedAuthMode: "basic", nodeRedUsername: "other" },
    { ...basic, nodeRedUsername: "bad:name" },
    { nodeRedAuthMode: "basic", nodeRedUrl: "http://other.invalid" },
  ]) {
    assert.equal((await save(invalid)).statusCode, 422);
    assert.equal(f.service.store.state.connections.nodered.secret, encrypted);
  }
  assert.equal(
    (await save({ nodeRedAuthMode: "bearer", nodeRedToken: "fake-token" }))
      .statusCode,
    200,
  );
  await adapter.flows();
  assert.equal(captured.headers.Authorization, "Bearer fake-token");
  delete f.service.store.state.connections.nodered.authMode;
  await adapter.flows();
  assert.equal(captured.headers.Authorization, "Bearer fake-token");
  assert.equal(clean("Basic dGVzdDp0ZXN0"), "[redacted]");
});

test("共用模式免密、远程Host、免审批写入仍校验权限与版本", async (t) => {
  const f = await setup(t, true);
  const state = (await f.app.inject({ url: "/api/mcp-admin/state" })).json();
  assert.equal(state.sharedAccess, true);
  assert.ok(state.sharedPolicy.scopes.includes("nodered.trusted"));
  assert.equal(
    (await f.app.inject({ url: "/api/mcp-admin/shared-key" })).statusCode,
    404,
  );
  assert.equal(
    (
      await f.app.inject({
        method: "POST",
        url: "/api/mcp-admin/clients",
        payload: {},
      })
    ).statusCode,
    410,
  );
  const health = await fetch(f.base + "/health", {
    headers: { Host: "192.168.31.99:8112" },
  });
  assert.equal(health.status, 200);
  assert.equal(
    (
      await fetch(f.base + "/health", {
        headers: { Origin: "https://evil.invalid" },
      })
    ).status,
    403,
  );
  const sdk = new Client({ name: "no-auth", version: "1" });
  await sdk.connect(
    new StreamableHTTPClientTransport(new URL(f.base + "/mcp")),
  );
  t.after(() => sdk.close());
  const capabilities = await sdk.callTool({
    name: "system.capabilities",
    arguments: {},
  });
  assert.equal(capabilities.isError, undefined);
  const draft = await sdk.callTool({
    name: "home3d.draft.project",
    arguments: patch(f),
  });
  assert.equal(draft.isError, undefined);
  const plan = JSON.parse(draft.content[0].text);
  const applied = await sdk.callTool({
    name: "changes.apply",
    arguments: { planId: plan.id, idempotencyKey: "no-manual-approval" },
  });
  assert.equal(applied.isError, undefined);
  assert.equal(JSON.parse(applied.content[0].text).status, "applied");
  const principal = f.service.store.state.clients.find(
    (c) => c.id === "shared-agents",
  );
  const stale = await f.service.engine.planProject(principal, patch(f));
  await f.projects.saveProject(
    { ...f.projects.getProject(), name: "changed" },
    { expectedVersion: f.projects.getProject().version },
  );
  await assert.rejects(
    () =>
      f.service.engine.apply(principal, {
        planId: stale.id,
        idempotencyKey: "stale-revision",
      }),
    { code: "REVISION_CONFLICT" },
  );
  const policy = {
    scopes: ["home3d.project.read", "home3d.catalog.read"],
    resources: { projects: [f.current.id], entities: [], tabs: [] },
    revision: state.sharedPolicy.revision,
    trustedCode: false,
  };
  assert.equal(
    (
      await f.app.inject({
        method: "POST",
        url: "/api/mcp-admin/permissions",
        payload: policy,
      })
    ).statusCode,
    200,
  );
  const denied = await sdk.callTool({
    name: "home3d.draft.project",
    arguments: patch(f),
  });
  assert.equal(JSON.parse(denied.content[0].text).code, "FORBIDDEN_SCOPE");
  await f.service.store.enableSharedAccess();
  assert.deepEqual(principal.scopes, policy.scopes);
});

test("MCP保留长控件脚本且程序化挂画只能在完整项目权限中摆放", async (t) => {
  const f=await setup(t);
  const longScript='/*'+ 'x'.repeat(65000)+'*/';
  assert.equal(clean({js:longScript}).js,longScript);
  const value={id:'test-wall-art',name:'挂画',kind:'custom_model',position:[1,2],rotation:0,width:0.6,depth:0.2,height:0.8,elevation:1.2,customModel:{source:{type:'procedural',shape:'box'},dimensions:{width:0.6,depth:0.05,height:0.8},color:'#ebe2d0'}};
  const input={projectId:f.current.id,operations:[{floorId:f.current.floors[0].id,collection:'furniture',value}]};
  const plan=await f.service.engine.planProject(f.client,input);
  await f.service.store.approve(plan.id);
  await f.service.engine.apply(f.client,{planId:plan.id,idempotencyKey:'wall-art-test'});
  const art=f.projects.getProject().floors[0].furniture.find(x=>x.id===value.id);
  assert.equal(art.customModel.source.shape,'box');
  assert.equal(art.customModel.dimensions.depth,0.05);
  const denied={...f.client,scopes:f.client.scopes.filter(s=>s!=='home3d.project.replace')};
  await assert.rejects(()=>f.service.engine.planProject(denied,input),{code:'FORBIDDEN_SCOPE'});
  const unsafe={...input,operations:[{...input.operations[0],value:{...value,customModel:{source:{type:'upload',url:'https://invalid/model.glb'}}}}]};
  await assert.rejects(()=>f.service.engine.planProject(f.client,unsafe),{code:'RESOURCE_DENIED'});
});

test("MCP共享连接地址支持保存、持久化、校验和恢复部署默认", async t => {
 const {app,service}=await setup(t,true);
 const save=endpoint=>app.inject({method:"POST",url:"/api/mcp-admin/endpoint",payload:{endpoint}});
 let r=await save("https://example.invalid:18112/mcp");assert.equal(r.statusCode,200);
 let state=(await app.inject({method:"GET",url:"/api/mcp-admin/state"})).json();
 assert.equal(state.endpoint,"https://example.invalid:18112/mcp");
 assert.equal(service.store.state.publicEndpoint,state.endpoint);
 for(const endpoint of ["file:///etc/passwd","http://user:pass@example.invalid/mcp","http://example.invalid/mcp?token=secret","not-url"]){
  assert.equal((await save(endpoint)).statusCode,422);
  assert.equal(service.store.state.publicEndpoint,"https://example.invalid:18112/mcp");
 }
 const denied=await app.inject({method:"POST",url:"/api/mcp-admin/endpoint",headers:{origin:"http://evil.invalid"},payload:{endpoint:"http://example.invalid/mcp"}});
 assert.equal(denied.statusCode,403);
 assert.equal((await save("")).statusCode,200);
 state=(await app.inject({method:"GET",url:"/api/mcp-admin/state"})).json();
 assert.equal(state.endpointOverride,"");assert.notEqual(state.endpoint,"https://example.invalid:18112/mcp");
});

test("MCP管理页API保留HA Ingress前缀，Docker根路径同样可用",async t=>{
 const {app}=await setup(t,true);
 const html=(await app.inject({method:"GET",url:"/mcp-admin"})).body;
 assert.ok(html.includes('fetch("./api/mcp-admin/" + path'));
 assert.ok(!html.includes('fetch("/api/mcp-admin/'));
 for(const page of ["http://localhost:8101/mcp-admin","http://ha.invalid/api/hassio_ingress/session/mcp-admin"]){
  const resolved=new URL("./api/mcp-admin/state",page);
  assert.equal(resolved.pathname,page.includes("hassio_ingress")?"/api/hassio_ingress/session/api/mcp-admin/state":"/api/mcp-admin/state");
 }
});
