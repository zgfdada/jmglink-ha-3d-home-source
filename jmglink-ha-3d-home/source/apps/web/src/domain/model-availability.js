const originalMaterials = new WeakMap();

export function applyModelAvailability(root, unavailable) {
  if (!root) return;
  root.traverse((part) => {
    if (!part.isMesh || !part.material) return;
    for (const material of Array.isArray(part.material)
      ? part.material
      : [part.material]) {
      if (!material) continue;
      let original = originalMaterials.get(material);
      if (!original) {
        original = {
          color: material.color?.clone(),
          emissive: material.emissive?.clone(),
          emissiveIntensity: material.emissiveIntensity,
          opacity: material.opacity,
          transparent: material.transparent,
        };
        originalMaterials.set(material, original);
      }
      if (original.color) {
        material.color.copy(original.color);
        if (unavailable) {
          const { r, g, b } = original.color;
          const gray = r * 0.2126 + g * 0.7152 + b * 0.0722;
          material.color.lerp(
            original.color.clone().setRGB(gray, gray, gray),
            0.72,
          );
        }
      }
      if (original.emissive) {
        material.emissive.copy(original.emissive);
        if (unavailable) material.emissive.multiplyScalar(0.25);
      }
      if (original.emissiveIntensity !== undefined)
        material.emissiveIntensity = unavailable
          ? original.emissiveIntensity * 0.25
          : original.emissiveIntensity;
      material.opacity = unavailable ? original.opacity * 0.5 : original.opacity;
      material.transparent = unavailable || original.transparent;
      material.needsUpdate = true;
    }
  });
}
