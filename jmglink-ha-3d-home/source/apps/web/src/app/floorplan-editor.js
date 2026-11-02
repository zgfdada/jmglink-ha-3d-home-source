import {createProjectSaveSession,finishProjectSave} from "../domain/project-save-session.js";
import {formatProjectSaveError} from "../domain/project-save-error.js";
import SaveErrorToast from "../components/save-error-toast.jsx";
import {applyCurtainTrackToFloor} from "../domain/curtain-placement.js";
import DeviceBindingPicker from "../components/device-binding-picker.jsx";
import DoorSensorBinding from "../components/door-sensor-binding.jsx";
import {isDoorSensorOpen} from "../domain/door-sensor.js";
/**
 * Recovered application module from official 0.1.5 Vite artifact: FloorplanEditor-CWRaEIlm.js
 * Original identifiers, TypeScript types, comments, and module boundaries were not present.
 */
import {cameraModelDefinition} from "../../../../packages/schema/src/camera-models.js";
import CameraPlanGlyph from '../components/camera-plan-glyph.jsx';
import CameraSettings from '../components/camera-settings.jsx';
import CurtainTrackEditor, {CurtainTrackPlan,CurtainTrackOverlay} from '../components/curtain-track-editor.jsx';
import { j as t } from "../vendor/three.js";
import { a as x } from "../vendor/react.js";
import { shouldRightPanEmptyCanvas, canvasPanHasMoved } from "../domain/editor-canvas-pan.js";
import "../styles/editor-canvas-pan.css";
import { MissingDevicePlacements } from "./missing-device-placements.jsx";
import { missingDevicePlacements, replaceDevicePlacement } from "../domain/missing-device-placement.js";
import {
  l as rs,
  a as Bt,
  b as Lt,
  u as ol,
  r as ws,
  g as Ar,
  i as as,
  c as jt,
  d as rn,
  L as Ee,
  e as we,
  f as ci,
  h as os,
  j as Ba,
  k as Ns,
  m as tn,
  n as Bn,
  o as ls,
  H as ll,
  p as di,
  A as ns,
  P as Ka,
  E as cl,
  q as dl,
  S as Wa,
  s as hl,
  t as pl,
  B as ul,
  T as Et,
  C as Xa,
  v as ml,
  w as Ni,
  x as Ya,
  y as Fr,
  z as Kn,
  D as Ua,
  F as fl,
  G as xl,
  I as ft,
  J as Mi,
  K as Tr,
  M as gl,
  N as Wn,
  O as Ga,
  Q as jl,
  R as yl,
  U as hi,
  V as Hr,
  W as zr,
  X as vl,
} from "./scene.js";
import {
  c as de,
  u as mt,
  a as bl,
  p as Xn,
  W as on,
  X as Yn,
  d as wl,
} from "./app.js";
import "../vendor/hls.js";
import { CABINET_FURNITURE_KINDS } from "../domain/furniture.js";
import {
  buildDeviceLibrary,
  resolveDeviceLibraryAreaId,
} from "../domain/device-library.js";
import { normalizeVanityMirrorCabinet } from "../../../../packages/schema/src/vanity-mirror-cabinet.js";
import { resizeFloorHeight } from "../domain/floor-height.js";
import { translateFurnitureFromPointer } from "../domain/furniture-pointer.js";
import {
  isWallTranslationHandleHit,
  wallEndpointHitRadius,
} from "../domain/wall-handle-hit.js";
import {
  normalizeShowerCornerCut,
  normalizeShowerStyle,
  pointInShowerOutline,
  SHOWER_STYLE_OPTIONS,
  showerEnclosureOutline,
} from "../domain/bathroom-fixtures.js";
import {
  CABINET_STYLE_OPTIONS,
  cabinetFrontDepth,
  cabinetLayoutBounds,
  cabinetSegmentLength,
  createCabinetSegments,
  findCabinetSegmentRelations,
  mergeCollinearCabinetSegments,
  moveCabinetJunction,
  normalizeCabinetDoorCount,
  normalizeCabinetSegments,
  normalizeCabinetUpperDepth,
  normalizeSegmentedCabinetHeights,
  resizeCabinetDepthFromBack,
  segmentedCabinetDisplaySize,
  setCabinetDoorFront,
  snapCabinetJunctionToRelations,
  splitCabinetSegment,
  translateCabinetSegment,
} from "../domain/cabinet-layout.js";
import {
  bindVerticalReference,
  getObjectVerticalElevation,
  isVerticalReferenceCandidate,
  normalizeVerticalReference,
  parseVerticalReferenceOption,
  verticalReferenceOptionValue,
} from "../domain/vertical-reference.js";
import {
  clampOpeningsToWalls,
  getCollinearWallChain,
  mergeWallChain,
  straightenWallChain,
  transformCollinearWallChain,
} from "../domain/wall-straightening.js";
import {
  snapCreationPointToAlignment,
  snapPointToAlignment,
  snapTranslationToAlignment,
} from "../domain/alignment-guides.js";
import {
  isVirtualWall,
  pointAlongWall,
  splitWallSegment,
} from "../domain/walls.js";
import {
  alignDevicesOnLine,
  distributeDevicesEvenly,
  inspectDeviceLine,
} from "../domain/device-arrangement.js";
import {
  CUSTOM_DEVICE_FILTER,
  isCustomDeviceEntity,
  resolveBoundDevicePresentation,
  resolveDeviceModelFootprint,
} from "../domain/device-platform-presentation.js";
import "../styles/editor-alignment.css";
import "../styles/device-model-sync.css";
import { CustomFurnitureLibrary } from "./custom-furniture-library.jsx";
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Nl = [
    ["path", { d: "M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3", key: "irtipd" }],
    [
      "path",
      {
        d: "M3 16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v1.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V11a2 2 0 0 0-4 0z",
        key: "1qyhux",
      },
    ],
    ["path", { d: "M5 18v2", key: "ppbyun" }],
    ["path", { d: "M19 18v2", key: "gy7782" }],
  ],
  Rr = de("armchair", Nl);
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Ml = [
    [
      "rect",
      { width: "18", height: "18", x: "3", y: "3", rx: "2", key: "afitv7" },
    ],
    ["path", { d: "M12 9v6", key: "199k2o" }],
    ["path", { d: "M16 15v6", key: "8rj2es" }],
    ["path", { d: "M16 3v6", key: "1j6rpj" }],
    ["path", { d: "M3 15h18", key: "5xshup" }],
    ["path", { d: "M3 9h18", key: "1pudct" }],
    ["path", { d: "M8 15v6", key: "1stoo3" }],
    ["path", { d: "M8 3v6", key: "vlvjmk" }],
  ],
  $l = de("brick-wall", Ml);
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Sl = [["path", { d: "m18 15-6-6-6 6", key: "153udz" }]],
  kl = de("chevron-up", Sl);
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Cl = [
    [
      "rect",
      {
        width: "14",
        height: "14",
        x: "8",
        y: "8",
        rx: "2",
        ry: "2",
        key: "17jyea",
      },
    ],
    [
      "path",
      {
        d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2",
        key: "zix9uf",
      },
    ],
  ],
  Il = de("copy", Cl);
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const _l = [
    ["path", { d: "M11 20H2", key: "nlcfvz" }],
    [
      "path",
      {
        d: "M11 4.562v16.157a1 1 0 0 0 1.242.97L19 20V5.562a2 2 0 0 0-1.515-1.94l-4-1A2 2 0 0 0 11 4.561z",
        key: "au4z13",
      },
    ],
    ["path", { d: "M11 4H8a2 2 0 0 0-2 2v14", key: "74r1mk" }],
    ["path", { d: "M14 12h.01", key: "1jfl7z" }],
    ["path", { d: "M22 20h-3", key: "vhrsz" }],
  ],
  El = de("door-open", _l);
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Ll = [
    ["path", { d: "M12 15V3", key: "m9g1x1" }],
    ["path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", key: "ih7n3h" }],
    ["path", { d: "m7 10 5 5 5-5", key: "brsn70" }],
  ],
  qa = de("download", Ll);
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Pl = [
    ["path", { d: "m3 7 5 5-5 5V7", key: "couhi7" }],
    ["path", { d: "m21 7-5 5 5 5V7", key: "6ouia7" }],
    ["path", { d: "M12 20v2", key: "1lh1kg" }],
    ["path", { d: "M12 14v2", key: "8jcxud" }],
    ["path", { d: "M12 8v2", key: "1woqiv" }],
    ["path", { d: "M12 2v2", key: "tus03m" }],
  ],
  Dl = de("flip-horizontal-2", Pl);
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Al = [
    ["circle", { cx: "12", cy: "12", r: "3", key: "1v7zrd" }],
    ["path", { d: "M3 7V5a2 2 0 0 1 2-2h2", key: "aa7l1z" }],
    ["path", { d: "M17 3h2a2 2 0 0 1 2 2v2", key: "4qcy5o" }],
    ["path", { d: "M21 17v2a2 2 0 0 1-2 2h-2", key: "6vwrx8" }],
    ["path", { d: "M7 21H5a2 2 0 0 1-2-2v-2", key: "ioqczr" }],
  ],
  Fl = de("focus", Al);
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Tl = [
    [
      "rect",
      { width: "18", height: "18", x: "3", y: "3", rx: "2", key: "afitv7" },
    ],
    ["path", { d: "M3 9h18", key: "1pudct" }],
    ["path", { d: "M3 15h18", key: "5xshup" }],
    ["path", { d: "M9 3v18", key: "fh3hqa" }],
    ["path", { d: "M15 3v18", key: "14nvp0" }],
  ],
  Hl = de("grid-3x3", Tl);
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const zl = [
    ["path", { d: "M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2", key: "1fvzgz" }],
    ["path", { d: "M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2", key: "1kc0my" }],
    ["path", { d: "M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8", key: "10h0bg" }],
    [
      "path",
      {
        d: "M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15",
        key: "1s1gnw",
      },
    ],
  ],
  Rl = de("hand", zl);
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Ol = [
    [
      "path",
      {
        d: "M19.414 14.414C21 12.828 22 11.5 22 9.5a5.5 5.5 0 0 0-9.591-3.676.6.6 0 0 1-.818.001A5.5 5.5 0 0 0 2 9.5c0 2.3 1.5 4 3 5.5l5.535 5.362a2 2 0 0 0 2.879.052 2.12 2.12 0 0 0-.004-3 2.124 2.124 0 1 0 3-3 2.124 2.124 0 0 0 3.004 0 2 2 0 0 0 0-2.828l-1.881-1.882a2.41 2.41 0 0 0-3.409 0l-1.71 1.71a2 2 0 0 1-2.828 0 2 2 0 0 1 0-2.828l2.823-2.762",
        key: "17lmqv",
      },
    ],
  ],
  Vl = de("heart-handshake", Ol);
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Bl = [
    ["path", { d: "M16 5h6", key: "1vod17" }],
    ["path", { d: "M19 2v6", key: "4bpg5p" }],
    [
      "path",
      {
        d: "M21 11.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7.5",
        key: "1ue2ih",
      },
    ],
    ["path", { d: "m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21", key: "1xmnt7" }],
    ["circle", { cx: "9", cy: "9", r: "2", key: "af1f0g" }],
  ],
  Or = de("image-plus", Bl);
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Kl = [
    [
      "path",
      {
        d: "M4.037 4.688a.495.495 0 0 1 .651-.651l16 6.5a.5.5 0 0 1-.063.947l-6.124 1.58a2 2 0 0 0-1.438 1.435l-1.579 6.126a.5.5 0 0 1-.947.063z",
        key: "edeuup",
      },
    ],
  ],
  Wl = de("mouse-pointer-2", Kl);
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Xl = [
    ["path", { d: "M19 13v6h-6", key: "1hxl6d" }],
    ["path", { d: "M5 11V5h6", key: "12e2xe" }],
    ["path", { d: "m5 5 14 14", key: "11anup" }],
  ],
  sn = de("move-diagonal-2", Xl);
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Yl = [
    ["path", { d: "m15 14 5-5-5-5", key: "12vg1m" }],
    [
      "path",
      {
        d: "M20 9H9.5A5.5 5.5 0 0 0 4 14.5A5.5 5.5 0 0 0 9.5 20H13",
        key: "6uklza",
      },
    ],
  ],
  Ul = de("redo-2", Yl);
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Gl = [
    [
      "path",
      { d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8", key: "1357e3" },
    ],
    ["path", { d: "M3 3v5h5", key: "1xhq8a" }],
  ],
  Za = de("rotate-ccw", Gl);
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const ql = [
    [
      "path",
      {
        d: "M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z",
        key: "icamh8",
      },
    ],
    ["path", { d: "m14.5 12.5 2-2", key: "inckbg" }],
    ["path", { d: "m11.5 9.5 2-2", key: "fmmyf7" }],
    ["path", { d: "m8.5 6.5 2-2", key: "vc6u1g" }],
    ["path", { d: "m17.5 15.5 2-2", key: "wo5hmg" }],
  ],
  Zl = de("ruler", ql);
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Ql = [
    ["path", { d: "M3 7V5a2 2 0 0 1 2-2h2", key: "aa7l1z" }],
    ["path", { d: "M17 3h2a2 2 0 0 1 2 2v2", key: "4qcy5o" }],
    ["path", { d: "M21 17v2a2 2 0 0 1-2 2h-2", key: "6vwrx8" }],
    ["path", { d: "M7 21H5a2 2 0 0 1-2-2v-2", key: "ioqczr" }],
    ["path", { d: "M7 12h10", key: "b7w52i" }],
  ],
  Jl = de("scan-line", Ql);
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const ec = [
    ["path", { d: "M9 14 4 9l5-5", key: "102s5s" }],
    [
      "path",
      {
        d: "M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11",
        key: "f3b9sd",
      },
    ],
  ],
  tc = de("undo-2", ec);
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const sc = [
    ["path", { d: "M12 3v12", key: "1x0j5s" }],
    ["path", { d: "m17 8-5-5-5 5", key: "7q97r8" }],
    ["path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", key: "ih7n3h" }],
  ],
  nn = de("upload", sc),
  Ne = 1e-5,
  nc = 0.25,
  Qa = 1e4,
  Pt = (s, i) => [s[0] - i[0], s[1] - i[1]],
  $s = (s, i) => s[0] * i[1] - s[1] * i[0],
  ks = (s, i) => (s[0] - i[0]) ** 2 + (s[1] - i[1]) ** 2,
  ln = ([s, i]) => `${Math.round(s * Qa)},${Math.round(i * Qa)}`;
function Ja(s, i, o) {
  const d = Pt(o, i),
    c = Pt(s, i);
  if (Math.abs($s(d, c)) > Ne) return !1;
  const f = c[0] * d[0] + c[1] * d[1],
    v = d[0] ** 2 + d[1] ** 2;
  return f >= -Ne && f <= v + Ne;
}
function ic(s, i) {
  const o = s.start,
    d = i.start,
    c = Pt(s.end, s.start),
    f = Pt(i.end, i.start),
    v = $s(c, f);
  if (Math.abs(v) < Ne) return;
  const $ = Pt(d, o),
    y = $s($, f) / v,
    j = $s($, c) / v;
  if (!(y < -Ne || y > 1 + Ne || j < -Ne || j > 1 + Ne))
    return [o[0] + y * c[0], o[1] + y * c[1]];
}
function pn(s) {
  return (
    s.reduce((i, o, d) => {
      const c = s[(d + 1) % s.length];
      return i + o[0] * c[1] - c[0] * o[1];
    }, 0) / 2
  );
}
function er(s) {
  const i = pn(s);
  if (Math.abs(i) < Ne) {
    const c = s.reduce((f, v) => [f[0] + v[0], f[1] + v[1]], [0, 0]);
    return [c[0] / s.length, c[1] / s.length];
  }
  let o = 0,
    d = 0;
  for (let c = 0; c < s.length; c += 1) {
    const f = s[c],
      v = s[(c + 1) % s.length],
      $ = f[0] * v[1] - v[0] * f[1];
    ((o += (f[0] + v[0]) * $), (d += (f[1] + v[1]) * $));
  }
  return [o / (6 * i), d / (6 * i)];
}
function tr(s, i) {
  let o = !1;
  for (let d = 0, c = i.length - 1; d < i.length; c = d, d += 1) {
    const f = i[d],
      v = i[c];
    f[1] > s[1] != v[1] > s[1] &&
      s[0] < ((v[0] - f[0]) * (s[1] - f[1])) / (v[1] - f[1]) + f[0] &&
      (o = !o);
  }
  return o;
}
function ac(s) {
  let i = [...s],
    o = !0;
  for (; o && i.length > 3;)
    ((o = !1),
      (i = i.filter((c, f) => {
        const v = i[(f - 1 + i.length) % i.length],
          $ = i[(f + 1) % i.length],
          y = ks(c, v) < Ne ** 2,
          j = ks(v, $) < Ne ** 2,
          S = Math.abs($s(Pt(c, v), Pt($, c))) <= Ne;
        return ((y || j || S) && (o = !0), !y && !j && !S);
      })));
  return i;
}
function rc(s) {
  const i = s.map(ln),
    d =
      i.map((f, v) => [...i.slice(v), ...i.slice(0, v)].join("|")).sort()[0] ??
      i.join("|");
  let c = 2166136261;
  for (const f of d) ((c ^= f.charCodeAt(0)), (c = Math.imul(c, 16777619)));
  return `room-${(c >>> 0).toString(36)}`;
}
function oc(s) {
  var f, v;
  const i = s.map(($) => [$.start, $.end]);
  for (let $ = 0; $ < s.length; $ += 1)
    for (let y = $ + 1; y < s.length; y += 1) {
      const j = s[$],
        S = s[y],
        _ = ic(j, S);
      _ && (i[$].push(_), i[y].push(_));
      for (const H of [S.start, S.end]) Ja(H, j.start, j.end) && i[$].push(H);
      for (const H of [j.start, j.end]) Ja(H, S.start, S.end) && i[y].push(H);
    }
  const o = new Map(),
    d = new Map();
  s.forEach(($, y) => {
    const j = Pt($.end, $.start),
      S = j[0] ** 2 + j[1] ** 2 || 1,
      H = [...new Map(i[y].map((W) => [ln(W), W])).values()].sort((W, B) => {
        const P = ((W[0] - $.start[0]) * j[0] + (W[1] - $.start[1]) * j[1]) / S,
          U = ((B[0] - $.start[0]) * j[0] + (B[1] - $.start[1]) * j[1]) / S;
        return P - U;
      });
    for (let W = 0; W < H.length - 1; W += 1) {
      const B = H[W],
        P = H[W + 1];
      if (ks(B, P) < Ne ** 2) continue;
      const U = ln(B),
        oe = ln(P);
      (o.set(U, B), o.set(oe, P));
      const $e = U < oe ? `${U}|${oe}` : `${oe}|${U}`;
      d.set($e, [U, oe]);
    }
  });
  const c = new Map();
  for (const [$, y] of d.values())
    (c.has($) || c.set($, new Set()),
      c.has(y) || c.set(y, new Set()),
      (f = c.get($)) == null || f.add(y),
      (v = c.get(y)) == null || v.add($));
  return { nodes: o, edges: d, adjacency: c };
}
function lc(s) {
  const { nodes: i, edges: o, adjacency: d } = oc(s),
    c = new Set(),
    f = [],
    v = (y, j) => `${y}>${j}`,
    $ = (y, j) => {
      const S = [];
      let _ = y,
        H = j;
      const W = o.size * 2 + 2;
      for (let B = 0; B < W; B += 1) {
        const P = v(_, H);
        if (c.has(P)) return;
        (c.add(P), S.push(_));
        const U = i.get(H),
          oe = [...(d.get(H) ?? [])];
        if (!U || oe.length < 1) return;
        oe.sort((Y, xe) => {
          const he = i.get(Y),
            nt = i.get(xe);
          return (
            Math.atan2(he[1] - U[1], he[0] - U[0]) -
            Math.atan2(nt[1] - U[1], nt[0] - U[0])
          );
        });
        const $e = oe.indexOf(_);
        if ($e < 0) return;
        const Le = oe[($e - 1 + oe.length) % oe.length];
        if (((_ = H), (H = Le), _ === y && H === j)) break;
      }
      if (!(S.length < 3)) return ac(S.map((B) => i.get(B)));
    };
  for (const [y, j] of o.values())
    for (const [S, _] of [
      [y, j],
      [j, y],
    ]) {
      if (c.has(v(S, _))) continue;
      const H = $(S, _);
      H && pn(H) > nc && f.push(H);
    }
  return f;
}
function Vt(s, i = [], o) {
  const d = lc(s).sort((f, v) => Math.abs(pn(v)) - Math.abs(pn(f))),
    c = new Set();
  return d.map((f, v) => {
    var j;
    const $ = er(f),
      y =
        (j = i
          .filter((S) => !c.has(S.id))
          .map((S) => ({ room: S, center: er(S.polygon) }))
          .filter(({ room: S, center: _ }) => tr($, S.polygon) || tr(_, f))
          .sort((S, _) => ks($, S.center) - ks($, _.center))[0]) == null
          ? void 0
          : j.room;
    return (
      y && c.add(y.id),
      {
        id: (y == null ? void 0 : y.id) ?? rc(f),
        name: (y == null ? void 0 : y.name) ?? `房间 ${i.length + v + 1}`,
        polygon: f,
        floorMaterialId: (y == null ? void 0 : y.floorMaterialId) ?? o,
        ceilingMaterialId: y == null ? void 0 : y.ceilingMaterialId,
        haAreaId: y == null ? void 0 : y.haAreaId,
        bindings: y == null ? void 0 : y.bindings,
      }
    );
  });
}
function Cs(s, i = 0.1) {
  return !Number.isFinite(s) || !Number.isFinite(i) || i <= 0
    ? s
    : Number((Math.round(s / i) * i).toFixed(6));
}
function cc(s, i, o = 0.1, d = 0.001) {
  const c = [Cs(s[0], o), Cs(s[1], o)];
  return i.some((f) => Math.hypot(f[0] - c[0], f[1] - c[1]) < d) ? c : void 0;
}
function dc(s, i, o = 0.06) {
  const d = Number.isFinite(i) && i > 0 ? i : s.width / s.height,
    c = s.minX + s.width / 2,
    f = s.minY + s.height / 2,
    v = Math.max(0.001, s.width * (1 + o * 2)),
    $ = Math.max(0.001, s.height * (1 + o * 2)),
    y = Math.max(v, $ * d),
    j = y / d;
  return { minX: c - y / 2, minY: f - j / 2, width: y, height: j };
}
function hc(s, i, o = 0.28) {
  return !Number.isFinite(s) || !Number.isFinite(i) || i <= 0
    ? o
    : Math.max(o, (s / i) * 24);
}
const Me = 1e-4,
  Ms = 0.04,
  pc = 0.001,
  Un = (s, i) => s[0] * i[1] - s[1] * i[0],
  Be = (s, i) => Math.hypot(s[0] - i[0], s[1] - i[1]);
function uc(s, i, o) {
  const d = (o[0] - i[0]) ** 2 + (o[1] - i[1]) ** 2;
  if (!d) return { point: [...i], t: 0, distance: Be(s, i) };
  const c = Math.max(
      0,
      Math.min(
        1,
        ((s[0] - i[0]) * (o[0] - i[0]) + (s[1] - i[1]) * (o[1] - i[1])) / d,
      ),
    ),
    f = [i[0] + (o[0] - i[0]) * c, i[1] + (o[1] - i[1]) * c];
  return { point: f, t: c, distance: Be(s, f) };
}
function Gn(s, i) {
  return [
    Number((Math.round(s[0] / i) * i).toFixed(6)),
    Number((Math.round(s[1] / i) * i).toFixed(6)),
  ];
}
function mc(
  s,
  i,
  o,
  d,
  {
    snapDistance: c = 0.22,
    gridSize: f = 0.1,
    moveConnected: v = !0,
    snapToGrid: $ = !1,
    snapToWalls: snapToWalls = !0,
  } = {},
) {
  if (!s.find((Y) => Y.id === i)) return { walls: s };
  const j = $ ? Gn(d, f) : [d[0], d[1]],
    S = $
      ? Gn([o.start[0] + j[0], o.start[1] + j[1]], f)
      : [o.start[0] + j[0], o.start[1] + j[1]],
    _ = $
      ? Gn([o.end[0] + j[0], o.end[1] + j[1]], f)
      : [o.end[0] + j[0], o.end[1] + j[1]],
    H = new Set(
      s
        .filter((Y) => Y.id !== i)
        .filter((Y) =>
          [Y.start, Y.end].some(
            (xe) => Be(xe, o.start) < Ms || Be(xe, o.end) < Ms,
          ),
        )
        .map((Y) => Y.id),
    ),
    W = [];
  snapToWalls &&
    [S, _].forEach((Y) => {
      for (const xe of s) {
        if (xe.id === i || H.has(xe.id)) continue;
        for (const nt of [xe.start, xe.end]) {
          const it = Be(Y, nt);
          it <= c &&
            W.push({
              point: [...nt],
              endpoint: Y,
              kind: "endpoint",
              distance: it,
            });
        }
        const he = uc(Y, xe.start, xe.end);
        he.t > Me &&
          he.t < 1 - Me &&
          he.distance <= c &&
          W.push({
            point: he.point,
            endpoint: Y,
            kind: "wall",
            distance: he.distance,
          });
      }
    });
  const B = W.sort((Y, xe) => {
      const he = (nt) => (nt === "endpoint" ? 0 : 1);
      return he(Y.kind) - he(xe.kind) || Y.distance - xe.distance;
    })[0],
    P = B ? [B.point[0] - B.endpoint[0], B.point[1] - B.endpoint[1]] : [0, 0],
    U = [S[0] + P[0], S[1] + P[1]],
    oe = [_[0] + P[0], _[1] + P[1]],
    $e = (Y) =>
      v ? (Be(Y, o.start) < Ms ? U : Be(Y, o.end) < Ms ? oe : Y) : Y,
    Le = s.map((Y) =>
      Y.id === i
        ? { ...Y, start: U, end: oe }
        : { ...Y, start: $e(Y.start), end: $e(Y.end) },
    );
  return {
    walls: Le,
    movedWall: Le.find((Y) => Y.id === i),
    snap: B
      ? { point: [...B.point], kind: B.kind, distance: B.distance }
      : void 0,
  };
}
function fc(
  s,
  i,
  o,
  d,
  {
    moveConnected: c = !1,
    allowEndpointMerge: f = !1,
    minimumLength: v = 0.12,
  } = {},
) {
  const $ = s.find((W) => W.id === i);
  if (!$) return s;
  const y = $[o],
    j = o === "start" ? $.end : $.start,
    S = [d[0], d[1]];
  if (Be(S, j) < v || Be(S, y) < Me) return s;
  const _ = (W) => Be(W, y) < Ms;
  return s.some((W) => [W.start, W.end].some((B) => !_(B) && Be(B, S) < pc)) &&
    !f
    ? s
    : s.map((W) => {
        const B = W.id === i ? o === "start" : c && _(W.start),
          P = W.id === i ? o === "end" : c && _(W.end);
        return !B && !P
          ? W
          : { ...W, start: B ? S : W.start, end: P ? S : W.end };
      });
}
function Vr(s, i, o, d) {
  const c = [i[0] - s[0], i[1] - s[1]],
    f = [d[0] - o[0], d[1] - o[1]],
    v = Un(c, f);
  if (Math.abs(v) < Me) return;
  const $ = [o[0] - s[0], o[1] - s[1]],
    y = Un($, f) / v,
    j = Un($, c) / v;
  if (y < -Me || y > 1 + Me || j < -Me || j > 1 + Me) return;
  const S = Math.max(0, Math.min(1, y));
  return {
    point: [s[0] + c[0] * S, s[1] + c[1] * S],
    firstT: S,
    secondT: Math.max(0, Math.min(1, j)),
  };
}
function xc(s) {
  return s
    .filter((i) => i > Me && i < 1 - Me)
    .sort((i, o) => i - o)
    .filter((i, o, d) => o === 0 || Math.abs(i - d[o - 1]) > Me);
}
function sr(s, i, o) {
  const d = [0, ...xc(i), 1];
  return d.slice(0, -1).map((c, f) => {
    const v = d[f + 1],
      $ = (j) => [
        s.start[0] + (s.end[0] - s.start[0]) * j,
        s.start[1] + (s.end[1] - s.start[1]) * j,
      ];
    let y = s.id;
    if (f > 0) {
      const j = `${s.id}-s${f}`;
      y = j;
      let S = 2;
      for (; o.has(y);) y = `${j}-${S++}`;
      o.add(y);
    }
    return {
      wall: { ...s, id: y, start: $(c), end: $(v) },
      startT: c,
      endT: v,
    };
  });
}
function nr(s, i, o) {
  const d = new Map(),
    c = [],
    f = new Set([...s.map((S) => S.id), i.id]);
  for (const S of s) {
    const _ = Vr(i.start, i.end, S.start, S.end);
    if (!_) continue;
    c.push(_.firstT);
    const H = d.get(S.id) ?? [];
    (H.push(_.secondT), d.set(S.id, H));
  }
  const v = new Map(),
    $ = s.flatMap((S) => {
      const _ = sr(S, d.get(S.id) ?? [], f);
      return (v.set(S.id, _), _);
    }),
    y = sr(i, c, f);
  v.set(i.id, y);
  const j = o.map((S) => {
    const _ =
        s.find((U) => U.id === S.wallId) ?? (S.wallId === i.id ? i : void 0),
      H = _ ? v.get(_.id) : void 0;
    if (!_ || !H || H.length === 1) return S;
    const W = Math.hypot(_.end[0] - _.start[0], _.end[1] - _.start[1]);
    if (W < Me) return S;
    const B = Math.max(0, Math.min(1, S.offset / W)),
      P = H.find((U, oe) => B < U.endT - Me || oe === H.length - 1) ?? H[0];
    return {
      ...S,
      wallId: P.wall.id,
      offset: Math.max(0, S.offset - P.startT * W),
    };
  });
  return {
    walls: [...$.map((S) => S.wall), ...y.map((S) => S.wall)],
    openings: j,
    createdWallIds: y.map((S) => S.wall.id),
  };
}
const gc = new Set(["furniture", "device", "blueprint", "calibrate"]);
function cn(s) {
  return gc.has(s);
}
function jc(s, i, o, d = cn(s)) {
  return {
    resourceOpen: d,
    inspectorOpen: d ? !1 : i,
    panelExpanded: o && (d || i),
  };
}
function yc(s, i) {
  return i && s !== "wall" && s !== "calibrate" && s !== "pan";
}
function vc(s, i) {
  return (
    s === "select" ||
    (i === "opening" && (s === "door" || s === "window")) ||
    (i === "furniture" && s === "furniture") ||
    (i === "device" && s === "device")
  );
}
const un = (s, i) => Math.hypot(s[0] - i[0], s[1] - i[1]);
function bc(s, i) {
  const o = un(s.start, s.end) || 1,
    d = Math.max(0, Math.min(1, i / o));
  return [
    s.start[0] + (s.end[0] - s.start[0]) * d,
    s.start[1] + (s.end[1] - s.start[1]) * d,
  ];
}
function Br(s, i) {
  const o = s[0] - i.position[0],
    d = s[1] - i.position[1],
    c = Math.cos(i.rotation),
    f = Math.sin(i.rotation);
  return { x: o * c + d * f, y: -o * f + d * c };
}
function Kr(s, i) {
  const o = Br(s, i),
    d = 0.08;
  if (Math.abs(o.x) > i.width / 2 + d || Math.abs(o.y) > i.depth / 2 + d)
    return false;
  if (i.kind !== "shower_enclosure") return true;
  return pointInShowerOutline(
    [o.x, o.y],
    showerEnclosureOutline(i.width, i.depth, i.showerStyle, i.showerCornerCut),
    d,
  );
}
function wc(s, i, o) {
  const d = bc(o, i.offset),
    c = Math.atan2(o.end[1] - o.start[1], o.end[0] - o.start[0]),
    f = s[0] - d[0],
    v = s[1] - d[1],
    $ = f * Math.cos(c) + v * Math.sin(c),
    y = -f * Math.sin(c) + v * Math.cos(c);
  return Math.abs($) <= i.width / 2 + 0.1 && Math.abs(y) <= 0.18;
}
function Nc(s, i, o) {
  const d = (o[0] - i[0]) ** 2 + (o[1] - i[1]) ** 2;
  if (!d) return un(s, i);
  const c = Math.max(
    0,
    Math.min(
      1,
      ((s[0] - i[0]) * (o[0] - i[0]) + (s[1] - i[1]) * (o[1] - i[1])) / d,
    ),
  );
  return un(s, [i[0] + (o[0] - i[0]) * c, i[1] + (o[1] - i[1]) * c]);
}
function Mc(s, i) {
  if (s.modelId === "light.strip" || s.modelId === "switch.light.strip")
    return !0;
  if (s.kind !== "light") return !1;
  const o =
    `${s.entityId} ${(i == null ? void 0 : i.name) ?? ""}`.toLowerCase();
  return /(灯带|lightstrip|light strip|strip|氛围灯带)/i.test(o);
}
function $c(s, i, o) {
  var d, c, f;
  if (Mc(i, o))
    return rs(Lt(i), Bt(i)).some((v) => Nc(s, v.start, v.end) <= 0.2);
  if (i.modelId === "climate.central_ac") {
    const v = s[0] - i.position[0],
      $ = s[1] - i.position[2],
      y = -(((d = i.rotation) == null ? void 0 : d[1]) ?? 0),
      j = v * Math.cos(y) + $ * Math.sin(y),
      S = -v * Math.sin(y) + $ * Math.cos(y),
      _ = 0.92 * (((c = i.scale) == null ? void 0 : c[0]) ?? 1.16),
      H = 0.34 * (((f = i.scale) == null ? void 0 : f[2]) ?? 1.16);
    return Math.abs(j) <= _ / 2 + 0.12 && Math.abs(S) <= H / 2 + 0.12;
  }
  return un([i.position[0], i.position[2]], s) <= 0.28;
}
function ir(s, i, o = {}, d = {}) {
  for (const c of [...s.devices].reverse())
    if (
      !(d.requireKnownDeviceEntity && !o[c.entityId]) &&
      $c(i, c, o[c.entityId])
    )
      return { type: "device", id: c.id };
  for (const c of [...s.furniture].reverse())
    if (Kr(i, c)) return { type: "furniture", id: c.id };
  for (const c of [...s.openings].reverse()) {
    const f = s.walls.find((v) => v.id === c.wallId);
    if (f && wc(i, c, f)) return { type: "opening", id: c.id };
  }
}
function Sc(s, i) {
  const o = Br(s, i),
    d = i.width / 2,
    c = i.depth / 2,
    f = -c - 0.4,
    v = 0.12,
    $ = Math.abs(Math.abs(o.x) - d) <= v && Math.abs(o.y) <= c + v,
    y = Math.abs(Math.abs(o.y) - c) <= v && Math.abs(o.x) <= d + v,
    j = Math.abs(o.x) <= v && o.y <= -c + v && o.y >= f - v,
    S = Math.hypot(o.x, o.y - f) <= 0.24,
    _ = Math.abs(o.x - d) <= 0.22 && Math.abs(o.y - c) <= 0.22;
  return Kr(s, i) || $ || y || j || S || _;
}
const kc = {
  wall: "拖动端点改墙体，右侧精确输入尺寸",
  opening: "沿墙拖动位置，右侧调整门窗类型",
  room: "可重命名房间并调整地面外观",
  device: "拖动设备定位，右侧调整模型与房间",
  furniture: "左键选中家具；右键按住可从本体或控制点整体拖动",
};
function Cc(s) {
  return s.spacePanActive
    ? "松开空格返回当前工具"
    : s.lightStripStart
      ? "继续点击添加端点，Enter 完成灯带"
      : s.selectionType
        ? kc[s.selectionType]
        : s.tool === "wall"
          ? s.wallTraceCount
            ? "继续点击墙角，靠近起点可闭合房间"
            : "点击画布开始绘制墙体"
          : s.tool === "door"
            ? "点击墙体放置门，右侧可翻转开向"
            : s.tool === "window"
              ? "点击墙体放置窗，右侧可切换落地窗"
              : s.tool === "device"
                ? s.selectedEntityName
                  ? `点击画布放置 ${s.selectedEntityName}`
                  : "从左侧选择 HA 设备后放置"
                : s.tool === "furniture"
                  ? "选择家具类型后点击画布放置"
                  : s.tool === "calibrate"
                    ? s.calibrationEditing
                      ? "选择标定线终点并填写实际长度"
                      : "在底图上选择一段已知长度"
                    : s.tool === "blueprint"
                      ? "导入底图并完成比例尺标定"
                      : s.tool === "pan"
                        ? "拖动画布查看全局"
                        : s.tool === "select"
                          ? "未选中对象时，右键拖动空白处平移；左键选择或框选"
                        : s.activeToolLabel
                          ? `${s.activeToolLabel}模式`
                          : "Space 临时平移";
}
function Ic(s) {
  return s.selectionType === "wall"
    ? "结构尺寸 · 墙体外观"
    : s.selectionType === "opening"
      ? "门窗尺寸 · 开向类型"
      : s.selectionType === "room"
        ? s.selectedRoomName
          ? `当前房间 · ${s.selectedRoomName}`
          : "房间属性"
        : s.selectionType === "device"
          ? s.selectedRoomName
            ? `已绑定房间 · ${s.selectedRoomName}`
            : "设备点位 · 未指定房间"
          : s.selectionType === "furniture"
            ? s.selectedRoomName
              ? `家具布置 · ${s.selectedRoomName}`
              : "家具尺寸 · 未指定房间"
            : s.tool === "device" && s.selectedEntityName
              ? `准备放置 · ${s.selectedEntityName}`
              : s.tool === "furniture"
                ? "家具库已打开"
                : s.tool === "blueprint"
                  ? "底图、楼层与数据"
                  : s.activeToolLabel
                    ? `${s.activeToolLabel}工具 · 楼层设置`
                    : "楼层设置";
}
function _c(s) {
  return s.tool === "device" &&
    s.selectedEntityName &&
    s.activeModelId === "light.strip"
    ? {
        title: s.lightStripStart ? "灯带路径绘制中" : "灯带路径放置",
        body: s.lightStripStart
          ? "每次点击都会添加一个端点，按 Enter 后生成可编辑灯带。"
          : `为 ${s.selectedEntityName} 选择线型或环形，再在画布上连续点击端点。`,
        steps: s.lightStripStart
          ? ["继续点击添加端点", "Enter 完成绘制", "拖动端点微调路径"]
          : ["选择线型或环形", "点击添加第一个端点", "Enter 完成后精确调整"],
        tone: "light-strip",
      }
    : s.tool === "device"
      ? {
          title: s.selectedEntityName ? "准备放置设备" : "选择要布置的 HA 设备",
          body: s.selectedEntityName
            ? `点击户型中的房间区域放置 ${s.selectedEntityName}。`
            : s.availableDeviceCount
              ? "左侧设备库会过滤掉已放置设备，避免重复建模。"
              : "当前没有可放置设备，先检查 HA 连接或设备域。",
          steps: s.selectedEntityName
            ? ["点击房间落点", "拖动设备微调位置", "在右侧切换模型样式"]
            : ["筛选设备类型", "选择一个实体", "点击画布完成放置"],
        }
      : s.tool === "wall"
        ? {
            title: s.wallTraceCount ? "墙体轮廓绘制中" : "从墙体开始搭建户型",
            body: s.wallTraceCount
              ? "连续点击可快速画出闭合房间，靠近起点时会自动闭合。"
              : `${s.wallsCount} 面墙，${s.roomsCount} 个房间。绘制闭合墙体后会自动识别房间。`,
            steps: s.wallTraceCount
              ? ["继续点击下一段墙", "靠近起点闭合", "右侧统一调整墙高墙厚"]
              : ["点击第一个墙角", "按房间轮廓连续点击", "闭合后检查房间命名"],
          }
        : s.tool === "furniture"
          ? {
              title: "家具用于校验空间尺度",
              body: `当前选择 ${s.selectedFurnitureLabel ?? "家具"}，放置后可拖拽、旋转和缩放。`,
              steps: ["选择家具类型", "点击房间位置", "拖动控制点微调"],
            }
          : s.tool === "blueprint"
            ? {
                title: s.hasBlueprint ? "底图已导入" : "导入底图更快还原户型",
                body: s.hasBlueprint
                  ? "建议先完成比例尺标定，再沿底图描墙体。"
                  : "支持 PNG、JPG 和 WebP，可用标定线把图纸比例转为真实尺寸。",
                steps: s.hasBlueprint
                  ? ["调整透明度", "选择标定线", "应用真实长度"]
                  : ["导入户型底图", "选择已知长度", "开始描绘墙体"],
              }
            : {
                title: "选择对象查看详情",
                body: s.roomsCount
                  ? "点击墙体、房间、设备或家具，可在右侧查看详情和控制项。"
                  : "建议先绘制闭合墙体，系统会自动识别房间。",
                steps: s.roomsCount
                  ? ["左键点击对象，右侧编辑属性", "未选中时，右键拖动空白处平移", "左键拖动框选；Esc 取消选择"]
                  : ["绘制墙体", "闭合生成房间", "放置 HA 设备"],
              };
}
function Ec(s, i) {
  return s === "loading"
    ? { label: "加载中", className: "loading" }
    : s === "error"
      ? { label: "应用异常", className: "error" }
      : i != null && i.connected
        ? { label: "HA 已连接", className: "ready" }
        : i != null && i.mock
          ? { label: "HA 未配置", className: "loading" }
          : i != null && i.reconnecting
            ? { label: "HA 重连中", className: "loading" }
            : { label: "HA 未连接", className: "loading" };
}
const Lc = x.lazy(() =>
    import("./author-support-dialog.js").then((s) => ({
      default: s.AuthorSupportDialog,
    })),
  ),
  Kt = 0.1,
  Pc = 0.05,
  qn = 0.05,
  Dc = 1,
  Ac = 5,
  Fc = 4,
  Tc = 0.6,
  Hc = 3.5,
  ar = (s) => Math.max(Tc, Math.min(Hc, s)),
  Ie = (s, i, o = -Number.MAX_SAFE_INTEGER, d = Number.MAX_SAFE_INTEGER) =>
    Number.isFinite(s) ? Math.min(d, Math.max(o, s)) : i,
  xt = (s, i = 2) => Number(s.toFixed(i)),
  pi = 0.56,
  ui = 0.32,
  dn = 1.16,
  rr = 0.35,
  or = 3,
  lr = 0.2,
  cr = 1.7,
  mi = 1,
  fi = 1.2,
  hn = 1.16,
  dr = 0.45,
  hr = 6,
  pr = 0.45,
  ur = 3.5,
  xi = 0.92,
  gi = 0.2,
  ji = 0.34,
  Zn = 1.16,
  mr = 0.45,
  fr = 3.5,
  xr = 0.08,
  gr = 0.45,
  jr = 0.18,
  yr = 1.2,
  yi = 25,
  vi = 300,
  Wr = () => [dn, dn, dn],
  Xr = (s) => (s.scale ? [...s.scale] : Wr()),
  zc = (s) => {
    const i = Xr(s);
    return { width: pi * i[0], height: ui * i[1] };
  },
  bi = () => [hn, hn, hn],
  Yr = (s) => (s.scale ? [...s.scale] : bi()),
  Rc = (s) => {
    const i = Yr(s);
    return { width: mi * i[0], height: fi * i[1] };
  },
  wi = () => [Zn, Zn, Zn],
  Ur = (s) => (s.scale ? [...s.scale] : wi()),
  Oc = (s) => {
    const i = Ur(s);
    return { width: xi * i[0], thickness: gi * i[1], depth: ji * i[2] };
  },
  Gr = (s) =>
    s === "media_player.tv" ||
    s === "climate.central_ac" ||
    s === "light.strip" ||
    (["cover.curtain", "cover.sheer"].includes(s)) ||
    s === "cover.blind"
      ? [1.16, 1.16, 1.16]
      : [
            "light.floor_lamp",
            "climate.floor_ac",
            "fan.floor",
            "fan.tower",
          ].includes(s ?? "")
        ? [1.12, 1.12, 1.12]
        : s === "vacuum.robot"
          ? [1.22, 1.22, 1.22]
          : s === "light.downlight"
            ? [1, 1, 1]
            : [
                  "light.ceiling_panel",
                  "light.ceiling_round",
                  "light.wall_sconce",
                ].includes(s ?? "")
              ? [1.04, 1.04, 1.04]
              : s != null && s.startsWith("camera.")
                ? [1.02, 1.02, 1.02]
                : [
                      "binary_sensor.motion",
                      "binary_sensor.presence",
                      "binary_sensor.smoke",
                    ].includes(s ?? "")
                  ? [1.34, 1.34, 1.34]
                  : s === "lock.door"
                    ? [1.28, 1.28, 1.28]
                    : [1.24, 1.24, 1.24],
  qr = (s, i) => {
    if (!s) return 1;
    const o = Gr(i),
      d = s.map((c, f) => c / (o[f] || 1));
    return d.reduce((c, f) => c + f, 0) / d.length;
  },
  Vc = (s, i) => Math.round(qr(s.scale, i) * 100),
  Qn = (s, i) => {
    const o = Ie(i, 100, yi, vi) / 100;
    return Gr(s).map((c) => xt(c * o, 4));
  },
  Jn = (s) => {
    const i = [];
    return (
      s !== void 0 && i.push(`rotate(${s})`),
      i.length ? i.join(" ") : void 0
    );
  },
  Zr = [
    {
      label: "导航",
      items: [
        {
          id: "select",
          label: "选择",
          icon: Wl,
          shortcut: "V",
          description: "选择与拖拽对象",
        },
        {
          id: "pan",
          label: "平移",
          icon: Rl,
          shortcut: "H",
          description: "移动画布视图",
        },
      ],
    },
    {
      label: "绘制",
      items: [
        {
          id: "wall",
          label: "墙体",
          icon: $l,
          shortcut: "W",
          description: "绘制墙体轮廓",
        },
        {
          id: "door",
          label: "门",
          icon: El,
          shortcut: "D",
          description: "放置门洞",
        },
        {
          id: "window",
          label: "窗",
          icon: ul,
          shortcut: "N",
          description: "放置窗体",
        },
      ],
    },
    {
      label: "放置",
      items: [
        {
          id: "furniture",
          label: "家具",
          icon: Rr,
          shortcut: "F",
          description: "打开家具库",
        },
        {
          id: "device",
          label: "设备",
          icon: on,
          shortcut: "E",
          description: "打开设备库",
        },
      ],
    },
    {
      label: "参考",
      items: [
        {
          id: "blueprint",
          label: "贴图",
          icon: Or,
          shortcut: "B",
          description: "导入、调整与标定参考底图",
        },
      ],
    },
  ],
  vr = Zr.flatMap((s) => s.items),
  st = "all",
  br = [
    "light",
    "switch",
    "cover",
    "climate",
    "sensor",
    "binary_sensor",
    "camera",
    "lock",
    "fan",
    "media_player",
    "vacuum",
    "alarm_control_panel",
  ],
  Bc = new Set([
    "light",
    "switch",
    "cover",
    "climate",
    "sensor",
    "binary_sensor",
    "camera",
    "lock",
    "fan",
    "media_player",
    "vacuum",
    "alarm_control_panel",
  ]),
  Kc = new Set([
    "temperature",
    "humidity",
    "illuminance",
    "carbon_dioxide",
    "carbon_monoxide",
    "pm1",
    "pm10",
    "pm25",
    "volatile_organic_compounds",
  ]),
  Wc = new Set([
    "motion",
    "occupancy",
    "presence",
    "door",
    "window",
    "opening",
    "lock",
    "smoke",
    "gas",
    "moisture",
    "safety",
    "problem",
  ]),
  gt = {
    sofa: { label: "沙发", width: 2.2, depth: 0.9, height: 0.68 },
    bed: { label: "床", width: 1.8, depth: 2, height: 0.42 },
    dining_table: { label: "餐桌", width: 1.4, depth: 0.82, height: 0.62 },
    desk: { label: "书桌", width: 1.2, depth: 0.6, height: 0.62 },
    cabinet: { label: "柜体", width: 1.6, depth: 0.6, height: 0.72 },
    kitchen_island: { label: "岛台", width: 1.8, depth: 0.9, height: 0.72 },
    coffee_table: { label: "茶几", width: 1, depth: 0.55, height: 0.3 },
    side_table: { label: "边几", width: 0.48, depth: 0.48, height: 0.45 },
    wash_basin: { label: "洗手盆", width: 0.6, depth: 0.48, height: 0.82 },
    vanity_mirror_cabinet: {
      label: "洗漱台镜柜",
      width: 0.9,
      depth: 0.55,
      height: 1.82,
    },
    shower_enclosure: { label: "淋浴间", width: 0.9, depth: 0.9, height: 2 },
    shower_fixture: { label: "喷淋器", width: 0.25, depth: 0.35, height: 2.05 },
    toilet: { label: "马桶", width: 0.43, depth: 0.68, height: 0.48 },
    water_heater: { label: "热水器", width: 0.58, depth: 0.32, height: 0.72 },
    squat_toilet: { label: "蹲便器", width: 0.62, depth: 0.82, height: 0.16 },
    gas_stove: { label: "燃气灶", width: 0.72, depth: 0.52, height: 0.12 },
  },
  Xc = new Set(["wash_basin", "water_heater", "squat_toilet"]),
  wr = Object.keys(gt).filter((s) => !Xc.has(s)),
  Nr = Tr.filter((s) => s.kind === "light").map((s) => ({
    id: s.id,
    label: s.label,
  })),
  Mr = (s, i) => {
    const o = Tr.find((d) => d.id === (s ?? "light.downlight"));
    return (o == null ? void 0 : o.placement) === "ceiling"
      ? Math.max(0.2, i - 0.12)
      : ((o == null ? void 0 : o.defaultHeight) ?? Math.max(0.2, i - 0.12));
  },
  Yc = (s) => {
    var i;
    return Math.max(
      ft,
      Math.abs(((i = s.scale) == null ? void 0 : i[0]) ?? 1) * ci,
    );
  },
  Uc = (s) => {
    var i;
    return -(
      ((((i = s.rotation) == null ? void 0 : i[1]) ?? 0) * 180) /
      Math.PI
    );
  },
  tt = (s) => structuredClone(s),
  $r = (s, i) => (i ? Cs(s, Kt) : s),
  Gc = (s) => [Cs(s[0], Kt), Cs(s[1], Kt)],
  Ss = (s, i) => Math.round(s / i) * i,
  qc = (s, i) => [Ss(s[0], i), Ss(s[1], i)],
  X = (s, i) => Math.hypot(s[0] - i[0], s[1] - i[1]),
  ti = (s) => {
    var i;
    return (-(((i = s.rotation) == null ? void 0 : i[1]) ?? 0) * 180) / Math.PI;
  };
function Sr(s, i, o, d, c) {
  const f = Fr(c),
    v = i.rooms.find(($) => _e(f, $.polygon)),
    presentation = resolveBoundDevicePresentation(s, o);
  return {
    id: `device-${Date.now()}`,
    entityId: s.entityId,
    deviceId: s.deviceId,
    deviceTemplateId: s.deviceTemplateId,
    customModel: presentation.customModel,
    kind: hi(s),
    floorId: i.id,
    roomId: v == null ? void 0 : v.id,
    position: [f[0], rn(s, i.height, o), f[1]],
    verticalReference: cameraModelDefinition(o) && o !== "camera.desktop" ? {targetType:"ceiling",surface:"bottom",offset:0} : {
      targetType: "floor",
      surface: "top",
      offset: rn(s, i.height, o),
    },
    rotation: [0, 0, 0],
    scale: [1, Ee[0], Ee[1]],
    modelId: o,
    lightStrip: { shape: d, points: c.map(($) => [...$]) },
  };
}
function an(s, i) {
  return os(s)
    ? {
        ...s,
        lightStrip: {
          shape: s.lightStrip.shape,
          points: s.lightStrip.points.map((o) => [
            Number((o[0] + i[0]).toFixed(4)),
            Number((o[1] + i[1]).toFixed(4)),
          ]),
        },
      }
    : s;
}
const si = (s) => [(s.start[0] + s.end[0]) / 2, (s.start[1] + s.end[1]) / 2];
function createAlignmentTargets(
  s,
  { wallId: i, wallIds: excludedWallIds, deviceId: o } = {},
) {
  const excludedWalls = new Set(excludedWallIds ?? (i ? [i] : []));
  return [
    ...s.walls
      .filter((d) => !excludedWalls.has(d.id))
      .flatMap((d) => [
        { id: d.id, kind: "wall", point: d.start },
        { id: d.id, kind: "wall", point: d.end },
        { id: d.id, kind: "wall", point: si(d) },
      ]),
    ...s.devices
      .filter((d) => d.id !== o)
      .map((d) => ({
        id: d.id,
        kind: "device",
        point: [d.position[0], d.position[2]],
      })),
  ];
}
function kr(s, i, o) {
  const d = (o[0] - i[0]) ** 2 + (o[1] - i[1]) ** 2;
  if (!d) return X(s, i);
  const c = Math.max(
    0,
    Math.min(
      1,
      ((s[0] - i[0]) * (o[0] - i[0]) + (s[1] - i[1]) * (o[1] - i[1])) / d,
    ),
  );
  return X(s, [i[0] + (o[0] - i[0]) * c, i[1] + (o[1] - i[1]) * c]);
}
function Cr(s, i, o) {
  const d = (o[0] - i[0]) ** 2 + (o[1] - i[1]) ** 2;
  if (!d) return { point: i, t: 0, distance: X(s, i) };
  const c = Math.max(
      0,
      Math.min(
        1,
        ((s[0] - i[0]) * (o[0] - i[0]) + (s[1] - i[1]) * (o[1] - i[1])) / d,
      ),
    ),
    f = [i[0] + (o[0] - i[0]) * c, i[1] + (o[1] - i[1]) * c];
  return { point: f, t: c, distance: X(s, f) };
}
const mn = (s) => `${s.entityId} ${s.name}`.toLowerCase(),
  Qc = (s, i) => {
    const o = i.trim().toLowerCase();
    if (!o) return !0;
    const d =
      `${s.entityId} ${s.name} ${jt(s.domain)} ${Mi(s)} ${ls(s)}`.toLowerCase();
    return o.split(/\s+/).every((c) => d.includes(c));
  },
  Jc = (s, i) => {
    var f, v;
    const o = (s == null ? void 0 : s.domain) ?? i.split(".")[0],
      d = i.includes(".") ? i.split(".").slice(1).join(".") : i,
      c =
        ((f = d.match(/(?:lightbulb|light|lamp)[._-]*(\d+)$/i)) == null
          ? void 0
          : f[1]) ??
        ((v = d.match(/(?:lightbulb|light|lamp)[._-]*(\d+)/i)) == null
          ? void 0
          : v[1]);
    if (o === "light") return c ? `灯 ${c}` : "灯";
    if (o === "climate") return "空调";
    if (o === "camera") return "摄像头";
    if (o === "cover") return "遮阳";
    if (o === "lock") return "门锁";
    if (o === "alarm_control_panel") return "安防";
    if (o === "switch") return "开关";
    if (o === "sensor" || o === "binary_sensor") {
      const $ = s ? Mi(s) : "";
      return $ && $ !== "传感器" ? $ : "传感器";
    }
    return jt(o) || d;
  },
  ed = (s, i) => {
    const o = ((s == null ? void 0 : s.name) || i).trim();
    if (!!!(s != null && s.name && s.name.trim() && s.name.trim() !== i))
      return Jc(s, i);
    const f = (o.includes(".") ? o.split(".").slice(1).join(".") : o)
      .replace(
        /^(light|switch|sensor|binary_sensor|cover|climate|camera|lock|alarm_control_panel)[._-]/i,
        "",
      )
      .replace(/^(lightbulb|light)[._-]/i, "")
      .replace(/_/g, " ")
      .trim();
    return f.length > 18 ? `${f.slice(0, 16)}…` : f || o;
  },
  Ir = (s) => {
    const i = Array.from(s).reduce(
      (o, d) => o + (d.charCodeAt(0) > 255 ? 0.16 : 0.085),
      0,
    );
    return Math.min(1.75, Math.max(0.58, i + 0.24));
  };
function td(s) {
  const i = mn(s);
  return i.includes("indicator_light") || i.includes("指示灯");
}
function sd(s) {
  const i = mn(s);
  return (
    !/(左右扫风|上下扫风|上下摆风|左右摆风|辅热|eco|睡眠模式|干燥功能|提示音|喜好模式|指示灯|indicator)/i.test(
      i,
    ) &&
    /(空调.*(开关|电源|power|switch|switch_status)|air.?conditioner.*(switch|power)|\bac\b.*(switch|power)|switch_status)/i.test(
      i,
    )
  );
}
function nd(s) {
  const i = mn(s);
  return sd(s)
    ? !1
    : i.includes("pairing mode") ||
        i.includes("wifi") ||
        i.includes("路由器") ||
        i.includes("_h55h00_") ||
        i.includes("左右扫风") ||
        i.includes("上下摆风") ||
        i.includes("辅热") ||
        i.includes("eco") ||
        i.includes("睡眠模式") ||
        i.includes("干燥功能") ||
        i.includes("提示音") ||
        i.includes("喜好模式") ||
        i.includes("指示灯");
}
function id(s) {
  const i = Hr(s),
    o = mn(s);
  return !!(
    (i && Kc.has(i)) ||
    o.includes("temperature") ||
    o.includes("humidity") ||
    o.includes("light level") ||
    o.includes("温度") ||
    o.includes("湿度") ||
    o.includes("照度")
  );
}
function ad(s) {
  const i = Hr(s);
  return !!(i && Wc.has(i));
}
const rd = isDoorSensorOpen;

function od(s) {
  return Bc.has(s.domain)
    ? s.domain === "light"
      ? !td(s)
      : s.domain === "switch"
        ? !nd(s)
        : s.domain === "sensor"
          ? id(s)
          : s.domain === "binary_sensor"
            ? ad(s)
            : !0
    : !1;
}
function Qr(s, i) {
  const o = br.indexOf(s),
    d = br.indexOf(i);
  return o !== d
    ? (o === -1 ? 999 : o) - (d === -1 ? 999 : d)
    : jt(s).localeCompare(jt(i), "zh-Hans-CN");
}
function ld(s, i) {
  const o = Qr(s.domain, i.domain);
  return (
    o ||
    s.name.localeCompare(i.name, "zh-Hans-CN") ||
    s.entityId.localeCompare(i.entityId)
  );
}
function cd({ options: s, activeDomain: i, onSelect: o }) {
  return t.jsx("div", {
    className: "device-filter-bar",
    role: "listbox",
    "aria-label": "按设备类型筛选",
    children: s.map((d) => {
      const c = i === d.domain;
      return t.jsxs(
        "button",
        {
          type: "button",
          className: c ? "active" : "",
          onClick: () => o(d.domain),
          "aria-pressed": c,
          title: `显示${d.label}设备`,
          children: [
            t.jsx("span", {
              className: `device-filter-icon ${d.domain === st ? "all" : `domain-${d.domain}`}`,
              children:
                d.domain === st
                  ? t.jsx(di, { size: 14 })
                  : d.domain === CUSTOM_DEVICE_FILTER
                    ? t.jsx(on, { size: 14 })
                    : t.jsx(zr, { domain: d.domain, size: 14 }),
            }),
            t.jsx("span", { children: d.label }),
            t.jsx("b", { children: d.count }),
          ],
        },
        d.domain,
      );
    }),
  });
}
function RoomFilterBar({ options: s, activeRoom: i, onSelect: o }) {
  return t.jsx("div", {
    className: "device-filter-bar device-room-filter-bar",
    role: "listbox",
    "aria-label": "按 Home Assistant 房间筛选",
    children: s.map((d) => {
      const c = i === d.id;
      return t.jsxs(
        "button",
        {
          type: "button",
          className: c ? "active" : "",
          onClick: () => o(d.id),
          "aria-pressed": c,
          title: `显示${d.label}设备`,
          children: [
            t.jsx("span", {
              className: "device-filter-icon room",
              children: t.jsx(di, { size: 14 }),
            }),
            t.jsx("span", { children: d.label }),
            t.jsx("b", { children: d.count }),
          ],
        },
        d.id,
      );
    }),
  });
}
function dd({ entity: s, device, entityCount = 1, active: i, onSelect: o }) {
  const d = Mi(s),
    customDevice = isCustomDeviceEntity(s),
    displayName = customDevice ? (device?.name ?? s.name) : s.name,
    deviceDetails = [device?.manufacturer, device?.model]
      .filter(Boolean)
      .join(" · ");
  return t.jsxs("button", {
    type: "button",
    className: i ? "active" : "",
    onClick: o,
    "aria-pressed": i,
    title: customDevice
      ? `${displayName} · ${s.deviceTemplateName ?? "自定义设备"} · ${entityCount} 个实体`
      : `${s.name} · ${vl(s)} · ${s.entityId}`,
    children: [
      t.jsx("span", {
        className: `domain-icon domain-${s.domain}`,
        children: t.jsx(zr, { domain: s.domain }),
      }),
      t.jsxs("span", {
        className: "device-library-copy",
        children: [
          t.jsx("strong", { children: displayName }),
          t.jsxs("small", {
            className: "device-library-meta",
            children: customDevice
              ? [
                  t.jsx("b", {
                    children: s.deviceTemplateName ?? "自定义设备",
                  }),
                  t.jsx("em", { children: `${entityCount} 个实体` }),
                  s.historical && t.jsx("em", { children: "历史离线" }),
                ]
              : [
                  t.jsx("b", { children: jt(s.domain) }),
                  d && t.jsx("em", { children: d }),
                  s.source === "development"
                    ? t.jsx("em", { children: "开发设备" })
                    : s.historical && t.jsx("em", { children: "历史离线" }),
                  t.jsx("i", { children: ls(s) }),
                ],
          }),
          t.jsx("small", {
            className: "entity-id-line",
            children:
              customDevice && deviceDetails
                ? deviceDetails
                : customDevice
                  ? `主实体：${s.entityId}`
                  : s.entityId,
          }),
        ],
      }),
    ],
  });
}
const ni = (s) => `model-${s.replace(/[^a-z0-9]+/gi, "-")}`,
  hd = (s) => {
    const i = Ni(s);
    return i === s ? ni(s) : `${ni(s)} ${ni(i)}`;
  },
  pd = (s) =>
    s === "ceiling"
      ? "顶面"
      : s === "wall"
        ? "墙面"
        : s === "floor"
          ? "落地"
          : "台面",
  ud = (s) =>
    s === "endpoint"
      ? "连接端点"
      : s === "axis"
        ? "已锁直"
        : s === "intersection"
          ? "对齐交点"
          : s === "alignment"
            ? "对齐辅助线"
            : "吸附墙体";
function Jr({ modelId: s }) {
  return t.jsxs("span", {
    className: `device-model-glyph ${hd(s)}`,
    "aria-hidden": "true",
    children: [t.jsx("i", {}), t.jsx("b", {}), t.jsx("em", {})],
  });
}
function _r({ entity: s, activeModelId: i, onSelect: o }) {
  const d = Ar(s),
    c = as(s);
  return d.length <= 1
    ? null
    : t.jsxs("section", {
        className: "device-model-selector",
        "aria-label": "选择设备模型样式",
        children: [
          t.jsxs("div", {
            className: "device-model-heading",
            children: [
              t.jsx("span", { children: "模型样式" }),
              t.jsx("strong", { children: jt(s.domain) }),
            ],
          }),
          t.jsx("div", {
            className: "device-model-grid",
            children: d.map((f) => {
              const v = i === f.id,
                $ = c === f.id;
              return t.jsxs(
                "button",
                {
                  type: "button",
                  className: v ? "active" : "",
                  onClick: () => o(f.id),
                  "aria-pressed": v,
                  title: f.description,
                  children: [
                    t.jsx(Jr, { modelId: f.id }),
                    t.jsxs("span", {
                      children: [
                        t.jsxs("strong", {
                          children: [
                            f.label,
                            $ && t.jsx("em", { children: "推荐" }),
                          ],
                        }),
                        t.jsxs("small", {
                          children: [pd(f.placement), " · ", f.description],
                        }),
                      ],
                    }),
                  ],
                },
                f.id,
              );
            }),
          }),
        ],
      });
}
function BoundDeviceType({ entity: s }) {
  const i = resolveBoundDevicePresentation(s, as(s));
  return t.jsxs("div", {
    className: "bound-device-type",
    role: "status",
    children: [
      t.jsxs("div", {
        children: [
          t.jsx("small", { children: "已绑定设备类型" }),
          t.jsx("strong", { children: i.templateName }),
        ],
      }),
      t.jsxs("span", {
        children: [
          "自动应用",
          i.modelName ? ` · ${i.modelName}` : " · 推荐模型",
        ],
      }),
    ],
  });
}
function Er(s, i, o) {
  const d = o ? s.devices.filter((j) => o[j.entityId]) : s.devices,
    c = [
      ...s.walls.flatMap((j) => [j.start, j.end]),
      ...s.rooms.flatMap((j) => j.polygon),
      ...d.map((j) => [j.position[0], j.position[2]]),
      ...s.furniture.flatMap((j) => [
        [j.position[0] - j.width / 2, j.position[1] - j.depth / 2],
        [j.position[0] + j.width / 2, j.position[1] + j.depth / 2],
      ]),
      ...(i
        ? [
            [i.x, i.y],
            [i.x + i.width, i.y + i.height],
          ]
        : []),
    ];
  if (!c.length) return { minX: -1, minY: -1, width: 12, height: 8 };
  const f = c.map(([j]) => j),
    v = c.map(([, j]) => j),
    $ = Math.min(...f) - 1.25,
    y = Math.min(...v) - 1.25;
  return {
    minX: $,
    minY: y,
    width: Math.max(6, Math.max(...f) - Math.min(...f) + 2.5),
    height: Math.max(5, Math.max(...v) - Math.min(...v) + 2.5),
  };
}
function Ke(s, i) {
  const o = s == null ? void 0 : s[i];
  return typeof o == "number" && Number.isFinite(o) ? o : void 0;
}
function ii(s) {
  const i = Ke(s, "worldX"),
    o = Ke(s, "worldY"),
    d = Ke(s, "worldWidth"),
    c = Ke(s, "worldHeight");
  return i !== void 0 &&
    o !== void 0 &&
    d !== void 0 &&
    c !== void 0 &&
    d > 0 &&
    c > 0
    ? { x: i, y: o, width: d, height: c }
    : void 0;
}
function is(s, i) {
  const o = Ke(s, `${i}X`),
    d = Ke(s, `${i}Y`);
  return o !== void 0 && d !== void 0 ? [o, d] : void 0;
}
function ai(s, i, o = 100) {
  const d = Math.max(0.5, s.width - 2),
    c = Math.max(0.5, s.height - 2),
    f = (Math.min(d, c * i) * o) / 100,
    v = f / i;
  return {
    x: s.minX + s.width / 2 - f / 2,
    y: s.minY + s.height / 2 - v / 2,
    width: f,
    height: v,
  };
}
function ri(s) {
  return (
    Math.abs(
      s.reduce((i, o, d) => {
        const c = s[(d + 1) % s.length];
        return i + o[0] * c[1] - c[0] * o[1];
      }, 0),
    ) / 2
  );
}
const Lr = (s, i) => JSON.stringify(s) === JSON.stringify(i);
function Pr(s) {
  return new Promise((i, o) => {
    const d = new Image();
    ((d.onload = () => i(d.naturalWidth / d.naturalHeight)),
      (d.onerror = () => o(new Error("无法读取底图尺寸"))),
      (d.src = s));
  });
}
function oi(s, i) {
  const o = X(s.start, s.end) || 1,
    d = Math.max(0, Math.min(1, i / o));
  return [
    s.start[0] + (s.end[0] - s.start[0]) * d,
    s.start[1] + (s.end[1] - s.start[1]) * d,
  ];
}
function _e(s, i) {
  let o = !1;
  for (let d = 0, c = i.length - 1; d < i.length; c = d++) {
    const [f, v] = i[d],
      [$, y] = i[c];
    v > s[1] != y > s[1] &&
      s[0] < (($ - f) * (s[1] - v)) / (y - v || Number.EPSILON) + f &&
      (o = !o);
  }
  return o;
}
function li({ device: s, entity: i }) {
  const o = ws(s, i),
    d = Ni(o.id);
  if(s.kind === "camera") return t.jsx(CameraPlanGlyph,{dual:o.id === "camera.dual" || s.customModel?.source?.shape === "camera-dual" || i?.deviceModel?.source?.shape === "camera-dual"});
  if (we(o.id)) {
    if (os(s)) {
      const f = [s.position[0], s.position[2]],
        v = Lt(s),
        $ = rs(v, Bt(s)),
        y = (j) => [j[0] - f[0], j[1] - f[1]];
      return t.jsxs("g", {
        className: "device-glyph-light-strip",
        children: [
          $.map((j, S) => {
            const _ = y(j.start),
              H = y(j.end);
            return t.jsx(
              "line",
              {
                x1: _[0],
                y1: _[1],
                x2: H[0],
                y2: H[1],
                className: "device-strip-hitbox",
              },
              `hit-${S}`,
            );
          }),
          $.map((j, S) => {
            const _ = y(j.start),
              H = y(j.end);
            return t.jsx(
              "line",
              {
                x1: _[0],
                y1: _[1],
                x2: H[0],
                y2: H[1],
                className: "device-glyph-strip-backdrop",
              },
              `backdrop-${S}`,
            );
          }),
          $.map((j, S) => {
            const _ = y(j.start),
              H = y(j.end);
            return t.jsx(
              "line",
              {
                x1: _[0],
                y1: _[1],
                x2: H[0],
                y2: H[1],
                className: "device-glyph-strip-track",
              },
              `track-${S}`,
            );
          }),
          $.map((j, S) => {
            const _ = y(j.start),
              H = y(j.end);
            return t.jsx(
              "line",
              {
                x1: _[0],
                y1: _[1],
                x2: H[0],
                y2: H[1],
                className: "device-glyph-strip-core",
              },
              `core-${S}`,
            );
          }),
          v.map((j, S) => {
            const _ = y(j);
            return t.jsx(
              "circle",
              {
                cx: _[0],
                cy: _[1],
                r: "0.055",
                className: "device-glyph-strip-end",
              },
              `point-${S}`,
            );
          }),
        ],
      });
    }
    const c = Ns(s);
    return t.jsxs("g", {
      className: "device-glyph-light-strip",
      children: [
        t.jsx("line", {
          x1: -c / 2,
          y1: "0",
          x2: c / 2,
          y2: "0",
          className: "device-strip-hitbox",
        }),
        t.jsx("line", {
          x1: -c / 2,
          y1: "0",
          x2: c / 2,
          y2: "0",
          className: "device-glyph-strip-track",
        }),
        t.jsx("rect", {
          x: -c / 2,
          y: "-0.047",
          width: c,
          height: "0.094",
          rx: "0.04",
          className: "device-glyph-core device-glyph-strip",
        }),
        t.jsx("circle", {
          cx: -c / 2,
          cy: "0",
          r: "0.055",
          className: "device-glyph-strip-end",
        }),
        t.jsx("circle", {
          cx: c / 2,
          cy: "0",
          r: "0.055",
          className: "device-glyph-strip-end",
        }),
      ],
    });
  }
  return d === "light.floor_lamp"
    ? t.jsx("path", {
        d: "M 0 -0.16 V 0.12 M -0.12 0.15 H 0.12 M -0.11 -0.16 H 0.11",
        className: "device-glyph-stroke",
      })
    : d === "light.chandelier"
      ? t.jsx("path", {
          d: "M 0 -0.16 V -0.02 M -0.14 0.1 Q 0 -0.04 0.14 0.1 Z",
          className: "device-glyph-core",
        })
      : d === "light.wall_sconce"
        ? t.jsxs("g", {
            children: [
              t.jsx("path", {
                d: "M -0.16 -0.08 H -0.08 V 0.08 H -0.16 Z",
                className: "device-glyph-core",
              }),
              t.jsx("path", {
                d: "M -0.07 -0.11 Q 0.12 0  -0.07 0.11 Z",
                className: "device-glyph-stroke",
              }),
            ],
          })
        : d === "light.ceiling_panel"
          ? t.jsx("rect", {
              x: "-0.17",
              y: "-0.105",
              width: "0.34",
              height: "0.21",
              rx: "0.04",
              className: "device-glyph-core",
            })
          : d === "light.ceiling_round"
            ? t.jsxs("g", {
                children: [
                  t.jsx("circle", {
                    r: "0.12",
                    className: "device-glyph-core",
                  }),
                  t.jsx("circle", {
                    r: "0.07",
                    className: "device-glyph-stroke glyph-on-fill",
                  }),
                ],
              })
            : d === "light.downlight"
              ? t.jsx("circle", { r: "0.075", className: "device-glyph-core" })
              : d.startsWith("light.")
                ? t.jsx("circle", { r: "0.13", className: "device-glyph-core" })
                : o.id === "switch.outlet"
                  ? t.jsxs("g", {
                      children: [
                        t.jsx("rect", {
                          x: "-0.12",
                          y: "-0.15",
                          width: "0.24",
                          height: "0.3",
                          rx: "0.04",
                          className: "device-glyph-core",
                        }),
                        t.jsx("path", {
                          d: "M -0.045 -0.045 V 0.045 M 0.045 -0.045 V 0.045",
                          className: "device-glyph-stroke glyph-on-fill",
                        }),
                      ],
                    })
                  : o.id === "switch.ac_airflow"
                    ? t.jsxs("g", {
                        children: [
                          t.jsx("rect", {
                            x: "-0.13",
                            y: "-0.16",
                            width: "0.26",
                            height: "0.32",
                            rx: "0.04",
                            className: "device-glyph-core",
                          }),
                          t.jsx("path", {
                            d: "M -0.07 -0.055 H 0.07 M -0.075 0.01 Q -0.025 -0.03 0.025 0.01 T 0.12 0.01 M -0.09 0.075 Q -0.035 0.035 0.02 0.075 T 0.12 0.075",
                            className: "device-glyph-stroke glyph-on-fill",
                          }),
                        ],
                      })
                    : o.id === "switch.double"
                      ? t.jsxs("g", {
                          children: [
                            t.jsx("rect", {
                              x: "-0.13",
                              y: "-0.16",
                              width: "0.26",
                              height: "0.32",
                              rx: "0.04",
                              className: "device-glyph-core",
                            }),
                            t.jsx("path", {
                              d: "M 0 -0.12 V 0.12",
                              className: "device-glyph-stroke glyph-on-fill",
                            }),
                          ],
                        })
                      : o.id === "switch.triple"
                        ? t.jsxs("g", {
                            children: [
                              t.jsx("rect", {
                                x: "-0.15",
                                y: "-0.16",
                                width: "0.3",
                                height: "0.32",
                                rx: "0.04",
                                className: "device-glyph-core",
                              }),
                              t.jsx("path", {
                                d: "M -0.05 -0.12 V 0.12 M 0.05 -0.12 V 0.12",
                                className: "device-glyph-stroke glyph-on-fill",
                              }),
                            ],
                          })
                        : o.id === "switch.scene"
                          ? t.jsx("g", {
                              children: [-0.06, 0.06].flatMap((c) =>
                                [-0.06, 0.06].map((f) =>
                                  t.jsx(
                                    "circle",
                                    {
                                      cx: c,
                                      cy: f,
                                      r: "0.038",
                                      className: "device-glyph-core",
                                    },
                                    `${c}-${f}`,
                                  ),
                                ),
                              ),
                            })
                          : o.id.startsWith("switch.")
                            ? t.jsx("rect", {
                                x: "-0.11",
                                y: "-0.15",
                                width: "0.22",
                                height: "0.3",
                                rx: "0.04",
                                className: "device-glyph-core",
                              })
                            : o.id === "cover.blind"
                              ? t.jsx("path", {
                                  d: "M -0.17 -0.11 H 0.17 M -0.15 -0.04 H 0.15 M -0.13 0.03 H 0.13 M -0.15 0.1 H 0.15",
                                  className: "device-glyph-stroke",
                                })
                              : s.kind === "cover"
                                ? t.jsx("rect", {
                                    x: "-0.15",
                                    y: "-0.11",
                                    width: "0.3",
                                    height: "0.22",
                                    rx: "0.04",
                                    className: "device-glyph-core",
                                  })
                                : o.id === "climate.floor_ac"
                                  ? t.jsx("path", {
                                      d: "M -0.07 -0.17 H 0.07 Q 0.12 -0.17 0.12 -0.12 V 0.14 Q 0.12 0.18 0.07 0.18 H -0.07 Q -0.12 0.18 -0.12 0.14 V -0.12 Q -0.12 -0.17 -0.07 -0.17 Z M -0.06 -0.02 H 0.06 M -0.06 0.04 H 0.06 M -0.06 0.1 H 0.06",
                                      className: "device-glyph-stroke",
                                    })
                                  : o.id === "climate.central_ac"
                                    ? t.jsxs("g", {
                                        children: [
                                          t.jsx("rect", {
                                            x: "-0.2",
                                            y: "-0.085",
                                            width: "0.4",
                                            height: "0.17",
                                            rx: "0.035",
                                            className: "device-glyph-core",
                                          }),
                                          t.jsx("path", {
                                            d: "M -0.15 -0.045 H 0.15 M -0.15 -0.012 H 0.15 M -0.15 0.021 H 0.15 M -0.12 0.07 Q -0.04 0.12 0.04 0.07 T 0.16 0.07",
                                            className:
                                              "device-glyph-stroke glyph-on-fill",
                                          }),
                                        ],
                                      })
                                    : o.id === "climate.thermostat"
                                      ? t.jsxs("g", {
                                          children: [
                                            t.jsx("rect", {
                                              x: "-0.13",
                                              y: "-0.13",
                                              width: "0.26",
                                              height: "0.26",
                                              rx: "0.04",
                                              className: "device-glyph-core",
                                            }),
                                            t.jsx("circle", {
                                              r: "0.055",
                                              className:
                                                "device-glyph-stroke glyph-on-fill",
                                            }),
                                          ],
                                        })
                                      : s.kind === "climate"
                                        ? t.jsx("rect", {
                                            x: "-0.16",
                                            y: "-0.08",
                                            width: "0.32",
                                            height: "0.16",
                                            rx: "0.04",
                                            className: "device-glyph-core",
                                          })
                                        : o.id === "sensor.temperature"
                                          ? t.jsx("path", {
                                              d: "M 0 -0.15 V 0.07 M -0.05 0.1 A 0.05 0.05 0 1 0 0.05 0.1 A 0.05 0.05 0 1 0 -0.05 0.1",
                                              className: "device-glyph-stroke",
                                            })
                                          : o.id === "sensor.light_level"
                                            ? t.jsx("path", {
                                                d: "M 0 -0.1 V -0.16 M 0 0.16 V 0.1 M -0.16 0 H -0.1 M 0.1 0 H 0.16 M -0.1 -0.1 L -0.06 -0.06 M 0.1 -0.1 L 0.06 -0.06 M -0.1 0.1 L -0.06 0.06 M 0.1 0.1 L 0.06 0.06 M -0.055 0 A 0.055 0.055 0 1 0 0.055 0 A 0.055 0.055 0 1 0 -0.055 0",
                                                className:
                                                  "device-glyph-stroke",
                                              })
                                            : o.id === "sensor.co2"
                                              ? t.jsxs("g", {
                                                  children: [
                                                    t.jsx("rect", {
                                                      x: "-0.13",
                                                      y: "-0.12",
                                                      width: "0.26",
                                                      height: "0.24",
                                                      rx: "0.045",
                                                      className:
                                                        "device-glyph-core",
                                                    }),
                                                    t.jsx("path", {
                                                      d: "M -0.085 0.015 H 0.085 M -0.065 -0.055 H 0.065",
                                                      className:
                                                        "device-glyph-stroke glyph-on-fill",
                                                    }),
                                                  ],
                                                })
                                              : o.id === "sensor.pm25"
                                                ? t.jsx("g", {
                                                    children: [
                                                      -0.07, 0, 0.07, -0.035,
                                                      0.035,
                                                    ].map((c, f) =>
                                                      t.jsx(
                                                        "circle",
                                                        {
                                                          cx: c,
                                                          cy:
                                                            f > 2
                                                              ? "0.045"
                                                              : "-0.035",
                                                          r: "0.026",
                                                          className:
                                                            "device-glyph-core",
                                                        },
                                                        f,
                                                      ),
                                                    ),
                                                  })
                                                : o.id === "sensor.air_quality"
                                                  ? t.jsxs("g", {
                                                      children: [
                                                        [-0.07, 0, 0.07].map(
                                                          (c) =>
                                                            t.jsx(
                                                              "circle",
                                                              {
                                                                cx: c,
                                                                cy: "-0.02",
                                                                r: "0.038",
                                                                className:
                                                                  "device-glyph-core",
                                                              },
                                                              c,
                                                            ),
                                                        ),
                                                        t.jsx("path", {
                                                          d: "M -0.11 0.09 H 0.11",
                                                          className:
                                                            "device-glyph-stroke",
                                                        }),
                                                      ],
                                                    })
                                                  : o.id === "sensor.power"
                                                    ? t.jsx("path", {
                                                        d: "M -0.11 0.12 V 0.02 M 0 0.12 V -0.06 M 0.11 0.12 V -0.13",
                                                        className:
                                                          "device-glyph-stroke",
                                                      })
                                                    : o.id.startsWith("sensor.")
                                                      ? t.jsx("circle", {
                                                          r: "0.1",
                                                          className:
                                                            "device-glyph-core",
                                                        })
                                                      : o.id ===
                                                          "binary_sensor.motion"
                                                        ? t.jsx("path", {
                                                            d: "M -0.13 0.08 Q 0 -0.13 0.13 0.08 M -0.06 0.08 Q 0 -0.02 0.06 0.08",
                                                            className:
                                                              "device-glyph-stroke",
                                                          })
                                                        : o.id ===
                                                            "binary_sensor.presence"
                                                          ? t.jsxs("g", {
                                                              children: [
                                                                t.jsx(
                                                                  "circle",
                                                                  {
                                                                    r: "0.095",
                                                                    className:
                                                                      "device-glyph-core",
                                                                  },
                                                                ),
                                                                t.jsx("path", {
                                                                  d: "M -0.16 0 Q 0 -0.17 0.16 0 M -0.12 0.07 Q 0 -0.045 0.12 0.07",
                                                                  className:
                                                                    "device-glyph-stroke",
                                                                }),
                                                              ],
                                                            })
                                                          : o.id ===
                                                              "binary_sensor.door"
                                                            ? t.jsx("path", {
                                                                d: "M -0.1 -0.15 H 0.02 V 0.15 H -0.1 Z M 0.07 -0.11 H 0.14 V 0.11 H 0.07 Z",
                                                                className:
                                                                  "device-glyph-stroke",
                                                              })
                                                            : o.id ===
                                                                "binary_sensor.water"
                                                              ? t.jsx("path", {
                                                                  d: "M 0 -0.14 Q 0.12 0.02 0.12 0.08 A 0.12 0.12 0 0 1 -0.12 0.08 Q -0.12 0.02 0 -0.14 Z",
                                                                  className:
                                                                    "device-glyph-core",
                                                                })
                                                              : o.id ===
                                                                  "camera.dome"
                                                                ? t.jsx(
                                                                    "path",
                                                                    {
                                                                      d: "M -0.15 0.02 A 0.15 0.15 0 0 1 0.15 0.02 V 0.08 H -0.15 Z M -0.08 -0.04 H 0.08",
                                                                      className:
                                                                        "device-glyph-stroke",
                                                                    },
                                                                  )
                                                                : o.id ===
                                                                    "camera.bullet"
                                                                  ? t.jsxs(
                                                                      "g",
                                                                      {
                                                                        children:
                                                                          [
                                                                            t.jsx(
                                                                              "rect",
                                                                              {
                                                                                x: "-0.15",
                                                                                y: "-0.07",
                                                                                width:
                                                                                  "0.22",
                                                                                height:
                                                                                  "0.14",
                                                                                rx: "0.035",
                                                                                className:
                                                                                  "device-glyph-core",
                                                                              },
                                                                            ),
                                                                            t.jsx(
                                                                              "path",
                                                                              {
                                                                                d: "M 0.07 -0.04 L 0.16 -0.075 V 0.075 L 0.07 0.04 Z",
                                                                                className:
                                                                                  "device-glyph-stroke",
                                                                              },
                                                                            ),
                                                                          ],
                                                                      },
                                                                    )
                                                                  : o.id ===
                                                                      "camera.doorbell"
                                                                    ? t.jsxs(
                                                                        "g",
                                                                        {
                                                                          children:
                                                                            [
                                                                              t.jsx(
                                                                                "rect",
                                                                                {
                                                                                  x: "-0.08",
                                                                                  y: "-0.16",
                                                                                  width:
                                                                                    "0.16",
                                                                                  height:
                                                                                    "0.32",
                                                                                  rx: "0.04",
                                                                                  className:
                                                                                    "device-glyph-core",
                                                                                },
                                                                              ),
                                                                              t.jsx(
                                                                                "circle",
                                                                                {
                                                                                  cy: "-0.055",
                                                                                  r: "0.032",
                                                                                  className:
                                                                                    "device-glyph-stroke glyph-on-fill",
                                                                                },
                                                                              ),
                                                                              t.jsx(
                                                                                "circle",
                                                                                {
                                                                                  cy: "0.075",
                                                                                  r: "0.026",
                                                                                  className:
                                                                                    "device-glyph-stroke glyph-on-fill",
                                                                                },
                                                                              ),
                                                                            ],
                                                                        },
                                                                      )
                                                                    : s.kind ===
                                                                        "camera"
                                                                      ? t.jsx(
                                                                          "path",
                                                                          {
                                                                            d: "M -0.15 -0.08 H 0.08 V 0.08 H -0.15 Z M 0.08 -0.04 L 0.17 -0.08 V 0.08 L 0.08 0.04 Z",
                                                                            className:
                                                                              "device-glyph-core",
                                                                          },
                                                                        )
                                                                      : o.id ===
                                                                          "fan.floor"
                                                                        ? t.jsx(
                                                                            "path",
                                                                            {
                                                                              d: "M 0 -0.16 V 0.12 M -0.11 0.14 H 0.11 M -0.12 -0.07 A 0.12 0.12 0 1 0 0.12 -0.07 A 0.12 0.12 0 1 0 -0.12 -0.07",
                                                                              className:
                                                                                "device-glyph-stroke",
                                                                            },
                                                                          )
                                                                        : o.id ===
                                                                            "fan.tower"
                                                                          ? t.jsxs(
                                                                              "g",
                                                                              {
                                                                                children:
                                                                                  [
                                                                                    t.jsx(
                                                                                      "rect",
                                                                                      {
                                                                                        x: "-0.07",
                                                                                        y: "-0.17",
                                                                                        width:
                                                                                          "0.14",
                                                                                        height:
                                                                                          "0.3",
                                                                                        rx: "0.055",
                                                                                        className:
                                                                                          "device-glyph-core",
                                                                                      },
                                                                                    ),
                                                                                    t.jsx(
                                                                                      "path",
                                                                                      {
                                                                                        d: "M -0.035 -0.1 H 0.035 M -0.035 -0.045 H 0.035 M -0.035 0.01 H 0.035 M -0.08 0.16 H 0.08",
                                                                                        className:
                                                                                          "device-glyph-stroke glyph-on-fill",
                                                                                      },
                                                                                    ),
                                                                                  ],
                                                                              },
                                                                            )
                                                                          : s.kind ===
                                                                              "fan"
                                                                            ? t.jsx(
                                                                                "path",
                                                                                {
                                                                                  d: "M 0 0 L 0.16 -0.03 M 0 0 L -0.05 0.15 M 0 0 L -0.11 -0.12",
                                                                                  className:
                                                                                    "device-glyph-stroke",
                                                                                },
                                                                              )
                                                                            : o.id ===
                                                                                "media_player.speaker"
                                                                              ? t.jsxs(
                                                                                  "g",
                                                                                  {
                                                                                    children:
                                                                                      [
                                                                                        t.jsx(
                                                                                          "rect",
                                                                                          {
                                                                                            x: "-0.1",
                                                                                            y: "-0.16",
                                                                                            width:
                                                                                              "0.2",
                                                                                            height:
                                                                                              "0.32",
                                                                                            rx: "0.04",
                                                                                            className:
                                                                                              "device-glyph-core",
                                                                                          },
                                                                                        ),
                                                                                        t.jsx(
                                                                                          "circle",
                                                                                          {
                                                                                            cy: "-0.06",
                                                                                            r: "0.045",
                                                                                            className:
                                                                                              "device-glyph-stroke glyph-on-fill",
                                                                                          },
                                                                                        ),
                                                                                        t.jsx(
                                                                                          "circle",
                                                                                          {
                                                                                            cy: "0.07",
                                                                                            r: "0.035",
                                                                                            className:
                                                                                              "device-glyph-stroke glyph-on-fill",
                                                                                          },
                                                                                        ),
                                                                                      ],
                                                                                  },
                                                                                )
                                                                              : s.kind ===
                                                                                  "media_player"
                                                                                ? t.jsx(
                                                                                    "rect",
                                                                                    {
                                                                                      x: "-0.17",
                                                                                      y: "-0.1",
                                                                                      width:
                                                                                        "0.34",
                                                                                      height:
                                                                                        "0.2",
                                                                                      rx: "0.03",
                                                                                      className:
                                                                                        "device-glyph-core",
                                                                                    },
                                                                                  )
                                                                                : o.id ===
                                                                                    "vacuum.robot"
                                                                                  ? t.jsxs(
                                                                                      "g",
                                                                                      {
                                                                                        children:
                                                                                          [
                                                                                            t.jsx(
                                                                                              "circle",
                                                                                              {
                                                                                                r: "0.15",
                                                                                                className:
                                                                                                  "device-glyph-core",
                                                                                              },
                                                                                            ),
                                                                                            t.jsx(
                                                                                              "circle",
                                                                                              {
                                                                                                cx: "0.035",
                                                                                                cy: "-0.04",
                                                                                                r: "0.04",
                                                                                                className:
                                                                                                  "device-glyph-stroke glyph-on-fill",
                                                                                              },
                                                                                            ),
                                                                                            t.jsx(
                                                                                              "path",
                                                                                              {
                                                                                                d: "M -0.08 0.075 Q 0 0.12 0.08 0.075",
                                                                                                className:
                                                                                                  "device-glyph-stroke glyph-on-fill",
                                                                                              },
                                                                                            ),
                                                                                          ],
                                                                                      },
                                                                                    )
                                                                                  : o.id ===
                                                                                      "lock.door"
                                                                                    ? t.jsxs(
                                                                                        "g",
                                                                                        {
                                                                                          children:
                                                                                            [
                                                                                              t.jsx(
                                                                                                "rect",
                                                                                                {
                                                                                                  x: "-0.105",
                                                                                                  y: "-0.16",
                                                                                                  width:
                                                                                                    "0.21",
                                                                                                  height:
                                                                                                    "0.32",
                                                                                                  rx: "0.045",
                                                                                                  className:
                                                                                                    "device-glyph-core",
                                                                                                },
                                                                                              ),
                                                                                              t.jsx(
                                                                                                "path",
                                                                                                {
                                                                                                  d: "M -0.045 -0.055 A 0.045 0.045 0 0 1 0.045 -0.055 V -0.01 H -0.045 Z M 0 0.035 V 0.095",
                                                                                                  className:
                                                                                                    "device-glyph-stroke glyph-on-fill",
                                                                                                },
                                                                                              ),
                                                                                            ],
                                                                                        },
                                                                                      )
                                                                                    : t.jsx(
                                                                                        "circle",
                                                                                        {
                                                                                          r: "0.09",
                                                                                          className:
                                                                                            "device-glyph-core",
                                                                                        },
                                                                                      );
}
function Dr({ kind: s }) {
  return t.jsxs("span", {
    className: `furniture-pictogram ${s}`,
    "aria-hidden": "true",
    children: [t.jsx("i", {}), t.jsx("b", {}), t.jsx("em", {})],
  });
}
function VerticalReferenceEditor({ floor, type, item, entities, onChange }) {
  const legacyOffset =
      type === "device"
        ? Number(item.position?.[1] ?? 0)
        : Number(item.elevation ?? 0),
    reference = normalizeVerticalReference(
      item.verticalReference,
      legacyOffset,
    ),
    currentValue = verticalReferenceOptionValue(reference),
    elevation = getObjectVerticalElevation(floor, type, item.id, entities),
    options = [
      { value: "floor", label: "楼层地面" },
      { value: "ceiling", label: "天花板（模型顶面）" },
      ...floor.devices
        .filter((candidate) =>
          isVerticalReferenceCandidate({
            candidate,
            candidateType: "device",
            currentItem: item,
            currentEntity: entities[item.entityId],
            currentId: item.id,
            currentType: type,
            entity: entities[candidate.entityId],
          }),
        )
        .flatMap((candidate) => {
          const name =
            entities[candidate.entityId]?.name ?? candidate.entityId ?? "设备";
          return [
            { value: `device:${candidate.id}:bottom`, label: `${name} · 底面` },
            { value: `device:${candidate.id}:top`, label: `${name} · 顶面` },
          ];
        }),
      ...floor.furniture
        .filter((candidate) =>
          isVerticalReferenceCandidate({
            candidate,
            candidateType: "furniture",
            currentItem: item,
            currentEntity: entities[item.entityId],
            currentId: item.id,
            currentType: type,
          }),
        )
        .flatMap((candidate) => {
          const name = candidate.name ?? gt[candidate.kind]?.label ?? "家具";
          return [
            {
              value: `furniture:${candidate.id}:bottom`,
              label: `${name} · 底面`,
            },
            { value: `furniture:${candidate.id}:top`, label: `${name} · 顶面` },
          ];
        }),
    ];
  const currentValueAvailable = options.some(
    (option) => option.value === currentValue,
  );
  x.useEffect(() => {
    if (currentValue !== "floor" && !currentValueAvailable)
      onChange(bindVerticalReference("floor", undefined, "top"));
  }, [currentValue, currentValueAvailable]);
  return t.jsxs("div", {
    className: "property-section vertical-reference-property",
    children: [
      t.jsx("h3", { children: "水平基准面" }),
      t.jsxs("label", {
        children: [
          t.jsx("span", { children: "绑定到" }),
          t.jsx(ns, {
            value: currentValue,
            onChange: (event) => {
              const next = parseVerticalReferenceOption(event.target.value);
              onChange(
                bindVerticalReference(
                  next.targetType,
                  next.targetId,
                  next.surface,
                ),
              );
            },
            children: options.map((option) =>
              t.jsx(
                "option",
                { value: option.value, children: option.label },
                option.value,
              ),
            ),
          }),
        ],
      }),
      t.jsxs("label", {
        children: [
          t.jsx("span", { children: "相对偏移" }),
          t.jsxs("div", {
            className: "unit-input",
            children: [
              t.jsx("input", {
                type: "number",
                min: "-20",
                max: reference.targetType === "ceiling" ? "0" : "20",
                step: "0.05",
                value: Number(reference.offset.toFixed(2)),
                onChange: (event) =>
                  onChange({
                    ...reference,
                    offset: reference.targetType === "ceiling" ? Math.min(0,Number(event.target.value)||0) : Number(event.target.value)||0,
                  }),
              }),
              t.jsx("i", { children: "m" }),
            ],
          }),
        ],
      }),
      t.jsxs("p", {
        className: "field-hint",
        children: [
          "当前底面高度：",
          elevation.toFixed(2),
          " m。调整被绑定对象后会自动同步。",
        ],
      }),
    ],
  });
}
function vd({
  project: s,
  entities: i,
  devices: haDevices = [],
  status: o = "ready",
  connection: d,
  onBackHome: c,
  onOpenSettings: f,
}) {
  var Fa, Ta, Ha, za, Ra, Oa, Va;
  const haAreas = mt((e) => e.areas),
    v = mt((e) => e.saveProject),
    $ = mt((e) => e.importBlueprint),
    y = mt((e) => e.resetProject),
    j = mt((e) => e.importProject),
    S = mt((e) => e.listProjectBackups),
    _ = mt((e) => e.restoreProjectBackup),
    H = mt((e) => e.getRoomBindingSuggestions),
    W = mt((e) => e.applyRoomBindingSuggestions),
    B = mt((e) => e.selectEntity),
    [P, U] = x.useState(() => tt(s)),
    [oe, $e] = x.useState(((Fa = s.floors[0]) == null ? void 0 : Fa.id) ?? ""),
    [Le, Y] = x.useState(""),
    [xe, he] = x.useState([]),
    [nt, it] = x.useState([]),
    [L, We] = x.useState("select"),
    [D, Is] = x.useState(),
    [curtainSession, setCurtainSession] = x.useState(null),
    [pe, _s] = x.useState([]),
    [ne, cs] = x.useState(),
    [fe, Pe] = x.useState(),
    [Wt, De] = x.useState([]),
    [ds, eo] = x.useState("line"),
    [T, Se] = x.useState(),
    [at, yt] = x.useState(),
    [ie, ce] = x.useState(),
    [ae, vt] = x.useState(),
    [E, Es] = x.useState(),
    [Xe, to] = x.useState(!0),
    [rt, $i] = x.useState("2d"),
    [ye, Dt] = x.useState(1),
    [Xt, Yt] = x.useState([0, 0]),
    [Ae, fn] = x.useState(),
    [xn, gn] = x.useState(!1),
    [so, ee] = x.useState(),
    [hs, no] = x.useState(
      () =>
        typeof window < "u" &&
        window.localStorage.getItem("ha3d:show-dimensions") === "true",
    ),
    [bt, io] = x.useState(
      () =>
        typeof window < "u" &&
        window.localStorage.getItem("ha3d:show-device-labels") === "true",
    ),
    [Ls, jn] = x.useState("iso"),
    [Si, Ye] = x.useState(),
    [Ue, ve] = x.useState(!1),
    [Ut, ki] = x.useState(!1),
    [wt, Fe] = x.useState(),
    [Ps, ao] = x.useState([]),
    [Ci, Ii] = x.useState(!1),
    [Ds, _i] = x.useState([]),
    [Ei, ro] = x.useState(!1),
    [As, Li] = x.useState(),
    [Pi, Di] = x.useState(s.updatedAt),
    [yn, oo] = x.useState(!1),
    [ps, Te] = x.useState(() => typeof window > "u" || window.innerWidth > 960),
    [us, Fs] = x.useState(!1),
    [vn, bn] = x.useState(!1),
    [ot, lt] = x.useState(!1),
    [At, Ai] = x.useState(() => {
      var n, a;
      const e =
        (a =
          (n = s.assets.find((r) => {
            var l;
            return (
              ((l = r.metadata) == null ? void 0 : l.kind) ===
              "floorplan-reference"
            );
          })) == null
            ? void 0
            : n.metadata) == null
          ? void 0
          : a.opacity;
      return typeof e == "number" ? Math.round(e * 100) : 32;
    }),
    [Ft, Ts] = x.useState(() => {
      var n, a;
      const e =
        (a =
          (n = s.assets.find((r) => {
            var l;
            return (
              ((l = r.metadata) == null ? void 0 : l.kind) ===
              "floorplan-reference"
            );
          })) == null
            ? void 0
            : n.metadata) == null
          ? void 0
          : a.scalePercent;
      return typeof e == "number" ? e : 100;
    }),
    ge = s.assets.find((e) => {
      var n;
      return (
        ((n = e.metadata) == null ? void 0 : n.kind) === "floorplan-reference"
      );
    }),
    [Fi, Ti] = x.useState(
      () => Ke(ge == null ? void 0 : ge.metadata, "aspectRatio") ?? 1,
    ),
    [lo, Gt] = x.useState(() => ii(ge == null ? void 0 : ge.metadata)),
    [Q, Tt] = x.useState(() =>
      is(ge == null ? void 0 : ge.metadata, "calibrationStart"),
    ),
    [be, ct] = x.useState(() =>
      is(ge == null ? void 0 : ge.metadata, "calibrationEnd"),
    ),
    [Ge, ms] = x.useState(
      () =>
        Ke(ge == null ? void 0 : ge.metadata, "calibrationLengthMeters") ?? 3,
    ),
    [fs, Nt] = x.useState(!1),
    [He, Hs] = x.useState(),
    [zs, wn] = x.useState(),
    [qe, Hi] = x.useState(st),
    [roomFilter, setRoomFilter] = x.useState(st),
    [Ht, zi] = x.useState(""),
    [showHiddenEntities,setShowHiddenEntities] = x.useState(false),
    [resourcePanelWidth, setResourcePanelWidth] = x.useState(() => {
      if (typeof window === "undefined") return null;
      const saved = Number(
        window.localStorage.getItem("ha3d-resource-panel-width"),
      );
      return Number.isFinite(saved) && saved >= 300 && saved <= 560
        ? saved
        : null;
    }),
    [qt, Zt] = x.useState(),
    [Qt, Ri] = x.useState("sofa"),
    [customFurnitureModels, setCustomFurnitureModels] = x.useState([]),
    [zt, co] = x.useState(),
    [alignmentGuides, setAlignmentGuides] = x.useState([]),
    [cabinetRelationFeedback, setCabinetRelationFeedback] = x.useState(),
    [wallSplitRatio, setWallSplitRatio] = x.useState(0.5),
    [selectedCabinetSegmentId, setSelectedCabinetSegmentId] = x.useState(),
    Rt = x.useRef(null),
    Nn = x.useRef(null),
    Mt = x.useRef(!1),
    ze = x.useRef(new Map()),
    xs = x.useRef(),
    Oi = x.useRef(),
    Ze = x.useRef(),
    Re = Math.max(
      0,
      P.floors.findIndex((e) => e.id === oe),
    ),
    b = P.floors[Re] ?? P.floors[0],
    gs = P.floors.find(
      (e) => e.id === Le && e.id !== (b == null ? void 0 : b.id),
    ),
    C = P.assets.find((e) => {
      var n;
      return (
        ((n = e.metadata) == null ? void 0 : n.kind) === "floorplan-reference"
      );
    }),
    ue = bl(d),
    ho = x.useMemo(
      () => P.floors.flatMap((e) => e.devices.map((n) => n.entityId)),
      [P.floors],
    ),
    js = ol(i, ho, ue),
    ys = x.useMemo(() => Er(b, void 0, js), [b, js]),
    po = Fi || ys.width / ys.height,
    le = C ? (lo ?? ai(ys, po, Ft)) : void 0,
    dt = x.useMemo(() => Er(b, le, js), [le, b, js]),
    $t = so ?? dt,
    Vi = zt && zt.height > 0 ? zt.width / zt.height : $t.width / $t.height,
    re = x.useMemo(() => dc($t, Vi), [$t, Vi]),
    A =
      (D == null ? void 0 : D.type) === "wall"
        ? b.walls.find((e) => e.id === D.id)
        : void 0,
    K =
      (D == null ? void 0 : D.type) === "opening"
        ? b.openings.find((e) => e.id === D.id)
        : void 0,
    Ot = K ? b.walls.find((e) => e.id === K.wallId) : void 0,
    J =
      (D == null ? void 0 : D.type) === "room"
        ? b.rooms.find((e) => e.id === D.id)
        : void 0,
    Rs = J
      ? J.polygon.flatMap((e, n) => {
          const a = J.polygon[(n + 1) % J.polygon.length],
            r = b.walls.find(
              (l) =>
                kr(e, l.start, l.end) < 0.04 && kr(a, l.start, l.end) < 0.04,
            );
          return r ? [{ start: e, end: a, wall: r }] : [];
        })
      : [],
    uo = [...new Map(Rs.map(({ wall: e }) => [e.id, e])).values()],
    mo = (() => {
      const e = new Map();
      for (const n of (J == null ? void 0 : J.polygon) ?? [])
        for (const a of uo)
          (X(n, a.start) < 0.04 &&
            e.set(`${n[0].toFixed(4)},${n[1].toFixed(4)}`, {
              point: n,
              wall: a,
              type: "wall-start",
            }),
            X(n, a.end) < 0.04 &&
              e.set(`${n[0].toFixed(4)},${n[1].toFixed(4)}`, {
                point: n,
                wall: a,
                type: "wall-end",
              }));
      return [...e.values()];
    })(),
    fo = x.useMemo(() => {
      const e = new Map();
      for (const n of b.walls)
        (e.set(`${n.start[0].toFixed(4)},${n.start[1].toFixed(4)}`, n.start),
          e.set(`${n.end[0].toFixed(4)},${n.end[1].toFixed(4)}`, n.end));
      return [...e.values()];
    }, [b.walls]),
    w =
      ue && (D == null ? void 0 : D.type) === "device"
        ? b.devices.find((e) => e.id === D.id && i[e.entityId])
        : void 0,
    R =
      (D == null ? void 0 : D.type) === "furniture"
        ? b.furniture.find((e) => e.id === D.id)
        : void 0,
    q = w ? i[w.entityId] : void 0,
    Bi = K != null && K.entityId ? i[K.entityId] : void 0,
    te = w ? ws(w, q) : void 0,
    xo = q ? Ar(q) : [],
    je = ue && He ? i[He] : void 0,
    selectedPresentation = je
      ? resolveBoundDevicePresentation(je, as(je))
      : void 0,
    Os = je
      ? selectedPresentation.locked
        ? selectedPresentation.modelId
        : (zs ?? selectedPresentation.modelId)
      : void 0,
    St = Ke(C == null ? void 0 : C.metadata, "calibrationLengthMeters"),
    deviceLibrary = x.useMemo(
      () => buildDeviceLibrary(Object.values(i), b.devices, od, ld),
      [i, b.devices],
    ),
    Mn = deviceLibrary.unplaced,
    Oe = showHiddenEntities ? deviceLibrary.unplaced : deviceLibrary.available,
    haDeviceById = x.useMemo(
      () => new Map(haDevices.map((device) => [device.id, device])),
      [haDevices],
    ),
    entityCountByDeviceId = x.useMemo(() => {
      const counts = new Map();
      for (const entity of Object.values(i))
        if (entity.deviceId)
          counts.set(entity.deviceId, (counts.get(entity.deviceId) ?? 0) + 1);
      return counts;
    }, [i]),
    Wi = deviceLibrary.unplaced.length - deviceLibrary.available.length,
    $n = x.useMemo(() => {
      const e = new Map();
      for (const n of Oe) e.set(n.domain, (e.get(n.domain) ?? 0) + 1);
      if (!e.has("camera")) e.set("camera", 0);
      return [
        { domain: st, label: "全部", count: Oe.length },
        ...[...e.entries()]
          .sort(([n], [a]) => Qr(n, a))
          .map(([n, a]) => ({ domain: n, label: jt(n), count: a })),
        {
          domain: CUSTOM_DEVICE_FILTER,
          label: "自定义设备",
          count: Oe.filter(isCustomDeviceEntity).length,
        },
      ];
    }, [Oe]),
    roomFilterBase = x.useMemo(
      () =>
        qe === st
          ? Oe
          : qe === CUSTOM_DEVICE_FILTER
            ? Oe.filter(isCustomDeviceEntity)
            : Oe.filter((n) => n.domain === qe),
      [Oe, qe],
    ),
    roomOptions = x.useMemo(
      () => [
        { id: st, label: "全部房间", count: roomFilterBase.length },
        ...haAreas
          .slice()
          .sort((n, a) => n.name.localeCompare(a.name, "zh-Hans-CN"))
          .map((n) => ({
            id: n.id,
            label: n.name,
                count: roomFilterBase.filter(
                  (a) => resolveDeviceLibraryAreaId(a, haAreas) === n.id,
                ).length,
          })),
      ],
      [haAreas, roomFilterBase],
    ),
    resourcePanelAutoWidth = Math.min(
      560,
      Math.max(
        340,
        190 +
          Math.max(
            ...roomOptions.map((option) => Array.from(option.label).length),
            0,
          ) *
            24,
      ),
    ),
    Vs = x.useMemo(
      () =>
        roomFilterBase
          .filter(
            (n) =>
              roomFilter === st ||
              resolveDeviceLibraryAreaId(n, haAreas) === roomFilter,
          )
          .filter((n) => Qc(n, Ht)),
      [roomFilterBase, roomFilter, Ht, haAreas],
    ),
    Xi =
      qe === st
        ? "全部类型"
        : qe === CUSTOM_DEVICE_FILTER
          ? "自定义设备"
          : jt(qe),
    roomLabel =
      roomFilter === st
        ? ""
        : `${roomOptions.find((n) => n.id === roomFilter)?.label ?? "当前房间"} · `,
    jo = Ht.trim()
      ? `${Vs.length} 个匹配`
      : qe === st && roomFilter === st
        ? `${Oe.length} 个可放置`
        : `${Vs.length} / ${Oe.length} 个可放置`,
    Yi = Pi
      ? new Date(Pi).toLocaleTimeString("zh-CN", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "未保存",
    Ui = we(Os),
    Bs = L === "device" && !!(je && Ui);
  x.useEffect(() => {setCurtainSession(null);}, [w?.id, b.id]);
  x.useEffect(() => {if(rt !== '2d')setCurtainSession(null);}, [rt]);
  x.useEffect(() => {
    let active = !0;
    const loadModels = () =>
      fetch("./api/device-platform")
        .then((response) => {
          if (!response.ok) throw new Error("模型目录读取失败");
          return response.json();
        })
        .then((platform) => {
          if (active)
            setCustomFurnitureModels(
              (platform.modelTemplates ?? []).filter(
                (model) =>
                  model.enabled !== !1 &&
                  model.furnitureEnabled === true &&
                  !model.builtin,
              ),
            );
        })
        .catch(() => active && setCustomFurnitureModels([]));
    loadModels();
    window.addEventListener("ha3d-device-platform-updated", loadModels);
    return () => {
      active = !1;
      window.removeEventListener("ha3d-device-platform-updated", loadModels);
    };
  }, []);
  x.useEffect(() => {
    qe !== st && !$n.some((e) => e.domain === qe) && Hi(st);
  }, [qe, $n]);
  x.useEffect(() => {
    roomFilter !== st &&
      !roomOptions.some((e) => e.id === roomFilter) &&
      setRoomFilter(st);
  }, [roomFilter, roomOptions]);
  const yo = (e) => {
      Hi(e);
      const n = (() => {
        const a = He,
          r = a ? i[a] : void 0;
        return !r || e === st || r.domain === e ? a : void 0;
      })();
      (Hs(n), B(n), n || wn(void 0));
    },
    selectRoom = (e) => {
      setRoomFilter(e);
      const n = He ? i[He] : void 0;
      n && e !== st && n.areaId !== e && (Hs(void 0), B(void 0), wn(void 0));
    },
    vo = (e) => {
      if (!ue) return;
      const n = i[e];
      (Hs(e), B(e), wn(n ? as(n) : void 0), We("device"));
    },
    Gi = (e) =>
      t.jsxs(t.Fragment, {
        children: [
          t.jsxs("label", {
            className: "device-library-search",
            children: [
              t.jsx(gl, { size: 15 }),
              t.jsx("input", {
                type: "search",
                "aria-label": "搜索设备实体",
                value: Ht,
                placeholder: "搜索实体、房间、类型或状态",
                onChange: (n) => zi(n.target.value),
                style: { border: 0, background: "rgba(0,0,0,0)" },
              }),
              Ht &&
                t.jsx("button", {
                  type: "button",
                  onClick: () => zi(""),
                  "aria-label": "清除设备搜索",
                  children: "清除",
                }),
            ],
          }),
          t.jsx(cd, { options: $n, activeDomain: qe, onSelect: yo }),
          t.jsx(RoomFilterBar, {
            options: roomOptions,
            activeRoom: roomFilter,
            onSelect: selectRoom,
          }),
          Wi > 0 &&
            t.jsxs("div", {
              className: "device-library-hint device-library-visibility",
              children: [t.jsxs("span",{children:[showHiddenEntities ? "已显示 " : "已隐藏 ",Wi," 个系统/辅助实体"]}),t.jsxs("label",{className:"device-library-visibility-toggle",children:[t.jsx("input",{type:"checkbox",role:"switch",checked:showHiddenEntities,"aria-label":"取消隐藏系统和辅助实体",onChange:event=>setShowHiddenEntities(event.target.checked)}),"取消隐藏"]})],
            }),
          je &&
            selectedPresentation.locked &&
            t.jsx(BoundDeviceType, { entity: je }),
          je &&
            !selectedPresentation.locked &&
            Os &&
            t.jsx(_r, { entity: je, activeModelId: Os, onSelect: wn }),
          je &&
            Ui &&
            t.jsxs("div", {
              className: "light-strip-flow-card",
              role: "status",
              children: [
                t.jsx("strong", { children: "灯带路径绘制" }),
                t.jsx("div", {
                  className: "light-strip-shape-toggle",
                  "aria-label": "灯带形状",
                  children: ["line", "ring"].map((n) =>
                    t.jsx(
                      "button",
                      {
                        type: "button",
                        className:
                          ((T == null ? void 0 : T.shape) ?? ds) === n
                            ? "active"
                            : "",
                        "aria-pressed":
                          ((T == null ? void 0 : T.shape) ?? ds) === n,
                        onClick: () => {
                          (eo(n), Se((a) => a && { ...a, shape: n }));
                        },
                        children: n === "line" ? "线型" : "环形",
                      },
                      n,
                    ),
                  ),
                }),
                t.jsx("span", {
                  className: T ? "done" : "active",
                  children: T
                    ? `已添加 ${T.points.length} 个端点`
                    : "点击画布添加第一个端点",
                }),
                t.jsx("span", {
                  className:
                    T && T.points.length >= Wn(T.shape) ? "active" : "",
                  children: "Enter 完成绘制",
                }),
                t.jsx("small", {
                  children:
                    ((T == null ? void 0 : T.shape) ?? ds) === "ring"
                      ? "环形至少 3 个端点，完成后自动闭合；Esc 取消。"
                      : "线型支持连续添加多个端点；Enter 完成，Esc 取消。",
                }),
              ],
            }),
          t.jsxs("div", {
            className: "library-list device-entity-list",
            children: [
              Vs.map((n) =>
                t.jsx(
                  dd,
                  {
                    entity: n,
                    device: haDeviceById.get(n.deviceId),
                    entityCount: entityCountByDeviceId.get(n.deviceId) ?? 1,
                    active: He === n.entityId,
                    onSelect: () => vo(n.entityId),
                  },
                  n.entityId,
                ),
              ),
              !Vs.length &&
                t.jsx("p", {
                  className: "empty-library",
                  children: Ht.trim()
                    ? `没有匹配“${Ht.trim()}”的${roomLabel}${Xi}设备。`
                    : Oe.length
                      ? `没有${roomLabel}${Xi}的可放置设备。`
                      : e,
                }),
            ],
          }),
        ],
      }),
    kt = x.useCallback((e) => `${e.type}:${e.id}`, []),
    Jt = (e) =>
      pe.length
        ? pe.includes(kt(e))
        : (D == null ? void 0 : D.type) === e.type && D.id === e.id,
    qi = (e) => {
      const n = pe.length ? pe : D ? [kt(D)] : [];
      return new Set(
        n
          .filter((a) => a.startsWith(`${e}:`))
          .map((a) => a.slice(e.length + 1)),
      );
    },
    Ve = x.useCallback(
      (e, n = !1) => {
        var l;
        if (e.type === "device" && !ue) return;
        const a = kt(e),
          r =
            e.type === "device"
              ? (l = b.devices.find((h) => h.id === e.id)) == null
                ? void 0
                : l.entityId
              : void 0;
        (Is(e),
          (!n || r) && B(r),
          Te(!0),
          lt(!1),
          _s((h) =>
            n ? (h.includes(a) ? h.filter((u) => u !== a) : [...h, a]) : [a],
          ));
      },
      [ue, b, kt, B],
    ),
    bo = x.useCallback(
      (e) => {
        if (ue && b.devices.some((device) => device.id === e && !i[device.entityId])) {
          We("device");
          return;
        }
        ue &&
          b.devices.some((n) => n.id === e && i[n.entityId]) &&
          (Xn(), We("select"), Ve({ type: "device", id: e }));
      },
      [ue, b, i, Ve],
    ),
    es = (e, n = !1) => {
      (e.type === "device" && Xn(),
        Pe(void 0),
        De([]),
        Se(void 0),
        Zt(void 0),
        ee(void 0),
        Ve(e, n));
    },
    Zi = (e) => e.shiftKey || e.ctrlKey || e.metaKey,
    Sn = (e, n, a) => {
      Bs ||
        (Us &&
          (a.stopPropagation(), !Zi(a) && (es(e), vc(L, e.type) && Qe(n, a))));
    },
    dragFurnitureWithRightButton = (furniture, event) => {
      if (Bs || !Us || event.button !== 2 || event.pointerType === "touch")
        return;
      es({ type: "furniture", id: furniture.id });
      Qe(
        {
          type: "furniture",
          id: furniture.id,
          pointerStart: Ws(event, !1),
          originPosition: [...furniture.position],
        },
        event,
      );
    },
    kn = (e, n) => {
      Bs || (Us && (n.stopPropagation(), (Mt.current = !1), es(e, Zi(n))));
    },
    me = () => {
      (Is(void 0),
        _s([]),
        Zt(void 0),
        setAlignmentGuides([]),
        setCabinetRelationFeedback(void 0),
        B(void 0));
    };
  x.useEffect(() => {
    (D == null ? void 0 : D.type) === "device" && !w && me();
  }, [w, D == null ? void 0 : D.id, D == null ? void 0 : D.type]);
  const Qi = (e) => {
      (We(e),
        Pe(void 0),
        De([]),
        Se(void 0),
        Zt(void 0),
        ee(void 0),
        e !== "calibrate" && Nt(!1),
        cn(e) && (me(), Te(!1), lt(!1)));
    },
    Cn = () => {
      C &&
        (We("calibrate"),
        Nt(!0),
        Tt(void 0),
        ct(void 0),
        Pe(void 0),
        De([]),
        Se(void 0),
        Zt(void 0),
        ee(void 0),
        me(),
        Te(!1),
        lt(!1));
    },
    Ks = x.useCallback(() => {
      (ee(void 0), Dt(1), Yt([0, 0]));
    }, []);
  const saveSession = x.useRef(createProjectSaveSession(s));
  if(saveSession.current.projectId !== s.id) saveSession.current = createProjectSaveSession(s);
  x.useEffect(()=>{const restored=()=>{saveSession.current.blocked=true;Fe("实例已恢复，请先导出当前未保存编辑，再重新加载页面。");};window.addEventListener("ha3d-instance-restored",restored);return()=>window.removeEventListener("ha3d-instance-restored",restored);},[]);
  (x.useEffect(() => {
    window.localStorage.setItem("ha3d:show-dimensions", String(hs));
  }, [hs]),
    x.useEffect(() => {
      window.localStorage.setItem("ha3d:show-device-labels", String(bt));
    }, [bt]),
    x.useEffect(() => {
      if(!Ue){saveSession.current.baseVersion=s.version;U(tt(s));}
    }, [Ue, s]),
    x.useEffect(() => {
      Ue || Di(s.updatedAt);
    }, [Ue, s.updatedAt]),
    x.useEffect(() => {
      var l, h, u;
      if (!C) {
        (Gt(void 0), Tt(void 0), ct(void 0));
        return;
      }
      const e = (l = C.metadata) == null ? void 0 : l.aspectRatio,
        n = (h = C.metadata) == null ? void 0 : h.scalePercent,
        a = (u = C.metadata) == null ? void 0 : u.opacity,
        r = (p) => {
          Ti(p);
          const N = ii(C.metadata),
            m = N ?? ai(ys, p, typeof n == "number" ? n : 100);
          (Gt(m),
            N ||
              (U((g) => ({
                ...g,
                assets: g.assets.map((k) =>
                  k.id === C.id
                    ? {
                        ...k,
                        metadata: {
                          ...k.metadata,
                          worldX: m.x,
                          worldY: m.y,
                          worldWidth: m.width,
                          worldHeight: m.height,
                        },
                      }
                    : k,
                ),
              })),
              ve(!0)));
        };
      (typeof e == "number"
        ? r(e)
        : Pr(C.url)
            .then(r)
            .catch(() => r(1)),
        typeof n == "number" && Ts(n),
        typeof a == "number" && Ai(Math.round(a * 100)),
        Tt(is(C.metadata, "calibrationStart")),
        ct(is(C.metadata, "calibrationEnd")),
        ms(Ke(C.metadata, "calibrationLengthMeters") ?? 3));
    }, [C == null ? void 0 : C.id, C == null ? void 0 : C.url]),
    x.useEffect(() => {
      const e = ii(C == null ? void 0 : C.metadata);
      e && Gt(e);
    }, [
      (Ta = C == null ? void 0 : C.metadata) == null ? void 0 : Ta.worldX,
      (Ha = C == null ? void 0 : C.metadata) == null ? void 0 : Ha.worldY,
      (za = C == null ? void 0 : C.metadata) == null ? void 0 : za.worldWidth,
      (Ra = C == null ? void 0 : C.metadata) == null ? void 0 : Ra.worldHeight,
    ]),
    x.useEffect(() => {
      fs ||
        (Tt(is(C == null ? void 0 : C.metadata, "calibrationStart")),
        ct(is(C == null ? void 0 : C.metadata, "calibrationEnd")),
        ms(
          Ke(C == null ? void 0 : C.metadata, "calibrationLengthMeters") ?? 3,
        ));
    }, [
      (Oa = C == null ? void 0 : C.metadata) == null
        ? void 0
        : Oa.calibrationLengthMeters,
      fs,
    ]),
    x.useEffect(() => {
      D && Te(!0);
    }, [D]),
    x.useEffect(() => {
      var e;
      P.floors.some((n) => n.id === oe) ||
        $e(((e = P.floors[0]) == null ? void 0 : e.id) ?? "");
    }, [oe, P.floors]),
    x.useEffect(() => {
      (Le === (b == null ? void 0 : b.id) ||
        (Le && !P.floors.some((e) => e.id === Le))) &&
        Y("");
    }, [P.floors, b == null ? void 0 : b.id, Le]),
    x.useEffect(() => {
      if (rt !== "2d" || !Rt.current) return;
      const e = Rt.current,
        n = () => {
          const r = e.getBoundingClientRect();
          r.width > 0 &&
            r.height > 0 &&
            co({ width: r.width, height: r.height });
        };
      if ((n(), typeof ResizeObserver > "u")) return;
      const a = new ResizeObserver(n);
      return (a.observe(e), () => a.disconnect());
    }, [rt]),
    x.useEffect(() => {
      rt === "2d" && Ks();
    }, [C == null ? void 0 : C.id, Ks, b.id, rt]));
  const ht = x.useCallback((e) => {
      saveSession.current.generation++;
      Fe(void 0);
      U((n) => {
        const a = e(n);
        return a === n
          ? n
          : (he((r) => [...r.slice(-49), tt(n)]), it([]), ve(!0), a);
      });
    }, []),
    F = x.useCallback(
      (e) => {
        ht((n) => {
          const a = n.floors[Re];
          if (!a) return n;
          const r = e(a);
          return r === a
            ? n
            : { ...n, floors: n.floors.map((l, h) => (h === Re ? r : l)) };
        });
      },
      [ht, Re],
    ),
    Ji = x.useCallback(
      (e) => {
        ht((n) => (n.name === e ? n : { ...n, name: e }));
      },
      [ht],
    ),
    wo = x.useCallback(
      (e) => {
        setCurtainSession(null);
        !w ||
          !q ||
          F((n) => ({
            ...n,
            devices: n.devices.map((a) => {
              var g;
              if (a.id !== w.id) return a;
              const r = [...a.position];
              r[1] = rn(q, n.height, e);
              const l = we(e),
                h = e === "media_player.tv",
                u = (["cover.curtain", "cover.sheer"].includes(e)) || e === "cover.blind",
                p = e === "climate.central_ac",
                N = a.scale ? qr(a.scale, a.modelId) * 100 : 100;
              let m;
              return (
                l
                  ? (m = we(a.modelId)
                      ? (a.scale ?? [1, Ee[0], Ee[1]])
                      : [1, Ee[0], Ee[1]])
                  : h
                    ? (m =
                        a.modelId === "media_player.tv"
                          ? (a.scale ?? Wr())
                          : Qn(e, N))
                    : u
                      ? (m =
                          (g = a.modelId) != null && g.startsWith("cover.")
                            ? (a.scale ?? bi())
                            : bi())
                      : p
                        ? (m =
                            a.modelId === "climate.central_ac"
                              ? (a.scale ?? wi())
                              : wi())
                        : (m = Qn(e, N)),
                {
                  ...a,
                  modelId: e,
                  curtainTrack: a.curtainTrack ? {...a.curtainTrack, fabric:e === "cover.sheer" ? "sheer" : "blackout"} : undefined,
                  verticalReference: cameraModelDefinition(e) ? (e === "camera.desktop" ? {targetType:"floor",surface:"top",offset:r[1]} : {targetType:"ceiling",surface:"bottom",offset:0}) : a.verticalReference,
                  position: r,
                  scale: m,
                  lightStrip: l ? a.lightStrip : void 0,
                }
              );
            }),
          }));
      },
      [w, q, F],
    ),
    ea = x.useCallback(
      (e) => {
        w &&
          F((n) => ({
            ...n,
            devices: n.devices.map((a) =>
              a.id !== w.id ? a : { ...a, scale: Qn(a.modelId, e) },
            ),
          }));
      },
      [w, F],
    ),
    No = x.useCallback(
      (e) => {
        if (!w) return;
        const n = Math.max(ft, Math.min(50, Number.isFinite(e) ? e : ft));
        F((a) => ({
          ...a,
          devices: a.devices.map((r) => {
            var h, u;
            if (r.id !== w.id) return r;
            const l = [
              n / ci,
              ((h = r.scale) == null ? void 0 : h[1]) ?? Ee[0],
              ((u = r.scale) == null ? void 0 : u[2]) ?? Ee[1],
            ];
            return { ...r, scale: l };
          }),
        }));
      },
      [w, F],
    ),
    ta = x.useCallback(
      (e) => {
        if (!w) return;
        const n = Number.isFinite(e) ? e : 0;
        F((a) => ({
          ...a,
          devices: a.devices.map((r) => {
            var h, u;
            if (r.id !== w.id) return r;
            const l = [
              ((h = r.rotation) == null ? void 0 : h[0]) ?? 0,
              (-n * Math.PI) / 180,
              ((u = r.rotation) == null ? void 0 : u[2]) ?? 0,
            ];
            return { ...r, rotation: l };
          }),
        }));
      },
      [w, F],
    ),
    sa = x.useCallback(
      (e, n) => {
        w &&
          F((a) => ({
            ...a,
            devices: a.devices.map((r) => {
              var h;
              if (r.id !== w.id) return r;
              const l = Xr(r);
              if (e === "width") {
                const u = pi * l[0];
                l[0] = Ie(n, u, rr, or) / pi;
              } else {
                const u = ui * l[1];
                l[1] = Ie(n, u, lr, cr) / ui;
              }
              return (
                (l[2] = ((h = r.scale) == null ? void 0 : h[2]) ?? dn),
                { ...r, scale: l }
              );
            }),
          }));
      },
      [w, F],
    ),
    na = x.useCallback(
      (e, n) => {
        w &&
          F((a) => ({
            ...a,
            devices: a.devices.map((r) => {
              var h;
              if (r.id !== w.id) return r;
              const l = Yr(r);
              if (e === "width") {
                const u = mi * l[0];
                l[0] = Ie(n, u, dr, hr) / mi;
              } else {
                const u = fi * l[1];
                l[1] = Ie(n, u, pr, ur) / fi;
              }
              return (
                (l[2] = ((h = r.scale) == null ? void 0 : h[2]) ?? hn),
                { ...r, scale: l }
              );
            }),
          }));
      },
      [w, F],
    ),
    In = x.useCallback(
      (e, n) => {
        w &&
          F((a) => ({
            ...a,
            devices: a.devices.map((r) => {
              if (r.id !== w.id) return r;
              const l = Ur(r);
              if (e === "width") {
                const h = xi * l[0];
                l[0] = Ie(n, h, mr, fr) / xi;
              } else if (e === "thickness") {
                const h = gi * l[1];
                l[1] = Ie(n, h, xr, gr) / gi;
              } else {
                const h = ji * l[2];
                l[2] = Ie(n, h, jr, yr) / ji;
              }
              return { ...r, scale: l };
            }),
          }));
      },
      [w, F],
    ),
    Mo = x.useCallback(
      (e, n) => {
        F((a) => ({
          ...a,
          devices: a.devices.map((r) => {
            if (r.id !== e) return r;
            const l = r.controlledLightFixtures ?? [],
              h = a.rooms.find((p) => _e(n, p.polygon)),
              u = {
                id: `switch-light-${Date.now()}-${l.length + 1}`,
                label: `灯具 ${l.length + 1}`,
                roomId: h == null ? void 0 : h.id,
                position: [n[0], Mr("light.downlight", a.height), n[1]],
                rotation: [0, 0, 0],
                modelId: "light.downlight",
              };
            return { ...r, controlledLightFixtures: [...l, u] };
          }),
        }));
      },
      [F],
    ),
    $o = x.useCallback(
      (e) => {
        w &&
          F((n) => ({
            ...n,
            devices: n.devices.map((a) => {
              if (a.id !== w.id) return a;
              const r = (a.controlledLightFixtures ?? []).filter(
                (l) => l.id !== e,
              );
              return { ...a, controlledLightFixtures: r.length ? r : void 0 };
            }),
          }));
      },
      [w, F],
    ),
    So = x.useCallback(
      (e, n) => {
        w &&
          F((a) => ({
            ...a,
            devices: a.devices.map((r) => {
              if (r.id !== w.id) return r;
              const l = (r.controlledLightFixtures ?? []).map((h) => {
                if (h.id !== e) return h;
                const u = [h.position[0], Mr(n, a.height), h.position[2]],
                  p = we(n),
                  N = p ? (h.scale ?? [1, Ee[0], Ee[1]]) : void 0;
                return {
                  ...h,
                  modelId: n,
                  position: u,
                  scale: N,
                  rotation: p ? (h.rotation ?? [0, 0, 0]) : h.rotation,
                };
              });
              return { ...r, controlledLightFixtures: l.length ? l : void 0 };
            }),
          }));
      },
      [w, F],
    ),
    ko = x.useCallback(
      (e, n) => {
        if (!w) return;
        const a = Math.max(ft, Math.min(50, Number.isFinite(n) ? n : ft));
        F((r) => ({
          ...r,
          devices: r.devices.map((l) => {
            if (l.id !== w.id) return l;
            const h = (l.controlledLightFixtures ?? []).map((u) => {
              var N, m;
              if (u.id !== e) return u;
              const p = [
                a / ci,
                ((N = u.scale) == null ? void 0 : N[1]) ?? Ee[0],
                ((m = u.scale) == null ? void 0 : m[2]) ?? Ee[1],
              ];
              return { ...u, scale: p };
            });
            return { ...l, controlledLightFixtures: h.length ? h : void 0 };
          }),
        }));
      },
      [w, F],
    ),
    Co = x.useCallback(
      (e, n) => {
        if (!w) return;
        const a = Number.isFinite(n) ? n : 0;
        F((r) => ({
          ...r,
          devices: r.devices.map((l) => {
            if (l.id !== w.id) return l;
            const h = (l.controlledLightFixtures ?? []).map((u) => {
              var N, m;
              if (u.id !== e) return u;
              const p = [
                ((N = u.rotation) == null ? void 0 : N[0]) ?? 0,
                (-a * Math.PI) / 180,
                ((m = u.rotation) == null ? void 0 : m[2]) ?? 0,
              ];
              return { ...u, rotation: p };
            });
            return { ...l, controlledLightFixtures: h.length ? h : void 0 };
          }),
        }));
      },
      [w, F],
    ),
    Ct = x.useCallback(
      (e) => {
        (U((n) => {
          const a = n.floors[Re];
          if (!a) return n;
          const r = e(a);
          return r === a
            ? n
            : (Ze.current && (Ze.current.changed = !0),
              { ...n, floors: n.floors.map((l, h) => (h === Re ? r : l)) });
        }),
          ve(!0));
      },
      [Re],
    ),
    ia = x.useCallback(() => {
      (me(),
        he((e) => {
          const n = e.at(-1);
          return n
            ? (U((a) => (it((r) => [tt(a), ...r].slice(0, 50)), tt(n))),
              ve(!0),
              e.slice(0, -1))
            : e;
        }));
    }, []),
    _n = x.useCallback(() => {
      (me(),
        it((e) => {
          const n = e[0];
          return n
            ? (U((a) => (he((r) => [...r.slice(-49), tt(a)]), tt(n))),
              ve(!0),
              e.slice(1))
            : e;
        }));
    }, []),
    ts = x.useCallback(() => {
      if (!D) return;
      const e = pe.length ? pe : [kt(D)],
        n = (p) =>
          new Set(
            e
              .filter((N) => N.startsWith(`${p}:`))
              .map((N) => N.slice(p.length + 1)),
          ),
        a = n("wall"),
        r = n("opening"),
        l = n("room"),
        h = n("device"),
        u = n("furniture");
      (F((p) => {
        var m;
        const N = p.walls.filter((g) => !a.has(g.id));
        return {
          ...p,
          walls: N,
          openings: p.openings.filter((g) => !r.has(g.id) && !a.has(g.wallId)),
          rooms: a.size
            ? Vt(
                N,
                p.rooms,
                (m = P.materials.find((g) => g.id.includes("floor"))) == null
                  ? void 0
                  : m.id,
              )
            : p.rooms.filter((g) => !l.has(g.id)),
          devices: p.devices.filter((g) => !h.has(g.id)),
          furniture: p.furniture.filter((g) => !u.has(g.id)),
        };
      }),
        me());
    }, [P.materials, pe, D, F]),
    Io = x.useCallback(() => {
      if (!D) return;
      const e = pe.length ? pe : [kt(D)],
        n = (l) =>
          new Set(
            e
              .filter((h) => h.startsWith(`${l}:`))
              .map((h) => h.slice(l.length + 1)),
          ),
        a = n("wall"),
        r = n("opening");
      Oi.current = {
        walls: b.walls.filter((l) => a.has(l.id)),
        openings: b.openings.filter((l) => r.has(l.id) || a.has(l.wallId)),
        devices: b.devices.filter((l) => n("device").has(l.id)),
        furniture: b.furniture.filter((l) => n("furniture").has(l.id)),
      };
    }, [b, pe, D]),
    copySelectedFurniture = x.useCallback(() => {
      const selected = pe.length ? pe : D ? [kt(D)] : [],
        furnitureIds = new Set(
          selected
            .filter((key) => key.startsWith("furniture:"))
            .map((key) => key.slice(10)),
        ),
        furniture = b.furniture.filter((item) => furnitureIds.has(item.id));
      if (!furniture.length) return;
      Oi.current = {
        walls: [],
        openings: [],
        devices: [],
        furniture,
      };
      Ye(`已复制 ${furniture.length} 件家具，可继续粘贴副本`);
      window.setTimeout(() => Ye(void 0), 1800);
    }, [b.furniture, pe, D, kt]),
    _o = x.useCallback(() => {
      const e = Oi.current;
      if (
        !e ||
        (!e.walls.length &&
          !e.openings.length &&
          !e.devices.length &&
          !e.furniture.length)
      )
        return;
      const n = Date.now(),
        a = new Map(e.walls.map((m, g) => [m.id, `${m.id}-copy-${n}-${g}`])),
        deviceIdMap = new Map(
          e.devices.map((m, g) => [m.id, `${m.id}-copy-${n}-${g}`]),
        ),
        furnitureIdMap = new Map(
          e.furniture.map((m, g) => [m.id, `${m.id}-copy-${n}-${g}`]),
        ),
        remapVerticalReference = (reference) => {
          if (!reference || reference.targetType === "floor") return reference;
          const idMap =
            reference.targetType === "device" ? deviceIdMap : furnitureIdMap;
          return idMap.has(reference.targetId)
            ? { ...reference, targetId: idMap.get(reference.targetId) }
            : reference;
        },
        r = e.walls.map((m, g) => ({
          ...structuredClone(m),
          id: a.get(m.id),
          start: [m.start[0] + 0.35, m.start[1] + 0.35],
          end: [m.end[0] + 0.35, m.end[1] + 0.35],
        })),
        l = e.openings.map((m, g) => ({
          ...structuredClone(m),
          id: `${m.id}-copy-${n}-${g}`,
          wallId: a.get(m.wallId) ?? m.wallId,
          offset: a.has(m.wallId) ? m.offset : m.offset + 0.25,
        })),
        h = e.devices.map((m, g) => ({
          ...an(structuredClone(m), [0.35, 0.35]),
          id: deviceIdMap.get(m.id),
          floorId: b.id,
          position: [m.position[0] + 0.35, m.position[1], m.position[2] + 0.35],
          verticalReference: remapVerticalReference(m.verticalReference),
        })),
        u = e.furniture.map((m, g) => ({
          ...structuredClone(m),
          id: furnitureIdMap.get(m.id),
          floorId: b.id,
          position: [m.position[0] + 0.35, m.position[1] + 0.35],
          verticalReference: remapVerticalReference(m.verticalReference),
        }));
      F((m) => {
        var M;
        const g = [...m.walls, ...r],
          k = r.length
            ? Vt(
                g,
                m.rooms,
                (M = P.materials.find((I) => I.id.includes("floor"))) == null
                  ? void 0
                  : M.id,
              )
            : m.rooms,
          O = h.map((I) => {
            var G;
            const V = [I.position[0], I.position[2]];
            return {
              ...I,
              roomId:
                (G = k.find((z) => _e(V, z.polygon))) == null ? void 0 : G.id,
            };
          }),
          Z = u.map((I) => {
            var V;
            return {
              ...I,
              roomId:
                (V = k.find((G) => _e(I.position, G.polygon))) == null
                  ? void 0
                  : V.id,
            };
          });
        return {
          ...m,
          walls: g,
          openings: [...m.openings, ...l],
          devices: [...m.devices, ...O],
          furniture: [...m.furniture, ...Z],
          rooms: k,
        };
      });
      const p = [
          ...r.map((m) => `wall:${m.id}`),
          ...l.map((m) => `opening:${m.id}`),
          ...h.map((m) => `device:${m.id}`),
          ...u.map((m) => `furniture:${m.id}`),
        ],
        [N] = p;
      if (N) {
        const [m, g] = N.split(":");
        (Is({ type: m, id: g }), _s(p));
        const k = m === "device" ? h.find((O) => O.id === g) : void 0;
        (B(k == null ? void 0 : k.entityId), Te(!0));
      }
    }, [P.materials, b.id, B, F]);
  function straightenSelectedWalls() {
    const selectedIds = new Set(
        pe.filter((e) => e.startsWith("wall:")).map((e) => e.slice(5)),
      ),
      preview = straightenWallChain(b.walls, selectedIds);
    if (!preview.ok) {
      const message = {
        "not-enough-walls": "请先按住 Shift 选择至少两段连续墙体",
        branched: "选中的墙体存在分叉，请只选择一条连续墙链",
        disconnected: "选中的墙体不连续，请重新选择",
        "closed-loop": "闭合墙体无法判断首尾，请取消选择其中一段",
        "invalid-segment": "选中的墙体包含无效连接，无法拉直",
        "too-short": "选中的墙体总长度过短，无法拉直",
      }[preview.reason];
      (Ye(message ?? "当前选择无法拉直"),
        window.setTimeout(() => Ye(void 0), 2200));
      return;
    }
    if (!preview.changed) {
      (Ye("选中的墙体已经是直线"), window.setTimeout(() => Ye(void 0), 1800));
      return;
    }
    F((floor) => {
      var material;
      const result = straightenWallChain(floor.walls, selectedIds);
      if (!result.ok || !result.changed) return floor;
      const openings = clampOpeningsToWalls(floor.openings, result.walls);
      return {
        ...floor,
        walls: result.walls,
        openings,
        rooms: Vt(
          result.walls,
          floor.rooms,
          (material = P.materials.find((item) => item.id.includes("floor"))) ==
            null
            ? void 0
            : material.id,
        ),
      };
    });
    const direction = {
      horizontal: "水平",
      vertical: "垂直",
      diagonal: "斜向",
    }[preview.axis];
    (Ye(`已将 ${selectedIds.size} 段墙体${direction}拉直`),
      window.setTimeout(() => Ye(void 0), 2200));
  }
  function mergeSelectedWalls() {
    const selectedIds = new Set(
        pe.filter((e) => e.startsWith("wall:")).map((e) => e.slice(5)),
      ),
      preview = mergeWallChain(b.walls, b.openings, selectedIds, {
        retainedWallId: A == null ? void 0 : A.id,
      });
    if (!preview.ok) {
      const message = {
        "not-enough-walls": "请先按住 Shift 选择至少两段墙体",
        branched: "选中的墙体存在分叉，请只选择一条连续墙链",
        disconnected: "选中的墙体不连续，请重新选择",
        "closed-loop": "闭合墙体无法直接合并，请取消选择其中一段",
        "invalid-segment": "选中的墙体包含无效连接，无法合并",
        "too-short": "选中的墙体总长度过短，无法合并",
        "not-collinear": "选中的墙体不是同一直线，请先执行自动拉直",
      }[preview.reason];
      (Ye(message ?? "当前选择无法合并"),
        window.setTimeout(() => Ye(void 0), 2200));
      return;
    }
    F((floor) => {
      var material;
      const result = mergeWallChain(floor.walls, floor.openings, selectedIds, {
        retainedWallId: preview.retainedWallId,
      });
      if (!result.ok) return floor;
      return {
        ...floor,
        walls: result.walls,
        openings: clampOpeningsToWalls(result.openings, result.walls),
        rooms: Vt(
          result.walls,
          floor.rooms,
          (material = P.materials.find((item) => item.id.includes("floor"))) ==
            null
            ? void 0
            : material.id,
        ),
      };
    });
    (Is({ type: "wall", id: preview.retainedWallId }),
      _s([`wall:${preview.retainedWallId}`]),
      Ye(`已将 ${selectedIds.size} 段墙体合并为一段，门窗位置已保留`),
      window.setTimeout(() => Ye(void 0), 2400));
  }
  function arrangeSelectedDevices(mode) {
    if (selectedDeviceCount < 3) {
      (Ye("请先按住 Shift 选择至少三个设备"),
        window.setTimeout(() => Ye(void 0), 2000));
      return;
    }
    const preview =
      mode === "distribute"
        ? distributeDevicesEvenly(b.devices, selectedDeviceIds)
        : alignDevicesOnLine(b.devices, selectedDeviceIds);
    if (!preview.ok) {
      const message = {
        "not-enough-devices": "请先按住 Shift 选择至少三个设备",
        "overlapping-devices": "设备位置重叠，无法确定排列方向",
        "not-aligned": "请先将设备排列到同一直线",
      }[preview.reason];
      (Ye(message ?? "当前设备无法排列"),
        window.setTimeout(() => Ye(void 0), 2200));
      return;
    }
    const selectedIds = new Set(selectedDeviceIds);
    F((floor) => {
      const result =
        mode === "distribute"
          ? distributeDevicesEvenly(floor.devices, selectedIds)
          : alignDevicesOnLine(floor.devices, selectedIds);
      if (!result.ok) return floor;
      return {
        ...floor,
        devices: result.devices.map((device) => {
          if (!selectedIds.has(device.id)) return device;
          const point = [device.position[0], device.position[2]],
            room = floor.rooms.find((item) => _e(point, item.polygon));
          return { ...device, roomId: room == null ? void 0 : room.id };
        }),
      };
    });
    (Ye(
      mode === "distribute"
        ? `已将 ${selectedDeviceCount} 个设备等距排放`
        : `已将 ${selectedDeviceCount} 个设备排列到同一直线`,
    ),
      window.setTimeout(() => Ye(void 0), 2200));
  }
  function splitSelectedWall() {
    if (!A || selectedWallCount > 1) {
      (Ye("请只选择一段需要分段的墙体"),
        window.setTimeout(() => Ye(void 0), 2000));
      return;
    }
    if (!(wallSplitPreview != null && wallSplitPreview.ok)) {
      const message = {
        "wall-too-short": "墙体长度不足 0.40 m，无法继续分段",
        "invalid-distance": "分割点距离墙体端点过近",
        "intersects-opening": "分割点落在门窗洞口中，请调整位置",
        "duplicate-wall-id": "新墙体编号冲突，请重试",
      }[wallSplitPreview == null ? void 0 : wallSplitPreview.reason];
      (Ye(message ?? "当前墙体无法分段"),
        window.setTimeout(() => Ye(void 0), 2200));
      return;
    }
    const wallIdBase = `wall-${Date.now()}-split`;
    let newWallId = wallIdBase,
      wallIdSuffix = 1;
    while (b.walls.some((wall) => wall.id === newWallId))
      newWallId = `${wallIdBase}-${wallIdSuffix++}`;
    F((floor) => {
      var material;
      const result = splitWallSegment(
        floor.walls,
        floor.openings,
        A.id,
        wallSplitDistance,
        { createWallId: () => newWallId },
      );
      if (!result.ok) return floor;
      return {
        ...floor,
        walls: result.walls,
        openings: result.openings,
        rooms: Vt(
          result.walls,
          floor.rooms,
          (material = P.materials.find((item) => item.id.includes("floor"))) ==
            null
            ? void 0
            : material.id,
        ),
      };
    });
    (Is({ type: "wall", id: A.id }),
      _s([`wall:${A.id}`, `wall:${newWallId}`]),
      setWallSplitRatio(0.5),
      Ye(
        `已在距起点 ${wallSplitDistance.toFixed(2)} m 处分为两段，门窗位置已保留`,
      ),
      window.setTimeout(() => Ye(void 0), 2400));
  }
  function Eo(e) {
    if (!D) return !1;
    const n = pe.length ? pe : [kt(D)],
      a = (p) =>
        new Set(
          n
            .filter((N) => N.startsWith(`${p}:`))
            .map((N) => N.slice(p.length + 1)),
        ),
      r = a("wall"),
      l = a("device"),
      h = a("furniture");
    if (!r.size && !l.size && !h.size) return !1;
    const u = (p) => [
      Number((p[0] + e[0]).toFixed(4)),
      Number((p[1] + e[1]).toFixed(4)),
    ];
    return (
      F((p) => {
        var k;
        const N = r.size
            ? p.walls.map((O) =>
                r.has(O.id) ? { ...O, start: u(O.start), end: u(O.end) } : O,
              )
            : p.walls,
          m = l.size
            ? p.devices.map((O) => {
                var I;
                if (!l.has(O.id)) return O;
                const Z = [
                    Number((O.position[0] + e[0]).toFixed(4)),
                    O.position[1],
                    Number((O.position[2] + e[1]).toFixed(4)),
                  ],
                  M = [Z[0], Z[2]];
                return an(
                  {
                    ...O,
                    position: Z,
                    roomId:
                      (I = p.rooms.find((V) => _e(M, V.polygon))) == null
                        ? void 0
                        : I.id,
                  },
                  e,
                );
              })
            : p.devices,
          g = h.size
            ? p.furniture.map((O) => {
                var M;
                if (!h.has(O.id)) return O;
                const Z = u(O.position);
                return {
                  ...O,
                  position: Z,
                  roomId:
                    (M = p.rooms.find((I) => _e(Z, I.polygon))) == null
                      ? void 0
                      : M.id,
                };
              })
            : p.furniture;
        return {
          ...p,
          walls: N,
          rooms: r.size
            ? Vt(
                N,
                p.rooms,
                (k = P.materials.find((O) => O.id.includes("floor"))) == null
                  ? void 0
                  : k.id,
              )
            : p.rooms,
          devices: m,
          furniture: g,
        };
      }),
      !0
    );
  }
  function Lo(e) {
    return e.reduce((n, a) => {
      const r = n.at(-1);
      return r && X(r, a) < 0.04
        ? n
        : [...n, [Number(a[0].toFixed(4)), Number(a[1].toFixed(4))]];
    }, []);
  }
  function aa(
    e = T == null ? void 0 : T.points,
    n = (T == null ? void 0 : T.shape) ?? ds,
  ) {
    if (L !== "device" || !He || !ue) return !1;
    const a = i[He];
    if (!a) return !1;
    const r = zs ?? as(a);
    if (!we(r) || !e) return !1;
    const l = Lo(e),
      h = Wn(n);
    if (l.length < h || Ga(l, n) < ft)
      return (
        Ye(
          n === "ring"
            ? "环形灯带至少需要 3 个端点"
            : "线型灯带至少需要 2 个端点",
        ),
        window.setTimeout(() => Ye(void 0), 1800),
        !1
      );
    const u = Sr(a, b, r, n, l);
    return (
      F((p) => ({ ...p, devices: [...p.devices, u] })),
      Ve({ type: "device", id: u.id }),
      B(u.entityId),
      ce(void 0),
      Se(void 0),
      Zt(void 0),
      ee(void 0),
      yt(void 0),
      Hs(void 0),
      We("select"),
      !0
    );
  }
  x.useEffect(() => {
    const e = (r) => {
        if (r.key === "Escape" && vn) {
          (r.preventDefault(), bn(!1));
          return;
        }
        const l = r.target instanceof Element ? r.target : void 0;
        if (
          l instanceof HTMLElement &&
          (l.matches("input, textarea, select") || l.isContentEditable)
        )
          return;
        if (
          (r.code === "Space" || r.key === " ") &&
          rt === "2d" &&
          !(l != null && l.closest("button, a, [role='button']"))
        ) {
          (r.preventDefault(), gn(!0));
          return;
        }
        if ((r.ctrlKey || r.metaKey) && r.key.toLowerCase() === "s") {
          (r.preventDefault(), En());
          return;
        }
        if ((r.ctrlKey || r.metaKey) && r.key.toLowerCase() === "z") {
          (r.preventDefault(), r.shiftKey ? _n() : ia());
          return;
        }
        if ((r.ctrlKey || r.metaKey) && r.key.toLowerCase() === "y") {
          (r.preventDefault(), _n());
          return;
        }
        if ((r.ctrlKey || r.metaKey) && r.key.toLowerCase() === "c") {
          (r.preventDefault(), Io());
          return;
        }
        if ((r.ctrlKey || r.metaKey) && r.key.toLowerCase() === "v") {
          (r.preventDefault(), _o());
          return;
        }
        if (r.key === "Enter" && T) {
          (r.preventDefault(), aa());
          return;
        }
        const N = {
          ArrowUp: [0, -1],
          ArrowDown: [0, 1],
          ArrowLeft: [-1, 0],
          ArrowRight: [1, 0],
        }[r.key];
        if (N && !r.ctrlKey && !r.metaKey) {
          const k = r.shiftKey ? 1 : r.altKey ? 0.05 : Kt;
          Eo([N[0] * k, N[1] * k]) && (r.preventDefault(), ce(void 0));
          return;
        }
        const m = r.key.toLowerCase(),
          g = vr.find((k) => k.shortcut.toLowerCase() === m);
        if (g) {
          (r.preventDefault(), Qi(g.id));
          return;
        }
        if (m === "c" && C) {
          (r.preventDefault(), Cn());
          return;
        }
        if (r.key === "Escape") {
          if ((r.preventDefault(), Ze.current || ne || Ae)) {
            ca();
            return;
          }
          if (us) {
            Fs(!1);
            return;
          }
          if (fe || Wt.length || T || ie || fs) {
            (Pe(void 0),
              De([]),
              Se(void 0),
              yt(void 0),
              vt(void 0),
              ce(void 0),
              ee(void 0),
              Nt(!1));
            return;
          }
          if (D) {
            me();
            return;
          }
          if (cn(L)) {
            We("select");
            return;
          }
          (Pe(void 0),
            De([]),
            Se(void 0),
            yt(void 0),
            vt(void 0),
            ce(void 0),
            ee(void 0),
            Nt(!1),
            me(),
            We("select"));
        }
        (r.key === "Delete" || r.key === "Backspace") && ts();
      },
      n = (r) => {
        (r.code === "Space" || r.key === " ") && gn(!1);
      },
      a = () => gn(!1);
    return (
      window.addEventListener("keydown", e),
      window.addEventListener("keyup", n),
      window.addEventListener("blur", a),
      () => {
        (window.removeEventListener("keydown", e),
          window.removeEventListener("keyup", n),
          window.removeEventListener("blur", a));
      }
    );
  });
  function ss(e, n = !0, a = !0, r = !0, l = !1, h = !1, u) {
    var G;
    const p = Rt.current;
    if (!p) return { point: [0, 0] };
    const N = p.createSVGPoint();
    ((N.x = e.clientX), (N.y = e.clientY));
    const m = N.matrixTransform(
        (G = p.getScreenCTM()) == null ? void 0 : G.inverse(),
      ),
      g = [m.x, m.y];
    if ((!Xe && !l) || !n) return { point: g };
    const k = 0.22 / Math.max(0.75, ye),
      excludedWallIds = new Set(Array.isArray(u) ? u : u ? [u] : []),
      O = excludedWallIds.size
        ? b.walls.filter((z) => !excludedWallIds.has(z.id))
        : b.walls,
      Z = O.flatMap((z) => [z.start, z.end]),
      M = [$r(g[0], !0), $r(g[1], !0)],
      I = a ? (h ? cc(g, Z, Kt) : Z.find((z) => X(g, z) < k)) : void 0;
    if (I) {
      const z = h ? I : [...I];
      return { point: z, snap: { point: z, kind: "endpoint" } };
    }
    if (L === "wall" && fe) {
      const z = M[0] - fe[0],
        se = M[1] - fe[1],
        ke = Math.abs(z),
        et = Math.abs(se),
        Ce = !!e.shiftKey,
        en = 0.34;
      let It;
      ke > 0.01 && (Ce ? ke >= et : et / ke < en)
        ? ((M[1] = fe[1]), (It = { point: [...M], kind: "axis" }))
        : et > 0.01 &&
          (Ce ? et > ke : ke / et < en) &&
          ((M[0] = fe[0]), (It = { point: [...M], kind: "axis" }));
      const Vn = b.walls
        .map((_t) => Vr(fe, M, _t.start, _t.end))
        .filter((_t) => !!_t)
        .filter((_t) => X(_t.point, g) < k * 1.6)
        .sort((_t, al) => X(_t.point, g) - X(al.point, g))[0];
      if (Vn)
        return {
          point: Vn.point,
          snap: { point: Vn.point, kind: "intersection" },
        };
      if (It) return { point: M, snap: It };
    }
    const V = r
      ? O.map((z) => ({ wall: z, ...Cr(g, z.start, z.end) }))
          .filter((z) => z.t > 0.001 && z.t < 0.999 && z.distance < k)
          .sort((z, se) => z.distance - se.distance)[0]
      : void 0;
    return V
      ? { point: V.point, snap: { point: V.point, kind: "wall" } }
      : { point: M };
  }
  function Ws(e, n = !0) {
    return ss(e, n).point;
  }
  function ra(e) {
    if (!Bs) return !1;
    if (!T) return (ee(dt), Se({ shape: ds, points: [e] }), ce(void 0), !0);
    const n = T.points[0],
      a = T.points.at(-1),
      r = T.shape === "ring" && T.points.length >= Wn("ring") && X(e, n) < Kn;
    if (!r && X(a, e) < 0.04) return !0;
    const l = r ? T.points : [...T.points, e];
    return (
      ce(void 0),
      r ? aa(l, T.shape) : Se({ shape: T.shape, points: l }),
      !0
    );
  }
  function oa(e, n) {
    const a = ar(n);
    if (Math.abs(a - ye) < 0.001) return;
    const r = Rt.current;
    if (!r) {
      Dt(a);
      return;
    }
    const l = r.getBoundingClientRect();
    if (!l.width || !l.height) {
      Dt(a);
      return;
    }
    const h = Math.max(0, Math.min(1, (e[0] - l.left) / l.width)),
      u = Math.max(0, Math.min(1, (e[1] - l.top) / l.height)),
      p = re.width / ye,
      N = re.height / ye,
      m = re.minX + (re.width - p) / 2 + Xt[0],
      g = re.minY + (re.height - N) / 2 + Xt[1],
      k = m + h * p,
      O = g + u * N,
      Z = re.width / a,
      M = re.height / a,
      I = re.minX + (re.width - Z) / 2,
      V = re.minY + (re.height - M) / 2;
    (Yt([k - I - h * Z, O - V - u * M]), Dt(a));
  }
  function la(e) {
    var r;
    const n = (r = Rt.current) == null ? void 0 : r.getBoundingClientRect(),
      a = n ? [n.left + n.width / 2, n.top + n.height / 2] : [0, 0];
    oa(a, ye + e);
  }
  function Po(e) {
    e.preventDefault();
    const n = Math.exp(-e.deltaY * (e.ctrlKey ? 0.002 : 0.0012));
    oa([e.clientX, e.clientY], ye * n);
  }
  function Do(e, n) {
    const a = n === "door" ? 0.9 : 1.2,
      r = 0.22 / Math.max(0.75, ye),
      l = b.walls
        .map((p) => {
          const N = Cr(e, p.start, p.end);
          return { wall: p, ...N };
        })
        .filter(
          (p) =>
            p.t > 0.001 &&
            p.t < 0.999 &&
            p.distance < r &&
            X(p.wall.start, p.wall.end) >= a,
        )
        .sort((p, N) => p.distance - N.distance)[0];
    if (!l) return;
    const h = X(l.wall.start, l.wall.end),
      u = Math.max(a / 2, Math.min(h - a / 2, l.t * h));
    return {
      type: "opening",
      openingType: n,
      center: oi(l.wall, u),
      angle:
        (Math.atan2(
          l.wall.end[1] - l.wall.start[1],
          l.wall.end[0] - l.wall.start[0],
        ) *
          180) /
        Math.PI,
      width: a,
    };
  }
  function Ao(e, n) {
    if (E || Ae || ne) return;
    if (L === "door" || L === "window") return Do(e, L);
    if (L !== "device" || !He || !ue) return;
    const a = i[He];
    if (!a) return;
    const r = zs ?? as(a);
    if (we(r) && T != null && T.points.length) {
      const l = T.points,
        u =
          (T.shape === "ring" && l.length >= 3 && X(n, l[0]) < Kn) ||
          X(l.at(-1), n) < 0.05
            ? l
            : [...l, n];
      return u.length < 2
        ? void 0
        : {
            type: "device",
            entity: a,
            device: {
              ...Sr(a, b, r, T.shape, u),
              id: "device-placement-preview",
            },
          };
    }
    if (!(ue && ir(b, e, i, { requireKnownDeviceEntity: !0 })))
      return {
        type: "device",
        entity: a,
        device: {
          id: "device-placement-preview",
          entityId: a.entityId,
          kind: hi(a),
          floorId: b.id,
          position: [n[0], rn(a, b.height, r), n[1]],
          rotation: [0, 0, 0],
          modelId: r,
        },
      };
  }
  function alignCreationPoint(point, prioritySnap) {
    const creatingWall = L === "wall",
      placingDevice = L === "device" && !!(He && ue);
    if (!Xe || (!creatingWall && !placingDevice)) return { point, guides: [] };
    return snapCreationPointToAlignment(point, createAlignmentTargets(b), {
      threshold: 0.16 / Math.max(0.75, ye),
      prioritySnap,
      draftStart: creatingWall ? fe : void 0,
    });
  }
  function canRightPanCanvas(e) {
    return shouldRightPanEmptyCanvas({
      button: e.button, pointerType: e.pointerType,
      shiftKey: e.shiftKey, ctrlKey: e.ctrlKey, metaKey: e.metaKey,
      tool: L, selectionCount: pe.length || (D ? 1 : 0),
      hitObject: !!ir(b, ss(e, !1).point, i, { requireKnownDeviceEntity: true }),
    });
  }
  function Fo(e) {
    if (
      e.pointerType === "touch" &&
      (ze.current.set(e.pointerId, [e.clientX, e.clientY]),
      ze.current.size === 2)
    ) {
      (e.preventDefault(), e.currentTarget.setPointerCapture(e.pointerId));
      const [a, r] = [...ze.current.values()];
      ((xs.current = {
        distance: Math.max(1, X(a, r)),
        center: [(a[0] + r[0]) / 2, (a[1] + r[1]) / 2],
        zoom: ye,
        pan: Xt,
      }),
        cs(void 0),
        Es(void 0),
        ce(void 0),
        ee(dt));
      return;
    }
    if (
      e.button === 1 ||
      (xn && e.button === 0) ||
      (L === "pan" && e.button === 0) ||
      canRightPanCanvas(e)
    ) {
      (e.preventDefault(),
        (Mt.current = !1),
        e.currentTarget.setPointerCapture(e.pointerId),
        ee(dt),
        ce(void 0),
        fn({ client: [e.clientX, e.clientY], origin: Xt }));
      return;
    }
    if (e.button === 0 && ra(ss(e).point)) {
      (e.preventDefault(), (Mt.current = !0));
      return;
    }
    if (qt && e.button === 0) {
      (e.preventDefault(), ee(dt));
      return;
    }
    if (L === "select" && e.button === 0) {
      (e.preventDefault(),
        e.currentTarget.setPointerCapture(e.pointerId),
        ee(dt));
      const a = Ws(e, !1);
      (ce(void 0), cs({ start: a, end: a }));
    }
  }
  function To(e) {
    var h, u;
    if (e.button !== 0 || Ae || Mt.current) {
      Mt.current = !1;
      return;
    }
    const n = ss(e, L !== "calibrate"),
      a = alignCreationPoint(n.point, n.snap).point,
      r = ss(e, !1).point,
      l = L === "device" && !!(He && T);
    if (qt) {
      (Mo(qt, a), Ve({ type: "device", id: qt }));
      const p =
        (h = b.devices.find((N) => N.id === qt)) == null ? void 0 : h.entityId;
      (B(p), Te(!0));
      return;
    }
    if (Us && ue && !l) {
      if (R && Sc(r, R)) {
        es(
          { type: "furniture", id: R.id },
          e.shiftKey || e.ctrlKey || e.metaKey,
        );
        return;
      }
      const p = ir(b, r, i, { requireKnownDeviceEntity: !0 });
      if (p) {
        es(p, e.shiftKey || e.ctrlKey || e.metaKey);
        return;
      }
    }
    if (L === "calibrate") {
      if (!C) return;
      !fs || !Q || be
        ? (Nt(!0), ee(dt), Tt(a), ct(void 0))
        : X(Q, a) >= 0.05 && (ct(a), ee(void 0), Te(!0));
      return;
    }
    if (L === "wall") {
      if (!fe) {
        (ee(dt), Pe(a), De([a]), setAlignmentGuides([]));
        return;
      }
      if (X(fe, a) < 0.2) return;
      const p = Wt.length >= 3 && X(a, Wt[0]) < 0.22,
        N = p ? Wt[0] : a,
        m = {
          id: `wall-${Date.now()}`,
          start: fe,
          end: N,
          thickness: 0.14,
          height: b.height,
          materialId: (u = P.materials[0]) == null ? void 0 : u.id,
        };
      (F((g) => {
        var O;
        const k = nr(g.walls, m, g.openings);
        return {
          ...g,
          walls: k.walls,
          openings: k.openings,
          rooms: Vt(
            k.walls,
            g.rooms,
            (O = P.materials.find((Z) => Z.id.includes("floor"))) == null
              ? void 0
              : O.id,
          ),
        };
      }),
        Ve({ type: "wall", id: m.id }),
        vt(void 0),
        setAlignmentGuides([]),
        p
          ? (Pe(void 0), De([]), ee(void 0), me())
          : (Pe(a), De((g) => [...g, a])));
      return;
    }
    if (L === "device" && He && ue) {
      const p = i[He];
      if (!p) return;
      const N = zs ?? as(p);
      if (we(N)) {
        (ra(a), setAlignmentGuides([]));
        return;
      }
      const m = {
        id: `device-${Date.now()}`,
        entityId: p.entityId,
        name: p.deviceDisplayName || p.name,
        deviceId: p.deviceId,
        deviceTemplateId: p.deviceTemplateId,
        customModel: resolveBoundDevicePresentation(p, N).customModel,
        kind: hi(p),
        floorId: b.id,
        position: [a[0], rn(p, b.height, N), a[1]],
        verticalReference: cameraModelDefinition(N) && N !== "camera.desktop" ? {targetType:"ceiling",surface:"bottom",offset:0} : {
          targetType: "floor",
          surface: "top",
          offset: rn(p, b.height, N),
        },
        rotation: [0, 0, 0],
        modelId: N,
      };
      (F((g) => ({ ...g, devices: [...g.devices, m] })),
        Ve({ type: "device", id: m.id }),
        B(m.entityId),
        ce(void 0),
        setAlignmentGuides([]),
        Hs(void 0));
      return;
    }
    if (L === "furniture") {
      const selectedModelId = Qt.startsWith("model:") ? Qt.slice(6) : void 0,
        selectedModel = selectedModelId
          ? customFurnitureModels.find((model) => model.id === selectedModelId)
          : void 0,
        p = selectedModel?.dimensions ?? gt[Qt];
      if (!p) return;
      const furnitureKind = selectedModel ? "custom_model" : Qt,
        N = b.rooms.find((g) => _e(a, g.polygon)),
        m = {
          id: `furniture-${Date.now()}`,
          kind: furnitureKind,
          name: selectedModel?.name,
          modelId: selectedModel?.id,
          customModel: selectedModel ? structuredClone(selectedModel) : void 0,
          floorId: b.id,
          roomId: N == null ? void 0 : N.id,
          position: a,
          rotation: 0,
          width: p.width,
          depth: p.depth,
          height: p.height,
          ...(furnitureKind === "vanity_mirror_cabinet"
            ? normalizeVanityMirrorCabinet(p)
            : {}),
          showerStyle:
            furnitureKind === "shower_enclosure" ? "diamond" : void 0,
          showerCornerCut: furnitureKind === "shower_enclosure" ? 0.24 : void 0,
          elevation: CABINET_FURNITURE_KINDS.has(furnitureKind) ? 0 : void 0,
          cabinetDepth: furnitureKind === "cabinet" ? p.depth : void 0,
          cabinetStyle: furnitureKind === "cabinet" ? "base" : void 0,
          cabinetDoorCount: furnitureKind === "cabinet" ? 3 : void 0,
          cabinetSegments:
            furnitureKind === "cabinet"
              ? createCabinetSegments(p.width, p.depth)
              : void 0,
          verticalReference: {
            targetType: "floor",
            surface: "top",
            offset: 0,
          },
        };
      (F((g) => ({ ...g, furniture: [...g.furniture, m] })),
        Ve({ type: "furniture", id: m.id }));
      return;
    }
    L === "select" && me();
  }
  function Ho(e, n, a) {
    const r = X(e.start, e.end),
      l = e.end[0] - e.start[0],
      h = e.end[1] - e.start[1],
      u = ((n[0] - e.start[0]) * l + (n[1] - e.start[1]) * h) / (r * r),
      p = a === "door" ? 0.9 : 1.2,
      N = Math.max(p / 2, Math.min(r - p / 2, u * r)),
      m = {
        id: `${a}-${Date.now()}`,
        type: a,
        wallId: e.id,
        offset: N,
        width: p,
        height: a === "door" ? 2.1 : 1.2,
        bottom: a === "door" ? 0 : 0.9,
        windowStyle: "standard",
        hasLeaf: !1,
        swing: "inward",
        hinge: "start",
      };
    (F((g) => ({ ...g, openings: [...g.openings, m] })),
      ce(void 0),
      Ve({ type: "opening", id: m.id }));
  }
  function Qe(e, n) {
    (n.preventDefault(),
      n.stopPropagation(),
      setAlignmentGuides([]),
      setCabinetRelationFeedback(void 0),
      (Ze.current = {
        original: tt(P),
        changed: !1,
        affectsTopology:
          e.type === "wall-start" ||
          e.type === "wall-end" ||
          e.type === "wall-offset" ||
          e.type === "wall-chain-start" ||
          e.type === "wall-chain-end" ||
          e.type === "wall-chain-offset",
        initialDirty: Ue,
        clientStart: [n.clientX, n.clientY],
        activated: !1,
      }),
      ee(dt),
      Es(e),
      ce(void 0),
      (Rt.current ?? n.currentTarget).setPointerCapture(n.pointerId));
  }
  function zo(e) {
    var Z;
    if (e.pointerType === "touch" && ze.current.has(e.pointerId)) {
      ze.current.set(e.pointerId, [e.clientX, e.clientY]);
      const M = xs.current;
      if (M && ze.current.size >= 2) {
        const [I, V] = [...ze.current.values()],
          G = Math.max(1, X(I, V)),
          z = [(I[0] + V[0]) / 2, (I[1] + V[1]) / 2],
          se = e.currentTarget.getBoundingClientRect();
        (Dt(ar((M.zoom * G) / M.distance)),
          Yt([
            M.pan[0] -
              (((z[0] - M.center[0]) / Math.max(1, se.width)) * re.width) /
                M.zoom,
            M.pan[1] -
              (((z[1] - M.center[1]) / Math.max(1, se.height)) * re.height) /
                M.zoom,
          ]),
          ce(void 0));
        return;
      }
    }
    if (ne) {
      (ce(void 0), cs((M) => M && { ...M, end: Ws(e, !1) }));
      return;
    }
    if (Ae) {
      ce(void 0);
      if (canvasPanHasMoved(Ae.client, [e.clientX, e.clientY])) Mt.current = !0;
      const M = e.currentTarget.getBoundingClientRect();
      Yt([
        Ae.origin[0] - (((e.clientX - Ae.client[0]) / M.width) * re.width) / ye,
        Ae.origin[1] -
          (((e.clientY - Ae.client[1]) / M.height) * re.height) / ye,
      ]);
      return;
    }
    const wallChainEndpoint =
        (E == null ? void 0 : E.type) === "wall-chain-start" ||
        (E == null ? void 0 : E.type) === "wall-chain-end",
      n =
        (E == null ? void 0 : E.type) === "wall-start" ||
        (E == null ? void 0 : E.type) === "wall-end" ||
        wallChainEndpoint,
      a = (E == null ? void 0 : E.type) === "light-strip-point",
      r = (E == null ? void 0 : E.type) === "wall-offset" ? E : void 0,
      wallChainOffset =
        (E == null ? void 0 : E.type) === "wall-chain-offset" ? E : void 0,
      wallChainDrag = wallChainEndpoint ? E : wallChainOffset,
      l = !!r || !!wallChainOffset,
      h = ss(
        e,
        L !== "calibrate",
        !a,
        !a,
        n,
        !1,
        n ? (wallChainDrag == null ? E.id : wallChainDrag.wallIds) : void 0,
      ),
      u = ss(e, !1).point,
      N = Xe ? qc(u, Pc) : u,
      m = (Z = Ze.current) == null ? void 0 : Z.original.floors[Re],
      g = r
        ? ((m == null ? void 0 : m.walls.find((M) => M.id === r.id)) ??
          r.originWall)
        : void 0,
      originWallChain =
        wallChainDrag && m
          ? getCollinearWallChain(m.walls, wallChainDrag.wallIds)
          : void 0;
    let p = l ? u : h.point,
      alignmentGuidesForDrag = [],
      creationAlignment,
      wallAlignment;
    const alignmentThreshold = 0.16 / Math.max(0.75, ye);
    if (!E) {
      creationAlignment = alignCreationPoint(p, h.snap);
      p = creationAlignment.point;
    }
    if (Xe && (E == null ? void 0 : E.type) === "device" && !h.snap) {
      const alignment = snapPointToAlignment(
        p,
        createAlignmentTargets(b, { deviceId: E.id }),
        { threshold: alignmentThreshold },
      );
      ((p = alignment.point), (alignmentGuidesForDrag = alignment.guides));
    } else if (Xe && n && !h.snap) {
      const alignment = snapPointToAlignment(
        p,
        createAlignmentTargets(
          b,
          wallChainDrag ? { wallIds: wallChainDrag.wallIds } : { wallId: E.id },
        ),
        { threshold: alignmentThreshold },
      );
      ((p = alignment.point), (alignmentGuidesForDrag = alignment.guides));
    }
    if (
      m &&
      ((r && g) ||
        (wallChainOffset &&
          (originWallChain == null ? void 0 : originWallChain.ok)))
    ) {
      const offsetDrag = r ?? wallChainOffset,
        rawDelta = [
          u[0] - offsetDrag.pointerStart[0],
          u[1] - offsetDrag.pointerStart[1],
        ],
        baseDelta = Xe ? Gn(rawDelta, Kt) : rawDelta,
        offsetStart = wallChainOffset ? originWallChain.start : g.start,
        offsetEnd = wallChainOffset ? originWallChain.end : g.end,
        offsetDx = Math.abs(offsetEnd[0] - offsetStart[0]),
        offsetDy = Math.abs(offsetEnd[1] - offsetStart[1]),
        normalAxes =
          offsetDx > offsetDy * 2 ? [1] : offsetDy > offsetDx * 2 ? [0] : [],
        movingAnchors = e.shiftKey
          ? wallChainOffset
            ? [
                originWallChain.start,
                originWallChain.end,
                originWallChain.midpoint,
              ]
            : [g.start, g.end, si(g)]
          : [wallChainOffset ? originWallChain.midpoint : si(g)];
      wallAlignment = Xe
        ? snapTranslationToAlignment(
            movingAnchors,
            createAlignmentTargets(
              m,
              wallChainOffset
                ? { wallIds: wallChainOffset.wallIds }
                : { wallId: r.id },
            ),
            baseDelta,
            {
              threshold: alignmentThreshold,
              axes: e.shiftKey ? [0, 1] : normalAxes,
            },
          )
        : { delta: rawDelta, guides: [] };
    }
    const k =
      r && m && g
        ? mc(m.walls, r.id, g, wallAlignment.delta, {
            snapDistance: 0.22 / Math.max(0.75, ye),
            gridSize: Kt,
            snapToGrid: !1,
            snapToWalls: e.shiftKey,
          })
        : void 0;
    if (r || wallChainOffset)
      alignmentGuidesForDrag =
        k != null && k.snap
          ? []
          : ((wallAlignment == null ? void 0 : wallAlignment.guides) ?? []);
    if (
      (yt(p),
      setAlignmentGuides(
        E ? alignmentGuidesForDrag : (creationAlignment?.guides ?? []),
      ),
      vt(
        L === "wall" ||
          (L === "device" && !!He) ||
          n ||
          (E == null ? void 0 : E.type) === "device"
          ? (h.snap ??
              (creationAlignment != null && creationAlignment.guides.length
                ? { point: p, kind: "alignment" }
                : void 0))
          : k != null && k.snap
            ? { point: k.snap.point, kind: k.snap.kind }
            : void 0,
      ),
      ce(Ao(u, p)),
      !E)
    )
      return;
    ce(void 0);
    const O = Ze.current;
    if (O && !O.activated) {
      if (X([e.clientX, e.clientY], O.clientStart) < Fc) return;
      O.activated = !0;
    }
    let cabinetDragUpdate;
    if (
      E.type === "cabinet-segment-offset" ||
      E.type === "cabinet-segment-point"
    ) {
      const originFurniture = E.originFurniture,
        cosine = Math.cos(originFurniture.rotation),
        sine = Math.sin(originFurniture.rotation);
      let cabinetSegments;
      if (E.type === "cabinet-segment-offset") {
        const worldDelta = [u[0] - E.pointerStart[0], u[1] - E.pointerStart[1]],
          localDelta = [
            worldDelta[0] * cosine + worldDelta[1] * sine,
            -worldDelta[0] * sine + worldDelta[1] * cosine,
          ],
          snappedDelta = Xe
            ? [Ss(localDelta[0], qn), Ss(localDelta[1], qn)]
            : localDelta;
        cabinetSegments = translateCabinetSegment(
          originFurniture.cabinetSegments,
          E.segmentId,
          snappedDelta,
        );
      } else {
        const relativeX = u[0] - originFurniture.position[0],
          relativeY = u[1] - originFurniture.position[1],
          localPoint = [
            relativeX * cosine + relativeY * sine,
            -relativeX * sine + relativeY * cosine,
          ],
          gridPoint = Xe
            ? [Ss(localPoint[0], qn), Ss(localPoint[1], qn)]
            : localPoint,
          relationSnap = snapCabinetJunctionToRelations(
            originFurniture.cabinetSegments,
            E.originPoint,
            gridPoint,
          );
        cabinetSegments = moveCabinetJunction(
          originFurniture.cabinetSegments,
          E.originPoint,
          relationSnap.point,
        );
      }
      const relation = findCabinetSegmentRelations(
          cabinetSegments,
          E.segmentId,
        )[0],
        bounds = cabinetLayoutBounds(
          cabinetSegments,
          originFurniture.cabinetDepth ?? originFurniture.depth,
        );
      cabinetDragUpdate = { cabinetSegments, bounds };
      setCabinetRelationFeedback(
        relation ? { furnitureId: E.id, ...relation } : void 0,
      );
    }
    if (E.type === "wall-chain-offset") {
      if (
        !m ||
        !(originWallChain != null && originWallChain.ok) ||
        !wallAlignment
      )
        return;
      const result = transformCollinearWallChain(
        m.walls,
        m.openings,
        E.wallIds,
        { type: "translate", delta: wallAlignment.delta },
      );
      if (!result.ok) return;
      Ct((M) => ({
        ...M,
        walls: result.walls,
        openings: result.openings,
      }));
    } else if (E.type === "wall-chain-start" || E.type === "wall-chain-end") {
      if (!m || !(originWallChain != null && originWallChain.ok)) return;
      const result = transformCollinearWallChain(
        m.walls,
        m.openings,
        E.wallIds,
        {
          type: "resize",
          endpoint: E.type === "wall-chain-start" ? "start" : "end",
          point: h.snap || alignmentGuidesForDrag.length ? p : Gc(p),
        },
      );
      if (!result.ok) return;
      Ct((M) => ({
        ...M,
        walls: result.walls,
        openings: result.openings,
      }));
    } else if (E.type === "wall-offset") {
      if (!(k != null && k.movedWall)) return;
      Ct((M) => ({ ...M, walls: k.walls }));
    } else
      E.type === "opening"
        ? Ct((M) => {
            const I = M.openings.find((Ce) => Ce.id === E.id),
              V = I ? M.walls.find((Ce) => Ce.id === I.wallId) : void 0;
            if (!I || !V) return M;
            const G = X(V.start, V.end),
              z = V.end[0] - V.start[0],
              se = V.end[1] - V.start[1],
              ke = ((p[0] - V.start[0]) * z + (p[1] - V.start[1]) * se) / G,
              et = Math.max(I.width / 2, Math.min(G - I.width / 2, ke));
            return {
              ...M,
              openings: M.openings.map((Ce) =>
                Ce.id === I.id ? { ...Ce, offset: et } : Ce,
              ),
            };
          })
        : E.type === "device"
          ? Ct((M) => ({
              ...M,
              devices: M.devices.map((I) => {
                var z;
                if (I.id !== E.id) return I;
                const V = [p[0], I.position[1], p[1]],
                  G = [p[0] - I.position[0], p[1] - I.position[2]];
                return an(
                  {
                    ...I,
                    position: V,
                    roomId:
                      (z = M.rooms.find((se) => _e(p, se.polygon))) == null
                        ? void 0
                        : z.id,
                  },
                  G,
                );
              }),
            }))
          : E.type === "light-strip-point"
            ? Ct((M) => {
                const I = Bt(E.originDevice),
                  V = Lt(E.originDevice).map((G, z) =>
                    z === E.pointIndex ? p : G,
                  );
                return Ga(V, I) < ft
                  ? M
                  : {
                      ...M,
                      devices: M.devices.map((G) =>
                        G.id !== E.id
                          ? G
                          : os(E.originDevice)
                            ? jl(G, M, I, V)
                            : yl(G, M, V[0], V[1]),
                      ),
                    };
              })
            : E.type === "cabinet-segment-offset"
              ? Ct((M) => ({
                  ...M,
                  furniture: M.furniture.map((I) => {
                    if (I.id !== E.id) return I;
                    return {
                      ...I,
                      cabinetSegments: cabinetDragUpdate.cabinetSegments,
                      width: cabinetDragUpdate.bounds.width,
                      depth: cabinetDragUpdate.bounds.depth,
                    };
                  }),
                }))
              : E.type === "cabinet-segment-point"
                ? Ct((M) => ({
                    ...M,
                    furniture: M.furniture.map((I) => {
                      if (I.id !== E.id) return I;
                      return {
                        ...I,
                        cabinetSegments: cabinetDragUpdate.cabinetSegments,
                        width: cabinetDragUpdate.bounds.width,
                        depth: cabinetDragUpdate.bounds.depth,
                      };
                    }),
                  }))
                : E.type === "furniture"
                  ? Ct((M) => ({
                      ...M,
                      furniture: M.furniture.map((I) => {
                        var V;
                        const position = E.pointerStart
                          ? translateFurnitureFromPointer(
                              E.originPosition,
                              E.pointerStart,
                              u,
                              Xe ? Kt : void 0,
                            )
                          : N;
                        return I.id === E.id
                          ? {
                              ...I,
                              position,
                              roomId:
                                (V = M.rooms.find((G) =>
                                  _e(position, G.polygon),
                                )) == null
                                  ? void 0
                                  : V.id,
                            }
                          : I;
                      }),
                    }))
                  : E.type === "furniture-rotate"
                    ? Ct((M) => {
                        const I = M.furniture.find((z) => z.id === E.id);
                        if (!I) return M;
                        const V = Math.atan2(
                            u[1] - E.originFurniture.position[1],
                            u[0] - E.originFurniture.position[0],
                          ),
                          G =
                            Xe && !e.altKey
                              ? (Ss((V * 180) / Math.PI, Ac) * Math.PI) / 180
                              : V;
                        return {
                          ...M,
                          furniture: M.furniture.map((z) =>
                            z.id === I.id ? { ...z, rotation: G } : z,
                          ),
                        };
                      })
                    : E.type === "furniture-resize"
                      ? Ct((M) => {
                          const I = E.originFurniture,
                            V = u[0] - I.position[0],
                            G = u[1] - I.position[1],
                            z = Math.cos(I.rotation),
                            se = Math.sin(I.rotation),
                            ke = V * z + G * se,
                            et = -V * se + G * z,
                            Ce = Math.max(
                              0.2,
                              Xe ? Ss(Math.abs(ke) * 2, qn) : Math.abs(ke) * 2,
                            ),
                            en = Math.max(
                              0.2,
                              Xe ? Ss(Math.abs(et) * 2, qn) : Math.abs(et) * 2,
                            );
                          return {
                            ...M,
                            furniture: M.furniture.map((It) =>
                              It.id === I.id
                                ? { ...It, width: Ce, depth: en }
                                : It,
                            ),
                          };
                        })
                      : Ct((M) => {
                          var z;
                          const I = M.walls.find((se) => se.id === E.id);
                          if (!I) return M;
                          const V =
                              h.snap || alignmentGuidesForDrag.length
                                ? p
                                : Gc(p),
                            G = fc(
                              M.walls,
                              I.id,
                              E.type === "wall-start" ? "start" : "end",
                              V,
                              {
                                moveConnected: e.shiftKey,
                                allowEndpointMerge:
                                  ((z = h.snap) == null ? void 0 : z.kind) ===
                                  "endpoint",
                              },
                            );
                          return G === M.walls ? M : { ...M, walls: G };
                        });
  }
  function ca() {
    const e = Ze.current;
    (e != null && e.changed && (U(tt(e.original)), ve(e.initialDirty)),
      ze.current.clear(),
      (xs.current = void 0),
      (Ze.current = void 0),
      Es(void 0),
      fn(void 0),
      cs(void 0),
      ee(void 0),
      yt(void 0),
      vt(void 0),
      setAlignmentGuides([]),
      setCabinetRelationFeedback(void 0),
      ce(void 0),
      Se(void 0));
  }
  function Ro() {
    E ||
      Ae ||
      ne ||
      (yt(void 0),
      vt(void 0),
      setAlignmentGuides([]),
      setCabinetRelationFeedback(void 0),
      ce(void 0));
  }
  function Oo(e) {
    if (
      (e == null ? void 0 : e.pointerType) === "touch" &&
      (ze.current.delete(e.pointerId), xs.current)
    ) {
      ze.current.size < 2 &&
        ((xs.current = void 0),
        ze.current.clear(),
        ee(void 0),
        (Mt.current = !0));
      return;
    }
    if (ne) {
      const a = Math.min(ne.start[0], ne.end[0]),
        r = Math.max(ne.start[0], ne.end[0]),
        l = Math.min(ne.start[1], ne.end[1]),
        h = Math.max(ne.start[1], ne.end[1]),
        u = (g) => g[0] >= a && g[0] <= r && g[1] >= l && g[1] <= h,
        p = (g) => {
          const k = [g.position[0], g.position[2]];
          return ws(g, i[g.entityId]).id !== "light.strip"
            ? u(k)
            : [k, ...Lt(g)].some(u);
        },
        N = [
          ...b.walls
            .filter((g) => u(si(g)))
            .map((g) => ({ type: "wall", id: g.id })),
          ...b.openings
            .filter((g) => {
              const k = b.walls.find((O) => O.id === g.wallId);
              return k ? u(oi(k, g.offset)) : !1;
            })
            .map((g) => ({ type: "opening", id: g.id })),
          ...b.furniture
            .filter((g) => u(g.position))
            .map((g) => ({ type: "furniture", id: g.id })),
          ...b.devices
            .filter((g) => i[g.entityId])
            .filter(p)
            .map((g) => ({ type: "device", id: g.id })),
        ],
        m = r - a > 0.06 || h - l > 0.06;
      if (m && N.length) {
        (Is(N[0]), _s(N.map(kt)));
        const g =
          N[0].type === "device"
            ? b.devices.find((k) => k.id === N[0].id)
            : void 0;
        (B(g == null ? void 0 : g.entityId), Te(!0), lt(!1));
      } else m || me();
      ((Mt.current = !0), cs(void 0), ee(void 0));
      return;
    }
    const n = Ze.current;
    (n != null &&
      n.changed &&
      (n.affectsTopology
        ? Vo(
            n.original,
            (E == null ? void 0 : E.type) === "wall-offset" ||
              (E == null ? void 0 : E.type) === "wall-start" ||
              (E == null ? void 0 : E.type) === "wall-end"
              ? E.id
              : (E == null ? void 0 : E.type) === "wall-chain-start" ||
                  (E == null ? void 0 : E.type) === "wall-chain-end"
                ? E.endpointWallId
                : void 0,
          )
        : (he((a) => [...a.slice(-49), n.original]), it([]))),
      (E || Ae) && ee(void 0),
      E &&
        ((Mt.current = !0),
        window.setTimeout(() => {
          Mt.current = !1;
        }, 0)),
      yt(void 0),
      vt(void 0),
      setAlignmentGuides([]),
      setCabinetRelationFeedback(void 0),
      ce(void 0),
      (Ze.current = void 0),
      Es(void 0),
      fn(void 0));
  }
  function Vo(e, n) {
    (U((a) => {
      const r = a.floors.map((l, h) => {
        var m;
        if (h !== Re) return l;
        let u = l.walls,
          p = l.openings;
        if (n) {
          const g = l.walls.find((k) => k.id === n);
          if (g) {
            const k = nr(
                l.walls.filter((Z) => Z.id !== n),
                g,
                l.openings,
              ),
              O = k.openings.some((Z, M) => {
                const I = l.openings[M];
                return (
                  !I ||
                  Z.wallId !== I.wallId ||
                  Math.abs(Z.offset - I.offset) > 1e-4
                );
              });
            ((u = k.walls.length === l.walls.length ? l.walls : k.walls),
              (p = O ? k.openings : l.openings));
          }
        }
        const N = Vt(
          u,
          l.rooms,
          (m = a.materials.find((g) => g.id.includes("floor"))) == null
            ? void 0
            : m.id,
        );
        return Lr(N, l.rooms) && u === l.walls && p === l.openings
          ? l
          : { ...l, walls: u, openings: p, rooms: N };
      });
      return { ...a, floors: r };
    }),
      he((a) => [...a.slice(-49), e]),
      it([]),
      ve(!0),
      Ye(n ? "墙体交点与房间边界已自动更新" : "房间边界已自动更新"),
      window.setTimeout(() => Ye(void 0), 1800));
  }
  function Bo() {
    var n;
    const e = Vt(
      b.walls,
      b.rooms,
      (n = P.materials.find((a) => a.id.includes("floor"))) == null
        ? void 0
        : n.id,
    );
    (Lr(e, b.rooms) || F((a) => ({ ...a, rooms: e })),
      me(),
      Ye(
        e.length ? `已识别 ${e.length} 个封闭房间` : "当前墙体尚未形成封闭房间",
      ),
      window.setTimeout(() => Ye(void 0), 2200));
  }
  function da(e = !1) {
    const n = `floor-${Date.now()}`,
      a = Math.max(...P.floors.map((l) => l.level), 0) + 1,
      r = e
        ? {
            ...tt({ ...P, floors: [b] }).floors[0],
            id: n,
            name: `${a} 层`,
            level: a,
            devices: [],
            furniture: b.furniture.map((l) => ({
              ...l,
              id: `${l.id}-floor-${Date.now()}`,
              floorId: n,
            })),
          }
        : {
            id: n,
            name: `${a} 层`,
            level: a,
            height: b.height,
            walls: [],
            rooms: [],
            openings: [],
            devices: [],
            furniture: [],
          };
    (ht((l) => ({ ...l, floors: [...l.floors, r] })),
      $e(n),
      me(),
      Dt(1),
      Yt([0, 0]));
  }
  function Ko() {
    if (P.floors.length <= 1) return;
    const e = P.floors.find((n) => n.id !== b.id);
    (ht((n) => ({ ...n, floors: n.floors.filter((a) => a.id !== b.id) })),
      $e((e == null ? void 0 : e.id) ?? ""),
      me());
  }
  function Wo(e) {
    if (!A) return;
    const n = qi("wall");
    n.size || n.add(A.id);
    const a = `wall-material-${A.id}`;
    ht((r) => ({
      ...r,
      materials: r.materials.some((l) => l.id === a)
        ? r.materials.map((l) => (l.id === a ? { ...l, color: e } : l))
        : [...r.materials, { id: a, name: "墙面", color: e, roughness: 0.88 }],
      floors: r.floors.map((l, h) =>
        h === Re
          ? {
              ...l,
              walls: l.walls.map((u) =>
                n.has(u.id) ? { ...u, materialId: a } : u,
              ),
            }
          : l,
      ),
    }));
  }
  function ha(e) {
    if (!A) return;
    const n = qi("wall");
    (n.size || n.add(A.id),
      ht((a) => ({
        ...a,
        floors: a.floors.map((r, l) =>
          l === Re
            ? {
                ...r,
                walls: r.walls.map((h) =>
                  n.has(h.id) ? { ...h, virtual: e, transparent: false } : h,
                ),
              }
            : r,
        ),
      })));
  }
  async function En() {
    if (!(!Ue || Ut)) {
      (ki(!0), Fe(void 0));
      const session=saveSession.current;
      const ticket={projectId:session.projectId,generation:session.generation,expectedVersion:session.baseVersion,snapshot:P};
      try {
        const e = {
          ...P,
          updatedAt: new Date().toISOString(),
          version: P.version + 1,
        };
        const saved=await v(e,{expectedVersion:ticket.expectedVersion});
        if(saveSession.current!==session)return;
        session.blocked=false;
        // Keep edits made while this request was in flight; acknowledge only this snapshot.
        U(current=>{const result=finishProjectSave(session,ticket,current,saved);ve(result.dirty);return result.project;});
        Di(saved.updatedAt);
      } catch (e) {
        if([409,423,428].includes(e.statusCode))session.blocked=true;
        Fe(formatProjectSaveError(e instanceof Error ? e.message : "保存失败，请重试", P, i));
      } finally {
        ki(!1);
      }
    }
  }
  x.useEffect(() => {
    if (!Ue || Ut || E || saveSession.current.blocked) return;
    const e = window.setTimeout(() => {
      En();
    }, 900);
    return () => window.clearTimeout(e);
  }, [P, E, Ue, Ut]);
  async function Xo(e) {
    if (e)
      try {
        const n = await e.text(),
          a = JSON.parse(n);
        if (
          !window.confirm(
            a?.format === "ha3d-complete-backup"
              ? "导入会替换当前户型，并恢复备份中的自定义设备模板、绑定、3D 模型与控制面板。当前户型会保留一份自动备份，是否继续？"
              : "这是旧版项目 JSON。导入会替换当前户型，但不会改动自定义设备平台数据，并会保留一份自动备份。是否继续？",
          )
        )
          return;
        (await j(a), me(), ve(!1), Fe(void 0));
      } catch (n) {
        Fe(
          n instanceof Error
            ? `导入失败：${n.message}`
            : "导入失败，请检查 JSON 文件",
        );
      }
  }
  async function pa() {
    try {
      const e = await wl(s.id),
        n = URL.createObjectURL(e.blob),
        a = document.createElement("a");
      ((a.href = n),
        (a.download = e.filename),
        a.click(),
        window.setTimeout(() => URL.revokeObjectURL(n), 0));
    } catch (e) {
      Fe(e instanceof Error ? `导出失败：${e.message}` : "导出失败");
    }
  }
  async function ua() {
    try {
      (ao(await S()), Ii(!0));
    } catch (e) {
      Fe(e instanceof Error ? `读取备份失败：${e.message}` : "读取备份失败");
    }
  }
  async function ma(e) {
    if (
      window.confirm(
        `恢复 ${new Date(e.createdAt).toLocaleString()} 的备份？当前数据会先自动备份。`,
      )
    )
      try {
        (await _(e.id), Ii(!1), me(), ve(!1));
      } catch (n) {
        Fe(n instanceof Error ? `恢复失败：${n.message}` : "恢复失败");
      }
  }
  async function fa() {
    if (window.confirm("重置会清空当前户型并保留一份自动备份。是否继续？"))
      try {
        (await y(), me(), ve(!1), he([]), it([]), Fe(void 0));
      } catch (e) {
        Fe(e instanceof Error ? `重置失败：${e.message}` : "重置失败");
      }
  }
  async function xa() {
    try {
      (_i(await H()), ro(!0));
    } catch (e) {
      Fe(
        e instanceof Error
          ? `读取绑定建议失败：${e.message}`
          : "读取绑定建议失败",
      );
    }
  }
  async function ga(e) {
    const n = `${e.floorId}:${e.roomId}`;
    Li(n);
    try {
      (await W([e]), _i((a) => a.filter((r) => r !== e)), ve(!1));
    } catch (a) {
      Fe(a instanceof Error ? `应用绑定失败：${a.message}` : "应用绑定失败");
    } finally {
      Li(void 0);
    }
  }
  async function ja(e) {
    if (!e) return;
    const n = await new Promise((l, h) => {
        const u = new FileReader();
        ((u.onload = () => l(String(u.result))),
          (u.onerror = () => h(u.error)),
          u.readAsDataURL(e));
      }),
      a = await Pr(n),
      r = ai(ys, a, 100);
    (await $({
      name: e.name,
      dataUrl: n,
      opacity: At / 100,
      scaleMeters: 1,
      aspectRatio: a,
      scalePercent: 100,
      worldX: r.x,
      worldY: r.y,
      worldWidth: r.width,
      worldHeight: r.height,
    }),
      Ti(a),
      Ts(100),
      Gt(r),
      Tt(void 0),
      ct(void 0),
      ms(3),
      Nt(!1),
      U((l) => ({
        ...l,
        assets: [
          ...l.assets.filter((h) => {
            var u;
            return (
              ((u = h.metadata) == null ? void 0 : u.kind) !==
              "floorplan-reference"
            );
          }),
          {
            id: `blueprint-${Date.now()}`,
            type: "image",
            name: e.name,
            url: n,
            metadata: {
              kind: "floorplan-reference",
              opacity: At / 100,
              scaleMeters: 1,
              aspectRatio: a,
              scalePercent: 100,
              worldX: r.x,
              worldY: r.y,
              worldWidth: r.width,
              worldHeight: r.height,
            },
          },
        ],
      })));
  }
  function ya(e) {
    (Ai(e),
      U((n) => ({
        ...n,
        assets: n.assets.map((a) => {
          var r;
          return ((r = a.metadata) == null ? void 0 : r.kind) ===
            "floorplan-reference"
            ? { ...a, metadata: { ...a.metadata, opacity: e / 100 } }
            : a;
        }),
      })),
      ve(!0));
  }
  function va(e) {
    if (!le || Ft <= 0) return;
    const n = e / Ft,
      a = [le.x + le.width / 2, le.y + le.height / 2],
      r = {
        x: a[0] - (le.width * n) / 2,
        y: a[1] - (le.height * n) / 2,
        width: le.width * n,
        height: le.height * n,
      };
    (Ts(e),
      Gt(r),
      Tt(void 0),
      ct(void 0),
      Nt(!1),
      U((l) => ({
        ...l,
        assets: l.assets.map((h) => {
          var u;
          return ((u = h.metadata) == null ? void 0 : u.kind) ===
            "floorplan-reference"
            ? {
                ...h,
                metadata: {
                  ...h.metadata,
                  scalePercent: e,
                  aspectRatio: Fi,
                  worldX: r.x,
                  worldY: r.y,
                  worldWidth: r.width,
                  worldHeight: r.height,
                  calibrationStartX: void 0,
                  calibrationStartY: void 0,
                  calibrationEndX: void 0,
                  calibrationEndY: void 0,
                  calibrationLengthMeters: void 0,
                },
              }
            : h;
        }),
      })),
      ve(!0));
  }
  function ba() {
    if (!le || !Q || !be || Ge <= 0) return;
    const e = X(Q, be);
    if (e < 0.05) return;
    const n = Ge / e;
    if (n < 0.02 || n > 50) {
      (Ye("标定比例超出合理范围，请重新选择两个点"),
        window.setTimeout(() => Ye(void 0), 2200));
      return;
    }
    const a = {
        x: Q[0] + (le.x - Q[0]) * n,
        y: Q[1] + (le.y - Q[1]) * n,
        width: le.width * n,
        height: le.height * n,
      },
      r = [Q[0] + (be[0] - Q[0]) * n, Q[1] + (be[1] - Q[1]) * n];
    (Gt(a),
      Ts(100),
      ct(r),
      ht((l) => ({
        ...l,
        assets: l.assets.map((h) => {
          var u;
          return ((u = h.metadata) == null ? void 0 : u.kind) ===
            "floorplan-reference"
            ? {
                ...h,
                metadata: {
                  ...h.metadata,
                  scaleMeters: Ge,
                  scalePercent: 100,
                  worldX: a.x,
                  worldY: a.y,
                  worldWidth: a.width,
                  worldHeight: a.height,
                  calibrationStartX: Q[0],
                  calibrationStartY: Q[1],
                  calibrationEndX: r[0],
                  calibrationEndY: r[1],
                  calibrationLengthMeters: Ge,
                },
              }
            : h;
        }),
      })),
      ee(void 0),
      Nt(!1),
      Ye(`比例尺已标定：参考线 ${Ge.toFixed(2)} m`),
      window.setTimeout(() => Ye(void 0), 2200));
  }
  const Ln = re.width / ye,
    wa = re.height / ye,
    alignmentViewMinX = re.minX + (re.width - Ln) / 2 + Xt[0],
    alignmentViewMinY = re.minY + (re.height - wa) / 2 + Xt[1],
    Yo = `${alignmentViewMinX} ${alignmentViewMinY} ${Ln} ${wa}`,
    Pn = hc(Ln, (zt == null ? void 0 : zt.width) ?? 0),
    cabinetLabelUnit = Ln / (zt?.width > 0 ? zt.width : 1200),
    Uo =
      (E == null ? void 0 : E.type) === "wall-start" ||
      (E == null ? void 0 : E.type) === "wall-end" ||
      (E == null ? void 0 : E.type) === "wall-offset" ||
      (E == null ? void 0 : E.type) === "wall-chain-start" ||
      (E == null ? void 0 : E.type) === "wall-chain-end" ||
      (E == null ? void 0 : E.type) === "wall-chain-offset",
    Na =
      L === "wall" ||
      (L === "device" && !!He) ||
      Uo ||
      (E == null ? void 0 : E.type) === "device",
    Ma = L === "wall" ? (ae == null ? void 0 : ae.kind) : void 0,
    Go = `wall-preview ${Ma ? `snap-${Ma}` : ""}`,
    qo = ae ? ud(ae.kind) : Xe ? "吸附开启" : "吸附关闭",
    Xs = Kt,
    $a = A
      ? (((Va = P.materials.find((e) => e.id === A.materialId)) == null
          ? void 0
          : Va.color) ?? "#f3f1ed")
      : "#f3f1ed",
    Ys = isVirtualWall(A),
    selectedWallIds = pe
      .filter((e) => e.startsWith("wall:"))
      .map((e) => e.slice(5)),
    selectedWallCount = selectedWallIds.length,
    selectedWallChain =
      selectedWallCount > 1
        ? getCollinearWallChain(b.walls, selectedWallIds)
        : void 0,
    selectedDeviceIds = pe
      .filter((e) => e.startsWith("device:"))
      .map((e) => e.slice(7)),
    selectedDeviceCount = selectedDeviceIds.length,
    selectedDeviceLine =
      selectedDeviceCount >= 2
        ? inspectDeviceLine(b.devices, selectedDeviceIds)
        : void 0,
    selectedFurnitureIds = pe
      .filter((e) => e.startsWith("furniture:"))
      .map((e) => e.slice(10)),
    selectedFurnitureCount = selectedFurnitureIds.length,
    wallLength = A ? X(A.start, A.end) : 0,
    wallCanSplit = wallLength >= 0.4,
    wallSplitMinimumRatio = wallCanSplit ? 0.2 / wallLength : 0.5,
    effectiveWallSplitRatio = Math.max(
      wallSplitMinimumRatio,
      Math.min(1 - wallSplitMinimumRatio, wallSplitRatio),
    ),
    wallSplitDistance = wallLength * effectiveWallSplitRatio,
    wallSplitPreview =
      A && selectedWallCount <= 1
        ? splitWallSegment(b.walls, b.openings, A.id, wallSplitDistance, {
            createWallId: () => "__wall-split-preview__",
          })
        : void 0,
    wallSplitPoint =
      A && wallLength > 0 ? pointAlongWall(A, wallSplitDistance) : void 0,
    Dn = cn(L) && !D,
    An = jc(L, ps, ot, Dn),
    Fn = Ut ? "保存中" : wt ? "保存失败" : Ue ? "待保存" : "已保存",
    Tn = Ec(o, d),
    Us = L !== "wall" && L !== "calibrate" && L !== "pan",
    Sa = L === "select",
    Zo = yc(L, !!R),
    pt = we(te == null ? void 0 : te.id),
    ka = (te == null ? void 0 : te.id) === "media_player.tv",
    Ca =
      ["cover.curtain", "cover.sheer"].includes(te?.id) ||
      (te == null ? void 0 : te.id) === "cover.blind",
    Ia = (te == null ? void 0 : te.id) === "climate.central_ac",
    _a = w && !pt ? ti(w) : void 0,
    Hn = ka && w ? zc(w) : void 0,
    zn = Ca && w ? Rc(w) : void 0,
    Gs = Ia && w ? Oc(w) : void 0,
    Rn = !!(pt && w && os(w)),
    On = pt && w ? (Rn ? Ba(w) : Ns(w)) : void 0,
    Ea = pt && w && !Rn ? tn(w) : void 0,
    Qo = pt && w ? Lt(w).length : 0,
    Jo = pt && w ? (Bt(w) === "ring" ? "环形" : "线型") : "",
    qs = w && !pt ? Vc(w, te == null ? void 0 : te.id) : void 0,
    ut = vr.find((e) => e.id === L),
    La = w ? [w.position[0], w.position[2]] : void 0,
    Pa = R ? R.position : void 0,
    Je = w
      ? (b.rooms.find((e) => e.id === w.roomId) ??
        (La ? b.rooms.find((e) => _e(La, e.polygon)) : void 0))
      : void 0,
    vs = R
      ? (b.rooms.find((e) => e.id === R.roomId) ??
        (Pa ? b.rooms.find((e) => _e(Pa, e.polygon)) : void 0))
      : void 0,
    Da = !!(w && (q == null ? void 0 : q.domain) === "switch"),
    Zs = Da ? ((w == null ? void 0 : w.controlledLightFixtures) ?? []) : [],
    Qs = !!(w && qt === w.id),
    el = q && Bn(q) ? "整组已开启" : "整组已关闭",
    tl =
      (J == null ? void 0 : J.name) ??
      (Je == null ? void 0 : Je.name) ??
      (vs == null ? void 0 : vs.name),
    sl = A
      ? "墙体"
      : K
        ? K.type === "door"
          ? "门"
          : "窗"
        : R
          ? (R.name ?? gt[R.kind]?.label ?? "自定义家具")
          : J
            ? "房间"
            : w
              ? "设备"
              : "楼层设置",
    nl = Ic({
      tool: L,
      selectionType: D == null ? void 0 : D.type,
      selectedEntityName: je == null ? void 0 : je.name,
      selectedRoomName: tl,
      activeToolLabel: ut == null ? void 0 : ut.label,
    }),
    il = Cc({
      tool: L,
      selectionType: D == null ? void 0 : D.type,
      selectedEntityName: je == null ? void 0 : je.name,
      activeToolLabel: ut == null ? void 0 : ut.label,
      lightStripStart: !!T,
      spacePanActive: xn,
      wallTraceCount: Wt.length,
      calibrationEditing: fs,
    }),
    Js = _c({
      tool: L,
      selectedEntityName: je == null ? void 0 : je.name,
      selectedFurnitureLabel: Qt.startsWith("model:")
        ? (customFurnitureModels.find((model) => model.id === Qt.slice(6))
            ?.name ?? "自定义模型")
        : (gt[Qt]?.label ?? "家具"),
      activeModelId: Os,
      lightStripStart: !!T,
      wallTraceCount: Wt.length,
      roomsCount: b.rooms.length,
      wallsCount: b.walls.length,
      availableDeviceCount: Oe.length,
      hasBlueprint: !!C,
    }),
    cabinetDisplaySize =
      R?.kind === "cabinet" && R.cabinetStyle === "segmented"
        ? segmentedCabinetDisplaySize(
            R.cabinetSegments,
            normalizeCabinetUpperDepth(
              R.cabinetUpperDepth,
              cabinetFrontDepth(R.cabinetSegments, R.cabinetDepth ?? R.depth),
            ),
            R.cabinetDepth ?? R.depth,
          )
        : R,
    bs = A
      ? {
          eyebrow: "结构",
          title: Ys ? "虚拟墙" : "墙体",
          note: Ys
            ? "虚拟墙参与房间识别，但不会在 3D 场景中生成墙体模型。"
            : selectedWallCount > 1
              ? "多选墙体可同步修改尺寸，也可在右侧一键拉直。"
              : "拖动端点可改变相邻房间边界。",
          metrics: [
            { label: "长度", value: `${X(A.start, A.end).toFixed(2)} m` },
            { label: "类型", value: Ys ? "虚拟墙" : "实体墙" },
            { label: "墙厚", value: `${A.thickness.toFixed(2)} m` },
            { label: "墙高", value: `${A.height.toFixed(1)} m` },
          ],
        }
      : K
        ? {
            eyebrow: K.type === "door" ? "门洞" : "窗体",
            title:
              K.type === "door"
                ? K.hasLeaf
                  ? "门扇"
                  : "门洞"
                : K.windowStyle === "floor_to_ceiling"
                  ? "落地窗"
                  : "普通窗",
            note: Ot
              ? "门窗沿所在线段定位，移动墙体时会保持关联。"
              : "未找到关联墙体，请检查拓扑。",
            metrics: [
              { label: "宽度", value: `${K.width.toFixed(2)} m` },
              { label: "高度", value: `${K.height.toFixed(2)} m` },
              { label: "位置", value: `${K.offset.toFixed(2)} m` },
            ],
          }
        : J
          ? {
              eyebrow: "房间",
              title: J.name,
              note: "房间由闭合墙体自动识别，可绑定 HA Area 和能力分组。",
              metrics: [
                { label: "面积", value: `${ri(J.polygon).toFixed(2)} m²` },
                { label: "边界", value: `${Rs.length} 段` },
                {
                  label: "设备",
                  value: `${b.devices.filter((e) => e.roomId === J.id && i[e.entityId]).length} 个`,
                },
              ],
            }
          : w
            ? {
                eyebrow: q ? jt(q.domain) : "设备",
                title: (q == null ? void 0 : q.name) ?? w.entityId,
                note: Je
                  ? `位于 ${Je.name}`
                  : "尚未指定房间，拖入房间或手动选择即可绑定。",
                metrics: [
                  { label: "状态", value: q ? ls(q) : "未连接" },
                  {
                    label: "模型",
                    value: (te == null ? void 0 : te.label) ?? "默认",
                  },
                  { label: "高度", value: `${w.position[1].toFixed(2)} m` },
                  { label: "旋转", value: `${Math.round(ti(w))}°` },
                ],
              }
            : R
              ? {
                  eyebrow: "家具",
                  title: R.name ?? gt[R.kind]?.label ?? "自定义家具",
                  note: vs
                    ? `位于 ${vs.name}`
                    : "用于校准空间尺度，可手动归属房间。",
                  metrics: [
                    {
                      label: "宽度",
                      value: `${cabinetDisplaySize.width.toFixed(2)} m`,
                    },
                    {
                      label: "深度",
                      value: `${cabinetDisplaySize.depth.toFixed(2)} m`,
                    },
                    {
                      label: "旋转",
                      value: `${Math.round((R.rotation * 180) / Math.PI)}°`,
                    },
                  ],
                }
              : void 0,
    Aa = q
      ? Bn(q)
        ? "active"
        : ["unavailable", "unknown"].includes(q.state)
          ? "offline"
          : "idle"
      : "unknown",
    beginResourcePanelResize = (event) => {
      if (typeof window === "undefined" || window.innerWidth <= 760) return;
      event.preventDefault();
      const panel = event.currentTarget.parentElement;
      const panelLeft = panel.getBoundingClientRect().left;
      const pointerId = event.pointerId;
      event.currentTarget.setPointerCapture(pointerId);
      const move = (moveEvent) => {
        const available = Math.max(300, window.innerWidth - panelLeft - 120);
        const width = Math.round(
          Math.min(
            560,
            available,
            Math.max(300, moveEvent.clientX - panelLeft),
          ),
        );
        setResourcePanelWidth(width);
        window.localStorage.setItem("ha3d-resource-panel-width", String(width));
      };
      const stop = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", stop);
        window.removeEventListener("pointercancel", stop);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", stop, { once: true });
      window.addEventListener("pointercancel", stop, { once: true });
    },
    resetResourcePanelWidth = () => {
      setResourcePanelWidth(null);
      window.localStorage.removeItem("ha3d-resource-panel-width");
    };
  return t.jsxs("section", {
    className: "editor-workspace",
    "data-editor-revision": "object-inspector-v5",
    children: [
      t.jsx(SaveErrorToast, {error:wt}),
      t.jsxs("div", {
        className: "editor-commandbar",
        children: [
          t.jsxs("div", {
            className: "project-crumb",
            children: [
              c &&
                t.jsxs("button", {
                  className: "editor-home-button",
                  onClick: c,
                  title: "返回全屋视图",
                  "aria-label": "返回全屋视图",
                  children: [
                    t.jsx(ll, { size: 15 }),
                    t.jsx("span", { children: "全屋" }),
                  ],
                }),
              t.jsxs("label", {
                className: "floor-picker",
                children: [
                  t.jsx(di, { size: 15 }),
                  t.jsx(ns, {
                    "aria-label": "当前楼层",
                    value: b.id,
                    onChange: (e) => {
                      ($e(e.target.value),
                        me(),
                        Pe(void 0),
                        De([]),
                        Se(void 0),
                        ee(void 0),
                        Dt(1),
                        Yt([0, 0]));
                    },
                    children: P.floors.map((e) =>
                      t.jsx("option", { value: e.id, children: e.name }, e.id),
                    ),
                  }),
                ],
              }),
              t.jsx("button", {
                className: "mini-icon-button",
                onClick: () => da(!1),
                title: "新增空白楼层",
                "aria-label": "新增楼层",
                children: t.jsx(Ka, { size: 15 }),
              }),
              t.jsxs("span", {
                className: "floor-summary",
                children: [
                  b.rooms.length,
                  " 个房间 · ",
                  b.walls.length,
                  " 面墙",
                ],
              }),
            ],
          }),
          t.jsx("div", {
            className: "editor-support-slot",
            children: t.jsxs("button", {
              className: "author-support-button",
              onClick: () => bn(!0),
              "aria-haspopup": "dialog",
              "aria-expanded": vn,
              title: "为爱发电",
              children: [
                t.jsx(Vl, { size: 16 }),
                t.jsx("span", { children: "为爱发电" }),
              ],
            }),
          }),
          t.jsxs("div", {
            className: "editor-actions",
            children: [
              t.jsx("button", {
                className: "icon-button",
                onClick: ia,
                disabled: !xe.length,
                title: "撤销 (Ctrl+Z)",
                "aria-label": "撤销",
                children: t.jsx(tc, { size: 18 }),
              }),
              t.jsx("button", {
                className: "icon-button",
                onClick: _n,
                disabled: !nt.length,
                title: "重做 (Ctrl+Shift+Z)",
                "aria-label": "重做",
                children: t.jsx(Ul, { size: 18 }),
              }),
              t.jsx("span", { className: "toolbar-separator" }),
              t.jsxs("button", {
                className: `snap-button ${Xe ? "active" : ""}`,
                onClick: () => to((e) => !e),
                "aria-pressed": Xe,
                title: Xe
                  ? "关闭后家具移动、缩放、旋转会完全跟手"
                  : "开启后家具按 5cm / 5° 细吸附",
                children: [t.jsx(Hl, { size: 17 }), " 吸附"],
              }),
              t.jsxs("button", {
                className: `snap-button dimensions-toggle ${hs ? "active" : ""}`,
                onClick: () => no((e) => !e),
                "aria-pressed": hs,
                children: [t.jsx(Zl, { size: 17 }), " 尺寸"],
              }),
              t.jsxs("button", {
                className: `snap-button label-toggle ${bt ? "active" : ""}`,
                onClick: () => io((e) => !e),
                "aria-pressed": bt,
                title: bt ? "隐藏设备标签" : "显示设备标签",
                children: [
                  bt ? t.jsx(cl, { size: 17 }) : t.jsx(dl, { size: 17 }),
                  " 标签",
                ],
              }),
              t.jsxs("div", {
                className: "view-switch",
                "aria-label": "编辑视图",
                children: [
                  t.jsx("button", {
                    className: rt === "2d" ? "active" : "",
                    onClick: () => {
                      ($i("2d"), Ks());
                    },
                    children: "2D",
                  }),
                  t.jsx("button", {
                    className: rt === "3d" ? "active" : "",
                    onClick: () => {
                      ($i("3d"), Pe(void 0), De([]), Se(void 0), ee(void 0));
                    },
                    children: "3D",
                  }),
                ],
              }),
              t.jsx("button", {
                className: `icon-button mobile-inspector-toggle ${ps ? "active" : ""}`,
                onClick: () => {
                  (Te((e) => !e), lt(!1));
                },
                "aria-label": "对象属性",
                title: "对象属性",
                children: t.jsx(Wa, { size: 18 }),
              }),
              f &&
                t.jsxs("button", {
                  className: `connection-state editor-connection-state state-${Tn.className}`,
                  onClick: f,
                  "aria-label": `连接状态：${Tn.label}`,
                  title: "连接与应用设置",
                  children: [
                    t.jsx("i", {}),
                    t.jsx("span", { children: Tn.label }),
                  ],
                }),
              t.jsxs("button", {
                className: `save-status-button ${wt ? "save-error" : ""}`,
                disabled: !Ue || Ut,
                onClick: () => void En(),
                title: wt ?? `${Fn} · 最近保存 ${Yi}`,
                children: [
                  Ut
                    ? t.jsx("span", { className: "button-spinner" })
                    : t.jsx(hl, { size: 17 }),
                  t.jsx("span", { children: wt ? "重试" : Fn }),
                ],
              }),
              t.jsx("button", {
                className: `icon-button ${us ? "active" : ""}`,
                onClick: () => Fs(!0),
                "aria-label": "项目设置",
                title: "项目设置",
                children: t.jsx(pl, { size: 18 }),
              }),
            ],
          }),
        ],
      }),
      t.jsxs("div", {
        className: `editor-main ${An.resourceOpen ? "resource-open" : ""} ${An.inspectorOpen ? "inspector-open" : ""} ${An.panelExpanded ? "panel-expanded" : ""}`,
        children: [
          t.jsxs("nav", {
            className: "tool-rail",
            "aria-label": "户型编辑工具",
            children: [
              Zr.map((e) =>
                t.jsxs(
                  "div",
                  {
                    className: "tool-rail-group",
                    "aria-label": e.label,
                    children: [
                      t.jsx("span", {
                        className: "tool-rail-group-label",
                        children: e.label,
                      }),
                      e.items.map((n) => {
                        const a = n.icon,
                          r =
                            L === n.id ||
                            (n.id === "blueprint" && L === "calibrate");
                        return t.jsxs(
                          "button",
                          {
                            className: r ? "active" : "",
                            onClick: () => Qi(n.id),
                            title: `${n.description ?? n.label} (${n.shortcut})`,
                            "aria-label": `${e.label}：${n.label}`,
                            "aria-pressed": r,
                            children: [
                              t.jsx(a, { size: 20 }),
                              t.jsx("span", { children: n.label }),
                              t.jsx("kbd", { children: n.shortcut }),
                            ],
                          },
                          n.id,
                        );
                      }),
                    ],
                  },
                  e.label,
                ),
              ),
              t.jsx("div", { className: "rail-spacer" }),
              t.jsxs("button", {
                className: "tool-rail-delete",
                disabled: !D,
                onClick: ts,
                title: "删除所选 (Delete)",
                "aria-label": "删除所选",
                children: [
                  t.jsx(Et, { size: 20 }),
                  t.jsx("span", { children: "删除" }),
                  t.jsx("kbd", { children: "Del" }),
                ],
              }),
            ],
          }),
          t.jsxs("aside", {
            className: `editor-resource-panel ${Dn ? "open" : ""} ${ot ? "expanded" : ""}`,
            "aria-hidden": !Dn,
            style: {
              "--editor-resource-width": `${resourcePanelWidth ?? resourcePanelAutoWidth}px`,
            },
            children: [
              t.jsx("button", {
                type: "button",
                className: "resource-panel-resizer",
                onPointerDown: beginResourcePanelResize,
                onDoubleClick: resetResourcePanelWidth,
                title: "拖动调整宽度，双击恢复自适应",
                "aria-label": "调整资源侧边栏宽度",
              }),
              t.jsx("button", {
                className: "panel-grabber",
                onClick: () => lt((e) => !e),
                "aria-label": ot ? "收起资源面板" : "展开资源面板",
                children: t.jsx("span", {}),
              }),
              t.jsxs("div", {
                className: "resource-panel-heading",
                children: [
                  t.jsxs("div", {
                    children: [
                      t.jsx("small", { children: "资源" }),
                      t.jsx("h2", {
                        children:
                          L === "furniture"
                            ? "家具"
                            : L === "device"
                              ? "设备"
                              : "参考底图",
                      }),
                    ],
                  }),
                  t.jsx("button", {
                    className: "panel-close",
                    onClick: () => We("select"),
                    "aria-label": "关闭资源面板",
                    children: t.jsx(Yn, { size: 18 }),
                  }),
                ],
              }),
              (L === "blueprint" || L === "calibrate") &&
                t.jsxs("div", {
                  className: "resource-panel-content blueprint-resource",
                  children: [
                    t.jsxs("div", {
                      className: "blueprint-flow",
                      "aria-label": "参考底图流程",
                      children: [
                        t.jsx("span", {
                          className: C ? "done" : "active",
                          children: "导入",
                        }),
                        t.jsx("span", {
                          className:
                            C && !St && L !== "calibrate"
                              ? "active"
                              : C
                                ? "done"
                                : "",
                          children: "调整",
                        }),
                        t.jsx("span", {
                          className:
                            L === "calibrate" ? "active" : St ? "done" : "",
                          children: "标定",
                        }),
                      ],
                    }),
                    t.jsxs("label", {
                      className: "upload-zone",
                      children: [
                        t.jsx(nn, { size: 20 }),
                        t.jsx("strong", {
                          children: C ? "更换参考底图" : "导入参考底图",
                        }),
                        t.jsx("small", {
                          children: "PNG / JPG / WebP · 15 MB",
                        }),
                        t.jsx("input", {
                          type: "file",
                          accept: "image/png,image/jpeg,image/webp",
                          onChange: (e) => {
                            var n;
                            return void ja(
                              (n = e.target.files) == null ? void 0 : n[0],
                            );
                          },
                        }),
                      ],
                    }),
                    C &&
                      t.jsxs(t.Fragment, {
                        children: [
                          t.jsxs("div", {
                            className: "blueprint-file",
                            children: [
                              t.jsx(Xa, { size: 15 }),
                              t.jsx("span", { children: C.name }),
                            ],
                          }),
                          t.jsxs("label", {
                            className: "range-field",
                            children: [
                              t.jsxs("span", {
                                children: [
                                  "透明度 ",
                                  t.jsxs("b", { children: [At, "%"] }),
                                ],
                              }),
                              t.jsx("input", {
                                type: "range",
                                min: "10",
                                max: "85",
                                value: At,
                                onChange: (e) => ya(Number(e.target.value)),
                              }),
                            ],
                          }),
                          t.jsxs("label", {
                            className: "range-field",
                            children: [
                              t.jsxs("span", {
                                children: [
                                  "显示比例 ",
                                  t.jsxs("b", { children: [Ft, "%"] }),
                                ],
                              }),
                              t.jsx("input", {
                                type: "range",
                                min: "40",
                                max: "200",
                                step: "5",
                                value: Ft,
                                onChange: (e) => va(Number(e.target.value)),
                              }),
                            ],
                          }),
                          t.jsxs("div", {
                            className: "calibration-tool",
                            children: [
                              t.jsxs("div", {
                                className: "calibration-heading",
                                children: [
                                  t.jsxs("span", {
                                    children: [
                                      t.jsx(sn, { size: 16 }),
                                      "比例尺",
                                    ],
                                  }),
                                  t.jsx("b", {
                                    className: St ? "calibrated" : "",
                                    children: St
                                      ? `${St.toFixed(2)} m`
                                      : "未标定",
                                  }),
                                ],
                              }),
                              t.jsxs("button", {
                                className: `calibration-start-button ${L === "calibrate" ? "active" : ""}`,
                                onClick: Cn,
                                children: [
                                  t.jsx(sn, { size: 16 }),
                                  Q && be ? "重新标定" : "开始标定",
                                ],
                              }),
                              Q &&
                                be &&
                                t.jsxs(t.Fragment, {
                                  children: [
                                    t.jsxs("label", {
                                      className: "calibration-length-field",
                                      children: [
                                        t.jsx("span", { children: "实际长度" }),
                                        t.jsxs("div", {
                                          className: "unit-input",
                                          children: [
                                            t.jsx("input", {
                                              "aria-label": "标定线实际长度",
                                              type: "number",
                                              min: "0.05",
                                              max: "1000",
                                              step: "0.1",
                                              value: Ge,
                                              onChange: (e) =>
                                                ms(Number(e.target.value)),
                                            }),
                                            t.jsx("i", { children: "m" }),
                                          ],
                                        }),
                                      ],
                                    }),
                                    t.jsxs("div", {
                                      className: "calibration-apply-row",
                                      children: [
                                        t.jsxs("small", {
                                          children: [
                                            "图上 ",
                                            X(Q, be).toFixed(2),
                                            " m",
                                          ],
                                        }),
                                        t.jsx("button", {
                                          onClick: ba,
                                          disabled: Ge <= 0,
                                          children: "应用",
                                        }),
                                      ],
                                    }),
                                  ],
                                }),
                            ],
                          }),
                        ],
                      }),
                  ],
                }),
              L === "furniture" &&
                t.jsx("div", {
                  className: "resource-panel-content furniture-library-grid",
                  children: [
                    ...wr.map((e) => {
                      const n = gt[e];
                      return t.jsxs(
                        "button",
                        {
                          className: Qt === e ? "active" : "",
                          onClick: () => {
                            (Ri(e), We("furniture"));
                          },
                          "aria-pressed": Qt === e,
                          children: [
                            t.jsx(Dr, { kind: e }),
                            t.jsxs("span", {
                              children: [
                                t.jsx("strong", { children: n.label }),
                                t.jsxs("small", {
                                  children: [n.width, " × ", n.depth, " m"],
                                }),
                              ],
                            }),
                          ],
                        },
                        e,
                      );
                    }),
                    t.jsx(CustomFurnitureLibrary, {
                      models: customFurnitureModels,
                      selectedKey: Qt,
                      onSelect: (key) => (Ri(key), We("furniture")),
                    }),
                  ],
                }),
              L === "device" &&
                t.jsxs("div", {
                  className: "resource-panel-content device-library-content",
                  children: [t.jsx(MissingDevicePlacements, {
                    floor: b,
                    entities: i,
                    connected: d?.connected === true,
                    onDelete: (id) => F((floor) => ({
                      ...floor, devices: floor.devices.filter((device) => device.id !== id),
                    })),
                    onReplace: (id, entity) => F((floor) => ({
                      ...floor,
                      devices: floor.devices.map((device) => device.id !== id ? device :
                        replaceDevicePlacement(device, entity,
                          resolveBoundDevicePresentation(entity,
                            device.deviceId === entity.deviceId ? device.modelId : as(entity)), hi(entity))),
                    })),
                  }), Gi(
                    ue
                      ? "当前楼层没有可放置设备。"
                      : "连接 Home Assistant 后才会显示真实设备。",
                  )],
                }),
            ],
          }),
          t.jsxs("div", {
            className: `plan-stage tool-${L} ${xn ? "space-pan-active" : ""} ${Ae ? "is-panning" : ""}`,
            children: [
              rt === "3d"
                ? t.jsxs("div", {
                    className: "editor-3d",
                    children: [
                      t.jsx(ml, {
                        project: P,
                        entities: js,
                        floorId: b.id,
                        cameraPreset: Ls,
                        wallMode: "full",
                        showDevices: ue,
                        showGrid: !0,
                        quality: "balanced",
                        cameraResetKey: b.id,
                        onDeviceSelect: bo,
                      }),
                      t.jsxs("div", {
                        className: "three-view-toolbar",
                        "aria-label": "3D 视角",
                        children: [
                          t.jsx("button", {
                            className: Ls === "iso" ? "active" : "",
                            onClick: () => jn("iso"),
                            children: "透视",
                          }),
                          t.jsx("button", {
                            className: Ls === "top" ? "active" : "",
                            onClick: () => jn("top"),
                            children: "顶视",
                          }),
                          t.jsx("button", {
                            className: Ls === "front" ? "active" : "",
                            onClick: () => jn("front"),
                            children: "正视",
                          }),
                        ],
                      }),
                    ],
                  })
                : t.jsxs("svg", {
                    ref: Rt,
                    className: "floorplan-canvas",
                    viewBox: Yo,
                    preserveAspectRatio: "xMidYMid meet",
                    onPointerDown: Fo,
                    onClick: To,
                    onPointerMove: zo,
                    onPointerUp: Oo,
                    onPointerCancel: ca,
                    onPointerLeave: Ro,
                    onAuxClick: (e) => e.preventDefault(),
                    onContextMenu: (e) => {
                      (e.preventDefault(),
                        L === "wall" &&
                          (Pe(void 0),
                          De([]),
                          yt(void 0),
                          vt(void 0),
                          ee(void 0)));
                    },
                    onWheel: Po,
                    role: "application",
                    "aria-label": "2D 户型编辑画布",
                    children: [
                      t.jsxs("defs", {
                        children: [
                          t.jsx("pattern", {
                            id: "minor-grid",
                            width: Xs,
                            height: Xs,
                            patternUnits: "userSpaceOnUse",
                            children: t.jsx("path", {
                              d: `M ${Xs} 0 L 0 0 0 ${Xs}`,
                              className: "minor-grid-line",
                              fill: "none",
                            }),
                          }),
                          t.jsxs("pattern", {
                            id: "major-grid",
                            width: "1",
                            height: "1",
                            patternUnits: "userSpaceOnUse",
                            children: [
                              t.jsx("rect", {
                                width: "1",
                                height: "1",
                                fill: "url(#minor-grid)",
                              }),
                              t.jsx("path", {
                                d: "M 1 0 L 0 0 0 1",
                                className: "major-grid-line",
                                fill: "none",
                              }),
                            ],
                          }),
                        ],
                      }),
                      t.jsx("rect", {
                        x: $t.minX - 20,
                        y: $t.minY - 20,
                        width: $t.width + 40,
                        height: $t.height + 40,
                        fill: "url(#major-grid)",
                      }),
                      C &&
                        le &&
                        t.jsx("image", {
                          href: C.url,
                          x: le.x,
                          y: le.y,
                          width: le.width,
                          height: le.height,
                          opacity: At / 100,
                          preserveAspectRatio: "xMidYMid meet",
                        }),
                      gs &&
                        t.jsxs("g", {
                          className: "reference-floor-layer",
                          "aria-label": `${gs.name}参考图层`,
                          children: [
                            gs.rooms.map((e) =>
                              t.jsx(
                                "polygon",
                                {
                                  points: e.polygon
                                    .map((n) => n.join(","))
                                    .join(" "),
                                  className: "reference-floor-room",
                                },
                                `reference-room-${e.id}`,
                              ),
                            ),
                            gs.walls.map((e) =>
                              t.jsx(
                                "line",
                                {
                                  x1: e.start[0],
                                  y1: e.start[1],
                                  x2: e.end[0],
                                  y2: e.end[1],
                                  className: "reference-floor-wall",
                                  strokeWidth: e.thickness,
                                },
                                `reference-wall-${e.id}`,
                              ),
                            ),
                            gs.furniture.map((e) =>
                              t.jsx(
                                "rect",
                                {
                                  x: e.position[0] - e.width / 2,
                                  y: e.position[1] - e.depth / 2,
                                  width: e.width,
                                  height: e.depth,
                                  className: "reference-floor-furniture",
                                  transform: `rotate(${(e.rotation * 180) / Math.PI} ${e.position[0]} ${e.position[1]})`,
                                },
                                `reference-furniture-${e.id}`,
                              ),
                            ),
                          ],
                        }),
                      b.rooms.map((e) =>
                        t.jsxs(
                          "g",
                          {
                            onPointerDown: (n) => {
                              Sa && !canRightPanCanvas(n) && n.stopPropagation();
                            },
                            onClick: (n) => {
                              Sa &&
                                (n.stopPropagation(),
                                es(
                                  { type: "room", id: e.id },
                                  n.shiftKey || n.ctrlKey || n.metaKey,
                                ));
                            },
                            children: [
                              t.jsx("polygon", {
                                points: e.polygon
                                  .map((n) => n.join(","))
                                  .join(" "),
                                className: `room-shape ${Jt({ type: "room", id: e.id }) ? "selected" : ""} ${J && J.id !== e.id ? "dimmed" : ""}`,
                              }),
                              t.jsx("text", {
                                x:
                                  e.polygon.reduce((n, a) => n + a[0], 0) /
                                  e.polygon.length,
                                y:
                                  e.polygon.reduce((n, a) => n + a[1], 0) /
                                    e.polygon.length -
                                  0.08,
                                className: `room-name ${(J == null ? void 0 : J.id) === e.id ? "selected" : ""}`,
                                children: e.name,
                              }),
                              t.jsxs("text", {
                                x:
                                  e.polygon.reduce((n, a) => n + a[0], 0) /
                                  e.polygon.length,
                                y:
                                  e.polygon.reduce((n, a) => n + a[1], 0) /
                                    e.polygon.length +
                                  0.2,
                                className: `room-area ${(J == null ? void 0 : J.id) === e.id ? "selected" : ""}`,
                                children: [ri(e.polygon).toFixed(1), " m²"],
                              }),
                            ],
                          },
                          e.id,
                        ),
                      ),
                      b.walls.map((e) => {
                        const n =
                            L === "select" && Jt({ type: "wall", id: e.id }),
                          a = X(e.start, e.end),
                          r = si(e);
                        return t.jsxs(
                          "g",
                          {
                            children: [
                              t.jsx("line", {
                                x1: e.start[0],
                                y1: e.start[1],
                                x2: e.end[0],
                                y2: e.end[1],
                                className: `wall-line ${isVirtualWall(e) ? "transparent virtual" : ""} ${n ? "selected" : ""}`,
                                strokeWidth: e.thickness,
                              }),
                              t.jsx("line", {
                                x1: e.start[0],
                                y1: e.start[1],
                                x2: e.end[0],
                                y2: e.end[1],
                                className: "wall-hitbox",
                                onPointerDown: (l) => {
                                  Bs || l.stopPropagation();
                                },
                                onClick: (l) => {
                                  L === "door" || L === "window"
                                    ? (l.stopPropagation(), Ho(e, Ws(l), L))
                                    : L === "select" &&
                                      (l.stopPropagation(),
                                      es(
                                        { type: "wall", id: e.id },
                                        l.shiftKey || l.ctrlKey || l.metaKey,
                                      ));
                                },
                              }),
                              (hs || n) &&
                                t.jsx("text", {
                                  x: r[0],
                                  y: r[1] - 0.2,
                                  className: `measurement-label ${n ? "selected" : ""}`,
                                  children: isVirtualWall(e)
                                    ? `虚拟 · ${a.toFixed(2)} m`
                                    : `${a.toFixed(2)} m`,
                                }),
                            ],
                          },
                          e.id,
                        );
                      }),
                      Rs.map(({ start: e, end: n, wall: a }, r) =>
                        t.jsx(
                          "line",
                          {
                            x1: e[0],
                            y1: e[1],
                            x2: n[0],
                            y2: n[1],
                            className: "room-boundary-overlay",
                          },
                          `room-edge-${a.id}-${r}`,
                        ),
                      ),
                      (ie == null ? void 0 : ie.type) === "opening" &&
                        (() => {
                          const {
                            center: e,
                            angle: n,
                            width: a,
                            openingType: r,
                          } = ie;
                          return t.jsxs("g", {
                            className: `placement-preview placement-opening-preview ${r}`,
                            transform: `translate(${e[0]} ${e[1]}) rotate(${n})`,
                            "aria-hidden": "true",
                            children: [
                              t.jsx("line", {
                                x1: -a / 2,
                                y1: "0",
                                x2: a / 2,
                                y2: "0",
                                className: "placement-preview-target",
                              }),
                              t.jsx("line", {
                                x1: -a / 2,
                                y1: "0",
                                x2: a / 2,
                                y2: "0",
                                className: `placement-opening-line ${r}`,
                              }),
                            ],
                          });
                        })(),
                      b.openings.map((e) => {
                        const n = b.walls.find((p) => p.id === e.wallId);
                        if (!n) return null;
                        const a = oi(n, e.offset),
                          r =
                            (Math.atan2(
                              n.end[1] - n.start[1],
                              n.end[0] - n.start[0],
                            ) *
                              180) /
                            Math.PI,
                          l = e.entityId ? i[e.entityId] : void 0,
                          h = e.entityId ? rd(l) : !0,
                          u = e.entityId
                            ? h
                              ? "door-bound-open"
                              : "door-bound-closed"
                            : "";
                        return t.jsxs(
                          "g",
                          {
                            transform: `translate(${a[0]} ${a[1]}) rotate(${r})`,
                            className: `plan-opening ${u}`,
                            onClick: (p) =>
                              kn({ type: "opening", id: e.id }, p),
                            onPointerDown: (p) =>
                              Sn(
                                { type: "opening", id: e.id },
                                { type: "opening", id: e.id },
                                p,
                              ),
                            children: [
                              t.jsx("line", {
                                x1: -e.width / 2,
                                y1: "0",
                                x2: e.width / 2,
                                y2: "0",
                                className: "opening-track",
                              }),
                              t.jsx("line", {
                                x1: -e.width / 2,
                                y1: "0",
                                x2: e.width / 2,
                                y2: "0",
                                className: `opening-line ${e.type} ${e.type === "window" ? e.windowStyle : ""} ${Jt({ type: "opening", id: e.id }) ? "selected" : ""}`,
                              }),
                              e.type === "door" &&
                                e.hasLeaf &&
                                (() => {
                                  const p =
                                      e.hinge === "start"
                                        ? -e.width / 2
                                        : e.width / 2,
                                    N = -p,
                                    m = h
                                      ? e.swing === "inward"
                                        ? e.width
                                        : -e.width
                                      : 0;
                                  return t.jsxs(t.Fragment, {
                                    children: [
                                      t.jsx("line", {
                                        x1: p,
                                        y1: "0",
                                        x2: N,
                                        y2: m,
                                        className: "door-leaf",
                                      }),
                                      h &&
                                        t.jsx("path", {
                                          d: `M ${p} 0 Q ${p} ${m} ${N} ${m}`,
                                          className: "door-swing",
                                        }),
                                    ],
                                  });
                                })(),
                            ],
                          },
                          e.id,
                        );
                      }),
                      b.furniture.map((e) => {
                        const n = Jt({ type: "furniture", id: e.id }),
                          a = e.name ?? gt[e.kind]?.label ?? "自定义家具";
                        return t.jsxs(
                          "g",
                          {
                            transform: `translate(${e.position[0]} ${e.position[1]}) rotate(${(e.rotation * 180) / Math.PI})`,
                            className: "plan-furniture",
                            onClick: (r) =>
                              kn({ type: "furniture", id: e.id }, r),
                            onPointerDownCapture: (r) =>
                              dragFurnitureWithRightButton(e, r),
                            onPointerDown: (r) => {
                              if (r.pointerType === "mouse") {
                                r.stopPropagation();
                              } else {
                                Sn(
                                  { type: "furniture", id: e.id },
                                  { type: "furniture", id: e.id },
                                  r,
                                );
                              }
                            },
                            children: [
                              e.kind === "cabinet"
                                ? (() => {
                                    const segments = normalizeCabinetSegments(
                                      e.cabinetSegments,
                                      e.width,
                                      e.depth,
                                    );
                                    return t.jsxs(t.Fragment, {
                                      children: [
                                        t.jsx("polygon", {
                                          points: segments
                                            .map(
                                              (segment) =>
                                                `${segment.start[0]},${segment.start[1]}`,
                                            )
                                            .join(" "),
                                          className: `cabinet-plan-surface ${n ? "selected" : ""}`,
                                        }),
                                        segments.map((segment) =>
                                          t.jsxs(
                                            "g",
                                            {
                                              children: [
                                                t.jsx("line", {
                                                  x1: segment.start[0],
                                                  y1: segment.start[1],
                                                  x2: segment.end[0],
                                                  y2: segment.end[1],
                                                  className: `cabinet-plan-segment ${segment.isDoorFront ? "door-front" : ""} ${n ? "selected" : ""} ${n && selectedCabinetSegmentId === segment.id ? "active" : ""}`,
                                                  style: {
                                                    pointerEvents: "none",
                                                  },
                                                }),
                                                t.jsx("line", {
                                                  x1: segment.start[0],
                                                  y1: segment.start[1],
                                                  x2: segment.end[0],
                                                  y2: segment.end[1],
                                                  className:
                                                    "cabinet-plan-segment-hitarea",
                                                  onPointerDown: (r) =>
                                                    r.stopPropagation(),
                                                  onClick: (r) => {
                                                    r.stopPropagation();
                                                    setSelectedCabinetSegmentId(
                                                      segment.id,
                                                    );
                                                    kn(
                                                      {
                                                        type: "furniture",
                                                        id: e.id,
                                                      },
                                                      r,
                                                    );
                                                  },
                                                }),
                                              ],
                                            },
                                            segment.id,
                                          ),
                                        ),
                                      ],
                                    });
                                  })()
                                : e.kind === "shower_enclosure"
                                  ? t.jsx("polygon", {
                                      points: showerEnclosureOutline(
                                        e.width,
                                        e.depth,
                                        e.showerStyle,
                                        e.showerCornerCut,
                                      )
                                        .map(([x, z]) => `${x},${z}`)
                                        .join(" "),
                                      className: `furniture-footprint ${e.kind} ${n ? "selected" : ""}`,
                                    })
                                  : t.jsx("rect", {
                                      x: -e.width / 2,
                                      y: -e.depth / 2,
                                      width: e.width,
                                      height: e.depth,
                                      className: `furniture-footprint ${e.kind} ${n ? "selected" : ""}`,
                                    }),
                              e.kind === "sofa" &&
                                t.jsx("path", {
                                  d: `M ${-e.width / 2} ${e.depth * 0.18} H ${e.width / 2} M ${-e.width * 0.36} ${-e.depth / 2} V ${e.depth / 2} M ${e.width * 0.36} ${-e.depth / 2} V ${e.depth / 2}`,
                                  className: "furniture-detail",
                                }),
                              e.kind === "bed" &&
                                t.jsx("path", {
                                  d: `M ${-e.width / 2} ${-e.depth * 0.28} H ${e.width / 2} M ${-e.width * 0.44} ${-e.depth * 0.12} H ${-e.width * 0.08} M ${e.width * 0.08} ${-e.depth * 0.12} H ${e.width * 0.44}`,
                                  className: "furniture-detail",
                                }),
                              (e.kind === "dining_table" ||
                                e.kind === "desk") &&
                                t.jsx("path", {
                                  d: `M ${-e.width * 0.32} ${-e.depth * 0.32} H ${e.width * 0.32} V ${e.depth * 0.32} H ${-e.width * 0.32} Z`,
                                  className: "furniture-detail",
                                }),
                              e.kind === "tv_stand" &&
                                t.jsx("path", {
                                  d: `M ${-e.width * 0.42} 0 H ${e.width * 0.42} M ${-e.width * 0.18} ${-e.depth / 2} V ${e.depth / 2} M ${e.width * 0.18} ${-e.depth / 2} V ${e.depth / 2}`,
                                  className: "furniture-detail",
                                }),
                              e.kind === "kitchen_island" &&
                                t.jsx("path", {
                                  d: `M ${-e.width * 0.38} ${-e.depth * 0.26} H ${e.width * 0.38} V ${e.depth * 0.26} H ${-e.width * 0.38} Z M ${e.width * 0.16} ${-e.depth * 0.16} h ${e.width * 0.16} v ${e.depth * 0.18} h ${-e.width * 0.16} Z`,
                                  className: "furniture-detail",
                                }),
                              e.kind === "coffee_table" &&
                                t.jsx("path", {
                                  d: `M ${-e.width * 0.34} ${-e.depth * 0.24} H ${e.width * 0.34} V ${e.depth * 0.24} H ${-e.width * 0.34} Z M ${-e.width * 0.2} 0 H ${e.width * 0.2}`,
                                  className: "furniture-detail",
                                }),
                              e.kind === "side_table" &&
                                t.jsx("path", {
                                  d: `M ${-e.width * 0.26} 0 A ${e.width * 0.26} ${e.depth * 0.26} 0 1 0 ${e.width * 0.26} 0 A ${e.width * 0.26} ${e.depth * 0.26} 0 1 0 ${-e.width * 0.26} 0 M 0 ${-e.depth * 0.24} V ${e.depth * 0.24}`,
                                  className: "furniture-detail",
                                }),
                              (e.kind === "sideboard" ||
                                e.kind === "shoe_cabinet" ||
                                e.kind === "nightstand") &&
                                t.jsx("path", {
                                  d: `M ${-e.width * 0.42} 0 H ${e.width * 0.42} M 0 ${-e.depth / 2} V ${e.depth / 2} ${e.kind === "shoe_cabinet" ? `M ${-e.width * 0.34} ${-e.depth * 0.22} H ${e.width * 0.34} M ${-e.width * 0.34} ${e.depth * 0.22} H ${e.width * 0.34}` : ""}`,
                                  className: "furniture-detail",
                                }),
                              e.kind === "bookshelf" &&
                                t.jsx("path", {
                                  d: `M ${-e.width / 2} ${-e.depth * 0.22} H ${e.width / 2} M ${-e.width / 2} 0 H ${e.width / 2} M ${-e.width / 2} ${e.depth * 0.22} H ${e.width / 2} M ${-e.width * 0.18} ${-e.depth / 2} V ${e.depth / 2} M ${e.width * 0.18} ${-e.depth / 2} V ${e.depth / 2}`,
                                  className: "furniture-detail",
                                }),
                              e.kind === "wash_basin" &&
                                t.jsx("path", {
                                  d: "M-0.22-0.04H0.22A0.2 0.14 0 0 1-0.22-0.04M0-0.2V-0.05",
                                  className: "furniture-detail",
                                }),
                              e.kind === "vanity_mirror_cabinet" &&
                                t.jsxs(t.Fragment, {
                                  children: [
                                    t.jsx("rect", {
                                      x: -e.mirrorWidth / 2,
                                      y: e.depth / 2 - e.mirrorDepth,
                                      width: e.mirrorWidth,
                                      height: e.mirrorDepth,
                                      className: "furniture-detail",
                                    }),
                                    t.jsx("ellipse", {
                                      cx: 0,
                                      cy: -e.depth * 0.08,
                                      rx: e.basinWidth / 2,
                                      ry: e.basinDepth / 2,
                                      className: "furniture-detail",
                                    }),
                                    t.jsx("path", {
                                      d: `M 0 ${-e.depth / 2} V ${-e.depth * 0.36}`,
                                      className: "furniture-detail",
                                    }),
                                  ],
                                }),
                              e.kind === "shower_enclosure" &&
                                t.jsx("path", {
                                  d: (() => {
                                    const points = showerEnclosureOutline(
                                      e.width,
                                      e.depth,
                                      e.showerStyle,
                                      e.showerCornerCut,
                                    );
                                    return `M ${points
                                      .slice(1)
                                      .map(([x, z]) => `${x} ${z}`)
                                      .join(" L ")}`;
                                  })(),
                                  className: "furniture-detail",
                                }),
                              e.kind === "shower_fixture" &&
                                t.jsx("path", {
                                  d: `M 0 ${-e.depth * 0.42} V ${e.depth * 0.2} M ${-e.width * 0.3} ${e.depth * 0.2} A ${e.width * 0.3} ${e.depth * 0.2} 0 1 0 ${e.width * 0.3} ${e.depth * 0.2}`,
                                  className: "furniture-detail",
                                }),
                              e.kind === "toilet" &&
                                t.jsx("path", {
                                  d: `M ${-e.width * 0.38} ${-e.depth * 0.35} Q 0 ${-e.depth * 0.49} ${e.width * 0.38} ${-e.depth * 0.35} L ${e.width * 0.4} ${e.depth * 0.12} A ${e.width * 0.4} ${e.depth * 0.42} 0 0 1 ${-e.width * 0.4} ${e.depth * 0.12} Z M ${-e.width * 0.28} ${-e.depth * 0.18} H ${e.width * 0.28}`,
                                  className: "furniture-detail",
                                }),
                              e.kind === "water_heater" &&
                                t.jsx("path", {
                                  d: "M-0.18 0H0.18M0-0.12V0.12",
                                  className: "furniture-detail",
                                }),
                              e.kind === "squat_toilet" &&
                                t.jsx("path", {
                                  d: "M-0.2-0.2H0.2V0.2H-0.2ZM-0.1 0H0.1",
                                  className: "furniture-detail",
                                }),
                              e.kind === "gas_stove" &&
                                t.jsx("path", {
                                  d: "M-0.2 0a0.1 0.1 0 1 0 0.2 0a0.1 0.1 0 1 0-0.2 0M0 0a0.1 0.1 0 1 0 0.2 0a0.1 0.1 0 1 0-0.2 0",
                                  className: "furniture-detail",
                                }),
                              t.jsx("text", {
                                y: "0.06",
                                className: "furniture-label",
                                children: a,
                              }),
                            ],
                          },
                          e.id,
                        );
                      }),
                      ue &&
                        missingDevicePlacements(b, i, d?.connected === true).map((device) =>
                          t.jsxs("g", {
                            transform: `translate(${device.position[0]} ${device.position[2]})`,
                            role: "button",
                            tabIndex: 0,
                            "aria-label": `实体已失效：${device.entityId}，点击处理`,
                            style: { cursor: "pointer" },
                            onPointerDown: (event) => event.stopPropagation(),
                            onClick: (event) => { event.stopPropagation(); We("device"); },
                            onKeyDown: (event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                We("device");
                              }
                            },
                            children: [
                              t.jsx("title", { children: `${device.entityId}\n实体已失效，请删除或替换` }),
                              t.jsx("path", { d: "M 0 -0.22 L 0.22 0.18 L -0.22 0.18 Z", fill: "#facc15", stroke: "#a16207", strokeWidth: 0.025 }),
                              t.jsx("text", { y: 0.11, textAnchor: "middle", fontSize: 0.28, fontWeight: "bold", fill: "#713f12", children: "!" }),
                              t.jsx("text", { y: 0.38, textAnchor: "middle", fontSize: 0.13, fill: "#854d0e", stroke: "#fff", strokeWidth: 0.035, paintOrder: "stroke", children: "实体已失效，请删除或替换" }),
                            ],
                          }, `missing-${device.id}`)),
                      ue &&
                        b.devices
                          .filter((e) => i[e.entityId])
                          .map((e) => {
                            const n = i[e.entityId],
                              displayEntity = {
                                ...n,
                                name: n.deviceDisplayName ?? n.name,
                              },
                              a = Jt({ type: "device", id: e.id }),
                              r = ws(e, n),
                              h = Ni(r.id).startsWith("light."),
                              u = we(r.id),
                              p = u && os(e),
                              N = u ? Ns(e) : 0,
                              m = [e.position[0], e.position[2]],
                              g = p ? rs(Lt(e), Bt(e)) : [],
                              k = h ? Ya(n) : void 0,
                              O = k
                                ? {
                                    color: k.color,
                                    "--light-level": k.brightness,
                                  }
                                : void 0,
                              Z = bt || a,
                              M = ed(displayEntity, e.entityId),
                              I = Ir(M),
                              V = u ? (p ? void 0 : tn(e)) : ti(e),
                              G = Jn(V),
                              modelFootprint = resolveDeviceModelFootprint(
                                n,
                                e,
                              ),
                              z = modelFootprint
                                ? Math.max(
                                    0.42,
                                    modelFootprint.x +
                                      modelFootprint.width / 2 +
                                      0.12,
                                  )
                                : 0.42;
                            return t.jsxs(
                              "g",
                              {
                                transform: `translate(${e.position[0]} ${e.position[2]})`,
                                className: `plan-device ${a ? "selected" : ""} ${k ? (k.isOn ? "light-on" : "light-off") : ""}`,
                                style: O,
                                onClick: (se) =>
                                  kn({ type: "device", id: e.id }, se),
                                onPointerDown: (se) =>
                                  Sn(
                                    { type: "device", id: e.id },
                                    { type: "device", id: e.id },
                                    se,
                                  ),
                                children: [
                                  t.jsx("title", {
                                    children:
                                      (n == null
                                        ? void 0
                                        : (n.deviceDisplayName ?? n.name)) ??
                                      e.entityId,
                                  }),
                                  t.jsxs("g", {
                                    transform: G,
                                    children: [
                                      modelFootprint &&
                                        t.jsx("rect", {
                                          x:
                                            modelFootprint.x -
                                            modelFootprint.width / 2,
                                          y:
                                            modelFootprint.y -
                                            modelFootprint.depth / 2,
                                          width: modelFootprint.width,
                                          height: modelFootprint.depth,
                                          rx: Math.min(
                                            0.08,
                                            modelFootprint.width / 8,
                                            modelFootprint.depth / 8,
                                          ),
                                          className: `device-model-footprint ${a ? "selected" : ""}`,
                                        }),
                                      a &&
                                        (u
                                          ? p
                                            ? g.map((se, ke) =>
                                                t.jsx(
                                                  "line",
                                                  {
                                                    x1: se.start[0] - m[0],
                                                    y1: se.start[1] - m[1],
                                                    x2: se.end[0] - m[0],
                                                    y2: se.end[1] - m[1],
                                                    className:
                                                      "light-strip-selection-halo-line",
                                                  },
                                                  `strip-halo-${ke}`,
                                                ),
                                              )
                                            : t.jsx("rect", {
                                                x: -N / 2 - 0.15,
                                                y: "-0.17",
                                                width: N + 0.3,
                                                height: "0.34",
                                                rx: "0.16",
                                                className:
                                                  "device-selected-halo light-strip-selection-halo",
                                              })
                                          : modelFootprint
                                            ? t.jsx("rect", {
                                                x:
                                                  modelFootprint.x -
                                                  modelFootprint.width / 2 -
                                                  0.08,
                                                y:
                                                  modelFootprint.y -
                                                  modelFootprint.depth / 2 -
                                                  0.08,
                                                width:
                                                  modelFootprint.width + 0.16,
                                                height:
                                                  modelFootprint.depth + 0.16,
                                                rx: "0.1",
                                                className:
                                                  "device-selected-halo device-model-selection-halo",
                                              })
                                            : t.jsx("circle", {
                                                r: "0.36",
                                                className:
                                                  "device-selected-halo",
                                              })),
                                      u && !p
                                        ? t.jsx("line", {
                                            x1: -N / 2,
                                            y1: "0",
                                            x2: N / 2,
                                            y2: "0",
                                            className:
                                              "device-glyph-strip-backdrop",
                                          })
                                        : u
                                          ? null
                                          : t.jsx("circle", {
                                              r: "0.22",
                                              className: "device-glyph-ring",
                                            }),
                                      t.jsx(li, { device: e, entity: n }),
                                    ],
                                  }),
                                  Z &&
                                    t.jsxs("g", {
                                      className: `plan-device-label ${a ? "selected" : ""}`,
                                      children: [
                                        t.jsx("rect", {
                                          x: z,
                                          y: "-0.15",
                                          width: I,
                                          height: "0.32",
                                          rx: "0.095",
                                          className: "plan-device-label-shell",
                                        }),
                                        t.jsx("text", {
                                          x: z + I / 2,
                                          y: "0.02",
                                          className: `device-name ${a ? "selected" : ""}`,
                                          children: M,
                                        }),
                                      ],
                                    }),
                                ],
                              },
                              e.id,
                            );
                          }),
                      ue &&
                        b.devices
                          .filter((e) => {
                            var n, a;
                            return (
                              ((n = i[e.entityId]) == null
                                ? void 0
                                : n.domain) === "switch" &&
                              ((a = e.controlledLightFixtures) == null
                                ? void 0
                                : a.length)
                            );
                          })
                          .flatMap((e) => {
                            const n = i[e.entityId],
                              a = Bn(n),
                              r = Ya(n);
                            return (e.controlledLightFixtures ?? []).map(
                              (l, h) => {
                                const u = {
                                    id: l.id,
                                    entityId: e.entityId,
                                    kind: "light",
                                    floorId: e.floorId,
                                    roomId: l.roomId,
                                    position: l.position,
                                    rotation: l.rotation ?? [0, 0, 0],
                                    scale: l.scale,
                                    modelId: l.modelId ?? "light.downlight",
                                  },
                                  p = Jt({ type: "device", id: e.id }),
                                  N = bt || p,
                                  m = l.label ?? `灯具 ${h + 1}`,
                                  g = Ir(m),
                                  k = we(u.modelId),
                                  O = k ? Ns(u) : 0,
                                  Z = Jn(k ? tn(u) : void 0);
                                return t.jsxs(
                                  "g",
                                  {
                                    transform: `translate(${l.position[0]} ${l.position[2]})`,
                                    className: `plan-device switch-light-fixture ${p ? "selected" : ""} ${a ? "light-on" : "light-off"}`,
                                    style: {
                                      color: r.color,
                                      "--light-level": a
                                        ? r.brightness || 0.78
                                        : 0,
                                    },
                                    onPointerDown: (M) => M.stopPropagation(),
                                    onClick: (M) => {
                                      (M.stopPropagation(),
                                        Xn(),
                                        Ve({ type: "device", id: e.id }),
                                        B(e.entityId));
                                    },
                                    children: [
                                      t.jsx("title", {
                                        children: `${n.name} · ${m}`,
                                      }),
                                      t.jsxs("g", {
                                        transform: Z,
                                        children: [
                                          p &&
                                            (k
                                              ? t.jsx("rect", {
                                                  x: -O / 2 - 0.15,
                                                  y: "-0.17",
                                                  width: O + 0.3,
                                                  height: "0.34",
                                                  rx: "0.16",
                                                  className:
                                                    "device-selected-halo light-strip-selection-halo",
                                                })
                                              : t.jsx("circle", {
                                                  r: "0.32",
                                                  className:
                                                    "device-selected-halo",
                                                })),
                                          k
                                            ? t.jsx("line", {
                                                x1: -O / 2,
                                                y1: "0",
                                                x2: O / 2,
                                                y2: "0",
                                                className:
                                                  "device-glyph-strip-backdrop",
                                              })
                                            : t.jsx("circle", {
                                                r: "0.2",
                                                className: "device-glyph-ring",
                                              }),
                                          t.jsx(li, { device: u }),
                                        ],
                                      }),
                                      N &&
                                        t.jsxs("g", {
                                          className: `plan-device-label ${p ? "selected" : ""}`,
                                          children: [
                                            t.jsx("rect", {
                                              x: "0.35",
                                              y: "-0.15",
                                              width: g,
                                              height: "0.32",
                                              rx: "0.095",
                                              className:
                                                "plan-device-label-shell",
                                            }),
                                            t.jsx("text", {
                                              x: 0.35 + g / 2,
                                              y: "0.02",
                                              className: `device-name ${p ? "selected" : ""}`,
                                              children: m,
                                            }),
                                          ],
                                        }),
                                    ],
                                  },
                                  `${e.id}-${l.id}`,
                                );
                              },
                            );
                          }),
                      (ie == null ? void 0 : ie.type) === "device" &&
                        (() => {
                          const e = ws(ie.device, ie.entity),
                            n = we(e.id),
                            a = n && os(ie.device),
                            r = n ? Ns(ie.device) : 0,
                            l = [ie.device.position[0], ie.device.position[2]],
                            h = a ? rs(Lt(ie.device), Bt(ie.device)) : [],
                            u = n
                              ? a
                                ? void 0
                                : tn(ie.device)
                              : ti(ie.device),
                            p = Jn(u);
                          return t.jsx("g", {
                            className:
                              "placement-preview placement-device-preview",
                            transform: `translate(${ie.device.position[0]} ${ie.device.position[2]})`,
                            "aria-hidden": "true",
                            children: t.jsxs("g", {
                              transform: p,
                              children: [
                                n
                                  ? a
                                    ? h.map((N, m) =>
                                        t.jsx(
                                          "line",
                                          {
                                            x1: N.start[0] - l[0],
                                            y1: N.start[1] - l[1],
                                            x2: N.end[0] - l[0],
                                            y2: N.end[1] - l[1],
                                            className:
                                              "light-strip-selection-halo-line placement",
                                          },
                                          `preview-strip-halo-${m}`,
                                        ),
                                      )
                                    : t.jsx("rect", {
                                        x: -r / 2 - 0.14,
                                        y: "-0.15",
                                        width: r + 0.28,
                                        height: "0.3",
                                        rx: "0.14",
                                        className:
                                          "placement-device-halo light-strip-selection-halo",
                                      })
                                  : t.jsxs(t.Fragment, {
                                      children: [
                                        t.jsx("circle", {
                                          r: "0.34",
                                          className: "placement-device-halo",
                                        }),
                                        t.jsx("circle", {
                                          r: "0.22",
                                          className: "device-glyph-ring",
                                        }),
                                      ],
                                    }),
                                t.jsx(li, {
                                  device: ie.device,
                                  entity: ie.entity,
                                }),
                              ],
                            }),
                          });
                        })(),
                      ne &&
                        t.jsx("rect", {
                          x: Math.min(ne.start[0], ne.end[0]),
                          y: Math.min(ne.start[1], ne.end[1]),
                          width: Math.abs(ne.end[0] - ne.start[0]),
                          height: Math.abs(ne.end[1] - ne.start[1]),
                          className: "selection-box",
                          pointerEvents: "none",
                        }),
                      Rs.map(({ start: e, end: n, wall: a }, r) => {
                        const l = [(e[0] + n[0]) / 2, (e[1] + n[1]) / 2],
                          h =
                            (Math.atan2(n[1] - e[1], n[0] - e[0]) * 180) /
                            Math.PI;
                        return t.jsx(
                          "rect",
                          {
                            x: l[0] - 0.085,
                            y: l[1] - 0.085,
                            width: "0.17",
                            height: "0.17",
                            rx: "0.025",
                            className: "room-boundary-midpoint",
                            transform: `rotate(${h + 45} ${l[0]} ${l[1]})`,
                            onPointerDown: (u) => u.stopPropagation(),
                            onClick: (u) => {
                              (u.stopPropagation(),
                                Ve(
                                  { type: "wall", id: a.id },
                                  u.shiftKey || u.ctrlKey || u.metaKey,
                                ));
                            },
                          },
                          `boundary-${a.id}-${r}`,
                        );
                      }),
                      mo.map(({ point: e, wall: n, type: a }) =>
                        t.jsx(
                          "rect",
                          {
                            x: e[0] - 0.085,
                            y: e[1] - 0.085,
                            width: "0.17",
                            height: "0.17",
                            rx: "0.025",
                            className: "room-boundary-endpoint",
                            transform: `rotate(45 ${e[0]} ${e[1]})`,
                            onPointerDown: (r) => Qe({ type: a, id: n.id }, r),
                            onClick: (r) => r.stopPropagation(),
                          },
                          `${e[0]}-${e[1]}`,
                        ),
                      ),
                      Na &&
                        fo.map((e) => {
                          const n =
                            (ae == null ? void 0 : ae.kind) === "endpoint" &&
                            X(e, ae.point) < 0.04;
                          return t.jsx(
                            "circle",
                            {
                              cx: e[0],
                              cy: e[1],
                              r: n ? "0.145" : "0.095",
                              className: `wall-connection-node ${n ? "active" : ""}`,
                            },
                            `wall-node-${e[0]}-${e[1]}`,
                          );
                        }),
                      pt &&
                        w &&
                        Us &&
                        (() => {
                          const e = Lt(w),
                            n = Bt(w),
                            a = rs(e, n),
                            r = Fr(e),
                            l = Math.max(0.16, Math.min(0.28, Pn));
                          return t.jsxs("g", {
                            className: "selected-light-strip-handles",
                            onPointerDown: (h) => h.stopPropagation(),
                            onClick: (h) => h.stopPropagation(),
                            children: [
                              a.map((h, u) =>
                                t.jsx(
                                  "line",
                                  {
                                    x1: h.start[0],
                                    y1: h.start[1],
                                    x2: h.end[0],
                                    y2: h.end[1],
                                    className: "light-strip-edit-guide",
                                  },
                                  `guide-${u}`,
                                ),
                              ),
                              t.jsxs("text", {
                                x: r[0],
                                y: r[1] - 0.24,
                                className: "light-strip-length-label",
                                children: [Ba(w).toFixed(2), " m"],
                              }),
                              e.map((h, u) =>
                                t.jsx(
                                  "circle",
                                  {
                                    cx: h[0],
                                    cy: h[1],
                                    r: l,
                                    className: "light-strip-handle-hitarea",
                                    pointerEvents: "all",
                                    onPointerDown: (p) =>
                                      Qe(
                                        {
                                          type: "light-strip-point",
                                          id: w.id,
                                          pointIndex: u,
                                          originDevice: structuredClone(w),
                                        },
                                        p,
                                      ),
                                    onClick: (p) => p.stopPropagation(),
                                    children: t.jsxs("title", {
                                      children: ["拖动灯带端点 ", u + 1],
                                    }),
                                  },
                                  `hit-${u}`,
                                ),
                              ),
                              e.map((h, u) =>
                                t.jsx(
                                  "circle",
                                  {
                                    cx: h[0],
                                    cy: h[1],
                                    r: "0.095",
                                    className: "light-strip-endpoint-handle",
                                  },
                                  `point-${u}`,
                                ),
                              ),
                            ],
                          });
                        })(),
                      Q &&
                        (be ?? (L === "calibrate" ? at : void 0)) &&
                        (() => {
                          const e = be ?? at,
                            n = [(Q[0] + e[0]) / 2, (Q[1] + e[1]) / 2];
                          return t.jsxs("g", {
                            className: "calibration-overlay",
                            children: [
                              t.jsx("line", {
                                x1: Q[0],
                                y1: Q[1],
                                x2: e[0],
                                y2: e[1],
                                className: "calibration-line",
                              }),
                              t.jsx("circle", {
                                cx: Q[0],
                                cy: Q[1],
                                r: "0.1",
                                className: "calibration-point",
                              }),
                              t.jsx("circle", {
                                cx: e[0],
                                cy: e[1],
                                r: "0.1",
                                className: "calibration-point",
                              }),
                              t.jsx("text", {
                                x: n[0],
                                y: n[1] - 0.2,
                                className: "calibration-label",
                                children: be
                                  ? `${Ge.toFixed(2)} m`
                                  : "选择终点",
                              }),
                            ],
                          });
                        })(),
                      fe &&
                        at &&
                        t.jsx("line", {
                          x1: fe[0],
                          y1: fe[1],
                          x2: at[0],
                          y2: at[1],
                          className: Go,
                        }),
                      fe &&
                        t.jsx("circle", {
                          cx: fe[0],
                          cy: fe[1],
                          r: "0.12",
                          className: "drawing-anchor",
                        }),
                      T &&
                        (() => {
                          const e =
                              at &&
                              X(T.points.at(-1), at) >= 0.04 &&
                              !(
                                T.shape === "ring" &&
                                T.points.length >= 3 &&
                                X(at, T.points[0]) < Kn
                              )
                                ? [...T.points, at]
                                : T.points,
                            n = rs(e, T.shape);
                          return t.jsxs("g", {
                            className: "light-strip-draft-overlay",
                            children: [
                              n.map((a, r) =>
                                t.jsx(
                                  "line",
                                  {
                                    x1: a.start[0],
                                    y1: a.start[1],
                                    x2: a.end[0],
                                    y2: a.end[1],
                                    className: "light-strip-preview-line",
                                  },
                                  `draft-${r}`,
                                ),
                              ),
                              T.points.map((a, r) =>
                                t.jsx(
                                  "circle",
                                  {
                                    cx: a[0],
                                    cy: a[1],
                                    r: "0.12",
                                    className:
                                      "drawing-anchor light-strip-anchor",
                                  },
                                  `draft-point-${r}`,
                                ),
                              ),
                            ],
                          });
                        })(),
                      alignmentGuides.length > 0 &&
                        t.jsx("g", {
                          className: "alignment-guides",
                          "aria-hidden": "true",
                          children: alignmentGuides.map((e, n) =>
                            t.jsxs(
                              "g",
                              {
                                className: `alignment-guide ${e.axis}`,
                                children: [
                                  t.jsx("line", {
                                    x1:
                                      e.axis === "vertical"
                                        ? e.coordinate
                                        : alignmentViewMinX,
                                    y1:
                                      e.axis === "horizontal"
                                        ? e.coordinate
                                        : alignmentViewMinY,
                                    x2:
                                      e.axis === "vertical"
                                        ? e.coordinate
                                        : alignmentViewMinX + Ln,
                                    y2:
                                      e.axis === "horizontal"
                                        ? e.coordinate
                                        : alignmentViewMinY + wa,
                                    className: "alignment-guide-line",
                                  }),
                                  t.jsx("circle", {
                                    cx: e.source[0],
                                    cy: e.source[1],
                                    r: "0.1",
                                    className: "alignment-guide-point source",
                                  }),
                                  t.jsx("circle", {
                                    cx: e.target[0],
                                    cy: e.target[1],
                                    r: "0.13",
                                    className: `alignment-guide-point target ${e.targetKind}`,
                                  }),
                                ],
                              },
                              `${e.axis}-${e.coordinate}-${e.targetId}-${n}`,
                            ),
                          ),
                        }),
                      Na &&
                        ae &&
                        t.jsxs("g", {
                          className: `snap-indicator snap-${ae.kind}`,
                          "aria-hidden": "true",
                          children: [
                            t.jsx("circle", {
                              cx: ae.point[0],
                              cy: ae.point[1],
                              r: "0.2",
                              className: "snap-indicator-halo",
                            }),
                            t.jsx("circle", {
                              cx: ae.point[0],
                              cy: ae.point[1],
                              r: "0.085",
                              className: "snap-indicator-core",
                            }),
                            t.jsx("path", {
                              d: `M ${ae.point[0] - 0.25} ${ae.point[1]} H ${ae.point[0] + 0.25} M ${ae.point[0]} ${ae.point[1] - 0.25} V ${ae.point[1] + 0.25}`,
                            }),
                          ],
                        }),
                      L === "select" &&
                        A &&
                        (() => {
                          const wallChainActive =
                              selectedWallCount > 1 &&
                              (selectedWallChain == null
                                ? void 0
                                : selectedWallChain.ok),
                            wallHandleStart = wallChainActive
                              ? selectedWallChain.start
                              : A.start,
                            wallHandleEnd = wallChainActive
                              ? selectedWallChain.end
                              : A.end,
                            e = wallChainActive
                              ? selectedWallChain.midpoint
                              : si(A),
                            n = Math.max(
                              0.001,
                              X(wallHandleStart, wallHandleEnd),
                            ),
                            a = [
                              -(wallHandleEnd[1] - wallHandleStart[1]) / n,
                              (wallHandleEnd[0] - wallHandleStart[0]) / n,
                            ],
                            r = Math.max(0.22, Math.min(0.36, n * 0.18)),
                            l = [e[0] + a[0] * r, e[1] + a[1] * r],
                            endpointHitRadius = wallEndpointHitRadius(n, Pn),
                            startWallTranslation = (event) =>
                              Qe(
                                wallChainActive
                                  ? {
                                      type: "wall-chain-offset",
                                      wallIds: selectedWallChain.wallIds,
                                      pointerStart: Ws(event, !1),
                                    }
                                  : {
                                      type: "wall-offset",
                                      id: A.id,
                                      pointerStart: Ws(event, !1),
                                      originWall: structuredClone(A),
                                    },
                                event,
                              ),
                            startWallEndpoint = (event, endpoint) => {
                              if (
                                isWallTranslationHandleHit(Ws(event, !1), l)
                              ) {
                                startWallTranslation(event);
                                return;
                              }
                              Qe(
                                wallChainActive
                                  ? {
                                      type: `wall-chain-${endpoint}`,
                                      wallIds: selectedWallChain.wallIds,
                                      endpointWallId:
                                        endpoint === "start"
                                          ? selectedWallChain.startWallId
                                          : selectedWallChain.endWallId,
                                    }
                                  : { type: `wall-${endpoint}`, id: A.id },
                                event,
                              );
                            };
                          return t.jsxs("g", {
                            className: "selected-wall-handles",
                            children: [
                              wallSplitPoint &&
                                selectedWallCount <= 1 &&
                                t.jsxs("g", {
                                  className: `wall-split-marker ${wallSplitPreview != null && wallSplitPreview.ok ? "valid" : "blocked"}`,
                                  "aria-hidden": "true",
                                  children: [
                                    t.jsx("circle", {
                                      cx: wallSplitPoint[0],
                                      cy: wallSplitPoint[1],
                                      r: "0.22",
                                      className: "wall-split-marker-halo",
                                    }),
                                    t.jsx("path", {
                                      d: `M ${wallSplitPoint[0] - 0.13} ${wallSplitPoint[1]} H ${wallSplitPoint[0] + 0.13} M ${wallSplitPoint[0]} ${wallSplitPoint[1] - 0.13} V ${wallSplitPoint[1] + 0.13}`,
                                      className: "wall-split-marker-cross",
                                    }),
                                    t.jsx("circle", {
                                      cx: wallSplitPoint[0],
                                      cy: wallSplitPoint[1],
                                      r: "0.065",
                                      className: "wall-split-marker-core",
                                    }),
                                    t.jsx("text", {
                                      x: wallSplitPoint[0],
                                      y: wallSplitPoint[1] - 0.32,
                                      className: "wall-split-marker-label",
                                      children: `${wallSplitDistance.toFixed(2)} m`,
                                    }),
                                  ],
                                }),
                              t.jsx("line", {
                                x1: e[0],
                                y1: e[1],
                                x2: l[0],
                                y2: l[1],
                                className: "wall-offset-connector",
                              }),
                              t.jsxs("g", {
                                transform: `translate(${l[0]} ${l[1]})`,
                                className: "wall-offset-handle",
                                "aria-label": "自由平移墙体",
                                children: [
                                  t.jsx("circle", {
                                    r: "0.18",
                                    className: "wall-offset-hitarea",
                                    pointerEvents: "all",
                                    onClick: (h) => h.stopPropagation(),
                                    onPointerDown: startWallTranslation,
                                    children: t.jsx("title", {
                                      children: wallChainActive
                                        ? `将 ${selectedWallCount} 段共线墙体作为整体平移`
                                        : "拖动整面墙；按住 Shift 可让端点吸附其他墙体并生成交点",
                                    }),
                                  }),
                                  t.jsx("line", {
                                    x1: "-0.16",
                                    y1: "0",
                                    x2: "0.16",
                                    y2: "0",
                                    className: "wall-offset-guide",
                                  }),
                                  t.jsx("line", {
                                    x1: "0",
                                    y1: "-0.16",
                                    x2: "0",
                                    y2: "0.16",
                                    className: "wall-offset-guide",
                                  }),
                                  t.jsx("path", {
                                    d: "M -0.16 0 L -0.1 -0.05 M -0.16 0 L -0.1 0.05 M 0.16 0 L 0.1 -0.05 M 0.16 0 L 0.1 0.05 M 0 -0.16 L -0.05 -0.1 M 0 -0.16 L 0.05 -0.1 M 0 0.16 L -0.05 0.1 M 0 0.16 L 0.05 0.1",
                                    className: "wall-offset-guide",
                                  }),
                                  t.jsx("rect", {
                                    x: "-0.07",
                                    y: "-0.07",
                                    width: "0.14",
                                    height: "0.14",
                                    rx: "0.02",
                                    transform: "rotate(45)",
                                    className: "wall-offset-core",
                                  }),
                                ],
                              }),
                              t.jsx("circle", {
                                cx: wallHandleStart[0],
                                cy: wallHandleStart[1],
                                r: endpointHitRadius,
                                className: "wall-handle-hitarea",
                                pointerEvents: "all",
                                onClick: (h) => h.stopPropagation(),
                                onPointerDown: (h) =>
                                  startWallEndpoint(h, "start"),
                                "aria-label": wallChainActive
                                  ? "调整整条共线墙链的起点"
                                  : "拖动端点会落在网格上；拖到已有端点所在网格时自动连接；按住 Shift 联动原有连接墙",
                                children: t.jsx("title", {
                                  children: wallChainActive
                                    ? "调整整条墙链起点，中间连接点会按比例移动"
                                    : "端点会落在网格上；拖到已有端点所在网格时自动连接；Shift 联动原有连接墙",
                                }),
                              }),
                              t.jsx("circle", {
                                cx: wallHandleStart[0],
                                cy: wallHandleStart[1],
                                r: "0.13",
                                className: "endpoint-handle",
                              }),
                              t.jsx("circle", {
                                cx: wallHandleEnd[0],
                                cy: wallHandleEnd[1],
                                r: endpointHitRadius,
                                className: "wall-handle-hitarea",
                                pointerEvents: "all",
                                onClick: (h) => h.stopPropagation(),
                                onPointerDown: (h) =>
                                  startWallEndpoint(h, "end"),
                                "aria-label": wallChainActive
                                  ? "调整整条共线墙链的终点"
                                  : "拖动端点会落在网格上；拖到已有端点所在网格时自动连接；按住 Shift 联动原有连接墙",
                                children: t.jsx("title", {
                                  children: wallChainActive
                                    ? "调整整条墙链终点，中间连接点会按比例移动"
                                    : "端点会落在网格上；拖到已有端点所在网格时自动连接；Shift 联动原有连接墙",
                                }),
                              }),
                              t.jsx("circle", {
                                cx: wallHandleEnd[0],
                                cy: wallHandleEnd[1],
                                r: "0.13",
                                className: "endpoint-handle",
                              }),
                            ],
                          });
                        })(),
                      Zo &&
                        R &&
                        t.jsxs("g", {
                          className: "selected-furniture-handles",
                          transform: `translate(${R.position[0]} ${R.position[1]}) rotate(${(R.rotation * 180) / Math.PI})`,
                          style: { pointerEvents: "none" },
                          onPointerDownCapture: (e) =>
                            dragFurnitureWithRightButton(R, e),
                          children: [
                            t.jsx("line", {
                              x1: "0",
                              y1: -R.depth / 2,
                              x2: "0",
                              y2: -R.depth / 2 - 0.4,
                              className: "furniture-handle-guide",
                            }),
                            t.jsx("circle", {
                              cx: "0",
                              cy: -R.depth / 2 - 0.4,
                              r:
                                R.kind === "cabinet"
                                  ? Math.min(0.28, cabinetLabelUnit * 18)
                                  : 0.28,
                              className: "furniture-handle-hitarea rotate",
                              onClick: (e) => e.stopPropagation(),
                              onPointerDown: (e) => {
                                Qe(
                                  {
                                    type: "furniture-rotate",
                                    id: R.id,
                                    originFurniture: structuredClone(R),
                                  },
                                  e,
                                );
                              },
                            }),
                            t.jsx("circle", {
                              cx: "0",
                              cy: -R.depth / 2 - 0.4,
                              r:
                                R.kind === "cabinet"
                                  ? Math.min(0.15, cabinetLabelUnit * 10)
                                  : 0.15,
                              className: "furniture-rotate-handle",
                              onClick: (e) => e.stopPropagation(),
                              onPointerDown: (e) => {
                                Qe(
                                  {
                                    type: "furniture-rotate",
                                    id: R.id,
                                    originFurniture: structuredClone(R),
                                  },
                                  e,
                                );
                              },
                            }),
                            R.kind === "cabinet" &&
                              (() => {
                                const segments = normalizeCabinetSegments(
                                    R.cabinetSegments,
                                    R.width,
                                    R.depth,
                                  ),
                                  activeSegment =
                                    segments.find(
                                      (segment) =>
                                        segment.id === selectedCabinetSegmentId,
                                    ) ?? segments[0];
                                return segments.map((segment) => {
                                  const active =
                                      segment.id === activeSegment?.id,
                                    relationActive =
                                      cabinetRelationFeedback?.furnitureId ===
                                        R.id &&
                                      cabinetRelationFeedback.activeId ===
                                        segment.id,
                                    relationReference =
                                      cabinetRelationFeedback?.furnitureId ===
                                        R.id &&
                                      cabinetRelationFeedback.referenceId ===
                                        segment.id,
                                    midpoint = [
                                      (segment.start[0] + segment.end[0]) / 2,
                                      (segment.start[1] + segment.end[1]) / 2,
                                    ];
                                  return t.jsxs(
                                    "g",
                                    {
                                      children: [
                                        t.jsx("line", {
                                          x1: segment.start[0],
                                          y1: segment.start[1],
                                          x2: segment.end[0],
                                          y2: segment.end[1],
                                          className: `cabinet-edit-segment ${segment.isDoorFront ? "door-front" : ""} ${active ? "active" : ""} ${relationActive ? "relation-active" : ""} ${relationReference ? `relation-reference ${cabinetRelationFeedback.type}` : ""}`,
                                          style: {
                                            pointerEvents: "stroke",
                                          },
                                          onPointerDown: (e) =>
                                            e.stopPropagation(),
                                          onClick: (e) => {
                                            e.stopPropagation();
                                            setSelectedCabinetSegmentId(
                                              segment.id,
                                            );
                                          },
                                        }),
                                        active &&
                                          [segment.start, segment.end].map(
                                            (point, pointIndex) =>
                                              t.jsx(
                                                "circle",
                                                {
                                                  cx: point[0],
                                                  cy: point[1],
                                                  r: "0.12",
                                                  className:
                                                    "cabinet-junction-handle",
                                                  style: {
                                                    pointerEvents: "all",
                                                  },
                                                  onClick: (e) =>
                                                    e.stopPropagation(),
                                                  onPointerDown: (e) =>
                                                    Qe(
                                                      {
                                                        type: "cabinet-segment-point",
                                                        id: R.id,
                                                        segmentId: segment.id,
                                                        originPoint: [...point],
                                                        originFurniture:
                                                          structuredClone(R),
                                                      },
                                                      e,
                                                    ),
                                                },
                                                `${segment.id}-${pointIndex}`,
                                              ),
                                          ),
                                        active &&
                                          t.jsxs("g", {
                                            transform: `translate(${midpoint[0]} ${midpoint[1]})`,
                                            className:
                                              "cabinet-segment-offset-handle",
                                            children: [
                                              t.jsx("circle", {
                                                r: "0.18",
                                                className:
                                                  "cabinet-segment-offset-hitarea",
                                                style: {
                                                  pointerEvents: "all",
                                                },
                                                onClick: (e) =>
                                                  e.stopPropagation(),
                                                onPointerDown: (e) =>
                                                  Qe(
                                                    {
                                                      type: "cabinet-segment-offset",
                                                      id: R.id,
                                                      segmentId: segment.id,
                                                      pointerStart: Ws(e, !1),
                                                      originFurniture:
                                                        structuredClone(R),
                                                    },
                                                    e,
                                                  ),
                                                children: t.jsx("title", {
                                                  children:
                                                    "拖动整条柜体外轮廓边；相邻边端点会同步移动",
                                                }),
                                              }),
                                              t.jsx("path", {
                                                d: "M -0.1 0 H 0.1 M 0 -0.1 V 0.1",
                                                className:
                                                  "cabinet-segment-offset-guide",
                                              }),
                                            ],
                                          }),
                                        relationActive &&
                                          t.jsx("text", {
                                            x: midpoint[0],
                                            y:
                                              midpoint[1] -
                                              cabinetLabelUnit * 14,
                                            textAnchor: "middle",
                                            className: `cabinet-relation-label ${cabinetRelationFeedback.type}`,
                                            style: {
                                              fontSize: `${cabinetLabelUnit * 11}px`,
                                              strokeWidth: `${cabinetLabelUnit * 2}px`,
                                            },
                                            children:
                                              cabinetRelationFeedback.type ===
                                              "parallel"
                                                ? "平行"
                                                : "垂直",
                                          }),
                                      ],
                                    },
                                    segment.id,
                                  );
                                });
                              })(),
                            R.kind !== "cabinet" &&
                              t.jsx("rect", {
                                x: -R.width / 2,
                                y: -R.depth / 2,
                                width: R.width,
                                height: R.depth,
                                className: "furniture-selection-outline",
                              }),
                            R.kind !== "cabinet" &&
                              t.jsx("rect", {
                                x: R.width / 2 - 0.025,
                                y: R.depth / 2 - 0.025,
                                width: "0.05",
                                height: "0.05",
                                className: "furniture-handle-hitarea resize",
                                onClick: (e) => e.stopPropagation(),
                                onPointerDown: (e) => {
                                  Qe(
                                    {
                                      type: "furniture-resize",
                                      id: R.id,
                                      originFurniture: structuredClone(R),
                                    },
                                    e,
                                  );
                                },
                              }),
                            R.kind !== "cabinet" &&
                              t.jsx("rect", {
                                x: R.width / 2 - 0.025,
                                y: R.depth / 2 - 0.025,
                                width: "0.05",
                                height: "0.05",
                                className: "furniture-resize-handle",
                                onClick: (e) => e.stopPropagation(),
                                onPointerDown: (e) => {
                                  if (e.shiftKey) {
                                    Qe({ type: "furniture", id: R.id }, e);
                                    return;
                                  }
                                  Qe(
                                    {
                                      type: "furniture-resize",
                                      id: R.id,
                                      originFurniture: structuredClone(R),
                                    },
                                    e,
                                  );
                                },
                              }),
                          ],
                        }),
                      ...b.devices.filter(device=>device.curtainTrack && ['cover.curtain','cover.sheer'].includes(ws(device,i[device.entityId]).id) && (!curtainSession || curtainSession.deviceId!==device.id)).map(device=>t.jsx(CurtainTrackPlan,{device,track:device.curtainTrack,selected:w?.id===device.id,onSelect:event=>{event.stopPropagation();Ve({type:'device',id:device.id});B(device.entityId);Te(true);}},`curtain-track-${device.id}`)),
                      curtainSession && w?.id===curtainSession.deviceId && t.jsx(CurtainTrackOverlay,{device:w,session:curtainSession,setSession:setCurtainSession,getPoint:event=>ss(event,false).point,walls:b.walls,snapEnabled:Xe,zoom:ye,panActive:xn||!!Ae}),
                    ],
                  }),
              L === "device" &&
                T &&
                t.jsx("div", {
                  className: "wall-editing-tip light-strip-editing-tip",
                  role: "status",
                  children: "点击添加端点 · Enter 完成 · Esc 取消",
                }),
              L === "device" &&
                He &&
                !T &&
                t.jsx("div", {
                  className: "wall-editing-tip",
                  role: "status",
                  children:
                    "移动鼠标预览设备 · 与墙体或其他设备水平/垂直对齐时会显示辅助线并自动吸附",
                }),
              pt &&
                w &&
                !T &&
                t.jsx("div", {
                  className: "wall-editing-tip light-strip-editing-tip",
                  role: "status",
                  children: "拖动端点调整灯带路径 · Esc 取消",
                }),
              L === "wall" &&
                fe &&
                t.jsx("div", {
                  className: "wall-editing-tip",
                  role: "status",
                  children:
                    "移动鼠标预览墙体 · 对齐墙体或设备时显示辅助线 · 接近水平/垂直会自动锁直 · 按住 Shift 强制锁直 · 靠近圆点自动连接端点 · Esc 取消",
                }),
              L === "select" &&
                A &&
                t.jsx("div", {
                  className: "wall-editing-tip",
                  role: "status",
                  children:
                    "端点和墙体可操作区会高亮 · 墙旁手柄可平移整墙 · 端点碰到其他墙体会吸附并生成交点 · Shift 联动原有连接墙 · Esc 取消",
                }),
              t.jsxs("div", {
                className: "editor-statusbar",
                role: "status",
                children: [
                  t.jsxs("span", {
                    children: [t.jsx(di, { size: 14 }), b.name],
                  }),
                  t.jsxs("span", {
                    children: [pe.length || (D ? 1 : 0), " 个选中"],
                  }),
                  t.jsxs("span", {
                    className: ae ? "status-snap active" : "status-snap",
                    children: [t.jsx("i", {}), qo],
                  }),
                  t.jsxs("span", { children: [Fn, " · ", Yi] }),
                  t.jsx("span", { className: "status-help", children: il }),
                ],
              }),
              Si &&
                t.jsx("div", {
                  className: "topology-notice",
                  role: "status",
                  children: Si,
                }),
              rt === "2d" &&
                t.jsxs("div", {
                  className: "canvas-hud canvas-zoom",
                  children: [
                    t.jsx("button", {
                      onClick: () => la(-0.15),
                      "aria-label": "缩小",
                      children: "-",
                    }),
                    t.jsxs("span", { children: [Math.round(ye * 100), "%"] }),
                    t.jsx("button", {
                      onClick: () => la(0.15),
                      "aria-label": "放大",
                      children: "+",
                    }),
                    t.jsxs("button", {
                      className: "fit-view-button",
                      onClick: Ks,
                      "aria-label": "居中并适应画布",
                      title: "居中并适应画布",
                      children: [
                        t.jsx(Fl, { size: 15 }),
                        t.jsx("b", { children: "居中" }),
                      ],
                    }),
                  ],
                }),
            ],
          }),
          t.jsxs("aside", {
            className: `inspector-panel ${ps ? "open" : ""} ${ot ? "expanded" : ""}`,
            "aria-hidden": !ps,
            children: [
              t.jsx("button", {
                className: "panel-grabber",
                onClick: () => lt((e) => !e),
                "aria-label": "切换属性面板高度",
                title: ot ? "收起属性面板" : "展开属性面板",
                children: t.jsx("span", {}),
              }),
              t.jsxs("div", {
                className: "inspector-title",
                children: [
                  t.jsxs("div", {
                    children: [
                      t.jsx("small", { children: nl }),
                      t.jsx("h2", { children: sl }),
                    ],
                  }),
                  t.jsx("button", {
                    className: "inspector-expand",
                    onClick: () => lt((e) => !e),
                    "aria-expanded": ot,
                    "aria-label": ot ? "收起属性面板" : "展开属性面板",
                    title: ot ? "收起属性面板" : "展开属性面板",
                    children: ot
                      ? t.jsx(Ua, { size: 18 })
                      : t.jsx(kl, { size: 18 }),
                  }),
                  t.jsx("button", {
                    className: "panel-close inspector-close",
                    onClick: () => {
                      (Te(!1), lt(!1));
                    },
                    "aria-label": "收起属性",
                    children: t.jsx(Yn, { size: 18 }),
                  }),
                ],
              }),
              bs &&
                !w &&
                t.jsxs("section", {
                  className: "selection-summary-card",
                  "aria-label": "选中对象摘要",
                  children: [
                    t.jsxs("div", {
                      className: "selection-summary-heading",
                      children: [
                        t.jsx("small", { children: bs.eyebrow }),
                        t.jsx("strong", { children: bs.title }),
                      ],
                    }),
                    t.jsx("div", {
                      className: "selection-summary-metrics",
                      children: bs.metrics.map((e) =>
                        t.jsxs(
                          "span",
                          {
                            children: [
                              t.jsx("small", { children: e.label }),
                              t.jsx("b", { children: e.value }),
                            ],
                          },
                          e.label,
                        ),
                      ),
                    }),
                    t.jsx("p", { children: bs.note }),
                  ],
                }),
              A &&
                t.jsxs("div", {
                  className: "property-stack",
                  children: [
                    t.jsxs("div", {
                      className: "property-section",
                      children: [
                        t.jsx("h3", { children: "尺寸" }),
                        t.jsxs("label", {
                          children: [
                            t.jsx("span", { children: "长度" }),
                            t.jsxs("div", {
                              className: "unit-input",
                              children: [
                                t.jsx("input", {
                                  type: "number",
                                  min: "0.2",
                                  step: "0.1",
                                  value: Number(X(A.start, A.end).toFixed(2)),
                                  onChange: (e) => {
                                    const n = X(A.start, A.end) || 1,
                                      a = Ie(
                                        Number(e.target.value),
                                        n,
                                        0.2,
                                        200,
                                      ),
                                      r = [
                                        A.start[0] +
                                          ((A.end[0] - A.start[0]) / n) * a,
                                        A.start[1] +
                                          ((A.end[1] - A.start[1]) / n) * a,
                                      ];
                                    F((l) => {
                                      var u;
                                      const h = l.walls.map((p) =>
                                        p.id === A.id ? { ...p, end: r } : p,
                                      );
                                      return {
                                        ...l,
                                        walls: h,
                                        rooms: Vt(
                                          h,
                                          l.rooms,
                                          (u = P.materials.find((p) =>
                                            p.id.includes("floor"),
                                          )) == null
                                            ? void 0
                                            : u.id,
                                        ),
                                      };
                                    });
                                  },
                                }),
                                t.jsx("i", { children: "m" }),
                              ],
                            }),
                          ],
                        }),
                        selectedWallCount <= 1 &&
                          t.jsxs("div", {
                            className: "wall-split-control",
                            children: [
                              t.jsxs("div", {
                                className: "wall-split-heading",
                                children: [
                                  t.jsx("span", { children: "线段分段" }),
                                  t.jsx("b", {
                                    children: `${wallSplitDistance.toFixed(2)} m / ${wallLength.toFixed(2)} m`,
                                  }),
                                ],
                              }),
                              t.jsx("input", {
                                className: "wall-split-range",
                                type: "range",
                                min: wallSplitMinimumRatio,
                                max: 1 - wallSplitMinimumRatio,
                                step: "0.01",
                                value: effectiveWallSplitRatio,
                                disabled: !wallCanSplit,
                                "aria-label": "沿墙体调整分割位置",
                                onChange: (e) =>
                                  setWallSplitRatio(Number(e.target.value)),
                              }),
                              t.jsxs("div", {
                                className: "wall-split-scale",
                                children: [
                                  t.jsx("span", { children: "起点" }),
                                  t.jsx("span", { children: "终点" }),
                                ],
                              }),
                              t.jsxs("div", {
                                className: "wall-split-quick-actions",
                                children: [
                                  [1 / 3, "1/3"],
                                  [1 / 2, "中点"],
                                  [2 / 3, "2/3"],
                                ].map(([e, n]) =>
                                  t.jsx(
                                    "button",
                                    {
                                      type: "button",
                                      className:
                                        Math.abs(effectiveWallSplitRatio - e) <
                                        0.015
                                          ? "active"
                                          : "",
                                      disabled:
                                        !wallCanSplit ||
                                        e < wallSplitMinimumRatio ||
                                        e > 1 - wallSplitMinimumRatio,
                                      onClick: () => setWallSplitRatio(e),
                                      children: n,
                                    },
                                    n,
                                  ),
                                ),
                              }),
                              t.jsxs("label", {
                                className: "wall-split-distance",
                                children: [
                                  t.jsx("span", { children: "距起点" }),
                                  t.jsxs("div", {
                                    className: "unit-input",
                                    children: [
                                      t.jsx("input", {
                                        type: "number",
                                        min: "0.2",
                                        max: Math.max(0.2, wallLength - 0.2),
                                        step: "0.05",
                                        value: Number(
                                          wallSplitDistance.toFixed(2),
                                        ),
                                        disabled: !wallCanSplit,
                                        onChange: (e) => {
                                          const n = Ie(
                                            Number(e.target.value),
                                            wallSplitDistance,
                                            0.2,
                                            Math.max(0.2, wallLength - 0.2),
                                          );
                                          setWallSplitRatio(n / wallLength);
                                        },
                                      }),
                                      t.jsx("i", { children: "m" }),
                                    ],
                                  }),
                                ],
                              }),
                              t.jsxs("button", {
                                type: "button",
                                className: "wall-split-button",
                                disabled: !(
                                  wallSplitPreview != null &&
                                  wallSplitPreview.ok
                                ),
                                onClick: splitSelectedWall,
                                children: [
                                  t.jsx("span", {
                                    className: "wall-split-button-icon",
                                    "aria-hidden": "true",
                                    children: "✂",
                                  }),
                                  "在标记处分为两段",
                                ],
                              }),
                              t.jsx("p", {
                                className: `field-hint ${wallSplitPreview != null && wallSplitPreview.reason === "intersects-opening" ? "warning" : ""}`,
                                children:
                                  wallSplitPreview != null &&
                                  wallSplitPreview.reason ===
                                    "intersects-opening"
                                    ? "当前位置与门窗洞口重叠，请移动分割点。"
                                    : wallCanSplit
                                      ? "拖动滑块、输入精确距离或使用快捷位置；画布上的十字标记会同步预览。"
                                      : "墙体至少需要 0.40 m 才能分成两段。",
                              }),
                            ],
                          }),
                        t.jsxs("label", {
                          children: [
                            t.jsxs("span", {
                              children: [
                                "墙厚",
                                pe.filter((e) => e.startsWith("wall:")).length >
                                1
                                  ? `（${pe.filter((e) => e.startsWith("wall:")).length} 面）`
                                  : "",
                              ],
                            }),
                            t.jsxs("div", {
                              className: "unit-input",
                              children: [
                                t.jsx("input", {
                                  type: "number",
                                  min: "0.08",
                                  max: "0.5",
                                  step: "0.01",
                                  value: A.thickness,
                                  onChange: (e) => {
                                    const n = new Set(
                                      pe
                                        .filter((a) => a.startsWith("wall:"))
                                        .map((a) => a.slice(5)),
                                    );
                                    (n.size || n.add(A.id),
                                      F((a) => ({
                                        ...a,
                                        walls: a.walls.map((r) =>
                                          n.has(r.id)
                                            ? {
                                                ...r,
                                                thickness: Ie(
                                                  Number(e.target.value),
                                                  r.thickness,
                                                  0.08,
                                                  0.5,
                                                ),
                                              }
                                            : r,
                                        ),
                                      })));
                                  },
                                }),
                                t.jsx("i", { children: "m" }),
                              ],
                            }),
                          ],
                        }),
                        t.jsxs("label", {
                          children: [
                            t.jsx("span", { children: "墙高" }),
                            t.jsxs("div", {
                              className: "unit-input",
                              children: [
                                t.jsx("input", {
                                  type: "number",
                                  min: "1",
                                  max: "6",
                                  step: "0.1",
                                  value: A.height,
                                  onChange: (e) => {
                                    const n = new Set(
                                      pe
                                        .filter((a) => a.startsWith("wall:"))
                                        .map((a) => a.slice(5)),
                                    );
                                    (n.size || n.add(A.id),
                                      F((a) => ({
                                        ...a,
                                        walls: a.walls.map((r) =>
                                          n.has(r.id)
                                            ? {
                                                ...r,
                                                height: Ie(
                                                  Number(e.target.value),
                                                  r.height,
                                                  1,
                                                  6,
                                                ),
                                              }
                                            : r,
                                        ),
                                      })));
                                  },
                                }),
                                t.jsx("i", { children: "m" }),
                              ],
                            }),
                          ],
                        }),
                        pe.filter((e) => e.startsWith("wall:")).length > 1 &&
                          t.jsxs("div", {
                            className: "wall-straighten-control",
                            children: [
                              t.jsxs("div", {
                                className: "wall-chain-actions",
                                children: [
                                  t.jsxs("button", {
                                    type: "button",
                                    className:
                                      "flip-opening-button wall-straighten-button",
                                    onClick: straightenSelectedWalls,
                                    children: [
                                      t.jsx($l, { size: 16 }),
                                      "自动拉直选中墙体",
                                    ],
                                  }),
                                  t.jsxs("button", {
                                    type: "button",
                                    className:
                                      "flip-opening-button wall-merge-button",
                                    onClick: mergeSelectedWalls,
                                    children: [
                                      t.jsx($l, { size: 16 }),
                                      "合并为一段墙体",
                                    ],
                                  }),
                                ],
                              }),
                              t.jsx("p", {
                                className: "field-hint",
                                children:
                                  "按住 Shift 逐段选择连续墙体；弯曲墙链可先拉直，再合并为一段，门窗位置会自动保留。",
                              }),
                            ],
                          }),
                      ],
                    }),
                    t.jsxs("div", {
                      className: "property-section",
                      children: [
                        t.jsx("h3", { children: "外观" }),
                        t.jsxs("label", {
                          children: [
                            t.jsx("span", { children: "墙体类型" }),
                            t.jsxs("div", {
                              className: "option-grid wall-type-grid",
                              children: [
                                t.jsx("button", {
                                  type: "button",
                                  className: Ys ? "" : "active",
                                  "aria-pressed": !Ys,
                                  onClick: () => ha(!1),
                                  children: "实体墙",
                                }),
                                t.jsx("button", {
                                  type: "button",
                                  className: Ys ? "active" : "",
                                  "aria-pressed": Ys,
                                  onClick: () => ha(!0),
                                  children: "虚拟墙",
                                }),
                              ],
                            }),
                          ],
                        }),
                        t.jsx("p", {
                          className: "field-hint",
                          children:
                            "虚拟墙只用于房间规划和面积计算，在 3D 场景中不会显示。",
                        }),
                        t.jsxs("label", {
                          children: [
                            t.jsx("span", { children: "墙面颜色" }),
                            t.jsxs("div", {
                              className: "color-field",
                              children: [
                                t.jsx("input", {
                                  "aria-label": "墙面颜色",
                                  type: "color",
                                  value: $a,
                                  onChange: (e) => Wo(e.target.value),
                                }),
                                t.jsx("code", { children: $a.toUpperCase() }),
                              ],
                            }),
                          ],
                        }),
                      ],
                    }),
                    t.jsxs("button", {
                      className: "danger-button",
                      onClick: ts,
                      children: [t.jsx(Et, { size: 16 }), "删除墙体"],
                    }),
                  ],
                }),
              K &&
                t.jsxs("div", {
                  className: "property-stack",
                  children: [
                    t.jsxs("div", {
                      className: "property-section",
                      children: [
                        t.jsx("h3", { children: "尺寸与位置" }),
                        [
                          "width",
                          "height",
                          ...(K.type === "window" &&
                          K.windowStyle === "floor_to_ceiling"
                            ? []
                            : ["bottom"]),
                        ].map((e) =>
                          t.jsxs(
                            "label",
                            {
                              children: [
                                t.jsx("span", {
                                  children: {
                                    width: "宽度",
                                    height: "高度",
                                    bottom: "离地",
                                  }[e],
                                }),
                                t.jsxs("div", {
                                  className: "unit-input",
                                  children: [
                                    t.jsx("input", {
                                      type: "number",
                                      min: "0",
                                      step: "0.1",
                                      value: K[e],
                                      onChange: (n) =>
                                        F((a) => ({
                                          ...a,
                                          openings: a.openings.map((r) =>
                                            r.id === K.id
                                              ? {
                                                  ...r,
                                                  [e]: Number(n.target.value),
                                                }
                                              : r,
                                          ),
                                        })),
                                    }),
                                    t.jsx("i", { children: "m" }),
                                  ],
                                }),
                              ],
                            },
                            e,
                          ),
                        ),
                        t.jsxs("label", {
                          children: [
                            t.jsx("span", { children: "沿墙位置" }),
                            t.jsxs("div", {
                              className: "unit-input",
                              children: [
                                t.jsx("input", {
                                  type: "number",
                                  min: K.width / 2,
                                  max: Ot
                                    ? X(Ot.start, Ot.end) - K.width / 2
                                    : void 0,
                                  step: "0.1",
                                  value: Number(K.offset.toFixed(2)),
                                  onChange: (e) =>
                                    F((n) => ({
                                      ...n,
                                      openings: n.openings.map((a) =>
                                        a.id === K.id
                                          ? {
                                              ...a,
                                              offset: Number(e.target.value),
                                            }
                                          : a,
                                      ),
                                    })),
                                }),
                                t.jsx("i", { children: "m" }),
                              ],
                            }),
                          ],
                        }),
                      ],
                    }),
                    K.type === "door"
                      ? t.jsxs(t.Fragment, {
                          children: [
                            t.jsxs("div", {
                              className: "property-section",
                              children: [
                                t.jsx("h3", { children: "门扇与开向" }),
                                t.jsxs("div", {
                                  className: "option-grid",
                                  children: [
                                    t.jsx("button", {
                                      className: K.hasLeaf ? "active" : "",
                                      onClick: () =>
                                        F((e) => ({
                                          ...e,
                                          openings: e.openings.map((n) =>
                                            n.id === K.id
                                              ? { ...n, hasLeaf: !0 }
                                              : n,
                                          ),
                                        })),
                                      children: "门扇",
                                    }),
                                    t.jsx("button", {
                                      className: K.hasLeaf ? "" : "active",
                                      onClick: () =>
                                        F((e) => ({
                                          ...e,
                                          openings: e.openings.map((n) =>
                                            n.id === K.id
                                              ? {
                                                  ...n,
                                                  hasLeaf: !1,
                                                  entityId: void 0,
                                                }
                                              : n,
                                          ),
                                        })),
                                      children: "门洞",
                                    }),
                                    t.jsx("button", {
                                      className:
                                        K.swing === "inward" ? "active" : "",
                                      onClick: () =>
                                        F((e) => ({
                                          ...e,
                                          openings: e.openings.map((n) =>
                                            n.id === K.id
                                              ? { ...n, swing: "inward" }
                                              : n,
                                          ),
                                        })),
                                      children: "内开",
                                    }),
                                    t.jsx("button", {
                                      className:
                                        K.swing === "outward" ? "active" : "",
                                      onClick: () =>
                                        F((e) => ({
                                          ...e,
                                          openings: e.openings.map((n) =>
                                            n.id === K.id
                                              ? { ...n, swing: "outward" }
                                              : n,
                                          ),
                                        })),
                                      children: "外开",
                                    }),
                                  ],
                                }),
                                t.jsxs("button", {
                                  className: "flip-opening-button",
                                  onClick: () =>
                                    F((e) => ({
                                      ...e,
                                      openings: e.openings.map((n) =>
                                        n.id === K.id
                                          ? {
                                              ...n,
                                              hinge:
                                                n.hinge === "start"
                                                  ? "end"
                                                  : "start",
                                            }
                                          : n,
                                      ),
                                    })),
                                  children: [
                                    t.jsx(Dl, { size: 16 }),
                                    "翻转门扇",
                                  ],
                                }),
                              ],
                            }),
                            t.jsx(DoorSensorBinding, {
                              opening: K,
                              entities: i,
                              stateLabel: ls,
                              onChange: (entityId) => F((n) => ({
                                ...n,
                                openings: n.openings.map((a) => a.id === K.id ? {
                                  ...a, entityId: entityId || void 0,
                                  hasLeaf: entityId ? true : a.hasLeaf,
                                } : a),
                              })),
                            }, K.id),
                          ],
                        })
                      : t.jsxs("div", {
                          className: "property-section",
                          children: [
                            t.jsx("h3", { children: "窗体类型" }),
                            t.jsxs("div", {
                              className: "option-grid",
                              children: [
                                t.jsx("button", {
                                  className:
                                    K.windowStyle === "standard"
                                      ? "active"
                                      : "",
                                  onClick: () =>
                                    F((e) => ({
                                      ...e,
                                      openings: e.openings.map((n) =>
                                        n.id === K.id
                                          ? {
                                              ...n,
                                              windowStyle: "standard",
                                              bottom: n.bottom || 0.9,
                                            }
                                          : n,
                                      ),
                                    })),
                                  children: "普通窗",
                                }),
                                t.jsx("button", {
                                  className:
                                    K.windowStyle === "floor_to_ceiling"
                                      ? "active"
                                      : "",
                                  onClick: () =>
                                    F((e) => ({
                                      ...e,
                                      openings: e.openings.map((n) =>
                                        n.id === K.id
                                          ? {
                                              ...n,
                                              windowStyle: "floor_to_ceiling",
                                              bottom: 0,
                                              height:
                                                (Ot == null
                                                  ? void 0
                                                  : Ot.height) ?? n.height,
                                            }
                                          : n,
                                      ),
                                    })),
                                  children: "落地窗",
                                }),
                              ],
                            }),
                          ],
                        }),
                    t.jsxs("button", {
                      className: "danger-button",
                      onClick: ts,
                      children: [
                        t.jsx(Et, { size: 16 }),
                        "删除",
                        K.type === "door" ? "门" : "窗",
                      ],
                    }),
                  ],
                }),
              R &&
                t.jsxs("div", {
                  className: "property-stack",
                  children: [
                    t.jsxs("div", {
                      className: "property-section furniture-copy-section",
                      children: [
                        t.jsxs("div", {
                          className: "furniture-copy-heading",
                          children: [
                            t.jsx("h3", { children: "复制与粘贴" }),
                            t.jsx("span", {
                              children: `${Math.max(1, selectedFurnitureCount)} 件家具`,
                            }),
                          ],
                        }),
                        t.jsxs("div", {
                          className: "furniture-copy-actions",
                          children: [
                            t.jsxs("button", {
                              type: "button",
                              onClick: copySelectedFurniture,
                              title: "复制当前选中的家具 (Ctrl+C)",
                              children: [t.jsx(Il, { size: 15 }), "复制所选"],
                            }),
                            t.jsx("button", {
                              type: "button",
                              onClick: _o,
                              title: "粘贴家具副本 (Ctrl+V)",
                              children: "粘贴副本",
                            }),
                          ],
                        }),
                        t.jsx("p", {
                          children:
                            "按住 Shift 或 Ctrl 可多选家具；复制后会保留组内水平面绑定关系，并整体偏移放置。",
                        }),
                      ],
                    }),
                    t.jsxs("div", {
                      className: "property-section",
                      children: [
                        t.jsx("h3", { children: "尺寸与位置" }),
                        (R.kind === "cabinet"
                          ? ["height"]
                          : R.kind === "vanity_mirror_cabinet"
                            ? ["width", "depth"]
                            : ["width", "depth", "height"]
                        ).map((e) =>
                          t.jsxs(
                            "label",
                            {
                              children: [
                                t.jsx("span", {
                                  children: {
                                    width:
                                      R.kind === "vanity_mirror_cabinet"
                                        ? "台柜宽度"
                                        : "宽度",
                                    depth:
                                      R.kind === "vanity_mirror_cabinet"
                                        ? "台柜深度"
                                        : "深度",
                                    height: "高度",
                                  }[e],
                                }),
                                t.jsxs("div", {
                                  className: "unit-input",
                                  children: [
                                    t.jsx("input", {
                                      type: "number",
                                      min: "0.2",
                                      max: "20",
                                      step: qn,
                                      value: Number(R[e].toFixed(2)),
                                      onChange: (n) => {
                                        const value = Number(n.target.value);
                                        F((a) => ({
                                          ...a,
                                          furniture: a.furniture.map((r) => {
                                            if (r.id !== R.id) return r;
                                            return r.kind ===
                                              "vanity_mirror_cabinet"
                                              ? {
                                                  ...r,
                                                  ...normalizeVanityMirrorCabinet(
                                                    { ...r, [e]: value },
                                                  ),
                                                }
                                              : { ...r, [e]: value };
                                          }),
                                        }));
                                      },
                                    }),
                                    t.jsx("i", { children: "m" }),
                                  ],
                                }),
                              ],
                            },
                            e,
                          ),
                        ),
                        R.kind === "vanity_mirror_cabinet" &&
                          t.jsxs("div", {
                            className: "segmented-cabinet-fields",
                            children: [
                              [
                                ["vanityHeight", "台柜高度", 0.5, 1.2],
                                ["basinWidth", "台盆宽度", 0.2, R.width - 0.1],
                                [
                                  "basinDepth",
                                  "台盆深度",
                                  0.18,
                                  R.depth - 0.08,
                                ],
                                ["mirrorWidth", "镜柜宽度", 0.3, R.width],
                                ["mirrorDepth", "镜柜深度", 0.08, R.depth],
                                ["mirrorHeight", "镜柜高度", 0.3, 1.2],
                                ["mirrorGap", "台面至镜柜间距", 0.08, 1],
                              ].map(([field, label, minimum, maximum]) =>
                                t.jsxs(
                                  "label",
                                  {
                                    children: [
                                      t.jsx("span", { children: label }),
                                      t.jsxs("div", {
                                        className: "unit-input",
                                        children: [
                                          t.jsx("input", {
                                            type: "number",
                                            min: minimum,
                                            max: maximum,
                                            step: "0.01",
                                            value: Number(R[field].toFixed(2)),
                                            onChange: (event) => {
                                              const value = Number(
                                                event.target.value,
                                              );
                                              F((floor) => ({
                                                ...floor,
                                                furniture: floor.furniture.map(
                                                  (item) =>
                                                    item.id === R.id
                                                      ? {
                                                          ...item,
                                                          ...normalizeVanityMirrorCabinet(
                                                            {
                                                              ...item,
                                                              [field]: value,
                                                            },
                                                          ),
                                                        }
                                                      : item,
                                                ),
                                              }));
                                            },
                                          }),
                                          t.jsx("i", { children: "m" }),
                                        ],
                                      }),
                                    ],
                                  },
                                  field,
                                ),
                              ),
                              t.jsx("p", {
                                children: `组合总高：${R.height.toFixed(2)} m（台柜高度＋间距＋镜柜高度）`,
                              }),
                            ],
                          }),
                        R.kind === "shower_enclosure" &&
                          t.jsxs("label", {
                            children: [
                              t.jsx("span", { children: "淋浴间样式" }),
                              t.jsx(ns, {
                                value: normalizeShowerStyle(R.showerStyle),
                                onChange: (event) =>
                                  F((floor) => ({
                                    ...floor,
                                    furniture: floor.furniture.map((item) =>
                                      item.id === R.id
                                        ? {
                                            ...item,
                                            showerStyle: normalizeShowerStyle(
                                              event.target.value,
                                            ),
                                          }
                                        : item,
                                    ),
                                  })),
                                children: SHOWER_STYLE_OPTIONS.map((style) =>
                                  t.jsx(
                                    "option",
                                    {
                                      value: style.id,
                                      children: style.label,
                                    },
                                    style.id,
                                  ),
                                ),
                              }),
                            ],
                          }),
                        R.kind === "shower_enclosure" &&
                          normalizeShowerStyle(R.showerStyle) === "diamond" &&
                          t.jsxs("label", {
                            children: [
                              t.jsx("span", { children: "钻石斜边切角" }),
                              t.jsxs("div", {
                                className: "unit-input",
                                children: [
                                  t.jsx("input", {
                                    type: "number",
                                    min: "0.08",
                                    max: Math.max(
                                      0.08,
                                      Math.min(R.width, R.depth) / 2 - 0.08,
                                    ),
                                    step: "0.01",
                                    value: Number(
                                      normalizeShowerCornerCut(
                                        R.showerCornerCut,
                                        R.width,
                                        R.depth,
                                      ).toFixed(2),
                                    ),
                                    onChange: (event) =>
                                      F((floor) => ({
                                        ...floor,
                                        furniture: floor.furniture.map(
                                          (item) =>
                                            item.id === R.id
                                              ? {
                                                  ...item,
                                                  showerCornerCut:
                                                    normalizeShowerCornerCut(
                                                      event.target.value,
                                                      item.width,
                                                      item.depth,
                                                    ),
                                                }
                                              : item,
                                        ),
                                      })),
                                  }),
                                  t.jsx("i", { children: "m" }),
                                ],
                              }),
                            ],
                          }),
                        R.kind === "cabinet" &&
                          t.jsxs("label", {
                            children: [
                              t.jsx("span", { children: "柜体样式" }),
                              t.jsx(ns, {
                                value: R.cabinetStyle ?? "base",
                                onChange: (e) =>
                                  F((project) => ({
                                    ...project,
                                    furniture: project.furniture.map((item) =>
                                      item.id === R.id
                                        ? {
                                            ...item,
                                            cabinetStyle: e.target.value,
                                          }
                                        : item,
                                    ),
                                  })),
                                children: CABINET_STYLE_OPTIONS.map((option) =>
                                  t.jsx(
                                    "option",
                                    {
                                      value: option.id,
                                      children: option.label,
                                    },
                                    option.id,
                                  ),
                                ),
                              }),
                            ],
                          }),
                        R.kind === "cabinet" &&
                          t.jsxs("label", {
                            children: [
                              t.jsx("span", { children: "柜门数量" }),
                              t.jsx("input", {
                                type: "number",
                                min: "1",
                                max: "12",
                                step: "1",
                                value: normalizeCabinetDoorCount(
                                  R.cabinetDoorCount,
                                ),
                                onChange: (event) =>
                                  F((floor) => ({
                                    ...floor,
                                    furniture: floor.furniture.map((item) =>
                                      item.id === R.id
                                        ? {
                                            ...item,
                                            cabinetDoorCount:
                                              normalizeCabinetDoorCount(
                                                event.target.value,
                                              ),
                                          }
                                        : item,
                                    ),
                                  })),
                              }),
                            ],
                          }),
                        R.kind === "cabinet" &&
                          R.cabinetStyle === "segmented" &&
                          (() => {
                            const heights = normalizeSegmentedCabinetHeights(
                                R.height,
                                R.cabinetSectionOneHeight,
                                R.cabinetHollowHeight,
                              ),
                              lowerDepth = cabinetFrontDepth(
                                R.cabinetSegments,
                                R.cabinetDepth ?? R.depth,
                              ),
                              updateHeights = (
                                sectionOneHeight,
                                hollowHeight,
                              ) => {
                                const next = normalizeSegmentedCabinetHeights(
                                  R.height,
                                  sectionOneHeight,
                                  hollowHeight,
                                );
                                F((floor) => ({
                                  ...floor,
                                  furniture: floor.furniture.map((item) =>
                                    item.id === R.id
                                      ? {
                                          ...item,
                                          cabinetSectionOneHeight:
                                            next.sectionOneHeight,
                                          cabinetHollowHeight:
                                            next.hollowHeight,
                                        }
                                      : item,
                                  ),
                                }));
                              };
                            return t.jsxs("div", {
                              className: "segmented-cabinet-fields",
                              children: [
                                t.jsxs("label", {
                                  children: [
                                    t.jsx("span", { children: "一段高度" }),
                                    t.jsxs("div", {
                                      className: "unit-input",
                                      children: [
                                        t.jsx("input", {
                                          type: "number",
                                          min: "0.1",
                                          max: Math.max(0.1, R.height - 0.1),
                                          step: "0.05",
                                          value: Number(
                                            heights.sectionOneHeight.toFixed(2),
                                          ),
                                          onChange: (event) =>
                                            updateHeights(
                                              event.target.value,
                                              heights.hollowHeight,
                                            ),
                                        }),
                                        t.jsx("i", { children: "m" }),
                                      ],
                                    }),
                                  ],
                                }),
                                t.jsxs("label", {
                                  children: [
                                    t.jsx("span", { children: "一段深度" }),
                                    t.jsxs("div", {
                                      className: "unit-input",
                                      children: [
                                        t.jsx("input", {
                                          type: "number",
                                          min: "0.2",
                                          max: "4",
                                          step: "0.05",
                                          value: Number(lowerDepth.toFixed(2)),
                                          onChange: (event) => {
                                            const targetDepth = Math.max(
                                              0.2,
                                              normalizeCabinetUpperDepth(
                                                event.target.value,
                                                lowerDepth,
                                              ),
                                            );
                                            F((floor) => ({
                                              ...floor,
                                              furniture: floor.furniture.map(
                                                (item) => {
                                                  if (item.id !== R.id)
                                                    return item;
                                                  const segments =
                                                      resizeCabinetDepthFromBack(
                                                        item.cabinetSegments,
                                                        targetDepth,
                                                        item.cabinetDepth ??
                                                          item.depth,
                                                      ),
                                                    bounds =
                                                      cabinetLayoutBounds(
                                                        segments,
                                                        targetDepth,
                                                      );
                                                  return {
                                                    ...item,
                                                    cabinetDepth: targetDepth,
                                                    cabinetSegments: segments,
                                                    width: bounds.width,
                                                    depth: bounds.depth,
                                                  };
                                                },
                                              ),
                                            }));
                                          },
                                        }),
                                        t.jsx("i", { children: "m" }),
                                      ],
                                    }),
                                  ],
                                }),
                                t.jsxs("label", {
                                  children: [
                                    t.jsx("span", { children: "中空高度" }),
                                    t.jsxs("div", {
                                      className: "unit-input",
                                      children: [
                                        t.jsx("input", {
                                          type: "number",
                                          min: "0",
                                          max: Math.max(
                                            0,
                                            R.height -
                                              heights.sectionOneHeight -
                                              0.1,
                                          ),
                                          step: "0.05",
                                          value: Number(
                                            heights.hollowHeight.toFixed(2),
                                          ),
                                          onChange: (event) =>
                                            updateHeights(
                                              heights.sectionOneHeight,
                                              event.target.value,
                                            ),
                                        }),
                                        t.jsx("i", { children: "m" }),
                                      ],
                                    }),
                                  ],
                                }),
                                t.jsxs("label", {
                                  children: [
                                    t.jsx("span", { children: "二段高度" }),
                                    t.jsxs("div", {
                                      className: "unit-input readonly",
                                      children: [
                                        t.jsx("output", {
                                          children:
                                            heights.sectionTwoHeight.toFixed(2),
                                        }),
                                        t.jsx("i", { children: "m" }),
                                      ],
                                    }),
                                  ],
                                }),
                                t.jsxs("label", {
                                  children: [
                                    t.jsx("span", { children: "二段深度" }),
                                    t.jsxs("div", {
                                      className: "unit-input",
                                      children: [
                                        t.jsx("input", {
                                          type: "number",
                                          min: "0.1",
                                          max: "4",
                                          step: "0.05",
                                          value: Number(
                                            normalizeCabinetUpperDepth(
                                              R.cabinetUpperDepth,
                                              lowerDepth,
                                            ).toFixed(2),
                                          ),
                                          onChange: (event) =>
                                            F((floor) => ({
                                              ...floor,
                                              furniture: floor.furniture.map(
                                                (item) =>
                                                  item.id === R.id
                                                    ? {
                                                        ...item,
                                                        cabinetUpperDepth:
                                                          normalizeCabinetUpperDepth(
                                                            event.target.value,
                                                            lowerDepth,
                                                          ),
                                                      }
                                                    : item,
                                              ),
                                            })),
                                        }),
                                        t.jsx("i", { children: "m" }),
                                      ],
                                    }),
                                  ],
                                }),
                              ],
                            });
                          })(),
                        R.kind === "cabinet" &&
                          t.jsxs("div", {
                            className: "cabinet-segment-editor",
                            children: [
                              t.jsxs("div", {
                                className: "cabinet-segment-editor-head",
                                children: [
                                  t.jsx("strong", { children: "柜体外轮廓边" }),
                                  t.jsx("span", {
                                    children: `${normalizeCabinetSegments(R.cabinetSegments, R.width, R.depth).length} 段`,
                                  }),
                                ],
                              }),
                              (() => {
                                const segments = normalizeCabinetSegments(
                                    R.cabinetSegments,
                                    R.width,
                                    R.depth,
                                  ),
                                  selectedIndex = Math.max(
                                    0,
                                    segments.findIndex(
                                      (segment) =>
                                        segment.id === selectedCabinetSegmentId,
                                    ),
                                  ),
                                  selectedSegment = segments[selectedIndex];
                                return t.jsxs("div", {
                                  className: "cabinet-selected-segment",
                                  children: [
                                    t.jsx("span", {
                                      children: "画布当前选中",
                                    }),
                                    t.jsx("b", {
                                      children: selectedSegment
                                        ? `边 ${selectedIndex + 1} · ${cabinetSegmentLength(selectedSegment).toFixed(2)} m${selectedSegment.isDoorFront ? " · 柜门面" : ""}`
                                        : "暂无线段",
                                    }),
                                  ],
                                });
                              })(),
                              t.jsxs("div", {
                                className: "cabinet-segment-actions",
                                children: [
                                  t.jsx("button", {
                                    type: "button",
                                    disabled: !normalizeCabinetSegments(
                                      R.cabinetSegments,
                                      R.width,
                                      R.depth,
                                    ).length,
                                    onClick: () => {
                                      const segments = normalizeCabinetSegments(
                                          R.cabinetSegments,
                                          R.width,
                                          R.depth,
                                        ),
                                        selectedId = segments.some(
                                          (segment) =>
                                            segment.id ===
                                            selectedCabinetSegmentId,
                                        )
                                          ? selectedCabinetSegmentId
                                          : segments[0]?.id,
                                        result = splitCabinetSegment(
                                          R.cabinetSegments,
                                          selectedId,
                                        );
                                      if (!result.ok) return;
                                      const bounds = cabinetLayoutBounds(
                                        result.segments,
                                        R.cabinetDepth ?? R.depth,
                                      );
                                      F((project) => ({
                                        ...project,
                                        furniture: project.furniture.map(
                                          (item) =>
                                            item.id === R.id
                                              ? {
                                                  ...item,
                                                  cabinetSegments:
                                                    result.segments,
                                                  width: bounds.width,
                                                  depth: bounds.depth,
                                                }
                                              : item,
                                        ),
                                      }));
                                      setSelectedCabinetSegmentId(
                                        result.selectedId,
                                      );
                                    },
                                    children: "拆分所选边",
                                  }),
                                  t.jsx("button", {
                                    type: "button",
                                    onClick: () => {
                                      const result =
                                        mergeCollinearCabinetSegments(
                                          R.cabinetSegments,
                                        );
                                      if (!result.ok) return;
                                      const bounds = cabinetLayoutBounds(
                                        result.segments,
                                        R.cabinetDepth ?? R.depth,
                                      );
                                      F((project) => ({
                                        ...project,
                                        furniture: project.furniture.map(
                                          (item) =>
                                            item.id === R.id
                                              ? {
                                                  ...item,
                                                  cabinetSegments:
                                                    result.segments,
                                                  width: bounds.width,
                                                  depth: bounds.depth,
                                                }
                                              : item,
                                        ),
                                      }));
                                      setSelectedCabinetSegmentId(
                                        result.segments[0]?.id,
                                      );
                                    },
                                    children: "合并共线边",
                                  }),
                                  t.jsx("button", {
                                    type: "button",
                                    onClick: () => {
                                      const segments = normalizeCabinetSegments(
                                          R.cabinetSegments,
                                          R.width,
                                          R.depth,
                                        ),
                                        selectedId = segments.some(
                                          (segment) =>
                                            segment.id ===
                                            selectedCabinetSegmentId,
                                        )
                                          ? selectedCabinetSegmentId
                                          : segments[0]?.id;
                                      if (!selectedId) return;
                                      F((project) => ({
                                        ...project,
                                        furniture: project.furniture.map(
                                          (item) =>
                                            item.id === R.id
                                              ? {
                                                  ...item,
                                                  cabinetSegments:
                                                    setCabinetDoorFront(
                                                      item.cabinetSegments,
                                                      selectedId,
                                                    ),
                                                }
                                              : item,
                                        ),
                                      }));
                                    },
                                    children: "设为柜门面",
                                  }),
                                ],
                              }),
                              t.jsx("p", {
                                children:
                                  "直接点击柜体外轮廓边进行选择；可把任意边设为柜门面。拖动角点或整边时会自动吸附并高亮提示平行、垂直关系。",
                              }),
                            ],
                          }),
                        t.jsxs("label", {
                          children: [
                            t.jsx("span", { children: "旋转" }),
                            t.jsxs("div", {
                              className: "unit-input",
                              children: [
                                t.jsx("input", {
                                  type: "number",
                                  step: Dc,
                                  value: Number(
                                    ((R.rotation * 180) / Math.PI).toFixed(1),
                                  ),
                                  onChange: (e) =>
                                    F((n) => ({
                                      ...n,
                                      furniture: n.furniture.map((a) =>
                                        a.id === R.id
                                          ? {
                                              ...a,
                                              rotation:
                                                (Number(e.target.value) *
                                                  Math.PI) /
                                                180,
                                            }
                                          : a,
                                      ),
                                    })),
                                }),
                                t.jsx("i", { children: "°" }),
                              ],
                            }),
                          ],
                        }),
                        t.jsxs("label", {
                          children: [
                            t.jsx("span", { children: "所属房间" }),
                            t.jsxs(ns, {
                              value: R.roomId ?? "",
                              onChange: (e) =>
                                F((n) => ({
                                  ...n,
                                  furniture: n.furniture.map((a) =>
                                    a.id === R.id
                                      ? {
                                          ...a,
                                          roomId: e.target.value || void 0,
                                        }
                                      : a,
                                  ),
                                })),
                              children: [
                                t.jsx("option", {
                                  value: "",
                                  children: "未指定",
                                }),
                                b.rooms.map((e) =>
                                  t.jsx(
                                    "option",
                                    { value: e.id, children: e.name },
                                    e.id,
                                  ),
                                ),
                              ],
                            }),
                          ],
                        }),
                      ],
                    }),
                    t.jsx(VerticalReferenceEditor, {
                      floor: b,
                      type: "furniture",
                      item: R,
                      entities: i,
                      onChange: (verticalReference) =>
                        F((floor) => ({
                          ...floor,
                          furniture: floor.furniture.map((item) =>
                            item.id === R.id
                              ? { ...item, verticalReference }
                              : item,
                          ),
                        })),
                    }),
                    t.jsxs("button", {
                      className: "danger-button",
                      onClick: ts,
                      children: [
                        t.jsx(Et, { size: 16 }),
                        "删除",
                        R.name ?? gt[R.kind]?.label ?? "自定义家具",
                      ],
                    }),
                  ],
                }),
              J &&
                t.jsxs("div", {
                  className: "property-stack",
                  children: [
                    t.jsxs("div", {
                      className: "room-area-readout",
                      children: [
                        t.jsx("span", { children: "房间面积" }),
                        t.jsxs("strong", {
                          children: [ri(J.polygon).toFixed(2), " m²"],
                        }),
                      ],
                    }),
                    t.jsxs("div", {
                      className: "property-section",
                      children: [
                        t.jsx("h3", { children: "房间信息" }),
                        t.jsxs("label", {
                          children: [
                            t.jsx("span", { children: "名称" }),
                            t.jsx("input", {
                              type: "text",
                              value: J.name,
                              onChange: (e) =>
                                F((n) => ({
                                  ...n,
                                  rooms: n.rooms.map((a) =>
                                    a.id === J.id
                                      ? { ...a, name: e.target.value }
                                      : a,
                                  ),
                                })),
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              w &&
                t.jsxs("div", {
                  className: "property-stack device-property-stack",
                  children: [
                    t.jsxs("div", {
                      className: `device-summary editor-device-summary ${Aa}`,
                      children: [
                        t.jsx("span", { className: `entity-state-dot ${Aa}` }),
                        t.jsxs("div", {
                          className: "device-summary-copy",
                          children: [
                            t.jsx(DeviceBindingPicker, {key:w.id,placement:w,floor:b,entities:i,onChange:entity=>{
                              setCurtainSession(null);
                              F(floor=>({...floor,devices:floor.devices.map(device=>device.id!==w.id?device:replaceDevicePlacement(device,entity,resolveBoundDevicePresentation(entity,device.modelId),hi(entity)))}));
                              B(entity.entityId);
                            }}),
                            t.jsx("small", {
                              children: q
                                ? `${(Je == null ? void 0 : Je.name) ?? "未指定房间"} · ${ls(q)}`
                                : `${w.kind} · 未连接`,
                            }),
                          ],
                        }),
                      ],
                    }),
                    selectedDeviceCount >= 2 &&
                      t.jsxs("div", {
                        className:
                          "property-section device-arrangement-control",
                        children: [
                          t.jsxs("div", {
                            className: "device-arrangement-heading",
                            children: [
                              t.jsx("h3", { children: "设备排列" }),
                              t.jsx("strong", {
                                children: `已选 ${selectedDeviceCount} 个`,
                              }),
                            ],
                          }),
                          t.jsx("button", {
                            type: "button",
                            className: "device-arrangement-button",
                            disabled:
                              selectedDeviceCount < 3 ||
                              !(
                                selectedDeviceLine != null &&
                                selectedDeviceLine.ok
                              ),
                            onClick: () =>
                              arrangeSelectedDevices(
                                selectedDeviceLine != null &&
                                  selectedDeviceLine.ok &&
                                  selectedDeviceLine.aligned
                                  ? "distribute"
                                  : "align",
                              ),
                            children:
                              selectedDeviceCount < 3
                                ? "至少选择 3 个设备"
                                : selectedDeviceLine != null &&
                                    selectedDeviceLine.ok &&
                                    selectedDeviceLine.aligned
                                  ? "等距排放"
                                  : "排列到同一直线",
                          }),
                          t.jsx("p", {
                            className: "field-hint",
                            children:
                              selectedDeviceCount < 3
                                ? "继续按住 Shift 选择设备后即可排列。"
                                : selectedDeviceLine != null &&
                                    selectedDeviceLine.ok &&
                                    selectedDeviceLine.aligned
                                  ? "保持两端设备不动，将中间设备等距排列。"
                                  : selectedDeviceLine != null &&
                                      selectedDeviceLine.reason ===
                                        "overlapping-devices"
                                    ? "设备位置重叠，移动其中一个设备后再试。"
                                    : "以相距最远的两个设备为端点，将其他设备投影到直线上。",
                          }),
                        ],
                      }),
                    q &&
                      q.deviceTemplateId &&
                      t.jsx("div", {
                        className: "property-section device-model-property",
                        children: t.jsx(BoundDeviceType, { entity: q }),
                      }),
                    q &&
                      !q.deviceTemplateId &&
                      te &&
                      xo.length > 1 &&
                      t.jsx("div", {
                        className: "property-section device-model-property",
                        children: t.jsx(_r, {
                          entity: q,
                          activeModelId: te.id,
                          onSelect: wo,
                        }),
                      }),
                    q?.domain === "camera" && t.jsx(CameraSettings,{placement:w,modelId:te?.id,entity:q,entities:i,onChange:settings=>F(floor=>({...floor,devices:floor.devices.map(device=>device.id===w.id?{...device,cameraSettings:settings}:device)}))}),
                    q && t.jsx(fl, { compact: !0, entity: q }),
                    qs !== void 0 && !Ca &&
                      t.jsxs("div", {
                        className: "property-section device-scale-property",
                        children: [
                          t.jsx("h3", { children: "模型缩放" }),
                          t.jsxs("label", {
                            className: "range-field",
                            children: [
                              t.jsxs("span", {
                                children: [
                                  "整体比例 ",
                                  t.jsxs("b", { children: [qs, "%"] }),
                                ],
                              }),
                              t.jsx("input", {
                                type: "range",
                                min: yi,
                                max: vi,
                                step: "5",
                                value: qs,
                                onChange: (e) => ea(Number(e.target.value)),
                              }),
                            ],
                          }),
                          t.jsxs("label", {
                            children: [
                              t.jsx("span", { children: "比例" }),
                              t.jsxs("div", {
                                className: "unit-input",
                                children: [
                                  t.jsx("input", {
                                    type: "number",
                                    min: yi,
                                    max: vi,
                                    step: "5",
                                    value: qs,
                                    onChange: (e) => ea(Number(e.target.value)),
                                  }),
                                  t.jsx("i", { children: "%" }),
                                ],
                              }),
                            ],
                          }),
                          t.jsx("p", {
                            className: "field-hint",
                            children:
                              "按当前模型默认尺寸等比缩放；灯带仍通过长度/路径控制。",
                          }),
                        ],
                      }),
                    Da &&
                      t.jsxs("div", {
                        className:
                          "property-section switch-light-group-property",
                        children: [
                          t.jsxs("div", {
                            className: "switch-light-group-heading",
                            children: [
                              t.jsxs("span", {
                                children: [t.jsx(xl, { size: 15 }), "普通灯组"],
                              }),
                              t.jsx("strong", {
                                children: Zs.length
                                  ? `${Zs.length} 个灯位 · ${el}`
                                  : "未添加灯位",
                              }),
                            ],
                          }),
                          t.jsx("div", {
                            className: "switch-light-group-actions",
                            children: t.jsxs("button", {
                              type: "button",
                              className: Qs ? "active" : "",
                              onClick: () => Zt(Qs ? void 0 : w.id),
                              children: [
                                t.jsx(Ka, { size: 15 }),
                                Qs ? "完成添加" : "添加灯具",
                              ],
                            }),
                          }),
                          Qs &&
                            t.jsx("p", {
                              className: "field-hint active",
                              children:
                                "在户型图中点击即可连续添加普通灯位；这些灯位不绑定 HA 实体，状态跟随当前智能开关。",
                            }),
                          t.jsxs("div", {
                            className: "switch-light-group-list",
                            "aria-label": "开关控制的普通灯具",
                            children: [
                              Zs.map((e, n) => {
                                var N;
                                const a = b.rooms.find(
                                    (m) => m.id === e.roomId,
                                  ),
                                  r = e.modelId ?? "light.downlight",
                                  l =
                                    ((N = Nr.find((m) => m.id === r)) == null
                                      ? void 0
                                      : N.label) ?? "筒灯/射灯",
                                  h = we(r),
                                  u = h ? Yc(e) : 0,
                                  p = h ? Uc(e) : 0;
                                return t.jsxs(
                                  "div",
                                  {
                                    className: `switch-light-fixture-row ${h ? "strip-editing" : ""}`,
                                    children: [
                                      t.jsx(Jr, { modelId: r }),
                                      t.jsxs("div", {
                                        className: "switch-light-fixture-main",
                                        children: [
                                          t.jsxs("div", {
                                            className:
                                              "switch-light-fixture-top",
                                            children: [
                                              t.jsxs("strong", {
                                                children: [
                                                  e.label ?? `灯具 ${n + 1}`,
                                                  t.jsx("em", { children: l }),
                                                ],
                                              }),
                                              t.jsx(ns, {
                                                value: r,
                                                onChange: (m) =>
                                                  So(e.id, m.target.value),
                                                "aria-label": `${e.label ?? `灯具 ${n + 1}`}类型`,
                                                children: Nr.map((m) =>
                                                  t.jsx(
                                                    "option",
                                                    {
                                                      value: m.id,
                                                      children: m.label,
                                                    },
                                                    m.id,
                                                  ),
                                                ),
                                              }),
                                            ],
                                          }),
                                          t.jsxs("small", {
                                            children: [
                                              (a == null ? void 0 : a.name) ??
                                                "未指定房间",
                                              " · X ",
                                              e.position[0].toFixed(2),
                                              " / Y ",
                                              e.position[2].toFixed(2),
                                            ],
                                          }),
                                          h &&
                                            t.jsxs("div", {
                                              className:
                                                "switch-light-strip-controls",
                                              children: [
                                                t.jsxs("div", {
                                                  className:
                                                    "switch-light-strip-field",
                                                  children: [
                                                    t.jsx("span", {
                                                      children: "长",
                                                    }),
                                                    t.jsx("input", {
                                                      type: "number",
                                                      min: ft,
                                                      max: "50",
                                                      step: "0.1",
                                                      value: Number(
                                                        u.toFixed(2),
                                                      ),
                                                      onChange: (m) =>
                                                        ko(
                                                          e.id,
                                                          Number(
                                                            m.target.value,
                                                          ),
                                                        ),
                                                      "aria-label": `${e.label ?? `灯具 ${n + 1}`}灯带长度`,
                                                    }),
                                                    t.jsx("i", {
                                                      children: "m",
                                                    }),
                                                  ],
                                                }),
                                                t.jsxs("div", {
                                                  className:
                                                    "switch-light-strip-field",
                                                  children: [
                                                    t.jsx("span", {
                                                      children: "角",
                                                    }),
                                                    t.jsx("input", {
                                                      type: "number",
                                                      step: "5",
                                                      value: Math.round(p),
                                                      onChange: (m) =>
                                                        Co(
                                                          e.id,
                                                          Number(
                                                            m.target.value,
                                                          ),
                                                        ),
                                                      "aria-label": `${e.label ?? `灯具 ${n + 1}`}灯带角度`,
                                                    }),
                                                    t.jsx("i", {
                                                      children: "°",
                                                    }),
                                                  ],
                                                }),
                                              ],
                                            }),
                                        ],
                                      }),
                                      t.jsx("button", {
                                        type: "button",
                                        onClick: () => $o(e.id),
                                        "aria-label": `删除${e.label ?? `灯具 ${n + 1}`}`,
                                        children: t.jsx(Et, { size: 14 }),
                                      }),
                                    ],
                                  },
                                  e.id,
                                );
                              }),
                              !Zs.length &&
                                t.jsx("p", {
                                  className: "empty-library",
                                  children:
                                    "点击“添加灯具”，再到图中点选筒灯、平板灯等普通灯位的位置。",
                                }),
                            ],
                          }),
                          t.jsx("p", {
                            className: "field-hint",
                            children:
                              "全屋视图中点击任意普通灯位，会打开这个智能开关的控制面板；开关状态会同步到整组灯位显示。",
                          }),
                        ],
                      }),
                    ka &&
                      Hn &&
                      t.jsxs("div", {
                        className: "property-section tv-size-property",
                        children: [
                          t.jsx("h3", { children: "屏幕尺寸" }),
                          t.jsxs("label", {
                            children: [
                              t.jsx("span", { children: "宽度" }),
                              t.jsxs("div", {
                                className: "unit-input",
                                children: [
                                  t.jsx("input", {
                                    type: "number",
                                    min: rr,
                                    max: or,
                                    step: "0.05",
                                    value: xt(Hn.width),
                                    onChange: (e) =>
                                      sa("width", Number(e.target.value)),
                                  }),
                                  t.jsx("i", { children: "m" }),
                                ],
                              }),
                            ],
                          }),
                          t.jsxs("label", {
                            children: [
                              t.jsx("span", { children: "高度" }),
                              t.jsxs("div", {
                                className: "unit-input",
                                children: [
                                  t.jsx("input", {
                                    type: "number",
                                    min: lr,
                                    max: cr,
                                    step: "0.05",
                                    value: xt(Hn.height),
                                    onChange: (e) =>
                                      sa("height", Number(e.target.value)),
                                  }),
                                  t.jsx("i", { children: "m" }),
                                ],
                              }),
                            ],
                          }),
                        ],
                      }),
                    ['cover.curtain','cover.sheer'].includes(te?.id) && w && t.jsx(CurtainTrackEditor,{key:w.id,device:w,floor:b,session:curtainSession,setSession:setCurtainSession,onBegin:()=>{We('select');$i('2d');},onApply:track=>F(floor=>applyCurtainTrackToFloor(floor,w.id,track))}),
                    Ca && !['cover.curtain','cover.sheer'].includes(te?.id) &&
                      zn &&
                      t.jsxs("div", {
                        className: "property-section curtain-size-property",
                        children: [
                          t.jsx("h3", { children: "窗帘尺寸" }),
                          t.jsxs("label", {
                            children: [
                              t.jsx("span", { children: "宽度" }),
                              t.jsxs("div", {
                                className: "unit-input",
                                children: [
                                  t.jsx("input", {
                                    type: "number",
                                    min: dr,
                                    max: hr,
                                    step: "0.05",
                                    value: xt(zn.width),
                                    onChange: (e) =>
                                      na("width", Number(e.target.value)),
                                  }),
                                  t.jsx("i", { children: "m" }),
                                ],
                              }),
                            ],
                          }),
                          t.jsxs("label", {
                            children: [
                              t.jsx("span", { children: "高度" }),
                              t.jsxs("div", {
                                className: "unit-input",
                                children: [
                                  t.jsx("input", {
                                    type: "number",
                                    min: pr,
                                    max: ur,
                                    step: "0.05",
                                    value: xt(zn.height),
                                    onChange: (e) =>
                                      na("height", Number(e.target.value)),
                                  }),
                                  t.jsx("i", { children: "m" }),
                                ],
                              }),
                            ],
                          }),
                        ],
                      }),
                    Ia &&
                      Gs &&
                      t.jsxs("div", {
                        className: "property-section central-ac-size-property",
                        children: [
                          t.jsx("h3", { children: "风管机尺寸" }),
                          t.jsxs("label", {
                            children: [
                              t.jsx("span", { children: "宽度" }),
                              t.jsxs("div", {
                                className: "unit-input",
                                children: [
                                  t.jsx("input", {
                                    type: "number",
                                    min: mr,
                                    max: fr,
                                    step: "0.05",
                                    value: xt(Gs.width),
                                    onChange: (e) =>
                                      In("width", Number(e.target.value)),
                                  }),
                                  t.jsx("i", { children: "m" }),
                                ],
                              }),
                            ],
                          }),
                          t.jsxs("label", {
                            children: [
                              t.jsx("span", { children: "深度" }),
                              t.jsxs("div", {
                                className: "unit-input",
                                children: [
                                  t.jsx("input", {
                                    type: "number",
                                    min: jr,
                                    max: yr,
                                    step: "0.05",
                                    value: xt(Gs.depth),
                                    onChange: (e) =>
                                      In("depth", Number(e.target.value)),
                                  }),
                                  t.jsx("i", { children: "m" }),
                                ],
                              }),
                            ],
                          }),
                          t.jsxs("label", {
                            children: [
                              t.jsx("span", { children: "机身厚度" }),
                              t.jsxs("div", {
                                className: "unit-input",
                                children: [
                                  t.jsx("input", {
                                    type: "number",
                                    min: xr,
                                    max: gr,
                                    step: "0.02",
                                    value: xt(Gs.thickness),
                                    onChange: (e) =>
                                      In("thickness", Number(e.target.value)),
                                  }),
                                  t.jsx("i", { children: "m" }),
                                ],
                              }),
                            ],
                          }),
                          t.jsx("p", {
                            className: "field-hint",
                            children:
                              "角度在“朝向”中调节；出风口沿设备本地前侧水平送风。",
                          }),
                        ],
                      }),
                    pt &&
                      On !== void 0 &&
                      t.jsxs("div", {
                        className: "property-section light-strip-property",
                        children: [
                          t.jsx("h3", { children: "灯带" }),
                          Rn
                            ? t.jsxs(t.Fragment, {
                                children: [
                                  t.jsxs("label", {
                                    children: [
                                      t.jsx("span", { children: "形状" }),
                                      t.jsx("input", {
                                        type: "text",
                                        value: Jo,
                                        readOnly: !0,
                                      }),
                                    ],
                                  }),
                                  t.jsxs("label", {
                                    children: [
                                      t.jsx("span", { children: "端点" }),
                                      t.jsx("input", {
                                        type: "text",
                                        value: `${Qo} 个`,
                                        readOnly: !0,
                                      }),
                                    ],
                                  }),
                                  t.jsxs("label", {
                                    children: [
                                      t.jsx("span", { children: "总长" }),
                                      t.jsxs("div", {
                                        className: "unit-input",
                                        children: [
                                          t.jsx("input", {
                                            type: "number",
                                            value: Number(On.toFixed(2)),
                                            readOnly: !0,
                                          }),
                                          t.jsx("i", { children: "m" }),
                                        ],
                                      }),
                                    ],
                                  }),
                                ],
                              })
                            : t.jsxs(t.Fragment, {
                                children: [
                                  t.jsxs("label", {
                                    children: [
                                      t.jsx("span", { children: "长度" }),
                                      t.jsxs("div", {
                                        className: "unit-input",
                                        children: [
                                          t.jsx("input", {
                                            type: "number",
                                            min: ft,
                                            max: "50",
                                            step: "0.1",
                                            value: Number(On.toFixed(2)),
                                            onChange: (e) =>
                                              No(Number(e.target.value)),
                                          }),
                                          t.jsx("i", { children: "m" }),
                                        ],
                                      }),
                                    ],
                                  }),
                                  Ea !== void 0 &&
                                    t.jsxs("label", {
                                      children: [
                                        t.jsx("span", { children: "角度" }),
                                        t.jsxs("div", {
                                          className: "unit-input",
                                          children: [
                                            t.jsx("input", {
                                              type: "number",
                                              step: "5",
                                              value: Math.round(Ea),
                                              onChange: (e) =>
                                                ta(Number(e.target.value)),
                                            }),
                                            t.jsx("i", { children: "°" }),
                                          ],
                                        }),
                                      ],
                                    }),
                                ],
                              }),
                        ],
                      }),
                    t.jsxs("div", {
                      className: "property-section",
                      children: [
                        t.jsx("h3", { children: "位置" }),
                        _a !== void 0 &&
                          t.jsxs("label", {
                            children: [
                              t.jsx("span", { children: "旋转" }),
                              t.jsxs("div", {
                                className: "unit-input",
                                children: [
                                  t.jsx("input", {
                                    type: "number",
                                    step: "5",
                                    value: Math.round(_a),
                                    onChange: (e) => ta(Number(e.target.value)),
                                  }),
                                  t.jsx("i", { children: "°" }),
                                ],
                              }),
                            ],
                          }),
                        [0, 2].map((e) =>
                          t.jsxs(
                            "label",
                            {
                              children: [
                                t.jsx("span", {
                                  children:
                                    e === 0 ? "X" : e === 2 ? "Y" : "高度",
                                }),
                                t.jsxs("div", {
                                  className: "unit-input",
                                  children: [
                                    t.jsx("input", {
                                      type: "number",
                                      step: "0.1",
                                      value: xt(w.position[e]),
                                      onChange: (n) =>
                                        F((a) => ({
                                          ...a,
                                          devices: a.devices.map((r) => {
                                            var p;
                                            if (r.id !== w.id) return r;
                                            const l = [...r.position];
                                            l[e] = Ie(
                                              Number(n.target.value),
                                              r.position[e],
                                              e === 1 ? 0 : -200,
                                              e === 1 ? a.height : 200,
                                            );
                                            const h = [l[0], l[2]],
                                              u =
                                                e === 0
                                                  ? [l[0] - r.position[0], 0]
                                                  : e === 2
                                                    ? [0, l[2] - r.position[2]]
                                                    : [0, 0];
                                            return an(
                                              {
                                                ...r,
                                                position: l,
                                                roomId:
                                                  (p = a.rooms.find((N) =>
                                                    _e(h, N.polygon),
                                                  )) == null
                                                    ? void 0
                                                    : p.id,
                                              },
                                              u,
                                            );
                                          }),
                                        })),
                                    }),
                                    t.jsx("i", { children: "m" }),
                                  ],
                                }),
                              ],
                            },
                            e,
                          ),
                        ),
                      ],
                    }),
                    !["cover.curtain","cover.sheer"].includes(te?.id) && t.jsx(VerticalReferenceEditor, {
                      floor: b,
                      type: "device",
                      item: w,
                      entities: i,
                      onChange: (verticalReference) =>
                        F((floor) => ({
                          ...floor,
                          devices: floor.devices.map((item) =>
                            item.id === w.id
                              ? { ...item, verticalReference }
                              : item,
                          ),
                        })),
                    }),
                    t.jsxs("button", {
                      className: "danger-button",
                      onClick: ts,
                      children: [t.jsx(Et, { size: 16 }), "移除设备"],
                    }),
                  ],
                }),
              !D &&
                t.jsxs("div", {
                  className: "property-stack",
                  children: [
                    t.jsxs("div", {
                      className: "property-section project-basic-section",
                      children: [
                        t.jsx("h3", { children: "基础信息" }),
                        t.jsxs("label", {
                          children: [
                            t.jsx("span", { children: "名称" }),
                            t.jsx("input", {
                              type: "text",
                              maxLength: 80,
                              value: P.name,
                              placeholder: "输入全屋名称",
                              onChange: (e) => Ji(e.target.value),
                            }),
                          ],
                        }),
                      ],
                    }),
                    t.jsxs("section", {
                      className: `editor-guidance-card ${Js.tone === "light-strip" ? "light-strip" : ""}`,
                      "aria-label": "编辑建议",
                      children: [
                        t.jsxs("div", {
                          children: [
                            t.jsx("small", {
                              children:
                                (ut == null ? void 0 : ut.label) ?? "编辑",
                            }),
                            t.jsx("strong", { children: Js.title }),
                          ],
                        }),
                        t.jsx("p", { children: Js.body }),
                        t.jsx("ol", {
                          children: Js.steps.map((e, n) =>
                            t.jsxs(
                              "li",
                              {
                                children: [
                                  t.jsx("span", { children: n + 1 }),
                                  e,
                                ],
                              },
                              e,
                            ),
                          ),
                        }),
                      ],
                    }),
                    t.jsxs("button", {
                      className: "section-toggle",
                      onClick: () => oo((e) => !e),
                      "aria-expanded": yn,
                      children: [
                        t.jsxs("span", {
                          children: [t.jsx(Or, { size: 17 }), "参考底图"],
                        }),
                        t.jsx(Ua, { size: 17, className: yn ? "rotate" : "" }),
                      ],
                    }),
                    yn &&
                      t.jsxs("div", {
                        className: "property-section blueprint-section",
                        children: [
                          t.jsxs("label", {
                            className: "upload-zone",
                            children: [
                              t.jsx(nn, { size: 21 }),
                              t.jsx("strong", {
                                children: C ? "更换户型底图" : "导入户型底图",
                              }),
                              t.jsx("small", {
                                children: "PNG / JPG / WebP，最大 15 MB",
                              }),
                              t.jsx("input", {
                                type: "file",
                                accept: "image/png,image/jpeg,image/webp",
                                onChange: (e) => {
                                  var n;
                                  return void ja(
                                    (n = e.target.files) == null
                                      ? void 0
                                      : n[0],
                                  );
                                },
                              }),
                            ],
                          }),
                          C &&
                            t.jsxs(t.Fragment, {
                              children: [
                                t.jsxs("div", {
                                  className: "blueprint-file",
                                  children: [
                                    t.jsx(Xa, { size: 15 }),
                                    t.jsx("span", { children: C.name }),
                                  ],
                                }),
                                t.jsxs("label", {
                                  className: "range-field",
                                  children: [
                                    t.jsxs("span", {
                                      children: [
                                        "底图透明度 ",
                                        t.jsxs("b", { children: [At, "%"] }),
                                      ],
                                    }),
                                    t.jsx("input", {
                                      type: "range",
                                      min: "10",
                                      max: "85",
                                      value: At,
                                      onChange: (e) =>
                                        ya(Number(e.target.value)),
                                    }),
                                  ],
                                }),
                                t.jsxs("label", {
                                  className: "range-field",
                                  children: [
                                    t.jsxs("span", {
                                      children: [
                                        "底图比例 ",
                                        t.jsxs("b", { children: [Ft, "%"] }),
                                      ],
                                    }),
                                    t.jsx("input", {
                                      type: "range",
                                      min: "40",
                                      max: "200",
                                      step: "5",
                                      value: Ft,
                                      onChange: (e) =>
                                        va(Number(e.target.value)),
                                    }),
                                  ],
                                }),
                                t.jsxs("div", {
                                  className: "calibration-tool",
                                  children: [
                                    t.jsxs("div", {
                                      className: "calibration-heading",
                                      children: [
                                        t.jsxs("span", {
                                          children: [
                                            t.jsx(sn, { size: 16 }),
                                            "比例尺标定",
                                          ],
                                        }),
                                        t.jsx("b", {
                                          className: St ? "calibrated" : "",
                                          children: St
                                            ? `${St.toFixed(2)} m`
                                            : "未标定",
                                        }),
                                      ],
                                    }),
                                    t.jsxs("button", {
                                      className: `calibration-start-button ${L === "calibrate" ? "active" : ""}`,
                                      onClick: Cn,
                                      children: [
                                        t.jsx(sn, { size: 16 }),
                                        Q && be
                                          ? "重新选择标定线"
                                          : "在底图上选择标定线",
                                      ],
                                    }),
                                    Q &&
                                      be &&
                                      t.jsxs(t.Fragment, {
                                        children: [
                                          t.jsxs("label", {
                                            className:
                                              "calibration-length-field",
                                            children: [
                                              t.jsx("span", {
                                                children: "实际长度",
                                              }),
                                              t.jsxs("div", {
                                                className: "unit-input",
                                                children: [
                                                  t.jsx("input", {
                                                    "aria-label":
                                                      "标定线实际长度",
                                                    type: "number",
                                                    min: "0.05",
                                                    max: "1000",
                                                    step: "0.1",
                                                    value: Ge,
                                                    onChange: (e) =>
                                                      ms(
                                                        Number(e.target.value),
                                                      ),
                                                  }),
                                                  t.jsx("i", { children: "m" }),
                                                ],
                                              }),
                                            ],
                                          }),
                                          t.jsxs("div", {
                                            className: "calibration-apply-row",
                                            children: [
                                              t.jsxs("small", {
                                                children: [
                                                  "图上 ",
                                                  X(Q, be).toFixed(2),
                                                  " m",
                                                ],
                                              }),
                                              t.jsx("button", {
                                                onClick: ba,
                                                disabled: Ge <= 0,
                                                children: "应用比例尺",
                                              }),
                                            ],
                                          }),
                                        ],
                                      }),
                                  ],
                                }),
                              ],
                            }),
                        ],
                      }),
                    t.jsxs("div", {
                      className: "property-section",
                      children: [
                        t.jsx("h3", { children: "楼层" }),
                        t.jsxs("label", {
                          children: [
                            t.jsx("span", { children: "名称" }),
                            t.jsx("input", {
                              type: "text",
                              value: b.name,
                              onChange: (e) =>
                                F((n) => ({ ...n, name: e.target.value })),
                            }),
                          ],
                        }),
                        t.jsxs("label", {
                          children: [
                            t.jsx("span", { children: "层高" }),
                            t.jsxs("div", {
                              className: "unit-input",
                              children: [
                                t.jsx("input", {
                                  type: "number",
                                  min: "2",
                                  max: "6",
                                  step: "0.1",
                                  value: b.height,
                                  onChange: (e) =>
                                    F((n) =>
                                      resizeFloorHeight(n, e.target.value),
                                    ),
                                }),
                                t.jsx("i", { children: "m" }),
                              ],
                            }),
                          ],
                        }),
                        t.jsxs("label", {
                          children: [
                            t.jsx("span", { children: "参考楼层" }),
                            t.jsxs(ns, {
                              value: Le,
                              onChange: (e) => Y(e.target.value),
                              children: [
                                t.jsx("option", {
                                  value: "",
                                  children: "不显示",
                                }),
                                P.floors
                                  .filter((e) => e.id !== b.id)
                                  .map((e) =>
                                    t.jsx(
                                      "option",
                                      { value: e.id, children: e.name },
                                      e.id,
                                    ),
                                  ),
                              ],
                            }),
                          ],
                        }),
                        t.jsxs("div", {
                          className: "floor-actions",
                          children: [
                            t.jsxs("button", {
                              onClick: () => da(!0),
                              children: [t.jsx(Il, { size: 15 }), "复制当前层"],
                            }),
                            t.jsxs("button", {
                              className: "subtle-danger",
                              disabled: P.floors.length <= 1,
                              onClick: Ko,
                              children: [t.jsx(Et, { size: 15 }), "删除楼层"],
                            }),
                          ],
                        }),
                      ],
                    }),
                    t.jsxs("div", {
                      className: "property-section project-data-section",
                      children: [
                        t.jsx("h3", { children: "项目数据" }),
                        t.jsx("input", {
                          ref: Nn,
                          className: "project-import-input",
                          type: "file",
                          accept: "application/json,.json",
                          onChange: (e) => {
                            var n;
                            (Xo((n = e.target.files) == null ? void 0 : n[0]),
                              (e.currentTarget.value = ""));
                          },
                        }),
                        t.jsxs("div", {
                          className: "project-data-actions",
                          children: [
                            t.jsxs("button", {
                              onClick: () => {
                                var e;
                                return (e = Nn.current) == null
                                  ? void 0
                                  : e.click();
                              },
                              children: [
                                t.jsx(nn, { size: 15 }),
                                "导入完整备份",
                              ],
                            }),
                            t.jsxs("button", {
                              onClick: () => void pa(),
                              children: [
                                t.jsx(qa, { size: 15 }),
                                "导出完整备份",
                              ],
                            }),
                          ],
                        }),
                        t.jsxs("button", {
                          className: "backup-toggle",
                          onClick: () => void ua(),
                          children: [t.jsx(Za, { size: 15 }), "最近备份"],
                        }),
                        Ci &&
                          t.jsx("div", {
                            className: "backup-list",
                            children: Ps.length
                              ? Ps.map((e) =>
                                  t.jsxs(
                                    "button",
                                    {
                                      onClick: () => void ma(e),
                                      children: [
                                        t.jsx("span", {
                                          children: new Date(
                                            e.createdAt,
                                          ).toLocaleString(),
                                        }),
                                        t.jsx("small", { children: "恢复" }),
                                      ],
                                    },
                                    e.id,
                                  ),
                                )
                              : t.jsx("p", { children: "尚无可恢复的备份。" }),
                          }),
                        t.jsx("button", {
                          className: "subtle-danger project-reset",
                          onClick: () => void fa(),
                          children: "重置当前户型",
                        }),
                        wt &&
                          t.jsx("p", {
                            className: "save-error-message",
                            role: "status",
                            children: wt,
                          }),
                      ],
                    }),
                    t.jsxs("div", {
                      className: "property-section binding-section",
                      children: [
                        t.jsx("h3", { children: "Home Assistant 房间绑定" }),
                        t.jsxs("button", {
                          className: "binding-refresh",
                          onClick: () => void xa(),
                          children: [t.jsx(on, { size: 15 }), "Area 绑定建议"],
                        }),
                        Ei &&
                          t.jsx("div", {
                            className: "binding-suggestion-list",
                            children: Ds.length
                              ? Ds.map((e) => {
                                  const n = `${e.floorId}:${e.roomId}`,
                                    a = e.entityIds
                                      .map((r) => {
                                        var l;
                                        return (
                                          ((l = i[r]) == null
                                            ? void 0
                                            : l.name) ?? r
                                        );
                                      })
                                      .join("、");
                                  return t.jsxs(
                                    "div",
                                    {
                                      children: [
                                        t.jsxs("div", {
                                          children: [
                                            t.jsx("strong", {
                                              children: e.roomName,
                                            }),
                                            t.jsxs("small", {
                                              children: [e.areaName, " · ", a],
                                            }),
                                          ],
                                        }),
                                        t.jsx("button", {
                                          disabled: As === n,
                                          onClick: () => void ga(e),
                                          children:
                                            As === n ? "绑定中" : "应用",
                                        }),
                                      ],
                                    },
                                    `${n}:${e.areaId}`,
                                  );
                                })
                              : t.jsx("p", {
                                  children:
                                    "没有可用建议，已绑定的设备不会被覆盖。",
                                }),
                          }),
                      ],
                    }),
                  ],
                }),
              t.jsxs("div", {
                className: `furniture-library ${L === "furniture" ? "visible" : ""}`,
                children: [
                  t.jsxs("div", {
                    className: "library-heading",
                    children: [
                      t.jsxs("div", {
                        children: [
                          t.jsx(Rr, { size: 17 }),
                          t.jsx("strong", { children: "家具" }),
                        ],
                      }),
                      t.jsx("small", { children: "二维布置 · 3D 预览" }),
                    ],
                  }),
                  t.jsx("div", {
                    className: "furniture-library-grid",
                    children: [
                      ...wr.map((e) => {
                        const n = gt[e];
                        return t.jsxs(
                          "button",
                          {
                            className: Qt === e ? "active" : "",
                            onClick: () => {
                              (Ri(e), We("furniture"));
                            },
                            children: [
                              t.jsx(Dr, { kind: e }),
                              t.jsxs("span", {
                                children: [
                                  t.jsx("strong", { children: n.label }),
                                  t.jsxs("small", {
                                    children: [n.width, " × ", n.depth, " m"],
                                  }),
                                ],
                              }),
                            ],
                          },
                          e,
                        );
                      }),
                      t.jsx(CustomFurnitureLibrary, {
                        models: customFurnitureModels,
                        selectedKey: Qt,
                        onSelect: (key) => (Ri(key), We("furniture")),
                      }),
                    ],
                  }),
                ],
              }),
              t.jsxs("div", {
                className: `device-library ${L === "device" ? "visible" : ""}`,
                children: [
                  t.jsxs("div", {
                    className: "library-heading",
                    children: [
                      t.jsxs("div", {
                        children: [
                          t.jsx(on, { size: 17 }),
                          t.jsx("strong", { children: "设备库" }),
                        ],
                      }),
                      t.jsx("small", { children: jo }),
                    ],
                  }),
                  Gi(
                    ue
                      ? "所有可用设备都已放入户型。"
                      : "连接 Home Assistant 后才会显示真实设备。",
                  ),
                ],
              }),
            ],
          }),
          !ps &&
            t.jsxs("button", {
              className: "inspector-fab",
              type: "button",
              onClick: () => Te(!0),
              "aria-label": "展开属性面板",
              title: "展开属性面板",
              children: [
                t.jsx(Wa, { size: 18 }),
                t.jsx("span", { children: "属性" }),
              ],
            }),
        ],
      }),
      vn &&
        t.jsx(x.Suspense, {
          fallback: null,
          children: t.jsx(Lc, { onClose: () => bn(!1) }),
        }),
      us &&
        t.jsx("button", {
          className: "settings-backdrop",
          onClick: () => Fs(!1),
          "aria-label": "关闭项目设置",
        }),
      t.jsxs("aside", {
        className: `project-settings-drawer ${us ? "open" : ""}`,
        "aria-hidden": !us,
        children: [
          t.jsxs("div", {
            className: "settings-drawer-heading",
            children: [
              t.jsxs("div", {
                children: [
                  t.jsx("small", { children: "项目" }),
                  t.jsx("h2", { children: "项目设置" }),
                ],
              }),
              t.jsx("button", {
                className: "panel-close",
                onClick: () => Fs(!1),
                "aria-label": "关闭项目设置",
                children: t.jsx(Yn, { size: 18 }),
              }),
            ],
          }),
          t.jsxs("div", {
            className: "settings-scroll",
            children: [
              t.jsxs("section", {
                className: "settings-section project-basic-section",
                children: [
                  t.jsx("h3", { children: "基础信息" }),
                  t.jsxs("label", {
                    children: [
                      t.jsx("span", { children: "名称" }),
                      t.jsx("input", {
                        type: "text",
                        maxLength: 80,
                        value: P.name,
                        placeholder: "输入全屋名称",
                        onChange: (e) => Ji(e.target.value),
                      }),
                    ],
                  }),
                ],
              }),
              t.jsxs("section", {
                className: "settings-section",
                children: [
                  t.jsx("h3", { children: "户型拓扑" }),
                  t.jsxs("button", {
                    className: "settings-action",
                    onClick: Bo,
                    children: [
                      t.jsx(Jl, { size: 16 }),
                      t.jsxs("span", {
                        children: [
                          t.jsx("strong", { children: "重新计算房间" }),
                          t.jsxs("small", {
                            children: [
                              b.walls.length,
                              " 面墙 · ",
                              b.rooms.length,
                              " 个房间",
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
              t.jsxs("section", {
                className: "settings-section",
                children: [
                  t.jsx("h3", { children: "项目数据" }),
                  t.jsxs("div", {
                    className: "project-data-actions",
                    children: [
                      t.jsxs("button", {
                        onClick: () => {
                          var e;
                          return (e = Nn.current) == null ? void 0 : e.click();
                        },
                        children: [t.jsx(nn, { size: 16 }), "导入完整备份"],
                      }),
                      t.jsxs("button", {
                        onClick: () => void pa(),
                        children: [t.jsx(qa, { size: 16 }), "导出完整备份"],
                      }),
                    ],
                  }),
                  t.jsxs("button", {
                    className: "settings-action",
                    onClick: () => void ua(),
                    children: [
                      t.jsx(Za, { size: 16 }),
                      t.jsxs("span", {
                        children: [
                          t.jsx("strong", { children: "最近备份" }),
                          t.jsx("small", { children: "查看并恢复自动备份" }),
                        ],
                      }),
                    ],
                  }),
                  Ci &&
                    t.jsx("div", {
                      className: "backup-list",
                      children: Ps.length
                        ? Ps.map((e) =>
                            t.jsxs(
                              "button",
                              {
                                onClick: () => void ma(e),
                                children: [
                                  t.jsx("span", {
                                    children: new Date(
                                      e.createdAt,
                                    ).toLocaleString(),
                                  }),
                                  t.jsx("small", { children: "恢复" }),
                                ],
                              },
                              e.id,
                            ),
                          )
                        : t.jsx("p", { children: "尚无可恢复的备份。" }),
                    }),
                  wt &&
                    t.jsx("p", {
                      className: "save-error-message",
                      role: "status",
                      children: wt,
                    }),
                ],
              }),
              t.jsxs("section", {
                className: "settings-section",
                children: [
                  t.jsx("h3", { children: "Home Assistant" }),
                  t.jsxs("button", {
                    className: "settings-action",
                    onClick: () => void xa(),
                    children: [
                      t.jsx(on, { size: 16 }),
                      t.jsxs("span", {
                        children: [
                          t.jsx("strong", { children: "Area 绑定建议" }),
                          t.jsx("small", { children: "已有绑定不会被覆盖" }),
                        ],
                      }),
                    ],
                  }),
                  Ei &&
                    t.jsx("div", {
                      className: "binding-suggestion-list",
                      children: Ds.length
                        ? Ds.map((e) => {
                            const n = `${e.floorId}:${e.roomId}`,
                              a = e.entityIds
                                .map((r) => {
                                  var l;
                                  return (
                                    ((l = i[r]) == null ? void 0 : l.name) ?? r
                                  );
                                })
                                .join("、");
                            return t.jsxs(
                              "div",
                              {
                                children: [
                                  t.jsxs("div", {
                                    children: [
                                      t.jsx("strong", { children: e.roomName }),
                                      t.jsxs("small", {
                                        children: [e.areaName, " · ", a],
                                      }),
                                    ],
                                  }),
                                  t.jsx("button", {
                                    disabled: As === n,
                                    onClick: () => void ga(e),
                                    children: As === n ? "绑定中" : "应用",
                                  }),
                                ],
                              },
                              `${n}:${e.areaId}`,
                            );
                          })
                        : t.jsx("p", { children: "没有新的绑定建议。" }),
                    }),
                ],
              }),
              t.jsxs("section", {
                className: "settings-section danger-zone",
                children: [
                  t.jsx("h3", { children: "危险操作" }),
                  t.jsxs("button", {
                    className: "subtle-danger project-reset",
                    onClick: () => void fa(),
                    children: [t.jsx(Et, { size: 16 }), "重置当前户型"],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}
export { vd as FloorplanEditor };
