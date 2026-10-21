import { WebSocket } from "ws";

const DEFAULT_MAX_BUFFERED_BYTES = 4 * 1024 * 1024;
const DEFAULT_MAX_CLIENTS = 64;

export class ClientGateway {
    clients = new Set();
    wss;
    connectionHandler;
    maxBufferedBytes;
    maxClients;
    constructor({ maxBufferedBytes = DEFAULT_MAX_BUFFERED_BYTES, maxClients = DEFAULT_MAX_CLIENTS } = {}) {
        this.maxBufferedBytes = maxBufferedBytes;
        this.maxClients = maxClients;
    }
    attach(wss, handlers) {
        this.detachServer();
        this.wss = wss;
        this.connectionHandler = (socket) => {
            if (this.clients.size >= this.maxClients) {
                socket.close(1013, "Server is busy");
                return;
            }
            this.clients.add(socket);
            const onMessage = (raw) => {
                if (!handlers)
                    return;
                void this.handleCommand(socket, raw.toString(), handlers);
            };
            const cleanup = () => {
                this.clients.delete(socket);
                socket.off("message", onMessage);
                socket.off("close", cleanup);
                socket.off("error", cleanup);
            };
            socket.once("close", cleanup);
            socket.once("error", cleanup);
            socket.on("message", onMessage);
            this.send(socket, { type: "server.ready", payload: { connectedAt: new Date().toISOString() } });
        };
        wss.on("connection", this.connectionHandler);
    }
    broadcast(event) {
        const message = JSON.stringify(event);
        for (const client of this.clients) {
            if (client.readyState !== WebSocket.OPEN)
                continue;
            if (client.bufferedAmount > this.maxBufferedBytes) {
                this.clients.delete(client);
                client.terminate();
                continue;
            }
            client.send(message, (error) => {
                if (!error)
                    return;
                this.clients.delete(client);
                client.terminate();
            });
        }
    }
    getResourceStats() {
        let bufferedBytes = 0;
        for (const client of this.clients)
            bufferedBytes += client.bufferedAmount ?? 0;
        return { websocketClients: this.clients.size, websocketBufferedBytes: bufferedBytes };
    }
    detachServer() {
        if (this.wss && this.connectionHandler)
            this.wss.off("connection", this.connectionHandler);
        this.wss = undefined;
        this.connectionHandler = undefined;
    }
    close() {
        this.detachServer();
        for (const client of this.clients) {
            try {
                client.close(1001, "Server shutting down");
                client.terminate();
            }
            catch {
                // The socket is already gone; clearing our reference is sufficient.
            }
        }
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
        if (socket.readyState !== WebSocket.OPEN)
            return;
        if (socket.bufferedAmount > this.maxBufferedBytes) {
            this.clients.delete(socket);
            socket.terminate();
            return;
        }
        socket.send(JSON.stringify(event));
    }
}
