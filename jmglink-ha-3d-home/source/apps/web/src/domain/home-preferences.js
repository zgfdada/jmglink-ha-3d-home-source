export function readHomePreference(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(`ha3d.home.${key}`)) ?? fallback;
  } catch {
    return fallback;
  }
}

export function writeHomePreference(key, value) {
  try {
    localStorage.setItem(`ha3d.home.${key}`, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export const sidebarEdges = { left: "左侧", right: "右侧", top: "顶部", bottom: "底部" };

export function nearestSidebarEdge(x, y, width, height) {
  const distances = { left: x, right: width - x, top: y, bottom: height - y };
  return Object.keys(distances).reduce((edge, next) => distances[next] < distances[edge] ? next : edge);
}

export const defaultAmbientLight = { automatic: true, manual: 1 };
