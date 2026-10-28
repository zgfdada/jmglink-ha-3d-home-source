import * as THREE from "three";
import { cameraModelDefinition } from "../../../../packages/schema/src/camera-models.js";
export function createCameraModel(shape, options = {}) {
  const definition = cameraModelDefinition(shape);
  if (!definition) throw Error("未知摄像头模型");
  const root = new THREE.Group();
  root.name = definition.id;
  const shell = new THREE.MeshStandardMaterial({
    color: options.color ?? "#eef2f5",
    roughness: 0.48,
    metalness: 0.08,
  });
  const dark = new THREE.MeshStandardMaterial({
    color: "#17232e",
    roughness: 0.3,
    metalness: 0.24,
  });
  const glass = new THREE.MeshStandardMaterial({
    color: "#24496d",
    roughness: 0.12,
    metalness: 0.5,
  });
  const light = new THREE.MeshStandardMaterial({
    color: "#70d3e2",
    emissive: "#175062",
    emissiveIntensity: 0.2,
  });
  function add(
    geometry,
    material,
    position,
    rotation = [0, 0, 0],
    name = "housing",
  ) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...position);
    mesh.rotation.set(...rotation);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = name;
    root.add(mesh);
    return mesh;
  }
  const box = (size, pos, mat = shell) =>
    add(new THREE.BoxGeometry(...size), mat, pos);
  const cylinder = (radius, height, pos, mat = shell, rotation = [0, 0, 0]) =>
    add(
      new THREE.CylinderGeometry(radius, radius, height, 32),
      mat,
      pos,
      rotation,
    );
  const ball = (radius, pos) =>
    add(new THREE.SphereGeometry(radius, 32, 20), shell, pos);
  function lens(x, y, z, r = 0.105) {
    cylinder(r * 1.42, 0.055, [x, y, z], dark, [Math.PI / 2, 0, 0]);
    add(
      new THREE.CylinderGeometry(r, r, 0.06, 32),
      glass,
      [x, y, z + 0.028],
      [Math.PI / 2, 0, 0],
      "lens",
    );
    add(
      new THREE.SphereGeometry(r * 0.18, 12, 8),
      light,
      [x + r * 0.25, y + r * 0.28, z + 0.065],
      [0, 0, 0],
      "lens-reflection",
    );
  }
  if (shape === "camera-bullet") {
    cylinder(0.2, 0.07, [0, 0.48, -0.46], shell, [Math.PI / 2, 0, 0]);
    box([0.09, 0.1, 0.32], [0, 0.48, -0.3]);
    cylinder(0.26, 0.72, [0, 0.58, 0.08], shell, [Math.PI / 2, 0, 0]);
    box([0.57, 0.045, 0.86], [0, 0.84, 0.13]);
    lens(0, 0.58, 0.47, 0.16);
  } else if (shape === "camera-dome") {
    cylinder(0.43, 0.13, [0, 0.89, 0]);
    ball(0.36, [0, 0.54, 0]);
    cylinder(0.33, 0.1, [0, 0.22, 0], dark);
    lens(0, 0.49, 0.32, 0.14);
  } else if (shape === "camera-dual") {
    box([0.56, 0.15, 0.3], [0, 0.94, -0.1]);
    cylinder(0.33, 0.34, [0, 0.78, 0]);
    lens(0, 0.8, 0.31, 0.115);
    cylinder(0.23, 0.12, [0, 0.53, 0], dark);
    ball(0.34, [0, 0.28, 0]);
    lens(0, 0.28, 0.31, 0.13);
  } else {
    cylinder(0.34, 0.09, [0, 0.055, 0]);
    box([0.13, 0.27, 0.13], [0, 0.23, -0.035]);
    const head = ball(0.34, [0, 0.66, 0]);
    head.scale.set(1, 1.17, 0.79);
    lens(0, 0.69, 0.275, 0.145);
    add(
      new THREE.SphereGeometry(0.027, 12, 8),
      light,
      [0.18, 0.5, 0.23],
      [0, 0, 0],
      "status-led",
    );
  }
  const bounds = new THREE.Box3().setFromObject(root);
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  for (const child of root.children) {
    child.position.x -= center.x;
    child.position.y -= bounds.min.y;
    child.position.z -= center.z;
  }
  const dims = options.dimensions ?? definition.dimensions;
  root.scale.set(
    dims.width / size.x,
    dims.height / size.y,
    dims.depth / size.z,
  );
  return root;
}
export function disposeCameraModel(root) {
  const materials = new Set();
  root.traverse((part) => {
    part.geometry?.dispose();
    if (part.material) materials.add(part.material);
  });
  materials.forEach((m) => m.dispose());
}
