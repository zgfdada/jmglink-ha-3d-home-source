export function stopVoiceReply(host = globalThis) {
  try { host.speechSynthesis?.cancel(); } catch {}
}
export function playVoiceReply(text, settings, host = globalThis) {
  if (!settings?.enabled || !text?.trim() || !host.speechSynthesis || !host.SpeechSynthesisUtterance) return false;
  try {
    const speech = new host.SpeechSynthesisUtterance(text.replace(/[*#`]/g, ""));
    speech.lang = "zh-CN";
    speech.volume = Math.min(1, Math.max(0, settings.volume ?? 0.6));
    const voices = host.speechSynthesis.getVoices();
    const voice = voices.find((v) => v.lang.toLowerCase().replace("_", "-") === "zh-cn") || voices.find((v) => /^zh/i.test(v.lang));
    if (voice) speech.voice = voice;
    host.speechSynthesis.cancel();
    host.speechSynthesis.speak(speech);
    return true;
  } catch {
    // Audio output failure must never turn a successful device action into
    // a failed command or cause the user to submit the action again.
    return false;
  }
}
