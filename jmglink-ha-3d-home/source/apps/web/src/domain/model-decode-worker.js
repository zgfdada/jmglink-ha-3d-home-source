import {serializeModelScene} from './model-worker-packet.js';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {inspectModelBudget,MODEL_BUDGET} from './model-budget.js';

self.onmessage=async event=>{
  try{
    const { data, textureEdge } = event.data?.textureEdge ? event.data : { data: event.data };
    inspectModelBudget(data);
    const gltf = await new GLTFLoader().parseAsync(data, '');
    if (textureEdge && typeof ImageBitmap !== 'undefined') {
      const sources = new Set();
      gltf.scene.traverse(part => {
        for (const material of Array.isArray(part.material) ? part.material : [part.material]) {
          for (const texture of Object.values(material || {})) {
            if (texture?.isTexture && texture.source?.data instanceof ImageBitmap) sources.add(texture.source);
          }
        }
      });
      const resized = new Map();
      for (const source of sources) {
        const image = source.data;
        const scale = textureEdge / Math.max(image.width, image.height);
        if (scale >= 1) continue;
        if (!resized.has(image)) {
          resized.set(image, await createImageBitmap(image, {
            resizeWidth: Math.max(1, Math.round(image.width * scale)),
            resizeHeight: Math.max(1, Math.round(image.height * scale)),
            resizeQuality: 'high',
            colorSpaceConversion: 'none',
          }));
        }
        source.data = resized.get(image);
      }
      for (const image of resized.keys()) image.close();
    }
    const {scene,bitmaps}=serializeModelScene(gltf.scene);
    self.postMessage({scene,bitmaps},[...new Set(bitmaps.map(item=>item.bitmap))]);
  }catch(error){self.postMessage({error:String(error.message||error).slice(0,500)});}
};
