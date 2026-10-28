import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { createStableRoundedBoxGeometry } from "../domain/stable-surface-geometry.js";
import { FLOOR_ORBIT_LIMITS } from "../domain/camera-orbit.js";

// An independent architectural model using the application's engine and geometry.
// No app bootstrap, backend, user project data, HA connections or service calls.
const host = document.querySelector("#scene-host");
const fallback = document.querySelector("#scene-fallback");
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
} catch {
  fallback.textContent =
    "此浏览器无法启动 WebGL 三维渲染。请开启硬件加速后重新打开。";
}
if (renderer) start();
function start() {
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.prepend(renderer.domElement);
  renderer.domElement.setAttribute(
    "aria-label",
    "实时三维家居样板间，拖动旋转或点击房间选择",
  );
  renderer.domElement.tabIndex = 0;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(12, 13, 15);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.3, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.enablePan = false;
  controls.minDistance = 11;
  controls.maxDistance = 26;
  controls.minPolarAngle = 0.05;
  controls.maxPolarAngle = FLOOR_ORBIT_LIMITS.maxPolarAngle;
  controls.autoRotate = !matchMedia("(prefers-reduced-motion: reduce)").matches;
  controls.autoRotateSpeed = 0.3;
  controls.addEventListener("start", () => {
    controls.autoRotate = false;
    tween = null;
  });
  const ambient = new THREE.HemisphereLight(0xe6f0ff, 0x766453, 2.3);
  scene.add(ambient);
  const sun = new THREE.DirectionalLight(0xffedd6, 4.2);
  sun.position.set(-5, 12, 7);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, {
    left: -9,
    right: 9,
    top: 9,
    bottom: -9,
    near: 0.5,
    far: 40,
  });
  sun.shadow.bias = -0.0003;
  sun.shadow.normalBias = 0.025;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xa5c8ff, 1.8);
  fill.position.set(8, 5, -6);
  scene.add(fill);
  const home = new THREE.Group();
  scene.add(home);
  const mats = {};
  function material(name, color, roughness = 0.75, metalness = 0) {
    return (mats[name] ??= new THREE.MeshStandardMaterial({
      color,
      roughness,
      metalness,
    }));
  }
  const plaster = material("plaster", "#ece9de"),
    wood = material("wood", "#ac7952"),
    lightwood = material("lightwood", "#d7b58c");
  const fabric = material("fabric", "#7e9fbb"),
    fabricDark = material("fabricDark", "#4a6b88"),
    linen = material("linen", "#e6ddd0");
  const dark = material("dark", "#283340"),
    green = material("green", "#557b50"),
    pot = material("pot", "#c7b8a0");
  const brass = material("brass", "#c8aa71", 0.35, 0.7),
    white = material("white", "#f5f1e8");
  function box(w, h, d, x, y, z, mat, round = false, parent = home) {
    const geo = round
      ? createStableRoundedBoxGeometry([w, h, d])
      : new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  function cylinder(r1, r2, h, x, y, z, mat, parent = home) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, 32), mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }
  function sphere(r, x, y, z, mat, parent = home) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    parent.add(m);
    return m;
  }
  function legs(x, z, w, d, y = 0.2, h = 0.4) {
    for (const dx of [-w / 2 + 0.1, w / 2 - 0.1])
      for (const dz of [-d / 2 + 0.1, d / 2 - 0.1])
        cylinder(0.035, 0.028, h, x + dx, y, z + dz, dark);
  }
  // Floating plinth and individually laid timber floor boards.
  box(10.3, 0.3, 8.3, 0, -0.3, 0, material("base", "#263747"), true);
  box(10, 0.16, 8, 0, -0.08, 0, lightwood);
  for (let z = -3.85; z < 4; z += 0.32) {
    const boardMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#c49e73").multiplyScalar(
        0.94 + (Math.round((z + 4) * 100) % 7) / 40,
      ),
      roughness: 0.82,
    });
    box(9.92, 0.025, 0.305, 0, 0.018, z, boardMat);
    for (let x = -4.9 + (Math.round(z * 100) % 2 ? 1.4 : 0); x < 5; x += 2.5)
      box(0.012, 0.03, 0.305, x, 0.025, z, wood);
  }
  // Cutaway architecture: full rear/side walls, low front edges and real door openings.
  box(10, 2.65, 0.16, 0, 1.32, -4, plaster);
  box(0.16, 2.65, 8, -5, 1.32, 0, plaster);
  box(0.13, 1.45, 3.9, 0.8, 0.725, -2.02, plaster);
  box(0.13, 1.45, 1.4, 0.8, 0.725, 3.3, plaster);
  box(0.13, 0.3, 1.9, 0.8, 2.5, 1.75, plaster);
  box(4.2, 1.45, 0.13, 2.9, 0.725, 0.1, plaster);
  box(10, 0.13, 0.1, 0, 0.07, 4, plaster);
  box(0.1, 0.13, 8, 5, 0.07, 0, plaster);
  // Tall windows inset into the back wall, with mullions and hanging curtains.
  const glass = material("glass", "#abc9d7", 0.16, 0.2);
  for (const x of [-2.8, 2.8]) {
    box(2.9, 1.65, 0.04, x, 1.6, -3.9, glass);
    for (const dx of [-1.48, 0, 1.48])
      box(0.06, 1.8, 0.1, x + dx, 1.6, -3.84, white);
    for (const y of [0.7, 2.5]) box(3.05, 0.06, 0.14, x, y, -3.82, white);
    cylinder(0.025, 0.025, 3.5, x, 2.62, -3.7, brass).rotation.z = Math.PI / 2;
    for (const side of [-1, 1])
      for (let n = 0; n < 5; n++)
        cylinder(
          0.055,
          0.055,
          1.95,
          x + side * (1.33 + n * 0.07),
          1.56,
          -3.68,
          linen,
        );
  }
  // Living room: upholstered sectional, piping, pillows, rug, nested tables and TV.
  box(4.3, 0.035, 3.5, -2.2, 0.065, 1.15, material("rug", "#d5d3ca"), true);
  for (let n = 0; n < 22; n++)
    box(
      4.1,
      0.007,
      0.013,
      -2.2,
      0.088,
      -0.48 + n * 0.15,
      material("rugline", "#b7b9b1"),
    );
  box(0.42, 0.86, 3.6, -4.35, 0.56, 0.9, fabricDark, true);
  box(1.25, 0.36, 3.6, -3.82, 0.38, 0.9, fabricDark, true);
  for (let z = -0.4; z < 2.6; z += 1.1) {
    box(1.15, 0.23, 1.02, -3.72, 0.65, z, fabric, true);
    box(0.25, 0.64, 1.02, -4.19, 0.96, z, fabric, true);
  }
  box(2, 0.25, 1.1, -3.05, 0.62, 2.25, fabric, true);
  box(1.4, 0.26, 0.22, -3.72, 0.78, -0.94, fabricDark, true);
  for (const [x, z, c] of [
    [-3.9, -0.25, linen],
    [-3.9, 0.9, material("pillow", "#c5a075")],
    [-3.9, 1.95, linen],
  ]) {
    const p = box(0.32, 0.46, 0.55, x, 0.94, z, c, true);
    p.rotation.z = 0.2;
  }
  cylinder(0.73, 0.73, 0.11, -1.65, 0.65, 0.8, lightwood);
  cylinder(0.12, 0.18, 0.6, -1.65, 0.3, 0.8, dark);
  cylinder(0.42, 0.42, 0.09, -0.9, 0.42, 1.75, wood);
  cylinder(0.06, 0.06, 0.4, -0.9, 0.2, 1.75, brass);
  box(0.5, 0.035, 0.33, -1.5, 0.73, 0.85, linen);
  box(0.36, 0.025, 0.27, -1.45, 0.76, 0.85, dark);
  cylinder(0.12, 0.1, 0.18, -1.9, 0.79, 0.55, white);
  box(0.45, 0.44, 2.5, 0.4, 0.3, -1.8, lightwood, true);
  box(0.09, 1.18, 2.2, 0.31, 1.2, -1.8, dark, true);
  box(
    0.012,
    0.96,
    1.98,
    0.25,
    1.22,
    -1.8,
    material("screen", "#182b3d", 0.2, 0.3),
  );
  // Kitchen and dining zone with cabinetry, worktop, hob, sink, and pendant.
  for (let n = 0; n < 4; n++) {
    box(0.82, 0.9, 0.65, -4.45 + n * 0.86, 0.5, -3.45, wood, true);
    box(0.75, 0.73, 0.04, -4.45 + n * 0.86, 0.52, -3.1, linen);
    box(0.25, 0.03, 0.045, -4.45 + n * 0.86, 0.76, -3.06, brass);
  }
  box(3.5, 0.08, 0.76, -3.15, 0.99, -3.42, white, true);
  box(0.65, 0.025, 0.45, -3.9, 1.04, -3.45, dark, true);
  for (const x of [-4.08, -3.74])
    for (const z of [-3.56, -3.32])
      cylinder(0.1, 0.1, 0.015, x, 1.063, z, brass);
  box(
    0.58,
    0.03,
    0.44,
    -2.4,
    1.04,
    -3.42,
    material("sink", "#8798a2", 0.3, 0.6),
    true,
  );
  cylinder(0.025, 0.025, 0.34, -2.4, 1.22, -3.68, brass);
  box(0.03, 0.03, 0.23, -2.4, 1.38, -3.57, brass, true);
  box(2.1, 0.09, 1.1, -2, 0.94, -1.65, lightwood, true);
  legs(-2, -1.65, 2, 1, 0.46, 0.86);
  for (const [x, z] of [
    [-2.75, -0.65],
    [-1.35, -0.65],
    [-2.75, -2.6],
    [-1.35, -2.6],
  ]) {
    box(0.53, 0.09, 0.5, x, 0.53, z, fabric, true);
    legs(x, z, 0.5, 0.48, 0.25, 0.5);
    box(0.53, 0.45, 0.07, x, 0.79, z + (z < -1.5 ? -0.23 : 0.23), wood, true);
  }
  cylinder(0.025, 0.025, 1.2, -2, 2.5, -1.65, dark);
  cylinder(0.38, 0.15, 0.24, -2, 1.87, -1.65, brass);
  // Bedroom: layered mattress, stitched duvet, pillows, nightstand, wardrobe.
  box(2.5, 0.32, 3.0, 2.8, 0.27, -1.95, wood, true);
  box(2.4, 0.25, 2.8, 2.8, 0.55, -1.9, linen, true);
  box(2.5, 0.95, 0.18, 2.8, 0.72, -3.4, fabricDark, true);
  box(2.43, 0.16, 1.9, 2.8, 0.76, -1.4, material("duvet", "#b8c6bb"), true);
  for (const x of [2.2, 3.35]) box(1, 0.16, 0.55, x, 0.76, -2.92, white, true);
  for (let x = 1.7; x < 4; x += 0.16)
    box(0.013, 0.008, 1.65, x, 0.846, -1.3, material("stitch", "#d9e2d7"));
  for (const x of [1.13, 4.45]) {
    box(0.47, 0.49, 0.55, x, 0.32, -3.0, lightwood, true);
    cylinder(0.12, 0.13, 0.035, x, 0.6, -3, brass);
    cylinder(0.022, 0.022, 0.3, x, 0.75, -3, brass);
    cylinder(0.17, 0.24, 0.25, x, 0.98, -3, linen);
  }
  box(2.4, 1.4, 0.45, 3.45, 0.72, -0.2, linen, true);
  for (const x of [2.28, 3.05, 3.85, 4.62])
    box(0.02, 1.32, 0.03, x, 0.72, 0.04, wood);
  // Workspace: curved desk, display, keyboard, chair, shelving and books.
  box(2.9, 0.09, 0.85, 3.05, 0.98, 3.25, lightwood, true);
  legs(3.05, 3.25, 2.8, 0.75, 0.47, 0.94);
  box(1.1, 0.65, 0.065, 3.05, 1.5, 3.38, dark, true);
  box(0.99, 0.53, 0.01, 3.05, 1.5, 3.34, material("monitor", "#6a90a3"));
  box(0.06, 0.3, 0.06, 3.05, 1.14, 3.4, dark);
  box(0.5, 0.02, 0.23, 3.05, 1.045, 3.4, dark);
  box(0.6, 0.035, 0.22, 3.0, 1.05, 3.03, white, true);
  box(0.15, 0.04, 0.22, 3.58, 1.05, 3.02, dark, true);
  cylinder(0.32, 0.32, 0.12, 3, 0.6, 2.25, fabricDark);
  box(0.65, 0.62, 0.12, 3, 0.91, 1.98, fabricDark, true);
  cylinder(0.045, 0.045, 0.52, 3, 0.28, 2.25, brass);
  for (const r of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
    const leg = box(0.6, 0.035, 0.04, 3, 0.06, 2.25, dark);
    leg.rotation.y = r;
  }
  for (const y of [0.25, 0.83, 1.4, 1.98])
    box(0.55, 0.045, 2.1, 4.6, y, 1.55, lightwood);
  for (const z of [0.5, 2.6]) box(0.045, 2.05, 0.045, 4.6, 1.02, z, dark);
  for (let n = 0; n < 13; n++)
    box(
      0.26,
      0.18 + (n % 3) * 0.04,
      0.075,
      4.58,
      1.0 + (n % 2) * 0.57,
      0.7 + n * 0.13,
      [fabric, linen, wood][n % 3],
    );
  // Leaf meshes, stems and planters add a human scale to the architectural model.
  function plant(x, z, size = 1) {
    cylinder(0.19 * size, 0.14 * size, 0.36 * size, x, 0.2 * size, z, pot);
    cylinder(0.025, 0.025, 0.8 * size, x, 0.7 * size, z, wood);
    for (let i = 0; i < 8; i++) {
      const a = i * 2.4;
      const leaf = sphere(
        0.2 * size,
        x + Math.sin(a) * 0.2 * size,
        (0.7 + i * 0.065) * size,
        z + Math.cos(a) * 0.2 * size,
        green,
      );
      leaf.scale.set(0.6, 1.3, 1);
      leaf.rotation.z = Math.sin(a) * 0.8;
    }
  }
  plant(-4.35, 3.25, 1.4);
  plant(1.35, 3.35, 1.15);
  plant(-0.35, -3.35, 1.1);
  plant(4.5, 0.62, 0.7);
  // Selectable room surfaces and physically lit fixtures.
  const bounds = {
    living: [-2.1, 0, 5.5, 7.7],
    bedroom: [2.9, -2, 4, 3.7],
    studio: [2.9, 2.1, 4, 3.5],
  };
  const picks = [],
    lights = {},
    rings = {};
  for (const [key, [x, z, w, d]] of Object.entries(bounds)) {
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(w, d),
      new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    );
    plane.rotation.x = -Math.PI / 2;
    plane.position.set(x, 0.12, z);
    plane.userData.room = key;
    home.add(plane);
    picks.push(plane);
    const light = new THREE.PointLight(0xffd69a, 8, 7, 2);
    light.position.set(x, 2, z);
    home.add(light);
    lights[key] = light;
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.17, 0.21, 40),
      new THREE.MeshBasicMaterial({
        color: 0x68b5ff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
        depthTest: false,
      }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(x, 0.16, z + 0.75);
    ring.renderOrder = 10;
    home.add(ring);
    rings[key] = ring;
  }
  const raycaster = new THREE.Raycaster(),
    pointer = new THREE.Vector2();
  let down;
  renderer.domElement.addEventListener("pointerdown", (e) => {
    down = [e.clientX, e.clientY];
  });
  renderer.domElement.addEventListener("pointerup", (e) => {
    if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6)
      return;
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      (-(e.clientY - rect.top) / rect.height) * 2 + 1,
    );
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(picks)[0];
    if (hit)
      window.dispatchEvent(
        new CustomEvent("concept-room-pick", {
          detail: hit.object.userData.room,
        }),
      );
  });
  let tween = null,
    flat = false;
  function updateState(state) {
    if (!state) return;
    for (const key of Object.keys(lights)) {
      const room = state.rooms[key];
      lights[key].intensity = room.on ? room.brightness * 0.13 : 0;
      rings[key].visible = key === state.selectedRoom;
    }
    if (flat !== state.flatView) {
      flat = state.flatView;
      controls.autoRotate = false;
      tween = {
        from: camera.position.clone(),
        to: flat
          ? new THREE.Vector3(0, 20, 0.1)
          : new THREE.Vector3(12, 13, 15),
        start: performance.now(),
      };
    }
  }
  window.addEventListener("concept-scene-state", (e) => updateState(e.detail));
  updateState(window.conceptSceneState);
  let visible = !document.querySelector("#home").hidden,
    frame = 0,
    disposed = false;
  function resize() {
    const w = host.clientWidth,
      h = host.clientHeight;
    if (w && h) {
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
  }
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  resize();
  function tick() {
    frame = 0;
    if (disposed || !visible || document.hidden) return;
    if (tween) {
      const t = Math.min(1, (performance.now() - tween.start) / 700);
      camera.position.lerpVectors(tween.from, tween.to, 1 - (1 - t) ** 3);
      if (t === 1) tween = null;
    }
    controls.update();
    renderer.render(scene, camera);
    frame = requestAnimationFrame(tick);
  }
  function resume() {
    cancelAnimationFrame(frame);
    frame = 0;
    if (visible && !document.hidden) tick();
  }
  window.addEventListener("concept-slide-change", (e) => {
    visible = e.detail === 0;
    if (visible) resize();
    resume();
  });
  document.addEventListener("visibilitychange", resume);
  renderer.domElement.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    cancelAnimationFrame(frame);
    fallback.hidden = false;
    fallback.textContent = "三维上下文已暂停，请重新打开页面恢复。";
  });
  window.addEventListener("pageshow", (event) => { if (event.persisted) resume(); });
  window.addEventListener("pagehide", (event) => {
    if (event.persisted) { cancelAnimationFrame(frame); return; }
    disposed = true;
    cancelAnimationFrame(frame);
    observer.disconnect();
    controls.dispose();
    const geometries = new Set(),
      materials = new Set();
    scene.traverse((o) => {
      if (o.geometry) geometries.add(o.geometry);
      if (o.material) materials.add(o.material);
    });
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
    renderer.dispose();
  });
  fallback.hidden = true;
  renderer.domElement.dataset.engine = "three";
  host.dataset.ready = "true";
  resume();
}
