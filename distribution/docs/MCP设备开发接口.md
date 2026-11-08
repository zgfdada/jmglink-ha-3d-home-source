# MCP 设备开发接口

状态：未发布的本地开发能力，随正式应用版本发布后才进入对应发行镜像。不代表其他 HA App 或 NAS 实例已升级。

先调用 `system.capabilities`、`home3d.schemas.get`，按实际工具列表工作。工具中的 `projectId` 是授权楼层项目，`deviceProjectId` 是设备开发项目，两者不可混用。设备平台和库为共享数据，必须覆盖所有项目范围；不因升级自动扩大旧权限。代码写入继续要求 `home3d.code.write`，设备平台写入要求 `home3d.project.replace` 和 `home3d.publish`；HA 状态还需启用连接和明确实体范围。

## 能力清单

| 领域 | 工具与操作 |
| --- | --- |
| 模型与资源复用 | `home3d.library.list` 分页搜索本地模型、动效、控件，返回引用；修复旧 catalog 只列 builtin 导致空模型列表的问题 |
| 设备项目 | `home3d.device.projects_list/project_get`，读取定义、映射、模型、面板、生命周期及能力依赖 |
| 实体设计信息 | `ha.devices.list`、`ha.entities.details`，提供授权实体的设备 ID、原始状态、选项、数值范围等有限元数据 |
| 设备基础与实体绑定 | `home3d.device.plan` 的 create/basic、rebind/extra_entities、capabilities |
| 外观与交互 | 同上 appearance/motions、runtime_display/control_panel；动画资源使用完整参数快照 |
| 单件场景组合 | `home3d.scene.objects_plan` 批量 upsert/delete 明确家具和设备实例；原有 project_full 工具继续可用 |
| 素材与模型 | `home3d.transfer.stage` 分块上传；library.plan 的 model_file 替换／新建本地文件，model_delete 先查设备和场景引用 |
| 动效资源 | library.plan 的 motion_save/delete/reset/import，library.export 导出；默认值变化不修改已保存规则 |
| 控件资源 | library.plan 的 control_save/delete/rollback/import，library.export 导出；有引用删除需明确 confirmReferences |
| 模型结构 | `home3d.model.parts_get` 读取普通模型部件的 path、原始 name、中文 label、局部变换、SHA256 与可靠性标记 |
| 校验与模拟 | `home3d.device.diagnostics` 和 preview；检查引用、配置阻塞、条件匹配和离线恢复，不执行真实设备服务 |
| 单设备生命周期 | device.plan 的 test_simulation、release_draft、publish_local；沿用原诊断、版本递增和警告确认规则，仅在本地设备库发布 |
| 设备包与临时文件 | device.package_export、transfer.read/discard；import_package 创建未绑定 HA 的草稿 |
| 计划恢复 | changes.rollback.plan 支持设备配置和资源；后续变更使恢复计划失效。导入产生的新对象与已发布设备版本需单独指定删除／新版本计划 |

## 写入流程

1. 读取设备／资源和 `revision`；场景使用项目 `version`。先检索现有资源，不隐式新建模型。
2. 调用 schemas.get 查看 value 字段，生成 device.plan 或 library.plan；传 `expectedRevision`。capabilities、motions、appearance、panel 是完整集合／配置，先合并原值。
3. 读取 changes.inspect／changes.validate，再用唯一幂等键 changes.apply。计划及应用复核权限、实体、修订和模型文件内容，MCP 共用模式无需额外人工审批。
4. 应用后回读、诊断、条件模拟；有实际视觉变化时再做前端验收。幂等重复返回原结果，冲突后重新读取，不覆盖其他页面保存。

基础配置不能夹带能力、绑定或外观以绕过专用校验。能力映射只引用已选择的主设备或额外实体，拒绝映射秘密属性；配置和本地发布不会触发 HA 服务。共享数据读写不会反向授予 HA 控制权限。

## 文件与临时存储

模型最大 15 MiB、单设备／资源包最大 32 MiB，每块原始字节最多 256 KiB，单个 MCP 请求保持 2 MiB 上限。首块传 fileName、totalBytes、SHA256、offset=0 和 dataBase64；后续传 transferId、offset 和分块内容。允许字节相同的重复块，不接受错位覆盖。文件完成时校验整体哈希；模型拒绝 GLB/GLTF 外部缓冲区、纹理 URL 与服务器文件路径。

临时文件位于 MCP 私有目录的 transfers；UUID 不接受用户路径，按客户端归属读取，有效一小时。到期文件在下次传输操作中清理，不创建后台任务；未被有效计划／恢复快照引用的文件可主动 discard。模型替换／删除前保存原文件快照，恢复受原快照有效期限制。

## 尚需前端的具体边界

- MCP 条件模拟不执行自定义 JavaScript、GLSL，不生成真实渲染截图；静态检查不能被称作动画实播或实机测试。
- 蒙皮、多 primitive、扩展生成子节点等结构无法静态保证与 GLTFLoader 部件树一致时，明确标记 reliable=false；此时动画目标需前端确认，不猜路径。重名或未命名节点不能作为静态可信身份。
- 浏览器个人偏好、相机漫游操作、真实设备动作和系统部署沿用各自权限边界；本次没有开放任意宿主命令、任意 HA 管理服务或外部 URL 抓取。

Skill v1.1 要求：MCP 优先；模型先复用；现有资源不合适时由用户选择修改／新建单件资源；模型、摆放和特效先提供真实可看的效果图／示意图并确认；成套设备按独立模型实例组合。
