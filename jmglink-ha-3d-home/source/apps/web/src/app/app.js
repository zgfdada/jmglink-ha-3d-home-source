/**
 * Recovered application module from official 0.1.5 Vite artifact: index-CWMUN1IG.js
 * Original identifiers, TypeScript types, comments, and module boundaries were not present.
 */
import { j as r, c as ue } from "../vendor/three.js";
import ApplicationBoundary from '../components/application-boundary.jsx';
import { a as n, c as pe, R as fe } from "../vendor/react.js";
import "../vendor/hls.js";
import { createPushToTalk } from "../domain/push-to-talk.js";
import { playVoiceReply, stopVoiceReply } from "../domain/voice-playback.js";
import { sendVoiceMessage } from "../domain/voice-interaction.js";
import { VoiceClarification } from "./voice-clarification.jsx";
import { VoiceAssistantSettings } from "./voice-assistant-settings.jsx";
import {
  mergeEntityActionResult,
  resolveDeviceDisplayName,
} from "../domain/device-platform-presentation.js";
(function () {
  const e = document.createElement("link").relList;
  if (e && e.supports && e.supports("modulepreload")) return;
  for (const a of document.querySelectorAll('link[rel="modulepreload"]')) i(a);
  new MutationObserver((a) => {
    for (const c of a)
      if (c.type === "childList")
        for (const d of c.addedNodes)
          d.tagName === "LINK" && d.rel === "modulepreload" && i(d);
  }).observe(document, { childList: !0, subtree: !0 });
  function s(a) {
    const c = {};
    return (
      a.integrity && (c.integrity = a.integrity),
      a.referrerPolicy && (c.referrerPolicy = a.referrerPolicy),
      a.crossOrigin === "use-credentials"
        ? (c.credentials = "include")
        : a.crossOrigin === "anonymous"
          ? (c.credentials = "omit")
          : (c.credentials = "same-origin"),
      c
    );
  }
  function i(a) {
    if (a.ep) return;
    a.ep = !0;
    const c = s(a);
    fetch(a.href, c);
  }
})();
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const ie = (...t) =>
  t
    .filter((e, s, i) => !!e && e.trim() !== "" && i.indexOf(e) === s)
    .join(" ")
    .trim();
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const he = (t) => t.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const me = (t) =>
  t.replace(/^([A-Z])|[\s-_]+(\w)/g, (e, s, i) =>
    i ? i.toUpperCase() : s.toLowerCase(),
  );
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const K = (t) => {
  const e = me(t);
  return e.charAt(0).toUpperCase() + e.slice(1);
};
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ var U = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const ye = (t) => {
    for (const e in t)
      if (e.startsWith("aria-") || e === "role" || e === "title") return !0;
    return !1;
  },
  we = n.createContext({}),
  je = () => n.useContext(we),
  ge = n.forwardRef(
    (
      {
        color: t,
        size: e,
        strokeWidth: s,
        absoluteStrokeWidth: i,
        className: a = "",
        children: c,
        iconNode: d,
        ...y
      },
      h,
    ) => {
      const {
          size: f = 24,
          strokeWidth: u = 2,
          absoluteStrokeWidth: g = !1,
          color: l = "currentColor",
          className: v = "",
        } = je() ?? {},
        w = (i ?? g) ? (Number(s ?? u) * 24) / Number(e ?? f) : (s ?? u);
      return n.createElement(
        "svg",
        {
          ref: h,
          ...U,
          width: e ?? f ?? U.width,
          height: e ?? f ?? U.height,
          stroke: t ?? l,
          strokeWidth: w,
          className: ie("lucide", v, a),
          ...(!c && !ye(y) && { "aria-hidden": "true" }),
          ...y,
        },
        [
          ...d.map(([x, S]) => n.createElement(x, S)),
          ...(Array.isArray(c) ? c : [c]),
        ],
      );
    },
  );
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const R = (t, e) => {
  const s = n.forwardRef(({ className: i, ...a }, c) =>
    n.createElement(ge, {
      ref: c,
      iconNode: e,
      className: ie(`lucide-${he(K(t))}`, `lucide-${t}`, i),
      ...a,
    }),
  );
  return ((s.displayName = K(t)), s);
};
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const xe = [
    ["ellipse", { cx: "12", cy: "5", rx: "9", ry: "3", key: "msslwz" }],
    ["path", { d: "M3 5V19A9 3 0 0 0 21 19V5", key: "1wlel7" }],
    ["path", { d: "M3 12A9 3 0 0 0 21 12", key: "mv7ke4" }],
  ],
  Z = R("database", xe);
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const ve = [
    [
      "path",
      {
        d: "M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z",
        key: "1s6t7t",
      },
    ],
    [
      "circle",
      { cx: "16.5", cy: "7.5", r: ".5", fill: "currentColor", key: "w0ekpg" },
    ],
  ],
  be = R("key-round", ve);
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const ke = [
    [
      "path",
      {
        d: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71",
        key: "1cjeqo",
      },
    ],
    [
      "path",
      {
        d: "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
        key: "19qd67",
      },
    ],
  ],
  Ee = R("link", ke);
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Se = [
    ["path", { d: "M12 19v3", key: "npa21l" }],
    ["path", { d: "M15 9.34V5a3 3 0 0 0-5.68-1.33", key: "1gzdoj" }],
    ["path", { d: "M16.95 16.95A7 7 0 0 1 5 12v-2", key: "cqa7eg" }],
    ["path", { d: "M18.89 13.23A7 7 0 0 0 19 12v-2", key: "16hl24" }],
    ["path", { d: "m2 2 20 20", key: "1ooewy" }],
    ["path", { d: "M9 9v3a3 3 0 0 0 5.12 2.12", key: "r2i35w" }],
  ],
  Ae = R("mic-off", Se);
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Te = [
    ["path", { d: "M12 19v3", key: "npa21l" }],
    ["path", { d: "M19 10v2a7 7 0 0 1-14 0v-2", key: "1vc78b" }],
    [
      "rect",
      { x: "9", y: "2", width: "6", height: "13", rx: "3", key: "s6n7sd" },
    ],
  ],
  Ce = R("mic", Te);
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Ne = [
    [
      "path",
      {
        d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8",
        key: "v9h5vc",
      },
    ],
    ["path", { d: "M21 3v5h-5", key: "1q7to0" }],
    [
      "path",
      {
        d: "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16",
        key: "3uifl3",
      },
    ],
    ["path", { d: "M8 16H3v5", key: "1cv678" }],
  ],
  X = R("refresh-cw", Ne);
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Pe = [
    [
      "path",
      {
        d: "M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z",
        key: "1ffxy3",
      },
    ],
    ["path", { d: "m21.854 2.147-10.94 10.939", key: "12cjpa" }],
  ],
  Re = R("send", Pe);
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const $e = [
    [
      "rect",
      {
        width: "20",
        height: "8",
        x: "2",
        y: "2",
        rx: "2",
        ry: "2",
        key: "ngkwjq",
      },
    ],
    [
      "rect",
      {
        width: "20",
        height: "8",
        x: "2",
        y: "14",
        rx: "2",
        ry: "2",
        key: "iecqi9",
      },
    ],
    ["line", { x1: "6", x2: "6.01", y1: "6", y2: "6", key: "16zg32" }],
    ["line", { x1: "6", x2: "6.01", y1: "18", y2: "18", key: "nzw8ys" }],
  ],
  Oe = R("server", $e);
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Me = [
    ["path", { d: "M12 20h.01", key: "zekei9" }],
    ["path", { d: "M2 8.82a15 15 0 0 1 20 0", key: "dnpr2z" }],
    ["path", { d: "M5 12.859a10 10 0 0 1 14 0", key: "1x1e6c" }],
    ["path", { d: "M8.5 16.429a5 5 0 0 1 7 0", key: "1bycff" }],
  ],
  Y = R("wifi", Me);
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Ie = [
    ["path", { d: "M18 6 6 18", key: "1bl5f8" }],
    ["path", { d: "m6 6 12 12", key: "d8bk6v" }],
  ],
  _e = R("x", Ie);
async function L(t, e) {
  try {
    const s = await t.json();
    return s.error ?? s.message ?? `${e}: ${t.status}`;
  } catch {
    return `${e}: ${t.status}`;
  }
}
async function Le() {
  const t = await fetch("./api/projects/current");
  if (!t.ok) throw new Error(`Project request failed: ${t.status}`);
  return (await t.json()).project;
}
async function oe() {
  const t = await fetch("./api/ha/entities");
  if (!t.ok) throw new Error(`Entities request failed: ${t.status}`);
  return (await t.json()).entities;
}
async function W() {
  const t = await fetch("./api/ha/areas");
  if (!t.ok) throw new Error(await L(t, "Areas request failed"));
  return (await t.json()).areas;
}
async function fetchHaDevices() {
  // The scene needs capability bindings and entityIds, not only the raw HA registry.
  const t = await fetch("./api/device-platform/devices");
  if (!t.ok) throw new Error(await L(t, "Devices request failed"));
  return (await t.json()).devices;
}
async function Be() {
  const t = await fetch("./api/ha/status");
  if (!t.ok) throw new Error(await L(t, "Status request failed"));
  return await t.json();
}
async function He() {
  const t = await fetch("./api/ha/reconnect", { method: "POST" });
  if (!t.ok) throw new Error(await L(t, "Reconnect failed"));
  return (await t.json()).status;
}
async function ze(t) {
  const e = await fetch("./api/ha/config", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(t),
  });
  if (!e.ok) throw new Error(await L(e, "Home Assistant 配置保存失败"));
  return (await e.json()).status;
}
async function Ve(t) {
  const e = await fetch("./api/ha/actions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(t),
  });
  if (!e.ok) throw new Error(await L(e, "Action request failed"));
  return (await e.json()).entity;
}
async function qe() {
  const t = await fetch("./api/ha/assist-pipelines");
  if (!t.ok) throw new Error(`无法读取语音助手列表: ${t.status}`);
  const e = await t.json().catch(() => ({}));
  return Array.isArray(e)
    ? {
        pipelines: e
          .map((a) => ({
            id: String(a.id ?? a.pipeline_id ?? ""),
            name: String(a.name ?? a.title ?? a.id ?? "未命名助手"),
            language: a.language,
          }))
          .filter((a) => a.id),
      }
    : Array.isArray(e.pipeline)
      ? {
          pipelines: e.pipeline
            .map((i) => ({
              id: String(i.id ?? i.pipeline_id ?? ""),
              name: String(i.name ?? i.title ?? i.id ?? "未命名助手"),
              language: i.language,
            }))
            .filter((i) => i.id),
        }
      : {
          pipelines: e.pipelines ?? [],
          preferredId: e.preferredId ?? e.preferred_item_id,
        };
}
function De(t) {
  var d, y, h, f;
  if (!t || typeof t != "object") return;
  const e = t,
    s = e.response ?? {},
    i = e.intent_output ?? {},
    a = i.response ?? {},
    c = [
      (d = s.speech) == null ? void 0 : d.plain,
      (y = e.speech) == null ? void 0 : y.plain,
      (h = a.speech) == null ? void 0 : h.plain,
      (f = i.speech) == null ? void 0 : f.plain,
    ];
  for (const u of c) {
    const g = u == null ? void 0 : u.speech;
    if (typeof g == "string" && g.trim()) return g.trim();
  }
  for (const u of [s.data, a.data, e.data])
    if (u && typeof u == "object") {
      const g = u;
      for (const l of ["message", "error", "text", "answer"])
        if (typeof g[l] == "string" && g[l].trim()) return g[l].trim();
    }
}
let voiceClientSessionId;
async function Ue(text, pipelineId, onInteraction) {
  if (!voiceClientSessionId) voiceClientSessionId = crypto.randomUUID();
  return sendVoiceMessage({ text, pipelineId, clientSessionId: voiceClientSessionId,
    requestId: crypto.randomUUID() }, onInteraction);
}

async function jt(t) {
  const e = await fetch(`./api/ha/cameras/${encodeURIComponent(t)}/stream`);
  if (!e.ok) throw new Error(await L(e, "Camera stream request failed"));
  return await e.json();
}
async function We(t) {
  const e = await fetch(`./api/projects/${t.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(t),
  });
  if (!e.ok) throw new Error(`Save project failed: ${e.status}`);
  return (await e.json()).project;
}
async function Fe(t, e) {
  const s = await fetch(`./api/projects/${t}/blueprints`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(e),
  });
  if (!s.ok) throw new Error(`Blueprint import failed: ${s.status}`);
  return (await s.json()).project;
}
async function Ge(t) {
  const e = await fetch(`./api/projects/${t}/reset`, { method: "POST" });
  if (!e.ok) throw new Error(`Reset project failed: ${e.status}`);
  return (await e.json()).project;
}
async function Je(t, e) {
  const s = await fetch(`./api/projects/${t}/import`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(e),
  });
  if (!s.ok) throw new Error(`Import project failed: ${s.status}`);
  return (await s.json()).project;
}
async function Ke(t) {
  const e = await fetch(`./api/projects/${t}/backups`);
  if (!e.ok) throw new Error(`Backup request failed: ${e.status}`);
  return (await e.json()).backups;
}
async function Ze(t, e) {
  const s = await fetch(`./api/projects/${t}/backups/${e}/restore`, {
    method: "POST",
  });
  if (!s.ok) throw new Error(`Restore backup failed: ${s.status}`);
  return (await s.json()).project;
}
async function gt(t) {
  const e = await fetch(`./api/projects/${t}/export`);
  if (!e.ok) throw new Error(`Export project failed: ${e.status}`);
  const encodedName = /filename\*=UTF-8''([^;]+)/i.exec(
    e.headers.get("content-disposition") || "",
  )?.[1];
  return {
    blob: await e.blob(),
    filename: encodedName ? decodeURIComponent(encodedName) : "整体包.json",
  };
}
async function Xe() {
  const t = await fetch("./api/ha/binding-suggestions");
  if (!t.ok) throw new Error(`Binding suggestion request failed: ${t.status}`);
  return (await t.json()).suggestions;
}
async function Ye(t) {
  const e = await fetch("./api/ha/binding-suggestions/apply", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ suggestions: t }),
  });
  if (!e.ok) throw new Error(`Apply binding suggestion failed: ${e.status}`);
  return (await e.json()).project;
}
function Qe(t, e) {
  const s = window.location.protocol === "https:" ? "wss" : "ws",
    i = window.location.pathname.replace(/\/$/, ""),
    a = `${s}://${window.location.host}${i}/ws`;
  let c,
    d,
    y = 0,
    h = !1;
  const f = () => {
    h ||
      ((c = new WebSocket(a)),
      c.addEventListener("open", () => {
        ((y = 0), e == null || e(!0));
      }),
      c.addEventListener("message", (u) => {
        try {
          t(JSON.parse(u.data));
        } catch {}
      }),
      c.addEventListener("close", () => {
        if (h) return;
        e == null || e(!1);
        const u = Math.min(1e4, 750 * 2 ** y);
        ((y += 1), (d = window.setTimeout(f, u)));
      }));
  };
  return (
    f(),
    () => {
      ((h = !0),
        d !== void 0 && window.clearTimeout(d),
        c == null || c.close());
    }
  );
}
function et() {
  const [t, e] = n.useState(!1),
    [s, i] = n.useState(!1),
    [a, c] = n.useState(!1),
    [d, y] = n.useState(!1),
    [h, f] = n.useState("按住说话"),
    [u, g] = n.useState(""),
    [l, v] = n.useState([]),
    [w, x] = n.useState([]),
    [S, A] = n.useState(""),
    [clarification, setClarification] = n.useState(null),
    [replyVersion, setReplyVersion] = n.useState(0),
    [isReply, setIsReply] = n.useState(false),
    [voiceMenu, setVoiceMenu] = n.useState(false),
    [voiceProvider, setVoiceProvider] = n.useState("ha"),
    configSelection = n.useRef(null),
    spokenQuestion = n.useRef(null),
    B = n.useRef(null),
    I = n.useRef(0),
    T = n.useRef([]);
  n.useEffect(() => {
    let o = !1;
    return (
      qe()
        .then((p) => {
          var b, E;
          if (!o)
            if ((b = p.pipelines) != null && b.length) {
              x(p.pipelines);
              const P =
                  p.preferredId &&
                  p.pipelines.some((z) => z.id === p.preferredId)
                    ? p.preferredId
                    : (E = p.pipelines[0]) == null
                      ? void 0
                      : E.id,
                O = window.localStorage.getItem("ha3d.voice.pipeline");
              A(
                configSelection.current?.pipelineId ??
                  (O && p.pipelines.some((z) => z.id === O) ? O : (P ?? "")),
              );
            } else
              (x([{ id: "default", name: "默认助手（HA 未返回管道列表）" }]),
                A("default"));
        })
        .catch((p) => {
          if (o) return;
          const b = p instanceof Error ? p.message : "请求失败";
          (x([{ id: "default", name: `默认助手（${b}）` }]), A("default"));
        }),
      () => {
        ((o = !0),
          k.current?.cancel(),
          N.current !== void 0 && window.clearTimeout(N.current),
          T.current.forEach((E) => window.clearTimeout(E)),
          (T.current = []));
      }
    );
  }, []);
  const k = n.useRef(),
    voiceSubmit = n.useRef(),
    requestBusy = n.useRef(false),
    C = n.useRef(0),
    N = n.useRef(),
    j = n.useRef(!1),
    _ = () => { stopVoiceReply(); k.current.start(); },
    m = () => k.current.release(),
    H = (o, p) => {
      const b = ++I.current;
      v((P) => [...P, { id: b, role: o, text: p }].slice(-10));
      const E = window.setTimeout(() => {
        (v((P) => P.filter((O) => O.id !== b)),
          (T.current = T.current.filter((P) => P !== E)));
      }, 2e4);
      T.current.push(E);
    },
    ne = (o) => {
      o.button !== 0 ||
        requestBusy.current ||
        k.current.busy ||
        C.current ||
        (o.currentTarget.setPointerCapture(o.pointerId),
        (C.current = Date.now()),
        (j.current = !1),
        (N.current = window.setTimeout(() => {
          C.current && _();
        }, 320)));
    },
    F = (o) => {
      if (!C.current) return;
      const p = Date.now() - C.current;
      C.current = 0;
      o &&
        o.currentTarget.hasPointerCapture(o.pointerId) &&
        o.currentTarget.releasePointerCapture(o.pointerId);
      (N.current !== void 0 &&
        (window.clearTimeout(N.current), (N.current = void 0)),
        m(),
        (j.current = !0),
        p < 320 && !s && c((b) => !b));
    },
    ce = () => {
      if (j.current) {
        j.current = !1;
        return;
      }
      requestBusy.current || c((o) => !o);
    },
    cancelVoice = () => {
      C.current = 0;
      if (N.current !== undefined) window.clearTimeout(N.current);
      N.current = undefined;
      j.current = true;
      k.current.cancel();
    },
    V = (o) => o.preventDefault();
  n.useEffect(() => {
    const o = B.current;
    o && o.scrollTo({ top: o.scrollHeight, behavior: "smooth" });
  }, [l]);
  const G = async (o) => {
      const p = o.trim();
      if (!(!p || requestBusy.current || k.current.busy)) {
        requestBusy.current = true;
        (g(""), H("user", p), i(!0), setIsReply(false), setClarification(null), f("助手正在处理…"));
        try {
          const b = await Ue(p, S, (prompt, warning) => {
            if (prompt !== undefined) setClarification(prompt);
            if (prompt && spokenQuestion.current !== prompt.id) {
              spokenQuestion.current = prompt.id;
              playVoiceReply(prompt.question + (prompt.choices.length ? "。可选：" + prompt.choices.join("；") : ""), configSelection.current?.playback);
            }
            f(prompt ? "助手正在等待你的回答" : warning || "助手正在处理…");
          });
          (setReplyVersion((value) => value + 1), setIsReply(true), f(b), playVoiceReply(b, configSelection.current?.playback));
        } catch (b) {
          const E = b instanceof Error ? b.message : "助手请求失败";
          (setReplyVersion((value) => value + 1), setIsReply(true), f(E));
        } finally {
          requestBusy.current = false;
          setClarification(null);
          i(!1);
        }
      }
    },
    le = (o) => {
      (A(o), window.localStorage.setItem("ha3d.voice.pipeline", o), y(!1));
    },
    D = w.find((o) => o.id === S),
    de = t ? "listening" : s ? "waiting" : "";
  voiceSubmit.current = G;
  if (!k.current)
    k.current = createPushToTalk({
      createRecognition: () => {
        const Recognition =
          window.SpeechRecognition || window.webkitSpeechRecognition;
        return Recognition ? new Recognition() : null;
      },
      onSubmit: (text) => voiceSubmit.current(text),
      onListening: e,
      onStatus: (text) => { setIsReply(false); f(text); },
    });
  n.useEffect(() => {
    // Microphone permission prompts can blur a visible page. They must not
    // cancel the press before the user has a chance to start speaking.
    const onVisibilityChange = () => {
      if (document.hidden) cancelVoice();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);
  return r.jsxs("div", {
    className: "voice-assistant-wrap",
    children: [
      clarification && r.jsx(VoiceClarification, { key: clarification.id, prompt: clarification }),
      !clarification && h !== "按住说话" &&
        r.jsx("div", {
          key: isReply ? `reply-${replyVersion}` : h,
          className: isReply ? "voice-reply-status" : undefined,
          role: "status",
          "aria-live": "polite",
          style: {
            maxWidth: 280,
            padding: "8px 12px",
            borderRadius: 12,
            background: "rgba(30, 44, 64, .85)",
            color: "#fff",
            fontSize: 13,
            whiteSpace: "normal",
            overflowWrap: "anywhere",
          },
          children: h,
        }),
      r.jsxs("section", {
        className: `voice-feed ${a ? "tools-open" : ""}`,
        "aria-label": "语音助手对话",
        children: [
          r.jsx("div", {
            ref: B,
            className: "voice-history",
            children: l.length
              ? l.map((o) =>
                  r.jsx(
                    "div",
                    {
                      className: `voice-message ${o.role}`,
                      children: r.jsx("p", { children: o.text }),
                    },
                    o.id,
                  ),
                )
              : null,
          }),
          a &&
            r.jsxs("div", {
              className: "voice-tools-row",
              children: [
                voiceProvider === "ha" &&
                  w.length > 1 &&
                  r.jsxs("div", {
                    className: "voice-picker",
                    children: [
                      r.jsxs("button", {
                        type: "button",
                        className: "voice-picker-trigger",
                        "aria-haspopup": "listbox",
                        "aria-expanded": d,
                        onClick: () => y((o) => !o),
                        children: [
                          (D == null ? void 0 : D.name) ?? "选择助手",
                          r.jsx("span", {
                            "aria-hidden": "true",
                            children: "⌄",
                          }),
                        ],
                      }),
                      d &&
                        r.jsx("div", {
                          className: "voice-picker-menu",
                          role: "listbox",
                          "aria-label": "选择语音助手",
                          children: w.map((o) =>
                            r.jsx(
                              "button",
                              {
                                type: "button",
                                role: "option",
                                "aria-selected": o.id === S,
                                className: o.id === S ? "selected" : "",
                                onClick: () => le(o.id),
                                children: o.name,
                              },
                              o.id,
                            ),
                          ),
                        }),
                    ],
                  }),
                r.jsxs("form", {
                  onSubmit: (o) => {
                    (o.preventDefault(), G(u));
                  },
                  className: "voice-input",
                  children: [
                    r.jsx("input", {
                      "aria-label": "输入语音助手指令",
                      value: u,
                      onChange: (o) => g(o.target.value),
                      placeholder: "键入指令…",
                      disabled: s,
                      autoFocus: !0,
                    }),
                    r.jsx("button", {
                      type: "submit",
                      "aria-label": "发送",
                      disabled: s,
                      children: r.jsx(Re, { size: 15 }),
                    }),
                  ],
                }),
              ],
            }),
        ],
      }),
      r.jsx(VoiceAssistantSettings, {
        menuOpen: voiceMenu,
        closeMenu: () => setVoiceMenu(false),
        onConfigChange: (config) => {
          configSelection.current = config;
          setVoiceProvider(config.provider);
          A(config.pipelineId || "");
        },
      }),
      r.jsxs("button", {
        className: `voice-fab ${de}`,
        onPointerDown: ne,
        onPointerUp: F,
        onPointerCancel: cancelVoice,
        onLostPointerCapture: () => {
          if (C.current) cancelVoice();
        },
        onContextMenu: (event) => {
          event.preventDefault();
          if (C.current || event.nativeEvent?.pointerType === "touch") return;
          setVoiceMenu((open) => !open);
        },
        onSelect: V,
        onDoubleClick: V,
        onDragStart: V,
        onTouchStart: V,
        onClick: ce,
        title: s
          ? "等待助手回复"
          : t
            ? "正在聆听"
            : a
              ? "收起输入"
              : "轻触输入，长按说话",
        "aria-label": s
          ? "等待助手回复"
          : a
            ? "收起输入"
            : "轻触输入，长按说话",
        children: [
          t ? r.jsx(Ae, { size: 20 }) : r.jsx(Ce, { size: 20 }),
          r.jsx("span", { children: s ? "" : "按住说话" }),
        ],
      }),
    ],
  });
}
const tt = (t) =>
  t === "addon"
    ? "Home Assistant Add-on"
    : t === "standalone"
      ? "独立部署"
      : "本地开发";
function st({
  open: t,
  connection: e,
  gatewayConnected: s,
  onClose: i,
  onReconnect: a,
  onConfigure: c,
}) {
  const [d, y] = n.useState(!1),
    [h, f] = n.useState(!1),
    [u, g] = n.useState(
      (e == null ? void 0 : e.restUrl) ?? "http://homeassistant.local:8123",
    ),
    [l, v] = n.useState(""),
    [w, x] = n.useState();
  if (
    (n.useEffect(() => {
      t && e != null && e.restUrl && g(e.restUrl);
    }, [e == null ? void 0 : e.restUrl, t]),
    !t)
  )
    return null;
  const S = !!(e && !e.connected && e.entityCount > 0),
    A =
      e != null && e.connected
        ? "已连接"
        : e != null && e.mock && !S
          ? "未配置"
          : S
            ? "实体已同步"
            : e != null && e.reconnecting
              ? "正在重连"
              : "未连接",
    B =
      e != null && e.connected
        ? "设备状态正在实时同步"
        : e != null && e.mock && !S
          ? "首次使用需要填写 Home Assistant 地址和 API Key"
          : S
            ? "正在使用离线历史实体；连接恢复后会更新实时状态"
            : "自动重连服务已开启",
    I =
      (e == null ? void 0 : e.canConfigure) ??
      (e == null ? void 0 : e.mode) !== "addon",
    T = !!I,
    k = [
      {
        key: "mode",
        icon: r.jsx(Oe, { size: 16 }),
        label: "运行模式",
        value: tt(e == null ? void 0 : e.mode),
      },
      ...(I && e != null && e.restUrl
        ? [
            {
              key: "url",
              icon: r.jsx(Ee, { size: 16 }),
              label: "地址",
              value: e.restUrl,
            },
          ]
        : []),
      ...(((e == null ? void 0 : e.entityCount) ?? 0) > 0
        ? [
            {
              key: "entities",
              icon: r.jsx(Z, { size: 16 }),
              label: "实体",
              value: String((e == null ? void 0 : e.entityCount) ?? 0),
            },
          ]
        : []),
      ...(((e == null ? void 0 : e.areaCount) ?? 0) > 0
        ? [
            {
              key: "areas",
              icon: r.jsx(Z, { size: 16 }),
              label: "区域",
              value: String((e == null ? void 0 : e.areaCount) ?? 0),
            },
          ]
        : []),
      ...(s || (e != null && e.connected) || (e != null && e.reconnecting)
        ? [
            {
              key: "gateway",
              icon: r.jsx(Y, { size: 16 }),
              label: "实时网关",
              value: r.jsxs("span", {
                className: s ? "detail-online" : "detail-pending",
                children: [r.jsx("i", {}), s ? "在线" : "重连中"],
              }),
            },
          ]
        : []),
    ];
  async function C() {
    (y(!0), x(void 0));
    try {
      await a();
    } catch (j) {
      x(j instanceof Error ? j.message : "重连失败");
    } finally {
      y(!1);
    }
  }
  async function N(j) {
    (j.preventDefault(), f(!0), x(void 0));
    try {
      (await c({ url: u, token: l }), v(""));
    } catch (_) {
      x(_ instanceof Error ? _.message : "配置保存失败");
    } finally {
      f(!1);
    }
  }
  return r.jsxs(r.Fragment, {
    children: [
      r.jsx("button", {
        className: "settings-backdrop connection-backdrop",
        onClick: i,
        "aria-label": "关闭连接状态",
      }),
      r.jsxs("aside", {
        className: "connection-panel",
        role: "dialog",
        "aria-modal": "true",
        "aria-labelledby": "connection-panel-title",
        children: [
          r.jsxs("div", {
            className: "settings-drawer-heading",
            children: [
              r.jsxs("div", {
                children: [
                  r.jsx("small", { children: "家庭中心" }),
                  r.jsx("h2", {
                    id: "connection-panel-title",
                    children: "连接与服务",
                  }),
                ],
              }),
              r.jsx("button", {
                className: "panel-close",
                onClick: i,
                "aria-label": "关闭连接状态",
                children: r.jsx(_e, { size: 18 }),
              }),
            ],
          }),
          r.jsxs("div", {
            className: "connection-panel-content",
            children: [
              r.jsxs("div", {
                className: `connection-overview ${e != null && e.connected ? "connected" : e != null && e.mock ? "mock" : "offline"}`,
                children: [
                  r.jsx("span", { children: r.jsx(Y, { size: 20 }) }),
                  r.jsxs("div", {
                    children: [
                      r.jsx("small", { children: "HOME ASSISTANT" }),
                      r.jsx("strong", { children: A }),
                      r.jsx("p", { children: B }),
                    ],
                  }),
                ],
              }),
              k.length > 0 &&
                r.jsx("div", {
                  className: `connection-details ${k.length === 1 ? "compact" : ""}`,
                  role: "list",
                  style: { "--connection-detail-count": k.length },
                  children: k.map((j) =>
                    r.jsxs(
                      "div",
                      {
                        className: `connection-detail-row detail-${j.key}`,
                        role: "listitem",
                        children: [
                          r.jsxs("span", {
                            className: "connection-detail-label",
                            children: [j.icon, j.label],
                          }),
                          r.jsx("span", {
                            className: "connection-detail-value",
                            children: j.value,
                          }),
                        ],
                      },
                      j.key,
                    ),
                  ),
                }),
              T &&
                r.jsxs("form", {
                  className: "connection-config-form",
                  onSubmit: (j) => void N(j),
                  children: [
                    r.jsxs("div", {
                      className: "connection-form-title",
                      children: [
                        r.jsx("span", { children: r.jsx(be, { size: 16 }) }),
                        r.jsxs("div", {
                          children: [
                            r.jsx("strong", {
                              children:
                                e != null && e.configured
                                  ? "更新连接配置"
                                  : "首次连接配置",
                            }),
                            r.jsx("small", {
                              children:
                                "配置会保存在后端 data 目录，重启后继续生效",
                            }),
                          ],
                        }),
                      ],
                    }),
                    r.jsxs("label", {
                      children: [
                        r.jsx("span", { children: "Home Assistant 地址" }),
                        r.jsx("input", {
                          value: u,
                          onChange: (j) => g(j.target.value),
                          placeholder: "http://homeassistant.local:8123",
                          autoComplete: "url",
                          disabled: h,
                        }),
                      ],
                    }),
                    r.jsxs("label", {
                      children: [
                        r.jsx("span", { children: "API Key / 长期访问令牌" }),
                        r.jsx("textarea", {
                          value: l,
                          onChange: (j) => v(j.target.value),
                          placeholder: "粘贴 Home Assistant 长期访问令牌",
                          autoComplete: "off",
                          disabled: h,
                          rows: 3,
                        }),
                      ],
                    }),
                    r.jsxs("button", {
                      type: "submit",
                      className: "connection-save",
                      disabled: h || !u.trim() || !l.trim(),
                      children: [
                        r.jsx(X, { size: 16, className: h ? "spin" : "" }),
                        h ? "正在保存" : "保存并连接",
                      ],
                    }),
                  ],
                }),
              (e == null ? void 0 : e.mock) &&
                !S &&
                r.jsx("p", {
                  className: "connection-note",
                  children:
                    "配置前不会展示任何 HA 设备实体或状态，避免把演示数据误认为真实设备。",
                }),
              S &&
                r.jsx("p", {
                  className: "connection-note",
                  children:
                    "历史实体可用于 3D 展示、绑定和离线界面开发；离线状态不会被当成实时设备状态。",
                }),
              (w ?? (e == null ? void 0 : e.error)) &&
                r.jsx("p", {
                  className: "connection-error",
                  role: "status",
                  children: w ?? (e == null ? void 0 : e.error),
                }),
              r.jsxs("button", {
                className: "connection-retry",
                onClick: () => void C(),
                disabled: d || (e == null ? void 0 : e.mock),
                children: [
                  r.jsx(X, { size: 17, className: d ? "spin" : "" }),
                  d ? "正在重连" : "重新连接",
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}
function rt(t) {
  return !!(t != null && t.entityCount > 0);
}
function at(t) {
  return !!((t != null && t.connected) || rt(t));
}
let q;
const M = (t) => !!(t && (!t.configured || t.mock) && !rt(t));
async function Q(t) {
  if (M(t))
    return { entities: {}, areas: [], devices: [], selectedEntityId: void 0 };
  const [e, s, i] = await Promise.all([oe(), W(), fetchHaDevices()]);
  return {
    entities: Object.fromEntries(e.map((a) => [a.entityId, a])),
    areas: s,
    devices: i,
  };
}
const $ = pe((t, e) => ({
  entities: {},
  areas: [],
  devices: [],
  gatewayConnected: !1,
  status: "loading",
  async load() {
    try {
      const [s, i, a, c, devices] = await Promise.all([
          Le(),
          oe(),
          W(),
          Be(),
          fetchHaDevices(),
        ]),
        d = M(c);
      (t({
        project: s,
        entities: d ? {} : Object.fromEntries(i.map((l) => [l.entityId, l])),
        areas: d ? [] : a,
        devices: d ? [] : devices,
        selectedEntityId: d ? void 0 : e().selectedEntityId,
        connection: c,
        status: "ready",
        error: void 0,
      }),
        q == null || q());
      let y = {},
        h;
      const f = () => {
          ((y = {}), h !== void 0 && (window.clearTimeout(h), (h = void 0)));
        },
        u = () => {
          if (((h = void 0), M(e().connection))) {
            y = {};
            return;
          }
          const l = y;
          y = {};
          if (Object.keys(l).length) {
            const entities = e().entities;
            const updates = Object.fromEntries(
              Object.entries(l).map(([entityId, entity]) => [
                entityId,
                mergeEntityActionResult(entities[entityId], entity),
              ]),
            );
            t({ entities: { ...entities, ...updates } });
          }
        },
        g = (l) => {
          for (const v of Array.isArray(l) ? l : [l]) y[v.entityId] = v;
          h === void 0 && (h = window.setTimeout(u, 120));
        };
      q = Qe(
        (l) => {
          var v;
          if (l.type === "ha.entity_updated") {
            if (M(e().connection)) return;
            g(l.payload);
          }
          if (l.type === "ha.entities_synced") {
            if ((f(), M(e().connection))) {
              t({
                entities: {},
                areas: [],
                devices: [],
                selectedEntityId: void 0,
              });
              return;
            }
            const w = l.payload;
            (t({ entities: Object.fromEntries(w.map((x) => [x.entityId, x])) }),
              Promise.all([W(), fetchHaDevices()])
                .then(([x, devices]) => t({ areas: x, devices }))
                .catch(() => {}));
          }
          if (
            (l.type === "project.updated" && t({ project: l.payload }),
            l.type === "ha.status")
          ) {
            const w = l.payload,
              x = {
                ...e().connection,
                ...w,
                error: w.connected
                  ? void 0
                  : (w.error ??
                    ((v = e().connection) == null ? void 0 : v.error)),
              };
            (t({
              connection: x,
              ...(M(x)
                ? {
                    entities: {},
                    areas: [],
                    devices: [],
                    selectedEntityId: void 0,
                  }
                : {}),
            }),
              M(x) && f());
          }
          if (l.type === "ha.error") {
            const w = l.payload;
            t({
              connection: e().connection
                ? { ...e().connection, error: w == null ? void 0 : w.message }
                : void 0,
            });
          }
        },
        (l) => t({ gatewayConnected: l }),
      );
    } catch (s) {
      t({ status: "error", error: s instanceof Error ? s.message : String(s) });
    }
  },
  selectEntity(s) {
    t({ selectedEntityId: s });
  },
  async act(s) {
    const i = await Ve(s);
    if (!M(e().connection)) {
      const entities = e().entities;
      t({
        entities: {
          ...entities,
          [i.entityId]: mergeEntityActionResult(entities[i.entityId], i),
        },
      });
    }
  },
  async reconnectHomeAssistant() {
    const s = await He();
    t({ connection: s, ...(await Q(s)) });
  },
  async configureHomeAssistant(s) {
    const i = await ze(s);
    t({ connection: i, ...(await Q(i)) });
  },
  async saveProject(s) {
    const i = await We(s);
    t({ project: i });
  },
  async importBlueprint(s) {
    const i = e().project;
    if (!i) throw new Error("Project is not loaded");
    const a = await Fe(i.id, s);
    t({ project: a });
  },
  async resetProject() {
    const s = e().project;
    if (!s) throw new Error("Project is not loaded");
    const i = await Ge(s.id);
    t({ project: i, selectedEntityId: void 0 });
  },
  async importProject(s) {
    const i = e().project;
    if (!i) throw new Error("Project is not loaded");
    const a = await Je(i.id, s);
    t({ project: a, selectedEntityId: void 0 });
  },
  async listProjectBackups() {
    const s = e().project;
    if (!s) throw new Error("Project is not loaded");
    return Ke(s.id);
  },
  async restoreProjectBackup(s) {
    const i = e().project;
    if (!i) throw new Error("Project is not loaded");
    const a = await Ze(i.id, s);
    t({ project: a, selectedEntityId: void 0 });
  },
  async getRoomBindingSuggestions() {
    return Xe();
  },
  async applyRoomBindingSuggestions(s) {
    const i = await Ye(s);
    t({ project: i });
  },
}));
let ee,
  te = 0;
const it = 120;
function ot() {
  if (typeof window > "u") return;
  const t = window.AudioContext || window.webkitAudioContext;
  if (t) return (ee ?? (ee = new t()), ee);
}
function se(t) {
  const e = t.currentTime,
    s = t.createGain(),
    i = t.createOscillator(),
    a = t.createGain(),
    c = t.createOscillator(),
    d = t.createGain(),
    y = t.createBufferSource(),
    h = t.createGain(),
    f = t.createBiquadFilter(),
    u = t.createBiquadFilter();
  (s.gain.setValueAtTime(0.72, e),
    (i.type = "sine"),
    i.frequency.setValueAtTime(1380, e),
    i.frequency.exponentialRampToValueAtTime(1120, e + 0.028),
    a.gain.setValueAtTime(1e-4, e),
    a.gain.exponentialRampToValueAtTime(0.026, e + 0.0025),
    a.gain.exponentialRampToValueAtTime(1e-4, e + 0.038),
    (c.type = "triangle"),
    c.frequency.setValueAtTime(2380, e),
    c.frequency.exponentialRampToValueAtTime(1780, e + 0.018),
    d.gain.setValueAtTime(1e-4, e),
    d.gain.exponentialRampToValueAtTime(0.011, e + 0.0015),
    d.gain.exponentialRampToValueAtTime(1e-4, e + 0.022));
  const g = t.createBuffer(
      1,
      Math.max(1, Math.floor(t.sampleRate * 0.018)),
      t.sampleRate,
    ),
    l = g.getChannelData(0);
  for (let v = 0; v < l.length; v += 1) {
    const w = 1 - v / l.length;
    l[v] = (Math.random() * 2 - 1) * w * w;
  }
  ((y.buffer = g),
    h.gain.setValueAtTime(1e-4, e),
    h.gain.exponentialRampToValueAtTime(0.007, e + 0.001),
    h.gain.exponentialRampToValueAtTime(1e-4, e + 0.016),
    (f.type = "highpass"),
    f.frequency.setValueAtTime(900, e),
    (u.type = "lowpass"),
    u.frequency.setValueAtTime(6200, e),
    i.connect(a),
    c.connect(d),
    y.connect(f),
    f.connect(h),
    a.connect(u),
    d.connect(u),
    h.connect(u),
    u.connect(s),
    s.connect(t.destination),
    i.start(e),
    c.start(e),
    y.start(e),
    i.stop(e + 0.045),
    c.stop(e + 0.026),
    y.stop(e + 0.02));
}
function nt() {
  const t = Date.now();
  if (t - te < it) return;
  te = t;
  const e = ot();
  if (e) {
    if (e.state === "suspended") {
      e.resume()
        .then(() => se(e))
        .catch(() => {});
      return;
    }
    se(e);
  }
}
function ct(t) {
  return t instanceof HTMLElement
    ? t.getAttribute("aria-disabled") === "true"
      ? !0
      : "disabled" in t && !!t.disabled
    : !1;
}
function lt(t) {
  if (!(t instanceof Element)) return !1;
  const e = t.closest(
    "button, a[href], [role='button'], input[type='button'], input[type='submit'], input[type='reset'], input[type='checkbox'], input[type='radio'], summary",
  );
  return !!(e && !ct(e));
}
function dt() {
  if (typeof document > "u") return () => {};
  const t = (e) => {
    lt(e.target) && nt();
  };
  return (
    document.addEventListener("click", t, !0),
    () => document.removeEventListener("click", t, !0)
  );
}
const ut = {},
  pt = n.lazy(() =>
    import("./floorplan-editor.js").then((t) => ({
      default: t.FloorplanEditor,
    })),
  ),
  ft = n.lazy(() =>
    import("./home-view.js").then((t) => ({ default: t.HomeView })),
  ),
  nextDeviceCenter = n.lazy(
    () => import("./device-development-center/index.jsx"),
  );
function re({ label: t }) {
  return r.jsxs("div", {
    className: "app-loading",
    role: "status",
    "aria-live": "polite",
    children: [
      r.jsx("span", { className: "loading-spinner", "aria-hidden": "true" }),
      r.jsx("strong", { children: t }),
      r.jsx("small", { children: "正在同步户型、设备与实时状态" }),
    ],
  });
}
const SidebarDevelopmentCenter = n.lazy(() => import("./sidebar-development/index.jsx"));
function ht() {
  const t = $((m) => m.load),
    e = $((m) => m.status),
    s = $((m) => m.project),
    i = $((m) => m.entities),
    devices = $((m) => m.devices),
    a = $((m) => m.connection),
    c = $((m) => m.gatewayConnected),
    d = $((m) => m.error),
    y = $((m) => m.reconnectHomeAssistant),
    h = $((m) => m.configureHomeAssistant),
    [f, u] = n.useState("home"),
    [g, l] = n.useState(!1),
    [nextCenterOpen, setNextCenterOpen] = n.useState(!1),
    [sidebarCenterOpen, setSidebarCenterOpen] = n.useState(false),
    [homeSceneResumeKey, setHomeSceneResumeKey] = n.useState(0),
    [v, w] = n.useState(!1),
    [A, B] = n.useState(() => (typeof window > "u" ? 1440 : window.innerWidth)),
    I = n.useRef(!1),
    T = n.useRef(!1),
    k = n.useRef(void 0);
  (n.useEffect(() => {
    T.current || ((T.current = !0), t());
  }, [t]),
    n.useEffect(() => {
      const m = () => t();
      return (
        window.addEventListener("ha3d-device-platform-updated", m),
        () => window.removeEventListener("ha3d-device-platform-updated", m)
      );
    }, [t]),
    n.useEffect(() => dt(), []),
    n.useEffect(() => {
      let m = 0;
      const H = () => {
        (m && cancelAnimationFrame(m),
          (m = requestAnimationFrame(() => B(window.innerWidth))));
      };
      return (
        window.addEventListener("resize", H),
        () => {
          (window.removeEventListener("resize", H),
            m && cancelAnimationFrame(m));
        }
      );
    }, []),
    n.useEffect(
      () => () => {
        k.current && window.clearTimeout(k.current);
      },
      [],
    ));
  const C = () => {
      (w(!0),
        k.current && window.clearTimeout(k.current),
        (k.current = window.setTimeout(() => w(!1), 3600)));
    },
    j = () => {
      if (A <= 620) {
        (u("home"), C());
        return;
      }
      u("editor");
    };
  (n.useEffect(() => {
    f === "editor" && A <= 620 && (u("home"), C());
  }, [f, A]),
    n.useEffect(() => {
      if (I.current || e !== "ready" || !s || !a) return;
      (a.canConfigure ?? a.mode !== "addon") &&
        (!a.configured || a.mock) &&
        ((I.current = !0), l(!0));
    }, [a, s, e]));
  const _ = n.useMemo(() => {
    const source = at(a) ? i : ut;
    if (!at(a) || !devices.length) return source;
    const deviceById = new Map(devices.map((device) => [device.id, device]));
    return Object.fromEntries(
      Object.entries(source).map(([entityId, entity]) => {
        const device = deviceById.get(entity.deviceId);
        const deviceEntities = (device?.entityIds ?? [])
          .concat(device?.extraEntityIds ?? [])
          .map((id) => source[id])
          .filter(Boolean);
        return [
          entityId,
          {
            ...entity,
            deviceDisplayName: resolveDeviceDisplayName(entity, deviceById),
            deviceCapabilityBindings: device?.capabilityBindings,
            deviceCapabilityMappings: device?.capabilityMappings,
            deviceMotionAvailable: a?.connected === true,
            deviceStatusDisplay: device?.statusDisplay,
            deviceCapabilityNames: device?.capabilityNames,
            deviceEntities,
            deviceOperationalState: device?.operationalStateEntityId
              ? source[device.operationalStateEntityId]
              : undefined,
          },
        ];
      }),
    );
  }, [a, devices, i]);
  return r.jsxs("main", {
    className: `app-shell mode-${f}`,
    children: [
      d && r.jsx("div", { className: "error-banner", children: d }),
      !s && !d && r.jsx(re, { label: "正在加载户型与设备" }),

      r.jsxs(n.Suspense, {
        fallback: r.jsx(re, { label: "正在加载界面" }),
        children: [
          s &&
            f === "editor" &&
            r.jsx(pt, {
              project: s,
              entities: _,
              devices: at(a) ? devices : [],
              status: e,
              connection: a,
              onBackHome: () => u("home"),
              onOpenSettings: () => l(!0),
            }),
          s &&
            f === "home" &&
            r.jsx(ft, {
              project: s,
              entities: _,
              status: e,
              connection: a,
              onOpenSettings: () => l(!0),
              onOpenEditor: j,
              voiceAssistant: r.jsx(et, {}),
              onOpenDeviceDevelopmentCenter: () => setNextCenterOpen(!0),
              onOpenSidebarDevelopmentCenter: (floorId) => setSidebarCenterOpen(floorId || true),
              sceneResumeKey: homeSceneResumeKey,
            }),
          sidebarCenterOpen && r.jsx(SidebarDevelopmentCenter, {project: s, initialFloorId: typeof sidebarCenterOpen === "string" ? sidebarCenterOpen : undefined, entities: _, onClose: () => {setSidebarCenterOpen(false);setHomeSceneResumeKey(key => key + 1);}}),
          nextCenterOpen &&
            r.jsx(ApplicationBoundary, {label:'设备开发中心',onClose:()=>{setNextCenterOpen(false);setHomeSceneResumeKey(key=>key+1);},children:r.jsx(n.Suspense,{fallback:r.jsx('div',{className:'application-center-loading',role:'status',children:'正在加载设备开发中心…'}),children:r.jsx(nextDeviceCenter, {
              open: nextCenterOpen,
              onClose: () => {
                setNextCenterOpen(!1);
                requestAnimationFrame(() =>
                  setHomeSceneResumeKey((key) => key + 1),
                );
              },
            })})}),
        ],
      }),
      v &&
        r.jsxs("div", {
          className: "mobile-editor-notice",
          role: "status",
          children: [
            r.jsx("strong", { children: "手机端暂不支持编辑" }),
            r.jsx("span", {
              children:
                "请在 PC 或平板上编辑户型，手机端可继续查看和控制 3D 全屋。",
            }),
          ],
        }),
      r.jsx(st, {
        open: g,
        connection: a,
        gatewayConnected: c,
        onClose: () => l(!1),
        onReconnect: y,
        onConfigure: h,
      }),
    ],
  });
}
ue.createRoot(document.getElementById("root")).render(
  r.jsx(fe.StrictMode, { children: r.jsx(ApplicationBoundary,{children:r.jsx(ht, {})}) }),
);
export {
  Ce as M,
  X as R,
  Y as W,
  _e as X,
  at as a,
  Ae as b,
  R as c,
  gt as d,
  jt as f,
  rt as h,
  nt as p,
  $ as u,
};
