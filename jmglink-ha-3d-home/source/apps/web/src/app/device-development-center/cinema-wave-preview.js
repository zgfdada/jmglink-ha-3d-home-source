import * as THREE from "three";

export function usesCinemaWaveEmitters(resource) {
  const vertex = resource.effect?.shader?.vertex ?? "";
  return resource.effect?.type === "scan" && /\bvLayerPhase\b/.test(vertex)
    && /\bvWave\b/.test(vertex) && /\buv\s*\.\s*x\b/.test(vertex);
}

// At thumbnail size the native ring can cover less than one fragment. Give its
// authored radial mask a pixel-space minimum. Phase, colour, fade and the
// vertex shader stay intact. A different authored mask passes through as-is.
export function cinemaWavePreviewShader(shader, pixelRatio) {
  const ring = /float\s+ring\s*=\s*1\.0\s*-\s*smoothstep\(\s*0\.018\s*,\s*0\.060\s*,\s*abs\(\s*r\s*-\s*0\.90\s*\)\s*\)\s*;/;
  if (!ring.test(shader?.fragment ?? "")) return shader;
  const fragment = shader.fragment.replace(ring, `
    float previewPixel = length(vec2(dFdx(r), dFdy(r))) * ${pixelRatio.toFixed(2)};
    float ring = 1.0 - smoothstep(max(0.018, 0.85 * previewPixel),
      max(0.060, 1.78 * previewPixel), abs(r - 0.90));`)
    .replace(/\bvoid\s+main\s*\(\s*(?:void)?\s*\)/, "void renderCinemaWave()");
  return {...shader, fragment: fragment + `
    void main() {
      renderCinemaWave();
      gl_FragColor.a = min(1.0, gl_FragColor.a * 3.0);
    }`};
}

// A neutral box supplies the scale reference. The transient drawing surfaces
// live only inside this preview; neither the model nor their paths are exported.
export function createCinemaWaveExample(root, body) {
  const bounds = new THREE.Box3().setFromObject(body);
  const height = bounds.max.y - bounds.min.y;
  const radius = height * 0.48;
  const depthScale = height * 0.84 / 0.55;
  // Keep the carrier eligible for the scan engine, but draw only its shader overlay.
  const material = new THREE.MeshBasicMaterial({colorWrite:false, depthWrite:false});
  const center = bounds.getCenter(new THREE.Vector3());
  const paths = [];
  let face;

  for (const layer of [0, 0.5, 1]) {
    const geometry = new THREE.PlaneGeometry(0.08, 0.08);
    // The shader looks along -Z. Wind both triangles towards the emitting side.
    geometry.setIndex([0, 1, 2, 2, 1, 3]);
    const uv = geometry.getAttribute("uv");
    for (let vertex = 0; vertex < uv.count; ++vertex) uv.setX(vertex, layer);
    const emitter = new THREE.Mesh(geometry, material);
    emitter.frustumCulled = false;
    emitter.scale.set(radius / 0.58, radius / 0.58, depthScale);
    emitter.position.set(center.x, center.y, bounds.min.z + 0.10 * depthScale - height * 0.012);
    paths.push(`root/${root.children.length}`);
    root.add(emitter);
    emitter.updateWorldMatrix(true, false);
    face ??= emitter;
  }

  const framePoints = [];
  for (const x of [bounds.min.x, bounds.max.x]) {
    for (const y of [bounds.min.y, bounds.max.y]) {
      for (const z of [bounds.min.z, bounds.max.z]) framePoints.push(new THREE.Vector3(x, y, z));
    }
  }
  // Box3 sees only the source planes. Include the shader-displaced swept rim,
  // or a close camera will crop the far ring when its radius peaks.
  for (const [depth, radius] of [[0.10, 0.07], [0.65, 0.58]]) {
    for (let i = 0; i < 32; ++i) {
      const angle = i * Math.PI / 16;
      framePoints.push(face.localToWorld(new THREE.Vector3(radius*Math.cos(angle), radius*Math.sin(angle), -depth)));
    }
  }
  const orientation = face.getWorldQuaternion(new THREE.Quaternion());
  const direction = new THREE.Vector3(0.94, 0.16, -0.52).normalize().applyQuaternion(orientation);
  const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), direction).normalize();
  const up = new THREE.Vector3().crossVectors(direction, right);
  const viewBounds = new THREE.Box3().setFromPoints(framePoints.map(point =>
    new THREE.Vector3(point.dot(right), point.dot(up), point.dot(direction))));
  const middle = viewBounds.getCenter(new THREE.Vector3());
  const focus = right.clone().multiplyScalar(middle.x).addScaledVector(up, middle.y).addScaledVector(direction, middle.z);
  return {
    paths,
    frame(camera, controls) {
      const tanY = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      const tanX = tanY * camera.aspect;
      const distance = Math.max(...framePoints.map(point => {
        const offset = point.clone().sub(focus);
        return offset.dot(direction) + Math.max(Math.abs(offset.dot(right)) / tanX, Math.abs(offset.dot(up)) / tanY) / 0.82;
      }));
      controls.target.copy(focus);
      camera.position.copy(focus).addScaledVector(direction, distance);
      camera.near = Math.max(0.001, distance / 150);
      camera.far = distance * 60;
      camera.updateProjectionMatrix();
      controls.minDistance = height * 0.45;
      controls.maxDistance = distance * 5;
      controls.update();
    },
  };
}
