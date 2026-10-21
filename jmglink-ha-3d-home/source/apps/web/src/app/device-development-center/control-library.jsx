import { a as React } from "../../vendor/react.js";
import ControlProperties from "../../components/control-properties.jsx";
import DevicePanel from "../../components/device-panel.jsx";
import { samplePanelStates } from "../../domain/device-panel.js";
import {
  builtinControls,
  normalizeLibraryControl,
  normalizeLibraryPackage,
  attachLibraryControl,
  PANEL_COMPONENTS,
  editableLibraryControl,
  DATA_TYPES,
  CONTROL_PACKAGE_FORMAT,
  withControlPropertyDefault,
} from "../../../../../packages/schema/src/control-library.js";
import "../../styles/control-library.css";
const endpoint = "./api/control-library";
async function api(url, options) {
  const response = await fetch(url, {
    ...options,
    headers: options?.body ? { "Content-Type": "application/json" } : undefined,
  });
  const value = await response.json();
  if (!response.ok) throw Error(value.error || "控件库请求失败");
  return value;
}
function download(controls, name = "控件库.json") {
  const url = URL.createObjectURL(
    new Blob(
      [
        JSON.stringify(
          {
            format: CONTROL_PACKAGE_FORMAT,
            schemaVersion: 1,
            controls: controls.map(({ references, ...item }) =>
              editableLibraryControl(item),
            ),
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    ),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function Preview({ definition, configure = false, onDefaultChange }) {
  const [values, setValues] = React.useState({});
  const [props, setProps] = React.useState({});

  const cap = {
    capabilityId: "demo",
    name: "示例能力",
    kind:
      definition.dataTypes[0] === "number"
        ? "number"
        : definition.dataTypes[0] === "boolean"
          ? "toggle"
          : definition.dataTypes[0] === "action"
            ? "action"
            : definition.dataTypes[0] === "enum"
              ? "enum"
              : "status",
    dataType: definition.dataTypes[0],
    access: "read-write",
    unit: "",
    enumValues: [
      { value: "standard", label: "标准" },
      { value: "quick", label: "速洗" },
      { value: "gentle", label: "轻柔" },
    ],
  };
  const control = attachLibraryControl(
    {
      id: "preview",
      label: definition.name,
      icon: definition.icon,
      capabilityId: "demo",
      props,
      grid: { x: 0, y: 0, w: 4 },
    },
    definition,
  );
  return (
    <>
      <div className="cl-preview">
        <DevicePanel
          panel={{
            layoutMode: "grid",
            sections: [{ id: "preview", controls: [control] }],
          }}
          states={samplePanelStates([cap], values)}
          interactive
          onAction={(id, value) =>
            setValues((current) => ({ ...current, [id]: value }))
          }
        />
      </div>
      {configure && (
        <div className="cl-preview-properties">
          <h4>{onDefaultChange ? "控件默认属性（需应用并保存）" : "预览属性（仅本地模拟）"}</h4>
          <ControlProperties
            definition={definition}
            control={control}
            onChange={(key, value) => onDefaultChange
              ? onDefaultChange(key, value)
              : setProps((current) => ({ ...current, [key]: value }))}
          />
        </div>
      )}
    </>
  );
}
function Editor({ initial, creating, onClose, onSave, notify }) {
  const [draft, setDraft] = React.useState(() =>
    editableLibraryControl(initial),
  );
  const expanded = React.useMemo(
    () => editableLibraryControl(initial),
    [initial],
  );
  const [ui, setUi] = React.useState(
    JSON.stringify(
      {
        properties: expanded.properties,
        style: expanded.style || {},
        ui: expanded.ui,
      },
      null,
      2,
    ),
  );
  const [busy, setBusy] = React.useState(false);
  const [preview, setPreview] = React.useState(expanded);
  const [validatedSource, setValidatedSource] = React.useState("");
  const [previewError, setPreviewError] = React.useState("");
  const source = JSON.stringify({ draft, ui });
  let parsed, error;
  try {
    const code = JSON.parse(ui);
    if (
      !code ||
      typeof code !== "object" ||
      Array.isArray(code) ||
      !code.ui ||
      !code.style ||
      Object.keys(code).some(
        (key) => !["ui", "style", "properties"].includes(key),
      )
    )
      throw Error(
        "UI 代码包含 properties（配置属性注册）、style（外框样式）和 ui（内部结构）",
      );
    parsed = normalizeLibraryControl({
      ...draft,
      ui: code.ui,
      style: code.style,
      properties: code.properties ?? draft.properties,
    });
  } catch (e) {
    error = e.message;
  }
  const patch = (changes) =>
    setDraft((current) => ({ ...current, ...changes }));
  const changeDefault = (key, value) => {
    if (error || !parsed) {
      setPreviewError(error || "请先修正 UI 代码");
      return;
    }
    try {
      const next = withControlPropertyDefault(parsed, key, value);
      setUi(JSON.stringify({ properties: next.properties, style: next.style, ui: next.ui }, null, 2));
      setPreview(next);
      setValidatedSource("");
      setPreviewError("");
    } catch (e) {
      setPreviewError(e.message);
    }
  };
  const showPreview = () => {
    if (error) {
      setPreviewError(error);
      return;
    }
    setPreview(parsed);
    setValidatedSource(source);
    setPreviewError("");
  };
  const rollback = async () => {
    setBusy(true);
    try {
      const result = await api(
        `${endpoint}/${encodeURIComponent(initial.id)}/rollback`,
        { method: "POST" },
      );
      const restored = editableLibraryControl(result.item);
      setDraft(restored);
      setUi(
        JSON.stringify(
          {
            properties: restored.properties,
            style: restored.style,
            ui: restored.ui,
          },
          null,
          2,
        ),
      );
      setPreview(restored);
      setValidatedSource("");
      setPreviewError("");
      await onSave();
      notify("已回退上一版并保存；已有面板快照保持原样。");
    } catch (e) {
      notify(e.message, "error");
    } finally {
      setBusy(false);
    }
  };
  const save = async () => {
    if (!parsed || busy || source !== validatedSource) return;
    setBusy(true);
    try {
      await api(
        creating ? endpoint : `${endpoint}/${encodeURIComponent(initial.id)}`,
        { method: creating ? "POST" : "PUT", body: JSON.stringify(parsed) },
      );
      await onSave();
      onClose();
    } catch (e) {
      notify(e.message, "error");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div
      className="cl-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={creating ? "新建控件" : "编辑控件"}
    >
      <div className="cl-modal">
        <header>
          <div>
            <h2>{creating ? "新建控件" : "编辑控件"}</h2>
            <small>已有面板保留原版本；编辑只生成库内新版本。</small>
          </div>
          <button onClick={onClose} disabled={busy}>
            关闭
          </button>
        </header>
        <div className="cl-editor-body">
          <div className="cl-form">
            <label>
              控件名称
              <input
                value={draft.name}
                maxLength={80}
                onChange={(e) => patch({ name: e.target.value })}
              />
            </label>
            <label>
              控件 ID
              <input
                value={draft.id}
                disabled={!creating}
                onChange={(e) => patch({ id: e.target.value })}
              />
            </label>
            <div className="cl-fields">
              <label>
                分类
                <select
                  value={draft.category}
                  onChange={(e) => patch({ category: e.target.value })}
                >
                  <option value="data">数据控件</option>
                  <option value="general">通用控件</option>
                </select>
              </label>
              <label>
                默认宽度
                <select
                  value={draft.width}
                  onChange={(e) => patch({ width: Number(e.target.value) })}
                >
                  {[1, 2, 3, 4].map((w) => (
                    <option key={w} value={w}>
                      {w} 列
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <fieldset className="cl-data-types">
              <legend>适配数据类型（多选）</legend>
              {DATA_TYPES.map((type) => (
                <label className="cl-checkbox" key={type}>
                  <input
                    type="checkbox"
                    checked={draft.dataTypes.includes(type)}
                    onChange={(e) =>
                      patch({
                        dataTypes: e.target.checked
                          ? [...draft.dataTypes, type]
                          : draft.dataTypes.filter((value) => value !== type),
                      })
                    }
                  />
                  {
                    {
                      boolean: "布尔值",
                      number: "数值",
                      string: "字符串",
                      enum: "枚举",
                      action: "动作",
                    }[type]
                  }
                </label>
              ))}
            </fieldset>
            <div className="cl-fields">
              <label>
                图标
                <input
                  value={draft.icon}
                  maxLength={12}
                  onChange={(e) => patch({ icon: e.target.value })}
                />
              </label>
              <label>
                作者
                <input
                  value={draft.author}
                  onChange={(e) => patch({ author: e.target.value })}
                />
              </label>
            </div>
            <label>
              说明
              <input
                value={draft.description}
                onChange={(e) => patch({ description: e.target.value })}
              />
            </label>
            <label className="cl-checkbox">
              <input
                type="checkbox"
                checked={draft.enabled}
                onChange={(e) => patch({ enabled: e.target.checked })}
              />
              启用，在设计器中提供此控件
            </label>
            <label>
              完整 UI 代码（JSON）
              <textarea
                aria-label="完整 UI 代码 JSON"
                spellCheck={false}
                value={ui}
                onChange={(e) => setUi(e.target.value)}
              />
            </label>
            <button
              onClick={() =>
                setUi(
                  JSON.stringify(
                    {
                      properties: parsed?.properties || draft.properties,
                      style: parsed?.style || draft.style || {},
                      ui: {
                        kind: "column",
                        style: { gap: "8px" },
                        children: [
                          {
                            kind: "text",
                            text: "{{label}}",
                            style: { fontSize: "12px" },
                          },
                          {
                            kind: "row",
                            style: { alignItems: "baseline" },
                            children: [
                              {
                                kind: "value",
                                style: { fontSize: "32px", fontWeight: 700 },
                              },
                              { kind: "unit", style: { opacity: 0.7 } },
                            ],
                          },
                        ],
                      },
                    },
                    null,
                    2,
                  ),
                )
              }
            >
              填入自定义数值展示示例
            </button>
            <small>
              properties 注册实例配置项；style 配置控件外框；ui
              配置内部布局、标题、图标、交互节点及其样式。
            </small>
          </div>
          <aside>
            <h3>实时预览</h3>
            <p>
              与全屋共用渲染器，仅使用本地模拟状态。标题和图标来自面板实例，可通过
              label / icon 节点调整位置和样式。
            </p>
            {preview ? (
              <Preview definition={preview} configure onDefaultChange={changeDefault} />
            ) : (
              <p role="alert" className="cl-error">
                {error}
              </p>
            )}
            <details>
              <summary>UI 文件说明</summary>
              <p>
                节点：column、row、grid、text、label、icon、value、unit、options、input、switch、progress、divider、button。兼容旧文件中的
                native；native 复用当前基础控件；button 支持
                toggle、increment、decrement、press。占位符：双花括号
                label、icon、value、unit、rawValue。样式为局部属性对象，不执行
                JavaScript，也不加载外部资源。
              </p>
            </details>
          </aside>
        </div>
        <footer>
          <span role="status" className={previewError ? "cl-error" : ""}>
            {previewError ||
              (validatedSource === source
                ? "校验通过，预览已热更新"
                : "修改后请先预览，校验通过后应用")}
          </span>
          <div className="cl-footer-actions">
            {!creating && (
              <button disabled={busy || draft.version < 2} onClick={rollback}>
                回退上一版
              </button>
            )}
            <button disabled={busy} onClick={showPreview}>
              预览
            </button>
            <button
              className="primary"
              disabled={!!error || busy || validatedSource !== source}
              onClick={save}
            >
              {busy ? "保存中…" : "应用并保存"}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
export default function ControlLibrary({
  globalQuery = "",
  notify,
  onChanged,
}) {
  const [items, setItems] = React.useState([]),
    [query, setQuery] = React.useState(""),
    [category, setCategory] = React.useState("all"),
    [type, setType] = React.useState("all"),
    [editor, setEditor] = React.useState(null),
    [view, setView] = React.useState(null),
    [busy, setBusy] = React.useState(false);
  const input = React.useRef();
  const load = async () => {
    setItems((await api(endpoint)).controls.map(editableLibraryControl));
  };
  React.useEffect(() => {
    load().catch((e) => notify(e.message, "error"));
  }, []);
  const changed = async () => {
    await load();
    await onChanged?.();
    window.dispatchEvent(new Event("ha3d-control-library-updated"));
  };
  const copy = (item) => {
    const { references, ...definition } =
      item ||
      builtinControls().find(
        (item) => item.type === "number" && item.variant === "metric",
      );
    return {
      ...definition,
      id: `custom.control-${Date.now().toString(36)}`,
      name: item ? `${item.name} 副本` : "新控件",
      version: 1,
      builtin: false,
      author: item?.author || "",
      enabled: true,
    };
  };
  const remove = async (item) => {
    if (
      !window.confirm(
        `删除“${item.name}”？${item.references.length ? `已有 ${item.references.length} 处引用，将继续使用已保存的版本快照。` : "删除后不再出现在控件库中。"}`,
      )
    )
      return;
    setBusy(true);
    try {
      await api(`${endpoint}/${encodeURIComponent(item.id)}?confirm=true`, {
        method: "DELETE",
      });
      await changed();
      if (view?.id === item.id) setView(null);
      notify("控件已删除，已有面板保持原样。");
    } catch (e) {
      notify(e.message, "error");
    } finally {
      setBusy(false);
    }
  };
  const importFile = async (file) => {
    if (!file) return;
    setBusy(true);
    try {
      if (file.size > 2 * 1024 * 1024) throw Error("控件包不能超过 2 MB");
      const bundle = JSON.parse(await file.text());
      normalizeLibraryPackage(bundle);
      const result = await api(`${endpoint}/import`, {
        method: "POST",
        body: JSON.stringify(bundle),
      });
      await changed();
      notify(`已导入 ${result.controls.length} 个控件，使用独立 ID。`);
    } catch (e) {
      notify(e.message, "error");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };
  const search = `${globalQuery} ${query}`
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const filtered = items.filter(
    (item) =>
      (category === "all" || item.category === category) &&
      (type === "all" || item.type === type) &&
      search.every((q) =>
        `${item.name} ${item.description} ${item.author} ${item.id}`
          .toLowerCase()
          .includes(q),
      ),
  );
  return (
    <div className="cl-page">
      <header className="cl-heading">
        <div>
          <h1>控件资源库</h1>
          <p>
            管理数据控件与通用控件，当前 {items.length}{" "}
            个风格；已有面板使用固定版本。
          </p>
        </div>
        <div>
          <button onClick={() => setEditor({ item: copy(), creating: true })}>
            ＋ 新建控件
          </button>
          <button disabled={busy} onClick={() => input.current.click()}>
            导入 UI 文件
          </button>
          <button onClick={() => download(items)}>导出控件库</button>
          <button onClick={() => download([copy()], "自定义控件示例.json")}>
            下载示例
          </button>
          <input
            ref={input}
            type="file"
            accept=".json,application/json"
            hidden
            onChange={(e) => importFile(e.target.files?.[0])}
          />
        </div>
      </header>
      <div className="cl-toolbar">
        <input
          aria-label="搜索控件"
          placeholder="搜索名称、说明、作者…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          aria-label="控件分类"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="all">全部分类</option>
          <option value="data">数据控件</option>
          <option value="general">通用控件</option>
        </select>
        <select
          aria-label="控件类型筛选"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="all">全部类型</option>
          {PANEL_COMPONENTS.map((item) => (
            <option key={item.type} value={item.type}>
              {item.label}
            </option>
          ))}
        </select>
        <span>{filtered.length} 个结果</span>
      </div>
      <div className="cl-grid">
        {filtered.map((item) => (
          <article key={item.id}>
            <button className="cl-card-name" onClick={() => setView(item)}>
              {item.icon} {item.name}
            </button>
            <div className="cl-card-meta">
              {item.builtin ? "内置" : "自定义"} · v{item.version} ·{" "}
              {item.enabled ? "已启用" : "已停用"} · {item.references.length}{" "}
              处引用
            </div>
            <Preview definition={item} />
            <p>{item.description || "暂无说明"}</p>
            <div className="cl-card-actions">
              <button onClick={() => setView(item)}>查看</button>
              <button onClick={() => setEditor({ item, creating: false })}>
                编辑
              </button>
              <button
                onClick={() => setEditor({ item: copy(item), creating: true })}
              >
                复制
              </button>
              <button onClick={() => download([item], `${item.name}.json`)}>
                导出
              </button>
              <button
                disabled={busy}
                className="danger"
                onClick={() => remove(item)}
              >
                删除
              </button>
            </div>
          </article>
        ))}
      </div>
      {!filtered.length && (
        <p className="cl-empty">没有匹配的控件。可以新建或导入 UI 文件。</p>
      )}
      {editor && (
        <Editor
          key={editor.item.id}
          initial={editor.item}
          creating={editor.creating}
          onClose={() => setEditor(null)}
          onSave={changed}
          notify={notify}
        />
      )}
      {view && (
        <div
          className="cl-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="控件详情"
        >
          <div className="cl-modal cl-detail">
            <header>
              <h2>{view.name}</h2>
              <button onClick={() => setView(null)}>关闭</button>
            </header>
            <div className="cl-editor-body">
              <div>
                <Preview definition={view} />
                <p>
                  适配：{view.dataTypes.join(" / ")} · 版本 {view.version}
                </p>
                <h3>使用位置</h3>
                {view.references.length ? (
                  view.references.map((ref) => (
                    <p key={`${ref.panelId}-${ref.controlId}`}>
                      {ref.panelName} / {ref.label} · v{ref.version}
                    </p>
                  ))
                ) : (
                  <p>尚未被面板使用</p>
                )}
              </div>
              <pre>
                {JSON.stringify({ ...view, references: undefined }, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
