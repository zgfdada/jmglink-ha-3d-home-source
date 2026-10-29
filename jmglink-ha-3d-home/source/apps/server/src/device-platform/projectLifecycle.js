import { validateProjectCapabilities } from "./capabilityValidation.js";
import { createHash } from "node:crypto";
import { capabilityValueOptions } from "../../../../packages/schema/src/device-value-labels.js";
import { bindingEntityIds } from "../../../../packages/schema/src/associated-entities.js";

export function projectConfigurationSignature(project, model, panel) {
  const stable = JSON.stringify({ project, model, panel }, (key, value) =>
    ["createdAt", "updatedAt"].includes(key) ? undefined : value,
  );
  return createHash("sha256").update(stable).digest("hex");
}

export function projectContext(platform, ha, id) {
  const project = platform
    .getDeviceTemplates()
    .find((item) => item.id === id && !item.builtin);
  if (!project) throw new Error("自定义设备项目不存在");
  const binding = platform
    .getBindings()
    .find((item) => item.deviceTemplateId === id);
  const device = ha.getDevices().find((item) => item.id === binding?.deviceId);
  const entities = ha
    .getEntities()
    .filter((item) => bindingEntityIds(binding).includes(item.entityId));
  const model = platform
    .getModelTemplates()
    .find((item) => item.id === project.modelTemplateId);
  const panel = platform
    .getControlPanels()
    .find((item) => item.id === project.controlPanelTemplateId);
  return {
    project,
    binding,
    device: device ? { ...device, entities } : null,
    entities,
    model,
    panel,
  };
}

export async function inspectProject(platform, ha, id) {
  const context = projectContext(platform, ha, id);
  const { project, binding, device, entities, model, panel } = context;
  const status = ha.getStatus();
  const checks = [];
  const add = (page, severity, reason) =>
    checks.push({ page, severity, reason });
  if (
    !project.name?.trim() ||
    !project.category?.trim() ||
    !project.manufacturer?.trim() ||
    !project.model?.trim()
  )
    add("基础信息", "warning", "建议补全设备名称、分类、厂商和型号");
  if (!binding) add("HA 设备", "error", "未绑定有效 HA 设备");
  else if (!device)
    add(
      "HA 设备",
      status.connected ? "error" : "warning",
      status.connected
        ? "原绑定 HA 设备已不存在"
        : "HA 离线，暂无法核实原绑定设备",
    );
  if (!project.capabilities?.length) add("能力映射", "error", "尚未配置能力");
  if (!project.runtimeDisplay) add("运行浮窗", "error", "尚未配置运行浮窗");
  else {
    for (const [capabilityId, label] of [
      [project.runtimeDisplay.statusCapabilityId, "运行状态"],
      [project.runtimeDisplay.remainingCapabilityId, "剩余时间"],
    ])
      if (
        capabilityId &&
        !binding?.capabilityMappings?.[capabilityId] &&
        !binding?.capabilityBindings?.[capabilityId]?.length
      )
        add("运行浮窗", "error", `${label}能力尚未映射 HA 实体`);
  }
  if (!project.appearance || !model)
    add("3D 外观", "error", "尚未配置 3D 模型");
  else if (!(await platform.projectModelFileAvailable(id)))
    add("3D 外观", "error", "3D 模型文件不可用");
  if (!panel?.sections?.some((section) => section.controls?.length))
    add("控制面板", "error", "尚未配置控制组件");
  for (const section of panel?.sections ?? [])
    for (const control of section.controls ?? [])
      if (
        control.capabilityId &&
        !binding?.capabilityMappings?.[control.capabilityId] &&
        !binding?.capabilityBindings?.[control.capabilityId]?.length
      )
        add(
          "控制面板",
          "error",
          `控件“${control.label}”引用的能力尚未映射 HA 实体`,
        );
  if (!status.connected || status.mock)
    add("HA 连接", "warning", "HA 未实时连接；可使用模拟模式，真实控制不可用");
  checks.push(
    ...validateProjectCapabilities(
      project,
      binding,
      device,
      platform.getModelTemplates(),
      platform.getControlPanels(),
    ).issues.map((item) =>
      !status.connected && item.reason === "映射实体已不存在"
        ? {
            ...item,
            severity: "warning",
            reason: "HA 离线，暂无法核实映射实体",
          }
        : item,
    ),
  );
  const capabilities = (project.capabilities ?? []).map((capability) => {
    const mapping = binding?.capabilityMappings?.[capability.capabilityId];
    const entity = entities.find((item) => item.entityId === mapping?.entityId);
    const health = capabilityHealth(entity, status.connected && !status.mock);
    return {
      id: capability.capabilityId,
      name: capability.name,
      kind: capability.kind,
      access: capability.access,
      dataType: capability.dataType,
      options: capabilityValueOptions(capability, entity),
      stateLabels: entity?.stateLabels ?? {},
      entityId: entity?.entityId ?? null,
      state: entity
        ? mapping.attribute === "state"
          ? entity.state
          : entity.attributes?.[mapping.attribute]
        : null,
      available: health.available,
      availability: health.availability,
      availabilityLabel: health.label,
    };
  });
  return {
    ...context,
    checks,
    capabilities,
    haConnected: Boolean(status.connected && !status.mock),
    publishBlocked: checks.some((item) => item.severity === "error"),
  };
}

export function capabilityHealth(entity, haConnected) {
  if (!entity)
    return { available: false, availability: "missing", label: "实体缺失" };
  if (!haConnected)
    return { available: false, availability: "ha_offline", label: "HA 未连接" };
  if (entity.historical)
    return { available: false, availability: "historical", label: "历史实体" };
  if (entity.state === "unavailable")
    return {
      available: false,
      availability: "unavailable",
      label: "实体不可用",
    };
  if (entity.state === "unknown")
    return { available: false, availability: "unknown", label: "状态待同步" };
  return { available: true, availability: "available", label: "正常" };
}

export function testAction(context, capabilityId, value) {
  const capability = context.project.capabilities?.find(
    (item) => item.capabilityId === capabilityId,
  );
  if (
    !capability ||
    !["write", "read-write", "action"].includes(capability.access)
  )
    throw new Error("此能力不允许写入");
  const mapping = context.binding?.capabilityMappings?.[capabilityId];
  const entity = context.entities.find(
    (item) => item.entityId === mapping?.entityId,
  );
  if (
    !entity ||
    mapping.attribute !== "state" ||
    entity.historical ||
    ["unavailable", "unknown"].includes(entity.state)
  )
    throw new Error("映射实体不可操作");
  const domain = entity.entityId.split(".")[0];
  if (
    ["switch", "light", "fan", "input_boolean"].includes(domain) &&
    capability.dataType === "boolean" &&
    typeof value === "boolean"
  )
    return { entityId: entity.entityId, type: value ? "turn_on" : "turn_off" };
  if (
    domain === "select" &&
    capability.dataType === "enum" &&
    typeof value === "string" &&
    entity.attributes?.options?.includes(value)
  )
    return { entityId: entity.entityId, type: "select_option", option: value };
  if (
    domain === "number" &&
    capability.dataType === "number" &&
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= (entity.attributes?.min ?? -Infinity) &&
    value <= (entity.attributes?.max ?? Infinity)
  )
    return { entityId: entity.entityId, type: "set_value", value };
  if (domain === "button" && capability.kind === "action")
    return { entityId: entity.entityId, type: "press" };
  throw new Error("能力类型与 HA 实体操作不兼容，已阻止控制");
}

export function nextPatchVersion(version = "0.0.0") {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  return match ? `${match[1]}.${match[2]}.${Number(match[3]) + 1}` : "1.0.0";
}

export function compareVersions(left, right) {
  const a = left.split(".").map(Number),
    b = right.split(".").map(Number);
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] - b[i];
  return 0;
}
