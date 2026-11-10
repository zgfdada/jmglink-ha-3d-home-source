import {a as React} from '../vendor/react.js';
import {b as useFrame,u as useThree} from '../vendor/three.js';
import {WebGLRenderTarget,HalfFloatType,Vector2,CustomBlending,OneFactor,ZeroFactor,AddEquation} from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {Pass} from 'three/addons/postprocessing/Pass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {FIXTURE_BLOOM,selectFixtureShadows} from '../domain/fixture-lighting.js';

// The same HDR -> UnrealBloom -> Output chain as house-control. The scene pass
// also draws our existing cartoon outlines into HDR, rather than rendering twice.
class LightingScenePass extends Pass{
 constructor(scene,camera,outline){super();this.scene=scene;this.camera=camera;this.outline=outline;this.needsSwap=false;}
 render(renderer,writeBuffer,readBuffer){
  renderer.setRenderTarget(this.renderToScreen?null:readBuffer);
  if(this.outline)this.outline.render(this.scene,this.camera);
  else renderer.render(this.scene,this.camera);
 }
}
export default function SceneLightingEffects({outlineRenderer=null,quality='balanced'}){
 const {gl,scene,camera,size,viewport,invalidate}=useThree();
 const pipeline=React.useMemo(()=>{
  if(quality==='eco'||!gl.extensions.has('EXT_color_buffer_float'))return null;
  const target=new WebGLRenderTarget(4,4,{type:HalfFloatType,samples:quality==='smooth'?0:4});
  const composer=new EffectComposer(gl,target),render=new LightingScenePass(scene,camera,outlineRenderer);
  const bloom=new UnrealBloomPass(new Vector2(4,4),FIXTURE_BLOOM.strength,FIXTURE_BLOOM.radius,FIXTURE_BLOOM.threshold);
  // Keep the presentation canvas transparent; bloom must not replace its alpha.
  Object.assign(bloom.blendMaterial,{blending:CustomBlending,blendEquation:AddEquation,blendSrc:OneFactor,blendDst:OneFactor,blendEquationAlpha:AddEquation,blendSrcAlpha:ZeroFactor,blendDstAlpha:OneFactor});
  const output=new OutputPass();
  composer.addPass(render);composer.addPass(bloom);composer.addPass(output);
  return {composer,render,bloom,output};
 },[gl,scene,camera,outlineRenderer,quality]);
 React.useLayoutEffect(()=>{
  if(pipeline){pipeline.composer.setPixelRatio(viewport.dpr);pipeline.composer.setSize(size.width,size.height);}
  invalidate();
 },[pipeline,size.width,size.height,viewport.dpr,invalidate]);
 React.useEffect(()=>()=>{
  if(pipeline){pipeline.bloom.dispose();pipeline.output.dispose();pipeline.composer.dispose();}
 },[pipeline]);
 useFrame(()=>{
  const fixtures=[],all=[];let otherShadows=0;
  scene.traverse(light=>{if(light.isLight&&light.userData.fixtureLight)all.push(light);});
  scene.traverseVisible(light=>{
   if(!light.isLight)return;
   if(light.userData.fixtureLight&&light.intensity>0)fixtures.push({id:light.uuid,variant:light.userData.fixtureVariant,roomId:light.userData.roomId});
   else if(light.castShadow)otherShadows++;
  });
  const selected=selectFixtureShadows(fixtures,gl.capabilities.maxTextures,otherShadows);
  for(const light of all)light.castShadow=gl.shadowMap.enabled&&selected.has(light.uuid);
 },.5);
 useFrame((_,delta)=>{
  if(pipeline)pipeline.composer.render(delta);
  else if(outlineRenderer)outlineRenderer.render(scene,camera);
  else gl.render(scene,camera);
 },1);
 return null;
}
