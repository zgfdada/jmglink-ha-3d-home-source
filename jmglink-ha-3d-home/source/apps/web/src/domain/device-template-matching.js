function normalizedList(values) {
  return (values ?? [])
    .map((value) => String(value).trim().toLocaleLowerCase())
    .filter(Boolean);
}

function includesAny(value, candidates) {
  const text = String(value ?? "").toLocaleLowerCase();
  return !candidates.length || candidates.some((candidate) => text.includes(candidate));
}

export function matchesDeviceTemplateRules(device, rules = {}) {
  const names = normalizedList(rules.names);
  const keywords = normalizedList(rules.keywords);
  const manufacturers = normalizedList(rules.manufacturers);
  const models = normalizedList(rules.models);
  const integrations = normalizedList(rules.integrations);
  const entityDomains = normalizedList(rules.entityDomains);
  const deviceClasses = normalizedList(rules.deviceClasses);
  const entities = device?.entities ?? [];
  const deviceText = [
    device?.name,
    device?.manufacturer,
    device?.model,
    ...entities.flatMap((entity) => [entity.entityId, entity.name]),
  ]
    .filter(Boolean)
    .join(" ");

  return (
    includesAny(device?.name, names) &&
    includesAny(deviceText, keywords) &&
    includesAny(device?.manufacturer, manufacturers) &&
    includesAny(device?.model, models) &&
    (!integrations.length ||
      integrations.some(
        (integration) =>
          String(device?.integration ?? "").toLocaleLowerCase() === integration ||
          entities.some(
            (entity) =>
              String(entity.integration ?? "").toLocaleLowerCase() === integration,
          ),
      )) &&
    (!entityDomains.length ||
      entityDomains.some((domain) =>
        entities.some(
          (entity) => String(entity.domain ?? "").toLocaleLowerCase() === domain,
        ),
      )) &&
    (!deviceClasses.length ||
      deviceClasses.some((deviceClass) =>
        entities.some(
          (entity) =>
            String(entity.attributes?.device_class ?? "").toLocaleLowerCase() ===
            deviceClass,
        ),
      ))
  );
}

export function filterDevicesByTemplateRules(devices, rules) {
  return (devices ?? []).filter((device) =>
    matchesDeviceTemplateRules(device, rules),
  );
}
