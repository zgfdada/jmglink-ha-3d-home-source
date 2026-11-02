import { a as React } from "../vendor/react.js";
import { replacementCandidates } from "../domain/missing-device-placement.js";
import "../styles/device-binding-picker.css";

export default function DeviceBindingPicker({ placement, floor, entities, onChange }) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const container = React.useRef(null);
  const current = entities[placement.entityId];
  const candidates = replacementCandidates(floor, placement, entities)
    .filter(entity => entity.domain === (current?.domain || placement.kind));
  const matches = candidates.filter(entity => `${entity.deviceDisplayName || ""} ${entity.name} ${entity.entityId}`.toLowerCase().includes(query.trim().toLowerCase()));
  React.useEffect(() => {
    const outside = event => { if (!container.current?.contains(event.target)) setOpen(false); };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, []);
  return <div ref={container} className="device-binding-picker">
    <button type="button" className="device-binding-trigger" aria-expanded={open} onClick={() => { setOpen(!open); setQuery(""); }}>
      <strong>{current?.deviceDisplayName || current?.name || placement.name || placement.entityId}</strong><span>⌄</span>
    </button>
    {open && <div className="device-binding-options">
      <input autoFocus aria-label="搜索绑定设备" placeholder="搜索名称或实体 ID" value={query} onChange={event => setQuery(event.target.value)} onKeyDown={event => { event.stopPropagation(); if (event.key === "Escape") setOpen(false); }} />
      <div role="group" aria-label="可替换设备">
        {matches.map(entity => <button type="button" key={entity.entityId} aria-pressed={entity.entityId === placement.entityId} onClick={() => { if (entity.entityId !== placement.entityId) onChange(entity); setOpen(false); }}><strong>{entity.deviceDisplayName || entity.name}</strong><small>{entity.entityId}</small></button>)}
        {!matches.length && <p>没有可替换的同类型设备</p>}
      </div>
    </div>}
  </div>;
}
