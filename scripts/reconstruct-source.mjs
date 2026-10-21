import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const extractedRoot = path.join(workspaceRoot, "extracted-image");
const outputRoot = path.join(workspaceRoot, "jmglink-ha-3d-home", "source");

function assertInsideWorkspace(target) {
  const relative = path.relative(workspaceRoot, path.resolve(target));
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Refusing to modify path outside the workspace: ${target}`);
  }
}

async function resetDirectory(target) {
  assertInsideWorkspace(target);
  await rm(target, { recursive: true, force: true });
  await mkdir(target, { recursive: true });
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function relativeImport(fromFile, toFile) {
  let value = path.relative(path.dirname(fromFile), toFile).replaceAll("\\", "/");
  if (!value.startsWith(".")) value = `./${value}`;
  return value;
}

const webDist = path.join(extractedRoot, "apps", "web", "dist");
const originalAssets = path.join(webDist, "assets");
const recoveredApp = path.join(outputRoot, "apps", "web", "src", "app");
const recoveredVendor = path.join(outputRoot, "apps", "web", "src", "vendor");
const recoveredStyles = path.join(outputRoot, "apps", "web", "src", "styles");

await resetDirectory(recoveredApp);
await resetDirectory(recoveredVendor);
await resetDirectory(recoveredStyles);

const modules = [
  { input: "index-CWMUN1IG.js", output: path.join(recoveredApp, "app.js"), kind: "application" },
  { input: "FloorplanEditor-CWRaEIlm.js", output: path.join(recoveredApp, "floorplan-editor.js"), kind: "application" },
  { input: "HomeView-BFS1nsev.js", output: path.join(recoveredApp, "home-view.js"), kind: "application" },
  { input: "AppSelect-DDRORnJ8.js", output: path.join(recoveredApp, "scene.js"), kind: "application" },
  { input: "AuthorSupportDialog-qBRE_uuJ.js", output: path.join(recoveredApp, "author-support-dialog.js"), kind: "application" },
  { input: "react-BvuTDSTB.js", output: path.join(recoveredVendor, "react.js"), kind: "vendor" },
  { input: "three-ChmNxkrA.js", output: path.join(recoveredVendor, "three.js"), kind: "vendor" },
  { input: "hls-CWrIGcEr.js", output: path.join(recoveredVendor, "hls.js"), kind: "vendor" },
];

const moduleByInput = new Map(modules.map((entry) => [entry.input, entry]));
const manifest = {
  recoveredAt: new Date().toISOString(),
  officialIndex: "docker.jmglink.cn/jmglink-ha-3d@sha256:03deec9340d7df1aad4cd470a70e6a48455082e27a58f589530b6d191a55d45f",
  sourceImage: "docker.jmglink.cn/jmglink-ha-3d@sha256:e57ce9b132fb269703e60e4ea0d231d2d6901987a5cb496957976191992c20a8",
  fidelity: "behavioral recovery from compiled artifacts; original symbols, comments, types, and file boundaries are unavailable",
  modules: [],
};

for (const entry of modules) {
  const inputPath = path.join(originalAssets, entry.input);
  let source = await readFile(inputPath, "utf8");

  for (const target of modules) {
    const originalSpecifier = `./${target.input}`;
    const recoveredSpecifier = relativeImport(entry.output, target.output);
    source = source.replaceAll(originalSpecifier, recoveredSpecifier);
  }

  // Remove Vite's generated preload wrapper. A fresh Vite build recreates correct
  // preload metadata for the recovered stable module paths.
  source = source.replace(
    /[A-Za-z_$][\w$]*\(\(\)=>import\(("[^"]+")\),__vite__mapDeps\(\[[^\]]*\]\),import\.meta\.url\)/g,
    "import($1)",
  );
  source = source.replace(
    /^const __vite__mapDeps=.*?=>i\.map\(i=>d\[i\]\);/,
    "",
  );

  // The official client sends an empty POST for export. Fastify rejects that
  // request with HTTP 415 before the route handler runs; the server already
  // exposes the same operation as GET.
  source = source.replace(
    /fetch\(`\.\/api\/projects\/\$\{([^}]+)\}\/export`,\{method:"POST"\}\)/g,
    (_match, projectId) => `fetch(\`./api/projects/\${${projectId}}/export\`)`,
  );

  const banner = [
    "/**",
    ` * Recovered ${entry.kind} module from official 0.1.5 Vite artifact: ${entry.input}`,
    " * Original identifiers, TypeScript types, comments, and module boundaries were not present.",
    " */",
    "",
  ].join("\n");

  await mkdir(path.dirname(entry.output), { recursive: true });
  await writeFile(entry.output, banner + source, "utf8");
  manifest.modules.push({
    kind: entry.kind,
    original: `apps/web/dist/assets/${entry.input}`,
    recovered: path.relative(outputRoot, entry.output).replaceAll("\\", "/"),
    originalSha256: sha256(await readFile(inputPath)),
  });
}

for (const asset of [
  "afdianQr-ClA8sE2M.png",
  "bilibiliQr-DEZu03cm.png",
  "douyinQr-Dnnl8sQ4.png",
  "ec-CXT8k6X9.png",
  "niu-CqhQI55s.png",
  "sheng-wrAbX6pX.png",
  "star-dash-MlyKIEhc.png",
  "star-yi-g43xz0NV.png",
  "tu-CIrL7ZWP.png",
  "xiaohongshuQr-B7L44kzL.png",
]) {
  await cp(path.join(originalAssets, asset), path.join(recoveredApp, asset));
}

await cp(path.join(originalAssets, "index-BkZh02gL.css"), path.join(recoveredStyles, "index.css"));

const serverSource = path.join(outputRoot, "apps", "server", "src");
await resetDirectory(serverSource);
await cp(path.join(extractedRoot, "apps", "server", "dist"), serverSource, { recursive: true });

const schemaSource = path.join(outputRoot, "packages", "schema", "src");
const schemaTypes = path.join(outputRoot, "packages", "schema", "types");
await resetDirectory(schemaSource);
await resetDirectory(schemaTypes);
for (const file of ["index.js", "topology.js"]) {
  await cp(path.join(extractedRoot, "packages", "schema", "dist", file), path.join(schemaSource, file));
}
for (const file of ["index.d.ts", "topology.d.ts"]) {
  await cp(path.join(extractedRoot, "packages", "schema", "dist", file), path.join(schemaTypes, file));
}

await writeFile(
  path.join(outputRoot, "RECOVERY_MANIFEST.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
  "utf8",
);

console.log(`Recovered ${modules.length} frontend modules plus server and schema sources into ${outputRoot}`);
