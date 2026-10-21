import ProjectStepLayout from "./project-step-layout.jsx";
import { a as React } from "../../vendor/react.js";
import {
  CAPABILITY_GROUPS,
  CAPABILITY_KINDS,
  CONTROL_LABELS,
  MAPPED_CAPABILITY_STATUSES,
  capabilityGroup,
  capabilityFromEntity,
  capabilityMapping,
  mappingStatus,
  nextCapabilityId,
  selectedDeviceEntities,
  syncEnumValues,
  unboundCapabilities,
  unusedBoundEntities,
} from "./capability-model.js";
import { enumValueLabel } from "../../../../../packages/schema/src/device-value-labels.js";
import "../../styles/device-development-capabilities.css";

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

const DATA_TYPES = [
  ["boolean", "布尔值"],
  ["number", "数值"],
  ["string", "字符串"],
  ["enum", "枚举值"],
  ["image", "图像"],
];
const ACCESS_TYPES = [
  ["read", "只读"],
  ["write", "只写"],
  ["read-write", "读写"],
  ["action", "动作"],
];
const defaultType = (kind) =>
  ({
    toggle: "boolean",
    number: "number",
    enum: "enum",
    action: "boolean",
    image: "image",
  })[kind] ?? "string";
const defaultControl = (kind) =>
  ({
    toggle: "toggle",
    number: "slider",
    enum: "select",
    action: "button",
    image: "image",
    text: "text",
  })[kind] ?? "status";

function initialMappings(binding) {
  return Object.fromEntries(
    Object.keys({
      ...(binding?.capabilityBindings ?? {}),
      ...(binding?.capabilityMappings ?? {}),
    })
      .map((id) => [id, capabilityMapping(binding, id)])
      .filter(([, mapping]) => mapping?.entityId),
  );
}

function SelectField({ label, value, onChange, children }) {
  return (
    <label className="ddc-cap-field">
      <span>{label}</span>
      <select
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
      >
        {children}
      </select>
    </label>
  );
}

export default function ProjectCapabilities({
  projectId,
  platform,
  devices,
  reload,
  notify,
  validation,
  haStatus,
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
  const [capabilities, setCapabilities] = React.useState(() =>
    structuredClone(project?.capabilities ?? []),
  );
  const [mappings, setMappings] = React.useState(() =>
    initialMappings(binding),
  );
  const [selectedId, setSelectedId] = React.useState(
    project?.capabilities?.[0]?.capabilityId ?? "",
  );
  const [collapsed, setCollapsed] = React.useState([]);
  const [newForm, setNewForm] = React.useState(false);
  const [newId, setNewId] = React.useState("");
  const [newName, setNewName] = React.useState("");
  const [importId, setImportId] = React.useState("");
  const [targetCapabilityByEntity, setTargetCapabilityByEntity] =
    React.useState({});
  const [saveState, setSaveState] = React.useState("saved");
  const [revision, setRevision] = React.useState(0);
  const revisionRef = React.useRef(0);
  const savedRef = React.useRef(0);
  const queueRef = React.useRef(Promise.resolve(true));
  const acknowledgmentRef = React.useRef(new Set());
  const capabilitiesRef = React.useRef(capabilities);
  const mappingsRef = React.useRef(mappings);
  const selected = capabilities.find(
    (item) => item.capabilityId === selectedId,
  );
  const selectedMapping = selected && mappings[selected.capabilityId];
  const entities = selectedDeviceEntities(device, binding);
  const selectedEntity = entities.find(
    (item) => item.entityId === selectedMapping?.entityId,
  );
  const summary = capabilities.reduce(
    (totals, item) => {
      if (item.required) totals.required += 1;
      const state = mappingStatus(
        item,
        mappings[item.capabilityId],
        device,
        haStatus,
      );
      if (MAPPED_CAPABILITY_STATUSES.includes(state.id)) totals.bound += 1;
      if (item.access === "read") totals.readOnly += 1;
      return totals;
    },
    { required: 0, bound: 0, readOnly: 0 },
  );
  const unbound = unboundCapabilities(capabilities, mappings);
  const unusedEntities = unusedBoundEntities(entities, mappings);

  const changed = (nextCapabilities, nextMappings) => {
    capabilitiesRef.current = nextCapabilities;
    mappingsRef.current = nextMappings;
    setCapabilities(nextCapabilities);
    setMappings(nextMappings);
    revisionRef.current += 1;
    setRevision(revisionRef.current);
    setSaveState("dirty");
  };
  const patchCapability = (id, patch) =>
    changed(
      capabilitiesRef.current.map((item) =>
        item.capabilityId === id ? { ...item, ...patch } : item,
      ),
      mappingsRef.current,
    );
  const patchMapping = (id, mapping) =>
    changed(capabilitiesRef.current, {
      ...mappingsRef.current,
      ...(mapping?.entityId ? { [id]: mapping } : { [id]: undefined }),
    });

  const save = (targetRevision = revisionRef.current) => {
    if (targetRevision <= savedRef.current)
      return queueRef.current.catch(() => false);
    const snapshot = {
      capabilities: capabilitiesRef.current,
      mappings: mappingsRef.current,
    };
    const acknowledgedCapabilityIds = [...acknowledgmentRef.current];
    setSaveState("saving");
    const pending = queueRef.current
      .catch(() => {})
      .then(async () => {
        if (targetRevision <= savedRef.current) return true;
        await api(
          `./api/device-platform/projects/${encodeURIComponent(projectId)}/capabilities`,
          {
            method: "PUT",
            body: JSON.stringify({ ...snapshot, acknowledgedCapabilityIds }),
          },
        );
        savedRef.current = targetRevision;
        await reload();
        if (revisionRef.current === targetRevision) setSaveState("saved");
        return true;
      });
    queueRef.current = pending;
    return pending.catch((error) => {
      setSaveState("error");
      notify(`能力保存失败：${error.message}`, "error");
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

  const dependencies = async (id) => {
    const result = await api(
      `./api/device-platform/projects/${encodeURIComponent(projectId)}/capability-dependencies/${encodeURIComponent(id)}`,
    );
    return result.dependencies ?? [];
  };
  const confirmImpact = async (id, action) => {
    try {
      const affected = await dependencies(id);
      if (
        affected.length &&
        !window.confirm(
          `能力“${id}”被 ${affected.length} 个配置引用：\n${affected.map((item) => `• ${item.page}：${item.component}`).join("\n")}\n\n${action}后引用会保留并显示失效。仍要继续吗？`,
        )
      )
        return false;
      acknowledgmentRef.current.add(id);
      return true;
    } catch (error) {
      notify(error.message, "error");
      return false;
    }
  };
  const removeCapability = async (item) => {
    if (!(await confirmImpact(item.capabilityId, "删除"))) return;
    if (!window.confirm(`确定删除能力“${item.name}”？能力 ID 不会自动复用。`))
      return;
    const next = capabilitiesRef.current.filter(
      (capability) => capability.capabilityId !== item.capabilityId,
    );
    const nextMappings = { ...mappingsRef.current };
    delete nextMappings[item.capabilityId];
    changed(next, nextMappings);
    setSelectedId(next[0]?.capabilityId ?? "");
  };
  const changeType = async (item, patch) => {
    if (!(await confirmImpact(item.capabilityId, "修改类型"))) return;
    patchCapability(item.capabilityId, patch);
  };
  const createCapability = () => {
    const id = (
      newId.trim() || nextCapabilityId(capabilitiesRef.current)
    ).toLowerCase();
    if (!/^[a-z0-9][a-z0-9._-]{1,127}$/.test(id))
      return notify(
        "能力 ID 只能使用小写字母、数字、点、下划线和连字符，且至少 2 位。",
        "error",
      );
    if (capabilitiesRef.current.some((item) => item.capabilityId === id))
      return notify("能力 ID 已存在。", "error");
    const item = {
      capabilityId: id,
      name: newName.trim() || id,
      kind: "status",
      group: "status",
      dataType: "string",
      access: "read",
      required: false,
      defaultControl: "status",
      enumValues: [],
    };
    changed([...capabilitiesRef.current, item], mappingsRef.current);
    setSelectedId(id);
    setNewId("");
    setNewName("");
    setNewForm(false);
  };
  const createFromEntity = (entity) => {
    const item = capabilityFromEntity(entity, capabilitiesRef.current);
    changed([...capabilitiesRef.current, item], {
      ...mappingsRef.current,
      [item.capabilityId]: { entityId: entity.entityId, attribute: "state" },
    });
    setSelectedId(item.capabilityId);
    notify(
      `已为“${entity.name || entity.entityId}”建立能力并映射；请核对能力类型。`,
      "success",
    );
  };
  const mapEntityToCapability = (entity, capabilityId) => {
    const capability = capabilitiesRef.current.find(
      (item) => item.capabilityId === capabilityId,
    );
    if (!capability || mappingsRef.current[capabilityId]?.entityId) return;
    const options = entity.attributes?.options;
    const nextCapabilities =
      capability.kind === "enum" && Array.isArray(options)
        ? capabilitiesRef.current.map((item) =>
            item.capabilityId === capabilityId
              ? {
                  ...item,
                  enumValues: syncEnumValues(item.enumValues, options, entity),
                }
              : item,
          )
        : capabilitiesRef.current;
    changed(nextCapabilities, {
      ...mappingsRef.current,
      [capabilityId]: { entityId: entity.entityId, attribute: "state" },
    });
    setSelectedId(capabilityId);
    notify(
      `已将“${entity.name || entity.entityId}”映射到“${capability.name}”。`,
      "success",
    );
  };
  const importTemplate = () => {
    const source = platform.deviceTemplates.find(
      (item) => item.id === importId,
    );
    if (!source) return;
    const existing = new Set(
      capabilitiesRef.current.map((item) => item.capabilityId),
    );
    const additions = (source.capabilities ?? []).filter(
      (item) => !existing.has(item.capabilityId),
    );
    if (!additions.length)
      return notify(
        "该模板没有可新增的能力；相同 ID 的现有能力不会被覆盖。",
        "error",
      );
    changed(
      [...capabilitiesRef.current, ...structuredClone(additions)],
      mappingsRef.current,
    );
    setSelectedId(additions[0].capabilityId);
    setImportId("");
    notify(`已导入 ${additions.length} 项能力；请检查属性映射。`, "success");
  };
  const updateMapping = (entityId, attribute = "state") => {
    const next = entityId ? { entityId, attribute } : null;
    const nextMappings = { ...mappingsRef.current };
    if (next) nextMappings[selectedId] = next;
    else delete nextMappings[selectedId];
    if (selected?.kind === "enum" && entityId) {
      const entity = entities.find((item) => item.entityId === entityId);
      const options = entity?.attributes?.options;
      changed(
        capabilitiesRef.current.map((item) =>
          item.capabilityId === selectedId && Array.isArray(options)
            ? {
                ...item,
                enumValues: syncEnumValues(item.enumValues, options, entity),
              }
            : item,
        ),
        nextMappings,
      );
    } else changed(capabilitiesRef.current, nextMappings);
  };
  const syncOptions = () => {
    if (!selectedEntity) return notify("请先映射 HA 实体。", "error");
    const options = selectedEntity.attributes?.options;
    if (!Array.isArray(options))
      return notify("该 HA 实体未提供 options，无法同步枚举。", "error");
    patchCapability(selectedId, {
      enumValues: syncEnumValues(selected.enumValues, options, selectedEntity),
    });
    notify("已同步 HA 枚举；消失的旧值已标记，不会自动删除。", "success");
  };
  const patchEnum = (index, patch) =>
    patchCapability(selectedId, {
      enumValues: selected.enumValues.map((item, i) =>
        i === index
          ? {
              ...item,
              ...patch,
              ...(Object.hasOwn(patch, "label")
                ? { labelSource: "custom" }
                : {}),
            }
          : item,
      ),
    });
  const addEnum = () => {
    const value = window.prompt("输入内部值（value）");
    if (!value?.trim()) return;
    if (selected.enumValues?.some((item) => item.value === value.trim()))
      return notify("枚举内部值已存在。", "error");
    patchCapability(selectedId, {
      enumValues: [
        ...(selected.enumValues ?? []),
        {
          label: value.trim(),
          value: value.trim(),
          source: "manual",
          status: "valid",
        },
      ],
    });
  };
  const grouped = CAPABILITY_GROUPS.map((group) => ({
    ...group,
    items: capabilities.filter((item) => capabilityGroup(item) === group.id),
  }));
  const currentState = selected
    ? mappingStatus(selected, selectedMapping, device, haStatus)
    : null;
  const reusedBy = selectedMapping?.entityId
    ? capabilities.filter(
        (item) =>
          item.capabilityId !== selectedId &&
          mappings[item.capabilityId]?.entityId === selectedMapping.entityId,
      )
    : [];

  return (
    <ProjectStepLayout className="ddc-cap-page">
      <div className="ddc-cap-main">
        <section className="ddc-cap-list">
          <header className="ddc-cap-header">
            <div>
              <h2>能力列表</h2>
              <p>在这里直接定义设备能力，并绑定对应的 Home Assistant 属性。</p>
            </div>
            <div className="ddc-cap-header-actions">
              <button
                className="primary"
                onClick={() => setNewForm((value) => !value)}
              >
                ＋ 添加能力
              </button>
              <select
                aria-label="从模板导入"
                value={importId}
                onChange={(event) => setImportId(event.target.value)}
              >
                <option value="">从模板导入…</option>
                {platform.deviceTemplates
                  .filter(
                    (item) =>
                      item.id !== projectId && item.capabilities?.length,
                  )
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
              </select>
              <button disabled={!importId} onClick={importTemplate}>
                导入
              </button>
            </div>
          </header>
          {!binding && (
            <div className="ddc-cap-info warning">
              请先在“基础信息”中绑定 HA 设备及实体；能力定义仍可先行配置。
            </div>
          )}
          {binding && (
            <div className="ddc-cap-info">
              已读取“{device?.name || binding.deviceId}”的 {entities.length}{" "}
              个已选实体；映射只会引用这些实体。
            </div>
          )}
          {validation?.issues?.length > 0 && (
            <div className="ddc-cap-validation">
              <b>
                {validation.publishBlocked
                  ? "能力配置有问题，当前不能发布"
                  : "能力配置有提醒"}
              </b>
              <span>
                {validation.issues
                  .slice(0, 4)
                  .map(
                    (item) =>
                      `${item.page ? `${item.page} · ` : ""}${item.capabilityId}：${item.reason}`,
                  )
                  .join("；")}
              </span>
            </div>
          )}
          {newForm && (
            <div className="ddc-cap-create">
              <input
                aria-label="新能力 ID"
                placeholder="能力 ID，例如 remaining_time"
                value={newId}
                onChange={(event) => setNewId(event.target.value)}
              />
              <input
                aria-label="新能力名称"
                placeholder="显示名称"
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
              />
              <button className="primary" onClick={createCapability}>
                创建
              </button>
              <button onClick={() => setNewForm(false)}>取消</button>
            </div>
          )}
          <div className="ddc-cap-stats">
            <div>
              <b>{capabilities.length}</b>
              <span>全部能力数</span>
            </div>
            <div>
              <b>{summary.required}</b>
              <span>必需能力数</span>
            </div>
            <div>
              <b>{summary.bound}</b>
              <span>已映射能力</span>
            </div>
            <div>
              <b>{summary.readOnly}</b>
              <span>只读能力数</span>
            </div>
          </div>
          <div className="ddc-cap-table-wrap">
            <div className="ddc-cap-table-head">
              <span>显示列表</span>
              <span>能力 ID</span>
              <span>绑定属性（HA 实体/属性）</span>
              <span>控件类型 / 能力类型</span>
              <span>数据类型</span>
              <span>权限</span>
              <span>必需</span>
              <span>状态</span>
              <span>操作</span>
            </div>
            {grouped.map((group) => (
              <div className="ddc-cap-group" key={group.id}>
                <button
                  className="ddc-cap-group-title"
                  onClick={() =>
                    setCollapsed((values) =>
                      values.includes(group.id)
                        ? values.filter((id) => id !== group.id)
                        : [...values, group.id],
                    )
                  }
                >
                  {collapsed.includes(group.id) ? "▸" : "▾"}　{group.label}（
                  {group.items.length}）
                </button>
                {!collapsed.includes(group.id) &&
                  group.items.map((item) => {
                    const mapping = mappings[item.capabilityId];
                    const state = mappingStatus(
                      item,
                      mapping,
                      device,
                      haStatus,
                    );
                    return (
                      <div
                        className={`ddc-cap-row ${selectedId === item.capabilityId ? "selected" : ""}`}
                        key={item.capabilityId}
                        onClick={() => setSelectedId(item.capabilityId)}
                      >
                        <b title={item.name}>{item.name}</b>
                        <code title={item.capabilityId}>
                          {item.capabilityId}
                        </code>
                        <span
                          title={
                            mapping
                              ? `${mapping.entityId} / ${mapping.attribute}`
                              : "未绑定"
                          }
                        >
                          {mapping
                            ? `${mapping.entityId}${mapping.attribute === "state" ? "" : ` / ${mapping.attribute}`}`
                            : "—"}
                        </span>
                        <span>
                          {CONTROL_LABELS[item.defaultControl] ||
                            item.defaultControl}{" "}
                          /{" "}
                          {CAPABILITY_KINDS.find(
                            (kind) => kind.id === item.kind,
                          )?.label || item.kind}
                        </span>
                        <span>
                          {DATA_TYPES.find(
                            ([id]) => id === item.dataType,
                          )?.[1] || item.dataType}
                        </span>
                        <span>
                          {ACCESS_TYPES.find(
                            ([id]) => id === item.access,
                          )?.[1] || item.access}
                        </span>
                        <span>{item.required ? "是" : "否"}</span>
                        <span className={`ddc-cap-status ${state.id}`}>
                          ● {state.label}
                        </span>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedId(item.capabilityId);
                          }}
                        >
                          编辑
                        </button>
                      </div>
                    );
                  })}
              </div>
            ))}
          </div>
          <section
            className="ddc-cap-unbound"
            aria-labelledby="ddc-cap-unbound-title"
          >
            <div className="ddc-cap-unbound-heading">
              <div>
                <h3 id="ddc-cap-unbound-title">
                  已选但未映射实体（{unusedEntities.length}）
                </h3>
                <p>仅显示上一步已选、但尚未用于本页能力映射的 HA 实体。</p>
              </div>
            </div>
            {unusedEntities.length ? (
              <div className="ddc-cap-unused-entities">
                {unusedEntities.map((entity) => (
                  <div key={entity.entityId}>
                    <span>
                      <b>{entity.name || entity.entityId}</b>
                      <code title={entity.entityId}>{entity.entityId}</code>
                    </span>
                    <select
                      aria-label={`选择“${entity.name || entity.entityId}”要映射的能力`}
                      value={targetCapabilityByEntity[entity.entityId] ?? ""}
                      onChange={(event) =>
                        setTargetCapabilityByEntity((current) => ({
                          ...current,
                          [entity.entityId]: event.target.value,
                        }))
                      }
                    >
                      <option value="">选择已有未映射能力</option>
                      {unbound.map((item) => (
                        <option
                          key={item.capabilityId}
                          value={item.capabilityId}
                        >
                          {item.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={!targetCapabilityByEntity[entity.entityId]}
                      onClick={() =>
                        mapEntityToCapability(
                          entity,
                          targetCapabilityByEntity[entity.entityId],
                        )
                      }
                    >
                      映射到能力
                    </button>
                    <button
                      type="button"
                      onClick={() => createFromEntity(entity)}
                    >
                      新建能力并映射
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="ddc-cap-unbound-empty">
                上一步已选的实体均已完成能力映射。
              </p>
            )}
          </section>
        </section>
        <aside className="ddc-cap-editor">
          {selected ? (
            <>
              <header>
                <h2>能力配置</h2>
                <span className={`ddc-cap-status ${currentState.id}`}>
                  ● {currentState.label}
                </span>
              </header>
              <div className="ddc-cap-form">
                <label className="ddc-cap-field">
                  <span>能力名称 *</span>
                  <input
                    value={selected.name}
                    onChange={(event) =>
                      patchCapability(selectedId, { name: event.target.value })
                    }
                  />
                </label>
                <label className="ddc-cap-field">
                  <span>能力 ID（创建后锁定）</span>
                  <input value={selected.capabilityId} readOnly />
                </label>
                <SelectField
                  label="所属分组"
                  value={capabilityGroup(selected)}
                  onChange={(group) => patchCapability(selectedId, { group })}
                >
                  {CAPABILITY_GROUPS.map((group) => (
                    <option value={group.id} key={group.id}>
                      {group.label}
                    </option>
                  ))}
                </SelectField>
                <SelectField
                  label="能力类型"
                  value={selected.kind}
                  onChange={(kind) =>
                    changeType(selected, {
                      kind,
                      dataType: defaultType(kind),
                      defaultControl: defaultControl(kind),
                      access:
                        kind === "status"
                          ? "read"
                          : kind === "action"
                            ? "action"
                            : "read-write",
                    })
                  }
                >
                  {CAPABILITY_KINDS.map((kind) => (
                    <option key={kind.id} value={kind.id}>
                      {kind.label}
                    </option>
                  ))}
                </SelectField>
                <SelectField
                  label="数据类型"
                  value={selected.dataType}
                  onChange={(dataType) => changeType(selected, { dataType })}
                >
                  {DATA_TYPES.map(([id, label]) => (
                    <option value={id} key={id}>
                      {label}
                    </option>
                  ))}
                </SelectField>
                <SelectField
                  label="权限"
                  value={selected.access}
                  onChange={(access) => patchCapability(selectedId, { access })}
                >
                  {ACCESS_TYPES.map(([id, label]) => (
                    <option value={id} key={id}>
                      {label}
                    </option>
                  ))}
                </SelectField>
                <SelectField
                  label="默认控件"
                  value={selected.defaultControl}
                  onChange={(defaultControl) =>
                    patchCapability(selectedId, { defaultControl })
                  }
                >
                  {Object.entries(CONTROL_LABELS).map(([id, label]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </SelectField>
                <label className="ddc-cap-check">
                  <input
                    type="checkbox"
                    checked={selected.required === true}
                    onChange={(event) =>
                      patchCapability(selectedId, {
                        required: event.target.checked,
                      })
                    }
                  />{" "}
                  是必需能力
                </label>
                <SelectField
                  label="绑定实体"
                  value={selectedMapping?.entityId ?? ""}
                  onChange={(entityId) => updateMapping(entityId)}
                >
                  <option value="">暂不映射</option>
                  {entities.map((entity) => (
                    <option value={entity.entityId} key={entity.entityId}>
                      {entity.name} · {entity.entityId}
                    </option>
                  ))}
                </SelectField>
                {selectedEntity && (
                  <SelectField
                    label="主属性"
                    value={selectedMapping?.attribute ?? "state"}
                    onChange={(attribute) =>
                      updateMapping(selectedEntity.entityId, attribute)
                    }
                  >
                    <option value="state">state（实体状态）</option>
                    {Object.keys(selectedEntity.attributes ?? {})
                      .filter((key) =>
                        /^[a-zA-Z_][a-zA-Z0-9_]{0,79}$/.test(key),
                      )
                      .map((key) => (
                        <option key={key} value={key}>
                          {key}
                        </option>
                      ))}
                  </SelectField>
                )}
                {reusedBy.length > 0 && (
                  <div className="ddc-cap-warning">
                    此实体也被 {reusedBy.map((item) => item.name).join("、")}{" "}
                    引用；允许重复映射。
                  </div>
                )}
                {["missing", "mismatch"].includes(currentState.id) && (
                  <div className="ddc-cap-warning">
                    {currentState.label}
                    ：请重新选择实体/属性或调整数据类型；发布检查应阻止此问题。
                  </div>
                )}
              </div>
              {selected.kind === "enum" && (
                <div className="ddc-cap-enum">
                  <header>
                    <h3>枚举值管理</h3>
                    <div>
                      <button onClick={syncOptions}>⟳ 从 HA 重新读取</button>
                      <button className="primary" onClick={addEnum}>
                        ＋ 新增枚举值
                      </button>
                    </div>
                  </header>
                  <p>
                    HA 新增值会加入，消失的旧值仅标记；手动值不会被同步删除。
                  </p>
                  <div className="ddc-cap-enum-head">
                    <span>显示名称</span>
                    <span>内部值（value）</span>
                    <span>来源 / 状态</span>
                    <span>操作</span>
                  </div>
                  {(selected.enumValues ?? []).map((item, index) => (
                    <div
                      className="ddc-cap-enum-row"
                      key={`${item.value}-${index}`}
                    >
                      <input
                        aria-label={`${item.value}显示名称`}
                        value={enumValueLabel(item, {
                          ...selected,
                          stateLabels: selectedEntity?.stateLabels,
                        })}
                        onChange={(event) =>
                          patchEnum(index, { label: event.target.value })
                        }
                      />
                      <input
                        aria-label={`${item.value}内部值`}
                        value={item.value}
                        readOnly={item.source === "ha"}
                        onChange={(event) =>
                          patchEnum(index, { value: event.target.value })
                        }
                      />
                      <span className={item.status}>
                        {item.source === "ha" ? "HA 设备读取" : "手动新增"}
                        {item.status === "new"
                          ? " · 新增"
                          : item.status === "missing"
                            ? " · HA 中已不存在"
                            : ""}
                      </span>
                      <button
                        aria-label={`删除枚举 ${item.value}`}
                        onClick={() => {
                          if (
                            window.confirm(
                              `删除枚举值“${item.label}”？引用此值的后续配置可能失效。`,
                            )
                          )
                            patchCapability(selectedId, {
                              enumValues: selected.enumValues.filter(
                                (_, i) => i !== index,
                              ),
                            });
                        }}
                      >
                        删除
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <button
                className="ddc-cap-delete"
                onClick={() => void removeCapability(selected)}
              >
                删除此能力
              </button>
            </>
          ) : (
            <div className="ddc-cap-empty">选择左侧能力，或添加新能力。</div>
          )}
        </aside>
      </div>
      <footer className="ddc-cap-footer">
        <span>
          ●{" "}
          {saveState === "saved"
            ? "已自动保存"
            : saveState === "saving"
              ? "自动保存中…"
              : saveState === "error"
                ? "保存失败 · 请重试"
                : "存在未保存修改"}
        </span>
        <div>
          <button onClick={() => void onPrevious()}>上一步：基础信息</button>
          <button className="primary" onClick={() => void onNext()}>
            下一步：运行浮窗 →
          </button>
        </div>
      </footer>
    </ProjectStepLayout>
  );
}
