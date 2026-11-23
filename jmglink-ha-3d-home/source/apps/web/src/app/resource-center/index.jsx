import {a as React} from '../../vendor/react.js';
import './resource-center.css';
import {getModelLibrarySyncState,subscribeModelLibrarySync,resumeModelLibrarySync,retryModelLibrarySync} from './model-sync-background.js';
import {getSidebarSyncState,subscribeSidebarSync,resumeSidebarSync,retrySidebarSync} from './sidebar-sync-background.js';
import {portableLibrarySync} from './portable-sync-background.js';

async function api(action,body){
  const response=await fetch(`api/resource-center/${action}`,body===undefined?{cache:'no-store'}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  const value=await response.json();if(!response.ok)throw Object.assign(Error(value.error||'资源中心请求失败'),{code:value.code,status:response.status});return value;
}
const typeName=type=>({'model':'3D 模型','sidebar-widget':'侧栏控件','device-control':'自定义控件','motion':'动效','device-project':'完整设备'}[type]||type);
const statusName={pending:'待审核',approved:'已通过',rejected:'已驳回',withdrawn:'已撤回'};
const size=bytes=>bytes>=1048576?`${(bytes/1048576).toFixed(1)} MiB`:`${Math.ceil(bytes/1024)} KiB`;

export default function OnlineResources({onClose,onChanged,embedded=false,resourceType='',initialTab='browse'}){
  const [status,setStatus]=React.useState(null),[sources,setSources]=React.useState({models:[],sidebars:[],targets:[]});
  const [modelSync,setModelSync]=React.useState(getModelLibrarySyncState);
  React.useEffect(()=>{const unsubscribe=subscribeModelLibrarySync(setModelSync);void resumeModelLibrarySync();return unsubscribe;},[]);
  const portableQueue=portableLibrarySync();
  const [portableSync,setPortableSync]=React.useState(portableQueue.getState);
  React.useEffect(()=>{const unsubscribe=portableQueue.subscribe(setPortableSync);void portableQueue.resume();return unsubscribe;},[portableQueue]);
  const [sidebarSync,setSidebarSync]=React.useState(getSidebarSyncState);
  React.useEffect(()=>{const unsubscribe=subscribeSidebarSync(setSidebarSync);resumeSidebarSync();return unsubscribe;},[]);
  const [tab,setTab]=React.useState(initialTab==='publish'?'submissions':initialTab),[items,setItems]=React.useState([]),[nextOffset,setNextOffset]=React.useState(null);
  const [submissions,setSubmissions]=React.useState([]),[submissionOffset,setSubmissionOffset]=React.useState(null);
  const [query,setQuery]=React.useState(''),[filter,setFilter]=React.useState(resourceType),[target,setTarget]=React.useState('0');
  const [notice,setNotice]=React.useState(''),[error,setError]=React.useState(false),[busy,setBusy]=React.useState(false);
  const [login,setLogin]=React.useState(null);
  const active=React.useRef(true),busyRef=React.useRef(false);
  const message=(text,isError=false)=>{if(active.current){setNotice(text);setError(isError);}};
  async function work(fn){if(busyRef.current)return;busyRef.current=true;setBusy(true);try{await fn();}catch(e){message(e.message,true);}finally{busyRef.current=false;if(active.current)setBusy(false);}}
  async function refresh(){const [state,local]=await Promise.all([api('status'),api('sources')]);if(active.current){setStatus(state);setSources(local);}return state;}
  async function browse(append=false){const p=new URLSearchParams({q:query,type:filter,offset:String(append?nextOffset||0:0)});const data=await api('resources?'+p);if(active.current){setItems(previous=>append?[...previous,...data.items]:data.items);setNextOffset(data.nextOffset);}}
  async function mySubmissions(append=false){const data=await api('submissions?offset='+(append?submissionOffset||0:0));if(active.current){setSubmissions(previous=>append?[...previous,...data.items]:data.items);setSubmissionOffset(data.nextOffset);}}
  React.useEffect(()=>{active.current=true;work(async()=>{const state=await refresh();if(state.configured){await browse();if(!state.loggedIn)setTab('browse');if(state.loggedIn&&initialTab==='submissions')await mySubmissions();}});return()=>{active.current=false;};},[]);
  const close=()=>{if(busyRef.current){message('正在完成当前操作，请稍候。');return;}onClose?.();};
  async function checkLogin(){
    try{const state=await api('login/check',{});setStatus(state);setLogin(null);window.dispatchEvent(new Event('ha3d-account-changed'));message('已连接资源中心');await browse();}
    catch(e){if(e.code==='authorization_pending'||e.code==='slow_down'){message(e.message);return;}throw e;}
  }
  async function install(item){
    const m=item.manifest,destination=sources.targets[Number(target)];
    if(m.type==='sidebar-widget'&&!destination)throw Error('请先创建本地户型和楼层');
    const result=await api('install',{resource:m.resource,version:m.version,manifestSha256:item.manifestSha256,...(m.type==='sidebar-widget'?destination:{})});
    await refresh();onChanged?.();message(result.alreadyInstalled?'这个版本已安装，保留现有本地副本。':`${m.name} 已安装，下载 ${size(result.downloadedBytes)}。${m.type==='sidebar-widget'?'请到所选楼层的侧栏控件库绑定实体，再发布到主页。':'可在本地模型库中使用。'}`);
  }
  const imageFor=item=>{const f=item.manifest.files.find(f=>f.path===item.manifest.preview);return f?<img className="rc-resource-preview" src={`api/resource-center/preview/${f.sha256}`} alt={item.manifest.name+'预览图'} loading="lazy"/>:<div className="rc-resource-preview rc-preview-empty">此旧版本未附预览图</div>;};
  return <div className={embedded?"rc-embedded":"rc-overlay"} role={embedded?undefined:"dialog"} aria-modal={embedded?undefined:true} aria-label="在线资源中心"><section className="rc-shell" aria-busy={busy}>
    {!embedded&&<header className="rc-header"><div><span className="rc-kicker">3DHome Online</span><h2>在线资源中心</h2></div><button onClick={close} disabled={busy} aria-label="关闭在线资源中心">关闭</button></header>}
    <div className="rc-content"><div className="rc-account"><div><strong>{status?.loggedIn?`${status.isDefaultUser?"默认用户":status.user?.username} · 已连接`:'将创作与灵感带回家'}</strong><p>{status?.origin||'尚未配置资源中心地址'}</p></div>{status?.configured&&(status.loggedIn&&!status.isDefaultUser?<button disabled={busy} onClick={()=>work(async()=>{await api('logout',{});setTab('browse');await refresh();await browse();window.dispatchEvent(new Event('ha3d-account-changed'));message('已退出资源中心，本地资源继续可用。');})}>退出账号</button>:<button className="primary" disabled={busy} onClick={()=>work(async()=>{setLogin(await api('login/start',{}));message('打开账号页面，登录并批准下面的授权码。');})}>{status?.isDefaultUser?"登录自己的账号":"登录 / 注册"}</button>)}</div>
    {status?.isDefaultUser&&<p className="rc-note">当前使用默认用户上传；登录后，新提交使用你自己的账号。</p>}{status?.defaultUserError&&<p className="rc-note">默认用户连接暂未完成：{status.defaultUserError}。资源将保留在本地等待同步。</p>}{!status?.configured&&status&&<p className="rc-note">请在本地后端配置资源中心地址后重启。已有本地资源仍可使用。</p>}
    {login&&<div className="rc-login"><strong>授权码：<code>{login.userCode}</code></strong><p>在服务端账号页面完成注册、邮箱验证与登录，再批准此授权码。授权码 10 分钟内有效。</p><a href={login.verificationUri} target="_blank" rel="noopener noreferrer">打开账号页面 ↗</a><button disabled={busy} onClick={()=>work(checkLogin)}>我已批准，检查登录</button></div>}
    {notice&&<p className={`rc-notice ${error?'is-error':''}`} role="status">{notice}</p>}
    {modelSync.state!=='idle'&&<section aria-label="模型后台同步"><p role="status">{modelSync.state==='preparing'?'模型正在后台同步，你可以继续使用。':'模型同步待重试：'+modelSync.error}</p>{modelSync.state==='waiting'&&<button onClick={retryModelLibrarySync}>重试模型同步</button>}</section>}
    {portableSync.state!=='idle'&&<section aria-label="设备资源后台同步"><p role="status">{portableSync.state==='preparing'?'正在同步完整设备、自定义控件和动效。':'设备资源同步待重试：'+portableSync.error}</p>{portableSync.state==='waiting'&&<button onClick={portableQueue.retry}>重试设备资源同步</button>}</section>}
    {!!sidebarSync.length&&<section aria-label="侧栏后台同步"><p role="status">{sidebarSync.some(item=>item.state==='waiting')?'侧栏同步待重试：'+sidebarSync.filter(item=>item.error).map(item=>item.error).join('；'):'侧栏控件正在后台同步，你可以继续使用。'}</p>{sidebarSync.some(item=>item.state==='waiting')&&<button onClick={retrySidebarSync}>重试侧栏同步</button>}</section>}
    {!!status?.syncJobs?.length&&<section aria-label="自动同步状态"><h3>自动同步</h3>{status.syncJobs.map(j=><p key={j.id}>{j.name} · v{j.version.split('+')[0]} · {({queued:'待同步',uploading:'同步中',submitted:'已同步，审核状态见我的提交',blocked:'需要处理',superseded:'已由新修改替代'})[j.state]}{j.error?'：'+j.error:''}{j.owner&&j.owner!==status.user?.username?'（请登录原账号 '+j.owner+'）':''}</p>)}<button disabled={busy} onClick={()=>work(async()=>{await api('sync/retry',{});await refresh();})}>重试同步</button><button disabled={busy} onClick={()=>work(async()=>{await refresh();if(status.loggedIn)await mySubmissions();})}>刷新状态</button></section>}
    {status?.configured&&<><nav className="rc-tabs" aria-label="资源中心功能">{[['browse','发现资源'],['submissions','我的提交'],['installed','已安装']].filter(([id])=>id!=='submissions'||status.loggedIn).map(([id,label])=><button key={id} aria-pressed={tab===id} disabled={busy} onClick={()=>{setTab(id);if(id==='submissions')work(()=>mySubmissions());if(id==='browse')work(()=>browse());}}>{label}</button>)}</nav>
    {tab==='browse'&&<><form className="rc-toolbar" onSubmit={e=>{e.preventDefault();work(()=>browse());}}><input aria-label="搜索在线资源" placeholder="搜索资源名称或作者" value={query} onChange={e=>setQuery(e.target.value)}/>{!resourceType&&<select aria-label="资源类型" value={filter} onChange={e=>setFilter(e.target.value)}><option value="">全部类型</option><option value="model">3D 模型</option><option value="sidebar-widget">侧栏控件</option><option value="device-control">自定义控件</option><option value="motion">动效</option><option value="device-project">完整设备</option></select>}<button disabled={busy}>搜索</button></form>{(!filter||filter==='sidebar-widget')&&<label className="rc-target">侧栏控件安装到<select value={target} onChange={e=>setTarget(e.target.value)}>{sources.targets.map((t,i)=><option key={`${t.projectId}/${t.floorId}`} value={i}>{t.name}</option>)}</select></label>}<div className="rc-grid">{items.map(item=>{const m=item.manifest;return <article className="rc-card" key={item.manifestSha256}>{imageFor(item)}<span className="rc-badge">{typeName(m.type)}</span><h3>{m.name}</h3><small>{m.resource.split('/')[0]} · v{m.version.split('+')[0]}</small><p>{m.description||'作者尚未填写说明'}</p><details><summary>版本与权限</summary><p>{m.changelog||'无更新说明'}</p><p>{m.permissions.includes('actions.invoke')?'读取绑定实体并执行已声明的动作':m.permissions.length?'读取你绑定的实体状态':'无需实体访问'}</p><p>{m.license} · {size(m.files.reduce((n,f)=>n+f.size,0))}</p></details><button className="primary" disabled={busy} onClick={()=>work(()=>install(item))}>安装此版本</button></article>;})}</div>{!items.length&&<p className="rc-empty">还没有符合条件的资源，可以上传你的第一个作品。</p>}{nextOffset!==null&&<button disabled={busy} onClick={()=>work(()=>browse(true))}>加载更多</button>}</>}
    {tab==='submissions'&&<><div className="rc-toolbar"><p className="rc-note">只有审核通过的版本才进入公共资源库。驳回后在开发界面修改并保存退出，系统会自动提交新修订。</p><button disabled={busy} onClick={()=>work(()=>mySubmissions())}>刷新状态</button></div><div className="rc-grid">{submissions.map(item=><article className="rc-card" key={item.manifestSha256}>{imageFor(item)}<span className="rc-badge">{statusName[item.status]}</span><h3>{item.manifest.name}</h3><small>{item.manifest.resource.split('/')[0]} · v{item.manifest.version.split('+')[0]}</small><p>{item.reviewNote||'暂无审核意见'}</p></article>)}</div>{!submissions.length&&<p className="rc-empty">尚未提交资源。</p>}{submissionOffset!==null&&<button disabled={busy} onClick={()=>work(()=>mySubmissions(true))}>更多提交</button>}</>}
    {tab==='installed'&&<><p className="rc-note">每个版本安装为独立副本。新版本不会覆盖你的修改或本地实体绑定；安装的侧栏控件需要在本地选择实体并发布到主页。</p><div className="rc-grid">{status.installations.map(i=><article className="rc-card" key={i.installationId}><span className="rc-badge">{typeName(i.type)}</span><h3>{i.resource}</h3><p>版本 {i.version.split('+')[0]}</p><small>{i.status==='installed'?'已安装':'安装待恢复，请重新安装同一版本'}</small><p>本地标识：{i.localId}</p></article>)}</div>{!status.installations.length&&<p className="rc-empty">尚未安装在线资源。</p>}</>}
    </>}
    </div></section></div>;
}

export function ResourceAccountButton({onClick,className}){
  const [username,setUsername]=React.useState('');
  React.useEffect(()=>{let active=true;const update=()=>api('status').then(s=>{if(active)setUsername(s.loggedIn?s.user?.username||'':'');}).catch(()=>{});update();window.addEventListener('ha3d-account-changed',update);return()=>{active=false;window.removeEventListener('ha3d-account-changed',update);};},[]);
  return <button className={className} aria-label="账号与登录" title={username?username+' · 账号与提交':'登录 / 注册'} onClick={onClick}>{username?username[0].toUpperCase():'人'}</button>;
}
