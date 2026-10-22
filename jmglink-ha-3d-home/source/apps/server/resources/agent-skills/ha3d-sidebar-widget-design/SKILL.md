---
name: ha3d-sidebar-widget-design
description: 为 HA 3D Home 侧边栏创建或修改可导入的 HTML/CSS/JavaScript 控件，并遵循现有玻璃配色、自然高度和浮层交互风格。用于控件设计与页面组合，不用于修改 HA 集成或控制真实设备。
---

# 侧边栏控件设计

先阅读 [风格规范](references/style-guide.md) 和 [控件接口](references/widget-api.md)。以 [完整示例](assets/sidebar-example.json) 的字段和渲染方式为起点；天气与能耗也是普通代码控件，不新增特殊的内置渲染分支。

1. 确定需要的实体及属性，只使用实际提供的数据；未提供的值显示 `--`。实体示例、地址、户名不写成真实数据。禁止写入 Token、Cookie、网关密钥。
2. 编写 HTML/CSS/JS 和 actions 动作声明。模板模式返回只读数据；交互模式在隔离 iframe 中操作自己的 DOM。沿用主题变量，让宿主统一绘制背景与圆角。交互使用通用 ha SDK；从 HA 服务目录选择服务，通过控件默认或页面实例绑定实体，支持首个、全部或指定已绑定实体。新增或修改控件不得添加专属后端服务、实体 ID 或业务判断；音乐、运维也遵循同一协议。
3. 输出 `ha3d-sidebar-v1` JSON，保留用户其他控件和页面；通过开发中心「导入布局」检查草稿，再按用户要求保存或发布。
4. 运行 `node scripts/validate.mjs assets/sidebar-example.json`（将参数替换为新文件）校验配置。
5. 验证白天、黄昏、夜间，390/768/1920px 视口，所有内容完整展开，只有侧栏整体滚动；预览和主页应一致。验证真实数据更新不重载交互控件；大详情在场景浮层中展示；打开设备面板、收起或展开侧栏均不改变相机角度、位置与缩放。保存草稿后验证动作，发布快照与草稿分别授权；未声明服务及越过实际绑定范围的目标必须被拒绝。

## 输出约定

交付可导入 JSON、必要的资源和使用说明，说明数据来源及所需实体属性。不要生成单独一套仅用于演示的渲染器。不要自动部署生产主机或执行设备动作；本包只描述设计接口，不授予操作权限。

## 通用交互资源

动作字段与 SDK 用法见 [控件接口](references/widget-api.md)，字段校验见 [动作 schema](references/widget-actions.js)。交互样板可参考 [运维](references/operations-widget.js) 和 [音乐](references/music-widget.js)；音乐的完整可编辑 UI 源码在 [songloft-source.js](references/songloft-source.js)。样板中的服务声明属于前端控件配置，不是后端业务分支。读取实体更新时保留搜索、账户、歌词和浮层状态，不重新挂载整个控件。
