import { isDeepStrictEqual } from "node:util";
import { normalizeModelTemplate } from "../device-platform/devicePlatformSchema.js";
import { randomUUID } from "node:crypto";
import { validateFloorplanProject } from "@ha3d/schema";
import { normalizeSidebar } from "../../../../packages/schema/src/sidebar.js";
import { allow, fail, clean, hash } from "./store.js";
import {
  HaAdapter,
  NodeRedAdapter,
  staticLightAction,
  validateNrTab,
} from "./adapters.js";
const fields = {
  rooms: ["id", "name", "polygon", "color"],
  walls: ["id", "start", "end", "height", "thickness", "virtual"],
  furniture: [
    "id",
    "name",
    "kind",
    "position",
    "rotation",
    "width",
    "depth",
    "height",
    "elevation",
    "color",
    "customModel",
  ],
  devices: [
    "id",
    "entityId",
    "kind",
    "floorId",
    "roomId",
    "position",
    "rotation",
    "scale",
    "modelId",
    "label",
  ],
};
const plain = (value) =>
  value && typeof value === "object" && !Array.isArray(value);
export function projectPatch(project, operations, client) {
  const next = structuredClone(project);
  if (
    !Array.isArray(operations) ||
    operations.length < 1 ||
    operations.length > 100
  )
    throw fail("VALIDATION_FAILED", "需要1–100个修改", 422);
  for (const op of operations) {
    const floor = next.floors.find((f) => f.id === op.floorId);
    if (
      !floor ||
      !Object.hasOwn(fields, op.collection) ||
      !plain(op.value) ||
      typeof op.value.id !== "string"
    )
      throw fail("VALIDATION_FAILED", "楼层／对象无效", 422);
    if (Object.keys(op.value).some((k) => !fields[op.collection].includes(k)))
      throw fail("RESOURCE_DENIED", "不允许修改此字段或执行代码");
    if (op.collection === "devices") {
      const entityId =
        op.value.entityId ??
        floor.devices.find((d) => d.id === op.value.id)?.entityId;
      if (!entityId)
        throw fail("VALIDATION_FAILED", "设备必须绑定已有实体", 422);
      allow(client, "ha.state.read", "entities", entityId);
      if (
        op.value.modelId &&
        !/^(?:light|switch|sensor|binary_sensor|climate|fan|cover|media_player|camera|vacuum|button|number|select)\.[a-z0-9_.-]+$/.test(
          op.value.modelId,
        )
      )
        throw fail("RESOURCE_DENIED", "仅允许内置设备模型ID");
    }
    if (op.collection === "furniture" && (op.value.kind === "custom_model" || op.value.customModel)) {
      allow(client, "home3d.project.replace", "projects", project.id);
      if (op.value.customModel?.source?.type !== "procedural" || op.value.customModel.source.shape !== "box")
        throw fail("RESOURCE_DENIED", "MCP摆放仅允许本地程序化盒体自定义模型");
    }
    const index = floor[op.collection].findIndex((x) => x.id === op.value.id);
    if (index < 0) floor[op.collection].push(op.value);
    else
      floor[op.collection][index] = {
        ...floor[op.collection][index],
        ...op.value,
      };
  }
  const result = validateFloorplanProject(next);
  if (!result.valid)
    throw fail(
      "VALIDATION_FAILED",
      result.issues.join("; ").slice(0, 500),
      422,
    );
  return result.project;
}
export function passiveSidebar(draft) {
  if (!plain(draft) || JSON.stringify(draft).length > 256000)
    throw fail("VALIDATION_FAILED", "侧边栏草稿无效或过大", 422);
  const source = JSON.stringify(draft);
  if (
    /<(?:script|iframe|object|embed|form|link|meta)\b|\bon\w+\s*=|(?:https?:|javascript:|data:|url\s*\(|@import|fetch\s*\(|XMLHttpRequest|WebSocket)/i.test(
      source,
    )
  )
    throw fail("RESOURCE_DENIED", "首版仅允许无外部资源的被动HTML/CSS控件");
  const walk = (value) => {
    if (!value || typeof value !== "object") return;
    for (const [key, v] of Object.entries(value)) {
      if (
        (/^(?:js|javascript|script|code)$/i.test(key) && v) ||
        (key === "actions" && Array.isArray(v) && v.length)
      )
        throw fail("RESOURCE_DENIED", "首版不发布脚本或真实设备动作");
      walk(v);
    }
  };
  walk(draft);
  return normalizeSidebar(draft);
}
export class McpEngine {
  constructor({
    store,
    projects,
    sidebars,
    platform,
    ha,
    writeGate,
    gateway,
    onSidebarChanged = () => {},
    fetcher = fetch,
  }) {
    Object.assign(this, {
      store,
      projects,
      sidebars,
      platform,
      ha,
      writeGate,
      gateway,
      onSidebarChanged,
    });
    this.haAdapter = new HaAdapter(store, ha, fetcher);
    this.nr = new NodeRedAdapter(store, fetcher);
  }
  project(client, id, scope = "home3d.project.read") {
    allow(client, scope, "projects", id);
    const p = this.projects.getProject(id);
    if (!p) throw fail("RESOURCE_DENIED", "项目不存在");
    return p;
  }
  summary(client, p) {
    return {
      id: p.id,
      name: p.name,
      version: p.version,
      floors: p.floors.map((f) => ({
        id: f.id,
        name: f.name,
        height: f.height,
        level: f.level,
        walls: clean(f.walls),
        rooms: f.rooms.map((r) => ({
          id: r.id,
          name: r.name,
          polygon: r.polygon,
        })),
        furniture: clean(f.furniture),
        devices: f.devices.map((d) =>
          Object.fromEntries(fields.devices.map((k) => [k, d[k]])),
        ),
      })),
    };
  }
  capabilities(client) {
    return {
      implementation: "local-v1",
      transport: "Streamable HTTP / Bearer local compatibility",
      client: this.store.publicClient(client),
      connections: {
        ha: {
          enabled: this.store.state.connections.ha.enabled,
          configured: !!this.ha.config.ha.token,
          connected: !!this.ha.getStatus?.().connected,
        },
        nodered: {
          enabled: this.store.state.connections.nodered.enabled,
          configured: !!this.store.state.connections.nodered.secret,
        },
      },
      supported: [
        "project geometry draft/validate/apply/restore",
        client.scopes.includes("home3d.code.write")
          ? "trusted sidebar HTML/CSS/JS editing"
          : "passive sidebar draft/publish/restore",
        "procedural box model library",
        "HA light actions",
        "HA input_boolean creation",
        "HA disabled static time automation creation",
        client.scopes.includes("nodered.trusted")
          ? "Node-RED trusted Function and shared configuration editing (not a runtime sandbox)"
          : "Node-RED scoped standard-node flows",
      ],
      refused: [
        "direct host commands/files/URLs",
        "secret access",
        "authentication changes",
        ...(client.scopes.includes("nodered.trusted")
          ? ["package installation"]
          : ["Function/Exec/packages"]),
        "sensitive device actions",
        "dynamic templates",
        "browser localStorage settings",
        "camera media",
      ],
      approval: this.store.sharedAccess
        ? "Shared mode: no manual approval required; scope, revision and idempotency checks remain. Upstream calls only after connection enable."
        : "Every apply requires local administrator approval. Upstream calls only after explicit connection enable.",
    };
  }
  inspect(client, id) {
    const p = this.store.plan(id, client);
    allow(client, p.scope, p.resource.kind, p.resource.id);
    return this.store.publicPlan(p);
  }
  async planCreateProject(client, input) {
    allow(client, "home3d.project.replace", "projects", "*");
    if (input.sourceProjectId)
      this.project(client, input.sourceProjectId, "home3d.project.read");
    return this.store.publicPlan(
      await this.store.addPlan(
        client,
        "project-create",
        input,
        null,
        "home3d.project.replace",
        { kind: "projects", id: "*" },
      ),
    );
  }
  async planDeleteProject(client, { projectId }) {
    const current = this.project(client, projectId, "home3d.project.replace");
    if (this.projects.listProjects().length <= 1)
      throw fail("RESOURCE_DENIED", "不能删除最后一个项目");
    return this.store.publicPlan(
      await this.store.addPlan(
        client,
        "project-delete",
        { projectId, name: current.name },
        current.version,
        "home3d.project.replace",
        { kind: "projects", id: projectId },
      ),
    );
  }
  async planFullProject(client, { projectId, project }) {
    const current = this.project(client, projectId, "home3d.project.replace");
    if (project.id !== projectId)
      throw fail("RESOURCE_DENIED", "不能替换其它项目");
    const validation = validateFloorplanProject(project);
    if (!validation.valid)
      throw fail("VALIDATION_FAILED", "项目未通过schema校验", 422);
    return this.store.publicPlan(
      await this.store.addPlan(
        client,
        "project-full",
        {
          projectId,
          proposed: validation.project,
          summary: {
            name: project.name,
            floors: project.floors?.map((f) => ({
              id: f.id,
              name: f.name,
              objects:
                (f.walls?.length || 0) +
                (f.furniture?.length || 0) +
                (f.devices?.length || 0),
            })),
          },
        },
        current.version,
        "home3d.project.replace",
        { kind: "projects", id: projectId },
      ),
    );
  }
  async planProject(client, { projectId, operations }) {
    const p = this.project(client, projectId, "home3d.draft.write");
    allow(client, "home3d.project.write", "projects", projectId);
    const proposed = projectPatch(p, operations, client);
    return this.store.publicPlan(
      await this.store.addPlan(
        client,
        "project",
        { projectId, operations, proposed },
        p.version,
        "home3d.project.write",
        { kind: "projects", id: projectId },
      ),
    );
  }
  async planSidebar(client, { projectId, floorId, draft, publish = false }) {
    const p = this.project(client, projectId, "home3d.draft.write");
    const key = this.sidebars.floorKey(p, floorId),
      previous = this.sidebars.get(key);
    const normalized = client.scopes.includes("home3d.code.write")
      ? normalizeSidebar(draft)
      : passiveSidebar(draft);
    const scope = publish ? "home3d.publish" : "home3d.project.write";
    return this.store.publicPlan(
      await this.store.addPlan(
        client,
        "sidebar",
        { projectId, floorId, draft: normalized, publish, key },
        previous.revision,
        scope,
        { kind: "projects", id: projectId },
      ),
    );
  }
  async planModel(client, { projectId, name, width, depth, height, color }) {
    this.project(client, projectId, "home3d.draft.write");
    const model = {
      id: "mcp." + hash(projectId).slice(0, 10) + "." + randomUUID(),
      name,
      source: { type: "procedural", shape: "box" },
      dimensions: { width, depth, height },
      color,
      furnitureEnabled: true,
      placement: "floor",
    };
    return this.store.publicPlan(
      await this.store.addPlan(
        client,
        "model",
        { projectId, model },
        null,
        "home3d.publish",
        { kind: "projects", id: projectId },
      ),
    );
  }
  async planFullModel(client, { projectId, model }) {
    this.project(client, projectId, "home3d.project.replace");
    allow(client, "home3d.publish", "projects", projectId);
    if (
      !model?.id ||
      model.id.startsWith("builtin.") ||
      (model.source?.url &&
        !model.source.url.startsWith("./api/device-platform/model-files/"))
    )
      throw fail("RESOURCE_DENIED", "不修改内置模型或远程模型URL");
    const before = this.platform
      .getModelTemplates()
      .find((m) => m.id === model.id);
    if (
      before &&
      !client.resources.projects.includes("*") &&
      !this.projects
        .listProjects()
        .every((p) => client.resources.projects.includes(p.id))
    )
      throw fail("RESOURCE_DENIED", "共享模型库修改需覆盖所有受影响项目");
    if (model.source?.type === "upload" && !before?.source?.url)
      throw fail("UNSUPPORTED_CAPABILITY", "新上传模型请先通过本地模型库导入");
    model = normalizeModelTemplate(model);
    return this.store.publicPlan(
      await this.store.addPlan(
        client,
        "model-full",
        { projectId, model },
        before ? hash(before) : null,
        "home3d.publish",
        { kind: "projects", id: projectId },
      ),
    );
  }
  async planNrDelete(client, { tabId }) {
    allow(client, "nodered.trusted");
    allow(client, "nodered.flow.deploy", "tabs", tabId);
    const current = await this.nr.flows();
    return this.store.publicPlan(
      await this.store.addPlan(
        client,
        "nodered-delete",
        {
          tabId,
          nodes: clean(
            current.flows.filter((n) => n.id === tabId || n.z === tabId),
          ),
        },
        current.rev,
        "nodered.flow.deploy",
        { kind: "tabs", id: tabId },
      ),
    );
  }
  async planHa(client, kind, payload) {
    this.haAdapter.enabled();
    if (kind === "ha-action") {
      staticLightAction(client, payload);
      return this.store.publicPlan(
        await this.store.addPlan(
          client,
          kind,
          payload,
          null,
          "ha.service.call",
          { kind: "entities", id: payload.entityId },
        ),
      );
    }
    if (kind === "ha-helper") {
      allow(client, "ha.helper.write");
      const before = await this.haAdapter.helperList();
      return this.store.publicPlan(
        await this.store.addPlan(
          client,
          kind,
          payload,
          hash(before),
          "ha.helper.write",
          {},
        ),
      );
    }
    if (kind === "ha-automation") {
      allow(client, "ha.automation.deploy");
      for (const action of payload.actions) staticLightAction(client, action);
      return this.store.publicPlan(
        await this.store.addPlan(
          client,
          kind,
          {
            ...payload,
            automationId: "mcp_" + randomUUID().replaceAll("-", ""),
          },
          null,
          "ha.automation.deploy",
          {},
        ),
      );
    }
  }
  async planNr(client, { tabId, nodes }) {
    allow(client, "nodered.flow.draft", "tabs", tabId);
    allow(client, "nodered.flow.deploy", "tabs", tabId);
    const current = await this.nr.flows();
    validateNrTab(client, nodes, tabId, current.flows);
    return this.store.publicPlan(
      await this.store.addPlan(
        client,
        "nodered",
        { tabId, nodes },
        current.rev,
        "nodered.flow.deploy",
        { kind: "tabs", id: tabId },
      ),
    );
  }
  async rollback(client, id) {
    const original = this.store.plan(id, client);
    if (
      original.status !== "applied" ||
      !["project", "project-full", "sidebar"].includes(original.kind)
    )
      throw fail(
        "UNSUPPORTED_CAPABILITY",
        "首版只自动恢复项目和侧边栏；上游物理动作不可回滚",
        409,
      );
    this.project(client, original.payload.projectId, "home3d.restore");
    let base;
    if (original.kind === "project" || original.kind === "project-full") {
      base = this.projects.getProject(original.payload.projectId).version;
      if (base !== original.result.version)
        throw fail("REVISION_CONFLICT", "项目已产生后续修改，拒绝覆盖", 409);
    } else {
      base = this.sidebars.get(original.payload.key).revision;
      if (base !== original.result.revision)
        throw fail("REVISION_CONFLICT", "侧边栏已产生后续修改", 409);
    }
    return this.store.publicPlan(
      await this.store.addPlan(
        client,
        "restore",
        { originalId: id, projectId: original.payload.projectId },
        base,
        "home3d.restore",
        { kind: "projects", id: original.payload.projectId },
      ),
    );
  }
  async apply(client, { planId, idempotencyKey }) {
    return this.store.serial(async () => {
      const p = this.store.plan(planId, client);
      allow(client, p.scope, p.resource.kind, p.resource.id);
      if (p.idempotencyKey && p.idempotencyKey !== idempotencyKey)
        throw fail("IDEMPOTENCY_CONFLICT", "计划已绑定其它幂等键", 409);
      if (
        this.store.state.plans.some(
          (x) =>
            x.id !== p.id &&
            x.clientId === client.id &&
            x.idempotencyKey === idempotencyKey,
        )
      )
        throw fail("IDEMPOTENCY_CONFLICT", "幂等键不可用于其它计划", 409);
      if (p.idempotencyKey) return this.store.publicPlan(p);
      if (p.status !== "draft" || Date.parse(p.expiresAt) <= Date.now())
        throw fail("INVALID_PLAN", "计划已执行、失败或过期", 409);
      if (
        !this.store.sharedAccess &&
        (!p.approval ||
          p.approval.hash !==
            hash({ kind: p.kind, payload: p.payload, base: p.base }) ||
          Date.parse(p.approval.expiresAt) <= Date.now())
      )
        throw fail("APPROVAL_REQUIRED", "请在本地MCP管理页查看差异并批准");
      p.idempotencyKey = idempotencyKey;
      p.status = "applying";
      await this.store.audit({
        kind: "apply.started",
        planId: p.id,
        clientId: client.id,
        operation: p.kind,
      });
      await this.store.persist();
      try {
        p.result = await this.writeGate.shared(() => this.execute(client, p));
        p.status = "applied";
        await this.store.audit({
          kind: "apply.finished",
          planId: p.id,
          clientId: client.id,
          status: p.status,
        });
        await this.store.persist();
        return this.store.publicPlan(p);
      } catch (error) {
        p.status =
          !error.code || error.code === "RESULT_UNKNOWN" ? "unknown" : "failed";
        p.error = error.code || "APPLY_FAILED";
        await this.store.persist();
        await this.store.audit({
          kind: "apply.failed",
          planId: p.id,
          code: p.error,
        });
        throw error.code
          ? error
          : fail(
              "APPLY_FAILED",
              "写入未完成，请核查计划状态，不重发原动作",
              500,
            );
      }
    });
  }
  async execute(client, p) {
    const x = p.payload;
    if (p.kind === "project-create") {
      allow(client, "home3d.project.replace", "projects", "*");
      if (x.sourceProjectId) this.project(client, x.sourceProjectId);
      const saved = await this.projects.createProject(x);
      this.gateway?.broadcast({ type: "project.updated", payload: saved });
      return { projectId: saved.id, version: saved.version };
    }
    if (p.kind === "project-delete") {
      const current = this.project(
        client,
        x.projectId,
        "home3d.project.replace",
      );
      p.before = structuredClone(current);
      await this.store.persist();
      await this.projects.deleteProject(x.projectId, {
        expectedVersion: p.base,
      });
      this.gateway?.broadcast({
        type: "project.updated",
        payload: this.projects.getProject(),
      });
      return {
        deletedProject: x.projectId,
        note: "删除前快照保存在本地计划中；可在管理页读取后人工导入恢复，不会自动创建同ID对象。",
      };
    }
    if (p.kind === "project" || p.kind === "project-full") {
      const current = this.project(client, x.projectId, p.scope);
      if (current.version !== p.base)
        throw fail("REVISION_CONFLICT", "项目版本已变化", 409);
      const proposed =
        p.kind === "project-full"
          ? x.proposed
          : projectPatch(current, x.operations, client);
      p.before = structuredClone(current);
      await this.store.persist();
      const saved = await this.projects.saveProject(proposed, {
        expectedVersion: p.base,
      });
      this.gateway?.broadcast({ type: "project.updated", payload: saved });
      return { version: saved.version };
    }
    if (p.kind === "sidebar") {
      const project = this.project(client, x.projectId, p.scope);
      if (this.sidebars.floorKey(project, x.floorId) !== x.key)
        throw fail("REVISION_CONFLICT", "楼层已变化", 409);
      p.before = this.sidebars.get(x.key);
      await this.store.persist();
      const saved = await this.sidebars.update(
        x.key,
        {
          revision: p.base,
          draft: client.scopes.includes("home3d.code.write")
            ? normalizeSidebar(x.draft)
            : passiveSidebar(x.draft),
        },
        x.publish,
      );
      this.onSidebarChanged();
      this.gateway?.broadcast({
        type: "instance.restored",
        payload: { generation: Date.now() },
      });
      return { revision: saved.revision };
    }
    if (p.kind === "model") {
      this.project(client, x.projectId, "home3d.publish");
      if (this.platform.getModelTemplates().some((m) => m.id === x.model.id))
        throw fail("REVISION_CONFLICT", "模型ID已存在", 409);
      const model = await this.platform.upsertModelTemplate(x.model);
      return { modelId: model.id };
    }
    if (p.kind === "model-full") {
      this.project(client, x.projectId, "home3d.project.replace");
      const current = this.platform
        .getModelTemplates()
        .find((m) => m.id === x.model.id);
      if ((current ? hash(current) : null) !== p.base)
        throw fail("REVISION_CONFLICT", "模型库版本已变化", 409);
      p.before = current;
      await this.store.persist();
      const saved = await this.platform.upsertModelTemplate(x.model);
      return { modelId: saved.id };
    }
    if (p.kind === "nodered-delete") {
      allow(client, "nodered.trusted");
      const current = await this.nr.flows();
      if (current.rev !== p.base)
        throw fail("REVISION_CONFLICT", "流程版本已变化", 409);
      const next = current.flows.filter(
        (n) => n.id !== x.tabId && n.z !== x.tabId,
      );
      p.before = x.nodes;
      await this.store.persist();
      const result = await this.nr.request("/flows", "POST", {
        rev: p.base,
        flows: next,
      });
      return { rev: result?.rev, deletedTab: x.tabId };
    }
    if (p.kind === "ha-action") {
      const response = await this.haAdapter.action(client, x);
      return {
        requested: true,
        entityId: x.entityId,
        observed:
          client.scopes.includes("ha.state.read") && Array.isArray(response)
            ? response
                .filter((e) => e.entity_id === x.entityId)
                .map((e) => ({ entityId: e.entity_id, state: e.state }))
            : [],
      };
    }
    if (p.kind === "ha-helper") {
      allow(client, "ha.helper.write");
      if (hash(await this.haAdapter.helperList()) !== p.base)
        throw fail("REVISION_CONFLICT", "辅助实体列表已变化", 409);
      const created = await this.haAdapter.helperCreate(x);
      const after = await this.haAdapter.helperList();
      if (!created?.id || !after.some((e) => e.id === created.id))
        throw fail("RESULT_UNKNOWN", "创建结果未通过回读，请人工核查", 502);
      return {
        created: clean(created),
        note: "新实体需由管理员另行授权给客户端；不会自动扩大范围",
      };
    }
    if (p.kind === "ha-automation") {
      for (const a of x.actions) staticLightAction(client, a);
      const config = {
        id: x.automationId,
        alias: x.alias,
        initial_state: false,
        mode: "single",
        trigger: [{ platform: "time", at: x.at }],
        condition: [],
        action: x.actions.map((a) => ({
          service: a.service,
          target: { entity_id: a.entityId },
          data: a.data ?? {},
        })),
      };
      await this.haAdapter.request(
        "/config/automation/config/" + x.automationId,
        "POST",
        config,
      );
      const check = await this.haAdapter.request(
        "/config/automation/config/" + x.automationId,
      );
      if (
        check?.alias !== config.alias ||
        ![false, "off"].includes(check?.initial_state) ||
        !isDeepStrictEqual(check.action ?? check.actions, config.action) ||
        !isDeepStrictEqual(check.trigger ?? check.triggers, config.trigger)
      )
        throw fail("RESULT_UNKNOWN", "自动化保存后回读不一致", 502);
      return {
        automationId: x.automationId,
        initiallyDisabled: true,
        note: "未自动启用；请在HA检查后启用。保存接口可能触发配置重载。",
      };
    }
    if (p.kind === "nodered") {
      p.before = {
        rev: p.base,
        nodes: clean(
          (await this.nr.flows()).flows.filter(
            (n) => n.id === x.tabId || n.z === x.tabId,
          ),
        ),
      };
      await this.store.persist();
      return this.nr.apply(client, p);
    }
    if (p.kind === "restore") {
      const original = this.store.plan(x.originalId, client);
      this.project(client, x.projectId, "home3d.restore");
      if (original.kind === "project" || original.kind === "project-full") {
        const saved = await this.projects.saveProject(
          { ...structuredClone(original.before), version: p.base },
          { expectedVersion: p.base },
        );
        this.gateway?.broadcast({ type: "project.updated", payload: saved });
        return { version: saved.version };
      }
      const current = this.sidebars.get(original.payload.key);
      if (current.revision !== p.base)
        throw fail("REVISION_CONFLICT", "侧边栏版本冲突", 409);
      const first = await this.sidebars.update(
        original.payload.key,
        { revision: p.base, draft: original.before.published },
        true,
      );
      const result = await this.sidebars.update(
        original.payload.key,
        { revision: first.revision, draft: original.before.draft },
        false,
      );
      this.onSidebarChanged();
      return { revision: result.revision };
    }
    throw fail("UNSUPPORTED_CAPABILITY", "不支持该计划", 409);
  }
}
