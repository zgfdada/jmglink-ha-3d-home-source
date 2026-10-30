import { validateMotionOutput } from "../../../../packages/schema/src/motion-code.js";
const programs = new Map();
let nextId = 0;
export function acquireMotionProgram(code) {
  if (typeof Worker === "undefined") return null;
  if (!programs.has(code) && programs.size >= 16)
    return {
      sample: () => null,
      status: () => ({
        error: "同时运行的不同代码已达 16 项，请减少并行动效代码种类",
        pending: false,
      }),
      release() {},
    };
  let program = programs.get(code);
  if (!program) {
    program = {
      worker: null,
      ready: false,
      error: "",
      refs: 0,
      jobs: new Map(),
    };
    programs.set(code, program);
    const fail = (message) => {
      if (program.error) return;
      program.error = message;
      clearTimeout(program.boot);
      program.worker?.terminate();
      for (const job of program.jobs.values()) {
        clearTimeout(job.timeout);
        job.reject?.(Error(message));
        job.handle.error = message;
        job.handle.pending = false;
      }
      program.jobs.clear();
    };
    try {
      program.worker = new Worker(
        new URL("./api/motion-runtime-worker.js", document.baseURI),
        { name: "3DHome 动效代码" },
      );
      program.boot = setTimeout(
        () => fail("动效代码初始化超时，已停止执行"),
        1500,
      );
      program.worker.onmessage = ({ data }) => {
        if (data.type === "ready") {
          program.ready = true;
          clearTimeout(program.boot);
          return;
        }
        if (data.type === "error" && !data.id) {
          fail(`代码编译失败：${data.message}`);
          return;
        }
        const job = program.jobs.get(data.id);
        if (!job) return;
        program.jobs.delete(data.id);
        clearTimeout(job.timeout);
        job.handle.pending = false;
        if (data.type === "error") {
          job.handle.error = `代码执行失败：${data.message}`;
          job.reject?.(Error(job.handle.error));
          return;
        }
        try {
          const result = validateMotionOutput(data.result);
          job.handle.latest = result;
          job.handle.error = "";
          job.resolve?.(result);
        } catch (error) {
          job.handle.error = error.message;
          job.reject?.(error);
        }
      };
      program.worker.onerror = () => fail("动效运行器加载失败，请重新加载页面");
      program.worker.postMessage({ type: "compile", code });
      program.fail = fail;
    } catch {
      fail("当前浏览器无法启动动效运行器");
    }
  }
  program.refs++;
  const handle = {
    instance: ++nextId,
    latest: null,
    pending: false,
    error: "",
    lastSent: 0,
    released: false,
    sample(context, force = false, callbacks = {}) {
      if (this.released) return null;
      if (program.error) {
        this.error = program.error;
        callbacks.reject?.(Error(this.error));
        return null;
      }
      if (!program.ready || this.pending) return this.latest;
      const now = performance.now();
      if (!force && now - this.lastSent < 30) return this.latest;
      this.lastSent = now;
      const id = ++nextId;
      this.pending = true;
      const timeout = setTimeout(
        () => program.fail("动效代码执行超时，已停止执行"),
        250,
      );
      program.jobs.set(id, { handle: this, timeout, ...callbacks });
      program.worker.postMessage({
        type: "sample",
        id,
        instance: this.instance,
        context,
      });
      return this.latest;
    },
    status() {
      return {
        ready: program.ready && this.latest !== null,
        error: this.error || program.error,
        pending: this.pending || !program.ready,
      };
    },
    release() {
      if (this.released) return;
      this.released = true;
      if (program.ready && !program.error)
        program.worker?.postMessage({
          type: "release",
          instance: this.instance,
        });
      for (const [id, job] of program.jobs) {
        if (job.handle === this) {
          clearTimeout(job.timeout);
          program.jobs.delete(id);
          job.reject?.(Error("预览已取消"));
        }
      }
      if (--program.refs === 0) {
        clearTimeout(program.boot);
        program.worker?.terminate();
        programs.delete(code);
      }
    },
  };
  return handle;
}
export async function validateMotionProgram(code, context) {
  const handle = acquireMotionProgram(code);
  if (!handle) throw Error("当前浏览器不支持代码预览");
  try {
    return await new Promise((resolve, reject) => {
      const until = performance.now() + 1800;
      const poll = () => {
        const status = handle.status();
        if (status.error) {
          reject(Error(status.error));
          return;
        }
        if (performance.now() > until) {
          reject(Error("代码校验超时"));
          return;
        }
        if (!status.pending) {
          handle.sample(context, true, { resolve, reject });
          return;
        }
        setTimeout(poll, 10);
      };
      poll();
    });
  } finally {
    handle.release();
  }
}
