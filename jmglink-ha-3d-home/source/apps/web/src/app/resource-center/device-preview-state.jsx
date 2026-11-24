import {a as React} from '../../vendor/react.js';
import {MOTION_EFFECTS, MOTION_OPERATORS} from '../../../../../packages/schema/src/part-motion.js';
import {createSimulation, isTriggered, normalizeInput, simulationPanelStates, triggerValue} from './device-preview-state.js';

export function useDevicePreviewState(entry) {
  const model = React.useMemo(() => createSimulation(entry), [entry]);
  const [snapshot, setSnapshot] = React.useState(null);
  const values = snapshot?.model === model ? snapshot.values : model.initial;
  const resetKey = snapshot?.model === model ? snapshot.resetKey : 0;
  const states = React.useMemo(() => simulationPanelStates(model.fields, values), [model, values]);
  function setValue(id, raw) {
    const field = model.fields.find(item => item.id === id);
    if (!field) return;
    const next = normalizeInput(field, raw);
    if (next === undefined) return;
    setSnapshot(previous => {
      const same = previous?.model === model;
      return {model, values:{...(same ? previous.values : model.initial), [id]:next}, resetKey:same ? previous.resetKey : 0};
    });
  }
  function reset() {
    setSnapshot(previous => ({model, values:model.initial, resetKey:(previous?.model === model ? previous.resetKey : 0) + 1}));
  }
  return {...model, states, values, setValue, reset, resetKey};
}

function StateField({field, value, setValue}) {
  const {cap, options, numeric} = field;
  const label = cap.name || field.id;
  const [draft, setDraft] = React.useState(String(value ?? ''));
  React.useEffect(() => setDraft(String(value ?? '')), [value]);
  let input;
  if (options) {
    input = <select aria-label={label} value={String(value ?? '')} disabled={!options.length} onChange={e => setValue(field.id, e.target.value)}>
      {!options.length && <option value="">无可用枚举值</option>}
      {options.map(option => <option key={String(option.value)} value={String(option.value)}>{option.label || String(option.value)}</option>)}
    </select>;
  } else if (numeric) {
    input = <input aria-label={label} type="number" step={cap.dataType === 'integer' ? 1 : 'any'} min={cap.min} max={cap.max}
      value={draft} onChange={e => {
        setDraft(e.target.value);
        setValue(field.id, e.target.value);
      }} onBlur={() => setDraft(String(value ?? ''))}/>;
  } else {
    input = <input aria-label={label} type="text" value={String(value ?? '')} onChange={e => setValue(field.id, e.target.value)}/>;
  }
  return <label className="drs-field"><span>{label}{cap.unit && '（'+cap.unit+'）'}</span>{input}</label>;
}

function RuleRow({rule, field, value, setValue}) {
  const condition = rule.condition;
  const active = !!field && isTriggered(rule, value);
  const badge = !rule.enabled ? '已停用' : !field ? '缺少关联能力' : active ? '已触发' : '未触发';
  const matched = triggerValue(field, rule, true, value);
  const unmatched = triggerValue(field, rule, false, value);
  return <div className="drs-rule">
    <div className="drs-rule-heading"><strong>{rule.name || MOTION_EFFECTS[rule.effect?.type] || '部件动效'}</strong><span className={'drs-badge'+(active ? ' is-active' : '')}>{badge}</span></div>
    <div className="drs-predicate">{field?.cap.name || rule.capabilityId} {MOTION_OPERATORS[condition?.operator]} <code>{condition?.value}</code>{condition?.operator === 'between' && <> 至 <code>{condition.max}</code></>}
      {field && <small> · 当前 <code>{String(value ?? '') || '空值'}</code></small>}
      {rule.endBehavior === 'hold' && <small> · 条件解除时保持姿态</small>}
    </div>
    {rule.enabled && field && <div className="drs-switch" role="group" aria-label={(rule.name || '动效')+'条件模拟'}>
      <button type="button" disabled={matched === undefined} aria-pressed={active} title={matched === undefined ? '能力取值内无法触发' : '模拟值：'+matched} onClick={() => setValue(field.id, matched)}>触发</button>
      <button type="button" disabled={unmatched === undefined} aria-pressed={!active} title={unmatched === undefined ? '能力取值内始终满足条件' : '模拟值：'+unmatched} onClick={() => setValue(field.id, unmatched)}>不触发</button>
    </div>}
  </div>;
}

export default function DevicePreviewState({simulation}) {
  const {fields, rules, values, setValue, reset} = simulation;
  if (!fields.length && !rules.length) return <p className="drs-empty">此设备未配置可模拟的能力或部件动效。</p>;
  return <section className="drs-simulator" aria-label="设备状态模拟">
    <div className="drs-header"><h4>设备状态模拟</h4><button type="button" onClick={reset}>重置模拟</button></div>
    {rules.length ? <div className="drs-rules">{rules.map(rule => <RuleRow key={rule.id} rule={rule} field={fields.find(f => f.id === rule.capabilityId)} value={values[rule.capabilityId]} setValue={setValue}/>)}</div> : <p className="drs-empty">此设备未配置部件动效。</p>}
    {!!fields.length && <details className="drs-inputs" open={rules.length ? undefined : true}><summary>调整能力值（{fields.length}）</summary>
      <div className="drs-fields">{fields.map(field => <StateField key={field.id} field={field} value={values[field.id]} setValue={setValue}/>)}</div>
    </details>}
  </section>;
}
