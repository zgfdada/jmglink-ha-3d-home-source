const allowed = {
  homeassistant: { update_entity: [] },
  media_player: { media_play: [],media_pause: [],media_play_pause: [],media_previous_track: [],media_next_track: [],volume_mute: ["is_volume_muted"],volume_set: ["volume_level"],media_seek: ["seek_position"],play_media: ["media_content_type","media_content_id"],select_source: ["source"] },
  songloft: {search:["query","play_first"],set_play_mode:["play_mode"],toggle_favorite:[]},
};
export function validateSidebarService(body, entities) {
  const {domain,service,entityId,data={}}=body||{};
  const keys=allowed[domain]?.[service];
  const entity=entities.find(e=>e.entityId===entityId);
  if(!keys || !entity || (domain==='homeassistant' ? !entityId.startsWith('sensor.') : !(entityId.startsWith('media_player.') && (entityId==='media_player.songloft' || 'songloft_song_id' in (entity.attributes||{}))))) throw Object.assign(new Error('不支持此控件操作或实体'),{statusCode:400});
  if(!data || typeof data!=='object' || Array.isArray(data) || Object.keys(data).some(k=>!keys.includes(k)))throw Object.assign(new Error('操作参数不正确'),{statusCode:400});
  if(('volume_level' in data && (!Number.isFinite(data.volume_level)||data.volume_level<0||data.volume_level>1)) || ('seek_position' in data && (!Number.isFinite(data.seek_position)||data.seek_position<0)) || JSON.stringify(data).length>4096)throw Object.assign(new Error('操作参数超出范围'),{statusCode:400});
  return {domain,service,data:{...data,entity_id:entityId}};
}
export function registerSidebarServices(app,ha) {
  app.post('/api/sidebar-services/action',async req=>{
    const site=req.headers['sec-fetch-site'];
    if((site && site!=='same-origin') || (req.headers.origin && !site && new URL(req.headers.origin).host!==req.headers.host))throw Object.assign(new Error('不允许跨站操作'),{statusCode:403});
    if(!req.headers['content-type']?.startsWith('application/json'))throw Object.assign(new Error('需要 JSON'),{statusCode:415});
    const action=validateSidebarService(req.body,ha.getEntities());
    const response=await fetch(`${ha.config.ha.restUrl}/services/${action.domain}/${action.service}`,{method:'POST',headers:{Authorization:`Bearer ${ha.config.ha.token}`,'Content-Type':'application/json'},body:JSON.stringify(action.data),signal:AbortSignal.timeout(15000)});
    if(!response.ok)throw Object.assign(new Error(`HA 操作失败（${response.status}）`),{statusCode:502});
    return {ok:true};
  });
  app.get('/api/sidebar-services/picture/:entityId',async(req,reply)=>{
    const entity=ha.getEntities().find(e=>e.entityId===req.params.entityId);
    const picture=entity?.attributes?.entity_picture;
    if(!entity?.entityId.startsWith('media_player.') || !picture)return reply.code(404).send();
    const base=new URL(ha.config.ha.restUrl);const url=new URL(picture,base.origin);
    if(url.origin!==base.origin || !/^\/(api|local)\//.test(url.pathname))return reply.code(403).send();
    const response=await fetch(url,{headers:{Authorization:`Bearer ${ha.config.ha.token}`},signal:AbortSignal.timeout(10000),redirect:'error'});
    if(!response.ok)return reply.code(502).send();
    reply.type(response.headers.get('content-type')||'image/jpeg').header('Cache-Control','private,max-age=30');
    return Buffer.from(await response.arrayBuffer());
  });
}
