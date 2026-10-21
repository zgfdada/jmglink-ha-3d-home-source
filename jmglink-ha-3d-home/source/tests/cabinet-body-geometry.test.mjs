import test from "node:test";
import assert from "node:assert/strict";
import { Vector3 } from "three";
import { cabinetBodyContour, createCabinetBodyGeometry } from "../apps/web/src/domain/cabinet-body-geometry.js";

const footprint = [[-2.0000000000000004,-0.4],[-2,-1.8],[-1.2,-1.8],[-1.201,-0.4],[0,-0.4],[1.1,-0.4],[1.1,-1.8],[2,-1.8],[2,0.3],[-2.0000000000000004,0.3]];
const area = points => Math.abs(points.reduce((sum,p,i) => {const q=points[(i+1)%points.length];return sum+p[0]*q[1]-q[0]*p[1];},0)/2);

test("cabinet cap contour removes float-noise collinearity without changing the authored segment data or footprint", () => {
  const original=structuredClone(footprint), clean=cabinetBodyContour(footprint);
  assert.deepEqual(footprint,original);
  assert(clean.length<footprint.length);
  assert(Math.abs(area(clean)-area(footprint))<1e-10);
  assert(clean.some(p=>p[0]===-1.201),"meaningful angled edge must remain");
});

test("concave cabinet extrusion has finite normals, no zero-area caps, correct volume and bounds in both windings", () => {
  for(const points of [footprint,[...footprint].reverse(),[[-1,-.3],[1,-.3],[1,.3],[-1,.3]]]) {
    const height=1.12,g=createCabinetBodyGeometry(points,height),p=g.attributes.position,n=g.attributes.normal;
    assert([...p.array,...n.array].every(Number.isFinite));
    let caps=0, volume=0;
    for(let i=0;i<p.count;i+=3){
      const a=new Vector3().fromBufferAttribute(p,i),b=new Vector3().fromBufferAttribute(p,i+1),c=new Vector3().fromBufferAttribute(p,i+2);
      const cross=b.clone().sub(a).cross(c.clone().sub(a));
      assert(cross.lengthSq()>1e-16,"no collapsed triangle at cabinet bottom or top");
      if(Math.abs(cross.z)>cross.length()*.999999)caps+=cross.length()/2;
      volume+=a.dot(b.clone().cross(c))/6;
    }
    assert(Math.abs(caps-2*area(points))<1e-5);
    assert(Math.abs(Math.abs(volume)-area(points)*height)<1e-5);
    g.computeBoundingBox();assert(Math.abs(g.boundingBox.max.z-height)<1e-6);
    g.dispose();
  }
});

test("cabinet body geometry rejects invalid dimensions and handles a duplicate closing vertex", () => {
  assert.throws(()=>createCabinetBodyGeometry(footprint,0),RangeError);
  assert.throws(()=>cabinetBodyContour([[0,0],[NaN,1],[1,0]]),RangeError);
  const closed=[...footprint,footprint[0]];
  assert.deepEqual(cabinetBodyContour(closed),cabinetBodyContour(footprint));
});
