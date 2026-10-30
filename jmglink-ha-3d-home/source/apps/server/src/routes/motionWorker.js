import { validateMotionOutput } from "../../../../packages/schema/src/motion-code.js";
export function motionWorkerMain() {
  const send = self.postMessage.bind(self),
    Compile = Function;
  let createUpdate = null;
  const instances = new Map();
  for (const name of [
    "fetch",
    "XMLHttpRequest",
    "WebSocket",
    "EventSource",
    "importScripts",
    "Worker",
    "SharedWorker",
    "indexedDB",
    "caches",
    "BroadcastChannel",
    "postMessage",
  ]) {
    try {
      Object.defineProperty(self, name, {
        value: undefined,
        writable: false,
        configurable: false,
      });
    } catch {}
  }
  self.onmessage = ({ data }) => {
    try {
      if (data.type === "compile") {
        createUpdate = new Compile(
          `"use strict";\n${data.code}\nif(typeof update!=="function")throw Error("请定义 function update(ctx)");return update;`,
        );
        instances.clear();
        send({ type: "ready" });
      } else if (data.type === "sample") {
        if (!createUpdate) throw Error("动效尚未编译");
        const instance = data.instance ?? "default";
        let update = instances.get(instance);
        if (!update) {
          update = createUpdate();
          instances.set(instance, update);
        }
        const result = validateMotionOutput(update(data.context));
        send({ type: "result", id: data.id, result });
      } else if (data.type === "release") {
        instances.delete(data.instance);
      }
    } catch (error) {
      send({
        type: "error",
        id: data.id,
        message: String(error?.message ?? "动效代码执行失败").slice(0, 240),
      });
    }
  };
}
export function motionWorkerSource() {
  return `"use strict";const validateMotionOutput=${validateMotionOutput.toString()};(${motionWorkerMain.toString()})();`;
}
export async function registerMotionWorkerRoute(app) {
  app.get("/api/motion-runtime-worker.js", async (request, reply) =>
    reply
      .header(
        "Content-Security-Policy",
        "default-src 'none';script-src 'unsafe-eval';connect-src 'none';worker-src 'none'",
      )
      .header("Cache-Control", "no-store")
      .header("X-Content-Type-Options", "nosniff")
      .type("application/javascript")
      .send(motionWorkerSource()),
  );
}
