import test from 'node:test';
import assert from 'node:assert/strict';
import {HomeAssistantClient} from '../apps/server/src/ha/HomeAssistantClient.js';
import {haConnectionNotice} from '../apps/web/src/domain/ha-connection-notice.js';
import {missingDevicePlacements} from '../apps/web/src/domain/missing-device-placement.js';

function client(){return new HomeAssistantClient({mode:'standalone',ha:{token:'unit-test',restUrl:'http://localhost/api'}});}
test('HA 停止事件立即进入离线，空实体列表不显示删除警告',()=>{
  const ha=client();const socket={};ha.socket=socket;ha.websocketReady=true;
  ha.handleWebSocketMessage(socket,JSON.stringify({type:'event',event:{event_type:'homeassistant_stop'}}));
  assert.equal(ha.getStatus().connected,false);
  assert.equal(haConnectionNotice(ha.getStatus()),'HA 离线，正在重连');
  assert.deepEqual(missingDevicePlacements({devices:[{entityId:'light.a'}]}, {}, ha.getStatus().connected),[]);
});
test('连接后等待完整实体同步再恢复在线，HA STARTING 阶段不误报在线',async()=>{
  const ha=client();const socket={};ha.socket=socket;ha.websocketReady=true;ha.synchronizing=true;
  ha.sendCommand=async()=>({state:'STARTING'});
  await ha.finishConnectionSync(socket);assert.equal(ha.getStatus().connected,false);
  ha.coreStopping=false;ha.sendCommand=async()=>({state:'RUNNING'});ha.fetchStates=async()=>[];
  let resolve;ha.syncRegistriesFromWebSocket=()=>new Promise(r=>resolve=r);
  const ready=ha.finishConnectionSync(socket);await new Promise(r=>setImmediate(r));
  assert.equal(haConnectionNotice(ha.getStatus()),'HA 已连接，正在同步实体');
  assert.equal(ha.getStatus().connected,false);resolve();await ready;
  assert.equal(ha.getStatus().connected,true);assert.equal(haConnectionNotice(ha.getStatus()),'');
  assert.equal(missingDevicePlacements({devices:[{entityId:'light.deleted'}]}, {}, true).length,1);
});
test('未配置和演示模式不提示 HA 离线；同步失败仍保持离线并关闭旧连接',async()=>{
  assert.equal(haConnectionNotice({mock:true,configured:true}), '');
  assert.equal(haConnectionNotice({configured:false}), '');
  const ha=client();let closed=false;ha.socket={close(){closed=true;}};ha.websocketReady=true;ha.synchronizing=true;
  ha.sendCommand=async()=>{throw new Error('unavailable');};
  await ha.finishConnectionSync(ha.socket);assert.equal(closed,true);assert.equal(ha.getStatus().connected,false);
});
