const DEFAULT_MINIMUM_SEGMENT_LENGTH = 0.2;
const DEFAULT_OPENING_CLEARANCE = 0.02;

const distance = (first, second) =>
  Math.hypot(first[0] - second[0], first[1] - second[1]);

const roundPoint = (point) =>
  point.map((coordinate) => Number(coordinate.toFixed(4)));

export function isVirtualWall(wall) {
  return wall?.virtual === true || wall?.transparent === true;
}

export function pointAlongWall(wall, offset) {
  const length = distance(wall.start, wall.end);
  if (length <= 0) return [...wall.start];
  const ratio = offset / length;
  return roundPoint([
    wall.start[0] + (wall.end[0] - wall.start[0]) * ratio,
    wall.start[1] + (wall.end[1] - wall.start[1]) * ratio,
  ]);
}

export function splitWallSegment(
  walls,
  openings,
  wallId,
  splitDistance,
  {
    minimumSegmentLength = DEFAULT_MINIMUM_SEGMENT_LENGTH,
    openingClearance = DEFAULT_OPENING_CLEARANCE,
    createWallId = () => `wall-${Date.now()}-split`,
  } = {},
) {
  const wall = walls.find((candidate) => candidate.id === wallId);
  if (!wall) return { ok: false, reason: "wall-not-found", walls, openings };

  const wallLength = distance(wall.start, wall.end);
  if (wallLength < minimumSegmentLength * 2) {
    return { ok: false, reason: "wall-too-short", walls, openings };
  }
  if (
    !Number.isFinite(splitDistance) ||
    splitDistance < minimumSegmentLength ||
    splitDistance > wallLength - minimumSegmentLength
  ) {
    return { ok: false, reason: "invalid-distance", walls, openings };
  }

  const wallOpenings = openings.filter((opening) => opening.wallId === wallId);
  const intersectingOpening = wallOpenings.find((opening) => {
    const halfWidth = Math.max(0, Number(opening.width) || 0) / 2;
    return (
      Math.abs(opening.offset - splitDistance) < halfWidth + openingClearance
    );
  });
  if (intersectingOpening) {
    return {
      ok: false,
      reason: "intersects-opening",
      openingId: intersectingOpening.id,
      walls,
      openings,
    };
  }

  const newWallId = createWallId();
  if (!newWallId || walls.some((candidate) => candidate.id === newWallId)) {
    return { ok: false, reason: "duplicate-wall-id", walls, openings };
  }

  const splitPoint = pointAlongWall(wall, splitDistance);
  const firstWall = { ...wall, end: splitPoint };
  const secondWall = { ...wall, id: newWallId, start: splitPoint };
  const splitWalls = walls.flatMap((candidate) =>
    candidate.id === wallId ? [firstWall, secondWall] : [candidate],
  );
  const splitOpenings = openings.map((opening) => {
    if (opening.wallId !== wallId || opening.offset < splitDistance) {
      return opening;
    }
    return {
      ...opening,
      wallId: newWallId,
      offset: Number((opening.offset - splitDistance).toFixed(4)),
    };
  });

  return {
    ok: true,
    walls: splitWalls,
    openings: splitOpenings,
    originalWallId: wall.id,
    newWallId,
    splitPoint,
  };
}
