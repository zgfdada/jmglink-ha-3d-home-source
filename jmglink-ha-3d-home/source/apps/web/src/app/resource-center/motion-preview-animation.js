// Each canvas PNG uses a full-size RGBA/RGB image. Reuse its compressed pixels
// as independent APNG frames, preserving compatibility with static PNG readers.
const textBytes = new TextEncoder();
const crcTable = Uint32Array.from({length:256}, (_, index) => {
  let c = index;
  for (let bit = 0; bit < 8; ++bit) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const u32 = (bytes, offset, value) => new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength).setUint32(offset,value);
function chunk(name, data) {
  const bytes = new Uint8Array(data.length + 12);
  u32(bytes, 0, data.length);
  bytes.set(textBytes.encode(name),4);
  bytes.set(data,8);
  let crc = 0xffffffff;
  for (let i=4;i<bytes.length-4;++i) crc=crcTable[(crc^bytes[i]) & 255] ^ (crc >>> 8);
  u32(bytes,bytes.length-4,crc ^ 0xffffffff);
  return bytes;
}
function pngParts(url) {
  const raw = Uint8Array.from(atob(url.slice(url.indexOf(',')+1)), c=>c.charCodeAt(0));
  const view=new DataView(raw.buffer), chunks=[];
  for(let i=8;i+12<=raw.length;) {
    const length=view.getUint32(i), type=String.fromCharCode(...raw.subarray(i+4,i+8));
    if(i+12+length>raw.length) throw Error('预览帧不完整');
    chunks.push({type,data:raw.subarray(i+8,i+8+length)});i+=length+12;
  }
  return {header:chunks.find(c=>c.type==='IHDR').data, pixels:chunks.filter(c=>c.type==='IDAT'),signature:raw.slice(0,8)};
}
export function encodeMotionAnimation(images, delayMs) {
  const frames=images.map(pngParts), first=frames[0];
  if (!first || ![2,6].includes(first.header[9]) || !first.pixels.length) throw Error('预览帧格式无效');
  const control=new Uint8Array(8);
  u32(control,0,frames.length);
  const chunks=[first.signature,chunk('IHDR',first.header),chunk('acTL',control)];
  let sequence=0;
  for (const [i,frame] of frames.entries()) {
    if (frame.header.some((v,k)=>v!==first.header[k]) || !frame.pixels.length) throw Error('预览帧不兼容');
    const fc=new Uint8Array(26);
    u32(fc,0,sequence++);fc.set(first.header.subarray(0,8),4);
    new DataView(fc.buffer).setUint16(20,delayMs);
    new DataView(fc.buffer).setUint16(22,1000);
    chunks.push(chunk('fcTL',fc));
    for(const pixel of frame.pixels) {
      if(i===0) chunks.push(chunk('IDAT',pixel.data));
      else {
        const fd=new Uint8Array(4+pixel.data.length);u32(fd,0,sequence++);fd.set(pixel.data,4);
        chunks.push(chunk('fdAT',fd));
      }
    }
  }
  chunks.push(chunk('IEND',new Uint8Array()));
  return new Blob(chunks,{type:'image/png'});
}
function blobDataURL(blob,done) {
  const reader=new FileReader();
  reader.onload=()=>done(reader.result);reader.onerror=()=>done();
  reader.readAsDataURL(blob);
}
export function createMotionPreviewRecorder(done) {
  const frames=[], smallFrames=[], canvas=document.createElement('canvas'), small=document.createElement('canvas');
  const ctx=canvas.getContext('2d'), smallCtx=small.getContext('2d');
  const frameMs=125, frameCount=19;
  let start, next=0, finished=false;
  return (source,time) => {
    if(finished || !ctx || !smallCtx || source.width<2 || source.height<2) return;
    if(start===undefined) start=time;
    if((time-start)*1000+1<next) return;
    if(!frames.length) {
      const fit=Math.min(1,320/source.width,216/source.height);
      canvas.width=Math.max(1,Math.round(source.width*fit));canvas.height=Math.max(1,Math.round(source.height*fit));
      const compact=Math.min(1,128/source.width,80/source.height);
      small.width=Math.max(1,Math.round(source.width*compact));small.height=Math.max(1,Math.round(source.height*compact));
    }
    ctx.drawImage(source,0,0,canvas.width,canvas.height);
    frames.push(canvas.toDataURL('image/png'));
    smallCtx.drawImage(canvas,0,0,small.width,small.height);
    smallFrames.push(small.toDataURL('image/png'));
    next+=frameMs;
    if(frames.length<frameCount) return;
    finished=true;
    for(const stride of [1,2,3,4]) {
      const animation=encodeMotionAnimation(frames.filter((_,i)=>i%stride===0),frameMs*stride);
      if(animation.size<=512*1024) { blobDataURL(animation,done);return; }
    }
    const compact=encodeMotionAnimation(smallFrames.filter((_,i)=>i%3===0),frameMs*3);
    blobDataURL(compact,done);
  };
}
