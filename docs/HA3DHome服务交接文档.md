# HA 3D Home 服务交接文档

## 1. 文档用途

本文供后续维护人员和自动化 Agent 接手 **JMGLink HA 3D Home Custom** 时使用，集中说明服务组成、运行方式、数据位置、开发验证、版本发布、升级回滚和故障处理。

建议依次阅读：

1. 本文：了解服务边界和日常操作。
2. [README.md](../README.md)：最终用户安装、使用和备份。
3. [README_CODE.md](../README_CODE.md)：源码结构、数据流、API 和开发约束。
4. [RELEASE_NOTES.md](../RELEASE_NOTES.md)：稳定版本与未发布功能的边界。
5. [Add-on 文档](../jmglink-ha-3d-home/DOCS.md)：Add-on 商店页面和升级说明。

## 2. 项目身份与基线

| 项目 | 内容 |
| --- | --- |
| 项目名称 | JMGLink HA 3D Home Custom |
| Gitea 仓库 | https://gitea.700117.xyz:16666/zgf/jmglink-ha-3d-home-custom |
| 上游项目 | https://gitee.com/tuotuo4ever/jmglink-ha-3d-home.git |
| 当前稳定 Add-on 版本 | 0.1.5-custom.14 |
| Add-on slug | jmglink_ha_3d_home_custom，发布和升级时不得修改 |
| OCI 镜像 | gitea.700117.xyz:16666/zgf/jmglink-ha-3d-home-custom:版本号 |
| 支持架构 | linux/amd64、linux/arm64 |
| 主要技术 | Node.js 22、Fastify、React、Three.js、Vite |

项目以官方 0.1.5 镜像中的 JavaScript 运行产物为恢复基线。当前工程可以安装依赖、运行测试、重新构建前端，并生成独立 Docker 和 Home Assistant Add-on 镜像。恢复过程无法找回原始变量名、注释、TypeScript 类型和完整组件边界，因此修改大型恢复文件时应先提取具名模块，并用行为测试保护数据兼容性。

RELEASE_NOTES 中“未发布”部分代表源码中已经存在、但尚未进入稳定镜像的功能。排查“源码里有、Add-on 中没有”的问题时，先核对 Add-on 版本和 Release。

## 3. 服务组成

| 模块 | 位置 | 职责 |
| --- | --- | --- |
| Web 前端 | jmglink-ha-3d-home/source/apps/web | 项目管理、2D 户型编辑、3D 场景、设备控制和设备开发中心 |
| API 服务 | jmglink-ha-3d-home/source/apps/server | 静态页面、REST API、WebSocket、项目持久化和 HA 代理 |
| 项目 Schema | jmglink-ha-3d-home/source/packages/schema | 默认值、校验、兼容迁移和房间拓扑 |
| Add-on 包装 | jmglink-ha-3d-home | Add-on 元数据、入口、权限、镜像构建和商店文档 |
| Docker 编排 | docker-compose.source.yml | 本地或 NAS 独立运行，映射端口和持久化目录 |
| CI/CD | .gitea/workflows | 普通构建测试、Tag 正式发布和软件包关联 |

主要数据流：

1. 浏览器或 Home Assistant Ingress 访问 Fastify 服务。
2. Fastify 提供前端静态资源、REST API 和 /ws WebSocket。
3. 后端负责项目、设备平台配置和素材持久化。
4. 后端通过 REST 与 WebSocket 连接 Home Assistant。
5. 浏览器只使用相对 /api 和 /ws，不保存 Supervisor 令牌。

## 4. 运行方式

### 4.1 独立 Docker

- 访问地址：http://Docker主机:8101
- 容器内部端口：8099
- 运行模式：HA3D_MODE=standalone
- HA 连接：首次进入页面后填写 Home Assistant 地址和长期访问令牌
- 持久化目录：仓库根目录 docker-runtime-source
- 当前 Compose 默认启用本地开发实体，仅用于开发和演示

启动与检查：

    Set-Location <仓库目录>
    docker compose -f .\docker-compose.source.yml up -d --build
    docker compose -f .\docker-compose.source.yml ps
    Invoke-RestMethod http://127.0.0.1:8101/api/health
    docker logs --tail 200 jmglink-ha-3d-home-source

停止服务但保留数据：

    docker compose -f .\docker-compose.source.yml down

不要删除 docker-runtime-source，其中包括项目、设备配置、实体历史、上传素材和独立模式 HA 连接配置。

### 4.2 Home Assistant Add-on

- 访问方式：Home Assistant Ingress 和侧边栏入口
- 容器内部端口：8099
- 运行模式：HA3D_MODE=addon
- HA 连接：使用 Supervisor 注入的 SUPERVISOR_TOKEN
- 项目与配置：Add-on /data
- 上传素材：/config/assets
- 外部端口：默认不开放

Add-on 仓库地址：

    https://gitea.700117.xyz:16666/zgf/jmglink-ha-3d-home-custom

正常升级必须保留 slug jmglink_ha_3d_home_custom。同一 slug 的升级会保留 /data；卸载再安装可能删除 Add-on 数据，不能把卸载重装当作常规升级方式。

## 5. 数据、备份与恢复

### 5.1 数据位置

| 数据 | Docker 主机路径 | Add-on 容器路径 |
| --- | --- | --- |
| 户型项目 | docker-runtime-source/data/projects/ | /data/projects/ |
| 项目历史备份 | docker-runtime-source/data/projects/backups/ | /data/projects/backups/ |
| HA 连接配置 | docker-runtime-source/data/ha-connection.json | Supervisor 自动提供 |
| HA 实体历史 | docker-runtime-source/data/ha-entity-history.json | /data/ha-entity-history.json |
| 设备模板 | docker-runtime-source/data/device-templates.json | /data/device-templates.json |
| 设备绑定 | docker-runtime-source/data/device-bindings.json | /data/device-bindings.json |
| 模型模板 | docker-runtime-source/data/model-templates.json | /data/model-templates.json |
| 控制面板模板 | docker-runtime-source/data/control-panel-templates.json | /data/control-panel-templates.json |
| 上传素材和模型 | docker-runtime-source/assets/ | /config/assets/ |

设备平台配置采用原子写入并保留最近的 .bak 文件。历史实体只用于离线展示和重新绑定，状态必须标记为不可用，不能视为 Home Assistant 的实时状态。

### 5.2 备份顺序

执行升级、迁移、批量编辑或破坏性调试前：

1. 从项目管理页面导出每个重要项目 JSON。
2. 从设备开发中心导出设备平台完整包，自定义模型会一并嵌入。
3. Docker 版备份整个 docker-runtime-source。
4. Add-on 版创建包含该 Add-on 的 Home Assistant 备份。
5. 确认备份文件可读后再更新或迁移。

项目 JSON 只包含对应户型项目。设备模板、设备绑定、自定义模型和控制面板属于全局配置，需要通过设备开发中心完整导出或数据目录备份保护。

### 5.3 Docker 与 Add-on 迁移

两个版本使用相同项目格式，但数据目录互相独立：

1. 在来源端导出项目 JSON。
2. 在来源端导出设备平台完整包。
3. 在目标端导入项目 JSON。
4. 在目标端导入设备平台完整包。
5. 重新检查 HA Device、Area 和实体绑定。
6. 在 2D 编辑页与 3D 页面各验证一次。

不要把某个 Add-on 的整个 /data 直接覆盖到另一个 slug，也不要把 Docker 的 ha-connection.json 导入 Add-on。

## 6. 日常维护

### 6.1 接手代码前

    git status --short --branch
    git remote -v
    git log --oneline --decorate -10

如工作区存在未提交修改，先确认归属并保留。禁止使用强制重置、强制检出或清理命令处理不明确的修改。较大功能使用 feature/*、fix/* 或 refactor/* 分支，通过 PR 和 CI 合并到 main。

### 6.2 源码验证

    Set-Location .\jmglink-ha-3d-home\source
    npm ci
    npm test
    npm run build

完整 Docker 回归：

    Set-Location <仓库目录>
    docker compose -f .\docker-compose.source.yml up -d --build
    Invoke-RestMethod http://127.0.0.1:8101/api/health
    docker compose -f .\docker-compose.source.yml ps

至少验证：

- 健康接口返回 ok: true。
- 项目列表、载入、保存、导出和重新导入正常。
- 2D 编辑页可以选择、移动和修改对象。
- 3D 页面正确显示墙体、家具和设备。
- HA 连接、Area 筛选和实体状态同步正常。
- 设备模板、绑定、模型和控制面板重启后仍存在。
- Add-on 相关改动使用相对 /api、/ws 和 Ingress 路径。

### 6.3 Docker 更新

    Set-Location <仓库目录>
    git status --short
    git pull --ff-only
    docker compose -f .\docker-compose.source.yml up -d --build
    Invoke-RestMethod http://127.0.0.1:8101/api/health

如果 git pull --ff-only 因本地修改或分支分叉失败，先停止更新并处理 Git 状态，不能用强制重置绕过。

### 6.4 Add-on 更新

1. 确认 Gitea Release、OCI 软件包和多架构镜像均已生成。
2. 在 Home Assistant Add-on 商店执行“检查更新”。
3. 打开 JMGLink HA 3D Home Custom 并执行更新。
4. 等待镜像下载和 Add-on 自动重启。
5. 查看日志，确认后端启动和 Supervisor/HA WebSocket 连接正常。
6. 从侧边栏打开页面并执行 Ctrl+F5。
7. 核对项目、设备平台配置和上传模型仍存在。

## 7. CI 与正式发布

### 7.1 普通 CI

普通 Push、面向 main 的 PR 和手动触发只运行 Build/Test，不发布正式镜像。验证任务使用 linux-docker-220 标签，BuildKit 限制为 2 个 CPU、3 GiB 内存，并通过 package-lock.json 哈希区分依赖缓存。

验证工作流：.gitea/workflows/ci.yml。

如果本地检出中看不到该文件，而 Gitea 远端已经存在，说明本地分支尚未同步最新 main。先保护未提交修改，再通过独立分支或工作树与 origin/main 对齐，不能直接覆盖当前工作区。

### 7.2 正式发布

正式发布只由 v* Tag 触发：

1. 校验 Tag 等于 v 加 config.yaml 中的版本。
2. 顺序构建 linux/arm64 和 linux/amd64，降低同时构建的资源压力。
3. 推送版本-aarch64 和版本-amd64。
4. 创建版本号多架构清单。
5. 把容器软件包关联到当前 Gitea 仓库。
6. 根据 Add-on RELEASE_NOTES 创建或更新同名 Gitea Release。

发布工作流：.gitea/workflows/release-addon-image.yml。

### 7.3 发布前同步版本

- jmglink-ha-3d-home/config.yaml
- jmglink-ha-3d-home/Dockerfile 的 BUILD_VERSION
- source 根目录及各 workspace 的 package.json
- source/package-lock.json 中的 workspace 版本
- 根目录 RELEASE_NOTES.md
- jmglink-ha-3d-home/RELEASE_NOTES.md

不得修改 slug jmglink_ha_3d_home_custom。

### 7.4 推荐发布流程

假设下一次发布 0.1.5-custom.5：

    git switch -c feature/功能名称
    # 修改、测试、更新文档和版本
    git add <本次修改文件>
    git commit -m "feat: 增加功能名称"
    git push -u origin feature/功能名称

通过 PR 和 CI 合并后：

    git switch main
    git pull --ff-only
    git tag -a v0.1.5-custom.5 -m "release: 发布 v0.1.5-custom.5"
    git push origin v0.1.5-custom.5

发布完成的判断标准：

- Gitea Actions 发布任务成功。
- Release 页面存在对应 Tag，且不是草稿。
- Package Registry 中存在两个架构标签和多架构版本标签。
- 多架构清单同时包含 linux/amd64 与 linux/arm64。
- 软件包已关联到本仓库。
- Home Assistant Add-on 商店能够识别新版本。

同一个版本标签不应承载不同源码。功能发生变化时提高版本号，不要删除后复用已经发布的 Tag。

## 8. Secrets 与安全边界

- HA 长期访问令牌只保存在本地运行数据、系统凭据或环境变量中。
- Registry 使用仓库 Secret REGISTRY_TOKEN，不得写入源码、Workflow 明文、日志、Cache、Artifact、Release 或文档。
- 创建 Gitea Release 使用任务内置 GITEA_TOKEN。
- 普通 Build/Test 不读取发布 Secret。
- Checkout 保持 persist-credentials: false。
- 调试导出文件时使用脱敏副本，不把真实家庭户型、实体属性和令牌提交到 Git。
- 日志只能记录令牌是否存在，不能输出令牌值。

## 9. 故障处理

### 9.1 Docker 页面打不开

    docker compose -f .\docker-compose.source.yml ps
    docker logs --tail 200 jmglink-ha-3d-home-source
    Invoke-RestMethod http://127.0.0.1:8101/api/health

依次检查容器是否运行、8101 是否被占用、健康检查是否通过、主机防火墙是否允许访问。重新构建前先确认 docker-runtime-source 仍存在。

### 9.2 Docker 无法连接 Home Assistant

1. 确认 Docker 主机能够访问 HA 地址。
2. 确认长期访问令牌仍有效。
3. 检查 /api/ha/status 和容器日志。
4. 重新保存连接配置或调用重连，不要在终端打印令牌。
5. HA 离线期间出现“历史离线”实体属于预期降级行为。

### 9.3 Add-on 打不开或无法连接 HA

1. 确认 Add-on 正在运行且 Ingress 已启用。
2. 查看日志中的启动、Supervisor API 和 WebSocket 错误。
3. 确认 homeassistant_api: true 未被移除。
4. 检查 Home Assistant 主机资源、磁盘空间和网络。
5. 重启 Add-on；只有 HA Core 本身异常时才考虑重启 HA。

### 9.4 Add-on 商店不显示更新

1. 确认 config.yaml 已提高版本号。
2. 确认同版本 Gitea Release 和多架构 OCI 镜像存在。
3. 在 Add-on 商店重新加载仓库并执行“检查更新”。
4. 确认 HA 主机能够访问 Gitea 代码仓库和 Registry。
5. 确认打开的是名称带 Custom 的增强版。

### 9.5 项目无法导出

官方 0.1.5 在 HA Ingress 中可能因导出请求返回 HTTP 415。本恢复源码版同时保留 GET 和兼容 POST 导出路由。迁移官方版数据时先创建完整 HA 备份，取得数据前不要卸载官方 Add-on。

### 9.6 发布任务失败

- 版本校验失败：同步 Tag、config.yaml、package 文件和 RELEASE_NOTES。
- Registry 登录失败：检查 REGISTRY_TOKEN 是否存在及权限是否有效，不输出其值。
- ARM64 构建失败：检查 QEMU、Buildx 和 Gitea Runner 资源。
- Package 关联冲突：确认使用最新工作流后重跑失败任务。
- Release 已存在：工作流会更新现有 Release，不需要删除 Release 或 Tag。

## 10. 回滚原则

### Docker

1. 保留当前 docker-runtime-source 备份。
2. 切换到已验证的历史 Tag 或 Commit。
3. 使用相同持久化目录重新构建容器。
4. 验证项目和 Schema 能被旧版本读取；如新版本已写入不兼容数据，恢复升级前的数据目录备份。

### Add-on

1. 优先恢复升级前的 Home Assistant 备份。
2. 需要重新发布旧代码时创建新的修复版本，不覆盖现有 Tag。
3. 保持 Add-on slug 不变。
4. 回滚后验证项目、设备平台配置、模型素材和 HA 绑定。

## 11. 已知约束

- 源码来自运行产物恢复，部分前端入口文件仍较大，修改时需要额外回归。
- extracted-image 和 RECOVERY_MANIFEST.json 是恢复来源证据，不是运行目录。
- scripts/reconstruct-source.mjs 会重建恢复基线，可能覆盖人工重构，只能在隔离分支和完整备份后使用。
- Dockerfile.room-filter、docker-compose.room-filter.yml、patch-room-filter.mjs 和 patch-cabinet-elevation.mjs 是早期覆盖方案，新功能以 jmglink-ha-3d-home/source 为准。
- 项目 JSON 与全局设备平台数据是两套备份范围，交接和迁移时必须同时检查。
- 前端浏览器操作仍需人工覆盖关键编辑流程。
- 发布前必须区分当前源码能力和稳定 Add-on 已发布能力。

## 12. 交接检查表

- [ ] 能访问 Gitea 仓库、Actions、Release、Packages 和 Wiki。
- [ ] 知道当前稳定版本、开发分支和未发布功能范围。
- [ ] 现有未提交修改已有负责人或备份。
- [ ] 能运行 npm test、npm run build 和 Docker 健康检查。
- [ ] 能说明 Docker 与 Add-on 的数据目录和备份方式。
- [ ] 已保存项目 JSON 和设备平台完整导出包。
- [ ] 知道 Add-on slug 不得修改，也不能用卸载重装代替升级。
- [ ] 知道普通 Push 只验证，正式 Tag 才发布镜像和 Release。
- [ ] 知道 REGISTRY_TOKEN 只存在于 Gitea Secrets。
- [ ] 能按本文顺序定位页面、HA 连接、Add-on 更新和发布问题。
