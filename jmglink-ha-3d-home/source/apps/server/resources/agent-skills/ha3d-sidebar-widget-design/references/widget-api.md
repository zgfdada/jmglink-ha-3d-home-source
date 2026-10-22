# 控件接口

完整字段见本目录 sidebar.js，完整示例见 ../assets/sidebar-example.json。

## 布局

`format: ha3d-sidebar-v1`，`width: 280..560`。widgets: id/name/kind=custom/scriptMode/entityId/entityDomain/entityAttribute/accountNames/html/css/js。pages: id/name/icon/color/items；items: id/widgetId/entityId/height。height 是历史兼容字段（100..1000），当前渲染以自然高度为准。名称和 ID 必须唯一且引用有效。icon 为文本图标，color 为 #RRGGBB。

entityId 精确绑定；为空时按 entityDomain 和可选 entityAttribute 属性名选择实体。页面 item.entityId 覆盖控件默认实体。accountNames 为实体 ID 到显示名称的映射。实体快照字段：entityId/name/state/attributes/lastChanged/lastUpdated。

## transform 模式

JS 在 Worker 内运行，1 秒超时。输入 `entity`、`widget.name`，返回 HTML 模板数据。`{{字段.路径}}` 按文本插入；`data-each="forecast"` 重复数组节点（最多 100 项）。HTML 不能添加事件或脚本；保留的属性包括 class/style/title/role/aria-label/data-each/data-clock。CSS 可编辑。无网络、父页面、存储或设备权限。

## dom 模式

JS 在 sandbox=allow-scripts 的不透明来源 iframe 内运行，输入 entity、entities（数组）、viewContext（theme/expanded/section/accountId/accountNames）。可以操作本 iframe DOM 并监听自定义事件 `ha3d-entities`，event.detail 为最新 entity/ entities。entity 更新不重新加载脚本，事件处理必须保持当前选择。

CSP 禁止网络连接、表单提交和同源访问，不提供 HA Token 或服务调用。只能使用包内/宿主明确提供的资源；ECharts 5.4.3 已由宿主本地加载。不要读取父页面 DOM，不要无限循环。

主题变量由宿主更新，无需重新生成 iframe。不要向父页面发送任意命令。能耗现有详情协议为 `parent.postMessage({type:'ha3d-open-detail',section:'month'|'last-month'|'year'|'balance',accountId:实际实体ID},'*')`；宿主检查 event.source 后在 Portal 浮层中渲染同一控件，viewContext.expanded=true。该协议用于本控件已实现的统计视图，其他控件需要先确认宿主支持的交互，不能凭空约定新权限。

宿主自动计算自然高度。所有 iframe 内部背景透明，不自设全屏高度；交互详情也由外层浮层整体滚动。样式不要覆盖宿主容器。修改卡片时保留实际业务状态，不把默认演示名称当成真实户名。

## 多实体绑定
`entityIds: null` 表示自动选择或继承；数组表示精确选择（空数组表示清空）。页面实例优先于控件默认值。脚本的 `entity` 是首个生效实体，`entities` 是完整生效列表；DOM 模式的更新事件同样仅包含绑定列表。编辑器下方显示解析后的实体名称和 ID。
