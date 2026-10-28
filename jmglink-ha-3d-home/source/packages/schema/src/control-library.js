import { BUILTIN_CONTROL_SELECTION } from "./builtin-control-selection.js";
export const PANEL_CONTROL_VARIANTS = {
  toggle: [
    { value: "switch", label: "滑动开关", hint: "轨道与圆形滑块", mark: "◉" },
    {
      value: "segmented",
      label: "双态按钮",
      hint: "开启、关闭并列",
      mark: "▥",
    },
    { value: "power", label: "电源按钮", hint: "圆形电源键", mark: "⏻" },
  ],
  button: [
    { value: "full", label: "整行按钮", hint: "占满控件宽度", mark: "▰" },
    { value: "pill", label: "胶囊按钮", hint: "紧凑圆角按钮", mark: "▱" },
    { value: "icon", label: "图标按钮", hint: "图标与文字组合", mark: "◉" },
  ],
  select: [
    { value: "radio", label: "按钮组", hint: "选项横向排列", mark: "▥" },
    { value: "dropdown", label: "下拉选择", hint: "节省画板空间", mark: "⌄" },
    { value: "grid", label: "平铺网格", hint: "选项分列排列", mark: "▦" },
  ],
  slider: [
    { value: "track", label: "连续滑轨", hint: "自由拖动滑块", mark: "━━" },
    { value: "steps", label: "刻度滑轨", hint: "显示离散刻度", mark: "┼┼" },
    { value: "compact", label: "紧凑滑轨", hint: "数值与滑轨并排", mark: "◌" },
  ],
  number: [
    { value: "input", label: "数字输入", hint: "直接输入数值", mark: "123" },
    {
      value: "stepper",
      label: "步进调节",
      hint: "增减按钮两侧排列",
      mark: "−+",
    },
    { value: "metric", label: "大字数值", hint: "突出当前数值", mark: "38" },
  ],
  progress: [
    { value: "line", label: "线性进度", hint: "连续进度条", mark: "━" },
    { value: "steps", label: "分段进度", hint: "分段展示进度", mark: "▰▰" },
    { value: "circle", label: "环形进度", hint: "圆环与百分比", mark: "◕" },
  ],
  status: [
    { value: "row", label: "状态行", hint: "名称与状态并列", mark: "═" },
    { value: "badge", label: "状态徽标", hint: "突出状态标签", mark: "●" },
    { value: "dot", label: "指示灯", hint: "圆点标识状态", mark: "◉" },
  ],
  text: [
    { value: "plain", label: "普通文本", hint: "简洁单行", mark: "T" },
    { value: "callout", label: "提示块", hint: "左侧标记线", mark: "▏" },
    { value: "quote", label: "引用文本", hint: "适合说明语", mark: "“”" },
  ],
  icon: [
    { value: "tile", label: "图标方卡", hint: "方形图标位", mark: "▣" },
    { value: "circle", label: "圆形图标", hint: "圆形图标位", mark: "◉" },
    { value: "chip", label: "图标标签", hint: "图标和文字同行", mark: "⬡" },
  ],
  stats: [
    { value: "row", label: "统计行", hint: "名称、数值并排", mark: "▥" },
    { value: "metric", label: "大字指标", hint: "数值优先展示", mark: "42" },
    { value: "compact", label: "紧凑统计", hint: "适合窄卡片", mark: "▤" },
  ],
  richtext: [
    { value: "paragraph", label: "段落", hint: "多行说明文字", mark: "☷" },
    { value: "callout", label: "提示信息", hint: "强调重要说明", mark: "ⓘ" },
    { value: "quote", label: "引用块", hint: "首尾留白", mark: "“”" },
  ],
  divider: [
    { value: "line", label: "实线", hint: "连续分隔", mark: "━" },
    { value: "dashed", label: "虚线", hint: "轻量分隔", mark: "┄" },
    { value: "dotted", label: "点线", hint: "细密分隔", mark: "···" },
  ],
  container: [
    { value: "frame", label: "边框容器", hint: "完整外框", mark: "□" },
    { value: "header", label: "标题容器", hint: "强调分组标题", mark: "▤" },
    { value: "inset", label: "内嵌容器", hint: "凹陷内容区域", mark: "▣" },
  ],
};

export const PANEL_COMPONENTS = [
  {
    type: "toggle",
    label: "开关",
    icon: "●",
    group: "基础控制",
    kind: "toggle",
    width: 2,
  },
  {
    type: "button",
    label: "按钮",
    icon: "◉",
    group: "基础控制",
    kind: "action",
    width: 1,
  },
  {
    type: "select",
    label: "选择器",
    icon: "☷",
    group: "基础控制",
    kind: "enum",
    width: 2,
  },
  {
    type: "slider",
    label: "滑块",
    icon: "◦",
    group: "基础控制",
    kind: "number",
    width: 2,
  },
  {
    type: "number",
    label: "数值调节",
    icon: "123",
    group: "基础控制",
    kind: "number",
    width: 2,
  },
  {
    type: "progress",
    label: "进度条",
    icon: "▰",
    group: "信息展示",
    kind: "number",
    width: 4,
  },
  { type: "status", label: "状态标签", icon: "◇", group: "信息展示", width: 1 },
  { type: "text", label: "文本", icon: "T", group: "信息展示", width: 2 },
  { type: "icon", label: "图标卡片", icon: "⬡", group: "信息展示", width: 1 },
  { type: "stats", label: "统计信息", icon: "▥", group: "信息展示", width: 2 },
  { type: "richtext", label: "富文本", icon: "A", group: "信息展示", width: 2 },
  { type: "divider", label: "分割线", icon: "─", group: "布局组件", width: 4 },
  { type: "container", label: "容器", icon: "▣", group: "布局组件", width: 4 },
];
export const CONTROL_PACKAGE_FORMAT = "ha3d-control-library";
export const DATA_TYPES = ["boolean", "number", "string", "enum", "action"];
const STYLE_KEYS = new Set([
  "color",
  "height",
  "accentColor",
  "borderColor",
  "background",
  "backgroundColor",
  "border",
  "borderLeft",
  "borderTop",
  "borderRight",
  "borderBottom",
  "borderColor",
  "borderWidth",
  "borderStyle",
  "borderRadius",
  "padding",
  "paddingTop",
  "paddingBottom",
  "paddingLeft",
  "paddingRight",
  "gap",
  "fontSize",
  "fontWeight",
  "fontFamily",
  "lineHeight",
  "letterSpacing",
  "textAlign",
  "textShadow",
  "boxShadow",
  "opacity",
  "width",
  "minHeight",
  "maxHeight",
  "alignItems",
  "justifyContent",
  "flexDirection",
  "flexWrap",
  "gridTemplateColumns",
]);
const KINDS = [
  "column",
  "row",
  "grid",
  "text",
  "label",
  "value",
  "unit",
  "native",
  "button",
  "icon",
  "options",
  "input",
  "switch",
  "progress",
  "divider",
];
const defaults = {
  toggle: "switch",
  button: "full",
  select: "dropdown",
  slider: "track",
  number: "input",
  progress: "line",
  status: "row",
  text: "plain",
  icon: "tile",
  stats: "row",
  richtext: "paragraph",
  divider: "line",
  container: "frame",
};
export function libraryVariant(control) {
  return control.type === "select"
    ? control.selectStyle || "dropdown"
    : control.variant || defaults[control.type];
}
export function builtinControlId(control) {
  return `builtin.${control.type}.${libraryVariant(control)}`;
}
function typesFor(type) {
  return ["toggle"].includes(type)
    ? ["boolean"]
    : ["slider", "number", "progress", "stats"].includes(type)
      ? ["number"]
      : type === "select"
        ? ["enum"]
        : type === "button"
          ? ["action", "boolean"]
          : ["string", "boolean", "number", "enum"];
}
export function builtinControls() { return structuredClone(BUILTIN_CONTROL_SELECTION); }

// Keep old native definitions resolvable for existing panel snapshots.
export function legacyBuiltinControls() {
  return PANEL_COMPONENTS.flatMap((component) =>
    (PANEL_CONTROL_VARIANTS[component.type] || []).map((variant) => ({
      id: `builtin.${component.type}.${variant.value}`,
      name: `${component.label} · ${variant.label}`,
      description: variant.hint || "",
      author: "内置",
      version: 1,
      builtin: true,
      enabled: true,
      type: component.type,
      variant: variant.value,
      icon: variant.mark || component.icon,
      dataTypes: typesFor(component.type),
      category: ["text", "richtext", "divider", "container", "icon"].includes(
        component.type,
      )
        ? "general"
        : "data",
      width: component.width || 2,
      ui: { kind: "native" },
      style: {},
    })),
  );
}
export function validateStyle(raw) {
  const result = {};
  if (raw == null) return result;
  if (typeof raw !== "object" || Array.isArray(raw))
    throw Error("样式必须为属性对象");
  if (Object.keys(raw).length > 32) throw Error("样式属性过多");
  for (const [key, value] of Object.entries(raw)) {
    if (!STYLE_KEYS.has(key)) throw Error(`不支持的样式属性：${key}`);
    if (
      !["string", "number"].includes(typeof value) ||
      String(value).length > 200 ||
      /url\s*\(|expression\s*\(|@import|javascript:|[<>\\]/i.test(String(value))
    )
      throw Error("样式值无效或包含外部资源");
    if (typeof value === "number" && !Number.isFinite(value))
      throw Error("样式数值无效");
    result[key] = value;
  }
  return result;
}
function normalizeUi(raw, context, depth = 0) {
  if (depth > 8 || ++context.count > 100) throw Error("UI 层级或节点数量超限");
  if (!raw || typeof raw !== "object" || !KINDS.includes(raw.kind))
    throw Error("UI 节点类型无效");
  const children = raw.children ?? [];
  if (!Array.isArray(children) || children.length > 30)
    throw Error("UI 子节点格式无效");
  const text = String(raw.text ?? "");
  if (text.length > 1000) throw Error("UI 文本过长");
  const allowed = [
    "kind",
    "text",
    "style",
    "children",
    "action",
    "mode",
    "itemStyle",
    "activeStyle",
  ];
  const modes = {
    options: ["buttons", "grid", "dropdown", "boolean"],
    input: ["number", "range"],
    switch: ["track", "power"],
    progress: ["line", "steps", "circle"],
  };
  if (raw.mode && !modes[raw.kind]?.includes(raw.mode))
    throw Error("UI 交互模式无效");
  if (Object.keys(raw).some((key) => !allowed.includes(key)))
    throw Error("UI 节点含有不支持的属性");
  if (
    raw.action &&
    !["toggle", "increment", "decrement", "press"].includes(raw.action)
  )
    throw Error("UI 动作无效");
  return {
    kind: raw.kind,
    ...(raw.mode ? { mode: raw.mode } : {}),
    ...(raw.itemStyle ? { itemStyle: validateStyle(raw.itemStyle) } : {}),
    ...(raw.activeStyle ? { activeStyle: validateStyle(raw.activeStyle) } : {}),
    ...(text ? { text } : {}),
    ...(raw.action ? { action: raw.action } : {}),
    style: validateStyle(raw.style),
    ...(children.length
      ? {
          children: children.map((node) =>
            normalizeUi(node, context, depth + 1),
          ),
        }
      : {}),
  };
}
export function hasNative(ui) {
  return !ui || ui.kind === "native" || (ui.children || []).some(hasNative);
}
export function normalizeLibraryControl(raw) {
  if (!raw || typeof raw !== "object") throw Error("控件定义无效");
  if (JSON.stringify(raw).length > 65536) throw Error("单个控件不能超过 64 KB");
  const id = String(raw.id || "");
  if (!/^(builtin|custom)\.[a-z0-9._-]{1,100}$/.test(id))
    throw Error(
      "控件 ID 需以 builtin. 或 custom. 开头，只含小写字母、数字及点横线",
    );
  if (!PANEL_COMPONENTS.some((item) => item.type === raw.type))
    throw Error("不支持的控件类型");
  if (
    !PANEL_CONTROL_VARIANTS[raw.type]?.some(
      (item) => item.value === raw.variant,
    )
  )
    throw Error("不支持的基础风格");
  const name = String(raw.name || "").trim();
  if (!name || name.length > 80) throw Error("控件名称不能为空且最多 80 字");
  const dataTypes = Array.isArray(raw.dataTypes)
    ? [...new Set(raw.dataTypes)]
    : typesFor(raw.type);
  if (
    !dataTypes.length ||
    dataTypes.some((type) => !DATA_TYPES.includes(type)) ||
    (hasNative(raw.ui) &&
      dataTypes.some((type) => !typesFor(raw.type).includes(type)))
  )
    throw Error("控件支持的数据类型不兼容");
  let properties = raw.properties ?? defaultControlProperties(raw.type, raw.variant);
  if (id.startsWith("builtin.") && hasNative(raw.ui) &&
      (["number", "slider", "progress"].includes(raw.type) || (raw.type === "text" && raw.variant === "quote")) &&
      !properties.some((field) => field.key === "valueAlign"))
    properties = [...properties, defaultControlProperties(raw.type, raw.variant).find((field) => field.key === "valueAlign")];
  return {
    id,
    name,
    description: String(raw.description || "").slice(0, 500),
    author: String(raw.author || "").slice(0, 80),
    version: Math.max(
      1,
      Math.min(100000, Math.floor(Number(raw.version) || 1)),
    ),
    builtin: id.startsWith("builtin."),
    enabled: raw.enabled !== false,
    type: raw.type,
    variant: raw.variant,
    icon: String(raw.icon || "◇").slice(0, 12),
    dataTypes,
    category: raw.category === "general" ? "general" : "data",
    width: Math.max(1, Math.min(4, Math.round(Number(raw.width) || 2))),
    style: validateStyle(raw.style),
    ui: normalizeUi(raw.ui || { kind: "native" }, { count: 0 }),
    properties: normalizeControlProperties(
      properties.map((field) =>
        id.startsWith("builtin.") && ["number", "slider", "progress"].includes(raw.type) &&
        (raw.version ?? 1) === 1 && hasNative(raw.ui) &&
        field.key === "valueAlign" && field.default === "flex-start"
          ? { ...field, default: "center" }
          : field,
      ),
    ),
  };
}
export function normalizeLibraryPackage(bundle) {
  if (
    bundle?.format !== CONTROL_PACKAGE_FORMAT ||
    bundle.schemaVersion !== 1 ||
    !Array.isArray(bundle.controls) ||
    bundle.controls.length > 500
  )
    throw Error("不是受支持的控件库 JSON 包（schemaVersion: 1）");
  const controls = bundle.controls.map(normalizeLibraryControl);
  if (new Set(controls.map((item) => item.id)).size !== controls.length)
    throw Error("控件包中存在重复 ID");
  return controls;
}
export function resolveLibraryControl(
  control,
  definitions = [...builtinControls(), ...legacyBuiltinControls()],
) {
  return (
    control.libraryDefinition ||
    definitions.find(
      (item) =>
        item.id === (control.libraryControlId || builtinControlId(control)),
    )
  );
}
export function attachLibraryControl(control, definition) {
  const item = normalizeLibraryControl(definition);
  return {
    ...control,
    type: item.type,
    icon: control.icon ?? item.icon,
    ...(item.type === "select"
      ? { selectStyle: item.variant, variant: undefined }
      : { variant: item.variant, selectStyle: undefined }),
    libraryControlId: item.id,
    libraryControlVersion: item.version,
    libraryDefinition: structuredClone(item),
  };
}
export function librarySupportsCapability(definition, capability) {
  if (!definition) return true;
  const type =
    capability.kind === "enum"
      ? "enum"
      : capability.kind === "action"
        ? "action"
        : capability.dataType === "integer"
          ? "number"
          : capability.dataType;
  return definition.dataTypes.includes(type);
}

// Expand legacy native definitions only when editing; existing panel snapshots stay untouched.
export function editableLibraryControl(definition) {
  const result = normalizeLibraryControl(definition);
  // references is API view metadata, not part of a saved definition. Keep it
  // while expanding cards; otherwise the library's references.length crashes.
  if (Array.isArray(definition.references))
    result.references = structuredClone(definition.references);
  function expand(node) {
    if (node.kind !== "native")
      return {
        ...node,
        ...(node.children ? { children: node.children.map(expand) } : {}),
      };
    const type = result.type,
      variant = result.variant;
    const label = {
      kind: "row",
      style: { gap: "6px", alignItems: "center" },
      children: [
        { kind: "icon", style: { fontSize: "14px" } },
        { kind: "label", style: { fontSize: "13px", fontWeight: 600 } },
      ],
    };
    const value = {
      kind: "value",
      style: {
        fontSize:
          (["number", "stats"].includes(type) && variant === "metric") ||
          (type === "text" && variant === "quote")
            ? "28px"
            : "13px",
        fontWeight: 700,
      },
    };
    const metric = {
      kind: "row",
      style: {
        alignItems: "baseline",
        gap: "5px",
        justifyContent: "{{props.valueAlign}}",
      },
      children: [
        value,
        { kind: "unit", style: { fontSize: "11px", opacity: 0.75 } },
      ],
    };
    const buttonStyle = {
      border: "1px solid #ffffff38",
      borderRadius: "7px",
      padding: "5px 8px",
      background: "#ffffff12",
      fontSize: "12px",
      color: "#f8faff",
    };
    let body = [];
    if (type === "select")
      body = [
        {
          kind: "options",
          mode:
            variant === "dropdown"
              ? "dropdown"
              : variant === "grid"
                ? "grid"
                : "buttons",
          style: { gap: "4px" },
          itemStyle: buttonStyle,
          activeStyle: {
            background: "#79a5f5",
            color: "#19325b",
            borderColor: "#a9c8ff",
          },
        },
      ];
    else if (type === "toggle")
      body = [
        variant === "segmented"
          ? {
              kind: "options",
              mode: "boolean",
              style: {
                gap: "3px",
                padding: "3px",
                borderRadius: "7px",
                background: "#00000018",
              },
              itemStyle: buttonStyle,
              activeStyle: { background: "#79a5f5", color: "#19325b" },
            }
          : {
              kind: "switch",
              mode: variant === "power" ? "power" : "track",
              style: buttonStyle,
            },
      ];
    else if (type === "button")
      body = [
        {
          kind: "button",
          action: "press",
          text: variant === "icon" ? "◉ 执行" : "执行",
          style: {
            ...buttonStyle,
            ...(variant === "pill"
              ? { borderRadius: "24px" }
              : variant === "icon"
                ? { borderRadius: "50%", minHeight: "42px", width: "42px" }
                : { width: "100%" }),
          },
        },
      ];
    else if (type === "number" && variant !== "metric")
      body = [
        variant === "stepper"
          ? {
              kind: "row",
              children: [
                {
                  kind: "button",
                  action: "decrement",
                  text: "−",
                  style: buttonStyle,
                },
                { kind: "input", mode: "number", style: buttonStyle },
                {
                  kind: "button",
                  action: "increment",
                  text: "＋",
                  style: buttonStyle,
                },
                { kind: "unit" },
              ],
            }
          : {
              kind: "row",
              children: [
                { kind: "input", mode: "number", style: buttonStyle },
                { kind: "unit" },
              ],
            },
      ];
    else if (type === "slider")
      body = [
        {
          kind: "input",
          mode: "range",
          style: {
            ...buttonStyle,
            ...(variant === "steps" ? { accentColor: "#b7cfff" } : {}),
          },
        },
        metric,
      ];
    else if (type === "progress")
      body = [
        {
          kind: "progress",
          mode: variant,
          style: { height: "12px", accentColor: "#82abf5" },
        },
        ...(variant === "circle" ? [] : [metric]),
      ];
    else if (type === "divider")
      body = [
        {
          kind: "divider",
          style: {
            borderTop:
              "1px " + (variant === "line" ? "solid" : variant) + " #ffffff38",
          },
        },
      ];
    else if (type === "container") body = [];
    else if (type === "icon")
      body = [
        {
          kind: "icon",
          text: "{{icon}}",
          style: {
            fontSize: "26px",
            ...(variant === "circle"
              ? {
                  border: "1px solid #ffffff38",
                  borderRadius: "50%",
                  padding: "5px",
                }
              : {}),
          },
        },
        value,
      ];
    else body = [metric];
    const style = {
      gap: "6px",
      justifyContent: "space-between",
      ...node.style,
    };
    return { kind: "column", style, children: [label, ...body] };
  }
  result.ui = expand(result.ui || { kind: "native" });
  result.properties ??= defaultControlProperties(result.type, result.variant);
  // Visual defaults are editable alongside the layout instead of hidden behind a variant picker.
  result.style = {
    padding: "9px",
    border: "1px solid #ffffff38",
    borderRadius: "10px",
    background: "#ffffff0d",
    ...result.style,
  };
  if (["quote", "callout", "inset", "header"].includes(result.variant))
    Object.assign(
      result.style,
      result.variant === "quote"
        ? { borderLeft: "3px solid #aecbff" }
        : result.variant === "callout"
          ? { background: "#92b6ed25" }
          : result.variant === "inset"
            ? { boxShadow: "inset 0 2px 8px #00000015" }
            : { borderTop: "3px solid #aac8fa" },
    );
  return result;
}

export const CONTROL_FIELDS = [
  "label",
  "icon",
  "content",
  "unit",
  "min",
  "max",
  "step",
  "confirm",
  "optionSource",
];
export function defaultControlProperties(type, variant) {
  const fields = [
    { key: "label", label: "标题", type: "string", default: "" },
    { key: "icon", label: "图标", type: "string", default: "" },
  ];
  if (!["toggle", "select", "button", "divider", "container"].includes(type))
    fields.push({
      key: "content",
      label: "显示内容",
      type: "string",
      default: "",
    });
  if (
    [
      "number",
      "slider",
      "progress",
      "stats",
      "text",
      "status",
      "icon",
    ].includes(type)
  )
    fields.push(
      {
        key: "unit",
        label: "单位",
        type: "string",
        default: "",
        description: "留空时读取能力或 HA 单位",
      },
      { key: "hideUnit", label: "隐藏单位", type: "boolean", default: false },
    );
  if (["number", "slider", "progress"].includes(type))
    fields.push(
      { key: "min", label: "最小值", type: "number" },
      { key: "max", label: "最大值", type: "number" },
      { key: "step", label: "步长", type: "number", min: 0.000001 },
    );
  if (["button", "toggle", "select", "slider", "number"].includes(type))
    fields.push({
      key: "confirm",
      label: "执行操作前确认",
      type: "boolean",
      default: false,
    });
  if (["number", "slider", "stats", "progress"].includes(type) || (type === "text" && variant === "quote"))
    fields.push({
      key: "valueAlign",
      label: type === "text" ? "文本对齐" : "数值对齐",
      type: "select",
      default: ["number", "slider", "progress"].includes(type) || ["metric", "quote"].includes(variant) ? "center" : "flex-start",
      options: [
        { value: "flex-start", label: "左对齐" },
        { value: "center", label: "居中" },
        { value: "flex-end", label: "右对齐" },
      ],
    });
  if (type === "select")
    fields.push({
      key: "optionSource",
      label: "选项数据",
      type: "select",
      default: "ha",
      options: [
        { value: "ha", label: "从能力自动读取" },
        { value: "custom", label: "自定义显示" },
      ],
    });
  return fields;
}
export function normalizeControlProperties(raw) {
  if (!Array.isArray(raw) || raw.length > 40)
    throw Error("可配置属性注册需为数组，最多40项");
  const seen = new Set();
  return raw.map((field) => {
    if (
      !field ||
      !/^[a-zA-Z][a-zA-Z0-9_]{0,39}$/.test(field.key) ||
      ["__proto__", "prototype", "constructor"].includes(field.key) ||
      seen.has(field.key)
    )
      throw Error("属性键无效或重复");
    seen.add(field.key);
    if (!["string", "number", "boolean", "select"].includes(field.type))
      throw Error("属性类型无效");
    const expected = {
      label: "string",
      icon: "string",
      content: "string",
      unit: "string",
      min: "number",
      max: "number",
      step: "number",
      confirm: "boolean",
      optionSource: "select",
    }[field.key];
    if (expected && field.type !== expected)
      throw Error("系统属性注册类型不兼容");
    const result = {
      key: field.key,
      label: String(field.label || field.key).slice(0, 80),
      type: field.type,
      description: String(field.description || "").slice(0, 300),
    };
    for (const key of ["min", "max"])
      if (field[key] != null) {
        if (!Number.isFinite(field[key])) throw Error("属性范围无效");
        result[key] = field[key];
      }
    if (result.min != null && result.max != null && result.min > result.max)
      throw Error("属性范围无效");
    if (field.type === "select") {
      if (
        !Array.isArray(field.options) ||
        !field.options.length ||
        field.options.length > 50
      )
        throw Error("属性选项无效");
      result.options = field.options.map((option) => ({
        value: String(option.value).slice(0, 100),
        label: String(option.label || option.value).slice(0, 100),
      }));
    }
    if (field.default !== undefined)
      result.default = validatePropertyValue(result, field.default);
    return result;
  });
}
function validatePropertyValue(field, value) {
  if (
    field.type === "number" &&
    (!Number.isFinite(value) ||
      (field.min != null && value < field.min) ||
      (field.max != null && value > field.max))
  )
    throw Error("属性数值超出范围：" + field.label);
  if (field.type === "boolean" && typeof value !== "boolean")
    throw Error("属性需要布尔值：" + field.label);
  if (
    ["string", "select"].includes(field.type) &&
    (typeof value !== "string" || value.length > 1000)
  )
    throw Error("属性需要文本：" + field.label);
  if (
    field.type === "select" &&
    !field.options.some((item) => item.value === value)
  )
    throw Error("属性选项无效：" + field.label);
  return value;
}
export function normalizeControlValues(definition, raw = {}) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw))
    throw Error("控件属性值无效");
  const result = {};
  for (const field of definition?.properties ||
    defaultControlProperties(definition?.type))
    if (Object.hasOwn(raw, field.key) && raw[field.key] !== undefined)
      result[field.key] = validatePropertyValue(field, raw[field.key]);
  return result;
}
// Editor property changes must update the definition sent to the save API,
// not just a Preview component's ephemeral instance props.
export function withControlPropertyDefault(definition, key, value) {
  const item = normalizeLibraryControl(definition);
  if (!item.properties.some((field) => field.key === key))
    throw Error("未注册的控件属性：" + key);
  const values = normalizeControlValues(item, { [key]: value });
  return normalizeLibraryControl({
    ...item,
    properties: item.properties.map((field) => field.key === key
      ? { ...field, default: values[key] } : field),
  });
}
export function effectiveControl(control) {
  const definition = resolveLibraryControl(control);
  const props = control.type === "text" && libraryVariant(control) === "quote"
    ? { valueAlign: "center" } : {};
  for (const field of definition?.properties ||
    defaultControlProperties(control.type, libraryVariant(control))) {
    if (field.default !== undefined) props[field.key] =
      definition?.id?.startsWith("builtin.") && ["number", "slider", "progress"].includes(control.type) && definition.version === 1 &&
      hasNative(definition.ui) && field.key === "valueAlign" && field.default === "flex-start"
        ? "center" : field.default;
    if (CONTROL_FIELDS.includes(field.key) && control[field.key] !== undefined)
      props[field.key] = control[field.key];
  }
  Object.assign(props, control.props);
  const result = { ...control, props };
  for (const key of CONTROL_FIELDS)
    if (props[key] !== undefined) result[key] = props[key];
  if (props.hideUnit) result.unit = "";
  return result;
}
export function controlUnit(control, state) {
  return control.props?.hideUnit ? "" : control.unit || state?.unit || "";
}

export function resolvePropertyStyle(style, props = {}) {
  const resolved = Object.fromEntries(
    Object.entries(style || {}).map(([key, value]) => [
      key,
      typeof value === "string"
        ? value.replace(/\{\{props\.([a-zA-Z][a-zA-Z0-9_]*)\}\}/g, (_, name) =>
            String(props[name] ?? ""),
          )
        : value,
    ]),
  );
  try {
    return validateStyle(resolved);
  } catch {
    return {};
  }
}
