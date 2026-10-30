import { a as React } from "../../apps/web/src/vendor/react.js";
import { c as ReactDOM } from "../../apps/web/src/vendor/three.js";
import ApplicationBoundary from "../../apps/web/src/components/application-boundary.jsx";
import { installBrowserRecovery } from "../../apps/web/src/domain/browser-recovery.js";
installBrowserRecovery();
const missing = "/assets/removed-center-chunk.js";
const OldCenter = React.lazy(() => import(/* @vite-ignore */ missing));
function Crash() {
  throw new TypeError("Cannot read properties of null (reading 'geometry')");
}
function App() {
  const [mode, setMode] = React.useState("");
  if (mode === "root") return <Crash />;
  return (
    <main style={{ padding: 40, fontFamily: "system-ui" }}>
      <h1>主页保持可用</h1>
      <p>隔离故障注入，不连接 Home Assistant。</p>
      <button onClick={() => setMode("center")}>模拟开发中心渲染异常</button>
      <button onClick={() => setMode("chunk")}>模拟旧版模块失效</button>
      <button onClick={() => setMode("root")}>模拟主页渲染异常</button>
      {mode && (
        <ApplicationBoundary label="设备开发中心" onClose={() => setMode("")}>
          <React.Suspense fallback={<p>正在加载开发中心…</p>}>
            {mode === "chunk" ? <OldCenter /> : <Crash />}
          </React.Suspense>
        </ApplicationBoundary>
      )}
    </main>
  );
}
ReactDOM.createRoot(document.getElementById("root")).render(
  <ApplicationBoundary>
    <App />
  </ApplicationBoundary>,
);
