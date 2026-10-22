import { normalizeWidgetActions } from "./widget-actions.js";
import { operationsWidgetCode } from "./operations-widget.js";
import { musicWidgetCode } from "./music-widget.js";
import { energyWidgetCode } from "./energy-widget.js";
import { weatherWidgetCode } from "./weather-widget.js";
export const SIDEBAR_FORMAT = "ha3d-sidebar-v1";
export function defaultSidebar() {
  const config = {
    format: SIDEBAR_FORMAT,
    width: 380,
    widgets: [
      {
        id: "weather",
        name: "天气概览",
        kind: "custom",
        actions: [],
        scriptMode: "transform",
        entityAttribute: "",
        accountNames: {},
        entityDomain: "weather",
        entityId: "",
        entityIds: null,
        ...weatherWidgetCode(),
      },
      {id:"energy",name:"家庭能耗",kind:"custom",actions:[],accountNames:{},scriptMode:"dom",entityDomain:"sensor",entityAttribute:"monthlist",entityId:"",entityIds:null,...energyWidgetCode()},
    ],
    pages: [
      {
        id: "home",
        name: "主页",
        icon: "⌂",
        color: "#f7c95d",
        items: [
          {
            id: "weather-main",
            widgetId: "weather",
            entityId: "",
        entityIds: null,
            height: 340,
          },
          {id:"energy-main",widgetId:"energy",entityId:"",entityIds:null,height:340},
        ],
      },
    ],
  };
  const common={kind:"custom",actions:[],accountNames:{},scriptMode:"dom",entityDomain:"",entityAttribute:"",entityId:"",entityIds:null};
  config.widgets.push({...common,id:"operations",name:"设备运维",...operationsWidgetCode()}, {...common,id:"music",name:"音乐中心",entityDomain:"media_player",entityAttribute:"songloft_song_id",...musicWidgetCode()});
  config.pages.push({id:"operations",name:"运维",icon:"⚒",color:"#54c8af",items:[{id:"operations-main",widgetId:"operations",entityId:"",entityIds:null,height:340}]},{id:"music",name:"音乐",icon:"♫",color:"#f39b24",items:[{id:"music-main",widgetId:"music",entityId:"",entityIds:null,height:340}]});
  return config;
}
const fail = (message) => {
  throw Object.assign(new Error(message), { statusCode: 400 });
};
const text = (value, limit, label) => {
  if (typeof value !== "string" || value.length > limit)
    fail(`${label}格式不正确或过长`);
  return value;
};
const id = (value) =>
  typeof value === "string" && /^[a-zA-Z0-9_-]{1,80}$/.test(value)
    ? value
    : fail("标识只能使用英文、数字、横线和下划线");
const number = (value, min, max) =>
  Number.isFinite(value) && value >= min && value <= max
    ? value
    : fail("布局尺寸超出范围");
function bindingIds(value) {
  if (value == null) return null;
  if (!Array.isArray(value) || value.length > 100) fail("最多绑定 100 个实体");
  return [...new Set(value.map(id => text(id,255,"实体")))];
}
export function normalizeSidebar(raw) {
  if (
    !raw ||
    raw.format !== SIDEBAR_FORMAT ||
    !Array.isArray(raw.widgets) ||
    !Array.isArray(raw.pages)
  )
    fail("侧边栏文档格式不正确");
  if (!raw.pages.length || raw.pages.length > 20 || raw.widgets.length > 100)
    fail("需要 1–20 个页面，最多 100 个控件");
  const widgetIds = new Set(),
    pageIds = new Set();
  const widgets = raw.widgets.map((w) => {
    if (!w || typeof w !== "object") fail("控件格式不正确");
    const key = id(w.id);
    if (widgetIds.has(key)) fail("控件标识重复");
    widgetIds.add(key);
    if (!["weather", "custom"].includes(w.kind)) fail("未知控件类型");
    return {
      id: key,
      name: text(w.name, 80, "控件名称"),
      kind: "custom",
      actions: normalizeWidgetActions(w.actions),
      accountNames: Object.fromEntries(Object.entries(w.accountNames ?? {}).slice(0,100).map(([key,value])=>[text(key,255,"实体标识"),text(value,80,"显示名称")])),
      scriptMode: w.scriptMode === "dom" ? "dom" : "transform",
      entityAttribute: text(w.entityAttribute ?? "",80,"自动选择属性"),
      entityDomain: text(w.entityDomain ?? (w.kind === "weather" ? "weather" : ""), 80, "自动选择实体域"),
      entityIds: bindingIds(w.entityIds),
      entityId: text(w.entityId ?? "", 255, "实体"),
      html: text(w.kind === "weather" ? weatherWidgetCode().html : (w.html ?? ""), 24000, "HTML"),
      css: text(w.kind === "weather" ? weatherWidgetCode().css : (w.css ?? ""), 24000, "CSS"),
      js: text(w.kind === "weather" ? weatherWidgetCode().js : (w.js ?? ""), 1000000, "JS"),
    };
  });
  const pages = raw.pages.map((p) => {
    if (!p || typeof p !== "object") fail("页面格式不正确");
    const key = id(p.id);
    if (pageIds.has(key)) fail("页面标识重复");
    pageIds.add(key);
    if (!Array.isArray(p.items) || p.items.length > 40)
      fail("每页最多 40 个控件");
    const itemIds = new Set();
    return {
      id: key,
      name: text(p.name, 40, "页面名称"),
      icon: text(p.icon ?? "◉", 12, "图标"),
      color: /^#[0-9a-f]{6}$/i.test(p.color || "") ? p.color : "#f7c95d",
      items: p.items.map((item) => {
        if (!item || typeof item !== "object") fail("页面控件格式不正确");
        const key = id(item.id);
        if (itemIds.has(key)) fail("页面内控件标识重复");
        itemIds.add(key);
        if (!widgetIds.has(item.widgetId))
          fail("页面引用的控件不存在，请先移除引用");
        return {
          id: key,
          widgetId: item.widgetId,
          entityIds: bindingIds(item.entityIds),
          entityId: text(item.entityId ?? "", 255, "实体"),
          height: number(item.height, 100, 1000),
        };
      }),
    };
  });
  return {
    format: SIDEBAR_FORMAT,
    width: number(raw.width, 280, 560),
    widgets,
    pages,
  };
}
