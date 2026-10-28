// Runs against the actual runtime image; no HA credentials, TG or devices.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
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
  const code=await(await fetch(asset)).text();
  assert.ok(code.length>10000);assert.ok(!code.includes('sourceMappingURL='));
  for(const name of ['ha3d-ha-assistant','ha3d-hermes-telegram']) {
    // Validate the deployed skill archive implementation against its real paths.
    const {createSkillArchive}=await import('./apps/server/src/voice-assistant/SkillPackages.js');
    assert.equal((await createSkillArchive(name)).readUInt32LE(0),0x04034b50);
  }
  const manifest=JSON.parse(await readFile('release-manifest.json','utf8'));
  assert.equal(manifest.obfuscated,true);
  assert.ok(!manifest.files.some(f=>/(concept|tutorials)/.test(f.path)));
  assert.equal((await(await fetch(base+'/api/control-library')).json()).controls.filter(c=>c.builtin).length,12);
  const {access}=await import('node:fs/promises');
  await assert.rejects(access('apps/web/dist/concept'));
  await assert.rejects(access('apps/web/dist/tutorials'));
  console.log(JSON.stringify({obfuscatedHttpSmoke:'passed',standalone:true,projects:true,staticAssets:true,skills:true}));
}finally{
  if(!exited){child.kill('SIGTERM');await new Promise(resolve=>child.once('exit',resolve));}
  await rm(dir,{recursive:true,force:true});
}
