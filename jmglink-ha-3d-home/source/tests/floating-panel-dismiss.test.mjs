import test from "node:test";
import assert from "node:assert/strict";
import {bindFloatingPanelDismiss} from "../apps/web/src/domain/floating-panel-dismiss.js";

test("浮层外按下关闭面板，同时同一个事件继续到达场景，不吞掉首次设备点击或拖动", () => {
  let listener, closed = 0, scene = 0;
  const document = {
    addEventListener(type, fn, capture) {assert.equal(type,"pointerdown");assert.equal(capture,true);listener=fn;},
    removeEventListener(type, fn, capture) {assert.equal(fn,listener);assert.equal(capture,true);listener=null;},
  };
  const inside = {};
  const panel = {contains: target => target === inside};
  const dispose=bindFloatingPanelDismiss(document,()=>panel,()=>closed++);
  listener({target:inside});assert.equal(closed,0);
  const event={target:{},preventDefault(){throw Error("不得阻止默认场景交互");},stopPropagation(){throw Error("不得吞事件");}};
  listener(event);scene++;assert.equal(closed,1);assert.equal(scene,1);
  listener({target:{closest:()=>true}});assert.equal(closed,1);
  dispose();assert.equal(listener,null);
});
