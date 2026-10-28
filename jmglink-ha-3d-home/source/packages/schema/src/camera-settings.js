const CAMERA_ID = /^camera\.[a-z0-9_]+$/;
export function safeCameraExternalUrl(value) {
  if (!value) return "";
  try {
    const url = new URL(String(value).trim());
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password
    )
      return "";
    for (const key of url.searchParams.keys())
      if (
        /^(access_token|token|password|passwd|api_key|apikey|auth)$/i.test(key)
      )
        return "";
    return url.href;
  } catch {
    return "";
  }
}
export function normalizeCameraSettings(value, primaryId) {
  if (!value || typeof value !== "object") return undefined;
  const secondaryEntityId =
    CAMERA_ID.test(value.secondaryEntityId ?? "") &&
    value.secondaryEntityId !== primaryId
      ? value.secondaryEntityId
      : undefined;
  return {
    secondaryEntityId,
    externalUrl: safeCameraExternalUrl(value.externalUrl) || undefined,
    ptzProvider: ["auto", "none", "frigate", "onvif"].includes(
      value.ptzProvider,
    )
      ? value.ptzProvider
      : "auto",
    ptzEntityId: CAMERA_ID.test(value.ptzEntityId ?? "")
      ? value.ptzEntityId
      : undefined,
  };
}
export function cameraPlacement(project, entityId) {
  return (
    project?.floors
      ?.flatMap((f) => f.devices ?? [])
      .find((d) => d.entityId === entityId) ??
    project?.floors
      ?.flatMap((f) => f.devices ?? [])
      .find((d) => d.cameraSettings?.secondaryEntityId === entityId)
  );
}
export function cameraChannels(entity, placement, entities = {}) {
  const get = (id) =>
    Array.isArray(entities)
      ? entities.find((e) => e.entityId === id)
      : entities[id];
  const primary = get(placement?.entityId) ?? entity;
  const settings = normalizeCameraSettings(
    placement?.cameraSettings,
    primary.entityId,
  );
  const channels = [{ id: primary.entityId, label: "主摄", entity: primary }];
  if (settings?.secondaryEntityId) {
    const second = get(settings.secondaryEntityId);
    channels.push({
      id: settings.secondaryEntityId,
      label: "第二路",
      entity: second ?? {
        entityId: settings.secondaryEntityId,
        name: settings.secondaryEntityId,
        domain: "camera",
        state: "unavailable",
        attributes: {},
      },
    });
  }
  return channels;
}
export function cameraPlanForward(yaw = 0) {
  return [Math.sin(yaw), Math.cos(yaw)];
}
