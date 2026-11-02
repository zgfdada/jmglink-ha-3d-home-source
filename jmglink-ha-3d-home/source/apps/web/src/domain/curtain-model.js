import * as THREE from "three";
import {
  curtainPathMetrics,
  curtainPointAt,
  curtainClothRanges,
} from "../../../../packages/schema/src/curtain-track.js";

export function createCurtainModel(
  track,
  { position = 0, color = "#d4e4ee", unavailable = false } = {},
) {
  const metrics = curtainPathMetrics(track),
    group = new THREE.Group();
  group.name = "自定义轨道窗帘";
  class RailCurve extends THREE.Curve {
    getPoint(t, target = new THREE.Vector3()) {
      const p = curtainPointAt(metrics, t * metrics.length).point;
      return target.set(p[0], -0.013, p[1]);
    }
  }
  const rail = new THREE.Mesh(
    new THREE.TubeGeometry(
      new RailCurve(),
      Math.min(512, Math.max(24, Math.ceil(metrics.length * 60))),
      0.013,
      6,
      false,
    ),
    new THREE.MeshStandardMaterial({
      color: "#c3cbd4",
      metalness: 0.45,
      roughness: 0.4,
    }),
  );
  rail.name = "窗帘轨道";
  rail.castShadow = true;
  group.add(rail);
  const panels = track.opening === "split" ? 2 : 1,
    columns = Math.min(
      384,
      Math.max(64, Math.ceil((metrics.length * 55) / panels)),
    ),
    meshes = [];
  const sheer = track.fabric === "sheer";
  const clothMaterial = new THREE.MeshStandardMaterial({
    color: sheer ? "#eef4f7" : color,
    side: THREE.DoubleSide,
    roughness: 0.92,
    metalness: 0,
    transparent: sheer || unavailable,
    opacity: unavailable ? 0.28 : sheer ? 0.38 : 1,
    depthWrite: !sheer && !unavailable,
  });
  for (let panel = 0; panel < panels; panel++) {
    const geo = new THREE.BufferGeometry(),
      positions = new Float32Array((columns + 1) * 6),
      indices = [];
    for (let i = 0; i < columns; i++) {
      const k = i * 2;
      indices.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
    }
    geo.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage),
    );
    geo.setIndex(indices);
    const mesh = new THREE.Mesh(geo, clothMaterial);
    mesh.name =
      panels === 1 ? "帘布" : panel === 0 ? "起点侧帘布" : "终点侧帘布";
    mesh.castShadow = !sheer;
    mesh.receiveShadow = true;
    meshes.push(mesh);
    group.add(mesh);
  }
  const update = (open) => {
    const ranges = curtainClothRanges(metrics.length, open, track.opening),
      amplitude = 0.018 + (0.032 * Math.max(0, Math.min(100, open))) / 100;
    meshes.forEach((mesh, panel) => {
      const [start, end] = ranges[panel],
        attr = mesh.geometry.attributes.position,
        folds = Math.max(
          8,
          Math.min(80, Math.round((metrics.length * 8) / panels)),
        );
      for (let i = 0; i <= columns; i++) {
        const t = i / columns,
          { point, normal } = curtainPointAt(
            metrics,
            start + (end - start) * t,
          ),
          fold = Math.sin(t * Math.PI * 2 * folds) * amplitude;
        for (let row = 0; row < 2; row++)
          attr.setXYZ(
            i * 2 + row,
            point[0] + normal[0] * fold,
            row === 0 ? 0 : -track.height,
            point[1] + normal[1] * fold,
          );
      }
      attr.needsUpdate = true;
      mesh.geometry.computeVertexNormals();
      mesh.geometry.computeBoundingSphere();
    });
  };
  update(position);
  return {
    group,
    update,
    dispose() {
      rail.geometry.dispose();
      rail.material.dispose();
      meshes.forEach((m) => m.geometry.dispose());
      clothMaterial.dispose();
      group.clear();
    },
  };
}
