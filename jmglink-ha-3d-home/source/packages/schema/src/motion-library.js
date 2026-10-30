import {
  MOTION_EFFECTS,
  normalizePartMotionRules,
  partMotionIssues,
} from "./part-motion.js";
import {builtinMotionCode} from './motion-code.js';

export const MOTION_RESOURCE_FORMAT = "ha3d-motion-library";
export const MOTION_CATEGORIES = {
  transform: "变换",
  appearance: "外观",
  light: "光效",
};
const info = {
  translate: [
    "transform",
    "沿模型局部轴移动部件，可用于开合、升降与行程。",
    { axis: "y", from: 0, to: 0.25 },
  ],
  rotate: [
    "transform",
    "围绕局部轴心转到指定角度，可用于门盖和摆臂。",
    { axis: "y", from: 0, to: 90 },
  ],
  spin: [
    "transform",
    "持续旋转部件，可用于风扇、滚筒和轮轴。",
    { axis: "y", to: 90 },
  ],
  scale: [
    "transform",
    "沿局部轴缩放部件，可用于进度和尺寸表达。",
    { axis: "y", from: 1, to: 1.4 },
  ],
  visible: [
    "appearance",
    "条件满足时显示或隐藏部件，也可选择整个模型。",
    { from: 1, to: 0 },
  ],
  color: [
    "appearance",
    "改变部件表面颜色，保留模型原有材质。",
    { color: "#4d94ff" },
  ],
  emissive: [
    "light",
    "设置常亮、呼吸或闪烁效果，表达运行或提醒。",
    { color: "#35cfff", mode: "breathe", intensity: 1.8 },
  ],
  flow: [
    "light",
    "沿局部路径移动光点，表达流向和能量传递。",
    {
      color: "#35cfff",
      path: [
        [-0.6, 0, 0],
        [0.6, 0, 0],
        [0.6, 0.5, 0],
      ],
    },
  ],
  scan: [
    "light",
    "沿模型表面循环扫描，无需 UV 或绘制路径。",
    { axis: "z", color: "#35cfff", width: 0.22, intensity: 1.8 },
  ],
};
export function normalizeMotionResource(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw))
    throw Error("动效资源格式无效");
  if (!/^(?:builtin|custom)\.motion\.[a-z0-9][a-z0-9._-]{0,100}$/.test(raw.id))
    throw Error("动效资源 ID 无效");
  const name = String(raw.name ?? "").trim();
  if (!name || name.length > 80) throw Error("动效名称需为 1–80 字");
  const rule = normalizePartMotionRules([
    {
      id: "resource-preview",
      targets: ["root"],
      capabilityId: "demo",
      condition: { operator: "eq", value: "on" },
      effect: {...raw.effect,program:raw.effect?.program??builtinMotionCode(raw.effect?.type)},
      transitionMs: raw.transitionMs,
    },
  ])[0];
  const issues = partMotionIssues(
    [rule],
    [{ capabilityId: "demo", dataType: "string" }],
  );
  if (issues.length) throw Error(issues.join("；"));
  return {
    id: raw.id,
    name,
    description: String(raw.description ?? "").slice(0, 400),
    category: info[rule.effect.type][0],
    builtin: raw.id.startsWith("builtin."),
    effect: rule.effect,
    transitionMs: rule.transitionMs,
    version: Number.isInteger(raw.version) && raw.version > 0 ? raw.version : 1,
  };
}
export function builtinMotionResources() {
  return Object.entries(MOTION_EFFECTS).map(([type, name]) =>
    normalizeMotionResource({
      id: `builtin.motion.${type}`,
      name,
      description: info[type][1],
      effect: { type, ...info[type][2] },
      transitionMs: 300,
    }),
  );
}
export function motionResourceRule(resource, context = {}) {
  const value = normalizeMotionResource(resource);
  return normalizePartMotionRules([
    {
      ...context,
      id: context.id ?? "resource-preview",
      name: context.name ?? value.name,
      targets: context.targets ?? ["root"],
      capabilityId: context.capabilityId ?? "demo",
      condition: context.condition ?? { operator: "eq", value: "on" },
      effect: value.effect,
      transitionMs: value.transitionMs,
      motionResourceId: value.id,
    },
  ])[0];
}
export function normalizeMotionLibraryPackage(raw) {
  if (
    raw?.format !== MOTION_RESOURCE_FORMAT ||
    raw.schemaVersion !== 1 ||
    !Array.isArray(raw.resources) ||
    raw.resources.length > 300
  )
    throw Error("动效资源库文件格式无效");
  const resources = raw.resources.map(normalizeMotionResource),
    ids = new Set();
  for (const item of resources) {
    if (ids.has(item.id)) throw Error("动效资源 ID 重复");
    ids.add(item.id);
    if (
      item.builtin &&
      !builtinMotionResources().some(
        (b) => b.id === item.id && b.effect.type === item.effect.type,
      )
    )
      throw Error("内置动效类型不可更改");
  }
  return resources;
}
