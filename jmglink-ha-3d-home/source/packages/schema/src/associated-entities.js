export function bindingEntityIds(binding) {
  return [...new Set([
    ...(binding?.selectedEntityIds ?? []),
    ...(binding?.extraEntityIds ?? []),
    ...Object.values(binding?.capabilityBindings ?? {}).flat(),
  ])];
}

export function deviceCapabilityEntities(device) {
  return [...new Map([...(device?.entities ?? []), ...(device?.extraEntities ?? [])]
    .map(entity => [entity.entityId, entity])).values()];
}

export function withAssociatedEntities(device) {
  return device ? { ...device, entities: deviceCapabilityEntities(device) } : device;
}
