export function materialColorKey(material) {
  const hex = material?.color?.getHexString?.();
  return typeof hex === "string" && /^[0-9a-f]{6}$/i.test(hex)
    ? `#${hex.toLowerCase()}`
    : null;
}

export function modelMaterialPalette(root) {
  const counts = new Map();
  root.traverse((part) => {
    if (!part.isMesh) return;
    for (const material of Array.isArray(part.material)
      ? part.material
      : [part.material]) {
      const color = materialColorKey(material);
      if (color) counts.set(color, (counts.get(color) ?? 0) + 1);
    }
  });
  return [...counts].map(([color, count]) => ({ color, count }));
}

export function overrideModelMaterial(material, appearance) {
  if (!material) return material;
  const sourceColor = materialColorKey(material);
  const mappedColor = sourceColor && appearance.materialColors?.[sourceColor];
  if (
    !mappedColor &&
    !appearance.colorOverride &&
    !appearance.metalnessOverride &&
    !appearance.roughnessOverride
  )
    return material;
  const copy = material.clone();
  if (mappedColor) copy.color?.set(mappedColor);
  else if (appearance.colorOverride) copy.color?.set(appearance.color);
  if (appearance.metalnessOverride && "metalness" in copy)
    copy.metalness = appearance.metalness;
  if (appearance.roughnessOverride && "roughness" in copy)
    copy.roughness = appearance.roughness;
  return copy;
}
