import {a as React} from '../vendor/react.js';
import {b as useFrame,u as useThree} from '../vendor/three.js';
import {Color,NormalBlending,AdditiveBlending} from 'three';
import {advanceLightLevel,lightLevel,transitionFactor,fixtureEmissiveOutput,FIXTURE_FADE_RATES,FIXTURE_LIGHT_BALANCE} from '../domain/fixture-lighting.js';
import {fixtureLightSettingsStore} from '../domain/fixture-light-settings.js';

const FixtureTransitionContext=React.createContext(null);
export function useFixtureLightTransition({on=true,brightness,color}){
 const shared=React.useContext(FixtureTransitionContext),invalidate=useThree(s=>s.invalidate);
 const balance=React.useSyncExternalStore(fixtureLightSettingsStore.subscribe,fixtureLightSettingsStore.getSnapshot,fixtureLightSettingsStore.getSnapshot);
 const goal=on?lightLevel(brightness):0,targetColor=React.useMemo(()=>new Color(color),[color]);
 const local=React.useMemo(()=>({level:0,goal:0,onLevel:1,color:targetColor.clone(),goalColor:targetColor.clone(),wake:true,balance}),[]);
 React.useLayoutEffect(()=>{
  if(shared)return;
  if(local.goal!==goal||!local.goalColor.equals(targetColor))local.wake=true;
  local.goal=goal;local.goalColor.copy(targetColor);local.balance=balance;
  if(goal>0)local.onLevel=goal;
  invalidate();
 },[shared,local,goal,targetColor,balance,invalidate]);
 useFrame((_,delta)=>{
  if(shared)return;
  // A dormant demand canvas can report a large delta: show the old level first.
  const dt=local.wake?0:Math.min(.05,Math.max(0,delta));local.wake=false;
  if(local.level===0)local.color.copy(local.goalColor);
  else local.color.lerp(local.goalColor,transitionFactor(dt,FIXTURE_FADE_RATES.color));
  const distance=Math.max(Math.abs(local.color.r-local.goalColor.r),Math.abs(local.color.g-local.goalColor.g),Math.abs(local.color.b-local.goalColor.b));
  if(distance<.001)local.color.copy(local.goalColor);
  local.level=advanceLightLevel(local.level,local.goal,dt);
  if(local.level!==local.goal||distance>=.001)invalidate();
 },-1);
 return shared??local;
}
export function FixtureLightTransition({on,brightness,color,children}){
 const state=useFixtureLightTransition({on,brightness,color});
 return <FixtureTransitionContext.Provider value={state}>{children}</FixtureTransitionContext.Provider>;
}

export function ChandelierShade(){
 const material=React.useRef();
 const white=React.useMemo(()=>new Color('#f7f6f2'),[]);
 const state=useFixtureLightTransition({});
 useFrame(()=>{
  if(!material.current)return;
  const glow=fixtureEmissiveOutput(state.level,state.balance);
  material.current.color.copy(white)
   .lerp(state.color,Math.min(1,Math.sqrt(glow)))
   .multiplyScalar(1+glow*.8);
 });
 return <meshBasicMaterial ref={material} color="#f7f6f2" toneMapped={false}/>;
}

// These materials read the exact same animated level as FixtureLight. React
// receives only HA targets; no per-frame React renders or HA service calls.
export function FixtureGlowMaterial({materialType='meshPhysicalMaterial',color,emissive,emissiveIntensity=0,opacity=1,blending,...props}){
 const state=React.useContext(FixtureTransitionContext),material=React.useRef();
 const offColor=React.useMemo(()=>new Color(color??'#8d8f96'),[color]);
 useFrame(()=>{
  const m=material.current;if(!m||!state)return;
  m.emissive.copy(state.color);
  m.emissiveIntensity=Math.max(fixtureEmissiveOutput(state.level,state.balance),state.goal===0?emissiveIntensity*state.balance.emitter/FIXTURE_LIGHT_BALANCE.emitter:0);
  const gain=Math.max(0,state.balance.emitter); m.color.copy(offColor).lerp(state.color,Math.min(1,state.level*2)*Math.min(1,gain)); m.roughness=.88; m.metalness=0; if("clearcoat" in m)m.clearcoat=0;
  const off=opacity<.5?opacity:materialType==='meshStandardMaterial'?.34:materialType==='meshToonMaterial'?.82:.84;
  const lit=materialType==='meshStandardMaterial'?.94:.98;
  const progress=Math.min(1,state.level/Math.max(.001,state.onLevel));
  m.opacity=off+(lit-off)*progress;
 });
 return React.createElement(materialType,{...props,ref:material,color:state?'#8d8f96':color,emissive:state?'#000000':emissive,emissiveIntensity:state?0:emissiveIntensity,opacity,blending:NormalBlending});
}
export function FixtureHaloMaterial({haloScale=1,selected=false,color,opacity,...props}){
 const state=React.useContext(FixtureTransitionContext),material=React.useRef();
 useFrame(()=>{
  const m=material.current;if(!m||!state)return;
  m.color.copy(state.color);
  const progress=Math.min(1,state.level/Math.max(.001,state.onLevel));
  m.opacity=Math.max(0,state.balance.emitter*(.12+state.level*.28)*haloScale*progress,selected ? .09*haloScale*state.balance.emitter/FIXTURE_LIGHT_BALANCE.emitter : 0);
 });
 return <meshBasicMaterial {...props} ref={material} color={color} opacity={state ? .025 : opacity} blending={AdditiveBlending}/>;
}

// The housing keeps its paint colour at zero; HDR colour adds only the visual glow.
export function FixtureShellMaterial({color,opacity=1,transparent=false,side,depthWrite=true,glowEnabled=true,stripDiffuser=false}){
 const state=React.useContext(FixtureTransitionContext),material=React.useRef();
 const base=React.useMemo(()=>new Color(color??'#eeeeee'),[color]);
 const strip=React.useMemo(()=>({
  stripTint:{value:new Color('#ffffff')},
  stripGlow:{value:0},
 }),[]);
 const compileStrip=React.useCallback(shader=>{
  Object.assign(shader.uniforms,strip);
  shader.vertexShader='varying float stripTop;\n'+shader.vertexShader.replace(
   '#include <begin_vertex>','#include <begin_vertex>\nstripTop = normal.x;');
  shader.fragmentShader='varying float stripTop; uniform vec3 stripTint; uniform float stripGlow;\n'+shader.fragmentShader.replace(
   '#include <color_fragment>',`#include <color_fragment>
   float diffuser = smoothstep(0.08, 0.35, -stripTop);
   float visibleGlow = stripGlow * mix(0.65, 1.0, diffuser);
   diffuseColor.rgb = mix(diffuseColor.rgb, stripTint, min(1.0, visibleGlow)) * (1.0 + visibleGlow);`);
 },[strip]);
 useFrame(()=>{
  const m=material.current;if(!m||!state)return;
  const glow=glowEnabled?fixtureEmissiveOutput(state.level,state.balance):0;
  if(stripDiffuser){
   strip.stripGlow.value=glow;
   strip.stripTint.value.copy(state.color);
   return;
  }
  m.color.copy(base).lerp(state.color,Math.min(1,glow)).multiplyScalar(1+glow);
 });
 if(stripDiffuser)return <meshBasicMaterial ref={material} color={color} toneMapped={false} onBeforeCompile={compileStrip}/>;
 return <meshBasicMaterial ref={material} color={color} opacity={opacity} transparent={transparent} side={side} depthWrite={depthWrite}/>;
}
