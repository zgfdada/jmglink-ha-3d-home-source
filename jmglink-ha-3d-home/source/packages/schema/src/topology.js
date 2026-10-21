const EPSILON = 1e-5;
const MIN_ROOM_AREA = 0.25;
const KEY_PRECISION = 10_000;
const subtract = (a, b) => [a[0] - b[0], a[1] - b[1]];
const cross = (a, b) => a[0] * b[1] - a[1] * b[0];
const distanceSquared = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
const pointKey = ([x, y]) => `${Math.round(x * KEY_PRECISION)},${Math.round(y * KEY_PRECISION)}`;
function pointOnSegment(point, start, end) {
    const segment = subtract(end, start);
    const relative = subtract(point, start);
    if (Math.abs(cross(segment, relative)) > EPSILON)
        return false;
    const dot = relative[0] * segment[0] + relative[1] * segment[1];
    const lengthSquared = segment[0] ** 2 + segment[1] ** 2;
    return dot >= -EPSILON && dot <= lengthSquared + EPSILON;
}
function segmentIntersection(first, second) {
    const p = first.start;
    const q = second.start;
    const r = subtract(first.end, first.start);
    const s = subtract(second.end, second.start);
    const denominator = cross(r, s);
    if (Math.abs(denominator) < EPSILON)
        return undefined;
    const offset = subtract(q, p);
    const t = cross(offset, s) / denominator;
    const u = cross(offset, r) / denominator;
    if (t < -EPSILON || t > 1 + EPSILON || u < -EPSILON || u > 1 + EPSILON)
        return undefined;
    return [p[0] + t * r[0], p[1] + t * r[1]];
}
function signedArea(polygon) {
    return polygon.reduce((sum, point, index) => {
        const next = polygon[(index + 1) % polygon.length];
        return sum + point[0] * next[1] - next[0] * point[1];
    }, 0) / 2;
}
function polygonCentroid(polygon) {
    const area = signedArea(polygon);
    if (Math.abs(area) < EPSILON) {
        const total = polygon.reduce((sum, point) => [sum[0] + point[0], sum[1] + point[1]], [0, 0]);
        return [total[0] / polygon.length, total[1] / polygon.length];
    }
    let x = 0;
    let y = 0;
    for (let index = 0; index < polygon.length; index += 1) {
        const point = polygon[index];
        const next = polygon[(index + 1) % polygon.length];
        const factor = point[0] * next[1] - next[0] * point[1];
        x += (point[0] + next[0]) * factor;
        y += (point[1] + next[1]) * factor;
    }
    return [x / (6 * area), y / (6 * area)];
}
function pointInPolygon(point, polygon) {
    let inside = false;
    for (let current = 0, previous = polygon.length - 1; current < polygon.length; previous = current, current += 1) {
        const a = polygon[current];
        const b = polygon[previous];
        const intersects = (a[1] > point[1]) !== (b[1] > point[1])
            && point[0] < (b[0] - a[0]) * (point[1] - a[1]) / (b[1] - a[1]) + a[0];
        if (intersects)
            inside = !inside;
    }
    return inside;
}
function simplifyPolygon(polygon) {
    let points = [...polygon];
    let changed = true;
    while (changed && points.length > 3) {
        changed = false;
        const nextPoints = points.filter((point, index) => {
            const previous = points[(index - 1 + points.length) % points.length];
            const next = points[(index + 1) % points.length];
            const duplicate = distanceSquared(point, previous) < EPSILON ** 2;
            const spike = distanceSquared(previous, next) < EPSILON ** 2;
            const collinear = Math.abs(cross(subtract(point, previous), subtract(next, point))) <= EPSILON;
            if (duplicate || spike || collinear)
                changed = true;
            return !duplicate && !spike && !collinear;
        });
        points = nextPoints;
    }
    return points;
}
function stableRoomId(polygon) {
    const keys = polygon.map(pointKey);
    const rotations = keys.map((_, index) => [...keys.slice(index), ...keys.slice(0, index)].join("|"));
    const canonical = rotations.sort()[0] ?? keys.join("|");
    let hash = 2166136261;
    for (const character of canonical) {
        hash ^= character.charCodeAt(0);
        hash = Math.imul(hash, 16777619);
    }
    return `room-${(hash >>> 0).toString(36)}`;
}
function buildPlanarGraph(walls) {
    const splitPoints = walls.map((wall) => [wall.start, wall.end]);
    for (let firstIndex = 0; firstIndex < walls.length; firstIndex += 1) {
        for (let secondIndex = firstIndex + 1; secondIndex < walls.length; secondIndex += 1) {
            const first = walls[firstIndex];
            const second = walls[secondIndex];
            const intersection = segmentIntersection(first, second);
            if (intersection) {
                splitPoints[firstIndex].push(intersection);
                splitPoints[secondIndex].push(intersection);
            }
            for (const point of [second.start, second.end])
                if (pointOnSegment(point, first.start, first.end))
                    splitPoints[firstIndex].push(point);
            for (const point of [first.start, first.end])
                if (pointOnSegment(point, second.start, second.end))
                    splitPoints[secondIndex].push(point);
        }
    }
    const nodes = new Map();
    const edges = new Map();
    walls.forEach((wall, wallIndex) => {
        const vector = subtract(wall.end, wall.start);
        const denominator = vector[0] ** 2 + vector[1] ** 2 || 1;
        const unique = new Map(splitPoints[wallIndex].map((point) => [pointKey(point), point]));
        const sorted = [...unique.values()].sort((a, b) => {
            const aParameter = ((a[0] - wall.start[0]) * vector[0] + (a[1] - wall.start[1]) * vector[1]) / denominator;
            const bParameter = ((b[0] - wall.start[0]) * vector[0] + (b[1] - wall.start[1]) * vector[1]) / denominator;
            return aParameter - bParameter;
        });
        for (let index = 0; index < sorted.length - 1; index += 1) {
            const start = sorted[index];
            const end = sorted[index + 1];
            if (distanceSquared(start, end) < EPSILON ** 2)
                continue;
            const startKey = pointKey(start);
            const endKey = pointKey(end);
            nodes.set(startKey, start);
            nodes.set(endKey, end);
            const edgeKey = startKey < endKey ? `${startKey}|${endKey}` : `${endKey}|${startKey}`;
            edges.set(edgeKey, [startKey, endKey]);
        }
    });
    const adjacency = new Map();
    for (const [start, end] of edges.values()) {
        if (!adjacency.has(start))
            adjacency.set(start, new Set());
        if (!adjacency.has(end))
            adjacency.set(end, new Set());
        adjacency.get(start)?.add(end);
        adjacency.get(end)?.add(start);
    }
    return { nodes, edges, adjacency };
}
function traceFaces(walls) {
    const { nodes, edges, adjacency } = buildPlanarGraph(walls);
    const visited = new Set();
    const faces = [];
    const directedKey = (start, end) => `${start}>${end}`;
    const trace = (initialStart, initialEnd) => {
        const polygonKeys = [];
        let start = initialStart;
        let end = initialEnd;
        const maxSteps = edges.size * 2 + 2;
        for (let step = 0; step < maxSteps; step += 1) {
            const key = directedKey(start, end);
            if (visited.has(key))
                return undefined;
            visited.add(key);
            polygonKeys.push(start);
            const center = nodes.get(end);
            const neighbors = [...(adjacency.get(end) ?? [])];
            if (!center || neighbors.length < 1)
                return undefined;
            neighbors.sort((first, second) => {
                const firstPoint = nodes.get(first);
                const secondPoint = nodes.get(second);
                return Math.atan2(firstPoint[1] - center[1], firstPoint[0] - center[0]) - Math.atan2(secondPoint[1] - center[1], secondPoint[0] - center[0]);
            });
            const reverseIndex = neighbors.indexOf(start);
            if (reverseIndex < 0)
                return undefined;
            const next = neighbors[(reverseIndex - 1 + neighbors.length) % neighbors.length];
            start = end;
            end = next;
            if (start === initialStart && end === initialEnd)
                break;
        }
        if (polygonKeys.length < 3)
            return undefined;
        return simplifyPolygon(polygonKeys.map((key) => nodes.get(key)));
    };
    for (const [first, second] of edges.values()) {
        for (const [start, end] of [[first, second], [second, first]]) {
            if (visited.has(directedKey(start, end)))
                continue;
            const face = trace(start, end);
            if (face && signedArea(face) > MIN_ROOM_AREA)
                faces.push(face);
        }
    }
    return faces;
}
export function deriveRoomsFromWalls(walls, previousRooms = [], defaultFloorMaterialId) {
    const faces = traceFaces(walls).sort((a, b) => Math.abs(signedArea(b)) - Math.abs(signedArea(a)));
    const usedRoomIds = new Set();
    return faces.map((polygon, index) => {
        const center = polygonCentroid(polygon);
        const match = previousRooms
            .filter((room) => !usedRoomIds.has(room.id))
            .map((room) => ({ room, center: polygonCentroid(room.polygon) }))
            .filter(({ room, center: oldCenter }) => pointInPolygon(center, room.polygon) || pointInPolygon(oldCenter, polygon))
            .sort((a, b) => distanceSquared(center, a.center) - distanceSquared(center, b.center))[0]?.room;
        if (match)
            usedRoomIds.add(match.id);
        return {
            id: match?.id ?? stableRoomId(polygon),
            name: match?.name ?? `房间 ${previousRooms.length + index + 1}`,
            polygon,
            floorMaterialId: match?.floorMaterialId ?? defaultFloorMaterialId,
            ceilingMaterialId: match?.ceilingMaterialId,
            haAreaId: match?.haAreaId,
            bindings: match?.bindings,
        };
    });
}
