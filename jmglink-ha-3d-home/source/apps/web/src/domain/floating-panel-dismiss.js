// Observe outside presses without consuming scene input or replaying events.
export function bindFloatingPanelDismiss(document, getPanel, close) {
  const outside = event => {
    const panel = getPanel();
    if (!panel || panel.contains(event.target)) return;
    // Portalled selectors and camera dialogs remain interactive.
    if (event.target?.closest?.('dialog, [role="listbox"]')) return;
    close();
  };
  document.addEventListener("pointerdown", outside, true);
  return () => document.removeEventListener("pointerdown", outside, true);
}
