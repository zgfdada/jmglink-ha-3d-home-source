import { mkdir, readFile, writeFile, rename, copyFile } from "node:fs/promises";
import path from "node:path";
import { emptyFloorSidebar, resolveSidebarFloor } from '../../../../packages/schema/src/sidebar-floors.js';
import {
  defaultSidebar,
  normalizeSidebar,
} from "../../../../packages/schema/src/sidebar.js";

export class SidebarStore {
  constructor(directory, state) {
    this.file = path.join(directory, "sidebar-workspaces.json");
    this.state = state;
    this.queue = Promise.resolve();
    this.floorOwners = new Map();
  }
  static async create(directory) {
    await mkdir(directory, { recursive: true });
    let state = {};
    try {
      state = JSON.parse(
        await readFile(path.join(directory, "sidebar-workspaces.json"), "utf8"),
      );
      for (const entry of Object.values(state)) {
        entry.draft = normalizeSidebar(entry.draft);
        entry.published = normalizeSidebar(entry.published);

      }
    } catch (e) {
      if (e.code !== "ENOENT")
        throw new Error(`侧边栏数据读取失败：${e.message}`);
    }
    return new SidebarStore(directory, state);
  }
  get(project) {
    return structuredClone(
      (Object.hasOwn(this.state, project) ? this.state[project] : undefined) ?? {
        revision: 0,
        ...(project.startsWith('floor:') ? {floorScoped:true,draft:emptyFloorSidebar(),published:emptyFloorSidebar()} : {draft:defaultSidebar(),published:defaultSidebar()}),
      },
    );
  }
  floorKey(project, requested) {
    const floorId = resolveSidebarFloor(project, requested);
    if (!floorId) return project.id;
    // Anchor the pre-floor layout to its original floor; never copy it to F2.
    const legacy = this.state[project.id];
    const primary = legacy?.floorId || this.floorOwners.get(project.id) || project.floors[0].id;
    this.floorOwners.set(project.id, primary);
    if (legacy && !legacy.floorId) legacy.floorId = primary;
    return floorId === primary ? project.id : 'floor:' + JSON.stringify([project.id, floorId]);
  }
  async bindLegacyFloors(projects) {
    let changed = false;
    for (const item of projects.listProjects?.() || []) {
      const project = projects.getProject(item.id), entry = this.state[item.id];
      if (entry && !entry.floorId && project?.floors?.[0]) {
        entry.floorId = project.floors[0].id;
        changed = true;
      }
    }
    if (changed) {
      await copyFile(this.file, `${this.file}.bak`);
      await writeFile(`${this.file}.tmp`, JSON.stringify(this.state, null, 2), 'utf8');
      await rename(`${this.file}.tmp`, this.file);
    }
  }
  replaceState(state) {
    const normalized=Object.fromEntries(Object.entries(state).map(([key,e])=>[key,{...e,revision:(Number(e.revision)||0)+1,draft:normalizeSidebar(e.draft),published:normalizeSidebar(e.published)}]));
    const task=this.queue.catch(()=>{}).then(async()=>{
      await writeFile(`${this.file}.tmp`,JSON.stringify(normalized,null,2),'utf8');
      try{await copyFile(this.file,`${this.file}.bak`);}catch(e){if(e.code!=="ENOENT")throw e;}
      await rename(`${this.file}.tmp`,this.file);this.state=normalized;this.floorOwners.clear();
    });this.queue=task;return task;
  }
  update(project, payload, publish = false) {
    const task = this.queue
      .catch(() => {})
      .then(async () => {
        const previous = this.get(project);
        if (payload.revision !== previous.revision)
          throw Object.assign(
            new Error("配置已被其他终端修改，请重新加载后再编辑"),
            { statusCode: 409 },
          );
        const draft = normalizeSidebar(payload.draft);
        const entry = {
          ...((previous.floorId || this.floorOwners.get(project)) ? {floorId:previous.floorId || this.floorOwners.get(project)} : {}),
          ...(previous.floorScoped ? {floorScoped:true} : {}),
          energySampleVersion: 2,
          presentationVersion: 6,
          revision: previous.revision + 1,
          draft,
          published: publish ? structuredClone(draft) : previous.published,
        };
        const next = { ...this.state, [project]: entry };
        await writeFile(
          `${this.file}.tmp`,
          JSON.stringify(next, null, 2),
          "utf8",
        );
        try {
          await copyFile(this.file, `${this.file}.bak`);
        } catch (e) {
          if (e.code !== "ENOENT") throw e;
        }
        await rename(`${this.file}.tmp`, this.file);
        this.state = next;
        return structuredClone(entry);
      });
    this.queue = task;
    return task;
  }
}
export async function registerSidebarRoutes(
  app,
  store,
  projects,
  onChange = () => {},
) {
  await store.bindLegacyFloors(projects);
  const check = (req) => {
    const project = projects.getProject(req.params.project);
    if (!project)
      throw Object.assign(new Error("项目不存在"), { statusCode: 404 });
    return store.floorKey(project, req.query?.floorId);
  };
  app.get("/api/sidebar/:project", async (req) => {
    return store.get(check(req));
  });
  for (const action of ["draft", "publish"])
    app.put(
      `/api/sidebar/:project/${action}`,
      { bodyLimit: 1024 * 1024 },
      async (req) => {
        const workspaceKey = check(req);
        const site = req.headers["sec-fetch-site"];
        if (site && site !== "same-origin")
          throw Object.assign(new Error("请从当前 3D Home 页面保存配置"), {
            statusCode: 403,
          });
        if (
          req.headers.origin &&
          !site &&
          new URL(req.headers.origin).host !== req.headers.host
        )
          throw Object.assign(new Error("不允许跨站修改配置"), {
            statusCode: 403,
          });
        // JSON-only mutations: a foreign HTML form cannot submit executable widget definitions.
        if (!req.headers["content-type"]?.startsWith("application/json"))
          throw Object.assign(new Error("需要 JSON 文档"), { statusCode: 415 });
        const result = await store.update(
          workspaceKey,
          req.body ?? {},
          action === "publish",
        );
        onChange();
        return result;
      },
    );
}
