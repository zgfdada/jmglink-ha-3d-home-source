import { a as React } from "../vendor/react.js";
import { missingDevicePlacements, replacementCandidates } from "../domain/missing-device-placement.js";
import "../styles/missing-device-placements.css";
export function MissingDevicePlacements({ floor, entities, connected, onDelete, onReplace }) {
  const [names, setNames] = React.useState({});
  React.useEffect(() => {
    let active = true;
    if (connected) fetch("./api/ha/entity-names").then(r => r.ok ? r.json() : {}).then(data => { if (active) setNames(data.names ?? {}); }).catch(() => {});
    return () => { active = false; };
  }, [connected]);
  const missing = missingDevicePlacements(floor, entities, connected);
  if (!missing.length) return null;
  return <section aria-label="失效设备摆放" className="missing-placements">
    <header><strong>失效设备</strong><span>{missing.length}</span></header>
    {missing.map(placement => <MissingPlacement key={placement.id} placement={placement}
      name={placement.name || names[placement.entityId] || `${floor.rooms.find(room => room.id === placement.roomId)?.name || "原位置"} · ${{ climate:"空调",light:"灯光",switch:"开关" }[placement.kind] || "设备"}`}
      candidates={replacementCandidates(floor, placement, entities)} onDelete={onDelete} onReplace={onReplace} />)}
  </section>;
}
function MissingPlacement({ placement, name, candidates, onDelete, onReplace }) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const filtered = candidates.filter(entity => `${entity.name} ${entity.entityId}`.toLowerCase().includes(query.toLowerCase())).slice(0,50);
  return <div className="missing-placement-row">
    <span className="missing-placement-name" title={name}>{name}</span>
    <div className="missing-entity-picker">
      <button className="missing-picker-trigger" type="button" aria-expanded={open} aria-label={`选择替换实体：${name}`} onClick={() => setOpen(!open)}>选择当前实体 <span>⌄</span></button>
      {open && <div className="missing-picker-popover">
        <input autoFocus aria-label={`搜索替换实体：${name}`} placeholder="搜索实体名称" value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if(e.key === "Escape") setOpen(false); }} />
        <div className="missing-picker-options">
          {filtered.map(entity => <button type="button" key={entity.entityId} title={entity.name} onClick={() => { onReplace(placement.id,entity); setOpen(false); }}>{entity.name}{placement.deviceId && entity.deviceId === placement.deviceId && <small>同一设备</small>}</button>)}
          {!filtered.length && <p>没有匹配的实体</p>}
        </div>
      </div>}
    </div>
    <button className="missing-placement-delete" type="button" aria-label={`删除摆放：${name}`} title="删除原摆放" onClick={() => { if(window.confirm(`删除“${name}”的原摆放记录？`)) onDelete(placement.id); }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7" /></svg>
    </button>
  </div>;
}
