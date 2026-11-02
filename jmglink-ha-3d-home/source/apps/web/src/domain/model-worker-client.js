import {ObjectLoader} from 'three';

// Terminate actual decoding, rather than merely ignoring its eventual result.
export function runModelWorker(data,{signal,workerFactory=()=>new Worker(new URL('./model-decode-worker.js',import.meta.url),{type:'module'})}={}) {
  return new Promise((resolve,reject)=>{
    if(signal?.aborted){reject(new DOMException('Model load cancelled','AbortError'));return;}
    const worker=workerFactory();let finished=false;
    const cleanup=()=>{signal?.removeEventListener('abort',cancel);worker.terminate();};
    const cancel=()=>{if(finished)return;finished=true;cleanup();reject(new DOMException('Model load cancelled','AbortError'));};
    signal?.addEventListener('abort',cancel,{once:true});
    worker.onerror=()=>{if(finished)return;finished=true;cleanup();reject(new Error('模型解码进程异常'));};
    worker.onmessage=event=>{
      if(finished){for(const image of event.data?.bitmaps||[])image.bitmap?.close?.();return;}
      finished=true;cleanup();
      if(event.data.error){reject(new Error(event.data.error));return;}
      resolve(event.data);
    };
    try{worker.postMessage(data,typeof data==='string'?[]:[data]);}catch(error){finished=true;cleanup();reject(error);}
  });
}

export function hydrateModelPacket(packet){
  let scene;
  try{
    scene=new ObjectLoader().parse(packet.scene);
    const images=new Map((packet.bitmaps||[]).map(item=>[item.uuid,item.bitmap]));
    const sources=new Set();
    const textureImages=new Map((packet.scene.textures||[]).map(texture=>[texture.uuid,texture.image]));
    scene.traverse(part=>{
      for(const material of Array.isArray(part.material)?part.material:[part.material]){
        for(const value of Object.values(material||{}))if(value?.isTexture&&images.has(textureImages.get(value.uuid))){
          value.isDataTexture=false;value.image=images.get(textureImages.get(value.uuid));value.needsUpdate=true;sources.add(textureImages.get(value.uuid));
        }
      }
    });
    for(const item of packet.bitmaps||[])if(!sources.has(item.uuid))item.bitmap.close();
    return {scene,scenes:[scene]};
  }catch(error){for(const item of packet.bitmaps||[])item.bitmap.close();throw error;}
}
