// Project-local identity; never registered or controlled in Home Assistant.
export const entityOnlyDeviceId = projectId => `project:${projectId}`;

export function entityOnlyDevice(binding, project) {
  if (!binding?.entityOnly) return null;
  return {id:binding.deviceId, name:project?.name ?? "自定义设备", source:"project", entityOnly:true};
}

export function entityOnlyEntities(bindings, templates, entities) {
  const byId = new Map(entities.map(entity => [entity.entityId, entity]));
  const projects = new Map(templates.map(project => [project.id, project]));
  return bindings.filter(binding => binding.entityOnly).map(binding => {
    const related = (binding.extraEntityIds ?? []).map(id => byId.get(id));
    const online = related.some(entity => entity && !entity.historical && !["unknown","unavailable"].includes(entity.state));
    const key = [...new TextEncoder().encode(binding.deviceTemplateId)].map(byte => byte.toString(16).padStart(2,"0")).join("");
    return {entityId:`sensor.ha3d_project_${key}`, deviceId:binding.deviceId,
      name:projects.get(binding.deviceTemplateId)?.name ?? "自定义设备", domain:"sensor",
      state:online?"online":"unavailable", attributes:{icon:"mdi:cube-outline"}, source:"project", entityOnly:true};
  });
}
