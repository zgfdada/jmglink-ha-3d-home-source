// This source runs inside the opaque-origin widget iframe. It never receives HA credentials.
export const widgetSdkSource = `
const requests=new Map();let sequence=0;
function invoke(message){return new Promise((resolve,reject)=>{const requestId='widget-'+(++sequence);const timer=setTimeout(()=>{requests.delete(requestId);reject(new Error('HA 操作超时'));},22000);requests.set(requestId,{resolve,reject,timer});parent.postMessage({type:'ha3d-service',requestId,...message},'*');});}
window.addEventListener('message',event=>{if(event.source!==parent||event.data?.type!=='ha3d-service-result')return;const request=requests.get(event.data.requestId);if(!request)return;clearTimeout(request.timer);requests.delete(event.data.requestId);event.data.ok?request.resolve(event.data.result):request.reject(new Error(event.data.error));});
const ha=Object.freeze({
 get entity(){return entity;},get entities(){return entities;},
 getEntity(id){return entities.find(e=>e.entityId===id);},
 onStateChange(callback){const handler=event=>callback(event.detail.entities);window.addEventListener('ha3d-entities',handler);return()=>window.removeEventListener('ha3d-entities',handler);},
 callService(domain,service,data={},entityId=entity?.entityId){return invoke({domain,service,data,entityId});},
 runAction(actionId,data={},entityId){return invoke({actionId,data,entityId});},
 imageUrl(entityId=entity?.entityId){const picture=entities.find(e=>e.entityId===entityId)?.pictureData;if(picture)return picture+'#ha3d';return new URL('api/sidebar-services/picture/'+encodeURIComponent(entityId),viewContext.assetBase).href;},
 expand(section='detail'){parent.postMessage({type:'ha3d-open-detail',section},'*');}
});window.ha=ha;
document.getElementById('view').addEventListener('click',async event=>{const button=event.target.closest('[data-ha-action]');if(!button || button.disabled)return;const disabled=button.disabled;button.disabled=true;try{await ha.runAction(button.dataset.haAction);button.removeAttribute('data-error');}catch(error){button.dataset.error=error.message;const status=document.getElementById('ha-action-status')||document.getElementById('view').appendChild(Object.assign(document.createElement('p'),{id:'ha-action-status'}));status.setAttribute('role','alert');status.textContent=error.message;}finally{button.disabled=disabled;}});
`;
