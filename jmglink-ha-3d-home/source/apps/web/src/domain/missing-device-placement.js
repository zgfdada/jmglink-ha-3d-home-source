export function missingDevicePlacements(floor, entities, connected) {
  if (!connected) return [];
  return floor.devices.filter((device) => !entities[device.entityId]);
}

export function replacementCandidates(floor, placement, entities) {
  const others = floor.devices.filter((device) => device.id !== placement.id);
  return Object.values(entities).filter((entity) => !others.some((device) =>
    device.entityId === entity.entityId ||
    (entity.deviceId && device.deviceId === entity.deviceId),
  )).sort((a, b) =>
    Number(Boolean(placement.deviceId) && b.deviceId === placement.deviceId) - Number(Boolean(placement.deviceId) && a.deviceId === placement.deviceId) ||
    a.name.localeCompare(b.name, "zh-Hans"),
  );
}

export function replaceDevicePlacement(placement, entity, presentation, kind) {
  return {
    ...placement,
    entityId: entity.entityId,
    name: entity.deviceDisplayName || entity.name,
    deviceId: entity.deviceId,
    deviceTemplateId: entity.deviceTemplateId,
    deviceBindingId: entity.deviceBindingId,
    kind,
    modelId: presentation.modelId,
    customModel: presentation.customModel,
  };
}
