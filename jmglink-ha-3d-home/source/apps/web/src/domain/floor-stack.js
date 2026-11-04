// Shared by floor placement and camera framing; never changes stored storey heights.
export function floorStackGap(floors, presentation = true) {
  if (!presentation) return 1.15;
  const points = floors.flatMap(floor => floor.walls.flatMap(wall => [wall.start, wall.end]));
  const width = points.length ? Math.max(...points.map(p => p[0])) - Math.min(...points.map(p => p[0])) : 8;
  const depth = points.length ? Math.max(...points.map(p => p[1])) - Math.min(...points.map(p => p[1])) : 6;
  return Math.max(2.6, Math.min(6, Math.max(width, depth) * 0.30));
}
