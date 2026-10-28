import { a as React } from "../vendor/react.js";
import {
  normalizeCameraSettings,
  safeCameraExternalUrl,
} from "../../../../packages/schema/src/camera-settings.js";
import "../styles/camera-monitor.css";
export default function CameraSettings({
  placement,
  modelId,
  entity,
  entities,
  onChange,
}) {
  const settings = normalizeCameraSettings(
    placement.cameraSettings,
    entity.entityId,
  ) ?? { ptzProvider: "auto" };
  const [url, setUrl] = React.useState(settings.externalUrl ?? "");
  const [error, setError] = React.useState("");
  const [providers, setProviders] = React.useState([]);
  React.useEffect(() => {
    setUrl(settings.externalUrl ?? "");
    setError("");
  }, [placement.id, settings.externalUrl]);
  const target = settings.ptzEntityId ?? entity.entityId;
  React.useEffect(() => {
    let active = true;
    setProviders([]);
    fetch(
      "./api/ha/cameras/" + encodeURIComponent(target) + "/ptz-capabilities",
    )
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        if (active) setProviders(data.providers ?? []);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [target]);
  const cameras = Object.values(entities).filter((e) => e.domain === "camera");
  const dual =
    modelId === "camera.dual" ||
    placement.customModel?.source?.shape === "camera-dual" ||
    entity.deviceModel?.source?.shape === "camera-dual";
  const commit = (patch) =>
    onChange(
      normalizeCameraSettings({ ...settings, ...patch }, entity.entityId),
    );
  return (
    <section className="property-section camera-settings">
      <h3>摄像头设置</h3>
      {dual && (
        <label>
          第二路摄像头
          <select
            aria-label="第二路摄像头"
            value={settings.secondaryEntityId ?? ""}
            onChange={(e) => commit({ secondaryEntityId: e.target.value })}
          >
            <option value="">未配置第二路</option>
            {cameras
              .filter((e) => e.entityId !== entity.entityId)
              .map((e) => (
                <option key={e.entityId} value={e.entityId}>
                  {e.name} · {e.entityId}
                </option>
              ))}
          </select>
        </label>
      )}
      <label>
        外部访问地址
        <input
          aria-label="摄像头外部访问地址"
          type="url"
          placeholder="https://摄像头或监控管理地址"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onBlur={() => {
            const clean = safeCameraExternalUrl(url);
            if (url.trim() && !clean) {
              setError("请填写 HTTP/HTTPS 地址，不要包含账号、密码或令牌");
              return;
            }
            setError("");
            commit({ externalUrl: clean || undefined });
          }}
        />
      </label>
      <label>
        云台控制
        <select
          aria-label="云台控制方式"
          value={settings.ptzProvider}
          onChange={(e) => commit({ ptzProvider: e.target.value })}
        >
          <option value="auto">自动检测 HA 服务</option>
          <option value="none">关闭云台控制</option>
          {providers.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
          {!["auto", "none", ...providers.map((p) => p.id)].includes(
            settings.ptzProvider,
          ) && (
            <option value={settings.ptzProvider}>
              {settings.ptzProvider}（当前不可用）
            </option>
          )}
        </select>
      </label>
      <label>
        云台目标
        <select
          aria-label="云台目标摄像头"
          value={settings.ptzEntityId ?? ""}
          onChange={(e) => commit({ ptzEntityId: e.target.value })}
        >
          <option value="">跟随当前播放画面</option>
          {cameras.map((e) => (
            <option key={e.entityId} value={e.entityId}>
              {e.name} · {e.entityId}
            </option>
          ))}
        </select>
      </label>
      <small>
        仅显示当前 HA 实际提供的云台服务。Frigate 需已配置
        ONVIF；支持服务不代表已验证硬件可转动。外部地址仅用于跳转，不会自动访问。
      </small>
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
