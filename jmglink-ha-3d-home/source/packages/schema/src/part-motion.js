import {normalizeMotionLogic,normalizeMotionShader} from './motion-code.js';
// Code is stored as data and runs only in the isolated browser worker.
export const MOTION_EFFECTS = {
  translate: "位移",
  rotate: "角度",
  spin: "持续旋转",
  scale: "缩放",
  visible: "显隐",
  color: "颜色",
  emissive: "发光",
  flow: "路径流光",
  scan: "表面扫光",
};
export const MOTION_OPERATORS = {
  eq: "等于",
  neq: "不等于",
  gt: "大于",
  gte: "大于等于",
  lt: "小于",
  lte: "小于等于",
  between: "区间内",
};
const number = (v, d, min, max) => {
  if (v === undefined) return d;
  const n = Number(v);
  if (!Number.isFinite(n) || n < min || n > max)
    throw Error("动效数值超出范围");
  return n;
};
const text = (v, max = 160) => String(v ?? "").slice(0, max);
export function normalizePartMotionRules(value) {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 32)
    throw Error("部件动效最多 32 条规则");
  const ids = new Set();
  return value.map((r, index) => {
    if (!r || typeof r !== "object") throw Error("动效规则格式无效");
    const id = text(r.id || `motion-${index}`, 80);
    if (ids.has(id)) throw Error("部件动效规则 ID 重复");
    ids.add(id);
    if (
      !Array.isArray(r.targets) ||
      r.targets.length < 1 ||
      r.targets.length > 20 ||
      r.targets.some(
        (p) =>
          typeof p !== "string" ||
          p.length > 1024 ||
          !/^root(?:\/[0-9]+)*$/.test(p),
      )
    )
      throw Error("请选择有效模型部件");
    const c = r.condition ?? {},
      e = r.effect ?? {},
      m = r.mapping ?? {};
    if (
      !Object.hasOwn(MOTION_EFFECTS, e.type) ||
      !Object.hasOwn(MOTION_OPERATORS, c.operator ?? "eq")
    )
      throw Error("不支持的动效或条件");
    if (e.path !== undefined && (!Array.isArray(e.path) || e.path.length > 32))
      throw Error("流光路径最多 32 个点");
    const vector = (v, d) =>
      [0, 1, 2].map((i) => number(v?.[i], d, -10000, 10000));
    const path = (e.path ?? []).map((p) => {
      if (!Array.isArray(p) || p.length !== 3)
        throw Error("路径点需要 XYZ 坐标");
      return vector(p, 0);
    });
    if (e.type === "flow" && path.length < 2)
      throw Error("流光路径至少需要两个点");
    if (
      e.type === "flow" &&
      path.length > 1 &&
      !path.some((p) => p.some((v, i) => Math.abs(v - path[0][i]) > 1e-6))
    )
      throw Error("流光路径点不能全部重合");
    const inputMin = number(m.inputMin, 0, -1e9, 1e9),
      inputMax = number(m.inputMax, 100, -1e9, 1e9);
    if (m.enabled && inputMax <= inputMin) throw Error("映射上限必须大于下限");
    if (e.color !== undefined && !/^#[0-9a-f]{6}$/i.test(e.color))
      throw Error("动效颜色无效");
    return {
      id,
      name: text(r.name || "新部件动效", 80),
      enabled: r.enabled !== false,
      targets: [...new Set(r.targets)],
      capabilityId: text(r.capabilityId, 80),
      ...(typeof r.motionResourceId === 'string' && /^(?:builtin|custom)\.motion\.[a-z0-9][a-z0-9._-]{0,100}$/.test(r.motionResourceId) ? {motionResourceId:r.motionResourceId} : {}),
      targetNames: Object.fromEntries(
        r.targets
          .filter((p) => typeof r.targetNames?.[p] === "string")
          .map((p) => [p, text(r.targetNames[p], 160)]),
      ),
      condition: {
        operator: c.operator ?? "eq",
        value: text(c.value),
        max: text(c.max),
      },
      mapping: { enabled: m.enabled === true, inputMin, inputMax },
      effect: {
        type: e.type,
        axis: ["x", "y", "z"].includes(e.axis) ? e.axis : "y",
        from: number(e.from, e.type === "scale" ? 1 : 0, -10000, 10000),
        to: number(e.to, e.type === "scale" ? 1.5 : 1, -10000, 10000),
        pivot: vector(e.pivot, 0),
        color: e.color ?? "#ff8a32",
        intensity: number(e.intensity, 1.8, 0, 20),
        speed: number(e.speed, 1, -20, 20),
        width: number(e.width, 0.2, 0.02, 1),
        mode: ["steady", "breathe", "blink"].includes(e.mode)
          ? e.mode
          : "steady",
        path,
        ...(e.program!==undefined?{program:normalizeMotionLogic(e.program)}:{}),
        ...(e.shader!==undefined?{shader:normalizeMotionShader(e.shader,e.type)}:{}),
      },
      transitionMs: number(r.transitionMs, 300, 0, 10000),
      priority: number(r.priority, 0, 0, 100),
      endBehavior: r.endBehavior === "hold" ? "hold" : "restore",
    };
  });
}
export function partMotionIssues(rules, capabilities = [], parts) {
  const issues = [];
  for (const r of rules ?? []) {
    const cap = capabilities.find((c) => c.capabilityId === r.capabilityId);
    if(r.effect.type==="scale"&&(r.effect.from<=0||r.effect.to<=0))issues.push(`${r.name}：缩放值必须大于零`);
    if(r.mapping.enabled&&r.effect.type==="emissive"&&(r.effect.from<0||r.effect.to<0||r.effect.from>20||r.effect.to>20))issues.push(`${r.name}：映射发光强度范围为 0–20`);
    if (!cap) issues.push(`${r.name}：引用能力不存在`);
    if (r.mapping?.enabled && cap?.dataType !== "number")
      issues.push(`${r.name}：数值映射必须引用数值能力`);
    if (
      ["gt", "gte", "lt", "lte", "between"].includes(r.condition?.operator) &&
      (!Number.isFinite(Number(r.condition.value)) ||
        r.condition.value === "" ||
        (r.condition.operator === "between" &&
          (r.condition.max === "" || !Number.isFinite(Number(r.condition.max)) ||
            Number(r.condition.max) < Number(r.condition.value))))
    )
      issues.push(`${r.name}：条件数值或区间无效`);
    if (
      cap?.kind === "enum" &&
      ["eq", "neq"].includes(r.condition?.operator) &&
      cap.enumValues?.length &&
      !cap.enumValues.some(
        (e) => e.status !== "missing" && String(e.value) === r.condition.value,
      )
    )
      issues.push(`${r.name}：状态值已不存在`);
    if (parts && r.targets.some((p) => !parts.some((n) => n.path === p)))
      issues.push(`${r.name}：模型部件已丢失，请重新绑定`);
  }
  for (const r of rules ?? []) {
    if (
      r.targets.some((p, i) =>
        r.targets.some((q, j) => i !== j && p.startsWith(q + "/")),
      )
    )
      issues.push(`${r.name}：不要同时选择父部件和其子部件`);
    if (
      parts &&
      r.targets.some(
        (p) =>
          r.targetNames?.[p] &&
          parts.find((n) => n.path === p)?.name !== r.targetNames[p],
      )
    )
      issues.push(`${r.name}：部件身份已变化，请重新选择`);
  }
  return issues;
}
export function motionMatch(rule, value) {
  if (
    !rule.enabled ||
    value === undefined ||
    value === null ||
    ["unknown", "unavailable", ""].includes(String(value))
  )
    return false;
  const { operator, value: expected, max } = rule.condition;
  if (operator === "eq") return String(value) === expected;
  if (operator === "neq") return String(value) !== expected;
  const n = Number(value),
    a = Number(expected),
    b = Number(max);
  if (!Number.isFinite(n)) return false;
  return (
    {
      gt: n > a,
      gte: n >= a,
      lt: n < a,
      lte: n <= a,
      between: n >= a && n <= b,
    }[operator] ?? false
  );
}
export function motionCapabilityValues(entity) {
  const result = Object.create(null),
    entities = entity?.deviceEntities ?? [];
  const mappings = entity?.deviceCapabilityMappings ?? {},
    bindings = entity?.deviceCapabilityBindings ?? {};
  for (const id of new Set([
    ...Object.keys(bindings),
    ...Object.keys(mappings),
  ])) {
    const mapping = mappings[id];
    const source = entities.find(
      (e) => e.entityId === (mapping?.entityId ?? bindings[id]?.[0]),
    );
    const attribute = mapping?.attribute ?? "state";
    if (attribute === "state") result[id] = source?.state;
    else if (!["__proto__", "prototype", "constructor"].includes(attribute))
      result[id] = source?.attributes?.[attribute];
  }
  return result;
}
