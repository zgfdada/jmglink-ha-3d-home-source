import test from "node:test";
import assert from "node:assert/strict";
import { boundPanelStates,samplePanelStates,panelOptions,panelValue,panelVariant,controlVisible } from "../apps/web/src/domain/device-panel.js";
const capabilities=[{capabilityId:"time",kind:"number",dataType:"number",access:"read",unit:"min"},{capabilityId:"mode",kind:"enum",access:"read-write",enumValues:[{value:"a",label:"标准",source:"manual"}]}];
test("模拟与真实使用相同单位、数值格式和控件外观",()=>{
 const binding={capabilityMappings:{time:{entityId:"sensor.time",attribute:"state"},mode:{entityId:"select.mode",attribute:"state"}}};
 const live=boundPanelStates({capabilities},binding,[{entityId:"sensor.time",state:"38",attributes:{unit_of_measurement:"min"}},{entityId:"select.mode",state:"a",attributes:{options:["a"]}}]);
 const simulated=samplePanelStates(capabilities,{time:38,mode:"a"});
 assert.equal(panelValue(live.time),panelValue(simulated.time));
 assert.equal(live.time.unit,simulated.time.unit);
 assert.equal(live.time.access,"read");
 assert.equal(panelVariant({type:"number",variant:"metric"}),"metric");
 assert.deepEqual(panelOptions({},live.mode),panelOptions({},simulated.mode));
 assert.equal(panelValue(live.mode),panelValue(simulated.mode));
});
test("属性映射、未知值及失效实体不伪装成数字0",()=>{
 const states=boundPanelStates({capabilities},{capabilityMappings:{time:{entityId:"sensor.time",attribute:"remaining"}}},[{entityId:"sensor.time",state:"on",attributes:{remaining:12}}]);
 assert.equal(states.time.state,12);
 for(const state of ["unknown","unavailable",undefined,null])assert.equal(panelValue({state}),"—");
 assert.equal(boundPanelStates({capabilities},{capabilityMappings:{time:{entityId:"sensor.deleted"}}},[]).time.available,false);
});
test("枚举不截断为四项，遵守隐藏、排序、中文别名和显示条件",()=>{
 const state={options:["a","b","c","d","e","f"]};
 assert.equal(panelOptions({},state).length,6);
 const control={optionSource:"custom",optionOverrides:[{value:"a",hidden:true},{value:"f",label:"自定义",order:-1}]};
 assert.equal(panelOptions(control,state).length,5);
 assert.equal(panelOptions(control,state)[0].label,"自定义");
 assert.equal(controlVisible({visibleWhen:"power=on"},{power:{state:"on"}}),true);
 assert.equal(controlVisible({visibleWhen:"power=on"},{power:{state:"off"}}),false);
});
