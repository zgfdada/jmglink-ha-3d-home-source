import {a as React} from '../vendor/react.js';
import {beamSettingsStore,LIGHT_BEAM_TYPES,resolveBeamAngle} from '../domain/light-beam-settings.js';
export function useBeamSettings(){return React.useSyncExternalStore(beamSettingsStore.subscribe,beamSettingsStore.getSnapshot,beamSettingsStore.getSnapshot);}
export default function LightBeamSettings(){
 const settings=useBeamSettings();
 return <details style={{marginTop:16}}><summary style={{cursor:'pointer'}}>灯光散射角</summary><p>完整光束夹角 1°–160°，同时影响照明范围和可见光束。单灯角度请在灯具控制面板调整；仅改变三维展示，不操作真实灯具；保存在当前浏览器。</p>
 {LIGHT_BEAM_TYPES.map(([id,label])=><label key={id} style={{marginTop:12}}>{label}默认散射角 · {Math.round(resolveBeamAngle(settings,id))}°<input aria-label={`${label}默认散射角`} type="range" min="1" max="160" step="1" value={resolveBeamAngle(settings,id)} onChange={e=>beamSettingsStore.update({types:{...beamSettingsStore.getSnapshot().types,[id]:Number(e.target.value)}})}/></label>)}
 </details>;
}
