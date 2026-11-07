# 部署与升级

## 独立 Docker

使用根目录的 docker-compose.release.yml；安装、升级仅需拉取镜像。

# Docker 镜像部署

安装 Docker Engine / Docker Desktop 和 Compose。无需 Git、Node.js 或其他开发工具。

1. 下载仓库根目录的 `docker-compose.release.yml` 到部署目录。
2. 检查镜像版本、端口和持久化目录。
3. 拉取并启动：

```shell
docker compose -f docker-compose.release.yml pull
docker compose -f docker-compose.release.yml up -d
docker compose -f docker-compose.release.yml ps
```

打开 `http://主机IP:8101`，在界面配置 HA 地址与访问令牌。

Compose 通过独立入口运行已发布的同一多架构镜像。`./ha3d-data` 保存运行数据，`./ha3d-assets` 保存模型素材。旧部署迁移时改为原有目录，先停旧容器；不要同时写同一份数据。

## 更新与回滚

先导出项目 JSON、备份两个目录，保持镜像标签为 `latest`，执行同样的 `pull`、`up -d`。更新不会主动删除挂载目录；不要卸载数据卷。旧版本镜像不再公开保留；需要回滚时使用升级前自行保存的镜像与兼容数据备份。

安装与排障完整入口见仓库 README、部署说明和“数据备份与升级”。
## Home Assistant App

在应用商店添加 https://github.com/zgfdada/jmglink-ha-3d-home-custom ，安装 JMGLink HA 3D Home Custom。Supervisor 自动选择架构并连接 HA。升级前备份 App，保留相同 slug，勿卸载重装。升级后强制刷新页面。

App 运行数据位于 /data，素材位于 /config/assets；运行密钥属于受保护数据。


## MCP安装和更新（v0.1.5-custom.43）

MCP随同App／Docker镜像提供和更新，无需单独安装。App配置mcp_enabled启用，网络设置8102/tcp映射至空闲宿主端口，并配置mcp_public_port匹配。默认关闭；权限和连接保存于独立持久目录，普通业务导出不包含这些私有数据。详细步骤见 [MCP部署与权限](MCP本地部署与使用.md)。
