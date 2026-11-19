import {a as React} from '../../vendor/react.js';
import {c as ReactDOM} from '../../vendor/three.js';
import ModelPreview from './model-preview.jsx';

// Use the same renderer as the model editor, including uploaded GLB/GLTF assets.
export function generateModelThumbnail(model,{preparedAsset,timeout=15000}={}){
  return new Promise((resolve,reject)=>{
    const host=document.createElement('div');
    host.style.cssText='position:fixed;left:-10000px;top:0;width:480px;height:340px;pointer-events:none';
    host.setAttribute('aria-hidden','true');document.body.append(host);
    const root=ReactDOM.createRoot(host);let finished=false;
    const finish=(error,image)=>{
      if(finished)return;finished=true;clearTimeout(timer);
      // Avoid unmounting a React root during its own rendering/effect callback.
      queueMicrotask(()=>{root.unmount();host.remove();error?reject(error):resolve(image);});
    };
    const timer=setTimeout(()=>finish(Error('模型预览图生成超时，请重新打开模型预览后重试。')),timeout);
    root.render(React.createElement(ModelPreview,{model,preparedAsset,onThumbnail:image=>finish(null,image),onThumbnailError:message=>finish(Error(message))}));
  });
}
