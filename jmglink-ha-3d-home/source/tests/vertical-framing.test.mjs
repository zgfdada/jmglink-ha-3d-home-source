import test from 'node:test';
import assert from 'node:assert/strict';
import {PerspectiveCamera,Vector3} from 'three';
import {verticalFramingOffset,bindVerticalProjectionDrag} from '../apps/web/src/domain/vertical-framing.js';
import {applyOrbitProjection} from '../apps/web/src/domain/camera-orbit.js';
const pointer=(type,props)=>Object.assign(new Event(type,{cancelable:true}),props);
test('右键只消费上下位移，窗口外松开、取消、失焦和卸载均清理拖动',()=>{
 const element=new EventTarget(),owner=new EventTarget();
 let capture=null,starts=0;const deltas=[];
 element.setPointerCapture=id=>capture=id;element.hasPointerCapture=id=>capture===id;element.releasePointerCapture=()=>capture=null;
 const stop=bindVerticalProjectionDrag(element,delta=>deltas.push(delta),()=>starts++,owner);
 element.dispatchEvent(pointer('pointerdown',{button:0,pointerId:1,clientY:10}));assert.equal(starts,0);
 element.dispatchEvent(pointer('pointerdown',{button:2,pointerId:2,clientY:10}));
 owner.dispatchEvent(pointer('pointermove',{buttons:2,pointerId:2,clientX:900,clientY:40}));
 assert.deepEqual(deltas,[30]);assert.equal(capture,2);
 owner.dispatchEvent(pointer('pointerup',{pointerId:2}));assert.equal(capture,null);
 for(const end of ['pointercancel','blur']){
  element.dispatchEvent(pointer('pointerdown',{button:2,pointerId:2,clientY:10}));
  owner.dispatchEvent(pointer(end,{pointerId:2}));
  owner.dispatchEvent(pointer('pointermove',{buttons:2,pointerId:2,clientY:90}));
 }
 assert.deepEqual(deltas,[30]);stop();
 element.dispatchEvent(pointer('pointerdown',{button:2,pointerId:2,clientY:0}));assert.equal(starts,3);
});
test('画面高度偏移有边界且不改相机姿态与世界轴心',()=>{
 assert.equal(verticalFramingOffset(0,72,720),.1);
 assert.equal(verticalFramingOffset(0,9999,720),.45);
 assert.equal(verticalFramingOffset(0,-9999,720),-.45);
 const camera=new PerspectiveCamera(36,1280/720,.1,200);camera.position.set(10,12,15);const target=new Vector3(0,3,0);
 camera.lookAt(target);camera.updateMatrixWorld(true);const position=camera.position.clone(),rotation=camera.quaternion.clone();
 applyOrbitProjection(camera,true,1280,720,{left:0,right:0,top:0,bottom:0},72);
 const point=target.clone().project(camera);
 assert.ok(Math.abs(point.y+.2)<1e-8);
 assert.ok(camera.position.equals(position));assert.ok(camera.quaternion.equals(rotation));
});
