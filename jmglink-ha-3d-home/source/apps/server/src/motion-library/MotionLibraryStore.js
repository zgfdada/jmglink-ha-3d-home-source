import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import {
  builtinMotionResources,
  normalizeMotionResource,
  normalizeMotionLibraryPackage,
  MOTION_RESOURCE_FORMAT,
} from "../../../../packages/schema/src/motion-library.js";

export class MotionLibraryStore {
  constructor(file, resources, revision = 0) {
    this.file = file;
    this.resources = resources;
    this.revision = revision;
    this.queue = Promise.resolve();
  }
  static async create(dataDir) {
    await mkdir(dataDir, { recursive: true });
    let resources = [],
      revision = 0;
    const file = path.join(dataDir, "motion-library.json");
    try {
      const saved = JSON.parse(await readFile(file, "utf8"));
      resources = normalizeMotionLibraryPackage(saved);
      revision = Number.isInteger(saved.revision) ? saved.revision : 0;
    } catch (error) {
      if (error.code !== "ENOENT")
        throw Error(`动效库读取失败：${error.message}`);
    }
    return new MotionLibraryStore(file, resources, revision);
  }
  list() {
    const items = new Map(builtinMotionResources().map((b) => [b.id, b]));
    for (const item of this.resources) items.set(item.id, item);
    return structuredClone([...items.values()]);
  }
  export() {
    return {
      format: MOTION_RESOURCE_FORMAT,
      schemaVersion: 1,
      resources: this.list(),
    };
  }
  async mutate(expected, change) {
    const run = this.queue.then(async () => {
      if (expected !== undefined && expected !== this.revision)
        throw Object.assign(Error("动效库已被更新，请重新加载后再保存"), {
          statusCode: 409,
        });
      const next = structuredClone(this.resources),
        result = change(next);
      await writeFile(
        `${this.file}.tmp`,
        JSON.stringify(
          {
            format: MOTION_RESOURCE_FORMAT,
            schemaVersion: 1,
            revision: this.revision + 1,
            resources: next,
          },
          null,
          2,
        ),
      );
      await rename(`${this.file}.tmp`, this.file);
      this.resources = next;
      this.revision++;
      return result;
    });
    this.queue = run.catch(() => {});
    return run;
  }
  async save(raw, id, expected) {
    return this.mutate(expected, (items) => {
      const previous = id ? this.list().find((r) => r.id === id) : null;
      if (id && !previous)
        throw Object.assign(Error("动效资源不存在"), { statusCode: 404 });
      if (!id && items.filter((r) => !r.builtin).length >= 291)
        throw Error("自定义动效资源最多 291 项");
      const item = normalizeMotionResource({
        ...raw,
        id: previous?.id ?? `custom.motion.${randomUUID()}`,
        version: (previous?.version ?? 0) + 1,
      });
      if (previous?.builtin && item.effect.type !== previous.effect.type)
        throw Error("内置动效类型不可更改");
      const index = items.findIndex((r) => r.id === item.id);
      if (index < 0) items.push(item);
      else items[index] = item;
      return item;
    });
  }
  async remove(id, expected) {
    return this.mutate(expected, (items) => {
      const current = this.list().find((r) => r.id === id);
      if (!current)
        throw Object.assign(Error("动效资源不存在"), { statusCode: 404 });
      if (current.builtin) throw Error("内置动效不可删除，请使用恢复默认");
      const index = items.findIndex((r) => r.id === id);
      items.splice(index, 1);
      return { ok: true };
    });
  }
  async reset(id, expected) {
    return this.mutate(expected, (items) => {
      if (!builtinMotionResources().some((r) => r.id === id))
        throw Error("仅内置动效可以恢复默认");
      const index = items.findIndex((r) => r.id === id);
      if (index >= 0) items.splice(index, 1);
      return builtinMotionResources().find((r) => r.id === id);
    });
  }
  async restore(bundle) {
    const resources = normalizeMotionLibraryPackage(bundle);
    return this.mutate(undefined, (items) => {
      items.splice(0, items.length, ...resources);
    });
  }
}
export async function registerMotionLibraryRoutes(app, store) {
  const wrap = (handler) => async (req, reply) => {
    try {
      return await handler(req);
    } catch (error) {
      return reply.code(error.statusCode ?? 400).send({ error: error.message });
    }
  };
  app.get("/api/motion-library", async () => ({
    resources: store.list(),
    revision: store.revision,
  }));
  app.post(
    "/api/motion-library",
    { bodyLimit: 70 * 1024 },
    wrap(async (req) => ({
      item: await store.save(
        req.body.resource,
        undefined,
        req.body.expectedRevision,
      ),
      revision: store.revision,
    })),
  );
  app.put(
    "/api/motion-library/:id",
    { bodyLimit: 70 * 1024 },
    wrap(async (req) => ({
      item: await store.save(
        req.body.resource,
        req.params.id,
        req.body.expectedRevision,
      ),
      revision: store.revision,
    })),
  );
  app.delete(
    "/api/motion-library/:id",
    wrap(async (req) => ({
      ...(await store.remove(req.params.id, req.body?.expectedRevision)),
      revision: store.revision,
    })),
  );
  app.post(
    "/api/motion-library/:id/reset",
    wrap(async (req) => ({
      item: await store.reset(req.params.id, req.body?.expectedRevision),
      revision: store.revision,
    })),
  );
}
