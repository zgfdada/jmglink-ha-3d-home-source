const MIN_SEGMENT_LENGTH = 0.2;
const POINT_EPSILON = 1e-4;
export const MIN_CABINET_SECTION_HEIGHT = 0.1;
export const MAX_CABINET_DOOR_COUNT = 12;

export const LEGACY_CABINET_KINDS = new Set([
  "wardrobe",
  "cabinet",
  "tv_stand",
  "bookshelf",
  "sideboard",
  "shoe_cabinet",
  "nightstand",
]);

export const CABINET_STYLE_OPTIONS = [
  { id: "base", label: "地柜" },
  { id: "tall", label: "高柜 / 衣柜" },
  { id: "tv", label: "电视柜" },
  { id: "shelf", label: "书架" },
  { id: "sideboard", label: "餐边柜" },
  { id: "shoe", label: "鞋柜" },
  { id: "bedside", label: "床头柜" },
  { id: "segmented", label: "分段式连体柜" },
];

export const LEGACY_CABINET_STYLE = {
  wardrobe: "tall",
  cabinet: "base",
  tv_stand: "tv",
  bookshelf: "shelf",
  sideboard: "sideboard",
  shoe_cabinet: "shoe",
  nightstand: "bedside",
};

export function normalizeCabinetStyle(value, legacyKind = "cabinet") {
  return CABINET_STYLE_OPTIONS.some((option) => option.id === value)
    ? value
    : (LEGACY_CABINET_STYLE[legacyKind] ?? "base");
}

function finite(value, fallback) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

export function normalizeCabinetDoorCount(value, fallback = 3) {
  const numeric = Math.round(finite(value, fallback));
  return Math.max(1, Math.min(MAX_CABINET_DOOR_COUNT, numeric));
}

export function normalizeCabinetUpperDepth(value, fallback = 0.6) {
  return Math.max(0.1, Math.min(4, finite(value, fallback)));
}

export function normalizeSegmentedCabinetHeights(
  totalHeight,
  sectionOneHeight,
  hollowHeight,
) {
  const total = Math.max(
    MIN_CABINET_SECTION_HEIGHT * 2,
    finite(totalHeight, 1.8),
  );
  const preferredFirst = finite(sectionOneHeight, total * 0.38);
  const first = Math.max(
    MIN_CABINET_SECTION_HEIGHT,
    Math.min(total - MIN_CABINET_SECTION_HEIGHT, preferredFirst),
  );
  const preferredHollow = finite(hollowHeight, total * 0.24);
  const hollow = Math.max(
    0,
    Math.min(total - first - MIN_CABINET_SECTION_HEIGHT, preferredHollow),
  );
  return {
    sectionOneHeight: Number(first.toFixed(4)),
    hollowHeight: Number(hollow.toFixed(4)),
    sectionTwoHeight: Number(
      Math.max(MIN_CABINET_SECTION_HEIGHT, total - first - hollow).toFixed(4),
    ),
  };
}

export function createSegmentedCabinetShelfLayout({
  length,
  cabinetDepth,
  sectionOneHeight,
}) {
  const safeLength = Math.max(0.001, finite(length, 0.001));
  const safeDepth = Math.max(0.1, finite(cabinetDepth, 0.6));
  const thickness = 0.055;
  // Keep the shelf flush with the cabinet front. The curved outline supplies
  // the soft transition; a positive lip would make the connector protrude.
  const frontLip = 0;
  return {
    length: safeLength,
    depth: safeDepth,
    frontLip,
    radius: Math.min(0.12, Math.max(0.045, safeLength * 0.06)),
    thickness,
    bottom: Math.max(0, finite(sectionOneHeight, 0) - thickness),
  };
}

function point(value, fallback) {
  if (!Array.isArray(value) || value.length < 2) return [...fallback];
  return [finite(value[0], fallback[0]), finite(value[1], fallback[1])];
}

function distance(a, b) {
  return Math.hypot(b[0] - a[0], b[1] - a[1]);
}

function samePoint(a, b, epsilon = POINT_EPSILON) {
  return distance(a, b) <= epsilon;
}

export function isCabinetKind(kind) {
  return LEGACY_CABINET_KINDS.has(kind);
}

function createBoundarySegments(minX, maxX, minY, maxY, idPrefix = "segment") {
  const points = [
    [minX, minY],
    [maxX, minY],
    [maxX, maxY],
    [minX, maxY],
  ];
  return points.map((start, index) => ({
    id: `${idPrefix}-${index + 1}`,
    start,
    end: [...points[(index + 1) % points.length]],
    isDoorFront: index === 0,
  }));
}

function isClosedBoundary(segments) {
  return (
    segments.length >= 3 &&
    segments.every((segment, index) =>
      samePoint(segment.end, segments[(index + 1) % segments.length].start),
    )
  );
}

function centerlineBounds(segments, cabinetDepth) {
  const halfDepth = Math.max(0.1, finite(cabinetDepth, 0.6)) / 2;
  const corners = segments.flatMap((segment) => {
    const length = distance(segment.start, segment.end);
    const normal = [
      (-(segment.end[1] - segment.start[1]) / length) * halfDepth,
      ((segment.end[0] - segment.start[0]) / length) * halfDepth,
    ];
    return [
      [segment.start[0] + normal[0], segment.start[1] + normal[1]],
      [segment.start[0] - normal[0], segment.start[1] - normal[1]],
      [segment.end[0] + normal[0], segment.end[1] + normal[1]],
      [segment.end[0] - normal[0], segment.end[1] - normal[1]],
    ];
  });
  return {
    minX: Math.min(...corners.map((candidate) => candidate[0])),
    maxX: Math.max(...corners.map((candidate) => candidate[0])),
    minY: Math.min(...corners.map((candidate) => candidate[1])),
    maxY: Math.max(...corners.map((candidate) => candidate[1])),
  };
}

export function createCabinetSegments(width = 1.6, depth = 0.6) {
  const safeWidth = Math.max(MIN_SEGMENT_LENGTH, finite(width, 1.6));
  const safeDepth = Math.max(MIN_SEGMENT_LENGTH, finite(depth, 0.6));
  return createBoundarySegments(
    -safeWidth / 2,
    safeWidth / 2,
    -safeDepth / 2,
    safeDepth / 2,
  );
}

export function normalizeCabinetSegments(value, width = 1.6, depth = 0.6) {
  const segments = Array.isArray(value)
    ? value
        .map((segment, index) => {
          const start = point(segment?.start, [-0.8, 0]);
          const end = point(segment?.end, [0.8, 0]);
          if (distance(start, end) < MIN_SEGMENT_LENGTH) return undefined;
          return {
            id:
              typeof segment?.id === "string" && segment.id.trim()
                ? segment.id.trim()
                : `segment-${index + 1}`,
            start,
            end,
            isDoorFront: segment?.isDoorFront === true,
          };
        })
        .filter(Boolean)
    : [];
  if (isClosedBoundary(segments)) {
    if (segments.some((segment) => segment.isDoorFront)) return segments;
    return segments.map((segment, index) => ({
      ...segment,
      isDoorFront: index === 0,
    }));
  }
  if (segments.length) {
    const bounds = centerlineBounds(segments, depth);
    return createBoundarySegments(
      bounds.minX,
      bounds.maxX,
      bounds.minY,
      bounds.maxY,
      "migrated-segment",
    );
  }
  return createCabinetSegments(width, depth);
}

export function createSegmentedCabinetConnectorPanels(
  segments,
  {
    upperSegments,
    sectionOneHeight,
    hollowHeight,
    thickness = 0.036,
    overlap = 0.01,
  } = {},
) {
  const normalized = normalizeCabinetSegments(segments);
  const upper = upperSegments
    ? normalizeCabinetSegments(upperSegments)
    : normalized;
  const doorFronts = normalized.filter((segment) => segment.isDoorFront);
  const points = normalized.map((segment) => segment.start);
  const centroid = points.reduce(
    (sum, candidate) => [
      sum[0] + candidate[0] / points.length,
      sum[1] + candidate[1] / points.length,
    ],
    [0, 0],
  );
  const safeThickness = Math.max(0.012, finite(thickness, 0.036));
  const safeOverlap = Math.max(0, finite(overlap, 0.01));
  const bottom = Math.max(0, finite(sectionOneHeight, 0) - safeOverlap);
  const height = Math.max(0.01, finite(hollowHeight, 0) + safeOverlap * 2);

  return normalized
    .filter((segment) => !segment.isDoorFront)
    .map((segment) => {
      const dx = segment.end[0] - segment.start[0];
      const dz = segment.end[1] - segment.start[1];
      const length = Math.max(POINT_EPSILON, Math.hypot(dx, dz));
      const midpoint = [
        (segment.start[0] + segment.end[0]) / 2,
        (segment.start[1] + segment.end[1]) / 2,
      ];
      const rightNormal = [dz / length, -dx / length];
      const towardCentroid = [
        centroid[0] - midpoint[0],
        centroid[1] - midpoint[1],
      ];
      const inward =
        rightNormal[0] * towardCentroid[0] +
          rightNormal[1] * towardCentroid[1] >=
        0
          ? rightNormal
          : [-rightNormal[0], -rightNormal[1]];
      const frontEnd = doorFronts.some(
        (front) =>
          samePoint(segment.start, front.start) ||
          samePoint(segment.start, front.end),
      )
        ? "start"
        : doorFronts.some(
              (front) =>
                samePoint(segment.end, front.start) ||
                samePoint(segment.end, front.end),
            )
          ? "end"
          : undefined;
      const upperSegment = upper.find(
        (candidate) => candidate.id === segment.id,
      );
      const upperFrontPoint =
        frontEnd === "start"
          ? upperSegment?.start
          : frontEnd === "end"
            ? upperSegment?.end
            : undefined;
      const lowerFrontX = frontEnd === "start" ? -length / 2 : length / 2;
      const upperFrontX = upperFrontPoint
        ? (upperFrontPoint[0] - midpoint[0]) * (dx / length) +
          (upperFrontPoint[1] - midpoint[1]) * (dz / length)
        : lowerFrontX;
      const backX = frontEnd === "start" ? length / 2 : -length / 2;
      const radius = Math.min(0.12, height * 0.3, length * 0.24);
      const curveX =
        frontEnd === "start"
          ? Math.min(
              backX - safeThickness,
              Math.max(lowerFrontX, upperFrontX) + radius,
            )
          : Math.max(
              backX + safeThickness,
              Math.min(lowerFrontX, upperFrontX) - radius,
            );

      return {
        id: segment.id,
        length,
        height,
        thickness: safeThickness,
        bottom,
        center: [
          midpoint[0] + inward[0] * (safeThickness / 2),
          midpoint[1] + inward[1] * (safeThickness / 2),
        ],
        angle: Math.atan2(dz, dx),
        frontEnd,
        lowerFrontX,
        upperFrontX,
        backX,
        curveX,
      };
    });
}

function cabinetDepthAxis(normalized) {
  const front =
    normalized.find((segment) => segment.isDoorFront) ?? normalized[0];
  const dx = front.end[0] - front.start[0];
  const dy = front.end[1] - front.start[1];
  const length = Math.max(POINT_EPSILON, Math.hypot(dx, dy));
  const midpoint = [
    (front.start[0] + front.end[0]) / 2,
    (front.start[1] + front.end[1]) / 2,
  ];
  const centroid = normalized
    .map((segment) => segment.start)
    .reduce(
      (sum, candidate) => [
        sum[0] + candidate[0] / normalized.length,
        sum[1] + candidate[1] / normalized.length,
      ],
      [0, 0],
    );
  const rightNormal = [dy / length, -dx / length];
  const towardCentroid = [centroid[0] - midpoint[0], centroid[1] - midpoint[1]];
  const inward =
    rightNormal[0] * towardCentroid[0] + rightNormal[1] * towardCentroid[1] >= 0
      ? rightNormal
      : [-rightNormal[0], -rightNormal[1]];
  const project = (candidate) =>
    candidate[0] * inward[0] + candidate[1] * inward[1];
  const frontProjection = project(midpoint);
  const backProjection = Math.max(
    ...normalized.flatMap((segment) => [
      project(segment.start),
      project(segment.end),
    ]),
  );
  const sourceDepth = Math.max(POINT_EPSILON, backProjection - frontProjection);
  return { inward, project, backProjection, sourceDepth };
}

export function cabinetFrontDepth(segments, fallbackDepth = 0.6) {
  const normalized = normalizeCabinetSegments(segments, 1.6, fallbackDepth);
  return cabinetDepthAxis(normalized).sourceDepth;
}

export function resizeCabinetDepthFromBack(
  segments,
  targetDepth,
  fallbackDepth = 0.6,
) {
  const normalized = normalizeCabinetSegments(segments, 1.6, fallbackDepth);
  const { inward, project, backProjection, sourceDepth } =
    cabinetDepthAxis(normalized);
  const depthScale =
    normalizeCabinetUpperDepth(targetDepth, fallbackDepth) / sourceDepth;
  const transformPoint = (candidate) => {
    const projection = project(candidate);
    const resizedProjection =
      backProjection - (backProjection - projection) * depthScale;
    const adjustment = resizedProjection - projection;
    return [
      Number((candidate[0] + inward[0] * adjustment).toFixed(6)),
      Number((candidate[1] + inward[1] * adjustment).toFixed(6)),
    ];
  };
  return normalized.map((segment) => ({
    ...segment,
    start: transformPoint(segment.start),
    end: transformPoint(segment.end),
  }));
}

export function cabinetLayoutBounds(segments, cabinetDepth = 0.6) {
  const normalized = normalizeCabinetSegments(segments, 1.6, cabinetDepth);
  const points = normalized.flatMap((segment) => [segment.start, segment.end]);
  const minX = Math.min(...points.map((candidate) => candidate[0]));
  const maxX = Math.max(...points.map((candidate) => candidate[0]));
  const minY = Math.min(...points.map((candidate) => candidate[1]));
  const maxY = Math.max(...points.map((candidate) => candidate[1]));
  return {
    minX,
    maxX,
    minY,
    maxY,
    width: Math.max(0.2, maxX - minX),
    depth: Math.max(0.2, maxY - minY),
  };
}

export function segmentedCabinetDisplaySize(
  segments,
  upperDepth,
  fallbackDepth = 0.6,
) {
  const lowerBounds = cabinetLayoutBounds(segments, fallbackDepth);
  const upperBounds = cabinetLayoutBounds(
    resizeCabinetDepthFromBack(segments, upperDepth, fallbackDepth),
    upperDepth,
  );
  return {
    width: Math.max(lowerBounds.width, upperBounds.width),
    depth: Math.max(lowerBounds.depth, upperBounds.depth),
  };
}

export function splitCabinetSegment(segments, segmentId, ratio = 0.5) {
  const normalized = normalizeCabinetSegments(segments);
  const target = normalized.find((segment) => segment.id === segmentId);
  if (!target)
    return { ok: false, reason: "missing-segment", segments: normalized };
  const safeRatio = Math.max(0.1, Math.min(0.9, finite(ratio, 0.5)));
  const splitPoint = [
    target.start[0] + (target.end[0] - target.start[0]) * safeRatio,
    target.start[1] + (target.end[1] - target.start[1]) * safeRatio,
  ];
  if (
    distance(target.start, splitPoint) < MIN_SEGMENT_LENGTH ||
    distance(splitPoint, target.end) < MIN_SEGMENT_LENGTH
  ) {
    return { ok: false, reason: "too-short", segments: normalized };
  }
  const stamp = Date.now().toString(36);
  return {
    ok: true,
    selectedId: `${target.id}-b-${stamp}`,
    segments: normalized.flatMap((segment) =>
      segment.id !== target.id
        ? [segment]
        : [
            { ...segment, id: `${target.id}-a-${stamp}`, end: splitPoint },
            { ...segment, id: `${target.id}-b-${stamp}`, start: splitPoint },
          ],
    ),
  };
}

export function moveCabinetJunction(segments, originPoint, nextPoint) {
  const normalized = normalizeCabinetSegments(segments);
  const next = point(nextPoint, originPoint);
  return normalized.map((segment) => ({
    ...segment,
    start: samePoint(segment.start, originPoint) ? [...next] : segment.start,
    end: samePoint(segment.end, originPoint) ? [...next] : segment.end,
  }));
}

export function translateCabinetSegment(segments, segmentId, delta) {
  const normalized = normalizeCabinetSegments(segments);
  const target = normalized.find((segment) => segment.id === segmentId);
  if (!target) return normalized;
  const movement = point(delta, [0, 0]);
  const translatedStart = [
    target.start[0] + movement[0],
    target.start[1] + movement[1],
  ];
  const translatedEnd = [
    target.end[0] + movement[0],
    target.end[1] + movement[1],
  ];
  return normalized.map((segment) => ({
    ...segment,
    start: samePoint(segment.start, target.start)
      ? [...translatedStart]
      : samePoint(segment.start, target.end)
        ? [...translatedEnd]
        : segment.start,
    end: samePoint(segment.end, target.start)
      ? [...translatedStart]
      : samePoint(segment.end, target.end)
        ? [...translatedEnd]
        : segment.end,
  }));
}

function mergePair(first, second) {
  const shared = [
    [first.start, second.start, first.end, second.end],
    [first.start, second.end, first.end, second.start],
    [first.end, second.start, first.start, second.end],
    [first.end, second.end, first.start, second.start],
  ].find(([a, b]) => samePoint(a, b));
  if (!shared) return undefined;
  const [, , outerA, outerB] = shared;
  const firstVector = [
    first.end[0] - first.start[0],
    first.end[1] - first.start[1],
  ];
  const secondVector = [
    second.end[0] - second.start[0],
    second.end[1] - second.start[1],
  ];
  const cross = Math.abs(
    firstVector[0] * secondVector[1] - firstVector[1] * secondVector[0],
  );
  const scale =
    distance(first.start, first.end) * distance(second.start, second.end);
  if (scale <= 0 || cross / scale > 1e-3) return undefined;
  return {
    id: first.id,
    start: [...outerA],
    end: [...outerB],
    isDoorFront: first.isDoorFront || second.isDoorFront,
  };
}

export function mergeCollinearCabinetSegments(segments) {
  const result = normalizeCabinetSegments(segments).map((segment) => ({
    ...segment,
    start: [...segment.start],
    end: [...segment.end],
  }));
  let changed = false;
  for (let merged = true; merged;) {
    merged = false;
    for (let firstIndex = 0; firstIndex < result.length; firstIndex += 1) {
      for (
        let secondIndex = firstIndex + 1;
        secondIndex < result.length;
        secondIndex += 1
      ) {
        const combined = mergePair(result[firstIndex], result[secondIndex]);
        if (!combined) continue;
        result.splice(secondIndex, 1);
        result.splice(firstIndex, 1, combined);
        changed = merged = true;
        break;
      }
      if (merged) break;
    }
  }
  return {
    ok: changed,
    segments: result,
    reason: changed ? undefined : "no-collinear-segments",
  };
}

export function cabinetSegmentLength(segment) {
  return distance(segment.start, segment.end);
}

export function setCabinetDoorFront(segments, segmentId) {
  return normalizeCabinetSegments(segments).map((segment) => ({
    ...segment,
    isDoorFront: segment.id === segmentId,
  }));
}

function normalizedAngleDifference(first, second) {
  let difference = Math.abs(first - second) % Math.PI;
  if (difference > Math.PI / 2) difference = Math.PI - difference;
  return difference;
}

function segmentAngle(segment) {
  return Math.atan2(
    segment.end[1] - segment.start[1],
    segment.end[0] - segment.start[0],
  );
}

export function findCabinetSegmentRelations(
  segments,
  activeSegmentId,
  { angleTolerance = (3 * Math.PI) / 180 } = {},
) {
  const normalized = normalizeCabinetSegments(segments);
  const active = normalized.find((segment) => segment.id === activeSegmentId);
  if (!active) return [];
  const activeAngle = segmentAngle(active);
  return normalized.flatMap((segment) => {
    if (segment.id === active.id) return [];
    const difference = normalizedAngleDifference(
      activeAngle,
      segmentAngle(segment),
    );
    if (difference <= angleTolerance) {
      return [
        { type: "parallel", activeId: active.id, referenceId: segment.id },
      ];
    }
    if (Math.abs(difference - Math.PI / 2) <= angleTolerance) {
      return [
        { type: "perpendicular", activeId: active.id, referenceId: segment.id },
      ];
    }
    return [];
  });
}

export function snapCabinetJunctionToRelations(
  segments,
  originPoint,
  nextPoint,
  { angleTolerance = (7 * Math.PI) / 180 } = {},
) {
  const normalized = normalizeCabinetSegments(segments);
  const moving = normalized.filter(
    (segment) =>
      samePoint(segment.start, originPoint) ||
      samePoint(segment.end, originPoint),
  );
  const references = normalized.filter((segment) => !moving.includes(segment));
  let best;

  for (const movingSegment of moving) {
    const fixed = samePoint(movingSegment.start, originPoint)
      ? movingSegment.end
      : movingSegment.start;
    const vector = [nextPoint[0] - fixed[0], nextPoint[1] - fixed[1]];
    const length = Math.hypot(vector[0], vector[1]);
    if (length < MIN_SEGMENT_LENGTH) continue;
    const movingAngle = Math.atan2(vector[1], vector[0]);
    for (const reference of references) {
      const referenceAngle = segmentAngle(reference);
      for (const candidate of [
        { type: "parallel", angle: referenceAngle },
        { type: "perpendicular", angle: referenceAngle + Math.PI / 2 },
      ]) {
        const difference = normalizedAngleDifference(
          movingAngle,
          candidate.angle,
        );
        if (difference > angleTolerance) continue;
        const directions = [candidate.angle, candidate.angle + Math.PI];
        const angle = directions.sort(
          (first, second) =>
            normalizedAngleDifference(movingAngle, first) -
            normalizedAngleDifference(movingAngle, second),
        )[0];
        const snappedPoint = [
          fixed[0] + Math.cos(angle) * length,
          fixed[1] + Math.sin(angle) * length,
        ];
        const adjustment = distance(nextPoint, snappedPoint);
        if (!best || adjustment < best.adjustment) {
          best = {
            point: snappedPoint.map((value) => Number(value.toFixed(4))),
            adjustment,
            relation: {
              type: candidate.type,
              activeId: movingSegment.id,
              referenceId: reference.id,
            },
          };
        }
      }
    }
  }

  return best
    ? { point: best.point, relation: best.relation }
    : { point: [...nextPoint], relation: undefined };
}
