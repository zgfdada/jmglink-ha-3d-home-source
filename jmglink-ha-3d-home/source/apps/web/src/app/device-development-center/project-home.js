export const PROJECT_VIEW_KEY = "ha3d.device-center-project-view";

export function normalizeProjectSearch(value) {
  return String(value ?? "")
    .trim()
    .toLocaleLowerCase("zh-Hans-CN");
}

export function filterDeviceProjects(devices, query) {
  const normalized = normalizeProjectSearch(query);
  if (!normalized) return [...devices];
  return devices.filter((device) =>
    [
      device.name,
      device.id,
      device.description,
      device.category,
      device.manufacturer,
      device.model,
      ...(device.searchTerms ?? []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase("zh-Hans-CN")
      .includes(normalized),
  );
}

export function resolveProjectHealth(device) {
  if (device?.configurationIssues?.length) {
    return { id: "error", label: "配置异常", severity: "error" };
  }
  if (!device?.boundDeviceCount || device?.historical) {
    return device?.boundDeviceCount
      ? { id: "offline", label: "HA 离线", severity: "warning" }
      : { id: "error", label: "配置异常", severity: "error" };
  }
  if (device?.boundDevices?.every((item) => item.historical)) {
    return { id: "offline", label: "HA 离线", severity: "warning" };
  }
  const entities = device?.entities ?? [];
  const available = entities.some(
    (entity) => !["unknown", "unavailable"].includes(String(entity.state)),
  );
  if (!available)
    return { id: "offline", label: "HA 离线", severity: "warning" };
  return { id: "online", label: "HA 在线", severity: "success" };
}

export function createDeviceProjectPayload({ id, name, description = "" }) {
  const createdAt = new Date().toISOString();
  return {
    id,
    name: String(name ?? "").trim(),
    category: "custom",
    icon: "mdi:devices",
    description: String(description ?? "").trim(),
    enabled: true,
    version: 1,
    matchRules: {
      manufacturers: [],
      models: [],
      names: [],
      integrations: [],
      entityDomains: [],
      deviceClasses: [],
      keywords: [],
    },
    capabilities: [],
    createdAt,
    updatedAt: createdAt,
  };
}

export function createDeviceProjectId(now = Date.now()) {
  return `custom.device-project-${Number(now).toString(36)}`;
}

export function buildCustomDeviceProjects(platform = {}, devices = []) {
  const deviceById = new Map(devices.map((device) => [device.id, device]));
  const bindings = platform.bindings ?? [];
  const models = platform.modelTemplates ?? [];
  const panels = platform.controlPanels ?? [];

  return (platform.deviceTemplates ?? [])
    .filter((template) => !template.builtin)
    .map((template) => {
      const projectBindings = bindings.filter(
        (binding) => binding.deviceTemplateId === template.id,
      );
      const boundDevices = projectBindings
        .map((binding) => deviceById.get(binding.deviceId))
        .filter(Boolean);
      const entityIds = [
        ...new Set(
          projectBindings.flatMap((binding) => [
            ...(binding.selectedEntityIds ?? []),
            ...Object.values(binding.capabilityBindings ?? {}).flat(),
          ]),
        ),
      ];
      const entities = boundDevices.flatMap((device) => device.entities ?? []);
      const modelTemplate =
        models.find((model) => model.id === template.modelTemplateId) ??
        models.find((model) => model.deviceTemplateId === template.id);
      const controlPanel =
        panels.find((panel) => panel.id === template.controlPanelTemplateId) ??
        panels.find((panel) => panel.deviceTemplateId === template.id);
      const missingDeviceCount = Math.max(
        0,
        projectBindings.length - boundDevices.length,
      );
      const configurationIssues = [];
      if (!projectBindings.length) configurationIssues.push("尚未绑定 HA 设备");
      if (missingDeviceCount)
        configurationIssues.push("已绑定的 HA 设备不存在");
      if (
        template.modelTemplateId &&
        !models.some((model) => model.id === template.modelTemplateId)
      )
        configurationIssues.push("引用的 3D 模型已失效，请重新选择模型");

      return {
        ...template,
        deviceTemplateId: template.id,
        deviceTemplateName: template.name,
        configured: true,
        bindings: projectBindings,
        boundDevices,
        boundDeviceCount: projectBindings.length,
        entityIds,
        entities,
        historical:
          Boolean(projectBindings.length) &&
          (!boundDevices.length ||
            boundDevices.every((device) => device.historical)),
        capabilityCount: template.capabilities?.length ?? 0,
        modelTemplate,
        modelTemplateId: modelTemplate?.id,
        controlPanel,
        controlPanelTemplateId: controlPanel?.id,
        manufacturer:
          template.manufacturer ||
          [
            ...new Set(
              boundDevices.map((item) => item.manufacturer).filter(Boolean),
            ),
          ].join(" / ") ||
          "自定义设备项目",
        model: template.model || modelTemplate?.name || "未配置型号",
        configurationIssues,
        searchTerms: [
          ...(template.matchRules?.manufacturers ?? []),
          ...(template.matchRules?.models ?? []),
          ...(template.matchRules?.names ?? []),
          ...(template.matchRules?.keywords ?? []),
          ...boundDevices.flatMap((item) => [
            item.name,
            item.manufacturer,
            item.model,
          ]),
          modelTemplate?.name,
          controlPanel?.name,
        ],
      };
    })
    .sort((first, second) =>
      String(second.updatedAt ?? "").localeCompare(
        String(first.updatedAt ?? ""),
      ),
    );
}

export function projectVisualKind(device) {
  const value = `${device?.name ?? ""} ${device?.model ?? ""} ${device?.modelTemplate?.source?.shape ?? ""}`;
  if (/洗衣|washer|washing/i.test(value)) return "washer";
  if (/冰箱|fridge|refriger/i.test(value)) return "fridge";
  if (/空调|climate|air.?condition/i.test(value)) return "climate";
  if (/灯|light/i.test(value)) return "light";
  if (/窗帘|curtain|cover/i.test(value)) return "curtain";
  if (/扫地|vacuum/i.test(value)) return "vacuum";
  return "generic";
}
