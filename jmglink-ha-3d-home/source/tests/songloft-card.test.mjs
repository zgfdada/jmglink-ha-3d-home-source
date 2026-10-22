import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';
const registry=new Map();vm.runInNewContext(readFileSync(new URL('../apps/web/public/vendor/songloft-card-2.1.1.js',import.meta.url),'utf8'),{HTMLElement:class{},customElements:{get:k=>registry.get(k),define:(k,v)=>registry.set(k,v)},window:{},console:{info(){}}});
const proto=registry.get('songloft-card').prototype;
test('search button and Enter bypass iframe form submission and preserve query',()=>{
 const calls=[];const card=Object.create(proto);Object.assign(card,{_scope:'song',_pending:new Set(),_query:'old',shadowRoot:{querySelector:()=>({value:'  漠河  '})},_call:(...args)=>calls.push(args)});
 card._onClick({target:{closest:()=>({dataset:{action:'search'}})}});
 let prevented=false;card._onKeydown({target:{id:'sl-search'},key:'Enter',preventDefault(){prevented=true;}});
 assert.equal(calls.length,2);assert.equal(calls[0][3].query,'漠河');assert.equal(calls[0][3].play_first,false);assert.equal(prevented,true);
 const view=card._searchView([],[],false);assert.ok(!view.includes('<form'));assert.ok(view.includes('data-action="search"'));
});
test('lyric positioning is relative to its scroller, independent of sidebar position',()=>{
 function scrollAt(outer){let top;const card=Object.create(proto);const row={classList:{toggle(){}},getBoundingClientRect:()=>({top:outer+300,height:30})};const container={scrollTop:50,clientTop:0,clientHeight:330,getBoundingClientRect:()=>({top:outer}),scrollTo:v=>{top=v.top;}};
 Object.assign(card,{_position:()=>10,_expanded:true,_panel:'lyrics',_lyrics:[{time:0}],_lyricOffset:0,_activeLyric:-1,shadowRoot:{querySelector:selector=>selector==='.lyrics'?container:null,querySelectorAll:()=>[row]}});card._updateLive();return top;}
 assert.equal(scrollAt(700),200);assert.equal(scrollAt(700),scrollAt(100));
});
