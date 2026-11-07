import test from "node:test";
import assert from "node:assert/strict";
import { normalizeFurniture, normalizeFloorplanProject } from "../packages/schema/src/index.js";
import {builtinModelTemplates} from '../apps/server/src/device-platform/devicePlatformSchema.js';

test('新安装可在资源库取得影院模型并作为设备保存',()=>{
 const models=builtinModelTemplates().filter(model=>model.id.startsWith('builtin.cinema.'));
 assert.equal(models.length,4);
 for(const model of models){
  assert.equal(model.furnitureEnabled,true);
  const project=normalizeFloorplanProject({id:'test',floors:[{id:'floor',devices:[{id:model.id,entityId:'input_boolean.cinema',customModel:model}]}]});
  assert.equal(project.floors[0].devices[0].customModel.source.shape,model.source.shape);
 }
});

test('影院设备保存后保留专用模型与各自实体',()=>{
  const devices=['cinema_projector','cinema_screen'].map((shape,index)=>({id:shape,kind:'switch',entityId:`input_boolean.cinema_${index}`,position:[-2.05,2.42,4.35],customModel:{source:{type:'procedural',shape},dimensions:{width:.36,height:.16,depth:.36},placement:'wall'}}));
  const saved=normalizeFloorplanProject({id:'test',name:'test',floors:[{id:'floor-1',devices}]});
  saved.floors[0].devices.forEach((device,index)=>{assert.equal(device.customModel.source.shape,devices[index].customModel.source.shape);assert.equal(device.entityId,devices[index].entityId);assert.deepEqual(device.position,devices[index].position);});
});

test("影院家具尺寸与将来可用的模拟实体绑定在项目往返中保留", () => {
  for (const kind of ["cinema_projector", "cinema_screen", "cinema_speaker"]) {
    const furniture = normalizeFurniture({
      id: `test-${kind}`,
      kind,
      position: [-1.7, 4.35],
      elevation: 2.42,
      entityId: "input_boolean.home_cinema_preview",
    }, "floor-1");
    assert.equal(furniture.kind, kind);
    assert.equal(furniture.entityId, "input_boolean.home_cinema_preview");
    assert.deepEqual(normalizeFurniture(furniture, "floor-1"), furniture);
  }
  assert.equal(normalizeFurniture({kind:"cinema_screen",entityId:"light.real_lamp"}, "floor-1").entityId, undefined);
});
