import { a as React } from "../vendor/react.js";
import {
  isChunkFailure,
  recoverChunkFailure,
  reportClientError,
} from "../domain/browser-recovery.js";
import "../styles/application-recovery.css";

export default class ApplicationBoundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error) {
    reportClientError(error, this.props.onClose ? "center" : "render");
    if (isChunkFailure(error)) recoverChunkFailure(error);
  }
  render() {
    if (!this.state.error) return this.props.children;
    const scoped = Boolean(this.props.onClose);
    return (
      <div
        className={
          scoped ? "application-recovery-overlay" : "application-recovery-page"
        }
        role="alert"
      >
        <section className="application-recovery-card">
          <span aria-hidden="true">↻</span>
          <h1>{this.props.label ?? "界面"}加载遇到问题</h1>
          <p>
            {isChunkFailure(this.state.error)
              ? "界面资源可能已更新，或暂时无法加载。请重新加载后继续。"
              : "此界面发生异常，已阻止错误影响其他界面。"}
          </p>
          <small>已保存的户型、设备和动效配置会保留。</small>
          <div>
            {scoped && (
              <button onClick={this.props.onClose}>关闭并返回主页</button>
            )}
            <button
              className="primary"
              onClick={() => window.location.reload()}
            >
              重新加载页面
            </button>
          </div>
        </section>
      </div>
    );
  }
}
