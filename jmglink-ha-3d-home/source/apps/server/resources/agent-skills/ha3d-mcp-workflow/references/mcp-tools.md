# MCP 操作速查

先读当前工具列表、`system.capabilities`、`home3d.schemas.get`。本表说明新版接口；旧服务没有接口时不可虚报可用。

| 任务 | 优先工具 |
| --- | --- |
| 楼层项目与侧栏 | `home3d.projects.list`、`home3d.project.get`、`home3d.sidebar.get`、既有 draft 工具 |
| 检索单件模型、动效和控件 | `home3d.library.list`，kind 为 models/motions/controls；使用分页与 search，先复用 |
| 设备开发项目 | `home3d.device.projects_list`、`home3d.device.project_get` |
| 实体信息与主设备选择 | `ha.entities.details`、`ha.devices.list`；只读取授权实体的状态、选项、范围等元数据 |
| 模型部件 | `home3d.model.parts_get`；使用 path、name、identityTrusted、reliable 与 sha256 |
| 设备定义与绑定 | `home3d.device.plan`：create/basic、rebind、extra_entities、capabilities |
| 模型外观、动画和控制面板 | 同上：appearance、motions、runtime_display、control_panel |
| 模型文件与资源库维护 | `home3d.library.plan`：model_file/model_delete、motion_save/delete/reset/import、control_save/delete/rollback/import |
| 单件模型批量组合与删除实例 | `home3d.scene.objects_plan`；修改明确对象，保留无关摆放 |
| 校验与条件模拟 | `home3d.device.diagnostics`、`home3d.device.preview`；不控制 HA，不渲染，不执行主机代码 |
| 单设备生命周期 | `home3d.device.plan`：test_simulation、release_draft、publish_local；仅本地设备资源版本，不是应用正式发行 |
| 导入导出 | `home3d.transfer.stage/read/discard`、`home3d.device.package_export`、`home3d.library.export`；设备包导入后重新绑定 HA |
| Node-RED | `nodered.flows.get`、`nodered.configs.list`、`nodered.flow.plan`；scope 与 tab 范围继续生效 |
| 应用与恢复 | `changes.inspect/validate/apply/status/rollback.plan`；唯一幂等键，冲突后重新读取 |

设备项目和资源库是跨楼层共享数据，读取和修改需要相应项目范围。写入继续要求既有 project.replace/publish，脚本要求 code.write；不能自行扩大旧客户端权限。设备平台计划使用读取返回的 `revision` 作为 `expectedRevision`，场景计划使用项目 `version`。字段不清楚时调用 `home3d.schemas.get`，不要凭空组装。

capabilities、motions、appearance、panel 等是完整集合／配置，先读取再合并；basic 是明确基础字段补丁。额外实体选择替换 extraEntityIds，保留主设备。删除资源前查看引用，不能把用户没有要求的解除引用作为默认行为。

模型文件最大 15 MiB；设备包最大 32 MiB。按不超过 256 KiB 的原始字节分块，计算完整 SHA256；首块提供 fileName/totalBytes/sha256/offset，后续传 transferId/offset/dataBase64。完成校验后在计划中引用 transferId，不传服务器文件路径、远程模型 URL 或凭据。临时传输有效一小时，到期后下次传输操作清理；未被有效计划引用的文件可主动 discard。恢复模型文件依赖其未过期暂存快照。

`home3d.model.parts_get` 对普通自包含 GLB/GLTF 提供静态树；蒙皮、多 primitive、扩展生成节点等标记为不可靠，需实际渲染器确认。模拟返回匹配规则，不代表声波、着色器或多角度画面已验收。MCP 可完成的配置先完成，前端只补齐明确缺口及视觉验收。

## 运行浮窗取消与回退排查

适用于用户要求隐藏设备运行浮窗、同时保留状态驱动的部件动画。以下为已验证实现行为，服务版本变化时重新核对字段与渲染行为。

- `runtimeDisplay.statusCapabilityId` 会启用运行浮窗；通过 `home3d.device.plan` 的 `runtime_display` 操作传入 `value: {runtimeDisplay: null}` 可清除该配置，但这一步不一定足够。
- `appearance.animation.statusCapabilityId` 非空时，当前服务还会生成模型的 `capability-runtime`（洗衣机可为 `top-load-washer`）运行效果。即使 `runtimeDisplay` 已清空，全屋仍可能出现浮窗；默认文案可能回退为“洗衣中”。
- 对使用独立部件动效的设备，可读取完整 `appearance`，只把 `animation` 改为 `{statusCapabilityId: "", remainingCapabilityId: "", activeStates: []}`，然后通过 `appearance` 操作连同原 `modelTemplateId` 保存。完整保留尺寸、材质、部件标签、`partMotionRules`、能力映射及其绑定。不要为隐藏浮窗直接删除运行实体、关闭设备或移除音波规则。
- 同时读取模型配置，确认是否自带 `runtimeEffect`。清空通用联动后仍有浮窗时，检查这一来源；共享模型先核对全部引用，不能连带破坏洗衣机等其他设备的专用动画。无法在现有配置接口内分离时，说明限制，不修改应用源代码或绕过 MCP。
- 使用最新修订号生成计划，校验并以唯一幂等键应用；同一设备类型的多个场景实例会共享设备项目配置，应覆盖用户指定的全部设备类型。
- 回读并比较修改前后的部件规则；条件模拟检查运行、停止和离线分支。随后刷新全屋页面，在已有运行状态或已授权的模拟环境中检查浮窗消失、动画保留并保存截图。真实设备动作仍按当次授权范围执行；无法进行运行状态画面验收时明确标注未验证项。
- 发布诊断可能把“尚未配置运行浮窗”列为阻塞项。这与用户要求隐藏浮窗是两个问题，不得为通过诊断自动恢复浮窗；未执行设备资源发布时不宣称已发布。
