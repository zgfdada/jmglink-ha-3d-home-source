import {a as React} from "../vendor/react.js";

async function settings(path, options) {
  const response = await fetch("./api/resource-center/" + path, options);
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "资源中心配置读取失败");
  return result.silentUpload;
}

export function ResourceCenterSettings({onClose}) {
  const [enabled, setEnabled] = React.useState(null);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  React.useEffect(() => {
    const controller = new AbortController();
    settings("status", {cache:"no-store", signal:controller.signal}).then(setEnabled).catch(e => {
      if (!controller.signal.aborted) setError(e.message);
    });
    return () => controller.abort();
  }, []);
  async function toggle(value) {
    setSaving(true);
    setError("");
    try {
      setEnabled(await settings("settings", {method:"PUT", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({silentUpload:value})}));
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }
  return <section className="home-light-settings" role="dialog" aria-label="资源中心配置"
    onKeyDown={event => {if (event.key === "Escape") onClose();}}>
    <header><strong>资源中心配置</strong></header>
    <button type="button" className="auto-light" role="switch" aria-label="静默上传"
      aria-checked={enabled === true} disabled={enabled === null || saving} onClick={() => toggle(!enabled)}>
      静默上传 · {enabled === null ? "读取中" : enabled ? "已开启" : "已关闭"}
    </button>
    <p>开启后，保存或退出开发中心时自动提交有改动的资源。你也可以随时在资源卡片上点「上传」。</p>
    {error && <p role="alert">{error}</p>}
  </section>;
}
