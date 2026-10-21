import { createHash } from "node:crypto";
import path from "node:path";
import { MAX_MODEL_BYTES } from "../device-platform/DevicePlatformStore.js";

const ALLOWED_LICENSES = new Set([
  "CC0-1.0",
  "CC-BY-4.0",
  "CC-BY-SA-4.0",
  "MIT",
  "Apache-2.0",
]);

const text = (value, fallback = "") =>
  typeof value === "string" && value.trim() ? value.trim() : fallback;

export function normalizeLibraryModelId(value) {
  const normalized = String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!normalized || normalized.length > 96)
    throw new Error("在线模型 ID 无效");
  return normalized;
}

export function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

export function resolveInstalledModelVersion(models, repository, libraryId, digest) {
  const versions = models.filter((item) =>
    item.library?.id === libraryId && item.library?.repository === repository,
  );
  const reused = versions.find((item) => item.library?.sha256 === digest);
  if (reused) return { reused };
  const baseId = `custom.library-${libraryId}`;
  const id = models.some((item) => item.id === baseId)
    ? `${baseId}-${digest.slice(0, 8)}`
    : baseId;
  return { id };
}

function assertModelBytes(bytes, fileName) {
  if (
    !Buffer.isBuffer(bytes) ||
    !bytes.length ||
    bytes.length > MAX_MODEL_BYTES
  )
    throw new Error("在线模型文件必须大于 0 且不超过 15 MB");
  const extension = path.extname(fileName).toLowerCase();
  if (extension === ".glb") {
    if (bytes.subarray(0, 4).toString("ascii") !== "glTF")
      throw new Error("在线 GLB 文件头无效");
    return "model/gltf-binary";
  }
  if (extension === ".gltf") {
    let parsed;
    try {
      parsed = JSON.parse(bytes.toString("utf8"));
    } catch {
      throw new Error("在线 GLTF 不是有效 JSON");
    }
    if (parsed?.asset?.version !== "2.0")
      throw new Error("在线模型仅支持 glTF 2.0");
    const external =
      (parsed.buffers ?? []).some(
        (item) => item?.uri && !String(item.uri).startsWith("data:"),
      ) ||
      (parsed.images ?? []).some(
        (item) => item?.uri && !String(item.uri).startsWith("data:"),
      );
    if (external) throw new Error("在线 GLTF 必须包含内嵌资源；建议使用 GLB");
    return "model/gltf+json";
  }
  throw new Error("在线模型只支持 .glb 或自包含 .gltf");
}

function portableModelTemplate(model) {
  return {
    source:
      model.source?.type === "procedural"
        ? {
            type: "procedural",
            shape: text(model.source.shape, "box"),
          }
        : { type: "upload" },
    dimensions: model.dimensions,
    scale: model.scale,
    anchor: model.anchor,
    placement: model.placement,
    elevation: model.elevation,
    color: model.color,
    roughness: model.roughness,
    metalness: model.metalness,
    runtimeEffect: model.runtimeEffect,
  };
}

function proceduralAsset(model) {
  if (model.source?.type !== "procedural") return undefined;
  const shape = text(model.source.shape, "box");
  if (!new Set(["box", "washing-machine", "pipeline-water-dispenser", "water-purifier", "gas-water-heater", "wifi-router"]).has(shape))
    throw new Error(`暂不支持发布程序化模型形状：${shape}`);
  const bytes = Buffer.from(
    `${JSON.stringify(
      {
        format: "ha3d-procedural-model",
        version: 1,
        modelTemplate: portableModelTemplate(model),
      },
      null,
      2,
    )}\n`,
  );
  return {
    bytes,
    fileName: "model.json",
    mimeType: "application/json",
    kind: "procedural",
  };
}

function parseProceduralAsset(bytes) {
  let payload;
  try {
    payload = JSON.parse(bytes.toString("utf8"));
  } catch {
    throw new Error("在线程序化模型配置不是有效 JSON");
  }
  const model = payload?.modelTemplate;
  if (
    payload?.format !== "ha3d-procedural-model" ||
    payload?.version !== 1 ||
    model?.source?.type !== "procedural"
  )
    throw new Error("在线程序化模型配置格式无效");
  if (!new Set(["box", "washing-machine", "pipeline-water-dispenser", "water-purifier", "gas-water-heater", "wifi-router"]).has(model.source.shape))
    throw new Error("在线程序化模型形状不受支持");
  return model;
}

async function publicationAsset(platform, model) {
  const procedural = proceduralAsset(model);
  if (procedural) return procedural;
  const bundle = await platform.exportBundle();
  const asset = bundle.assets.find(
    (item) => item.modelTemplateId === model.id,
  );
  if (!asset)
    throw new Error("该模型缺少可发布的 GLB/GLTF 文件或程序化模型配置");
  const bytes = Buffer.from(asset.dataBase64, "base64");
  const extension = path.extname(asset.fileName).toLowerCase();
  const mimeType = assertModelBytes(bytes, asset.fileName);
  return {
    bytes,
    fileName: `model${extension}`,
    mimeType,
    kind: "gltf",
  };
}

export class GiteaModelLibrary {
  constructor(config, platform, fetchImpl = fetch) {
    this.config = config ?? {};
    this.platform = platform;
    this.fetch = fetchImpl;
    this.cache = null;
    this.lastSyncedAt = null;
  }

  get configured() {
    return Boolean(this.config.url && this.config.owner && this.config.repo);
  }

  get writable() {
    return (
      this.config.mode === "direct" &&
      Boolean(
        this.config.token || (this.config.username && this.config.password),
      ) &&
      this.config.mode !== "readonly"
    );
  }

  status() {
    return {
      configured: this.configured,
      writable: this.writable,
      mode: this.config.mode ?? "readonly",
      repository: this.configured
        ? `${this.config.owner}/${this.config.repo}`
        : undefined,
      branch: this.config.branch ?? "main",
      webUrl: this.configured
        ? `${this.config.url.replace(/\/+$/, "")}/${this.config.owner}/${this.config.repo}`
        : undefined,
      lastSyncedAt: this.lastSyncedAt,
      cached: Boolean(this.cache),
    };
  }

  async list({ refresh = false, query = "" } = {}) {
    if (!this.configured) throw new Error("在线模型库尚未配置");
    if (!this.cache || refresh) {
      const catalog = await this.#readJson("catalog.json");
      if (!Array.isArray(catalog.models))
        throw new Error("在线模型目录格式无效");
      this.cache = catalog;
      this.lastSyncedAt = new Date().toISOString();
    }
    const needle = String(query).trim().toLowerCase();
    const models = !needle
      ? this.cache.models
      : this.cache.models.filter((item) =>
          [item.id, item.name, item.author, ...(item.tags ?? [])]
            .join(" ")
            .toLowerCase()
            .includes(needle),
        );
    return {
      version: this.cache.version ?? 1,
      updatedAt: this.cache.updatedAt,
      models: structuredClone(models),
      status: this.status(),
    };
  }

  async preview(id) {
    const { normalizedId, summary, manifest } = await this.#resolveEntry(id);
    const isProcedural =
      manifest.file?.kind === "procedural" ||
      manifest.modelTemplate?.source?.type === "procedural";
    return {
      summary: structuredClone(summary),
      model: {
        ...(manifest.modelTemplate ?? {}),
        id: `library.${normalizedId}`,
        name: text(manifest.name, summary.name ?? normalizedId),
        source: isProcedural
          ? manifest.modelTemplate?.source
          : {
              type: "upload",
              url: `./api/model-library/models/${encodeURIComponent(normalizedId)}/file`,
            },
      },
    };
  }

  async asset(id) {
    const { manifest, filePath } = await this.#resolveEntry(id);
    const bytes = await this.#requestBytes(filePath);
    const digest = sha256(bytes);
    if (digest !== manifest.file?.sha256)
      throw new Error("在线模型 SHA-256 校验失败");
    if (manifest.file?.size && Number(manifest.file.size) !== bytes.length)
      throw new Error("在线模型文件大小与清单不一致");
    const extension = path.extname(filePath).toLowerCase();
    const mimeType = text(
      manifest.file?.mimeType,
      extension === ".glb" ? "model/gltf-binary" : "model/gltf+json",
    );
    assertModelBytes(bytes, filePath);
    return {
      bytes,
      mimeType,
      fileName: path.basename(filePath),
    };
  }

  async install(id) {
    const normalizedId = normalizeLibraryModelId(id);
    const catalog = await this.list();
    const summary = catalog.models.find((item) => item.id === normalizedId);
    if (!summary) throw new Error("在线模型不存在");
    const manifestPath = text(
      summary.manifestPath,
      `models/${normalizedId}/manifest.json`,
    );
    const manifest = await this.#readJson(manifestPath);
    const filePath = text(manifest.file?.path);
    if (!filePath || !filePath.startsWith(`models/${normalizedId}/`))
      throw new Error("在线模型清单中的文件路径无效");
    const bytes = await this.#requestBytes(filePath);
    const digest = sha256(bytes);
    if (digest !== manifest.file?.sha256)
      throw new Error("在线模型 SHA-256 校验失败");
    if (manifest.file?.size && Number(manifest.file.size) !== bytes.length)
      throw new Error("在线模型文件大小与清单不一致");
    const installed = resolveInstalledModelVersion(
      this.platform.getModelTemplates(),
      `${this.config.owner}/${this.config.repo}`,
      normalizedId,
      digest,
    );
    if (installed.reused) return { item: installed.reused, manifest, reused: true };
    const localId = installed.id;
    const extension = path.extname(filePath).toLowerCase();
    const isProcedural =
      manifest.file?.kind === "procedural" || extension === ".json";
    const importedTemplate = isProcedural
      ? parseProceduralAsset(bytes)
      : manifest.modelTemplate;
    const mimeType = isProcedural
      ? "application/json"
      : assertModelBytes(bytes, filePath);
    const model = {
      ...(importedTemplate ?? {}),
      id: localId,
      name: text(manifest.name, summary.name ?? normalizedId),
      builtin: false,
      enabled: true,
      library: {
        repository: `${this.config.owner}/${this.config.repo}`,
        id: normalizedId,
        version: text(manifest.version, "1.0.0"),
        sha256: digest,
      },
      source: isProcedural
        ? importedTemplate.source
        : { type: "upload" },
    };
    const item = await this.platform.upsertModelTemplate(
      model,
      isProcedural
        ? undefined
        : {
            name: `${normalizedId}${extension}`,
            dataUrl: `data:${mimeType};base64,${bytes.toString("base64")}`,
          },
    );
    return { item, manifest };
  }

  async previewPublish(input) {
    if (!this.writable) throw new Error("在线模型库未启用直接发布权限");
    const model = this.platform
      .getModelTemplates()
      .find((item) => item.id === input?.modelTemplateId && !item.builtin);
    if (!model) throw new Error("要发布的本地模型不存在");
    const asset = await publicationAsset(this.platform, model);
    const libraryId = normalizeLibraryModelId(input.libraryId ?? model.name);
    const name = text(input.name, model.name);
    const license = text(input.license, "MIT");
    if (!ALLOWED_LICENSES.has(license))
      throw new Error("请选择受支持的模型许可证");
    const suppliedTags = Array.isArray(input.tags)
      ? input.tags
          .map((item) => text(item))
          .filter(Boolean)
          .slice(0, 12)
      : [];
    return {
      modelTemplateId: model.id,
      libraryId,
      name,
      author: text(input.author, this.config.owner),
      description: text(input.description),
      license,
      tags: suppliedTags.length ? suppliedTags : [name],
      fileName: asset.fileName,
      fileKind: asset.kind,
      size: asset.bytes.length,
      sha256: sha256(asset.bytes),
      target: `${this.config.owner}/${this.config.repo}@${this.config.branch}`,
      visibility: "public",
    };
  }

  async publish(input) {
    if (input?.confirmed !== true || input?.rightsConfirmed !== true)
      throw new Error("发布前必须确认目标仓库及模型发布权");
    const preview = await this.previewPublish(input);
    const model = this.platform
      .getModelTemplates()
      .find((item) => item.id === preview.modelTemplateId);
    const asset = await publicationAsset(this.platform, model);
    const bytes = asset.bytes;
    const basePath = `models/${preview.libraryId}`;
    const modelPath = `${basePath}/${preview.fileName}`;
    const manifestPath = `${basePath}/manifest.json`;
    const now = new Date().toISOString();
    const manifest = {
      schemaVersion: 1,
      id: preview.libraryId,
      name: preview.name,
      version: text(input.version, "1.0.0"),
      author: preview.author,
      description: preview.description,
      license: preview.license,
      tags: preview.tags,
      updatedAt: now,
      file: {
        path: modelPath,
        size: bytes.length,
        sha256: preview.sha256,
        mimeType: asset.mimeType,
        kind: asset.kind,
      },
      modelTemplate: portableModelTemplate(model),
    };
    await this.#writeFile(
      modelPath,
      bytes,
      `feat(model): 发布 ${preview.name}`,
    );
    await this.#writeFile(
      manifestPath,
      Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`),
      `docs(model): 更新 ${preview.name} 清单`,
    );
    const catalog = await this.list({ refresh: true });
    const summary = {
      id: preview.libraryId,
      name: preview.name,
      version: manifest.version,
      author: preview.author,
      description: preview.description,
      license: preview.license,
      tags: preview.tags,
      manifestPath,
      updatedAt: now,
    };
    const models = catalog.models.filter(
      (item) => item.id !== preview.libraryId,
    );
    models.push(summary);
    models.sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
    await this.#writeFile(
      "catalog.json",
      Buffer.from(
        `${JSON.stringify({ version: 1, updatedAt: now, models }, null, 2)}\n`,
      ),
      `feat(catalog): 发布 ${preview.name}`,
    );
    this.cache = null;
    return { published: summary, status: this.status() };
  }

  async #resolveEntry(id) {
    const normalizedId = normalizeLibraryModelId(id);
    const catalog = await this.list();
    const summary = catalog.models.find((item) => item.id === normalizedId);
    if (!summary) throw new Error("在线模型不存在");
    const manifestPath = text(
      summary.manifestPath,
      `models/${normalizedId}/manifest.json`,
    );
    const manifest = await this.#readJson(manifestPath);
    const filePath = text(manifest.file?.path);
    if (!filePath || !filePath.startsWith(`models/${normalizedId}/`))
      throw new Error("在线模型清单中的文件路径无效");
    return { normalizedId, summary, manifest, filePath };
  }

  async #readJson(filePath) {
    const bytes = await this.#requestBytes(filePath);
    try {
      return JSON.parse(bytes.toString("utf8"));
    } catch {
      throw new Error(`在线模型库文件不是有效 JSON：${filePath}`);
    }
  }

  async #requestBytes(filePath) {
    const url = `${this.#apiBase()}/raw/${encodeURIComponent(this.config.branch)}/${filePath
      .split("/")
      .map(encodeURIComponent)
      .join("/")}`;
    const response = await this.fetch(url, { headers: this.#headers() });
    if (!response.ok) throw new Error(`在线模型库读取失败：${response.status}`);
    return Buffer.from(await response.arrayBuffer());
  }

  async #writeFile(filePath, bytes, message) {
    const encodedPath = filePath.split("/").map(encodeURIComponent).join("/");
    const url = `${this.#apiBase()}/contents/${encodedPath}`;
    const headers = { ...this.#headers(), "Content-Type": "application/json" };
    let current;
    const lookup = await this.fetch(
      `${url}?ref=${encodeURIComponent(this.config.branch)}`,
      {
        headers,
      },
    );
    if (lookup.ok) current = await lookup.json();
    else if (lookup.status !== 404)
      throw new Error(`在线模型库写入前检查失败：${lookup.status}`);
    const response = await this.fetch(url, {
      method: current ? "PUT" : "POST",
      headers,
      body: JSON.stringify({
        branch: this.config.branch,
        message,
        content: bytes.toString("base64"),
        ...(current?.sha ? { sha: current.sha } : {}),
      }),
    });
    if (!response.ok) throw new Error(`在线模型库写入失败：${response.status}`);
  }

  #apiBase() {
    const apiOrigin = this.config.apiUrl || this.config.url;
    return `${apiOrigin.replace(/\/+$/, "")}/api/v1/repos/${encodeURIComponent(
      this.config.owner,
    )}/${encodeURIComponent(this.config.repo)}`;
  }

  #headers() {
    if (this.config.token)
      return { Authorization: `token ${this.config.token}` };
    if (this.config.username && this.config.password) {
      const encoded = Buffer.from(
        `${this.config.username}:${this.config.password}`,
      ).toString("base64");
      return { Authorization: `Basic ${encoded}` };
    }
    return {};
  }
}
