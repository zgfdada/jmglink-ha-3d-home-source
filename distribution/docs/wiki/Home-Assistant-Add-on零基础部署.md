# Home Assistant Add-on 零基础部署

## 添加仓库

在 Home Assistant 的 Add-on 商店打开“仓库”，添加：

```text
https://github.com/zgfdada/jmglink-ha-3d-home-custom
```

搜索并安装 **JMGLink HA 3D Home Custom**。启用开机启动和侧边栏显示。

Add-on 使用 Supervisor 提供的凭据自动连接当前 Home Assistant，不需要输入长期访问令牌。

## 从官方版迁移

1. 先制作包含官方 Add-on 的 Home Assistant 备份。
2. 在官方版导出项目 JSON。
3. 安装并启动 Custom 版。
4. 导入 JSON，检查楼层、房间、设备、家具和素材。
5. 再导出一份迁移后的备份。
6. 验证完成后再处理官方版。

官方版和 Custom 版 slug 不同，数据不会自动共用。Custom 版 slug 为 `jmglink_ha_3d_home_custom`，不要修改。


## v0.1.5-custom.43 MCP

MCP随App与Docker一同安装、更新；启用方式、自定义端口、共用权限和私有目录备份见 [MCP部署与权限](../MCP本地部署与使用.md)。管理绿灯不代表独立端口连通。
