import test from 'node:test';
import assert from 'node:assert/strict';
import {reorderSidebarPages} from '../packages/schema/src/sidebar-order.js';
import {defaultSidebar,normalizeSidebar} from '../packages/schema/src/sidebar.js';
test('navigation drag ordering preserves IDs, bindings and original array; ignores cross-kind drops',()=>{
 const pages=[{id:'home',items:[{id:'weather'}]},{id:'music',items:[]},{id:'room',items:[]}];
 const next=reorderSidebarPages(pages,'room','home');assert.deepEqual(next.map(p=>p.id),['room','home','music']);assert.equal(next[1],pages[0]);assert.equal(pages[0].id,'home');assert.equal(reorderSidebarPages(pages,'widget-id','home'),pages);
});
test('visibility survives sidebar save/export normalization without adding flags to old layouts',()=>{
 const config=defaultSidebar();assert.equal('hidden' in normalizeSidebar(config).pages[0].items[0],false);
 config.pages[0].items[0].hidden=true;assert.equal(normalizeSidebar(config).pages[0].items[0].hidden,true);
});
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {SidebarStore} from '../apps/server/src/sidebar/SidebarStore.js';
test('navigation ordering persists in draft and published layouts after reopening the store',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'ha3d-nav-order-'));
 try{const store=await SidebarStore.create(dir),draft=defaultSidebar();draft.pages.push({...structuredClone(draft.pages[0]),id:'second',name:'Second'});draft.pages=reorderSidebarPages(draft.pages,'second','home');await store.update('test',{revision:0,draft},true);const next=await SidebarStore.create(dir);assert.deepEqual(next.get('test').draft.pages.map(p=>p.id),['second','home']);assert.deepEqual(next.get('test').published.pages.map(p=>p.id),['second','home']);}finally{await rm(dir,{recursive:true,force:true});}
});
