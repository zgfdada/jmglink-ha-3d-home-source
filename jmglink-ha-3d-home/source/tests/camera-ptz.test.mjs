import test from "node:test";
import assert from "node:assert/strict";
import Fastify from "fastify";
import {
  registerCameraPtzRoutes,
  cameraPtzData,
} from "../apps/server/src/routes/cameraPtz.js";
test("PTZ routes only act on saved camera bindings and automatically stop each Frigate movement", async () => {
  const app = Fastify();
  const previous = globalThis.fetch;
  const calls = [];
  let failMove = false;
  const camera = {
    entityId: "camera.one",
    domain: "camera",
    state: "idle",
    integration: "frigate",
  };
  const secondary = { ...camera, entityId: "camera.two" };
  const placement = {
    id: "cam",
    entityId: camera.entityId,
    kind: "camera",
    cameraSettings: { secondaryEntityId: secondary.entityId },
  };
  const project = { id: "p", floors: [{ devices: [placement] }] };
  globalThis.fetch = async (url, options) => {
    if (String(url).endsWith("/services"))
      return {
        ok: true,
        json: async () => [{ domain: "frigate", services: { ptz: {} } }],
      };
    const data = JSON.parse(options.body);
    calls.push(data);
    return {
      ok: !(failMove && data.action === "move"),
      status: failMove ? 500 : 200,
    };
  };
  try {
    registerCameraPtzRoutes(
      app,
      {
        config: { ha: { restUrl: "http://mock-ha/api", token: "test-only" } },
        getEntities: () => [
          camera,
          secondary,
          { ...camera, entityId: "camera.other" },
        ],
      },
      { getProject: (id) => (id === "p" ? project : undefined) },
    );
    let r = await app.inject({
      url: "/api/ha/cameras/camera.one/ptz-capabilities",
    });
    assert.equal(r.json().autoProvider, "frigate");
    assert.equal(calls.length, 0);
    const request = {
      method: "POST",
      url: "/api/ha/cameras/camera.one/ptz",
      payload: { projectId: "p", placementId: "cam", command: "left" },
    };
    r = await app.inject(request);
    assert.equal(r.statusCode, 200);
    assert.deepEqual(
      calls.map((c) => c.action),
      ["move", "stop"],
    );
    assert.equal(calls[0].entity_id, "camera.one");
    calls.length = 0;
    r = await app.inject({ ...request, url: "/api/ha/cameras/camera.two/ptz" });
    assert.equal(r.statusCode, 200);
    assert.equal(calls[0].entity_id, "camera.two");
    calls.length = 0;
    assert.equal(
      (
        await app.inject({
          ...request,
          url: "/api/ha/cameras/camera.other/ptz",
        })
      ).statusCode,
      403,
    );
    assert.equal(calls.length, 0);
    assert.equal(
      (
        await app.inject({
          ...request,
          headers: { "sec-fetch-site": "cross-site" },
        })
      ).statusCode,
      403,
    );
    failMove = true;
    r = await app.inject(request);
    assert.equal(r.statusCode, 502);
    assert.deepEqual(
      calls.map((c) => c.action),
      ["move", "stop"],
    );
  } finally {
    globalThis.fetch = previous;
    await app.close();
  }
});
test("ONVIF commands use bounded relative moves and explicit stop, rejecting unknown operations", () => {
  assert.deepEqual(cameraPtzData("onvif", "camera.one", "left"), {
    entity_id: "camera.one",
    move_mode: "RelativeMove",
    distance: 0.1,
    speed: 0.4,
    pan: "LEFT",
  });
  assert.equal(cameraPtzData("onvif", "camera.one", "zoom_in").zoom, "ZOOM_IN");
  assert.equal(cameraPtzData("onvif", "camera.one", "stop").move_mode, "Stop");
  assert.throws(() => cameraPtzData("frigate", "camera.one", "arbitrary"));
});
