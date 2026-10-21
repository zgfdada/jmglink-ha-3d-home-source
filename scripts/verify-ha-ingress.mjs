import fs from "node:fs/promises";
import { pathToFileURL, fileURLToPath } from "node:url";
import path from "node:path";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { default: WebSocket }=await import(pathToFileURL(root+"/jmglink-ha-3d-home/source/node_modules/ws/wrapper.mjs"));
const { callVoiceAssistant }=await import(pathToFileURL(root+"/jmglink-ha-3d-home/source/apps/web/src/domain/voice-assistant-api.js"));
const config=JSON.parse(await fs.readFile(process.env.HA3D_TEST_HA_CONFIG || root+"/docker-runtime-source/data/ha-connection.json","utf8"));
const ws=new WebSocket(config.websocketUrl);
const pending=new Map(); let nextId=0;
let authResolve,authReject;
const authenticated=new Promise((resolve,reject)=>{authResolve=resolve;authReject=reject;});
const timeout=setTimeout(()=>authReject(new Error("HA WebSocket authentication timeout")),15000);
ws.on("message",(raw)=>{
 const message=JSON.parse(raw.toString());
 if(message.type==="auth_required") ws.send(JSON.stringify({type:"auth",access_token:config.token}));
 if(message.type==="auth_ok") {clearTimeout(timeout);authResolve();}
 if(message.type==="auth_invalid") authReject(new Error("HA saved authentication rejected"));
 if(message.type==="result") { const p=pending.get(message.id);if(p) {pending.delete(message.id); message.success?p.resolve(message.result?.data??message.result):p.reject(new Error("Supervisor API request rejected: "+(message.error?.code??"unknown")));} }
});
ws.on("error",()=>authReject(new Error("HA WebSocket connection failed")));
const rpc=(endpoint,method="get")=>new Promise((resolve,reject)=>{const id=++nextId;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,type:"supervisor/api",endpoint,method}));});
try {
 await authenticated;
 const slug=process.env.HA3D_TEST_ADDON_SLUG || "70469846_jmglink_ha_3d_home_custom";
 const addon=await rpc("/addons/"+encodeURIComponent(slug)+"/info");
 const session=await rpc("/ingress/session","post");
 const base=config.restUrl.replace(/\/api\/?$/,"");
 const entry=addon.ingress_entry || addon.ingress_url;
 if(typeof entry!=="string" || !session.session) throw new Error("Supervisor did not return an ingress entry/session");
 const ingress=new URL(entry,base);
 if(ingress.origin!==new URL(base).origin || !ingress.pathname.startsWith("/api/hassio_ingress/")) throw new Error("Unexpected ingress origin/path");
 const prefix=ingress.href.replace(/\/+$/,"")+"/";
 const cookie="ingress_session="+session.session;
 const original=await fetch(prefix+"api/voice-assistant/test",{method:"POST",headers:{Cookie:cookie},signal:AbortSignal.timeout(30000)});
 const originalStatus=original.status;await original.text();
 let fixedStatus;
 const result=await callVoiceAssistant("test",{method:"POST"},async(relative,options)=>{
  const response=await fetch(prefix+relative.replace(/^\.\//,""),{...options,headers:{...options.headers,Cookie:cookie},signal:AbortSignal.timeout(30000)});
  fixedStatus=response.status;return response;
 });
 const terminals=[];
 // Each terminal has its own valid HA Ingress session. Include the browser's
 // real Origin/Fetch Metadata; a cookie-only request missed this regression.
 for(const origin of (process.env.HA3D_TEST_ORIGINS || new URL(base).origin).split(",")) {
  const terminal=await rpc("/ingress/session","post");
  const response=await fetch(prefix+"api/voice-assistant/test",{method:"POST",headers:{
   Cookie:"ingress_session="+terminal.session,Origin:new URL(origin.trim()).origin,
   "Sec-Fetch-Site":"same-origin","Content-Type":"application/json",
  },body:"{}",signal:AbortSignal.timeout(30000)});
  const data=await response.json().catch(()=>({}));
  terminals.push({status:response.status,gatewayAuthenticated:data.ok===true});
 }
 const cross=await fetch(prefix+"api/voice-assistant/test",{method:"POST",headers:{Cookie:cookie,
  Origin:"https://untrusted.invalid","Sec-Fetch-Site":"cross-site","Content-Type":"application/json",
 },body:"{}",signal:AbortSignal.timeout(30000)});
 await cross.text();
 console.log(JSON.stringify({addonVersion:addon.version,originalEmptyPostStatus:originalStatus,fixedJsonPostStatus:fixedStatus,gatewayAuthenticated:result.ok===true,actualHAIngress:true,noDeviceActions:true}));
 console.log(JSON.stringify({independentTerminalSessions:terminals,crossSiteStatus:cross.status}));
 if(fixedStatus!==200 || !result.ok || terminals.some(t=>t.status!==200 || !t.gatewayAuthenticated) || cross.status!==403) process.exitCode=1;
} catch(error) {console.error(error.message);process.exitCode=1;} finally {clearTimeout(timeout);ws.close();}
