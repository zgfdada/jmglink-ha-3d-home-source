import {browserSyncBackground} from './model-sync-background.js';

export async function syncPortableLibrary(getPlan, upload, context){
  const plan=await getPlan(context.type);
  if(context.expectedOwner&&context.expectedOwner!==plan.owner){
    throw Error('请登录原账号 '+context.expectedOwner+' 后继续同步');
  }
  context.onOwner?.(plan.owner);
  const failures=plan.errors.map(item=>item.name+'：'+item.error);
  for(const item of plan.items){
    try{
      await upload(item,plan.owner);
    }catch(error){
      failures.push(item.name+'：'+error.message);
    }
  }
  if(failures.length)throw Error(failures.join('；'));
}

export const portableLibrarySync=browserSyncBackground('ha3d.portable-sync.pending.v1',async()=>{
  const {getPortableSyncPlan,uploadPlannedResource}=await import('./portable-upload.jsx');
  return (_progress,context)=>syncPortableLibrary(getPortableSyncPlan,uploadPlannedResource,context);
});
