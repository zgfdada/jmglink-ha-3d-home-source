import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeCelestialSettings,celestialIntensity,readCelestialSettings,storeCelestialSettings} from '../apps/web/src/domain/celestial-light-settings.js';
import {readFile} from 'node:fs/promises';

test('日光、月光增益独立，零值关闭光强，默认保持原值',()=>{
  assert.deepEqual(normalizeCelestialSettings(),{sunIntensity:1,moonIntensity:1,roofOcclusion:true});
  const settings={sunIntensity:2,moonIntensity:10,roofOcclusion:false};
  assert.equal(celestialIntensity(.8,.06,false,settings),1.6);
  assert.equal(celestialIntensity(.8,.06,true,settings),.6);
  assert.equal(celestialIntensity(0,.06,false,settings),0);
  assert.equal(celestialIntensity(.8,0,true,settings),0);
  assert.equal(celestialIntensity(.8,.06,true,{moonIntensity:0}),0);
  assert.equal(celestialIntensity(.8,.06,false,{sunIntensity:0}),0);
  assert.deepEqual(normalizeCelestialSettings({sunIntensity:9,moonIntensity:Infinity,roofOcclusion:false}),{sunIntensity:3,moonIntensity:1,roofOcclusion:false});
});
test('照明偏好保留屋顶关闭与零强度，损坏或受限存储安全降级',()=>{
  const original=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
  try {
    let stored=null;
    Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:()=>stored,setItem:(key,value)=>{stored=value;}}});
    storeCelestialSettings({sunIntensity:0,moonIntensity:15,roofOcclusion:false});
    assert.deepEqual(readCelestialSettings(),{sunIntensity:0,moonIntensity:15,roofOcclusion:false});
    stored='null';assert.equal(readCelestialSettings().moonIntensity,1);
    stored='{bad';assert.equal(readCelestialSettings().roofOcclusion,true);
    Object.defineProperty(globalThis,'localStorage',{configurable:true,get(){throw new Error('blocked');}});
    assert.equal(readCelestialSettings().sunIntensity,1);assert.doesNotThrow(()=>storeCelestialSettings({}));
  } finally {if(original)Object.defineProperty(globalThis,'localStorage',original);else delete globalThis.localStorage;}
});
test('屋顶开关贯通主页、场景、楼层，阴影强度保持独立',async()=>{
  const scene=await readFile(new URL('../apps/web/src/app/scene.js',import.meta.url),'utf8');
  const home=await readFile(new URL('../apps/web/src/app/home-view.js',import.meta.url),'utf8');
  assert.match(scene,/roofOcclusion: lightSettings.roofOcclusion/);
  assert.match(scene,/l && \(roofOcclusion \|\| walkthrough\) && t.jsx\(ShadowOnlyRoof/);
  assert.match(home,/changeCelestialSettings\(\{roofOcclusion:event.target.checked\}\)/);
  assert.match(scene,/normalizeShadowIntensity\(shadowIntensity\)/);
});
