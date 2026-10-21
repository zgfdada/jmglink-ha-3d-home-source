export const CURRENT_PROJECT_VERSION = 4;
const isRecord = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
const finite = (value, fallback, min = -Number.MAX_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER) => typeof value === "number" && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
const text = (value, fallback) => typeof value === "string" && value.trim() ? value : fallback;
const vector2 = (value, fallback) => Array.isArray(value) ? [finite(value[0], fallback[0]), finite(value[1], fallback[1])] : fallback;
const vector3 = (value, fallback) => Array.isArray(value) ? [finite(value[0], fallback[0]), finite(value[1], fallback[1]), finite(value[2], fallback[2])] : fallback;
const optionalText = (value) => typeof value === "string" && value.trim() ? value.trim() : undefined;
const supportedAggregations = ["avg", "min", "max", "latest"];
const bindingRoles = {
    environment: ["temperature", "humidity", "pm25", "co2", "voc", "illuminance"],
    lighting: ["main", "ambient", "scene"],
    shade: ["curtain", "blind"],
    security: ["motion", "presence", "doorWindow", "camera", "lock", "alarm"],
};
function normalizeEntityBinding(value) {
    const source = isRecord(value) ? value : {};
    const entityIds = Array.isArray(source.entityIds)
        ? source.entityIds.filter((item) => typeof item === "string" && item.includes(".")).map((item) => item.trim())
        : [];
    if (!entityIds.length)
        return undefined;
    return {
        entityIds: [...new Set(entityIds)],
        aggregation: supportedAggregations.includes(source.aggregation) ? source.aggregation : undefined,
    };
}
function normalizeRoleBindings(value, roles) {
    if (!isRecord(value))
        return undefined;
    const entries = roles
        .map((role) => [role, normalizeEntityBinding(value[role])])
        .filter((entry) => Boolean(entry[1]));
    return entries.length ? Object.fromEntries(entries) : undefined;
}
function normalizeRoomBindings(value) {
    if (!isRecord(value))
        return undefined;
    const bindings = {};
    const environment = normalizeRoleBindings(value.environment, bindingRoles.environment);
    const lighting = normalizeRoleBindings(value.lighting, bindingRoles.lighting);
    const shade = normalizeRoleBindings(value.shade, bindingRoles.shade);
    const security = normalizeRoleBindings(value.security, bindingRoles.security);
    if (environment)
        bindings.environment = environment;
    if (lighting)
        bindings.lighting = lighting;
    if (shade)
        bindings.shade = shade;
    if (security)
        bindings.security = security;
    return Object.keys(bindings).length ? bindings : undefined;
}
function normalizeLightStripPath(value) {
    if (!isRecord(value))
        return undefined;
    const shape = value.shape === "ring" ? "ring" : "line";
    if (!Array.isArray(value.points))
        return undefined;
    const points = value.points.map((point) => vector2(point, [0, 0]));
    const minPoints = shape === "ring" ? 3 : 2;
    return points.length >= minPoints ? { shape, points } : undefined;
}
function normalizeSwitchLightFixtures(value, floorId) {
    if (!Array.isArray(value))
        return undefined;
    const seen = new Set();
    const fixtures = value
        .map((item, index) => {
        if (!isRecord(item))
            return undefined;
        const id = text(item.id, `switch-light-${floorId}-${index + 1}`);
        if (seen.has(id))
            return undefined;
        seen.add(id);
        return {
            id,
            label: optionalText(item.label),
            roomId: optionalText(item.roomId),
            position: vector3(item.position, [0, 2.65, 0]),
            rotation: Array.isArray(item.rotation) ? vector3(item.rotation, [0, 0, 0]) : undefined,
            scale: Array.isArray(item.scale) ? vector3(item.scale, [1, 1, 1]) : undefined,
            modelId: optionalText(item.modelId),
        };
    })
        .filter((item) => Boolean(item));
    return fixtures.length ? fixtures : undefined;
}
export function normalizeOpening(value) {
    const source = isRecord(value) ? value : {};
    const type = source.type === "window" ? "window" : "door";
    const windowStyle = source.windowStyle === "floor_to_ceiling" ? "floor_to_ceiling" : "standard";
    return {
        id: text(source.id, `opening-${Date.now()}`),
        type,
        entityId: typeof source.entityId === "string" && source.entityId.includes(".") ? source.entityId : undefined,
        wallId: text(source.wallId, ""),
        offset: finite(source.offset, 0, 0),
        width: finite(source.width, type === "door" ? 0.9 : 1.2, 0.1, 20),
        height: finite(source.height, type === "door" ? 2.1 : 1.2, 0.1, 12),
        bottom: type === "window" && windowStyle === "floor_to_ceiling" ? 0 : finite(source.bottom, type === "door" ? 0 : 0.9, 0, 12),
        windowStyle,
        hasLeaf: type === "door" ? source.hasLeaf !== false : false,
        swing: source.swing === "outward" ? "outward" : "inward",
        hinge: source.hinge === "end" ? "end" : "start",
    };
}
export function normalizeFurniture(value, floorId) {
    const source = isRecord(value) ? value : {};
    const supportedKinds = ["sofa", "bed", "dining_table", "desk", "wardrobe", "cabinet", "tv_stand", "kitchen_island", "coffee_table", "bookshelf", "sideboard", "shoe_cabinet", "nightstand", "side_table", "wash_basin", "toilet", "water_heater", "squat_toilet", "gas_stove"];
    const kind = supportedKinds.includes(source.kind) ? source.kind : "sofa";
    const fallbackSize = {
        bed: { width: 1.8, depth: 2, height: 0.42 },
        bookshelf: { width: 1.1, depth: 0.32, height: 1.12 },
        cabinet: { width: 1.6, depth: 0.6, height: 0.72 },
        coffee_table: { width: 1, depth: 0.55, height: 0.3 },
        desk: { width: 1.2, depth: 0.6, height: 0.62 },
        dining_table: { width: 1.4, depth: 0.82, height: 0.62 },
        kitchen_island: { width: 1.8, depth: 0.9, height: 0.72 },
        sofa: { width: 2.2, depth: 0.9, height: 0.68 },
        side_table: { width: 0.48, depth: 0.48, height: 0.45 },
        sideboard: { width: 1.5, depth: 0.42, height: 0.78 },
        nightstand: { width: 0.5, depth: 0.42, height: 0.48 },
        shoe_cabinet: { width: 1.1, depth: 0.32, height: 0.92 },
        tv_stand: { width: 1.8, depth: 0.38, height: 0.34 },
        wardrobe: { width: 1.4, depth: 0.6, height: 1.22 },
        wash_basin: { width: 0.6, depth: 0.48, height: 0.82 },
        toilet: { width: 0.7, depth: 0.72, height: 0.78 },
        water_heater: { width: 0.58, depth: 0.32, height: 0.72 },
        squat_toilet: { width: 0.62, depth: 0.82, height: 0.16 },
        gas_stove: { width: 0.72, depth: 0.52, height: 0.12 },
    };
    const size = fallbackSize[kind];
    return {
        id: text(source.id, `furniture-${Date.now()}`),
        kind,
        floorId,
        roomId: typeof source.roomId === "string" && source.roomId ? source.roomId : undefined,
        position: vector2(source.position, [0, 0]),
        rotation: finite(source.rotation, 0, -Math.PI * 4, Math.PI * 4),
        width: finite(source.width, size.width, 0.2, 20),
        depth: finite(source.depth, size.depth, 0.2, 20),
        height: finite(source.height, size.height, 0.1, 12),
        elevation: finite(source.elevation, 0, 0, 12),
        modelId: typeof source.modelId === "string" && source.modelId ? source.modelId : undefined,
    };
}
function normalizeDashboardPrecision(value) {
    return typeof value === "number" && Number.isFinite(value) ? Math.round(finite(value, 0, 0, 4)) : undefined;
}
function normalizeDashboardEntityId(value) {
    return typeof value === "string" && value.includes(".") ? value.trim() : undefined;
}
function normalizeDashboardWidgetPosition(value) {
    const source = isRecord(value) ? value : {};
    if (typeof source.x !== "number" && typeof source.y !== "number")
        return undefined;
    return {
        x: finite(source.x, 4, 0, 100),
        y: finite(source.y, 24, 0, 100),
    };
}
function normalizeDashboardWidgetItem(value) {
    const source = isRecord(value) ? value : {};
    const entityId = normalizeDashboardEntityId(source.entityId);
    if (!entityId)
        return undefined;
    return {
        entityId,
        label: optionalText(source.label),
        unit: optionalText(source.unit),
        precision: normalizeDashboardPrecision(source.precision),
    };
}
function normalizeDashboardWidgets(value) {
    if (!Array.isArray(value))
        return [];
    const seen = new Set();
    return value
        .map((item, index) => {
        const source = isRecord(item) ? item : {};
        const id = text(source.id, `dashboard-widget-${index + 1}`);
        if (seen.has(id))
            return undefined;
        seen.add(id);
        const order = Math.round(finite(source.order, index + 1, 0, 10_000));
        const visible = source.visible !== false;
        const common = { id, title: text(source.title, `数据卡片 ${index + 1}`), color: optionalText(source.color), order, visible, position: normalizeDashboardWidgetPosition(source.position) };
        if (source.type === "group") {
            const items = (Array.isArray(source.items) ? source.items : []).map(normalizeDashboardWidgetItem).filter((entry) => Boolean(entry));
            if (!items.length)
                return undefined;
            return { ...common, type: "group", items };
        }
        const entityId = normalizeDashboardEntityId(source.entityId);
        if (!entityId)
            return undefined;
        return {
            ...common,
            type: "metric",
            entityId,
            unit: optionalText(source.unit),
            precision: normalizeDashboardPrecision(source.precision),
        };
    })
        .filter((widget) => Boolean(widget))
        .sort((first, second) => first.order - second.order);
}
/** Upgrades persisted project JSON without discarding supported user-authored fields. */
export function normalizeFloorplanProject(value) {
    const source = isRecord(value) ? value : sampleProject;
    const rawFloors = Array.isArray(source.floors) && source.floors.length ? source.floors : sampleProject.floors;
    const floors = rawFloors.map((floorValue, index) => {
        const floor = isRecord(floorValue) ? floorValue : {};
        const id = text(floor.id, `floor-${index + 1}`);
        const walls = (Array.isArray(floor.walls) ? floor.walls : []).map((wallValue, wallIndex) => {
            const wall = isRecord(wallValue) ? wallValue : {};
            return { id: text(wall.id, `wall-${index + 1}-${wallIndex + 1}`), start: vector2(wall.start, [0, 0]), end: vector2(wall.end, [1, 0]), thickness: finite(wall.thickness, 0.14, 0.05, 1), height: finite(wall.height, finite(floor.height, 2.8, 1, 12), 1, 12), materialId: typeof wall.materialId === "string" ? wall.materialId : undefined, ...(wall.transparent === true ? { transparent: true } : {}) };
        });
        const rooms = (Array.isArray(floor.rooms) ? floor.rooms : []).map((roomValue, roomIndex) => {
            const room = isRecord(roomValue) ? roomValue : {};
            return {
                id: text(room.id, `room-${index + 1}-${roomIndex + 1}`),
                name: text(room.name, `房间 ${roomIndex + 1}`),
                polygon: (Array.isArray(room.polygon) ? room.polygon : []).map((point) => vector2(point, [0, 0])),
                floorMaterialId: optionalText(room.floorMaterialId),
                ceilingMaterialId: optionalText(room.ceilingMaterialId),
                haAreaId: optionalText(room.haAreaId),
                bindings: normalizeRoomBindings(room.bindings),
            };
        });
        const openings = (Array.isArray(floor.openings) ? floor.openings : []).map(normalizeOpening).filter((opening) => walls.some((wall) => wall.id === opening.wallId));
        const devices = (Array.isArray(floor.devices) ? floor.devices : []).map((deviceValue, deviceIndex) => {
            const device = isRecord(deviceValue) ? deviceValue : {};
            const supportedKinds = ["light", "switch", "cover", "climate", "sensor", "binary_sensor", "camera", "lock", "fan", "media_player", "alarm_control_panel", "vacuum", "custom"];
            return { id: text(device.id, `device-${index + 1}-${deviceIndex + 1}`), entityId: text(device.entityId, ""), kind: supportedKinds.includes(device.kind) ? device.kind : "custom", floorId: id, roomId: typeof device.roomId === "string" ? device.roomId : undefined, position: vector3(device.position, [0, 1.2, 0]), rotation: vector3(device.rotation, [0, 0, 0]), scale: Array.isArray(device.scale) ? vector3(device.scale, [1, 1, 1]) : undefined, modelId: typeof device.modelId === "string" ? device.modelId : undefined, icon: typeof device.icon === "string" ? device.icon : undefined, lightStrip: normalizeLightStripPath(device.lightStrip), controlledLightFixtures: normalizeSwitchLightFixtures(device.controlledLightFixtures, id) };
        }).filter((device) => device.entityId);
        return { id, name: text(floor.name, `${index + 1} 层`), level: finite(floor.level, index + 1, -20, 200), height: finite(floor.height, 2.8, 1, 12), walls, rooms, openings, devices, furniture: (Array.isArray(floor.furniture) ? floor.furniture : []).map((item) => normalizeFurniture(item, id)) };
    });
    const materialValues = Array.isArray(source.materials) ? source.materials : sampleProject.materials;
    const assetValues = Array.isArray(source.assets) ? source.assets : [];
    const dashboardWidgets = normalizeDashboardWidgets(source.dashboardWidgets);
    return {
        id: text(source.id, sampleProject.id),
        name: text(source.name, sampleProject.name),
        version: Math.max(CURRENT_PROJECT_VERSION, Math.floor(finite(source.version, CURRENT_PROJECT_VERSION, 1, Number.MAX_SAFE_INTEGER))),
        unit: "m",
        createdAt: text(source.createdAt, new Date().toISOString()),
        updatedAt: text(source.updatedAt, new Date().toISOString()),
        floors,
        materials: materialValues.filter(isRecord).map((material, index) => ({ id: text(material.id, `material-${index + 1}`), name: text(material.name, `材质 ${index + 1}`), color: text(material.color, "#f5f2ec"), roughness: typeof material.roughness === "number" ? finite(material.roughness, 0.8, 0, 1) : undefined, metalness: typeof material.metalness === "number" ? finite(material.metalness, 0, 0, 1) : undefined })),
        assets: assetValues.filter(isRecord).map((asset, index) => ({ id: text(asset.id, `asset-${index + 1}`), type: asset.type === "model" || asset.type === "texture" ? asset.type : "image", name: text(asset.name, `资源 ${index + 1}`), url: text(asset.url, ""), metadata: isRecord(asset.metadata) ? asset.metadata : undefined })),
        dashboardWidgets,
    };
}
export function validateFloorplanProject(value) {
    if (!isRecord(value))
        return { valid: false, issues: ["项目数据必须是对象"] };
    const project = normalizeFloorplanProject(value);
    const issues = [];
    if (!project.id)
        issues.push("项目 id 不能为空");
    if (!project.floors.length)
        issues.push("项目至少需要一个楼层");
    for (const floor of project.floors) {
        if (!floor.id)
            issues.push("楼层 id 不能为空");
        for (const opening of floor.openings)
            if (!opening.wallId)
                issues.push(`开口 ${opening.id} 未关联墙体`);
    }
    return issues.length ? { valid: false, issues } : { valid: true, project, issues };
}
export { deriveRoomsFromWalls } from "./topology.js";
export const sampleAreas = [
    { id: "living_room", name: "客厅" },
    { id: "bedroom", name: "卧室" },
    { id: "kitchen", name: "厨房" },
];
export const sampleEntities = [
    { entityId: "light.living_room", domain: "light", name: "客厅主灯", state: "off", attributes: { brightness: 0 }, areaId: "living_room" },
    { entityId: "cover.bedroom_curtain", domain: "cover", name: "卧室窗帘", state: "closed", attributes: { current_position: 0 }, areaId: "bedroom" },
    { entityId: "sensor.kitchen_temperature", domain: "sensor", name: "厨房温度", state: "26.4", attributes: { unit_of_measurement: "°C", device_class: "temperature" }, areaId: "kitchen" },
    { entityId: "sensor.kitchen_humidity", domain: "sensor", name: "厨房湿度", state: "56", attributes: { unit_of_measurement: "%", device_class: "humidity" }, areaId: "kitchen" },
    { entityId: "binary_sensor.living_room_motion", domain: "binary_sensor", name: "客厅人体", state: "off", attributes: { device_class: "motion" }, areaId: "living_room" },
    { entityId: "lock.entry_door", domain: "lock", name: "入户门锁", state: "locked", attributes: {}, areaId: "living_room" },
    { entityId: "climate.living_room_ac", domain: "climate", name: "客厅空调", state: "cool", attributes: { temperature: 26, current_temperature: 26.2 }, areaId: "living_room" }
];
export const sampleProject = {
    id: "demo-apartment",
    name: "Demo Apartment",
    version: 1,
    unit: "m",
    createdAt: "2026-07-21T00:00:00.000Z",
    updatedAt: "2026-07-21T00:00:00.000Z",
    materials: [
        { id: "wall-white", name: "Warm white wall", color: "#f5f2ec", roughness: 0.92 },
        { id: "oak-floor", name: "Oak floor", color: "#b58b5b", roughness: 0.8 }
    ],
    assets: [],
    dashboardWidgets: [],
    floors: [{
            id: "floor-1", name: "一层", level: 1, height: 2.8,
            rooms: [
                { id: "living", name: "客厅", floorMaterialId: "oak-floor", haAreaId: "living_room", bindings: { lighting: { main: { entityIds: ["light.living_room"] } }, environment: { temperature: { entityIds: ["climate.living_room_ac"], aggregation: "latest" } }, security: { motion: { entityIds: ["binary_sensor.living_room_motion"] }, lock: { entityIds: ["lock.entry_door"] } } }, polygon: [[0, 0], [5.2, 0], [5.2, 3.6], [0, 3.6]] },
                { id: "bedroom", name: "卧室", floorMaterialId: "oak-floor", haAreaId: "bedroom", bindings: { shade: { curtain: { entityIds: ["cover.bedroom_curtain"] } } }, polygon: [[5.2, 0], [8.8, 0], [8.8, 3.6], [5.2, 3.6]] },
                { id: "kitchen", name: "厨房", floorMaterialId: "oak-floor", haAreaId: "kitchen", bindings: { environment: { temperature: { entityIds: ["sensor.kitchen_temperature"] }, humidity: { entityIds: ["sensor.kitchen_humidity"] } } }, polygon: [[0, 3.6], [3.2, 3.6], [3.2, 6.2], [0, 6.2]] }
            ],
            walls: [
                { id: "w1", start: [0, 0], end: [8.8, 0], thickness: 0.14, height: 2.8, materialId: "wall-white" },
                { id: "w2", start: [8.8, 0], end: [8.8, 3.6], thickness: 0.14, height: 2.8, materialId: "wall-white" },
                { id: "w3", start: [8.8, 3.6], end: [0, 3.6], thickness: 0.14, height: 2.8, materialId: "wall-white" },
                { id: "w4", start: [0, 3.6], end: [0, 0], thickness: 0.14, height: 2.8, materialId: "wall-white" },
                { id: "w5", start: [5.2, 0], end: [5.2, 3.6], thickness: 0.12, height: 2.8, materialId: "wall-white" },
                { id: "w6", start: [0, 3.6], end: [3.2, 3.6], thickness: 0.14, height: 2.8, materialId: "wall-white", transparent: true },
                { id: "w7", start: [3.2, 3.6], end: [3.2, 6.2], thickness: 0.14, height: 2.8, materialId: "wall-white" },
                { id: "w8", start: [3.2, 6.2], end: [0, 6.2], thickness: 0.14, height: 2.8, materialId: "wall-white" },
                { id: "w9", start: [0, 6.2], end: [0, 3.6], thickness: 0.14, height: 2.8, materialId: "wall-white" }
            ],
            openings: [],
            devices: [
                { id: "living-light", entityId: "light.living_room", kind: "light", floorId: "floor-1", roomId: "living", position: [2.6, 2.0, 2.65], rotation: [0, 0, 0] },
                { id: "entry-lock", entityId: "lock.entry_door", kind: "lock", floorId: "floor-1", roomId: "living", position: [0.25, 1.0, 1.8], rotation: [0, 0, 0], modelId: "lock.door" },
                { id: "bedroom-cover", entityId: "cover.bedroom_curtain", kind: "cover", floorId: "floor-1", roomId: "bedroom", position: [7.0, 0.2, 1.5], rotation: [0, 0, 0] },
                { id: "kitchen-sensor", entityId: "sensor.kitchen_temperature", kind: "sensor", floorId: "floor-1", roomId: "kitchen", position: [1.6, 1.6, 4.9], rotation: [0, 0, 0] }
            ],
            furniture: [
                { id: "living-sofa", kind: "sofa", floorId: "floor-1", roomId: "living", position: [1.35, 1.05], rotation: 0, width: 2.25, depth: 0.92, height: 0.68 },
                { id: "living-coffee-table", kind: "coffee_table", floorId: "floor-1", roomId: "living", position: [3.0, 1.1], rotation: 0, width: 1.15, depth: 0.6, height: 0.3 },
                { id: "living-dining", kind: "dining_table", floorId: "floor-1", roomId: "living", position: [3.65, 2.75], rotation: 0, width: 1.45, depth: 0.84, height: 0.62 },
                { id: "bedroom-bed", kind: "bed", floorId: "floor-1", roomId: "bedroom", position: [7.35, 1.1], rotation: 0, width: 1.85, depth: 2.0, height: 0.42 },
                { id: "bedroom-wardrobe", kind: "wardrobe", floorId: "floor-1", roomId: "bedroom", position: [8.25, 2.9], rotation: Math.PI / 2, width: 1.55, depth: 0.58, height: 1.22 },
                { id: "bedroom-side-cabinet", kind: "cabinet", floorId: "floor-1", roomId: "bedroom", position: [6.15, 1.05], rotation: 0, width: 0.58, depth: 0.48, height: 0.48 },
                { id: "kitchen-cabinet-left", kind: "cabinet", floorId: "floor-1", roomId: "kitchen", position: [0.78, 5.62], rotation: 0, width: 1.28, depth: 0.58, height: 0.72 },
                { id: "kitchen-cabinet-right", kind: "cabinet", floorId: "floor-1", roomId: "kitchen", position: [2.35, 5.62], rotation: 0, width: 1.28, depth: 0.58, height: 0.72 },
                { id: "kitchen-island", kind: "kitchen_island", floorId: "floor-1", roomId: "kitchen", position: [1.65, 4.65], rotation: 0, width: 1.55, depth: 0.78, height: 0.72 }
            ]
        }]
};
