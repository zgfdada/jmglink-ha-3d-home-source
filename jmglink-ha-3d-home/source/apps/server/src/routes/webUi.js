import fastifyStatic from "@fastify/static";
export async function registerWebUi(app, webDist) {
  await app.register(fastifyStatic, {
    root: webDist,
    prefix: "/",
    maxAge: 0,
    etag: true,
    lastModified: true,
    setHeaders(reply, file) {
      if (/\.html$/i.test(file)) reply.header("Cache-Control", "no-store");
    },
  });
  app.setNotFoundHandler(async (request, reply) => {
    const pathname = request.url.split("?")[0];
    if (
      pathname.startsWith("/api") ||
      pathname.startsWith("/ws") ||
      pathname.startsWith("/assets/") ||
      /\.[a-z0-9]{1,12}$/i.test(pathname)
    )
      return reply.code(404).send({ error: "Not found" });
    return reply.header("Cache-Control", "no-store").sendFile("index.html");
  });
}
