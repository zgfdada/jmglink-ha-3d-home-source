import {MODEL_BUDGET} from './model-budget.js';
export function serializeModelScene(root){
    const images=new Map(),sources=new Map();let pixels=0;
    root.traverse(part=>{
      for(const material of Array.isArray(part.material)?part.material:[part.material])for(const texture of Object.values(material||{})){
        if(!texture?.isTexture||sources.has(texture.source))continue;
        const image=texture.source.data;
        if(image&&typeof ImageBitmap!=='undefined'&&image instanceof ImageBitmap){
          pixels+=image.width*image.height;
          if(image.width>MODEL_BUDGET.textureEdge||image.height>MODEL_BUDGET.textureEdge||pixels>MODEL_BUDGET.texturePixels)throw Error('模型纹理解码预算超限');
          images.set(texture.source.uuid,image);sources.set(texture.source,image);
          texture.source.data={data:new Uint8Array(4),width:1,height:1};
        }
      }
    });
    const scene=root.toJSON();
    for(const [source,image] of sources)source.data=image;
    const bitmaps=[...images].map(([uuid,bitmap])=>({uuid,bitmap}));
    return {scene,bitmaps};
}
