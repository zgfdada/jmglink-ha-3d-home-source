import { readFile, realpath } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { deflateRawSync } from "node:zlib";

export const skillNames = ["ha3d-ha-assistant", "ha3d-hermes-telegram", "ha3d-sidebar-widget-design"];
const resourceRoot = fileURLToPath(new URL("../../resources/agent-skills/", import.meta.url));
const crcTable = Array.from({ length: 256 }, (_, value) => {
  for (let i = 0; i < 8; i++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});
function crc32(data) {
  let value = 0xffffffff;
  for (const byte of data) value = crcTable[(value ^ byte) & 255] ^ (value >>> 8);
  return (value ^ 0xffffffff) >>> 0;
}
async function filesFor(name, root) {
  if (!skillNames.includes(name)) throw new Error("Unknown skill");
  const base = await realpath(root);
  const directory = await realpath(path.join(base, name));
  if (path.dirname(directory) !== base) throw new Error("Skill directory escapes resource root");
  const manifest = JSON.parse(await readFile(path.join(directory, "manifest.json"), "utf8"));
  if (manifest.name !== name || !Array.isArray(manifest.files) || manifest.files.length > 128 || !manifest.files.includes("SKILL.md")) throw new Error("Invalid skill manifest");
  const files = new Map();
  let total = 0;
  for (const relative of manifest.files) {
    if (typeof relative !== "string" || !/^[A-Za-z0-9_/-]+\.(md|py|js|mjs|jsx|yaml|json)$/.test(relative) || relative.startsWith("/") || relative.split("/").includes("..")) throw new Error("Invalid skill file");
    const actual = await realpath(path.join(directory, relative));
    if (!actual.startsWith(directory + path.sep)) throw new Error("Skill file escapes directory");
    const data = await readFile(actual);
    total += data.length;
    if (total > 2 * 1024 * 1024) throw new Error("Skill package too large");
    files.set(relative, data);
  }
  return files;
}
export async function createSkillArchive(name, root = resourceRoot) {
  const files = await filesFor(name, root);
  const local = [], central = [];
  let offset = 0;
  for (const [relative, data] of files) {
    const filename = Buffer.from(name + "/" + relative, "utf8");
    const compressed = deflateRawSync(data);
    const crc = crc32(data);
    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50, 0); header.writeUInt16LE(20, 4);
    header.writeUInt16LE(0x800, 6); header.writeUInt16LE(8, 8);
    header.writeUInt16LE(0x5c21, 12); header.writeUInt32LE(crc, 14);
    header.writeUInt32LE(compressed.length, 18); header.writeUInt32LE(data.length, 22);
    header.writeUInt16LE(filename.length, 26);
    const directory = Buffer.alloc(46);
    directory.writeUInt32LE(0x02014b50, 0); directory.writeUInt16LE(20, 4);
    directory.writeUInt16LE(20, 6); directory.writeUInt16LE(0x800, 8);
    directory.writeUInt16LE(8, 10); directory.writeUInt16LE(0x5c21, 14);
    directory.writeUInt32LE(crc, 16); directory.writeUInt32LE(compressed.length, 20);
    directory.writeUInt32LE(data.length, 24); directory.writeUInt16LE(filename.length, 28);
    directory.writeUInt32LE(offset, 42);
    local.push(header, filename, compressed); central.push(directory, filename);
    offset += header.length + filename.length + compressed.length;
  }
  const centralData = Buffer.concat(central), end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(files.size, 8);
  end.writeUInt16LE(files.size, 10); end.writeUInt32LE(centralData.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...local, centralData, end]);
}
export async function registerSkillPackageRoutes(app, root = resourceRoot) {
  app.get("/agent-skills/:filename", async (request, reply) => {
    const name = request.params.filename.replace(/\.zip$/, "");
    if (request.params.filename !== name + ".zip" || !skillNames.includes(name)) return reply.code(404).send({ error: "未找到接入 skill" });
    try {
      const archive = await createSkillArchive(name, root);
      return reply.header("Cache-Control", "no-store")
        .header("Content-Disposition", 'attachment; filename="' + name + '.zip"')
        .type("application/zip").send(archive);
    } catch {
      return reply.code(503).send({ error: "接入文档暂不可用，请检查服务内 skill 资源" });
    }
  });
  app.get("/agent-skills/:name/SKILL.md", async (request, reply) => {
    if (!skillNames.includes(request.params.name)) return reply.code(404).send({ error: "未找到接入 skill" });
    try {
      const files = await filesFor(request.params.name, root);
      return reply.header("Cache-Control", "no-store").type("text/plain; charset=utf-8").send(files.get("SKILL.md"));
    } catch {
      return reply.code(503).send({ error: "接入文档暂不可用" });
    }
  });
}
