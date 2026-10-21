const isImageDataUrl = (value) => /^data:image\/(png|jpeg|jpg|webp|gif);base64,/i.test(value);
const assetBodySchema = {
    type: "object",
    required: ["type", "name", "url"],
    additionalProperties: false,
    properties: {
        type: { type: "string", enum: ["image", "model", "texture"] },
        name: { type: "string", minLength: 1, maxLength: 255 },
        url: { type: "string", minLength: 1, maxLength: 15 * 1024 * 1024 },
        metadata: { type: "object", additionalProperties: true },
    },
};
export async function registerProjectRoutes(app, store, gateway) {
    app.get("/api/projects", async () => ({ projects: store.listProjects() }));
    app.get("/api/assets", async () => ({ assets: store.listAssets() }));
    app.post("/api/assets", { bodyLimit: 15 * 1024 * 1024, schema: { body: assetBodySchema } }, async (request, reply) => {
        try {
            const asset = await store.addAsset(request.body);
            gateway?.broadcast({ type: "project.updated", payload: store.getProject() });
            return reply.code(201).send({ asset });
        }
        catch (error) {
            return reply.code(400).send({ error: error instanceof Error ? error.message : "Unable to add asset" });
        }
    });
    app.get("/api/assets/:id", async (request, reply) => {
        const asset = store.getAsset(request.params.id);
        if (!asset)
            return reply.code(404).send({ error: "Asset not found" });
        return { asset };
    });
    app.delete("/api/assets/:id", async (request, reply) => {
        try {
            const asset = await store.deleteAsset(request.params.id);
            if (!asset)
                return reply.code(404).send({ error: "Asset not found" });
            gateway?.broadcast({ type: "project.updated", payload: store.getProject() });
            return reply.code(204).send();
        }
        catch (error) {
            return reply.code(400).send({ error: error instanceof Error ? error.message : "Unable to delete asset" });
        }
    });
    app.post("/api/projects", {
        schema: {
            body: {
                type: "object",
                additionalProperties: false,
                properties: {
                    name: { type: "string", minLength: 1, maxLength: 120 },
                    sourceProjectId: { type: "string", minLength: 1, maxLength: 255 },
                },
            },
        },
    }, async (request, reply) => {
        try {
            const project = await store.createProject(request.body);
            gateway?.broadcast({ type: "project.updated", payload: project });
            return reply.code(201).send({ project });
        }
        catch (error) {
            return reply.code(400).send({ error: error instanceof Error ? error.message : "Unable to create project" });
        }
    });
    app.get("/api/projects/current", async () => ({ project: store.getProject() }));
    app.get("/api/projects/:id", async (request, reply) => {
        const project = store.getProject(request.params.id);
        if (!project)
            return reply.code(404).send({ error: "Project not found" });
        return { project };
    });
    app.put("/api/projects/:id", async (request, reply) => {
        if (request.params.id !== request.body.id)
            return reply.code(400).send({ error: "Project id mismatch" });
        let project;
        try {
            project = await store.saveProject(request.body);
        }
        catch (error) {
            return reply.code(400).send({ error: error instanceof Error ? error.message : "Invalid project" });
        }
        gateway?.broadcast({ type: "project.updated", payload: project });
        return { project };
    });
    app.delete("/api/projects/:id", async (request, reply) => {
        try {
            if (!await store.deleteProject(request.params.id))
                return reply.code(404).send({ error: "Project not found" });
            const current = store.getProject();
            if (current)
                gateway?.broadcast({ type: "project.updated", payload: current });
            return reply.code(204).send();
        }
        catch (error) {
            return reply.code(409).send({ error: error instanceof Error ? error.message : "Unable to delete project" });
        }
    });
    app.get("/api/projects/:id/export", async (request, reply) => {
        const project = store.getProject(request.params.id);
        if (!project)
            return reply.code(404).send({ error: "Project not found" });
        reply.header("content-disposition", `attachment; filename=ha3d-${project.id}.json`);
        return project;
    });
    app.post("/api/projects/:id/export", async (request, reply) => {
        const project = store.getProject(request.params.id);
        if (!project)
            return reply.code(404).send({ error: "Project not found" });
        reply.header("content-disposition", `attachment; filename=ha3d-${project.id}.json`);
        return project;
    });
    app.post("/api/projects/:id/import", async (request, reply) => {
        const current = store.getProject(request.params.id);
        if (!current)
            return reply.code(404).send({ error: "Project not found" });
        try {
            const saved = await store.saveProject({ ...request.body, id: current.id, createdAt: current.createdAt });
            gateway?.broadcast({ type: "project.updated", payload: saved });
            return { project: saved };
        }
        catch (error) {
            return reply.code(400).send({ error: error instanceof Error ? error.message : "Invalid project import" });
        }
    });
    app.post("/api/projects/import", async (request, reply) => {
        const current = store.getProject();
        if (!current)
            return reply.code(404).send({ error: "Project not found" });
        try {
            const saved = await store.saveProject({ ...request.body, id: current.id, createdAt: current.createdAt });
            gateway?.broadcast({ type: "project.updated", payload: saved });
            return { project: saved };
        }
        catch (error) {
            return reply.code(400).send({ error: error instanceof Error ? error.message : "Invalid project import" });
        }
    });
    app.get("/api/projects/:id/backups", async (request, reply) => {
        if (!store.getProject(request.params.id))
            return reply.code(404).send({ error: "Project not found" });
        return { backups: await store.listBackups(request.params.id) };
    });
    app.post("/api/projects/:id/backups/:backupId/restore", async (request, reply) => {
        if (!store.getProject(request.params.id))
            return reply.code(404).send({ error: "Project not found" });
        try {
            const saved = await store.restoreBackup(request.params.id, request.params.backupId);
            gateway?.broadcast({ type: "project.updated", payload: saved });
            return { project: saved };
        }
        catch (error) {
            return reply.code(400).send({ error: error instanceof Error ? error.message : "Unable to restore backup" });
        }
    });
    app.post("/api/projects/:id/blueprints", { bodyLimit: 15 * 1024 * 1024 }, async (request, reply) => {
        const project = store.getProject(request.params.id);
        if (!project)
            return reply.code(404).send({ error: "Project not found" });
        if (!isImageDataUrl(request.body.dataUrl))
            return reply.code(400).send({ error: "Expected image data URL" });
        const assetId = `blueprint-${Date.now()}`;
        const next = {
            ...project,
            assets: [
                ...project.assets.filter((asset) => asset.metadata?.kind !== "floorplan-reference"),
                {
                    id: assetId,
                    type: "image",
                    name: request.body.name,
                    url: request.body.dataUrl,
                    metadata: {
                        kind: "floorplan-reference",
                        opacity: request.body.opacity ?? 0.34,
                        scaleMeters: request.body.scaleMeters ?? 1,
                        aspectRatio: request.body.aspectRatio,
                        scalePercent: request.body.scalePercent ?? 100,
                        worldX: request.body.worldX,
                        worldY: request.body.worldY,
                        worldWidth: request.body.worldWidth,
                        worldHeight: request.body.worldHeight
                    }
                }
            ]
        };
        const saved = await store.saveProject(next);
        gateway?.broadcast({ type: "project.updated", payload: saved });
        return { project: saved, assetId };
    });
    app.post("/api/projects/:id/reset", async (request, reply) => {
        const project = store.getProject(request.params.id);
        if (!project)
            return reply.code(404).send({ error: "Project not found" });
        const saved = await store.reset(request.params.id);
        gateway?.broadcast({ type: "project.updated", payload: saved });
        return { project: saved };
    });
}
