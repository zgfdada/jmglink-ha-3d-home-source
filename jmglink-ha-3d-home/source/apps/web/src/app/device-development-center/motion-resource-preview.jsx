import { a as React } from "../../vendor/react.js";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { createPartMotionEngine } from "../../domain/part-motion-engine.js";
import { webglPreviewPool } from "../../domain/webgl-preview-pool.js";
import {disposePreviewObject} from "../../domain/webgl-recovery.js";
import {reportClientError} from "../../domain/browser-recovery.js";
import { motionResourceRule } from "../../../../../packages/schema/src/motion-library.js";

export default function MotionResourcePreview({
  resource,
  active = true,
  playing = true,
  onValidation,
}) {
  const host = React.useRef(null),
    state = React.useRef({ resource, active, playing,onValidation });
  state.current = { resource, active, playing,onValidation };
  const [error, setError] = React.useState("");
  const [pageVisible,setPageVisible]=React.useState(()=>document.visibilityState!=="hidden");
  React.useEffect(()=>{const update=()=>setPageVisible(document.visibilityState!=="hidden");document.addEventListener('visibilitychange',update);return()=>document.removeEventListener('visibilitychange',update);},[]);
  React.useEffect(() => {
    if(!pageVisible)return;
    setError("");
    let disposed = false,
      cleanup = () => {};
    let release = () => {};
    const fail=error=>{if(disposed)return;reportClientError(error,'center');setError('动效预览已停止，请重新打开；配置已保留。');queueMicrotask(()=>{cleanup();cleanup=()=>{};release();});};
    release = webglPreviewPool.request(() => {
      if (disposed || !host.current?.isConnected) return false;
      try {
        cleanup = start();
      } catch (error) {
        fail(error);
      }
    });
    function start() {
      let renderer,scene,controls,observer,engine=null,frame,live=true;
      const lost=event=>{event.preventDefault();fail(new Error('WebGL context lost'));};
      const stop=()=>{
        if(!live)return;live=false;cancelAnimationFrame(frame);observer?.disconnect();controls?.dispose();engine?.dispose();
        if(scene)disposePreviewObject(scene);
        renderer?.domElement.removeEventListener('webglcontextlost',lost);
        renderer?.dispose();renderer?.forceContextLoss();renderer?.domElement.remove();
      };
      try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
      });
      renderer.domElement.addEventListener('webglcontextlost',lost);
      renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      let shaderError='',lastValidation='';
      renderer.debug.onShaderError=(gl,program,vertex,fragment)=>{shaderError=('着色器编译失败：'+(gl.getShaderInfoLog(fragment)||gl.getShaderInfoLog(vertex)||gl.getProgramInfoLog(program)||'请检查 GLSL 代码')).slice(0,1500);};
      host.current.appendChild(renderer.domElement);
      scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 100);
      camera.position.set(3, 2.2, 3.4);
      controls = new OrbitControls(camera, renderer.domElement);
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
      let key = "",
        last = 0,
        time = 0;
      observer = new ResizeObserver(() => {
        if(!live||!host.current?.isConnected)return;
        const { width, height } = host.current.getBoundingClientRect();
        renderer.setSize(Math.max(width, 1), Math.max(height, 1));
        camera.aspect = width / Math.max(height, 1);
        camera.updateProjectionMatrix();
      });
      observer.observe(host.current);
      const tick = (now) => {
        if (disposed || !live) return;
        try {
        const dt = Math.min((now - last) / 1000 || 0, 0.1);
        last = now;
        const current = state.current;
        const signature = JSON.stringify(current.resource);
        if (signature !== key) {
          engine?.dispose();
          engine = null;
          key = signature;
          shaderError='';lastValidation='';
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
        const codeState=engine?.codeStatus();
        const validation=shaderError||codeState?.errors.join('；')||'';
        if(validation){if(lastValidation!==validation){setError(validation);current.onValidation?.({key:signature,error:validation});lastValidation=validation;}}
        else if(engine&&!codeState?.pending&&lastValidation!=='ok'){current.onValidation?.({key:signature,error:''});lastValidation='ok';setError('');}
        frame=requestAnimationFrame(tick);
        } catch(error){fail(error);}
      };
      frame = requestAnimationFrame(tick);
      return stop;
      } catch(error){stop();throw error;}
    }
    return () => {
      disposed = true;
      cleanup();
      release();
    };
  }, [pageVisible]);
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
