import test from 'node:test';
import assert from 'node:assert/strict';
import { PerspectiveCamera, Spherical, Vector3 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FLOOR_CAMERA_UP, FLOOR_ORBIT_LIMITS, alignedTopCameraPosition } from '../apps/web/src/domain/camera-orbit.js';

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
