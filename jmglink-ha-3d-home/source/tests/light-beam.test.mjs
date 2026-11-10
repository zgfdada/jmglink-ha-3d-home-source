import {CylinderGeometry} from 'three';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createBeamSettingsStore,resolveBeamAngle,beamRadius,beamFrustum,normalizeBeamSettings,LIGHT_BEAM_TYPES,resolvePanelBeamFixtures,setFixtureBeamAngle,resetFixtureBeamAngle} from '../apps/web/src/domain/light-beam-settings.js';
import {wallLightBlockers,lightPathBlocked,beamOcclusionShader,beamDistanceFade} from '../apps/web/src/domain/light-occlusion.js';

test('每个灯型独立默认值，单灯覆盖、恢复继承与持久化',()=>{
 const data=new Map(),store=createBeamSettingsStore(()=>({getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)}));
 let notifications=0;const stop=store.subscribe(()=>notifications++);
 for(const [type,,angle] of LIGHT_BEAM_TYPES)assert.equal(resolveBeamAngle(store.getSnapshot(),type,'a'),angle);
 store.update({types:{'light.downlight':65},fixtures:{a:12}});
 assert.equal(resolveBeamAngle(store.getSnapshot(),'light.downlight','a'),12);
 assert.equal(resolveBeamAngle(store.getSnapshot(),'switch.light.downlight','b'),65);
 assert.ok(Math.abs(resolveBeamAngle(store.getSnapshot(),'light.ceiling','b')-137.5098708314)<1e-8);
 store.update({fixtures:{}});assert.equal(resolveBeamAngle(store.getSnapshot(),'light.downlight','a'),65);
 const restored=createBeamSettingsStore(()=>({getItem:k=>data.get(k)}));assert.deepEqual(restored.getSnapshot(),store.getSnapshot());
 assert.equal(notifications,2);stop();store.update({types:{}});assert.equal(notifications,2);
});
test('角度完整夹角边界、旧设置与不可用存储降级',()=>{
 assert.deepEqual(normalizeBeamSettings({types:{a:0,b:300,c:NaN,d:'80'}}),{types:{a:1,b:160},fixtures:{}});
 assert.deepEqual(createBeamSettingsStore(()=>{throw Error('blocked');}).getSnapshot(),{types:{},fixtures:{}});
 assert.doesNotThrow(()=>createBeamSettingsStore(()=>{throw Error('blocked');}).update({fixtures:{a:40}}));
 assert.ok(Math.abs(beamRadius(2,90)-2)<1e-9);
 assert.ok(beamRadius(2,10)<beamRadius(2,60));
});
const floor={height:3,walls:[{id:'w',start:[0,-3],end:[0,3],height:3}],openings:[{wallId:'w',offset:3,width:1,bottom:0,height:2.1,type:'door'}]};
test('光束被实体墙阻挡，但从真实门窗洞口通过，不受显示透明度影响',()=>{
 const blockers=wallLightBlockers(floor),source=[-2,1,0];
 assert.equal(lightPathBlocked(source,[2,1,0],blockers),false,'门洞通光');
 assert.equal(lightPathBlocked([-2,2.6,0],[2,2.6,0],blockers),true,'门楣遮光');
 assert.equal(lightPathBlocked([-2,1,2],[2,1,2],blockers),true,'实体墙遮光');
 assert.equal(lightPathBlocked(source,[-1,1,0],blockers),false,'同侧光路不误裁');
 const window={...floor,openings:[{wallId:'w',offset:3,width:1,bottom:1,height:1}]};
 assert.equal(lightPathBlocked([-2,.5,0],[2,.5,0],wallLightBlockers(window)),true,'窗台遮光');
 assert.equal(lightPathBlocked([-2,1.5,0],[2,1.5,0],wallLightBlockers(window)),false,'窗洞通光');
 assert.equal(wallLightBlockers({...floor,walls:[{...floor.walls[0],transparent:true}]}).length,0,'虚拟分区不遮光');
 assert.deepEqual(wallLightBlockers({...floor,wallOpacity:0}),blockers);
});
test('斜墙、重叠洞口及真实三维高度正确求交，着色器裁剪与楼层变换接入',()=>{
 const diagonal={height:3,walls:[{id:'w',start:[-2,-2],end:[2,2],height:3}],openings:[]};
 assert.equal(lightPathBlocked([-1,1,1],[1,1,-1],wallLightBlockers(diagonal)),true);
 const shader={uniforms:{},vertexShader:'#include <worldpos_vertex>',fragmentShader:'#include <clipping_planes_fragment>'};
 const uniforms={beamFloorInverse:{value:'matrix'}};beamOcclusionShader(shader,uniforms,2);
 assert.equal(shader.uniforms.beamFloorInverse,uniforms.beamFloorInverse);
 assert.match(shader.fragmentShader,/beamFloorInverse\*vec4/);assert.match(shader.fragmentShader,/discard/);
 assert.match(shader.vertexShader,/modelMatrix\*vec4/);
});


test('光束沿灯口到末端连续单调衰减，末端归零且不依赖散射角或楼层变换',()=>{
 assert.equal(beamDistanceFade(0),1);assert.equal(beamDistanceFade(1),0);
 assert.equal(beamDistanceFade(-1),1);assert.equal(beamDistanceFade(2),0);
 let previous=1;
 for(let i=1;i<=1000;i++){const current=beamDistanceFade(i/1000);assert.ok(current>=0&&current<=previous);assert.ok(previous-current<.01);previous=current;}
 assert.equal(beamDistanceFade(.5),.5);
 const shader={uniforms:{},vertexShader:'#include <worldpos_vertex>',fragmentShader:'#include <clipping_planes_fragment>\n#include <alphatest_fragment>'};
 beamOcclusionShader(shader,{},0);
 assert.match(shader.vertexShader,/1\.-uv.y/);
 assert.match(shader.fragmentShader,/diffuseColor.a\*=.*smoothstep/);
 assert.match(shader.fragmentShader,/discard/);
});


test('光束由非零灯口截面展开为截锥，散射斜率和距离淡出UV保持一致',()=>{
 for(const variant of ['downlight','ceiling','chandelier','wall','floor','strip']){
  const length=1.6,{top,bottom}=beamFrustum(length,40,variant);
  assert.ok(top>0);assert.ok(bottom>top);assert.ok(Math.abs((bottom-top)/length-Math.tan(20*Math.PI/180))<1e-9);
  const geometry=new CylinderGeometry(top,bottom,length,32,1,true),p=geometry.attributes.position,uv=geometry.attributes.uv;
  let topVertices=0,bottomVertices=0;
  for(let i=0;i<p.count;i++){
   const radius=Math.hypot(p.getX(i),p.getZ(i));
   if(p.getY(i)>0){assert.ok(Math.abs(radius-top)<1e-6);assert.equal(uv.getY(i),1);topVertices++;}
   else{assert.ok(Math.abs(radius-bottom)<1e-6);assert.equal(uv.getY(i),0);bottomVertices++;}
  }
  assert.ok(topVertices>0&&bottomVertices>0);geometry.dispose();
 }
 assert.ok(beamFrustum(1,40,'ceiling').top>beamFrustum(1,40,'downlight').top);
});

test('控制面板使用实际灯具ID，支持同一开关下单独点选，不误改其他灯',()=>{
 const project={floors:[{devices:[{id:'direct',entityId:'light.a',kind:'light',modelId:'light.ceiling_round'},
 {id:'switch',entityId:'switch.a',controlledLightFixtures:[{id:'spot-1',modelId:'light.downlight'},{id:'spot-2',modelId:'light.wall_sconce'}]},
 {id:'socket',entityId:'switch.socket'}]}]};
 assert.deepEqual(resolvePanelBeamFixtures(project,'light.a').map(x=>x.id),['direct']);
 assert.deepEqual(resolvePanelBeamFixtures(project,'switch.a',{entityId:'switch.a',id:'spot-2'}).map(x=>x.id),['spot-2']);
 assert.equal(resolvePanelBeamFixtures(project,'switch.a').length,2);
 assert.equal(resolvePanelBeamFixtures(project,'switch.socket').length,0);
 assert.equal(resolvePanelBeamFixtures(project,'switch.a',{entityId:'switch.a',id:'deleted'}).length,0);
 assert.deepEqual(resolvePanelBeamFixtures(project,'light.a',{entityId:'switch.a',id:'spot-1'}).map(x=>x.id),['direct']);
 const memory=new Map(),storage=()=>({getItem:k=>memory.get(k),setItem:(k,v)=>memory.set(k,v)}),store=createBeamSettingsStore(storage);
 store.update({types:{'light.downlight':45},fixtures:{'spot-2':80}});
 setFixtureBeamAngle('spot-1',60,store);assert.equal(resolveBeamAngle(store.getSnapshot(),'light.downlight','spot-1'),60);
 assert.equal(store.getSnapshot().fixtures['spot-2'],80);
 resetFixtureBeamAngle('spot-1',store);assert.equal(resolveBeamAngle(store.getSnapshot(),'light.downlight','spot-1'),45);
 store.update({types:{'light.downlight':70}});assert.equal(resolveBeamAngle(store.getSnapshot(),'light.downlight','spot-1'),70);
 const restored=createBeamSettingsStore(storage);assert.equal(restored.getSnapshot().fixtures['spot-2'],80);
 assert.equal(restored.getSnapshot().fixtures['spot-1'],undefined);
});
