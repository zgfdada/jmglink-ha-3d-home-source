export const DEFAULT_OUTLINE_SCALE = 10;
export function outlineThickness(scale) { return 0.0052 * scale / 100; }
// Update existing shader uniforms; do not rebuild the renderer, meshes or camera.
export function updateOutlineThickness(defaults, cache, thickness) {
  defaults.outlineThickness.value = thickness;
  for (const entry of Object.values(cache)) entry.material.uniforms.outlineThickness.value = thickness;
}
