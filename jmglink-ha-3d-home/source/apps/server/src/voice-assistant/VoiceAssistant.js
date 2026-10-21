import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const defaults = () => ({
  provider: "ha",
  pipelineId: "",
  playback: { enabled: false, volume: 0.6 },
  hermes: {
    baseUrl: "",
    apiKey: "",
    model: "tghome",
    timeoutSeconds: 120,
  },
});
const problem = (message, statusCode = 400) =>
  Object.assign(new Error(message), { statusCode });
function normalize(input, previous = defaults()) {
  const hermes = { ...previous.hermes, ...input.hermes };
  if (input.hermes?.apiKey === "" || input.hermes?.apiKey === undefined)
    hermes.apiKey = previous.hermes.apiKey;
  if (input.clearApiKey) hermes.apiKey = "";
  hermes.baseUrl = hermes.baseUrl
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/v1$/, "");
  if (hermes.baseUrl) {
    let url;
    try {
      url = new URL(hermes.baseUrl);
    } catch {
      throw problem("请输入有效的 Hermes 网关地址");
    }
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    ) {
      throw problem(
        "网关地址仅支持 HTTP/HTTPS，请勿在地址中填写密钥、查询参数或片段",
      );
    }
    hermes.baseUrl = url.href.replace(/\/+$/, "");
  }
  hermes.apiKey = hermes.apiKey.trim();
  if (/[\r\n\x00]/.test(hermes.apiKey)) throw problem("网关密钥格式无效");
  const provider = input.provider ?? previous.provider;
  if (provider === "hermes" && (!hermes.baseUrl || !hermes.apiKey))
    throw problem("请填写 Hermes 网关地址及访问密钥");
  return {
    provider,
    pipelineId: input.pipelineId ?? previous.pipelineId,
    playback: { ...defaults().playback, ...previous.playback, ...input.playback },
    hermes,
  };
}

export class VoiceAssistant {
  constructor(filePath, config, ha, fetchImpl = fetch) {
    this.filePath = filePath;
    this.config = config;
    this.ha = ha;
    this.fetch = fetchImpl;
    this.writes = Promise.resolve();
    this.sessions = new Map();
    this.requests = new Map();
  }
  static async create(dataDir, ha, fetchImpl) {
    await mkdir(dataDir, { recursive: true });
    const filePath = path.join(dataDir, "voice-assistant.json");
    let config = defaults();
    try {
      config = normalize(JSON.parse(await readFile(filePath, "utf8")));
    } catch (error) {
      if (error.code !== "ENOENT")
        throw problem("语音助手配置无法读取，请检查运行数据文件", 500);
    }
    return new VoiceAssistant(filePath, config, ha, fetchImpl);
  }
  publicConfig() {
    const { apiKey, ...hermes } = this.config.hermes;
    return {
      ...this.config,
      hermes: { ...hermes, apiKeyConfigured: Boolean(apiKey) },
    };
  }
  save(input) {
    const operation = this.writes.then(async () => {
      if ([...this.sessions.values()].some((session) => session.busy))
        throw problem("助手正在执行指令，请等待完成后再修改配置", 409);
      const next = normalize(input, this.config);
      const temporaryPath = this.filePath + "." + randomUUID() + ".tmp";
      await writeFile(temporaryPath, JSON.stringify(next, null, 2), {
        mode: 0o600,
      });
      await rename(temporaryPath, this.filePath);
      this.config = next;
      this.sessions.clear();
      this.requests.clear();
      return this.publicConfig();
    });
    this.writes = operation.catch(() => {});
    return operation;
  }
  async hermesFetch(config, suffix, options = {}) {
    try {
      const response = await this.fetch(
        config.hermes.baseUrl + "/v1/" + suffix,
        {
          ...options,
          redirect: "error",
          signal: options.signal ?? AbortSignal.timeout(config.hermes.timeoutSeconds * 1000),
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + config.hermes.apiKey,
            ...options.headers,
          },
        },
      );
      if (!response.ok) {
        const message =
          response.status === 401 || response.status === 403
            ? "Hermes 网关鉴权失败，请检查访问密钥"
            : response.status === 409 && suffix.endsWith("/answer")
              ? "问题已在其他端回答或已过期，请等待状态更新"
              : response.status === 429
              ? "Hermes 或其模型服务当前限流，请稍后再试"
              : `Hermes 网关返回错误（HTTP ${response.status}）`;
        throw problem(message, response.status === 429 ? 429 : 502);
      }
      return response;
    } catch (error) {
      if (error.statusCode) throw error;
      if (error.name === "TimeoutError" || error.name === "AbortError")
        throw problem(
          "Hermes 请求超时，执行状态未知；请先确认设备状态，不要重复发送",
          504,
        );
      throw problem(
        "无法连接 Hermes 网关，请检查地址、端口与局域网连通性",
        502,
      );
    }
  }
  async testConnection() {
    const config = this.config;
    if (config.provider === "ha") {
      const pipelines = await this.ha.getAssistPipelines();
      return { ok: true, message: "Home Assistant 助手接口可用", pipelines };
    }
    const response = await this.hermesFetch(config, "models");
    let data;
    try {
      data = await response.json();
    } catch {
      throw problem("网关未返回模型列表，请确认填写的是 Hermes API 地址", 502);
    }
    if (!Array.isArray(data.data))
      throw problem("网关未返回兼容模型列表，请检查地址", 502);
    if (data.ha3d?.mode !== "telegram_shared")
      throw problem(
        "此地址不是 Telegram 会话共享网关；普通 Hermes API 不会复用 Bot 通道",
        502,
      );
    return {
      ok: true,
      message: "Telegram 共享网关鉴权通过（未发送 TG 消息或执行设备）",
      target: data.ha3d,
      models: data.data
        .map((item) => String(item.id ?? ""))
        .filter(Boolean)
        .slice(0, 50),
    };
  }
  async message(input) {
    const fingerprint = JSON.stringify([input.text, input.pipelineId]);
    const key = input.clientSessionId + ":" + input.requestId;
    for (const [id, entry] of this.requests)
      if (entry.expires < Date.now() && !entry.pending)
        this.requests.delete(id);
    const cached = this.requests.get(key);
    if (cached) {
      if (cached.fingerprint !== fingerprint)
        throw problem("请求编号重复，请刷新会话后重试", 409);
      return cached.promise;
    }
    if (this.requests.size >= 256)
      throw problem("助手请求过多，请稍后再试", 429);
    const config = this.config;
    let session = this.sessions.get(input.clientSessionId);
    if (!session) {
      for (const [id, item] of this.sessions)
        if (!item.busy && item.updated < Date.now() - 3600000)
          this.sessions.delete(id);
      if (this.sessions.size >= 128)
        throw problem("助手会话过多，请稍后再试", 429);
      session = { busy: false, history: [], updated: Date.now() };
      this.sessions.set(input.clientSessionId, session);
    }
    if (session.busy) throw problem("助手正在处理上一条指令，请等待回复", 409);
    session.busy = true;
    const entry = { fingerprint, pending: true, config, expires: Date.now() + 600000 };
    this.requests.set(key, entry);
    entry.promise = this.execute(config, session, input).then((result) => {
      entry.result = result;
      return result;
    }, (error) => {
      entry.error = { message: error.statusCode ? error.message : "语音助手请求失败，请检查服务日志", statusCode: error.statusCode ?? 502 };
      throw error;
    }).finally(() => {
      session.busy = false;
      session.updated = Date.now();
      entry.pending = false;
      entry.expires = Date.now() + 600000;
    });
    return entry.promise;
  }
  async start(input) {
    const execution = this.message(input);
    // Keep execution owned by the server, independent of the HTTP connection.
    // Attach rejection handling immediately; errors are read through progress.
    execution.catch(() => {});
    const entry = this.requests.get(input.clientSessionId + ":" + input.requestId);
    if (!entry) return await execution;
    // A duplicate ID with different content must still be rejected by message().
    if (entry.fingerprint !== JSON.stringify([input.text, input.pipelineId])) return await execution;
    return { state: "accepted", requestId: input.requestId };
  }
  async interaction(input, answer = false) {
    const entry = this.requests.get(input.clientSessionId + ":" + input.requestId);
    if (!entry) throw problem("未找到当前请求，请勿重复发送原指令", 404);
    if (!entry.pending) {
      if (answer) throw problem("任务已结束，请等待回复更新", 409);
      return { state: entry.error ? "failed" : "completed", clarification: null,
        ...(entry.error ? { error: entry.error.message } : { result: entry.result }) };
    }
    if (entry.config.provider !== "hermes")
      return { state: "running", clarification: null };
    const suffix = "requests/" + encodeURIComponent(input.requestId) + (answer ? "/answer" : "");
    const response = await this.hermesFetch(entry.config, suffix, {
      signal: AbortSignal.timeout(8000),
      ...(answer ? { method: "POST",
        body: JSON.stringify({ clarificationId: input.clarificationId, answer: input.answer }),
      } : {}),
    });
    const data = await response.json();
    if (answer) return { ok: data.ok === true };
    const prompt = data.clarification;
    return {
      state: data.state,
      clarification: prompt && typeof prompt.id === "string" && typeof prompt.question === "string"
        ? { id: prompt.id, question: prompt.question.slice(0, 8000), choices: Array.isArray(prompt.choices) ? prompt.choices.filter((c) => typeof c === "string").slice(0, 30).map((c) => c.slice(0, 2000)) : [] }
        : null,
    };
  }
  async execute(config, session, input) {
    if (config.provider === "ha") {
      const pipelineId = input.pipelineId || config.pipelineId;
      let result;
      try {
        result =
          pipelineId && pipelineId !== "default"
            ? await this.ha.runAssistPipeline({ text: input.text, pipelineId })
            : await this.ha.processConversation({
                text: input.text,
                language: "zh-CN",
                conversation_id: session.haConversationId,
              });
      } catch {
        throw problem("Home Assistant 助手请求失败，请检查 HA 日志", 502);
      }
      session.haConversationId =
        result.conversation_id ?? session.haConversationId;
      const speech = result.speech ?? result.response?.speech?.plain?.speech;
      const type = result.responseType ?? result.response?.response_type;
      if (type === "error") {
        if (/429|rate.limit|cooldown/i.test(speech ?? ""))
          throw problem("HA 助手的模型服务当前限流，请稍后再试", 429);
        if (/token.*exceed/i.test(speech ?? ""))
          throw problem("HA 助手回复超出输出上限，请检查对话集成配置", 502);
        throw problem("HA 助手未能执行这条指令，请检查 HA 日志", 502);
      }
      return {
        provider: "ha",
        text: typeof speech === "string" ? speech : "助手未返回可显示的文本",
      };
    }
    const response = await this.hermesFetch(config, "chat/completions", {
      signal: AbortSignal.timeout(30 * 60 * 1000),
      method: "POST",
      body: JSON.stringify({
        model: config.hermes.model,
        messages: [{ role: "user", content: input.text }],
        stream: false,
        request_id: input.requestId,
        execution_timeout: config.hermes.timeoutSeconds,
      }),
    });
    let result;
    try {
      result = await response.json();
    } catch {
      throw problem("Hermes 返回格式无效，执行状态未知，请先检查设备状态", 502);
    }
    const text = result.choices?.[0]?.message?.content;
    if (typeof text !== "string" || !text.trim())
      throw problem("Hermes 未返回文本回复，请先检查设备状态", 502);
    return { provider: "hermes", text: text.trim() };
  }
}

const string = (maxLength) => ({ type: "string", maxLength });
export async function registerVoiceAssistantRoutes(app, assistant) {
  const sameOrigin = async (request, reply) => {
    const site = request.headers["sec-fetch-site"];
    if (site && site !== "same-origin")
      return reply.code(403).send({ error: "语音助手请求来源校验失败，请刷新当前 3D Home 页面后重试" });
    if (request.headers.origin) {
      try {
        const origin = new URL(request.headers.origin);
        // Ingress rewrites Host to the internal service. Fetch Metadata is
        // browser-controlled and describes the original, pre-proxy request.
        // Never trust arbitrary X-Forwarded-Host or a matching Referer alone.
        if (["http:", "https:"].includes(origin.protocol) &&
            !origin.username && !origin.password &&
            (site === "same-origin" ||
             (!site && origin.host === request.headers.host)))
          return;
      } catch {}
      return reply
        .code(403)
        .send({ error: "语音助手请求来源校验失败，请刷新当前 3D Home 页面后重试" });
    }
  };
  const run = (fn) => async (request, reply) => {
    try {
      return await fn(request);
    } catch (error) {
      return reply
        .code(error.statusCode ?? 502)
        .send({
          error: error.statusCode
            ? error.message
            : "语音助手请求失败，请检查服务日志",
        });
    }
  };
  app.get("/api/voice-assistant/config", async (_request, reply) => {
    reply.header("Cache-Control", "no-store");
    return assistant.publicConfig();
  });
  app.put(
    "/api/voice-assistant/config",
    {
      preHandler: sameOrigin,
      schema: {
        body: {
          type: "object",
          additionalProperties: false,
          properties: {
            provider: { enum: ["ha", "hermes"] },
            pipelineId: string(128),
            clearApiKey: { type: "boolean" },
            playback: { type: "object", additionalProperties: false, properties: {
              enabled: { type: "boolean" }, volume: { type: "number", minimum: 0, maximum: 1 },
            } },
            hermes: {
              type: "object",
              additionalProperties: false,
              properties: {
                baseUrl: string(1024),
                apiKey: string(4096),
                model: { type: "string", minLength: 1, maxLength: 128 },
                timeoutSeconds: { type: "integer", minimum: 10, maximum: 300 },
              },
            },
          },
        },
      },
    },
    run((request) => assistant.save(request.body)),
  );
  app.post(
    "/api/voice-assistant/test",
    { preHandler: sameOrigin },
    run(() => assistant.testConnection()),
  );
  for (const action of ["interaction", "answer"]) {
    app.post("/api/voice-assistant/" + action, {
      preHandler: sameOrigin,
      schema: { body: {
        type: "object", additionalProperties: false,
        required: ["clientSessionId", "requestId", ...(action === "answer" ? ["clarificationId", "answer"] : [])],
        properties: {
          clientSessionId: { type: "string", pattern: "^[a-zA-Z0-9_-]{16,80}$" },
          requestId: { type: "string", pattern: "^[a-zA-Z0-9_-]{16,80}$" },
          ...(action === "answer" ? { clarificationId: { type: "string", minLength: 1, maxLength: 80 }, answer: { type: "string", minLength: 1, maxLength: 2000 } } : {}),
        },
      } },
    }, run((request) => assistant.interaction(request.body, action === "answer")));
  }
  for (const action of ["message", "start"]) app.post(
    "/api/voice-assistant/" + action,
    {
      preHandler: sameOrigin,
      schema: {
        body: {
          type: "object",
          additionalProperties: false,
          required: ["text", "clientSessionId", "requestId"],
          properties: {
            text: { type: "string", minLength: 1, maxLength: 2000 },
            pipelineId: string(128),
            clientSessionId: {
              type: "string",
              pattern: "^[a-zA-Z0-9_-]{16,80}$",
            },
            requestId: { type: "string", pattern: "^[a-zA-Z0-9_-]{16,80}$" },
          },
        },
      },
    },
    run((request) =>
      assistant[action]({ ...request.body, text: request.body.text.trim() }),
    ),
  );
}
