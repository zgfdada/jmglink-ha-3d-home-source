export function extraEntityOptions(devices = [], binding) {
  const primary = devices.find(device => device.id === binding?.deviceId);
  const own = new Set([...(primary?.entityIds ?? []), ...(binding?.selectedEntityIds ?? [])]);
  const byId = new Map();
  for (const device of devices) {
    if (device.id === binding?.deviceId) continue;
    for (const entity of device.entities ?? []) {
      if (entity.entityOnly) continue;
      if (!own.has(entity.entityId)) byId.set(entity.entityId, {...entity, sourceDeviceName:device.name ?? "无设备归属", sourceDeviceId:device.id});
    }
  }
  for (const entityId of binding?.extraEntityIds ?? []) {
    if (own.has(entityId) || byId.has(entityId)) continue;
    const previous = primary?.extraEntities?.find(entity => entity.entityId === entityId);
    byId.set(entityId,{...previous,entityId,name:previous?.name ?? entityId,domain:entityId.split(".")[0],state:previous?.state ?? "unavailable",historical:true,sourceDeviceName:"已保存关联 · 当前不可用"});
  }
  return [...byId.values()].sort((a,b)=>(a.name ?? a.entityId).localeCompare(b.name ?? b.entityId,"zh-CN"));
}

export function filterExtraEntities(options, {search="",domain="all",onlySelected=false,selected=[]}) {
  const query=search.trim().toLocaleLowerCase();
  const selectedSet=new Set(selected);
  const core=["device_tracker","sensor","binary_sensor","person"];
  return options.filter(entity=>(domain==="all" || (domain==="other"?!core.includes(entity.domain):entity.domain===domain)) &&
    (!onlySelected || selectedSet.has(entity.entityId)) &&
    (!query || [entity.name,entity.entityId,entity.sourceDeviceName].join(" ").toLocaleLowerCase().includes(query)));
}
