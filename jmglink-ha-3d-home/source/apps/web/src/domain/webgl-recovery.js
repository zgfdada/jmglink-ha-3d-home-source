export function isWebglFailure(error){
  return /Error creating WebGL context|WebGL context (?:lost|creation failed)|Failed to create WebGL|WebGLRenderer:.*context/i.test(String(error?.message??error??''));
}

// Preview GLTF assets are owned by that preview, including their GPU textures.
export function disposePreviewObject(root){
  const resources=new Set();
  root.traverse(part=>{
    if(part.geometry)resources.add(part.geometry);
    for(const material of Array.isArray(part.material)?part.material:[part.material]){
      if(!material)continue;
      for(const value of Object.values(material))if(value?.isTexture)resources.add(value);
      resources.add(material);
    }
  });
  for(const resource of resources)resource.dispose?.();
}
