import test from 'node:test';
import assert from 'node:assert/strict';
import {syncPortableLibrary} from '../apps/web/src/app/resource-center/portable-sync-background.js';
import {createModelSyncBackground} from '../apps/web/src/app/resource-center/model-sync-background.js';

test('离开动效页仅请求动效；紧接着关闭中心保留完整同步任务',async()=>{
  let intent, finishFirst, firstStarted;
  const started = new Promise(resolve=>{firstStarted=resolve;});
  const release = new Promise(resolve=>{finishFirst=resolve;});
  const scopes=[];
  const queue=createModelSyncBackground({
    storage:{
      getItem:()=>intent,
      setItem:(_key,value)=>{intent=value;},
      removeItem:()=>{intent=null;},
    },
    loadRunner:async()=>async(_progress,context)=>syncPortableLibrary(async type=>{
      scopes.push(type);
      if(scopes.length===1){firstStarted();await release;}
      return {owner:'isolated',items:[],errors:[]};
    },()=>assert.fail('空计划不应上传'),context),
  });
  queue.request({type:'motion'});
  await started;
  assert.deepEqual(JSON.parse(intent).types,['motion']);
  queue.request();
  queue.request({type:'motion'});
  assert.deepEqual(JSON.parse(intent).types,[]);
  const previous=queue.resume();
  finishFirst();
  await previous;
  await queue.resume();
  assert.deepEqual(scopes,['motion',undefined]);
  assert.equal(intent,null);
  queue.dispose();
});

test('控件和动效连续退出只检查这两类，能从旧的单类型任务恢复',async()=>{
  let intent=JSON.stringify({id:'old',owner:'creator',type:'motion'});
  const scopes=[];
  const queue=createModelSyncBackground({
    storage:{getItem:()=>intent,setItem:(_key,value)=>{intent=value;},removeItem:()=>{intent=null;}},
    loadRunner:async()=>async(_progress,context)=>{assert.equal(context.expectedOwner,'creator');scopes.push(context.type);},
  });
  queue.request({type:'device-control'});
  assert.deepEqual(JSON.parse(intent).types,['motion','device-control']);
  await queue.resume();
  assert.deepEqual(scopes,['motion','device-control']);
  assert.equal(intent,null);
  queue.dispose();
});

test('关闭开发中心时只处理计划中的资源，一项预览失败仍提交后续资源',async()=>{
  const device={name:'洗衣机',type:'device-project',sourceId:'washer'};
  const control={name:'旋钮',type:'device-control',sourceKind:'control',sourceId:'control'};
  const motion={name:'旋转',type:'motion',sourceId:'spin'};
  const plan={owner:'desktop-default',items:[device,control,motion],errors:[{name:'旧设备',error:'缺少文件'}]};
  const uploads=[];
  const owners=[];
  const upload=async(item,owner)=>{
    uploads.push([item.sourceId,owner]);
    if(item===control)throw Error('截图失败');
  };
  const run=()=>syncPortableLibrary(async()=>plan,upload,{onOwner:owner=>owners.push(owner)});
  await assert.rejects(run(),/旧设备：缺少文件；旋钮：截图失败/);
  assert.deepEqual(owners,['desktop-default']);
  assert.deepEqual(uploads,[device,control,motion].map(item=>[item.sourceId,'desktop-default']));
  uploads.length=0;
  plan.items=[];plan.errors=[];
  await run();
  assert.deepEqual(uploads,[]);
});

test('刷新恢复的设备资源任务拒绝新账号；未绑定账号时允许进入待上传队列',async()=>{
  const plan={owner:'personal',items:[{sourceId:'one'}],errors:[]};
  const writes=[];
  const upload=async(item,owner)=>writes.push([item.sourceId,owner]);
  await assert.rejects(syncPortableLibrary(async()=>plan,upload,{expectedOwner:'desktop-default'}),/原账号 desktop-default/);
  assert.deepEqual(writes,[]);
  plan.owner=null;
  await syncPortableLibrary(async()=>plan,upload,{});
  assert.deepEqual(writes,[['one',null]]);
});
