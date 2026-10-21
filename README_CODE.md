# JMGLink HA 3D Home Custom 开发手册

本仓库 `zgf/jmglink-ha-3d-home-source` 为公开源码仓库。当前历史从本次初始提交开始，历史源码和 Git 记录已在本地另行归档，不放入此仓库。

本地源码目录：`C:\Nas_Gitea\jmglink-ha-3d-home\jmglink-ha-3d-home`。公开安装库 `zgf/jmglink-ha-3d-home-custom` 保持独立，本地检出位于 `C:\Nas_Gitea\jmglink-ha-3d-home-installation`。

公开安装内容由 `distribution/` 和 `distribution-manifest.json` 维护。正式发布保留现有测试、混淆、双架构镜像、latest 更新与安装库同步流程；Secrets 仅保存在 Gitea，不进入源码。当前发布说明使用 `RELEASE_NOTES.md`，不保留旧 CHANGELOG 文件。

v23 发布处理：业务源码保持原样；`source/scripts/package-release.mjs` 将服务、schema 和前端产物复制至固定 `.release` 目录后混淆 JavaScript，完成后核对业务源文件哈希。Vite 仅在 `HA3D_RELEASE_BUILD=1` 时压缩并关闭 source map，开发配置保持可读。Add-on Dockerfile 只把 `.release` 与生产依赖复制到运行层；普通 CI 与正式发布显式启用发布模式。混淆固定使用离线 javascript-obfuscator 4.1.1，禁用属性改名、控制流膨胀、死代码和调试器干扰，保留 ESM 导入导出及接口字段。

镜像根目录 `release-manifest.json` 记录处理文件 SHA-256；发布冒烟验证清单、无 source map、实际混淆后端、配置、语音回复恢复及 skill ZIP。接入 skill 的可读文档与参考脚本、第三方依赖及启动适配脚本不混淆；它们与业务运行产物的范围分别记录，不能宣称镜像完全隐藏全部源码。混淆不替代权限或密钥保护。

用户安装统一使用 `docker-compose.release.yml` 拉取固定版本镜像；独立入口覆盖为 Node main 并设置 standalone，App 保留 Supervisor 入口。旧部署迁移沿用原数据／素材挂载且不得双容器并发写入。README 与 Wiki 不再提供本地编译部署步骤；本文件保留内部架构和维护约束。

v22 回复协议：`start` 复用 `message` 的请求指纹、锁与去重缓存，立即返回 accepted；执行 Promise 在服务端保存最终 result 或脱敏 error，`interaction` 为原 clientSessionId/requestId 返回 running/completed/failed。HTTP 断开不取消服务端执行。`voice-interaction.js` 仅提交一次 start，恢复时只读原 ID，保留澄清及单次回答。完成结果保留 10 分钟，进程重启后不可恢复；原同步 message 路由保留兼容。发布运行镜像检查必须使用实际构建的前端协议，覆盖提交响应丢失和进度 502，确认仅执行一次。

语音来源校验：Ingress 会改写后端 Host。写接口优先接受浏览器 `Sec-Fetch-Site: same-origin`，拒绝 same-site/cross-site；无 Fetch Metadata 时仅兼容 Origin/Host 相同，不根据任意转发头放行。服务端配置跨终端共享，clientSessionId 及澄清答案仍隔离。真实 Ingress 验收必须携带浏览器来源头并创建独立会话，不能仅用无 Origin 的脚本请求作为多终端通过证据。

语音助手配置：`app/voice-assistant-settings.jsx` 提供麦克风右键菜单及配置对话框；`voice-assistant/VoiceAssistant.js` 持久化脱敏配置、分流 HA/Hermes、缓存请求 ID 及互斥请求。`Ue()` 不自动重试设备指令。Hermes 通过 `integrations/hermes-telegram-bridge` 平台插件进入现有 Telegram adapter，同一聊天／话题沿用原会话与队列，桥接不创建第二个 Agent 或 poller。普通 Hermes API 与共享 TG 网关不能混用。配置及部署见 [语音助手配置](docs/语音助手配置.md)。JS 回归为 `tests/voice-assistant.test.mjs`，Hermes 插件回归为 `integrations/hermes-telegram-bridge/test_bridge.py`。

默认风格调整：`home-view.js` 的 `In()` 在无有效缓存、存储读取异常及无 window 环境下回退到 `cartoon`；仍优先采用浏览器已保存的有效风格，不覆盖用户选择。

语音录入由 `domain/push-to-talk.js` 管理每次长按的识别会话：按结果索引读取累计快照，只保存 `isFinal` 文本，必须同时满足松开与 `onend` 才提交。提交前关闭会话，重复和旧会话回调无法重发；多段最终结果合并，未确认的中间结果不作为设备指令。松开后 5 秒未结束时取消并提示重试，不发送可能残缺的语句。`app.js` 使用稳定 ref 转发最新提交函数，以同步 ref 锁保护请求，避免识别回调持有旧的 React busy 状态；pointercancel、意外失去捕获、页面隐藏及卸载均取消会话。使用 pointer capture 接收按钮外的松开事件，移出按钮不提前提交；正常松开先清除按下标记，再释放捕获，避免被误判为取消。回归见 `tests/push-to-talk.test.mjs`，包含实际组件的回调执行测试；不替代真实麦克风与 HA Add-on 验证。

主页固定 `overview`，整个底部模式栏及模式数组已移除，不再显示“全屋”文字或图标；`home-insight-panel` 仅在选中设备或摄像头时出现，不再展示情景快捷卡片。其他位置的情景管理及 HA 情景实体不变。2D 空白画布右键平移由 `domain/editor-canvas-pan.js` 判断：选择工具、无选中、非触控、无修饰键且未命中对象；房间的 pointerdown 仅对此平移手势放行，单击选择仍保留。家具自身右键拖动优先，左键恢复选择/框选，Shift/Ctrl/Meta 保留选择语义。平移位移达到 3px 时抑制后续点击。绘图、触控、空格和原中键行为保留。`editor-canvas-pan.css` 提供高对比度提示。回归见 `tests/editor-canvas-pan.test.mjs`。

厨房柜身越界斜线已定位到旧挤出器的封面三角化：原厨房轮廓存在浮点噪声级共线点，恢复版挤出器生成 40 个三角面，其中顶底各有一个零面积面。`domain/cabinet-body-geometry.js` 仅在生成柜身几何时移除冗余共线点，使用当前几何库挤出；实际厨房柜身变为 28 面、零退化面，20 个现有柜身审计均无退化面。`scene.js` 的 `CabinetBodyGeometry` 同时供普通与分段上柜使用，几何尺寸变化或卸载时释放资源。原始柜段数据、门板分界、颜色、材质及阴影不变。回归见 `tests/cabinet-body-geometry.test.mjs`，覆盖凹多边形、逆向轮廓、体积与面积、浮点共线点及重复闭合点。用户在同角度隔离复测确认两条斜线均消失。

无效的柜门材质/阴影、原生描边替换及墙体不透明试验已撤回，临时 `renderProbe` 与诊断标识已移除；不要将此前猜测保留为根因。本版纳入正式镜像；发布不自动修改 HA 部署。

场景薄件几何由 `source/apps/web/src/domain/stable-surface-geometry.js` 提供：使用稳定圆角盒，半径不超过最薄尺寸的 24%，避免圆角内核归零及恢复版法线合并造成的斜纹。`scene.js` 的共用家具 `H` 在卸载或尺寸变化时释放几何；共用描边 `Y` 强制 `depthWrite: false`、`depthTest: true`，保留实体遮挡与正常门缝。回归见 `source/tests/stable-surface-geometry.test.mjs`，检查退化面、有限法线、尺寸边界和描边策略。此修复纳入本版镜像；不代表任意导入模型自身的重叠面、材质或阴影问题都已消除。

失效摆放恢复由 `domain/missing-device-placement.js` 和 `app/missing-device-placements.jsx` 提供。仅 HA 已连接且实体 ID 不在当前实体表时标记失效；2D 编辑器和共享 3D 场景绘制独立黄色警告，设备侧栏通过现有 `F` 更新入口执行删除、替换，沿用撤销和保存流程。替换更新实体、设备、模板和模型引用，保留空间数据；候选排除当前层其他已摆放物理设备，同设备实体优先。原名称优先使用摆放快照，再通过只返回名称的 `/api/ha/entity-names` 读取历史名称；新摆放与替换会保存 `name`，Schema 保留该字段。侧栏使用紧凑三列与可搜索弹出选择器，3D 警告使用半透明背景。相关回归见 `tests/missing-device-placement.test.mjs`。

本文面向参与源码维护、功能开发、测试和发布的开发者。安装与日常使用请阅读 [README.md](README.md)，版本变化请阅读 [RELEASE_NOTES.md](RELEASE_NOTES.md)，运维接手流程请阅读 [服务交接文档](docs/HA3DHome服务交接文档.md)。

## 项目介绍

JMGLink HA 3D Home Custom 是一个由 Fastify 后端、React 前端、Three.js 场景和共享户型 Schema 组成的 Home Assistant 3D 户型应用。它支持两种运行模式：

- `standalone`：作为独立 Docker 服务运行，通过用户配置的 HA 地址和长期访问令牌连接 Home Assistant。
- `addon`：作为 Home Assistant Add-on 运行，通过 Supervisor API、Ingress 和 `SUPERVISOR_TOKEN` 连接当前 HA。

当前源码基于官方 `0.1.5` 镜像中的 JavaScript 运行产物恢复。恢复工程已经可以安装依赖、运行测试、构建前端并生成 Docker/Add-on 镜像，但无法还原原始变量名、注释、TypeScript 类型和完整组件边界。因此开发时应优先把新逻辑提取到具名模块，逐步减少对大型恢复文件的直接修改。

设备开发中心的模型缩略图共用 `domain/webgl-preview-pool.js`，最多同时占用 6 个 WebGL context。缩略图离开视口、切换数据或卸载时须释放渲染器并显式丢弃 context；关闭开发中心时只重建主页场景画布，不重置主页交互状态。排查“主页模型偶发空白”时先核对 context 数量和 `webglcontextlost`，不要直接改动用户户型数据。

能力状态将连接状态和实体取值分开判断：`unknown` 为状态未知，`unavailable` 为实体不可用，两者均不解除映射；仅全局连接断开显示 HA 离线。注册表同步读取实体的 `platform/translation_key`，通过 `frontend/get_translations` 获取 `zh-Hans` 的 `entity` 与 `entity_component` 词典，按集成实体、设备类别、实体域默认翻译的顺序生成 `stateLabels`。同连接及相同集成集合缓存 1 小时，失败时短暂缓存并降级，不能阻断设备发现；重新连接会重新获取。只为当前状态和 `options` 生成标签，不依据整份词典增加设备支持的选项；离线历史保留已取得标签。

`packages/schema/src/device-value-labels.js` 共用显示标签：用户显式自定义优先，其次 HA 翻译、已知后备标签、原值。枚举的可选 `labelSource` 记录 `custom/ha/fallback/raw`，避免自动翻译刷新时覆盖人工名称，或旧的后备名称遮挡 HA 翻译；旧配置中已修改的名称继续保留。原始 `value` 始终用于选中判断与服务调用。联调选项以实体当前 `options` 为准，避免旧配置中的无效模式继续出现。

当前项目版本：

- Add-on 当前版本：`0.1.5-custom.23`（真实 HA Add-on 运行待用户安装后验证）
- 项目 JSON Schema 版本：`7`
- Node.js：`22`
- 前端构建器：Vite `7`

## 技术组成

数值、滑块、进度及引用文本的内容对齐默认居中；旧内置原生定义缺少对齐注册时补齐，显式实例属性优先。数值输入和原生显示将 flex 对齐枚举映射成 text-align，可编辑值行通过 justifyContent 消费同一属性；自定义 UI 的属性注册不自动扩充。

`editableLibraryControl` 必须保留 API 的 `references` 展示元数据；持久化归一化仍排除该字段。控件库测试通过无 DOM 的 JSX 执行检查包含 39 个条目及预览的组件树（模拟 hooks，不代替真实浏览器视觉验收），防止仅构建通过却因丢失字段白屏。

控件默认外形需同时维护 `PanelControl` 原生渲染与 `editableLibraryControl` 展开布局；两者分别用于旧原生定义与可编辑 UI。内置 v1 原生大字数值的旧左对齐默认在归一化及实例有效属性解析时兼容为居中，显式实例属性仍优先，自定义布局和后续人工版本不覆盖。环形展开布局不附加重复的 metric 行。控件定义写入 `/data/control-library.json`，面板保留版本快照。编辑器默认属性必须通过 `withControlPropertyDefault` 回写 JSON `properties[].default`，刷新预览并使旧校验失效，随后走正常 PUT 持久化；不能仅写 Preview 的局部 props，否则保存请求不含用户更改。查看弹窗的模拟属性保持临时。回归包含 API 写入、磁盘读取、Store 重建及非居中值保存，防止只靠居中硬编码掩盖问题。

| 层 | 技术与职责 |
| --- | --- |
| Web 前端 | React 恢复模块、Three.js、HLS、Vite；负责项目管理、2D 编辑、3D 展示和 HA 控制 |
| 设备平台 | Device Registry 聚合、能力模板、全局绑定、上传模型和数据化控制面板；在线模型库采用服务端代理 Gitea 的可选方案 |
| API 服务 | Node.js、Fastify、WebSocket；负责静态页面、项目持久化、素材、HA 代理与状态广播 |
| Schema | 共享 ES Module 和类型声明；负责项目归一化、验证、旧数据迁移与房间拓扑计算 |
| Docker | 多阶段构建；构建阶段执行测试和 Vite 打包，运行阶段仅保留生产依赖与产物 |
| Home Assistant Add-on | Ingress、Supervisor API、固定 slug、多架构预构建镜像 |
| CI | Gitea Actions；构建并发布 `linux/amd64` 与 `linux/arm64` 镜像及多架构版本标签 |

## 代码结构

```text
jmglink-ha-3d-home-custom/
├─ README.md                         普通用户安装和使用文档
├─ README_CODE.md                    本开发手册
├─ RELEASE_NOTES.md                      项目版本更新日志
├─ docker-compose.source.yml         恢复源码版 Docker 入口，主机端口 8101
├─ docker-compose.room-filter.yml    旧运行产物覆盖版，仅用于历史对照
├─ Dockerfile.room-filter            旧运行产物覆盖镜像
├─ extracted-image/                  从官方镜像提取的运行产物基线
├─ scripts/
│  ├─ reconstruct-source.mjs         从运行产物重新生成恢复源码基线
│  └─ publish-addon-image.ps1        手动发布多架构 Add-on 镜像
├─ .gitea/workflows/
│  └─ publish-addon-image.yml        Gitea Actions 发布工作流
└─ jmglink-ha-3d-home/
   ├─ config.yaml                    Add-on 名称、版本、架构、镜像和权限
   ├─ Dockerfile                     Add-on 多阶段构建文件
   ├─ addon-entry.js                 Add-on 环境和配置入口
   ├─ DOCS.md                        Home Assistant 商店详情页
   ├─ RELEASE_NOTES.md                   Home Assistant 商店更新日志
   ├─ translations/                  Add-on 商店翻译
   └─ source/
      ├─ package.json                npm workspace 根配置
      ├─ package-lock.json           锁定依赖
      ├─ Dockerfile                  独立源码镜像
      ├─ tests/recovery.test.mjs     Node.js 业务回归测试
      ├─ apps/server/                Fastify 后端
      ├─ apps/web/                   Vite Web 前端
      └─ packages/schema/            共享项目 Schema 与房间拓扑
```

### Web 前端

```text
source/apps/web/src/
├─ entry.js                          浏览器入口
├─ app/
│  ├─ app.js                         应用路由、API、WebSocket 和连接状态
│  ├─ floorplan-editor.js            2D 户型编辑器与属性面板
│  ├─ home-view.js                   全屋展示页
│  ├─ scene.js                       Three.js 场景、墙体、家具和设备模型
│  ├─ device-development-center/      当前设备开发中心
│  └─ author-support-dialog.js       作者支持弹窗
├─ domain/
│  ├─ alignment-guides.js            水平/垂直辅助线与吸附算法；墙体中点平移只用法向轴，Shift 才允许端点磁吸
│  ├─ wall-handle-hit.js              短墙端点命中范围和中点平移手柄优先级
│  ├─ device-arrangement.js          设备共线检测、成线和等距排放
│  ├─ device-library.js              编辑器设备去重、空调优先级与保守房间匹配
│  ├─ furniture.js                   柜类识别与离地高度归一化
│  ├─ bathroom-fixtures.js           淋浴间样式、切角约束、墙边/玻璃边与 2D/3D 共用轮廓
│  ├─ cabinet-layout.js              柜体闭合外轮廓归一化、旧中心线迁移、柜门面、拆分、整边/顶点移动、共线合并与平行/垂直吸附
│  ├─ wall-straightening.js          墙链拉直、合并、整体平移和端点变换
│  └─ walls.js                       墙体分段和虚拟墙兼容
├─ styles/
│  ├─ index.css                      恢复的全局样式
│  ├─ device-development-center.css  设备开发中心样式
│  ├─ model-preview.css               设备中心与家具库共用模型预览样式
│  ├─ device-runtime.css             数据化设备控制面板样式
│  └─ editor-alignment.css           新增编辑功能样式
└─ vendor/                           恢复的 React、Three.js 和 HLS 运行模块
```

`floorplan-editor.js`、`scene.js` 和 `app.js` 仍包含较多恢复代码。新增可测试的几何、迁移和业务规则应放入 `domain/` 或 `packages/schema/`；大型恢复文件只负责状态连接和 UI 调用。

设备开发中心现由 `device-development-center/` 和 `device-development-center.css` 承载，`home-view.js` 只提供一个“开发中心”入口。旧版独立组件、样式及其专用克隆、旧面板/绑定写入接口已按用户明确要求移除；保留设备平台存储格式、模型文件服务、项目导入与户型备份所依赖的接口和迁移逻辑。家具库复用新中心的 `ModelPreview` 与独立 `model-preview.css`。视觉、布局和交互观感只由用户在现有服务中验收，Agent 不打开浏览器，仍必须完成测试、构建、后端及中间件 API、数据兼容和容器健康检查。N0–N10 的双入口说明属于历史验收记录；现行约束以本节为准。

完整备份和单项目设备包的下载名共用 `packages/schema/src/export-filename.js`，含名称、北京时间时间戳与版本，后端整体备份通过 `Content-Disposition: filename*` 传给前端；保留无关实际内容的 ASCII 兼容文件名。N7 面板设计器的待使用实体只统计 N4 已映射、尚未进入面板的能力；控件变体与右侧属性由项目面板 API 持久化，不增加可切换主题。

N5 文本模板沿用旧版通用解析器：常用插入菜单只提供 `{device.name}`、`{time.now}`、已映射能力的中文名称状态值；实际 HA 属性仍支持手写引用，但不在菜单列出。预计结束时间使用 `{{time.now} + {剩余时间}}`，旧内置变量保持只读兼容。状态能力为文本时允许设备实际值，不进行枚举缺值检查；枚举能力才校验失效选项。N6 通过 `domain/model-material-colors.js` 从上传模型材质提取原色，按原色保存当前项目的 `materialColors` 映射；未显式覆盖时保持 GLB/GLTF 材质原色和参数，资源库原件不变。N1 项目首页缩略预览使用当前项目模型及专属外观。

N7 在项目下通过 `PUT /api/device-platform/projects/:id/control-panel` 保存独立控制面板及项目/HA 绑定引用，不修改共享旧面板。`panel-designer-model.js` 定义类型兼容、四列网格吸附、占位下移、枚举显示项的 label/顺序/隐藏逻辑；拖拽落点从实际网格矩形计算，不能使用包含设备标题的外层画布坐标。面板数据保留原始 HA value。半透明主题固定，不向用户暴露配色主题选择；组件按类型使用 `variant` 字段保存结构形态，选择器继续使用 `selectStyle`（按钮组、下拉、平铺网格）。服务端只接受该控件类型支持的形态，旧 `visualStyle` 不再进入新数据；运行时保留相同的控件结构与 HA 服务语义。设计借鉴 Ant Design 和 Arco 的组件形态分类，不引入其 UI 包。编辑器预览仅为模拟值，运行时仍经现有能力绑定与标准 HA 服务执行，`layoutMode: grid` 时按单一画布位置展示。删除能力不清除控件，而由校验接口标记错误；撤销/重做保留当前会话最近 40 步。

新版“设备项目”首页以 `/api/device-platform` 中 `builtin !== true` 的自定义设备模板作为项目根集合；`/api/device-platform/devices` 只用于补充这些项目已绑定 HA 设备的在线状态、厂商型号和实体数量，禁止把未建立自定义项目的 HA 设备直接渲染为项目卡片。新建操作创建自定义设备模板项目，HA 设备与实体由 N3 基础信息页显式选择。

N2 在设备中心目录中实现“3D 模型资源库”：合并 `/api/device-platform` 的本地模型和 `/api/model-library/models` 的在线目录；在线预览和安装继续使用现有模型库 API，模型上传/配置继续使用设备平台 API。模型卡片的 3D 预览仅在可见区挂载，离开可见区后释放 WebGL 渲染器。模型 ID 固定，文件仅接受不超过 15 MB 的 GLB 或自包含 GLTF。收藏仅保存在当前浏览器本地。已被设备绑定或自定义项目引用的模型默认不可删除，强制删除后项目会显示模型引用失效。卡片“家具”按钮与配置页家具开关控制同一 `furnitureEnabled` 字段；启用家具不会解除设备模型用途，二者可同时使用。

N3 在新版 `device-development-center/project-detail.jsx` 实现项目详情和基础信息，保留七步导航并按节点开放后续步骤。项目模板新增子类型、厂商、型号字段，表单自动保存。识别规则更改只更新模板，不自动改变设备绑定；点击“更新识别绑定列表”才扫描候选，点击“绑定此设备及所选实体”才调用 `POST /api/device-platform/projects/:id/rebind`。后端校验设备与实体归属、禁止同一 HA 设备被不同项目占用，并在同一提交中替换本项目旧绑定。绑定记录保存所选实体及 HA entity registry ID；registry ID 不变而 `entity_id` 改名时，服务端同步更新本地绑定和能力实体引用。全部验证通过隔离测试执行，不能拿生产 HA 设备做写入测试。

首轮实测后的 N2/N3 修订：新版模型预览的程序化管线机、净水器、燃气热水器和路由器需保留与家具栏一致的可辨识细节；N3 实体表的勾选框占独立网格列，实体 ID 可截断但 `title` 保留完整值，类型为中文。选择草稿与持久化绑定分开：优先恢复 `selectedEntityIds`，旧记录无显式选择时从 `capabilityBindings` 恢复，未绑定项目默认不勾选；只有显式绑定提交才持久化。全选/全不选及拖动经过实体行反选只修改当前草稿，同一次拖动每行最多反选一次。

N4 在 `device-development-center/project-capabilities.jsx` 中把能力定义、HA 实体/属性映射及枚举管理合并为第二步。`PUT /api/device-platform/projects/:id/capabilities` 将能力列表和主映射一次提交；`capabilityMappings` 存储 `{entityId, attribute}`，旧 `capabilityBindings` 仍同步保留给现有运行组件使用。N4 保存后 `mappingMode: explicit`，避免被清空的能力被旧自动匹配逻辑暗中重新绑定；未进入 N4 的旧绑定仍沿用旧逻辑。删除/改类型前通过依赖查询告知浮窗、模型动画、面板引用；确认删除后不联动删除依赖组件，`capability-validation` 返回“引用能力已删除”及 `publishBlocked`，供 N9 发布入口复用。HA `options` 的枚举同步保留手动值和 HA 已移除值。N3 保存先读取最新项目，再仅合并基础信息字段，防止返回 N3 后覆盖 N4 能力变更。所有正式数据的保存只由用户界面操作触发；API 写入测试使用隔离临时目录。

N4 底部仅列出 N3 已选、但尚未被任何能力引用的 HA 实体（`unusedBoundEntities`）；N3 明确保存的空选择不回退到旧绑定。每个实体可选择现有未映射能力直接映射，或新建能力并映射；建议能力 ID、类型、枚举初始值由实体推导，仍走原子保存接口。未选中的其他 HA 实体及“未映射能力”清单不会混入此处；重复映射同一实体仍可通过右侧编辑器手工完成。

N5/N6 分别使用 `PUT /api/device-platform/projects/:id/runtime-display` 和 `/appearance` 定向保存，避免基础信息或能力的旧快照覆盖新步骤。`runtimeDisplay` 只引用 N4 能力 ID，保存时检查状态/数值能力类型并阻止运行与结束状态重叠；状态枚举移除后保留原值并在步骤及校验接口报错。标题、待机和运行模板共享 `washer-runtime.js` 的安全变量渲染，支持 `{remaining.minutes | --}` 兜底，避免输出 `null`、`undefined`、`NaN`。N5 双状态预览只注入本地示例值，不发送 HA 服务。

N6 在设备项目保存 `modelTemplateId` 与项目专属 `appearance`（尺寸、缩放、摆放、锚点、材质、能力驱动动画），不修改资源库共享模型；已绑定设备的模型引用同步更新。`HomeAssistantClient.getEntities()` 将项目外观投影到场景实体，场景继续消费同一运行能力与文案来源；动画状态可与浮窗运行状态分别配置。3D 预览复用模型资源库的加载器，支持旋转、平移、缩放和适应视图，外观编辑会话维护最近 30 步撤销/重做。上传文件缺失由只读校验接口阻止后续发布。N7 控制面板已开放，N8 联调与 N9 本地发布已接入新版项目详情，视觉验收仍由用户完成。

3D 场景中的自定义设备模型也消费 HA 离线状态：`scene.js` 仅向设备实例传递 `unavailable`，`domain/model-availability.js` 按材质保存原始颜色、发光、透明度，并在离线时去饱和及半透明，恢复在线时复原。上传模型先为实例克隆材质，避免离线效果污染同一资源库模型或家具实例；独立摆放的家具不传入设备状态。

通用运行光效由 `domain/runtime-model-glow.js` 提供：对模型的主要网格添加薄蓝色背面描边和弱点光，并随时间缓慢呼吸。`scene.js` 仅在设备运行且在线时挂载，卸载时清理效果材质；N5/N6 的 `ModelPreview` 复用该逻辑，替换原先的运行图标和通用模型自转。波轮洗衣机原有的局部波轮动作仍保留。

N8 的 `/api/device-platform/projects/:id/diagnostics` 只读返回能力状态与配置问题；`test-action` 仅接受当前项目已绑定、已选、已映射且可写的实体，服务端还要求 `confirmReal: true` 与 HA 实时连接。模拟操作完全在前端本页，事件日志不落盘；测试完成只持久化模式、时间和配置签名。N9 的 `publish-check` 区分错误与警告，错误阻断、警告需明确确认；`release-draft` 与 `publish` 在独立文件中保存草稿和只读版本快照，模型上传资源也随快照保存以避免历史版本被后来修改覆盖。单项目包通过 `projects/:id/package` 导出，剔除 HA 绑定、敏感字段、URL 与绝对路径；`projects/import-package` 始终生成新的未绑定草稿。当前发布渠道仅为本地设备库，团队/公开可见性是元数据，不代表在线发布或权限控制。详见 [N8/N9 联合验收报告](docs/设备开发中心N8N9联合验收报告.md)。

卫浴内置家具中，`shower_enclosure` 通过 `showerStyle` 在钻石型、长方形和弧形之间切换；宽、深、高共用，钻石型的 `showerCornerCut`（米）控制斜边。轮廓首尾两条边依附墙体，仅中间边生成玻璃；二维与三维共用 `domain/bathroom-fixtures.js` 的轮廓计算。旧 `shower_diamond` 自动迁移为钻石型。`shower_fixture` 是独立喷淋器，可单独放置与旋转。`toilet` 使用低矮一体式陶瓷外形，旧版默认尺寸组合迁移为新默认尺寸，其他自定义尺寸保留。

`vanity_mirror_cabinet` 是一件包含下部台柜、台盆和上部双门镜柜的内置家具。`packages/schema/src/vanity-mirror-cabinet.js` 统一约束台柜宽深高、台盆宽深、镜柜宽深高和垂直间距，并从台柜高度＋间距＋镜柜高度计算整体 `height`；Schema 在保存与导入时重新归一化，避免镜柜或台盆超出台柜边界。二维占地和三维模型读取同一组尺寸参数，配置栏修改后实时更新。

二维画布中，家具本体的鼠标左键按下只阻止画布框选，点击时通过原选择逻辑选中或配合修饰键多选；鼠标右键按下在家具本体及已选家具控制点的捕获阶段统一进入整件家具拖动。拖动时 `domain/furniture-pointer.js` 基于初始家具位置与鼠标位移计算新位置，网格吸附只作用于位移，避免抓取点跳动；左键拖动专用控制点仍保留旋转、缩放和柜体轮廓编辑。触屏仍保留原有直接拖动方式。

楼层层高、墙高及家具高度在 3D 场景中均按实际米数绘制，不再分别应用展示模式的竖向压缩。调整层高由 `domain/floor-height.js` 同步原本通高的墙体并保留矮墙；3D 渲染将历史数据中超过层高的墙限制到层高，避免旧项目的楼层墙顶与新层高不一致。

全屋页 `home-view.js` 左上角标题旁保留模型自动旋转按钮及天气预报开关，底栏连接入口只在 HA 未连接时渲染。`app.js` 在全屋模式始终挂载语音助手入口，不再依赖旧的本地语音开关；麦克风仍需用户主动按下，并非后台持续监听。

设备模板编辑器可从 `/api/device-platform/devices` 选择一个仅用于设计参照的目标设备，展示实体状态与属性；该选择不写入模板或设备绑定。能力编辑器根据选中的参考实体生成 `allowedDomains`、`matchKeywords`、能力类型、数据类型和访问方式。`domain/model-template-import.js` 负责解析单独导出的模型模板 JSON 和包含内嵌模型素材的完整设备平台导出包。导入 GLB/自包含 GLTF 时，前端以 `GLTFLoader` 解析文件，`domain/model-file-parameters.js` 从场景实际几何包围盒读取宽、深、高及首个标准材质参数，覆盖编辑表单的旧尺寸和材质；无法从模型推断的摆放、缩放、锚点恢复默认值，模板 JSON 则优先保留模板显式参数。

上传模型的 `runtimeEffect` 由模型表单配置并经 `devicePlatformSchema.js` 持久化，仅承载波轮动画类型、运行状态/剩余时间能力关联和触发状态。浮窗文案由设备模板的 `statusDisplay.titleTemplate`、`statusDisplay.statusTemplate` 持久化；服务端 `deviceAggregation.js` 将规则与能力 ID、中文名称映射附到匹配设备，`app.js` 再传入场景实体，`scene.js` 使用模板规则渲染。新规则支持 `{device.name}`、通用 `{time.now}`、`{能力名称}`、`{能力名称.属性.属性名}` 及 `{{time.now} + {能力名称}}`。时间加法只接受能力的数值状态，不执行任意 JS；以当前时间加上 HA 最新状态时长，依据 `unit_of_measurement` 换算秒/小时，其他情况按分钟。能力名称重复时不做模糊绑定，编辑器提示重命名。设备模板编辑器只提供本模板的能力名称变量，并可按选中的目标设备与参考实体预览。先前已保存的 `{remaining.minutes}`、`{end.time}`、`{capability.能力ID.state|countdown}` 和模型 `runtimeEffect` 文案字段仍可读取，但不再作为新配置选项，模板文案优先。`domain/washer-runtime.js` 按设备能力绑定解析状态、剩余时间和动画触发状态值；`scene.js` 仅在匹配状态时旋转 GLB 的 `Pulsator_Disc` / `Pulsator_Blade_*` 节点并显示状态小浮窗（不依赖选中或展示模式）。服务端 `ha/boundEntityFilter.js` 将已放置设备的同设备实体一起加入 WebSocket 推送过滤器，户型或 HA 实体注册表同步后会重算；HA 状态更新时浮窗直接采用新值，不再要求刷新页面。非匹配或状态不可用时停止动画并隐藏这个小浮窗；此路径不调用 HA 控制服务。

全屋页设备列表必须读取 `/api/device-platform/devices` 聚合数据，不能仅用 `/api/ha/devices` 原始注册表：后者没有 `entityIds`、`capabilityBindings` 和 `operationalStateEntityId`，会使场景中的运行效果退化为主实体状态。`app.js` 再用实时 `/api/ha/entities` 状态填充这些实体 ID，供模型动画与现有设备标签共同使用。

控制面板设计器只展示控件名称、类型、关联能力及必要的行为选项，不再为每种控件统一展示单位、范围、步长和显示条件。`select` 控件通过 `selectStyle` 选择 `dropdown`（下拉菜单，兼容默认值）或 `radio`（平铺单选），模拟预览与 3D 场景运行面板使用同一配置。运行时始终保留 HA 实体 `attributes.options` 的声明顺序，只高亮当前选项；HA 短暂上报 `unknown` 或 `unavailable` 时保留最后一个有效选项，收到另一个明确有效值后才更新高亮。动作接口响应和 HA WebSocket 增量推送都必须与现有实体展示元数据合并，不能丢失 `deviceId`、设备模板、3D 模型或控制面板绑定。`confirm` 表示执行动作前弹出二次确认，仅用于防误触，不参与设备使能或动作语义。

### 后端

```text
source/apps/server/src/
├─ main.js                           Fastify、静态资源、WebSocket 和生命周期
├─ observability/resourceMonitor.js  低频内存、CPU、连接与队列资源统计
├─ config/
│  ├─ envFile.js                     本地环境文件加载
│  ├─ haConfigStore.js               独立模式 HA 连接配置持久化
│  └─ runtime.js                     standalone/addon 运行配置
├─ ha/HomeAssistantClient.js         HA REST、WebSocket、实体和 Area 同步
├─ device-platform/
│  ├─ devicePlatformSchema.js        能力、设备、模型与控制面板 Schema 和内置模板
│  ├─ deviceAggregation.js           HA Device 聚合、模板识别和能力实体匹配
│  └─ DevicePlatformStore.js         全局配置、模型文件、备份和完整导入导出
├─ projects/ProjectStore.js          多项目、备份、导入导出和素材元数据
├─ routes/
│  ├─ haRoutes.js                    Home Assistant 代理接口
│  ├─ devicePlatformRoutes.js        设备平台管理、聚合设备与模型文件接口
│  └─ projectRoutes.js               项目与素材接口
└─ websocket/clientGateway.js        浏览器客户端实时广播
```

### Schema 与数据模型

`source/packages/schema/src/index.js` 负责项目归一化和验证，`topology.js` 根据墙体计算封闭房间。所有持久化项目在写入前都应经过 `validateFloorplanProject`，旧字段兼容应放在 `normalizeFloorplanProject` 及其下级归一化函数中。

```text
FloorplanProject
├─ materials[]
├─ assets[]
├─ dashboardWidgets[]
└─ floors[]
   ├─ walls[]       起点、终点、厚度、高度、材质、虚拟墙标记
   ├─ rooms[]       多边形、面积、HA Area 和能力绑定
   ├─ openings[]    门窗类型、墙体、偏移、尺寸和开向
   ├─ devices[]     HA 实体、位置、旋转、缩放、模型和灯带路径
   └─ furniture[]   类型、位置、尺寸、旋转、房间和离地高度
```

设备平台数据不属于单个户型项目，统一保存在 `HA3D_DATA_DIR`：

| 文件 | 内容 |
| --- | --- |
| `device-templates.json` | 用户创建的设备类型和能力模板 |
| `device-bindings.json` | HA Device 到模板、能力实体、模型和面板的绑定 |
| `model-templates.json` | 用户模型的尺寸、锚点、旋转、安装面和材质参数 |
| `control-panel-templates.json` | 结构化控制面板分组与控件 |
| `ha-entity-history.json` | 离线实体、Area 和 Device Registry 元数据 |

上传模型保存在 `HA3D_ASSET_DIR/device-models`。每个配置文件写入时先生成临时文件并原子替换，同时保留最近的 `.bak`。内置模板由代码生成，不写入用户文件。

项目设置的导出接口返回 `ha3d-complete-backup` v1 数据包，把当前项目与 `DevicePlatformStore.exportBundle()` 合并，因此也会内嵌本地模型文件。导入时先恢复设备平台，再保存项目；项目保存失败会回滚设备平台。旧版裸项目 JSON 继续按原逻辑导入，不会覆盖全局设备平台数据。远程在线模型库本身不进入数据包，只有已落地到设备平台的本地模型素材会被备份。

设备对象通过 `deviceId` 聚合多个实体。模板匹配会返回置信度和命中原因，用户保存的绑定优先于自动识别。实际动作只允许映射到明确支持的标准服务；不得恢复未知动作回退 `turn_on` 的旧行为。

兼容规则示例：

- 旧家具缺少 `elevation` 时按 `0` 处理；项目格式 v5 增加 `verticalReference`，用于让设备或家具引用楼层或垂直投影范围内另一设备、家具的顶面/底面。候选计算使用双方旋转矩形占地的分离轴相交检测，灯具始终排除；拖动后重新计算候选并将失效绑定回退到楼层地面。编辑界面只显示统一的水平基准面和相对偏移，旧 `elevation` 字段继续保留用于兼容历史项目。批量复制家具时，副本组内的设备/家具目标 ID 会同步重映射。
- `apps/web/src/domain/vertical-reference.js` 以带循环保护的依赖图解析对象底面高度；改变基准对象的高度后，所有直接或间接依赖对象在场景中同步更新。
- 设备平台中已启用的模型模板可作为 `custom_model` 家具实例保存，项目内同时保留模型 ID 和模型快照，确保导出、恢复及离线渲染一致。
- 旧项目的 `transparent: true` 在加载时迁移为 `virtual: true`。
- 虚拟墙参与 2D 房间拓扑，但 `scene.js` 不为它创建 3D 墙体模型。

## 运行模式与数据流

### 独立模式

1. 浏览器访问 Fastify 提供的 Web 页面。
2. 前端通过 `/api` 和 `/ws` 与本服务通信。
3. 后端读取保存的 HA 地址和令牌，连接 HA REST API 与 WebSocket API。
4. 项目保存在 `HA3D_DATA_DIR/projects`，素材保存在 `HA3D_ASSET_DIR`。

Docker Compose 映射：

| 主机目录 | 容器目录 | 内容 |
| --- | --- | --- |
| `docker-runtime-source/data` | `/data` | 项目、备份和 HA 连接配置 |
| `docker-runtime-source/assets` | `/assets` | 上传的图片、模型和纹理 |

### Add-on 模式

1. Home Assistant 通过 Ingress 打开页面。
2. `addon-entry.js` 读取 `/data/options.json`，设置日志级别和运行环境。
3. 后端使用 `SUPERVISOR_TOKEN` 访问 `http://supervisor/core/api` 和对应 WebSocket。
4. 项目保存在 Add-on `/data`，素材使用 `/config/assets`。

Add-on slug `jmglink_ha_3d_home_custom` 是数据目录身份的一部分。发布新版本时不得修改 slug。

## 开发环境

### 必需工具

- Node.js 22
- npm
- Git
- Docker Desktop 或 Docker Engine + Compose

在仓库根目录确认：

```powershell
node --version
npm --version
git --version
docker version
docker compose version
```

### 安装依赖

安装和升级统一使用[发布镜像](docs/deployment.md)；内部验证由 CI 执行。

依赖版本由 package-lock.json 固定；主动修改依赖时必须同步提交锁文件。

### 运行测试和生产构建

安装和升级统一使用[发布镜像](docs/deployment.md)；内部验证由 CI 执行。

本文面向维护者和自动化 Agent，说明恢复源码的边界、运行架构、验证方式和发布约束。最终用户的安装与使用请阅读 [README.md](README.md)。

## 源码边界

官方 `0.1.5` 镜像只包含后端和前端运行产物。本仓库的 `jmglink-ha-3d-home/source` 是从这些产物恢复并整理出的可构建 JavaScript 工程，可以继续开发、测试和发布，但不能还原已经丢失的原变量名、注释、类型和完整文件边界。

新增逻辑应优先进入具名模块，避免继续扩大恢复后的大型入口文件。修改数据结构时，同时检查 schema、后端归一化、前端编辑器、3D 场景和项目导入导出。

## 主要目录

```text
.
├─ .gitea/workflows/             Gitea Actions 验证与发布
├─ docs/                         随代码版本维护的部署和发布文档
├─ extracted-image/              官方镜像运行产物基线
├─ jmglink-ha-3d-home/
│  ├─ config.yaml                Home Assistant Add-on 元数据
│  ├─ Dockerfile                 恢复源码多阶段构建
│  ├─ addon-entry.js             Add-on 启动入口
│  └─ source/
│     ├─ apps/server/src/        Fastify 后端与 Home Assistant 连接
│     ├─ apps/web/src/           React、Three.js 编辑器与界面
│     ├─ packages/schema/        前后端共用的数据结构
│     └─ tests/                  恢复工程回归测试
├─ docker-compose.source.yml     独立源码版运行环境
├─ README.md                     用户文档
└─ RELEASE_NOTES.md                  项目级版本记录
```

## 运行数据流

```text
浏览器
  ├─ 静态前端资源 ───────────────┐
  ├─ 项目、素材 API ─────────────┤
  └─ Home Assistant API 代理 ───┤
                                  ▼
                           Fastify 后端
                             ├─ 独立 Docker：长期令牌
                             └─ Add-on：Supervisor Token
```

浏览器只调用本项目后端；Home Assistant 凭据由后端读取。Add-on 模式的数据位于 `/data`，独立 Docker 模式的数据位于 Compose 映射目录。

## 本地验证

在 `jmglink-ha-3d-home/source` 中执行：

安装和升级统一使用[发布镜像](docs/deployment.md)；内部验证由 CI 执行。

- `npm test` 执行 `tests/*.test.mjs`。
- CI 使用 Vite 生成 `apps/web/dist`。
- Dockerfile 会在镜像构建阶段再次执行测试和构建，任何一步失败都会停止出镜像。

### 启动本地后端

先构建 Web 页面，再启动 Fastify：

安装和升级统一使用[发布镜像](docs/deployment.md)；内部验证由 CI 执行。

默认监听 `http://127.0.0.1:8099`。本地环境变量可以写入不会提交的 `.env.local`：

```dotenv
HA3D_MODE=standalone
PORT=8099
HA3D_DATA_DIR=./runtime/data
HA3D_ASSET_DIR=./runtime/assets
HA_URL=http://homeassistant.local:8123
HA_TOKEN=replace-with-local-token
```

不要在终端输出、源码、测试夹具或提交记录中保存真实令牌。

### 前后端分离开发

终端一启动后端：

```powershell
Set-Location .\jmglink-ha-3d-home\source
npm run start
```

终端二启动 Vite：

```powershell
Set-Location .\jmglink-ha-3d-home\source
npm run dev
```

Vite 默认监听 `5173`，并把 `/api` 和 `/ws` 代理到 `http://127.0.0.1:8099`。后端使用其他地址时：

```powershell
$env:HA3D_BACKEND = "http://127.0.0.1:8100"
npm run dev
```

### 使用 Docker 做完整回归

在仓库根目录执行：

安装和升级统一使用[发布镜像](docs/deployment.md)；内部验证由 CI 执行。

测试完成后可以停止容器，绑定目录中的数据会保留：

```powershell
docker compose -f .\docker-compose.source.yml down
```

## 环境变量

| 变量 | 默认值 | 用途 |
| --- | --- | --- |
| `HA3D_MODE` | 有 Supervisor 令牌时为 `addon`，否则为 `dev` | 选择运行模式 |
| `PORT` | `8099` | Fastify 监听端口 |
| `HA3D_DATA_DIR` | 独立模式 `./data`，Add-on `/data` | 项目和连接配置目录 |
| `HA3D_ASSET_DIR` | 独立模式 `./assets`，Add-on `/config/assets` | 素材目录 |
| `HA_URL` | `http://homeassistant.local:8123` | 独立模式 HA 地址 |
| `HA_WS_URL` | 根据 `HA_URL` 推导 | 可选的 HA WebSocket 地址 |
| `HA_TOKEN` | 无 | 独立模式 HA 长期访问令牌 |
| `SUPERVISOR_TOKEN` | 由 HA 提供 | Add-on 模式认证 |
| `LOG_LEVEL` | `info` | Fastify 日志级别 |
| `HA3D_BACKEND` | `http://127.0.0.1:8099` | Vite 开发服务器代理目标 |
| `HA3D_BUILD_VERSION` | `dev` | 健康日志和构建标识 |
| `HA3D_ENABLE_DEV_ENTITIES` | `false` | 启用仅用于本地开发的虚拟实体；源码 Docker Compose 默认开启 |
| `NODE_OPTIONS` | 源码镜像 `--max-old-space-size=384` | 独立 Docker 的 Node.js 堆上限；Compose 可通过 `HA3D_NODE_MAX_OLD_SPACE_MB` 调整 |
| `HA3D_RESOURCE_LOG_INTERVAL_MINUTES` | `5` | 资源监控日志间隔；`0` 关闭，最大 `60` 分钟 |

Add-on 镜像不是直接以 `node addon-entry.js` 启动，而是先由 `addon-run.sh` 读取 `/data/options.json`，校验并应用 `node_max_old_space_mb`、`nice_level` 和 `resource_log_interval_minutes`，随后用 `exec nice ... node --max-old-space-size=...` 替换启动脚本。这样运行中的容器只保留一个 Node.js 服务进程。

实体历史持久化采用 `250 ms` 合并窗口，同一批状态变化只生成一次完整 JSON；历史实体和设备各限制为 5000 条，Area 限制为 1000 条。浏览器 WebSocket 默认最多 64 个客户端，单客户端待发送缓冲超过 4 MiB 时会断开，防止慢客户端造成无界内存积压。服务退出时必须释放项目订阅、HA 事件、WebSocket 连接、历史写盘和资源监控定时器。

## API 与实时通信

| 接口 | 用途 |
| --- | --- |
| `GET /api/health` | 健康状态和运行模式 |
| `GET/POST /api/projects` | 项目列表和创建 |
| `GET/PUT/DELETE /api/projects/:id` | 读取、保存和删除项目 |
| `GET /api/projects/:id/export` | 导出项目与全局设备平台的完整 JSON 备份 |
| `POST /api/projects/import` | 导入完整备份或兼容导入旧版项目 JSON |
| `GET /api/projects/:id/backups` | 查看项目备份 |
| `POST /api/projects/:id/backups/:backupId/restore` | 恢复备份 |
| `GET/POST /api/assets` | 素材列表和上传 |
| `GET /api/ha/status` | HA 连接状态 |
| `GET /api/ha/entities` | 已同步实体 |
| `GET /api/ha/areas` | Home Assistant Area 列表 |
| `POST /api/ha/actions` | 执行实体服务调用 |
| `POST /api/ha/config` | 独立模式保存 HA 连接配置 |
| `POST /api/ha/conversation` | Home Assistant Assist 对话 |
| `/api/ha/cameras/*` | 摄像头快照和视频代理 |
| `WS /ws` | 项目、HA 状态和实体状态实时广播 |

修改 API 时应同步检查前端调用、Fastify schema、错误处理和 Add-on Ingress 相对路径。前端请求应使用相对 `/api` 与 `/ws`，不要写死主机地址。

实体历史由 `apps/server/src/ha/EntityHistoryStore.js` 管理，并写入 `HA3D_DATA_DIR/ha-entity-history.json`。HA 整体离线时展示完整历史记录、项目中仅有的 `entityId` 和可选开发实体，均使用 `historical/stale` 标记及 `unavailable` 状态；HA 在线时实体和设备发现只采用本次 REST 状态与 WebSocket 注册表，不再并入历史设备。开发中心“更新识别绑定列表”会主动重新读取 HA 状态及注册表，注册表更新事件和实体删除事件也会更新在线快照。历史缓存仍保留，供下一次整体离线时恢复，但不作为在线绑定候选。

## 开发规范

### 新功能放置位置

- 纯几何与状态无关的算法：`apps/web/src/domain/`。
- 项目格式、默认值、校验和迁移：`packages/schema/`。
- Home Assistant 通信：`apps/server/src/ha/` 与 `routes/haRoutes.js`。
- 项目持久化、备份、导入导出：`ProjectStore.js` 与 `projectRoutes.js`。
- UI 状态和交互接线：对应 `apps/web/src/app/` 模块。
- 新增编辑器样式：优先放入独立具名 CSS，避免继续扩大恢复的全局 CSS。

### 编辑恢复代码

1. 先确认行为入口和数据结构，再修改大型恢复模块。
2. 把可独立验证的逻辑提取成具名导出函数。
3. 为几何变换、数据迁移和兼容规则增加行为测试。
4. 保持项目旧字段可读；新增字段必须给出默认值和范围限制。
5. 墙体变换后检查门窗偏移、连接墙端点、房间拓扑和撤销历史。
6. 设备变换后检查房间归属、灯带路径和多选状态。

### 格式化

项目使用 Prettier。修改恢复前端或具名业务模块后执行：

```powershell
Set-Location .\jmglink-ha-3d-home\source
npx prettier --write apps/web/src/app apps/web/src/domain apps/web/src/styles tests
```

提交前执行：

安装和升级统一使用[发布镜像](docs/deployment.md)；内部验证由 CI 执行。

## 测试策略

现有 `recovery.test.mjs` 主要覆盖：

- 柜体闭合外轮廓、边拆分、整边及共享顶点移动、共线合并、旧中心线/旧柜类迁移、柜门数量，以及分段柜的一段/中空/自动二段高度、可直接调整的一段深度、独立二段深度和共用背板锚定；一段深度按柜门面法线从现有轮廓测量，修改时固定背面并调整下柜轮廓、尺寸及 `cabinetDepth`，不覆盖二段深度；分段柜中空区按非柜门轮廓边生成连续背板与左右侧板，仅移除上柜底板，下柜顶层从背板完整延伸至柜门面且与柜体正面齐平；相邻的左右侧板使用竖向贝塞尔轮廓，从下柜前沿圆弧过渡到上柜前沿，随二段深度变化，连接板不会越过上下柜各自的正面；
- 房间拓扑与虚拟墙；
- 墙链拉直、合并、分段、整体移动及门窗约束；
- 创建和拖动时的辅助线吸附；
- 设备成线、等距排放和灯带路径平移。

新增测试应验证用户可观察行为和数据不变量。简单文案或纯样式调整无需复制实现细节写测试。完整交付至少需要通过 Node 测试、Vite 生产构建和 Docker 健康检查。

## 版本与发布

### 版本号同步

发布前需要同步检查以下文件：

- `jmglink-ha-3d-home/config.yaml`
- `jmglink-ha-3d-home/Dockerfile` 的默认 `BUILD_VERSION`
- `jmglink-ha-3d-home/source/package.json`
- `source/apps/server/package.json`
- `source/apps/web/package.json`
- `source/packages/schema/package.json`
- `source/package-lock.json` 中对应 workspace 版本
- 根目录和 Add-on 目录的 `RELEASE_NOTES.md`

保持 `slug: jmglink_ha_3d_home_custom` 不变。

### 发布前检查

1. 更新版本号和更新日志。
2. 通过 CI 执行测试及发布产物验证。
3. 在仓库根目录重新构建 `docker-compose.source.yml`。
4. 验证 `/api/health`、项目载入、保存、导出、2D 编辑和 3D 场景。
5. 检查 `git diff --check` 和 `git status --short`。
6. 只提交本次版本相关文件。
7. 推送 `main` 后观察 Gitea Actions。

### Gitea Actions 镜像发布

Gitea Actions 分为三个入口：

1. `.gitea/workflows/ci.yml` 在 `main` Push、PR 和手动触发时运行源码测试、前端生产构建与 `amd64` 镜像构建验证，不发布正式镜像。
2. `.gitea/workflows/release-addon-image.yml` 仅由 `v*` Tag 触发，校验 Tag 与 `config.yaml` 版本一致后发布 `<version>-aarch64`、`<version>-amd64` 和 `<version>` 多架构清单，将软件包关联到仓库，并在同版本 Gitea Release 正文中提供软件包直链和拉取命令。
3. `.gitea/workflows/windows-runner-test.yml` 仅供手动检查 Windows Runner。

镜像地址：

```text
gitea.700117.xyz:16666/zgf/jmglink-ha-3d-home-custom:<version>
```

正式发布创建 Release 使用 Gitea 内置短生命周期任务令牌；仓库配置的 `REGISTRY_TOKEN` 只注入 Registry 登录、推送和 Package API 步骤。第三方 Action 固定到完整 Commit SHA，Workflow 权限显式收紧，BuildKit 缓存按架构和依赖锁文件哈希隔离。完整步骤见 [CI 与正式发布](docs/ci-release.md)。

同一个版本标签不应重复承载不同源码。发布失败时先修复构建或网络问题；需要重新发布功能变更时提高版本号。

## 恢复基线与旧覆盖版

- `extracted-image/` 保存官方镜像中的运行产物，用于行为对照和恢复来源追踪。
- `source/RECOVERY_MANIFEST.json` 记录恢复文件来源和哈希。
- `scripts/reconstruct-source.mjs` 会重建恢复目录中的源码，可能覆盖后续人工重构；日常开发不要执行。
- `Dockerfile.room-filter`、`docker-compose.room-filter.yml`、`patch-room-filter.mjs` 和 `patch-cabinet-elevation.mjs` 属于早期运行产物覆盖方案。
- 当前功能开发、Docker 验证和 Add-on 发布都应以 `jmglink-ha-3d-home/source` 为准。

如果必须重新生成恢复基线，应先提交或备份当前源码，再在隔离分支中执行重建脚本并审查全部差异。

## 安全与数据保护

- 不提交 HA 令牌、Gitea Token、证书、`.env.local` 或运行数据。
- `docker-runtime/`、`docker-runtime-source/` 和 `.env*` 已由 `.gitignore` 排除。

在线模型库由服务端 `GiteaModelLibrary` 访问，浏览器不会接触 Gitea 凭证。公开目录可在只读模式匿名访问；发布模式需要通过部署环境或 Secret 注入 `HA3D_MODEL_LIBRARY_TOKEN`，或者注入 `HA3D_MODEL_LIBRARY_USERNAME` 与 `HA3D_MODEL_LIBRARY_PASSWORD`。状态接口只返回仓库、分支和读写能力，不返回凭证。独立“在线模型库”页通过后端预览接口读取清单，上传模型文件继续由同源后端代理，网格卡片只在接近视口时创建 Three.js 预览。模型安装和预览文件均校验扩展名、15 MB 限制和 SHA-256；发布必须经过预览和二次确认。发布表单只接收作者名称，服务端默认许可证为 `MIT`，标签为空时自动使用模型名称。

Add-on 运行模式默认连接 `zgf/jmglink-ha-3d-model-library@main`，使用匿名 `readonly` 访问且不包含任何 Gitea 凭证；部署环境可以用 `HA3D_MODEL_LIBRARY_*` 变量覆盖默认仓库。当前公网入口只有 IPv6，运行 Add-on 的 Home Assistant 主机必须具有 IPv6 出站能力。

Windows 源码环境使用 `scripts/start-source-with-model-library.ps1` 从 Git Credential Manager 临时取出 `zgf` 凭证并注入 Compose。由于当前 Gitea 域名只发布 IPv6，Compose 中的固定目标代理侧车通过主机 IPv6 路由转发 `/api/v1/repos/zgf/jmglink-ha-3d-model-library/`，主服务仍以桥接端口 `8101` 对外；代理不关闭 TLS 校验，也不接受其他仓库路径。
- 日志只记录令牌是否存在和长度，不应输出令牌内容。
- 调试项目导入导出时使用脱敏副本。
- 删除或重置项目会影响持久化数据；开发破坏性功能前先导出 JSON 并保留容器绑定目录。

## 后续重构方向

1. 用正式 npm 依赖替换 `src/vendor` 中的恢复运行模块。
2. 将 `floorplan-editor.js` 拆分为工具栏、画布、选择系统、属性面板和资源库组件。
3. 将 `scene.js` 拆分为墙体、房间、设备、家具和交互组件。
4. 提取统一的 API 与 WebSocket 客户端。
5. 将 Schema 和业务模块迁移到 TypeScript。
6. 为导入导出、项目备份和 HA 连接补充服务端集成测试。
7. 建立可重复的前端浏览器操作回归。
## 完整交付验证与修改清单

完整 Docker 验证：

安装和升级统一使用[发布镜像](docs/deployment.md)；内部验证由 CI 执行。

## CI 与正式发布

- `.gitea/workflows/ci.yml` 在 `main` Push、面向 `main` 的 PR 和手动触发时运行，只验证 amd64 源码镜像，不发布正式软件包。
- `.gitea/workflows/release-addon-image.yml` 只响应 `v*` Tag，校验 Tag 与 `config.yaml` 版本一致后构建并发布 amd64、arm64 和多架构镜像。
- `.gitea/workflows/windows-runner-test.yml` 只允许手动触发，用于检查按需启动的 Windows Runner、Git、PowerShell、.NET 与 Visual Studio Build Tools。
- 正式发布会使用 Gitea 内置的短生命周期 `GITEA_TOKEN`，把容器软件包关联到当前仓库，并创建或更新同名 Gitea Release；容器软件包不会成为 Release 附件，正文会提供该版本的直接入口。
- BuildKit 以架构区分缓存。Dockerfile 在安装依赖前只复制 package 文件和 `package-lock.json`，因此依赖缓存会随锁文件变化自动失效。
- 所有外部 Action 固定到完整 Commit SHA；检出步骤不把令牌持久化到 Git 配置。

发布步骤见 [docs/ci-release.md](docs/ci-release.md)。

## 修改检查

1. 先阅读 README、README_CODE、RELEASE_NOTES、相关 docs 和仓库规则。
2. 检查工作区，保护已有未提交修改。
3. 更新代码及必要测试。
4. 功能、架构或部署行为变化时同步更新用户文档、开发文档和 RELEASE_NOTES。
5. 普通提交使用中文 Conventional Commit；较大修改走功能分支和 PR。
6. 不将凭据、用户数据、Cache、Artifact 或运行目录提交到 Git。

设备开发中心详情页支持折叠项目信息；顶部项目信息、步骤导航及底部步骤操作常驻，中间内容独立滚动。绑定成功进入能力映射，控制面板无新修改时也可直接进入下一步。

共享面板：`components/device-panel.jsx` 是设计器、联调页和全屋的唯一控件渲染入口，样式由 `styles/shared-device-panel.css` 隔离，数据通过 `domain/device-panel.js` 的绑定/模拟适配器输入。number 的 metric 外观仅显示一次数值及单位；实际写入权限、显示条件和未知值由共同规则处理。真实状态预览禁用操作，模拟操作不连接 HA；全屋适配器保留标准动作和错误反馈。回归：`tests/shared-device-panel.test.mjs`。
玻璃面板仅由外壳承载底色：全屋侧栏、设计器画布和联调预览共用 `--hp-glass-background` / `--hp-glass-blur`；共享内容层与 section 均透明，避免多层 alpha 与模糊叠加。
控件库入口：`packages/schema/src/control-library.js` 管理原生风格元数据、UI/样式验证和实例快照；`apps/server/src/control-library/ControlLibraryStore.js` 提供串行原子持久化及 CRUD/import/export API。`platform.snapshot()` 提供目录，整体备份导入导出控件库，面板和单设备包保留 `libraryDefinition` 快照。自定义 UI 只允许声明式节点及白名单局部样式，全部使用共享 DevicePanel 渲染，不执行脚本。测试：`tests/control-library.test.mjs`；UI 文件规范见 [控件资源库](docs/控件资源库与自定义UI文件.md)。

控件编辑器使用 `editableLibraryControl` 展开旧 native 风格；新交互节点由同一 DevicePanel 渲染。预览在验证后更新 React 子树并保留模拟值，保存需与已预览源一致。控件库 JSON 中的 previous 保存每个控件的上一版，和当前目录原子写入；POST `/api/control-library/:id/rollback` 创建递增版本。

控件配置由库定义 properties 注册，ControlProperties 共享生成预览/实例表单；schema 校验注册和 props 值，effectiveControl 合并默认与实例覆盖，controlUnit 处理自动/覆盖/隐藏单位。模板文本和样式支持 {{props.key}}，替换后的样式仍做白名单验证。平台布局/绑定保持系统配置。

Agent 平台接入包：`agent-skills/` 为 skill 入口，`scripts/build-agent-skills.py` 同步服务内可读 skill 目录，下载时由后端按 manifest 即时生成 ZIP；每新增平台必须提供对应 skill、下载入口与验证脚本，详见 [语音助手配置](docs/语音助手配置.md)。

语音多轮交互：`voice-interaction.js` 同步原任务澄清状态；`VoiceClarification` 持久显示选项并通过请求/问题双标识回答。`voice-playback.js` 按保存的音量朗读。浏览器模拟验证入口见 `tests/fixtures/voice-interaction-demo.mjs`，不得用于生产 Agent。

`domain/voice-assistant-api.js` 统一配置请求；空 POST 固定使用 JSON 空对象。发布涉及语音 API 时运行 `scripts/verify-ha-ingress.mjs` 验证真实 Ingress 协议，不输出 HA Token、Ingress 路径／会话 Cookie 或网关密钥。


正式运行层固定使用干净官方 Node 22 镜像，不继承含旧应用的 CI 基础层；构建层复制前清空 /app。CI #67 曾拦截继承基础层带来的旧 map，相关修复保持验收门槛不变。
