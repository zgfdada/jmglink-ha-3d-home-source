import test from "node:test";
import assert from "node:assert/strict";
import { sendVoiceMessage } from "../apps/web/src/domain/voice-interaction.js";
import { playVoiceReply, stopVoiceReply } from "../apps/web/src/domain/voice-playback.js";

test("等待最终回复期间展示澄清，选择沿用请求ID，完成后清除交互", async () => {
  const calls = [], updates = [];
  let answered = false;
  const text = await sendVoiceMessage({ text: "模拟选择", requestId: "request1", clientSessionId: "client1" }, (prompt) => {
    updates.push(prompt);
    if (prompt && !answered) { answered = true; prompt.answer("客厅"); }
  }, async (url, options) => {
    calls.push([url, JSON.parse(options.body)]);
    if (url.endsWith("/start")) return Response.json({ state: "accepted" });
    if (url.endsWith("/answer")) return Response.json({ ok: true });
    if (answered) return Response.json({ state: "completed", result: { text: "模拟已完成" } });
    return Response.json({ clarification: { id: "q1", question: "请选择", choices: ["全屋", "客厅"] } });
  }, 1);
  assert.equal(text, "模拟已完成");
  assert.equal(updates[0].question, "请选择");
  assert.equal(updates.at(-1), null);
  assert.deepEqual(calls.find(([url]) => url.endsWith("/answer"))[1], { requestId: "request1", clientSessionId: "client1", clarificationId: "q1", answer: "客厅" });
  assert.equal(calls.filter(([url]) => url.endsWith("/start")).length, 1);
});

test("提交响应和进度请求被代理中断后，仍取回原回复且不重发指令", async () => {
  let starts = 0, polls = 0;
  const updates = [];
  const text = await sendVoiceMessage({ requestId: "same-id", clientSessionId: "same-client" }, (...args) => updates.push(args), async (url) => {
    if (url.endsWith("/start")) { starts++; return new Response("Bad Gateway", { status: 502 }); }
    polls++;
    if (polls === 1) throw new TypeError("network disconnected");
    if (polls < 5) return Response.json({ state: "running", clarification: null });
    return Response.json({ state: "completed", result: { text: "当前为自动模式" } });
  }, 1);
  assert.equal(text, "当前为自动模式"); assert.equal(starts, 1); assert.equal(polls, 5);
  assert.ok(updates.some((args) => args[1]?.includes("恢复连接")));
});

test("真实任务失败、记录丢失与整体等待超时各自终止，不重复提交", async () => {
  for (const mode of ["failed", "missing", "timeout"]) {
    let starts = 0, tick = 0;
    await assert.rejects(sendVoiceMessage({}, undefined, async (url) => {
      if (url.endsWith("/start")) { starts++; return Response.json({ state: "accepted" }); }
      if (mode === "missing") return Response.json({}, { status: 404 });
      return Response.json(mode === "failed" ? { state: "failed", error: "测试执行失败" } : { state: "running" });
    }, 1, { timeoutMs: 5, now: () => tick++ }), mode === "failed" ? /测试执行失败/ : mode === "missing" ? /未找到原任务/ : /等待回复超时/);
    assert.equal(starts, 1);
  }
});

test("播报遵守开关和预设音量，选择中文音色，录音前可停止", () => {
  const spoken = []; let cancelled = 0;
  const voice = { lang: "zh-CN", name: "中文语音" };
  const host = { SpeechSynthesisUtterance: class { constructor(text) { this.text = text; } },
    speechSynthesis: { getVoices: () => [voice], speak: (s) => spoken.push(s), cancel: () => cancelled++ } };
  assert.equal(playVoiceReply("测试", { enabled: false, volume: .5 }, host), false);
  assert.equal(spoken.length, 0);
  playVoiceReply("**请选择客厅**", { enabled: true, volume: .35 }, host);
  assert.equal(spoken[0].volume, .35);
  assert.equal(spoken[0].voice, voice);
  assert.equal(spoken[0].text, "请选择客厅");
  stopVoiceReply(host); assert.equal(cancelled, 2);
  assert.equal(playVoiceReply("测试", { enabled: true }, {}), false);
  host.speechSynthesis.speak = () => { throw new Error("audio unavailable"); };
  assert.equal(playVoiceReply("已执行", { enabled: true }, host), false);
});
