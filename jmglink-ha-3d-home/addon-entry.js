import { readFile } from "node:fs/promises";

const logLevelMap = new Map([
  ["trace", "trace"],
  ["debug", "debug"],
  ["info", "info"],
  ["warning", "warn"],
  ["error", "error"],
]);

try {
  const options = JSON.parse(await readFile("/data/options.json", "utf8"));
  const logLevel = logLevelMap.get(options.log_level);
  if (logLevel) {
    process.env.LOG_LEVEL = logLevel;
  }
} catch (error) {
  if (error?.code !== "ENOENT") {
    console.warn("Unable to read Home Assistant Add-on options", error);
  }
}

process.env.HA3D_MODE = "addon";
process.env.PORT ??= "8099";
process.env.HA3D_DATA_DIR ??= "/data";
process.env.HA3D_ASSET_DIR ??= "/config/assets";

await import("./apps/server/src/main.js");
