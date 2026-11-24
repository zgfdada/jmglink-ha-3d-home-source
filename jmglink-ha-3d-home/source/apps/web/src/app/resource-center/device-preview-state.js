import {motionMatch} from '../../../../../packages/schema/src/part-motion.js';
import {samplePanelStates} from '../../domain/device-panel.js';

function validOptions(capability) {
  return (capability.enumValues || []).filter(option => option.status !== 'missing' && !option.missing);
}

function booleanOptions(rules) {
  const expected = rules.map(rule => rule.condition?.value);
  if (expected.includes('on') || expected.includes('off')) {
    const options = [{value:'off', label:'关闭'}, {value:'on', label:'开启'}];
    if (expected.includes('true') || expected.includes('false')) {
      return [...options, {value:false, label:'关闭（false）'}, {value:true, label:'开启（true）'}];
    }
    return options;
  }
  return [{value:false, label:'关闭'}, {value:true, label:'开启'}];
}

export function createSimulation(entry) {
  const rules = entry?.project?.appearance?.partMotionRules || [];
  const fields = (entry?.project?.capabilities || []).map(cap => {
    const boolean = cap.dataType === 'boolean' || cap.kind === 'toggle';
    const numeric = ['number','integer'].includes(cap.dataType) || cap.kind === 'number';
    const hasOptions = !!cap.enumValues?.length;
    const options = hasOptions ? validOptions(cap) : boolean ? booleanOptions(rules.filter(r => r.capabilityId === cap.capabilityId)) : null;
    return {cap, id:cap.capabilityId, boolean, numeric, options};
  });
  const initial = Object.fromEntries(fields.map(field => {
    const {options, cap, numeric} = field;
    let value = cap.allowedDomains?.includes('device_tracker') ? 'home' : 'idle';
    if (options) value = options[0]?.value ?? '';
    else if (numeric) value = Math.min(cap.max ?? Infinity, Math.max(cap.min ?? -Infinity, 38));
    else if (cap.dataType === 'image') value = '';
    return [field.id, value];
  }));
  return {fields, rules, initial};
}

export function simulationPanelStates(fields, values) {
  return samplePanelStates(fields.map(({cap, options}) => options ? {...cap,enumValues:options} : cap), values);
}

export function normalizeInput(field, raw) {
  if (raw == null) return undefined;
  if (field.options) {
    const found = field.options.find(option => String(option.value) === String(raw));
    if (found) return found.value;
    if (field.boolean && typeof raw === 'boolean') {
      return field.options.find(option => String(option.value) === (raw ? 'on' : 'off'))?.value;
    }
    return undefined;
  }
  if (!field.numeric) return String(raw);
  if (String(raw).trim() === '') return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < (field.cap.min ?? -Infinity) || n > (field.cap.max ?? Infinity)) return undefined;
  if (field.cap.dataType === 'integer' && !Number.isInteger(n)) return undefined;
  return n;
}

// Keep the condition and numeric mapping gate identical to the scene motion engine.
export function isTriggered(rule, value) {
  return !!rule.condition && (!rule.mapping?.enabled || Number.isFinite(Number(value))) && motionMatch(rule, value);
}

export function triggerValue(field, rule, desired, current) {
  if (!field || !rule.enabled || !rule.condition) return undefined;
  const {value, max, operator} = rule.condition;
  let candidates;
  if (field.options) candidates = [current, ...field.options.map(option => option.value)];
  else {
    const a = Number(value), b = Number(max);
    const numeric = [a, Math.floor(a) + 1, Math.ceil(a) - 1, field.cap.min, field.cap.max, 0, 1];
    if (operator === 'between') numeric.push(b, a / 2 + b / 2, Math.floor(b) + 1);
    const textStates = field.numeric ? [] : field.cap.allowedDomains?.includes('device_tracker') ? ['home', 'not_home'] : ['idle', 'active'];
    candidates = [current, value, ...textStates, ...numeric.filter(Number.isFinite)];
  }
  for (const raw of candidates) {
    const candidate = normalizeInput(field, raw);
    if (candidate !== undefined && !['', 'unknown', 'unavailable'].includes(String(candidate)) &&
        isTriggered(rule, candidate) === desired) return candidate;
  }
  return undefined;
}
