function errorReply(reply, error) {
  return reply.code(400).send({
    error: error instanceof Error ? error.message : "在线模型库请求失败",
  });
}

export async function registerModelLibraryRoutes(app, library) {
  app.get("/api/model-library/status", async () => library.status());

  app.get("/api/model-library/models", async (request, reply) => {
    try {
      return await library.list({
        refresh: request.query?.refresh === "true",
        query: request.query?.query ?? "",
      });
    } catch (error) {
      return errorReply(reply, error);
    }
  });

  app.post("/api/model-library/models/:id/install", async (request, reply) => {
    try {
      return await library.install(request.params.id);
    } catch (error) {
      return errorReply(reply, error);
    }
  });

  app.get("/api/model-library/models/:id/preview", async (request, reply) => {
    try {
      return await library.preview(request.params.id);
    } catch (error) {
      return errorReply(reply, error);
    }
  });

  app.get("/api/model-library/models/:id/file", async (request, reply) => {
    try {
      const asset = await library.asset(request.params.id);
      return reply
        .type(asset.mimeType)
        .header("Content-Disposition", `inline; filename="${asset.fileName}"`)
        .send(asset.bytes);
    } catch (error) {
      return errorReply(reply, error);
    }
  });

  app.post("/api/model-library/publish/preview", async (request, reply) => {
    try {
      return await library.previewPublish(request.body);
    } catch (error) {
      return errorReply(reply, error);
    }
  });

  app.post("/api/model-library/publish", async (request, reply) => {
    try {
      return await library.publish(request.body);
    } catch (error) {
      return errorReply(reply, error);
    }
  });
}
