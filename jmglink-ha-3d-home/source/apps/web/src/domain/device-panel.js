import { deviceValueLabel } from "../../../../packages/schema/src/device-value-labels.js";
export function panelVariant(control) {
  return control.type === "select" ? control.selectStyle || "dropdown" : control.variant || ({number:"input",toggle:"switch",status:"row",progress:"line",stats:"row",button:"primary",slider:"track",text:"plain",icon:"tile",richtext:"paragraph",divider:"line",container:"frame"}[control.type] || "default");
}
export function panelOptions(control, state) {
  const overrides = control.optionSource === "custom" ? control.optionOverrides || [] : [];
  return (state?.options || state?.enumValues || []).map((option, index) => {
    const item = typeof option === "object" ? option : {value:option};
    const override = overrides.find(entry => String(entry.value) === String(item.value));
    const saved = state?.enumValues?.find(entry => String(entry.value) === String(item.value));
    return {value:String(item.value),label:deviceValueLabel(item.value, override?.label || saved?.label || item.label, {...state,labelSource:override?.label ? "custom" : saved?.source === "manual" ? "custom" : saved?.labelSource || item.labelSource}),hidden:override?.hidden,missing:item.missing,order:override?.order ?? index};
  }).filter(item => !item.hidden && !item.missing).sort((a,b) => a.order-b.order);
}
export function panelValue(state) {
  const value = state?.state;
  if (value == null || value === "unknown" || value === "unavailable") return "—";
  const option = state?.enumValues?.find(item => String(item.value) === String(value)) || state?.options?.find(item => typeof item === "object" && String(item.value) === String(value));
  return deviceValueLabel(value, option?.label, {...state,labelSource:option?.source === "manual" ? "custom" : option?.labelSource});
}
export function boundPanelStates(project, binding, entities) {
  const byId = new Map(entities.map(entity => [entity.entityId, entity]));
  return Object.fromEntries((project?.capabilities || []).map(cap => {
    const mapping = binding?.capabilityMappings?.[cap.capabilityId];
    const entityId = mapping?.entityId || binding?.capabilityBindings?.[cap.capabilityId]?.[0];
    const entity = byId.get(entityId);
    const attr = mapping?.attribute || "state";
    const state = attr === "state" ? entity?.state : entity?.attributes?.[attr];
    return [cap.capabilityId, {...cap,id:cap.capabilityId,entityId,state,bound:!!entityId,available:!!entity && entity.state !== "unavailable",unit:entity?.attributes?.unit_of_measurement || cap.unit || "",min:entity?.attributes?.min,max:entity?.attributes?.max,step:entity?.attributes?.step,stateLabels:entity?.stateLabels,options:entity?.attributes?.options || cap.enumValues || []}];
  }));
}
export function samplePanelStates(capabilities, values = {}) {
  return Object.fromEntries(capabilities.map(cap => [cap.capabilityId,{...cap,id:cap.capabilityId,bound:true,available:true,options:cap.enumValues || [],state:Object.hasOwn(values,cap.capabilityId) ? values[cap.capabilityId] : cap.dataType === "boolean" ? false : ["number","integer"].includes(cap.dataType) || cap.kind === "number" ? 38 : cap.enumValues?.[0]?.value || "示例状态"}]));
}
export function controlVisible(control, states) {
  if (!control.visibleWhen) return true;
  const [id,expected] = control.visibleWhen.split("=",2);
  return String(states[id?.trim()]?.state) === expected?.trim();
}
