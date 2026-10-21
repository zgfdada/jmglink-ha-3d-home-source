import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import Fastify from "fastify";
import { DevicePlatformStore } from "../apps/server/src/device-platform/DevicePlatformStore.js";
import { registerDevicePlatformRoutes } from "../apps/server/src/routes/devicePlatformRoutes.js";

test("N10 seven-step project survives export, second-install rematch and immutable release", async () => {
  const temporary = await mkdtemp(path.join(tmpdir(), "ha3d-n10-"));
  const apps = [];
  try {
    const stores = await Promise.all(
      ["first", "second"].map((name) =>
        DevicePlatformStore.create(
          path.join(temporary, name, "data"),
          path.join(temporary, name, "assets"),
        ),
      ),
    );
    const haFor = (suffix) => ({
      getDevices: () => [{ id: `washer-${suffix}`, name: "测试洗衣机" }],
      getEntities: () => [
        {
          deviceId: `washer-${suffix}`,
          entityId: `select.program_${suffix}`,
          domain: "select",
          state: "standard",
          attributes: { options: ["standard", "quick"] },
        },
        {
          deviceId: `washer-${suffix}`,
          entityId: `switch.power_${suffix}`,
          domain: "switch",
          state: "off",
          attributes: {},
        },
      ],
      getStatus: () => ({ connected: true, mock: false }),
      performAction: () => {
        throw new Error("N10 simulation must not operate a real device");
      },
    });
    for (const [index, store] of stores.entries()) {
      const app = Fastify();
      apps.push(app);
      await registerDevicePlatformRoutes(app, store, haFor(index + 1));
    }
    const request = async (app, method, url, payload) => {
      const response = await app.inject({ method, url, payload });
      assert.equal(response.statusCode, 200, `${method} ${url}: ${response.body}`);
      return response.json();
    };
    const [first, second] = apps;
    const projectId = "custom.n10-washer";
    const base = `/api/device-platform/projects/${projectId}`;
    await request(first, "PUT", `/api/device-platform/device-templates/${projectId}`, {
      id: projectId,
      name: "测试洗衣机",
      category: "appliance",
      manufacturer: "测试厂商",
      model: "N10",
    });
    await request(first, "POST", `${base}/rebind`, {
      deviceId: "washer-1",
      selectedEntityIds: ["select.program_1", "switch.power_1"],
    });
    const capabilities = [
      {
        capabilityId: "program",
        name: "模式选择",
        kind: "enum",
        dataType: "enum",
        access: "read-write",
        enumValues: [
          { value: "standard", label: "标准", source: "ha", status: "valid" },
          { value: "quick", label: "速洗", source: "ha", status: "valid" },
        ],
      },
      {
        capabilityId: "power",
        name: "电源",
        kind: "toggle",
        dataType: "boolean",
        access: "read-write",
      },
    ];
    await request(first, "PUT", `${base}/capabilities`, {
      capabilities,
      mappings: {
        program: { entityId: "select.program_1", attribute: "state" },
        power: { entityId: "switch.power_1", attribute: "state" },
      },
    });
    const model = stores[0].getModelTemplates().find((item) => item.id === "custom.water-purifier");
    assert.ok(model);
    await request(first, "PUT", `${base}/runtime-display`, {
      runtimeDisplay: {
        statusCapabilityId: "program",
        runningStates: ["quick"],
        titleTemplate: "{device.name}",
        idleTemplate: "待机",
        runningTemplate: "正在运行：{模式选择}",
      },
    });
    await request(first, "PUT", `${base}/appearance`, {
      modelTemplateId: model.id,
      appearance: {
        dimensions: { width: 0.6, depth: 0.6, height: 0.9 },
        animation: { statusCapabilityId: "program", activeStates: ["quick"] },
      },
    });
    await request(first, "PUT", `${base}/control-panel`, {
      panel: {
        name: "洗衣机面板",
        sections: [{
          id: "main",
          title: "控制",
          controls: [{
            id: "power-control",
            type: "toggle",
            label: "电源",
            capabilityId: "power",
            grid: { x: 0, y: 0, w: 2 },
          }],
        }],
      },
    });
    const diagnostics = await request(first, "GET", `${base}/diagnostics`);
    assert.equal(diagnostics.publishBlocked, false);
    await request(first, "POST", `${base}/test-complete`, { mode: "simulation" });
    await request(first, "PUT", `${base}/release-draft`, {
      version: "1.0.0",
      channel: "internal",
      visibility: "private",
    });
    await request(first, "POST", `${base}/publish`, { confirmWarnings: true });
    const exported = await request(first, "GET", `${base}/package?version=1.0.0`);
    assert.equal(exported.manifest.requiresHaRematch, true);
    assert.equal(JSON.stringify(exported).includes("select.program_1"), false);
    const imported = await request(second, "POST", "/api/device-platform/projects/import-package", exported);
    const importedBase = `/api/device-platform/projects/${imported.projectId}`;
    assert.equal(stores[1].getBindings().some((item) => item.deviceTemplateId === imported.projectId), false);
    await request(second, "POST", `${importedBase}/rebind`, {
      deviceId: "washer-2",
      selectedEntityIds: ["select.program_2", "switch.power_2"],
    });
    await request(second, "PUT", `${importedBase}/capabilities`, {
      capabilities,
      mappings: {
        program: { entityId: "select.program_2", attribute: "state" },
        power: { entityId: "switch.power_2", attribute: "state" },
      },
    });
    const rematched = await request(second, "GET", `${importedBase}/capability-validation`);
    assert.equal(rematched.publishBlocked, false);
    const release = await request(first, "GET", `${base}/release/1.0.0`);
    await request(first, "PUT", `/api/device-platform/device-templates/${projectId}`, {
      ...stores[0].getDeviceTemplates().find((item) => item.id === projectId),
      name: "洗衣机新草稿",
    });
    const lifecycle = await request(first, "GET", `${base}/release`);
    assert.equal(lifecycle.draft.version, "1.0.1");
    assert.equal((await request(first, "GET", `${base}/release/1.0.0`)).project.name, release.project.name);
    assert.equal(release.project.name, "测试洗衣机");
  } finally {
    await Promise.all(apps.map((app) => app.close()));
    await rm(temporary, { recursive: true, force: true });
  }
});
