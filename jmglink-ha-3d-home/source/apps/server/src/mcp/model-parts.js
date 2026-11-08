import { readFile } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { fail } from "./store.js";
import { modelPartLabel } from "../../../../packages/schema/src/model-part-labels.js";

export function parseModelFile(bytes, fileName) {
  if (!bytes.length || bytes.length > 15 * 1024 * 1024)
    throw fail("VALIDATION_FAILED", "模型需为1字节至15MiB", 422);
  let document;
  const extension = path.extname(fileName).toLowerCase();
  if (extension === ".glb") {
    if (
      bytes.length < 20 ||
      bytes.toString("ascii", 0, 4) !== "glTF" ||
      bytes.readUInt32LE(4) !== 2 ||
      bytes.readUInt32LE(8) !== bytes.length
    )
      throw fail("VALIDATION_FAILED", "GLB文件头或长度无效", 422);
    let offset = 12;
    while (offset < bytes.length) {
      if (offset + 8 > bytes.length)
        throw fail("VALIDATION_FAILED", "GLB分块不完整", 422);
      const length = bytes.readUInt32LE(offset),
        type = bytes.readUInt32LE(offset + 4);
      if (length % 4 || offset + 8 + length > bytes.length)
        throw fail("VALIDATION_FAILED", "GLB分块长度无效", 422);
      if (type === 0x4e4f534a) {
        if (document)
          throw fail("VALIDATION_FAILED", "GLB包含多个JSON分块", 422);
        document = JSON.parse(
          bytes.toString("utf8", offset + 8, offset + 8 + length),
        );
      }
      offset += 8 + length;
    }
  } else if (extension === ".gltf")
    document = JSON.parse(bytes.toString("utf8"));
  else throw fail("VALIDATION_FAILED", "只支持GLB或自包含GLTF", 422);
  if (document?.asset?.version !== "2.0")
    throw fail("VALIDATION_FAILED", "只支持glTF 2.0", 422);
  // Including GLB: its JSON can still reference external buffers/images.
  for (const item of [...(document.buffers ?? []), ...(document.images ?? [])])
    if (
      item.uri &&
      !/^data:(?:application\/(?:octet-stream|gltf-buffer)|image\/(?:png|jpeg|webp|ktx2));base64,[A-Za-z0-9+/]*={0,2}$/.test(
        item.uri,
      )
    )
      throw fail("RESOURCE_DENIED", "模型必须自包含，禁止远程URL与服务器路径");
  if ((document.nodes?.length ?? 0) > 3000)
    throw fail("BUDGET_EXCEEDED", "模型节点最多3000个");
  return document;
}
// Matches GLTFLoader's simple named-node hierarchy. Complex loader-generated
// children are reported as ambiguous instead of inventing stable target paths.
export function inspectModelDocument(document, labels = {}) {
  const scene = document.scenes?.[document.scene ?? 0];
  if (!scene || !Array.isArray(scene.nodes))
    throw fail("VALIDATION_FAILED", "模型缺少默认场景", 422);
  const sanitize = (name) =>
    String(name ?? "")
      .replace(/\s/g, "_")
      .replace(/[\[\].:/]/g, "");
  const counts = new Map();
  for (const node of document.nodes ?? []) {
    const name = sanitize(node.name);
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  const warnings = [],
    parts = [
      {
        path: "root",
        name: sanitize(scene.name),
        type: "Group",
        depth: 0,
        mesh: false,
        identityTrusted: Boolean(scene.name),
      },
    ];
  let reliable = true;
  function visit(index, location, depth, ancestors) {
    if (depth > 64 || ancestors.has(index) || parts.length >= 3000)
      throw fail("VALIDATION_FAILED", "模型节点循环或层级过深", 422);
    const node = document.nodes?.[index];
    if (!node) throw fail("VALIDATION_FAILED", "模型引用不存在的节点", 422);
    const mesh = document.meshes?.[node.mesh],
      complex =
        node.skin !== undefined ||
        node.camera !== undefined ||
        Object.keys(node.extensions ?? {}).length ||
        (mesh && mesh.primitives?.length !== 1);
    if (complex) {
      reliable = false;
      warnings.push(`${location} 包含加载器生成的子节点，需前端确认部件树`);
    }
    const name = sanitize(node.name);
    parts.push({
      path: location,
      name,
      type: mesh ? "Mesh" : "Object3D",
      depth,
      mesh: Boolean(mesh),
      identityTrusted: Boolean(name) && counts.get(name) === 1,
      translation: node.translation ?? [0, 0, 0],
      rotation: node.rotation ?? [0, 0, 0, 1],
      scale: node.scale ?? [1, 1, 1],
      ...(node.matrix ? { matrix: node.matrix } : {}),
    });
    const next = new Set(ancestors);
    next.add(index);
    (node.children ?? []).forEach((child, i) =>
      visit(child, `${location}/${i}`, depth + 1, next),
    );
  }
  scene.nodes.forEach((index, i) => visit(index, `root/${i}`, 1, new Set()));
  return {
    reliable,
    parts: parts.map((part) => ({
      ...part,
      label: modelPartLabel(part, labels),
    })),
    warnings: [...new Set(warnings)],
  };
}
export async function readModelParts(platform, model, labels) {
  if (model.source?.type !== "upload")
    return {
      reliable: false,
      parts: [],
      warnings: ["程序化模型的部件树由渲染器生成，当前静态检查不推测路径"],
    };
  const prefix = "./api/device-platform/model-files/",
    url = model.source.url;
  if (!url?.startsWith(prefix))
    throw fail("RESOURCE_DENIED", "只读取本地资源库模型文件");
  const name = decodeURIComponent(url.slice(prefix.length));
  if (name !== path.basename(name) || !/^[a-z0-9_.-]+\.(glb|gltf)$/i.test(name))
    throw fail("RESOURCE_DENIED", "模型文件路径无效");
  const bytes = await readFile(path.join(platform.modelAssetDir, name));
  return {
    ...inspectModelDocument(parseModelFile(bytes, name), labels),
    sha256: createHash("sha256").update(bytes).digest("hex"),
    byteLength: bytes.length,
  };
}
