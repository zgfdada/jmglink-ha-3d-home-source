import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { createPartMotionEngine } from "../../apps/web/src/domain/part-motion-engine.js";
import { normalizePartMotionRules } from "../../packages/schema/src/part-motion.js";

const scene = new THREE.Scene();
scene.background = new THREE.Color("#e8ece8");
const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
camera.position.set(7, 6.5, 8.5);
const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.querySelector("#stage").appendChild(renderer.domElement);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(-0.3, 0.7, 0);controls.enableDamping=true;controls.maxPolarAngle=Math.PI/2.05;
scene.add(new THREE.HemisphereLight("#ffffff", "#7d8e82", 2.6));
const sun = new THREE.DirectionalLight("#fff4de", 3.3);
sun.position.set(4,8,4);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
Object.assign(sun.shadow.camera,{left:-6,right:6,top:6,bottom:-6});sun.shadow.normalBias=0.03;scene.add(sun);
const car = new THREE.Group();car.name="示例车辆";scene.add(car);
const white = new THREE.MeshStandardMaterial({color:"#e8ebe5",roughness:0.24,metalness:0.25});
const dark = new THREE.MeshStandardMaterial({color:"#131e22",roughness:0.24,metalness:0.55});
const rubber = new THREE.MeshStandardMaterial({color:"#222a2a",roughness:0.85});
const silver = new THREE.MeshStandardMaterial({color:"#899592",roughness:0.26,metalness:0.75});
function box(parent, name, size, position, material, radius=0.08) {
  const mesh=new THREE.Mesh(new RoundedBoxGeometry(...size,3,Math.min(radius,Math.min(...size)/3)),material);
  mesh.name=name;mesh.position.set(...position);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
box(car,"车身",[1.95,0.64,4.55],[0,0.71,0],white,0.2);
box(car,"座舱",[1.75,0.77,2.38],[0,1.28,-0.2],dark,0.23);
box(car,"车顶",[1.68,0.1,1.93],[0,1.67,-0.3],white,0.07);
box(car,"前机盖",[1.85,0.18,1.0],[0,1.01,1.56],white,0.13);
box(car,"尾部",[1.84,0.2,0.72],[0,1.01,-1.87],white);
for(const x of [-0.87,0.87]) {
  box(car,"车身中柱",[0.065,0.65,0.085],[x,1.26,-0.2],white,0.02);
  box(car,"后视镜",[0.24,0.13,0.3],[x*1.2,1.16,0.86],white);
  for(const z of [0.5,-0.86]) box(car,"门把手",[0.035,0.04,0.22],[x*1.12,1,z],silver,0.01);
}
for(const x of [-0.99,0.99]) for(const z of [-1.42,1.42]) {
  const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.43,0.43,0.26,40),rubber);
  wheel.name="轮胎";wheel.rotation.z=Math.PI/2;wheel.position.set(x,0.46,z);wheel.castShadow=true;car.add(wheel);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.3,0.3,0.28,24),silver);
  hub.name="轮毂";hub.rotation.z=Math.PI/2;hub.position.copy(wheel.position);car.add(hub);
}
for(const x of [-0.61,0.61]) {
  box(car,"前灯",[0.55,0.1,0.045],[x,0.88,2.28],new THREE.MeshStandardMaterial({color:"#ffffff",emissive:"#c1e4df",emissiveIntensity:1.2}),0.01);
  box(car,"尾灯",[0.55,0.08,0.045],[x,0.91,-2.28],new THREE.MeshStandardMaterial({color:"#90382e"}),0.01);
}
box(scene,"车位",[6,0.2,6.5],[-0.5,-0.13,0],new THREE.MeshStandardMaterial({color:"#cdd5cc",roughness:0.9}),0.16);
for(const x of [-1.5,1.5]) box(scene,"停车线",[0.035,0.01,5.2],[x,-0.02,0],new THREE.MeshBasicMaterial({color:"#eef1e7"}),0.002);
box(scene,"充电桩",[0.45,1.7,0.35],[-2.35,0.82,-1.65],dark,0.09);
box(scene,"充电指示灯",[0.29,0.045,0.02],[-2.35,1.43,-1.46],new THREE.MeshStandardMaterial({color:"#30e3a6",emissive:"#30e3a6",emissiveIntensity:1.5}),0.01);
const cableCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(-2.3,1.2,-1.45),new THREE.Vector3(-2.15,0.45,-0.6),new THREE.Vector3(-1.45,0.4,-0.6),new THREE.Vector3(-0.99,1,-0.7)]);
scene.add(new THREE.Mesh(new THREE.TubeGeometry(cableCurve,40,0.035,8,false),rubber));

let engine, state="charging", paused=false;
const settings={color:"#32efb0",speed:2,width:0.22,intensity:1.8};
const byId=id=>document.getElementById(id);
function configure() {
  engine?.dispose();
  engine=createPartMotionEngine(car,normalizePartMotionRules([{id:"charging",name:"车辆充电扫光",targets:["root"],capabilityId:"state",condition:{operator:"eq",value:"charging"},transitionMs:400,effect:{type:"scan",axis:"z",...settings}}]));
}
configure();
for(const key of ["speed","width","intensity","color"]) {
  byId(key).oninput=()=>{settings[key]=key==="color"?byId(key).value:Number(byId(key).value);byId(key+"Value").textContent=settings[key];configure();};
}
for(const button of document.querySelectorAll("[data-state]")) button.onclick=()=>{
  state=button.dataset.state;
  for(const b of document.querySelectorAll("[data-state]")) b.classList.toggle("active",b===button);
  byId("status").textContent=state==="charging"?"充电中 · 表面扫光":state==="idle"?"已停止 · 恢复原材质":"离线 · 动效已退出";
  engine.update({state:state==="offline"?"unavailable":state},0,0.1,{available:state!=="offline"});
};
byId("pause").onclick=()=>{paused=!paused;byId("pause").textContent=paused?"继续预览":"暂停预览";};
const variants={reference:{speed:2,width:0.22,intensity:1.8},soft:{speed:1.25,width:0.28,intensity:0.9},bright:{speed:2.75,width:0.16,intensity:3.2}};
byId("variant").onchange=()=>{Object.assign(settings,variants[byId("variant").value]);for(const key of ["speed","width","intensity"]){byId(key).value=settings[key];byId(key+"Value").textContent=settings[key];}configure();};
byId("midpoint").onclick=()=>{
  if(!settings.speed){byId("status").textContent="速度为零，请先调整速度";return;}
  document.querySelector('[data-state="charging"]').click();configure();
  let remaining=0.5/(Math.abs(settings.speed)*0.25);
  while(remaining>1e-8){const dt=Math.min(0.1,remaining);engine.update({state:"charging"},0,dt);remaining-=dt;}
  paused=true;byId("pause").textContent="继续预览";
};
window.addEventListener("message",event=>{if(event.data?.type==="__activate_edit_mode")byId("tweaks").hidden=false;if(event.data?.type==="__deactivate_edit_mode")byId("tweaks").hidden=true;});
window.parent.postMessage({type:"__edit_mode_available"},"*");
const TWEAK_DEFAULTS=/*EDITMODE-BEGIN*/{"color":"#32efb0","speed":2,"width":0.22,"intensity":1.8}/*EDITMODE-END*/;
let last=performance.now();
function frame(now){requestAnimationFrame(frame);const dt=Math.min((now-last)/1000,0.1);last=now;
  if(!paused)engine.update({state:state==="offline"?"unavailable":state},now/1000,dt,{available:state!=="offline"});
  const rect=byId("stage").getBoundingClientRect();if(renderer.domElement.width!==Math.round(rect.width*renderer.getPixelRatio())||renderer.domElement.height!==Math.round(rect.height*renderer.getPixelRatio())){renderer.setSize(rect.width,rect.height);camera.aspect=rect.width/rect.height;camera.updateProjectionMatrix();}
  controls.update();renderer.render(scene,camera);
}
requestAnimationFrame(frame);
