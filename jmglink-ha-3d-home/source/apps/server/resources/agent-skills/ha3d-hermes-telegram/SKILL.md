---
name: ha3d-hermes-telegram
description: 配置和排查 3D Home 的Hermes Telegram 通道接入，使用随包脚本验证连接；仅用于此平台的语音或文字执行后端接入。
---

# Hermes Telegram 通道接入

复用现有 Telegram Bot 的同一聊天、话题、上下文和队列。不要新建独立 Agent 会话，也不要启动第二个 TG poller。

先阅读 references/configuration.md；接入实现位于 references/VoiceAssistant.js，录音提交逻辑位于 references/push-to-talk.js。

在目标环境核对配置后，使用 scripts/probe.py 检查 3D Home 已保存连接。通过环境变量 HA3D_URL 指定 3D Home 地址。此脚本仅测试连接，不发送聊天消息、不执行设备控制。

Hermes 包的 scripts/hermes-telegram-bridge 包含完整平台插件和模拟测试；依照配置文档安装至目标 Bot 的配置目录，在该 Hermes 虚拟环境运行 test_bridge.py。HA 包无需安装该插件。

任何实际设备控制或向 Telegram 发送测试消息，都应先得到用户对目标和内容的授权。仅在测试连接成功后进行获准的真实联调。密钥只保存在受保护的运行配置中，不写入文档、命令行参数、日志或此 skill 包。失败、超时或 429 不自动重试，先确认执行结果。

交付时说明已验证内容、未验证范围和回滚方式。前端提交去重、后端鉴权、会话共享逻辑必须保持一致。


## 澄清选择与语音播报

接入需要覆盖整个请求生命周期：问题出现时把 clarify_id、原请求 ID、问题文本和完整选项同步至网页；回答继续原来的等待任务，不能作为新 Agent 指令入队。Telegram 与网页共享同一问题，先到的答案生效，过期或重复答案返回冲突，不得覆盖第一次答案。等待回答时保留卡片，不套用普通回复的十秒渐出。

`references/voice-interaction.js` 负责只读状态同步与回答提交，`references/voice-clarification.jsx` 提供选项和其他回答输入框。录音提交、命令执行和回答提交均不得自动重试。

`references/voice-playback.js` 使用系统／浏览器中文语音，遵守已保存的播报开关与预设音量。问题按 ID 只朗读一次，开始录音前停止朗读；播报失败不得把已完成的设备指令标为失败。

服务内维护本 skill 的 Markdown 文档和脚本，下载时按 manifest.json 中的显式清单生成 ZIP。禁止将运行配置、TG Token、网关密钥或真实用户 ID 纳入包。修改桥接后同步文档及脚本，并运行模拟测试和只读连接测试再交付。

Hermes 桥接的关键实现都在 `scripts/hermes-telegram-bridge/__init__.py`：原生 send_clarify 的转发观察、等待状态接口、绑定原请求的回答接口、同问题原子去重、流式最终回复提取，以及原生返回值保持文本／None，禁止将内部结果字典传入 Telegram 的文本发送通道。运行同目录的 `test_bridge.py` 验证模拟选择、TG 先回答、双端竞争、请求去重和流式返回；测试不依赖真实设备。
