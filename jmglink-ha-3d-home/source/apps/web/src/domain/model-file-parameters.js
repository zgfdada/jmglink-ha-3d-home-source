import { Box3, Vector3 } from "three";

const roundedDimension = (value) =>
  Number(Math.min(20, Math.max(0.05, value)).toFixed(3));

export function inspectGltfModelParameters(scene) {
  if (!scene) throw new Error("模型文件没有可用的 3D 场景");
  const bounds = new Box3().setFromObject(scene);
  if (bounds.isEmpty()) throw new Error("模型文件没有可用的几何体");
  const size = bounds.getSize(new Vector3());
  if (![size.x, size.y, size.z].every(Number.isFinite)) {
    throw new Error("模型文件的尺寸无效");
  }
  const dimensionAdjusted = [size.x, size.y, size.z].some(
    (value) => value < 0.05 || value > 20,
  );

  let material;
  scene.traverse((object) => {
    if (material || !object.isMesh) return;
    const candidates = Array.isArray(object.material)
      ? object.material
      : [object.material];
    material = candidates.find(
      (candidate) => candidate?.color && candidate.isMeshStandardMaterial,
    );
  });

  return {
    dimensions: {
      width: roundedDimension(size.x),
      depth: roundedDimension(size.z),
      height: roundedDimension(size.y),
    },
    dimensionAdjusted,
    ...(material
      ? {
          color: `#${material.color.getHexString()}`,
          roughness: material.roughness,
          metalness: material.metalness,
        }
      : {}),
  };
}
