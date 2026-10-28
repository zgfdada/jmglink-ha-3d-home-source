export const CAMERA_MODELS = [
  {
    id: "camera.bullet",
    shape: "camera-bullet",
    name: "枪型摄像头",
    placement: "ceiling",
    defaultHeight: 2.2,
    dimensions: { width: 0.15, height: 0.2, depth: 0.32 },
  },
  {
    id: "camera.dome",
    shape: "camera-dome",
    name: "球型摄像头（单摄）",
    placement: "ceiling",
    defaultHeight: 2.4,
    dimensions: { width: 0.22, height: 0.24, depth: 0.22 },
  },
  {
    id: "camera.dual",
    shape: "camera-dual",
    name: "球型摄像头（双摄）",
    placement: "ceiling",
    defaultHeight: 2.2,
    dimensions: { width: 0.24, height: 0.34, depth: 0.24 },
  },
  {
    id: "camera.desktop",
    shape: "camera-desktop",
    name: "桌面摄像头",
    placement: "surface",
    defaultHeight: 0.9,
    dimensions: { width: 0.14, height: 0.21, depth: 0.14 },
  },
];
export function cameraModelDefinition(value) {
  return CAMERA_MODELS.find((m) => m.id === value || m.shape === value);
}
