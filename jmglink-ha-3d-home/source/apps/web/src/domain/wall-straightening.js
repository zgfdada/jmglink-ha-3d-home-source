const DEFAULT_CONNECTION_TOLERANCE = 0.04;
const DEFAULT_AXIS_SNAP_RATIO = 0.34;
const MINIMUM_CHAIN_LENGTH = 0.12;
const MINIMUM_SEGMENT_LENGTH = 0.001;

const distance = (first, second) =>
  Math.hypot(first[0] - second[0], first[1] - second[1]);

const roundPoint = (point) =>
  point.map((coordinate) => Number(coordinate.toFixed(4)));

function createEndpointNodes(walls, tolerance) {
  const nodes = [];
  const endpointNodes = new Map();

  for (const wall of walls) {
    for (const endpoint of ["start", "end"]) {
      const point = wall[endpoint];
      let nodeIndex = nodes.findIndex((node) =>
        node.points.some((candidate) => distance(candidate, point) < tolerance),
      );
      if (nodeIndex < 0) {
        nodeIndex = nodes.length;
        nodes.push({ points: [], edges: [] });
      }
      nodes[nodeIndex].points.push(point);
      nodes[nodeIndex].edges.push({ wallId: wall.id, endpoint });
      endpointNodes.set(`${wall.id}:${endpoint}`, nodeIndex);
    }
  }

  for (const node of nodes) {
    node.point = [
      node.points.reduce((sum, point) => sum + point[0], 0) /
        node.points.length,
      node.points.reduce((sum, point) => sum + point[1], 0) /
        node.points.length,
    ];
  }

  return { nodes, endpointNodes };
}

function orderWallChain(walls, nodes, endpointNodes) {
  if (nodes.some((node) => node.edges.length > 2)) {
    return { ok: false, reason: "branched" };
  }

  const outerNodes = nodes
    .map((node, index) => ({ node, index }))
    .filter(({ node }) => node.edges.length === 1);
  if (outerNodes.length !== 2) {
    return {
      ok: false,
      reason: outerNodes.length ? "disconnected" : "closed-loop",
    };
  }

  const wallsById = new Map(walls.map((wall) => [wall.id, wall]));
  const visitedWalls = new Set();
  const orderedWalls = [];
  const orderedNodeIndexes = [outerNodes[0].index];
  let nodeIndex = outerNodes[0].index;

  while (visitedWalls.size < walls.length) {
    const edge = nodes[nodeIndex].edges.find(
      ({ wallId }) => !visitedWalls.has(wallId),
    );
    if (!edge) break;

    const wall = wallsById.get(edge.wallId);
    const startNode = endpointNodes.get(`${wall.id}:start`);
    const endNode = endpointNodes.get(`${wall.id}:end`);
    const nextNode = startNode === nodeIndex ? endNode : startNode;
    if (nextNode === undefined || nextNode === nodeIndex) {
      return { ok: false, reason: "invalid-segment" };
    }

    visitedWalls.add(wall.id);
    orderedWalls.push(wall);
    orderedNodeIndexes.push(nextNode);
    nodeIndex = nextNode;
  }

  if (visitedWalls.size !== walls.length || nodeIndex !== outerNodes[1].index) {
    return { ok: false, reason: "disconnected" };
  }

  return { ok: true, orderedWalls, orderedNodeIndexes };
}

function chooseTargetLine(start, end, axisSnapRatio) {
  const deltaX = end[0] - start[0];
  const deltaY = end[1] - start[1];
  if (Math.hypot(deltaX, deltaY) < MINIMUM_CHAIN_LENGTH) {
    return { ok: false, reason: "too-short" };
  }

  if (Math.abs(deltaX) > 0.01 && Math.abs(deltaY / deltaX) < axisSnapRatio) {
    return {
      ok: true,
      axis: "horizontal",
      coordinate: (start[1] + end[1]) / 2,
    };
  }
  if (Math.abs(deltaY) > 0.01 && Math.abs(deltaX / deltaY) < axisSnapRatio) {
    return {
      ok: true,
      axis: "vertical",
      coordinate: (start[0] + end[0]) / 2,
    };
  }

  return { ok: true, axis: "diagonal", start, end, deltaX, deltaY };
}

function projectPoint(point, target) {
  if (target.axis === "horizontal") return [point[0], target.coordinate];
  if (target.axis === "vertical") return [target.coordinate, point[1]];

  const lengthSquared = target.deltaX ** 2 + target.deltaY ** 2;
  const parameter =
    ((point[0] - target.start[0]) * target.deltaX +
      (point[1] - target.start[1]) * target.deltaY) /
    lengthSquared;
  return [
    target.start[0] + parameter * target.deltaX,
    target.start[1] + parameter * target.deltaY,
  ];
}

function pointsEqual(first, second) {
  return first[0] === second[0] && first[1] === second[1];
}

export function straightenWallChain(
  walls,
  selectedWallIds,
  {
    connectionTolerance = DEFAULT_CONNECTION_TOLERANCE,
    axisSnapRatio = DEFAULT_AXIS_SNAP_RATIO,
  } = {},
) {
  const selectedIds = new Set(selectedWallIds);
  const selectedWalls = walls.filter((wall) => selectedIds.has(wall.id));
  if (selectedWalls.length < 2 || selectedWalls.length !== selectedIds.size) {
    return { ok: false, reason: "not-enough-walls", walls };
  }

  const { nodes, endpointNodes } = createEndpointNodes(
    selectedWalls,
    connectionTolerance,
  );
  const chain = orderWallChain(selectedWalls, nodes, endpointNodes);
  if (!chain.ok) return { ...chain, walls };

  const orderedNodes = chain.orderedNodeIndexes.map((index) => nodes[index]);
  const target = chooseTargetLine(
    orderedNodes[0].point,
    orderedNodes.at(-1).point,
    axisSnapRatio,
  );
  if (!target.ok) return { ...target, walls };

  const movedNodes = chain.orderedNodeIndexes.map((nodeIndex) => ({
    originalPoints: nodes[nodeIndex].points,
    point: roundPoint(projectPoint(nodes[nodeIndex].point, target)),
  }));
  const endpointTargets = new Map();
  chain.orderedNodeIndexes.forEach((nodeIndex, orderedIndex) => {
    for (const { wallId, endpoint } of nodes[nodeIndex].edges) {
      endpointTargets.set(
        `${wallId}:${endpoint}`,
        movedNodes[orderedIndex].point,
      );
    }
  });

  const findConnectedTarget = (point) =>
    movedNodes.find(({ originalPoints }) =>
      originalPoints.some(
        (originalPoint) => distance(originalPoint, point) < connectionTolerance,
      ),
    )?.point;

  let changed = false;
  const straightenedWalls = walls.map((wall) => {
    const selected = selectedIds.has(wall.id);
    const nextStart = selected
      ? endpointTargets.get(`${wall.id}:start`)
      : findConnectedTarget(wall.start);
    const nextEnd = selected
      ? endpointTargets.get(`${wall.id}:end`)
      : findConnectedTarget(wall.end);
    if (!nextStart && !nextEnd) return wall;

    const start = nextStart ?? wall.start;
    const end = nextEnd ?? wall.end;
    if (distance(start, end) < MINIMUM_SEGMENT_LENGTH) return wall;
    if (pointsEqual(start, wall.start) && pointsEqual(end, wall.end))
      return wall;
    changed = true;
    return { ...wall, start, end };
  });

  return {
    ok: true,
    changed,
    axis: target.axis,
    walls: straightenedWalls,
    orderedWallIds: chain.orderedWalls.map((wall) => wall.id),
  };
}

function openingCenterOnWall(opening, wall) {
  const wallLength = distance(wall.start, wall.end);
  if (wallLength < MINIMUM_SEGMENT_LENGTH) return [...wall.start];
  const ratio = opening.offset / wallLength;
  return [
    wall.start[0] + (wall.end[0] - wall.start[0]) * ratio,
    wall.start[1] + (wall.end[1] - wall.start[1]) * ratio,
  ];
}

export function mergeWallChain(
  walls,
  openings,
  selectedWallIds,
  {
    connectionTolerance = DEFAULT_CONNECTION_TOLERANCE,
    collinearityTolerance = DEFAULT_CONNECTION_TOLERANCE,
    retainedWallId,
  } = {},
) {
  const selectedIds = new Set(selectedWallIds);
  const selectedWalls = walls.filter((wall) => selectedIds.has(wall.id));
  if (selectedWalls.length < 2 || selectedWalls.length !== selectedIds.size) {
    return { ok: false, reason: "not-enough-walls", walls, openings };
  }

  const { nodes, endpointNodes } = createEndpointNodes(
    selectedWalls,
    connectionTolerance,
  );
  const chain = orderWallChain(selectedWalls, nodes, endpointNodes);
  if (!chain.ok) return { ...chain, walls, openings };

  const orderedPoints = chain.orderedNodeIndexes.map(
    (nodeIndex) => nodes[nodeIndex].point,
  );
  let start = orderedPoints[0];
  let end = orderedPoints.at(-1);
  const mergedLength = distance(start, end);
  if (mergedLength < MINIMUM_CHAIN_LENGTH) {
    return { ok: false, reason: "too-short", walls, openings };
  }

  const maximumDeviation = Math.max(
    ...orderedPoints.map((point) => {
      const deltaX = end[0] - start[0];
      const deltaY = end[1] - start[1];
      return (
        Math.abs(
          deltaY * point[0] -
            deltaX * point[1] +
            end[0] * start[1] -
            end[1] * start[0],
        ) / mergedLength
      );
    }),
  );
  const chainLength = chain.orderedWalls.reduce(
    (sum, wall) => sum + distance(wall.start, wall.end),
    0,
  );
  if (
    maximumDeviation > collinearityTolerance ||
    Math.abs(chainLength - mergedLength) >
      Math.max(
        collinearityTolerance * selectedWalls.length,
        mergedLength * 0.01,
      )
  ) {
    return { ok: false, reason: "not-collinear", walls, openings };
  }

  const retainedWall =
    selectedWalls.find((wall) => wall.id === retainedWallId) ??
    selectedWalls[0];
  const retainedDirection = [
    retainedWall.end[0] - retainedWall.start[0],
    retainedWall.end[1] - retainedWall.start[1],
  ];
  const mergedDirection = [end[0] - start[0], end[1] - start[1]];
  if (
    retainedDirection[0] * mergedDirection[0] +
      retainedDirection[1] * mergedDirection[1] <
    0
  ) {
    [start, end] = [end, start];
  }
  start = roundPoint(start);
  end = roundPoint(end);

  const mergedWall = { ...retainedWall, start, end };
  const mergedWalls = walls.flatMap((wall) => {
    if (wall.id === retainedWall.id) return [mergedWall];
    return selectedIds.has(wall.id) ? [] : [wall];
  });
  const finalLength = distance(start, end);
  const unit = [
    (end[0] - start[0]) / finalLength,
    (end[1] - start[1]) / finalLength,
  ];
  const selectedWallsById = new Map(
    selectedWalls.map((wall) => [wall.id, wall]),
  );
  const mergedOpenings = openings.map((opening) => {
    const originalWall = selectedWallsById.get(opening.wallId);
    if (!originalWall) return opening;
    const center = openingCenterOnWall(opening, originalWall);
    const projectedOffset =
      (center[0] - start[0]) * unit[0] + (center[1] - start[1]) * unit[1];
    const halfWidth = Math.min(opening.width / 2, finalLength / 2);
    return {
      ...opening,
      wallId: mergedWall.id,
      offset: Number(
        Math.max(
          halfWidth,
          Math.min(finalLength - halfWidth, projectedOffset),
        ).toFixed(4),
      ),
    };
  });

  return {
    ok: true,
    walls: mergedWalls,
    openings: mergedOpenings,
    retainedWallId: mergedWall.id,
    removedWallIds: selectedWalls
      .filter((wall) => wall.id !== mergedWall.id)
      .map((wall) => wall.id),
  };
}

export function clampOpeningsToWalls(openings, walls) {
  const wallsById = new Map(walls.map((wall) => [wall.id, wall]));
  return openings.map((opening) => {
    const wall = wallsById.get(opening.wallId);
    if (!wall) return opening;
    const wallLength = distance(wall.start, wall.end);
    const halfWidth = Math.min(opening.width / 2, wallLength / 2);
    const offset = Math.max(
      halfWidth,
      Math.min(wallLength - halfWidth, opening.offset),
    );
    return offset === opening.offset ? opening : { ...opening, offset };
  });
}

function inspectCollinearWallChain(
  walls,
  selectedWallIds,
  {
    connectionTolerance = DEFAULT_CONNECTION_TOLERANCE,
    collinearityTolerance = DEFAULT_CONNECTION_TOLERANCE,
  } = {},
) {
  const selectedIds = new Set(selectedWallIds);
  const selectedWalls = walls.filter((wall) => selectedIds.has(wall.id));
  if (selectedWalls.length < 2 || selectedWalls.length !== selectedIds.size) {
    return { ok: false, reason: "not-enough-walls" };
  }

  const { nodes, endpointNodes } = createEndpointNodes(
    selectedWalls,
    connectionTolerance,
  );
  const chain = orderWallChain(selectedWalls, nodes, endpointNodes);
  if (!chain.ok) return chain;

  const orderedNodeIndexes = chain.orderedNodeIndexes;
  const orderedPoints = orderedNodeIndexes.map((index) => nodes[index].point);
  const start = orderedPoints[0];
  const end = orderedPoints.at(-1);
  const directLength = distance(start, end);
  if (directLength < MINIMUM_CHAIN_LENGTH) {
    return { ok: false, reason: "too-short" };
  }

  const deltaX = end[0] - start[0];
  const deltaY = end[1] - start[1];
  const maximumDeviation = Math.max(
    ...orderedPoints.map(
      (point) =>
        Math.abs(
          deltaY * point[0] -
            deltaX * point[1] +
            end[0] * start[1] -
            end[1] * start[0],
        ) / directLength,
    ),
  );
  const chainLength = orderedPoints
    .slice(0, -1)
    .reduce(
      (sum, point, index) => sum + distance(point, orderedPoints[index + 1]),
      0,
    );
  if (
    maximumDeviation > collinearityTolerance ||
    Math.abs(chainLength - directLength) >
      Math.max(
        collinearityTolerance * selectedWalls.length,
        directLength * 0.01,
      )
  ) {
    return { ok: false, reason: "not-collinear" };
  }

  return {
    ok: true,
    selectedIds,
    selectedWalls,
    nodes,
    endpointNodes,
    orderedNodeIndexes,
    orderedPoints,
    start: roundPoint(start),
    end: roundPoint(end),
    midpoint: roundPoint([(start[0] + end[0]) / 2, (start[1] + end[1]) / 2]),
    length: directLength,
    startWallId: nodes[orderedNodeIndexes[0]].edges[0].wallId,
    endWallId: nodes[orderedNodeIndexes.at(-1)].edges[0].wallId,
    connectionTolerance,
  };
}

export function getCollinearWallChain(walls, selectedWallIds, options) {
  const chain = inspectCollinearWallChain(walls, selectedWallIds, options);
  if (!chain.ok) return chain;
  return {
    ok: true,
    start: chain.start,
    end: chain.end,
    midpoint: chain.midpoint,
    length: chain.length,
    wallIds: chain.selectedWalls.map((wall) => wall.id),
    startWallId: chain.startWallId,
    endWallId: chain.endWallId,
  };
}

export function transformCollinearWallChain(
  walls,
  openings,
  selectedWallIds,
  transform,
  options,
) {
  const chain = inspectCollinearWallChain(walls, selectedWallIds, options);
  if (!chain.ok) return { ...chain, walls, openings };

  let transformedPoints;
  if (transform.type === "translate") {
    const delta = transform.delta;
    if (!Array.isArray(delta) || !delta.every(Number.isFinite)) {
      return { ok: false, reason: "invalid-transform", walls, openings };
    }
    transformedPoints = chain.orderedPoints.map((point) =>
      roundPoint([point[0] + delta[0], point[1] + delta[1]]),
    );
  } else if (transform.type === "resize") {
    const point = transform.point;
    if (
      !Array.isArray(point) ||
      !point.every(Number.isFinite) ||
      !["start", "end"].includes(transform.endpoint)
    ) {
      return { ok: false, reason: "invalid-transform", walls, openings };
    }
    const nextStart = transform.endpoint === "start" ? point : chain.start;
    const nextEnd = transform.endpoint === "end" ? point : chain.end;
    if (distance(nextStart, nextEnd) < MINIMUM_CHAIN_LENGTH) {
      return { ok: false, reason: "too-short", walls, openings };
    }
    let travelled = 0;
    const parameters = chain.orderedPoints.map((currentPoint, index) => {
      if (index > 0)
        travelled += distance(chain.orderedPoints[index - 1], currentPoint);
      return travelled / chain.length;
    });
    transformedPoints = parameters.map((parameter) =>
      roundPoint([
        nextStart[0] + (nextEnd[0] - nextStart[0]) * parameter,
        nextStart[1] + (nextEnd[1] - nextStart[1]) * parameter,
      ]),
    );
  } else {
    return { ok: false, reason: "invalid-transform", walls, openings };
  }

  const movedNodes = chain.orderedNodeIndexes.map((nodeIndex, index) => ({
    originalPoints: chain.nodes[nodeIndex].points,
    point: transformedPoints[index],
  }));
  const endpointTargets = new Map();
  chain.selectedWalls.forEach((wall) => {
    for (const endpoint of ["start", "end"]) {
      const nodeIndex = chain.endpointNodes.get(`${wall.id}:${endpoint}`);
      const orderedIndex = chain.orderedNodeIndexes.indexOf(nodeIndex);
      if (orderedIndex >= 0)
        endpointTargets.set(
          `${wall.id}:${endpoint}`,
          transformedPoints[orderedIndex],
        );
    }
  });
  const findConnectedTarget = (point) =>
    movedNodes.find(({ originalPoints }) =>
      originalPoints.some(
        (originalPoint) =>
          distance(originalPoint, point) < chain.connectionTolerance,
      ),
    )?.point;

  const transformedWalls = walls.map((wall) => {
    const selected = chain.selectedIds.has(wall.id);
    const start = selected
      ? endpointTargets.get(`${wall.id}:start`)
      : findConnectedTarget(wall.start);
    const end = selected
      ? endpointTargets.get(`${wall.id}:end`)
      : findConnectedTarget(wall.end);
    return start || end
      ? { ...wall, start: start ?? wall.start, end: end ?? wall.end }
      : wall;
  });
  const originalWallsById = new Map(walls.map((wall) => [wall.id, wall]));
  const transformedWallsById = new Map(
    transformedWalls.map((wall) => [wall.id, wall]),
  );
  const transformedOpenings = openings.map((opening) => {
    if (!chain.selectedIds.has(opening.wallId)) return opening;
    const originalWall = originalWallsById.get(opening.wallId);
    const transformedWall = transformedWallsById.get(opening.wallId);
    if (!originalWall || !transformedWall) return opening;
    const originalLength = distance(originalWall.start, originalWall.end);
    const transformedLength = distance(
      transformedWall.start,
      transformedWall.end,
    );
    if (originalLength < MINIMUM_SEGMENT_LENGTH) return opening;
    return {
      ...opening,
      offset: Number(
        ((opening.offset / originalLength) * transformedLength).toFixed(4),
      ),
    };
  });

  return {
    ok: true,
    walls: transformedWalls,
    openings: clampOpeningsToWalls(transformedOpenings, transformedWalls),
    start: transformedPoints[0],
    end: transformedPoints.at(-1),
  };
}
