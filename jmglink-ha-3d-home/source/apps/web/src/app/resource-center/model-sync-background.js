const storageKey='ha3d.model-sync.pending.v1';

// Independent of development-center component lifetimes. Only a small intent is stored;
// actual upload snapshots and retries remain in the server's durable outbox.
export function createModelSyncBackground({storage,key=storageKey,loadRunner,setTimer=setTimeout,clearTimer=clearTimeout,makeId=()=>globalThis.crypto.randomUUID()}){
  let active=null,timer=null,memory=null,disposed=false,state={state:'idle',error:''};
  const listeners=new Set();
  const read=()=>{try{return JSON.parse(storage.getItem(key)||'null')||memory;}catch{return memory;}};
  const write=task=>{memory=task;try{task?storage.setItem(key,JSON.stringify(task)):storage.removeItem(key);}catch{/* Continue in memory if browser storage is unavailable. */}};
  const publish=next=>{state=next;for(const listener of listeners)listener(state);};
  const kick=()=>{
    if(disposed||active)return active;
    const task=read();if(!task)return Promise.resolve();
    if(timer){clearTimer(timer);timer=null;}
    active=(async()=>{
      publish({state:'preparing',error:''});
      try{
        const runner=await loadRunner();
        await runner(()=>{}, {expectedOwner:task.owner,onOwner:owner=>{
          if(!task.owner&&owner){task.owner=owner;if(read()?.id===task.id)write(task);}
        }});
        if(read()?.id===task.id)write(null);
        publish({state:'idle',error:''});
      }catch(error){
        publish({state:'waiting',error:error.message||'模型同步暂未完成'});
        if(!disposed)timer=setTimer(()=>{timer=null;void kick();},30000);
      }
    })().finally(()=>{
      active=null;
      if(!disposed&&read()&&read().id!==task.id)void kick();
    });
    return active;
  };
  return {
    request(){write({id:makeId(),owner:null});void kick();},
    resume:kick,
    retry(){if(timer){clearTimer(timer);timer=null;}void kick();},
    getState:()=>state,
    subscribe(listener){listeners.add(listener);return()=>listeners.delete(listener);},
    dispose(){disposed=true;if(timer)clearTimer(timer);listeners.clear();},
  };
}

let instance;
function background(){
  if(!instance){
    let storage;try{storage=window.localStorage;}catch{storage={getItem:()=>null,setItem:()=>{},removeItem:()=>{}};}
    instance=createModelSyncBackground({storage,key:storageKey+':'+new URL('./',document.baseURI).pathname,loadRunner:async()=>{
      const module=await import('../device-development-center/model-library.jsx');return module.syncModelLibraryOnExit;
    }});
    window.addEventListener('online',()=>instance.retry());
    window.addEventListener('ha3d-account-changed',()=>instance.retry());
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)void instance.resume();});
  }
  return instance;
}
export const scheduleModelLibrarySync=()=>background().request();
export const resumeModelLibrarySync=()=>background().resume();
export const retryModelLibrarySync=()=>background().retry();
export const getModelLibrarySyncState=()=>background().getState();
export const subscribeModelLibrarySync=listener=>background().subscribe(listener);
