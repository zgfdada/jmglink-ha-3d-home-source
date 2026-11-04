// Uniform wall visibility is evaluated before the BRDF: both diffuse and specular
// contributions vanish together. It does not depend on receiveShadow or quality.
export function physicalLightShader(shader,uniforms,count,lightingChunk){
 Object.assign(shader.uniforms,uniforms);
 const declarations=`
 uniform mat4 physicalViewToFloor;
 uniform vec4 physicalWalls[${Math.max(1,count)}];
 uniform vec2 physicalWallHeights[${Math.max(1,count)}];
 float physicalWallVisibility(vec3 sourceView,vec3 pointView){
  vec3 source=(physicalViewToFloor*vec4(sourceView,1.)).xyz;
  vec3 point=(physicalViewToFloor*vec4(pointView,1.)).xyz;
  vec2 ray=point.xz-source.xz;
  float epsilon=0.0001/max(length(point-source),0.001);
  for(int wi=0;wi<${count};wi++){
   vec4 wall=physicalWalls[wi];
   if(max(source.x,point.x)<min(wall.x,wall.z)||min(source.x,point.x)>max(wall.x,wall.z)||max(source.z,point.z)<min(wall.y,wall.w)||min(source.z,point.z)>max(wall.y,wall.w))continue;
   vec2 edge=wall.zw-wall.xy;
   float den=ray.x*edge.y-ray.y*edge.x;
   if(abs(den)<0.0000001)continue;
   vec2 q=wall.xy-source.xz;
   float t=(q.x*edge.y-q.y*edge.x)/den;
   float u=(q.x*ray.y-q.y*ray.x)/den;
   float y=mix(source.y,point.y,t);
   if(t>epsilon&&t<1.-epsilon&&u>=0.&&u<=1.&&y>=physicalWallHeights[wi].x&&y<=physicalWallHeights[wi].y)return 0.;
  }
  return 1.;
 }
 `;
 let chunk=lightingChunk;
 for(const [method,light] of [['getPointLightInfo','pointLight'],['getSpotLightInfo','spotLight']]){
  const call=`${method}( ${light}, geometryPosition, directLight );`;
  if(!chunk.includes(call))throw new Error('Renderer lighting chunk changed: '+method);
  chunk=chunk.replace(call,`${call}\n if(directLight.visible) directLight.color*=physicalWallVisibility(${light}.position,geometryPosition);`);
 }
 shader.fragmentShader=declarations+shader.fragmentShader.replace('#include <lights_fragment_begin>',chunk);
}

export function bindPhysicalLightOcclusion(root,uniforms,count,lightingChunk){
 const nodes=new Map(),materials=new Map();
 const patch=material=>{
  if(!material||materials.has(material)||!(material.isMeshStandardMaterial||material.isMeshPhysicalMaterial||material.isMeshPhongMaterial||material.isMeshLambertMaterial||material.isMeshToonMaterial))return;
  const compile=material.onBeforeCompile,key=material.customProgramCacheKey;
  materials.set(material,{compile,key});
  material.onBeforeCompile=function(shader,renderer){compile.call(this,shader,renderer);physicalLightShader(shader,uniforms,count,lightingChunk);};
  material.customProgramCacheKey=function(){return key.call(this)+'-physical-walls-'+count;};
  material.needsUpdate=true;
 };
 const add=node=>{
  if(!node||nodes.has(node)||node.userData?.sceneVisualEffect)return;
  const before=node.onBeforeRender;
  if(node.isMesh){
   node.onBeforeRender=function(renderer,scene,camera,geometry,material,group){before.call(this,renderer,scene,camera,geometry,material,group);patch(material);};
   for(const mat of Array.isArray(node.material)?node.material:[node.material])patch(mat);
  }
  const added=e=>add(e.child),removed=e=>remove(e.child);
  nodes.set(node,{before,added,removed});node.addEventListener('childadded',added);node.addEventListener('childremoved',removed);
  for(const child of node.children)add(child);
 };
 const remove=node=>{
  if(!node)return;for(const child of node.children)remove(child);
  const old=nodes.get(node);if(!old)return;
  node.removeEventListener('childadded',old.added);node.removeEventListener('childremoved',old.removed);
  if(node.isMesh)node.onBeforeRender=old.before;
  nodes.delete(node);
 };
 add(root);
 return()=>{remove(root);for(const [material,old]of materials){material.onBeforeCompile=old.compile;material.customProgramCacheKey=old.key;material.needsUpdate=true;}materials.clear();};
}
