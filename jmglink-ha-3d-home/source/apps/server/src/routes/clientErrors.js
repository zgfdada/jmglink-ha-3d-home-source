export function normalizeClientError(raw = {}) {
  raw = raw && typeof raw === "object" ? raw : {};
  return {
    kind: ["chunk", "center", "render", "runtime", "startup"].includes(raw.kind)
      ? raw.kind
      : "runtime",
    signature:
      /^(?:webgl-context|chunk-load|render-loop|hook-order|unknown|react:\d{1,5}|null-access:(?:null|undefined):[a-zA-Z_$][\w$]{0,50})$/.test(
        raw.signature ?? "",
      )
        ? raw.signature
        : "unknown",
    name: /^[A-Za-z]{1,32}(?:Error|Exception)$/.test(raw.name ?? "")
      ? raw.name
      : "Error",
    frames: (Array.isArray(raw.frames) ? raw.frames : [])
      .filter(
        (f) =>
          typeof f === "string" &&
          /^(?:assets|src)\/[A-Za-z0-9_.\/-]+\.(?:m?js|jsx):\d+(?::\d+)?$/.test(
            f,
          ) &&
          f.length < 240 &&
          !f.includes(".."),
      )
      .slice(0, 8),
  };
}
export async function registerClientErrorRoutes(app) {
  app.post("/api/client-errors", { bodyLimit: 8192 }, async (request) => {
    app.log.warn(
      { clientError: normalizeClientError(request.body) },
      "Frontend error",
    );
    return { ok: true };
  });
}
