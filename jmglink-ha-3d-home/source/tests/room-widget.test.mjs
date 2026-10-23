import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { roomWidgetCode } from '../packages/schema/src/room-widget.js';
import { normalizeWidgetActions } from '../packages/schema/src/widget-actions.js';

class Element {
  constructor(tag) { this.tag=tag;this.children=[];this.style={};this.attributes={}; }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children=children; }
  setAttribute(k,v) { this.attributes[k]=v; }
  getBoundingClientRect() { return {width:300}; }
}
function setup(expanded=false, overrides={}, extraEntities=[]) {
  const root=new Element('div'), calls=[];
  let update; const frames = new Map(); let frameId = 0, now = 0;
  const settings={name:'测试房间',rooms:[{name:'测试房间',enabled:true},{name:'未集成',enabled:false}],lightGroup:'light.group',curtain:'cover.test',climate:'climate.test',actions:[{id:'lights-on',domain:'button',service:'press',target:'button.test',data:{}},{id:'curtain-position',domain:'cover',service:'set_cover_position',target:'cover.test',data:{}}]};
  Object.assign(settings, overrides);
  const entities=[{entityId:'light.group',state:'on',attributes:{entity_id:['light.one','light.two']}},{entityId:'light.one',state:'on',attributes:{}},{entityId:'light.two',state:'off',attributes:{}},{entityId:'cover.test',state:'open',attributes:{current_position:50}},{entityId:'climate.test',state:'off',attributes:{temperature:26,current_temperature:24.5,hvac_modes:['off','cool'],fan_modes:['auto']}}];
  entities.push(...extraEntities);
  entities.push({entityId:'button.test',state:'unknown',attributes:{}});
  const ha={getEntity:id=>entities.find(e=>e.entityId===id),onStateChange:fn=>{update=fn;},runAction:async(...args)=>calls.push(args),expand:section=>calls.push(['expand',section])};
  vm.runInNewContext(roomWidgetCode(settings).js,{document:{getElementById:()=>root,createElement:tag=>new Element(tag)},ha,performance:{now:()=>now},requestAnimationFrame:fn=>{frames.set(++frameId,fn);return frameId;},cancelAnimationFrame:id=>frames.delete(id),viewContext:{expanded}});
  const all=()=>{const result=[];function walk(e){result.push(e);e.children.forEach(walk);}walk(root);return result;};
  return {root,calls,all,entities,update,tick:time=>{now=time;const batch=[...frames.values()];frames.clear();batch.forEach(fn=>fn(time));}};
}
test('room renders real bound light count, disabled unintegrated rooms, and symmetric power controls',()=>{
  const x=setup(), all=x.all();
  assert.ok(all.some(e=>e.textContent==='☀ 灯光 · 已开启 1'));
  assert.equal(all.find(e=>e.textContent==='未集成').disabled,true);
  const pair=all.find(e=>e.className==='grid pair');
  assert.deepEqual(pair.children.map(e=>e.textContent),['☼ 一键开灯','⏻ 一键关灯']);
  assert.equal(pair.children[0].disabled,false,'stateless button unknown is usable');
  assert.equal(x.calls.length,0);
});
test('curtain drag is local until release and state refresh does not interrupt dragging',async()=>{
  const x=setup(), range=x.all().find(e=>e.attributes['aria-label']==='左右对开窗帘开合度');
  range.value='72';range.oninput();x.update();assert.ok(x.all().includes(range));assert.equal(x.calls.length,0);
  range.onchange();await Promise.resolve();await Promise.resolve();
  assert.equal(x.calls[0][0],'curtain-position');assert.equal(x.calls[0][1].position,72);
});
test('expanded room presents climate details only and default sample contains no private entity bindings',()=>{
  const x=setup(true), all=x.all();
  assert.ok(all.some(e=>e.textContent==='❄ 测试房间空调'));
  assert.ok(!all.some(e=>e.textContent==='房间'));
  assert.ok(!all.some(e=>e.tag==='select'));
  assert.ok(all.some(e=>e.textContent==='❄ 制冷'));
  assert.deepEqual(normalizeWidgetActions(roomWidgetCode().actions),[]);
});

test('curtain handle press does not jump and drag displacement is relative to starting position',()=>{
 const x=setup(), handle=x.all().find(e=>e.attributes['aria-label']==='右侧窗帘拖柄'), track=x.all().find(e=>e.className==='track');
 track.getBoundingClientRect=()=>({width:300});handle.setPointerCapture=()=>{};handle.releasePointerCapture=()=>{};
 handle.onpointerdown({pointerId:1,clientX:180,preventDefault(){}});
 handle.onpointerup({pointerId:1});assert.equal(x.calls.length,0);
 handle.onpointerdown({pointerId:2,clientX:180,preventDefault(){}});
 handle.onpointermove({pointerId:2,clientX:192.6});
 handle.onpointerup({pointerId:2});assert.equal(x.calls[0][1].position,60);
});

test('curtain moving state animates intermediate positions and continues across unrelated refresh',()=>{
 const x=setup(); x.entities.find(e=>e.entityId==='cover.test').state='opening';x.update();
 x.tick(4500);
 assert.ok(x.all().some(e=>e.textContent?.startsWith('开合度 75%')));
 x.update();x.tick(6750);
 assert.ok(x.all().some(e=>e.textContent?.startsWith('开合度 88%')));
 assert.equal(x.calls.length,0);
});

test('final-position-only cover reports animate slowly through intermediate positions',()=>{
 const x=setup();x.entities.find(e=>e.entityId==='cover.test').attributes.current_position=100;x.update();
 x.tick(4500);assert.ok(x.all().some(e=>e.textContent?.startsWith('开合度 75%')));
 x.tick(9000);assert.ok(x.all().some(e=>e.textContent?.startsWith('开合度 100%')));
 assert.equal(x.calls.length,0);
});

test('room switching displays only the selected room without individual light controls',()=>{
 const rooms=[{name:'餐厅',enabled:true},{name:'书房',enabled:true}];
 const x=setup(false,{roomConfigurations:[{name:'餐厅',rooms,actions:[],parameters:[{label:'睡眠亮度微调',entity:'number.test'}]},{name:'书房',rooms,actions:[],curtains:[{name:'遮光帘',entity:'cover.test'},{name:'纱帘',entity:'cover.test'}]}]});
 assert.ok(x.all().some(e=>e.textContent==='睡眠亮度微调'));
 x.all().find(e=>e.tag==='button'&&e.textContent==='书房').onclick();
 assert.ok(x.all().some(e=>e.textContent==='▥ 遮光帘'));
 assert.ok(x.all().some(e=>e.textContent==='▥ 纱帘'));
 assert.ok(!x.all().some(e=>e.textContent==='睡眠亮度微调'));
 assert.ok(!x.all().some(e=>e.textContent?.includes('灯具')));
 assert.ok(!x.all().some(e=>e.textContent?.includes('空调')));
 assert.equal(x.calls.length,0);
});

test('two curtain layers keep independent animation positions',()=>{
 const x=setup(false,{curtains:[{name:'遮光帘',entity:'cover.test'},{name:'纱帘',entity:'cover.sheer'}]},[{entityId:'cover.sheer',state:'open',attributes:{current_position:50}}]);
 x.entities.find(e=>e.entityId==='cover.test').attributes.current_position=100;x.update();x.tick(4500);
 assert.ok(x.all().some(e=>e.textContent?.startsWith('开合度 75%')));
 assert.ok(x.all().some(e=>e.textContent?.startsWith('开合度 50%')));
});
