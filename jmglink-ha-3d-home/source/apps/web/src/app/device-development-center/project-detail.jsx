import { a as React } from "../../vendor/react.js";
import ModelPreview from "./model-preview.jsx";
import ProjectCapabilities from "./project-capabilities.jsx";
import ExtraEntitySelection from "./extra-entity-selection.jsx";
import ProjectRuntime from "./project-runtime.jsx";
import ProjectAppearance from "./project-appearance.jsx";
import ProjectPanel from "./project-panel.jsx";
import ProjectTesting from "./project-testing.jsx";
import ProjectPublish from "./project-publish.jsx";
import { panelStepIssues } from "./panel-designer-model.js";
import { capabilityStepState } from "./capability-model.js";
import {
  appearanceIssues,
  runtimeDisplayIssues,
} from "./project-runtime-model.js";
import {
  addRuleToken,
  applyBasicProjectDraft,
  defaultSelectedEntityIds,
  entityTypeLabel,
  recordedEntityIds,
  DEVICE_CATEGORIES,
  PROJECT_STEPS,
  rankProjectCandidates,
  resolveProjectConnection,
} from "./project-basic.js";
import "../../styles/device-development-project.css";
import "../../styles/device-development-lifecycle.css";

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

function RuleField({ label, values, placeholder, onChange }) {
  const [input, setInput] = React.useState("");
  const add = () => {
    if (!input.trim()) return;
    onChange(addRuleToken(values, input));
    setInput("");
  };
  return (
    <label className="ddc-project-rule-field">
      <span>{label}</span>
      <div className="ddc-project-rule-box">
        {(values ?? []).map((value) => (
          <button
            type="button"
            key={value}
            className="ddc-project-rule-chip"
            onClick={() => onChange(values.filter((item) => item !== value))}
            title={`移除 ${value}`}
          >
            {value}
            <span>×</span>
          </button>
        ))}
        <input
          value={input}
          placeholder={placeholder}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === ",") {
              event.preventDefault();
              add();
            }
          }}
          onBlur={add}
        />
      </div>
    </label>
  );
}

function ProjectThumbnail({ model }) {
  return (
    <div className="ddc-project-thumbnail">
      {model ? <ModelPreview model={model} compact /> : <span>◇</span>}
    </div>
  );
}

function formatTime(value) {
  if (!value) return "尚未同步";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "尚未同步"
    : date.toLocaleString("zh-CN", { hour12: false });
}

export default function ProjectDetail({
  projectId,
  platform,
  devices,
  reload,
  notify,
  onBack,
  onExport,
  onCopy,
  onDelete,
  onOpenLibrary,
  registerFlush,
}) {
  const project = (platform?.deviceTemplates ?? []).find(
    (item) => item.id === projectId && !item.builtin,
  );
  const [draft, setDraft] = React.useState(() =>
    structuredClone(project ?? {}),
  );
  const [activeStep, setActiveStep] = React.useState("basic");
  const n4FlushRef = React.useRef(null);
  const n5FlushRef = React.useRef(null);
  const n6FlushRef = React.useRef(null);
  const n7FlushRef = React.useRef(null);
  const registerN4Flush = React.useCallback((callback) => {
    n4FlushRef.current = callback;
  }, []);
  const registerN5Flush = React.useCallback((callback) => {
    n5FlushRef.current = callback;
  }, []);
  const registerN6Flush = React.useCallback((callback) => {
    n6FlushRef.current = callback;
  }, []);
  const registerN7Flush = React.useCallback((callback) => {
    n7FlushRef.current = callback;
  }, []);
  const [revision, setRevision] = React.useState(0);
  const revisionRef = React.useRef(0);
  const savedRevisionRef = React.useRef(0);
  const saveQueueRef = React.useRef(Promise.resolve(true));
  const [saveStatus, setSaveStatus] = React.useState("saved");
  const [lastSavedAt, setLastSavedAt] = React.useState(project?.updatedAt);
  const [availableDevices, setAvailableDevices] = React.useState(devices);
  React.useEffect(() => setAvailableDevices(devices), [devices]);
  const [scanRules, setScanRules] = React.useState(() =>
    structuredClone(project?.matchRules ?? {}),
  );
  const [scanTime, setScanTime] = React.useState(null);
  const [scanning, setScanning] = React.useState(false);
  const [heroCollapsed, setHeroCollapsed] = React.useState(false);
  const [bindingBusy, setBindingBusy] = React.useState(false);
  const [entityBindingTab,setEntityBindingTab] = React.useState("own");
  const extraEntityGuardRef = React.useRef(null);
  const registerExtraEntityGuard = React.useCallback(callback=>{extraEntityGuardRef.current=callback;},[]);
  const [advanced, setAdvanced] = React.useState(false);
  const [haStatus, setHaStatus] = React.useState(null);
  const [n4Validation, setN4Validation] = React.useState(null);
  const binding = (platform?.bindings ?? []).find(
    (item) => item.deviceTemplateId === projectId,
  );
  const boundDevice = availableDevices.find(
    (item) => item.id === binding?.deviceId,
  );
  const [selectedDeviceId, setSelectedDeviceId] = React.useState(
    binding?.deviceId ?? "",
  );
  const [selectedEntityIds, setSelectedEntityIds] = React.useState(() =>
    defaultSelectedEntityIds(
      devices.find((item) => item.id === binding?.deviceId),
      binding,
    ),
  );
  const bindingRef = React.useRef(null);
  const model =
    (platform?.modelTemplates ?? []).find(
      (item) => item.id === draft.modelTemplateId,
    ) ??
    (platform?.modelTemplates ?? []).find(
      (item) => item.deviceTemplateId === projectId,
    );
  const connection = resolveProjectConnection(
    binding,
    availableDevices,
    haStatus,
  );
  const candidates = rankProjectCandidates(
    availableDevices,
    scanRules,
    binding?.deviceId,
  );
  const selectedDevice = availableDevices.find(
    (item) => item.id === selectedDeviceId,
  );
  const selectedSet = new Set(selectedEntityIds);
  const recordedIds = recordedEntityIds(binding);
  const recordedNames = recordedIds.map(
    (id) =>
      boundDevice?.entities?.find((entity) => entity.entityId === id)?.name ||
      id,
  );
  const entityListRef = React.useRef(null);
  const dragCleanupRef = React.useRef(null);
  React.useEffect(() => () => dragCleanupRef.current?.(), []);
  const invertEntity = (id) =>
    setSelectedEntityIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  const startEntityDrag = (event, id) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (event.pointerType === "mouse") event.preventDefault();
    dragCleanupRef.current?.();
    const visited = new Set([id]);
    invertEntity(id);
    let previousY = event.clientY;
    const move = (pointerEvent) => {
      if (pointerEvent.pointerId !== event.pointerId) return;
      const list = entityListRef.current;
      if (!list) return;
      const bounds = list.getBoundingClientRect();
      const low = Math.max(
        bounds.top,
        Math.min(previousY, pointerEvent.clientY),
      );
      const high = Math.min(
        bounds.bottom,
        Math.max(previousY, pointerEvent.clientY),
      );
      for (const row of list.querySelectorAll("[data-entity-id]")) {
        const rect = row.getBoundingClientRect();
        const rowId = row.dataset.entityId;
        if (
          rowId &&
          !visited.has(rowId) &&
          rect.bottom >= low &&
          rect.top <= high
        ) {
          visited.add(rowId);
          invertEntity(rowId);
        }
      }
      previousY = pointerEvent.clientY;
    };
    const finish = (pointerEvent) => {
      if (pointerEvent.pointerId === event.pointerId)
        dragCleanupRef.current?.();
    };
    dragCleanupRef.current = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", finish);
      dragCleanupRef.current = null;
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", finish);
  };
  const subtypeOptions =
    DEVICE_CATEGORIES[draft.category]?.subtypes ??
    DEVICE_CATEGORIES.generic.subtypes;
  const lastEntityUpdate = boundDevice?.entities
    ?.map((item) => item.lastUpdated)
    .filter(Boolean)
    .sort()
    .at(-1);
  const basicComplete = Boolean(
    draft.name?.trim() &&
    DEVICE_CATEGORIES[draft.category] &&
    draft.subCategory &&
    draft.manufacturer?.trim() &&
    draft.model?.trim() &&
    binding,
  );
  const n4State = n4Validation?.issues?.some(
    (item) => !item.page || item.page === "能力与属性映射",
  )
    ? "problem"
    : capabilityStepState(project?.capabilities, binding, boundDevice);
  const n5State = project?.runtimeDisplay
    ? n4Validation?.issues?.some((item) => item.page === "运行浮窗") ||
      runtimeDisplayIssues(
        project.runtimeDisplay,
        project.capabilities,
        binding,
        boundDevice,
      ).length > 0
      ? "problem"
      : "complete"
    : "unconfigured";
  const n6Model = platform?.modelTemplates?.find(
    (item) => item.id === project?.modelTemplateId,
  );
  const n6State = project?.appearance
    ? n4Validation?.issues?.some((item) => item.page === "3D 外观") ||
      appearanceIssues(project, n6Model, project.capabilities).length > 0
      ? "problem"
      : "complete"
    : "unconfigured";
  const projectPanel = platform?.controlPanels?.find(
    (item) =>
      item.id === project?.controlPanelTemplateId &&
      item.deviceTemplateId === projectId,
  );
  const n7State = projectPanel
    ? panelStepIssues(projectPanel, project?.capabilities).length > 0
      ? "problem"
      : "complete"
    : "unconfigured";

  React.useEffect(() => {
    let active = true;
    api("./api/ha/status")
      .then((status) => {
        if (active) setHaStatus(status);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  React.useEffect(() => {
    let active = true;
    api(
      `./api/device-platform/projects/${encodeURIComponent(projectId)}/capability-validation`,
    )
      .then((result) => {
        if (active) setN4Validation(result);
      })
      .catch(() => {
        if (active) setN4Validation(null);
      });
    return () => {
      active = false;
    };
  }, [projectId, platform]);

  const updateDraft = (patch) => {
    setDraft((current) => ({ ...current, ...patch }));
    revisionRef.current += 1;
    setRevision(revisionRef.current);
    setSaveStatus("dirty");
  };
  const updateRule = (key, values) =>
    updateDraft({ matchRules: { ...(draft.matchRules ?? {}), [key]: values } });
  const saveSnapshot = (snapshot, targetRevision) => {
    if (targetRevision <= savedRevisionRef.current)
      return saveQueueRef.current.catch(() => false);
    if (!snapshot.name?.trim()) {
      setSaveStatus("error");
      notify("设备名称不能为空，未保存当前更改。", "error");
      return Promise.resolve(false);
    }
    setSaveStatus("saving");
    const pending = saveQueueRef.current
      .catch(() => {})
      .then(async () => {
        if (targetRevision <= savedRevisionRef.current) return true;
        const latestPlatform = await api("./api/device-platform");
        const latestProject = latestPlatform.deviceTemplates?.find(
          (item) => item.id === projectId && !item.builtin,
        );
        if (!latestProject) throw new Error("设备项目不存在，无法保存基础信息");
        const result = await api(
          `./api/device-platform/device-templates/${encodeURIComponent(projectId)}`,
          {
            method: "PUT",
            body: JSON.stringify(
              applyBasicProjectDraft(latestProject, snapshot),
            ),
          },
        );
        savedRevisionRef.current = targetRevision;
        setLastSavedAt(result.item.updatedAt);
        await reload();
        if (revisionRef.current === targetRevision) setSaveStatus("saved");
        return true;
      });
    saveQueueRef.current = pending;
    return pending.catch((error) => {
      setSaveStatus("error");
      notify(`自动保存失败：${error.message}`, "error");
      return false;
    });
  };
  React.useEffect(() => {
    if (!revision) return undefined;
    const timer = window.setTimeout(() => {
      void saveSnapshot(draft, revision);
    }, 850);
    return () => window.clearTimeout(timer);
  }, [revision]);
  const flushBasic = () => extraEntityGuardRef.current?.() === false ? false : saveSnapshot(draft,revisionRef.current);
  React.useEffect(() => {
    registerFlush?.(() =>
      activeStep === "basic"
        ? flushBasic()
        : activeStep === "capabilities"
          ? n4FlushRef.current?.()
          : activeStep === "runtime"
            ? n5FlushRef.current?.()
            : activeStep === "appearance"
              ? n6FlushRef.current?.()
              : activeStep === "panel"
                ? n7FlushRef.current?.()
                : true,
    );
    return () => registerFlush?.(null);
  }, [draft, registerFlush, activeStep]);

  const flushActive = () =>
    activeStep === "basic"
      ? flushBasic()
      : activeStep === "capabilities"
        ? n4FlushRef.current?.()
        : activeStep === "runtime"
          ? n5FlushRef.current?.()
          : activeStep === "appearance"
            ? n6FlushRef.current?.()
            : activeStep === "panel"
              ? n7FlushRef.current?.()
              : true;
  const changeStep = async (next) => {
    if (next === activeStep) return;
    if (
      ![
        "basic",
        "capabilities",
        "runtime",
        "appearance",
        "panel",
        "testing",
        "publish",
      ].includes(next)
    ) {
      notify(
        `“${PROJECT_STEPS.find((item) => item.id === next)?.label}”将在后续节点开放。`,
        "success",
      );
      return;
    }
    const saved = await flushActive();
    if (saved !== false) setActiveStep(next);
  };

  const returnToProjects = async () => {
    const saved = await flushActive();
    if (saved !== false) onBack();
  };
  const scan = async () => {
    setScanning(true);
    try {
      await api("./api/ha/discovery/refresh", { method: "POST" });
      const [deviceResult, status] = await Promise.all([
        api("./api/device-platform/devices"),
        api("./api/ha/status"),
      ]);
      const nextDevices = deviceResult.devices ?? [];
      setAvailableDevices(nextDevices);
      setHaStatus(status);
      setScanRules(structuredClone(draft.matchRules ?? {}));
      setScanTime(new Date().toISOString());
      const current = binding?.deviceId;
      if (current) {
        setSelectedDeviceId(current);
        setSelectedEntityIds(
          defaultSelectedEntityIds(
            nextDevices.find((item) => item.id === current),
            binding,
          ),
        );
      }
      notify("识别列表已更新；原绑定保持不变，请明确选择后再绑定。", "success");
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setScanning(false);
    }
  };
  const chooseDevice = (device) => {
    setSelectedDeviceId(device.id);
    setSelectedEntityIds(
      defaultSelectedEntityIds(
        device,
        device.id === binding?.deviceId ? binding : null,
      ),
    );
  };
  const bindSelected = async () => {
    if(extraEntityGuardRef.current?.()===false)return;
    if (!selectedDevice || !selectedEntityIds.length) {
      notify("请选择 HA 设备及至少一个实体。", "error");
      return;
    }
    if (
      selectedDeviceId !== binding?.deviceId &&
      !window.confirm(
        `将“${draft.name}”绑定到“${selectedDevice.name}”？原设备绑定会解除，能力映射需在下一步重新核对。`,
      )
    )
      return;
    setBindingBusy(true);
    try {
      const saved = await saveSnapshot(draft, revisionRef.current);
      if (saved === false) return;
      await api(
        `./api/device-platform/projects/${encodeURIComponent(projectId)}/rebind`,
        {
          method: "POST",
          body: JSON.stringify({
            deviceId: selectedDeviceId,
            selectedEntityIds,
          }),
        },
      );
      await reload();
      notify(
        `已绑定“${selectedDevice.name}”及 ${selectedEntityIds.length} 个实体。`,
        "success",
      );
      setActiveStep("capabilities");
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setBindingBusy(false);
    }
  };
  const exportProject = async () => {
    const saved = await flushActive();
    if (saved !== false) onExport({ ...draft, name: draft.name });
  };
  const copyProject = async () => {
    const saved = await flushActive();
    if (saved !== false) onCopy(draft);
  };
  const deleteProject = async () => {
    const saved = await flushActive();
    if (saved !== false) onDelete(draft);
  };

  if (!project)
    return (
      <div className="ddc-next-empty">
        <b>项目不存在或已被删除</b>
        <button onClick={onBack}>返回设备项目</button>
      </div>
    );
  return (
    <div className="ddc-project-detail">
      <div className="ddc-project-chrome">
      <button className="ddc-project-back" onClick={returnToProjects}>
        ← 返回设备项目
      </button>
      <header className={`ddc-project-hero ${heroCollapsed ? "collapsed" : ""}`}>
        <button className="ddc-hero-collapse" aria-expanded={!heroCollapsed} onClick={() => setHeroCollapsed(!heroCollapsed)}>{heroCollapsed ? "展开项目信息 ⌄" : "收起项目信息 ⌃"}</button>
        <ProjectThumbnail model={model} />
        <div className="ddc-project-identity">
          <div className="ddc-project-title-row">
            <h1>{draft.name || projectId}</h1>
            <span className={`ddc-project-status ${connection.severity}`}>
              ● {connection.label}
            </span>
          </div>
          <p>
            {draft.manufacturer || "未设置厂商"} · {draft.model || "未设置型号"}
          </p>
          <div className="ddc-project-meta">
            <span>项目 ID　{projectId}</span>
            <span>最后同步　{formatTime(lastEntityUpdate || lastSavedAt)}</span>
            <span>
              关联实体　
              {recordedIds.length + (binding?.extraEntityIds?.length ?? 0)} 个{binding?.extraEntityIds?.length ? `（额外 ${binding.extraEntityIds.length} 个）` : ""}
            </span>
          </div>
        </div>
        <div className="ddc-project-hero-actions">
          <div>
            <span className={`ddc-project-save-status ${saveStatus}`}>
              ●{" "}
              {
                {
                  saved: "已自动保存",
                  saving: "自动保存中…",
                  dirty: "待保存",
                  error: "保存失败",
                }[saveStatus]
              }
            </span>
            <button
              onClick={exportProject}
              title="导出当前项目包，不包含 HA 凭据和绑定"
            >
              ⇩ 导出设备包
            </button>
            <details className="ddc-project-more">
              <summary aria-label="更多操作">•••</summary>
              <div>
                <button onClick={copyProject}>复制项目</button>
                <button className="danger" onClick={deleteProject}>
                  删除项目
                </button>
              </div>
            </details>
          </div>
          <button
            className="primary"
            onClick={() => {
              if (activeStep !== "basic") void changeStep("basic");
              else
                bindingRef.current?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
            }}
          >
            ◎ 打开设备
          </button>
        </div>
      </header>
      <nav className="ddc-project-steps" aria-label="项目开发步骤">
        {PROJECT_STEPS.map((step, index) => (
          <button
            key={step.id}
            className={`${activeStep === step.id ? "active" : ""} ${(index === 0 && basicComplete) || (index === 1 && n4State === "complete") || (index === 2 && n5State === "complete") || (index === 3 && n6State === "complete") || (index === 4 && n7State === "complete") ? "complete" : ""} ${(index === 1 && n4State === "problem") || (index === 2 && n5State === "problem") || (index === 3 && n6State === "problem") || (index === 4 && n7State === "problem") ? "problem" : ""}`}
            onClick={() => void changeStep(step.id)}
          >
            <span>
              {(index === 0 && basicComplete) ||
              (index === 1 && n4State === "complete") ||
              (index === 2 && n5State === "complete") ||
              (index === 3 && n6State === "complete") ||
              (index === 4 && n7State === "complete")
                ? "✓"
                : (index === 1 && n4State === "problem") ||
                    (index === 2 && n5State === "problem") ||
                    (index === 3 && n6State === "problem") ||
                    (index === 4 && n7State === "problem")
                  ? "!"
                  : index + 1}
            </span>
            {step.label}
          </button>
        ))}
      </nav>
      </div>
      <div className="ddc-project-workspace" key={activeStep}>
      {activeStep === "capabilities" ? (
        <ProjectCapabilities
          projectId={projectId}
          platform={platform}
          devices={availableDevices}
          reload={reload}
          notify={notify}
          validation={n4Validation}
          haStatus={haStatus}
          registerFlush={registerN4Flush}
          onPrevious={() => changeStep("basic")}
          onNext={() => changeStep("runtime")}
        />
      ) : activeStep === "runtime" ? (
        <ProjectRuntime
          projectId={projectId}
          platform={platform}
          devices={availableDevices}
          reload={reload}
          notify={notify}
          registerFlush={registerN5Flush}
          onPrevious={() => changeStep("capabilities")}
          onNext={() => changeStep("appearance")}
        />
      ) : activeStep === "appearance" ? (
        <ProjectAppearance
          projectId={projectId}
          platform={platform}
          devices={availableDevices}
          reload={reload}
          notify={notify}
          registerFlush={registerN6Flush}
          onPrevious={() => changeStep("runtime")}
          onNext={() => changeStep("panel")}
          onOpenLibrary={onOpenLibrary}
        />
      ) : activeStep === "panel" ? (
        <ProjectPanel
          projectId={projectId}
          platform={platform}
          devices={availableDevices}
          reload={reload}
          notify={notify}
          registerFlush={registerN7Flush}
          onPrevious={() => changeStep("appearance")}
          onNext={() => changeStep("testing")}
        />
      ) : activeStep === "testing" ? (
        <ProjectTesting
          projectId={projectId}
          platform={platform}
          notify={notify}
          onPrevious={() => changeStep("panel")}
          onNext={() => changeStep("publish")}
        />
      ) : activeStep === "publish" ? (
        <ProjectPublish
          projectId={projectId}
          platform={platform}
          notify={notify}
          onPrevious={() => changeStep("testing")}
          onExport={onExport}
        />
      ) : (
        <>
          {connection.id === "missing" && (
            <div className="ddc-project-alert error">
              <b>原绑定 Home Assistant 设备已不存在，请重新选择设备。</b>
              <div>
                <button
                  onClick={() =>
                    bindingRef.current?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    })
                  }
                >
                  重新绑定设备
                </button>
                <button
                  onClick={() =>
                    notify("已保留当前项目与全部配置。", "success")
                  }
                >
                  保留当前项目
                </button>
              </div>
            </div>
          )}
          {connection.id === "offline" && (
            <div className="ddc-project-alert warning">
              HA 设备当前离线，项目配置和原绑定均已保留；恢复连接后可继续使用。
            </div>
          )}
          <div className="ddc-project-panels">
            <section className="ddc-project-panel">
              <div className="ddc-project-panel-heading">
                <span>▣</span>
                <div>
                  <h2>基本信息</h2>
                  <p>编辑设备的核心信息，用于项目管理和设备识别。</p>
                </div>
              </div>
              <div className="ddc-project-form-grid">
                <label>
                  <span>设备名称 *</span>
                  <input
                    value={draft.name ?? ""}
                    onChange={(event) =>
                      updateDraft({ name: event.target.value })
                    }
                    placeholder="输入设备名称"
                  />
                </label>
                <label>
                  <span>设备类型 *</span>
                  <select
                    value={
                      DEVICE_CATEGORIES[draft.category]
                        ? draft.category
                        : "generic"
                    }
                    onChange={(event) =>
                      updateDraft({
                        category: event.target.value,
                        subCategory: "",
                      })
                    }
                  >
                    {Object.entries(DEVICE_CATEGORIES).map(([id, value]) => (
                      <option value={id} key={id}>
                        {value.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>设备子类型 *</span>
                  <select
                    value={draft.subCategory ?? ""}
                    onChange={(event) =>
                      updateDraft({ subCategory: event.target.value })
                    }
                  >
                    <option value="">请选择子类型</option>
                    {subtypeOptions.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>厂商 *</span>
                  <input
                    value={draft.manufacturer ?? ""}
                    onChange={(event) =>
                      updateDraft({ manufacturer: event.target.value })
                    }
                    placeholder="例如：Midea"
                  />
                </label>
                <label>
                  <span>型号 *</span>
                  <input
                    value={draft.model ?? ""}
                    onChange={(event) =>
                      updateDraft({ model: event.target.value })
                    }
                    placeholder="例如：TB12U2"
                  />
                </label>
                <div className="ddc-project-model-tile">
                  <ProjectThumbnail model={model} />
                  <div>
                    <b>项目预览</b>
                    <span>{model?.name ?? "尚未选择 3D 模型"}</span>
                    <small>
                      直接使用已配置模型的缩略图，无需单独上传设备图标。
                    </small>
                  </div>
                </div>
              </div>
            </section>
            <section className="ddc-project-panel">
              <div className="ddc-project-panel-heading">
                <span>▤</span>
                <div>
                  <h2>设备识别规则</h2>
                  <p>
                    按名称、厂商和型号等条件匹配 HA
                    设备；修改规则不会自动更换绑定。
                  </p>
                </div>
              </div>
              <RuleField
                label="名称关键词"
                values={draft.matchRules?.names}
                placeholder="输入关键词后按回车添加"
                onChange={(values) => updateRule("names", values)}
              />
              <div className="ddc-project-rule-columns">
                <RuleField
                  label="厂商"
                  values={draft.matchRules?.manufacturers}
                  placeholder="输入厂商后按回车"
                  onChange={(values) => updateRule("manufacturers", values)}
                />
                <RuleField
                  label="型号"
                  values={draft.matchRules?.models}
                  placeholder="输入型号后按回车"
                  onChange={(values) => updateRule("models", values)}
                />
              </div>
              <button
                className="ddc-project-advanced"
                onClick={() => setAdvanced((value) => !value)}
              >
                {advanced ? "▾" : "▸"} 高级条件（可选）
              </button>
              {advanced && (
                <div className="ddc-project-advanced-fields">
                  <RuleField
                    label="其他关键词"
                    values={draft.matchRules?.keywords}
                    placeholder="名称、实体名等"
                    onChange={(values) => updateRule("keywords", values)}
                  />
                  <RuleField
                    label="集成来源"
                    values={draft.matchRules?.integrations}
                    placeholder="例如：mqtt"
                    onChange={(values) => updateRule("integrations", values)}
                  />
                  <RuleField
                    label="实体域"
                    values={draft.matchRules?.entityDomains}
                    placeholder="例如：switch"
                    onChange={(values) => updateRule("entityDomains", values)}
                  />
                  <RuleField
                    label="设备类别"
                    values={draft.matchRules?.deviceClasses}
                    placeholder="例如：temperature"
                    onChange={(values) => updateRule("deviceClasses", values)}
                  />
                </div>
              )}
              <div className="ddc-project-scan-actions">
                <small>
                  {scanTime
                    ? `上次扫描：${formatTime(scanTime)}`
                    : "当前为打开项目时的匹配结果"}
                </small>
                <button className="primary" disabled={scanning} onClick={scan}>
                  ⟳ {scanning ? "正在更新…" : "更新识别绑定列表"}
                </button>
              </div>
            </section>
          </div>
          <section
            className="ddc-project-panel ddc-project-binding"
            ref={bindingRef}
          >
            <div className="ddc-project-panel-heading">
              <span>♧</span>
              <div>
                <h2>HA 设备实体绑定选择</h2>
                <p>
                  根据识别规则查看候选设备；选择设备及实体后点击绑定，原绑定不会被自动替换。
                </p>
              </div>
              <div
                className="ddc-project-recorded-entities"
                title={recordedNames.join("、")}
              >
                <strong>已绑定实体（{recordedIds.length}）</strong>
                <small>
                  {recordedNames.length
                    ? recordedNames.slice(0, 4).join("、") +
                      (recordedNames.length > 4
                        ? ` 等 ${recordedNames.length} 个`
                        : "")
                    : "尚未绑定实体"}
                </small>
              </div>
            </div>
            <div className="ddc-entity-binding-tabs"><button className={entityBindingTab==="own"?"active":""} onClick={()=>setEntityBindingTab("own")}>设备自身实体（{recordedIds.length}）</button><button className={entityBindingTab==="extra"?"active":""} onClick={()=>setEntityBindingTab("extra")}>额外关联实体（{binding?.extraEntityIds?.length ?? 0}）</button></div>
            <div hidden={entityBindingTab!=="extra"}>
              <ExtraEntitySelection projectId={projectId} binding={binding} devices={availableDevices} onBeforeSave={()=>saveSnapshot(draft,revisionRef.current)} reload={reload} notify={notify} registerGuard={registerExtraEntityGuard}/>
            </div>
            <div className="ddc-project-binding-grid" style={entityBindingTab!=="own"?{display:"none"}:undefined}>
              <div className="ddc-project-candidates">
                <h3>匹配到的设备（{candidates.length} 个）</h3>
                <div className="ddc-project-candidate-head">
                  <span>设备名称</span>
                  <span>集成来源</span>
                  <span>厂商 / 型号</span>
                  <span>实体数量</span>
                  <span>匹配状态</span>
                </div>
                {candidates.length ? (
                  candidates.map((device) => (
                    <label
                      key={device.id}
                      className={
                        selectedDeviceId === device.id ? "selected" : ""
                      }
                    >
                      <input
                        type="radio"
                        name="ddc-project-device"
                        checked={selectedDeviceId === device.id}
                        onChange={() => chooseDevice(device)}
                      />
                      <b>{device.name}</b>
                      <span>{device.integration || "Home Assistant"}</span>
                      <span>
                        {device.manufacturer || "未知"} /{" "}
                        {device.model || "未知"}
                      </span>
                      <span>{device.entities?.length ?? 0} 个</span>
                      <em
                        className={
                          device.projectBound
                            ? "bound"
                            : device.projectMatched
                              ? "matched"
                              : ""
                        }
                      >
                        {device.projectMatchLabel}
                      </em>
                    </label>
                  ))
                ) : (
                  <p className="ddc-project-no-results">
                    暂无匹配设备。可调整规则后点击“更新识别绑定列表”，或保留当前项目。
                  </p>
                )}
              </div>
              <div className="ddc-project-entities">
                <div className="ddc-project-entities-heading">
                  <div>
                    <h3>
                      {selectedDevice
                        ? `已选设备：${selectedDevice.name}`
                        : "请选择设备"}
                    </h3>
                    <small>
                      {selectedDevice
                        ? `${selectedEntityIds.length} / ${selectedDevice.entities?.length ?? 0} 个实体已选择`
                        : "选择左侧候选设备后显示实体"}
                    </small>
                  </div>
                  {selectedDevice && (
                    <div className="ddc-project-entity-tools">
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedEntityIds(
                            (selectedDevice.entities ?? []).map(
                              (entity) => entity.entityId,
                            ),
                          )
                        }
                      >
                        全选
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedEntityIds([])}
                      >
                        全不选
                      </button>
                    </div>
                  )}
                </div>
                {selectedDevice && (
                  <div className="ddc-project-entity-list" ref={entityListRef}>
                    <div className="ddc-project-entity-head">
                      <span></span>
                      <span>实体 ID</span>
                      <span>实体名称</span>
                      <span>类型</span>
                      <span>当前状态</span>
                    </div>
                    {selectedDevice.entities?.map((entity) => (
                      <div
                        key={entity.entityId}
                        data-entity-id={entity.entityId}
                        role="checkbox"
                        aria-checked={selectedSet.has(entity.entityId)}
                        tabIndex={0}
                        onPointerDown={(event) =>
                          startEntityDrag(event, entity.entityId)
                        }
                        onKeyDown={(event) => {
                          if (event.key === " " || event.key === "Enter") {
                            event.preventDefault();
                            invertEntity(entity.entityId);
                          }
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedSet.has(entity.entityId)}
                          readOnly
                          tabIndex={-1}
                          aria-hidden="true"
                        />
                        <code title={entity.entityId}>{entity.entityId}</code>
                        <span>{entity.name}</span>
                        <span title={entity.domain}>
                          {entityTypeLabel(entity.domain)}
                        </span>
                        <span>{entity.historical ? "离线" : entity.state}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="ddc-project-bind-actions">
                  <small>
                    {binding
                      ? `当前绑定：${binding.deviceId}`
                      : "尚未绑定 HA 设备"}
                  </small>
                  <button
                    className="primary"
                    disabled={
                      bindingBusy ||
                      !selectedDevice ||
                      !selectedEntityIds.length
                    }
                    onClick={bindSelected}
                  >
                    {bindingBusy ? "正在绑定…" : "绑定此设备及所选实体"}
                  </button>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
      </div>
    </div>
  );
}
