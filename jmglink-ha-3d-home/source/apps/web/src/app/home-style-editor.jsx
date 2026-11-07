import { a as React } from "../vendor/react.js";
import { readHomePreference, writeHomePreference } from "../domain/home-preferences.js";

const surfaces = [
  ["background", "背景", "#e8f4fb"],
  ["wall", "墙体", "#d6e9f4"],
  ["floor", "地面", "#e9dfcf"],
  ["furniture", "家具", "#e7ccad"],
];

export function HomeStyleEditor({ draft, styles, onChange, onCancel, onApply, onCaptureAngle }) {
  const [presets, setPresets] = React.useState(() => readHomePreference("stylePresets", []));
  const [name, setName] = React.useState("");
  const [activePreset, setActivePreset] = React.useState("");
  const [notice, setNotice] = React.useState("");
  const savePresets = next => {
    if (!writeHomePreference("stylePresets", next)) { setNotice("保存失败，浏览器存储不可用或空间不足。"); return false; }
    setPresets(next);
    setNotice("已保存自定义风格");
    return true;
  };
  const update = patch => onChange({ ...draft, ...patch });
  return <section className="home-style-editor" role="region" aria-label="风格设定">
    <div className="home-style-editor-settings">
      <header><strong>风格设定</strong><span>实时预览</span><button onClick={onCancel}>取消</button><button onClick={onApply}>应用并关闭</button></header>
      <strong className="home-style-section-title">内置风格</strong>
      <small>内置模板保持原样，调整后可另存为自定义风格。</small>
      <div className="home-style-base" aria-label="内置风格">
        {styles.map(style => <button key={style.key} aria-pressed={!activePreset && draft.base === style.key}
          onClick={() => { setActivePreset(""); setName(""); setNotice(""); onChange({ base: style.key }); }}>{style.label}</button>)}
      </div>
      <strong className="home-style-section-title">自定义风格</strong>
      <div className="home-style-base home-custom-styles" aria-label="自定义风格">
        {presets.map(preset => <button key={preset.id} aria-pressed={activePreset === preset.id}
          onClick={() => { setActivePreset(preset.id); setName(preset.name); setNotice(""); onChange({ ...preset.style }); }}>{preset.name}</button>)}
        <button onClick={() => { setActivePreset(""); setName(""); setNotice("已基于当前效果新建，请输入名称后保存。"); }}>＋ 新建风格</button>
      </div>
      <label>风格名称<input maxLength={40} placeholder="输入自定义风格名称" value={name} onChange={event => setName(event.target.value)} /></label>
      <div className="home-style-base">
        <button disabled={!name.trim()} onClick={() => {
          const id = activePreset || crypto.randomUUID();
          if (savePresets([...presets.filter(preset => preset.id !== id), { id, name: name.trim(), style: { ...draft } }])) setActivePreset(id);
        }}>{activePreset ? "保存修改" : "保存新风格"}</button>
        {activePreset && <button disabled={!name.trim()} onClick={() => {
          const id = crypto.randomUUID();
          if (savePresets([...presets, { id, name: name.trim(), style: { ...draft } }])) setActivePreset(id);
        }}>另存为新风格</button>}
        <button disabled={!activePreset} onClick={() => {
          if (savePresets(presets.filter(preset => preset.id !== activePreset))) { setActivePreset(""); setName(""); setNotice("自定义风格已删除，当前预览保留。"); }
        }}>删除风格</button>
      </div>
      {notice && <small role="status">{notice}</small>}
      {surfaces.map(([key, label, fallback]) => <fieldset key={key}><legend>{label}</legend>
        <div className="home-style-base"><input type="color" aria-label={`${label}颜色`} value={draft[key] ?? fallback}
          onChange={event => update({ [key]: event.target.value })} />
          <button disabled={!draft[key]} onClick={() => update({ [key]: null })}>沿用风格颜色</button></div>
        <label>{label}不透明度 · {Math.round((draft[key + "Opacity"] ?? 1) * 100)}%
          <input type="range" min="0" max="100" value={Math.round((draft[key + "Opacity"] ?? 1) * 100)}
            onChange={event => update({ [key + "Opacity"]: Number(event.target.value) / 100 })} /></label>
      </fieldset>)}
      <div className="home-style-base">
        <button onClick={() => {
          const hue = Math.floor(Math.random() * 360);
          const color = (shift, level) => {
            const channel = offset => Math.round(255 * (level + .11 * Math.cos((hue + shift + offset) * Math.PI / 180))).toString(16).padStart(2, "0");
            return `#${channel(0)}${channel(120)}${channel(240)}`;
          };
          update({ background: color(0, .82), wall: color(35, .87), floor: color(110, .76), furniture: color(145, .71) });
        }}>随机组合</button>
        <button onClick={() => update({ angle: onCaptureAngle() })}>使用当前角度</button>
        <button disabled={!draft.angle} onClick={() => update({ angle: null })}>恢复默认角度</button>
      </div>
    </div>
  </section>;
}
