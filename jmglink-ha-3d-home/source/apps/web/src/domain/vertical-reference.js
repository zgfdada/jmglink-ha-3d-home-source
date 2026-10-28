import { cameraModelDefinition } from "../../../../packages/schema/src/camera-models.js";
import {
  resolveDeviceModelFootprint,
  resolveLiveDeviceModel,
} from "./device-platform-presentation.js";

const TARGET_TYPES = new Set(["floor", "ceiling", "device", "furniture"]);

const finite = (value, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

export function normalizeVerticalReference(value, legacyOffset = 0) {
  const source = value && typeof value === "object" ? value : {};
  const targetType = TARGET_TYPES.has(source.targetType)
    ? source.targetType
    : "floor";
  return {
    targetType,
    targetId:
      ["floor", "ceiling"].includes(targetType) ||
      typeof source.targetId !== "string"
        ? undefined
        : source.targetId,
    surface: source.surface === "bottom" ? "bottom" : "top",
    offset: finite(source.offset, legacyOffset),
  };
}

const BUILTIN_DEVICE_MODEL_HEIGHTS = {
  "climate.floor_ac": 1.08,
};

const defaultDeviceScaleY = (modelId, presentation = false) => {
  if (!modelId) return 1;
  if (
    [
      "light.strip",
      "cover.curtain",
      "cover.blind",
      "media_player.tv",
      "climate.central_ac",
    ].includes(modelId)
  )
    return 1.16;
  if (
    ["light.floor_lamp", "climate.floor_ac", "fan.floor", "fan.tower"].includes(
      modelId,
    )
  )
    return presentation ? 1.18 : 1.12;
  if (modelId === "vacuum.robot") return presentation ? 1.24 : 1.22;
  if (modelId === "light.downlight") return 1;
  if (
    [
      "light.ceiling_panel",
      "light.ceiling_round",
      "light.wall_sconce",
    ].includes(modelId)
  )
    return presentation ? 1.06 : 1.04;
  if (
    [
      "binary_sensor.motion",
      "binary_sensor.presence",
      "binary_sensor.smoke",
    ].includes(modelId)
  )
    return presentation ? 1.26 : 1.34;
  if (modelId === "lock.door") return presentation ? 1.18 : 1.28;
  if (String(modelId ?? "").startsWith("camera."))
    return presentation ? 0.94 : 1.02;
  if (String(modelId ?? "").startsWith("sensor."))
    return presentation ? 1.1 : 1.24;
  return presentation ? 1.12 : 1.24;
};

export function objectVerticalHeight(item, entity, options = {}) {
  const configuredModel =
    resolveLiveDeviceModel(entity, item) ?? item?.customModel;
  if (configuredModel?.dimensions?.height) {
    const placedScaleY = Number(item?.scale?.[1]);
    const isDevice = Array.isArray(item?.position) && item.position.length >= 3;
    const instanceScaleY = Number.isFinite(placedScaleY)
      ? Math.abs(placedScaleY)
      : isDevice
        ? defaultDeviceScaleY(item?.modelId, options.presentation)
        : 1;
    return Math.max(
      0,
      finite(configuredModel.dimensions.height) *
        finite(configuredModel.scale, 1) *
        instanceScaleY,
    );
  }
  const modelId = item?.modelId;
  const cameraModel = cameraModelDefinition(modelId);
  if (cameraModel) {
    const scale = Number(item?.scale?.[1]);
    return (
      cameraModel.dimensions.height *
      (Number.isFinite(scale)
        ? Math.abs(scale)
        : defaultDeviceScaleY(modelId, options.presentation))
    );
  }
  if (BUILTIN_DEVICE_MODEL_HEIGHTS[modelId]) {
    const placedScaleY = Number(item?.scale?.[1]);
    const scaleY = Number.isFinite(placedScaleY)
      ? Math.abs(placedScaleY)
      : defaultDeviceScaleY(modelId, options.presentation);
    return BUILTIN_DEVICE_MODEL_HEIGHTS[modelId] * scaleY;
  }
  return Math.max(0, finite(item?.height, 0.3));
}

const objectKey = (type, id) => `${type}:${id}`;

/** Resolve every device/furniture bottom elevation, including chained references. */
export function resolveFloorVerticalElevations(
  floor,
  entities = {},
  options = {},
) {
  const nodes = new Map();
  for (const item of floor?.devices ?? []) {
    nodes.set(objectKey("device", item.id), {
      item,
      type: "device",
      entity: entities[item.entityId],
      legacy: finite(item.position?.[1], 0),
    });
  }
  for (const item of floor?.furniture ?? []) {
    nodes.set(objectKey("furniture", item.id), {
      item,
      type: "furniture",
      legacy: finite(item.elevation, 0),
    });
  }

  const resolved = new Map();
  const visiting = new Set();
  const resolve = (key) => {
    if (resolved.has(key)) return resolved.get(key);
    const node = nodes.get(key);
    if (!node) return 0;
    if (visiting.has(key)) {
      resolved.set(key, node.legacy);
      return node.legacy;
    }
    visiting.add(key);
    const constrain = (value) =>
      node.type === "device" &&
      (node.item.kind === "camera" || node.entity?.domain === "camera")
        ? Math.min(
            Math.max(0, value),
            Math.max(
              0,
              finite(floor.height, 2.8) -
                objectVerticalHeight(node.item, node.entity, options),
            ),
          )
        : value;
    if (!node.item.verticalReference) {
      const elevation = constrain(node.legacy);
      resolved.set(key, elevation);
      visiting.delete(key);
      return elevation;
    }
    const reference = normalizeVerticalReference(
      node.item.verticalReference,
      node.legacy,
    );
    let base =
      reference.targetType === "ceiling"
        ? finite(floor.height, 2.8) -
          objectVerticalHeight(node.item, node.entity, options)
        : 0;
    if (
      !["floor", "ceiling"].includes(reference.targetType) &&
      reference.targetId
    ) {
      const targetKey = objectKey(reference.targetType, reference.targetId);
      const target = nodes.get(targetKey);
      if (target && targetKey !== key) {
        base = resolve(targetKey);
        if (reference.surface === "top")
          base += objectVerticalHeight(target.item, target.entity, options);
      }
    }
    const elevation = constrain(base + reference.offset);
    resolved.set(key, elevation);
    visiting.delete(key);
    return elevation;
  };
  for (const key of nodes.keys()) resolve(key);
  return resolved;
}

export function getObjectVerticalElevation(
  floor,
  type,
  id,
  entities = {},
  options = {},
) {
  return (
    resolveFloorVerticalElevations(floor, entities, options).get(
      objectKey(type, id),
    ) ?? 0
  );
}

/** Change reference while preserving the current world-space bottom elevation. */
export function rebaseVerticalReference(
  floor,
  type,
  id,
  targetType,
  targetId,
  surface,
  entities = {},
  options = {},
) {
  const elevations = resolveFloorVerticalElevations(floor, entities, options);
  const current = elevations.get(objectKey(type, id)) ?? 0;
  const currentItem = (
    type === "device" ? floor.devices : floor.furniture
  )?.find((item) => item.id === id);
  let targetElevation =
    targetType === "ceiling"
      ? finite(floor.height, 2.8) -
        objectVerticalHeight(
          currentItem,
          type === "device" ? entities[currentItem?.entityId] : undefined,
          options,
        )
      : 0;
  if (!["floor", "ceiling"].includes(targetType) && targetId) {
    const target = (
      targetType === "device" ? floor.devices : floor.furniture
    )?.find((item) => item.id === targetId);
    if (target) {
      targetElevation = elevations.get(objectKey(targetType, targetId)) ?? 0;
      if (surface === "top")
        targetElevation += objectVerticalHeight(
          target,
          targetType === "device" ? entities[target.entityId] : undefined,
          options,
        );
    }
  }
  return normalizeVerticalReference({
    targetType,
    targetId,
    surface,
    offset: current - targetElevation,
  });
}

/** Bind directly to a surface. Explicit offsets can still be adjusted afterwards. */
export function bindVerticalReference(targetType, targetId, surface) {
  return normalizeVerticalReference({
    targetType,
    targetId,
    surface,
    offset: 0,
  });
}

export function resolveVerticalReferenceFootprint(type, item, entity) {
  if (!item) return undefined;
  if (type === "furniture") {
    return {
      center: [finite(item.position?.[0]), finite(item.position?.[1])],
      width: Math.max(0.01, finite(item.width, 0.3)),
      depth: Math.max(0.01, finite(item.depth, 0.3)),
      rotation: finite(item.rotation),
    };
  }

  const modelFootprint = resolveDeviceModelFootprint(entity, item),
    rotation = -finite(item.rotation?.[1]),
    cos = Math.cos(rotation),
    sin = Math.sin(rotation),
    localX = finite(modelFootprint?.x),
    localY = finite(modelFootprint?.y);
  return {
    center: [
      finite(item.position?.[0]) + localX * cos - localY * sin,
      finite(item.position?.[2]) + localX * sin + localY * cos,
    ],
    width: Math.max(0.01, finite(modelFootprint?.width, 0.5)),
    depth: Math.max(0.01, finite(modelFootprint?.depth, 0.5)),
    rotation,
  };
}

const footprintCorners = (footprint) => {
  const cos = Math.cos(footprint.rotation),
    sin = Math.sin(footprint.rotation),
    halfWidth = footprint.width / 2,
    halfDepth = footprint.depth / 2;
  return [
    [-halfWidth, -halfDepth],
    [halfWidth, -halfDepth],
    [halfWidth, halfDepth],
    [-halfWidth, halfDepth],
  ].map(([x, y]) => [
    footprint.center[0] + x * cos - y * sin,
    footprint.center[1] + x * sin + y * cos,
  ]);
};

const projection = (corners, axis) => {
  const values = corners.map(
    (corner) => corner[0] * axis[0] + corner[1] * axis[1],
  );
  return [Math.min(...values), Math.max(...values)];
};

/** Return true only when two rotated footprints overlap by area, not just an edge. */
export function verticalReferenceFootprintsOverlap(first, second) {
  if (!first || !second) return false;
  const firstCorners = footprintCorners(first),
    secondCorners = footprintCorners(second),
    axes = [
      first.rotation,
      first.rotation + Math.PI / 2,
      second.rotation,
      second.rotation + Math.PI / 2,
    ].map((angle) => [Math.cos(angle), Math.sin(angle)]);
  return axes.every((axis) => {
    const [firstMin, firstMax] = projection(firstCorners, axis),
      [secondMin, secondMax] = projection(secondCorners, axis);
    return Math.min(firstMax, secondMax) - Math.max(firstMin, secondMin) > 1e-6;
  });
}

export function isVerticalReferenceCandidate({
  candidate,
  candidateType,
  currentItem,
  currentEntity,
  currentId,
  currentType,
  entity,
}) {
  if (!candidate || !currentItem) return false;
  if (candidateType === currentType && candidate.id === currentId) return false;
  if (candidateType === "device") {
    const entityDomain = String(
      entity?.entityId ?? candidate.entityId ?? "",
    ).split(".")[0];
    if (
      candidate.kind === "light" ||
      entity?.domain === "light" ||
      entityDomain === "light" ||
      String(candidate.modelId ?? "").startsWith("light.")
    )
      return false;
  }
  return verticalReferenceFootprintsOverlap(
    resolveVerticalReferenceFootprint(currentType, currentItem, currentEntity),
    resolveVerticalReferenceFootprint(candidateType, candidate, entity),
  );
}

export function verticalReferenceOptionValue(reference) {
  const normalized = normalizeVerticalReference(reference);
  return ["floor", "ceiling"].includes(normalized.targetType)
    ? normalized.targetType
    : `${normalized.targetType}:${normalized.targetId ?? ""}:${normalized.surface}`;
}

export function parseVerticalReferenceOption(value) {
  if (value === "ceiling")
    return { targetType: "ceiling", targetId: undefined, surface: "bottom" };
  if (!value || value === "floor") {
    return { targetType: "floor", targetId: undefined, surface: "top" };
  }
  const [targetType, targetId, surface] = String(value).split(":");
  return {
    targetType: TARGET_TYPES.has(targetType) ? targetType : "floor",
    targetId: targetId || undefined,
    surface: surface === "bottom" ? "bottom" : "top",
  };
}
