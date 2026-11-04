import * as THREE from "three";
import { disableSceneEffectPicking } from "./scene-picking.js";

const GLOW_COLOR = 0x58b8ff;

export function createRuntimeModelGlow(root) {
  if (!root) return null;
  const parts = [];
  root.traverse((part) => {
    if (!part.isMesh || part.isSkinnedMesh || !part.geometry || part.userData.runtimeGlow)
      return;
    part.geometry.computeBoundingSphere();
    const radius = part.geometry.boundingSphere?.radius ?? 0;
    if (radius > 0) parts.push({ part, radius });
  });
  parts.sort((a, b) => b.radius - a.radius);
  const shells = [];
  const edges = [];
  for (const { part } of parts.slice(0, 24)) {
    for (const [scale, opacity] of [[1.045, 0.38], [1.085, 0.09]]) {
      const material = new THREE.MeshBasicMaterial({
        color: GLOW_COLOR,
        side: THREE.BackSide,
        transparent: true,
        opacity,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      });
      const shell = new THREE.Mesh(part.geometry, material);
      shell.scale.setScalar(scale);
      shell.renderOrder = 9;
      shell.userData.runtimeGlow = true;
      disableSceneEffectPicking(shell);
      part.add(shell);
      shells.push(shell);
    }
    const vertexCount =
      part.geometry.index?.count ?? part.geometry.getAttribute("position")?.count ?? 0;
    if (vertexCount > 30_000) continue;
    const edgeGeometry = new THREE.EdgesGeometry(part.geometry, 35);
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: GLOW_COLOR,
      transparent: true,
      opacity: 0.38,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });
    const edge = new THREE.LineSegments(edgeGeometry, edgeMaterial);
    edge.scale.setScalar(1.006);
    edge.renderOrder = 10;
    disableSceneEffectPicking(edge);
    part.add(edge);
    edges.push(edge);
  }
  // Keep the running indicator attached to model geometry; do not tint the room.
  return { root, shells, edges };
}

export function updateRuntimeModelGlow(effect, seconds) {
  if (!effect) return;
  const pulse = (Math.sin(seconds * 2.4) + 1) / 2;
  for (let index = 0; index < effect.shells.length; index += 1)
    effect.shells[index].material.opacity =
      index % 2 === 0 ? 0.3 + pulse * 0.18 : 0.065 + pulse * 0.08;
  for (const edge of effect.edges) edge.material.opacity = 0.3 + pulse * 0.22;
}

export function disposeRuntimeModelGlow(effect) {
  if (!effect) return;
  for (const shell of effect.shells) {
    shell.removeFromParent();
    shell.material.dispose();
  }
  for (const edge of effect.edges) {
    edge.removeFromParent();
    edge.geometry.dispose();
    edge.material.dispose();
  }
}
