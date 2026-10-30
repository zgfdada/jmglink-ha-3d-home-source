// Keep thumbnail renderers below the browser's usual per-page WebGL context limit.
export function createWebglPreviewPool(limit = 6) {
  let active = 0;
  const waiting = [];
  let scheduled = false;
  const scheduleNext = () => {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => {
      scheduled = false;
      grantNext();
    });
  };

  function grantNext() {
    while (active < limit && waiting.length) {
      const ticket = waiting.shift();
      if (ticket.cancelled) continue;
      ticket.granted = true;
      active += 1;
      try {
        if (ticket.onGranted() === false) {
          ticket.cancelled = true;
          active -= 1;
        }
      } catch (error) {
        ticket.cancelled = true;
        active -= 1;
        ticket.onError?.(error);
      }
    }
  }

  return {
    request(onGranted, onError) {
      const ticket = { onGranted, onError, granted: false, cancelled: false };
      waiting.push(ticket);
      if (!scheduled) grantNext();
      return () => {
        if (ticket.cancelled) return;
        ticket.cancelled = true;
        if (ticket.granted) active -= 1;
        else {
          const index = waiting.indexOf(ticket);
          if (index !== -1) waiting.splice(index, 1);
        }
        scheduleNext();
      };
    },
    status() {
      return { active, waiting: waiting.length };
    },
  };
}

export const webglPreviewPool = createWebglPreviewPool();

export function modelPreviewSignature(model) {
  if (!model) return "";
  return JSON.stringify({
    id: model.id,
    sourceType: model.source?.type,
    sourceShape: model.source?.shape,
    sourceUrl: model.source?.url,
    dimensions: model.dimensions,
    scale: model.scale,
    anchor: model.anchor,
    elevation: model.elevation,
    color: model.color,
    colorOverride: model.colorOverride,
    roughness: model.roughness,
    roughnessOverride: model.roughnessOverride,
    metalness: model.metalness,
    metalnessOverride: model.metalnessOverride,
    projectAppearance: model.projectAppearance,
    materialColors: model.materialColors,
  });
}
