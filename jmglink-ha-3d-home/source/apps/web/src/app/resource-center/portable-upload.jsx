import {a as React} from '../../vendor/react.js';
import {c as ReactDOM} from '../../vendor/three.js';
import PortablePreview from './portable-preview.jsx';
import {generateModelThumbnail} from '../device-development-center/model-thumbnail.jsx';
async function api(action,body){const r=await fetch('api/resource-center/'+action,body===undefined?{cache:'no-store'}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const data=await r.json();if(!r.ok)throw Error(data.error||'上传失败');return data;}
function capture(entry){return new Promise((resolve,reject)=>{
 const host=document.createElement('div');host.style.cssText='position:fixed;left:-10000px;top:0;width:480px;min-height:260px;background:#edf4fb;padding:20px';host.setAttribute('aria-hidden','true');document.body.append(host);const root=ReactDOM.createRoot(host);let done=false;
 const finish=(error,value)=>{if(done)return;done=true;clearTimeout(timer);queueMicrotask(()=>{root.unmount();host.remove();error?reject(error):resolve(value);});};
 const timer=setTimeout(()=>finish(Error('预览图生成超时，请重试')),12000);
 root.render(<PortablePreview entry={entry} onThumbnail={image=>finish(null,image)}/>);
 if(entry.format==='ha3d-motion-v1')return;
 setTimeout(()=>{try{
 const clone=host.cloneNode(true),nodes=[host,...host.querySelectorAll('*')],copies=[clone,...clone.querySelectorAll('*')];
 nodes.forEach((node,i)=>{const style=getComputedStyle(node);copies[i].removeAttribute('style');for(const key of style){const v=style.getPropertyValue(key);if(!/url\s*\(/i.test(v))copies[i].style.setProperty(key,v);}});
 clone.style.position='static';clone.style.left='0';clone.querySelectorAll('script,iframe,object,embed,link,img,video,audio').forEach(n=>n.remove());
 clone.setAttribute('xmlns','http://www.w3.org/1999/xhtml');const height=Math.min(700,Math.max(260,host.offsetHeight)),markup=new XMLSerializer().serializeToString(clone),img=new Image();
 img.onload=()=>{try{const c=document.createElement('canvas');c.width=520;c.height=height;c.getContext('2d').drawImage(img,0,0);finish(null,c.toDataURL('image/png'));}catch(e){finish(e);}};img.onerror=()=>finish(Error('无法生成预览图'));img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="520" height="${height}"><foreignObject width="100%" height="100%">${markup}</foreignObject></svg>`);
 }catch(e){finish(e);}},300);
 });}
// Work continues outside the editor's React lifetime. The server persists the accepted outbox.
const pending=new Map();
export function uploadPortable(input,notify=()=>{}){
 const key=JSON.stringify(input);if(pending.has(key))return pending.get(key);
 notify('正在后台准备上传，可继续操作。');
 const job=(async()=>{const state=await api('status');if(!state.loggedIn)throw Error('请先通过右上角账号入口登录资源中心');const snapshot=await api('local-preview?'+new URLSearchParams(input));const image=snapshot.previewModel?await generateModelThumbnail(snapshot.previewModel):await capture(snapshot.entry);await api('sync-portable',{...input,expectedSignature:snapshot.signature,expectedOwner:snapshot.owner,previewDataUrl:image});notify('已加入后台上传队列，可在资源中心查看审核状态。');})().catch(e=>notify(e.message,'error')).finally(()=>pending.delete(key));pending.set(key,job);return job;
}
