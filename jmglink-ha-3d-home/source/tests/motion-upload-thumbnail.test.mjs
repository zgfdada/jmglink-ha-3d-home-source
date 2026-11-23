import test from 'node:test';
import assert from 'node:assert/strict';
import {captureMotionThumbnail} from '../apps/web/src/app/resource-center/motion-thumbnail.js';

test('动效上传保留可用封面，渲染失败、超时或图片超限时仍可提交资源', async () => {
  const page = new EventTarget();
  const image = 'data:image/png;base64,iVBORw0KGgo=';
  const oversized = 'data:image/png;base64,' + Buffer.alloc(512*1024+1).toString('base64');
  assert.equal(await captureMotionThumbnail(done=>done(image), page),image);
  assert.equal(await captureMotionThumbnail(done=>done(oversized), page),undefined);
  assert.equal(await captureMotionThumbnail(()=>{throw Error('WebGL 不可用');},page),undefined);
  let unmounted = false;
  assert.equal(await captureMotionThumbnail(()=>()=>{unmounted=true;},page,1),undefined);
  assert.ok(unmounted);
});

test('后台页跳过 GPU 截图，截取时切换标签会立即释放预览', async () => {
  const page = new EventTarget();
  let starts=0,stops=0;
  const render = ()=>{starts++;return ()=>{stops++;};};
  const first = captureMotionThumbnail(render,page);
  page.hidden = true;
  page.dispatchEvent(new Event('visibilitychange'));
  assert.equal(await first,undefined);
  assert.equal(await captureMotionThumbnail(render,page),undefined);
  assert.deepEqual([starts,stops],[1,1]);
});
