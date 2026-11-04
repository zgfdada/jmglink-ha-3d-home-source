import test from 'node:test';
import assert from 'node:assert/strict';
import {createIdleRotation,bindIdleRotation} from '../apps/web/src/domain/idle-rotation.js';
function fixture(){
 let now=0,id=0,running=true;const timers=new Map(),changes=[];
 const policy=createIdleRotation(value=>{running=value;changes.push(value);},{setTimer:(fn,delay)=>{timers.set(++id,{fn,time:now+delay});return id;},clearTimer:id=>timers.delete(id)});
 return {policy,changes,get running(){return running;},get pending(){return timers.size;},advance(ms){const end=now+ms;while(true){const next=[...timers].filter(([,v])=>v.time<=end).sort((a,b)=>a[1].time-b[1].time)[0];if(!next)break;now=next[1].time;timers.delete(next[0]);next[1].fn();}now=end;}};
}
const event=(type,props={})=>Object.assign(new Event(type),props);
test('默认旋转，任何新活动重新计算完整8秒，恢复只触发一次',()=>{
 const f=fixture();assert.equal(f.running,true);
 f.policy.activity();assert.equal(f.running,false);f.advance(7999);assert.equal(f.running,false);
 f.policy.activity();f.advance(7999);assert.equal(f.running,false);f.advance(1);assert.equal(f.running,true);
 f.advance(30000);assert.deepEqual(f.changes,[false,true]);assert.equal(f.pending,0);
});
test('按住指针、输入焦点、弹窗或隐藏页面时不得恢复，释放后等待8秒',()=>{
 const f=fixture(),p=f.policy;
 p.pointerDown(1);p.pointerDown(2);f.advance(20000);assert.equal(f.running,false);
 p.pointerUp(1);f.advance(20000);assert.equal(f.running,false);
 p.pointerUp(2);f.advance(8000);assert.equal(f.running,true);
 for(const setter of ['setFocused','setBlocked','setHidden']){
  p[setter](true);f.advance(30000);assert.equal(f.running,false);assert.equal(f.pending,0);
  p[setter](false);f.advance(7999);assert.equal(f.running,false);f.advance(1);assert.equal(f.running,true);
 }
 p.activity();p.dispose();f.advance(9000);assert.equal(f.running,false);assert.equal(f.pending,0);
});
test('页面绑定处理轮滚、焦点转移、窗口外取消、隐藏及清理',()=>{
 const root=new EventTarget(),owner=new EventTarget(),doc=new EventTarget(),child={};
 root.contains=node=>node===child;doc.hidden=false;doc.activeElement=null;
 const f=fixture(),cleanup=bindIdleRotation(root,f.policy,owner,doc);
 root.dispatchEvent(event('wheel'));assert.equal(f.running,false);f.advance(8000);assert.equal(f.running,true);
 root.dispatchEvent(event('focusin'));root.dispatchEvent(event('focusout',{relatedTarget:child}));f.advance(9000);assert.equal(f.running,false);
 root.dispatchEvent(event('focusout',{relatedTarget:null}));f.advance(8000);assert.equal(f.running,true);
 root.dispatchEvent(event('pointerdown',{pointerId:3}));owner.dispatchEvent(event('pointercancel',{pointerId:3}));f.advance(8000);assert.equal(f.running,true);
 doc.hidden=true;doc.dispatchEvent(event('visibilitychange'));f.advance(10000);assert.equal(f.running,false);
 doc.hidden=false;doc.dispatchEvent(event('visibilitychange'));f.advance(8000);assert.equal(f.running,true);
 root.dispatchEvent(event('pointerdown',{pointerId:4}));owner.dispatchEvent(event('blur'));f.advance(8000);assert.equal(f.running,true);
 cleanup();const count=f.changes.length;root.dispatchEvent(event('wheel'));owner.dispatchEvent(event('focus'));f.advance(9000);assert.equal(f.changes.length,count);assert.equal(f.pending,0);
});
