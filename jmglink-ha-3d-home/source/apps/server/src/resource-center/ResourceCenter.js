import {installPortableResource} from './install-portable.js';
import {ADDITIONAL_TYPES,buildPortableSource,portableSourceKey,portableSyncSources,requireStandaloneResource,samePortableSnapshot} from './portable-resources.js';
import {githubBlobResponse} from './github-downloads.js';
import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import path from 'node:path';
import {randomBytes,randomUUID} from 'node:crypto';
import {FORMAT,HASH,RESOURCE,VERSION,LIMITS,fail,sha256,canonical,validateManifest,validateEntry,validateModelBytes,portableWidget,portableModel,resourceContentHash} from '../../../../packages/resource-protocol/index.js';
import {normalizeModelTemplate} from '../device-platform/devicePlatformSchema.js';
import {normalizeSidebar} from '../../../../packages/schema/src/sidebar.js';
import {defaultResourceSharing,normalizeResourceSharing} from '../../../../packages/schema/src/resource-sharing.js';

const jsonBytes=value=>Buffer.from(canonical(value));
const clean=value=>JSON.parse(JSON.stringify(value));
function syncFingerprint(manifest,previewMode){
  if(previewMode==='manual')return resourceContentHash(manifest);
  const content={...manifest,files:manifest.files.filter(f=>f.path!==manifest.preview)};
  delete content.preview;
  return resourceContentHash(content);
}
function isWithdrawnHead(job, head) {
  return !!job.manifestSha256 && head?.manifestSha256 === job.manifestSha256 && head.status === 'withdrawn';
}
export function resourceCenterOrigin(value){
  if(!value)return null;
  let url;try{url=new URL(value);}catch{fail('资源中心地址无效');}
  if(url.username||url.password||url.search||url.hash||url.pathname!=='/'||!(url.protocol==='https:'||(url.protocol==='http:'&&['127.0.0.1','localhost','[::1]'].includes(url.hostname))))fail('资源中心必须为 HTTPS 根地址；回环开发地址可用 HTTP');
  return url.origin;
}
async function boundedResponse(response,limit){
  const declared=Number(response.headers.get('content-length')||0);if(declared>limit){await response.body?.cancel();fail('资源中心响应超过限制',502);}
  const chunks=[];let size=0;
  for await(const chunk of response.body||[]){size+=chunk.length;if(size>limit)fail('资源中心响应超过限制',502);chunks.push(chunk);}
  return Buffer.concat(chunks);
}
async function atomicJson(file,value){
  const temporary=`${file}.next`;
  await writeFile(temporary,JSON.stringify(value,null,2),{mode:0o600});
  // Windows virus/index scanners can briefly hold the destination without delete sharing.
  for(let attempt=0;;attempt++){
    try{await rename(temporary,file);break;}
    catch(error){if(!['EPERM','EBUSY','EACCES'].includes(error.code)||attempt>=5)throw error;await new Promise(resolve=>setTimeout(resolve,25*2**attempt));}
  }
}
export class ResourceCenter {
  constructor({origin,directory,platform,sidebars,projects,fetchImpl=fetch,clock=Date.now,defaultUser=false}){
    this.silentUpload=false;this.installationUser=resourceCenterOrigin(origin)==='https://resources.700117.xyz';this.defaultUser=defaultUser;this.defaultLogin=null;this.defaultUserError='';
    if(defaultUser&&(!origin||!['127.0.0.1','localhost','[::1]'].includes(new URL(origin).hostname)))throw Error('默认用户仅用于本机体验环境');
    this.origin=resourceCenterOrigin(origin);this.directory=directory;this.platform=platform;this.sidebars=sidebars;this.projects=projects;this.fetch=fetchImpl;this.clock=clock;this.session=null;this.installations={};this.publications={};this.queue=Promise.resolve();this.pending=null;this.prepared=new Map();this.outbox={};this.syncQueue=Promise.resolve();this.publicationQueue=Promise.resolve();this.draining=null;this.retryTimer=null;this.stopped=false;
  }
  static async create(options){
    const store=new ResourceCenter(options);await mkdir(store.directory,{recursive:true,mode:0o700});await mkdir(path.join(store.directory,'objects'),{recursive:true});
    for(const [file,field]of [['session.json','session'],['installations.json','installations'],['publications.json','publications'],['outbox.json','outbox'],['silent-upload.json','silentUpload']]){
      try{store[field]=JSON.parse(await readFile(path.join(store.directory,file),'utf8'));}catch(e){if(e.code!=='ENOENT')throw Error('资源中心本地记录损坏，请检查备份');}
    }
    if(store.session?.origin!==store.origin)store.session=null;
    if(store.session?.isDefault&&!store.defaultUser&&!store.installationUser)store.session=null;
    return store;
  }
  serial(task){const next=this.queue.catch(()=>{}).then(task);this.queue=next;return next;}
  serialSync(task){const next=this.syncQueue.catch(()=>{}).then(task);this.syncQueue=next;return next;}
  persistPublications(){const next=this.publicationQueue.catch(()=>{}).then(()=>atomicJson(path.join(this.directory,'publications.json'),this.publications));this.publicationQueue=next;return next;}
  async setSilentUpload(value){
    if(typeof value!=='boolean')fail('静默上传必须为布尔值');
    return this.serialSync(async()=>{
      await atomicJson(path.join(this.directory,'silent-upload.json'),value);
      this.silentUpload=value;
      if(value)this.wakeSync();
      return {silentUpload:value};
    });
  }
  status(){return {silentUpload:this.silentUpload===true,configured:!!this.origin,origin:this.origin,loggedIn:!!(this.session&&this.session.expiresAt>this.clock()),defaultUserEnabled:this.defaultUser,isDefaultUser:!!this.session?.isDefault,defaultUserError:this.defaultUserError,user:this.session?.user||null,syncJobs:Object.values(this.outbox).filter(j=>(!j.origin||j.origin===this.origin)).map(({id,name,state,error,version,owner})=>({id,name,state,error,version,owner})),installations:Object.values(this.installations).filter(i=>i.origin===this.origin)};}
  async installationKey(){
    const file=path.join(this.directory,'installation.key');
    try{return await readFile(file,'utf8');}
    catch(error){if(error.code!=='ENOENT')throw error;}
    const key=randomBytes(32).toString('base64url');
    try{await writeFile(file,key,{flag:'wx',mode:0o600});return key;}
    catch(error){if(error.code!=='EEXIST')throw error;return readFile(file,'utf8');}
  }
  async ensureDefaultUser(){
    if((!this.defaultUser&&!this.installationUser)||this.session?.expiresAt>this.clock())return;
    if(this.defaultLogin)return this.defaultLogin;
    this.defaultLogin=this.serial(async()=>{
      if(this.session?.expiresAt>this.clock())return;
      try{
        const key=this.installationUser ? await this.installationKey() : null;
        const username=key ? 'client-'+sha256('installation:'+key).slice(0,24) : 'desktop-default';
        const result=await this.request(key?'/v1/auth/installation':'/v1/auth/default-user',{method:'POST',body:key?{key}:{},anonymous:true});
        if(!/^[A-Za-z0-9_-]{43}$/.test(result.accessToken)||!Number.isFinite(result.expiresIn)||result.expiresIn<=0||result.user?.username!==username||result.user.role!=='user')fail('默认用户响应无效',502);
        this.session={origin:this.origin,accessToken:result.accessToken,expiresAt:this.clock()+Math.min(result.expiresIn,30*86400)*1000,user:{username:result.user.username,role:result.user.role},isDefault:true};
        await atomicJson(path.join(this.directory,'session.json'),this.session);this.defaultUserError='';
      }catch(error){this.defaultUserError=error.message;}
    }).finally(()=>{this.defaultLogin=null;});
    return this.defaultLogin;
  }
  async request(route,{method='GET',body,anonymous=false,binary=false,limit=2*1024*1024}={}){
    if(!this.origin)fail('请先配置 HA3D_RESOURCE_CENTER_URL',503,'not_configured');
    if(!route.startsWith('/v1/')||route.includes('://'))fail('资源中心接口无效');
    const catalogRead = method === 'GET' && /^\/v1\/(?:resources(?:[/?]|$)|(?:blobs|previews)\/)/.test(route);
    if (catalogRead && !this.status().loggedIn) anonymous = true;
    if(!anonymous&&(!this.session||this.session.expiresAt<=this.clock()))fail('请先登录资源中心',401,'not_logged_in');
    const requestSession=this.session;
    let response;
    try{response=await this.fetch(this.origin+route,{method,redirect:'error',signal:AbortSignal.timeout(binary?150000:30000),headers:{...(anonymous?{}:{Authorization:`Bearer ${this.session.accessToken}`}),...(body===undefined?{}:{'Content-Type':Buffer.isBuffer(body)?'application/octet-stream':'application/json'})},body:body===undefined?undefined:Buffer.isBuffer(body)?body:JSON.stringify(body)});}
    catch{fail('无法连接资源中心，请检查地址或网络',502,'center_unreachable');}
    const bytes=await boundedResponse(response,response.ok?limit:65536);
    if(!response.ok){let error;try{error=JSON.parse(bytes.toString());}catch{}if(response.status===401&&!anonymous&&this.session===requestSession){this.session=null;await atomicJson(path.join(this.directory,'session.json'),null);}fail(error?.error||'资源中心请求失败',response.status,error?.code||'remote_error');}
    if(binary)return bytes;
    try{return JSON.parse(bytes.toString('utf8'));}catch{fail('资源中心返回了无效内容',502,'invalid_response');}
  }
  async startLogin(){
    return this.serial(async()=>{
      const result=await this.request('/v1/auth/device',{method:'POST',body:{},anonymous:true});
      if(typeof result.deviceCode!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(result.deviceCode)||!/^[A-F0-9]{10}$/.test(result.userCode))fail('资源中心授权响应无效',502);
      const expiresIn=Math.min(600,Number(result.expiresIn)||600),interval=Math.max(5,Number(result.interval)||5);
      this.pending={code:result.deviceCode,expiresAt:this.clock()+expiresIn*1000,nextPoll:this.clock()+interval*1000,interval};
      return {userCode:result.userCode,verificationUri:this.origin+'/account',expiresIn,interval};
    });
  }
  async finishLogin(){
    return this.serial(async()=>{
      if(!this.pending||this.pending.expiresAt<=this.clock()){this.pending=null;fail('登录授权已过期，请重新登录',400,'expired_device_code');}
      if(this.pending.nextPoll>this.clock())fail('请稍后再检查授权',429,'slow_down');
      this.pending.nextPoll=this.clock()+this.pending.interval*1000;
      const result=await this.request('/v1/auth/device/token',{method:'POST',body:{deviceCode:this.pending.code},anonymous:true});
      if(!/^[A-Za-z0-9_-]{43}$/.test(result.accessToken)||!Number.isFinite(result.expiresIn)||result.expiresIn<=0)fail('登录响应无效',502);
      this.session={origin:this.origin,accessToken:result.accessToken,expiresAt:this.clock()+Math.min(result.expiresIn,30*86400)*1000};this.pending=null;
      const {user}=await this.request('/v1/auth/me');this.session.user={username:user.username,role:user.role};
      await atomicJson(path.join(this.directory,'session.json'),this.session);this.wakeSync();return this.status();
    });
  }
  async logout(){await this.serial(async()=>{if(this.session)await this.request('/v1/auth/logout',{method:'POST',body:{}});this.session=null;this.pending=null;await atomicJson(path.join(this.directory,'session.json'),null);});await this.ensureDefaultUser();this.wakeSync();return this.status();}
  scope(projectId,floorId){
    const project=this.projects.getProject(projectId);if(!project)fail('本地户型不存在',404);
    return this.sidebars.floorKey(project,floorId);
  }
  sources(){
    const models=this.platform.getModelTemplates().map(m=>({id:m.id,name:m.name,model:clean(m)}));
    const sidebars=[],targets=[];
    for(const summary of this.projects.listProjects()){
      const project=this.projects.getProject(summary.id);
      for(const floor of project.floors||[]){const scope=this.sidebars.floorKey(project,floor.id),entry=this.sidebars.get(scope);targets.push({projectId:project.id,floorId:floor.id,name:`${project.name} / ${floor.name}`});for(const w of entry.draft.widgets)sidebars.push({id:w.id,name:w.name,projectId:project.id,floorId:floor.id,location:`${project.name} / ${floor.name}`,supported:true,widget:portableWidget(clean(w)).widget});}
    }
    return {models,sidebars,targets};
  }
  async prepare(input){return this.serial(()=>this.prepareResource(input));}
  async prepareResource(input,{offline=false,sourceSnapshot,assetSnapshot,author=this.session?.user?.username||'local'}={}){
    requireStandaloneResource(input.type,input.sourceKind);
    if(!offline&&!this.session?.user)fail('请先登录资源中心',401);
    let entry,asset=null,extraAssets=[];
    if(input.type==='model'){
      const model=sourceSnapshot||this.platform.getModelTemplates().find(m=>m.id===input.sourceId);if(!model)fail('模型不存在',404);
      const file=assetSnapshot===undefined?await this.platform.exportModelAsset(model):assetSnapshot;
      if(model.source?.type==='upload'&&!file)fail('模型文件缺失');
      if(file){asset={path:file.mimeType==='model/gltf+json'?'model.gltf':'model.glb',bytes:Buffer.from(file.dataBase64,'base64'),mediaType:file.mimeType};validateModelBytes(asset.bytes,asset.mediaType);}
      entry=portableModel(clean(model),asset?.path||null);
    }else if(input.type==='sidebar-widget'){
      const scope=this.scope(input.projectId,input.floorId),w=sourceSnapshot||this.sidebars.get(scope).draft.widgets.find(w=>w.id===input.sourceId);if(!w)fail('侧栏控件不存在',404);
      entry=portableWidget(clean(w));
    }else if(ADDITIONAL_TYPES.includes(input.type)){const source=sourceSnapshot||await buildPortableSource(this,input);entry=source.entry;extraAssets=source.assets;}else fail('不支持的资源类型',422);
    const entryPath=({model:'model.json','sidebar-widget':'widget.json','device-control':'control.json',motion:'motion.json','device-project':'device.json'})[input.type],entryBytes=jsonBytes(entry);
    const sourceIdentity=ADDITIONAL_TYPES.includes(input.type)?(input.sourceKind||'')+':'+input.sourceId:input.sourceId;
    const identity=sha256(canonical([this.origin,author,input.type,sourceIdentity,input.type==='sidebar-widget'?this.scope(input.projectId,input.floorId):'']));
    const localIdentity=sha256(canonical(['automatic',input.type,sourceIdentity,input.type==='sidebar-widget'?this.scope(input.projectId,input.floorId):'']));
    let slug=input.slug||this.publications[identity]||(offline?this.publications[localIdentity]:null);
    if(!slug&&!offline){
      // Reuse an unambiguous legacy publication of the same portable content.
      const matches=new Set();let offset=0;
      do{const page=await this.request('/v1/submissions?offset='+offset);for(const item of page.items||[]){const m=item.manifest;if(m.type===input.type&&m.files.find(f=>f.path===m.entry)?.sha256===sha256(entryBytes)){const legacy=m.resource.split('/')[1];if(!Object.values(this.publications).includes(legacy))matches.add(legacy);}}offset=page.nextOffset;}while(offset!==null&&offset!==undefined&&offset<=10000);
      slug=matches.size===1?[...matches][0]:'r-'+randomUUID();
    }
    slug||='r-'+randomUUID();
    const resource=`${author}/${slug}`;
    if(!RESOURCE.test(resource))fail('资源标识无效');
    const history=offline?{items:[]}:await this.request('/v1/submissions?resource='+encodeURIComponent(resource));
    const parent=input.parent??history.items?.[0]?.manifestSha256??null;
    const objects=[{path:entryPath,bytes:entryBytes,mediaType:'application/json'},...(asset?[asset]:[]),...extraAssets];
    let preview;
    if(input.previewDataUrl){
      const match=/^data:(image\/(?:png|jpeg));base64,([A-Za-z0-9+/]+={0,2})$/.exec(input.previewDataUrl);
      if(!match||match[2].length>700000)fail('预览图格式或大小无效');
      const bytes=Buffer.from(match[2],'base64');
      if(bytes.length>512*1024||!(match[1]==='image/png'?bytes.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex')):bytes[0]===255&&bytes[1]===216&&bytes[2]===255))fail('预览图内容无效');
      preview=match[1]==='image/png'?'preview.png':'preview.jpg';objects.push({path:preview,mediaType:match[1],bytes});
    }
    const manifest=validateManifest({...(input.product!==undefined?{product:input.product}:{}),...preview?{preview}:{},format:FORMAT,resource,type:input.type,version:input.version,parent,name:input.name||entry.model?.name||entry.widget?.name||entry.control?.name||entry.panel?.name||entry.motion?.name||entry.project?.name,description:input.description||'',license:input.license||'GPL-3.0-only',changelog:input.changelog||'',compatibility:{protocol:1},entry:entryPath,files:objects.map(f=>({path:f.path,sha256:sha256(f.bytes),size:f.bytes.length,mediaType:f.mediaType})),dependencies:[],bindings:input.type!=='sidebar-widget'?[]:[{key:'primary',kind:'entity',domains:entry.widget.entityDomain?[entry.widget.entityDomain]:[],multiple:true,required:false}],permissions:input.type!=='sidebar-widget'?[]:entry.widget.actions?.length?['entities.read','actions.invoke']:['entities.read']});
    validateEntry(manifest,entryBytes);
    if(this.publications[identity]!==slug||(offline&&this.publications[localIdentity]!==slug)){this.publications[identity]=slug;if(offline)this.publications[localIdentity]=slug;await this.persistPublications();}
    const id=randomUUID();for(const [key,value]of this.prepared)if(value.expiresAt<=this.clock())this.prepared.delete(key);
    if(this.prepared.size>=4)fail('待发布资源过多，请先完成已有发布',429);
    this.prepared.set(id,{manifest,objects,expiresAt:this.clock()+15*60000,username:this.session?.user?.username});
    return {preparedId:id,manifest,entry,manifestSha256:sha256(canonical(manifest)),removedBindings:true};
  }
  preparedItem(id){const value=this.prepared.get(id);if(!value||value.expiresAt<=this.clock()||value.username!==this.session?.user?.username)fail('发布预览已过期，请重新准备');return value;}
  transfer(id){const {manifest,objects}=this.preparedItem(id);return {format:'ha3d-resource-transfer-v1',manifest,objects:objects.map(f=>({sha256:sha256(f.bytes),dataBase64:f.bytes.toString('base64')}))};}
  async publish(id,reviewed){
    if(reviewed!==true)fail('请先检查资源代码和隐私内容');
    const {manifest,objects}=this.preparedItem(id),result=await this.request('/v1/blobs/check',{method:'POST',body:{hashes:manifest.files.map(f=>f.sha256)}});
    const available=new Set(result.available||[]);let uploadedBytes=0;
    for(const file of objects){const hash=sha256(file.bytes);if(!available.has(hash)){await this.request('/v1/blobs/'+hash,{method:'PUT',body:file.bytes});uploadedBytes+=file.bytes.length;available.add(hash);}}
    const release=await this.request('/v1/releases',{method:'POST',body:manifest});this.prepared.delete(id);return {...release,uploadedBytes};
  }
  // Capture immutable bytes locally before any remote request. Local saves never wait for the network.
  async enqueue(input,savedSource,savedFile){
    if(input.automatic && !this.silentUpload)return {skipped:true};
    requireStandaloneResource(input.type,input.sourceKind);
    const source=savedSource||(input.type==='model'?this.platform.getModelTemplates().find(m=>m.id===input.sourceId):this.sidebars.get(this.scope(input.projectId,input.floorId)).draft.widgets.find(w=>w.id===input.sourceId));
    if(!source?.resourceSharing)return {skipped:true};
    const sourceKey=sha256(canonical([input.type,input.sourceId,input.projectId||'',input.floorId||'']));
    const previousSource=Object.values(this.outbox).filter(j=>(!j.origin||j.origin===this.origin)&&j.sourceKey===sourceKey).at(-1);
    const owner=(this.session?.expiresAt>this.clock()?this.session.user?.username:null)||(this.defaultUser?'desktop-default':previousSource?.owner||null);
    const sourceSnapshot=clean(source);
    const assetSnapshot=input.type==='model'?(savedFile?.dataUrl?{mimeType:source.source.mimeType,dataBase64:savedFile.dataUrl.split(',')[1]}:await this.platform.exportModelAsset(sourceSnapshot)):undefined;
    return this.serialSync(async()=>{
    if(input.automatic && !this.silentUpload)return {skipped:true};
    const metadata=sourceSnapshot.resourceSharing;
    const prepared=await this.prepareResource({...input,...metadata,...(input.type==='model'?{product:metadata.product}:{product:undefined}),changelog:'自动同步开发内容'},{offline:true,sourceSnapshot,assetSnapshot,author:owner||'local'});
    const snapshot=this.prepared.get(prepared.preparedId);this.prepared.delete(prepared.preparedId);
    const fingerprint=syncFingerprint(snapshot.manifest,metadata.previewMode);
    const previous=Object.values(this.outbox).filter(j=>(!j.origin||j.origin===this.origin)&&j.sourceKey===sourceKey&&j.owner===owner).at(-1);
    const fillsMissingPreview=!!snapshot.manifest.preview&&!previous?.manifest.preview;
    const duplicate=previous?.fingerprint===fingerprint&&previous.state!=='superseded'&&!fillsMissingPreview;
    let withdrawn=false;
    if(input.automatic && duplicate&&previous.state==='submitted'&&previous.manifestSha256){
      if(this.session?.user?.username!==owner)fail('请使用原账号继续同步',401);
      const history=await this.request('/v1/submissions?resource='+encodeURIComponent(previous.manifest.resource));
      if(this.session?.user?.username!==owner)fail('账号已变更，请使用原账号继续同步',409);
      withdrawn=history.items?.some(item=>item.manifestSha256===previous.manifestSha256&&item.status==='withdrawn')||false;
    }
    if(duplicate&&!withdrawn&&(input.automatic||previous.state!=='submitted')&&previous.state!=='blocked'){if(!input.automatic){previous.automatic=false;await this.saveOutbox();}this.wakeSync();return {id:previous.id,state:previous.state};}
    for(const object of snapshot.objects)await writeFile(path.join(this.directory,'objects',sha256(object.bytes)),object.bytes,{mode:0o600});
    const id=randomUUID(),job={id,automatic:!!input.automatic,origin:this.origin,owner,sourceKey,fingerprint,previewMode:metadata.previewMode||'auto',name:snapshot.manifest.name,manifest:duplicate && previous.state==='submitted' ? previous.manifest : snapshot.manifest,state:'queued',attempts:0,nextAttempt:0,error:'',version:metadata.version};
    if(previous?.state==='blocked'||withdrawn)previous.state='superseded';
    this.outbox[id]=job;await this.saveOutbox();this.wakeSync();return {id,state:job.state};
  });}
  saveOutbox(){return atomicJson(path.join(this.directory,'outbox.json'),this.outbox);}
  async syncModelLibrary(input){
    if(input.automatic && !this.silentUpload)return {items:[]};
    if(!this.origin)fail('请先配置资源中心',503);
    const owner=()=>this.session?.expiresAt>this.clock()?this.session.user?.username||null:this.defaultUser?'desktop-default':null;
    const checkOwner=()=>{if(input.expectedOwner!==undefined&&input.expectedOwner!==owner())fail('账号已变更，请使用原账号继续同步',409);};
    checkOwner();
    if(!Array.isArray(input.models)||input.models.length>100)fail('一次最多同步 100 个模型');
    const ids=new Set(),snapshots=[];
    // Validate the entire batch before adding metadata or queuing any model.
    for(const entry of input.models){
      if(!entry||typeof entry.id!=='string'||ids.has(entry.id))fail('模型列表存在无效或重复标识');
      ids.add(entry.id);
      const current=this.platform.getModelTemplates().find(model=>model.id===entry.id);
      if(!current)fail('模型不存在，请刷新后重试',409);
      if(current.builtin||current.library&&!current.resourceSharing)fail('该模型不参与自动同步',422);
      if(!entry.sourceSnapshot||canonical(clean(current))!==canonical(clean(entry.sourceSnapshot)))fail('模型已被其他终端修改，请刷新后重试',409);
      const metadata=normalizeResourceSharing({...current.resourceSharing||defaultResourceSharing(),previewDataUrl:entry.previewDataUrl});
      if(!metadata.previewDataUrl)fail('模型缺少预览图');
      const bytes=Buffer.from(metadata.previewDataUrl.split(',')[1],'base64');
      if(bytes.length>512*1024||!(metadata.previewDataUrl.startsWith('data:image/png;')?bytes.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex')):bytes[0]===255&&bytes[1]===216&&bytes[2]===255))fail('模型预览图内容无效');
      snapshots.push({original:clean(current),model:{...clean(current),resourceSharing:metadata}});
    }
    const items=[];
    for(const {original,model} of snapshots){
      try{
        checkOwner();
        const current=this.platform.getModelTemplates().find(item=>item.id===model.id);
        if(!current||canonical(clean(current))!==canonical(original))fail('模型已被其他终端修改，请刷新后重试',409);
        const saved=await this.platform.upsertModelTemplate(model);
        const sync=await this.enqueue({automatic:input.automatic===true,type:'model',sourceId:saved.id},saved);
        items.push({id:saved.id,name:saved.name,...sync});
      }catch(error){items.push({id:model.id,name:model.name,state:'blocked',error:error.message});}
    }
    return {items};
  }
  async syncSidebarLibrary(input){
    if(input.automatic && !this.silentUpload)return {items:[]};
    if(!this.origin)fail('请先配置资源中心',503);
    if(!Array.isArray(input.widgets)||input.widgets.length>100)fail('一次最多同步 100 个侧栏控件');
    const scope=this.scope(input.projectId,input.floorId),saved=this.sidebars.get(scope),ids=new Set(),snapshots=[];
    const check=()=>{
      if(this.sidebars.get(scope).revision!==input.revision)fail('侧栏已被修改，等待重新同步',409);
      const owner=this.session?.expiresAt>this.clock()?this.session.user?.username||null:this.defaultUser?'desktop-default':null;
      if(input.expectedOwner!==undefined&&input.expectedOwner!==owner)fail('账号已变更，请使用原账号继续同步',409);
    };
    check();
    for(const entry of input.widgets){
      if(!entry||typeof entry.id!=='string'||ids.has(entry.id))fail('侧栏列表存在无效或重复标识');ids.add(entry.id);
      const widget=saved.draft.widgets.find(item=>item.id===entry.id);
      if(!widget)fail('该控件不参与自动同步',422);
      if(!entry.sourceSnapshot||canonical(clean(widget))!==canonical(clean(entry.sourceSnapshot)))fail('控件已被修改，等待重新同步',409);
      const metadata=normalizeResourceSharing({...widget.resourceSharing||defaultResourceSharing(),previewDataUrl:entry.previewDataUrl});
      if(!metadata.previewDataUrl)fail('控件缺少预览图');
      const bytes=Buffer.from(metadata.previewDataUrl.split(',')[1],'base64');
      if(bytes.length>512*1024||!(metadata.previewDataUrl.startsWith('data:image/png;')?bytes.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex')):bytes[0]===255&&bytes[1]===216&&bytes[2]===255))fail('控件预览图内容无效');
      snapshots.push({...clean(widget),resourceSharing:metadata});
    }
    const items=[];
    for(const widget of snapshots){
      try{
        check();
        const project=this.projects.getProject(input.projectId),floorId=input.floorId||project.floors[0]?.id;
        const sync=await this.enqueue({automatic:input.automatic===true,type:'sidebar-widget',sourceId:widget.id,projectId:input.projectId,floorId},widget);
        items.push({id:widget.id,name:widget.name,...sync});
      }catch(error){items.push({id:widget.id,name:widget.name,state:'blocked',error:error.message});}
    }
    return {items};
  }
  wakeSync(delay=0){
    if(this.stopped)return;clearTimeout(this.retryTimer);
    this.retryTimer=setTimeout(()=>{this.drainSync().catch(()=>{}).finally(()=>{if(!this.stopped)this.wakeSync(30000);});},delay);this.retryTimer.unref?.();
  }
  stopSync(){this.stopped=true;clearTimeout(this.retryTimer);return this.draining;}
  async retrySync(){await this.serialSync(async()=>{for(const j of Object.values(this.outbox))if((!j.origin||j.origin===this.origin)&&!['submitted','superseded'].includes(j.state)&&(!j.owner||j.owner===this.session?.user?.username)){j.state='queued';j.nextAttempt=0;j.error='';}await this.saveOutbox();});this.wakeSync();return this.status();}
  drainSync(){
    if(this.draining)return this.draining;
    this.draining=this.runSync().finally(()=>{this.draining=null;});return this.draining;
  }
  async readSyncObject(file) {
    if (!file || !HASH.test(file.sha256)) fail('本地同步快照损坏',409,'corrupt_snapshot');
    const bytes = await readFile(path.join(this.directory,'objects',file.sha256));
    if (bytes.length !== file.size || sha256(bytes) !== file.sha256) fail('本地同步快照损坏',409,'corrupt_snapshot');
    return bytes;
  }
  async runSync(){
    await this.ensureDefaultUser();
    if(!this.status().loggedIn||!this.origin)return;
    const jobs=Object.values(this.outbox).filter(j=>(!j.origin||j.origin===this.origin)&&!['submitted','superseded'].includes(j.state)&&(!j.owner||j.owner===this.session.user.username));
    const waiting=new Set();
    for(const job of jobs){
      if(job.automatic && !this.silentUpload)continue;
      if(job.state==='blocked'){
        if(jobs.slice(jobs.indexOf(job)+1).some(next=>next.sourceKey===job.sourceKey)){await this.serialSync(async()=>{job.state='superseded';await this.saveOutbox();});}else waiting.add(job.sourceKey);
        continue;
      }
      if(waiting.has(job.sourceKey))continue;
      if(job.nextAttempt>this.clock()){waiting.add(job.sourceKey);continue;}
      if(this.stopped||!this.status().loggedIn||job.owner&&job.owner!==this.session.user.username)break;
      try{
        // Older outboxes keep both controls and panels under device-control.
        // Their immutable entry identifies the subtype even after the local panel is deleted.
        if (job.manifest.type === 'device-control') {
          const file = job.manifest.files.find(f => f.path === job.manifest.entry);
          const entry = validateEntry(job.manifest, await this.readSyncObject(file));
          if (entry.kind === 'panel') {
            await this.serialSync(async () => {
              job.state = 'superseded';
              job.error = '控制面板随完整设备一起分享';
              await this.saveOutbox();
            });
            continue;
          }
        }
        await this.serialSync(async()=>{job.origin||=this.origin;job.owner||=this.session.user.username;job.manifest.resource=job.owner+'/'+job.manifest.resource.split('/')[1];job.fingerprint=syncFingerprint(job.manifest,job.previewMode);job.state='uploading';await this.saveOutbox();});
        if(this.session?.user?.username!==job.owner)fail('账号已变更，请使用原账号同步',401);
        const available=new Set((await this.request('/v1/blobs/check',{method:'POST',body:{hashes:job.manifest.files.map(f=>f.sha256)}})).available||[]);
        for(const file of job.manifest.files){
          if(available.has(file.sha256))continue;
          const bytes=await this.readSyncObject(file);
          if(this.session?.user?.username!==job.owner)fail('账号已变更，请使用原账号同步',401);
          await this.request('/v1/blobs/'+file.sha256,{method:'PUT',body:bytes});
        }
        if(this.session?.user?.username!==job.owner)fail('账号已变更，请使用原账号同步',401);
        const result=await this.request('/v1/releases/auto',{method:'POST',body:{requestId:job.id,manifest:job.manifest}});
        await this.serialSync(async()=>{job.state='submitted';job.version=result.manifest.version;job.manifestSha256=result.manifestSha256;job.error='';await this.saveOutbox();});
      }catch(error){
        await this.serialSync(async()=>{job.attempts++;job.state=error.statusCode>=400&&error.statusCode<500&&![401,429].includes(error.statusCode)?'blocked':'queued';job.error=error.message;job.nextAttempt=this.clock()+Math.min(300000,15000*2**Math.min(job.attempts,5));await this.saveOutbox();});
        // Keep revisions ordered for each source; a failed older snapshot must not arrive after a newer one.
        waiting.add(job.sourceKey);
      }
    }
  }
  portableOwner(automatic) {
    if (this.session?.expiresAt > this.clock()) return this.session.user?.username || null;
    return automatic && this.defaultUser ? 'desktop-default' : null;
  }
  // Submissions arrive newest first. Only the current remote revision can be
  // reopened: an old withdrawal must never overwrite a later submission.
  async latestPortableSubmissions(jobs, owner) {
    const remaining = new Set(jobs.map(job => job.manifest.resource));
    const heads = new Map();
    const checkOwner = () => {
      if (!owner || this.portableOwner(false) !== owner) fail('账号已变更，请重新同步', 409);
    };
    const usesDefault = (this.defaultUser && owner === 'desktop-default') || (this.installationUser && owner === this.session?.user?.username && this.session?.isDefault);
    const ensureOwner = async () => {
      if (usesDefault && !this.portableOwner(false)) {
        await this.ensureDefaultUser();
        if (!this.portableOwner(false)) fail(this.defaultUserError || '无法登录资源中心的默认账号', 503);
      }
      checkOwner();
    };
    const readPage = async route => {
      await ensureOwner();
      let page;
      try { page = await this.request(route); }
      catch (error) {
        // request() clears this session if the center invalidated its token early.
        if (error.statusCode !== 401 || !usesDefault || this.session) throw error;
        await ensureOwner();
        page = await this.request(route);
      }
      checkOwner();
      return page;
    };
    let offset = 0;
    while (remaining.size > 1 && offset <= 10000) {
      const page = await readPage('/v1/submissions?offset=' + offset);
      for (const item of page.items) {
        if (remaining.delete(item.manifest.resource)) heads.set(item.manifest.resource, item);
      }
      if (page.nextOffset == null) return heads;
      if (!Number.isInteger(page.nextOffset) || page.nextOffset <= offset) break;
      offset = page.nextOffset;
    }
    for (const resource of remaining) {
      const page = await readPage('/v1/submissions?resource=' + encodeURIComponent(resource));
      heads.set(resource, page.items[0]);
    }
    return heads;
  }
  async portableSyncPlan(type) {
    if (type !== undefined && !ADDITIONAL_TYPES.includes(type)) fail('不支持的自动同步资源类型', 422);
    const items = [], errors = [];
    if (!this.origin || !this.silentUpload) return {owner:null, items, errors};
    const owner = this.portableOwner(true);
    const latest = new Map();
    for (const job of Object.values(this.outbox)) {
      if (job.origin === this.origin && job.owner === owner) latest.set(job.sourceKey, job);
    }
    const submitted = [];
    for (const input of portableSyncSources(this,type)) {
      try {
        const source = await buildPortableSource(this, input);
        const previous = latest.get(portableSourceKey(input));
        if (!samePortableSnapshot(previous, source) || (input.type === 'motion' && previous?.state === 'blocked')) {
          items.push({...input, signature:source.signature});
        } else if (previous.state === 'submitted' && previous.manifestSha256) {
          submitted.push({item:{...input, signature:source.signature}, job:previous});
        }
      } catch (error) {
        errors.push({...input, error:error.message});
      }
    }
    if (submitted.length && owner) {
      try {
        const heads = await this.latestPortableSubmissions(submitted.map(({job}) => job), owner);
        for (const {item,job} of submitted) {
          if (isWithdrawnHead(job, heads.get(job.manifest.resource))) items.push(item);
        }
      } catch (error) {
        // Changed local resources can still enter the outbox when the center is offline.
        errors.push({name:'已提交资源的审核状态', error:error.message});
      }
    }
    if (owner !== this.portableOwner(true)) fail('账号已变更，请重新同步', 409);
    return {owner, items, errors};
  }
  async localPortablePreview(input){
    const source=await buildPortableSource(this,input);return {entry:source.entry,signature:source.signature,previewModel:source.previewModel,owner:this.portableOwner(input.automatic === 'true' || input.automatic === true)};
  }
  async enqueuePortable(input) {
    requireStandaloneResource(input.type,input.sourceKind);
    if (!this.origin) fail('请先配置资源中心', 503);
    const automatic = input.automatic === true;
    if (automatic && !this.silentUpload)return {skipped:true};
    if (!automatic) await this.ensureDefaultUser();
    const owner = this.portableOwner(automatic);
    if (!automatic && !owner) fail('请先登录资源中心', 401);
    const checkOwner = () => {
      if (this.portableOwner(automatic) !== owner || (input.expectedOwner !== undefined && input.expectedOwner !== owner)) {
        fail('账号已变更，请重新上传', 409);
      }
    };
    return this.serialSync(async () => {
      checkOwner();
      if (automatic && !this.silentUpload)return {skipped:true};
      const sourceKey = portableSourceKey(input);
      if (automatic && !portableSyncSources(this,input.type).some(s => portableSourceKey(s) === sourceKey)) {
        fail('此资源不参与自动同步', 422);
      }
      const source = await buildPortableSource(this, input);
      if (input.expectedSignature && input.expectedSignature !== source.signature) {
        fail('本地资源已更新，请重新生成预览后上传', 409);
      }
      checkOwner();
      const previous = Object.values(this.outbox).filter(j => j.origin === this.origin && j.owner === owner && j.sourceKey === sourceKey).at(-1);
      const unchanged = samePortableSnapshot(previous, source);
      if (input.type === 'motion' && unchanged && previous.state === 'blocked') {
        // Keep the original request ID when an older resource center rejected this motion type.
        const retry = {...previous, automatic, state:'queued', nextAttempt:0, error:''};
        this.outbox[previous.id] = retry;
        try { await this.saveOutbox(); }
        catch (error) { this.outbox[previous.id] = previous; throw error; }
        this.wakeSync();
        return {id:retry.id, state:retry.state};
      }
      if (automatic && unchanged && previous.state !== 'submitted') return {id:previous.id, state:previous.state};
      const version = input.version || '1.0.0';
      const description = input.description || source.entry.motion?.description || source.entry.control?.description || source.entry.project?.description || '';
      const result = await this.prepareResource({...input, version, description, changelog:'同步本地开发资源'}, {offline:true, sourceSnapshot:source, author:owner || 'local'});
      const snapshot = this.prepared.get(result.preparedId);
      this.prepared.delete(result.preparedId);
      checkOwner();
      const fingerprint = syncFingerprint(snapshot.manifest, 'auto');
      let withdrawn = false;
      const duplicate = previous && previous.state !== 'superseded' && previous.fingerprint === fingerprint &&
        (input.type === 'motion' || !snapshot.manifest.preview || previous.manifest.preview);
      if ((automatic && unchanged) || (duplicate && (automatic || previous.state !== 'submitted'))) {
        if (previous.state === 'submitted' && previous.manifestSha256 && owner) {
          const heads = await this.latestPortableSubmissions([previous], owner);
          checkOwner();
          withdrawn = isWithdrawnHead(previous, heads.get(previous.manifest.resource));
        }
        if (!withdrawn) {
          if(!automatic){previous.automatic=false;await this.saveOutbox();}
          this.wakeSync();
          return {id:previous.id, state:previous.state};
        }
      }
      for (const object of snapshot.objects) await writeFile(path.join(this.directory,'objects',sha256(object.bytes)),object.bytes,{mode:0o600});
      checkOwner();
      const previousState = previous?.state;
      if (previous && (withdrawn || previousState === 'blocked')) previous.state = 'superseded';
      const id = randomUUID();
      this.outbox[id] = {id, automatic, origin:this.origin, owner, sourceKey, sourceSignature:source.signature, fingerprint, previewMode:'auto',
        name:snapshot.manifest.name, manifest:duplicate && previousState==='submitted' ? previous.manifest : snapshot.manifest, state:'queued', attempts:0, nextAttempt:0, error:'', version};
      try {
        await this.saveOutbox();
      } catch (error) {
        delete this.outbox[id];
        if (previous) previous.state = previousState;
        throw error;
      }
      this.wakeSync();
      return {id, state:'queued'};
    });
  }
  async previewPackage(input){
    if(!RESOURCE.test(input.resource)||!VERSION.test(input.version)||!HASH.test(input.manifestSha256))fail('预览请求无效');
    const release=await this.request('/v1/resources/'+input.resource+'/'+input.version),manifest=validateManifest(release.manifest);if(sha256(canonical(manifest))!==input.manifestSha256)fail('预览版本已变更',409);
    const file=manifest.files.find(f=>f.path===manifest.entry),data=await this.getBlob(file,release.downloads),entry=validateEntry(manifest,data.bytes);return {entry,manifest};
  }
  async getBlob(file,downloads=null){
    if(!HASH.test(file.sha256))fail('无效文件摘要');const target=path.join(this.directory,'objects',file.sha256);
    let bytes;try{bytes=await readFile(target);}catch(e){if(e.code!=='ENOENT')throw e;}
    if(bytes&&bytes.length===file.size&&sha256(bytes)===file.sha256)return {bytes,downloaded:0};
    const remote=await githubBlobResponse(downloads,file,this.fetch);
    bytes=remote?await boundedResponse(remote,file.size):await this.request('/v1/blobs/'+file.sha256,{binary:true,limit:file.size});
    if(bytes.length!==file.size||sha256(bytes)!==file.sha256)fail('下载文件校验失败',502,'corrupt_download');
    await writeFile(target,bytes,{mode:0o600});return {bytes,downloaded:bytes.length};
  }
  saveInstallations(){return atomicJson(path.join(this.directory,'installations.json'),this.installations);}
  installAdditional(input,release){return installPortableResource(this,input,release);}
  async install(input){return this.serial(async()=>{
    if(!RESOURCE.test(input.resource)||!VERSION.test(input.version)||!HASH.test(input.manifestSha256))fail('安装请求无效');
    const release=await this.request(`/v1/resources/${input.resource}/${input.version}`),manifest=validateManifest(release.manifest);
    if(manifest.resource!==input.resource||manifest.version!==input.version||sha256(canonical(manifest))!==input.manifestSha256||release.manifestSha256!==input.manifestSha256)fail('资源版本清单不匹配',409);
    if(ADDITIONAL_TYPES.includes(manifest.type))return this.installAdditional(input,release);
    if(manifest.dependencies.length)fail('第一阶段安装器暂不支持带依赖的组合资源',422,'dependencies_not_supported');
    const scope=manifest.type==='sidebar-widget'?this.scope(input.projectId,input.floorId):'';
    const installationId=sha256(`${this.origin}\n${input.manifestSha256}\n${scope}`),localId=manifest.type==='model'?`custom.online-${installationId.slice(0,24)}`:`online-${installationId.slice(0,24)}`;
    const previous=this.installations[installationId];
    const existing=manifest.type==='model'?this.platform.getModelTemplates().find(m=>m.id===localId):this.sidebars.get(scope).draft.widgets.find(w=>w.id===localId);
    if(previous?.status==='installed'&&existing)return {...previous,alreadyInstalled:true,downloadedBytes:0};
    const files=new Map();let downloadedBytes=0;
    for(const file of manifest.files){const data=await this.getBlob(file,release.downloads);files.set(file.path,data.bytes);downloadedBytes+=data.downloaded;if(file.mediaType.startsWith('model/'))validateModelBytes(data.bytes,file.mediaType);}
    const entry=validateEntry(manifest,files.get(manifest.entry));
    let value,modelFile;
    if(manifest.type==='model'){
      value=normalizeModelTemplate({...entry.model,id:localId,library:{repository:this.origin,id:manifest.resource,version:manifest.version,sha256:input.manifestSha256}});
      if(entry.asset){const meta=manifest.files.find(f=>f.path===entry.asset);modelFile={name:entry.asset,dataUrl:`data:${meta.mediaType};base64,${files.get(entry.asset).toString('base64')}`};}
    }else{
      value=normalizeSidebar({format:'ha3d-sidebar-v1',width:380,widgets:[{...entry.widget,id:localId,entityId:'',entityIds:[],accountNames:{},actions:entry.widget.actions||[]}],pages:[{id:'home',name:'主页',items:[]}]}).widgets[0];
    }
    const fingerprint=sha256(canonical(clean(manifest.type==='model'?portableModel(value,entry.asset):portableWidget(value))));
    if(existing){
      const actual=sha256(canonical(clean(manifest.type==='model'?portableModel(existing,entry.asset):portableWidget(existing))));
      if(!previous||actual!==fingerprint)fail('目标副本已存在或被修改，保留本地内容，请检查安装记录',409,'local_conflict');
    }
    const record={installationId,origin:this.origin,resource:manifest.resource,version:manifest.version,manifestSha256:input.manifestSha256,type:manifest.type,localId,scope,projectId:input.projectId||null,floorId:input.floorId||null,fingerprint,status:'pending',installedAt:this.clock()};
    this.installations[installationId]=record;await atomicJson(path.join(this.directory,'installations.json'),this.installations);
    if(!existing){
      if(manifest.type==='model')await this.platform.upsertModelTemplate(value,modelFile);
      else{const workspace=this.sidebars.get(scope);workspace.draft.widgets.push(value);await this.sidebars.update(scope,{revision:workspace.revision,draft:workspace.draft},false);}
    }
    record.status='installed';await atomicJson(path.join(this.directory,'installations.json'),this.installations);
    return {...record,downloadedBytes};
  });}
}

export async function registerResourceCenterRoutes(app,store){
  // Access-policy and instance-write-gate hooks installed by main.js also apply here.
  app.addHook('onRequest',async req=>{
    if(!req.url.startsWith('/api/resource-center/')||['GET','HEAD','OPTIONS'].includes(req.method))return;
    if(req.headers['sec-fetch-site']&&req.headers['sec-fetch-site']!=='same-origin')fail('不允许跨站修改资源中心配置',403);
    if(!req.headers['content-type']?.startsWith('application/json'))fail('需要 JSON 请求',415);
  });
  store.wakeSync();
  app.addHook('onClose',async()=>{await store.stopSync();});
  app.post('/api/resource-center/sync/retry',async()=>store.retrySync());
  app.get('/api/resource-center/portable-sync-plan',async req=>store.portableSyncPlan(req.query.type));
  app.get('/api/resource-center/local-preview',async req=>store.localPortablePreview(req.query));
  app.post('/api/resource-center/sync-portable',async req=>store.enqueuePortable(req.body||{}));
  app.get('/api/resource-center/package-preview',async req=>store.previewPackage(req.query));
  app.get('/api/resource-center/package-model',async(req,reply)=>{const preview=await store.previewPackage(req.query);const model=preview.entry.model;if(!model?.asset)fail('此资源没有模型文件',404);const file=preview.manifest.files.find(f=>f.path===model.asset);const release=await store.request('/v1/resources/'+req.query.resource+'/'+req.query.version);return reply.type(file.mediaType).send((await store.getBlob(file,release.downloads)).bytes);});
  app.post('/api/resource-center/sync',async req=>store.enqueue(req.body||{}));
  app.post('/api/resource-center/sync-model-library',{bodyLimit:22*1024*1024},async req=>store.syncModelLibrary(req.body||{}));
  app.post('/api/resource-center/sync-sidebar-library',{bodyLimit:22*1024*1024},async req=>store.syncSidebarLibrary(req.body||{}));
  app.put('/api/resource-center/settings',async req=>store.setSilentUpload(req.body?.silentUpload));
  app.get('/api/resource-center/status',async()=>{if(store.installationUser)await store.ensureDefaultUser();return store.status();});
  app.get('/api/resource-center/sources',async()=>store.sources());
  app.post('/api/resource-center/login/start',async()=>store.startLogin());
  app.post('/api/resource-center/login/check',async()=>store.finishLogin());
  app.post('/api/resource-center/logout',async()=>store.logout());
  app.get('/api/resource-center/resources',async req=>{
    const p=new URLSearchParams();for(const key of ['q','type','offset'])if(req.query[key]!==undefined)p.set(key,String(req.query[key]));return store.request('/v1/resources?'+p);
  });
  app.get('/api/resource-center/submissions',async req=>{
    const p=new URLSearchParams();if(req.query.offset!==undefined)p.set('offset',String(req.query.offset));return store.request('/v1/submissions?'+p);
  });
  app.get('/api/resource-center/preview/:hash',async(req,reply)=>{
    if(!HASH.test(req.params.hash))fail('预览摘要无效');
    // Always re-authorize remotely; never serve a private cache after logout.
    const bytes=await store.request('/v1/previews/'+req.params.hash,{binary:true,limit:512*1024});
    return reply.header('Cache-Control','no-store').header('X-Content-Type-Options','nosniff').type(bytes[0]===137?'image/png':'image/jpeg').send(bytes);
  });
  app.get('/api/resource-center/versions/:owner/:slug',async req=>{
    const resource=`${req.params.owner}/${req.params.slug}`;if(!RESOURCE.test(resource))fail('资源名称无效');return store.request('/v1/resources/'+resource);
  });
  app.post('/api/resource-center/prepare',async req=>store.prepare(req.body||{}));
  app.post('/api/resource-center/publish',async req=>store.publish(req.body?.preparedId,req.body?.reviewed));
  app.post('/api/resource-center/export',async req=>store.transfer(req.body?.preparedId));
  app.post('/api/resource-center/install',async req=>store.install(req.body||{}));
}
