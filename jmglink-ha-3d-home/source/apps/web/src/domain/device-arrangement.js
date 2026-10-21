const DEFAULT_LINE_TOLERANCE = 0.06;
const MINIMUM_DISTANCE = 1e-4;

const pointOf = (device) => [device.position[0], device.position[2]];
const distance = (first, second) =>
  Math.hypot(first[0] - second[0], first[1] - second[1]);

function farthestPair(devices) {
  let pair;
  for (let first = 0; first < devices.length; first += 1) {
    for (let second = first + 1; second < devices.length; second += 1) {
      const pairDistance = distance(
        pointOf(devices[first]),
        pointOf(devices[second]),
      );
      if (!pair || pairDistance > pair.distance) {
        pair = {
          first: devices[first],
          second: devices[second],
          distance: pairDistance,
        };
      }
    }
  }
  return pair;
}

function projectPoint(point, start, end) {
  const deltaX = end[0] - start[0];
  const deltaY = end[1] - start[1];
  const lengthSquared = deltaX ** 2 + deltaY ** 2;
  if (lengthSquared < MINIMUM_DISTANCE ** 2)
    return {
      point: [...start],
      parameter: 0,
      distance: distance(point, start),
    };
  const parameter =
    ((point[0] - start[0]) * deltaX + (point[1] - start[1]) * deltaY) /
    lengthSquared;
  const projected = [
    start[0] + deltaX * parameter,
    start[1] + deltaY * parameter,
  ];
  return { point: projected, parameter, distance: distance(point, projected) };
}

function moveDevice(device, point) {
  const current = pointOf(device);
  const delta = [point[0] - current[0], point[1] - current[1]];
  const moved = {
    ...device,
    position: [
      Number(point[0].toFixed(4)),
      device.position[1],
      Number(point[1].toFixed(4)),
    ],
  };
  if (!(device.lightStrip && Array.isArray(device.lightStrip.points))) {
    return moved;
  }
  return {
    ...moved,
    lightStrip: {
      ...device.lightStrip,
      points: device.lightStrip.points.map((stripPoint) => [
        Number((stripPoint[0] + delta[0]).toFixed(4)),
        Number((stripPoint[1] + delta[1]).toFixed(4)),
      ]),
    },
  };
}

export function inspectDeviceLine(
  devices,
  selectedDeviceIds,
  { tolerance = DEFAULT_LINE_TOLERANCE } = {},
) {
  const selectedIds = new Set(selectedDeviceIds);
  const selected = devices.filter((device) => selectedIds.has(device.id));
  if (selected.length < 2 || selected.length !== selectedIds.size) {
    return { ok: false, reason: "not-enough-devices" };
  }
  const anchors = farthestPair(selected);
  if (!anchors || anchors.distance < MINIMUM_DISTANCE) {
    return { ok: false, reason: "overlapping-devices" };
  }
  const start = pointOf(anchors.first);
  const end = pointOf(anchors.second);
  const ordered = selected
    .map((device) => ({
      device,
      ...projectPoint(pointOf(device), start, end),
    }))
    .sort((first, second) => first.parameter - second.parameter);
  const maximumDeviation = Math.max(...ordered.map((item) => item.distance));
  return {
    ok: true,
    aligned: maximumDeviation <= tolerance,
    maximumDeviation,
    start,
    end,
    orderedDeviceIds: ordered.map((item) => item.device.id),
  };
}

export function alignDevicesOnLine(devices, selectedDeviceIds, options) {
  const inspection = inspectDeviceLine(devices, selectedDeviceIds, options);
  if (!inspection.ok) return { ...inspection, devices };
  const selectedIds = new Set(selectedDeviceIds);
  return {
    ok: true,
    devices: devices.map((device) => {
      if (!selectedIds.has(device.id)) return device;
      return moveDevice(
        device,
        projectPoint(pointOf(device), inspection.start, inspection.end).point,
      );
    }),
    inspection,
  };
}

export function distributeDevicesEvenly(devices, selectedDeviceIds, options) {
  const inspection = inspectDeviceLine(devices, selectedDeviceIds, options);
  if (!inspection.ok) return { ...inspection, devices };
  if (!inspection.aligned) {
    return { ok: false, reason: "not-aligned", devices, inspection };
  }
  if (inspection.orderedDeviceIds.length < 3) {
    return { ok: false, reason: "not-enough-devices", devices, inspection };
  }

  const orderedIndex = new Map(
    inspection.orderedDeviceIds.map((deviceId, index) => [deviceId, index]),
  );
  const lastIndex = inspection.orderedDeviceIds.length - 1;
  return {
    ok: true,
    devices: devices.map((device) => {
      const index = orderedIndex.get(device.id);
      if (index === undefined) return device;
      const ratio = index / lastIndex;
      return moveDevice(device, [
        inspection.start[0] + (inspection.end[0] - inspection.start[0]) * ratio,
        inspection.start[1] + (inspection.end[1] - inspection.start[1]) * ratio,
      ]);
    }),
    inspection,
  };
}
