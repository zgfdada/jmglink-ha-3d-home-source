import {CameraViewer} from '../components/camera-controls.jsx';
import '../styles/mobile-development-menu.css';
import {CameraLiveView} from './scene.js';
import InstanceTransfer from "./instance-transfer.jsx";
import { resolveDaylight } from "../../../../packages/schema/src/daylight.js";
import { PublishedSidebar, SidebarVisibilityToggle } from "./sidebar-development/renderer.jsx";
/**
 * Recovered application module from official 0.1.5 Vite artifact: HomeView-BFS1nsev.js
 * Original identifiers, TypeScript types, comments, and module boundaries were not present.
 */
import { j as e } from "../vendor/three.js";
import { a as l } from "../vendor/react.js";
import {
  K as Mt,
  W as nt,
  A as we,
  P as Ct,
  E as Rs,
  q as Es,
  T as Hs,
  o as me,
  c as Qe,
  Y as Ts,
  G as Vt,
  Z as _t,
  _ as et,
  $ as zt,
  a0 as Ps,
  a1 as Ls,
  s as Os,
  a2 as Bt,
  a3 as Ws,
  a4 as Vs,
  a5 as Bs,
  u as Xs,
  a6 as Ks,
  a7 as Xt,
  a8 as it,
  a9 as rt,
  aa as qs,
  ab as Kt,
  n as Dt,
  v as Qs,
  ac as qt,
  ad as Zs,
  ae as Gs,
  B as Us,
  t as Ys,
  p as Js,
  H as ea,
  af as ta,
  ag as Qt,
  F as ot,
  M as sa,
  ah as aa,
} from "./scene.js";
import { c as Z, X as ve, u as Se, a as na, h as ia, R as la } from "./app.js";
import "../vendor/hls.js";
import "../styles/home-view-controls.css";
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const ca = [
    ["path", { d: "m12 19-7-7 7-7", key: "1l729n" }],
    ["path", { d: "M19 12H5", key: "x3x0zl" }],
  ],
  tt = Z("arrow-left", ca);
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const da = [
    ["path", { d: "M3 3h18", key: "o7r712" }],
    ["path", { d: "M20 7H8", key: "gd2fo2" }],
    ["path", { d: "M20 11H8", key: "1ynp89" }],
    ["path", { d: "M10 19h10", key: "19hjk5" }],
    ["path", { d: "M8 15h12", key: "1yqzne" }],
    ["path", { d: "M4 3v14", key: "fggqzn" }],
    ["circle", { cx: "4", cy: "19", r: "2", key: "p3m9r0" }],
  ],
  ua = Z("blinds", da);
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const ha = [
    ["path", { d: "M12 20v-9", key: "1qisl0" }],
    [
      "path",
      {
        d: "M14 7a4 4 0 0 1 4 4v3a6 6 0 0 1-12 0v-3a4 4 0 0 1 4-4z",
        key: "uouzyp",
      },
    ],
    ["path", { d: "M14.12 3.88 16 2", key: "qol33r" }],
    ["path", { d: "M21 21a4 4 0 0 0-3.81-4", key: "1b0z45" }],
    ["path", { d: "M21 5a4 4 0 0 1-3.55 3.97", key: "5cxbf6" }],
    ["path", { d: "M22 13h-4", key: "1jl80f" }],
    ["path", { d: "M3 21a4 4 0 0 1 3.81-4", key: "1fjd4g" }],
    ["path", { d: "M3 5a4 4 0 0 0 3.55 3.97", key: "1d7oge" }],
    ["path", { d: "M6 13H2", key: "82j7cp" }],
    ["path", { d: "m8 2 1.88 1.88", key: "fmnt4t" }],
    ["path", { d: "M9 7.13V6a3 3 0 1 1 6 0v1.13", key: "1vgav8" }],
  ],
  ma = Z("bug", ha);
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const pa = [["path", { d: "m9 18 6-6-6-6", key: "mthhwq" }]],
  fa = Z("chevron-right", pa);
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const xa = [
    [
      "path",
      {
        d: "M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242",
        key: "1pljnt",
      },
    ],
    ["path", { d: "M16 17H7", key: "pygtm1" }],
    ["path", { d: "M17 21H9", key: "1u2q02" }],
  ],
  ba = Z("cloud-fog", xa);
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const ya = [
    [
      "path",
      {
        d: "M6 16.326A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 .5 8.973",
        key: "1cez44",
      },
    ],
    ["path", { d: "m13 12-3 5h4l-3 5", key: "1t22er" }],
  ],
  va = Z("cloud-lightning", ya);
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const ga = [
    [
      "path",
      {
        d: "M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242",
        key: "1pljnt",
      },
    ],
    ["path", { d: "M16 14v6", key: "1j4efv" }],
    ["path", { d: "M8 14v6", key: "17c4r9" }],
    ["path", { d: "M12 16v6", key: "c8a4gj" }],
  ],
  ja = Z("cloud-rain", ga);
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const wa = [
    [
      "path",
      {
        d: "M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242",
        key: "1pljnt",
      },
    ],
    ["path", { d: "M8 15h.01", key: "a7atzg" }],
    ["path", { d: "M8 19h.01", key: "puxtts" }],
    ["path", { d: "M12 17h.01", key: "p32p05" }],
    ["path", { d: "M12 21h.01", key: "h35vbk" }],
    ["path", { d: "M16 15h.01", key: "rnfrdf" }],
    ["path", { d: "M16 19h.01", key: "1vcnzz" }],
  ],
  ka = Z("cloud-snow", wa);
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Ia = [
    ["path", { d: "M4 5h16", key: "1tepv9" }],
    ["path", { d: "M4 12h16", key: "1lakjw" }],
    ["path", { d: "M4 19h16", key: "1djgab" }],
  ],
  Sa = Z("menu", Ia);
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Na = [
    [
      "path",
      {
        d: "M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401",
        key: "kfwtm",
      },
    ],
  ],
  $a = Z("moon", Na);
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Ma = [
    [
      "rect",
      { width: "18", height: "18", x: "3", y: "3", rx: "2", key: "afitv7" },
    ],
    ["path", { d: "M15 3v18", key: "14nvp0" }],
    ["path", { d: "m10 15-3-3 3-3", key: "1pgupc" }],
  ],
  Ca = Z("panel-right-open", Ma);
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const _a = [
    ["path", { d: "M12 17v5", key: "bb1du9" }],
    [
      "path",
      {
        d: "M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z",
        key: "1nkz8b",
      },
    ],
  ],
  za = Z("pin", _a);
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Da = [
    [
      "path",
      { d: "M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8", key: "1p45f6" },
    ],
    ["path", { d: "M21 3v5h-5", key: "1q7to0" }],
  ],
  Aa = Z("rotate-cw", Da),
  Fa = { enabled: !1, modelShowcase: "none", weatherState: "live" },
  Ra = [
    { label: "真实天气", value: "live" },
    { label: "晴天", value: "sunny" },
    { label: "小雨", value: "rainy" },
    { label: "大雨", value: "pouring" },
    { label: "下雪", value: "snowy" },
    { label: "刮风", value: "windy" },
    { label: "雷雨", value: "lightning-rainy" },
    { label: "有雾", value: "fog" },
  ],
  At = [
    { label: "不展示", value: "none", description: "不叠加临时模型" },
    {
      label: "照明模型",
      value: "lighting",
      description: "灯具、灯带与开关控制灯",
    },
    {
      label: "开关插座",
      value: "switch",
      description: "墙壁开关、场景按钮与插座",
    },
    { label: "遮阳窗帘", value: "shade", description: "窗帘、百叶和卷帘" },
    {
      label: "空调温控",
      value: "climate",
      description: "壁挂、中央、柜机和温控面板",
    },
    {
      label: "环境传感",
      value: "sensor",
      description: "温湿度、照度、CO₂、PM2.5 等",
    },
    {
      label: "安防模型",
      value: "security",
      description: "门锁、门磁、人体、烟感、水浸和安防面板",
    },
    {
      label: "摄像头",
      value: "camera",
      description: "墙面、云台、枪机和门铃摄像头",
    },
    {
      label: "风扇影音",
      value: "fan_media",
      description: "风扇、电视、音箱和扫地机器人",
    },
    { label: "全部模型", value: "all", description: "叠加全部可用模型" },
  ],
  Ft = "2026-08-13T00:00:00.000Z";
function K(t, s, a, i, r = {}, c) {
  return {
    areaId: c,
    attributes: r,
    domain: s,
    entityId: t,
    lastChanged: Ft,
    lastUpdated: Ft,
    name: a,
    state: i,
  };
}
function Ea() {
  return !1;
}
function lt() {
  return Ea();
}
function Ha(t) {
  const s = [
    {
      condition: t,
      datetime: "2026-08-14T09:00:00+08:00",
      precipitation_probability: t === "sunny" ? 8 : 62,
      temperature: 32,
      templow: 27,
    },
    {
      condition: "partlycloudy",
      datetime: "2026-08-15T09:00:00+08:00",
      precipitation_probability: 18,
      temperature: 34,
      templow: 28,
    },
    {
      condition: "rainy",
      datetime: "2026-08-16T09:00:00+08:00",
      precipitation_probability: 58,
      temperature: 31,
      templow: 26,
    },
    {
      condition: "windy",
      datetime: "2026-08-17T09:00:00+08:00",
      precipitation_probability: 24,
      temperature: 30,
      templow: 25,
    },
  ];
  return K(
    "weather.dev_weather",
    "weather",
    "开发天气",
    t,
    {
      fog: {
        forecast: s,
        humidity: 94,
        temperature: 13,
        visibility: 0.8,
        wind_speed: 4,
      },
      "lightning-rainy": {
        forecast: s,
        humidity: 91,
        precipitation: 12,
        temperature: 18,
        wind_speed: 28,
      },
      pouring: {
        forecast: s,
        humidity: 88,
        precipitation: 16,
        temperature: 19,
        wind_speed: 16,
      },
      rainy: {
        forecast: s,
        humidity: 82,
        precipitation: 4,
        temperature: 20,
        wind_speed: 9,
      },
      snowy: {
        forecast: s,
        humidity: 76,
        precipitation: 6,
        temperature: -2,
        wind_speed: 7,
      },
      sunny: { forecast: s, humidity: 46, temperature: 26, wind_speed: 5 },
      windy: { forecast: s, humidity: 58, temperature: 22, wind_speed: 30 },
    }[t],
  );
}
const Ta = {
  all: [],
  camera: ["camera"],
  climate: ["climate"],
  fan_media: ["fan", "media_player", "vacuum"],
  lighting: ["light"],
  none: [],
  security: ["binary_sensor", "lock", "alarm_control_panel"],
  sensor: ["sensor"],
  shade: ["cover"],
  switch: ["switch"],
};
function Zt(t) {
  if (t === "none") return [];
  if (t === "all") return [...Mt];
  const s = new Set(Ta[t]);
  return Mt.filter((a) => s.has(a.kind));
}
function Pa(t, s) {
  const a = `${t.kind}.dev_model_${t.id.replace(/\W+/g, "_")}`,
    i = { model_id: t.id, friendly_name: t.label };
  return t.kind === "light"
    ? K(a, "light", t.label, "on", {
        ...i,
        brightness: 218,
        rgb_color: [255, 204, 138],
      })
    : t.kind === "switch"
      ? K(a, "switch", t.label, "on", i)
      : t.kind === "cover"
        ? K(a, "cover", t.label, "open", { ...i, current_position: 72 })
        : t.kind === "climate"
          ? K(a, "climate", t.label, "cool", {
              ...i,
              current_temperature: 27,
              temperature: 24,
            })
          : t.kind === "sensor"
            ? K(
                a,
                "sensor",
                t.label,
                String(s % 3 === 0 ? 27.6 : s % 3 === 1 ? 58 : 820),
                {
                  ...i,
                  unit_of_measurement:
                    s % 3 === 0 ? "°C" : s % 3 === 1 ? "%" : "ppm",
                },
              )
            : t.kind === "binary_sensor"
              ? K(a, "binary_sensor", t.label, "on", {
                  ...i,
                  device_class: t.id.includes("door")
                    ? "door"
                    : t.id.includes("water")
                      ? "moisture"
                      : t.id.includes("smoke")
                        ? "smoke"
                        : "motion",
                })
              : t.kind === "lock"
                ? K(a, "lock", t.label, "unlocked", i)
                : t.kind === "camera"
                  ? K(a, "camera", t.label, "idle", i)
                  : t.kind === "fan"
                    ? K(a, "fan", t.label, "on", {
                        ...i,
                        percentage: 68,
                        oscillating: !0,
                      })
                    : t.kind === "media_player"
                      ? K(a, "media_player", t.label, "playing", {
                          ...i,
                          media_title: "模型预览",
                        })
                      : t.kind === "vacuum"
                        ? K(a, "vacuum", t.label, "cleaning", i)
                        : t.kind === "alarm_control_panel"
                          ? K(
                              a,
                              "alarm_control_panel",
                              t.label,
                              "armed_home",
                              i,
                            )
                          : K(a, t.kind, t.label, "on", i);
}
function La(t) {
  return Zt(t).map(Pa);
}
function Oa(t) {
  const s = [
    ...t.rooms.flatMap((a) => a.polygon),
    ...t.walls.flatMap((a) => [a.start, a.end]),
    ...t.furniture.map((a) => a.position),
  ];
  return s.length
    ? s.reduce(
        (a, i) => ({
          maxX: Math.max(a.maxX, i[0]),
          maxZ: Math.max(a.maxZ, i[1]),
          minX: Math.min(a.minX, i[0]),
          minZ: Math.min(a.minZ, i[1]),
        }),
        { maxX: -1 / 0, maxZ: -1 / 0, minX: 1 / 0, minZ: 1 / 0 },
      )
    : { minX: -1.5, maxX: 1.5, minZ: -1.5, maxZ: 1.5 };
}
function Wa(t, s) {
  return t.placement === "ceiling"
    ? Math.max(0.2, s - 0.08)
    : t.id === "climate.wall_ac"
      ? Math.max(0.2, s - 0.32)
      : t.defaultHeight;
}
function Va(t, s, a) {
  if (!lt() || !s.enabled) return [];
  const i = Zt(s.modelShowcase),
    r = t.floors.find((N) => N.id === a) ?? t.floors[0];
  if (!r || !i.length) return [];
  const c = Oa(r),
    f = Math.min(6, Math.max(3, Math.ceil(Math.sqrt(i.length)))),
    h = 1.06,
    v = 1.05,
    k = c.minX + v,
    j = c.minZ + v,
    z = Math.max(k, c.maxX - v),
    P = Math.max(j, c.maxZ - v);
  return i.map((N, O) => {
    var T;
    const $ = O % f,
      x = Math.floor(O / f),
      C = Math.min(z, k + $ * h),
      te = Math.min(P, j + x * h);
    return {
      entityId: `${N.kind}.dev_model_${N.id.replace(/\W+/g, "_")}`,
      floorId: r.id,
      id: `dev-model-${N.id}`,
      kind: N.kind,
      modelId: N.id,
      position: [C, Wa(N, r.height), te],
      rotation: [0, N.placement === "wall" ? Math.PI : 0, 0],
      roomId:
        (T = r.rooms.find((D) => D.polygon.length)) == null ? void 0 : T.id,
    };
  });
}
function Ba(t, s) {
  if (!lt() || !s.enabled) return t;
  const a = [
    ...La(s.modelShowcase),
    ...(s.weatherState === "live" ? [] : [Ha(s.weatherState)]),
  ];
  return a.length
    ? { ...t, ...Object.fromEntries(a.map((i) => [i.entityId, i])) }
    : t;
}
function Xa(t, s, a) {
  const i = Va(t, s, a);
  if (!i.length) return t;
  const r = i[0].floorId;
  return {
    ...t,
    floors: t.floors.map((c) =>
      c.id === r
        ? {
            ...c,
            devices: [
              ...c.devices.filter((f) => !f.id.startsWith("dev-model-")),
              ...i,
            ],
          }
        : {
            ...c,
            devices: c.devices.filter((f) => !f.id.startsWith("dev-model-")),
          },
    ),
  };
}
const Ka = new Set(["sunny", "clear-night", "partlycloudy", "cloudy"]),
  qa = new Set(["rainy", "pouring", "hail", "snowy-rainy"]),
  Qa = new Set(["snowy"]),
  Za = new Set(["windy", "windy-variant"]),
  Ga = new Set(["lightning", "lightning-rainy", "exceptional"]),
  Ua = new Set(["fog"]),
  ge = {
    clear: "天气正常",
    fog: "有雾",
    rain: "下雨",
    snow: "下雪",
    storm: "雷暴",
    wind: "刮风",
  };
function J(t) {
  if (typeof t == "number" && Number.isFinite(t)) return t;
  if (typeof t == "string") {
    const s = Number.parseFloat(t);
    return Number.isFinite(s) ? s : void 0;
  }
}
function Ya(t) {
  return `${t.entityId} ${t.name}`.toLowerCase();
}
function Gt(t) {
  return Ga.has(t)
    ? "storm"
    : Qa.has(t)
      ? "snow"
      : qa.has(t)
        ? "rain"
        : Za.has(t)
          ? "wind"
          : Ua.has(t)
            ? "fog"
            : (Ka.has(t), "clear");
}
function Ja(t, s, a) {
  if (t === "clear") return 0;
  const i = J(a.precipitation) ?? J(a.precipitation_probability),
    r = J(a.wind_speed);
  return s === "pouring" || s === "lightning-rainy"
    ? 1
    : s === "hail" || s === "snowy-rainy" || s === "snowy"
      ? 0.82
      : t === "wind" && r !== void 0
        ? Math.min(1, Math.max(0.38, r / 38))
        : (t === "rain" || t === "snow") && i !== void 0
          ? Math.min(1, Math.max(0.42, i > 1 ? i / 16 : i))
          : t === "fog"
            ? 0.62
            : 0.68;
}
function en(t) {
  if (t.domain !== "sensor" && t.domain !== "binary_sensor") return;
  const s = Ya(t),
    a = J(t.state),
    i = ![
      "off",
      "closed",
      "idle",
      "unavailable",
      "unknown",
      "0",
      "0.0",
    ].includes(t.state.toLowerCase());
  if (
    /(wind|wind_speed|gust|风速|阵风|大风)/i.test(s) &&
    a !== void 0 &&
    a >= 8
  )
    return {
      entityId: t.entityId,
      forecast: [],
      kind: "wind",
      label: ge.wind,
      intensity: Math.min(1, Math.max(0.38, a / 38)),
      state: t.state,
      windSpeed: a,
    };
  if (
    /(rain|rainfall|precipitation|precip|降雨|降水|雨量|正在下雨)/i.test(s) &&
    (i || (a ?? 0) > 0)
  )
    return {
      entityId: t.entityId,
      forecast: [],
      kind: "rain",
      label: ge.rain,
      intensity: Math.min(1, Math.max(0.45, (a ?? 1) / 16)),
      state: t.state,
    };
  if (/(snow|snowfall|降雪|下雪)/i.test(s) && (i || (a ?? 0) > 0))
    return {
      entityId: t.entityId,
      forecast: [],
      kind: "snow",
      label: ge.snow,
      intensity: Math.min(1, Math.max(0.42, (a ?? 1) / 12)),
      state: t.state,
    };
}
function tn(t) {
  return (
    [t.forecast, t.daily_forecast, t.hourly_forecast].find(
      (a) => Array.isArray(a) && a.some((i) => i && typeof i == "object"),
    ) ?? []
  );
}
function sn(t) {
  return tn(t)
    .map((s) => {
      const a = typeof s.condition == "string" ? s.condition : void 0,
        i = Gt((a ?? "sunny").toLowerCase()),
        r = typeof s.datetime == "string" ? s.datetime : void 0;
      return {
        condition: a,
        datetime: r,
        humidity: J(s.humidity),
        kind: i,
        label: ge[i],
        precipitation: J(s.precipitation),
        precipitationProbability: J(s.precipitation_probability),
        temperature: J(s.temperature),
        temperatureLow: J(s.templow),
        windSpeed: J(s.wind_speed),
      };
    })
    .filter(
      (s) =>
        s.datetime ||
        s.temperature !== void 0 ||
        s.temperatureLow !== void 0 ||
        s.precipitationProbability !== void 0,
    )
    .slice(0, 5);
}
function an(t) {
  const s = Object.values(t),
    a = t["weather.dev_weather"] ?? s.find((c) => c.domain === "weather");
  if (a) {
    const c = a.state.toLowerCase(),
      f = Gt(c),
      h = J(a.attributes.wind_speed);
    return {
      entityId: a.entityId,
      forecast: sn(a.attributes),
      kind: f,
      label: ge[f],
      intensity: Ja(f, c, a.attributes),
      state: a.state,
      temperature: J(a.attributes.temperature),
      windSpeed: h,
    };
  }
  const i = s.map(en).filter((c) => !!c),
    r = ["storm", "snow", "rain", "wind", "fog", "clear"];
  return (
    i.sort(
      (c, f) =>
        r.indexOf(c.kind) - r.indexOf(f.kind) || f.intensity - c.intensity,
    )[0] ?? { forecast: [], kind: "clear", label: ge.clear, intensity: 0 }
  );
}
const nn = new Set([
    "sensor",
    "binary_sensor",
    "climate",
    "person",
    "device_tracker",
    "weather",
  ]),
  rn = new Set(["unknown", "unavailable", "none"]);
function Rt(t, s, a) {
  return Math.min(Math.max(t, s), a);
}
function Ze(t) {
  return { x: 3 + (t % 2) * 12, y: 22 + Math.floor(t / 2) * 10 };
}
function Ut(t) {
  return !!(t && nn.has(t.domain));
}
function Yt(t) {
  const s = t == null ? void 0 : t.attributes.device_class;
  return typeof s == "string" ? s.toLowerCase() : "";
}
function Ne(t) {
  const s = t == null ? void 0 : t.attributes.unit_of_measurement;
  return typeof s == "string" ? s : "";
}
function st(t) {
  return t.type === "metric" ? [t.entityId] : t.items.map((s) => s.entityId);
}
function Ee(t, s) {
  if (s) return s;
  const a = Yt(t);
  return /power|energy|battery/.test(a)
    ? "#ffd08a"
    : /temperature/.test(a)
      ? "#ffb38a"
      : /humidity|moisture|water/.test(a)
        ? "#83d8ff"
        : /illuminance|light/.test(a)
          ? "#fff0a8"
          : /motion|occupancy|presence|door|window/.test(a)
            ? "#9cf0ca"
            : "#a9c4ff";
}
function on(t, s) {
  const a = t.replace(/\s+/, "T").replace(/([+-]\d{2})(\d{2})$/, "$1:$2"),
    i = /^\d{4}-\d{2}-\d{2}$/.test(t);
  if (
    !/^\d{4}-\d{2}-\d{2}(?:[T\s]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/.test(
      t,
    ) &&
    !["date", "timestamp"].includes(s)
  )
    return;
  const c = new Date(a);
  if (Number.isNaN(c.getTime())) return;
  const f =
    i || s === "date"
      ? { month: "numeric", day: "numeric" }
      : {
          month: "numeric",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: !1,
        };
  return new Intl.DateTimeFormat("zh-Hans", f).format(c);
}
function Jt(t, s = {}) {
  if (!t) return { value: "--", unit: s.unit ?? "", muted: "未找到实体" };
  const a =
      t.domain === "climate"
        ? (t.attributes.current_temperature ?? t.attributes.temperature)
        : void 0,
    i = String(a ?? t.state ?? "").trim();
  if (!i || rn.has(i.toLowerCase()))
    return { value: "--", unit: s.unit ?? Ne(t), muted: me(t) };
  const r = on(i, Yt(t));
  if (r) return { value: r, unit: "", muted: Qe(t.domain) };
  const c = Number(i),
    f = s.unit ?? (t.domain === "climate" && a !== void 0 ? "°C" : Ne(t));
  if (Number.isFinite(c)) {
    const h =
      s.precision ??
      (Number.isInteger(c) || Math.abs(c) >= 100
        ? 0
        : Math.abs(c) >= 10
          ? 1
          : 2);
    return { value: c.toFixed(h), unit: f, muted: Qe(t.domain) };
  }
  return { value: me(t), unit: "", muted: Qe(t.domain) };
}
function Et(t) {
  return `${t}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
function ln(t) {
  return t.map((s, a) => ({ ...s, order: a + 1 }));
}
function Ht(t) {
  const s = Ne(t);
  return `${t.name} · ${t.entityId}${s ? ` · ${s}` : ""}`;
}
function cn({ entity: t, widget: s }) {
  const a = Jt(t, s),
    i = { "--widget-accent": Ee(t, s.color) };
  return e.jsxs("article", {
    className: "home-dashboard-card dashboard-metric-card",
    style: i,
    children: [
      e.jsx("header", {
        children: e.jsx("small", { title: a.muted, children: a.muted }),
      }),
      e.jsxs("strong", {
        title: `${a.value}${a.unit ? ` ${a.unit}` : ""}`,
        children: [a.value, a.unit && e.jsx("em", { children: a.unit })],
      }),
      e.jsx("p", { title: s.title, children: s.title }),
    ],
  });
}
function dn({ item: t, entity: s }) {
  const a = Jt(s, t),
    i = t.label || (s == null ? void 0 : s.name) || t.entityId;
  return e.jsxs("div", {
    className: "dashboard-group-row",
    children: [
      e.jsx("span", { title: i, children: i }),
      e.jsxs("strong", {
        title: `${a.value}${a.unit ? ` ${a.unit}` : ""}`,
        children: [a.value, a.unit && e.jsx("em", { children: a.unit })],
      }),
    ],
  });
}
function un({ entities: t, widget: s }) {
  var r;
  const a = t[((r = s.items[0]) == null ? void 0 : r.entityId) ?? ""],
    i = { "--widget-accent": Ee(a, s.color) };
  return e.jsxs("article", {
    className: "home-dashboard-card dashboard-group-card",
    style: i,
    children: [
      e.jsx("header", {
        children: e.jsxs("small", { children: [s.items.length, " 项"] }),
      }),
      e.jsx("h3", { title: s.title, children: s.title }),
      e.jsx("div", {
        children: s.items
          .slice(0, 3)
          .map((c) =>
            e.jsx(dn, { item: c, entity: t[c.entityId] }, c.entityId),
          ),
      }),
    ],
  });
}
function hn({
  candidateEntities: t,
  entities: s,
  selectedEntity: a,
  saving: i,
  widgets: r,
  onAddGroup: c,
  onAddMetric: f,
  onClose: h,
  onRemove: v,
  onRenameWidget: k,
  onToggleVisible: j,
}) {
  const [z, P] = l.useState(""),
    [N, O] = l.useState(""),
    [$, x] = l.useState("自定义数据"),
    [C, te] = l.useState(["", "", ""]),
    [T, D] = l.useState({}),
    E = l.useMemo(() => new Set(r.flatMap(st)), [r]),
    G = Ut(a),
    ee = a ? E.has(a.entityId) : !1,
    I = t.find((p) => p.entityId === z) ?? t[0],
    se = I ? E.has(I.entityId) : !1,
    u = [...new Set(C.filter(Boolean))];
  (l.useEffect(() => {
    !z && t[0] && P(t[0].entityId);
  }, [t, z]),
    l.useEffect(() => {
      O((I == null ? void 0 : I.name) ?? "");
    }, [I == null ? void 0 : I.entityId, I == null ? void 0 : I.name]),
    l.useEffect(() => {
      D((p) => {
        const g = {};
        for (const M of r) g[M.id] = p[M.id] ?? M.title;
        return g;
      });
    }, [r]));
  function b(p) {
    const g = (T[p.id] ?? p.title).trim();
    (g && g !== p.title && k(p.id, g),
      g || D((M) => ({ ...M, [p.id]: p.title })));
  }
  return e.jsxs(e.Fragment, {
    children: [
      e.jsx("div", {
        className: "home-dashboard-manager-backdrop",
        "aria-hidden": "true",
        onClick: h,
      }),
      e.jsxs("aside", {
        className: "home-dashboard-manager",
        role: "dialog",
        "aria-modal": "true",
        "aria-label": "主屏数据配置",
        children: [
          e.jsxs("header", {
            children: [
              e.jsxs("div", {
                children: [
                  e.jsx("small", { children: "主屏数据" }),
                  e.jsx("strong", { children: "配置展示卡片" }),
                ],
              }),
              e.jsx("button", {
                type: "button",
                onClick: h,
                "aria-label": "关闭主屏数据配置",
                children: e.jsx(ve, { size: 18 }),
              }),
            ],
          }),
          G &&
            a &&
            e.jsxs("section", {
              className: "dashboard-manager-section quick-pin-section",
              children: [
                e.jsxs("div", {
                  children: [
                    e.jsx("span", {
                      className: `domain-icon domain-${a.domain}`,
                      children: e.jsx(nt, { domain: a.domain, size: 16 }),
                    }),
                    e.jsxs("p", {
                      children: [
                        e.jsx("strong", { children: a.name }),
                        e.jsx("small", { children: a.entityId }),
                      ],
                    }),
                  ],
                }),
                e.jsxs("button", {
                  type: "button",
                  disabled: i || ee,
                  onClick: () => f(a),
                  children: [
                    e.jsx(za, { size: 14 }),
                    ee ? "已固定" : "固定到主屏",
                  ],
                }),
              ],
            }),
          e.jsxs("section", {
            className: "dashboard-manager-section",
            children: [
              e.jsx("h3", { children: "添加数值卡片" }),
              e.jsxs("label", {
                children: [
                  e.jsx("span", { children: "选择实体" }),
                  e.jsx(we, {
                    value: z,
                    onChange: (p) => P(p.target.value),
                    children: t.map((p) =>
                      e.jsx(
                        "option",
                        { value: p.entityId, children: Ht(p) },
                        p.entityId,
                      ),
                    ),
                  }),
                ],
              }),
              e.jsxs("label", {
                children: [
                  e.jsx("span", { children: "卡片标题" }),
                  e.jsx("input", {
                    type: "text",
                    value: N,
                    placeholder: (I == null ? void 0 : I.name) ?? "自定义标题",
                    onChange: (p) => O(p.target.value),
                  }),
                ],
              }),
              e.jsxs("button", {
                type: "button",
                disabled: i || !I || se,
                onClick: () => I && f(I, N),
                children: [
                  e.jsx(Ct, { size: 14 }),
                  se ? "已添加到主屏" : "添加数值卡片",
                ],
              }),
            ],
          }),
          e.jsxs("section", {
            className: "dashboard-manager-section",
            children: [
              e.jsx("h3", { children: "添加分组卡片" }),
              e.jsxs("label", {
                children: [
                  e.jsx("span", { children: "分组名称" }),
                  e.jsx("input", {
                    type: "text",
                    value: $,
                    onChange: (p) => x(p.target.value),
                  }),
                ],
              }),
              e.jsx("div", {
                className: "dashboard-group-picker",
                children: C.map((p, g) =>
                  e.jsxs(
                    "label",
                    {
                      children: [
                        e.jsxs("span", { children: ["数据 ", g + 1] }),
                        e.jsxs(we, {
                          value: p,
                          onChange: (M) =>
                            te((S) =>
                              S.map((d, o) => (o === g ? M.target.value : d)),
                            ),
                          children: [
                            e.jsx("option", { value: "", children: "不选择" }),
                            t.map((M) =>
                              e.jsx(
                                "option",
                                { value: M.entityId, children: Ht(M) },
                                M.entityId,
                              ),
                            ),
                          ],
                        }),
                      ],
                    },
                    g,
                  ),
                ),
              }),
              e.jsxs("button", {
                type: "button",
                disabled: i || u.length < 2,
                onClick: () => c($, u),
                children: [e.jsx(Ct, { size: 14 }), "添加分组卡片"],
              }),
            ],
          }),
          e.jsxs("section", {
            className: "dashboard-manager-section dashboard-widget-list",
            children: [
              e.jsx("h3", { children: "已配置" }),
              r.length
                ? r.map((p) => {
                    const M = st(p)
                      .map((S) => {
                        var d;
                        return ((d = s[S]) == null ? void 0 : d.name) ?? S;
                      })
                      .join(" / ");
                    return e.jsxs(
                      "article",
                      {
                        children: [
                          e.jsxs("div", {
                            children: [
                              e.jsxs("label", {
                                className: "dashboard-widget-title-field",
                                children: [
                                  e.jsx("span", { children: "标题" }),
                                  e.jsx("input", {
                                    "aria-label": "卡片标题",
                                    value: T[p.id] ?? p.title,
                                    onBlur: () => b(p),
                                    onChange: (S) =>
                                      D((d) => ({
                                        ...d,
                                        [p.id]: S.target.value,
                                      })),
                                    onKeyDown: (S) => {
                                      (S.key === "Enter" &&
                                        S.currentTarget.blur(),
                                        S.key === "Escape" &&
                                          (D((d) => ({
                                            ...d,
                                            [p.id]: p.title,
                                          })),
                                          S.currentTarget.blur()));
                                    },
                                  }),
                                ],
                              }),
                              e.jsxs("small", {
                                children: [
                                  p.type === "group" ? "分组" : "数值",
                                  " · ",
                                  M,
                                ],
                              }),
                            ],
                          }),
                          e.jsx("button", {
                            type: "button",
                            disabled: i,
                            onClick: () => j(p.id),
                            "aria-label": p.visible ? "隐藏卡片" : "显示卡片",
                            children: p.visible
                              ? e.jsx(Rs, { size: 14 })
                              : e.jsx(Es, { size: 14 }),
                          }),
                          e.jsx("button", {
                            type: "button",
                            disabled: i,
                            onClick: () => v(p.id),
                            "aria-label": "删除卡片",
                            children: e.jsx(Hs, { size: 14 }),
                          }),
                        ],
                      },
                      p.id,
                    );
                  })
                : e.jsx("p", {
                    className: "dashboard-manager-empty",
                    children:
                      "还没有主屏数据卡片。先选择传感器或状态实体添加。",
                  }),
            ],
          }),
        ],
      }),
    ],
  });
}
function mn({
  entities: t,
  managerOpen: s,
  selectedEntity: a,
  widgets: i,
  onManagerOpenChange: r,
  onSaveWidgets: c,
}) {
  const f = l.useRef(null),
    h = l.useRef(),
    v = l.useRef(),
    [k, j] = l.useState(!1),
    [z, P] = l.useState(),
    [N, O] = l.useState(),
    [$, x] = l.useState({});
  l.useEffect(
    () => () => {
      v.current !== void 0 && cancelAnimationFrame(v.current);
    },
    [],
  );
  const C = l.useMemo(() => [...i].sort((d, o) => d.order - o.order), [i]),
    te = C.filter((d) => d.visible),
    T = l.useMemo(
      () =>
        Object.values(t)
          .filter(Ut)
          .sort((d, o) => d.name.localeCompare(o.name, "zh-Hans")),
      [t],
    );
  async function D(d) {
    (j(!0), P(void 0));
    try {
      await c(ln(d));
    } catch (o) {
      P(o instanceof Error ? o.message : "主屏数据保存失败");
    } finally {
      j(!1);
    }
  }
  function E(d, o) {
    if (C.some((y) => st(y).includes(d.entityId))) return;
    const w = {
      id: Et("dashboard-metric"),
      type: "metric",
      title: (o == null ? void 0 : o.trim()) || d.name,
      entityId: d.entityId,
      unit: Ne(d) || void 0,
      color: Ee(d),
      order: C.length + 1,
      position: Ze(C.length),
      visible: !0,
    };
    D([...C, w]);
  }
  function G(d, o) {
    const w = o
      .map((W) => t[W])
      .filter((W) => !!W)
      .map((W) => ({
        entityId: W.entityId,
        label: W.name,
        unit: Ne(W) || void 0,
      }));
    if (w.length < 2) return;
    const y = {
      id: Et("dashboard-group"),
      type: "group",
      title: d.trim() || "自定义数据",
      items: w,
      color: Ee(t[w[0].entityId]),
      order: C.length + 1,
      position: Ze(C.length),
      visible: !0,
    };
    D([...C, y]);
  }
  function ee(d) {
    D(C.filter((o) => o.id !== d));
  }
  function I(d) {
    D(C.map((o) => (o.id === d ? { ...o, visible: !o.visible } : o)));
  }
  function se(d, o) {
    const w = o.trim();
    w && D(C.map((y) => (y.id === d ? { ...y, title: w } : y)));
  }
  function u(d, o) {
    return $[d.id] ?? d.position ?? Ze(o);
  }
  function b(d, o) {
    const w = f.current;
    if (!w) return o.position;
    const y = w.getBoundingClientRect(),
      W = Math.max(0, y.width - o.width),
      $e = Math.max(0, y.height - o.height),
      ne = Rt(d.clientX - y.left - o.offsetX, 0, W),
      L = Rt(d.clientY - y.top - o.offsetY, 0, $e);
    return {
      x: y.width ? (ne / y.width) * 100 : o.position.x,
      y: y.height ? (L / y.height) * 100 : o.position.y,
    };
  }
  function p(d, o, w) {
    if (d.pointerType === "mouse" && d.button !== 0) return;
    const y = d.currentTarget.getBoundingClientRect();
    ((h.current = {
      height: y.height,
      moved: !1,
      offsetX: d.clientX - y.left,
      offsetY: d.clientY - y.top,
      pointerId: d.pointerId,
      position: u(o, w),
      startX: d.clientX,
      startY: d.clientY,
      widgetId: o.id,
      width: y.width,
    }),
      O(o.id),
      d.currentTarget.setPointerCapture(d.pointerId),
      d.preventDefault());
  }
  function g(d) {
    const o = h.current;
    if (!o || o.pointerId !== d.pointerId) return;
    (Math.abs(d.clientX - o.startX) > 2 ||
      Math.abs(d.clientY - o.startY) > 2) &&
      (o.moved = !0);
    const w = b(d, o);
    ((o.position = w),
      v.current === void 0 &&
        (v.current = requestAnimationFrame(() => {
          v.current = void 0;
          const y = h.current;
          y && x((W) => ({ ...W, [y.widgetId]: y.position }));
        })));
  }
  function M(d) {
    const o = h.current;
    !o ||
      o.pointerId !== d.pointerId ||
      (d.currentTarget.releasePointerCapture(d.pointerId),
      (h.current = void 0),
      v.current !== void 0 &&
        (cancelAnimationFrame(v.current), (v.current = void 0)),
      O(void 0),
      o.moved &&
        D(
          C.map((w) =>
            w.id === o.widgetId ? { ...w, position: o.position } : w,
          ),
        ).finally(() =>
          x((w) => {
            const y = { ...w };
            return (delete y[o.widgetId], y);
          }),
        ));
  }
  function S(d) {
    const o = h.current;
    !o ||
      o.pointerId !== d.pointerId ||
      ((h.current = void 0),
      v.current !== void 0 &&
        (cancelAnimationFrame(v.current), (v.current = void 0)),
      O(void 0),
      x((w) => {
        const y = { ...w };
        return (delete y[o.widgetId], y);
      }));
  }
  return e.jsxs(e.Fragment, {
    children: [
      te.length > 0 &&
        e.jsxs("section", {
          ref: f,
          className: "home-dashboard-widgets",
          "aria-label": "主屏自定义数据",
          children: [
            te.map((d, o) => {
              const w = u(d, o),
                y = { left: `${w.x}%`, top: `${w.y}%`, zIndex: 12 + o };
              return e.jsx(
                "div",
                {
                  className: `dashboard-widget-shell widget-${d.type} ${N === d.id ? "dragging" : ""}`,
                  style: y,
                  title: "拖动调整位置",
                  onPointerDown: (W) => p(W, d, o),
                  onPointerMove: g,
                  onPointerUp: M,
                  onPointerCancel: S,
                  children:
                    d.type === "metric"
                      ? e.jsx(cn, { widget: d, entity: t[d.entityId] })
                      : e.jsx(un, { widget: d, entities: t }),
                },
                d.id,
              );
            }),
            z &&
              e.jsx("p", {
                className: "home-dashboard-error",
                role: "status",
                children: z,
              }),
          ],
        }),
      s &&
        e.jsx(hn, {
          candidateEntities: T,
          entities: t,
          selectedEntity: a,
          saving: k,
          widgets: C,
          onAddGroup: G,
          onAddMetric: E,
          onClose: () => r(!1),
          onRemove: ee,
          onRenameWidget: se,
          onToggleVisible: I,
        }),
    ],
  });
}
const pn = ["environment", "lighting", "shade", "security"],
  Ge = (t, s) => `${t}:${s}`;
function Tt(t, s) {
  return Bt(t, s).length;
}
function fn(t, s) {
  const [a, i] = s.split(":"),
    r = t.floors.find((f) => f.id === a),
    c = r == null ? void 0 : r.rooms.find((f) => f.id === i);
  return r && c ? { floor: r, room: c } : void 0;
}
function xn({
  open: t,
  project: s,
  entities: a,
  areas: i,
  onClose: r,
  onSave: c,
}) {
  const [f, h] = l.useState(s),
    [v, k] = l.useState(() => {
      var u, b, p;
      return Ge(
        ((u = s.floors[0]) == null ? void 0 : u.id) ?? "",
        ((p = (b = s.floors[0]) == null ? void 0 : b.rooms[0]) == null
          ? void 0
          : p.id) ?? "",
      );
    }),
    [j, z] = l.useState("environment"),
    [P, N] = l.useState(!1),
    [O, $] = l.useState();
  l.useEffect(() => {
    var p;
    if (!t) return;
    h(s);
    const u =
        (p = s.floors.find((g) => g.rooms.length)) == null
          ? void 0
          : p.rooms[0],
      b = s.floors.find((g) => g.rooms.includes(u));
    (b && u && k(Ge(b.id, u.id)), z("environment"), $(void 0));
  }, [t, s]);
  const x =
      fn(f, v) ??
      f.floors.flatMap((u) => u.rooms.map((b) => ({ floor: u, room: b })))[0],
    C = l.useMemo(() => Object.values(a), [a]),
    te = Ts.filter((u) => u.capability === j),
    T =
      x != null && x.room.haAreaId
        ? i.find((u) => u.id === x.room.haAreaId)
        : void 0;
  if (!t) return null;
  function D(u) {
    x &&
      h((b) => ({
        ...b,
        updatedAt: new Date().toISOString(),
        floors: b.floors.map((p) =>
          p.id === x.floor.id
            ? { ...p, rooms: p.rooms.map((g) => (g.id === x.room.id ? u : g)) }
            : p,
        ),
      }));
  }
  function E(u) {
    x && D({ ...x.room, haAreaId: u || void 0 });
  }
  function G(u, b) {
    x && D(Bs(x.room, j, u, b || void 0));
  }
  function ee(u, b, p) {
    if (!x) return;
    const g = zt(x.room, j, u),
      M = p ? [...new Set([...g, b])] : g.filter((S) => S !== b);
    D(Vs(x.room, j, u, M));
  }
  function I(u) {
    x && D(Ws(x.room, a, u));
  }
  async function se() {
    (N(!0), $(void 0));
    try {
      (await c(f), $("绑定配置已保存"));
    } catch (u) {
      $(u instanceof Error ? u.message : "保存失败");
    } finally {
      N(!1);
    }
  }
  return e.jsxs(e.Fragment, {
    children: [
      e.jsx("button", {
        className: "settings-backdrop binding-backdrop",
        onClick: r,
        "aria-label": "关闭实体绑定",
      }),
      e.jsxs("aside", {
        className: "room-binding-panel",
        role: "dialog",
        "aria-modal": "true",
        "aria-labelledby": "room-binding-title",
        children: [
          e.jsxs("div", {
            className: "binding-heading",
            children: [
              e.jsxs("div", {
                children: [
                  e.jsx("small", { children: "Home Assistant" }),
                  e.jsx("h2", {
                    id: "room-binding-title",
                    children: "实体绑定",
                  }),
                ],
              }),
              e.jsx("button", {
                className: "panel-close",
                onClick: r,
                "aria-label": "关闭实体绑定",
                children: e.jsx(ve, { size: 18 }),
              }),
            ],
          }),
          e.jsxs("div", {
            className: "binding-layout",
            children: [
              e.jsx("nav", {
                className: "binding-room-list",
                "aria-label": "选择房间",
                children: f.floors.map((u) =>
                  e.jsxs(
                    "section",
                    {
                      children: [
                        e.jsx("h3", { children: u.name }),
                        u.rooms.map((b) => {
                          var M;
                          const p = Ge(u.id, b.id),
                            g = Tt(b);
                          return e.jsxs(
                            "button",
                            {
                              type: "button",
                              className: p === v ? "active" : "",
                              onClick: () => k(p),
                              "aria-pressed": p === v,
                              children: [
                                e.jsxs("span", {
                                  children: [
                                    e.jsx("strong", { children: b.name }),
                                    e.jsx("small", {
                                      children: b.haAreaId
                                        ? (((M = i.find(
                                            (S) => S.id === b.haAreaId,
                                          )) == null
                                            ? void 0
                                            : M.name) ?? b.haAreaId)
                                        : "未绑定 Area",
                                    }),
                                  ],
                                }),
                                e.jsx("em", { children: g }),
                              ],
                            },
                            b.id,
                          );
                        }),
                      ],
                    },
                    u.id,
                  ),
                ),
              }),
              e.jsx("section", {
                className: "binding-editor",
                children:
                  x &&
                  e.jsxs(e.Fragment, {
                    children: [
                      e.jsxs("div", {
                        className: "binding-room-heading",
                        children: [
                          e.jsx("span", { children: e.jsx(Vt, { size: 18 }) }),
                          e.jsxs("div", {
                            children: [
                              e.jsx("small", { children: x.floor.name }),
                              e.jsx("h3", { children: x.room.name }),
                            ],
                          }),
                        ],
                      }),
                      e.jsxs("label", {
                        className: "binding-field",
                        children: [
                          e.jsx("span", { children: "HA Area" }),
                          e.jsxs(we, {
                            value: x.room.haAreaId ?? "",
                            onChange: (u) => E(u.target.value),
                            "aria-label": "选择 Home Assistant 区域",
                            children: [
                              e.jsx("option", {
                                value: "",
                                children: "未绑定 Area",
                              }),
                              i.map((u) =>
                                e.jsx(
                                  "option",
                                  { value: u.id, children: u.name },
                                  u.id,
                                ),
                              ),
                            ],
                          }),
                        ],
                      }),
                      e.jsx("div", {
                        className: "binding-capability-tabs",
                        role: "tablist",
                        "aria-label": "绑定能力类型",
                        children: pn.map((u) =>
                          e.jsxs(
                            "button",
                            {
                              type: "button",
                              className: j === u ? "active" : "",
                              onClick: () => z(u),
                              "aria-pressed": j === u,
                              children: [
                                _t[u],
                                e.jsx("small", { children: Tt(x.room, u) }),
                              ],
                            },
                            u,
                          ),
                        ),
                      }),
                      e.jsxs("div", {
                        className: "binding-toolbar",
                        children: [
                          e.jsxs("div", {
                            children: [
                              e.jsxs("strong", { children: [_t[j], "绑定"] }),
                              e.jsx("small", {
                                children: T
                                  ? `优先推荐 ${T.name} 的实体`
                                  : "先选择 HA Area 可提升自动推荐准确度",
                              }),
                            ],
                          }),
                          e.jsxs("button", {
                            type: "button",
                            onClick: () => I(j),
                            children: [e.jsx(et, { size: 16 }), "自动推荐"],
                          }),
                        ],
                      }),
                      e.jsx("div", {
                        className: "binding-role-list",
                        children: te.map((u) => {
                          var d;
                          const b = zt(x.room, j, u.role),
                            p = b[0] ?? "",
                            g =
                              j === "lighting" &&
                              (u.role === "main" || u.role === "ambient"),
                            M = Ps(C, u, x.room.haAreaId, x.room.name),
                            S = Ls(C, u, x.room.haAreaId, x.room.name);
                          return g
                            ? e.jsxs(
                                "div",
                                {
                                  className: "binding-role-row multi",
                                  children: [
                                    e.jsxs("span", {
                                      children: [
                                        e.jsx("strong", { children: u.label }),
                                        e.jsx("small", {
                                          children: b.length
                                            ? `已选 ${b.length} 个`
                                            : M
                                              ? `推荐：${M.name}`
                                              : u.description,
                                        }),
                                      ],
                                    }),
                                    e.jsx("div", {
                                      className: "binding-role-checks",
                                      "aria-label": `${u.label}实体`,
                                      children: S.map((o) => {
                                        const w = b.includes(o.entityId);
                                        return e.jsxs(
                                          "label",
                                          {
                                            className: w ? "checked" : "",
                                            children: [
                                              e.jsx("input", {
                                                type: "checkbox",
                                                checked: w,
                                                onChange: (y) =>
                                                  ee(
                                                    u.role,
                                                    o.entityId,
                                                    y.target.checked,
                                                  ),
                                              }),
                                              e.jsxs("span", {
                                                children: [
                                                  e.jsxs("strong", {
                                                    children: [
                                                      o.areaId ===
                                                      x.room.haAreaId
                                                        ? "★ "
                                                        : "",
                                                      o.name,
                                                    ],
                                                  }),
                                                  e.jsxs("small", {
                                                    children: [
                                                      o.entityId,
                                                      " · ",
                                                      me(o),
                                                    ],
                                                  }),
                                                ],
                                              }),
                                            ],
                                          },
                                          o.entityId,
                                        );
                                      }),
                                    }),
                                  ],
                                },
                                u.role,
                              )
                            : e.jsxs(
                                "label",
                                {
                                  className: "binding-role-row",
                                  children: [
                                    e.jsxs("span", {
                                      children: [
                                        e.jsx("strong", { children: u.label }),
                                        e.jsx("small", {
                                          children: p
                                            ? (((d = a[p]) == null
                                                ? void 0
                                                : d.name) ?? p)
                                            : M
                                              ? `推荐：${M.name}`
                                              : u.description,
                                        }),
                                      ],
                                    }),
                                    e.jsxs(we, {
                                      value: p,
                                      onChange: (o) =>
                                        G(u.role, o.target.value),
                                      "aria-label": `${u.label}实体`,
                                      children: [
                                        e.jsx("option", {
                                          value: "",
                                          children: "未配置",
                                        }),
                                        S.map((o) =>
                                          e.jsxs(
                                            "option",
                                            {
                                              value: o.entityId,
                                              children: [
                                                o.areaId === x.room.haAreaId
                                                  ? "★ "
                                                  : "",
                                                o.name,
                                                " · ",
                                                o.entityId,
                                                " · ",
                                                me(o),
                                              ],
                                            },
                                            o.entityId,
                                          ),
                                        ),
                                      ],
                                    }),
                                  ],
                                },
                                u.role,
                              );
                        }),
                      }),
                    ],
                  }),
              }),
            ],
          }),
          e.jsxs("div", {
            className: "binding-footer",
            children: [
              O && e.jsx("span", { role: "status", children: O }),
              e.jsxs("button", {
                type: "button",
                onClick: () => I(),
                children: [e.jsx(et, { size: 16 }), "全类推荐"],
              }),
              e.jsxs("button", {
                type: "button",
                className: "binding-save",
                onClick: () => void se(),
                disabled: P,
                children: [e.jsx(Os, { size: 16 }), P ? "保存中" : "保存配置"],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}
const es = "ha3d.home.sceneQuality",
  ts = "ha3d.home.sceneVisualStyle",
  ss = "ha3d.home.weatherForecastVisible",
  yn = "ha3d.home.overviewDataSettings",
  de = [
    { key: "high", label: "高清", short: "高" },
    { key: "balanced", label: "均衡", short: "均" },
    { key: "smooth", label: "流畅", short: "流" },
    { key: "eco", label: "省电", short: "省" },
  ],
  vn = new Set(de.map((t) => t.key)),
  ue = [
    { key: "glass", label: "玻璃", short: "璃" },
    { key: "cartoon", label: "卡通", short: "漫" },
    { key: "cream", label: "奶油", short: "奶" },
  ],
  gn = new Set(ue.map((t) => t.key)),
  Pt = { clear: Kt, fog: ba, rain: ja, snow: ka, storm: va, wind: qs };
function jn(t) {
  return vn.has(t);
}
function wn(t) {
  return gn.has(t);
}
function kn() {
  if (typeof window > "u") return "high";
  try {
    const t = window.localStorage.getItem(es);
    if (jn(t)) return t;
  } catch {
    return window.innerWidth <= 1180 ? "balanced" : "high";
  }
  return window.innerWidth <= 1180 ? "balanced" : "high";
}
function In() {
  if (typeof window > "u") return "cartoon";
  try {
    const t = window.localStorage.getItem(ts);
    if (wn(t)) return t;
  } catch {
    return "cartoon";
  }
  return "cartoon";
}
function Sn() {
  if (typeof window > "u") return !0;
  try {
    return window.localStorage.getItem(ss) !== "false";
  } catch {
    return !0;
  }
}
function Nn() {
  const [t, s] = l.useState(() =>
    typeof window > "u"
      ? { width: 1440, height: 900 }
      : { width: window.innerWidth, height: window.innerHeight },
  );
  return (
    l.useEffect(() => {
      let a = 0;
      const i = () => {
        a ||
          (a = requestAnimationFrame(() => {
            ((a = 0),
              s((r) => {
                const c = {
                  width: window.innerWidth,
                  height: window.innerHeight,
                };
                return r.width === c.width && r.height === c.height ? r : c;
              }));
          }));
      };
      return (
        window.addEventListener("resize", i),
        () => {
          (window.removeEventListener("resize", i),
            a && cancelAnimationFrame(a));
        }
      );
    }, []),
    t
  );
}
function Lt(t = new Date()) {
  const s = t.getHours();
  return s >= 7 && s < 18 ? "day" : "night";
}
function as({
  error: t,
  lastSceneId: s,
  runningSceneId: a,
  scenes: i,
  onRunScene: r,
}) {
  return e.jsxs("section", {
    className: "ha-scene-panel",
    "aria-label": "Home Assistant 场景",
    children: [
      e.jsxs("div", {
        className: "ha-scene-list",
        children: [
          i.map((c) => {
            const f = a === c.entityId,
              h = s === c.entityId;
            return e.jsxs(
              "button",
              {
                type: "button",
                className: `${f ? "running" : ""} ${h ? "recent" : ""}`.trim(),
                disabled: !!a,
                onClick: () => r(c.entityId),
                "aria-label": `执行场景 ${c.name}`,
                title: `执行 ${c.name}`,
                children: [
                  e.jsx("span", { className: "ha-scene-icon" }),
                  e.jsxs("span", {
                    className: "ha-scene-copy",
                    children: [
                      e.jsx("strong", { children: c.name }),
                      (f || h) &&
                        e.jsx("small", { children: f ? "执行中" : "刚刚执行" }),
                    ],
                  }),
                  e.jsx("span", {
                    className: "ha-scene-run",
                    children: f
                      ? e.jsx(la, { className: "spin-icon", size: 14 })
                      : e.jsx(aa, { size: 14 }),
                  }),
                ],
              },
              c.entityId,
            );
          }),
          !i.length &&
            e.jsx("div", {
              className: "ha-scene-empty",
              children: "在 Home Assistant 中创建 scene.* 后会显示在这里。",
            }),
        ],
      }),
      t &&
        e.jsx("p", {
          className: "ha-scene-error",
          role: "status",
          children: t,
        }),
    ],
  });
}
function ns({ cameraRoom: t, entities: s }) {
  const a = t.cameraEntityIds
      .map((r) => s[r])
      .filter((r) => !!(r && r.domain === "camera")),
    i = a.length > 1;
  return e.jsxs("div", {
    className: "room-camera-stack",
    children: [
      a.map((r) =>
        e.jsxs(
          "article",
          {
            className: `room-camera-item ${i ? "with-label" : "single-camera"}`,
            "aria-label": r.name,
            children: [
              i &&
                e.jsxs("header", {
                  children: [
                    e.jsx("span", {
                      className: "domain-icon domain-camera",
                      children: e.jsx(nt, { domain: "camera", size: 16 }),
                    }),
                    e.jsxs("div", {
                      children: [
                        e.jsx("strong", { children: r.name }),
                        e.jsx("small", { children: me(r) }),
                      ],
                    }),
                  ],
                }),
              e.jsx(ot, { compact: !0, entity: r }),
            ],
          },
          r.entityId,
        ),
      ),
      !a.length &&
        e.jsxs("div", {
          className: "room-camera-empty",
          children: [
            e.jsx(Qt, { size: 18 }),
            e.jsx("strong", { children: "该区域暂无摄像头" }),
            e.jsx("span", {
              children: "在实体绑定中把 camera.* 绑定到安防后会显示在这里。",
            }),
          ],
        }),
    ],
  });
}
const $n =
  /phone|iphone|android|mobile|pixel|xiaomi|redmi|huawei|honor|oppo|vivo|oneplus|samsung|galaxy|手机|移动|电话/i;
function he(t, s) {
  const a = t.attributes[s];
  return typeof a == "string" ? a : "";
}
function Ot(t) {
  return t
    .toLowerCase()
    .replace(/iphone|android|mobile|phone|pixel|galaxy|手机/g, "")
    .replace(/[\s._-]+/g, "");
}
function is(t) {
  return t.state.toLowerCase() === "home";
}
function Mn(t) {
  if (t.domain !== "device_tracker" || !is(t)) return !1;
  const s = he(t, "device_class").toLowerCase(),
    a = he(t, "source_type").toLowerCase(),
    i = `${t.entityId} ${t.name} ${he(t, "friendly_name")}`;
  return s === "phone" || a === "gps" || $n.test(i);
}
const at = [
    {
      key: "temperature",
      label: "温度",
      icon: Xt,
      description: "默认按房间绑定、已放置设备和 HA Area 自动汇总。",
      placeholder: "未选择时使用默认温度范围",
    },
    {
      key: "humidity",
      label: "湿度",
      icon: it,
      description: "默认按房间环境数据自动汇总。",
      placeholder: "未选择时使用默认湿度范围",
    },
    {
      key: "air",
      label: "空气",
      icon: rt,
      description: "默认用湿度、PM2.5、CO₂、VOC 综合判断优/良/中。",
      placeholder: "未选择时使用默认空气质量",
    },
  ],
  He = { air: [], humidity: [], temperature: [] };
function rs(t) {
  return `${yn}.${t}`;
}
function Cn(t) {
  if (!t || typeof t != "object") return { ...He };
  const s = t;
  return {
    air: Array.isArray(s.air)
      ? [...new Set(s.air.filter((a) => typeof a == "string"))]
      : [],
    humidity: Array.isArray(s.humidity)
      ? [...new Set(s.humidity.filter((a) => typeof a == "string"))]
      : [],
    temperature: Array.isArray(s.temperature)
      ? [...new Set(s.temperature.filter((a) => typeof a == "string"))]
      : [],
  };
}
function Wt(t) {
  if (typeof window > "u") return { ...He };
  try {
    return Cn(JSON.parse(window.localStorage.getItem(rs(t)) ?? "null"));
  } catch {
    return { ...He };
  }
}
function _n(t, s) {
  if (!(typeof window > "u"))
    try {
      window.localStorage.setItem(rs(t), JSON.stringify(s));
    } catch {}
}
function je(t) {
  if (typeof t == "number" && Number.isFinite(t)) return t;
  if (typeof t == "string") {
    const s = Number.parseFloat(t);
    return Number.isFinite(s) ? s : void 0;
  }
}
function be(t) {
  return he(t, "unit_of_measurement").trim();
}
function ct(t) {
  return he(t, "device_class").toLowerCase().trim();
}
function dt(t) {
  return `${t.entityId} ${t.name} ${he(t, "friendly_name")}`.toLowerCase();
}
function zn(t) {
  if (t.domain === "climate")
    return je(t.attributes.current_temperature) ?? je(t.attributes.temperature);
  const s = dt(t),
    a = be(t).toLowerCase();
  return ct(t) === "temperature" ||
    a === "°c" ||
    a === "°f" ||
    s.includes("temperature") ||
    s.includes("温度")
    ? je(t.state)
    : void 0;
}
function Dn(t) {
  const s = dt(t),
    a = be(t);
  return ct(t) === "humidity" ||
    (a === "%" && (s.includes("humidity") || s.includes("湿度")))
    ? je(t.state)
    : void 0;
}
function An(t) {
  const s = dt(t),
    a = ct(t);
  if (
    a === "pm25" ||
    a === "carbon_dioxide" ||
    a === "volatile_organic_compounds" ||
    /pm2\.5|pm25|co2|二氧化碳|voc|tvoc/.test(s)
  )
    return je(t.state);
}
function os(t, s) {
  return t === "temperature" ? zn(s) : t === "humidity" ? Dn(s) : An(s);
}
function Ue(t, s) {
  return os(t, s) !== void 0;
}
function Ye(t, s, a) {
  return t === "temperature"
    ? `${s.toFixed(1)}°`
    : t === "humidity"
      ? `${s.toFixed(0)}%`
      : `${s.toFixed(Number.isInteger(s) || Math.abs(s) >= 100 ? 0 : 1)}${a ? ` ${a}` : ""}`;
}
function Je(t, s, a, i) {
  if (!s.length) return i;
  const c = s
    .map((h) => a[h])
    .filter((h) => !!h)
    .map((h) => ({ entity: h, value: os(t, h) }))
    .filter((h) => h.value !== void 0);
  if (!c.length) return "--";
  if (c.length === 1 || s.length === 1) {
    const [{ entity: h, value: v }] = c;
    return Ye(t, v, t === "air" ? be(h) : void 0);
  }
  const f =
    t === "air" && c.every((h) => be(h.entity) === be(c[0].entity))
      ? be(c[0].entity)
      : void 0;
  return `${Ye(t, Math.min(...c.map((h) => h.value)))} - ${Ye(t, Math.max(...c.map((h) => h.value)), f)}`;
}
function Fn(t) {
  const s = be(t);
  return `${t.name} · ${t.entityId}${s ? ` · ${s}` : ""}`;
}
function Rn({
  candidateEntities: t,
  settings: s,
  onChange: a,
  onClose: i,
  onOpenDashboardManager: r,
}) {
  const c = at.filter((h) => s[h.key].length).length,
    f = (h, v) => {
      const k = s[h],
        j = k.includes(v) ? k.filter((z) => z !== v) : [...k, v];
      a({ ...s, [h]: j });
    };
  return e.jsxs(e.Fragment, {
    children: [
      e.jsx("div", {
        className: "home-dashboard-manager-backdrop",
        "aria-hidden": "true",
        onClick: i,
      }),
      e.jsxs("aside", {
        className: "home-dashboard-manager home-overview-data-manager",
        role: "dialog",
        "aria-modal": "true",
        "aria-label": "顶部概览数据设置",
        children: [
          e.jsxs("header", {
            children: [
              e.jsxs("div", {
                children: [
                  e.jsx("small", { children: "顶部概览" }),
                  e.jsx("strong", { children: "选择展示数据" }),
                ],
              }),
              e.jsx("button", {
                type: "button",
                onClick: i,
                "aria-label": "关闭顶部概览数据设置",
                children: e.jsx(ve, { size: 18 }),
              }),
            ],
          }),
          e.jsxs("section", {
            className: "dashboard-manager-section overview-data-mode",
            children: [
              e.jsxs("div", {
                children: [
                  e.jsx("strong", {
                    children: c ? `已自定义 ${c} 项` : "使用默认规则",
                  }),
                  e.jsx("span", {
                    children:
                      "不选择实体时保留当前自动汇总；选择 1 个实体显示单值，选择多个实体显示范围。",
                  }),
                ],
              }),
              e.jsx("button", {
                type: "button",
                onClick: () => a({ ...He }),
                disabled: !c,
                children: "恢复默认",
              }),
            ],
          }),
          at.map((h) => {
            const v = h.icon,
              k = s[h.key],
              j = t[h.key];
            return e.jsxs(
              "section",
              {
                className: "dashboard-manager-section overview-data-section",
                children: [
                  e.jsxs("header", {
                    children: [
                      e.jsxs("span", {
                        children: [e.jsx(v, { size: 15 }), h.label],
                      }),
                      e.jsx("button", {
                        type: "button",
                        onClick: () => a({ ...s, [h.key]: [] }),
                        disabled: !k.length,
                        children: "默认",
                      }),
                    ],
                  }),
                  e.jsxs("p", {
                    children: [
                      k.length ? `已选择 ${k.length} 个数据源` : h.placeholder,
                      "。",
                      h.description,
                    ],
                  }),
                  e.jsxs("div", {
                    className: "overview-data-entity-list",
                    children: [
                      j.map((z) =>
                        e.jsxs(
                          "label",
                          {
                            className: k.includes(z.entityId) ? "selected" : "",
                            children: [
                              e.jsx("input", {
                                type: "checkbox",
                                checked: k.includes(z.entityId),
                                onChange: () => f(h.key, z.entityId),
                              }),
                              e.jsx("span", { children: Fn(z) }),
                            ],
                          },
                          z.entityId,
                        ),
                      ),
                      !j.length &&
                        e.jsxs("div", {
                          className: "overview-data-empty",
                          children: ["暂无可用于", h.label, "的实体。"],
                        }),
                    ],
                  }),
                ],
              },
              h.key,
            );
          }),
          e.jsxs("section", {
            className: "dashboard-manager-section overview-data-card-link",
            children: [
              e.jsxs("div", {
                children: [
                  e.jsx("strong", { children: "桌面自定义卡片" }),
                  e.jsx("span", { children: "在桌面显示自定义数据卡片。" }),
                ],
              }),
              e.jsx("button", {
                type: "button",
                onClick: r,
                children: "配置卡片",
              }),
            ],
          }),
        ],
      }),
    ],
  });
}
function En({ users: t }) {
  const s = t.slice(0, 3),
    a = Math.max(t.length - s.length, 0);
  return t.length
    ? e.jsx("section", {
        className: "home-mobile-presence",
        "aria-label": "在家人员与跟踪器",
        children: e.jsxs("div", {
          className: "mobile-presence-list",
          children: [
            s.map((i) =>
              e.jsxs(
                "article",
                {
                  className: "mobile-presence-user",
                  children: [
                    e.jsx("span", {
                      className: "mobile-presence-avatar",
                      "aria-hidden": "true",
                      children: e.jsx(qt, { size: 12 }),
                    }),
                    e.jsx("span", {
                      className: "mobile-presence-copy",
                      children: e.jsx("strong", { children: i.name }),
                    }),
                  ],
                },
                i.id,
              ),
            ),
            a > 0 &&
              e.jsxs("div", {
                className: "mobile-presence-more",
                children: ["+", a],
              }),
          ],
        }),
      })
    : null;
}
function Hn(t, s) {
  if (!t.datetime) return s === 0 ? "今天" : `+${s}天`;
  const a = new Date(t.datetime);
  return Number.isNaN(a.getTime())
    ? s === 0
      ? "今天"
      : `+${s}天`
    : s === 0
      ? "今天"
      : s === 1
        ? "明天"
        : new Intl.DateTimeFormat("zh-Hans", { weekday: "short" }).format(a);
}
function Tn(t) {
  const s = t.temperature,
    a = t.temperatureLow;
  return s !== void 0 && a !== void 0
    ? `${a.toFixed(0)}-${s.toFixed(0)}°`
    : s !== void 0
      ? `${s.toFixed(0)}°`
      : a !== void 0
        ? `${a.toFixed(0)}°`
        : "--";
}
function Pn(t) {
  if (t.precipitationProbability !== void 0)
    return `${t.precipitationProbability.toFixed(0)}%`;
  if (t.precipitation !== void 0)
    return `${t.precipitation.toFixed(t.precipitation >= 10 ? 0 : 1)}mm`;
}
function Ln({ forecast: t, weatherIcons: s }) {
  return t.length
    ? e.jsx("section", {
        className: "home-weather-forecast",
        "aria-label": "天气预报",
        children: e.jsx("div", {
          className: "weather-forecast-list",
          children: t.slice(0, 4).map((a, i) => {
            const r = s[a.kind],
              c = Pn(a);
            return e.jsxs(
              "article",
              {
                className: `weather-forecast-item weather-${a.kind}`,
                children: [
                  e.jsx("span", {
                    className: "forecast-day",
                    children: Hn(a, i),
                  }),
                  e.jsx("span", {
                    className: "forecast-icon",
                    "aria-hidden": "true",
                    children: e.jsx(r, { size: 16 }),
                  }),
                  e.jsx("strong", { children: Tn(a) }),
                  c &&
                    e.jsxs("small", { children: [e.jsx(it, { size: 11 }), c] }),
                ],
              },
              `${a.datetime ?? "forecast"}-${i}`,
            );
          }),
        }),
      })
    : null;
}
function On({ controls: t, entityCount: s, onChange: a }) {
  var i;
  return e.jsxs("aside", {
    className: `home-dev-panel ${t.enabled ? "enabled" : ""}`,
    "aria-label": "开发调试面板",
    children: [
      e.jsxs("header", {
        children: [
          e.jsxs("span", { children: [e.jsx(ma, { size: 15 }), "开发调试"] }),
          e.jsxs("label", {
            children: [
              e.jsx("input", {
                type: "checkbox",
                checked: t.enabled,
                onChange: (r) => a({ ...t, enabled: r.target.checked }),
              }),
              "启用",
            ],
          }),
        ],
      }),
      e.jsxs("div", {
        className: "home-dev-grid",
        children: [
          e.jsxs("label", {
            children: [
              e.jsx("span", { children: "天气" }),
              e.jsx(we, {
                value: t.weatherState,
                onChange: (r) =>
                  a({ ...t, weatherState: r.target.value, enabled: !0 }),
                children: Ra.map((r) =>
                  e.jsx(
                    "option",
                    { value: r.value, children: r.label },
                    r.value,
                  ),
                ),
              }),
            ],
          }),
          e.jsxs("label", {
            children: [
              e.jsx("span", { children: "模型展示" }),
              e.jsx(we, {
                value: t.modelShowcase,
                onChange: (r) =>
                  a({ ...t, modelShowcase: r.target.value, enabled: !0 }),
                children: At.map((r) =>
                  e.jsx(
                    "option",
                    { value: r.value, children: r.label },
                    r.value,
                  ),
                ),
              }),
            ],
          }),
        ],
      }),
      e.jsxs("p", {
        children: [
          ((i = At.find((r) => r.value === t.modelShowcase)) == null
            ? void 0
            : i.description) ?? "模型预览",
          " · 当前 ",
          s,
          " 个实体",
        ],
      }),
    ],
  });
}
function Wn({
  cameraRoom: t,
  entities: s,
  lastSceneId: a,
  runningSceneId: i,
  sceneMode: r,
  scenes: c,
  sceneActionError: f,
  selected: h,
  onClearSelected: v,
  onRunScene: k,
}) {
  const j = !!(h || t),
    z =
      (h == null ? void 0 : h.entityId) ??
      (t ? `camera-room-${t.floorId}-${t.roomId}` : "overview"),
    P =
      (t == null
        ? void 0
        : t.cameraEntityIds
            .map((N) => s[N])
            .filter((N) => !!(N && N.domain === "camera"))) ?? [];
  l.useEffect(() => {
    if (!j) return;
    const escape = event => { if(event.key === "Escape" && !document.querySelector("dialog[open]")) v(); };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [j, v]);
  return e.jsxs(e.Fragment, {children:[j && e.jsx("div", {className:"device-control-backdrop", "aria-hidden":true,onClick:v}), e.jsx("aside", {
    className: `home-insight-panel mode-${r} ${j ? "entity-selected" : ""} ${t ? "camera-room-selected" : ""}`,
    role: j ? "dialog" : undefined,
    "aria-modal": j ? "true" : undefined,
    "aria-label": "设备与摄像头详情",
    children: e.jsxs(
      "div",
      {
        className: "home-insight-track",
        children: [
          e.jsx("section", {
            className: "insight-pane insight-overview scene-focused",
            "aria-hidden": j,
            children: null,
          }),
          e.jsxs("section", {
            className: "insight-pane insight-detail",
            "aria-hidden": !j,
            children: [
              h &&
                e.jsxs(e.Fragment, {
                  children: [
                    e.jsxs("div", {
                      className: "insight-detail-toolbar",
                      children: [
                        e.jsxs("div", {
                          children: [
                            e.jsx("small", { children: "已选设备" }),
                            e.jsx("strong", {
                              children: h.deviceDisplayName ?? h.name,
                            }),
                            e.jsx("span", {
                              children: me(h.deviceOperationalState ?? h),
                            }),
                          ],
                        }),
                      ],
                    }),
                    e.jsx(ot, { compact: !0, entity: h }),
                  ],
                }),
              !h &&
                t &&
                e.jsxs(e.Fragment, {
                  children: [
                    e.jsxs("div", {
                      className: "insight-detail-toolbar",
                      children: [
                        e.jsxs("div", {
                          children: [
                            e.jsxs("small", {
                              children: [t.floorName, " · 安防区域"],
                            }),
                            e.jsxs("strong", {
                              children: [t.roomName, "摄像头"],
                            }),
                            e.jsx("span", {
                              children: P.length
                                ? `${P.length} 个摄像头`
                                : "暂无摄像头",
                            }),
                          ],
                        }),
                      ],
                    }),
                    e.jsx(ns, { cameraRoom: t, entities: s }),
                  ],
                }),
            ],
          }),
        ],
      },
      z,
    ),
  })]});
}
function Qn({
  project: t,
  entities: s,
  status: a,
  connection: i,
  onOpenSettings: r,
  onOpenEditor: c,
  onOpenDeviceDevelopmentCenter: nextCenterOpen,
  onOpenSidebarDevelopmentCenter,
  voiceAssistant,
  sceneResumeKey,
  sceneSuspended = false,
}) {
  var $t;
  const [developmentMenuOpen, setDevelopmentMenuOpen] = l.useState(false);
  const [cameraMonitorId,setCameraMonitorId] = l.useState(null);
  const [transferOpen, setTransferOpen] = l.useState(false);
  const [sidebarWidth, setSidebarWidth] = l.useState(380);
  const [sidebarCollapsed, setSidebarCollapsed] = l.useState(false);
  const [sidebarHidden, setSidebarHidden] = l.useState(() => {try{return localStorage.getItem("ha3d.sidebar.hidden") === "1";}catch{return false;}});
  const toggleSidebarVisibility = () => setSidebarHidden(previous => {const next = !previous;try{localStorage.setItem("ha3d.sidebar.hidden",next ? "1" : "0");}catch{}return next;});
  const [manualLight, setManualLight] = l.useState(null);
  const [lightSettingsOpen, setLightSettingsOpen] = l.useState(false);
  const v = Se((n) => n.selectedEntityId),
    k = Se((n) => n.selectEntity),
    j = Se((n) => n.act),
    z = Se((n) => n.areas),
    P = Se((n) => n.saveProject),
    [N, O] = l.useState(""),
    [$, x] = l.useState(() => {
      var n;
      return ((n = t.floors[0]) == null ? void 0 : n.id) ?? "all";
    }),
    [solarClock, setSolarClock] = l.useState(Date.now),
    T = "overview",
    [E, G] = l.useState(!1),
    [ee, I] = l.useState(!1),
    [se, u] = l.useState(!1),
    [b, p] = l.useState(!1),
    [g, M] = l.useState(() => kn()),
    [S, d] = l.useState(() => In()),
    [o, w] = l.useState(),
    [y, W] = l.useState(),
    [$e, ne] = l.useState(),
    [L, ie] = l.useState(),
    [q, ke] = l.useState(),
    [ls, cs] = l.useState(0),
    [ye, ds] = l.useState(Fa),
    [pe, us] = l.useState(Sn),
    [hs, ut] = l.useState(!1),
    [Te, Pe] = l.useState(!1),
    [re, ht] = l.useState(() => Wt(t.id)),
    { width: Q, height: Me } = Nn(),
    mt = lt(),
    fe = na(i),
    A = fe || (mt && ye.enabled),
    pt = $ === "all" ? (($t = t.floors[0]) == null ? void 0 : $t.id) : $,
    xe = l.useMemo(() => Xa(t, ye, pt), [ye, pt, t]),
    F = l.useMemo(() => Ba(s, ye), [ye, s]),
    V = l.useMemo(() => Object.values(F), [F]),
    ms = l.useMemo(
      () => [
        ...new Set(
          xe.floors.flatMap((n) => [
            ...n.devices.map((m) => m.entityId),
            ...n.rooms.flatMap((m) => Bt(m)),
          ]),
        ),
      ],
      [xe.floors],
    ),
    ps = Xs(F, ms, A),
    oe = l.useMemo(() => Ks(F, t), [F, t]),
    fs = l.useMemo(
      () => ({
        air: V.filter((n) => Ue("air", n)).sort((n, m) =>
          n.name.localeCompare(m.name, "zh-Hans"),
        ),
        humidity: V.filter((n) => Ue("humidity", n)).sort((n, m) =>
          n.name.localeCompare(m.name, "zh-Hans"),
        ),
        temperature: V.filter((n) => Ue("temperature", n)).sort((n, m) =>
          n.name.localeCompare(m.name, "zh-Hans"),
        ),
      }),
      [V],
    ),
    Le = l.useMemo(
      () => ({
        air: Je("air", re.air, F, oe.airQuality),
        humidity: Je("humidity", re.humidity, F, oe.humidityRange),
        temperature: Je("temperature", re.temperature, F, oe.temperatureRange),
      }),
      [oe.airQuality, oe.humidityRange, oe.temperatureRange, F, re],
    ),
    xs = at.filter((n) => re[n.key].length).length,
    U = l.useMemo(() => an(F), [F]),
    ft = Pt[U.kind],
    xt = A && U.forecast.length > 0,
    bt = xt && pe,
    bs = t.dashboardWidgets ?? [],
    solar = resolveDaylight(s, solarClock),
    lightLevel = manualLight === null ? solar.daylight : manualLight,
    C = manualLight === null ? solar.theme : manualLight < 0.4 ? "night" : "day";
  (l.useEffect(() => {
    const n = () => setSolarClock(Date.now());
    n();
    const m = window.setInterval(n, 6e4);
    return () => window.clearInterval(m);
  }, []),
    l.useEffect(() => {
      ht(Wt(t.id));
    }, [t.id]),
    l.useEffect(() => {
      _n(t.id, re);
    }, [re]),
    l.useEffect(() => {
      t.floors.length && !t.floors.some((n) => n.id === $) && x(t.floors[0].id);
    }, [$, t.floors]),
    l.useEffect(() => {
      if (!q) return;
      const n = t.floors.find((m) => m.id === q.floorId);
      (!(n != null && n.rooms.some((m) => m.id === q.roomId)) ||
        ($ !== "all" && $ !== q.floorId)) &&
        ke(void 0);
    }, [q, $, t.floors]),
    l.useEffect(() => {
      fe || u(!1);
    }, [fe]),
    l.useEffect(() => {
      try {
        window.localStorage.setItem(es, g);
      } catch {}
    }, [g]),
    l.useEffect(() => {
      try {
        window.localStorage.setItem(ts, S);
      } catch {}
    }, [S]),
    l.useEffect(() => {
      try {
        window.localStorage.setItem(ss, String(pe));
      } catch {}
    }, [pe]));
  const B = A && v ? F[v] : void 0,
    Ce = l.useMemo(
      () => [...xe.floors].sort((n, m) => m.level - n.level),
      [xe.floors],
    ),
    ys = Ce.length > 1,
    Oe = $ === "all" ? void 0 : xe.floors.find((n) => n.id === $),
    ae = q ? xe.floors.find((n) => n.id === q.floorId) : void 0,
    yt =
      ae == null
        ? void 0
        : ae.rooms.find((n) => n.id === (q == null ? void 0 : q.roomId)),
    vt =
      A && q
        ? ((ae == null
            ? void 0
            : ae.devices.filter(
                (n) => n.roomId === q.roomId && F[n.entityId],
              )) ?? [])
        : [],
    _e = V.length,
    gt = l.useMemo(
      () =>
        V.filter((n) => n.domain === "scene").sort((n, m) =>
          n.name.localeCompare(m.name, "zh-Hans"),
        ),
      [V],
    ),
    We = Q >= 820 && Q <= 1180 && Q > Me,
    ze = (Q > 960 || We) && A,
    le = ze && !!(B || L),
    vs = ze && A && !!(B || L),
    Ve = A && E && !le,
    De = de.findIndex((n) => n.key === g),
    Ae = de[De >= 0 ? De : 1],
    jt = de[(De >= 0 ? De + 1 : 1) % de.length],
    Fe = ue.findIndex((n) => n.key === S),
    Re = ue[Fe >= 0 ? Fe : 0],
    wt = ue[(Fe >= 0 ? Fe + 1 : 1) % ue.length],
    gs = () =>
      M((n) => {
        const m = de.findIndex((_) => _.key === n);
        return de[(m >= 0 ? m + 1 : 1) % de.length].key;
      }),
    js = () =>
      d((n) => {
        const m = ue.findIndex((_) => _.key === n);
        return ue[(m >= 0 ? m + 1 : 0) % ue.length].key;
      }),
    ws = async (n) => {
      await P({
        ...t,
        dashboardWidgets: n.map((m, _) => ({ ...m, order: _ + 1 })),
        updatedAt: new Date().toISOString(),
      });
    },
    Be = l.useMemo(() => {
      const n = N.trim().toLowerCase(),
        m = (R) =>
          !n || `${R.name} ${R.entityId} ${R.state}`.toLowerCase().includes(n),
        _ = new Set(),
        H = [];
      for (const R of Ce) {
        for (const Y of R.rooms) {
          const qe = R.devices
            .filter((ce) => ce.roomId === Y.id)
            .map((ce) => F[ce.entityId])
            .filter((ce) => !!(ce && m(ce)));
          qe.length &&
            (qe.forEach((ce) => _.add(ce.entityId)),
            H.push({
              key: `${R.id}:${Y.id}`,
              label: `${R.name} · ${Y.name}`,
              entities: qe,
            }));
        }
        const Ke = R.devices
          .filter((Y) => !Y.roomId)
          .map((Y) => F[Y.entityId])
          .filter((Y) => !!(Y && m(Y)));
        Ke.length &&
          (Ke.forEach((Y) => _.add(Y.entityId)),
          H.push({
            key: `${R.id}:unassigned`,
            label: `${R.name} · 未分配房间`,
            entities: Ke,
          }));
      }
      const X = V.filter((R) => !_.has(R.entityId) && m(R));
      return (
        X.length &&
          H.push({ key: "unplaced", label: "未放置到户型", entities: X }),
        H
      );
    }, [F, V, Ce, N]),
    ks = l.useMemo(() => V.filter(Dt).length, [V]),
    Is = Be.reduce((n, m) => n + m.entities.length, 0),
    Ie = l.useMemo(() => V.filter((n) => n.domain === "person"), [V]),
    Ss = Ie.filter((n) => n.state === "home").length,
    kt = Ie.length ? `${Ss}/${Ie.length} 在家` : void 0,
    Ns = l.useMemo(() => {
      const n = [],
        m = new Set();
      for (const H of Ie.filter(is).sort((X, R) =>
        X.name.localeCompare(R.name, "zh-Hans"),
      )) {
        const X = H.name || he(H, "friendly_name") || H.entityId;
        (m.add(Ot(X)), n.push({ id: H.entityId, name: X }));
      }
      const _ = V.filter(Mn).sort((H, X) =>
        H.name.localeCompare(X.name, "zh-Hans"),
      );
      for (const H of _) {
        const X = H.name || he(H, "friendly_name") || H.entityId,
          R = Ot(X);
        m.has(R) || (m.add(R), n.push({ id: H.entityId, name: X }));
      }
      return n;
    }, [V, Ie]),
    $s = l.useMemo(() => {
      if (Q <= 760)
        return { top: sidebarHidden || sidebarCollapsed ? 12 : 260, right: 24, bottom: E ? 238 : 100, left: 24 };
      if (We) {
        const n = (_, H, X) => Math.round(Math.min(Math.max(_, H), X)),
          m = n(Q * 0.34, 320, 390);
        return {
          top: n(Me * 0.08, 52, 68),
          right: le || (E && A) ? m : n(Q * 0.11, 92, 132),
          bottom: n(Me * 0.09, 56, 72),
          left: sidebarHidden ? 24 : sidebarCollapsed ? 100 : Math.min(sidebarWidth, 330) + 116,
        };
      }
      return Q <= 960
        ? { top: 86, right: E ? 342 : 84, bottom: 58, left: sidebarHidden ? 24 : sidebarCollapsed ? 100 : Math.min(sidebarWidth, 330) + 116 }
        : { top: 62, right: le || (E && A) ? 430 : 132, bottom: 74, left: sidebarHidden ? 24 : sidebarCollapsed ? 100 : sidebarWidth + 124 };
    }, [A, E, We, le, Me, Q, sidebarWidth, sidebarCollapsed, sidebarHidden]),
    Ms = ia(i) && !(i != null && i.connected),
    Xe =
      a === "loading"
        ? "正在加载"
        : i != null && i.connected
          ? ""
          : i != null && i.mock
            ? "Home Assistant 未配置"
            : Ms
              ? "实体已同步 · 实时重连中"
              : i != null && i.reconnecting
                ? "Home Assistant 重连中"
                : "Home Assistant 未连接",
    Cs = () => {
      if (!A) {
        r == null || r();
        return;
      }
      if (le) {
        (k(void 0), ie(void 0), G(!1));
        return;
      }
      G((n) => !n);
    },
    It = async (n) => {
      (w(n), ne(void 0));
      try {
        (await j({ type: "turn_on", entityId: n }), W(n));
      } catch (m) {
        ne(m instanceof Error ? m.message : "场景执行失败");
      } finally {
        w((m) => (m === n ? void 0 : m));
      }
    },
    St = l.useCallback(
      async (n, m) => {
        ne(void 0);
        try {
          for (const _ of n) await j({ type: m, entityId: _ });
        } catch (_) {
          ne(_ instanceof Error ? _.message : "区域灯光控制失败");
        }
      },
      [j],
    ),
    Nt = l.useCallback(
      async (n, m) => {
        ne(void 0);
        try {
          for (const _ of n)
            await j(
              m >= 100
                ? { type: "turn_on", entityId: _ }
                : m <= 0
                  ? { type: "turn_off", entityId: _ }
                  : { type: "set_cover_position", entityId: _, position: m },
            );
        } catch (_) {
          ne(_ instanceof Error ? _.message : "区域窗帘控制失败");
        }
      },
      [j],
    ),
    _s = () => {
      (ke(void 0), cs((n) => n + 1));
    },
    zs = l.useCallback(
      (n, m) => {
        St(n, m);
      },
      [St],
    ),
    Ds = l.useCallback(
      (n, m) => {
        Nt(n, m);
      },
      [Nt],
    ),
    As = l.useCallback(
      (n) => {
        (k(void 0),
          ie(n),
          ke({ floorId: n.floorId, roomId: n.roomId }),
          G(!ze));
      },
      [k, ze],
    ),
    Fs = l.useCallback(
      (n) => {
        if(F[n]?.domain === "camera"){setCameraMonitorId(n);k(void 0);G(false);return;}
        (ie(void 0), k(n), G(Q <= 960));
      },
      [k, Q, F],
    );
  return e.jsxs("section", {
    className: `home-workspace ${t.floors.length > 1 && !sidebarHidden ? "has-floor-selector" : ""} theme-${C} scene-mode-${T} visual-style-${S} render-quality-${g} ${bt ? "weather-forecast-visible" : ""}`,
    children: [
      cameraMonitorId && F[cameraMonitorId] && e.jsx(CameraViewer,{key:cameraMonitorId,entity:F[cameraMonitorId],project:t,entities:F,onClose:()=>setCameraMonitorId(null),renderLive:(active,key)=>e.jsx(CameraLiveView,{entity:active,compact:true,autoPlay:true},key)}),
      e.jsxs("div", {
        className: "home-scene",
        style: {background: (()=>{const stops=[[16,29,47,35,57,80],[242,190,151,179,166,173],[139,187,211,193,210,200]];const x=Math.max(0,Math.min(1,lightLevel));const a=x<=.35?stops[0]:stops[1],b=x<=.35?stops[1]:stops[2],t=x<=.35?x/.35:(x-.35)/.65;const v=a.map((n,i)=>Math.round(n+(b[i]-n)*t));return `radial-gradient(ellipse at 80% 8%,rgba(255,215,159,${Math.max(0,1-Math.abs(x-.35)/.35)*.55}),transparent 65%),linear-gradient(145deg,rgb(${v.slice(0,3)}),rgb(${v.slice(3)}))`;})()},
        children: [
          e.jsx("div", {className: "sb-scene-viewport", children: !sceneSuspended && e.jsx(Qs, {
            key: sceneResumeKey,
            project: xe,
            entities: ps,
            floorId: Oe == null ? void 0 : Oe.id,
            showAllFloors: false,
            showLabels: !1,
            theme: C,
            daylight: lightLevel,
            wallMode: "full",
            wallThicknessScale: 0.56,
            presentation: !0,
            cameraPreset: "top",
            quality: g,
            visualStyle: S,
            weather: U,
            viewportInsets: { ...$s, fitScale: 1.16, fitAvailable: true, preserveViewOnPanelChange: true },
            focusedRoom: q,
            showDevices: A,
            showRoomBadges: A && T !== "overview" && Q > 560,
            presentationMode: T,
            autoRotate: b,
            cameraResetKey: ls,
            onRoomFocus: ke,
            onRoomLightingAction: zs,
            onRoomShadeAction: Ds,
            onRoomSecuritySelect: As,
            onEntitySelect: Fs,
          })}),
          e.jsx(PublishedSidebar, { projectId: t.id, entities: F, hidden: sidebarHidden, key: $, floors: t.floors, floorId: $, onFloorChange: (id) => {x(id);ke(void 0);k(void 0);ie(void 0);}, title: t.name, refreshKey: sceneResumeKey, theme: C, onWidthChange: setSidebarWidth, onCollapsedChange: setSidebarCollapsed }),
          !A &&
            e.jsxs("div", {
              className: "scene-data-empty",
              role: "status",
              children: [
                e.jsx("strong", { children: "未展示设备数据" }),
                e.jsx("span", {
                  children:
                    "连接 Home Assistant 后才会显示真实设备、传感器与控制状态。",
                }),
                e.jsx("button", { onClick: r, children: "配置连接" }),
              ],
            }),
          yt &&
            e.jsxs("div", {
              className: "room-focus-card",
              children: [
                e.jsxs("div", {
                  children: [
                    e.jsx("small", { children: ae == null ? void 0 : ae.name }),
                    e.jsx("strong", { children: yt.name }),
                    e.jsx("span", {
                      children: A
                        ? vt.length
                          ? `${vt.length} 个已绑定设备`
                          : "暂无已绑定设备"
                        : "连接后显示设备数据",
                    }),
                  ],
                }),
                e.jsx("button", {
                  onClick: () => ke(void 0),
                  title: "返回全屋",
                  "aria-label": "返回全屋",
                  children: e.jsx(ve, { size: 17 }),
                }),
              ],
            }),
          A && e.jsx(En, { users: Ns }),
          mt && e.jsx(On, { controls: ye, entityCount: _e, onChange: ds }),
          e.jsxs("div", {className: "home-action-bar", children: [e.jsx(SidebarVisibilityToggle, {hidden: sidebarHidden, onToggleVisibility: toggleSidebarVisibility}), (ee || lightSettingsOpen) && e.jsx("div", {className:"home-tools-backdrop", onPointerDown:event=>event.stopPropagation(), onClick:()=>{I(false);setLightSettingsOpen(false);}}), e.jsxs("div", {
            className: `home-tools ${ee ? "tools-open" : ""}`,
            "aria-label": "页面工具",
            children: [
              e.jsx("button", {
                className: "home-tools-toggle",
                onClick: () => I((n) => !n),
                "aria-label": ee ? "收起页面工具" : "展开页面工具",
                "aria-expanded": ee,
                "aria-haspopup": "menu",
                title: ee ? "收起页面工具" : "展开页面工具",
                children: e.jsx(Sa, { size: 17 }),
              }),
              ee && e.jsxs("div", {
                className: "home-tools-menu",
                role: "menu",
                children: [
                  e.jsx("button", {className: "home-tools-item", role: "menuitem", onClick: () => {I(false);setLightSettingsOpen(true);}, children: "☀ 环境光"}),
                  e.jsxs("button", {className: "home-tools-item", role: "menuitem", "aria-label": "切换模型旋转", "aria-pressed": b, onClick: () => p(n => !n), children: [e.jsx(Aa, {size: 17}), e.jsx("span", {children: b ? "停止旋转" : "旋转"})]}),
                  e.jsxs("button", {
                    className: `home-tools-item quality-dock-action quality-${g}`,
                    onClick: gs,
                    title: `画质：${Ae.label} · 点击切换到${jt.label}`,
                    "aria-label": `当前画质为${Ae.label}，点击切换到${jt.label}`,
                    role: "menuitem",
                    children: [
                      e.jsx(Zs, { size: 17 }),
                      e.jsx("b", { children: Ae.short }),
                      e.jsx("span", { children: Ae.label }),
                    ],
                  }),
                  e.jsxs("button", {
                    className: `home-tools-item style-dock-action style-${S}`,
                    onClick: js,
                    title: `风格：${Re.label} · 点击切换到${wt.label}`,
                    "aria-label": `当前 3D 风格为${Re.label}，点击切换到${wt.label}`,
                    "aria-pressed": S !== "glass",
                    role: "menuitem",
                    children: [
                      e.jsx(et, { size: 17 }),
                      e.jsx("b", { children: Re.short }),
                      e.jsx("span", { children: Re.label }),
                    ],
                  }),
                  e.jsx("button", {className:"home-tools-item home-development-entry",role:"menuitem","aria-expanded":developmentMenuOpen,onClick:()=>setDevelopmentMenuOpen(v=>!v),children:developmentMenuOpen?"开发与编辑 ▴":"开发与编辑 ▾"}),
                  developmentMenuOpen && e.jsxs("div", {className:"home-development-submenu",children:[
                    e.jsx("button",{className:"home-tools-item",role:"menuitem",onClick:()=>{I(false);c?.();},children:"房间布局编辑"}),
                    e.jsx("button",{className:"home-tools-item",role:"menuitem",onClick:()=>{I(false);nextCenterOpen?.();},children:"设备开发中心"}),
                    e.jsx("button",{className:"home-tools-item",role:"menuitem",onClick:()=>{I(false);onOpenSidebarDevelopmentCenter?.($);},children:"侧边栏开发中心"})
                  ]}),
                  e.jsx("button",{className:"home-tools-item",role:"menuitem",onClick:()=>{I(false);setTransferOpen(true);},children:"导入导出"}),
                  Xe &&
                    a !== "loading" &&
                    e.jsxs("button", {
                      className: "home-tools-item",
                      onClick: () => {
                        (I(!1), r == null || r());
                      },
                      "aria-label": "连接",
                      title: "连接",
                      role: "menuitem",
                      children: [
                        e.jsx(Ys, { size: 17 }),
                        e.jsx("span", { children: "连接" }),
                      ],
                    }),
                ],
              }),
            ],
          }), transferOpen && e.jsx(InstanceTransfer,{onClose:()=>setTransferOpen(false)}), lightSettingsOpen && e.jsxs("section", {className: "home-light-settings", role: "dialog", "aria-label": "环境光调节", children: [
            e.jsxs("header", {children: [e.jsx("strong", {children: manualLight === null ? "环境光 · 自动" : "环境光 · 手动"})]}),
            e.jsxs("label", {children: [`环境光强度 · ${Math.round(lightLevel * 100)}%`, e.jsx("input", {type: "range", min: 0, max: 100, step: 1, "aria-label": "环境光强度", value: Math.round(lightLevel * 100), onChange: event => setManualLight(Number(event.target.value) / 100)})]}),
            e.jsx("div", {className: "light-presets", children: [["夜间", 0], ["黄昏", 0.35], ["白天", 1]].map(([name,value]) => e.jsx("button", {onClick: () => setManualLight(value), children: name}, name))}),
            e.jsx("button", {className: "auto-light", onClick: () => setManualLight(null), children: "恢复自动环境光"}),
            e.jsx("p", {children: "自动模式跟随 HA 当地太阳高度。手动预览仅改变场景照明，不操作真实灯具；刷新后恢复自动。"})
          ]}), voiceAssistant]}),
          vs &&
            e.jsx(Wn, {
              cameraRoom: L,
              entities: F,
              sceneMode: T,
              scenes: gt,
              runningSceneId: o,
              lastSceneId: y,
              sceneActionError: $e,
              selected: B,
              onClearSelected: () => {
                (k(void 0), ie(void 0));
              },
              onRunScene: (n) => {
                It(n);
              },
            }),
        ],
      }),
      Ve &&
        e.jsx("div", { className: "sidebar-backdrop", "aria-hidden": "true", onClick: () => {G(false);k(undefined);ie(undefined);} }),
      e.jsxs(
        "aside",
        {
          className: `home-sidebar ${Ve ? "open" : ""} ${B || L ? "entity-selected" : ""}`,
          "aria-hidden": !Ve,
          role: B || L ? "dialog" : undefined,
          "aria-modal": B || L ? "true" : undefined,
          onKeyDown: event => {if(event.key === "Escape"){G(false);k(undefined);ie(undefined);}},
          children: [
            e.jsxs("div", {
              className: "sidebar-heading",
              children: [
                e.jsxs("div", {
                  children: [
                    false &&
                      e.jsx("button", {
                        className: "sidebar-back",
                        onClick: () => {
                          (k(void 0), ie(void 0));
                        },
                        "aria-label": "返回设备列表",
                        children: e.jsx(tt, { size: 18 }),
                      }),
                    e.jsxs("span", {
                      children: [
                        e.jsx("small", {
                          children: B
                            ? "设备详情"
                            : L
                              ? `${L.floorName} · 安防区域`
                              : `${_e} 个设备`,
                        }),
                        e.jsx("h2", {
                          children: B
                            ? (B.deviceDisplayName ?? B.name)
                            : L
                              ? `${L.roomName}摄像头`
                              : "全屋设备",
                        }),
                      ],
                    }),
                  ],
                }),
                e.jsxs("div", {
                  className: "sidebar-heading-actions",
                  children: [
                    e.jsxs("span", {
                      className: `sidebar-live-state ${i != null && i.connected ? "" : "syncing"}`,
                      children: [
                        e.jsx("i", {}),
                        i != null && i.connected ? "实时" : "已同步",
                      ],
                    }),
                    !(B || L) && e.jsx("button", {
                      className: "sidebar-close",
                      onClick: () => {
                        (G(!1), ie(void 0));
                      },
                      title: "收起设备面板",
                      "aria-label": "收起设备面板",
                      children: e.jsx(ve, { size: 19 }),
                    }),
                  ],
                }),
              ],
            }),
            B
              ? e.jsx(ot, { compact: !0, entity: B })
              : L
                ? e.jsx("div", {
                    className: "entity-browser room-camera-browser",
                    children: e.jsx(ns, { cameraRoom: L, entities: F }),
                  })
                : e.jsxs("div", {
                    className: "entity-browser",
                    children: [
                      e.jsx(as, {
                        scenes: gt,
                        runningSceneId: o,
                        lastSceneId: y,
                        error: $e,
                        onRunScene: (n) => {
                          It(n);
                        },
                      }),
                      e.jsxs("label", {
                        className: "search-field",
                        children: [
                          e.jsx(sa, { size: 17 }),
                          e.jsx("input", {
                            type: "search",
                            "aria-label": "搜索设备",
                            placeholder: "搜索设备",
                            value: N,
                            onChange: (n) => O(n.target.value),
                          }),
                          N &&
                            e.jsx("button", {
                              type: "button",
                              onClick: () => O(""),
                              "aria-label": "清空设备搜索",
                              children: e.jsx(ve, { size: 15 }),
                            }),
                        ],
                      }),
                      e.jsxs("div", {
                        className: "entity-browser-summary",
                        "aria-label": "设备统计",
                        children: [
                          e.jsxs("span", {
                            children: [
                              e.jsx("strong", { children: _e }),
                              "全部",
                            ],
                          }),
                          e.jsxs("span", {
                            children: [
                              e.jsx("strong", { children: ks }),
                              "活跃",
                            ],
                          }),
                          e.jsxs("span", {
                            children: [
                              e.jsx("strong", { children: Is }),
                              "匹配",
                            ],
                          }),
                        ],
                      }),
                      e.jsxs("div", {
                        className: "entity-groups",
                        children: [
                          Be.map((n) =>
                            e.jsxs(
                              "section",
                              {
                                className: "entity-group",
                                children: [
                                  e.jsx("h3", { children: n.label }),
                                  e.jsx("div", {
                                    className: "entity-list",
                                    children: n.entities.map((m) =>
                                      e.jsxs(
                                        "button",
                                        {
                                          className: Dt(m)
                                            ? "entity-active"
                                            : "",
                                          onClick: () => k(m.entityId),
                                          "aria-pressed": v === m.entityId,
                                          title: `${m.name} · ${me(m)}`,
                                          children: [
                                            e.jsx("span", {
                                              className: `domain-icon domain-${m.domain}`,
                                              children: e.jsx(nt, {
                                                domain: m.domain,
                                              }),
                                            }),
                                            e.jsxs("span", {
                                              className: "entity-copy",
                                              children: [
                                                e.jsx("strong", {
                                                  children: m.name,
                                                }),
                                                e.jsxs("small", {
                                                  children: [
                                                    e.jsx("i", {}),
                                                    me(m),
                                                  ],
                                                }),
                                              ],
                                            }),
                                            e.jsx(fa, { size: 17 }),
                                          ],
                                        },
                                        m.entityId,
                                      ),
                                    ),
                                  }),
                                ],
                              },
                              n.key,
                            ),
                          ),
                          !Be.length &&
                            e.jsx("div", {
                              className: "sidebar-empty",
                              children: A
                                ? "没有匹配的设备"
                                : "未连接 Home Assistant，暂不展示设备数据",
                            }),
                        ],
                      }),
                    ],
                  }),
          ],
        },
        (B == null ? void 0 : B.entityId) ??
          (L ? `camera-room-${L.floorId}-${L.roomId}` : "device-browser"),
      ),
      e.jsx(xn, {
        open: se && fe,
        project: t,
        entities: s,
        areas: z,
        onClose: () => u(!1),
        onSave: P,
      }),
    ],
  });
}
export { Qn as HomeView };
