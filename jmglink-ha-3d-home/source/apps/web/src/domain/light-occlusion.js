// Rectangular wall pieces in floor coordinates, with real door/window openings.
export function wallLightBlockers(floor) {
 const result=[];
 for(const wall of floor?.walls??[]){
  if(wall.virtual||wall.transparent)continue;
  const [ax,az]=wall.start,[bx,bz]=wall.end,len=Math.hypot(bx-ax,bz-az);if(len<.001)continue;
  const height=Math.min(wall.height??floor.height,floor.height),holes=(floor.openings??[]).filter(o=>o.wallId===wall.id);
  const cuts=[0,len,...holes.flatMap(o=>[Math.max(0,o.offset-o.width/2),Math.min(len,o.offset+o.width/2)])].filter(x=>x>=0&&x<=len).sort((a,b)=>a-b);
  for(let i=1;i<cuts.length;i++){
   const start=cuts[i-1],end=cuts[i];if(end-start<.001)continue;
   const mid=(start+end)/2,intervals=holes.filter(o=>mid>o.offset-o.width/2&&mid<o.offset+o.width/2).map(o=>[Math.max(0,o.bottom??0),Math.min(height,(o.bottom??0)+o.height)]).sort((a,b)=>a[0]-b[0]);
   let y=0;const add=(low,high)=>{if(high-low>.001)result.push({segment:[ax+(bx-ax)*start/len,az+(bz-az)*start/len,ax+(bx-ax)*end/len,az+(bz-az)*end/len],height:[low,high]});};
   for(const [low,high] of intervals){add(y,low);y=Math.max(y,high);}add(y,height);
  }
 }
 return result;
}
export function lightPathBlocked(source,point,blockers){
 const dx=point[0]-source[0],dz=point[2]-source[2];
 return blockers.some(({segment:[ax,az,bx,bz],height:[low,high]})=>{
 const ex=bx-ax,ez=bz-az,den=dx*ez-dz*ex;if(Math.abs(den)<1e-7)return false;
 const qx=ax-source[0],qz=az-source[2],t=(qx*ez-qz*ex)/den,u=(qx*dz-qz*dx)/den;
 const y=source[1]+(point[1]-source[1])*t;
 return t>.001&&t<.999&&u>=0&&u<=1&&y>=low&&y<=high;
 });
}
// Bounded inverse-square-style falloff, with a soft tail instead of a hard cone rim.
export function beamDistanceFade(fraction) {
 const t=Math.max(0,Math.min(1,Number.isFinite(fraction)?fraction:1));
 const tail=Math.max(0,Math.min(1,(t-.72)/.28));
 return (1-tail*tail*(3-2*tail))/(1+4*t*t);
}
export function beamOcclusionShader(shader,uniforms,count){
 Object.assign(shader.uniforms,uniforms);
 shader.vertexShader='varying vec3 beamWorldPosition; varying float beamDistanceFraction;\n'+shader.vertexShader;
 shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nbeamWorldPosition=(modelMatrix*vec4(transformed,1.)).xyz; beamDistanceFraction=clamp(1.-uv.y,0.,1.);');
 shader.fragmentShader=`varying vec3 beamWorldPosition; varying float beamDistanceFraction;
uniform mat4 beamFloorInverse;uniform vec3 beamSource;
uniform vec4 beamWalls[${Math.max(1,count)}];uniform vec2 beamHeights[${Math.max(1,count)}];
`+shader.fragmentShader;
 shader.fragmentShader=shader.fragmentShader.replace('#include <alphatest_fragment>',`float beamT=clamp(beamDistanceFraction,0.,1.);
 diffuseColor.a*=(1.-smoothstep(.72,1.,beamT))/(1.+4.*beamT*beamT);
 #include <alphatest_fragment>`);
 shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>' ,`#include <clipping_planes_fragment>
vec3 bp=(beamFloorInverse*vec4(beamWorldPosition,1.)).xyz;
vec2 ray=bp.xz-beamSource.xz;
for(int i=0;i<${count};i++){
 vec4 wall=beamWalls[i];vec2 edge=wall.zw-wall.xy;float den=ray.x*edge.y-ray.y*edge.x;
 if(abs(den)<0.000001)continue;vec2 q=wall.xy-beamSource.xz;
 float t=(q.x*edge.y-q.y*edge.x)/den;float u=(q.x*ray.y-q.y*ray.x)/den;
 float y=mix(beamSource.y,bp.y,t);
 if(t>0.001&&t<0.999&&u>=0.&&u<=1.&&y>=beamHeights[i].x&&y<=beamHeights[i].y)discard;
}
`);
}
