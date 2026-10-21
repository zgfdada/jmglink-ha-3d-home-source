export const normalizeHomeAssistantBaseUrl = (url) => {
  const normalized = url
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/api$/i, "");
  const parsed = new URL(normalized);
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Home Assistant 地址必须以 http:// 或 https:// 开头");
  }
  return parsed.toString().replace(/\/$/, "");
};
export const haConfigFromConnectionInput = (input) => {
  const baseUrl = normalizeHomeAssistantBaseUrl(input.url);
  const token = input.token.trim();
  if (!token) throw new Error("Home Assistant API Key 不能为空");
  return {
    restUrl: `${baseUrl}/api`,
    websocketUrl: `${baseUrl.replace(/^http/i, "ws")}/api/websocket`,
    token,
  };
};
export const homeAssistantBaseUrlFromRestUrl = (restUrl) =>
  restUrl.replace(/\/api\/?$/i, "");
const envValue = (env, key) => {
  const value = env[key]?.trim();
  return value ? value : undefined;
};
const addonModelLibraryDefaults = Object.freeze({
  url: "https://gitea.700117.xyz:16666",
  owner: "zgf",
  repo: "jmglink-ha-3d-model-library",
  branch: "main",
  mode: "readonly",
});
const modelLibraryConfig = (env, defaults = {}) => ({
  url: envValue(env, "HA3D_MODEL_LIBRARY_GITEA_URL") ?? defaults.url,
  apiUrl: envValue(env, "HA3D_MODEL_LIBRARY_GITEA_API_URL") ?? defaults.apiUrl,
  owner: envValue(env, "HA3D_MODEL_LIBRARY_OWNER") ?? defaults.owner,
  repo: envValue(env, "HA3D_MODEL_LIBRARY_REPO") ?? defaults.repo,
  branch:
    envValue(env, "HA3D_MODEL_LIBRARY_BRANCH") ?? defaults.branch ?? "main",
  token: envValue(env, "HA3D_MODEL_LIBRARY_TOKEN"),
  username: envValue(env, "HA3D_MODEL_LIBRARY_USERNAME"),
  password: envValue(env, "HA3D_MODEL_LIBRARY_PASSWORD"),
  mode: envValue(env, "HA3D_MODEL_LIBRARY_MODE") ?? defaults.mode ?? "readonly",
});
export function loadRuntimeConfig(env = process.env) {
  const supervisorToken = envValue(env, "SUPERVISOR_TOKEN");
  const mode =
    envValue(env, "HA3D_MODE") ?? (supervisorToken ? "addon" : "dev");
  const port = Number(envValue(env, "PORT") ?? 8099);
  if (mode === "addon") {
    return {
      mode,
      port,
      dataDir: envValue(env, "HA3D_DATA_DIR") ?? "/data",
      assetDir: envValue(env, "HA3D_ASSET_DIR") ?? "/config/assets",
      ha: {
        restUrl: "http://supervisor/core/api",
        websocketUrl: "ws://supervisor/core/websocket",
        token: supervisorToken,
      },
      modelLibrary: modelLibraryConfig(env, addonModelLibraryDefaults),
    };
  }
  const restUrl = normalizeHomeAssistantBaseUrl(
    envValue(env, "HA_URL") ?? "http://homeassistant.local:8123",
  );
  const websocketUrl =
    envValue(env, "HA_WS_URL") ??
    restUrl.replace(/^http/, "ws") + "/api/websocket";
  return {
    mode,
    port,
    dataDir: envValue(env, "HA3D_DATA_DIR") ?? "./data",
    assetDir: envValue(env, "HA3D_ASSET_DIR") ?? "./assets",
    ha: {
      restUrl: restUrl + "/api",
      websocketUrl,
      token: envValue(env, "HA_TOKEN"),
    },
    modelLibrary: modelLibraryConfig(env),
  };
}
