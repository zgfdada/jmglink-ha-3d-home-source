import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const source = await readFile(
  new URL("../apps/web/src/app/scene.js", import.meta.url),
  "utf8",
);
const start = source.indexOf("function Ki(");
const body = source.slice(start, source.indexOf("\nfunction Ui(", start));
function mount(state = "idle", autoPlay = true) {
  const effects = [],
    refs = [];
  let writes = 0,
    calls = 0,
    resolve,
    reject;
  const pending = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  const hooks = {
    useState: (value) => [
      typeof value === "function" ? value() : value,
      () => writes++,
    ],
    useRef: (value) => {
      const ref = { current: value };
      refs.push(ref);
      return ref;
    },
    useEffect: (effect) => effects.push(effect),
  };
  const jsx = (type, props) => ({ type, props });
  const view = new Function(
    "L",
    "Oi",
    "qs",
    "ft",
    "t",
    "se",
    "qr",
    "Kr",
    "pt",
    "Vi",
    "bo",
    body + ";return Ki;",
  )(
    hooks,
    () => false,
    () => {
      calls++;
      return pending;
    },
    (x) => x,
    { jsx, jsxs: jsx },
    "section",
    "play",
    "stop",
    "loading",
    "video",
    "camera",
  );
  view({
    entity: { entityId: "camera.test", state, name: "测试" },
    compact: true,
    autoPlay,
  });
  const cleanups = effects.map((effect) => effect()).filter(Boolean);
  return {
    get writes() {
      return writes;
    },
    get calls() {
      return calls;
    },
    resolve,
    reject,
    close: () => cleanups.forEach((cleanup) => cleanup()),
  };
}
test("camera popup starts one request, while unavailable and manual panels remain demand-driven", () => {
  const popup = mount();
  assert.equal(popup.calls, 1);
  popup.close();
  const offline = mount("unavailable");
  assert.equal(offline.calls, 0);
  offline.close();
  const manual = mount("idle", false);
  assert.equal(manual.calls, 0);
  manual.close();
});
test("late camera success and failure cannot write into a closed monitor", async () => {
  for (const failure of [false, true]) {
    const popup = mount();
    popup.close();
    const before = popup.writes;
    failure
      ? popup.reject(Error("late failure"))
      : popup.resolve({ source: "snapshot", snapshotUrl: "./snapshot" });
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(popup.writes, before);
  }
});
