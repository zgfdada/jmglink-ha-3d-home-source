import { a as React } from "../../vendor/react.js";
import { MOTION_EFFECTS } from "../../../../../packages/schema/src/part-motion.js";
import {
  builtinMotionResources,
  normalizeMotionResource,
  MOTION_CATEGORIES,
} from "../../../../../packages/schema/src/motion-library.js";
import MotionEffectFields from "./motion-effect-fields.jsx";
import MotionResourcePreview from "./motion-resource-preview.jsx";
import { motionLibraryApi, useMotionResources } from "./motion-resources.jsx";
import "../../styles/motion-library.css";

const symbols = {
  translate: "↗",
  rotate: "↶",
  spin: "⟳",
  scale: "⤢",
  visible: "◉",
  color: "◐",
  emissive: "☀",
  flow: "⇢",
  scan: "▥",
};
export default function MotionLibrary({
  globalQuery = "",
  notify,
  registerGuard,
}) {
  const { resources, revision, error, reload } = useMotionResources();
  const [search, setSearch] = React.useState(""),
    [filter, setFilter] = React.useState("all");
  const [draft, setDraft] = React.useState(null),
    [baseline, setBaseline] = React.useState("");
  const [busy, setBusy] = React.useState(false),
    [message, setMessage] = React.useState("");
  const [active, setActive] = React.useState(true),
    [playing, setPlaying] = React.useState(true),
    [deleting, setDeleting] = React.useState(false);
  const dirty = Boolean(draft) && JSON.stringify(draft) !== baseline;
  const load = (resource) => {
    setDraft(structuredClone(resource));
    setBaseline(JSON.stringify(resource));
    setMessage("");
    setDeleting(false);
    setActive(true);
    setPlaying(true);
  };
  React.useEffect(() => {
    if (revision !== null && !draft)
      load(
        resources.find((r) => r.id === "builtin.motion.scan") ?? resources[0],
      );
  }, [resources, revision, draft]);
  const canLeave = React.useCallback(() => {
    if (busy || dirty) {
      const text = busy
        ? "动效正在保存，请稍候。"
        : "动效资源尚未保存，请先保存或取消修改。";
      setMessage(text);
      notify?.(text, "error");
      return false;
    }
    return true;
  }, [busy, dirty, notify]);
  React.useEffect(() => {
    registerGuard?.(canLeave);
    return () => registerGuard?.(null);
  }, [registerGuard, canLeave]);
  const choose = (resource) => {
    if (canLeave()) load(resource);
  };
  const change = (patch) => {
    setDraft((current) => ({ ...current, ...patch }));
    setMessage("");
    setDeleting(false);
  };
  const create = (resource) => {
    if (!canLeave()) return;
    const next = {
      ...structuredClone(resource ?? builtinMotionResources()[0]),
      id: "",
      builtin: false,
      name: resource ? `${resource.name}（副本）` : "新动效",
      version: 1,
    };
    setDraft(next);
    setBaseline("");
    setMessage("");
    setDeleting(false);
  };
  let checked = null,
    issue = "";
  try {
    if (draft)
      checked = normalizeMotionResource({
        ...draft,
        id: draft.id || "custom.motion.preview",
      });
  } catch (error) {
    issue = error.message;
  }
  const save = async () => {
    if (!checked || busy || revision === null) return;
    setBusy(true);
    setMessage("");
    try {
      const result = await motionLibraryApi(
        draft.id ? `/${encodeURIComponent(draft.id)}` : "",
        {
          method: draft.id ? "PUT" : "POST",
          body: JSON.stringify({
            resource: checked,
            expectedRevision: revision,
          }),
        },
      );
      load(result.item);
      await reload();
      notify?.("动效资源已保存，已有设备规则保留原参数。", "success");
      setMessage("保存成功，可在部件动效的“动效资源”中选择。");
    } catch (error) {
      setMessage(error.message);
      notify?.(error.message, "error");
    } finally {
      setBusy(false);
    }
  };
  const reset = async () => {
    if (!draft?.builtin || !canLeave()) return;
    setBusy(true);
    try {
      const result = await motionLibraryApi(
        `/${encodeURIComponent(draft.id)}/reset`,
        {
          method: "POST",
          body: JSON.stringify({ expectedRevision: revision }),
        },
      );
      load(result.item);
      await reload();
      setMessage("已恢复此内置动效的默认设置。");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    if (!draft?.id || draft.builtin || !canLeave()) return;
    if (!deleting) {
      setDeleting(true);
      return;
    }
    setBusy(true);
    try {
      await motionLibraryApi(`/${encodeURIComponent(draft.id)}`, {
        method: "DELETE",
        body: JSON.stringify({ expectedRevision: revision }),
      });
      const result = await reload();
      if (result) load(result.resources[0]);
      setMessage("资源已删除；已有设备中的规则快照仍可使用。");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
      setDeleting(false);
    }
  };
  const cancel = () => {
    const original = resources.find((r) => r.id === draft?.id) ?? resources[0];
    if (original) load(original);
  };
  const query = `${globalQuery} ${search}`.trim().toLowerCase();
  const visible = resources.filter(
    (r) =>
      (filter === "all" ||
        (filter === "builtin" && r.builtin) ||
        (filter === "custom" && !r.builtin) ||
        r.category === filter) &&
      query
        .split(/\s+/)
        .every((word) =>
          `${r.name} ${r.description} ${MOTION_EFFECTS[r.effect.type]}`
            .toLowerCase()
            .includes(word),
        ),
  );
  return (
    <section className="motion-library" aria-label="动效资源库">
      <header className="motion-library-heading">
        <div>
          <span className="motion-library-eyebrow">模型动效 · 通用资源</span>
          <h1>动效资源库</h1>
          <p>集中管理动效样式与默认参数，在设备部件规则中按需复用。</p>
        </div>
        <button
          className="primary"
          onClick={() => create()}
          disabled={busy || revision === null}
        >
          ＋ 新增动效
        </button>
      </header>
      <div className="motion-library-guide">
        <b>选择动效资源</b>
        <span>→</span>
        <b>选择模型部件</b>
        <span>→</span>
        <b>绑定设备能力与条件</b>
        <small>资源不绑定设备或实体，适用于所有自定义设备。</small>
      </div>
      {error && (
        <p role="alert" className="motion-library-error">
          {error}
          <button onClick={reload}>重新加载</button>
        </p>
      )}
      <div className="motion-library-layout">
        <div className="motion-library-catalog">
          <div className="motion-library-search">
            <input
              aria-label="搜索动效资源"
              value={search}
              placeholder="搜索动效名称或用途…"
              onChange={(e) => setSearch(e.target.value)}
            />
            <small>{visible.length} 项资源</small>
          </div>
          <div className="motion-library-filters" aria-label="动效分类">
            {[
              ["all", "全部"],
              ["builtin", "内置"],
              ["custom", "自定义"],
              ...Object.entries(MOTION_CATEGORIES),
            ].map(([id, name]) => (
              <button
                key={id}
                aria-pressed={filter === id}
                className={filter === id ? "active" : ""}
                onClick={() => setFilter(id)}
              >
                {name}
              </button>
            ))}
          </div>
          <div className="motion-library-grid">
            {visible.map((resource) => (
              <button
                key={resource.id}
                className={`motion-library-card ${resource.id === draft?.id ? "selected" : ""}`}
                onClick={() => choose(resource)}
                aria-label={`编辑动效 ${resource.name}`}
              >
                <span
                  className={`motion-library-symbol ${resource.category}`}
                  aria-hidden="true"
                >
                  {symbols[resource.effect.type]}
                </span>
                <span className="motion-library-origin">
                  {resource.builtin ? "内置" : "自定义"} · v{resource.version}
                </span>
                <strong>{resource.name}</strong>
                <p>
                  {resource.description || MOTION_EFFECTS[resource.effect.type]}
                </p>
                <small>
                  {MOTION_CATEGORIES[resource.category]}
                  <span>配置与预览 →</span>
                </small>
              </button>
            ))}
          </div>
          {!visible.length && (
            <p className="motion-library-empty">
              没有匹配的动效，可以调整搜索或新增资源。
            </p>
          )}
        </div>
        {draft && (
          <aside
            className="motion-library-editor part-motion-settings"
            aria-label="动效资源设置"
          >
            <header>
              <div>
                <small>
                  {draft.id
                    ? draft.builtin
                      ? "内置动效"
                      : "自定义动效"
                    : "新增自定义动效"}
                </small>
                <h2>{draft.name || "未命名动效"}</h2>
              </div>
              <span>{dirty ? "未保存" : "已保存"}</span>
            </header>
            <MotionResourcePreview
              resource={draft}
              active={active}
              playing={playing}
            />
            <div className="motion-library-preview-tools">
              <button
                aria-pressed={active}
                onClick={() => setActive((v) => !v)}
              >
                {active ? "条件：满足" : "条件：未满足"}
              </button>
              <button onClick={() => setPlaying((v) => !v)}>
                {playing ? "暂停预览" : "继续预览"}
              </button>
              <small>本地模拟</small>
            </div>
            <fieldset className="motion-library-form" disabled={busy}>
              <label>
                动效名称
                <input
                  aria-label="资源动效名称"
                  maxLength={80}
                  value={draft.name}
                  onChange={(e) => change({ name: e.target.value })}
                />
              </label>
              <label>
                用途说明
                <textarea
                  aria-label="资源用途说明"
                  rows={2}
                  maxLength={400}
                  value={draft.description}
                  onChange={(e) => change({ description: e.target.value })}
                />
              </label>
              <label>
                基础动效
                <select
                  aria-label="资源基础动效"
                  value={draft.effect.type}
                  disabled={draft.builtin || busy}
                  onChange={(e) => {
                    const resource = builtinMotionResources().find(
                      (r) => r.effect.type === e.target.value,
                    );
                    change({
                      effect: resource.effect,
                      category: resource.category,
                    });
                  }}
                >
                  {Object.entries(MOTION_EFFECTS).map(([id, name]) => (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>
              <h3>默认参数</h3>
              <MotionEffectFields
                value={draft.effect}
                onChange={(patch) =>
                  change({ effect: { ...draft.effect, ...patch } })
                }
              />
              <label>
                过渡时间（毫秒）
                <input
                  aria-label="资源过渡时间"
                  type="number"
                  min={0}
                  max={10000}
                  value={draft.transitionMs}
                  onChange={(e) => change({ transitionMs: e.target.value })}
                />
              </label>
              <p className="motion-library-note">
                保存后供新选择的规则使用。已配置规则保留参数快照；触发能力、条件和作用部件在设备项目中设置。
              </p>
              {issue && (
                <p className="motion-library-error" role="alert">
                  {issue}
                </p>
              )}
              {message && (
                <p className="motion-library-message" role="status">
                  {message}
                </p>
              )}
              <footer>
                <button
                  className="primary"
                  onClick={save}
                  disabled={busy || !dirty || !checked || revision === null}
                >
                  {busy ? "正在保存…" : "保存动效"}
                </button>
                <button onClick={cancel} disabled={busy || !dirty}>
                  取消修改
                </button>
                <button onClick={() => create(draft)} disabled={busy || dirty}>
                  复制动效
                </button>
                {draft.builtin ? (
                  <button onClick={reset} disabled={busy || dirty}>
                    恢复默认
                  </button>
                ) : (
                  draft.id && (
                    <button
                      className="danger"
                      onClick={remove}
                      disabled={busy || dirty}
                    >
                      {deleting ? "确认删除资源" : "删除资源"}
                    </button>
                  )
                )}
              </footer>
              {deleting && (
                <small>删除资源不会删除已配置的设备规则。再次点击确认。</small>
              )}
            </fieldset>
          </aside>
        )}
      </div>
    </section>
  );
}
