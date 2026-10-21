import DevicePanel from "../../components/device-panel.jsx";
import ProjectStepLayout from "./project-step-layout.jsx";
import { a as React } from "../../vendor/react.js";
import ModelPreview from "./model-preview.jsx";
import { panelControlVariant } from "./panel-designer-model.js";
import { deviceValueLabel } from "../../../../../packages/schema/src/device-value-labels.js";

const displayValue = (state, value = state?.state) =>
  deviceValueLabel(
    value,
    state?.options?.find((item) => String(item.value) === String(value))?.label,
    state,
  );

const endpoint = (id, tail) =>
  `./api/device-platform/projects/${encodeURIComponent(id)}/${tail}`;
async function request(url, options) {
  const response = await fetch(url, {
    ...options,
    headers: options?.body ? { "Content-Type": "application/json" } : undefined,
  });
  const value = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(value.error || `请求失败 ${response.status}`);
  return value;
}

export function DevicePanelPreview({project,panel,states,onAction,interactive=false,simulation=false}) {
  const normalized = Object.fromEntries((project?.capabilities || []).map(cap => { const state=states?.[cap.capabilityId]; return [cap.capabilityId,{...cap,...state,unit:state?.unit || cap.unit,bound:!!state?.entityId,available:simulation && state?.entityId ? true : state?.available}]; }));
  return <div className="hp-preview-surface"><DevicePanel panel={panel} states={normalized} interactive={interactive} onAction={onAction}/></div>;
}
export default function ProjectTesting({
  projectId,
  platform,
  notify,
  onPrevious,
  onNext,
}) {
  const project = platform.deviceTemplates.find(
    (item) => item.id === projectId,
  );
  const panel = platform.controlPanels.find(
    (item) => item.id === project?.controlPanelTemplateId,
  );
  const model = platform.modelTemplates.find(
    (item) => item.id === project?.modelTemplateId,
  );
  const [result, setResult] = React.useState(null);
  const [mode, setMode] = React.useState("simulation");
  const [confirmed, setConfirmed] = React.useState(false);
  const [states, setStates] = React.useState({});
  const [events, setEvents] = React.useState([]);
  const [busy, setBusy] = React.useState(false);
  const [simulationValue, setSimulationValue] = React.useState("");
  const [selected, setSelected] = React.useState("");
  const lastStates = React.useRef({});
  const addEvent = (name, action, outcome, error = "") =>
    setEvents((items) =>
      [
        {
          at: new Date().toLocaleTimeString("zh-CN"),
          name,
          action,
          outcome,
          error,
        },
        ...items,
      ].slice(0, 80),
    );
  const refresh = React.useCallback(async () => {
    try {
      const data = await request(endpoint(projectId, "diagnostics"));
      if (mode === "real")
        for (const item of data.capabilities) {
          const before = lastStates.current[item.id];
          if (before !== undefined && before !== item.state)
            addEvent(
              item.name,
              `${String(before)} → ${String(item.state)}`,
              "HA 状态更新",
            );
        }
      lastStates.current = Object.fromEntries(
        data.capabilities.map((item) => [item.id, item.state]),
      );
      setResult(data);
      setStates((previous) =>
        Object.fromEntries(
          data.capabilities.map((item) => [
            item.id,
            mode === "simulation" && previous[item.id]
              ? previous[item.id]
              : item,
          ]),
        ),
      );
      if (!data.haConnected) setMode("simulation");
      if (!selected && data.capabilities[0])
        setSelected(data.capabilities[0].id);
    } catch (error) {
      notify(error.message, "error");
    }
  }, [projectId, mode, selected]);
  React.useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 5000);
    return () => window.clearInterval(timer);
  }, [refresh]);
  const chooseReal = () => {
    if (!result?.haConnected) return;
    if (
      !confirmed &&
      !window.confirm(
        "真实联调会向当前绑定的 Home Assistant 实体发送控制指令。确认在本页面启用真实模式？",
      )
    )
      return;
    setConfirmed(true);
    setMode("real");
    setStates(
      Object.fromEntries(
        (result.capabilities ?? []).map((item) => [item.id, item]),
      ),
    );
  };
  const run = async (id, value) => {
    const capability = states[id];
    if (!capability) return;
    const previous = capability;
    if (mode === "simulation") {
      setStates((items) => ({
        ...items,
        [id]: { ...items[id], state: value },
      }));
      addEvent(capability.name, String(value), "模拟成功");
      return;
    }
    if (!confirmed || !result?.haConnected)
      return notify("HA 未连接或真实模式未确认", "error");
    if (
      !window.confirm(
        `确认向“${capability.name}”发送真实控制：${String(value)}？`,
      )
    )
      return;
    setBusy(true);
    setStates((items) => ({ ...items, [id]: { ...items[id], state: value } }));
    try {
      const response = await request(endpoint(projectId, "test-action"), {
        method: "POST",
        body: JSON.stringify({ capabilityId: id, value, confirmReal: true }),
      });
      setStates((items) => ({
        ...items,
        [id]: { ...items[id], state: response.entity.state },
      }));
      addEvent(capability.name, String(value), "真实成功");
    } catch (error) {
      setStates((items) => ({ ...items, [id]: previous }));
      addEvent(capability.name, String(value), "失败，已恢复", error.message);
      notify(error.message, "error");
    } finally {
      setBusy(false);
    }
  };
  const finish = async () => {
    setBusy(true);
    try {
      await request(endpoint(projectId, "test-complete"), {
        method: "POST",
        body: JSON.stringify({ mode }),
      });
      notify("联调结果已记录，可进入发布检查。", "success");
      onNext();
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setBusy(false);
    }
  };
  const current = states[selected];
  const runtime = project?.runtimeDisplay;
  const runtimeStatusId = runtime?.statusCapabilityId;
  const runtimeRemainingId = runtime?.remainingCapabilityId;
  const simulateStatus = (value) =>
    runtimeStatusId && run(runtimeStatusId, value);
  return (
    <ProjectStepLayout className="ddc-lifecycle">
      <div className="ddc-lifecycle-intro">
        <h2>联调测试</h2>
        <p>
          模拟模式仅改变本页预览；真实模式需确认并仅能操作本项目已绑定的可写能力。
        </p>
      </div>
      <div className="ddc-lifecycle-grid">
        <section className="ddc-lifecycle-card">
          <h3>测试模式与能力</h3>
          <div className="ddc-lifecycle-modes">
            <button
              className={mode === "simulation" ? "active" : ""}
              onClick={() => setMode("simulation")}
            >
              模拟模式
            </button>
            <button
              className={mode === "real" ? "active" : ""}
              disabled={!result?.haConnected}
              onClick={chooseReal}
            >
              真实模式
            </button>
          </div>
          <p className="ddc-lifecycle-note">
            {mode === "simulation"
              ? "模拟中：不会调用 HA 服务"
              : "真实控制已启用：每条指令仍需确认"}
          </p>
          {(result?.capabilities ?? []).map((item) => (
            <button
              className={`ddc-lifecycle-cap ${selected === item.id ? "active" : ""}`}
              key={item.id}
              onClick={() => setSelected(item.id)}
            >
              <span>{item.name}</span>
              <small>
                {item.entityId || "未映射"} · {displayValue(states[item.id])}
                {item.entityId
                  ? ` · ${item.availabilityLabel || (item.available ? "正常" : "状态待确认")}`
                  : " · 未绑定"}
              </small>
            </button>
          ))}
        </section>
        <section className="ddc-lifecycle-card">
          <h3>实时预览</h3>
          <div className="ddc-lifecycle-model">
            {model ? <ModelPreview model={model} compact /> : "尚无模型"}
          </div>
          <DevicePanelPreview
            project={project}
            panel={panel}
            states={states}
            onAction={run}
            interactive={
              !busy && (mode === "simulation" || result?.haConnected)
            }
            simulation={mode === "simulation"}
          />
        </section>
        <section className="ddc-lifecycle-card">
          <h3>操作测试</h3>
          {mode === "simulation" && runtimeStatusId && (
            <div className="ddc-lifecycle-simulation">
              <label>
                模拟运行状态
                <select
                  value={String(states[runtimeStatusId]?.state ?? "")}
                  onChange={(event) => void simulateStatus(event.target.value)}
                >
                  <option value="">选择状态</option>
                  {[
                    ...new Set([
                      ...(runtime.runningStates ?? []),
                      ...(runtime.endingStates ?? []),
                    ]),
                  ].map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>
              {runtimeRemainingId && (
                <label>
                  模拟剩余时间（分钟）
                  <input
                    type="number"
                    min="0"
                    value={states[runtimeRemainingId]?.state ?? 0}
                    onChange={(event) =>
                      void run(runtimeRemainingId, Number(event.target.value))
                    }
                  />
                </label>
              )}
              <div className="ddc-lifecycle-sim-actions">
                <button
                  onClick={() =>
                    void simulateStatus(runtime.runningStates?.[0] ?? "running")
                  }
                >
                  模拟开始
                </button>
                <button
                  onClick={() =>
                    void simulateStatus(runtime.endingStates?.[0] ?? "paused")
                  }
                >
                  模拟暂停
                </button>
                <button
                  onClick={() =>
                    void simulateStatus(runtime.endingStates?.at(-1) ?? "off")
                  }
                >
                  模拟完成
                </button>
              </div>
            </div>
          )}
          <label>
            选择能力
            <select
              value={selected}
              onChange={(event) => setSelected(event.target.value)}
            >
              {result?.capabilities?.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            测试值
            <input
              value={simulationValue}
              onChange={(event) => setSimulationValue(event.target.value)}
              placeholder="布尔值、数值或枚举原值"
            />
          </label>
          <button
            disabled={
              busy ||
              !current ||
              (mode === "real" &&
                (!current.available ||
                  !["write", "read-write", "action"].includes(current.access)))
            }
            onClick={() =>
              run(
                selected,
                current?.dataType === "boolean"
                  ? simulationValue === "true" || simulationValue === "on"
                  : current?.dataType === "number"
                    ? Number(simulationValue)
                    : simulationValue,
              )
            }
          >
            执行测试
          </button>
          <h4>
            事件日志 <button onClick={() => setEvents([])}>清空</button>
          </h4>
          <div className="ddc-lifecycle-events">
            {events.length ? (
              events.map((item, index) => (
                <div key={index}>
                  {item.at}　{item.name}　{item.action}　{item.outcome}
                  {item.error && `：${item.error}`}
                </div>
              ))
            ) : (
              <p>本页暂无操作记录</p>
            )}
          </div>
        </section>
      </div>
      <section className="ddc-lifecycle-card">
        <h3>
          自动诊断 <button onClick={() => void refresh()}>重新检查</button>
        </h3>
        <div className="ddc-lifecycle-checks">
          {result?.checks?.length ? (
            result.checks.map((item, index) => (
              <div className={item.severity} key={index}>
                {item.severity === "error" ? "✕" : "!"}　
                {item.page || item.capabilityId}：{item.reason}
              </div>
            ))
          ) : (
            <div className="ok">✓ 目前未发现配置问题</div>
          )}
        </div>
      </section>
      <div className="ddc-lifecycle-footer">
        <button onClick={onPrevious}>上一步</button>
        <button disabled={busy || result?.publishBlocked} onClick={finish}>
          完成联调并进入发布
        </button>
      </div>
    </ProjectStepLayout>
  );
}
