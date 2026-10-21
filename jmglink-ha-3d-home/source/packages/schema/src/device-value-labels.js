const STATE_LABELS = {
  on: "已开启",
  off: "已关闭",
  unknown: "状态未知",
  unavailable: "实体不可用",
  standby: "待机",
  idle: "待机",
  running: "运行中",
  working: "运行中",
  paused: "已暂停",
  completed: "已完成",
};

const WASH_PROGRAM_LABELS = {
  standard: "标准洗",
  fast: "快洗",
  blanket: "毛毯洗",
  wool: "羊毛洗",
  embathe: "浸泡洗",
  memory: "记忆洗",
  child: "童装洗",
  strong_wash: "强力洗",
  bucket_self_clean: "桶自洁",
};

export function deviceValueLabel(value, label, context = {}) {
  const raw = String(value ?? "—");
  const hasLabel = typeof label === "string" && Boolean(label.trim());
  if (
    hasLabel &&
    (context.labelSource === "custom" ||
      (!context.labelSource && label !== raw))
  )
    return label;
  const translated = context.stateLabels?.[raw];
  if (typeof translated === "string" && translated.trim()) return translated;
  if (hasLabel && label !== raw) return label;
  const description = [
    context.entityId,
    context.capabilityId,
    context.id,
    context.name,
    context.entityName,
  ]
    .filter(Boolean)
    .join(" ");
  const values = [
    ...(context.enumValues ?? []).map((item) => item.value),
    ...(context.attributes?.options ?? []),
    ...(context.options ?? []),
  ];
  const washer =
    /洗衣|洗涤程序|washer|washing/i.test(description) ||
    values.includes("bucket_self_clean");
  if (
    washer &&
    /(?:^|[._\s-])program(?:$|[._\s-])|程序|模式/i.test(description)
  )
    return WASH_PROGRAM_LABELS[raw] ?? STATE_LABELS[raw] ?? raw;
  return STATE_LABELS[raw] ?? raw;
}

export function capabilityValueOptions(capability, entity) {
  const saved = capability?.enumValues ?? [];
  const labels = new Map(saved.map((item) => [String(item.value), item]));
  const current = entity?.attributes?.options;
  const values = Array.isArray(current)
    ? [...new Set(current.map(String))]
    : saved
        .filter((item) => item.status !== "missing")
        .map((item) => String(item.value));
  return values.map((value) => ({
    value,
    label: deviceValueLabel(value, labels.get(value)?.label, {
      ...capability,
      labelSource:
        labels.get(value)?.labelSource ??
        (labels.get(value)?.source === "manual" ? "custom" : undefined),
      stateLabels: entity?.stateLabels ?? capability?.stateLabels,
      entityId: entity?.entityId,
      entityName: entity?.name,
      options: current,
    }),
  }));
}

export function enumValueLabel(item, context = {}) {
  return deviceValueLabel(item.value, item.label, {
    ...context,
    labelSource:
      item.labelSource ?? (item.source === "manual" ? "custom" : undefined),
  });
}
