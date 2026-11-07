import { createHash } from "node:crypto";
import {
  builtinDeviceTemplates,
  builtinModelTemplates,
  normalizeModelTemplate,
} from "./devicePlatformSchema.js";

// Legacy IDs remain valid references; their prefix no longer makes a model read-only.
export function assertModelId(id) {
  if (
    !/^custom\.[a-z0-9][a-z0-9._-]{1,120}$/.test(id ?? "") &&
    !builtinModelTemplates().some((model) => model.id === id)
  )
    throw new Error("模型 ID 格式无效");
}

export function materializeModels(models, suppressed = [], seed = false) {
  const hidden = new Set(suppressed);
  for (const device of builtinDeviceTemplates())
    if (hidden.has(`device:${device.id}`))
      hidden.add(`model:${device.modelTemplateId}`);
  const byId = new Map();
  const incoming = new Map();
  for (const model of models) {
    const normalized = normalizeModelTemplate(model);
    const previous = incoming.get(model.id);
    const identity = (m) => {
      const { createdAt, updatedAt, ...rest } = m;
      return JSON.stringify(stable(rest));
    };
    if (previous && identity(previous) !== identity(normalized))
      throw new Error(`模型 ID 重复且内容冲突：${model.id}`);
    incoming.set(model.id, normalized);
  }
  for (const model of [
    ...(seed
      ? builtinModelTemplates().filter((m) => !hidden.has(`model:${m.id}`))
      : []),
    ...models,
  ]) {
    if (hidden.has(`model:${model.id}`)) continue;
    assertModelId(model.id);
    const normalized = normalizeModelTemplate(model);
    byId.set(model.id, normalized);
  }
  return [...byId.values()];
}

const stable = (value) =>
  Array.isArray(value)
    ? value.map(stable)
    : value && typeof value === "object"
      ? Object.fromEntries(
          Object.keys(value)
            .sort()
            .filter((k) => value[k] !== undefined)
            .map((k) => [k, stable(value[k])]),
        )
      : value;
function fingerprint(model, asset) {
  const { id, builtin, createdAt, updatedAt, name, tags, library, ...content } =
    model;
  // Without the asset bytes an uploaded model is not safe to merge by URL/name.
  if (content.source?.type === "upload") {
    if (!asset?.dataBase64) return `unverified:${id}`;
    content.source = {
      type: "upload",
      mimeType: content.source.mimeType,
      sha256: createHash("sha256")
        .update(Buffer.from(asset.dataBase64, "base64"))
        .digest("hex"),
    };
  }
  return JSON.stringify(stable(content));
}

// Full-instance import owns all reference scopes, including saved release snapshots.
export function deduplicateInstanceModels(instance) {
  const bundle = instance.devicePlatform;
  const models = materializeModels(
    bundle.modelTemplates ?? [],
    bundle.suppressedBuiltinIds,
    bundle.modelCatalogVersion !== 1,
  );
  const assets = new Map();
  for (const asset of bundle.assets ?? []) {
    const previous = assets.get(asset.modelTemplateId);
    if (
      previous &&
      (previous.dataBase64 !== asset.dataBase64 ||
        previous.mimeType !== asset.mimeType)
    )
      throw new Error(`模型文件 ID 重复且内容冲突：${asset.modelTemplateId}`);
    assets.set(asset.modelTemplateId, asset);
  }
  const usage = new Map();
  function count(value, key = "", weight = 100) {
    if (Array.isArray(value)) value.forEach((v) => count(v, key, weight));
    else if (value && typeof value === "object")
      for (const [k, v] of Object.entries(value)) count(v, k, weight);
    else if (["modelId", "modelTemplateId"].includes(key))
      usage.set(value, (usage.get(value) ?? 0) + weight);
  }
  count(instance.projects);
  count(bundle.bindings);
  count(bundle.deviceTemplates);
  count(instance.deviceHistory, "", 1);
  // Device defaults still reference legacy IDs; keep those references resolvable.
  count(builtinDeviceTemplates(), "", 1000000);
  const groups = new Map(),
    aliases = new Map(),
    urls = new Map();
  for (const model of models) {
    const key = fingerprint(model, assets.get(model.id));
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(model);
  }
  const retained = [];
  for (const group of groups.values()) {
    group.sort(
      (a, b) =>
        (usage.get(b.id) ?? 0) - (usage.get(a.id) ?? 0) ||
        Number(a.id.startsWith("builtin.")) -
          Number(b.id.startsWith("builtin.")) ||
        a.id.localeCompare(b.id),
    );
    const keep = group[0];
    keep.tags = [...new Set(group.flatMap((m) => m.tags))].slice(0, 12);
    retained.push(keep);
    for (const duplicate of group.slice(1)) {
      aliases.set(duplicate.id, keep.id);
      if (duplicate.source?.url && keep.source?.url)
        urls.set(duplicate.source.url, keep.source.url);
    }
  }
  function rewrite(value, context = "") {
    if (Array.isArray(value)) {
      value.forEach((v) => rewrite(v, context));
      return;
    }
    if (!value || typeof value !== "object") return;
    for (const [key, item] of Object.entries(value)) {
      if (typeof item === "string") {
        if (
          ["modelId", "modelTemplateId"].includes(key) ||
          (key === "id" &&
            ["model", "customModel", "modelTemplate"].includes(context))
        )
          value[key] = aliases.get(item) ?? item;
        else if (key === "url") value[key] = urls.get(item) ?? item;
      } else rewrite(item, key);
    }
  }
  bundle.modelTemplates = retained;
  bundle.assets = [...assets.values()].filter(
    (a) => !aliases.has(a.modelTemplateId),
  );
  bundle.modelCatalogVersion = 1;
  rewrite(instance);
  return { merged: [...aliases].map(([from, to]) => ({ from, to })) };
}

// The destination stores uploads under its own deterministic filenames. Inline
// furniture models and release snapshots must follow the restored asset URL too.
export function rewriteImportedModelUrls(instance, restoredModels) {
  const restored = new Map(restoredModels.map((model) => [model.id, model]));
  const urls = new Map();
  for (const model of instance.devicePlatform.modelTemplates) {
    const target = restored.get(model.id)?.source?.url;
    if (model.source?.type === "upload" && model.source.url && target)
      urls.set(model.source.url, target);
  }
  function rewrite(value) {
    if (Array.isArray(value)) return value.forEach(rewrite);
    if (!value || typeof value !== "object") return;
    for (const [key, item] of Object.entries(value)) {
      if (key === "url" && typeof item === "string" && urls.has(item))
        value[key] = urls.get(item);
      else if (typeof item === "object") rewrite(item);
    }
  }
  rewrite(instance);
}
