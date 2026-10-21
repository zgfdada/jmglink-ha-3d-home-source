import { mkdir, readFile, writeFile, rename, copyFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import {
  builtinControls,
  normalizeLibraryControl,
  normalizeLibraryPackage,
  CONTROL_PACKAGE_FORMAT,
  builtinControlId,
} from "../../../../packages/schema/src/control-library.js";
export class ControlLibraryStore {
  constructor(directory, items, platform) {
    this.file = path.join(directory, "control-library.json");
    this.items = items;
    this.platform = platform;
    this.queue = Promise.resolve();
    this.previous = {};
  }
  static async create(directory, platform) {
    await mkdir(directory, { recursive: true });
    let items,
      previous = {};
    try {
      const saved = JSON.parse(
        await readFile(path.join(directory, "control-library.json"), "utf8"),
      );
      items = normalizeLibraryPackage(saved);
      for (const [id, raw] of Object.entries(saved.previous || {})) {
        if (items.some((item) => item.id === id))
          previous[id] = normalizeLibraryControl(raw);
      }
    } catch (error) {
      if (error.code !== "ENOENT")
        throw new Error(`控件库数据读取失败：${error.message}`);
      items = builtinControls().map(normalizeLibraryControl);
    }
    const store = new ControlLibraryStore(directory, items, platform);
    store.previous = previous;
    await store.persist(items);
    return store;
  }
  list() {
    return structuredClone(this.items);
  }
  references(id) {
    return (this.platform?.getControlPanels() || []).flatMap((panel) =>
      panel.sections.flatMap((section) =>
        section.controls
          .filter((c) => (c.libraryControlId || builtinControlId(c)) === id)
          .map((c) => ({
            panelId: panel.id,
            panelName: panel.name,
            controlId: c.id,
            label: c.label,
            version:
              c.libraryControlVersion || c.libraryDefinition?.version || 1,
          })),
      ),
    );
  }
  export() {
    return {
      format: CONTROL_PACKAGE_FORMAT,
      schemaVersion: 1,
      controls: this.list(),
    };
  }
  async persist(items) {
    const tmp = `${this.file}.tmp`;
    await writeFile(
      tmp,
      JSON.stringify(
        {
          format: CONTROL_PACKAGE_FORMAT,
          schemaVersion: 1,
          controls: items,
          previous: this.previous,
        },
        null,
        2,
      ),
      "utf8",
    );
    try {
      await copyFile(this.file, `${this.file}.bak`);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    await rename(tmp, this.file);
  }
  mutate(fn) {
    const next = this.queue
      .catch(() => {})
      .then(async () => {
        const items = this.list();
        const before = structuredClone(this.previous);
        let result;
        try {
          result = fn(items);
          if (items.length > 500) throw Error("控件库最多保存 500 个控件");
          await this.persist(items);
        } catch (error) {
          this.previous = before;
          throw error;
        }
        this.items = items;
        return structuredClone(result);
      });
    this.queue = next;
    return next;
  }
  create(raw) {
    const item = normalizeLibraryControl(raw);
    if (item.id.startsWith("builtin."))
      throw Error("新控件请使用 custom. 前缀");
    return this.mutate((items) => {
      if (items.some((c) => c.id === item.id)) throw Error("控件 ID 已存在");
      items.push({ ...item, version: 1 });
      return items.at(-1);
    });
  }
  update(id, raw) {
    return this.mutate((items) => {
      const index = items.findIndex((c) => c.id === id);
      if (index < 0) throw Error("控件不存在");
      if (raw.id && raw.id !== id) throw Error("控件 ID 不可修改");
      const next = normalizeLibraryControl({
        ...raw,
        id,
        version: items[index].version + 1,
      });
      this.previous[id] = structuredClone(items[index]);
      items[index] = next;
      return next;
    });
  }
  rollback(id) {
    return this.mutate((items) => {
      const index = items.findIndex((item) => item.id === id);
      if (index < 0) throw Error("控件不存在");
      if (!this.previous[id]) throw Error("没有可回退的上一版");
      const current = items[index];
      items[index] = normalizeLibraryControl({
        ...this.previous[id],
        id,
        version: current.version + 1,
      });
      this.previous[id] = structuredClone(current);
      return items[index];
    });
  }
  remove(id, confirmed = false) {
    return this.mutate((items) => {
      const index = items.findIndex((c) => c.id === id);
      if (index < 0) throw Error("控件不存在");
      if (this.references(id).length && !confirmed)
        throw Error("该控件正在使用，确认删除后已有面板仍使用版本快照");
      delete this.previous[id];
      return items.splice(index, 1)[0];
    });
  }
  import(bundle) {
    const incoming = normalizeLibraryPackage(bundle);
    return this.mutate((items) => {
      const result = incoming.map((raw) => {
        const id = `custom.import-${randomUUID()}`;
        return normalizeLibraryControl({
          ...raw,
          id,
          version: 1,
          builtin: false,
        });
      });
      items.push(...result);
      return result;
    });
  }
  restore(bundle) {
    const controls = normalizeLibraryPackage(bundle);
    return this.mutate((items) => {
      this.previous = {};
      items.splice(0, items.length, ...controls);
      return controls;
    });
  }
}
export async function registerControlLibraryRoutes(app, store) {
  const route = (handler) => async (req, reply) => {
    try {
      return await handler(req, reply);
    } catch (error) {
      return reply
        .code(error.message.includes("不存在") ? 404 : 400)
        .send({ error: error.message });
    }
  };
  app.get("/api/control-library", async () => ({
    controls: store
      .list()
      .map((item) => ({ ...item, references: store.references(item.id) })),
  }));
  app.get("/api/control-library/export", async () => store.export());
  app.post(
    "/api/control-library/import",
    { bodyLimit: 2 * 1024 * 1024 },
    route(async (req) => ({ controls: await store.import(req.body) })),
  );
  app.post(
    "/api/control-library",
    { bodyLimit: 70 * 1024 },
    route(async (req) => ({ item: await store.create(req.body) })),
  );
  app.get(
    "/api/control-library/:id",
    route(async (req) => {
      const item = store.list().find((item) => item.id === req.params.id);
      if (!item) throw Error("控件不存在");
      return { item, references: store.references(item.id) };
    }),
  );
  app.put(
    "/api/control-library/:id",
    { bodyLimit: 70 * 1024 },
    route(async (req) => ({
      item: await store.update(req.params.id, req.body),
    })),
  );
  app.post(
    "/api/control-library/:id/rollback",
    route(async (req) => ({ item: await store.rollback(req.params.id) })),
  );
  app.delete(
    "/api/control-library/:id",
    route(async (req) => ({
      item: await store.remove(req.params.id, req.query.confirm === "true"),
    })),
  );
}
