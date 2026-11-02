import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";
import { disposePreviewObject } from "./webgl-recovery.js";

const aborted = () => new DOMException("Model load cancelled", "AbortError");

// Keep the slot until decoding settles: cancelling a promise cannot stop image decoding.
export function createModelLoadQueue() {
  let running = false;
  const waiting = [];
  const pump = async () => {
    if (running) return;
    const job = waiting.shift();
    if (!job) return;
    if (job.signal?.aborted) {
      job.reject(aborted());
      queueMicrotask(pump);
      return;
    }
    running = true;
    job.started = true;
    job.signal?.removeEventListener("abort", job.cancel);
    try {
      job.resolve(await job.task());
    } catch (error) {
      job.reject(error);
    } finally {
      running = false;
      queueMicrotask(pump);
    }
  };
  return {
    run(task, { signal, background = false } = {}) {
      return new Promise((resolve, reject) => {
        if (signal?.aborted) {
          reject(aborted());
          return;
        }
        const job = {
          task,
          signal,
          background,
          resolve,
          reject,
          started: false,
        };
        job.cancel = () => {
          if (job.started) return;
          const index = waiting.indexOf(job);
          if (index >= 0) waiting.splice(index, 1);
          reject(aborted());
        };
        signal?.addEventListener("abort", job.cancel, { once: true });
        waiting.push(job);
        waiting.sort((a, b) => Number(a.background) - Number(b.background));
        queueMicrotask(pump);
      });
    },
    status: () => ({ active: Number(running), waiting: waiting.length }),
  };
}

export function createModelAsset(gltf) {
  let refs = 0,
    closed = false;
  const roots = [
    ...new Set([gltf.scene, ...(gltf.scenes ?? [])].filter(Boolean)),
  ];
  const owner = () => {
    if (closed) throw Error("Model asset already released");
    refs++;
    let released = false;
    return {
      scene: gltf.scene,
      retain() {
        if (released) throw Error("Model handle already released");
        return owner();
      },
      instantiate() {
        if (released) throw Error("Model handle already released");
        const hold = owner();
        let scene;
        const materials = new Map();
        try {
          scene = clone(gltf.scene);
          scene.traverse((part) => {
            if (!part.material) return;
            const copy = (material) => {
              if (!materials.has(material))
                materials.set(material, material.clone());
              return materials.get(material);
            };
            part.material = Array.isArray(part.material)
              ? part.material.map(copy)
              : copy(part.material);
          });
        } catch (error) {
          for (const material of materials.values()) material.dispose();
          hold.release();
          throw error;
        }
        let done = false;
        return {
          scene,
          release() {
            if (done) return;
            done = true;
            scene.removeFromParent();
            const owned = new Set(materials.values()),
              skeletons = new Set();
            scene.traverse((part) => {
              for (const material of Array.isArray(part.material)
                ? part.material
                : [part.material])
                if (material) owned.add(material);
              if (part.skeleton) skeletons.add(part.skeleton);
            });
            for (const material of owned) material.dispose();
            for (const skeleton of skeletons) skeleton.dispose();
            hold.release();
          },
        };
      },
      release() {
        if (released) return;
        released = true;
        if (--refs === 0) {
          closed = true;
          disposePreviewObject(roots);
        }
      },
    };
  };
  return owner();
}

export const modelLoadQueue = createModelLoadQueue();

// The prepared asset is handed to the editor preview, rather than parsed a second time.
export function loadModelAsset(
  source,
  { signal, background = false, timeoutMs = 45000 } = {},
) {
  const controller = new AbortController();
  const cancel = () => controller.abort();
  if (signal?.aborted) cancel();
  else signal?.addEventListener("abort", cancel, { once: true });
  let timer,
    timedOut = false;
  return modelLoadQueue
    .run(
      async () => {
        timer = setTimeout(() => {
          timedOut = true;
          controller.abort();
        }, timeoutMs);
        const activeSignal = controller.signal;
        let data,
          resourcePath = "";
        if (typeof source === "string") {
          const response = await fetch(source, { signal: activeSignal });
          if (!response.ok) throw Error("模型文件加载失败");
          data = await response.arrayBuffer();
          const url = new URL(source, document.baseURI);
          if (["http:", "https:", "file:"].includes(url.protocol))
            resourcePath = new URL(".", url).href;
        } else
          data = source.name?.toLowerCase().endsWith(".gltf")
            ? await source.text()
            : await source.arrayBuffer();
        if (activeSignal.aborted) throw aborted();
        const asset = createModelAsset(
          await new GLTFLoader().parseAsync(data, resourcePath),
        );
        if (activeSignal.aborted) {
          asset.release();
          throw aborted();
        }
        return asset;
      },
      { signal: controller.signal, background },
    )
    .catch((error) => {
      if (timedOut)
        throw new DOMException("模型加载超时，请重试", "TimeoutError");
      throw error;
    })
    .finally(() => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", cancel);
    });
}

export function createLatestModelTask() {
  let current;
  return {
    start() {
      current?.abort();
      const controller = new AbortController();
      current = controller;
      return {
        signal: controller.signal,
        isCurrent: () => current === controller && !controller.signal.aborted,
      };
    },
    cancel() {
      current?.abort();
      current = undefined;
    },
  };
}
