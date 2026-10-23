import { resolveSidebarEntities } from '../../../../packages/schema/src/sidebar-bindings.js';
import { normalizeWidgetActions } from '../../../../packages/schema/src/widget-actions.js';
import { resolveSidebarFloor } from '../../../../packages/schema/src/sidebar-floors.js';
const error=(message,statusCode=400)=>Object.assign(new Error(message),{statusCode});
export function flattenServiceCatalog(domains) {
 return domains.flatMap(domain=>Object.entries(domain.services||{}).map(([service,details])=>({domain:domain.domain,service,name:details.name||service,description:details.description||'',fields:details.fields||{},target:details.target||{}})));
}
export function validateSidebarService(body, {entities,config,catalog}) {
 const widget=config.widgets.find(w=>w.id===body.widgetId);
 if(!widget)throw error('控件不存在',404);
 let override={};
 if(body.itemId){const page=config.pages.find(p=>p.id===body.pageId);override=page?.items.find(i=>i.id===body.itemId);if(!override||override.widgetId!==widget.id)throw error('页面控件引用不匹配',403);}
 const actions=normalizeWidgetActions(widget.actions);
 const action=body.actionId ? actions.find(a=>a.id===body.actionId) : actions.find(a=>a.domain===body.domain&&a.service===body.service);
 if(!action)throw error('请先在控件开发中配置并保存此动作',403);
 if(!catalog.some(s=>s.domain===action.domain&&s.service===action.service))throw error('当前 HA 未提供此服务');
 const bound=resolveSidebarEntities(widget,override,entities).entities.map(e=>e.entityId);
 const target=body.entityId ? [body.entityId] : action.target==='all'?bound:action.target==='primary'?bound.slice(0,1):[action.target];
 if(!target.length||target.some(id=>!bound.includes(id)))throw error('操作目标必须是当前控件实际绑定的实体',403);
 const data={...action.data,...(body.data??{})};
 // Reuse the same generic parameter validation as saved action definitions.
 normalizeWidgetActions([{...action,data}]);
 if(body.data && (typeof body.data!=='object'||Array.isArray(body.data)))throw error('操作参数需要 JSON 对象');
 return {domain:action.domain,service:action.service,data:{...data,entity_id:target.length===1?target[0]:target}};
}
export function registerSidebarServices(app,ha,store,projects) {
 let cache=null,expires=0;
 async function catalog(){if(cache&&Date.now()<expires)return cache;const response=await fetch(ha.config.ha.restUrl+'/services',{headers:{Authorization:'Bearer '+ha.config.ha.token},signal:AbortSignal.timeout(10000)});if(!response.ok)throw error('读取 HA 服务目录失败',502);cache=flattenServiceCatalog(await response.json());expires=Date.now()+30000;return cache;}
 app.get('/api/sidebar-services/catalog',async()=>({services:await catalog()}));
 app.post('/api/sidebar-services/action',{bodyLimit:32768},async req=>{
    const site=req.headers['sec-fetch-site'];
    if((site && site!=='same-origin') || (req.headers.origin && !site && new URL(req.headers.origin).host!==req.headers.host))throw error('不允许跨站操作',403);
    if(!req.headers['content-type']?.startsWith('application/json'))throw error('需要 JSON',415);
    const body=req.body||{};
    const project=projects.getProject(body.projectId);
    if(!project)throw error('项目不存在',404);
    resolveSidebarFloor(project,body.floorId);
    if(!['draft','published'].includes(body.workspace))throw error('必须指定草稿或发布版本');
    const config=store.get(store.floorKey ? store.floorKey(project,body.floorId) : body.projectId)[body.workspace];
    const action=validateSidebarService(body,{entities:ha.getEntities(),config,catalog:await catalog()});
    const response=await fetch(`${ha.config.ha.restUrl}/services/${action.domain}/${action.service}`,{method:'POST',headers:{Authorization:`Bearer ${ha.config.ha.token}`,'Content-Type':'application/json'},body:JSON.stringify(action.data),signal:AbortSignal.timeout(15000)});
    if(!response.ok)throw error(`HA 操作失败（${response.status}），请检查服务参数与实体能力`,502);
    return {ok:true};
 });
  app.get('/api/sidebar-services/picture/:entityId',async(req,reply)=>{
    const entity=ha.getEntities().find(e=>e.entityId===req.params.entityId);
    const picture=entity?.attributes?.entity_picture;
    if(!entity || !picture)return reply.code(404).send();
    const base=new URL(ha.config.ha.restUrl);const url=new URL(picture,base.origin);
    if(url.origin!==base.origin || !/^\/(api|local)\//.test(url.pathname))return reply.code(403).send();
    // Supervisor exposes HA below /core; preserve that prefix for image paths.
    const prefix=base.pathname.replace(/\/api\/?$/,"").replace(/\/$/,"");
    url.pathname=prefix+url.pathname;
    const response=await fetch(url,{headers:{Authorization:`Bearer ${ha.config.ha.token}`},signal:AbortSignal.timeout(10000),redirect:'error'});
    if(!response.ok)return reply.code(502).send();
    reply.type(response.headers.get('content-type')||'image/jpeg').header('Cache-Control','private,max-age=30');
    return Buffer.from(await response.arrayBuffer());
  });
}
