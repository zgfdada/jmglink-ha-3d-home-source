import {entityOnlyDevice} from "../../../../packages/schema/src/entity-only-device.js";

function haystack(values) {
  return values.filter(Boolean).join(" ").toLocaleLowerCase();
}

function includesAny(value, candidates) {
  const normalized = value.toLocaleLowerCase();
  return candidates.some((candidate) =>
    normalized.includes(String(candidate).toLocaleLowerCase()),
  );
}

export function matchDeviceTemplate(device, entities, templates) {
  const deviceText = haystack([device.name, device.manufacturer, device.model]);
  let best;
  for (const template of templates) {
    if (!template.enabled || template.id === "builtin.generic") continue;
    const rules = template.matchRules ?? {};
    let score = 0;
    const reasons = [];
    if (includesAny(device.manufacturer ?? "", rules.manufacturers ?? [])) {
      score += 45;
      reasons.push("厂商");
    }
    if (includesAny(device.model ?? "", rules.models ?? [])) {
      score += 50;
      reasons.push("型号");
    }
    if (includesAny(device.name ?? "", rules.names ?? [])) {
      score += 55;
      reasons.push("设备名称");
    }
    if (includesAny(deviceText, rules.keywords ?? [])) {
      score += 35;
      reasons.push("设备关键词");
    }
    if (
      entities.some((entity) =>
        (rules.entityDomains ?? []).includes(entity.domain),
      )
    ) {
      score += 12;
      reasons.push("实体域");
    }
    if (
      entities.some((entity) =>
        (rules.deviceClasses ?? []).includes(entity.attributes?.device_class),
      )
    ) {
      score += 18;
      reasons.push("device_class");
    }
    if (
      entities.some((entity) =>
        includesAny(
          haystack([entity.entityId, entity.name]),
          rules.keywords ?? [],
        ),
      )
    ) {
      score += 25;
      reasons.push("实体关键词");
    }
    if (
      entities.some((entity) =>
        (rules.integrations ?? []).includes(entity.integration),
      )
    ) {
      score += 20;
      reasons.push("集成");
    }
    if (score > (best?.score ?? 0)) best = { template, score, reasons };
  }
  return best;
}

function capabilityMatches(capability, entity) {
  if (
    capability.allowedDomains?.length &&
    !capability.allowedDomains.includes(entity.domain)
  )
    return false;
  if (!capability.matchKeywords?.length) return true;
  return includesAny(
    haystack([
      entity.entityId,
      entity.name,
      entity.attributes?.device_class,
      entity.attributes?.icon,
    ]),
    capability.matchKeywords,
  );
}

export function mapCapabilities(template, entities, overrides = {}) {
  const result = {};
  for (const capability of template?.capabilities ?? []) {
    const manual = (overrides[capability.capabilityId] ?? []).filter(
      (entityId) => entities.some((entity) => entity.entityId === entityId),
    );
    if (manual.length) {
      result[capability.capabilityId] = manual;
      continue;
    }
    const candidates = entities.filter((entity) =>
      capabilityMatches(capability, entity),
    );
    if (candidates.length)
      result[capability.capabilityId] = (
        capability.multiple ? candidates : candidates.slice(0, 1)
      ).map((entity) => entity.entityId);
  }
  return result;
}

export function selectOperationalStateEntityId(template, capabilityBindings) {
  const statuses = (template?.capabilities ?? []).filter(
    (capability) => capability.kind === "status",
  );
  const preferred =
    statuses.find((capability) =>
      /(运行|工作|阶段|状态|running|operation|work|phase|status)/i.test(
        `${capability.name ?? ""} ${capability.capabilityId ?? ""}`,
      ),
    ) ?? statuses[0];
  return preferred
    ? capabilityBindings?.[preferred.capabilityId]?.[0]
    : undefined;
}

export function aggregateDeviceObjects({
  devices,
  entities,
  templates,
  bindings,
}) {
  const devicesById = new Map(devices.map((device) => [device.id, device]));
  for (const binding of bindings) {
    const device = entityOnlyDevice(binding, templates.find(project => project.id === binding.deviceTemplateId));
    if (device) devicesById.set(device.id, device);
  }
  const entitiesByDevice = new Map();
  const entitiesById = new Map(entities.map(entity => [entity.entityId,entity]));
  for (const entity of entities) {
    const deviceId = entity.deviceId || `entity:${entity.entityId}`;
    if (!entitiesByDevice.has(deviceId)) entitiesByDevice.set(deviceId, []);
    entitiesByDevice.get(deviceId).push(entity);
    if (!devicesById.has(deviceId))
      devicesById.set(deviceId, {
        id: deviceId,
        name: entity.name,
        areaId: entity.areaId,
        source: entity.source,
      });
  }
  const templateById = new Map(
    templates.map((template) => [template.id, template]),
  );
  const bindingByDevice = new Map(
    bindings.map((binding) => [binding.deviceId, binding]),
  );
  return [...devicesById.values()]
    .map((device) => {
      const deviceEntities = entitiesByDevice.get(device.id) ?? [];
      const binding = bindingByDevice.get(device.id);
      const physicalIds = new Set(deviceEntities.map(entity => entity.entityId));
      const extraEntities = (binding?.extraEntityIds ?? []).filter(id => !physicalIds.has(id)).map(entityId => entitiesById.get(entityId) ?? {
        entityId, domain:entityId.split(".")[0], name:entityId, state:"unavailable", attributes:{}, historical:true,
      });
      const capabilityEntityIds = new Set([...physicalIds,...extraEntities.map(entity => entity.entityId)]);
      const automatic = matchDeviceTemplate(device, deviceEntities, templates);
      const template =
        templateById.get(binding?.deviceTemplateId) ??
        automatic?.template ??
        templateById.get("builtin.generic");
      const capabilityBindings =
        binding?.mappingMode === "explicit"
          ? Object.fromEntries(
              Object.entries(binding.capabilityBindings ?? {})
                .map(([id, ids]) => [
                  id,
                  ids.filter((entityId) =>
                    capabilityEntityIds.has(entityId),
                  ),
                ])
                .filter(([, ids]) => ids.length),
            )
          : mapCapabilities(
              template,
              deviceEntities,
              binding?.capabilityBindings,
            );
      return {
        ...device,
        entityIds: deviceEntities.map((entity) => entity.entityId),
        entities: deviceEntities,
        extraEntityIds: extraEntities.map(entity => entity.entityId),
        extraEntities,
        deviceTemplateId: template?.id,
        deviceTemplateName: template?.name,
        statusDisplay: template?.runtimeDisplay ?? template?.statusDisplay,
        capabilityNames: Object.fromEntries(
          (template?.capabilities ?? []).map((capability) => [
            capability.capabilityId,
            capability.name,
          ]),
        ),
        matchConfidence: binding?.deviceTemplateId
          ? 100
          : automatic
            ? Math.min(99, automatic.score)
            : 0,
        matchReasons: binding?.deviceTemplateId
          ? ["用户指定"]
          : (automatic?.reasons ?? []),
        capabilityBindings,
        capabilityMappings: binding?.capabilityMappings ?? {},
        operationalStateEntityId: selectOperationalStateEntityId(
          template,
          capabilityBindings,
        ),
        modelTemplateId: binding?.modelTemplateId ?? template?.modelTemplateId,
        controlPanelTemplateId:
          binding?.controlPanelTemplateId ?? template?.controlPanelTemplateId,
        configured: Boolean(binding?.deviceTemplateId),
        historical:
          deviceEntities.length > 0 &&
          deviceEntities.every((entity) => entity.historical),
        development:
          device.source === "development" ||
          deviceEntities.some((entity) => entity.source === "development"),
      };
    })
    .filter((device) => device.entityIds.length || device.entityOnly)
    .sort((first, second) =>
      first.name.localeCompare(second.name, "zh-Hans-CN"),
    );
}
