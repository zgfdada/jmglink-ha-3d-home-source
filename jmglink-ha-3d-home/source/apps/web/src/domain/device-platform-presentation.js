export const CUSTOM_DEVICE_FILTER = "custom_device";

export function isCustomDeviceEntity(entity) {
  return String(entity?.deviceTemplateId ?? "").startsWith("custom.");
}

export function resolveDeviceDisplayName(entity, devices = []) {
  if (!entity) return "";
  const device = Array.isArray(devices)
    ? devices.find((item) => item.id === entity.deviceId)
    : devices instanceof Map
      ? devices.get(entity.deviceId)
      : undefined;
  return device?.name || entity.name || entity.entityId || "";
}

export function mergeEntityActionResult(currentEntity, updatedEntity) {
  if (!currentEntity) return updatedEntity;
  if (!updatedEntity) return currentEntity;
  return {
    ...currentEntity,
    ...updatedEntity,
    attributes: updatedEntity.attributes ?? currentEntity.attributes,
  };
}

export function resolveStableEntityOptions(entity) {
  const options = Array.isArray(entity?.attributes?.options)
    ? entity.attributes.options
    : [];
  const values = [];
  const seen = new Set();
  for (const value of options) {
    if (value == null || seen.has(String(value))) continue;
    seen.add(String(value));
    values.push(value);
  }
  if (entity?.state != null && !seen.has(String(entity.state))) {
    values.push(entity.state);
  }
  return values;
}

export function resolveStableEntitySelection(entity, rememberedValue) {
  const options = resolveStableEntityOptions(entity);
  const current = entity?.state == null ? undefined : String(entity.state);
  const validCurrent = options.find((value) => String(value) === current);
  if (
    validCurrent !== undefined &&
    !["unknown", "unavailable"].includes(current)
  )
    return String(validCurrent);
  const remembered = options.find(
    (value) => String(value) === String(rememberedValue),
  );
  return remembered === undefined ? undefined : String(remembered);
}

export function createControlRadioGroupName(deviceId, controlId, instanceId) {
  return `device-${deviceId}-${controlId}-${instanceId}`;
}

export function resolveLiveDeviceModel(entity, placedDevice) {
  return entity?.deviceModel?.enabled !== false && entity?.deviceModel?.source
    ? entity.deviceModel
    : placedDevice?.customModel?.source
      ? placedDevice.customModel
      : undefined;
}

export function resolveDeviceModelFootprint(entity, placedDevice) {
  const model = resolveLiveDeviceModel(entity, placedDevice);
  if (!model?.dimensions) return undefined;
  const modelScale = Number(model.scale) || 1;
  const placedScaleX = Math.abs(Number(placedDevice?.scale?.[0]) || 1);
  const placedScaleZ = Math.abs(Number(placedDevice?.scale?.[2]) || 1);
  return {
    width: Math.max(
      0.05,
      Number(model.dimensions.width || 0.6) * modelScale * placedScaleX,
    ),
    depth: Math.max(
      0.05,
      Number(model.dimensions.depth || 0.6) * modelScale * placedScaleZ,
    ),
    x: Number(model.anchor?.x || 0) * placedScaleX,
    y: Number(model.anchor?.z || 0) * placedScaleZ,
    model,
  };
}

export function resolveBoundDevicePresentation(entity, fallbackModelId) {
  const locked = Boolean(entity?.deviceTemplateId);
  const configuredModel =
    locked &&
    entity?.deviceModel?.enabled !== false &&
    entity?.deviceModel?.source
      ? structuredClone(entity.deviceModel)
      : undefined;
  return {
    locked,
    modelId: fallbackModelId,
    customModel: configuredModel,
    templateId: locked ? entity.deviceTemplateId : undefined,
    templateName: locked
      ? entity.deviceTemplateName || entity.deviceTemplateId
      : undefined,
    modelName: configuredModel?.name,
  };
}
