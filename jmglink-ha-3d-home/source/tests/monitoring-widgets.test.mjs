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
