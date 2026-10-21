import { effectiveControl } from "../../../../../packages/schema/src/control-library.js";
import ControlProperties from "../../components/control-properties.jsx";
import {
  builtinControls,
  attachLibraryControl,
  builtinControlId,
  librarySupportsCapability,
} from "../../../../../packages/schema/src/control-library.js";
import DevicePanel from "../../components/device-panel.jsx";
import {
  samplePanelStates,
  boundPanelStates,
} from "../../domain/device-panel.js";
import ProjectStepLayout from "./project-step-layout.jsx";
import { a as React } from "../../vendor/react.js";
import {
  PANEL_COMPONENTS,
  PANEL_CONTROL_VARIANTS,
  compatiblePanelCapabilities,
  createPanelControl,
  panelComponent,
  panelControlVariant,
  panelControlIssues,
  panelDisplayOptions,
  panelDropCell,
  panelStepIssues,
  placePanelControl,
  recommendedPanelComponents,
  unusedPanelCapabilities,
} from "./panel-designer-model.js";
import "../../styles/device-development-panel.css";

async function saveProjectPanel(projectId, panel) {
  const response = await fetch(
    `./api/device-platform/projects/${encodeURIComponent(projectId)}/control-panel`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ panel }),
    },
  );
  const body = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(body.error || `保存失败：${response.status}`);
  return body;
}

export default function ProjectPanel({
  projectId,
  platform,
  devices = [],
  reload,
  notify,
  registerFlush,
  onPrevious,
  onNext,
}) {
  const project = platform.deviceTemplates.find(
    (item) => item.id === projectId,
  );
  const initial = platform.controlPanels.find(
    (item) =>
      item.id === project?.controlPanelTemplateId &&
      item.deviceTemplateId === projectId,
  );
  const [draft, setDraft] = React.useState(() =>
    structuredClone(
      initial ?? {
        name: `${project?.name ?? "设备"}控制面板`,
        layoutMode: "grid",
        sections: [{ id: "main", title: "设备控制", controls: [] }],
      },
    ),
  );
  const draftRef = React.useRef(draft);
  const historyRef = React.useRef([]);
  const futureRef = React.useRef([]);
  const [historyCount, setHistoryCount] = React.useState(0);
  const [futureCount, setFutureCount] = React.useState(0);
  const [selectedId, setSelectedId] = React.useState("");
  const [expandedCapabilityId, setExpandedCapabilityId] = React.useState("");
  const [preview, setPreview] = React.useState(false);
  const [libraryQuery, setLibraryQuery] = React.useState("");
  const library = (platform.controlLibrary ?? builtinControls()).filter(
    (item) => item.enabled,
  );
  const libraryChoices = library.filter((item) =>
    `${item.name} ${item.type} ${item.dataTypes.join(" ")}`
      .toLowerCase()
      .includes(libraryQuery.toLowerCase()),
  );
  const [previewSource, setPreviewSource] = React.useState("sample");
  const [sampleValues, setSampleValues] = React.useState({});
  const [revision, setRevision] = React.useState(0);
  const revisionRef = React.useRef(0);
  const savedRef = React.useRef(0);
  const queueRef = React.useRef(Promise.resolve(true));
  const [saveState, setSaveState] = React.useState("saved");
  const gridRef = React.useRef(null);
  const binding = platform.bindings.find(
    (item) => item.deviceTemplateId === projectId,
  );
  const device = devices.find((item) => item.id === binding?.deviceId);
  const capabilities = (project?.capabilities ?? []).map((capability) => {
    const entityId =
      binding?.capabilityMappings?.[capability.capabilityId]?.entityId ??
      binding?.capabilityBindings?.[capability.capabilityId]?.[0];
    const entity = device?.entities?.find((item) => item.entityId === entityId);
    return { ...capability, stateLabels: entity?.stateLabels };
  });
  const mappedCapabilityIds = new Set(
    capabilities
      .filter(
        (item) =>
          binding?.capabilityMappings?.[item.capabilityId]?.entityId ||
          binding?.capabilityBindings?.[item.capabilityId]?.length,
      )
      .map((item) => item.capabilityId),
  );
  const controls = draft.sections?.[0]?.controls ?? [];
  const selectedRaw = controls.find((item) => item.id === selectedId);
  const selected = selectedRaw ? effectiveControl(selectedRaw) : undefined;
  const selectedCapability = capabilities.find(
    (item) => item.capabilityId === selected?.capabilityId,
  );
  const unusedCapabilities = unusedPanelCapabilities(
    capabilities,
    controls,
    mappedCapabilityIds,
  );
  const issues = panelStepIssues(draft, capabilities);

  const commit = (next, record = true) => {
    if (record) {
      historyRef.current = [
        ...historyRef.current.slice(-39),
        structuredClone(draftRef.current),
      ];
      futureRef.current = [];
      setHistoryCount(historyRef.current.length);
      setFutureCount(0);
    }
    draftRef.current = next;
    setDraft(next);
    revisionRef.current += 1;
    setRevision(revisionRef.current);
    setSaveState("dirty");
  };
  const replaceControls = (nextControls) =>
    commit({
      ...draftRef.current,
      sections: [
        {
          ...draftRef.current.sections[0],
          controls: nextControls,
        },
      ],
    });
  const patchControl = (changes) =>
    replaceControls(
      draftRef.current.sections[0].controls.map((item) =>
        item.id === selectedId ? { ...item, ...changes } : item,
      ),
    );
  const addControl = (
    type,
    x = 0,
    y = 0,
    capabilityId = "",
    variant = "",
    definition,
  ) => {
    const id = `control-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    let control = createPanelControl(type, id);
    const capability = capabilities.find(
      (item) => item.capabilityId === capabilityId,
    );
    if (capability) {
      control.capabilityId = capabilityId;
      control.label = capability.name;
    }
    if (variant) {
      if (type === "select") control.selectStyle = variant;
      else control.variant = variant;
    }
    const libraryItem =
      definition ||
      library.find((item) => item.id === builtinControlId(control)) ||
      library.find(
        (item) => item.type === type && (!variant || item.variant === variant),
      );
    if (!libraryItem) {
      notify("该控件已从控件库移除或停用。", "error");
      return;
    }
    control = attachLibraryControl(control, libraryItem);
    control.grid.w = libraryItem.width;
    replaceControls(
      placePanelControl(draftRef.current.sections[0].controls, control, x, y),
    );
    setSelectedId(id);
  };
  const dropOnCanvas = (event) => {
    event.preventDefault();
    if (preview) return;
    const bounds = gridRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const style = window.getComputedStyle(gridRef.current);
    const { x, y } = panelDropCell(
      event.clientX,
      event.clientY,
      bounds,
      style.gridTemplateRows
        .split(/\s+/)
        .map(Number.parseFloat)
        .filter(Number.isFinite),
      Number.parseFloat(style.rowGap) || 8,
    );
    const controlId = event.dataTransfer.getData(
      "application/x-ddc-control-id",
    );
    const type = event.dataTransfer.getData("application/x-ddc-control-type");
    const libraryId = event.dataTransfer.getData(
      "application/x-ha3d-library-control",
    );
    const capabilityId = event.dataTransfer.getData(
      "application/x-ddc-capability-id",
    );
    const variant = event.dataTransfer.getData(
      "application/x-ddc-control-variant",
    );
    if (controlId) {
      const control = draftRef.current.sections[0].controls.find(
        (item) => item.id === controlId,
      );
      if (control)
        replaceControls(
          placePanelControl(
            draftRef.current.sections[0].controls,
            control,
            x,
            y,
          ),
        );
    } else if (panelComponent(type))
      addControl(
        type,
        x,
        y,
        capabilityId,
        variant,
        libraryId ? library.find((item) => item.id === libraryId) : undefined,
      );
  };
  const undo = () => {
    const previous = historyRef.current.pop();
    if (!previous) return;
    futureRef.current.push(structuredClone(draftRef.current));
    setHistoryCount(historyRef.current.length);
    setFutureCount(futureRef.current.length);
    commit(previous, false);
  };
  const redo = () => {
    const next = futureRef.current.pop();
    if (!next) return;
    historyRef.current.push(structuredClone(draftRef.current));
    setHistoryCount(historyRef.current.length);
    setFutureCount(futureRef.current.length);
    commit(next, false);
  };
  React.useEffect(() => {
    const handle = (event) => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "z")
        return;
      if (
        ["INPUT", "TEXTAREA", "SELECT"].includes(
          document.activeElement?.tagName,
        )
      )
        return;
      event.preventDefault();
      if (event.shiftKey) redo();
      else undo();
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  });
  const save = (target = revisionRef.current) => {
    if (target <= savedRef.current) return queueRef.current.catch(() => false);
    const snapshot = structuredClone(draftRef.current);
    setSaveState("saving");
    const pending = queueRef.current
      .catch(() => {})
      .then(async () => {
        if (target <= savedRef.current) return true;
        await saveProjectPanel(projectId, snapshot);
        savedRef.current = target;
        await reload();
        if (revisionRef.current === target) setSaveState("saved");
        return true;
      });
    queueRef.current = pending;
    return pending.catch((error) => {
      setSaveState("error");
      notify(`控制面板保存失败：${error.message}`, "error");
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
  const updateOption = (value, changes) => {
    const existing = selected.optionOverrides ?? [];
    const old = existing.find((item) => item.value === value);
    patchControl({
      optionOverrides: [
        ...existing.filter((item) => item.value !== value),
        {
          value,
          label: old?.label ?? "",
          hidden: old?.hidden ?? false,
          order:
            old?.order ??
            panelDisplayOptions(selectedCapability).findIndex(
              (item) => item.value === value,
            ),
          ...changes,
        },
      ],
    });
  };
  const moveOption = (value, direction) => {
    const ordered = panelDisplayOptions(
      selectedCapability,
      selected.optionOverrides,
    );
    const index = ordered.findIndex((item) => item.value === value);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= ordered.length) return;
    [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
    patchControl({
      optionOverrides: ordered.map((item, order) => {
        const previous = selected.optionOverrides?.find(
          (override) => override.value === item.value,
        );
        return {
          value: item.value,
          label: previous?.label ?? "",
          hidden: previous?.hidden === true,
          order,
        };
      }),
    });
  };
  return (
    <ProjectStepLayout className="ddc-panel-page">
      <header className="ddc-panel-heading">
        <div>
          <h2>控制面板配置</h2>
          <p>
            拖拽组件到画布；能力绑定来自第 2 步。预览只用模拟值，不向 HA
            发送指令。
          </p>
        </div>
        <div>
          <button type="button" onClick={() => setPreview((value) => !value)}>
            {preview ? "退出预览" : "◉ 预览"}
          </button>
          <select
            aria-label="预览数据来源"
            value={previewSource}
            onChange={(event) => setPreviewSource(event.target.value)}
          >
            <option value="sample">示例状态</option>
            <option value="live">真实状态（只读）</option>
          </select>
          <button
            className="primary"
            type="button"
            onClick={async () => {
              if ((await save()) !== false) onNext?.();
            }}
          >
            保存并下一步 →
          </button>
        </div>
      </header>
      <div className="ddc-panel-columns">
        <section className="ddc-panel-library">
          <h3>控件库</h3>
          <p>选择或拖入库内控件，保存版本快照。可在左侧“控件资源库”管理。</p>
          <input
            className="cl-palette-search"
            aria-label="搜索可用控件"
            placeholder="搜索控件名称或类型"
            value={libraryQuery}
            onChange={(e) => setLibraryQuery(e.target.value)}
          />
          <div className="cl-palette-options">
            {libraryChoices.map((item) => (
              <button
                key={item.id}
                type="button"
                draggable={!preview}
                disabled={preview}
                onDragStart={(event) => {
                  event.dataTransfer.setData(
                    "application/x-ddc-control-type",
                    item.type,
                  );
                  event.dataTransfer.setData(
                    "application/x-ddc-control-variant",
                    item.variant,
                  );
                  event.dataTransfer.setData(
                    "application/x-ha3d-library-control",
                    item.id,
                  );
                }}
                onClick={() =>
                  addControl(
                    item.type,
                    0,
                    controls.length
                      ? Math.max(...controls.map((c) => c.grid.y)) + 1
                      : 0,
                    "",
                    item.variant,
                    item,
                  )
                }
              >
                <span>
                  {item.icon} {item.name}
                </span>
                <small>v{item.version}</small>
              </button>
            ))}
            {!libraryChoices.length && <small>没有可用控件</small>}
          </div>
          <div className="ddc-panel-unused">
            <h3>待使用实体（{unusedCapabilities.length}）</h3>
            <p>第 2 步已映射但尚未用于面板的实体，展开可选推荐控件。</p>
            {unusedCapabilities.length ? (
              unusedCapabilities.map((capability) => (
                <div
                  key={capability.capabilityId}
                  className="ddc-panel-unused-item"
                >
                  <button
                    type="button"
                    className="ddc-panel-unused-trigger"
                    onClick={() =>
                      setExpandedCapabilityId((id) =>
                        id === capability.capabilityId
                          ? ""
                          : capability.capabilityId,
                      )
                    }
                    aria-expanded={
                      expandedCapabilityId === capability.capabilityId
                    }
                  >
                    <strong>{capability.name}</strong>
                    <small>
                      {capability.capabilityId} ·{" "}
                      {capability.dataType || capability.kind}
                    </small>
                    <span>⌄</span>
                  </button>
                  {expandedCapabilityId === capability.capabilityId && (
                    <div className="ddc-panel-recommendations">
                      <small>拖拽或点击创建常用控件</small>
                      {recommendedPanelComponents(capability)
                        .filter((type) =>
                          library.some((item) => item.type === type),
                        )
                        .map((type) => {
                          const item = panelComponent(type);
                          return (
                            <button
                              key={type}
                              type="button"
                              draggable={!preview}
                              disabled={preview}
                              onDragStart={(event) => {
                                event.dataTransfer.setData(
                                  "application/x-ddc-control-type",
                                  type,
                                );
                                event.dataTransfer.setData(
                                  "application/x-ddc-capability-id",
                                  capability.capabilityId,
                                );
                              }}
                              onClick={() =>
                                addControl(
                                  type,
                                  0,
                                  controls.length
                                    ? Math.max(
                                        ...controls.map(
                                          (control) => control.grid.y,
                                        ),
                                      ) + 1
                                    : 0,
                                  capability.capabilityId,
                                )
                              }
                            >
                              <b>{item.icon}</b>
                              {item.label}
                            </button>
                          );
                        })}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <small>所有已配置能力都已添加到面板。</small>
            )}
          </div>
        </section>
        <section className="ddc-panel-workspace">
          <div className="ddc-panel-selected-styles">
            <h3>当前选中控件的样式</h3>
            <p>仅展示所选控件的外形；不会改变固定的半透明面板主题。</p>
            {selected && (
              <small>
                控件：{panelComponent(selected.type)?.label} · {selected.label}
              </small>
            )}
            {selected && (
              <p className="cl-current-version">
                已使用：{selected.libraryDefinition?.name || "内置控件"} · v
                {selected.libraryControlVersion || 1}（版本固定）
              </p>
            )}
            {selected && !preview ? (
              <div className="cl-library-shapes">
                {library
                  .filter((item) => item.type === selected.type)
                  .map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={
                        (selected.libraryControlId ||
                          builtinControlId(selected)) === item.id
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        patchControl(attachLibraryControl(selected, item))
                      }
                    >
                      {item.icon} {item.name} · v{item.version}
                    </button>
                  ))}
              </div>
            ) : (
              <small>
                {preview
                  ? "退出预览后可切换库内控件。"
                  : "选择控件后可应用其他库内风格。"}
              </small>
            )}
          </div>
          <header>
            <div>
              <h3>面板画布 / 显示效果</h3>
              <p>
                拖拽控件到此处构建设备面板；选中后在右侧配置。四列网格自动吸附。
              </p>
            </div>
            <div>
              <button disabled={!historyCount} onClick={undo}>
                ↶ 撤销
              </button>
              <button disabled={!futureCount} onClick={redo}>
                ↷ 重做
              </button>
              <button
                className="danger"
                disabled={!controls.length}
                onClick={() => {
                  if (window.confirm("清空当前画布？可使用撤销恢复。")) {
                    replaceControls([]);
                    setSelectedId("");
                  }
                }}
              >
                清空画布
              </button>
            </div>
          </header>
          <div
            className="ddc-panel-canvas"
            onDragOver={(event) => event.preventDefault()}
            onDrop={dropOnCanvas}
          >
            <div className="ddc-panel-device-title">
              <b>{project?.name ?? "设备"}</b>
              <small>
                {preview ? "模拟预览 · 不控制真实设备" : "选择组件后在右侧配置"}
              </small>
            </div>
            <DevicePanel
              panel={draft}
              states={
                previewSource === "live"
                  ? boundPanelStates(project, binding, device?.entities || [])
                  : samplePanelStates(capabilities, sampleValues)
              }
              interactive={preview && previewSource === "sample"}
              onAction={(id, value) =>
                setSampleValues((current) => ({ ...current, [id]: value }))
              }
              editing={!preview}
              selectedId={selectedId}
              onSelect={setSelectedId}
              gridRef={gridRef}
              onDragStart={(event, control) =>
                event.dataTransfer.setData(
                  "application/x-ddc-control-id",
                  control.id,
                )
              }
              warnings={Object.fromEntries(
                controls.map((control) => [
                  control.id,
                  panelControlIssues(control, capabilities)[0],
                ]),
              )}
            />
            {!controls.length && (
              <div className="ddc-panel-drop-hint">
                拖入左侧组件，开始设计控制面板
              </div>
            )}
          </div>
        </section>
        <section className="ddc-panel-inspector">
          <h3>控件配置</h3>
          {preview ? (
            <p>
              当前为模拟预览：控件使用与真实面板相同的外观，操作只更新本地模拟状态。
            </p>
          ) : !selected ? (
            <p>选择画布中的组件，编辑属性与能力绑定。</p>
          ) : (
            <>
              <button
                className="danger ddc-panel-delete"
                onClick={() => {
                  replaceControls(
                    controls.filter((item) => item.id !== selected.id),
                  );
                  setSelectedId("");
                }}
              >
                删除组件
              </button>
              <label>
                组件类型
                <select
                  value={selected.type}
                  onChange={(event) => {
                    const definition = library.find(
                      (item) => item.type === event.target.value,
                    );
                    if (!definition) return;
                    patchControl(
                      attachLibraryControl(
                        {
                          ...createPanelControl(
                            event.target.value,
                            selected.id,
                          ),
                          grid: selected.grid,
                        },
                        definition,
                      ),
                    );
                  }}
                >
                  {!library.some((item) => item.type === selected.type) && (
                    <option value={selected.type}>
                      {panelComponent(selected.type)?.label}（库中已移除）
                    </option>
                  )}
                  {PANEL_COMPONENTS.filter((item) =>
                    library.some((definition) => definition.type === item.type),
                  ).map((item) => (
                    <option key={item.type} value={item.type}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              <ControlProperties
                definition={selected.libraryDefinition}
                control={selected}
                onChange={(key, value) =>
                  patchControl({ props: { ...selected.props, [key]: value } })
                }
              />
              {selected.type !== "divider" && selected.type !== "container" && (
                <label>
                  绑定能力
                  <select
                    value={selected.capabilityId || ""}
                    onChange={(event) =>
                      patchControl({ capabilityId: event.target.value })
                    }
                  >
                    <option value="">不绑定</option>
                    {selected.capabilityId &&
                      !capabilities.some(
                        (item) => item.capabilityId === selected.capabilityId,
                      ) && (
                        <option value={selected.capabilityId}>
                          ⚠ 原能力已删除
                        </option>
                      )}
                    {(selected.libraryDefinition
                      ? capabilities
                      : compatiblePanelCapabilities(selected.type, capabilities)
                    )
                      .filter((item) =>
                        librarySupportsCapability(
                          selected.libraryDefinition,
                          item,
                        ),
                      )
                      .map((item) => (
                        <option
                          key={item.capabilityId}
                          value={item.capabilityId}
                        >
                          {item.name} · {item.capabilityId}
                        </option>
                      ))}
                  </select>
                </label>
              )}
              {panelControlIssues(selected, capabilities).map((issue) => (
                <small className="ddc-panel-issue" key={issue}>
                  ⚠ {issue}
                </small>
              ))}
              <label>
                显示条件
                <select
                  value={selected.visibleWhen ? "conditional" : "always"}
                  onChange={(event) =>
                    patchControl({
                      visibleWhen:
                        event.target.value === "always"
                          ? ""
                          : `${selected.capabilityId || capabilities[0]?.capabilityId}=on`,
                    })
                  }
                >
                  <option value="always">始终显示</option>
                  <option value="conditional" disabled={!capabilities.length}>
                    按能力状态显示
                  </option>
                </select>
              </label>
              {selected.visibleWhen && (
                <label>
                  条件（能力 ID=状态值）
                  <input
                    value={selected.visibleWhen}
                    onChange={(event) =>
                      patchControl({ visibleWhen: event.target.value })
                    }
                    placeholder="power=on"
                  />
                </label>
              )}
              <div className="ddc-panel-position">
                <label>
                  列
                  <input
                    type="number"
                    min="1"
                    max="4"
                    value={selected.grid.x + 1}
                    onChange={(event) =>
                      replaceControls(
                        placePanelControl(
                          controls,
                          selected,
                          Number(event.target.value) - 1,
                          selected.grid.y,
                        ),
                      )
                    }
                  />
                </label>
                <label>
                  行
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={selected.grid.y + 1}
                    onChange={(event) =>
                      replaceControls(
                        placePanelControl(
                          controls,
                          selected,
                          selected.grid.x,
                          Number(event.target.value) - 1,
                        ),
                      )
                    }
                  />
                </label>
                <label>
                  宽度
                  <select
                    value={selected.grid.w}
                    onChange={(event) =>
                      replaceControls(
                        placePanelControl(
                          controls,
                          {
                            ...selected,
                            grid: {
                              ...selected.grid,
                              w: Number(event.target.value),
                            },
                          },
                          selected.grid.x,
                          selected.grid.y,
                        ),
                      )
                    }
                  >
                    {[1, 2, 3, 4].map((value) => (
                      <option key={value} value={value}>
                        {value} 列
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {selected.type === "select" &&
                (selected.libraryDefinition?.properties || []).some(
                  (field) => field.key === "optionSource",
                ) && (
                  <>
                    {selected.optionSource === "custom" && (
                      <div className="ddc-panel-option-editor">
                        <small>
                          只修改显示名、顺序和隐藏状态，不修改 HA value。
                        </small>
                        {panelDisplayOptions(
                          selectedCapability,
                          selected.optionOverrides,
                        ).map((option, index) => (
                          <div key={option.value}>
                            <code>{option.value}</code>
                            <input
                              aria-label={`${option.value}显示名称`}
                              value={option.label}
                              onChange={(event) =>
                                updateOption(option.value, {
                                  label: event.target.value,
                                })
                              }
                            />
                            <button
                              disabled={index === 0}
                              onClick={() => moveOption(option.value, -1)}
                            >
                              ↑
                            </button>
                            <button
                              disabled={
                                index ===
                                panelDisplayOptions(
                                  selectedCapability,
                                  selected.optionOverrides,
                                ).length -
                                  1
                              }
                              onClick={() => moveOption(option.value, 1)}
                            >
                              ↓
                            </button>
                            <label>
                              <input
                                type="checkbox"
                                checked={option.hidden}
                                onChange={(event) =>
                                  updateOption(option.value, {
                                    hidden: event.target.checked,
                                  })
                                }
                              />
                              隐藏
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
            </>
          )}
        </section>
      </div>
      {issues.length > 0 && (
        <div className="ddc-step-issues">
          <b>配置需要检查</b>
          {issues.slice(0, 8).map((issue, index) => (
            <span key={`${issue}-${index}`}>⚠ {issue}</span>
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
          <button onClick={onPrevious}>上一步：3D 外观</button>
          <button
            className="primary"
            onClick={async () => {
              if ((await save()) !== false) onNext?.();
            }}
          >
            保存并下一步 →
          </button>
        </div>
      </footer>
    </ProjectStepLayout>
  );
}
