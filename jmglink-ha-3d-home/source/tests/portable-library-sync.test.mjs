import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtemp, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {ResourceCenter} from '../apps/server/src/resource-center/ResourceCenter.js';
import {builtinControls} from '../packages/schema/src/control-library.js';
import {builtinMotionResources} from '../packages/schema/src/motion-library.js';
import {FORMAT,canonical,portablePanel,sha256,validateManifest} from '../packages/resource-protocol/index.js';

const preview = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jB1sAAAAASUVORK5CYII=';

async function fixture(t) {
  const directory = await mkdtemp(path.join(process.env.HA3D_TEST_TMP || tmpdir(), 'portable-sync-'));
  t.after(() => rm(directory, {recursive:true,force:true}));
  const project = {id:'custom.device',name:'设备',capabilities:[]};
  const panel = {id:'custom.panel',name:'面板',deviceTemplateId:project.id,sections:[]};
  const builtControl = builtinControls()[0], builtMotion = builtinMotionResources()[0];
  const control = {...builtControl,id:'custom.control',name:'控件',builtin:false};
  const motion = {...builtMotion,id:'custom.motion.effect',name:'动效',builtin:false};
  const installed = {id:'custom.import-example',name:'在线设备'};
  const platform = {
    getDeviceTemplates:() => [project, installed, {id:'builtin.device',builtin:true}],
    getControlPanels:() => [panel, {id:'builtin.panel',builtin:true}, {...panel,id:'custom.installed-panel',deviceTemplateId:installed.id}],
    controlLibrary:{list:() => [control, builtControl]},
    motionLibrary:{list:() => [motion, builtMotion]},
    exportProjectPackage:async () => ({project, panel}),
  };
  const center = await ResourceCenter.create({directory, origin:'https://example.invalid', platform,
    fetchImpl:() => {throw Error('unexpected network request');}});
  center.installations.imported = {type:'device-project',localId:installed.id};
  await center.stopSync();
  assert.equal(center.status().silentUpload, false);
  await center.setSilentUpload(true);
  return {center, project, panel, control, motion};
}

test('设备自带面板，退出只同步设备、控件和动效；跳过内置和在线安装，重试及旧队列去重', async t => {
  const {center, panel, motion} = await fixture(t);
  const plan = await center.portableSyncPlan();
  assert.equal(plan.owner, null);
  assert.deepEqual(plan.errors, []);
  assert.deepEqual(plan.items.map(i => i.sourceId), ['custom.device', 'custom.control', 'custom.motion.effect']);
  assert.deepEqual((await center.portableSyncPlan('device-control')).items.map(i=>i.sourceKind),['control']);
  for (const item of plan.items) {
    const input = {...item,automatic:true,expectedOwner:null,expectedSignature:item.signature,previewDataUrl:preview};
    const [a, b] = await Promise.all([center.enqueuePortable(input),center.enqueuePortable(input)]);
    assert.equal(a.id, b.id);
    const job = center.outbox[a.id];
    assert.equal(job.owner, null);
    assert.ok(job.manifest.preview);
    delete job.sourceSignature; // The preceding client stored only package file hashes.
  }
  assert.equal(Object.keys(center.outbox).length, 3);
  assert.deepEqual((await center.portableSyncPlan()).items, []);
  panel.name = '调整后的面板';
  const updates = await center.portableSyncPlan();
  assert.deepEqual(updates.items.map(i => i.sourceId), ['custom.device']);
  const saveOutbox = center.saveOutbox;
  center.saveOutbox = async () => {throw Error('测试写入失败');};
  await assert.rejects(center.enqueuePortable({...updates.items[0],automatic:true,previewDataUrl:preview}), /写入失败/);
  center.saveOutbox = saveOutbox;
  assert.deepEqual((await center.portableSyncPlan()).items, updates.items);
  await assert.rejects(center.enqueuePortable({...plan.items[0],automatic:true,expectedSignature:plan.items[0].signature}), /已更新/);
  await assert.rejects(center.enqueuePortable({type:'device-project',sourceId:'custom.import-example',automatic:true}), /不参与/);
  const standalonePanel = {type:'device-control',sourceKind:'panel',sourceId:panel.id};
  for (const automatic of [true,false]) {
    await assert.rejects(center.enqueuePortable({...standalonePanel,automatic}), {code:'panel_requires_device'});
  }
  await assert.rejects(center.prepare(standalonePanel), {code:'panel_requires_device'});
  assert.equal(Object.keys(center.outbox).length, 3);
  motion.effect = {type:'unknown'}; motion.name = '';
  const partial = await center.portableSyncPlan();
  assert.equal(partial.errors.length, 1);
  assert.equal(partial.errors[0].sourceId, motion.id);
  assert.deepEqual(partial.items.map(i => i.sourceId), ['custom.device']);
});

test('旧独立面板仍可读取；退出和重试都不会发送旧任务，安装保留本地已有数据', async t => {
  const {center,panel} = await fixture(t);
  const entry = portablePanel(panel);
  const bytes = Buffer.from(canonical(entry));
  const file = {path:'control.json',sha256:sha256(bytes),size:bytes.length,mediaType:'application/json'};
  const manifest = validateManifest({
    format:FORMAT,resource:'alice/historical-panel',type:'device-control',version:'1.0.0',parent:null,name:panel.name,
    description:'',license:'GPL-3.0-only',changelog:'',compatibility:{protocol:1},entry:file.path,files:[file],
    dependencies:[],bindings:[],permissions:[]
  });
  const release = {manifest,manifestSha256:sha256(canonical(manifest))};
  const input = {resource:manifest.resource,version:manifest.version,manifestSha256:release.manifestSha256};
  await writeFile(path.join(center.directory,'objects',file.sha256),bytes);
  center.session = {user:{username:'alice'},expiresAt:Date.now()+60000};
  center.outbox.legacy = {id:'legacy',manifest,state:'uploading',owner:'alice',origin:center.origin,nextAttempt:0};
  center.stopped = false;
  center.wakeSync = () => {};
  const calls = [];
  center.request = async route => { calls.push(route); return release; };
  await center.drainSync();
  await center.retrySync();
  await center.drainSync();
  assert.deepEqual(calls,[]);
  assert.equal(center.outbox.legacy.state,'superseded');
  assert.deepEqual((await center.previewPackage(input)).entry,entry);
  const original = structuredClone(center.installations);
  await assert.rejects(center.install(input),{code:'panel_requires_device'});
  assert.deepEqual(center.installations,original);
  const id = sha256(center.origin+'\n'+release.manifestSha256+'\n');
  const existing = {status:'installed',sourceKind:'panel',localId:panel.id,type:'device-control'};
  center.installations[id] = existing;
  await assert.rejects(center.install(input),{code:'panel_requires_device'});
  assert.deepEqual(center.installations[id],existing);
});

test('完整设备安装还原随包面板，独立自定义控件仍可以安装', async t => {
  const {center,panel,control} = await fixture(t);
  const plans = (await center.portableSyncPlan()).items.filter(item=>item.type!=='motion');
  const imported = [];
  center.platform.importProjectPackage = async bundle => imported.push(bundle);
  center.platform.controlLibrary.create = async value => imported.push(value);
  for (const item of plans) {
    const {id} = await center.enqueuePortable({...item,automatic:true});
    const manifest = center.outbox[id].manifest;
    const manifestSha256 = sha256(canonical(manifest));
    center.request = async () => ({manifest,manifestSha256});
    const result = await center.install({resource:manifest.resource,version:manifest.version,manifestSha256});
    assert.equal(result.status,'installed');
  }
  assert.equal(imported.length,2);
  assert.equal(imported[0].project.controlPanelTemplateId,imported[0].panel.id);
  assert.equal(imported[0].panel.name,panel.name);
  assert.equal(imported[1].name,control.name);
});

test('退出动效页仅重提最新已撤回版本，重复退出与手动上传共用同一队列任务', async t => {
  const {center, motion} = await fixture(t);
  center.session = {user:{username:'fixture-owner'}, expiresAt:Date.now()+60000};
  center.platform.getDeviceTemplates = () => {throw Error('动效退出不应扫描完整设备');};
  const plan = await center.portableSyncPlan('motion');
  assert.deepEqual(plan.items.map(i => i.sourceId), [motion.id]);
  const item = plan.items[0];
  const input = {...item,expectedSignature:item.signature,expectedOwner:plan.owner,previewDataUrl:preview};
  const first = await center.enqueuePortable({...input,automatic:true});
  const job = center.outbox[first.id];
  job.state = 'submitted';
  job.manifestSha256 = 'a'.repeat(64);
  const head = {manifestSha256:job.manifestSha256,status:'pending'};
  const remote = [head];
  center.request = async route => {
    assert.equal(route, '/v1/submissions?resource='+encodeURIComponent(job.manifest.resource));
    return {items:remote};
  };
  for (const status of ['pending','approved','rejected']) {
    head.status = status;
    assert.deepEqual((await center.portableSyncPlan('motion')).items, []);
    assert.equal((await center.enqueuePortable({...input,automatic:true})).id, first.id);
  }
  head.status = 'withdrawn';
  assert.deepEqual((await center.portableSyncPlan('motion')).items, [item]);
  remote.unshift({manifestSha256:'b'.repeat(64),status:'pending'});
  assert.deepEqual((await center.portableSyncPlan('motion')).items, []);
  assert.equal((await center.enqueuePortable({...input,automatic:true})).id,first.id,'计划生成后已有新提交');
  remote.shift();
  const [exit,repeat,manual] = await Promise.all([
    center.enqueuePortable({...input,automatic:true}), center.enqueuePortable({...input,automatic:true}), center.enqueuePortable(input)
  ]);
  assert.equal(exit.id,repeat.id);
  assert.equal(exit.id,manual.id);
  assert.notEqual(exit.id, first.id);
  assert.equal(job.state, 'superseded');
  assert.equal(center.outbox[exit.id].state,'queued');
  assert.deepEqual((await center.portableSyncPlan('motion')).items, []);
  center.session = {user:{username:'another-owner'}, expiresAt:Date.now()+60000};
  await assert.rejects(center.enqueuePortable({...input,automatic:true}), /账号已变更/);
  assert.deepEqual((await center.portableSyncPlan('motion')).items, [item]);
});

test('全库退出分页核对最新审核记录，核对失败时仍计划新增及已修改的资源', async t => {
  const {center, control} = await fixture(t);
  center.session = {user:{username:'fixture-owner'}, expiresAt:Date.now()+60000};
  const submitted = [];
  for (const item of (await center.portableSyncPlan()).items) {
    const {id} = await center.enqueuePortable({...item,automatic:true});
    const job = center.outbox[id];
    job.state='submitted';
    job.manifestSha256=String(submitted.length+1).repeat(64);
    submitted.push({manifest:job.manifest,manifestSha256:job.manifestSha256,status:'pending'});
  }
  submitted[1].status='withdrawn';
  const routes=[];
  center.request = async route => {
    routes.push(route);
    if (route.endsWith('offset=0')) return {items:[submitted[0]],nextOffset:50};
    assert.equal(route,'/v1/submissions?offset=50');
    return {items:submitted.slice(1),nextOffset:null};
  };
  assert.deepEqual((await center.portableSyncPlan()).items.map(i=>i.sourceId), [control.id]);
  assert.deepEqual(routes,['/v1/submissions?offset=0','/v1/submissions?offset=50']);
  center.request = async () => {throw Error('测试离线');};
  control.name += '修改';
  const offline = await center.portableSyncPlan();
  assert.deepEqual(offline.items.map(i=>i.sourceId),[control.id]);
  assert.match(offline.errors[0].error,/测试离线/);
  const queued = await center.enqueuePortable({...offline.items[0],automatic:true});
  assert.equal(queued.state,'queued');
});

test('退出时按需续期默认账号，并发只登录一次；离线继续计划本地改动，切换账号时拒绝重提', async t => {
  const {center,control} = await fixture(t);
  center.origin = 'http://127.0.0.1:8127';
  center.defaultUser = true;
  const plan = await center.portableSyncPlan('motion');
  const item = plan.items[0];
  const input = {...item,automatic:true,expectedOwner:plan.owner};
  const first = await center.enqueuePortable(input);
  const job = center.outbox[first.id];
  job.state = 'submitted';
  job.manifestSha256 = 'a'.repeat(64);
  let logins = 0, expireEarly = false, offline = false, switchUser = false;
  center.request = async route => {
    if (route === '/v1/auth/default-user') {
      logins++;
      if (offline) throw Error('测试默认登录离线');
      return {accessToken:'x'.repeat(43),expiresIn:120,user:{username:'desktop-default',role:'user'}};
    }
    assert.equal(center.portableOwner(false), 'desktop-default');
    if (expireEarly) {
      expireEarly = false;
      center.session = null;
      throw Object.assign(Error('测试令牌已失效'),{statusCode:401});
    }
    if (switchUser) center.session = {expiresAt:Date.now()+60000,user:{username:'other'}};
    return {items:[{manifestSha256:job.manifestSha256,status:'withdrawn'}]};
  };
  const both = await Promise.all([center.portableSyncPlan('motion'),center.portableSyncPlan('motion')]);
  for (const result of both) assert.deepEqual(result.items,[item]);
  assert.equal(logins,1);
  expireEarly = true;
  assert.deepEqual((await center.portableSyncPlan('motion')).items,[item]);
  assert.equal(logins,2);
  center.session.expiresAt = 0;
  offline = true;
  const deferred = await center.portableSyncPlan();
  assert.match(deferred.errors[0].error,/默认登录离线/);
  const changed = deferred.items.find(i => i.sourceId === control.id);
  assert.equal((await center.enqueuePortable({...changed,automatic:true,expectedOwner:plan.owner})).state,'queued');
  offline = false;
  switchUser = true;
  await assert.rejects(center.enqueuePortable(input), /账号已变更/);
  assert.equal(job.state,'submitted');
  assert.equal(center.portableOwner(false),'other');
});

test('动效无封面也可入队，补封面不重复发布；旧服务拒收后以同一请求重试', async t => {
  const {center,motion} = await fixture(t);
  center.session = {user:{username:'fixture-owner'},expiresAt:Date.now()+60000};
  const input = {type:'motion',sourceId:motion.id};
  const first = await center.enqueuePortable({...input,automatic:true});
  const job = center.outbox[first.id];
  assert.equal(job.manifest.entry,'motion.json');
  assert.equal(job.manifest.preview,undefined);
  assert.equal((await center.enqueuePortable({...input,previewDataUrl:preview})).id,first.id);
  Object.assign(job,{state:'blocked',error:'不支持的资源类型'});
  assert.ok((await center.portableSyncPlan()).items.some(item=>item.sourceId===motion.id));
  const saveOutbox = center.saveOutbox;
  center.saveOutbox = async()=>{throw Error('保存失败');};
  await assert.rejects(center.enqueuePortable({...input,automatic:true}),/保存失败/);
  assert.equal(center.outbox[first.id].state,'blocked');
  center.saveOutbox = saveOutbox;
  assert.deepEqual(await center.enqueuePortable({...input,automatic:true}),first);
  assert.equal(center.outbox[first.id].error,'');
  assert.deepEqual(Object.keys(center.outbox),[first.id]);
  assert.ok(!(await center.portableSyncPlan()).items.some(item=>item.sourceId===motion.id));
  motion.name += '（已修改）';
  const changed = await center.enqueuePortable({...input,automatic:true,previewDataUrl:preview});
  assert.notEqual(changed.id,first.id);
  assert.equal(center.outbox[changed.id].manifest.preview,'preview.png');
});
