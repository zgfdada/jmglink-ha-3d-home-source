import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Mesh, BoxGeometry, MeshBasicMaterial, Raycaster, Vector3} from 'three';
import {WALL_SHADOW_PROPS, SUN_SHADOW_PROPS, normalizeShadowIntensity, readShadowIntensity, storeShadowIntensity} from '../apps/web/src/domain/scene-shadows.js';

test('阴影强度边界、浏览器存储和存储不可用时的降级', () => {
  for (const [input, expected] of [[0,0],[0.4,0.4],[1,1],[-2,0],[5,1],[NaN,1],[undefined,1]]) assert.equal(normalizeShadowIntensity(input),expected);
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  try {
    const data = new Map();
    Object.defineProperty(globalThis, 'localStorage', {configurable:true, value:{getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value)}});
    assert.equal(readShadowIntensity(),1);
    storeShadowIntensity(0); assert.equal(readShadowIntensity(),0);
    storeShadowIntensity(0.35); assert.equal(readShadowIntensity(),0.35);
    data.set('ha3d.shadowIntensity','broken'); assert.equal(readShadowIntensity(),1);
    Object.defineProperty(globalThis, 'localStorage', {configurable:true,get(){throw new Error('blocked');}});
    assert.equal(readShadowIntensity(),1); assert.doesNotThrow(()=>storeShadowIntensity(0.4));
  } finally { if(descriptor) Object.defineProperty(globalThis,'localStorage',descriptor); else delete globalThis.localStorage; }
});

test('展示墙体阻挡室内物体到外墙的光路，薄墙仍有遮光厚度', () => {
  const wall = Object.assign(new Mesh(new BoxGeometry(4, 2.6, 0.1), new MeshBasicMaterial()), WALL_SHADOW_PROPS);
  wall.updateMatrixWorld();
  const ray = new Raycaster(new Vector3(0, 0, 3), new Vector3(0, 0, -1));
  const casters = [wall].filter(mesh => mesh.castShadow);
  assert.equal(ray.intersectObjects(casters).length > 0, true);
  assert.equal(wall.receiveShadow, true);
  assert.ok(SUN_SHADOW_PROPS['shadow-normalBias'] < 0.1 / 10);
  wall.geometry.dispose(); wall.material.dispose();
});

test('主页墙体实际接入遮光策略，阴影相机显式限制深度范围', async () => {
  const source = await readFile(new URL('../apps/web/src/app/scene.js', import.meta.url), 'utf8');
  const wall = source.slice(source.indexOf('function Bn('), source.indexOf('const An ='));
  assert.match(wall, /position: \[0, 0, -w \/ 2\],\s*\.\.\.WALL_SHADOW_PROPS/);
  assert.doesNotMatch(wall, /castShadow: !n/);
  assert.match(source, /\.\.\.SUN_SHADOW_PROPS/);
  assert.match(source, /args: \[-16, 16, 16, -16, SUN_SHADOW_PROPS\['shadow-camera-near'\], SUN_SHADOW_PROPS\['shadow-camera-far'\]\]/);
});
