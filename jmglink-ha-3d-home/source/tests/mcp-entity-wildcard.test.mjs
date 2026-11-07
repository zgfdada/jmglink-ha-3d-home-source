import test from 'node:test';
import assert from 'node:assert/strict';
import {allow} from '../apps/server/src/mcp/store.js';
import {HaAdapter} from '../apps/server/src/mcp/adapters.js';
test('实体全范围覆盖当前及后续实体，仍校验服务权限与精确白名单',()=>{
 const client={scopes:['ha.state.read','ha.service.call'],expiresAt:'9999-01-01T00:00:00Z',resources:{entities:['*']}};
 const entities=[{entityId:'input_boolean.cinema',state:'off'},{entityId:'light.new_light',state:'on'}];
 const adapter=new HaAdapter({state:{connections:{ha:{enabled:true}}}},{config:{ha:{token:'test'}},getEntities:()=>entities});
 assert.equal(adapter.entities(client).length,2);
 allow(client,'ha.service.call','entities','input_boolean.cinema');
 assert.throws(()=>allow({...client,scopes:['ha.state.read']},'ha.service.call','entities','light.new_light'));
 client.resources.entities=['input_boolean.cinema'];
 assert.equal(adapter.entities(client).length,1);
 assert.throws(()=>allow(client,'ha.service.call','entities','light.new_light'));
});
