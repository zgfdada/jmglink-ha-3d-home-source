export function normalizeWidgetActions(value = []) {
  const fail=message=>{throw Object.assign(new Error(message),{statusCode:400});};
  if(!Array.isArray(value)||value.length>200)fail('每个控件最多配置 200 个动作');
  const ids=new Set();
  return value.map(action=>{
    if(!action || !/^[a-zA-Z0-9_-]{1,80}$/.test(action.id||'') || ids.has(action.id))fail('动作标识无效或重复');
    ids.add(action.id);
    if(!/^[a-z0-9_]+$/.test(action.domain||'') || !/^[a-z0-9_]+$/.test(action.service||''))fail('动作服务格式不正确');
    const data=action.data??{};
    if(!data||typeof data!=='object'||Array.isArray(data)||JSON.stringify(data).length>16000 || Object.keys(data).some(k=>['entity_id','device_id','area_id','floor_id','target','__proto__','constructor','prototype'].includes(k)))fail('动作参数无效，目标实体请通过绑定配置');
    return {id:action.id,label:String(action.label||action.id).slice(0,80),domain:action.domain,service:action.service,target:action.target==='all'?'all':/^[a-z0-9_]+\.[a-z0-9_]+$/.test(action.target||'')?action.target:'primary',data};
  });
}
