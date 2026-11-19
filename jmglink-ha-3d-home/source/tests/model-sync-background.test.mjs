import test from 'node:test';
import assert from 'node:assert/strict';
import {createModelSyncBackground} from '../apps/web/src/app/resource-center/model-sync-background.js';
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};};
const storage=()=>{const data=new Map();return {getItem:key=>data.get(key)||null,setItem:(key,value)=>data.set(key,value),removeItem:key=>data.delete(key)};};

test('模型后台任务立即返回，组件退出不影响任务完成，成功后移除持久标记',async()=>{
 const disk=storage(),work=deferred();let started=false;
 const queue=createModelSyncBackground({storage:disk,loadRunner:async()=>async()=>{started=true;await work.promise;}});
 assert.equal(queue.request(),undefined);assert.equal(queue.getState().state,'preparing');
 const completion=queue.resume();await Promise.resolve();assert.equal(started,true);assert.ok(disk.getItem('ha3d.model-sync.pending.v1'));
 work.resolve();await completion;assert.equal(queue.getState().state,'idle');assert.equal(disk.getItem('ha3d.model-sync.pending.v1'),null);queue.dispose();
});

test('刷新后只恢复未完成任务并保留原账号，完成后再次启动不重复运行',async()=>{
 const disk=storage(),stalled=deferred();
 const first=createModelSyncBackground({storage:disk,loadRunner:async()=>async(_progress,context)=>{context.onOwner('owner');await stalled.promise;}});
 first.request();await Promise.resolve();await Promise.resolve();first.dispose();
 let calls=0;
 const restarted=createModelSyncBackground({storage:disk,loadRunner:async()=>async(_progress,context)=>{calls++;assert.equal(context.expectedOwner,'owner');}});
 await restarted.resume();assert.equal(calls,1);await restarted.resume();assert.equal(calls,1);restarted.dispose();
});

test('后台失败不抛到退出调用方，保留任务及错误，重试成功后清除',async()=>{
 const disk=storage();let offline=true,scheduled=0;
 const queue=createModelSyncBackground({storage:disk,loadRunner:async()=>async()=>{if(offline)throw Error('offline');},setTimer:()=>++scheduled,clearTimer:()=>{}});
 queue.request();await queue.resume();assert.equal(queue.getState().state,'waiting');assert.equal(queue.getState().error,'offline');assert.ok(disk.getItem('ha3d.model-sync.pending.v1'));assert.equal(scheduled,1);
 offline=false;queue.retry();await queue.resume();assert.equal(disk.getItem('ha3d.model-sync.pending.v1'),null);queue.dispose();
});

test('处理期间的新保存保留为下一轮，不会被上一轮完成时误删',async()=>{
 const disk=storage(),first=deferred(),second=deferred(),secondStarted=deferred();let calls=0;
 const queue=createModelSyncBackground({storage:disk,loadRunner:async()=>async()=>{if(++calls===1)await first.promise;else{secondStarted.resolve();await second.promise;}}});
 queue.request();const completion=queue.resume();await Promise.resolve();queue.request();first.resolve();await completion;await secondStarted.promise;
 assert.ok(disk.getItem('ha3d.model-sync.pending.v1'));assert.equal(calls,2);
 second.resolve();await queue.resume();assert.equal(disk.getItem('ha3d.model-sync.pending.v1'),null);queue.dispose();
});
