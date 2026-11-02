export function normalizeNorthAngle(value) {
  return typeof value === 'number' && Number.isFinite(value) ? ((value % 360) + 360) % 360 : 0;
}

// 户型图向右 +X、向下 +Z；北向角从图上方顺时针计算。
export function resolveSolarDirection(entities = {}, northAngle = 0) {
  const sun = entities['sun.sun'] ?? Object.values(entities).find(entity => entity.domain === 'sun');
  const {azimuth, elevation} = sun?.attributes ?? {};
  if (![azimuth, elevation].every(value => typeof value === 'number' && Number.isFinite(value)) || elevation < -90 || elevation > 90) {
    return {available: false, aboveHorizon: false, direction: [8,14,9]};
  }
  const heading = (azimuth + normalizeNorthAngle(northAngle)) * Math.PI / 180;
  const altitude = elevation * Math.PI / 180;
  return {available: true, aboveHorizon: elevation > 0, azimuth, elevation,
    direction: [Math.sin(heading) * Math.cos(altitude), Math.sin(altitude), -Math.cos(heading) * Math.cos(altitude)]};
}
