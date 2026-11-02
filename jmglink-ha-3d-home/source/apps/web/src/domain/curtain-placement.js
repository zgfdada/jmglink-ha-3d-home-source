import { normalizeCurtainTrack } from "../../../../packages/schema/src/curtain-track.js";

// Invalid in-progress paths must never replace the last usable saved track.
export function applyCurtainTrackToFloor(floor, placementId, draft) {
  const track = normalizeCurtainTrack(draft);
  const current = floor.devices.find(device => device.id === placementId);
  if (!track || !current) return floor;
  track.drop = Math.min(track.drop, floor.height - 0.2);
  track.height = Math.min(track.height, floor.height - track.drop);
  if (JSON.stringify(current.curtainTrack) === JSON.stringify(track)) return floor;
  return { ...floor, devices: floor.devices.map(device => device.id !== placementId ? device : {
    ...device,
    curtainTrack: track,
    scale: undefined,
    verticalReference: undefined,
    position: [device.position[0], floor.height - track.drop, device.position[2]],
  }) };
}
