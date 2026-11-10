import test from 'node:test';
import assert from 'node:assert/strict';
import {createFixtureLightSettingsStore,normalizeFixtureLightSettings,FIXTURE_LIGHT_STORAGE_KEY} from '../apps/web/src/domain/fixture-light-settings.js';
import {fixtureLightOutput,fixtureEmissiveOutput} from '../apps/web/src/domain/fixture-lighting.js';

test('两种亮度独立保存，刷新恢复设置且快照保持稳定',()=>{
 const data=new Map(),storage=()=>({getItem:key=>data.get(key),setItem:(key,value)=>data.set(key,value)});
 const store=createFixtureLightSettingsStore(storage);assert.deepEqual(store.getSnapshot(),{emitter:.65,illumination:1.15});
 assert.equal(store.getSnapshot(),store.getSnapshot());let changes=0;const unsubscribe=store.subscribe(()=>changes++);
 store.update({emitter:.4});store.update({illumination:1.3});store.update({illumination:1.3});
 assert.equal(changes,2);assert.deepEqual(JSON.parse(data.get(FIXTURE_LIGHT_STORAGE_KEY)),{emitter:.4,illumination:1.3});
 assert.deepEqual(createFixtureLightSettingsStore(storage).getSnapshot(),{emitter:.4,illumination:1.3});
 unsubscribe();store.update({emitter:.8});assert.equal(changes,2);
});
test('损坏或被禁用的浏览器存储不妨碍实时调节，并限制异常渲染强度',()=>{
 const broken=createFixtureLightSettingsStore(()=>({getItem:()=>'{broken',setItem:()=>{throw Error('disabled')}}));
 assert.deepEqual(broken.getSnapshot(),{emitter:.65,illumination:1.15});
 assert.doesNotThrow(()=>broken.update({emitter:0}));assert.equal(broken.getSnapshot().emitter,0);
 const blocked=createFixtureLightSettingsStore(()=>{throw Error('blocked')});assert.doesNotThrow(()=>blocked.update({illumination:2}));
 assert.equal(blocked.getSnapshot().illumination,2);
 assert.deepEqual(normalizeFixtureLightSettings({emitter:-2,illumination:Infinity}),{emitter:0,illumination:1.15});
 assert.deepEqual(normalizeFixtureLightSettings({emitter:9,illumination:9}),{emitter:2,illumination:3});
});
test('关闭灯体自发光不关闭周围照明，照明归零也不关闭灯体发光',()=>{
 assert.equal(fixtureEmissiveOutput(1,{emitter:0,illumination:1.15}),0);
 assert.equal(fixtureLightOutput(1,'ceiling',{emitter:0,illumination:1.15}).intensity,23);
 assert.equal(fixtureLightOutput(1,'ceiling',{emitter:.65,illumination:0}).intensity,0);
 assert.equal(fixtureEmissiveOutput(1,{emitter:.65,illumination:0}),1.625);
 for(const balance of [{emitter:0,illumination:3},{emitter:2,illumination:0}]){
  assert.equal(fixtureEmissiveOutput(0,balance),0);assert.equal(fixtureLightOutput(0,'ceiling',balance).intensity,0);
 }
});
