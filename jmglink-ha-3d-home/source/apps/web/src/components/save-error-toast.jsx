import { a as React } from "../vendor/react.js";
import "../styles/save-error-toast.css";

// Saving and notification timing are independent. Retries must not restart a toast.
export default function SaveErrorToast({ error }) {
  const [notice, setNotice] = React.useState(null);
  const last = React.useRef({ message: "", time: -Infinity });
  React.useEffect(() => {
    if (!error) return;
    const now = Date.now();
    if (now - last.current.time < 10000) return;
    last.current = { message: error, time: now };
    setNotice({ message: error, key: now });
  }, [error]);
  React.useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 4500);
    return () => window.clearTimeout(timer);
  }, [notice]);
  if (!notice) return null;
  return <div key={notice.key} className="save-error-toast" role="status" aria-live="polite">
    <strong>保存未成功</strong>
    <span>{notice.message}</span>
    <small>正在自动重试，当前编辑仍保留。</small>
  </div>;
}
