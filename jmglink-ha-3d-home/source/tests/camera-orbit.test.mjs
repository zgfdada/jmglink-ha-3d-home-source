import test from 'node:test';
import assert from 'node:assert/strict';
import { PerspectiveCamera, Spherical, Vector3 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FLOOR_CAMERA_UP, FLOOR_ORBIT_LIMITS, presentationCameraPosition, applyOrbitProjection, anchorOrbitTarget, alignedTopCameraPosition, reachableOrbitPosition, cancelFitOnOrbitStart } from '../apps/web/src/domain/camera-orbit.js';

test('floor orbit keeps the camera above the foundation across a full horizontal revolution',()=>{
  const camera=new PerspectiveCamera();camera.up.fromArray(FLOOR_CAMERA_UP);
  const orbit=new OrbitControls(camera,null);Object.assign(orbit,FLOOR_ORBIT_LIMITS);
  orbit.target.set(2,1,3);
  for(let degrees=0;degrees<=360;degrees+=15){
    const offset=new Vector3().setFromSpherical(new Spherical(20,Math.PI/3,degrees*Math.PI/180));
    camera.position.copy(orbit.target).add(offset);orbit.update();
    assert.ok(camera.position.y>orbit.target.y);
    assert.ok(camera.position.clone().sub(orbit.target).distanceTo(offset)<1e-6);
  }
  camera.position.copy(orbit.target).add(new Vector3(1,-20,1));orbit.update();
  assert.ok(camera.position.y>orbit.target.y,'vertical drag cannot go under the floor');
});

test('top view remains stable with the same Y-up orbit axis',()=>{
  const camera=new PerspectiveCamera();camera.up.fromArray(FLOOR_CAMERA_UP);
  camera.position.set(0,30,.001);
  const orbit=new OrbitControls(camera,null);Object.assign(orbit,FLOOR_ORBIT_LIMITS);
  const initial=camera.position.clone();
  for(let i=0;i<30;i++)orbit.update();
  assert.ok(camera.position.distanceTo(initial)<1e-6);
});

test('top view matches plan X-right and Z-down axes regardless of viewport framing',()=>{
  for(const target of [[2,1,3],[8,1,3],[-4,1,7]]){
    const camera=new PerspectiveCamera();camera.up.fromArray(FLOOR_CAMERA_UP);
    camera.position.fromArray(alignedTopCameraPosition([2,31,3.001],[2,1,3],target));
    const orbit=new OrbitControls(camera,null);Object.assign(orbit,FLOOR_ORBIT_LIMITS);
    orbit.target.fromArray(target);orbit.update();
    const right=new Vector3(1,0,0).applyQuaternion(camera.quaternion);
    const down=new Vector3(0,-1,0).applyQuaternion(camera.quaternion);
    assert.ok(right.dot(new Vector3(1,0,0))>.99999,'plan X stays screen-right');
    assert.ok(down.dot(new Vector3(0,0,1))>.99999,'plan Y / scene Z stays screen-down');
  }
});

test('portrait fit finishes within orbit limits and manual tilt persists',()=>{
 const camera=new PerspectiveCamera();camera.up.fromArray(FLOOR_CAMERA_UP);
 const orbit=new OrbitControls(camera,null);Object.assign(orbit,FLOOR_ORBIT_LIMITS,{minDistance:3,maxDistance:26});
 const target=[2,1,3];orbit.target.fromArray(target);
 const destination=new Vector3(...reachableOrbitPosition([2,120,3.001],target,3,26));
 camera.position.set(12,15,18);
 const fitting={current:true};const cleanup=cancelFitOnOrbitStart(orbit,fitting);
 for(let i=0;i<200&&fitting.current;i++){
   camera.position.lerp(destination,.11);orbit.update();
   if(camera.position.distanceTo(destination)<.035)fitting.current=false;
 }
 assert.equal(fitting.current,false,'framing must finish');
 fitting.current=true;orbit.dispatchEvent({type:'start'});assert.equal(fitting.current,false);
 const tilted=new Vector3().setFromSpherical(new Spherical(20,Math.PI/3,.7));
 camera.position.copy(orbit.target).add(tilted);
 for(let i=0;i<60;i++)orbit.update();
 assert.ok(camera.position.clone().sub(orbit.target).distanceTo(tilted)<1e-6,'manual tilt persists');
 cleanup();fitting.current=true;orbit.dispatchEvent({type:'start'});assert.equal(fitting.current,true);
});

test('主页保留默认取景俯角，取景后可从接近俯视拖到接近水平',()=>{
 for(const stacked of [false,true]){
  const camera=new PerspectiveCamera();camera.up.fromArray(FLOOR_CAMERA_UP);
  const orbit=new OrbitControls(camera,null);Object.assign(orbit,FLOOR_ORBIT_LIMITS);
  orbit.target.set(3,4,5);
  const fitted=alignedTopCameraPosition(presentationCameraPosition([0,1,0],20,stacked),[0,1,0],orbit.target.toArray());
  camera.position.fromArray(fitted);const initial=camera.position.clone();orbit.update();
  assert.ok(camera.position.distanceTo(initial)<1e-6,'默认取景在轨道范围内');
  assert.ok(Math.abs(orbit.getPolarAngle()-(stacked?62:48)*Math.PI/180)<1e-8);
  for(const pitch of [.2,1.5]){
   camera.position.copy(orbit.target).add(new Vector3().setFromSpherical(new Spherical(20,pitch,.7)));
   orbit.update();
   assert.ok(Math.abs(orbit.getPolarAngle()-pitch)<1e-8);
   assert.ok(camera.position.y>orbit.target.y);
   assert.deepEqual(camera.up.toArray(),[0,1,0]);
  }
 }
});

test('侧栏投影偏移下旋转和缩放始终围绕户型轴心，提前中断取景也不留下漂移轴心',()=>{
 const target=[0,4,0];
 for(const insets of [{left:420,right:24,top:32,bottom:80},{left:24,right:400,top:60,bottom:20}]){
  const camera=new PerspectiveCamera(36,1280/720,.1,200);
  const orbit=new OrbitControls(camera,null);Object.assign(orbit,FLOOR_ORBIT_LIMITS,{enablePan:true,zoomToCursor:false});
  orbit.target.set(5,1,-2);camera.position.set(20,20,20);
  const beforeOffset=camera.position.clone().sub(orbit.target);
  anchorOrbitTarget(camera,orbit,target);
  assert.ok(camera.position.clone().sub(orbit.target).distanceTo(beforeOffset)<1e-9,'平移后恢复轴心保留观察方向与缩放距离');
  assert.deepEqual(orbit.target.toArray(),target);
  assert.equal(orbit.enablePan,true);assert.equal(orbit.zoomToCursor,false);
  applyOrbitProjection(camera,true,1280,720,insets);
  for(const radius of [10,20,35]) for(let angle=0;angle<Math.PI*2;angle+=Math.PI/12){
   camera.position.copy(orbit.target).add(new Vector3().setFromSpherical(new Spherical(radius,1,angle)));
   orbit.update();camera.updateMatrixWorld(true);
   const point=new Vector3(...target).project(camera);
   assert.ok(Math.abs(point.x-(insets.left-insets.right)/1280)<1e-8);
   assert.ok(Math.abs(point.y+(insets.top-insets.bottom)/720)<1e-8);
   assert.deepEqual(orbit.target.toArray(),target);
  }
  applyOrbitProjection(camera,false,1280,720,insets);
  assert.equal(camera.view.enabled,false);
 }
});
