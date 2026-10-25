import { normalizeSidebar, SIDEBAR_FORMAT } from "./sidebar.js";
export function exportSidebarPart(config, kind = "sidebar", id) {
  const source = normalizeSidebar(config);
  if (kind === "sidebar") return source;
  if (kind === "library") return {format:"ha3d-sidebar-library-v1",version:1,widgets:source.widgets};
  const page = kind === "page" ? source.pages.find((p) => p.id === id) : null;
  const widgets =
    kind === "widget"
      ? source.widgets.filter((w) => w.id === id)
      : source.widgets.filter((w) =>
          page?.items.some((i) => i.widgetId === w.id),
        );
  if ((kind === "widget" && !widgets.length) || (kind === "page" && !page))
    throw Error("请选择要导出的控件或页面");
  if (!["widget", "page"].includes(kind)) throw Error("不支持的导出类型");
  const pages = page
    ? [page]
    : [
        {
          id: "preview",
          name: widgets[0].name,
          icon: "◇",
          items: [{ id: "preview-item", widgetId: widgets[0].id, height: 340 }],
        },
      ];
  return {
    format: `ha3d-sidebar-${kind}-v1`,
    version: 1,
    config: normalizeSidebar({
      format: SIDEBAR_FORMAT,
      width: source.width,
      widgets,
      pages,
    }),
  };
}
export function importSidebarPart(current, payload, expectedKind) {
  const expected={widget:'ha3d-sidebar-widget-v1',library:'ha3d-sidebar-library-v1',page:'ha3d-sidebar-page-v1',sidebar:SIDEBAR_FORMAT};
  if(expectedKind && payload?.format!==expected[expectedKind])throw Error('文件类型与所选导入功能不一致');
  if(payload?.format==='ha3d-sidebar-library-v1'){
    if(payload.version!==1||!Array.isArray(payload.widgets))throw Error('控件库格式不正确');
    payload={...payload,config:{format:SIDEBAR_FORMAT,width:380,widgets:payload.widgets,pages:[{id:'library-preview',name:'控件库',icon:'◇',items:[]}]}};
  }

  if (payload?.format === SIDEBAR_FORMAT) return normalizeSidebar(payload);
  if (
    !["ha3d-sidebar-widget-v1", "ha3d-sidebar-page-v1", "ha3d-sidebar-library-v1"].includes(
      payload?.format,
    ) ||
    payload.version !== 1
  )
    throw Error("不支持的侧栏导入格式");
  const incoming = normalizeSidebar(payload.config),
    result = structuredClone(normalizeSidebar(current));
  if(payload.format==="ha3d-sidebar-widget-v1"&&incoming.widgets.length!==1)throw Error("单控件文件必须且只能包含一个控件");
  const ids = new Set(result.widgets.map((w) => w.id)),
    remap = new Map();
  const fresh = (id, set) => {
    let next = id,
      n = 1;
    while (set.has(next)) next = `${id}-import-${n++}`;
    set.add(next);
    return next;
  };
  for (const w of incoming.widgets) {
    const id = fresh(w.id, ids);
    remap.set(w.id, id);
    result.widgets.push({ ...w, id });
  }
  if (payload.format === "ha3d-sidebar-page-v1") {
    const pages = new Set(result.pages.map((p) => p.id));
    for (const p of incoming.pages)
      result.pages.push({
        ...p,
        id: fresh(p.id, pages),
        items: p.items.map((i) => ({ ...i, widgetId: remap.get(i.widgetId) })),
      });
  }
  return normalizeSidebar(result);
}
