import { deduplicateInstanceModels, rewriteImportedModelUrls } from "../device-platform/model-catalog.js";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, rename, rm } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import path from "node:path";
import { normalizeSidebar } from "../../../../packages/schema/src/sidebar.js";
import { SIDEBAR_OVERVIEW_ID } from "../../../../packages/schema/src/sidebar-floors.js";
import { validateFloorplanProject } from "@ha3d/schema";
import { normalizeMotionLibraryPackage } from "../../../../packages/schema/src/motion-library.js";
import { readInstanceJson, INSTANCE_BODY_LIMIT } from "./instanceJson.js";

const bad = (message) => Object.assign(Error(message), { statusCode: 400 });
export function validateInstanceBackup(value) {
  if (
    value?.format !== "ha3d-instance-backup" ||
    value.version !== 1 ||
    !Array.isArray(value.projects) ||
    !value.projects.length
  )
    throw bad("完整实例备份格式不正确");
  const ids = new Set();
  const projects = value.projects.map((raw) => {
    const check = validateFloorplanProject(raw);
    if (!check.valid || !check.project)
      throw bad("户型数据不正确：" + check.issues.join("; "));
    const p = check.project;
    if (ids.has(p.id)) throw bad("户型 ID 重复");
    ids.add(p.id);
    return p;
  });
  if (!ids.has(value.currentProjectId)) throw bad("当前户型不存在");
  if (
    value.devicePlatform?.format !== "ha3d-device-platform" ||
    !value.devicePlatform.controlLibrary
  )
    throw bad("缺少完整设备平台或控件库");
  if (value.devicePlatform.motionLibrary) {
    try {
      normalizeMotionLibraryPackage(value.devicePlatform.motionLibrary);
    } catch (error) {
      throw bad(error.message);
    }
  }
  if (
    !value.sidebars ||
    typeof value.sidebars !== "object" ||
    Array.isArray(value.sidebars)
  )
    throw bad("缺少侧栏工作区");
  for (const model of value.devicePlatform.modelTemplates || [])
    if (
      model.source?.type === "upload" &&
      !(value.devicePlatform.assets || []).some(
        (a) =>
          a.modelTemplateId === model.id &&
          typeof a.dataBase64 === "string" &&
          a.dataBase64.length,
      )
    )
      throw bad("上传模型缺少文件");
  for (const field of ["projectReleases", "projectDrafts", "projectTests"])
    if (!Array.isArray(value.deviceHistory?.[field]))
      throw bad("缺少设备编辑记录");
  const sidebars = {};
  for (const [key, entry] of Object.entries(value.sidebars)) {
    if (
      !entry ||
      typeof entry !== "object" ||
      ["__proto__", "constructor", "prototype"].includes(key)
    )
      throw bad("侧栏条目错误");
    let projectId = key,
      floorId = entry.floorId;
    if (key.startsWith("floor:")) {
      try {
        const scope = JSON.parse(key.slice(6));
        if (
          !Array.isArray(scope) ||
          scope.length !== 2 ||
          scope.some((v) => typeof v !== "string")
        )
          throw Error();
        [projectId, floorId] = scope;
      } catch {
        throw bad("侧栏作用域错误");
      }
    }
    const project = projects.find((p) => p.id === projectId);
    if (
      !project ||
      (floorId &&
        floorId !== SIDEBAR_OVERVIEW_ID &&
        !project.floors.some((f) => f.id === floorId))
    )
      throw bad("侧栏引用了不存在的户型或楼层");
    sidebars[key] = {
      ...entry,
      draft: normalizeSidebar(entry.draft),
      published: normalizeSidebar(entry.published),
    };
  }
  return { ...value, projects, sidebars };
}
export async function exportInstance(projects, platform, sidebars) {
  await Promise.all([
    projects.writeQueue,
    sidebars.queue,
    platform.writeQueue,
    platform.controlLibrary?.queue,
    platform.motionLibrary?.queue,
  ]);
  const devicePlatform = structuredClone(await platform.exportBundle());
  for (const model of devicePlatform.modelTemplates || [])
    if (
      model.source?.type === "upload" &&
      !(devicePlatform.assets || []).some((a) => a.modelTemplateId === model.id)
    )
      throw Error(
        `模型 ${model.name || model.id} 缺少文件，无法生成完整实例备份`,
      );
  return {
    format: "ha3d-instance-backup",
    version: 1,
    exportedAt: new Date().toISOString(),
    currentProjectId: projects.currentProjectId,
    projects: projects
      .listProjects()
      .map((p) => structuredClone(projects.getProject(p.id))),
    devicePlatform,
    deviceHistory: Object.fromEntries(
      ["projectReleases", "projectDrafts", "projectTests"].map((k) => [
        k,
        structuredClone(platform[k]),
      ]),
    ),
    sidebars: structuredClone(sidebars.state),
  };
}

// Serialize one history entry or uploaded model at a time. A complete instance
// may contain tens of MiB of history and Base64 data, so JSON.stringify on the
// whole backup would briefly retain several full-sized copies in the Node heap.
export async function* serializeInstanceBackup(projects, platform, sidebars) {
  await Promise.all([
    projects.writeQueue,
    sidebars.queue,
    platform.writeQueue,
    platform.controlLibrary?.queue,
    platform.motionLibrary?.queue,
  ]);
  const { assets: ignoredAssets, ...devicePlatform } =
    await platform.exportBundle({ includeAssets: false });
  void ignoredAssets;
  yield `{"format":"ha3d-instance-backup","version":1,"exportedAt":${JSON.stringify(new Date().toISOString())},`;
  yield `"currentProjectId":${JSON.stringify(projects.currentProjectId)},"projects":[`;
  let first = true;
  for (const item of projects.listProjects()) {
    if (!first) yield ",";
    yield JSON.stringify(projects.getProject(item.id));
    first = false;
  }
  yield `],"devicePlatform":${JSON.stringify(devicePlatform).slice(0, -1)},"assets":[`;
  first = true;
  for (const model of platform.modelTemplates) {
    if (model.source?.type !== "upload") continue;
    const asset = await platform.exportModelAsset(model);
    if (!asset)
      throw Error(
        `模型 ${model.name || model.id} 缺少文件，无法生成完整实例备份`,
      );
    if (!first) yield ",";
    yield JSON.stringify(asset);
    first = false;
  }
  yield `]},"deviceHistory":{`;
  first = true;
  for (const key of ["projectReleases", "projectDrafts", "projectTests"]) {
    if (!first) yield ",";
    yield `${JSON.stringify(key)}:[`;
    for (let index = 0; index < platform[key].length; index++) {
      if (index) yield ",";
      yield JSON.stringify(platform[key][index]);
    }
    yield "]";
    first = false;
  }
  yield `},"sidebars":${JSON.stringify(sidebars.state)}}`;
}

export async function writeInstanceBackup(file, projects, platform, sidebars) {
  await mkdir(path.dirname(file), { recursive: true });
  const temporary = `${file}.${randomUUID()}.tmp`;
  try {
    await pipeline(
      Readable.from(serializeInstanceBackup(projects, platform, sidebars)),
      createWriteStream(temporary, { mode: 0o600 }),
    );
    await rename(temporary, file);
  } catch (error) {
    await rm(temporary, { force: true });
    throw error;
  }
}

export async function restoreInstance(
  value,
  projects,
  platform,
  sidebars,
  { previousBackupPath, takeOwnership = false } = {},
) {
  const next = validateInstanceBackup(value),
    previous = previousBackupPath
      ? null
      : await exportInstance(projects, platform, sidebars);
  let modelDeduplication;
  try {
    if (!takeOwnership) {
      const { assets = [], ...metadata } = next.devicePlatform;
      next.devicePlatform = { ...structuredClone(metadata), assets: assets.map(asset => ({...asset})) };
      next.deviceHistory = structuredClone(next.deviceHistory);
    }
    modelDeduplication = deduplicateInstanceModels(next);
    await platform.importBundle(next.devicePlatform, {
      persist: false,
      releaseAssets: takeOwnership,
    });
    rewriteImportedModelUrls(next, platform.getModelTemplates());
    for (const key of ["projectReleases", "projectDrafts", "projectTests"])
      platform[key] = takeOwnership
        ? next.deviceHistory[key]
        : structuredClone(next.deviceHistory[key]);
    await platform.persistAll();
    await projects.replaceAll(next.projects, next.currentProjectId);
    await sidebars.replaceState(next.sidebars);
  } catch (error) {
    const rollback =
      previous ??
      (await readInstanceJson(createReadStream(previousBackupPath)));
    const results = await Promise.allSettled([
      (async () => {
        await platform.importBundle(rollback.devicePlatform, {
          persist: false,
          releaseAssets: true,
        });
        for (const k of ["projectReleases", "projectDrafts", "projectTests"])
          platform[k] = rollback.deviceHistory[k];
        await platform.persistAll();
      })(),
      projects.replaceAll(rollback.projects, rollback.currentProjectId),
      sidebars.replaceState(rollback.sidebars),
    ]);
    if (results.some((r) => r.status === "rejected"))
      throw Error(
        "导入失败且部分回滚未完成，请使用恢复前备份：" + error.message,
      );
    throw error;
  }
  return {
    projects: next.projects.length,
    currentProjectId: next.currentProjectId,
    modelDeduplication,
  };
}
export async function registerInstanceBackup(
  app,
  { projects, platform, sidebars, dataDir, writeGate, onRestored = () => {} },
) {
  await app.register(async function instanceRoutes(app) {
    let busy = false;
    let receiving = false;
    app.removeContentTypeParser("application/json");
    app.addContentTypeParser("application/json", async (req, payload) =>
      readInstanceJson(payload),
    );
    app.addHook("onResponse", async (req) => {
      if (req.instanceImportOwner) receiving = false;
    });
    app.get("/api/instance-backup", async (req, reply) => {
      if (busy)
        throw Object.assign(Error("正在恢复，请稍后"), { statusCode: 409 });
      const file = path.join(
        dataDir,
        "instance-backups",
        `export-${randomUUID()}.json`,
      );
      const write = () =>
        writeInstanceBackup(file, projects, platform, sidebars);
      if (writeGate) await writeGate.exclusive(write);
      else await write();
      const stream = createReadStream(file);
      stream.once("close", () => {
        void rm(file, { force: true });
      });
      return reply.type("application/json").send(stream);
    });
    app.post(
      "/api/instance-backup",
      {
        bodyLimit: INSTANCE_BODY_LIMIT,
        onRequest: async (req) => {
          const site = req.headers["sec-fetch-site"];
          if (
            (site && site !== "same-origin") ||
            (!site &&
              req.headers.origin &&
              new URL(req.headers.origin).host !== req.headers.host)
          )
            throw Object.assign(Error("不允许跨站恢复实例"), {
              statusCode: 403,
            });
          if (!req.headers["content-type"]?.startsWith("application/json"))
            throw Object.assign(Error("需要 JSON"), { statusCode: 415 });
          if (receiving || busy)
            throw Object.assign(Error("正在恢复，请稍后"), { statusCode: 409 });
          receiving = true;
          req.instanceImportOwner = true;
          req.raw.once("aborted", () => {
            if (req.instanceImportOwner) {
              req.instanceImportOwner = false;
              receiving = false;
            }
          });
          const size = Number(req.headers["content-length"]);
          if (size > INSTANCE_BODY_LIMIT)
            throw Object.assign(Error("备份超过 128MB"), { statusCode: 413 });
        },
      },
      async (req) => {
        if (req.body?.confirm !== true) throw bad("请先确认替换当前实例");
        if (busy)
          throw Object.assign(Error("正在恢复，请稍后"), { statusCode: 409 });
        const next = validateInstanceBackup(req.body.backup);
        req.log.info(
          {
            event: "instance-import",
            stage: "validated",
            heapMiB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          },
          "Instance import validated",
        );
        const restore = async () => {
          busy = true;
          try {
            const directory = path.join(dataDir, "instance-backups");
            const previousBackupPath = path.join(
              directory,
              `before-import-${Date.now()}-${randomUUID()}.json`,
            );
            await writeInstanceBackup(
              previousBackupPath,
              projects,
              platform,
              sidebars,
            );
            req.log.info(
              {
                event: "instance-import",
                stage: "previous-backup-saved",
                heapMiB: Math.round(
                  process.memoryUsage().heapUsed / 1024 / 1024,
                ),
              },
              "Previous instance backup saved",
            );
            const result = await restoreInstance(
              next,
              projects,
              platform,
              sidebars,
              { previousBackupPath, takeOwnership: true },
            );
            onRestored();
            req.log.info(
              {
                event: "instance-import",
                stage: "completed",
                heapMiB: Math.round(
                  process.memoryUsage().heapUsed / 1024 / 1024,
                ),
              },
              "Instance import completed",
            );
            return result;
          } finally {
            busy = false;
          }
        };
        return writeGate ? writeGate.exclusive(restore) : restore();
      },
    );
  });
}
