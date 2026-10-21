import ProjectStepLayout from "./project-step-layout.jsx";
import { a as React } from "../../vendor/react.js";
import {
  resolveWasherRuntime,
  washerRuntimeLabel,
  washerRuntimeTitle,
} from "../../domain/washer-runtime.js";
import ModelPreview from "./model-preview.jsx";
import {
  EMPTY_RUNTIME_DISPLAY,
  runtimeDisplayIssues,
  runtimeTemplateVariables,
  stateChoices,
} from "./project-runtime-model.js";
import "../../styles/device-development-runtime.css";

async function saveRuntime(projectId, config) {
  const response = await fetch(
    `./api/device-platform/projects/${encodeURIComponent(projectId)}/runtime-display`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ runtimeDisplay: config }),
    },
  );
  const result = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(result.error || `请求失败：${response.status}`);
  return result;
}

function StateChips({ label, values, choices, validateChoices, onChange }) {
  const [custom, setCustom] = React.useState("");
  const add = (value) => {
    const next = String(value ?? "").trim();
    if (next && !values.includes(next)) onChange([...values, next]);
    setCustom("");
  };
  return (
    <div className="ddc-step-state-field">
      <strong>{label}</strong>
      <div className="ddc-step-chips">
        {values.map((value) => {
          const choice = choices.find(
            (item) => item.value === value && !item.missing,
          );
          return (
            <button
              type="button"
              key={value}
              className={!choice && validateChoices ? "invalid" : ""}
              title={
                !choice && validateChoices
                  ? "当前能力已不存在该状态"
                  : "移除此状态"
              }
              onClick={() => onChange(values.filter((item) => item !== value))}
            >
              {choice?.label || value} ×
            </button>
          );
        })}
        <select
          aria-label={`添加${label}`}
          value=""
          onChange={(event) => add(event.target.value)}
        >
          <option value="">＋ 添加状态值</option>
          {choices
            .filter((item) => !values.includes(item.value) && !item.missing)
            .map((item) => (
              <option value={item.value} key={item.value}>
                {item.label}
              </option>
            ))}
        </select>
        <input
          aria-label={`输入${label}自定义状态值`}
          value={custom}
          placeholder="或输入状态值回车"
          onChange={(event) => setCustom(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              add(custom);
            }
          }}
        />
      </div>
    </div>
  );
}

export default function ProjectRuntime({
  projectId,
  platform,
  devices,
  reload,
  notify,
  registerFlush,
  onPrevious,
  onNext,
}) {
  const project = platform.deviceTemplates.find(
    (item) => item.id === projectId,
  );
  const binding = platform.bindings.find(
    (item) => item.deviceTemplateId === projectId,
  );
  const device = devices.find((item) => item.id === binding?.deviceId);
  const [config, setConfig] = React.useState(() =>
    structuredClone(project?.runtimeDisplay ?? EMPTY_RUNTIME_DISPLAY),
  );
  const [revision, setRevision] = React.useState(0);
  const revisionRef = React.useRef(0);
  const savedRef = React.useRef(0);
  const configRef = React.useRef(config);
  const queueRef = React.useRef(Promise.resolve(true));
  const [saveState, setSaveState] = React.useState("saved");
  const [variable, setVariable] = React.useState("{device.name}");
  const fieldRefs = React.useRef({});
  const [focusedField, setFocusedField] = React.useState("titleTemplate");
  const capabilities = project?.capabilities ?? [];
  const statusCapability = capabilities.find(
    (item) => item.capabilityId === config.statusCapabilityId,
  );
  const statusEntityId =
    binding?.capabilityMappings?.[config.statusCapabilityId]?.entityId ??
    binding?.capabilityBindings?.[config.statusCapabilityId]?.[0];
  const statusEntity = device?.entities?.find(
    (item) => item.entityId === statusEntityId,
  );
  const choices = stateChoices(statusCapability, statusEntity);
  const issues = runtimeDisplayIssues(config, capabilities, binding, device);
  const overlap = (config.runningStates ?? []).some((value) =>
    config.endingStates?.includes(value),
  );
  const patch = (next) => {
    configRef.current = next;
    setConfig(next);
    revisionRef.current += 1;
    setRevision(revisionRef.current);
    setSaveState("dirty");
  };
  const save = (targetRevision = revisionRef.current) => {
    if (targetRevision <= savedRef.current)
      return queueRef.current.catch(() => false);
    const snapshot = configRef.current;
    if (
      (snapshot.runningStates ?? []).some((value) =>
        snapshot.endingStates?.includes(value),
      )
    ) {
      setSaveState("error");
      notify("同一状态不能同时属于运行中和结束状态，未保存冲突配置。", "error");
      return Promise.resolve(false);
    }
    setSaveState("saving");
    const pending = queueRef.current
      .catch(() => {})
      .then(async () => {
        if (targetRevision <= savedRef.current) return true;
        await saveRuntime(projectId, snapshot);
        savedRef.current = targetRevision;
        await reload();
        if (revisionRef.current === targetRevision) setSaveState("saved");
        return true;
      });
    queueRef.current = pending;
    return pending.catch((error) => {
      setSaveState("error");
      notify(`运行浮窗保存失败：${error.message}`, "error");
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
  const insertVariable = () => {
    const field = focusedField;
    const input = fieldRefs.current[field];
    const current = configRef.current[field] ?? "";
    const start = input?.selectionStart ?? current.length;
    const end = input?.selectionEnd ?? start;
    const token = variables.some((item) => item.token === variable)
      ? variable
      : variables[0].token;
    const next = `${current.slice(0, start)}${token}${current.slice(end)}`;
    patch({ ...configRef.current, [field]: next });
    requestAnimationFrame(() => {
      input?.focus();
      input?.setSelectionRange(start + token.length, start + token.length);
    });
  };
  const preview = (running) => {
    const state = running
      ? (config.runningStates?.[0] ?? "running")
      : (config.endingStates?.[0] ?? "idle");
    const entityId = statusEntityId || "sensor.preview_status";
    const remainingId =
      binding?.capabilityMappings?.[config.remainingCapabilityId]?.entityId ??
      binding?.capabilityBindings?.[config.remainingCapabilityId]?.[0] ??
      "sensor.preview_remaining";
    const now = Date.now();
    const entities = [
      ...(device?.entities ?? []).filter(
        (item) => ![entityId, remainingId].includes(item.entityId),
      ),
      {
        ...(statusEntity ?? {}),
        entityId,
        state,
        lastUpdated: new Date(now - 12 * 60_000).toISOString(),
      },
      {
        ...(device?.entities?.find((item) => item.entityId === remainingId) ??
          {}),
        entityId: remainingId,
        state: "48",
        lastUpdated: new Date(now).toISOString(),
        attributes: { unit_of_measurement: "min" },
      },
    ];
    const bindings = {
      ...(binding?.capabilityBindings ?? {}),
      [config.statusCapabilityId]: [entityId],
      ...(config.remainingCapabilityId
        ? { [config.remainingCapabilityId]: [remainingId] }
        : {}),
    };
    const runtime = resolveWasherRuntime(
      null,
      {
        deviceEntities: entities,
        deviceCapabilityBindings: bindings,
        deviceDisplayName: project?.name,
        deviceCapabilityNames: Object.fromEntries(
          capabilities.map((item) => [item.capabilityId, item.name]),
        ),
      },
      config,
    );
    return {
      title: washerRuntimeTitle(runtime, project?.name ?? "设备", now),
      text: washerRuntimeLabel(runtime, now) ?? "待机中",
      state,
    };
  };
  const idle = preview(false);
  const active = preview(true);
  const model =
    platform.modelTemplates.find(
      (item) =>
        item.id === (project?.modelTemplateId ?? binding?.modelTemplateId),
    ) ??
    platform.modelTemplates.find((item) => item.deviceTemplateId === projectId);
  const variables = runtimeTemplateVariables(capabilities, binding, device);
  const duplicateNames = capabilities
    .map((item) => item.name)
    .filter((name, index, names) => name && names.indexOf(name) !== index);
  const selectedVariable = variables.some((item) => item.token === variable)
    ? variable
    : variables[0].token;
  return (
    <ProjectStepLayout className="ddc-step-page">
      <div className="ddc-step-grid">
        <section className="ddc-step-card">
          <h2>运行状态判断</h2>
          <p>使用第 2 步已配置的能力，判断设备何时处于运行中。</p>
          <label className="ddc-step-field">
            <span>运行状态能力 *</span>
            <select
              value={config.statusCapabilityId}
              onChange={(event) =>
                patch({
                  ...config,
                  statusCapabilityId: event.target.value,
                  runningStates: [],
                  endingStates: [],
                })
              }
            >
              <option value="">选择状态类能力</option>
              {capabilities
                .filter((item) => ["status", "enum"].includes(item.kind))
                .map((item) => (
                  <option key={item.capabilityId} value={item.capabilityId}>
                    {item.name} / {item.capabilityId}
                  </option>
                ))}
            </select>
          </label>
          <label className="ddc-step-field">
            <span>剩余时间能力</span>
            <select
              value={config.remainingCapabilityId}
              onChange={(event) =>
                patch({ ...config, remainingCapabilityId: event.target.value })
              }
            >
              <option value="">不使用</option>
              {capabilities
                .filter((item) => item.dataType === "number")
                .map((item) => (
                  <option key={item.capabilityId} value={item.capabilityId}>
                    {item.name} / {item.capabilityId}
                  </option>
                ))}
            </select>
          </label>
          <StateChips
            label="触发为运行中的状态值 *"
            values={config.runningStates}
            choices={choices}
            validateChoices={
              statusCapability?.kind === "enum" &&
              Boolean(statusCapability.enumValues?.length)
            }
            onChange={(values) => patch({ ...config, runningStates: values })}
          />
          <StateChips
            label="可选结束状态值"
            values={config.endingStates}
            choices={choices}
            validateChoices={
              statusCapability?.kind === "enum" &&
              Boolean(statusCapability.enumValues?.length)
            }
            onChange={(values) => patch({ ...config, endingStates: values })}
          />
          <div className="ddc-step-info">
            文本状态可手动填写实际 HA 上报值；枚举状态沿用第 2
            步的选项，失效旧值会标记。运行/结束状态不可重叠。
          </div>
        </section>
        <section className="ddc-step-card">
          <h2>浮窗文本配置</h2>
          <p>设备卡片、浮窗与 3D 场景共用此处的文本模板。</p>
          {[
            ["titleTemplate", "浮窗标题模板 *"],
            ["idleTemplate", "默认状态文本模板 *"],
            ["runningTemplate", "运行中文本模板 *"],
          ].map(([key, label]) => (
            <label className="ddc-step-field" key={key}>
              <span>{label}</span>
              <input
                ref={(node) => {
                  fieldRefs.current[key] = node;
                }}
                value={config[key] ?? ""}
                onFocus={() => setFocusedField(key)}
                onChange={(event) =>
                  patch({ ...config, [key]: event.target.value })
                }
              />
            </label>
          ))}
          <div className="ddc-step-variable">
            <select
              value={selectedVariable}
              onChange={(event) => setVariable(event.target.value)}
            >
              {variables.map(({ token, label }) => (
                <option key={token} value={token}>
                  {label} · {token}
                </option>
              ))}
            </select>
            <button type="button" onClick={insertVariable}>
              插入到当前文本
            </button>
          </div>
          {duplicateNames.length > 0 && (
            <div className="ddc-step-info">
              能力名称重复，请先改成不同名称再引用：
              {[...new Set(duplicateNames)].join("、")}
            </div>
          )}
          <div className="ddc-step-info">
            只列出设备名称、当前时间及已映射能力的状态值；HA
            属性仍可手动输入，但不占用常用变量列表。预计结束时间可插入表达式
            <code>{"{{time.now} + {剩余时间}}"}</code>；变量无值时可写
            <code>{"{剩余时间 | --}"}</code>。旧配置中的内置变量继续兼容读取。
          </div>
        </section>
      </div>
      {issues.length > 0 && (
        <div className="ddc-step-issues" role="status">
          <b>配置需要检查</b>
          {issues.map((issue) => (
            <span key={issue}>⚠ {issue}</span>
          ))}
          {overlap && <span>冲突状态不会保存。</span>}
        </div>
      )}
      <section className="ddc-step-card">
        <h2>预览效果</h2>
        <p>
          待机与运行中两个状态实时随上方配置更新，使用示例状态，不会控制真实设备。
        </p>
        <div className="ddc-step-previews">
          {[
            ["待机预览", idle],
            ["运行中预览", active],
          ].map(([label, result]) => (
            <div className="ddc-step-preview" key={label}>
              <b>{label}</b>
              <div className="ddc-step-preview-content">
                <div className="ddc-step-preview-model">
                  {model ? (
                    <ModelPreview
                      model={model}
                      compact
                      animated={label === "运行中预览"}
                    />
                  ) : (
                    <span>◇</span>
                  )}
                </div>
                <div>
                  <strong>{result.title}</strong>
                  <span>{result.text}</span>
                  <small>{result.state}</small>
                </div>
                {label === "待机预览" && <em>⏻</em>}
              </div>
            </div>
          ))}
        </div>
      </section>
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
            上一步：能力与属性映射
          </button>
          <button className="primary" onClick={() => void onNext()}>
            下一步：3D 外观 →
          </button>
        </div>
      </footer>
    </ProjectStepLayout>
  );
}
