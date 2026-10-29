import {a as React} from "../../vendor/react.js";
import {entityTypeLabel} from "./project-basic.js";
import {extraEntityOptions,filterExtraEntities} from "./extra-entity-model.js";
import "../../styles/extra-entity-selection.css";

export default function ExtraEntitySelection({projectId,binding,devices,onBeforeSave,reload,notify,registerGuard}) {
  const [selected,setSelected]=React.useState(binding?.extraEntityIds ?? []);
  const [baseline,setBaseline]=React.useState(binding?.extraEntityIds ?? []);
  const [search,setSearch]=React.useState("");
  const [domain,setDomain]=React.useState("all");
  const [onlySelected,setOnlySelected]=React.useState(false);
  const [limit,setLimit]=React.useState(100);
  const [busy,setBusy]=React.useState(false);
  const [message,setMessage]=React.useState("");
  const bindingKey=JSON.stringify([binding?.deviceId,binding?.extraEntityIds ?? []]);
  React.useEffect(()=>{setSelected(binding?.extraEntityIds ?? []);setBaseline(binding?.extraEntityIds ?? []);setMessage("");},[bindingKey]);
  const dirty=JSON.stringify([...selected].sort())!==JSON.stringify([...baseline].sort());
  React.useEffect(()=>{
    registerGuard?.(()=>{
      if(busy || dirty){const text=busy?"额外实体正在保存，请稍候。":"额外实体选择尚未保存，请先保存或取消更改。";setMessage(text);notify(text,"error");return false;}
      return true;
    });
    return()=>registerGuard?.(null);
  },[registerGuard,dirty,busy,notify]);
  React.useEffect(()=>setLimit(100),[search,domain,onlySelected]);
  const options=React.useMemo(()=>extraEntityOptions(devices,binding),[devices,bindingKey]);
  const filtered=filterExtraEntities(options,{search,domain,onlySelected,selected});
  const picked=new Set(selected);
  const removed=new Set(baseline.filter(id=>!picked.has(id)));
  const affected=Object.entries(binding?.capabilityMappings ?? {}).filter(([,mapping])=>removed.has(mapping.entityId)).length;
  const toggle=id=>{setSelected(current=>current.includes(id)?current.filter(item=>item!==id):[...current,id]);setMessage("");};
  const save=async()=>{
    if(!binding || !dirty || busy)return;
    setBusy(true);setMessage("");
    try{
      if(await onBeforeSave?.()===false)return;
      const response=await fetch(`./api/device-platform/projects/${encodeURIComponent(projectId)}/extra-entities`,{
        method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({deviceId:binding.deviceId,extraEntityIds:selected,expectedExtraEntityIds:baseline}),
      });
      const result=await response.json();if(!response.ok)throw Error(result.error ?? "保存额外实体失败");
      const ids=result.binding.extraEntityIds ?? [];
      setSelected(ids);setBaseline(ids);
      await reload();setMessage("额外实体已保存，可在能力与属性映射中配置能力，再供部件动效使用。");notify("额外实体选择已保存。","success");
    }catch(error){setMessage(error.message);notify(error.message,"error");}finally{setBusy(false);}
  };
  if(!binding)return <p className="ddc-project-no-results">请先在设备自身实体中绑定主设备，再选择额外实体。</p>;
  return <div className="ddc-extra-entities">
    <header><strong>额外实体选择</strong><small>已选 {selected.length} 个 · 当前显示 {Math.min(limit,filtered.length)} / {filtered.length} 个</small></header>
    <div className="ddc-extra-search"><span aria-hidden="true">⌕</span><input aria-label="搜索额外实体" placeholder="搜索实体名称、实体 ID 或来源设备…" value={search} onChange={event=>setSearch(event.target.value)}/><button disabled={!search || busy} onClick={()=>setSearch("")}>清空</button></div>
    <div className="ddc-extra-filters">{[["all","全部实体"],["device_tracker","定位跟踪器"],["sensor","传感器"],["binary_sensor","二值传感器"],["person","人员"],["other","其他类型"]].map(([id,label])=><button key={id} className={domain===id?"active":""} onClick={()=>setDomain(id)} aria-pressed={domain===id}>{label}</button>)}<label><input type="checkbox" checked={onlySelected} onChange={event=>setOnlySelected(event.target.checked)}/>仅看已选</label></div>
    <div className="ddc-extra-list"><div className="ddc-extra-row ddc-extra-head"><span></span><span>实体名称 / 实体 ID</span><span>来源设备</span><span>类型</span><span>当前状态</span></div>
      {filtered.slice(0,limit).map(entity=><label key={entity.entityId} className={`ddc-extra-row ${picked.has(entity.entityId)?"selected":""}`}><input aria-label={`选择额外实体 ${entity.name ?? entity.entityId}`} type="checkbox" disabled={busy} checked={picked.has(entity.entityId)} onChange={()=>toggle(entity.entityId)}/><span className="ddc-extra-name"><strong>{entity.name ?? entity.entityId}</strong><code>{entity.entityId}</code></span><span className="ddc-extra-origin" title={entity.sourceDeviceName}>{entity.sourceDeviceName}</span><span className="ddc-extra-type">{entityTypeLabel(entity.domain)}</span><span className="ddc-extra-state" title={String(entity.state)}>{entity.historical?"当前不可用":String(entity.state ?? "unknown")}</span></label>)}
      {!filtered.length&&<p className="ddc-project-no-results">没有匹配的实体，请调整搜索内容或筛选条件。</p>}
    </div>
    {filtered.length>limit&&<button className="ddc-extra-more" onClick={()=>setLimit(value=>value+100)}>继续显示更多实体（剩余 {filtered.length-limit} 个）</button>}
    <p className="ddc-extra-hint">这里只选择数据源实体。保存后，在原有能力与属性映射中配置能力，再在 3D 外观的部件动效中使用。</p>
    {affected>0&&<p className="ddc-extra-warning">本次取消的实体被 {affected} 项能力引用，保存后这些能力需重新绑定。</p>}
    <footer><span role="status">{message || (dirty?"有未保存的实体选择":"实体选择已保存")}</span><button disabled={!dirty || busy} onClick={()=>{setSelected(baseline);setMessage("");}}>取消更改</button><button className="primary" disabled={!dirty || busy} onClick={save}>{busy?"正在保存…":"保存额外实体"}</button></footer>
  </div>;
}
