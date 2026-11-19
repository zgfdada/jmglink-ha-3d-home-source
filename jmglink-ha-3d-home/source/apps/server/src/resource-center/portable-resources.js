import {canonical,sha256,portableModel,portableControl,portablePanel,portableMotion,portableDeviceProject,validateModelBytes,fail} from '../../../../packages/resource-protocol/index.js';
export const ADDITIONAL_TYPES=['device-control','motion','device-project'];
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
