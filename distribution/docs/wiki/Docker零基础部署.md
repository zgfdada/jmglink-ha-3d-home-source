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


## v0.1.5-custom.43 MCP

MCP随App与Docker一同安装、更新；启用方式、自定义端口、共用权限和私有目录备份见 [MCP部署与权限](../MCP本地部署与使用.md)。管理绿灯不代表独立端口连通。
