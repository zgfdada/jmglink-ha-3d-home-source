// Light beams and selection decorations are visual effects, not device surfaces.
export function ignoreSceneEffectRaycast() {}

export function disableSceneEffectPicking(root) {
  if (root) root.userData.sceneVisualEffect = true;
  root?.traverse((object) => {
    object.raycast = ignoreSceneEffectRaycast;
  });
}

const configuredRaycasts = new WeakSet();

function visibleMaterial(material) {
  return material && material.visible !== false &&
    !(material.transparent && material.opacity <= 0.001);
}

export function configureDeviceModelPicking(root) {
  root?.traverse((object) => {
    if (!object.isMesh && !object.isLine && !object.isPoints && !object.isSprite) return;
    if (configuredRaycasts.has(object)) return;
    const original = object.raycast;
    object.raycast = function (raycaster, intersections) {
      for (let node = this; node; node = node.parent) {
        if (!node.visible || node.userData.sceneVisualEffect ||
            node.userData.partMotionOverlay || node.userData.runtimeGlow) return;
      }
      const materials = Array.isArray(this.material) ? this.material : [this.material];
      if (!materials.some(visibleMaterial)) return;
      const start = intersections.length;
      original.call(this, raycaster, intersections);
      // Multi-material models can hide just one face or submesh material.
      for (let i = intersections.length - 1; i >= start; i--) {
        const material = materials[intersections[i].face?.materialIndex ?? 0];
        if (!visibleMaterial(material)) intersections.splice(i, 1);
      }
    };
    configuredRaycasts.add(object);
  });
}
