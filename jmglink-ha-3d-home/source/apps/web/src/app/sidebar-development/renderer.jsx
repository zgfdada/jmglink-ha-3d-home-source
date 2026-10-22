import { resolveSidebarEntities } from "../../../../../packages/schema/src/sidebar-bindings.js";
import { r as getReactDom } from "../../vendor/three.js";
const ReactDom = getReactDom();
import { resolveDaylight } from "../../../../../packages/schema/src/daylight.js";
import { a as React } from "../../vendor/react.js";
import { defaultSidebar } from "../../../../../packages/schema/src/sidebar.js";
import "./sidebar.css";

export async function sidebarApi(projectId, action, body) {
  const response = await fetch(
    `api/sidebar/${encodeURIComponent(projectId)}${action ? `/${action}` : ""}`,
    body
      ? {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      : { cache: "no-store" },
  );
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "侧边栏请求失败");
  return data;
}
export function entitySnapshot(entity) {
  if (!entity) return undefined;
  return {
    entityId: entity.entityId,
    name: entity.name,
    state: entity.state,
    attributes: entity.attributes ?? {},
    lastChanged: entity.lastChanged,
    lastUpdated: entity.lastUpdated,
  };
}
// Custom JavaScript only transforms the selected entity in a time-limited Worker.
// The opaque-origin iframe has no network, parent DOM, storage or HA credentials.
export function customDocument(widget, entity, entities = [], viewContext = {}) {
  const encode = (value) => JSON.stringify(value).replace(/</g, "\\u003c");
  const lifecycle = `const rootStyle=document.createElement('style');document.head.append(rootStyle);
function applyTheme(theme){rootStyle.textContent=':root{--widget-text:'+(theme==='day'?'#f5f9ff':'#14283f')+';--widget-muted:'+(theme==='day'?'#dbe9f1':'#31485e')+';--widget-line:'+(theme==='day'?'#e6f4ff40':'#ffffff70')+'}html,body,#view{background:transparent!important;box-shadow:none!important;border:0;filter:none}body{color:var(--widget-text);margin:0;overflow:hidden}';}
applyTheme(${encode(viewContext.theme || 'day')});
window.addEventListener('message',event=>{if(event.source===parent && event.data?.type==='ha3d-theme')applyTheme(event.data.theme);});
let lastHeight=0;const report=()=>{const view=document.getElementById('view');if(!view)return;const h=Math.ceil(view.getBoundingClientRect().height+parseFloat(getComputedStyle(document.body).paddingTop||0)+parseFloat(getComputedStyle(document.body).paddingBottom||0));if(h>0 && h!==lastHeight){lastHeight=h;parent.postMessage({type:'ha3d-widget-height',height:h},'*');}};
new ResizeObserver(report).observe(document.getElementById('view'));new MutationObserver(report).observe(document.getElementById('view'),{childList:true,subtree:true,characterData:true});
const clock=()=>{const now=new Date();document.querySelectorAll('[data-clock]').forEach(el=>{const type=el.getAttribute('data-clock');el.textContent=type==='date'?now.toLocaleDateString('zh-CN',{year:'numeric',month:'long',day:'numeric'}):type==='time'?now.toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit',hour12:false}):now.toLocaleDateString('zh-CN',{weekday:'long'});});};setInterval(clock,1000);clock();report();`;
  if (widget.scriptMode === "dom") {
    const library = new URL("vendor/echarts-5.4.3.min.js", document.baseURI).href;
    return `<!doctype html><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' ${new URL(library).origin}; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; form-action 'none'; base-uri 'none'"><style>body{margin:0;font:14px system-ui;color:#eef5ff}${widget.css.replace(/<\/style/gi,"< /style")}</style><div id="view"></div><script src="${library}"></script><script>const viewContext=${encode(viewContext)};let entity=${encode(entity || {state:"unavailable",attributes:{}})},entities=${encode(entities)};window.addEventListener("message",event=>{if(event.source!==parent || event.data?.type!=="ha3d-entities")return;entity=event.data.entity;entities=event.data.entities;window.dispatchEvent(new CustomEvent("ha3d-entities",{detail:{entity,entities}}));});document.getElementById('view').innerHTML=${encode(widget.html)};const run=document.createElement('script');run.textContent='(function(entity,entities){'+${encode(widget.js)}+'\\n})(entity,entities)';document.body.append(run);${lifecycle}</script>`;
  }
  const workerCode = `onmessage = async (event) => { try { const {entity,entities} = event.data; const result = await (async function(entity,widget,entities){${widget.js || "return entity;"}\n})(entity,${JSON.stringify({name:widget.name})},entities); postMessage({result}); } catch(e) { postMessage({error:String(e.message)}); } };`;
  return `<!doctype html><html><head><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' blob:; worker-src blob:; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; form-action 'none'; base-uri 'none'"><style>body{margin:0;font:14px system-ui;color:#eaf2ff;padding:12px;box-sizing:border-box}*{box-sizing:border-box}</style></head><body><div id="view"></div><script>
const html=${encode(widget.html)}, css=${encode(widget.css)}, input=${encode(entity || { state: "unavailable", attributes: {} })};
const view=document.getElementById('view');
function render(data){
 const doc=new DOMParser().parseFromString(html,'text/html');
 doc.querySelectorAll('script,iframe,object,embed,link,meta,base,form,style,svg,math').forEach(el=>el.remove());
 doc.querySelectorAll('*').forEach(el=>{for(const a of [...el.attributes]) if(!['class','style','title','role','aria-label','data-each','data-clock'].includes(a.name)) el.removeAttribute(a.name);});
 const resolve=(obj,key)=>key.split('.').reduce((v,k)=>v?.[k],obj);
 function fill(root,scope){const walk=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node;while(node=walk.nextNode())node.textContent=node.textContent.replace(/\\{\\{\\s*([\\w.]+)\\s*\\}\\}/g,(_,key)=>{const v=resolve(scope,key);return v==null?'--':typeof v==='object'?JSON.stringify(v):String(v);});}
 doc.querySelectorAll('[data-each]').forEach(el=>{const list=resolve(data,el.getAttribute('data-each'));for(const item of (Array.isArray(list)?list.slice(0,100):[])){const clone=el.cloneNode(true);clone.removeAttribute('data-each');fill(clone,item);el.before(clone);}el.remove();});
 const walk=document.createTreeWalker(doc.body,NodeFilter.SHOW_TEXT);let node;
 while(node=walk.nextNode())node.textContent=node.textContent.replace(/\\{\\{\\s*([\\w.]+)\\s*\\}\\}/g,(_,key)=>{let value=data;for(const part of key.split('.')) value=value?.[part];return value==null?'--':typeof value==='object'?JSON.stringify(value):String(value);});
 const style=document.createElement('style');style.textContent=css;view.replaceChildren(style,...doc.body.childNodes);
}
const worker=new Worker(URL.createObjectURL(new Blob([${encode(workerCode)}],{type:'text/javascript'})));
const timer=setTimeout(()=>{worker.terminate();view.textContent='控件脚本超时（1 秒）';},1000);
worker.onmessage=event=>{clearTimeout(timer);worker.terminate();if(event.data.error)view.textContent='脚本错误：'+event.data.error;else render(event.data.result);};
worker.onerror=()=>{clearTimeout(timer);worker.terminate();view.textContent='控件脚本执行失败';};worker.postMessage({entity:input,entities:${encode(entities)}});
${lifecycle}
</script></body></html>`;
}
export function WidgetRenderer({ widget, entityId, entityIds, entities = {}, presentation, theme = resolveDaylight(entities).theme }) {
  const binding = resolveSidebarEntities(widget, {entityId,entityIds}, entities);
  const boundId = binding.ids.join("|");
  const entity = binding.entities[0];
  const [detail,setDetail]=React.useState(null);
  const [naturalHeight,setNaturalHeight]=React.useState(120);
  const frame = React.useRef(null);
  React.useEffect(()=>{const listener=event=>{if(event.source===frame.current?.contentWindow && event.data?.type==='ha3d-widget-height' && Number.isFinite(event.data.height)){setNaturalHeight(Math.min(100000,Math.max(40,event.data.height)));return;}if(event.source===frame.current?.contentWindow && event.data?.type==='ha3d-open-detail' && !presentation){setDetail({expanded:true,section:String(event.data.section),accountId:String(event.data.accountId || '')});}};window.addEventListener('message',listener);return()=>window.removeEventListener('message',listener);},[presentation]);
  React.useEffect(()=>{if(!detail)return;const escape=e=>{if(e.key==='Escape')setDetail(null);};window.addEventListener('keydown',escape);return()=>window.removeEventListener('keydown',escape);},[detail]);
  const sendSnapshot = () => {frame.current?.contentWindow?.postMessage({type:"ha3d-theme",theme},"*");frame.current?.contentWindow?.postMessage({type:"ha3d-entities",entity:entitySnapshot(entity) || {state:"unavailable",attributes:{}},entities:binding.entities.map(entitySnapshot)},"*");};
  React.useEffect(() => {if(widget.scriptMode === "dom")sendSnapshot();}, [entity,entities,widget,theme]);
  const srcDoc = React.useMemo(
    () =>
      widget.kind === "custom"
        ? customDocument(widget, entitySnapshot(entity), binding.entities.map(entitySnapshot), {...presentation,theme,accountNames:widget.accountNames || {}})
        : "",
    [widget, boundId, presentation, widget.scriptMode === "dom" ? null : JSON.stringify(binding.entities)],
  );
  return (<>
    <div className="sb-widget-surface" data-theme={theme} data-expanded={presentation ? "true" : undefined}><iframe
      style={{height:naturalHeight, flex:"0 0 auto"}}
      scrolling="no"
      ref={frame}
      onLoad={sendSnapshot}
      className="sb-custom-frame"
      title={`控件：${widget.name}`}
      sandbox="allow-scripts"
      referrerPolicy="no-referrer"
      srcDoc={srcDoc}
    /></div>
    {detail && ReactDom.createPortal(<div className="sb-floating-backdrop" onClick={()=>setDetail(null)}><section className="sb-floating-detail" data-theme={theme} role="dialog" aria-modal="true" aria-label="能耗统计详情" onClick={e=>e.stopPropagation()}><header><strong>能耗统计详情</strong><button onClick={()=>setDetail(null)} aria-label="关闭能耗详情">×</button></header><WidgetRenderer widget={widget} entityId={entityId} entityIds={entityIds} entities={entities} presentation={detail} theme={theme} /></section></div>,document.body)}
  </>);
}
export function SidebarPanel({
  config,
  entities = {},
  title = "3D智家",
  pageId,
  onPageChange,
  selectedItemId,
  onSelectItem,
  designer = false,
  collapsed = false,
  onToggleCollapse,
  theme,
}) {
  const contentId = React.useId();
  const [localPage, setLocalPage] = React.useState(config.pages[0]?.id);
  const page =
    config.pages.find((p) => p.id === (pageId ?? localPage)) || config.pages[0];
  const [dragged, setDragged] = React.useState(null);
  return (
    <section
      className={`sb-panel ${(theme ?? resolveDaylight(entities).theme) === "night" ? "sb-night" : ""} ${designer ? "sb-design-preview" : ""} ${collapsed ? "sb-content-collapsed" : ""}`}
      style={{ "--sb-width": `${config.width}px` }}
      aria-label="自定义侧边栏"
    >
      <div id={contentId} className="sb-panel-content" hidden={collapsed}>
        <div className="sb-widget-stack">
          {page?.items.map((item) => {
            const widget = config.widgets.find((w) => w.id === item.widgetId);
            return (
              widget && (
                <div
                  key={item.id}
                  className={`sb-widget-instance ${selectedItemId === item.id ? "selected" : ""}`}
                  onClick={designer ? () => onSelectItem?.(item.id) : undefined}
                  draggable={designer}
                  onDragStart={
                    designer
                      ? (e) => {
                          setDragged(item.id);
                          e.dataTransfer.setData("text/plain", item.id);
                        }
                      : undefined
                  }
                  onDragOver={designer ? (e) => e.preventDefault() : undefined}
                  onDrop={
                    designer
                      ? (e) => {
                          e.preventDefault();
                          onSelectItem?.(item.id, dragged);
                          setDragged(null);
                        }
                      : undefined
                  }
                >
                  <WidgetRenderer
                    widget={widget}
                    entityId={item.entityId}
                    entityIds={item.entityIds}
                    entities={entities}
                    theme={theme ?? resolveDaylight(entities).theme}
                  />
                </div>
              )
            );
          })}
          {!page?.items.length && <p className="sb-empty">此页尚未放置控件</p>}
        </div>
      </div>
      <nav className="sb-navigation" aria-label="侧边栏导航">
        <div className="sb-navigation-pages">
        {config.pages.map((p) => (
          <button
            key={p.id}
            title={p.name}
            aria-label={p.name}
            aria-current={page?.id === p.id ? "page" : undefined}
            className={page?.id === p.id ? "active" : ""}
            onClick={() => {
              setLocalPage(p.id);
              onPageChange?.(p.id);
            }}
          >
            <span style={{color:p.color || "#f7c95d"}}>{p.icon.replace(/\ufe0f/g, "")}︎</span>
            <small>{p.name}</small>
          </button>
        ))}
        </div>
        <button className="sb-rail-toggle" title={collapsed ? "展开侧栏" : "收起侧栏"} aria-label={collapsed ? "展开侧栏" : "收起侧栏"} aria-controls={contentId} aria-expanded={!collapsed} disabled={!onToggleCollapse} onClick={onToggleCollapse}><span aria-hidden="true">{collapsed ? "›" : "‹"}</span><small>{collapsed ? "展开" : "收起"}</small></button>
      </nav>
    </section>
  );
}
export function PublishedSidebar({
  projectId,
  entities,
  title,
  refreshKey,
  onWidthChange,
  onCollapsedChange,
  theme,
}) {
  const [config, setConfig] = React.useState(defaultSidebar);
  const [collapsed, setCollapsed] = React.useState(() => {try {return localStorage.getItem("ha3d.sidebar.collapsed") === "1";} catch {return false;}});
  React.useEffect(() => {onCollapsedChange?.(collapsed);}, [collapsed, onCollapsedChange]);
  const toggleCollapsed = (next = !collapsed) => {setCollapsed(next);try {localStorage.setItem("ha3d.sidebar.collapsed", next ? "1" : "0");} catch {}};
  const [error, setError] = React.useState("");
  React.useEffect(() => {
    let active = true;
    setConfig(defaultSidebar());
    onWidthChange?.(380);
    sidebarApi(projectId)
      .then((value) => {
        if (active) {
          setConfig(value.published);
          onWidthChange?.(value.published.width);
          setError("");
        }
      })
      .catch(() => {
        if (active) setError("侧边栏配置暂时无法读取，正在显示默认天气");
      });
    return () => {
      active = false;
    };
  }, [projectId, refreshKey, onWidthChange]);
  return (
    <aside
      className={`sb-home-container ${collapsed ? "is-collapsed" : ""}`}
      style={{ "--sb-home-width": `${config.width}px` }}
    >
      {error && (
        <p role="status" className="sb-load-error">
          {error}
        </p>
      )}
      <div id="home-sidebar-panel" className="sb-home-panel">
        <SidebarPanel config={config} entities={entities} title={title} theme={theme} collapsed={collapsed} onToggleCollapse={() => toggleCollapsed()} onPageChange={() => {if(collapsed)toggleCollapsed(false);}} />
      </div>
      {!collapsed && <a className="sb-skill-download" href="agent-skills/ha3d-sidebar-widget-design.zip" download>下载侧边栏控件设计 Skill</a>}
    </aside>
  );
}
