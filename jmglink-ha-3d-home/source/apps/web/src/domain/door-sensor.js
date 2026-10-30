// 门状态实体来自完整 HA 实体表，不受设备列表的辅助实体隐藏规则影响。
export function doorSensorCandidates(entities, query = "") {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const text = (e) =>
    `${e.name ?? ""} ${e.entityId ?? ""} ${e.attributes?.device_class ?? ""}`;
  const rank = (e) =>
    /(?:^|[._\s-])(door|window|opening|contact)(?:$|[._\s-])|门|窗|磁/i.test(
      text(e),
    )
      ? 0
      : 1;
  return Object.values(entities)
    .filter((e) =>
      ["binary_sensor", "sensor"].includes(
        e.domain ?? e.entityId?.split(".")[0],
      ),
    )
    .filter((e) =>
      terms.every((term) => text(e).toLocaleLowerCase().includes(term)),
    )
    .sort(
      (a, b) =>
        rank(a) - rank(b) ||
        String(a.name ?? a.entityId).localeCompare(
          String(b.name ?? b.entityId),
          "zh-Hans",
        ) ||
        a.entityId.localeCompare(b.entityId),
    );
}

export function isDoorSensorOpen(entity) {
  const state = String(entity?.state ?? "")
    .trim()
    .toLowerCase();
  if (
    [
      "on",
      "open",
      "opened",
      "opening",
      "detected",
      "unsafe",
      "unlocked",
      "true",
      "1",
    ].includes(state)
  )
    return true;
  // 智能门锁可能附带童锁／反锁说明；只读取门的物理状态前缀。
  // “已开锁”与“解除门虚掩”均不代表门已打开。
  const base = state.split(/[（(]/)[0].trim();
  return [
    "打开",
    "已打开",
    "开启",
    "已开启",
    "开",
    "门开",
    "门已打开",
    "门虚掩",
    "门未关",
    "门未关好",
    "未关",
    "未关闭",
    "ajar",
    "not_closed",
  ].includes(base);
}
