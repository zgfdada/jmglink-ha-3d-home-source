const DEFAULT_ALIGNMENT_THRESHOLD = 0.16;

const roundCoordinate = (value) => {
  const rounded = Number(value.toFixed(4));
  return Object.is(rounded, -0) ? 0 : rounded;
};

const normalizePoint = (point) => [Number(point[0]), Number(point[1])];

function findClosestAlignment(movingPoints, targets, axis, threshold) {
  let closest;
  for (const movingPoint of movingPoints) {
    for (const target of targets) {
      const difference = Math.abs(movingPoint[axis] - target.point[axis]);
      if (difference > threshold) continue;
      if (!closest || difference < closest.difference) {
        closest = { movingPoint, target, difference };
      }
    }
  }
  return closest;
}

export function snapTranslationToAlignment(
  movingAnchors,
  targetAnchors,
  delta,
  { threshold = DEFAULT_ALIGNMENT_THRESHOLD, axes = [0, 1] } = {},
) {
  const translatedAnchors = movingAnchors.map((point) => [
    point[0] + delta[0],
    point[1] + delta[1],
  ]);
  const targets = targetAnchors
    .filter((target) => target && Array.isArray(target.point))
    .map((target) => ({ ...target, point: normalizePoint(target.point) }));
  const xMatch = axes.includes(0)
    ? findClosestAlignment(translatedAnchors, targets, 0, threshold)
    : undefined;
  const yMatch = axes.includes(1)
    ? findClosestAlignment(translatedAnchors, targets, 1, threshold)
    : undefined;
  const snappedDelta = [
    delta[0] + (xMatch ? xMatch.target.point[0] - xMatch.movingPoint[0] : 0),
    delta[1] + (yMatch ? yMatch.target.point[1] - yMatch.movingPoint[1] : 0),
  ].map(roundCoordinate);
  const guides = [];

  if (xMatch) {
    guides.push({
      axis: "vertical",
      coordinate: roundCoordinate(xMatch.target.point[0]),
      source: [
        roundCoordinate(xMatch.target.point[0]),
        roundCoordinate(xMatch.movingPoint[1] + snappedDelta[1] - delta[1]),
      ],
      target: [...xMatch.target.point],
      targetId: xMatch.target.id,
      targetKind: xMatch.target.kind,
    });
  }
  if (yMatch) {
    guides.push({
      axis: "horizontal",
      coordinate: roundCoordinate(yMatch.target.point[1]),
      source: [
        roundCoordinate(yMatch.movingPoint[0] + snappedDelta[0] - delta[0]),
        roundCoordinate(yMatch.target.point[1]),
      ],
      target: [...yMatch.target.point],
      targetId: yMatch.target.id,
      targetKind: yMatch.target.kind,
    });
  }

  return { delta: snappedDelta, guides };
}

export function snapPointToAlignment(point, targetAnchors, options) {
  const result = snapTranslationToAlignment(
    [[0, 0]],
    targetAnchors,
    point,
    options,
  );
  return { point: result.delta, guides: result.guides };
}

export function snapCreationPointToAlignment(
  point,
  targetAnchors,
  { threshold = DEFAULT_ALIGNMENT_THRESHOLD, prioritySnap, draftStart } = {},
) {
  if (prioritySnap && prioritySnap.kind !== "axis") {
    return { point: [...point], guides: [] };
  }

  const alignment = snapPointToAlignment(point, targetAnchors, { threshold });
  if (!prioritySnap || prioritySnap.kind !== "axis" || !draftStart) {
    return alignment;
  }

  const horizontal = Math.abs(point[1] - draftStart[1]) <= 1e-5;
  const vertical = Math.abs(point[0] - draftStart[0]) <= 1e-5;
  if (!horizontal && !vertical) return alignment;

  const snappedPoint = horizontal
    ? [alignment.point[0], point[1]]
    : [point[0], alignment.point[1]];
  const allowedAxis = horizontal ? "vertical" : "horizontal";
  const guides = alignment.guides
    .filter((guide) => guide.axis === allowedAxis)
    .map((guide) => ({ ...guide, source: [...snappedPoint] }));
  guides.push({
    axis: horizontal ? "horizontal" : "vertical",
    coordinate: horizontal ? point[1] : point[0],
    source: [...snappedPoint],
    target: [...draftStart],
    targetId: "wall-draft-start",
    targetKind: "wall",
  });

  return { point: snappedPoint.map(roundCoordinate), guides };
}
