import { a as React } from "../vendor/react.js";
import "../styles/voice-assistant-settings.css";

import { callVoiceAssistant as call } from "../domain/voice-assistant-api.js";

export function VoiceAssistantSettings({
  menuOpen,
  closeMenu,
  onConfigChange,
}) {
  const [open, setOpen] = React.useState(false);
  const [config, setConfig] = React.useState(null);
  const [pipelines, setPipelines] = React.useState([]);
  const [message, setMessage] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [dirty, setDirty] = React.useState(false);
  const dialog = React.useRef(null);
  const load = async () => {
    try {
      const data = await call("config");
      setConfig({ ...data, hermes: { ...data.hermes, apiKey: "" } });
      setDirty(false);
      onConfigChange(data);
    } catch (error) {
      setMessage(error.message);
    }
  };
  React.useEffect(() => {
    load();
  }, []);
  React.useEffect(() => {
    if (!open) return;
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, [open]);
  const edit = (name, value) => {
    setDirty(true);
    setMessage("");
    setConfig((c) => ({ ...c, [name]: value }));
  };
  const editHermes = (name, value) => {
    setDirty(true);
    setMessage("");
    setConfig((c) => ({ ...c, hermes: { ...c.hermes, [name]: value } }));
  };
  const start = async () => {
    closeMenu();
    setOpen(true);
    setMessage("");
    await load();
    try {
      const r = await fetch("./api/ha/assist-pipelines");
      if (r.ok) setPipelines((await r.json()).pipelines ?? []);
    } catch {}
  };
  const save = async (event) => {
    event.preventDefault();
    setBusy(true);
    setMessage("正在保存…");
    try {
      const { apiKeyConfigured, ...hermes } = config.hermes;
      const payload = {
        provider: config.provider,
        pipelineId: config.pipelineId,
        playback: config.playback,
        hermes,
        clearApiKey: Boolean(config.clearApiKey),
      };
      const result = await call("config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setConfig({ ...result, hermes: { ...result.hermes, apiKey: "" } });
      setDirty(false);
      onConfigChange(result);
      setMessage("配置已保存");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  };
  const test = async () => {
    setBusy(true);
    setMessage("正在测试连接…");
    try {
      const result = await call("test", { method: "POST" });
      setMessage(
        result.message +
          (result.target
            ? ` · @${result.target.botUsername} · 会话 ${result.target.chatId}${result.target.threadId ? " / 话题 " + result.target.threadId : ""}`
            : ""),
      );
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      {menuOpen && (
        <div className="va-context" role="menu" aria-label="语音助手菜单">
          <button role="menuitem" onClick={start}>
            语音助手配置
          </button>
        </div>
      )}
      {open && (
        <dialog
          ref={dialog}
          className="va-dialog"
          aria-labelledby="va-title"
          onCancel={() => setOpen(false)}
        >
          <header>
            <h2 id="va-title">语音助手配置</h2>
            <button
              type="button"
              aria-label="关闭语音助手配置"
              onClick={() => setOpen(false)}
            >
              ×
            </button>
          </header>
          <p>
            长按说话或输入文字，由所选助手理解并执行。右键麦克风图标可再次打开配置。
          </p>
          {!config ? (
            <p>配置加载失败，请关闭后重试。</p>
          ) : (
            <form onSubmit={save}>
              <fieldset disabled={busy}>
                <label>
                  执行助手
                  <select
                    value={config.provider}
                    onChange={(e) => edit("provider", e.target.value)}
                  >
                    <option value="ha">Home Assistant 语音助手</option>
                    <option value="hermes">
                      Hermes · 复用 Telegram Bot 会话
                    </option>
                  </select>
                </label>
                {config.provider === "ha" ? (
                  <section>
                    <label>
                      HA 助手
                      <select
                        value={config.pipelineId}
                        onChange={(e) => edit("pipelineId", e.target.value)}
                      >
                        <option value="">HA 默认助手</option>
                        {config.pipelineId &&
                          !pipelines.some(
                            (p) => p.id === config.pipelineId,
                          ) && (
                            <option value={config.pipelineId}>
                              {config.pipelineId}
                            </option>
                          )}
                        {pipelines.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name || p.id}
                          </option>
                        ))}
                      </select>
                    </label>
                    <p>使用现有 HA 连接，无需另填 HA Token。</p>
                    <p><a href="./agent-skills/ha3d-ha-assistant.zip" download>下载 HA 语音助手连接 skill 包</a> · <a href="./agent-skills/ha3d-ha-assistant/SKILL.md" target="_blank" rel="noreferrer">查看 skill 文档</a></p>
                  </section>
                ) : (
                  <section>
                    <p>
                      指令进入网关绑定的现有 TG
                      会话，共用上下文与控制工具，回复同时显示在 TG
                      和本页面。这里连接的是会话共享网关，不是 Telegram Bot
                      API。
                    </p>
                    <p><a href="./agent-skills/ha3d-hermes-telegram.zip" download>下载 Hermes 通道连接 skill 包</a> · <a href="./agent-skills/ha3d-hermes-telegram/SKILL.md" target="_blank" rel="noreferrer">查看 skill 文档</a></p>
                    <label>
                      共享网关地址
                      <input
                        type="url"
                        required
                        value={config.hermes.baseUrl}
                        placeholder="http://192.168.31.220:8645"
                        onChange={(e) => editHermes("baseUrl", e.target.value)}
                      />
                    </label>
                    <label>
                      网关访问密钥
                      <input
                        type="password"
                        autoComplete="new-password"
                        value={config.hermes.apiKey}
                        placeholder={
                          config.hermes.apiKeyConfigured
                            ? "已保存；留空保持原密钥"
                            : "填写网关密钥（不是 TG Bot Token）"
                        }
                        onChange={(e) => editHermes("apiKey", e.target.value)}
                      />
                    </label>
                    <label className="va-check">
                      <input
                        type="checkbox"
                        checked={Boolean(config.clearApiKey)}
                        onChange={(e) => edit("clearApiKey", e.target.checked)}
                      />
                      清除已保存密钥（需切回 HA 后保存）
                    </label>
                    <label>
                      网关配置标识
                      <input
                        required
                        maxLength={128}
                        value={config.hermes.model}
                        onChange={(e) => editHermes("model", e.target.value)}
                      />
                    </label>
                    <label>
                      等待回复（秒）
                      <input
                        type="number"
                        min="10"
                        max="300"
                        required
                        value={config.hermes.timeoutSeconds}
                        onChange={(e) =>
                          editHermes("timeoutSeconds", Number(e.target.value))
                        }
                      />
                    </label>
                  </section>
                )}
                <section className="va-playback">
                  <label className="va-check"><input type="checkbox"
                    checked={Boolean(config.playback?.enabled)}
                    onChange={(e) => edit("playback", { ...config.playback, enabled: e.target.checked })} />
                    自动语音播报回复与选择问题
                  </label>
                  <label>播报音量 · {Math.round((config.playback?.volume ?? 0.6) * 100)}%
                    <input type="range" min="0" max="100" step="5"
                      value={Math.round((config.playback?.volume ?? 0.6) * 100)}
                      onChange={(e) => edit("playback", { ...config.playback, volume: Number(e.target.value) / 100 })} />
                  </label>
                  <small>使用浏览器／系统中文语音，音量还受系统音量影响。开始录音时停止播报。</small>
                </section>
                <footer>
                  <button type="submit">保存配置</button>
                  <button type="button" disabled={dirty} onClick={test}>
                    测试已保存连接
                  </button>
                  <button type="button" onClick={() => setOpen(false)}>
                    关闭
                  </button>
                </footer>
                {dirty && <small>配置有修改，请先保存，再测试连接。</small>}
              </fieldset>
            </form>
          )}
          {message && (
            <p className="va-result" role="status">
              {message}
            </p>
          )}
        </dialog>
      )}
    </>
  );
}
