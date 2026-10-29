import { readFile } from "node:fs/promises";
import path from "node:path";
import { aggregateDeviceObjects } from "../device-platform/deviceAggregation.js";
import { validateProjectCapabilities } from "../device-platform/capabilityValidation.js";
import {
  inspectProject,
  projectContext,
  testAction,
  compareVersions,
  nextPatchVersion,
  projectConfigurationSignature,
} from "../device-platform/projectLifecycle.js";

const idParams = {
  type: "object",
  required: ["id"],
  properties: { id: { type: "string", minLength: 1, maxLength: 128 } },
};

function handleError(reply, error) {
  const message = error instanceof Error ? error.message : "设备平台请求失败";
  const notFound = message.includes("不存在");
  return reply.code(notFound ? 404 : 400).send({ error: message });
}

export async function registerDevicePlatformRoutes(app, platform, ha) {
  app.get("/api/device-platform", async () => platform.snapshot());
  app.get(
    "/api/device-platform/projects/:id/diagnostics",
    async (request, reply) => {
      try {
        const result = await inspectProject(platform, ha, request.params.id);
        return {
          checks: result.checks,
          capabilities: result.capabilities,
          haConnected: result.haConnected,
          publishBlocked: result.publishBlocked,
        };
      } catch (error) {
        return handleError(reply, error);
      }
    },
  );
  app.post(
    "/api/device-platform/projects/:id/test-action",
    async (request, reply) => {
      try {
        if (request.body?.confirmReal !== true)
          throw new Error("真实控制需要再次确认");
        const context = projectContext(platform, ha, request.params.id);
        const status = ha.getStatus();
        if (!status.connected || status.mock)
          throw new Error("HA 未实时连接，真实控制不可用");
        const action = testAction(
          context,
          request.body?.capabilityId,
          request.body?.value,
        );
        const entity = await ha.performAction(action);
        return { entity: { entityId: entity.entityId, state: entity.state } };
      } catch (error) {
        return handleError(reply, error);
      }
    },
  );
  app.post(
    "/api/device-platform/projects/:id/test-complete",
    async (request, reply) => {
      try {
        const result = await inspectProject(platform, ha, request.params.id);
        if (result.publishBlocked)
          throw new Error("配置诊断存在错误，不能完成联调");
        if (request.body?.mode === "real" && !result.haConnected)
          throw new Error("HA 未实时连接，不能记录真实联调");
        return {
          test: await platform.saveProjectTest(
            request.params.id,
            request.body ?? {},
          ),
        };
      } catch (error) {
        return handleError(reply, error);
      }
    },
  );
  app.get(
    "/api/device-platform/projects/:id/release",
    async (request, reply) => {
      try {
        projectContext(platform, ha, request.params.id);
        const lifecycle = platform.getProjectLifecycle(request.params.id);
        const latest = lifecycle.releases[0];
        return {
          ...lifecycle,
          suggestedVersion:
            lifecycle.draft &&
            (!latest ||
              compareVersions(lifecycle.draft.version, latest.version) > 0)
              ? lifecycle.draft.version
              : nextPatchVersion(latest?.version),
        };
      } catch (error) {
        return handleError(reply, error);
      }
    },
  );
  app.get(
    "/api/device-platform/projects/:id/release/:version",
    async (request, reply) => {
      try {
        return platform.getProjectRelease(
          request.params.id,
          request.params.version,
        );
      } catch (error) {
        return handleError(reply, error);
      }
    },
  );
  app.get(
    "/api/device-platform/projects/:id/publish-check",
    async (request, reply) => {
      try {
        const result = await inspectProject(platform, ha, request.params.id);
        const test = platform.getProjectLifecycle(request.params.id).test;
        const checks = [...result.checks];
        if (!test)
          checks.push({
            page: "联调测试",
            severity: "error",
            reason: "尚未完成 N8 联调测试",
          });
        else if (
          test.signature !==
          projectConfigurationSignature(
            result.project,
            result.model,
            result.panel,
          )
        )
          checks.push({
            page: "联调测试",
            severity: "warning",
            reason: "项目在上次测试后有修改，请重新测试",
          });
        if (test?.mode === "simulation")
          checks.push({
            page: "联调测试",
            severity: "warning",
            reason: "仅完成模拟测试，尚未真实控制 HA 设备",
          });
        return {
          checks,
          publishBlocked: checks.some((item) => item.severity === "error"),
          warningCount: checks.filter((item) => item.severity === "warning")
            .length,
        };
      } catch (error) {
        return handleError(reply, error);
      }
    },
  );
  app.put(
    "/api/device-platform/projects/:id/release-draft",
    async (request, reply) => {
      try {
        return {
          draft: await platform.saveProjectReleaseDraft(
            request.params.id,
            request.body ?? {},
          ),
        };
      } catch (error) {
        return handleError(reply, error);
      }
    },
  );
  app.post(
    "/api/device-platform/projects/:id/publish",
    async (request, reply) => {
      try {
        const id = request.params.id;
        const result = await inspectProject(platform, ha, id);
        const lifecycle = platform.getProjectLifecycle(id);
        if (!lifecycle.test) throw new Error("尚未完成 N8 联调测试");
        if (result.publishBlocked)
          throw new Error("发布检查未通过，请修复错误项");
        const latest = lifecycle.releases[0];
        if (
          !lifecycle.draft ||
          (latest &&
            compareVersions(lifecycle.draft.version, latest.version) <= 0)
        )
          throw new Error("草稿版本必须高于已发布版本");
        const warnings = result.checks.filter(
          (item) => item.severity === "warning",
        );
        if (
          lifecycle.test.signature !==
          projectConfigurationSignature(
            result.project,
            result.model,
            result.panel,
          )
        )
          warnings.push({ reason: "联调后项目有修改" });
        if (lifecycle.test.mode === "simulation")
          warnings.push({ reason: "仅完成模拟测试" });
        if (warnings.length && request.body?.confirmWarnings !== true)
          throw new Error("存在警告项，需要明确确认后发布");
        const release = await platform.publishProject(id, {
          project: result.project,
          model: result.model,
          panel: result.panel,
        });
        return { release };
      } catch (error) {
        return handleError(reply, error);
      }
    },
  );
  app.get(
    "/api/device-platform/projects/:id/package",
    async (request, reply) => {
      try {
        return await platform.exportProjectPackage(
          request.params.id,
          request.query?.version ?? null,
        );
      } catch (error) {
        return handleError(reply, error);
      }
    },
  );
  app.post(
    "/api/device-platform/projects/import-package",
    { bodyLimit: 32 * 1024 * 1024 },
    async (request, reply) => {
      try {
        return await platform.importProjectPackage(request.body);
      } catch (error) {
        return handleError(reply, error);
      }
    },
  );
  app.get("/api/device-platform/devices", async () => ({
    devices: aggregateDeviceObjects({
      devices: ha.getDevices(),
      entities: ha.getEntities(),
      templates: platform.getDeviceTemplates(),
      bindings: platform.getBindings(),
    }),
  }));

  app.get(
    "/api/device-platform/projects/:id/capability-dependencies/:capabilityId",
    async (request, reply) => {
      try {
        return {
          dependencies: platform.getCapabilityDependencies(
            request.params.id,
            request.params.capabilityId,
          ),
        };
      } catch (error) {
        return handleError(reply, error);
      }
    },
  );

  app.get(
    "/api/device-platform/projects/:id/capability-validation",
    async (request, reply) => {
      try {
        const project = platform
          .getDeviceTemplates()
          .find((item) => item.id === request.params.id && !item.builtin);
        if (!project) throw new Error("自定义设备项目不存在");
        const binding = platform
          .getBindings()
          .find((item) => item.deviceTemplateId === project.id);
        const device = aggregateDeviceObjects({
          devices: ha.getDevices(),
          entities: ha.getEntities(),
          templates: platform.getDeviceTemplates(),
          bindings: platform.getBindings(),
        }).find((item) => item.id === binding?.deviceId);
        const result = validateProjectCapabilities(
          project,
          binding,
          device,
          platform.getModelTemplates(),
          platform.getControlPanels(),
        );
        if (
          project.appearance &&
          !(await platform.projectModelFileAvailable(project.id))
        ) {
          result.issues.push({
            page: "3D 外观",
            severity: "error",
            reason: "3D 模型文件不可用",
          });
          result.publishBlocked = true;
        }
        return result;
      } catch (error) {
        return handleError(reply, error);
      }
    },
  );

  app.put(
    "/api/device-platform/projects/:id/capabilities",
    {
      schema: {
        params: idParams,
        body: {
          type: "object",
          required: ["capabilities", "mappings"],
          additionalProperties: false,
          properties: {
            capabilities: { type: "array", maxItems: 100 },
            mappings: { type: "object" },
            acknowledgedCapabilityIds: {
              type: "array",
              items: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        return await platform.saveProjectCapabilities(
          request.params.id,
          request.body.capabilities,
          request.body.mappings,
          request.body.acknowledgedCapabilityIds ?? [],
        );
      } catch (error) {
        return handleError(reply, error);
      }
    },
  );

  app.put(
    "/api/device-platform/projects/:id/runtime-display",
    {
      schema: {
        params: idParams,
        body: {
          type: "object",
          required: ["runtimeDisplay"],
          additionalProperties: false,
          properties: { runtimeDisplay: { type: "object" } },
        },
      },
    },
    async (request, reply) => {
      try {
        return await platform.saveProjectRuntimeDisplay(
          request.params.id,
          request.body.runtimeDisplay,
        );
      } catch (error) {
        return handleError(reply, error);
      }
    },
  );

  app.put(
    "/api/device-platform/projects/:id/appearance",
    {
      schema: {
        params: idParams,
        body: {
          type: "object",
          required: ["modelTemplateId", "appearance"],
          additionalProperties: false,
          properties: {
            modelTemplateId: { type: "string", minLength: 1 },
            appearance: { type: "object" },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        return await platform.saveProjectAppearance(
          request.params.id,
          request.body.modelTemplateId,
          request.body.appearance,
        );
      } catch (error) {
        return handleError(reply, error);
      }
    },
  );

  app.put(
    "/api/device-platform/projects/:id/control-panel",
    {
      schema: {
        params: idParams,
        body: {
          type: "object",
          required: ["panel"],
          additionalProperties: false,
          properties: { panel: { type: "object" } },
        },
      },
    },
    async (request, reply) => {
      try {
        return await platform.saveProjectControlPanel(
          request.params.id,
          request.body.panel,
        );
      } catch (error) {
        return handleError(reply, error);
      }
    },
  );

  app.put("/api/device-platform/projects/:id/extra-entities", {
    schema: {params:idParams,body:{type:"object",required:["deviceId","extraEntityIds"],additionalProperties:false,properties:{
      deviceId:{type:"string",minLength:1},
      extraEntityIds:{type:"array",maxItems:1000,uniqueItems:true,items:{type:"string",pattern:"^[a-z_]+\\.[a-zA-Z0-9_]+$"}},
      expectedExtraEntityIds:{type:"array",maxItems:1000,uniqueItems:true,items:{type:"string"}},
    }}},
  }, async (request,reply) => {
    try {
      const binding=platform.getBindings().find(item=>item.deviceTemplateId===request.params.id);
      if(!binding) throw new Error("请先绑定当前设备，再选择额外实体");
      if(binding.deviceId!==request.body.deviceId) throw new Error("主设备绑定已变化，请刷新后重试");
      const available=ha.getEntities();
      const byId=new Map(available.map(entity=>[entity.entityId,entity]));
      const physicalIds=new Set(available.filter(entity=>(entity.deviceId || `entity:${entity.entityId}`)===binding.deviceId).map(entity=>entity.entityId));
      for(const id of binding.selectedEntityIds ?? []) physicalIds.add(id);
      const extras=request.body.extraEntityIds.map(entityId=>{
        if(physicalIds.has(entityId)) throw new Error(`实体 ${entityId} 属于当前设备，请在设备自身实体中选择`);
        const entity=byId.get(entityId);
        if(!entity && !binding.extraEntityIds?.includes(entityId)) throw new Error(`实体 ${entityId} 已不存在，请刷新实体列表`);
        return {entityId,registryId:entity?.registryId};
      });
      return await platform.saveExtraEntities(request.params.id,request.body.deviceId,extras,request.body.expectedExtraEntityIds);
    } catch(error) { return handleError(reply,error); }
  });

  app.post(
    "/api/device-platform/projects/:id/rebind",
    {
      schema: {
        params: idParams,
        body: {
          type: "object",
          required: ["deviceId", "selectedEntityIds"],
          additionalProperties: false,
          properties: {
            deviceId: { type: "string", minLength: 1 },
            selectedEntityIds: {
              type: "array",
              minItems: 1,
              uniqueItems: true,
              items: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const candidates = aggregateDeviceObjects({
          devices: ha.getDevices(),
          entities: ha.getEntities(),
          templates: platform.getDeviceTemplates(),
          bindings: platform.getBindings(),
        });
        const device = candidates.find(
          (item) => item.id === request.body.deviceId,
        );
        if (!device) throw new Error("所选 HA 设备不存在，请刷新匹配列表");
        const entityById = new Map(
          device.entities.map((item) => [item.entityId, item]),
        );
        const selectedEntities = request.body.selectedEntityIds.map((id) => {
          const entity = entityById.get(id);
          if (!entity) throw new Error(`实体 ${id} 不属于所选 HA 设备`);
          return { entityId: id, registryId: entity.registryId };
        });
        return await platform.rebindProject(
          request.params.id,
          request.body.deviceId,
          selectedEntities,
        );
      } catch (error) {
        return handleError(reply, error);
      }
    },
  );

  app.put(
    "/api/device-platform/device-templates/:id",
    { schema: { params: idParams } },
    async (request, reply) => {
      try {
        if (request.body?.id !== request.params.id)
          return reply.code(400).send({ error: "路径 ID 与模板 ID 不一致" });
        return { item: await platform.upsertDeviceTemplate(request.body) };
      } catch (error) {
        return handleError(reply, error);
      }
    },
  );
  app.put(
    "/api/device-platform/model-templates/:id",
    { bodyLimit: 22 * 1024 * 1024, schema: { params: idParams } },
    async (request, reply) => {
      try {
        if (request.body?.model?.id !== request.params.id)
          return reply.code(400).send({ error: "路径 ID 与模型 ID 不一致" });
        return {
          item: await platform.upsertModelTemplate(
            request.body.model,
            request.body.file,
          ),
        };
      } catch (error) {
        return handleError(reply, error);
      }
    },
  );
  for (const [pathName, kind] of [
    ["device-templates", "device"],
    ["model-templates", "model"],
  ]) {
    app.delete(
      `/api/device-platform/${pathName}/:id`,
      { schema: { params: idParams } },
      async (request, reply) => {
        try {
          const removed = await platform.delete(kind, request.params.id, {
            unlinkReferences: request.query?.unlink === "true",
          });
          return removed
            ? { ok: true }
            : reply.code(404).send({ error: "配置不存在" });
        } catch (error) {
          return handleError(reply, error);
        }
      },
    );
  }

  app.post(
    "/api/device-platform/import",
    { bodyLimit: 128 * 1024 * 1024 },
    async (request, reply) => {
      try {
        return { platform: await platform.importBundle(request.body) };
      } catch (error) {
        return handleError(reply, error);
      }
    },
  );

  app.get("/api/device-platform/model-files/:name", async (request, reply) => {
    const name = path.basename(request.params.name);
    if (
      name !== request.params.name ||
      !/^[a-z0-9_.-]+\.(glb|gltf)$/i.test(name)
    )
      return reply.code(400).send({ error: "模型文件名无效" });
    try {
      const bytes = await readFile(path.join(platform.modelAssetDir, name));
      reply.header("Cache-Control", "private, max-age=300");
      reply.type(
        name.endsWith(".glb") ? "model/gltf-binary" : "model/gltf+json",
      );
      return reply.send(bytes);
    } catch {
      return reply.code(404).send({ error: "模型文件不存在" });
    }
  });
}
