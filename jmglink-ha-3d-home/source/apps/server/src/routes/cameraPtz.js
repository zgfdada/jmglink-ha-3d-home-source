import { normalizeCameraSettings } from "../../../../packages/schema/src/camera-settings.js";
const fail = (message, statusCode = 400) =>
  Object.assign(new Error(message), { statusCode });
const commands = new Set([
  "left",
  "right",
  "up",
  "down",
  "zoom_in",
  "zoom_out",
  "stop",
]);
export function cameraPtzProvider(entity, requested = "auto", catalog = []) {
  if (requested === "none") return undefined;
  const integration = entity.integration ?? entity.platform;
  const candidates = ["frigate", "onvif"].filter(
    (domain) =>
      integration === domain &&
      catalog.some((d) => d.domain === domain && d.services?.ptz),
  );
  return requested === "auto"
    ? candidates[0]
    : candidates.includes(requested)
      ? requested
      : undefined;
}
export function cameraPtzData(provider, entityId, command) {
  if (!commands.has(command)) throw fail("无效的云台指令");
  if (provider === "frigate")
    return {
      entity_id: entityId,
      action:
        command === "stop"
          ? "stop"
          : command.startsWith("zoom_")
            ? "zoom"
            : "move",
      ...(command === "stop"
        ? {}
        : {
            argument:
              command === "zoom_in"
                ? "in"
                : command === "zoom_out"
                  ? "out"
                  : command,
          }),
    };
  if (provider !== "onvif") throw fail("云台服务不可用");
  const data = {
    entity_id: entityId,
    move_mode: command === "stop" ? "Stop" : "RelativeMove",
    distance: 0.1,
    speed: 0.4,
  };
  if (["left", "right"].includes(command)) data.pan = command.toUpperCase();
  if (["up", "down"].includes(command)) data.tilt = command.toUpperCase();
  if (command.startsWith("zoom_")) data.zoom = command.toUpperCase();
  return data;
}
export function registerCameraPtzRoutes(app, ha, projects) {
  let cached = [],
    expires = 0;
  const moving = new Set();
  async function catalog() {
    if (Date.now() < expires) return cached;
    if (!ha.config.ha.token) throw fail("尚未连接 Home Assistant", 503);
    const r = await fetch(ha.config.ha.restUrl + "/services", {
      headers: { Authorization: "Bearer " + ha.config.ha.token },
      signal: AbortSignal.timeout(5000),
    });
    if (!r.ok) throw fail("无法读取云台服务", 502);
    cached = await r.json();
    expires = Date.now() + 30000;
    return cached;
  }
  const camera = (id) => {
    const e = ha
      .getEntities()
      .find((e) => e.entityId === id && e.domain === "camera");
    if (!e) throw fail("摄像头实体不存在", 404);
    return e;
  };
  app.get("/api/ha/cameras/:entityId/ptz-capabilities", async (req) => {
    const e = camera(req.params.entityId),
      services = await catalog();
    return {
      providers: ["frigate", "onvif"]
        .filter((p) => cameraPtzProvider(e, p, services))
        .map((id) => ({ id, label: id === "frigate" ? "Frigate" : "ONVIF" })),
      autoProvider: cameraPtzProvider(e, "auto", services) ?? null,
    };
  });
  app.post(
    "/api/ha/cameras/:entityId/ptz",
    { bodyLimit: 4096 },
    async (req) => {
      const origin = req.headers.origin;
      if (
        req.headers["sec-fetch-site"] &&
        req.headers["sec-fetch-site"] !== "same-origin"
      )
        throw fail("不允许跨站云台操作", 403);
      if (origin && new URL(origin).host !== req.headers.host)
        throw fail("不允许跨站云台操作", 403);
      if (!req.headers["content-type"]?.startsWith("application/json"))
        throw fail("需要 JSON", 415);
      const body = req.body ?? {};
      if (!commands.has(body.command)) throw fail("无效的云台指令");
      const p = projects.getProject(body.projectId);
      const placement = p?.floors
        .flatMap((f) => f.devices)
        .find((d) => d.id === body.placementId);
      if (!placement || placement.kind !== "camera")
        throw fail("请先保存摄像头摆放与配置", 404);
      const settings = normalizeCameraSettings(
        placement.cameraSettings,
        placement.entityId,
      );
      if (
        ![placement.entityId, settings?.secondaryEntityId].includes(
          req.params.entityId,
        )
      )
        throw fail("操作目标未绑定到此摄像头", 403);
      const target = settings?.ptzEntityId ?? req.params.entityId;
      const e = camera(target);
      if (["unavailable", "unknown"].includes(e.state))
        throw fail("摄像头当前不可用", 409);
      const provider = cameraPtzProvider(
        e,
        settings?.ptzProvider ?? "auto",
        await catalog(),
      );
      if (!provider) throw fail("该摄像头未提供所选云台服务", 409);
      async function call(command) {
        const r = await fetch(
          ha.config.ha.restUrl + "/services/" + provider + "/ptz",
          {
            method: "POST",
            headers: {
              Authorization: "Bearer " + ha.config.ha.token,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(cameraPtzData(provider, target, command)),
            signal: AbortSignal.timeout(5000),
          },
        );
        if (!r.ok)
          throw fail(
            "云台操作失败，请确认集成已启用云台（" + r.status + "）",
            502,
          );
      }
      if (body.command === "stop") {
        await call("stop");
        return { ok: true };
      }
      if (moving.has(target)) throw fail("云台正在移动，请稍后重试", 409);
      moving.add(target);
      try {
        if (provider === "frigate") {
          try {
            await call(body.command);
            await new Promise((resolve) => setTimeout(resolve, 300));
          } finally {
            await call("stop");
          }
        } else await call(body.command);
        return { ok: true };
      } finally {
        moving.delete(target);
      }
    },
  );
}
