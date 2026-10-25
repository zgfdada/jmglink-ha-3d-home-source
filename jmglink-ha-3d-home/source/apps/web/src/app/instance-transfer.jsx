import { a as React } from "../vendor/react.js";
export default function InstanceTransfer({ onClose }) {
  const [busy, setBusy] = React.useState(false),
    [message, setMessage] = React.useState(""),
    [incoming, setIncoming] = React.useState(null);
  const file = React.useRef(null);
  async function request(method, body) {
    const response = await fetch("api/instance-backup", {
      method,
      headers: { "Content-Type": "application/json" },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const value = await response.json();
    if (!response.ok) throw Error(value.message || "导入导出失败");
    return value;
  }
  async function download() {
    setBusy(true);
    try {
      const value = await request("GET");
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(value)], { type: "application/json" }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = `3dhome-instance-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage("全局备份已导出");
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function restore() {
    setBusy(true);
    try {
      await request("POST", { backup: incoming, confirm: true });
      setMessage("导入成功，正在重新载入实例");
      window.location.reload();
    } catch (e) {
      setMessage(e.message);
      setBusy(false);
    }
  }
  return (
    <div className="sb-floating-backdrop instance-transfer-backdrop" onClick={event => { if(event.target === event.currentTarget && !busy) onClose(); }}>
      <section
        className="instance-transfer"
        role="dialog"
        aria-modal="true"
        aria-label="全局导入导出"
      >
        <header>
          <h2>全局导入导出</h2>

        </header>
        <p>
          包含全部户型、自定义设备和模型素材、控件库、所有楼层侧栏草稿与发布布局。可用于空实例恢复。
        </p>
        <p>
          HA 和 Hermes
          的地址、密钥、登录状态不随包迁移，恢复后重新配置连接。包中保留实体绑定，请核对目标
          HA 的实体。
        </p>
        <p>导出：将当前设计保存为文件。导入：从已有文件恢复设计。</p>
        <div>
          <button disabled={busy} onClick={download}>
            导出实例
          </button>
          <button disabled={busy} onClick={() => file.current.click()}>
            导入实例
          </button>
        </div>
        <input
          ref={file}
          type="file"
          accept=".json,application/json"
          hidden
          onChange={async (e) => {
            setIncoming(null);
            try {
              const f = e.target.files?.[0];
              if (!f) return;
              if (f.size > 128 * 1024 * 1024) throw Error("备份超过 128MB");
              const value = JSON.parse(await f.text());
              if (
                value.format !== "ha3d-instance-backup" ||
                value.version !== 1 ||
                !Array.isArray(value.projects)
              )
                throw Error("请选择完整实例备份文件");
              setIncoming(value);
              setMessage("已读取，请核对恢复范围");
            } catch (err) {
              setMessage(err.message);
            }
            e.target.value = "";
          }}
        />
        {incoming && (
          <div className="instance-import-confirm">
            <p>
              将恢复 {incoming.projects.length}{" "}
              个户型及配套资源，替换当前全部业务设计。当前内容会保留恢复前备份。
            </p>
            <button disabled={busy} onClick={restore}>
              确认替换并恢复完整实例
            </button>
          </div>
        )}
        <small>点击浮层外的空白处返回。</small>
        <p role="status">{busy ? "处理中，请勿关闭页面。" : message}</p>
      </section>
    </div>
  );
}
