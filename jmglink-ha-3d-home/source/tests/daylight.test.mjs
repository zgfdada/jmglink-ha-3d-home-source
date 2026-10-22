import test from "node:test";
import assert from "node:assert/strict";
import {resolveDaylight} from "../packages/schema/src/daylight.js";
test("日照使用 HA 位置的太阳高度，日落前后平滑变化",()=>{
 const resolve=e=>resolveDaylight({"sun.sun":{attributes:{elevation:e}}});
 assert.equal(resolve(20).daylight,1);assert.equal(resolve(-7).daylight,0);
 assert.ok(resolve(2).daylight>resolve(-2).daylight);
 assert.equal(resolve(-1).theme,"night");assert.equal(resolve(1).theme,"day");
 assert.equal(resolve(0).source,"sun");
});
test("无高度角时使用当地下一次日出日落，缺少太阳实体才回退时钟",()=>{
 const now=Date.parse("2026-10-22T12:00:00Z");
 const value=resolveDaylight({"sun.sun":{attributes:{next_rising:"2026-10-22T22:00:00Z",next_setting:"2026-10-23T09:00:00Z"}}},now);
 assert.equal(value.theme,"night");assert.equal(value.source,"sun");
 assert.equal(resolveDaylight({},now).source,"clock-fallback");
});
