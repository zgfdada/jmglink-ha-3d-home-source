import {
  resolveLibraryControl,
  hasNative,
  effectiveControl,
  controlUnit,
  resolvePropertyStyle,
} from "../../../../packages/schema/src/control-library.js";
import { a as React } from "../vendor/react.js";
import {
  panelVariant,
  panelValue,
  panelOptions,
  controlVisible,
} from "../domain/device-panel.js";
import "../styles/shared-device-panel.css";

function NumericInput({
  control,
  state,
  writable,
  send,
  range = false,
  style,
}) {
  const value = state?.state;
  const [draft, setDraft] = React.useState(
    value == null || ["unknown", "unavailable"].includes(value)
      ? ""
      : String(value),
  );
  React.useEffect(
    () =>
      setDraft(
        value == null || ["unknown", "unavailable"].includes(value)
          ? ""
          : String(value),
      ),
    [value],
  );
  const min = control.min ?? state?.min,
    max = control.max ?? state?.max,
    step = control.step ?? state?.step ?? 1;
  const submit = () => {
    if (
      draft !== "" &&
      Number.isFinite(Number(draft)) &&
      Number(draft) !== Number(value) &&
      (min == null || Number(draft) >= min) &&
      (max == null || Number(draft) <= max)
    )
      send(Number(draft));
  };
  return (
    <input
      style={{ textAlign: { "flex-start": "left", "flex-end": "right" }[control.props?.valueAlign] || "center", ...style }}
      aria-label={control.label}
      type={range ? "range" : "number"}
      value={draft}
      min={min}
      max={max}
      step={step}
      disabled={!writable}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={range ? undefined : submit}
      onPointerUp={range ? submit : undefined}
      onKeyUp={(e) => {
        if (range || e.key === "Enter") submit();
      }}
    />
  );
}
function PanelControl({ control: c, state: s, states, interactive, onAction }) {
  const variant = panelVariant(c),
    value = s?.state,
    on = [true, "true", "on", 1].includes(value);
  const writable =
    interactive &&
    s &&
    s.bound !== false &&
    s.available !== false &&
    ["write", "read-write", "action"].includes(s.access);
  const send = (next) => {
    if (!writable) return;
    if (c.confirm && !window.confirm(`确认执行“${c.label}”？`)) return;
    onAction?.(c.capabilityId, next, c);
  };
  const unit = controlUnit(c, s);
  const display = panelValue(s);
  if (c.type === "divider")
    return (
      <>
        <b>{c.label}</b>
        <hr />
      </>
    );
  if (c.type === "container") return <b>{c.label}</b>;
  if (["text", "richtext"].includes(c.type) && !c.capabilityId)
    return (
      <>
        <span className="hp-label">
          {c.icon && <span aria-hidden="true">{c.icon} </span>}
          {c.label}
        </span>
        <div className={variant === "quote" ? "hp-quote-value" : undefined}
          style={variant === "quote" ? { textAlign: { "flex-start": "left", "flex-end": "right" }[c.props?.valueAlign] || "center" } : undefined}
        >{c.content || "文本内容"}</div>
      </>
    );
  if (!s || s.bound === false)
    return (
      <>
        <span className="hp-label">{c.label}</span>
        <strong className="hp-unbound">未绑定</strong>
      </>
    );
  const heading = <span className="hp-label">{c.label}</span>;
  if (c.type === "toggle")
    return (
      <>
        {heading}
        {variant === "segmented" ? (
          <div className="hp-segments">
            <button
              disabled={!writable}
              className={on ? "active" : ""}
              onClick={() => send(true)}
            >
              开启
            </button>
            <button
              disabled={!writable}
              className={!on ? "active" : ""}
              onClick={() => send(false)}
            >
              关闭
            </button>
          </div>
        ) : (
          <button
            className={`hp-toggle ${on ? "on" : ""} ${variant}`}
            disabled={!writable}
            onClick={() => send(!on)}
          >
            {variant === "power" ? (
              "⏻"
            ) : (
              <>
                <i />
                <span>{on ? "已开启" : "已关闭"}</span>
              </>
            )}
          </button>
        )}
      </>
    );
  if (c.type === "button")
    return (
      <>
        {heading}
        <button disabled={!writable} onClick={() => send(true)}>
          {variant === "icon" ? "◉ " : ""}执行
        </button>
      </>
    );
  if (c.type === "select") {
    const options = panelOptions(c, s);
    return (
      <>
        {heading}
        {["radio", "grid"].includes(variant) ? (
          <div className={`hp-options ${variant}`}>
            {options.map((o) => (
              <button
                key={o.value}
                className={String(value) === o.value ? "active" : ""}
                disabled={!writable}
                onClick={() => send(o.value)}
              >
                {o.label}
              </button>
            ))}
          </div>
        ) : (
          <select
            aria-label={c.label}
            disabled={!writable}
            value={String(value ?? "")}
            onChange={(e) => send(e.target.value)}
          >
            <option value="">请选择</option>
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        )}
      </>
    );
  }
  if (c.type === "number")
    return (
      <>
        {heading}
        {variant === "metric" ? (
          <strong
            className="hp-metric"
            style={{ justifyContent: c.props?.valueAlign ?? "center" }}
          >
            {display}
            <small>{unit}</small>
          </strong>
        ) : variant === "stepper" ? (
          <div className="hp-stepper">
            <button
              disabled={
                !writable ||
                !Number.isFinite(Number(value)) ||
                Number(value) - (c.step ?? s.step ?? 1) <
                  (c.min ?? s.min ?? -Infinity)
              }
              onClick={() => send(Number(value) - (c.step ?? s.step ?? 1))}
            >
              −
            </button>
            <NumericInput
              control={c}
              state={s}
              writable={writable}
              send={send}
            />
            <button
              disabled={
                !writable ||
                !Number.isFinite(Number(value)) ||
                Number(value) + (c.step ?? s.step ?? 1) >
                  (c.max ?? s.max ?? Infinity)
              }
              onClick={() => send(Number(value) + (c.step ?? s.step ?? 1))}
            >
              ＋
            </button>
            {unit && <small>{unit}</small>}
          </div>
        ) : (
          <div className="hp-input">
            <NumericInput
              control={c}
              state={s}
              writable={writable}
              send={send}
            />
            {unit && <small>{unit}</small>}
          </div>
        )}
      </>
    );
  if (c.type === "slider")
    return (
      <>
        {heading}
        <NumericInput
          control={c}
          state={s}
          writable={writable}
          send={send}
          range
        />
        <strong style={{ textAlign: { "flex-start": "left", "flex-end": "right" }[c.props?.valueAlign] || "center" }}>
          {display}
          {unit}
        </strong>
      </>
    );
  if (c.type === "progress") {
    const p = Math.max(
      0,
      Math.min(
        100,
        ((Number(value) - (c.min ?? 0)) /
          ((c.max ?? 100) - (c.min ?? 0) || 1)) *
          100,
      ),
    );
    return (
      <>
        {heading}
        {variant === "circle" ? (
          <div className="hp-ring" style={{ "--hp-progress": `${p}%` }}>
            <b>
              {display}
              {unit}
            </b>
          </div>
        ) : (
          <>
            <progress max="100" value={p} />
            <strong style={{ textAlign: { "flex-start": "left", "flex-end": "right" }[c.props?.valueAlign] || "center" }}>
              {display}
              {unit}
            </strong>
          </>
        )}
      </>
    );
  }
  if (c.type === "stats")
    return (
      <>
        {heading}
        <strong className={variant === "metric" ? "hp-metric" : "hp-value"}>
          {display}
          <small>{unit}</small>
        </strong>
      </>
    );
  if (c.type === "icon")
    return (
      <>
        {heading}
        <strong className="hp-icon">◈</strong>
        <span>{display}</span>
      </>
    );
  return (
    <>
      {heading}
      <strong className={c.type === "text" && variant === "quote" ? "hp-quote-value" : "hp-value"}
        style={c.type === "text" && variant === "quote" ? { textAlign: { "flex-start": "left", "flex-end": "right" }[c.props?.valueAlign] || "center" } : undefined}>
        {display}
        {unit}
      </strong>
    </>
  );
}
function LibraryUi({ node, control, state, states, interactive, onAction }) {
  const context = {
    label: control.label,
    icon: control.icon || "",
    value: !control.capabilityId
      ? control.content || "文本内容"
      : panelValue(state),
    unit: controlUnit(control, state),
    rawValue: state?.state ?? "—",
  };
  const text = String(node.text || "").replace(
    /\{\{(label|icon|value|unit|rawValue)\}\}/g,
    (_, key) => String(context[key]),
  );
  const interpolate = (value) =>
    typeof value === "string"
      ? value.replace(/\{\{props\.([a-zA-Z][a-zA-Z0-9_]*)\}\}/g, (_, key) =>
          String(control.props?.[key] ?? ""),
        )
      : value;
  const style = resolvePropertyStyle(node.style, control.props);
  const itemStyle = resolvePropertyStyle(node.itemStyle, control.props),
    activeStyle = resolvePropertyStyle(node.activeStyle, control.props);
  const writable =
    interactive &&
    state &&
    state.bound !== false &&
    state.available !== false &&
    ["write", "read-write", "action"].includes(state.access);
  const send = (next) => {
    if (!writable) return;
    if (control.confirm && !window.confirm(`确认执行“${control.label}”？`))
      return;
    onAction?.(control.capabilityId, next, control);
  };
  if (node.kind === "divider")
    return <hr style={{ width: "100%", ...style }} />;
  if (node.kind === "icon")
    return context.icon || text ? (
      <span style={style}>{text || context.icon}</span>
    ) : null;
  if (node.kind === "input")
    return (
      <NumericInput
        control={control}
        state={state}
        writable={
          writable &&
          (state.dataType === "number" ||
            state.dataType === "integer" ||
            ["number", "slider"].includes(control.type))
        }
        send={send}
        range={node.mode === "range"}
        style={style}
      />
    );
  if (node.kind === "options") {
    const options =
      node.mode === "boolean"
        ? [
            { value: true, label: "开启" },
            { value: false, label: "关闭" },
          ]
        : panelOptions(control, state);
    const active = (value) =>
      node.mode === "boolean"
        ? [true, "true", "on", 1].includes(state?.state) === value
        : String(state?.state) === String(value);
    if (node.mode === "dropdown")
      return (
        <select
          aria-label={control.label}
          disabled={!writable}
          value={String(state?.state ?? "")}
          onChange={(e) => send(e.target.value)}
          style={{ ...itemStyle, ...style }}
        >
          <option value="">请选择</option>
          {options.map((o) => (
            <option key={String(o.value)} value={String(o.value)}>
              {o.label}
            </option>
          ))}
        </select>
      );
    return (
      <div
        style={{
          display: node.mode === "buttons" ? "flex" : "grid",
          flexWrap: "wrap",
          gridTemplateColumns: "repeat(2,minmax(0,1fr))",
          gap: "4px",
          ...style,
        }}
      >
        {options.map((o) => (
          <button
            type="button"
            key={String(o.value)}
            disabled={!writable}
            style={{
              flex: "1 1 auto",
              ...itemStyle,
              ...(active(o.value) ? activeStyle : {}),
            }}
            onClick={() => send(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    );
  }
  if (node.kind === "switch") {
    const on = [true, "true", "on", 1].includes(state?.state);
    return (
      <button
        type="button"
        aria-label={control.label}
        aria-pressed={on}
        disabled={!writable}
        onClick={() => send(!on)}
        style={style}
        className={`hp-toggle ${on ? "on" : ""} ${node.mode === "power" ? "power" : "switch"}`}
      >
        {node.mode === "power" ? (
          "⏻"
        ) : (
          <>
            <i />
            <span>{on ? "已开启" : "已关闭"}</span>
          </>
        )}
      </button>
    );
  }
  if (node.kind === "progress") {
    const percent = Math.max(
      0,
      Math.min(
        100,
        (((Number(state?.state) || 0) - (control.min ?? 0)) /
          ((control.max ?? 100) - (control.min ?? 0) || 1)) *
          100,
      ),
    );
    if (node.mode === "circle")
      return (
        <div
          className="hp-ring"
          style={{
            "--hp-progress": `${percent}%`,
            ...style,
            height: style.height === "12px" ? "60px" : style.height,
          }}
        >
          <b>
            {context.value}
            {context.unit}
          </b>
        </div>
      );
    return (
      <progress
        max="100"
        value={percent}
        style={{
          ...style,
          ...(node.mode === "steps"
            ? {
                maskImage:
                  "repeating-linear-gradient(90deg,#000 0,#000 8%,transparent 8%,transparent 10%)",
              }
            : {}),
        }}
      />
    );
  }
  if (node.kind === "native")
    return (
      <div className="hp-library-native" style={style}>
        <PanelControl
          control={control}
          state={state}
          states={states}
          interactive={interactive}
          onAction={onAction}
        />
      </div>
    );
  if (["label", "value", "unit", "text"].includes(node.kind))
    return (
      <span style={style}>
        {node.kind === "text" ? interpolate(text) : context[node.kind]}
      </span>
    );
  if (node.kind === "button") {
    const writable =
      interactive &&
      state &&
      state.bound !== false &&
      state.available !== false &&
      ["write", "read-write", "action"].includes(state.access);
    const supported =
      (node.action === "toggle" &&
        (state?.dataType === "boolean" || control.type === "toggle")) ||
      (["increment", "decrement"].includes(node.action) &&
        (state?.dataType === "number" ||
          state?.dataType === "integer" ||
          ["number", "slider"].includes(control.type))) ||
      (node.action === "press" &&
        (state?.kind === "action" ||
          state?.dataType === "action" ||
          control.type === "button"));
    const send = () => {
      if (!writable || !supported) return;
      let value =
        node.action === "toggle"
          ? ![true, "true", "on", 1].includes(state.state)
          : true;
      if (["increment", "decrement"].includes(node.action)) {
        if (state.state == null || !Number.isFinite(Number(state.state)))
          return;
        value =
          Number(state.state) +
          (node.action === "increment" ? 1 : -1) *
            (control.step ?? state.step ?? 1);
        if (
          value < (control.min ?? state.min ?? -Infinity) ||
          value > (control.max ?? state.max ?? Infinity)
        )
          return;
      }
      if (control.confirm && !window.confirm(`确认执行“${control.label}”？`))
        return;
      onAction?.(control.capabilityId, value, control);
    };
    return (
      <button
        type="button"
        disabled={!writable || !supported}
        style={style}
        onClick={send}
      >
        {interpolate(text) || control.label}
      </button>
    );
  }
  return (
    <div className={`hp-ui-${node.kind}`} style={style}>
      {(node.children || []).map((child, index) => (
        <LibraryUi
          key={index}
          node={child}
          control={control}
          state={state}
          states={states}
          interactive={interactive}
          onAction={onAction}
        />
      ))}
    </div>
  );
}
export default function DevicePanel({
  panel,
  states = {},
  interactive = false,
  onAction,
  editing = false,
  selectedId,
  onSelect,
  onDragStart,
  gridRef,
  warnings = {},
}) {
  return (
    <div className="ha3d-panel">
      {(panel?.sections || []).map((section) => (
        <section key={section.id}>
          {section.title && <h3>{section.title}</h3>}
          <div
            className={`hp-grid ${panel.layoutMode === "grid" ? "" : "stack"}`}
            ref={gridRef}
          >
            {(section.controls || [])
              .map(effectiveControl)
              .filter((c) => editing || controlVisible(c, states))
              .map((c) => (
                <div
                  key={c.id}
                  className={`hp-control type-${c.type} variant-${hasNative(resolveLibraryControl(c)?.ui) ? panelVariant(c) : "custom"} ${editing && selectedId === c.id ? "selected" : ""}`}
                  style={
                    panel.layoutMode === "grid"
                      ? {
                          ...resolvePropertyStyle(
                            resolveLibraryControl(c)?.style,
                            c.props,
                          ),
                          gridColumn: `${(c.grid?.x || 0) + 1} / span ${c.grid?.w || 2}`,
                          gridRow: (c.grid?.y || 0) + 1,
                        }
                      : resolvePropertyStyle(
                          resolveLibraryControl(c)?.style,
                          c.props,
                        )
                  }
                  draggable={editing}
                  onDragStart={(e) => onDragStart?.(e, c)}
                  onClickCapture={
                    editing
                      ? (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onSelect?.(c.id);
                        }
                      : undefined
                  }
                >
                  <LibraryUi
                    node={resolveLibraryControl(c)?.ui || { kind: "native" }}
                    control={c}
                    state={states[c.capabilityId]}
                    states={states}
                    interactive={interactive && !editing}
                    onAction={onAction}
                  />
                  {editing && (
                    <div
                      className="hp-editor-hit"
                      aria-label={`编辑 ${c.label}`}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onSelect?.(c.id);
                        }
                      }}
                    />
                  )}
                  {editing && warnings[c.id] && (
                    <small className="hp-editor-warning">
                      ⚠ {warnings[c.id]}
                    </small>
                  )}
                </div>
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
