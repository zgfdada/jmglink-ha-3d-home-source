import {useFixtureLightTransition} from './fixture-light-transition.jsx';
import {bindPhysicalLightOcclusion} from '../domain/physical-light-occlusion.js';
import {a as React} from '../vendor/react.js';
const {createContext,useMemo,useRef,useLayoutEffect}=React;
import {b as useFrame,u as useThree,lightsFragmentBegin,rendererUniformsLib} from '../vendor/three.js';
import {Object3D,Vector2,Vector4,Matrix4} from 'three';
import {RectAreaLightTexturesLib} from 'three/addons/lights/RectAreaLightTexturesLib.js';
import {fixtureLightProfile,fixtureLightOutput,DEFAULT_FIXTURE_BEAM_ANGLE} from '../domain/fixture-lighting.js';
import {wallLightBlockers} from '../domain/light-occlusion.js';
import {normalizeBeamAngle} from '../domain/light-beam-settings.js';
export const FloorLightContext=createContext(null);
function StripAreaLight({color,brightness,on,stripLength,intensityScale,fixtureId,roomId}) {
 const lights=useRef([]);
 const state=useFixtureLightTransition({on,brightness,color});
 const invalidate=useThree(state=>state.invalidate);
 useLayoutEffect(()=>{
  if(!rendererUniformsLib.LTC_FLOAT_1){
   const {LTC_FLOAT_1,LTC_FLOAT_2,LTC_HALF_1,LTC_HALF_2}=RectAreaLightTexturesLib.init();
   Object.assign(rendererUniformsLib,{LTC_FLOAT_1,LTC_FLOAT_2,LTC_HALF_1,LTC_HALF_2});
  }
  invalidate();
 },[stripLength,intensityScale,invalidate]);
 const width=Number.isFinite(stripLength)?Math.max(.08,stripLength):1;
 const height=.06;
 const outputScale=Math.max(0,Number.isFinite(intensityScale)?intensityScale:1);
 const metadata={fixtureLight:true,fixtureVariant:'strip',fixtureId,roomId};
 useFrame(()=>{
  const output=fixtureLightOutput(state.level,'strip',state.balance).intensity*outputScale;
  for(const light of lights.current){
   if(!light)continue;
   light.visible=output>0;
   if(!light.visible)continue;
   // Three reads RectAreaLight dimensions directly and ignores its world scale.
   light.updateWorldMatrix(true,false);
   const matrix=light.matrixWorld.elements;
   light.width=width*Math.max(.001,Math.hypot(matrix[0],matrix[1],matrix[2]));
   light.height=height*Math.max(.001,Math.hypot(matrix[4],matrix[5],matrix[6]));
   light.intensity=output/(light.width*light.height);
   light.color.copy(state.color);
  }
 });
 // Mirror the grazing light so drawing the same strip in reverse preserves its wall wash.
 return <group position={[0,-.09,0]}>{[-1,1].map((side,index)=>
  <rectAreaLight key={side} ref={node=>{lights.current[index]=node}} userData={metadata}
   position={[0,0,-side*.05]} rotation={[-side*Math.PI/5,side<0?Math.PI:0,0]}
   width={width} height={height} intensity={0} visible={false}/>
 )}</group>;
}
export function FloorLightOcclusion({floor,root,children,colorFill=0}){
 const value=useMemo(()=>({root,blockers:wallLightBlockers(floor)}),[floor,root]);
 const physicalUniforms=useMemo(()=>({physicalViewToFloor:{value:new Matrix4()},physicalWalls:{value:value.blockers.length?value.blockers.map(b=>new Vector4(...b.segment)):[new Vector4()]},physicalWallHeights:{value:value.blockers.length?value.blockers.map(b=>new Vector2(...b.height)):[new Vector2()]}}),[value]);
 const surfaceColorFill=useRef({value:0}).current;
 const invalidate=useThree(state=>state.invalidate);
 useLayoutEffect(()=>{surfaceColorFill.value=colorFill;invalidate();},[colorFill,surfaceColorFill,invalidate]);
 const inverse=useMemo(()=>new Matrix4(),[]);
 useFrame(({camera})=>{if(!root.current)return;root.current.updateWorldMatrix(true,false);camera.updateWorldMatrix(true,false);inverse.copy(root.current.matrixWorld).invert();physicalUniforms.physicalViewToFloor.value.multiplyMatrices(inverse,camera.matrixWorld);});
 useLayoutEffect(()=>bindPhysicalLightOcclusion(root.current,physicalUniforms,value.blockers.length,lightsFragmentBegin,surfaceColorFill),[root,physicalUniforms,value,surfaceColorFill]);
 return <FloorLightContext.Provider value={value}>{children}</FloorLightContext.Provider>;
}
export default function FixtureLight(props){
 return props.variant==='strip'?<StripAreaLight {...props}/>:<DiscreteFixtureLight {...props}/>;
}
function DiscreteFixtureLight({color,brightness,on=true,variant,beamAngle=DEFAULT_FIXTURE_BEAM_ANGLE,intensityScale=1,fixtureId,roomId}){
 const root=useRef(),lights=useRef([]);
 const profile=fixtureLightProfile(variant),state=useFixtureLightTransition({on,brightness,color});
 const invalidate=useThree(state=>state.invalidate);
 useLayoutEffect(()=>{invalidate();},[variant,intensityScale,invalidate]);
 const source=[0,variant==='floor'?1.02:variant==='chandelier'?-.55:-.09,variant==='wall'?.13:0];
 const target=useMemo(()=>{
  const object=new Object3D();
  object.position.set(0,-1,variant==='wall'?-.35:0);
  return object;
 },[variant]);
 const positions=useMemo(()=>[[0,0,0]],[]);
 useFrame(()=>{
  if(!root.current)return;
  root.current.visible=state.level>0;
  const output=fixtureLightOutput(state.level,variant,state.balance);
  for(const light of lights.current){if(light){light.intensity=output.intensity*Math.max(0,Number.isFinite(intensityScale)?intensityScale:1)/positions.length;light.color.copy(state.color);}}
 });
 const metadata={fixtureLight:true,fixtureVariant:variant,fixtureId,roomId};
 // No mesh, cylinder, sprite or cone: light is visible only on receiving surfaces.
 return <group position={source} ref={root}>
  {profile.type==='spot'?<><primitive object={target}/><spotLight ref={node=>{lights.current=[node]}} userData={metadata} target={target} intensity={0} distance={0} decay={2} angle={normalizeBeamAngle(beamAngle,DEFAULT_FIXTURE_BEAM_ANGLE)*Math.PI/360} penumbra={.75} shadow-mapSize-width={1024} shadow-mapSize-height={1024} shadow-radius={5} shadow-bias={-.0006} shadow-normalBias={.03} shadow-camera-near={.15} shadow-camera-far={9}/></>:positions.map((position,index)=><pointLight key={index} ref={node=>{lights.current[index]=node}} userData={metadata} position={position} intensity={0} distance={profile.distance} decay={2} shadow-mapSize-width={512} shadow-mapSize-height={512} shadow-radius={4} shadow-bias={-.003} shadow-normalBias={.03} shadow-camera-near={.08} shadow-camera-far={9}/>)}
 </group>;
}
