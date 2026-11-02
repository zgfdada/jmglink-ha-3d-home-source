import * as THREE from "three";

export function rotationGroupTargets(targets) {
  return targets.filter(path => !targets.some(parent => path !== parent && path.startsWith(parent + "/")));
}

export function baselineWorldMatrix(node, baselines) {
  const baseline = baselines.get(node);
  if (!baseline) { node.updateWorldMatrix(true, false); return node.matrixWorld.clone(); }
  const local = new THREE.Matrix4().compose(baseline.position, baseline.quaternion, baseline.scale);
  return node.parent ? baselineWorldMatrix(node.parent, baselines).multiply(local) : local;
}

// Apply one rigid world-space rotation to the selection, not one local rotation per part.
// Keep exact matrices: differently scaled parents can require local shear to preserve the assembly.
export function applySharedPartRotation(targets, referenceFrame, axis, pivot, angle) {
  const center = new THREE.Vector3(...pivot).applyMatrix4(referenceFrame);
  const direction = new THREE.Vector3(axis === "x" ? 1 : 0, axis === "y" ? 1 : 0, axis === "z" ? 1 : 0).transformDirection(referenceFrame);
  const delta = new THREE.Matrix4().makeTranslation(...center.toArray())
    .multiply(new THREE.Matrix4().makeRotationAxis(direction, angle))
    .multiply(new THREE.Matrix4().makeTranslation(...center.clone().negate().toArray()));
  const worlds = targets.map(node => {node.updateWorldMatrix(true, false);return node.matrixWorld.clone();});
  targets.forEach((node, index) => {
    node.parent?.updateWorldMatrix(true, false);
    const local = (node.parent?.matrixWorld.clone().invert() || new THREE.Matrix4()).multiply(delta).multiply(worlds[index]);
    node.matrix.copy(local);
    local.decompose(node.position, node.quaternion, node.scale);
    node.matrixAutoUpdate = false;
    node.matrixWorldNeedsUpdate = true;
  });
}
