import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { createSurfaceScan } from "../apps/web/src/domain/surface-scan.js";
import { createPartMotionEngine, modelPartIndex } from "../apps/web/src/domain/part-motion-engine.js";
import { normalizePartMotionRules } from "../packages/schema/src/part-motion.js";

const effect = {type:"scan",axis:"z",color:"#32efb0",speed:2,width:0.22,intensity:1.8};
function fixture() {
  const root = new THREE.Group(); root.name="车辆";
  const body = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 4), new THREE.MeshStandardMaterial({color:"white"}));
  body.name="车身"; root.add(body);
  return {root,body,dispose(){body.geometry.dispose();body.material.dispose();}};
}
const rules = (extra={}) => normalizePartMotionRules([{id:"charging",name:"充电扫光",targets:["root"],capabilityId:"state",condition:{operator:"eq",value:"charging"},transitionMs:0,effect,...extra}]);

test("charging scan data round-trips through the shared rule schema with strict width bounds",()=>{
  assert.deepEqual(normalizePartMotionRules(JSON.parse(JSON.stringify(rules()))),rules());
  for(const width of [0,-1,2,"bad"]) assert.throws(()=>rules({effect:{...effect,width}}));
});
test("surface scan uses model geometry, respects orientation, and never owns or picks the model surface",()=>{
  const f=fixture(); f.root.rotation.y=Math.PI/3;f.root.scale.setScalar(0.5);
  const before=modelPartIndex(f.root);const scan=createSurfaceScan(f.root);
  scan.update(effect,0.4,1);
  assert.equal(scan.overlays[0].overlay.geometry,f.body.geometry);
  assert.equal(scan.uniforms.uRange.value.y,4);
  assert.deepEqual(modelPartIndex(f.root),before);
  assert.ok(scan.uniforms.uTargetInverse.value.equals(f.root.matrixWorld.clone().invert()));
  const intersections=[];scan.overlays[0].overlay.raycast(new THREE.Raycaster(),intersections);assert.equal(intersections.length,0);
  assert.equal(scan.overlays[0].overlay.material.depthTest,true);
  let geometryDisposed=false;f.body.geometry.addEventListener("dispose",()=>geometryDisposed=true);
  scan.dispose();scan.dispose();assert.equal(geometryDisposed,false);assert.equal(f.body.children.length,0);f.dispose();
});
test("charging state advances and reverses the scan; inactive, missing and offline states restore the original model",()=>{
  const f=fixture();const original=f.body.material;const engine=createPartMotionEngine(f.root,rules());
  assert.equal(engine.update({state:"idle"},0,0.1),false);
  assert.equal(engine.update({state:"charging"},0,0.1),true);
  const overlay=f.body.children[0];const first=overlay.material.uniforms.uPhase.value;
  engine.update({state:"charging"},0.1,0.1);assert.ok(overlay.material.uniforms.uPhase.value>first);
  engine.update({state:"idle"});assert.equal(overlay.visible,false);
  engine.update({state:"charging"});engine.update({state:"unavailable"});assert.equal(overlay.visible,false);
  engine.update({state:"charging"});engine.update({state:"charging"},0,0.1,{available:false});assert.equal(overlay.visible,false);
  engine.dispose();assert.equal(f.body.material,original);assert.equal(f.body.children.length,0);
  const reverse=createPartMotionEngine(f.root,rules({effect:{...effect,speed:-2}}));reverse.update({state:"charging"},0,0.1);
  assert.ok(f.body.children[0].material.uniforms.uPhase.value>0.9);reverse.dispose();f.dispose();
});
