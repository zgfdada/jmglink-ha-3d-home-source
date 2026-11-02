import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { normalizeFloorplanProject } from "../packages/schema/src/index.js";
import {
  curtainPreset,
  normalizeCurtainTrack,
  resolveCurtainTrack,
  validateCurtainTrack,
  curtainPathMetrics,
  curtainPointAt,
  curtainClothRanges,
  curtainLocalToWorld,
  curtainWorldToLocal,
  resizeCurtainSegment,
  snapCurtainPoint,
} from "../packages/schema/src/curtain-track.js";
import { createCurtainModel } from "../apps/web/src/domain/curtain-model.js";
import { applyCurtainTrackToFloor } from "../apps/web/src/domain/curtain-placement.js";

const track = (opening = "split") =>
  normalizeCurtainTrack({
    points: curtainPreset("u"),
    radius: 0.08,
    drop: 0.05,
    height: 2.55,
    opening,
  });
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-6, `${a} != ${b}`);

test("sheer and blackout share physical tracks but have different material and shadow behavior", () => {
  for (const modelId of ["cover.sheer", "cover.curtain"]) {
    const saved = resolveCurtainTrack({ modelId, curtainTrack: track() }, 2.8);
    const model = createCurtainModel(saved);
    const cloth = model.group.children.find(child => child.name.includes("帘布"));
    assert.equal(saved.fabric, modelId === "cover.sheer" ? "sheer" : "blackout");
    assert.equal(cloth.material.transparent, modelId === "cover.sheer");
    assert.equal(cloth.castShadow, modelId !== "cover.sheer");
    assert.equal(cloth.material.opacity, modelId === "cover.sheer" ? 0.38 : 1);
    model.dispose();
  }
});

test("live track edits retain the last valid path, clamp height and skip identical writes", () => {
  const placement = {id:"curtain",entityId:"cover.test",position:[3,1,4],rotation:[0,1,0],scale:[2,2,2]};
  const floor = {height:2.6,devices:[placement]};
  assert.equal(applyCurtainTrackToFloor(floor,placement.id,{points:[]}),floor);
  const updated = applyCurtainTrackToFloor(floor,placement.id,{...track(),height:8,drop:0.1});
  assert.equal(updated.devices[0].curtainTrack.height,2.5);
  assert.deepEqual(updated.devices[0].position,[3,2.5,4]);
  assert.equal(updated.devices[0].scale,undefined);
  assert.equal(applyCurtainTrackToFloor(updated,placement.id,updated.devices[0].curtainTrack),updated);
  assert.equal(applyCurtainTrackToFloor(updated,placement.id,{points:[[0,0],[1,0],[0,0]]}),updated);
});
test("curtain U and L paths save through the same project normalization used by the server", () => {
  for (const shape of ["line", "l", "u"]) {
    const config = { ...track(), points: curtainPreset(shape) };
    const project = normalizeFloorplanProject({
      floors: [
        {
          id: "floor",
          devices: [
            {
              id: "curtain",
              kind: "cover",
              modelId: "cover.curtain",
              entityId: "cover.test",
              position: [1, 2, 3],
              curtainTrack: config,
            },
          ],
        },
      ],
    });
    assert.deepEqual(project.floors[0].devices[0].curtainTrack, config);
    assert.deepEqual(
      normalizeFloorplanProject(JSON.parse(JSON.stringify(project))).floors[0]
        .devices[0].curtainTrack,
      config,
    );
  }
});
test("invalid, closed, overlapping and self intersecting tracks cannot become saved render paths", () => {
  for (const points of [
    [],
    [[0, 0]],
    [
      [0, 0],
      [0, 0],
    ],
    [
      [0, 0],
      [1, 0],
      [0, 0],
    ],
    [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 0],
    ],
    [
      [0, 0],
      [1, 1],
      [0, 1],
      [1, 0],
    ],
    [
      [0, 0],
      [NaN, 1],
    ],
  ]) {
    assert.ok(validateCurtainTrack({ points }));
    assert.equal(normalizeCurtainTrack({ points }), undefined);
  }
  assert.equal(validateCurtainTrack(track()), "");
  assert.equal(
    validateCurtainTrack({
      points: [
        [0, 0],
        [1, 0],
        [2, 0],
      ],
    }),
    "",
  );
});
test("track world transform matches Three Y rotation and remains editable after moving", () => {
  for (const yaw of [0, Math.PI / 2, -Math.PI / 3, Math.PI]) {
    const device = { position: [5, 2, 8], rotation: [0, yaw, 0] };
    for (const p of curtainPreset("u")) {
      const actual = curtainLocalToWorld(p, device),
        expected = new THREE.Vector3(p[0], 0, p[1])
          .applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw)
          .add(new THREE.Vector3(5, 0, 8));
      close(actual[0], expected.x);
      close(actual[1], expected.z);
      const back = curtainWorldToLocal(actual, device);
      close(back[0], p[0]);
      close(back[1], p[1]);
    }
  }
});
test("legacy dimensions are converted once and explicit tracks ignore all whole-model scales", () => {
  const legacy = {
    position: [0, 1.5, 0],
    scale: [3, 2, 4],
    rotation: [0, 0, 0],
  };
  const resolved = resolveCurtainTrack(legacy, 2.8);
  close(curtainPathMetrics(resolved).length, 3.12);
  close(resolved.height, 1.8);
  close(resolved.drop, 0.96);
  const saved = { ...legacy, curtainTrack: track() };
  assert.deepEqual(
    resolveCurtainTrack(saved, 2.8),
    resolveCurtainTrack({ ...saved, scale: [99, 99, 99] }, 2.8),
  );
  const fit = resolveCurtainTrack(
    { ...saved, curtainTrack: { ...track(), drop: 5, height: 8 } },
    2.64,
  );
  assert.ok(fit.drop + fit.height <= 2.64 + 1e-6);
});
test("rounded track follows full arc length through both corners without jumping", () => {
  const straight = { ...track(), radius: 0 },
    round = track();
  close(curtainPathMetrics(straight).length, 4.5);
  const metrics = curtainPathMetrics(round);
  assert.ok(metrics.length > 4.3 && metrics.length < 4.5);
  let prev = curtainPointAt(metrics, 0).point;
  for (let i = 1; i <= 500; i++) {
    const { point, normal } = curtainPointAt(
      metrics,
      (metrics.length * i) / 500,
    );
    assert.ok(
      Math.hypot(point[0] - prev[0], point[1] - prev[1]) <=
        metrics.length / 500 + 1e-6,
    );
    close(Math.hypot(...normal), 1);
    prev = point;
  }
  assert.deepEqual(prev, round.points.at(-1));
});
test("HA 0 closes full path and HA 100 gathers at selected endpoints for all three modes", () => {
  const len = 4.5;
  for (const mode of ["start", "end", "split"]) {
    const closed = curtainClothRanges(len, 0, mode),
      half = curtainClothRanges(len, 50, mode),
      open = curtainClothRanges(len, 100, mode);
    const total = (ranges) => ranges.reduce((sum, [a, b]) => sum + b - a, 0);
    close(total(closed), len);
    close(total(half), len * 0.55);
    close(total(open), len * 0.1);
    if (mode !== "end") close(open[0][0], 0);
    if (mode !== "start") close(open.at(-1)[1], len);
  }
});
test("precise segment length moves downstream nodes together without changing later segments", () => {
  const points = curtainPreset("u"),
    result = resizeCurtainSegment(points, 1, 4.3);
  close(result[2][0] - result[1][0], 4.3);
  close(result[3][1] - result[2][1], 0.6);
  assert.deepEqual(points, curtainPreset("u"));
  assert.equal(validateCurtainTrack({ points: result }), "");
});
test("drawing snap uses wall surface offset and can disable grid and wall constraints", () => {
  const options = {
    walls: [{ start: [0, 0], end: [4, 0], thickness: 0.14 }],
    wallOffset: 0.12,
    threshold: 0.15,
  };
  assert.deepEqual(snapCurtainPoint([2.01, 0.2], options), [2.01, 0.19]);
  assert.deepEqual(snapCurtainPoint([2.01, -0.2], options), [2.01, -0.19]);
  assert.deepEqual(
    snapCurtainPoint([2.013, 0.213], { ...options, enabled: false }),
    [2.013, 0.213],
  );
  assert.deepEqual(
    snapCurtainPoint([2.1, 0.2], {
      enabled: false,
      forceAxis: true,
      anchor: [0, 0],
    }),
    [2.1, 0],
  );
});
test("3D cloth crosses bends continuously, stays below rail, and updates buffers without reallocating", () => {
  for (const opening of ["start", "end", "split"]) {
    const config = track(opening),
      model = createCurtainModel(config),
      meshes = model.group.children.filter((m) => m.name.includes("帘布"));
    assert.equal(meshes.length, opening === "split" ? 2 : 1);
    const geometries = model.group.children.map((m) => m.geometry),
      disposed = new Set();
    geometries.forEach((g) =>
      g.addEventListener("dispose", () => disposed.add(g)),
    );
    for (const percent of [0, 20, 40, 60, 80, 100, 0]) {
      model.update(percent);
      model.group.children.forEach((mesh) => {
        assert.ok(geometries.includes(mesh.geometry));
        for (const n of mesh.geometry.attributes.position.array)
          assert.ok(Number.isFinite(n));
      });
      const bounds = new THREE.Box3().setFromObject(model.group);
      assert.ok(bounds.max.y < 1e-6);
      close(bounds.min.y, -config.height);
    }
    model.dispose();
    assert.equal(disposed.size, geometries.length);
    assert.equal(model.group.children.length, 0);
  }
});
test("opening a U curtain clears the middle while preserving raycastable cloth at the ends", () => {
  const config = { ...track(), radius: 0 },
    model = createCurtainModel(config),
    ray = new THREE.Raycaster(
      new THREE.Vector3(0, -1, 2),
      new THREE.Vector3(0, 0, -1),
    );
  model.group.updateMatrixWorld(true);
  assert.ok(ray.intersectObject(model.group, true).length > 0);
  model.update(100);
  model.group.updateMatrixWorld(true);
  assert.equal(ray.intersectObject(model.group, true).length, 0);
  model.dispose();
});
