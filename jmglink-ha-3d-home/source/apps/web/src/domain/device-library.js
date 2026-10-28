export function buildDeviceLibrary(entities, placedDevices, isVisible, compare) {
  const byEntityId = new Map(entities.map((entity) => [entity.entityId, entity]));
  const placedEntityIds = new Set(
    placedDevices
      .filter((device) => byEntityId.has(device.entityId))
      .map((device) => device.entityId),
  );
  const placedHaDeviceIds = new Set(
    placedDevices
      .map((device) => device.deviceId ?? byEntityId.get(device.entityId)?.deviceId)
      .filter(Boolean),
  );
  const unplaced = entities
    .filter(
      (entity) =>
        !placedEntityIds.has(entity.entityId) &&
        (!entity.deviceId || !placedHaDeviceIds.has(entity.deviceId)),
    )
    .sort(compare);
  const visible = unplaced.filter(isVisible);
  const climateDeviceIds = new Set(
    visible
      .filter((entity) => entity.domain === "climate" && entity.deviceId)
      .map((entity) => entity.deviceId),
  );
  const cameraDeviceIds = new Set(visible.filter(entity=>entity.domain === "camera" && entity.deviceId).map(entity=>entity.deviceId));
  const seenDevices = new Set();
  const available = visible.filter((entity) => {
    if (entity.domain === "camera") return true;
    if (!entity.deviceId) return true;
    if (cameraDeviceIds.has(entity.deviceId)) return false;
    if (climateDeviceIds.has(entity.deviceId) && entity.domain !== "climate")
      return false;
    if (seenDevices.has(entity.deviceId)) return false;
    seenDevices.add(entity.deviceId);
    return true;
  });
  return { unplaced, available };
}

export function resolveDeviceLibraryAreaId(entity, areas) {
  if (entity.areaId) return entity.areaId;
  if (entity.domain !== "climate") return undefined;
  const name = entity.name?.trim() ?? "";
  const matches = areas.filter((area) => {
    const roomName = area.name?.trim().split(/\s+/).at(-1) ?? "";
    return roomName.length >= 2 && name.includes(roomName);
  });
  return matches.length === 1 ? matches[0].id : undefined;
}
