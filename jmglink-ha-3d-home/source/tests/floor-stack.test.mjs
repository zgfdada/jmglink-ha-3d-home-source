import test from 'node:test';
import assert from 'node:assert/strict';
import {floorStackGap} from '../apps/web/src/domain/floor-stack.js';

test('总览按户型尺度拉开楼层，编辑布局保持原值',()=>{
  const floors=[{walls:[{start:[-10,-6],end:[10,6]}],height:2.8}];
  const before=structuredClone(floors);
  assert.equal(floorStackGap(floors),6);
  assert.equal(floorStackGap(floors,false),1.15);
  assert.equal(floorStackGap([]),2.6);
  assert.equal(floorStackGap([{walls:[{start:[0,0],end:[100,100]}]}]),6);
  assert.equal(floorStackGap([{walls:[{start:[0,0],end:[10.2,11.4]}]}]),3.42);
  assert.deepEqual(floors,before);
});
