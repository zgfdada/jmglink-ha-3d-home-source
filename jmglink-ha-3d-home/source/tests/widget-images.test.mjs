import test from 'node:test';import assert from 'node:assert/strict';
import {createWidgetPictureCache} from '../apps/web/src/app/sidebar-development/widget-images.js';
const entity={entityId:'media_player.music',attributes:{entity_picture:'/api/image?token=test',media_title:'one'}};
test('host image cache uses relative ingress URL and same-origin session; invalid images never enter widgets',async()=>{
 const calls=[];const cache=createWidgetPictureCache(async(url,options)=>{calls.push({url,options});return new Response(new Uint8Array([255,216,255]),{headers:{'content-type':'image/jpeg'}})});
 await Promise.all([cache.load(entity),cache.load(entity)]);assert.equal(calls.length,1);assert.equal(calls[0].url,'api/sidebar-services/picture/media_player.music');assert.equal(calls[0].options.credentials,'same-origin');assert.equal(cache.read(entity),'data:image/jpeg;base64,/9j/');
 const changed={...entity,attributes:{...entity.attributes,media_title:'two'}};assert.equal(cache.read(changed),undefined);await cache.load(changed);assert.equal(calls.length,2);
 const bad=createWidgetPictureCache(async()=>new Response('<html>login</html>',{headers:{'content-type':'text/html'}}));await bad.load(entity);assert.equal(bad.read(entity),undefined);
});


test('SDK image URLs keep legacy cache-busting suffixes inside the data URL fragment',async()=>{
 const {widgetSdkSource}=await import('../apps/web/src/app/sidebar-development/widget-sdk.js');const e={...entity,pictureData:'data:image/jpeg;base64,/9j/'};
 const win={addEventListener(){}};const document={getElementById:()=>({addEventListener(){}})};
 const url=new Function('entity','entities','window','document','parent','viewContext',widgetSdkSource+';return ha.imageUrl();')(e,[e],win,document,{},{});
 assert.equal(url,'data:image/jpeg;base64,/9j/#ha3d');assert.equal(new URL(url+'?v=legacy').pathname,'image/jpeg;base64,/9j/');
});
