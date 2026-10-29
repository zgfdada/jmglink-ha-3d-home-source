// Isolated browser acceptance fixture. No connection to a real HA instance.
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {fileURLToPath} from "node:url";
import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import * as THREE from "three";
import {DevicePlatformStore} from "../apps/server/src/device-platform/DevicePlatformStore.js";
import {registerDevicePlatformRoutes} from "../apps/server/src/routes/devicePlatformRoutes.js";
import {normalizeFloorplanProject} from "../packages/schema/src/index.js";
import {defaultSidebar} from "../packages/schema/src/sidebar.js";
const directory=await fs.mkdtemp(path.join(os.tmpdir(),"ha3d-extra-ui-"));
const store=await DevicePlatformStore.create(path.join(directory,"data"),path.join(directory,"assets"));
const geometry=new THREE.BoxGeometry(1.7,0.9,3.7).toNonIndexed();
const buffers=[],views=[],accessors=[],attributes={};let offset=0;
for(const [name,semantic] of [["position","POSITION"],["normal","NORMAL"]]){
  const attribute=geometry.getAttribute(name),bytes=Buffer.from(attribute.array.buffer,attribute.array.byteOffset,attribute.array.byteLength);
  buffers.push(bytes);views.push({buffer:0,byteOffset:offset,byteLength:bytes.length});
  const accessor={bufferView:views.length-1,componentType:5126,count:attribute.count,type:"VEC3"};
  if(name==="position"){geometry.computeBoundingBox();accessor.min=geometry.boundingBox.min.toArray();accessor.max=geometry.boundingBox.max.toArray();}
  accessors.push(accessor);attributes[semantic]=accessors.length-1;offset+=bytes.length;
}
const gltf={asset:{version:"2.0"},scene:0,scenes:[{nodes:[0]}],nodes:[{name:"车身",mesh:0}],meshes:[{primitives:[{attributes,material:0}]}],materials:[{name:"车身材质",pbrMetallicRoughness:{baseColorFactor:[0.65,0.75,0.9,1]}}],accessors,bufferViews:views,buffers:[{byteLength:offset,uri:"data:application/octet-stream;base64,"+Buffer.concat(buffers).toString("base64")}]};
geometry.dispose();
const model=await store.upsertModelTemplate({id:"custom.extra-model",name:"车辆模型（隔离验收）",dimensions:{width:1.7,height:0.9,depth:3.7}}, {name:"car.gltf",dataUrl:"data:model/gltf+json;base64,"+Buffer.from(JSON.stringify(gltf)).toString("base64")});
await store.upsertDeviceTemplate({id:"custom.extra-car",name:"车辆额外实体验收",capabilities:[{capabilityId:"power",name:"车辆电源",kind:"toggle",dataType:"boolean",allowedDomains:["switch"]},{capabilityId:"location",name:"车辆位置",kind:"status",dataType:"string",allowedDomains:["device_tracker"]}]});
await store.saveProjectAppearance("custom.extra-car",model.id,{dimensions:{width:1.7,height:0.9,depth:3.7},partMotionRules:[]});
await store.rebindProject("custom.extra-car","car",[{entityId:"switch.car_power",registryId:"own-reg"}]);
let location="home",calls=0;
const getEntities=()=>{const project=store.getDeviceTemplates().find(p=>p.id==="custom.extra-car");return [
  {entityId:"switch.car_power",name:"车辆电源",domain:"switch",deviceId:"car",registryId:"own-reg",state:"off",attributes:{},deviceTemplateId:project.id,deviceModel:{...model,...project.appearance,projectAppearance:true}},
  {entityId:"device_tracker.car_location",name:"车辆定位跟踪器",domain:"device_tracker",deviceId:"tracker",registryId:"tracker-reg",state:location,attributes:{}},
  {entityId:"sensor.car_distance",name:"车辆距家的距离",domain:"sensor",registryId:"distance-reg",state:"80",attributes:{unit_of_measurement:"m"}},
  {entityId:"binary_sensor.parking",name:"车位存在传感器",domain:"binary_sensor",deviceId:"parking",state:"on",attributes:{}},
];};
const ha={getEntities,getDevices:()=>[{id:"car",name:"车辆"},{id:"tracker",name:"车辆定位集成"},{id:"parking",name:"车库雷达"}],getAreas:()=>[]};
const project=normalizeFloorplanProject({id:"extra-verify",name:"额外实体能力与动效隔离验收",floors:[{id:"floor-1",name:"一层",height:2.8,walls:[],rooms:[{id:"room",name:"车库",polygon:[[-3,-3],[3,-3],[3,3],[-3,3]]}],devices:[{id:"car-placement",entityId:"switch.car_power",deviceId:"car",deviceTemplateId:"custom.extra-car",modelId:"switch.socket",kind:"switch",position:[0,0,0],rotation:[0,0,0],scale:[1,1,1]}]}]});
const app=Fastify();await registerDevicePlatformRoutes(app,store,ha);
app.get("/api/ha/status",async()=>({connected:true,configured:true,mock:false,mode:"standalone",entityCount:4}));
app.get("/api/ha/entities",async()=>({entities:getEntities()}));app.get("/api/ha/areas",async()=>({areas:[]}));
app.get("/api/projects/current",async()=>({project}));app.get("/api/projects",async()=>({projects:[project]}));app.get("/api/projects/:id",async()=>({project}));
app.get("/api/sidebar/:floorId",async()=>({revision:0,draft:defaultSidebar(),published:defaultSidebar()}));
app.get("/verify",async()=>({calls,binding:store.getBindings()[0],project:store.getDeviceTemplates().find(p=>p.id==="custom.extra-car")}));
app.post("/verify-state",async request=>{location=request.body.state;return {location};});
app.post("/api/ha/services/:domain/:service",async()=>{calls++;return {ok:true};});
await app.register(fastifyStatic,{root:fileURLToPath(new URL("../apps/web/dist",import.meta.url))});
await app.listen({port:18101,host:"127.0.0.1"});console.log("extra entity fixture ready: 18101");
process.once("SIGINT",async()=>{await app.close();const resolved=path.resolve(directory);if(path.dirname(resolved)===path.resolve(os.tmpdir())&&path.basename(resolved).startsWith("ha3d-extra-ui-"))await fs.rm(resolved,{recursive:true,force:true});console.log("extra entity fixture cleaned");process.exit(0);});
