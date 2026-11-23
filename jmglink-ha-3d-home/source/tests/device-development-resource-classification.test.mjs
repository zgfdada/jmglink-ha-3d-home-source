import test from "node:test";
import assert from "node:assert/strict";
import {classifyResource, matchesResource, resourceFilterOptions} from "../apps/web/src/app/device-development-center/resource-classification.js";
import {applyBasicProjectDraft} from "../apps/web/src/app/device-development-center/project-basic.js";
import {normalizeDeviceTemplate} from "../apps/server/src/device-platform/devicePlatformSchema.js";

test("physical models can be used as furniture without becoming furniture", () => {
  for (const [name,category,subcategory] of [
    ["电动投影幕布","影音设备","投影与幕布"], ["电视柜","家具","柜体与收纳"],
    ["餐厅挂画 · 山靜日長","家居装饰","挂画与墙饰"], ["阔叶绿植·浅陶盆","家居装饰","绿植花艺"],
    ["汽车模型","交通工具","汽车"], ["桌面摄像头","智能设备","安防监控"], ["A","待分类",""],
    ["落地灯","智能设备","灯具照明"], ["圆形吸顶灯","智能设备","灯具照明"], ["轨道灯","智能设备","灯具照明"],
  ]) {
    const facts = classifyResource({name, model:{name, furnitureEnabled:true, furnitureKind:"custom_model"}}, "model");
    assert.equal(facts.category, category, name);
    assert.equal(facts.subcategory, subcategory, name);
  }
});

test("explicit furniture kind and author-selected device category have priority", () => {
  assert.equal(classifyResource({name:"造型冰箱",furnitureEnabled:true,furnitureKind:"cabinet"},"model").subcategory,"柜体与收纳");
  assert.equal(classifyResource({name:"我的设备",sourceTemplate:{category:"appliance",subCategory:"洗衣机"}},"device-project").subcategory,"洗衣与烘干");
  assert.equal(classifyResource({name:"夜灯",sourceTemplate:{category:"lighting",subCategory:"其他照明"}},"device-project").subcategory,"灯具照明");
});

test("standard, nonstandard and untagged are distinct and display fallbacks have no brand or SKU", () => {
  const product = {isStandard:true, brand:"厂商甲", model:"AC-128"};
  const card = classifyResource({name:"卧室空调",model:{resourceSharing:{product}}},"model");
  const online = classifyResource({manifest:{name:"卧室空调",type:"model",product}});
  assert.deepEqual([card.brand, card.model, card.productType], ["厂商甲","AC-128","标准品"]);
  assert.deepEqual([online.brand,online.model,online.productType], [card.brand,card.model,card.productType]);
  assert.equal(classifyResource({product:{isStandard:false},name:"绿植"},"model").productType,"通用/非标");
  const project = classifyResource({deviceTemplateId:"a",manufacturer:"自定义设备项目",model:"渲染用模型",sourceTemplate:{name:"装置"}},"device-project");
  assert.deepEqual([project.brand,project.model,project.productType], ["","","未标注"]);
  const authored = classifyResource({name:"我的试验装置",manufacturer:"厂家乙",model:"X-2"},"device-project");
  assert.deepEqual([authored.brand,authored.model,authored.productType], ["厂家乙","X-2","未标注"]);
  const conflicting = classifyResource({sourceTemplate:{manufacturer:"厂家甲"},
    boundDevices:[{manufacturer:"厂家乙",model:"X-2"}]},"device-project");
  assert.deepEqual([conflicting.brand,conflicting.model],["厂家甲",""]);
  assert.equal(classifyResource({sourceTemplate:{manufacturer:"用户配置",model:"浅色音箱"}},"device-project").brand,"");
});

test("search combines multiple words across name, category, brand and SKU using Unicode normalization", () => {
  const item = classifyResource({manifest:{name:"卧室空调", type:"model", description:"壁装", product:{isStandard:true,brand:"测试厂",model:"AC-128"}}});
  assert.ok(matchesResource(item,{query:"测试厂  ＡＣ-１２８ 家电 壁装"}));
  assert.ok(!matchesResource(item,{query:"测试厂 AC-128 花瓶"}));
  assert.ok(!matchesResource(item,{brand:"另一家",query:"卧室"}));
});

test("saving project details preserves legacy records and explicitly sets, clears or rejects a product declaration", () => {
  const old = normalizeDeviceTemplate({id:"custom.test",name:"设备",description:"保留说明",manufacturer:"",model:""});
  assert.equal(Object.hasOwn(old,"isStandardProduct"),false);
  const save = (record, patch) => normalizeDeviceTemplate(JSON.parse(JSON.stringify(applyBasicProjectDraft(record,{...record,...patch}))));
  assert.equal(save(old,{name:"改名"}).name,"改名");
  assert.throws(() => save(old,{isStandardProduct:true}),/填写厂商和产品型号/);
  assert.throws(() => save(old,{isStandardProduct:true,manufacturer:"用户配置",model:"X1"}),/填写厂商和产品型号/);
  const standard = save(old,{isStandardProduct:true,manufacturer:"品牌甲",model:"X1"});
  assert.equal(standard.description,old.description);
  assert.equal(classifyResource(standard,"device-project").productType,"标准品");
  const general = save(standard,{isStandardProduct:false,manufacturer:"",model:""});
  assert.equal(classifyResource(general,"device-project").productType,"通用/非标");
  const cleared = save(standard,{isStandardProduct:undefined});
  assert.equal(Object.hasOwn(cleared,"isStandardProduct"),false);
  assert.equal(classifyResource(cleared,"device-project").productType,"未标注");
});

test("dependent options only contain values available in their current branch", () => {
  const a = (name,brand,model) => classifyResource({name,product:{isStandard:true,brand,model}},"model");
  const records = [a("洗衣机","A","X"),a("冰箱","A","Y"),a("壁灯","B","Z"),a("冰箱","a","Y")];
  const options = resourceFilterOptions(records,{category:"家用电器",subcategory:"冰箱与冷藏",productType:"标准品",brand:"a"});
  assert.deepEqual(options.brands,["A"]);
  assert.deepEqual(options.models,["Y"]);
  assert.ok(options.subcategories.includes("洗衣与烘干"));
});

test("controls bind multiple declared attributes, with separate readout, control and action uses", () => {
  const item = {name:"按钮",type:"button",dataTypes:["action","boolean"],ui:{kind:"native"}};
  const capture = classifyResource(item,"device-control");
  assert.ok(matchesResource(capture,{attribute:"动作",access:"执行动作"}));
  assert.ok(matchesResource(capture,{attribute:"布尔开关",access:"写入控制"}));
  assert.ok(!matchesResource(capture,{attribute:"布尔开关",access:"执行动作"}));
  const network = classifyResource({manifest:{name:"按钮",type:"device-control"},entry:{control:item}});
  assert.deepEqual(network.bindings,capture.bindings);
  const unknown = classifyResource({manifest:{name:"自定义开关",type:"device-control"}});
  assert.deepEqual(unknown.attributes,["未提供"]);
  assert.ok(!matchesResource(unknown,{attribute:"布尔开关"}));
  const mixed = classifyResource({type:"status",dataTypes:["boolean","number"],ui:{kind:"row",children:[{kind:"progress"},{kind:"switch"}]}},"device-control");
  assert.ok(matchesResource(mixed,{attribute:"数值",access:"状态展示"}));
  assert.ok(!matchesResource(mixed,{attribute:"布尔开关",access:"状态展示"}));
  const layout = classifyResource({type:"divider",dataTypes:["number","string"]},"device-control");
  assert.deepEqual(layout.attributes,["无需绑定"]);
  const opts = resourceFilterOptions([capture,mixed,layout],{attribute:"布尔开关"});
  assert.deepEqual(opts.accessModes,["写入控制"]);
  const metric = classifyResource({type:"number",variant:"metric",dataTypes:["number"],ui:{kind:"native"}},"device-control");
  assert.deepEqual(metric.bindings,[{attribute:"数值",access:"状态展示"}]);
});

test("motions retain their authored functional categories", () => {
  const pulse = classifyResource({name:"影音浅蓝扩散音波",effect:{type:"scan"},category:"light"},"motion");
  assert.deepEqual([pulse.category,pulse.subcategory],["光效","表面扫光"]);
  assert.equal(classifyResource({manifest:{name:"设备附件",type:"motion"}}).category,"待分类");
});
