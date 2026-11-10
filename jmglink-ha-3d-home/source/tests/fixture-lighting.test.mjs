import test from 'node:test';
import assert from 'node:assert/strict';
import {advanceLightLevel,fixtureLightOutput,fixtureLightProfile,lightLevel,transitionFactor,fixtureEmissiveOutput,stripLightPositions,selectFixtureShadows,DEFAULT_FIXTURE_BEAM_ANGLE,FIXTURE_BLOOM,FIXTURE_LIGHT_BALANCE} from '../apps/web/src/domain/fixture-lighting.js';

test('开关渐变在 30/60/144fps 下保持相同速度，并最终停止请求帧',()=>{
 for(const [start,goal] of [[0,1],[1,0],[.8,.2]]){
  const samples=[30,60,144].map(fps=>{
   let level=start;
   for(let i=0;i<fps/2;i++)level=advanceLightLevel(level,goal,1/fps);
   return level;
  });
  assert.ok(Math.max(...samples)-Math.min(...samples)<1e-10);
  let level=start;
  for(let i=0;i<300;i++)level=advanceLightLevel(level,goal,1/60);
  assert.equal(level,goal);
 }
});

test('关闭灯具零照明，感知亮度曲线连续递增且低亮度不会被最低强度淹没',()=>{
 for(const variant of ['ceiling','downlight','chandelier','wall','floor','strip']){
  assert.deepEqual(fixtureLightOutput(0,variant),{intensity:0});
  const full=fixtureLightOutput(1,variant),half=fixtureLightOutput(.5,variant);
  assert.ok(half.intensity>0&&half.intensity<full.intensity*.5);
  let previous=0;
  for(let i=0;i<=100;i++){
   const output=fixtureLightOutput(i/100,variant);
   assert.ok(Number.isFinite(output.intensity)&&output.intensity>=previous);
   previous=output.intensity;
  }
 }
});

test('移植参考项目真实光源与 HDR 柔光参数，不输出空气光锥',()=>{
 assert.equal(fixtureLightProfile('ceiling').intensity,20);
 assert.equal(fixtureLightProfile('chandelier').intensity,9);
 assert.equal(fixtureLightProfile('floor').type,'point');
 assert.equal(fixtureLightProfile('floor').intensity,3.4);
 assert.equal(fixtureLightProfile('strip').distance,3.2);
 assert.equal(fixtureLightProfile('strip').intensity,1.6);
 assert.ok(Math.abs(DEFAULT_FIXTURE_BEAM_ANGLE*Math.PI/360-1.2)<1e-12);
 assert.deepEqual(FIXTURE_BLOOM,{strength:.34,radius:.5,threshold:1,exposure:1.05});
 assert.equal(fixtureEmissiveOutput(0),0);assert.equal(fixtureEmissiveOutput(1),2.5*FIXTURE_LIGHT_BALANCE.emitter);
 assert.equal(fixtureLightProfile('unknown'),fixtureLightProfile('ceiling'));
});
test('灯带分布照明保持中心对称、边界及总输出',()=>{
 for(const length of [.08,.8,1,2.2,4.8]){
  const positions=stripLightPositions(length),n=positions.length;
  assert.ok(n>1);
  assert.ok(Math.abs(positions.reduce((sum,p)=>sum+p[0],0))<1e-10);
  for(const [x,y,z]of positions){assert.ok(Math.abs(x)<length/2);assert.equal(y,0);assert.equal(z,.05);}
  assert.ok(Math.abs(positions.reduce(sum=>sum+fixtureLightOutput(1,'strip').intensity/n,0)-1.6*FIXTURE_LIGHT_BALANCE.illumination)<1e-10);
 }
 assert.deepEqual(stripLightPositions(NaN),stripLightPositions(1));
});
test('阴影预算防止纹理采样器溢出，每房间优先一盏且灯带不占阴影',()=>{
 const lights=[{id:'a',variant:'ceiling',roomId:'living'},{id:'b',variant:'ceiling',roomId:'living'},
 {id:'c',variant:'floor',roomId:'bedroom'},{id:'d',variant:'strip',roomId:'kitchen'},
 ...Array.from({length:20},(_,i)=>({id:'extra-'+i,variant:'downlight',roomId:'room-'+i}))];
 const selected=selectFixtureShadows(lights,10,2);
 assert.deepEqual([...selected],['a','c']);assert.equal(selectFixtureShadows(lights,32,2).size,8);
 assert.equal(selectFixtureShadows(lights,8,2).size,0);
 assert.ok(!selectFixtureShadows(lights,32).has('d'));
});
test('异常值不会生成负强度、NaN 或倒退时间',()=>{
 for(const value of [NaN,Infinity,-Infinity,undefined])assert.equal(lightLevel(value),0);
 assert.equal(lightLevel(-1),0);assert.equal(lightLevel(2),1);
 assert.equal(transitionFactor(-1,7),0);assert.equal(transitionFactor(NaN,7),0);
 assert.equal(advanceLightLevel(.4,1,-1),.4);
});

test('灯体自发光从零连续进入参考曲线，消除开关瞬间的发光台阶',()=>{
 assert.equal(fixtureEmissiveOutput(0),0);
 assert.ok(fixtureEmissiveOutput(.001)<.001);
 let previous=0;
 for(let i=0;i<=1000;i++){
  const value=fixtureEmissiveOutput(i/1000);
  assert.ok(value>=previous&&value<=2.5*FIXTURE_LIGHT_BALANCE.emitter);previous=value;
 }
 for(const level of [.12,.3,.8,1])assert.ok(Math.abs(fixtureEmissiveOutput(level)-FIXTURE_LIGHT_BALANCE.emitter*(.8+1.7*Math.pow(level,.7)))<1e-12);
});
test('缓开缓灭期间反向操作从当前亮度继续，且关灯尾部收敛为零',()=>{
 let level=0;
 for(let i=0;i<12;i++)level=advanceLightLevel(level,1,1/60);
 assert.ok(level>0&&level<1);
 const beforeReverse=level,next=advanceLightLevel(level,0,1/60);
 assert.ok(next>0&&next<beforeReverse&&beforeReverse-next<.1);
 level=next;
 for(let i=0;i<180;i++)level=advanceLightLevel(level,0,1/60);
 assert.equal(level,0);assert.equal(fixtureEmissiveOutput(level),0);
});

test('线性灯沿长度分布照明，避免单点中心亮团并限制光源数',()=>{for(const length of [.08,.88,1,4,20]){const positions=stripLightPositions(length);assert.ok(positions.length>=5&&positions.length<=16);assert.ok(positions[0][0]<0&&positions.at(-1)[0]>0);assert.ok(Math.abs(positions[0][0]+positions.at(-1)[0])<1e-10);assert.ok(positions.every(p=>p.every(Number.isFinite)));const total=fixtureLightOutput(1,'strip').intensity;assert.ok(Math.abs(positions.reduce(s=>s+total/positions.length,0)-total)<1e-10);}});
