import * as THREE from "three";
import { disableSceneEffectPicking } from "./scene-picking.js";

const vertexShader = `
#include <common>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
uniform mat4 uTargetInverse;
varying vec3 vScanPosition;
varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
void main() {
  #include <beginnormal_vertex>
  #include <morphnormal_vertex>
  #include <skinbase_vertex>
  #include <skinnormal_vertex>
  #include <begin_vertex>
  #include <morphtarget_vertex>
  #include <skinning_vertex>
  vec4 local = vec4(transformed, 1.0);
  #ifdef USE_INSTANCING
    local = instanceMatrix * local;
  #endif
  vec4 world = modelMatrix * local;
  vScanPosition = (uTargetInverse * world).xyz;
  vWorldPosition = world.xyz;
  vWorldNormal = normalize(mat3(modelMatrix) * objectNormal);
  gl_Position = projectionMatrix * viewMatrix * world;
}`;
const fragmentShader = `
uniform vec3 uColor;
uniform vec3 uAxis;
uniform vec2 uRange;
uniform float uPhase;
uniform float uWidth;
uniform float uIntensity;
uniform float uWeight;
varying vec3 vScanPosition;
varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
void main() {
  float position = (dot(vScanPosition, uAxis) - uRange.x) / max(0.00001, uRange.y);
  // Travel beyond both ends before wrapping, so the band fades off the body.
  float center = mix(-uWidth, 1.0 + uWidth, uPhase);
  float distance = (position - center) / max(0.01, uWidth);
  float band = exp(-distance * distance * 4.0);
  float rim = pow(1.0 - abs(dot(normalize(vWorldNormal), normalize(cameraPosition - vWorldPosition))), 2.0);
  float alpha = band * (0.82 + 0.16 * rim) * uWeight * clamp(uIntensity, 0.0, 1.0);
  if (alpha < 0.002) discard;
  gl_FragColor = vec4(uColor * uIntensity * (0.8 + 0.5 * rim), alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

// Surface overlays share geometry with the model, while owning only their
// shader materials. They follow animated parts and never expand the hit area.
export function createSurfaceScan(target) {
  target.updateWorldMatrix(true, true);
  const inverse = target.matrixWorld.clone().invert();
  const bounds = new THREE.Box3();
  const surfaces = [];
  target.traverse((part) => {
    if (!part.isMesh) return;
    for (let p = part; p; p = p.parent)
      if (p.userData.partMotionOverlay || p.userData.sceneVisualEffect) return;
    if (part.isInstancedMesh) part.computeBoundingBox();
    else part.geometry.computeBoundingBox();
    bounds.union((part.isInstancedMesh ? part.boundingBox : part.geometry.boundingBox).clone().applyMatrix4(
      new THREE.Matrix4().multiplyMatrices(inverse, part.matrixWorld),
    ));
    surfaces.push(part);
  });
  const uniforms = {
    uTargetInverse: { value: inverse }, uColor: { value: new THREE.Color() },
    uAxis: { value: new THREE.Vector3(0, 0, 1) }, uRange: { value: new THREE.Vector2() },
    uPhase: { value: 0 }, uWidth: { value: 0.2 }, uIntensity: { value: 1.8 }, uWeight: { value: 0 },
  };
  const overlays = surfaces.map((part) => {
    const material = new THREE.ShaderMaterial({
      uniforms, vertexShader, fragmentShader, transparent: true,
      blending: THREE.NormalBlending, depthTest: true, depthWrite: false,
      polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
    });
    const overlay = part.clone(false);
    overlay.name = "表面扫光";
    overlay.userData = { partMotionOverlay: true };
    overlay.material = material;
    overlay.position.set(0, 0, 0); overlay.quaternion.identity(); overlay.scale.set(1, 1, 1);
    overlay.matrixAutoUpdate = true;
    overlay.morphTargetInfluences = part.morphTargetInfluences;
    if (part.isInstancedMesh) {
      overlay.instanceMatrix = part.instanceMatrix;
      overlay.instanceColor = part.instanceColor;
    }
    overlay.castShadow = false; overlay.receiveShadow = false;
    overlay.renderOrder = 8;
    disableSceneEffectPicking(overlay);
    part.add(overlay);
    return { part, overlay };
  });
  let disposed = false;
  return {
    uniforms, overlays,
    hide() { for (const { overlay } of overlays) overlay.visible = false; },
    update(effect, phase, weight) {
      if (disposed) return;
      target.updateWorldMatrix(true, false);
      uniforms.uTargetInverse.value.copy(target.matrixWorld).invert();
      const axis = effect.axis;
      uniforms.uAxis.value.set(axis === "x" ? 1 : 0, axis === "y" ? 1 : 0, axis === "z" ? 1 : 0);
      uniforms.uRange.value.set(bounds.isEmpty() ? 0 : bounds.min[axis], bounds.isEmpty() ? 1 : Math.max(1e-5, bounds.max[axis] - bounds.min[axis]));
      uniforms.uColor.value.set(effect.color);
      uniforms.uPhase.value = ((phase % 1) + 1) % 1;
      uniforms.uWidth.value = effect.width;
      uniforms.uIntensity.value = effect.intensity;
      uniforms.uWeight.value = weight;
      for (const { part, overlay } of overlays) {
        if (part.isInstancedMesh) overlay.count = part.count;
        const materials = Array.isArray(part.material) ? part.material : [part.material];
        overlay.visible = part.visible && materials.some(m => m?.visible !== false && (!m?.transparent || m.opacity > 0.001));
      }
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const { overlay } of overlays) {
        overlay.removeFromParent(); overlay.material.dispose();
      }
    },
  };
}
