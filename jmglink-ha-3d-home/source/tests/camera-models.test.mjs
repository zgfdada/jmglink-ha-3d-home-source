import test from "node:test";
import assert from "node:assert/strict";
import { Box3, Vector3 } from "three";
import { CAMERA_MODELS } from "../packages/schema/src/camera-models.js";
import {
  createCameraModel,
  disposeCameraModel,
} from "../apps/web/src/domain/camera-model.js";
import { builtinModelTemplates } from "../apps/server/src/device-platform/devicePlatformSchema.js";
test("all four built-in camera models have selectable procedural definitions and distinct lens counts", () => {
  const builtins = builtinModelTemplates();
  for (const def of CAMERA_MODELS) {
    const saved = builtins.find((m) => m.id === "builtin." + def.id);
    assert.equal(saved.builtin, true);
    assert.equal(saved.source.shape, def.shape);
    assert.equal(saved.placement, def.placement);
    const root = createCameraModel(def.shape);
    const bounds = new Box3().setFromObject(root),
      size = bounds.getSize(new Vector3());
    for (const [axis, dimension] of [
      ["x", "width"],
      ["y", "height"],
      ["z", "depth"],
    ])
      assert.ok(
        Math.abs(size[axis] - def.dimensions[dimension]) < 1e-6,
        def.id + " dimension " + axis,
      );
    assert.ok(Math.abs(bounds.min.y) < 1e-7);
    assert.equal(
      root.children.filter((m) => m.name === "lens").length,
      def.id === "camera.dual" ? 2 : 1,
    );
    root.traverse((mesh) => {
      if (mesh.geometry)
        for (const value of mesh.geometry.attributes.position.array)
          assert.ok(Number.isFinite(value));
    });
    disposeCameraModel(root);
  }
});
test("camera dimensions and color overrides remain independent of built-in definitions", () => {
  const before = structuredClone(CAMERA_MODELS);
  const root = createCameraModel("camera-desktop", {
    dimensions: { width: 0.3, height: 0.4, depth: 0.2 },
    color: "#aa6633",
  });
  const size = new Box3().setFromObject(root).getSize(new Vector3());
  assert.ok(Math.abs(size.y - 0.4) < 1e-6);
  assert.deepEqual(CAMERA_MODELS, before);
  disposeCameraModel(root);
  assert.throws(() => createCameraModel("unknown"));
});
