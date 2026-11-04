export function verticalFramingOffset(current, deltaY, height) {
  if (!Number.isFinite(deltaY) || !Number.isFinite(height) || height <= 0) return current;
  return Math.max(-0.45, Math.min(0.45, current + deltaY / height));
}

// Move the lens only. The OrbitControls target and camera pose stay untouched.
export function bindVerticalProjectionDrag(element, onDelta, onStart = () => {}, owner = window) {
  let drag = null;
  const release = () => {
    if (drag && element.hasPointerCapture?.(drag.id)) element.releasePointerCapture(drag.id);
    drag = null;
  };
  const down = event => {
    if (event.button !== 2) return;
    event.preventDefault(); event.stopImmediatePropagation();
    drag = {id: event.pointerId, y: event.clientY};
    element.setPointerCapture?.(event.pointerId);
    onStart();
  };
  const move = event => {
    if (!drag || event.pointerId !== drag.id) return;
    if (!(event.buttons & 2)) { release(); return; }
    event.preventDefault();
    const delta = event.clientY - drag.y;
    drag.y = event.clientY;
    onDelta(delta);
  };
  const up = event => { if (drag && event.pointerId === drag.id) release(); };
  const context = event => event.preventDefault();
  element.addEventListener('pointerdown', down, {capture:true});
  element.addEventListener('contextmenu', context);
  owner.addEventListener('pointermove', move, {passive:false});
  owner.addEventListener('pointerup', up);
  owner.addEventListener('pointercancel', up);
  owner.addEventListener('blur', release);
  return () => {
    release();
    element.removeEventListener('pointerdown', down, {capture:true});
    element.removeEventListener('contextmenu', context);
    owner.removeEventListener('pointermove', move);
    owner.removeEventListener('pointerup', up);
    owner.removeEventListener('pointercancel', up);
    owner.removeEventListener('blur', release);
  };
}
