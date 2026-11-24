import {a as React} from '../../vendor/react.js';
import ControlPreview from '../device-development-center/control-preview.jsx';
import DevicePanel from '../../components/device-panel.jsx';
import DevicePreviewState, {useDevicePreviewState} from './device-preview-state.jsx';
import './device-preview-state.css';
import MotionResourcePreview from '../device-development-center/motion-resource-preview.jsx';
import ModelPreview from '../device-development-center/model-preview.jsx';

export default function PortablePreview({entry,model,onThumbnail}){

 const [active,setActive]=React.useState(true),[playing,setPlaying]=React.useState(true);
 if(!entry)return null;
 if(entry.kind==='control')return <ControlPreview definition={entry.control}/>;
 if(entry.format==='ha3d-motion-v1')return <div><MotionResourcePreview resource={entry.motion} active={active} playing={playing} onThumbnail={onThumbnail}/><button onClick={()=>setActive(v=>!v)}>{active?'模拟条件：满足':'模拟条件：不满足'}</button><button onClick={()=>setPlaying(v=>!v)}>{playing?'暂停预览':'继续预览'}</button><small>仅本地模拟，不调用设备</small></div>;
 if(entry.format==='ha3d-device-project-v1')return <DeviceResourcePreview entry={entry} model={model} onThumbnail={onThumbnail}/>;
 return null;
}

function DeviceResourcePreview({entry, model, onThumbnail}) {
  const simulation = useDevicePreviewState(entry);
  return <div className="rd-device-preview">
    {(model || entry.model) && <ModelPreview key={simulation.resetKey}
      model={model || {...entry.model.model, ...entry.project.appearance}}
      motionRules={simulation.rules} motionValues={simulation.values} onThumbnail={onThumbnail}/>}
    <DevicePreviewState simulation={simulation}/>
    {entry.panel && <div className="rd-panel-preview">
      <DevicePanel panel={entry.panel.panel} states={simulation.states} interactive onAction={simulation.setValue}/>
    </div>}
  </div>;
}