/** Keep full-height walls aligned with a changed storey height. */
export function resizeFloorHeight(floor, nextHeight) {
  const height = Math.max(2, Math.min(6, Number(nextHeight) || floor.height));
  const previousHeight = floor.height;
  return {
    ...floor,
    height,
    walls: floor.walls.map((wall) => ({
      ...wall,
      height:
        wall.height >= previousHeight - 0.001
          ? height
          : Math.min(wall.height, height),
    })),
  };
}
