import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { shouldRightPanEmptyCanvas, canvasPanHasMoved } from "../apps/web/src/domain/editor-canvas-pan.js";

test("right drag pans only an unselected blank canvas; left selection and furniture dragging remain separate", () => {
  const blank={button:2,pointerType:"mouse",tool:"select",selectionCount:0,hitObject:false};
  assert(shouldRightPanEmptyCanvas(blank));
  for(const override of [{button:0},{pointerType:"touch"},{tool:"wall"},{tool:"furniture"},{selectionCount:1},{selectionCount:3},{hitObject:true},{shiftKey:true},{ctrlKey:true},{metaKey:true}]) {
    assert.equal(shouldRightPanEmptyCanvas({...blank,...override}),false);
  }
  assert.equal(canvasPanHasMoved([10,10],[11,11]),false);
  assert.equal(canvasPanHasMoved([10,10],[13,10]),true);
});

test("editor wires pan intent and suppresses clicks after dragging while retaining selection and hints", () => {
  const src=readFileSync(new URL('../apps/web/src/app/floorplan-editor.js',import.meta.url),'utf8');
  assert.match(src,/shouldRightPanEmptyCanvas\(\{/);
  assert.match(src,/Sa && !canRightPanCanvas\(n\) && n.stopPropagation\(\)/);
  assert.match(src,/selectionCount: pe.length \|\| \(D \? 1 : 0\)/);
  assert.match(src,/canvasPanHasMoved\(Ae.client, \[e.clientX, e.clientY\]\)\) Mt.current = !0/);
  assert.match(src,/右键拖动空白处平移/);
  assert.match(src,/左键选择或框选/);
  assert.doesNotMatch(src,/按下鼠标滚轮 临时平移/);
});

test("home offers only overview and no scene shortcuts in the right-hand detail panel", () => {
  const src=readFileSync(new URL('../apps/web/src/app/home-view.js',import.meta.url),'utf8');
  assert.doesNotMatch(src,/mijia-mode-tabs/);
  assert.doesNotMatch(src,/label: "全屋"/);
  assert.match(src,/T = "overview"/);
  assert.match(src,/vs = ze && A && !!\(B \|\| L\)/);
  const panel=src.slice(src.indexOf('function Wn('),src.indexOf('function ',src.indexOf('function Wn(')+12));
  assert.doesNotMatch(panel,/e.jsx\(as,/);
});
