import { a as React } from '../../vendor/react.js';
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function ActionRow({action,onChange,onDelete,onInsert,entities}) {
 const [json,setJson]=React.useState(JSON.stringify(action.data||{},null,2));const [error,setError]=React.useState('');
 return <details className="sb-action-row">
 <summary>{action.label} · {action.domain}.{action.service}</summary>
 <label>动作标识<input value={action.id} onChange={e=>onChange({...action,id:e.target.value})}/></label>
 <label>按钮名称<input value={action.label} onChange={e=>onChange({...action,label:e.target.value})}/></label>
 <label>默认目标<select value={action.target} onChange={e=>onChange({...action,target:e.target.value})}><option value="primary">第一个生效实体</option><option value="all">全部生效实体</option>{entities.map(e=><option key={e.entityId} value={e.entityId}>{e.attributes?.title||e.name||e.attributes?.friendly_name||e.entityId} · {e.entityId}</option>)}</select></label>
 <label>默认参数（JSON）<textarea aria-label="动作默认参数 JSON" rows={3} value={json} onChange={e=>setJson(e.target.value)} onBlur={()=>{try{const value=JSON.parse(json);if(!value||typeof value!=='object'||Array.isArray(value))throw Error('请输入 JSON 对象');onChange({...action,data:value});setError('');}catch(e){setError(e.message);}}}/></label>
 {error&&<p role="alert">{error}</p>}
 <button type="button" onClick={()=>onInsert(`<button data-ha-action="${escape(action.id)}">${escape(action.label)}</button>`)}>插入按钮 HTML</button>
 <button type="button" onClick={onDelete}>删除动作</button>
 </details>;
}
export function ActionEditor({widget,onChange,onInsert,entities=[]}) {
 const [catalog,setCatalog]=React.useState([]),[query,setQuery]=React.useState(''),[selected,setSelected]=React.useState(''),[error,setError]=React.useState('');
 React.useEffect(()=>{let active=true;fetch('api/sidebar-services/catalog').then(async response=>{const data=await response.json();if(!response.ok)throw Error(data.error||'服务目录加载失败');if(active)setCatalog(data.services);}).catch(e=>active&&setError(e.message));return()=>{active=false;};},[]);
 const actions=widget.actions||[];const term=query.trim().toLocaleLowerCase();const matches=catalog.filter(s=>`${s.domain}.${s.service} ${s.name} ${s.description}`.toLocaleLowerCase().includes(term));const service=catalog.find(s=>`${s.domain}.${s.service}`===selected);
 return <fieldset className="sb-action-editor"><legend>HA 交互动作</legend>
 <p className="sb-muted">服务来自当前 HA。只允许操作控件实际绑定的实体；配置保存草稿后才能测试，发布后主页生效。</p>
 <input type="search" aria-label="搜索 HA 服务" placeholder="搜索服务，例如 light.turn_on" value={query} onChange={e=>setQuery(e.target.value)}/>
 <select aria-label="选择 HA 服务" value={selected} onChange={e=>setSelected(e.target.value)}><option value="">选择服务（匹配 {matches.length} 项）</option>{matches.slice(0,150).map(s=><option key={`${s.domain}.${s.service}`} value={`${s.domain}.${s.service}`}>{s.name} · {s.domain}.{s.service}</option>)}</select>
 {service&&<small>{service.description}<br/>参数：{Object.entries(service.fields).map(([key,value])=>key+(value.required?'（必填）':'')).join('、')||'无'}</small>}
 <button type="button" disabled={!service||actions.length>=60} onClick={()=>{onChange([...actions,{id:'action-'+crypto.randomUUID().slice(0,8),label:service.name,domain:service.domain,service:service.service,target:'primary',data:{}}]);}}>添加动作</button>
 {error&&<p role="alert">{error}</p>}
 {actions.map((action,index)=><ActionRow key={index} action={action} entities={entities} onChange={next=>onChange(actions.map((a,i)=>i===index?next:a))} onDelete={()=>onChange(actions.filter((_,i)=>i!==index))} onInsert={onInsert}/>)}
 <p className="sb-muted">HTML 可使用 data-ha-action；JS 可使用 ha.runAction("动作标识") 或 ha.callService(domain, service, data, entityId)。无需修改后端。</p>
 </fieldset>;
}
