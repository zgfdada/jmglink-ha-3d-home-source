import {a as React} from '../vendor/react.js';
import {fixtureLightSettingsStore} from '../domain/fixture-light-settings.js';
export default function FixtureLightSettings(){
 const settings=React.useSyncExternalStore(fixtureLightSettingsStore.subscribe,fixtureLightSettingsStore.getSnapshot,fixtureLightSettingsStore.getSnapshot);
 return <>
  {[['灯体亮度','emitter',200],['周围照明亮度','illumination',300]].map(([label,key,max])=><label key={key} style={{marginTop:14,minWidth:0}}>
   {label} · {Math.round(settings[key]*100)}%
   <input style={{width:'100%',minWidth:0,boxSizing:'border-box',margin:0}} type="range" min="0" max={max} step="1" aria-label={label} value={Math.round(settings[key]*100)} onChange={event=>fixtureLightSettingsStore.update({[key]:Number(event.target.value)/100})}/>
  </label>)}
  <p>仅调整三维显示，实时预览并自动保存到当前浏览器。</p>
 </>;
}
