import test from "node:test";
import assert from "node:assert/strict";
import {toggleModelPartSelection} from "../apps/web/src/domain/model-part-selection.js";

test("模型点选支持替换、重复反选与 Ctrl 追加移除，保持目标顺序",()=>{
  let parts=toggleModelPartSelection([],"root/0");
  assert.deepEqual(parts,["root/0"]);
  parts=toggleModelPartSelection(parts,"root/1",true);
  assert.deepEqual(parts,["root/0","root/1"]);
  assert.deepEqual(toggleModelPartSelection(parts,"root/0",true),["root/1"]);
  assert.deepEqual(toggleModelPartSelection(parts,"root/2"),["root/2"]);
  assert.deepEqual(toggleModelPartSelection(["root/2"],"root/2"),[]);
  assert.deepEqual(parts,["root/0","root/1"]);
});
