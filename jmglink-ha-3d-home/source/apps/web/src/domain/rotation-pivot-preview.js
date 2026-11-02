import * as THREE from "three";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";
import { normalizePartMotionRules } from "../../../../packages/schema/src/part-motion.js";

// The runtime rotates around an offset in the unanimated part's local frame.
export function rotationPivotFrame(node, baseline) {
  node.parent?.updateWorldMatrix(true, false);
  return new THREE.Matrix4().multiplyMatrices(
    node.parent?.matrixWorld || new THREE.Matrix4(),
    new THREE.Matrix4().compose(baseline.position, baseline.quaternion, baseline.scale),
  );
}

export function rotationTrialRules(config) {
  if (!config || config.angle === null || config.angle === undefined) return null;
  return normalizePartMotionRules([{
    id: "rotation-axis-trial", name: "旋转轴试转", enabled: true,
    targets: config.targets, capabilityId: "rotation-axis-trial",
    condition: {operator: "eq", value: "on"}, transitionMs: 0,
    effect: {type: "rotate", axis: config.axis, pivot: config.pivot, from: 0, to: config.angle},
  }]);
}

export function rotationWorldUnitsPerPixel(camera,point,height){
  camera.updateMatrixWorld();
  const depth=Math.max(camera.near,-point.clone().applyMatrix4(camera.matrixWorldInverse).z);
  return 2*depth*Math.tan(THREE.MathUtils.degToRad(camera.getEffectiveFOV())/2)/Math.max(height,1);
}

export function createRotationPivotGizmo({ scene, camera, domElement, orbit, onChange }) {
  const basis = new THREE.Group(), anchor = new THREE.Group();
  basis.matrixAutoUpdate = false;
  basis.add(anchor);
  scene.add(basis);
  const visual=new THREE.Group();scene.add(visual);
  const colors=[0xff4545,0x45c974,0x438bff];
  const arrows=colors.map(color=>{
    const arrow=new THREE.ArrowHelper(new THREE.Vector3(1,0,0),new THREE.Vector3(),1,color);
    arrow.traverse(object=>{if(object.material){object.material.depthTest=false;object.material.depthWrite=false;}object.renderOrder=2001;});
    visual.add(arrow);return arrow;
  });
  const center=new THREE.Mesh(new THREE.SphereGeometry(1,12,8),new THREE.MeshBasicMaterial({color:0xffffff,depthTest:false,depthWrite:false}));
  center.renderOrder=2002;visual.add(center);
  const host=domElement.parentElement,layer=host?.ownerDocument?.createElement("div"),labels=[];
  if(layer){
    Object.assign(layer.style,{position:"absolute",inset:"0",pointerEvents:"none",overflow:"hidden"});
    ["X","Y","Z"].forEach((axis,index)=>{
      const label=host.ownerDocument.createElement("span");label.textContent=axis;
      Object.assign(label.style,{position:"absolute",fontSize:"13px",lineHeight:"18px",fontWeight:"800",fontFamily:"Arial, sans-serif",color:"#"+colors[index].toString(16).padStart(6,"0"),textShadow:"0 0 3px white,0 0 3px white",transform:"translate(-50%,-50%)"});
      layer.appendChild(label);labels.push(label);
    });host.appendChild(layer);
  }
  const transform = new TransformControls(camera, domElement);
  transform.setMode("translate");
  transform.setSpace("local");
  transform.setSize(0.8);
  const helper = transform.getHelper();
  scene.add(helper);
  let enabled = false, dragging = false, previousOrbit = true, currentPath = null;
  const change = () => { if (enabled && dragging) onChange(anchor.position.toArray().map(v=>Math.round(v*100000)/100000)); };
  const drag = event => {
    dragging = event.value;
    if (dragging) { previousOrbit = orbit.enabled; orbit.enabled = false; }
    else orbit.enabled = previousOrbit;
  };
  transform.addEventListener("objectChange",change);
  transform.addEventListener("dragging-changed",drag);
  return {
    get interacting() { return dragging || (enabled && transform.axis !== null); },
    update(config, node, baseline) {
      if (!config || config.showAxes===false || !node || !baseline) {
        transform.detach(); basis.visible=false; visual.visible=false; helper.visible=false; if(layer)layer.style.display="none"; enabled=false; currentPath=null;
        if (dragging) { dragging=false; orbit.enabled=previousOrbit; }
        return;
      }
      if (currentPath !== config.target) {
        transform.detach();
        currentPath=config.target;
      }
      basis.visible=true;visual.visible=true;if(layer)layer.style.display="block";
      basis.matrix.copy(rotationPivotFrame(node,baseline));
      if(!dragging)anchor.position.fromArray(config.pivot.map(Number));
      basis.updateMatrixWorld(true);
      const origin=anchor.getWorldPosition(new THREE.Vector3()),rect=domElement.getBoundingClientRect?.()||{width:500,height:400};
      const unit=rotationWorldUnitsPerPixel(camera,origin,rect.height),length=unit*72;
      visual.position.copy(origin);center.scale.setScalar(unit*3.5);
      ["x","y","z"].forEach((axis,index)=>{
        const direction=new THREE.Vector3(axis==="x"?1:0,axis==="y"?1:0,axis==="z"?1:0).transformDirection(basis.matrix);
        const selected=config.axis===axis;
        arrows[index].setDirection(direction);arrows[index].setLength(length,unit*(selected?13:9),unit*(selected?7:5));
        if(labels[index]){
          const position=origin.clone().addScaledVector(direction,length+unit*12).project(camera);
          labels[index].style.left=`${(position.x+1)*rect.width/2}px`;
          labels[index].style.top=`${(1-position.y)*rect.height/2}px`;
          labels[index].style.display=position.z>=-1&&position.z<=1?"block":"none";
        }
      });
      enabled=!!config.editing;
      if (enabled) { if (transform.object!==anchor) transform.attach(anchor); }
      else { transform.detach(); if(dragging){dragging=false;orbit.enabled=previousOrbit;} }
      helper.visible=enabled;
    },
    dispose() {
      if(dragging) orbit.enabled=previousOrbit;
      transform.removeEventListener("objectChange",change);
      transform.removeEventListener("dragging-changed",drag);
      transform.detach(); transform.dispose(); helper.removeFromParent();
      basis.removeFromParent();visual.removeFromParent();layer?.remove();
      const geometries=new Set(),materials=new Set();
      visual.traverse(object=>{if(object.geometry)geometries.add(object.geometry);if(object.material)materials.add(object.material);});
      geometries.forEach(item=>item.dispose()); materials.forEach(item=>item.dispose());
    },
  };
}
