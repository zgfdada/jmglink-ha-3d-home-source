export function normalizeMotionLogic(value) {
  if (value === undefined) return undefined;
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    value.version !== 1 ||
    typeof value.code !== "string" ||
    value.code.length > 24000 ||
    !value.code.trim()
  )
    throw Error("动效代码需为 version 1 的 JavaScript，最多 24000 字符");
  return { version: 1, code: value.code };
}
export function normalizeMotionShader(value, type) {
  if (value === undefined) return undefined;
  if (
    type !== "scan" ||
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  )
    throw Error("自定义着色器仅适用于表面扫光");
  const result = {};
  for (const field of ["vertex", "fragment"])
    if (value[field] !== undefined) {
      if (
        typeof value[field] !== "string" ||
        !value[field].trim() ||
        value[field].length > 24000
      )
        throw Error("着色器代码无效或超过 24000 字符");
      result[field] = value[field];
    }
  return result;
}
export function builtinMotionCode(type) {
  const common =
    "// ctx：time 秒、delta 秒、value 映射值、phase 累积进度、angle 积分角度（度）、params 默认参数\n// 返回值仅影响当前部件；可使用 Math 编写自己的运动算法。\n";
  const bodies = {
    translate:
      'const offset = [0, 0, 0];\n  offset["xyz".indexOf(ctx.params.axis)] = ctx.value;\n  // 例如往复运动：offset[1] = Math.sin(ctx.time * 2) * 0.25;\n  return { offset };',
    rotate:
      "// 可替换为 Math.sin(ctx.time * 2) * 45，形成往复摆动。\n  return { angle: ctx.value };",
    spin: "// angle 为按转速积分的角度，也可自行按时间计算。\n  return { angle: ctx.angle };",
    scale: "return { value: Math.max(0.001, ctx.value) };",
    visible: "return { visible: ctx.value >= 0.5 };",
    color:
      "return { color: ctx.params.color, mix: ctx.mapped ? Math.max(0, Math.min(1, ctx.value)) : 1 };",
    emissive:
      'const p = ctx.params;\n  const cycle = Math.sin(ctx.time * Math.PI * 2 * Math.abs(p.speed));\n  const wave = p.mode === "breathe" ? 0.3 + 0.7 * (0.5 + 0.5 * cycle)\n    : p.mode === "blink" ? (cycle > 0 ? 1 : 0) : 1;\n  return { color: p.color, wave, intensity: ctx.mapped ? Math.max(0, ctx.value) : p.intensity };',
    flow: "// 自定义光点数量、间距和运动进度（范围 0–1）。\n  const progress = Array.from({ length: 5 }, (_, i) => ((ctx.phase + i / 5) % 1 + 1) % 1);\n  return { progress, color: ctx.params.color, opacity: 0.95, trailOpacity: 0.22 };",
    scan: "// 控制扫描进度；光带形状与边缘效果在 GLSL 片元代码中修改。\n  const phase = ((ctx.phase % 1) + 1) % 1;\n  return { phase, color: ctx.params.color, width: ctx.params.width, intensity: ctx.params.intensity };",
  };
  return {
    version: 1,
    code: `${common}function update(ctx) {\n  ${bodies[type] ?? "return {};"}\n}\n`,
  };
}
export function validateMotionOutput(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw))
    throw Error("update(ctx) 必须返回对象");
  if (!Object.keys(raw).length)
    throw Error("update(ctx) 至少返回一个动效字段，不能返回 Promise");
  const result = {};
  const ranges = {
    value: [-10000, 10000],
    angle: [-1e7, 1e7],
    phase: [-1e7, 1e7],
    wave: [0, 20],
    intensity: [0, 20],
    width: [0.02, 1],
    mix: [0, 1],
    opacity: [0, 1],
    trailOpacity: [0, 1],
  };
  for (const [key, value] of Object.entries(raw)) {
    if (key === "progress") {
      if (
        !Array.isArray(value) ||
        !value.length ||
        value.length > 32 ||
        value.some((v) => !Number.isFinite(v) || v < 0 || v > 1)
      )
        throw Error("progress 需为 1–32 个 0–1 的进度值");
      result.progress = [...value];
      continue;
    }
    if (key === "offset") {
      if (
        !Array.isArray(value) ||
        value.length !== 3 ||
        value.some((v) => !Number.isFinite(v) || Math.abs(v) > 10000)
      )
        throw Error("offset 需为三个有限数值");
      result.offset = [...value];
    } else if (key === "color") {
      if (typeof value !== "string" || !/^#[0-9a-f]{6}$/i.test(value))
        throw Error("color 需为六位十六进制颜色");
      result.color = value;
    } else if (key === "visible") {
      if (typeof value !== "boolean") throw Error("visible 需为布尔值");
      result.visible = value;
    } else if (ranges[key]) {
      const [min, max] = ranges[key];
      if (!Number.isFinite(value) || value < min || value > max)
        throw Error(`${key} 超出允许范围`);
      result[key] = value;
    } else throw Error(`不支持的返回字段：${key.slice(0, 40)}`);
  }
  return result;
}
