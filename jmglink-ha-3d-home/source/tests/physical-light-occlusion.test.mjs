import test from 'node:test';
import assert from 'node:assert/strict';
import {Group,Mesh,MeshPhysicalMaterial,ShaderChunk,Matrix4,Vector3,Euler,Quaternion} from 'three';
import {physicalLightShader,bindPhysicalLightOcclusion} from '../apps/web/src/domain/physical-light-occlusion.js';
import {wallLightBlockers,lightPathBlocked} from '../apps/web/src/domain/light-occlusion.js';

test('统一墙体可见性在BRDF之前阻断点光与聚光，对漫反射和镜面高光一致生效',()=>{
 const shader={uniforms:{},fragmentShader:'#include <lights_fragment_begin>'},uniforms={physicalViewToFloor:{value:'matrix'}};
 physicalLightShader(shader,uniforms,3,ShaderChunk.lights_fragment_begin);
 for(const name of ['pointLight','spotLight']){
  const visibility=shader.fragmentShader.indexOf(`directLight.color*=physicalWallVisibility(${name}.position,geometryPosition)`);
  assert.ok(visibility>0);assert.ok(visibility<shader.fragmentShader.indexOf('RE_Direct( directLight',visibility));
 }
 assert.equal(shader.uniforms.physicalViewToFloor,uniforms.physicalViewToFloor);
 assert.match(shader.fragmentShader,/if\(directLight.visible\)/);
 assert.doesNotMatch(shader.fragmentShader.slice(0,shader.fragmentShader.indexOf('vec3 geometryPosition')),/receiveShadow/);
});
test('实际餐厅5个灯位至马桶与洗手台的光路穿过连续实体隔墙',()=>{
 const floor={height:2.64,walls:[{id:'wall',start:[2.1,7.6945],end:[2.1,10.3896904],height:2.8}],openings:[]};
 const blockers=wallLightBlockers(floor);
 const sources=[[1.7,2.55,9.9],[0,2.55,9.9],[1.7,2.55,8],[-.1,2.55,8],[.8,2.55,9.0915]];
 for(const source of sources)for(const point of [[2.5,.7,10.1],[2.4,1,8.2835844]])assert.equal(lightPathBlocked(source,point,blockers),true);
 assert.equal(lightPathBlocked(sources[0],[1.4,.7,9.4],blockers),false,'同房间仍受光');
});
test('物理模型统一绑定而不更改材质粗糙度或接收阴影标志，覆盖异步和材质替换并清理',()=>{
 const root=new Group(),material=new MeshPhysicalMaterial({roughness:.08,clearcoat:1}),mesh=new Mesh(undefined,material);
 root.add(mesh);const compile=material.onBeforeCompile,key=material.customProgramCacheKey,before=mesh.onBeforeRender;
 const cleanup=bindPhysicalLightOcclusion(root,{},1,ShaderChunk.lights_fragment_begin);
 assert.equal(mesh.receiveShadow,false);assert.equal(material.roughness,.08);assert.equal(material.clearcoat,1);
 const shader={uniforms:{},fragmentShader:'#include <lights_fragment_begin>'};material.onBeforeCompile(shader);
 assert.match(shader.fragmentShader,/physicalWallVisibility/);
 const late=new Mesh(undefined,new MeshPhysicalMaterial());root.add(late);
 assert.match(late.material.customProgramCacheKey(),/physical-walls-1/);
 const replacement=new MeshPhysicalMaterial();late.material=replacement;late.onBeforeRender(null,null,null,null,replacement,null);
 assert.match(replacement.customProgramCacheKey(),/physical-walls-1/);
 cleanup();assert.equal(mesh.onBeforeRender,before);assert.equal(material.onBeforeCompile,compile);assert.equal(material.customProgramCacheKey,key);
 root.add(new Mesh());
});


test('与当前恢复版 renderer 灯光块保持一致，不混用 npm Three 着色器版本',async()=>{
 const {readFile}=await import('node:fs/promises');const {parse}=await import('acorn');
 const source=await readFile(new URL('../apps/web/src/vendor/three.js',import.meta.url),'utf8');
 const tree=parse(source,{ecmaVersion:'latest',sourceType:'module'}),stack=[tree];let chunk;
 while(stack.length){const n=stack.pop();if(n.type==='TemplateElement'&&n.value.cooked.includes('getSpotLightInfo( spotLight, geometryPosition'))chunk=n.value.cooked;
 for(const v of Object.values(n))if(v&&typeof v==='object')Array.isArray(v)?stack.push(...v.filter(x=>x&&typeof x==='object')):stack.push(v);}
 assert.ok(chunk);assert.match(source,/nR as lightsFragmentBegin/);
 const shader={uniforms:{},fragmentShader:'#include <lights_fragment_begin>'};physicalLightShader(shader,{},95,chunk);
 assert.match(shader.fragmentShader,/physicalWallVisibility\(spotLight.position/);assert.match(shader.fragmentShader,/physicalWallVisibility\(pointLight.position/);
});


test('户型旋转和楼层堆叠后，相机视空间光路仍还原到同一实体墙',()=>{
 const floorWorld=new Matrix4().compose(new Vector3(2,6,-4),new Quaternion().setFromEuler(new Euler(0,.87,0)),new Vector3(1,1,1));
 const cameraWorld=new Matrix4().compose(new Vector3(8,12,20),new Quaternion().setFromEuler(new Euler(-.5,.6,0)),new Vector3(1,1,1));
 const toView=cameraWorld.clone().invert().multiply(floorWorld),toFloor=floorWorld.clone().invert().multiply(cameraWorld);
 const source=[1.7,2.55,9.9],point=[2.5,.7,10.1];
 const recovered=[source,point].map(p=>new Vector3(...p).applyMatrix4(toView).applyMatrix4(toFloor).toArray());
 for(let p=0;p<2;p++)for(let axis=0;axis<3;axis++)assert.ok(Math.abs(recovered[p][axis]-[source,point][p][axis])<1e-9);
 const walls=wallLightBlockers({height:2.64,walls:[{id:'wall',start:[2.1,7.69],end:[2.1,10.39],height:2.64}],openings:[]});
 assert.equal(lightPathBlocked(...recovered,walls),true);
});


test('家具及设备共享颜色补偿，异步模型继承，镜面和玻璃排除', () => {
 const root = new Group();
 const furniture = new Group();
 furniture.userData.surfaceColorFill = true;
 root.add(furniture);
 const strength = { value: .26 };
 const cleanup = bindPhysicalLightOcclusion(root, {}, 0, ShaderChunk.lights_fragment_begin, strength);
 const housing = new Mesh(undefined, new MeshPhysicalMaterial());
 const glass = new Mesh(undefined, new MeshPhysicalMaterial({ transmission: .8 }));
 const mirror = new Mesh(undefined, new MeshPhysicalMaterial());
 mirror.userData.surfaceColorFill = false;
 furniture.add(housing, glass, mirror);
 const compile = mesh => {
  const shader = {
   uniforms: {},
   fragmentShader: 'vec3 totalEmissiveRadiance;\n#include <lights_fragment_begin>\n#include <opaque_fragment>',
  };
  mesh.material.onBeforeCompile(shader);
  return shader;
 };
 const shader = compile(housing);
 assert.equal(shader.uniforms.surfaceColorFill, strength);
 assert.match(shader.fragmentShader, /diffuseColor\.rgb \* surfaceColorFill/);
 strength.value = 0;
 assert.equal(shader.uniforms.surfaceColorFill.value, 0);
 assert.equal(compile(glass).uniforms.surfaceColorFill, undefined);
 assert.equal(compile(mirror).uniforms.surfaceColorFill, undefined);
 cleanup();
});
