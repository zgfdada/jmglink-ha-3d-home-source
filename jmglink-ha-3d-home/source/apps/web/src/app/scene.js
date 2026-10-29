import { disableSceneEffectPicking, configureDeviceModelPicking, ignoreSceneEffectRaycast } from "../domain/scene-picking.js";
import {createPartMotionEngine} from "../domain/part-motion-engine.js";
import {motionCapabilityValues} from "../../../../packages/schema/src/part-motion.js";
import CameraModel from '../components/camera-model.jsx';
import CameraControlPanel from '../components/camera-controls.jsx';
import {CAMERA_MODELS,cameraModelDefinition} from '../../../../packages/schema/src/camera-models.js';
import {resolveLightChromaticity, mixLightColors} from "../domain/light-color.js";
import { DEFAULT_OUTLINE_SCALE, outlineThickness, updateOutlineThickness } from "../domain/outline-settings.js";
import { overlayRefitKey } from "../domain/camera-refit.js";
import { FLOOR_CAMERA_UP, FLOOR_ORBIT_LIMITS, alignedTopCameraPosition, reachableOrbitPosition, cancelFitOnOrbitStart } from "../domain/camera-orbit.js";
import DevicePanel from "../components/device-panel.jsx";
import { boundPanelStates } from "../domain/device-panel.js";
/**
 * Recovered application module from official 0.1.5 Vite artifact: AppSelect-DDRORnJ8.js
 * Original identifiers, TypeScript types, comments, and module boundaries were not present.
 */
import { c as A, u as Ie, p as Xt, R as pt, f as qs } from "./app.js";
import { a as L } from "../vendor/react.js";
import * as Xa from "three";
import { GLTFLoader as za } from "three/examples/jsm/loaders/GLTFLoader.js";
import { normalizeFurnitureElevation } from "../domain/furniture.js";
import { createCabinetBodyGeometry } from "../domain/cabinet-body-geometry.js";
import { createStableRoundedBoxGeometry, STABLE_SURFACE_EDGE_PROPS } from "../domain/stable-surface-geometry.js";
import "../styles/missing-device-placements.css";
import { missingDevicePlacements } from "../domain/missing-device-placement.js";
import { deviceValueLabel } from "../../../../packages/schema/src/device-value-labels.js";
import { normalizeVanityMirrorCabinet } from "../../../../packages/schema/src/vanity-mirror-cabinet.js";
import {
  normalizeShowerStyle,
  showerEnclosureOutline,
  showerGlassSegments,
} from "../domain/bathroom-fixtures.js";
import {
  cabinetFrontDepth,
  createSegmentedCabinetConnectorPanels,
  createSegmentedCabinetShelfLayout,
  normalizeCabinetDoorCount,
  normalizeCabinetSegments,
  normalizeCabinetUpperDepth,
  normalizeSegmentedCabinetHeights,
  resizeCabinetDepthFromBack,
} from "../domain/cabinet-layout.js";
import { resolveFloorVerticalElevations } from "../domain/vertical-reference.js";
import {
  resolveWasherRuntime,
  washerRuntimeLabel,
  washerRuntimeTitle,
} from "../domain/washer-runtime.js";
import { overrideModelMaterial } from "../domain/model-material-colors.js";
import { applyModelAvailability } from "../domain/model-availability.js";
import {
  createRuntimeModelGlow,
  disposeRuntimeModelGlow,
  updateRuntimeModelGlow,
} from "../domain/runtime-model-glow.js";
import { segmentedToggleAction } from "../domain/device-control-actions.js";
import {
  createControlRadioGroupName,
  resolveStableEntityOptions,
  resolveStableEntitySelection,
} from "../domain/device-platform-presentation.js";
import { isVirtualWall } from "../domain/walls.js";
import "../styles/device-runtime.css";
import {
  C as Re,
  S as Ys,
  B as Xs,
  U as Zs,
  a as Ot,
  j as t,
  u as tt,
  b as re,
  A as q,
  D as J,
  E as RecoveredEdges,
  N as Se,
  d as Le,
  H as le,
  P as Qs,
  R as D,
  M as Js,
  e as V,
  V as fe,
  f as st,
  F as zt,
  g as er,
  h as tr,
  O as sr,
  i as rr,
  k as Zt,
  l as Tt,
  m as yt,
  n as or,
  L as It,
  o as nr,
  p as ir,
  _ as ar,
  r as cr,
} from "../vendor/three.js";

function Y(props) {
  return t.jsx(RecoveredEdges, { ...props, ...STABLE_SURFACE_EDGE_PROPS });
}

function CabinetBodyGeometry({ points, height }) {
  const signature = JSON.stringify(points);
  const geometry = L.useMemo(() => createCabinetBodyGeometry(points, height), [signature, height]);
  L.useEffect(() => () => geometry.dispose(), [geometry]);
  return t.jsx("primitive", { object: geometry, attach: "geometry" });
}
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const lr = [
    [
      "path",
      {
        d: "M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2",
        key: "169zse",
      },
    ],
  ],
  Rt = A("activity", lr);
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const dr = [
    ["path", { d: "M12 8V4H8", key: "hb8ula" }],
    [
      "rect",
      { width: "16", height: "12", x: "4", y: "8", rx: "2", key: "enze0r" },
    ],
    ["path", { d: "M2 14h2", key: "vft8re" }],
    ["path", { d: "M20 14h2", key: "4cs60a" }],
    ["path", { d: "M15 13v2", key: "1xurst" }],
    ["path", { d: "M9 13v2", key: "rq6x2g" }],
  ],
  hr = A("bot", dr);
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const ur = [
    [
      "path",
      {
        d: "M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z",
        key: "hh9hay",
      },
    ],
    ["path", { d: "m3.3 7 8.7 5 8.7-5", key: "g66t2b" }],
    ["path", { d: "M12 22V12", key: "d0xqtd" }],
  ],
  Ji = A("box", ur);
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const fr = [
    [
      "path",
      {
        d: "M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z",
        key: "18u6gg",
      },
    ],
    ["circle", { cx: "12", cy: "13", r: "3", key: "1vg3eu" }],
  ],
  pr = A("camera", fr);
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const gr = [["path", { d: "M20 6 9 17l-5-5", key: "1gmf2c" }]],
  mr = A("check", gr);
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const xr = [["path", { d: "m6 9 6 6 6-6", key: "qrunsl" }]],
  yr = A("chevron-down", xr);
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const jr = [
    ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
    ["path", { d: "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3", key: "1u773s" }],
    ["path", { d: "M12 17h.01", key: "p32p05" }],
  ],
  br = A("circle-question-mark", jr);
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const wr = [
    [
      "path",
      {
        d: "M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z",
        key: "1ptgy4",
      },
    ],
    [
      "path",
      {
        d: "M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97",
        key: "1sl1rz",
      },
    ],
  ],
  Qt = A("droplets", wr);
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const vr = [
    [
      "path",
      {
        d: "M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49",
        key: "ct8e1f",
      },
    ],
    ["path", { d: "M14.084 14.158a3 3 0 0 1-4.242-4.242", key: "151rxh" }],
    [
      "path",
      {
        d: "M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143",
        key: "13bj9a",
      },
    ],
    ["path", { d: "m2 2 20 20", key: "1ooewy" }],
  ],
  ea = A("eye-off", vr);
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const _r = [
    [
      "path",
      {
        d: "M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0",
        key: "1nclc0",
      },
    ],
    ["circle", { cx: "12", cy: "12", r: "3", key: "1v7zrd" }],
  ],
  ta = A("eye", _r);
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Mr = [
    ["path", { d: "m12 14 4-4", key: "9kzdfg" }],
    ["path", { d: "M3.34 19a10 10 0 1 1 17.32 0", key: "19p75a" }],
  ],
  kr = A("gauge", Mr);
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Sr = [
    [
      "path",
      { d: "M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8", key: "5wwlr5" },
    ],
    [
      "path",
      {
        d: "M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
        key: "r6nss1",
      },
    ],
  ],
  sa = A("house", Sr);
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Cr = [
    [
      "path",
      {
        d: "M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z",
        key: "zw3jo",
      },
    ],
    [
      "path",
      {
        d: "M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12",
        key: "1wduqc",
      },
    ],
    [
      "path",
      {
        d: "M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17",
        key: "kqbvx6",
      },
    ],
  ],
  ra = A("layers", Cr);
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Pr = [
    [
      "path",
      {
        d: "M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z",
        key: "nnexq3",
      },
    ],
    [
      "path",
      { d: "M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12", key: "mt58a7" },
    ],
  ],
  Jt = A("leaf", Pr);
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Gr = [
    [
      "path",
      { d: "M16.8 11.2c.8-.9 1.2-2 1.2-3.2a6 6 0 0 0-9.3-5", key: "1fkcox" },
    ],
    ["path", { d: "m2 2 20 20", key: "1ooewy" }],
    [
      "path",
      {
        d: "M6.3 6.3a4.67 4.67 0 0 0 1.2 5.2c.7.7 1.3 1.5 1.5 2.5",
        key: "10m8kw",
      },
    ],
    ["path", { d: "M9 18h6", key: "x1upvd" }],
    ["path", { d: "M10 22h4", key: "ceow96" }],
  ],
  Lr = A("lightbulb-off", Gr);
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const $r = [
    [
      "path",
      {
        d: "M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5",
        key: "1gvzjb",
      },
    ],
    ["path", { d: "M9 18h6", key: "x1upvd" }],
    ["path", { d: "M10 22h4", key: "ceow96" }],
  ],
  es = A("lightbulb", $r);
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Er = [
    ["path", { d: "M9 17H7A5 5 0 0 1 7 7h2", key: "8i5ue5" }],
    ["path", { d: "M15 7h2a5 5 0 1 1 0 10h-2", key: "1b9ql8" }],
    ["line", { x1: "8", x2: "16", y1: "12", y2: "12", key: "1jonct" }],
  ],
  oa = A("link-2", Er);
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Nr = [
    [
      "rect",
      {
        width: "18",
        height: "11",
        x: "3",
        y: "11",
        rx: "2",
        ry: "2",
        key: "1w4ew1",
      },
    ],
    ["path", { d: "M7 11V7a5 5 0 0 1 10 0v4", key: "fwvmzm" }],
  ],
  Or = A("lock", Nr);
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const zr = [
    [
      "path",
      {
        d: "M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z",
        key: "e79jfc",
      },
    ],
    [
      "circle",
      { cx: "13.5", cy: "6.5", r: ".5", fill: "currentColor", key: "1okk4w" },
    ],
    [
      "circle",
      { cx: "17.5", cy: "10.5", r: ".5", fill: "currentColor", key: "f64h9f" },
    ],
    [
      "circle",
      { cx: "6.5", cy: "12.5", r: ".5", fill: "currentColor", key: "qy21gx" },
    ],
    [
      "circle",
      { cx: "8.5", cy: "7.5", r: ".5", fill: "currentColor", key: "fotxhn" },
    ],
  ],
  Tr = A("palette", zr);
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Ir = [
    [
      "rect",
      { width: "18", height: "18", x: "3", y: "3", rx: "2", key: "afitv7" },
    ],
    ["path", { d: "M3 9h18", key: "1pudct" }],
    ["path", { d: "m9 16 3-3 3 3", key: "1idcnm" }],
  ],
  Rr = A("panel-top-close", Ir);
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Fr = [
    [
      "rect",
      { width: "18", height: "18", x: "3", y: "3", rx: "2", key: "afitv7" },
    ],
    ["path", { d: "M3 9h18", key: "1pudct" }],
    ["path", { d: "m15 14-3 3-3-3", key: "g215vf" }],
  ],
  Hr = A("panel-top-open", Fr);
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Br = [
    [
      "rect",
      { width: "18", height: "18", x: "3", y: "3", rx: "2", key: "afitv7" },
    ],
    ["path", { d: "M3 9h18", key: "1pudct" }],
  ],
  Ar = A("panel-top", Br);
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Dr = [
    [
      "rect",
      { width: "18", height: "18", x: "3", y: "3", rx: "2", key: "afitv7" },
    ],
    ["path", { d: "M3 9h18", key: "1pudct" }],
    ["path", { d: "M9 21V9", key: "1oto5p" }],
  ],
  Wr = A("panels-top-left", Dr);
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Vr = [
    [
      "rect",
      { x: "14", y: "3", width: "5", height: "18", rx: "1", key: "kaeet6" },
    ],
    [
      "rect",
      { x: "5", y: "3", width: "5", height: "18", rx: "1", key: "1wsw3u" },
    ],
  ],
  Kr = A("pause", Vr);
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Ur = [
    [
      "path",
      {
        d: "M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z",
        key: "10ikf1",
      },
    ],
  ],
  qr = A("play", Ur);
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Yr = [
    ["path", { d: "M5 12h14", key: "1ays0h" }],
    ["path", { d: "M12 5v14", key: "s699le" }],
  ],
  na = A("plus", Yr);
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Xr = [
    ["path", { d: "M18.36 6.64A9 9 0 0 1 20.77 15", key: "dxknvb" }],
    ["path", { d: "M6.16 6.16a9 9 0 1 0 12.68 12.68", key: "1x7qb5" }],
    ["path", { d: "M12 2v4", key: "3427ic" }],
    ["path", { d: "m2 2 20 20", key: "1ooewy" }],
  ],
  Zr = A("power-off", Xr);
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Qr = [
    ["path", { d: "M12 2v10", key: "mnfbl" }],
    ["path", { d: "M18.4 6.6a9 9 0 1 1-12.77.04", key: "obofu9" }],
  ],
  Jr = A("power", Qr);
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const eo = [
    ["path", { d: "M16.247 7.761a6 6 0 0 1 0 8.478", key: "1fwjs5" }],
    ["path", { d: "M19.075 4.933a10 10 0 0 1 0 14.134", key: "ehdyv1" }],
    ["path", { d: "M4.925 19.067a10 10 0 0 1 0-14.134", key: "1q22gi" }],
    ["path", { d: "M7.753 16.239a6 6 0 0 1 0-8.478", key: "r2q7qm" }],
    ["circle", { cx: "12", cy: "12", r: "2", key: "1c9p78" }],
  ],
  to = A("radio", eo);
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const so = [
    [
      "path",
      {
        d: "M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z",
        key: "1c8476",
      },
    ],
    ["path", { d: "M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7", key: "1ydtos" }],
    ["path", { d: "M7 3v4a1 1 0 0 0 1 1h7", key: "t51u73" }],
  ],
  ia = A("save", so);
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const ro = [
    ["path", { d: "m21 21-4.34-4.34", key: "14j7rj" }],
    ["circle", { cx: "11", cy: "11", r: "8", key: "4ej97u" }],
  ],
  aa = A("search", ro);
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const oo = [
    ["path", { d: "M14 17H5", key: "gfn3mx" }],
    ["path", { d: "M19 7h-9", key: "6i9tg" }],
    ["circle", { cx: "17", cy: "17", r: "3", key: "18b49y" }],
    ["circle", { cx: "7", cy: "7", r: "3", key: "dfmy0x" }],
  ],
  ca = A("settings-2", oo);
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const no = [
    [
      "path",
      {
        d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",
        key: "oel41y",
      },
    ],
  ],
  ts = A("shield", no);
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const io = [
    ["path", { d: "M10 5H3", key: "1qgfaw" }],
    ["path", { d: "M12 19H3", key: "yhmn1j" }],
    ["path", { d: "M14 3v4", key: "1sua03" }],
    ["path", { d: "M16 17v4", key: "1q0r14" }],
    ["path", { d: "M21 12h-9", key: "1o4lsq" }],
    ["path", { d: "M21 19h-5", key: "1rlt1p" }],
    ["path", { d: "M21 5h-7", key: "1oszz2" }],
    ["path", { d: "M8 10v4", key: "tgpxqk" }],
    ["path", { d: "M8 12H3", key: "a7s4jb" }],
  ],
  ss = A("sliders-horizontal", io);
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const ao = [
    ["path", { d: "m10 20-1.25-2.5L6 18", key: "18frcb" }],
    ["path", { d: "M10 4 8.75 6.5 6 6", key: "7mghy3" }],
    ["path", { d: "m14 20 1.25-2.5L18 18", key: "1chtki" }],
    ["path", { d: "m14 4 1.25 2.5L18 6", key: "1b4wsy" }],
    ["path", { d: "m17 21-3-6h-4", key: "15hhxa" }],
    ["path", { d: "m17 3-3 6 1.5 3", key: "11697g" }],
    ["path", { d: "M2 12h6.5L10 9", key: "kv9z4n" }],
    ["path", { d: "m20 10-1.5 2 1.5 2", key: "1swlpi" }],
    ["path", { d: "M22 12h-6.5L14 15", key: "1mxi28" }],
    ["path", { d: "m4 10 1.5 2L4 14", key: "k9enpj" }],
    ["path", { d: "m7 21 3-6-1.5-3", key: "j8hb9u" }],
    ["path", { d: "m7 3 3 6h4", key: "1otusx" }],
  ],
  co = A("snowflake", ao);
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const lo = [
    [
      "path",
      {
        d: "M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z",
        key: "1s2grr",
      },
    ],
    ["path", { d: "M20 2v4", key: "1rf3ol" }],
    ["path", { d: "M22 4h-4", key: "gwowj6" }],
    ["circle", { cx: "4", cy: "20", r: "2", key: "6kqj1y" }],
  ],
  ho = A("sparkles", lo);
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const uo = [
    ["circle", { cx: "12", cy: "12", r: "4", key: "4exip2" }],
    ["path", { d: "M12 2v2", key: "tus03m" }],
    ["path", { d: "M12 20v2", key: "1lh1kg" }],
    ["path", { d: "m4.93 4.93 1.41 1.41", key: "149t6j" }],
    ["path", { d: "m17.66 17.66 1.41 1.41", key: "ptbguv" }],
    ["path", { d: "M2 12h2", key: "1t8f8n" }],
    ["path", { d: "M20 12h2", key: "1q8mjw" }],
    ["path", { d: "m6.34 17.66-1.41 1.41", key: "1m8zz5" }],
    ["path", { d: "m19.07 4.93-1.41 1.41", key: "1shlcs" }],
  ],
  jt = A("sun", uo);
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const fo = [
    [
      "path",
      { d: "M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z", key: "17jzev" },
    ],
  ],
  Fe = A("thermometer", fo);
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const po = [
    ["circle", { cx: "9", cy: "12", r: "3", key: "u3jwor" }],
    [
      "rect",
      { width: "20", height: "14", x: "2", y: "5", rx: "7", key: "g7kal2" },
    ],
  ],
  go = A("toggle-left", po);
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const mo = [
    ["path", { d: "M10 11v6", key: "nco0om" }],
    ["path", { d: "M14 11v6", key: "outv1u" }],
    ["path", { d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6", key: "miytrc" }],
    ["path", { d: "M3 6h18", key: "d0wm0j" }],
    ["path", { d: "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2", key: "e791ji" }],
  ],
  la = A("trash-2", mo);
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const xo = [
    ["circle", { cx: "12", cy: "8", r: "5", key: "1hypcn" }],
    ["path", { d: "M20 21a8 8 0 0 0-16 0", key: "rfgkzh" }],
  ],
  yo = A("user-round", xo);
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const jo = [
    [
      "path",
      {
        d: "m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5",
        key: "ftymec",
      },
    ],
    [
      "rect",
      { x: "2", y: "6", width: "14", height: "12", rx: "2", key: "158x01" },
    ],
  ],
  bo = A("video", jo);
/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const wo = [
    ["path", { d: "M12.8 19.6A2 2 0 1 0 14 16H2", key: "148xed" }],
    ["path", { d: "M17.5 8a2.5 2.5 0 1 1 2 4H2", key: "1u4tom" }],
    ["path", { d: "M9.8 4.4A2 2 0 1 1 11 8H2", key: "75valh" }],
  ],
  rt = A("wind", wo);
function da(e, s, r = !0) {
  const o = L.useRef({}),
    n = L.useMemo(
      () =>
        r
          ? [...new Set(s)].sort().join(`
`)
          : "",
      [r, s],
    );
  return L.useMemo(() => {
    if (!r || !n)
      return (Object.keys(o.current).length && (o.current = {}), o.current);
    const i = {};
    for (const l of n.split(`
`)) {
      const f = e[l];
      f && (i[l] = f);
    }
    const a = o.current,
      c = Object.keys(i);
    return Object.keys(a).length === c.length && c.every((l) => a[l] === i[l])
      ? a
      : ((o.current = i), i);
  }, [r, e, n]);
}
const rs = [
    {
      id: "light.ceiling",
      kind: "light",
      label: "通用吸顶灯",
      description: "贴顶矩形灯具，适合主灯或平板灯",
      placement: "ceiling",
      defaultHeight: 1.62,
    },
    {
      id: "light.ceiling_panel",
      kind: "light",
      label: "平板吸顶灯",
      description: "超薄矩形面板灯，适合客厅、厨房和办公区",
      placement: "ceiling",
      defaultHeight: 1.62,
    },
    {
      id: "light.ceiling_round",
      kind: "light",
      label: "圆形吸顶灯",
      description: "圆盘吸顶灯，适合卧室、走廊和玄关",
      placement: "ceiling",
      defaultHeight: 1.62,
    },
    {
      id: "light.downlight",
      kind: "light",
      label: "筒灯/射灯",
      description: "嵌入式小光源，适合多点布光",
      placement: "ceiling",
      defaultHeight: 1.66,
    },
    {
      id: "light.wall_sconce",
      kind: "light",
      label: "壁灯",
      description: "墙面装饰灯或床头壁灯",
      placement: "wall",
      defaultHeight: 1.32,
    },
    {
      id: "light.chandelier",
      kind: "light",
      label: "吊灯",
      description: "下垂灯体，适合餐厅与客厅焦点",
      placement: "ceiling",
      defaultHeight: 1.48,
    },
    {
      id: "light.floor_lamp",
      kind: "light",
      label: "落地灯",
      description: "从地面升起的氛围灯",
      placement: "floor",
      defaultHeight: 0,
    },
    {
      id: "light.strip",
      kind: "light",
      label: "灯带",
      description: "线性光带，适合柜体和边缘氛围",
      placement: "ceiling",
      defaultHeight: 1.44,
    },
    {
      id: "switch.wall",
      kind: "switch",
      label: "单键开关",
      description: "经典墙壁开关面板",
      placement: "wall",
      defaultHeight: 0.92,
    },
    {
      id: "switch.double",
      kind: "switch",
      label: "双键开关",
      description: "双路墙壁控制面板",
      placement: "wall",
      defaultHeight: 0.92,
    },
    {
      id: "switch.triple",
      kind: "switch",
      label: "三键开关",
      description: "三路墙壁控制面板",
      placement: "wall",
      defaultHeight: 0.92,
    },
    {
      id: "switch.scene",
      kind: "switch",
      label: "场景按钮",
      description: "无线/场景控制按钮",
      placement: "wall",
      defaultHeight: 0.88,
    },
    {
      id: "switch.ac_airflow",
      kind: "switch",
      label: "空调开关",
      description: "空调电源/扫风联动，带气流效果",
      placement: "wall",
      defaultHeight: 0.94,
    },
    {
      id: "switch.outlet",
      kind: "switch",
      label: "智能插座",
      description: "低位插座或电源模块",
      placement: "wall",
      defaultHeight: 0.28,
    },
    {
      id: "switch.washing_machine",
      kind: "switch",
      label: "洗衣机",
      description: "多实体洗衣机的落地设备模型",
      placement: "floor",
      defaultHeight: 0,
    },
    {
      id: "switch.light.ceiling",
      kind: "switch",
      label: "通用吸顶灯",
      description: "智能开关控制的吸顶灯或平板灯，复用灯具造型",
      placement: "ceiling",
      defaultHeight: 1.62,
    },
    {
      id: "switch.light.ceiling_panel",
      kind: "switch",
      label: "平板吸顶灯",
      description: "智能开关控制的平板吸顶灯，复用灯具造型",
      placement: "ceiling",
      defaultHeight: 1.62,
    },
    {
      id: "switch.light.ceiling_round",
      kind: "switch",
      label: "圆形吸顶灯",
      description: "智能开关控制的圆形吸顶灯，复用灯具造型",
      placement: "ceiling",
      defaultHeight: 1.62,
    },
    {
      id: "switch.light.downlight",
      kind: "switch",
      label: "筒灯/射灯",
      description: "智能开关控制的筒灯或射灯，复用灯具造型",
      placement: "ceiling",
      defaultHeight: 1.66,
    },
    {
      id: "switch.light.wall_sconce",
      kind: "switch",
      label: "壁灯",
      description: "智能开关控制的壁灯，复用灯具造型",
      placement: "wall",
      defaultHeight: 1.32,
    },
    {
      id: "switch.light.chandelier",
      kind: "switch",
      label: "吊灯",
      description: "智能开关控制的吊灯，复用灯具造型",
      placement: "ceiling",
      defaultHeight: 1.48,
    },
    {
      id: "switch.light.floor_lamp",
      kind: "switch",
      label: "落地灯",
      description: "智能开关控制的落地灯，复用灯具造型",
      placement: "floor",
      defaultHeight: 0,
    },
    {
      id: "switch.light.strip",
      kind: "switch",
      label: "灯带",
      description: "智能开关控制的灯带，复用灯具造型",
      placement: "ceiling",
      defaultHeight: 1.44,
    },
    {
      id: "cover.curtain",
      kind: "cover",
      label: "窗帘",
      description: "轨道与左右帘布",
      placement: "wall",
      defaultHeight: 1.12,
    },
    {
      id: "cover.blind",
      kind: "cover",
      label: "百叶/卷帘",
      description: "水平叶片或卷帘结构",
      placement: "wall",
      defaultHeight: 1.12,
    },
    {
      id: "climate.wall_ac",
      kind: "climate",
      label: "壁挂空调",
      description: "墙面空调室内机",
      placement: "wall",
      defaultHeight: 1.32,
    },
    {
      id: "climate.central_ac",
      kind: "climate",
      label: "中央空调/风管机",
      description: "吊顶风管机，侧向出风口造型",
      placement: "ceiling",
      defaultHeight: 1.58,
    },
    {
      id: "climate.floor_ac",
      kind: "climate",
      label: "柜式空调",
      description: "落地塔式空调机",
      placement: "floor",
      defaultHeight: 0,
    },
    {
      id: "climate.thermostat",
      kind: "climate",
      label: "温控面板",
      description: "墙面温控器/地暖控制",
      placement: "wall",
      defaultHeight: 0.96,
    },
    {
      id: "sensor.wall",
      kind: "sensor",
      label: "通用传感器",
      description: "小型圆形墙面传感器",
      placement: "wall",
      defaultHeight: 1,
    },
    {
      id: "sensor.temperature",
      kind: "sensor",
      label: "温度传感器",
      description: "温湿度屏显或探头",
      placement: "wall",
      defaultHeight: 0.98,
    },
    {
      id: "sensor.humidity",
      kind: "sensor",
      label: "湿度传感器",
      description: "湿度/水汽监测点",
      placement: "wall",
      defaultHeight: 0.98,
    },
    {
      id: "sensor.light_level",
      kind: "sensor",
      label: "照度传感器",
      description: "环境光照/亮度监测",
      placement: "ceiling",
      defaultHeight: 1.45,
    },
    {
      id: "sensor.co2",
      kind: "sensor",
      label: "CO₂ 传感器",
      description: "二氧化碳/空气闷热度监测",
      placement: "wall",
      defaultHeight: 0.98,
    },
    {
      id: "sensor.pm25",
      kind: "sensor",
      label: "PM2.5 传感器",
      description: "颗粒物/空气净化联动",
      placement: "wall",
      defaultHeight: 0.98,
    },
    {
      id: "sensor.air_quality",
      kind: "sensor",
      label: "空气质量",
      description: "CO₂ / PM2.5 / 空气盒子",
      placement: "wall",
      defaultHeight: 0.96,
    },
    {
      id: "sensor.power",
      kind: "sensor",
      label: "电量仪表",
      description: "能耗/功率计量模块",
      placement: "wall",
      defaultHeight: 0.9,
    },
    {
      id: "binary_sensor.wall",
      kind: "binary_sensor",
      label: "安防传感器",
      description: "通用安全状态点",
      placement: "wall",
      defaultHeight: 1,
    },
    {
      id: "binary_sensor.door",
      kind: "binary_sensor",
      label: "门窗传感器",
      description: "门磁/窗磁双模块",
      placement: "wall",
      defaultHeight: 1,
    },
    {
      id: "binary_sensor.motion",
      kind: "binary_sensor",
      label: "人体传感器",
      description: "PIR / 存在探测器",
      placement: "ceiling",
      defaultHeight: 1.5,
    },
    {
      id: "binary_sensor.presence",
      kind: "binary_sensor",
      label: "存在传感器",
      description: "毫米波/人体存在雷达",
      placement: "ceiling",
      defaultHeight: 1.48,
    },
    {
      id: "binary_sensor.smoke",
      kind: "binary_sensor",
      label: "烟雾燃气",
      description: "吊顶报警探测器",
      placement: "ceiling",
      defaultHeight: 1.55,
    },
    {
      id: "binary_sensor.water",
      kind: "binary_sensor",
      label: "水浸传感器",
      description: "靠近地面的漏水探测",
      placement: "floor",
      defaultHeight: 0.04,
    },
    {
      id: "camera.wall",
      kind: "camera",
      label: "摄像头",
      description: "墙面/角落摄像头",
      placement: "wall",
      defaultHeight: 1.25,
    },
    ...CAMERA_MODELS.map(model=>({id:model.id,kind:"camera",label:model.name,description:model.name,placement:model.placement,defaultHeight:model.defaultHeight})),
    {
      id: "camera.doorbell",
      kind: "camera",
      label: "可视门铃",
      description: "门口可视门铃/对讲摄像头",
      placement: "wall",
      defaultHeight: 1.08,
    },
    {
      id: "lock.door",
      kind: "lock",
      label: "智能门锁",
      description: "入户门锁/电子锁状态点",
      placement: "wall",
      defaultHeight: 0.96,
    },
    {
      id: "fan.ceiling",
      kind: "fan",
      label: "风扇",
      description: "吊顶风扇",
      placement: "ceiling",
      defaultHeight: 1.5,
    },
    {
      id: "fan.floor",
      kind: "fan",
      label: "落地扇",
      description: "循环扇/落地风扇",
      placement: "floor",
      defaultHeight: 0,
    },
    {
      id: "fan.tower",
      kind: "fan",
      label: "塔扇",
      description: "细长立式塔扇",
      placement: "floor",
      defaultHeight: 0,
    },
    {
      id: "media_player.tv",
      kind: "media_player",
      label: "电视",
      description: "墙面屏幕/投影显示",
      placement: "wall",
      defaultHeight: 1,
    },
    {
      id: "media_player.speaker",
      kind: "media_player",
      label: "音箱",
      description: "桌面/落地扬声器",
      placement: "surface",
      defaultHeight: 0.55,
    },
    {
      id: "vacuum.robot",
      kind: "vacuum",
      label: "扫地机器人",
      description: "圆盘式地面清洁机器人",
      placement: "floor",
      defaultHeight: 0.04,
    },
    {
      id: "alarm.panel",
      kind: "alarm_control_panel",
      label: "安防面板",
      description: "安防主机/控制面板",
      placement: "wall",
      defaultHeight: 0.95,
    },
    {
      id: "custom.point",
      kind: "custom",
      label: "通用设备",
      description: "未归类的设备点位",
      placement: "surface",
      defaultHeight: 0.75,
    },
  ],
  vo = {
    "switch.light.ceiling": "light.ceiling",
    "switch.light.ceiling_panel": "light.ceiling_panel",
    "switch.light.ceiling_round": "light.ceiling_round",
    "switch.light.downlight": "light.downlight",
    "switch.light.wall_sconce": "light.wall_sconce",
    "switch.light.chandelier": "light.chandelier",
    "switch.light.floor_lamp": "light.floor_lamp",
    "switch.light.strip": "light.strip",
  };
function os(e) {
  return vo[e] ?? e;
}
const ze = new Map(rs.map((e) => [e.id, e])),
  ns = {
    alarm_control_panel: "alarm.panel",
    binary_sensor: "binary_sensor.wall",
    camera: "camera.wall",
    climate: "climate.wall_ac",
    cover: "cover.curtain",
    custom: "custom.point",
    fan: "fan.ceiling",
    light: "light.ceiling",
    lock: "lock.door",
    media_player: "media_player.tv",
    sensor: "sensor.wall",
    switch: "switch.wall",
    vacuum: "vacuum.robot",
  },
  _o = (e) =>
    [
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
      "alarm_control_panel",
      "vacuum",
    ].includes(e)
      ? e
      : "custom";
function bt(e) {
  return _o(e.domain);
}
function wt(e) {
  return e ? ze.get(e) : void 0;
}
function ha(e) {
  const s = typeof e == "string" ? e : bt(e);
  return rs.filter((r) => r.kind === s);
}
const Mo = (e) => {
  const s = (e == null ? void 0 : e.attributes) ?? {},
    r = typeof s.device_class == "string" ? s.device_class : "",
    o = typeof s.unit_of_measurement == "string" ? s.unit_of_measurement : "";
  return `${(e == null ? void 0 : e.name) ?? ""} ${(e == null ? void 0 : e.entityId) ?? ""} ${r} ${o}`.toLowerCase();
};
function is(e, s = e ? bt(e) : "custom") {
  const r = Mo(e);
  return (e == null ? void 0 : e.domain) === "light" || s === "light"
    ? /(壁灯|wall lamp|wall.?sconce|sconce|床头灯|bedside lamp)/i.test(r)
      ? "light.wall_sconce"
      : /(吊灯|chandelier|pendant)/i.test(r)
        ? "light.chandelier"
        : /(落地灯|floor lamp|floor_lamp|floorlight)/i.test(r)
          ? "light.floor_lamp"
          : /(灯带|lightstrip|light strip|strip|氛围灯带)/i.test(r)
            ? "light.strip"
            : /(筒灯|射灯|downlight|spotlight|spot light)/i.test(r)
              ? "light.downlight"
              : /(平板灯|面板灯|panel light|panel_light|flat ceiling|平板吸顶)/i.test(
                    r,
                  )
                ? "light.ceiling_panel"
                : /(圆形吸顶|圆吸顶|圆灯|round ceiling|round_ceiling|ceiling round)/i.test(
                      r,
                    )
                  ? "light.ceiling_round"
                  : (/(吸顶灯|ceiling|主灯|客厅灯|卧室灯)/i.test(r),
                    "light.ceiling")
    : (e == null ? void 0 : e.domain) === "switch" || s === "switch"
      ? /(洗衣机|washing.?machine|washer)/i.test(r)
        ? "switch.washing_machine"
        : /(插座|socket|outlet|plug)/i.test(r)
          ? "switch.outlet"
          : /(空调.*开关|air.?conditioner.*switch|ac.*switch|switch_status|扫风|摆风|airflow|swing)/i.test(
                r,
              )
            ? "switch.ac_airflow"
            : /(场景|scene|button|按钮|无线|remote)/i.test(r)
              ? "switch.scene"
              : /(灯带|lightstrip|light strip|strip|氛围灯带)/i.test(r)
                ? "switch.light.strip"
                : /(壁灯|wall lamp|wall.?sconce|sconce|床头灯|bedside lamp)/i.test(
                      r,
                    )
                  ? "switch.light.wall_sconce"
                  : /(吊灯|chandelier|pendant)/i.test(r)
                    ? "switch.light.chandelier"
                    : /(落地灯|floor lamp|floor_lamp|floorlight)/i.test(r)
                      ? "switch.light.floor_lamp"
                      : /(筒灯|射灯|downlight|spotlight|spot light)/i.test(r)
                        ? "switch.light.downlight"
                        : /(平板灯|面板灯|panel light|panel_light|flat ceiling|平板吸顶)/i.test(
                              r,
                            )
                          ? "switch.light.ceiling_panel"
                          : /(圆形吸顶|圆吸顶|圆灯|round ceiling|round_ceiling|ceiling round)/i.test(
                                r,
                              )
                            ? "switch.light.ceiling_round"
                            : /(吸顶灯|ceiling|主灯|照明|灯光|灯\b|light)/i.test(
                                  r,
                                )
                              ? "switch.light.ceiling"
                              : /(三键|三路|triple|three|3键|三开|switch3|switch2|switch1|wall_switch)/i.test(
                                    r,
                                  )
                                ? "switch.triple"
                                : /(双键|双路|double|two|2键|二键|二路)/i.test(
                                      r,
                                    )
                                  ? "switch.double"
                                  : "switch.wall"
      : (e == null ? void 0 : e.domain) === "cover" || s === "cover"
        ? /(百叶|卷帘|blind|shade|roller)/i.test(r)
          ? "cover.blind"
          : "cover.curtain"
        : (e == null ? void 0 : e.domain) === "climate" || s === "climate"
          ? /(中央空调|风管机|多联机|central|duct|cassette|vent|vrf)/i.test(r)
            ? "climate.central_ac"
            : /(柜机|立式|落地|floor|tower)/i.test(r)
              ? "climate.floor_ac"
              : /(温控|地暖|thermostat|floor heating|heat pump)/i.test(r)
                ? "climate.thermostat"
                : "climate.wall_ac"
          : (e == null ? void 0 : e.domain) === "sensor" || s === "sensor"
            ? /(温度|temperature|°c|℃)/i.test(r)
              ? "sensor.temperature"
              : /(湿度|humidity|%)/i.test(r)
                ? "sensor.humidity"
                : /(illuminance|照度|光照|light level|lux|\blx\b)/i.test(r)
                  ? "sensor.light_level"
                  : /(co2|co₂|二氧化碳|carbon dioxide)/i.test(r)
                    ? "sensor.co2"
                    : /(pm2\.?5|pm25|颗粒物|particle|particulate)/i.test(r)
                      ? "sensor.pm25"
                      : /(空气|air|pm2\.?5|pm10|co2|co₂|voc|aqi|甲醛|hcho)/i.test(
                            r,
                          )
                        ? "sensor.air_quality"
                        : /(功率|电量|能耗|power|energy|kwh|w$|瓦)/i.test(r)
                          ? "sensor.power"
                          : "sensor.wall"
            : (e == null ? void 0 : e.domain) === "binary_sensor" ||
                s === "binary_sensor"
              ? /(门|窗|door|window|contact|opening)/i.test(r)
                ? "binary_sensor.door"
                : /(存在|人在|presence|occupancy|毫米波|millimeter|mmwave|fp1|fp2|fp310)/i.test(
                      r,
                    )
                  ? "binary_sensor.presence"
                  : /(人体|移动|motion|pir)/i.test(r)
                    ? "binary_sensor.motion"
                    : /(烟雾|燃气|烟感|气体|smoke|gas|co)/i.test(r)
                      ? "binary_sensor.smoke"
                      : /(水浸|漏水|water|moisture|leak)/i.test(r)
                        ? "binary_sensor.water"
                        : "binary_sensor.wall"
              : (e == null ? void 0 : e.domain) === "camera" || s === "camera"
                ? /(门铃|doorbell|intercom|可视门铃)/i.test(r)
                  ? "camera.doorbell"
                  : /(双摄|双镜头|dual.?lens|dual.?camera)/i.test(r) ? "camera.dual" : /(桌面|台式|desktop|tabletop)/i.test(r) ? "camera.desktop" : /(枪机|室外|走廊|bullet|outdoor|corridor|hallway)/i.test(r)
                    ? "camera.bullet"
                    : /(云台|球机|半球|dome|ptz|pan|tilt)/i.test(r)
                      ? "camera.dome"
                      : "camera.wall"
                : (e == null ? void 0 : e.domain) === "lock" || s === "lock"
                  ? "lock.door"
                  : (e == null ? void 0 : e.domain) === "fan" || s === "fan"
                    ? /(塔扇|tower)/i.test(r)
                      ? "fan.tower"
                      : /(落地|循环|floor|stand|pedestal|circulator)/i.test(r)
                        ? "fan.floor"
                        : "fan.ceiling"
                    : (e == null ? void 0 : e.domain) === "media_player" ||
                        s === "media_player"
                      ? /(音箱|音响|speaker|sound|sonos|homepod|小爱|小明)/i.test(
                          r,
                        )
                        ? "media_player.speaker"
                        : "media_player.tv"
                      : (e == null ? void 0 : e.domain) === "vacuum" ||
                          s === "vacuum"
                        ? "vacuum.robot"
                        : ns[s];
}
function ko(e, s) {
  const r = wt(e.modelId);
  if (r && r.kind === e.kind) return r;
  const o = is(s, e.kind);
  return ze.get(o) ?? ze.get(ns[e.kind]) ?? ze.get("custom.point");
}
function ua(e, s, r) {
  const o = bt(e),
    n = wt(r) ?? ze.get(is(e, o));
  return n.placement === "ceiling" || n.id === "climate.wall_ac"
    ? Math.max(0.2, s)
    : n.defaultHeight;
}
const Me = [
    { kelvin: 2e3, color: [255, 151, 82] },
    { kelvin: 2700, color: [255, 190, 118] },
    { kelvin: 4e3, color: [255, 239, 211] },
    { kelvin: 5e3, color: [245, 248, 255] },
    { kelvin: 6500, color: [215, 231, 255] },
  ],
  He = (e, s, r) => Math.min(r, Math.max(s, e)),
  $e = (e, s) => {
    const r = e == null ? void 0 : e.attributes[s];
    return typeof r == "number" && Number.isFinite(r) ? r : void 0;
  },
  Ce = (e, s) => {
    const r = e == null ? void 0 : e.attributes[s];
    return Array.isArray(r)
      ? r.filter((o) => typeof o == "number" && Number.isFinite(o))
      : [];
  },
  So = (e) => {
    const s = e == null ? void 0 : e.attributes.supported_color_modes;
    return Array.isArray(s) ? s.filter((r) => typeof r == "string") : [];
  },
  gt = (e) =>
    Math.round(He(e, 0, 255))
      .toString(16)
      .padStart(2, "0"),
  as = (e) => `#${e.slice(0, 3).map(gt).join("")}`;
function Co(e, s) {
  const r = (((e % 360) + 360) % 360) / 60,
    n = He(s, 0, 100) / 100,
    i = n * (1 - Math.abs((r % 2) - 1)),
    a = 1 - n,
    [c, l, f] =
      r < 1
        ? [n, i, 0]
        : r < 2
          ? [i, n, 0]
          : r < 3
            ? [0, n, i]
            : r < 4
              ? [0, i, n]
              : r < 5
                ? [i, 0, n]
                : [n, 0, i];
  return as([(c + a) * 255, (l + a) * 255, (f + a) * 255]);
}
function Po(e, s) {
  for (const o of ["rgb_color", "rgbw_color", "rgbww_color"]) {
    const n = Ce(e, o);
    if (n.length >= 3) return as(n);
  }
  const r = Ce(e, "hs_color");
  return r.length >= 2 ? Co(r[0], r[1]) : s;
}
function Go(e) {
  const s = He(e, Me[0].kelvin, Me[Me.length - 1].kelvin),
    r = Me.findIndex((c) => c.kelvin >= s),
    o = Me[Math.max(0, r)],
    n = Me[Math.max(0, r - 1)];
  if (o.kelvin === n.kelvin) return `#${o.color.map(gt).join("")}`;
  const i = (s - n.kelvin) / (o.kelvin - n.kelvin);
  return `#${n.color
    .map((c, l) => c + (o.color[l] - c) * i)
    .map(gt)
    .join("")}`;
}
function ot(e) {
  const s = (e == null ? void 0 : e.state.toLowerCase()) === "on",
    r = So(e),
    o =
      ["rgb_color", "rgbw_color", "rgbww_color"].some(
        (b) => Ce(e, b).length >= 3,
      ) || Ce(e, "hs_color").length >= 2,
    n = $e(e, "brightness"),
    i =
      n !== void 0 ||
      r.some((b) =>
        [
          "brightness",
          "color_temp",
          "hs",
          "rgb",
          "rgbw",
          "rgbww",
          "xy",
          "white",
        ].includes(b),
      ),
    a = s ? He((n ?? 200) / 255, 0.04, 1) : 0,
    c = $e(e, "color_temp_kelvin"),
    l = $e(e, "color_temp"),
    f = $e(e, "min_color_temp_kelvin") ?? 2e3,
    u = Math.max(f, $e(e, "max_color_temp_kelvin") ?? 6500),
    h = c ?? (l && l > 0 ? 1e6 / l : 4e3),
    m = Math.round(He(h, f, u)),
    y = c !== void 0 || l !== void 0 || r.includes("color_temp"),
    w =
      r.some((b) => ["hs", "rgb", "rgbw", "rgbww", "xy"].includes(b)) ||
      Ce(e, "rgb_color").length >= 3 ||
      Ce(e, "hs_color").length >= 2;
  const chromaticity = resolveLightChromaticity(e, Go(m), {warm:Go(f),cold:Go(u)});
  return {
    brightness: a,
    brightnessPercent: s ? Math.round(a * 100) : 0,
    color: chromaticity.color,
    colorTempKelvin: m,
    hasBrightness: i,
    hasColor: w,
    hasColorTemperature: y,
    isOn: s,
    usesColor: chromaticity.usesColor,
  };
}
function vt(e) {
  if (!e.isOn) return "关闭";
  const s = [
    e.hasBrightness ? `${e.brightnessPercent}%` : void 0,
    e.usesColor
      ? "彩色"
      : e.hasColorTemperature
        ? `${e.colorTempKelvin}K`
        : void 0,
  ].filter(Boolean);
  return s.length ? s.join(" · ") : "开启";
}
class Lo {
  constructor(s, r = {}) {
    this.enabled = !0;
    const o = r.defaultThickness !== void 0 ? r.defaultThickness : 0.003,
      n = new Re().fromArray(
        r.defaultColor !== void 0 ? r.defaultColor : [0, 0, 0],
      ),
      i = r.defaultAlpha !== void 0 ? r.defaultAlpha : 1,
      a = r.defaultKeepAlive !== void 0 ? r.defaultKeepAlive : !1,
      c = {},
      l = 60,
      f = {},
      u = {},
      h = {
        outlineThickness: { value: o },
        outlineColor: { value: n },
        outlineAlpha: { value: i },
      },
      m = [
        "#include <common>",
        "#include <uv_pars_vertex>",
        "#include <displacementmap_pars_vertex>",
        "#include <fog_pars_vertex>",
        "#include <morphtarget_pars_vertex>",
        "#include <skinning_pars_vertex>",
        "#include <logdepthbuf_pars_vertex>",
        "#include <clipping_planes_pars_vertex>",
        "uniform float outlineThickness;",
        "vec4 calculateOutline( vec4 pos, vec3 normal, vec4 skinned ) {",
        "	float thickness = outlineThickness;",
        "	const float ratio = 1.0;",
        "	vec4 pos2 = projectionMatrix * modelViewMatrix * vec4( skinned.xyz + normal, 1.0 );",
        "	vec4 norm = normalize( pos - pos2 );",
        "	return pos + norm * thickness * pos.w * ratio;",
        "}",
        "void main() {",
        "	#include <uv_vertex>",
        "	#include <beginnormal_vertex>",
        "	#include <morphnormal_vertex>",
        "	#include <skinbase_vertex>",
        "	#include <skinnormal_vertex>",
        "	#include <begin_vertex>",
        "	#include <morphtarget_vertex>",
        "	#include <skinning_vertex>",
        "	#include <displacementmap_vertex>",
        "	#include <project_vertex>",
        "	vec3 outlineNormal = - objectNormal;",
        "	gl_Position = calculateOutline( gl_Position, outlineNormal, vec4( transformed, 1.0 ) );",
        "	#include <logdepthbuf_vertex>",
        "	#include <clipping_planes_vertex>",
        "	#include <fog_vertex>",
        "}",
      ].join(`
`),
      y = [
        "#include <common>",
        "#include <fog_pars_fragment>",
        "#include <logdepthbuf_pars_fragment>",
        "#include <clipping_planes_pars_fragment>",
        "uniform vec3 outlineColor;",
        "uniform float outlineAlpha;",
        "void main() {",
        "	#include <clipping_planes_fragment>",
        "	#include <logdepthbuf_fragment>",
        "	gl_FragColor = vec4( outlineColor, outlineAlpha );",
        "	#include <tonemapping_fragment>",
        "	#include <colorspace_fragment>",
        "	#include <fog_fragment>",
        "	#include <premultiplied_alpha_fragment>",
        "}",
      ].join(`
`);
    function w() {
      return new Ys({
        type: "OutlineEffect",
        uniforms: Zs.merge([Ot.fog, Ot.displacementmap, h]),
        vertexShader: m,
        fragmentShader: y,
        side: Xs,
      });
    }
    function b(d) {
      let g = c[d.uuid];
      return (
        g === void 0 &&
          ((g = { material: w(), used: !0, keepAlive: a, count: 0 }),
          (c[d.uuid] = g)),
        (g.used = !0),
        g.material
      );
    }
    function j(d) {
      const g = b(d);
      return ((f[g.uuid] = d), N(g, d), g);
    }
    function x(d) {
      const g = d.geometry,
        _ = g !== void 0 && g.attributes.normal !== void 0;
      return d.isMesh === !0 && d.material !== void 0 && _ === !0;
    }
    function k(d) {
      if (x(d) !== !1) {
        if (Array.isArray(d.material))
          for (let g = 0, _ = d.material.length; g < _; g++)
            d.material[g] = j(d.material[g]);
        else d.material = j(d.material);
        ((u[d.uuid] = d.onBeforeRender), (d.onBeforeRender = C));
      }
    }
    function G(d) {
      if (x(d) !== !1) {
        if (Array.isArray(d.material))
          for (let g = 0, _ = d.material.length; g < _; g++)
            d.material[g] = f[d.material[g].uuid];
        else d.material = f[d.material.uuid];
        d.onBeforeRender = u[d.uuid];
      }
    }
    function C(d, g, _, M, p) {
      const v = f[p.uuid];
      v !== void 0 && O(p, v);
    }
    function O(d, g) {
      const _ = g.userData.outlineParameters;
      ((d.uniforms.outlineAlpha.value = g.opacity),
        _ !== void 0 &&
          (_.thickness !== void 0 &&
            (d.uniforms.outlineThickness.value = _.thickness),
          _.color !== void 0 &&
            d.uniforms.outlineColor.value.fromArray(_.color),
          _.alpha !== void 0 && (d.uniforms.outlineAlpha.value = _.alpha)),
        g.displacementMap &&
          ((d.uniforms.displacementMap.value = g.displacementMap),
          (d.uniforms.displacementScale.value = g.displacementScale),
          (d.uniforms.displacementBias.value = g.displacementBias)));
    }
    function N(d, g) {
      if (d.name === "invisible") return;
      const _ = g.userData.outlineParameters;
      ((d.fog = g.fog),
        (d.toneMapped = g.toneMapped),
        (d.premultipliedAlpha = g.premultipliedAlpha),
        (d.displacementMap = g.displacementMap),
        _ !== void 0
          ? (g.visible === !1
              ? (d.visible = !1)
              : (d.visible = _.visible !== void 0 ? _.visible : !0),
            (d.transparent =
              _.alpha !== void 0 && _.alpha < 1 ? !0 : g.transparent),
            _.keepAlive !== void 0 && (c[g.uuid].keepAlive = _.keepAlive))
          : ((d.transparent = g.transparent), (d.visible = g.visible)),
        (g.wireframe === !0 || g.depthTest === !1) && (d.visible = !1),
        g.clippingPlanes &&
          ((d.clipping = !0),
          (d.clippingPlanes = g.clippingPlanes),
          (d.clipIntersection = g.clipIntersection),
          (d.clipShadows = g.clipShadows)),
        (d.version = g.version));
    }
    function E() {
      let d;
      d = Object.keys(f);
      for (let g = 0, _ = d.length; g < _; g++) f[d[g]] = void 0;
      d = Object.keys(u);
      for (let g = 0, _ = d.length; g < _; g++) u[d[g]] = void 0;
      d = Object.keys(c);
      for (let g = 0, _ = d.length; g < _; g++) {
        const M = d[g];
        c[M].used === !1
          ? (c[M].count++,
            c[M].keepAlive === !1 && c[M].count > l && delete c[M])
          : ((c[M].used = !1), (c[M].count = 0));
      }
    }
    this.setThickness = (value) => updateOutlineThickness(h, c, value);
    this.dispose = () => { for (const entry of Object.values(c)) entry.material.dispose(); };
    ((this.render = function (d, g) {
      if (this.enabled === !1) {
        s.render(d, g);
        return;
      }
      const _ = s.autoClear;
      ((s.autoClear = this.autoClear),
        s.render(d, g),
        (s.autoClear = _),
        this.renderOutline(d, g));
    }),
      (this.renderOutline = function (d, g) {
        const _ = s.autoClear,
          M = d.matrixWorldAutoUpdate,
          p = d.background,
          v = s.shadowMap.enabled;
        ((d.matrixWorldAutoUpdate = !1),
          (d.background = null),
          (s.autoClear = !1),
          (s.shadowMap.enabled = !1),
          d.traverse(k),
          s.render(d, g),
          d.traverse(G),
          E(),
          (d.matrixWorldAutoUpdate = M),
          (d.background = p),
          (s.autoClear = _),
          (s.shadowMap.enabled = v));
      }),
      (this.autoClear = s.autoClear),
      (this.domElement = s.domElement),
      (this.shadowMap = s.shadowMap),
      (this.clear = function (d, g, _) {
        s.clear(d, g, _);
      }),
      (this.getPixelRatio = function () {
        return s.getPixelRatio();
      }),
      (this.setPixelRatio = function (d) {
        s.setPixelRatio(d);
      }),
      (this.getSize = function (d) {
        return s.getSize(d);
      }),
      (this.setSize = function (d, g, _) {
        s.setSize(d, g, _);
      }),
      (this.setViewport = function (d, g, _, M) {
        s.setViewport(d, g, _, M);
      }),
      (this.setScissor = function (d, g, _, M) {
        s.setScissor(d, g, _, M);
      }),
      (this.setScissorTest = function (d) {
        s.setScissorTest(d);
      }),
      (this.setRenderTarget = function (d) {
        s.setRenderTarget(d);
      }));
  }
}
const fa = {
    environment: "环境",
    lighting: "照明",
    shade: "遮阳",
    security: "安防",
  },
  mt = [
    {
      capability: "environment",
      role: "temperature",
      label: "温度",
      description: "房间温度传感器或空调当前温度",
      domains: ["sensor", "climate"],
      deviceClasses: ["temperature"],
      units: ["°c", "℃"],
      keywords: ["temperature", "temp", "温度"],
      aggregation: "avg",
    },
    {
      capability: "environment",
      role: "humidity",
      label: "湿度",
      description: "房间湿度传感器",
      domains: ["sensor"],
      deviceClasses: ["humidity"],
      units: ["%"],
      keywords: ["humidity", "湿度"],
      aggregation: "avg",
    },
    {
      capability: "environment",
      role: "pm25",
      label: "PM2.5",
      description: "颗粒物传感器",
      domains: ["sensor"],
      deviceClasses: ["pm25"],
      keywords: ["pm2.5", "pm25", "颗粒物"],
      aggregation: "avg",
    },
    {
      capability: "environment",
      role: "co2",
      label: "CO₂",
      description: "二氧化碳传感器",
      domains: ["sensor"],
      deviceClasses: ["carbon_dioxide"],
      keywords: ["co2", "carbon dioxide", "二氧化碳"],
      aggregation: "avg",
    },
    {
      capability: "environment",
      role: "voc",
      label: "VOC",
      description: "挥发性有机物传感器",
      domains: ["sensor"],
      deviceClasses: ["volatile_organic_compounds"],
      keywords: ["voc", "tvoc", "甲醛", "挥发"],
      aggregation: "avg",
    },
    {
      capability: "environment",
      role: "illuminance",
      label: "照度",
      description: "光照/照度传感器",
      domains: ["sensor"],
      deviceClasses: ["illuminance"],
      keywords: ["illuminance", "lux", "照度", "光照"],
      aggregation: "avg",
    },
    {
      capability: "lighting",
      role: "main",
      label: "主灯",
      description: "房间主要照明",
      domains: ["light", "switch"],
      keywords: ["main", "ceiling", "主灯", "吸顶灯", "灯"],
      aggregation: "latest",
    },
    {
      capability: "lighting",
      role: "ambient",
      label: "氛围灯",
      description: "灯带、筒灯或辅助照明",
      domains: ["light", "switch"],
      keywords: ["strip", "ambient", "氛围", "灯带", "射灯", "筒灯"],
      aggregation: "latest",
    },
    {
      capability: "lighting",
      role: "scene",
      label: "灯光场景",
      description: "Home Assistant 场景实体",
      domains: ["scene"],
      keywords: ["scene", "场景"],
      aggregation: "latest",
    },
    {
      capability: "shade",
      role: "curtain",
      label: "窗帘",
      description: "窗帘、卷帘、遮阳帘",
      domains: ["cover"],
      deviceClasses: ["curtain", "shade"],
      keywords: ["curtain", "shade", "窗帘", "遮阳"],
      aggregation: "latest",
    },
    {
      capability: "shade",
      role: "blind",
      label: "百叶",
      description: "百叶帘或可调角度遮阳",
      domains: ["cover"],
      deviceClasses: ["blind", "shutter"],
      keywords: ["blind", "shutter", "百叶"],
      aggregation: "latest",
    },
    {
      capability: "security",
      role: "motion",
      label: "人体/移动",
      description: "移动、人体或占用传感器",
      domains: ["binary_sensor"],
      deviceClasses: ["motion", "occupancy"],
      keywords: ["motion", "人体", "移动"],
      aggregation: "latest",
    },
    {
      capability: "security",
      role: "presence",
      label: "存在",
      description: "存在检测或毫米波传感器",
      domains: ["binary_sensor", "sensor"],
      deviceClasses: ["presence", "occupancy"],
      keywords: ["presence", "occupancy", "存在", "人在"],
      aggregation: "latest",
    },
    {
      capability: "security",
      role: "doorWindow",
      label: "门窗",
      description: "门窗开合传感器",
      domains: ["binary_sensor"],
      deviceClasses: ["door", "window", "opening"],
      keywords: ["door", "window", "门", "窗"],
      aggregation: "latest",
    },
    {
      capability: "security",
      role: "camera",
      label: "摄像头",
      description: "摄像头实体",
      domains: ["camera"],
      keywords: ["camera", "摄像"],
      aggregation: "latest",
    },
    {
      capability: "security",
      role: "lock",
      label: "门锁",
      description: "门锁实体",
      domains: ["lock"],
      keywords: ["lock", "锁"],
      aggregation: "latest",
    },
    {
      capability: "security",
      role: "alarm",
      label: "布撤防",
      description: "安防面板",
      domains: ["alarm_control_panel"],
      keywords: ["alarm", "安防", "报警"],
      aggregation: "latest",
    },
  ],
  $o = {
    environment: ["sensor", "climate"],
    lighting: ["light", "scene"],
    shade: ["cover"],
    security: ["alarm_control_panel", "binary_sensor", "camera", "lock"],
  },
  cs = (e) => (typeof e == "string" ? e.trim().toLowerCase() : ""),
  Eo = (e) => `${e.entityId} ${e.name}`.toLowerCase(),
  No = (e) => cs(e.attributes.device_class),
  Oo = (e) => cs(e.attributes.unit_of_measurement);
function ls(e, s) {
  return (e == null ? void 0 : e[s]) ?? {};
}
function zo(e, s) {
  return mt.find((r) => r.capability === e && r.role === s);
}
function pe(e, s, r) {
  var o;
  return ((o = ls(e.bindings, s)[r]) == null ? void 0 : o.entityIds) ?? [];
}
function To(e, s) {
  const r = s ? [ls(e.bindings, s)] : Object.values(e.bindings ?? {});
  return [
    ...new Set(r.flatMap((o) => Object.values(o).flatMap((n) => n.entityIds))),
  ];
}
function Io(e, s, r, o) {
  return Ro(e, s, r, o ? [o] : []);
}
function Ro(e, s, r, o) {
  const n = { ...(e.bindings ?? {}) },
    i = { ...(n[s] ?? {}) },
    a = [...new Set(o.filter(Boolean))];
  if (a.length) {
    const l = zo(s, r);
    i[r] = { entityIds: a, aggregation: l == null ? void 0 : l.aggregation };
  } else delete i[r];
  n[s] = Object.keys(i).length ? i : void 0;
  const c = Object.fromEntries(
    Object.entries(n).filter(([, l]) => l && Object.keys(l).length),
  );
  return { ...e, bindings: Object.keys(c).length ? c : void 0 };
}
function Fo(e, s, r) {
  return To(e, r)
    .map((o) => s[o])
    .filter((o) => !!o);
}
function Pe(e, s, r, o) {
  const n = Fo(e, r, o),
    i = s.devices
      .filter((a) => a.roomId === e.id)
      .map((a) => ({ device: a, entity: r[a.entityId] }))
      .filter(({ device: a, entity: c }) => {
        var l;
        return !!(
          c &&
          ($o[o].includes(c.domain) ||
            (o === "lighting" &&
              (l = a.modelId) != null &&
              l.startsWith("switch.light.")))
        );
      })
      .map(({ entity: a }) => a);
  return [...new Map([...n, ...i].map((a) => [a.entityId, a])).values()];
}
function xt(e, s, r, o) {
  var f, u, h;
  if (!s.domains.includes(e.domain)) return 0;
  const n = No(e),
    i = Oo(e),
    a = Eo(e),
    c =
      ((f = s.keywords) == null
        ? void 0
        : f.some((m) => a.includes(m.toLowerCase()))) ?? !1;
  if (s.capability === "lighting" && e.domain === "switch" && !c) return 0;
  let l = 2;
  return (
    r && e.areaId === r && (l += 20),
    o && a.includes(o.toLowerCase()) && (l += 4),
    (u = s.deviceClasses) != null &&
      u.some((m) => n === m || n.includes(m)) &&
      (l += 14),
    (h = s.units) != null && h.some((m) => i === m) && (l += 8),
    c && (l += 8),
    (e.state === "unavailable" || e.state === "unknown") && (l -= 12),
    l
  );
}
function Ho(e, s, r, o) {
  var i;
  return (i = e
    .map((a) => ({ entity: a, score: xt(a, s, r, o) }))
    .filter((a) => a.score > 2)
    .sort(
      (a, c) => c.score - a.score || a.entity.name.localeCompare(c.entity.name),
    )[0]) == null
    ? void 0
    : i.entity;
}
function pa(e, s, r, o) {
  return [...e]
    .filter((n) => s.domains.includes(n.domain))
    .sort(
      (n, i) => xt(i, s, r, o) - xt(n, s, r, o) || n.name.localeCompare(i.name),
    );
}
function ga(e, s, r) {
  const o = Object.values(s);
  return (r ? mt.filter((i) => i.capability === r) : mt).reduce((i, a) => {
    if (pe(i, a.capability, a.role).length) return i;
    const c = Ho(o, a, i.haAreaId, i.name);
    return Io(i, a.capability, a.role, c == null ? void 0 : c.entityId);
  }, e);
}
const me = (e) => {
    if (typeof e == "number" && Number.isFinite(e)) return e;
    if (typeof e == "string") {
      const s = Number.parseFloat(e);
      return Number.isFinite(s) ? s : void 0;
    }
  },
  nt = (e) => `${e.entityId} ${e.name}`.toLowerCase(),
  ds = (e, s) =>
    typeof e.attributes[s] == "string"
      ? `${e.attributes[s]}`.toLowerCase()
      : "",
  _t = (e) => ds(e, "unit_of_measurement").trim(),
  it = (e) => ds(e, "device_class").trim(),
  oe = (e) => (e.length ? e.reduce((s, r) => s + r, 0) / e.length : void 0),
  Bo = (e, s) => {
    if (e.length)
      return s === "min"
        ? Math.min(...e)
        : s === "max"
          ? Math.max(...e)
          : s === "latest"
            ? e.at(-1)
            : oe(e);
  };
function Ao(e) {
  if (e.domain === "climate")
    return me(e.attributes.current_temperature) ?? me(e.attributes.temperature);
  const s = _t(e),
    r = it(e),
    o = nt(e);
  return r === "temperature" ||
    s === "°c" ||
    s === "°f" ||
    o.includes("temperature") ||
    o.includes("温度")
    ? me(e.state)
    : void 0;
}
function Do(e) {
  const s = _t(e),
    r = it(e),
    o = nt(e);
  return r === "humidity" ||
    (s === "%" && (o.includes("humidity") || o.includes("湿度")))
    ? me(e.state)
    : void 0;
}
function Wo(e, s) {
  const r = it(e),
    o = nt(e);
  if (
    (s === "pm25" &&
      (r === "pm25" || o.includes("pm2.5") || o.includes("pm25"))) ||
    (s === "co2" &&
      (r === "carbon_dioxide" ||
        o.includes("co2") ||
        o.includes("二氧化碳"))) ||
    (s === "voc" &&
      (r === "volatile_organic_compounds" ||
        o.includes("voc") ||
        o.includes("tvoc")))
  )
    return me(e.state);
}
function Vo(e) {
  const s = _t(e),
    r = it(e),
    o = nt(e);
  return r === "illuminance" ||
    s === "lx" ||
    o.includes("illuminance") ||
    o.includes("lux") ||
    o.includes("照度") ||
    o.includes("光照")
    ? me(e.state)
    : void 0;
}
const Mt = (e) =>
  e.pm25 === void 0 &&
  e.co2 === void 0 &&
  e.voc === void 0 &&
  e.humidity === void 0
    ? "--"
    : (e.pm25 ?? 0) > 75 ||
        (e.co2 ?? 0) > 1500 ||
        (e.voc ?? 0) > 1e3 ||
        (e.humidity ?? 0) > 72
      ? "中"
      : (e.pm25 ?? 0) > 35 ||
          (e.co2 ?? 0) > 1e3 ||
          (e.voc ?? 0) > 500 ||
          (e.humidity ?? 0) > 66
        ? "良"
        : "优";
function ne(e, s) {
  return e
    .map((r) =>
      s === "temperature"
        ? Ao(r)
        : s === "humidity"
          ? Do(r)
          : s === "illuminance"
            ? Vo(r)
            : Wo(r, s),
    )
    .filter((r) => typeof r == "number");
}
function ke(e, s, r) {
  var i, a;
  const o =
    (a = (i = e.bindings) == null ? void 0 : i.environment) == null
      ? void 0
      : a[r];
  if (!o) return;
  const n = ne(
    o.entityIds.map((c) => s[c]).filter((c) => !!c),
    r,
  );
  return Bo(n, o.aggregation);
}
function Ft(e, s) {
  const r = ne(s, "temperature"),
    o = ne(s, "humidity"),
    n = oe(ne(s, "pm25")),
    i = oe(ne(s, "co2")),
    a = oe(ne(s, "voc")),
    c = oe(ne(s, "illuminance")),
    l = oe(r),
    f = oe(o);
  if (!(
    l === void 0 &&
    f === void 0 &&
    n === void 0 &&
    i === void 0 &&
    a === void 0 &&
    c === void 0
  ))
    return {
      temperature: l,
      humidity: f,
      pm25: n,
      co2: i,
      voc: a,
      illuminance: c,
      quality: Mt({ humidity: f, pm25: n, co2: i, voc: a }),
      source: e,
    };
}
function hs(e, s, r) {
  if (
    pe(e, "environment", "temperature").length ||
    pe(e, "environment", "humidity").length ||
    pe(e, "environment", "pm25").length ||
    pe(e, "environment", "co2").length ||
    pe(e, "environment", "voc").length ||
    pe(e, "environment", "illuminance").length
  ) {
    const l = ke(e, r, "temperature"),
      f = ke(e, r, "humidity"),
      u = ke(e, r, "pm25"),
      h = ke(e, r, "co2"),
      m = ke(e, r, "voc"),
      y = ke(e, r, "illuminance");
    return {
      temperature: l,
      humidity: f,
      pm25: u,
      co2: h,
      voc: m,
      illuminance: y,
      quality: Mt({ humidity: f, pm25: u, co2: h, voc: m }),
      source: "binding",
    };
  }
  const n = Pe(e, s, r, "environment"),
    i = Ft("device", n);
  if (i) return i;
  const a = e.haAreaId
      ? Object.values(r).filter(
          (l) =>
            l.areaId === e.haAreaId && ["sensor", "climate"].includes(l.domain),
        )
      : [],
    c = Ft("area", a);
  return c || { quality: "--", source: "unconfigured" };
}
function ma(e, s) {
  const r =
      (s == null
        ? void 0
        : s.floors.flatMap((x) => x.rooms.map((k) => hs(k, x, e)))) ?? [],
    o = Object.values(e),
    n = r.map((x) => x.temperature).filter((x) => typeof x == "number"),
    i = r.map((x) => x.humidity).filter((x) => typeof x == "number"),
    a = ne(o, "temperature"),
    c = ne(o, "humidity"),
    l = n.length ? n : a,
    f = i.length ? i : c,
    u = oe(l),
    h = oe(f),
    m = oe(ne(o, "pm25")),
    y = oe(ne(o, "co2")),
    w = oe(ne(o, "voc")),
    b = l.length ? Math.min(...l) : void 0,
    j = l.length ? Math.max(...l) : void 0;
  return {
    temperature: u,
    humidity: h,
    temperatureRange:
      b !== void 0 && j !== void 0
        ? `${b.toFixed(1)} - ${j.toFixed(1)}°`
        : "--",
    humidityRange: f.length
      ? `${Math.min(...f).toFixed(0)} - ${Math.max(...f).toFixed(0)}%`
      : "--",
    airQuality: Mt({ humidity: h, pm25: m, co2: y, voc: w }),
  };
}
function us(e, s, r) {
  return hs(e, s, r);
}
const Ko = {
    background: "#405f91",
    fog: "#5d7cae",
    ground: "#6d88b3",
    wallColor: "#d7e2f1",
    wallOpacity: 0.28,
    wallEdgeColor: "#f7fbff",
    wallEdgeOpacity: 0.14,
    floorPalette: ["#7e90ae", "#8797b4", "#8d9db9", "#7789a9", "#8394b2"],
    roomHighlight: "#a6b8d4",
    roomAccent: "#8f9fbd",
    roomEdgeColor: "#fbfdff",
    foundation: "#526985",
    furnitureMain: "#b7c3d4",
    furnitureDetail: "#74849c",
    deviceBody: "#f8fbff",
    glow: "#eef7ff",
  },
  Uo = {
    background: "#587db2",
    fog: "#7290bd",
    ground: "#7893bb",
    wallColor: "#dbe5f3",
    wallOpacity: 0.28,
    wallEdgeColor: "#fbfdff",
    wallEdgeOpacity: 0.14,
    floorPalette: ["#8192b0", "#8a9ab6", "#91a0bc", "#788aa8", "#8495b3"],
    roomHighlight: "#a9bad5",
    roomAccent: "#91a3bf",
    roomEdgeColor: "#ffffff",
    foundation: "#536b89",
    furnitureMain: "#bac6d7",
    furnitureDetail: "#75869d",
    deviceBody: "#fbfdff",
    glow: "#f4fbff",
  },
  Ee = {
    background: "#cfe9ff",
    fog: "#cbe8fb",
    ground: "#b8dcf2",
    wallColor: "#fff3df",
    wallOpacity: 0.94,
    wallEdgeColor: "#31445e",
    wallEdgeOpacity: 0.56,
    floorPalette: ["#f7dca5", "#bfe3cf", "#ffc7bc", "#bed8ff", "#dfcdf8"],
    roomHighlight: "#ffe09d",
    roomAccent: "#ffd3a7",
    roomEdgeColor: "#3f5068",
    foundation: "#9ab8d3",
    furnitureMain: "#f4b07f",
    furnitureDetail: "#6f8fbc",
    deviceBody: "#fff8ee",
    glow: "#ffbd66",
  };
function qo(e) {
  return e === "lighting"
    ? {
        ...Ee,
        background: "#ffd994",
        fog: "#f6d9a4",
        ground: "#edc47f",
        wallColor: "#ffe8bd",
        floorPalette: ["#f2bd64", "#f7cc82", "#efb981", "#eec26e", "#f9d99a"],
        roomAccent: "#f2b657",
        roomHighlight: "#ffd477",
        roomEdgeColor: "#2f415c",
        wallEdgeColor: "#2f415c",
        wallEdgeOpacity: 0.62,
        furnitureMain: "#f1a166",
        furnitureDetail: "#916b5f",
        glow: "#ffb12f",
      }
    : e === "shade"
      ? {
          ...Ee,
          background: "#b9dfff",
          fog: "#d8efff",
          ground: "#a7cce8",
          floorPalette: ["#afd0f0", "#b7d9ef", "#a9d6e8", "#c5d5f5", "#b7e0f2"],
          roomAccent: "#94c6e8",
          furnitureMain: "#77b7d8",
          furnitureDetail: "#416f99",
          glow: "#50b8ff",
        }
      : e === "environment"
        ? {
            ...Ee,
            background: "#cdeedc",
            fog: "#e4f8ec",
            ground: "#b8dec8",
            floorPalette: [
              "#c7eac6",
              "#b9e1cf",
              "#d8edb8",
              "#bce5df",
              "#d0e6ba",
            ],
            roomAccent: "#aee1bb",
            furnitureMain: "#8fd0a2",
            furnitureDetail: "#5a9071",
            glow: "#61d49a",
          }
        : e === "security"
          ? {
              ...Ee,
              background: "#bfc6ea",
              fog: "#dce1fb",
              ground: "#aeb9df",
              floorPalette: [
                "#c8c1ea",
                "#d3bddf",
                "#c3c9ef",
                "#dac1df",
                "#bfcdea",
              ],
              roomAccent: "#d9aac2",
              furnitureMain: "#9fa8d4",
              furnitureDetail: "#665d94",
              glow: "#ff7890",
            }
          : Ee;
}
const Ne = {
  background: "#e7dfd0",
  fog: "#efe7d8",
  ground: "#d8cbb8",
  wallColor: "#f4efe5",
  wallOpacity: 0.86,
  wallEdgeColor: "#8c8374",
  wallEdgeOpacity: 0.18,
  floorPalette: ["#e8d3ad", "#eadac0", "#ddc79f", "#efe1c9", "#d8bd8e"],
  roomHighlight: "#f2d797",
  roomAccent: "#e5c28b",
  roomEdgeColor: "#8a7f70",
  foundation: "#b5aa99",
  furnitureMain: "#d1a870",
  furnitureDetail: "#8d7b65",
  deviceBody: "#f9f5ec",
  glow: "#f4b956",
};
function Yo(e) {
  return e === "lighting"
    ? {
        ...Ne,
        background: "#eadbc2",
        fog: "#f1dfc1",
        ground: "#d7bd92",
        floorPalette: ["#e8bd77", "#efd09d", "#dfb577", "#ead0a4", "#d9ad6e"],
        roomHighlight: "#f6cd76",
        roomAccent: "#e7b96f",
        glow: "#f2a93c",
      }
    : e === "shade"
      ? {
          ...Ne,
          background: "#d9ddd5",
          fog: "#e8e6dc",
          ground: "#c8c5b4",
          floorPalette: ["#d8cbb1", "#e4d7bd", "#d1c4aa", "#e9dfcc", "#c8b79b"],
          roomAccent: "#c9bda9",
          glow: "#b8a180",
        }
      : e === "environment"
        ? {
            ...Ne,
            background: "#e1e4d4",
            fog: "#edf0df",
            ground: "#cbd2b8",
            floorPalette: [
              "#d7d4ad",
              "#e2dcc0",
              "#cbd8b9",
              "#eadfbd",
              "#d3c49f",
            ],
            roomAccent: "#d7cfa4",
            glow: "#c7b36b",
          }
        : e === "security"
          ? {
              ...Ne,
              background: "#dfd9d0",
              fog: "#eee5dc",
              ground: "#c9beb1",
              floorPalette: [
                "#dcc8b1",
                "#e5d5c4",
                "#d2bdab",
                "#eadccc",
                "#c9b6a4",
              ],
              roomAccent: "#d9b9a2",
              glow: "#d89176",
            }
          : Ne;
}
function at(e, s = "overview", r = "glass") {
  if (r === "cartoon") return qo(s);
  if (r === "cream") return Yo(s);
  const o = e === "night" ? Ko : Uo;
  return s === "lighting"
    ? {
        ...o,
        background: e === "night" ? "#080817" : "#5879ad",
        fog: e === "night" ? "#0c0c20" : "#6685b4",
        ground: e === "night" ? "#080817" : "#5879ad",
        wallColor: e === "night" ? "#6d6c94" : "#c9d3e0",
        wallEdgeColor: e === "night" ? "#d8c9b0" : "#eef3ff",
        wallOpacity: e === "night" ? 0.4 : 0.42,
        wallEdgeOpacity: e === "night" ? 0.045 : 0.04,
        floorPalette:
          e === "night"
            ? ["#383247", "#40384c", "#473e51", "#3b3448", "#44394d"]
            : ["#647793", "#6b7e99", "#72859f", "#60738f", "#6e809a"],
        roomAccent: e === "night" ? "#584841" : "#929db5",
        roomEdgeColor: e === "night" ? "#d8c9b0" : "#f4f7ff",
        furnitureMain: e === "night" ? "#47445c" : "#bac8d8",
        furnitureDetail: e === "night" ? "#29283b" : "#7a8da6",
        glow: "#ffd08a",
      }
    : s === "shade"
      ? {
          ...o,
          background: "#080c22",
          fog: "#0c122b",
          ground: "#080c22",
          wallColor: "#6d7e9f",
          wallOpacity: 0.4,
          floorPalette: ["#1d3151", "#213858", "#263f60", "#1e3556", "#273e60"],
          roomAccent: "#2a405e",
          wallEdgeColor: "#b6c9e8",
          wallEdgeOpacity: 0.045,
          roomEdgeColor: "#b8e7ff",
          furnitureMain: "#425873",
          furnitureDetail: "#263a53",
          glow: "#83d8ff",
        }
      : s === "environment"
        ? {
            ...o,
            background: "#5579ae",
            fog: "#6f8fbd",
            ground: "#7895bf",
            wallColor: "#dce7f4",
            wallOpacity: 0.27,
            wallEdgeOpacity: 0.14,
            floorPalette: [
              "#8395b4",
              "#8d9db9",
              "#94a4bf",
              "#7b8ead",
              "#8798b6",
            ],
            roomAccent: "#97a9c5",
            wallEdgeColor: "#f7fcff",
            furnitureMain: "#bac6d8",
            furnitureDetail: "#76879f",
            foundation: "#566f91",
            glow: "#c4e9ff",
          }
        : s === "security"
          ? {
              ...o,
              background: "#070a1d",
              fog: "#0b0f27",
              ground: "#070a1d",
              wallColor: "#6f7799",
              wallOpacity: 0.4,
              wallEdgeColor: "#c0b8d3",
              wallEdgeOpacity: 0.045,
              floorPalette: [
                "#1a213d",
                "#1d2644",
                "#222b4b",
                "#1b2340",
                "#222943",
              ],
              roomAccent: "#3c2c4f",
              furnitureMain: "#303952",
              furnitureDetail: "#1c2339",
              foundation: "#0e142b",
              glow: "#ff708a",
            }
          : o;
}
const Xo = {
    alarm_control_panel: "安防",
    automation: "自动化",
    binary_sensor: "感应器",
    button: "按钮",
    conversation: "语音助手",
    device_tracker: "定位",
    event: "事件",
    light: "灯光",
    lock: "门锁",
    switch: "开关",
    cover: "窗帘",
    climate: "空调",
    sensor: "传感器",
    camera: "摄像头",
    fan: "风扇",
    media_player: "影音设备",
    vacuum: "扫地机器人",
    notify: "通知",
    number: "数值",
    person: "成员",
    script: "脚本",
    scene: "场景",
    select: "选项",
    sun: "日照",
    tag: "标签",
    tts: "语音播报",
    update: "更新",
    weather: "天气",
    zone: "区域",
  },
  Zo = {
    apparent_power: "视在功率",
    aqi: "空气质量",
    atmospheric_pressure: "气压",
    battery: "电量",
    carbon_dioxide: "二氧化碳",
    carbon_monoxide: "一氧化碳",
    current: "电流",
    door: "门磁",
    energy: "能耗",
    gas: "燃气",
    humidity: "湿度",
    illuminance: "照度",
    moisture: "水浸",
    motion: "人体感应",
    pm1: "PM1",
    pm10: "PM10",
    pm25: "PM2.5",
    power: "功率",
    pressure: "压力",
    signal_strength: "信号",
    smoke: "烟雾",
    temperature: "温度",
    voltage: "电压",
    window: "窗磁",
  },
  Qo = {
    on: "已开启",
    off: "已关闭",
    open: "已打开",
    closed: "已关闭",
    opening: "正在打开",
    closing: "正在关闭",
    unavailable: "离线",
    unknown: "状态未知",
    idle: "待机",
    standby: "待机",
    normal: "正常",
    auto: "自动",
    cool: "制冷",
    heat: "制热",
    dry: "除湿",
    fan_only: "送风",
    playing: "播放中",
    paused: "已暂停",
    cleaning: "清扫中",
    docked: "已回充",
    returning: "回充中",
    error: "异常",
    home: "在家",
    not_home: "离家",
  },
  Jo = {
    alarm_control_panel: ts,
    binary_sensor: Rt,
    light: es,
    lock: Or,
    switch: go,
    cover: Wr,
    climate: Fe,
    sensor: Rt,
    camera: pr,
    fan: rt,
    media_player: to,
    person: yo,
    vacuum: hr,
    scene: ho,
  };
function Be(e) {
  return Xo[e] ?? "智能设备";
}
function en(e) {
  const s = e.attributes.device_class;
  return typeof s == "string" && s.trim() ? s.trim().toLowerCase() : void 0;
}
function tn(e) {
  const s = en(e);
  if (s) return Zo[s] ?? s.replace(/_/g, " ");
}
function xa(e) {
  const s = tn(e);
  return s ? `${Be(e.domain)} · ${s}` : Be(e.domain);
}
function Ae(e) {
  const translated = e.stateLabels?.[e.state] ?? Qo[e.state];
  if (translated) return translated;
  if (e.domain === "sensor") {
    const s =
      typeof e.attributes.unit_of_measurement == "string"
        ? e.attributes.unit_of_measurement
        : "";
    return `${e.state}${s}`;
  }
  return Qo[e.state] ?? e.state;
}
function sn(e) {
  return ![
    "off",
    "closed",
    "idle",
    "paused",
    "unavailable",
    "unknown",
  ].includes(e.state);
}
function fs({ domain: e, size: s = 18 }) {
  const r = Jo[e] ?? br;
  return t.jsx(r, { size: s, "aria-hidden": "true" });
}
const ps = 0.96,
  gs = 0.25,
  Je = [1.16, 1.16],
  ya = 0.22,
  rn = (e) => e === "light.strip" || e === "switch.light.strip",
  on = (e) => (e === "ring" ? 3 : 2),
  nn = (e) => {
    var s;
    return Math.max(
      gs,
      Math.abs(((s = e.scale) == null ? void 0 : s[0]) ?? 1) * ps,
    );
  },
  ms = (e) => {
    var s;
    return -(((s = e.rotation) == null ? void 0 : s[1]) ?? 0);
  },
  ja = (e) => (ms(e) * 180) / Math.PI;
function an(e) {
  const s = [e.position[0], e.position[2]],
    r = nn(e) / 2,
    o = ms(e),
    n = [Math.cos(o) * r, Math.sin(o) * r];
  return { start: [s[0] - n[0], s[1] - n[1]], end: [s[0] + n[0], s[1] + n[1]] };
}
function Ve(e) {
  const s = e.lightStrip;
  return !!(s && s.points.length >= on(s.shape));
}
function xs(e) {
  return Ve(e) ? e.lightStrip.shape : "line";
}
function ys(e) {
  if (Ve(e)) return e.lightStrip.points.map((o) => [...o]);
  const { start: s, end: r } = an(e);
  return [s, r];
}
function js(e, s) {
  const r = [];
  for (let o = 0; o < e.length - 1; o += 1)
    r.push({ start: e[o], end: e[o + 1] });
  return (
    s === "ring" &&
      e.length >= 3 &&
      r.push({ start: e[e.length - 1], end: e[0] }),
    r
  );
}
function cn(e, s) {
  return js(e, s).reduce(
    (r, o) => r + Math.hypot(o.end[0] - o.start[0], o.end[1] - o.start[1]),
    0,
  );
}
function ba(e) {
  return cn(ys(e), xs(e));
}
function ln(e) {
  return e.length
    ? [
        e.reduce((s, r) => s + r[0], 0) / e.length,
        e.reduce((s, r) => s + r[1], 0) / e.length,
      ]
    : [0, 0];
}
function bs(e, s) {
  let r = !1;
  for (let o = 0, n = s.length - 1; o < s.length; n = o++) {
    const [i, a] = s[o],
      [c, l] = s[n];
    a > e[1] != l > e[1] &&
      e[0] < ((c - i) * (e[1] - a)) / (l - a || Number.EPSILON) + i &&
      (r = !r);
  }
  return r;
}
function wa(e, s, r, o) {
  var a, c;
  const n = ln(o),
    i = s.rooms.find((l) => bs(n, l.polygon));
  return {
    ...e,
    roomId: i == null ? void 0 : i.id,
    position: [n[0], e.position[1], n[1]],
    rotation: Ve(e) ? [0, 0, 0] : e.rotation,
    scale: [
      1,
      ((a = e.scale) == null ? void 0 : a[1]) ?? Je[0],
      ((c = e.scale) == null ? void 0 : c[2]) ?? Je[1],
    ],
    lightStrip: { shape: r, points: o.map((l) => [...l]) },
  };
}
function va(e, s, r, o) {
  var l, f, u, h;
  const n = Math.max(gs, Math.hypot(o[0] - r[0], o[1] - r[1])),
    i = Math.atan2(o[1] - r[1], o[0] - r[0]),
    a = [(r[0] + o[0]) / 2, (r[1] + o[1]) / 2],
    c = s.rooms.find((m) => bs(a, m.polygon));
  return {
    ...e,
    roomId: c == null ? void 0 : c.id,
    position: [a[0], e.position[1], a[1]],
    rotation: [
      ((l = e.rotation) == null ? void 0 : l[0]) ?? 0,
      -i,
      ((f = e.rotation) == null ? void 0 : f[2]) ?? 0,
    ],
    scale: [
      n / ps,
      ((u = e.scale) == null ? void 0 : u[1]) ?? Je[0],
      ((h = e.scale) == null ? void 0 : h[2]) ?? Je[1],
    ],
    lightStrip: void 0,
  };
}
const dn = new Set(["unavailable", "unknown", "offline"]),
  hn = new Set([
    "on",
    "open",
    "opening",
    "cool",
    "heat",
    "dry",
    "fan_only",
    "cleaning",
    "returning",
    "playing",
    "armed_home",
    "armed_away",
    "armed_night",
    "triggered",
  ]),
  un = new Set([
    "on",
    "open",
    "opening",
    "detected",
    "problem",
    "unsafe",
    "unlocked",
    "triggered",
    "armed_triggered",
  ]),
  ws = [
    "door",
    "window",
    "opening",
    "lock",
    "smoke",
    "gas",
    "moisture",
    "problem",
    "safety",
  ],
  vs = ["motion", "presence", "occupancy"],
  fn = new Set(["alarm_control_panel", "binary_sensor", "camera", "lock"]);
function he(e) {
  return (e == null ? void 0 : e.state.toLowerCase()) ?? "unknown";
}
function Ke(e) {
  return dn.has(he(e));
}
function _s(e, s) {
  const r = he(s);
  if (Ke(s)) return !1;
  if (hn.has(r)) return !0;
  if (e.kind === "sensor") return !1;
  const o = Number.parseFloat((s == null ? void 0 : s.state) ?? "");
  return (
    Number.isFinite(o) &&
    Math.abs(o) > 0 &&
    ["fan", "cover", "media_player"].includes(e.kind)
  );
}
function ct(e, s) {
  const r = "entityId" in e && "kind" in e ? e : void 0,
    o = s ?? ("domain" in e ? e : void 0),
    n = he(o),
    i =
      typeof (o == null ? void 0 : o.attributes.device_class) == "string"
        ? o.attributes.device_class.toLowerCase()
        : "",
    a =
      `${(o == null ? void 0 : o.name) ?? ""} ${(o == null ? void 0 : o.entityId) ?? ""}`.toLowerCase(),
    c = ws.some((h) => i.includes(h) || a.includes(h)),
    l = vs.some((h) => i.includes(h) || a.includes(h)),
    f = (r == null ? void 0 : r.kind) ?? (o == null ? void 0 : o.domain) ?? "",
    u = fn.has(f) || c || l;
  return Ke(o)
    ? u
    : f === "alarm_control_panel"
      ? ["triggered", "armed_triggered"].includes(n)
      : f === "binary_sensor"
        ? un.has(n) && (c || l)
        : (o == null ? void 0 : o.domain) === "lock"
          ? ["unlocked", "open"].includes(n)
          : !1;
}
function lt(e, s, r) {
  var a;
  if (r === "overview") return !1;
  if (r === "lighting")
    return (
      e.kind === "light" ||
      ((a = e.modelId) == null ? void 0 : a.startsWith("switch.light.")) ||
      (s == null ? void 0 : s.domain) === "light"
    );
  if (r === "shade")
    return e.kind === "cover" || (s == null ? void 0 : s.domain) === "cover";
  if (r === "environment")
    return (
      e.kind === "sensor" ||
      e.kind === "climate" ||
      (s == null ? void 0 : s.domain) === "sensor" ||
      (s == null ? void 0 : s.domain) === "climate"
    );
  const o =
      typeof (s == null ? void 0 : s.attributes.device_class) == "string"
        ? s.attributes.device_class.toLowerCase()
        : "",
    n =
      `${(s == null ? void 0 : s.name) ?? ""} ${(s == null ? void 0 : s.entityId) ?? ""}`.toLowerCase(),
    i = [...ws, ...vs].some((c) => o.includes(c) || n.includes(c));
  return (
    ["camera", "lock", "alarm_control_panel", "binary_sensor"].includes(
      e.kind,
    ) ||
    ["camera", "lock", "alarm_control_panel", "binary_sensor"].includes(
      (s == null ? void 0 : s.domain) ?? "",
    ) ||
    i
  );
}
const kt = (e, s, r) => Math.min(r, Math.max(s, e)),
  pn = 0.04;
function Ms(e) {
  return Math.max(e, pn);
}
function Ct(e) {
  return e;
}
function ks() {
  return 0.96;
}
function gn(e, s) {
  return kt(e, 0, Math.max(0.2, s ?? e));
}
function mn(e, s, r, o) {
  const [n, i, a] = e;
  return s === "floor" ? [n, Ms(kt(i, 0, 0.08)), a] : [n, gn(i, o), a];
}
const Ss = L.createContext("glass"),
  ue = () => L.useContext(Ss),
  ge = (e, s) => at(e, s, ue()),
  Te = (e, s, r) => {
    var o;
    return (
      ((o = e.materials.find((n) => n.id === s)) == null ? void 0 : o.color) ??
      r
    );
  },
  Ht = new Map(),
  $ = (e, s, r) => {
    const o = `${e}|${s}|${r}`,
      n = Ht.get(o);
    if (n) return n;
    const i = `#${new Re(e).lerp(new Re(s), r).getHexString()}`;
    return (Ht.set(o, i), i);
  },
  Qe = (e, s, r) => Math.min(r, Math.max(s, e)),
  yn = "#f7fbff",
  jn = 0.2,
  bn = (e, s = !1) => (s ? "#8d97a5" : $(e, "#fbfdff", 0.78)),
  wn = (e, s = !1) => (s ? "#697382" : $(e, "#dce7f2", 0.46)),
  qe = (e) => $(e, "#eef4f8", 0.22),
  Pt = (e) => $(e, "#ffffff", 0.62),
  dt = (e, s) => ({
    color: e ? "#40536c" : s ? "#9b8e78" : yn,
    opacity: e ? 0.16 : s ? 0.11 : jn,
    threshold: e ? 18 : s ? 22 : 24,
  }),
  Cs = (e) => e;
function Gt({ children: e }) {
  const s = L.useRef(null);
  return (
    L.useLayoutEffect(() => {
      var r;
      configureDeviceModelPicking(s.current);
      (r = s.current) == null ||
        r.traverse((o) => {
          o instanceof Js && ((o.castShadow = !1), (o.receiveShadow = !1));
        });
    }),
    t.jsx("group", { ref: s, children: e })
  );
}
function Ps(e) {
  const s = e.polygon.reduce((r, [o, n]) => [r[0] + o, r[1] + n], [0, 0]);
  return [s[0] / e.polygon.length, s[1] / e.polygon.length];
}
function _n(e) {
  return (
    Math.abs(
      e.polygon.reduce((s, r, o) => {
        const n = e.polygon[(o + 1) % e.polygon.length];
        return s + r[0] * n[1] - n[0] * r[1];
      }, 0),
    ) / 2
  );
}
function Gs(e, s) {
  let r = !1;
  for (let o = 0, n = s.length - 1; o < s.length; n = o++) {
    const [i, a] = s[o],
      [c, l] = s[n];
    a > e[1] != l > e[1] &&
      e[0] < ((c - i) * (e[1] - a)) / (l - a || Number.EPSILON) + i &&
      (r = !r);
  }
  return r;
}
function Mn(e) {
  const s = he(e);
  return Ke(e)
    ? !1
    : ["on", "open", "opening", "detected", "unsafe", "unlocked"].includes(s);
}
function kn(e, s, r, o = "glass") {
  const n = at(s, r, o).floorPalette;
  if (r === "lighting") return n[0];
  const i = e.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return n[i % n.length];
}
function Bt(e, s, r, o, n = "glass") {
  const i = at(r, o, n),
    a = kn(s, r, o, n);
  if (n === "cartoon") return $(a, Te(e, s.floorMaterialId, a), 0.08);
  if (n === "cream") return $(a, Te(e, s.floorMaterialId, a), 0.12);
  if (o === "lighting") {
    const u = r === "night",
      h = $(a, i.wallColor, u ? 0.06 : 0.1);
    return $(h, a, u ? 0.025 : 0.045);
  }
  const c = Te(e, s.floorMaterialId, a),
    l =
      r === "night" || o === "shade" || o === "environment" || o === "security",
    f = $(a, i.wallColor, l ? 0.06 : 0.1);
  return $(f, c, l ? 0.025 : 0.045);
}
function Sn(e, s, r, o) {
  var n;
  return ct(e, s)
    ? "#ff708a"
    : e.kind === "light" ||
        ((n = e.modelId) != null && n.startsWith("switch.light."))
      ? o
      : lt(e, s, r)
        ? Lt(r, o)
        : e.kind === "climate"
          ? he(s) === "heat"
            ? "#ee8a5f"
            : "#83d8ff"
          : e.kind === "cover"
            ? "#83d8ff"
            : e.kind === "sensor"
              ? "#9cf0ca"
              : e.kind === "lock" ||
                  e.kind === "binary_sensor" ||
                  e.kind === "alarm_control_panel" ||
                  e.kind === "camera"
                ? "#ff8aa0"
                : e.kind === "fan" || e.kind === "vacuum"
                  ? "#8ee7d5"
                  : o;
}
function Cn(e, s, r, o) {
  return !r || o === "overview" ? !0 : lt(e, s, o);
}
function Pn(e, s) {
  return !e || s === "overview" || s === "lighting";
}
function Gn(e, s, r) {
  let o = 0,
    n = 0,
    i = 0;
  for (const l of e) {
    const f = s[l.entityId];
    (_s(l, f) && (o += 1), ct(l, f) && (n += 1), lt(l, f, r) && (i += 1));
  }
  const a = n ? "#ff708a" : i ? Lt(r, "#a9c4ff") : o ? "#9cf0ca" : "#a9c4ff";
  return {
    active: o,
    alerts: n,
    modeMatches: i,
    color: a,
    opacity: n ? 0.145 : i ? 0.088 : o ? 0.058 : 0,
  };
}
function Ln(e, s) {
  return e.roomId
    ? e.roomId === s.id
    : Gs([e.position[0], e.position[2]], s.polygon);
}
function $n(e, s, r) {
  const o = s.devices
      .filter((a) => {
        var c, l;
        return (
          (a.kind === "light" ||
            ((c = a.modelId) == null
              ? void 0
              : c.startsWith("switch.light.")) ||
            ((l = r[a.entityId]) == null ? void 0 : l.domain) === "light") &&
          Ln(a, e)
        );
      })
      .map((a) => r[a.entityId])
      .filter((a) => !!a),
    n = s.devices
      .filter((a) => {
        var c;
        return ((c = r[a.entityId]) == null ? void 0 : c.domain) === "switch";
      })
      .flatMap((a) =>
        (a.controlledLightFixtures ?? [])
          .filter((c) =>
            c.roomId
              ? c.roomId === e.id
              : Gs([c.position[0], c.position[2]], e.polygon),
          )
          .map(() => r[a.entityId]),
      )
      .filter((a) => !!a),
    i = Pe(e, s, r, "lighting").filter((a) => a.domain === "light");
  return [...o, ...n, ...i].filter((a) => he(a) === "on");
}
function En(e, s, r) {
  const n = $n(e, s, r)
    .map((f) => ot(f))
    .filter((f) => f.isOn);
  if (!n.length)
    return {
      active: 0,
      color: "#e2b27a",
      level: 0,
      opacity: 0,
      edgeOpacity: 0,
    };
  const i = Qe(n.reduce((f, u) => f + u.brightness, 0) / n.length, 0.22, 1),
    c = Math.min(0.045, (n.length - 1) * 0.012),
    l = mixLightColors(n);
  return {
    active: n.length,
    color: l,
    level: i,
    opacity: Qe(0.09 + i * 0.082 + c, 0.12, 0.22),
    edgeOpacity: Qe(0.04 + i * 0.045, 0.052, 0.09),
  };
}
function Nn(e, s) {
  return [
    ...new Set([...pe(e, "lighting", "main"), ...pe(e, "lighting", "ambient")]),
  ]
    .map((r) => s[r])
    .filter((r) => !!(r && (r.domain === "light" || r.domain === "switch")));
}
function Lt(e, s) {
  return e === "lighting"
    ? "#ffd08a"
    : e === "shade"
      ? "#83d8ff"
      : e === "environment"
        ? "#9cf0ca"
        : e === "security"
          ? "#ff708a"
          : s;
}
const Ye = [18, 8],
  ve = [16, 6],
  At = [
    {
      key: "temperature",
      label: "温度",
      icon: (e) => t.jsx(Fe, { className: e, size: 13 }),
      stateKey: "temperature",
    },
    {
      key: "humidity",
      label: "湿度",
      icon: (e) => t.jsx(Qt, { className: e, size: 13 }),
      stateKey: "humidity",
    },
    {
      key: "pm25",
      label: "PM2.5",
      icon: (e) => t.jsx(kr, { className: e, size: 13 }),
      stateKey: "pm25",
    },
    {
      key: "co2",
      label: "CO₂",
      icon: (e) => t.jsx(rt, { className: e, size: 13 }),
      stateKey: "co2",
    },
    {
      key: "voc",
      label: "VOC",
      icon: (e) => t.jsx(Jt, { className: e, size: 13 }),
      stateKey: "voc",
    },
    {
      key: "illuminance",
      label: "照度",
      icon: (e) => t.jsx(jt, { className: e, size: 13 }),
      stateKey: "illuminance",
    },
  ];
function On(e, s) {
  return s === "temperature" && e.domain === "climate"
    ? Number(e.attributes.current_temperature ?? e.attributes.temperature)
    : Number(e.state);
}
function zn(e, s) {
  if (["unknown", "unavailable", ""].includes(he(e))) return Ae(e);
  const r = On(e, s),
    o =
      typeof e.attributes.unit_of_measurement == "string"
        ? e.attributes.unit_of_measurement
        : "";
  return Number.isFinite(r)
    ? s === "temperature"
      ? `${r.toFixed(1)}°`
      : s === "humidity"
        ? `${r.toFixed(0)}%`
        : s === "illuminance"
          ? `${r.toFixed(0)}${o || "lx"}`
          : s === "co2" || s === "voc"
            ? `${r.toFixed(0)}${o && o.length <= 4 ? o : ""}`
            : `${r.toFixed(0)}${o && o.length <= 4 ? o : ""}`
    : Ae(e);
}
function Tn(e, s, r) {
  if (s.source === "binding")
    return At.flatMap((n) => {
      const i = pe(e, "environment", n.key)[0],
        a = s[n.stateKey] ?? (i ? void 0 : s[n.stateKey]),
        c = i ? r[i] : void 0;
      if (a === void 0 && !c) return [];
      const l =
        a !== void 0
          ? n.key === "temperature"
            ? `${a.toFixed(1)}°`
            : n.key === "humidity"
              ? `${a.toFixed(0)}%`
              : n.key === "illuminance"
                ? `${a.toFixed(0)}lx`
                : a.toFixed(0)
          : zn(c, n.key);
      return [
        {
          key: n.key,
          label: n.label,
          icon: n.icon(`metric-icon metric-${n.key}`),
          value: l,
        },
      ];
    });
  const o = At.flatMap((n) => {
    const i = s[n.stateKey];
    if (i === void 0) return [];
    const a =
      n.key === "temperature"
        ? `${i.toFixed(1)}°`
        : n.key === "humidity"
          ? `${i.toFixed(0)}%`
          : n.key === "illuminance"
            ? `${i.toFixed(0)}lx`
            : i.toFixed(0);
    return [
      {
        key: n.key,
        label: n.label,
        icon: n.icon(`metric-icon metric-${n.key}`),
        value: a,
      },
    ];
  });
  return (
    s.quality !== "--" &&
      o.push({
        key: "air",
        label: "空气",
        icon: t.jsx(Jt, { className: "metric-icon metric-air", size: 13 }),
        value: s.quality,
      }),
    o
  );
}
function In({
  room: e,
  floor: s,
  entities: r,
  theme: o,
  mode: n,
  onLightingAction: i,
  onShadeAction: a,
  onSecuritySelect: c,
}) {
  const l = Ps(e),
    f = us(e, s, r),
    u =
      f.source === "binding"
        ? "实况"
        : f.source === "area"
          ? "Area"
          : f.source === "device"
            ? "设备"
            : "未配置",
    h = Math.min(2.65, Math.max(1.62, Ct(s.height) + 0.58)),
    m = Pe(e, s, r, "lighting").filter(
      (d) => d.domain === "light" || d.domain === "switch",
    ),
    y = Nn(e, r),
    w = y.map((d) => d.entityId),
    b = Pe(e, s, r, "shade").filter((d) => d.domain === "cover"),
    j = b.map((d) => d.entityId),
    x = Pe(e, s, r, "security"),
    k = x.filter((d) => d.domain === "camera"),
    G = m.filter((d) => he(d) === "on").length,
    C = b.filter(
      (d) =>
        ["open", "opening"].includes(he(d)) ||
        Number(d.attributes.current_position ?? 0) > 0,
    ).length,
    O = b.length
      ? b.reduce(
          (d, g) =>
            d +
            Number(
              g.attributes.current_position ?? (he(g) === "open" ? 100 : 0),
            ),
          0,
        ) / b.length
      : 0,
    N = x.filter((d) => ct(d)).length;
  if (n === "lighting")
    return t.jsxs(le, {
      position: [l[0], h, l[1]],
      center: !0,
      zIndexRange: Ye,
      className: `mijia-room-badge mode-lighting badge-${o}`,
      children: [
        t.jsxs("div", {
          className: "badge-head",
          children: [
            t.jsx("strong", { children: e.name }),
            t.jsx("em", { children: G ? `${G} 盏亮着` : "灯全关着" }),
          ],
        }),
        t.jsxs("div", {
          className: "badge-actions",
          children: [
            t.jsx("button", {
              type: "button",
              className: G ? "active" : "",
              disabled: !w.length,
              onClick: (d) => {
                (d.stopPropagation(), i == null || i(w, "turn_on"));
              },
              "aria-label": `打开${e.name}绑定灯具`,
              title: w.length
                ? `打开 ${y.length} 个绑定灯具`
                : "未绑定主灯或氛围灯",
              children: t.jsx(es, { size: 16 }),
            }),
            t.jsx("button", {
              type: "button",
              disabled: !w.length,
              onClick: (d) => {
                (d.stopPropagation(), i == null || i(w, "turn_off"));
              },
              "aria-label": `关闭${e.name}绑定灯具`,
              title: w.length
                ? `关闭 ${y.length} 个绑定灯具`
                : "未绑定主灯或氛围灯",
              children: t.jsx(Lr, { size: 16 }),
            }),
          ],
        }),
      ],
    });
  if (n === "shade") {
    const d = b.length
      ? `${C} 开 · ${Math.max(0, b.length - C)} 关`
      : "暂无窗帘";
    return t.jsxs(le, {
      position: [l[0], h, l[1]],
      center: !0,
      zIndexRange: Ye,
      className: `mijia-room-badge mode-shade badge-${o}`,
      children: [
        t.jsxs("div", {
          className: "badge-head",
          children: [
            t.jsx("strong", { children: e.name }),
            t.jsx("em", { children: d }),
          ],
        }),
        t.jsxs("div", {
          className: "badge-actions three",
          children: [
            t.jsx("button", {
              type: "button",
              className: O >= 90 ? "active" : "",
              disabled: !j.length,
              onClick: (g) => {
                (g.stopPropagation(), a == null || a(j, 100));
              },
              "aria-label": `打开${e.name}窗帘`,
              title: j.length ? `打开 ${b.length} 个窗帘` : "未绑定窗帘",
              children: t.jsx(Hr, { size: 16 }),
            }),
            t.jsx("button", {
              type: "button",
              className: O > 5 && O < 90 ? "active" : "",
              disabled: !j.length,
              onClick: (g) => {
                (g.stopPropagation(), a == null || a(j, 50));
              },
              "aria-label": `半开${e.name}窗帘`,
              title: j.length ? `半开 ${b.length} 个窗帘` : "未绑定窗帘",
              children: t.jsx(Ar, { size: 16 }),
            }),
            t.jsx("button", {
              type: "button",
              className: j.length && O <= 5 ? "active" : "",
              disabled: !j.length,
              onClick: (g) => {
                (g.stopPropagation(), a == null || a(j, 0));
              },
              "aria-label": `关闭${e.name}窗帘`,
              title: j.length ? `关闭 ${b.length} 个窗帘` : "未绑定窗帘",
              children: t.jsx(Rr, { size: 16 }),
            }),
          ],
        }),
      ],
    });
  }
  if (n === "security") {
    const d = N ? `${N} 个告警` : x.length ? "安防正常" : "暂无安防";
    return t.jsx(le, {
      position: [l[0], h, l[1]],
      center: !0,
      zIndexRange: Ye,
      className: `mijia-room-badge mode-security badge-${o} ${N ? "has-alert" : ""}`,
      children: t.jsxs("button", {
        type: "button",
        className: "security-badge-button",
        onClick: (g) => {
          (g.stopPropagation(),
            c == null ||
              c({
                floorId: s.id,
                roomId: e.id,
                floorName: s.name,
                roomName: e.name,
                cameraEntityIds: k.map((_) => _.entityId),
              }));
        },
        "aria-label": `查看${e.name}区域摄像头`,
        title: k.length ? `查看 ${k.length} 个摄像头` : d,
        children: [
          t.jsxs("span", {
            className: "security-badge-copy",
            children: [
              t.jsx("strong", { children: e.name }),
              t.jsx("em", { children: k.length ? `${k.length} 个摄像头` : d }),
            ],
          }),
          t.jsx("span", {
            className: `security-badge-icon ${N ? "alert" : ""}`,
            children: t.jsx(ts, { size: 16 }),
          }),
        ],
      }),
    });
  }
  const E = Tn(e, f, r);
  return E.length
    ? t.jsxs(le, {
        position: [l[0], h, l[1]],
        center: !0,
        zIndexRange: Ye,
        className: `mijia-room-badge room-environment-badge badge-${o} badge-source-${f.source}`,
        children: [
          t.jsxs("div", {
            className: "badge-head",
            children: [
              t.jsx("strong", { children: e.name }),
              t.jsx("em", { children: u }),
            ],
          }),
          t.jsx("div", {
            className: `badge-metrics metrics-${E.length}`,
            children: E.map((d) =>
              t.jsxs(
                "span",
                {
                  className: `metric-chip metric-${d.key}`,
                  title: `${d.label} ${d.value}`,
                  children: [
                    d.icon,
                    t.jsx("small", { children: d.label }),
                    t.jsx("b", { children: d.value }),
                  ],
                },
                d.key,
              ),
            ),
          }),
        ],
      })
    : null;
}
function Dt({
  room: e,
  color: s,
  opacity: r,
  alert: o,
  y: n = 0.044,
  renderOrder: i = 2,
  edgeOpacity: a,
  blending: c = q,
}) {
  const l = L.useMemo(() => {
    const f = e.polygon[0],
      u = new Le();
    u.moveTo(f[0], -f[1]);
    for (const h of e.polygon.slice(1)) u.lineTo(h[0], -h[1]);
    return (u.closePath(), u);
  }, [e]);
  return t.jsxs("mesh", {
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, n, 0],
    renderOrder: i,
    children: [
      t.jsx("shapeGeometry", { args: [l] }),
      t.jsx("meshBasicMaterial", {
        color: s,
        transparent: !0,
        opacity: r,
        depthWrite: !1,
        toneMapped: !1,
        blending: c,
      }),
      (o || a !== void 0) &&
        t.jsx(Y, {
          color: s,
          threshold: 28,
          opacity: a ?? 0.18,
          transparent: !0,
        }),
    ],
  });
}
function Rn({
  room: e,
  project: s,
  showLabel: r,
  theme: o,
  presentation: n,
  presentationMode: i,
  highlighted: a,
  accented: c,
  lit: l,
  lightColor: f,
  lightLevel: u,
  onFocus: h,
  onHover: m,
}) {
  const y = L.useMemo(() => {
      const p = e.polygon[0],
        v = new Le();
      v.moveTo(p[0], -p[1]);
      for (const P of e.polygon.slice(1)) v.lineTo(P[0], -P[1]);
      return (v.closePath(), v);
    }, [e]),
    w = Ps(e),
    b = ue(),
    j = b === "cartoon" && n,
    x = b === "cream" && n,
    k = ge(o, i),
    C = a
      ? k.roomHighlight
      : n && i === "lighting" && !l
        ? Bt(s, e, o, i, b)
        : c
          ? k.roomAccent
          : n
            ? Bt(s, e, o, i, b)
            : Te(s, e.floorMaterialId, "#c9a675"),
    O = Qe(u ?? 0, 0, 1),
    N = f ?? k.glow,
    E = n && l ? $(C, N, a ? 0.16 : 0.4 + O * 0.16) : C,
    d = j
      ? a
        ? 0.44
        : l
          ? 0.34
          : c
            ? 0.28
            : 0.2
      : x
        ? a
          ? 0.22
          : l
            ? 0.115 + O * 0.045
            : c
              ? 0.1
              : 0.058
        : n
          ? a
            ? 0.18
            : l
              ? 0.065 + O * 0.04
              : c
                ? 0.075
                : 0.026
          : a
            ? 0.86
            : c
              ? 0.62
              : 0.24,
    g = a ? 0.1 : c ? 0.045 : 0,
    _ =
      n && l
        ? $(N, k.glow, 0.2)
        : a || c
          ? E
          : n
            ? $(E, k.glow, 0.06)
            : "#000000",
    M = n ? Math.max(g, l ? 0.052 + O * 0.078 : 0.008) : g;
  return t.jsxs("group", {
    children: [
      t.jsxs("mesh", {
        rotation: [-Math.PI / 2, 0, 0],
        position: [0, 0.025, 0],
        receiveShadow: !0,
        onPointerOver: (p) => {
          (p.stopPropagation(), m == null || m(!0));
        },
        onPointerOut: () => (m == null ? void 0 : m(!1)),
        onDoubleClick: (p) => {
          (p.stopPropagation(), h == null || h());
        },
        children: [
          t.jsx("shapeGeometry", { args: [y] }),
          j
            ? t.jsx("meshToonMaterial", {
                color: E,
                emissive: _,
                emissiveIntensity: M * 0.58,
                polygonOffset: !0,
                polygonOffsetFactor: -1,
                polygonOffsetUnits: -1,
              })
            : t.jsx("meshPhysicalMaterial", {
                color: E,
                roughness: n ? (l ? 0.5 : 0.46) : 0.72,
                metalness: n ? 0.02 : 0.015,
                clearcoat: n ? (l ? 0.18 : 0.2) : 0,
                clearcoatRoughness: n ? 0.68 : 0.82,
                reflectivity: n ? (l ? 0.12 : 0.14) : 0.08,
                emissive: _,
                emissiveIntensity: M,
                polygonOffset: n,
                polygonOffsetFactor: -1,
                polygonOffsetUnits: -1,
              }),
          d > 0 &&
            t.jsx(Y, {
              color:
                j || x || a || c
                  ? k.roomEdgeColor
                  : l
                    ? $(N, "#ffffff", 0.42)
                    : n
                      ? k.wallEdgeColor
                      : "#6f6253",
              threshold: j ? 18 : x ? 24 : 30,
              opacity: d,
              transparent: !0,
            }),
        ],
      }),
      !n &&
        t.jsxs("mesh", {
          rotation: [-Math.PI / 2, 0, 0],
          position: [0, -0.015, 0],
          receiveShadow: !0,
          children: [
            t.jsx("shapeGeometry", { args: [y] }),
            t.jsx("meshStandardMaterial", {
              color: "#d5d9d4",
              roughness: 0.95,
            }),
          ],
        }),
      r &&
        t.jsxs(le, {
          position: [w[0], 0.11, w[1]],
          center: !0,
          zIndexRange: ve,
          className: "room-label room-label-3d",
          children: [
            t.jsx("strong", { children: e.name }),
            t.jsxs("span", { children: [_n(e).toFixed(1), " m²"] }),
          ],
        }),
    ],
  });
}
function H({
  position: e,
  size: s,
  color: r,
  roughness: o = 0.72,
  presentation: n = !1,
}) {
  const roundedGeometry = L.useMemo(
    () => n ? createStableRoundedBoxGeometry(s) : null,
    [n, s[0], s[1], s[2]],
  );
  L.useEffect(() => () => roundedGeometry?.dispose(), [roundedGeometry]);
  const i = ue(),
    a = i === "cartoon" && n,
    c = i === "cream" && n,
    l = a
      ? qe(r)
      : c
        ? $(qe(r), "#fff3df", 0.2)
        : n
          ? $(qe(r), "#eef5ff", 0.24)
          : qe(r),
    f = a
      ? t.jsx("meshToonMaterial", { color: l })
      : t.jsx("meshPhysicalMaterial", {
          color: l,
          roughness: c ? 0.64 : n ? Math.min(o, 0.44) : o,
          metalness: c ? 0.006 : 0.018,
          clearcoat: c ? 0.08 : n ? 0.34 : 0.16,
          clearcoatRoughness: c ? 0.82 : n ? 0.56 : 0.82,
          transparent: !1,
          opacity: 1,
        });
  if (n) {
    const h = dt(a, c);
    return t.jsxs("mesh", {
      position: e,
      castShadow: !0,
      receiveShadow: !0,
      children: [
        t.jsx("primitive", { object: roundedGeometry, attach: "geometry" }),
        f,
        t.jsx(Y, {
          color: h.color,
          threshold: h.threshold,
          opacity: h.opacity,
          transparent: !0,
        }),
      ],
    });
  }
  return t.jsxs("mesh", {
    position: e,
    castShadow: !0,
    receiveShadow: !0,
    children: [
      t.jsx("boxGeometry", { args: [s[0], s[1], s[2]] }),
      f,
      t.jsx(Y, { color: Pt(l), threshold: 34, opacity: 0.16, transparent: !0 }),
    ],
  });
}
function Fn({
  x: e,
  y: s,
  width: r,
  height: o,
  depth: n,
  color: i,
  presentation: a = !1,
  theme: c = "day",
  presentationMode: l = "overview",
  showEdges: f = !0,
}) {
  if (r <= 0.01 || o <= 0.01) return null;
  const u = ue(),
    h = u === "cartoon" && a,
    m = u === "cream" && a,
    y = ge(c, l),
    w = a
      ? h
        ? $(y.wallColor, y.wallEdgeColor, 0.18)
        : m
          ? y.wallEdgeColor
          : $(y.wallEdgeColor, "#ffffff", 0.12)
      : "#8d8982",
    b = a
      ? h
        ? 0.08
        : m
          ? 0.065
          : Math.max(0.16, y.wallEdgeOpacity + 0.08)
      : 0.14;
  return t.jsxs("mesh", {
    position: [e, s, 0],
    castShadow: !0,
    receiveShadow: !0,
    children: [
      t.jsx("boxGeometry", { args: [r, o, n] }),
      h
        ? t.jsx("meshToonMaterial", {
            color: y.wallColor,
            transparent: y.wallOpacity < 0.99,
            opacity: y.wallOpacity,
          })
        : t.jsx("meshPhysicalMaterial", {
            color: a ? y.wallColor : i,
            roughness: m ? 0.62 : a ? 0.5 : 0.84,
            metalness: 0,
            clearcoat: m ? 0.04 : a ? 0.16 : 0,
            clearcoatRoughness: m ? 0.86 : 0.72,
            transparent: a && y.wallOpacity < 0.99,
            opacity: a ? Math.max(0.2, y.wallOpacity * (m ? 0.94 : 0.82)) : 1,
            depthWrite: !a,
          }),
      f &&
        t.jsx(Y, {
          color: w,
          threshold: h ? 18 : m ? 28 : a ? 26 : 35,
          opacity: b,
          transparent: !0,
        }),
    ],
  });
}
function Hn({
  opening: e,
  wallLength: s,
  wallDepth: r,
  presentation: o,
  theme: n,
  presentationMode: i,
  entity: a,
}) {
  const c = e.offset - s / 2,
    l = ue(),
    f = l === "cartoon" && o,
    u = l === "cream" && o,
    h = ge(n, i),
    m = o ? $(h.wallColor, "#ffffff", f ? 0.22 : u ? 0.16 : 0.34) : "#e7ebef",
    y = f ? 0.3 : u ? 0.58 : o ? 0.18 : 1,
    w = o
      ? $(h.wallEdgeColor, h.wallColor, f ? 0.82 : u ? 0.42 : 0.68)
      : "#ffffff",
    b = f ? 0.055 : u ? 0.105 : o ? 0.08 : 0,
    j = ({ x: M, y: p, width: v, height: P, depth: T = r + 0.035 }) =>
      t.jsxs("mesh", {
        position: [M, p, 0],
        castShadow: !o,
        receiveShadow: !0,
        renderOrder: o ? 6 : 2,
        children: [
          t.jsx("boxGeometry", { args: [v, P, T] }),
          t.jsx("meshPhysicalMaterial", {
            color: m,
            roughness: o ? 0.52 : 0.56,
            metalness: 0.01,
            clearcoat: o ? 0.08 : 0.12,
            clearcoatRoughness: 0.72,
            emissive: o ? w : "#000000",
            emissiveIntensity: o ? 0.006 : 0,
            transparent: o,
            opacity: y,
            depthWrite: !o,
          }),
          o &&
            t.jsx(Y, { color: w, threshold: 18, opacity: b, transparent: !0 }),
        ],
      });
  if (e.type === "window") {
    const M = r / 2 + (o ? 0.026 : 0.004),
      p = i === "shade",
      P = (e.windowStyle === "floor_to_ceiling" ? 0 : e.bottom) + e.height / 2,
      T = o
        ? $(h.wallColor, h.glow, p ? 0.28 : 0.18)
        : n === "night"
          ? "#b2cdf3"
          : "#d8f2ff",
      z = f ? 0.28 : o ? (p ? 0.18 : 0.13) : 0.46,
      I = o ? $("#ffffff", h.wallEdgeColor, p ? 0.18 : 0.08) : "#ffffff",
      F = o ? (p ? 0.56 : 0.46) : 0.68,
      S = o ? (p ? 0.36 : 0.26) : 0.42,
      B = o ? 0.016 : 0.024,
      R = Math.max(B * 0.72, o ? 0.011 : 0.016),
      W = o ? 0.01 : 0.016,
      ee = Math.max(2, Math.min(5, Math.round(e.width / 0.48))),
      K = Array.from(
        { length: ee - 1 },
        (Q, Z) => -e.width / 2 + e.width * ((Z + 1) / ee),
      ),
      X =
        e.height > 0.92
          ? [e.height * (e.windowStyle === "floor_to_ceiling" ? -0.16 : 0)]
          : [],
      te = ({ x: Q, y: Z, width: ye, height: ae, opacity: Us = F }) =>
        t.jsxs("mesh", {
          position: [Q, Z, M + 0.006],
          renderOrder: 8,
          children: [
            t.jsx("boxGeometry", { args: [ye, ae, W] }),
            t.jsx("meshBasicMaterial", {
              color: I,
              transparent: !0,
              opacity: Us,
              depthWrite: !1,
              toneMapped: !1,
            }),
          ],
        });
    return t.jsxs("group", {
      position: [c, P, 0],
      children: [
        t.jsxs("mesh", {
          position: [0, 0, M],
          renderOrder: 5,
          children: [
            t.jsx("planeGeometry", { args: [e.width, e.height] }),
            f
              ? t.jsx("meshToonMaterial", {
                  color: T,
                  transparent: !0,
                  opacity: z,
                  depthWrite: !1,
                  side: J,
                })
              : t.jsx("meshPhysicalMaterial", {
                  color: T,
                  transmission: o ? 0.46 : 0.72,
                  transparent: !0,
                  opacity: z,
                  roughness: 0.08,
                  metalness: 0.02,
                  emissive: o ? T : "#000000",
                  emissiveIntensity: o ? 0.08 : 0,
                  depthWrite: !1,
                  side: J,
                }),
          ],
        }),
        t.jsxs("mesh", {
          position: [0, 0, M + 0.002],
          renderOrder: 6,
          children: [
            t.jsx("planeGeometry", { args: [e.width * 0.96, e.height * 0.9] }),
            t.jsx("meshBasicMaterial", {
              color: I,
              transparent: !0,
              opacity: o ? 0.035 : 0.08,
              depthWrite: !1,
              toneMapped: !1,
              side: J,
            }),
          ],
        }),
        t.jsx(te, { x: 0, y: e.height / 2 - B / 2, width: e.width, height: B }),
        t.jsx(te, {
          x: 0,
          y: -e.height / 2 + B / 2,
          width: e.width,
          height: B,
        }),
        t.jsx(te, {
          x: -e.width / 2 + B / 2,
          y: 0,
          width: B,
          height: e.height,
        }),
        t.jsx(te, { x: e.width / 2 - B / 2, y: 0, width: B, height: e.height }),
        K.map((Q) =>
          t.jsx(
            te,
            { x: Q, y: 0, width: R, height: e.height * 0.94, opacity: S },
            `mullion-${Q}`,
          ),
        ),
        X.map((Q) =>
          t.jsx(
            te,
            { x: 0, y: Q, width: e.width * 0.94, height: R, opacity: S },
            `rail-${Q}`,
          ),
        ),
      ],
    });
  }
  const x = o ? 0.048 : 0.062,
    k = r + (o ? 0.014 : 0.006),
    G = t.jsxs("group", {
      position: [c, e.height / 2, 0],
      children: [
        t.jsx(j, {
          x: -e.width / 2 + x / 2,
          y: 0,
          width: x,
          height: e.height,
          depth: k,
        }),
        t.jsx(j, {
          x: e.width / 2 - x / 2,
          y: 0,
          width: x,
          height: e.height,
          depth: k,
        }),
        t.jsx(j, {
          x: 0,
          y: e.height / 2 - x / 2,
          width: e.width,
          height: x,
          depth: k,
        }),
      ],
    });
  if (!e.hasLeaf) return t.jsx(t.Fragment, { children: G });
  const C = e.hinge === "start" ? -1 : 1,
    O = e.swing === "inward" ? 1 : -1,
    N = e.width * 0.96,
    E = e.entityId ? Mn(a) : !0,
    d = E ? O * C * (o ? 0.68 : 0.58) : 0,
    g =
      o && e.entityId
        ? E
          ? $(h.wallColor, "#d8f6ff", 0.22)
          : $(h.wallColor, h.foundation, 0.04)
        : o
          ? $(h.wallColor, h.foundation, 0.06)
          : "#b78b61",
    _ = o && e.entityId && E ? $("#9cf0ca", w, 0.22) : w;
  return t.jsxs(t.Fragment, {
    children: [
      G,
      t.jsxs("group", {
        position: [c + (C * e.width) / 2, 0, 0],
        rotation: [0, d, 0],
        children: [
          t.jsxs(D, {
            position: [(-C * N) / 2, e.height / 2, O * 0.03],
            args: [N, e.height * 0.97, 0.045],
            radius: o ? 0.028 : 0.012,
            smoothness: 4,
            castShadow: !0,
            children: [
              t.jsx("meshPhysicalMaterial", {
                color: g,
                roughness: o ? 0.42 : 0.72,
                metalness: 0.012,
                clearcoat: o ? 0.2 : 0,
                clearcoatRoughness: 0.56,
                transparent: o,
                opacity: o ? Math.min(0.58, h.wallOpacity + 0.16) : 1,
                emissive: o ? _ : "#000000",
                emissiveIntensity: o ? (E && e.entityId ? 0.07 : 0.035) : 0,
              }),
              o &&
                e.entityId &&
                t.jsx(Y, {
                  color: E ? "#d9fff2" : w,
                  threshold: 18,
                  opacity: E ? 0.18 : 0.08,
                  transparent: !0,
                }),
            ],
          }),
          t.jsxs("mesh", {
            position: [-C * N * 0.82, e.height * 0.54, O * 0.065],
            children: [
              t.jsx("sphereGeometry", { args: [0.035, 16, 8] }),
              t.jsx("meshStandardMaterial", {
                color: o ? $(h.wallColor, "#ffffff", 0.48) : "#71604d",
                metalness: 0.55,
                roughness: 0.28,
                emissive: o ? w : "#000000",
                emissiveIntensity: o ? 0.08 : 0,
              }),
            ],
          }),
        ],
      }),
    ],
  });
}
function Bn({
  wall: e,
  color: s,
  openings: r,
  renderHeight: o,
  presentation: n,
  theme: i,
  presentationMode: a,
  thicknessScale: c,
  entities: l,
}) {
  if (isVirtualWall(e)) return null;
  const f = e.end[0] - e.start[0],
    u = e.end[1] - e.start[1],
    h = Math.hypot(f, u),
    m = Math.atan2(u, f),
    y = [(e.start[0] + e.end[0]) / 2, 0, (e.start[1] + e.end[1]) / 2],
    w = e.thickness * c,
    b = [...r].sort((M, p) => M.offset - p.offset),
    j =
      o > 1
        ? n
          ? b.filter((M) => M.type === "window" || M.type === "door")
          : b
        : [],
    x = o > 0.42 ? b : [],
    k = L.useMemo(() => {
      const M = new Le(),
        p = n ? 0 : w / 2,
        v = -h / 2 - p,
        P = h / 2 + p;
      (M.moveTo(v, 0),
        M.lineTo(P, 0),
        M.lineTo(P, o),
        M.lineTo(v, o),
        M.closePath());
      for (const T of j) {
        const z = T.offset - h / 2,
          I = Math.max(v + 0.001, z - T.width / 2),
          F = Math.min(P - 0.001, z + T.width / 2),
          S = Math.max(0.001, T.bottom),
          B = Math.min(o - 0.001, T.bottom + T.height);
        if (F - I <= 0.01 || B - S <= 0.01) continue;
        const R = new Qs();
        (R.moveTo(I, S),
          R.lineTo(I, B),
          R.lineTo(F, B),
          R.lineTo(F, S),
          R.closePath(),
          M.holes.push(R));
      }
      return M;
    }, [j, h, n, o, w]),
    G = [];
  let C = 0;
  for (const M of j.filter((p) => p.type === "door" && p.bottom < 0.1)) {
    const p = Math.max(C, M.offset - M.width / 2);
    (p > C && G.push({ start: C, end: p }),
      (C = Math.max(C, Math.min(h, M.offset + M.width / 2))));
  }
  C < h && G.push({ start: C, end: h });
  const O = ue(),
    N = O === "cartoon" && n,
    E = O === "cream" && n,
    d = ge(i, a),
    g = n
      ? N
        ? $(d.wallColor, d.wallEdgeColor, 0.18)
        : E
          ? d.wallEdgeColor
          : $(d.wallEdgeColor, "#ffffff", 0.1)
      : "#8d8982",
    _ = n
      ? N
        ? 0.06
        : E
          ? 0.065
          : Math.max(0.15, d.wallEdgeOpacity + 0.07)
      : 0.14;
  return t.jsxs("group", {
    position: y,
    rotation: [0, -m, 0],
    children: [
      t.jsxs("mesh", {
        position: [0, 0, -w / 2],
        castShadow: !n,
        receiveShadow: !0,
        children: [
          t.jsx("extrudeGeometry", {
            args: [
              k,
              n
                ? {
                    depth: w,
                    bevelEnabled: !0,
                    bevelSize: Math.min(0.014, w * 0.1),
                    bevelThickness: Math.min(0.008, w * 0.06),
                    bevelSegments: 2,
                    curveSegments: 3,
                  }
                : { depth: w, bevelEnabled: !1, curveSegments: 1 },
            ],
          }),
          N
            ? t.jsx("meshToonMaterial", {
                color: d.wallColor,
                transparent: d.wallOpacity < 0.99,
                opacity: d.wallOpacity,
                side: J,
              })
            : t.jsx("meshPhysicalMaterial", {
                color: n ? d.wallColor : s,
                roughness: E ? 0.6 : n ? 0.46 : 0.84,
                metalness: 0.004,
                clearcoat: E ? 0.04 : n ? 0.16 : 0,
                clearcoatRoughness: E ? 0.86 : 0.7,
                transparent: n && d.wallOpacity < 0.99,
                opacity: n
                  ? Math.max(0.18, d.wallOpacity * (E ? 0.96 : 0.88))
                  : 1,
                depthWrite: !n,
                side: J,
              }),
          t.jsx(Y, {
            color: g,
            threshold: N ? 18 : E ? 28 : n ? 26 : 35,
            opacity: _,
            transparent: !0,
          }),
        ],
      }),
      n &&
        t.jsxs("mesh", {
          position: [0, o + 0.006, 0],
          renderOrder: 5,
          children: [
            t.jsx("boxGeometry", { args: [h, N ? 0.018 : 0.012, w * 0.86] }),
            t.jsx("meshBasicMaterial", {
              color: N
                ? $(d.wallColor, d.wallEdgeColor, 0.3)
                : E
                  ? $(d.wallEdgeColor, d.wallColor, 0.16)
                  : $(d.wallEdgeColor, "#ffffff", 0.18),
              transparent: !0,
              opacity: N ? 0.2 : E ? 0.12 : 0.28,
              depthWrite: !1,
              toneMapped: !1,
            }),
          ],
        }),
      x.map((M) =>
        t.jsx(
          "group",
          {
            children: t.jsx(Hn, {
              opening: M,
              wallLength: h,
              wallDepth: w,
              presentation: n,
              theme: i,
              presentationMode: a,
              entity: M.entityId ? l[M.entityId] : void 0,
            }),
          },
          M.id,
        ),
      ),
      !n &&
        G.map((M, p) => {
          const v = M.start <= 0.001 ? M.start - w / 2 : M.start,
            P = M.end >= h - 0.001 ? M.end + w / 2 : M.end;
          return t.jsx(
            Fn,
            {
              x: (v + P) / 2 - h / 2,
              y: 0.045,
              width: P - v,
              height: 0.09,
              depth: w + 0.035,
              color: n ? d.wallColor : "#dedbd5",
              presentation: n,
              theme: i,
              presentationMode: a,
              showEdges: !1,
            },
            `baseboard-${p}`,
          );
        }),
    ],
  });
}
const An = (e, s, r) => {
  const o = e == null ? void 0 : e.attributes[s];
  return typeof o == "number" ? o : r;
};
function Wt({ active: e, axis: s = "z", speed: r = 8, children: o }) {
  const n = L.useRef(null);
  return (
    re((i, a) => {
      !e || !n.current || (n.current.rotation[s] += a * r);
    }),
    t.jsx("group", { ref: n, children: o })
  );
}
function Vt({ active: e, amplitude: s = 0.18, speed: r = 1.2, children: o }) {
  const n = L.useRef(null);
  return (
    re(({ clock: i }, a) => {
      if (!n.current) return;
      const c = e ? Math.sin(i.elapsedTime * r) * s : 0;
      n.current.rotation.y = V.damp(n.current.rotation.y, c, 6, a);
    }),
    t.jsx("group", { ref: n, children: o })
  );
}
function Dn(e, s = 8) {
  const [r, o] = L.useState(e),
    n = L.useRef(e);
  return (
    L.useEffect(() => {
      ((n.current = Number.isFinite(n.current) ? n.current : e),
        o((i) => (Number.isFinite(i) ? i : e)));
    }, [e]),
    re((i, a) => {
      const c = n.current;
      if (Math.abs(c - e) < 0.001) {
        c !== e && ((n.current = e), o(e));
        return;
      }
      const l = V.damp(c, e, s, a);
      ((n.current = Math.abs(l - e) < 0.001 ? e : l), o(n.current));
    }),
    r
  );
}
const Ls = { value: 0 };
function Wn() {
  return (
    re(({ clock: e }) => {
      Ls.value = e.elapsedTime;
    }),
    null
  );
}
const Vn = `
  precision mediump float;
  uniform vec3 uDirection;
  uniform float uEndHalfWidth;
  uniform float uLength;
  uniform float uLodFar;
  uniform float uLodNear;
  uniform float uPhase;
  uniform vec3 uSideAxis;
  uniform float uSideLock;
  uniform float uSpreadPower;
  uniform float uStartHalfWidth;
  uniform float uTime;
  uniform float uTurbulence;
  varying vec2 vUv;
  varying float vLodFade;

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise2(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  void main() {
    vUv = uv;
    float along = uv.y;
    float side = uv.x * 2.0 - 1.0;
    vec3 anchor = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
    mat3 basis = mat3(modelMatrix);

    vec3 rawDirection = basis * uDirection;
    if (length(rawDirection) < 0.0001) rawDirection = vec3(0.0, 0.0, 1.0);
    vec3 flowDirection = normalize(rawDirection);

    vec3 viewDirection = normalize(cameraPosition - anchor);
    vec3 cameraSide = cross(viewDirection, flowDirection);
    if (length(cameraSide) < 0.0001) cameraSide = cross(vec3(0.0, 1.0, 0.0), flowDirection);
    if (length(cameraSide) < 0.0001) cameraSide = vec3(1.0, 0.0, 0.0);
    cameraSide = normalize(cameraSide);

    vec3 preferredSide = basis * uSideAxis;
    if (length(preferredSide) < 0.0001) preferredSide = cameraSide;
    preferredSide = normalize(preferredSide);
    vec3 mixedSide = mix(cameraSide, preferredSide, clamp(uSideLock, 0.0, 1.0));
    if (length(mixedSide) < 0.0001) mixedSide = cameraSide;
    vec3 sideDirection = normalize(mixedSide);

    float width = mix(uStartHalfWidth, uEndHalfWidth, pow(along, uSpreadPower));
    float drift = (noise2(vec2(along * 3.7 - uTime * 0.11 + uPhase, side * 1.9)) - 0.5) * uTurbulence * along * (1.0 - along * 0.35);
    vec3 worldPosition = anchor + flowDirection * (along * uLength) + sideDirection * (side * width + drift);

    float cameraDistance = distance(cameraPosition, anchor);
    vLodFade = 1.0 - smoothstep(uLodNear, uLodFar, cameraDistance);
    gl_Position = projectionMatrix * viewMatrix * vec4(worldPosition, 1.0);
  }
`,
  Kn = `
  precision mediump float;
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uPhase;
  uniform float uSpeed;
  uniform float uStrength;
  uniform float uTime;
  uniform float uTurbulence;
  varying vec2 vUv;
  varying float vLodFade;

  float hash21(vec2 p) {
    p = fract(p * vec2(234.54, 875.31));
    p += dot(p, p + 31.72);
    return fract(p.x * p.y);
  }

  float noise2(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  void main() {
    float along = vUv.y;
    float side = vUv.x * 2.0 - 1.0;
    float time = uTime * uSpeed;
    vec2 flowUv = vec2(vUv.x * 4.2 + uPhase, along * 7.0 - time);
    float lowNoise = noise2(flowUv);
    float fineNoise = noise2(flowUv * 2.17 + 9.4);
    float edgeWarp = (lowNoise - 0.5) * uTurbulence * (0.18 + along * 0.62);
    float feather = 1.0 - smoothstep(0.52, 1.0, abs(side + edgeWarp));
    float root = 1.0 - smoothstep(0.0, 0.42, along);
    float farFade = 1.0 - smoothstep(0.62, 1.0, along);
    float startFade = smoothstep(0.0, 0.08, along);
    float stream = 0.5 + 0.5 * sin((along * 6.6 - time * 1.18 + lowNoise * 0.9 + uPhase) * 6.2831853);
    stream = smoothstep(0.5, 1.0, stream);
    float mist = 0.36 + lowNoise * 0.26 + fineNoise * 0.14;
    float lodOpacity = mix(0.42, 1.0, clamp(vLodFade, 0.0, 1.0));
    float alpha = uOpacity * uStrength * feather * startFade * farFade * lodOpacity * (0.46 + root * 0.72 + mist * 0.32 + stream * 0.18);
    // Keep the climate hue recognizable while adding a luminous, icy core so
    // the airflow reads clearly against the pale floorplan.
    vec3 color = mix(vec3(0.10, 0.66, 1.0), uColor, 0.84);
    float core = smoothstep(0.18, 0.92, root * 0.7 + stream * 0.42 + mist * 0.24);
    color = mix(color, vec3(0.78, 0.96, 1.0), core * 0.28);
    gl_FragColor = vec4(color, clamp(alpha * 1.12, 0.0, 0.68));
    if (gl_FragColor.a < 0.004) discard;
  }
`;
function ie({
  color: e,
  direction: s,
  endWidth: r,
  length: o,
  opacity: n,
  phase: i = 0,
  position: a = [0, 0, 0],
  sideAxis: c = [1, 0, 0],
  sideLock: l = 0.22,
  speed: f = 0.42,
  spreadPower: u = 1,
  startWidth: h,
  strength: m = 1,
  turbulence: y = 0.1,
  visible: w = !0,
}) {
  const b = $("#27b8ff", e, 0.58),
    j = L.useMemo(
      () => ({
        uColor: { value: new Re(b) },
        uDirection: { value: new fe(s[0], s[1], s[2]) },
        uEndHalfWidth: { value: r * 0.5 },
        uLength: { value: o },
        uLodFar: { value: 6.6 },
        uLodNear: { value: 2.2 },
        uOpacity: { value: n },
        uPhase: { value: i },
        uSideAxis: { value: new fe(c[0], c[1], c[2]) },
        uSideLock: { value: l },
        uSpeed: { value: f },
        uSpreadPower: { value: u },
        uStartHalfWidth: { value: h * 0.5 },
        uStrength: { value: m },
        uTime: Ls,
        uTurbulence: { value: y },
      }),
      [s, r, o, b, n, i, c, l, f, u, h, m, y],
    );
  return (
    L.useEffect(() => {
      (j.uColor.value.set(b),
        j.uDirection.value.set(s[0], s[1], s[2]),
        (j.uEndHalfWidth.value = r * 0.5),
        (j.uLength.value = o),
        (j.uOpacity.value = n),
        (j.uPhase.value = i),
        j.uSideAxis.value.set(c[0], c[1], c[2]),
        (j.uSideLock.value = l),
        (j.uSpeed.value = f),
        (j.uSpreadPower.value = u),
        (j.uStartHalfWidth.value = h * 0.5),
        (j.uStrength.value = m),
        (j.uTurbulence.value = y));
    }, [s, r, o, b, n, i, c, l, f, u, h, m, y, j]),
    w
      ? t.jsxs("mesh", {
          position: a,
          renderOrder: 10,
          raycast: ignoreSceneEffectRaycast,
          children: [
            t.jsx("planeGeometry", { args: [1, 1, 1, 1] }),
            t.jsx("shaderMaterial", {
              uniforms: j,
              vertexShader: Vn,
              fragmentShader: Kn,
              transparent: !0,
              depthWrite: !1,
              side: J,
              blending: q,
              toneMapped: !1,
            }),
          ],
        })
      : null
  );
}
function Un({ color: e, variant: s, strong: r = !1 }) {
  return t.jsx(ie, {
    color: e,
    direction: s === "down" ? [0, -1, 0] : [0, -0.08, 1],
    endWidth: r ? 0.82 : 0.5,
    length: r ? 1.08 : 0.7,
    opacity: r ? 0.32 : 0.21,
    phase: 0.17,
    sideAxis: [1, 0, 0],
    sideLock: 0.18,
    speed: 0.58,
    spreadPower: 0.78,
    startWidth: r ? 0.22 : 0.14,
    turbulence: r ? 0.18 : 0.12,
  });
}
function ut({
  color: e,
  profile: s = "round",
  strong: r = !1,
  variant: o,
  wideStart: n = !1,
}) {
  const i = r ? 0.34 : 0.22;
  if (s === "slot")
    return t.jsx(ie, {
      color: e,
      direction: [0, -0.03, 1],
      endWidth: 0.86,
      length: r ? 1.16 : 0.86,
      opacity: i * 0.82,
      phase: 0.31,
      sideAxis: [0, 1, 0],
      sideLock: 0.88,
      speed: 0.38,
      spreadPower: 1.15,
      startWidth: 0.7,
      turbulence: 0.08,
    });
  if (o === "down")
    return t.jsxs(t.Fragment, {
      children: [
        t.jsx(ie, {
          color: e,
          direction: [0, -1, 0],
          endWidth: 1.55,
          length: r ? 1.16 : 0.84,
          opacity: i * 0.92,
          phase: 0.12,
          sideAxis: [1, 0, 0],
          sideLock: 0.2,
          speed: 0.34,
          spreadPower: 0.66,
          startWidth: 0.34,
          turbulence: 0.16,
        }),
        t.jsx(ie, {
          color: e,
          direction: [0, -1, 0],
          endWidth: 1.35,
          length: r ? 1.02 : 0.76,
          opacity: i * 0.56,
          phase: 0.54,
          sideAxis: [0, 0, 1],
          sideLock: 0.5,
          speed: 0.3,
          spreadPower: 0.72,
          startWidth: 0.26,
          turbulence: 0.14,
        }),
      ],
    });
  const a = n ? 0.42 : 0.26;
  return t.jsxs(t.Fragment, {
    children: [
      t.jsx(ie, {
        color: e,
        direction: [0, -0.04, 1],
        endWidth: r ? 1.18 : 0.82,
        length: r ? 1.3 : 0.92,
        opacity: i,
        phase: 0.19,
        sideAxis: [1, 0, 0],
        sideLock: 0.18,
        speed: 0.42,
        spreadPower: 0.76,
        startWidth: a,
        turbulence: 0.2,
      }),
      t.jsx(ie, {
        color: e,
        direction: [0, -0.02, 1],
        endWidth: r ? 0.82 : 0.58,
        length: r ? 1.12 : 0.8,
        opacity: i * 0.52,
        phase: 0.61,
        sideAxis: [0, 1, 0],
        sideLock: 0.36,
        speed: 0.36,
        spreadPower: 0.9,
        startWidth: a * 0.72,
        turbulence: 0.16,
      }),
    ],
  });
}
const qn = (() => {
    const e = new Le();
    return (
      e.moveTo(0.06, -0.044),
      e.bezierCurveTo(0.3, -0.082, 0.66, -0.088, 0.92, -0.066),
      e.bezierCurveTo(1.01, -0.056, 1.06, -0.026, 1.075, 0.012),
      e.bezierCurveTo(1.052, 0.052, 1.006, 0.07, 0.92, 0.074),
      e.bezierCurveTo(0.64, 0.088, 0.28, 0.076, 0.06, 0.042),
      e.bezierCurveTo(0.02, 0.03, 0.018, -0.034, 0.06, -0.044),
      e
    );
  })(),
  Yn = (() => {
    const e = new Le();
    return (
      e.moveTo(0.028, -0.026),
      e.bezierCurveTo(0.082, -0.082, 0.174, -0.106, 0.236, -0.072),
      e.bezierCurveTo(0.272, -0.044, 0.266, 0.026, 0.218, 0.066),
      e.bezierCurveTo(0.152, 0.116, 0.07, 0.082, 0.026, 0.024),
      e.bezierCurveTo(0.012, 0.006, 0.012, -0.008, 0.028, -0.026),
      e
    );
  })();
function Xn({ color: e }) {
  return t.jsxs("group", {
    position: [0, -0.066, 0.095],
    children: [
      t.jsx(ie, {
        color: e,
        direction: [0, -0.42, 1],
        endWidth: 0.72,
        length: 0.88,
        opacity: 0.26,
        phase: 0.22,
        sideAxis: [1, 0, 0],
        sideLock: 0.42,
        speed: 0.34,
        spreadPower: 0.82,
        startWidth: 0.38,
        turbulence: 0.1,
      }),
      t.jsx(ie, {
        color: e,
        direction: [0, -0.36, 1],
        endWidth: 0.5,
        length: 0.76,
        opacity: 0.16,
        phase: 0.67,
        sideAxis: [0, 1, 0],
        sideLock: 0.3,
        speed: 0.28,
        spreadPower: 0.95,
        startWidth: 0.22,
        turbulence: 0.08,
      }),
    ],
  });
}
function Zn({ color: e }) {
  return t.jsxs("group", {
    position: [0, -0.09, 0.2],
    children: [
      t.jsx(ie, {
        color: e,
        direction: [0, -0.24, 1],
        endWidth: 1.46,
        length: 0.88,
        opacity: 0.24,
        phase: 0.1,
        sideAxis: [1, 0, 0],
        sideLock: 0.58,
        speed: 0.24,
        spreadPower: 0.62,
        startWidth: 0.72,
        turbulence: 0.075,
      }),
      t.jsx(ie, {
        color: e,
        direction: [0, -0.18, 1],
        endWidth: 1.04,
        length: 0.76,
        opacity: 0.14,
        phase: 0.49,
        sideAxis: [0, 1, 0],
        sideLock: 0.24,
        speed: 0.21,
        spreadPower: 0.86,
        startWidth: 0.36,
        turbulence: 0.065,
      }),
    ],
  });
}
function Qn({ color: e }) {
  return t.jsxs("group", {
    position: [0, 0.86, 0.146],
    children: [
      t.jsx(ie, {
        color: e,
        direction: [0, -0.34, 1],
        endWidth: 0.76,
        length: 0.74,
        opacity: 0.25,
        phase: 0.28,
        sideAxis: [1, 0, 0],
        sideLock: 0.4,
        speed: 0.3,
        spreadPower: 0.9,
        startWidth: 0.32,
        turbulence: 0.12,
      }),
      t.jsx(ie, {
        color: e,
        direction: [0, -0.38, 1],
        endWidth: 0.92,
        length: 0.7,
        opacity: 0.16,
        phase: 0.73,
        sideAxis: [0, 1, 0],
        sideLock: 0.68,
        speed: 0.26,
        spreadPower: 1.05,
        startWidth: 0.56,
        turbulence: 0.1,
      }),
    ],
  });
}
function Jn(e) {
  const r = [
    e == null ? void 0 : e.attributes.temperature,
    e == null ? void 0 : e.attributes.target_temperature,
    e == null ? void 0 : e.attributes.current_temperature,
  ]
    .map((o) =>
      typeof o == "number"
        ? o
        : typeof o == "string"
          ? Number.parseFloat(o)
          : Number.NaN,
    )
    .find((o) => Number.isFinite(o));
  return `${Math.round(r ?? 26)}°`;
}
function ei({ color: e, temperature: s }) {
  return t.jsx(le, {
    position: [0, 0.48, 0.04],
    center: !0,
    zIndexRange: ve,
    className: "scene-climate-status-badge",
    children: t.jsxs("div", {
      children: [
        t.jsx(co, { size: 19, strokeWidth: 2.7, style: { color: e } }),
        t.jsx("strong", { children: s }),
      ],
    }),
  });
}
function SceneEffectGroup({ children, ...props }) {
  const root = L.useRef(null);
  L.useLayoutEffect(() => disableSceneEffectPicking(root.current));
  return t.jsx("group", { ...props, ref: root, children });
}
function Xe({
  color: e,
  level: s,
  position: r,
  radius: o,
  scale: n = [1, 1, 1],
}) {
  const i = e;
  return t.jsxs(SceneEffectGroup, {
    position: r,
    children: [
      t.jsxs("mesh", {
        scale: n,
        renderOrder: 7,
        children: [
          t.jsx("sphereGeometry", { args: [o, 32, 16] }),
          t.jsx("meshBasicMaterial", {
            color: i,
            transparent: !0,
            opacity: 0.055 + s * 0.16,
            depthWrite: !1,
            blending: q,
            toneMapped: !1,
          }),
        ],
      }),
      t.jsxs("mesh", {
        scale: [n[0] * 1.7, n[1] * 1.7, n[2] * 1.7],
        renderOrder: 6,
        children: [
          t.jsx("sphereGeometry", { args: [o, 32, 16] }),
          t.jsx("meshBasicMaterial", {
            color: i,
            transparent: !0,
            opacity: 0.02 + s * 0.075,
            depthWrite: !1,
            blending: q,
            toneMapped: !1,
          }),
        ],
      }),
    ],
  });
}
function Kt({ color: e, level: s, radius: r, position: o, elongated: n = !1 }) {
  const i = e,
    a = n ? [1.65, 1, 1] : [1, 1, 1];
  return t.jsx(SceneEffectGroup, {
    position: o,
    rotation: [-Math.PI / 2, 0, 0],
    scale: a,
    renderOrder: 5,
    children: t.jsxs("mesh", {
      children: [
        t.jsx("circleGeometry", { args: [r, 56] }),
        t.jsx("meshBasicMaterial", {
          color: i,
          transparent: !0,
          opacity: 0.018 + s * 0.052,
          depthWrite: !1,
          blending: q,
          toneMapped: !1,
        }),
      ],
    }),
  });
}
function je({ color: e, brightness: s, variant: r }) {
  const o = V.clamp(s, 0, 1),
    n = Cs(e),
    i = n;
  if (r === "floor")
    return t.jsxs(SceneEffectGroup, {
      children: [
        t.jsx("pointLight", {
          color: i,
          intensity: 0.42 + o * 1.9,
          distance: 2.25 + o * 1.9,
          position: [0, 1.14, 0],
          decay: 2,
        }),
        t.jsx(Xe, {
          color: n,
          level: o,
          position: [0, 1.06, 0],
          radius: 0.22,
          scale: [1.05, 0.72, 1.05],
        }),
        t.jsx(Kt, {
          color: n,
          level: o,
          radius: 0.42 + o * 0.18,
          position: [0, 0.026, 0],
        }),
      ],
    });
  if (r === "strip")
    return t.jsxs(SceneEffectGroup, {
      children: [
        t.jsx("pointLight", {
          color: i,
          intensity: 0.32 + o * 1.42,
          distance: 2.2 + o * 1.7,
          decay: 2,
        }),
        t.jsx(Xe, {
          color: n,
          level: o,
          position: [0, -0.045, 0],
          radius: 0.15,
          scale: [3.15, 0.3, 0.42],
        }),
        t.jsxs("mesh", {
          position: [0, -0.09, 0],
          rotation: [-Math.PI / 2, 0, 0],
          children: [
            t.jsx("planeGeometry", { args: [1.18, 0.28] }),
            t.jsx("meshBasicMaterial", {
              color: i,
              transparent: !0,
              opacity: 0.045 + o * 0.092,
              depthWrite: !1,
              blending: q,
              toneMapped: !1,
            }),
          ],
        }),
      ],
    });
  if (r === "wall")
    return t.jsxs(SceneEffectGroup, {
      children: [
        t.jsx("pointLight", {
          color: i,
          intensity: 0.38 + o * 1.7,
          distance: 1.9 + o * 1.4,
          decay: 2,
          position: [0, 0, 0.12],
        }),
        t.jsx(Xe, {
          color: n,
          level: o,
          position: [0, 0, 0.06],
          radius: 0.17,
          scale: [1.35, 0.82, 0.38],
        }),
        t.jsxs("mesh", {
          position: [0, -0.18, 0.18],
          rotation: [-Math.PI / 2, 0, 0],
          children: [
            t.jsx("coneGeometry", { args: [0.34, 0.72, 36, 1, !0] }),
            t.jsx("meshBasicMaterial", {
              color: i,
              transparent: !0,
              opacity: 0.014 + o * 0.048,
              side: J,
              depthWrite: !1,
              blending: q,
              toneMapped: !1,
            }),
          ],
        }),
      ],
    });
  const a = r === "chandelier" ? 1.08 : r === "downlight" ? 0.9 : 1.28,
    c = r === "downlight" ? 0.16 : r === "chandelier" ? 0.38 : 0.44,
    l = r === "chandelier" ? -0.52 : r === "downlight" ? -0.028 : -0.068,
    f = r === "downlight" ? 0.058 : r === "chandelier" ? 0.26 : 0.24,
    u =
      r === "downlight"
        ? [1, 0.18, 1]
        : [1, r === "chandelier" ? 0.5 : 0.34, 1],
    h = r === "downlight" ? 0.011 + o * 0.038 : 0.018 + o * 0.058;
  return t.jsxs(SceneEffectGroup, {
    children: [
      t.jsx("pointLight", {
        color: i,
        intensity:
          (r === "chandelier" ? 0.62 : 0.42) +
          o * (r === "downlight" ? 1.08 : 2.12),
        distance:
          (r === "ceiling" ? 3.35 : r === "downlight" ? 2.15 : 2.75) +
          o * (r === "downlight" ? 1.1 : 1.75),
        decay: 2,
        position: [0, l, 0],
      }),
      r !== "ceiling" &&
        t.jsx(Xe, {
          color: n,
          level: o,
          position: [0, l, 0],
          radius: f,
          scale: u,
        }),
      t.jsxs("mesh", {
        position: [0, l - a / 2, 0],
        children: [
          t.jsx("coneGeometry", { args: [c, a, 40, 1, !0] }),
          t.jsx("meshBasicMaterial", {
            color: i,
            transparent: !0,
            opacity: h,
            side: J,
            depthWrite: !1,
            blending: q,
            toneMapped: !1,
          }),
        ],
      }),
      t.jsx(Kt, {
        color: n,
        level: o,
        radius: c * (0.72 + o * 0.16),
        position: [0, l - a + 0.012, 0],
      }),
    ],
  });
}
function $s({
  modelId: e,
  bodyColor: s,
  appearance: r,
  unavailable: o,
  modeHighlighted: n,
  presentation: i,
  selected: a = !1,
  device: c,
}) {
  const l = ue(),
    f = l === "cartoon" && i,
    u = l === "cream" && i,
    h = r.isOn && !o,
    m = a && !o,
    y = r.brightness,
    w = o ? 0.48 : 1,
    b = o
      ? "#7d8790"
      : i
        ? u
          ? $(s, "#fff5e8", 0.68)
          : $(s, "#fbfdff", 0.84)
        : "#eef1ef",
    j = Cs(r.color),
    x = o
      ? "#a5adb2"
      : h
        ? $(j, "#fffdf4", 0.58)
        : m
          ? $(j, "#f8fdff", 0.62)
          : i
            ? "#edf4f6"
            : "#e4e8e5",
    k = h ? (0.28 + y * 1.62) * (n ? 1.1 : 1) : m ? 0.34 : 0,
    G = dt(f, u),
    C = (E = 0.04) =>
      t.jsxs(t.Fragment, {
        children: [
          f
            ? t.jsx("meshToonMaterial", {
                color: b,
                emissive: m ? j : "#000000",
                emissiveIntensity: m ? 0.12 : 0,
                transparent: o,
                opacity: w,
              })
            : t.jsx("meshPhysicalMaterial", {
                color: b,
                roughness: i ? 0.28 : 0.42,
                metalness: E,
                clearcoat: i ? 0.36 : 0.2,
                clearcoatRoughness: i ? 0.55 : 0.72,
                emissive: m ? j : "#000000",
                emissiveIntensity: m ? 0.12 : 0,
                transparent: o,
                opacity: w,
              }),
          t.jsx(Y, {
            color: i ? G.color : Pt(b),
            threshold: i ? G.threshold : 34,
            opacity: i ? G.opacity : 0.12,
            transparent: !0,
          }),
        ],
      }),
    O = () =>
      t.jsxs(t.Fragment, {
        children: [
          f
            ? t.jsx("meshToonMaterial", {
                color: x,
                emissive: h || m ? j : "#000000",
                emissiveIntensity: k * 0.56,
                transparent: !0,
                opacity: o ? 0.42 : h ? 0.98 : m ? 0.88 : 0.82,
              })
            : t.jsx("meshPhysicalMaterial", {
                color: x,
                emissive: h || m ? j : "#000000",
                emissiveIntensity: k,
                roughness: i ? 0.22 : 0.3,
                metalness: 0,
                clearcoat: i ? 0.36 : 0.26,
                clearcoatRoughness: i ? 0.5 : 0.6,
                transparent: !0,
                opacity: o ? 0.42 : h ? 0.98 : m ? 0.9 : 0.84,
              }),
          i &&
            t.jsx(Y, {
              color: G.color,
              threshold: G.threshold,
              opacity:
                h || m ? Math.min(G.opacity + 0.06, 0.3) : G.opacity * 0.8,
              transparent: !0,
            }),
        ],
      }),
    N = (E = 1) =>
      t.jsx("meshBasicMaterial", {
        color: h || m ? j : r.color,
        transparent: !0,
        opacity: h ? (0.12 + y * 0.28) * E : m ? 0.09 * E : 0.025,
        depthWrite: !1,
        blending: h || m ? q : Se,
        toneMapped: !1,
      });
  if (e === "light.ceiling_panel") {
    const E = i ? $(b, "#d8dde0", 0.36) : "#d7dcdd",
      d = h || m ? $(j, "#ffffff", 0.52) : "#f4f7f5",
      g = f
        ? t.jsx("meshToonMaterial", {
            color: b,
            emissive: m ? j : "#000000",
            emissiveIntensity: m ? 0.08 : 0,
            transparent: o,
            opacity: w,
          })
        : t.jsx("meshPhysicalMaterial", {
            color: b,
            roughness: i ? 0.3 : 0.44,
            metalness: 0.05,
            clearcoat: i ? 0.34 : 0.18,
            clearcoatRoughness: i ? 0.58 : 0.74,
            emissive: m ? j : "#000000",
            emissiveIntensity: m ? 0.08 : 0,
            transparent: o,
            opacity: w,
          }),
      _ = f
        ? t.jsx("meshToonMaterial", {
            color: x,
            emissive: h || m ? j : "#000000",
            emissiveIntensity: k * 0.5,
            transparent: !0,
            opacity: o ? 0.42 : h ? 0.98 : m ? 0.88 : 0.84,
          })
        : t.jsx("meshPhysicalMaterial", {
            color: x,
            emissive: h || m ? j : "#000000",
            emissiveIntensity: k,
            roughness: i ? 0.24 : 0.32,
            metalness: 0,
            clearcoat: i ? 0.34 : 0.24,
            clearcoatRoughness: i ? 0.52 : 0.62,
            transparent: !0,
            opacity: o ? 0.42 : h ? 0.98 : m ? 0.9 : 0.86,
          }),
      M = () =>
        f
          ? t.jsx("meshToonMaterial", { color: E, transparent: o, opacity: w })
          : t.jsx("meshPhysicalMaterial", {
              color: E,
              roughness: 0.36,
              metalness: 0.12,
              clearcoat: 0.28,
              clearcoatRoughness: 0.64,
              transparent: o,
              opacity: w,
            });
    return t.jsxs("group", {
      children: [
        t.jsx(D, {
          position: [0, 0.011, 0],
          args: [0.52, 0.026, 0.31],
          radius: 0.012,
          smoothness: 5,
          castShadow: !0,
          children: g,
        }),
        t.jsx(D, {
          position: [0, -0.009, 0],
          args: [0.475, 0.02, 0.265],
          radius: 0.009,
          smoothness: 5,
          children: _,
        }),
        t.jsx(D, {
          position: [0, -0.021, -0.143],
          args: [0.47, 0.0035, 0.008],
          radius: 0.0015,
          smoothness: 2,
          children: M(),
        }),
        t.jsx(D, {
          position: [0, -0.021, 0.143],
          args: [0.47, 0.0035, 0.008],
          radius: 0.0015,
          smoothness: 2,
          children: M(),
        }),
        t.jsx(D, {
          position: [-0.243, -0.021, 0],
          args: [0.008, 0.0035, 0.262],
          radius: 0.0015,
          smoothness: 2,
          children: M(),
        }),
        t.jsx(D, {
          position: [0.243, -0.021, 0],
          args: [0.008, 0.0035, 0.262],
          radius: 0.0015,
          smoothness: 2,
          children: M(),
        }),
        t.jsxs("mesh", {
          position: [0, -0.024, 0],
          rotation: [-Math.PI / 2, 0, 0],
          renderOrder: 8,
          children: [
            t.jsx("planeGeometry", { args: [0.43, 0.23] }),
            N(h ? 0.78 : 0.38),
          ],
        }),
        t.jsxs("mesh", {
          position: [0, -0.0242, 0],
          rotation: [-Math.PI / 2, 0, 0],
          renderOrder: 9,
          children: [
            t.jsx("planeGeometry", { args: [0.355, 0.17] }),
            t.jsx("meshBasicMaterial", {
              color: d,
              transparent: !0,
              opacity: o ? 0.06 : h ? 0.18 + y * 0.18 : m ? 0.13 : 0.055,
              depthWrite: !1,
              blending: h || m ? q : Se,
              toneMapped: !1,
            }),
          ],
        }),
        h && t.jsx(je, { color: r.color, brightness: y, variant: "ceiling" }),
      ],
    });
  }
  if (e === "light.ceiling_round")
    return t.jsxs("group", {
      children: [
        t.jsxs("mesh", {
          position: [0, 0.016, 0],
          castShadow: !0,
          children: [
            t.jsx("cylinderGeometry", { args: [0.245, 0.262, 0.034, 64] }),
            C(0.05),
          ],
        }),
        t.jsxs("mesh", {
          position: [0, -0.01, 0],
          castShadow: !0,
          children: [
            t.jsx("cylinderGeometry", { args: [0.225, 0.238, 0.03, 64] }),
            O(),
          ],
        }),
        t.jsxs("mesh", {
          position: [0, -0.03, 0],
          rotation: [-Math.PI / 2, 0, 0],
          renderOrder: 8,
          children: [
            t.jsx("circleGeometry", { args: [0.2, 64] }),
            N(h ? 0.78 : 0.38),
          ],
        }),
        h && t.jsx(je, { color: r.color, brightness: y, variant: "ceiling" }),
      ],
    });
  if (e === "light.downlight") {
    const E = o ? "#8f98a2" : i ? $(b, "#ffffff", 0.44) : b,
      d = o ? "#a5adb2" : h ? $(j, "#fffaf0", 0.58) : "#dfe5e6";
    return t.jsxs("group", {
      children: [
        t.jsxs("mesh", {
          castShadow: !0,
          position: [0, 0.004, 0],
          children: [
            t.jsx("cylinderGeometry", { args: [0.098, 0.108, 0.018, 48] }),
            t.jsx("meshPhysicalMaterial", {
              color: E,
              roughness: i ? 0.28 : 0.36,
              metalness: 0.08,
              clearcoat: 0.28,
              clearcoatRoughness: 0.62,
              transparent: o,
              opacity: w,
            }),
          ],
        }),
        t.jsxs("mesh", {
          position: [0, -0.008, 0],
          children: [
            t.jsx("cylinderGeometry", { args: [0.058, 0.068, 0.014, 48] }),
            t.jsx("meshPhysicalMaterial", {
              color: d,
              emissive: h || m ? j : "#000000",
              emissiveIntensity: h ? 0.28 + y * 1.05 : m ? 0.36 : 0,
              roughness: 0.22,
              metalness: 0,
              clearcoat: 0.3,
              clearcoatRoughness: 0.52,
              transparent: !0,
              opacity: o ? 0.42 : h ? 0.96 : m ? 0.86 : 0.72,
            }),
          ],
        }),
        t.jsxs("mesh", {
          position: [0, -0.017, 0],
          rotation: [-Math.PI / 2, 0, 0],
          renderOrder: 8,
          children: [t.jsx("circleGeometry", { args: [0.07, 48] }), N(0.42)],
        }),
        h && t.jsx(je, { color: r.color, brightness: y, variant: "downlight" }),
      ],
    });
  }
  if (e === "light.chandelier")
    return t.jsxs("group", {
      children: [
        t.jsxs("mesh", {
          position: [0, 0.08, 0],
          castShadow: !0,
          children: [
            t.jsx("cylinderGeometry", { args: [0.1, 0.115, 0.055, 32] }),
            C(0.08),
          ],
        }),
        t.jsxs("mesh", {
          position: [0, -0.16, 0],
          castShadow: !0,
          children: [
            t.jsx("cylinderGeometry", { args: [0.014, 0.014, 0.44, 12] }),
            C(0.18),
          ],
        }),
        t.jsxs("mesh", {
          position: [0, -0.4, 0],
          castShadow: !0,
          children: [
            t.jsx("cylinderGeometry", { args: [0.13, 0.29, 0.24, 40, 1, !0] }),
            C(0.06),
          ],
        }),
        t.jsxs("mesh", {
          position: [0, -0.525, 0],
          children: [
            t.jsx("cylinderGeometry", { args: [0.245, 0.27, 0.026, 40] }),
            O(),
          ],
        }),
        t.jsxs("mesh", {
          position: [0, -0.542, 0],
          rotation: [-Math.PI / 2, 0, 0],
          children: [t.jsx("circleGeometry", { args: [0.25, 40] }), N()],
        }),
        h &&
          t.jsx(je, { color: r.color, brightness: y, variant: "chandelier" }),
      ],
    });
  if (e === "light.wall_sconce")
    return t.jsxs("group", {
      children: [
        t.jsxs("mesh", {
          position: [0, 0, -0.006],
          rotation: [Math.PI / 2, 0, 0],
          castShadow: !0,
          children: [
            t.jsx("cylinderGeometry", { args: [0.17, 0.17, 0.036, 40] }),
            C(0.08),
          ],
        }),
        t.jsx(D, {
          position: [0, -0.02, 0.036],
          args: [0.26, 0.24, 0.082],
          radius: 0.06,
          smoothness: 6,
          castShadow: !0,
          children: O(),
        }),
        t.jsxs("mesh", {
          position: [0, -0.02, 0.087],
          renderOrder: 8,
          children: [
            t.jsx("circleGeometry", { args: [0.125, 40] }),
            N(h ? 0.62 : 0.32),
          ],
        }),
        t.jsxs("mesh", {
          position: [0, -0.17, 0.036],
          castShadow: !0,
          children: [
            t.jsx("cylinderGeometry", { args: [0.012, 0.012, 0.18, 12] }),
            C(0.16),
          ],
        }),
        h && t.jsx(je, { color: r.color, brightness: y, variant: "wall" }),
      ],
    });
  if (e === "light.floor_lamp")
    return t.jsxs("group", {
      children: [
        t.jsxs("mesh", {
          position: [0, 0.025, 0],
          castShadow: !0,
          children: [
            t.jsx("cylinderGeometry", { args: [0.17, 0.19, 0.05, 32] }),
            C(0.1),
          ],
        }),
        t.jsxs("mesh", {
          position: [0, 0.59, 0],
          castShadow: !0,
          children: [
            t.jsx("cylinderGeometry", { args: [0.018, 0.022, 1.12, 14] }),
            C(0.2),
          ],
        }),
        t.jsxs("mesh", {
          position: [0, 1.19, 0],
          castShadow: !0,
          children: [
            t.jsx("cylinderGeometry", { args: [0.17, 0.245, 0.28, 40, 1, !0] }),
            C(0.05),
          ],
        }),
        t.jsxs("mesh", {
          position: [0, 1.045, 0],
          children: [
            t.jsx("cylinderGeometry", { args: [0.205, 0.225, 0.024, 40] }),
            O(),
          ],
        }),
        t.jsxs("mesh", {
          position: [0, 1.03, 0],
          rotation: [-Math.PI / 2, 0, 0],
          children: [t.jsx("circleGeometry", { args: [0.21, 40] }), N()],
        }),
        h && t.jsx(je, { color: r.color, brightness: y, variant: "floor" }),
      ],
    });
  if (e === "light.strip") {
    const E = h ? $(j, "#fff6d6", 0.26) : "#8fa0a7",
      d = 0.032,
      g = (_, M, p) => {
        const v = p[0] - M[0],
          P = p[1] - M[1],
          T = Math.max(0.08, Math.hypot(v, P)),
          z = Math.max(0.012, T - d * 2),
          I = Math.atan2(P, v),
          F = [(M[0] + p[0]) / 2, 0, (M[1] + p[1]) / 2];
        return t.jsxs(
          "group",
          {
            position: F,
            rotation: [0, -I, 0],
            children: [
              h &&
                t.jsxs("mesh", {
                  rotation: [0, 0, Math.PI / 2],
                  children: [
                    t.jsx("capsuleGeometry", { args: [d * 2.05, z, 8, 24] }),
                    t.jsx("meshBasicMaterial", {
                      color: E,
                      transparent: !0,
                      opacity: (0.12 + y * 0.24) * (n ? 1.15 : 1),
                      depthWrite: !1,
                      blending: q,
                      toneMapped: !1,
                    }),
                  ],
                }),
              t.jsxs("mesh", {
                rotation: [0, 0, Math.PI / 2],
                children: [
                  t.jsx("capsuleGeometry", { args: [d, z, 8, 28] }),
                  t.jsx("meshBasicMaterial", {
                    color: E,
                    transparent: !0,
                    opacity: o ? 0.2 : h ? 0.94 : 0.34,
                    depthWrite: !1,
                    blending: h ? q : Se,
                    toneMapped: !1,
                  }),
                ],
              }),
              t.jsxs("mesh", {
                rotation: [0, 0, Math.PI / 2],
                children: [
                  t.jsx("capsuleGeometry", {
                    args: [0.12, Math.max(0.01, T - 0.24), 4, 12],
                  }),
                  t.jsx("meshBasicMaterial", {
                    transparent: !0,
                    opacity: 0,
                    depthWrite: !1,
                  }),
                ],
              }),
            ],
          },
          _,
        );
      };
    if (c && Ve(c)) {
      const _ = [c.position[0], c.position[2]],
        M = js(ys(c), xs(c));
      return t.jsx("group", {
        children: M.map((p, v) =>
          g(
            `strip-segment-${v}`,
            [p.start[0] - _[0], p.start[1] - _[1]],
            [p.end[0] - _[0], p.end[1] - _[1]],
          ),
        ),
      });
    }
    return t.jsx("group", {
      children: t.jsxs("mesh", {
        rotation: [0, 0, Math.PI / 2],
        children: [
          t.jsx("capsuleGeometry", { args: [d, 0.88, 8, 28] }),
          t.jsx("meshBasicMaterial", {
            color: E,
            transparent: !0,
            opacity: o ? 0.2 : h ? 0.94 : 0.34,
            depthWrite: !1,
            blending: h ? q : Se,
            toneMapped: !1,
          }),
        ],
      }),
    });
  }
  return t.jsxs("group", {
    children: [
      t.jsxs("mesh", {
        position: [0, 0.018, 0],
        castShadow: !0,
        children: [
          t.jsx("cylinderGeometry", { args: [0.285, 0.31, 0.044, 64] }),
          C(0.05),
        ],
      }),
      t.jsxs("mesh", {
        position: [0, -0.014, 0],
        castShadow: !0,
        children: [
          t.jsx("cylinderGeometry", { args: [0.255, 0.275, 0.036, 64] }),
          O(),
        ],
      }),
      t.jsxs("mesh", {
        position: [0, -0.036, 0],
        rotation: [-Math.PI / 2, 0, 0],
        renderOrder: 8,
        children: [
          t.jsx("ringGeometry", { args: [0.19, 0.265, 64] }),
          N(h ? 0.82 : 0.45),
        ],
      }),
      t.jsxs("mesh", {
        position: [0, -0.038, 0],
        rotation: [-Math.PI / 2, 0, 0],
        renderOrder: 9,
        children: [
          t.jsx("circleGeometry", { args: [0.176, 64] }),
          N(h ? 0.72 : 0.36),
        ],
      }),
      t.jsxs("mesh", {
        position: [0, 0.046, 0],
        rotation: [-Math.PI / 2, 0, 0],
        children: [
          t.jsx("ringGeometry", { args: [0.255, 0.304, 64] }),
          t.jsx("meshBasicMaterial", {
            color: $(b, "#ffffff", 0.32),
            transparent: !0,
            opacity: o ? 0.18 : 0.32,
            depthWrite: !1,
            toneMapped: !1,
          }),
        ],
      }),
      h && t.jsx(je, { color: r.color, brightness: y, variant: "ceiling" }),
    ],
  });
}
function useRuntimeModelGlow(target, active, version) {
  const effect = L.useRef(null);
  const { invalidate } = tt();
  re(({ clock }) => {
    if (!effect.current) return;
    updateRuntimeModelGlow(effect.current, clock.elapsedTime);
    invalidate();
  });
  L.useEffect(() => {
    const root = target && "current" in target ? target.current : target;
    if (!root || !active) return;
    effect.current = createRuntimeModelGlow(root);
    invalidate();
    return () => {
      disposeRuntimeModelGlow(effect.current);
      effect.current = null;
      invalidate();
    };
  }, [target, active, version, invalidate]);
}
function UploadedDeviceModel({ config: e, runtime, unavailable = false, running = false, motionEntity }) {
  const [s, r] = L.useState();
  const { invalidate } = tt();
  const partEngine=L.useRef(null);
  const availabilityRef=L.useRef(unavailable);availabilityRef.current=unavailable;
  const motionValues=motionCapabilityValues(motionEntity);
  const motionRulesKey=JSON.stringify(e.partMotionRules??[]);
  L.useEffect(()=>{if(!s||!e.partMotionRules?.length)return;applyModelAvailability(s,false);partEngine.current=createPartMotionEngine(s,e.partMotionRules);invalidate();return()=>{partEngine.current?.dispose();partEngine.current=null;applyModelAvailability(s,availabilityRef.current);invalidate();};},[s,motionRulesKey,invalidate]);
  L.useEffect(()=>invalidate(),[JSON.stringify(motionValues),unavailable,motionEntity?.deviceMotionAvailable,invalidate]);
  L.useLayoutEffect(() => configureDeviceModelPicking(s), [s]);
  const pulsator = L.useRef(null);
  const indicator = L.useRef(null);
  useRuntimeModelGlow(s, running && !unavailable && !e.partMotionRules?.length);
  re(({ clock }, delta) => {
    if(partEngine.current?.update(motionValues,clock.elapsedTime,delta,{available:!unavailable&&motionEntity?.deviceMotionAvailable!==false}))invalidate();
    if (runtime?.running && pulsator.current && !e.partMotionRules?.length) {
      pulsator.current.rotation.y += Math.min(delta, 0.1) * 3.2;
      if (indicator.current) {
        indicator.current.emissiveIntensity =
          0.4 + 0.35 * (0.5 + 0.5 * Math.sin(clock.elapsedTime * 5));
      }
      invalidate();
    }
  });
  L.useEffect(() => {
    if (!runtime?.running && indicator.current) {
      indicator.current.emissiveIntensity = 0;
      invalidate();
    }
  }, [runtime?.running, invalidate]);
  L.useLayoutEffect(() => {
    if(!e.partMotionRules?.length)applyModelAvailability(s, unavailable);
    invalidate();
  }, [s, unavailable, motionRulesKey, invalidate]);
  L.useEffect(() => {
    let o = !0,
      n;
    new za().load(
      e.source.url,
      (i) => {
        if (!o) return;
        n = i.scene.clone(!0);
        n.traverse((part) => {
          if (!part.isMesh || !part.material) return;
          const prepareMaterial = (material) => {
            const configured = e.projectAppearance
              ? overrideModelMaterial(material, e)
              : material;
            return configured === material ? material.clone() : configured;
          };
          part.material = Array.isArray(part.material)
            ? part.material.map(prepareMaterial)
            : prepareMaterial(part.material);
        });
        const a = new Xa.Box3().setFromObject(n),
          c = a.getSize(new Xa.Vector3()),
          l = e.dimensions ?? { width: 0.6, height: 0.85, depth: 0.65 },
          f = e.scale ?? 1;
        n.scale.set(
          (l.width / Math.max(c.x, 1e-4)) * f,
          (l.height / Math.max(c.y, 1e-4)) * f,
          (l.depth / Math.max(c.z, 1e-4)) * f,
        );
        const u = new Xa.Box3().setFromObject(n),
          h = u.getCenter(new Xa.Vector3());
        n.position.set(-h.x, -u.min.y, -h.z);
        pulsator.current = null;
        indicator.current = null;
        if (e.runtimeEffect?.type === "top-load-washer" && !e.partMotionRules?.length) {
          const disc = n.getObjectByName("Pulsator_Disc");
          if (disc) {
            n.updateMatrixWorld(true);
            const center = new Xa.Box3()
              .setFromObject(disc)
              .getCenter(new Xa.Vector3());
            const pivot = new Xa.Group();
            pivot.name = "Washer_Runtime_Pulsator";
            pivot.position.copy(n.worldToLocal(center));
            n.add(pivot);
            n.updateMatrixWorld(true);
            const parts = [];
            n.traverse((part) => {
              if (/^Pulsator_(?:Disc|Blade_\d+)$/.test(part.name))
                parts.push(part);
            });
            for (const part of parts) pivot.attach(part);
            pulsator.current = pivot;
          }
          const display = n.getObjectByName("Digital_Display");
          if (display?.material?.emissive) {
            display.material = display.material.clone();
            display.material.emissive.set("#53cfff");
            display.material.emissiveIntensity = 0;
            indicator.current = display.material;
          }
        }
        r(n);
      },
      void 0,
      () => r(void 0),
    );
    return () => {
      o = !1;
      pulsator.current = null;
      indicator.current = null;
      n?.traverse((i) => {
        i.geometry?.dispose?.();
        Array.isArray(i.material)
          ? i.material.forEach((a) => a.dispose?.())
          : i.material?.dispose?.();
      });
    };
  }, [
    e.source.url,
    e.scale,
    e.dimensions?.width,
    e.dimensions?.height,
    e.dimensions?.depth,
    e.runtimeEffect?.type,
    e.projectAppearance,
    e.color,
    e.metalness,
    e.roughness,
  ]);
  if (!s) return null;
  const o = e.anchor ?? { x: 0, y: 0, z: 0 };
  return t.jsx("group", {
    position: [o.x, (e.elevation ?? 0) + o.y, o.z],
    children: t.jsx("primitive", { object: s }),
  });
}
function ProceduralDeviceModel({ config: e, unavailable = false, running = false }) {
  const model = L.useRef(null);
  const { invalidate } = tt();
  useRuntimeModelGlow(model, running && !unavailable, e);
  L.useLayoutEffect(() => {
    applyModelAvailability(model.current, unavailable);
    invalidate();
  }, [e, unavailable, invalidate]);
  const s = e.dimensions ?? { width: 0.6, height: 0.85, depth: 0.65 },
    r = e.anchor ?? { x: 0, y: 0, z: 0 },
    i = e.scale ?? 1,
    a = e.color ?? "#e8edf2",
    c = e.roughness ?? 0.62,
    l = e.metalness ?? 0.08,
    shape = e.source?.shape ?? "box",
    f = shape === "washing-machine",
    detailMaterial = t.jsx("meshStandardMaterial", {
      color: "#243143",
      roughness: 0.28,
      metalness: 0.35,
    });
  return t.jsxs("group", {
    ref: model,
    position: [r.x, (e.elevation ?? 0) + r.y, r.z],
    scale: [i, i, i],
    children: [
      cameraModelDefinition(shape) ? t.jsx(CameraModel,{shape,dimensions:s,color:a}) : t.jsxs("mesh", {
        castShadow: !0,
        receiveShadow: !0,
        position: [0, s.height / 2, 0],
        children: [
          t.jsx("boxGeometry", { args: [s.width, s.height, s.depth] }),
          t.jsx("meshStandardMaterial", {
            color: a,
            roughness: c,
            metalness: l,
          }),
        ],
      }),
      f &&
        t.jsxs("group", {
          position: [0, s.height * 0.48, s.depth / 2 + 0.012],
          children: [
            t.jsxs("mesh", {
              children: [
                t.jsx("torusGeometry", {
                  args: [s.width * 0.25, s.width * 0.045, 20, 64],
                }),
                t.jsx("meshStandardMaterial", {
                  color: "#98a4b3",
                  metalness: 0.65,
                  roughness: 0.25,
                }),
              ],
            }),
            t.jsxs("mesh", {
              position: [0, 0, 0.006],
              children: [
                t.jsx("circleGeometry", {
                  args: [s.width * 0.205, 48],
                }),
                t.jsx("meshPhysicalMaterial", {
                  color: "#162b3d",
                  transmission: 0.25,
                  roughness: 0.15,
                }),
              ],
            }),
          ],
        }),
      shape === "pipeline-water-dispenser" &&
        t.jsxs(t.Fragment, {
          children: [
            t.jsxs("mesh", {
              position: [0, s.height * 0.18, s.depth / 2 + 0.013],
              children: [
                t.jsx("boxGeometry", {
                  args: [s.width * 0.7, s.height * 0.2, 0.018],
                }),
                detailMaterial,
              ],
            }),
            t.jsxs("mesh", {
              position: [
                0,
                Math.max(0.025, s.height * 0.12),
                s.depth / 2 + 0.08,
              ],
              rotation: [Math.PI / 2, 0, 0],
              children: [
                t.jsx("cylinderGeometry", {
                  args: [0.018, 0.018, s.depth * 0.32, 20],
                }),
                t.jsx("meshStandardMaterial", {
                  color: "#aeb8c2",
                  metalness: 0.72,
                  roughness: 0.2,
                }),
              ],
            }),
            t.jsxs("mesh", {
              position: [0, 0.025, s.depth * 0.72],
              children: [
                t.jsx("boxGeometry", {
                  args: [s.width * 0.62, 0.025, s.depth * 0.34],
                }),
                t.jsx("meshStandardMaterial", {
                  color: "#6f7c89",
                  metalness: 0.58,
                  roughness: 0.26,
                }),
              ],
            }),
          ],
        }),
      shape === "water-purifier" &&
        t.jsxs(t.Fragment, {
          children: [
            [-0.22, 0, 0.22].map((x) =>
              t.jsxs(
                "mesh",
                {
                  position: [x * s.width, s.height * 0.47, s.depth / 2 + 0.018],
                  children: [
                    t.jsx("cylinderGeometry", {
                      args: [
                        s.width * 0.09,
                        s.width * 0.09,
                        s.height * 0.62,
                        24,
                      ],
                    }),
                    t.jsx("meshStandardMaterial", {
                      color: x === 0 ? "#58a5c8" : "#dce5eb",
                      roughness: 0.42,
                    }),
                  ],
                },
                x,
              ),
            ),
            t.jsxs("mesh", {
              position: [0, s.height * 0.82, s.depth / 2 + 0.022],
              children: [
                t.jsx("boxGeometry", {
                  args: [s.width * 0.66, s.height * 0.12, 0.025],
                }),
                detailMaterial,
              ],
            }),
          ],
        }),
      shape === "gas-water-heater" &&
        t.jsxs(t.Fragment, {
          children: [
            t.jsxs("mesh", {
              position: [0, s.height + s.height * 0.12, 0],
              children: [
                t.jsx("cylinderGeometry", {
                  args: [s.width * 0.17, s.width * 0.19, s.height * 0.24, 28],
                }),
                t.jsx("meshStandardMaterial", {
                  color: "#b8c0c7",
                  metalness: 0.7,
                  roughness: 0.24,
                }),
              ],
            }),
            t.jsxs("mesh", {
              position: [0, s.height * 0.22, s.depth / 2 + 0.013],
              children: [
                t.jsx("boxGeometry", {
                  args: [s.width * 0.45, s.height * 0.13, 0.02],
                }),
                detailMaterial,
              ],
            }),
            [-0.22, 0, 0.22].map((x) =>
              t.jsxs(
                "mesh",
                {
                  position: [x * s.width, s.height * 0.1, 0],
                  children: [
                    t.jsx("cylinderGeometry", {
                      args: [0.015, 0.015, s.height * 0.18, 16],
                    }),
                    t.jsx("meshStandardMaterial", {
                      color: x < 0 ? "#5da5d7" : x > 0 ? "#d96b5f" : "#d7b453",
                      metalness: 0.5,
                    }),
                  ],
                },
                x,
              ),
            ),
          ],
        }),
      shape === "wifi-router" &&
        t.jsxs(t.Fragment, {
          children: [
            [-0.38, -0.13, 0.13, 0.38].map((x) =>
              t.jsxs(
                "mesh",
                {
                  position: [x * s.width, s.height * 2.5, -s.depth * 0.36],
                  rotation: [0, 0, x * 0.18],
                  children: [
                    t.jsx("cylinderGeometry", {
                      args: [0.008, 0.01, s.height * 4.5, 12],
                    }),
                    t.jsx("meshStandardMaterial", {
                      color: "#4a5565",
                      roughness: 0.32,
                    }),
                  ],
                },
                x,
              ),
            ),
            [-0.16, 0, 0.16].map((x) =>
              t.jsxs(
                "mesh",
                {
                  position: [x * s.width, s.height * 1.04, s.depth * 0.32],
                  children: [
                    t.jsx("sphereGeometry", { args: [0.008, 12, 8] }),
                    t.jsx("meshBasicMaterial", { color: "#68d49a" }),
                  ],
                },
                x,
              ),
            ),
          ],
        }),
    ],
  });
}
function ConfiguredDeviceModel({ config: e, runtime, unavailable, running, motionEntity }) {
  return e.source?.type === "upload"
    ? t.jsx(UploadedDeviceModel, { config: e, runtime, unavailable, running, motionEntity })
    : t.jsx(ProceduralDeviceModel, { config: e, unavailable, running });
}
function ti({ span: e, height: s, depth: r, children: o }) {
  const n = L.useMemo(() => {
    const a = [],
      c = [],
      l = [];
    for (let u = 0; u <= 10; u += 1) {
      const h = u / 10,
        m = (h - 0.5) * e,
        w = u === 0 || u === 10 ? 0 : (u % 2 === 0 ? 1 : -1) * r;
      (a.push(m, -s / 2, w, m, s / 2, w), c.push(h, 0, h, 1));
    }
    for (let u = 0; u < 10; u += 1) {
      const h = u * 2,
        m = h + 1,
        y = h + 2,
        w = h + 3;
      l.push(h, y, m, m, y, w);
    }
    const f = new st();
    return (
      f.setAttribute("position", new zt(a, 3)),
      f.setAttribute("uv", new zt(c, 2)),
      f.setIndex(l),
      f.computeVertexNormals(),
      f
    );
  }, [r, s, e]);
  return t.jsx("mesh", {
    geometry: n,
    castShadow: !0,
    receiveShadow: !0,
    children: o,
  });
}
function si({
  kind: e,
  modelId: s,
  bodyColor: r,
  highlightColor: o,
  glowActive: n,
  unavailable: i,
  modeHighlighted: a,
  state: c,
  coverPosition: l,
  climateColor: f,
  presentation: u,
  selected: h = !1,
  entity: m,
}) {
  const y = ue(),
    w = y === "cartoon" && u,
    b = y === "cream" && u,
    j = i ? 0.5 : 1,
    x = bn(r, i),
    k = wn(r, i),
    G = u ? $(o, "#f7fbff", 0.32) : $(o, "#f5fbff", 0.18),
    C = n ? G : "#000000",
    O = h ? 0.38 : n ? (a ? 0.28 : 0.16) : 0,
    N = Dn(l, u ? 6.5 : 9),
    E = dt(w, b),
    d = (p = 0.46, v = 0.025, P = "shell") => {
      const T = P === "detail" ? k : x;
      return t.jsxs(t.Fragment, {
        children: [
          w
            ? t.jsx("meshToonMaterial", {
                color: T,
                emissive: C,
                emissiveIntensity: O * 0.38,
                transparent: i,
                opacity: j,
              })
            : t.jsx("meshPhysicalMaterial", {
                color: T,
                roughness: u
                  ? Math.max(Math.min(p, 0.4), 0.26)
                  : Math.max(p, 0.38),
                metalness: u ? Math.min(v, 0.12) : v,
                clearcoat: u ? 0.38 : 0.22,
                clearcoatRoughness: u ? 0.58 : 0.7,
                emissive: C,
                emissiveIntensity: O,
                transparent: i,
                opacity: j,
              }),
          t.jsx(Y, {
            color: u ? E.color : Pt(T),
            threshold: u ? E.threshold : 34,
            opacity: u ? E.opacity : 0.14,
            transparent: !0,
          }),
        ],
      });
    },
    g = (p = 0.52) =>
      t.jsx("meshBasicMaterial", {
        color: G,
        transparent: !0,
        opacity: i ? 0.12 : p * (u ? 0.66 : 0.76),
        depthWrite: !1,
        toneMapped: !1,
      }),
    _ = n || c === "on",
    M = (p) => {
      const v = p === 1 ? 0.3 : p === 2 ? 0.34 : 0.38;
      return t.jsxs("group", {
        children: [
          t.jsxs(D, {
            args: [v, 0.42, 0.062],
            radius: 0.032,
            smoothness: 4,
            castShadow: !0,
            children: [
              t.jsx("meshPhysicalMaterial", {
                color: x,
                roughness: 0.34,
                metalness: 0.02,
                clearcoat: 0.38,
                clearcoatRoughness: 0.58,
                transparent: i,
                opacity: j,
              }),
              u &&
                t.jsx(Y, {
                  color: E.color,
                  threshold: E.threshold,
                  opacity: E.opacity,
                  transparent: !0,
                }),
            ],
          }),
          Array.from({ length: p }).map((P, T) => {
            const z = p === 1 ? 0 : (T - (p - 1) / 2) * (v / p);
            return t.jsx(
              "group",
              {
                position: [z, 0, 0.038],
                rotation: [_ ? -0.075 : 0.055, 0, 0],
                children: t.jsx(D, {
                  args: [v / p - 0.032, 0.29, 0.016],
                  radius: 0.018,
                  smoothness: 3,
                  children: t.jsx("meshPhysicalMaterial", {
                    color: _ ? $(G, "#ffffff", 0.26) : k,
                    roughness: 0.28,
                    metalness: 0.015,
                    clearcoat: 0.44,
                    clearcoatRoughness: 0.54,
                    emissive: _ ? G : "#000000",
                    emissiveIntensity: _ ? 0.18 : 0,
                  }),
                }),
              },
              T,
            );
          }),
          t.jsxs("mesh", {
            position: [v / 2 - 0.055, -0.165, 0.044],
            children: [
              t.jsx("sphereGeometry", { args: [0.018, 16, 8] }),
              t.jsx("meshBasicMaterial", {
                color: _ ? G : "#7f8a94",
                transparent: !0,
                opacity: _ ? 0.92 : 0.36,
                toneMapped: !1,
              }),
            ],
          }),
          _ &&
            t.jsx("pointLight", {
              color: G,
              intensity: 0.32,
              distance: 0.72,
              position: [0, 0, 0.16],
            }),
        ],
      });
    };
  if (s === "switch.washing_machine")
    return t.jsxs("group", {
      children: [
        t.jsx(D, {
          args: [0.62, 0.85, 0.65],
          radius: 0.045,
          smoothness: 5,
          castShadow: !0,
          position: [0, 0.425, 0],
          children: d(0.42, 0.04),
        }),
        t.jsxs("mesh", {
          position: [0, 0.39, 0.337],
          children: [
            t.jsx("torusGeometry", { args: [0.19, 0.032, 20, 64] }),
            t.jsx("meshStandardMaterial", {
              color: "#8e99a8",
              metalness: 0.62,
              roughness: 0.24,
            }),
          ],
        }),
        t.jsxs("mesh", {
          position: [0, 0.39, 0.342],
          children: [
            t.jsx("circleGeometry", { args: [0.158, 48] }),
            t.jsx("meshPhysicalMaterial", {
              color: "#14293b",
              roughness: 0.12,
              transmission: 0.18,
              transparent: !0,
              opacity: i ? 0.3 : 0.88,
            }),
          ],
        }),
        t.jsxs("mesh", {
          position: [0.17, 0.72, 0.338],
          children: [
            t.jsx("circleGeometry", { args: [0.04, 32] }),
            g(_ ? 0.9 : 0.34),
          ],
        }),
      ],
    });
  if (s === "switch.outlet")
    return t.jsxs("group", {
      children: [
        t.jsx(D, {
          args: [0.3, 0.38, 0.06],
          radius: 0.032,
          smoothness: 4,
          castShadow: !0,
          children: d(0.34, 0.02),
        }),
        [-0.055, 0.055].map((p) =>
          t.jsxs(
            "mesh",
            {
              position: [p, 0.05, 0.038],
              children: [
                t.jsx("boxGeometry", { args: [0.024, 0.088, 0.012] }),
                g(_ ? 0.78 : 0.34),
              ],
            },
            p,
          ),
        ),
        t.jsxs("mesh", {
          position: [0, -0.085, 0.04],
          children: [
            t.jsx("circleGeometry", { args: [0.028, 22] }),
            g(_ ? 0.52 : 0.28),
          ],
        }),
        _ &&
          t.jsx("pointLight", {
            color: G,
            intensity: 0.28,
            distance: 0.64,
            position: [0, 0, 0.14],
          }),
      ],
    });
  if (s === "switch.scene")
    return t.jsxs("group", {
      children: [
        t.jsx(D, {
          args: [0.34, 0.34, 0.06],
          radius: 0.06,
          smoothness: 5,
          castShadow: !0,
          children: d(0.32, 0.02),
        }),
        [-0.07, 0.07].flatMap((p) =>
          [-0.07, 0.07].map((v) =>
            t.jsxs(
              "mesh",
              {
                position: [p, v, 0.038],
                children: [
                  t.jsx("circleGeometry", { args: [0.036, 22] }),
                  g(_ ? 0.72 : 0.3),
                ],
              },
              `${p}-${v}`,
            ),
          ),
        ),
        _ &&
          t.jsx("pointLight", {
            color: G,
            intensity: 0.3,
            distance: 0.7,
            position: [0, 0, 0.16],
          }),
      ],
    });
  if (s === "switch.ac_airflow")
    return t.jsxs("group", {
      children: [
        M(1),
        t.jsxs("mesh", {
          position: [0, 0.055, 0.052],
          children: [
            t.jsx("boxGeometry", { args: [0.18, 0.026, 0.012] }),
            g(_ ? 0.68 : 0.3),
          ],
        }),
        [-0.075, 0, 0.075].map((p) =>
          t.jsxs(
            "mesh",
            {
              position: [p, -0.085, 0.054],
              children: [
                t.jsx("boxGeometry", { args: [0.044, 0.012, 0.012] }),
                g(_ ? 0.54 : 0.2),
              ],
            },
            p,
          ),
        ),
        _ &&
          t.jsx("group", {
            position: [0, -0.04, 0.13],
            scale: [0.72, 0.72, 0.72],
            children: t.jsx(Un, { color: f, variant: "forward" }),
          }),
      ],
    });
  if (s === "switch.double") return M(2);
  if (s === "switch.triple") return M(3);
  if (e === "switch") return M(1);
  if (s === "cover.blind") {
    const p = V.clamp(N / 100, 0, 1),
      v = 0.92,
      z = V.lerp(0.72, 0.2, p),
      I = 0.11,
      F = 10,
      S = V.lerp(-0.06, 0.72, p),
      B = (K, X = 0.12) =>
        w
          ? t.jsx("meshToonMaterial", {
              color: $(k, "#ffffff", X),
              transparent: !0,
              opacity: i ? 0.2 : K,
              side: J,
            })
          : t.jsx("meshPhysicalMaterial", {
              color: $(k, u ? "#f7fbff" : "#ffffff", X),
              roughness: 0.54,
              metalness: 0.02,
              clearcoat: 0.16,
              clearcoatRoughness: 0.72,
              transparent: !0,
              opacity: i ? 0.22 : K,
              side: J,
            }),
      R = w
        ? t.jsx("meshToonMaterial", {
            color: $(x, "#ffffff", 0.26),
            transparent: i,
            opacity: i ? 0.38 : 1,
          })
        : t.jsx("meshPhysicalMaterial", {
            color: $(x, "#ffffff", 0.38),
            roughness: 0.34,
            metalness: 0.2,
            clearcoat: 0.28,
            clearcoatRoughness: 0.54,
            transparent: i,
            opacity: i ? 0.38 : 1,
          }),
      W = t.jsx("meshBasicMaterial", {
        color: $(k, "#ffffff", u ? 0.48 : 0.28),
        transparent: !0,
        opacity: i ? 0.18 : u ? 0.34 : 0.5,
        toneMapped: !1,
      }),
      ee = I - z;
    return t.jsxs("group", {
      children: [
        t.jsxs("mesh", {
          position: [0, 0.18, 0],
          castShadow: !0,
          children: [
            t.jsx("boxGeometry", { args: [v + 0.1, 0.044, 0.048] }),
            R,
          ],
        }),
        t.jsxs("mesh", {
          position: [0, 0.206, 0.022],
          children: [
            t.jsx("boxGeometry", { args: [v * 0.74, 0.01, 0.008] }),
            g(n ? 0.4 : 0.16),
          ],
        }),
        [-0.36, 0, 0.36].map((K) =>
          t.jsxs(
            "mesh",
            {
              position: [K, I - z / 2, 0.032],
              children: [
                t.jsx("cylinderGeometry", {
                  args: [0.004, 0.004, z + 0.05, 8],
                }),
                W,
              ],
            },
            `cord-${K}`,
          ),
        ),
        Array.from({ length: F }).map((K, X) => {
          const te = X / (F - 1),
            Q = I - te * z,
            Z = V.lerp(0.72, 0.48, p) * (1 - X * 0.018);
          return t.jsxs(
            "mesh",
            {
              position: [0, Q, 0.012 + (X % 2) * 0.004],
              rotation: [S, 0, 0],
              castShadow: !0,
              receiveShadow: !0,
              children: [
                t.jsx("boxGeometry", { args: [v, 0.012, 0.054] }),
                B(Z, X % 2 === 0 ? 0.18 : 0.06),
              ],
            },
            X,
          );
        }),
        t.jsxs("mesh", {
          position: [0, ee - 0.035, 0.025],
          castShadow: !0,
          children: [
            t.jsx("boxGeometry", { args: [v * 0.9, 0.026, 0.026] }),
            R,
          ],
        }),
        t.jsxs("mesh", {
          position: [v / 2 + 0.06, I - z * 0.36, 0.035],
          children: [
            t.jsx("cylinderGeometry", { args: [0.004, 0.004, z * 0.62, 8] }),
            W,
          ],
        }),
        [0, 1, 2].map((K) =>
          t.jsxs(
            "mesh",
            {
              position: [v / 2 + 0.06, ee + 0.04 - K * 0.036, 0.035],
              children: [
                t.jsx("sphereGeometry", { args: [0.012, 12, 8] }),
                g(n ? 0.34 : 0.18),
              ],
            },
            `pull-${K}`,
          ),
        ),
      ],
    });
  }
  if (s === "cover.curtain") {
    const p = V.clamp(N / 100, 0, 1),
      v = (z = 0.82) =>
        w
          ? t.jsx("meshToonMaterial", {
              color: $(k, "#ffffff", 0.08),
              side: J,
              transparent: !0,
              opacity: i ? 0.24 : z,
            })
          : t.jsx("meshPhysicalMaterial", {
              color: $(k, u ? "#edf5ff" : "#ffffff", u ? 0.18 : 0.08),
              side: J,
              roughness: 0.86,
              metalness: 0.005,
              clearcoat: 0.08,
              clearcoatRoughness: 0.92,
              transparent: !0,
              opacity: i ? 0.26 : z,
            }),
      P = w
        ? t.jsx("meshToonMaterial", {
            color: $(x, "#ffffff", 0.28),
            emissive: n && !i ? "#79a7bf" : "#000000",
            emissiveIntensity: n && !i ? 0.18 : 0,
            transparent: i,
            opacity: i ? 0.42 : 1,
          })
        : t.jsx("meshPhysicalMaterial", {
            color: $(x, "#ffffff", 0.42),
            emissive: n && !i ? "#79a7bf" : "#000000",
            emissiveIntensity: n && !i ? 0.18 : 0,
            roughness: 0.36,
            metalness: 0.22,
            clearcoat: 0.34,
            clearcoatRoughness: 0.58,
            transparent: i,
            opacity: i ? 0.42 : 1,
          }),
      T = (z) => {
        const I = V.lerp(0.47, 0.145, p),
          F = z * V.lerp(0.235, 0.425, p),
          S = V.lerp(0.004, 0.045, p);
        return t.jsx(
          "group",
          {
            position: [F, -0.34, 0.018],
            children: t.jsx(ti, {
              span: I,
              height: 0.9,
              depth: S,
              children: v(0.76),
            }),
          },
          z,
        );
      };
    return t.jsxs("group", {
      children: [
        t.jsxs("mesh", {
          position: [0, 0.17, 0],
          castShadow: !0,
          children: [t.jsx("boxGeometry", { args: [1.04, 0.026, 0.035] }), P],
        }),
        t.jsxs("mesh", {
          position: [0, 0.205, 0.006],
          children: [
            t.jsx("boxGeometry", { args: [0.58, 0.014, 0.012] }),
            g(0.24),
          ],
        }),
        [-0.52, 0.52].map((z) =>
          t.jsxs(
            "mesh",
            {
              position: [z, 0.17, 0],
              children: [t.jsx("sphereGeometry", { args: [0.026, 18, 10] }), P],
            },
            z,
          ),
        ),
        [-0.34, -0.2, -0.06, 0.08, 0.22, 0.36].map((z) =>
          t.jsxs(
            "mesh",
            {
              position: [z, 0.135, 0.014],
              children: [
                t.jsx("boxGeometry", { args: [0.012, 0.05, 0.012] }),
                g(0.16),
              ],
            },
            z,
          ),
        ),
        T(-1),
        T(1),
      ],
    });
  }
  if (s === "climate.floor_ac") {
    const p = ["cool", "heat", "dry", "fan_only"].includes(c);
    return t.jsxs("group", {
      children: [
        t.jsx(D, {
          position: [0, 0.54, 0],
          args: [0.36, 1.08, 0.25],
          radius: 0.08,
          smoothness: 6,
          castShadow: !0,
          children: t.jsx("meshPhysicalMaterial", {
            color: x,
            roughness: 0.34,
            metalness: 0.035,
            clearcoat: 0.32,
            clearcoatRoughness: 0.64,
            emissive: p ? f : "#000000",
            emissiveIntensity: p ? 0.08 : 0,
            transparent: i,
            opacity: j,
          }),
        }),
        t.jsxs("mesh", {
          position: [0, 0.92, 0.132],
          children: [
            t.jsx("boxGeometry", { args: [0.17, 0.064, 0.012] }),
            g(p ? 0.66 : 0.25),
          ],
        }),
        [-0.19, -0.1, -0.01, 0.08, 0.17, 0.26].map((v, P) =>
          t.jsxs(
            "mesh",
            {
              position: [0, 0.52 + v, 0.136],
              rotation: [p ? -0.1 - P * 0.012 : 0, 0, 0],
              children: [
                t.jsx("boxGeometry", { args: [0.235, 0.012, 0.012] }),
                g(p ? 0.54 : 0.17),
              ],
            },
            v,
          ),
        ),
        p && t.jsx(Qn, { color: f }),
      ],
    });
  }
  if (s === "climate.central_ac") {
    const p = ["cool", "heat", "dry", "fan_only"].includes(c),
      v = $(x, "#ffffff", 0.18),
      P = $(x, "#f8fbff", 0.36),
      T = $(k, "#111827", 0.48);
    return t.jsxs("group", {
      children: [
        t.jsx(D, {
          position: [0, -0.07, 0],
          args: [0.92, 0.2, 0.34],
          radius: 0.055,
          smoothness: 7,
          castShadow: !0,
          children: t.jsx("meshPhysicalMaterial", {
            color: v,
            roughness: 0.32,
            metalness: 0.045,
            clearcoat: 0.36,
            clearcoatRoughness: 0.6,
            emissive: p ? f : "#000000",
            emissiveIntensity: p ? 0.075 : 0,
            transparent: i,
            opacity: j,
          }),
        }),
        t.jsx(D, {
          position: [0, -0.085, 0.19],
          args: [0.78, 0.085, 0.045],
          radius: 0.018,
          smoothness: 4,
          children: t.jsx("meshPhysicalMaterial", {
            color: P,
            roughness: 0.24,
            metalness: 0.025,
            clearcoat: 0.46,
            clearcoatRoughness: 0.52,
            emissive: p ? f : "#000000",
            emissiveIntensity: p ? 0.16 : 0,
            transparent: !0,
            opacity: i ? 0.26 : 0.82,
          }),
        }),
        t.jsxs("mesh", {
          position: [0, -0.086, 0.217],
          children: [
            t.jsx("boxGeometry", { args: [0.7, 0.052, 0.01] }),
            t.jsx("meshPhysicalMaterial", {
              color: T,
              roughness: 0.42,
              metalness: 0.02,
              transparent: !0,
              opacity: i ? 0.18 : 0.78,
            }),
          ],
        }),
        [-0.031, -0.01, 0.011, 0.032].map((z, I) =>
          t.jsxs(
            "mesh",
            {
              position: [0, -0.086 + z, 0.225],
              rotation: [p ? -0.18 - I * 0.018 : -0.05, 0, 0],
              children: [
                t.jsx("boxGeometry", { args: [0.68, 0.006, 0.018] }),
                g(p ? 0.62 : 0.26),
              ],
            },
            z,
          ),
        ),
        [-0.36, 0.36].map((z) =>
          t.jsxs(
            "mesh",
            {
              position: [z, -0.085, 0.223],
              children: [
                t.jsx("boxGeometry", { args: [0.018, 0.07, 0.018] }),
                g(p ? 0.42 : 0.18),
              ],
            },
            z,
          ),
        ),
        t.jsxs("mesh", {
          position: [0, 0.034, -0.045],
          children: [
            t.jsx("boxGeometry", { args: [0.72, 0.018, 0.18] }),
            g(p ? 0.28 : 0.11),
          ],
        }),
        p && t.jsx(Zn, { color: f }),
      ],
    });
  }
  if (s === "climate.thermostat")
    return t.jsxs("group", {
      children: [
        t.jsxs("mesh", {
          castShadow: !0,
          children: [
            t.jsx("boxGeometry", { args: [0.32, 0.38, 0.058] }),
            d(0.32, 0.03),
          ],
        }),
        t.jsxs("mesh", {
          position: [0, 0.035, 0.034],
          children: [
            t.jsx("circleGeometry", { args: [0.082, 32] }),
            g(n ? 0.62 : 0.28),
          ],
        }),
        t.jsxs("mesh", {
          position: [0, -0.11, 0.035],
          children: [
            t.jsx("boxGeometry", { args: [0.15, 0.026, 0.012] }),
            g(0.24),
          ],
        }),
      ],
    });
  if (s === "climate.wall_ac") {
    const p = ["cool", "heat", "dry", "fan_only"].includes(c),
      v = c === "heat" ? $(f, "#ffd6bd", 0.34) : f,
      P = c === "heat" ? "#ffad78" : "#35cfff";
    return t.jsxs("group", {
      children: [
        t.jsx(D, {
          args: [0.54, 0.22, 0.18],
          radius: 0.055,
          smoothness: 7,
          castShadow: !0,
          children: t.jsx("meshPhysicalMaterial", {
            color: x,
            roughness: 0.28,
            metalness: 0.025,
            clearcoat: 0.46,
            clearcoatRoughness: 0.52,
            emissive: p ? v : "#000000",
            emissiveIntensity: p ? 0.055 : 0,
            transparent: i,
            opacity: j,
          }),
        }),
        t.jsx(D, {
          position: [0, -0.058, 0.098],
          args: [0.41, 0.045, 0.026],
          radius: 0.018,
          smoothness: 4,
          children: t.jsx("meshPhysicalMaterial", {
            color: $(x, "#ffffff", 0.42),
            roughness: 0.24,
            metalness: 0.02,
            clearcoat: 0.5,
            clearcoatRoughness: 0.48,
            emissive: p ? v : "#000000",
            emissiveIntensity: p ? 0.18 : 0,
            transparent: !0,
            opacity: i ? 0.22 : 0.76,
          }),
        }),
        t.jsxs("mesh", {
          position: [-0.145, 0.064, 0.096],
          children: [
            t.jsx("circleGeometry", { args: [0.047, 34] }),
            t.jsx("meshBasicMaterial", {
              color: P,
              transparent: !0,
              opacity: p ? 0.82 : 0.26,
              depthWrite: !1,
              toneMapped: !1,
            }),
          ],
        }),
        t.jsxs("mesh", {
          position: [0.185, -0.006, 0.099],
          children: [
            t.jsx("sphereGeometry", { args: [0.014, 16, 8] }),
            t.jsx("meshBasicMaterial", {
              color: p ? "#111a27" : "#7d8996",
              transparent: !0,
              opacity: i ? 0.28 : 0.82,
              toneMapped: !1,
            }),
          ],
        }),
        t.jsxs("mesh", {
          position: [0, 0.074, 0.096],
          children: [
            t.jsx("planeGeometry", { args: [0.34, 0.024] }),
            t.jsx("meshBasicMaterial", {
              color: "#ffffff",
              transparent: !0,
              opacity: i ? 0.08 : 0.22,
              depthWrite: !1,
              toneMapped: !1,
            }),
          ],
        }),
        p && t.jsx(Xn, { color: v }),
        p && u && t.jsx(ei, { color: P, temperature: Jn(m) }),
      ],
    });
  }
  if (s === "sensor.temperature")
    return t.jsxs("group", {
      children: [
        t.jsxs("mesh", {
          castShadow: !0,
          children: [
            t.jsx("boxGeometry", { args: [0.26, 0.34, 0.052] }),
            d(0.36, 0.02),
          ],
        }),
        t.jsxs("mesh", {
          position: [0, 0.045, 0.032],
          children: [
            t.jsx("boxGeometry", { args: [0.14, 0.075, 0.01] }),
            g(n ? 0.58 : 0.24),
          ],
        }),
        t.jsxs("mesh", {
          position: [-0.075, -0.085, 0.033],
          children: [
            t.jsx("boxGeometry", { args: [0.018, 0.11, 0.01] }),
            g(0.42),
          ],
        }),
        t.jsxs("mesh", {
          position: [-0.075, -0.145, 0.034],
          children: [t.jsx("circleGeometry", { args: [0.033, 18] }), g(0.42)],
        }),
      ],
    });
  if (s === "sensor.humidity")
    return t.jsxs("group", {
      children: [
        t.jsxs("mesh", {
          castShadow: !0,
          children: [
            t.jsx("cylinderGeometry", { args: [0.13, 0.13, 0.08, 28] }),
            d(0.38, 0.02),
          ],
        }),
        t.jsxs("mesh", {
          position: [0, 0.01, 0.045],
          children: [
            t.jsx("circleGeometry", { args: [0.07, 24] }),
            g(n ? 0.64 : 0.3),
          ],
        }),
        t.jsxs("mesh", {
          position: [0, -0.018, 0.052],
          children: [
            t.jsx("sphereGeometry", { args: [0.026, 14, 8] }),
            g(0.48),
          ],
        }),
      ],
    });
  if (s === "sensor.light_level")
    return t.jsxs("group", {
      children: [
        t.jsxs("mesh", {
          castShadow: !0,
          children: [
            t.jsx("cylinderGeometry", { args: [0.12, 0.14, 0.07, 30] }),
            d(0.34, 0.03),
          ],
        }),
        t.jsxs("mesh", {
          position: [0, -0.043, 0],
          rotation: [-Math.PI / 2, 0, 0],
          children: [
            t.jsx("circleGeometry", { args: [0.087, 28] }),
            g(n ? 0.72 : 0.34),
          ],
        }),
        [0, 1, 2, 3].map((p) =>
          t.jsxs(
            "mesh",
            {
              rotation: [0, 0, (p * Math.PI) / 2],
              position: [0, -0.05, 0],
              children: [
                t.jsx("boxGeometry", { args: [0.19, 0.012, 0.012] }),
                t.jsx("meshBasicMaterial", {
                  color: G,
                  transparent: !0,
                  opacity: i ? 0.08 : 0.16,
                  depthWrite: !1,
                  toneMapped: !1,
                }),
              ],
            },
            p,
          ),
        ),
      ],
    });
  if (s === "sensor.air_quality")
    return t.jsxs("group", {
      children: [
        t.jsxs("mesh", {
          castShadow: !0,
          children: [
            t.jsx("boxGeometry", { args: [0.3, 0.3, 0.055] }),
            d(0.34, 0.03),
          ],
        }),
        [-0.075, 0, 0.075].map((p) =>
          t.jsxs(
            "mesh",
            {
              position: [p, 0.045, 0.033],
              children: [
                t.jsx("circleGeometry", { args: [0.026, 16] }),
                g(n ? 0.64 : 0.28),
              ],
            },
            p,
          ),
        ),
        t.jsxs("mesh", {
          position: [0, -0.075, 0.034],
          children: [
            t.jsx("boxGeometry", { args: [0.18, 0.03, 0.01] }),
            g(0.26),
          ],
        }),
      ],
    });
  if (s === "sensor.co2")
    return t.jsxs("group", {
      children: [
        t.jsx(D, {
          args: [0.31, 0.29, 0.06],
          radius: 0.038,
          smoothness: 4,
          castShadow: !0,
          children: d(0.34, 0.03),
        }),
        t.jsxs("mesh", {
          position: [0, 0.055, 0.038],
          children: [
            t.jsx("boxGeometry", { args: [0.18, 0.052, 0.012] }),
            g(n ? 0.62 : 0.26),
          ],
        }),
        [-0.07, 0, 0.07].map((p) =>
          t.jsxs(
            "mesh",
            {
              position: [p, -0.035, 0.039],
              children: [
                t.jsx("boxGeometry", { args: [0.032, 0.072, 0.01] }),
                g(n ? 0.5 : 0.22),
              ],
            },
            p,
          ),
        ),
        t.jsxs("mesh", {
          position: [0, -0.095, 0.04],
          children: [
            t.jsx("boxGeometry", { args: [0.14, 0.018, 0.01] }),
            g(0.24),
          ],
        }),
      ],
    });
  if (s === "sensor.pm25")
    return t.jsxs("group", {
      children: [
        t.jsxs("mesh", {
          castShadow: !0,
          children: [
            t.jsx("cylinderGeometry", { args: [0.15, 0.17, 0.06, 30] }),
            d(0.36, 0.03),
          ],
        }),
        [
          [-0.065, 0.035, 0.036],
          [0, 0.055, 0.038],
          [0.065, 0.035, 0.036],
          [-0.035, -0.045, 0.038],
          [0.045, -0.055, 0.038],
        ].map(([p, v, P], T) =>
          t.jsxs(
            "mesh",
            {
              position: [p, v, P],
              children: [
                t.jsx("sphereGeometry", { args: [0.022, 14, 8] }),
                g(n ? 0.68 : 0.3),
              ],
            },
            T,
          ),
        ),
        n &&
          t.jsxs("mesh", {
            rotation: [-Math.PI / 2, 0, 0],
            position: [0, 0, 0.002],
            children: [
              t.jsx("ringGeometry", { args: [0.18, 0.24, 34] }),
              g(0.14),
            ],
          }),
      ],
    });
  if (s === "sensor.power")
    return t.jsxs("group", {
      children: [
        t.jsxs("mesh", {
          castShadow: !0,
          children: [
            t.jsx("boxGeometry", { args: [0.28, 0.34, 0.055] }),
            d(0.35, 0.04),
          ],
        }),
        [0.04, 0.08, 0.13].map((p, v) =>
          t.jsxs(
            "mesh",
            {
              position: [-0.065 + v * 0.065, -0.08 + p / 2, 0.034],
              children: [
                t.jsx("boxGeometry", { args: [0.034, p, 0.012] }),
                g(n ? 0.58 : 0.28),
              ],
            },
            v,
          ),
        ),
        t.jsxs("mesh", {
          position: [0, 0.085, 0.034],
          children: [
            t.jsx("boxGeometry", { args: [0.16, 0.045, 0.012] }),
            g(0.24),
          ],
        }),
      ],
    });
  if (e === "sensor")
    return t.jsxs("mesh", {
      castShadow: !0,
      children: [
        t.jsx("cylinderGeometry", { args: [0.11, 0.13, 0.3, 24] }),
        d(0.4, 0.02),
      ],
    });
  if (s === "binary_sensor.motion")
    return t.jsxs("group", {
      children: [
        t.jsxs("mesh", {
          castShadow: !0,
          scale: [1, 0.55, 1],
          children: [
            t.jsx("sphereGeometry", { args: [0.17, 30, 14] }),
            d(0.32, 0.04),
          ],
        }),
        t.jsxs("mesh", {
          position: [0, -0.035, 0],
          rotation: [-Math.PI / 2, 0, 0],
          children: [
            t.jsx("ringGeometry", { args: [0.09, 0.16, 32] }),
            g(n ? 0.52 : 0.2),
          ],
        }),
        n &&
          t.jsxs("mesh", {
            position: [0, -0.26, 0],
            rotation: [Math.PI, 0, 0],
            children: [
              t.jsx("coneGeometry", { args: [0.32, 0.48, 28, 1, !0] }),
              g(0.18),
            ],
          }),
      ],
    });
  if (s === "binary_sensor.presence")
    return t.jsxs("group", {
      children: [
        t.jsxs("mesh", {
          castShadow: !0,
          children: [
            t.jsx("cylinderGeometry", { args: [0.15, 0.16, 0.07, 32] }),
            d(0.32, 0.04),
          ],
        }),
        t.jsxs("mesh", {
          position: [0, -0.044, 0],
          rotation: [-Math.PI / 2, 0, 0],
          children: [
            t.jsx("circleGeometry", { args: [0.118, 28] }),
            g(n ? 0.5 : 0.22),
          ],
        }),
        [0.2, 0.29].map((p) =>
          t.jsxs(
            "mesh",
            {
              position: [0, -0.16, 0],
              rotation: [Math.PI, 0, 0],
              children: [
                t.jsx("torusGeometry", { args: [p, 0.006, 6, 36, Math.PI] }),
                g(n ? 0.22 : 0.08),
              ],
            },
            p,
          ),
        ),
        n &&
          t.jsxs("mesh", {
            position: [0, -0.24, 0],
            rotation: [Math.PI, 0, 0],
            children: [
              t.jsx("coneGeometry", { args: [0.42, 0.55, 32, 1, !0] }),
              g(0.14),
            ],
          }),
      ],
    });
  if (s === "binary_sensor.smoke")
    return t.jsxs("group", {
      children: [
        t.jsxs("mesh", {
          castShadow: !0,
          children: [
            t.jsx("cylinderGeometry", { args: [0.17, 0.19, 0.08, 34] }),
            d(0.42, 0.03),
          ],
        }),
        t.jsxs("mesh", {
          position: [0, -0.045, 0],
          rotation: [-Math.PI / 2, 0, 0],
          children: [
            t.jsx("ringGeometry", { args: [0.08, 0.145, 32] }),
            g(n ? 0.56 : 0.2),
          ],
        }),
      ],
    });
  if (s === "binary_sensor.water")
    return t.jsxs("group", {
      children: [
        t.jsxs("mesh", {
          position: [0, 0.035, 0],
          castShadow: !0,
          children: [
            t.jsx("cylinderGeometry", { args: [0.16, 0.18, 0.07, 28] }),
            d(0.44, 0.02),
          ],
        }),
        t.jsxs("mesh", {
          position: [0, 0.079, 0],
          rotation: [-Math.PI / 2, 0, 0],
          children: [
            t.jsx("ringGeometry", { args: [0.07, 0.13, 30] }),
            g(n ? 0.58 : 0.24),
          ],
        }),
      ],
    });
  if (s === "binary_sensor.door")
    return t.jsxs("group", {
      children: [
        t.jsxs("mesh", {
          position: [-0.045, 0, 0],
          castShadow: !0,
          children: [
            t.jsx("boxGeometry", { args: [0.11, 0.3, 0.055] }),
            d(0.34, 0.04),
          ],
        }),
        t.jsxs("mesh", {
          position: [0.075, 0, 0],
          castShadow: !0,
          children: [
            t.jsx("boxGeometry", { args: [0.055, 0.24, 0.045] }),
            d(0.4, 0.03),
          ],
        }),
        n &&
          t.jsxs("mesh", {
            position: [-0.045, 0.11, 0.032],
            children: [t.jsx("circleGeometry", { args: [0.024, 16] }), g(0.78)],
          }),
      ],
    });
  if (e === "binary_sensor")
    return t.jsxs("group", {
      children: [
        t.jsxs("mesh", {
          castShadow: !0,
          children: [
            t.jsx("boxGeometry", { args: [0.24, 0.3, 0.055] }),
            d(0.34, 0.04),
          ],
        }),
        t.jsxs("mesh", {
          position: [0, 0.08, 0.033],
          children: [
            t.jsx("circleGeometry", { args: [0.034, 18] }),
            g(n ? 0.68 : 0.3),
          ],
        }),
      ],
    });
  if (s === "fan.floor") {
    const p = n || c === "on",
      v = $(x, "#d9f1ff", 0.34),
      P = 0.82,
      T = [0, 1, 2, 3, 4].map((F) =>
        t.jsx(
          "group",
          {
            rotation: [0, 0, (F * Math.PI * 2) / 5 - 0.08],
            children: t.jsxs("mesh", {
              position: [0, 0, 0.034],
              rotation: [0, 0, 0.08],
              scale: [0.72, 0.78, 1],
              castShadow: !0,
              children: [
                t.jsx("shapeGeometry", { args: [Yn] }),
                t.jsx("meshPhysicalMaterial", {
                  color: $(v, "#7f9ab0", 0.2),
                  roughness: 0.46,
                  metalness: 0.015,
                  clearcoat: 0.18,
                  clearcoatRoughness: 0.7,
                  transparent: i,
                  opacity: j * 0.92,
                  emissive: C,
                  emissiveIntensity: O * 0.32,
                  side: J,
                }),
              ],
            }),
          },
          F,
        ),
      ),
      z = Array.from({ length: 44 }, (F, S) => (S * Math.PI * 2) / 44).map(
        (F) =>
          t.jsxs(
            "mesh",
            {
              position: [Math.cos(F) * 0.122, Math.sin(F) * 0.122, 0.082],
              rotation: [0, 0, F],
              children: [
                t.jsx("boxGeometry", { args: [0.19, 0.0027, 0.0032] }),
                t.jsx("meshBasicMaterial", {
                  color: $(G, "#ffffff", 0.28),
                  transparent: !0,
                  opacity: i ? 0.06 : 0.26,
                  depthWrite: !1,
                  toneMapped: !1,
                }),
              ],
            },
            F,
          ),
      ),
      I = [0.092, 0.162, 0.228].map((F, S) =>
        t.jsxs(
          "mesh",
          {
            position: [0, 0, 0.086],
            children: [
              t.jsx("torusGeometry", {
                args: [F, S === 2 ? 0.0065 : 0.0035, 7, 84],
              }),
              t.jsx("meshBasicMaterial", {
                color: $(G, "#ffffff", 0.32),
                transparent: !0,
                opacity: i ? 0.06 : S === 2 ? 0.28 : 0.18,
                depthWrite: !1,
                toneMapped: !1,
              }),
            ],
          },
          F,
        ),
      );
    return t.jsxs("group", {
      children: [
        t.jsxs("mesh", {
          position: [0, 0.032, 0],
          castShadow: !0,
          children: [
            t.jsx("cylinderGeometry", { args: [0.21, 0.248, 0.064, 64] }),
            d(0.42, 0.1),
          ],
        }),
        t.jsxs("mesh", {
          position: [0, 0.077, 0],
          castShadow: !0,
          children: [
            t.jsx("cylinderGeometry", { args: [0.132, 0.17, 0.032, 52] }),
            d(0.34, 0.08, "detail"),
          ],
        }),
        t.jsxs("mesh", {
          position: [0, 0.44, 0],
          castShadow: !0,
          children: [
            t.jsx("cylinderGeometry", { args: [0.016, 0.021, 0.78, 24] }),
            d(0.31, 0.18, "detail"),
          ],
        }),
        t.jsxs("mesh", {
          position: [0, 0.79, 0.01],
          castShadow: !0,
          children: [
            t.jsx("cylinderGeometry", { args: [0.04, 0.052, 0.075, 24] }),
            d(0.34, 0.1),
          ],
        }),
        t.jsx(Vt, {
          active: p,
          amplitude: 0.16,
          speed: 0.86,
          children: t.jsxs("group", {
            position: [0, 0.93, 0.028],
            rotation: [0.02, -0.08, 0.01],
            scale: [P, P, P],
            children: [
              t.jsxs("mesh", {
                position: [0, -0.138, -0.024],
                castShadow: !0,
                children: [
                  t.jsx("cylinderGeometry", { args: [0.008, 0.011, 0.28, 14] }),
                  d(0.34, 0.14, "detail"),
                ],
              }),
              t.jsxs("mesh", {
                position: [0, 0, -0.058],
                castShadow: !0,
                children: [
                  t.jsx("torusGeometry", { args: [0.248, 0.01, 10, 96] }),
                  d(0.38, 0.08),
                ],
              }),
              t.jsxs("mesh", {
                position: [0, 0, -0.064],
                children: [
                  t.jsx("torusGeometry", { args: [0.178, 0.004, 6, 76] }),
                  g(p ? 0.14 : 0.06),
                ],
              }),
              t.jsxs("mesh", {
                position: [0, 0, -0.122],
                scale: [1, 1, 0.42],
                castShadow: !0,
                children: [
                  t.jsx("sphereGeometry", { args: [0.168, 42, 18] }),
                  d(0.38, 0.1, "detail"),
                ],
              }),
              t.jsxs("mesh", {
                position: [0, 0, 0.008],
                children: [
                  t.jsx("torusGeometry", { args: [0.245, 0.014, 10, 84] }),
                  d(0.36, 0.08),
                ],
              }),
              t.jsxs("mesh", {
                position: [0, 0, 0.083],
                children: [
                  t.jsx("torusGeometry", { args: [0.228, 0.01, 8, 84] }),
                  g(p ? 0.28 : 0.14),
                ],
              }),
              t.jsxs("mesh", {
                position: [0, 0, 0.094],
                children: [
                  t.jsx("torusGeometry", { args: [0.142, 0.004, 6, 72] }),
                  g(p ? 0.16 : 0.075),
                ],
              }),
              I,
              z,
              t.jsx(Wt, { active: p, speed: 18, children: T }),
              t.jsxs("mesh", {
                position: [0, 0, 0.104],
                rotation: [Math.PI / 2, 0, 0],
                castShadow: !0,
                children: [
                  t.jsx("cylinderGeometry", {
                    args: [0.062, 0.072, 0.038, 42],
                  }),
                  d(0.34, 0.1),
                ],
              }),
              p &&
                t.jsxs("mesh", {
                  position: [0, 0, 0.118],
                  renderOrder: 9,
                  raycast: ignoreSceneEffectRaycast,
                  children: [
                    t.jsx("ringGeometry", { args: [0.112, 0.222, 58] }),
                    t.jsx("meshBasicMaterial", {
                      color: $(o, "#ffffff", 0.36),
                      transparent: !0,
                      opacity: 0.038,
                      depthWrite: !1,
                      blending: q,
                      toneMapped: !1,
                      side: J,
                    }),
                  ],
                }),
              p &&
                t.jsx("group", {
                  position: [0, 0, 0.18],
                  scale: [0.78, 0.78, 0.82],
                  children: t.jsx(ut, {
                    color: o,
                    variant: "forward",
                    strong: !0,
                    wideStart: !0,
                  }),
                }),
            ],
          }),
        }),
      ],
    });
  }
  if (s === "fan.tower") {
    const p = n || c === "on";
    return t.jsxs("group", {
      children: [
        t.jsxs("mesh", {
          position: [0, 0.04, 0],
          castShadow: !0,
          children: [
            t.jsx("cylinderGeometry", { args: [0.2, 0.24, 0.065, 44] }),
            d(0.38, 0.08),
          ],
        }),
        t.jsxs("mesh", {
          position: [0, 0.085, 0],
          castShadow: !0,
          children: [
            t.jsx("cylinderGeometry", { args: [0.15, 0.18, 0.035, 36] }),
            d(0.34, 0.06, "detail"),
          ],
        }),
        t.jsxs(Vt, {
          active: p,
          amplitude: 0.14,
          speed: 0.78,
          children: [
            t.jsx(D, {
              position: [0, 0.54, 0],
              args: [0.22, 0.98, 0.18],
              radius: 0.08,
              smoothness: 8,
              castShadow: !0,
              children: t.jsx("meshPhysicalMaterial", {
                color: x,
                roughness: 0.34,
                metalness: 0.035,
                clearcoat: 0.38,
                clearcoatRoughness: 0.62,
                transparent: i,
                opacity: j,
                emissive: C,
                emissiveIntensity: O,
              }),
            }),
            t.jsx(D, {
              position: [0, 0.55, 0.095],
              args: [0.135, 0.74, 0.018],
              radius: 0.032,
              smoothness: 5,
              children: t.jsx("meshBasicMaterial", {
                color: G,
                transparent: !0,
                opacity: i ? 0.08 : p ? 0.22 : 0.1,
                depthWrite: !1,
                toneMapped: !1,
              }),
            }),
            [-0.28, -0.18, -0.08, 0.02, 0.12, 0.22, 0.32].map((v) =>
              t.jsxs(
                "mesh",
                {
                  position: [0, 0.53 + v, 0.112],
                  children: [
                    t.jsx("boxGeometry", { args: [0.13, 0.008, 0.01] }),
                    g(p ? 0.34 : 0.14),
                  ],
                },
                v,
              ),
            ),
            [-0.045, 0, 0.045].map((v) =>
              t.jsxs(
                "mesh",
                {
                  position: [v, 0.55, 0.114],
                  children: [
                    t.jsx("boxGeometry", { args: [0.006, 0.62, 0.01] }),
                    g(p ? 0.22 : 0.1),
                  ],
                },
                v,
              ),
            ),
            t.jsxs("mesh", {
              position: [0, 1.04, 0],
              castShadow: !0,
              children: [
                t.jsx("sphereGeometry", { args: [0.083, 26, 12] }),
                d(0.32, 0.1),
              ],
            }),
            t.jsxs("mesh", {
              position: [0, 1.085, 0.002],
              scale: [1, 0.32, 1],
              children: [
                t.jsx("sphereGeometry", { args: [0.07, 24, 10] }),
                g(p ? 0.22 : 0.1),
              ],
            }),
            p &&
              t.jsx("group", {
                position: [0, 0.6, 0.22],
                scale: [0.96, 1.08, 1.04],
                children: t.jsx(ut, {
                  color: o,
                  profile: "slot",
                  variant: "forward",
                  strong: !0,
                }),
              }),
          ],
        }),
      ],
    });
  }
  if (s === "fan.ceiling") {
    const p = n || c === "on",
      v = $(x, "#d9f1ff", 0.32),
      P = [0, 1, 2, 3].map((T) =>
        t.jsxs(
          "group",
          {
            rotation: [0, (T * Math.PI) / 2, 0],
            children: [
              t.jsxs("mesh", {
                position: [0.045, -0.03, 0],
                rotation: [-Math.PI / 2, 0, 0.014],
                scale: [1.04, 1.08, 1],
                castShadow: !0,
                receiveShadow: !0,
                children: [
                  t.jsx("shapeGeometry", { args: [qn] }),
                  t.jsx("meshPhysicalMaterial", {
                    color: v,
                    roughness: 0.48,
                    metalness: 0.018,
                    clearcoat: 0.2,
                    clearcoatRoughness: 0.74,
                    transparent: i,
                    opacity: j,
                    emissive: C,
                    emissiveIntensity: O * 0.24,
                    side: J,
                  }),
                ],
              }),
              t.jsxs("mesh", {
                position: [0.21, -0.012, 0],
                rotation: [0, 0, -0.012],
                castShadow: !0,
                children: [
                  t.jsx("boxGeometry", { args: [0.3, 0.012, 0.042] }),
                  d(0.32, 0.08, "detail"),
                ],
              }),
              t.jsxs("mesh", {
                position: [0.35, -0.01, 0],
                children: [
                  t.jsx("boxGeometry", { args: [0.072, 0.014, 0.062] }),
                  g(p ? 0.13 : 0.055),
                ],
              }),
            ],
          },
          T,
        ),
      );
    return t.jsxs("group", {
      children: [
        t.jsx(Wt, { active: p, axis: "y", speed: 9, children: P }),
        t.jsxs("mesh", {
          position: [0, 0.14, 0],
          castShadow: !0,
          children: [
            t.jsx("cylinderGeometry", { args: [0.016, 0.022, 0.25, 24] }),
            d(0.28, 0.18, "detail"),
          ],
        }),
        t.jsxs("mesh", {
          position: [0, 0.285, 0],
          castShadow: !0,
          children: [
            t.jsx("cylinderGeometry", { args: [0.066, 0.094, 0.052, 48] }),
            d(0.36, 0.08),
          ],
        }),
        t.jsxs("mesh", {
          position: [0, 0.315, 0],
          castShadow: !0,
          children: [
            t.jsx("cylinderGeometry", { args: [0.072, 0.086, 0.026, 48] }),
            d(0.42, 0.08),
          ],
        }),
        t.jsxs("mesh", {
          position: [0, 0.023, 0],
          castShadow: !0,
          children: [
            t.jsx("cylinderGeometry", { args: [0.13, 0.132, 0.095, 64] }),
            d(0.36, 0.1),
          ],
        }),
        t.jsxs("mesh", {
          position: [0, -0.036, 0],
          castShadow: !0,
          children: [
            t.jsx("cylinderGeometry", { args: [0.14, 0.128, 0.04, 64] }),
            d(0.32, 0.12),
          ],
        }),
        t.jsxs("mesh", {
          position: [0, -0.074, 0],
          scale: [1, 0.28, 1],
          children: [
            t.jsx("sphereGeometry", { args: [0.112, 42, 14] }),
            d(0.34, 0.08),
          ],
        }),
        t.jsxs("mesh", {
          position: [0, 0.056, 0],
          rotation: [-Math.PI / 2, 0, 0],
          children: [
            t.jsx("ringGeometry", { args: [0.076, 0.136, 58] }),
            g(p ? 0.13 : 0.06),
          ],
        }),
        n &&
          t.jsxs("mesh", {
            rotation: [-Math.PI / 2, 0, 0],
            children: [
              t.jsx("ringGeometry", { args: [0.32, 0.82, 80] }),
              g(0.07),
            ],
          }),
        p &&
          t.jsx("group", {
            position: [0, -0.13, 0],
            scale: [0.86, 0.86, 0.86],
            children: t.jsx(ut, { color: o, variant: "down", strong: !0 }),
          }),
      ],
    });
  }
  if (cameraModelDefinition(s)) return t.jsx(CameraModel,{shape:cameraModelDefinition(s).shape,color:i ? "#84909a" : "#eef2f5"});
  if (s === "camera.wall")
    return t.jsxs("group", {
      children: [
        t.jsxs("mesh", {
          position: [0, 0.016, 0],
          castShadow: !0,
          children: [
            t.jsx("boxGeometry", { args: [0.26, 0.17, 0.13] }),
            d(0.36, 0.08),
          ],
        }),
        t.jsxs("mesh", {
          position: [0, 0.016, 0.079],
          rotation: [Math.PI / 2, 0, 0],
          castShadow: !0,
          children: [
            t.jsx("cylinderGeometry", { args: [0.054, 0.068, 0.058, 28] }),
            d(0.22, 0.18),
          ],
        }),
        t.jsxs("mesh", {
          position: [0, 0.016, 0.116],
          rotation: [Math.PI / 2, 0, 0],
          children: [
            t.jsx("circleGeometry", { args: [0.04, 24] }),
            g(n ? 0.82 : 0.45),
          ],
        }),
      ],
    });
  if (s === "camera.doorbell")
    return t.jsxs("group", {
      children: [
        t.jsx(D, {
          args: [0.145, 0.34, 0.058],
          radius: 0.038,
          smoothness: 5,
          castShadow: !0,
          children: d(0.32, 0.08),
        }),
        t.jsxs("mesh", {
          position: [0, 0.076, 0.036],
          children: [
            t.jsx("circleGeometry", { args: [0.037, 24] }),
            g(n ? 0.82 : 0.45),
          ],
        }),
        t.jsxs("mesh", {
          position: [0, -0.066, 0.037],
          children: [
            t.jsx("circleGeometry", { args: [0.028, 22] }),
            g(n ? 0.58 : 0.28),
          ],
        }),
        t.jsxs("mesh", {
          position: [0, -0.126, 0.037],
          children: [
            t.jsx("boxGeometry", { args: [0.07, 0.019, 0.01] }),
            g(0.24),
          ],
        }),
      ],
    });
  if (s === "media_player.speaker")
    return t.jsxs("group", {
      children: [
        t.jsxs("mesh", {
          position: [0, 0.24, 0],
          castShadow: !0,
          children: [
            t.jsx("boxGeometry", { args: [0.24, 0.48, 0.22] }),
            d(0.44, 0.05),
          ],
        }),
        [-0.11, 0.02, 0.14].map((p) =>
          t.jsxs(
            "mesh",
            {
              position: [0, 0.24 + p, 0.116],
              children: [
                t.jsx("circleGeometry", { args: [0.045, 20] }),
                g(n ? 0.54 : 0.24),
              ],
            },
            p,
          ),
        ),
      ],
    });
  if (s === "media_player.tv")
    return t.jsxs("group", {
      children: [
        t.jsxs("mesh", {
          position: [0, 0.12, 0],
          castShadow: !0,
          children: [
            t.jsx("boxGeometry", { args: [0.56, 0.32, 0.045] }),
            d(0.42, 0.04),
          ],
        }),
        t.jsxs("mesh", {
          position: [0, 0.12, 0.026],
          children: [
            t.jsx("boxGeometry", { args: [0.47, 0.24, 0.01] }),
            g(n ? 0.42 : 0.18),
          ],
        }),
        t.jsxs("mesh", {
          position: [0, -0.08, 0],
          castShadow: !0,
          children: [
            t.jsx("boxGeometry", { args: [0.18, 0.07, 0.07] }),
            d(0.46, 0.06),
          ],
        }),
      ],
    });
  if (s === "vacuum.robot") {
    const p = ["cleaning", "returning", "on"].includes(c);
    return t.jsxs("group", {
      children: [
        t.jsxs("mesh", {
          position: [0, 0.055, 0],
          castShadow: !0,
          children: [
            t.jsx("cylinderGeometry", { args: [0.24, 0.26, 0.11, 44] }),
            d(0.46, 0.12),
          ],
        }),
        t.jsxs("mesh", {
          position: [0.055, 0.132, -0.025],
          castShadow: !0,
          children: [
            t.jsx("cylinderGeometry", { args: [0.055, 0.06, 0.04, 22] }),
            d(0.32, 0.14),
          ],
        }),
        t.jsxs("mesh", {
          position: [-0.08, 0.114, 0.06],
          children: [
            t.jsx("circleGeometry", { args: [0.026, 18] }),
            g(p ? 0.58 : 0.28),
          ],
        }),
        [-0.12, 0.12].map((v) =>
          t.jsxs(
            "mesh",
            {
              position: [v, 0.052, -0.23],
              children: [
                t.jsx("boxGeometry", { args: [0.08, 0.026, 0.026] }),
                g(0.3),
              ],
            },
            v,
          ),
        ),
        p &&
          t.jsxs("mesh", {
            raycast: ignoreSceneEffectRaycast,
            position: [0, 0.118, 0],
            rotation: [-Math.PI / 2, 0, 0],
            children: [
              t.jsx("ringGeometry", { args: [0.29, 0.36, 44] }),
              t.jsx("meshBasicMaterial", {
                color: G,
                transparent: !0,
                opacity: 0.18,
                depthWrite: !1,
                toneMapped: !1,
              }),
            ],
          }),
      ],
    });
  }
  if (s === "alarm.panel")
    return t.jsxs("group", {
      children: [
        t.jsxs("mesh", {
          castShadow: !0,
          children: [
            t.jsx("boxGeometry", { args: [0.32, 0.44, 0.06] }),
            d(0.34, 0.05),
          ],
        }),
        t.jsxs("mesh", {
          position: [0, 0.11, 0.034],
          children: [
            t.jsx("boxGeometry", { args: [0.2, 0.08, 0.012] }),
            g(n ? 0.58 : 0.28),
          ],
        }),
        [-0.07, 0, 0.07].map((p) =>
          t.jsxs(
            "mesh",
            {
              position: [p, -0.055, 0.035],
              children: [
                t.jsx("circleGeometry", { args: [0.022, 16] }),
                g(0.36),
              ],
            },
            p,
          ),
        ),
      ],
    });
  if (s === "lock.door") {
    const p = ["unlocked", "open", "opening"].includes(c);
    return t.jsxs("group", {
      children: [
        t.jsx(D, {
          args: [0.24, 0.44, 0.07],
          radius: 0.045,
          smoothness: 5,
          castShadow: !0,
          children: t.jsx("meshPhysicalMaterial", {
            color: x,
            roughness: 0.32,
            metalness: 0.08,
            clearcoat: 0.36,
            clearcoatRoughness: 0.58,
            emissive: p || n ? G : "#000000",
            emissiveIntensity: p ? 0.2 : n ? 0.12 : 0,
            transparent: i,
            opacity: j,
          }),
        }),
        t.jsxs("mesh", {
          position: [0, 0.09, 0.046],
          rotation: [0, 0, p ? -0.24 : 0],
          children: [
            t.jsx("torusGeometry", { args: [0.053, 0.01, 8, 24, Math.PI] }),
            g(p || n ? 0.72 : 0.32),
          ],
        }),
        t.jsxs("mesh", {
          position: [0, -0.025, 0.047],
          children: [
            t.jsx("boxGeometry", { args: [0.105, 0.09, 0.012] }),
            g(p || n ? 0.62 : 0.26),
          ],
        }),
        t.jsxs("mesh", {
          position: [0, -0.125, 0.048],
          children: [
            t.jsx("boxGeometry", { args: [0.024, 0.095, 0.012] }),
            g(0.35),
          ],
        }),
        p &&
          t.jsxs("mesh", {
            position: [0, 0, 0.09],
            children: [
              t.jsx("sphereGeometry", { args: [0.025, 16, 8] }),
              t.jsx("meshBasicMaterial", {
                color: G,
                transparent: !0,
                opacity: 0.92,
                toneMapped: !1,
              }),
            ],
          }),
      ],
    });
  }
  return t.jsxs("mesh", {
    castShadow: !0,
    children: [
      t.jsx("sphereGeometry", { args: [0.15, 24, 14] }),
      d(0.35, 0.04),
    ],
  });
}
function Es(e) {
  return e === "climate.central_ac"
    ? 0.42
    : e === "light.ceiling_panel"
      ? 0.28
      : e === "light.ceiling_round"
        ? 0.24
        : e === "light.wall_sconce"
          ? 0.22
          : e === "light.strip" || e === "cover.curtain" || e === "cover.blind"
            ? 0.36
            : [
                  "light.floor_lamp",
                  "climate.floor_ac",
                  "fan.floor",
                  "fan.ceiling",
                  "fan.tower",
                  "media_player.tv",
                  "vacuum.robot",
                ].includes(e)
              ? 0.3
              : e.startsWith("camera.")
                ? 0.2
                : ["media_player.speaker", "lock.door"].includes(e)
                  ? 0.24
                  : [
                        "sensor.co2",
                        "sensor.pm25",
                        "binary_sensor.presence",
                      ].includes(e)
                    ? 0.21
                    : e === "binary_sensor.water"
                      ? 0.2
                      : e === "light.downlight"
                        ? 0.13
                        : 0.19;
}
function Ns(e, s) {
  return s
    ? e.startsWith("camera.")
      ? [0.94, 0.94, 0.94]
      : e === "light.strip" ||
          e === "cover.curtain" ||
          e === "cover.blind" ||
          e === "media_player.tv" ||
          e === "climate.central_ac"
        ? [1.16, 1.16, 1.16]
        : [
              "light.floor_lamp",
              "climate.floor_ac",
              "fan.floor",
              "fan.tower",
            ].includes(e)
          ? [1.18, 1.18, 1.18]
          : e === "vacuum.robot"
            ? [1.24, 1.24, 1.24]
            : e === "light.downlight"
              ? [1, 1, 1]
              : [
                    "light.ceiling_panel",
                    "light.ceiling_round",
                    "light.wall_sconce",
                  ].includes(e)
                ? [1.06, 1.06, 1.06]
                : [
                      "binary_sensor.motion",
                      "binary_sensor.presence",
                      "binary_sensor.smoke",
                    ].includes(e)
                  ? [1.26, 1.26, 1.26]
                  : ["lock.door"].includes(e)
                    ? [1.18, 1.18, 1.18]
                    : e.startsWith("sensor.")
                      ? [1.1, 1.1, 1.1]
                      : [1.12, 1.12, 1.12]
    : e === "light.strip" ||
        e === "cover.curtain" ||
        e === "cover.blind" ||
        e === "media_player.tv" ||
        e === "climate.central_ac"
      ? [1.16, 1.16, 1.16]
      : [
            "light.floor_lamp",
            "climate.floor_ac",
            "fan.floor",
            "fan.tower",
          ].includes(e)
        ? [1.12, 1.12, 1.12]
        : e === "vacuum.robot"
          ? [1.22, 1.22, 1.22]
          : e === "light.downlight"
            ? [1, 1, 1]
            : [
                  "light.ceiling_panel",
                  "light.ceiling_round",
                  "light.wall_sconce",
                ].includes(e)
              ? [1.04, 1.04, 1.04]
              : e.startsWith("camera.")
                ? [1.02, 1.02, 1.02]
                : [
                      "binary_sensor.motion",
                      "binary_sensor.presence",
                      "binary_sensor.smoke",
                    ].includes(e)
                  ? [1.34, 1.34, 1.34]
                  : ["lock.door"].includes(e)
                    ? [1.28, 1.28, 1.28]
                    : [1.24, 1.24, 1.24];
}
function Os(e) {
  return e === "light.wall_sconce"
    ? 0.52
    : e === "light.floor_lamp"
      ? 1.52
      : e === "climate.floor_ac"
        ? 1.28
        : e === "fan.floor" || e === "fan.tower"
          ? 1.2
          : e === "climate.central_ac"
            ? 0.62
            : e === "media_player.speaker"
              ? 0.72
              : e === "camera.bullet"
                ? 0.48
                : e === "camera.doorbell"
                  ? 0.54
                  : e === "lock.door"
                    ? 0.64
                    : e === "vacuum.robot"
                      ? 0.38
                      : e === "binary_sensor.water"
                        ? 0.28
                        : 0.42;
}
function ri(e, s) {
  return e === "light.wall_sconce"
    ? 0.46
    : [
          "light.floor_lamp",
          "climate.floor_ac",
          "fan.floor",
          "fan.tower",
        ].includes(e)
      ? 1.38
      : s === "floor"
        ? 0.46
        : e === "climate.central_ac"
          ? 0.52
          : e.startsWith("camera.")
            ? 0.48
            : e === "lock.door"
              ? 0.66
              : s === "ceiling"
                ? 0.48
                : 0.54;
}
function $t(e) {
  return e === "light.wall_sconce"
    ? { radius: 0.3, y: 0 }
    : e === "light.ceiling_panel"
      ? { radius: 0.34, y: 0 }
      : e === "light.ceiling_round"
        ? { radius: 0.28, y: 0 }
        : e === "fan.floor"
          ? { radius: 0.38, y: 0.66 }
          : [
                "light.floor_lamp",
                "climate.floor_ac",
                "fan.floor",
                "fan.tower",
              ].includes(e)
            ? { radius: 0.46, y: 0.72 }
            : e === "climate.central_ac"
              ? { radius: 0.56, y: -0.08 }
              : e === "media_player.tv" || e.startsWith("cover.")
                ? { radius: 0.42, y: 0.04 }
                : e === "media_player.speaker"
                  ? { radius: 0.34, y: 0.24 }
                  : e === "camera.bullet"
                    ? { radius: 0.28, y: 0.01 }
                    : e.startsWith("camera.")
                      ? { radius: 0.26, y: 0 }
                      : e === "lock.door"
                        ? { radius: 0.34, y: 0 }
                        : [
                              "sensor.co2",
                              "sensor.pm25",
                              "binary_sensor.presence",
                            ].includes(e)
                          ? { radius: 0.33, y: 0 }
                          : e === "binary_sensor.water" || e === "vacuum.robot"
                            ? { radius: 0.32, y: 0.08 }
                            : { radius: 0.34, y: 0 };
}
function oi(e, s, r) {
  const o = $t(e),
    n = Math.max(r * 2.22, 0.54),
    i = Math.max(r * 2.04, 0.22);
  return e === "light.floor_lamp"
    ? { centerY: 0.68, width: 0.58, height: 1.34, depth: 0.58, corner: 0.12 }
    : e === "light.wall_sconce"
      ? { centerY: o.y, width: 0.38, height: 0.42, depth: 0.24, corner: 0.07 }
      : e === "light.ceiling_panel"
        ? { centerY: o.y, width: 0.5, height: 0.06, depth: 0.31, corner: 0.04 }
        : e === "light.ceiling_round"
          ? {
              centerY: o.y,
              width: 0.52,
              height: 0.18,
              depth: 0.52,
              corner: 0.08,
            }
          : e === "climate.floor_ac"
            ? {
                centerY: 0.56,
                width: 0.52,
                height: 1.18,
                depth: 0.42,
                corner: 0.1,
              }
            : e === "fan.floor"
              ? {
                  centerY: 0.55,
                  width: 0.48,
                  height: 1.1,
                  depth: 0.48,
                  corner: 0.1,
                }
              : e === "fan.tower"
                ? {
                    centerY: 0.58,
                    width: 0.56,
                    height: 1.16,
                    depth: 0.56,
                    corner: 0.1,
                  }
                : e === "media_player.tv" || e.startsWith("cover.")
                  ? {
                      centerY: o.y,
                      width: Math.max(r * 2.36, 0.82),
                      height: 0.52,
                      depth: 0.18,
                      corner: 0.055,
                    }
                  : e === "climate.central_ac"
                    ? {
                        centerY: o.y,
                        width: 0.98,
                        height: 0.32,
                        depth: 0.48,
                        corner: 0.07,
                      }
                    : e === "lock.door"
                      ? {
                          centerY: o.y,
                          width: 0.48,
                          height: 0.78,
                          depth: 0.2,
                          corner: 0.07,
                        }
                      : e.startsWith("camera.")
                        ? {
                            centerY: o.y + 0.02,
                            width: 0.44,
                            height: 0.38,
                            depth: 0.34,
                            corner: 0.06,
                          }
                        : s === "ceiling"
                          ? {
                              centerY: -0.02,
                              width: n,
                              height: 0.3,
                              depth: n,
                              corner: 0.08,
                            }
                          : s === "floor"
                            ? {
                                centerY: Math.max(o.y, 0.16),
                                width: n,
                                height: 0.34,
                                depth: n,
                                corner: 0.08,
                              }
                            : {
                                centerY: o.y + 0.02,
                                width: n,
                                height: 0.42,
                                depth: i,
                                corner: 0.07,
                              };
}
function Ts({ color: e, modelId: s, placement: r, radius: o }) {
  const n = $(e, "#ffffff", 0.58),
    i = $(e, "#f8fdff", 0.34),
    { centerY: a, width: c, height: l, depth: f, corner: u } = oi(s, r, o);
  return t.jsxs(SceneEffectGroup, {
    position: [0, a, 0],
    renderOrder: 8,
    children: [
      t.jsxs(D, {
        args: [c + 0.035, l + 0.032, f + 0.035],
        radius: u + 0.012,
        smoothness: 5,
        children: [
          t.jsx("meshBasicMaterial", {
            color: i,
            transparent: !0,
            opacity: 0.014,
            depthWrite: !1,
            toneMapped: !1,
            blending: q,
          }),
          t.jsx(Y, { color: n, threshold: 16, opacity: 0.88, transparent: !0 }),
        ],
      }),
      t.jsxs(D, {
        args: [c + 0.16, l + 0.14, f + 0.16],
        radius: u + 0.045,
        smoothness: 5,
        children: [
          t.jsx("meshBasicMaterial", {
            color: e,
            transparent: !0,
            opacity: 0.008,
            depthWrite: !1,
            toneMapped: !1,
            blending: q,
          }),
          t.jsx(Y, { color: e, threshold: 16, opacity: 0.2, transparent: !0 }),
        ],
      }),
    ],
  });
}
function ni({
  device: e,
  entity: s,
  color: r,
  offsetY: o,
  warning: n,
  runtime,
}) {
  var a;
  const [now, setNow] = L.useState(Date.now());
  L.useEffect(() => {
    if (!runtime?.running) return;
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 10_000);
    return () => window.clearInterval(timer);
  }, [runtime?.running]);
  const i =
    e.kind === "light" ||
    ((a = e.modelId) != null && a.startsWith("switch.light."))
      ? vt(ot(s))
      : s
        ? Ae(s)
        : "未同步";
  return t.jsxs(le, {
    position: [0, o, 0.04],
    center: !0,
    zIndexRange: ve,
    className: `scene-device-status-chip chip-${e.kind} ${n ? "chip-warning" : ""} ${runtime?.running ? "chip-washer-running" : ""}`,
    children: [
      t.jsx("i", { style: { backgroundColor: r } }),
      t.jsx("span", {
        children: washerRuntimeTitle(
          runtime,
          (s == null ? void 0 : (s.deviceDisplayName ?? s.name)) ?? e.entityId,
          now,
        ),
      }),
      t.jsx("strong", { children: washerRuntimeLabel(runtime, now) ?? i }),
    ],
  });
}
function Is(e, s, r, o, n) {
  if (n) return mn(e, s, r, o);
  const [i, a, c] = e;
  return s === "floor" ? [i, Ms(a), c] : [i, a, c];
}
const ii = L.memo(function ({
    device: s,
    entity: r,
    presentation: o,
    theme: n,
    presentationMode: i,
    floorHeight: a,
    baseElevation,
    onSelect: c,
    onDeviceSelect: l,
  }) {
    const f = Ie((ae) => ae.selectEntity),
      u = Ie((ae) => ae.selectedEntityId),
      h = he(r),
      m = Ke(r),
      y = _s(s, r),
      w = ct(s, r),
      b = u === s.entityId,
      j = An(r, "current_position", h === "open" ? 100 : 0),
      x = h === "heat" ? "#ff784d" : "#38c8ff",
      k = ge(n, i),
      G = ko(s, r),
      C = os(G.id),
      O = C.startsWith("light."),
      N = lt(s, r, i),
      E = ot(r),
      d = O
        ? E.color
        : s.kind === "cover"
          ? "#4c9ed9"
          : s.kind === "sensor"
            ? "#2dae7b"
            : s.kind === "binary_sensor" ||
                s.kind === "lock" ||
                s.kind === "alarm_control_panel"
              ? "#c6687b"
              : s.kind === "camera"
                ? "#6d74be"
                : s.kind === "climate"
                  ? x
                  : s.kind === "fan"
                    ? "#45a79a"
                    : s.kind === "vacuum"
                      ? "#5c8fb6"
                      : s.kind === "switch"
                        ? "#7b9a63"
                        : "#7b78d1",
      g = m && o ? "#87909a" : d,
      _ = O ? E.color : N ? Lt(i, g) : g,
      M = m ? (o ? "#77808a" : g) : o ? k.deviceBody : g,
      p =
        typeof (r == null ? void 0 : r.attributes.unit_of_measurement) ==
        "string"
          ? r.attributes.unit_of_measurement
          : "",
      v = r ? `${r.state}${p}` : "--",
      P =
        `${(r == null ? void 0 : r.entityId) ?? ""} ${(r == null ? void 0 : r.name) ?? ""} ${(r == null ? void 0 : r.attributes.device_class) ?? ""} ${p}`.toLowerCase(),
      T = /(temperature|humidity|温度|湿度|°c|℃|%)/i.test(P),
      z = o && i === "environment" && s.kind === "sensor" && !m && (b || T),
      I = w && i === "security",
      F = (O ? y : y || I || (N && (s.kind !== "climate" || y))) && !m,
      S = F || (b && !m),
      B = rn(G.id),
      R = B && Ve(s),
      W = Es(C),
      ee = R ? [1, 1, 1] : s.scale ? s.scale : Ns(C, o),
      K = R ? [0, 0, 0] : s.rotation,
      te = m && o && b,
      Q = Sn(s, r, i, _),
      configuredModel = r?.deviceModel?.source ? r.deviceModel : s.customModel,
      washerRuntime = resolveWasherRuntime(
        configuredModel?.runtimeEffect,
        r,
        r?.deviceStatusDisplay,
      ),
      Z =
        washerRuntime !== null
          ? washerRuntime.running
          : o &&
            !z &&
            !(i === "lighting" && O) &&
            (b || I || (y && i === "lighting")),
      ye = Is(
        baseElevation === void 0
          ? s.position
          : [s.position[0], baseElevation, s.position[2]],
        G.placement,
        C,
        a,
        o,
      );
    return t.jsxs("group", {
      position: ye,
      rotation: K,
      scale: ee,
      onClick: (ae) => {
        (ae.stopPropagation(),
          Xt(),
          f(s.entityId),
          c == null || c(s.entityId),
          l == null || l(s.id, s.entityId));
      },
      onPointerOver: () => {
        document.body.style.cursor = "pointer";
      },
      onPointerOut: () => {
        document.body.style.cursor = "auto";
      },
      children: [
        F &&
          !O &&
          !C.startsWith("cover.") &&
          t.jsx("pointLight", {
            color: i === "lighting" ? "#ffd08a" : _,
            intensity: o ? (N ? 2.25 : 1.55) : 1.35,
            distance: 2.7,
          }),
        t.jsx(Gt, {
          children: configuredModel?.source
            ? t.jsx(ConfiguredDeviceModel, {
                config: configuredModel,
                motionEntity: r,
                unavailable: m,
                running: washerRuntime?.running ?? false,
                runtime: washerRuntime
                  ? {
                      ...washerRuntime,
                      running: washerRuntime.animationRunning,
                    }
                  : null,
              })
            : O
              ? t.jsx($s, {
                  modelId: C,
                  bodyColor: M,
                  appearance: E,
                  unavailable: m,
                  modeHighlighted: N,
                  presentation: o,
                  selected: b,
                  device: s,
                })
              : t.jsx(si, {
                  kind: s.kind,
                  modelId: G.id,
                  bodyColor: M,
                  highlightColor: _,
                  glowActive: S,
                  unavailable: m,
                  modeHighlighted: N,
                  state: h,
                  coverPosition: j,
                  climateColor: x,
                  presentation: o,
                  selected: b,
                  entity: r,
                }),
        }),
        z &&
          t.jsxs(le, {
            position: [0, 0.34, 0],
            center: !0,
            zIndexRange: ve,
            className: "scene-sensor-label",
            children: [
              t.jsx("span", {
                children:
                  (r == null ? void 0 : (r.deviceDisplayName ?? r.name)) ??
                  s.entityId,
              }),
              t.jsx("strong", { children: v }),
            ],
          }),
        Z &&
          t.jsx(ni, {
            device: s,
            entity: r,
            color: Q,
            offsetY: ri(C, G.placement),
            warning: w,
            runtime: washerRuntime,
          }),
        !o &&
          b &&
          t.jsxs(le, {
            position: [0, Os(C), 0],
            center: !0,
            zIndexRange: ve,
            className: "scene-device-selected-label",
            children: [
              t.jsx("span", {
                children:
                  (r == null ? void 0 : (r.deviceDisplayName ?? r.name)) ??
                  s.entityId,
              }),
              t.jsxs("small", {
                children: [G.label, O ? ` · ${m ? "离线" : vt(E)}` : ""],
              }),
            ],
          }),
        te &&
          t.jsx(le, {
            position: [0, s.kind === "sensor" ? 0.61 : 0.34, 0],
            center: !0,
            zIndexRange: ve,
            className: "scene-device-offline",
            children: "离线",
          }),
        b &&
          !B &&
          !C.startsWith("light.") &&
          !m &&
          t.jsx(Ts, {
            color: Q,
            modelId: C,
            placement: G.placement,
            radius: W,
          }),
      ],
    });
  }),
  ai = L.memo(function ({
    fixture: s,
    switchDevice: r,
    entity: o,
    presentation: n,
    theme: i,
    presentationMode: a,
    onSelect: c,
    onDeviceSelect: l,
  }) {
    var d;
    const f = Ie((g) => g.selectEntity),
      h = Ie((g) => g.selectedEntityId) === r.entityId,
      m = Ke(o),
      y = os(s.modelId ?? "light.downlight"),
      w = ot(o),
      b = ge(i, a),
      j = a === "lighting",
      x = ((d = wt(y)) == null ? void 0 : d.placement) ?? "ceiling",
      k = Is(s.position, x, y, void 0, n),
      G = {
        id: s.id,
        entityId: r.entityId,
        kind: "light",
        floorId: r.floorId,
        roomId: s.roomId,
        position: s.position,
        rotation: s.rotation ?? [0, 0, 0],
        scale: s.scale,
        modelId: y,
      },
      C = s.scale ? s.scale : Ns(y, n),
      O = Es(y),
      N = m ? (n ? "#77808a" : "#9aa2aa") : n ? b.deviceBody : w.color,
      E = () => {
        (Xt(),
          f(r.entityId),
          c == null || c(r.entityId),
          l == null || l(r.id, r.entityId));
      };
    return t.jsxs("group", {
      position: k,
      rotation: s.rotation ?? [0, 0, 0],
      scale: C,
      onClick: (g) => {
        (g.stopPropagation(), E());
      },
      onPointerOver: () => {
        document.body.style.cursor = "pointer";
      },
      onPointerOut: () => {
        document.body.style.cursor = "auto";
      },
      children: [
        t.jsx(Gt, {
          children: t.jsx($s, {
            modelId: y,
            bodyColor: N,
            appearance: w,
            unavailable: m,
            modeHighlighted: j,
            presentation: n,
            selected: h,
            device: G,
          }),
        }),
        !n &&
          h &&
          t.jsxs(le, {
            position: [0, Os(y), 0],
            center: !0,
            zIndexRange: ve,
            className: "scene-device-selected-label",
            children: [
              t.jsx("span", { children: s.label ?? o.name }),
              t.jsxs("small", { children: ["由 ", o.name, " 控制 · ", vt(w)] }),
            ],
          }),
        h &&
          !y.startsWith("light.") &&
          !m &&
          t.jsx(Ts, { color: w.color, modelId: y, placement: x, radius: O }),
      ],
    });
  });
function VanityMirrorCabinetFixture({ item, theme }) {
  const size = normalizeVanityMirrorCabinet(item);
  const night = theme === "night";
  const bodyColor = night ? "#c6c8c1" : "#f2f0e9";
  const topColor = night ? "#c8d0d1" : "#faf9f5";
  const trimColor = night ? "#75868c" : "#9ca9aa";
  const mirrorY = size.vanityHeight + size.mirrorGap + size.mirrorHeight / 2;
  const mirrorZ = size.depth / 2 - size.mirrorDepth / 2;
  const mirrorFront = mirrorZ - size.mirrorDepth / 2 - 0.006;
  const doorWidth = (size.mirrorWidth - 0.07) / 2;
  return t.jsxs(t.Fragment, {
    children: [
      t.jsx(D, {
        position: [0, size.vanityHeight / 2, 0],
        args: [size.width * 0.95, size.vanityHeight - 0.04, size.depth * 0.92],
        radius: 0.025,
        smoothness: 5,
        castShadow: !0,
        receiveShadow: !0,
        children: t.jsx("meshPhysicalMaterial", {
          color: bodyColor,
          roughness: 0.43,
          clearcoat: 0.18,
        }),
      }),
      t.jsx(D, {
        position: [0, size.vanityHeight, 0],
        args: [size.width, 0.045, size.depth],
        radius: 0.012,
        smoothness: 5,
        castShadow: !0,
        receiveShadow: !0,
        children: t.jsx("meshPhysicalMaterial", {
          color: topColor,
          roughness: 0.2,
          clearcoat: 0.42,
        }),
      }),
      [-1, 1].map((side) =>
        t.jsxs(
          t.Fragment,
          {
            children: [
              t.jsx(H, {
                position: [
                  side * size.width * 0.243,
                  size.vanityHeight * 0.48,
                  -size.depth * 0.465,
                ],
                size: [size.width * 0.45, size.vanityHeight * 0.78, 0.012],
                color: bodyColor,
                roughness: 0.38,
              }),
              t.jsx(H, {
                position: [
                  side * size.width * 0.055,
                  size.vanityHeight * 0.5,
                  -size.depth * 0.48,
                ],
                size: [0.012, 0.11, 0.016],
                color: trimColor,
                roughness: 0.22,
              }),
            ],
          },
          `vanity-door-${side}`,
        ),
      ),
      t.jsxs("mesh", {
        position: [0, size.vanityHeight + 0.035, -size.depth * 0.08],
        scale: [size.basinWidth * 0.5, 0.065, size.basinDepth * 0.5],
        castShadow: !0,
        receiveShadow: !0,
        children: [
          t.jsx("sphereGeometry", { args: [1, 32, 20] }),
          t.jsx("meshPhysicalMaterial", {
            color: night ? "#d7e0df" : "#ffffff",
            roughness: 0.16,
            clearcoat: 0.55,
          }),
        ],
      }),
      t.jsxs("mesh", {
        position: [0, size.vanityHeight + 0.092, -size.depth * 0.08],
        rotation: [-Math.PI / 2, 0, 0],
        scale: [size.basinWidth * 0.38, size.basinDepth * 0.37, 1],
        children: [
          t.jsx("circleGeometry", { args: [1, 40] }),
          t.jsx("meshPhysicalMaterial", {
            color: night ? "#8b9fa3" : "#ccd9da",
            roughness: 0.15,
            metalness: 0.08,
            side: Xa.DoubleSide,
          }),
        ],
      }),
      t.jsx(H, {
        position: [0, size.vanityHeight + 0.085, size.depth * 0.31],
        size: [0.026, 0.15, 0.026],
        color: trimColor,
        roughness: 0.2,
      }),
      t.jsx(H, {
        position: [0, size.vanityHeight + 0.15, size.depth * 0.24],
        size: [0.026, 0.025, 0.15],
        color: trimColor,
        roughness: 0.2,
      }),
      t.jsx(D, {
        position: [0, mirrorY, mirrorZ],
        args: [size.mirrorWidth, size.mirrorHeight, size.mirrorDepth],
        radius: 0.014,
        smoothness: 5,
        castShadow: !0,
        receiveShadow: !0,
        children: t.jsx("meshPhysicalMaterial", {
          color: bodyColor,
          roughness: 0.4,
        }),
      }),
      [-1, 1].map((side) =>
        t.jsxs(
          t.Fragment,
          {
            children: [
              t.jsxs("mesh", {
                position: [
                  side * size.mirrorWidth * 0.245,
                  mirrorY,
                  mirrorFront,
                ],
                castShadow: !0,
                children: [
                  t.jsx("boxGeometry", {
                    args: [doorWidth, size.mirrorHeight - 0.06, 0.012],
                  }),
                  t.jsx("meshPhysicalMaterial", {
                    color: night ? "#9aafb7" : "#c6dce2",
                    metalness: 0.65,
                    roughness: 0.08,
                    clearcoat: 0.5,
                  }),
                ],
              }),
              t.jsx(H, {
                position: [
                  side * size.mirrorWidth * 0.056,
                  mirrorY - size.mirrorHeight * 0.31,
                  mirrorFront - 0.015,
                ],
                size: [0.012, 0.055, 0.018],
                color: trimColor,
                roughness: 0.2,
              }),
            ],
          },
          `mirror-door-${side}`,
        ),
      ),
    ],
  });
}

function ShowerEnclosureFixture({ item, theme }) {
  const style = normalizeShowerStyle(item.showerStyle);
  const points = showerEnclosureOutline(
    item.width,
    item.depth,
    style,
    item.showerCornerCut,
  );
  const glassSegments = showerGlassSegments(
    item.width,
    item.depth,
    style,
    item.showerCornerCut,
  );
  const shape = new Xa.Shape();
  points.forEach(([x, z], index) =>
    index === 0 ? shape.moveTo(x, -z) : shape.lineTo(x, -z),
  );
  shape.closePath();
  const frameColor = theme === "night" ? "#83949b" : "#b5c1c2";
  const glassColor = theme === "night" ? "#879fb0" : "#d9edf2";
  const glassHeight = Math.max(0.05, item.height - 0.12);
  const panel = (start, end, key, isDoor = false) => {
    const dx = end[0] - start[0],
      dz = end[1] - start[1],
      length = Math.hypot(dx, dz),
      center = [
        (start[0] + end[0]) / 2,
        0.07 + glassHeight / 2,
        (start[1] + end[1]) / 2,
      ],
      angle = -Math.atan2(dz, dx);
    return t.jsxs(
      "group",
      {
        position: center,
        rotation: [0, angle, 0],
        children: [
          t.jsxs("mesh", {
            receiveShadow: !0,
            children: [
              t.jsx("boxGeometry", { args: [length, glassHeight, 0.008] }),
              t.jsx("meshPhysicalMaterial", {
                color: glassColor,
                roughness: 0.08,
                metalness: 0,
                transparent: !0,
                opacity: 0.29,
                depthWrite: !1,
                side: Xa.DoubleSide,
              }),
            ],
          }),
          [-1, 1]
            .filter(
              (side) =>
                style !== "curved" ||
                (side === -1 && key === 0) ||
                (side === 1 && key === glassSegments.length - 1),
            )
            .map((side) =>
              t.jsx(
                H,
                {
                  position: [(side * length) / 2, 0, 0],
                  size: [0.014, glassHeight, 0.015],
                  color: frameColor,
                  roughness: 0.25,
                },
                side,
              ),
            ),
          t.jsx(H, {
            position: [0, glassHeight / 2, 0],
            size: [length, 0.014, 0.017],
            color: frameColor,
            roughness: 0.24,
          }),
          isDoor &&
            t.jsx(H, {
              position: [length * 0.32, -glassHeight * 0.04, 0.028],
              size: [0.018, Math.min(0.3, glassHeight * 0.2), 0.018],
              color: frameColor,
              roughness: 0.2,
            }),
        ],
      },
      key,
    );
  };
  return t.jsxs(t.Fragment, {
    children: [
      t.jsxs("mesh", {
        position: [0, 0.015, 0],
        rotation: [-Math.PI / 2, 0, 0],
        receiveShadow: !0,
        children: [
          t.jsx("extrudeGeometry", {
            args: [shape, { depth: 0.045, bevelEnabled: !1, curveSegments: 1 }],
          }),
          t.jsx("meshPhysicalMaterial", {
            color: theme === "night" ? "#c9d2d1" : "#f3f5f2",
            roughness: 0.28,
            metalness: 0.01,
            side: Xa.DoubleSide,
          }),
        ],
      }),
      glassSegments.map(([start, end], index) =>
        panel(
          start,
          end,
          index,
          index === (style === "diamond" ? 1 : style === "rectangular" ? 1 : 8),
        ),
      ),
      t.jsxs("mesh", {
        position: [0, 0.064, -item.depth * 0.11],
        rotation: [-Math.PI / 2, 0, 0],
        children: [
          t.jsx("cylinderGeometry", { args: [0.035, 0.035, 0.006, 24] }),
          t.jsx("meshStandardMaterial", {
            color: frameColor,
            metalness: 0.78,
            roughness: 0.23,
          }),
        ],
      }),
    ],
  });
}

function ShowerFixture({ item, theme }) {
  const chrome = theme === "night" ? "#8a9ba2" : "#bdc8ca";
  const railZ = -item.depth * 0.37;
  return t.jsxs(t.Fragment, {
    children: [
      t.jsxs("mesh", {
        position: [0, item.height * 0.53, railZ],
        castShadow: !0,
        children: [
          t.jsx("cylinderGeometry", {
            args: [0.009, 0.009, item.height * 0.72, 16],
          }),
          t.jsx("meshStandardMaterial", {
            color: chrome,
            metalness: 0.78,
            roughness: 0.2,
          }),
        ],
      }),
      t.jsx(H, {
        position: [0, item.height * 0.87, 0],
        size: [0.018, 0.018, item.depth * 0.75],
        color: chrome,
        roughness: 0.2,
      }),
      t.jsxs("mesh", {
        position: [0, item.height * 0.87, item.depth * 0.28],
        children: [
          t.jsx("cylinderGeometry", {
            args: [item.width * 0.34, item.width * 0.34, 0.018, 32],
          }),
          t.jsx("meshStandardMaterial", {
            color: chrome,
            metalness: 0.75,
            roughness: 0.22,
          }),
        ],
      }),
      t.jsxs("mesh", {
        position: [0, item.height * 0.46, railZ + 0.025],
        rotation: [Math.PI / 2, 0, 0],
        children: [
          t.jsx("cylinderGeometry", { args: [0.048, 0.048, 0.022, 28] }),
          t.jsx("meshStandardMaterial", {
            color: chrome,
            metalness: 0.72,
            roughness: 0.24,
          }),
        ],
      }),
      t.jsx(H, {
        position: [0, item.height * 0.3, railZ + 0.065],
        size: [item.width * 0.6, 0.016, 0.014],
        color: chrome,
        roughness: 0.2,
      }),
    ],
  });
}

function ToiletFixture({ item, theme }) {
  const porcelain = theme === "night" ? "#d1d8d7" : "#f6f6f3";
  const lid = theme === "night" ? "#dfe4e2" : "#ffffff";
  return t.jsxs(t.Fragment, {
    children: [
      t.jsxs(D, {
        position: [0, item.height * 0.28, item.depth * 0.07],
        args: [item.width * 0.88, item.height * 0.56, item.depth * 0.84],
        radius: Math.min(item.width * 0.18, item.height * 0.24),
        smoothness: 7,
        castShadow: !0,
        receiveShadow: !0,
        children: t.jsx("meshPhysicalMaterial", {
          color: porcelain,
          roughness: 0.24,
          clearcoat: 0.45,
        }),
      }),
      t.jsxs("mesh", {
        position: [0, item.height * 0.61, item.depth * 0.1],
        scale: [item.width * 0.46, item.height * 0.25, item.depth * 0.43],
        castShadow: !0,
        children: [
          t.jsx("sphereGeometry", { args: [1, 32, 20] }),
          t.jsx("meshPhysicalMaterial", {
            color: porcelain,
            roughness: 0.22,
            clearcoat: 0.45,
          }),
        ],
      }),
      t.jsxs(D, {
        position: [0, item.height * 0.64, -item.depth * 0.31],
        args: [item.width * 0.87, item.height * 0.38, item.depth * 0.29],
        radius: Math.min(0.06, item.height * 0.12),
        smoothness: 7,
        castShadow: !0,
        children: t.jsx("meshPhysicalMaterial", {
          color: porcelain,
          roughness: 0.23,
          clearcoat: 0.45,
        }),
      }),
      t.jsxs("mesh", {
        position: [0, item.height * 0.83, item.depth * 0.09],
        scale: [item.width * 0.455, item.height * 0.035, item.depth * 0.425],
        children: [
          t.jsx("sphereGeometry", { args: [1, 32, 16] }),
          t.jsx("meshStandardMaterial", {
            color: theme === "night" ? "#a6b0b1" : "#d1d5d4",
            roughness: 0.48,
          }),
        ],
      }),
      t.jsxs("mesh", {
        position: [0, item.height * 0.865, item.depth * 0.09],
        scale: [item.width * 0.45, item.height * 0.048, item.depth * 0.42],
        castShadow: !0,
        children: [
          t.jsx("sphereGeometry", { args: [1, 32, 16] }),
          t.jsx("meshPhysicalMaterial", {
            color: lid,
            roughness: 0.18,
            clearcoat: 0.5,
          }),
        ],
      }),
      t.jsxs("mesh", {
        position: [item.width * 0.28, item.height * 0.85, -item.depth * 0.32],
        scale: [1, 0.26, 1],
        children: [
          t.jsx("cylinderGeometry", { args: [0.025, 0.025, 0.018, 24] }),
          t.jsx("meshStandardMaterial", {
            color: "#aebbbc",
            metalness: 0.7,
            roughness: 0.24,
          }),
        ],
      }),
    ],
  });
}

function ci({
  item: e,
  theme: s,
  presentation: r,
  presentationMode: o,
  baseElevation,
}) {
  const n = ue(),
    i = n === "cartoon" && r,
    a = n === "cream" && r,
    c = ge(s, o),
    l = c.furnitureMain,
    f = c.furnitureDetail,
    u = i ? l : a ? $(l, "#f7ead5", 0.26) : r ? $(l, "#edf5ff", 0.28) : l,
    h = i ? f : a ? $(f, "#cdbb9f", 0.18) : r ? $(f, "#d8e8ff", 0.22) : f,
    m = i
      ? "#fff7e8"
      : a
        ? "#f6efe4"
        : o === "security"
          ? h
          : s === "night"
            ? "#8da2c9"
            : "#eaf2ff",
    y = dt(i, a),
    w = Math.min(0.38, e.height * 0.45),
    b = Math.min(0.12, e.height * 0.16),
    j = (x = w) =>
      [-1, 1].flatMap((k) =>
        [-1, 1].map((G) =>
          t.jsx(
            H,
            {
              presentation: r,
              position: [
                k * (e.width / 2 - 0.09),
                x / 2,
                G * (e.depth / 2 - 0.09),
              ],
              size: [0.08, x, 0.08],
              color: f,
            },
            `${k}-${G}`,
          ),
        ),
      );
  return t.jsx("group", {
    position: [
      e.position[0],
      baseElevation ?? normalizeFurnitureElevation(e.elevation),
      e.position[1],
    ],
    rotation: [0, -e.rotation, 0],
    scale: [1, 1, 1],
    children: t.jsxs(Gt, {
      children: [
        e.customModel?.source &&
          t.jsx(ConfiguredDeviceModel, { config: e.customModel }),
        e.kind === "sofa" &&
          t.jsxs(t.Fragment, {
            children: [
              t.jsx(H, {
                presentation: r,
                position: [0, e.height * 0.24, e.depth * 0.14],
                size: [e.width, e.height * 0.48, e.depth * 0.58],
                color: u,
              }),
              t.jsx(H, {
                presentation: r,
                position: [0, e.height * 0.68, e.depth * 0.34],
                size: [e.width, e.height * 0.36, e.depth * 0.16],
                color: h,
              }),
              t.jsx(H, {
                presentation: r,
                position: [-e.width * 0.45, e.height * 0.38, e.depth * 0.02],
                size: [e.width * 0.12, e.height * 0.44, e.depth * 0.58],
                color: u,
              }),
              t.jsx(H, {
                presentation: r,
                position: [e.width * 0.45, e.height * 0.38, e.depth * 0.02],
                size: [e.width * 0.12, e.height * 0.44, e.depth * 0.58],
                color: u,
              }),
              [-0.24, 0.24].map((x) =>
                t.jsx(
                  H,
                  {
                    presentation: r,
                    position: [x * e.width, e.height * 0.53, e.depth * 0.06],
                    size: [e.width * 0.43, e.height * 0.12, e.depth * 0.48],
                    color: m,
                    roughness: 0.5,
                  },
                  `seat-${x}`,
                ),
              ),
              [-0.25, 0.25].map((x) =>
                t.jsx(
                  H,
                  {
                    presentation: r,
                    position: [x * e.width, e.height * 0.7, e.depth * 0.22],
                    size: [e.width * 0.34, e.height * 0.22, e.depth * 0.12],
                    color: h,
                    roughness: 0.5,
                  },
                  `pillow-${x}`,
                ),
              ),
            ],
          }),
        e.kind === "bed" &&
          t.jsxs(t.Fragment, {
            children: [
              t.jsx(H, {
                presentation: r,
                position: [0, e.height * 0.2, 0],
                size: [e.width, e.height * 0.4, e.depth],
                color: u,
              }),
              t.jsx(H, {
                presentation: r,
                position: [0, e.height * 0.64, -e.depth * 0.43],
                size: [e.width + 0.04, e.height * 0.78, e.depth * 0.12],
                color: h,
              }),
              t.jsx(H, {
                presentation: r,
                position: [0, e.height * 0.48, e.depth * 0.12],
                size: [e.width * 0.9, e.height * 0.15, e.depth * 0.72],
                color: m,
              }),
              [-0.24, 0.24].map((x) =>
                t.jsx(
                  H,
                  {
                    presentation: r,
                    position: [x * e.width, e.height * 0.64, -e.depth * 0.21],
                    size: [e.width * 0.3, e.height * 0.18, e.depth * 0.18],
                    color: $(m, "#ffffff", 0.14),
                    roughness: 0.46,
                  },
                  `bed-pillow-${x}`,
                ),
              ),
              t.jsx(H, {
                presentation: r,
                position: [0, e.height * 0.56, e.depth * 0.22],
                size: [e.width * 0.72, e.height * 0.05, e.depth * 0.38],
                color: $(h, "#ffffff", 0.1),
                roughness: 0.48,
              }),
            ],
          }),
        e.kind === "dining_table" &&
          t.jsxs(t.Fragment, {
            children: [
              t.jsx(H, {
                presentation: r,
                position: [0, e.height - b / 2, 0],
                size: [e.width, b, e.depth],
                color: u,
                roughness: 0.5,
              }),
              t.jsx(H, {
                presentation: r,
                position: [0, e.height + b * 0.12, 0],
                size: [e.width * 0.82, b * 0.18, e.depth * 0.72],
                color: $(m, "#ffffff", 0.1),
                roughness: 0.42,
              }),
              j(e.height - b),
              [
                [-0.34, -0.72, Math.PI],
                [0.34, -0.72, Math.PI],
                [-0.34, 0.72, 0],
                [0.34, 0.72, 0],
              ].map(([x, k, G], C) =>
                t.jsxs(
                  "group",
                  {
                    position: [x * e.width, 0, k * e.depth],
                    rotation: [0, G, 0],
                    children: [
                      t.jsx(H, {
                        presentation: r,
                        position: [0, Math.max(0.1, e.height * 0.34), 0],
                        size: [e.width * 0.22, e.height * 0.18, e.depth * 0.2],
                        color: m,
                        roughness: 0.52,
                      }),
                      t.jsx(H, {
                        presentation: r,
                        position: [
                          0,
                          Math.max(0.1, e.height * 0.58),
                          e.depth * 0.09,
                        ],
                        size: [e.width * 0.22, e.height * 0.34, e.depth * 0.07],
                        color: h,
                        roughness: 0.54,
                      }),
                      [-1, 1].flatMap((O) =>
                        [-1, 1].map((N) =>
                          t.jsx(
                            H,
                            {
                              presentation: r,
                              position: [
                                O * e.width * 0.08,
                                Math.max(0.05, e.height * 0.18),
                                N * e.depth * 0.065,
                              ],
                              size: [0.035, e.height * 0.36, 0.035],
                              color: h,
                              roughness: 0.6,
                            },
                            `${O}-${N}`,
                          ),
                        ),
                      ),
                    ],
                  },
                  `chair-${C}`,
                ),
              ),
            ],
          }),
        e.kind === "desk" &&
          t.jsxs(t.Fragment, {
            children: [
              t.jsx(H, {
                presentation: r,
                position: [0, e.height - b / 2, 0],
                size: [e.width, b, e.depth],
                color: u,
                roughness: 0.5,
              }),
              j(e.height - b),
              t.jsx(H, {
                presentation: r,
                position: [0, e.height * 0.55, -e.depth * 0.4],
                size: [e.width * 0.48, e.height * 0.48, e.depth * 0.16],
                color: h,
              }),
              t.jsx(H, {
                presentation: r,
                position: [0, e.height + 0.14, -e.depth * 0.18],
                size: [e.width * 0.34, e.height * 0.36, 0.045],
                color: $(h, "#dff4ff", 0.28),
                roughness: 0.42,
              }),
              t.jsx(H, {
                presentation: r,
                position: [0, e.height + 0.015, -e.depth * 0.18],
                size: [0.06, 0.08, 0.05],
                color: h,
                roughness: 0.56,
              }),
            ],
          }),
        e.kind === "wardrobe" &&
          t.jsxs(t.Fragment, {
            children: [
              t.jsx(H, {
                presentation: r,
                position: [0, e.height / 2, 0],
                size: [e.width, e.height, e.depth],
                color: u,
              }),
              t.jsx(H, {
                presentation: r,
                position: [0, e.height * 0.54, -e.depth / 2 - 0.004],
                size: [0.035, e.height * 0.76, 0.02],
                color: h,
              }),
              [-0.25, 0.25].map((x) =>
                t.jsx(
                  H,
                  {
                    presentation: r,
                    position: [
                      x * e.width,
                      e.height * 0.54,
                      -e.depth / 2 - 0.012,
                    ],
                    size: [0.018, e.height * 0.68, 0.018],
                    color: h,
                    roughness: 0.48,
                  },
                  `wardrobe-panel-${x}`,
                ),
              ),
            ],
          }),
        e.kind === "cabinet" &&
          (() => {
            const segments = normalizeCabinetSegments(
                e.cabinetSegments,
                e.width,
                e.depth,
              ),
              points = segments.map((segment) => segment.start),
              shape = new Xa.Shape(),
              doorCount = normalizeCabinetDoorCount(e.cabinetDoorCount),
              segmentedHeights = normalizeSegmentedCabinetHeights(
                e.height,
                e.cabinetSectionOneHeight,
                e.cabinetHollowHeight,
              ),
              cabinetDepth = cabinetFrontDepth(
                segments,
                e.cabinetDepth ?? e.depth,
              ),
              upperDepth = normalizeCabinetUpperDepth(
                e.cabinetUpperDepth,
                cabinetDepth,
              ),
              upperSegments = resizeCabinetDepthFromBack(
                segments,
                upperDepth,
                cabinetDepth,
              ),
              upperPoints = upperSegments.map((segment) => segment.start),
              upperShape = new Xa.Shape(),
              connectorPanels =
                e.cabinetStyle === "segmented"
                  ? createSegmentedCabinetConnectorPanels(segments, {
                      upperSegments,
                      sectionOneHeight: segmentedHeights.sectionOneHeight,
                      hollowHeight: segmentedHeights.hollowHeight,
                    })
                  : [],
              cabinetBodyColor = i
                ? qe(u)
                : a
                  ? $(qe(u), "#fff3df", 0.2)
                  : r
                    ? $(qe(u), "#eef5ff", 0.24)
                    : qe(u),
              cabinetTopColor = i
                ? qe(h)
                : a
                  ? $(qe(h), "#fff3df", 0.2)
                  : r
                    ? $(qe(h), "#eef5ff", 0.24)
                    : qe(h);
            shape.moveTo(points[0][0], -points[0][1]);
            points
              .slice(1)
              .forEach((point) => shape.lineTo(point[0], -point[1]));
            shape.closePath();
            upperShape.moveTo(upperPoints[0][0], -upperPoints[0][1]);
            upperPoints
              .slice(1)
              .forEach((point) => upperShape.lineTo(point[0], -point[1]));
            upperShape.closePath();
            const bodyRanges =
                e.cabinetStyle === "segmented"
                  ? [
                      {
                        key: "lower",
                        bottom: 0,
                        height: segmentedHeights.sectionOneHeight,
                      },
                      {
                        key: "upper",
                        bottom:
                          segmentedHeights.sectionOneHeight +
                          segmentedHeights.hollowHeight,
                        height: segmentedHeights.sectionTwoHeight,
                        shape: upperShape,
                      },
                    ]
                  : [{ key: "body", bottom: 0, height: e.height }],
              frontSegments = segments.filter((segment) => segment.isDoorFront),
              frontBox = (key, position, size, color = h, roughness = 0.48) =>
                t.jsx(
                  H,
                  {
                    presentation: r,
                    position,
                    size,
                    color,
                    roughness,
                  },
                  key,
                ),
              renderFront = (segment) => {
                const getFrontMetrics = (sourceSegment = segment) => {
                    const start = sourceSegment.start,
                      end = sourceSegment.end,
                      dx = end[0] - start[0],
                      dz = end[1] - start[1],
                      length = Math.max(0.001, Math.hypot(dx, dz)),
                      angle = Math.atan2(dz, dx),
                      outward = [dz / length, -dx / length];
                    return {
                      angle,
                      center: [
                        (start[0] + end[0]) / 2 + outward[0] * 0.014,
                        0,
                        (start[1] + end[1]) / 2 + outward[1] * 0.014,
                      ],
                      faceWidth: Math.max(0.12, length * 0.94),
                    };
                  },
                  lowerFront = getFrontMetrics(),
                  faceWidth = lowerFront.faceWidth,
                  panelWidth = (width, count = doorCount) =>
                    Math.max(0.025, width / count - 0.018),
                  style = e.cabinetStyle ?? "base";
                let details, upperDetails, upperFront;
                if (style === "shelf") {
                  details = [
                    ...[0.18, 0.38, 0.58, 0.78].map((ratio, index) =>
                      frontBox(
                        `shelf-${index}`,
                        [0, e.height * ratio, 0],
                        [faceWidth, 0.026, 0.05],
                        h,
                      ),
                    ),
                    ...Array.from(
                      { length: Math.max(0, doorCount - 1) },
                      (_, index) =>
                        frontBox(
                          `shelf-divider-${index}`,
                          [
                            ((index + 1) / doorCount - 0.5) * faceWidth,
                            e.height * 0.5,
                            0,
                          ],
                          [0.026, e.height * 0.9, 0.05],
                          h,
                        ),
                    ),
                  ];
                } else if (style === "shoe") {
                  details = [0.24, 0.42, 0.6, 0.78].flatMap((ratio, index) => [
                    ...Array.from({ length: doorCount }, (_, doorIndex) =>
                      frontBox(
                        `shoe-panel-${index}-${doorIndex}`,
                        [
                          ((doorIndex + 0.5) / doorCount - 0.5) * faceWidth,
                          e.height * ratio,
                          0,
                        ],
                        [panelWidth(faceWidth), e.height * 0.16, 0.022],
                        u,
                        0.56,
                      ),
                    ),
                    frontBox(
                      `shoe-line-${index}`,
                      [0, e.height * (ratio + 0.075), -0.016],
                      [faceWidth * 0.72, 0.012, 0.014],
                      m,
                    ),
                  ]);
                } else if (style === "bedside") {
                  details = [0.34, 0.68].flatMap((ratio, index) => [
                    ...Array.from({ length: doorCount }, (_, doorIndex) =>
                      frontBox(
                        `bedside-drawer-${index}-${doorIndex}`,
                        [
                          ((doorIndex + 0.5) / doorCount - 0.5) * faceWidth,
                          e.height * ratio,
                          0,
                        ],
                        [panelWidth(faceWidth), e.height * 0.28, 0.022],
                        u,
                      ),
                    ),
                    frontBox(
                      `bedside-handle-${index}`,
                      [0, e.height * (ratio + 0.055), -0.018],
                      [faceWidth * 0.28, 0.018, 0.014],
                      m,
                    ),
                  ]);
                } else if (style === "tv") {
                  details = Array.from({ length: doorCount }, (_, index) =>
                    frontBox(
                      `tv-drawer-${index}`,
                      [
                        ((index + 0.5) / doorCount - 0.5) * faceWidth,
                        e.height * 0.42,
                        0,
                      ],
                      [panelWidth(faceWidth), e.height * 0.32, 0.022],
                      u,
                    ),
                  );
                } else if (style === "tall") {
                  details = Array.from({ length: doorCount }, (_, index) =>
                    frontBox(
                      `tall-panel-${index}`,
                      [
                        ((index + 0.5) / doorCount - 0.5) * faceWidth,
                        e.height * 0.52,
                        0,
                      ],
                      [panelWidth(faceWidth), e.height * 0.9, 0.022],
                      u,
                    ),
                  );
                } else if (style === "segmented") {
                  const upperBottom =
                    segmentedHeights.sectionOneHeight +
                    segmentedHeights.hollowHeight;
                  upperFront = getFrontMetrics(
                    upperSegments.find(
                      (candidate) => candidate.id === segment.id,
                    ) ?? segment,
                  );
                  details = Array.from({ length: doorCount }, (_, index) =>
                    frontBox(
                      `segmented-lower-${index}`,
                      [
                        ((index + 0.5) / doorCount - 0.5) * faceWidth,
                        segmentedHeights.sectionOneHeight / 2,
                        0,
                      ],
                      [
                        panelWidth(faceWidth),
                        Math.max(
                          0.04,
                          segmentedHeights.sectionOneHeight - 0.04,
                        ),
                        0.022,
                      ],
                      u,
                    ),
                  );
                  upperDetails = Array.from({ length: doorCount }, (_, index) =>
                    frontBox(
                      `segmented-upper-${index}`,
                      [
                        ((index + 0.5) / doorCount - 0.5) *
                          upperFront.faceWidth,
                        upperBottom + segmentedHeights.sectionTwoHeight / 2,
                        0,
                      ],
                      [
                        panelWidth(upperFront.faceWidth),
                        Math.max(
                          0.04,
                          segmentedHeights.sectionTwoHeight - 0.04,
                        ),
                        0.022,
                      ],
                      u,
                    ),
                  );
                } else {
                  const divisions = doorCount;
                  details = Array.from({ length: divisions }, (_, index) =>
                    frontBox(
                      `${style}-panel-${index}`,
                      [
                        ((index + 0.5) / divisions - 0.5) * faceWidth,
                        e.height * 0.52,
                        0,
                      ],
                      [
                        panelWidth(faceWidth, divisions),
                        e.height * 0.82,
                        0.022,
                      ],
                      u,
                    ),
                  );
                }
                return t.jsxs(
                  t.Fragment,
                  {
                    children: [
                      t.jsx("group", {
                        position: lowerFront.center,
                        rotation: [0, -lowerFront.angle, 0],
                        children: details,
                      }),
                      upperDetails &&
                        t.jsx("group", {
                          position: upperFront.center,
                          rotation: [0, -upperFront.angle, 0],
                          children: upperDetails,
                        }),
                    ],
                  },
                  `cabinet-front-${segment.id}`,
                );
              };
            return t.jsxs(t.Fragment, {
              children: [
                bodyRanges.map((part) =>
                  t.jsxs(
                    "mesh",
                    {
                      rotation: [-Math.PI / 2, 0, 0],
                      position: [0, part.bottom, 0],
                      castShadow: !0,
                      receiveShadow: !0,
                      children: [
                        t.jsx(CabinetBodyGeometry, {
                          points: part.key === "upper" ? upperPoints : points,
                          height: part.height,
                        }),
                        t.jsx("meshStandardMaterial", {
                          color: cabinetBodyColor,
                          roughness: a ? 0.64 : r ? 0.44 : 0.58,
                          metalness: a ? 0.006 : 0.018,
                          side: Xa.DoubleSide,
                        }),
                      ],
                    },
                    part.key,
                  ),
                ),
                connectorPanels.map((panel) => {
                  const profile = new Xa.Shape();
                  if (panel.frontEnd === "start") {
                    profile.moveTo(panel.lowerFrontX, 0);
                    profile.lineTo(panel.backX, 0);
                    profile.lineTo(panel.backX, panel.height);
                    profile.lineTo(panel.upperFrontX, panel.height);
                    profile.bezierCurveTo(
                      panel.curveX,
                      panel.height,
                      panel.curveX,
                      0,
                      panel.lowerFrontX,
                      0,
                    );
                  } else if (panel.frontEnd === "end") {
                    profile.moveTo(panel.backX, 0);
                    profile.lineTo(panel.lowerFrontX, 0);
                    profile.bezierCurveTo(
                      panel.curveX,
                      0,
                      panel.curveX,
                      panel.height,
                      panel.upperFrontX,
                      panel.height,
                    );
                    profile.lineTo(panel.backX, panel.height);
                  } else {
                    profile.moveTo(-panel.length / 2, 0);
                    profile.lineTo(panel.length / 2, 0);
                    profile.lineTo(panel.length / 2, panel.height);
                    profile.lineTo(-panel.length / 2, panel.height);
                  }
                  profile.closePath();
                  return t.jsx(
                    "group",
                    {
                      position: [
                        panel.center[0],
                        panel.bottom,
                        panel.center[1],
                      ],
                      rotation: [0, -panel.angle, 0],
                      children: t.jsxs("mesh", {
                        position: [0, 0, -panel.thickness / 2],
                        castShadow: !0,
                        receiveShadow: !0,
                        children: [
                          t.jsx("extrudeGeometry", {
                            args: [
                              profile,
                              {
                                depth: panel.thickness,
                                bevelEnabled: !1,
                                curveSegments: 24,
                              },
                            ],
                          }),
                          t.jsx("meshStandardMaterial", {
                            color: cabinetBodyColor,
                            roughness: a ? 0.64 : r ? 0.44 : 0.58,
                            metalness: a ? 0.006 : 0.018,
                            side: Xa.DoubleSide,
                          }),
                        ],
                      }),
                    },
                    `segmented-connector-${panel.id}`,
                  );
                }),
                e.cabinetStyle === "segmented" &&
                  segments
                    .filter((segment) => segment.isDoorFront)
                    .map((segment) => {
                      const dx = segment.end[0] - segment.start[0],
                        dz = segment.end[1] - segment.start[1],
                        length = Math.max(0.001, Math.hypot(dx, dz)),
                        angle = Math.atan2(dz, dx),
                        midpoint = [
                          (segment.start[0] + segment.end[0]) / 2,
                          (segment.start[1] + segment.end[1]) / 2,
                        ],
                        shelfLayout = createSegmentedCabinetShelfLayout({
                          length,
                          cabinetDepth,
                          sectionOneHeight: segmentedHeights.sectionOneHeight,
                        }),
                        halfLength = shelfLayout.length / 2,
                        frontY = shelfLayout.frontLip,
                        backY = -shelfLayout.depth,
                        radius = Math.min(
                          shelfLayout.radius,
                          halfLength,
                          (shelfLayout.depth + shelfLayout.frontLip) / 2,
                        ),
                        shelfShape = new Xa.Shape();
                      shelfShape.moveTo(-halfLength, backY);
                      shelfShape.lineTo(halfLength, backY);
                      shelfShape.lineTo(halfLength, frontY - radius);
                      shelfShape.quadraticCurveTo(
                        halfLength,
                        frontY,
                        halfLength - radius,
                        frontY,
                      );
                      shelfShape.lineTo(-halfLength + radius, frontY);
                      shelfShape.quadraticCurveTo(
                        -halfLength,
                        frontY,
                        -halfLength,
                        frontY - radius,
                      );
                      shelfShape.closePath();
                      return t.jsx(
                        "group",
                        {
                          position: [
                            midpoint[0],
                            shelfLayout.bottom,
                            midpoint[1],
                          ],
                          rotation: [0, -angle, 0],
                          children: [
                            t.jsxs("mesh", {
                              rotation: [-Math.PI / 2, 0, 0],
                              castShadow: !0,
                              receiveShadow: !0,
                              children: [
                                t.jsx("extrudeGeometry", {
                                  args: [
                                    shelfShape,
                                    {
                                      depth: shelfLayout.thickness,
                                      bevelEnabled: !1,
                                      curveSegments: 20,
                                    },
                                  ],
                                }),
                                t.jsx("meshStandardMaterial", {
                                  color: cabinetBodyColor,
                                  roughness: a ? 0.64 : r ? 0.44 : 0.58,
                                  metalness: a ? 0.006 : 0.018,
                                  side: Xa.DoubleSide,
                                }),
                              ],
                            }),
                          ],
                        },
                        `segmented-rounded-shelf-${segment.id}`,
                      );
                    }),
                t.jsxs("mesh", {
                  rotation: [-Math.PI / 2, 0, 0],
                  position: [0, e.height + 0.002, 0],
                  children: [
                    t.jsx("shapeGeometry", {
                      args: [
                        e.cabinetStyle === "segmented" ? upperShape : shape,
                      ],
                    }),
                    t.jsx("meshStandardMaterial", {
                      color: cabinetTopColor,
                      roughness: a ? 0.64 : r ? 0.44 : 0.5,
                      metalness: a ? 0.006 : 0.018,
                      side: Xa.DoubleSide,
                    }),
                  ],
                }),
                frontSegments.map(renderFront),
              ],
            });
          })(),
        (e.kind === "sideboard" ||
          e.kind === "shoe_cabinet" ||
          e.kind === "nightstand") &&
          t.jsxs(t.Fragment, {
            children: [
              t.jsx(H, {
                presentation: r,
                position: [0, e.height * 0.46, 0],
                size: [e.width, e.height * 0.88, e.depth],
                color: u,
              }),
              t.jsx(H, {
                presentation: r,
                position: [0, e.height + 0.025, 0],
                size: [e.width + 0.035, 0.05, e.depth + 0.035],
                color: h,
                roughness: 0.48,
              }),
              t.jsx(H, {
                presentation: r,
                position: [0, e.height * 0.54, -e.depth / 2 - 0.012],
                size: [e.width * 0.92, 0.014, 0.016],
                color: h,
                roughness: 0.48,
              }),
              e.kind === "nightstand"
                ? t.jsx(H, {
                    presentation: r,
                    position: [0, e.height * 0.62, -e.depth / 2 - 0.016],
                    size: [e.width * 0.36, e.height * 0.08, 0.014],
                    color: m,
                    roughness: 0.5,
                  })
                : [-0.25, 0.25].map((x) =>
                    t.jsx(
                      H,
                      {
                        presentation: r,
                        position: [
                          x * e.width,
                          e.height * 0.52,
                          -e.depth / 2 - 0.016,
                        ],
                        size: [0.014, e.height * 0.58, 0.016],
                        color: h,
                        roughness: 0.48,
                      },
                      `storage-line-${x}`,
                    ),
                  ),
              e.kind === "shoe_cabinet" &&
                [0.32, 0.52, 0.72].map((x) =>
                  t.jsx(
                    H,
                    {
                      presentation: r,
                      position: [0, e.height * x, -e.depth / 2 - 0.02],
                      size: [e.width * 0.74, 0.012, 0.014],
                      color: m,
                      roughness: 0.55,
                    },
                    `shoe-slat-${x}`,
                  ),
                ),
              j(Math.min(0.12, e.height * 0.22)),
            ],
          }),
        e.kind === "tv_stand" &&
          t.jsxs(t.Fragment, {
            children: [
              t.jsx(H, {
                presentation: r,
                position: [0, e.height * 0.4, 0],
                size: [e.width, e.height * 0.72, e.depth],
                color: l,
              }),
              t.jsx(H, {
                presentation: r,
                position: [0, e.height * 0.84, 0],
                size: [e.width + 0.07, e.height * 0.12, e.depth + 0.045],
                color: f,
                roughness: 0.48,
              }),
              [-0.28, 0, 0.28].map((x) =>
                t.jsx(
                  H,
                  {
                    presentation: r,
                    position: [
                      x * e.width,
                      e.height * 0.5,
                      -e.depth / 2 - 0.006,
                    ],
                    size: [e.width * 0.22, e.height * 0.18, 0.018],
                    color: f,
                    roughness: 0.5,
                  },
                  x,
                ),
              ),
              t.jsx(H, {
                presentation: r,
                position: [0, e.height * 0.5, -e.depth / 2 - 0.018],
                size: [0.018, e.height * 0.44, 0.018],
                color: h,
                roughness: 0.48,
              }),
              j(Math.min(0.14, e.height * 0.28)),
            ],
          }),
        e.kind === "kitchen_island" &&
          t.jsxs(t.Fragment, {
            children: [
              t.jsx(H, {
                presentation: r,
                position: [0, e.height * 0.42, 0],
                size: [e.width * 0.92, e.height * 0.84, e.depth * 0.88],
                color: l,
              }),
              t.jsx(H, {
                presentation: r,
                position: [0, e.height + 0.035, 0],
                size: [e.width + 0.08, 0.07, e.depth + 0.08],
                color: f,
                roughness: 0.44,
              }),
              t.jsxs("mesh", {
                position: [e.width * 0.23, e.height + 0.076, -e.depth * 0.12],
                receiveShadow: !0,
                children: [
                  t.jsx("boxGeometry", {
                    args: [e.width * 0.2, 0.012, e.depth * 0.22],
                  }),
                  t.jsx("meshPhysicalMaterial", {
                    color: s === "night" ? "#7f95a7" : "#eef6f8",
                    roughness: 0.22,
                    metalness: 0.025,
                    clearcoat: 0.32,
                    clearcoatRoughness: 0.54,
                    transparent: !0,
                    opacity: o === "security" ? 0.46 : 0.78,
                  }),
                  t.jsx(Y, {
                    color: y.color,
                    threshold: y.threshold,
                    opacity: y.opacity * 0.65,
                    transparent: !0,
                  }),
                ],
              }),
              [-0.08, 0.08].map((x) =>
                t.jsxs(
                  "mesh",
                  {
                    position: [
                      e.width * -0.18 + x,
                      e.height + 0.083,
                      e.depth * 0.12,
                    ],
                    rotation: [-Math.PI / 2, 0, 0],
                    children: [
                      t.jsx("ringGeometry", { args: [0.055, 0.075, 24] }),
                      t.jsx("meshBasicMaterial", {
                        color: s === "night" ? "#a9bbc8" : "#9fb0b8",
                        transparent: !0,
                        opacity: 0.48,
                        toneMapped: !1,
                      }),
                    ],
                  },
                  x,
                ),
              ),
            ],
          }),
        e.kind === "coffee_table" &&
          t.jsxs(t.Fragment, {
            children: [
              t.jsxs("mesh", {
                position: [0, e.height, 0],
                castShadow: !0,
                receiveShadow: !0,
                children: [
                  t.jsx("boxGeometry", {
                    args: [e.width, Math.min(0.06, e.height * 0.18), e.depth],
                  }),
                  t.jsx("meshPhysicalMaterial", {
                    color: s === "night" ? "#8fa5b4" : "#f0f8fb",
                    roughness: 0.2,
                    metalness: 0.01,
                    clearcoat: 0.34,
                    clearcoatRoughness: 0.5,
                    transparent: !0,
                    opacity: o === "security" ? 0.42 : 0.68,
                  }),
                  t.jsx(Y, {
                    color: y.color,
                    threshold: y.threshold,
                    opacity: y.opacity * 0.7,
                    transparent: !0,
                  }),
                ],
              }),
              t.jsx(H, {
                presentation: r,
                position: [0, e.height * 0.48, 0],
                size: [e.width * 0.56, e.height * 0.16, e.depth * 0.38],
                color: l,
                roughness: 0.56,
              }),
              j(Math.max(0.16, e.height * 0.72)),
            ],
          }),
        e.kind === "side_table" &&
          t.jsxs(t.Fragment, {
            children: [
              t.jsxs("mesh", {
                position: [0, e.height, 0],
                castShadow: !0,
                receiveShadow: !0,
                children: [
                  t.jsx("cylinderGeometry", {
                    args: [
                      e.width * 0.36,
                      e.width * 0.4,
                      Math.min(0.055, e.height * 0.16),
                      36,
                    ],
                  }),
                  t.jsx("meshPhysicalMaterial", {
                    color: s === "night" ? "#8fa5b4" : "#f0f8fb",
                    roughness: 0.22,
                    metalness: 0.01,
                    clearcoat: 0.32,
                    clearcoatRoughness: 0.52,
                    transparent: !0,
                    opacity: o === "security" ? 0.42 : 0.7,
                  }),
                  t.jsx(Y, {
                    color: y.color,
                    threshold: y.threshold,
                    opacity: y.opacity * 0.7,
                    transparent: !0,
                  }),
                ],
              }),
              t.jsxs("mesh", {
                position: [0, e.height * 0.5, 0],
                castShadow: !0,
                children: [
                  t.jsx("cylinderGeometry", {
                    args: [0.035, 0.045, e.height * 0.82, 18],
                  }),
                  t.jsx("meshPhysicalMaterial", {
                    color: h,
                    roughness: 0.44,
                    metalness: 0.025,
                    clearcoat: 0.22,
                    clearcoatRoughness: 0.62,
                  }),
                  t.jsx(Y, {
                    color: y.color,
                    threshold: y.threshold,
                    opacity: y.opacity * 0.58,
                    transparent: !0,
                  }),
                ],
              }),
              t.jsx(H, {
                presentation: r,
                position: [0, e.height * 0.16, 0],
                size: [e.width * 0.54, e.height * 0.12, e.depth * 0.54],
                color: h,
                roughness: 0.56,
              }),
            ],
          }),
        e.kind === "vanity_mirror_cabinet" &&
          t.jsx(VanityMirrorCabinetFixture, { item: e, theme: s }),
        e.kind === "shower_enclosure" &&
          t.jsx(ShowerEnclosureFixture, { item: e, theme: s }),
        e.kind === "shower_fixture" &&
          t.jsx(ShowerFixture, { item: e, theme: s }),
        e.kind === "toilet" && t.jsx(ToiletFixture, { item: e, theme: s }),
        !1,
        !1,
        !1,
        e.kind === "gas_stove" &&
          t.jsxs(t.Fragment, {
            children: [
              t.jsx(D, {
                position: [0, e.height * 0.32, 0],
                args: [e.width * 0.94, e.height * 0.64, e.depth * 0.92],
                radius: 0.035,
                smoothness: 4,
                castShadow: !0,
                receiveShadow: !0,
                children: t.jsx("meshPhysicalMaterial", {
                  color: h,
                  roughness: 0.3,
                  metalness: 0.25,
                }),
              }),
              t.jsx(D, {
                position: [0, e.height * 0.72, 0],
                args: [e.width, e.height * 0.22, e.depth],
                radius: 0.012,
                smoothness: 5,
                castShadow: !0,
                receiveShadow: !0,
                children: t.jsx("meshPhysicalMaterial", {
                  color: "#26343b",
                  roughness: 0.2,
                  metalness: 0.18,
                  clearcoat: 0.35,
                  clearcoatRoughness: 0.32,
                }),
              }),
              [-0.24, 0.24].map((x) =>
                t.jsxs(
                  "group",
                  {
                    position: [x * e.width, e.height * 0.84, 0],
                    children: [
                      t.jsxs("mesh", {
                        rotation: [-Math.PI / 2, 0, 0],
                        children: [
                          t.jsx("torusGeometry", {
                            args: [e.width * 0.14, 0.018, 10, 28],
                          }),
                          t.jsx("meshPhysicalMaterial", {
                            color: "#8d9ba0",
                            roughness: 0.2,
                            metalness: 0.58,
                          }),
                        ],
                      }),
                      t.jsxs("mesh", {
                        rotation: [-Math.PI / 2, 0, 0],
                        children: [
                          t.jsx("cylinderGeometry", {
                            args: [e.width * 0.105, e.width * 0.105, 0.012, 24],
                          }),
                          t.jsx("meshBasicMaterial", { color: "#141d21" }),
                        ],
                      }),
                    ],
                  },
                  x,
                ),
              ),
              [-0.2, 0.2].map((x) =>
                t.jsxs(
                  "mesh",
                  {
                    position: [x * e.width, e.height * 0.78, e.depth * 0.47],
                    rotation: [Math.PI / 2, 0, 0],
                    children: [
                      t.jsx("cylinderGeometry", {
                        args: [0.035, 0.035, 0.025, 20],
                      }),
                      t.jsx("meshPhysicalMaterial", {
                        color: "#b8c3c6",
                        roughness: 0.18,
                        metalness: 0.7,
                      }),
                    ],
                  },
                  x,
                ),
              ),
            ],
          }),
        e.kind === "bookshelf" &&
          t.jsxs(t.Fragment, {
            children: [
              t.jsx(H, {
                presentation: r,
                position: [0, e.height / 2, e.depth * 0.42],
                size: [e.width, e.height, e.depth * 0.12],
                color: f,
              }),
              t.jsx(H, {
                presentation: r,
                position: [-e.width / 2 + 0.035, e.height / 2, 0],
                size: [0.07, e.height, e.depth],
                color: l,
              }),
              t.jsx(H, {
                presentation: r,
                position: [e.width / 2 - 0.035, e.height / 2, 0],
                size: [0.07, e.height, e.depth],
                color: l,
              }),
              [0.18, 0.38, 0.58, 0.78].map((x) =>
                t.jsx(
                  H,
                  {
                    presentation: r,
                    position: [0, e.height * x, 0],
                    size: [e.width, 0.055, e.depth],
                    color: l,
                    roughness: 0.56,
                  },
                  x,
                ),
              ),
              [-0.28, -0.1, 0.1, 0.28].map((x, k) =>
                t.jsx(
                  H,
                  {
                    presentation: r,
                    position: [
                      x * e.width,
                      e.height * (0.26 + (k % 2) * 0.2),
                      -e.depth * 0.08,
                    ],
                    size: [e.width * 0.1, e.height * 0.16, e.depth * 0.42],
                    color: k % 2 ? "#8198a8" : "#9f8d7f",
                    roughness: 0.66,
                  },
                  x,
                ),
              ),
            ],
          }),
      ],
    }),
  });
}
function Rs(e) {
  const s = e.flatMap((a) => a.walls.flatMap((c) => [c.start, c.end])),
    r = s.length ? Math.min(...s.map((a) => a[0])) : 0,
    o = s.length ? Math.max(...s.map((a) => a[0])) : 8,
    n = s.length ? Math.min(...s.map((a) => a[1])) : 0,
    i = s.length ? Math.max(...s.map((a) => a[1])) : 6;
  return { minX: r, maxX: o, minZ: n, maxZ: i };
}
const Ge = 1e-4,
  be = (e) => Math.round(e * 1e4) / 1e4,
  ce = (e) => `${e[0].toFixed(4)},${e[1].toFixed(4)}`,
  Oe = (e, s) => {
    const r = ce(e),
      o = ce(s);
    return r < o ? `${r}|${o}` : `${o}|${r}`;
  };
function Ut(e) {
  const { minX: s, maxX: r, minZ: o, maxZ: n } = Rs(e);
  return [
    [s, o],
    [r, o],
    [r, n],
    [s, n],
  ];
}
function qt(e, s, r, o) {
  if (Math.abs(o - r) <= Ge) return;
  const n = be(s),
    i = n.toFixed(4),
    a = e.get(i) ?? { coord: n, intervals: [] };
  (a.intervals.push({ from: be(Math.min(r, o)), to: be(Math.max(r, o)) }),
    e.set(i, a));
}
function Yt(e, s) {
  const r = [];
  for (const o of e.values()) {
    const n = [
      ...new Set(
        o.intervals.flatMap((i) => [i.from, i.to]).map((i) => i.toFixed(4)),
      ),
    ]
      .map(Number)
      .sort((i, a) => i - a);
    for (let i = 0; i < n.length - 1; i += 1) {
      const a = n[i],
        c = n[i + 1];
      c - a <= Ge ||
        o.intervals.filter((f) => f.from <= a + Ge && f.to >= c - Ge).length !==
          1 ||
        r.push(
          s
            ? { start: [a, o.coord], end: [c, o.coord] }
            : { start: [o.coord, a], end: [o.coord, c] },
        );
    }
  }
  return r;
}
function Fs(e) {
  const s = new Map(),
    r = new Map(),
    o = new Map();
  for (const l of e.flatMap((f) => f.rooms))
    for (let f = 0; f < l.polygon.length; f += 1) {
      const u = [be(l.polygon[f][0]), be(l.polygon[f][1])],
        h = [
          be(l.polygon[(f + 1) % l.polygon.length][0]),
          be(l.polygon[(f + 1) % l.polygon.length][1]),
        ];
      if (Math.abs(u[1] - h[1]) <= Ge) {
        qt(s, (u[1] + h[1]) / 2, u[0], h[0]);
        continue;
      }
      if (Math.abs(u[0] - h[0]) <= Ge) {
        qt(r, (u[0] + h[0]) / 2, u[1], h[1]);
        continue;
      }
      const m = Oe(u, h),
        y = o.get(m);
      y ? (y.count += 1) : o.set(m, { start: u, end: h, count: 1 });
    }
  const n = [
    ...Yt(s, !0),
    ...Yt(r, !1),
    ...[...o.values()].filter((l) => l.count === 1),
  ];
  if (!n.length) return [Ut(e)];
  const i = new Set(n.map((l) => Oe(l.start, l.end))),
    a = new Map();
  for (const l of n) {
    const f = ce(l.start),
      u = ce(l.end);
    (a.set(f, [...(a.get(f) ?? []), l.end]),
      a.set(u, [...(a.get(u) ?? []), l.start]));
  }
  const c = [];
  for (const l of n) {
    const f = Oe(l.start, l.end);
    if (!i.has(f)) continue;
    const u = [l.start, l.end];
    i.delete(f);
    let h = l.end,
      m = 0;
    for (; ce(h) !== ce(l.start) && m < n.length + 4;) {
      m += 1;
      const y = ce(h),
        w = ce(u[u.length - 2]),
        b = (a.get(y) ?? []).filter((x) => i.has(Oe(h, x))),
        j = b.find((x) => ce(x) !== w) ?? b[0];
      if (!j) break;
      (i.delete(Oe(h, j)), u.push(j), (h = j));
    }
    (u.length > 3 && ce(u.at(-1) ?? u[0]) === ce(u[0]) && u.pop(),
      u.length >= 3 && c.push(u));
  }
  return c.length ? c : [Ut(e)];
}
function li(e) {
  return (
    e.reduce((s, r, o) => {
      const n = e[(o + 1) % e.length];
      return s + r[0] * n[1] - n[0] * r[1];
    }, 0) / 2
  );
}
function di(e) {
  const s = li(e) < 0 ? [...e].reverse() : e,
    r = new Le(),
    o = s[0];
  r.moveTo(o[0], -o[1]);
  for (const n of s.slice(1)) r.lineTo(n[0], -n[1]);
  return (r.closePath(), r);
}
function hi({ floors: e, theme: s, presentationMode: r }) {
  const o = ue(),
    n = o === "cartoon",
    i = o === "cream",
    a = ge(s, r),
    c = L.useMemo(() => Fs(e).map(di), [e]),
    l =
      n || i
        ? a.foundation
        : $(
            a.foundation,
            a.ground,
            s === "night" || r === "shade" || r === "security" ? 0.16 : 0.28,
          ),
    f = n ? "#41506a" : i ? "#877c6c" : $(a.foundation, "#172942", 0.28);
  return t.jsx("group", {
    position: [0, -0.155, 0],
    renderOrder: -2,
    children: c.map((u, h) =>
      t.jsxs(
        "mesh",
        {
          rotation: [-Math.PI / 2, 0, 0],
          receiveShadow: !0,
          castShadow: !0,
          children: [
            t.jsx("extrudeGeometry", {
              args: [
                u,
                {
                  depth: 0.16,
                  bevelEnabled: !0,
                  bevelSize: 0.026,
                  bevelThickness: 0.012,
                  bevelSegments: 2,
                  curveSegments: 2,
                },
              ],
            }),
            n
              ? t.jsx("meshToonMaterial", { color: l })
              : t.jsx("meshPhysicalMaterial", {
                  color: l,
                  roughness: i ? 0.68 : 0.42,
                  metalness: i ? 0.012 : 0.035,
                  clearcoat: i ? 0.05 : 0.24,
                  clearcoatRoughness: i ? 0.86 : 0.58,
                }),
            t.jsx(Y, {
              color: f,
              threshold: 18,
              opacity: n ? 0.54 : i ? 0.3 : 0.34,
              transparent: !0,
            }),
          ],
        },
        h,
      ),
    ),
  });
}
function ui({ floors: e, theme: s, presentationMode: r }) {
  const n = ue() === "cream",
    i = ge(s, r),
    a = s === "night" || r === "shade" || r === "security",
    c = n ? 0.48 : 0.58,
    l = -0.148,
    f = n
      ? $(i.ground, "#fff6de", 0.54)
      : a
        ? $(i.glow, "#d7e9ff", 0.46)
        : $(i.glow, "#f3fbff", 0.58),
    u = n ? 0.18 : a ? 0.38 : 0.32,
    h = L.useMemo(() => {
      const y = Fs(e),
        w = [];
      for (const [b, j] of y.entries())
        for (let x = 0; x < j.length; x += 1) {
          const k = j[x],
            G = j[(x + 1) % j.length],
            C = G[0] - k[0],
            O = G[1] - k[1],
            N = Math.hypot(C, O);
          N <= 0.02 ||
            w.push({
              id: `${b}-${x}`,
              center: [(k[0] + G[0]) / 2, l - c / 2, (k[1] + G[1]) / 2],
              length: N,
              angle: Math.atan2(O, C),
            });
        }
      return w;
    }, [e, c]),
    m = L.useMemo(
      () => ({ uColor: { value: new Re(f) }, uOpacity: { value: u } }),
      [f, u],
    );
  return t.jsx("group", {
    renderOrder: -5,
    children: h.map((y) =>
      t.jsxs(
        "mesh",
        {
          position: y.center,
          rotation: [0, -y.angle, 0],
          renderOrder: -5,
          children: [
            t.jsx("planeGeometry", { args: [y.length, c, 1, 1] }),
            t.jsx("shaderMaterial", {
              uniforms: m,
              vertexShader: `
              varying float vTopFade;
              void main() {
                vTopFade = clamp(position.y / ${c.toFixed(4)} + 0.5, 0.0, 1.0);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
              }
            `,
              fragmentShader: `
              uniform vec3 uColor;
              uniform float uOpacity;
              varying float vTopFade;
              void main() {
                float verticalFade = smoothstep(0.0, 1.0, vTopFade);
                float hotTop = smoothstep(0.7, 1.0, vTopFade);
                float alpha = uOpacity * pow(verticalFade, 2.8);
                if (alpha < 0.01) discard;
                vec3 color = mix(uColor * 0.7, vec3(1.0), hotTop * 0.36);
                gl_FragColor = vec4(color, alpha);
              }
            `,
              side: J,
              blending: q,
              depthWrite: !1,
              depthTest: !0,
              transparent: !0,
              toneMapped: !1,
            }),
          ],
        },
        y.id,
      ),
    ),
  });
}
function fi({
  floor: e,
  project: s,
  entities: r,
  wallMode: o,
  showDevices: n,
  showLabels: i,
  elevation: a,
  theme: c = "day",
  presentation: l = !1,
  presentationMode: f = "overview",
  wallThicknessScale: u = 1,
  focusedRoom: h,
  showRoomBadges: m = !1,
  onRoomFocus: y,
  onRoomLightingAction: w,
  onRoomShadeAction: b,
  onRoomSecuritySelect: j,
  onEntitySelect: x,
  onDeviceSelect: k,
  hoveredRoomKey: G,
  setHoveredRoomKey: C,
}) {
  const connected = Ie((state) => state.connection?.connected === true);
  const O = L.useRef(null),
    { invalidate: N } = tt();
  (L.useEffect(() => {
    N();
  }, [a, N]),
    re((S, B) => {
      if (!O.current) return;
      const R = V.damp(O.current.position.y, a, 8, B);
      ((O.current.position.y = Math.abs(R - a) < 0.002 ? a : R),
        O.current.position.y !== a && N());
    }));
  const E = e.walls.flatMap((S) => [S.start, S.end]),
    d = E.length ? Math.min(...E.map((S) => S[0])) : 0,
    g = E.length ? Math.max(...E.map((S) => S[0])) : 8,
    _ = E.length ? Math.min(...E.map((S) => S[1])) : 0,
    M = E.length ? Math.max(...E.map((S) => S[1])) : 6,
    p = (d + g) / 2,
    v = (_ + M) / 2,
    P = e.walls.filter((S) => !isVirtualWall(S)),
    T = (S) => {
      const wallHeight = Math.min(S.height, e.height),
        B = Math.abs(S.end[1] - S.start[1]) < 0.04,
        R = Math.abs(S.end[0] - S.start[0]) < 0.04,
        W = (S.start[0] + S.end[0]) / 2,
        ee = (S.start[1] + S.end[1]) / 2,
        K = (B && ee > v) || (R && W > p);
      return !l && o === "cutaway" && K
        ? Math.min(0.72, wallHeight)
        : wallHeight;
    },
    z = e.devices.filter((S) => {
      const B = r[S.entityId];
      return !!(B && Cn(S, B, l, f));
    }),
    I = Pn(l, f)
      ? e.devices.filter((S) => {
          var B, R;
          return (
            ((B = r[S.entityId]) == null ? void 0 : B.domain) === "switch" &&
            ((R = S.controlledLightFixtures) == null ? void 0 : R.length)
          );
        })
      : [],
    F = !l || f === "overview" || f === "lighting",
    verticalElevations = resolveFloorVerticalElevations(e, r, {
      presentation: l,
    });
  return t.jsxs("group", {
    ref: O,
    position: [0, 0, 0],
    children: [
      e.rooms.map((S) => {
        const B = `${e.id}:${S.id}`,
          R = z.filter((ae) => ae.roomId === S.id),
          W = Gn(R, r, f),
          ee = f === "overview" ? [] : Pe(S, e, r, f),
          K = f === "environment" ? us(S, e, r) : void 0,
          X =
            f === "environment"
              ? (K == null ? void 0 : K.source) !== "unconfigured"
              : ee.length > 0,
          te = f === "environment" ? X : W.modeMatches > 0 || X,
          Q = f === "security" && W.alerts > 0,
          Z = En(S, e, r),
          ye = F && Z.active > 0;
        return t.jsxs(
          "group",
          {
            children: [
              l &&
                ye &&
                t.jsx(Dt, {
                  room: S,
                  color: Z.color,
                  opacity: Z.opacity,
                  alert: !1,
                  y: 0.041,
                  renderOrder: 1,
                  edgeOpacity: Z.edgeOpacity,
                  blending: Se,
                }),
              l &&
                Q &&
                W.opacity > 0 &&
                t.jsx(Dt, {
                  room: S,
                  color: W.color,
                  opacity: W.opacity,
                  alert: f === "security" && W.alerts > 0,
                  y: 0.052,
                  renderOrder: 3,
                }),
              t.jsx(Rn, {
                room: S,
                project: s,
                showLabel: i,
                theme: c,
                presentation: l,
                presentationMode: f,
                accented: te || ye || W.active > 0 || W.alerts > 0,
                lit: ye,
                lightColor: Z.color,
                lightLevel: Z.level,
                highlighted:
                  G === B ||
                  ((h == null ? void 0 : h.floorId) === e.id &&
                    h.roomId === S.id),
                onHover: (ae) => C(ae ? B : void 0),
                onFocus: () =>
                  y == null ? void 0 : y({ floorId: e.id, roomId: S.id }),
              }),
              l &&
                m &&
                X &&
                t.jsx(In, {
                  room: S,
                  floor: e,
                  entities: r,
                  theme: c,
                  mode: f,
                  onLightingAction: w,
                  onShadeAction: b,
                  onSecuritySelect: j,
                }),
            ],
          },
          S.id,
        );
      }),
      P.map((S) =>
        t.jsx(
          Bn,
          {
            wall: S,
            openings: e.openings.filter((B) => B.wallId === S.id),
            renderHeight: T(S),
            color: Te(s, S.materialId, "#f3f1ed"),
            theme: c,
            presentation: l,
            presentationMode: f,
            thicknessScale: u,
            entities: r,
          },
          S.id,
        ),
      ),
      e.furniture.map((S) =>
        t.jsx(
          ci,
          {
            item: S,
            theme: c,
            presentation: l,
            presentationMode: f,
            baseElevation: verticalElevations.get(`furniture:${S.id}`),
          },
          S.id,
        ),
      ),
      n &&
        missingDevicePlacements(e, r, connected).map((device) =>
          t.jsx(le, {
            position: [device.position[0], (device.position[1] || 0) + 0.6, device.position[2]],
            center: true,
            zIndexRange: [30, 20],
            children: t.jsxs("button", {
              type: "button",
              title: device.entityId,
              "aria-label": `实体已失效：${device.entityId}`,
              onClick: (event) => { event.stopPropagation(); k?.(device.id); },
              className: "missing-device-warning",
              children: [
                t.jsx("strong", { style: { color: "#a16207", fontSize: 24 }, children: "⚠" }),
                t.jsx("span", { children: "实体已失效，请删除或替换" }),
              ],
            }),
          }, `missing-${device.id}`)),
      n &&
        z.map((S) =>
          t.jsx(
            ii,
            {
              device: S,
              entity: r[S.entityId],
              presentation: l,
              theme: c,
              presentationMode: f,
              floorHeight: e.height,
              baseElevation: verticalElevations.get(`device:${S.id}`),
              onSelect: x,
              onDeviceSelect: k,
            },
            S.id,
          ),
        ),
      n &&
        I.flatMap((S) =>
          (S.controlledLightFixtures ?? []).map((B) =>
            t.jsx(
              ai,
              {
                fixture: B,
                switchDevice: S,
                entity: r[S.entityId],
                presentation: l,
                theme: c,
                presentationMode: f,
                onSelect: x,
                onDeviceSelect: k,
              },
              `${S.id}-${B.id}`,
            ),
          ),
        ),
    ],
  });
}
function pi({
  project: e,
  entities: s,
  floorId: r,
  showAllFloors: o,
  wallMode: n,
  showDevices: i,
  showLabels: a,
  showGrid: c,
  theme: l = "day",
  presentation: f = !1,
  presentationMode: u = "overview",
  visualStyle: h = "glass",
  wallThicknessScale: m = 1,
  focusedRoom: y,
  showRoomBadges: w = !1,
  onRoomFocus: b,
  onRoomLightingAction: j,
  onRoomShadeAction: x,
  onRoomSecuritySelect: k,
  onEntitySelect: G,
  onDeviceSelect: C,
  autoRotate: O = !1,
}) {
  const N = [...e.floors].sort((R, W) => R.level - W.level),
    E = N.find((R) => R.id === r) ?? N[0],
    d = o ? N : [E],
    [g, _] = L.useState(),
    M = L.useRef(null),
    { invalidate: p } = tt(),
    { minX: v, maxX: P, minZ: T, maxZ: z } = Rs(d),
    I = -(v + P) / 2,
    F = -(T + z) / 2;
  let S = 0;
  const B = new Map();
  for (const R of d)
    (B.set(R.id, S), (S += f ? Ct(R.height) + ks() : R.height + 1.15));
  return (
    re((R, W) => {
      !O || !M.current || ((M.current.rotation.y += W * 0.18), p());
    }),
    t.jsxs(Ss.Provider, {
      value: h,
      children: [
        t.jsx(Wn, {}),
        t.jsxs("group", {
          ref: M,
          onDoubleClick: () => (b == null ? void 0 : b(void 0)),
          children: [
            c &&
              t.jsx("gridHelper", {
                args: [18, 36, "#cfd8dc", "#edf2f1"],
                position: [0, -0.025, 0],
              }),
            t.jsxs("group", {
              position: [I, 0, F],
              children: [
                f &&
                  h !== "cartoon" &&
                  d[0] &&
                  t.jsx(ui, { floors: [d[0]], theme: l, presentationMode: u }),
                f &&
                  d[0] &&
                  t.jsx(hi, { floors: [d[0]], theme: l, presentationMode: u }),
                d.map((R) =>
                  t.jsx(
                    fi,
                    {
                      floor: R,
                      project: e,
                      entities: s,
                      wallMode: n,
                      showDevices: i,
                      showLabels: a,
                      elevation: B.get(R.id) ?? 0,
                      theme: l,
                      presentation: f,
                      presentationMode: u,
                      wallThicknessScale: m,
                      focusedRoom: y,
                      showRoomBadges: w,
                      onRoomFocus: b,
                      onRoomLightingAction: j,
                      onRoomShadeAction: x,
                      onRoomSecuritySelect: k,
                      onEntitySelect: G,
                      onDeviceSelect: C,
                      hoveredRoomKey: g,
                      setHoveredRoomKey: _,
                    },
                    R.id,
                  ),
                ),
              ],
            }),
          ],
        }),
      ],
    })
  );
}
function gi({
  project: e,
  floorId: s,
  showAllFloors: r,
  presentation: o,
  focusedRoom: n,
}) {
  const i = [...e.floors].sort((p, v) => p.level - v.level),
    a = i.find((p) => p.id === s) ?? i[0],
    c = r ? i : [a],
    l = c.flatMap((p) => p.walls.flatMap((v) => [v.start, v.end])),
    f = l.length ? Math.min(...l.map(([p]) => p)) : 0,
    u = l.length ? Math.max(...l.map(([p]) => p)) : 8,
    h = l.length ? Math.min(...l.map(([, p]) => p)) : 0,
    m = l.length ? Math.max(...l.map(([, p]) => p)) : 6,
    y = u - f,
    w = m - h,
    b = o ? ks() : 1.15,
    j = (p) => (o ? Ct(p) : p),
    x = r
      ? c.reduce((p, v) => p + j(v.height), 0) + Math.max(0, c.length - 1) * b
      : j(a.height),
    k = o ? Math.max(0.72, Math.min(1.12, j(a.height) * 0.44)) : 0.55,
    G = o ? 0.92 : 2,
    C = {
      target: [0, r ? Math.max(0.72, x / 2 - G) : k, 0],
      distance:
        Math.max(9.5, y * 1.42, w * 1.7, x * (r ? 1.65 : 1.3)) *
        (o && r ? 1.06 : 1),
    },
    O = n ? c.find((p) => p.id === n.floorId) : void 0,
    N =
      O == null
        ? void 0
        : O.rooms.find((p) => p.id === (n == null ? void 0 : n.roomId));
  if (!O || !(N != null && N.polygon.length)) return C;
  let E = 0;
  for (const p of c) {
    if (p.id === O.id) break;
    E += j(p.height) + b;
  }
  const d = N.polygon.map(([p]) => p),
    g = N.polygon.map(([, p]) => p),
    _ = Math.max(...d) - Math.min(...d),
    M = Math.max(...g) - Math.min(...g);
  return {
    target: [
      (Math.min(...d) + Math.max(...d)) / 2 - (f + u) / 2,
      E + Math.min(j(O.height) * 0.48, o ? 1.18 : 1.15),
      (Math.min(...g) + Math.max(...g)) / 2 - (h + m) / 2,
    ],
    distance: Math.max(5.8, _ * 2.25, M * 2.35, j(O.height) * (o ? 1.72 : 1.8)),
  };
}
function mi(e, s, r) {
  const o = Math.max(1, e - r.left - r.right),
    n = Math.max(1, s - r.top - r.bottom);
  return {
    safeWidth: o,
    safeHeight: n,
    aspect: o / n,
    horizontalOffset: (r.left - r.right) / 2,
    verticalOffset: (r.top - r.bottom) / 2,
  };
}
const xi = {
  eco: {
    antialias: !1,
    dpr: [0.55, 0.75],
    extraLights: "minimal",
    shadowMapSize: [256, 256],
    shadows: !1,
  },
  smooth: {
    antialias: !1,
    dpr: [0.75, 1],
    extraLights: "reduced",
    shadowMapSize: [512, 512],
    shadows: !0,
  },
  balanced: {
    antialias: !0,
    dpr: [1, 1.35],
    extraLights: "full",
    shadowMapSize: [1024, 1024],
    shadows: !0,
  },
  high: {
    antialias: !0,
    dpr: [1, 1.6],
    extraLights: "full",
    shadowMapSize: [1536, 1536],
    shadows: !0,
  },
};
function yi({
  preset: e,
  frame: s,
  presentation: r,
  showAllFloors: o,
  viewportInsets: n,
  resetKey: i,
}) {
  const { camera: a, size: c, controls: l, invalidate: f } = tt(),
    u = L.useRef(!0),
    h = L.useMemo(() => new fe(...s.target), [s.target]),
    framingInsets = L.useMemo(() => n, [e, r, i, o, c.width, c.height, overlayRefitKey(n), n.fitScale]),
    m = mi(c.width, c.height, framingInsets),
    y = c.width <= 620,
    w = r && o,
    b = r
      ? w
        ? c.width <= 620
          ? 1.18
          : c.width <= 960
            ? 1.04
            : 0.94
        : c.width <= 620
          ? 1.06
          : c.width <= 960
            ? 0.88
            : 0.8
      : c.width <= 620
        ? 1.02
        : 0.88,
    j =
      c.width <= 620
        ? Math.max(1, Math.min(1.52, 0.78 / Math.max(0.1, m.aspect)))
        : Math.max(1, Math.min(1.72, 0.92 / Math.max(0.1, m.aspect))),
    x = s.distance * b * j * (n.fitScale ?? 1) * (n.fitAvailable ? c.height / m.safeHeight : 1),
    k = L.useMemo(
      () =>
        e === "top"
          ? new fe(s.target[0], s.target[1] + x * 1.65, s.target[2] + 0.001)
          : e === "front"
            ? new fe(s.target[0], s.target[1] + x * 0.28, s.target[2] + x * 1.5)
            : w
              ? new fe(
                  s.target[0] + x * 0.86,
                  s.target[1] + x * 0.72,
                  s.target[2] + x * 1.04,
                )
              : r
                ? new fe(
                    s.target[0] + x * 0.74,
                    s.target[1] + x * 1.08,
                    s.target[2] + x * 0.88,
                  )
                : new fe(
                    s.target[0] + x * 0.86,
                    s.target[1] + x * 0.86,
                    s.target[2] + x * 1.04,
                  ),
      [w, s.target, e, x],
    ),
    G = L.useMemo(() => {
      const C = h.clone().sub(k).normalize(),
        O = e === "top" ? new fe(0, 0, -1) : new fe(0, 1, 0),
        N = C.clone().cross(O).normalize(),
        E = N.clone().cross(C).normalize(),
        d = a instanceof Tt ? a.fov : 32,
        g = (2 * x * Math.tan(V.degToRad(d) / 2)) / Math.max(1, c.height);
      return h
        .clone()
        .addScaledVector(N, -m.horizontalOffset * g)
        .addScaledVector(E, m.verticalOffset * g);
    }, [h, a, e, x, c.height, k, m.horizontalOffset, m.verticalOffset]),
    P = L.useMemo(() => e === "top"
      ? new fe(...alignedTopCameraPosition(k.toArray(), h.toArray(), G.toArray()))
      : k, [e, k, h, G]);
  return (
    L.useEffect(() => {
      (a.up.fromArray(FLOOR_CAMERA_UP),
        a instanceof Tt &&
          ((a.fov = y
            ? e === "top"
              ? 36
              : r
                ? 34
                : 38
            : e === "top"
              ? r
                ? 29
                : 31
              : r
                ? 29
                : 36),
          a.updateProjectionMatrix()),
        f());
    }, [a, y, f, e, r]),
    L.useEffect(() => {
      ((u.current = !0), f());
    }, [f, e, r, i, o, c.width, c.height, overlayRefitKey(n), n.fitScale]),
    L.useEffect(() => cancelFitOnOrbitStart(l, u), [l]),
    re(() => {
      var O;
      if (!u.current) return;
      const destination = l ? new fe(...reachableOrbitPosition(P.toArray(), G.toArray(), l.minDistance, l.maxDistance)) : P;
      (a.position.lerp(destination, 0.11), a.lookAt(G));
      const C = l;
      (C != null &&
        C.target &&
        (C.target.lerp(G, 0.18), (O = C.update) == null || O.call(C)),
        a.position.distanceTo(destination) < 0.035
          ? (a.position.copy(destination), (u.current = !1))
          : f());
    }),
    null
  );
}
function ji({ enabled: e, scale = DEFAULT_OUTLINE_SCALE }) {
  const { gl: s, scene: r, camera: o, size: n } = tt(),
    i = L.useMemo(
      () =>
        new Lo(s, {
          defaultAlpha: 0.68,
          defaultColor: [0.08, 0.13, 0.2],
          defaultKeepAlive: !0,
          defaultThickness: outlineThickness(DEFAULT_OUTLINE_SCALE),
        }),
      [s],
    );
  const invalidate = tt().invalidate;
  L.useEffect(() => { i.setThickness(outlineThickness(scale)); invalidate(); }, [i, scale, invalidate]);
  L.useEffect(() => () => i.dispose(), [i]);
  return (
    L.useEffect(() => {
      i.setSize(n.width, n.height);
    }, [i, n.height, n.width]),
    re(
      () => {
        e && i.render(r, o);
      },
      e ? 1 : 0,
    ),
    null
  );
}
const Et = {
  eco: { rain: 56, snow: 42, wind: 5 },
  smooth: { rain: 86, snow: 64, wind: 7 },
  balanced: { rain: 132, snow: 96, wind: 9 },
  high: { rain: 188, snow: 132, wind: 12 },
};
function U(e) {
  return Math.abs(Math.sin(e * 12.9898) * 43758.5453) % 1;
}
function bi({ frame: e, intensity: s, storm: r, quality: o }) {
  const n = Math.max(24, Math.round(Et[o].rain * Math.max(0.35, s))),
    i = Math.max(8, e.distance * 1.18),
    a = Math.max(4.5, e.distance * 0.52),
    c = L.useMemo(() => {
      const f = new st();
      return (
        f.setAttribute("position", new yt(new Float32Array(n * 2 * 3), 3)),
        f
      );
    }, [n]),
    l = L.useMemo(
      () =>
        Array.from({ length: n }, (f, u) => ({
          x: (U(u + 1) - 0.5) * i,
          z: (U(u + 301) - 0.5) * i,
          offset: U(u + 701),
          length: V.lerp(0.22, r ? 0.54 : 0.38, U(u + 1201)),
        })),
      [n, i, r],
    );
  return (
    L.useEffect(() => () => c.dispose(), [c]),
    re(({ clock: f }) => {
      const u = c.getAttribute("position"),
        h = u.array,
        m = r ? 1.95 : 1.42,
        y = r ? 1.25 : 0.58;
      for (let w = 0; w < n; w += 1) {
        const b = l[w],
          j = (b.offset + f.elapsedTime * m) % 1,
          x = e.target[0] + b.x + j * y,
          k = e.target[1] + a * (0.75 - j),
          G = e.target[2] + b.z - j * y * 0.36,
          C = w * 6;
        ((h[C] = x),
          (h[C + 1] = k),
          (h[C + 2] = G),
          (h[C + 3] = x + y * 0.08),
          (h[C + 4] = k - b.length),
          (h[C + 5] = G - y * 0.03));
      }
      u.needsUpdate = !0;
    }),
    t.jsx("lineSegments", {
      geometry: c,
      renderOrder: 2,
      children: t.jsx("lineBasicMaterial", {
        color: r ? "#dbeaff" : "#cce7ff",
        transparent: !0,
        opacity: r ? 0.48 : 0.34,
        depthWrite: !1,
        blending: q,
        toneMapped: !1,
      }),
    })
  );
}
function wi({ frame: e, intensity: s, quality: r }) {
  const o = Math.max(28, Math.round(Et[r].snow * Math.max(0.36, s))),
    n = Math.max(8, e.distance * 1.12),
    i = Math.max(4.2, e.distance * 0.5),
    a = L.useMemo(() => {
      const l = new st();
      return (
        l.setAttribute("position", new yt(new Float32Array(o * 3), 3)),
        l
      );
    }, [o]),
    c = L.useMemo(
      () =>
        Array.from({ length: o }, (l, f) => ({
          x: (U(f + 17) - 0.5) * n,
          z: (U(f + 337) - 0.5) * n,
          offset: U(f + 937),
          drift: V.lerp(0.16, 0.58, U(f + 1437)),
        })),
      [o, n],
    );
  return (
    L.useEffect(() => () => a.dispose(), [a]),
    re(({ clock: l }) => {
      const f = a.getAttribute("position"),
        u = f.array;
      for (let h = 0; h < o; h += 1) {
        const m = c[h],
          y = (m.offset + l.elapsedTime * 0.18) % 1,
          w = Math.sin(l.elapsedTime * 0.72 + h) * m.drift,
          b = h * 3;
        ((u[b] = e.target[0] + m.x + w),
          (u[b + 1] = e.target[1] + i * (0.72 - y)),
          (u[b + 2] =
            e.target[2] +
            m.z +
            Math.cos(l.elapsedTime * 0.48 + h) * m.drift * 0.42));
      }
      f.needsUpdate = !0;
    }),
    t.jsx("points", {
      geometry: a,
      renderOrder: 2,
      children: t.jsx("pointsMaterial", {
        color: "#f6fbff",
        size: 0.06,
        sizeAttenuation: !0,
        transparent: !0,
        opacity: 0.78,
        depthWrite: !1,
        blending: q,
        toneMapped: !1,
      }),
    })
  );
}
function vi({ frame: e, intensity: s, quality: r }) {
  const o = Math.max(4, Math.round(Et[r].wind * Math.max(0.55, s))),
    n = Math.max(7, e.distance * 1.05),
    i = L.useMemo(() => {
      const c = new st();
      return (
        c.setAttribute("position", new yt(new Float32Array(o * 2 * 3), 3)),
        c
      );
    }, [o]),
    a = L.useMemo(
      () =>
        Array.from({ length: o }, (c, l) => ({
          y: V.lerp(0.55, 2.6, U(l + 43)),
          z: (U(l + 443) - 0.5) * n,
          offset: U(l + 843),
          length: V.lerp(0.9, 1.8, U(l + 1243)),
        })),
      [o, n],
    );
  return (
    L.useEffect(() => () => i.dispose(), [i]),
    re(({ clock: c }) => {
      const l = i.getAttribute("position"),
        f = l.array;
      for (let u = 0; u < o; u += 1) {
        const h = a[u],
          m = (h.offset + c.elapsedTime * (0.18 + s * 0.18)) % 1,
          y = e.target[0] - n * 0.52 + m * n,
          w = e.target[1] + h.y + Math.sin(c.elapsedTime * 0.9 + u) * 0.08,
          b = e.target[2] + h.z,
          j = u * 6;
        ((f[j] = y),
          (f[j + 1] = w),
          (f[j + 2] = b),
          (f[j + 3] = y + h.length),
          (f[j + 4] = w + 0.04),
          (f[j + 5] = b + 0.18));
      }
      l.needsUpdate = !0;
    }),
    t.jsx("lineSegments", {
      geometry: i,
      renderOrder: 2,
      children: t.jsx("lineBasicMaterial", {
        color: "#d9f7ff",
        transparent: !0,
        opacity: 0.2 + s * 0.2,
        depthWrite: !1,
        blending: q,
        toneMapped: !1,
      }),
    })
  );
}
function _i({ enabled: e, frame: s }) {
  const r = L.useRef(null);
  return (
    re(({ clock: o }) => {
      if (!r.current) return;
      const n = Math.pow(
        Math.max(0, Math.sin(o.elapsedTime * 1.7) - 0.92) / 0.08,
        2,
      );
      r.current.intensity = e ? n * 5.4 : 0;
    }),
    t.jsx("pointLight", {
      ref: r,
      position: [
        s.target[0] - s.distance * 0.28,
        s.target[1] + s.distance * 0.5,
        s.target[2] - s.distance * 0.22,
      ],
      color: "#eaf2ff",
      intensity: 0,
      distance: s.distance * 1.8,
    })
  );
}
function Mi({ frame: e, intensity: s, quality: r, storm: o = !1 }) {
  const n = L.useRef(null),
    i = r === "eco" ? 10 : r === "smooth" ? 15 : r === "balanced" ? 20 : 28,
    a = Math.max(6.3, e.distance * 0.84),
    c = a * 1.86,
    l = L.useMemo(() => {
      const u = document.createElement("canvas");
      ((u.width = 128), (u.height = 128));
      const h = u.getContext("2d");
      if (!h) return null;
      const m = h.createRadialGradient(64, 64, 0, 64, 64, 64);
      (m.addColorStop(0, "rgba(255,255,255,0.54)"),
        m.addColorStop(0.46, "rgba(255,255,255,0.24)"),
        m.addColorStop(1, "rgba(255,255,255,0)"),
        (h.fillStyle = m),
        h.fillRect(0, 0, u.width, u.height));
      const y = new or(u);
      return ((y.colorSpace = Zt), (y.minFilter = It), (y.magFilter = It), y);
    }, []),
    f = L.useMemo(
      () =>
        Array.from({ length: i }, (u, h) => {
          const m = (h / i) * Math.PI * 2 + U(h + 110) * 0.42,
            y = a * V.lerp(0.48, 0.76, U(h + 210));
          return {
            x: Math.cos(m) * y,
            z: Math.sin(m) * y,
            y: V.lerp(0.12, 1.25, U(h + 310)),
            scale:
              V.lerp(1.38, 2.72, U(h + 410)) *
              Math.max(0.86, e.distance * 0.13),
            drift: V.lerp(0.14, 0.38, U(h + 510)),
            phase: U(h + 610) * Math.PI * 2,
            opacity: V.lerp(0.44, 0.74, U(h + 710)),
            speed: V.lerp(0.36, 0.68, U(h + 810)) * (o ? 1.6 : 1),
          };
        }),
      [i, e.distance, a],
    );
  return (
    L.useEffect(() => () => (l == null ? void 0 : l.dispose()), [l]),
    re(({ clock: u }) => {
      if (!n.current) return;
      const h = Math.cos(-0.58),
        m = Math.sin(-0.58),
        y = -m,
        w = h;
      n.current.children.forEach((b, j) => {
        const x = f[j],
          k = (((x.phase + u.elapsedTime * x.speed) % c) / c - 0.5) * c,
          G = Math.sin(u.elapsedTime * 0.42 + x.phase) * x.drift;
        ((b.position.x = e.target[0] + x.x + h * k + y * G),
          (b.position.y =
            e.target[1] +
            x.y +
            Math.sin(u.elapsedTime * 0.28 + x.phase) * 0.12),
          (b.position.z = e.target[2] + x.z + m * k + w * G));
        const C = b instanceof nr ? b.material : null;
        C instanceof ir &&
          (C.opacity =
            (o ? 0.2 : 0.32) *
            s *
            x.opacity *
            (0.82 + Math.sin(u.elapsedTime * 0.24 + x.phase) * 0.18));
      });
    }),
    t.jsx("group", {
      ref: n,
      renderOrder: 0,
      children: f.map((u, h) =>
        t.jsx(
          "sprite",
          {
            position: [e.target[0] + u.x, e.target[1] + u.y, e.target[2] + u.z],
            scale: [u.scale * 1.9, u.scale, 1],
            children: t.jsx("spriteMaterial", {
              map: l ?? void 0,
              color: o ? "#d3dded" : "#eef6fb",
              transparent: !0,
              opacity: (o ? 0.2 : 0.32) * s * u.opacity,
              depthWrite: !1,
              depthTest: !0,
              blending: Se,
              toneMapped: !1,
            }),
          },
          h,
        ),
      ),
    })
  );
}
function ki({
  frame: e,
  presentation: s,
  quality: r,
  weather: o,
  visualStyle: n,
}) {
  if (!s || !o || o.kind === "clear" || n === "cartoon") return null;
  const i = V.clamp(o.intensity, 0.25, 1),
    a = o.kind === "storm";
  return t.jsxs("group", {
    children: [
      (o.kind === "rain" || a) &&
        t.jsx(bi, { frame: e, intensity: i, storm: a, quality: r }),
      o.kind === "snow" && t.jsx(wi, { frame: e, intensity: i, quality: r }),
      (o.kind === "wind" || a) &&
        t.jsx(vi, {
          frame: e,
          intensity: Math.max(i, o.windSpeed ? o.windSpeed / 38 : 0.45),
          quality: r,
        }),
      (o.kind === "fog" || a) &&
        t.jsx(Mi, {
          frame: e,
          intensity: o.kind === "fog" ? Math.max(0.82, i) : i * 0.52,
          quality: r,
          storm: a,
        }),
      a && t.jsx(_i, { enabled: !0, frame: e }),
    ],
  });
}
function _a({
  project: e,
  entities: s,
  floorId: r,
  showAllFloors: o = !1,
  cameraPreset: n = "iso",
  wallMode: i = "full",
  showDevices: a = !0,
  showLabels: c = !0,
  showGrid: l = !1,
  theme: f = "day",
  daylight,
  presentation: u = !1,
  wallThicknessScale: h = 1,
  focusedRoom: m,
  showRoomBadges: y = !1,
  presentationMode: w = "overview",
  visualStyle: b = "glass",
  outlineScale = DEFAULT_OUTLINE_SCALE,
  onRoomFocus: j,
  onRoomLightingAction: x,
  onRoomShadeAction: k,
  onRoomSecuritySelect: G,
  onEntitySelect: C,
  onDeviceSelect: O,
  viewportInsets: N = { top: 0, right: 0, bottom: 0, left: 0 },
  quality: E = "high",
  autoRotate: d = !1,
  cameraResetKey: g,
  weather: _,
}) {
  const M = L.useMemo(
      () =>
        gi({
          project: e,
          floorId: r,
          showAllFloors: o,
          presentation: u,
          focusedRoom: m,
        }),
      [r, m, u, e, o],
    ),
    sunlight = typeof daylight === "number" ? Math.max(0, Math.min(1, daylight)) : 1,
    ambientScale = daylight === undefined ? 1 : 0.22 + sunlight * 0.78,
    directScale = daylight === undefined ? 1 : 0.1 + sunlight * 0.9,
    p = f === "night",
    v = b === "cartoon" && u,
    P = b === "cream" && u,
    T = L.useMemo(() => at(f, w, b), [w, f, b]),
    z = u ? T.background : p ? "#070a14" : "#e9eef0",
    I =
      !v &&
      !P &&
      u &&
      (w === "shade" ||
        w === "security" ||
        (p && w !== "environment" && w !== "overview")),
    F = v
      ? 1.26
      : P
        ? 1.08
        : w === "lighting"
          ? 1.18
          : w === "security"
            ? 0.88
            : 1,
    S = v || P ? 1 : w === "shade" || w === "environment" ? 1.14 : 1,
    B = w === "lighting" ? 1.42 : 1,
    R = xi[E],
    W = R.extraLights === "full",
    ee = R.extraLights !== "minimal",
    K = M.distance * (v ? 5.6 : P ? 6.2 : u ? 3.9 : 2.5),
    X = M.distance * (v ? 11.2 : P ? 12.4 : u ? 8.4 : 5.8),
    te = !!(u && _ && _.kind !== "clear" && _.intensity > 0),
    Q = d || te ? "always" : "demand";
  return t.jsxs(
    er,
    {
      camera: { position: [8.4, 9.6, 10.2], fov: 36, near: 0.1, far: 150 },
      shadows: R.shadows,
      frameloop: Q,
      dpr: R.dpr,
      gl: {
        alpha: u,
        antialias: R.antialias,
        toneMapping: tr,
        toneMappingExposure: v
          ? 1.08
          : P
            ? 1.02
            : I
              ? w === "security"
                ? 0.9
                : 1.02
              : u
                ? 1
                : 1.05,
        powerPreference: "high-performance",
      },
      onCreated: ({ gl: Z }) => {
        ((Z.shadowMap.enabled = R.shadows),
          (Z.shadowMap.type = rr),
          (Z.outputColorSpace = Zt));
      },
      children: [
        !u && t.jsx("color", { attach: "background", args: [z] }),
        t.jsx("fog", { attach: "fog", args: [u ? T.fog : z, K, X] }),
        t.jsx("ambientLight", {
          intensity: (v ? 0.72 : P ? 0.54 : I ? 0.56 : u ? 0.58 : 0.76) * S * ambientScale,
          color: v ? "#fff2df" : P ? "#fff4e4" : I ? "#a8b5dc" : "#edf4ff",
        }),
        t.jsx("hemisphereLight", {
          args: [
            v ? "#fff4df" : P ? "#fff8ed" : I ? "#c3ceee" : "#f5f8ff",
            v ? "#7fa5c4" : P ? "#b9aa93" : I ? "#050817" : "#647b9a",
            (v ? 1.08 : P ? 0.82 : I ? 0.78 : u ? 0.82 : 1.2) * S * ambientScale,
          ],
        }),
        t.jsx("directionalLight", {
          position: [8, 14, 9],
          color: v ? "#fff0cc" : P ? "#fff2d8" : I ? "#e4eaff" : "#ffffff",
          intensity: (v ? 1.44 : P ? 1.28 : I ? 0.96 : u ? 0.88 : 1.8) * F * directScale,
          castShadow: R.shadows,
          "shadow-mapSize": R.shadowMapSize,
          "shadow-bias": -16e-5,
          "shadow-normalBias": 0.045,
          children: t.jsx("orthographicCamera", {
            attach: "shadow-camera",
            args: [-16, 16, 16, -16],
          }),
        }),
        u &&
          W &&
          !v &&
          t.jsx("directionalLight", {
            position: [-7, 7, -8],
            color: T.glow,
            intensity: (I ? 0.26 : 0.18) * S,
          }),
        u &&
          W &&
          !v &&
          t.jsx("pointLight", {
            position: [-8, 5.8, 5],
            color: T.glow,
            intensity: (I ? 1.35 : 0.72) * S * ambientScale,
            distance: 22,
          }),
        u &&
          W &&
          !v &&
          t.jsx("pointLight", {
            position: [6, 4.4, -4],
            color: w === "lighting" ? "#ffd08a" : I ? "#d6c5b6" : "#fff4dd",
            intensity: (I ? 1.38 : 0.78) * B * ambientScale,
            distance: 14,
          }),
        w === "lighting" &&
          ee &&
          t.jsx("pointLight", {
            position: [0, 2.8, 0],
            color: "#ffd08a",
            intensity: 2.4,
            distance: 14,
          }),
        w === "security" &&
          ee &&
          t.jsx("pointLight", {
            position: [-5.5, 2.6, -4.5],
            color: "#ff708a",
            intensity: 1.4,
            distance: 12,
          }),
        I &&
          W &&
          t.jsx("pointLight", {
            position: [4, 3.2, -2],
            color: T.glow,
            intensity: w === "security" ? 1.7 : 2.15,
            distance: 10,
          }),
        t.jsx(ki, {
          frame: M,
          presentation: u,
          quality: E,
          weather: _,
          visualStyle: b,
        }),
        t.jsx(pi, {
          project: e,
          entities: s,
          floorId: r,
          showAllFloors: o,
          wallMode: i,
          showDevices: a,
          showLabels: c,
          showGrid: l,
          theme: f,
          presentation: u,
          wallThicknessScale: h,
          focusedRoom: m,
          showRoomBadges: y,
          presentationMode: w,
          visualStyle: b,
          onRoomFocus: j,
          onRoomLightingAction: x,
          onRoomShadeAction: k,
          onRoomSecuritySelect: G,
          onEntitySelect: C,
          onDeviceSelect: O,
          autoRotate: d,
        }),
        t.jsx(yi, {
          preset: n,
          frame: M,
          presentation: u,
          showAllFloors: o,
          viewportInsets: N,
          resetKey: g,
        }),
        v && t.jsx(ji, { enabled: v, scale: outlineScale }),
        t.jsx(sr, {
          makeDefault: !0,
          enableDamping: !0,
          dampingFactor: 0.085,
          minDistance: 3,
          maxDistance: Math.max(26, M.distance * 3),
          ...FLOOR_ORBIT_LIMITS,
        }),
      ],
    },
    E,
  );
}
const Si = {
    battery: "电量",
    battery_level: "电量",
    brightness: "亮度",
    color_mode: "颜色模式",
    color_temp_kelvin: "色温",
    current_position: "当前位置",
    current_temperature: "当前温度",
    device_class: "设备类型",
    "environment.temperature": "环境温度",
    fan_mode: "风速模式",
    hvac_action: "运行状态",
    humidity: "湿度",
    illuminance: "照度",
    max_color_temp_kelvin: "最高色温",
    min_color_temp_kelvin: "最低色温",
    percentage: "风速",
    signal_strength: "信号",
    supported_color_modes: "灯光能力",
    temperature: "目标温度",
  },
  Ci = new Set([
    "entity_picture",
    "friendly_name",
    "icon",
    "supported_features",
    "unit_of_measurement",
  ]),
  Hs = new Set([
    "sensor",
    "binary_sensor",
    "camera",
    "update",
    "button",
    "event",
    "tag",
    "person",
    "device_tracker",
    "automation",
    "script",
    "notify",
    "tts",
  ]),
  Pi = new Set(["switch", "media_player", "input_boolean"]),
  Gi = new Set([
    "brightness",
    "color_temp",
    "hs",
    "rgb",
    "rgbw",
    "rgbww",
    "xy",
    "white",
  ]),
  Li = new Set(["hs", "rgb", "rgbw", "rgbww", "xy"]),
  $i = new Set(["unavailable", "unknown"]),
  xe = (e, s, r) => Math.min(r, Math.max(s, e)),
  we = (e, s) => Object.prototype.hasOwnProperty.call(e.attributes, s),
  Nt = (e, s) => {
    const r = e == null ? void 0 : e.attributes[s];
    return typeof r == "number" && Number.isFinite(r) ? r : void 0;
  },
  de = (e, s, r) => Nt(e, s) ?? r,
  Bs = (e, s) => {
    const r = e.attributes[s];
    return Array.isArray(r) ? r.filter((o) => typeof o == "string") : [];
  },
  et = (e, s) => {
    const r = e.attributes[s];
    return Array.isArray(r)
      ? r.filter((o) => typeof o == "number" && Number.isFinite(o))
      : [];
  },
  _e = (e) => `${Math.round(e)}%`,
  Ze = (e) => `${Math.round(e)}K`,
  Ei = (e) =>
    Math.round(xe(e, 0, 255))
      .toString(16)
      .padStart(2, "0"),
  As = (e) => `#${e.slice(0, 3).map(Ei).join("")}`,
  ft = (e, s) => `${e}${e.includes("?") ? "&" : "?"}ts=${s}`,
  Ds = () => {
    if (typeof document > "u") return !1;
    const e = document.createElement("video");
    return !!(
      e.canPlayType("application/vnd.apple.mpegurl") ||
      e.canPlayType("application/x-mpegURL")
    );
  },
  Ni = () => typeof window < "u" && typeof window.MediaSource < "u",
  Oi = () => Ds() || Ni();
function De(e) {
  return (
    {
      auto: "自动",
      cool: "制冷",
      dry: "除湿",
      fan_only: "送风",
      heat: "制热",
      off: "关闭",
      on: "开启",
    }[e] ?? e
  );
}
function zi(e, s, r) {
  if (r != null) {
    if (s === "brightness" && typeof r == "number") return _e((r / 255) * 100);
    if (
      s === "color_temp_kelvin" ||
      s === "min_color_temp_kelvin" ||
      s === "max_color_temp_kelvin"
    )
      return `${r}K`;
    if (
      s === "current_position" ||
      s === "percentage" ||
      s === "battery" ||
      s === "battery_level"
    )
      return `${r}%`;
    if (
      s === "current_temperature" ||
      s === "temperature" ||
      s === "environment.temperature"
    )
      return `${r}°C`;
    if (s === "humidity") return `${r}%`;
    if (Array.isArray(r)) {
      const o = r
        .filter((n) => typeof n == "string" || typeof n == "number")
        .map((n) => (typeof n == "string" ? De(n) : String(n)));
      return o.length ? o.join(" / ") : void 0;
    }
    if (typeof r == "number") {
      const o =
        typeof e.attributes.unit_of_measurement == "string"
          ? e.attributes.unit_of_measurement
          : "";
      return `${Number.isInteger(r) ? r : r.toFixed(1)}${o}`;
    }
    if (typeof r == "boolean") return r ? "是" : "否";
    if (typeof r == "string") return De(r);
  }
}
function Ti(e) {
  return [
    ...[
      "current_temperature",
      "temperature",
      "hvac_action",
      "fan_mode",
      "brightness",
      "color_temp_kelvin",
      "current_position",
      "percentage",
      "battery",
      "battery_level",
      "humidity",
      "illuminance",
      "signal_strength",
      "device_class",
      "supported_color_modes",
    ],
    ...Object.keys(e.attributes),
  ]
    .filter((o, n, i) => i.indexOf(o) === n)
    .filter((o) => !Ci.has(o))
    .map((o) => {
      const n = e.attributes[o],
        i = zi(e, o, n);
      if (i)
        return { key: o, label: Si[o] ?? o.replace(/[_.-]/g, " "), value: i };
    })
    .filter((o) => !!o)
    .slice(0, 6);
}
function Ii(e) {
  const s = Bs(e, "supported_color_modes"),
    r = new Set(s),
    o = (h) => s.some((m) => h.has(m)),
    n = de(e, "min_color_temp_kelvin", 2700),
    i = Math.max(n + 100, de(e, "max_color_temp_kelvin", 6500)),
    a = de(e, "brightness", e.state === "on" ? 180 : 0),
    c = xe(de(e, "color_temp_kelvin", Math.round((n + i) / 2)), n, i),
    l =
      o(Gi) ||
      (r.size === 0 && we(e, "brightness")) ||
      Nt(e, "brightness") !== void 0,
    f =
      r.has("color_temp") ||
      we(e, "color_temp_kelvin") ||
      we(e, "min_color_temp_kelvin") ||
      we(e, "max_color_temp_kelvin"),
    u =
      o(Li) || et(e, "rgb_color").length >= 3 || et(e, "hs_color").length >= 2;
  return {
    brightness: a,
    brightnessPercent: Math.round((a / 255) * 100),
    colorTempKelvin: c,
    hasBrightness: l,
    hasColor: u,
    hasColorTemperature: f,
    maxKelvin: i,
    minKelvin: n,
    modes: s,
  };
}
function Ri(e, s) {
  const r = (((e % 360) + 360) % 360) / 60,
    n = xe(s, 0, 100) / 100,
    i = n * (1 - Math.abs((r % 2) - 1)),
    a = 1 - n,
    [c, l, f] =
      r < 1
        ? [n, i, 0]
        : r < 2
          ? [i, n, 0]
          : r < 3
            ? [0, n, i]
            : r < 4
              ? [0, i, n]
              : r < 5
                ? [i, 0, n]
                : [n, 0, i];
  return As([(c + a) * 255, (l + a) * 255, (f + a) * 255]);
}
function Fi(e) {
  for (const r of ["rgb_color", "rgbw_color", "rgbww_color"]) {
    const o = et(e, r);
    if (o.length >= 3) return As(o);
  }
  const s = et(e, "hs_color");
  return s.length >= 2 ? Ri(s[0], s[1]) : "#ffcc8a";
}
function Hi(e) {
  const s = e.replace("#", "").trim();
  return /^[0-9a-fA-F]{6}$/.test(s)
    ? [
        Number.parseInt(s.slice(0, 2), 16),
        Number.parseInt(s.slice(2, 4), 16),
        Number.parseInt(s.slice(4, 6), 16),
      ]
    : [255, 204, 138];
}
function se({ title: e, hint: s, children: r }) {
  return t.jsxs("div", {
    className: "control-section",
    style: { background: "rgba(0,0,0,0)", boxShadow: "none" },
    children: [
      t.jsxs("div", {
        className: "control-section-heading",
        children: [
          t.jsx("strong", { children: e }),
          s && t.jsx("span", { children: s }),
        ],
      }),
      r,
    ],
  });
}
function ht({ items: e }) {
  return t.jsx("div", {
    className: "capability-strip",
    "aria-label": "设备能力",
    children: e.map((s) =>
      t.jsx(
        "span",
        { className: s.active ? "active" : "", children: s.label },
        s.label,
      ),
    ),
  });
}
function We({
  ariaLabel: e,
  disabled: s = !1,
  formatValue: r,
  icon: o,
  label: n,
  max: i,
  min: a,
  onCommit: c,
  step: l = 1,
  value: f,
}) {
  const [u, h] = L.useState(f),
    [m, y] = L.useState(!1),
    w = L.useRef(f),
    b = L.useRef(!1),
    j = L.useRef(f),
    x = L.useRef(c),
    k = L.useRef(void 0),
    G = 180;
  (L.useEffect(() => {
    x.current = c;
  }, [c]),
    L.useEffect(() => {
      const p = xe(f, a, i);
      b.current || ((w.current = p), (j.current = p), h(p));
    }, [i, a, f]),
    L.useEffect(
      () => () => {
        k.current && window.clearTimeout(k.current);
      },
      [],
    ));
  function C(p) {
    return xe(Number.isFinite(p) ? p : f, a, i);
  }
  function O() {
    k.current && (window.clearTimeout(k.current), (k.current = void 0));
  }
  function N(p) {
    const v = C(p);
    (j.current !== void 0 && Math.abs(j.current - v) < 1e-4) ||
      ((j.current = v), x.current(v));
  }
  function E(p) {
    (O(),
      (k.current = window.setTimeout(() => {
        ((k.current = void 0), N(p));
      }, G)));
  }
  function d() {
    s || ((b.current = !0), y(!0));
  }
  function g() {
    (!b.current && !k.current) || (O(), N(w.current), (b.current = !1), y(!1));
  }
  function _(p) {
    const v = C(p);
    ((w.current = v), h(v), E(v));
  }
  const M = r(u);
  return t.jsxs("label", {
    className: `slider-row slider-row-compact smooth-slider-row ${m ? "is-editing" : ""}`,
    children: [
      t.jsxs("span", {
        children: [o, n, " ", t.jsx("strong", { children: M })],
      }),
      t.jsx("input", {
        "aria-label": e,
        "aria-valuetext": M,
        disabled: s,
        type: "range",
        min: a,
        max: i,
        step: l,
        value: u,
        onBlur: g,
        onChange: (p) => _(Number(p.currentTarget.value)),
        onKeyDown: d,
        onKeyUp: g,
        onPointerCancel: g,
        onPointerDown: d,
        onPointerUp: g,
      }),
    ],
  });
}
function Ue({
  active: e,
  busy: s,
  entity: r,
  labels: o = { on: "开启", off: "关闭", toggle: "切换" },
  run: n,
}) {
  return t.jsxs("div", {
    className: "action-grid",
    children: [
      t.jsxs("button", {
        type: "button",
        className: e ? "active" : "",
        disabled: s,
        onClick: () => n({ type: "turn_on", entityId: r.entityId }),
        children: [t.jsx(Jr, { size: 16 }), o.on],
      }),
      t.jsxs("button", {
        type: "button",
        className: e ? "" : "active",
        disabled: s,
        onClick: () => n({ type: "turn_off", entityId: r.entityId }),
        children: [t.jsx(Zr, { size: 16 }), o.off],
      }),
      t.jsxs("button", {
        type: "button",
        disabled: s,
        onClick: () => n({ type: "toggle", entityId: r.entityId }),
        children: [t.jsx(pt, { size: 15 }), o.toggle],
      }),
    ],
  });
}
function Bi({ active: e, busy: s, compact: r = !1, entity: o, run: n }) {
  const i = Ii(o),
    a = Fi(o),
    c = [
      { label: "暖白", value: i.minKelvin },
      { label: "自然", value: Math.round((i.minKelvin + i.maxKelvin) / 2) },
      { label: "清爽", value: i.maxKelvin },
    ],
    l = [
      { label: "暖橙", value: "#ff9f43" },
      { label: "玫红", value: "#ff5c8a" },
      { label: "紫光", value: "#8b5cf6" },
      { label: "海蓝", value: "#35b9ff" },
      { label: "青绿", value: "#2dd4bf" },
      { label: "日光", value: "#fff1c2" },
    ],
    f = (u) =>
      n({ type: "set_rgb_color", entityId: o.entityId, rgbColor: Hi(u) });
  return t.jsxs("div", {
    className: "typed-control-stack typed-control-light",
    children: [
      !r &&
        t.jsx(ht, {
          items: [
            { label: "开关", active: !0 },
            { label: "亮度", active: i.hasBrightness },
            { label: "色温", active: i.hasColorTemperature },
            { label: "彩色", active: i.hasColor },
          ],
        }),
      t.jsx(se, {
        title: r ? "开关" : "灯光控制",
        hint: r
          ? void 0
          : i.modes.length
            ? i.modes.map(De).join(" / ")
            : "基础灯光",
        children: t.jsx(Ue, { active: e, busy: s, entity: o, run: n }),
      }),
      i.hasBrightness &&
        t.jsx(se, {
          title: "亮度",
          hint: _e(i.brightnessPercent),
          children: t.jsx(We, {
            ariaLabel: "设置灯光亮度",
            disabled: s,
            icon: t.jsx(ss, { size: 14 }),
            label: "亮度强度",
            min: 0,
            max: 255,
            value: i.brightness,
            formatValue: (u) => _e((u / 255) * 100),
            onCommit: (u) =>
              n(
                { type: "set_brightness", entityId: o.entityId, brightness: u },
                { blocking: !1 },
              ),
          }),
        }),
      i.hasColorTemperature &&
        t.jsxs(se, {
          title: "色温",
          hint: `${Ze(i.minKelvin)} - ${Ze(i.maxKelvin)}`,
          children: [
            t.jsx(We, {
              ariaLabel: "设置灯光色温",
              disabled: s,
              icon: t.jsx(jt, { size: 14 }),
              label: "冷暖色温",
              min: i.minKelvin,
              max: i.maxKelvin,
              step: 50,
              value: i.colorTempKelvin,
              formatValue: Ze,
              onCommit: (u) =>
                n(
                  {
                    type: "set_color_temperature",
                    entityId: o.entityId,
                    colorTempKelvin: u,
                  },
                  { blocking: !1 },
                ),
            }),
            t.jsx("div", {
              className: "preset-grid light-temperature-presets",
              children: c.map((u) =>
                t.jsxs(
                  "button",
                  {
                    type: "button",
                    disabled: s,
                    onClick: () =>
                      n({
                        type: "set_color_temperature",
                        entityId: o.entityId,
                        colorTempKelvin: u.value,
                      }),
                    children: [
                      u.label,
                      t.jsx("small", { children: Ze(u.value) }),
                    ],
                  },
                  u.label,
                ),
              ),
            }),
          ],
        }),
      i.hasColor &&
        t.jsxs(se, {
          title: "颜色",
          hint: a.toUpperCase(),
          children: [
            t.jsxs("div", {
              className: "light-color-picker-row",
              children: [
                t.jsxs("span", {
                  children: [
                    t.jsx(Tr, { size: 14 }),
                    "彩色灯光 ",
                    t.jsx("strong", { children: a.toUpperCase() }),
                  ],
                }),
                t.jsxs("div", {
                  className: "light-color-picker-control",
                  children: [
                    t.jsx("i", { style: { background: a } }),
                    t.jsx("input", {
                      "aria-label": "设置灯光颜色",
                      disabled: s,
                      type: "color",
                      value: a,
                      onChange: (u) => f(u.target.value),
                    }),
                  ],
                }),
              ],
            }),
            t.jsx("div", {
              className: "preset-grid light-color-presets",
              children: l.map((u) =>
                t.jsxs(
                  "button",
                  {
                    type: "button",
                    disabled: s,
                    onClick: () => f(u.value),
                    "aria-label": `设置灯光颜色为${u.label}`,
                    children: [
                      t.jsx("span", { style: { background: u.value } }),
                      t.jsx("small", { children: u.label }),
                    ],
                  },
                  u.label,
                ),
              ),
            }),
          ],
        }),
      !r &&
        !i.hasBrightness &&
        !i.hasColorTemperature &&
        !i.hasColor &&
        t.jsx("p", {
          className: "control-hint",
          children:
            "这个灯在 HA 数据中只暴露开关能力，因此隐藏亮度、色温和颜色控件。",
        }),
    ],
  });
}
function Ai({ active: e, busy: s, compact: r = !1, entity: o, run: n }) {
  const i = xe(de(o, "current_position", o.state === "open" ? 100 : 0), 0, 100),
    a = we(o, "current_position") || (de(o, "supported_features", 0) & 4) === 4;
  return t.jsxs("div", {
    className: "typed-control-stack typed-control-cover",
    children: [
      !r &&
        t.jsx(ht, {
          items: [
            { label: "打开/关闭", active: !0 },
            { label: "位置", active: a },
          ],
        }),
      t.jsx(se, {
        title: r ? "开关" : "遮阳控制",
        hint: r ? void 0 : e ? "已打开" : "已关闭",
        children: t.jsx(Ue, {
          active: e,
          busy: s,
          entity: o,
          labels: { on: "打开", off: "关闭", toggle: "切换" },
          run: n,
        }),
      }),
      a &&
        t.jsx(se, {
          title: "开合位置",
          hint: _e(i),
          children: t.jsx(We, {
            ariaLabel: "设置窗帘位置",
            disabled: s,
            icon: t.jsx(ss, { size: 14 }),
            label: "窗帘位置",
            min: 0,
            max: 100,
            value: i,
            formatValue: _e,
            onCommit: (c) =>
              n(
                {
                  type: "set_cover_position",
                  entityId: o.entityId,
                  position: c,
                },
                { blocking: !1 },
              ),
          }),
        }),
    ],
  });
}
function Di({ active: e, busy: s, compact: r = !1, entity: o, run: n }) {
  const i = de(o, "min_temp", 16),
    a = Math.max(i + 1, de(o, "max_temp", 32)),
    c = de(o, "target_temp_step", 0.5),
    l = xe(de(o, "temperature", 26), i, a),
    f = Nt(o, "current_temperature"),
    u = Bs(o, "hvac_modes"),
    h = u.length ? u : ["off", "auto", "cool", "heat", "dry", "fan_only"];
  return t.jsxs("div", {
    className: "typed-control-stack typed-control-climate",
    children: [
      t.jsxs("div", {
        className: "climate-readout-row",
        children: [
          t.jsxs("div", {
            children: [
              t.jsx(Fe, { size: 16 }),
              t.jsx("small", { children: "当前" }),
              t.jsx("strong", { children: f !== void 0 ? `${f}°C` : "—" }),
            ],
          }),
          t.jsxs("div", {
            children: [
              t.jsx(jt, { size: 16 }),
              t.jsx("small", { children: "目标" }),
              t.jsxs("strong", { children: [l, "°C"] }),
            ],
          }),
          t.jsxs("div", {
            children: [
              t.jsx(rt, { size: 16 }),
              t.jsx("small", { children: "状态" }),
              t.jsx("strong", {
                children: De(String(o.attributes.hvac_action ?? o.state)),
              }),
            ],
          }),
        ],
      }),
      t.jsx(se, {
        title: r ? "开关" : "空调控制",
        hint: r ? void 0 : e ? "运行中" : "待机",
        children: t.jsx(Ue, {
          active: e,
          busy: s,
          entity: o,
          labels: { on: "启动", off: "关闭", toggle: "切换" },
          run: n,
        }),
      }),
      t.jsx(se, {
        title: "目标温度",
        hint: `${i}°C - ${a}°C`,
        children: t.jsx(We, {
          ariaLabel: "设置目标温度",
          disabled: s,
          icon: t.jsx(Fe, { size: 14 }),
          label: "设定温度",
          min: i,
          max: a,
          step: c,
          value: l,
          formatValue: (m) => `${m}°C`,
          onCommit: (m) =>
            n(
              { type: "set_temperature", entityId: o.entityId, temperature: m },
              { blocking: !1 },
            ),
        }),
      }),
      t.jsx(se, {
        title: "运行模式",
        children: t.jsx("div", {
          className: "preset-grid climate-mode-grid",
          role: "group",
          "aria-label": "设置空调模式",
          children: h.map((m) => {
            const y = o.state === m;
            return t.jsx(
              "button",
              {
                type: "button",
                className: y ? "active" : "",
                disabled: s || y,
                onClick: () =>
                  n({ type: "set_hvac_mode", entityId: o.entityId, mode: m }),
                "aria-pressed": y,
                children: De(m),
              },
              m,
            );
          }),
        }),
      }),
    ],
  });
}
function Wi({ active: e, busy: s, compact: r = !1, entity: o, run: n }) {
  const i = xe(de(o, "percentage", e ? 100 : 0), 0, 100),
    a = we(o, "percentage") || we(o, "percentage_step");
  return t.jsxs("div", {
    className: "typed-control-stack typed-control-fan",
    children: [
      !r &&
        t.jsx(ht, {
          items: [
            { label: "开关", active: !0 },
            { label: "风速", active: a },
          ],
        }),
      t.jsx(se, {
        title: r ? "开关" : "风扇控制",
        hint: r ? void 0 : e ? "运行中" : "待机",
        children: t.jsx(Ue, { active: e, busy: s, entity: o, run: n }),
      }),
      a &&
        t.jsx(se, {
          title: "风速",
          hint: _e(i),
          children: t.jsx(We, {
            ariaLabel: "设置风扇风速",
            disabled: s,
            icon: t.jsx(rt, { size: 14 }),
            label: "风速比例",
            min: 0,
            max: 100,
            value: i,
            formatValue: _e,
            onCommit: (c) =>
              n(
                {
                  type: "set_fan_percentage",
                  entityId: o.entityId,
                  percentage: c,
                },
                { blocking: !1 },
              ),
          }),
        }),
    ],
  });
}
function Ws({ entity: e }) {
  const s =
    typeof e.attributes.device_class == "string"
      ? e.attributes.device_class
      : Be(e.domain);
  return t.jsxs("div", {
    className: "readonly-signal-card",
    children: [
      t.jsx("span", {
        className: `domain-icon domain-${e.domain}`,
        children: t.jsx(fs, { domain: e.domain, size: 20 }),
      }),
      t.jsxs("div", {
        children: [
          t.jsx("small", { children: s }),
          t.jsx("strong", { children: Ae(e) }),
        ],
      }),
      e.domain === "sensor" && t.jsx(Fe, { size: 17 }),
      e.domain === "binary_sensor" && t.jsx(Qt, { size: 17 }),
    ],
  });
}
function Vs({ compact: e = !1, entity: s }) {
  return t.jsxs("div", {
    className: "typed-control-stack typed-control-readonly",
    children: [
      t.jsx(Ws, { entity: s }),
      !e &&
        t.jsx("p", {
          className: "control-hint",
          children: "此类实体作为状态来源展示，不显示会产生副作用的控制按钮。",
        }),
    ],
  });
}
function Vi({ label: e, onError: s, src: r }) {
  const o = L.useRef(null);
  return (
    L.useEffect(() => {
      const n = o.current;
      if (!n) return;
      let i = !1,
        a;
      return Ds()
        ? ((n.src = r),
          n.play().catch(() => {}),
          () => {
            ((i = !0), n.removeAttribute("src"), n.load());
          })
        : (ar(
            async () => {
              const { default: c } = await import("../vendor/hls.js");
              return { default: c };
            },
            [],
            import.meta.url,
          )
            .then(({ default: c }) => {
              if (i) return;
              if (!c.isSupported()) {
                s();
                return;
              }
              const l = new c({
                backBufferLength: 30,
                enableWorker: !0,
                liveSyncDurationCount: 3,
                lowLatencyMode: !0,
              });
              ((a = l),
                l.on(c.Events.ERROR, (f, u) => {
                  u.fatal && (s(), l.destroy());
                }),
                l.on(c.Events.MANIFEST_PARSED, () => {
                  n.play().catch(() => {});
                }),
                l.loadSource(r),
                l.attachMedia(n));
            })
            .catch(() => s()),
          () => {
            ((i = !0),
              a == null || a.destroy(),
              n.removeAttribute("src"),
              n.load());
          });
    }, [s, r]),
    t.jsx("video", {
      ref: o,
      className: "camera-live-media",
      muted: !0,
      controls: !0,
      playsInline: !0,
      "aria-label": e,
      onError: s,
    })
  );
}
function Ki({ compact: e = !1, entity: s, autoPlay = false }) {
  var I;
  const [r, o] = L.useState(),
    [n, i] = L.useState(!1),
    [a, c] = L.useState(!1),
    [l, f] = L.useState(),
    [u, h] = L.useState(!1),
    [m, y] = L.useState(!1),
    [w, b] = L.useState(!1),
    [j, x] = L.useState(Date.now()),
    [k, G] = L.useState(Date.now());
  L.useEffect(() => {
    (o(void 0),
      i(!1),
      c(!1),
      f(void 0),
      h(!1),
      y(!1),
      b(!1),
      x(Date.now()),
      G(Date.now()));
  }, [s.entityId]);
  const cameraRequestVersion = L.useRef(0);
  const C = Oi(),
    O =
      !!(r != null && r.mjpegUrl) &&
      !(
        (I = r == null ? void 0 : r.mjpegUrl) != null &&
        I.includes("camera_proxy_stream")
      ),
    N = n && (r == null ? void 0 : r.source) === "mjpeg" && O && !u,
    E =
      n &&
      !N &&
      (r == null ? void 0 : r.source) === "hls" &&
      C &&
      !!r.hlsUrl &&
      !m,
    d = n && !!r && !N && !E && !w,
    g = !n || a || (n && !N && !E && !d);
  L.useEffect(() => {
    if (!d) return;
    const F = window.setInterval(() => G(Date.now()), 1500);
    return () => window.clearInterval(F);
  }, [d]);
  async function _() {
    const request = ++cameraRequestVersion.current;
    (c(!0), f(void 0), h(!1), y(!1), b(!1));
    try {
      const F = await qs(s.entityId);
      if(request !== cameraRequestVersion.current)return;
      (o(F), x(Date.now()), G(Date.now()), i(!0));
    } catch (F) {
      if(request === cameraRequestVersion.current)(f(F instanceof Error ? F.message : "摄像头画面获取失败"), i(!1));
    } finally {
      if(request === cameraRequestVersion.current)c(!1);
    }
  }
  L.useEffect(()=>{if(autoPlay && s.state !== "unavailable")_();return()=>{cameraRequestVersion.current++;};},[s.entityId,autoPlay]);
  function M() {
    cameraRequestVersion.current++;
    (i(!1), h(!1), y(!1), b(!1));
  }
  function p() {
    (h(!1), y(!1), b(!1), x(Date.now()), G(Date.now()));
  }
  const v = a ? "连接中" : n ? (d ? "快照刷新" : "直播中") : "按需播放",
    P = r ? ft(r.snapshotUrl, k) : void 0,
    T = a ? "正在连接摄像头" : n ? "画面加载失败" : "点击播放实时画面",
    z = n
      ? "请确认该 camera 实体在 Home Assistant 中可以预览。"
      : "优先实时流，无法播放时自动使用快照刷新。";
  return t.jsxs("div", {
    className: "typed-control-stack typed-control-camera",
    children: [
      t.jsxs(se, {
        title: "实时画面",
        hint: v,
        children: [
          t.jsxs("div", {
            className: `camera-preview-frame ${n ? "is-playing" : ""}`,
            "aria-live": "polite",
            children: [
              N &&
                (r == null ? void 0 : r.mjpegUrl) &&
                t.jsx("img", {
                  className: "camera-live-media",
                  src: ft(r.mjpegUrl, j),
                  alt: `${s.name} 实时画面`,
                  onError: () => h(!0),
                }),
              E &&
                (r == null ? void 0 : r.hlsUrl) &&
                t.jsx(Vi, {
                  label: `${s.name} HLS 实时画面`,
                  src: ft(r.hlsUrl, j),
                  onError: () => y(!0),
                }),
              d &&
                P &&
                t.jsx("img", {
                  className: "camera-live-media",
                  src: P,
                  alt: `${s.name} 快照画面`,
                  onError: () => {
                    (b(!0),
                      f(
                        "摄像头快照加载失败，请确认该实体在 Home Assistant 中可预览。",
                      ));
                  },
                }),
              g &&
                t.jsxs("div", {
                  className: "camera-preview-placeholder",
                  children: [
                    t.jsx(bo, { size: 22 }),
                    t.jsx("strong", { children: T }),
                    t.jsx("small", { children: z }),
                  ],
                }),
            ],
          }),
          t.jsxs("div", {
            className: "camera-preview-toolbar",
            children: [
              t.jsxs("button", {
                type: "button",
                className: n ? "active" : "",
                disabled: a,
                onClick: n
                  ? M
                  : () => {
                      _();
                    },
                children: [
                  a
                    ? t.jsx(pt, { className: "spin-icon", size: 15 })
                    : n
                      ? t.jsx(Kr, { size: 15 })
                      : t.jsx(qr, { size: 15 }),
                  a ? "连接中" : n ? "停止" : "播放",
                ],
              }),
              t.jsxs("button", {
                type: "button",
                disabled: a || !r,
                onClick: p,
                children: [t.jsx(pt, { size: 15 }), "刷新"],
              }),
            ],
          }),
          l &&
            t.jsx("p", {
              className: "camera-preview-error",
              role: "status",
              children: l,
            }),
        ],
      }),
      !e && t.jsx(Ws, { entity: s }),
      !e &&
        t.jsx("p", {
          className: "control-hint",
          children: "摄像头为只读设备；播放失败时会自动改用定时快照。",
        }),
    ],
  });
}
function Ui({ active: e, busy: s, compact: r = !1, entity: o, run: n }) {
  return Pi.has(o.domain)
    ? t.jsxs("div", {
        className: "typed-control-stack typed-control-generic",
        children: [
          !r && t.jsx(ht, { items: [{ label: "开关", active: !0 }] }),
          t.jsx(se, {
            title: r ? "开关" : `${Be(o.domain)}控制`,
            hint: r ? void 0 : e ? "运行中" : "待机",
            children: t.jsx(Ue, { active: e, busy: s, entity: o, run: n }),
          }),
        ],
      })
    : t.jsx(Vs, { compact: r, entity: o });
}
function CameraControlsBridge({entity}){const project=Ie(state=>state.project);const entities=Ie(state=>state.entities);return t.jsx(CameraControlPanel,{entity,project,entities,renderLive:(active,key)=>t.jsx(Ki,{entity:active,compact:true,autoPlay:true},key)});}
function qi({ active: e, busy: s, compact: r = !1, entity: o, run: n }) {
  return o.domain === "light"
    ? t.jsx(Bi, { active: e, busy: s, compact: r, entity: o, run: n })
    : o.domain === "cover"
      ? t.jsx(Ai, { active: e, busy: s, compact: r, entity: o, run: n })
      : o.domain === "climate"
        ? t.jsx(Di, { active: e, busy: s, compact: r, entity: o, run: n })
        : o.domain === "fan"
          ? t.jsx(Wi, { active: e, busy: s, compact: r, entity: o, run: n })
          : o.domain === "camera"
            ? t.jsx(CameraControlsBridge, { entity: o })
            : Hs.has(o.domain)
              ? t.jsx(Vs, { compact: r, entity: o })
              : t.jsx(Ui, {
                  active: e,
                  busy: s,
                  compact: r,
                  entity: o,
                  run: n,
                });
}
function CustomDeviceControls({ busy, compact, entity, run }) {
  const [data, setData] = L.useState();
  const [error, setError] = L.useState();
  const [tick, setTick] = L.useState(0);
  L.useEffect(() => {
    const refresh = () => setTick(value => value + 1);
    const interval = window.setInterval(refresh, 5000);
    window.addEventListener("ha3d-device-platform-updated", refresh);
    window.addEventListener("focus", refresh);
    return () => { window.clearInterval(interval); window.removeEventListener("ha3d-device-platform-updated", refresh); window.removeEventListener("focus", refresh); };
  }, []);
  L.useEffect(() => {
    let active = true;
    Promise.all([fetch("./api/device-platform").then(r=>{if(!r.ok)throw Error("面板加载失败");return r.json();}),fetch("./api/device-platform/devices").then(r=>{if(!r.ok)throw Error("设备加载失败");return r.json();})]).then(([platform, registry]) => {
      if(active){setData({platform,device:registry.devices?.find(d=>d.id===entity.deviceId)});setError(undefined);}
    }).catch(e=>{if(active)setError(e.message);});
    return ()=>{active=false;};
  }, [entity.deviceId, entity.deviceControlPanelId, entity.lastUpdated, tick]);
  if(!data?.device) return t.jsx("p",{className:"control-hint",children:error || "正在加载设备能力…"});
  const panel=data.platform.controlPanels.find(p=>p.id===entity.deviceControlPanelId);
  const project=data.platform.deviceTemplates.find(p=>p.id===data.device.deviceTemplateId);
  const binding=data.platform.bindings.find(b=>b.deviceId===entity.deviceId);
  const states=boundPanelStates(project,binding,data.device.entities || []);
  const act=async(id,value,control)=>{
    const state=states[id];
    if(!state?.entityId || state.access === "read") return;
    let payload;
    if(control.type === "select") payload={type:"select_option",entityId:state.entityId,option:String(value)};
    else if(["number","slider"].includes(control.type)) payload={type:"set_value",entityId:state.entityId,value:Number(value)};
    else if(control.type === "toggle") payload={type:value ? "turn_on" : "turn_off",entityId:state.entityId};
    else {const target=(data.device.entities || []).find(e=>e.entityId===state.entityId);payload={type:["switch","input_boolean"].includes(target?.domain) ? target.state === "on" ? "turn_off" : "turn_on" : "press",entityId:state.entityId};}
    try {await run(payload);setTick(v=>v+1);} catch(e){setError(e.message);}
  };
  return t.jsxs(t.Fragment,{children:[error && t.jsx("p",{className:"control-error",children:error}),panel ? t.jsx(DevicePanel,{panel,states,interactive:!busy,onAction:act}) : t.jsx("p",{className:"control-hint",children:"绑定的控制面板不存在"})]});
}
function Ma({ compact: e = !1, entity: s }) {
  const r = Ie((j) => j.act),
    [o, n] = L.useState(!1),
    [i, a] = L.useState();
  L.useEffect(() => {
    a(void 0);
  }, [s == null ? void 0 : s.entityId]);
  const deviceStateEntity = s?.deviceOperationalState ?? s,
    c = deviceStateEntity
      ? Ae(deviceStateEntity)
      : "选择 3D 场景中的设备，或从设备列表中选择。";
  async function l(j, x = {}) {
    const k = x.blocking !== !1;
    (k && n(!0), a(void 0));
    try {
      await r(j);
    } catch (G) {
      a(G instanceof Error ? G.message : "控制操作失败");
    } finally {
      k && n(!1);
    }
  }
  if (!s)
    return t.jsxs(
      "section",
      {
        className: "control-card empty-state",
        children: [
          t.jsx("p", { className: "eyebrow", children: "设备控制" }),
          t.jsx("h2", { children: "选择一个设备" }),
          t.jsx("p", { children: c }),
        ],
      },
      "empty",
    );
  const f = sn(deviceStateEntity),
    u = $i.has(s.state),
    h = Hs.has(s.domain),
    m = o ? "同步中" : u ? "不可用" : h ? "只读" : f ? "运行中" : "待机",
    y = Ti(s),
    w = (j, x) => l(j, x),
    b = !e;
  return t.jsxs("section", {
    className: `control-card ${e ? "compact" : ""} ${o ? "is-busy" : ""}`,
    "aria-busy": o,
    children: [
      b &&
        t.jsxs("div", {
          className: "entity-control-hero",
          children: [
            t.jsx("span", {
              className: `domain-icon domain-${s.domain} entity-hero-icon ${f ? "active" : ""}`,
              children: t.jsx(fs, { domain: s.domain, size: 25 }),
            }),
            t.jsxs("div", {
              children: [
                t.jsx("p", { className: "eyebrow", children: Be(s.domain) }),
                t.jsx("h2", {
                  children: s.deviceDisplayName ?? s.name,
                }),
                t.jsx("p", { className: "entity-id", children: s.entityId }),
              ],
            }),
            t.jsxs("span", {
              className: `control-sync-pill ${o ? "syncing" : !u && (f || h) ? "online" : ""}`,
              children: [t.jsx("i", {}), m],
            }),
          ],
        }),
      b &&
        t.jsxs("div", {
          className: `state-readout ${f ? "active" : ""}`,
          children: [
            t.jsxs("span", { children: [t.jsx("i", {}), "当前状态"] }),
            t.jsx("strong", { children: c }),
          ],
        }),
      b &&
        y.length > 0 &&
        t.jsx("div", {
          className: "entity-attribute-grid",
          "aria-label": "设备关键属性",
          children: y.map((j) =>
            t.jsxs(
              "div",
              {
                children: [
                  t.jsx("small", { children: j.label }),
                  t.jsx("strong", { children: j.value }),
                ],
              },
              j.key,
            ),
          ),
        }),
      s.deviceControlPanelId
        ? t.jsx(CustomDeviceControls, {
            busy: o || u,
            compact: e,
            entity: s,
            run: w,
          })
        : t.jsx(qi, {
            active: f,
            busy: o || u,
            compact: e,
            entity: s,
            run: w,
          }),
      i &&
        t.jsx("p", { className: "control-error", role: "status", children: i }),
    ],
  });
}
var Yi = cr();
function Ks(e) {
  const s = [];
  return (
    L.Children.forEach(e, (r) => {
      L.isValidElement(r) &&
        (r.type === "option"
          ? s.push(r)
          : r.props.children && s.push(...Ks(r.props.children)));
    }),
    s
  );
}
function ka({
  children: e,
  className: s = "",
  disabled: r,
  value: o,
  defaultValue: n,
  onChange: i,
  onBlur: a,
  onFocus: c,
  "aria-label": l,
  id: f,
  name: u,
  ...h
}) {
  const m = L.useId(),
    y = f ?? m,
    w = L.useRef(null),
    b = L.useRef(null),
    [j, x] = L.useState(!1),
    [k, G] = L.useState(0),
    [C, O] = L.useState(String(n ?? "")),
    [N, E] = L.useState(),
    d = L.useMemo(() => Ks(e), [e]),
    g = String(o ?? C),
    _ = Math.max(
      0,
      d.findIndex((P) => String(P.props.value ?? "") === g),
    ),
    M = d[_];
  L.useEffect(() => {
    if (!j) return;
    const P = () => {
        var B;
        const z = (B = w.current) == null ? void 0 : B.getBoundingClientRect();
        if (!z) return;
        const I = Math.min(360, window.innerHeight * 0.5),
          F = window.innerHeight - z.bottom - 8,
          S = F < Math.min(220, I) && z.top > F;
        E({
          left: Math.max(
            8,
            Math.min(z.left, window.innerWidth - Math.max(z.width, 280) - 8),
          ),
          width: Math.min(Math.max(z.width, 280), window.innerWidth - 16),
          maxHeight: I,
          ...(S
            ? { bottom: window.innerHeight - z.top + 5 }
            : { top: z.bottom + 5 }),
        });
      },
      T = (z) => {
        var F, S;
        const I = z.target;
        !((F = w.current) != null && F.contains(I)) &&
          !((S = b.current) != null && S.contains(I)) &&
          x(!1);
      };
    return (
      P(),
      document.addEventListener("pointerdown", T),
      window.addEventListener("resize", P),
      window.addEventListener("scroll", P, !0),
      () => {
        (document.removeEventListener("pointerdown", T),
          window.removeEventListener("resize", P),
          window.removeEventListener("scroll", P, !0));
      }
    );
  }, [j]);
  function p(P) {
    const T = d[P];
    if (!T || T.props.disabled) return;
    const z = String(T.props.value ?? "");
    (O(z),
      x(!1),
      i == null ||
        i({
          target: { value: z, name: u },
          currentTarget: { value: z, name: u },
        }));
  }
  function v(P) {
    var I;
    if (P.key === "Escape") {
      x(!1);
      return;
    }
    if (P.key === "Enter" || P.key === " ") {
      (P.preventDefault(), j ? p(k) : x(!0));
      return;
    }
    if (P.key !== "ArrowDown" && P.key !== "ArrowUp") return;
    P.preventDefault();
    const T = P.key === "ArrowDown" ? 1 : -1;
    let z = j ? k : _;
    do z = (z + T + d.length) % d.length;
    while ((I = d[z]) != null && I.props.disabled && z !== k);
    (G(z), x(!0));
  }
  return t.jsxs("div", {
    ref: w,
    className: `app-select ${j ? "open" : ""} ${r ? "disabled" : ""} ${s}`,
    children: [
      t.jsx("select", {
        id: y,
        name: u,
        value: g,
        disabled: r,
        onChange: i,
        "aria-hidden": "true",
        tabIndex: -1,
        ...h,
        children: e,
      }),
      t.jsxs("button", {
        type: "button",
        className: "app-select-trigger",
        disabled: r,
        "aria-label": l,
        "aria-haspopup": "listbox",
        "aria-expanded": j,
        "aria-controls": `${y}-listbox`,
        onFocus: (P) => (c == null ? void 0 : c(P)),
        onBlur: (P) => (a == null ? void 0 : a(P)),
        onClick: () => {
          (G(_), x((P) => !P));
        },
        onKeyDown: v,
        children: [
          t.jsx("span", {
            children: (M == null ? void 0 : M.props.children) ?? "请选择",
          }),
          t.jsx(yr, { size: 15 }),
        ],
      }),
      j &&
        N &&
        Yi.createPortal(
          t.jsx("div", {
            ref: b,
            id: `${y}-listbox`,
            className: "app-select-menu",
            style: N,
            role: "listbox",
            "aria-label": l,
            children: d.map((P, T) =>
              t.jsxs(
                "button",
                {
                  type: "button",
                  role: "option",
                  "aria-selected": T === _,
                  disabled: P.props.disabled,
                  className: T === k ? "active" : "",
                  onPointerMove: () => G(T),
                  onClick: () => p(T),
                  children: [
                    t.jsx("span", { children: P.props.children }),
                    T === _ && t.jsx(mr, { size: 14 }),
                  ],
                },
                String(P.key ?? P.props.value ?? T),
              ),
            ),
          }),
          document.body,
        ),
    ],
  });
}
export {
  pe as $,
  ka as A,
  Ji as B,
  mr as C,
  yr as D,
  ta as E,
  Ma as F,
  oa as G,
  sa as H,
  gs as I,
  tn as J,
  rs as K,
  Je as L,
  aa as M,
  on as N,
  cn as O,
  na as P,
  wa as Q,
  va as R,
  ss as S,
  la as T,
  bt as U,
  en as V,
  fs as W,
  xa as X,
  mt as Y,
  fa as Z,
  ho as _,
  xs as a,
  Ho as a0,
  pa as a1,
  To as a2,
  ga as a3,
  Ro as a4,
  Io as a5,
  ma as a6,
  Fe as a7,
  Qt as a8,
  Jt as a9,
  rt as aa,
  jt as ab,
  yo as ac,
  kr as ad,
  Rt as ae,
  es as af,
  ts as ag,
  qr as ah,
  ys as b,
  Be as c,
  ua as d,
  rn as e,
  ps as f,
  ha as g,
  Ve as h,
  is as i,
  ba as j,
  nn as k,
  js as l,
  ja as m,
  sn as n,
  Ae as o,
  ra as p,
  ea as q,
  ko as r,
  ia as s,
  ca as t,
  da as u,
  _a as v,
  os as w,
  ot as x,
  ln as y,
  ya as z,
};

export {Ki as CameraLiveView};
