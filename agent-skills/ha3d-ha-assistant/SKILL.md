---
name: ha3d-ha-assistant
description: 配置和排查 3D Home 的HA 语音助手接入，使用随包脚本验证连接；仅用于此平台的语音或文字执行后端接入。
---

# HA 语音助手接入

使用 3D Home 已有的 HA 连接与 Assist 管道。不要部署 Hermes 插件；不需要再次填写 HA Token。

先阅读 references/configuration.md；接入实现位于 references/VoiceAssistant.js，录音提交逻辑位于 references/push-to-talk.js。

在目标环境核对配置后，使用 scripts/probe.py 检查 3D Home 已保存连接。通过环境变量 HA3D_URL 指定 3D Home 地址。此脚本仅测试连接，不发送聊天消息、不执行设备控制。

HA 包无需安装任何 Hermes 插件。

任何实际设备控制或向 Telegram 发送测试消息，都应先得到用户对目标和内容的授权。仅在测试连接成功后进行获准的真实联调。密钥只保存在受保护的运行配置中，不写入文档、命令行参数、日志或此 skill 包。失败、超时或 429 不自动重试，先确认执行结果。

交付时说明已验证内容、未验证范围和回滚方式。前端提交去重、后端鉴权、会话共享逻辑必须保持一致。


## 会话与语音播报

HA 仍通过原 Assist 管道或 conversation 接口处理自然语言，保留 conversation_id 供下一轮输入使用。本 skill 不安装 TG 插件，也不假定 HA 返回 Hermes 的 clarify_id 或按钮协议。服务里的 Hermes skill 单独包含原 TG 会话的结构化选择桥接。

`references/voice-playback.js` 使用系统／浏览器中文语音，遵守已保存的播报开关与预设音量。开始录音前停止朗读；播报失败不得把已完成的设备指令标为失败。`references/voice-assistant-settings.jsx` 包含播报配置和下载入口。

服务内维护本 skill 的 Markdown 文档和脚本，下载时按 manifest.json 的显式清单生成 ZIP。修改后同步文档及脚本，运行只读连接验证；运行配置和密钥不得进入包。
