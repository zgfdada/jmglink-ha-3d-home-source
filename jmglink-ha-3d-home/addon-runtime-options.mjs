import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const runtimeOptionsModule = await import("./apps/server/src/config/addonRuntimeOptions.js")
  .catch(() => import("./source/apps/server/src/config/addonRuntimeOptions.js"));
export const { normalizeAddonRuntimeOptions } = runtimeOptionsModule;

export async function loadAddonRuntimeOptions(filePath = "/data/options.json") {
  try {
    return normalizeAddonRuntimeOptions(
      JSON.parse(await readFile(filePath, "utf8")),
    );
  } catch (error) {
    if (error?.code !== "ENOENT") {
      console.error("Unable to read numeric Home Assistant Add-on options", error);
    }
    return normalizeAddonRuntimeOptions();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const options = await loadAddonRuntimeOptions(process.argv[2]);
  process.stdout.write(
    `${options.nodeMaxOldSpaceMb} ${options.niceLevel} ${options.resourceLogIntervalMinutes}`,
  );
}
