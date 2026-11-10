import test from 'node:test';import assert from 'node:assert/strict';import {detectLightColorCapability as detect} from '../apps/web/src/domain/light-color-capability.js';
test('声明色温能力时不能被派生 RGB 或临时模式误判',()=>{assert.equal(detect({attributes:{supported_color_modes:['color_temp'],color_mode:'rgb',rgb_color:[255,177,110]}}).status,'unsupported');});
test('五种彩色模式关灯后仍保留彩色支持',()=>{for(const mode of ['hs','xy','rgb','rgbw','rgbww'])assert.equal(detect({state:'off',attributes:{supported_color_modes:[mode],color_mode:null,rgb_color:null}}).supported,true);});
test('缺失能力且只有 RGB 属性时保持待确认',()=>{for(const attributes of [{},{rgb_color:[255,177,110]},{supported_color_modes:[]}])assert.equal(detect({attributes}).status,'unknown');});
test('旧设备缺失列表时允许已激活的彩色模式作为依据',()=>{assert.equal(detect({attributes:{color_mode:'hs'}}).supported,true);});
test('开关与亮度灯默认折叠，不将其视为彩色灯',()=>{for(const mode of ['onoff','brightness','white'])assert.equal(detect({attributes:{supported_color_modes:[mode]}}).supported,false);});
