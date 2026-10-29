import test from "node:test";
import assert from "node:assert/strict";
import {mkdtemp,rm} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import Fastify from "fastify";
import * as THREE from "three";
import {DevicePlatformStore} from "../apps/server/src/device-platform/DevicePlatformStore.js";
import {registerDevicePlatformRoutes} from "../apps/server/src/routes/devicePlatformRoutes.js";
import {aggregateDeviceObjects} from "../apps/server/src/device-platform/deviceAggregation.js";
import {projectContext} from "../apps/server/src/device-platform/projectLifecycle.js";
import {validateProjectCapabilities} from "../apps/server/src/device-platform/capabilityValidation.js";
import {selectedDeviceEntities,capabilityFromEntity,mappingStatus} from "../apps/web/src/app/device-development-center/capability-model.js";
import {extraEntityOptions,filterExtraEntities} from "../apps/web/src/app/device-development-center/extra-entity-model.js";
import {normalizePartMotionRules,motionCapabilityValues} from "../packages/schema/src/part-motion.js";
import {createPartMotionEngine} from "../apps/web/src/domain/part-motion-engine.js";
import {deviceCapabilityEntities} from "../packages/schema/src/associated-entities.js";

const devices=[{id:"car",name:"车辆"},{id:"tracker",name:"车辆定位集成"}];
const entities=[
  {entityId:"switch.car_power",name:"电源",deviceId:"car",registryId:"own-reg",domain:"switch",state:"off",attributes:{}},
  {entityId:"device_tracker.car_location",name:"车辆位置",deviceId:"tracker",registryId:"tracker-reg",domain:"device_tracker",state:"home",attributes:{}},
  {entityId:"sensor.car_distance",name:"距家距离",registryId:"distance-reg",domain:"sensor",state:"80",attributes:{unit_of_measurement:"m"}},
];

test("额外实体经选择 API、能力映射、聚合及主页同一动效引擎驱动显隐，保留原归属",async()=>{
  const dir=await mkdtemp(path.join(os.tmpdir(),"extra-entities-"));const app=Fastify();
  try{
    const store=await DevicePlatformStore.create(path.join(dir,"data"),path.join(dir,"assets"));
    const caps=[{capabilityId:"power",name:"电源",kind:"toggle",dataType:"boolean",allowedDomains:["switch"]},
      {capabilityId:"location",name:"车辆位置",kind:"status",dataType:"string",allowedDomains:["device_tracker"]},
      {capabilityId:"distance",name:"距家距离",kind:"status",dataType:"number",allowedDomains:["sensor"]}];
    await store.upsertDeviceTemplate({id:"custom.car",name:"车辆",capabilities:caps});
    await store.rebindProject("custom.car","car",[entities[0]]);
    const ha={getDevices:()=>devices,getEntities:()=>entities};
    await registerDevicePlatformRoutes(app,store,ha);
    const url="/api/device-platform/projects/custom.car/extra-entities";
    const selected=[entities[1].entityId,entities[2].entityId];
    const saved=await app.inject({method:"PUT",url,payload:{deviceId:"car",extraEntityIds:selected,expectedExtraEntityIds:[]}});
    assert.equal(saved.statusCode,200,saved.body);
    assert.deepEqual(saved.json().binding.selectedEntityIds,[entities[0].entityId]);
    const mapped=await app.inject({method:"PUT",url:"/api/device-platform/projects/custom.car/capabilities",payload:{capabilities:caps,mappings:{power:{entityId:entities[0].entityId,attribute:"state"},location:{entityId:entities[1].entityId,attribute:"state"},distance:{entityId:entities[2].entityId,attribute:"state"}}}});
    assert.equal(mapped.statusCode,200,mapped.body);
    let reopened=await DevicePlatformStore.create(path.join(dir,"data"),path.join(dir,"assets"));
    let binding=reopened.getBindings().find(item=>item.deviceTemplateId==="custom.car");
    assert.deepEqual(binding.extraEntityIds,selected);
    const aggregate=()=>aggregateDeviceObjects({devices,entities,templates:store.getDeviceTemplates(),bindings:store.getBindings()});
    const car=aggregate().find(device=>device.id==="car");
    assert.deepEqual(car.entityIds,[entities[0].entityId]);
    assert.equal(car.entities.length,1);
    assert.equal(aggregate().find(device=>device.id==="tracker").entities[0].deviceId,"tracker");
    assert.equal(selectedDeviceEntities(car,binding).length,3);
    assert.equal(capabilityFromEntity(car.extraEntities[0],[]).allowedDomains[0],"device_tracker");
    assert.equal(mappingStatus(caps[1],{entityId:entities[1].entityId,attribute:"state"},car,{connected:true}).id,"bound");
    assert.ok(!validateProjectCapabilities(store.getDeviceTemplates().find(p=>p.id==="custom.car"),binding,car).issues.some(issue=>issue.reason.includes("映射实体已不存在")));
    assert.equal(projectContext(store,ha,"custom.car").entities.length,3);
    const root=new THREE.Group();const mesh=new THREE.Mesh(new THREE.BoxGeometry(1,1,2),new THREE.MeshStandardMaterial());root.add(mesh);
    const rule=normalizePartMotionRules([{id:"away",name:"离家隐藏",targets:["root"],capabilityId:"location",condition:{operator:"neq",value:"home"},effect:{type:"visible",to:0},transitionMs:0}]);
    const engine=createPartMotionEngine(root,rule);
    const values=()=>motionCapabilityValues({deviceEntities:deviceCapabilityEntities(car),deviceCapabilityMappings:binding.capabilityMappings,deviceCapabilityBindings:binding.capabilityBindings});
    engine.update(values());assert.equal(root.visible,true);
    entities[1].state="not_home";engine.update(values());assert.equal(root.visible,false);
    entities[1].state="home";engine.update(values());assert.equal(root.visible,true);
    engine.dispose();mesh.geometry.dispose();mesh.material.dispose();
    // Rebinding the same primary device must preserve externally mapped capabilities.
    await store.rebindProject("custom.car","car",[entities[0]]);
    assert.equal(store.getBindings()[0].capabilityMappings.location.entityId,entities[1].entityId);
    // Registry renames update the extra selection and capability together.
    await store.reconcileEntityRegistry([{id:"tracker-reg",entity_id:"device_tracker.renamed_car"}]);
    binding=store.getBindings()[0];assert.ok(binding.extraEntityIds.includes("device_tracker.renamed_car"));
    assert.equal(binding.capabilityMappings.location.entityId,"device_tracker.renamed_car");
    const stale=await app.inject({method:"PUT",url,payload:{deviceId:"car",extraEntityIds:[],expectedExtraEntityIds:[]}});
    assert.equal(stale.statusCode,400);
    const removed=await app.inject({method:"PUT",url,payload:{deviceId:"car",extraEntityIds:[],expectedExtraEntityIds:binding.extraEntityIds}});
    assert.equal(removed.statusCode,200,removed.body);
    reopened=await DevicePlatformStore.create(path.join(dir,"data"),path.join(dir,"assets"));
    binding=reopened.getBindings()[0];assert.deepEqual(binding.extraEntityIds,[]);
    assert.equal(binding.capabilityMappings.location,undefined);assert.equal(binding.capabilityMappings.distance,undefined);
    assert.equal(binding.capabilityMappings.power.entityId,"switch.car_power");
    const own=await app.inject({method:"PUT",url,payload:{deviceId:"car",extraEntityIds:[entities[0].entityId]}});assert.equal(own.statusCode,400);
    const invalid=await app.inject({method:"PUT",url,payload:{deviceId:"car",extraEntityIds:["sensor.missing"]}});assert.equal(invalid.statusCode,404);
    const replaced=await app.inject({method:"PUT",url,payload:{deviceId:"other",extraEntityIds:[]}});assert.equal(replaced.statusCode,400);
  }finally{await app.close();await rm(dir,{recursive:true,force:true});}
});

test("同页搜索筛选不改变已选集合，排除主设备并保留暂时不可用的已选实体",()=>{
  const binding={deviceId:"car",selectedEntityIds:[entities[0].entityId],extraEntityIds:[entities[1].entityId,"sensor.offline"]};
  const aggregated=aggregateDeviceObjects({devices,entities,templates:[],bindings:[binding]});
  const options=extraEntityOptions(aggregated,binding);
  assert.ok(!options.some(e=>e.entityId===entities[0].entityId));assert.ok(options.some(e=>e.entityId==="sensor.offline"&&e.historical));
  const selected=[...binding.extraEntityIds];
  assert.equal(filterExtraEntities(options,{search:"距离",selected}).length,1);
  assert.equal(filterExtraEntities(options,{domain:"device_tracker",selected}).length,1);
  assert.equal(filterExtraEntities(options,{onlySelected:true,selected}).length,2);
  assert.deepEqual(selected,binding.extraEntityIds);
});
