import { a as React } from "../../vendor/react.js";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { createPartMotionEngine } from "../../domain/part-motion-engine.js";
import { webglPreviewPool } from "../../domain/webgl-preview-pool.js";
import { motionResourceRule } from "../../../../../packages/schema/src/motion-library.js";

export default function MotionResourcePreview({
  resource,
  active = true,
  playing = true,
}) {
  const host = React.useRef(null),
    state = React.useRef({ resource, active, playing });
  state.current = { resource, active, playing };
  const [error, setError] = React.useState("");
  React.useEffect(() => {
    let disposed = false,
      cleanup = () => {};
    let release = () => {};
    release = webglPreviewPool.request(() => {
      if (disposed || !host.current?.isConnected) return false;
      try {
        cleanup = start();
      } catch (error) {
        setError(`3D 预览不可用：${error.message}`);
        queueMicrotask(() => release());
      }
    });
    function start() {
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
      });
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      host.current.appendChild(renderer.domElement);
      const scene = new THREE.Scene(),
        camera = new THREE.PerspectiveCamera(35, 1, 0.01, 100);
      camera.position.set(3, 2.2, 3.4);
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.target.set(0, 0.1, 0);
      controls.enableDamping = true;
      controls.enablePan = false;
      controls.minDistance = 2;
      controls.maxDistance = 8;
      scene.add(new THREE.HemisphereLight(0xd5edff, 0x7392ae, 2));
      const light = new THREE.DirectionalLight(0xffffff, 3);
      light.position.set(3, 5, 2);
      scene.add(light);
      const root = new THREE.Group();
      root.name = "示例部件";
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 0.75, 0.8),
        new THREE.MeshStandardMaterial({
          color: 0x6c98cd,
          roughness: 0.3,
          metalness: 0.25,
        }),
      );
      body.name = "示例机身";
      root.add(body);
      scene.add(root);
      const grid = new THREE.GridHelper(4, 16, 0xb8cce4, 0xdce7f3);
      grid.position.y = -0.65;
      scene.add(grid);
      let engine = null,
        key = "",
        frame,
        last = 0,
        time = 0;
      const observer = new ResizeObserver(() => {
        const { width, height } = host.current.getBoundingClientRect();
        renderer.setSize(Math.max(width, 1), Math.max(height, 1));
        camera.aspect = width / Math.max(height, 1);
        camera.updateProjectionMatrix();
      });
      observer.observe(host.current);
      const tick = (now) => {
        if (disposed) return;
        frame = requestAnimationFrame(tick);
        const dt = Math.min((now - last) / 1000 || 0, 0.1);
        last = now;
        const current = state.current;
        const signature = JSON.stringify(current.resource);
        if (signature !== key) {
          engine?.dispose();
          engine = null;
          key = signature;
          try {
            const rule = motionResourceRule({
              ...current.resource,
              id: current.resource.id || "custom.motion.preview",
            });
            engine = createPartMotionEngine(root, [rule]);
            setError("");
          } catch (error) {
            setError(error.message);
          }
        }
        if (current.playing) {
          time += dt;
          engine?.update({ demo: current.active ? "on" : "off" }, time, dt);
        }
        controls.update();
        renderer.render(scene, camera);
      };
      frame = requestAnimationFrame(tick);
      return () => {
        cancelAnimationFrame(frame);
        observer.disconnect();
        controls.dispose();
        engine?.dispose();
        scene.traverse((n) => {
          n.geometry?.dispose();
          for (const material of Array.isArray(n.material)
            ? n.material
            : [n.material])
            material?.dispose();
        });
        renderer.dispose();
        renderer.forceContextLoss();
        renderer.domElement.remove();
      };
    }
    return () => {
      disposed = true;
      cleanup();
      release();
    };
  }, []);
  return (
    <div
      className="motion-resource-preview"
      ref={host}
      aria-label="动效实时预览"
    >
      {error && <p role="alert">{error}</p>}
      <span>示例部件 · 拖动旋转 · 滚轮缩放</span>
    </div>
  );
}
