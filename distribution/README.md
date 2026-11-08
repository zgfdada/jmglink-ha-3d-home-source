# JMGLink HA 3D Home Custom

本版新增影院资源模型、实体状态驱动的投影与幕布效果、MCP 使用 Skill 下载和显式全部 HA 实体授权；修复家具／设备整体透明。个人设备绑定和 Node-RED 情景由用户配置。

> 致敬并感谢原作 [JMGLink HA 3D Home](https://gitee.com/tuotuo4ever/jmglink-ha-3d-home) 的原作者及所有贡献者。
>
> 本项目是基于原作的**二次开发作品**，在原有 3D 家居可视化与 Home Assistant 控制能力上继续扩展和维护。

把户型、家具和 Home Assistant 设备放进同一个 3D 家居界面。

[源码仓库](https://github.com/zgfdada/jmglink-ha-3d-home-source) · [安装仓库与版本](https://github.com/zgfdada/jmglink-ha-3d-home-custom)

支持全屋状态查看、设备控制、户型编辑、自定义模型与面板，以及 HA / Hermes 语音助手。可作为 Home Assistant App 安装，也可直接拉取 Docker 镜像独立运行。

**当前版本：`0.1.5-custom.45`** · 支持 `linux/amd64`、`linux/arm64`

[版本下载与更新日志](https://github.com/zgfdada/jmglink-ha-3d-home-custom/releases) · [完整 Wiki](https://github.com/zgfdada/jmglink-ha-3d-home-custom/blob/main/docs/wiki/Home.md) · [RELEASE_NOTES](RELEASE_NOTES.md)

本版本更新墙体透明与统一光路遮挡、可调散射角与截锥渐隐光束、同步星空和多楼层总览，完善右键平移及空闲自动旋转。请查看[版本说明](RELEASE_NOTES.md)。

本版补齐 MCP 设备开发与资源管理接口，下载包同步 Home3D MCP Skill v1.1.2；模型统一按本地资源维护，完整实例导入按内容去重。[MCP 设备开发接口](docs/MCP设备开发接口.md)。

## 你可以做什么

| 模块 | 能力 |
| --- | --- |
| 户型与场景 | 多楼层、墙体、房间、门窗、底图与家具；3D 全屋展示，默认卡通风格 |
| 楼层侧栏 | 按实际楼层选择，独立设计与发布；支持天气、能耗、运维、音乐和房间控件 |
| 设备控制 | 按 HA 房间发现设备，多实体聚合；灯光、空调及其他设备的状态与能力映射 |
| 模型与家具 | GLB / 自包含 GLTF、自定义外观、本地与已安装模型；模型可用于设备或家具 |
| 编辑工具 | 异型柜体、多选复用、对齐吸附、水平基准面；无选中对象时右键平移 2D 画布 |
| 开发中心 | 设备项目、能力映射、面板设计、模拟联调、版本快照与导出 |
| 语音助手 | 轻触输入、长按说话；HA Assist 或 Hermes 原 Telegram Bot 会话，支持澄清选择及回复播报 |
| 数据管理 | 项目导入导出、历史备份、独立设备包；持久化数据与应用镜像分开保存 |

## 选择安装方式

| 方式 | 适合谁 | HA 连接 |
| --- | --- | --- |
| Home Assistant App | 使用 HAOS / Supervisor | 安装后自动连接当前 HA |
| Docker 镜像 | NAS、服务器或 Docker Desktop | 在界面配置 HA 地址与访问令牌 |

两种方式均直接使用已发布镜像，无需在设备上安装开发工具。

## Home Assistant App 安装

1. 在 Home Assistant 的应用商店添加仓库：

   ```text
   https://github.com/zgfdada/jmglink-ha-3d-home-custom
   ```

2. 安装 **JMGLink HA 3D Home Custom**，启动后点击“打开 Web 界面”。
3. 在项目中配置户型、房间和 HA 实体绑定。建议先导入或创建项目，再操作设备。

Supervisor 会按主机架构选择镜像，自动连接当前 HA，无需填写长期令牌。运行参数和数据路径见 [部署说明](docs/deployment.md)。

## Docker 镜像安装

镜像地址：

```text
ghcr.io/zgfdada/jmglink-ha-3d-home-custom:latest
```

使用仓库提供的 [docker-compose.release.yml](docker-compose.release.yml)，将文件保存到自己的部署目录后执行：

```shell
docker compose -f docker-compose.release.yml pull
docker compose -f docker-compose.release.yml up -d
```

打开 `http://主机IP:8101`，在界面配置 Home Assistant 连接。Compose 中已指定独立运行入口，请不要直接使用 App 默认入口启动独立 Docker。

| 主机目录 | 容器目录 | 用途 |
| --- | --- | --- |
| `./ha3d-data` | `/data` | 项目、绑定、助手配置与其他运行数据 |
| `./ha3d-assets` | `/assets` | 用户模型及素材 |

**从旧 Docker 部署迁移时，先备份，再把 Compose 的主机目录改为原有 `docker-runtime-source/data` 和 `docker-runtime-source/assets`。不要空目录启动后误以为旧项目丢失，也不要让两个容器同时写同一份数据。**

## 开始使用

1. **连接 HA**：App 自动连接；独立 Docker 在界面配置连接。
2. **准备户型**：创建或导入项目，绘制墙体、房间与门窗，设置实际尺寸。
3. **放置设备**：按 HA 房间发现设备，选择实体并配置能力映射。
4. **配置外观**：使用内置家具或模型库；高级设备可进入开发中心配置外观和面板。
5. **备份项目**：较大修改前导出完整项目 JSON，同时备份持久化目录。

开发中心的模拟联调不会发送 HA 指令；真实控制会改变所绑定设备状态。请按设备实际能力配置控件。

## 语音与 Agent

轻触右下角麦克风输入文字，长按说话；右键麦克风打开“语音助手配置”。

- **HA 助手**：使用原 HA Assist / conversation 接口。
- **Hermes**：连接局域网会话共享网关，复用原 Telegram Bot 的会话、上下文与工具。
- **多终端**：助手和密钥保存在服务端，各终端分别登录并授权麦克风，无需复制 Cookie。
- **选择问题**：在网页点击选项或补充回答，继续原任务；TG 与网页先到的答案生效。
- **回复播报**：可开启自动播报并保存预设音量，开始录音时停止播报。
- **断线恢复**：短请求查询原任务结果，不自动重发指令；记录丢失或结果未知时先检查 TG 与设备状态。

配置窗口提供对应平台的 skill 文档与 ZIP 包。详细步骤、支持范围与排障见 [语音助手配置](docs/语音助手配置.md)。

## 升级与回滚

**升级前：**导出项目 JSON，并备份整个运行数据与素材目录。网关密钥属于受保护的运行数据，不要放入 Git 或公开截图。

### Home Assistant App

在应用商店检查更新，或使用运维页的“刷新应用更新源”，随后升级 App。升级后强制刷新网页。不要通过卸载重装升级，卸载可能删除 App 数据。

### Docker

Compose 默认使用 `latest`，升级时直接执行：

```shell
docker compose -f docker-compose.release.yml pull
docker compose -f docker-compose.release.yml up -d
```

当前公开镜像仅保留 `latest` 和当前版本。升级前如需保留回滚能力，请自行保存原镜像与兼容数据备份。保留挂载目录；不要删除数据卷或运行目录。

## 常见问题

| 现象 | 先检查什么 |
| --- | --- |
| 升级后仍是旧页面 | 强制刷新浏览器，确认 App 实际版本 |
| 设备显示离线 | HA 连接、实体是否存在及设备实际状态；`unknown` 与 `unavailable` 含义不同 |
| 换终端后语音不可用 | 各终端登录状态、麦克风权限、HTTPS 与当前版本；不要盲目更换网关密钥 |
| TG 已回复但网页失败 | 升级至包含短请求回复恢复的版本，刷新页面，先确认实际执行结果，避免重复操作 |
| 商店暂未显示新版本 | 手动刷新应用更新源；刷新只检查版本，不自动安装 |
| 8101 端口被占用 | 修改 Compose 端口左侧主机端口 |

更多说明：[常见问题](docs/wiki/常见问题.md) · [数据备份与升级](docs/wiki/数据备份与升级.md)

### v29 设计与迁移

侧边栏开发中心支持实体搜索多选、控件代码高亮／校验／格式化、楼层页面设计与导航拖动。控件开发可迁移单个控件及控件库；页面设计可迁移导航页及整层侧栏。主页工具菜单的导入导出支持完整业务实例恢复，导入前自动备份；HA/Hermes 连接信息不迁移，恢复后重新连接并核对实体。

本版本移除旧在线模型目录和安装/发布接口；保留本地上传、已安装模型文件及设备引用。运维、事件等通过控件设计或导入使用。

## 摄像头与界面更新

支持四类内置摄像头、双摄绑定、监控大浮层、居中标签切换、Frigate／ONVIF 云台及外部访问链接。摄像头分类与取消隐藏开关已提供；手机侧栏可整体收起。修复配置面板滚动及摄像头穿顶。内置面板控件精简为 12 项，已有快照与自定义控件保留。HAOS 更新说明由 App CHANGELOG.md 提供；发布不含本地教程及愿景素材。

## 开源许可

本项目采用 **[GPL v3（GPL-3.0-only）](LICENSE)**。再分发 GPL 覆盖的软件时须遵守源码提供等要求；原作致谢、第三方素材许可范围及镜像对应源码入口见[版权与源码说明](NOTICE.md)。历史已发布镜像不因新增声明而重写，后续构建携带许可文件。


## MCP与自定义风格

App和Docker镜像均内置MCP，跟随3DHome安装／更新。默认不启用，按 [MCP部署与权限](docs/MCP本地部署与使用.md)启用和映射自选端口；连接浮窗支持状态、保存地址与外部点击收起。三种内置风格不可覆盖，自定义风格支持新建、修改和另存为。
