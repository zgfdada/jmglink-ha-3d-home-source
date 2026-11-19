import {normalizeDeviceTemplate,normalizeControlPanelTemplate,normalizeLibraryControl,normalizeMotionResource,partMotionIssues} from './device-schema.js';
const json=value=>JSON.parse(JSON.stringify(value));
const canonical=value=>value&&typeof value==='object'?(Array.isArray(value)?'['+value.map(canonical).join(',')+']':'{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}'):JSON.stringify(value);
const privateKey=/^(?:entityIds?|selectedEntityIds|deviceId|deviceIds|registryId|entityRegistryRefs|capabilityBindings|capabilityMappings|bindings|accountNames|accountId|token|accessToken|refreshToken|password|secret|cookie|authorization|haUrl|restUrl|websocketUrl|library|resourceSharing|references|createdAt|updatedAt|publishedAt)$/i;
// Keep logical capability slots and declarative/service definitions; never ship instance bindings.
export function stripInstanceData(value){
 if(Array.isArray(value))return value.map(stripInstanceData);
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).filter(([key])=>!privateKey.test(key)).map(([key,item])=>[key,stripInstanceData(item)]));
 if(typeof value==='string'&&/(?:https?:\/\/|file:\/\/|[a-z]:[\\/]|^\/(?:Users|home|mnt|var|etc)\/)/i.test(value))return '';
 return value;
}
const times=value=>{const copy=json(value);delete copy.createdAt;delete copy.updatedAt;return copy;};
export function portableControl(control){return {format:'ha3d-device-control-v1',kind:'control',control:json(normalizeLibraryControl({...stripInstanceData(control),id:'custom.portable-control',builtin:false,version:1}))};}
export function portablePanel(panel,capabilities=[]){
 const clean=stripInstanceData(panel),normalized=times(normalizeControlPanelTemplate({...clean,id:'custom.portable-panel',deviceTemplateId:undefined,builtin:false}));delete normalized.deviceTemplateId;
 const caps=normalizeDeviceTemplate({id:'custom.portable-device',name:'面板能力槽位',capabilities:stripInstanceData(capabilities)}).capabilities;
 return {format:'ha3d-device-control-v1',kind:'panel',panel:normalized,capabilities:json(caps)};
}
export function portableMotion(motion){return {format:'ha3d-motion-v1',motion:json(normalizeMotionResource({...stripInstanceData(motion),id:'custom.motion.portable',builtin:false,version:1}))};}
export function portableDeviceProject(bundle,modelEntry){
 const project=times(normalizeDeviceTemplate({...stripInstanceData(bundle.project),id:'custom.portable-device',modelTemplateId:modelEntry?'custom.portable-model':undefined,controlPanelTemplateId:bundle.panel?'custom.portable-panel':undefined,builtin:false}));
 project.matchRules.names=[];
 const panel=bundle.panel?portablePanel(bundle.panel,project.capabilities):null;
 const issues=partMotionIssues(project.appearance?.partMotionRules,project.capabilities);if(issues.length)throw Error(issues.join('；'));
 if(panel){const ids=new Set(project.capabilities.map(c=>c.capabilityId));for(const section of panel.panel.sections)for(const control of section.controls)if(control.capabilityId&&!ids.has(control.capabilityId))throw Error('面板引用了缺失的设备能力');}
 return {format:'ha3d-device-project-v1',project:json(project),model:modelEntry?json(modelEntry):null,panel};
}
export function validateAdditionalEntry(type,payload){
 let normalized;
 if(type==='motion'){if(payload.format!=='ha3d-motion-v1')throw Error('动效入口格式无效');normalized=portableMotion(payload.motion);}
 else if(type==='device-control'){if(payload.format!=='ha3d-device-control-v1')throw Error('控制面板入口格式无效');if(payload.kind==='control')normalized=portableControl(payload.control);else if(payload.kind==='panel')normalized=portablePanel(payload.panel,payload.capabilities);else throw Error('未知控件/面板类型');}
 else if(type==='device-project'){if(payload.format!=='ha3d-device-project-v1')throw Error('设备项目入口格式无效');normalized=portableDeviceProject({project:payload.project,panel:payload.panel?.panel},payload.model);}
 else throw Error('不支持的资源类型');
 if(canonical(normalized)!==canonical(payload))throw Error('资源包含非便携字段、家庭绑定或无效结构');return normalized;
}
