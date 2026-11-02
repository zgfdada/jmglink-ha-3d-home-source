export function formatProjectSaveError(message, project, entities = {}) {
  return String(message).replace(/HA 设备 ([^\s;]+) 不能在户型中重复放置/g, (_, deviceId) => {
    const placements = (project?.floors || []).flatMap(floor => floor.devices || [])
      .filter(device => device.deviceId === deviceId);
    const names = [...new Set(placements.map(device => {
      const entity = entities[device.entityId];
      return entity?.deviceDisplayName || entity?.name || device.name || device.entityId || "未命名设备";
    }))];
    const label = names.length ? names.map(name => `「${name}」`).join("、") : "同一个设备";
    return `${label}在户型中重复放置，请替换副本绑定或移除重复点位`;
  });
}
