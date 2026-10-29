import * as THREE from "three";
import { disableSceneEffectPicking } from "./scene-picking.js";

const GLOW_COLOR = 0x58b8ff;

function createHaloTexture() {
  const side = 64;
  const pixels = new Uint8Array(side * side * 4);
  for (let y = 0; y < side; y += 1)
    for (let x = 0; x < side; x += 1) {
      const distance = Math.hypot(x - 31.5, y - 31.5) / 31.5;
      const ring = Math.exp(-(((distance - 0.55) / 0.19) ** 2));
      const offset = (y * side + x) * 4;
      pixels[offset] = 88;
      pixels[offset + 1] = 184;
      pixels[offset + 2] = 255;
      pixels[offset + 3] = Math.round(ring * 160);
    }
  const texture = new THREE.DataTexture(pixels, side, side, THREE.RGBAFormat);
  texture.needsUpdate = true;
  return texture;
}

const haloTexture = createHaloTexture();

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
  root.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(root);
  const center = bounds.getCenter(new THREE.Vector3());
  const size = bounds.getSize(new THREE.Vector3());
  root.worldToLocal(center);
  const halo = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: haloTexture,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    }),
  );
  halo.position.copy(center);
  halo.scale.set(Math.max(size.x, size.z, 0.2) * 1.75, Math.max(size.y, 0.2) * 1.75, 1);
  halo.renderOrder = 8;
  halo.userData.runtimeGlow = true;
  disableSceneEffectPicking(halo);
  root.add(halo);
  const light = new THREE.PointLight(GLOW_COLOR, 0.2, Math.max(0.8, size.length() * 1.8));
  light.position.copy(center);
  root.add(light);
  return { root, shells, edges, halo, light };
}

export function updateRuntimeModelGlow(effect, seconds) {
  if (!effect) return;
  const pulse = (Math.sin(seconds * 2.4) + 1) / 2;
  for (let index = 0; index < effect.shells.length; index += 1)
    effect.shells[index].material.opacity =
      index % 2 === 0 ? 0.3 + pulse * 0.18 : 0.065 + pulse * 0.08;
  for (const edge of effect.edges) edge.material.opacity = 0.3 + pulse * 0.22;
  effect.halo.material.opacity = 0.35 + pulse * 0.27;
  effect.light.intensity = 0.16 + pulse * 0.3;
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
  effect.halo.removeFromParent();
  effect.halo.material.dispose();
  effect.light.removeFromParent();
  effect.light.dispose();
}
