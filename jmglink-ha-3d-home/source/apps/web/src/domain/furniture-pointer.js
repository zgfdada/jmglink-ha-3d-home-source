// Preserve the point where the furniture was grabbed instead of snapping its centre
// directly under the pointer. Grid snapping applies to the translation only.
export function translateFurnitureFromPointer(
  originPosition,
  pointerStart,
  pointerCurrent,
  gridSize,
) {
  const delta = [
    pointerCurrent[0] - pointerStart[0],
    pointerCurrent[1] - pointerStart[1],
  ];
  const translation = gridSize
    ? delta.map((value) =>
        Number((Math.round(value / gridSize) * gridSize).toFixed(6)),
      )
    : delta;
  return [
    originPosition[0] + translation[0],
    originPosition[1] + translation[1],
  ];
}
