import {serializeModelScene} from './model-worker-packet.js';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {inspectModelBudget,MODEL_BUDGET} from './model-budget.js';

self.onmessage=async event=>{
  try{
    inspectModelBudget(event.data);
    const gltf=await new GLTFLoader().parseAsync(event.data,'');
    const {scene,bitmaps}=serializeModelScene(gltf.scene);
    self.postMessage({scene,bitmaps},[...new Set(bitmaps.map(item=>item.bitmap))]);
  }catch(error){self.postMessage({error:String(error.message||error).slice(0,500)});}
};
