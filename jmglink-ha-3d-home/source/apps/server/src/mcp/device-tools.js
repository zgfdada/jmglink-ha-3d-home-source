import { z } from "zod";
import { allow, clean, fail } from "./store.js";
import { DEVICE_OPERATIONS, LIBRARY_OPERATIONS } from "./device-platform.js";
const id = z.string().min(1).max(128),
  revision = z.string().regex(/^[a-f0-9]{64}$/),
  object = (shape) => z.object(shape).strict();
const entity = z.string().regex(/^[a-z0-9_]+\.[a-z0-9_]+$/);
const page = {
  offset: z.number().int().min(0).default(0),
  limit: z.number().int().min(1).max(100).default(50),
  search: z.string().max(100).default(""),
};
function paginate(items, args) {
  const q = args.search.toLowerCase(),
    matches = items.filter(
      (item) => !q || JSON.stringify(item).toLowerCase().includes(q),
    );
  return {
    items: matches.slice(args.offset, args.offset + args.limit),
    total: matches.length,
    offset: args.offset,
    nextOffset:
      args.offset + args.limit < matches.length
        ? args.offset + args.limit
        : null,
  };
}
export function registerDeviceTools(tool, engine, client) {
  const devices = engine.devicePlatform;
  tool(
    "home3d.schemas.get",
    "读取设备开发MCP操作字段、示例与工作流；参数不足时先读此工具，避免转用前端。",
    object({}),
    () => ({
      workflow: [
        "system.capabilities",
        "home3d.library.list（先检索复用）",
        "home3d.device.project_get",
        "home3d.model.parts_get",
        "home3d.device.plan / home3d.library.plan",
        "changes.validate",
        "changes.inspect",
        "changes.apply（唯一幂等键）",
        "回读、诊断和条件模拟",
      ],
      deviceOperations: {
        create: {
          value: {
            id: "custom.example",
            name: "单件设备",
            category: "media",
            manufacturer: "用户配置",
            model: "现有型号",
            icon: "mdi:speaker",
            description: "",
            matchRules: {},
          },
          note: "仅建立单件设备项目，后续分步骤绑定。已有模型优先复用；新建/修改模型需先获用户选择。",
        },
        basic:
          "value为name/category/manufacturer/model/icon/description/matchRules的补丁；不修改绑定或能力",
        rebind: {
          value: {
            deviceId: "来自ha.devices.list",
            selectedEntityIds: ["switch.example"],
          },
        },
        extra_entities: {
          value: {
            entityIds: ["input_boolean.example", "media_player.example"],
          },
          note: "替换额外选择，保留主设备；无主设备时建立entityOnly绑定",
        },
        capabilities: {
          value: {
            capabilities: [
              {
                capabilityId: "status",
                name: "运行状态",
                kind: "status",
                dataType: "boolean",
                access: "read",
                allowedDomains: ["input_boolean"],
                required: true,
              },
            ],
            mappings: {
              status: { entityId: "input_boolean.example", attribute: "state" },
            },
            acknowledgedCapabilityIds: [],
          },
          note: "完整能力与映射集合，先读取合并，依赖影响需显式确认能力ID",
        },
        appearance: {
          value: {
            modelTemplateId: "现有模型ID",
            appearance: "来自project_get的完整appearance对象；保留无关参数",
          },
        },
        motions: {
          value: {
            rules: [
              {
                id: "rule-1",
                name: "运行声波",
                targets: ["root/0"],
                capabilityId: "status",
                motionResourceId: "从library.list选择",
                condition: { operator: "eq", value: "on" },
                effect: "可省略以复制资源完整快照，或明确传完整effect",
                transitionMs: 300,
                priority: 0,
                endBehavior: "restore",
              },
            ],
          },
          note: "替换规则集合；自动保存原始部件身份，中文显示名不替代身份。路径不确定时明确报告。",
        },
        runtime_display:
          "value:{runtimeDisplay:{statusCapabilityId,remainingCapabilityId,runningStates,endingStates,titleTemplate,idleTemplate,runningTemplate}}",
        control_panel: "value:{panel:来自project_get的完整控制面板配置}",
        delete:
          "value:{unlinkReferences:false}；有引用默认拒绝，不隐式解除引用",
        import_package:
          "value:{transferId}；只导入单设备包，重新匹配HA；不会执行真实控制",
        test_simulation: "value:{}；只记录模拟，不声称实机联调",
        release_draft:
          "value:{version:'1.0.0',visibility:'private',notes:'',category:'generic',options:{...}}",
        publish_local:
          "value:{confirmWarnings:true}；通过诊断和联调后保存在本地设备版本库，不发布应用镜像或联网上传",
      },
      libraryOperations: {
        model_file:
          "value:{model:{id,name,dimensions:{width,depth,height},placement,furnitureEnabled,...},transferId}；source.url由服务端生成",
        model_delete: "value:{modelId}；拒绝场景/设备引用",
        motion_save:
          "value:{resource:{name,description,effect:{type,axis,from,to,program?,shader?,...},transitionMs},resourceId?}；省略resourceId新建，否则更新",
        motion_delete: "value:{resourceId}；既有规则保留快照",
        motion_reset: "value:{resourceId}；仅内置默认资源",
        control_save: "value:{control:完整控件配置}；按ID增改",
        control_delete: "value:{controlId,confirmReferences:false}",
        control_rollback: "value:{controlId}；恢复控件上一版",
      },
      limits: {
        modelBytes: 15 * 1024 * 1024,
        packageBytes: 32 * 1024 * 1024,
        chunkBytes: 256 * 1024,
        visualPreview:
          "MCP只做结构/条件模拟，不运行主机代码；真实画面需浏览器验收",
        permissions: "共享资源要求覆盖全部楼层项目；不自动增加scope或实体授权",
      },
    }),
    true,
  );
  tool(
    "home3d.device.projects_list",
    "分页检索设备开发中心项目；不同于楼层项目。先复用现有模型和设备。",
    object({ projectId: id, ...page }),
    (args) => {
      const result = devices.list(client, args);
      return { revision: result.revision, ...paginate(result.projects, args) };
    },
    true,
  );
  tool(
    "home3d.device.project_get",
    "读取设备项目、模型、控制面板、绑定映射、依赖、发布记录及修订；检查全部绑定实体权限",
    object({ projectId: id, deviceProjectId: id }),
    (args) => devices.get(client, args),
    true,
  );
  tool(
    "home3d.library.list",
    "分页检索全部本地模型／动效／控件及引用；含可编辑初始模型，优先复用，禁止擅自整套建模。",
    object({
      projectId: id,
      kind: z.enum(["models", "motions", "controls"]),
      ...page,
    }),
    (args) => {
      const result = devices.library(client, args);
      return {
        revision: result.revision,
        libraryRevision: result.libraryRevision,
        ...paginate(result.items, args),
      };
    },
    true,
  );
  tool(
    "home3d.library.export",
    "导出控件／动效资源包或单个本地模型文件到分块传输，不读取任意服务器路径。",
    object({
      projectId: id,
      kind: z.enum(["model", "motions", "controls"]),
      modelId: id.optional(),
    }),
    async (args) => {
      devices.access(client, args.projectId);
      if (args.kind === "model") {
        const model = engine.platform
          .getModelTemplates()
          .find((m) => m.id === args.modelId);
        if (!model) throw fail("RESOURCE_DENIED", "模型不存在");
        const file = await engine.platform.exportModelAsset(model);
        if (!file) return { model: clean(model), procedural: true };
        return devices.transfers.export(
          client,
          file.fileName,
          Buffer.from(file.dataBase64, "base64"),
        );
      }
      const library =
        args.kind === "motions"
          ? engine.platform.motionLibrary
          : engine.platform.controlLibrary;
      if (!library) throw fail("UNSUPPORTED_CAPABILITY", "资源库未启用", 409);
      return devices.transfers.export(
        client,
        args.kind + ".json",
        Buffer.from(JSON.stringify(library.export())),
      );
    },
    true,
  );
  tool(
    "home3d.scene.objects_plan",
    "批量新增/更新/删除明确楼层对象，适合复用单件模型组合成套设备；合并最新项目，保留无关对象。完整项目权限，设备实体另校验。",
    object({
      projectId: id,
      expectedVersion: z.number().int().min(0),
      operations: z
        .array(
          object({
            floorId: id,
            collection: z.enum(["furniture", "devices"]),
            action: z.enum(["upsert", "delete"]),
            objectId: id,
            value: z.record(z.unknown()).optional(),
          }),
        )
        .min(1)
        .max(100),
    }),
    async (args) => {
      const current = engine.project(
        client,
        args.projectId,
        "home3d.project.replace",
      );
      if (current.version !== args.expectedVersion)
        throw fail("REVISION_CONFLICT", "场景版本已变化", 409);
      const next = structuredClone(current);
      for (const op of args.operations) {
        const floor = next.floors.find((f) => f.id === op.floorId);
        if (!floor) throw fail("RESOURCE_DENIED", "楼层不存在");
        const index = floor[op.collection].findIndex(
          (item) => item.id === op.objectId,
        );
        if (op.action === "delete") {
          if (index < 0) throw fail("RESOURCE_DENIED", "待删除对象不存在");
          floor[op.collection].splice(index, 1);
          continue;
        }
        if (!op.value || op.value.id !== op.objectId)
          throw fail("VALIDATION_FAILED", "对象ID必须匹配", 422);
        const item = {
          ...(index < 0 ? {} : floor[op.collection][index]),
          ...op.value,
        };
        if (op.collection === "devices")
          allow(client, "ha.state.read", "entities", item.entityId);
        if (
          item.modelId?.startsWith("custom.") &&
          !engine.platform
            .getModelTemplates()
            .some((m) => m.id === item.modelId)
        )
          throw fail("RESOURCE_DENIED", "请先选择已入库的单件模型");
        if (item.customModel?.source?.type === "upload") {
          const model = engine.platform
            .getModelTemplates()
            .find((m) => m.id === item.customModel.id);
          if (
            !model ||
            JSON.stringify(model.source) !==
              JSON.stringify(item.customModel.source)
          )
            throw fail("RESOURCE_DENIED", "家具上传资源必须复用模型库已有文件");
        }
        if (index < 0) floor[op.collection].push(item);
        else floor[op.collection][index] = item;
      }
      return engine.planFullProject(client, {
        projectId: args.projectId,
        project: next,
      });
    },
  );
  tool(
    "home3d.model.parts_get",
    "读取本地GLB/GLTF部件路径、原始名称、中文名、变换及SHA256；复杂加载器结构明确标记不可静态确认。",
    object({
      projectId: id,
      modelId: id.optional(),
      deviceProjectId: id.optional(),
    }),
    (args) => devices.parts(client, args),
    true,
  );
  tool(
    "home3d.device.diagnostics",
    "只读检查设备能力、映射、模型文件、动画部件、面板和发布阻塞；不发真实指令。",
    object({ projectId: id, deviceProjectId: id }),
    (args) => devices.diagnostics(client, args),
    true,
  );
  tool(
    "home3d.device.preview",
    "模拟能力条件和离线恢复，返回规则匹配；不执行自定义代码、不渲染画面、不控制HA。",
    object({
      projectId: id,
      deviceProjectId: id,
      values: z
        .record(
          z.union([
            z.string().max(160),
            z.number().finite(),
            z.boolean(),
            z.null(),
          ]),
        )
        .default({}),
      offline: z.boolean().default(false),
    }),
    (args) => devices.preview(client, args),
    true,
  );
  tool(
    "home3d.device.plan",
    "设备项目变更计划：create/basic、rebind/extra_entities、capabilities、appearance/motions、runtime_display/control_panel、delete、import_package、模拟联调、版本草稿及本地发布。expectedRevision来自读取；value按操作提供。不会执行真实设备服务。",
    object({
      projectId: id,
      deviceProjectId: id.optional(),
      operation: z.enum(DEVICE_OPERATIONS),
      expectedRevision: revision,
      value: z.record(z.unknown()).default({}),
    }),
    (args) => devices.plan(client, args),
  );
  tool(
    "home3d.library.plan",
    "模型文件上传/替换/删除、动效与控件增改删/恢复计划。模型文件由transferId提供；脚本需home3d.code.write；expectedRevision来自library.list。",
    object({
      projectId: id,
      operation: z.enum(LIBRARY_OPERATIONS),
      expectedRevision: revision,
      value: z.record(z.unknown()),
    }),
    (args) => devices.plan(client, args, true),
  );
  tool(
    "home3d.transfer.stage",
    "分块暂存模型或设备包，每块最多256KiB。首块offset=0、文件名、总字节数和SHA256；续传用transferId。模型最终上限15MiB、设备包32MiB；一小时到期按需清理。",
    object({
      projectId: id,
      transferId: id.optional(),
      fileName: z.string().min(1).max(160).optional(),
      totalBytes: z
        .number()
        .int()
        .min(1)
        .max(32 * 1024 * 1024)
        .optional(),
      sha256: revision.optional(),
      offset: z.number().int().min(0),
      dataBase64: z.string().min(4).max(349528),
    }),
    (args) => {
      devices.access(client, args.projectId, true);
      return devices.transfers.stage(client, args);
    },
  );
  tool(
    "home3d.transfer.read",
    "分块读取当前客户端暂存的导出文件；由offset和nextOffset续读，不返回任意服务器文件。",
    object({
      projectId: id,
      transferId: id,
      offset: z.number().int().min(0).default(0),
    }),
    (args) => {
      devices.access(client, args.projectId);
      return devices.transfers.read(client, args.transferId, args.offset);
    },
    true,
  );
  tool(
    "home3d.transfer.discard",
    "清理当前客户端不再用于有效计划的临时传输；有效恢复快照保留到期。",
    object({ projectId: id, transferId: id }),
    (args) => {
      devices.access(client, args.projectId, true);
      return devices.transfers.discard(client, args.transferId);
    },
  );
  tool(
    "home3d.device.package_export",
    "导出脱敏单设备包到临时传输，保留模型和动画快照、不携带HA绑定或凭据；用transfer.read分块下载。",
    object({
      projectId: id,
      deviceProjectId: id,
      version: z.string().max(50).optional(),
    }),
    async (args) => {
      devices.get(client, args);
      const bundle = await engine.platform.exportProjectPackage(
        args.deviceProjectId,
        args.version ?? null,
      );
      return devices.transfers.export(
        client,
        "device-project.json",
        Buffer.from(JSON.stringify(bundle)),
      );
    },
    true,
  );
  tool(
    "ha.entities.details",
    "读取指定已授权实体的状态及控制设计所需元数据、可选值与数值范围；不返回媒体/凭据或任意属性正文。",
    object({ entityIds: z.array(entity).min(1).max(100) }),
    ({ entityIds }) => {
      const allowed = [
        "friendly_name",
        "device_class",
        "unit_of_measurement",
        "options",
        "min",
        "max",
        "step",
        "supported_features",
        "min_temp",
        "max_temp",
        "target_temp_step",
        "hvac_modes",
        "fan_modes",
        "swing_modes",
        "preset_modes",
        "current_position",
        "brightness",
        "min_color_temp_kelvin",
        "max_color_temp_kelvin",
      ];
      return clean(
        devices
          .entityAccess(client, entityIds)
          .map((e) => ({
            entityId: e.entityId,
            deviceId: e.deviceId || `entity:${e.entityId}`,
            name: e.name,
            domain: e.domain,
            state: e.state,
            stateLabels: e.stateLabels,
            attributes: Object.fromEntries(
              allowed
                .filter((key) => Object.hasOwn(e.attributes ?? {}, key))
                .map((key) => [key, e.attributes[key]]),
            ),
          })),
      );
    },
    true,
  );
  tool(
    "ha.devices.list",
    "分页读取授权实体所属HA设备与实体ID，用于主设备绑定，不泄露未授权设备。",
    object({ ...page }),
    (args) => {
      engine.haAdapter.enabled();
      allow(client, "ha.state.read");
      const entities = engine.ha
        .getEntities()
        .filter(
          (e) =>
            client.resources.entities.includes("*") ||
            client.resources.entities.includes(e.entityId),
        );
      const groups = new Map();
      for (const e of entities) {
        const key = e.deviceId || `entity:${e.entityId}`;
        if (!groups.has(key))
          groups.set(key, {
            id: key,
            name:
              engine.ha.getDevices?.().find((d) => d.id === key)?.name ??
              e.name,
            entityIds: [],
          });
        groups.get(key).entityIds.push(e.entityId);
      }
      return clean(paginate([...groups.values()], args));
    },
    true,
  );
}
