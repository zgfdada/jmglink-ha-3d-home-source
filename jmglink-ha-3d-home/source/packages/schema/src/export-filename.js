function safePart(value, fallback) {
  const text = String(value ?? "")
    .replace(/[\\/:*?"<>|\x00-\x1f]/g, "-")
    .replace(/\s+/g, " ")
    .replace(/[.\s-]+$/g, "")
    .trim()
    .slice(0, 64);
  return text || fallback;
}

function timestamp(value) {
  const date = value ? new Date(value) : new Date();
  if (!Number.isFinite(date.getTime())) throw new Error("导出时间无效");
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Shanghai",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).formatToParts(date).map(({ type, value: part }) => [type, part]),
  );
  return `${parts.year}${parts.month}${parts.day}-${parts.hour}${parts.minute}${parts.second}`;
}

export function exportFilename(kind, name, version, exportedAt) {
  const title = kind === "device"
    ? `${safePart(name, "未命名设备")}设备包`
    : `整体包-${safePart(name, "未命名户型")}`;
  const normalizedVersion = safePart(version, "draft").replace(/^v/i, "");
  return `${title}-${timestamp(exportedAt)}-v${normalizedVersion}.json`;
}
