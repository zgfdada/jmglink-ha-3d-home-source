# GitHub Actions 与 GHCR 迁移

2026-11-03 起的开发入口：

| 用途 | 当前地址 |
| --- | --- |
| 源码／CI | https://github.com/zgfdada/jmglink-ha-3d-home-source |
| HA 安装库／Release | https://github.com/zgfdada/jmglink-ha-3d-home-custom |
| 后续正式镜像 | `ghcr.io/zgfdada/jmglink-ha-3d-home-custom` |

本地两个检出目录的 `origin` 已改为 GitHub、`main` 跟踪 `origin/main`，`remote.pushDefault=origin`；原 Gitea 地址保留为 `gitea` 远程。不自动发布尚未提交的本地功能。

## 工作流

- `.github/workflows/ci.yml`：main Push、PR 和手动触发，仅白名单校验、测试、正式模式构建和隔离冒烟；权限 `contents: read`，不上传镜像或创建 Release。
- `.github/workflows/release-addon-image.yml`：只在 `v*` Tag 时触发，Tag 必须与版本文件一致。AMD64 在 `ubuntu-24.04`、ARM64 在 `ubuntu-24.04-arm` 原生构建；最后汇总多架构索引、完成两平台冒烟、校验匿名拉取，再提升 latest 并更新安装库与 Release。
- `.github/workflows/windows-runner-test.yml`：手动执行，使用 GitHub `windows-2022`，不再调用本机 Windows Runner。
- 原 `.gitea/workflows` 迁出，历史定义可从 Git 历史查看；不会再因向备份 Gitea 推送而运行本轮工作流。没有修改或卸载 220 上原有 Runner。

## 凭据和权限

GHCR 发布使用工作流自动生成的 `GITHUB_TOKEN`，只在构建／汇总发布 job 声明 `packages: write`，无需给本机 PAT 增加 `write:packages`。日常 CI 不使用写权限或跨仓库凭据。

安装库跨仓库写入需要 `INSTALLATION_TOKEN`，已通过 GitHub Actions Secrets 公钥加密配置，仅在 Tag 发布最后阶段注入；值不写源码、日志或安装快照。更换凭据时，需对安装库具有 Contents 写权限；不应复用 Gitea Token。

GitHub Actions 已启用，默认工作流权限为只读，允许固定 SHA 的 checkout、Buildx 和 QEMU Actions。PR 不走 `pull_request_target`，不发布软件包。

## 首次 GHCR 发布与旧版本

迁移本身不打新 Tag、不重新发布 `0.1.5-custom.38`，也不把线上安装库的现有版本改指一个尚未存在的 GHCR 镜像。`distribution` 里的 GHCR 配置是下一次正式发布的快照。

GHCR 首次创建的软件包默认是私有。首次正式 Tag 构建上传镜像后，必须在软件包 Settings 将可见性设为 Public，才能让未登录的 HA 用户拉取。首次流程如停在“验证 GHCR 镜像可匿名拉取”，改为公开后重跑失败 job；该校验发生在 latest 提升及安装库切换前，避免用户收到无法安装的配置。无需重新打版本标签。

版本化教程保留在安装库的 `docs/wiki`；不依赖 GitHub Wiki 的单独初始化或 Gitea 专属 Wiki API。`publish-installation.py` 使用 GitHub Git Data API 原子创建安装快照提交，非强制更新分支，发布文件集仍严格受 `distribution-manifest.json` 白名单约束。

## 验证

运行 `python scripts/publish-installation.py --check`、`python scripts/test-publication.py`、`python scripts/test-github-publication.py`，再运行源码测试和正式模式容器构建。远端 CI 的开始、完成时间及最终结果按实际 Actions 运行记录补充；迁移期间不修改 8101 或真实 HA 设备。
