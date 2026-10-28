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

在应用商店添加 https://gitea.700117.xyz:16666/zgf/jmglink-ha-3d-home-custom ，安装 JMGLink HA 3D Home Custom。Supervisor 自动选择架构并连接 HA。升级前备份 App，保留相同 slug，勿卸载重装。升级后强制刷新页面。

App 运行数据位于 /data，素材位于 /config/assets；运行密钥属于受保护数据。

## 本地 8101 源码实例验证（2026-10-28）

已按用户要求撤销本轮新增的多楼层堆叠、全局侧栏及配套空层地基，恢复按楼层查看；主页移除「项目理念与愿景」入口，独立介绍和教程素材保留。控制面板滚动修复及单楼层隐藏选择器保留。原数据和素材挂载继续使用。回退保护位于 `docker-runtime-source/backups/before-floor-stack-20261028-170704/`，原运行镜像为 `jmglink-ha-3d-home:before-floor-stack-20261028-170704`。

移除后复验：容器内 266 项测试全部通过、生产构建成功，8101 health 正常；浏览器确认 F1/F2 选择器和原楼层侧栏恢复，工具菜单无堆叠设置及「项目理念与愿景」入口。当前户型已清除过期显示模式字段，楼层数据比对未变。

2026-10-28 侧栏悬浮收起：已部署 8101，266 项测试和构建通过。390×844 手机竖屏实测整栏隐藏、悬浮按钮恢复及刷新保留隐藏状态；隐藏后侧栏 display:none、占用尺寸 0×0。当前实例的楼层及发布布局保持原数据。

底栏对齐复验：8101 已部署，266 项测试通过；440×956 视口实测侧栏／菜单／语音按钮均为 44×44，y 坐标均为 892，归属同一 home-action-bar。收起、展开和工具菜单均正常。
