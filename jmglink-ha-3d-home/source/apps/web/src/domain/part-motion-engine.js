import * as THREE from "three";
import { disableSceneEffectPicking } from "./scene-picking.js";
import { createSurfaceScan } from "./surface-scan.js";
import { motionMatch } from "../../../../packages/schema/src/part-motion.js";

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
  function makeFlow(key, node, r) {
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
    for (let i = 0; i < 5; i++)
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
      const active = valid && (!r.mapping.enabled||Number.isFinite(Number(raw))) && motionMatch(r, raw);
      let s = states.get(r.id);
      if (!s) {
        s = {
          weight: 0,
          value: r.effect.type === "scale" ? 1 : 0,
          phase: 0,
          flowPhase:0,
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
        s.flowPhase+=dt*r.effect.speed*.25*(r.mapping.enabled?s.value:1);
        s.phase += ((dt * s.value * Math.PI) / 180) * r.effect.speed;
      }
      if (
        s.weight !== wanted ||
        (active && ["spin", "flow", "scan"].includes(r.effect.type)) ||
        (active && r.effect.mode !== "steady")
      )
        needsFrame = true;
      if (s.weight <= 0.0001) continue;
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
    for (const { n, r, s, path } of winners.values()) {
      const b = baselines.get(n),
        e = r.effect,
        w = s.weight,
        axis = new THREE.Vector3(
          e.axis === "x" ? 1 : 0,
          e.axis === "y" ? 1 : 0,
          e.axis === "z" ? 1 : 0,
        );
      if (e.type === "translate") n.position[e.axis] += s.value * w;
      if (e.type === "scale")
        n.scale[e.axis] *= 1 + (Math.max(0.001, s.value) - 1) * w;
      if (["rotate", "spin"].includes(e.type)) {
        const angle =
            e.type === "spin" ? s.phase * w : ((s.value * Math.PI) / 180) * w,
          q = new THREE.Quaternion().setFromAxisAngle(axis, angle);
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
      if (e.type === "visible")
        n.visible = w < 0.5 ? b.visible : s.value >= 0.5;
      if (["color", "emissive"].includes(e.type)) {
        const wave =
          e.mode === "breathe"
            ? 0.3 +
              0.7 *
                (0.5 + 0.5 * Math.sin(s.time * Math.PI * 2 * Math.abs(e.speed)))
            : e.mode === "blink"
              ? Math.sin(s.time * Math.PI * 2 * Math.abs(e.speed)) > 0
                ? 1
                : 0
              : 1;
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
                .lerp(new THREE.Color(e.color), w*(r.mapping.enabled?clamp(s.value):1));
            else if (m.emissive) {
              m.emissive
                .copy(baseline.materials[i].emissive)
                .lerp(new THREE.Color(e.color), w);
              m.emissiveIntensity =
                baseline.materials[i].emissiveIntensity * (1 - w) +
                (r.mapping.enabled?Math.max(0,s.value):e.intensity) * wave * w;
            }
          });
        });
      }
      if (e.type === "scan" && s.valid) {
        const key = r.id + ":" + path;
        const scan = scans.get(key) ?? createSurfaceScan(n);
        scans.set(key, scan);
        scanJobs.push(() => scan.update(e, s.flowPhase, w));
      }
      if (e.type === "flow") {
        const key = r.id + ":" + path;
        const f = flows.get(key) ?? makeFlow(key, n, r);
        f.group.visible = true;
        f.group.children.forEach((mesh, i) => {
          mesh.material.opacity = (i === 0 ? 0.22 : 0.95) * w;
          if (i > 0) {
            const p = (((s.flowPhase + (i - 1) / 5) % 1) + 1) % 1;
            mesh.position.copy(f.curve.getPoint(p));
          }
        });
      }
    }
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
  return { update, dispose, parts: modelPartIndex(root) };
}
