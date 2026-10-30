import {partMotionIssues} from "../../../../packages/schema/src/part-motion.js";
import {normalizeMotionLibraryPackage,MOTION_RESOURCE_FORMAT} from '../../../../packages/schema/src/motion-library.js';
import { normalizeLibraryPackage, CONTROL_PACKAGE_FORMAT } from "../../../../packages/schema/src/control-library.js";
import {
  copyFile,
  mkdir,
  readFile,
  stat,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import {
  capabilityDependencies,
  incompatibleDependencies,
} from "./capabilityDependencies.js";
import {
  builtinControlPanelTemplates,
  builtinDeviceTemplates,
  builtinModelTemplates,
  normalizeControlPanelTemplate,
  normalizeDeviceBinding,
  normalizeDeviceTemplate,
  normalizeModelTemplate,
  starterCustomModelTemplates,
} from "./devicePlatformSchema.js";
import { projectConfigurationSignature } from "./projectLifecycle.js";
import { nextPatchVersion } from "./projectLifecycle.js";

const PLATFORM_VERSION = 1;
const MAX_MODEL_BYTES = 15 * 1024 * 1024;
const FILES = {
  deviceTemplates: "device-templates.json",
  bindings: "device-bindings.json",
  modelTemplates: "model-templates.json",
  controlPanels: "control-panel-templates.json",
  suppressedBuiltins: "suppressed-builtin-templates.json",
  projectReleases: "project-releases.json",
  projectDrafts: "project-release-drafts.json",
  projectTests: "project-test-summaries.json",
};

const CUSTOM_ID_PATTERN = /^custom\.[a-z0-9][a-z0-9._-]{1,120}$/;

function sanitizePortable(value) {
  if (Array.isArray(value)) return value.map(sanitizePortable);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value)
        .filter(
          ([key]) =>
            !/(?:token|password|secret|cookie|authorization|account|cache|log|haurl|resturl|websocketurl)/i.test(
              key,
            ),
        )
        .map(([key, item]) => [key, sanitizePortable(item)]),
    );
  if (
    typeof value === "string" &&
    /(?:https?:\/\/|file:\/\/|[a-z]:[\\/]|\\\\[^\\]|^\/(?:Users|home|mnt|var|etc)\/)/i.test(
      value,
    )
  )
    return "";
  return value;
}

function assertCustomId(id) {
  if (!CUSTOM_ID_PATTERN.test(id))
    throw new Error(
      "自定义 ID 必须以 custom. 开头，并且只能包含小写字母、数字、点、下划线和连字符",
    );
}

function safeModelExtension(fileName, mimeType, bytes) {
  const extension = path.extname(fileName ?? "").toLowerCase();
  if (extension === ".glb" || mimeType === "model/gltf-binary") {
    if (bytes.length < 4 || bytes.subarray(0, 4).toString("ascii") !== "glTF")
      throw new Error("GLB 文件头无效");
    return ".glb";
  }
  if (
    extension === ".gltf" ||
    mimeType === "model/gltf+json" ||
    mimeType === "application/json"
  ) {
    let parsed;
    try {
      parsed = JSON.parse(bytes.toString("utf8"));
    } catch {
      throw new Error("GLTF 文件不是有效 JSON");
    }
    if (parsed?.asset?.version !== "2.0")
      throw new Error("只支持 glTF 2.0 模型");
    const external =
      (parsed.buffers ?? []).some(
        (item) => item?.uri && !String(item.uri).startsWith("data:"),
      ) ||
      (parsed.images ?? []).some(
        (item) => item?.uri && !String(item.uri).startsWith("data:"),
      );
    if (external)
      throw new Error("GLTF 必须是自包含文件；请嵌入纹理和缓冲区，或改用 GLB");
    return ".gltf";
  }
  throw new Error("只支持 .glb 或自包含 .gltf 模型");
}

function decodeDataUrl(dataUrl) {
  if (typeof dataUrl !== "string") throw new Error("模型文件内容缺失");
  const match = /^data:([^;,]+)?(;base64)?,(.*)$/s.exec(dataUrl);
  if (!match) throw new Error("模型文件内容格式无效");
  const bytes = match[2]
    ? Buffer.from(match[3], "base64")
    : Buffer.from(decodeURIComponent(match[3]), "utf8");
  if (!bytes.length || bytes.length > MAX_MODEL_BYTES)
    throw new Error("模型文件必须大于 0 且不超过 15 MB");
  return { bytes, mimeType: match[1] || "application/octet-stream" };
}

async function readCollection(filePath) {
  try {
    const value = JSON.parse(await readFile(filePath, "utf8"));
    return Array.isArray(value.items) ? value.items : [];
  } catch {
    return [];
  }
}

async function atomicWrite(filePath, items) {
  await mkdir(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.tmp`;
  await writeFile(
    temporaryPath,
    JSON.stringify(
      { version: PLATFORM_VERSION, updatedAt: new Date().toISOString(), items },
      null,
      2,
    ),
    "utf8",
  );
  await copyFile(filePath, `${filePath}.bak`).catch(() => {});
  await rename(temporaryPath, filePath);
}

function mergeBuiltins(builtins, custom, suppressedBuiltins, kind) {
  return [
    ...builtins.filter((item) => !suppressedBuiltins.has(`${kind}:${item.id}`)),
    ...custom,
  ].map((item) => structuredClone(item));
}

function expandDeviceTemplateSuppressions(suppressedBuiltins) {
  const expanded = new Set(suppressedBuiltins);
  const modelIds = new Set(builtinModelTemplates().map((item) => item.id));
  const panelIds = new Set(
    builtinControlPanelTemplates().map((item) => item.id),
  );
  for (const template of builtinDeviceTemplates()) {
    if (!expanded.has(`device:${template.id}`)) continue;
    if (template.modelTemplateId && modelIds.has(template.modelTemplateId)) {
      expanded.add(`model:${template.modelTemplateId}`);
    }
    if (
      template.controlPanelTemplateId &&
      panelIds.has(template.controlPanelTemplateId)
    ) {
      expanded.add(`panel:${template.controlPanelTemplateId}`);
    }
  }
  return expanded;
}

function pruneSuppressedBuiltinBindings(bindings, suppressedBuiltins) {
  return bindings
    .filter(
      (binding) =>
        !suppressedBuiltins.has(`device:${binding.deviceTemplateId}`),
    )
    .map((binding) =>
      normalizeDeviceBinding({
        ...binding,
        modelTemplateId: suppressedBuiltins.has(
          `model:${binding.modelTemplateId}`,
        )
          ? undefined
          : binding.modelTemplateId,
        controlPanelTemplateId: suppressedBuiltins.has(
          `panel:${binding.controlPanelTemplateId}`,
        )
          ? undefined
          : binding.controlPanelTemplateId,
      }),
    );
}

function uniqueAssociatedResourceId(resources, deviceTemplateId) {
  if (!deviceTemplateId) return undefined;
  const matches = resources.filter(
    (item) =>
      item.enabled !== false && item.deviceTemplateId === deviceTemplateId,
  );
  return matches.length === 1 ? matches[0].id : undefined;
}

function completeBindingReferences(
  binding,
  deviceTemplates,
  modelTemplates,
  controlPanels,
) {
  const template = deviceTemplates.find(
    (item) => item.id === binding.deviceTemplateId,
  );
  return normalizeDeviceBinding({
    ...binding,
    modelTemplateId:
      binding.modelTemplateId ??
      template?.modelTemplateId ??
      uniqueAssociatedResourceId(modelTemplates, binding.deviceTemplateId),
    controlPanelTemplateId:
      binding.controlPanelTemplateId ??
      template?.controlPanelTemplateId ??
      uniqueAssociatedResourceId(controlPanels, binding.deviceTemplateId),
  });
}

export class DevicePlatformStore {
  constructor(dataDir, assetDir, state) {
    this.dataDir = path.resolve(dataDir);
    this.assetDir = path.resolve(assetDir);
    this.modelAssetDir = path.join(this.assetDir, "device-models");
    this.deviceTemplates = state.deviceTemplates;
    this.modelTemplates = state.modelTemplates;
    this.controlPanels = state.controlPanels;
    this.projectReleases = state.projectReleases ?? [];
    this.projectDrafts = state.projectDrafts ?? [];
    this.projectTests = state.projectTests ?? [];
    this.suppressedBuiltins = expandDeviceTemplateSuppressions(
      state.suppressedBuiltins ?? [],
    );
    this.bindings = pruneSuppressedBuiltinBindings(
      state.bindings,
      this.suppressedBuiltins,
    );
    this.#refreshBindingReferences();
    this.writeQueue = Promise.resolve();
  }

  #refreshBindingReferences() {
    const deviceTemplates = this.getDeviceTemplates();
    const modelTemplates = this.getModelTemplates();
    const controlPanels = this.getControlPanels();
    this.bindings = this.bindings.map((binding) =>
      completeBindingReferences(
        binding,
        deviceTemplates,
        modelTemplates,
        controlPanels,
      ),
    );
  }

  static async create(dataDir, assetDir) {
    const resolved = path.resolve(dataDir);
    const [
      rawDevices,
      rawBindings,
      rawModels,
      rawPanels,
      rawSuppressed,
      rawReleases,
      rawDrafts,
      rawTests,
    ] = await Promise.all([
      readCollection(path.join(resolved, FILES.deviceTemplates)),
      readCollection(path.join(resolved, FILES.bindings)),
      readCollection(path.join(resolved, FILES.modelTemplates)),
      readCollection(path.join(resolved, FILES.controlPanels)),
      readCollection(path.join(resolved, FILES.suppressedBuiltins)),
      readCollection(path.join(resolved, FILES.projectReleases)),
      readCollection(path.join(resolved, FILES.projectDrafts)),
      readCollection(path.join(resolved, FILES.projectTests)),
    ]);
    const safeLoad = (items, normalize) =>
      items.flatMap((item) => {
        try {
          return [normalize(item)];
        } catch {
          return [];
        }
      });
    const starterModels = starterCustomModelTemplates();
    const hasStarterModels = rawModels.some((item) =>
      starterModels.some((starter) => starter.id === item?.id),
    );
    const store = new DevicePlatformStore(dataDir, assetDir, {
      deviceTemplates: safeLoad(rawDevices, (item) =>
        normalizeDeviceTemplate(item),
      ),
      bindings: safeLoad(rawBindings, normalizeDeviceBinding),
      modelTemplates: safeLoad(
        hasStarterModels ? rawModels : [...rawModels, ...starterModels],
        (item) => normalizeModelTemplate(item),
      ),
      controlPanels: safeLoad(rawPanels, (item) =>
        normalizeControlPanelTemplate(item),
      ),
      suppressedBuiltins: rawSuppressed.filter(
        (item) =>
          typeof item === "string" &&
          /^(device|model|panel):builtin\.[a-z0-9._-]+$/.test(item),
      ),
      projectReleases: rawReleases.filter(
        (item) => item?.projectId && item?.version && item?.snapshot,
      ),
      projectDrafts: rawDrafts.filter((item) => item?.projectId),
      projectTests: rawTests.filter((item) => item?.projectId),
    });
    await mkdir(store.modelAssetDir, { recursive: true });
    await store.persistAll();
    return store;
  }

  getDeviceTemplates() {
    return mergeBuiltins(
      builtinDeviceTemplates(),
      this.deviceTemplates,
      this.suppressedBuiltins,
      "device",
    );
  }
  getModelTemplates() {
    return mergeBuiltins(
      builtinModelTemplates(),
      this.modelTemplates,
      this.suppressedBuiltins,
      "model",
    );
  }
  getControlPanels() {
    return mergeBuiltins(
      builtinControlPanelTemplates(),
      this.controlPanels,
      this.suppressedBuiltins,
      "panel",
    );
  }
  getBindings() {
    return this.bindings.map((item) => structuredClone(item));
  }

  getProjectLifecycle(projectId) {
    const releases = this.projectReleases
      .filter((item) => item.projectId === projectId)
      .map((item) => ({
        projectId: item.projectId,
        version: item.version,
        channel: item.channel,
        publishedAt: item.publishedAt,
        notes: item.notes,
        current: item.current === true,
        packageAvailable: item.options?.generatePackage !== false,
      }));
    return {
      draft: structuredClone(
        this.projectDrafts.find((item) => item.projectId === projectId) ?? null,
      ),
      test: structuredClone(
        this.projectTests.find((item) => item.projectId === projectId) ?? null,
      ),
      releases: releases.reverse(),
    };
  }

  getProjectRelease(projectId, version) {
    const item = this.projectReleases.find(
      (release) =>
        release.projectId === projectId && release.version === version,
    );
    if (!item) throw new Error("已发布版本不存在");
    return {
      version: item.version,
      channel: item.channel,
      visibility: item.visibility,
      category: item.category,
      subCategory: item.subCategory,
      notes: item.notes,
      publishedAt: item.publishedAt,
      current: item.current === true,
      project: sanitizePortable(item.snapshot.project),
      model: item.snapshot.model
        ? sanitizePortable({
            ...item.snapshot.model,
            source: { ...item.snapshot.model.source, url: undefined },
          })
        : null,
      panel: item.snapshot.panel ? sanitizePortable(item.snapshot.panel) : null,
    };
  }

  async saveProjectTest(projectId, summary) {
    if (!this.deviceTemplates.some((item) => item.id === projectId))
      throw new Error("自定义设备项目不存在");
    const project = this.deviceTemplates.find((item) => item.id === projectId);
    const model = this.getModelTemplates().find(
      (item) => item.id === project.modelTemplateId,
    );
    const panel = this.getControlPanels().find(
      (item) => item.id === project.controlPanelTemplateId,
    );
    const item = {
      projectId,
      mode: summary.mode === "real" ? "real" : "simulation",
      completedAt: new Date().toISOString(),
      signature: projectConfigurationSignature(project, model, panel),
    };
    this.#upsert(this.projectTests, item, "projectId");
    await this.persistAll();
    return structuredClone(item);
  }

  async saveProjectReleaseDraft(projectId, value) {
    if (!this.deviceTemplates.some((item) => item.id === projectId))
      throw new Error("自定义设备项目不存在");
    const draft = {
      projectId,
      version: String(value.version ?? "").trim(),
      channel: "local",
      visibility: ["private", "team", "public"].includes(value.visibility)
        ? value.visibility
        : "private",
      category: String(value.category ?? "generic").slice(0, 80),
      subCategory: String(value.subCategory ?? "").slice(0, 80),
      notes: String(value.notes ?? "").slice(0, 4000),
      options: {
        setCurrent: value.options?.setCurrent !== false,
        keepDraft: value.options?.keepDraft !== false,
        generatePackage: value.options?.generatePackage !== false,
        allowFork: value.options?.allowFork !== false,
      },
      updatedAt: new Date().toISOString(),
    };
    if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(draft.version))
      throw new Error("版本号须为 X.Y.Z");
    this.#upsert(this.projectDrafts, draft, "projectId");
    await this.persistAll();
    return structuredClone(draft);
  }

  async publishProject(projectId, snapshot) {
    const draft = this.projectDrafts.find(
      (item) => item.projectId === projectId,
    );
    if (!draft) throw new Error("请先保存发布草稿");
    if (
      this.projectReleases.some(
        (item) =>
          item.projectId === projectId && item.version === draft.version,
      )
    )
      throw new Error("版本号已发布，不可覆盖");
    const frozen = structuredClone(snapshot);
    if (frozen.model?.source?.type === "upload")
      frozen.asset = await this.#readProjectModel(frozen.model);
    const record = {
      ...draft,
      current: draft.options?.setCurrent !== false,
      publishedAt: new Date().toISOString(),
      snapshot: frozen,
    };
    const oldReleases = structuredClone(this.projectReleases);
    const oldDrafts = structuredClone(this.projectDrafts);
    if (record.current)
      for (const older of this.projectReleases)
        if (older.projectId === projectId) older.current = false;
    this.projectReleases.push(record);
    if (draft.options?.keepDraft !== false)
      this.#upsert(
        this.projectDrafts,
        {
          ...draft,
          version: nextPatchVersion(draft.version),
          updatedAt: new Date().toISOString(),
        },
        "projectId",
      );
    else
      this.projectDrafts = this.projectDrafts.filter(
        (item) => item.projectId !== projectId,
      );
    try {
      await this.persistAll();
    } catch (error) {
      this.projectReleases = oldReleases;
      this.projectDrafts = oldDrafts;
      await this.persistAll().catch(() => {});
      throw error;
    }
    return {
      projectId,
      version: record.version,
      publishedAt: record.publishedAt,
    };
  }

  async exportProjectPackage(projectId, version = null) {
    const released = version
      ? this.projectReleases.find(
          (item) => item.projectId === projectId && item.version === version,
        )
      : null;
    if (version && !released) throw new Error("已发布版本不存在");
    if (released?.options?.generatePackage === false)
      throw new Error("此版本未开启设备包导出");
    const project =
      released?.snapshot?.project ??
      this.deviceTemplates.find((item) => item.id === projectId);
    if (!project) throw new Error("自定义设备项目不存在");
    const model =
      released?.snapshot?.model ??
      this.getModelTemplates().find(
        (item) => item.id === project.modelTemplateId,
      );
    const panel =
      released?.snapshot?.panel ??
      this.getControlPanels().find(
        (item) => item.id === project.controlPanelTemplateId,
      );
    const asset =
      released?.snapshot?.asset ??
      (model?.source?.type === "upload"
        ? await this.#readProjectModel(model)
        : null);
    const cleanProject = sanitizePortable(
      (({
        id,
        name,
        category,
        subCategory,
        manufacturer,
        model: modelName,
        icon,
        description,
        matchRules,
        capabilities,
        statusDisplay,
        runtimeDisplay,
        appearance,
        modelTemplateId,
        controlPanelTemplateId,
      }) => ({
        id,
        name,
        category,
        subCategory,
        manufacturer,
        model: modelName,
        icon,
        description,
        matchRules,
        capabilities,
        statusDisplay,
        runtimeDisplay,
        appearance,
        modelTemplateId,
        controlPanelTemplateId,
      }))(project),
    );
    const cleanModel = model
      ? sanitizePortable({
          ...structuredClone(model),
          source: {
            ...model.source,
            url: undefined,
            fileName:
              model.source?.type === "upload"
                ? path.basename(asset?.fileName ?? "model.glb")
                : undefined,
          },
          library: undefined,
        })
      : null;
    const cleanPanel = panel ? sanitizePortable(structuredClone(panel)) : null;
    const publication =
      released ??
      this.projectDrafts.find((item) => item.projectId === projectId);
    const packageVersion = publication?.version ?? "0.0.0";
    return {
      format: "ha3d-device-project",
      schemaVersion: 1,
      manifest: sanitizePortable({
        name: project.name,
        version: packageVersion,
        channel: released?.channel ?? "draft",
        visibility: publication?.visibility ?? "private",
        category: publication?.category ?? project.category,
        subCategory: publication?.subCategory ?? project.subCategory ?? "",
        notes: publication?.notes ?? "",
        allowFork: released?.options?.allowFork !== false,
        exportedAt: new Date().toISOString(),
        requiresHaRematch: true,
      }),
      project: cleanProject,
      capabilities: cleanProject.capabilities,
      runtimeDisplay: cleanProject.runtimeDisplay,
      modelConfig: cleanProject.appearance,
      version: {
        number: packageVersion,
        publishedAt: released?.publishedAt ?? null,
      },
      assets: [],
      panel: cleanPanel,
      model: cleanModel,
      asset: asset
        ? { ...asset, fileName: path.basename(asset.fileName) }
        : null,
    };
  }

  async #readProjectModel(model) {
    const rawName = model.source?.url?.split("/model-files/")[1];
    if (!rawName || rawName.includes("/") || rawName.includes("?"))
      throw new Error("模型文件不可用");
    const name = path.basename(decodeURIComponent(rawName));
    if (!/^[a-z0-9_.-]+\.(glb|gltf)$/i.test(name))
      throw new Error("模型文件名无效");
    const bytes = await readFile(path.join(this.modelAssetDir, name));
    return {
      fileName: model.source.fileName ?? name,
      mimeType: model.source.mimeType,
      dataBase64: bytes.toString("base64"),
    };
  }

  async importProjectPackage(bundle) {
    if (
      bundle?.format !== "ha3d-device-project" ||
      bundle.schemaVersion !== 1 ||
      !bundle.project ||
      !bundle.manifest
    )
      throw new Error("设备项目包格式无效");
    if (bundle.manifest?.allowFork === false)
      throw new Error("此版本不允许从设备包创建新草稿");
    const nonce = createHash("sha256")
      .update(`${Date.now()}-${Math.random()}`)
      .digest("hex")
      .slice(0, 16);
    const projectId = `custom.import-${nonce}`;
    const modelId = `custom.model-${nonce}`;
    const panelId = `custom.panel-${nonce}`;
    const project = normalizeDeviceTemplate({
      ...bundle.project,
      id: projectId,
      modelTemplateId: bundle.model ? modelId : undefined,
      controlPanelTemplateId: bundle.panel ? panelId : undefined,
      createdAt: new Date().toISOString(),
    });
    const modelInput = bundle.model
      ? {
          ...bundle.model,
          id: modelId,
          deviceTemplateId: projectId,
        }
      : null;
    const panel = bundle.panel
      ? normalizeControlPanelTemplate({
          ...bundle.panel,
          id: panelId,
          deviceTemplateId: projectId,
        })
      : null;
    let model;
    let createdModelPath;
    if (modelInput?.source?.type === "upload") {
      const asset = bundle.asset;
      if (!asset?.dataBase64 || typeof asset.fileName !== "string")
        throw new Error("设备项目包缺少模型文件");
      const { bytes, mimeType } = decodeDataUrl(
        `data:${asset.mimeType || "application/octet-stream"};base64,${asset.dataBase64}`,
      );
      const extension = safeModelExtension(asset.fileName, mimeType, bytes);
      const storedName = `${modelId.replace(/[^a-z0-9_-]/g, "_")}${extension}`;
      createdModelPath = path.join(this.modelAssetDir, storedName);
      await writeFile(createdModelPath, bytes);
      model = normalizeModelTemplate(modelInput, {
        sourceOverride: {
          type: "upload",
          url: `./api/device-platform/model-files/${encodeURIComponent(storedName)}`,
          fileName: asset.fileName,
          mimeType,
        },
      });
    } else if (modelInput) model = normalizeModelTemplate(modelInput);
    this.deviceTemplates.push(project);
    if (model) this.modelTemplates.push(model);
    if (panel) this.controlPanels.push(panel);
    try {
      await this.persistAll();
    } catch (error) {
      this.deviceTemplates = this.deviceTemplates.filter(
        (item) => item.id !== projectId,
      );
      this.modelTemplates = this.modelTemplates.filter(
        (item) => item.id !== modelId,
      );
      this.controlPanels = this.controlPanels.filter(
        (item) => item.id !== panelId,
      );
      if (createdModelPath) await rm(createdModelPath).catch(() => {});
      await this.persistAll().catch(() => {});
      throw error;
    }
    return { projectId, requiresHaRematch: true };
  }

  snapshot() {
    return {
      version: PLATFORM_VERSION,
      global: true,
      ...(this.controlLibrary ? { controlLibrary: this.controlLibrary.list() } : {}),
      deviceTemplates: this.getDeviceTemplates(),
      modelTemplates: this.getModelTemplates(),
      controlPanels: this.getControlPanels(),
      bindings: this.getBindings(),
      suppressedBuiltinIds: [...this.suppressedBuiltins].sort(),
    };
  }

  async upsertDeviceTemplate(value) {
    assertCustomId(value?.id);
    const normalized = normalizeDeviceTemplate(value);
    this.#upsert(this.deviceTemplates, normalized);
    this.#refreshBindingReferences();
    await this.persistAll();
    return structuredClone(normalized);
  }

  async upsertControlPanel(value) {
    assertCustomId(value?.id);
    const normalized = normalizeControlPanelTemplate(value);
    this.#upsert(this.controlPanels, normalized);
    this.#refreshBindingReferences();
    await this.persistAll();
    return structuredClone(normalized);
  }

  async saveProjectControlPanel(projectId, draft) {
    const project = this.deviceTemplates.find(
      (item) => item.id === projectId && !item.builtin,
    );
    if (!project) throw new Error("自定义设备项目不存在");
    const panelId =
      this.controlPanels.find(
        (item) =>
          item.id === project.controlPanelTemplateId &&
          item.deviceTemplateId === projectId,
      )?.id ??
      `custom.panel-${createHash("sha256").update(projectId).digest("hex").slice(0, 24)}`;
    const normalized = normalizeControlPanelTemplate({
      ...draft,
      id: panelId,
      deviceTemplateId: projectId,
      layoutMode: "grid",
    });
    if (normalized.sections.length !== 1)
      throw new Error("当前项目仅支持一套控制面板画布");
    if (normalized.sections[0].controls.length > 80)
      throw new Error("控制面板组件不能超过 80 个");
    const ids = new Set();
    for (const control of normalized.sections[0].controls) {
      if (ids.has(control.id)) throw new Error("控制面板组件 ID 重复");
      ids.add(control.id);
      const capability = project.capabilities.find(
        (item) => item.capabilityId === control.capabilityId,
      );
      if (!capability) continue; // Deleted references remain visible for repair.
      const type = control.type;
      const compatible =
        type === "toggle"
          ? capability.kind === "toggle" || capability.dataType === "boolean"
          : type === "select"
            ? capability.kind === "enum" || capability.dataType === "enum"
            : ["slider", "number", "progress"].includes(type)
              ? capability.dataType === "number"
              : type === "button"
                ? capability.kind === "action"
                : true;
      if (!compatible)
        throw new Error(`组件“${control.label}”绑定能力类型不兼容`);
    }
    const previous = {
      panels: this.controlPanels,
      templates: this.deviceTemplates,
      bindings: this.bindings,
    };
    this.controlPanels = [
      ...this.controlPanels.filter((item) => item.id !== panelId),
      normalized,
    ];
    this.deviceTemplates = this.deviceTemplates.map((item) =>
      item.id === projectId
        ? normalizeDeviceTemplate({ ...item, controlPanelTemplateId: panelId })
        : item,
    );
    this.bindings = this.bindings.map((item) =>
      item.deviceTemplateId === projectId
        ? { ...item, controlPanelTemplateId: panelId }
        : item,
    );
    try {
      await this.persistAll();
    } catch (error) {
      this.controlPanels = previous.panels;
      this.deviceTemplates = previous.templates;
      this.bindings = previous.bindings;
      throw error;
    }
    return { item: structuredClone(normalized) };
  }

  async upsertBinding(value) {
    const existing = this.bindings.find(
      (item) => item.deviceId === value?.deviceId,
    );
    const legacyMappings =
      value?.capabilityBindings && !value.capabilityMappings
        ? Object.fromEntries(
            Object.entries(value.capabilityBindings)
              .filter(([, ids]) => Array.isArray(ids) && ids[0])
              .map(([id, ids]) => [
                id,
                {
                  entityId: ids[0],
                  attribute:
                    existing?.capabilityMappings?.[id]?.entityId === ids[0]
                      ? existing.capabilityMappings[id].attribute
                      : "state",
                },
              ]),
          )
        : undefined;
    const normalized = completeBindingReferences(
      normalizeDeviceBinding(
        existing
          ? {
              ...existing,
              ...value,
              ...(legacyMappings ? { capabilityMappings: legacyMappings } : {}),
            }
          : value,
      ),
      this.getDeviceTemplates(),
      this.getModelTemplates(),
      this.getControlPanels(),
    );
    const templateIds = new Set(
      this.getDeviceTemplates().map((item) => item.id),
    );
    if (
      !normalized.deviceTemplateId ||
      !templateIds.has(normalized.deviceTemplateId)
    )
      throw new Error("绑定引用的设备模板不存在");
    if (
      normalized.modelTemplateId &&
      !this.getModelTemplates().some(
        (item) => item.id === normalized.modelTemplateId,
      )
    )
      throw new Error("绑定引用的 3D 模型不存在");
    if (
      normalized.controlPanelTemplateId &&
      !this.getControlPanels().some(
        (item) => item.id === normalized.controlPanelTemplateId,
      )
    )
      throw new Error("绑定引用的控制面板不存在");
    this.#upsert(this.bindings, normalized, "deviceId");
    await this.persistAll();
    return structuredClone(normalized);
  }

  getCapabilityDependencies(projectId, capabilityId) {
    const project = this.getDeviceTemplates().find(
      (item) => item.id === projectId && !item.builtin,
    );
    if (!project) throw new Error("自定义设备项目不存在");
    return capabilityDependencies(
      project,
      this.getModelTemplates(),
      this.getControlPanels(),
      capabilityId,
    );
  }

  async projectModelFileAvailable(projectId) {
    const project = this.getDeviceTemplates().find(
      (item) => item.id === projectId,
    );
    const model = this.getModelTemplates().find(
      (item) => item.id === project?.modelTemplateId,
    );
    if (!model) return false;
    if (model.source?.type !== "upload") return true;
    const name = model.source.url?.split("/model-files/")[1];
    if (!name || name.includes("/") || name.includes("?")) return false;
    try {
      const file = await stat(
        path.join(this.modelAssetDir, path.basename(decodeURIComponent(name))),
      );
      return file.isFile() && file.size > 0;
    } catch {
      return false;
    }
  }

  async saveProjectRuntimeDisplay(projectId, runtimeDisplay) {
    const project = this.deviceTemplates.find((item) => item.id === projectId);
    if (!project) throw new Error("自定义设备项目不存在");
    const normalized = normalizeDeviceTemplate({ ...project, runtimeDisplay });
    const config = normalized.runtimeDisplay;
    const status = normalized.capabilities.find(
      (item) => item.capabilityId === config?.statusCapabilityId,
    );
    if (config?.statusCapabilityId && !status)
      throw new Error("运行状态能力不存在");
    if (status && !["status", "enum"].includes(status.kind))
      throw new Error("运行状态能力必须是状态类能力");
    const remaining = normalized.capabilities.find(
      (item) => item.capabilityId === config?.remainingCapabilityId,
    );
    if (config?.remainingCapabilityId && !remaining)
      throw new Error("剩余时间能力不存在");
    if (remaining && remaining.dataType !== "number")
      throw new Error("剩余时间能力必须是数值类型");
    if (
      config?.runningStates.some((value) => config.endingStates.includes(value))
    )
      throw new Error("同一状态不能同时属于运行中和结束状态");
    const oldTemplates = this.deviceTemplates;
    this.deviceTemplates = oldTemplates.map((item) =>
      item.id === projectId ? normalized : item,
    );
    try {
      await this.persistAll();
    } catch (error) {
      this.deviceTemplates = oldTemplates;
      throw error;
    }
    return { item: structuredClone(normalized) };
  }

  async saveProjectAppearance(projectId, modelTemplateId, appearance) {
    const project = this.deviceTemplates.find((item) => item.id === projectId);
    if (!project) throw new Error("自定义设备项目不存在");
    const model = this.getModelTemplates().find(
      (item) => item.id === modelTemplateId,
    );
    if (!model || model.enabled === false)
      throw new Error("所选 3D 模型不存在或不可用");
    const normalized = normalizeDeviceTemplate({
      ...project,
      modelTemplateId,
      appearance,
    });
    const motionIssues=partMotionIssues(normalized.appearance?.partMotionRules,normalized.capabilities);
    if(motionIssues.length)throw new Error(motionIssues.join("；"));
    const animation = normalized.appearance?.animation;
    for (const id of [
      animation?.statusCapabilityId,
      animation?.remainingCapabilityId,
    ]) {
      if (
        id &&
        !normalized.capabilities.some((item) => item.capabilityId === id)
      )
        throw new Error(`3D 动画引用的能力不存在：${id}`);
    }
    const animationStatus = normalized.capabilities.find(
      (item) => item.capabilityId === animation?.statusCapabilityId,
    );
    const animationRemaining = normalized.capabilities.find(
      (item) => item.capabilityId === animation?.remainingCapabilityId,
    );
    if (animationStatus && !["status", "enum"].includes(animationStatus.kind))
      throw new Error("3D 动画运行状态必须引用状态类能力");
    if (animationRemaining && animationRemaining.dataType !== "number")
      throw new Error("3D 动画剩余时间必须引用数值能力");
    const oldTemplates = this.deviceTemplates;
    const oldBindings = this.bindings;
    this.deviceTemplates = oldTemplates.map((item) =>
      item.id === projectId ? normalized : item,
    );
    this.bindings = oldBindings.map((item) =>
      item.deviceTemplateId === projectId
        ? normalizeDeviceBinding({ ...item, modelTemplateId })
        : item,
    );
    try {
      await this.persistAll();
    } catch (error) {
      this.deviceTemplates = oldTemplates;
      this.bindings = oldBindings;
      throw error;
    }
    return { item: structuredClone(normalized) };
  }

  async saveProjectCapabilities(
    projectId,
    capabilities,
    mappings,
    acknowledgedCapabilityIds = [],
  ) {
    const project = this.deviceTemplates.find((item) => item.id === projectId);
    if (!project) throw new Error("自定义设备项目不存在");
    if (!Array.isArray(capabilities)) throw new Error("能力列表格式无效");
    const normalized = normalizeDeviceTemplate({ ...project, capabilities });
    const existingById = new Map(
      (project.capabilities ?? []).map((item) => [item.capabilityId, item]),
    );
    const nextById = new Map(
      normalized.capabilities.map((item) => [item.capabilityId, item]),
    );
    const acknowledged = new Set(acknowledgedCapabilityIds);
    for (const [id, previous] of existingById) {
      const next = nextById.get(id);
      if (
        next &&
        previous.kind === next.kind &&
        previous.dataType === next.dataType
      )
        continue;
      const dependencies = this.getCapabilityDependencies(projectId, id);
      const affected = next
        ? incompatibleDependencies(dependencies, next)
        : dependencies;
      if (affected.length && !acknowledged.has(id))
        throw new Error(
          `能力 ${id} 被 ${affected.length} 个配置引用，需确认依赖影响后重试`,
        );
    }
    const binding = this.bindings.find(
      (item) => item.deviceTemplateId === projectId,
    );
    const rawMappings =
      mappings && typeof mappings === "object" && !Array.isArray(mappings)
        ? mappings
        : {};
    const allowedEntityIds = new Set([
      ...(binding?.selectedEntityIds ?? []),
      ...(binding?.extraEntityIds ?? []),
      ...Object.values(binding?.capabilityBindings ?? {}).flat(),
    ]);
    for (const [id, mapping] of Object.entries(rawMappings)) {
      if (!nextById.has(id)) throw new Error(`能力 ${id} 不属于当前项目`);
      if (!binding || !allowedEntityIds.has(mapping?.entityId))
        throw new Error(`能力 ${id} 的实体未在基础信息步骤绑定`);
      if (
        mapping.attribute &&
        !/^[a-zA-Z_][a-zA-Z0-9_]{0,79}$/.test(mapping.attribute)
      )
        throw new Error(`能力 ${id} 的属性名无效`);
    }
    const nextBinding = binding
      ? normalizeDeviceBinding({
          ...binding,
          mappingMode: "explicit",
          capabilityMappings: rawMappings,
          capabilityBindings: Object.fromEntries(
            Object.entries(rawMappings).map(([id, mapping]) => [
              id,
              nextById.get(id)?.multiple &&
              binding.capabilityBindings?.[id]?.[0] === mapping.entityId
                ? binding.capabilityBindings[id]
                : [mapping.entityId],
            ]),
          ),
        })
      : null;
    const oldTemplates = this.deviceTemplates;
    const oldBindings = this.bindings;
    this.deviceTemplates = oldTemplates.map((item) =>
      item.id === projectId ? normalized : item,
    );
    if (nextBinding)
      this.bindings = oldBindings.map((item) =>
        item === binding ? nextBinding : item,
      );
    try {
      await this.persistAll();
    } catch (error) {
      this.deviceTemplates = oldTemplates;
      this.bindings = oldBindings;
      throw error;
    }
    return {
      item: structuredClone(normalized),
      binding: nextBinding ? structuredClone(nextBinding) : null,
    };
  }

  async rebindProject(projectId, deviceId, selectedEntities) {
    const project = this.deviceTemplates.find((item) => item.id === projectId);
    if (!project) throw new Error("自定义设备项目不存在");
    if (!deviceId) throw new Error("请选择 Home Assistant 设备");
    if (!Array.isArray(selectedEntities) || !selectedEntities.length)
      throw new Error("至少选择一个设备实体");
    const occupied = this.bindings.find(
      (item) =>
        item.deviceId === deviceId && item.deviceTemplateId !== projectId,
    );
    if (occupied) throw new Error("该 HA 设备已绑定到其他设备项目");
    const previous = this.bindings.find(
      (item) =>
        item.deviceId === deviceId && item.deviceTemplateId === projectId,
    );
    const selectedEntityIds = [
      ...new Set(selectedEntities.map((item) => item.entityId)),
    ];
    const extraEntityIds = (previous?.extraEntityIds ?? []).filter(id => !selectedEntityIds.includes(id));
    const selectedIdSet = new Set([...selectedEntityIds, ...extraEntityIds]);
    const binding = completeBindingReferences(
      normalizeDeviceBinding({
        ...previous,
        deviceId,
        deviceTemplateId: projectId,
        selectedEntityIds,
        extraEntityIds,
        entityRegistryRefs: [...selectedEntities
          .filter((item) => item.registryId)
          .map((item) => ({
            registryId: item.registryId,
            entityId: item.entityId,
          })), ...(previous?.entityRegistryRefs ?? []).filter(ref => extraEntityIds.includes(ref.entityId))],
        capabilityBindings: Object.fromEntries(
          Object.entries(previous?.capabilityBindings ?? {}).map(
            ([key, ids]) => [key, ids.filter((id) => selectedIdSet.has(id))],
          ),
        ),
        capabilityMappings: Object.fromEntries(
          Object.entries(previous?.capabilityMappings ?? {}).filter(
            ([, mapping]) => selectedIdSet.has(mapping.entityId),
          ),
        ),
        modelTemplateId: project.modelTemplateId ?? previous?.modelTemplateId,
        controlPanelTemplateId:
          project.controlPanelTemplateId ?? previous?.controlPanelTemplateId,
      }),
      this.getDeviceTemplates(),
      this.getModelTemplates(),
      this.getControlPanels(),
    );
    const oldBindings = this.bindings;
    const removedDeviceIds = oldBindings
      .filter(
        (item) =>
          item.deviceTemplateId === projectId && item.deviceId !== deviceId,
      )
      .map((item) => item.deviceId);
    this.bindings = [
      ...oldBindings.filter((item) => item.deviceTemplateId !== projectId),
      binding,
    ];
    try {
      await this.persistAll();
    } catch (error) {
      this.bindings = oldBindings;
      throw error;
    }
    return { binding: structuredClone(binding), removedDeviceIds };
  }

  async saveExtraEntities(projectId, deviceId, entities, expectedIds) {
    const previous = this.bindings.find(item => item.deviceTemplateId === projectId);
    if (!previous) throw new Error("请先绑定当前设备，再选择额外实体");
    if (previous.deviceId !== deviceId) throw new Error("主设备绑定已变化，请刷新后重试");
    const currentIds = previous.extraEntityIds ?? [];
    if (expectedIds && JSON.stringify([...expectedIds].sort()) !== JSON.stringify([...currentIds].sort()))
      throw new Error("额外实体选择已被更新，请刷新后重试");
    const extraEntityIds = [...new Set(entities.map(entity => entity.entityId))];
    const removed = new Set(currentIds.filter(id => !extraEntityIds.includes(id)));
    const refs = new Map((previous.entityRegistryRefs ?? []).filter(ref => !removed.has(ref.entityId)).map(ref => [ref.entityId, ref]));
    for (const entity of entities) if (entity.registryId) refs.set(entity.entityId, {entityId:entity.entityId,registryId:entity.registryId});
    const next = normalizeDeviceBinding({
      ...previous, extraEntityIds, entityRegistryRefs:[...refs.values()],
      capabilityBindings:Object.fromEntries(Object.entries(previous.capabilityBindings ?? {}).map(([id, ids]) => [id,ids.filter(entityId => !removed.has(entityId))])),
      capabilityMappings:Object.fromEntries(Object.entries(previous.capabilityMappings ?? {}).filter(([,mapping]) => !removed.has(mapping.entityId))),
    });
    const oldBindings = this.bindings;
    this.bindings = oldBindings.map(item => item === previous ? next : item);
    try { await this.persistAll(); } catch(error) { this.bindings=oldBindings; throw error; }
    return {binding:structuredClone(next)};
  }

  async reconcileEntityRegistry(registryEntries) {
    const currentById = new Map(
      (registryEntries ?? [])
        .filter((item) => item?.id && item?.entity_id)
        .map((item) => [item.id, item.entity_id]),
    );
    let changed = false;
    const nextBindings = this.bindings.map((binding) => {
      const renames = new Map();
      const refs = (binding.entityRegistryRefs ?? []).map((ref) => {
        const current = currentById.get(ref.registryId);
        if (!current || current === ref.entityId) return ref;
        renames.set(ref.entityId, current);
        return { ...ref, entityId: current };
      });
      if (!renames.size) return binding;
      changed = true;
      const remap = (ids) => [
        ...new Set((ids ?? []).map((id) => renames.get(id) ?? id)),
      ];
      return normalizeDeviceBinding({
        ...binding,
        selectedEntityIds: remap(binding.selectedEntityIds),
        extraEntityIds: remap(binding.extraEntityIds),
        entityRegistryRefs: refs,
        capabilityBindings: Object.fromEntries(
          Object.entries(binding.capabilityBindings ?? {}).map(([key, ids]) => [
            key,
            remap(ids),
          ]),
        ),
        capabilityMappings: Object.fromEntries(
          Object.entries(binding.capabilityMappings ?? {}).map(
            ([key, mapping]) => [
              key,
              {
                ...mapping,
                entityId: renames.get(mapping.entityId) ?? mapping.entityId,
              },
            ],
          ),
        ),
      });
    });
    if (!changed) return 0;
    const oldBindings = this.bindings;
    this.bindings = nextBindings;
    try {
      await this.persistAll();
    } catch (error) {
      this.bindings = oldBindings;
      throw error;
    }
    return nextBindings.filter((item, index) => item !== oldBindings[index])
      .length;
  }

  async upsertModelTemplate(value, file) {
    assertCustomId(value?.id);
    let sourceOverride;
    if (file?.dataUrl) {
      const { bytes, mimeType } = decodeDataUrl(file.dataUrl);
      const extension = safeModelExtension(file.name, mimeType, bytes);
      const storedName = `${value.id.replace(/[^a-z0-9_-]/g, "_")}${extension}`;
      await writeFile(path.join(this.modelAssetDir, storedName), bytes);
      sourceOverride = {
        type: "upload",
        url: `./api/device-platform/model-files/${encodeURIComponent(storedName)}`,
        fileName: file.name,
        mimeType:
          extension === ".glb" ? "model/gltf-binary" : "model/gltf+json",
      };
    } else if (value?.source?.type === "upload") {
      const existing = this.modelTemplates.find((item) => item.id === value.id);
      if (!existing?.source?.url) throw new Error("上传模型需要模型文件");
      sourceOverride = existing.source;
    }
    const normalized = normalizeModelTemplate(value, { sourceOverride });
    this.#upsert(this.modelTemplates, normalized);
    this.#refreshBindingReferences();
    await this.persistAll();
    return structuredClone(normalized);
  }

  async delete(kind, id, { unlinkReferences = false } = {}) {
    const builtinId = kind !== "binding" && String(id).startsWith("builtin.");
    if (kind !== "binding" && !builtinId) assertCustomId(id);
    else if (!id) throw new Error("设备 ID 不能为空");
    const collections = {
      device: this.deviceTemplates,
      model: this.modelTemplates,
      panel: this.controlPanels,
      binding: this.bindings,
    };
    const collection = collections[kind];
    if (!collection) throw new Error("未知数据类型");
    const key = kind === "binding" ? "deviceId" : "id";
    const builtinCollections = {
      device: builtinDeviceTemplates(),
      model: builtinModelTemplates(),
      panel: builtinControlPanelTemplates(),
    };
    const builtin = builtinId
      ? builtinCollections[kind]?.find((item) => item.id === id)
      : undefined;
    const relatedBuiltinModelId =
      kind === "device" && builtin ? builtin.modelTemplateId : undefined;
    const relatedBuiltinPanelId =
      kind === "device" && builtin ? builtin.controlPanelTemplateId : undefined;
    const referencingBindings = this.bindings.filter((item) =>
      kind === "device"
        ? item.deviceTemplateId === id ||
          item.modelTemplateId === relatedBuiltinModelId ||
          item.controlPanelTemplateId === relatedBuiltinPanelId
        : kind === "model"
          ? item.modelTemplateId === id
          : kind === "panel"
            ? item.controlPanelTemplateId === id
            : false,
    );
    const referencingProjects =
      kind === "model"
        ? this.deviceTemplates.filter((item) => item.modelTemplateId === id)
        : [];
    if (
      (referencingBindings.length || referencingProjects.length) &&
      !unlinkReferences
    ) {
      const labels = {
        device: "设备模板",
        model: "3D 模型",
        panel: "控制面板",
      };
      throw new Error(
        referencingProjects.length
          ? `${labels[kind]}仍被 ${referencingBindings.length} 个设备绑定和 ${referencingProjects.length} 个项目引用；确认强制删除后需重新校验相关项目`
          : `${labels[kind]}仍被 ${referencingBindings.length} 个设备绑定引用；确认删除后可自动解除引用`,
      );
    }
    const index = collection.findIndex((item) => item[key] === id);
    if (index < 0 && !builtin) return false;
    const removed = builtin ?? collection.splice(index, 1)[0];
    if (builtin) {
      this.suppressedBuiltins.add(`${kind}:${id}`);
      this.suppressedBuiltins = expandDeviceTemplateSuppressions(
        this.suppressedBuiltins,
      );
    }
    if (referencingBindings.length) {
      if (kind === "device") {
        this.bindings = this.bindings.filter(
          (binding) => binding.deviceTemplateId !== id,
        );
      } else {
        this.bindings = this.bindings.map((binding) => {
          if (!referencingBindings.includes(binding)) return binding;
          return normalizeDeviceBinding({
            ...binding,
            ...(kind === "model" ? { modelTemplateId: undefined } : {}),
            ...(kind === "panel" ? { controlPanelTemplateId: undefined } : {}),
          });
        });
      }
    }
    this.bindings = pruneSuppressedBuiltinBindings(
      this.bindings,
      this.suppressedBuiltins,
    );
    if (
      kind === "model" &&
      removed.source?.type === "upload" &&
      removed.source.url
    ) {
      const name = decodeURIComponent(removed.source.url.split("/").pop());
      await rm(path.join(this.modelAssetDir, path.basename(name)), {
        force: true,
      });
    }
    await this.persistAll();
    return true;
  }

  async exportBundle() {
    const assets = [];
    for (const model of this.modelTemplates) {
      if (model.source?.type !== "upload" || !model.source.url) continue;
      const name = decodeURIComponent(model.source.url.split("/").pop());
      try {
        const bytes = await readFile(
          path.join(this.modelAssetDir, path.basename(name)),
        );
        assets.push({
          modelTemplateId: model.id,
          fileName: model.source.fileName ?? name,
          mimeType: model.source.mimeType,
          dataBase64: bytes.toString("base64"),
        });
      } catch {
        // Keep the configuration export useful even if a manually deleted model asset is missing.
      }
    }
    return {
      format: "ha3d-device-platform",
      version: PLATFORM_VERSION,
      exportedAt: new Date().toISOString(),
      global: true,
      deviceTemplates: this.deviceTemplates,
      modelTemplates: this.modelTemplates,
      controlPanels: this.controlPanels,
      ...(this.controlLibrary ? {controlLibrary: this.controlLibrary.export()} : {}),
      ...(this.motionLibrary ? {motionLibrary:this.motionLibrary.export()} : {}),
      bindings: this.bindings,
      suppressedBuiltinIds: [...this.suppressedBuiltins].sort(),
      assets,
    };
  }

  async importBundle(bundle) {
    if (
      bundle?.format !== "ha3d-device-platform" ||
      bundle.version !== PLATFORM_VERSION
    )
      throw new Error("设备平台导入文件格式或版本不受支持");
    const libraryPackage=bundle.controlLibrary ? {format:CONTROL_PACKAGE_FORMAT,schemaVersion:1,controls:normalizeLibraryPackage(bundle.controlLibrary)} : null;
    const motionPackage=bundle.motionLibrary?{format:MOTION_RESOURCE_FORMAT,schemaVersion:1,resources:normalizeMotionLibraryPackage(bundle.motionLibrary)}:null;
    const devices = (bundle.deviceTemplates ?? []).map((item) => {
      assertCustomId(item.id);
      return normalizeDeviceTemplate(item);
    });
    const models = (bundle.modelTemplates ?? []).map((item) => {
      assertCustomId(item.id);
      return normalizeModelTemplate(item);
    });
    const panels = (bundle.controlPanels ?? []).map((item) => {
      assertCustomId(item.id);
      return normalizeControlPanelTemplate(item);
    });
    const bindings = (bundle.bindings ?? []).map(normalizeDeviceBinding);
    const knownBuiltinIds = new Set([
      ...builtinDeviceTemplates().map((item) => `device:${item.id}`),
      ...builtinModelTemplates().map((item) => `model:${item.id}`),
      ...builtinControlPanelTemplates().map((item) => `panel:${item.id}`),
    ]);
    const suppressedBuiltins = expandDeviceTemplateSuppressions(
      (bundle.suppressedBuiltinIds ?? []).filter(
        (item) => typeof item === "string" && knownBuiltinIds.has(item),
      ),
    );
    const activeBindings = pruneSuppressedBuiltinBindings(
      bindings,
      suppressedBuiltins,
    );
    const deviceIds = new Set(
      [
        ...builtinDeviceTemplates().filter(
          (item) => !suppressedBuiltins.has(`device:${item.id}`),
        ),
        ...devices,
      ].map((item) => item.id),
    );
    const modelIds = new Set(
      [
        ...builtinModelTemplates().filter(
          (item) => !suppressedBuiltins.has(`model:${item.id}`),
        ),
        ...models,
      ].map((item) => item.id),
    );
    const panelIds = new Set(
      [
        ...builtinControlPanelTemplates().filter(
          (item) => !suppressedBuiltins.has(`panel:${item.id}`),
        ),
        ...panels,
      ].map((item) => item.id),
    );
    for (const binding of activeBindings) {
      if (!binding.deviceTemplateId || !deviceIds.has(binding.deviceTemplateId))
        throw new Error(`导入绑定 ${binding.deviceId} 引用了不存在的设备模板`);
      if (binding.modelTemplateId && !modelIds.has(binding.modelTemplateId))
        throw new Error(`导入绑定 ${binding.deviceId} 引用了不存在的 3D 模型`);
      if (
        binding.controlPanelTemplateId &&
        !panelIds.has(binding.controlPanelTemplateId)
      )
        throw new Error(`导入绑定 ${binding.deviceId} 引用了不存在的控制面板`);
    }
    for (const asset of bundle.assets ?? []) {
      const model = models.find((item) => item.id === asset.modelTemplateId);
      if (!model || typeof asset.dataBase64 !== "string") continue;
      const bytes = Buffer.from(asset.dataBase64, "base64");
      const mimeType = asset.mimeType || model.source?.mimeType;
      const extension = safeModelExtension(asset.fileName, mimeType, bytes);
      if (bytes.length > MAX_MODEL_BYTES)
        throw new Error("导入包中的模型超过 15 MB");
      const storedName = `${model.id.replace(/[^a-z0-9_-]/g, "_")}${extension}`;
      await writeFile(path.join(this.modelAssetDir, storedName), bytes);
      model.source = {
        type: "upload",
        url: `./api/device-platform/model-files/${encodeURIComponent(storedName)}`,
        fileName: asset.fileName,
        mimeType,
      };
    }
    this.deviceTemplates = devices;
    this.modelTemplates = models;
    this.controlPanels = panels;
    this.bindings = activeBindings;
    this.suppressedBuiltins = suppressedBuiltins;
    await this.persistAll();
    if(libraryPackage && this.controlLibrary) await this.controlLibrary.restore(libraryPackage);
    if(motionPackage && this.motionLibrary) await this.motionLibrary.restore(motionPackage);
    return this.snapshot();
  }

  async persistAll() {
    this.writeQueue = this.writeQueue
      .catch(() => {})
      .then(() =>
        Promise.all([
          atomicWrite(
            path.join(this.dataDir, FILES.deviceTemplates),
            this.deviceTemplates,
          ),
          atomicWrite(path.join(this.dataDir, FILES.bindings), this.bindings),
          atomicWrite(
            path.join(this.dataDir, FILES.modelTemplates),
            this.modelTemplates,
          ),
          atomicWrite(
            path.join(this.dataDir, FILES.controlPanels),
            this.controlPanels,
          ),
          atomicWrite(
            path.join(this.dataDir, FILES.suppressedBuiltins),
            [...this.suppressedBuiltins].sort(),
          ),
          atomicWrite(
            path.join(this.dataDir, FILES.projectReleases),
            this.projectReleases,
          ),
          atomicWrite(
            path.join(this.dataDir, FILES.projectDrafts),
            this.projectDrafts,
          ),
          atomicWrite(
            path.join(this.dataDir, FILES.projectTests),
            this.projectTests,
          ),
        ]),
      );
    return this.writeQueue;
  }

  #upsert(collection, value, key = "id") {
    const index = collection.findIndex((item) => item[key] === value[key]);
    if (index >= 0) collection[index] = value;
    else collection.push(value);
  }
}

export { MAX_MODEL_BYTES };
