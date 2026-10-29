import { enumValueLabel } from "../../../../../packages/schema/src/device-value-labels.js";
import { deviceCapabilityEntities } from "../../../../../packages/schema/src/associated-entities.js";

export const MAPPED_CAPABILITY_STATUSES = [
  "bound",
  "offline",
  "historical",
  "unavailable",
  "pending",
];

export const CAPABILITY_GROUPS = [
  { id: "core", label: "核心控制" },
  { id: "status", label: "状态信息" },
  { id: "advanced", label: "高级能力" },
];

export const CAPABILITY_KINDS = [
  { id: "status", label: "状态" },
  { id: "toggle", label: "开关" },
  { id: "number", label: "数值" },
  { id: "enum", label: "枚举" },
  { id: "action", label: "动作" },
  { id: "text", label: "文本" },
  { id: "image", label: "图像" },
  { id: "media", label: "媒体" },
];

export const CONTROL_LABELS = {
  status: "状态显示",
  toggle: "开关控件",
  slider: "滑块",
  number: "数值输入",
  select: "下拉选择",
  button: "按钮",
  progress: "进度显示",
  text: "文本",
  image: "图像",
};

export function capabilityGroup(capability) {
  if (CAPABILITY_GROUPS.some((group) => group.id === capability.group))
    return capability.group;
  return ["toggle", "enum", "action"].includes(capability.kind)
    ? "core"
    : "status";
}

export function capabilityMapping(binding, capabilityId) {
  const explicit = binding?.capabilityMappings?.[capabilityId];
  if (explicit?.entityId) return explicit;
  const entityId = binding?.capabilityBindings?.[capabilityId]?.[0];
  return entityId ? { entityId, attribute: "state" } : null;
}

export function syncEnumValues(current, options, context) {
  const received = [
    ...new Set(
      (Array.isArray(options) ? options : [])
        .filter((item) => typeof item === "string" && item.trim())
        .map((item) => item.trim()),
    ),
  ];
  const present = new Set(received);
  const existing = Array.isArray(current) ? current : [];
  const byValue = new Map(existing.map((item) => [item.value, item]));
  const labeled = (item) => {
    const label = enumValueLabel(item, context);
    const custom =
      item.labelSource === "custom" ||
      (!item.labelSource && item.label && item.label !== item.value);
    return {
      label,
      labelSource: custom
        ? "custom"
        : context?.stateLabels?.[item.value]
          ? "ha"
          : label === item.value
            ? "raw"
            : "fallback",
    };
  };
  return [
    ...existing.map((item) =>
      item.source === "ha"
        ? {
            ...item,
            ...labeled(item),
            status: present.has(item.value) ? "valid" : "missing",
          }
        : { ...item, status: "valid" },
    ),
    ...received
      .filter((value) => !byValue.has(value))
      .map((value) => ({
        ...labeled({ value }),
        value,
        source: "ha",
        status: "new",
      })),
  ];
}

export function inferredDataType(entity, attribute = "state") {
  if (!entity) return null;
  if (attribute === "state") {
    if (["binary_sensor", "switch", "input_boolean"].includes(entity.domain))
      return "boolean";
    if (entity.domain === "number") return "number";
    if (entity.domain === "select") return "enum";
    if (
      entity.domain === "sensor" &&
      entity.state !== "" &&
      Number.isFinite(Number(entity.state))
    )
      return "number";
  }
  const value =
    attribute === "state" ? entity.state : entity.attributes?.[attribute];
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number") return "number";
  return "string";
}

export function mappingStatus(capability, mapping, device, haStatus) {
  if (!mapping?.entityId) return { id: "empty", label: "未绑定" };
  if (haStatus?.connected === false) return { id: "offline", label: "HA 离线" };
  const entity = deviceCapabilityEntities(device).find(
    (item) => item.entityId === mapping.entityId,
  );
  if (!entity) return { id: "missing", label: "映射失效" };
  if (entity.historical)
    return { id: "historical", label: "已绑定 · 历史记录" };
  if (entity.state === "unavailable")
    return { id: "unavailable", label: "已绑定 · 实体不可用" };
  if (
    mapping.attribute !== "state" &&
    !(mapping.attribute in (entity.attributes ?? {}))
  )
    return { id: "missing", label: "属性已不存在" };
  if ((mapping.attribute ?? "state") === "state" && entity.state === "unknown")
    return { id: "pending", label: "已绑定 · 状态未知" };
  const actual = inferredDataType(entity, mapping.attribute);
  if (
    actual &&
    actual !== capability.dataType &&
    !(capability.dataType === "enum" && actual === "string")
  )
    return { id: "mismatch", label: "类型不匹配" };
  return { id: "bound", label: "已绑定" };
}

export function unboundCapabilities(capabilities, mappings) {
  return (capabilities ?? []).filter(
    (capability) => !mappings?.[capability.capabilityId]?.entityId,
  );
}

export function unusedBoundEntities(entities, mappings) {
  const mapped = new Set(
    Object.values(mappings ?? {})
      .map((mapping) => mapping?.entityId)
      .filter(Boolean),
  );
  return (entities ?? []).filter((entity) => !mapped.has(entity.entityId));
}

export function selectedDeviceEntities(device, binding) {
  const selectedIds = Array.isArray(binding?.selectedEntityIds)
    ? binding.selectedEntityIds
    : Object.values(binding?.capabilityBindings ?? {}).flat();
  const allowedIds = new Set([...selectedIds,...(binding?.extraEntityIds ?? [])]);
  return deviceCapabilityEntities(device).filter((entity) =>
    allowedIds.has(entity.entityId),
  );
}

export function capabilityFromEntity(entity, capabilities) {
  const base = String(
    entity.entityId?.split(".").slice(1).join("-") || "capability",
  )
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .slice(0, 110);
  const used = new Set((capabilities ?? []).map((item) => item.capabilityId));
  const safeBase =
    base.length >= 2 ? base : nextCapabilityId(capabilities ?? []);
  let capabilityId = safeBase;
  let suffix = 2;
  while (used.has(capabilityId)) capabilityId = `${safeBase}-${suffix++}`;
  const domain = entity.domain;
  const kind = ["switch", "input_boolean", "light"].includes(domain)
    ? "toggle"
    : domain === "select"
      ? "enum"
      : domain === "number"
        ? "number"
        : domain === "button"
          ? "action"
          : "status";
  const dataType =
    kind === "toggle" || kind === "action"
      ? "boolean"
      : kind === "enum"
        ? "enum"
        : kind === "number"
          ? "number"
          : inferredDataType(entity);
  return {
    capabilityId,
    name: entity.name || entity.entityId,
    kind,
    group: ["toggle", "enum", "number", "action"].includes(kind)
      ? "core"
      : "status",
    dataType,
    access:
      kind === "status" ? "read" : kind === "action" ? "action" : "read-write",
    defaultControl:
      { toggle: "toggle", enum: "select", number: "number", action: "button" }[
        kind
      ] ?? "status",
    allowedDomains: domain ? [domain] : [],
    required: false,
    enumValues:
      kind === "enum"
        ? syncEnumValues([], entity.attributes?.options, entity)
        : [],
  };
}

export function capabilityStepState(capabilities, binding, device) {
  if (!capabilities?.length) return "unconfigured";
  const issues = capabilities.filter((item) => {
    const status = mappingStatus(
      item,
      capabilityMapping(binding, item.capabilityId),
      device,
    );
    return (
      status.id === "missing" ||
      status.id === "mismatch" ||
      (item.required && !MAPPED_CAPABILITY_STATUSES.includes(status.id))
    );
  });
  if (issues.length) return "problem";
  return capabilities.some((item) =>
    capabilityMapping(binding, item.capabilityId),
  )
    ? "complete"
    : "in-progress";
}

export function nextCapabilityId(capabilities) {
  let index = 1;
  const used = new Set(capabilities.map((item) => item.capabilityId));
  while (used.has(`capability-${index}`)) index += 1;
  return `capability-${index}`;
}
