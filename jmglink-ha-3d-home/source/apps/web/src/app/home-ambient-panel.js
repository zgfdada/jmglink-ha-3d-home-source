import FixtureLightSettings from "../components/fixture-light-settings.jsx";
import LightBeamSettings from "../components/light-beam-settings.jsx";
import { resolveSolarDirection } from "../../../../packages/schema/src/solar-direction.js";
import { resolveMoonlight } from "../../../../packages/schema/src/moonlight.js";
import NorthDirectionControl from "../components/north-direction-control.jsx";
import MoonlightStatus from "../components/moonlight-status.jsx";
import { j as e } from "../vendor/three.js";
import "./home-ambient-panel.css";
export default function HomeAmbientPanel({
  manualLight,
  lightLevel,
  setManualLight,
  ambientLight,
  changeAmbientLight,
  backgroundImage,
  importBackground,
  backgroundNotice,
  celestialSettings,
  changeCelestialSettings,
  shadowIntensity,
  setShadowIntensity,
  storeShadowIntensity,
  northAngle,
  setNorthPreview,
  t,
  s,
  i,
  solarClock,
  furnitureColor,
  furnitureColorFill,
  setFurnitureColorFill,
  setFurnitureColor,
  getProject,
  saveProject,
  resetBackground,
}) {
  return e.jsxs("section", {
    className: "home-light-settings",
    role: "dialog",
    "aria-label": "环境光调节",
    children: [
      e.jsx("header", {
        children: e.jsx("strong", {
          children: manualLight === null ? "环境光 · 自动" : "环境光 · 手动",
        }),
      }),
      e.jsxs("section", {
        className: "home-light-group",
        children: [
          e.jsx("h3", { children: "环境照明" }),
          e.jsxs("label", {
            children: [
              `环境光强度 · ${Math.round(lightLevel * 100)}%`,
              e.jsx("input", {
                type: "range",
                min: 0,
                max: 100,
                step: 1,
                "aria-label": "环境光强度",
                value: Math.round(lightLevel * 100),
                onChange: (event) =>
                  setManualLight(Number(event.target.value) / 100),
              }),
            ],
          }),
          e.jsx("div", {
            className: "light-presets",
            children: [
              ["夜间", 0],
              ["黄昏", 0.35],
              ["白天", 1],
            ].map(([name, value]) =>
              e.jsx(
                "button",
                { onClick: () => setManualLight(value), children: name },
                name,
              ),
            ),
          }),
          e.jsxs("label", {
            className: "home-ambient-toggle",
            children: [
              e.jsxs("span", {
                children: [
                  e.jsx("strong", { children: "自动环境光" }),
                  e.jsx("small", { children: "关闭时恢复上次手动强度" }),
                ],
              }),
              e.jsx("input", {
                type: "checkbox",
                role: "switch",
                "aria-label": "自动环境光",
                checked: ambientLight.automatic,
                onChange: (event) =>
                  changeAmbientLight({ automatic: event.target.checked }),
              }),
            ],
          }),
        ],
      }),
      e.jsxs("section", {
        className: "home-light-group",
        children: [
          e.jsx("h3", { children: "场景外观" }),
          e.jsxs("div", {
            className: "home-furniture-color",
            children: [
              e.jsxs("label", {
                children: [
                  "家具颜色",
                  e.jsx("input", {
                    type: "color",
                    value: furnitureColor || "#ffffff",
                    onChange: (event) => setFurnitureColor(event.target.value),
                  }),
                ],
              }),
              e.jsx("button", {
                type: "button",
                onClick: () =>
                  setFurnitureColor(furnitureColor ? "" : "#ffffff"),
                children: furnitureColor ? "沿用风格颜色" : "使用纯白",
              }),
            ],
          }),
          e.jsxs("label", {
            children: [
              "家具颜色补偿 · " + furnitureColorFill + "%",
              e.jsx("input", {
                type: "range",
                min: 0,
                max: 45,
                step: 1,
                value: furnitureColorFill,
                "aria-label": "家具颜色补偿",
                onChange: (event) =>
                  setFurnitureColorFill(Number(event.target.value)),
              }),
            ],
          }),
          e.jsx("p", { children: "让家具在暗处保留底色。0% 关闭补偿。" }),
          e.jsx("p", {
            children: furnitureColor
              ? "自定义颜色 " +
                furnitureColor.toUpperCase() +
                "，保留受光明暗。"
              : "当前沿用家具风格颜色。",
          }),
          e.jsxs("label", {
            style: { marginTop: 14 },
            children: [
              `墙体透明度 · ${Math.round((1 - celestialSettings.wallOpacity) * 100)}%`,
              e.jsx("input", {
                type: "range",
                min: 0,
                max: 100,
                step: 1,
                "aria-label": "墙体透明度",
                value: Math.round((1 - celestialSettings.wallOpacity) * 100),
                onChange: (event) =>
                  changeCelestialSettings({
                    wallOpacity: 1 - Number(event.target.value) / 100,
                  }),
              }),
            ],
          }),
          e.jsx("p", {
            children:
              "0% 为不透明，100% 为完全透明；默认 45%。仅改变墙面显示，墙体始终遮挡灯光；室内漫游保持实体墙。",
          }),
          e.jsxs("label", {
            style: {
              display: "flex",
              alignItems: "center",
              gap: 8,
              margin: "12px 0",
            },
            children: [
              e.jsx("input", {
                type: "checkbox",
                style: { width: "auto" },
                "aria-label": "背景星光",
                checked: celestialSettings.starfield,
                onChange: (event) =>
                  changeCelestialSettings({ starfield: event.target.checked }),
              }),
              "背景星光",
            ],
          }),
          e.jsxs("div", {
            className: "home-background-controls",
            children: [
              e.jsx("strong", { children: "场景背景图片" }),
              e.jsx("small", {
                children: "替换户型模型后面的背景。仅保存在当前浏览器。",
              }),
              e.jsxs("label", {
                className: "home-background-picker",
                children: [
                  "选择背景图片",
                  e.jsx("input", {
                    type: "file",
                    "aria-label": "选择背景图片",
                    accept: "image/jpeg,image/png,image/webp",
                    onChange: (event) => {
                      importBackground(event.target.files?.[0]);
                      event.target.value = "";
                    },
                  }),
                ],
              }),
              backgroundImage &&
                e.jsx("button", {
                  onClick: resetBackground,
                  children: "恢复默认背景",
                }),
            ],
          }),
          backgroundNotice &&
            e.jsx("p", { role: "status", children: backgroundNotice }),
        ],
      }),
      e.jsxs("section", {
        className: "home-light-group",
        children: [
          e.jsx("h3", { children: "灯具效果" }),
          e.jsx(FixtureLightSettings, {}),
          e.jsx(LightBeamSettings, { project: t, entities: s }),
        ],
      }),
      e.jsxs("section", {
        className: "home-light-group",
        children: [
          e.jsx("h3", { children: "日月与阴影" }),
          ...[
            ["日光强度", "sunIntensity", 300],
            ["月光强度", "moonIntensity", 2000],
          ].map(([label, key, max]) =>
            e.jsxs(
              "label",
              {
                style: { marginTop: 14 },
                children: [
                  `${label} · ${Math.round(celestialSettings[key] * 100)}%`,
                  e.jsx("input", {
                    type: "range",
                    min: 0,
                    max,
                    step: 10,
                    "aria-label": label,
                    value: Math.round(celestialSettings[key] * 100),
                    onChange: (event) =>
                      changeCelestialSettings({
                        [key]: Number(event.target.value) / 100,
                      }),
                  }),
                ],
              },
              key,
            ),
          ),
          e.jsx("p", {
            children:
              "100% 为默认强度；月光可增强至 20 倍。日光只在白天、月光只在夜间且月亮升起时生效。",
          }),
          e.jsxs("label", {
            style: {
              display: "flex",
              alignItems: "center",
              gap: 8,
              margin: "12px 0",
            },
            children: [
              e.jsx("input", {
                type: "checkbox",
                style: { width: "auto" },
                "aria-label": "屋顶遮光",
                checked: celestialSettings.roofOcclusion,
                onChange: (event) =>
                  changeCelestialSettings({
                    roofOcclusion: event.target.checked,
                  }),
              }),
              "屋顶遮光",
            ],
          }),
          e.jsx("p", {
            children: celestialSettings.roofOcclusion
              ? "真实遮光：室内通过窗户受光。关闭后可观察室内日月投影。"
              : "展示模式：顶部光线可进入室内，便于观察投影；墙体仍然遮光。",
          }),
          e.jsxs("label", {
            children: [
              `阴影强度 · ${Math.round(shadowIntensity * 100)}%`,
              e.jsx("input", {
                type: "range",
                min: 0,
                max: 100,
                step: 1,
                "aria-label": "阴影强度",
                value: Math.round(shadowIntensity * 100),
                onChange: (event) => {
                  const value = Number(event.target.value) / 100;
                  setShadowIntensity(value);
                  storeShadowIntensity(value);
                },
              }),
            ],
          }),
          e.jsx("p", {
            children:
              "阴影强度独立调节，0% 隐藏投影，100% 为默认强度；设置保存在当前浏览器。",
          }),
          e.jsx(NorthDirectionControl, {
            value: northAngle,
            onChange: (value) => setNorthPreview({ projectId: t.id, value }),
            getProject,
            saveProject,
          }),
          e.jsx("p", {
            children:
              "自动模式跟随 HA 太阳高度与方位，结合户型北向计算日照；日落后关闭日光投影。手动模式仅调节三维环境明暗。",
          }),
          e.jsx("p", {
            children: (() => {
              const sun = resolveSolarDirection(s, northAngle);
              return sun.available
                ? `太阳方位 ${sun.azimuth.toFixed(1)}° · 高度 ${sun.elevation.toFixed(1)}° · 户型北向 ${northAngle}°`
                : "太阳角度数据不可用，暂用固定方向照明。";
            })(),
          }),
          e.jsx(MoonlightStatus, {
            moon: resolveMoonlight(s, northAngle, solarClock),
            connection: i,
            intensity: celestialSettings.moonIntensity,
          }),
        ],
      }),
    ],
  });
}
