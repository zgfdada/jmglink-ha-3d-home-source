import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import Fastify from "fastify";
import { DevicePlatformStore } from "../apps/server/src/device-platform/DevicePlatformStore.js";
import { registerDevicePlatformRoutes } from "../apps/server/src/routes/devicePlatformRoutes.js";
import { normalizePanelControl } from "../apps/server/src/device-platform/devicePlatformSchema.js";
import {
  PANEL_COMPONENTS,
  PANEL_CONTROL_VARIANTS,
  compatiblePanelCapabilities,
  createPanelControl,
  panelControlIssues,
  panelControlVariant,
  panelDisplayOptions,
  panelDropCell,
  panelStepIssues,
  placePanelControl,
  recommendedPanelComponents,
  unusedPanelCapabilities,
} from "../apps/web/src/app/device-development-center/panel-designer-model.js";
import { runtimeTemplateVariables } from "../apps/web/src/app/device-development-center/project-runtime-model.js";
import { buildCustomDeviceProjects } from "../apps/web/src/app/device-development-center/project-home.js";
import { segmentedToggleAction } from "../apps/web/src/domain/device-control-actions.js";

test("panel palette recommends controls from unused mapped capabilities", async () => {
  const capabilities = [
    {
      capabilityId: "program",
      name: "模式选择",
      kind: "enum",
      dataType: "enum",
    },
    {
      capabilityId: "power",
      name: "电源",
      kind: "toggle",
      dataType: "boolean",
    },
  ];
  assert.deepEqual(recommendedPanelComponents(capabilities[0]), ["select"]);
  assert.deepEqual(recommendedPanelComponents(capabilities[1]), [
    "toggle",
    "button",
    "status",
  ]);
  assert.deepEqual(
    unusedPanelCapabilities(capabilities, [{ capabilityId: "power" }]).map(
      (item) => item.capabilityId,
    ),
    ["program"],
  );
  assert.deepEqual(
    unusedPanelCapabilities(capabilities, [], new Set(["program"])).map(
      (item) => item.capabilityId,
    ),
    ["program"],
  );
  const editor = await readFile(
    new URL(
      "../apps/web/src/app/device-development-center/project-panel.jsx",
      import.meta.url,
    ),
    "utf8",
  );
  assert.match(editor, /当前选中控件的样式/);
  assert.match(editor, /待使用实体/);
  assert.match(editor, /控件配置/);
  assert.match(editor, /application\/x-ddc-capability-id/);
});

test("segmented power buttons request their named state and ignore redundant clicks", () => {
  assert.deepEqual(segmentedToggleAction("switch.washer", "off", true), {
    type: "turn_on",
    entityId: "switch.washer",
  });
  assert.deepEqual(segmentedToggleAction("switch.washer", "on", false), {
    type: "turn_off",
    entityId: "switch.washer",
  });
  assert.equal(segmentedToggleAction("switch.washer", "on", true), null);
  assert.equal(segmentedToggleAction("switch.washer", "off", false), null);
});

test("N5 insertion menu omits HA metadata attributes", () => {
  const variables = runtimeTemplateVariables(
    [{ capabilityId: "status", name: "运行状态", dataType: "string" }],
    { capabilityBindings: { status: ["sensor.status"] } },
    {
      entities: [
        {
          entityId: "sensor.status",
          attributes: { friendly_name: "洗衣机", device_class: "power" },
        },
      ],
    },
  );
  assert.deepEqual(
    variables.map((item) => item.token),
    ["{device.name}", "{time.now}", "{运行状态}"],
  );
});

test("project home carries its selected 3D model and project appearance", () => {
  const [project] = buildCustomDeviceProjects({
    deviceTemplates: [
      {
        id: "custom.project",
        name: "洗衣机",
        modelTemplateId: "custom.washer",
        appearance: { colorOverride: false },
      },
    ],
    modelTemplates: [
      {
        id: "custom.washer",
        name: "3D 波轮洗衣机",
        source: { type: "upload", url: "/model.glb" },
      },
    ],
    bindings: [],
    controlPanels: [],
  });
  assert.equal(project.modelTemplate.id, "custom.washer");
  assert.equal(project.appearance.colorOverride, false);
});

test("N7 grid placement snaps and keeps controls inside the four-column canvas", () => {
  const first = createPanelControl("toggle", "control-one");
  const second = createPanelControl("select", "control-two");
  const placed = placePanelControl([], first, -10, -3);
  assert.deepEqual(placed[0].grid, { x: 0, y: 0, w: 2 });
  const next = placePanelControl(placed, second, 0, 0);
  assert.equal(next.find((item) => item.id === "control-two").grid.y, 0);
  assert.equal(next.find((item) => item.id === "control-one").grid.y, 1);
  const moved = placePanelControl(next, second, 99, 0);
  assert.equal(moved.find((item) => item.id === "control-two").grid.x, 2);
  assert.equal(moved.find((item) => item.id === "control-two").grid.y, 0);
  const third = createPanelControl("select", "control-three");
  const bottom = placePanelControl(next, third, 0, 5);
  const upward = placePanelControl(bottom, third, 0, 0);
  assert.equal(upward.find((item) => item.id === "control-three").grid.y, 0);
  assert.equal(upward.find((item) => item.id === "control-two").grid.y, 1);
  assert.deepEqual(
    panelDropCell(190, 150, { left: 0, top: 62, width: 400 }, 80, 8),
    { x: 1, y: 1 },
  );
  assert.equal(
    normalizePanelControl({ type: "status", grid: { x: 3, y: 1.8, w: 4 } }).grid
      .x,
    0,
  );
  assert.equal(normalizePanelControl({ type: "divider" }).type, "divider");
  assert.equal(
    normalizePanelControl({ type: "status", variant: "badge" }).variant,
    "badge",
  );
  assert.equal(
    normalizePanelControl({ type: "status", variant: "invalid" }).variant,
    undefined,
  );
  assert.equal(
    normalizePanelControl({ type: "status", visualStyle: "soft" }).visualStyle,
    undefined,
  );
  assert.equal(
    normalizePanelControl({ type: "select", selectStyle: "grid" }).selectStyle,
    "grid",
  );
});

test("N7 every palette component offers distinct structural variants under one fixed theme", () => {
  for (const component of PANEL_COMPONENTS) {
    const choices = PANEL_CONTROL_VARIANTS[component.type];
    assert.ok(choices?.length >= 2, component.type);
    assert.equal(
      new Set(choices.map((item) => item.value)).size,
      choices.length,
    );
    const control = createPanelControl(
      component.type,
      `control-${component.type}`,
    );
    assert.equal(panelControlVariant(control), choices[0].value);
  }
  assert.equal(
    panelControlVariant({ type: "toggle", variant: "power" }),
    "power",
  );
  assert.equal(
    panelControlVariant({ type: "select", selectStyle: "grid" }),
    "grid",
  );
});

test("N7 capability compatibility and enum display overrides preserve HA values", () => {
  const capabilities = [
    { capabilityId: "power", kind: "toggle", dataType: "boolean" },
    {
      capabilityId: "program",
      kind: "enum",
      dataType: "enum",
      enumValues: [
        { value: "quick", label: "快洗" },
        { value: "normal", label: "标准" },
      ],
    },
    { capabilityId: "temperature", kind: "number", dataType: "number" },
  ];
  assert.deepEqual(
    compatiblePanelCapabilities("toggle", capabilities).map(
      (item) => item.capabilityId,
    ),
    ["power"],
  );
  assert.deepEqual(
    compatiblePanelCapabilities("button", capabilities).map(
      (item) => item.capabilityId,
    ),
    ["power"],
  );
  assert.deepEqual(
    panelControlIssues({ type: "button", capabilityId: "power" }, capabilities),
    [],
  );
  assert.deepEqual(
    compatiblePanelCapabilities("select", capabilities).map(
      (item) => item.capabilityId,
    ),
    ["program"],
  );
  assert.deepEqual(
    compatiblePanelCapabilities("slider", capabilities).map(
      (item) => item.capabilityId,
    ),
    ["temperature"],
  );
  assert.deepEqual(
    panelControlIssues({ type: "select", capabilityId: "power" }, capabilities),
    ["绑定能力类型不兼容"],
  );
  assert.deepEqual(
    panelControlIssues(
      { type: "select", capabilityId: "deleted" },
      capabilities,
    ),
    ["能力未绑定（引用已失效）"],
  );
  const options = panelDisplayOptions(capabilities[1], [
    { value: "quick", label: "速洗", hidden: true, order: 1 },
    { value: "normal", label: "普通", hidden: false, order: 0 },
  ]);
  assert.deepEqual(
    options.map((item) => [item.value, item.label, item.hidden]),
    [
      ["normal", "普通", false],
      ["quick", "速洗", true],
    ],
  );
  assert.ok(
    panelStepIssues(
      {
        sections: [
          {
            controls: [
              { type: "toggle", label: "电源", capabilityId: "missing" },
            ],
          },
        ],
      },
      capabilities,
    ).length,
  );
});

test("N7 project API saves an isolated panel and binds it without touching shared panels", async () => {
  const temporary = await mkdtemp(path.join(tmpdir(), "ha3d-n7-"));
  const app = Fastify();
  try {
    const store = await DevicePlatformStore.create(
      path.join(temporary, "data"),
      path.join(temporary, "assets"),
    );
    await store.upsertDeviceTemplate({
      id: "custom.project",
      name: "测试设备",
      capabilities: [
        {
          capabilityId: "power",
          name: "电源",
          kind: "toggle",
          dataType: "boolean",
        },
        {
          capabilityId: "program",
          name: "模式",
          kind: "enum",
          dataType: "enum",
        },
      ],
    });
    await store.upsertBinding({
      deviceId: "device-one",
      deviceTemplateId: "custom.project",
    });
    const builtinBefore = structuredClone(
      store.getControlPanels().find((item) => item.id === "builtin.generic"),
    );
    await registerDevicePlatformRoutes(app, store, {
      getDevices: () => [],
      getEntities: () => [],
    });
    const url = "/api/device-platform/projects/custom.project/control-panel";
    const panel = {
      name: "测试面板",
      sections: [
        {
          id: "main",
          title: "设备控制",
          controls: [
            {
              id: "control-one",
              type: "toggle",
              label: "电源",
              capabilityId: "power",
              variant: "power",
              grid: { x: 0, y: 0, w: 2 },
            },
            {
              id: "control-two",
              type: "select",
              label: "模式",
              capabilityId: "program",
              selectStyle: "grid",
              optionSource: "custom",
              optionOverrides: [
                { value: "quick", label: "速洗", hidden: false, order: 0 },
              ],
              grid: { x: 2, y: 0, w: 2 },
            },
            {
              id: "control-old",
              type: "status",
              label: "旧状态",
              capabilityId: "removed",
              grid: { x: 0, y: 1, w: 2 },
            },
          ],
        },
      ],
    };
    const invalid = await app.inject({
      method: "PUT",
      url,
      payload: {
        panel: {
          ...panel,
          sections: [
            {
              ...panel.sections[0],
              controls: [
                { ...panel.sections[0].controls[0], capabilityId: "program" },
              ],
            },
          ],
        },
      },
    });
    assert.equal(invalid.statusCode, 400);
    const saved = await app.inject({ method: "PUT", url, payload: { panel } });
    assert.equal(saved.statusCode, 200);
    const panelId = saved.json().item.id;
    assert.equal(saved.json().item.layoutMode, "grid");
    assert.equal(saved.json().item.sections[0].controls[0].variant, "power");
    assert.equal(
      store.getDeviceTemplates().find((item) => item.id === "custom.project")
        .controlPanelTemplateId,
      panelId,
    );
    assert.equal(
      store.getBindings().find((item) => item.deviceId === "device-one")
        .controlPanelTemplateId,
      panelId,
    );
    const builtinAfter = store
      .getControlPanels()
      .find((item) => item.id === "builtin.generic");
    assert.deepEqual(builtinAfter.sections, builtinBefore.sections);
    assert.equal(builtinAfter.layoutMode, builtinBefore.layoutMode);
    const reloaded = await DevicePlatformStore.create(
      path.join(temporary, "data"),
      path.join(temporary, "assets"),
    );
    assert.equal(
      reloaded.getControlPanels().find((item) => item.id === panelId)
        .sections[0].controls[1].optionOverrides[0].value,
      "quick",
    );
    assert.equal(
      reloaded.getControlPanels().find((item) => item.id === panelId)
        .sections[0].controls[1].selectStyle,
      "grid",
    );
    const validation = await app.inject({
      method: "GET",
      url: "/api/device-platform/projects/custom.project/capability-validation",
    });
    assert.equal(validation.statusCode, 200);
    assert.ok(
      validation
        .json()
        .issues.some(
          (item) =>
            item.page === "控制面板" &&
            item.component === "旧状态" &&
            item.reason.includes("已删除"),
        ),
    );
  } finally {
    await app.close();
    await rm(temporary, { recursive: true, force: true });
  }
});

test("自适应行高拖放按实际网格行定位", () => {
  assert.equal(
    panelDropCell(10, 30, { left: 0, top: 0, width: 400 }, [24, 100, 35], 8).y,
    0,
  );
  assert.equal(
    panelDropCell(10, 33, { left: 0, top: 0, width: 400 }, [24, 100, 35], 8).y,
    1,
  );
  assert.equal(
    panelDropCell(10, 141, { left: 0, top: 0, width: 400 }, [24, 100, 35], 8).y,
    2,
  );
});
