export const DEFAULT_SHOWER_CORNER_CUT = 0.24;
export const SHOWER_STYLE_OPTIONS = [
  { id: "diamond", label: "钻石型" },
  { id: "rectangular", label: "长方形" },
  { id: "curved", label: "弧形" },
];

export function normalizeShowerStyle(value) {
  return SHOWER_STYLE_OPTIONS.some((style) => style.id === value)
    ? value
    : "diamond";
}

export function normalizeShowerCornerCut(value, width, depth) {
  const limit = Math.max(0.08, Math.min(width, depth) / 2 - 0.08);
  const number = Number(value);
  const fallback = Math.min(DEFAULT_SHOWER_CORNER_CUT, limit);
  return Math.max(0.08, Math.min(limit, Number.isFinite(number) ? number : fallback));
}

// Local +Z is the front. The first and last edges are the two wall sides;
// all intermediate edges are glass. The diamond has exactly three glass faces.
export function diamondShowerOutline(width, depth, cornerCut) {
  const cut = normalizeShowerCornerCut(cornerCut, width, depth);
  return [
    [-width / 2, -depth / 2],
    [width / 2, -depth / 2],
    [width / 2, depth / 2 - cut],
    [width / 2 - cut, depth / 2],
    [-width / 2, depth / 2],
  ];
}

export function showerEnclosureOutline(width, depth, style, cornerCut) {
  const normalizedStyle = normalizeShowerStyle(style);
  if (normalizedStyle === "diamond") {
    return diamondShowerOutline(width, depth, cornerCut);
  }
  if (normalizedStyle === "rectangular") {
    return [
      [-width / 2, -depth / 2],
      [width / 2, -depth / 2],
      [width / 2, depth / 2],
      [-width / 2, depth / 2],
    ];
  }
  const points = [[-width / 2, -depth / 2]];
  for (let step = 0; step <= 16; step += 1) {
    const angle = (step / 16) * (Math.PI / 2);
    points.push([
      -width / 2 + width * Math.cos(angle),
      -depth / 2 + depth * Math.sin(angle),
    ]);
  }
  return points;
}

export function showerGlassSegments(width, depth, style, cornerCut) {
  const outline = showerEnclosureOutline(width, depth, style, cornerCut);
  return outline.slice(1, -1).map((start, index) => [start, outline[index + 2]]);
}

export function pointInShowerOutline(point, outline, tolerance = 0) {
  let inside = false;
  for (let index = 0; index < outline.length; index += 1) {
    const start = outline[index];
    const end = outline[(index + 1) % outline.length];
    const dx = end[0] - start[0];
    const dz = end[1] - start[1];
    const projection = Math.max(0, Math.min(1,
      ((point[0] - start[0]) * dx + (point[1] - start[1]) * dz) /
      (dx * dx + dz * dz),
    ));
    if (Math.hypot(point[0] - start[0] - projection * dx,
      point[1] - start[1] - projection * dz) <= tolerance) return true;
    if ((start[1] > point[1]) !== (end[1] > point[1]) &&
      point[0] < start[0] + (point[1] - start[1]) * dx / dz) inside = !inside;
  }
  return inside;
}
