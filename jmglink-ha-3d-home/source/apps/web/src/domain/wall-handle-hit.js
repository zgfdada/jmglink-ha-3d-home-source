export function wallEndpointHitRadius(length, standardRadius) {
  return Math.min(standardRadius, Math.max(0.12, length * 0.22));
}

export function isWallTranslationHandleHit(point, center, radius = 0.18) {
  return Math.hypot(point[0] - center[0], point[1] - center[1]) <= radius;
}
