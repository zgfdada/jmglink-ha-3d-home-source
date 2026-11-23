import {canonical,sha256,portableModel,portableControl,portablePanel,portableMotion,portableDeviceProject,validateModelBytes,fail} from '../../../../packages/resource-protocol/index.js';
export const ADDITIONAL_TYPES=['device-control','motion','device-project'];
export function requireStandaloneResource(type, kind) {
  if (type === 'device-control' && kind === 'panel') {
    fail('控制面板随完整设备一起分享和安装', 422, 'panel_requires_device');
  }
}
export async function buildPortableSource(store,input){
 const platform=store.platform;let entry,assets=[],previewModel=null;
 if(input.type==='device-control'){
  if(input.sourceKind==='panel'){
   const panel=platform.getControlPanels().find(p=>p.id===input.sourceId);if(!panel)fail('控制面板不存在',404);
   const project=platform.getDeviceTemplates().find(p=>p.id===panel.deviceTemplateId);
   const previous=Object.values(store.installations).find(r=>r.localId===panel.id);
   entry=portablePanel(panel,project?.capabilities||previous?.portableCapabilities||[]);
  }else{const control=platform.controlLibrary?.list().find(c=>c.id===input.sourceId);if(!control)fail('控件不存在',404);entry=portableControl(control);}
 }else if(input.type==='motion'){
  const motion=platform.motionLibrary?.list().find(m=>m.id===input.sourceId);if(!motion)fail('动效不存在',404);entry=portableMotion(motion);
 }else if(input.type==='device-project'){
  const bundle=await platform.exportProjectPackage(input.sourceId);let model=null;
  if(bundle.model){let asset=null;if(bundle.model.source?.type==='upload'){
   if(!bundle.asset?.dataBase64)fail('设备包模型文件缺失');const bytes=Buffer.from(bundle.asset.dataBase64,'base64'),mediaType=bundle.asset.mimeType;validateModelBytes(bytes,mediaType);asset={path:mediaType==='model/gltf+json'?'model.gltf':'model.glb',bytes,mediaType};assets.push(asset);
  }model=portableModel(bundle.model,asset?.path||null);
   const local=platform.getModelTemplates().find(m=>m.id===bundle.project.modelTemplateId);previewModel=local?{...local,...bundle.project.appearance,projectAppearance:true}:null;
  }
  entry=portableDeviceProject(bundle,model);
 }else fail('不支持的资源类型');
 const signature=sha256(canonical({entry,assets:assets.map(a=>({path:a.path,sha256:sha256(a.bytes)}))}));return {entry,assets,signature,previewModel};
}
export function portableSourceKey(input){return sha256(canonical([input.type,input.sourceId,input.sourceKind||'']));}

export function portableSyncSources(store, type) {
  const {platform} = store;
  const installations = Object.values(store.installations);
  const sources = [];
  function add(type, records, sourceKind) {
    const installed = new Set(installations.filter(i =>
      i.type === type && (!i.sourceKind || i.sourceKind === sourceKind)
    ).map(i => i.localId));
    for (const item of records) {
      if (item.builtin || item.id.startsWith('builtin.') || installed.has(item.id)) continue;
      sources.push({type, sourceId:item.id, name:item.name, ...(sourceKind ? {sourceKind} : {})});
    }
  }
  if (!type || type === 'device-project') add('device-project', platform.getDeviceTemplates());
  if (!type || type === 'device-control') {
    add('device-control', platform.controlLibrary?.list() || [], 'control');
  }
  if (!type || type === 'motion') add('motion', platform.motionLibrary?.list() || []);
  return sources;
}

// Queues from earlier clients already contain the portable JSON and asset hashes in their manifests.
export function samePortableSnapshot(job, source) {
  if (!job || job.state === 'superseded') return false;
  if (job.sourceSignature) return job.sourceSignature === source.signature;
  const {entry, files} = job.manifest;
  if (files.find(f => f.path === entry)?.sha256 !== sha256(canonical(source.entry))) return false;
  const assets = files.filter(f => f.mediaType.startsWith('model/'));
  return assets.length === source.assets.length && source.assets.every(asset =>
    assets.some(f => f.path === asset.path && f.sha256 === sha256(asset.bytes))
  );
}
