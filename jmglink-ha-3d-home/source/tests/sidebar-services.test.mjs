import test from 'node:test';import assert from 'node:assert/strict';
import {validateSidebarService} from '../apps/server/src/sidebar/SidebarServices.js';
import {operationsWidgetCode} from '../packages/schema/src/operations-widget.js';
const entities=[{entityId:'sensor.cache',attributes:{}},{entityId:'media_player.songloft',attributes:{}}];
test('sidebar service bridge only permits scoped sensor refresh and Songloft services',()=>{
 assert.equal(validateSidebarService({domain:'homeassistant',service:'update_entity',entityId:'sensor.cache'},entities).data.entity_id,'sensor.cache');
 assert.equal(validateSidebarService({domain:'songloft',service:'search',entityId:'media_player.songloft',data:{query:'test',play_first:false}},entities).data.play_first,false);
 for(const body of [{domain:'homeassistant',service:'restart',entityId:'sensor.cache'},{domain:'light',service:'turn_on',entityId:'sensor.cache'},{domain:'media_player',service:'volume_set',entityId:'media_player.songloft',data:{volume_level:2}},{domain:'songloft',service:'search',entityId:'media_player.songloft',data:{entity_id:'light.other'}}])assert.throws(()=>validateSidebarService(body,entities));
});
test('consumables use original HA visibility gates, not guessed thresholds',()=>{
 const settings={master:'binary_sensor.master',offline:'sensor.offline',refresh:'sensor.cache',rules:[{condition:'binary_sensor.show',entity:'sensor.supply',name:'耗材'}]};
 function run(master,gate,value){const nodes=[];const document={getElementById:()=>({replaceChildren(){},append(node){nodes.push(node)}}),createElement:()=>({children:[],append(...items){this.children.push(...items)},setAttribute(){},style:{}})};
 const js=operationsWidgetCode(settings).js;new Function('document','window','parent','entities','crypto',js)(document,{addEventListener(){}},{},[{entityId:settings.master,state:master},{entityId:'binary_sensor.show',state:gate},{entityId:'sensor.supply',state:value,attributes:{}},{entityId:'sensor.offline',state:'2 台离线',attributes:{}},{entityId:'sensor.cache',state:'0',attributes:{}}],{});return nodes;}
 assert.equal(run('off','on','Low').length,1);
 assert.equal(run('on','off','Low')[1].children.length,1);
 assert.equal(run('on','on','Low')[1].children.length,2);
 assert.equal(run('on','on','80')[1].children.length,2); // Original HA helper is authoritative, even for numeric values.
});
