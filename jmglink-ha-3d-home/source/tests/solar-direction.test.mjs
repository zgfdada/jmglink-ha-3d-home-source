import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolveSolarDirection, normalizeNorthAngle} from '../packages/schema/src/solar-direction.js';
import {normalizeFloorplanProject} from '../packages/schema/src/index.js';
import {BoxGeometry, Mesh, MeshBasicMaterial, Raycaster, Vector3} from 'three';

const sun = (azimuth,elevation,north=0) => resolveSolarDirection({'sun.sun': {attributes: {azimuth,elevation}}}, north);
const close = (a,b) => a.forEach((value,index) => assert.ok(Math.abs(value-b[index]) < 1e-9, `${a} != ${b}`));

test('太阳方位与北向角映射：上北右东、北向顺时针偏转、向量归一化', () => {
  close(sun(0,0).direction,[0,0,-1]); close(sun(90,0).direction,[1,0,0]);
  close(sun(180,0).direction,[0,0,1]); close(sun(270,0).direction,[-1,0,0]);
  close(sun(0,0,90).direction,[1,0,0]); close(sun(90,0,90).direction,[0,0,1]);
  close(sun(60,90).direction,[0,1,0]);
  for (const angle of [1,30,60,89]) assert.ok(Math.abs(Math.hypot(...sun(130,angle,25).direction)-1) < 1e-9);
});

test('日落关闭日光，缺失或无效角度明确降级，保留真实太阳数值', () => {
  assert.equal(sun(180,-5).aboveHorizon,false); assert.equal(sun(180,0).aboveHorizon,false);
  assert.equal(sun(180,1).aboveHorizon,true); assert.equal(sun(180,-5).available,true);
  for (const elevation of [NaN,Infinity,undefined,'30',91,-91]) assert.equal(sun(180,elevation).available,false);
  assert.equal(resolveSolarDirection({}).available,false);
  assert.equal(sun(96.04,-20.2).azimuth,96.04);
});

test('北向角持久化归一化，旧项目默认上北', () => {
  assert.equal(normalizeNorthAngle(-90),270); assert.equal(normalizeNorthAngle(450),90);
  assert.equal(normalizeFloorplanProject({}).northAngle,0);
  assert.equal(normalizeFloorplanProject({northAngle:-90}).northAngle,270);
  const project = normalizeFloorplanProject({northAngle:128.5});
  assert.equal(normalizeFloorplanProject(JSON.parse(JSON.stringify(project))).northAngle,128.5);
});

test('隐藏屋顶不写颜色或视图深度、不参与点选，但阻挡从屋顶穿入的阳光', async () => {
  const source = await readFile(new URL('../apps/web/src/app/scene.js',import.meta.url),'utf8');
  const roofSource = source.slice(source.indexOf('function ShadowOnlyRoof'),source.indexOf('function fi('));
  assert.match(roofSource,/castShadow: true/);
  assert.match(roofSource,/colorWrite: false, depthWrite: false/);
  assert.match(roofSource,/raycast: ignoreSceneEffectRaycast/);
  assert.match(source,/l && roofOcclusion && t.jsx\(ShadowOnlyRoof/);
  const roof = new Mesh(new BoxGeometry(4,.06,4), new MeshBasicMaterial({colorWrite:false,depthWrite:false}));
  roof.position.y = 2.6; roof.updateMatrixWorld(); roof.castShadow = true;
  const direction = new Vector3(...sun(90,80).direction).negate();
  const origin = new Vector3(0,0,0).addScaledVector(direction,-5);
  assert.ok(new Raycaster(origin,direction).intersectObject(roof).length > 0);
  assert.equal(new Raycaster(new Vector3(3,1,0),new Vector3(-1,0,0)).intersectObject(roof).length,0);
  roof.geometry.dispose(); roof.material.dispose();
});

test('前端串接实时太阳、全户型北向和夜间投影开关', async () => {
  const scene = await readFile(new URL('../apps/web/src/app/scene.js',import.meta.url),'utf8');
  const home = await readFile(new URL('../apps/web/src/app/home-view.js',import.meta.url),'utf8');
  const editor = await readFile(new URL('../apps/web/src/app/floorplan-editor.js',import.meta.url),'utf8');
  assert.match(home,/solarDirection: resolveSolarDirection\(s, northAngle\)/);
  assert.match(scene,/castShadow: R.shadows && \(moonActive \|\| !solarActive \|\| solar.aboveHorizon\)/);
  assert.doesNotMatch(editor,/aria-label": "户型北向角度"/);
  assert.match(home,/e.jsx\(NorthDirectionControl/);
});
