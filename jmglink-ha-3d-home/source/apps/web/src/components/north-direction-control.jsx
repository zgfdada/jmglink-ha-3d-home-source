import {a as React} from '../vendor/react.js';
import {normalizeNorthAngle} from '../../../../packages/schema/src/solar-direction.js';

export default function NorthDirectionControl({value,onChange,getProject,saveProject}) {
  const [saving,setSaving]=React.useState(false);
  const [error,setError]=React.useState('');
  const savingRef=React.useRef(false);
  const preview=event=>{const number=Number(event.target.value);if(Number.isFinite(number))onChange(normalizeNorthAngle(number));};
  const commit=async()=>{
    const project=getProject();
    if(savingRef.current || !project || normalizeNorthAngle(project.northAngle)===value)return;
    savingRef.current=true;
    setSaving(true);setError('');
    try {await saveProject({...project,northAngle:value});}
    catch(e){setError(`北向保存失败：${e.message}`);}
    finally{savingRef.current=false;setSaving(false);}
  };
  return <div className="north-direction-control" style={{borderTop:'1px solid #ffffff40',paddingTop:12,marginTop:12}}>
    <label>户型北向角度 · {value}°
      <input aria-label="户型北向角度" type="number" min="0" max="359.9" step="1" value={value} disabled={saving} onChange={preview} onBlur={commit} onKeyDown={event=>{if(event.key==='Enter')event.currentTarget.blur();}} style={{width:'100%',boxSizing:'border-box',padding:8,borderRadius:8}} />
    </label>
    <input aria-label="拖动调整北向" type="range" min="0" max="359" step="1" value={value} disabled={saving} onChange={preview} onPointerUp={commit} onKeyUp={commit} onBlur={commit} />
    <div style={{textAlign:'center',padding:10}}><span style={{display:'inline-block',transform:`rotate(${value}deg)`,fontWeight:700}}>↑ 北</span></div>
    <p>以 2D 户型图上方为 0°，顺时针增加；90° 向右，180° 向下。所有楼层共用。</p>
    <p role="status">{saving?'正在保存北向…':error || '调整时实时预览日月投影，松开滑块或结束输入后自动保存。'}</p>
    {error && <button onClick={commit}>重试保存北向</button>}
  </div>;
}
