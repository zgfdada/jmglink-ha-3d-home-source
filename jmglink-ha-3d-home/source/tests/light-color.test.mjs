import test from 'node:test';import assert from 'node:assert/strict';
import {resolveLightChromaticity,mixLightColors} from '../apps/web/src/domain/light-color.js';
test('active color temperature overrides stale RGB and HS attributes',()=>{const entity={attributes:{color_mode:'color_temp',rgb_color:[255,0,0],hs_color:[240,100]}};assert.deepEqual(resolveLightChromaticity(entity,'#fff1d3'),{color:'#fff1d3',usesColor:false});});
test('active RGB and HS use real channels without fixed warm tint',()=>{assert.equal(resolveLightChromaticity({attributes:{color_mode:'rgb',rgb_color:[0,0,255]}}).color,'#0000ff');assert.equal(resolveLightChromaticity({attributes:{color_mode:'hs',hs_color:[120,100],rgb_color:[255,0,0]}}).color,'#00ff00');});
test('white modes and missing channels cannot reuse stale saturated colors',()=>{assert.equal(resolveLightChromaticity({attributes:{color_mode:'white',rgb_color:[255,0,0]}}).color,'#ffffff');assert.equal(resolveLightChromaticity({attributes:{color_mode:'xy',xy_color:[.3,0]}}).usesColor,false);});
test('room lights mix in linear RGB weighted by actual brightness',()=>{assert.equal(mixLightColors([{color:'#0000ff',brightness:1},{color:'#ff0000',brightness:0}]),'#0000ff');assert.equal(mixLightColors([{color:'#ff0000',brightness:1},{color:'#0000ff',brightness:1}]),'#bc00bc');});
test('white channels contribute white instead of leaving an RGBW lamp dark',()=>{assert.equal(resolveLightChromaticity({attributes:{color_mode:'rgbw',rgbw_color:[0,0,0,255]}}).color,'#ffffff');assert.equal(resolveLightChromaticity({attributes:{color_mode:'rgbww',rgbww_color:[0,0,0,0,255]}},'#ffffff',{warm:'#ffbe76',cold:'#d7e7ff'}).color,'#ffbe76');});
import {fixtureTemperatureColor} from '../apps/web/src/domain/light-color.js';
import {Color} from 'three';

test('参考项目色温节点准确，线性 RGB 插值而非直接混合编码后的通道',()=>{
 for(const [k,c]of [[2200,'#ff9438'],[3000,'#ffbd7a'],[4200,'#ffe2c2'],[6500,'#dfe9ff']])assert.equal(fixtureTemperatureColor(k),c);
 assert.equal(fixtureTemperatureColor(1000),'#ff9438');
 assert.equal(fixtureTemperatureColor(9000),'#dfe9ff');
 assert.equal(fixtureTemperatureColor(NaN),'#ffbd7a');
 const midpoint=new Color('#ffbd7a').lerp(new Color('#ffe2c2'),.5);
 assert.equal(fixtureTemperatureColor(3600),'#'+midpoint.getHexString());
});
