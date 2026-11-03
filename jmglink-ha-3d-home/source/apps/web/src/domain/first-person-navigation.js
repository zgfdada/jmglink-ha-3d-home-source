import {isVirtualWall} from './walls.js';
export const WALK_RADIUS=.18;
export function segmentDistance(point,a,b) {
  const dx=b[0]-a[0],dz=b[1]-a[1],den=dx*dx+dz*dz;
  const t=den?Math.max(0,Math.min(1,((point[0]-a[0])*dx+(point[1]-a[1])*dz)/den)):0;
  return Math.hypot(point[0]-a[0]-t*dx,point[1]-a[1]-t*dz);
}
function inside(p,poly) {
  let yes=false;
  for(let i=0,j=poly.length-1;i<poly.length;j=i++) {
    const a=poly[i],b=poly[j];
    if((a[1]>p[1])!==(b[1]>p[1]) && p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])yes=!yes;
  }
  return yes;
}
export function createWalkNavigation(floor,{wallThicknessScale=1,elevations=new Map()}={}) {
  const points=(floor.walls??[]).flatMap(w=>[w.start,w.end]);
  const hasWalls=points.length>0;
  if(!points.length)for(const room of floor.rooms??[])points.push(...room.polygon);
  const minX=points.length?Math.min(...points.map(p=>p[0])):0,maxX=points.length?Math.max(...points.map(p=>p[0])):8;
  const minZ=points.length?Math.min(...points.map(p=>p[1])):0,maxZ=points.length?Math.max(...points.map(p=>p[1])):6;
  const eyeHeight=Math.min(1.6,Math.max(.6,(floor.height??2.8)-.2));
  const segments=[];
  for(const wall of floor.walls??[]) {
    if(isVirtualWall(wall)||wall.height<.15)continue;
    const dx=wall.end[0]-wall.start[0],dz=wall.end[1]-wall.start[1],length=Math.hypot(dx,dz);
    if(length<.001)continue;
    const openings=(floor.openings??[]).filter(o=>o.wallId===wall.id&&o.type==='door'&&(o.bottom??0)<=.1&&o.height>=eyeHeight+.1).map(o=>[Math.max(0,o.offset-o.width/2),Math.min(length,o.offset+o.width/2)]).sort((a,b)=>a[0]-b[0]);
    let cursor=0;
    const add=(start,end)=>{if(end-start>.001)segments.push({a:[wall.start[0]+dx*start/length,wall.start[1]+dz*start/length],b:[wall.start[0]+dx*end/length,wall.start[1]+dz*end/length],thickness:Math.max(.02,wall.thickness*wallThicknessScale)});};
    for(const [from,to] of openings){add(cursor,from);cursor=Math.max(cursor,to);}
    add(cursor,length);
  }
  const obstacles=(floor.furniture??[]).filter(item=>{
    const bottom=elevations.get(`furniture:${item.id}`)??item.elevation??0;
    return bottom<eyeHeight+.15 && bottom+item.height>.12 && item.width>0 && item.depth>0;
  }).map(item=>({center:item.position,rotation:item.rotation??0,width:item.width,depth:item.depth}));
  return {segments,obstacles,polygons:(floor.rooms??[]).filter(room=>room.polygon.length>=3).map(room=>room.polygon),bounds:[minX,maxX,minZ,maxZ],center:hasWalls?[(minX+maxX)/2,(minZ+maxZ)/2]:[4,3],eyeHeight};
}
export function canWalkAt(nav,point,radius=WALK_RADIUS) {
  if(!point.every(Number.isFinite))return false;
  const [x,z]=point,[minX,maxX,minZ,maxZ]=nav.bounds;
  if(x<minX||x>maxX||z<minZ||z>maxZ)return false;
  if(nav.polygons.length && !nav.polygons.some(poly=>inside(point,poly)||poly.some((a,i)=>segmentDistance(point,a,poly[(i+1)%poly.length])<=.3)))return false;
  if(nav.segments.some(s=>segmentDistance(point,s.a,s.b)<radius+s.thickness/2))return false;
  return !nav.obstacles.some(o=>{
    const dx=x-o.center[0],dz=z-o.center[1],c=Math.cos(o.rotation),s=Math.sin(o.rotation);
    const localX=c*dx+s*dz,localZ=-s*dx+c*dz;
    const qx=Math.max(0,Math.abs(localX)-o.width/2),qz=Math.max(0,Math.abs(localZ)-o.depth/2);
    return Math.hypot(qx,qz)<radius;
  });
}
export function walkStep(nav,position,delta) {
  let p=[...position];
  const count=Math.max(1,Math.ceil(Math.hypot(...delta)/.06));
  for(let i=0;i<count;i++) {
    const next=[p[0]+delta[0]/count,p[1]+delta[1]/count];
    if(canWalkAt(nav,next))p=next;
    else {
      const x=[p[0]+delta[0]/count,p[1]];if(canWalkAt(nav,x))p=x;
      const z=[p[0],p[1]+delta[1]/count];if(canWalkAt(nav,z))p=z;
    }
  }
  return p;
}
export function walkingDelta(forward,right,yaw,seconds,speed=1.4) {
  if(!forward&&!right)return [0,0];
  const length=Math.max(1,Math.hypot(forward,right)),step=Math.max(0,Math.min(.05,seconds))*speed/length;
  return [(Math.cos(yaw)*right-Math.sin(yaw)*forward)*step,(-Math.cos(yaw)*forward-Math.sin(yaw)*right)*step];
}
