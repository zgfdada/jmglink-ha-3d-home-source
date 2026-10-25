import test from 'node:test';
import assert from 'node:assert/strict';
import {formatWidgetCode} from '../apps/web/src/app/sidebar-development/code-format.js';
test('formats HTML CSS and transform JS without losing template references',async()=>{
 for(const [language,code] of [['html','<article><div>{{temperature}}</div><div>{{humidity}}</div></article>'],['css','.card{color:red;padding:10px}'],['js','return {temperature:1,humidity:2};']]){
  const result=await formatWidgetCode(code,language);assert.ok(result.includes('\n'));assert.equal(await formatWidgetCode(result,language),result);
  if(language==='html')assert.ok(result.includes('{{temperature}}'));
 }
 await assert.rejects(formatWidgetCode('const = ;','js'));
});
