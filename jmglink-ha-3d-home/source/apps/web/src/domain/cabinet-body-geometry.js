import { Shape, ExtrudeGeometry } from "three";

// Preserve the authored footprint; only remove redundant collinear points from
// the solid body's caps. Door/front segment boundaries remain untouched.
export function cabinetBodyContour(points) {
  if (!Array.isArray(points) || points.length < 3 || points.some(p => !Array.isArray(p) || p.length < 2 || !p.slice(0, 2).every(Number.isFinite))) {
    throw new RangeError("Cabinet body needs a finite polygon");
  }
  const clean = points.map(p => [p[0], p[1]]);
  const same = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]) < 1e-9;
  for (let i = clean.length - 1; i >= 0 && clean.length > 3; i--) {
    if (same(clean[i], clean[(i + 1) % clean.length])) clean.splice(i, 1);
  }
  let changed = true;
  while (changed && clean.length > 3) {
    changed = false;
    for (let i = 0; i < clean.length; i++) {
      const a = clean[(i + clean.length - 1) % clean.length], b = clean[i], c = clean[(i + 1) % clean.length];
      const length = Math.hypot(c[0] - a[0], c[1] - a[1]);
      const cross = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
      const between = (b[0] - a[0]) * (b[0] - c[0]) + (b[1] - a[1]) * (b[1] - c[1]) <= 1e-16;
      if (length > 0 && Math.abs(cross) / length < 1e-9 && between) {
        clean.splice(i, 1); changed = true; break;
      }
    }
  }
  return clean;
}

export function createCabinetBodyGeometry(points, height) {
  if (!Number.isFinite(height) || height <= 0) throw new RangeError("Cabinet height must be positive");
  const contour = cabinetBodyContour(points), shape = new Shape();
  contour.forEach(([x, z], index) => index ? shape.lineTo(x, -z) : shape.moveTo(x, -z));
  shape.closePath();
  return new ExtrudeGeometry(shape, { depth: height, bevelEnabled: false, curveSegments: 1 });
}
