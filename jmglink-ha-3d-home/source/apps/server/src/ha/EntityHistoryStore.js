import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

const HISTORY_VERSION = 1;
const PERSIST_DEBOUNCE_MS = 250;
const MAX_HISTORY_ENTITIES = 5000;
const MAX_HISTORY_AREAS = 1000;
const MAX_HISTORY_DEVICES = 5000;
const MAX_ATTRIBUTE_KEYS = 256;
const MAX_ATTRIBUTE_ARRAY_ITEMS = 256;
const MAX_ATTRIBUTE_STRING_LENGTH = 16 * 1024;
const SENSITIVE_ATTRIBUTE = /(token|password|secret|credential|authorization|api[_-]?key|access[_-]?code|entity_picture|media_content_id)/i;

function asEntityId(value) {
    const entityId = typeof value === "string" ? value.trim() : "";
    return /^[a-z0-9_]+\.[a-z0-9_]+$/.test(entityId) ? entityId : undefined;
}

function sanitizeAttributes(value, depth = 0) {
    if (!value || typeof value !== "object" || depth > 5)
        return {};
    const result = Array.isArray(value) ? [] : {};
    const maximumEntries = Array.isArray(value) ? MAX_ATTRIBUTE_ARRAY_ITEMS : MAX_ATTRIBUTE_KEYS;
    for (const [key, item] of Object.entries(value).slice(0, maximumEntries)) {
        if (SENSITIVE_ATTRIBUTE.test(key))
            continue;
        if (item && typeof item === "object")
            result[key] = sanitizeAttributes(item, depth + 1);
        else if (typeof item === "string" && item.length > MAX_ATTRIBUTE_STRING_LENGTH)
            result[key] = item.slice(0, MAX_ATTRIBUTE_STRING_LENGTH);
        else
            result[key] = item;
    }
    return result;
}

function offlineEntity(entity) {
    const entityId = asEntityId(entity?.entityId);
    if (!entityId)
        return undefined;
    const [domain] = entityId.split(".");
    const development = entity.source === "development" || entity.attributes?.ha3d_development === true;
    return {
        ...entity,
        entityId,
        domain: entity.domain || domain,
        name: entity.name || entityId,
        state: development ? String(entity.state ?? "off") : "unavailable",
        attributes: {
            ...sanitizeAttributes(entity.attributes),
            ha3d_historical: !development,
            ...(development ? { ha3d_development: true } : {}),
        },
        historical: !development,
        stale: !development,
        source: development ? "development" : "history",
    };
}

function normalizeArea(area) {
    const id = typeof area?.id === "string" ? area.id.trim() : "";
    if (!id)
        return undefined;
    return { id, name: typeof area.name === "string" && area.name.trim() ? area.name.trim() : id };
}

function normalizeDevice(device) {
    const id = typeof device?.id === "string" ? device.id.trim() : "";
    if (!id)
        return undefined;
    return {
        id,
        name: typeof device.name === "string" && device.name.trim() ? device.name.trim() : id,
        manufacturer: typeof device.manufacturer === "string" ? device.manufacturer : undefined,
        model: typeof device.model === "string" ? device.model : undefined,
        areaId: typeof device.areaId === "string" ? device.areaId : undefined,
        integration: typeof device.integration === "string" ? device.integration : undefined,
        historical: device.source === "development" ? false : true,
        source: device.source === "development" ? "development" : "history",
    };
}

export function createEntityPlaceholder(entityId) {
    const normalized = asEntityId(entityId);
    if (!normalized)
        return undefined;
    return offlineEntity({ entityId: normalized, name: normalized, attributes: {}, source: "project" });
}

export function developmentEntities() {
    const deviceId = "ha3d-development-washing-machine";
    const areaId = "ha3d-development-laundry";
    const entity = (entityId, name, state, attributes = {}) => ({
        entityId,
        domain: entityId.split(".")[0],
        name: `离线开发 · ${name}`,
        state: String(state),
        areaId,
        deviceId,
        attributes: { friendly_name: `离线开发 · ${name}`, ha3d_development: true, ...attributes },
        source: "development",
    });
    return [
        entity("switch.dev_washing_machine_power", "洗衣机电源", "off", { device_class: "switch", icon: "mdi:power" }),
        entity("sensor.dev_washing_machine_status", "洗衣机运行阶段", "待机", { device_class: "enum", options: ["待机", "洗涤", "漂洗", "脱水", "完成"] }),
        entity("sensor.dev_washing_machine_remaining_time", "洗衣机剩余时间", 48, { device_class: "duration", unit_of_measurement: "min" }),
        entity("select.dev_washing_machine_program", "洗衣机程序", "标准洗", { options: ["标准洗", "快洗", "羊毛", "筒自洁"] }),
        entity("select.dev_washing_machine_temperature", "洗衣机温度", "40", { options: ["冷水", "20", "30", "40", "60", "90"], unit_of_measurement: "°C" }),
        entity("select.dev_washing_machine_spin_speed", "洗衣机脱水转速", "1000", { options: ["0", "400", "800", "1000", "1200", "1400"], unit_of_measurement: "rpm" }),
        entity("number.dev_washing_machine_delay", "洗衣机预约时间", 0, { min: 0, max: 24, step: 1, unit_of_measurement: "h" }),
        entity("binary_sensor.dev_washing_machine_door", "洗衣机舱门", "off", { device_class: "door" }),
        entity("sensor.dev_washing_machine_fault", "洗衣机故障", "无"),
        entity("sensor.dev_washing_machine_power_usage", "洗衣机功耗", 0, { device_class: "power", unit_of_measurement: "W" }),
        entity("button.dev_washing_machine_start", "洗衣机启动", "unknown", { device_class: "start" }),
        entity("button.dev_washing_machine_pause", "洗衣机暂停", "unknown", { device_class: "pause" }),
        entity("button.dev_washing_machine_reset", "洗衣机复位", "unknown", { device_class: "restart" }),
    ];
}

export function developmentDevices() {
    return [{
        id: "ha3d-development-washing-machine",
        name: "离线开发 · 洗衣机",
        manufacturer: "HA 3D Home",
        model: "Virtual Washer 1",
        areaId: "ha3d-development-laundry",
        integration: "ha3d-development",
        historical: false,
        source: "development",
    }];
}

export class EntityHistoryStore {
    constructor(filePath, entities, areas, devices, includeDevelopmentEntities) {
        this.filePath = filePath;
        this.entities = entities;
        this.areas = areas;
        this.devices = devices;
        this.includeDevelopmentEntities = includeDevelopmentEntities;
        this.persistTimer = undefined;
        this.persistInFlight = undefined;
        this.persistBatch = undefined;
    }

    static async create(dataDir, { seedEntityIds = [], includeDevelopmentEntities = false } = {}) {
        const filePath = path.resolve(dataDir, "ha-entity-history.json");
        let parsed = {};
        try {
            parsed = JSON.parse(await readFile(filePath, "utf8"));
        }
        catch {
            // First use and an invalid optional cache both start from project data.
        }
        const entities = new Map();
        for (const raw of Array.isArray(parsed.entities) ? parsed.entities : []) {
            const entity = offlineEntity(raw);
            if (entity)
                entities.set(entity.entityId, entity);
        }
        for (const entityId of seedEntityIds) {
            if (entities.has(entityId))
                continue;
            const entity = createEntityPlaceholder(entityId);
            if (entity)
                entities.set(entity.entityId, entity);
        }
        const areas = new Map();
        for (const raw of Array.isArray(parsed.areas) ? parsed.areas : []) {
            const area = normalizeArea(raw);
            if (area)
                areas.set(area.id, area);
        }
        const devices = new Map();
        for (const raw of Array.isArray(parsed.devices) ? parsed.devices : []) {
            const device = normalizeDevice(raw);
            if (device)
                devices.set(device.id, device);
        }
        const store = new EntityHistoryStore(filePath, entities, areas, devices, includeDevelopmentEntities);
        await store.persist();
        return store;
    }

    getEntities() {
        const values = [...this.entities.values()].map((entity) => offlineEntity(entity)).filter(Boolean);
        if (this.includeDevelopmentEntities)
            values.push(...developmentEntities());
        return values;
    }

    getAreas() {
        const values = [...this.areas.values()];
        if (this.includeDevelopmentEntities)
            values.push({ id: "ha3d-development-laundry", name: "离线开发区" });
        return values.sort((first, second) => first.name.localeCompare(second.name, "zh-Hans-CN"));
    }

    getDevices() {
        const values = [...this.devices.values()].map((device) => normalizeDevice(device)).filter(Boolean);
        if (this.includeDevelopmentEntities)
            values.push(...developmentDevices());
        return values.sort((first, second) => first.name.localeCompare(second.name, "zh-Hans-CN"));
    }

    async rememberEntities(entities) {
        let changed = false;
        for (const raw of entities) {
            const entityId = asEntityId(raw?.entityId);
            if (!entityId || raw.source === "development" || raw.attributes?.ha3d_development === true)
                continue;
            const attributes = sanitizeAttributes(raw.attributes);
            delete attributes.ha3d_historical;
            this.entities.delete(entityId);
            this.entities.set(entityId, {
                ...raw,
                entityId,
                historical: undefined,
                stale: undefined,
                source: "ha",
                attributes,
            });
            changed = true;
        }
        this.pruneMap(this.entities, MAX_HISTORY_ENTITIES);
        if (changed)
            await this.persist();
    }

    async rememberAreas(areas) {
        let changed = false;
        for (const raw of areas) {
            const area = normalizeArea(raw);
            if (!area)
                continue;
            this.areas.delete(area.id);
            this.areas.set(area.id, area);
            changed = true;
        }
        this.pruneMap(this.areas, MAX_HISTORY_AREAS);
        if (changed)
            await this.persist();
    }

    async rememberDevices(devices) {
        let changed = false;
        for (const raw of devices) {
            if (raw?.source === "development")
                continue;
            const device = normalizeDevice({ ...raw, source: "history" });
            if (!device)
                continue;
            this.devices.delete(device.id);
            this.devices.set(device.id, device);
            changed = true;
        }
        this.pruneMap(this.devices, MAX_HISTORY_DEVICES);
        if (changed)
            await this.persist();
    }

    persist() {
        if (!this.persistBatch) {
            let resolve;
            let reject;
            const promise = new Promise((onResolve, onReject) => {
                resolve = onResolve;
                reject = onReject;
            });
            this.persistBatch = { promise, resolve, reject };
        }
        this.schedulePersist();
        return this.persistBatch.promise;
    }

    schedulePersist(delay = PERSIST_DEBOUNCE_MS) {
        if (this.persistTimer || this.persistInFlight)
            return;
        this.persistTimer = setTimeout(() => {
            this.persistTimer = undefined;
            void this.flushPersist();
        }, delay);
    }

    async flushPersist() {
        if (this.persistInFlight || !this.persistBatch)
            return this.persistInFlight ?? this.persistBatch?.promise;
        const batch = this.persistBatch;
        this.persistBatch = undefined;
        const payload = JSON.stringify({
            version: HISTORY_VERSION,
            updatedAt: new Date().toISOString(),
            entities: [...this.entities.values()],
            areas: [...this.areas.values()],
            devices: [...this.devices.values()],
        }, null, 2);
        this.persistInFlight = (async () => {
            await mkdir(path.dirname(this.filePath), { recursive: true });
            const temporaryPath = `${this.filePath}.tmp`;
            await writeFile(temporaryPath, payload, "utf8");
            await rename(temporaryPath, this.filePath);
        })();
        try {
            await this.persistInFlight;
            batch.resolve();
        }
        catch (error) {
            batch.reject(error);
        }
        finally {
            this.persistInFlight = undefined;
            if (this.persistBatch)
                this.schedulePersist();
        }
    }

    async close() {
        if (this.persistTimer)
            clearTimeout(this.persistTimer);
        this.persistTimer = undefined;
        if (this.persistInFlight)
            await this.persistInFlight;
        if (this.persistTimer)
            clearTimeout(this.persistTimer);
        this.persistTimer = undefined;
        if (this.persistBatch)
            await this.flushPersist();
    }

    pruneMap(map, maximumSize) {
        while (map.size > maximumSize) {
            const oldestKey = map.keys().next().value;
            if (oldestKey === undefined)
                break;
            map.delete(oldestKey);
        }
    }

    getResourceStats() {
        return {
            historyEntities: this.entities.size,
            historyAreas: this.areas.size,
            historyDevices: this.devices.size,
            historyPendingWrites: this.persistBatch ? 1 : 0,
            historyWriteActive: Boolean(this.persistInFlight),
        };
    }
}
