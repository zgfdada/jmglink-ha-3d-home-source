# JMGLink HA 3D Home 本地修改版

> 本文件只记录早期运行产物覆盖方案，保留用于历史对照。当前用户请阅读 [README.md](README.md)，开发者请阅读 [README_CODE.md](README_CODE.md)，新功能应在 `jmglink-ha-3d-home/source` 中开发。

当前目录从官方 Docker 镜像 `0.1.5`（amd64）提取了可执行构建产物。镜像不包含 React/TypeScript 原始源码或前端 source map；`extracted-image` 中的后端是编译后的 ES 模块，前端是 Vite 压缩产物。

本地补丁包含以下功能：

- 在设备编辑栏的设备类型按钮下方增加 Home Assistant Area 房间按钮。房间、设备类型和搜索词可以组合筛选，计数会随设备类型变化。房间列表来自 `/api/ha/areas`，因此独立部署连接 Home Assistant 后才会出现实际房间。
- 为衣柜、橱柜、电视柜、书架、餐边柜、鞋柜和床头柜增加“离地高度”属性。选择对应家具后，可在“尺寸与位置”中按米配置 `0–12 m`；默认值为 `0 m`，编辑预览和全屋 3D 视图会同步抬高模型。

## 运行

```powershell
docker compose -f docker-compose.room-filter.yml up -d --build
```

浏览器访问 `http://127.0.0.1:8099`。运行数据和通过界面保存的 Home Assistant 连接配置位于 `docker-runtime/data`，该目录已加入 `.gitignore`。

## 重新应用补丁

若重新从同一镜像提取原始构建产物，可执行：

```powershell
node .\patch-room-filter.mjs
node .\patch-cabinet-elevation.mjs
docker compose -f docker-compose.room-filter.yml up -d --build
```

补丁脚本会验证压缩产物中的精确代码锚点。上游镜像升级并改变文件名或构建结构时，脚本会停止，需要重新分析新版产物。
