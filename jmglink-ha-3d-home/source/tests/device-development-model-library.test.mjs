import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import Fastify from "fastify";
import {
  buildModelCards,
  createModelDraft,
  filterModelCards,
  modelReferenceCount,
} from "../apps/web/src/app/device-development-center/model-library.js";
import { normalizeModelTemplate } from "../apps/server/src/device-platform/devicePlatformSchema.js";
import { DevicePlatformStore } from "../apps/server/src/device-platform/DevicePlatformStore.js";
import { resolveInstalledModelVersion } from "../apps/server/src/model-library/GiteaModelLibrary.js";
import { registerDevicePlatformRoutes } from "../apps/server/src/routes/devicePlatformRoutes.js";

test("N2 combines local and online models without mixing their identities", () => {
  const platform = {
    modelTemplates: [{ id: "custom.washer", name: "洗衣机", tags: ["家电"] }],
  };
  const cards = buildModelCards(platform, [
    {
      id: "custom.washer",
      name: "网络洗衣机",
      author: "Alice",
      tags: ["家电"],
    },
  ]);
  assert.deepEqual(
    cards.map((card) => card.key),
    ["local:custom.washer", "online:custom.washer"],
  );
  assert.equal(filterModelCards(cards, { filter: "local" }).length, 1);
  assert.equal(filterModelCards(cards, { filter: "online" }).length, 1);
  assert.deepEqual(
    filterModelCards(cards, {
      filter: "favorites",
      favorites: ["online:custom.washer"],
    }).map((card) => card.key),
    ["online:custom.washer"],
  );
  assert.equal(filterModelCards(cards, { query: "alice" }).length, 1);
  assert.equal(filterModelCards(cards, { query: "家电" }).length, 2);
});

test("N2 model draft and normalized metadata preserve immutable-style IDs, tags and furniture kind", () => {
  const draft = createModelDraft();
  assert.match(draft.id, /^custom\.model-/);
  const normalized = normalizeModelTemplate({
    ...draft,
    name: "餐桌",
    source: { type: "procedural", shape: "box" },
    furnitureEnabled: true,
    furnitureKind: "table",
    tags: ["桌子", "客厅", "桌子"],
  });
  assert.equal(normalized.furnitureEnabled, true);
  assert.equal(normalized.furnitureKind, "table");
  assert.deepEqual(normalized.tags, ["桌子", "客厅"]);
  assert.equal(
    modelReferenceCount(
      {
        bindings: [{ modelTemplateId: normalized.id }],
        deviceTemplates: [{ modelTemplateId: normalized.id }],
      },
      normalized.id,
    ),
    2,
  );
});

test("N2 store allows one referenced model to serve devices and furniture together", async () => {
  const temporary = await mkdtemp(path.join(tmpdir(), "ha3d-n2-model-"));
  try {
    const store = await DevicePlatformStore.create(
      path.join(temporary, "data"),
      path.join(temporary, "assets"),
    );
    const model = {
      id: "custom.n2-sample",
      name: "示例模型",
      source: { type: "procedural", shape: "box" },
    };
    await store.upsertModelTemplate(model);
    await store.upsertDeviceTemplate({
      id: "custom.n2-device",
      name: "设备",
      modelTemplateId: model.id,
    });
    await store.upsertModelTemplate({ ...model, furnitureEnabled: true });
    assert.equal(
      store.getModelTemplates().find((item) => item.id === model.id)
        .furnitureEnabled,
      true,
    );
    assert.equal(
      store.getDeviceTemplates().find((item) => item.id === "custom.n2-device")
        .modelTemplateId,
      model.id,
    );
    await store.upsertModelTemplate({ ...model, furnitureEnabled: false });
    assert.equal(
      store.getDeviceTemplates().find((item) => item.id === "custom.n2-device")
        .modelTemplateId,
      model.id,
    );
    await assert.rejects(store.delete("model", model.id), /项目引用/);
    await store.delete("model", model.id, { unlinkReferences: true });
    assert.equal(
      store.getDeviceTemplates().find((item) => item.id === "custom.n2-device")
        .modelTemplateId,
      model.id,
    );
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

test("N2 online install reuses identical hash and preserves changed hash as a new version", () => {
  const existing = [
    {
      id: "custom.library-chair",
      library: {
        repository: "owner/repo",
        id: "chair",
        sha256: "a".repeat(64),
      },
    },
  ];
  assert.equal(
    resolveInstalledModelVersion(
      existing,
      "owner/repo",
      "chair",
      "a".repeat(64),
    ).reused.id,
    "custom.library-chair",
  );
  assert.equal(
    resolveInstalledModelVersion(
      existing,
      "owner/repo",
      "chair",
      "b".repeat(64),
    ).id,
    "custom.library-chair-bbbbbbbb",
  );
  assert.equal(
    resolveInstalledModelVersion([], "owner/repo", "chair", "a".repeat(64)).id,
    "custom.library-chair",
  );
});

test("N2 model API saves metadata and blocks referenced deletion unless explicitly forced", async () => {
  const temporary = await mkdtemp(path.join(tmpdir(), "ha3d-n2-api-"));
  const app = Fastify();
  try {
    const store = await DevicePlatformStore.create(
      path.join(temporary, "data"),
      path.join(temporary, "assets"),
    );
    await registerDevicePlatformRoutes(app, store, {
      getDevices: () => [],
      getEntities: () => [],
    });
    const putModel = await app.inject({
      method: "PUT",
      url: "/api/device-platform/model-templates/custom.n2-api",
      payload: {
        model: {
          id: "custom.n2-api",
          name: "API 模型",
          source: { type: "procedural", shape: "box" },
          tags: ["N2"],
        },
      },
    });
    assert.equal(putModel.statusCode, 200);
    assert.deepEqual(putModel.json().item.tags, ["N2"]);
    const glb = Buffer.alloc(1_100_000);
    glb.write("glTF");
    const uploaded = await app.inject({
      method: "PUT",
      url: "/api/device-platform/model-templates/custom.n2-upload",
      payload: {
        model: {
          id: "custom.n2-upload",
          name: "上传模型",
          source: { type: "upload" },
        },
        file: {
          name: "model.glb",
          dataUrl: `data:model/gltf-binary;base64,${glb.toString("base64")}`,
        },
      },
    });
    assert.equal(
      uploaded.statusCode,
      200,
      "模型上传 API 应支持超过 Fastify 默认 1 MB 的文件",
    );
    const putProject = await app.inject({
      method: "PUT",
      url: "/api/device-platform/device-templates/custom.n2-project",
      payload: {
        id: "custom.n2-project",
        name: "项目",
        modelTemplateId: "custom.n2-api",
      },
    });
    assert.equal(putProject.statusCode, 200);
    const dualPurpose = await app.inject({
      method: "PUT",
      url: "/api/device-platform/model-templates/custom.n2-api",
      payload: {
        model: {
          id: "custom.n2-api",
          name: "API 模型",
          source: { type: "procedural", shape: "box" },
          furnitureEnabled: true,
        },
      },
    });
    assert.equal(dualPurpose.statusCode, 200);
    assert.equal(dualPurpose.json().item.furnitureEnabled, true);
    assert.equal(
      store.getDeviceTemplates().find((item) => item.id === "custom.n2-project")
        .modelTemplateId,
      "custom.n2-api",
    );
    const blocked = await app.inject({
      method: "DELETE",
      url: "/api/device-platform/model-templates/custom.n2-api",
    });
    assert.equal(blocked.statusCode, 400);
    assert.match(blocked.json().error, /项目引用/);
    const forced = await app.inject({
      method: "DELETE",
      url: "/api/device-platform/model-templates/custom.n2-api?unlink=true",
    });
    assert.equal(forced.statusCode, 200);
    const snapshot = await app.inject({
      method: "GET",
      url: "/api/device-platform",
    });
    assert.equal(
      snapshot
        .json()
        .deviceTemplates.find((item) => item.id === "custom.n2-project")
        .modelTemplateId,
      "custom.n2-api",
    );
  } finally {
    await app.close();
    await rm(temporary, { recursive: true, force: true });
  }
});
