import test from "node:test";
import assert from "node:assert/strict";
import { fork } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createReadStream } from "node:fs";
import { request } from "node:http";
import { pipeline } from "node:stream/promises";
import { readInstanceJson } from "../apps/server/src/routes/instanceJson.js";

test(
  "a populated instance imports and exports a large Unicode history and model with a 192 MiB heap",
  { timeout: 90_000 },
  async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "ha3d-import-heap-"));
    const child = fork(
      fileURLToPath(
        new URL("./fixtures/instance-import-server.mjs", import.meta.url),
      ),
      [path.join(dir, "server")],
      {
        execArgv: ["--max-old-space-size=192"],
        stdio: ["ignore", "pipe", "pipe", "ipc"],
        env: { ...process.env, NODE_OPTIONS: "" },
      },
    );
    let logs = "";
    child.stderr.on("data", (chunk) => {
      logs += chunk;
    });
    try {
      const [{ port }] = await Promise.race([
        once(child, "message"),
        once(child, "exit").then(() => {
          throw Error("Import test server exited before listening: " + logs);
        }),
      ]);
      const base = `http://127.0.0.1:${port}`;
      const source = await (await fetch(base + "/api/instance-backup")).json();
      const bytes = Buffer.alloc(12 * 1024 * 1024);
      bytes.write("glTF");
      source.devicePlatform.modelTemplates.push({
        id: "custom.heap-model",
        name: "Heap test",
        source: {
          type: "upload",
          url: "./api/device-platform/model-files/heap.glb",
          fileName: "heap.glb",
          mimeType: "model/gltf-binary",
        },
      });
      source.devicePlatform.assets.push({
        modelTemplateId: "custom.heap-model",
        fileName: "heap.glb",
        mimeType: "model/gltf-binary",
        dataBase64: bytes.toString("base64"),
      });
      const file = path.join(dir, "incoming.json");
      await writeFile(file, JSON.stringify({ confirm: true, backup: source }));
      for (let attempt = 0; attempt < 2; attempt++) {
        const req = request(base + "/api/instance-backup", {
          method: "POST",
          headers: { "content-type": "application/json" },
        });
        const response = once(req, "response");
        await pipeline(createReadStream(file), req);
        const [res] = await response;
        assert.equal(res.statusCode, 200, logs);
        res.resume();
        await once(res, "end");
      }
      const exported = await fetch(base + "/api/instance-backup");
      const { Readable } = await import("node:stream");
      const restored = await readInstanceJson(Readable.fromWeb(exported.body));
      assert.deepEqual(restored.deviceHistory, source.deviceHistory);
      assert.equal(
        restored.devicePlatform.assets[0].dataBase64,
        source.devicePlatform.assets[0].dataBase64,
      );
      assert.equal((await fetch(base + "/health")).status, 200);
      assert.equal(child.exitCode, null, logs);
    } finally {
      if (child.exitCode === null && child.signalCode === null) {
        const exited = once(child, "exit");
        child.kill();
        await exited;
      }
      await rm(dir, { recursive: true, force: true });
    }
  },
);
