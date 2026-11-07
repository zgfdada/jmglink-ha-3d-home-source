export function addonMcpEnvironment(options = {}) {
  const port = Number(options.mcp_public_port ?? 8112);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("MCP_PUBLIC_PORT_INVALID");
  return {
    HA3D_MCP_ENABLED: options.mcp_enabled === true ? "true" : "false",
    HA3D_MCP_PORT: "8102",
    HA3D_MCP_PUBLIC_PORT: String(port),
    HA3D_MCP_HOST: "0.0.0.0",
    HA3D_MCP_PRIVATE_DIR: "/config/mcp-private",
  };
}
