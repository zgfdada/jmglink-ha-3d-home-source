import test from 'node:test';import assert from 'node:assert/strict';import {normalizeWidgetActions} from '../packages/schema/src/widget-actions.js';import {defaultSidebar,normalizeSidebar} from '../packages/schema/src/sidebar.js';import {musicWidgetCode} from '../packages/schema/src/music-widget.js';
test('action definitions survive save/import and reject target injection and duplicate IDs',()=>{
 const config=defaultSidebar();assert.deepEqual(normalizeSidebar(config),config);config.widgets.push({...config.widgets[0],id:'music',scriptMode:'dom',...musicWidgetCode()});assert.ok(normalizeSidebar(config).widgets.find(w=>w.id==='music').actions.length>0);
 assert.throws(()=>normalizeWidgetActions([{id:'x',domain:'light',service:'turn_on',data:{target:{area_id:'all'}}}]));
 assert.throws(()=>normalizeWidgetActions([{id:'x',domain:'light',service:'turn_on'},{id:'x',domain:'light',service:'turn_off'}]));
});
test('music sample contains complete editable card source and uses generic SDK',()=>{const code=musicWidgetCode();assert.ok(code.js.includes('class SongloftCard'));assert.ok(code.js.includes('ha.callService'));assert.ok(!code.js.includes("script.src=new URL('vendor/"));});
