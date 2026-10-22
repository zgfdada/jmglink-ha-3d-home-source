import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveSidebarEntities} from '../packages/schema/src/sidebar-bindings.js';
import {defaultSidebar,normalizeSidebar} from '../packages/schema/src/sidebar.js';
const entities=[{entityId:'sensor.a',attributes:{monthlist:[]}},{entityId:'sensor.b',attributes:{monthlist:[]}},{entityId:'weather.a',attributes:{}}];
const widget={entityDomain:'sensor',entityAttribute:'monthlist'};
test('automatic multi binding and exact overrides share one resolver',()=>{
 assert.deepEqual(resolveSidebarEntities(widget,{},entities).ids,['sensor.a','sensor.b']);
 assert.deepEqual(resolveSidebarEntities({...widget,entityIds:['sensor.a']},{},entities).ids,['sensor.a']);
 assert.deepEqual(resolveSidebarEntities({...widget,entityIds:['sensor.a']},{entityIds:['sensor.b']},entities).ids,['sensor.b']);
 assert.deepEqual(resolveSidebarEntities(widget,{entityIds:[]},entities).ids,[]);
 assert.deepEqual(resolveSidebarEntities({entityDomain:'weather'},{},entities).ids,['weather.a']);
 assert.deepEqual(resolveSidebarEntities(widget,{entityId:'sensor.b'},entities).ids,['sensor.b']);
});
test('multi bindings survive save and import, including explicit empty selection',()=>{
 const config=defaultSidebar();config.widgets[1].entityIds=['sensor.a','sensor.b'];config.pages[0].items[1].entityIds=[];
 const saved=normalizeSidebar(config);assert.deepEqual(saved.widgets[1].entityIds,['sensor.a','sensor.b']);assert.deepEqual(saved.pages[0].items[1].entityIds,[]);
 assert.throws(()=>normalizeSidebar({...config,widgets:[{...config.widgets[0],entityIds:'bad'}]}));
});
