import { mkdir, mkdtemp, readFile, readdir, rename, rm, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { normalizeFloorplanProject, sampleProject, validateFloorplanProject } from "@ha3d/schema";
const projectFileName = (id) => `project-${Buffer.from(id).toString("base64url")}.json`;
const projectIdFromFileName = (fileName) => {
    const encoded = /^project-(.+)\.json$/.exec(fileName)?.[1];
    if (!encoded)
        return undefined;
    try {
        return Buffer.from(encoded, "base64url").toString("utf8");
    }
    catch {
        return undefined;
    }
};
export class ProjectStore {
    projectsDirectory;
    projects = new Map();
    currentProjectId = sampleProject.id;
    projectSavedListeners = new Array();
    constructor(projectsDirectory) {
        this.projectsDirectory = projectsDirectory;
    }
    static async create(dataDir) {
        const store = new ProjectStore(path.resolve(dataDir, "projects"));
        await store.load();
        return store;
    }
    listProjects() {
        return [...this.projects.values()]
            .sort((first, second) => Number(second.id === this.currentProjectId) - Number(first.id === this.currentProjectId) || second.updatedAt.localeCompare(first.updatedAt))
            .map((project) => ({ id: project.id, name: project.name, updatedAt: project.updatedAt, current: project.id === this.currentProjectId }));
    }
    getProject(id = this.currentProjectId) {
        return this.projects.get(id);
    }
    listAssets(id = this.currentProjectId) {
        return this.projects.get(id)?.assets ?? [];
    }
    getAsset(assetId, id = this.currentProjectId) {
        return this.projects.get(id)?.assets.find((asset) => asset.id === assetId);
    }
    onProjectSaved(listener) {
        this.projectSavedListeners.push(listener);
        return () => {
            this.projectSavedListeners = this.projectSavedListeners.filter((item) => item !== listener);
        };
    }
    emitProjectSaved(project) {
        for (const listener of this.projectSavedListeners) {
            try {
                listener(project);
            }
            catch {
                // A failing listener must never block project persistence.
            }
        }
    }
    async replaceAll(projects, currentId) {
        const next=new Map();
        for(const project of projects){const v=validateFloorplanProject(project);if(!v.valid||!v.project||next.has(v.project.id))throw Error("户型备份校验失败");next.set(v.project.id,v.project);}
        if(!next.has(currentId))throw Error("当前户型不存在");
        const staging=await mkdtemp(this.projectsDirectory+"-import-");
        for(const project of next.values())await this.writeJsonAtomically(path.join(staging,projectFileName(project.id)),project);
        await this.writeJsonAtomically(path.join(staging,"current-project.json"),next.get(currentId));
        const previous=this.projectsDirectory+"-before-import-"+Date.now()+"-"+Math.random().toString(36).slice(2);
        await rename(this.projectsDirectory,previous);
        try{await rename(staging,this.projectsDirectory);}catch(error){await rename(previous,this.projectsDirectory);throw error;}
        this.projects=next;this.currentProjectId=currentId;
        for(const project of next.values())this.emitProjectSaved(project);
    }
    async addAsset(input, id = this.currentProjectId) {
        const project = this.projects.get(id);
        if (!project)
            throw new Error("Project not found");
        const asset = { ...input, id: `asset-${Date.now().toString(36)}` };
        await this.saveProject({ ...project, assets: [...project.assets, asset] });
        return asset;
    }
    async deleteAsset(assetId, id = this.currentProjectId) {
        const project = this.projects.get(id);
        if (!project)
            throw new Error("Project not found");
        const asset = project.assets.find((item) => item.id === assetId);
        if (!asset)
            return undefined;
        await this.saveProject({ ...project, assets: project.assets.filter((item) => item.id !== assetId) });
        return asset;
    }
    async createProject(input = {}) {
        const source = input.sourceProjectId ? this.projects.get(input.sourceProjectId) : undefined;
        if (input.sourceProjectId && !source)
            throw new Error("Source project not found");
        const timestamp = new Date().toISOString();
        const id = `project-${Date.now().toString(36)}`;
        const project = normalizeFloorplanProject({
            ...(source ? structuredClone(source) : structuredClone(sampleProject)),
            id,
            name: input.name?.trim() || (source ? `${source.name} 副本` : "未命名户型"),
            createdAt: timestamp,
            updatedAt: timestamp,
        });
        this.projects.set(project.id, project);
        this.currentProjectId = project.id;
        await this.persistProject(project);
        await this.persistCurrentProject();
        this.emitProjectSaved(project);
        return project;
    }
    async saveProject(project) {
        if (!this.projects.has(project.id))
            throw new Error("Project not found");
        const validation = validateFloorplanProject(project);
        if (!validation.valid || !validation.project)
            throw new Error(validation.issues.join("; "));
        await this.createBackup(project.id);
        const saved = { ...validation.project, updatedAt: new Date().toISOString() };
        this.projects.set(saved.id, saved);
        await this.persistProject(saved);
        if (saved.id === this.currentProjectId)
            await this.persistCurrentProject();
        this.emitProjectSaved(saved);
        return saved;
    }
    async deleteProject(id) {
        if (!this.projects.has(id))
            return false;
        if (this.projects.size <= 1)
            throw new Error("At least one project is required");
        this.projects.delete(id);
        await rm(this.projectPath(id), { force: true });
        await rm(this.backupDirectory(id), { force: true, recursive: true });
        if (id === this.currentProjectId) {
            this.currentProjectId = this.projects.keys().next().value;
            await this.persistCurrentProject();
        }
        return true;
    }
    async reset(id = this.currentProjectId) {
        if (!this.projects.has(id))
            throw new Error("Project not found");
        await this.createBackup(id);
        const now = new Date().toISOString();
        const project = normalizeFloorplanProject({ ...structuredClone(sampleProject), id, createdAt: this.projects.get(id)?.createdAt ?? now, updatedAt: now });
        this.projects.set(id, project);
        await this.persistProject(project);
        if (id === this.currentProjectId)
            await this.persistCurrentProject();
        this.emitProjectSaved(project);
        return project;
    }
    async listBackups(id = this.currentProjectId) {
        if (!this.projects.has(id))
            throw new Error("Project not found");
        const directory = this.backupDirectory(id);
        try {
            const files = await readdir(directory);
            return files
                .filter((file) => /^backup-\d+\.json$/.test(file))
                .sort()
                .reverse()
                .map((file) => ({ id: file, createdAt: new Date(Number(file.slice(7, -5))).toISOString() }));
        }
        catch {
            return [];
        }
    }
    async restoreBackup(id, backupId) {
        if (!this.projects.has(id))
            throw new Error("Project not found");
        if (!/^backup-\d+\.json$/.test(backupId))
            throw new Error("Invalid backup id");
        const raw = await readFile(path.join(this.backupDirectory(id), backupId), "utf8");
        const validation = validateFloorplanProject(JSON.parse(raw));
        if (!validation.valid || !validation.project)
            throw new Error(validation.issues.join("; "));
        await this.createBackup(id);
        const project = { ...validation.project, id, createdAt: this.projects.get(id)?.createdAt ?? validation.project.createdAt, updatedAt: new Date().toISOString() };
        this.projects.set(id, project);
        await this.persistProject(project);
        if (id === this.currentProjectId)
            await this.persistCurrentProject();
        this.emitProjectSaved(project);
        return project;
    }
    async load() {
        await mkdir(this.projectsDirectory, { recursive: true });
        let current;
        try {
            current = this.withDemoFurniture(normalizeFloorplanProject(JSON.parse(await readFile(this.currentProjectPath(), "utf8"))));
            this.projects.set(current.id, current);
        }
        catch {
            // A missing legacy current project is handled after loading named projects.
        }
        const files = await readdir(this.projectsDirectory);
        for (const file of files) {
            const id = projectIdFromFileName(file);
            if (!id)
                continue;
            try {
                const project = this.withDemoFurniture(normalizeFloorplanProject(JSON.parse(await readFile(path.join(this.projectsDirectory, file), "utf8"))));
                this.projects.set(project.id, project);
            }
            catch {
                // Ignore malformed stale project files and keep the remaining valid projects available.
            }
        }
        if (!this.projects.size) {
            current = normalizeFloorplanProject(sampleProject);
            this.projects.set(current.id, current);
            this.currentProjectId = current.id;
            await this.persistProject(current);
        }
        else {
            this.currentProjectId = current && this.projects.has(current.id) ? current.id : this.projects.keys().next().value;
        }
        await this.persistCurrentProject();
        await Promise.all([...this.projects.values()].filter((project) => project.id === sampleProject.id).map((project) => this.persistProject(project)));
    }
    isEmptyDemoProject(project) {
        return project.id === sampleProject.id && project.floors.every((floor) => floor.furniture.length === 0);
    }
    withDemoFurniture(project) {
        if (project.id !== sampleProject.id)
            return project;
        const sampleFurnitureByFloor = new Map(sampleProject.floors.map((floor) => [floor.id, floor.furniture]));
        const nextFloors = project.floors.map((floor) => {
            if (!this.shouldRefreshDemoFurniture(floor))
                return floor;
            const generated = this.generateDemoFurniture(floor);
            const furniture = generated.length ? generated : sampleFurnitureByFloor.get(floor.id);
            return furniture?.length ? { ...floor, furniture: structuredClone(furniture) } : floor;
        });
        if (nextFloors.every((floor, index) => floor === project.floors[index]) && !this.isEmptyDemoProject(project))
            return project;
        return normalizeFloorplanProject({
            ...project,
            floors: nextFloors
        });
    }
    shouldRefreshDemoFurniture(floor) {
        if (!floor.rooms.length)
            return false;
        if (!floor.furniture.length)
            return true;
        return floor.furniture.every((item) => !floor.rooms.some((room) => this.pointInRoom(item.position, room)));
    }
    generateDemoFurniture(floor) {
        const rooms = [...floor.rooms]
            .map((room) => ({ room, area: Math.abs(this.roomArea(room)) }))
            .filter((item) => item.area > 1)
            .sort((first, second) => second.area - first.area);
        const furniture = [];
        const add = (room, seed) => {
            const position = this.roomPoint(room, seed.position);
            furniture.push({
                id: `demo-${floor.id}-${room.id}-${seed.key}`,
                kind: seed.kind,
                floorId: floor.id,
                roomId: room.id,
                position,
                rotation: seed.rotation,
                width: seed.width,
                depth: seed.depth,
                height: seed.height,
            });
        };
        rooms.forEach(({ room }, index) => {
            const bounds = this.roomBounds(room);
            const width = bounds.maxX - bounds.minX;
            const depth = bounds.maxY - bounds.minY;
            const wide = width >= depth;
            const fit = (value, maxRatio, minimum) => Math.max(minimum, Math.min(value, Math.max(minimum, Math.min(width, depth) * maxRatio)));
            if (index === 0) {
                add(room, { key: "sofa", kind: "sofa", position: [bounds.minX + width * 0.28, bounds.minY + depth * 0.28], rotation: wide ? 0 : Math.PI / 2, width: Math.min(2.4, Math.max(1.5, width * 0.34)), depth: 0.9, height: 0.68 });
                add(room, { key: "coffee", kind: "coffee_table", position: [bounds.minX + width * 0.52, bounds.minY + depth * 0.33], rotation: wide ? 0 : Math.PI / 2, width: fit(1.15, 0.34, 0.72), depth: 0.58, height: 0.3 });
                add(room, { key: "tv", kind: "tv_stand", position: [bounds.minX + width * 0.78, bounds.minY + depth * 0.28], rotation: wide ? Math.PI / 2 : 0, width: Math.min(1.72, Math.max(1.0, width * 0.22)), depth: 0.36, height: 0.34 });
                if (width * depth > 10)
                    add(room, { key: "dining", kind: "dining_table", position: [bounds.minX + width * 0.58, bounds.minY + depth * 0.68], rotation: wide ? 0 : Math.PI / 2, width: fit(1.45, 0.42, 0.9), depth: 0.82, height: 0.62 });
                return;
            }
            if (index === 1 || /卧|bed/i.test(room.name)) {
                add(room, { key: "bed", kind: "bed", position: [bounds.minX + width * 0.52, bounds.minY + depth * 0.42], rotation: wide ? 0 : Math.PI / 2, width: Math.min(1.9, Math.max(1.25, Math.min(width, depth) * 0.46)), depth: Math.min(2.05, Math.max(1.55, Math.max(width, depth) * 0.36)), height: 0.42 });
                add(room, { key: "wardrobe", kind: "wardrobe", position: [bounds.minX + width * 0.82, bounds.minY + depth * 0.78], rotation: wide ? Math.PI / 2 : 0, width: Math.min(1.65, Math.max(0.9, width * 0.24)), depth: 0.58, height: 1.18 });
                return;
            }
            if (/厨|kitchen/i.test(room.name) || index === 2) {
                add(room, { key: "cabinet-a", kind: "cabinet", position: [bounds.minX + width * 0.28, bounds.minY + depth * 0.78], rotation: wide ? 0 : Math.PI / 2, width: Math.min(1.35, Math.max(0.82, width * 0.28)), depth: 0.56, height: 0.7 });
                add(room, { key: "island", kind: "kitchen_island", position: [bounds.minX + width * 0.58, bounds.minY + depth * 0.55], rotation: wide ? 0 : Math.PI / 2, width: Math.min(1.48, Math.max(0.9, width * 0.3)), depth: 0.74, height: 0.72 });
                return;
            }
            if (/书|study|office/i.test(room.name) || width * depth > 5.5) {
                add(room, { key: "desk", kind: "desk", position: [bounds.minX + width * 0.52, bounds.minY + depth * 0.42], rotation: wide ? 0 : Math.PI / 2, width: Math.min(1.35, Math.max(0.8, width * 0.34)), depth: 0.62, height: 0.72 });
                add(room, { key: "shelf", kind: "bookshelf", position: [bounds.minX + width * 0.22, bounds.minY + depth * 0.72], rotation: wide ? Math.PI / 2 : 0, width: Math.min(1.2, Math.max(0.75, width * 0.24)), depth: 0.36, height: 1.15 });
                return;
            }
            add(room, { key: "cabinet", kind: "cabinet", position: [bounds.minX + width * 0.5, bounds.minY + depth * 0.52], rotation: wide ? 0 : Math.PI / 2, width: Math.min(1.1, Math.max(0.65, width * 0.34)), depth: 0.46, height: 0.58 });
        });
        return furniture;
    }
    roomBounds(room) {
        const xs = room.polygon.map((point) => point[0]);
        const ys = room.polygon.map((point) => point[1]);
        return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
    }
    roomArea(room) {
        return room.polygon.reduce((sum, point, index) => {
            const next = room.polygon[(index + 1) % room.polygon.length];
            return sum + point[0] * next[1] - next[0] * point[1];
        }, 0) / 2;
    }
    roomCentroid(room) {
        const area = this.roomArea(room);
        if (Math.abs(area) < 0.0001) {
            const total = room.polygon.reduce((sum, point) => [sum[0] + point[0], sum[1] + point[1]], [0, 0]);
            return [total[0] / room.polygon.length, total[1] / room.polygon.length];
        }
        let x = 0;
        let y = 0;
        for (let index = 0; index < room.polygon.length; index += 1) {
            const point = room.polygon[index];
            const next = room.polygon[(index + 1) % room.polygon.length];
            const factor = point[0] * next[1] - next[0] * point[1];
            x += (point[0] + next[0]) * factor;
            y += (point[1] + next[1]) * factor;
        }
        return [x / (6 * area), y / (6 * area)];
    }
    pointInRoom(point, room) {
        let inside = false;
        for (let current = 0, previous = room.polygon.length - 1; current < room.polygon.length; previous = current, current += 1) {
            const a = room.polygon[current];
            const b = room.polygon[previous];
            const intersects = (a[1] > point[1]) !== (b[1] > point[1])
                && point[0] < (b[0] - a[0]) * (point[1] - a[1]) / ((b[1] - a[1]) || Number.EPSILON) + a[0];
            if (intersects)
                inside = !inside;
        }
        return inside;
    }
    roomPoint(room, preferred) {
        if (this.pointInRoom(preferred, room))
            return preferred;
        const center = this.roomCentroid(room);
        if (this.pointInRoom(center, room))
            return center;
        const bounds = this.roomBounds(room);
        const midpoint = [(bounds.minX + bounds.maxX) / 2, (bounds.minY + bounds.maxY) / 2];
        return this.pointInRoom(midpoint, room) ? midpoint : room.polygon[0];
    }
    currentProjectPath() {
        return path.join(this.projectsDirectory, "current-project.json");
    }
    projectPath(id) {
        return path.join(this.projectsDirectory, projectFileName(id));
    }
    backupDirectory(id) {
        return path.join(this.projectsDirectory, "backups", Buffer.from(id).toString("base64url"));
    }
    async createBackup(id) {
        const project = this.projects.get(id);
        if (!project)
            throw new Error("Project not found");
        const directory = this.backupDirectory(id);
        await mkdir(directory, { recursive: true });
        await writeFile(path.join(directory, `backup-${Date.now()}.json`), JSON.stringify(project, null, 2), "utf8");
        const files = await readdir(directory);
        const stale = files.filter((file) => /^backup-\d+\.json$/.test(file)).sort().slice(0, -12);
        await Promise.all(stale.map((file) => unlink(path.join(directory, file))));
    }
    async persistProject(project) {
        await this.writeJsonAtomically(this.projectPath(project.id), project);
    }
    async persistCurrentProject() {
        const current = this.projects.get(this.currentProjectId);
        if (!current)
            throw new Error("Current project not found");
        await this.writeJsonAtomically(this.currentProjectPath(), current);
    }
    async writeJsonAtomically(filePath, value) {
        const temporaryPath = `${filePath}.tmp`;
        await writeFile(temporaryPath, JSON.stringify(value, null, 2), "utf8");
        await rename(temporaryPath, filePath);
    }
}
