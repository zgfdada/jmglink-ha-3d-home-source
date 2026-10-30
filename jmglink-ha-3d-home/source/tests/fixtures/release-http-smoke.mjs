// Runs against the actual runtime image; no HA credentials, TG or devices.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import vm from 'node:vm';
const dir=await mkdtemp('/tmp/ha3d-release-');
const child=spawn(process.execPath,['apps/server/src/main.js'],{env:{...process.env,
  HA3D_MODE:'standalone',PORT:'18124',HA3D_DATA_DIR:dir+'/data',HA3D_ASSET_DIR:dir+'/assets',
},stdio:['ignore','ignore','ignore']});
let exited=false; child.on('exit',()=>{exited=true;});
const base='http://127.0.0.1:18124';
try {
  let ready=false;
  for(let i=0;i<100&&!exited;i++) {
    try{ready=(await fetch(base+'/api/health')).ok;}catch{}
    if(ready)break;
    await new Promise(resolve=>setTimeout(resolve,100));
  }
  assert.ok(ready,'Obfuscated standalone runtime must start');
  for(const route of ['/api/health','/api/projects','/api/voice-assistant/config','/'])
    assert.equal((await fetch(base+route)).status,200,route);
  const html=await(await fetch(base+'/')).text();
  const script=html.match(/<script[^>]+src="([^"]+)"/)[1];
  const asset=new URL(script,base+'/');
  const manifest=JSON.parse(await readFile('release-manifest.json','utf8'));
  const modules=new Set(),queue=[asset];
  while(queue.length) {
    const url=queue.shift();
    if(modules.has(url.href))continue;
    modules.add(url.href);
    const response=await fetch(url);
    assert.equal(response.status,200,url.pathname);
    assert.match(response.headers.get('content-type'),/javascript/);
    const code=await response.text();
    assert.ok(code.trim().length>0);assert.ok(!code.includes('sourceMappingURL='));
    const entry=manifest.files.find(file=>file.path==='apps/web/dist'+url.pathname);
    assert.ok(entry,'Every served JS module must belong to the release manifest');
    assert.equal(createHash('sha256').update(code).digest('hex'),entry.sha256);
    for(const match of code.matchAll(/(?:\bfrom\s*|\bimport\s*(?:\(\s*)?)["']([^"']+)["']/g)) {
      if(match[1].startsWith('.')&&match[1].endsWith('.js'))queue.push(new URL(match[1],url));
    }
  }
  assert.ok(modules.size>1,'Bootstrap must resolve its application dependencies');
  const workerResponse=await fetch(base+'/api/motion-runtime-worker.js');
  assert.equal(workerResponse.status,200);
  assert.match(workerResponse.headers.get('content-security-policy'),/connect-src 'none'/);
  const replies=[],self={postMessage:message=>replies.push(message)};
  vm.runInNewContext(await workerResponse.text(),{self,Map,Function},{timeout:1000});
  self.onmessage({data:{type:'compile',code:'function update(ctx){return {value:ctx.value};}'}});
  self.onmessage({data:{type:'sample',id:1,context:{value:2}}});
  assert.equal(replies.at(-1).type,'result');
  assert.equal(replies.at(-1).result.value,2);
  for(const name of ['ha3d-ha-assistant','ha3d-hermes-telegram']) {
    // Validate the deployed skill archive implementation against its real paths.
    const {createSkillArchive}=await import('./apps/server/src/voice-assistant/SkillPackages.js');
    assert.equal((await createSkillArchive(name)).readUInt32LE(0),0x04034b50);
  }
  assert.equal(manifest.obfuscated,true);
  assert.ok(!manifest.files.some(f=>/(concept|tutorials)/.test(f.path)));
  assert.equal((await(await fetch(base+'/api/control-library')).json()).controls.filter(c=>c.builtin).length,12);
  const {access}=await import('node:fs/promises');
  await assert.rejects(access('apps/web/dist/concept'));
  await assert.rejects(access('apps/web/dist/tutorials'));
  console.log(JSON.stringify({obfuscatedHttpSmoke:'passed',standalone:true,projects:true,staticAssets:true,modules:modules.size,motionWorker:true,skills:true}));
}finally{
  if(!exited){child.kill('SIGTERM');await new Promise(resolve=>child.once('exit',resolve));}
  await rm(dir,{recursive:true,force:true});
}
