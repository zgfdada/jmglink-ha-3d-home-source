import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
const ENV_FILE_NAMES = [".env", ".env.local"];
const ENV_KEY_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;
export function parseEnvFile(content) {
    const values = {};
    for (const rawLine of content.split(/\r?\n/)) {
        let line = rawLine.trim();
        if (!line || line.startsWith("#"))
            continue;
        if (line.startsWith("export ")) {
            line = line.slice("export ".length).trimStart();
        }
        const separatorIndex = line.indexOf("=");
        if (separatorIndex <= 0)
            continue;
        const key = line.slice(0, separatorIndex).trim();
        if (!ENV_KEY_PATTERN.test(key))
            continue;
        let value = line.slice(separatorIndex + 1).trim();
        const quote = value[0];
        if ((quote === `"` || quote === "'") && value.endsWith(quote)) {
            value = value.slice(1, -1);
        }
        else {
            value = value.replace(/\s+#.*$/, "").trim();
        }
        values[key] = value;
    }
    return values;
}
export function resolveEnvDirectory(startDirectory = process.cwd()) {
    let current = path.resolve(startDirectory);
    while (true) {
        if (ENV_FILE_NAMES.some((fileName) => existsSync(path.join(current, fileName)))) {
            return current;
        }
        const parent = path.dirname(current);
        if (parent === current)
            return path.resolve(startDirectory);
        current = parent;
    }
}
export function loadEnvFiles(options = {}) {
    const env = options.env ?? process.env;
    const directory = resolveEnvDirectory(options.cwd);
    const existingKeys = new Set(Object.keys(env));
    const mergedValues = {};
    const files = [];
    for (const fileName of ENV_FILE_NAMES) {
        const filePath = path.join(directory, fileName);
        if (!existsSync(filePath))
            continue;
        files.push(filePath);
        const values = parseEnvFile(readFileSync(filePath, "utf8"));
        for (const [key, value] of Object.entries(values)) {
            if (!existingKeys.has(key)) {
                mergedValues[key] = value;
            }
        }
    }
    const appliedKeys = Object.keys(mergedValues);
    for (const key of appliedKeys) {
        env[key] = mergedValues[key];
    }
    return { directory, files, appliedKeys };
}
