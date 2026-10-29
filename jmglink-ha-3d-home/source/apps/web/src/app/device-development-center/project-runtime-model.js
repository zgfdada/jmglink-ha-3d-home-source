import {partMotionIssues} from "../../../../../packages/schema/src/part-motion.js";
import { deviceCapabilityEntities } from "../../../../../packages/schema/src/associated-entities.js";
import {
  deviceValueLabel,
  enumValueLabel,
} from "../../../../../packages/schema/src/device-value-labels.js";

export const EMPTY_RUNTIME_DISPLAY = {
  statusCapabilityId: "",
  remainingCapabilityId: "",
  runningStates: [],
  endingStates: [],
  titleTemplate: "{device.name}",
  idleTemplate: "待机中",
  runningTemplate: "运行中",
};

export function stateChoices(capability, entity) {
  const values = [
    ...(capability?.enumValues ?? []).map((item) => ({
      value: item.value,
      label: enumValueLabel(item, {
        ...capability,
        stateLabels: entity?.stateLabels,
      }),
      missing: item.status === "missing",
    })),
    ...(entity?.attributes?.options ?? []).map((value) => ({
      value: String(value),
      label: deviceValueLabel(value, undefined, entity),
      missing: false,
    })),
  ];
  if (
    !capability?.enumValues?.length &&
    !entity?.attributes?.options?.length &&
    entity?.state != null &&
    !["unknown", "unavailable"].includes(String(entity.state))
  )
    values.push({
      value: String(entity.state),
      label: String(entity.state),
      missing: false,
    });
  return [...new Map(values.map((item) => [item.value, item])).values()];
}

export function runtimeDisplayIssues(config, capabilities, binding, device) {
  if (!config) return ["尚未配置运行浮窗"];
  const issues = [];
  const status = (capabilities ?? []).find(
    (item) => item.capabilityId === config.statusCapabilityId,
  );
  if (!status || !["status", "enum"].includes(status.kind))
    issues.push("请选择状态类运行状态能力");
  if (!config.runningStates?.length) issues.push("至少选择一个运行中状态");
  for (const value of config.runningStates ?? [])
    if (config.endingStates?.includes(value))
      issues.push(`状态“${value}”不能同时用于运行中与结束`);
  const mapping = binding?.capabilityMappings?.[status?.capabilityId];
  if (
    status &&
    !mapping?.entityId &&
    !binding?.capabilityBindings?.[status.capabilityId]?.length
  )
    issues.push("运行状态能力尚未映射 HA 实体");
  const entityId =
    mapping?.entityId ??
    binding?.capabilityBindings?.[status?.capabilityId]?.[0];
  const entity = deviceCapabilityEntities(device).find((item) => item.entityId === entityId);
  const choices = stateChoices(status, entity);
  if (status?.kind === "enum" && status.enumValues?.length)
    for (const value of [
      ...(config.runningStates ?? []),
      ...(config.endingStates ?? []),
    ])
      if (!choices.some((item) => item.value === value && !item.missing))
        issues.push(`当前能力已不存在状态“${value}”`);
  const remaining = (capabilities ?? []).find(
    (item) => item.capabilityId === config.remainingCapabilityId,
  );
  if (
    config.remainingCapabilityId &&
    (!remaining || remaining.dataType !== "number")
  )
    issues.push("剩余时间能力已删除或不是数值类型");
  for (const key of ["titleTemplate", "idleTemplate", "runningTemplate"])
    for (const match of String(config[key] ?? "").matchAll(
      /\{capability\.([a-z0-9._-]+)\.(?:state|attributes\.[a-z0-9_]+)(?:\s*\|[^{}]*)?\}/gi,
    ))
      if (!(capabilities ?? []).some((item) => item.capabilityId === match[1]))
        issues.push(`模板引用能力已删除：${match[1]}`);
  return [...new Set(issues)];
}

export function runtimeTemplateVariables(capabilities, binding, device) {
  const result = [
    { token: "{device.name}", label: "设备名称" },
    { token: "{time.now}", label: "当前时间" },
  ];
  const counts = new Map();
  for (const capability of capabilities ?? [])
    counts.set(capability.name, (counts.get(capability.name) ?? 0) + 1);
  for (const capability of capabilities ?? []) {
    const name = capability.name;
    if (!name || counts.get(name) !== 1 || /[{}]/.test(name)) continue;
    const entityId =
      binding?.capabilityMappings?.[capability.capabilityId]?.entityId ??
      binding?.capabilityBindings?.[capability.capabilityId]?.[0];
    if (!entityId) continue;
    result.push({ token: `{${name}}`, label: `${name} · 状态` });
    if (capability.dataType === "number")
      result.push({
        token: `{{time.now} + {${name}}}`,
        label: `预计结束时间 · 当前时间加${name}`,
      });
  }
  return result;
}

export function appearanceIssues(project, model, capabilities) {
  if (!project?.appearance) return ["尚未配置 3D 外观"];
  const issues = [];
  if (!model) issues.push("3D 模型文件或资源不可用，请重新选择模型");
  issues.push(...partMotionIssues(project.appearance.partMotionRules,capabilities));
  const animation = project.appearance.animation ?? {};
  for (const id of [
    animation.statusCapabilityId,
    animation.remainingCapabilityId,
  ])
    if (id && !(capabilities ?? []).some((item) => item.capabilityId === id))
      issues.push(`动画引用能力已删除：${id}`);
  const status = (capabilities ?? []).find(
    (item) => item.capabilityId === animation.statusCapabilityId,
  );
  if (status?.kind === "enum" && status.enumValues?.length) {
    const available = new Set(
      status.enumValues
        .filter((item) => item.status !== "missing")
        .map((item) => item.value),
    );
    for (const value of animation.activeStates ?? [])
      if (!available.has(value))
        issues.push(`当前能力已不存在动画状态“${value}”`);
  }
  return issues;
}

export function initialAppearance(model, runtimeDisplay) {
  return {
    dimensions: {
      width: model?.dimensions?.width ?? 0.62,
      depth: model?.dimensions?.depth ?? 0.68,
      height: model?.dimensions?.height ?? 0.85,
    },
    scale: model?.scale ?? 1,
    placement: model?.placement ?? "floor",
    elevation: model?.elevation ?? 0,
    anchor: {
      x: model?.anchor?.x ?? 0,
      y: model?.anchor?.y ?? 0,
      z: model?.anchor?.z ?? 0,
    },
    color: model?.color ?? "#e8edf2",
    colorOverride: false,
    materialColors: {},
    metalness: model?.metalness ?? 0.08,
    metalnessOverride: false,
    roughness: model?.roughness ?? 0.62,
    roughnessOverride: false,
    animation: {
      statusCapabilityId: runtimeDisplay?.statusCapabilityId ?? "",
      remainingCapabilityId: runtimeDisplay?.remainingCapabilityId ?? "",
      activeStates: [...(runtimeDisplay?.runningStates ?? [])],
    },
  };
}
