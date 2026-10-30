import { a as React } from "../../vendor/react.js";
import { builtinMotionResources } from "../../../../../packages/schema/src/motion-library.js";

export async function motionLibraryApi(path = "", options = {}) {
  const response = await fetch(`./api/motion-library${path}`, {
    ...options,
    headers: { "Content-Type": "application/json" },
  });
  const result = await response.json();
  if (!response.ok) throw Error(result.error ?? "动效资源库请求失败");
  return result;
}
export function useMotionResources() {
  const [data, setData] = React.useState({
    resources: builtinMotionResources(),
    revision: null,
  });
  const [error, setError] = React.useState("");
  const reload = React.useCallback(async () => {
    try {
      const result = await motionLibraryApi();
      setData(result);
      setError("");
      return result;
    } catch (error) {
      setError(error.message);
      return null;
    }
  }, []);
  React.useEffect(() => {
    void reload();
  }, [reload]);
  return { ...data, error, reload };
}
export function MotionResourceSelect({ draft, onSelect }) {
  const { resources, error } = useMotionResources();
  const id = draft.motionResourceId ?? `builtin.motion.${draft.effect.type}`;
  return (
    <>
      <label>
        动效资源
        <select
          aria-label="动效类型"
          value={id}
          onChange={(event) => {
            const resource = resources.find((r) => r.id === event.target.value);
            if (resource) onSelect(resource);
          }}
        >
          {!resources.some((r) => r.id === id) && (
            <option value={id}>当前动效（资源已移除，保留原参数）</option>
          )}
          {["builtin", "custom"].map((group) => (
            <optgroup
              key={group}
              label={group === "builtin" ? "内置动效" : "自定义动效"}
            >
              {resources
                .filter((r) => r.builtin === (group === "builtin"))
                .map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
      </label>
      <small>
        在左侧“动效资源库”维护。选择时复制参数，已保存规则保留自己的配置。
      </small>
      {error && <small role="status">{error}；暂用内置动效。</small>}
    </>
  );
}
