import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { haConfigFromConnectionInput, homeAssistantBaseUrlFromRestUrl } from "./runtime.js";
export class HaConfigStore {
    filePath;
    constructor(filePath) {
        this.filePath = filePath;
    }
    static async create(dataDir) {
        const directory = path.resolve(dataDir);
        await mkdir(directory, { recursive: true });
        return new HaConfigStore(path.join(directory, "ha-connection.json"));
    }
    async load() {
        try {
            const value = JSON.parse(await readFile(this.filePath, "utf8"));
            if (!value.restUrl || !value.websocketUrl || !value.token)
                return undefined;
            return {
                restUrl: String(value.restUrl),
                websocketUrl: String(value.websocketUrl),
                token: String(value.token),
                updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : new Date().toISOString(),
            };
        }
        catch {
            return undefined;
        }
    }
    async save(input) {
        const ha = haConfigFromConnectionInput(input);
        const stored = { ...ha, token: ha.token ?? "", updatedAt: new Date().toISOString() };
        await this.writeJsonAtomically(stored);
        return stored;
    }
    toRuntimeHa(config) {
        return {
            restUrl: config.restUrl,
            websocketUrl: config.websocketUrl,
            token: config.token,
        };
    }
    toEditableUrl(config) {
        return homeAssistantBaseUrlFromRestUrl(config.restUrl);
    }
    async writeJsonAtomically(value) {
        const temporaryPath = `${this.filePath}.tmp`;
        await writeFile(temporaryPath, JSON.stringify(value, null, 2), "utf8");
        await rename(temporaryPath, this.filePath);
    }
}
