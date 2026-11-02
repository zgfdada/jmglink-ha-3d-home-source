import test from 'node:test';
import assert from 'node:assert/strict';
import {hostResourcesWidgetCode,eventsWidgetCode} from '../packages/schema/src/monitoring-widgets.js';
import {offlineStatisticsWidgetCode,consumablesWidgetCode} from '../packages/schema/src/operations-widget.js';
function harness(code,entities){
 const node=()=>({children:[],style:{},append(...items){this.children.push(...items)},replaceChildren(){this.children=[]},setAttribute(){}});
 const root=node();let change;let handler;const calls=[];const ha={getEntity:id=>entities.find(e=>e.entityId===id),get entity(){return entities[0]},onStateChange:fn=>change=fn,runAction:async(...args)=>{calls.push(args)}};
 const document={getElementById:()=>root,createElement:node};const window={addEventListener:(_,fn)=>handler=fn};
 new Function('document','window','entities','ha',code.js)(document,window,entities,ha);
 const flatten=n=>[n,...n.children.flatMap(flatten)];return {root,calls,nodes:()=>flatten(root),text:()=>flatten(root).map(n=>n.textContent||'').join(' '),update:()=>{change?.();handler?.({detail:{entities}})}};
}
test('event log renders plain original records safely without fabricated categories or delivery claims',()=>{
 const e={entityId:'sensor.events',state:'1',attributes:{entries:[{time:'10:00',title:'<img onerror=alert(1)>',message:'door',source:'HA',status:'sent_to_ha'}]}};
 const h=harness(eventsWidgetCode({entity:e.entityId}),[e]);assert.match(h.text(),/已交给 HA/);assert.match(h.text(),/<img/);assert.doesNotMatch(h.text(),/已发送到手机|待查看|分类/);e.attributes.entries=[];h.update();assert.match(h.text(),/暂无移动端通知/);
});
test('host metrics use explicitly configured whole-host entities and never present missing readings as zero',()=>{
 const e=[{entityId:'sensor.cpu',state:'25'},{entityId:'sensor.mem',state:'86.6'},{entityId:'sensor.core',state:'99'}];
 const h=harness(hostResourcesWidgetCode({cpu:'sensor.cpu',memory:'sensor.mem'}),e);assert.match(h.text(),/25%/);assert.match(h.text(),/86.6%/);assert.doesNotMatch(h.text(),/99%/);e[0].state='unavailable';h.update();assert.match(h.text(),/—/);
});
test('offline refresh targets the cache explicitly and independent consumables do not render offline controls',async()=>{
 const settings={offline:'sensor.offline',refresh:'sensor.cache',master:'binary_sensor.show',rules:[]};
 const code=offlineStatisticsWidgetCode(settings);assert.equal(code.actions[0].target,'sensor.cache');
 const e=[{entityId:settings.offline,state:'正在等待首次统计',attributes:{}},{entityId:settings.refresh,state:'2 台',attributes:{}},{entityId:settings.master,state:'on'}];
 const h=harness(code,e);const button=h.nodes().find(n=>n.className==='icon-button');h.update();assert.equal(h.nodes().find(n=>n.className==='icon-button'),button,'unchanged HA snapshots must not interrupt a click');await button.onclick();assert.deepEqual(h.calls[0],['refresh',{},'sensor.cache']);assert.match(h.text(),/正在等待/);e[0].state='3 台';h.update();assert.match(h.text(),/统计已更新/);await h.nodes().find(n=>n.className==='icon-button').onclick();assert.match(h.text(),/统计无变化/);
 const supplies=harness(consumablesWidgetCode(settings),e);assert.match(supplies.text(),/待补充耗材/);assert.doesNotMatch(supplies.text(),/离线设备统计|手动更新/);
});


test('battery and detergent icons track remaining level and color through live entity updates',()=>{
 const settings={master:'binary_sensor.show',rules:[{name:'门锁电池',entity:'sensor.battery',condition:'binary_sensor.low'},{name:'洗涤剂',entity:'sensor.detergent',condition:'binary_sensor.low'}]};
 const entities=[{entityId:settings.master,state:'on'},{entityId:'binary_sensor.low',state:'on'},{entityId:'sensor.battery',state:'49',attributes:{device_class:'battery',unit_of_measurement:'%'}},{entityId:'sensor.detergent',state:'Low',attributes:{}}];
 const h=harness(consumablesWidgetCode(settings),entities);
 assert.equal(h.nodes().find(n=>n.className==='battery-fill').style.width,'49%');
 assert.equal(h.nodes().find(n=>n.className==='battery-fill').style.background,'hsl(58.8 75% 45%)');
 assert.equal(h.nodes().find(n=>n.className==='bottle-fill').style.height,'0%');
 entities[2].state='100';entities[3].state='0';entities[3].attributes.unit_of_measurement='%';h.update();
 assert.equal(h.nodes().find(n=>n.className==='battery-fill').style.width,'100%');
 assert.equal(h.nodes().find(n=>n.className==='battery-fill').style.background,'hsl(120 75% 45%)');
 assert.equal(h.nodes().find(n=>n.className==='bottle-fill').style.background,'hsl(0 75% 45%)');
 entities[2].state='unavailable';h.update();assert.equal(h.nodes().find(n=>n.className==='battery-fill').style.background,'#94a3b8');
});

test('P2: consumable fill normalizes only percentages or explicit same-unit capacity, never voltage or raw volume',()=>{
 const rule={name:'洗涤剂',entity:'sensor.supply',condition:'binary_sensor.low'};
 const settings={master:'binary_sensor.show',rules:[rule]};
 const entities=[{entityId:settings.master,state:'on'},{entityId:rule.condition,state:'on'},{entityId:rule.entity,state:'350',attributes:{unit_of_measurement:'mL'}}];
 const h=harness(consumablesWidgetCode(settings),entities);
 assert.equal(h.nodes().find(n=>n.className==='bottle-fill').style.height,'0%');
 assert.equal(h.nodes().find(n=>n.className==='bottle-fill').style.background,'#94a3b8');
 const configured=harness(consumablesWidgetCode({...settings,rules:[{...rule,capacity:1000,capacityUnit:'mL'}]}),entities);
 assert.equal(configured.nodes().find(n=>n.className==='bottle-fill').style.height,'35%');
 entities[2].attributes.unit_of_measurement='g';configured.update();assert.equal(configured.nodes().find(n=>n.className==='bottle-fill').style.height,'0%');
 entities[2].attributes.unit_of_measurement='%';entities[2].state='49';h.update();assert.equal(h.nodes().find(n=>n.className==='bottle-fill').style.height,'49%');
 entities[2].state='150';h.update();assert.equal(h.nodes().find(n=>n.className==='bottle-fill').style.background,'#94a3b8');
 entities[2].state='Low';h.update();assert.equal(h.nodes().find(n=>n.className==='bottle-fill').style.height,'0%');assert.notEqual(h.nodes().find(n=>n.className==='bottle-fill').style.background,'#94a3b8');
 const battery={...rule,name:'电池',entity:'sensor.battery'};entities[2]={entityId:battery.entity,state:'3.7',attributes:{device_class:'battery',unit_of_measurement:'V'}};
 const volts=harness(consumablesWidgetCode({...settings,rules:[battery]}),entities);assert.equal(volts.nodes().find(n=>n.className==='battery-fill').style.width,'0%');
});
