import { matchesDeviceTemplateRules } from "../../domain/device-template-matching.js";

export const PROJECT_STEPS = [
  { id: "basic", label: "基础信息" },
  { id: "capabilities", label: "能力与属性映射" },
  { id: "runtime", label: "运行浮窗" },
  { id: "appearance", label: "3D 外观" },
  { id: "panel", label: "控制面板" },
  { id: "testing", label: "联调测试" },
  { id: "publish", label: "发布" },
];

export const DEVICE_CATEGORIES = {
  appliance: {
    label: "家电",
    subtypes: ["洗衣机", "冰箱", "洗碗机", "热水器", "净水器", "其他家电"],
  },
  lighting: {
    label: "照明",
    subtypes: ["吊灯", "吸顶灯", "灯带", "台灯", "其他照明"],
  },
  climate: {
    label: "环境",
    subtypes: ["空调", "新风", "地暖", "风扇", "其他环境设备"],
  },
  security: {
    label: "安防",
    subtypes: ["门锁", "摄像头", "传感器", "其他安防设备"],
  },
  generic: { label: "其他", subtypes: ["通用设备", "其他"] },
};

export function addRuleToken(values, input) {
  const normalized = String(input ?? "").trim();
  if (!normalized) return values ?? [];
  const current = Array.isArray(values) ? values : [];
  return current.some(
    (item) => item.toLocaleLowerCase() === normalized.toLocaleLowerCase(),
  )
    ? current
    : [...current, normalized];
}

export function rankProjectCandidates(devices, rules, boundDeviceId) {
  const ruleCount = Object.values(rules ?? {}).reduce(
    (total, values) => total + (Array.isArray(values) ? values.length : 0),
    0,
  );
  return (devices ?? [])
    .map((device) => {
      const matched = matchesDeviceTemplateRules(device, rules);
      const bound = device.id === boundDeviceId;
      return {
        ...device,
        projectMatched: matched,
        projectBound: bound,
        projectMatchLabel: bound
          ? "当前绑定"
          : !ruleCount
            ? "待设置规则"
            : matched
              ? "高度匹配"
              : "未匹配",
      };
    })
    .filter((device) => device.projectMatched || device.projectBound)
    .sort(
      (a, b) =>
        Number(b.projectBound) - Number(a.projectBound) ||
        Number(b.projectMatched) - Number(a.projectMatched) ||
        a.name.localeCompare(b.name, "zh"),
    );
}

export function resolveProjectConnection(binding, devices, haStatus) {
  if (!binding) return { id: "unbound", label: "待绑定", severity: "warning" };
  if (haStatus?.connected === false)
    return { id: "offline", label: "HA 离线", severity: "warning" };
  const device = (devices ?? []).find((item) => item.id === binding.deviceId);
  if (!device)
    return { id: "missing", label: "HA 设备失联", severity: "error" };
  if (device.development)
    return { id: "online", label: "本地模拟", severity: "success" };
  if (device.historical && haStatus?.connected)
    return { id: "missing", label: "HA 设备失联", severity: "error" };
  if (
    !haStatus?.connected ||
    device.historical ||
    !(device.entities ?? []).some(
      (entity) => !["unavailable", "unknown"].includes(entity.state),
    )
  )
    return { id: "offline", label: "HA 离线", severity: "warning" };
  return { id: "online", label: "HA 在线", severity: "success" };
}

export function defaultSelectedEntityIds(device, binding) {
  const availableIds = new Set(
    (device?.entities ?? []).map((item) => item.entityId),
  );
  return recordedEntityIds(binding).filter((id) => availableIds.has(id));
}

export function recordedEntityIds(binding) {
  if (!binding) return [];
  if (
    Array.isArray(binding.selectedEntityIds) &&
    binding.selectedEntityIds.length
  )
    return [...new Set(binding.selectedEntityIds)];
  return [
    ...new Set(
      Object.values(binding.capabilityBindings ?? {}).flatMap((value) => {
        if (typeof value === "string") return [value];
        if (Array.isArray(value))
          return value.filter((item) => typeof item === "string");
        return value?.entityId ? [value.entityId] : [];
      }),
    ),
  ];
}

export function entityTypeLabel(domain) {
  return (
    {
      binary_sensor: "二值传感器",
      sensor: "传感器",
      switch: "开关",
      light: "灯光",
      climate: "空调",
      cover: "窗帘",
      lock: "门锁",
      fan: "风扇",
      number: "数值",
      select: "选项",
      button: "按钮",
      camera: "摄像头",
      humidifier: "加湿器",
      water_heater: "热水器",
    }[domain] ??
    domain ??
    "未知"
  );
}

export function applyBasicProjectDraft(current, draft) {
  return {
    ...current,
    name: draft.name.trim(),
    category: draft.category,
    subCategory: draft.subCategory,
    manufacturer: draft.manufacturer,
    model: draft.model,
    matchRules: draft.matchRules,
  };
}
