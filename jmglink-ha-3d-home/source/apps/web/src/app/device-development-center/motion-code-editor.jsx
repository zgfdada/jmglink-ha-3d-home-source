import { a as React } from "../../vendor/react.js";
import { builtinMotionCode } from "../../../../../packages/schema/src/motion-code.js";
import {
  scanVertexShader,
  scanFragmentShader,
} from "../../domain/surface-scan.js";
import { validateMotionProgram } from "../../domain/motion-code-runtime.js";

export function motionSourceKey(effect) {
  return JSON.stringify({
    program: effect.program ?? builtinMotionCode(effect.type),
    shader: effect.shader ?? {},
  });
}
export default function MotionCodeEditor({
  resource,
  disabled,
  onApply,
  onDirty,
}) {
  const effect = resource.effect,
    sourceKey = motionSourceKey(effect);
  const alive = React.useRef(true),
    currentEffect = React.useRef("");
  const effectKey = JSON.stringify(effect);
  currentEffect.current = effectKey;
  React.useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const source = () => ({
    javascript: effect.program?.code ?? builtinMotionCode(effect.type).code,
    fragment: effect.shader?.fragment ?? scanFragmentShader,
    vertex: effect.shader?.vertex ?? scanVertexShader,
  });
  const [buffers, setBuffers] = React.useState(source),
    [tab, setTab] = React.useState("javascript");
  const [baseline, setBaseline] = React.useState(() =>
      JSON.stringify(source()),
    ),
    [busy, setBusy] = React.useState(false),
    [error, setError] = React.useState("");
  const dirty = JSON.stringify(buffers) !== baseline;
  React.useEffect(() => {
    const next = source();
    setBuffers(next);
    setBaseline(JSON.stringify(next));
    setError("");
    if (effect.type !== "scan") setTab("javascript");
  }, [sourceKey, effect.type]);
  React.useEffect(() => {
    onDirty(dirty || busy);
    return () => onDirty(false);
  }, [dirty, busy, onDirty]);
  const apply = async () => {
    if (busy || disabled) return;
    setBusy(true);
    setError("");
    try {
      const { program: programDefinition, shader, ...params } = effect;
      await validateMotionProgram(buffers.javascript, {
        time: 1,
        delta: 1 / 60,
        value: effect.to,
        phase: 0.25,
        angle: effect.to,
        weight: 1,
        mapped: false,
        input: "on",
        params,
      });
      if (!alive.current) return;
      if (currentEffect.current !== effectKey) {
        setError("参数已改变，请重新校验代码。");
        return;
      }
      const next = {
        ...effect,
        program: { version: 1, code: buffers.javascript },
        ...(effect.type === "scan"
          ? { shader: { fragment: buffers.fragment, vertex: buffers.vertex } }
          : {}),
      };
      onApply(next);
      setBaseline(JSON.stringify(buffers));
    } catch (error) {
      if (alive.current) setError(error.message);
    } finally {
      if (alive.current) setBusy(false);
    }
  };
  const edit = (value) => {
    setBuffers((current) => ({ ...current, [tab]: value }));
    setError("");
  };
  const lines = buffers[tab].split("\n").length;
  return (
    <section className="motion-code-panel" aria-label="动效逻辑代码">
      <header>
        <strong>动效逻辑代码</strong>
        <span>{dirty ? "代码已修改" : "代码已应用"}</span>
      </header>
      <nav aria-label="动效代码文件">
        {[
          ["javascript", "JavaScript"],
          ...(effect.type === "scan"
            ? [
                ["fragment", "GLSL · 片元"],
                ["vertex", "GLSL · 顶点"],
              ]
            : []),
        ].map(([id, label]) => (
          <button
            key={id}
            className={tab === id ? "active" : ""}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </nav>
      <div className="motion-code-area">
        <div aria-hidden="true" className="motion-code-gutter">
          {Array.from({ length: lines }, (_, i) => (
            <span key={i}>{i + 1}</span>
          ))}
        </div>
        <textarea
          aria-label={
            tab === "javascript"
              ? "JavaScript 动效代码"
              : tab === "fragment"
                ? "GLSL 片元代码"
                : "GLSL 顶点代码"
          }
          value={buffers[tab]}
          disabled={disabled || busy}
          spellCheck={false}
          wrap="off"
          onChange={(e) => edit(e.target.value)}
          onScroll={(e) => {
            e.target.previousElementSibling.scrollTop = e.target.scrollTop;
          }}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
              e.preventDefault();
              void apply();
            } else if (e.key === "Tab") {
              e.preventDefault();
              const input = e.target,
                start = input.selectionStart,
                end = input.selectionEnd;
              edit(input.value.slice(0, start) + "  " + input.value.slice(end));
              requestAnimationFrame(() =>
                input.setSelectionRange(start + 2, start + 2),
              );
            }
          }}
        />
      </div>
      <div className="motion-code-actions">
        <button className="primary" onClick={apply} disabled={disabled || busy}>
          {busy ? "正在校验…" : "校验并更新效果"}
        </button>
        <small>Ctrl + Enter</small>
      </div>
      {error && (
        <p className="motion-code-error" role="alert">
          {error}
        </p>
      )}
      <details className="motion-code-help">
        <summary>代码接口与返回值</summary>
        <p>
          定义同步函数 <code>update(ctx)</code>
          ，返回当前帧的效果。时间单位为秒，角度单位为度。代码不能操作
          HA、网页或网络。
        </p>
        <p>
          <code>
            ctx.time / delta / input / value / phase / angle / mapped / params
          </code>
        </p>
        <p>
          位移：<code>offset: [x,y,z]</code>；旋转：<code>angle</code>；缩放：
          <code>value</code>；显隐：<code>visible</code>；颜色：
          <code>color, mix</code>；发光：<code>wave, intensity, color</code>
          ；流光：<code>progress: [0…1], color, opacity, trailOpacity</code>
          ；扫光：<code>phase, color, width, intensity</code>。
        </p>
        <p>
          GLSL 使用现有 uniform 和
          varying；修改片元函数可调整光带形状、边缘与混色。先校验并更新效果，再保存动效。
        </p>
      </details>
    </section>
  );
}
