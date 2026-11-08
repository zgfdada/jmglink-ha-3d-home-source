import { randomUUID } from "node:crypto";
import { Script } from "node:vm";
import { allow, clean, fail, hash } from "./store.js";
import { McpTransfers } from "./transfers.js";
import { parseModelFile, readModelParts } from "./model-parts.js";
import {
  normalizeDeviceTemplate,
  normalizeModelTemplate,
} from "../device-platform/devicePlatformSchema.js";
import { DevicePlatformStore } from "../device-platform/DevicePlatformStore.js";
import { aggregateDeviceObjects } from "../device-platform/deviceAggregation.js";
import {
  inspectProject,
  projectConfigurationSignature,
  compareVersions,
} from "../device-platform/projectLifecycle.js";
import {
  normalizeMotionResource,
  normalizeMotionLibraryPackage,
} from "../../../../packages/schema/src/motion-library.js";
import {
  normalizeLibraryControl,
  normalizeLibraryPackage,
} from "../../../../packages/schema/src/control-library.js";
import {
  normalizePartMotionRules,
  partMotionIssues,
  motionMatch,
} from "../../../../packages/schema/src/part-motion.js";
import { builtinMotionCode } from "../../../../packages/schema/src/motion-code.js";

export const DEVICE_OPERATIONS = [
  "create",
  "basic",
  "rebind",
  "extra_entities",
  "capabilities",
  "appearance",
  "motions",
  "runtime_display",
  "control_panel",
  "delete",
  "import_package",
  "test_simulation",
  "release_draft",
  "publish_local",
];
export const LIBRARY_OPERATIONS = [
  "model_file",
  "model_delete",
  "motion_save",
  "motion_delete",
  "motion_reset",
  "motion_import",
  "control_save",
  "control_delete",
  "control_rollback",
  "control_import",
];
const basicFields = [
  "name",
  "category",
  "manufacturer",
  "model",
  "icon",
  "description",
  "matchRules",
];
const assertKeys = (value, keys) => {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.keys(value).some((key) => !keys.includes(key))
  )
    throw fail("VALIDATION_FAILED", "包含该操作不支持的字段", 422);
};
const hasCode = (value) =>
  value &&
  typeof value === "object" &&
  Object.entries(value).some(
    ([key, v]) =>
      (["js", "code", "script", "vertex", "fragment"].includes(key) &&
        typeof v === "string" &&
        v.trim()) ||
      hasCode(v),
  );

export class McpDevicePlatform {
  constructor(engine) {
    this.engine = engine;
    this.platform = engine.platform;
    this.transfers = new McpTransfers(engine.store);
  }
  access(client, projectId, write = false) {
    this.engine.project(
      client,
      projectId,
      write ? "home3d.project.replace" : "home3d.catalog.read",
    );
    if (write) allow(client, "home3d.publish", "projects", projectId);
    // Device definitions, bindings and libraries are global, not floor-owned.
    // Do not use a single allowed floor plan to modify other projects' devices.
    if (
      !client.resources.projects.includes("*") &&
      !this.engine.projects
        .listProjects()
        .every((p) => client.resources.projects.includes(p.id))
    )
      throw fail("RESOURCE_DENIED", "共享设备平台需覆盖所有项目；当前范围不足");
  }
  revision() {
    // Builtin fallback objects are normalized on each read and receive timestamps.
    // CAS tracks business content, never generated read-time timestamps.
    return hash(
      JSON.stringify(
        {
          devices: this.platform.getDeviceTemplates(),
          models: this.platform.getModelTemplates(),
          panels: this.platform.getControlPanels(),
          bindings: this.platform.getBindings(),
          lifecycle: this.platform
            .getDeviceTemplates()
            .filter((p) => !p.builtin)
            .map((p) => this.platform.getProjectLifecycle(p.id)),
          motions: this.platform.motionLibrary?.list(),
          controls: this.platform.controlLibrary?.list(),
        },
        (key, value) =>
          ["createdAt", "updatedAt"].includes(key) ? undefined : value,
      ),
    );
  }
  device(id) {
    const project = this.platform
      .getDeviceTemplates()
      .find((p) => p.id === id && !p.builtin);
    if (!project) throw fail("RESOURCE_DENIED", "自定义设备项目不存在");
    return project;
  }
  binding(id) {
    return this.platform.getBindings().find((b) => b.deviceTemplateId === id);
  }
  entityAccess(client, ids) {
    this.engine.haAdapter.enabled();
    const byId = new Map(
      this.engine.ha.getEntities().map((e) => [e.entityId, e]),
    );
    return [...new Set(ids)].map((id) => {
      allow(client, "ha.state.read", "entities", id);
      const entity = byId.get(id);
      if (!entity || entity.entityOnly)
        throw fail("RESOURCE_DENIED", "实体不存在或为项目占位实体");
      return entity;
    });
  }
  boundAccess(client, id) {
    const b = this.binding(id);
    const ids = [
      ...(b?.selectedEntityIds ?? []),
      ...(b?.extraEntityIds ?? []),
      ...Object.values(b?.capabilityBindings ?? {}).flat(),
      ...Object.values(b?.capabilityMappings ?? {}).map((m) => m.entityId),
    ];
    for (const entityId of new Set(ids))
      allow(client, "ha.state.read", "entities", entityId);
  }
  list(client, { projectId }) {
    this.access(client, projectId);
    return {
      revision: this.revision(),
      projects: this.platform
        .getDeviceTemplates()
        .filter((p) => !p.builtin)
        .map((p) => ({
          id: p.id,
          name: p.name,
          modelTemplateId: p.modelTemplateId,
          capabilityCount: p.capabilities?.length ?? 0,
        })),
    };
  }
  get(client, { projectId, deviceProjectId }) {
    this.access(client, projectId);
    this.boundAccess(client, deviceProjectId);
    const project = this.device(deviceProjectId);
    return clean({
      revision: this.revision(),
      project,
      binding: this.binding(deviceProjectId),
      model: this.platform
        .getModelTemplates()
        .find((m) => m.id === project.modelTemplateId),
      panel: this.platform
        .getControlPanels()
        .find((p) => p.id === project.controlPanelTemplateId),
      lifecycle: this.platform.getProjectLifecycle(deviceProjectId),
      dependencies: Object.fromEntries(
        (project.capabilities ?? []).map((c) => [
          c.capabilityId,
          this.platform.getCapabilityDependencies(
            deviceProjectId,
            c.capabilityId,
          ),
        ]),
      ),
    });
  }
  library(client, { projectId, kind }) {
    this.access(client, projectId);
    const items =
      kind === "models"
        ? this.platform.getModelTemplates()
        : kind === "motions"
          ? this.platform.motionLibrary?.list()
          : this.platform.controlLibrary?.list();
    if (!items) throw fail("UNSUPPORTED_CAPABILITY", "该资源库未启用", 409);
    return clean({
      revision: this.revision(),
      libraryRevision:
        kind === "motions" ? this.platform.motionLibrary.revision : undefined,
      items: items.map((item) => ({
        ...item,
        references: this.references(kind, item.id),
      })),
    });
  }
  references(kind, id) {
    if (kind === "controls")
      return this.platform.controlLibrary?.references(id) ?? [];
    const devices = this.platform
      .getDeviceTemplates()
      .flatMap((p) =>
        kind === "models"
          ? p.modelTemplateId === id
            ? [{ kind: "device", id: p.id, name: p.name }]
            : []
          : (p.appearance?.partMotionRules ?? [])
              .filter((r) => r.motionResourceId === id)
              .map((r) => ({ kind: "rule", deviceProjectId: p.id, id: r.id })),
      );
    if (kind === "models")
      for (const project of this.engine.projects.listProjects()) {
        const p = this.engine.projects.getProject(project.id);
        for (const floor of p.floors)
          for (const item of [...floor.devices, ...floor.furniture])
            if (
              item.modelId === id ||
              item.customModel?.id === id ||
              item.customModel?.modelTemplateId === id
            )
              devices.push({
                kind: "scene",
                projectId: p.id,
                floorId: floor.id,
                id: item.id,
              });
      }
    return devices;
  }
  async parts(client, { projectId, modelId, deviceProjectId }) {
    this.access(client, projectId);
    const device = deviceProjectId ? this.device(deviceProjectId) : null;
    const model = this.platform
      .getModelTemplates()
      .find((m) => m.id === (modelId ?? device?.modelTemplateId));
    if (!model) throw fail("RESOURCE_DENIED", "模型不存在");
    return {
      modelId: model.id,
      revision: this.revision(),
      ...(await readModelParts(
        this.platform,
        model,
        device?.appearance?.partLabels,
      )),
    };
  }
  async diagnostics(client, args) {
    this.access(client, args.projectId);
    this.device(args.deviceProjectId);
    this.boundAccess(client, args.deviceProjectId);
    this.engine.haAdapter.enabled();
    const result = await inspectProject(
      this.platform,
      this.engine.ha,
      args.deviceProjectId,
    );
    const parts = result.model ? await this.parts(client, args) : null;
    const issues = parts?.reliable
      ? partMotionIssues(
          result.project.appearance?.partMotionRules,
          result.project.capabilities,
          parts.parts,
        )
      : [];
    return clean({
      revision: this.revision(),
      checks: [
        ...result.checks,
        ...issues.map((reason) => ({
          page: "部件动效",
          severity: "error",
          reason,
        })),
      ],
      capabilities: result.capabilities,
      haConnected: result.haConnected,
      publishBlocked: result.publishBlocked || issues.length > 0,
      partsVerified: parts?.reliable === true,
      visualVerified: false,
    });
  }
  async preview(
    client,
    { projectId, deviceProjectId, values, offline = false },
  ) {
    this.access(client, projectId);
    const project = this.device(deviceProjectId),
      rules = project.appearance?.partMotionRules ?? [];
    const parts = await this.parts(client, { projectId, deviceProjectId });
    const issues = partMotionIssues(
      rules,
      project.capabilities,
      parts.reliable ? parts.parts : undefined,
    );
    return {
      mode: "condition-simulation",
      sendsDeviceActions: false,
      executesCustomCode: false,
      visualVerified: false,
      issues,
      partsVerified: parts.reliable,
      rules: rules.map((rule) => ({
        id: rule.id,
        matched: !offline && motionMatch(rule, values[rule.capabilityId]),
        targets: rule.targets,
        effect: rule.effect.type,
        axis: rule.effect.axis,
        endBehavior: offline ? "restore" : rule.endBehavior,
      })),
    };
  }
  codeAccess(client, value) {
    const customCode = (v) => {
      if (typeof v === "string")
        return /<script\b|\bon\w+\s*=|javascript:/i.test(v);
      if (!v || typeof v !== "object") return false;
      if (v.type && v.program?.code) {
        if (v.program.code !== builtinMotionCode(v.type).code) return true;
        return Object.entries(v).some(
          ([key, item]) => key !== "program" && customCode(item),
        );
      }
      return Object.entries(v).some(
        ([key, item]) =>
          (["js", "code", "script", "vertex", "fragment"].includes(key) &&
            typeof item === "string" &&
            item.trim()) ||
          customCode(item),
      );
    };
    if (customCode(value)) allow(client, "home3d.code.write");
    const walk = (v) => {
      if (!v || typeof v !== "object") return;
      if (v.program?.code) {
        try {
          new Script(
            `"use strict";${v.program.code}\n;if(typeof update!=="function")throw Error("missing update");`,
          );
        } catch {
          throw fail("VALIDATION_FAILED", "JavaScript动效语法错误", 422);
        }
        // Compile only. Never execute Agent-provided browser animation on host.
      }
      Object.values(v).forEach(walk);
    };
    walk(value);
  }
  async plan(
    client,
    { projectId, deviceProjectId, operation, expectedRevision, value = {} },
    library = false,
  ) {
    this.access(client, projectId, true);
    if (this.revision() !== expectedRevision)
      throw fail("REVISION_CONFLICT", "设备平台已变化，请重新读取", 409);
    const allowed = library ? LIBRARY_OPERATIONS : DEVICE_OPERATIONS;
    if (!allowed.includes(operation))
      throw fail("UNSUPPORTED_CAPABILITY", "不支持该操作", 409);
    if (!library && !["create", "import_package"].includes(operation)) {
      this.device(deviceProjectId);
      this.boundAccess(client, deviceProjectId);
    }
    // Preparation is read-only; only private transfer staging/plan storage is written.
    const payload = {
      projectId,
      deviceProjectId,
      operation,
      value: structuredClone(value),
    };
    await this.prepare(client, payload);
    return this.engine.store.publicPlan(
      await this.engine.store.addPlan(
        client,
        "device-platform",
        payload,
        expectedRevision,
        "home3d.publish",
        { kind: "projects", id: projectId },
      ),
    );
  }
  async prepare(client, x) {
    const v = x.value,
      p = x.deviceProjectId ? this.device(x.deviceProjectId) : null;
    const keys = {
      create: ["id", ...basicFields],
      basic: basicFields,
      rebind: ["deviceId", "selectedEntityIds"],
      extra_entities: ["entityIds"],
      capabilities: ["capabilities", "mappings", "acknowledgedCapabilityIds"],
      appearance: ["modelTemplateId", "appearance"],
      motions: ["rules"],
      runtime_display: ["runtimeDisplay"],
      control_panel: ["panel"],
      delete: ["unlinkReferences"],
      import_package: ["transferId"],
      test_simulation: [],
      release_draft: [
        "version",
        "visibility",
        "category",
        "subCategory",
        "notes",
        "options",
      ],
      publish_local: ["confirmWarnings"],
      model_file: ["model", "transferId"],
      model_delete: ["modelId"],
      motion_save: ["resource", "resourceId"],
      motion_delete: ["resourceId"],
      motion_reset: ["resourceId"],
      control_save: ["control"],
      control_delete: ["controlId", "confirmReferences"],
      control_rollback: ["controlId"],
    };
    keys.motion_import = ["transferId"];
    keys.control_import = ["transferId"];
    assertKeys(v, keys[x.operation]);
    if (["create", "basic"].includes(x.operation)) {
      if (
        x.operation === "create" &&
        (typeof v.name !== "string" || !v.name.trim())
      )
        throw fail("VALIDATION_FAILED", "新设备需要名称", 422);
      if (x.operation === "create") {
        v.id ??= "custom.mcp." + randomUUID();
        if (
          !/^custom\.[a-z0-9][a-z0-9._-]{1,120}$/.test(v.id) ||
          this.platform.getDeviceTemplates().some((p) => p.id === v.id)
        )
          throw fail("VALIDATION_FAILED", "新设备ID无效或已存在", 422);
      }
      normalizeDeviceTemplate({ ...(p ?? {}), ...v });
    }
    if (["rebind", "extra_entities"].includes(x.operation)) {
      const ids = v.selectedEntityIds ?? v.entityIds;
      if (
        !Array.isArray(ids) ||
        ids.length > 1000 ||
        ids.some((id) => typeof id !== "string")
      )
        throw fail("VALIDATION_FAILED", "实体选择无效", 422);
      const entities = this.entityAccess(client, ids);
      if (x.operation === "rebind") {
        if (
          !ids.length ||
          !v.deviceId ||
          entities.some(
            (e) => (e.deviceId || `entity:${e.entityId}`) !== v.deviceId,
          )
        )
          throw fail("RESOURCE_DENIED", "实体不属于所选HA设备");
      } else {
        const binding = this.binding(p.id),
          physical = new Set(binding?.selectedEntityIds ?? []);
        if (!binding?.entityOnly)
          for (const e of this.engine.ha.getEntities())
            if ((e.deviceId || `entity:${e.entityId}`) === binding?.deviceId)
              physical.add(e.entityId);
        if (ids.some((id) => physical.has(id)))
          throw fail("RESOURCE_DENIED", "设备自身实体应在主绑定中选择");
      }
    }
    if (x.operation === "capabilities") {
      if (
        !Array.isArray(v.capabilities) ||
        v.capabilities.length > 100 ||
        !v.mappings ||
        typeof v.mappings !== "object"
      )
        throw fail("VALIDATION_FAILED", "能力及映射格式无效", 422);
      this.entityAccess(
        client,
        Object.values(v.mappings).map((m) => m.entityId),
      );
      if (
        Object.values(v.mappings).some((m) =>
          /token|secret|password|credential|authorization|cookie|private.?key/i.test(
            m.attribute ?? "",
          ),
        )
      )
        throw fail("RESOURCE_DENIED", "不能映射凭据或秘密属性");
      normalizeDeviceTemplate({ ...p, capabilities: v.capabilities });
    }
    if (x.operation === "appearance" || x.operation === "motions") {
      const appearance =
        x.operation === "motions"
          ? { ...p.appearance, partMotionRules: v.rules }
          : v.appearance;
      const modelId = v.modelTemplateId ?? p.modelTemplateId;
      if (!this.platform.getModelTemplates().some((m) => m.id === modelId))
        throw fail("RESOURCE_DENIED", "所选模型不存在");
      const parts = await this.parts(client, {
        projectId: x.projectId,
        modelId,
      });
      let rules = appearance?.partMotionRules ?? [];
      rules = rules.map((rule) => {
        const resource =
          rule.motionResourceId &&
          this.platform.motionLibrary
            ?.list()
            .find((r) => r.id === rule.motionResourceId);
        const effect = rule.effect ?? resource?.effect;
        return {
          ...rule,
          effect,
          transitionMs: rule.transitionMs ?? resource?.transitionMs,
          targetNames: parts.reliable
            ? Object.fromEntries(
                rule.targets.map((target) => {
                  const part = parts.parts.find((p) => p.path === target);
                  if (!part?.identityTrusted)
                    throw fail(
                      "VALIDATION_FAILED",
                      "目标部件名称不唯一或无法静态确认，请在前端核对",
                      422,
                    );
                  if (
                    rule.targetNames?.[target] &&
                    rule.targetNames[target] !== part.name
                  )
                    throw fail(
                      "REVISION_CONFLICT",
                      "部件身份已变化，请重新读取部件树",
                      409,
                    );
                  return [target, part.name];
                }),
              )
            : rule.targetNames,
        };
      });
      if (rules.length && !parts.reliable)
        throw fail(
          "UNSUPPORTED_CAPABILITY",
          "此模型需要渲染器确认部件树，不能凭空填写路径",
          409,
        );
      rules = normalizePartMotionRules(rules);
      this.codeAccess(client, rules);
      const issues = partMotionIssues(
        rules,
        p.capabilities,
        parts.reliable ? parts.parts : undefined,
      );
      if (issues.length)
        throw fail("VALIDATION_FAILED", issues.join("；").slice(0, 1000), 422);
      if (x.operation === "motions") v.rules = rules;
      else v.appearance = { ...appearance, partMotionRules: rules };
      x.modelSha256 = parts.sha256;
    }
    if (["control_panel", "control_save"].includes(x.operation))
      this.codeAccess(client, v);
    if (x.operation === "model_file") {
      const { meta, bytes } = await this.transfers.bytes(client, v.transferId);
      parseModelFile(bytes, meta.fileName);
      if (!v.model?.id) throw fail("VALIDATION_FAILED", "需要模型ID", 422);
      normalizeModelTemplate({
        ...v.model,
        source: {
          type: "upload",
          url: "./api/device-platform/model-files/staged.glb",
        },
      });
      if (v.model.source?.url)
        throw fail(
          "RESOURCE_DENIED",
          "上传模型由服务端生成URL，不接受调用者路径",
        );
      x.assetSha256 = meta.sha256;
    }
    if (
      x.operation === "model_delete" &&
      this.references("models", v.modelId).length
    )
      throw fail("RESOURCE_DENIED", "模型仍被设备或场景引用，需先单独解除引用");
    if (x.operation === "motion_save") {
      this.codeAccess(client, v.resource);
      normalizeMotionResource({
        ...v.resource,
        id: v.resourceId ?? "custom.motion." + randomUUID(),
      });
    }
    if (x.operation === "control_save") normalizeLibraryControl(v.control);
    if (["motion_import", "control_import"].includes(x.operation)) {
      const { bytes, meta } = await this.transfers.bytes(client, v.transferId),
        bundle = JSON.parse(bytes.toString("utf8"));
      this.codeAccess(client, bundle);
      if (x.operation === "motion_import")
        normalizeMotionLibraryPackage(bundle);
      else normalizeLibraryPackage(bundle);
      x.assetSha256 = meta.sha256;
    }
    if (x.operation === "import_package") {
      const { bytes, meta } = await this.transfers.bytes(client, v.transferId),
        bundle = JSON.parse(bytes.toString("utf8"));
      if (bundle.format !== "ha3d-device-project" || bundle.schemaVersion !== 1)
        throw fail("VALIDATION_FAILED", "需要单设备项目包", 422);
      this.codeAccess(client, bundle);
      x.assetSha256 = meta.sha256;
      // Imported instance bindings must never be trusted or replayed.
      if (bundle.binding || bundle.bindings || bundle.project?.binding)
        throw fail("RESOURCE_DENIED", "设备包不能携带HA实例绑定");
      if (bundle.model?.source?.type === "upload") {
        if (
          !bundle.asset?.fileName ||
          typeof bundle.asset.dataBase64 !== "string" ||
          bundle.asset.dataBase64.length > 21 * 1024 * 1024
        )
          throw fail("VALIDATION_FAILED", "设备包缺少合法模型文件", 422);
        parseModelFile(
          Buffer.from(bundle.asset.dataBase64, "base64"),
          bundle.asset.fileName,
        );
      } else if (bundle.model?.source?.url)
        throw fail("RESOURCE_DENIED", "设备包不允许外部模型URL");
    }
    if (x.operation === "publish_local") {
      const result = await this.diagnostics(client, {
        projectId: x.projectId,
        deviceProjectId: p.id,
      });
      const lifecycle = this.platform.getProjectLifecycle(p.id),
        model = this.platform
          .getModelTemplates()
          .find((m) => m.id === p.modelTemplateId),
        panel = this.platform
          .getControlPanels()
          .find((c) => c.id === p.controlPanelTemplateId);
      if (result.publishBlocked || !lifecycle.test || !lifecycle.draft)
        throw fail(
          "VALIDATION_FAILED",
          "发布需通过诊断、模拟联调与版本草稿检查",
          422,
        );
      if (
        lifecycle.releases[0] &&
        compareVersions(
          lifecycle.draft.version,
          lifecycle.releases[0].version,
        ) <= 0
      )
        throw fail("VALIDATION_FAILED", "发布版本必须递增", 422);
      if (
        (result.checks.some((c) => c.severity === "warning") ||
          lifecycle.test.mode === "simulation" ||
          lifecycle.test.signature !==
            projectConfigurationSignature(p, model, panel)) &&
        v.confirmWarnings !== true
      )
        throw fail(
          "VALIDATION_FAILED",
          "需明确确认模拟／配置变更警告后本地发布",
          422,
        );
    }
    if (
      x.operation === "test_simulation" &&
      (
        await this.diagnostics(client, {
          projectId: x.projectId,
          deviceProjectId: p.id,
        })
      ).publishBlocked
    )
      throw fail(
        "VALIDATION_FAILED",
        "配置错误尚未修复，不能记录模拟联调",
        422,
      );
    // Reuse the exact business validations against isolated in-memory state.
    // No files, real services, or live platform arrays are changed by planning.
    const dry = new DevicePlatformStore(
      this.platform.dataDir,
      this.platform.assetDir,
      structuredClone({
        deviceTemplates: this.platform.deviceTemplates,
        modelTemplates: this.platform.modelTemplates,
        controlPanels: this.platform.controlPanels,
        bindings: this.platform.bindings,
        suppressedBuiltins: [...this.platform.suppressedBuiltins],
        projectReleases: this.platform.projectReleases,
        projectDrafts: this.platform.projectDrafts,
        projectTests: this.platform.projectTests,
      }),
    );
    dry.persistAll = async () => {};
    switch (x.operation) {
      case "create":
        await dry.upsertDeviceTemplate(v);
        break;
      case "basic":
        await dry.upsertDeviceTemplate({ ...p, ...v });
        break;
      case "rebind":
        await dry.rebindProject(
          p.id,
          v.deviceId,
          this.entityAccess(client, v.selectedEntityIds),
        );
        break;
      case "extra_entities": {
        const b = this.binding(p.id);
        await dry.saveExtraEntities(
          p.id,
          b?.deviceId,
          this.entityAccess(client, v.entityIds),
          b?.extraEntityIds ?? [],
        );
        break;
      }
      case "capabilities":
        await dry.saveProjectCapabilities(
          p.id,
          v.capabilities,
          v.mappings,
          v.acknowledgedCapabilityIds ?? [],
        );
        break;
      case "appearance":
        await dry.saveProjectAppearance(p.id, v.modelTemplateId, v.appearance);
        break;
      case "motions":
        await dry.saveProjectAppearance(p.id, p.modelTemplateId, {
          ...p.appearance,
          partMotionRules: v.rules,
        });
        break;
      case "runtime_display":
        await dry.saveProjectRuntimeDisplay(p.id, v.runtimeDisplay);
        break;
      case "control_panel":
        await dry.saveProjectControlPanel(p.id, v.panel);
        break;
      case "release_draft":
        await dry.saveProjectReleaseDraft(p.id, v);
        break;
    }
  }
  async validate(client, plan) {
    this.access(client, plan.payload.projectId, true);
    if (this.revision() !== plan.base) return false;
    if (plan.payload.deviceProjectId)
      this.boundAccess(client, plan.payload.deviceProjectId);
    const check = structuredClone(plan.payload);
    await this.prepare(client, check);
    if (
      plan.payload.modelSha256 &&
      check.modelSha256 !== plan.payload.modelSha256
    )
      return false;
    if (
      plan.payload.assetSha256 &&
      check.assetSha256 !== plan.payload.assetSha256
    )
      return false;
    return true;
  }
  async execute(client, plan) {
    if (!(await this.validate(client, plan)))
      throw fail("REVISION_CONFLICT", "设备配置或素材已变化", 409);
    const x = plan.payload,
      v = x.value,
      p = x.deviceProjectId ? this.device(x.deviceProjectId) : null;
    // Recoverable pre-write snapshot, without file bodies or upstream secrets.
    plan.before = structuredClone({
      project: p,
      binding: p && this.binding(p.id),
      panel:
        p &&
        this.platform
          .getControlPanels()
          .find((panel) => panel.id === p.controlPanelTemplateId),
      model: this.platform
        .getModelTemplates()
        .find((m) => m.id === (v.model?.id ?? v.modelId)),
      library: x.operation.startsWith("motion_")
        ? this.platform.motionLibrary?.export()
        : x.operation.startsWith("control_")
          ? this.platform.controlLibrary?.export()
          : undefined,
      lifecycle: p
        ? {
            releases: this.platform.projectReleases.filter(
              (r) => r.projectId === p.id,
            ),
            drafts: this.platform.projectDrafts.filter(
              (r) => r.projectId === p.id,
            ),
            tests: this.platform.projectTests.filter(
              (r) => r.projectId === p.id,
            ),
          }
        : undefined,
    });
    if (
      plan.before.model?.source?.type === "upload" &&
      ["model_file", "model_delete"].includes(x.operation)
    ) {
      const asset = await this.platform.exportModelAsset(plan.before.model);
      if (!asset)
        throw fail("VALIDATION_FAILED", "原模型文件无法备份，拒绝覆盖", 422);
      plan.before.modelAsset = await this.transfers.export(
        client,
        asset.fileName,
        Buffer.from(asset.dataBase64, "base64"),
      );
    }
    await this.engine.store.persist();
    let result;
    switch (x.operation) {
      case "create":
        result = await this.platform.upsertDeviceTemplate(v);
        break;
      case "basic":
        result = await this.platform.upsertDeviceTemplate({ ...p, ...v });
        break;
      case "rebind":
        result = await this.platform.rebindProject(
          p.id,
          v.deviceId,
          this.entityAccess(client, v.selectedEntityIds),
        );
        break;
      case "extra_entities": {
        const b = this.binding(p.id);
        result = await this.platform.saveExtraEntities(
          p.id,
          b?.deviceId,
          this.entityAccess(client, v.entityIds),
          b?.extraEntityIds ?? [],
        );
        break;
      }
      case "capabilities":
        result = await this.platform.saveProjectCapabilities(
          p.id,
          v.capabilities,
          v.mappings,
          v.acknowledgedCapabilityIds ?? [],
        );
        break;
      case "appearance":
        result = await this.platform.saveProjectAppearance(
          p.id,
          v.modelTemplateId,
          v.appearance,
        );
        break;
      case "motions":
        result = await this.platform.saveProjectAppearance(
          p.id,
          p.modelTemplateId,
          { ...p.appearance, partMotionRules: v.rules },
        );
        break;
      case "runtime_display":
        result = await this.platform.saveProjectRuntimeDisplay(
          p.id,
          v.runtimeDisplay,
        );
        break;
      case "control_panel":
        result = await this.platform.saveProjectControlPanel(p.id, v.panel);
        break;
      case "delete":
        result = {
          removed: await this.platform.delete("device", p.id, {
            unlinkReferences: v.unlinkReferences === true,
          }),
        };
        break;
      case "model_file": {
        const { bytes, meta } = await this.transfers.bytes(
          client,
          v.transferId,
        );
        result = await this.platform.upsertModelTemplate(v.model, {
          name: meta.fileName,
          dataUrl: `data:${meta.fileName.toLowerCase().endsWith(".glb") ? "model/gltf-binary" : "model/gltf+json"};base64,${bytes.toString("base64")}`,
        });
        break;
      }
      case "model_delete":
        result = { removed: await this.platform.delete("model", v.modelId) };
        break;
      case "motion_save":
        result = await this.platform.motionLibrary.save(
          v.resource,
          v.resourceId,
          this.platform.motionLibrary.revision,
        );
        break;
      case "motion_delete":
        result = await this.platform.motionLibrary.remove(
          v.resourceId,
          this.platform.motionLibrary.revision,
        );
        break;
      case "motion_reset":
        result = await this.platform.motionLibrary.reset(
          v.resourceId,
          this.platform.motionLibrary.revision,
        );
        break;
      case "motion_import": {
        const { bytes } = await this.transfers.bytes(client, v.transferId),
          incoming = normalizeMotionLibraryPackage(
            JSON.parse(bytes.toString("utf8")),
          );
        result = await this.platform.motionLibrary.mutate(
          this.platform.motionLibrary.revision,
          (items) => {
            if (items.filter((r) => !r.builtin).length + incoming.length > 291)
              throw fail("BUDGET_EXCEEDED", "自定义动效资源最多291项");
            const added = incoming.map((r) =>
              normalizeMotionResource({
                ...r,
                id: "custom.motion." + randomUUID(),
                version: 1,
              }),
            );
            items.push(...added);
            return added;
          },
        );
        break;
      }
      case "control_save":
        result = this.platform.controlLibrary
          .list()
          .some((c) => c.id === v.control.id)
          ? await this.platform.controlLibrary.update(v.control.id, v.control)
          : await this.platform.controlLibrary.create(v.control);
        break;
      case "control_delete":
        result = await this.platform.controlLibrary.remove(
          v.controlId,
          v.confirmReferences === true,
        );
        break;
      case "control_rollback":
        result = await this.platform.controlLibrary.rollback(v.controlId);
        break;
      case "control_import": {
        const { bytes } = await this.transfers.bytes(client, v.transferId);
        result = await this.platform.controlLibrary.import(
          JSON.parse(bytes.toString("utf8")),
        );
        break;
      }
      case "import_package": {
        const { bytes } = await this.transfers.bytes(client, v.transferId);
        result = await this.platform.importProjectPackage(
          JSON.parse(bytes.toString("utf8")),
        );
        break;
      }
      case "test_simulation":
        result = await this.platform.saveProjectTest(p.id, {
          mode: "simulation",
        });
        break;
      case "release_draft":
        result = await this.platform.saveProjectReleaseDraft(p.id, v);
        break;
      case "publish_local":
        result = await this.platform.publishProject(p.id, {
          project: p,
          model: this.platform
            .getModelTemplates()
            .find((m) => m.id === p.modelTemplateId),
          panel: this.platform
            .getControlPanels()
            .find((c) => c.id === p.controlPanelTemplateId),
        });
        break;
      default:
        throw fail("UNSUPPORTED_CAPABILITY", "不支持该设备平台操作", 409);
    }
    this.engine.gateway?.broadcast({
      type: "instance.restored",
      payload: { generation: Date.now() },
    });
    return clean({
      revision: this.revision(),
      operation: x.operation,
      result,
      realDeviceActions: false,
    });
  }
  async rollback(client, original) {
    this.access(client, original.payload.projectId, true);
    if (
      original.status !== "applied" ||
      this.revision() !== original.result.revision
    )
      throw fail("REVISION_CONFLICT", "设备平台存在后续修改，拒绝覆盖", 409);
    if (
      original.payload.operation === "import_package" ||
      original.payload.operation === "publish_local"
    )
      throw fail(
        "UNSUPPORTED_CAPABILITY",
        "导入与已发布设备版本保留原记录，请单独制定删除／新版本计划",
        409,
      );
    return this.engine.store.publicPlan(
      await this.engine.store.addPlan(
        client,
        "device-platform-restore",
        { projectId: original.payload.projectId, originalId: original.id },
        this.revision(),
        "home3d.restore",
        { kind: "projects", id: original.payload.projectId },
      ),
    );
  }
  async restore(client, plan) {
    this.access(client, plan.payload.projectId, true);
    if (this.revision() !== plan.base)
      throw fail("REVISION_CONFLICT", "设备平台已变化", 409);
    const original = this.engine.store.plan(plan.payload.originalId, client),
      before = original.before,
      x = original.payload,
      p = before.project;
    this.codeAccess(client, before);
    if (p) {
      this.boundAccess(client, p.id);
      const b = before.binding;
      for (const id of new Set([
        ...(b?.selectedEntityIds ?? []),
        ...(b?.extraEntityIds ?? []),
        ...Object.values(b?.capabilityBindings ?? {}).flat(),
        ...Object.values(b?.capabilityMappings ?? {}).map((m) => m.entityId),
      ]))
        allow(client, "ha.state.read", "entities", id);
      await this.platform.upsertDeviceTemplate(p);
      if (before.panel) await this.platform.upsertControlPanel(before.panel);
      this.platform.bindings = this.platform.bindings.filter(
        (b) => b.deviceTemplateId !== p.id,
      );
      if (before.binding)
        this.platform.bindings.push(structuredClone(before.binding));
      for (const [field, key] of [
        ["projectReleases", "releases"],
        ["projectDrafts", "drafts"],
        ["projectTests", "tests"],
      ])
        this.platform[field] = [
          ...this.platform[field].filter((item) => item.projectId !== p.id),
          ...structuredClone(before.lifecycle[key]),
        ];
      await this.platform.persistAll();
    } else if (x.operation === "create")
      await this.platform.delete("device", x.value.id);
    if (x.operation.startsWith("model_")) {
      if (before.model) {
        let file;
        if (before.modelAsset) {
          const { bytes, meta } = await this.transfers.bytes(
            client,
            before.modelAsset.transferId,
          );
          file = {
            name: meta.fileName,
            dataUrl: `data:application/octet-stream;base64,${bytes.toString("base64")}`,
          };
        }
        await this.platform.upsertModelTemplate(before.model, file);
      } else await this.platform.delete("model", x.value.model.id);
    }
    if (x.operation.startsWith("motion_"))
      await this.platform.motionLibrary.restore(before.library);
    if (x.operation.startsWith("control_"))
      await this.platform.controlLibrary.restore(before.library);
    this.engine.gateway?.broadcast({
      type: "instance.restored",
      payload: { generation: Date.now() },
    });
    return {
      revision: this.revision(),
      restoredPlanId: original.id,
      realDeviceActions: false,
    };
  }
}
