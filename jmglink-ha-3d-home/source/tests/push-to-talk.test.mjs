import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createPushToTalk } from "../apps/web/src/domain/push-to-talk.js";

function setup() {
  const submitted = [],
    recognitions = [],
    timers = new Map(),
    statuses = [];
  const controller = createPushToTalk({
    createRecognition() {
      const recognition = {
        start() {
          this.onstart?.();
        },
        stop() {},
        abort() {},
      };
      recognitions.push(recognition);
      return recognition;
    },
    onSubmit: (text) => submitted.push(text),
    onStatus: (text) => statuses.push(text),
    setTimer(callback) {
      timers.set(callback, callback);
      return callback;
    },
    clearTimer: (id) => timers.delete(id),
  });
  return { controller, submitted, recognitions, timers, statuses };
}
const result = (text, isFinal = true) =>
  Object.assign([{ transcript: text }], { isFinal });
const update = (recognition, ...results) => recognition.onresult?.({ results });

test("长按中反复返回完整和中间结果，松开并结束后仅发送最终一句", () => {
  const { controller: c, submitted, recognitions } = setup();
  c.start();
  const r = recognitions[0];
  for (const text of ["关", "关闭", "关闭客厅", "关闭客厅开门灯组"]) {
    update(r, result(text, false));
    update(r, result(text)); // Some providers repeatedly replace final slot 0.
  }
  assert.deepEqual(submitted, []);
  c.release();
  assert.deepEqual(submitted, []);
  update(r, result("关闭客厅开门灯组。"));
  const lateEnd = r.onend,
    lateResult = r.onresult;
  r.onend();
  c.release();
  lateEnd();
  lateResult({ results: [result("关")] });
  assert.deepEqual(submitted, ["关闭客厅开门灯组。"]);
});

test("浏览器先自然结束也必须等松开；多段最终结果全部保留", () => {
  const { controller: c, submitted, recognitions } = setup();
  c.start();
  const r = recognitions[0];
  update(
    r,
    result("把客厅灯光"),
    result("调整为手动模式"),
    result("噪声", false),
  );
  r.onend();
  assert.deepEqual(submitted, []);
  assert.equal(c.start(), false);
  c.release();
  assert.deepEqual(submitted, ["把客厅灯光 调整为手动模式"]);
});

test("仅有中间结果、无语音或识别报错时不发送设备指令", () => {
  for (const fail of [false, true]) {
    const { controller: c, submitted, recognitions } = setup();
    c.start();
    const r = recognitions[0];
    update(r, result("打开客", false));
    const lateResult = r.onresult,
      lateEnd = r.onend;
    if (fail) r.onerror({ error: "not-allowed" });
    c.release();
    lateEnd();
    lateResult({ results: [result("打开客厅")] });
    assert.deepEqual(submitted, []);
    assert.equal(c.busy, false);
  }
});

test("取消或失焦后丢弃旧会话回调，新的独立录音允许相同指令", () => {
  const { controller: c, submitted, recognitions } = setup();
  c.start();
  const old = recognitions[0];
  update(old, result("开灯"));
  const oldEnd = old.onend;
  c.cancel();
  oldEnd();
  for (let i = 0; i < 2; i++) {
    c.start();
    const r = recognitions.at(-1);
    update(r, result("开灯"));
    c.release();
    r.onend();
  }
  assert.deepEqual(submitted, ["开灯", "开灯"]);
});

test("结束超时不发送残缺指令，恢复后可以继续录音", () => {
  const { controller: c, submitted, recognitions, timers, statuses } = setup();
  c.start();
  update(recognitions[0], result("开灯"));
  c.release();
  for (const callback of [...timers.values()]) callback();
  assert.deepEqual(submitted, []);
  assert.match(statuses.at(-1), /超时/);
  assert.equal(c.start(), true);
  c.cancel();
});

test("stop 同步触发结束也只提交一次并清理计时器", () => {
  const { controller: c, submitted, recognitions, timers } = setup();
  c.start();
  const r = recognitions[0];
  r.stop = () => r.onend();
  update(r, result("开灯"));
  c.release();
  assert.deepEqual(submitted, ["开灯"]);
  assert.equal(timers.size, 0);
});

test("不支持、启动失败和 stop 异常均可恢复，不残留锁", () => {
  const c = createPushToTalk({ createRecognition: () => null });
  assert.equal(c.start(), false);
  assert.equal(c.busy, false);
  const broken = createPushToTalk({
    createRecognition: () => ({
      start() {
        throw new Error("not allowed");
      },
    }),
  });
  assert.equal(broken.start(), false);
  assert.equal(broken.busy, false);
  const { controller, recognitions, submitted } = setup();
  controller.start();
  recognitions[0].stop = () => {
    throw new Error("ended");
  };
  controller.release();
  assert.equal(controller.busy, false);
  assert.deepEqual(submitted, []);
});

test("实际组件：长按只发一次，旧渲染闭包中的表单连发也被同步锁挡住", async () => {
  const source = readFileSync(
    new URL("../apps/web/src/app/app.js", import.meta.url),
    "utf8",
  );
  const component = source.slice(
    source.indexOf("function et() {"),
    source.indexOf("const tt ="),
  );
  const effects = [],
    listeners = new Map();
  const document = {
    hidden: false,
    addEventListener: (name, fn) => listeners.set(name, fn),
    removeEventListener: (name) => listeners.delete(name),
  };
  const refs = [],
    states = [],
    timers = new Map(),
    requests = [],
    recognitions = [];
  let refIndex = 0,
    stateIndex = 0,
    resolveRequest;
  const hooks = {
    useRef(value) {
      return refs[refIndex++] ?? (refs[refIndex - 1] = { current: value });
    },
    useState(value) {
      const i = stateIndex++;
      if (!(i in states)) states[i] = value;
      return [
        states[i],
        (v) => {
          states[i] = typeof v === "function" ? v(states[i]) : v;
        },
      ];
    },
    useEffect(effect) {
      effects.push(effect);
    },
  };
  const window = {
    setTimeout(fn, delay) {
      timers.set(fn, delay);
      return fn;
    },
    clearTimeout(fn) {
      timers.delete(fn);
    },
    SpeechRecognition: class {
      constructor() {
        recognitions.push(this);
      }
      start() {
        this.onstart?.();
      }
      stop() {}
      abort() {}
    },
  };
  const runtime = {
    jsx: (type, props) => ({ type, props }),
    jsxs: (type, props) => ({ type, props }),
  };
  const render = new Function(
    "n",
    "r",
    "window",
    "document",
    "createPushToTalk",
    "Ue",
    "qe",
    "Re",
    "Ae",
    "Ce",
    "VoiceAssistantSettings",
    "VoiceClarification",
    "playVoiceReply",
    "stopVoiceReply",
    `${component}; return et;`,
  )(
    hooks,
    runtime,
    window,
    document,
    createPushToTalk,
    (text) => {
      requests.push(text);
      return new Promise((r) => {
        resolveRequest = r;
      });
    },
    () => {},
    null,
    null,
    null,
    () => null,
    () => null,
    () => {},
    () => {},
  );
  function draw() {
    refIndex = stateIndex = 0;
    return render();
  }
  function find(node, predicate) {
    if (!node || typeof node !== "object") return;
    if (predicate(node)) return node;
    for (const child of [node.props?.children].flat(Infinity)) {
      const found = find(child, predicate);
      if (found) return found;
    }
  }
  let tree = draw();
  const removeVisibilityListener = effects.at(-1)();
  const button = find(tree, (n) => n.props?.className?.startsWith("voice-fab"));
  assert.equal(button.props.onPointerLeave, undefined);
  const target = {
    setPointerCapture() {},
    hasPointerCapture() {
      return true;
    },
    releasePointerCapture() {},
  };
  button.props.onPointerDown({
    button: 0,
    currentTarget: target,
    pointerId: 1,
  });
  [...timers].find(([, delay]) => delay === 320)[0]();
  const r = recognitions[0];
  // Focus/permission UI changes on a still-visible page must not abort speech.
  listeners.get("visibilitychange")();
  assert.equal(typeof r.onresult, "function");
  update(r, result("开"));
  update(r, result("打开餐厅主灯"));
  assert.deepEqual(requests, []);
  button.props.onPointerUp({ currentTarget: target, pointerId: 1 });
  r.onend();
  assert.deepEqual(requests, ["打开餐厅主灯"]);
  button.props.onPointerDown({
    button: 0,
    currentTarget: target,
    pointerId: 2,
  });
  assert.equal(recognitions.length, 1); // Same stale render must respect the request lock.
  resolveRequest("已开启");
  await new Promise((r) => setImmediate(r));
  tree = draw();
  assert.equal(find(tree, (n) => n.props?.className === "voice-reply-status").props.children, "已开启");
  assert.equal(find(tree, (n) => n.props?.className === "voice-message assistant"), undefined);
  const context = () => find(draw(), (n) => n.props?.className?.startsWith("voice-fab")).props.onContextMenu({ preventDefault() {}, nativeEvent: {} });
  context();
  assert.equal(find(draw(), (n) => "menuOpen" in (n.props || {})).props.menuOpen, true);
  context();
  assert.equal(find(draw(), (n) => "menuOpen" in (n.props || {})).props.menuOpen, false);
  // Expose the typed input and submit twice through the very same render.
  tree = draw();
  find(tree, (n) =>
    n.props?.className?.startsWith("voice-fab"),
  ).props.onClick();
  tree = draw();
  find(tree, (n) => n.type === "input").props.onChange({
    target: { value: "关闭餐厅主灯" },
  });
  tree = draw();
  const form = find(tree, (n) => n.type === "form");
  form.props.onSubmit({ preventDefault() {} });
  form.props.onSubmit({ preventDefault() {} });
  assert.deepEqual(requests, ["打开餐厅主灯", "关闭餐厅主灯"]);
  resolveRequest("已关闭");
  await new Promise((r) => setImmediate(r));
  tree = draw();
  const nextButton = find(tree, (n) =>
    n.props?.className?.startsWith("voice-fab"),
  );
  nextButton.props.onPointerDown({
    button: 0,
    currentTarget: target,
    pointerId: 3,
  });
  [...timers].find(([, delay]) => delay === 320)[0]();
  const pending = recognitions.at(-1),
    lateEnd = pending.onend;
  update(pending, result("不应发送"));
  document.hidden = true;
  listeners.get("visibilitychange")();
  lateEnd();
  assert.equal(requests.length, 2);
  removeVisibilityListener();
});

test("浏览器网络失败与麦克风权限失败显示不同原因", () => {
  for (const [error, expected] of [
    ["network", /服务连接失败/],
    ["not-allowed", /访问被拒绝/],
    ["no-speech", /没有听到语音/],
  ]) {
    const { controller, recognitions, statuses, submitted } = setup();
    controller.start();
    recognitions[0].onerror({ error });
    assert.match(statuses.at(-1), expected);
    assert.deepEqual(submitted, []);
  }
});
