import {deviceCapabilityEntities} from '../../../../packages/schema/src/associated-entities.js';
import {deviceValueLabel} from '../../../../packages/schema/src/device-value-labels.js';

export function motionStateCapabilities(capabilities,binding,device){
  const entities=new Map(deviceCapabilityEntities(device).map(entity=>[entity.entityId,entity]));
  return capabilities.map(cap=>{
    const mapping=binding?.capabilityMappings?.[cap.capabilityId];
    const entity=entities.get(mapping?.entityId ?? binding?.capabilityBindings?.[cap.capabilityId]?.[0]);
    if(!entity||(mapping?.attribute ?? 'state')!=='state')return cap;
    const saved=(cap.enumValues ?? []).filter(value=>value.status!=='missing');
    const options=entity.attributes?.options;
    const values=Array.isArray(options)?options:entity.domain==='device_tracker'?['home','not_home',...saved.map(v=>v.value),entity.state]:saved.map(v=>v.value);
    const enumValues=[...new Set(values.filter(v=>v!=null&&!['unknown','unavailable'].includes(String(v))).map(String))].map(value=>{
      const previous=saved.find(v=>String(v.value)===value);
      return {...previous,value,label:deviceValueLabel(value,previous?.label,{...cap,entityId:entity.entityId,stateLabels:entity.stateLabels,labelSource:previous?.source==='manual'?'custom':previous?.labelSource})};
    });
    return {...cap,enumValues,currentState:entity.state,currentStateLabel:deviceValueLabel(entity.state,undefined,{...cap,entityId:entity.entityId,stateLabels:entity.stateLabels})};
  });
}
