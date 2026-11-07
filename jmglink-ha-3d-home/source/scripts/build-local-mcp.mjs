// Local test-image staging; production Dockerfile still installs locked dependencies normally.
import { build } from "esbuild";
import { cp, mkdir, copyFile } from "node:fs/promises";
const root = new URL("../", import.meta.url);
const output = new URL(".release/mcp-image/", root);
await mkdir(output, { recursive: true });
await cp(new URL("apps/server/src/", root), new URL("server/", output), {
  recursive: true,
});
await cp(new URL("apps/web/dist/", root), new URL("web/", output), {
  recursive: true,
});
await copyFile(
  new URL("apps/server/package.json", root),
  new URL("server-package.json", output),
);
await build({
  entryPoints: [
    new URL("apps/server/src/mcp/server.js", root).pathname.replace(
      /^\/(?:([A-Za-z]):)/,
      "$1:",
    ),
  ],
  outfile: new URL("server/mcp/server.js", output).pathname.replace(
    /^\/(?:([A-Za-z]):)/,
    "$1:",
  ),
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node22",
  external: ["@ha3d/schema"],
  banner: {
    js: "import {createRequire as __mcpCreateRequire} from 'node:module'; const require=__mcpCreateRequire(import.meta.url);",
  },
});
console.log("Local MCP image staged (SDK bundled; no secrets included).");
