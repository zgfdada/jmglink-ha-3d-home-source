import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile,readdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import Fastify from 'fastify';
import {WebSocket,WebSocketServer} from 'ws';
import {ProjectStore} from '../apps/server/src/projects/ProjectStore.js';
import {createProjectSaveSession,finishProjectSave} from '../apps/web/src/domain/project-save-session.js';
import {createAccessPolicy,registerAccessPolicy} from '../apps/server/src/config/access-policy.js';
import {createInstanceWriteGate,registerInstanceWriteGate} from '../apps/server/src/instance-write-gate.js';
import {collectInstanceLiveEntityIds} from '../apps/server/src/ha/liveSubscriptions.js';
import {SidebarStore} from '../apps/server/src/sidebar/SidebarStore.js';
import {inspectModelBudget,imageSize} from '../apps/web/src/domain/model-budget.js';
import {runModelWorker} from '../apps/web/src/domain/model-worker-client.js';
import {loadModelAsset,modelLoadQueue} from '../apps/web/src/domain/model-assets.js';
import * as THREE from 'three';
import {hydrateModelPacket} from '../apps/web/src/domain/model-worker-client.js';
import {serializeModelScene} from '../apps/web/src/domain/model-worker-packet.js';
import {Worker as NodeWorker} from 'node:worker_threads';
import {registerProjectRoutes} from '../apps/server/src/routes/projectRoutes.js';
import {saveProjectRequest} from '../apps/web/src/domain/project-save-request.js';

async function withStore(run){const dir=await mkdtemp(path.join(tmpdir(),'ha3d-hardening-'));try{return await run(await ProjectStore.create(dir),dir);}finally{await rm(dir,{recursive:true,force:true});}}
test('P1: concurrent saves are serialized, revision is monotonic, backups unique and persisted state matches memory',()=>withStore(async(store)=>{
  const base=structuredClone(store.getProject());
  const saved=await Promise.all(Array.from({length:8},(_,i)=>store.saveProject({...base,name:'save-'+i})));
  assert.equal(saved.length,8);assert.equal(store.getProject().version,base.version+8);
  assert.deepEqual(JSON.parse(await readFile(store.projectPath(base.id),'utf8')),JSON.parse(JSON.stringify(store.getProject())));
  const backups=await store.listBackups();assert.equal(backups.length,8);assert.equal(new Set(backups.map(b=>b.id)).size,8);
  assert.equal((await readdir(store.projectsDirectory)).some(n=>n.endsWith('.tmp')),false);
}));
test('P1: a stale client loses CAS without changing disk or memory',()=>withStore(async(store)=>{
  const base=structuredClone(store.getProject());
  const a=await store.saveProject({...base,name:'winner'},{expectedVersion:base.version});
  await assert.rejects(store.saveProject({...base,name:'stale'},{expectedVersion:base.version}),{statusCode:409});
  assert.deepEqual(store.getProject(),a);
}));
test('P1: HTTP saves require a revision and preserve conflict and disk failure status codes',()=>withStore(async(store)=>{
  const app=Fastify();await registerProjectRoutes(app,store);const base=structuredClone(store.getProject()),url='/api/projects/'+base.id;
  try{
    assert.equal((await app.inject({method:'PUT',url,payload:base})).statusCode,428);
    const headers={'if-match':String(base.version)};
    assert.equal((await app.inject({method:'PUT',url,payload:base,headers})).statusCode,200);
    assert.equal((await app.inject({method:'PUT',url,payload:base,headers})).statusCode,409);
    store.persistProject=async()=>{throw Object.assign(Error('private path'),{code:'ENOSPC'});};
    const response=await app.inject({method:'PUT',url,payload:base,headers:{'if-match':String(store.getProject().version)}});
    assert.equal(response.statusCode,500);assert.doesNotMatch(response.body,/private path/);
  }finally{await app.close();}
}));
test('P1: disk failure and current-file failure preserve old memory and named disk state; queue recovers',()=>withStore(async(store)=>{
  const old=structuredClone(store.getProject()),write=store.writeJsonAtomically.bind(store);
  store.writeJsonAtomically=async(file,value)=>{if(file===store.currentProjectPath())throw Object.assign(Error('disk denied'),{code:'EACCES'});return write(file,value);};
  await assert.rejects(store.saveProject({...old,name:'lost'}),{code:'EACCES'});
  assert.deepEqual(store.getProject(),old);
  assert.deepEqual(JSON.parse(await readFile(store.projectPath(old.id),'utf8')),JSON.parse(JSON.stringify(old)));
  store.writeJsonAtomically=write;assert.equal((await store.saveProject({...old,name:'recovered'})).name,'recovered');
}));
test('P1: delayed acknowledgements preserve newer edits, including undo identity changes, while advancing base revision',()=>{
  const original={id:'p',version:4,name:'A'},session=createProjectSaveSession(original);
  const ticket={projectId:'p',generation:0,snapshot:original};
  const edited={...original,name:'B'};
  const result=finishProjectSave(session,ticket,edited,{...original,version:5});
  assert.equal(result.dirty,true);assert.equal(result.project.name,'B');assert.equal(result.project.version,5);assert.equal(session.baseVersion,5);
  const next=finishProjectSave(session,{projectId:'p',generation:0,snapshot:result.project},result.project,{...result.project,version:6});
  assert.equal(next.dirty,false);assert.equal(next.project.version,6);
  assert.equal(finishProjectSave(session,{projectId:'other'},edited,original).project,edited);
});
test('P1: actual editor request sends the captured base revision and preserves conflict/maintenance errors',async()=>{
  const project={id:'home',version:9};let sent;
  const saved=await saveProjectRequest(project,{expectedVersion:8,fetchImpl:async(url,options)=>{sent={url,options};return {ok:true,json:async()=>({project:{...project,version:9}})};}});
  assert.equal(sent.options.headers['If-Match'],'8');assert.equal(sent.options.method,'PUT');assert.equal(sent.url,'./api/projects/home');assert.equal(saved.version,9);
  for(const status of [409,423,428])await assert.rejects(saveProjectRequest(project,{fetchImpl:async()=>({ok:false,status,json:async()=>({error:'retain draft'})})}),{statusCode:status,message:'retain draft'});
});
test('P1: HTTP rejects foreign and null origins before handler; same-origin and configured access token work',async()=>{
  const app=Fastify(),policy=createAccessPolicy({token:'test-access',allowedOrigins:['https://home.example']});let calls=0;
  registerAccessPolicy(app,policy);app.get('/api/status',async()=>({ok:true}));app.post('/api/action',async()=>{calls++;return {};});
  try{
    for(const origin of ['https://foreign.example','null'])assert.equal((await app.inject({url:'/api/action',method:'POST',headers:{origin,authorization:'Bearer test-access','content-type':'application/json'},payload:{}})).statusCode,403);
    assert.equal(calls,0);
    assert.equal((await app.inject({url:'/api/status'})).statusCode,401);
    assert.equal((await app.inject({url:'/api/status',headers:{host:'local',origin:'http://local',authorization:'Bearer test-access'}})).statusCode,200);
    assert.equal((await app.inject({url:'/api/status',headers:{host:'172.30.33.1:8099',origin:'https://ha.example','sec-fetch-site':'same-origin',authorization:'Bearer test-access'}})).statusCode,200,'Ingress rewritten Host preserves browser-controlled same-origin metadata');
    assert.equal((await app.inject({url:'/api/status',headers:{host:'local',origin:'https://foreign.example','sec-fetch-site':'same-site','x-forwarded-host':'foreign.example',authorization:'Bearer test-access'}})).statusCode,403);
    assert.equal((await app.inject({url:'/api/status',headers:{host:'local',origin:'https://home.example',authorization:'Basic '+Buffer.from('user:test-access').toString('base64')}})).statusCode,200);
  }finally{await app.close();}
});
test('P1: WebSocket uses the same origin and authentication policy',async()=>{
  const app=Fastify(),policy=createAccessPolicy({token:'ws-access'});
  const wss=new WebSocketServer({server:app.server,verifyClient:(info,done)=>{const e=policy.authorize(info.req);done(!e,e?.status,e?.message);}});
  await app.listen({host:'127.0.0.1',port:0});const address=app.server.address(),url='ws://127.0.0.1:'+address.port;
  const open=headers=>new Promise(resolve=>{const socket=new WebSocket(url,{headers});socket.on('open',()=>{socket.close();resolve(101);});socket.on('unexpected-response',(_,r)=>{r.resume();resolve(r.statusCode);});socket.on('error',()=>{});});
  try{
    assert.equal(await open({origin:'https://foreign.example',authorization:'Bearer ws-access'}),403);
    assert.equal(await open({}),401);
    assert.equal(await open({origin:'http://127.0.0.1:'+address.port,authorization:'Bearer ws-access'}),101);
  }finally{await new Promise(resolve=>wss.close(resolve));await app.close();}
});
test('P2: restore drains in-flight HTTP and WebSocket work and blocks new writes until completion, including failure',async()=>{
  const gate=createInstanceWriteGate(),app=Fastify();registerInstanceWriteGate(app,gate);
  app.put('/api/project',async()=>({ok:true}));let finish;
  const active=gate.shared(()=>new Promise(resolve=>finish=resolve));let restored=false;
  const restore=gate.exclusive(async()=>{restored=true;assert.equal((await app.inject({url:'/api/project',method:'PUT'})).statusCode,423);throw Error('restore failure');});
  const rejection=assert.rejects(restore,/restore failure/);
  assert.equal(restored,false);await assert.rejects(gate.shared(()=>{}),{statusCode:423});
  finish();await active;await rejection;
  assert.equal((await app.inject({url:'/api/project',method:'PUT'})).statusCode,200);await app.close();
});
test('P2: all project floors and page overrides participate in live subscriptions and removal shrinks the set',()=>{
  const project={id:'p',floors:[{id:'f1',devices:[],rooms:[]},{id:'f2',devices:[],rooms:[]}]};
  const sidebars=new SidebarStore('/unused',{}),key=sidebars.floorKey(project,'f2');
  const config={widgets:[{id:'w',entityIds:['sensor.f2']}],pages:[{items:[{widgetId:'w',entityIds:['sensor.override']}]}]};
  sidebars.state[key]={draft:config,published:{widgets:[],pages:[]}};
  const projects={listProjects:()=>[{id:'p'}],getProject:()=>project};
  let ids=collectInstanceLiveEntityIds(projects,sidebars,[],[]);
  assert.ok(ids.has('sensor.f2'));assert.ok(ids.has('sensor.override'));
  sidebars.state[key].draft={widgets:[],pages:[]};ids=collectInstanceLiveEntityIds(projects,sidebars,[],[]);assert.equal(ids.has('sensor.f2'),false);
});
test('P2: model preflight rejects external dependencies, excessive geometry and oversized texture headers before decoding',()=>{
  const model={asset:{version:'2.0'},buffers:[],nodes:[],meshes:[]};
  assert.equal(inspectModelBudget(JSON.stringify(model)).vertices,0);
  assert.throws(()=>inspectModelBudget(JSON.stringify({...model,buffers:[{byteLength:4,uri:'https://slow.invalid/file'}]})),/外部/);
  assert.throws(()=>inspectModelBudget(JSON.stringify({...model,meshes:[{primitives:[{attributes:{POSITION:0}}]}],accessors:[{count:1000001}]})),/顶点|访问器/);
  const png=new Uint8Array(24),view=new DataView(png.buffer);view.setUint32(0,0x89504e47);view.setUint32(16,8192);view.setUint32(20,8192);
  assert.deepEqual(imageSize(png),[8192,8192]);
  assert.throws(()=>inspectModelBudget(JSON.stringify({...model,images:[{uri:'data:image/png;base64,'+Buffer.from(png).toString('base64')}]})),/像素/);
});
test('P2: cancellation terminates a genuinely stuck decoder and frees the serial slot for the next model',async()=>{
  const signal=new AbortController();let terminations=0,started;
  const ready=new Promise(resolve=>started=resolve);
  const loading=loadModelAsset({name:'model.glb',arrayBuffer:async()=>new ArrayBuffer(8)},{signal:signal.signal,decode:(data,{signal})=>runModelWorker(data,{signal,workerFactory:()=>({postMessage(){started();},terminate(){terminations++;}})})});
  const rejected=assert.rejects(loading,{name:'AbortError'});await ready;signal.abort();await rejected;
  assert.equal(terminations,1);assert.equal(modelLoadQueue.status().active,0);
  await loadModelAsset({name:'next.gltf',text:async()=>JSON.stringify({asset:{version:'2.0'}})},{decode:async()=>({scene:{}})}).catch(e=>assert.fail(e));
  assert.equal(modelLoadQueue.status().active,0);
});
test('P2: timeout terminates decoder even when it never produces a result',async()=>{
  let terminations=0;
  await assert.rejects(loadModelAsset({arrayBuffer:async()=>new ArrayBuffer(8)},{timeoutMs:5,decode:(data,{signal})=>runModelWorker(data,{signal,workerFactory:()=>({postMessage(){},terminate(){terminations++;}})})}),{name:'TimeoutError'});
  assert.equal(terminations,1);assert.equal(modelLoadQueue.status().active,0);
});

test('P2: real decoder worker round-trip preserves hierarchy, geometry and part transforms',async()=>{
  const data=new Float32Array([0,0,0,1,0,0,0,1,0]);
  const json={asset:{version:'2.0'},buffers:[{byteLength:36,uri:'data:application/octet-stream;base64,'+Buffer.from(data.buffer).toString('base64')}],bufferViews:[{buffer:0,byteLength:36}],accessors:[{bufferView:0,componentType:5126,count:3,type:'VEC3',min:[0,0,0],max:[1,1,0]}],meshes:[{primitives:[{attributes:{POSITION:0}}]}],nodes:[{name:'车门',mesh:0,translation:[1,2,3]}],scenes:[{nodes:[0]}],scene:0};
  const url=new URL('../apps/web/src/domain/model-decode-worker.js',import.meta.url).href;
  const wrapper=`import {parentPort} from 'node:worker_threads';globalThis.self={postMessage:(...args)=>parentPort.postMessage(...args)};globalThis.ProgressEvent=class{constructor(type,values){Object.assign(this,values);}};await import(${JSON.stringify(url)});parentPort.on('message',data=>self.onmessage({data}));`;
  const packet=await runModelWorker(JSON.stringify(json),{workerFactory:()=>{
    const worker=new NodeWorker(new URL('data:text/javascript,'+encodeURIComponent(wrapper)));
    const bridge={postMessage:(...args)=>worker.postMessage(...args),terminate:()=>worker.terminate()};
    worker.on('message',data=>bridge.onmessage?.({data}));worker.on('error',error=>bridge.onerror?.(error));return bridge;
  }});
  const loaded=hydrateModelPacket(packet),part=loaded.scene.getObjectByName('车门');
  assert.ok(part);assert.deepEqual(part.position.toArray(),[1,2,3]);assert.equal(part.geometry.attributes.position.count,3);
  part.geometry.dispose();part.material.dispose();
});
test('P2: transferable bitmap textures retain material color, source sharing and exact dimensions across hydration',()=>{
  const Previous=globalThis.ImageBitmap;
  class Bitmap {constructor(){this.width=16;this.height=8;this.closed=0;}close(){this.closed++;}}
  globalThis.ImageBitmap=Bitmap;
  try{
    const image=new Bitmap(),texture=new THREE.Texture(image),material=new THREE.MeshStandardMaterial({map:texture,color:0x336699});
    const scene=new THREE.Group(),geometry=new THREE.BoxGeometry();scene.add(new THREE.Mesh(geometry,material),new THREE.Mesh(geometry,material));
    const packet=serializeModelScene(scene);assert.equal(packet.bitmaps.length,1);
    const result=hydrateModelPacket(packet);const a=result.scene.children[0],b=result.scene.children[1];
    assert.equal(a.material.map.image,image);assert.equal(b.material.map.image,image);assert.equal(a.material.map.isDataTexture,false);
    assert.equal(a.material.color.getHex(),0x336699);assert.equal(image.closed,0);
    geometry.dispose();material.dispose();texture.dispose();a.geometry.dispose();a.material.dispose();a.material.map.dispose();image.close();
  }finally{globalThis.ImageBitmap=Previous;}
});
