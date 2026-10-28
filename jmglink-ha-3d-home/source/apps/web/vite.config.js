import { defineConfig } from "vite";
import { readFileSync } from "node:fs";
import { cp, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const release = process.env.HA3D_RELEASE_BUILD === "1";
const version = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8")).version;

const backend = process.env.HA3D_BACKEND ?? "http://127.0.0.1:8099";
const websocketBackend = backend.replace(/^http/, "ws");

export default defineConfig({
  base: "./",
  publicDir: release ? false : "public",
  plugins: release ? [{name:"release-public-assets", async closeBundle() {
    const root=path.dirname(fileURLToPath(import.meta.url));
    for(const entry of await readdir(path.join(root,"public"))) {
      if(entry === "concept") continue;
      await cp(path.join(root,"public",entry),path.join(root,"dist",entry),{recursive:true});
    }
  }}] : [],
  build: {
    target: "es2022",
    sourcemap: !release,
    minify: release ? "esbuild" : false,
    ...(release ? { rollupOptions: { output: {
      entryFileNames: `assets/[name]-[hash]-v${version}.js`,
      chunkFileNames: `assets/[name]-[hash]-v${version}.js`,
    } } } : {}),
    outDir: "dist",
    emptyOutDir: true,
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/api": backend,
      "/ws": {
        target: websocketBackend,
        ws: true,
      },
    },
  },
});
