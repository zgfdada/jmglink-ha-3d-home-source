import {a as React} from '../vendor/react.js';
import {u as useThree,b as useFrame} from '../vendor/three.js';
import {Vector2,Vector3,Plane,Raycaster} from 'three';
import {captureWalkCamera,restoreWalkCamera,applyWalkPose} from '../domain/first-person-camera.js';
import {createWalkNavigation,canWalkAt,walkStep,walkingDelta} from '../domain/first-person-navigation.js';
import {resolveFloorVerticalElevations} from '../domain/vertical-reference.js';

export default function FirstPersonController({mode,spawn,floor,entities,wallThicknessScale,input,onSpawn,onExit,onNotice,onLocked}) {
  const {camera,gl,controls,invalidate}=useThree();
  const elevations=resolveFloorVerticalElevations(floor,entities,{presentation:true});
  const geometryKey=JSON.stringify([floor.height,floor.walls,floor.rooms?.map(room=>room.polygon),floor.openings,floor.furniture?.map(item=>[item.id,item.position,item.width,item.depth,item.height,item.rotation,item.kind,item.cabinetSegments,item.customModel?.source,elevations.get(`furniture:${item.id}`)])]);
  const nav=React.useMemo(()=>createWalkNavigation(floor,{wallThicknessScale,elevations}),[geometryKey,wallThicknessScale]);
  const saved=React.useRef(null),keys=React.useRef(new Set()),pose=React.useRef({point:[0,0],yaw:0,pitch:0});
  const callbacks=React.useRef({onSpawn,onExit,onNotice,onLocked});callbacks.current={onSpawn,onExit,onNotice,onLocked};
  const restore=()=>{
    const old=saved.current;if(!old)return;
    saved.current=null;
    if(document.pointerLockElement===gl.domElement)document.exitPointerLock();
    restoreWalkCamera(camera,controls,old);
    keys.current.clear();input.current.move=[0,0];invalidate();
  };
  React.useEffect(()=>{
    if(mode!=='idle' && !saved.current)saved.current=captureWalkCamera(camera,controls);
    if(mode==='walking' && spawn){
      pose.current={point:[...spawn],yaw:0,pitch:0};
      camera.fov=70;camera.near=.04;camera.up.set(0,1,0);camera.updateProjectionMatrix();invalidate();
    }
    if(mode==='idle')restore();
  },[mode,spawn]);
  React.useEffect(()=>()=>restore(),[]);
  React.useEffect(()=>{
    if(mode==='idle')return;
    const canvas=gl.domElement,abort=new AbortController(),options={signal:abort.signal};
    let drag=null;
    const clear=()=>{keys.current.clear();input.current.move=[0,0];drag=null;};
    const look=(dx,dy)=>{
      pose.current.yaw-=dx*.003;
      pose.current.pitch=Math.max(-Math.PI*.47,Math.min(Math.PI*.47,pose.current.pitch-dy*.003));invalidate();
    };
    const pick=event=>{
      if(event.button!==0)return;
      if(mode==='placing'){
        event.preventDefault();event.stopImmediatePropagation();
        const rect=canvas.getBoundingClientRect(),ray=new Raycaster();
        ray.setFromCamera(new Vector2((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1),camera);
        const hit=ray.ray.intersectPlane(new Plane(new Vector3(0,1,0),0),new Vector3());
        const point=hit?[hit.x+nav.center[0],hit.z+nav.center[1]]:null;
        if(point && canWalkAt(nav,point)){clear();callbacks.current.onSpawn?.(point);}
        else callbacks.current.onNotice?.('这里无法站立，请选择房间内远离墙体和家具的空地。');
        return;
      }
      if(document.pointerLockElement===canvas){event.stopImmediatePropagation();return;}
      drag={id:event.pointerId,startX:event.clientX,startY:event.clientY,x:event.clientX,y:event.clientY,moved:false};
    };
    canvas.addEventListener('pointerdown',pick,{...options,capture:true});
    window.addEventListener('pointermove',event=>{
      if(mode!=='walking')return;
      if(document.pointerLockElement===canvas){look(event.movementX,event.movementY);return;}
      if(!drag||event.pointerId!==drag.id)return;
      if(Math.hypot(event.clientX-drag.startX,event.clientY-drag.startY)>4)drag.moved=true;
      if(drag.moved)look(event.clientX-drag.x,event.clientY-drag.y);
      drag.x=event.clientX;drag.y=event.clientY;
    },options);
    const release=event=>{if(drag?.id===event.pointerId)drag=null;};
    window.addEventListener('pointerup',release,options);window.addEventListener('pointercancel',release,options);
    window.addEventListener('keydown',event=>{
      if(event.code==='Escape'){callbacks.current.onExit?.();return;}
      if(event.code==='AltLeft'||event.code==='AltRight'){if(document.pointerLockElement===canvas){event.preventDefault();document.exitPointerLock();}clear();return;}
      if(mode!=='walking'||event.target?.closest?.('input,textarea,select,[contenteditable="true"]'))return;
      if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight'].includes(event.code)){event.preventDefault();keys.current.add(event.code);invalidate();}
    },options);
    window.addEventListener('keyup',event=>keys.current.delete(event.code),options);
    window.addEventListener('blur',clear,options);document.addEventListener('visibilitychange',clear,options);
    document.addEventListener('pointerlockchange',()=>{clear();callbacks.current.onLocked?.(document.pointerLockElement===canvas);},options);
    document.addEventListener('pointerlockerror',()=>callbacks.current.onNotice?.('当前环境无法锁定鼠标，请拖动画面环顾。'),options);
    input.current.invalidate=invalidate;
    input.current.lock=()=>{
      if(mode!=='walking')return;
      if(!canvas.requestPointerLock){callbacks.current.onNotice?.('当前浏览器不支持锁定鼠标，请拖动画面环顾。');return;}
      try {const result=canvas.requestPointerLock();result?.catch?.(()=>callbacks.current.onNotice?.('未能锁定鼠标，请拖动画面环顾。'));}catch{callbacks.current.onNotice?.('未能锁定鼠标，请拖动画面环顾。');}
    };
    return()=>{abort.abort();clear();input.current.lock=null;input.current.invalidate=null;};
  },[mode,nav,camera,gl,controls,invalidate]);
  useFrame((state,seconds)=>{
    if(mode!=='walking')return;
    const held=keys.current,p=pose.current,move=input.current.move??[0,0];
    const forward=Number(held.has('KeyW')||held.has('ArrowUp'))-Number(held.has('KeyS')||held.has('ArrowDown'))-move[1];
    const right=Number(held.has('KeyD')||held.has('ArrowRight'))-Number(held.has('KeyA')||held.has('ArrowLeft'))+move[0];
    p.point=walkStep(nav,p.point,walkingDelta(forward,right,p.yaw,seconds,held.has('ShiftLeft')||held.has('ShiftRight')?2.4:1.4));
    applyWalkPose(camera,p.point,nav.center,nav.eyeHeight,p.yaw,p.pitch);
    if(forward||right)invalidate();
  });
  return null;
}
