import { withAssociatedEntities } from "../../../../packages/schema/src/associated-entities.js";
import {partMotionIssues} from "../../../../packages/schema/src/part-motion.js";
function mappingFor(binding, capabilityId) {
  return (
    binding?.capabilityMappings?.[capabilityId] ??
    (binding?.capabilityBindings?.[capabilityId]?.[0]
      ? {
          entityId: binding.capabilityBindings[capabilityId][0],
          attribute: "state",
        }
      : null)
  );
}

function valueType(entity, attribute) {
  if (attribute === "state") {
    if (["binary_sensor", "switch", "input_boolean"].includes(entity.domain))
      return "boolean";
    if (entity.domain === "select") return "enum";
    if (entity.domain === "number") return "number";
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

export function validateProjectCapabilities(
  project,
  binding,
  device,
  models = [],
  panels = [],
) {
  device = withAssociatedEntities(device);
  const issues = [];
  const capabilityIds = new Set(
    (project?.capabilities ?? []).map((item) => item.capabilityId),
  );
  const runtime = project?.runtimeDisplay;
  if (runtime) {
    const status = (project.capabilities ?? []).find(
      (item) => item.capabilityId === runtime.statusCapabilityId,
    );
    if (!status || !["status", "enum"].includes(status.kind))
      issues.push({
        page: "运行浮窗",
        severity: "error",
        reason: "运行状态能力缺失或类型不兼容",
      });
    if (!runtime.runningStates?.length)
      issues.push({
        page: "运行浮窗",
        severity: "error",
        reason: "未配置运行中状态",
      });
    for (const value of runtime.runningStates ?? []) {
      if (runtime.endingStates?.includes(value))
        issues.push({
          page: "运行浮窗",
          severity: "error",
          reason: `运行和结束状态重复：${value}`,
        });
    }
    if (status?.kind === "enum" && status.enumValues?.length) {
      const available = new Set(
        status.enumValues
          .filter((item) => item.status !== "missing")
          .map((item) => item.value),
      );
      for (const value of [
        ...(runtime.runningStates ?? []),
        ...(runtime.endingStates ?? []),
      ])
        if (!available.has(value))
          issues.push({
            page: "运行浮窗",
            severity: "error",
            reason: `当前能力已不存在该状态：${value}`,
          });
    }
    for (const key of ["titleTemplate", "idleTemplate", "runningTemplate"]) {
      for (const match of String(runtime[key] ?? "").matchAll(
        /\{capability\.([a-z0-9._-]+)\.(?:state|attributes\.[a-z0-9_]+)(?:\s*\|[^{}]*)?\}/gi,
      ))
        if (!capabilityIds.has(match[1]))
          issues.push({
            page: "运行浮窗",
            severity: "error",
            reason: `模板引用能力已删除：${match[1]}`,
          });
    }
  }
  const appearance = project?.appearance;
  if (appearance) {
    for(const reason of partMotionIssues(appearance.partMotionRules,project.capabilities))issues.push({page:"3D 外观",severity:"error",reason});
    if (
      !project.modelTemplateId ||
      !models.some((item) => item.id === project.modelTemplateId)
    )
      issues.push({
        page: "3D 外观",
        severity: "error",
        reason: "3D 模型文件或资源不可用",
      });
    for (const id of [
      appearance.animation?.statusCapabilityId,
      appearance.animation?.remainingCapabilityId,
    ])
      if (id && !capabilityIds.has(id))
        issues.push({
          page: "3D 外观",
          severity: "error",
          reason: `动画引用能力已删除：${id}`,
        });
    const animationStatus = (project.capabilities ?? []).find(
      (item) => item.capabilityId === appearance.animation?.statusCapabilityId,
    );
    if (
      animationStatus?.kind === "enum" &&
      animationStatus.enumValues?.length
    ) {
      const available = new Set(
        animationStatus.enumValues
          .filter((item) => item.status !== "missing")
          .map((item) => item.value),
      );
      for (const value of appearance.animation?.activeStates ?? [])
        if (!available.has(value))
          issues.push({
            page: "3D 外观",
            severity: "error",
            reason: `当前能力已不存在动画状态：${value}`,
          });
    }
  }
  for (const capability of project?.capabilities ?? []) {
    const mapping = mappingFor(binding, capability.capabilityId);
    if (!mapping) {
      if (capability.required)
        issues.push({
          capabilityId: capability.capabilityId,
          severity: "error",
          reason: "必需能力未映射",
        });
      continue;
    }
    const entity = device?.entities?.find(
      (item) => item.entityId === mapping.entityId,
    );
    if (!entity) {
      issues.push({
        capabilityId: capability.capabilityId,
        severity: "error",
        reason: "映射实体已不存在",
      });
      continue;
    }
    if (
      entity.historical ||
      ["unavailable", "unknown"].includes(entity.state)
    ) {
      issues.push({
        capabilityId: capability.capabilityId,
        severity: "warning",
        reason: entity.historical
          ? "映射的是历史实体，当前状态未确认"
          : entity.state === "unknown"
            ? "映射实体状态待同步"
            : "映射实体暂不可用",
      });
      continue;
    }
    const attribute = mapping.attribute ?? "state";
    if (attribute !== "state" && !(attribute in (entity.attributes ?? {}))) {
      issues.push({
        capabilityId: capability.capabilityId,
        severity: "error",
        reason: "映射属性已不存在",
      });
      continue;
    }
    const actual = valueType(entity, attribute);
    if (
      actual !== capability.dataType &&
      !(capability.dataType === "enum" && actual === "string")
    )
      issues.push({
        capabilityId: capability.capabilityId,
        severity: "error",
        reason: `数据类型不匹配：期望 ${capability.dataType}，实际 ${actual}`,
      });
  }
  for (const panel of panels) {
    if (
      panel.id !== project?.controlPanelTemplateId &&
      panel.deviceTemplateId !== project?.id
    )
      continue;
    if (!panel.sections?.some((section) => section.controls?.length))
      issues.push({
        page: "控制面板",
        severity: "error",
        reason: "控制面板尚未添加组件",
      });
    for (const section of panel.sections ?? [])
      for (const control of section.controls ?? []) {
        const needsCapability = [
          "toggle",
          "button",
          "select",
          "slider",
          "number",
          "progress",
        ].includes(control.type);
        if (needsCapability && !control.capabilityId)
          issues.push({
            page: "控制面板",
            component: control.label,
            severity: "error",
            reason: "能力未绑定",
          });
        if (control.capabilityId && !capabilityIds.has(control.capabilityId))
          issues.push({
            capabilityId: control.capabilityId,
            page: "控制面板",
            component: control.label,
            severity: "error",
            reason: "引用能力已删除",
          });
        const capability = (project?.capabilities ?? []).find(
          (item) => item.capabilityId === control.capabilityId,
        );
        if (capability) {
          const compatible =
            control.type === "toggle"
              ? capability.kind === "toggle" ||
                capability.dataType === "boolean"
              : control.type === "select"
                ? capability.kind === "enum" || capability.dataType === "enum"
                : ["slider", "number", "progress"].includes(control.type)
                  ? capability.dataType === "number"
                  : control.type === "button"
                    ? capability.kind === "action" ||
                      capability.kind === "toggle" ||
                      capability.dataType === "boolean"
                    : true;
          if (!compatible)
            issues.push({
              page: "控制面板",
              component: control.label,
              severity: "error",
              reason: "绑定能力类型不兼容",
            });
        }
      }
  }
  for (const model of models) {
    if (
      model.id !== project?.modelTemplateId &&
      model.deviceTemplateId !== project?.id
    )
      continue;
    for (const key of ["statusCapabilityId", "remainingCapabilityId"]) {
      const id = model.runtimeEffect?.[key];
      if (id && !capabilityIds.has(id))
        issues.push({
          capabilityId: id,
          page: "3D 外观",
          component: model.name,
          severity: "error",
          reason: "引用能力已删除",
        });
    }
  }
  return {
    publishBlocked: issues.some((item) => item.severity === "error"),
    issues,
  };
}
