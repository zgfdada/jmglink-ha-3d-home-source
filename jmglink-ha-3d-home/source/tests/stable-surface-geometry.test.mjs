import test from "node:test";
import assert from "node:assert/strict";
import { Vector3 } from "three";
import { createStableRoundedBoxGeometry, stableRoundedBoxRadius, STABLE_SURFACE_EDGE_PROPS } from "../apps/web/src/domain/stable-surface-geometry.js";
import { readFileSync } from "node:fs";

test("thin doors, handles, shelves and large furniture retain non-zero core and finite normals", () => {
  for (const size of [[0.6,2.2,0.022],[0.035,1,0.02],[2,0.04,0.5],[0.012,0.7,0.014],[2,1,0.8]]) {
    const radius=stableRoundedBoxRadius(size);
    for(const dimension of size) assert(dimension-2*radius > 0);
    const g=createStableRoundedBoxGeometry(size);
    const p=g.attributes.position,n=g.attributes.normal;
    assert([...p.array,...n.array].every(Number.isFinite));
    g.computeBoundingBox();const bounds=g.boundingBox.getSize(new Vector3());
    size.forEach((value,index)=>assert(Math.abs(bounds.getComponent(index)-value)<1e-5));
    for(let i=0;i<p.count;i+=3){
      const a=new Vector3().fromBufferAttribute(p,i),b=new Vector3().fromBufferAttribute(p,i+1),c=new Vector3().fromBufferAttribute(p,i+2);
      assert(b.sub(a).cross(c.sub(a)).lengthSq()>1e-22,"no collapsed triangles");
    }
    // A broad, flat door face must not inherit diagonal normals from its rim.
    for(let i=0;i<p.count;i++)if(Math.abs(p.getX(i))<size[0]/2-radius-1e-5&&Math.abs(p.getY(i))<size[1]/2-radius-1e-5&&Math.abs(p.getZ(i))>size[2]/2-1e-6){
      assert(Math.abs(n.getX(i))<1e-6&&Math.abs(n.getY(i))<1e-6&&Math.abs(Math.abs(n.getZ(i))-1)<1e-6);
    }
    g.dispose();
  }
});
test("invalid dimensions fail explicitly and decorative edges remain occluded without writing depth",()=>{
  for(const size of [[0,1,1],[-1,1,1],[NaN,1,1],[Infinity,1,1]])assert.throws(()=>stableRoundedBoxRadius(size),RangeError);
  assert.deepEqual(STABLE_SURFACE_EDGE_PROPS,{depthWrite:false,depthTest:true});
});

test("cabinet material stays opaque and retains shadow behavior", () => {
  const source=readFileSync(new URL('../apps/web/src/app/scene.js',import.meta.url),'utf8');
  const detail=source.slice(source.indexOf('function H({'),source.indexOf('function Fn('));
  assert.doesNotMatch(detail,/surfaceDetail/);
  assert.match(detail,/f = a\s*\? t.jsx\("meshToonMaterial", \{ color: l \}\)/);
  assert.doesNotMatch(detail,/FurnitureOpacity|transparent: opacity < 1/);
  assert.match(detail,/roughness: c \? 0.64 : n \? Math.min\(o, 0.44\) : o/);
  assert.match(detail,/castShadow: !0/);
  assert.match(detail,/receiveShadow: !0/);
  const bodies=source.slice(source.indexOf('bodyRanges.map('),source.indexOf('connectorPanels.map('));
  assert.match(bodies,/castShadow: !0/);
  assert.match(bodies,/receiveShadow: !0/);
  assert.doesNotMatch(source,/renderProbe/);
});
