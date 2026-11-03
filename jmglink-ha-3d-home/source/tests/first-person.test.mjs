import test from 'node:test';
import assert from 'node:assert/strict';
import {PerspectiveCamera,Vector3} from 'three';
import {readFile} from 'node:fs/promises';
import {createWalkNavigation,canWalkAt,walkStep,walkingDelta,segmentDistance} from '../apps/web/src/domain/first-person-navigation.js';
import {captureWalkCamera,restoreWalkCamera,applyWalkPose} from '../apps/web/src/domain/first-person-camera.js';

function floor(){return {height:2.8,walls:[
  {id:'north',start:[0,0],end:[8,0],height:2.8,thickness:.12},
  {id:'east',start:[8,0],end:[8,6],height:2.8,thickness:.12},
  {id:'south',start:[8,6],end:[0,6],height:2.8,thickness:.12},
  {id:'west',start:[0,6],end:[0,0],height:2.8,thickness:.12},
  {id:'middle',start:[4,0],end:[4,6],height:2.8,thickness:.12},
],openings:[{id:'door',wallId:'middle',type:'door',offset:3,width:1,height:2.1,bottom:0}],rooms:[{polygon:[[0,0],[4,0],[4,6],[0,6]]},{polygon:[[4,0],[8,0],[8,6],[4,6]]}],furniture:[]};}
test('站立点拒绝墙体、外界和家具，房间空地可选',()=>{
  const f=floor();f.furniture=[{id:'bed',position:[2,2],width:2,depth:1,height:.7}];
  const nav=createWalkNavigation(f);assert.deepEqual(nav.center,[4,3]);assert.equal(nav.eyeHeight,1.6);
  assert.equal(canWalkAt(nav,[1,4]),true);assert.equal(canWalkAt(nav,[4,1]),false);
  assert.equal(canWalkAt(nav,[2,2]),false);assert.equal(canWalkAt(nav,[9,3]),false);assert.equal(canWalkAt(nav,[NaN,3]),false);
});
test('足够高的门洞可双向穿过，窗户和低门洞不放行',()=>{
  const f=floor();let nav=createWalkNavigation(f);
  assert.equal(canWalkAt(nav,[4,3]),true);assert.ok(walkStep(nav,[3.5,3],[1,0])[0]>4);
  assert.ok(walkStep(nav,[4.5,3],[-1,0])[0]<4);
  f.openings[0].type='window';assert.equal(canWalkAt(createWalkNavigation(f),[4,3]),false);
  f.openings[0].type='door';f.openings[0].height=1.4;assert.equal(canWalkAt(createWalkNavigation(f),[4,3]),false);
});
test('连续分步阻止高速穿墙并允许沿墙滑动，拐角不漏过',()=>{
  const nav=createWalkNavigation(floor());const blocked=walkStep(nav,[2,1],[4,0]);assert.ok(blocked[0]<3.8);
  const slide=walkStep(nav,[3.7,1],[1,.5]);assert.ok(slide[0]<3.8);assert.ok(slide[1]>1.3);
  const corner=walkStep(nav,[.5,.5],[-2,-2]);assert.equal(canWalkAt(nav,corner),true);assert.ok(corner[0]>=.23&&corner[1]>=.23);
});
test('旋转家具按局部轮廓阻挡，高挂家具不挡人物',()=>{
  const f=floor();f.furniture=[{id:'cabinet',position:[2,3],rotation:Math.PI/2,width:2,depth:.4,height:1.2}];
  let nav=createWalkNavigation(f);assert.equal(canWalkAt(nav,[2,3.8]),false);assert.equal(canWalkAt(nav,[2.8,3]),true);
  nav=createWalkNavigation(f,{elevations:new Map([['furniture:cabinet',2.2]])});assert.equal(canWalkAt(nav,[2,3]),true);
});
test('虚拟墙不碰撞，非矩形房间空缺不可进入，空墙楼层采用场景原点',()=>{
  const f=floor();f.walls.at(-1).virtual=true;assert.equal(canWalkAt(createWalkNavigation(f),[4,1]),true);
  f.rooms=[{polygon:[[0,0],[8,0],[8,2],[2,2],[2,6],[0,6]]}];
  const nav=createWalkNavigation(f);assert.equal(canWalkAt(nav,[6,5]),false);assert.equal(canWalkAt(nav,[1,4]),true);
  assert.deepEqual(createWalkNavigation({walls:[],rooms:[{polygon:[[10,10],[12,10],[12,12],[10,12]]}],furniture:[]}).center,[4,3]);
});
test('按时间和朝向移动、斜向不加速、掉帧限步长',()=>{
  const straight=walkingDelta(1,0,0,.05),diagonal=walkingDelta(1,1,0,.05);
  assert.ok(Math.abs(Math.hypot(...straight)-Math.hypot(...diagonal))<1e-10);
  assert.ok(straight[1]<0);assert.ok(walkingDelta(1,0,Math.PI/2,.05)[0]<0);
  assert.deepEqual(walkingDelta(1,0,0,10),straight);assert.deepEqual(walkingDelta(0,0,0,.05),[0,0]);
  assert.equal(segmentDistance([2,1],[0,0],[4,0]),1);
});
test('相机眼高、地面坐标换算和退出后的完整视角恢复',()=>{
  const camera=new PerspectiveCamera(36,1.5,.1,150);camera.position.set(8,9,10);camera.lookAt(0,1,0);
  const controls={target:new Vector3(0,1,0),update(){this.updated=true;}};
  const saved=captureWalkCamera(camera,controls),before=camera.quaternion.clone();
  applyWalkPose(camera,[5,4],[4,3],1.6,Math.PI/2,0);
  assert.deepEqual(camera.position.toArray(),[1,1.6,1]);assert.ok(camera.getWorldDirection(new Vector3()).x<-.99);
  camera.fov=70;camera.near=.04;controls.target.set(2,2,2);
  restoreWalkCamera(camera,controls,saved);assert.deepEqual(camera.position.toArray(),[8,9,10]);assert.ok(camera.quaternion.angleTo(before)<1e-7);
  assert.equal(camera.fov,36);assert.equal(camera.near,.1);assert.deepEqual(controls.target.toArray(),[0,1,0]);assert.equal(controls.updated,true);
});
test('漫游接入、清理与设备点击保护不回归',async()=>{
  const scene=await readFile(new URL('../apps/web/src/app/scene.js',import.meta.url),'utf8');
  const controller=await readFile(new URL('../apps/web/src/components/first-person-controller.jsx',import.meta.url),'utf8');
  const home=await readFile(new URL('../apps/web/src/app/home-view.js',import.meta.url),'utf8');
  assert.match(scene,/enabled: walkthrough.mode === 'idle'/);assert.match(scene,/opacity: walkthrough \? 1/);
  assert.match(scene,/visibleCeiling:walkthrough/);assert.match(home,/室内漫游/);
  assert.match(controller,/abort.abort\(\);clear\(\)/);assert.match(controller,/visibilitychange/);
  assert.match(controller,/input,textarea,select/);assert.match(controller,/callbacks.current.onSpawn/);
  assert.match(scene,/onEntitySelect: C/);assert.match(controller,/restoreWalkCamera\(camera,controls,old\)/);
});
