import {a as React} from '../vendor/react.js';
const {useState,useSyncExternalStore}=React;
import {beamSettingsStore,LIGHT_BEAM_TYPES,lightBeamType,resolveBeamAngle} from '../domain/light-beam-settings.js';
export function useBeamSettings(){return useSyncExternalStore(beamSettingsStore.subscribe,beamSettingsStore.getSnapshot,beamSettingsStore.getSnapshot);}
export default function LightBeamSettings({project,entities={}}){
 const settings=useBeamSettings(),[selected,setSelected]=useState('');
 const fixtures=(project?.floors??[]).flatMap(f=>f.devices.flatMap(d=>[
 ...((d.kind==='light'||d.modelId?.startsWith('light.')||d.modelId?.startsWith('switch.light.'))?[{id:d.id,modelId:lightBeamType(d.modelId),label:`${f.name} · ${d.label||d.name||entities[d.entityId]?.name||d.entityId}`}]:[]),
 ...(d.controlledLightFixtures??[]).map(x=>({id:x.id,modelId:lightBeamType(x.modelId??'light.downlight'),label:`${f.name} · ${x.label||d.label||entities[d.entityId]?.name||d.entityId}（${x.id.slice(-5)}）`}))
 ]));
 const fixture=fixtures.find(x=>x.id===selected);
 const slider=(label,value,onChange)=><label style={{marginTop:12}}>{label} · {Math.round(value)}°<input aria-label={label} type="range" min="1" max="160" step="1" value={value} onChange={e=>onChange(Number(e.target.value))}/></label>;
 return <details style={{marginTop:16}}><summary style={{cursor:'pointer'}}>灯光散射角</summary><p>完整光束夹角 1°–160°，同时影响照明范围和可见光束。仅改变三维展示，不操作真实灯具；保存在当前浏览器。</p>
 {LIGHT_BEAM_TYPES.map(([id,label])=><React.Fragment key={id}>{slider(`${label}默认散射角`,resolveBeamAngle(settings,id),value=>beamSettingsStore.update({types:{...settings.types,[id]:value}}))}</React.Fragment>)}
 <label style={{marginTop:18}}>单灯额外调整<select aria-label="选择单灯" value={selected} onChange={e=>setSelected(e.target.value)} style={{width:'100%',padding:8,color:'#182b40',background:'#f5f7fa'}}><option value="">选择灯具</option>{fixtures.map(x=><option key={x.id} value={x.id}>{x.label}</option>)}</select></label>
 {fixture&&<>{slider('当前灯具散射角',resolveBeamAngle(settings,fixture.modelId,fixture.id),value=>beamSettingsStore.update({fixtures:{...settings.fixtures,[fixture.id]:value}}))}<p>{settings.fixtures[fixture.id]===undefined?'当前跟随类型默认值':'当前使用单灯覆盖值'}</p><button type="button" onClick={()=>{const next={...settings.fixtures};delete next[fixture.id];beamSettingsStore.update({fixtures:next});}}>恢复跟随类型</button></>}
 </details>;
}
