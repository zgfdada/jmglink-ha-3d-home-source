import test from 'node:test';
import assert from 'node:assert/strict';
import {Group,DirectionalLight,Object3D,Vector3} from 'three';
import {readFile} from 'node:fs/promises';
test('日月光源与目标和房屋共用旋转根，局部入射方向保持不变',async()=>{
 const scene=await readFile(new URL('../apps/web/src/app/scene.js',import.meta.url),'utf8');
 const pi=scene.slice(scene.indexOf('function pi({'),scene.indexOf('function gi({'));
 assert.match(pi,/ref: M,[\s\S]*?children: \[\s*lighting,/);
 assert.match(scene,/lighting: sceneLighting/);assert.match(scene,/target: sunTarget/);
 const root=new Group(),house=new Group(),sun=new DirectionalLight(),target=new Object3D();
 sun.position.set(30,40,-10);sun.target=target;root.add(house,sun,target);
 for(const angle of [0,.6,1.8,Math.PI,5.7]){
   root.rotation.y=angle;root.updateMatrixWorld(true);
   const localSun=house.worldToLocal(sun.getWorldPosition(new Vector3()));
   const localTarget=house.worldToLocal(target.getWorldPosition(new Vector3()));
   assert.ok(localSun.sub(localTarget).normalize().distanceTo(new Vector3(30,40,-10).normalize())<1e-9);
 }
});
