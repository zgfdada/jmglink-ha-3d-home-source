import test from 'node:test';
import assert from 'node:assert/strict';
import {motionStateCapabilities} from '../apps/web/src/domain/motion-state-options.js';
import {deviceCapabilityEntities} from '../packages/schema/src/associated-entities.js';
import {boundPanelStates,panelValue} from '../apps/web/src/domain/device-panel.js';
import {motionCapabilityValues,motionMatch} from '../packages/schema/src/part-motion.js';

test('额外定位实体的动效选项显示中文但保存原始值，面板与动效读取相同实时状态',()=>{
  const capabilities=[{capabilityId:'location',name:'车辆位置',dataType:'string',enumValues:[]},{capabilityId:'charging',name:'充电状态',dataType:'string'}];
  const binding={extraEntityIds:['device_tracker.car','sensor.charging'],capabilityMappings:{location:{entityId:'device_tracker.car',attribute:'state'},charging:{entityId:'sensor.charging',attribute:'state'}}};
  const tracker={entityId:'device_tracker.car',domain:'device_tracker',state:'not_home',attributes:{},stateLabels:{not_home:'离家'}};
  const charging={entityId:'sensor.charging',domain:'sensor',state:'complete',attributes:{}};
  const device={entities:[],extraEntities:[tracker,charging]};
  const states=boundPanelStates({capabilities},binding,deviceCapabilityEntities(device));
  assert.equal(states.location.state,'not_home');assert.equal(states.charging.state,'complete');assert.notEqual(panelValue(states.location),'—');assert.notEqual(panelValue(states.charging),'—');
  const options=motionStateCapabilities(capabilities,binding,device);
  assert.ok(options[0].enumValues.some(v=>v.value==='not_home'&&v.label==='离家'));
  assert.ok(options[0].enumValues.some(v=>v.value==='home'));
  assert.equal(options[0].currentState,'not_home');assert.deepEqual(capabilities[0].enumValues,[]);
  const values=motionCapabilityValues({deviceEntities:deviceCapabilityEntities(device),deviceCapabilityMappings:binding.capabilityMappings});
  assert.equal(values.location,'not_home');
  assert.equal(motionMatch({enabled:true,condition:{operator:'eq',value:'not_home'}},values.location),true);
  tracker.state='home';assert.equal(motionCapabilityValues({deviceEntities:deviceCapabilityEntities(device),deviceCapabilityMappings:binding.capabilityMappings}).location,'home');
});
