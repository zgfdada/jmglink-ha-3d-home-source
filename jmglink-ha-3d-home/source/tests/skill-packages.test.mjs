import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { inflateRawSync } from "node:zlib";
import Fastify from "fastify";
import { createSkillArchive, registerSkillPackageRoutes, skillNames } from "../apps/server/src/voice-assistant/SkillPackages.js";
function unzipLocal(buffer) {
  const files = new Map(); let cursor = 0;
  while (buffer.readUInt32LE(cursor) === 0x04034b50) {
    const size = buffer.readUInt32LE(cursor + 18), length = buffer.readUInt16LE(cursor + 26), extra = buffer.readUInt16LE(cursor + 28);
    const name = buffer.subarray(cursor + 30, cursor + 30 + length).toString();
    const start = cursor + 30 + length + extra;
    files.set(name, inflateRawSync(buffer.subarray(start, start + size)).toString());
    cursor = start + size;
  }
  assert.equal(buffer.readUInt32LE(cursor), 0x02014b50);
  assert.equal(buffer.readUInt32LE(buffer.length - 22), 0x06054b50);
  return files;
}
test("平台文档与脚本在服务内可读，ZIP 包含当前澄清和播报逻辑", async () => {
  for (const name of skillNames) {
    const files = unzipLocal(await createSkillArchive(name));
    assert.match(files.get(name + "/SKILL.md"), /^---/);
    assert.ok(files.has(name + "/references/voice-playback.js"));
    assert.ok(files.has(name + "/references/voice-interaction.js"));
    assert.ok(files.has(name + "/scripts/probe.py"));
    assert.equal([...files.keys()].some((name) => name.endsWith(".env") || name.endsWith("voice-assistant.json")), false);
    if (name === "ha3d-hermes-telegram") assert.match(files.get(name + "/scripts/hermes-telegram-bridge/__init__.py"), /async def answer/);
  }
});
test("下载时即时打包文档更新，拒绝未列出的文件与目录穿越", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "ha3d-skill-"));
  const name = skillNames[0], directory = path.join(root, name);
  await mkdir(directory);
  await writeFile(path.join(directory, "manifest.json"), JSON.stringify({ name, files: ["SKILL.md"] }));
  await writeFile(path.join(directory, "SKILL.md"), "原文档");
  await writeFile(path.join(directory, ".env"), "must-not-be-exported");
  const app = Fastify(); await registerSkillPackageRoutes(app, root);
  app.get("/*", async () => "SPA fallback");
  t.after(async () => { await app.close(); await rm(root, { recursive: true, force: true }); });
  let response = await app.inject({ url: "/agent-skills/" + name + ".zip" });
  assert.equal(response.statusCode, 200);
  assert.match(response.headers["content-type"], /application\/zip/);
  assert.match(response.headers["content-disposition"], /attachment/);
  assert.equal(unzipLocal(response.rawPayload).get(name + "/SKILL.md"), "原文档");
  await writeFile(path.join(directory, "SKILL.md"), "已更新的可读文档");
  response = await app.inject({ url: "/agent-skills/" + name + ".zip" });
  assert.equal(unzipLocal(response.rawPayload).get(name + "/SKILL.md"), "已更新的可读文档");
  response = await app.inject({ url: "/agent-skills/" + name + "/SKILL.md" });
  assert.equal(response.body, "已更新的可读文档");
  assert.equal((await app.inject({ url: "/agent-skills/unknown.zip" })).statusCode, 404);
  await writeFile(path.join(directory, "manifest.json"), JSON.stringify({ name, files: ["SKILL.md", "../private.md"] }));
  assert.equal((await app.inject({ url: "/agent-skills/" + name + ".zip" })).statusCode, 503);
});
