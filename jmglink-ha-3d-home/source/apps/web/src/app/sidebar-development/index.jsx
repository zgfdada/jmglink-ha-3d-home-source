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
  entityId: "",
  html: '<article class="card"><small>{{attributes.friendly_name}}</small><h2>{{state}}</h2><p>{{attributes.unit_of_measurement}}</p></article>',
  css: ".card { padding:20px; border-radius:18px; background:linear-gradient(135deg,#3d627e,#263b58); } h2 { font-size:36px; margin:14px 0; }",
  js: "// entity 是所绑定实体的只读快照。返回用于 {{字段}} 模板的数据。\nreturn entity;",
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
      <button type="button" onClick={()=>onChange(null)}>{emptyLabel}</button>
      <button type="button" onClick={()=>onChange([])}>清空绑定</button>
      <small>匹配 {matches.length} 个实体{matches.length>100?"，显示前 100 个，请搜索缩小范围":""}</small>
      {matches.slice(0,100).map(e=><label key={e.entityId}><input type="checkbox" checked={binding.ids.includes(e.entityId)} onChange={()=>toggle(e.entityId)}/><span>{sidebarEntityName(e,widget)}<small>{e.entityId}</small></span></label>)}
    </div>}
    <div className="sb-effective-entities" aria-live="polite"><strong>实际生效实体 · {binding.source}（{binding.entities.length}）</strong>
      {binding.entities.map(e=><div key={e.entityId}>{sidebarEntityName(e,widget)}<small>{e.entityId}</small></div>)}
      {binding.missing.map(id=><div key={id}>{id}（实体不存在或尚未同步）</div>)}
      {!binding.ids.length && <small>当前没有生效实体</small>}
    </div>
  </div>;
}

export default function SidebarDevelopmentCenter({
  project,
  entities = {},
  onClose,
}) {
  const [workspace, setWorkspace] = React.useState(null),
    [draft, setDraft] = React.useState(defaultSidebar),
    [tab, setTab] = React.useState("widgets"),
    [widgetId, setWidgetId] = React.useState("weather"),
    [pageId, setPageId] = React.useState("home"),
    [itemId, setItemId] = React.useState(null),
    [sourceTab, setSourceTab] = React.useState("html"),
    [busy, setBusy] = React.useState(false),
    [message, setMessage] = React.useState(""),
    [preview, setPreview] = React.useState(false),
    [search, setSearch] = React.useState("");
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
      const data = await sidebarApi(project.id);
      setWorkspace(data);
      setDraft(data.draft);
      saved.current = JSON.stringify(data.draft);
      setMessage("");
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }, [project.id]);
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
    setItemId(next);
  };
  const moveItem = (direction) =>
    change((d) => {
      const items = d.pages.find((p) => p.id === page.id).items;
      const i = items.findIndex((v) => v.id === itemId),
        j = i + direction;
      if (i >= 0 && j >= 0 && j < items.length)
        [items[i], items[j]] = [items[j], items[i]];
    });
  const exportFile = () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(draft, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "3dhome-sidebar.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <div
      ref={dialog}
      tabIndex={-1}
      className="sb-dev-overlay"
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "Escape") close();
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
      <div className="sb-dev">
        <header className="sb-dev-header">
          <div>
            <small>开发中心 / 侧边栏</small>
            <h1>侧边栏开发中心</h1>
          </div>
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
            <span>{dirty ? "未保存" : "已同步"}</span>
            <button
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
        <div className="sb-dev-notice" role="status">
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
                  {draft.widgets.map((w) => (
                    <button
                      className={`sb-library-row ${widget?.id === w.id ? "active" : ""}`}
                      key={w.id}
                      onClick={() => setWidgetId(w.id)}
                    >
                      <strong>{w.name}</strong>
                      <small>
                        {"HTML / CSS / JavaScript"}
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
                  {draft.pages.map((p) => (
                    <button
                      key={p.id}
                      className={`sb-library-row ${page.id === p.id ? "active" : ""}`}
                      onClick={() => {
                        setPageId(p.id);
                        setItemId(null);
                      }}
                    >
                      {p.icon} {p.name}
                      <small>{p.items.length} 个控件</small>
                    </button>
                  ))}
                  <h2>添加控件</h2>
                  {draft.widgets.map((w) => (
                    <button
                      className="sb-library-row"
                      key={w.id}
                      onClick={() => addItem(w.id)}
                    >
                      ＋ {w.name}
                    </button>
                  ))}
                </>
              )}
              <div className="sb-library-footer">
                <button onClick={exportFile}>导出布局</button>
                <button onClick={() => file.current.click()}>导入布局</button>
                <input
                  ref={file}
                  type="file"
                  accept=".json,application/json"
                  hidden
                  onChange={async (e) => {
                    try {
                      const value = normalizeSidebar(
                        JSON.parse(await e.target.files[0].text()),
                      );
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
                        <button
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
                            change(
                              (d) =>
                                (d.widgets = d.widgets.filter(
                                  (w) => w.id !== widget.id,
                                )),
                            );
                            setWidgetId("weather");
                          }}
                        >
                          删除
                        </button>
                      </div>
                    )}
                  </div>
                  {widget && (
                    <>
                      <label>
                        控件名称
                        <input
                          value={widget.name}
                          maxLength={80}
                          onChange={(e) => patchWidget("name", e.target.value)}
                        />
                      </label>
                      <label>
                        绑定实体
                        {entitySelect()}
                      </label>
                      {widget.entityAttribute && <fieldset className="sb-account-names"><legend>实体显示名称</legend>{Object.values(entities).filter(e=>Object.hasOwn(e.attributes || {},widget.entityAttribute)).map((entity,i)=><label key={entity.entityId}>{entity.name || entity.entityId}<input value={widget.accountNames?.[entity.entityId] || ''} placeholder={`用电账户 ${i+1}`} onChange={event=>patchWidget('accountNames',{...widget.accountNames,[entity.entityId]:event.target.value})} /></label>)}</fieldset>}
                      <label>脚本模式<select value={widget.scriptMode || "transform"} onChange={e=>patchWidget("scriptMode",e.target.value)}><option value="transform">数据转换（Worker）</option><option value="dom">交互界面（隔离沙箱）</option></select></label>
                      <label>自动选择要求的属性<input value={widget.entityAttribute || ""} onChange={e=>patchWidget("entityAttribute",e.target.value)} /></label>
                      <label>未绑定时自动选择实体域<input value={widget.entityDomain || ""} placeholder="例如 weather；留空不自动选择" onChange={e => patchWidget("entityDomain", e.target.value)} /></label>
                      {(
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
                          </div>
                          <textarea
                            className="sb-code-editor"
                            spellCheck="false"
                            aria-label={`${sourceTab.toUpperCase()} 编辑器`}
                            value={widget[sourceTab]}
                            maxLength={24000}
                            onChange={(e) =>
                              patchWidget(sourceTab, e.target.value)
                            }
                          />
                          <p className="sb-muted">
                            HTML 使用 {"{{state}}"}、
                            {"{{attributes.temperature}}"}。JS 接收 entity
                            并返回模板数据；限时 1 秒，无网络或设备控制权限。
                          </p>
                        </>
                      )}
                    </>
                  )}
                </section>
                <aside className="sb-dev-inspector">
                  <h2>实时预览</h2>
                  <div className="sb-widget-live-preview">
                    {widget && (
                      <WidgetRenderer widget={widget} entities={entities} />
                    )}
                  </div>
                  <h2>实体属性</h2>
                  <pre>
                    {selectedEntity
                      ? JSON.stringify(entitySnapshot(selectedEntity), null, 2)
                      : "请选择实体。内置天气未绑定时自动查找天气实体。"}
                  </pre>
                </aside>
              </>
            ) : (
              <>
                <section className="sb-layout-area">
                  <div className="sb-section-heading">
                    <h2>页面组合设计</h2>
                    <button onClick={() => setPreview(!preview)}>
                      {preview ? "返回设计" : "交互预览"}
                    </button>
                  </div>
                  <p className="sb-muted">
                    内容从上到下完整排列；拖动控件调整顺序，选择后在右侧绑定实体。
                  </p>
                  <div className="sb-layout-canvas">
                    <SidebarPanel
                      config={draft}
                      entities={entities}
                      title={project.name}
                      pageId={page.id}
                      onPageChange={(id) => {
                        setPageId(id);
                        setItemId(null);
                      }}
                      designer={!preview}
                      selectedItemId={preview ? null : itemId}
                      onSelectItem={(id, dragged) => {
                        setItemId(id);
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
                  <h2>侧边栏与导航</h2>
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
                  <h2>选中控件</h2>
                  {item ? (
                    <>
                      <label>
                        绑定实体（覆盖控件默认值）
                        {entitySelect()}
                      </label>
                      <label>
                        高度 · {item.height}px
                        <input
                          type="range"
                          min="100"
                          max="1000"
                          step="10"
                          value={item.height}
                          onChange={(e) =>
                            patchItem("height", Number(e.target.value))
                          }
                        />
                      </label>
                      <div className="sb-button-row">
                        <button onClick={() => moveItem(-1)}>上移</button>
                        <button onClick={() => moveItem(1)}>下移</button>
                        <button
                          onClick={() => {
                            change((d) => {
                              const p = d.pages.find((p) => p.id === page.id);
                              p.items = p.items.filter((i) => i.id !== item.id);
                            });
                            setItemId(null);
                          }}
                        >
                          移除
                        </button>
                      </div>
                    </>
                  ) : (
                    <p className="sb-muted">直接点击画布中的控件进行配置。</p>
                  )}
                  <h2>实体属性</h2>
                  <pre>
                    {selectedEntity
                      ? JSON.stringify(entitySnapshot(selectedEntity), null, 2)
                      : "未选中实体"}
                  </pre>
                </aside>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
