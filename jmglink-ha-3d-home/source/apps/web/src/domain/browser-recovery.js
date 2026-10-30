import {isWebglFailure} from './webgl-recovery.js';
const KEY = "ha3d.chunk-recovery";
export function isChunkFailure(error) {
  return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Loading (?:CSS )?chunk|Unable to preload CSS/i.test(
    String(error?.message ?? error ?? ""),
  );
}
export function recoverChunkFailure(
  error,
  {
    storage,
    now = Date.now(),
    reload = () => globalThis.location.reload(),
    online = globalThis.navigator?.onLine !== false,
  } = {},
) {
  if (!online || !isChunkFailure(error)) return false;
  try {
    const cache = storage ?? globalThis.sessionStorage;
    const previous = Number(cache.getItem(KEY));
    if (previous > 0 && now - previous < 60000) return false;
    cache.setItem(KEY, String(now));
    reload();
    return true;
  } catch {
    return false;
  }
}
export function clientErrorRecord(error, kind = "runtime") {
  const message = String(error?.message ?? error ?? "");
  const property = message.match(
    /Cannot read properties of (null|undefined) \(reading ['"]([a-zA-Z_$][\w$]{0,50})['"]\)/,
  );
  const react = message.match(/Minified React error #(\d+)/);
  const signature = isWebglFailure(error) ? 'webgl-context' : isChunkFailure(error)
    ? "chunk-load"
    : property
      ? `null-access:${property[1]}:${property[2]}`
      : react
        ? `react:${react[1]}`
        : /Maximum update depth/.test(message)
          ? "render-loop"
          : /Rendered (?:more|fewer) hooks/.test(message)
            ? "hook-order"
            : "unknown";
  const name = /^[A-Za-z]{1,32}(?:Error|Exception)$/.test(error?.name ?? "")
    ? error.name
    : "Error";
  // Keep only source positions. Never send error text, URLs, query strings or app state.
  const frames = [
    ...String(error?.stack ?? "").matchAll(
      /(?:assets|src)\/[A-Za-z0-9_.\/-]+\.(?:m?js|jsx):\d+(?::\d+)?/g,
    ),
  ]
    .map((m) => m[0])
    .slice(0, 8);
  return { kind, signature, name, frames };
}
const reported = new Map();
export function reportClientError(error, kind = "runtime") {
  const record = clientErrorRecord(error, kind),
    key = JSON.stringify(record),
    now = Date.now();
  if (now - (reported.get(key) ?? 0) < 10000) return;
  reported.set(key, now);
  if (reported.size > 50) reported.delete(reported.keys().next().value);
  void fetch("./api/client-errors", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(record),
    keepalive: true,
  }).catch(() => {});
}
export function showStartupFailure() {
  const title = document.getElementById("boot-title"),
    message = document.getElementById("boot-message"),
    button = document.getElementById("boot-reload");
  if (title) title.textContent = "界面加载遇到问题";
  if (message) message.textContent = "请重新加载页面，已保存的配置会保留。";
  if (button) button.hidden = false;
}
export function installBrowserRecovery(win = window) {
  const preload = (event) => {
    reportClientError(event.payload, "chunk");
    if (recoverChunkFailure(event.payload)) event.preventDefault();
  };
  const error = (event) => {
    if (event.error) reportClientError(event.error, "runtime");
  };
  const rejection = (event) => reportClientError(event.reason, "runtime");
  win.addEventListener("vite:preloadError", preload);
  win.addEventListener("error", error);
  win.addEventListener("unhandledrejection", rejection);
  return () => {
    win.removeEventListener("vite:preloadError", preload);
    win.removeEventListener("error", error);
    win.removeEventListener("unhandledrejection", rejection);
  };
}
