import { a as React } from "../vendor/react.js";

export function VoiceClarification({ prompt }) {
  const [answer, setAnswer] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState("");
  const lock = React.useRef(false);
  const submit = async (text) => {
    if (lock.current || !text.trim()) return;
    lock.current = true;
    setBusy(true); setError("");
    try {
      await prompt.answer(text.trim());
      setSent(true);
    } catch (error) {
      setError(error.message + "；可等待状态更新，或前往 Telegram 确认。");
      lock.current = false;
    } finally { setBusy(false); }
  };
  return <section className="voice-clarification" aria-label="助手需要你选择" aria-live="polite">
    <strong>助手需要你回答</strong>
    <p>{prompt.question}</p>
    <fieldset disabled={busy || sent}>
      <div className="voice-choices">{prompt.choices.map((choice, index) =>
        <button key={index} type="button" onClick={() => submit(choice)}>{choice}</button>
      )}</div>
      <form onSubmit={(event) => { event.preventDefault(); submit(answer); }}>
        <label>其他回答<input value={answer} maxLength={2000} placeholder="也可以输入补充说明" onChange={(event) => setAnswer(event.target.value)} /></label>
        <button disabled={!answer.trim()} type="submit">发送回答</button>
      </form>
    </fieldset>
    {(busy || sent) && <p role="status">{sent ? "回答已提交，助手继续处理中…" : "正在提交回答…"}</p>}
    {error && <p role="alert">{error}</p>}
    <small>与 Telegram 共用同一次问答；在任一端回答即可。</small>
  </section>;
}
