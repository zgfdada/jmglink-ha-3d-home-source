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

// Reference-style presentation: fixed oblique pitch, unrestricted heading.
export function presentationOrbitLimits(presentation, stacked, preset = 'iso') {
  if (!presentation || preset === 'top' || preset === 'front') return FLOOR_ORBIT_LIMITS;
  const polar = (stacked ? 62 : 48) * Math.PI / 180;
  return {...FLOOR_ORBIT_LIMITS, minPolarAngle: polar, maxPolarAngle: polar, enablePan: true, zoomToCursor: false};
}

export function presentationCameraPosition(target, distance, stacked) {
  const {minPolarAngle: polar} = presentationOrbitLimits(true, stacked);
  const x = stacked ? .86 : .74;
  const z = stacked ? 1.04 : .88;
  const y = Math.hypot(x, z) / Math.tan(polar);
  return [target[0] + x * distance, target[1] + y * distance, target[2] + z * distance];
}

// Move the lens composition, never the world-space rotation centre.
export function applyOrbitProjection(camera, enabled, width, height, insets, verticalShift = 0) {
  if (!enabled) { camera.clearViewOffset?.(); return; }
  const horizontal = ((insets.left ?? 0) - (insets.right ?? 0)) / 2;
  const vertical = ((insets.top ?? 0) - (insets.bottom ?? 0)) / 2;
  camera.setViewOffset(width, height, -horizontal, -vertical - verticalShift, width, height);
}

export function anchorOrbitTarget(camera, controls, target) {
  if (!controls?.target) return;
  const delta = controls.target.clone().fromArray(target).sub(controls.target);
  camera.position.add(delta);
  controls.target.fromArray(target);
}
