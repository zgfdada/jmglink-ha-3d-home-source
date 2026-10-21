export const VANITY_MIRROR_DEFAULTS = Object.freeze({
  width: 0.9,
  depth: 0.55,
  vanityHeight: 0.82,
  basinWidth: 0.5,
  basinDepth: 0.34,
  mirrorWidth: 0.9,
  mirrorDepth: 0.16,
  mirrorHeight: 0.72,
  mirrorGap: 0.28,
});

function bounded(value, fallback, minimum, maximum) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(maximum, Math.max(minimum, value))
    : fallback;
}

export function normalizeVanityMirrorCabinet(value = {}) {
  const source = value && typeof value === "object" ? value : {};
  const width = bounded(source.width, VANITY_MIRROR_DEFAULTS.width, 0.45, 3);
  const depth = bounded(source.depth, VANITY_MIRROR_DEFAULTS.depth, 0.35, 1);
  const vanityHeight = bounded(
    source.vanityHeight,
    VANITY_MIRROR_DEFAULTS.vanityHeight,
    0.5,
    1.2,
  );
  const mirrorGap = bounded(
    source.mirrorGap,
    VANITY_MIRROR_DEFAULTS.mirrorGap,
    0.08,
    1,
  );
  const mirrorHeight = bounded(
    source.mirrorHeight,
    VANITY_MIRROR_DEFAULTS.mirrorHeight,
    0.3,
    1.2,
  );
  return {
    width,
    depth,
    vanityHeight,
    basinWidth: bounded(
      source.basinWidth,
      Math.min(VANITY_MIRROR_DEFAULTS.basinWidth, width - 0.1),
      0.2,
      width - 0.1,
    ),
    basinDepth: bounded(
      source.basinDepth,
      Math.min(VANITY_MIRROR_DEFAULTS.basinDepth, depth - 0.08),
      0.18,
      depth - 0.08,
    ),
    mirrorWidth: bounded(
      source.mirrorWidth,
      Math.min(VANITY_MIRROR_DEFAULTS.mirrorWidth, width),
      0.3,
      width,
    ),
    mirrorDepth: bounded(
      source.mirrorDepth,
      Math.min(VANITY_MIRROR_DEFAULTS.mirrorDepth, depth),
      0.08,
      depth,
    ),
    mirrorHeight,
    mirrorGap,
    height: Number((vanityHeight + mirrorGap + mirrorHeight).toFixed(4)),
  };
}
