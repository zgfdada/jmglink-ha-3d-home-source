import test from "node:test";
import assert from "node:assert/strict";
import {
  resolveFloorVerticalElevations,
  objectVerticalHeight,
  verticalReferenceOptionValue,
  parseVerticalReferenceOption,
} from "../apps/web/src/domain/vertical-reference.js";
import {
  normalizeFloorplanProject,
  sampleProject,
} from "../packages/schema/src/index.js";
function fixture(
  reference = { targetType: "ceiling", surface: "bottom", offset: 0 },
) {
  const item = {
    id: "camera-test",
    entityId: "camera.test",
    kind: "camera",
    modelId: "camera.dual",
    position: [1, 8, 1],
    scale: [2, 2, 2],
    verticalReference: reference,
  };
  return { height: 2.64, devices: [item], furniture: [] };
}
test("ceiling-mounted camera top stays on the ceiling through floor-height and scale changes", () => {
  const floor = fixture();
  let h = objectVerticalHeight(floor.devices[0]);
  let y = resolveFloorVerticalElevations(floor).get("device:camera-test");
  assert.ok(Math.abs(y + h - floor.height) < 1e-9);
  floor.height = 3.2;
  floor.devices[0].scale = [3, 3, 3];
  h = objectVerticalHeight(floor.devices[0]);
  y = resolveFloorVerticalElevations(floor).get("device:camera-test");
  assert.ok(Math.abs(y + h - floor.height) < 1e-9);
  floor.devices[0].verticalReference.offset = 5;
  assert.equal(
    resolveFloorVerticalElevations(floor).get("device:camera-test"),
    y,
  );
});
test("legacy and manually raised cameras are capped below the ceiling while desktop height stays intact", () => {
  for (const ref of [
    undefined,
    { targetType: "floor", surface: "top", offset: 10 },
  ]) {
    const floor = fixture(ref);
    floor.devices[0].verticalReference = ref;
    const h = objectVerticalHeight(floor.devices[0]);
    assert.ok(
      resolveFloorVerticalElevations(floor).get("device:camera-test") + h <=
        floor.height + 1e-9,
    );
  }
  const floor = fixture();
  floor.devices[0] = {
    ...floor.devices[0],
    modelId: "camera.desktop",
    scale: [1, 1, 1],
    position: [1, 0.9, 1],
    verticalReference: { targetType: "floor", surface: "top", offset: 0.9 },
  };
  assert.equal(
    resolveFloorVerticalElevations(floor).get("device:camera-test"),
    0.9,
  );
});
test("ceiling references round-trip through project normalization and editor selection", () => {
  const p = structuredClone(sampleProject);
  p.floors[0].devices = [fixture().devices[0]];
  const normalized = normalizeFloorplanProject(p);
  const ref = normalized.floors[0].devices[0].verticalReference;
  assert.equal(ref.targetType, "ceiling");
  assert.equal(verticalReferenceOptionValue(ref), "ceiling");
  assert.equal(parseVerticalReferenceOption("ceiling").surface, "bottom");
});
