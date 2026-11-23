import path from 'node:path';
import {canonical,sha256,validateEntry,validateModelBytes,fail} from '../../../../packages/resource-protocol/index.js';
import {buildPortableSource,requireStandaloneResource} from './portable-resources.js';
export async function installPortableResource(store,input,release){
 const manifest=release.manifest;if(manifest.dependencies.length)fail('此自包含资源不应携带外部依赖');
 const installationId=sha256(store.origin+'\n'+input.manifestSha256+'\n'),type=manifest.type;
 const localId=type==='motion'?'custom.motion.online-'+installationId.slice(0,24):type==='device-project'?'custom.import-'+installationId.slice(0,16):'custom.online-'+installationId.slice(0,24);
 const platform=store.platform,previous=store.installations[installationId];
 const exists=()=>type==='motion'?platform.motionLibrary?.list().find(r=>r.id===localId):type==='device-project'?platform.getDeviceTemplates().find(r=>r.id===localId):platform.controlLibrary?.list().find(r=>r.id===localId)||platform.getControlPanels().find(r=>r.id===localId);
 requireStandaloneResource(type,previous?.sourceKind);
 if(previous?.status==='installed'&&(type!=='device-control'||previous.sourceKind==='control')&&exists())return {...previous,alreadyInstalled:true,downloadedBytes:0};
 const files=new Map();let downloadedBytes=0;for(const file of manifest.files){const result=await store.getBlob(file,release.downloads);files.set(file.path,result.bytes);downloadedBytes+=result.downloaded;if(file.mediaType.startsWith('model/'))validateModelBytes(result.bytes,file.mediaType);}
 const entry=validateEntry(manifest,files.get(manifest.entry));
 requireStandaloneResource(type,entry.kind);
 const fingerprint=sha256(canonical({entry,assets:manifest.files.filter(f=>f.mediaType.startsWith('model/')).map(f=>({path:f.path,sha256:f.sha256}))}));
 if(exists()){
  if(!previous)fail('本地目标已存在，保留已有内容',409,'local_conflict');
  const actual=await buildPortableSource(store,{type,sourceId:localId,sourceKind:entry.kind});if(actual.signature!==fingerprint)fail('本地副本已被修改，保留修改',409,'local_conflict');
 }
 const record={installationId,origin:store.origin,resource:manifest.resource,version:manifest.version,manifestSha256:input.manifestSha256,type,localId,fingerprint,status:'pending',installedAt:store.clock(),...(entry.kind?{sourceKind:entry.kind}:{}),...(entry.capabilities?{portableCapabilities:entry.capabilities}:{})};store.installations[installationId]=record;await store.saveInstallations();
 if(!exists()){
  if(type==='motion'){if(!platform.motionLibrary)fail('动效库未初始化',503);await platform.motionLibrary.importOnline(entry.motion,localId);}
  else if(type==='device-control'){if(!platform.controlLibrary)fail('控件库未初始化',503);await platform.controlLibrary.create({...entry.control,id:localId,builtin:false});}
  else{
   const model=entry.model?.model;const asset=entry.model?.asset?{fileName:entry.model.asset,mimeType:manifest.files.find(f=>f.path===entry.model.asset).mediaType,dataBase64:files.get(entry.model.asset).toString('base64')}:null;
   await platform.importProjectPackage({format:'ha3d-device-project',schemaVersion:1,manifest:{allowFork:true,requiresHaRematch:true},project:entry.project,panel:entry.panel?.panel||null,model:model||null,asset},{namespace:installationId});
  }
 }
 record.status='installed';await store.saveInstallations();return {...record,downloadedBytes,requiresHaRematch:type==='device-project'};
}
