import test from 'node:test';import assert from 'node:assert/strict';
import {validateSidebarService,registerSidebarServices} from '../apps/server/src/sidebar/SidebarServices.js';
import Fastify from 'fastify';
import {operationsWidgetCode} from '../packages/schema/src/operations-widget.js';
const entities=[{entityId:'sensor.cache',attributes:{}},{entityId:'media_player.songloft',attributes:{}}];
const catalog=[{domain:'light',service:'turn_on'},{domain:'cover',service:'set_cover_position'}];
const config={widgets:[{id:'generic',entityIds:['light.one','light.two'],actions:[{id:'on',label:'开启',domain:'light',service:'turn_on',target:'all',data:{brightness:100}}]}],pages:[{id:'page',items:[{id:'instance',widgetId:'generic',entityIds:['light.two']}]}]};
const scope={config,catalog,entities:[{entityId:'light.one'},{entityId:'light.two'},{entityId:'cover.other'}]};
test('generic actions are declared by widgets and accept unrelated HA domains without backend changes',()=>{
 const action=validateSidebarService({widgetId:'generic',actionId:'on',data:{brightness:180}},scope);
 assert.deepEqual(action,{domain:'light',service:'turn_on',data:{brightness:180,entity_id:['light.one','light.two']}});
 const other={...scope,config:{widgets:[{id:'curtain',entityIds:['cover.other'],actions:[{id:'position',label:'位置',domain:'cover',service:'set_cover_position',data:{position:30}}]}],pages:[]}};
 assert.equal(validateSidebarService({widgetId:'curtain',actionId:'position'},other).data.entity_id,'cover.other');
});
test('server validates actual saved binding and action declarations, not client claims',()=>{
 assert.equal(validateSidebarService({widgetId:'generic',actionId:'on',pageId:'page',itemId:'instance'},scope).data.entity_id,'light.two');
 for(const body of [{widgetId:'generic',domain:'homeassistant',service:'restart'},{widgetId:'generic',actionId:'on',entityId:'cover.other'},{widgetId:'generic',actionId:'on',data:{entity_id:'cover.other'}},{widgetId:'generic',actionId:'on',data:{area_id:'all'}},{widgetId:'missing',actionId:'on'},{widgetId:'generic',actionId:'on',pageId:'other',itemId:'instance'}])assert.throws(()=>validateSidebarService(body,scope));
 assert.throws(()=>validateSidebarService({widgetId:'generic',actionId:'on'},{...scope,catalog:[]}));
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

test('generic HTTP relay enforces saved workspace, binding and service declaration',async()=>{
 const original=globalThis.fetch;const calls=[];
 globalThis.fetch=async(url,options={})=>{if(String(url).endsWith('/services'))return {ok:true,json:async()=>[{domain:'light',services:{turn_on:{name:'开启'}}}]};calls.push({url,body:JSON.parse(options.body)});return {ok:true};};
 const app=Fastify();registerSidebarServices(app,{config:{ha:{restUrl:'http://ha.test/api',token:'test-only'}},getEntities:()=>scope.entities},{get:()=>({draft:config,published:{widgets:[],pages:[]}})},{getProject:id=>id==='project'?{}:null});
 try {
 const headers={'content-type':'application/json','sec-fetch-site':'same-origin'};
 const payload={projectId:'project',workspace:'draft',widgetId:'generic',actionId:'on',pageId:'page',itemId:'instance'};
 assert.equal((await app.inject({method:'GET',url:'/api/sidebar-services/catalog'})).json().services[0].domain,'light');
 assert.equal((await app.inject({method:'POST',url:'/api/sidebar-services/action',headers,payload})).statusCode,200);
 assert.equal(calls[0].body.entity_id,'light.two');
 for(const [extra,status]of [[{entityId:'cover.other'},403],[{workspace:'published'},404],[{projectId:'other'},404]])assert.equal((await app.inject({method:'POST',url:'/api/sidebar-services/action',headers,payload:{...payload,...extra}})).statusCode,status);
 assert.equal((await app.inject({method:'POST',url:'/api/sidebar-services/action',headers:{...headers,'sec-fetch-site':'cross-site'},payload})).statusCode,403);
 assert.equal(calls.length,1);
 } finally {globalThis.fetch=original;await app.close();}
});
