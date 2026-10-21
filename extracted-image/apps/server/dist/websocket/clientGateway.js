import { WebSocket } from "ws";
export class ClientGateway {
    clients = new Set();
    attach(wss, handlers) {
        wss.on("connection", (socket) => {
            this.clients.add(socket);
            socket.send(JSON.stringify({ type: "server.ready", payload: { connectedAt: new Date().toISOString() } }));
            socket.on("close", () => this.clients.delete(socket));
            socket.on("message", (raw) => {
                if (!handlers)
                    return;
                void this.handleCommand(socket, raw.toString(), handlers);
            });
        });
    }
    broadcast(event) {
        const message = JSON.stringify(event);
        for (const client of this.clients) {
            if (client.readyState === WebSocket.OPEN)
                client.send(message);
        }
    }
    close() {
        for (const client of this.clients)
            client.close(1001, "Server shutting down");
        this.clients.clear();
    }
    async handleCommand(socket, raw, handlers) {
        let command;
        try {
            command = JSON.parse(raw);
        }
        catch {
            return this.send(socket, { type: "command.error", payload: { message: "Invalid WebSocket command" } });
        }
        const requestId = command.requestId;
        try {
            if (command.type === "project.subscribe") {
                this.send(socket, { type: "project.updated", payload: handlers.getProject() });
                return this.ack(socket, requestId);
            }
            if (command.type === "project.patch") {
                const payload = command.payload;
                const project = payload && typeof payload === "object" && "project" in payload
                    ? payload.project
                    : payload;
                if (!project)
                    throw new Error("Project payload is required");
                const saved = await handlers.saveProject(project);
                this.broadcast({ type: "project.updated", payload: saved });
                return this.ack(socket, requestId, saved);
            }
            if (command.type === "ha.action") {
                const entity = await handlers.performAction(command.payload);
                this.broadcast({ type: "ha.entity_updated", payload: entity });
                return this.ack(socket, requestId, entity);
            }
        }
        catch (error) {
            return this.send(socket, { type: "command.error", payload: { requestId, message: error instanceof Error ? error.message : "WebSocket command failed" } });
        }
    }
    ack(socket, requestId, payload) {
        if (requestId)
            this.send(socket, { type: "command.ack", payload: { requestId, result: payload } });
    }
    send(socket, event) {
        if (socket.readyState === WebSocket.OPEN)
            socket.send(JSON.stringify(event));
    }
}
