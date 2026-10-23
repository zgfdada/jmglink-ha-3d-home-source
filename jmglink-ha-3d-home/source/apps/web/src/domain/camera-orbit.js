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
