import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import Fastify from "fastify";
import {
  isChunkFailure,
  recoverChunkFailure,
  clientErrorRecord,
} from "../apps/web/src/domain/browser-recovery.js";
import {
  normalizeClientError,
  registerClientErrorRoutes,
} from "../apps/server/src/routes/clientErrors.js";
import { registerWebUi } from "../apps/server/src/routes/webUi.js";

test("stale modules reload once, never loop or refresh unrelated errors or offline pages", () => {
  const cache = new Map();
  const storage = {
    getItem: (key) => cache.get(key),
    setItem: (key, value) => cache.set(key, value),
  };
  let reloads = 0;
  const error = Error(
    "Failed to fetch dynamically imported module: http://localhost/assets/old.js",
  );
  assert.equal(isChunkFailure(error), true);
  assert.equal(
    recoverChunkFailure(error, {
      storage,
      now: 100000,
      reload: () => reloads++,
    }),
    true,
  );
  assert.equal(
    recoverChunkFailure(error, {
      storage,
      now: 100001,
      reload: () => reloads++,
    }),
    false,
  );
  assert.equal(reloads, 1);
  assert.equal(
    recoverChunkFailure(Error("Cannot read properties of null"), {
      storage,
      now: 200000,
      reload: () => reloads++,
    }),
    false,
  );
  assert.equal(
    recoverChunkFailure(error, {
      storage,
      now: 200000,
      reload: () => reloads++,
      online: false,
    }),
    false,
  );
  assert.equal(
    recoverChunkFailure(error, {
      storage: {
        getItem() {
          throw Error("Storage blocked");
        },
      },
      now: 200000,
      reload: () => reloads++,
    }),
    false,
  );
  assert.equal(reloads, 1);
});

test("frontend diagnostics retains useful signatures but never raw messages, tokens, query strings or app data", async () => {
  const secret = "not-a-real-test-credential";
  const error = new TypeError(
    `Cannot read properties of null (reading 'geometry') token=${secret}`,
  );
  error.stack = `TypeError token=${secret}\n at draw (http://localhost/assets/scene-abcd.js:12:8)\n at http://localhost/?access_token=${secret}`;
  const record = clientErrorRecord(error, "center");
  assert.equal(record.signature, "null-access:null:geometry");
  assert.deepEqual(record.frames, ["assets/scene-abcd.js:12:8"]);
  assert.equal(JSON.stringify(record).includes(secret), false);
  assert.equal(
    JSON.stringify(
      normalizeClientError({
        ...record,
        message: secret,
        token: secret,
        frames: [...record.frames, `https://host/?token=${secret}`],
      }),
    ).includes(secret),
    false,
  );
  assert.deepEqual(normalizeClientError(null).frames, []);
  const app = Fastify();
  const logs = [];
  app.log.warn = (record) => logs.push(record);
  await registerClientErrorRoutes(app);
  try {
    const result = await app.inject({
      method: "POST",
      url: "/api/client-errors",
      payload: { ...record, message: secret },
    });
    assert.equal(result.statusCode, 200);
    assert.equal(logs[0].clientError.signature, record.signature);
    assert.equal(JSON.stringify(logs).includes(secret), false);
  } finally {
    await app.close();
  }
});

test("missing JS and CSS are actual 404 responses; HTML routes cannot cache obsolete asset references", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "ha3d-web-recovery-"));
  const app = Fastify();
  try {
    await mkdir(path.join(root, "assets"));
    await writeFile(
      path.join(root, "index.html"),
      "<!doctype html><div>current index</div>",
    );
    await writeFile(
      path.join(root, "assets", "current.js"),
      "export default 1;",
    );
    await registerWebUi(app, root);
    for (const url of [
      "/assets/deleted.js",
      "/assets/deleted.css",
      "/old-script.js",
      "/api/missing",
    ]) {
      const result = await app.inject({ url });
      assert.equal(result.statusCode, 404, url);
      assert.equal(
        result.headers["content-type"].includes("text/html"),
        false,
        url,
      );
    }
    for (const url of ["/", "/index.html", "/room/bedroom"]) {
      const result = await app.inject({ url });
      assert.equal(result.statusCode, 200);
      assert.match(result.body, /current index/);
      assert.equal(result.headers["cache-control"], "no-store");
    }
    const current = await app.inject({ url: "/assets/current.js" });
    assert.equal(current.statusCode, 200);
    assert.match(current.headers["content-type"], /javascript/);
  } finally {
    await app.close();
    await rm(root, { recursive: true, force: true });
  }
});
