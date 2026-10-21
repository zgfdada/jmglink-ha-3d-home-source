export type Vec2 = [number, number];
export type Vec3 = [number, number, number];
export type Material = {
    id: string;
    name: string;
    color: string;
    roughness?: number;
    metalness?: number;
};
export type Asset = {
    id: string;
    type: "image" | "model" | "texture";
    name: string;
    url: string;
    metadata?: Record<string, unknown>;
};
export type Wall = {
    id: string;
    start: Vec2;
    end: Vec2;
    thickness: number;
    height: number;
    materialId?: string;
    transparent?: boolean;
};
export type CapabilityType = "environment" | "lighting" | "shade" | "security";
export type EntityAggregation = "avg" | "min" | "max" | "latest";
export type EntityBinding = {
    entityIds: string[];
    aggregation?: EntityAggregation;
};
export type EnvironmentBindingRole = "temperature" | "humidity" | "pm25" | "co2" | "voc" | "illuminance";
export type LightingBindingRole = "main" | "ambient" | "scene";
export type ShadeBindingRole = "curtain" | "blind";
export type SecurityBindingRole = "motion" | "presence" | "doorWindow" | "camera" | "lock" | "alarm";
export type RoomCapabilityBindings = {
    environment?: Partial<Record<EnvironmentBindingRole, EntityBinding>>;
    lighting?: Partial<Record<LightingBindingRole, EntityBinding>>;
    shade?: Partial<Record<ShadeBindingRole, EntityBinding>>;
    security?: Partial<Record<SecurityBindingRole, EntityBinding>>;
};
export type Room = {
    id: string;
    name: string;
    polygon: Vec2[];
    floorMaterialId?: string;
    ceilingMaterialId?: string;
    haAreaId?: string;
    bindings?: RoomCapabilityBindings;
};
export type WindowStyle = "standard" | "floor_to_ceiling";
export type DoorSwing = "inward" | "outward";
export type DoorHinge = "start" | "end";
export type Opening = {
    id: string;
    type: "door" | "window";
    entityId?: string;
    wallId: string;
    offset: number;
    width: number;
    height: number;
    bottom: number;
    windowStyle: WindowStyle;
    hasLeaf: boolean;
    swing: DoorSwing;
    hinge: DoorHinge;
};
export type LightStripShape = "line" | "ring";
export type LightStripPath = {
    shape: LightStripShape;
    points: Vec2[];
};
export type SwitchLightFixture = {
    id: string;
    label?: string;
    roomId?: string;
    position: Vec3;
    rotation?: Vec3;
    scale?: Vec3;
    modelId?: string;
};
export type DevicePlacement = {
    id: string;
    entityId: string;
    kind: "light" | "switch" | "cover" | "climate" | "sensor" | "binary_sensor" | "camera" | "lock" | "fan" | "media_player" | "alarm_control_panel" | "vacuum" | "custom";
    floorId: string;
    roomId?: string;
    position: Vec3;
    rotation: Vec3;
    scale?: Vec3;
    modelId?: string;
    icon?: string;
    lightStrip?: LightStripPath;
    controlledLightFixtures?: SwitchLightFixture[];
};
export type FurnitureKind = "sofa" | "bed" | "dining_table" | "desk" | "wardrobe" | "cabinet" | "tv_stand" | "kitchen_island" | "coffee_table" | "bookshelf" | "sideboard" | "shoe_cabinet" | "nightstand" | "side_table" | "wash_basin" | "toilet" | "water_heater" | "squat_toilet" | "gas_stove";
export type FurniturePlacement = {
    id: string;
    kind: FurnitureKind;
    floorId: string;
    roomId?: string;
    position: Vec2;
    rotation: number;
    width: number;
    depth: number;
    height: number;
    /** Distance in meters from the floor to the bottom of the furniture. */
    elevation?: number;
    modelId?: string;
};
export type Floor = {
    id: string;
    name: string;
    level: number;
    height: number;
    walls: Wall[];
    rooms: Room[];
    openings: Opening[];
    devices: DevicePlacement[];
    furniture: FurniturePlacement[];
};
export type DashboardWidgetGroupItem = {
    entityId: string;
    label?: string;
    unit?: string;
    precision?: number;
};
export type DashboardWidgetPosition = {
    x: number;
    y: number;
};
export type DashboardMetricWidget = {
    id: string;
    type: "metric";
    title: string;
    entityId: string;
    unit?: string;
    precision?: number;
    color?: string;
    order: number;
    visible: boolean;
    position?: DashboardWidgetPosition;
};
export type DashboardGroupWidget = {
    id: string;
    type: "group";
    title: string;
    items: DashboardWidgetGroupItem[];
    color?: string;
    order: number;
    visible: boolean;
    position?: DashboardWidgetPosition;
};
export type DashboardWidget = DashboardMetricWidget | DashboardGroupWidget;
export type FloorplanProject = {
    id: string;
    name: string;
    version: number;
    unit: "m";
    createdAt: string;
    updatedAt: string;
    floors: Floor[];
    assets: Asset[];
    materials: Material[];
    dashboardWidgets: DashboardWidget[];
};
export type BlueprintImport = {
    name: string;
    dataUrl: string;
    opacity?: number;
    scaleMeters?: number;
    aspectRatio?: number;
    scalePercent?: number;
    worldX?: number;
    worldY?: number;
    worldWidth?: number;
    worldHeight?: number;
};
export type HaEntity = {
    entityId: string;
    domain: string;
    name: string;
    state: string;
    attributes: Record<string, unknown>;
    areaId?: string;
    deviceId?: string;
    lastChanged?: string;
    lastUpdated?: string;
};
export type HaArea = {
    id: string;
    name: string;
};
export type RoomBindingSuggestion = {
    floorId: string;
    roomId: string;
    roomName: string;
    areaId: string;
    areaName: string;
    entityIds: string[];
};
export type DeviceAction = {
    type: "turn_on";
    entityId: string;
} | {
    type: "turn_off";
    entityId: string;
} | {
    type: "toggle";
    entityId: string;
} | {
    type: "set_brightness";
    entityId: string;
    brightness: number;
} | {
    type: "set_color_temperature";
    entityId: string;
    colorTempKelvin: number;
} | {
    type: "set_rgb_color";
    entityId: string;
    rgbColor: [number, number, number];
} | {
    type: "set_cover_position";
    entityId: string;
    position: number;
} | {
    type: "set_temperature";
    entityId: string;
    temperature: number;
} | {
    type: "set_hvac_mode";
    entityId: string;
    mode: string;
} | {
    type: "set_fan_percentage";
    entityId: string;
    percentage: number;
};
export declare const CURRENT_PROJECT_VERSION = 4;
export declare function normalizeOpening(value: unknown): Opening;
export declare function normalizeFurniture(value: unknown, floorId: string): FurniturePlacement;
/** Upgrades persisted project JSON without discarding supported user-authored fields. */
export declare function normalizeFloorplanProject(value: unknown): FloorplanProject;
export declare function validateFloorplanProject(value: unknown): {
    valid: boolean;
    project?: FloorplanProject;
    issues: string[];
};
export { deriveRoomsFromWalls } from "./topology.js";
export declare const sampleAreas: HaArea[];
export declare const sampleEntities: HaEntity[];
export declare const sampleProject: FloorplanProject;
//# sourceMappingURL=index.d.ts.map