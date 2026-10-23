// Fetch in the authenticated host, never from the opaque widget origin.
export function createWidgetPictureCache(fetchImage=fetch) {
 const cache=new Map();
 const key=e=>JSON.stringify([e.entityId,e.attributes?.entity_picture,e.attributes?.media_content_id,e.attributes?.songloft_song_id,e.attributes?.media_title]);
 return {
  read(e){return e?.attributes?.entity_picture?cache.get(key(e))?.data:undefined;},
  async load(e){
   if(!e?.attributes?.entity_picture)return;
   const id=key(e);if(cache.has(id))return cache.get(id).pending;
   const entry={};cache.set(id,entry);while(cache.size>8)cache.delete(cache.keys().next().value);
   entry.pending=(async()=>{
    try {
     const r=await fetchImage('api/sidebar-services/picture/'+encodeURIComponent(e.entityId),{credentials:'same-origin',signal:AbortSignal.timeout(10000)});
     if(!r.ok)throw new Error('图片读取失败');
     const type=(r.headers.get('content-type')||'').split(';')[0];if(!type.startsWith('image/'))throw new Error('图片格式无效');
     const bytes=new Uint8Array(await r.arrayBuffer());if(bytes.length>5*1024*1024)throw new Error('图片过大');
     let binary='';for(let n=0;n<bytes.length;n+=32768)binary+=String.fromCharCode(...bytes.subarray(n,n+32768));
     entry.data='data:'+type+';base64,'+btoa(binary);
    }catch{cache.delete(id);}
   })();return entry.pending;
  }
 };
}
