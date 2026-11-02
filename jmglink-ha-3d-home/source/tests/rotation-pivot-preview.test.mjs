import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { rotationPivotFrame, rotationTrialRules, createRotationPivotGizmo, rotationWorldUnitsPerPixel } from "../apps/web/src/domain/rotation-pivot-preview.js";
import { createPartMotionEngine, modelPartNodes } from "../apps/web/src/domain/part-motion-engine.js";

const near=(a,b)=>assert.ok(a.distanceTo(b)<1e-7,`${a.toArray()} != ${b.toArray()}`);

test("顶盖框架、玻璃与偏移把手共用轴心，任意角度保持组合相对位置",()=>{
  for(const axis of ["x","y","z"])for(const angle of [-170,-65,45,90]){
    const root=new THREE.Group(),frame=new THREE.Group(),glass=new THREE.Group(),handle=new THREE.Group();
    root.scale.set(1.2,.8,1.4);root.rotation.set(.1,.4,.2);
    frame.position.set(0,1,0);glass.position.set(.1,1.02,0);handle.position.set(0,1.05,.6);handle.rotation.y=.4;
    root.add(frame,glass,handle);root.updateMatrixWorld(true);
    const before=[frame,glass,handle].map(node=>node.getWorldPosition(new THREE.Vector3()));
    const rules=rotationTrialRules({targets:["root/0","root/1","root/2"],axis,pivot:[0,0,-.3],angle});
    const engine=createPartMotionEngine(root,rules);
    engine.update({"rotation-axis-trial":"on"},0,0);root.updateMatrixWorld(true);
    const after=[frame,glass,handle].map(node=>node.getWorldPosition(new THREE.Vector3()));
    for(let a=0;a<3;a++)for(let b=a+1;b<3;b++)assert.ok(Math.abs(before[a].distanceTo(before[b])-after[a].distanceTo(after[b]))<1e-7);
    engine.update({"rotation-axis-trial":"off"},1,0);root.updateMatrixWorld(true);
    [frame,glass,handle].forEach((node,index)=>{near(node.getWorldPosition(new THREE.Vector3()),before[index]);assert.equal(node.matrixAutoUpdate,true);});
    engine.dispose();
  }
});

test("同时勾选父节点与子节点只旋转一次，跨缩放父层仍保持刚性组合",()=>{
  const root=new THREE.Group(),a=new THREE.Group(),b=new THREE.Group(),child=new THREE.Group();
  root.add(a,b);a.add(child);a.scale.set(2,1,.5);b.scale.set(.5,2,1);b.position.set(2,0,0);child.position.set(0,0,1);
  root.updateMatrixWorld(true);const before=child.getWorldPosition(new THREE.Vector3());
  const engine=createPartMotionEngine(root,rotationTrialRules({targets:["root/0/0","root/0","root/1"],axis:"y",pivot:[0,0,0],angle:90}));
  engine.update({"rotation-axis-trial":"on"},0,0);root.updateMatrixWorld(true);
  near(child.getWorldPosition(new THREE.Vector3()),before.applyAxisAngle(new THREE.Vector3(0,1,0),Math.PI/2));
  engine.dispose();assert.equal(a.matrixAutoUpdate,true);assert.equal(b.matrixAutoUpdate,true);
});

test("多选部件试转同时使用全部目标，与实际规则相同",()=>{
  const root=new THREE.Group(),a=new THREE.Group(),b=new THREE.Group();root.add(a,b);
  const rules=rotationTrialRules({targets:["root/0","root/1"],axis:"y",pivot:[0,0,0],angle:90});
  const engine=createPartMotionEngine(root,rules);engine.update({"rotation-axis-trial":"on"},0,0);
  const expected=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),Math.PI/2);
  assert.ok(a.quaternion.angleTo(expected)<1e-7);
  assert.ok(b.quaternion.angleTo(expected)<1e-7);
  engine.dispose();
});

test("辅助轴按屏幕像素定长，不随相机距离、视野和画布尺寸变化",()=>{
  for(const distance of [2,10,30])for(const height of [300,600])for(const zoom of [1,2]){
    const camera=new THREE.PerspectiveCamera(40,1,.01,1000);camera.position.z=distance;camera.zoom=zoom;camera.updateProjectionMatrix();camera.updateMatrixWorld();
    const origin=new THREE.Vector3(),length=rotationWorldUnitsPerPixel(camera,origin,height)*72;
    const start=origin.clone().project(camera),end=new THREE.Vector3(length,0,0).project(camera);
    assert.ok(Math.abs((end.x-start.x)*height/2-72)<1e-6);
  }
});

test("辅助轴与真实动效共用局部轴心，在父节点旋转缩放后仍保持轴心不动",()=>{
  for(const axis of ["x","y","z"]){
    const scene=new THREE.Scene(),root=new THREE.Group(),part=new THREE.Group();
    root.position.set(2,3,4);root.rotation.set(.2,.7,.3);root.scale.set(1.2,.8,1.5);
    part.position.set(1,2,3);part.rotation.set(.1,.3,.2);part.scale.set(.8,1.1,.9);
    scene.add(root);root.add(part);scene.updateMatrixWorld(true);
    const baseline={position:part.position.clone(),quaternion:part.quaternion.clone(),scale:part.scale.clone()};
    const config={targets:["root/0"],axis,pivot:[.2,-.3,.4],angle:90};
    const before=new THREE.Vector3(...config.pivot).applyMatrix4(rotationPivotFrame(part,baseline));
    const engine=createPartMotionEngine(root,rotationTrialRules(config));
    engine.update({"rotation-axis-trial":"on"},0,0);
    scene.updateMatrixWorld(true);
    near(part.localToWorld(new THREE.Vector3(...config.pivot)),before);
    // Drag conversion returns the exact persisted local XYZ even under scaled parents.
    near(before.clone().applyMatrix4(rotationPivotFrame(part,baseline).invert()),new THREE.Vector3(...config.pivot));
    engine.dispose();near(part.position,baseline.position);
  }
});

test("试转只创建临时规则，不改写设备规则，也不包含程序代码或模拟状态",()=>{
  const config={targets:["root/0"],axis:"y",pivot:[1,2,3],angle:-45};
  const snapshot=structuredClone(config),rule=rotationTrialRules(config)[0];
  assert.deepEqual(config,snapshot);
  assert.equal(rule.effect.to,-45);
  assert.equal(rule.effect.type,"rotate");
  assert.equal(rule.transitionMs,0);
  assert.equal(rule.effect.program,undefined);
  assert.equal(rotationTrialRules({...config,angle:null}),null);
});

test("辅助控件不进入部件树，关闭预览移除所有辅助对象和事件监听",()=>{
  const listeners=new Map();
  const dom={style:{},addEventListener:(name,fn)=>listeners.set(name,fn),removeEventListener:(name)=>listeners.delete(name),getRootNode:()=>dom};
  const scene=new THREE.Scene(),root=new THREE.Group(),part=new THREE.Group();root.add(part);scene.add(root);
  const camera=new THREE.PerspectiveCamera(),orbit={enabled:true};
  const count=modelPartNodes(root).size;
  const gizmo=createRotationPivotGizmo({scene,camera,domElement:dom,orbit,onChange:()=>{}});
  gizmo.update({target:"root/0",axis:"x",pivot:[0,0,0],editing:true},part,{position:part.position.clone(),quaternion:part.quaternion.clone(),scale:part.scale.clone()},1);
  assert.equal(modelPartNodes(root).size,count);
  assert.ok(scene.children.length>1);
  gizmo.update(null);
  gizmo.dispose();
  assert.deepEqual(scene.children,[root]);
  assert.equal(listeners.size,0);
  assert.equal(orbit.enabled,true);
});
