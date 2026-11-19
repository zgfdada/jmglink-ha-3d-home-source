import {generateWidgetThumbnail} from './widget-thumbnail.jsx';
async function api(url,body){
  const response=await fetch(url,body===undefined?{cache:'no-store'}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  const result=await response.json();if(!response.ok)throw Error(result.error||'侧栏同步暂未完成');return result;
}
export async function syncSidebarAfterSave(projectId,floorId,context={}){
  const status=await api('./api/resource-center/status');if(!status.configured)return;
  const owner=status.user?.username||(status.defaultUserEnabled?'desktop-default':null);
  if(context.expectedOwner&&owner!==context.expectedOwner)throw Error('请登录原账号 '+context.expectedOwner+' 后继续同步');
  context.onOwner?.(owner);
  const query=floorId?'?floorId='+encodeURIComponent(floorId):'';
  const saved=await api('./api/sidebar/'+encodeURIComponent(projectId)+query),widgets=[];
  for(const widget of saved.draft.widgets){
    if(widget.scriptMode==='dom'||widget.actions?.length)continue;
    const previewDataUrl=widget.resourceSharing?.previewMode==='manual'?widget.resourceSharing.previewDataUrl:await generateWidgetThumbnail(widget);
    if(!previewDataUrl)throw Error(widget.name+'：请先选择预览图');
    widgets.push({id:widget.id,sourceSnapshot:widget,previewDataUrl});
  }
  if(!widgets.length)return;
  const result=await api('./api/resource-center/sync-sidebar-library',{projectId,floorId,revision:saved.revision,widgets,expectedOwner:owner});
  const failed=result.items.filter(item=>item.error);if(failed.length)throw Error(failed.map(item=>item.name+'：'+item.error).join('；'));
}
