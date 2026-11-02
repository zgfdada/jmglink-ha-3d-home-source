import { a as React } from "../vendor/react.js";
import {
  curtainPreset,
  resolveCurtainTrack,
  normalizeCurtainTrack,
  validateCurtainTrack,
  curtainPathMetrics,
  curtainPointAt,
  curtainClothRanges,
  trackDistance,
  resizeCurtainSegment,
  curtainLocalToWorld,
  curtainWorldToLocal,
  snapCurtainPoint,
  MAX_CURTAIN_NODES,
} from "../../../../packages/schema/src/curtain-track.js";
import "../styles/curtain-track.css";

export function newCurtainSession(device, floorHeight) {
  return {
    deviceId: device.id,
    draft: resolveCurtainTrack(device, floorHeight),
    mode: "nodes",
    selected: 0,
    history: [],
    preview: 40,
  };
}
export function updateCurtainDraft(session, draft) {
  return {
    ...session,
    draft,
    history: [...session.history.slice(-29), session.draft],
  };
}
function NumberField({
  label,
  value,
  onChange,
  min = 0,
  max = 30,
  step = 0.01,
}) {
  return (
    <label className="curtain-number">
      <span>{label}</span>
      <span>
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={Number(value.toFixed(3))}
          onChange={(e) => {
            if (e.target.value !== "") {
              const n = Number(e.target.value);
              if (Number.isFinite(n)) onChange(Math.max(min, Math.min(max, n)));
            }
          }}
        />
        <i>m</i>
      </span>
    </label>
  );
}
export function CurtainTrackPreview({ track, position }) {
  const metrics = curtainPathMetrics(track);
  if (metrics.points.length < 2)
    return <p className="field-hint">绘制两个节点后显示预览。</p>;
  const project = (p, y = 0) => [
    (p[0] - p[1]) * 0.7,
    (p[0] + p[1]) * 0.28 - y * 0.65,
  ];
  const rail = metrics.points.map((p) => project(p));
  const ranges = curtainClothRanges(metrics.length, position, track.opening);
  const curtains = ranges.map(([a, b]) =>
    Array.from(
      { length: 49 },
      (_, i) => curtainPointAt(metrics, a + ((b - a) * i) / 48).point,
    ),
  );
  const all = [
      ...rail,
      ...metrics.points.map((p) => project(p, -track.height)),
    ],
    xs = all.map((p) => p[0]),
    ys = all.map((p) => p[1]);
  const box = [
    Math.min(...xs) - 0.2,
    Math.min(...ys) - 0.2,
    Math.max(...xs) - Math.min(...xs) + 0.4,
    Math.max(...ys) - Math.min(...ys) + 0.4,
  ];
  return (
    <svg
      viewBox={box.join(" ")}
      className="curtain-preview"
      role="img"
      aria-label={`轨道窗帘开度 ${position}% 的立体示意`}
    >
      {curtains.map((points, i) => (
        <g key={i}>
          <polygon
            points={[
              ...points.map((p) => project(p)),
              ...[...points].reverse().map((p) => project(p, -track.height)),
            ]
              .map((p) => p.join(","))
              .join(" ")}
            fill={track.fabric === "sheer" ? "#e8f5ff" : "#a6b5c4"}
            fillOpacity={track.fabric === "sheer" ? ".35" : "1"}
            stroke="#87abc5"
            strokeWidth=".015"
          />
          {points.map((p, j) => (
            <line
              key={j}
              x1={project(p)[0]}
              y1={project(p)[1]}
              x2={project(p, -track.height)[0]}
              y2={project(p, -track.height)[1]}
              stroke={j % 2 ? "#8badc7" : "#eff8ff"}
              strokeWidth=".015"
            />
          ))}
        </g>
      ))}
      <polyline
        points={rail.map((p) => p.join(",")).join(" ")}
        fill="none"
        stroke="#758ba2"
        strokeWidth=".035"
        strokeLinejoin="round"
      />
    </svg>
  );
}
export default function CurtainTrackEditor({
  device,
  floor,
  session,
  setSession,
  onApply,
  onBegin,
}) {
  const active = session?.deviceId === device.id,
    state = active ? session : newCurtainSession(device, floor.height),
    track = state.draft;
  const [localPreview, setLocalPreview] = React.useState(40);
  const applyRef = React.useRef(onApply);
  applyRef.current = onApply;
  const serialized = JSON.stringify(track);
  React.useEffect(() => {
    if (active && !validateCurtainTrack(track)) applyRef.current(normalizeCurtainTrack(track));
  }, [active, serialized]);
  const metrics = curtainPathMetrics(track),
    error = validateCurtainTrack(track),
    segment = Math.min(
      state.selected || 0,
      Math.max(0, track.points.length - 2),
    ),
    nodeIndex = Math.min(
      state.nodeIndex ?? segment + 1,
      Math.max(0, track.points.length - 1),
    );
  const patch = (changes) => {
    const next = { ...track, ...changes };
    setSession(updateCurtainDraft(state, next));
    if (!active) onBegin();
  };
  const mode = (mode) => {
    setSession({ ...state, mode });
    onBegin();
  };
  const preset = (shape) => {
    const next = {
      ...track,
      points: curtainPreset(shape, 3.3, 0.6),
      radius: 0.08,
      drop: 0.05,
      height: Math.max(0.2, floor.height - 0.09),
    };
    setSession(
      updateCurtainDraft({ ...state, mode: "nodes", selected: 0 }, next),
    );
    onBegin();
  };
  const top = Math.max(0.2, floor.height - track.drop),
    bottom = Math.max(0, top - track.height);
  return (
    <section className="property-section curtain-track-property">
      <header>
        <h3>窗帘轨道</h3>
        <small>
          {active
            ? "编辑中 · 有效轨道自动保存"
            : device.curtainTrack
              ? "已配置轨道"
              : "直线轨道 · 旧尺寸已换算"}
        </small>
      </header>
      <div className="curtain-presets">
        {[
          ["line", "─", "直线"],
          ["l", "└", "L 形"],
          ["u", "⊔", "U 形"],
        ].map(([id, icon, name]) => (
          <button type="button" key={id} onClick={() => preset(id)}>
            <b>{icon}</b>
            {name}
          </button>
        ))}
      </div>
      <div className="curtain-editor-actions">
        <button
          type="button"
          className={active && state.mode === "draw" ? "active" : ""}
          onClick={() => {
            setSession(
              updateCurtainDraft(
                { ...state, mode: "draw", selected: 0 },
                { ...track, points: [] },
              ),
            );
            onBegin();
          }}
        >
          自定义绘制
        </button>
        <button type="button" onClick={() => mode("nodes")}>
          编辑节点
        </button>
      </div>
      {active && (
        <>
          <div className="curtain-editor-actions">
            <button
              type="button"
              onClick={() =>
                setSession({
                  ...state,
                  mode: state.mode === "draw" ? "nodes" : "draw",
                })
              }
            >
              {state.mode === "draw" ? "完成绘制" : "继续绘制"}
            </button>
            <button
              type="button"
              disabled={!state.history.length}
              onClick={() =>
                setSession({
                  ...state,
                  draft: state.history.at(-1),
                  history: state.history.slice(0, -1),
                })
              }
            >
              撤销
            </button>
          </div>
          <p className="field-hint">
            在画布中点击添加转角，拖动圆点调整。双击或 Enter 完成绘制；Shift
            锁直；Esc 结束节点编辑。
          </p>
        </>
      )}
      <p className="curtain-summary">
        {track.points.length} 个节点 · 总长 {metrics.length.toFixed(2)} m
      </p>
      {track.points.length > 1 && (
        <>
          <label className="curtain-select">
            <span>选择线段</span>
            <select
              value={segment}
              onChange={(e) => {
                setSession({ ...state, selected: Number(e.target.value) });
                onBegin();
              }}
            >
              {track.points.slice(1).map((_, i) => (
                <option key={i} value={i}>
                  线段 {i + 1} → {i + 2}
                </option>
              ))}
            </select>
          </label>
          <NumberField
            label="线段长度"
            min={0.05}
            value={trackDistance(
              track.points[segment],
              track.points[segment + 1],
            )}
            onChange={(length) =>
              patch({
                points: resizeCurtainSegment(track.points, segment, length),
              })
            }
          />
          <label className="curtain-select">
            <span>选择节点</span>
            <select
              value={nodeIndex}
              onChange={(e) => {
                setSession({ ...state, nodeIndex: Number(e.target.value) });
                onBegin();
              }}
            >
              {track.points.map((_, i) => (
                <option key={i} value={i}>
                  节点 {i + 1}
                  {i === 0
                    ? " · 起点"
                    : i === track.points.length - 1
                      ? " · 终点"
                      : ""}
                </option>
              ))}
            </select>
          </label>
          <div className="curtain-editor-actions">
            <button
              type="button"
              disabled={track.points.length >= MAX_CURTAIN_NODES}
              onClick={() => {
                const points = track.points.map((p) => [...p]),
                  a = points[segment],
                  b = points[segment + 1];
                points.splice(segment + 1, 0, [
                  (a[0] + b[0]) / 2,
                  (a[1] + b[1]) / 2,
                ]);
                patch({ points });
              }}
            >
              在线段中点加节点
            </button>
            <button
              type="button"
              disabled={track.points.length <= 2}
              onClick={() =>
                patch({
                  points: track.points.filter((_, i) => i !== nodeIndex),
                })
              }
            >
              删除选中节点
            </button>
          </div>
        </>
      )}
      <NumberField
        label="吸附距墙面"
        max={1}
        value={track.wallOffset ?? 0.12}
        onChange={(wallOffset) => patch({ wallOffset })}
      />
      <p className="field-hint">
        距墙用于绘制和拖动时吸附，不会自动挪动已有轨道。
      </p>
      <NumberField
        label="转角圆弧"
        max={1}
        value={track.radius}
        onChange={(radius) => patch({ radius })}
      />
      <h4>安装与帘布</h4>
      <p className="field-hint">天花板安装 · 尺寸使用米，不再整体缩放。</p>
      <NumberField
        label="距顶"
        max={Math.max(0, floor.height - 0.2)}
        value={track.drop}
        onChange={(drop) =>
          patch({
            drop,
            height: Math.max(0.2, Math.min(track.height, floor.height - drop)),
          })
        }
      />
      <NumberField
        label="帘布高度"
        min={0.2}
        max={top}
        value={track.height}
        onChange={(height) => patch({ height })}
      />
      <NumberField
        label="离地"
        max={Math.max(0, top - 0.2)}
        value={bottom}
        onChange={(gap) => patch({ height: Math.max(0.2, top - gap) })}
      />
      <h4>开合方式</h4>
      <div className="curtain-opening">
        {[
          ["start", "起点收拢"],
          ["end", "终点收拢"],
          ["split", "两端对开"],
        ].map(([id, label]) => (
          <button
            type="button"
            key={id}
            aria-pressed={track.opening === id}
            onClick={() => patch({ opening: id })}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="field-hint">
        帘布沿整条轨道移动，HA 开度 100%
        表示完全打开；完全打开仍保留收拢的褶皱。
      </p>
      <h4>立体开合示意</h4>
      <CurtainTrackPreview
        track={track}
        position={active ? state.preview : localPreview}
      />
      <label className="curtain-preview-control">
        <span>模拟开度 {active ? state.preview : localPreview}%</span>
        <input
          type="range"
          min="0"
          max="100"
          value={active ? state.preview : localPreview}
          onChange={(e) =>
            active
              ? setSession({ ...state, preview: Number(e.target.value) })
              : setLocalPreview(Number(e.target.value))
          }
        />
      </label>
      <p className="field-hint">
        开度仅本地模拟，不控制设备；有效轨道自动保存，可直接切到 3D 查看。
      </p>
      {error && (
        <p className="curtain-error" role="alert">
          {error}
        </p>
      )}

    </section>
  );
}

export function CurtainTrackPlan({
  device,
  track,
  selected = false,
  onSelect,
}) {
  const points = curtainPathMetrics(track).points.map((p) =>
    curtainLocalToWorld(p, device),
  );
  return (
    <polyline
      className={`curtain-plan-path ${selected ? "selected" : ""}`}
      points={points.map((p) => p.join(",")).join(" ")}
      fill="none"
      pointerEvents={onSelect ? "stroke" : "none"}
      onPointerDown={onSelect ? (e) => e.stopPropagation() : undefined}
      onClick={onSelect}
    />
  );
}

export function CurtainTrackOverlay({
  device,
  session,
  setSession,
  getPoint,
  walls,
  snapEnabled,
  zoom,
  panActive,
}) {
  const dragging = React.useRef(null),
    [hover, setHover] = React.useState(null),
    stateRef = React.useRef(session);
  stateRef.current = session;
  const { draft, mode, selected } = session,
    unit = 0.12 / Math.max(0.6, zoom);
  React.useEffect(() => {
    const listener = (e) => {
      const s = stateRef.current;
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopImmediatePropagation();
        setSession(null);
        return;
      }
      if (
        e.target instanceof Element &&
        e.target.closest("input,select,textarea")
      )
        return;
      // Keep the global editor's undo, delete, arrows and tool shortcuts away from an uncommitted track.
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (s.history.length)
          setSession({
            ...s,
            draft: s.history.at(-1),
            history: s.history.slice(0, -1),
          });
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        e.stopImmediatePropagation();
        setSession({ ...s, mode: "nodes" });
        return;
      }
      if (
        [
          "Delete",
          "Backspace",
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
        ].includes(e.key) ||
        (!e.ctrlKey && !e.metaKey && e.key.length === 1 && e.code !== "Space")
      ) {
        e.stopImmediatePropagation();
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", listener, true);
    return () => window.removeEventListener("keydown", listener, true);
  }, [setSession]);
  const world = draft.points.map((p) => curtainLocalToWorld(p, device));
  const point = (e) => {
    const anchor = dragging.current
      ? world[Math.max(0, dragging.current.index - 1)]
      : world.at(-1);
    return snapCurtainPoint(getPoint(e), {
      enabled: snapEnabled,
      walls,
      wallOffset: draft.wallOffset ?? 0.12,
      threshold: 0.13 / Math.max(0.75, zoom),
      anchor,
      forceAxis: e.shiftKey,
    });
  };
  const move = (e) => {
    if (panActive) return;
    e.stopPropagation();
    const p = point(e);
    setHover(p);
    if (dragging.current) {
      const points = draft.points.map((v) => [...v]);
      points[dragging.current.index] = curtainWorldToLocal(p, device);
      setSession({ ...session, draft: { ...draft, points } });
    }
  };
  const down = (e) => {
    if (e.button !== 0 || panActive) return;
    e.preventDefault();
    e.stopPropagation();
    if (
      mode === "draw" &&
      e.detail < 2 &&
      draft.points.length < MAX_CURTAIN_NODES
    ) {
      const p = curtainWorldToLocal(point(e), device);
      if (!draft.points.length || trackDistance(draft.points.at(-1), p) >= 0.05)
        setSession(
          updateCurtainDraft(session, {
            ...draft,
            points: [...draft.points, p],
          }),
        );
    }
  };
  const up = (e) => {
    if (panActive) return;
    e.stopPropagation();
    dragging.current = null;
  };
  return (
    <g
      className="curtain-track-overlay"
      onClick={(e) => e.stopPropagation()}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={() => {
        dragging.current = null;
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        setSession({ ...session, mode: "nodes" });
      }}
    >
      {mode === "draw" && <rect
        x="-10000"
        y="-10000"
        width="20000"
        height="20000"
        fill="transparent"
        onPointerDown={down}
        style={{ cursor: mode === "draw" ? "crosshair" : "default" }}
      />}
      <CurtainTrackPlan device={device} track={draft} selected />
      {mode === "draw" && hover && world.length > 0 && (
        <line
          x1={world.at(-1)[0]}
          y1={world.at(-1)[1]}
          x2={hover[0]}
          y2={hover[1]}
          stroke="#4d94ff"
          strokeWidth={unit * 0.2}
          strokeDasharray={`${unit} ${unit}`}
          pointerEvents="none"
        />
      )}
      {world.slice(1).map((b, i) => {
        const a = world[i];
        return (
          <g key={`segment-${i}`}>
            <line
              x1={a[0]}
              y1={a[1]}
              x2={b[0]}
              y2={b[1]}
              stroke={selected === i ? "#2268ec" : "transparent"}
              strokeWidth={unit * 0.45}
              onPointerDown={(e) => {
                e.stopPropagation();
                setSession({ ...session, selected: i });
              }}
            />
            <text
              x={(a[0] + b[0]) / 2}
              y={(a[1] + b[1]) / 2 - unit}
              fontSize={unit * 1.2}
              textAnchor="middle"
              fill="#1d63cf"
              stroke="white"
              strokeWidth={unit * 0.35}
              paintOrder="stroke"
              pointerEvents="none"
            >
              {trackDistance(a, b).toFixed(2)} m
            </text>
          </g>
        );
      })}
      {world.map((p, i) => (
        <g
          key={i}
          onPointerDown={(e) => {
            if (e.button !== 0 || panActive) return;
            e.stopPropagation();
            e.preventDefault();
            dragging.current = { index: i };
            setSession({
              ...session,
              nodeIndex: i,
              selected: Math.min(i, Math.max(0, world.length - 2)),
              history: [...session.history.slice(-29), draft],
            });
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
        >
          <circle
            cx={p[0]}
            cy={p[1]}
            r={unit}
            fill="#4d94ff"
            stroke="white"
            strokeWidth={unit * 0.2}
            style={{ cursor: "grab" }}
          />
          <text
            x={p[0]}
            y={p[1] + unit * 0.4}
            textAnchor="middle"
            fontSize={unit * 1.2}
            fill="white"
            pointerEvents="none"
          >
            {i + 1}
          </text>
          {(i === 0 || i === world.length - 1) && (
            <text
              x={p[0]}
              y={p[1] + unit * 2.5}
              textAnchor="middle"
              fontSize={unit}
              fill="#263b52"
              stroke="white"
              strokeWidth={unit * 0.3}
              paintOrder="stroke"
              pointerEvents="none"
            >
              {i === 0 ? "起点" : "终点"}
            </text>
          )}
        </g>
      ))}
    </g>
  );
}
