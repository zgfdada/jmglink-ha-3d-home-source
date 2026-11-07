import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import os from 'node:os';import path from 'node:path';
import Fastify from 'fastify';
import {sidebarFloorOptions,emptyFloorSidebar,SIDEBAR_OVERVIEW_ID} from '../packages/schema/src/sidebar-floors.js';
import {defaultSidebar,normalizeSidebar} from '../packages/schema/src/sidebar.js';
import {SidebarStore,registerSidebarRoutes} from '../apps/server/src/sidebar/SidebarStore.js';
import {registerSidebarServices} from '../apps/server/src/sidebar/SidebarServices.js';

test('floor options follow actual project floors and new floors start empty',()=>{
  assert.deepEqual(sidebarFloorOptions([{id:'only',name:'一楼'}]),[{id:'only',label:'F1',name:'一楼'}]);
  assert.deepEqual(sidebarFloorOptions([{id:'a'},{id:'b'},{id:'c'}]).map(f=>f.label),['F1','F2','F3']);
  assert.deepEqual(normalizeSidebar(emptyFloorSidebar()),emptyFloorSidebar());
});

test('legacy F1 persists, each floor drafts/publishes independently and invalid floors are rejected',async()=>{
  const dir=await mkdtemp(path.join(os.tmpdir(),'sidebar-floors-'));const app=Fastify();
  const project={id:'p',floors:[{id:'one'},{id:'two'},{id:'three'}]};
  const projects={getProject:id=>id==='p'?project:undefined,listProjects:()=>[{id:'p'}]};
  try{
    const store=await SidebarStore.create(dir);const legacy=defaultSidebar();legacy.pages[0].name='保留原设计';
    await store.update('p',{revision:0,draft:legacy},true);
    await registerSidebarRoutes(app,store,projects);
    const first=(await app.inject({url:'/api/sidebar/p?floorId=one'})).json();
    assert.deepEqual(first.published,legacy);
    const empty=(await app.inject({url:'/api/sidebar/p?floorId=two'})).json();assert.equal(empty.draft.widgets.length,0);assert.equal(empty.revision,0);
    const second=emptyFloorSidebar();second.pages[0].name='二楼专用';
    const route={method:'PUT',url:'/api/sidebar/p/draft?floorId=two',payload:{revision:0,draft:second}};
    assert.equal((await app.inject(route)).statusCode,200);
    assert.equal((await app.inject({url:'/api/sidebar/p?floorId=two'})).json().published.pages[0].name,'主页');
    assert.equal((await app.inject({...route,url:'/api/sidebar/p/publish?floorId=two',payload:{revision:1,draft:second}})).statusCode,200);
    assert.deepEqual((await app.inject({url:'/api/sidebar/p?floorId=one'})).json().published,legacy);
    const overviewQuery = `?floorId=${encodeURIComponent(SIDEBAR_OVERVIEW_ID)}`;
    assert.deepEqual((await app.inject({url:'/api/sidebar/p'+overviewQuery})).json().published,emptyFloorSidebar());
    const overview = emptyFloorSidebar();
    overview.pages[0].name = '总览专用';
    assert.equal((await app.inject({method:'PUT',url:'/api/sidebar/p/publish'+overviewQuery,payload:{revision:0,draft:overview}})).statusCode,200);
    assert.equal((await app.inject({url:'/api/sidebar/p?floorId=nonexistent'})).statusCode,404);
    const restarted=await SidebarStore.create(dir);
    project.floors.reverse();
    assert.deepEqual(restarted.get(restarted.floorKey(project,'one')).published,legacy);
    assert.equal(restarted.get(restarted.floorKey(project,'two')).published.pages[0].name,'二楼专用');
    assert.deepEqual(restarted.get(restarted.floorKey(project,SIDEBAR_OVERVIEW_ID)).published,overview);
    assert.equal(restarted.get(restarted.floorKey(project,'three')).draft.widgets.length,0);
  }finally{await app.close();await rm(dir,{recursive:true,force:true});}
});

test('a floor cannot execute another floor published widget actions',async()=>{
  const dir=await mkdtemp(path.join(os.tmpdir(),'sidebar-floor-actions-'));const app=Fastify();const original=globalThis.fetch;
  const project={id:'p',floors:[{id:'one'},{id:'two'}]},store=await SidebarStore.create(dir);
  const config=emptyFloorSidebar();config.widgets=[{id:'test',name:'测试',kind:'custom',entityIds:['light.one'],actions:[{id:'on',domain:'light',service:'turn_on',target:'light.one'}],html:'',css:'',js:''}];
  let calls=0;
  globalThis.fetch=async url=>String(url).endsWith('/services')?{ok:true,json:async()=>[{domain:'light',services:{turn_on:{}}}]}:(calls++,{ok:true});
  try{
    await store.update(store.floorKey(project,'one'),{revision:0,draft:config},true);
    registerSidebarServices(app,{config:{ha:{restUrl:'http://ha.test/api',token:'test-only'}},getEntities:()=>[{entityId:'light.one'}]},store,{getProject:()=>project});
    const body={projectId:'p',floorId:'two',workspace:'published',widgetId:'test',actionId:'on'};
    assert.equal((await app.inject({method:'POST',url:'/api/sidebar-services/action',payload:body})).statusCode,404);
    assert.equal(calls,0);
    assert.equal((await app.inject({method:'POST',url:'/api/sidebar-services/action',payload:{...body,floorId:'one'}})).statusCode,200);
    assert.equal(calls,1);
  }finally{globalThis.fetch=original;await app.close();await rm(dir,{recursive:true,force:true});}
});
