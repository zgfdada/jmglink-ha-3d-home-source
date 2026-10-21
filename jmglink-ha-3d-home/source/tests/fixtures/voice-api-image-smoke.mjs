// Executed inside the actual runtime image, with no credentials or devices.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import Fastify from "fastify";
import { VoiceAssistant, registerVoiceAssistantRoutes } from "./apps/server/src/voice-assistant/VoiceAssistant.js";
import { sendVoiceMessage } from "./apps/server/resources/agent-skills/ha3d-ha-assistant/references/voice-interaction.js";
import { callVoiceAssistant } from "./apps/server/resources/agent-skills/ha3d-ha-assistant/references/voice-assistant-api.js";
import { createSkillArchive } from "./apps/server/src/voice-assistant/SkillPackages.js";

const reference=(await readFile("apps/server/resources/agent-skills/ha3d-ha-assistant/references/voice-assistant-api.js", "utf8")).replace(/\r\n/g,"\n");
const releaseManifest=await readFile('release-manifest.json','utf8').then(JSON.parse).catch(error=>{if(error.code==='ENOENT')return null;throw error;});
if(releaseManifest){
  assert.equal(releaseManifest.obfuscated,true);assert.equal(releaseManifest.sourceMaps,false);
  assert.ok(releaseManifest.files.some(f=>f.path.startsWith('apps/server/src/')));
  assert.ok(releaseManifest.files.some(f=>f.path.startsWith('packages/schema/src/')));
  assert.ok(releaseManifest.files.some(f=>f.path.startsWith('apps/web/dist/')));
  for(const file of releaseManifest.files) assert.equal(createHash('sha256').update(await readFile(file.path)).digest('hex'),file.sha256);
  assert.ok(!(await readdir('apps/web/dist/assets')).some(name=>name.endsWith('.map')));
}
let servedSource;
for (const file of await readdir("apps/web/dist/assets")) {
  if (!file.endsWith(".js.map")) continue;
  const map=JSON.parse(await readFile("apps/web/dist/assets/"+file,"utf8"));
  const index=map.sources?.findIndex((name)=>name.endsWith("/domain/voice-assistant-api.js"));
  if (index>=0) { servedSource=map.sourcesContent[index].replace(/\r\n/g,"\n"); break; }
}
if(!releaseManifest)assert.equal(servedSource,reference,"Published frontend must include the same repaired request helper");
let interactionSource;
for (const file of await readdir("apps/web/dist/assets")) {
  if (!file.endsWith(".js.map")) continue;
  const map=JSON.parse(await readFile("apps/web/dist/assets/"+file,"utf8"));
  const index=map.sources?.findIndex((name)=>name.endsWith("/domain/voice-interaction.js"));
  if(index>=0) {interactionSource=map.sourcesContent[index].replace(/\r\n/g,"\n");break;}
}
if(!releaseManifest)assert.equal(interactionSource,(await readFile("apps/server/resources/agent-skills/ha3d-ha-assistant/references/voice-interaction.js","utf8")).replace(/\r\n/g,"\n"));
const app=Fastify();let calls=0;
await registerVoiceAssistantRoutes(app,{async testConnection(){calls++;return {ok:true};}});
try {
  const old=await app.inject({method:"POST",url:"/api/voice-assistant/test",headers:{"content-type":"application/octet-stream"},payload:""});
  assert.equal(old.statusCode,415);assert.equal(calls,0);
  const result=await callVoiceAssistant("test",{method:"POST"},async(url,options)=>{
    const response=await app.inject({method:options.method,url:url.slice(1),headers:{"content-type":"application/octet-stream",...options.headers},payload:options.body});
    assert.equal(response.statusCode,200);
    return new Response(response.body,{status:response.statusCode});
  });
  assert.equal(result.ok,true);assert.equal(calls,1);
  for(const origin of ["https://terminal-one.test","https://terminal-two.test"]) {
    const response=await app.inject({method:"POST",url:"/api/voice-assistant/test",headers:{host:"internal:8099",origin,"sec-fetch-site":"same-origin","content-type":"application/json"},payload:"{}"});
    assert.equal(response.statusCode,200,"Ingress host rewriting must not tie voice access to one terminal");
  }
  const cross=await app.inject({method:"POST",url:"/api/voice-assistant/test",headers:{origin:"https://untrusted.invalid","sec-fetch-site":"cross-site","content-type":"application/json"},payload:"{}"});
  assert.equal(cross.statusCode,403);
  const asyncApp=Fastify(); let finish,executions=0,polls=0,starts=0;
  const assistant=new VoiceAssistant("unused",{provider:"ha"},{processConversation:async()=>{
    executions++;return new Promise(resolve=>{finish=resolve;});
  }});
  await registerVoiceAssistantRoutes(asyncApp,assistant);
  try {
    const reply=await sendVoiceMessage({text:"模拟慢回复",clientSessionId:"image_client_0123456789",requestId:"image_request_0123456789"},undefined,async(url,options)=>{
      if(url.endsWith("/start")) {
        starts++; const accepted=await asyncApp.inject({method:"POST",url:url.slice(1),payload:JSON.parse(options.body)});
        assert.equal(accepted.json().state,"accepted");return new Response("Bad Gateway",{status:502});
      }
      if(++polls===1) return new Response("Bad Gateway",{status:502});
      if(polls===3) {finish({speech:"模拟最终回复"});await new Promise(setImmediate);}
      const response=await asyncApp.inject({method:"POST",url:url.slice(1),payload:JSON.parse(options.body)});
      return new Response(response.body,{status:response.statusCode});
    },1);
    assert.equal(reply,"模拟最终回复");assert.equal(starts,1);assert.equal(executions,1);
  }finally{await asyncApp.close();}
  for(const name of ["ha3d-ha-assistant","ha3d-hermes-telegram"]) assert.equal((await createSkillArchive(name)).readUInt32LE(0),0x04034b50);
  console.log(JSON.stringify({runtimeImageSmoke:"passed",servedFrontendMatchesFix:true,legacy415:true,fixedRequest200:true,asyncRecovery:true,skillsReady:true,noDeviceActions:true}));
} finally {await app.close();}
