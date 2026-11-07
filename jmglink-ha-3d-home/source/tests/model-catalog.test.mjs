import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { DevicePlatformStore } from "../apps/server/src/device-platform/DevicePlatformStore.js";
import {
  normalizeModelTemplate,
  builtinModelTemplates,
} from "../apps/server/src/device-platform/devicePlatformSchema.js";
import {
  deduplicateInstanceModels,
  materializeModels,
  rewriteImportedModelUrls,
} from "../apps/server/src/device-platform/model-catalog.js";

const model = (id, extra = {}) =>
  normalizeModelTemplate({
    id,
    name: "同名模型",
    source: { type: "procedural", shape: "box" },
    ...extra,
  });
const instance = (models) => ({
  projects: [],
  deviceHistory: { projectReleases: [] },
  sidebars: {},
  devicePlatform: {
    modelCatalogVersion: 1,
    modelTemplates: models,
    assets: [],
    bindings: [],
    deviceTemplates: [],
  },
});

test("legacy default models become editable persisted models, deletions survive restart and export/import", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "ha3d-catalog-"));
  try {
    let store = await DevicePlatformStore.create(dir, path.join(dir, "assets"));
    const original = store
      .getModelTemplates()
      .find((m) => m.id === "builtin.cinema.projector");
    assert.equal(original.builtin, false);
    await store.upsertModelTemplate({ ...original, color: "#123456" });
    await store.delete("model", original.id);
    await store.delete("model", "custom.wifi-router");
    store = await DevicePlatformStore.create(dir, path.join(dir, "assets"));
    assert.ok(
      !store
        .getModelTemplates()
        .some((m) => [original.id, "custom.wifi-router"].includes(m.id)),
    );
    const bundle = await store.exportBundle();
    await store.importBundle(bundle);
    assert.ok(!store.getModelTemplates().some((m) => m.id === original.id));
    assert.ok(store.getModelTemplates().every((m) => !m.builtin));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("identical contents merge to the used ID and rewrite scene, bindings and release snapshots idempotently", () => {
  const value = instance([
    model("custom.copy"),
    model("custom.used"),
    model("custom.changed", { color: "#000000" }),
  ]);
  value.projects = [
    {
      floors: [
        {
          furniture: [
            { modelId: "custom.used" },
            { modelId: "custom.copy", customModel: { id: "custom.copy" } },
          ],
        },
      ],
    },
  ];
  value.devicePlatform.bindings = [{ modelTemplateId: "custom.used" }];
  value.deviceHistory.projectReleases = [
    {
      snapshot: {
        model: { id: "custom.copy" },
        project: { modelTemplateId: "custom.copy" },
      },
    },
  ];
  const result = deduplicateInstanceModels(value);
  assert.deepEqual(result.merged, [{ from: "custom.copy", to: "custom.used" }]);
  assert.equal(
    value.deviceHistory.projectReleases[0].snapshot.model.id,
    "custom.used",
  );
  assert.equal(
    value.projects[0].floors[0].furniture[1].customModel.id,
    "custom.used",
  );
  assert.equal(value.devicePlatform.modelTemplates.length, 2);
  assert.deepEqual(deduplicateInstanceModels(value).merged, []);
});

test("uploaded files merge only with matching bytes and metadata, renamed files are supported", () => {
  const upload = (id) =>
    model(id, {
      source: {
        type: "upload",
        url: `./${id}.glb`,
        fileName: `${id}.glb`,
        mimeType: "model/gltf-binary",
      },
    });
  const value = instance([
    upload("custom.aa"),
    upload("custom.bb"),
    upload("custom.cc"),
  ]);
  value.devicePlatform.assets = value.devicePlatform.modelTemplates.map(
    (m, i) => ({
      modelTemplateId: m.id,
      dataBase64: Buffer.from(i === 2 ? "different" : "same").toString(
        "base64",
      ),
    }),
  );
  assert.equal(deduplicateInstanceModels(value).merged.length, 1);
  assert.equal(value.devicePlatform.assets.length, 2);
  const missing = instance([upload("custom.aa"), upload("custom.bb")]);
  assert.equal(deduplicateInstanceModels(missing).merged.length, 0);
});

test("legacy backup adds defaults once, respects deletions, then merges custom/default equivalents", () => {
  const original = builtinModelTemplates().find(
    (m) => m.id === "builtin.cinema.speaker",
  );
  const value = instance([
    { ...original, id: "custom.speaker", builtin: false },
  ]);
  delete value.devicePlatform.modelCatalogVersion;
  value.devicePlatform.suppressedBuiltinIds = ["model:builtin.cinema.screen"];
  deduplicateInstanceModels(value);
  assert.equal(
    value.devicePlatform.modelTemplates.filter(
      (m) => m.source.shape === "cinema_speaker" && m.dimensions.width === 0.18,
    ).length,
    1,
  );
  assert.ok(
    !value.devicePlatform.modelTemplates.some(
      (m) => m.id === "builtin.cinema.screen",
    ),
  );
});

test("same-ID conflicts reject rather than silently overwriting and exact repeats collapse", () => {
  assert.throws(
    () =>
      materializeModels([
        model("custom.aa"),
        model("custom.aa", { color: "#000000" }),
      ]),
    /冲突/,
  );
  assert.equal(
    materializeModels([model("custom.aa"), model("custom.aa")]).length,
    1,
  );
  assert.throws(() => materializeModels([model("builtin.unknown")]), /ID/);
});

test("conflicting asset IDs fail before any reference is rewritten", () => {
  const value = instance([model("custom.aa")]);
  value.devicePlatform.assets = [
    { modelTemplateId: "custom.aa", dataBase64: "YQ==" },
    { modelTemplateId: "custom.aa", dataBase64: "Yg==" },
  ];
  assert.throws(() => deduplicateInstanceModels(value), /冲突/);
});

test("restored filenames also update inline scene and history model URLs", () => {
  const value = instance([
    model("custom.aa", { source: { type: "upload", url: "./old.glb" } }),
  ]);
  value.projects = [
    { customModel: { id: "custom.aa", source: { url: "./old.glb" } } },
  ];
  value.deviceHistory.projectReleases = [
    { snapshot: { model: { id: "custom.aa", source: { url: "./old.glb" } } } },
  ];
  rewriteImportedModelUrls(value, [
    {
      id: "custom.aa",
      source: { url: "./api/device-platform/model-files/custom_aa.glb" },
    },
  ]);
  assert.equal(
    value.projects[0].customModel.source.url,
    "./api/device-platform/model-files/custom_aa.glb",
  );
  assert.equal(
    value.deviceHistory.projectReleases[0].snapshot.model.source.url,
    value.projects[0].customModel.source.url,
  );
});
