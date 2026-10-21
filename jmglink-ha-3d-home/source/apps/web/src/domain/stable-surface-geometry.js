import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

// Keep a non-zero flat core on every axis. The old extruded rounded box used
// radius=min(size)/2, collapsing thin panels and merging centimetre-quantized
// normals across unrelated vertices in the recovered vendor implementation.
export function stableRoundedBoxRadius(size, preferred = 0.12) {
  if (!Array.isArray(size) || size.length !== 3 || size.some(value => !Number.isFinite(value) || value <= 0)) {
    throw new RangeError("Rounded box dimensions must be three positive finite values");
  }
  return Math.min(Math.max(0, preferred), Math.min(...size) * 0.24);
}

export function createStableRoundedBoxGeometry(size) {
  return new RoundedBoxGeometry(...size, 3, stableRoundedBoxRadius(size));
}

// Decorative translucent lines must never write depth over physical surfaces.
// Keep depth testing so walls still hide edges on objects behind them.
export const STABLE_SURFACE_EDGE_PROPS = Object.freeze({ depthWrite: false, depthTest: true });
