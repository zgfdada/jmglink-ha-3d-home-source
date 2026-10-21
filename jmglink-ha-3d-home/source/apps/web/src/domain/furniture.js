import {
  LEGACY_CABINET_KINDS,
  isCabinetKind,
} from "./cabinet-layout.js";

export const CABINET_FURNITURE_KINDS = LEGACY_CABINET_KINDS;
/* Legacy cabinet kinds remain recognizable while persisted data is migrated
 * to the single editable `cabinet` kind by the schema normalizer. */

export const MIN_FURNITURE_ELEVATION = 0;
export const MAX_FURNITURE_ELEVATION = 12;

export function isCabinetFurniture(kind) {
  return isCabinetKind(kind);
}

export function normalizeFurnitureElevation(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return MIN_FURNITURE_ELEVATION;
  return Math.max(
    MIN_FURNITURE_ELEVATION,
    Math.min(MAX_FURNITURE_ELEVATION, numericValue),
  );
}
