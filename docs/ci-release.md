# 构建与发布

## 仓库职责

- 公开源码：`zgf/jmglink-ha-3d-home-source`，包含源码、测试和 `.gitea/workflows`。
- 公开安装：`zgf/jmglink-ha-3d-home-custom`，只接收 distribution 白名单中的安装配置与用户文档。
- 历史 Git 记录和旧 CHANGELOG 不在新的源码仓库中；本地备份用于历史恢复。

## 验证与发布

普通 Push / PR 仅执行白名单检查、版本依赖检查、247 项业务测试、混淆镜像构建与运行检查。正式版本标签执行两架构构建、运行检查、latest 索引更新、公开安装文件与 Wiki 同步、软件包关联及 Release 发布。

发布前同步 config.yaml、工作区 package 版本、锁文件及当前 RELEASE_NOTES.md。正式标签必须为 v加版本号。已有 v24 镜像和安装库标签保持不变，下次正式功能发布需使用新的版本号，不能用清空历史作为重发 v24 的理由。

构建使用 Dockerfile 中固定的干净 Node 基础镜像；不使用已清理的旧 CI/cache 镜像。原业务源码不被产物混淆回写。

## 凭据

REGISTRY_TOKEN 只具有 package 写入范围；INSTALLATION_TOKEN 具有 repository/package 写入范围，用于安装库和软件包同步，均保存在仓库 Secrets。Gitea PAT 范围属于用户资源级，不宣称只可写单个仓库。普通 PR 不使用发布 Secrets。

## 安装与文档同步

Docker 用户使用 latest；HA App 保留具体 version 以供检查更新。只更新安装文档时可使用 publish-installation.py --docs-only，不改写已发布标签或历史 Release。

## 验收与等待

正式发布完成后记录各 Action、累计成功运行与首个 Action 至完成的墙钟时间，失败和重试单列。历史成功最长基线为源码 CI 2 分 00 秒、正式发布 20 分 08 秒、成功关联墙钟 23 分 12 秒；本次仓库重置不下调基线。首次查询分别至少等待 2 分钟和 21 分钟；仍在运行时至少再等 10 分钟。

安装内容按显式白名单导出，禁止符号链接、业务可执行文件和未知文件；校验版本、Markdown 文件链接与远端 Git blob 哈希。文本统一为 LF，避免 Windows 换行差异。安装库 Wiki 与 Release 是后续步骤，不构成跨资源事务；任一步失败不能宣布完整发布成功。
