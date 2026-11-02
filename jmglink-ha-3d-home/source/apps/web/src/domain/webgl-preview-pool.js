// Two live previews preserve side-by-side motion editing; only one background thumbnail.
export function createWebglPreviewPool(limit = 2) {
  let active = 0;
  let backgroundActive = 0;
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
      const index = waiting.findIndex(ticket => !ticket.background || backgroundActive < 1);
      if(index < 0) break;
      const [ticket] = waiting.splice(index, 1);
      if (ticket.cancelled) continue;
      ticket.granted = true;
      active += 1;
      if(ticket.background)backgroundActive++;
      try {
        if (ticket.onGranted() === false) {
          ticket.cancelled = true;
          active -= 1;
          if(ticket.background)backgroundActive--;
        }
      } catch (error) {
        ticket.cancelled = true;
        active -= 1;
        if(ticket.background)backgroundActive--;
        ticket.onError?.(error);
      }
    }
  }

  return {
    request(onGranted, onError, {background = false} = {}) {
      const ticket = { onGranted, onError, background, granted: false, cancelled: false };
      waiting.push(ticket);
      waiting.sort((a,b)=>Number(a.background)-Number(b.background));
      if (!scheduled) grantNext();
      return () => {
        if (ticket.cancelled) return;
        ticket.cancelled = true;
        if (ticket.granted) {active -= 1;if(ticket.background)backgroundActive--;}
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
