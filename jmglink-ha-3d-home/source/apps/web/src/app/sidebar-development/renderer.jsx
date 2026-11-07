import { createWidgetPictureCache } from "./widget-images.js";
import { nearestSidebarEdge } from "../../domain/home-preferences.js";
import { sidebarFloorOptions, emptyFloorSidebar, SIDEBAR_OVERVIEW_ID } from "../../../../../packages/schema/src/sidebar-floors.js";
import { widgetSdkSource } from "./widget-sdk.js";
import { resolveSidebarEntities } from "../../../../../packages/schema/src/sidebar-bindings.js";
import { r as getReactDom } from "../../vendor/three.js";
const ReactDom = getReactDom();
import { resolveDaylight } from "../../../../../packages/schema/src/daylight.js";
import { a as React } from "../../vendor/react.js";
import { defaultSidebar } from "../../../../../packages/schema/src/sidebar.js";
import "./sidebar.css";

export async function sidebarApi(projectId, action, body, floorId) {
  const response = await fetch(
    `api/sidebar/${encodeURIComponent(projectId)}${action ? `/${action}` : ""}${floorId ? `?floorId=${encodeURIComponent(floorId)}` : ""}`,
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
function applyTheme(theme){rootStyle.textContent=':root{--widget-text:'+(theme==='day'?'#f5f9ff':'#14283f')+';--widget-muted:'+(theme==='day'?'#dbe9f1':'#31485e')+';--widget-line:'+(theme==='day'?'#e6f4ff40':'#ffffff70')+';--widget-scene-fill:'+(theme==='day'?'rgba(57,94,116,.82)':'rgba(223,227,232,.88)')+';--widget-scene-hover:'+(theme==='day'?'rgba(57,94,116,.94)':'rgba(236,240,244,.96)')+';--widget-scene-play:'+(theme==='day'?'#eaf6fd':'#31485e')+'}html,body,#view{background:transparent!important;box-shadow:none!important;border:0;filter:none}body{color:var(--widget-text);margin:0;overflow:hidden}';}
applyTheme(${encode(viewContext.theme || 'day')});
window.addEventListener('message',event=>{if(event.source===parent && event.data?.type==='ha3d-theme')applyTheme(event.data.theme);});
let lastHeight=0;const report=()=>{const view=document.getElementById('view');if(!view)return;const h=Math.ceil(view.getBoundingClientRect().height+parseFloat(getComputedStyle(document.body).paddingTop||0)+parseFloat(getComputedStyle(document.body).paddingBottom||0));if(h>0 && h!==lastHeight){lastHeight=h;parent.postMessage({type:'ha3d-widget-height',height:h},'*');}};
new ResizeObserver(report).observe(document.getElementById('view'));new MutationObserver(report).observe(document.getElementById('view'),{childList:true,subtree:true,characterData:true});
const clock=()=>{const now=new Date();document.querySelectorAll('[data-clock]').forEach(el=>{const type=el.getAttribute('data-clock');el.textContent=type==='date'?now.toLocaleDateString('zh-CN',{year:'numeric',month:'long',day:'numeric'}):type==='time'?now.toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit',hour12:false}):now.toLocaleDateString('zh-CN',{weekday:'long'});});};setInterval(clock,1000);clock();report();`;
  if (widget.scriptMode === "dom") {
    const library = new URL("vendor/echarts-5.4.3.min.js", document.baseURI).href;
    return `<!doctype html><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' ${new URL(library).origin}; style-src 'unsafe-inline'; img-src data: ${new URL(library).origin}; connect-src 'none'; form-action 'none'; base-uri 'none'"><style>body{margin:0;font:14px system-ui;color:#eef5ff}${widget.css.replace(/<\/style/gi,"< /style")}</style><div id="view"></div><script src="${library}"></script><script>const viewContext=${encode(viewContext)};let entity=${encode(entity || {state:"unavailable",attributes:{}})},entities=${encode(entities)};window.addEventListener("message",event=>{if(event.source!==parent || event.data?.type!=="ha3d-entities")return;entity=event.data.entity;entities=event.data.entities;window.dispatchEvent(new CustomEvent("ha3d-entities",{detail:{entity,entities}}));});${widgetSdkSource}document.getElementById('view').innerHTML=${encode(widget.html)};const run=document.createElement('script');run.textContent='(function(entity,entities){'+${encode(widget.js)}+'\\n})(entity,entities)';document.body.append(run);${lifecycle}</script>`;
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
export function WidgetRenderer({ widget, entityId, entityIds, entities = {}, bindingContext = {}, presentation, theme = resolveDaylight(entities).theme }) {
  const binding = resolveSidebarEntities(widget, {entityId,entityIds}, entities);
  const boundId = binding.ids.join("|");
  const entity = binding.entities[0];
  React.useEffect(()=>{const handle=async event=>{
    if(event.source!==frame.current?.contentWindow || event.data?.type!=="ha3d-service")return;
    const {requestId,actionId,domain,service,entityId:target,data}=event.data;
    try{if(target && !binding.ids.includes(target))throw new Error("此实体未绑定到当前控件");
      const response=await fetch('api/sidebar-services/action',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...bindingContext,widgetId:widget.id,actionId,domain,service,entityId:target,data})});
      const result=await response.json();if(!response.ok)throw new Error(result.error||"操作失败");
      event.source.postMessage({type:'ha3d-service-result',requestId,ok:true},'*');
    }catch(error){event.source.postMessage({type:'ha3d-service-result',requestId,error:error.message},'*');}
  };window.addEventListener('message',handle);return()=>window.removeEventListener('message',handle);},[boundId,widget.id,JSON.stringify(bindingContext)]);
  const [detail,setDetail]=React.useState(null);
  const [naturalHeight,setNaturalHeight]=React.useState(120);
  const frame = React.useRef(null);
  const pictureCache=React.useRef(null);if(!pictureCache.current)pictureCache.current=createWidgetPictureCache();
  const snapshotState=React.useRef(null);snapshotState.current={entity,entities:binding.entities,theme};
  React.useEffect(()=>{const listener=event=>{if(event.source===frame.current?.contentWindow && event.data?.type==='ha3d-widget-height' && Number.isFinite(event.data.height)){setNaturalHeight(Math.min(100000,Math.max(40,event.data.height)));return;}if(event.source===frame.current?.contentWindow && event.data?.type==='ha3d-open-detail' && !presentation){setDetail({expanded:true,section:String(event.data.section),accountId:String(event.data.accountId || '')});}};window.addEventListener('message',listener);return()=>window.removeEventListener('message',listener);},[presentation]);
  React.useEffect(()=>{if(!detail)return;const escape=e=>{if(e.key==='Escape')setDetail(null);};window.addEventListener('keydown',escape);return()=>window.removeEventListener('keydown',escape);},[detail]);
  const sendSnapshot = () => {
    const target=frame.current?.contentWindow;if(!target)return;
    const push=()=>{if(frame.current?.contentWindow!==target)return;const state=snapshotState.current;const snap=e=>{if(!e)return;const data=entitySnapshot(e),picture=pictureCache.current.read(e);return {...data,pictureData:picture,attributes:picture?{...data.attributes,entity_picture:picture}:data.attributes};};target.postMessage({type:"ha3d-theme",theme:state.theme},"*");target.postMessage({type:"ha3d-entities",entity:snap(state.entity)||{state:"unavailable",attributes:{}},entities:state.entities.map(snap)},"*");};
    push();Promise.all(snapshotState.current.entities.map(e=>pictureCache.current.load(e))).then(push);
  };
  React.useEffect(() => {sendSnapshot();}, [entity,entities,widget,theme]);
  const srcDoc = React.useMemo(
    () =>
      widget.kind === "custom"
        ? customDocument(widget, entitySnapshot(entity), binding.entities.map(entitySnapshot), {...presentation,assetBase:new URL("./",document.baseURI).href,theme,accountNames:widget.accountNames || {}})
        : "",
    [widget, boundId, presentation, widget.scriptMode === "dom" ? null : JSON.stringify(binding.entities)],
  );
  return (<>
    <div className="sb-widget-surface" data-widget-id={widget.id} data-theme={theme} data-expanded={presentation ? "true" : undefined}><iframe
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
    {detail && ReactDom.createPortal(<div className="sb-floating-backdrop" onClick={()=>setDetail(null)}><section className="sb-floating-detail" data-theme={theme} role="dialog" aria-modal="true" aria-label={`${widget.name}详情`} onClick={e=>e.stopPropagation()}><header><strong>{widget.name}详情</strong><button onClick={()=>setDetail(null)} aria-label="关闭详情">×</button></header><WidgetRenderer widget={widget} entityId={entityId} entityIds={entityIds} entities={entities} bindingContext={bindingContext} presentation={detail} theme={theme} /></section></div>,document.body)}
  </>);
}
export function SidebarPanel({
  config,
  projectId,
  workspace = "draft",
  floorId,
  entities = {},
  title = "3D智家",
  pageId,
  onPageChange,
  onReorderPages,
  selectedItemId,
  revealItemId,
  onSelectItem,
  designer = false,
  collapsed = false,
  onToggleCollapse,
  dock = "left",
  theme,
}) {
  const expandAngle = { left: 0, right: 180, top: 90, bottom: -90 }[dock];
  const contentId = React.useId();
  const contentRef=React.useRef(null),itemElements=React.useRef(new Map());
  React.useEffect(()=>{
    if(!designer||!revealItemId)return;
    const element=itemElements.current.get(revealItemId),container=contentRef.current;if(!element||!container)return;
    let stopped=false;
    const reveal=()=>{if(stopped)return;const top=element.getBoundingClientRect().top-container.getBoundingClientRect().top+container.scrollTop-8;container.scrollTo({top:Math.max(0,top),behavior:'smooth'});};
    element.focus({preventScroll:true});const frame=requestAnimationFrame(reveal);
    const observer=new ResizeObserver(reveal);observer.observe(element);observer.observe(container);
    const stop=()=>{stopped=true;observer.disconnect();};
    container.addEventListener('wheel',stop,{passive:true});container.addEventListener('pointerdown',stop);
    const timeout=setTimeout(stop,1800);
    return()=>{stop();clearTimeout(timeout);cancelAnimationFrame(frame);container.removeEventListener('wheel',stop);container.removeEventListener('pointerdown',stop);};
  },[revealItemId,designer]);
  const [localPage, setLocalPage] = React.useState(config.pages[0]?.id);
  const page =
    config.pages.find((p) => p.id === (pageId ?? localPage)) || config.pages[0];
  const [dragged, setDragged] = React.useState(null);
  const navigationDrag=React.useRef(null), navigationClickSuppressed=React.useRef(false);
  return (
    <section
      className={`sb-panel ${(theme ?? resolveDaylight(entities).theme) === "night" ? "sb-night" : ""} ${designer ? "sb-design-preview" : ""} ${collapsed ? "sb-content-collapsed" : ""}`}
      data-page-id={page?.id}
      style={{ "--sb-width": `${config.width}px` }}
      aria-label="自定义侧边栏"
    >
      <div ref={contentRef} id={contentId} className="sb-panel-content" hidden={collapsed}>
        <div className="sb-widget-stack">
          {page?.items.filter(item=>designer||!item.hidden).map((item) => {
            const widget = config.widgets.find((w) => w.id === item.widgetId);
            return (
              widget && (
                <div
                  key={item.id}
                  ref={element=>{if(element)itemElements.current.set(item.id,element);else itemElements.current.delete(item.id);}}
                  tabIndex={designer?-1:undefined}
                  aria-label={designer?`控件实例 ${widget.name}`:undefined}
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
                    bindingContext={{projectId,workspace,floorId,pageId:page.id,itemId:item.id}}
                    entities={entities}
                    theme={theme ?? resolveDaylight(entities).theme}
                  />
                </div>
              )
            );
          })}
          {!page?.items.length && <p className="sb-empty">{config.widgets.length ? "此页尚未放置控件" : "此楼层尚未设计侧边栏，可在开发中心添加控件"}</p>}
        </div>
      </div>
      <nav className="sb-navigation" aria-label="侧边栏导航">
        <div className="sb-navigation-pages">
        {config.pages.map((p) => (
          <button
            key={p.id}
            title={designer ? `${p.name} · 拖动调整导航顺序` : p.name}
            data-navigation-id={p.id}
            style={designer&&onReorderPages?{touchAction:'none'}:undefined}
            onPointerDown={designer&&onReorderPages?event=>{if(event.button!==0)return;navigationDrag.current={id:p.id,x:event.clientX,y:event.clientY};event.currentTarget.setPointerCapture(event.pointerId);}:undefined}
            onPointerUp={designer&&onReorderPages?event=>{const drag=navigationDrag.current;navigationDrag.current=null;if(!drag||Math.hypot(event.clientX-drag.x,event.clientY-drag.y)<6)return;const target=document.elementFromPoint(event.clientX,event.clientY)?.closest('[data-navigation-id]');if(target&&event.currentTarget.parentElement.contains(target)){onReorderPages(drag.id,target.dataset.navigationId);navigationClickSuppressed.current=true;setTimeout(()=>navigationClickSuppressed.current=false,0);}}:undefined}
            onPointerCancel={()=>navigationDrag.current=null}
            aria-label={p.name}
            aria-current={page?.id === p.id ? "page" : undefined}
            className={page?.id === p.id ? "active" : ""}
            onClick={() => {
              if(navigationClickSuppressed.current)return;
              setLocalPage(p.id);
              onPageChange?.(p.id);
            }}
          >
            <span style={{color:p.color || "#f7c95d"}}>{p.icon.replace(/\ufe0f/g, "")}︎</span>
            <small>{p.name}</small>
          </button>
        ))}
        </div>
        <button className="sb-rail-toggle" title={collapsed ? "展开侧栏" : "收起侧栏"} aria-label={collapsed ? "展开侧栏" : "收起侧栏"} aria-controls={contentId} aria-expanded={!collapsed} disabled={!onToggleCollapse} onClick={onToggleCollapse}>
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 16 16" style={{transform: `rotate(${expandAngle + (collapsed ? 0 : 180)}deg)`}}>
            <path d="m6 3 5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <small>{collapsed ? "展开" : "收起"}</small>
        </button>
      </nav>
    </section>
  );
}
export function PublishedSidebar({
  showAllFloors = false,
  onShowAllFloors,
  hidden = false,
  projectId,
  floors = [],
  floorId,
  onFloorChange,
  entities,
  title,
  refreshKey,
  onWidthChange,
  onCollapsedChange,
  theme,
  dock = "left",
  onDockChange,
}) {
  const dragStart = React.useRef(null);
  const suppressDockClick = React.useRef(false);
  const dockRef = React.useRef(null);
  const [dropEdge, setDropEdge] = React.useState(null);
  const horizontal = dock === "top" || dock === "bottom";
  React.useLayoutEffect(() => {
    const rails = dockRef.current.querySelectorAll(".sb-floor-options, .sb-navigation-pages");
    const update = () => {
      for (const rail of rails) {
        const scrollable = horizontal
          ? rail.scrollWidth > rail.clientWidth
          : rail.scrollHeight > rail.clientHeight;
        rail.dataset.dockScroll = scrollable ? (horizontal ? "horizontal" : "vertical") : "none";
      }
    };
    const observer = new ResizeObserver(update);
    for (const rail of rails) {
      observer.observe(rail);
      for (const button of rail.children) observer.observe(button);
    }
    update();
    return () => observer.disconnect();
  });
  const stopDrag = () => { dragStart.current = null; setDropEdge(null); };
  const edgeAt = event => nearestSidebarEdge(event.clientX, event.clientY, window.innerWidth, window.innerHeight);
  const beginDockDrag = event => {
    if (event.button !== 0 || !event.isPrimary) return;
    suppressDockClick.current = false;
    const control = event.target.closest("button, a, input, select, textarea, iframe, [contenteditable], .sb-widget-instance");
    const railButton = control?.matches("[data-dock-scroll='none'] > button");
    if (control && !railButton) return;
    if (!control && event.pointerType === "mouse") event.preventDefault();
    dragStart.current = { x: event.clientX, y: event.clientY, pointerId: event.pointerId };
    (control ?? event.currentTarget).setPointerCapture(event.pointerId);
  };
  const moveDockDrag = event => {
    const start = dragStart.current;
    if (start?.pointerId === event.pointerId && Math.hypot(event.clientX - start.x, event.clientY - start.y) >= 8) {
      setDropEdge(edgeAt(event));
    }
  };
  const endDockDrag = event => {
    const start = dragStart.current;
    if (start?.pointerId !== event.pointerId) return;
    stopDrag();
    if (Math.hypot(event.clientX - start.x, event.clientY - start.y) >= 8) {
      suppressDockClick.current = true;
      onDockChange?.(edgeAt(event));
    }
  };
  const floorOptions = sidebarFloorOptions(floors);
  const activeFloorId = showAllFloors ? SIDEBAR_OVERVIEW_ID : floorOptions.some(f => f.id === floorId) ? floorId : floorOptions[0]?.id;
  const initialConfig = () => activeFloorId && activeFloorId !== floors[0]?.id ? emptyFloorSidebar() : defaultSidebar();
  const [config, setConfig] = React.useState(initialConfig);
  const [collapsed, setCollapsed] = React.useState(() => {try {return localStorage.getItem("ha3d.sidebar.collapsed") === "1";} catch {return false;}});
  React.useEffect(() => {onCollapsedChange?.(collapsed);}, [collapsed, onCollapsedChange]);
  const toggleCollapsed = (next = !collapsed) => {setCollapsed(next);try {localStorage.setItem("ha3d.sidebar.collapsed", next ? "1" : "0");} catch {}};
  const [error, setError] = React.useState("");
  React.useEffect(() => {
    let active = true;
    setConfig(initialConfig());
    onWidthChange?.(380);
    sidebarApi(projectId, undefined, undefined, activeFloorId)
      .then((value) => {
        if (active) {
          setConfig(value.published);
          onWidthChange?.(value.published.width);
          setError("");
        }
      })
      .catch(() => {
        if (active) setError("此楼层侧边栏暂时无法读取，请重试");
      });
    return () => {
      active = false;
    };
  }, [projectId, activeFloorId, refreshKey, onWidthChange]);
  return (
    <>
    <aside
      ref={dockRef}
      id="home-sidebar-shell"
      hidden={hidden}
      className={`sb-home-container dock-${dock} ${horizontal ? "dock-horizontal" : ""} ${floorOptions.length > 1 ? "has-floor-rail" : ""} ${collapsed ? "is-collapsed" : ""}`}
      style={{ "--sb-home-width": `${config.width}px` }}
      onPointerDown={beginDockDrag}
      onPointerMove={moveDockDrag}
      onPointerUp={endDockDrag}
      onPointerCancel={stopDrag}
      onLostPointerCapture={stopDrag}
      onClickCapture={event => {
        if (event.detail && suppressDockClick.current) {
          event.preventDefault();
          event.stopPropagation();
        }
      }}
    >
      {dropEdge && <div className={`sb-dock-target edge-${dropEdge}`} aria-hidden="true" />}
      {floorOptions.length > 1 && <nav className="sb-floor-rail" aria-label="楼层选择"><div className="sb-floor-options">{[...floorOptions].reverse().map(floor => <button key={floor.id} aria-label={`切换楼层 ${floor.label} ${floor.name}`} aria-current={!showAllFloors && floor.id === activeFloorId ? "true" : undefined} title={floor.name} onClick={() => {if(showAllFloors || floor.id !== activeFloorId)onFloorChange?.(floor.id);}}>{floor.label}</button>)}{onShowAllFloors && <button aria-label="全部楼层堆叠总览" aria-current={showAllFloors ? "true" : undefined} title="全部楼层堆叠总览" onClick={onShowAllFloors}>ALL</button>}</div></nav>}
      {error && (
        <p role="status" className="sb-load-error">
          {error}
        </p>
      )}
      <div id="home-sidebar-panel" className="sb-home-panel">
        <div className="sb-dock-surface" aria-hidden="true" title="拖动侧栏到屏幕边缘" />
        <SidebarPanel key={activeFloorId} floorId={activeFloorId} config={config} projectId={projectId} workspace="published" entities={entities} title={title} theme={theme} dock={dock} collapsed={collapsed} onToggleCollapse={() => toggleCollapsed()} onPageChange={() => {if(collapsed)toggleCollapsed(false);}} />
      </div>
      {!collapsed && <a className="sb-skill-download" href="agent-skills/ha3d-mcp-workflow.zip" download>下载 Home3D MCP 使用 Skill v1.0</a>}
    </aside>

    </>
  );
}

export function SidebarVisibilityToggle({hidden,onToggleVisibility}) {
  return (    <button
      type="button"
      className="home-sidebar-toggle"
      aria-label={hidden ? "显示侧边栏和楼层选择" : "收起整个侧边栏和楼层选择"}
      title={hidden ? "显示侧边栏" : "收起整个侧边栏"}
      aria-expanded={!hidden}
      aria-controls="home-sidebar-shell"
      onClick={onToggleVisibility}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M9 4v16"/>{hidden ? <path d="m13 9 3 3-3 3"/> : <path d="m16 9-3 3 3 3"/>}</svg>
    </button>
  );
}
