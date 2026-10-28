import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { Vector3, Euler } from "three";
import {
  normalizeCameraSettings,
  safeCameraExternalUrl,
  cameraChannels,
  cameraPlanForward,
} from "../packages/schema/src/camera-settings.js";
import { ProjectStore } from "../apps/server/src/projects/ProjectStore.js";
test("camera links accept normal web addresses but reject script schemes and embedded credentials", () => {
  assert.equal(
    safeCameraExternalUrl("https://camera.example/view?id=1"),
    "https://camera.example/view?id=1",
  );
  for (const url of [
    "javascript:alert(1)",
    "file:///secret",
    "https://u:p@example.com",
    "https://example.com/?token=secret",
  ])
    assert.equal(safeCameraExternalUrl(url), "");
  assert.equal(
    normalizeCameraSettings({ secondaryEntityId: "camera.one" }, "camera.one")
      .secondaryEntityId,
    undefined,
  );
});
test("dual camera and PTZ configuration survive disk reload without adding another physical placement", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "ha3d-camera-settings-"));
  try {
    const store = await ProjectStore.create(dir);
    const project = structuredClone(store.getProject());
    project.floors[0].devices.push({
      id: "cam-test",
      kind: "camera",
      entityId: "camera.one",
      position: [1, 1, 1],
      rotation: [0, 1, 0],
      cameraSettings: {
        secondaryEntityId: "camera.two",
        externalUrl: "http://camera.example/",
        ptzProvider: "frigate",
        ptzEntityId: "camera.one",
      },
    });
    await store.saveProject(project);
    const reopened = await ProjectStore.create(dir);
    const device = reopened
      .getProject()
      .floors[0].devices.find((d) => d.id === "cam-test");
    assert.equal(device.cameraSettings.secondaryEntityId, "camera.two");
    assert.equal(device.cameraSettings.ptzProvider, "frigate");
    assert.equal(device.rotation[1], 1);
    const channels = cameraChannels({ entityId: "camera.one" }, device, {
      "camera.two": { entityId: "camera.two", domain: "camera" },
    });
    assert.deepEqual(
      channels.map((c) => c.id),
      ["camera.one", "camera.two"],
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
test("camera plan forward direction matches the 3D lens axis for quarter turns and arbitrary yaw", () => {
  for (const yaw of [0, Math.PI / 2, Math.PI, Math.PI * 1.5, 0.42, -1.27]) {
    const front = new Vector3(0, 0, 1).applyEuler(new Euler(0, yaw, 0));
    const plan = cameraPlanForward(yaw);
    assert.ok(Math.abs(plan[0] - front.x) < 1e-10);
    assert.ok(Math.abs(plan[1] - front.z) < 1e-10);
  }
});
