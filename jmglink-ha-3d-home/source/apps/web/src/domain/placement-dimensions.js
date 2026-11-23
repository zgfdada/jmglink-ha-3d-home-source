export function placedModelDimensions(model, scale = [1, 1, 1]) {
  const unit = model.scale || 1;
  return {
    width: model.dimensions.width * unit * Math.abs(scale[0]),
    height: model.dimensions.height * unit * Math.abs(scale[1]),
    depth: model.dimensions.depth * unit * Math.abs(scale[2]),
  };
}

export function placementScale(model, size, previous = [1, 1, 1]) {
  const base = placedModelDimensions(model);
  return ["width","height","depth"].map((axis,i) =>
    (previous[i] < 0 ? -1 : 1) * size[axis] / base[axis]);
}

// Use the corner furthest from the placement origin, including offset models.
export function footprintCorner(footprint) {
  return [footprint.x + (footprint.x < 0 ? -1 : 1) * footprint.width / 2,
    footprint.y + (footprint.y < 0 ? -1 : 1) * footprint.depth / 2];
}

export function dragDeviceSize(device, footprint, start, point, step) {
  const [x,z] = footprintCorner(footprint);
  const angle = device.rotation?.[1] || 0;
  const dx = point[0]-start[0], dz = point[1]-start[1];
  const size = placedModelDimensions(footprint.model, device.scale);
  function resize(length, delta, corner) {
    const next = length * (1 + delta / corner);
    return Math.min(20,Math.max(0.05, step ? Math.round(next / step)*step : next));
  }
  size.width = resize(size.width,dx*Math.cos(angle)-dz*Math.sin(angle),x);
  size.depth = resize(size.depth,dx*Math.sin(angle)+dz*Math.cos(angle),z);
  return placementScale(footprint.model,size,device.scale);
}
