import { a as React } from "../vendor/react.js";
export function McpConnectionGuide({onClose}) {
 const panelRef=React.useRef(null);
 React.useEffect(()=>{
  const outside=event=>{if(panelRef.current && !panelRef.current.contains(event.target))onClose();};
  const escape=event=>{if(event.key==="Escape")onClose();};
  document.addEventListener("pointerdown",outside,true);
  document.addEventListener("keydown",escape);
  return ()=>{document.removeEventListener("pointerdown",outside,true);document.removeEventListener("keydown",escape);};
 },[onClose]);
 const [address,setAddress]=React.useState("");
 const [addressNotice,setAddressNotice]=React.useState("");
 const [saving,setSaving]=React.useState(false);
 const [state,setState]=React.useState({kind:"checking"});
 const check=async()=>{
  setState({kind:"checking"});
  try {
   const r=await fetch("./api/mcp-admin/state",{cache:"no-store",signal:AbortSignal.timeout(5000)});
   if(r.status===401||r.status===403){setState({kind:"auth"});return;}
   if(!r.ok){setState({kind:"missing"});return;}
   const data=await r.json();
   if(typeof data.endpoint!=="string"||typeof data.enabled!=="boolean")throw Error();
   setAddress(data.endpoint);
   setState({kind:data.enabled?"ready":"disabled",endpoint:data.endpoint});
  }catch{setState({kind:"unreachable"});}
 };
 const saveAddress=async(reset=false)=>{
  let endpoint=reset?"":address.trim();
  if(!reset) {
   try{const u=new URL(endpoint);if(!["http:","https:"].includes(u.protocol)||u.username||u.password||u.search||u.hash)throw Error();}
   catch{setAddressNotice("请输入完整的 HTTP(S) 地址，不含账号密码、查询参数或片段。");return;}
  }
  setSaving(true);setAddressNotice("");
  try{
   const r=await fetch("./api/mcp-admin/endpoint",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({endpoint}),signal:AbortSignal.timeout(5000)});
   if(!r.ok)throw Error();
   await check();setAddressNotice(reset?"已恢复部署默认地址":"连接地址已保存；请确保端口映射和反向代理已配置。");
  }catch{setAddressNotice("保存失败，请检查管理权限和服务版本。");}
  finally{setSaving(false);}
 };
 React.useEffect(()=>{check();},[]);
 const messages={checking:"正在检测 MCP 管理服务…",ready:"MCP 管理服务可用",disabled:"MCP 服务已部署，但当前已关闭",auth:"管理服务可达，需要完成管理员认证",missing:"当前站点未提供 MCP 管理接口",unreachable:"暂时无法连接 MCP 管理服务"};
 return <section ref={panelRef} className="home-mcp-guide" onPointerDown={event=>event.stopPropagation()} onClick={event=>event.stopPropagation()} role="dialog" aria-label="MCP 连接与权限">
  <header><strong>MCP 连接与权限</strong></header>
  <p role="status" className={"home-mcp-status state-"+state.kind}><span className="home-mcp-status-light" aria-hidden="true" /><strong>{state.kind==="checking"?"检测中":state.kind==="ready"?"可用":"不可用"}</strong><span>{messages[state.kind]}</span></p>
  {state.endpoint && <div className="home-mcp-address"><label>MCP 连接地址<input type="url" aria-label="MCP 连接地址" value={address} onChange={event=>setAddress(event.target.value)} placeholder="https://主机或域名:端口/mcp" /></label><div><button disabled={saving||state.kind==="checking"} onClick={()=>saveAddress()}>保存地址</button><button disabled={saving||state.kind==="checking"} onClick={()=>saveAddress(true)}>恢复默认</button></div><small>此处保存所有客户端使用的连接地址，不修改实际监听端口、Docker 映射或代理。端口被占用时须先修改部署配置再重启服务。</small>{addressNotice && <p role="status">{addressNotice}</p>}</div>}
  {state.kind!=="checking" && <>
   {["ready","disabled","auth"].includes(state.kind) && <a className="home-mcp-manage" href="./mcp-admin" target="_blank" rel="noopener">打开连接与权限管理 ↗</a>}
   <p>首次使用：部署支持 MCP 的服务，配置监听端口，并将容器端口映射到宿主机。管理页用于配置连接和权限。</p>
   <ol><li>确认启动配置包含 HA3D_MCP_ENABLED=true。</li><li>确认 MCP 监听端口、Docker 映射与客户端连接地址一致。部署时可设置 HA3D_MCP_PUBLIC_PORT（宿主机端口）和 HA3D_MCP_PORT（监听端口），再重新创建容器；无需固定使用 8112。</li><li>接口不存在时检查服务版本和反向代理路由；无法连接时检查服务状态、地址和端口。</li><li>服务关闭时进入管理页启用；需要认证时按管理页提示操作。</li></ol>
   <small>此检测确认网页管理接口状态，不能证明客户端到独立 MCP 端口的网络连通性；连接失败也不能直接判定为未部署。</small>
   <button onClick={check}>重新检测</button>
  </>}
 </section>;
}
