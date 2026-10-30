import { bindingEntityIds } from '../../../../packages/schema/src/associated-entities.js';

export function collectLiveEntityIds(project, entities, bindings = []) {
  const ids = new Set();
  for (const floor of project?.floors ?? []) {
    for (const device of floor.devices ?? []) {
      if (device.entityId) ids.add(device.entityId);
    }
    for (const room of floor.rooms ?? []) {
      for (const groups of Object.values(room.bindings ?? {})) {
        for (const binding of Object.values(groups)) {
          for (const entityId of binding.entityIds ?? []) ids.add(entityId);
        }
      }
    }
  }

  // A placed device can use other HA entities for its controls and runtime effects.
  const deviceIds = new Set(
    entities.filter((entity) => ids.has(entity.entityId) && entity.deviceId)
      .map((entity) => entity.deviceId),
  );
  for (const floor of project?.floors ?? []) {
    for (const device of floor.devices ?? []) {
      if (device.deviceId) deviceIds.add(device.deviceId);
    }
  }
  for (const binding of bindings) {
    if (!deviceIds.has(binding.deviceId)) continue;
    for (const id of bindingEntityIds(binding)) ids.add(id);
    for (const mapping of Object.values(binding.capabilityMappings ?? {})) {
      if (mapping?.entityId) ids.add(mapping.entityId);
    }
  }
  for (const entity of entities) {
    if (deviceIds.has(entity.deviceId)) ids.add(entity.entityId);
    // Homepage presence badges consume these even without a placed model/binding.
    if (["person", "device_tracker"].includes(entity.domain)) ids.add(entity.entityId);
  }
  return ids;
}
