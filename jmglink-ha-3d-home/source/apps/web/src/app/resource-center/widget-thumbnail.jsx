import {a as React} from '../../vendor/react.js';
import {customDocument} from '../sidebar-development/renderer.jsx';

// Capture only the portable template with synthetic state, inside its existing opaque sandbox.
function snapshotScript(){
  const view=document.getElementById('view');let timer;
  const capture=()=>{
    if(!view?.textContent?.trim())return;
    const clone=view.cloneNode(true),original=[view,...view.querySelectorAll('*')],copies=[clone,...clone.querySelectorAll('*')];
    if(original.length>1000)return;
    const properties='display position box-sizing width height min-width min-height max-width max-height margin padding border border-radius background-color background-image color font font-family font-size font-weight line-height letter-spacing text-align white-space overflow flex flex-direction flex-wrap align-items align-content justify-content gap grid-template-columns grid-template-rows grid-column grid-row opacity box-shadow transform vertical-align'.split(' ');
    original.forEach((node,i)=>{const style=getComputedStyle(node);copies[i].removeAttribute('style');for(const key of properties){const value=style.getPropertyValue(key);if(!/url\s*\(|@import/i.test(value))copies[i].style.setProperty(key,value);}});
    clone.querySelectorAll('style,script,iframe,object,embed,link,img,video,audio').forEach(n=>n.remove());
    const width=380,height=Math.max(120,Math.min(480,Math.ceil(view.getBoundingClientRect().height)));
    const wrapper=document.createElementNS('http://www.w3.org/1999/xhtml','div');wrapper.setAttribute('style','width:380px;background:#edf4fb;color:#14283f;overflow:hidden');wrapper.append(clone);
    const markup=new XMLSerializer().serializeToString(wrapper);if(markup.length>500000)return;
    parent.postMessage({type:'ha3d-portable-thumbnail',width,height,markup},'*');
  };
  new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(capture,100);}).observe(view,{childList:true,subtree:true,characterData:true});
  timer=setTimeout(capture,100);
}
function thumbnailDocument(widget){
  const entity={state:'sunny',name:'示例天气',attributes:{friendly_name:'示例天气',temperature:23,humidity:50,temperature_unit:'°C',wind_speed:3,wind_speed_unit:'km/h',forecast:Array.from({length:5},(_,i)=>({temperature:25+i,templow:16+i,condition:'sunny',precipitation:0}))}};
  return customDocument({...widget,kind:'custom',scriptMode:'transform'},entity,[],{theme:'night'}).replace('</body>','<script>('+snapshotScript.toString()+')();<'+ '/script></body>');
}
// Independent of the selected editor tab. Every save gets a completed image of its exact snapshot.
export function generateWidgetThumbnail(widget,{timeout=8000}={}){
  return new Promise((resolve,reject)=>{
    const frame=document.createElement('iframe');let finished=false,timer;
    frame.setAttribute('sandbox','allow-scripts');frame.referrerPolicy='no-referrer';frame.setAttribute('aria-hidden','true');
    frame.style.cssText='position:fixed;left:-10000px;top:0;width:380px;height:480px;border:0;pointer-events:none';
    const finish=(error,value)=>{if(finished)return;finished=true;clearTimeout(timer);window.removeEventListener('message',receive);frame.remove();error?reject(error):resolve(value);};
    const receive=event=>{
      if(finished||event.source!==frame.contentWindow||event.data?.type!=='ha3d-portable-thumbnail')return;
      const {width,height,markup}=event.data;
      if(width!==380||!Number.isFinite(height)||height<120||height>480||typeof markup!=='string'||markup.length>500000)return;
      const svg='<svg xmlns="http://www.w3.org/2000/svg" width="380" height="'+height+'"><foreignObject width="100%" height="100%">'+markup+'</foreignObject></svg>',img=new Image();
      img.onload=()=>{if(finished)return;try{const canvas=document.createElement('canvas');canvas.width=380;canvas.height=height;canvas.getContext('2d').drawImage(img,0,0);const image=canvas.toDataURL('image/png');if(image.length>700000)throw Error('预览图过大');finish(null,image);}catch{finish(Error('无法生成控件预览图，请选择一张预览图后重试。'));}};
      img.onerror=()=>finish(Error('控件预览图生成失败，请选择一张预览图后重试。'));
      img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
    };
    window.addEventListener('message',receive);timer=setTimeout(()=>finish(Error('控件预览图生成超时，请重试或选择预览图。')),timeout);
    frame.srcdoc=thumbnailDocument(widget);document.body.append(frame);
  });
}
export default function WidgetThumbnail({widget,onThumbnail}){
  const frame=React.useRef(null),callback=React.useRef(onThumbnail);callback.current=onThumbnail;
  const [error,setError]=React.useState('');
  const source=React.useMemo(()=>thumbnailDocument(widget),[widget]);
  React.useEffect(()=>{let active=true;const receive=event=>{
    if(event.source!==frame.current?.contentWindow||event.data?.type!=='ha3d-portable-thumbnail')return;
    const {width,height,markup}=event.data;if(width!==380||!Number.isFinite(height)||height<120||height>480||typeof markup!=='string'||markup.length>500000)return;
    const svg='<svg xmlns="http://www.w3.org/2000/svg" width="380" height="'+height+'"><foreignObject width="100%" height="100%">'+markup+'</foreignObject></svg>',img=new Image();
    img.onload=()=>{if(!active)return;try{const canvas=document.createElement('canvas');canvas.width=380;canvas.height=height;canvas.getContext('2d').drawImage(img,0,0);callback.current?.(canvas.toDataURL('image/png'));}catch{setError('此浏览器无法自动生成控件图片，请选择一张预览图。');}};
    img.onerror=()=>{if(active)setError('控件图片生成失败，请选择一张预览图。');};img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
  };window.addEventListener('message',receive);return()=>{active=false;window.removeEventListener('message',receive);};},[widget]);
  return <div><iframe ref={frame} sandbox="allow-scripts" referrerPolicy="no-referrer" title="控件分享预览（模拟数据）" srcDoc={source} style={{width:380,maxWidth:'100%',height:200,border:0,background:'#edf4fb'}}/>{error&&<p role="status">{error}</p>}</div>;
}
