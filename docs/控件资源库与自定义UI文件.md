# 控件资源库与自定义 UI 文件

## 入口与管理

打开设备开发中心，选择左侧“控件资源库”。初始提供现有 13 类控件的 39 种风格，包括开关、按钮、选择器、滑块、数字、进度、状态、文本、图标、统计、富文本、分割线和容器。

所有内置与用户控件均可查看、搜索、筛选、编辑、复制、停用、删除和导出。修改时版本号递增；控件 ID 创建后不变。编辑器以控件名称、适配数据类型和 UI 代码为中心，不再选择控件类型或基础风格。数据类型使用多选（布尔值、数值、字符串、枚举、动作）。内置风格会展开为可编辑的布局、交互节点与局部样式代码，保留旧文件兼容。

修改代码后点击“预览”：先校验 JSON 语法、节点、动作及样式，成功后仅热更新预览组件，不刷新页面、不写入数据、不发送 HA 指令；校验失败保留上一次有效预览。点击“应用并保存”持久化新版本；再次编辑后需重新预览。“回退上一版”恢复上次保存的定义并保存为新版本，重启后仍可回退；已有面板快照保持原样。

编辑器右侧“控件默认属性”同步修改 JSON 中 `properties[].default`，校验后随“应用并保存”持久化；查看窗口中的模拟属性不写入控件。数值、引用文本、滑块、进度内容默认居中，可配置左、中、右对齐；标题位置不变。大字数值及引用文本使用大号粗体，环形进度仅显示圆环内的数值。

删除正在使用的控件会先显示引用数量并要求确认；已有面板继续使用其版本快照。删除记录保存在本地控件库文件，重启不会自动补回内置条目。误删后可从之前导出的控件库包重新导入。

## 在设备面板中使用

在“控制面板”步骤的左侧控件库中搜索、点击或拖入控件。在中间“当前选中控件的样式”选择库内同类控件可切换风格或应用新版本。控件实例保留能力绑定、位置、大小等属性，保存所用控件的 ID、版本和完整 UI 快照。

更新库中的某个风格不会自动修改已使用它的设备面板。需要升级时选择对应的新版本再保存。已停用或已删除的控件不再出现在可选列表，已有面板仍可正常显示。

## UI 文件格式

本版导入单个 JSON 文件，最多 2 MB，最多 500 个控件；每个控件最多 64 KB。可以从界面的“下载示例”或 [玻璃数字控件.json](examples/玻璃数字控件.json) 开始修改。

```json
{
  "format": "ha3d-control-library",
  "schemaVersion": 1,
  "controls": [
    {
      "id": "custom.my-number",
      "name": "我的数字指标",
      "type": "number",
      "variant": "metric",
      "category": "data",
      "dataTypes": ["number"],
      "width": 2,
      "version": 1,
      "enabled": true,
      "style": {"borderRadius": "16px"},
      "ui": {
        "kind": "column",
        "children": [
          {"kind": "label"},
          {"kind": "row", "style": {"alignItems": "baseline"}, "children": [
            {"kind": "value", "style": {"fontSize": "32px"}},
            {"kind": "unit"}
          ]}
        ]
      }
    }
  ]
}
```

导入会创建独立的 `custom.import-*` ID，不覆盖本地原控件。

### 支持的节点

| kind | 内容 |
| --- | --- |
| column / row / grid | 列、行、网格布局；通过 children 组织子节点 |
| text | 通过 text 显示文字，可以使用占位符 |
| label / icon / value / unit | 当前面板实例的标题、图标、格式化状态和单位，可单独安排位置和样式 |
| options | 枚举选项，mode 为 buttons / grid / dropdown / boolean；itemStyle 与 activeStyle 调整选项及选中状态 |
| input | mode 为 number / range，使用平台数值输入与上下限检查 |
| switch / progress / divider | 开关、进度、分隔线节点，style 控制本地外观 |
| native | 复用 type、variant 指定的原生控件，保留标准交互 |
| button | 使用 action 声明平台动作 |

文字占位符：`{{label}}`、`{{icon}}`、`{{value}}`、`{{unit}}`、`{{rawValue}}`。状态和值由平台提供，文件不包含具体 HA 实体 ID 或凭据。

按钮动作：`toggle` 仅用于开关，`increment` / `decrement` 用于数字与滑块，`press` 用于按钮。读写权限、上下限、确认操作和模拟/真实控制接口由平台负责；模拟预览不发送 HA 指令。使用 `native` 可获得下拉选择、按钮组选项、数字输入等完整交互。

### 样式

使用 JSON 样式属性，不注入全局 CSS。支持颜色、背景、边框、圆角、内边距、间隔、字体、对齐、阴影、不透明度、宽度和高度限制等属性；例如 `color`、`background`、`borderRadius`、`padding`、`gap`、`fontSize`、`fontWeight`、`alignItems`、`justifyContent`。

未设置背景时继承设备面板的玻璃风格。文件不执行 HTML / JavaScript，不支持远程资源、CSS URL 或覆盖页面的定位属性。UI 层级最多 8 层、节点最多 100 个。

## 数据、备份与一致性

- 数据文件：部署数据目录中的 `control-library.json`；写入时保留 `.bak`。
- 整体项目备份包含完整控件库。
- 单设备项目包随面板携带所用控件的 UI 快照，导入后可以继续渲染。
- 资源库预览、设计器、联调与全屋均使用 `components/device-panel.jsx`，相同配置与状态共用渲染和局部样式。

标题和图标不是独立数据类型：库内定义展示位置和样式，面板实例仍填写具体标题和图标。库的图标提供新实例默认值；已有实例自定义内容保留。文件中的 type / variant 仅作为旧格式的兼容元数据，新的声明式 UI 通过 dataTypes 适配能力。

## 单一 UI 代码编辑框

编辑器只提供一个“完整 UI 代码（JSON）”输入框，统一使用 `{ "style": { ...外框样式 }, "ui": { ...内部结构 } }`。内部节点的 style 与整个控件外框的 style 可在同一份代码中修改，一次校验、预览、保存和回退。导入导出的控件包格式及已有面板快照保持兼容。

控件网格不再强制 80px 最小行高，外框按内容高度收缩，同一行不再拉伸短控件。需要固定最低高度时在完整 UI 代码最外层 style 中设置 minHeight，例如 "minHeight": "40px"。同一行的下一行起点仍由该行最高控件决定。拖放按浏览器实际网格行高定位。

## 注册可配置属性

完整 UI 代码新增 properties 数组，定义每个实例能配置的属性。支持 string（文本）、number（数值）、boolean（复选框）、select（下拉框）；字段可配置 key、label、default、description、min/max 和 options。编辑器预览及面板右侧共用自动生成的表单。properties 设为 [] 可移除所有控件专属配置；绑定能力、位置和显示条件仍属于平台通用配置。

示例：

```json
{
  "properties": [
    {"key":"unit","label":"单位","type":"string","default":"分钟"},
    {"key":"valueAlign","label":"数值对齐","type":"select","default":"center","options":[{"value":"flex-start","label":"左对齐"},{"value":"center","label":"居中"},{"value":"flex-end","label":"右对齐"}]}
  ],
  "style": {"padding":"6px 8px"},
  "ui": {"kind":"row","style":{"justifyContent":"{{props.valueAlign}}","alignItems":"baseline"},"children":[{"kind":"value","style":{"fontSize":"28px"}},{"kind":"unit"}]}
}
```

单位不再使用资源库预览写死的 min。unit 配置为空时读取能力或 HA 的单位；hideUnit=true 时隐藏单位。自定义属性值可在 text 文本或节点样式中通过 {{props.属性键}} 使用；属性替换后的样式仍经过局部样式校验。属性注册和实例值分别存入库定义快照与控件 props，随保存、回退及设备包备份保留。已有快照缺少 properties 时按原控件类型补齐兼容注册，新增注册和默认值需在设计器中选择库内新版本后生效。
