import { a as React } from "../vendor/react.js";
import "../styles/camera-monitor.css";
export default function CameraMonitor({ entity, onClose, children }) {
  const dialog = React.useRef(null);
  const close = React.useRef(null);
  React.useEffect(() => {
    const node = dialog.current;
    const previous = document.activeElement;
    node.showModal();
    close.current?.focus();
    return () => {
      node.close();
      previous?.focus?.();
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className="camera-monitor"
      aria-labelledby="camera-monitor-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section>
        <header>
          <div>
            <small>实时监控</small>
            <h2 id="camera-monitor-title">
              {entity.deviceDisplayName ?? entity.name ?? entity.entityId}
            </h2>
          </div>
          <button
            ref={close}
            type="button"
            aria-label="关闭监控画面"
            onClick={onClose}
          >
            ×
          </button>
        </header>
        {entity.state === "unavailable" && (
          <p role="status">摄像头当前不可用，请检查连接后重试。</p>
        )}
        {children}
      </section>
    </dialog>
  );
}
