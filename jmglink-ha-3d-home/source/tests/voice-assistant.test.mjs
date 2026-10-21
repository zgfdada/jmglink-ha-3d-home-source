import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import Fastify from "fastify";
import {
  VoiceAssistant,
  registerVoiceAssistantRoutes,
} from "../apps/server/src/voice-assistant/VoiceAssistant.js";

const id = "test_session_0123456789";
const input = (text = "开灯", requestId = "test_request_0123456789") => ({
  text,
  clientSessionId: id,
  requestId,
});
async function fixture(t, ha = {}, fetchImpl) {
  const dir = await mkdtemp(path.join(os.tmpdir(), "ha3d-voice-"));
  const assistant = await VoiceAssistant.create(dir, ha, fetchImpl);
  const app = Fastify();
  await registerVoiceAssistantRoutes(app, assistant);
  t.after(async () => {
    await app.close();
    await rm(dir, { recursive: true, force: true });
  });
  return { app, assistant, dir };
}
const hermesConfig = {
  provider: "hermes",
  hermes: {
    baseUrl: "http://192.168.31.220:8645/v1/",
    apiKey: "test-secret-only",
    model: "tghome",
    timeoutSeconds: 10,
  },
};

test("配置默认 HA，密钥只写运行文件，GET/PUT 不回显，重启和留空保存保留密钥", async (t) => {
  const { assistant, app, dir } = await fixture(t);
  assert.equal(assistant.publicConfig().provider, "ha");
  const saved = await app.inject({
    method: "PUT",
    url: "/api/voice-assistant/config",
    payload: hermesConfig,
  });
  assert.equal(saved.statusCode, 200);
  assert.ok(!saved.body.includes("test-secret-only"));
  assert.equal(saved.json().hermes.apiKeyConfigured, true);
  assert.equal(saved.json().hermes.baseUrl, "http://192.168.31.220:8645");
  await assistant.save({ hermes: { apiKey: "", model: "tghome" } });
  const restarted = await VoiceAssistant.create(dir, {});
  assert.equal(restarted.config.hermes.apiKey, "test-secret-only");
  assert.ok(
    (await readFile(path.join(dir, "voice-assistant.json"), "utf8")).includes(
      "test-secret-only",
    ),
  );
  await assistant.save({ provider: "ha", clearApiKey: true });
  assert.equal(assistant.publicConfig().hermes.apiKeyConfigured, false);
});

test("拒绝带凭据和查询参数的网关地址及外站写入，不回显密钥", async (t) => {
  const { app } = await fixture(t);
  for (const baseUrl of [
    "file:///etc/passwd",
    "http://user:password@host",
    "http://host/?key=secret",
  ]) {
    const r = await app.inject({
      method: "PUT",
      url: "/api/voice-assistant/config",
      payload: { ...hermesConfig, hermes: { ...hermesConfig.hermes, baseUrl } },
    });
    assert.equal(r.statusCode, 400);
    assert.ok(!r.body.includes("test-secret-only"));
  }
  const cross = await app.inject({
    method: "PUT",
    url: "/api/voice-assistant/config",
    headers: { origin: "https://foreign.test" },
    payload: { provider: "ha" },
  });
  assert.equal(cross.statusCode, 403);
});

test("不同终端和域名经 Ingress 共用服务端配置，不依赖首个终端的 Cookie 或请求 ID", async (t) => {
  const seen = [];
  const { app, assistant, dir } = await fixture(t, {
    runAssistPipeline: async (request) => { seen.push(request); return { speech: "模拟成功" }; },
  });
  await assistant.save({ pipelineId: "共享助手" });
  for (const [index, origin] of ["https://ha-one.test", "https://ha-two.test", "http://192.168.31.244:8123"].entries()) {
    const headers = { host: "172.30.33.5:8099", origin, "sec-fetch-site": "same-origin", cookie: "ingress_session=terminal_" + index };
    const config = await app.inject({ url: "/api/voice-assistant/config", headers });
    assert.equal(config.json().pipelineId, "共享助手");
    const result = await app.inject({ method: "POST", url: "/api/voice-assistant/message", headers,
      payload: { text: "仅模拟回复", clientSessionId: "terminal_session_000" + index, requestId: "terminal_request_000" + index } });
    assert.equal(result.statusCode, 200, result.body);
    assert.equal(result.json().text, "模拟成功");
  }
  assert.equal(seen.length, 3);
  assert.ok(seen.every((request) => request.pipelineId === "共享助手"));
  assert.equal((await VoiceAssistant.create(dir, {})).publicConfig().pipelineId, "共享助手");
});

test("所有语音写接口支持代理同源，仍拒绝外站、同站跨源及伪造转发来源", async (t) => {
  const app = Fastify(); t.after(() => app.close());
  let calls = 0;
  const ok = async () => { calls++; return { ok: true }; };
  await registerVoiceAssistantRoutes(app, { save: ok, testConnection: ok, interaction: ok, message: ok, start: ok });
  const routes = [
    ["PUT", "config", { provider: "ha" }], ["POST", "test", {}],
    ["POST", "message", input()], ["POST", "start", input()], ["POST", "interaction", { clientSessionId: id, requestId: id }],
    ["POST", "answer", { clientSessionId: id, requestId: id, clarificationId: "choice", answer: "1" }],
  ];
  for (const [method, route, payload] of routes) {
    for (const headers of [
      { host: "internal:8099", origin: "https://external.test", "sec-fetch-site": "same-origin" },
      { host: "localhost:8101", origin: "http://localhost:8101" },
    ]) assert.equal((await app.inject({ method, url: "/api/voice-assistant/" + route, headers, payload })).statusCode, 200);
    const before = calls;
    for (const headers of [
      { origin: "https://evil.test", "sec-fetch-site": "cross-site" },
      { origin: "https://evil.test", "sec-fetch-site": "same-site" },
      { origin: "https://evil.test", "x-forwarded-host": "evil.test", referer: "https://evil.test/page" },
      { origin: "null", "sec-fetch-site": "same-origin" },
      { origin: "file:///page", "sec-fetch-site": "same-origin" },
      { host: "localhost", origin: "http://localhost", "sec-fetch-site": "cross-site" },
      { "sec-fetch-site": "cross-site" },
    ]) assert.equal((await app.inject({ method, url: "/api/voice-assistant/" + route, headers, payload })).statusCode, 403);
    assert.equal(calls, before, "Rejected requests must not reach the assistant");
  }
});

test("短提交独立运行，完成及失败可查询；重复提交去重且其他终端无法读取", async (t) => {
  let finish, calls = 0;
  const { app } = await fixture(t, { processConversation: async () => {
    calls++; return new Promise((resolve, reject) => { finish = { resolve, reject }; });
  } });
  const request = input("只读模拟");
  const identity = { clientSessionId: request.clientSessionId, requestId: request.requestId };
  const start = () => app.inject({ method: "POST", url: "/api/voice-assistant/start", payload: request });
  assert.equal((await start()).json().state, "accepted");
  assert.equal((await start()).statusCode, 200); assert.equal(calls, 1);
  const progress = (body = identity) => app.inject({ method: "POST", url: "/api/voice-assistant/interaction", payload: body });
  assert.equal((await progress()).json().state, "running");
  assert.equal((await progress({ ...identity, clientSessionId: "other_terminal_0000" })).statusCode, 404);
  assert.equal((await app.inject({ method: "POST", url: "/api/voice-assistant/start", payload: { ...request, text: "不同文本" } })).statusCode, 409);
  finish.resolve({ speech: "自动模式" }); await new Promise(setImmediate);
  assert.equal((await progress()).json().result.text, "自动模式");
  assert.equal((await start()).statusCode, 200); assert.equal(calls, 1);
  request.requestId = identity.requestId = "next_request_0123456789";
  await start(); finish.reject(new Error("private upstream details")); await new Promise(setImmediate);
  const failed = (await progress()).json();
  assert.equal(failed.state, "failed"); assert.ok(!JSON.stringify(failed).includes("private upstream"));
});

test("真实前后端协议在提交响应丢失及进度502后取回慢回复，仅执行一次", async (t) => {
  const { sendVoiceMessage } = await import("../apps/web/src/domain/voice-interaction.js");
  let finish, calls = 0, starts = 0, polls = 0;
  const { app } = await fixture(t, { processConversation: async () => {
    calls++; return new Promise((resolve) => { finish = resolve; });
  } });
  const text = await sendVoiceMessage(input("模拟慢查询"), undefined, async (url, options) => {
    if (url.endsWith("/start")) {
      starts++;
      const accepted = await app.inject({ method: "POST", url: url.slice(1), payload: JSON.parse(options.body) });
      assert.equal(accepted.json().state, "accepted");
      return new Response("upstream response lost", { status: 502 });
    }
    polls++;
    if (polls === 1) return new Response("Bad Gateway", { status: 502 });
    if (polls === 4) { finish({ speech: "客厅灯光为自动模式" }); await new Promise(setImmediate); }
    const response = await app.inject({ method: "POST", url: url.slice(1), payload: JSON.parse(options.body) });
    return new Response(response.body, { status: response.statusCode });
  }, 1);
  assert.equal(text, "客厅灯光为自动模式"); assert.equal(calls, 1); assert.equal(starts, 1);
});

test("HA 分流保留指定 pipeline，错误变中文提示，不执行重试", async (t) => {
  let calls = 0;
  const { assistant } = await fixture(t, {
    runAssistPipeline: async ({ pipelineId }) => {
      calls++;
      assert.equal(pipelineId, "管家");
      return {
        speech: "Error code:429 rate_limit_exceeded",
        responseType: "error",
      };
    },
  });
  await assistant.save({ pipelineId: "管家" });
  await assert.rejects(assistant.message(input()), /限流/);
  await assert.rejects(assistant.message(input()), /限流/);
  assert.equal(calls, 1);
});

test("Hermes 测试只 GET models，要求共享 TG 网关标识并反馈绑定目标", async (t) => {
  const calls = [];
  const { assistant } = await fixture(t, {}, async (url, options) => {
    calls.push({ url, options });
    return Response.json({
      data: [{ id: "tghome" }],
      ha3d: {
        mode: "telegram_shared",
        botUsername: "home_bot",
        chatId: "test-chat",
      },
    });
  });
  await assistant.save(hermesConfig);
  const r = await assistant.testConnection();
  assert.equal(r.target.botUsername, "home_bot");
  assert.equal(calls.length, 1);
  assert.match(calls[0].url, /\/v1\/models$/);
  assert.equal(calls[0].options.method, undefined);
  assert.equal(calls[0].options.redirect, "error");
  assistant.fetch = async () =>
    Response.json({ data: [{ id: "ordinary-api" }] });
  await assert.rejects(assistant.testConnection(), /不是 Telegram/);
});

test("共享 TG 请求只转发当前一句和请求ID；同请求去重，不创建独立对话历史", async (t) => {
  const calls = [];
  const { assistant } = await fixture(t, {}, async (url, options) => {
    calls.push(JSON.parse(options.body));
    return Response.json({ choices: [{ message: { content: "已开启" } }] });
  });
  await assistant.save(hermesConfig);
  const [a, b] = await Promise.all([
    assistant.message(input()),
    assistant.message(input()),
  ]);
  assert.equal(a.text, b.text);
  assert.equal(calls.length, 1);
  await assert.rejects(assistant.message(input("另一个指令")), /编号重复/);
  await assistant.message(input("调亮", "test_request_second_0123456789"));
  assert.deepEqual(calls[1].messages, [{ role: "user", content: "调亮" }]);
  assert.equal(calls[0].request_id, "test_request_0123456789");
});

test("处理中禁止不同指令并发和修改配置；网络错误无自动重试且不泄露上游报错", async (t) => {
  let resolve,
    calls = 0;
  const { assistant } = await fixture(t, {}, async () => {
    calls++;
    return new Promise((r) => {
      resolve = r;
    });
  });
  await assistant.save(hermesConfig);
  const pending = assistant.message(input());
  await assert.rejects(
    assistant.message(input("另一个", "test_request_second_0123456789")),
    /上一条/,
  );
  await assert.rejects(assistant.save({ provider: "ha" }), /等待完成/);
  resolve(Response.json({ choices: [{ message: { content: "完成" } }] }));
  await pending;
  assistant.fetch = async () => {
    calls++;
    throw new Error("Bearer test-secret-only");
  };
  await assert.rejects(
    assistant.message(input("新指令", "test_request_third_0123456789")),
    (error) =>
      !error.message.includes("test-secret-only") &&
      /无法连接/.test(error.message),
  );
  assert.equal(calls, 2);
});


test("澄清状态和答案只属于原客户端请求，回答不创建新 Agent 任务", async (t) => {
  let complete;
  const calls = [];
  const { assistant, app } = await fixture(t, {}, async (url, options) => {
    calls.push([url, options]);
    if (url.endsWith("chat/completions")) return new Promise((resolve) => { complete = () => resolve(Response.json({ choices: [{ message: { content: "完成" } }] })); });
    if (url.endsWith("/answer")) { complete(); return Response.json({ ok: true }); }
    return Response.json({ state: "waiting_for_input", clarification: { id: "question1", question: "选择范围", choices: ["客厅", "全屋"] } });
  });
  await assistant.save({ ...hermesConfig, playback: { enabled: true, volume: 0.35 } });
  assert.deepEqual(assistant.publicConfig().playback, { enabled: true, volume: 0.35 });
  const pending = assistant.message(input());
  await new Promise((resolve) => setImmediate(resolve));
  const identity = { clientSessionId: id, requestId: input().requestId };
  let r = await app.inject({ method: "POST", url: "/api/voice-assistant/interaction", payload: identity });
  assert.equal(r.json().clarification.question, "选择范围");
  r = await app.inject({ method: "POST", url: "/api/voice-assistant/answer", payload: { ...identity, clientSessionId: "another_client_0123456789", clarificationId: "question1", answer: "客厅" } });
  assert.equal(r.statusCode, 404);
  r = await app.inject({ method: "POST", url: "/api/voice-assistant/answer", payload: { ...identity, clarificationId: "question1", answer: "客厅" } });
  assert.equal(r.statusCode, 200);
  assert.equal((await pending).text, "完成");
  assert.equal(calls.filter(([url]) => url.endsWith("chat/completions")).length, 1);
  assert.deepEqual(JSON.parse(calls.find(([url]) => url.endsWith("/answer"))[1].body), { clarificationId: "question1", answer: "客厅" });
  r = await app.inject({ method: "PUT", url: "/api/voice-assistant/config", payload: { playback: { volume: 2 } } });
  assert.equal(r.statusCode, 400);
});


test("HA Ingress 将空 POST 标为二进制时返回415；网页显式 JSON 测试请求能通过", async (t) => {
  const { callVoiceAssistant } = await import("../apps/web/src/domain/voice-assistant-api.js");
  let calls = 0;
  const { app } = await fixture(t, { async getAssistPipelines() { calls++; return []; } });
  const original = await app.inject({ method: "POST", url: "/api/voice-assistant/test", headers: { "content-type": "application/octet-stream" }, payload: "" });
  assert.equal(original.statusCode, 415);
  assert.equal(calls, 0); // Rejected before reaching HA or gateway credentials.
  const result = await callVoiceAssistant("test", { method: "POST" }, async (url, options) => {
    const forwarded = await app.inject({ method: options.method, url: url.slice(1), headers: { "content-type": "application/octet-stream", ...options.headers }, payload: options.body });
    return new Response(forwarded.body, { status: forwarded.statusCode, headers: { "content-type": "application/json" } });
  });
  assert.equal(result.ok, true);
  assert.equal(calls, 1);
});
