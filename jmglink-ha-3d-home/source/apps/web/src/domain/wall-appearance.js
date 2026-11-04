// The translucent display tint must never replace the user's opaque wall material.
export function wallTintBlend(opacity, presentation = true, walkthrough = false) {
  if (!presentation || walkthrough) return 0;
  const value = Number.isFinite(opacity) ? Math.max(0, Math.min(1, opacity)) : 1;
  return Math.min(1, (1 - value) / 0.2);
}
