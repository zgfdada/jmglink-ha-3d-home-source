import { fail, clean, allow, hash } from "./store.js";
const entityPattern = /^[a-z0-9_]+\.[a-z0-9_]+$/;
export function staticLightAction(client, action) {
  if (
    !action ||
    !["light.turn_on", "light.turn_off", "light.toggle"].includes(
      action.service,
    )
  )
    throw fail("RESOURCE_DENIED", "第一版只允许指定灯具的开关及亮度／色温动作");
  if (
    !entityPattern.test(action.entityId) ||
    !action.entityId.startsWith("light.")
  )
    throw fail("RESOURCE_DENIED", "只允许明确的 light 实体");
  allow(client, "ha.service.call", "entities", action.entityId);
  const data = action.data ?? {};
  for (const k of Object.keys(data))
    if (!["brightness", "color_temp_kelvin"].includes(k))
      throw fail("VALIDATION_FAILED", "不支持该动作参数", 422);
  if (
    data.brightness !== undefined &&
    (!Number.isInteger(data.brightness) ||
      data.brightness < 0 ||
      data.brightness > 255)
  )
    throw fail("VALIDATION_FAILED", "亮度范围0–255", 422);
  if (
    data.color_temp_kelvin !== undefined &&
    (!Number.isInteger(data.color_temp_kelvin) ||
      data.color_temp_kelvin < 1000 ||
      data.color_temp_kelvin > 12000)
  )
    throw fail("VALIDATION_FAILED", "色温范围1000–12000K", 422);
  return action;
}
export class HaAdapter {
  constructor(store, ha, fetcher = fetch) {
    this.store = store;
    this.ha = ha;
    this.fetcher = fetcher;
  }
  enabled() {
    if (!this.store.state.connections.ha.enabled || !this.ha.config.ha.token)
      throw fail("UNSUPPORTED_CAPABILITY", "请由管理员启用复用HA连接", 409);
  }
  async request(suffix, method = "GET", body) {
    this.enabled();
    let r;
    try {
      r = await this.fetcher(
        this.ha.config.ha.restUrl.replace(/\/$/, "") + suffix,
        {
          method,
          headers: {
            Authorization: "Bearer " + this.ha.config.ha.token,
            "Content-Type": "application/json",
          },
          redirect: "error",
          signal: AbortSignal.timeout(15000),
          ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        },
      );
    } catch {
      throw fail(
        method === "GET" ? "UPSTREAM_UNAVAILABLE" : "RESULT_UNKNOWN",
        "HA请求未得到确定结果",
        502,
      );
    }
    if (!r.ok)
      throw fail(
        r.status >= 500 && method !== "GET"
          ? "RESULT_UNKNOWN"
          : r.status === 401 || r.status === 403
            ? "UPSTREAM_PERMISSION_DENIED"
            : "UPSTREAM_UNAVAILABLE",
        `HA接口返回${r.status}`,
        502,
      );
    const text = await r.text();
    if (text.length > 2 * 1024 * 1024)
      throw fail("BUDGET_EXCEEDED", "HA响应过大", 502);
    return text ? JSON.parse(text) : null;
  }
  entities(client) {
    this.enabled();
    return this.ha
      .getEntities()
      .filter((e) => client.resources.entities.includes("*") || client.resources.entities.includes(e.entityId))
      .map((e) => ({
        entityId: e.entityId,
        name: e.name,
        domain: e.domain,
        state: e.state,
        available: e.available,
      }))
      .map((e) => clean(e));
  }
  async services(client) {
    allow(client, "ha.state.read");
    const all = await this.request("/services");
    return all
      .filter((x) => x.domain === "light")
      .map((x) => ({
        domain: x.domain,
        services: Object.keys(x.services).filter((s) =>
          ["turn_on", "turn_off", "toggle"].includes(s),
        ),
      }));
  }
  async helperList() {
    this.enabled();
    if (!this.ha.websocketReady)
      throw fail("UPSTREAM_UNAVAILABLE", "HA WebSocket未就绪", 502);
    try {
      return await this.ha.sendCommand(this.ha.socket, "input_boolean/list");
    } catch {
      throw fail(
        "UNSUPPORTED_CAPABILITY",
        "当前HA连接不支持input_boolean管理或无权限",
        409,
      );
    }
  }
  async helperCreate(payload) {
    this.enabled();
    if (!this.ha.websocketReady)
      throw fail("UPSTREAM_UNAVAILABLE", "HA WebSocket未就绪", 502);
    try {
      return await this.ha.sendCommand(
        this.ha.socket,
        "input_boolean/create",
        payload,
      );
    } catch {
      throw fail(
        "RESULT_UNKNOWN",
        "辅助实体创建未得到确定结果，请先人工核查，禁止直接重试",
        502,
      );
    }
  }
  async action(client, payload) {
    staticLightAction(client, payload);
    return this.request(
      "/services/" + payload.service.replace(".", "/"),
      "POST",
      { ...payload.data, entity_id: payload.entityId },
    );
  }
}
export function validateNrTab(client, nodes, tabId, current) {
  if (
    !Array.isArray(nodes) ||
    nodes.length > 100 ||
    !nodes.some((n) => n.id === tabId && n.type === "tab")
  )
    throw fail("VALIDATION_FAILED", "最多100节点且须包含目标tab", 422);
  const trusted = client.scopes.includes("nodered.trusted");
  if (trusted) {
    const ids = new Set();
    for (const n of nodes) {
      if (!n || typeof n.id !== "string" || ids.has(n.id) || !n.type)
        throw fail("VALIDATION_FAILED", "节点ID重复或类型缺失", 422);
      ids.add(n.id);
      if (
        n.type === "tab"
          ? n.id !== tabId
          : n.z !== tabId && (n.z || n.type.startsWith("subflow:"))
      )
        throw fail(
          "RESOURCE_DENIED",
          "可信模式仍只替换授权tab及其明确引用的现有配置节点",
        );
      if (
        Object.keys(n).some((k) => /credential|password|token|secret/i.test(k))
      )
        throw fail(
          "RESOURCE_DENIED",
          "凭据由本地管理界面设置，不通过MCP读取或写入",
        );
    }
    return nodes;
  }
  const ids = new Set();
  const types = new Set([
    "tab",
    "comment",
    "inject",
    "change",
    "switch",
    "delay",
    "range",
    "junction",
    "api-call-service",
  ]);
  for (const n of nodes) {
    if (
      !n ||
      typeof n.id !== "string" ||
      ids.has(n.id) ||
      !types.has(n.type) ||
      n.id.length > 128
    )
      throw fail("RESOURCE_DENIED", "节点ID或类型被拒绝");
    ids.add(n.id);
    if (n.type === "tab" ? n.id !== tabId : n.z !== tabId)
      throw fail("RESOURCE_DENIED", "禁止跨tab写入");
    if (
      n.type === "tab" &&
      Object.keys(n).some(
        (k) => !["id", "type", "label", "disabled", "info"].includes(k),
      )
    )
      throw fail("RESOURCE_DENIED", "tab不允许环境／依赖配置");
    if (
      Object.keys(n).some((k) =>
        /credential|password|token|secret|env|func|initialize|finalize/i.test(
          k,
        ),
      ) ||
      /\$\{|\{\{|\$env\b/.test(JSON.stringify(n))
    )
      throw fail("RESOURCE_DENIED", "拒绝秘密、环境引用或动态表达式");
    if (/"(?:jsonata|global|flow|env)"/.test(JSON.stringify(n)))
      throw fail("RESOURCE_DENIED", "受限模式拒绝表达式和上下文访问");
    if (
      n.type === "change" &&
      (n.rules ?? []).some(
        (r) =>
          r.t !== "set" ||
          r.pt !== "msg" ||
          !["str", "num", "bool", "json"].includes(r.tot) ||
          !["payload", "topic"].includes(r.p),
      )
    )
      throw fail("RESOURCE_DENIED", "change只允许写入静态payload或topic");
    if (
      n.type === "switch" &&
      (n.propertyType !== "msg" ||
        !["payload", "topic"].includes(n.property) ||
        (n.rules ?? []).some(
          (r) =>
            ![
              "eq",
              "neq",
              "lt",
              "lte",
              "gt",
              "gte",
              "else",
              "true",
              "false",
            ].includes(r.t) ||
            (r.vt && !["str", "num", "bool"].includes(r.vt)),
        ))
    )
      throw fail("RESOURCE_DENIED", "switch仅允许静态比较");
    if (
      n.type === "inject" &&
      ((n.props ?? []).some(
        (p) =>
          !["payload", "topic"].includes(p.p) ||
          (p.vt && !["str", "num", "bool", "json", "date"].includes(p.vt)),
      ) ||
        (n.payloadType &&
          !["str", "num", "bool", "json", "date"].includes(n.payloadType)))
    )
      throw fail("RESOURCE_DENIED", "inject仅允许静态消息");
    if (
      n.type === "delay" &&
      n.pauseType &&
      !["delay", "rate"].includes(n.pauseType)
    )
      throw fail("RESOURCE_DENIED", "不支持动态延迟");
    if (n.type === "api-call-service") {
      const raw = n.action || `${n.domain}.${n.service}`;
      const targets = Array.isArray(n.entityId) ? n.entityId : [n.entityId];
      if (
        !targets.length ||
        targets.length > 20 ||
        n.areaId?.length ||
        n.deviceId?.length ||
        n.floorId?.length ||
        n.labelId?.length ||
        (n.dataType && n.dataType !== "json")
      )
        throw fail("RESOURCE_DENIED", "HA节点必须使用静态实体目标");
      let data;
      try {
        data =
          typeof n.data === "string"
            ? JSON.parse(n.data || "{}")
            : n.data || {};
      } catch {
        throw fail("VALIDATION_FAILED", "HA节点data须为JSON", 422);
      }
      for (const entityId of targets)
        staticLightAction(client, { service: raw, entityId, data });
      if (!current.some((c) => c.id === n.server && c.type === "server"))
        throw fail("RESOURCE_DENIED", "只允许引用现有HA连接配置");
      if (n.blockInputOverrides !== true)
        throw fail("RESOURCE_DENIED", "HA节点须禁止输入覆盖目标与动作");
    }
  }
  const outside = new Set(
    current.filter((n) => n.id !== tabId && n.z !== tabId).map((n) => n.id),
  );
  for (const n of nodes) {
    if (outside.has(n.id))
      throw fail("RESOURCE_DENIED", "ID与其它流程或配置节点冲突");
    for (const target of (n.wires ?? []).flat())
      if (!ids.has(target))
        throw fail("RESOURCE_DENIED", "禁止连线到范围外节点");
  }
  const old = current.filter((n) => n.id === tabId || n.z === tabId);
  if (old.some((n) => !types.has(n.type)))
    throw fail(
      "RESOURCE_DENIED",
      "目标tab含不透明代码或自定义节点，请人工处理",
    );
  if (
    current.some(
      (n) =>
        outside.has(n.id) &&
        (n.wires ?? []).flat().some((id) => old.some((o) => o.id === id)),
    )
  )
    throw fail("RESOURCE_DENIED", "目标tab存在范围外输入连线");
  return nodes;
}
export class NodeRedAdapter {
  constructor(store, fetcher = fetch) {
    this.store = store;
    this.fetcher = fetcher;
  }
  async request(suffix, method = "GET", body) {
    const c = this.store.state.connections.nodered;
    if (!c.enabled || !c.url || !c.secret)
      throw fail("UNSUPPORTED_CAPABILITY", "Node-RED未配置", 409);
    let r;
    try {
      r = await this.fetcher(c.url + suffix, {
        method,
        redirect: "error",
        signal: AbortSignal.timeout(15000),
        headers: {
          Authorization:
            c.authMode === "basic"
              ? "Basic " +
                Buffer.from(this.store.decrypt(c.secret), "utf8").toString(
                  "base64",
                )
              : "Bearer " + this.store.decrypt(c.secret),
          "Content-Type": "application/json",
          "Node-RED-API-Version": "v2",
          ...(method === "POST" ? { "Node-RED-Deployment-Type": "flows" } : {}),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
    } catch {
      throw fail(
        method === "GET" ? "UPSTREAM_UNAVAILABLE" : "RESULT_UNKNOWN",
        "Node-RED未返回确定结果",
        502,
      );
    }
    if (r.status === 409)
      throw fail("REVISION_CONFLICT", "Node-RED流程已修改", 409);
    if (!r.ok)
      throw fail(
        r.status >= 500 && method !== "GET"
          ? "RESULT_UNKNOWN"
          : "UPSTREAM_PERMISSION_DENIED",
        `Node-RED接口返回${r.status}`,
        502,
      );
    const text = await r.text();
    if (text.length > 2 * 1024 * 1024)
      throw fail("BUDGET_EXCEEDED", "Node-RED响应过大");
    return text ? JSON.parse(text) : null;
  }
  async flows() {
    const result = await this.request("/flows");
    if (
      !result ||
      typeof result.rev !== "string" ||
      !Array.isArray(result.flows)
    )
      throw fail(
        "UNSUPPORTED_CAPABILITY",
        "需要Node-RED Admin API v2与rev",
        409,
      );
    return result;
  }
  async read(client, tabId) {
    allow(client, "nodered.flow.read", "tabs", tabId);
    const { rev, flows } = await this.flows();
    if (tabId === "*") return { rev, nodes: clean(flows.filter(n => n.type === "tab")) };
    const selected = flows.filter((n) => n.id === tabId || n.z === tabId);
    const nodes = client.scopes.includes("nodered.trusted")
      ? selected
      : selected.map((n) =>
          ["function", "exec"].includes(n.type)
            ? {
                id: n.id,
                type: n.type,
                z: n.z,
                name: n.name,
                code: "[需要可信代码权限]",
              }
            : n,
        );
    return { rev, nodes: clean(nodes) };
  }
  async apply(client, p) {
    const current = await this.flows();
    if (current.rev !== p.base)
      throw fail("REVISION_CONFLICT", "流程版本已变化", 409);
    validateNrTab(client, p.payload.nodes, p.payload.tabId, current.flows);
    const replaced = new Set(p.payload.nodes.map((n) => n.id));
    const flows = [
      ...current.flows.filter(
        (n) =>
          n.id !== p.payload.tabId &&
          n.z !== p.payload.tabId &&
          !replaced.has(n.id),
      ),
      ...p.payload.nodes,
    ];
    const response = await this.request("/flows", "POST", {
      rev: p.base,
      flows,
    });
    return { rev: response?.rev, status: "deployed" };
  }
}
