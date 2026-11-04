export const ROTATION_IDLE_MS = 8000;

export function createIdleRotation(onChange, {setTimer=setTimeout, clearTimer=clearTimeout, delay=ROTATION_IDLE_MS}={}) {
  let timer=null, running=true, blocked=false, hidden=false, focused=false, disposed=false;
  const pointers=new Set();
  const clear=()=>{if(timer!==null)clearTimer(timer);timer=null;};
  const emit=value=>{if(!disposed&&running!==value){running=value;onChange(value);}};
  const allowed=()=>!blocked&&!hidden&&!focused&&!pointers.size;
  const settle=()=>{
    clear();emit(false);
    if(!disposed&&allowed())timer=setTimer(()=>{timer=null;if(!disposed&&allowed())emit(true);},delay);
  };
  return {
    activity:settle,
    pointerDown(id){pointers.add(id);settle();},
    pointerUp(id){if(pointers.delete(id))settle();},
    setFocused(value){focused=!!value;settle();},
    setBlocked(value){if(blocked!==!!value){blocked=!!value;settle();}},
    setHidden(value){if(hidden!==!!value){hidden=!!value;settle();}},
    release(){pointers.clear();focused=false;settle();},
    dispose(){disposed=true;clear();},
  };
}

export function bindIdleRotation(root, controller, owner=window, doc=document) {
  const activity=()=>controller.activity();
  const down=event=>controller.pointerDown(event.pointerId);
  const up=event=>controller.pointerUp(event.pointerId);
  const focus=()=>controller.setFocused(true);
  const blur=event=>controller.setFocused(!!event.relatedTarget&&root.contains(event.relatedTarget));
  const release=()=>controller.release();
  const visibility=()=>controller.setHidden(doc.hidden);
  const options={capture:true,passive:true};
  const events=['pointermove','pointerenter','pointerleave','wheel','keydown'];
  for(const type of events)root.addEventListener(type,activity,options);
  root.addEventListener('pointerdown',down,options);
  root.addEventListener('focusin',focus,options);
  root.addEventListener('focusout',blur,options);
  owner.addEventListener('pointerup',up,options);
  owner.addEventListener('pointercancel',up,options);
  owner.addEventListener('blur',release);
  owner.addEventListener('focus',activity);
  doc.addEventListener('visibilitychange',visibility);
  visibility();
  if(doc.activeElement&&root.contains(doc.activeElement)&&doc.activeElement!==root)controller.setFocused(true);
  return ()=>{
    for(const type of events)root.removeEventListener(type,activity,options);
    root.removeEventListener('pointerdown',down,options);
    root.removeEventListener('focusin',focus,options);
    root.removeEventListener('focusout',blur,options);
    owner.removeEventListener('pointerup',up,options);
    owner.removeEventListener('pointercancel',up,options);
    owner.removeEventListener('blur',release);
    owner.removeEventListener('focus',activity);
    doc.removeEventListener('visibilitychange',visibility);
    controller.dispose();
  };
}
