import assert from 'node:assert/strict';
import test from 'node:test';
import {createSimulation, isTriggered, normalizeInput, simulationPanelStates, triggerValue} from '../apps/web/src/app/resource-center/device-preview-state.js';

const cap = (id, type, extra = {}) => ({capabilityId:id, name:id, dataType:type, ...extra});
const rule = (id, operator, value, max = '') => ({id, capabilityId:id, enabled:true, targets:['root/0','root/1'], condition:{operator,value,max}});
const project = (capabilities, rules) => ({project:{capabilities,appearance:{partMotionRules:rules}}});

test('boolean panel and engine share the HA on/off representation', () => {
  const r = rule('playing','eq','on');
  const {fields, initial} = createSimulation(project([cap('playing','boolean')],[r]));
  const field = fields[0];
  assert.equal(initial.playing, 'off');
  assert.equal(normalizeInput(field,true),'on');
  const playing = triggerValue(field,r,true,initial.playing);
  assert.equal(isTriggered(r,playing),true);
  assert.equal(simulationPanelStates(fields,{playing}).playing.state,playing);
  assert.equal(triggerValue(field,r,false,playing),'off');
});

test('a state shared by two rules and by the panel has one value', () => {
  const active = rule('status','eq','charging'), idle = rule('status','neq','charging');
  const {fields, initial} = createSimulation(project([cap('status','string')],[active,idle]));
  const value = triggerValue(fields[0],active,true,initial.status);
  assert.equal(simulationPanelStates(fields,{status:value}).status.state, 'charging');
  assert.deepEqual([active,idle].map(r=>isTriggered(r,value)),[true,false]);
  assert.equal(triggerValue(fields[0],idle,true,value),'idle');
});

test('numeric operators use the scene matcher and respect narrow limits', () => {
  const {fields} = createSimulation(project([cap('position','number',{min:0.1,max:0.2})],[]));
  for (const op of ['eq','neq','gt','gte','lt','lte','between']) {
    const r = rule('position',op,'0.15','0.17');
    for (const desired of [true,false]) {
      const value = triggerValue(fields[0],r,desired,0.14);
      assert.notEqual(value,undefined,op);
      assert.equal(isTriggered(r,value),desired,op);
      assert.ok(value >= 0.1 && value <= 0.2);
    }
  }
  assert.equal(triggerValue(fields[0],rule('position','gt','0.2'),true,0.1),undefined);
  assert.equal(normalizeInput(fields[0],''),undefined);
  assert.equal(normalizeInput(fields[0],Infinity),undefined);
});

test('finite enumerations exclude missing values and mark impossible presets', () => {
  const r = rule('mode','eq','on');
  const options = [{value:'off',status:'missing'},{value:'on',label:'开启'}];
  const {fields,initial} = createSimulation(project([cap('mode','enum',{enumValues:options})],[r]));
  assert.equal(initial.mode,'on');
  assert.equal(normalizeInput(fields[0],'off'),undefined);
  assert.equal(triggerValue(fields[0],r,false,initial.mode),undefined);
  assert.equal(triggerValue(fields[0],{...r,enabled:false},true,initial.mode),undefined);
  assert.deepEqual(simulationPanelStates(fields,initial).mode.options, [options[1]]);
});

test('mapping requires a numeric raw value and integer constraints exclude fractions', () => {
  const r = {...rule('power','neq','off'),mapping:{enabled:true,inputMin:0,inputMax:1}};
  assert.equal(isTriggered(r,'idle'),false);
  assert.equal(isTriggered(r,0.5),true);
  const {fields} = createSimulation(project([cap('power','integer',{min:0,max:7})],[r]));
  assert.equal(normalizeInput(fields[0],'0.25'),undefined);
  assert.equal(triggerValue(fields[0],rule('power','between','0.1','0.7'),true,2),undefined);
  assert.equal(triggerValue(fields[0],rule('power','between','0.4','1.3'),true,2),1);
});
