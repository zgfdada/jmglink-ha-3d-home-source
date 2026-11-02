// Local X/Z metres, relative to placement position and yaw. No model-scale factors.
export const MAX_CURTAIN_NODES = 64;
const number = (v, fallback, min, max) =>
  Number.isFinite(Number(v))
    ? Math.max(min, Math.min(max, Number(v)))
    : fallback;
export const trackDistance = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
export function normalizeCurtainTrack(value) {
  if (!value || typeof value !== "object" || !Array.isArray(value.points))
    return undefined;
  const points = value.points
    .slice(0, MAX_CURTAIN_NODES)
    .filter(
      (p) =>
        Array.isArray(p) &&
        p.length >= 2 &&
        p.slice(0, 2).every((v) => typeof v === "number" && Number.isFinite(v)),
    )
    .map((p) => p.slice(0, 2).map((v) => Math.max(-100, Math.min(100, v))));
  if (points.length < 2) return undefined;
  if (validateCurtainTrack({ points })) return undefined;
  return {
    points,
    fabric: value.fabric === "sheer" ? "sheer" : "blackout",
    radius: number(value.radius, 0.08, 0, 1),
    wallOffset: number(value.wallOffset, 0.12, 0, 1),
    height: number(value.height, 2.5, 0.2, 8),
    drop: number(value.drop, 0.05, 0, 8),
    opening: ["start", "end", "split"].includes(value.opening)
      ? value.opening
      : "split",
  };
}
export function resolveCurtainTrack(device, floorHeight = 2.8) {
  floorHeight = number(floorHeight, 2.8, 0.3, 10);
  const saved = normalizeCurtainTrack(device.curtainTrack);
  if (saved) {
    saved.fabric = device.modelId === "cover.sheer" ? "sheer" : "blackout";
    saved.drop = Math.min(saved.drop, floorHeight - 0.2);
    saved.height = Math.min(saved.height, floorHeight - saved.drop);
    return saved;
  }
  // Read legacy scales only to preserve old physical dimensions. New tracks never scale.
  const sx = Math.abs(device.scale?.[0] ?? 1.16),
    sy = Math.abs(device.scale?.[1] ?? 1.16);
  const top = Math.max(
    0.2,
    Math.min(
      floorHeight,
      (device.position?.[1] ?? floorHeight - 0.2) + 0.17 * sy,
    ),
  );
  return {
    points: curtainPreset("line", 1.04 * sx),
    fabric: device.modelId === "cover.sheer" ? "sheer" : "blackout",
    radius: 0,
    wallOffset: 0.12,
    opening: "split",
    height: Math.min(0.9 * sy, top),
    drop: Math.max(0, floorHeight - top),
  };
}
export function curtainPreset(shape, width = 3.3, depth = 0.6) {
  width = number(width, 3.3, 0.3, 30);
  depth = number(depth, 0.6, 0.15, 15);
  return shape === "u"
    ? [
        [-width / 2, depth],
        [-width / 2, 0],
        [width / 2, 0],
        [width / 2, depth],
      ]
    : shape === "l"
      ? [
          [-width / 2, depth],
          [-width / 2, 0],
          [width / 2, 0],
        ]
      : [
          [-width / 2, 0],
          [width / 2, 0],
        ];
}
export function curtainLocalToWorld(point, device) {
  const yaw = device.rotation?.[1] || 0,
    c = Math.cos(yaw),
    s = Math.sin(yaw);
  return [
    device.position[0] + c * point[0] + s * point[1],
    device.position[2] - s * point[0] + c * point[1],
  ];
}
export function curtainWorldToLocal(point, device) {
  const yaw = device.rotation?.[1] || 0,
    c = Math.cos(yaw),
    s = Math.sin(yaw),
    x = point[0] - device.position[0],
    z = point[1] - device.position[2];
  return [c * x - s * z, s * x + c * z];
}
function cross(a, b, c) {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}
function intersects(a, b, c, d) {
  const on = (a, b, p) =>
    Math.abs(cross(a, b, p)) < 1e-7 &&
    p[0] >= Math.min(a[0], b[0]) - 1e-7 &&
    p[0] <= Math.max(a[0], b[0]) + 1e-7 &&
    p[1] >= Math.min(a[1], b[1]) - 1e-7 &&
    p[1] <= Math.max(a[1], b[1]) + 1e-7;
  return (
    (cross(a, b, c) * cross(a, b, d) < 0 &&
      cross(c, d, a) * cross(c, d, b) < 0) ||
    on(a, b, c) ||
    on(a, b, d) ||
    on(c, d, a) ||
    on(c, d, b)
  );
}
export function validateCurtainTrack(track) {
  const p = track?.points;
  if (!Array.isArray(p) || p.length < 2) return "至少绘制两个节点。";
  if (p.length > MAX_CURTAIN_NODES)
    return `最多支持 ${MAX_CURTAIN_NODES} 个节点。`;
  if (
    p.some(
      (v) =>
        !Array.isArray(v) ||
        v.length < 2 ||
        !v.slice(0, 2).every(Number.isFinite) ||
        v.some((n) => Math.abs(n) > 100),
    )
  )
    return "节点坐标无效或超出范围。";
  for (let i = 1; i < p.length; i++) {
    if (trackDistance(p[i - 1], p[i]) < 0.05)
      return `线段 ${i} 太短，至少需要 0.05 m。`;
    if (
      i > 1 &&
      Math.abs(cross(p[i - 2], p[i - 1], p[i])) < 1e-7 &&
      (p[i - 1][0] - p[i - 2][0]) * (p[i][0] - p[i - 1][0]) +
        (p[i - 1][1] - p[i - 2][1]) * (p[i][1] - p[i - 1][1]) <
        0
    )
      return "轨道不能原路折返。";
    for (let j = 1; j < i - 1; j++)
      if (intersects(p[j - 1], p[j], p[i - 1], p[i]))
        return "轨道不能自相交或闭合，请调整转角。";
  }
  return "";
}
export function roundedCurtainPath(track) {
  const p = track?.points || [];
  if (p.length < 2) return p;
  const out = [p[0]],
    radius = Math.max(0, Number(track.radius) || 0);
  for (let i = 1; i < p.length - 1; i++) {
    const a = p[i - 1],
      b = p[i],
      c = p[i + 1],
      ab = trackDistance(a, b),
      bc = trackDistance(b, c),
      r = Math.min(radius, ab * 0.4, bc * 0.4);
    if (r < 0.001) {
      out.push(b);
      continue;
    }
    const u = [
        b[0] + ((a[0] - b[0]) * r) / ab,
        b[1] + ((a[1] - b[1]) * r) / ab,
      ],
      v = [b[0] + ((c[0] - b[0]) * r) / bc, b[1] + ((c[1] - b[1]) * r) / bc];
    out.push(u);
    for (let n = 1; n <= 8; n++) {
      const t = n / 8;
      out.push([
        (1 - t) ** 2 * u[0] + 2 * (1 - t) * t * b[0] + t * t * v[0],
        (1 - t) ** 2 * u[1] + 2 * (1 - t) * t * b[1] + t * t * v[1],
      ]);
    }
  }
  out.push(p.at(-1));
  return out;
}
export function curtainPathMetrics(track) {
  const points = roundedCurtainPath(track),
    distances = [0];
  for (let i = 1; i < points.length; i++)
    distances.push(distances.at(-1) + trackDistance(points[i - 1], points[i]));
  return { points, distances, length: distances.at(-1) || 0 };
}
export function curtainPointAt(metrics, distance) {
  const { points, distances, length } = metrics;
  if (points.length < 2) return { point: points[0] || [0, 0], normal: [0, 1] };
  const d = Math.max(0, Math.min(length, distance));
  let i = 1;
  while (i < points.length - 1 && distances[i] < d) i++;
  const a = points[i - 1],
    b = points[i],
    len = Math.max(1e-9, distances[i] - distances[i - 1]),
    t = (d - distances[i - 1]) / len;
  return {
    point: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t],
    normal: [-(b[1] - a[1]) / len, (b[0] - a[0]) / len],
  };
}
export function curtainClothRanges(length, position, opening = "split") {
  const open = number(position, 0, 0, 100) / 100,
    coverage = length * (1 - 0.9 * open);
  return opening === "start"
    ? [[0, coverage]]
    : opening === "end"
      ? [[length - coverage, length]]
      : [
          [0, coverage / 2],
          [length - coverage / 2, length],
        ];
}
export function resizeCurtainSegment(points, index, length) {
  const a = points[index],
    b = points[index + 1];
  if (!a || !b) return points;
  const old = trackDistance(a, b);
  if (old < 1e-6) return points;
  const factor = (number(length, old, 0.05, 30) - old) / old,
    delta = [(b[0] - a[0]) * factor, (b[1] - a[1]) * factor];
  return points.map((p, i) =>
    i > index ? [p[0] + delta[0], p[1] + delta[1]] : [...p],
  );
}
export function snapCurtainPoint(
  point,
  {
    enabled = true,
    grid = 0.05,
    anchor,
    walls = [],
    threshold = 0.12,
    forceAxis = false,
    wallOffset = 0,
  } = {},
) {
  let p = [...point];
  if (enabled) {
    p = p.map((v) => Math.round(v / grid) * grid);
    let best = threshold;
    for (const wall of walls) {
      const a = wall.start,
        b = wall.end,
        dx = b[0] - a[0],
        dy = b[1] - a[1],
        l = dx * dx + dy * dy;
      if (!l) continue;
      const t = Math.max(
          0,
          Math.min(1, ((point[0] - a[0]) * dx + (point[1] - a[1]) * dy) / l),
        ),
        projection = [a[0] + t * dx, a[1] + t * dy],
        side = Math.sign(dx * (point[1] - a[1]) - dy * (point[0] - a[0])) || 1,
        offset =
          wallOffset > 0 ? wallOffset + (Number(wall.thickness) || 0) / 2 : 0,
        q = [
          projection[0] - (dy / Math.sqrt(l)) * offset * side,
          projection[1] + (dx / Math.sqrt(l)) * offset * side,
        ],
        d = trackDistance(point, q);
      if (d < best) {
        best = d;
        p = q;
      }
    }
  }
  if (anchor && (enabled || forceAxis)) {
    const dx = Math.abs(p[0] - anchor[0]),
      dy = Math.abs(p[1] - anchor[1]);
    if (forceAxis || Math.min(dx, dy) < threshold)
      p = dx >= dy ? [p[0], anchor[1]] : [anchor[0], p[1]];
  }
  return p.map((v) => Math.round(v * 10000) / 10000);
}
