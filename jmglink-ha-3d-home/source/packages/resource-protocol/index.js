import {validateAdditionalEntry} from './portable-device.js';
export {portableControl,portablePanel,portableMotion,portableDeviceProject,stripInstanceData} from './portable-device.js';
import { createHash } from 'node:crypto';

export const FORMAT = 'ha3d-resource-v1';
export const LIMITS = Object.freeze({file:16*1024*1024, package:32*1024*1024, entry:1024*1024, files:32, dependencies:16, nodes:64, depth:8});
export const TYPES = ['model','sidebar-widget','device-project','device-control','motion'];
export const SUPPORTED_TYPES = [...TYPES];
export const HASH = /^[a-f0-9]{64}$/;
export const RESOURCE = /^[a-z][a-z0-9-]{2,31}\/[a-z][a-z0-9-]{1,63}$/;
export const VERSION = /^(0|[1-9]\d{0,8})\.(0|[1-9]\d{0,8})\.(0|[1-9]\d{0,8})(?:\+r\.[1-9]\d{0,8})?$/;
export const visibleVersion = version => version.split('+')[0];
// Parent and internal revision are transport identity, not editable resource content.
export const resourceContentHash = manifest => sha256(canonical({...manifest,version:visibleVersion(manifest.version),parent:null}));
export function fail(message, statusCode=400, code='invalid_package') { throw Object.assign(new Error(message),{statusCode,code}); }
export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
export function canonical(value) {
  if (value === null || typeof value === 'boolean' || typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number' && Number.isFinite(value)) return JSON.stringify(value);
  if (Array.isArray(value)) return '['+value.map(canonical).join(',')+']';
  if (value && typeof value === 'object') return '{'+Object.keys(value).sort().map(key=>JSON.stringify(key)+':'+canonical(value[key])).join(',')+'}';
  fail('清单包含无效 JSON 值');
}
export function keys(value, allowed, required=[]) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('需要 JSON 对象');
  for (const key of Object.keys(value)) if (!allowed.includes(key)) fail(`不支持字段：${key}`);
  for (const key of required) if (!Object.hasOwn(value,key)) fail(`缺少字段：${key}`);
}
function text(value, max, label, empty=false) {
  if (typeof value !== 'string' || value.length>max || (!empty && !value.trim()) || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) fail(`${label}无效`);
}
export function logicalPath(value) {
  text(value,160,'文件路径');
  if (!/^[A-Za-z0-9_./-]+$/.test(value) || value.split('/').some(p=>!p || p==='.' || p==='..' || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(p) || p.endsWith('.'))) fail('文件路径不安全');
  return value;
}
export function validateManifest(input) {
  const fields=['format','resource','type','version','parent','name','description','license','changelog','compatibility','entry','files','dependencies','bindings','permissions'];
  keys(input,[...fields,'preview','product'],fields);
  if (input.format!==FORMAT || !RESOURCE.test(input.resource) || !VERSION.test(input.version)) fail('资源身份、格式或版本无效');
  if (!SUPPORTED_TYPES.includes(input.type)) fail('不支持的资源类型',422,'unsupported_type');
  if (input.parent!==null && !HASH.test(input.parent)) fail('父版本摘要无效');
  text(input.name,80,'资源名称'); text(input.description,2000,'说明',true); text(input.license,80,'许可证'); text(input.changelog,4000,'更新说明',true);
  if(input.product!==undefined){
    if(input.type!=='model')fail('标准品信息仅适用于模型');
    keys(input.product,['isStandard','brand','model'],['isStandard']);
    if(typeof input.product.isStandard!=='boolean')fail('是否标准品必须为布尔值');
    if(input.product.isStandard){text(input.product.brand,120,'品牌');text(input.product.model,120,'型号');}
    else if(input.product.brand!==undefined||input.product.model!==undefined)fail('非标准品不应包含品牌和型号');
  }
  keys(input.compatibility,['protocol'],['protocol']);
  if (input.compatibility.protocol!==1) fail('不支持此协议版本',422,'incompatible');
  logicalPath(input.entry);
  if (!Array.isArray(input.files)||!input.files.length||input.files.length>LIMITS.files) fail('文件数量超限');
  const paths=new Set(); let total=0;
  for (const file of input.files) {
    keys(file,['path','sha256','size','mediaType'],['path','sha256','size','mediaType']); logicalPath(file.path);
    if (paths.has(file.path.toLowerCase())) fail('文件路径重复'); paths.add(file.path.toLowerCase());
    if (!HASH.test(file.sha256)||!Number.isSafeInteger(file.size)||file.size<1||file.size>LIMITS.file) fail('文件摘要或大小无效');
    if (!['application/json','model/gltf-binary','model/gltf+json','image/png','image/jpeg'].includes(file.mediaType)) fail('不支持的文件类型');
    total+=file.size;
  }
  if(input.preview!==undefined){logicalPath(input.preview);const image=input.files.find(f=>f.path===input.preview);if(!image||!['image/png','image/jpeg'].includes(image.mediaType)||image.size>512*1024)fail('预览图必须为不超过 512 KiB 的 PNG/JPEG');}
  const entry=input.files.find(f=>f.path===input.entry);
  if (!entry||entry.mediaType!=='application/json'||entry.size>LIMITS.entry||total>LIMITS.package) fail('入口文件无效或包过大');
  if (!Array.isArray(input.dependencies)||input.dependencies.length>LIMITS.dependencies) fail('依赖数量超限');
  const deps=new Set();
  for (const dep of input.dependencies) {
    keys(dep,['resource','version','manifestSha256'],['resource','version','manifestSha256']);
    if (!RESOURCE.test(dep.resource)||!VERSION.test(dep.version)||!HASH.test(dep.manifestSha256)||dep.resource===input.resource||deps.has(dep.resource)) fail('依赖身份、版本或摘要无效');
    deps.add(dep.resource);
  }
  if (!Array.isArray(input.bindings)||input.bindings.length>(input.type==='sidebar-widget'?1:0)) fail('绑定槽位数量无效');
  for (const binding of input.bindings) {
    keys(binding,['key','kind','domains','multiple','required'],['key','kind','domains','multiple','required']);
    if(binding.key!=='primary'||binding.kind!=='entity'||typeof binding.multiple!=='boolean'||typeof binding.required!=='boolean'||!Array.isArray(binding.domains)||binding.domains.length>20||binding.domains.some(d=>typeof d!=='string'||!/^[a-z][a-z0-9_]{0,63}$/.test(d))) fail('绑定槽位定义无效');
  }
  const permissions=['model','motion','device-control','device-project'].includes(input.type)?[]:['entities.read'];
  if(JSON.stringify(input.permissions)!==JSON.stringify(permissions)) fail('权限声明与资源类型不一致');
  if(input.type==='sidebar-widget'&&input.bindings.length!==1) fail('侧栏控件需要 primary 绑定槽位');
  return JSON.parse(canonical(input));
}

export const WIDGET_FIELDS=['name','kind','scriptMode','entityDomain','entityAttribute','html','css','js'];
export const MODEL_FIELDS=['name','enabled','furnitureEnabled','furnitureKind','tags','source','dimensions','scale','anchor','placement','elevation','color','roughness','metalness','partLabels'];
export function portableWidget(widget) {
  if(widget.scriptMode==='dom'||widget.actions?.length) fail('第一阶段仅支持无设备控制动作的数据转换控件',422,'unsupported_widget');
  const result=Object.fromEntries(WIDGET_FIELDS.filter(k=>widget[k]!==undefined).map(k=>[k,widget[k]]));
  return {format:'ha3d-sidebar-widget-template-v1',widget:{...result,kind:'custom',scriptMode:'transform'}};
}
export function portableModel(model, asset=null) {
  const result=Object.fromEntries(MODEL_FIELDS.filter(k=>model[k]!==undefined).map(k=>[k,model[k]]));
  result.source=model.source?.type==='upload'?{type:'upload'}:{type:'procedural',shape:model.source?.shape||'box'};
  return {format:'ha3d-model-v1',model:result,asset};
}
export function validateEntry(manifest, bytes) {
  if(bytes.length>LIMITS.entry) fail('入口文件过大');
  let payload; try{payload=JSON.parse(bytes.toString('utf8'));}catch{fail('入口不是有效 JSON');}
  if(manifest.type==='sidebar-widget') {
    keys(payload,['format','widget'],['format','widget']);
    if(payload.format!=='ha3d-sidebar-widget-template-v1') fail('侧栏入口格式无效');
    const w=payload.widget; keys(w,WIDGET_FIELDS,['name','kind','scriptMode','html','css','js']);
    if(w.kind!=='custom'||w.scriptMode!=='transform') fail('只支持 Worker 数据转换控件');
    text(w.name,80,'控件名称');text(w.html,24000,'HTML',true);text(w.css,24000,'CSS',true);text(w.js,900000,'JS',true);
    text(w.entityAttribute??'',80,'实体属性',true);text(w.entityDomain??'',80,'实体领域',true);
    if(w.entityDomain&&!/^[a-z][a-z0-9_]{0,63}$/.test(w.entityDomain)) fail('实体领域无效');
    const domains=manifest.bindings[0].domains;
    if(w.entityDomain && !domains.includes(w.entityDomain)) fail('控件领域与绑定槽位不一致');
    // Templates can contain arbitrary text/code. This structural check is not a claim of automatic redaction.
  } else if(manifest.type==='model') {
    keys(payload,['format','model','asset'],['format','model','asset']);
    if(payload.format!=='ha3d-model-v1') fail('模型入口格式无效');
    const m=payload.model; keys(m,MODEL_FIELDS,['name','source','dimensions']); text(m.name,80,'模型名称');
    keys(m.source,['type','shape'],['type']);
    if(!['procedural','upload'].includes(m.source.type)) fail('模型来源无效');
    keys(m.dimensions,['width','depth','height'],['width','depth','height']);
    for(const n of Object.values(m.dimensions)) if(!Number.isFinite(n)||n<0.05||n>20) fail('模型尺寸无效');
    if(m.source.type==='upload') {
      logicalPath(payload.asset);
      const asset=manifest.files.find(f=>f.path===payload.asset);
      if(!asset||!['model/gltf-binary','model/gltf+json'].includes(asset.mediaType)||asset.size>15*1024*1024) fail('模型文件缺失、类型错误或超过 15 MiB');
    } else {
      if(payload.asset!==null||typeof m.source.shape!=='string'||!/^[a-z][a-z0-9_-]{0,80}$/.test(m.source.shape)) fail('程序化模型定义无效');
    }
    if(m.tags!==undefined&&(!Array.isArray(m.tags)||m.tags.length>12||m.tags.some(t=>typeof t!=='string'||t.length>80))) fail('模型标签无效');
    for(const key of ['enabled','furnitureEnabled'])if(m[key]!==undefined&&typeof m[key]!=='boolean')fail('模型开关格式无效');
    for(const [key,min,max]of [['scale',0.01,100],['elevation',0,12],['roughness',0,1],['metalness',0,1]])if(m[key]!==undefined&&(!Number.isFinite(m[key])||m[key]<min||m[key]>max))fail('模型渲染参数无效');
    if(m.furnitureKind!==undefined)text(m.furnitureKind,80,'家具类型');
    if(m.placement!==undefined&&!['floor','wall','ceiling','surface'].includes(m.placement))fail('模型摆放类型无效');
    if(m.color!==undefined&&(typeof m.color!=='string'||!/^#[a-f0-9]{6}$/i.test(m.color)))fail('模型颜色无效');
    if(m.anchor!==undefined){keys(m.anchor,['x','y','z']);for(const n of Object.values(m.anchor))if(!Number.isFinite(n)||Math.abs(n)>20)fail('模型锚点无效');}
    if(m.partLabels!==undefined){if(!m.partLabels||typeof m.partLabels!=='object'||Array.isArray(m.partLabels)||Object.keys(m.partLabels).length>256)fail('模型部件标签无效');for(const [p,label]of Object.entries(m.partLabels)){if(!/^root(?:\/[0-9]+)*$/.test(p)||p.length>1024||typeof label!=='string'||label.length>80)fail('模型部件标签无效');}}
  }
  if(['device-control','motion','device-project'].includes(manifest.type)){
    try{validateAdditionalEntry(manifest.type,payload);}catch(error){fail(error.message);}
    if(manifest.type==='device-project'&&payload.model)validateEntry({...manifest,type:'model'},Buffer.from(canonical(payload.model)));
  }
  return payload;
}

export function validateModelBytes(bytes, mediaType) {
  let model;
  try {
    if(mediaType==='model/gltf-binary') {
      if(bytes.length<20||bytes.toString('ascii',0,4)!=='glTF'||bytes.readUInt32LE(4)!==2||bytes.readUInt32LE(8)!==bytes.length) fail('GLB 头无效');
      let offset=12;let first=true,hasBinary=false;
      while(offset<bytes.length){
        if(offset+8>bytes.length)fail('GLB 分块不完整');
        const length=bytes.readUInt32LE(offset), type=bytes.readUInt32LE(offset+4);offset+=8;
        if(length%4||offset+length>bytes.length)fail('GLB 分块长度无效');
        if(first){if(type!==0x4e4f534a)fail('GLB 缺少 JSON');model=JSON.parse(bytes.toString('utf8',offset,offset+length).trim());}
        else {if(type!==0x004e4942||hasBinary)fail('GLB 包含重复或不支持的分块');hasBinary=true;}
        offset+=length;first=false;
      }
    } else if(mediaType==='model/gltf+json') model=JSON.parse(bytes.toString('utf8'));
    else fail('未知模型类型');
    if(model?.asset?.version!=='2.0') fail('仅支持 glTF 2.0');
    // Check extension structures too; disallow network/file references anywhere named uri/url.
    const scan=(value,depth=0)=>{if(depth>64)fail('模型结构过深');if(!value||typeof value!=='object')return;for(const [key,v]of Object.entries(value)){if((key==='uri'||key==='url')&&typeof v==='string'&&!/^data:(?:application\/octet-stream|application\/gltf-buffer|image\/(?:png|jpeg|webp));base64,[A-Za-z0-9+/]*={0,2}$/.test(v))fail('模型必须自包含，不能引用外部文件');scan(v,depth+1);}};
    scan(model);
  } catch(error) { if(error.statusCode)throw error;fail('模型文件内容无效'); }
}

export async function resolveDependencies(root, readRelease) {
  const result=[],visited=new Map(),active=new Set();
  async function walk(release,depth) {
    if(depth>LIMITS.depth)fail('依赖层级超限');
    const {manifest,manifestSha256}=release;validateManifest(manifest);
    if(sha256(canonical(manifest))!==manifestSha256)fail('依赖清单摘要不匹配');
    if(active.has(manifest.resource))fail('依赖循环');
    if(visited.has(manifest.resource)) {if(visited.get(manifest.resource)!==manifestSha256)fail('依赖版本冲突');return;}
    if(visited.size>=LIMITS.nodes)fail('依赖节点超限');
    visited.set(manifest.resource,manifestSha256);active.add(manifest.resource);
    for(const dep of manifest.dependencies){const item=await readRelease(dep.resource,dep.version);if(!item||item.manifestSha256!==dep.manifestSha256)fail('依赖缺失或摘要不匹配');await walk(item,depth+1);}
    active.delete(manifest.resource);result.push(release);
  }
  await walk(root,0);return result;
}

export function validatePreviewBytes(bytes,mediaType){
  if(bytes.length>512*1024)fail('预览图过大');
  if(mediaType==='image/png'){
    if(bytes.length<24||!bytes.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex'))||bytes.toString('ascii',12,16)!=='IHDR')fail('PNG 预览图无效');
    const w=bytes.readUInt32BE(16),h=bytes.readUInt32BE(20);if(!w||!h||w>4096||h>4096)fail('预览图尺寸超限');
  }else if(mediaType==='image/jpeg'){
    if(bytes.length<4||bytes[0]!==255||bytes[1]!==216||bytes[2]!==255)fail('JPEG 预览图无效');
  }else fail('预览图类型无效');
  return bytes;
}
