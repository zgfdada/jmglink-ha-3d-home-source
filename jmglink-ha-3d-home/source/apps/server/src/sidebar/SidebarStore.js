import { mkdir, readFile, writeFile, rename, copyFile } from "node:fs/promises";
import path from "node:path";
import {
  defaultSidebar,
  normalizeSidebar,
} from "../../../../packages/schema/src/sidebar.js";

export class SidebarStore {
  constructor(directory, state) {
    this.file = path.join(directory, "sidebar-workspaces.json");
    this.state = state;
    this.queue = Promise.resolve();
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
        if (entry.energySampleVersion !== 2) {
          for (const config of [entry.draft,entry.published]) {
            const sample=defaultSidebar(),home=config.pages.find(p=>p.id==='home') || config.pages[0];
            if(!config.widgets.some(w=>w.id==='energy'))config.widgets.push(sample.widgets.find(w=>w.id==='energy'));
            const old=config.pages.find(p=>p.id==='energy');
            if(old){for(const item of old.items)if(!home.items.some(i=>i.id===item.id))home.items.push({...item,height:340});config.pages=config.pages.filter(p=>p!==old);}
            if(!home.items.some(i=>i.widgetId==='energy'))home.items.push({id:'energy-main',widgetId:'energy',entityId:'',height:340});
            if(home.id==='home' && ['天气','主页'].includes(home.name)){home.name='主页';home.icon='⌂';}
          }
          entry.energySampleVersion=2;
        }
        if(entry.presentationVersion!==6){
          const defaults=defaultSidebar();
          for(const config of [entry.draft,entry.published])for(const widget of config.widgets){
            const sample=defaults.widgets.find(w=>w.id===widget.id);
            if(sample && ['weather','energy'].includes(widget.id)){widget.html=sample.html;widget.css=sample.css;widget.js=sample.js;}
          }
          entry.presentationVersion=6;
        }
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
        draft: defaultSidebar(),
        published: defaultSidebar(),
      },
    );
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
  const check = (req) => {
    if (!projects.getProject(req.params.project))
      throw Object.assign(new Error("项目不存在"), { statusCode: 404 });
  };
  app.get("/api/sidebar/:project", async (req) => {
    check(req);
    return store.get(req.params.project);
  });
  for (const action of ["draft", "publish"])
    app.put(
      `/api/sidebar/:project/${action}`,
      { bodyLimit: 1024 * 1024 },
      async (req) => {
        check(req);
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
          req.params.project,
          req.body ?? {},
          action === "publish",
        );
        onChange();
        return result;
      },
    );
}
