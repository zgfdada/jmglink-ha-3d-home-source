import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { normalizeSidebar } from "../../../../packages/schema/src/sidebar.js";
import { validateFloorplanProject } from "@ha3d/schema";
import {normalizeMotionLibraryPackage} from '../../../../packages/schema/src/motion-library.js';

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
  if(value.devicePlatform.motionLibrary){try{normalizeMotionLibraryPackage(value.devicePlatform.motionLibrary);}catch(error){throw bad(error.message);}}
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
    if (!project || (floorId && !project.floors.some((f) => f.id === floorId)))
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
  await Promise.all([sidebars.queue, platform.writeQueue, platform.controlLibrary?.queue,platform.motionLibrary?.queue]);
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
export async function restoreInstance(value, projects, platform, sidebars) {
  const next = validateInstanceBackup(value),
    previous = await exportInstance(projects, platform, sidebars);
  try {
    await platform.importBundle(next.devicePlatform);
    for (const key of ["projectReleases", "projectDrafts", "projectTests"])
      platform[key] = structuredClone(next.deviceHistory[key]);
    await platform.persistAll();
    await projects.replaceAll(next.projects, next.currentProjectId);
    await sidebars.replaceState(next.sidebars);
  } catch (error) {
    const results = await Promise.allSettled([
      (async () => {
        await platform.importBundle(previous.devicePlatform);
        for (const k of ["projectReleases", "projectDrafts", "projectTests"])
          platform[k] = structuredClone(previous.deviceHistory[k]);
        await platform.persistAll();
      })(),
      projects.replaceAll(previous.projects, previous.currentProjectId),
      sidebars.replaceState(previous.sidebars),
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
  };
}
export async function registerInstanceBackup(
  app,
  { projects, platform, sidebars, dataDir, onRestored = () => {} },
) {
  let busy = false;
  app.get("/api/instance-backup", async () => {
    if (busy)
      throw Object.assign(Error("正在恢复，请稍后"), { statusCode: 409 });
    return exportInstance(projects, platform, sidebars);
  });
  app.post(
    "/api/instance-backup",
    { bodyLimit: 128 * 1024 * 1024 },
    async (req) => {
      const site = req.headers["sec-fetch-site"];
      if (
        (site && site !== "same-origin") ||
        (!site &&
          req.headers.origin &&
          new URL(req.headers.origin).host !== req.headers.host)
      )
        throw Object.assign(Error("不允许跨站恢复实例"), { statusCode: 403 });
      if (!req.headers["content-type"]?.startsWith("application/json"))
        throw Object.assign(Error("需要 JSON"), { statusCode: 415 });
      if (req.body?.confirm !== true) throw bad("请先确认替换当前实例");
      if (busy)
        throw Object.assign(Error("正在恢复，请稍后"), { statusCode: 409 });
      validateInstanceBackup(req.body.backup);
      busy = true;
      try {
        const previous = await exportInstance(projects, platform, sidebars);
        const directory = path.join(dataDir, "instance-backups");
        await mkdir(directory, { recursive: true });
        await writeFile(
          path.join(directory, `before-import-${Date.now()}.json`),
          JSON.stringify(previous),
          { mode: 0o600 },
        );
        const result = await restoreInstance(
          req.body.backup,
          projects,
          platform,
          sidebars,
        );
        onRestored();
        return result;
      } finally {
        busy = false;
      }
    },
  );
}
