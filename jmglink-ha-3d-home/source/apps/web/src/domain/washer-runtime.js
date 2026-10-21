const DEFAULT_ACTIVE_STATES =
  "work,working,running,washing,rinse,rinsing,spin,spinning,on";
export const DEFAULT_WASHER_TITLE_TEMPLATE = "{device.name}";

function displayValue(value) {
  if (value === undefined || value === null || value === "") return "—";
  if (typeof value === "number" && !Number.isFinite(value)) return "—";
  const result =
    typeof value === "object" ? JSON.stringify(value) : String(value);
  if (
    !result ||
    /^(?:null|undefined|nan|unknown|unavailable)$/i.test(result.trim())
  )
    return "—";
  return result.slice(0, 80);
}

function entityValue(entity, field) {
  if (!entity) return "—";
  if (field === "state") return displayValue(entity.state);
  if (!field.startsWith("attributes.")) return "—";
  const path = field.slice("attributes.".length).split(".");
  let value = entity.attributes;
  for (const key of path) {
    if (
      !key ||
      key === "__proto__" ||
      key === "constructor" ||
      key === "prototype"
    )
      return "—";
    value = value?.[key];
  }
  return displayValue(value);
}

function remainingTiming(runtime, now) {
  const updatedAt = Date.parse(runtime.remainingUpdatedAt ?? "");
  const endAt =
    (Number.isFinite(updatedAt) ? updatedAt : now) +
    runtime.remainingMinutes * 60_000;
  const endTime = new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(endAt));
  return { minutes: Math.max(0, Math.ceil((endAt - now) / 60_000)), endTime };
}

function clockTime(timestamp) {
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(timestamp));
}

function durationMilliseconds(entity) {
  const amount = Number(entity?.state);
  if (!Number.isFinite(amount) || amount < 0 || entity?.state === "")
    return null;
  const unit = String(entity?.attributes?.unit_of_measurement ?? "")
    .trim()
    .toLowerCase();
  const multiplier = /^(?:h|hr|hour|hours|小时)$/.test(unit)
    ? 3_600_000
    : /^(?:s|sec|second|seconds|秒)$/.test(unit)
      ? 1_000
      : 60_000;
  return { duration: amount * multiplier, unit: multiplier };
}

function durationEndAt(entity, now, anchored = false) {
  const duration = durationMilliseconds(entity);
  if (!duration) return null;
  const updatedAt = Date.parse(entity?.lastUpdated ?? "");
  return {
    endAt:
      (anchored && Number.isFinite(updatedAt) ? updatedAt : now) +
      duration.duration,
    unit: duration.unit,
  };
}

function variableEntity(runtime, token) {
  if (token.startsWith("status."))
    return { entity: runtime.statusEntity, field: token.slice(7) };
  if (token.startsWith("remaining."))
    return { entity: runtime.remainingEntity, field: token.slice(10) };
  if (token.startsWith("capability.")) {
    for (const [capabilityId, entityIds] of Object.entries(
      runtime.capabilityBindings ?? {},
    )) {
      const prefix = `capability.${capabilityId}.`;
      if (!token.startsWith(prefix)) continue;
      return {
        entity: runtime.deviceEntities?.find(
          (item) => item.entityId === entityIds?.[0],
        ),
        field: token.slice(prefix.length),
      };
    }
  }
  if (token.startsWith("entity.")) {
    for (const entity of runtime.deviceEntities ?? []) {
      const prefix = `entity.${entity.entityId}.`;
      if (token.startsWith(prefix))
        return { entity, field: token.slice(prefix.length) };
    }
  }
  // New template rules use the human-readable capability name, not its internal ID.
  let match = null;
  for (const [capabilityId, name] of Object.entries(
    runtime.capabilityNames ?? {},
  )) {
    if (!name || (token !== name && !token.startsWith(`${name}.属性.`)))
      continue;
    if (match) return null; // Duplicate names are ambiguous and must not bind to the wrong entity.
    const entityId = runtime.capabilityBindings?.[capabilityId]?.[0];
    match = {
      entity: runtime.deviceEntities?.find(
        (item) => item.entityId === entityId,
      ),
      field:
        token === name ? "state" : `attributes.${token.slice(name.length + 4)}`,
    };
  }
  return match;
}

function runtimeVariable(runtime, token, now) {
  if (token === "device.name") return displayValue(runtime.deviceName);
  if (token === "time.now") return clockTime(now);
  if (token === "elapsed.minutes") {
    const startedAt = Date.parse(runtime.statusEntity?.lastUpdated ?? "");
    return Number.isFinite(startedAt)
      ? String(Math.max(0, Math.floor((now - startedAt) / 60_000)))
      : "—";
  }
  // Read-only compatibility for status rules saved before generic time expressions existed.
  if (token === "remaining.minutes" || token === "end.time") {
    if (runtime.remainingMinutes === null) return "—";
    const timing = remainingTiming(runtime, now);
    return token === "remaining.minutes"
      ? String(timing.minutes)
      : timing.endTime;
  }
  const countdown = token.endsWith("|countdown");
  const resolved = variableEntity(
    runtime,
    countdown ? token.slice(0, -10) : token,
  );
  if (
    !resolved ||
    (resolved.field !== "state" && !resolved.field.startsWith("attributes."))
  )
    return "—";
  if (countdown) {
    if (resolved.field !== "state") return "—";
    const timing = durationEndAt(resolved.entity, now, true);
    return timing
      ? String(Math.max(0, Math.ceil((timing.endAt - now) / timing.unit)))
      : "—";
  }
  return entityValue(resolved.entity, resolved.field);
}

function renderRuntimeTemplate(template, runtime, now) {
  return String(template)
    .replace(/\{\{time\.now\}\s*\+\s*\{([^{}]{1,160})\}\}/g, (_, token) => {
      const plainToken = token.trim().replace(/\|countdown$/, "");
      const resolved = variableEntity(runtime, plainToken);
      if (resolved?.field !== "state") return "—";
      const legacyToken =
        plainToken.startsWith("capability.") ||
        plainToken.startsWith("entity.");
      const timing = durationEndAt(resolved.entity, now, legacyToken);
      return timing ? clockTime(timing.endAt) : "—";
    })
    .replace(/\{([^{}]{1,160})\}/g, (_, token) => {
      const [variable, ...fallback] = token.split(/\s+\|\s+/);
      const resolved = runtimeVariable(runtime, variable.trim(), now);
      return resolved === "—" && fallback.length
        ? fallback.join(" | ").slice(0, 60)
        : resolved;
    })
    .slice(0, 180);
}

export function resolveWasherRuntime(effect, deviceEntity, statusDisplay) {
  const configured = Boolean(statusDisplay?.statusCapabilityId);
  if (
    !configured &&
    !["top-load-washer", "capability-runtime"].includes(effect?.type)
  )
    return null;
  const entities = deviceEntity?.deviceEntities ?? [];
  const bindings = deviceEntity?.deviceCapabilityBindings ?? {};
  const boundEntity = (capabilityId) =>
    entities.find((entity) => entity.entityId === bindings[capabilityId]?.[0]);
  const status =
    boundEntity(
      statusDisplay?.statusCapabilityId || effect?.statusCapabilityId,
    ) ??
    deviceEntity?.deviceOperationalState ??
    entities.find((entity) => /_running_status$/.test(entity.entityId));
  const remaining =
    boundEntity(
      statusDisplay?.remainingCapabilityId || effect?.remainingCapabilityId,
    ) ??
    entities.find((entity) =>
      /_(?:remain_time|remaining_time)$/.test(entity.entityId),
    );
  const state = String(status?.state ?? "")
    .trim()
    .toLowerCase();
  const activeStates = String(
    configured
      ? (statusDisplay.runningStates ?? []).join(",")
      : (effect?.activeStates ?? DEFAULT_ACTIVE_STATES),
  )
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  const animationStates = String(effect?.activeStates ?? DEFAULT_ACTIVE_STATES)
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  const rawRemaining = Number(remaining?.state);
  const remainingMinutes =
    Number.isFinite(rawRemaining) && rawRemaining >= 0
      ? /^(?:h|hr|hour|hours|小时)$/i.test(
          String(remaining?.attributes?.unit_of_measurement ?? "").trim(),
        )
        ? Math.round(rawRemaining * 60)
        : Math.round(rawRemaining)
      : null;
  return {
    running: activeStates.includes(state),
    animationRunning: animationStates.includes(state),
    state,
    remainingMinutes,
    remainingUpdatedAt: remaining?.lastUpdated,
    // Template-owned display rules take precedence; model fields remain readable for older data.
    titleTemplate: statusDisplay?.titleTemplate ?? effect?.titleTemplate,
    statusTemplate:
      statusDisplay?.runningTemplate ??
      statusDisplay?.statusTemplate ??
      effect?.statusTemplate,
    idleTemplate: statusDisplay?.idleTemplate,
    deviceName:
      deviceEntity?.deviceDisplayName ??
      deviceEntity?.name ??
      deviceEntity?.entityId,
    statusEntity: status,
    remainingEntity: remaining,
    deviceEntities: entities,
    capabilityBindings: bindings,
    capabilityNames: deviceEntity?.deviceCapabilityNames ?? {},
    statusEntityId: status?.entityId,
    remainingEntityId: remaining?.entityId,
  };
}

export function washerRuntimeLabel(runtime, now = Date.now()) {
  if (!runtime?.running)
    return runtime?.idleTemplate
      ? renderRuntimeTemplate(runtime.idleTemplate, runtime, now)
      : null;
  if (!runtime.statusTemplate && runtime.remainingMinutes === null)
    return "洗衣中";
  if (runtime.statusTemplate)
    return renderRuntimeTemplate(runtime.statusTemplate, runtime, now);
  return `剩余 ${runtime.remainingMinutes} 分钟 · 预计 ${clockTime(now + runtime.remainingMinutes * 60_000)} 结束`;
}

export function washerRuntimeTitle(runtime, fallback, now = Date.now()) {
  if (!runtime?.running && !runtime?.idleTemplate) return fallback;
  if (!runtime.titleTemplate) return fallback;
  return renderRuntimeTemplate(runtime.titleTemplate, runtime, now);
}
