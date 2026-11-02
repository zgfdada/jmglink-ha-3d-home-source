// 展示模式隐藏屋顶，不应同时取消墙体的遮光能力。
export const WALL_SHADOW_PROPS = Object.freeze({castShadow: true, receiveShadow: true});
export function normalizeShadowIntensity(value) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 1;
}
export function readShadowIntensity() {
  try {
    const value = globalThis.localStorage?.getItem('ha3d.shadowIntensity');
    return value === null || value === undefined ? 1 : normalizeShadowIntensity(Number(value));
  } catch { return 1; }
}
export function storeShadowIntensity(value) {
  try { globalThis.localStorage?.setItem('ha3d.shadowIntensity', String(normalizeShadowIntensity(value))); } catch {}
}

// 米制户型：原来的 4.5cm 法线偏移接近薄墙厚度，会使墙角漏光。
export const SUN_SHADOW_PROPS = Object.freeze({
  'shadow-bias': -0.00005,
  'shadow-normalBias': 0.003,
  'shadow-camera-near': 0.5,
  'shadow-camera-far': 80,
});
