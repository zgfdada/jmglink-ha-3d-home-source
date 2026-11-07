export const LIGHT_BEAM_TYPES = [
 ['light.ceiling','通用吸顶灯',38],['light.ceiling_panel','平板吸顶灯',38],['light.ceiling_round','圆形吸顶灯',38],
 ['light.downlight','筒灯／射灯',20],['light.chandelier','吊灯',39],['light.wall_sconce','壁灯',50],['light.floor_lamp','落地灯',56],['light.strip','灯带',100],
];
export function normalizeBeamAngle(value, fallback=38) {
 return typeof value==='number' && Number.isFinite(value)?Math.max(1,Math.min(160,value)):fallback;
}
export function normalizeBeamSettings(value) {
 const clean = map => Object.fromEntries(Object.entries(map && typeof map==='object' && !Array.isArray(map)?map:{}).filter(([key,v])=>key.length<200 && typeof v==='number' && Number.isFinite(v)).map(([key,v])=>[key,normalizeBeamAngle(v)]));
 return {types:clean(value?.types),fixtures:clean(value?.fixtures)};
}
export function lightBeamType(modelId='light.ceiling') {return modelId.replace(/^switch\.light\./,'light.');}
export function resolveBeamAngle(settings,modelId,id) {
 const type=lightBeamType(modelId), fallback=LIGHT_BEAM_TYPES.find(t=>t[0]===type)?.[2]??38;
 return normalizeBeamAngle(settings?.fixtures?.[id],normalizeBeamAngle(settings?.types?.[type],fallback));
}
export function beamRadius(length,angle) {return Math.max(.01,length)*Math.tan(normalizeBeamAngle(angle)*Math.PI/360);}
// Radius at the emitting aperture, followed by the configured side divergence.
export function beamFrustum(length,angle,variant) {
 const top={downlight:.07,ceiling:.23,chandelier:.15,wall:.06,floor:.12,strip:.035}[variant]??.07;
 return {top,bottom:top+beamRadius(length,angle)};
}
export function createBeamSettingsStore(storage=()=>globalThis.localStorage) {
 let snapshot;const listeners=new Set();
 const getSnapshot=()=>{if(!snapshot){try{snapshot=normalizeBeamSettings(JSON.parse(storage()?.getItem('ha3d.lightBeams')??'{}'));}catch{snapshot=normalizeBeamSettings();}}return snapshot;};
 return {getSnapshot,subscribe:fn=>{listeners.add(fn);return()=>listeners.delete(fn);},update:patch=>{
 snapshot=normalizeBeamSettings({...getSnapshot(),...patch});try{storage()?.setItem('ha3d.lightBeams',JSON.stringify(snapshot));}catch{}listeners.forEach(fn=>fn());
 }};
}
export const beamSettingsStore=createBeamSettingsStore();

// Resolve placed lights, never use an HA entity id as a per-fixture storage key.
export function resolvePanelBeamFixtures(project,entityId,selection) {
 const fixtures=(project?.floors??[]).flatMap(floor=>(floor.devices??[]).filter(device=>device.entityId===entityId).flatMap(device=>[
  ...((device.kind==='light'||device.modelId?.startsWith('light.')||device.modelId?.startsWith('switch.light.'))?[{id:device.id,modelId:lightBeamType(device.modelId),label:device.label||device.name||'灯具'}]:[]),
  ...(device.controlledLightFixtures??[]).map((fixture,index)=>({id:fixture.id,modelId:lightBeamType(fixture.modelId??'light.downlight'),label:fixture.label||`灯具 ${index+1}`})),
 ]));
 if(selection?.entityId===entityId){return fixtures.filter(fixture=>fixture.id===selection.id);}
 return fixtures;
}
export function setFixtureBeamAngle(id,angle,store=beamSettingsStore) {
 store.update({fixtures:{...store.getSnapshot().fixtures,[id]:normalizeBeamAngle(angle)}});
}
export function resetFixtureBeamAngle(id,store=beamSettingsStore) {
 const fixtures={...store.getSnapshot().fixtures};delete fixtures[id];store.update({fixtures});
}
