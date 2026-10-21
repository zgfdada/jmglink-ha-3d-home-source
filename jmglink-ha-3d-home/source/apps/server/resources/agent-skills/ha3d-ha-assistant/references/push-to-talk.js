// Keep browser recognition callbacks within one press/release session. Results
// are cumulative snapshots, not commands; only final results may reach HA.
export function createPushToTalk({
  createRecognition,
  onSubmit,
  onListening = () => {},
  onStatus = () => {},
  setTimer = setTimeout,
  clearTimer = clearTimeout,
}) {
  let current = null;
  function close(session) {
    if (current !== session) return;
    current = null;
    clearTimer(session.timer);
    const recognition = session.recognition;
    recognition.onstart =
      recognition.onresult =
      recognition.onend =
      recognition.onerror =
        null;
    onListening(false);
  }
  function finish(session) {
    if (current !== session || !session.released || !session.ended) return;
    close(session); // Lock before invoking callbacks, including synchronous ones.
    if (session.text) onSubmit(session.text);
    else onStatus("未识别到完整语音，请重试");
  }
  return {
    get busy() {
      return current !== null;
    },
    start() {
      if (current) return false;
      let recognition;
      try {
        recognition = createRecognition();
      } catch {
        onStatus("无法启动语音识别，请检查麦克风权限");
        return false;
      }
      if (!recognition) {
        onStatus("浏览器不支持语音识别");
        return false;
      }
      const session = { recognition, text: "", released: false, ended: false };
      current = session;
      recognition.lang = "zh-CN";
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.onstart = () => {
        if (current !== session) return;
        onListening(!session.released);
        onStatus(
          session.released ? "正在整理识别结果…" : "正在聆听，松开发送…",
        );
      };
      recognition.onresult = (event) => {
        if (current !== session) return;
        session.text = Array.from(event.results ?? [])
          .filter((result) => result.isFinal)
          .map((result) => result[0]?.transcript?.trim() ?? "")
          .filter(Boolean)
          .join(" ");
      };
      recognition.onend = () => {
        if (current !== session) return;
        session.ended = true;
        onListening(false);
        if (!session.released) onStatus("识别已结束，松开发送");
        finish(session);
      };
      recognition.onerror = (event) => {
        if (current !== session) return;
        close(session);
        try {
          recognition.abort();
        } catch {}
        const messages = {
          "not-allowed": "麦克风访问被拒绝，请检查浏览器权限",
          "service-not-allowed":
            "浏览器不允许使用语音识别服务，请改用支持的浏览器",
          "audio-capture": "无法访问麦克风，请检查设备是否可用",
          network: "语音识别服务连接失败，请重试或改用文字输入",
          "no-speech": "没有听到语音，请重新按住说话",
          aborted: "语音识别被中断，请重新按住说话",
        };
        onStatus(messages[event?.error] ?? "语音识别失败，请重试");
      };
      onStatus("正在启动麦克风…");
      try {
        recognition.start();
      } catch {
        close(session);
        onStatus("无法启动语音识别，请重试");
        return false;
      }
      return true;
    },
    release() {
      const session = current;
      if (!session || session.released) return;
      session.released = true;
      onListening(false);
      if (session.ended) {
        finish(session);
        return;
      }
      onStatus("正在整理识别结果…");
      session.timer = setTimer(() => {
        if (current !== session) return;
        close(session);
        try {
          session.recognition.abort();
        } catch {}
        onStatus("语音识别结束超时，请重试");
      }, 5000);
      try {
        session.recognition.stop();
      } catch {
        close(session);
        onStatus("语音识别已中断，请重试");
      }
    },
    cancel() {
      const session = current;
      if (!session) return;
      close(session);
      try {
        session.recognition.abort();
      } catch {}
    },
  };
}
