import { a as React } from "../../vendor/react.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { inspectGltfModelParameters } from "../../domain/model-file-parameters.js";
import ModelPreview from "./model-preview.jsx";
import {
  buildModelCards,
  createModelDraft,
  filterModelCards,
  MODEL_FAVORITES_KEY,
  modelReferenceCount,
} from "./model-library.js";

async function api(url, options) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options?.body ? { "Content-Type": "application/json" } : {}),
      ...options?.headers,
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(body.error || `请求失败：${response.status}`);
  return body;
}

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("模型文件读取失败"));
    reader.readAsDataURL(file);
  });
}

function ModelCard({
  card,
  favorite,
  onFavorite,
  onPreview,
  onConfigure,
  onApply,
  onToggleFurniture,
  busy,
}) {
  return (
    <article className="ddc-model-card">
      <div className="ddc-model-card-visual">
        <ModelPreview model={card.model} compact />
        <span className="ddc-model-origin">本地模型</span>
      </div>
      <div className="ddc-model-card-body">
        <h3 title={card.name}>{card.name}</h3>
        <p>{card.author}</p>
        <div className="ddc-model-tags">
          {card.tags.slice(0, 3).map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
          {!card.tags.length && <span>3D 模型</span>}
        </div>
        <div className="ddc-model-card-actions">
          <button onClick={() => onPreview(card)}>预览</button>
          {card.origin === "local" && (
            <button
              className={`ddc-model-furniture-toggle ${card.model.furnitureEnabled ? "enabled" : ""}`}
              type="button"
              aria-label={
                card.model.furnitureEnabled ? "关闭家具用途" : "启用家具用途"
              }
              aria-pressed={card.model.furnitureEnabled === true}
              title={
                card.model.builtin
                  ? "内置模型不可直接修改"
                  : card.model.furnitureEnabled
                    ? "已启用家具用途，点击关闭"
                    : "点击启用家具用途；不影响设备用途"
              }
              disabled={busy || card.model.builtin}
              onClick={() => onToggleFurniture(card)}
            >
              家具
            </button>
          )}
          <>
            <button className="primary" onClick={() => onApply(card)}>
              应用到设备
            </button>
            {!card.model.builtin && (
              <button onClick={() => onConfigure(card)}>配置</button>
            )}
          </>
          <button
            className={`ddc-model-favorite ${favorite ? "active" : ""}`}
            onClick={() => onFavorite(card.key)}
            aria-label={favorite ? "取消收藏" : "收藏模型"}
          >
            {favorite ? "♥" : "♡"}
          </button>
        </div>
      </div>
    </article>
  );
}

function NumberField({
  label,
  value,
  onChange,
  step = "0.01",
  min,
  max,
  suffix,
}) {
  return (
    <label className="ddc-model-number">
      <span>{label}</span>
      <div>
        <input
          type="number"
          step={step}
          min={min}
          max={max}
          value={value ?? 0}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        {suffix && <small>{suffix}</small>}
      </div>
    </label>
  );
}

function ModelEditor({
  initial,
  platform,
  onBack,
  onSaved,
  onDeleted,
  notify,
}) {
  const [draft, setDraft] = React.useState(() => createModelDraft(initial));
  const [upload, setUpload] = React.useState(null);
  const [previewUrl, setPreviewUrl] = React.useState("");
  const [working, setWorking] = React.useState(false);
  const [showPreview, setShowPreview] = React.useState(true);
  const referenceCount = modelReferenceCount(platform, draft.id);
  React.useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );
  const change = (key, value) =>
    setDraft((current) => ({ ...current, [key]: value }));
  const nested = (key, field, value) =>
    setDraft((current) => ({
      ...current,
      [key]: { ...current[key], [field]: value },
    }));
  const pickFile = async (file) => {
    if (!file) return;
    try {
      if (file.size > 15 * 1024 * 1024)
        throw new Error("模型文件不能超过 15 MB");
      const extension = file.name.split(".").pop()?.toLowerCase();
      if (!["glb", "gltf"].includes(extension))
        throw new Error("仅支持 GLB 或自包含 GLTF 文件");
      const gltf = await new GLTFLoader().parseAsync(
        extension === "glb" ? await file.arrayBuffer() : await file.text(),
        "",
      );
      const parameters = inspectGltfModelParameters(gltf.scene);
      const dataUrl = await readAsDataUrl(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setUpload({ name: file.name, dataUrl });
      setDraft((current) => ({
        ...current,
        source: { type: "upload" },
        dimensions: parameters.dimensions,
        color: parameters.color ?? current.color,
        roughness: parameters.roughness ?? current.roughness,
        metalness: parameters.metalness ?? current.metalness,
      }));
      notify(
        parameters.dimensionAdjusted
          ? "已读取模型；原始尺寸超出 0.05–20 m，已限制到可配置范围，请核对单位。"
          : "已从模型文件读取尺寸和材质参数。",
        "success",
      );
    } catch (error) {
      notify(error.message, "error");
    }
  };
  const save = async () => {
    if (!draft.name.trim()) {
      notify("请输入模型名称", "error");
      return;
    }
    if (draft.source?.type === "upload" && !upload && !initial?.source?.url) {
      notify("请先上传模型文件；当前配置已保留。", "error");
      return;
    }
    setWorking(true);
    try {
      await api(
        `./api/device-platform/model-templates/${encodeURIComponent(draft.id)}`,
        {
          method: "PUT",
          body: JSON.stringify({
            model: { ...draft, name: draft.name.trim() },
            file: upload,
          }),
        },
      );
      await onSaved(`模型“${draft.name.trim()}”已保存。`);
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setWorking(false);
    }
  };
  const remove = async () => {
    if (referenceCount) {
      if (
        !window.confirm(
          `模型被 ${referenceCount} 处设备配置引用。强制删除会解除引用并使相关配置需要重新校验。确定继续？`,
        )
      )
        return;
    } else if (!window.confirm(`确定删除模型“${draft.name}”吗？`)) return;
    setWorking(true);
    try {
      await api(
        `./api/device-platform/model-templates/${encodeURIComponent(draft.id)}${referenceCount ? "?unlink=true" : ""}`,
        { method: "DELETE" },
      );
      await onDeleted(
        `模型“${draft.name}”已删除${referenceCount ? "；相关设备模型引用已解除，请重新校验" : ""}。`,
      );
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setWorking(false);
    }
  };
  const previewModel = React.useMemo(
    () => ({
      ...draft,
      source: previewUrl ? { type: "upload", url: previewUrl } : draft.source,
    }),
    [
      draft.source,
      draft.dimensions,
      draft.scale,
      draft.anchor,
      draft.placement,
      draft.elevation,
      draft.color,
      draft.roughness,
      draft.metalness,
      previewUrl,
    ],
  );
  return (
    <div className="ddc-model-editor">
      <nav className="ddc-model-breadcrumb">
        <button onClick={onBack}>3D 模型资源库</button>
        <span>›</span>
        <span>{initial ? "配置模型" : "上传本地模型"}</span>
      </nav>
      <div className="ddc-model-editor-heading">
        <div>
          <h1>3D 模型配置</h1>
          <p>设置模型基础信息、摆放参数和可交互预览</p>
        </div>
        <div>
          <button onClick={onBack}>取消</button>
          <button onClick={() => setShowPreview((value) => !value)}>
            {showPreview ? "隐藏预览" : "预览模型"}
          </button>
          <button className="primary" disabled={working} onClick={save}>
            保存模型
          </button>
        </div>
      </div>
      <div className="ddc-model-editor-layout">
        <div className="ddc-model-editor-form">
          <section>
            <h2>基础信息</h2>
            <label>
              <span>模型 ID</span>
              <input value={draft.id} readOnly />
              <small>ID 创建后不可修改</small>
            </label>
            <label>
              <span>模型名称</span>
              <input
                maxLength="120"
                value={draft.name}
                onChange={(event) => change("name", event.target.value)}
                placeholder="例如：智能洗衣机"
              />
            </label>
            <label>
              <span>关联设备模板（可选）</span>
              <select
                value={draft.deviceTemplateId ?? ""}
                onChange={(event) =>
                  change("deviceTemplateId", event.target.value || undefined)
                }
              >
                <option value="">不关联</option>
                {(platform?.deviceTemplates ?? []).map((item) => (
                  <option value={item.id} key={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>标签（逗号分隔）</span>
              <input
                value={(draft.tags ?? []).join(", ")}
                onChange={(event) =>
                  change(
                    "tags",
                    event.target.value
                      .split(/[,，]/)
                      .map((tag) => tag.trim())
                      .filter(Boolean)
                      .slice(0, 12),
                  )
                }
                placeholder="家电, 洗衣机"
              />
            </label>
          </section>
          <section>
            <h2>模型文件</h2>
            <label
              className="ddc-model-upload"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                pickFile(event.dataTransfer.files?.[0]);
              }}
            >
              <input
                type="file"
                accept=".glb,.gltf,model/gltf-binary,model/gltf+json"
                onChange={(event) => pickFile(event.target.files?.[0])}
              />
              <b>点击选择或拖入模型文件</b>
              <small>GLB / 自包含 GLTF，最大 15 MB</small>
            </label>
            <p className="ddc-model-file-name">
              {upload?.name ??
                draft.source?.fileName ??
                (draft.source?.type === "procedural"
                  ? "内置程序化模型"
                  : "尚未上传文件")}
            </p>
          </section>
          <section>
            <h2>尺寸与摆放</h2>
            <div className="ddc-model-field-grid">
              <NumberField
                label="宽度"
                value={draft.dimensions?.width}
                min="0.05"
                max="20"
                suffix="m"
                onChange={(value) => nested("dimensions", "width", value)}
              />
              <NumberField
                label="高度"
                value={draft.dimensions?.height}
                min="0.05"
                max="20"
                suffix="m"
                onChange={(value) => nested("dimensions", "height", value)}
              />
              <NumberField
                label="深度"
                value={draft.dimensions?.depth}
                min="0.05"
                max="20"
                suffix="m"
                onChange={(value) => nested("dimensions", "depth", value)}
              />
              <NumberField
                label="缩放"
                value={draft.scale}
                min="0.01"
                max="100"
                onChange={(value) => change("scale", value)}
              />
            </div>
            <label>
              <span>摆放位置</span>
              <select
                value={draft.placement}
                onChange={(event) => change("placement", event.target.value)}
              >
                <option value="floor">地面</option>
                <option value="wall">墙面</option>
                <option value="ceiling">天花板</option>
                <option value="surface">台面</option>
              </select>
            </label>
            <div className="ddc-model-field-grid">
              <NumberField
                label="高度偏移"
                value={draft.elevation}
                min="0"
                max="12"
                suffix="m"
                onChange={(value) => change("elevation", value)}
              />
              {["x", "y", "z"].map((axis) => (
                <NumberField
                  key={axis}
                  label={`锚点 ${axis.toUpperCase()}`}
                  value={draft.anchor?.[axis]}
                  min="-20"
                  max="20"
                  suffix="m"
                  onChange={(value) => nested("anchor", axis, value)}
                />
              ))}
            </div>
          </section>
          <section>
            <h2>材质与用途</h2>
            <div className="ddc-model-field-grid">
              <label>
                <span>模型颜色</span>
                <input
                  type="color"
                  value={draft.color}
                  onChange={(event) => change("color", event.target.value)}
                />
              </label>
              <NumberField
                label="粗糙度"
                value={draft.roughness}
                min="0"
                max="1"
                onChange={(value) => change("roughness", value)}
              />
              <NumberField
                label="金属度"
                value={draft.metalness}
                min="0"
                max="1"
                onChange={(value) => change("metalness", value)}
              />
            </div>
            <label className="ddc-model-checkbox">
              <input
                type="checkbox"
                checked={draft.furnitureEnabled === true}
                onChange={(event) =>
                  change("furnitureEnabled", event.target.checked)
                }
              />
              <span>作为家具模型使用</span>
            </label>
            {referenceCount > 0 && (
              <small>
                当前被设备引用 {referenceCount} 处；启用家具不会解除设备用途。
              </small>
            )}
            {draft.furnitureEnabled && (
              <label>
                <span>家具分类</span>
                <select
                  value={draft.furnitureKind ?? ""}
                  onChange={(event) =>
                    change("furnitureKind", event.target.value)
                  }
                >
                  <option value="">其他家具</option>
                  <option value="table">桌子</option>
                  <option value="chair">椅子</option>
                  <option value="sofa">沙发</option>
                  <option value="cabinet">柜体</option>
                  <option value="decoration">装饰</option>
                </select>
              </label>
            )}
          </section>
          {initial && !initial.builtin && (
            <button
              className="ddc-model-delete"
              disabled={working}
              onClick={remove}
            >
              删除此模型{referenceCount ? `（引用 ${referenceCount}）` : ""}
            </button>
          )}
        </div>
        {showPreview && (
          <aside className="ddc-model-editor-preview">
            <h2>模型预览</h2>
            <ModelPreview model={previewModel} />
            <p>
              上传后自动读取尺寸；可拖动旋转、滚轮缩放。预览仅反映当前草稿，保存后才会用于设备。
            </p>
          </aside>
        )}
      </div>
    </div>
  );
}

export default function ModelLibrary({
  platform,
  reload,
  notify,
  globalQuery = "",
}) {
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState("all");
  const [sort, setSort] = React.useState("recent");
  const [favorites, setFavorites] = React.useState(() => {
    try {
      return JSON.parse(
        window.localStorage.getItem(MODEL_FAVORITES_KEY) ?? "[]",
      );
    } catch {
      return [];
    }
  });
  const [editor, setEditor] = React.useState(null);
  const [preview, setPreview] = React.useState(null);
  const [applyTarget, setApplyTarget] = React.useState(null);
  const [selectedProjectId, setSelectedProjectId] = React.useState("");
  const [working, setWorking] = React.useState(false);
  const toggleFavorite = (key) =>
    setFavorites((current) => {
      const next = current.includes(key)
        ? current.filter((item) => item !== key)
        : [...current, key];
      window.localStorage.setItem(MODEL_FAVORITES_KEY, JSON.stringify(next));
      return next;
    });
  const showPreview = (card) => setPreview({ card, model: card.model });
  const toggleFurniture = async (card) => {
    if (card.model.builtin) return;
    setWorking(true);
    try {
      const enabled = !card.model.furnitureEnabled;
      await api(
        `./api/device-platform/model-templates/${encodeURIComponent(card.id)}`,
        {
          method: "PUT",
          body: JSON.stringify({
            model: { ...card.model, furnitureEnabled: enabled },
          }),
        },
      );
      await reload();
      notify(
        `“${card.name}”已${enabled ? "启用" : "关闭"}家具用途，设备用途保持不变。`,
        "success",
      );
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setWorking(false);
    }
  };
  const apply = (card) => {
    const candidates = (platform?.deviceTemplates ?? []).filter(
      (item) => !item.builtin,
    );
    if (!candidates.length) {
      notify("请先创建自定义设备项目，再应用模型。", "error");
      return;
    }
    setSelectedProjectId(candidates[0].id);
    setApplyTarget(card);
  };
  const commitApply = async () => {
    const selected = (platform?.deviceTemplates ?? []).find(
      (item) => item.id === selectedProjectId && !item.builtin,
    );
    if (!selected || !applyTarget) return;
    setWorking(true);
    try {
      await api(
        `./api/device-platform/device-templates/${encodeURIComponent(selected.id)}`,
        {
          method: "PUT",
          body: JSON.stringify({
            ...selected,
            modelTemplateId: applyTarget.id,
          }),
        },
      );
      await reload();
      setApplyTarget(null);
      notify(`模型已应用到“${selected.name}”。`, "success");
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setWorking(false);
    }
  };
  const cards = filterModelCards(
    filterModelCards(buildModelCards(platform), {
      query,
      filter,
      favorites,
    }),
    { query: globalQuery },
  );
  cards.sort((a, b) =>
    sort === "name"
      ? a.name.localeCompare(b.name, "zh")
      : (b.updatedAt || "").localeCompare(a.updatedAt || "") ||
        a.name.localeCompare(b.name, "zh"),
  );
  if (editor)
    return (
      <ModelEditor
        key={editor.id ?? "new"}
        initial={editor.id ? editor : null}
        platform={platform}
        onBack={() => setEditor(null)}
        onSaved={async (message) => {
          await reload();
          setEditor(null);
          notify(message, "success");
        }}
        onDeleted={async (message) => {
          await reload();
          setEditor(null);
          notify(message, "success");
        }}
        notify={notify}
      />
    );
  return (
    <div className="ddc-model-library">
      <div className="ddc-model-library-heading">
        <div>
          <h1>3D 模型资源库</h1>
          <p>管理本地及已安装模型，为设备选择合适的 3D 外观</p>
        </div>
        <button className="primary" onClick={() => setEditor({})}>
          ＋ 上传本地模型
        </button>
      </div>
      <div className="ddc-model-library-toolbar">
        <label className="ddc-next-search">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索模型名称、标签或作者…"
          />
        </label>
        <select
          value={sort}
          onChange={(event) => setSort(event.target.value)}
          aria-label="模型排序"
        >
          <option value="recent">最近更新</option>
          <option value="name">名称排序</option>
        </select>
      </div>
      <div className="ddc-model-tabs">
        {[
          ["all", "全部"],
          ["local", "本地模型"],
          ["favorites", "收藏"],
        ].map(([value, label]) => (
          <button
            key={value}
            className={filter === value ? "active" : ""}
            onClick={() => setFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>
      {!platform ? (
        <div className="ddc-next-loading">正在加载模型…</div>
      ) : cards.length ? (
        <div className="ddc-model-grid">
          {cards.map((card) => (
            <ModelCard
              key={card.key}
              card={card}
              favorite={favorites.includes(card.key)}
              onFavorite={toggleFavorite}
              onPreview={showPreview}
              onConfigure={(item) => setEditor(item.model)}
              onApply={apply}
              onToggleFurniture={toggleFurniture}
              busy={working}
            />
          ))}
        </div>
      ) : (
        <div className="ddc-next-empty">
          <b>没有匹配的模型</b>
          <span>尝试切换筛选条件，或上传本地模型。</span>
        </div>
      )}
      {preview && (
        <div
          className="ddc-model-modal-backdrop"
          onMouseDown={() => setPreview(null)}
        >
          <div
            className="ddc-model-modal"
            role="dialog"
            aria-modal="true"
            aria-label="模型预览"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <h2>{preview.card.name}</h2>
                <p>本地模型 · {preview.card.author}</p>
              </div>
              <button
                aria-label="关闭模型预览"
                onClick={() => setPreview(null)}
              >
                ×
              </button>
            </header>
            <ModelPreview model={preview.model} />
            <footer>
              <button onClick={() => setPreview(null)}>关闭</button>

              <button
                className="primary"
                onClick={() => {
                  setPreview(null);
                  apply(preview.card);
                }}
              >
                应用到设备
              </button>
            </footer>
          </div>
        </div>
      )}
      {applyTarget && (
        <div
          className="ddc-model-modal-backdrop"
          onMouseDown={() => !working && setApplyTarget(null)}
        >
          <div
            className="ddc-model-modal ddc-model-apply-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="应用模型到设备项目"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <h2>应用模型到设备项目</h2>
                <p>选择要使用“{applyTarget.name}”的自定义设备项目</p>
              </div>
              <button aria-label="关闭" onClick={() => setApplyTarget(null)}>
                ×
              </button>
            </header>
            <div className="ddc-model-apply-list">
              {(platform?.deviceTemplates ?? [])
                .filter((item) => !item.builtin)
                .map((item) => (
                  <label key={item.id}>
                    <input
                      type="radio"
                      name="ddc-model-apply-project"
                      checked={selectedProjectId === item.id}
                      onChange={() => setSelectedProjectId(item.id)}
                    />
                    <span>
                      <b>{item.name}</b>
                      <small>{item.id}</small>
                    </span>
                  </label>
                ))}
            </div>
            <footer>
              <button disabled={working} onClick={() => setApplyTarget(null)}>
                取消
              </button>
              <button
                className="primary"
                disabled={working || !selectedProjectId}
                onClick={commitApply}
              >
                确认应用
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
