import PortablePreview from './portable-preview.jsx';
import WidgetLibraryHeader from '../sidebar-development/widget-library-header.jsx';
import ResourceClassificationFilters, {useResourceClassification} from '../device-development-center/resource-classification-filters.jsx';
import {readCatalogPages, withControlEntries} from './discovery-pages.js';
import {a as React} from '../../vendor/react.js';
import './discovery.css';
async function api(action,body,signal){const r=await fetch('api/resource-center/'+action,body===undefined?{cache:'no-store',signal}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal});const data=await r.json();if(!r.ok)throw Error(data.error||'资源加载失败');return data;}
function entryQuery(item) {
  return new URLSearchParams({resource:item.manifest.resource, version:item.manifest.version, manifestSha256:item.manifestSha256}).toString();
}
let controlCache={owner:null, entries:new Map()};
export default function ResourceDiscovery({resourceType,searchQuery='',sort='recent',destination,onChanged,onAccount,onLocal,onCreate}){
 const [state,setState]=React.useState(null),[items,setItems]=React.useState([]),[query,setQuery]=React.useState(''),[next,setNext]=React.useState(null),[selected,setSelected]=React.useState(null),[busy,setBusy]=React.useState(false),[loading,setLoading]=React.useState(true),[notice,setNotice]=React.useState(''),[error,setError]=React.useState('');
 const generation=React.useRef(0),locked=React.useRef(false),alive=React.useRef(true);
 const inflight=React.useRef(null);
 const [visibleLimit,setVisibleLimit]=React.useState(50);
 const label=({'model':'模型','device-control':'自定义控件','motion':'动效','device-project':'设备项目'}[resourceType]||'控件');
 const sidebar=resourceType==='sidebar-widget';
 const pagedByServer=sidebar||resourceType==='motion';
 const serverQuery=sidebar?query:resourceType==='motion'?searchQuery:'';
 const catalog=useResourceClassification(items,resourceType,searchQuery);
 const filterKey=JSON.stringify(catalog.filters);
 React.useEffect(()=>setVisibleLimit(50),[resourceType,searchQuery,filterKey]);
 React.useEffect(()=>{alive.current=true;return()=>{alive.current=false;inflight.current?.abort();generation.current++;};},[]);
 async function load(append=false){
   inflight.current?.abort();
   const controller=new AbortController();
   inflight.current=controller;
   const request=++generation.current;
   setLoading(true);
   setError('');
   if(!append){setItems([]);setNext(null);setSelected(null);}
   try{
     const status=await api('status',undefined,controller.signal);
     if(request!==generation.current)return;
     setState(status);
     if(!status.configured){controlCache={owner:null, entries:new Map()};setItems([]);setNext(null);return;}
     function readPage(offset,signal){
       return api('resources?'+new URLSearchParams({type:resourceType,q:serverQuery,offset:String(offset)}),undefined,signal);
     }
     if(pagedByServer){
       const page=await readPage(append?next||0:0,controller.signal);
       if(request!==generation.current)return;
       setItems(old=>append?[...old,...page.items]:page.items);
       setNext(page.nextOffset);
       if(!append)setSelected(page.items[0]?.manifestSha256||null);
     }else{
       const all=await readCatalogPages(readPage,controller.signal);
       const owner=JSON.stringify([status.origin,status.user?.username]);
       if(resourceType==='device-control'&&controlCache.owner!==owner)controlCache={owner, entries:new Map()};
       const results=resourceType==='device-control'?await withControlEntries(all,async(row,signal)=>{
         const data=await api('package-preview?'+entryQuery(row),undefined,signal);
         return data.entry;
       },controller.signal,controlCache.entries):all;
       if(request===generation.current)setItems(results);
     }
   }catch(e){
     if(request===generation.current&&!controller.signal.aborted)setError(e.message);
   }finally{
     if(request===generation.current)setLoading(false);
   }
 }
 React.useEffect(()=>{
   const refresh=()=>load();
   const timer=setTimeout(refresh,pagedByServer?200:0);
   window.addEventListener('ha3d-account-changed',refresh);
   return()=>{clearTimeout(timer);window.removeEventListener('ha3d-account-changed',refresh);inflight.current?.abort();generation.current++;};
 },[serverQuery,resourceType]);
 async function install(item){if(locked.current)return;locked.current=true;setBusy(true);setError('');try{const m=item.manifest;if(m.type==='sidebar-widget'&&!destination)throw Error('请先选择本地楼层');const result=await api('install',{resource:m.resource,version:m.version,manifestSha256:item.manifestSha256,...(m.type==='sidebar-widget'?destination:{})});const status=await api('status');if(!alive.current)return;setState(status);setNotice(result.alreadyInstalled?'此版本已安装，本地副本保持不变。':m.type==='model'?'已添加到本地模型库。':m.type==='sidebar-widget'?'已添加到当前楼层的本地控件，请绑定实体后发布到主页。':m.type==='device-project'?'已添加到本地项目，请重新匹配设备和实体。':'已添加到本地资源库。');onChanged?.();}catch(e){if(alive.current)setError(e.message);}finally{locked.current=false;if(alive.current)setBusy(false);}}
 const installed=item=>state?.installations?.some(i=>i.status==='installed'&&i.resource===item.manifest.resource&&i.version===item.manifest.version&&(resourceType!=='sidebar-widget'||i.projectId===destination?.projectId&&i.floorId===destination?.floorId));
 const picture=item=>{const m=item.manifest,f=m.files.find(f=>f.path===m.preview);return f?<img src={'api/resource-center/preview/'+f.sha256} alt={m.name+'预览图'} loading="lazy"/>:<div className="rd-no-preview"><span aria-hidden="true">◇</span><small>暂无预览图</small></div>;};
 const mProduct=m=>m.product?<p className="rd-product">{[m.product.isStandard?'标准品':'非标准品',m.product.brand,m.product.model].filter(Boolean).join(' · ')}</p>:null;
 const installButton=item=><button className="primary" disabled={busy} onClick={()=>install(item)}>{busy?'正在安装…':installed(item)?'已安装 · 检查':'安装到本地'}</button>;
 const details=item=><><h3>{item.manifest.name}</h3><p>{item.manifest.resource.split('/')[0]} · v{item.manifest.version.split('+')[0]}</p>
 {resourceType==='device-control'&&<p>支持属性：{catalog.factsByItem.get(item).attributes.join('、')}</p>}
 <p>{item.manifest.description||'作者尚未填写介绍'}</p><details><summary>版本说明</summary><p>{item.manifest.changelog||'暂无更新说明'}</p><p>{item.manifest.permissions.length?'使用时需在本地绑定实体':'无需实体访问'} · {item.manifest.license}</p></details>{installButton(item)}</>;
 const ordered=React.useMemo(()=>{
   const matches=pagedByServer?items:catalog.items;
   const sorted=sort==='name'?[...matches].sort((a,b)=>a.manifest.name.localeCompare(b.manifest.name,'zh-CN')):matches;
   return pagedByServer?sorted:sorted.slice(0,visibleLimit);
 },[items,pagedByServer,catalog.items,sort,visibleLimit]);
 const unavailableControls=resourceType==='device-control'?items.filter(row=>row.controlEntryUnavailable).length:0;
 const current=items.find(i=>i.manifestSha256===selected)||items[0];
 if(resourceType==='sidebar-widget')return <section className="sb-dev-body rd-widget-workspace" aria-label="在线控件库" aria-busy={loading||busy}>
 <aside className="sb-dev-library"><WidgetLibraryHeader online disabled={busy} query={query} onQuery={setQuery} onLocal={onLocal} onOnline={()=>{}} onCreate={onCreate}/>{items.map(item=><button key={item.manifestSha256} className={'sb-library-row '+(current===item?'active':'')} onClick={()=>setSelected(item.manifestSha256)}><strong>{item.manifest.name}</strong><small>{item.manifest.resource.split('/')[0]} · v{item.manifest.version.split('+')[0]}</small></button>)}{!items.length&&<p className="rd-muted">{loading?'正在加载…':'暂无匹配控件'}</p>}{next!==null&&<button disabled={loading} onClick={()=>load(true)}>加载更多</button>}</aside>
 <section className="sb-code-area rd-widget-info"><div className="sb-section-heading"><h2>{current?.manifest.name||'请选择控件'}</h2>{current&&installButton(current)}</div><div className="sb-widget-sections"><button className="active">资源介绍</button></div>{notice&&<p className="rd-notice" role="status">{notice}</p>}{error&&<p className="rd-error" role="alert">{error} <button onClick={()=>load()}>重试</button></p>}{state&&!state.configured?<div className="rd-panel-empty"><b>尚未配置资源中心</b><button onClick={onAccount}>查看配置</button></div>:current?<div className="rd-resource-info"><h3>基本信息</h3><dl><div><dt>控件名称</dt><dd>{current.manifest.name}</dd></div><div><dt>作者</dt><dd>{current.manifest.resource.split('/')[0]}</dd></div><div><dt>版本</dt><dd>{current.manifest.version.split('+')[0]}</dd></div></dl><h3>资源介绍</h3><p>{current.manifest.description||'暂无介绍'}</p><h3>版本说明</h3><p>{current.manifest.changelog||'暂无更新说明'}</p><p className="rd-muted">安装后在本地配置实体和编辑控件。</p></div>:<div className="rd-panel-empty"><b>{loading?'正在加载在线控件…':'暂无匹配的在线控件'}</b><span>可以调整搜索条件，或稍后再来看看。</span></div>}</section>
 <aside className="sb-dev-inspector"><h2>控件预览</h2>{current?<div className="rd-online-preview">{picture(current)}</div>:<div className="rd-panel-empty"><span>选择在线控件后查看预览</span></div>}</aside>
 </section>;
 return <section className={'rd-library rd-'+resourceType} aria-label={'在线'+label+'库'} aria-busy={loading||busy}>
 {notice&&<p className="rd-notice" role="status">{notice}</p>}{error&&<p className="rd-error" role="alert">{error} <button onClick={()=>load()}>重试</button></p>}
 {state&&!state.configured?<div className="ddc-next-empty"><b>尚未配置资源中心</b><span>安装到本地，即可继续编辑和使用。</span><button onClick={onAccount}>查看配置</button></div>:<>
 {state?.configured&&!loading&&!error&&!pagedByServer&&<ResourceClassificationFilters catalog={catalog}/>}
 {!!unavailableControls&&<p className="rd-notice" role="status">{unavailableControls} 个控件暂时无法读取属性。 <button type="button" onClick={()=>load()}>重试</button></p>}
 {resourceType==='model'?<div className="ddc-model-grid">{ordered.map(item=><article className="ddc-model-card" key={item.manifestSha256}><div className="ddc-model-card-visual rd-model-image">{picture(item)}<span className="ddc-model-origin">在线模型</span></div><div className="ddc-model-card-body"><h3>{item.manifest.name}</h3><p>{item.manifest.resource.split('/')[0]} · v{item.manifest.version.split('+')[0]}</p><div className="ddc-model-tags"><span>3D 模型</span>{installed(item)&&<span>已安装</span>}</div>{mProduct(item.manifest)}<p className="rd-description">{item.manifest.description||'暂无介绍'}</p><div className="ddc-model-card-actions">{installButton(item)}</div></div></article>)}</div>:null}
 {!ordered.length&&!error&&<div className="ddc-next-empty"><b>{loading?'正在读取在线目录…':'暂无匹配的在线'+label}</b>{!loading&&<span>可以调整搜索条件，或稍后再来看看。</span>}</div>}
 {!!ordered.length&&['device-control','motion','device-project'].includes(resourceType)&&<PortableCatalog items={ordered} installButton={installButton} picture={picture} details={details}/> }
 {pagedByServer&&next!==null&&<button className="rd-more" disabled={loading} onClick={()=>load(true)}>加载更多</button>}
 {!pagedByServer&&ordered.length<catalog.items.length&&<button className="rd-more" onClick={()=>setVisibleLimit(n=>n+50)}>显示更多结果</button>}</>}
 </section>;
}

function PortableCatalog({items,installButton,picture,details}){
 const [selected,setSelected]=React.useState(null),[entry,setEntry]=React.useState(null),[error,setError]=React.useState('');
 const current=items.find(i=>i.manifestSha256===selected)||items[0];
 const query=current?entryQuery(current):'';
 React.useEffect(()=>{let active=true;setEntry(current?.entry||null);setError('');if(current&&!current.entry&&current.manifest.type!=='motion')api('package-preview?'+query).then(d=>{if(active)setEntry(d.entry);}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[query,current?.entry]);
 const model=entry?.model?{...entry.model.model,...entry.project.appearance,...(entry.model.asset?{source:{...entry.model.model.source,url:'api/resource-center/package-model?'+query}}:{})}:null;
 return <div className="rd-portable-workspace"><aside>{items.map(item=><button key={item.manifestSha256} className={item===current?'active':''} onClick={()=>setSelected(item.manifestSha256)}>{picture(item)}<strong>{item.manifest.name}</strong><small>v{item.manifest.version.split('+')[0]}</small></button>)}</aside>{current&&<article><div className="rd-portable-preview">{current.manifest.type==='motion'?picture(current):error?<p role="alert">{error}</p>:entry?<PortablePreview key={query} entry={entry} model={model}/>:<p>正在加载预览…</p>}</div>{details(current)}</article>}</div>;
}
