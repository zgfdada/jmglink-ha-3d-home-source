import ProjectStepLayout from "./project-step-layout.jsx";
import { a as React } from "../../vendor/react.js";
import ModelPreview from "./model-preview.jsx";
import {
  appearanceIssues,
  initialAppearance,
  stateChoices,
} from "./project-runtime-model.js";
import "../../styles/device-development-runtime.css";

async function saveAppearance(projectId, modelTemplateId, appearance) {
  const response = await fetch(
    `./api/device-platform/projects/${encodeURIComponent(projectId)}/appearance`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modelTemplateId, appearance }),
    },
  );
  const result = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(result.error || `请求失败：${response.status}`);
  return result;
}

function NumberField({
  label,
  value,
  min,
  max,
  step = "0.01",
  suffix,
  onChange,
}) {
  const [input, setInput] = React.useState(String(value ?? 0));
  React.useEffect(() => setInput(String(value ?? 0)), [value]);
  const commit = () => {
    const parsed = Number(input);
    if (input.trim() && Number.isFinite(parsed))
      onChange(Math.min(max, Math.max(min, parsed)));
    else setInput(String(value ?? 0));
  };
  return (
    <label className="ddc-step-field">
      <span>{label}</span>
      <div className="ddc-step-number">
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
          }}
        />
        {suffix && <small>{suffix}</small>}
      </div>
    </label>
  );
}

export default function ProjectAppearance({
  projectId,
  platform,
  devices,
  reload,
  notify,
  registerFlush,
  onPrevious,
  onNext,
  onOpenLibrary,
}) {
  const project = platform.deviceTemplates.find(
    (item) => item.id === projectId,
  );
  const binding = platform.bindings.find(
    (item) => item.deviceTemplateId === projectId,
  );
  const device = devices.find((item) => item.id === binding?.deviceId);
  const models = platform.modelTemplates.filter(
    (item) => item.enabled !== false && item.source,
  );
  const currentModelId =
    project?.modelTemplateId ??
    binding?.modelTemplateId ??
    models.find((item) => item.deviceTemplateId === projectId)?.id ??
    "";
  const initialModel = models.find((item) => item.id === currentModelId);
  const [draft, setDraft] = React.useState(() => ({
    modelTemplateId: currentModelId,
    appearance: structuredClone(
      project?.appearance ??
        initialAppearance(initialModel, project?.runtimeDisplay),
    ),
  }));
  const draftRef = React.useRef(draft);
  const historyRef = React.useRef([]);
  const futureRef = React.useRef([]);
  const [historySize, setHistorySize] = React.useState(0);
  const [futureSize, setFutureSize] = React.useState(0);
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [previewRunning, setPreviewRunning] = React.useState(false);
  const [animationCustom, setAnimationCustom] = React.useState("");
  const [previewKey, setPreviewKey] = React.useState(0);
  const [previewCommand, setPreviewCommand] = React.useState(null);
  const [materialPalette, setMaterialPalette] = React.useState([]);
  const [revision, setRevision] = React.useState(0);
  const revisionRef = React.useRef(0);
  const savedRef = React.useRef(0);
  const queueRef = React.useRef(Promise.resolve(true));
  const [saveState, setSaveState] = React.useState("saved");
  const model = models.find((item) => item.id === draft.modelTemplateId);
  const capabilities = project?.capabilities ?? [];
  const animation = draft.appearance.animation ?? {};
  const statusCapability = capabilities.find(
    (item) => item.capabilityId === animation.statusCapabilityId,
  );
  const statusEntityId =
    binding?.capabilityMappings?.[animation.statusCapabilityId]?.entityId ??
    binding?.capabilityBindings?.[animation.statusCapabilityId]?.[0];
  const statusEntity = device?.entities?.find(
    (item) => item.entityId === statusEntityId,
  );
  const choices = stateChoices(statusCapability, statusEntity);
  const issues = appearanceIssues(
    { appearance: draft.appearance },
    model,
    capabilities,
  );
  const commit = (next, record = true) => {
    if (record) {
      historyRef.current = [
        ...historyRef.current.slice(-29),
        structuredClone(draftRef.current),
      ];
      futureRef.current = [];
      setHistorySize(historyRef.current.length);
      setFutureSize(0);
    }
    draftRef.current = next;
    setDraft(next);
    revisionRef.current += 1;
    setRevision(revisionRef.current);
    setSaveState("dirty");
  };
  const patch = (key, value) =>
    commit({
      ...draftRef.current,
      appearance: { ...draftRef.current.appearance, [key]: value },
    });
  const patchMaterial = (key, value) =>
    commit({
      ...draftRef.current,
      appearance: {
        ...draftRef.current.appearance,
        [key]: value,
        [`${key}Override`]: true,
      },
    });
  const undo = () => {
    const previous = historyRef.current.pop();
    if (!previous) return;
    futureRef.current.push(structuredClone(draftRef.current));
    setHistorySize(historyRef.current.length);
    setFutureSize(futureRef.current.length);
    commit(previous, false);
  };
  const redo = () => {
    const next = futureRef.current.pop();
    if (!next) return;
    historyRef.current.push(structuredClone(draftRef.current));
    setHistorySize(historyRef.current.length);
    setFutureSize(futureRef.current.length);
    commit(next, false);
  };
  React.useEffect(() => {
    const handle = (event) => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "z")
        return;
      if (["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName))
        return;
      event.preventDefault();
      if (event.shiftKey) redo();
      else undo();
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  });
  const save = (targetRevision = revisionRef.current) => {
    if (targetRevision <= savedRef.current)
      return queueRef.current.catch(() => false);
    const snapshot = draftRef.current;
    if (!snapshot.modelTemplateId) {
      setSaveState("error");
      notify("请先选择 3D 模型。", "error");
      return Promise.resolve(false);
    }
    setSaveState("saving");
    const pending = queueRef.current
      .catch(() => {})
      .then(async () => {
        if (targetRevision <= savedRef.current) return true;
        await saveAppearance(
          projectId,
          snapshot.modelTemplateId,
          snapshot.appearance,
        );
        savedRef.current = targetRevision;
        await reload();
        if (revisionRef.current === targetRevision) setSaveState("saved");
        return true;
      });
    queueRef.current = pending;
    return pending.catch((error) => {
      setSaveState("error");
      notify(`3D 外观保存失败：${error.message}`, "error");
      return false;
    });
  };
  React.useEffect(() => {
    if (!revision) return undefined;
    const timer = window.setTimeout(() => void save(revision), 900);
    return () => window.clearTimeout(timer);
  }, [revision]);
  React.useEffect(() => {
    registerFlush?.(() => save());
    return () => registerFlush?.(null);
  }, [registerFlush]);
  const choose = (nextModel) => {
    commit({
      modelTemplateId: nextModel.id,
      appearance: {
        ...initialAppearance(nextModel),
        animation: draftRef.current.appearance.animation,
      },
    });
    setPickerOpen(false);
    setMaterialPalette([]);
    setPreviewKey((current) => current + 1);
  };
  const mergedModel = React.useMemo(
    () =>
      model ? { ...model, ...draft.appearance, projectAppearance: true } : null,
    [model, draft.appearance],
  );
  const receivePalette = React.useCallback((next) => {
    setMaterialPalette((current) =>
      JSON.stringify(current) === JSON.stringify(next) ? current : next,
    );
  }, []);
  const changeAnimation = (key, value) =>
    patch("animation", { ...animation, [key]: value });
  return (
    <ProjectStepLayout className="ddc-step-page">
      <div className="ddc-step-grid ddc-step-appearance-grid">
        <div className="ddc-step-stack">
          <section className="ddc-step-card">
            <h2>模型来源与选择</h2>
            <p>
              从 3D
              模型资源库复用本地或此前已安装的模型，配置仅作用于当前设备项目。
            </p>
            <div className="ddc-step-selected-model">
              <div className="ddc-step-model-thumb">
                {model ? <ModelPreview model={model} compact /> : "◇"}
              </div>
              <div>
                <strong>{model?.name ?? "尚未选择模型"}</strong>
                <small>{model?.tags?.join(" · ") || "设备模型"}</small>
              </div>
              <button onClick={() => setPickerOpen(true)}>从资源库选择</button>
              <button onClick={() => setPickerOpen(true)}>更换模型</button>
            </div>
            {pickerOpen && (
              <div className="ddc-step-model-picker">
                <div>
                  <b>选择设备模型</b>
                  <button onClick={() => setPickerOpen(false)}>关闭</button>
                </div>
                <div className="ddc-step-model-list">
                  {models.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      className={
                        item.id === draft.modelTemplateId ? "selected" : ""
                      }
                      onClick={() => choose(item)}
                    >
                      <ModelPreview model={item} compact />
                      <span>{item.name}</span>
                    </button>
                  ))}
                </div>
                <button onClick={onOpenLibrary}>
                  前往模型资源库选择或上传本地模型 →
                </button>
              </div>
            )}
          </section>
          <section className="ddc-step-card">
            <h2>尺寸与摆放</h2>
            <p>设置设备在 3D 场景中的实际尺寸、缩放、摆放面和锚点。</p>
            <div className="ddc-step-form-grid">
              {[
                ["width", "宽度 X"],
                ["depth", "深度 Y"],
                ["height", "高度 Z"],
              ].map(([key, label]) => (
                <NumberField
                  key={key}
                  label={label}
                  value={draft.appearance.dimensions[key] * 1000}
                  min={50}
                  max={20000}
                  step="1"
                  suffix="mm"
                  onChange={(value) =>
                    patch("dimensions", {
                      ...draft.appearance.dimensions,
                      [key]: value / 1000,
                    })
                  }
                />
              ))}
              <NumberField
                label="整体缩放"
                value={draft.appearance.scale}
                min={0.01}
                max={100}
                onChange={(value) => patch("scale", value)}
              />
              <label className="ddc-step-field">
                <span>摆放位置</span>
                <select
                  value={draft.appearance.placement}
                  onChange={(event) => patch("placement", event.target.value)}
                >
                  <option value="floor">地面</option>
                  <option value="wall">墙面</option>
                  <option value="ceiling">顶面</option>
                  <option value="surface">台面</option>
                </select>
              </label>
              <NumberField
                label="离地高度"
                value={draft.appearance.elevation * 1000}
                min={0}
                max={12000}
                step="1"
                suffix="mm"
                onChange={(value) => patch("elevation", value / 1000)}
              />
              {[
                ["x", "锚点 X"],
                ["y", "锚点 Y"],
                ["z", "锚点 Z"],
              ].map(([key, label]) => (
                <NumberField
                  key={key}
                  label={label}
                  value={draft.appearance.anchor[key] * 1000}
                  min={-20000}
                  max={20000}
                  step="1"
                  suffix="mm"
                  onChange={(value) =>
                    patch("anchor", {
                      ...draft.appearance.anchor,
                      [key]: value / 1000,
                    })
                  }
                />
              ))}
            </div>
          </section>
          <section className="ddc-step-card">
            <h2>外观参数</h2>
            <p>
              默认保留模型文件自身的分区颜色与材质；修改单项参数后，仅覆盖该参数。
            </p>
            <div className="ddc-step-form-grid">
              <label className="ddc-step-field">
                <span>默认颜色</span>
                <input
                  type="color"
                  value={draft.appearance.color}
                  onChange={(event) =>
                    patchMaterial("color", event.target.value)
                  }
                />
              </label>
              <NumberField
                label="金属度"
                value={draft.appearance.metalness}
                min={0}
                max={1}
                onChange={(value) => patchMaterial("metalness", value)}
              />
              <NumberField
                label="粗糙度"
                value={draft.appearance.roughness}
                min={0}
                max={1}
                onChange={(value) => patchMaterial("roughness", value)}
              />
            </div>
            <div className="ddc-step-history">
              <small>
                颜色：{draft.appearance.colorOverride ? "统一改色" : "模型原色"}{" "}
                · 金属度：
                {draft.appearance.metalnessOverride ? "项目覆盖" : "模型原值"} ·
                粗糙度：
                {draft.appearance.roughnessOverride ? "项目覆盖" : "模型原值"}
              </small>
              <button
                type="button"
                onClick={() =>
                  commit({
                    ...draftRef.current,
                    appearance: {
                      ...draftRef.current.appearance,
                      colorOverride: false,
                      materialColors: {},
                      metalnessOverride: false,
                      roughnessOverride: false,
                    },
                  })
                }
              >
                恢复模型原材质
              </button>
            </div>
            {model?.source?.url && (
              <div className="ddc-step-material-palette">
                <strong>模型原色分组</strong>
                <small>
                  从模型材质读取。分别调整原色对应的部件，不修改资源库中的模型文件。
                </small>
                {materialPalette.length ? (
                  <div className="ddc-step-material-colors">
                    {materialPalette.map(({ color, count }) => (
                      <label key={color}>
                        <span
                          className="ddc-step-material-swatch"
                          style={{ backgroundColor: color }}
                        />
                        <span>
                          {color} · {count} 个材质
                        </span>
                        <input
                          type="color"
                          aria-label={`调整原色 ${color}`}
                          value={
                            draft.appearance.materialColors?.[color] ?? color
                          }
                          onChange={(event) =>
                            patch("materialColors", {
                              ...(draftRef.current.appearance.materialColors ??
                                {}),
                              [color]: event.target.value,
                            })
                          }
                        />
                        <button
                          type="button"
                          disabled={!draft.appearance.materialColors?.[color]}
                          onClick={() => {
                            const next = {
                              ...(draftRef.current.appearance.materialColors ??
                                {}),
                            };
                            delete next[color];
                            patch("materialColors", next);
                          }}
                        >
                          恢复
                        </button>
                      </label>
                    ))}
                  </div>
                ) : (
                  <small>模型载入后显示可调整的原色。</small>
                )}
              </div>
            )}
            <div className="ddc-step-history">
              <button disabled={!historySize} onClick={undo}>
                ↶ 撤销
              </button>
              <button disabled={!futureSize} onClick={redo}>
                ↷ 重做
              </button>
              <button
                onClick={() =>
                  commit({
                    ...draftRef.current,
                    appearance: { ...initialAppearance(model), animation },
                  })
                }
              >
                重置外观
              </button>
              <small>当前会话保留最近 30 步</small>
            </div>
          </section>
          <section className="ddc-step-card">
            <h2>动作与联动</h2>
            <p>引用已定义的能力 ID 和状态值，驱动运行中预览及设备动画。</p>
            <div className="ddc-step-form-grid">
              <label className="ddc-step-field">
                <span>运行状态能力</span>
                <select
                  value={animation.statusCapabilityId ?? ""}
                  onChange={(event) =>
                    changeAnimation("statusCapabilityId", event.target.value)
                  }
                >
                  <option value="">不联动</option>
                  {capabilities
                    .filter((item) => ["status", "enum"].includes(item.kind))
                    .map((item) => (
                      <option value={item.capabilityId} key={item.capabilityId}>
                        {item.name} / {item.capabilityId}
                      </option>
                    ))}
                </select>
              </label>
              <label className="ddc-step-field">
                <span>剩余时间能力</span>
                <select
                  value={animation.remainingCapabilityId ?? ""}
                  onChange={(event) =>
                    changeAnimation("remainingCapabilityId", event.target.value)
                  }
                >
                  <option value="">不使用</option>
                  {capabilities
                    .filter((item) => item.dataType === "number")
                    .map((item) => (
                      <option value={item.capabilityId} key={item.capabilityId}>
                        {item.name} / {item.capabilityId}
                      </option>
                    ))}
                </select>
              </label>
            </div>
            <div className="ddc-step-state-field">
              <strong>触发动画的状态值</strong>
              <div className="ddc-step-chips">
                {(animation.activeStates ?? []).map((value) => (
                  <button
                    key={value}
                    className={
                      !choices.some(
                        (item) => item.value === value && !item.missing,
                      ) &&
                      statusCapability?.kind === "enum" &&
                      Boolean(statusCapability.enumValues?.length)
                        ? "invalid"
                        : ""
                    }
                    onClick={() =>
                      changeAnimation(
                        "activeStates",
                        animation.activeStates.filter((item) => item !== value),
                      )
                    }
                  >
                    {value} ×
                  </button>
                ))}
                <select
                  value=""
                  aria-label="添加动画状态值"
                  onChange={(event) =>
                    changeAnimation("activeStates", [
                      ...new Set([
                        ...(animation.activeStates ?? []),
                        event.target.value,
                      ]),
                    ])
                  }
                >
                  <option value="">＋ 添加状态值</option>
                  {choices
                    .filter(
                      (item) =>
                        !animation.activeStates?.includes(item.value) &&
                        !item.missing,
                    )
                    .map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                </select>
                <input
                  aria-label="输入动画自定义状态值"
                  value={animationCustom}
                  placeholder="或输入 HA 状态值回车"
                  onChange={(event) => setAnimationCustom(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter") return;
                    event.preventDefault();
                    const value = animationCustom.trim();
                    if (value)
                      changeAnimation("activeStates", [
                        ...new Set([...(animation.activeStates ?? []), value]),
                      ]);
                    setAnimationCustom("");
                  }}
                />
              </div>
            </div>
          </section>
        </div>
        <div className="ddc-step-stack">
          <section className="ddc-step-card ddc-step-3d">
            <h2>3D 预览</h2>
            <p>拖动旋转、右键平移、滚轮缩放；切换运行状态查看蓝色呼吸描边。</p>
            <div className="ddc-step-3d-canvas">
              {mergedModel ? (
                <ModelPreview
                  key={previewKey}
                  model={mergedModel}
                  command={previewCommand}
                  onPalette={receivePalette}
                  animated={
                    previewRunning && (animation.activeStates?.length ?? 0) > 0
                  }
                />
              ) : (
                <div className="ddc-step-missing-model">请选择模型</div>
              )}
            </div>
            <div className="ddc-step-preview-actions">
              <button
                onClick={() =>
                  setPreviewCommand({ id: Date.now(), type: "rotate" })
                }
              >
                ⟳ 旋转
              </button>
              <button
                onClick={() =>
                  setPreviewCommand({ id: Date.now(), type: "pan" })
                }
              >
                ✥ 平移
              </button>
              <button
                onClick={() =>
                  setPreviewCommand({ id: Date.now(), type: "zoom" })
                }
              >
                ⌕ 缩放
              </button>
              <button
                onClick={() =>
                  setPreviewCommand({ id: Date.now(), type: "fit" })
                }
              >
                适应视图
              </button>
              <button onClick={() => setPreviewKey((value) => value + 1)}>
                ⌂ 重置视角
              </button>
              <button onClick={() => setPreviewRunning((value) => !value)}>
                {previewRunning ? "■ 停止运行预览" : "▶ 运行中预览"}
              </button>
            </div>
          </section>
          <section className="ddc-step-card">
            <h2>运行中预览</h2>
            <div className="ddc-step-preview-content">
              <div className="ddc-step-model-thumb">
                {mergedModel ? (
                  <ModelPreview model={mergedModel} compact animated={previewRunning} />
                ) : (
                  "◇"
                )}
              </div>
              <div>
                <strong>{project?.name}</strong>
                <span>
                  {previewRunning
                    ? animation.activeStates?.[0] || "运行中"
                    : "待机中"}
                </span>
                <small>此处仅模拟，不控制 HA 设备</small>
              </div>
            </div>
          </section>
        </div>
      </div>
      {issues.length > 0 && (
        <div className="ddc-step-issues" role="status">
          <b>配置需要检查</b>
          {issues.map((issue) => (
            <span key={issue}>⚠ {issue}</span>
          ))}
        </div>
      )}
      <footer className="ddc-step-footer">
        <span>
          {
            {
              saved: "● 已自动保存",
              saving: "● 自动保存中…",
              dirty: "● 存在未保存修改",
              error: "● 保存失败 · 请检查",
            }[saveState]
          }
        </span>
        <div>
          <button onClick={() => void onPrevious()}>
            上一步：运行浮窗配置
          </button>
          <button className="primary" onClick={() => void onNext?.()}>
            下一步：控制面板 →
          </button>
        </div>
      </footer>
    </ProjectStepLayout>
  );
}
