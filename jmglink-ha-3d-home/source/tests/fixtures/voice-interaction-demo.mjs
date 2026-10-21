// Local-only browser QA: all assistant messages are simulated; no TG or HA writes.
import Fastify from "fastify";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { VoiceAssistant, registerVoiceAssistantRoutes } from "../../apps/server/src/voice-assistant/VoiceAssistant.js";

const dir = await mkdtemp(path.join(os.tmpdir(), "ha3d-interaction-demo-"));
let pending, answered = false, resolveTurn;
let turnCount = 0, answerCount = 0;
const app = Fastify();
let startCount = 0, progressCount = 0;
const faults = process.env.HA3D_DEMO_PROXY_FAULTS === "1";
app.addHook("onSend", async (request, reply, payload) => {
  if (request.url === "/api/voice-assistant/start" && ++startCount === 1 && faults) {
    reply.code(502).type("text/plain"); return "Simulated lost submit response";
  }
  if (request.url === "/api/voice-assistant/interaction" && ++progressCount === 1 && faults) {
    reply.code(502).type("text/plain"); return "Simulated proxy outage";
  }
  return payload;
});
const assistant = await VoiceAssistant.create(dir, {}, async (url, options) => {
  if (url.endsWith("/models")) return Response.json({ data: [{ id: "demo" }], ha3d: { mode: "telegram_shared" } });
  if (url.endsWith("/chat/completions")) {
    turnCount++; answered = false;
    pending = { id: "demo-" + turnCount, question: "【模拟验证】你要关闭全屋所有灯，还是只关闭客厅角灯？本次不会操作真实设备。", choices: ["确认关闭全屋所有灯", "只关闭客厅角灯"] };
    return new Promise((resolve) => { resolveTurn = resolve; });
  }
  if (url.endsWith("/answer")) {
    const body = JSON.parse(options.body);
    if (answered || body.clarificationId !== pending?.id) return Response.json({ error: "expired" }, { status: 409 });
    answered = true; answerCount++;
    resolveTurn(Response.json({ choices: [{ message: { content: "模拟验证完成：已收到选择「" + body.answer + "」，原任务继续完成。未操作真实设备。" } }] }));
    pending = null;
    return Response.json({ ok: true });
  }
  return Response.json({ state: pending ? "waiting_for_input" : "running", clarification: pending });
});
await assistant.save({ provider: "hermes", hermes: { baseUrl: "http://simulation.invalid", apiKey: "simulation-only-not-a-real-key", model: "demo", timeoutSeconds: 30 } });
await registerVoiceAssistantRoutes(app, assistant);
app.get("/simulation-stats", async () => ({ turnCount, answerCount, startCount, progressCount, faults, pending: Boolean(pending) }));
app.get("/*", async (request, reply) => {
  const response = await fetch("http://127.0.0.1:8101" + request.raw.url);
  reply.code(response.status);
  reply.header("Content-Type", response.headers.get("content-type") || "application/octet-stream");
  reply.header("Cache-Control", "no-store");
  return Buffer.from(await response.arrayBuffer());
});
for (const signal of ["SIGINT", "SIGTERM"]) process.once(signal, async () => { await app.close(); await rm(dir, { recursive: true, force: true }); process.exit(0); });
try { await app.listen({ host: "127.0.0.1", port: 18102 }); } catch (error) { await rm(dir, { recursive: true, force: true }); throw error; }
console.log("SIMULATION_READY http://127.0.0.1:18102/ data=" + dir);
