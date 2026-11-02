import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {saveProjectRequest} from '../apps/web/src/domain/project-save-request.js';

test('real server composes access policy, CAS saves, backup gate and post-restore stale-client rejection without HA access',async()=>{
  const directory=await mkdtemp(path.join(tmpdir(),'ha3d-runtime-hardening-'));
  const child=spawn(process.execPath,[fileURLToPath(new URL('../apps/server/src/main.js',import.meta.url))],{
    cwd:directory,
    env:{...process.env,PORT:'0',HA3D_MODE:'standalone',HA3D_DATA_DIR:path.join(directory,'data'),HA3D_ASSET_DIR:path.join(directory,'assets'),HA_TOKEN:'',SUPERVISOR_TOKEN:'',HA3D_ACCESS_TOKEN:'runtime-test-token',HA3D_ALLOWED_ORIGINS:'',LOG_LEVEL:'info',HA3D_RESOURCE_LOG_INTERVAL_MINUTES:'0'},
    stdio:['ignore','pipe','pipe'],windowsHide:true,
  });
  const exited=once(child,'exit');let logs='';
  try{
    const base=await new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>reject(Error('isolated server startup timed out')),10000);
      const read=chunk=>{logs+=chunk.toString();const match=logs.match(/HA 3D Home server running at http:\/\/[^:\s"]+:(\d+)/);if(match){clearTimeout(timer);resolve('http://127.0.0.1:'+match[1]);}};
      child.stdout.on('data',read);child.stderr.on('data',read);child.once('exit',()=>{clearTimeout(timer);reject(Error('isolated server exited before ready'));});
    });
    const headers={Authorization:'Bearer runtime-test-token','Content-Type':'application/json'};
    assert.equal((await fetch(base+'/api/health')).status,200);
    assert.equal((await fetch(base+'/api/projects/current')).status,401);
    assert.equal((await fetch(base+'/api/ha/status',{headers:{...headers,Origin:'https://foreign.invalid'}})).status,403);
    const status=await (await fetch(base+'/api/ha/status',{headers})).json();assert.equal(status.configured,false);
    const list=await (await fetch(base+'/api/projects',{headers})).json();
    const url=base+'/api/projects/'+list.projects[0].id;
    const initial=(await (await fetch(url,{headers})).json()).project;
    const saveHeaders={...headers,'If-Match':String(initial.version)};
    const result=await saveProjectRequest({...initial,name:'isolated saved project'},{expectedVersion:initial.version,fetchImpl:(relative,options)=>fetch(new URL(relative,base+'/'),{...options,headers:{...options.headers,Authorization:headers.Authorization}})});
    assert.equal(result.version,initial.version+1);
    assert.equal((await fetch(url,{method:'PUT',headers:saveHeaders,body:JSON.stringify(initial)})).status,409);
    const backup=await (await fetch(base+'/api/instance-backup',{headers})).json();
    const saved=(await (await fetch(url,{headers})).json()).project;
    const restore=await fetch(base+'/api/instance-backup',{method:'POST',headers,body:JSON.stringify({confirm:true,backup})});
    assert.equal(restore.status,200,await restore.text());
    assert.equal((await fetch(url,{method:'PUT',headers:{...headers,'If-Match':String(saved.version)},body:JSON.stringify(saved)})).status,409);
  }finally{
    child.kill();await exited;await rm(directory,{recursive:true,force:true});
  }
});
