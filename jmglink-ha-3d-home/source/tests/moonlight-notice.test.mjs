import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveMoonlight} from '../packages/schema/src/moonlight.js';
import {moonlightNotice,LUNAR_INSTALL_URL} from '../apps/web/src/domain/moonlight-notice.js';
const now=Date.now();
const online={configured:true,connected:true};
function entities({state='full_moon',sun=-20,elevation=50,percent=80,age=0}={}){
  return {'sun.sun':{attributes:{azimuth:100,elevation:sun}},'sensor.moon':{entityId:'sensor.moon',state,lastUpdated:new Date(now-age).toISOString(),attributes:{moon_azimuth_deg:180,moon_altitude_deg:elevation,illumination_fraction:percent}}};
}
test('未检测到位置数据才提供安装指引，部分属性缺失和不可用准确分类',()=>{
  const missing=resolveMoonlight({},0,now);assert.equal(missing.reason,'missing');assert.equal(moonlightNotice(missing,online).installUrl,LUNAR_INSTALL_URL);
  const partial=entities();delete partial['sensor.moon'].attributes.moon_altitude_deg;
  const incomplete=resolveMoonlight(partial,0,now);assert.equal(incomplete.reason,'incomplete');assert.equal(moonlightNotice(incomplete,online).installUrl,undefined);
  const unavailable=resolveMoonlight(entities({state:'unavailable'}),0,now);assert.equal(unavailable.reason,'unavailable');assert.match(moonlightNotice(unavailable,online).text,/集成状态/);
});
test('异常和过期不混淆，白天、落山和零照亮比例明确标正常',()=>{
  for(const [input,reason] of [[{elevation:100},'invalid'],[{percent:101},'invalid'],[{age:660000},'stale'],[{sun:10},'daytime'],[{elevation:-1},'below_horizon'],[{percent:0},'unlit']]){
    const moon=resolveMoonlight(entities(input),0,now);assert.equal(moon.reason,reason);assert.equal(moon.active,false);
    const notice=moonlightNotice(moon,online);assert.equal(notice.installUrl,undefined);
    if(['daytime','below_horizon','unlit'].includes(reason))assert.match(notice.text,/正常/);
  }
  const noSun=entities();delete noSun['sun.sun'];assert.equal(resolveMoonlight(noSun,0,now).reason,'sun_unavailable');
});
test('HA 离线与同步优先于缺失诊断，不误提示安装；零强度单独说明',()=>{
  const missing=resolveMoonlight({},0,now);
  for(const connection of [{configured:true,connected:false},{configured:true,connected:false,synchronizing:true}]){
    const notice=moonlightNotice(missing,connection);assert.equal(notice.status,'connection');assert.equal(notice.installUrl,undefined);
  }
  const moon=resolveMoonlight(entities(),0,now);assert.equal(moonlightNotice(moon,online).status,'active');
  assert.equal(moonlightNotice(moon,online,0).status,'disabled');
});
