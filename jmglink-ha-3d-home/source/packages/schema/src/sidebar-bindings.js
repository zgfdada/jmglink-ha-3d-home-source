// Shared by the editor, renderer and live subscription filter.
export function resolveSidebarEntities(widget = {}, override = {}, entities = {}) {
  const all = Array.isArray(entities) ? entities : Object.values(entities);
  let ids;
  let source = "自动选择";
  if (Array.isArray(override.entityIds)) { ids = override.entityIds; source = "页面绑定"; }
  else if (override.entityId) { ids = [override.entityId]; source = "页面绑定"; }
  else if (Array.isArray(widget.entityIds)) { ids = widget.entityIds; source = "控件默认绑定"; }
  else if (widget.entityId) { ids = [widget.entityId]; source = "控件默认绑定"; }
  else {
    const matches = widget.entityDomain ? all.filter(e => (e.domain === widget.entityDomain || e.entityId?.startsWith(widget.entityDomain + ".")) && (!widget.entityAttribute || Object.hasOwn(e.attributes || {}, widget.entityAttribute))) : [];
    ids = (widget.entityAttribute ? matches : matches.slice(0, 1)).map(e => e.entityId);
  }
  ids = [...new Set(ids)];
  return { ids, source, entities: ids.map(id => all.find(e => e.entityId === id)).filter(Boolean), missing: ids.filter(id => !all.some(e => e.entityId === id)) };
}
export function sidebarEntityName(entity, widget = {}) {
  return widget.accountNames?.[entity.entityId] || entity.attributes?.title || entity.name || entity.attributes?.friendly_name || entity.entityId;
}
