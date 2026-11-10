import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parse} from 'acorn';
import {Color} from 'three';
import {resolveBeamAngle} from '../apps/web/src/domain/light-beam-settings.js';
import {fixtureEmissiveOutput} from '../apps/web/src/domain/fixture-lighting.js';

// Evaluate the actual recovered model renderer without booting the application,
// fetching an HA entity or replacing the model with a synthetic test bulb.
const source=fs.readFileSync(new URL('../apps/web/src/app/scene.js',import.meta.url),'utf8');
const ast=parse(source,{sourceType:'module',ecmaVersion:'latest'});
const renderer=ast.body.find(node=>node.type==='FunctionDeclaration'&&node.id.name==='BuiltinFixtureBody');
const element=(type,props)=>({type,props});
const material=()=>null;
const shellMaterial=()=>null;
function render(modelId,on,style){
 const names=['t','useBeamSettings','resolveBeamAngle','ue','$','Cs','dt','Pt','q','Se','D','Y','FixtureGlowMaterial','FixtureHaloMaterial','FixtureShellMaterial','je','fixtureEmissiveOutput'];
 const values=[{jsx:element,jsxs:element,Fragment:Symbol.for('fragment')},()=>({}),resolveBeamAngle,()=>style,
  (a,b,t)=>'#'+new Color(a).lerp(new Color(b),t).getHexString(),x=>x,()=>({color:'#888888',opacity:.1,threshold:22}),x=>x,
  2,1,material,material,material,material,shellMaterial,material,fixtureEmissiveOutput];
 const model=new Function(...names,`return (${source.slice(renderer.start,renderer.end)});`)(...values);
 return model({modelId,bodyColor:'#eeeeee',appearance:{isOn:on,brightness:on?1:0,color:'#ffbd7a'},unavailable:false,presentation:true,selected:false});
}
function materials(tree,path='root',result=new Map()){
 if(!tree||typeof tree!=='object')return result;
 if(typeof tree.type==='string'&&tree.type.endsWith('Material'))result.set(path,tree);
 const children=tree.props?.children;
 for(const [index,child]of (Array.isArray(children)?children:[children]).entries())materials(child,path+'.'+index,result);
 return result;
}
const models=['light.ceiling','light.ceiling_panel','light.ceiling_round','light.downlight','light.chandelier','light.wall_sconce','light.floor_lamp','light.strip'];
test('实际灯型的通电自发光不得绕过统一灯体亮度控制',()=>{
 for(const style of ['cream','cartoon'])for(const model of models){
  for(const node of materials(render(model,true,style)).values()){
   assert.ok(!(Number(node.props.emissiveIntensity)>0),`${model}/${style}: native ${node.type} bypasses emitter gain`);
  }
 }
});
test('实际灯型的通电叠加光面不得以固定Basic材质绕过亮度控制',()=>{
 for(const style of ['cream','cartoon'])for(const model of models){
  const on=materials(render(model,true,style)),off=materials(render(model,false,style));
  for(const [path,node]of on){
   if(node.type!=='meshBasicMaterial')continue;
   assert.equal(node.props.opacity,off.get(path)?.props.opacity,`${model}/${style}: fixed light overlay bypasses emitter gain`);
  }
 }
});

test('候选方案的灯壳不再使用易受自身光源影响的物理高光材质',()=>{for(const style of ['cream','cartoon'])for(const model of models)for(const node of materials(render(model,true,style)).values())assert.ok(!['meshPhysicalMaterial','meshToonMaterial'].includes(node.type),model+'/'+style);});

test('内置灯具不投射自身暗斑，其他场景物体的投影不受影响',()=>{for(const style of ['cream','cartoon'])for(const model of models){const walk=n=>{if(!n||typeof n!=='object')return;assert.notEqual(n.props?.castShadow,true,model+'/'+style);const c=n.props?.children;for(const child of Array.isArray(c)?c:[c])walk(child);};walk(render(model,true,style));}});

// Derive the coverage requirement from the real picker, so a new fixture cannot silently escape this suite.
test('巡检清单覆盖全部内置灯型及开关控制的映射',()=>{
 const declarations=ast.body.filter(n=>n.type==='VariableDeclaration').flatMap(n=>n.declarations);
 const catalogNode=declarations.find(n=>n.id.name==='rs').init,aliasNode=declarations.find(n=>n.id.name==='vo').init;
 const catalog=catalogNode.elements.filter(n=>n.type==='ObjectExpression').map(n=>Object.fromEntries(n.properties.filter(p=>['id','kind'].includes(p.key.name)&&p.value.type==='Literal').map(p=>[p.key.name,p.value.value])));
 const aliases=new Function('return ('+source.slice(aliasNode.start,aliasNode.end)+')')();
 const lights=catalog.filter(x=>x.kind==='light').map(x=>x.id);
 assert.deepEqual([...models].sort(),lights.sort());
 const switches=catalog.filter(x=>x.id.startsWith('switch.light.'));
 assert.equal(switches.length,models.length);
 for(const item of switches)assert.ok(models.includes(aliases[item.id]),item.id+' missing actual fixture renderer');
});

test('支撑杆与底座保持原色，灯罩和灯面继续发光',()=>{
 for(const model of ['light.chandelier','light.wall_sconce','light.floor_lamp'])for(const style of ['cream','cartoon']){const shells=[];const walk=n=>{if(!n||typeof n!=='object')return;if(n.type===shellMaterial)shells.push(n.props);const c=n.props?.children;for(const child of Array.isArray(c)?c:[c])walk(child);};walk(render(model,true,style));assert.ok(shells.some(m=>m.glowEnabled===false),model+' support must not glow');if(model!=='light.wall_sconce')assert.ok(shells.some(m=>m.glowEnabled===true),model+' shade must glow');}
});
