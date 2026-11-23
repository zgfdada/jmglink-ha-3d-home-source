const storageKey='ha3d.model-sync.pending.v1';
const intentId=()=>globalThis.crypto?.randomUUID?.()??`${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
// Older persisted intents contain a single type, or no type for a full scan.
const scopesOf=task=>task.types ?? (task.type ? [task.type] : []);

// Independent of development-center component lifetimes. Only a small intent is stored;
// actual upload snapshots and retries remain in the server's durable outbox.
export function createModelSyncBackground({storage,key=storageKey,loadRunner,setTimer=setTimeout,clearTimer=clearTimeout,makeId=intentId}){
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
        const onOwner=owner=>{
          if(!task.owner&&owner){task.owner=owner;if(read()?.id===task.id)write(task);}
        };
        const scopes=scopesOf(task), errors=[];
        for(const type of scopes.length ? scopes : [undefined]){
          try{await runner(()=>{},{type,expectedOwner:task.owner,onOwner});}
          catch(error){errors.push(error.message||'后台同步暂未完成');}
        }
        if(errors.length)throw Error(errors.join('；'));
        if(read()?.id===task.id)write(null);
        publish({state:'idle',error:''});
      }catch(error){
        publish({state:'waiting',error:error.message||'后台同步暂未完成'});
        if(!disposed)timer=setTimer(()=>{timer=null;void kick();},30000);
      }
    })().finally(()=>{
      active=null;
      if(!disposed&&read()&&read().id!==task.id)void kick();
    });
    return active;
  };
  return {
    request({type} = {}){
      const pending = read();
      const scopes = pending ? scopesOf(pending) : [];
      // Merge section exits without scheduling unrelated resources. A full scan covers all sections.
      const types = type && (!pending || scopes.length) ? [...new Set([...scopes, type])] : [];
      write({id:makeId(),owner:pending?.owner??null,types});
      void kick();
    },
    resume:kick,
    retry(){if(timer){clearTimer(timer);timer=null;}void kick();},
    getState:()=>state,
    subscribe(listener){listeners.add(listener);return()=>listeners.delete(listener);},
    dispose(){disposed=true;if(timer)clearTimer(timer);listeners.clear();},
  };
}

export function browserSyncBackground(key,loadRunner){
  let instance;
  return ()=>{
    if(instance)return instance;
    let storage;try{storage=window.localStorage;}catch{storage={getItem:()=>null,setItem:()=>{},removeItem:()=>{}};}
    instance=createModelSyncBackground({storage,key:key+':'+new URL('./',document.baseURI).pathname,loadRunner});
    window.addEventListener('online',()=>instance.retry());
    window.addEventListener('ha3d-account-changed',()=>instance.retry());
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)void instance.resume();});
    return instance;
  };
}
const background=browserSyncBackground(storageKey,async()=>{
  const module=await import('../device-development-center/model-library.jsx');return module.syncModelLibraryOnExit;
});
export const scheduleModelLibrarySync=()=>background().request();
export const resumeModelLibrarySync=()=>background().resume();
export const retryModelLibrarySync=()=>background().retry();
export const getModelLibrarySyncState=()=>background().getState();
export const subscribeModelLibrarySync=listener=>background().subscribe(listener);
