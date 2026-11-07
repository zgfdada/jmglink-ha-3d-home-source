import {
  randomBytes,
  randomUUID,
  createHash,
  timingSafeEqual,
  createCipheriv,
  createDecipheriv,
} from "node:crypto";
import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import path from "node:path";
export const SCOPES = [
  "home3d.project.read",
  "home3d.catalog.read",
  "home3d.draft.write",
  "home3d.project.write",
  "home3d.publish",
  "home3d.restore",
  "home3d.project.replace",
  "home3d.code.write",
  "ha.state.read",
  "ha.service.call",
  "ha.helper.write",
  "ha.automation.deploy",
  "nodered.flow.read",
  "nodered.flow.draft",
  "nodered.flow.deploy",
  "nodered.trusted",
];
export const fail = (code, message, statusCode = 403) =>
  Object.assign(new Error(message), { code, statusCode });
export const hash = (value) =>
  createHash("sha256")
    .update(typeof value === "string" ? value : JSON.stringify(value))
    .digest("hex");
export function equalSecret(value, digest) {
  const a = Buffer.from(hash(value)),
    b = Buffer.from(digest || "");
  return a.length === b.length && timingSafeEqual(a, b);
}
export function allow(client, scope, kind, id) {
  if (!client || client.revoked || Date.parse(client.expiresAt) <= Date.now())
    throw fail("AUTH_REQUIRED", "客户端已撤销或过期", 401);
  if (!client.scopes.includes(scope))
    throw fail("FORBIDDEN_SCOPE", `缺少权限：${scope}`);
  if (
    kind &&
    !client.resources[kind]?.includes(id) &&
    !(
      ((kind === "projects" &&
        client.scopes.includes("home3d.project.replace")) ||
        (kind === "tabs" && client.scopes.includes("nodered.trusted"))) &&
      client.resources[kind]?.includes("*")
    )
  )
    throw fail("RESOURCE_DENIED", "资源不在授权范围");
}
export function clean(value, depth = 0) {
  if (depth > 24) return "[depth limit]";
  if (Array.isArray(value))
    return value.slice(0, 500).map((v) => clean(v, depth + 1));
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value)
        .filter(
          ([k]) =>
            !/(token|password|secret|credential|authorization|cookie|private.?key|dataurl|access.?key|api.?key|bearer)/i.test(
              k,
            ),
        )
        .map(([k, v]) => [k, clean(v, depth + 1)]),
    );
  if (typeof value === "string") {
    if (
      /(?:(?:Bearer|Basic)\s+|(?:access_token|api_key|password|secret)\s*[:=]|eyJ[A-Za-z0-9_-]+\.)/i.test(
        value,
      )
    )
      return "[redacted]";
    return value.slice(0, 512000);
  }
  return value;
}
export class McpStore {
  static async create(directory, projectIds = []) {
    await mkdir(directory, { recursive: true, mode: 0o700 });
    const store = new McpStore(directory);
    try {
      store.key = await readFile(path.join(directory, "master.key"));
    } catch (e) {
      if (e.code !== "ENOENT") throw e;
      store.key = randomBytes(32);
      await writeFile(path.join(directory, "master.key"), store.key, {
        mode: 0o600,
        flag: "wx",
      });
    }
    try {
      store.state = JSON.parse(await readFile(store.file, "utf8"));
    } catch (e) {
      if (e.code !== "ENOENT") throw e;
      const admin = randomBytes(32).toString("base64url"),
        token = randomBytes(32).toString("base64url");
      store.state = {
        version: 1,
        enabled: true,
        adminHash: hash(admin),
        clients: [
          {
            id: randomUUID(),
            name: "本机只读客户端",
            digest: hash(token),
            scopes: ["home3d.project.read", "home3d.catalog.read"],
            resources: { projects: projectIds, entities: [], tabs: [] },
            expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
            revoked: false,
          },
        ],
        connections: { ha: { enabled: false }, nodered: { enabled: false } },
        plans: [],
      };
      await store.persist();
      await writeFile(
        path.join(directory, "bootstrap.json"),
        JSON.stringify(
          {
            adminKey: admin,
            clientToken: token,
            endpoint: "http://localhost:8102/mcp",
          },
          null,
          2,
        ),
        { mode: 0o600, flag: "wx" },
      );
    }
    await store.recover();
    return store;
  }
  constructor(directory) {
    this.dir = directory;
    this.file = path.join(directory, "state.json");
    this.queue = Promise.resolve();
  }
  async recover() {
    let changed = false;
    for (const p of this.state.plans) {
      if (p.status === "applying") {
        p.status = "unknown";
        p.error = "RESULT_UNKNOWN";
        changed = true;
      }
    }
    if (changed) await this.persist();
  }
  serial(task) {
    const run = this.queue.catch(() => {}).then(task);
    this.queue = run;
    return run;
  }
  async persist() {
    await writeFile(this.file + ".tmp", JSON.stringify(this.state, null, 2), {
      mode: 0o600,
    });
    await rename(this.file + ".tmp", this.file);
  }
  async audit(event) {
    await writeFile(
      path.join(this.dir, "audit.jsonl"),
      JSON.stringify({ time: new Date().toISOString(), ...event }) + "\n",
      { flag: "a", mode: 0o600 },
    );
  }
  encrypt(value) {
    const iv = randomBytes(12),
      cipher = createCipheriv("aes-256-gcm", this.key, iv);
    const data = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
    return {
      iv: iv.toString("base64"),
      tag: cipher.getAuthTag().toString("base64"),
      data: data.toString("base64"),
    };
  }
  decrypt(value) {
    if (!value) return "";
    const cipher = createDecipheriv(
      "aes-256-gcm",
      this.key,
      Buffer.from(value.iv, "base64"),
    );
    cipher.setAuthTag(Buffer.from(value.tag, "base64"));
    return Buffer.concat([
      cipher.update(Buffer.from(value.data, "base64")),
      cipher.final(),
    ]).toString("utf8");
  }
  principal(token) {
    const found = this.state.clients.find(
      (c) =>
        !c.revoked &&
        Date.parse(c.expiresAt) > Date.now() &&
        equalSecret(token, c.digest),
    );
    return found && this.sharedAccess
      ? this.state.clients.find((c) => c.id === "shared-agents")
      : found;
  }
  async enableSharedAccess() {
    this.sharedAccess = true;
    let shared = this.state.clients.find((c) => c.id === "shared-agents");
    if (shared) return;
    shared = {
      id: "shared-agents",
      name: "所有 Agent 共用权限",
      scopes: [...SCOPES],
      resources: {
        projects: ["*"],
        tabs: ["*"],
        entities: [
          ...new Set(
            this.state.clients
              .filter((c) => !c.revoked && Date.parse(c.expiresAt) > Date.now())
              .flatMap((c) => c.resources.entities),
          ),
        ],
      },
      expiresAt: "9999-12-31T23:59:59.000Z",
      revoked: false,
      revision: 0,
      digest: hash(randomBytes(32).toString("base64url")),
    };
    this.state.clients.push(shared);
    for (const p of this.state.plans) {
      p.clientId = shared.id;
      if (p.status === "draft") delete p.approval;
    }
    await this.persist();
    await this.audit({ kind: "permissions.shared.enabled" });
  }
  async createClient(input) {
    return this.serial(async () => {
      const token = randomBytes(32).toString("base64url");
      const client = {
        id: randomUUID(),
        name: input.name,
        scopes: input.scopes,
        resources: input.resources,
        expiresAt: input.expiresAt,
        revoked: false,
        revision: 0,
        digest: hash(token),
      };
      this.state.clients.push(client);
      await this.persist();
      await this.audit({ kind: "client.created", clientId: client.id });
      return { client: this.publicClient(client), token };
    });
  }
  async updateClient(id, input, expectedRevision) {
    return this.serial(async () => {
      const c = this.state.clients.find((c) => c.id === id);
      if (!c) throw fail("RESOURCE_DENIED", "Agent不存在", 404);
      if (c.revoked)
        throw fail("CLIENT_REVOKED", "已撤销的Agent不能重新启用，请新建", 409);
      if ((c.revision ?? 0) !== expectedRevision)
        throw fail(
          "REVISION_CONFLICT",
          "Agent权限已被其它页面修改，请重新选择后编辑",
          409,
        );
      await this.audit({ kind: "client.update.requested", clientId: id });
      const before = structuredClone(c),
        approvals = this.state.plans
          .filter((p) => p.clientId === id && p.status === "draft")
          .map((p) => [p, p.approval]);
      Object.assign(c, {
        name: input.name,
        scopes: structuredClone(input.scopes),
        resources: structuredClone(input.resources),
        expiresAt: input.expiresAt,
        revision: (c.revision ?? 0) + 1,
      });
      for (const [p] of approvals) delete p.approval;
      try {
        await this.persist();
      } catch (e) {
        Object.assign(c, before);
        if (before.revision === undefined) delete c.revision;
        for (const [p, approval] of approvals)
          if (approval) p.approval = approval;
        throw e;
      }
      await this.audit({
        kind: "client.updated",
        clientId: id,
        revision: c.revision,
      });
      return this.publicClient(c);
    });
  }
  publicClient(c) {
    const { digest, ...result } = c;
    return { ...result, revision: c.revision ?? 0 };
  }
  plan(id, client) {
    const p = this.state.plans.find((p) => p.id === id);
    if (!p || p.clientId !== client.id)
      throw fail("RESOURCE_DENIED", "找不到允许读取的计划");
    return p;
  }
  async addPlan(client, kind, payload, base, scope, resource) {
    return this.serial(async () => {
      allow(client, scope, resource.kind, resource.id);
      if (
        this.state.plans.filter((p) => p.clientId === client.id).length >= 200
      )
        throw fail("BUDGET_EXCEEDED", "每客户端最多保存200个计划");
      const p = {
        id: randomUUID(),
        clientId: client.id,
        kind,
        payload,
        base,
        scope,
        resource,
        hash: hash({ kind, payload, base }),
        status: "draft",
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      };
      this.state.plans.push(p);
      await this.persist();
      await this.audit({
        kind: "plan.created",
        clientId: client.id,
        planId: p.id,
        operation: kind,
      });
      return p;
    });
  }
  async approve(id) {
    return this.serial(async () => {
      const p = this.state.plans.find((p) => p.id === id);
      if (!p || p.status !== "draft" || Date.parse(p.expiresAt) <= Date.now())
        throw fail("INVALID_PLAN", "计划不存在、已执行或已过期");
      p.approval = {
        hash: p.hash,
        expiresAt: new Date(Date.now() + 10 * 60000).toISOString(),
        source: "local-admin",
      };
      await this.persist();
      await this.audit({ kind: "plan.approved", planId: id });
    });
  }
  publicPlan(p) {
    return {
      id: p.id,
      clientId: p.clientId,
      kind: p.kind,
      scope: p.scope,
      resource: p.resource,
      base: p.base,
      hash: p.hash,
      status: p.status,
      createdAt: p.createdAt,
      expiresAt: p.expiresAt,
      approved:
        !!p.approval &&
        p.approval.hash === p.hash &&
        Date.parse(p.approval.expiresAt) > Date.now(),
      error: p.error,
      result: clean(p.result),
      preview: clean(
        Object.fromEntries(
          Object.entries(p.payload).filter(([k]) => k !== "proposed"),
        ),
      ),
    };
  }
}
