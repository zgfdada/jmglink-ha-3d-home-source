import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import Fastify from "fastify";
import { exportFilename } from "../packages/schema/src/export-filename.js";
import { createCompleteBackup, registerProjectRoutes } from "../apps/server/src/routes/projectRoutes.js";
const appVersion = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")).version;

test("complete and device exports include name, Beijing time, and version", () => {
  const at = "2026-10-01T16:20:30.000Z";
  assert.equal(exportFilename("complete", "我的家", "0.1.5-custom.16", at), "整体包-我的家-20261002-002030-v0.1.5-custom.16.json");
  assert.equal(exportFilename("device", "波轮/洗衣机", "v1.2.3", at), "波轮-洗衣机设备包-20261002-002030-v1.2.3.json");
});

test("complete backup identifies its application version", () => {
  const bundle = createCompleteBackup({ id: "home" }, { deviceTemplates: [] });
  assert.match(bundle.appVersion, /^0\.1\.5-custom\./);
  assert.ok(bundle.exportedAt);
});

test("complete backup API exposes the named filename in its response", async () => {
  const app = Fastify();
  try {
    await registerProjectRoutes(app, {
      getProject: (id) => id === "home" ? { id, name: "我的家" } : null,
    }, null, { exportBundle: async () => ({ deviceTemplates: [] }) });
    for (const method of ["GET", "POST"]) {
      const response = await app.inject({ method, url: "/api/projects/home/export" });
      assert.equal(response.statusCode, 200);
      const disposition = response.headers["content-disposition"];
      assert.match(disposition, /filename\*=UTF-8''/);
      assert.match(decodeURIComponent(disposition), /整体包-我的家-\d{8}-\d{6}-v/);
      assert.ok(decodeURIComponent(disposition).endsWith(`-v${appVersion}.json`));
      assert.equal(response.json().appVersion, appVersion);
    }
  } finally {
    await app.close();
  }
});
