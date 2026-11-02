import {toggleModelPartSelection} from "../../domain/model-part-selection.js";
import {rotationGroupTargets} from "../../domain/shared-part-rotation.js";
import MotionEffectFields from "./motion-effect-fields.jsx";
import {
  MotionResourceSelect,
  useMotionResources,
} from "./motion-resources.jsx";
import { motionResourceRule } from "../../../../../packages/schema/src/motion-library.js";
import {
  modelPartLabel,
} from "../../../../../packages/schema/src/model-part-labels.js";
import { a as React } from "../../vendor/react.js";
import ModelPreview from "./model-preview.jsx";
import {
  MOTION_EFFECTS,
  MOTION_OPERATORS,
  normalizePartMotionRules,
  partMotionIssues,
} from "../../../../../packages/schema/src/part-motion.js";
import "../../styles/part-motion.css";
const copy = (value) => structuredClone(value);
const stateValue = (cap) =>
  String(
    cap?.enumValues?.find((v) => v.status !== "missing")?.value ??
      (cap?.dataType === "number" ? 50 : "on"),
  );
export default function PartMotionEditor({
  model,
  rules = [],
  capabilities = [],
  onChange,
  registerDraftGuard,
  partLabels = {},
}) {
  const { resources: motionResources } = useMotionResources();
  const [codePreviewStatus,setCodePreviewStatus]=React.useState({pending:false,error:''});
  const receiveMotionValidation=React.useCallback(status=>setCodePreviewStatus(current=>current.pending===status.pending&&current.error===status.error?current:status),[]);
  const [parts, setParts] = React.useState([]),
    [selected, setSelected] = React.useState(""),
    [draft, setDraft] = React.useState(null),
    [search, setSearch] = React.useState(""),
    [values, setValues] = React.useState({}),
    [playing, setPlaying] = React.useState(true),
    [reset, setReset] = React.useState(0),
    [validated, setValidated] = React.useState(false),
    [message, setMessage] = React.useState(""),
    [picking, setPicking] = React.useState(false),
    [offline, setOffline] = React.useState(false);
  const [pickedParts,setPickedParts]=React.useState([]);
  const [unsaved, setUnsaved] = React.useState(false);
  const [showRotationAxes,setShowRotationAxes]=React.useState(true);
  const [pivotDragging,setPivotDragging]=React.useState(false);
  const [trialAngle,setTrialAngle]=React.useState(null);
  React.useEffect(()=>{setPivotDragging(false);},[draft?.id,draft?.effect.type,selected]);
  React.useEffect(()=>{setTrialAngle(draft?.effect.type==="rotate"?Number(draft.effect.to)||0:null);},[draft?.id,draft?.effect.type,draft?.effect.to]);
  React.useEffect(() => {
    registerDraftGuard?.(() => {
      if (unsaved) {
        setMessage("当前规则尚未保存，请先校验并保存，或放弃修改。");
        return false;
      }
      return true;
    });
    return () => registerDraftGuard?.(null);
  }, [unsaved, registerDraftGuard]);
  const label = (part) => modelPartLabel(part, partLabels);
  const sourceKey = JSON.stringify(model?.source);
  React.useEffect(() => {
    setParts([]);
    setDraft(null);
    setSelected("");
    setPickedParts([]);
    setPicking(false);
    setValidated(false);
  }, [sourceKey]);
  const receiveParts = React.useCallback(
    (next) =>
      setParts((current) =>
        JSON.stringify(current) === JSON.stringify(next) ? current : next,
      ),
    [],
  );
  const sampleValues = Object.fromEntries(
    capabilities.map((cap) => [
      cap.capabilityId,
      offline ? "unavailable" : (values[cap.capabilityId] ?? stateValue(cap)),
    ]),
  );
  const change = (patch) => {
    setUnsaved(true);
    setDraft((current) => ({ ...current, ...patch }));
    setValidated(false);
    setMessage("");
  };
  const effect = (patch) => change({ effect: { ...draft.effect, ...patch } });
  const choose = (rule) => {
    if (unsaved) {
      setMessage("请先保存当前规则，或放弃修改。");
      return;
    }
    setUnsaved(!rules.some((r) => r.id === rule.id));
    setDraft(copy(rule));
    setPickedParts([...rule.targets]);
    setSelected(rule.targets[0] ?? "");
    setValidated(false);
    setMessage("");
    setPicking(false);
  };
  const add = () => {
    const cap = capabilities[0];
    choose(
      {...motionResourceRule(
        motionResources.find((r) => r.id === "builtin.motion.translate"),
        {
          id: `motion-${Date.now()}`,
          name: "新部件动效",
          capabilityId: cap?.capabilityId ?? "",
          condition: { operator: "eq", value: stateValue(cap) },
        },
      ), targets: []},
    );
  };
  const selectPart = (path, {additive=false}={}) => {
    const next=toggleModelPartSelection(draft?.targets??pickedParts,path,additive);
    setPickedParts(next);
    setSelected(next.includes(path)?path:next.at(-1)||"");
    if(draft)change({targets:next});
  };
  const removeRule = (rule) => {
    if (unsaved && draft?.id !== rule.id) {
      setMessage("请先保存当前规则，或放弃修改后再删除其他规则。");
      return;
    }
    const saved = rules.some((r) => r.id === rule.id);
    if (saved) onChange(rules.filter((r) => r.id !== rule.id));
    if (draft?.id === rule.id) {
      setDraft(null);
      setUnsaved(false);
      setValidated(false);
      setPicking(false);
    }
    setMessage(
      saved ? "规则已删除，随当前外观自动保存。" : "未保存规则已删除。",
    );
  };
  let checked = [],
    issues = [];
  try {
    checked = normalizePartMotionRules(
      draft ? [...rules.filter((r) => r.id !== draft.id), draft] : rules,
    );
    issues = partMotionIssues(
      checked,
      capabilities,
      parts.length ? parts : undefined,
    );
  } catch (error) {
    issues = [error.message];
  }
  const preview = () => {
    setTrialAngle(null);setPivotDragging(false);
    if(codePreviewStatus.error||codePreviewStatus.pending){setMessage(codePreviewStatus.error||'动效代码正在编译，请稍候再校验。');return;}
    if (issues.length) {
      setMessage(issues.join("；"));
      return;
    }
    if (!parts.length) {
      setMessage("请等待模型加载完成");
      return;
    }
    setValidated(true);
    setPlaying(true);
    setMessage("规则校验通过，正在模拟预览；不会控制真实设备。");
  };
  const save = () => {
    if (!validated || issues.length ||codePreviewStatus.error||codePreviewStatus.pending) return;
    onChange(
      checked.map((r) =>
        r.id === draft.id
          ? {
              ...r,
              targetNames: Object.fromEntries(
                r.targets.map((path) => [
                  path,
                  parts.find((p) => p.path === path)?.name ?? "放弃绑定",
                ]),
              ),
            }
          : r,
      ),
    );
    setUnsaved(false);
    setDraft(null);setSelected("");setPickedParts([]);setValidated(false);
    setTrialAngle(null);setPivotDragging(false);setPicking(false);
    setMessage("规则已应用，已退出规则编辑，随当前外观自动保存。");
  };
  const input = (label, value, onChange, props = {}) => (
    <label>
      <span>{label}</span>
      <input
        aria-label={label}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        {...props}
      />
    </label>
  );
  const numeric = (label, value, onChange, props = {}) =>
    input(label, value, (v) => onChange(v), {
      type: "number",
      step: "any",
      ...props,
    });
  if (!model)
    return (
      <section className="ddc-step-card">
        请先在「模型与材质」中选择模型。
      </section>
    );
  if (model.source?.type !== "upload")
    return (
      <section className="ddc-step-card">
        <h2>请使用已拆分部件的 GLB / GLTF 模型</h2>
        <p>
          部件树读取上传模型的真实层级；内置整体外形可继续使用原来的运行预览。
        </p>
      </section>
    );
  const activeCap = capabilities.find(
    (c) => c.capabilityId === draft?.capabilityId,
  );
  const draftIndex = rules.findIndex((r) => r.id === draft?.id);
  const rotationRule=draft && ["rotate","spin"].includes(draft.effect.type);
  const rotationTarget=rotationRule?rotationGroupTargets(draft.targets)[0]:null;
  const rotationPreview=rotationRule && rotationTarget ? {
    target:rotationTarget,targets:[...draft.targets],
    axis:draft.effect.axis,pivot:draft.effect.pivot.map(value=>Number(value)||0),
    editing:pivotDragging&&showRotationAxes,showAxes:showRotationAxes,angle:trialAngle,
  }:undefined;
  const rotationTools = rotationRule && <div className="rotation-pivot-tools">
            <small>共同轴心参考：{parts.find(part=>part.path===rotationTarget)?label(parts.find(part=>part.path===rotationTarget)):"请选择作用部件"} · {draft.targets.length} 个部件</small>
            <div className="part-motion-toolbar">
              <label><input type="checkbox" checked={showRotationAxes} onChange={event=>{setShowRotationAxes(event.target.checked);if(!event.target.checked){setPivotDragging(false);setTrialAngle(null);}}}/>显示旋转辅助轴</label>
              <button type="button" aria-pressed={pivotDragging} disabled={!rotationTarget || !showRotationAxes} onClick={()=>{setPivotDragging(!pivotDragging);setTrialAngle(pivotDragging?Number(draft.effect.to)||0:0);}}>{pivotDragging?"结束调整中心":"拖动旋转中心"}</button>
              <button type="button" onClick={()=>{effect({pivot:[0,0,0]});setTrialAngle(Number(draft.effect.to)||0);setShowRotationAxes(true);}}>恢复部件原点</button>
            </div>
            <small>拖动彩色手柄调整共同旋转中心，坐标以首个顶层勾选部件为参考。</small>
            {draft.effect.type==="rotate" && <label className="rotation-trial-slider">目标角度：{Number(draft.effect.to)||0}°
              <input aria-label="旋转目标角度" type="range" min={Math.min(-180,Number(draft.effect.to)||0)} max={Math.max(180,Number(draft.effect.to)||0)} step="1" disabled={!rotationTarget} value={Number(draft.effect.to)||0} onChange={event=>{const angle=Number(event.target.value);setPivotDragging(false);setTrialAngle(angle);effect({to:angle});}}/>
            </label>}
          </div>;
  return (
    <div className="part-motion-editor">
      <aside className="part-motion-left">
        <section>
          <h2>模型部件</h2>
          <input
            aria-label="搜索模型部件"
            placeholder="搜索部件名称"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="part-motion-tree" role="tree" aria-label="模型部件树">
            {parts
              .filter((p) =>
                (p.name + label(p))
                  .toLowerCase()
                  .includes(search.toLowerCase()),
              )
              .map((p) => (
                <div
                  key={p.path}
                  className={(draft?.targets??pickedParts).includes(p.path) ? "selected" : ""}
                  style={{ paddingLeft: 8 + Math.min(p.depth, 5) * 12 }}
                >
                  {draft && (
                    <input
                      type="checkbox"
                      aria-label={`作用部件 ${label(p)} ${p.path}`}
                      checked={draft.targets.includes(p.path)}
                      onChange={(e) =>
                        change({
                          targets: e.target.checked
                            ? [...draft.targets, p.path]
                            : draft.targets.filter((t) => t !== p.path),
                        })
                      }
                    />
                  )}
                  <button
                    role="treeitem"
                    aria-selected={(draft?.targets??pickedParts).includes(p.path)}
                    title={`${p.path} · ${p.type}`}
                    onClick={event => selectPart(p.path,{additive:event.ctrlKey||event.metaKey})}
                  >
                    {p.mesh ? "◇" : "▱"} {label(p)}
                  </button>
                </div>
              ))}
          </div>
          <small>
            模型应先拆分可动器件，并使用稳定名称。坐标和轴心使用模型局部单位；GLTF
            通常以米为单位。
          </small>
        </section>
        <section>
          <h2>
            动效规则{" "}
            <button onClick={add} disabled={!capabilities.length}>
              ＋ 新增规则
            </button>
          </h2>
          {!capabilities.length && <p>请先定义至少一项设备能力。</p>}
          <div className="part-motion-rules">
            {rules.map((r) => (
              <div className="part-motion-rule-row" key={r.id}>
                <button
                  className={draft?.id === r.id ? "selected" : ""}
                  onClick={() => choose(r)}
                >
                  {r.enabled ? "●" : "○"} {r.name}
                  <small>
                    {MOTION_EFFECTS[r.effect.type]} · {r.targets.length} 个部件
                  </small>
                </button>
                <button
                  className="part-motion-rule-delete"
                  aria-label={`删除规则 ${r.name}`}
                  title={`删除规则 ${r.name}`}
                  onClick={() => removeRule(r)}
                >
                  删除
                </button>
              </div>
            ))}
          </div>
        </section>
      </aside>
      <main className="part-motion-center">
        <section className="part-motion-viewport">
          <header>
            <strong>
              {picking ? "点击模型表面添加流光路径点" : "点击选中／反选部件 · Ctrl 多选"}
            </strong>
            <button
              onClick={() => {
                setReset((v) => v + 1);
                setPlaying(true);
              }}
            >
              重置预览
            </button>
          </header>
          <ModelPreview
            key={`${sourceKey}-${reset}`}
            model={model}
            onParts={receiveParts}
            onSelectPart={selectPart}
            selectedPart={selected}
            selectedParts={draft?.targets??pickedParts}
            rotationPreview={rotationPreview}
            onPivotChange={point=>effect({pivot:point})}
            motionRules={checked}
            motionValues={sampleValues}
            motionPlaying={playing}
            onMotionValidation={receiveMotionValidation}
            pathPicking={picking}
            onPathPoint={(point) => {
              if (
                draft?.effect.type === "flow" &&
                draft.effect.path.length < 32
              )
                effect({ path: [...draft.effect.path, point] });
            }}
          />

        </section>
        <section className="part-motion-simulation">
          <h3>
            模拟预览 <small>不发送真实设备指令</small>
          </h3>
          <div className="part-motion-samples">
            {capabilities
              .filter(
                (c) =>
                  rules.some((r) => r.capabilityId === c.capabilityId) ||
                  draft?.capabilityId === c.capabilityId,
              )
              .map((cap) => (
                <label key={cap.capabilityId}>
                  <span>{cap.name}</span>
                  {cap.enumValues?.length ? (
                    <select
                      aria-label={`模拟 ${cap.name}`}
                      value={sampleValues[cap.capabilityId]}
                      onChange={(e) =>
                        setValues((v) => ({
                          ...v,
                          [cap.capabilityId]: e.target.value,
                        }))
                      }
                    >
                      {cap.enumValues
                        .filter((v) => v.status !== "missing")
                        .map((v) => (
                          <option key={v.value} value={v.value}>
                            {v.label || v.value}
                          </option>
                        ))}
                    </select>
                  ) : (
                    <input
                      aria-label={`模拟 ${cap.name}`}
                      type={cap.dataType === "number" ? "number" : "text"}
                      value={offline ? "" : sampleValues[cap.capabilityId]}
                      onChange={(e) =>
                        setValues((v) => ({
                          ...v,
                          [cap.capabilityId]: e.target.value,
                        }))
                      }
                    />
                  )}
                </label>
              ))}
          </div>
          <div className="part-motion-toolbar">
            <button onClick={() => setPlaying((v) => !v)}>
              {playing ? "暂停模拟" : "播放模拟"}
            </button>
            <button
              onClick={() => {
                setValues({});
                setOffline(false);
                setReset((v) => v + 1);
              }}
            >
              恢复初始状态
            </button>
            <label>
              <input
                type="checkbox"
                checked={offline}
                onChange={(e) => setOffline(e.target.checked)}
              />{" "}
              模拟离线
            </label>
          </div>
        </section>
      </main>
      <aside className="part-motion-settings">
        <h2>规则设置</h2>
        {draft ? (
          <>
            {input("规则名称", draft.name, (name) => change({ name }))}
            <label>
              <input
                type="checkbox"
                checked={draft.enabled}
                onChange={(e) => change({ enabled: e.target.checked })}
              />
              启用此规则
            </label>
            <h3>1 · 作用部件</h3>
            <p>
              {draft.targets
                .map((t) =>
                  parts.find((p) => p.path === t)
                    ? label(parts.find((p) => p.path === t))
                    : "部件已丢失",
                )
                .join("、") || "尚未选择"}{" "}
              <small>可在树中多选</small>
            </p>
            <h3>2 · 触发条件</h3>
            <label>
              设备能力
              <select
                aria-label="动效设备能力"
                value={draft.capabilityId}
                onChange={(e) => change({ capabilityId: e.target.value })}
              >
                <option value="">请选择</option>
                {capabilities.map((c) => (
                  <option key={c.capabilityId} value={c.capabilityId}>
                    {c.name} · {c.capabilityId}
                  </option>
                ))}
              </select>
            </label>
            <div className="part-motion-row">
              <select
                aria-label="动效条件"
                value={draft.condition.operator}
                onChange={(e) =>
                  change({
                    condition: { ...draft.condition, operator: e.target.value },
                  })
                }
              >
                {Object.entries(MOTION_OPERATORS).map(([id, label]) => (
                  <option value={id} key={id}>
                    {label}
                  </option>
                ))}
              </select>
              {activeCap?.enumValues?.length &&
              ["eq", "neq"].includes(draft.condition.operator) ? (
                <select
                  aria-label="触发状态值"
                  value={draft.condition.value}
                  onChange={(e) =>
                    change({
                      condition: { ...draft.condition, value: e.target.value },
                    })
                  }
                >
                  <option value="">请选择原始状态</option>
                  {activeCap.enumValues
                    .filter((v) => v.status !== "missing")
                    .map((v) => (
                      <option key={v.value} value={v.value}>
                        {v.label && v.label!==v.value ? `${v.label}（${v.value}）` : v.value}
                      </option>
                    ))}
                </select>
              ) : (
                <input
                  aria-label="触发值"
                  value={draft.condition.value}
                  onChange={(e) =>
                    change({
                      condition: { ...draft.condition, value: e.target.value },
                    })
                  }
                />
              )}
            </div>
            <p className="field-hint">条件匹配 HA 原始状态值，中文仅作显示说明。{activeCap?.currentState!=null?` 当前：${activeCap.currentStateLabel}（${activeCap.currentState}）`:''}</p>
            {draft.condition.operator === "between" &&
              input("区间上限", draft.condition.max, (max) =>
                change({ condition: { ...draft.condition, max } }),
              )}
            <label>
              <input
                type="checkbox"
                checked={draft.mapping.enabled}
                onChange={(e) =>
                  change({
                    mapping: { ...draft.mapping, enabled: e.target.checked },
                    ...(e.target.checked && activeCap?.dataType === "number"
                      ? {
                          condition: {
                            operator: "gte",
                            value: String(draft.mapping.inputMin),
                            max: "",
                          },
                        }
                      : {}),
                  })
                }
              />
              数值连续映射
            </label>
            {draft.mapping.enabled && (
              <div className="part-motion-row">
                {numeric("输入下限", draft.mapping.inputMin, (inputMin) =>
                  change({ mapping: { ...draft.mapping, inputMin } }),
                )}
                {numeric("输入上限", draft.mapping.inputMax, (inputMax) =>
                  change({ mapping: { ...draft.mapping, inputMax } }),
                )}
              </div>
            )}
            {draft.mapping.enabled &&
              !["translate", "rotate", "spin", "scale"].includes(
                draft.effect.type,
              ) && (
                <div className="part-motion-row">
                  {numeric(
                    draft.effect.type === "emissive"
                      ? "起始发光强度"
                      : "映射输出起始值",
                    draft.effect.from,
                    (from) => effect({ from }),
                  )}
                  {numeric(
                    draft.effect.type === "emissive"
                      ? "目标发光强度"
                      : "映射输出目标值",
                    draft.effect.to,
                    (to) => effect({ to }),
                  )}
                </div>
              )}
            <h3>3 · 动效</h3>
            <MotionResourceSelect
              draft={draft}
              onSelect={(resource) =>
                change({
                  effect: structuredClone(resource.effect),
                  transitionMs: resource.transitionMs,
                  motionResourceId: resource.id,
                })
              }
            />
            <MotionEffectFields
              rotationTools={rotationTools}
              value={draft.effect}
              onChange={effect}
              mappingEnabled={draft.mapping.enabled}
              picking={picking}
              onTogglePicking={() => setPicking((v) => !v)}
            />

            <h3>4 · 切换与冲突</h3>
            {numeric(
              "过渡时间（毫秒）",
              draft.transitionMs,
              (transitionMs) => change({ transitionMs }),
              { min: 0, max: 10000 },
            )}
            {numeric(
              "优先级",
              draft.priority,
              (priority) => change({ priority }),
              { min: 0, max: 100 },
            )}
            <label>
              条件结束后
              <select
                aria-label="动效结束行为"
                value={draft.endBehavior}
                onChange={(e) => change({ endBehavior: e.target.value })}
              >
                <option value="restore">平滑恢复原状</option>
                <option value="hold">保持最后状态</option>
              </select>
            </label>
            <small>同一部件相同属性由更高优先级覆盖；离线始终恢复原状。</small>
            <div className="part-motion-toolbar">
              <button onClick={preview}>校验并模拟预览</button>
              <button
                disabled={!unsaved}
                onClick={() => {
                  const saved = rules.find((r) => r.id === draft.id);
                  setDraft(saved ? copy(saved) : null);
                  setUnsaved(false);
                  setValidated(false);
                  setPicking(false);
                  setMessage("已放弃未保存修改。");
                }}
              >
                放弃修改
              </button>
              <button
                className="primary"
                disabled={!validated || issues.length > 0 ||Boolean(codePreviewStatus.error)||codePreviewStatus.pending}
                onClick={save}
              >
                保存规则
              </button>
              <button onClick={() => removeRule(draft)}>
                {draftIndex >= 0 ? "删除规则" : "删除未保存规则"}
              </button>
            </div>
          </>
        ) : (
          <p>选择模型部件，再新增规则，或编辑左侧已有规则。</p>
        )}
        {message && <p role="status">{message}</p>}
        {issues.length > 0 && (
          <div className="part-motion-issues" role="alert">
            {issues.map((issue, i) => (
              <p key={i}>{issue}</p>
            ))}
          </div>
        )}
      </aside>
    </div>
  );
}
