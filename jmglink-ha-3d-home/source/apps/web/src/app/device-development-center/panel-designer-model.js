import {
  PANEL_CONTROL_VARIANTS,
  PANEL_COMPONENTS,
  librarySupportsCapability,
} from "../../../../../packages/schema/src/control-library.js";
export { PANEL_CONTROL_VARIANTS, PANEL_COMPONENTS };
import {
  deviceValueLabel,
  enumValueLabel,
} from "../../../../../packages/schema/src/device-value-labels.js";

export const PANEL_COLUMNS = 4;
export function panelControlVariant(control) {
  const variants = PANEL_CONTROL_VARIANTS[control.type] ?? [];
  const value =
    control.type === "select" ? control.selectStyle : control.variant;
  return variants.some((item) => item.value === value)
    ? value
    : (variants[0]?.value ?? "plain");
}

export function panelComponent(type) {
  return PANEL_COMPONENTS.find((item) => item.type === type);
}

export function recommendedPanelComponents(capability) {
  if (capability?.kind === "enum" || capability?.dataType === "enum")
    return ["select"];
  if (capability?.kind === "toggle" || capability?.dataType === "boolean")
    return ["toggle", "button", "status"];
  if (capability?.kind === "action") return ["button"];
  if (capability?.dataType === "number")
    return ["number", "slider", "progress", "stats"];
  return ["status", "text", "icon"];
}

export function unusedPanelCapabilities(capabilities, controls, mappedIds) {
  const used = new Set((controls ?? []).map((control) => control.capabilityId));
  return (capabilities ?? []).filter(
    (capability) =>
      !used.has(capability.capabilityId) &&
      (!mappedIds || mappedIds.has(capability.capabilityId)),
  );
}

export function compatiblePanelCapabilities(type, capabilities) {
  const kind = panelComponent(type)?.kind;
  if (!kind) return capabilities ?? [];
  return (capabilities ?? []).filter((item) =>
    kind === "toggle"
      ? item.kind === "toggle" || item.dataType === "boolean"
      : kind === "action"
        ? item.kind === "action" ||
          item.kind === "toggle" ||
          item.dataType === "boolean"
        : kind === "enum"
          ? item.kind === "enum" || item.dataType === "enum"
          : kind === "number"
            ? item.dataType === "number"
            : false,
  );
}

export function panelControlIssues(control, capabilities) {
  const definition = panelComponent(control.type);
  if (!definition) return ["未知组件类型"];
  if (!definition.kind && !control.capabilityId) return [];
  if (!control.capabilityId) return ["能力未绑定"];
  const capability = (capabilities ?? []).find(
    (item) => item.capabilityId === control.capabilityId,
  );
  if (!capability) return ["能力未绑定（引用已失效）"];
  if (!librarySupportsCapability(control.libraryDefinition, capability))
    return ["控件库风格不支持该能力的数据类型"];
  if (
    !control.libraryDefinition &&
    definition.kind &&
    !compatiblePanelCapabilities(control.type, [capability]).length
  )
    return ["绑定能力类型不兼容"];
  return [];
}

export function panelDisplayOptions(capability, overrides = []) {
  const byValue = new Map(
    (overrides ?? []).map((item) => [String(item.value), item]),
  );
  return (capability?.enumValues ?? [])
    .map((item) => {
      const override = byValue.get(String(item.value));
      return {
        value: String(item.value),
        label: override?.label
          ? deviceValueLabel(item.value, override.label, {
              ...capability,
              labelSource: "custom",
            })
          : enumValueLabel(item, capability),
        hidden: override?.hidden === true,
        order: Number.isFinite(override?.order)
          ? override.order
          : Number.MAX_SAFE_INTEGER,
        missing: item.status === "missing",
      };
    })
    .sort((a, b) => a.order - b.order);
}

export function createPanelControl(type, id) {
  const definition = panelComponent(type);
  if (!definition) throw new Error("未知组件类型");
  return {
    id,
    type,
    label: definition.label,
    capabilityId: "",
    grid: { x: 0, y: 0, w: definition.width },
    variant:
      type === "select" ? undefined : PANEL_CONTROL_VARIANTS[type]?.[0]?.value,
    selectStyle: type === "select" ? "radio" : undefined,
    optionSource: type === "select" ? "ha" : undefined,
    optionOverrides: [],
  };
}

function intersects(a, b) {
  return (
    a.grid.x < b.grid.x + b.grid.w &&
    a.grid.x + a.grid.w > b.grid.x &&
    a.grid.y === b.grid.y
  );
}

export function panelDropCell(
  clientX,
  clientY,
  bounds,
  rowHeight = 80,
  rowGap = 8,
) {
  const offset = Math.max(0, clientY - bounds.top);
  let row;
  if (Array.isArray(rowHeight)) {
    let remaining = offset;
    row = 0;
    for (const height of rowHeight) {
      if (remaining < height + rowGap) break;
      remaining -= height + rowGap;
      row++;
    }
  } else row = Math.max(0, Math.floor(offset / (rowHeight + rowGap)));
  return {
    x: Math.max(
      0,
      Math.min(
        PANEL_COLUMNS - 1,
        Math.floor(((clientX - bounds.left) / bounds.width) * PANEL_COLUMNS),
      ),
    ),
    y: row,
  };
}

export function placePanelControl(controls, control, x, y) {
  const width = Math.min(PANEL_COLUMNS, Math.max(1, control.grid?.w ?? 1));
  const candidate = {
    ...control,
    grid: {
      x: Math.max(0, Math.min(PANEL_COLUMNS - width, Math.round(x))),
      y: Math.max(0, Math.round(y)),
      w: width,
    },
  };
  const other = controls
    .filter((item) => item.id !== control.id)
    .map((item) => ({ ...item, grid: { ...item.grid } }));
  const pending = [candidate];
  while (pending.length) {
    const placed = pending.shift();
    for (const item of other) {
      if (item === placed || !intersects(placed, item)) continue;
      item.grid.y = placed.grid.y + 1;
      pending.push(item);
    }
  }
  return [...other, candidate].sort(
    (a, b) => a.grid.y - b.grid.y || a.grid.x - b.grid.x,
  );
}

export function panelStepIssues(panel, capabilities) {
  if (!panel?.sections?.[0]?.controls?.length) return ["控制面板尚未添加组件"];
  return panel.sections.flatMap((section) =>
    section.controls.flatMap((control) =>
      panelControlIssues(control, capabilities).map(
        (issue) => `${control.label}：${issue}`,
      ),
    ),
  );
}
