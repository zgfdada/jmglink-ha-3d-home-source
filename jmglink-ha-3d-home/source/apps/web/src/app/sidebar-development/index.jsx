import {reorderSidebarPages} from "../../../../../packages/schema/src/sidebar-order.js";
import CodeEditor from "./code-editor.jsx";
import { exportSidebarPart, importSidebarPart } from "../../../../../packages/schema/src/sidebar-transfer.js";
import { sidebarFloorOptions, SIDEBAR_OVERVIEW_ID } from "../../../../../packages/schema/src/sidebar-floors.js";
import { ActionEditor } from "./action-editor.jsx";
import { resolveSidebarEntities, sidebarEntityName } from "../../../../../packages/schema/src/sidebar-bindings.js";
import { a as React } from "../../vendor/react.js";
import {
  SidebarPanel,
  WidgetRenderer,
  sidebarApi,
  entitySnapshot,
} from "./renderer.jsx";
import {
  defaultSidebar,
  normalizeSidebar,
} from "../../../../../packages/schema/src/sidebar.js";

const uid = (prefix) =>
  `${prefix}-${globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`}`;
const customWidget = () => ({
  id: uid("widget"),
  name: "新实体卡片",
  kind: "custom",
  scriptMode: "dom",
  actions: [],
  entityId: "",
  html: '<article class="card"><small id="name"></small><h2 id="value"></h2><p id="unit"></p></article>',
  css: ".card { padding:20px; border-radius:18px; background:linear-gradient(135deg,#3d627e,#263b58); } h2 { font-size:36px; margin:14px 0; }",
  js: "// ha 提供绑定实体与通用 HA 交互接口。\nfunction render(){const e=ha.entity||{};document.getElementById('name').textContent=e.name||'未绑定';document.getElementById('value').textContent=e.state||'--';document.getElementById('unit').textContent=e.attributes?.unit_of_measurement||'';}\nrender();ha.onStateChange(render);",
});

function EntityPicker({entities, widget, override, onChange, emptyLabel}) {
  const [query,setQuery] = React.useState("");
  const [open,setOpen] = React.useState(false);
  const binding = resolveSidebarEntities(widget,override,entities);
  const term=query.trim().toLocaleLowerCase();
  const matches=Object.values(entities).filter(e=>`${sidebarEntityName(e,widget)} ${e.name||""} ${e.attributes?.friendly_name||""} ${e.entityId}`.toLocaleLowerCase().includes(term));
  const toggle=id=>onChange(binding.ids.includes(id)?binding.ids.filter(v=>v!==id):[...binding.ids,id]);
  return <div className="sb-entity-picker">
    <input type="search" aria-label="搜索实体名称或 ID" placeholder="输入名称或实体 ID 的任意片段" value={query} onChange={e=>{setQuery(e.target.value);setOpen(true);}} />
    <button type="button" aria-expanded={open} onClick={()=>setOpen(!open)}>选择实体（{binding.ids.length}）{open?" ▴":" ▾"}</button>
    {open && <div className="sb-entity-options" role="group" aria-label="实体多选列表">
      <div className="sb-entity-actions">
        <button type="button" onClick={()=>onChange(null)}>{emptyLabel}</button>
        <button type="button" onClick={()=>onChange([])}>清空绑定</button>
        <small>匹配 {matches.length} 个实体{matches.length>100?"，显示前 100 个，请搜索缩小范围":""}</small>
      </div>
      <div className="sb-entity-grid">
        {matches.slice(0,100).map(e=><label key={e.entityId}><input type="checkbox" checked={binding.ids.includes(e.entityId)} onChange={()=>toggle(e.entityId)}/><span>{sidebarEntityName(e,widget)}<small>{e.entityId}</small></span></label>)}
      </div>
    </div>}
    <div className="sb-effective-entities" aria-live="polite"><strong>实际生效实体 · {binding.source}（{binding.entities.length}）</strong>
      {binding.entities.map(e=><div key={e.entityId}>{sidebarEntityName(e,widget)}<small>{e.entityId}</small></div>)}
      {binding.missing.map(id=><div key={id}>{id}（实体不存在或尚未同步）</div>)}
      {!binding.ids.length && <small>当前没有生效实体</small>}
    </div>
  </div>;
}

function EntityProperties({entity}) {
  const [query,setQuery]=React.useState(''),[mode,setMode]=React.useState('tree'),[copied,setCopied]=React.useState('');
  const snapshot=entity?entitySnapshot(entity):null;
  const rows=[];
  function walk(value,path=''){if(value && typeof value==='object'){for(const [key,item] of Object.entries(value))walk(item,path?`${path}.${key}`:key);}else rows.push({path,value:String(value??'null')});}
  if(snapshot)walk(snapshot);
  const term=query.trim().toLocaleLowerCase(),matches=rows.filter(row=>`${row.path} ${row.value}`.toLocaleLowerCase().includes(term));
  return <section className="sb-properties"><h2>实体属性</h2><input type="search" aria-label="搜索实体属性" placeholder="搜索属性名称、路径或值" value={query} onChange={e=>setQuery(e.target.value)}/><div className="sb-properties-tools"><button className={mode==='tree'?'active':''} onClick={()=>setMode('tree')}>属性索引</button><button className={mode==='json'?'active':''} onClick={()=>setMode('json')}>JSON</button><small>{matches.length} 项</small></div>{!snapshot?<p>请选择实体</p>:mode==='json'?<pre>{JSON.stringify(term?Object.fromEntries(matches.map(r=>[r.path,r.value])):snapshot,null,2)}</pre>:<div className="sb-property-list">{matches.map(row=><div className="sb-property-row" key={row.path}><code title={row.path}>{row.path}</code><span>{row.value}</span><button aria-label={`复制路径 ${row.path}`} onClick={async()=>{try{await navigator.clipboard.writeText(row.path);setCopied(row.path);}catch{setCopied('复制失败，请手动选择路径');}}}>复制</button></div>)}{!matches.length&&<p>没有匹配的属性</p>}</div>}<small role="status">{copied&&`已复制：${copied}`}</small></section>;
}

export default function SidebarDevelopmentCenter({
  project,
  initialFloorId,
  entities = {},
  onClose,
}) {
  const floors = sidebarFloorOptions(project.floors);
  const workspaces = [...floors].reverse();
  if (floors.length > 1) workspaces.push({ id: SIDEBAR_OVERVIEW_ID, label: "ALL", name: "多楼层总览" });
  const [floorId,setFloorId] = React.useState(workspaces.some(floor=>floor.id===initialFloorId) ? initialFloorId : project.floors?.[0]?.id);
  const [workspace, setWorkspace] = React.useState(null),
    [deleteTarget,setDeleteTarget]=React.useState(null),
    [draft, setDraft] = React.useState(defaultSidebar),
    [tab, setTab] = React.useState("widgets"),
    [widgetId, setWidgetId] = React.useState("weather"),
    [pageId, setPageId] = React.useState("home"),
    [itemId, setItemId] = React.useState(null),
    [revealItemId,setRevealItemId]=React.useState(null),
    [sourceTab, setSourceTab] = React.useState("html"),
    [busy, setBusy] = React.useState(false),
    [message, setMessage] = React.useState(""),
    [preview, setPreview] = React.useState(false),
    [search, setSearch] = React.useState(""),
    [widgetSection,setWidgetSection]=React.useState("settings"),
    [widgetSearch,setWidgetSearch]=React.useState(""),
    [previewTheme,setPreviewTheme]=React.useState("day"),
    [previewDevice,setPreviewDevice]=React.useState("desktop"),
    [inspectorTab,setInspectorTab]=React.useState("widget"),
    [pageSearch,setPageSearch]=React.useState(""),
    [addSearch,setAddSearch]=React.useState(""),
    [draggedNav,setDraggedNav]=React.useState(null),
    [previewWidth,setPreviewWidth]=React.useState(380);
  const importKind = React.useRef("widget");
  const chooseImport=kind=>{importKind.current=kind;file.current.click();};
  const editorActions = React.useRef(null);
  const saved = React.useRef(""),
    file = React.useRef(null),
    dialog = React.useRef(null);
  React.useEffect(() => {
    const previous = document.activeElement;
    dialog.current?.focus();
    return () => previous?.focus?.();
  }, []);
  const dirty = workspace && JSON.stringify(draft) !== saved.current;
  const load = React.useCallback(async () => {
    setBusy(true);
    try {
      const data = await sidebarApi(project.id, undefined, undefined, floorId);
      setWidgetId(data.draft.widgets[0]?.id || "weather");
      setPageId(data.draft.pages[0]?.id || "home");
      setItemId(null);
      setWorkspace(data);
      setDraft(data.draft);
      saved.current = JSON.stringify(data.draft);
      setMessage("");
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }, [project.id, floorId]);
  React.useEffect(() => {
    load();
  }, [load]);
  React.useEffect(() => {
    const handler = (e) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);
  const change = (fn) =>
    setDraft((old) => {
      const next = structuredClone(old);
      fn(next);
      return next;
    });
  const widget =
    draft.widgets.find((w) => w.id === widgetId) || draft.widgets[0];
  const page = draft.pages.find((p) => p.id === pageId) || draft.pages[0];
  const item = page?.items.find((i) => i.id === itemId);
  const selectedWidget = tab === "widgets" ? widget : draft.widgets.find(w => w.id === item?.widgetId);
  const effectiveBinding = resolveSidebarEntities(selectedWidget, tab === "widgets" ? {} : item, entities);
  const selectedEntity = effectiveBinding.entities[0];
  const patchWidget = (key, value) =>
    change((d) => {
      d.widgets.find((w) => w.id === widget.id)[key] = value;
    });
  const patchPage = (key, value) =>
    change((d) => {
      d.pages.find((p) => p.id === page.id)[key] = value;
    });
  const patchItem = (key, value) =>
    change((d) => {
      d.pages.find((p) => p.id === page.id).items.find((i) => i.id === item.id)[
        key
      ] = value;
    });
  const save = async (publish) => {
    setBusy(true);
    setMessage("");
    try {
      const normalized = normalizeSidebar(draft);
      const result = await sidebarApi(
        project.id,
        publish ? "publish" : "draft",
        { revision: workspace.revision, draft: normalized },
        floorId,
      );
      setWorkspace(result);
      setDraft(result.draft);
      saved.current = JSON.stringify(result.draft);
      setMessage(
        publish
          ? "已发布，返回主页即可查看。其他终端刷新后生效。"
          : "草稿已保存，主页保持当前已发布版本。",
      );
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  };
  const close = () => {
    if (
      !dirty ||
      window.confirm("还有未保存的修改，确定放弃并返回主页吗？")
    )
      onClose();
  };

  const entitySelect = () => <EntityPicker key={`${tab}-${widget?.id}-${item?.id}`} entities={entities} widget={selectedWidget} override={tab === "widgets" ? {} : item} emptyLabel={tab === "widgets" ? "恢复自动选择" : "跟随控件默认绑定"} onChange={ids=>change(d=>{
    const target=tab === "widgets" ? d.widgets.find(w=>w.id===widget.id) : d.pages.find(p=>p.id===page.id).items.find(i=>i.id===item.id);
    target.entityIds=ids;target.entityId="";
  })}/>;
  const addItem = (id) => {
    const next = uid("item");
    change((d) =>
      d.pages
        .find((p) => p.id === page.id)
        .items.push({ id: next, widgetId: id, entityId: "", height: 280 }),
    );
    setItemId(next);setInspectorTab('widget');setPreview(false);setRevealItemId(next);
  };
  const moveItem = (direction) =>
    change((d) => {
      const items = d.pages.find((p) => p.id === page.id).items;
      const i = items.findIndex((v) => v.id === itemId),
        j = i + direction;
      if (i >= 0 && j >= 0 && j < items.length)
        [items[i], items[j]] = [items[j], items[i]];
    });
  const exportFile = (kind="sidebar", id) => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(exportSidebarPart(draft, kind, id), null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `3dhome-${kind}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const TransferMenu = tab === "widgets" ? "details" : "div";
  return (
    <div
      ref={dialog}
      tabIndex={-1}
      className="sb-dev-overlay"
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "Escape") { if(deleteTarget)setDeleteTarget(null);else close(); }
        if (e.key === "Tab") {
          const fields = [
            ...dialog.current.querySelectorAll(
              "button:not(:disabled),input:not([hidden]),select,textarea",
            ),
          ].filter((el) => el.getClientRects().length);
          const first = fields[0],
            last = fields[fields.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-label="侧边栏开发中心"
    >
      {deleteTarget&&<div className="sb-delete-backdrop" onClick={event=>{event.stopPropagation();if(event.target===event.currentTarget)setDeleteTarget(null);}}><section role="alertdialog" aria-modal="true" aria-labelledby="sb-delete-title" aria-describedby="sb-delete-description" className="sb-delete-dialog"><h2 id="sb-delete-title">{deleteTarget.type==='widget'?'删除控件':'移除页面实例'}“{deleteTarget.name}”？</h2><p id="sb-delete-description">{deleteTarget.type==='widget'?'此控件将从控件库中删除。保存或发布后生效。':'仅移除当前页面的这个实例，控件库和其他页面实例会保留。保存或发布后生效。'}</p><div><button autoFocus onClick={()=>setDeleteTarget(null)}>取消</button><button className="sb-danger-button" onClick={()=>{const target=deleteTarget;if(target.type==='widget'){if(draft.pages.some(p=>p.items.some(i=>i.widgetId===target.id))){setMessage('该控件仍被页面引用，请先移除引用');setDeleteTarget(null);return;}change(d=>d.widgets=d.widgets.filter(w=>w.id!==target.id));setWidgetId(draft.widgets.find(w=>w.id!==target.id)?.id);}else{change(d=>{const p=d.pages.find(p=>p.id===target.pageId);if(p)p.items=p.items.filter(i=>i.id!==target.id);});setItemId(null);}setDeleteTarget(null);}}>确认{deleteTarget.type==='widget'?'删除控件':'移除实例'}</button></div></section></div>}
      <div className={`sb-dev ${tab === "widgets" ? "sb-widget-redesign" : "sb-page-redesign"}`}>
        <header className="sb-dev-header">
          <div className="sb-editor-brand"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1686fa" strokeWidth="2"><path d="M3 10 12 2l9 8v11h-6v-7H9v7H3Z"/></svg><div><strong>HA 3DHome</strong><small>侧边栏开发中心</small></div></div>
          <nav aria-label="开发页面">
            <button
              className={tab === "widgets" ? "active" : ""}
              onClick={() => setTab("widgets")}
            >
              控件开发
            </button>
            <button
              className={tab === "pages" ? "active" : ""}
              onClick={() => setTab("pages")}
            >
              页面设计
            </button>
          </nav>
          <div className="sb-dev-actions">
            <span className="sb-save-state">{dirty ? "未保存" : "已保存"}</span>
            <button className="sb-reload-button"
              onClick={() => {
                if (!dirty || window.confirm("放弃本地修改并加载服务端草稿？"))
                  load();
              }}
              disabled={busy}
            >
              重新加载
            </button>
            <button onClick={() => save(false)} disabled={!workspace || busy}>
              保存草稿
            </button>
            <button
              className="primary"
              onClick={() => save(true)}
              disabled={!workspace || busy}
            >
              发布到主页
            </button>
            <button onClick={close}>返回主页</button>
          </div>
        </header>
        <div className={`sb-dev-notice ${!message ? "sb-notice-quiet" : ""}`} role="status">
          {message ||
            (busy
              ? "正在加载…"
              : "主页仅展示和使用；这里编辑草稿并发布。三个预览区域使用同一个控件渲染器。")}
        </div>
        {!workspace ? (
          <div className="sb-empty">
            {busy ? "正在读取服务端配置" : "配置读取失败，请重新加载"}
          </div>
        ) : (
          <div className="sb-dev-body" inert={busy ? "" : undefined}>
            {tab==='pages'&&<nav className="sb-design-floor-rail" aria-label="设计楼层">{workspaces.map(floor=><button key={floor.id} title={floor.name} aria-label={`设计楼层 ${floor.label} ${floor.name}`} aria-current={floor.id===floorId?'page':undefined} className={floor.id===floorId?'active':''} onClick={()=>{if(dirty&&!window.confirm('当前楼层有未保存修改，放弃并切换楼层？'))return;setWorkspace(null);setFloorId(floor.id);}}>{floor.label}</button>)}</nav>}
            <aside className="sb-dev-library">
              {tab === "widgets" ? (
                <>
                  <h2>
                    控件库{" "}
                    <button
                      onClick={() => {
                        const w = customWidget();
                        change((d) => d.widgets.push(w));
                        setWidgetId(w.id);
                      }}
                    >
                      ＋ 新建
                    </button>
                  </h2>
                  <input type="search" aria-label="搜索控件" placeholder="搜索控件" value={widgetSearch} onChange={e=>setWidgetSearch(e.target.value)}/>
                  {draft.widgets.filter(w=>w.name.toLocaleLowerCase().includes(widgetSearch.toLocaleLowerCase())).map((w) => (
                    <button
                      className={`sb-library-row ${widget?.id === w.id ? "active" : ""}`}
                      key={w.id}
                      onClick={() => setWidgetId(w.id)}
                    >
                      <strong>{w.name}</strong>
                      <small>
                        {w.scriptMode === "dom" ? "交互控件" : "数据控件"}
                      </small>
                    </button>
                  ))}
                </>
              ) : (
                <>
                  <h2>
                    导航页面{" "}
                    <button
                      onClick={() => {
                        const p = {
                          id: uid("page"),
                          name: "新页面",
                          icon: "◉",
                          items: [],
                        };
                        change((d) => d.pages.push(p));
                        setPageId(p.id);
                        setItemId(null);
                      }}
                    >
                      ＋
                    </button>
                  </h2>
                  <input type="search" aria-label="搜索导航页面" placeholder="搜索页面" value={pageSearch} onChange={e=>setPageSearch(e.target.value)}/>
                  {draft.pages.filter(p=>p.name.includes(pageSearch)).map((p) => (
                    <button
                      key={p.id}
                      draggable
                      onDragStart={event=>{setDraggedNav(p.id);event.dataTransfer.setData('application/ha3d-navigation',p.id);}}
                      onDragOver={event=>{if(event.dataTransfer.types.includes('application/ha3d-navigation'))event.preventDefault();}}
                      onDrop={event=>{event.preventDefault();if(draggedNav)change(d=>d.pages=reorderSidebarPages(d.pages,draggedNav,p.id));setDraggedNav(null);}}
                      onDragEnd={()=>setDraggedNav(null)}
                      className={`sb-library-row ${page.id === p.id ? "active" : ""}`}
                      onClick={() => {
                        setPageId(p.id);
                        setItemId(null);
                      }}
                    >
                      <span className="sb-page-drag-handle" aria-hidden="true">⠿</span><strong>{p.name}</strong><small className="sb-page-count">{p.items.length}</small>
                    </button>
                  ))}
                  <h2>添加控件</h2><input type="search" aria-label="搜索可添加控件" placeholder="搜索控件" value={addSearch} onChange={e=>setAddSearch(e.target.value)}/>
                  {draft.widgets.filter(w=>w.name.includes(addSearch)).map(w=><div className="sb-add-widget-row" key={w.id}><span>{w.name}</span><button aria-label={`添加控件 ${w.name}`} title={`添加 ${w.name} 到当前页面`} onClick={()=>addItem(w.id)}>＋</button></div>)}
                </>
              )}
              <div className="sb-library-footer">
                <TransferMenu className="sb-transfer-menu">{tab==='widgets'&&<summary>导入 / 导出</summary>}
                {tab==='widgets'?<>
                  <button onClick={()=>chooseImport('widget')}>导入控件</button>
                  <button disabled={!selectedWidget} onClick={()=>exportFile('widget',selectedWidget.id)}>导出当前控件</button>
                  <button onClick={()=>chooseImport('library')}>导入控件库</button>
                  <button onClick={()=>exportFile('library')}>导出控件库</button>
                </>:<>
                  <button onClick={()=>chooseImport('page')}>导入导航页</button>
                  <button disabled={!page} onClick={()=>exportFile('page',page.id)}>导出当前导航页</button>
                  <button onClick={()=>chooseImport('sidebar')}>导入整层侧栏</button>
                  <button onClick={()=>exportFile()}>导出整层侧栏</button>
                </>}
                </TransferMenu>
                <input
                  ref={file}
                  type="file"
                  accept=".json,application/json"
                  hidden
                  onChange={async (e) => {
                    try {
                      const selected=e.target.files?.[0]; if(!selected)return;
                      const value = importSidebarPart(draft, JSON.parse(await selected.text()), importKind.current);
                      setDraft(value);
                      setMessage("已导入草稿，请检查并保存或发布");
                    } catch (err) {
                      setMessage(err.message);
                    }
                    e.target.value = "";
                  }}
                />
              </div>
            </aside>
            {tab === "widgets" ? (
              <>
                <section className="sb-code-area">
                  <div className="sb-section-heading">
                    <h2>{widget?.name || "请选择控件"}</h2>
                    {widget && (
                      <div>
                        <button
                          onClick={() => {
                            const copy = {
                              ...widget,
                              id: uid("widget"),
                              name: `${widget.name} 副本`,
                            };
                            change((d) => d.widgets.push(copy));
                            setWidgetId(copy.id);
                          }}
                        >
                          复制
                        </button>
                        <button className="sb-danger-button"
                          onClick={() => {
                            if (
                              draft.pages.some((p) =>
                                p.items.some((i) => i.widgetId === widget.id),
                              )
                            ) {
                              setMessage(
                                "该控件已被页面引用，请先在页面设计中移除引用",
                              );
                              return;
                            }
                            setDeleteTarget({type:'widget',id:widget.id,name:widget.name});
                          }}
                        >
                          删除
                        </button>
                      </div>
                    )}
                  </div>
                  {widget && <nav className="sb-widget-sections" aria-label="控件配置页面"><button className={widgetSection==='settings'?'active':''} onClick={()=>setWidgetSection('settings')}>实体与配置</button><button className={widgetSection==='code'?'active':''} onClick={()=>setWidgetSection('code')}>代码编辑</button></nav>}
                  {widget && (
                    <>
                    {widgetSection === 'settings' && <div className="sb-widget-settings">
                    <h3>基本信息</h3><div className="sb-settings-grid">
                      <label>
                        控件名称
                        <input
                          value={widget.name}
                          maxLength={80}
                          onChange={(e) => patchWidget("name", e.target.value)}
                        />
                      </label>
                      <label>脚本模式<select value={widget.scriptMode || "transform"} onChange={e=>patchWidget("scriptMode",e.target.value)}><option value="transform">数据转换（Worker）</option><option value="dom">交互界面（隔离沙箱）</option></select><small>{widget.scriptMode==='dom'?'通过已声明动作进行交互':'在 Worker 中处理数据，无设备控制权限。'}</small></label></div>
                      <h3>默认实体</h3>{entitySelect()}
                      {widget.entityAttribute && <fieldset className="sb-account-names"><legend>实体显示名称</legend>{Object.values(entities).filter(e=>Object.hasOwn(e.attributes || {},widget.entityAttribute)).map((entity,i)=><label key={entity.entityId}>{entity.name || entity.entityId}<input value={widget.accountNames?.[entity.entityId] || ''} placeholder={`用电账户 ${i+1}`} onChange={event=>patchWidget('accountNames',{...widget.accountNames,[entity.entityId]:event.target.value})} /></label>)}</fieldset>}
                      {widget.scriptMode === "dom" && <ActionEditor widget={widget} entities={effectiveBinding.entities} onChange={actions=>patchWidget("actions",actions)} onInsert={html=>patchWidget("html",widget.html+"\n"+html)}/>}
                      <p className="sb-configuration-note">修改保存在草稿中，发布后主页生效。</p>
                    </div>}
                      {widgetSection === 'code' && (
                        <>
                          <div className="sb-code-tabs">
                            {["html", "css", "js"].map((key) => (
                              <button
                                key={key}
                                className={sourceTab === key ? "active" : ""}
                                onClick={() => setSourceTab(key)}
                              >
                                {key.toUpperCase()}
                              </button>
                            ))}
                            <button className="sb-format-code" onClick={()=>editorActions.current?.()}>格式化代码</button>
                          </div>
                          <CodeEditor formatRef={editorActions} key={widget.id} language={sourceTab} value={widget[sourceTab]} maxLength={sourceTab==='js'?1000000:24000} onChange={value=>patchWidget(sourceTab,value)}/>
                          <p className="sb-muted">
                            {widget.scriptMode === "dom" ? '交互模式：HTML/CSS/JS 绘制界面，ha SDK 读取绑定状态并调用已声明动作。保存草稿后可测试，发布后主页生效。' : '数据模式：HTML 使用 {{state}}、{{attributes.temperature}}；JS 返回模板数据，Worker 限时 1 秒，无设备控制权限。'}
                          </p>
                        </>
                      )}
                    </>
                  )}
                </section>
                <aside className="sb-dev-inspector">
                  <h2>实时预览</h2>
                  <div className="sb-preview-toolbar"><div className="sb-preview-theme-buttons">{[['day','☀','白天'],['dusk','🌤','黄昏'],['night','☾','夜间']].map(([value,icon,label])=><button key={value} aria-pressed={previewTheme===value} className={previewTheme===value?'active':''} onClick={()=>setPreviewTheme(value)}><span aria-hidden="true">{icon}</span>{label}</button>)}</div><div className="sb-preview-device-buttons">{[['desktop','▱','桌面'],['mobile','▯','手机']].map(([value,icon,label])=><button key={value} aria-pressed={previewDevice===value} className={previewDevice===value?'active':''} onClick={()=>setPreviewDevice(value)}><span aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">{value==='desktop'?<><rect x="3" y="3" width="18" height="13" rx="2"/><path d="M12 16v5M7 21h10"/></>:<><rect x="6" y="2" width="12" height="20" rx="2"/><path d="M10 19h4"/></>}</svg></span>{label}</button>)}</div></div>
                  <div className={`sb-widget-live-preview sb-preview-${previewTheme} sb-preview-${previewDevice}`}>
                    {widget && <WidgetRenderer widget={widget} entities={entities} bindingContext={{projectId:project.id,floorId,workspace:"draft"}} theme={previewTheme==='day'?'day':'night'} />}
                  </div>
                  <EntityProperties key={widget?.id} entity={selectedEntity}/>
                </aside>
              </>
            ) : (
              <>
                <section className="sb-layout-area">
                  <div className="sb-section-heading"><div><h2>{page.name}</h2><small>{page.items.length} 个控件</small></div></div>
                  <div className="sb-layout-toolbar"><div><button className={!preview?'active':''} onClick={()=>setPreview(false)}>编辑</button><button className={preview?'active':''} onClick={()=>setPreview(true)}>交互预览</button></div><label>预览宽度<select value={previewWidth} onChange={e=>setPreviewWidth(Number(e.target.value))}>{[280,320,380,480,560].map(width=><option key={width} value={width}>{width}px</option>)}</select></label><div className="sb-layout-device"><button aria-label="桌面预览" className={previewDevice==='desktop'?'active':''} onClick={()=>setPreviewDevice('desktop')}>▱ 桌面</button><button aria-label="手机预览" className={previewDevice==='mobile'?'active':''} onClick={()=>setPreviewDevice('mobile')}>▯ 手机</button></div><div className="sb-layout-themes">{[['day','☀ 白天'],['dusk','☀ 黄昏'],['night','☾ 夜间']].map(([value,label])=><button key={value} className={previewTheme===value?'active':''} onClick={()=>setPreviewTheme(value)}>{label}</button>)}</div></div>
                  <div className={`sb-layout-canvas sb-canvas-${previewTheme}`}>
                    <SidebarPanel
                      projectId={project.id}
                      floorId={floorId}
                      workspace="draft"
                      config={{...draft,width:previewDevice==='mobile'?280:previewWidth}}
                      theme={previewTheme==='day'?'day':'night'}
                      onReorderPages={(from,to)=>change(d=>d.pages=reorderSidebarPages(d.pages,from,to))}
                      entities={entities}
                      title={project.name}
                      pageId={page.id}
                      onPageChange={(id) => {
                        setPageId(id);
                        setItemId(null);
                      }}
                      designer={!preview}
                      selectedItemId={preview ? null : itemId}
                      revealItemId={revealItemId}
                      onSelectItem={(id, dragged) => {
                        setItemId(id);setInspectorTab('widget');
                        if (dragged && dragged !== id)
                          change((d) => {
                            const items = d.pages.find(
                              (p) => p.id === page.id,
                            ).items;
                            const from = items.findIndex(
                                (i) => i.id === dragged,
                              ),
                              to = items.findIndex((i) => i.id === id);
                            if (from >= 0 && to >= 0)
                              items.splice(to, 0, items.splice(from, 1)[0]);
                          });
                      }}
                    />
                  </div>
                </section>
                <aside className="sb-dev-inspector">
                  <div className="sb-inspector-heading"><h2>{item ? draft.widgets.find(w=>w.id===item.widgetId)?.name : '选中控件'}</h2>{item&&<button onClick={()=>{setWidgetId(item.widgetId);setWidgetSection('code');setTab('widgets');}}>编辑控件代码</button>}</div>
                  <nav className="sb-inspector-tabs"><button className={inspectorTab==='widget'?'active':''} onClick={()=>setInspectorTab('widget')}>控件设置</button><button className={inspectorTab==='page'?'active':''} onClick={()=>setInspectorTab('page')}>页面设置</button></nav>
                  {inspectorTab==='page'&&<div>
                  <h3>侧边栏与导航</h3>
                  <label>
                    内容区总宽度 · {draft.width}px
                    <input
                      type="range"
                      min="280"
                      max="560"
                      step="10"
                      value={draft.width}
                      onChange={(e) =>
                        change((d) => (d.width = Number(e.target.value)))
                      }
                    />
                  </label>
                  <label>
                    导航名称
                    <input
                      maxLength={40}
                      value={page.name}
                      onChange={(e) => patchPage("name", e.target.value)}
                    />
                  </label>
                  <label>
                    导航图标
                    <input
                      maxLength={12}
                      value={page.icon}
                      onChange={(e) => patchPage("icon", e.target.value)}
                    />
                  </label>
                  <label>图标颜色<input type="color" value={page.color || "#f7c95d"} onChange={e=>patchPage("color",e.target.value)} /></label>
                  <div className="sb-button-row">
                    <button
                      onClick={() =>
                        change((d) => {
                          const i = d.pages.findIndex((p) => p.id === page.id);
                          if (i > 0)
                            [d.pages[i - 1], d.pages[i]] = [
                              d.pages[i],
                              d.pages[i - 1],
                            ];
                        })
                      }
                    >
                      导航上移
                    </button>
                    <button
                      onClick={() =>
                        change((d) => {
                          const i = d.pages.findIndex((p) => p.id === page.id);
                          if (i < d.pages.length - 1)
                            [d.pages[i + 1], d.pages[i]] = [
                              d.pages[i],
                              d.pages[i + 1],
                            ];
                        })
                      }
                    >
                      导航下移
                    </button>
                    <button
                      disabled={draft.pages.length === 1}
                      onClick={() => {
                        if (
                          window.confirm(
                            "删除当前导航页面及其中的控件布局？控件库仍会保留。",
                          )
                        ) {
                          change(
                            (d) =>
                              (d.pages = d.pages.filter(
                                (p) => p.id !== page.id,
                              )),
                          );
                          setPageId(
                            draft.pages.find((p) => p.id !== page.id)?.id,
                          );
                          setItemId(null);
                        }
                      }}
                    >
                      删除页面
                    </button>
                  </div>
                  </div>}
                  {inspectorTab==='widget'&&(item ? (
                    <>
                      <label>
                        绑定实体（覆盖控件默认值）
                        {entitySelect()}
                      </label>
                      <h3>显示与布局</h3><label>内容宽度<select value={draft.width} onChange={event=>change(d=>d.width=Number(event.target.value))}>{[280,320,380,480,560].map(width=><option key={width} value={width}>{width}px</option>)}</select></label><p className="sb-muted">高度随内容完整展开</p>
                      <h3>可见性</h3><label className="sb-visibility-toggle">在侧边栏中显示<input type="checkbox" checked={!item.hidden} onChange={event=>patchItem('hidden',!event.target.checked)}/></label>
                      <div className="sb-button-row">
                        <button onClick={() => moveItem(-1)}>上移</button>
                        <button onClick={() => moveItem(1)}>下移</button>
                        <button className="sb-danger-button"
                          onClick={() => {
                            setDeleteTarget({type:'instance',id:item.id,pageId:page.id,name:selectedWidget?.name || '此控件'});
                          }}
                        >
                          移除实例
                        </button>
                      </div>
                    </>
                  ) : (
                    <p className="sb-muted">直接点击画布中的控件进行配置。</p>
                  ))}
                </aside>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
