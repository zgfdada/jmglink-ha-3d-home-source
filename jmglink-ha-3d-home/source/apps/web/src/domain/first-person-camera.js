import {Euler} from 'three';
export function captureWalkCamera(camera,controls) {
  return {position:camera.position.clone(),quaternion:camera.quaternion.clone(),up:camera.up.clone(),fov:camera.fov,near:camera.near,target:controls?.target?.clone()};
}
export function restoreWalkCamera(camera,controls,saved) {
  camera.position.copy(saved.position);camera.quaternion.copy(saved.quaternion);camera.up.copy(saved.up);camera.fov=saved.fov;camera.near=saved.near;camera.updateProjectionMatrix();
  if(controls?.target&&saved.target){controls.target.copy(saved.target);controls.update();}
}
export function applyWalkPose(camera,point,center,eyeHeight,yaw,pitch) {
  camera.position.set(point[0]-center[0],eyeHeight,point[1]-center[1]);
  camera.quaternion.setFromEuler(new Euler(pitch,yaw,0,'YXZ'));
}

// Navigation uses unrotated floor coordinates during both spawn picking and walking.
// Keep the presentation turn so leaving navigation restores the same overview.
export function syncWalkSceneRotation(root,active,state) {
  if(!root)return;
  if(active){if(state.rotation===null)state.rotation=root.rotation.y;root.rotation.y=0;}
  else if(state.rotation!==null){root.rotation.y=state.rotation;state.rotation=null;}
  root.updateMatrixWorld(true);
}
