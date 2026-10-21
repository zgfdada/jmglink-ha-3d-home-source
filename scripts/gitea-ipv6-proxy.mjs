import http from "node:http";
import https from "node:https";

const targetHost = "gitea.700117.xyz";
const targetPort = 16666;
const listenPort = 16667;
const allowedPrefix = "/api/v1/repos/zgf/jmglink-ha-3d-model-library/";
const allowedMethods = new Set(["GET", "POST", "PUT"]);

const server = http.createServer((request, response) => {
  if (request.url === "/health") {
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end('{"ok":true}');
    return;
  }
  if (
    !allowedMethods.has(request.method) ||
    !request.url?.startsWith(allowedPrefix)
  ) {
    response.writeHead(403, { "Content-Type": "application/json" });
    response.end('{"error":"Forbidden"}');
    return;
  }
  const headers = { ...request.headers, host: `${targetHost}:${targetPort}` };
  delete headers.connection;
  delete headers["proxy-connection"];
  const upstream = https.request(
    {
      hostname: targetHost,
      port: targetPort,
      method: request.method,
      path: request.url,
      headers,
      servername: targetHost,
      rejectUnauthorized: true,
    },
    (upstreamResponse) => {
      const responseHeaders = { ...upstreamResponse.headers };
      delete responseHeaders.connection;
      delete responseHeaders["transfer-encoding"];
      response.writeHead(upstreamResponse.statusCode ?? 502, responseHeaders);
      upstreamResponse.pipe(response);
    },
  );
  upstream.on("error", () => {
    if (!response.headersSent)
      response.writeHead(502, { "Content-Type": "application/json" });
    response.end('{"error":"Gitea upstream unavailable"}');
  });
  request.pipe(upstream);
});

server.listen(listenPort, "0.0.0.0");
