import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultSidebar} from '../packages/schema/src/sidebar.js';
import {exportSidebarPart,importSidebarPart} from '../packages/schema/src/sidebar-transfer.js';
test('widget library export excludes navigation and import preserves pages while remapping collisions',()=>{
 const base=defaultSidebar(),pack=exportSidebarPart(base,'library');
 assert.equal(pack.format,'ha3d-sidebar-library-v1');assert.equal('pages' in pack,false);assert.equal('config' in pack,false);
 const result=importSidebarPart(base,pack,'library');assert.deepEqual(result.pages,base.pages);assert.equal(result.widgets.length,2);assert.notEqual(result.widgets[0].id,result.widgets[1].id);
 assert.throws(()=>importSidebarPart(base,pack,'widget'),/文件类型/);
 assert.throws(()=>importSidebarPart(base,exportSidebarPart(base),'library'),/文件类型/);
 assert.equal(importSidebarPart(base,exportSidebarPart(base,'widget','weather'),'widget').widgets.length,2);
});
