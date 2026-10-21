import { cp, mkdir, readdir, readFile, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import JavaScriptObfuscator from 'javascript-obfuscator';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=path.join(root,'.release');
const sha=data=>createHash('sha256').update(data).digest('hex');
async function files(dir) {
  const result=[];
  for(const item of await readdir(dir,{withFileTypes:true})) {
    const name=path.join(dir,item.name);
    if(item.isDirectory()) result.push(...await files(name)); else result.push(name);
  }
  return result.sort();
}
const sources=['apps/server/src','packages/schema/src'];
const before=new Map();
for(const dir of [...sources,'apps/web/src']) for(const name of await files(path.join(root,dir))) before.set(name,sha(await readFile(name)));
// Only the fixed, generated directory inside this package is replaced.
await rm(output,{recursive:true,force:true});await mkdir(output,{recursive:true});
for(const name of ['apps/server','apps/web/dist','packages/schema'])
  await cp(path.join(root,name),path.join(output,name),{recursive:true,filter:source=>!source.endsWith('.map')});
const manifest={version:JSON.parse(await readFile(path.join(root,'package.json'),'utf8')).version,obfuscated:true,sourceMaps:false,files:[]};
for(const dir of [...sources,'apps/web/dist']) for(const file of await files(path.join(output,dir))) {
  if(!file.endsWith('.js'))continue;
  const code=await readFile(file,'utf8');
  const browser=dir==='apps/web/dist';
  const result=JavaScriptObfuscator.obfuscate(code,{
    target:browser?'browser':'node',compact:true,identifierNamesGenerator:'hexadecimal',
    renameGlobals:false,renameProperties:false,stringArray:false,
    controlFlowFlattening:false,deadCodeInjection:false,debugProtection:false,
    selfDefending:false,sourceMap:false,seed:2301,
  }).getObfuscatedCode();
  await writeFile(file,result+'\n');
  manifest.files.push({path:path.relative(output,file).replaceAll('\\','/'),sha256:sha(result+'\n')});
}
for(const [file,digest] of before) if(sha(await readFile(file))!==digest) throw new Error('Source was modified: '+path.relative(root,file));
if((await files(output)).some(file=>file.endsWith('.map')))throw new Error('Source map included in release');
await writeFile(path.join(output,'release-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({releaseFiles:manifest.files.length,sourceUnchanged:true,sourceMaps:false}));
