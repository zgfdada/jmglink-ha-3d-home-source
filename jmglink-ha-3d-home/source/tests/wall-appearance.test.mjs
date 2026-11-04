import test from 'node:test';
import assert from 'node:assert/strict';
import {wallTintBlend} from '../apps/web/src/domain/wall-appearance.js';
test('0% 透明度恢复原墙面，进入透明状态平滑过渡到乳白',()=>{
 assert.equal(wallTintBlend(1),0);
 assert.equal(wallTintBlend(.55),1);
 assert.equal(wallTintBlend(0),1);
 assert.ok(Math.abs(wallTintBlend(.9)-.5)<1e-12);
 assert.equal(wallTintBlend(.55,false),0);
 assert.equal(wallTintBlend(.55,true,true),0);
 assert.equal(wallTintBlend(NaN),0);
});
