// Room-specific entity IDs and HA actions belong to the editable runtime configuration.
export function roomWidgetCode(settings = {}) {
  return {
    actions: settings.roomConfigurations ? settings.roomConfigurations.flatMap(room => room.actions || []) : settings.actions || [],
    html: '<div id="room"></div>',
    css: `*{box-sizing:border-box}#room{padding:8px;display:grid;gap:12px;font:13px system-ui}h2{font-size:18px;margin:2px 4px}h3{font-size:15px;margin:0 0 14px}section{border:1px solid var(--widget-line);border-radius:14px;padding:14px;background:#ffffff08}.grid{display:grid;gap:7px;grid-template-columns:repeat(3,minmax(0,1fr))}.pair{grid-template-columns:repeat(2,minmax(0,1fr))}.modes{grid-template-columns:repeat(4,minmax(0,1fr))}button,select{min-width:0;min-height:36px;border:1px solid var(--widget-line);border-radius:9px;background:#ffffff14;color:inherit;font:inherit;padding:7px 4px;cursor:pointer}button.active{background:#168fe5;color:white;border-color:#63c5ff}button:disabled,select:disabled{opacity:.4;cursor:default}.label{margin:15px 0 8px;color:var(--widget-muted);font-size:12px}.warm{background:#efbe72;color:#283348}.cool{background:#a1d3f4;color:#20364c}.custom{background:#e9d9b7;color:#283348}.status{font-size:12px;color:var(--widget-muted);margin:8px 0}.track{height:112px;position:relative;border-top:4px solid #729fbe;background:linear-gradient(#88b2cc33,#e1ecf522);border-radius:5px;overflow:hidden}.fabric{position:absolute;top:0;bottom:0;background:repeating-linear-gradient(90deg,#97b9df,#c3d8f0 6px,#7094bb 12px);box-shadow:0 3px 12px #122b4444;pointer-events:none}.left{left:0}.right{right:0}.track input{position:absolute;inset:0;width:100%;height:100%;margin:0;opacity:.01;pointer-events:none}.track.dragging .fabric,.track.dragging .handle{transition:none}.handle{touch-action:none;cursor:ew-resize;position:absolute;top:50%;transform:translate(-50%,-50%);width:26px;height:26px;border-radius:50%;background:#c6e8ff;border:1px solid #6eb4e3;color:#2178ba;display:grid;place-items:center;font-size:22px;pointer-events:auto}.climate-card{position:relative}.climate-card>h3{padding-right:90px;min-height:30px}.climate-power{position:absolute;right:14px;top:12px;min-height:30px;font-size:12px;padding:5px 9px}.metrics{display:grid;grid-template-columns:1fr 1fr;gap:8px;text-align:center}.temperature{font-size:22px;font-weight:700;margin:10px 0;white-space:nowrap}.adjust{display:flex;align-items:center;justify-content:center;gap:4px}.adjust button{flex:0 0 24px;width:24px;min-height:30px;font-size:18px}.adjust .temperature{font-size:20px}.metric-label{font-size:12px;color:var(--widget-muted)}.detail{width:100%;margin-top:12px}.error{color:#b53836;font-size:12px}input[type=range]{accent-color:#3faafa}select{width:100%}.detail-field{display:block;margin:12px 0}.detail-field select{margin-top:6px}.detail-field input[type=range]{display:block;width:100%;margin:12px 0 0}.hint{text-align:center;font-size:11px;color:var(--widget-muted)}@container(max-width:280px){.modes{grid-template-columns:repeat(2,minmax(0,1fr))}}`,
    js: 'const settings=' + JSON.stringify(settings) + ';\n(' + roomRuntime.toString() + ')(settings);',
  };
}

function roomRuntime(initialSettings) {
  let settings = initialSettings.roomConfigurations?.[0] || initialSettings;
  const roomConfigurations = initialSettings.roomConfigurations || [initialSettings];
  const motions = new Map();
  const root = document.getElementById('room');
  let busy = false, error = '', dragPosition = null;
  const find = key => ha.getEntity(settings[key]);
  const valid = e => e && !['unknown', 'unavailable'].includes(e.state);
  const make = (tag, text, className) => {
    const e = document.createElement(tag);
    if (text != null) e.textContent = text;
    if (className) e.className = className;
    return e;
  };
  async function run(id, data) {
    id = settings.actionAliases?.[id] || id;
    if (busy) return;
    busy = true; error = ''; render();
    try { await ha.runAction(id, data); }
    catch (e) { error = e.message; for (const motion of motions.values()) motion.pendingPosition = null; }
    finally { busy = false; render(); }
  }
  function button(label, id, active = false, className = '') {
    id = settings.actionAliases?.[id] || id;
    const b = make('button', label, className + (active ? ' active' : ''));
    const action = settings.actions?.find(a => a.id === id);
    const target = action?.target;
    b.disabled = busy || !action || (target?.includes('.') && (!ha.getEntity(target) || ha.getEntity(target).state === 'unavailable' || (ha.getEntity(target).state === 'unknown' && !/^(button|input_button)\./.test(target))));
    b.onclick = () => run(id);
    return b;
  }
  function section(title) { const s = make('section'); s.append(make('h3', title)); root.append(s); return s; }
  function options(parent, label, key, columns = '') {
    parent.append(make('div', label, 'label'));
    const grid = make('div', null, 'grid ' + columns);
    for (const option of settings[key + 'Options'] || []) grid.append(button(option.label, option.action, find(key)?.state === option.value, option.className || ''));
    parent.append(grid);
  }
  function render() {
    if (dragPosition !== null) return;
    for (const motion of motions.values()) if (motion.animationFrame != null) cancelAnimationFrame(motion.animationFrame);
    root.replaceChildren();
    const rooms = section('房间');
    const chooser = make('div', null, 'grid');
    for (const room of settings.rooms || [{ name: settings.name || '客厅', enabled: true }]) {
      const b = make('button', room.name, room.name === settings.name ? 'active' : '');
      b.disabled = !room.enabled;
      if (!room.enabled) b.title = '尚未集成';
      b.onclick = () => { const next = roomConfigurations.find(config => config.name === room.name); if (next && !busy) { settings = next; error = ''; render(); } };
      chooser.append(b);
    }
    rooms.append(chooser);
    root.append(make('h2', '▰ ' + (settings.name || '客厅')));
    const group = find('lightGroup');
    const memberIds = settings.lightEntities || group?.attributes?.entity_id || [];
    const members = memberIds.map(id => ha.getEntity(id));
    const count = members.length && members.every(Boolean) ? members.filter(e => e.state === 'on').length : valid(group) && group.state === 'off' ? 0 : '--';
    const lights = section('☀ 灯光 · 已开启 ' + count);
    const power = make('div', null, 'grid pair');
    power.append(button('☼ 一键开灯', 'lights-on'), button('⏻ 一键关灯', 'lights-off'));
    lights.append(power);
    options(lights, '控制模式', 'lightMode', settings.lightModeOptions?.length === 4 ? 'modes' : '');
    options(lights, '自动模式选择', 'lightPlan');
    options(lights, '色温控制', 'lightColor');
    if (settings.customTemperature) {
      const custom = find('customTemperature');
      if (valid(custom) && find('lightColor')?.state === '自定义') {
        const label = make('label', '自定义色温 · ' + custom.state + ' K', 'detail-field');
        const range = make('input'); range.type = 'range'; range.min = custom.attributes.min ?? 2700; range.max = custom.attributes.max ?? 6500; range.step = custom.attributes.step ?? 100; range.value = custom.state;
        range.disabled = busy; range.onchange = () => run('custom-temperature', { value: Number(range.value) }); label.append(range); lights.append(label);
      }
    }
    for (const parameter of settings.parameters || []) {
      const e = ha.getEntity(parameter.entity);
      const card = section(parameter.label);
      const label = make('label', (valid(e) ? e.state : '--') + ' ' + (parameter.unit || e?.attributes?.unit_of_measurement || ''), 'detail-field');
      const range = make('input'); range.type = 'range'; range.min = e?.attributes?.min ?? 0; range.max = e?.attributes?.max ?? 100; range.step = e?.attributes?.step ?? 1; range.value = valid(e) ? e.state : 0;
      range.disabled = busy || !valid(e); range.setAttribute('aria-label', parameter.label);
      range.onchange = () => run(parameter.action, {value:Number(range.value)}); label.append(range); card.append(label);
    }
    let lastCurtain;
    for (const curtainConfig of settings.curtains || (settings.curtain ? [{name:(settings.name || '客厅')+'窗帘',entity:settings.curtain,action:'curtain-position'}] : [])) {
    const curtain = section('▥ ' + curtainConfig.name); lastCurtain = curtain;
    const cover = ha.getEntity(curtainConfig.entity);
    const motion = motions.get(curtainConfig.entity) || { pendingPosition:null, pendingBase:null, visualPosition:null, animationFrame:null };
    motions.set(curtainConfig.entity, motion);
    const position = valid(cover) && Number.isFinite(Number(cover.attributes.current_position)) && cover.attributes.current_position != null ? Number(cover.attributes.current_position) : null;
    const track = make('div', null, 'track');
    const left = make('div', null, 'fabric left'), right = make('div', null, 'fabric right');
    const range = make('input'); range.type = 'range'; range.min = 0; range.max = 100; range.step = 1; range.value = position ?? 0;
    range.setAttribute('aria-label', '左右对开窗帘开合度'); range.disabled = busy || position === null;
    if (curtainConfig.name === '纱帘') { left.style.opacity = right.style.opacity = '.55'; }
    const info = make('div', null, 'hint');
    const leftHandle = make('div', '‹', 'handle'), rightHandle = make('div', '›', 'handle');
    const draw = (p, handlePosition = p) => { left.style.width = right.style.width = (50 - p * .42) + '%'; leftHandle.style.left = (50 - handlePosition * .42) + '%'; rightHandle.style.left = (50 + handlePosition * .42) + '%'; info.textContent = '开合度 ' + (position === null ? '--' : Math.round(p) + '%') + (handlePosition !== p ? ' · 目标 ' + handlePosition + '%' : '') + ' · 左右拖动调节'; };
    if (position !== motion.pendingBase) motion.pendingPosition = null;
    const shown = motion.pendingPosition ?? position ?? 0;
    if (motion.animationFrame !== null) cancelAnimationFrame(motion.animationFrame);
    const moving = cover?.state === 'opening' || cover?.state === 'closing';
    const destination = moving ? (motion.pendingPosition ?? (cover.state === 'opening' ? 100 : 0)) : shown;
    const start = motion.visualPosition ?? position ?? shown;
    const duration = Math.max(900, Math.abs(destination - start) / 100 * (settings.curtainTravelMs || 18000));
    motion.animationTarget = destination;
    const started = performance.now();
    draw(start);
    const animate = now => {
      if (dragPosition !== null) return;
      const fraction = Math.max(0, Math.min(1, (now - started) / duration));
      motion.visualPosition = start + (destination - start) * fraction;
      draw(Math.round(motion.visualPosition));
      if (fraction < 1) motion.animationFrame = requestAnimationFrame(animate);
      else motion.animationFrame = null;
    };
    if (Math.abs(destination - start) > .01) motion.animationFrame = requestAnimationFrame(animate);
    else motion.visualPosition = start;
    for (const [handle, direction] of [[leftHandle, -1], [rightHandle, 1]]) {
      let startX = 0, startPosition = 0, pointer = null;
      handle.setAttribute('role', 'slider'); handle.setAttribute('aria-label', direction < 0 ? '左侧窗帘拖柄' : '右侧窗帘拖柄');
      handle.onpointerdown = event => {
        if (busy || position === null) return;
        event.preventDefault(); if (motion.animationFrame !== null) cancelAnimationFrame(motion.animationFrame); startX = event.clientX; startPosition = motion.visualPosition ?? shown; pointer = event.pointerId; dragPosition = startPosition; track.className = 'track dragging'; handle.setPointerCapture(pointer);
      };
      handle.onpointermove = event => {
        if (pointer !== event.pointerId) return;
        const width = track.getBoundingClientRect().width;
        dragPosition = Math.round(Math.max(0, Math.min(100, startPosition + direction * (event.clientX - startX) / (width * .42) * 100)));
        range.value = dragPosition; draw(motion.visualPosition ?? startPosition, dragPosition);
      };
      handle.onpointerup = event => {
        if (pointer !== event.pointerId) return;
        const next = dragPosition; pointer = null; handle.releasePointerCapture(event.pointerId); dragPosition = null; track.className = 'track'; motion.previousPosition = next;
        if (next !== startPosition) { motion.pendingPosition = next; motion.pendingBase = position; run(curtainConfig.action || 'curtain-position', {position:next}); }
      };
      handle.onpointercancel = () => { pointer = null; dragPosition = null; render(); };
    }
    range.oninput = () => { dragPosition = Number(range.value); draw(motion.visualPosition ?? shown, dragPosition); };
    range.onchange = () => { const p = Number(range.value); dragPosition = null; motion.pendingPosition = p; motion.pendingBase = position; run(curtainConfig.action || 'curtain-position', {position:p}); };
    range.onpointercancel = () => { dragPosition = null; render(); };
    track.append(left, right, leftHandle, rightHandle, range); curtain.append(track, info);


    }
    if (settings.curtainMode) {
      const modes = settings.curtain && lastCurtain ? lastCurtain : section('窗帘智能控制 · ' + (find('curtainMode')?.state || '--'));
      options(modes, settings.curtain ? '窗帘智能控制 · ' + (find('curtainMode')?.state || '--') : '控制模式', 'curtainMode');
      for (const item of settings.curtainInfo || []) { const e=ha.getEntity(item.entity); modes.append(make('div', item.label+' · '+(valid(e)?e.state:'--'), 'status')); }
    }
    if (settings.climate) {
    if (viewContext.expanded) root.replaceChildren();
    const climate = section('❄ ' + (settings.name || '客厅') + '空调'); climate.className = 'climate-card';
    const ac = find('climate'), a = ac?.attributes || {};
    climate.append(make('div', !valid(ac) ? '暂不可用' : ac.state === 'off' ? '已关闭' : ({cool:'制冷',heat:'制热',dry:'除湿',fan_only:'送风',auto:'自动',heat_cool:'自动'}[ac.state] || ac.state), 'status'));
    const metrics = make('div', null, 'metrics');
    const target = make('div'); target.append(make('div', '设定温度', 'metric-label'));
    const adjust = make('div', null, 'adjust');
    for (const [text, delta] of [['−', -1], ['+', 1]]) {
      const b = make('button', text); b.setAttribute('aria-label', delta < 0 ? '降低空调温度' : '升高空调温度'); b.disabled = busy || !valid(ac) || !Number.isFinite(a.temperature); b.onclick = () => run('climate-temperature', {temperature:Math.max(a.min_temp ?? 16, Math.min(a.max_temp ?? 30, a.temperature + delta * (a.target_temp_step || 1)))});
      if (delta < 0) adjust.append(b); else adjust.append(make('strong', (a.temperature ?? '--') + ' °C', 'temperature'), b);
    }
    target.append(adjust);
    const current = make('div'); current.append(make('div', '室内温度', 'metric-label'), make('div', (a.current_temperature ?? '--') + ' °C', 'temperature')); metrics.append(target, current); climate.append(metrics);
    const acPower = button(ac?.state === 'off' ? '⏻ 开启空调' : '⏻ 关闭空调', ac?.state === 'off' ? 'climate-on' : 'climate-off', valid(ac) && ac.state !== 'off', 'climate-power'); climate.append(acPower);
    const translated = value => ({cool:'制冷',heat:'制热',dry:'除湿',fan_only:'送风',off:'关闭',auto:'自动',low:'低速',medium:'中速',high:'高速',quiet:'静音',heating:'制热中',cooling:'制冷中',idle:'待机',none:'无',eco:'节能',prevent_super_cool:'防过冷',both:'同时',horizontal:'水平',vertical:'垂直'}[value] || value || '--');
    climate.append(make('div', '模式 ' + translated(ac?.state) + '　风速 ' + translated(a.fan_mode), 'status'));
    if (viewContext.expanded) {
      for (const [label, attribute, currentValue, action, parameter] of [['工作模式','hvac_modes',ac?.state,'climate-mode','hvac_mode'],['风速','fan_modes',a.fan_mode,'climate-fan','fan_mode'],['摆风','swing_modes',a.swing_mode,'climate-swing','swing_mode'],['运行预设','preset_modes',a.preset_mode,'climate-preset','preset_mode']]) {
        if (!Array.isArray(a[attribute]) || !a[attribute].length) continue;
        const field = make('div', null, 'detail-field'); field.append(make('h3', label));
        const grid = make('div', null, 'grid');
        for (const value of a[attribute]) {
          if (attribute === 'hvac_modes' && value === 'off') continue;
          const icons = {heat:'♨',cool:'❄',auto:'⟳',dry:'♧',fan_only:'✣',none:'⊘',eco:'❧',prevent_super_cool:'❄',off:'⊘',both:'✥',horizontal:'↔',vertical:'↕'};
          const option = button((icons[value] || (attribute === 'fan_modes' ? '≋' : '⚙')) + ' ' + translated(value), action, value === currentValue);
          option.setAttribute('aria-pressed', String(value === currentValue));
          option.onclick = () => run(action, {[parameter]:value}); grid.append(option);
        }
        field.append(grid); climate.append(field);
      }
    } else { const detail = make('button', '⚙ 详细控制　 ›', 'detail'); detail.onclick = () => ha.expand('climate'); climate.append(detail); }
    }
    if (error) { const message = make('p', error, 'error'); message.setAttribute('role','alert'); root.append(message); }
  }
  render(); ha.onStateChange(render);
}
