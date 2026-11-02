export const MODEL_BUDGET = {fileBytes:30*1024*1024,bufferBytes:96*1024*1024,vertices:1000000,nodes:10000,textureEdge:4096,texturePixels:32*1024*1024};
const fail = message => {throw new Error('模型资源超出安全范围：'+message);};
function dataBytes(uri) {
  if(!/^data:[^,]*;base64,/i.test(uri))fail('仅支持自包含的 Base64 资源');
  const body=uri.slice(uri.indexOf(',')+1);
  if(body.length>MODEL_BUDGET.fileBytes*4/3+8)fail('内嵌文件过大');
  return Uint8Array.from(atob(body),c=>c.charCodeAt(0));
}
export function imageSize(bytes) {
  const v=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  if(bytes.length>=24&&v.getUint32(0)===0x89504e47)return [v.getUint32(16),v.getUint32(20)];
  if(bytes.length>=30&&String.fromCharCode(...bytes.slice(0,4))==='RIFF'){
    const kind=String.fromCharCode(...bytes.slice(12,16));
    if(kind==='VP8X')return [1+bytes[24]+(bytes[25]<<8)+(bytes[26]<<16),1+bytes[27]+(bytes[28]<<8)+(bytes[29]<<16)];
    if(kind==='VP8 ')return [v.getUint16(26,true)&0x3fff,v.getUint16(28,true)&0x3fff];
    if(kind==='VP8L'&&bytes[20]===0x2f){const bits=v.getUint32(21,true);return [(bits&0x3fff)+1,((bits>>>14)&0x3fff)+1];}
  }
  if(bytes[0]===255&&bytes[1]===216){
    for(let i=2;i+8<bytes.length;){
      if(bytes[i++]!==255)continue;
      const marker=bytes[i++];if(marker===0xd9||marker===0xda)break;
      if(marker===0x01||(marker>=0xd0&&marker<=0xd8))continue;
      const size=v.getUint16(i);if(size<2||i+size>bytes.length)break;
      if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker))return [v.getUint16(i+5),v.getUint16(i+3)];
      i+=size;
    }
  }
  fail('纹理需为可检查尺寸的 PNG、JPEG 或 WebP');
}
export function inspectModelBudget(data, limits=MODEL_BUDGET) {
  const bytes=typeof data==='string'?new TextEncoder().encode(data):new Uint8Array(data);
  if(bytes.byteLength>limits.fileBytes)fail('文件过大');
  let json,bin;
  if(bytes.length>=12&&new DataView(bytes.buffer,bytes.byteOffset).getUint32(0,true)===0x46546c67){
    const v=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
    if(v.getUint32(4,true)!==2||v.getUint32(8,true)!==bytes.length)fail('GLB 头无效');
    for(let offset=12;offset+8<=bytes.length;){const length=v.getUint32(offset,true),type=v.getUint32(offset+4,true);offset+=8;if(offset+length>bytes.length)fail('GLB 分块无效');const chunk=bytes.subarray(offset,offset+length);if(type===0x4e4f534a)json=JSON.parse(new TextDecoder().decode(chunk).trim());if(type===0x004e4942)bin=chunk;offset+=length;}
  }else json=JSON.parse(new TextDecoder().decode(bytes));
  if(!json?.asset||!String(json.asset.version).startsWith('2'))fail('仅支持 GLTF 2');
  if((json.nodes?.length||0)>limits.nodes)fail('部件数量过多');
  const buffers=(json.buffers||[]).map((b,i)=>{
    if(!Number.isSafeInteger(b.byteLength)||b.byteLength<0)fail('缓冲区长度无效');
    if(b.uri&&!b.uri.startsWith('data:'))fail('不允许外部缓冲区');
    return b.uri?dataBytes(b.uri):(i===0?bin:undefined);
  });
  const bufferBytes=(json.buffers||[]).reduce((sum,b)=>sum+b.byteLength,0);
  if(bufferBytes>limits.bufferBytes)fail('解码缓冲区过大');
  for(const a of json.accessors||[])if(!Number.isSafeInteger(a.count)||a.count<0||a.count>limits.vertices)fail('访问器数量过大');
  for(const v of json.bufferViews||[])if(!Number.isSafeInteger(v.byteLength)||v.byteLength<0||(v.byteOffset||0)<0||(v.byteOffset||0)+v.byteLength>(buffers[v.buffer]?.byteLength||0))fail('缓冲区视图越界');
  let vertices=0;
  for(const mesh of json.meshes||[])for(const p of mesh.primitives||[]){const n=json.accessors?.[p.attributes?.POSITION]?.count??0;if(!Number.isSafeInteger(n)||n<0)fail('顶点数量无效');vertices+=n;}
  // Account for repeated draw instances without double-counting a single mesh.
  let instanceVertices=0;
  for(const node of json.nodes||[])if(node.mesh!==undefined)for(const p of json.meshes?.[node.mesh]?.primitives||[])instanceVertices+=json.accessors?.[p.attributes?.POSITION]?.count||0;
  vertices=Math.max(vertices,instanceVertices);
  if(vertices>limits.vertices)fail('顶点数量过多');
  let texturePixels=0;
  for(const image of json.images||[]){
    if(image.uri&&!image.uri.startsWith('data:'))fail('不允许外部纹理');
    const view=json.bufferViews?.[image.bufferView];
    const buffer=view&&buffers[view.buffer];
    const imageBytes=image.uri?dataBytes(image.uri):buffer?.subarray(view.byteOffset||0,(view.byteOffset||0)+view.byteLength);
    if(!imageBytes)fail('缺少纹理文件');
    const [w,h]=imageSize(imageBytes);
    texturePixels+=w*h;
    if(!w||!h||w>limits.textureEdge||h>limits.textureEdge||texturePixels>limits.texturePixels)fail('纹理像素预算超限');
  }
  return {vertices,texturePixels,bufferBytes};
}
