// Match HA's entity-specific, device-class, and domain fallback order.
export function translatedEntityLabels(entity, registry, resources = {}) {
  const domain = entity.domain ?? entity.entityId?.split(".")[0];
  const prefixes = [
    registry?.integration && registry?.translationKey
      ? `component.${registry.integration}.entity.${domain}.${registry.translationKey}.state.`
      : null,
    entity.attributes?.device_class
      ? `component.${domain}.entity_component.${entity.attributes.device_class}.state.`
      : null,
    `component.${domain}.entity_component._.state.`,
  ].filter(Boolean);
  // A dictionary describes a family of products, not this device's options.
  const values = new Set([entity.state, ...(entity.attributes?.options ?? [])]);
  const labels = {};
  for (const value of values) {
    if (value == null) continue;
    for (const prefix of prefixes) {
      const label = resources[prefix + value];
      if (typeof label === "string" && label.trim()) {
        labels[String(value)] = label;
        break;
      }
    }
  }
  return labels;
}
