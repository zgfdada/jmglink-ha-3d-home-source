export function capabilityDependencies(project, models, panels, capabilityId) {
  const result = [];
  const add = (page, component, controlType) =>
    result.push({
      page,
      component,
      controlType,
      severity: "warning",
      action: "重新选择能力",
    });
  if (!project || !capabilityId) return result;
  if (project.runtimeDisplay?.statusCapabilityId === capabilityId)
    add("运行浮窗", "运行状态判断");
  if (project.runtimeDisplay?.remainingCapabilityId === capabilityId)
    add("运行浮窗", "剩余时间");
  if (project.appearance?.animation?.statusCapabilityId === capabilityId)
    add("3D 外观", "动画运行状态");
  if (project.appearance?.animation?.remainingCapabilityId === capabilityId)
    add("3D 外观", "动画剩余时间");
  for (const model of models ?? []) {
    if (
      model.id !== project.modelTemplateId &&
      model.deviceTemplateId !== project.id
    )
      continue;
    const effect = model.runtimeEffect ?? {};
    if (effect.statusCapabilityId === capabilityId)
      add("3D 外观", `${model.name} · 运行状态`);
    if (effect.remainingCapabilityId === capabilityId)
      add("3D 外观", `${model.name} · 剩余时间`);
  }
  for (const panel of panels ?? []) {
    if (
      panel.id !== project.controlPanelTemplateId &&
      panel.deviceTemplateId !== project.id
    )
      continue;
    for (const section of panel.sections ?? []) {
      for (const control of section.controls ?? []) {
        if (control.capabilityId === capabilityId)
          add(
            "控制面板",
            `${panel.name} / ${section.title} / ${control.label}`,
            control.type,
          );
      }
    }
  }
  for (const [label, template] of Object.entries({
    标题: project.statusDisplay?.titleTemplate,
    状态: project.statusDisplay?.statusTemplate,
    浮窗标题: project.runtimeDisplay?.titleTemplate,
    待机文案: project.runtimeDisplay?.idleTemplate,
    运行文案: project.runtimeDisplay?.runningTemplate,
  })) {
    if (template?.includes(capabilityId)) add("运行浮窗", `${label}模板`);
  }
  return result;
}

export function incompatibleDependencies(dependencies, capability) {
  return dependencies.filter((item) => {
    if (item.page !== "控制面板") return false;
    const type = item.controlType;
    if (!type) return false;
    if (type === "toggle") return capability.dataType !== "boolean";
    if (["slider", "number", "progress"].includes(type))
      return capability.dataType !== "number";
    if (type === "select") return capability.dataType !== "enum";
    return false;
  });
}
