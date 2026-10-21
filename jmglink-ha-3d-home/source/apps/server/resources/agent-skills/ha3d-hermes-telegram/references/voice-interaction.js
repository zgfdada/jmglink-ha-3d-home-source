// Submit once. Only short, read-only progress requests may be retried.
export async function sendVoiceMessage(payload, onInteraction, fetchImpl = fetch, delay = 800, {
  timeoutMs = 30 * 60 * 1000, requestTimeoutMs = 10000, now = Date.now,
} = {}) {
  const deadline = now() + timeoutMs;
  const identity = { clientSessionId: payload.clientSessionId, requestId: payload.requestId };
  const post = async (action, body) => {
    const response = await fetchImpl("./api/voice-assistant/" + action, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body), signal: AbortSignal.timeout(requestTimeoutMs),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data || typeof data !== "object")
      throw Object.assign(new Error(data?.error || "回复链路暂时中断，正在查询任务状态；请勿重复发送指令"), { status: response.status });
    return data;
  };
  let acknowledged = false, missing = 0;
  try {
    try {
      await post("start", payload);
      acknowledged = true;
    } catch (error) {
      // A broken response is ambiguous: recover the same ID, never re-submit.
      if ([400, 401, 403, 404, 409, 429].includes(error.status)) throw error;
      onInteraction?.(undefined, "提交响应中断，正在查询原任务；请勿重复发送指令");
    }
    while (now() < deadline) {
      let state;
      try {
        state = await post("interaction", identity);
        acknowledged = true; missing = 0;
      } catch (error) {
        if ([401, 403].includes(error.status)) throw error;
        if (error.status === 404 && (acknowledged || ++missing >= 3))
          throw new Error("未找到原任务记录，执行状态未知；请先查看 Telegram 和设备状态，不要重复发送");
        onInteraction?.(undefined, "暂时无法同步助手状态，正在恢复连接；请勿重复发送指令");
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      if (state.state === "failed") throw new Error(state.error || "助手执行结果未知，请查看 Telegram 和设备状态");
      if (state.state === "completed" && state.result)
        return state.result.text || "助手未返回可显示的文本";
      onInteraction?.(state.clarification ? {
        ...state.clarification,
        answer: (answer) => post("answer", { ...identity, clarificationId: state.clarification.id, answer }),
      } : null);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    throw new Error("等待回复超时，任务可能仍在执行；请查看 Telegram 和设备状态，不要重复发送");
  } finally {
    onInteraction?.(null);
  }
}
