import test from "node:test";
import assert from "node:assert/strict";
import { formatProjectSaveError } from "../apps/web/src/domain/project-save-error.js";

test("重复设备错误使用实时实体名称并覆盖跨楼层副本", () => {
  const project = {floors:[{devices:[{deviceId:"abc",entityId:"cover.a",name:"旧名称"}]},{devices:[{deviceId:"abc",entityId:"cover.a"},{deviceId:"def",entityId:"cover.b",name:"遮光帘"}]}]};
  const text = formatProjectSaveError("HA 设备 abc 不能在户型中重复放置; HA 设备 def 不能在户型中重复放置",project,{"cover.a":{name:"书房纱帘"}});
  assert.ok(text.includes("「书房纱帘」"));
  assert.ok(text.includes("「遮光帘」"));
  assert.ok(!text.includes("abc") && !text.includes("def") && !text.includes("旧名称"));
  assert.equal(text.match(/书房纱帘/g).length,1);
});

test("名称缺失回退实体 ID，非重复设备错误保留原文", () => {
  const project = {floors:[{devices:[{deviceId:"abc",entityId:"cover.test"}]}]};
  assert.ok(formatProjectSaveError("HA 设备 abc 不能在户型中重复放置",project).includes("cover.test"));
  assert.equal(formatProjectSaveError("网络请求超时",project),"网络请求超时");
});
