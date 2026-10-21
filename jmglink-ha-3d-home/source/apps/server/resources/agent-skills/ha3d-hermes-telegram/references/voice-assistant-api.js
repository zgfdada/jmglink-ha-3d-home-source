// HA Ingress may assign application/octet-stream to a bodyless POST.
// Send an explicit JSON object for control requests so Fastify can parse them.
export async function callVoiceAssistant(path, options = {}, fetchImpl = fetch) {
  const request = { ...options };
  if (request.method?.toUpperCase() === "POST" && request.body === undefined) {
    request.headers = { ...request.headers, "Content-Type": "application/json" };
    request.body = "{}";
  }
  const response = await fetchImpl("./api/voice-assistant/" + path, request);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "语音助手配置请求失败");
  return data;
}
