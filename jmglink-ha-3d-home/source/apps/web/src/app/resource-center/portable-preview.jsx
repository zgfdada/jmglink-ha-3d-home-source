import {a as React} from '../../vendor/react.js';
import ControlPreview from '../device-development-center/control-preview.jsx';
import DevicePanel from '../../components/device-panel.jsx';
import {samplePanelStates} from '../../domain/device-panel.js';
import MotionResourcePreview from '../device-development-center/motion-resource-preview.jsx';
import ModelPreview from '../device-development-center/model-preview.jsx';

export default function PortablePreview({entry,model,onThumbnail}){
 const [values,setValues]=React.useState({});
 const [active,setActive]=React.useState(true),[playing,setPlaying]=React.useState(true);
 if(!entry)return null;
 if(entry.kind==='control')return <ControlPreview definition={entry.control}/>;
 if(entry.kind==='panel')return <div className="rd-panel-preview"><DevicePanel panel={entry.panel} states={samplePanelStates(entry.capabilities||[],values)} interactive onAction={(id,value)=>setValues(v=>({...v,[id]:value}))}/></div>;
 if(entry.format==='ha3d-motion-v1')return <div><MotionResourcePreview resource={entry.motion} active={active} playing={playing} onThumbnail={onThumbnail}/><button onClick={()=>setActive(v=>!v)}>{active?'模拟条件：满足':'模拟条件：不满足'}</button><button onClick={()=>setPlaying(v=>!v)}>{playing?'暂停预览':'继续预览'}</button><small>仅本地模拟，不调用设备</small></div>;
 if(entry.format==='ha3d-device-project-v1'){
  const states=samplePanelStates(entry.project.capabilities||[],values),motionValues=Object.fromEntries(Object.entries(states).map(([id,state])=>[id,state.state]));
  return <div className="rd-device-preview">{(model||entry.model)&&<ModelPreview model={model||{...entry.model.model,...entry.project.appearance}} motionRules={entry.project.appearance?.partMotionRules||[]} motionValues={motionValues} onThumbnail={onThumbnail}/ >}{entry.panel&&<div className="rd-panel-preview"><DevicePanel panel={entry.panel.panel} states={states} interactive onAction={(id,value)=>setValues(v=>({...v,[id]:value}))}/></div>}<details><summary>模拟设备能力</summary>{(entry.project.capabilities||[]).map(cap=><label key={cap.capabilityId}>{cap.name}<input aria-label={'模拟能力 '+cap.name} value={String(motionValues[cap.capabilityId]??'')} onChange={e=>setValues(v=>({...v,[cap.capabilityId]:cap.dataType==='boolean'?e.target.value==='true':['number','integer'].includes(cap.dataType)?Number(e.target.value):e.target.value}))}/></label>)}<small>仅影响当前预览，不保存家庭绑定。</small></details></div>;
 }
 return null;
}
