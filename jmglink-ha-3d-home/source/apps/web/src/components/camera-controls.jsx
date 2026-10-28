import { a as React } from "../vendor/react.js";
import {
  cameraPlacement,
  cameraChannels,
  normalizeCameraSettings,
} from "../../../../packages/schema/src/camera-settings.js";
import CameraMonitor from "./camera-monitor.jsx";
import "../styles/camera-monitor.css";
function ExternalCameraLink({ url }) {
  return url ? (
    <a
      className="camera-external-link"
      href={url}
      target="_blank"
      rel="noopener noreferrer"
    >
      在外部页面访问及控制 ↗
    </a>
  ) : null;
}
function CameraPtzControls({ entity, placement, projectId }) {
  const settings = normalizeCameraSettings(
    placement?.cameraSettings,
    placement?.entityId,
  );
  const target = settings?.ptzEntityId ?? entity.entityId;
  const [capabilities, setCapabilities] = React.useState(null);
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const live = React.useRef(true);
  React.useEffect(() => {
    let active = true;
    live.current = true;
    setCapabilities(null);
    setError("");
    fetch(
      "./api/ha/cameras/" + encodeURIComponent(target) + "/ptz-capabilities",
    )
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        if (active) setCapabilities(data);
      })
      .catch(() => {
        if (active)
          setCapabilities({ providers: [], autoProvider: null });
      });
    return () => {
      active = false;
      live.current = false;
    };
  }, [target]);
  const configured = settings?.ptzProvider ?? "auto";
  const provider =
    configured === "none"
      ? null
      : configured === "auto"
        ? capabilities?.autoProvider
        : capabilities?.providers?.some((p) => p.id === configured)
          ? configured
          : null;
  async function run(command) {
    setError("");
    setBusy(true);
    try {
      const r = await fetch(
        "./api/ha/cameras/" + encodeURIComponent(entity.entityId) + "/ptz",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId,
            placementId: placement.id,
            command,
          }),
        },
      );
      const data = await r.json();
      if (!r.ok) throw Error(data.error ?? "云台控制失败");
    } catch (e) {
      if (live.current) setError(e.message);
    } finally {
      if (live.current) setBusy(false);
    }
  }
  if (configured === "none") return null;
  if (!provider)
    return (
      <p className="camera-ptz-note">
        {capabilities
          ? "当前画面未检测到可用云台服务，可配置其他云台实体或使用外部访问地址。"
          : "正在检测云台服务…"}
      </p>
    );
  return (
    <section className="camera-ptz">
      <header>
        <strong>云台控制</strong>
        <small>{provider === "frigate" ? "Frigate" : "ONVIF"} · 短按微调</small>
      </header>
      <div className="camera-ptz-grid">
        {[
          ["up", "↑", "向上"],
          ["left", "←", "向左"],
          ["stop", "■", "停止云台"],
          ["right", "→", "向右"],
          ["down", "↓", "向下"],
          ["zoom_in", "＋", "放大"],
          ["zoom_out", "－", "缩小"],
        ].map(([command, icon, label]) => (
          <button
            key={command}
            type="button"
            className={"ptz-" + command}
            aria-label={label}
            disabled={
              !placement ||
              entity.state === "unavailable" ||
              (busy && command !== "stop")
            }
            onClick={() => run(command)}
          >
            {icon}
          </button>
        ))}
      </div>
      <small>
        移动幅度有限；Frigate
        每次短移后自动发送停止。实际可用性以摄像头集成为准。
      </small>
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
function channelsFor(entity, placement, entities) {
  const channels = cameraChannels(entity, placement, entities);
  const dual =
    placement?.modelId === "camera.dual" ||
    placement?.customModel?.source?.shape === "camera-dual" ||
    entity.deviceModel?.source?.shape === "camera-dual";
  if (dual && channels.length === 1)
    channels.push({ id: "", label: "第二路", entity: null });
  return channels;
}
export function CameraViewer({
  entity,
  project,
  entities,
  initialChannel,
  onClose,
  renderLive,
}) {
  const placement = cameraPlacement(project, entity.entityId);
  const channels = channelsFor(entity, placement, entities);
  const [active, setActive] = React.useState(initialChannel ?? channels[0].id);
  const channel =
    channels.find((c) => c.id === active && c.entity) ?? channels[0];
  const settings = normalizeCameraSettings(
    placement?.cameraSettings,
    placement?.entityId,
  );
  return (
    <CameraMonitor entity={channel.entity} onClose={onClose}>
      <div
        className="camera-channel-tabs"
        role="tablist"
        aria-label="摄像头画面"
      >
        {channels.map((c, index) => (
          <button
            key={c.id || index}
            id={"camera-tab-" + index}
            role="tab"
            aria-selected={channel.id === c.id}
            aria-controls="camera-channel-panel"
            disabled={!c.entity}
            tabIndex={channel.id === c.id ? 0 : -1}
            onClick={() => setActive(c.id)}
            onKeyDown={(event) => {
              if (
                ["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)
              ) {
                event.preventDefault();
                const enabled = channels.filter((c) => c.entity);
                const current = enabled.findIndex((c) => c.id === channel.id);
                const next =
                  event.key === "Home"
                    ? 0
                    : event.key === "End"
                      ? enabled.length - 1
                      : (current +
                          (event.key === "ArrowRight" ? 1 : -1) +
                          enabled.length) %
                        enabled.length;
                setActive(enabled[next].id);
                document
                  .getElementById(
                    "camera-tab-" + channels.indexOf(enabled[next]),
                  )
                  ?.focus();
              }
            }}
          >
            {c.label}
          </button>
        ))}
      </div>
      <div
        id="camera-channel-panel"
        role="tabpanel"
        aria-labelledby={"camera-tab-" + channels.indexOf(channel)}
      >
        {renderLive(channel.entity, channel.id)}
        <CameraPtzControls
          key={"ptz-" + channel.id}
          entity={channel.entity}
          placement={placement}
          projectId={project?.id}
        />
      </div>
      <ExternalCameraLink url={settings?.externalUrl} />
    </CameraMonitor>
  );
}
export default function CameraControlPanel({
  entity,
  project,
  entities,
  renderLive,
}) {
  const placement = cameraPlacement(project, entity.entityId);
  const channels = channelsFor(entity, placement, entities);
  const settings = normalizeCameraSettings(
    placement?.cameraSettings,
    placement?.entityId,
  );
  const [active, setActive] = React.useState(null);
  return (
    <div className="camera-control-panel">
      <div
        className={
          "camera-thumbnail-grid " + (channels.length > 1 ? "dual" : "")
        }
      >
        {channels.map((c, index) => (
          <button
            key={c.id || index}
            type="button"
            className="camera-thumbnail"
            disabled={!c.entity}
            aria-label={"播放" + c.label + "画面"}
            onClick={() => setActive(c.id)}
          >
            {c.entity && c.entity.state !== "unavailable" ? (
              <img
                src={
                  "./api/ha/cameras/" + encodeURIComponent(c.id) + "/snapshot"
                }
                alt={c.label + "缩略图"}
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <span className="camera-thumbnail-empty">
                {c.entity ? "摄像头不可用" : "请配置第二路摄像头"}
              </span>
            )}
            <span className="camera-thumbnail-caption">
              {c.label} · {c.entity ? "▶ 播放" : "未配置"}
            </span>
          </button>
        ))}
      </div>
      <ExternalCameraLink url={settings?.externalUrl} />
      {active !== null && (
        <CameraViewer
          entity={entity}
          project={project}
          entities={entities}
          initialChannel={active}
          onClose={() => setActive(null)}
          renderLive={renderLive}
        />
      )}
    </div>
  );
}
