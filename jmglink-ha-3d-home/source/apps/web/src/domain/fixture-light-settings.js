import {FIXTURE_LIGHT_BALANCE} from './fixture-lighting.js';
export const FIXTURE_LIGHT_STORAGE_KEY='ha3d.fixtureLighting';
export function normalizeFixtureLightSettings(value){
 const bounded=(n,max,fallback)=>typeof n==='number'&&Number.isFinite(n)?Math.max(0,Math.min(max,n)):fallback;
 return {emitter:bounded(value?.emitter,2,FIXTURE_LIGHT_BALANCE.emitter),illumination:bounded(value?.illumination,3,FIXTURE_LIGHT_BALANCE.illumination)};
}
export function createFixtureLightSettingsStore(storage=()=>globalThis.localStorage){
 let snapshot;const listeners=new Set();
 const getSnapshot=()=>{
  if(!snapshot){try{snapshot=normalizeFixtureLightSettings(JSON.parse(storage()?.getItem(FIXTURE_LIGHT_STORAGE_KEY)??'{}'));}catch{snapshot=normalizeFixtureLightSettings();}}
  return snapshot;
 };
 return {getSnapshot,subscribe:listener=>{listeners.add(listener);return()=>listeners.delete(listener);},update:patch=>{
  const current=getSnapshot(),next=normalizeFixtureLightSettings({...current,...patch});
  if(next.emitter===current.emitter&&next.illumination===current.illumination)return;
  snapshot=next;
  try{storage()?.setItem(FIXTURE_LIGHT_STORAGE_KEY,JSON.stringify(snapshot));}catch{}
  listeners.forEach(listener=>listener());
 }};
}
export const fixtureLightSettingsStore=createFixtureLightSettingsStore();
