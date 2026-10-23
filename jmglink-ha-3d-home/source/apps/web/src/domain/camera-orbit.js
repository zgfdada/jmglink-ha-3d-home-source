// The floor's vertical axis stays Y for every preset, including the top view.
// Changing camera.up to Z would make OrbitControls orbit through the foundation.
export const FLOOR_CAMERA_UP = [0, 1, 0];
export const FLOOR_ORBIT_LIMITS = {
  minPolarAngle: 0,
  maxPolarAngle: Math.PI / 2.05,
  minAzimuthAngle: -Infinity,
  maxAzimuthAngle: Infinity,
};

// Apply viewport framing to the camera and its target together. Moving only the
// target gives a near-vertical Y-up camera a sideways heading (roughly 90°).
export function alignedTopCameraPosition(position, frameTarget, orbitTarget) {
  return position.map((value, index) => value + orbitTarget[index] - frameTarget[index]);
}

// A fitted destination must be reachable by OrbitControls, especially on tall
// screens where safe-area framing can exceed maxDistance.
export function reachableOrbitPosition(position, target, minDistance, maxDistance) {
  const offset = position.map((value, index) => value - target[index]);
  const distance = Math.hypot(...offset);
  if (!distance) return [...position];
  const scale = Math.max(minDistance, Math.min(maxDistance, distance)) / distance;
  return offset.map((value, index) => target[index] + value * scale);
}

export function cancelFitOnOrbitStart(controls, fitting) {
  const cancel = () => { fitting.current = false; };
  controls?.addEventListener('start', cancel);
  return () => controls?.removeEventListener('start', cancel);
}
