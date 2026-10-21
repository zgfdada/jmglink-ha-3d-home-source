# HA 3D Home 可维护恢复工程

完整的项目结构、开发流程、测试规范和发布手册见仓库根目录 [README_CODE.md](../../README_CODE.md)。本文保留恢复源码目录自身的背景和快速构建说明。

此目录把官方 `0.1.5` Docker 镜像中的运行产物恢复成可安装依赖、可重新构建和可逐步重构的源码工作区。`RECOVERY_MANIFEST.json` 记录原始模块的来源和哈希；恢复文件会继续被格式化和重构，因此不把当前源码哈希当作固定值。

## 恢复程度

| 部分 | 当前状态 | 后续维护方式 |
| --- | --- | --- |
| 后端 | 已恢复为可直接运行的 ES Modules | 可以按普通 JavaScript 模块拆分、命名和补测试 |
| Schema | 已恢复实现、类型声明和拓扑模块 | 可逐步合并 `.js` 与 `.d.ts`，重写为 TypeScript |
| 前端业务模块 | 已恢复模块依赖关系、稳定文件名并格式化 | 可逐组件改名、提取 hooks、补类型后迁移为 TSX |
| React/Three/HLS | 保留为恢复的 vendor 模块 | 后续用正式 npm 依赖替换，不在 vendor 文件中开发功能 |
| CSS 与图片 | 已恢复 | 可正常拆分和维护 |

这是行为恢复工程，并非原始源码泄漏或逐字还原。构建产物中已经不存在原始变量名、注释、TypeScript 类型、TSX 写法及完整文件边界，这些信息不能自动恢复。

恢复源码同时修正了官方 `0.1.5` 的项目导出请求：前端改为使用服务器已有的 GET 导出路由，避免空 POST 被 Fastify 以 HTTP 415 拒绝。

## 目录

```text
jmglink-ha-3d-home/source/
├─ apps/
│  ├─ web/
│  │  ├─ src/app/       恢复的应用模块与图片
│  │  ├─ src/domain/    已提取的家具、墙体、对齐和设备排列几何逻辑
│  │  ├─ src/vendor/    恢复的 React、Three.js、HLS 供应商模块
│  │  ├─ src/styles/    原始构建 CSS
│  │  └─ vite.config.js
│  └─ server/src/       Fastify、HA 客户端、项目存储和 WebSocket
├─ packages/schema/
│  ├─ src/              项目规范化与拓扑实现
│  └─ types/            恢复的 TypeScript 声明
└─ RECOVERY_MANIFEST.json
```

前端稳定模块名称：

| 文件 | 原构建分包 |
| --- | --- |
| `src/app/app.js` | `index-CWMUN1IG.js` |
| `src/app/floorplan-editor.js` | `FloorplanEditor-CWRaEIlm.js` |
| `src/app/home-view.js` | `HomeView-BFS1nsev.js` |
| `src/app/scene.js` | `AppSelect-DDRORnJ8.js` |
| `src/app/author-support-dialog.js` | `AuthorSupportDialog-qBRE_uuJ.js` |

新增功能使用具名业务模块承载可测试逻辑：`src/domain/wall-straightening.js` 负责墙链拉直、合并与整体变换，`src/domain/alignment-guides.js` 负责辅助线吸附，`src/domain/device-arrangement.js` 负责设备共线检测、成线和等距排放，`src/domain/walls.js` 负责墙体分段和虚拟墙兼容。

## 安装和构建

需要 Node.js 22 和 npm：

```powershell
cd jmglink-ha-3d-home/source
npm install
npm run build
```

构建结果位于 `apps/web/dist`，包含非压缩代码和 source map。

在仓库根目录运行以下命令，可以用多阶段 Dockerfile 从源码执行测试、构建前端并启动完整服务：

```powershell
docker compose -f docker-compose.source.yml up -d --build
```

测试服务使用 `http://127.0.0.1:8101`，运行数据保存在仓库根目录的 `docker-runtime-source`。停止服务时运行：

```powershell
docker compose -f docker-compose.source.yml down
```

开发服务器默认把 `/api` 和 `/ws` 代理到现有的 `http://127.0.0.1:8099`：

```powershell
npm run dev
```

如后端在其他地址运行：

```powershell
$env:HA3D_BACKEND = "http://127.0.0.1:8100"
npm run dev
```

## 重新生成恢复文件

仓库根目录的 `scripts/reconstruct-source.mjs` 读取 `extracted-image` 并重新生成应用、vendor、后端和 schema 源文件，同时写入来源哈希清单：

```powershell
node .\scripts\reconstruct-source.mjs
cd jmglink-ha-3d-home/source
npm install
npm run format:recovered
```

该命令会重建恢复目录中的 `src` 内容。人工重构后的模块不应再由此脚本覆盖；开始正式重构前，建议把当前恢复基线单独提交。

## 推荐重构顺序

1. 保持 `RECOVERY_MANIFEST.json` 和当前恢复基线不变，作为行为参照。
2. 用 npm 的 React、React DOM、Three.js、React Three Fiber、Drei 和 HLS.js 替换 `src/vendor`。
3. 从 `app.js` 提取 API 客户端、WebSocket 客户端、路由和连接状态。
4. 从 `scene.js` 提取房间、墙体、开口、设备和家具组件。
5. 将 `floorplan-editor.js` 按工具栏、画布、属性面板、设备库和家具库拆分。
6. 将 schema 改写为 TypeScript，并让前后端共同依赖类型源文件。
7. 为项目导入导出、schema 兼容、房间筛选和家具高度增加回归测试。

## 安全

不要把 Home Assistant 长期访问令牌写入源码或提交到 Git。`.env`、运行数据和构建依赖均已忽略，示例文件只保留变量名。
