import { a as React } from "../vendor/react.js";
import { doorSensorCandidates } from "../domain/door-sensor.js";
import "../styles/door-sensor-binding.css";
export default function DoorSensorBinding({
  opening,
  entities,
  stateLabel,
  onChange,
}) {
  const [query, setQuery] = React.useState(""),
    [open, setOpen] = React.useState(false),
    [active, setActive] = React.useState(0);
  const input = React.useRef(null),
    container = React.useRef(null),
    id = React.useId();
  const bound = opening.entityId ? entities[opening.entityId] : undefined;
  const matches = React.useMemo(
    () => doorSensorCandidates(entities, query),
    [entities, query],
  );
  const options = [{ entityId: "", name: "不绑定" }, ...matches];
  const close = () => {
    setOpen(false);
    setQuery("");
    setActive(0);
  };
  const choose = (entityId) => {
    onChange(entityId);
    close();
  };
  React.useEffect(() => {
    if (!open) return;
    const outside = (e) => {
      if (!container.current?.contains(e.target)) close();
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);
  React.useEffect(() => {
    if (open)
      container.current
        ?.querySelector('[data-active="true"]')
        ?.scrollIntoView({ block: "nearest" });
  }, [active, open]);
  const label = bound?.name || opening.entityId || "不绑定";
  React.useEffect(() => {
    if (open) container.current?.scrollIntoView({ block: "nearest" });
    else if (input.current) {
      input.current.setSelectionRange(0, 0);
      input.current.scrollLeft = 0;
    }
  }, [open, label]);
  const expand = () => {
    setQuery("");
    setActive(0);
    setOpen(true);
  };
  const keyDown = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      close();
      return;
    }
    if (["ArrowDown", "ArrowUp", "Enter", "Home", "End"].includes(e.key))
      e.stopPropagation();
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) {
        expand();
        return;
      }
      setActive((n) =>
        Math.max(
          0,
          Math.min(options.length - 1, n + (e.key === "ArrowDown" ? 1 : -1)),
        ),
      );
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (open) {
        if (options[active]) choose(options[active].entityId);
      } else expand();
    }
    if (open && ["Home", "End"].includes(e.key)) {
      e.preventDefault();
      setActive(e.key === "Home" ? 0 : options.length - 1);
    }
  };
  return (
    <div
      className="property-section door-sensor-property"
      ref={container}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) close();
      }}
    >
      <h3>门磁绑定</h3>
      <div className={"door-sensor-combobox" + (open ? " is-open" : "")}>
        <input
          ref={input}
          role="combobox"
          aria-label="门磁传感器"
          aria-expanded={open}
          aria-controls={id}
          aria-autocomplete="list"
          aria-activedescendant={
            open && options[active] ? id + "-" + active : undefined
          }
          placeholder="搜索名称或实体 ID"
          value={open ? query : label}
          onFocus={expand}
          onClick={() => {
            if (!open) expand();
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActive(e.target.value.trim() ? 1 : 0);
          }}
          onKeyDown={keyDown}
        />
        <button
          type="button"
          aria-label={open ? "收起门磁列表" : "展开门磁列表"}
          aria-expanded={open}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            if (open) close();
            else {
              expand();
              input.current?.focus();
            }
          }}
        >
          <span aria-hidden="true">{open ? "▴" : "▾"}</span>
        </button>
      </div>
      {open && (
        <div className="door-sensor-dropdown">
          <div
            role="listbox"
            id={id}
            aria-label="门磁传感器候选"
            className="door-sensor-options"
          >
            {options.map((entity, index) => (
              <button
                type="button"
                role="option"
                id={id + "-" + index}
                key={entity.entityId}
                tabIndex={-1}
                aria-selected={(opening.entityId ?? "") === entity.entityId}
                data-active={index === active}
                onMouseDown={(e) => e.preventDefault()}
                onPointerMove={() => setActive(index)}
                onClick={() => choose(entity.entityId)}
              >
                <strong>{entity.name || entity.entityId}</strong>
                {entity.entityId && (
                  <>
                    <span className="door-sensor-id">{entity.entityId}</span>
                    <span className="door-sensor-state">
                      {stateLabel(entity)}
                    </span>
                  </>
                )}
              </button>
            ))}
          </div>
          <p role="status" className="door-sensor-result">
            {matches.length
              ? "匹配 " + matches.length + " 个传感器"
              : "没有匹配的传感器，请更换关键词"}
          </p>
        </div>
      )}
      <p className="field-hint">
        {bound ? "当前状态：" + stateLabel(bound) + "。" : ""}支持 binary_sensor
        门磁及 sensor 门状态；输入即可搜索，选择后绑定。
      </p>
    </div>
  );
}
