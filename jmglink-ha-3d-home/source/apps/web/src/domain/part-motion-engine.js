import {rotationGroupTargets,baselineWorldMatrix,applySharedPartRotation} from "./shared-part-rotation.js";
import * as THREE from "three";
import { disableSceneEffectPicking } from "./scene-picking.js";
import { createSurfaceScan } from "./surface-scan.js";
import { motionMatch } from "../../../../packages/schema/src/part-motion.js";
import { acquireMotionProgram } from "./motion-code-runtime.js";

export function modelPartIndex(root) {
  const nodes = [];
  function visit(node, path, depth) {
    nodes.push({
      path,
      name: node.name || `未命名 ${node.type}`,
      depth,
      type: node.type,
      mesh: Boolean(node.isMesh),
    });
    node.children.forEach((child, i) => {
      if (!child.userData.partMotionOverlay)
        visit(child, `${path}/${i}`, depth + 1);
    });
  }
  visit(root, "root", 0);
  return nodes;
}
export function modelPartNodes(root) {
  const nodes = new Map();
  function visit(n, p) {
    nodes.set(p, n);
    n.children.forEach((c, i) => {
      if (!c.userData.partMotionOverlay) visit(c, `${p}/${i}`);
    });
  }
  visit(root, "root");
  return nodes;
}
const channel = (r) =>
  r.effect.type === "spin" || r.effect.type === "rotate"
    ? `rotation.${r.effect.axis}`
    : r.effect.type === "translate"
      ? `position.${r.effect.axis}`
      : r.effect.type === "scale"
        ? `scale.${r.effect.axis}`
        : r.effect.type;
const clamp = (n) => Math.max(0, Math.min(1, n));
export function createPartMotionEngine(root, rules = []) {
  const codePrograms = new Map();
  for (const rule of rules)
    if (rule.effect.program) {
      const program = acquireMotionProgram(rule.effect.program.code);
      if (program) codePrograms.set(rule.id, program);
      else if (typeof window !== "undefined")
        codePrograms.set(rule.id, {
          sample: () => null,
          status: () => ({
            error: "当前浏览器无法运行 JavaScript 动效",
            pending: false,
          }),
          release() {},
        });
    }
  const nodes = modelPartNodes(root),
    baselines = new Map(),
    states = new Map(),
    flows = new Map(),
    scans = new Map();
  for (const n of nodes.values()) {
    const materials = Array.isArray(n.material)
      ? n.material
      : n.material
        ? [n.material]
        : [];
    baselines.set(n, {
      matrixAutoUpdate:n.matrixAutoUpdate,
      matrix:n.matrix.clone(),
      position: n.position.clone(),
      quaternion: n.quaternion.clone(),
      scale: n.scale.clone(),
      visible: n.visible,
      original: n.material,
      materials,
    });
    if (materials.length)
      n.material = Array.isArray(n.material)
        ? materials.map((m) => m.clone())
        : materials[0].clone();
  }
  const orderedRules = [...rules].sort((a, b) => a.priority - b.priority);
  let disposed = false;
  function reset(n, b) {
    n.matrixAutoUpdate=b.matrixAutoUpdate;
    n.matrix.copy(b.matrix);
    n.matrixWorldNeedsUpdate=true;
    n.position.copy(b.position);
    n.quaternion.copy(b.quaternion);
    n.scale.copy(b.scale);
    n.visible = b.visible;
    const ms = Array.isArray(n.material)
      ? n.material
      : n.material
        ? [n.material]
        : [];
    ms.forEach((m, i) => {
      m.color?.copy(b.materials[i].color);
      const original = b.materials[i];
      if (m.transparent !== original.transparent) {
        m.transparent = original.transparent;
        m.needsUpdate = true;
      }
      m.opacity = original.opacity;
      m.emissive?.copy(b.materials[i].emissive);
      if (m.emissive) m.emissiveIntensity = b.materials[i].emissiveIntensity;
    });
  }
  function makeFlow(key, node, r, count = 5) {
    const points = r.effect.path.map((p) => new THREE.Vector3(...p));
    const curve = new THREE.CatmullRomCurve3(points);
    const group = new THREE.Group();
    group.name = "动效路径";
    group.userData.partMotionOverlay = true;
    const radius = Math.max(
      0.002,
      Math.min(
        0.025,
        new THREE.Box3()
          .setFromObject(node)
          .getSize(new THREE.Vector3())
          .length() * 0.008,
      ),
    );
    const material = new THREE.MeshBasicMaterial({
      color: r.effect.color,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    });
    const trail = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 64, radius * 0.45, 6, false),
      material.clone(),
    );
    trail.material.opacity = 0.22;
    trail.renderOrder = 1000;
    group.add(trail);
    for (let i = 0; i < count; i++)
      group.add(
        new THREE.Mesh(
          new THREE.SphereGeometry(radius * 1.5, 8, 6),
          material.clone(),
        ),
      );
    material.dispose();
    group.children.forEach((mesh) => {
      mesh.renderOrder = 1000;
    });
    disableSceneEffectPicking(group);
    node.add(group);
    const flow = { group, curve };
    flows.set(key, flow);
    return flow;
  }
  function update(
    values = {},
    time = 0,
    delta = 1 / 60,
    { available = true } = {},
  ) {
    if (disposed) return false;
    const dt = Math.max(0, Math.min(delta, 0.1));
    for (const [n, b] of baselines) reset(n, b);
    for (const f of flows.values()) f.group.visible = false;
    for (const scan of scans.values()) scan.hide();
    const scanJobs = [];
    const winners = new Map();
    let needsFrame = false;
    for (const r of orderedRules) {
      const raw = values[r.capabilityId],
        valid =
          available &&
          raw !== undefined &&
          raw !== null &&
          !["unknown", "unavailable", ""].includes(String(raw));
      const active =
        valid &&
        (!r.mapping.enabled || Number.isFinite(Number(raw))) &&
        motionMatch(r, raw);
      let s = states.get(r.id);
      if (!s) {
        s = {
          weight: 0,
          value: r.effect.type === "scale" ? 1 : 0,
          phase: 0,
          flowPhase: 0,
          time: 0,
        };
        states.set(r.id, s);
      }
      const held = !active && valid && r.enabled && r.endBehavior === "hold";
      s.valid = valid;
      const wanted = active ? 1 : held ? s.weight : 0;
      const rate = r.transitionMs
        ? 1 - Math.exp((-dt * 6000) / r.transitionMs)
        : 1;
      s.weight += (wanted - s.weight) * rate;
      if (Math.abs(s.weight - wanted) < 0.001) s.weight = wanted;
      if (active) {
        s.time += dt;
        const ratio = r.mapping.enabled
          ? clamp(
              (Number(raw) - r.mapping.inputMin) /
                (r.mapping.inputMax - r.mapping.inputMin),
            )
          : 1;
        const desired = r.effect.from + (r.effect.to - r.effect.from) * ratio;
        s.value += (desired - s.value) * rate;
        s.flowPhase +=
          dt * r.effect.speed * 0.25 * (r.mapping.enabled ? s.value : 1);
        s.phase += ((dt * s.value * Math.PI) / 180) * r.effect.speed;
      }
      if (
        s.weight !== wanted ||
        (active && ["spin", "flow", "scan"].includes(r.effect.type)) ||
        (active && r.effect.mode !== "steady")
      )
        needsFrame = true;
      if (s.weight <= 0.0001) continue;
      const program = codePrograms.get(r.id);
      if (program) {
        needsFrame = true;
        const { program: programDefinition, shader, ...params } = r.effect;
        s.custom = program.sample({
          time: s.time,
          delta: dt,
          value: s.value,
          phase: s.flowPhase,
          angle: (s.phase * 180) / Math.PI,
          weight: s.weight,
          mapped: r.mapping.enabled,
          input: typeof raw === "string" ? raw.slice(0, 160) : raw,
          params,
        });
        if (!s.custom || program.status().error) continue;
        needsFrame = true;
      }
      for (const path of r.targets) {
        const n = nodes.get(path);
        if (
          !n ||
          (r.targetNames?.[path] &&
            (n.name || `未命名 ${n.type}`) !== r.targetNames[path])
        )
          continue;
        const key = path + ":" + channel(r);
        winners.set(key, { n, r, s, path });
      }
    }
    const sharedRotations=new Map();
    for (const { n, r, s, path } of winners.values()) {
      const b = baselines.get(n),
        custom = s.custom ?? {},
        e = { ...r.effect, ...custom },
        value = custom.value ?? s.value,
        w = s.weight,
        axis = new THREE.Vector3(
          e.axis === "x" ? 1 : 0,
          e.axis === "y" ? 1 : 0,
          e.axis === "z" ? 1 : 0,
        );
      if (e.type === "translate") {
        if (custom.offset)
          n.position.add(new THREE.Vector3(...custom.offset).multiplyScalar(w));
        else n.position[e.axis] += value * w;
      }
      if (e.type === "scale")
        n.scale[e.axis] *= 1 + (Math.max(0.001, value) - 1) * w;
      if (["rotate", "spin"].includes(e.type)) {
        const angle =
            custom.angle !== undefined
              ? ((custom.angle * Math.PI) / 180) * w
              : e.type === "spin"
                ? s.phase * w
                : ((value * Math.PI) / 180) * w,
          q = new THREE.Quaternion().setFromAxisAngle(axis, angle);
        if(r.targets.length>1){
          if(!sharedRotations.has(r.id)){
            const paths=rotationGroupTargets(r.targets),reference=nodes.get(paths[0]);
            sharedRotations.set(r.id,{targets:[],frame:reference?baselineWorldMatrix(reference,baselines):null,paths,axis:e.axis,pivot:e.pivot,angle});
          }
          const job=sharedRotations.get(r.id);
          if(job.paths.includes(path))job.targets.push(n);
        }else{
        n.quaternion.multiply(q);
        const pivot = new THREE.Vector3(...e.pivot)
          .multiply(b.scale)
          .applyQuaternion(b.quaternion);
        n.position.add(
          pivot
            .clone()
            .sub(
              pivot
                .clone()
                .applyQuaternion(
                  new THREE.Quaternion().setFromAxisAngle(
                    axis.clone().applyQuaternion(b.quaternion),
                    angle,
                  ),
                ),
            ),
        );
        }
      }
      if (e.type === "visible")
        n.visible = w < 0.5 ? b.visible : (custom.visible ?? value >= 0.5);
      if (["color", "emissive"].includes(e.type)) {
        const wave =
          custom.wave ??
          (e.mode === "breathe"
            ? 0.3 +
              0.7 *
                (0.5 + 0.5 * Math.sin(s.time * Math.PI * 2 * Math.abs(e.speed)))
            : e.mode === "blink"
              ? Math.sin(s.time * Math.PI * 2 * Math.abs(e.speed)) > 0
                ? 1
                : 0
              : 1);
        n.traverse((part) => {
          const baseline = baselines.get(part);
          if (!baseline) return;
          const ms = Array.isArray(part.material)
            ? part.material
            : part.material
              ? [part.material]
              : [];
          ms.forEach((m, i) => {
            if (e.type === "color")
              m.color
                ?.copy(baseline.materials[i].color)
                .lerp(
                  new THREE.Color(e.color),
                  w * (custom.mix ?? (r.mapping.enabled ? clamp(value) : 1)),
                );
            else if (m.emissive) {
              m.emissive
                .copy(baseline.materials[i].emissive)
                .lerp(new THREE.Color(e.color), w);
              m.emissiveIntensity =
                baseline.materials[i].emissiveIntensity * (1 - w) +
                (custom.intensity ??
                  (r.mapping.enabled ? Math.max(0, value) : e.intensity)) *
                  wave *
                  w;
            }
          });
        });
      }
      if (e.type === "scan" && s.valid) {
        const key = r.id + ":" + path;
        const scan = scans.get(key) ?? createSurfaceScan(n, e.shader);
        scans.set(key, scan);
        scanJobs.push(() => scan.update(e, custom.phase ?? s.flowPhase, w));
      }
      if (e.type === "flow") {
        const key = r.id + ":" + path;
        const count = custom.progress?.length ?? 5;
        let f = flows.get(key);
        if (f && f.group.children.length !== count + 1) {
          f.group.removeFromParent();
          f.group.traverse((mesh) => {
            mesh.geometry?.dispose();
            mesh.material?.dispose();
          });
          flows.delete(key);
          f = null;
        }
        f ??= makeFlow(key, n, r, count);
        f.group.visible = true;
        f.group.children.forEach((mesh, i) => {
          mesh.material.opacity =
            (i === 0
              ? (custom.trailOpacity ?? 0.22)
              : (custom.opacity ?? 0.95)) * w;
          mesh.material.color.set(e.color);
          if (i > 0) {
            const p =
              custom.progress?.[i - 1] ??
              ((((custom.phase ?? s.flowPhase) + (i - 1) / count) % 1) + 1) % 1;
            mesh.position.copy(f.curve.getPoint(p));
          }
        });
      }
    }
    for(const job of sharedRotations.values())if(job.frame)applySharedPartRotation(job.targets,job.frame,job.axis,job.pivot,job.angle);
    for (const job of scanJobs) job();
    if (!available)
      for (const [n, b] of baselines) {
        const materials = Array.isArray(n.material)
          ? n.material
          : n.material
            ? [n.material]
            : [];
        for (const material of materials) {
          if (material.color) {
            const { r, g, b } = material.color;
            const gray = r * 0.2126 + g * 0.7152 + b * 0.0722;
            material.color.lerp(
              new THREE.Color().setRGB(gray, gray, gray),
              0.72,
            );
          }
          material.emissive?.multiplyScalar(0.25);
          if (material.emissiveIntensity !== undefined)
            material.emissiveIntensity *= 0.25;
          material.opacity *= 0.5;
          if (!material.transparent) {
            material.transparent = true;
            material.needsUpdate = true;
          }
        }
      }
    return needsFrame;
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    for (const program of codePrograms.values()) program.release();
    for (const scan of scans.values()) scan.dispose();
    scans.clear();
    for (const { group } of flows.values()) {
      group.removeFromParent();
      group.traverse((n) => {
        n.geometry?.dispose();
        n.material?.dispose();
      });
    }
    for (const [n, b] of baselines) {
      reset(n, b);
      const materials = Array.isArray(n.material)
        ? n.material
        : n.material
          ? [n.material]
          : [];
      materials.forEach((m) => m.dispose());
      n.material = b.original;
    }
    flows.clear();
  }
  return {
    update,
    dispose,
    parts: modelPartIndex(root),
    codeStatus() {
      const states = [...codePrograms.values()].map((p) => p.status());
      return {
        pending: states.some((s) => s.pending),
        errors: states.map((s) => s.error).filter(Boolean),
      };
    },
  };
}
