import {bindPhysicalLightOcclusion} from '../domain/physical-light-occlusion.js';
import {a as React} from '../vendor/react.js';
const {createContext,useContext,useMemo,useRef,useLayoutEffect}=React;
import {b as useFrame,lightsFragmentBegin} from '../vendor/three.js';
import {Object3D,Vector2,Vector3,Vector4,Matrix4,DoubleSide,AdditiveBlending} from 'three';
import {wallLightBlockers,beamOcclusionShader} from '../domain/light-occlusion.js';
import {beamFrustum,normalizeBeamAngle} from '../domain/light-beam-settings.js';
import {ignoreSceneEffectRaycast} from '../domain/scene-picking.js';
export const FloorLightContext=createContext(null);
export function FloorLightOcclusion({floor,root,children}){
 const value=useMemo(()=>({root,blockers:wallLightBlockers(floor)}),[floor,root]);
 const physicalUniforms=useMemo(()=>({physicalViewToFloor:{value:new Matrix4()},physicalWalls:{value:value.blockers.length?value.blockers.map(b=>new Vector4(...b.segment)):[new Vector4()]},physicalWallHeights:{value:value.blockers.length?value.blockers.map(b=>new Vector2(...b.height)):[new Vector2()]}}),[value]);
 const inverse=useMemo(()=>new Matrix4(),[]);
 useFrame(({camera})=>{if(!root.current)return;root.current.updateWorldMatrix(true,false);camera.updateWorldMatrix(true,false);inverse.copy(root.current.matrixWorld).invert();physicalUniforms.physicalViewToFloor.value.multiplyMatrices(inverse,camera.matrixWorld);});
 useLayoutEffect(()=>bindPhysicalLightOcclusion(root.current,physicalUniforms,value.blockers.length,lightsFragmentBegin),[root,physicalUniforms,value]);
 return <FloorLightContext.Provider value={value}>{children}</FloorLightContext.Provider>;
}
export default function FixtureLight({color,brightness,variant,beamAngle=38}){
 const floor=useContext(FloorLightContext),root=useRef(),light=useRef();
 const angle=normalizeBeamAngle(beamAngle),level=Math.max(0,Math.min(1,brightness));
 const length=variant==='floor'?1.04:variant==='wall'?.85:variant==='downlight'?1.6:variant==='chandelier'?1.5:2.1;
 const source=useMemo(()=>[0,variant==='floor'?1.02:variant==='chandelier'?-.55:-.09,variant==='wall'?.13:0],[variant]);
 const rotation=variant==='wall'?[-Math.PI/2,0,0]:[0,0,0];
 const target=useMemo(()=>{const o=new Object3D();o.position.set(0,-length,0);return o;},[length]);
 const uniforms=useMemo(()=>({beamFloorInverse:{value:new Matrix4()},beamSource:{value:new Vector3()},beamWalls:{value:floor?.blockers.length?floor.blockers.map(b=>new Vector4(...b.segment)):[new Vector4()]},beamHeights:{value:floor?.blockers.length?floor.blockers.map(b=>new Vector2(...b.height)):[new Vector2()]}}),[floor]);
 const scratch=useMemo(()=>new Vector3(),[]);
 useFrame(()=>{
  if(!root.current||!floor?.root.current)return;
  floor.root.current.updateWorldMatrix(true,false);root.current.updateWorldMatrix(true,false);
  uniforms.beamFloorInverse.value.copy(floor.root.current.matrixWorld).invert();
  root.current.getWorldPosition(scratch);uniforms.beamSource.value.copy(scratch).applyMatrix4(uniforms.beamFloorInverse.value);
 });
 const aperture=beamFrustum(length,angle,variant);
 return <group position={source} rotation={rotation} ref={root}>
  <primitive object={target}/>
  <spotLight ref={light} target={target} color={color} intensity={.6+level*2.5} distance={length+4} decay={2} angle={angle*Math.PI/360} penumbra={.45} castShadow shadow-mapSize-width={256} shadow-mapSize-height={256} shadow-bias={-.00008} shadow-normalBias={.004} shadow-camera-near={.025} shadow-camera-far={12}/>
  <mesh userData={{sceneVisualEffect:true}} position={[0,-length/2,0]} raycast={ignoreSceneEffectRaycast} castShadow={false} receiveShadow={false}>
   <cylinderGeometry args={[aperture.top,aperture.bottom,length,32,1,true]}/>
   <meshBasicMaterial key={floor?.blockers.length??0} color={color} transparent opacity={.014+level*.032} depthWrite={false} side={DoubleSide} blending={AdditiveBlending} toneMapped={false} userData={{outlineParameters:{visible:false}}} onBeforeCompile={shader=>beamOcclusionShader(shader,uniforms,floor?.blockers.length??0)} customProgramCacheKey={()=>`beam-faded-occlusion-${floor?.blockers.length??0}`}/>
  </mesh>
 </group>;
}
