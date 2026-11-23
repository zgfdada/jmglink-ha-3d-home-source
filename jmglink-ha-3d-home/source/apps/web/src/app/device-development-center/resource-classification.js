import { DATA_TYPES, librarySupportsCapability } from "../../../../../packages/schema/src/control-library.js";
import { MOTION_CATEGORIES } from "../../../../../packages/schema/src/motion-library.js";
import { MOTION_EFFECTS } from "../../../../../packages/schema/src/part-motion.js";
import { productIdentity } from "../../../../../packages/schema/src/project-product.js";

// Use specific object names before broader terms: a TV cabinet is furniture and
// a projection screen is AV equipment even when both are placed as furnishings.
const physicalClasses = [
  ["家具", "柜体与收纳", /电视柜|床头柜|衣柜|鞋柜|书柜|橱柜|吊柜|储物柜|展示柜|餐边柜|书架|置物架|衣架|\b(cabinet|wardrobe|shelf|bookcase)\b/],
  ["家居装饰", "绿植花艺", /绿植|盆栽|盆景|花卉|花艺|插花|\b(plant|planter|bonsai)\b/],
  ["家居装饰", "挂画与墙饰", /挂画|壁画|装饰画|墙饰|相框|照片墙|\b(painting|artwork|poster)\b/],
  ["家居装饰", "摆件与花器", /摆件|花瓶|花盆|雕塑|雕像|\b(vase|figurine|sculpture)\b/],
  ["家居装饰", "软装织物", /地毯|抱枕|靠垫|桌布|床品|\b(rug|carpet|cushion|pillow)\b/],
  ["家用电器", "洗衣与烘干", /洗衣机|烘干机|干衣机|洗烘|\b(washer|dryer|washing machine)\b/],
  ["家用电器", "冰箱与冷藏", /冰箱|冷柜|冰柜|酒柜|\b(fridge|freezer|refrigerator)\b/],
  ["家用电器", "净水与饮水", /管线机|饮水机|净水器|净饮机|直饮机|\b(water purifier|water dispenser)\b/],
  ["家用电器", "热水与采暖", /热水器|壁挂炉|地暖|\b(water heater|boiler)\b/],
  ["家用电器", "厨房电器", /洗碗机|油烟机|烟灶|燃气灶|微波炉|烤箱|咖啡机|电饭煲|\b(dishwasher|oven|microwave|cooktop)\b/],
  ["家用电器", "空调与空气处理", /空调|新风|空气净化器|加湿器|除湿机|吊扇|落地扇|风扇|\b(climate|air conditioner|fan|humidifier)\b/],
  ["家用电器", "清洁电器", /扫地机|洗地机|吸尘器|清洁机|\b(vacuum|robovac)\b/],
  ["影音设备", "投影与幕布", /投影仪|投影机|投影幕|幕布|\b(projector|projection screen|cinema screen)\b/],
  ["影音设备", "音箱与功放", /音箱|音响|低音炮|声道|功放|回音壁|\b(speaker|subwoofer|soundbar|amplifier)\b/],
  ["影音设备", "电视与显示器", /电视|显示器|\b(tv|television|monitor)\b/],
  ["智能设备", "安防监控", /摄像头|摄像机|监控|智能锁|门锁|门铃|\b(camera|doorbell|door lock)\b/],
  ["智能设备", "网络与网关", /路由器|交换机|网关|中继器|\b(router|gateway|network switch|access point)\b/],
  ["智能设备", "传感器", /传感器|感应器|探测器|温湿度计|门磁|\bsensor\b/],
  ["智能设备", "开关与插座", /开关|插座|继电器|调光器|\b(switch|socket|relay|dimmer)\b/],
  ["智能设备", "灯具照明", /灯具|灯带|筒灯|射灯|台灯|壁灯|吊灯|吸顶灯|平板灯|落地灯|轨道灯|线性灯|感应灯|床头灯|氛围灯|顶灯|板灯|地灯|线灯|路灯|灯泡|\b(light|lamp|downlight|spotlight|chandelier)\b/],
  ["智能设备", "窗帘与遮阳", /窗帘|百叶帘|遮阳帘|卷帘|\b(curtain|blinds?)\b/],
  ["家具", "沙发与座椅", /沙发|座椅|单椅|椅子|餐椅|躺椅|吧椅|凳子|\b(sofa|chair|armchair|stool|couch)\b/],
  ["家具", "桌几与台面", /桌子|餐桌|书桌|办公桌|茶几|边几|吧台|\b(table|desk)\b/],
  ["家具", "床具", /床架|双人床|单人床|儿童床|榻榻米|^床$|\bbed\b/],
  ["建筑构件", "门窗与隔断", /入户门|房门|玻璃门|移门|推拉门|窗户|门窗|隔断|\b(door|window|partition)\b/],
  ["建筑构件", "墙体与地面", /背景墙|墙体|地板|地砖|墙砖|楼梯|栏杆|\b(wall|flooring|stairs|railing)\b/],
  ["交通工具", "汽车", /汽车|轿车|小车|车辆|电动车|越野车|^车$|\b(car|vehicle|suv)\b/],
  ["交通工具", "自行车与摩托车", /自行车|单车|摩托车|\b(bicycle|bike|motorcycle)\b/],
];

const furnitureKinds = {
  table: ["家具", "桌几与台面"], chair: ["家具", "沙发与座椅"], sofa: ["家具", "沙发与座椅"],
  cabinet: ["家具", "柜体与收纳"], bed: ["家具", "床具"],
};
const broadCategories = {
  media: "影音设备", appliance: "家用电器", furniture: "家具", decoration: "家居装饰",
  building: "建筑构件", vehicle: "交通工具", lighting:"智能设备", climate:"家用电器", security:"智能设备",
};
const categoryAliases = {家用电器:"家电", 家居装饰:"装饰品 软装 家饰", 影音设备:"家庭影院 影音", 家具:"家居 家私"};
const motionGroups = {translate:"transform", rotate:"transform", spin:"transform", scale:"transform",
  visible:"appearance", color:"appearance", emissive:"light", flow:"light", scan:"light"};
const collator = new Intl.Collator("zh-Hans-CN", {numeric:true, sensitivity:"base"});

function normalized(value) {
  return typeof value === "string" ? value.normalize("NFKC").trim().toLowerCase() : "";
}
function options(values) {
  const byKey = new Map();
  for (const value of values) {
    const key = normalized(value);
    if (key && !byKey.has(key)) byKey.set(key,value);
  }
  return [...byKey.values()].sort(collator.compare);
}

function classifyPhysical(raw, name, tags) {
  const furniture = raw.furnitureEnabled === false ? "" : raw.furnitureKind;
  if (Object.hasOwn(furnitureKinds, furniture)) return furnitureKinds[furniture];
  const decoration = furniture === "decoration";
  const category = String(raw.category ?? "");
  const declaredParent = decoration ? "家居装饰" : Object.hasOwn(broadCategories,category) ? broadCategories[category] : null;
  const classes = declaredParent ? physicalClasses.filter(([parent]) => parent === declaredParent) : physicalClasses;
  for (const value of [raw.subCategory, name, ...tags, raw.source?.shape, category]) {
    const text = normalized(value).replace(/[_-]+/g," ");
    const match = classes.find(([parent, child, pattern]) => text === parent+" "+child || text === child || pattern.test(text));
    if (match) return match.slice(0,2);
  }
  if (decoration || tags.includes("装饰")) return ["家居装饰", "其他装饰"];
  if (category === "lighting") return ["智能设备","灯具照明"];
  if (category === "security") return ["智能设备","安防监控"];
  if (category === "climate") return ["家用电器","空调与空气处理"];
  const parent = declaredParent ?? physicalClasses.find(([parent]) => parent === category || tags.includes(parent))?.[0];
  return parent ? [parent,"其他"] : ["待分类",""];
}

function classifyFunction(raw, kind, name) {
  if (kind === "motion") {
    const labelMatch = Object.entries(MOTION_EFFECTS).find(([,label]) => name.includes(label));
    const type = raw.effect?.type ?? labelMatch?.[0];
    return [MOTION_CATEGORIES[raw.category] ?? MOTION_CATEGORIES[motionGroups[type]] ?? "待分类", MOTION_EFFECTS[type] ?? ""];
  }
  if (kind === "sidebar-widget") return ["侧栏控件",""];
  return ["", ""];
}

const attributeNames = {boolean:"布尔开关", number:"数值", string:"文本", enum:"枚举", action:"动作"};

function nativeUsage(definition, dataType) {
  const {type,variant} = definition;
  if (type === "number" && variant === "metric") return "状态展示";
  if (type === "button") return dataType === "action" ? "执行动作" : "写入控制";
  if (["toggle","number","slider","select"].includes(type)) return "写入控制";
  return "状态展示";
}

// A library UI can contain both readouts and action nodes. Pair each operation
// with its accepted value type so separate capabilities never form a false match.
function controlUses(node, definition, dataType, uses) {
  if (!node) return;
  const {kind, action} = node;
  if (kind === "native") uses.add(nativeUsage(definition, dataType));
  if (kind === "value" || kind === "unit" || /\{\{(?:value|rawValue|unit)\}\}/.test(node.text || "")) uses.add("状态展示");
  if (dataType === "number") {
    if (kind === "progress") uses.add("状态展示");
    if (kind === "input" || (kind === "button" && ["increment","decrement"].includes(action))) uses.add("写入控制");
  }
  if (dataType === "boolean" && (kind === "switch" || (kind === "button" && action === "toggle") || (kind === "options" && node.mode === "boolean"))) uses.add("写入控制");
  if (dataType === "enum" && kind === "options" && node.mode !== "boolean") uses.add("写入控制");
  if (kind === "button" && action === "press") {
    if (dataType === "action") uses.add("执行动作");
    else if (definition.type === "button" && dataType === "boolean") uses.add("写入控制");
  }
  for (const child of node.children || []) controlUses(child, definition, dataType, uses);
}

function controlBindings(definition) {
  if (!definition || !Array.isArray(definition.dataTypes)) return [{attribute:"未提供", access:"未提供"}];
  if (["divider","container"].includes(definition.type)) return [{attribute:"无需绑定", access:"无需绑定"}];
  const pairs = [];
  for (const dataType of DATA_TYPES) {
    if (!librarySupportsCapability(definition, {kind:dataType, dataType})) continue;
    const uses = new Set();
    controlUses(definition.ui || {kind:"native"}, definition, dataType, uses);
    if (!uses.size) uses.add("");
    for (const access of uses) pairs.push({attribute:attributeNames[dataType],access});
  }
  return pairs.length ? pairs : [{attribute:"未提供",access:"未提供"}];
}

export function classifyResource(item, kind = item?.manifest?.type) {
  const source = item?.manifest ?? item ?? {};
  const physical = kind === "model" || kind === "device-project";
  const wrappedModel = kind === "model" && source.model && typeof source.model === "object";
  const data = item?.sourceTemplate ?? (wrappedModel ? source.model : source);
  const product = physical && (data.product ?? data.resourceSharing?.product);
  const project = kind === "device-project";
  const bound = item?.boundDevices ?? [];
  // A project card's display model may just be its 3D model name. Use the
  // underlying template or a single HA device's declared identity instead.
  const trustedTemplate = project && (item?.sourceTemplate || (!item?.deviceTemplateId && !item?.manifest && data));
  const singleBinding = project && bound.length === 1 ? bound[0] : null;
  const identities = [[product?.brand, product?.model],
    [trustedTemplate?.manufacturer, trustedTemplate?.model],
    [singleBinding?.manufacturer, singleBinding?.model]];
  const [brand,model] = identities.map(pair => pair.map(productIdentity)).find(([b,m]) => b || m) || ["",""];
  const declaredStandard = project && !item?.manifest ? data.isStandardProduct : product?.isStandard;
  const productType = !physical ? "" : declaredStandard === true ? "标准品" : declaredStandard === false ? "通用/非标" : "未标注";
  const name = source.name || data.name || "";
  const tags = (Array.isArray(data.tags) ? data.tags : []).filter(value => typeof value === "string");
  const [category, subcategory] = physical ? classifyPhysical(data, name, tags) : classifyFunction(data, kind, name);
  const bindings = kind === "device-control" ? controlBindings(item?.manifest ? item.entry?.control : data) : [];
  const attributes = options(bindings.map(pair => pair.attribute));
  const accessModes = options(bindings.map(pair => pair.access));
  const searchFields = [name,data.id,data.description,data.resourceSharing?.description,source.author,
    source.id,source.resource,data.subCategory,source.category,source.modelTemplate?.name,source.origin,source.authorName,
    ...(source.searchTerms ?? []),...tags,brand,model,category,categoryAliases[category],subcategory,productType,...attributes,...accessModes];
  const searchText = searchFields.map(normalized).filter(Boolean).join(" ");
  return {category, subcategory, productType, brand, model, searchText, bindings, attributes, accessModes};
}

export function matchesResource(facts, filters = {}, query = filters.query || "") {
  const compactModel = value => normalized(value).normalize("NFKC").replace(/[\s_‐‑‒–—−-]+/gu, "");
  const modelQuery = compactModel(filters.model);
  if (modelQuery && !compactModel(facts.model).includes(modelQuery)) return false;
  for (const key of ["category","subcategory","productType","brand"]) {
    if (filters[key] && normalized(filters[key]) !== normalized(facts[key])) return false;
  }
  if ((filters.attribute || filters.access) && !facts.bindings.some(pair =>
    (!filters.attribute || pair.attribute === filters.attribute) && (!filters.access || pair.access === filters.access))) return false;
  return normalized(query).split(/\s+/u).every(term => facts.searchText.includes(term));
}

export function resourceFilterOptions(facts, filters = {}) {
  const scoped = (keys) => facts.filter(item => keys.every(key => !filters[key] || normalized(item[key]) === normalized(filters[key])));
  const values = (key, scope) => options(scope.map(entry => entry[key]));
  const inCategory = scoped(["category"]);
  const inUse = scoped(["category","subcategory"]);
  const bindings = facts.flatMap(item => item.bindings);
  return {
    categories: values("category",facts),
    subcategories: values("subcategory",inCategory),
    productTypes: values("productType",inUse),
    brands: values("brand",scoped(["category","subcategory","productType"])),
    models: values("model",scoped(["category","subcategory","productType","brand"])),
    attributes: options(bindings.map(pair => pair.attribute)),
    accessModes: options(bindings.filter(pair => !filters.attribute || pair.attribute === filters.attribute).map(pair => pair.access)),
  };
}
