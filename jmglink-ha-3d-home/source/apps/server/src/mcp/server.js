import { createServer } from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import {
  McpStore,
  SCOPES,
  allow,
  fail,
  equalSecret,
  clean,
  hash,
} from "./store.js";
import { McpEngine } from "./engine.js";
const id = z.string().min(1).max(128),
  entity = z.string().regex(/^[a-z0-9_]+\.[a-z0-9_]+$/);
const action = z
  .object({
    service: z.enum(["light.turn_on", "light.turn_off", "light.toggle"]),
    entityId: entity,
    data: z
      .object({
        brightness: z.number().int().min(0).max(255).optional(),
        color_temp_kelvin: z.number().int().min(1000).max(12000).optional(),
      })
      .strict()
      .default({}),
  })
  .strict();
const object = (shape) => z.object(shape).strict();
const operation = object({
  floorId: id,
  collection: z.enum(["rooms", "walls", "furniture", "devices"]),
  value: z.record(z.unknown()),
});
export function createProtocol(engine, client) {
  const server = new McpServer(
    { name: "ha3d-unified-local", version: "0.1.0" },
    { maxToolInputElements: 20000 },
  );
  function tool(name, description, schema, run, readOnly = false) {
    server.registerTool(
      name,
      {
        description,
        inputSchema: schema,
        annotations: {
          readOnlyHint: readOnly,
          destructiveHint: !readOnly,
          openWorldHint: false,
        },
      },
      async (args) => {
        try {
          if (!engine.store.state.enabled)
            throw fail("SERVICE_DISABLED", "MCP已禁用", 503);
          allow(client, client.scopes[0] ?? "__none__");
          await engine.store.audit({
            kind: "tool.called",
            clientId: client.id,
            tool: name,
          });
          const result = await run(args);
          return { content: [{ type: "text", text: JSON.stringify(result) }] };
        } catch (error) {
          return {
            isError: true,
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  code: error.code || "VALIDATION_FAILED",
                  message: error.code
                    ? error.message
                    : "请求未通过校验或上游操作失败",
                }),
              },
            ],
          };
        }
      },
    );
  }
  tool(
    "system.capabilities",
    "读取当前客户端有效权限、三方连接状态与支持／拒绝能力",
    object({}),
    () => engine.capabilities(client),
    true,
  );
  tool(
    "home3d.projects.list",
    "列出授权项目，不包含秘密",
    object({}),
    () => {
      allow(client, "home3d.project.read");
      return engine.projects
        .listProjects()
        .filter(
          (p) =>
            client.resources.projects.includes(p.id) ||
            (client.scopes.includes("home3d.project.replace") &&
              client.resources.projects.includes("*")),
        )
        .map((p) => ({
          id: p.id,
          name: p.name,
          version: engine.projects.getProject(p.id).version,
        }));
    },
    true,
  );
  tool(
    "home3d.project.get",
    "读取指定项目几何与绑定，不返回素材正文或凭据",
    object({ projectId: id }),
    ({ projectId }) =>
      engine.summary(client, engine.project(client, projectId)),
    true,
  );
  tool(
    "home3d.catalog.list",
    "读取可用内置模型和安全草稿说明",
    object({}),
    () => {
      allow(client, "home3d.catalog.read");
      return {
        models: engine.platform
          .getModelTemplates()
          .filter((m) => m.builtin && m.source?.type === "procedural")
          .map((m) => ({
            id: m.id,
            name: m.name,
            dimensions: m.dimensions,
            shape: m.source.shape,
          })),
        projectCollections: ["walls", "rooms", "furniture", "devices"],
        modelCreation: {
          shape: "box",
          dimensions: "width/depth/height in meters",
        },
        sidebar: { mode: "passive HTML/CSS", scripts: false, actions: false },
      };
    },
    true,
  );
  tool(
    "home3d.draft.project",
    "创建新增或更新楼层对象的版本化草稿；不会立即写项目",
    object({ projectId: id, operations: z.array(operation).min(1).max(100) }),
    (args) => engine.planProject(client, args),
  );
  tool(
    "home3d.project.create_plan",
    "完整管理：新建／复制项目计划，需全项目范围",
    object({ name: z.string().min(1).max(80), sourceProjectId: id.optional() }),
    (args) => engine.planCreateProject(client, args),
  );
  tool(
    "home3d.project.delete_plan",
    "完整管理：删除授权项目，保留本地计划快照；不能删除最后一个项目",
    object({ projectId: id }),
    (args) => engine.planDeleteProject(client, args),
  );
  tool(
    "home3d.draft.project_full",
    "完整业务管理：替换授权项目的全部配置，按共用权限及版本校验应用",
    object({ projectId: id, project: z.record(z.unknown()) }),
    (args) => engine.planFullProject(client, args),
  );
  tool(
    "home3d.draft.sidebar",
    "创建楼层侧边栏被动HTML/CSS草稿，可选择审批后发布",
    object({
      projectId: id,
      floorId: id,
      draft: z.record(z.unknown()),
      publish: z.boolean().default(false),
    }),
    (args) => engine.planSidebar(client, args),
  );
  tool(
    "home3d.sidebar.get",
    "读取允许项目楼层的侧边栏草稿和发布布局，按敏感字段过滤",
    object({ projectId: id, floorId: id }),
    ({ projectId, floorId }) => {
      const p = engine.project(client, projectId);
      return clean(engine.sidebars.get(engine.sidebars.floorKey(p, floorId)));
    },
    true,
  );
  tool(
    "home3d.draft.model",
    "生成程序化盒体模型模板草稿；审批后进入模型库",
    object({
      projectId: id,
      name: z.string().min(1).max(80),
      width: z.number().min(0.05).max(20),
      depth: z.number().min(0.05).max(20),
      height: z.number().min(0.05).max(20),
      color: z
        .string()
        .regex(/^#[0-9a-f]{6}$/i)
        .default("#e8edf2"),
    }),
    (args) => engine.planModel(client, args),
  );
  tool(
    "home3d.catalog.model_get",
    "完整业务管理：读取模型库配置用于修改（不返回模型文件正文或秘密）",
    object({ projectId: id, modelId: id }),
    ({ projectId, modelId }) => {
      engine.project(client, projectId, "home3d.project.replace");
      const model = engine.platform
        .getModelTemplates()
        .find((m) => m.id === modelId);
      if (!model) throw fail("RESOURCE_DENIED", "模型不存在");
      return clean(model);
    },
    true,
  );
  tool(
    "home3d.draft.model_full",
    "完整业务管理：编辑非内置模型库配置；不允许任意远程URL或服务器路径",
    object({ projectId: id, model: z.record(z.unknown()) }),
    (args) => engine.planFullModel(client, args),
  );
  tool(
    "ha.entities.list",
    "读取明确授权的HA实体基本状态；管理员需先开启复用HA连接",
    object({}),
    () => {
      allow(client, "ha.state.read");
      return engine.haAdapter.entities(client);
    },
    true,
  );
  tool(
    "ha.services.list",
    "读取第一版支持的灯具服务",
    object({}),
    () => engine.haAdapter.services(client),
    true,
  );
  tool("ha.action.plan", "生成指定light实体的真实动作计划", action, (args) =>
    engine.planHa(client, "ha-action", args),
  );
  tool(
    "ha.helper.plan",
    "新建input_boolean辅助实体计划；须HA管理接口支持",
    object({
      name: z.string().min(1).max(80),
      icon: z
        .string()
        .regex(/^mdi:[a-z0-9-]+$/)
        .optional(),
    }),
    (args) => engine.planHa(client, "ha-helper", args),
  );
  tool(
    "ha.automation.plan",
    "创建静态定时灯光自动化计划；保存后初始禁用，不会自动启用",
    object({
      alias: z.string().min(1).max(80),
      at: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/),
      actions: z.array(action).min(1).max(10),
    }),
    (args) => engine.planHa(client, "ha-automation", args),
  );
  tool(
    "nodered.flows.get",
    "读取指定授权tab的节点与rev，不返回凭据",
    object({ tabId: id }),
    ({ tabId }) => engine.nr.read(client, tabId),
    true,
  );
  tool(
    "nodered.flow.plan",
    "创建受限标准节点流程差异；禁止Function/Exec、跨tab和凭据写入",
    object({
      tabId: id,
      nodes: z.array(z.record(z.unknown())).min(1).max(100),
    }),
    (args) => engine.planNr(client, args),
  );
  tool(
    "nodered.flow.delete_plan",
    "完整流程管理：删除授权tab及其节点，保留共享配置，需审批",
    object({ tabId: id }),
    (args) => engine.planNrDelete(client, args),
  );
  tool(
    "nodered.configs.list",
    "可信完整管理：读取共享配置（凭据字段永不返回）",
    object({}),
    async () => {
      allow(client, "nodered.trusted");
      allow(client, "nodered.flow.read");
      const data = await engine.nr.flows();
      return {
        rev: data.rev,
        nodes: clean(data.flows.filter((n) => !n.z && n.type !== "tab")),
      };
    },
    true,
  );
  tool(
    "changes.inspect",
    "查看自己的计划、脱敏差异及批准状态",
    object({ planId: id }),
    ({ planId }) => engine.inspect(client, planId),
    true,
  );
  tool(
    "changes.validate",
    "重新校验计划基础版本与权限；不产生写入",
    object({ planId: id }),
    async ({ planId }) => {
      const result = engine.inspect(client, planId),
        p = engine.store.plan(planId, client);
      let current = p.base;
      if (["project", "project-full", "restore"].includes(p.kind))
        current = engine.project(client, p.payload.projectId).version;
      if (p.kind === "sidebar")
        current = engine.sidebars.get(p.payload.key).revision;
      if (["nodered", "nodered-delete"].includes(p.kind))
        current = (await engine.nr.flows()).rev;
      return {
        ...result,
        baseCurrent: current,
        valid: current === p.base && Date.parse(p.expiresAt) > Date.now(),
      };
    },
    true,
  );
  tool(
    "changes.apply",
    "应用版本未变化的计划；共用模式无需人工批准，必须使用唯一幂等键",
    object({ planId: id, idempotencyKey: z.string().min(8).max(128) }),
    (args) => engine.apply(client, args),
  );
  tool(
    "changes.status",
    "读取已提交操作状态；结果未知时禁止重发物理动作",
    object({ planId: id }),
    ({ planId }) => engine.inspect(client, planId),
    true,
  );
  tool(
    "changes.rollback.plan",
    "生成项目／侧边栏的恢复计划，需再次审批；不会撤回物理动作",
    object({ planId: id }),
    ({ planId }) => engine.rollback(client, planId),
  );
  server.registerResource(
    "permission-guide",
    "ha3d://permissions",
    { mimeType: "text/plain", description: "本客户端权限与禁止操作" },
    async () => ({
      contents: [
        {
          uri: "ha3d://permissions",
          mimeType: "text/plain",
          text: JSON.stringify(engine.capabilities(client)),
        },
      ],
    }),
  );
  server.registerPrompt(
    "create-device",
    { description: "生成模型与绑定设备的受控工作流程" },
    async () => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: "先读取system.capabilities与home3d.catalog.list，读取指定项目后创建模型／摆放草稿，调用changes.validate与changes.inspect，根据system.capabilities中的审批策略调用changes.apply；共用模式无需人工批准。禁止触发范围外设备。",
          },
        },
      ],
    }),
  );
  return server;
}
function localOrigin(req) {
  if (req.headers.origin) {
    try {
      if (new URL(req.headers.origin).host !== req.headers.host) return false;
    } catch {
      return false;
    }
  }
  return (
    !req.headers["sec-fetch-site"] ||
    req.headers["sec-fetch-site"] === "same-origin" ||
    req.headers["sec-fetch-site"] === "none"
  );
}
export async function startMcp({
  app,
  config,
  projects,
  sidebars,
  platform,
  ha,
  writeGate,
  gateway,
  onSidebarChanged,
  directory,
  port = 8102,
  publicPort = port,
  host = "0.0.0.0",
  sharedAccess = true,
}) {
  const store = await McpStore.create(
    directory,
    projects.listProjects().map((p) => p.id),
  );
  const bootstrapPath = path.join(directory, "bootstrap.json");
  if (sharedAccess) await store.enableSharedAccess();
  const bootstrap = JSON.parse(await readFile(bootstrapPath, "utf8"));
  const endpoint = `http://localhost:${publicPort}/mcp`;
  if (bootstrap.endpoint !== endpoint) {
    bootstrap.endpoint = endpoint;
    await writeFile(bootstrapPath, JSON.stringify(bootstrap, null, 2), {
      mode: 0o600,
    });
  }
  const engine = new McpEngine({
    store,
    projects,
    sidebars,
    platform,
    ha,
    writeGate,
    gateway,
    onSidebarChanged,
  });
  const admin = async (req, reply) => {
    if (
      !localOrigin(req) ||
      (!sharedAccess &&
        !equalSecret(req.headers["x-mcp-admin"] || "", store.state.adminHash))
    )
      return reply.code(403).send({
        error: sharedAccess ? "拒绝跨站管理请求" : "需要本地MCP管理员密钥",
      });
    reply.header("Cache-Control", "no-store");
  };
  const view = await readFile(
    fileURLToPath(new URL("./admin.html", import.meta.url)),
    "utf8",
  );
  app.get("/mcp-admin", async (req, reply) =>
    reply
      .header("Cache-Control", "no-store")
      .header(
        "Content-Security-Policy",
        "default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; frame-src 'self' about:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
      )
      .type("text/html")
      .send(view),
  );
  app.post("/api/mcp-admin/endpoint", { preHandler: admin }, async (req) =>
    store.serial(async () => {
      const input = object({ endpoint: z.string().max(500) }).parse(req.body);
      const value = input.endpoint.trim();
      if (value) {
        let url;
        try { url = new URL(value); } catch { throw fail("VALIDATION_FAILED", "请输入完整的 HTTP(S) MCP 连接地址", 422); }
        if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.search || url.hash)
          throw fail("VALIDATION_FAILED", "连接地址须为无账号密码、查询参数或片段的 HTTP(S) 地址", 422);
        store.state.publicEndpoint = url.toString();
      } else { delete store.state.publicEndpoint; }
      await store.persist();
      await store.audit({ kind: "endpoint.changed" });
      return { ok: true };
    }),
  );
  app.get("/api/mcp-admin/state", { preHandler: admin }, async (req) => ({
    enabled: store.state.enabled,
    endpoint: store.state.publicEndpoint || `http://${new URL("http://" + req.headers.host).hostname}:${publicPort}/mcp`,
    endpointOverride: store.state.publicEndpoint || "",
    sharedAccess,
    sharedPolicy: sharedAccess
      ? store.publicClient(
          store.state.clients.find((c) => c.id === "shared-agents"),
        )
      : undefined,
    clients: sharedAccess
      ? []
      : store.state.clients.map((c) => store.publicClient(c)),
    scopes: SCOPES,
    projects: projects.listProjects().map((p) => ({ id: p.id, name: p.name })),
    connections: {
      ha: {
        enabled: store.state.connections.ha.enabled,
        configured: !!ha.config.ha.token,
        connected: !!ha.getStatus().connected,
      },
      nodered: {
        enabled: store.state.connections.nodered.enabled,
        url: store.state.connections.nodered.url || "",
        authMode: store.state.connections.nodered.authMode || "bearer",
        configured: !!store.state.connections.nodered.secret,
      },
    },
    plans: store.state.plans
      .slice(-100)
      .reverse()
      .map((p) => store.publicPlan(p)),
  }));
  const clientSchema = object({
    name: z.string().min(1).max(80),
    scopes: z.array(z.enum(SCOPES)).min(1).max(SCOPES.length),
    resources: object({
      projects: z.array(id).max(100),
      entities: z.array(z.union([entity, z.literal("*")])).max(500),
      tabs: z.array(id).max(100),
    }),
    expiresAt: z.string().datetime(),
    trustedCode: z.boolean().default(false),
  });
  function parseClient(body) {
    const input = clientSchema.parse(body);
    if (
      input.scopes.some((s) =>
        ["home3d.code.write", "nodered.trusted"].includes(s),
      ) &&
      !input.trustedCode
    )
      throw fail(
        "APPROVAL_REQUIRED",
        "必须明确确认可信代码可能获得运行环境权限",
      );
    delete input.trustedCode;
    if (
      input.resources.tabs.includes("*") &&
      !input.scopes.includes("nodered.trusted")
    )
      throw fail("RESOURCE_DENIED", "全流程范围需要Node-RED完整管理权限");
    if (
      Date.parse(input.expiresAt) <= Date.now() ||
      Date.parse(input.expiresAt) > Date.now() + 366 * 86400000
    )
      throw fail("VALIDATION_FAILED", "到期时间需在未来一年内", 422);
    if (
      input.resources.projects.some((id) =>
        id === "*"
          ? !input.scopes.includes("home3d.project.replace")
          : !projects.getProject(id),
      )
    )
      throw fail("VALIDATION_FAILED", "项目ID不存在", 422);
    return input;
  }
  app.post("/api/mcp-admin/permissions", { preHandler: admin }, async (req) => {
    if (!sharedAccess)
      throw fail("UNSUPPORTED_CAPABILITY", "未启用共用权限", 409);
    const body = object({
      scopes: clientSchema.shape.scopes,
      resources: clientSchema.shape.resources,
      revision: z.number().int().min(0),
      trustedCode: z.boolean(),
    }).parse(req.body);
    const { revision, ...policy } = body;
    const input = parseClient({
      ...policy,
      name: "所有 Agent 共用权限",
      expiresAt: new Date(Date.now() + 365 * 86400000).toISOString(),
    });
    input.expiresAt = "9999-12-31T23:59:59.000Z";
    return {
      policy: await store.updateClient("shared-agents", input, body.revision),
    };
  });
  if (sharedAccess)
    app.addHook("preHandler", async (req, reply) => {
      if (req.url.startsWith("/api/mcp-admin/clients"))
        return reply
          .code(410)
          .send({ error: "已改为共用权限，不再管理独立客户端" });
    });
  app.post("/api/mcp-admin/clients", { preHandler: admin }, async (req) =>
    store.createClient(parseClient(req.body)),
  );
  app.post(
    "/api/mcp-admin/clients/:id/update",
    { preHandler: admin },
    async (req) => {
      const { revision, ...body } = clientSchema
        .extend({ revision: z.number().int().min(0) })
        .parse(req.body);
      return {
        client: await store.updateClient(
          req.params.id,
          parseClient(body),
          revision,
        ),
        keyUnchanged: true,
      };
    },
  );
  app.post(
    "/api/mcp-admin/clients/:id/revoke",
    { preHandler: admin },
    async (req) =>
      store.serial(async () => {
        const c = store.state.clients.find((c) => c.id === req.params.id);
        if (!c) throw fail("RESOURCE_DENIED", "客户端不存在", 404);
        c.revoked = true;
        c.revision = (c.revision ?? 0) + 1;
        await store.persist();
        await store.audit({ kind: "client.revoked", clientId: c.id });
        return { ok: true };
      }),
  );
  app.get("/api/mcp-admin/plans/:id", { preHandler: admin }, async (req) => {
    const p = store.state.plans.find((p) => p.id === req.params.id);
    if (!p) throw fail("RESOURCE_DENIED", "计划不存在", 404);
    let current;
    if (p.payload.projectId)
      current = engine.projects.getProject(p.payload.projectId);
    if (p.kind === "sidebar") current = engine.sidebars.get(p.payload.key);
    return {
      ...store.publicPlan(p),
      fullPreview: clean(p.payload),
      current: clean(current),
      before: clean(p.before),
    };
  });
  app.post(
    "/api/mcp-admin/plans/:id/apply",
    { preHandler: admin },
    async (req) => {
      const p = store.state.plans.find((p) => p.id === req.params.id);
      if (!p) throw fail("RESOURCE_DENIED", "计划不存在", 404);
      const client = store.state.clients.find((c) => c.id === p.clientId);
      const input = object({
        idempotencyKey: z.string().min(8).max(128),
      }).parse(req.body);
      return engine.apply(client, { planId: p.id, ...input });
    },
  );
  app.post(
    "/api/mcp-admin/plans/:id/rollback",
    { preHandler: admin },
    async (req) => {
      const p = store.state.plans.find((p) => p.id === req.params.id);
      if (!p) throw fail("RESOURCE_DENIED", "计划不存在", 404);
      const client = store.state.clients.find((c) => c.id === p.clientId);
      return engine.rollback(client, p.id);
    },
  );
  app.post(
    "/api/mcp-admin/plans/:id/approve",
    { preHandler: admin },
    async (req) => {
      await store.approve(req.params.id);
      return { ok: true };
    },
  );
  app.post("/api/mcp-admin/settings", { preHandler: admin }, async (req) =>
    store.serial(async () => {
      const input = object({
        enabled: z.boolean(),
        haEnabled: z.boolean(),
        nodeRedEnabled: z.boolean(),
        nodeRedUrl: z.string().max(300).default(""),
        nodeRedToken: z.string().max(4096).default(""),
        nodeRedAuthMode: z.enum(["basic", "bearer"]).optional(),
        nodeRedUsername: z.string().max(256).default(""),
        nodeRedPassword: z.string().max(4096).default(""),
      }).parse(req.body);
      const c = store.state.connections;
      if (input.nodeRedEnabled) {
        let url;
        try {
          url = new URL(input.nodeRedUrl);
        } catch {
          throw fail("VALIDATION_FAILED", "Node-RED地址无效", 422);
        }
        if (
          !["http:", "https:"].includes(url.protocol) ||
          url.username ||
          url.password ||
          url.search ||
          url.hash
        )
          throw fail(
            "VALIDATION_FAILED",
            "Node-RED地址必须为无凭据和查询参数的HTTP(S)地址",
            422,
          );
        const address = url.toString().replace(/\/$/, "");
        const authMode =
          input.nodeRedAuthMode || c.nodered.authMode || "bearer";
        let credential = input.nodeRedToken;
        if (authMode === "basic") {
          if (
            /[\r\n:]/.test(input.nodeRedUsername) ||
            /[\r\n]/.test(input.nodeRedPassword)
          )
            throw fail(
              "VALIDATION_FAILED",
              "账号不能包含冒号或换行，密码不能包含换行",
              422,
            );
          if (!!input.nodeRedUsername !== !!input.nodeRedPassword)
            throw fail(
              "VALIDATION_FAILED",
              "更新账号认证时必须同时填写账号和密码",
              422,
            );
          credential = input.nodeRedUsername
            ? input.nodeRedUsername + ":" + input.nodeRedPassword
            : "";
        }
        if (
          !credential &&
          (!c.nodered.secret ||
            c.nodered.url !== address ||
            (c.nodered.authMode || "bearer") !== authMode)
        )
          throw fail(
            "VALIDATION_FAILED",
            authMode === "basic"
              ? "新连接需要Node-RED账号和密码"
              : "新连接需要Node-RED访问令牌",
            422,
          );
        const secret = credential
          ? store.encrypt(credential)
          : c.nodered.secret;
        c.nodered = {
          enabled: input.nodeRedEnabled,
          url: address,
          authMode,
          secret,
        };
      }
      c.ha.enabled = input.haEnabled;
      c.nodered.enabled = input.nodeRedEnabled;
      store.state.enabled = input.enabled;
      for (const p of store.state.plans)
        if (p.status === "draft") delete p.approval;
      await store.persist();
      await store.audit({ kind: "connections.changed" });
      return { ok: true };
    }),
  );
  app.post("/api/mcp-admin/probe", { preHandler: admin }, async (req) => {
    const target = z.enum(["ha", "nodered"]).parse(req.body?.target);
    try {
      if (target === "ha") {
        const result = await engine.haAdapter.request("/config");
        return { ok: true, version: result.version };
      }
      const result = await engine.nr.flows();
      return {
        ok: true,
        revision: result.rev,
        tabs: result.flows
          .filter((n) => n.type === "tab")
          .map((n) => ({ id: n.id, name: n.label || n.id })),
      };
    } catch (e) {
      return {
        ok: false,
        code: e.code || "UPSTREAM_UNAVAILABLE",
        message: e.code ? e.message : "连接失败",
      };
    }
  });
  const rate = new Map(),
    active = new Map();
  const listener = createServer(async (req, res) => {
    const send = (status, error) => {
      if (!res.headersSent) {
        res.writeHead(status, {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        });
        res.end(JSON.stringify({ error }));
      }
    };
    try {
      if (
        (!sharedAccess &&
          !["localhost", "127.0.0.1", "[::1]"].includes(
            new URL("http://" + req.headers.host).hostname,
          )) ||
        !localOrigin(req)
      )
        return send(403, "不允许的Host或Origin");
      if (req.url === "/health" && req.method === "GET") {
        res.writeHead(200, {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        });
        return res.end(
          JSON.stringify({ ok: true, enabled: store.state.enabled }),
        );
      }
      if (req.url !== "/mcp") return send(404, "Not found");
      const token = (req.headers.authorization || "").match(
        /^Bearer ([A-Za-z0-9_-]{32,})$/,
      )?.[1];
      const client = sharedAccess
        ? store.state.clients.find((c) => c.id === "shared-agents")
        : token && store.principal(token);
      if (!client) return send(401, "需要有效的MCP Bearer连接密钥");
      if (!store.state.enabled) return send(503, "MCP已关闭");
      const now = Date.now(),
        bucket = rate.get(client.id) || { start: now, count: 0 };
      if (now - bucket.start > 60000) {
        bucket.start = now;
        bucket.count = 0;
      }
      if (++bucket.count > 120) return send(429, "请求过于频繁");
      rate.set(client.id, bucket);
      if ((active.get(client.id) || 0) >= (sharedAccess ? 8 : 2))
        return send(429, "共用权限最多8个并行请求");
      if (req.method !== "POST")
        return send(405, "Stateless模式不提供GET事件流或DELETE会话");
      if (!(req.headers["content-type"] || "").startsWith("application/json"))
        return send(415, "需要JSON");
      let bytes = 0;
      const chunks = [];
      for await (const chunk of req) {
        bytes += chunk.length;
        if (bytes > 2 * 1024 * 1024) return send(413, "请求过大");
        chunks.push(chunk);
      }
      let body;
      try {
        body = JSON.parse(Buffer.concat(chunks).toString());
      } catch {
        return send(400, "JSON无效");
      }
      const inspect = (v, d = 0) => {
        if (d > 32) throw fail("VALIDATION_FAILED", "JSON过深");
        if (v && typeof v === "object")
          for (const x of Object.values(v)) inspect(x, d + 1);
      };
      inspect(body);
      active.set(client.id, (active.get(client.id) || 0) + 1);
      const protocol = createProtocol(engine, client),
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: undefined,
          enableJsonResponse: true,
        });
      let closed = false;
      const close = () => {
        if (closed) return;
        closed = true;
        active.set(client.id, Math.max(0, (active.get(client.id) || 1) - 1));
        void protocol.close();
      };
      res.on("close", close);
      await protocol.connect(transport);
      await transport.handleRequest(req, res, body);
    } catch {
      send(400, "MCP请求无法处理，请检查参数或连接状态");
    }
  });
  listener.requestTimeout = 20000;
  listener.headersTimeout = 15000;
  await new Promise((resolve, reject) => {
    listener.once("error", reject);
    listener.listen(port, host, resolve);
  });
  return {
    store,
    engine,
    listener,
    close: () => new Promise((resolve) => listener.close(resolve)),
  };
}
