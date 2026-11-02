export function toggleModelPartSelection(current, path, additive = false) {
  if (current.includes(path)) return current.filter(item => item !== path);
  return additive ? [...current, path] : [path];
}
