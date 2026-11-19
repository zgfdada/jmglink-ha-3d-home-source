import {createModelSyncBackground} from './model-sync-background.js';
const instances=new Map(),listeners=new Set();let listening=false;
const prefix=()=> 'ha3d.sidebar-sync.pending.v1:'+new URL('./',document.baseURI).pathname+':';
const storage=()=>{try{return window.localStorage;}catch{return {getItem:()=>null,setItem:()=>{},removeItem:()=>{},length:0};}};
const publish=()=>{const state=getSidebarSyncState();for(const listener of listeners)listener(state);};
function get(projectId,floorId){
  const scope=JSON.stringify([projectId,floorId||null]);
  if(!instances.has(scope)){
    const queue=createModelSyncBackground({storage:storage(),key:prefix()+encodeURIComponent(scope),loadRunner:async()=>{
      const {syncSidebarAfterSave}=await import('./sidebar-sync-runner.js');
      return (_progress,context)=>syncSidebarAfterSave(projectId,floorId,context);
    }});
    queue.subscribe(publish);instances.set(scope,queue);
  }
  if(!listening){listening=true;window.addEventListener('online',retrySidebarSync);window.addEventListener('ha3d-account-changed',retrySidebarSync);document.addEventListener('visibilitychange',()=>{if(!document.hidden)resumeSidebarSync();});}
  return instances.get(scope);
}
export const getSidebarSyncState=()=>[...instances.values()].map(queue=>queue.getState()).filter(state=>state.state!=='idle');
export const subscribeSidebarSync=listener=>{listeners.add(listener);return()=>listeners.delete(listener);};
export const scheduleSidebarSync=(projectId,floorId)=>get(projectId,floorId).request();
export const retrySidebarSync=()=>{for(const queue of instances.values())queue.retry();};
export function resumeSidebarSync(){
  const disk=storage(),keys=[];
  for(let i=0;i<disk.length;i++){const key=disk.key(i);if(key?.startsWith(prefix()))keys.push(key);}
  for(const key of keys)try{const [project,floor]=JSON.parse(decodeURIComponent(key.slice(prefix().length)));if(typeof project==='string')void get(project,floor).resume();}catch{/* Ignore invalid unrelated browser storage entries. */}
}
