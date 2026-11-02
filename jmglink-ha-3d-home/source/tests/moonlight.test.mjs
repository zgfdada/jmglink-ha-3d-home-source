import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolveMoonlight,isMoonlightEntity} from '../packages/schema/src/moonlight.js';
import {collectInstanceLiveEntityIds} from '../apps/server/src/ha/liveSubscriptions.js';
const now = Date.now();
function states({sun=-20,altitude=40,illumination=100,state='full_moon',age=0}={}) {
  return {'sun.sun':{entityId:'sun.sun',domain:'sun',attributes:{azimuth:50,elevation:sun}},
    'sensor.moon_phase':{entityId:'sensor.moon_phase',domain:'sensor',state,lastUpdated:new Date(now-age).toISOString(),attributes:{moon_azimuth_deg:90,moon_altitude_deg:altitude,illumination_fraction:illumination}}};
}
test('月光只在夜晚、月亮升起且数据有效时启用，月相和高度影响强度',()=>{
  const resolve=options=>resolveMoonlight(states(options),0,now);
  const full=resolve();assert.equal(full.available,true);assert.equal(full.active,true);assert.ok(full.intensity>0 && full.intensity<=.18);
  assert.ok(resolve({illumination:50}).intensity<full.intensity);
  assert.ok(resolve({altitude:10}).intensity<full.intensity);
  assert.ok(resolve({sun:-2}).intensity<full.intensity);
  for(const options of [{sun:0},{sun:30},{altitude:-1},{altitude:0},{illumination:0},{state:'unavailable'},{illumination:undefined,age:660000}])assert.equal(resolve(options).active,false);
});
test('月亮复用北向换算，数据失效不伪造月光，不拼接不完整实体',()=>{
  const moon=resolveMoonlight(states(),90,now);assert.ok(Math.abs(moon.direction[0])<1e-9);assert.ok(moon.direction[2]>0);
  const partial=states();delete partial['sensor.moon_phase'].attributes.moon_azimuth_deg;
  assert.equal(resolveMoonlight(partial,0,now).available,false);
  assert.equal(resolveMoonlight(states({illumination:101}),0,now).available,false);
  assert.equal(resolveMoonlight(states({age:660000}),0,now).available,false);
  assert.equal(resolveMoonlight({},0,now).active,false);
});
test('无需放置设备，月亮主实体自动进入实时订阅集合',()=>{
  const entities=Object.values(states());assert.equal(isMoonlightEntity(entities[1]),true);
  const ids=collectInstanceLiveEntityIds({listProjects:()=>[]},{},entities,{});
  assert.equal(ids.has('sensor.moon_phase'),true);assert.equal(ids.has('sun.sun'),true);
});
test('隐藏屋顶不会被描边替代材质画成实体面，月光复用现有阴影光源',async()=>{
  const source=await readFile(new URL('../apps/web/src/app/scene.js',import.meta.url),'utf8');
  assert.match(source,/g.colorWrite === !1 \|\| g.wireframe === !0/);
  assert.match(source,/colorWrite: false, depthWrite: false/);
  assert.match(source,/moon.intensity, moonActive, lightSettings/);
  assert.match(source,/moonActive \? 0.35 : 1/);
});
