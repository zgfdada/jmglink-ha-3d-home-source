// A throwaway in-memory fixture: no filesystem store and no real HA connection.
import { build } from "vite";
import Fastify from "fastify";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import { registerClientErrorRoutes } from "../apps/server/src/routes/clientErrors.js";
const bundle = await build({
  configFile: false,
  root: fileURLToPath(new URL("../apps/web", import.meta.url)),
  logLevel: "error",
  build: {
    write: false,
    minify: false,
    rollupOptions: {
      input: fileURLToPath(
        new URL("../tests/fixtures/browser-recovery.jsx", import.meta.url),
      ),
    },
  },
});
const files = new Map(bundle.output.map((file) => [file.fileName, file]));
const entry = bundle.output.find(
  (file) => file.type === "chunk" && file.isEntry,
);
const css = bundle.output.filter((file) => file.fileName.endsWith(".css"));
const app = Fastify(),
  errors = [];
app.log.warn = (fields) => errors.push(fields.clientError);
await registerClientErrorRoutes(app);
app.get("/verify/errors", async () => ({ errors }));
app.get("/verify/startup", async (req, reply) =>
  reply
    .type("text/html")
    .send(
      await readFile(
        new URL("../apps/web/index.html", import.meta.url),
        "utf8",
      ),
    ),
);
app.get("/", async (req, reply) =>
  reply
    .type("text/html")
    .send(
      `<!doctype html><html lang="zh-CN"><meta charset="utf-8">${css.map((file) => `<link rel="stylesheet" href="/${file.fileName}">`).join("")}<div id="root">正在加载验收场景</div><script type="module" src="/${entry.fileName}"></script></html>`,
    ),
);
app.get("/assets/:file", async (req, reply) => {
  const file = files.get(`assets/${req.params.file}`);
  if (!file) return reply.code(404).send({ error: "Not found" });
  return reply
    .type(
      file.fileName.endsWith(".css") ? "text/css" : "application/javascript",
    )
    .send(file.code ?? file.source);
});
await app.listen({ host: "127.0.0.1", port: 18102 });
console.log("browser recovery fixture ready: 18102 (in memory)");
