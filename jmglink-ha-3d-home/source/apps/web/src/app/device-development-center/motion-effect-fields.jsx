import { a as React } from "../../vendor/react.js";
export default function MotionEffectFields({
  value,
  onChange,
  mappingEnabled = false,
  picking = false,
  onTogglePicking,
  rotationTools,
}) {
  const input = (label, value, change, props = {}) => (
    <label>
      <span>{label}</span>
      <input
        aria-label={label}
        value={value ?? ""}
        onChange={(event) => change(event.target.value)}
        {...props}
      />
    </label>
  );
  const numeric = (label, value, change, props = {}) =>
    input(label, value, change, { type: "number", step: "any", ...props });
  return (
    <>
      {" "}
      {["translate", "rotate", "spin", "scale"].includes(value.type) && (
        <>
          <label>
            局部轴
            <select
              aria-label="动效局部轴"
              value={value.axis}
              onChange={(e) => onChange({ axis: e.target.value })}
            >
              {["x", "y", "z"].map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          </label>
          {["rotate","spin"].includes(value.type) && <small>局部轴是旋转时保持不动的那根轴；其余两个方向围绕它转动。例如绕 X 轴开盖，X 轴方向不变。</small>}
          {rotationTools}
          {(value.type !== "rotate" || !rotationTools) && <div className="part-motion-row">
            {numeric("起始值", value.from, (from) => onChange({ from }))}
            {numeric(
              value.type === "spin"
                ? "转速（度/秒）"
                : value.type === "rotate"
                  ? "目标角度（度）"
                  : "目标值",
              value.to,
              (to) => onChange({ to }),
            )}
          </div>}
          {["rotate", "spin"].includes(value.type) && !rotationTools && (
            <>
              <small>旋转中心：相对首个顶层作用部件原点的局部 XYZ 偏移；多选部件共用此轴心。</small>
              <div className="part-motion-row">
                {[0, 1, 2].map((i) => (
                  <React.Fragment key={i}>
                    {numeric(`轴心 ${"XYZ"[i]}`, value.pivot[i], (v) =>
                      onChange({
                        pivot: value.pivot.map((x, j) => (i === j ? v : x)),
                      }),
                    )}
                  </React.Fragment>
                ))}
              </div>
            </>
          )}
        </>
      )}
      {value.type === "visible" && (
        <label>
          激活后
          <select
            aria-label="激活后显隐"
            value={value.to}
            onChange={(e) => onChange({ to: Number(e.target.value) })}
          >
            <option value={1}>显示</option>
            <option value={0}>隐藏</option>
          </select>
        </label>
      )}
      {["color", "emissive", "flow", "scan"].includes(value.type) &&
        input("动效颜色", value.color, (color) => onChange({ color }), {
          type: "color",
        })}
      {value.type === "emissive" && (
        <>
          {numeric(
            "发光强度",
            value.intensity,
            (intensity) => onChange({ intensity }),
            { min: 0, max: 20, disabled: mappingEnabled },
          )}
          <select
            aria-label="发光变化方式"
            value={value.mode}
            onChange={(e) => onChange({ mode: e.target.value })}
          >
            <option value="steady">常亮</option>
            <option value="breathe">呼吸</option>
            <option value="blink">闪烁</option>
          </select>
        </>
      )}
      {["emissive", "spin", "flow", "scan"].includes(value.type) &&
        numeric("速度倍率", value.speed, (speed) => onChange({ speed }), {
          min: -20,
          max: 20,
        })}
      {value.type === "scan" && (
        <>
          <label>
            扫光方向
            <select
              aria-label="扫光局部轴"
              value={value.axis}
              onChange={(e) => onChange({ axis: e.target.value })}
            >
              <option value="x">局部 X 轴</option>
              <option value="y">局部 Y 轴</option>
              <option value="z">局部 Z 轴</option>
            </select>
          </label>
          {numeric(
            "光带宽度（模型长度比例）",
            value.width,
            (width) => onChange({ width }),
            { min: 0.02, max: 1, step: 0.01 },
          )}
          {numeric(
            "扫光强度",
            value.intensity,
            (intensity) => onChange({ intensity }),
            { min: 0, max: 20, step: 0.1 },
          )}
          <small>
            沿模型表面循环扫过；负速度反向，速度 2
            约为两秒一轮。整体扫光可选部件树根节点，不需要 UV 或逐点绘制路径。
          </small>
        </>
      )}
      {value.type === "flow" && (
        <div className="part-motion-path">
          <p>路径点（所选部件局部坐标）</p>
          {onTogglePicking && (
            <button onClick={() => onTogglePicking()}>
              {picking ? "结束拾取" : "在模型上拾取路径点"}
            </button>
          )}
          <button onClick={() => onChange({ path: [] })}>清空路径</button>
          {value.path.map((p, i) => (
            <div className="part-motion-row" key={i}>
              {p.map((v, j) => (
                <input
                  key={j}
                  type="number"
                  step="any"
                  aria-label={`路径点 ${i + 1} ${"XYZ"[j]}`}
                  value={v}
                  onChange={(e) =>
                    onChange({
                      path: value.path.map((pt, n) =>
                        n === i
                          ? pt.map((x, k) => (k === j ? e.target.value : x))
                          : pt,
                      ),
                    })
                  }
                />
              ))}
              <button
                aria-label={`删除路径点 ${i + 1}`}
                onClick={() =>
                  onChange({
                    path: value.path.filter((_, n) => n !== i),
                  })
                }
              >
                ×
              </button>
            </div>
          ))}
          <button
            onClick={() => onChange({ path: [...value.path, [0, 0, 0]] })}
          >
            ＋ 路径点
          </button>
        </div>
      )}
    </>
  );
}
