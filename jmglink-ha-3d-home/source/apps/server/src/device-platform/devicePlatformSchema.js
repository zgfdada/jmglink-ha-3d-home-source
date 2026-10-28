import { normalizeControlValues } from "../../../../packages/schema/src/control-library.js";
import {
  normalizeLibraryControl,
  resolveLibraryControl,
} from "../../../../packages/schema/src/control-library.js";
import {CAMERA_MODELS} from '../../../../packages/schema/src/camera-models.js';
const ID_PATTERN = /^[a-z0-9][a-z0-9._-]{1,127}$/;
const ENTITY_ID_PATTERN = /^[a-z0-9_]+\.[a-z0-9_]+$/;

const text = (value, fallback = "") =>
  typeof value === "string" && value.trim() ? value.trim() : fallback;
const finite = (value, fallback, min = -Infinity, max = Infinity) =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.min(max, Math.max(min, value))
    : fallback;
const stringList = (value) =>
  Array.isArray(value)
    ? [...new Set(value.map((item) => text(item)).filter(Boolean))]
    : [];
const record = (value) =>
  value && typeof value === "object" && !Array.isArray(value) ? value : {};

export const CAPABILITY_KINDS = [
  "status",
  "toggle",
  "number",
  "enum",
  "action",
  "text",
  "image",
  "media",
];
export const CONTROL_TYPES = [
  "status",
  "toggle",
  "slider",
  "number",
  "select",
  "button",
  "progress",
  "text",
  "image",
  "icon",
  "stats",
  "richtext",
  "divider",
  "container",
];
const PANEL_VARIANTS = {
  toggle: ["switch", "segmented", "power"],
  button: ["full", "pill", "icon"],
  slider: ["track", "steps", "compact"],
  number: ["input", "stepper", "metric"],
  progress: ["line", "steps", "circle"],
  status: ["row", "badge", "dot"],
  text: ["plain", "callout", "quote"],
  icon: ["tile", "circle", "chip"],
  stats: ["row", "metric", "compact"],
  richtext: ["paragraph", "callout", "quote"],
  divider: ["line", "dashed", "dotted"],
  container: ["frame", "header", "inset"],
};
export const MODEL_SOURCE_TYPES = ["procedural", "upload"];
export const MODEL_PLACEMENTS = ["floor", "wall", "ceiling", "surface"];

const STANDARD_SERVICES = {
  toggle: {
    switch: {
      on: "switch.turn_on",
      off: "switch.turn_off",
      toggle: "switch.toggle",
    },
    input_boolean: {
      on: "input_boolean.turn_on",
      off: "input_boolean.turn_off",
      toggle: "input_boolean.toggle",
    },
  },
  enum: { select: { set: "select.select_option" } },
  number: { number: { set: "number.set_value" } },
  action: { button: { press: "button.press" } },
};

function normalizeServiceMap(value, kind, allowedDomains) {
  const source = record(value);
  const result = {};
  for (const [action, service] of Object.entries(source)) {
    if (
      typeof service !== "string" ||
      !/^[a-z0-9_]+\.[a-z0-9_]+$/.test(service)
    )
      continue;
    const [domain] = service.split(".");
    if (!allowedDomains.includes(domain)) continue;
    const standardServices = Object.values(
      STANDARD_SERVICES[kind]?.[domain] ?? {},
    );
    if (!standardServices.includes(service)) continue;
    result[action] = service;
  }
  if (Object.keys(result).length) return result;
  for (const domain of allowedDomains) {
    const defaults = STANDARD_SERVICES[kind]?.[domain];
    if (defaults) return defaults;
  }
  return {};
}

export function normalizeCapability(value, index = 0) {
  const source = record(value);
  const normalizedCapabilityId = text(
    source.capabilityId,
    `capability-${index + 1}`,
  )
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const capabilityId = normalizedCapabilityId || `capability-${index + 1}`;
  const kind = CAPABILITY_KINDS.includes(source.kind) ? source.kind : "status";
  const allowedDomains = stringList(source.allowedDomains).filter((domain) =>
    /^[a-z0-9_]+$/.test(domain),
  );
  return {
    capabilityId,
    name: text(source.name, capabilityId),
    kind,
    group: ["core", "status", "advanced"].includes(source.group)
      ? source.group
      : ["toggle", "enum", "action"].includes(kind)
        ? "core"
        : "status",
    dataType: ["boolean", "number", "string", "enum", "image"].includes(
      source.dataType,
    )
      ? source.dataType
      : "string",
    access: ["read", "write", "action", "read-write"].includes(source.access)
      ? source.access
      : kind === "status"
        ? "read"
        : kind === "action"
          ? "action"
          : "read-write",
    allowedDomains,
    required: source.required === true,
    multiple: source.multiple === true,
    unit: text(source.unit) || undefined,
    defaultControl: CONTROL_TYPES.includes(source.defaultControl)
      ? source.defaultControl
      : kind === "toggle"
        ? "toggle"
        : kind === "enum"
          ? "select"
          : kind === "number"
            ? "slider"
            : kind === "action"
              ? "button"
              : "status",
    matchKeywords: stringList(source.matchKeywords),
    enumValues: (Array.isArray(source.enumValues) ? source.enumValues : [])
      .filter(
        (item) => item && typeof item.value === "string" && item.value.trim(),
      )
      .map((item) => ({
        label: text(item.label, item.value).slice(0, 100),
        value: item.value.trim().slice(0, 160),
        source: item.source === "ha" ? "ha" : "manual",
        ...(["custom", "ha", "fallback", "raw"].includes(item.labelSource)
          ? { labelSource: item.labelSource }
          : {}),
        status:
          item.source === "ha" && ["new", "missing"].includes(item.status)
            ? item.status
            : "valid",
      }))
      .filter(
        (item, index, values) =>
          values.findIndex((other) => other.value === item.value) === index,
      ),
    services: normalizeServiceMap(source.services, kind, allowedDomains),
  };
}

function normalizeMatchRules(value) {
  const source = record(value);
  return {
    manufacturers: stringList(source.manufacturers),
    models: stringList(source.models),
    names: stringList(source.names),
    integrations: stringList(source.integrations),
    entityDomains: stringList(source.entityDomains),
    deviceClasses: stringList(source.deviceClasses),
    keywords: stringList(source.keywords),
  };
}

export function normalizeDeviceTemplate(value, { builtin = false } = {}) {
  const source = record(value);
  const statusDisplay = record(source.statusDisplay);
  const runtimeDisplay = record(source.runtimeDisplay);
  const appearance = record(source.appearance);
  const appearanceDimensions = record(appearance.dimensions);
  const appearanceAnchor = record(appearance.anchor);
  const animation = record(appearance.animation);
  const id = text(source.id).toLowerCase();
  if (!ID_PATTERN.test(id))
    throw new Error("设备模板 ID 只能包含小写字母、数字、点、下划线和连字符");
  const capabilities = (
    Array.isArray(source.capabilities) ? source.capabilities : []
  ).map(normalizeCapability);
  const capabilityIds = new Set();
  for (const capability of capabilities) {
    if (capabilityIds.has(capability.capabilityId))
      throw new Error(`设备模板包含重复能力：${capability.capabilityId}`);
    capabilityIds.add(capability.capabilityId);
  }
  return {
    id,
    name: text(source.name, id),
    category: text(source.category, "generic"),
    subCategory: text(source.subCategory) || undefined,
    manufacturer: text(source.manufacturer) || undefined,
    model: text(source.model) || undefined,
    icon: text(source.icon, "mdi:devices"),
    description: text(source.description),
    builtin,
    enabled: source.enabled !== false,
    version: Math.max(1, Math.floor(finite(source.version, 1, 1))),
    matchRules: normalizeMatchRules(source.matchRules),
    capabilities,
    statusDisplay:
      typeof statusDisplay.titleTemplate === "string" ||
      typeof statusDisplay.statusTemplate === "string"
        ? {
            titleTemplate:
              typeof statusDisplay.titleTemplate === "string"
                ? statusDisplay.titleTemplate.trim().slice(0, 160)
                : undefined,
            statusTemplate:
              typeof statusDisplay.statusTemplate === "string"
                ? statusDisplay.statusTemplate.trim().slice(0, 240)
                : undefined,
          }
        : undefined,
    runtimeDisplay:
      source.runtimeDisplay && typeof source.runtimeDisplay === "object"
        ? {
            statusCapabilityId: text(runtimeDisplay.statusCapabilityId),
            remainingCapabilityId: text(runtimeDisplay.remainingCapabilityId),
            runningStates: stringList(runtimeDisplay.runningStates).slice(
              0,
              50,
            ),
            endingStates: stringList(runtimeDisplay.endingStates).slice(0, 50),
            titleTemplate: String(runtimeDisplay.titleTemplate ?? "").slice(
              0,
              160,
            ),
            idleTemplate: String(runtimeDisplay.idleTemplate ?? "").slice(
              0,
              240,
            ),
            runningTemplate: String(runtimeDisplay.runningTemplate ?? "").slice(
              0,
              240,
            ),
          }
        : undefined,
    appearance:
      source.appearance && typeof source.appearance === "object"
        ? {
            dimensions: {
              width: finite(appearanceDimensions.width, 0.62, 0.05, 20),
              depth: finite(appearanceDimensions.depth, 0.68, 0.05, 20),
              height: finite(appearanceDimensions.height, 0.85, 0.05, 20),
            },
            scale: finite(appearance.scale, 1, 0.01, 100),
            placement: MODEL_PLACEMENTS.includes(appearance.placement)
              ? appearance.placement
              : "floor",
            elevation: finite(appearance.elevation, 0, 0, 12),
            anchor: {
              x: finite(appearanceAnchor.x, 0, -20, 20),
              y: finite(appearanceAnchor.y, 0, -20, 20),
              z: finite(appearanceAnchor.z, 0, -20, 20),
            },
            color: /^#[0-9a-f]{6}$/i.test(appearance.color)
              ? appearance.color
              : "#e8edf2",
            colorOverride: appearance.colorOverride === true,
            materialColors: Object.fromEntries(
              Object.entries(record(appearance.materialColors))
                .filter(
                  ([sourceColor, targetColor]) =>
                    /^#[0-9a-f]{6}$/i.test(sourceColor) &&
                    /^#[0-9a-f]{6}$/i.test(targetColor),
                )
                .slice(0, 100)
                .map(([sourceColor, targetColor]) => [
                  sourceColor.toLowerCase(),
                  targetColor.toLowerCase(),
                ]),
            ),
            metalness: finite(appearance.metalness, 0.08, 0, 1),
            metalnessOverride: appearance.metalnessOverride === true,
            roughness: finite(appearance.roughness, 0.62, 0, 1),
            roughnessOverride: appearance.roughnessOverride === true,
            animation: {
              statusCapabilityId: text(animation.statusCapabilityId),
              remainingCapabilityId: text(animation.remainingCapabilityId),
              activeStates: stringList(animation.activeStates).slice(0, 50),
            },
          }
        : undefined,
    modelTemplateId: text(source.modelTemplateId) || undefined,
    controlPanelTemplateId: text(source.controlPanelTemplateId) || undefined,
    createdAt: text(source.createdAt, new Date().toISOString()),
    updatedAt: new Date().toISOString(),
  };
}

export function normalizeModelTemplate(
  value,
  { builtin = false, sourceOverride } = {},
) {
  const source = record(value);
  const id = text(source.id).toLowerCase();
  if (!ID_PATTERN.test(id)) throw new Error("模型模板 ID 格式无效");
  const dimensions = record(source.dimensions);
  const anchor = record(source.anchor);
  const library = record(source.library);
  const runtimeEffect = record(source.runtimeEffect);
  const modelSource = sourceOverride ?? record(source.source);
  const sourceType = MODEL_SOURCE_TYPES.includes(modelSource.type)
    ? modelSource.type
    : "procedural";
  return {
    id,
    name: text(source.name, id),
    deviceTemplateId: text(source.deviceTemplateId) || undefined,
    builtin,
    enabled: source.enabled !== false,
    furnitureEnabled: source.furnitureEnabled === true,
    furnitureKind: text(source.furnitureKind) || undefined,
    tags: stringList(source.tags).slice(0, 12),
    source: {
      type: sourceType,
      shape:
        sourceType === "procedural"
          ? text(modelSource.shape, "box")
          : undefined,
      url: sourceType === "upload" ? text(modelSource.url) : undefined,
      fileName:
        sourceType === "upload" ? text(modelSource.fileName) : undefined,
      mimeType:
        sourceType === "upload" ? text(modelSource.mimeType) : undefined,
    },
    dimensions: {
      width: finite(dimensions.width, 0.62, 0.05, 20),
      depth: finite(dimensions.depth, 0.68, 0.05, 20),
      height: finite(dimensions.height, 0.85, 0.05, 20),
    },
    scale: finite(source.scale, 1, 0.01, 100),
    anchor: {
      x: finite(anchor.x, 0, -20, 20),
      y: finite(anchor.y, 0, -20, 20),
      z: finite(anchor.z, 0, -20, 20),
    },
    placement: MODEL_PLACEMENTS.includes(source.placement)
      ? source.placement
      : "floor",
    elevation: finite(source.elevation, 0, 0, 12),
    color: /^#[0-9a-f]{6}$/i.test(source.color) ? source.color : "#e8edf2",
    roughness: finite(source.roughness, 0.62, 0, 1),
    metalness: finite(source.metalness, 0.08, 0, 1),
    runtimeEffect:
      runtimeEffect.type === "top-load-washer"
        ? {
            type: "top-load-washer",
            statusCapabilityId:
              text(runtimeEffect.statusCapabilityId) || undefined,
            remainingCapabilityId:
              text(runtimeEffect.remainingCapabilityId) || undefined,
            titleTemplate:
              typeof runtimeEffect.titleTemplate === "string"
                ? runtimeEffect.titleTemplate.trim().slice(0, 160)
                : undefined,
            statusTemplate:
              typeof runtimeEffect.statusTemplate === "string"
                ? runtimeEffect.statusTemplate.trim().slice(0, 240)
                : undefined,
            activeStates:
              typeof runtimeEffect.activeStates === "string"
                ? runtimeEffect.activeStates.trim()
                : "work,working,running,washing,rinse,rinsing,spin,spinning,on",
          }
        : undefined,
    library:
      text(library.repository) && text(library.id)
        ? {
            repository: text(library.repository),
            id: text(library.id),
            version: text(library.version, "1.0.0"),
            sha256: /^[a-f0-9]{64}$/i.test(library.sha256)
              ? library.sha256.toLowerCase()
              : undefined,
          }
        : undefined,
    createdAt: text(source.createdAt, new Date().toISOString()),
    updatedAt: new Date().toISOString(),
  };
}

export function normalizePanelControl(value, index = 0) {
  const source = record(value);
  const grid = record(source.grid);
  const width = Math.round(finite(grid.w, 2, 1, 4));
  const type = CONTROL_TYPES.includes(source.type) ? source.type : "status";
  return {
    id: text(source.id, `control-${index + 1}`)
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, "-"),
    type,
    label: text(source.label, "控件"),
    capabilityId: text(source.capabilityId),
    grid: {
      x: Math.round(finite(grid.x, 0, 0, 4 - width)),
      y: Math.round(finite(grid.y, index, 0, 100)),
      w: width,
    },
    ...(resolveLibraryControl(source)
      ? (() => {
          const definition = normalizeLibraryControl(
            resolveLibraryControl(source),
          );
          if (definition.type !== type)
            throw new Error("控件库快照与控件类型不一致");
          return {
            libraryControlId: definition.id,
            libraryControlVersion: definition.version,
            libraryDefinition: definition,
          };
        })()
      : {}),
    props: normalizeControlValues(
      resolveLibraryControl(source),
      source.props || {},
    ),
    optionSource: source.optionSource === "custom" ? "custom" : "ha",
    optionOverrides: (Array.isArray(source.optionOverrides)
      ? source.optionOverrides
      : []
    )
      .slice(0, 100)
      .map((item, optionIndex) => ({
        value: text(item?.value),
        label: text(item?.label),
        hidden: item?.hidden === true,
        order: finite(item?.order, optionIndex, 0, 100),
      }))
      .filter((item) => item.value),
    icon: text(source.icon) || undefined,
    content: text(source.content) || undefined,
    variant: PANEL_VARIANTS[type]?.includes(source.variant)
      ? source.variant
      : undefined,
    selectStyle:
      type === "select"
        ? ["radio", "grid"].includes(source.selectStyle)
          ? source.selectStyle
          : "dropdown"
        : undefined,
    unit: text(source.unit) || undefined,
    min: typeof source.min === "number" ? source.min : undefined,
    max: typeof source.max === "number" ? source.max : undefined,
    step: typeof source.step === "number" ? source.step : undefined,
    visibleWhen: text(source.visibleWhen) || undefined,
    confirm: source.confirm === true,
  };
}

export function normalizeControlPanelTemplate(value, { builtin = false } = {}) {
  const source = record(value);
  const id = text(source.id).toLowerCase();
  if (!ID_PATTERN.test(id)) throw new Error("控制面板模板 ID 格式无效");
  const sections = (Array.isArray(source.sections) ? source.sections : []).map(
    (rawSection, sectionIndex) => {
      const section = record(rawSection);
      return {
        id: text(section.id, `section-${sectionIndex + 1}`)
          .toLowerCase()
          .replace(/[^a-z0-9._-]+/g, "-"),
        title: text(section.title, `分组 ${sectionIndex + 1}`),
        controls: (Array.isArray(section.controls) ? section.controls : []).map(
          normalizePanelControl,
        ),
      };
    },
  );
  return {
    id,
    name: text(source.name, id),
    deviceTemplateId: text(source.deviceTemplateId) || undefined,
    builtin,
    enabled: source.enabled !== false,
    layoutMode: source.layoutMode === "grid" ? "grid" : "stack",
    sections,
    createdAt: text(source.createdAt, new Date().toISOString()),
    updatedAt: new Date().toISOString(),
  };
}

export function normalizeDeviceBinding(value) {
  const source = record(value);
  const deviceId = text(source.deviceId);
  if (!deviceId) throw new Error("设备绑定缺少 deviceId");
  const capabilityBindings = {};
  for (const [capabilityId, rawIds] of Object.entries(
    record(source.capabilityBindings),
  )) {
    const ids = (Array.isArray(rawIds) ? rawIds : [rawIds]).filter(
      (id) => typeof id === "string" && ENTITY_ID_PATTERN.test(id),
    );
    if (ids.length) capabilityBindings[capabilityId] = [...new Set(ids)];
  }
  const selectedEntityIds = stringList(source.selectedEntityIds).filter((id) =>
    ENTITY_ID_PATTERN.test(id),
  );
  const capabilityMappings = {};
  for (const [capabilityId, raw] of Object.entries(
    record(source.capabilityMappings),
  )) {
    if (!ID_PATTERN.test(capabilityId)) continue;
    const mapping = record(raw);
    if (!ENTITY_ID_PATTERN.test(mapping.entityId ?? "")) continue;
    const attribute = text(mapping.attribute, "state");
    if (!/^[a-zA-Z_][a-zA-Z0-9_]{0,79}$/.test(attribute)) continue;
    capabilityMappings[capabilityId] = {
      entityId: mapping.entityId,
      attribute,
    };
  }
  const entityRegistryRefs = (
    Array.isArray(source.entityRegistryRefs) ? source.entityRegistryRefs : []
  )
    .map((item) => ({
      registryId: text(item?.registryId),
      entityId: text(item?.entityId),
    }))
    .filter((item) => item.registryId && ENTITY_ID_PATTERN.test(item.entityId));
  return {
    deviceId,
    deviceTemplateId: text(source.deviceTemplateId) || undefined,
    capabilityBindings,
    capabilityMappings,
    mappingMode: source.mappingMode === "explicit" ? "explicit" : undefined,
    selectedEntityIds,
    entityRegistryRefs,
    modelTemplateId: text(source.modelTemplateId) || undefined,
    controlPanelTemplateId: text(source.controlPanelTemplateId) || undefined,
    updatedAt: new Date().toISOString(),
  };
}

const washingCapabilities = [
  {
    capabilityId: "power",
    name: "电源",
    kind: "toggle",
    dataType: "boolean",
    allowedDomains: ["switch"],
    defaultControl: "toggle",
    matchKeywords: ["power", "switch", "电源", "开关"],
  },
  {
    capabilityId: "status",
    name: "运行阶段",
    kind: "status",
    dataType: "string",
    allowedDomains: ["sensor"],
    defaultControl: "status",
    matchKeywords: ["status", "state", "stage", "状态", "阶段"],
  },
  {
    capabilityId: "remaining_time",
    name: "剩余时间",
    kind: "status",
    dataType: "number",
    allowedDomains: ["sensor"],
    unit: "min",
    defaultControl: "progress",
    matchKeywords: ["remaining", "remain", "left time", "剩余"],
  },
  {
    capabilityId: "program",
    name: "洗涤程序",
    kind: "enum",
    dataType: "enum",
    allowedDomains: ["select"],
    defaultControl: "select",
    matchKeywords: ["program", "mode", "course", "程序", "模式"],
  },
  {
    capabilityId: "temperature",
    name: "洗涤温度",
    kind: "enum",
    dataType: "enum",
    allowedDomains: ["select", "number"],
    unit: "°C",
    defaultControl: "select",
    matchKeywords: ["temperature", "temp", "温度"],
  },
  {
    capabilityId: "spin_speed",
    name: "脱水转速",
    kind: "enum",
    dataType: "enum",
    allowedDomains: ["select", "number"],
    unit: "rpm",
    defaultControl: "select",
    matchKeywords: ["spin", "speed", "转速", "脱水"],
  },
  {
    capabilityId: "delay",
    name: "预约时间",
    kind: "number",
    dataType: "number",
    allowedDomains: ["number"],
    unit: "h",
    defaultControl: "number",
    matchKeywords: ["delay", "reserve", "预约"],
  },
  {
    capabilityId: "door",
    name: "舱门",
    kind: "status",
    dataType: "boolean",
    allowedDomains: ["binary_sensor"],
    defaultControl: "status",
    matchKeywords: ["door", "舱门", "机门"],
  },
  {
    capabilityId: "fault",
    name: "故障",
    kind: "status",
    dataType: "string",
    allowedDomains: ["sensor", "binary_sensor"],
    defaultControl: "status",
    matchKeywords: ["fault", "error", "problem", "故障", "错误"],
  },
  {
    capabilityId: "power_usage",
    name: "功耗",
    kind: "status",
    dataType: "number",
    allowedDomains: ["sensor"],
    unit: "W",
    defaultControl: "status",
    matchKeywords: ["power usage", "power", "功耗", "功率"],
  },
  {
    capabilityId: "start",
    name: "启动",
    kind: "action",
    dataType: "boolean",
    allowedDomains: ["button"],
    defaultControl: "button",
    matchKeywords: ["start", "启动", "开始"],
  },
  {
    capabilityId: "pause",
    name: "暂停",
    kind: "action",
    dataType: "boolean",
    allowedDomains: ["button"],
    defaultControl: "button",
    matchKeywords: ["pause", "暂停"],
  },
  {
    capabilityId: "reset",
    name: "复位",
    kind: "action",
    dataType: "boolean",
    allowedDomains: ["button"],
    defaultControl: "button",
    matchKeywords: ["reset", "复位", "重置"],
  },
];

export function builtinDeviceTemplates() {
  return [
    normalizeDeviceTemplate(
      {
        id: "builtin.generic",
        name: "通用设备",
        category: "generic",
        icon: "mdi:devices",
        description: "无法识别类型时使用的基础设备模板",
        modelTemplateId: "builtin.generic",
        controlPanelTemplateId: "builtin.generic",
      },
      { builtin: true },
    ),
    normalizeDeviceTemplate(
      {
        id: "builtin.washing-machine",
        name: "洗衣机",
        category: "appliance",
        icon: "mdi:washing-machine",
        description: "多实体洗衣机完整参考模板",
        matchRules: {
          keywords: ["washing machine", "washer", "洗衣机"],
          names: ["离线开发 · 洗衣机"],
        },
        capabilities: washingCapabilities,
        modelTemplateId: "builtin.washing-machine",
        controlPanelTemplateId: "builtin.washing-machine",
      },
      { builtin: true },
    ),
  ];
}

export function builtinModelTemplates() {
  return [
    ...CAMERA_MODELS.map(model=>normalizeModelTemplate({id:`builtin.${model.id}`,name:model.name,source:{type:"procedural",shape:model.shape},dimensions:model.dimensions,placement:model.placement,color:"#eef2f5",tags:["摄像头","camera"],furnitureEnabled:true},{builtin:true})),
    normalizeModelTemplate(
      {
        id: "builtin.generic",
        name: "通用设备模型",
        source: { type: "procedural", shape: "box" },
      },
      { builtin: true },
    ),
    normalizeModelTemplate(
      {
        id: "builtin.washing-machine",
        name: "洗衣机基础模型",
        deviceTemplateId: "builtin.washing-machine",
        source: { type: "procedural", shape: "washing-machine" },
        dimensions: { width: 0.6, depth: 0.65, height: 0.85 },
        placement: "floor",
        color: "#eef2f5",
      },
      { builtin: true },
    ),
  ];
}

export function starterCustomModelTemplates() {
  return [
    {
      id: "custom.pipeline-water-dispenser",
      name: "管线机",
      shape: "pipeline-water-dispenser",
      dimensions: { width: 0.34, depth: 0.31, height: 0.48 },
      placement: "wall",
      color: "#f1f3f5",
    },
    {
      id: "custom.water-purifier",
      name: "净水器",
      shape: "water-purifier",
      dimensions: { width: 0.42, depth: 0.2, height: 0.46 },
      placement: "surface",
      color: "#edf2f5",
    },
    {
      id: "custom.gas-water-heater",
      name: "燃气热水器",
      shape: "gas-water-heater",
      dimensions: { width: 0.38, depth: 0.16, height: 0.62 },
      placement: "wall",
      color: "#f2f3f4",
    },
    {
      id: "custom.wifi-router",
      name: "WiFi 路由器",
      shape: "wifi-router",
      dimensions: { width: 0.26, depth: 0.18, height: 0.07 },
      placement: "surface",
      color: "#f4f5f7",
    },
  ].map((model) =>
    normalizeModelTemplate(
      {
        id: model.id,
        name: model.name,
        source: { type: "procedural", shape: model.shape },
        dimensions: model.dimensions,
        placement: model.placement,
        color: model.color,
        furnitureEnabled: true,
      },
      { builtin: false },
    ),
  );
}

export function builtinControlPanelTemplates() {
  return [
    normalizeControlPanelTemplate(
      {
        id: "builtin.generic",
        name: "通用状态面板",
        sections: [
          {
            id: "status",
            title: "设备状态",
            controls: [
              {
                id: "status",
                type: "status",
                label: "当前状态",
                capabilityId: "status",
              },
            ],
          },
        ],
      },
      { builtin: true },
    ),
    normalizeControlPanelTemplate(
      {
        id: "builtin.washing-machine",
        name: "洗衣机控制面板",
        deviceTemplateId: "builtin.washing-machine",
        sections: [
          {
            id: "overview",
            title: "运行状态",
            controls: [
              {
                id: "status",
                type: "status",
                label: "运行阶段",
                capabilityId: "status",
              },
              {
                id: "remaining",
                type: "progress",
                label: "剩余时间",
                capabilityId: "remaining_time",
                unit: "min",
              },
              {
                id: "door",
                type: "status",
                label: "舱门",
                capabilityId: "door",
              },
              {
                id: "fault",
                type: "status",
                label: "故障",
                capabilityId: "fault",
              },
            ],
          },
          {
            id: "settings",
            title: "洗涤设置",
            controls: [
              {
                id: "power",
                type: "toggle",
                label: "电源",
                capabilityId: "power",
              },
              {
                id: "program",
                type: "select",
                label: "洗涤程序",
                capabilityId: "program",
              },
              {
                id: "temperature",
                type: "select",
                label: "洗涤温度",
                capabilityId: "temperature",
              },
              {
                id: "spin",
                type: "select",
                label: "脱水转速",
                capabilityId: "spin_speed",
              },
              {
                id: "delay",
                type: "number",
                label: "预约时间",
                capabilityId: "delay",
                unit: "h",
              },
            ],
          },
          {
            id: "actions",
            title: "操作",
            controls: [
              {
                id: "start",
                type: "button",
                label: "启动",
                capabilityId: "start",
                confirm: true,
              },
              {
                id: "pause",
                type: "button",
                label: "暂停",
                capabilityId: "pause",
              },
              {
                id: "reset",
                type: "button",
                label: "复位",
                capabilityId: "reset",
                confirm: true,
              },
            ],
          },
        ],
      },
      { builtin: true },
    ),
  ];
}
