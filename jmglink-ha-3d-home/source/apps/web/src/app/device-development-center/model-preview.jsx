import {createRotationPivotGizmo,rotationTrialRules} from "../../domain/rotation-pivot-preview.js";
import {createPartMotionEngine,modelPartNodes} from "../../domain/part-motion-engine.js";
import {disposePreviewObject} from '../../domain/webgl-recovery.js';
import {reportClientError} from '../../domain/browser-recovery.js';
import { a as React } from "../../vendor/react.js";
import * as THREE from "three";
import {createCameraModel} from "../../domain/camera-model.js";
import {createCinemaModelPreview} from "../../domain/cinema-model-preview.js";
import {cameraModelDefinition} from "../../../../../packages/schema/src/camera-models.js";
import {loadModelAsset} from "../../domain/model-assets.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import "../../styles/model-preview.css";
import {
  modelMaterialPalette,
  overrideModelMaterial,
} from "../../domain/model-material-colors.js";
import {
  createRuntimeModelGlow,
  disposeRuntimeModelGlow,
  updateRuntimeModelGlow,
} from "../../domain/runtime-model-glow.js";
import {
  modelPreviewSignature,
  webglPreviewPool,
} from "../../domain/webgl-preview-pool.js";

function disposeObject(root) {
  disposePreviewObject(root);
}

export default function ModelPreview({
  model,
  preparedAsset,
  compact = false,
  animated = false,
  command,
  onPalette,
  rotationPreview, onPivotChange,
  motionRules, motionValues, motionPlaying=true, selectedPart, selectedParts, onParts, onSelectPart, pathPicking=false, onPathPoint,onMotionValidation,
}) {
  const motionRef = React.useRef({});
  motionRef.current={rules:motionRules??[],values:motionValues??{},playing:motionPlaying,rotationPreview,onPivotChange,selectedPart,selectedParts,onParts,onSelectPart,pathPicking,onPathPoint,onMotionValidation};
  const container = React.useRef(null);
  const controlsApi = React.useRef(null);
  const [visible, setVisible] = React.useState(!compact);
  const [error, setError] = React.useState("");
  const [pageVisible,setPageVisible]=React.useState(()=>document.visibilityState!=="hidden");
  React.useEffect(()=>{const update=()=>setPageVisible(document.visibilityState!=="hidden");document.addEventListener('visibilitychange',update);return()=>document.removeEventListener('visibilitychange',update);},[]);
  const [thumbnail,setThumbnail]=React.useState(null);
  const [loading,setLoading]=React.useState(true);
  const modelRef = React.useRef(model);
  modelRef.current = model;
  const modelKey = modelPreviewSignature(model);
  const staticThumbnail=compact&&!animated&&!motionRules?.length;
  const thumbnailReady=staticThumbnail&&thumbnail?.key===modelKey;
  React.useEffect(() => {
    if (!compact || !container.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        setVisible(entries.some((entry) => entry.isIntersecting));
      },
      { rootMargin: "40px" },
    );
    observer.observe(container.current);
    return () => observer.disconnect();
  }, [compact]);

  React.useEffect(() => {
    if (!visible || !pageVisible || !model || !container.current || thumbnailReady) return;
    let disposed = false;
    const loadController = new AbortController();
    let disposeRenderer;
    let releaseSlot = () => {};
    setLoading(true);
    const failPreview=message=>{if(disposed)return;setError(message);setLoading(false);queueMicrotask(()=>{disposeRenderer?.();disposeRenderer=undefined;releaseSlot();});};
    releaseSlot = webglPreviewPool.request(() => {
      if (disposed || !container.current?.isConnected) return false;
      disposeRenderer = startPreview(modelRef.current);
      if (!disposeRenderer) queueMicrotask(() => releaseSlot());
    },error=>{reportClientError(error,'center');failPreview('模型预览初始化失败，请重新打开预览');}, {background:staticThumbnail});
    return () => {
      disposed = true;
      loadController.abort();
      disposeRenderer?.();
      disposeRenderer=undefined;
      releaseSlot();
    };

    function startPreview(model) {
    const host = container.current;
    if(!host?.isConnected)return;
    let active = true;
    let modelReady=false,captured=false,readyFrames=0;
    let shaderIssue='',lastCodeStatus='';
    let frame, renderer, assetLease, scene, controls, resizeObserver, contextLost, down, pick;
    let runtimeGlow=null, motionEngine=null, selectedBoxes=[], pivotGizmo=null;
    const cleanup=()=>{
      if(!active)return;
      active=false;loadController.abort();cancelAnimationFrame(frame);
      resizeObserver?.disconnect();controls?.dispose();controlsApi.current=null;
      renderer?.domElement.removeEventListener('webglcontextlost',contextLost);
      renderer?.domElement.removeEventListener('pointerdown',down);
      renderer?.domElement.removeEventListener('pointerup',pick);
      pivotGizmo?.dispose();motionEngine?.dispose();selectedBoxes.forEach(box=>{box.removeFromParent();box.geometry.dispose();box.material.dispose();});
      disposeRuntimeModelGlow(runtimeGlow);
      assetLease?.release();assetLease=null;
      if(scene)disposeObject(scene);
      renderer?.dispose();renderer?.forceContextLoss();renderer?.domElement.remove();
    };
    try {
      renderer = new THREE.WebGLRenderer({ antialias: !staticThumbnail, alpha: true });
    } catch {
      failPreview("当前环境无法启用 3D 预览");
      return;
    }
    try {
    setError("");
    contextLost=event=>{event.preventDefault();reportClientError(new Error('WebGL context lost'),'center');failPreview('3D 预览资源已释放，请重新打开预览；动效配置已保留。');};
    renderer.domElement.addEventListener('webglcontextlost',contextLost);
    renderer.debug.onShaderError=(gl,program,vertex,fragment)=>{shaderIssue=('动效着色器编译失败：'+(gl.getShaderInfoLog(fragment)||gl.getShaderInfoLog(vertex)||'请检查代码')).slice(0,1200);};
    renderer.setPixelRatio(staticThumbnail ? 1 : Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.replaceChildren(renderer.domElement);
    scene = new THREE.Scene();
    scene.background = animated && compact ? null : new THREE.Color(0xf1f6fb);
    const camera = new THREE.PerspectiveCamera(38, 1, 0.01, 100);
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.maxPolarAngle = Math.PI * 0.93;
    scene.add(new THREE.HemisphereLight(0xffffff, 0x697c96, 2.5));
    const light = new THREE.DirectionalLight(0xffffff, 2.4);
    light.position.set(2, 4, 3);
    scene.add(light);
    const root = new THREE.Group();
    let motionNodes=new Map(),baselines=new Map();
    let motionRoot=null,motionSignature="",lastSelection=null,elapsed=0,lastFrame=performance.now();
    const readyMotion=object=>{lastSelection=null;motionRoot=object;
      motionNodes=modelPartNodes(object);
      baselines=new Map([...motionNodes].map(([path,node])=>[path,{position:node.position.clone(),quaternion:node.quaternion.clone(),scale:node.scale.clone()}]));
      motionEngine=createPartMotionEngine(object,motionRef.current.rules);motionSignature=JSON.stringify(motionRef.current.rules);motionRef.current.onParts?.(motionEngine.parts);
    };
    if(motionRef.current.onPivotChange) pivotGizmo=createRotationPivotGizmo({scene,camera,domElement:renderer.domElement,orbit:controls,onChange:point=>motionRef.current.onPivotChange?.(point)});
    const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let pointerStart=null;
    down=event=>{pointerStart=pivotGizmo?.interacting?null:[event.clientX,event.clientY];};
    pick=event=>{if(pivotGizmo?.interacting||!motionRoot||!pointerStart||Math.hypot(event.clientX-pointerStart[0],event.clientY-pointerStart[1])>5)return;const rect=renderer.domElement.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObject(motionRoot,true).find(h=>h.object.isMesh&&!h.object.userData.partMotionOverlay&&!h.object.parent?.userData.partMotionOverlay);if(!hit)return;const nodes=modelPartNodes(motionRoot);const path=[...nodes].find(([,n])=>n===hit.object)?.[0];if(motionRef.current.pathPicking){const target=nodes.get(motionRef.current.selectedPart);if(target)motionRef.current.onPathPoint?.(target.worldToLocal(hit.point.clone()).toArray().map(v=>Math.round(v*10000)/10000));}else if(path)motionRef.current.onSelectPart?.(path,{additive:event.ctrlKey||event.metaKey});};
    renderer.domElement.addEventListener("pointerdown",down);renderer.domElement.addEventListener("pointerup",pick);
    scene.add(root);
    const fit = () => {
      const bounds = new THREE.Box3().setFromObject(root);
      if (bounds.isEmpty()) return;
      const size = bounds.getSize(new THREE.Vector3());
      const center = bounds.getCenter(new THREE.Vector3());
      const max = Math.max(size.x, size.y, size.z, 0.1);
      controls.target.copy(center);
      camera.position
        .copy(center)
        .add(new THREE.Vector3(max * 1.7, max * 1.25, max * 2.3));
      camera.near = Math.max(0.001, max / 100);
      camera.far = max * 100;
      camera.updateProjectionMatrix();
      controls.update();
    };
    controlsApi.current = { camera, controls, fit };
    const source = model.source ?? {};
    if (source.type === "procedural") {
      const {
        width = 0.62,
        height = 0.85,
        depth = 0.68,
      } = model.dimensions ?? {};
      const material = new THREE.MeshStandardMaterial({
        color: model.color ?? "#e8edf2",
        roughness: model.roughness ?? 0.62,
        metalness: model.metalness ?? 0.08,
      });
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, depth),
        material,
      );
      if(source.shape?.startsWith('cinema_')){body.geometry.dispose();material.dispose();root.add(createCinemaModelPreview(source.shape,{width,height,depth}));}else if(cameraModelDefinition(source.shape)){body.geometry.dispose();material.dispose();root.add(createCameraModel(source.shape,{dimensions:model.dimensions,color:model.color}));}else root.add(body);
      if (source.shape === "washing-machine") {
        const door = new THREE.Mesh(
          new THREE.TorusGeometry(width * 0.23, width * 0.035, 12, 48),
          new THREE.MeshStandardMaterial({ color: "#667d91", metalness: 0.6 }),
        );
        door.position.z = depth / 2 + 0.006;
        root.add(door);
      }
      if (source.shape === "pipeline-water-dispenser") {
        const display = new THREE.Mesh(
          new THREE.BoxGeometry(width * 0.7, height * 0.2, 0.02),
          new THREE.MeshStandardMaterial({ color: 0x243143, metalness: 0.35 }),
        );
        display.position.set(0, height * 0.17, depth / 2 + 0.012);
        root.add(display);
        const tray = new THREE.Mesh(
          new THREE.BoxGeometry(width * 0.62, 0.025, depth * 0.34),
          new THREE.MeshStandardMaterial({ color: 0x71808d, metalness: 0.58 }),
        );
        tray.position.set(0, -height * 0.45, depth * 0.72);
        root.add(tray);
      }
      if (source.shape === "water-purifier") {
        [-0.22, 0, 0.22].forEach((x, index) => {
          const filter = new THREE.Mesh(
            new THREE.CylinderGeometry(
              width * 0.09,
              width * 0.09,
              height * 0.62,
              24,
            ),
            new THREE.MeshStandardMaterial({
              color: index === 1 ? 0x58a5c8 : 0xdce5eb,
            }),
          );
          filter.position.set(x * width, 0, depth / 2 + 0.018);
          root.add(filter);
        });
      }
      if (source.shape === "gas-water-heater") {
        const flue = new THREE.Mesh(
          new THREE.CylinderGeometry(
            width * 0.17,
            width * 0.19,
            height * 0.24,
            28,
          ),
          new THREE.MeshStandardMaterial({ color: 0xb8c0c7, metalness: 0.7 }),
        );
        flue.position.y = height * 0.62;
        root.add(flue);
        const display = new THREE.Mesh(
          new THREE.BoxGeometry(width * 0.45, height * 0.13, 0.02),
          new THREE.MeshStandardMaterial({ color: 0x243143, metalness: 0.35 }),
        );
        display.position.set(0, -height * 0.27, depth / 2 + 0.012);
        root.add(display);
      }
      if (source.shape === "wifi-router") {
        [-0.38, -0.13, 0.13, 0.38].forEach((x) => {
          const antenna = new THREE.Mesh(
            new THREE.CylinderGeometry(0.008, 0.01, height * 4.5, 12),
            new THREE.MeshStandardMaterial({ color: 0x4a5565 }),
          );
          antenna.position.set(x * width, height * 2.1, -depth * 0.36);
          root.add(antenna);
        });
      }
      root.scale.setScalar(model.scale ?? 1);
      readyMotion(root);
      fit();
      modelReady=true;setLoading(false);
      if (animated) runtimeGlow = createRuntimeModelGlow(root);
    } else if (source.url) {
      const onLoaded = (gltf) => {
          if (!active) {
            assetLease?.release();
            assetLease=null;
            return;
          }
          const box = new THREE.Box3().setFromObject(gltf.scene);
          if (box.isEmpty()) {
            failPreview("模型没有可预览的几何体");
            assetLease?.release();
            assetLease=null;
            return;
          }
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());
          onPalette?.(modelMaterialPalette(gltf.scene));
          if (model.projectAppearance)
            gltf.scene.traverse((part) => {
              if (!part.isMesh || !part.material) return;
              part.material = Array.isArray(part.material)
                ? part.material.map((material) =>
                    overrideModelMaterial(material, model),
                  )
                : overrideModelMaterial(part.material, model);
            });
          if(staticThumbnail){
            const materials=new Map();
            gltf.scene.traverse(part=>{
              if(!part.material)return;
              const cheap=material=>{
                if(!materials.has(material))materials.set(material,new THREE.MeshStandardMaterial({color:material.color??0xffffff,map:material.map??null,transparent:material.transparent,opacity:material.opacity,side:material.side,roughness:.8,metalness:0}));
                return materials.get(material);
              };
              part.material=Array.isArray(part.material)?part.material.map(cheap):cheap(part.material);
            });
          }
          const dimensions = model.dimensions ?? {};
          const scale = new THREE.Vector3(
            (dimensions.width ?? size.x) / Math.max(size.x, 0.001),
            (dimensions.height ?? size.y) / Math.max(size.y, 0.001),
            (dimensions.depth ?? size.z) / Math.max(size.z, 0.001),
          ).multiplyScalar(model.scale ?? 1);
          gltf.scene.scale.copy(scale);
          gltf.scene.position.set(
            -center.x * scale.x,
            -center.y * scale.y,
            -center.z * scale.z,
          );
          root.add(gltf.scene);
          readyMotion(gltf.scene);
          fit();
          modelReady=true;setLoading(false);
          if (animated) runtimeGlow = createRuntimeModelGlow(root);
      };
      void (async () => {
        const asset = preparedAsset ? preparedAsset.retain() : await loadModelAsset(source.url, {signal:loadController.signal,background:staticThumbnail});
        try {
          if (!active || loadController.signal.aborted) return;
          assetLease=asset.instantiate();
          onLoaded({scene:assetLease.scene});
        } finally { asset.release(); }
      })().catch(error=>{
        if(active && error.name!=="AbortError"){
          reportClientError(error,'center');
          failPreview(error.name==="TimeoutError"?"模型加载超时，请重新打开预览":"模型文件缺失或无法解析，请重新上传");
        }
      });
    } else failPreview("上传 GLB 或自包含 GLTF 后可预览");
    root.position.set(
      model.anchor?.x ?? 0,
      (model.anchor?.y ?? 0) + (model.elevation ?? 0),
      model.anchor?.z ?? 0,
    );
    const resize = () => {
      if(!active)return;
      const width = Math.max(host.clientWidth, 100);
      const height = Math.max(host.clientHeight, 100);
      const factor=staticThumbnail?Math.min(1,320/width,200/height):1;
      renderer.setSize(Math.round(width*factor), Math.round(height*factor), false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();
    const animate = () => {
      if(!active)return;
      try {
      const now=performance.now(),dt=Math.min((now-lastFrame)/1000,.1);lastFrame=now;const motion=motionRef.current;if(motion.playing)elapsed+=dt;
      const trial=rotationTrialRules(motion.rotationPreview), activeRules=trial??motion.rules;
      if(motionEngine&&motionSignature!==JSON.stringify(activeRules)){motionEngine.dispose();motionEngine=createPartMotionEngine(motionRoot,activeRules);motionSignature=JSON.stringify(activeRules);shaderIssue='';lastCodeStatus='';}
      motionEngine?.update(trial?{"rotation-axis-trial":"on"}:motion.values,elapsed,motion.playing?dt:0);
      const pivotConfig=motion.rotationPreview, pivotNode=pivotConfig&&motionNodes.get(pivotConfig.target);
      pivotGizmo?.update(pivotConfig,pivotNode,pivotConfig&&baselines.get(pivotConfig.target));
      const selectedPaths=motion.selectedParts??(motion.selectedPart?[motion.selectedPart]:[]),selectionKey=JSON.stringify(selectedPaths);
      if(selectionKey!==lastSelection){
        selectedBoxes.forEach(box=>{box.removeFromParent();box.geometry.dispose();box.material.dispose();});
        selectedBoxes=selectedPaths.map(path=>motionNodes.get(path)).filter(Boolean).map(part=>new THREE.BoxHelper(part,0x397bff));
        selectedBoxes.forEach(box=>scene.add(box));lastSelection=selectionKey;
      }
      selectedBoxes.forEach(box=>box.update());
      updateRuntimeModelGlow(runtimeGlow, now / 1000);
      controls.update();
      renderer.render(scene, camera);
      if(motionEngine){const state=motionEngine.codeStatus(),message=shaderIssue||state.errors.join('；');if(message&&lastCodeStatus!==message){motion.onMotionValidation?.({pending:false,error:message});lastCodeStatus=message;}else if(!message&&!state.pending&&lastCodeStatus!=='ok'){motion.onMotionValidation?.({pending:false,error:''});lastCodeStatus='ok';}else if(!lastCodeStatus&&state.pending){motion.onMotionValidation?.({pending:true,error:''});lastCodeStatus='pending';}}
      if(staticThumbnail&&modelReady&&!captured&&++readyFrames>=2){
        captured=true;
        try{setThumbnail({key:modelKey,url:renderer.domElement.toDataURL('image/png')});}
        catch{failPreview('缩略图生成失败，请点击预览查看模型');}
      }
      frame=requestAnimationFrame(animate);
      } catch(error) {
        reportClientError(error,'center');
        failPreview('模型渲染失败，已释放当前预览；可继续编辑配置。');
      }
    };
    animate();
    return cleanup;
    } catch(error) { cleanup(); throw error; }
    }
  }, [visible, modelKey, compact, animated, staticThumbnail,thumbnailReady,preparedAsset,pageVisible]);
  React.useEffect(() => {
    const api = controlsApi.current;
    if (!api || !command) return;
    const { camera, controls, fit } = api;
    if (command.type === "fit") fit();
    else if (command.type === "rotate")
      camera.position
        .sub(controls.target)
        .applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 8)
        .add(controls.target);
    else if (command.type === "pan") {
      camera.position.x += 0.1;
      controls.target.x += 0.1;
    } else if (command.type === "zoom")
      camera.position.lerp(controls.target, 0.16);
    controls.update();
  }, [command]);
  return (
    <div className={`ddc-model-preview ${compact ? "compact" : ""} ${animated ? "running-glow" : ""}`}>
      <div className="ddc-model-canvas" ref={container} />
      {thumbnailReady&&<img className="ddc-model-thumbnail" src={thumbnail.url} alt={`${model?.name??'模型'}缩略图`}/>}
      {loading&&!thumbnailReady&&!error&&<span className="ddc-model-preview-loading" role="status">正在加载模型…</span>}
      {error && <span className="ddc-model-preview-error">{error}</span>}
      {!compact && !error && <small>拖动旋转 · 滚轮缩放 · 右键平移</small>}
    </div>
  );
}
