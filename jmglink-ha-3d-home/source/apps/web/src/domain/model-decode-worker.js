import {Texture} from 'three';
import {serializeModelScene} from './model-worker-packet.js';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {inspectModelBudget,MODEL_BUDGET} from './model-budget.js';

self.onmessage=async event=>{
  try{
    const { data, textureEdge } = event.data?.textureEdge ? event.data : { data: event.data };
    inspectModelBudget(data);
    const encodedImages = [];
    const failures = [];
    const loader = new GLTFLoader();
    loader.register(parser => {
      const native = parser.textureLoader;
      // A worker has no HTMLImageElement. Preserve the encoded image when the
      // native bitmap decoder is unavailable or rejects an otherwise valid image.
      parser.textureLoader = {load(url, onLoad, progress, onError) {
        async function deferImage() {
          try {
            const response = await fetch(url);
            if (!response.ok) throw Error('无法读取模型贴图');
            const blob = await response.blob();
            const texture = new Texture({data:new Uint8Array(4),width:1,height:1});
            encodedImages.push({uuid:texture.source.uuid,blob});
            onLoad(texture);
          } catch (error) { failures.push(error); onError(error); }
        }
        if (native.isImageBitmapLoader) {
          try { native.load(url, bitmap => onLoad(new Texture(bitmap)), progress, deferImage); }
          catch { deferImage(); }
        } else { deferImage(); }
      }};
      return {name:'HA3D_worker_textures'};
    });
    const gltf = await loader.parseAsync(data, '');
    if (failures.length) throw failures[0];
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
    self.postMessage({scene,bitmaps,encodedImages},[...new Set(bitmaps.map(item=>item.bitmap))]);
  }catch(error){self.postMessage({error:String(error.message||error).slice(0,500)});}
};
