import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  resolveWasherRuntime,
  washerRuntimeLabel,
} from "../domain/washer-runtime.js";
import modelBase64 from "../../public/concept/washer.glb";

// Actual local project model; synthetic entities only. Never imports credentials or HA connections.
const q = (s) => document.querySelector(s),
  host = q("#washer-model-host");
const phases = {
  idle: ["待机", null],
  washing: ["洗涤中", 45],
  rinsing: ["漂洗中", 8],
  spinning: ["脱水中", 3],
  done: ["已完成", 0],
};
let phase = "idle",
  program = "标准",
  power = true,
  paused = false,
  runtime,
  rotor,
  indicator,
  renderer,
  scene,
  camera,
  controls,
  frame = 0,
  visible = !q("#device-custom").hidden;
const now = () => Date.now();
function render() {
  const minutes =
    phase === "washing" && program === "速洗" ? 15 : phases[phase][1];
  const state = !power ? "off" : paused ? "paused" : phase;
  runtime = resolveWasherRuntime(
    { type: "top-load-washer" },
    {
      deviceDisplayName: "波轮洗衣机",
      deviceEntities: [
        {
          entityId: "sensor.demo_running_status",
          state,
          lastUpdated: new Date(now()).toISOString(),
        },
        {
          entityId: "sensor.demo_remaining_time",
          state: minutes === null ? "unknown" : String(minutes),
          attributes: { unit_of_measurement: "min" },
        },
      ],
    },
  );
  const label = !power ? "电源关闭" : paused ? "已暂停" : phases[phase][0];
  q("#washer-state").textContent = label;
  q("#washer-program-label").textContent = program;
  q("#washer-remaining").textContent =
    power && minutes !== null ? minutes + " 分钟" : "—";
  q("#washer-model-label").textContent =
    label + (runtime.running ? " · 波轮运行中" : "");
  q("#washer-runtime-detail").textContent = !power
    ? "电源已关闭；此处为本地模拟。"
    : paused
      ? "已暂停 · 波轮停止，剩余时间保留。"
      : washerRuntimeLabel(runtime) ||
        (phase === "done"
          ? "本次程序已完成。"
          : "选择程序后，启动模拟洗衣流程。");
  q("#washer-toggle").textContent = paused
    ? "继续"
    : runtime.running
      ? "暂停"
      : "启动";
  q("#washer-toggle").disabled = !power;
  q("#washer-program").disabled = !power;
  q("#washer-power").textContent = "电源 · " + (power ? "已开启" : "已关闭");
  q("#washer-power").setAttribute("aria-pressed", String(power));
  document
    .querySelectorAll("[data-washer-phase]")
    .forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.washerPhase === phase)),
    );
  if (indicator) indicator.emissiveIntensity = runtime.running ? 0.7 : 0;
  host.dataset.phase = state;
  host.dataset.running = String(runtime.animationRunning);
}
q("#washer-program").addEventListener("change", (e) => {
  program = e.target.value;
  render();
});
q("#washer-toggle").addEventListener("click", () => {
  if (!power) return;
  if (paused) paused = false;
  else if (runtime.running) paused = true;
  else {
    phase = "washing";
    paused = false;
  }
  render();
});
q("#washer-power").addEventListener("click", () => {
  power = !power;
  paused = false;
  if (!power) phase = "idle";
  render();
});
document.querySelectorAll("[data-washer-phase]").forEach((b) =>
  b.addEventListener("click", () => {
    power = true;
    paused = false;
    phase = b.dataset.washerPhase;
    render();
  }),
);
render();
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.prepend(renderer.domElement);
  renderer.domElement.setAttribute(
    "aria-label",
    "项目实际顶开式波轮洗衣机三维模型",
  );
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(35, 1, 0.01, 100);
  camera.position.set(1.35, 1.55, 1.8);
  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.46, 0);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = 1.1;
  controls.maxDistance = 3.6;
  controls.maxPolarAngle = Math.PI / 2;
  controls.update();
  scene.add(new THREE.HemisphereLight(0xecf4ff, 0x56616d, 3));
  const key = new THREE.DirectionalLight(0xffffff, 4);
  key.position.set(2, 4, 3);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0x9bc9ff, 2);
  fill.position.set(-2, 2, -1);
  scene.add(fill);
  const bytes = Uint8Array.from(atob(modelBase64), (c) => c.charCodeAt(0));
  new GLTFLoader().parse(
    bytes.buffer,
    "",
    (gltf) => {
      const model = gltf.scene;
      scene.add(model);
      model.updateMatrixWorld(true);
      // Same pivot/node handling as the project's UploadedDeviceModel renderer.
      const disc = model.getObjectByName("Pulsator_Disc");
      if (disc) {
        const center = new THREE.Box3()
          .setFromObject(disc)
          .getCenter(new THREE.Vector3());
        rotor = new THREE.Group();
        rotor.position.copy(model.worldToLocal(center));
        model.add(rotor);
        model.updateMatrixWorld(true);
        const parts = [];
        model.traverse((part) => {
          if (/^Pulsator_(?:Disc|Blade_\d+)$/.test(part.name)) parts.push(part);
        });
        parts.forEach((part) => rotor.attach(part));
      }
      const display = model.getObjectByName("Digital_Display");
      if (display?.material?.emissive) {
        display.material = display.material.clone();
        display.material.emissive.set("#53cfff");
        indicator = display.material;
      }
      q("#washer-model-fallback").hidden = true;
      host.dataset.ready = "true";
      render();
      resize();
      resume();
    },
    (error) => {
      q("#washer-model-fallback").textContent =
        "模型加载失败，请重新打开页面。";
      console.error(error);
    },
  );
} catch {
  q("#washer-model-fallback").textContent =
    "当前浏览器无法启动 WebGL，请开启硬件加速。";
}
function resize() {
  if (!renderer || !host.clientWidth || !host.clientHeight) return;
  renderer.setSize(host.clientWidth, host.clientHeight, false);
  camera.aspect = host.clientWidth / host.clientHeight;
  camera.updateProjectionMatrix();
}
let last = 0;
function tick(time = performance.now()) {
  frame = 0;
  if (!visible || document.hidden || !renderer) return;
  const dt = Math.min(0.1, Math.max(0, (time - last) / 1000));
  last = time;
  if (rotor && runtime?.animationRunning) {
    rotor.rotation.y += dt * 3.2;
    if (indicator)
      indicator.emissiveIntensity =
        0.4 + 0.35 * (0.5 + 0.5 * Math.sin(time / 200));
  }
  controls.update();
  renderer.render(scene, camera);
  frame = requestAnimationFrame(tick);
}
function resume() {
  cancelAnimationFrame(frame);
  resize();
  last = performance.now();
  if (visible && !document.hidden) tick(last);
}
const observer = new ResizeObserver(resize);
observer.observe(host);
window.addEventListener("concept-slide-change", () => {
  visible = !q("#device-custom").hidden;
  resume();
});
document.addEventListener("visibilitychange", resume);
window.addEventListener("pagehide", (e) => {
  cancelAnimationFrame(frame);
  if (e.persisted) return;
  observer.disconnect();
  controls?.dispose();
  scene?.traverse((o) => {
    o.geometry?.dispose();
    if (o.material)
      for (const m of Array.isArray(o.material) ? o.material : [o.material])
        m.dispose();
  });
  renderer?.dispose();
});
window.addEventListener("pageshow", (e) => {
  if (e.persisted) resume();
});
