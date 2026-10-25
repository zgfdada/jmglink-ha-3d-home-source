import test from 'node:test';
import assert from 'node:assert/strict';
import {EditorState} from '@codemirror/state';
import {html} from '@codemirror/lang-html';
import {css} from '@codemirror/lang-css';
import {codeDiagnostics} from '../apps/web/src/app/sidebar-development/code-diagnostics.js';
const check=(code,lang)=>codeDiagnostics({state:EditorState.create({doc:code,extensions:lang==='html'?[html()]:lang==='css'?[css()]:[]})},lang);
test('JS syntax validation accepts transform returns and identifies error offsets without executing code',()=>{
 assert.equal(check('return {temperature: 10};','js').length,0);
 const issues=check('const = ;','js');assert.equal(issues.length,1);assert.equal(issues[0].from,6);
 assert.equal(check('throw Error("must not execute")','js').length,0);
});
test('HTML and CSS syntax trees validate template markup and reject malformed syntax',()=>{
 assert.equal(check('<p class="weather">{{temperature}}</p>','html').length,0);
 assert.ok(check('<div title="broken','html').length>0);
 assert.equal(check('.weather { color: blue; }','css').length,0);
 assert.ok(check('.weather { color: ; ??? }','css').length>0);
});
