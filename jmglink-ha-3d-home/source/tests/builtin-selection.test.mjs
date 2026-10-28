import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import os from 'node:os';import path from 'node:path';
import {builtinControls,legacyBuiltinControls,CONTROL_PACKAGE_FORMAT,resolveLibraryControl} from '../packages/schema/src/control-library.js';
import {ControlLibraryStore} from '../apps/server/src/control-library/ControlLibraryStore.js';
test('精简库升级移除多余内置项，保留自定义和面板旧样式兼容',async()=>{const dir=await mkdtemp(path.join(os.tmpdir(),'ha3d-controls-'));try{const custom={...builtinControls()[0],id:'custom.keep',builtin:false};await writeFile(path.join(dir,'control-library.json'),JSON.stringify({format:CONTROL_PACKAGE_FORMAT,schemaVersion:1,controls:[...legacyBuiltinControls(),custom]}));const store=await ControlLibraryStore.create(dir);assert.equal(store.list().filter(c=>c.builtin).length,12);assert.ok(store.list().some(c=>c.id==='custom.keep'));assert.equal(resolveLibraryControl({type:'toggle',variant:'switch'}).id,'builtin.toggle.switch');assert.equal((await ControlLibraryStore.create(dir)).list().length,13);const divider=builtinControls().find(c=>c.id==='builtin.divider.dashed');assert.equal(divider.version,2);assert.equal(divider.ui.kind,'column');}finally{await rm(dir,{recursive:true,force:true})}});
