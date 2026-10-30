# 开发说明

本文面向参与源码维护、功能开发、测试和发布的开发者。安装与日常使用请阅读 [README.md](README.md)，版本变化请阅读 [RELEASE_NOTES.md](RELEASE_NOTES.md)，运维接手流程请阅读 [服务交接文档](docs/HA3DHome服务交接文档.md)。

## 门磁绑定

`door-sensor-binding.jsx` 采用单个输入框加内嵌下拉按钮的 combobox；结果 listbox 在面板内展开并限高滚动，名称与实体 ID 分行换行，避免原生弹出菜单越界截字。支持方向键、Enter、Escape、失焦关闭，搜索无结果不清除当前绑定；切换门时重置搜索。候选来自完整 HA 实体表，接受 sensor／binary_sensor，不复用设备库辅助实体过滤。`domain/door-sensor.js` 提供候选筛选与共享物理开合判断，2D 编辑器和 3D 场景共用。中文门状态支持带童锁／反锁括号说明的枚举，但“已开锁”和“解除门虚掩”不表示物理开门；保留历史英文门磁状态兼容。绑定不调用 HA 控制服务。3D 门扇使用不透明且写入深度的实体材质，移除绑定后额外添加的 Edges 线框，避免透墙悬空描边；门磁状态仍驱动开合，窗户玻璃不受影响。`door-sensor.test.mjs` 覆盖搜索、类型兼容和状态；`scripts/verify-door-sensor.mjs` 提供纯内存隔离页面验收，不写用户数据。

## 动效资源库

实时状态过滤由 `ha/boundEntityFilter.js` 收集当前户型已放置／房间绑定实体、同设备实体及对应平台绑定中的 selectedEntityIds、extraEntityIds、capabilityBindings 和 capabilityMappings。额外实体保留原归属，不扩大到额外实体所属设备的全部实体。主页在家标签使用的 person／device_tracker 始终独立加入实时范围，删除模型或项目后仍更新。设备平台写入成功后重算过滤范围；HA 状态事件仍使用服务端 150ms、前端 120ms 合批推送，不依赖面板轮询。面板用 `deviceEntities` 的实时值覆盖平台快照，预览使用关联实体全集。`motion-state-options.js` 展示中文状态及原始值，规则保存并匹配原始值，例如 `not_home`。

动效代码存于 `effect.program = {version:1,code}`，扫光支持 `effect.shader.vertex/fragment`；`motion-code.js` 提供默认代码和返回值校验。`motionWorker.js` 返回带禁止网络／子 Worker CSP 的独立运行器脚本；`motion-code-runtime.js` 按源码共享 Worker、按实例隔离闭包与结果，30Hz 采样、初始化／执行超时、最多 16 种并行代码，销毁时取消任务并释放引用。主线程只处理已校验的数字、颜色和向量，不执行用户 JavaScript。`part-motion-engine` 把结果接入真实变换、流光及扫光，旧规则无 program 时保持原算法。代码字段和着色源码作为类型化对象参与 portable 导出，不因其中的说明链接被误删；敏感实例字段过滤规则继续保留。`motion-code-editor.jsx` 负责代码缓冲、编译更新、未应用保护及取消后防止异步回写；库内预览和部件规则预览都反馈运行／GPU 编译错误，失败阻止保存。`motion-code.test.mjs` 覆盖九类代码、实例状态隔离、真实变换、shader、CSP 以及磁盘与设备包保存。

`mobile-development-menu.css` 隐藏手机宽度及手机横屏尺寸下的开发入口和整个子菜单；桌面保留，其他主页工具不受影响。

## 前端白屏恢复与日志

主场景 Canvas 使用 `RecoverableSceneCanvas` 局部错误边界，识别 WebGL 创建失败与上下文丢失，最多自动延迟重试两次（等待 R3F 异步释放），随后保留局部重试入口；普通渲染异常仍交给原边界。开发中心打开时通过 `sceneSuspended` 释放后台主页 Canvas，保留主页状态与编辑器，关闭后重建场景。`disposePreviewObject` 去重释放预览拥有的纹理、几何和材质；预览上下文丢失不会扩散到整页。脱敏日志分类新增 `webgl-context`。`verify-browser-recovery.mjs --webgl` 提供纯内存真实 Canvas 创建失败注入验收，验证局部恢复与规则输入保留。

`entry.js` 先安装 browser-recovery 再异步加载应用；index.html 自带可见启动占位及脚本失败恢复入口。ApplicationBoundary 覆盖根界面，设备开发中心另有独立错误边界与 Suspense，延迟加载不再隐藏主页。旧版动态模块失效时通过 sessionStorage 限制一分钟内至多自动刷新一次；普通渲染错误、离线或存储不可用时保留恢复界面，不反复刷新。`webUi.js` 对缺失静态资源返回真实 404，对 HTML 设置 no-store；SPA 路由继续回退首页。`POST /api/client-errors` 只记录标准错误摘要、类型和相对源码位置，前后端都不接受原始报错文本、完整 URL、状态或凭据。浏览器故障注入使用 `scripts/verify-browser-recovery.mjs`，内容完全在内存中构建，不连接 HA。`browser-recovery.test.mjs` 覆盖刷新限制、404、缓存与日志字段过滤。

## 动效资源库

`packages/schema/src/motion-library.js` 为内置动效资源、分类、参数快照与包校验的共享定义；`MotionLibraryStore` 原子保存 `dataDir/motion-library.json`，串行变更并校验 revision，内置资源支持覆盖与恢复默认，自定义资源可增删改。`motion-effect-fields.jsx` 供资源库和规则编辑器共用；`motion-resource-preview.jsx` 使用相同 `createPartMotionEngine`，共享 WebGL context 池并释放资源。规则保存 `motionResourceId` 和完整 effect 快照，主页不依赖库条目存在，不因默认值变化而改变既有配置。完整实例／设备平台备份携带 motionLibrary，旧备份缺少此字段时保留当前库；单设备包仍直接携带可运行的规则快照。新增渲染类型需同步扩展基础类型、默认资源、参数表单及引擎，而复用现有类型的参数资源可直接在界面新增。`motion-library.test.mjs` 覆盖九类引擎、CRUD、并发冲突、恢复默认、磁盘重开、备份及快照兼容。

## 额外实体与部件动效

无主设备时首次保存额外实体生成 `entityOnly` 项目绑定，使用稳定的 `project:<projectId>` 身份。`entity-only-device.js` 提供只在本应用中存在的设备与模型摆放锚点，不写 HA 注册表，不把外部实体改归项目；聚合、能力校验、联调和发布识别此绑定，数据源全部移除后阻止发布。后续绑定真实主设备保留仍有效的额外来源与映射。并发保存仍验证绑定身份和已选集合；`scripts/verify-extra-entities.mjs --entity-only` 可运行无主设备的隔离页面验收。

额外实体以 binding.extraEntityIds 保存，与主设备 selectedEntityIds 分开；`extra-entity-selection.jsx` 在基础信息内同页筛选与显式保存。`PUT projects/:id/extra-entities` 验证主设备身份、实体存在和选择版本，不重新绑定主设备；移除关联时解除对应能力映射。聚合结果保留 physical entityIds/entities，额外值通过 extraEntities/extraEntityIds 供能力编辑器、校验和主页动效读取，不修改实体 deviceId。注册表改名同步更新额外选择与映射；设备包继续不携带实例绑定。`extra-entities.test.mjs` 覆盖选择→能力映射→同一显隐动效引擎及磁盘重开；`scripts/verify-extra-entities.mjs` 提供无真实 HA 的界面验收。

`domain/surface-scan.js` 提供局部轴向的通用模型表面扫光 Shader，part-motion.js 的 scan 规则可选择整组或单部件。与路径 flow 分开，按目标局部包围范围归一化扫描，叠层共享几何且只释放自有材质；不改原模型材质、不参与点击。主页和模型预览均经 part-motion-engine 驱动，支持反向、宽度、强度、过渡、数值映射与离线退出。表面扫光作为普通声明式规则配置，能力与真实状态值由用户指定，不提供固定车辆预设按钮。参考视频不作为代码或模型资产打包。

## 3D 设备点击范围

内置设备与自定义设备统一使用可见网格的真实形状拾取，移除额外的透明命中球／盒；不按包围盒扩大范围。configureDeviceModelPicking 保留 Three.js 原生拾取方法，逐次检查祖先显隐和材质可见性，适配部件动效位移与显隐；多材质模型按命中面的材质过滤。内置模型挂载及上传模型异步加载完成时分别配置，重复执行不叠加包装。

光束、气流、光晕、地面光斑、辅助选中罩及部件流光通过独立装饰标记和空 raycast 排除拾取；保留渲染且允许点击穿过。灯具选中状态通过灯体高亮和标签表达。scene-picking.test.mjs 覆盖模型本体、附近空白、装饰穿透、部件位移／显隐／透明度和自定义模型光晕／流光。

## 摄像头模型与监控

packages/schema/src/camera-models.js 为四类内置摄像头的共享描述，后端注册 builtin.camera.* 程序化模型，scene 的摆放选择与默认外形使用同一描述。domain/camera-model.js 统一生成 Three.js 几何，供主页 CameraModel 和模型库 ModelPreview 共用；尺寸以实际包围盒归一化，镜头数与尺寸有回归测试，卸载释放几何与材质。旧 camera.wall、camera.doorbell 和已有摆放 ID 保留。

device-library.js 对 camera 保留独立流实体，同物理设备的非 camera 辅助实体不再抢占名额；已摆放物理设备仍排除。编辑器始终提供 camera 分类（零实体也显示）。showHiddenEntities 为编辑器临时状态，打开后将列表数据源切为 deviceLibrary.unplaced；提示数量仍按默认 available 计算，避免开关自身消失，分类、房间和搜索共用切换后的数据源。

HomeView 的设备点击回调识别 camera 域后打开 CameraMonitor 原生 dialog；CameraLiveView 复用现有 Ki 播放器，autoPlay 默认关闭、仅弹窗打开时启用，requestVersion 阻止已关闭或旧实体的异步响应回写。关闭时卸载播放器、HLS 与快照定时器；媒体仍走相对路径 HA 代理，未新增凭据或流地址持久化。隔离浏览器验收使用模拟画面，不等同于真实摄像头视频验收。

## 楼层与面板滚动

PublishedSidebar 的 hidden 独立于内容 collapsed 状态，SidebarVisibilityToggle 与右侧菜单、语音按钮同置 home-action-bar；完整外壳通过原生 hidden 隐藏，保留已挂载的控件和页签。HomeView 持有整栏可见状态，localStorage 键为 ha3d.sidebar.hidden，跨楼层切换不重置；画布 inset 和 has-floor-selector 跟随可见状态，悬浮按钮 aria-expanded/aria-controls 同步。

主页仅显示当前楼层，楼层侧栏独立。只有一层时不绘制楼层选择器；重置视角保留当前楼层。控制面板画布保持 overflow:auto 与受视口限制的 max-height，不能以 overflow:visible 搭配固定最大高度。画布可聚焦，保留外层步骤滚动及固定页脚。

## 项目介绍

JMGLink HA 3D Home Custom 是一个由 Fastify 后端、React 前端、Three.js 场景和共享户型 Schema 组成的 Home Assistant 3D 户型应用。它支持两种运行模式：

- `standalone`：作为独立 Docker 服务运行，通过用户配置的 HA 地址和长期访问令牌连接 Home Assistant。
- `addon`：作为 Home Assistant Add-on 运行，通过 Supervisor API、Ingress 和 `SUPERVISOR_TOKEN` 连接当前 HA。

当前源码基于官方 `0.1.5` 镜像中的 JavaScript 运行产物恢复。恢复工程已经可以安装依赖、运行测试、构建前端并生成 Docker/Add-on 镜像，但无法还原原始变量名、注释、TypeScript 类型和完整组件边界。因此开发时应优先把新逻辑提取到具名模块，逐步减少对大型恢复文件的直接修改。

设备开发中心的模型缩略图共用 `domain/webgl-preview-pool.js`，最多同时占用 6 个 WebGL context。 静态缩略图在模型加载完成并渲染两帧后缓存 PNG 图片，释放 renderer 和队列名额；带动效的缩略图与大图保持实时交互。release 只在微任务中交接，等待当前卸载批次取消失效任务；初始化前检查 DOM 仍连接，失败任务也归还名额。打开预览弹层不卸载缩略图。缩略图离开视口、切换数据或卸载时须释放渲染器并显式丢弃 context；关闭开发中心时只重建主页场景画布，不重置主页交互状态。排查“主页模型偶发空白”时先核对 context 数量和 `webglcontextlost`，不要直接改动用户户型数据。

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

设备中心的“3D 模型资源库”从 `/api/device-platform` 读取本地与已安装模型；从 .32 起移除旧在线目录、预览、安装和发布 API。本地上传、配置和引用不受影响。模型卡片的 3D 预览仅在可见区挂载，离开可见区后释放 WebGL 渲染器。模型 ID 固定，文件仅接受不超过 15 MB 的 GLB 或自包含 GLTF。收藏仅保存在当前浏览器本地。已被设备绑定或自定义项目引用的模型默认不可删除，强制删除后项目会显示模型引用失效。卡片“家具”按钮与配置页家具开关控制同一 `furnitureEnabled` 字段；启用家具不会解除设备模型用途，二者可同时使用。

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

在线模型的目录、预览、安装与发布实现已从本版本移除，服务端不再初始化在线库，也不再注册 `/api/model-library/*`。本地上传、模型配置、预览、收藏及应用继续由设备平台接口提供；已安装模型的 library 来源元数据、资源文件及 ID 保留，不迁移或清空运行目录。旧在线设计文档仅作为历史参考，后续重设计不得直接恢复旧专用实现。

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


## 侧边栏工作区（开发中）

新增独立的服务端楼层级草稿/发布快照和前后端共用布局校验。原项目布局绑定原 F1，新楼层使用空白布局；楼层 ID 随保存、发布和服务动作上下文传递，并验证属于当前项目。`packages/schema/src/sidebar-floors.js` 统一实际楼层标签与空白布局，`tests/sidebar-floors.test.mjs` 覆盖旧布局迁移、独立草稿/发布、楼层重排和动作隔离。主页、控件编辑预览与页面设计使用同一个隔离渲染器；详见 [侧边栏架构和使用说明](docs/sidebar-development.md)。测试：`source/tests/sidebar.test.mjs`。

能耗示例采用 electricity-info-card v3.3.0（chjspp520）适配，详见 docs/sidebar-development.md；交互模式为 opaque-origin iframe，CSP 禁止网络与同源访问，图表库本地加载。

运维与音乐扩展：`operations-widget.js` 按导入的 HA 条件实体展示耗材，`music-widget.js` 包含现有 Songloft 2.1.1 完整可编辑卡片代码；`SidebarServices.js` 统一校验已保存动作声明、HA 服务目录、参数及实际绑定范围，父窗口同时限制操作为当前绑定实体。个人 HA 规则只写入运行布局，不写入源码默认样板。

房间侧栏样板见 `packages/schema/src/room-widget.js`：同一 HTML/CSS/JS 控件通过 roomConfigurations 切换客厅、餐厅、主卧、书房、次卧；不渲染逐灯操作，按房间配置总控/模式及双层窗帘，仍复用 SidebarServices 通用协议。

相机轨道约束统一位于 `apps/web/src/domain/camera-orbit.js`：所有预设保持世界Y轴向上，垂直旋转不进入地板下方，水平旋转无角度限制。不要为俯视切换 camera.up；屏幕取景偏移的参考向量与相机实际up轴分开处理。测试使用真实Three.js OrbitControls验证全周绕转及俯视稳定性。

俯视取景使用 alignedTopCameraPosition 同时平移相机与观察目标，避免侧栏导致目标横向偏移后近垂直相机朝向转约90度；回归测试验证屏幕X向右、平面纵轴向下，并覆盖不同取景偏移。


侧栏默认配置仅主页＋天气；可选能耗/运维/音乐模板不再自动注入。图片在宿主同源会话中通过 `widget-images.js` 读取并向隔离控件提供 data URL，HAOS 服务端代理保留 `/core` 前缀；见 `tests/widget-images.test.mjs` 和 `tests/sidebar-services.test.mjs`。

移动端相机：`reachableOrbitPosition` 将初始取景距离约束到 OrbitControls 的 min/maxDistance，防止竖屏 fitAvailable 放大后的目标不可达而持续插值。`cancelFitOnOrbitStart` 在触摸、旋转、缩放开始时终止自动取景，并在卸载时移除监听。侧栏变化仍通过 `overlayRefitKey` 保持相机；移动侧栏由 top/bottom 拉伸，不保留 244px 固定高度。

轮廓线：`domain/outline-settings.js` 固定默认值 10%，不读取旧浏览器偏好。OutlineEffect 更新缓存材质 uniform 并释放描边资源，不重新取景。

完整实例迁移由 `routes/instanceBackup.js` 提供 `/api/instance-backup` GET/POST；格式为 `ha3d-instance-backup` v1，包含项目集合、当前项目、设备平台资源（含上传模型）、设备草稿/发布/测试记录、控件库和侧栏工作区。POST 必须明确 confirm=true、同源、JSON，最大 128MiB。校验项目与侧栏楼层引用后，保存 `data/instance-backups/before-import-*.json`；ProjectStore 使用 staging 目录切换，旧项目目录保留；失败尝试恢复前快照。不是跨文件系统断电原子事务，恢复失败需使用恢复前备份。连接凭据不在业务备份中。外部 URL 不下载嵌入。

侧栏片段格式为 `ha3d-sidebar-widget-v1` / `ha3d-sidebar-page-v1`，config 为标准侧栏结构；导入时重映射控件和页面 ID，页面包含引用控件。整层格式仍为 `ha3d-sidebar-v1`。回归测试：`tests/instance-backup.test.mjs`、`tests/outline-settings.test.mjs`。


事件与主机资源可选样板位于 packages/schema/src/monitoring-widgets.js，独立离线统计和耗材位于 operations-widget.js。仅通过绑定实体和现有通用 SDK 交互，不增加控件专属服务端路由。行为与接口见 docs/sidebar-development.md；回归覆盖原日志状态、缺失值、独立耗材和刷新目标。


3D 灯光颜色解析位于 apps/web/src/domain/light-color.js：优先当前 color_mode，色温模式不读取残留 RGB；RGB/HS/XY/RGBW/RGBWW 按对应通道解析。scene.js 共用该颜色绘制真实光源、灯具自发光和光晕，移除固定暖黄偏色；房间光色按亮度在线性 RGB 中混合，再编码为 sRGB。色温沿用已有 Kelvin 色表，是屏幕近似渲染，不是光谱或照度标定。

摄像头扩展：cameraSettings 持久化第二路实体、外部 HTTP(S) 地址、云台服务及目标。CameraControlPanel 展示双缩略图，CameraViewer 居中标签切换时仅挂载一个播放器。cameraPtz 路由校验已保存的摆放绑定和同源请求，按实际集成与服务检测 Frigate／ONVIF；Frigate 短移后在 finally 发送停止。vertical-reference 支持 ceiling，摄像头高度根据包围盒尺寸及实例缩放计算，并将底部高度限制在层高减模型高度以内。

发布范围：本地教程和愿景素材保留在开发机器，但从当前 Git 快照、镜像及安装库中排除。builtin-control-selection.js 固定 8101 的 12 项定义；legacyBuiltinControls 仅为旧面板兼容解析，不出现在新库清单。安装导出必须包含版本一致的 App CHANGELOG.md，并通过发布校验。

版本 .33 的精简清单：开关双态按钮、整行按钮、下拉选择、平铺网格、刻度滑轨、步进调节、大字数值、线性进度、分段进度、环形进度、引用文本、虚线分割线。旧内置定义仅供兼容解析，库启动时过滤多余 builtin ID；不删除自定义 ID。

## 部件动效（未发布）

共享 part-motion.js 只接受声明式规则，校验路径、数值、条件、能力引用及重复目标；model-part-labels.js 将显示中文名与模型节点身份分离。ProjectAppearance 保存 appearance.partMotionRules / partLabels，API 校验能力引用，设备包和放置模型快照保留字段。capabilityDependencies / capabilityValidation 纳入规则依赖。part-motion-engine.js 为预览和 UploadedDeviceModel 共用，按层级路径解析节点，按优先级覆盖通道，克隆实例材质并在 dispose 恢复。状态来自 deviceCapabilityBindings + capabilityMappings.attribute，更新不发送服务指令；未知/离线恢复原状，旧洗衣机动画在无通用规则时保留。ModelPreview 提供部件树、射线选中、包围盒和局部路径拾取，配置变化不重建 WebGL context；未保存规则通过步骤 flush 和标签保护。回归见 tests/part-motion.test.mjs，含 API 写盘重开、导出、同名部件、轴心、映射、材质隔离、流光生命周期及中文别名。

## 多架构发布构建

Docker 构建阶段使用 BUILDPLATFORM 原生执行通用 JS 测试、Vite 打包和产物整理；运行阶段保留目标架构 Node 镜像。生产锁文件的 cpu／os 限定依赖及 .node 扩展会阻止发布，未来引入原生依赖时必须增加目标平台安装。正式发布分别验收 AMD64／ARM64 运行镜像。测试 VM 的 2 秒保护期限用于避免高负载或模拟调度误报，不改变浏览器 Worker 的实际运行期限。
