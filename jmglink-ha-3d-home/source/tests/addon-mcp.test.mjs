import test from "node:test";
import assert from "node:assert/strict";
import { addonMcpEnvironment } from "../apps/server/src/config/addonMcpOptions.js";
test("App MCP默认关闭且私有目录独立于业务data",()=>{
 const e=addonMcpEnvironment();assert.equal(e.HA3D_MCP_ENABLED,"false");assert.equal(e.HA3D_MCP_PORT,"8102");assert.equal(e.HA3D_MCP_PRIVATE_DIR,"/config/mcp-private");
});
test("App配置映射至监听及对外端口，拒绝非法端口",()=>{
 assert.equal(addonMcpEnvironment({mcp_enabled:true,mcp_public_port:18112}).HA3D_MCP_ENABLED,"true");
 assert.equal(addonMcpEnvironment({mcp_public_port:18112}).HA3D_MCP_PUBLIC_PORT,"18112");
 for(const port of [0,65536,1.5,"invalid"])assert.throws(()=>addonMcpEnvironment({mcp_public_port:port}));
 assert.equal(addonMcpEnvironment({mcp_enabled:"true"}).HA3D_MCP_ENABLED,"false");
});
