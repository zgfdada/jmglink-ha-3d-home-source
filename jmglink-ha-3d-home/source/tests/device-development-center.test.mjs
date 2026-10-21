import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  buildCustomDeviceProjects,
  createDeviceProjectId,
  createDeviceProjectPayload,
  filterDeviceProjects,
  projectVisualKind,
  resolveProjectHealth,
} from "../apps/web/src/app/device-development-center/project-home.js";

const fixtureDevices = [
  {
    id: "washer-1",
    name: "波轮洗衣机",
    manufacturer: "Midea",
    model: "TB12U2",
    deviceTemplateName: "洗衣机",
    deviceTemplateId: "builtin.washing-machine",
    entityIds: ["switch.washer"],
    entities: [{ entityId: "switch.washer", state: "on" }],
    capabilityBindings: { power: ["switch.washer"] },
    modelTemplateId: "builtin.washing-machine",
    controlPanelTemplateId: "builtin.washing-machine",
  },
  {
    id: "light-1",
    name: "餐厅主灯",
    manufacturer: "Yeelight",
    model: "YLXD013",
    deviceTemplateName: "通用设备",
    entityIds: ["light.dining"],
    entities: [{ entityId: "light.dining", state: "unavailable" }],
    historical: true,
  },
];

const fixturePlatform = {
  deviceTemplates: [
    {
      id: "custom.washer",
      name: "波轮洗衣机项目",
      builtin: false,
      description: "顶开式洗衣机",
      version: 1,
      capabilities: [{ capabilityId: "power" }],
      matchRules: { manufacturers: ["Midea"], models: ["TB12U2"] },
    },
    { id: "builtin.generic", name: "通用设备", builtin: true },
  ],
  bindings: [
    {
      deviceId: "washer-1",
      deviceTemplateId: "custom.washer",
      capabilityBindings: { power: ["switch.washer"] },
      modelTemplateId: "custom.washer-model",
    },
  ],
  modelTemplates: [
    {
      id: "custom.washer-model",
      name: "顶开式洗衣机模型",
      deviceTemplateId: "custom.washer",
    },
  ],
  controlPanels: [],
};

test("next device project search matches name, model, manufacturer and template", () => {
  const projects = buildCustomDeviceProjects(fixturePlatform, fixtureDevices);
  assert.equal(projects.length, 1, "builtin templates and unconfigured HA devices stay out");
  assert.deepEqual(
    filterDeviceProjects(projects, "tb12").map((item) => item.id),
    ["custom.washer"],
  );
  assert.deepEqual(
    filterDeviceProjects(projects, "MIDEA").map((item) => item.id),
    ["custom.washer"],
  );
  assert.equal(filterDeviceProjects(projects, "").length, 1);
});

test("next device project cards distinguish online and offline HA devices", () => {
  const [online] = buildCustomDeviceProjects(fixturePlatform, fixtureDevices);
  assert.deepEqual(resolveProjectHealth(online), {
    id: "online",
    label: "HA 在线",
    severity: "success",
  });
  const [offline] = buildCustomDeviceProjects(fixturePlatform, [
    { ...fixtureDevices[0], historical: true, entities: [] },
  ]);
  assert.deepEqual(resolveProjectHealth(offline), {
    id: "offline",
    label: "HA 离线",
    severity: "warning",
  });
});

test("new projects create a custom project instead of a HA device binding", () => {
  assert.equal(createDeviceProjectId(1234), "custom.device-project-ya");
  const project = createDeviceProjectPayload({
    id: "custom.device-project-test",
    name: " 测试项目 ",
    description: " 独立项目 ",
  });
  assert.equal(project.name, "测试项目");
  assert.equal(project.description, "独立项目");
  assert.deepEqual(project.capabilities, []);
  assert.deepEqual(project.matchRules.manufacturers, []);
  assert.equal("deviceId" in project, false);
});

test("device project visuals remain presentation-only", () => {
  assert.equal(projectVisualKind(fixtureDevices[0]), "washer");
  assert.equal(projectVisualKind(fixtureDevices[1]), "light");
  assert.equal(projectVisualKind({ name: "未知设备" }), "generic");
});

test("device center has a single new entry and keeps its project actions", async () => {
  const [app, homeView, nextCss, nextIndex, furniture] = await Promise.all([
    readFile(new URL("../apps/web/src/app/app.js", import.meta.url), "utf8"),
    readFile(
      new URL("../apps/web/src/app/home-view.js", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL(
        "../apps/web/src/styles/device-development-center.css",
        import.meta.url,
      ),
      "utf8",
    ),
    readFile(
      new URL(
        "../apps/web/src/app/device-development-center/index.jsx",
        import.meta.url,
      ),
      "utf8",
    ),
    readFile(new URL("../apps/web/src/app/custom-furniture-library.jsx", import.meta.url), "utf8"),
  ]);
  assert.doesNotMatch(app, /device-platform-center\.jsx|legacyDeviceCenter|device-platform\.css/);
  assert.match(app, /import\("\.\/device-development-center\/index\.jsx"\)/);
  assert.match(
    app,
    /onOpenDeviceDevelopmentCenter: \(\) => setNextCenterOpen\(!0\)/,
  );
  assert.match(homeView, /children: "开发中心"/);
  assert.doesNotMatch(homeView, /children: "新版中心"|onOpenDevicePlatform/);
  assert.match(furniture, /device-development-center\/model-preview\.jsx/);
  assert.match(
    nextCss,
    /\.ddc-next-project-card:has\(\.ddc-next-card-actions details\[open\]\)/,
  );
  assert.match(nextCss, /\.ddc-next-action-menu\s*{[^}]*z-index: 32;/s);
  assert.match(nextIndex, /buildCustomDeviceProjects\(platform \?\? \{}, devices\)/);
  assert.doesNotMatch(nextIndex, /buildInitialProjectBinding/);
  assert.match(nextIndex, /device-templates\/\$\{encodeURIComponent\(project\.id\)\}/);
});
