import {a as React} from '../vendor/react.js';
import {detectLightColorCapability} from '../domain/light-color-capability.js';
export default function LightColorCapabilitySection({entity,children}){
 const capability=detectLightColorCapability(entity);
 if(capability.supported)return children;
 return <details key={entity.entityId+':'+capability.status+':'+capability.modes.join(',')} className="control-section light-color-debug"><summary className="control-section-heading" style={{cursor:'pointer'}}><strong>彩色调试</strong><span>{capability.status==='unsupported'?'未上报彩色支持':'彩色能力待确认'}</span></summary><p className="control-hint">手动展开仅供调试，设备可能忽略彩色请求或恢复实际色温。</p>{children}</details>;
}
