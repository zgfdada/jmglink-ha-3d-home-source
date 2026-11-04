import {a as React} from '../vendor/react.js';
import {b as useFrame,u as useThree} from '../vendor/three.js';
import * as THREE from 'three';
import {ignoreSceneEffectRaycast} from '../domain/scene-picking.js';

// A single draw call in the same rotating group as the house.
export default function OrbitStarfield() {
  const {gl}=useThree();
  const reducedMotion=React.useRef(false);
  React.useEffect(()=>{
    const media=window.matchMedia('(prefers-reduced-motion: reduce)');
    const update=()=>{reducedMotion.current=media.matches;};update();
    media.addEventListener('change',update);
    return ()=>media.removeEventListener('change',update);
  },[]);
  const geometry=React.useMemo(()=>{
    const count=2400,positions=new Float32Array(count*3),seeds=new Float32Array(count*3);
    for(let i=0;i<count;i++){
      const y=Math.random()*2-1,theta=Math.random()*Math.PI*2,radius=72+Math.random()*8;
      const ring=Math.sqrt(1-y*y);
      positions.set([Math.cos(theta)*ring*radius,y*radius,Math.sin(theta)*ring*radius],i*3);
      seeds.set([Math.random()*Math.PI*2,1+Math.random()*2.2,.25+Math.random()*.55],i*3);
    }
    const value=new THREE.BufferGeometry();
    value.setAttribute('position',new THREE.BufferAttribute(positions,3));
    value.setAttribute('seed',new THREE.BufferAttribute(seeds,3));
    return value;
  },[]);
  const uniforms=React.useMemo(()=>({uTime:{value:0},uDpr:{value:1}}),[]);
  useFrame(({clock})=>{uniforms.uTime.value=reducedMotion.current?0:clock.elapsedTime;uniforms.uDpr.value=gl.getPixelRatio();});
  React.useEffect(()=>()=>geometry.dispose(),[geometry]);
  return <points geometry={geometry} raycast={ignoreSceneEffectRaycast} renderOrder={-100} frustumCulled={false} userData={{sceneVisualEffect:true}}>
    <shaderMaterial transparent depthWrite={false} toneMapped={false} uniforms={uniforms}
      userData={{outlineParameters:{visible:false}}}
      vertexShader={`uniform float uTime;uniform float uDpr;attribute vec3 seed;varying float vBrightness;
        void main(){vec3 p=position+vec3(sin(uTime*.025+seed.x),cos(uTime*.021+seed.x),0.)*.35;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);gl_PointSize=seed.y*uDpr;
        vBrightness=seed.z*(.35+.65*(.5+.5*sin(uTime*(.3+seed.y*.12)+seed.x)));}`}
      fragmentShader={`varying float vBrightness;void main(){float d=length(gl_PointCoord-.5)*2.;
        float alpha=(1.-smoothstep(.1,1.,d))*vBrightness;if(alpha<.01)discard;
        gl_FragColor=vec4(1.,.98,.91,alpha);}`} />
  </points>;
}
