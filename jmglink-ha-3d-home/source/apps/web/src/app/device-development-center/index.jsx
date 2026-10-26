import ControlLibrary from "./control-library.jsx";
import { a as React } from "../../vendor/react.js";
import "../../styles/device-development-center.css";
import ModelLibrary from "./model-library.jsx";
import ProjectDetail from "./project-detail.jsx";
import ModelPreview from "./model-preview.jsx";
import { exportFilename } from "../../../../../packages/schema/src/export-filename.js";
import {
  buildCustomDeviceProjects,
  createDeviceProjectId,
  createDeviceProjectPayload,
  filterDeviceProjects,
  PROJECT_VIEW_KEY,
  projectVisualKind,
  resolveProjectHealth,
} from "./project-home.js";

async function api(url, options) {
  const headers = { ...(options?.headers ?? {}) };
  if (options?.body != null && !headers["Content-Type"])
    headers["Content-Type"] = "application/json";
  const response = await fetch(url, { ...options, headers });
  const body = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(body.error || `请求失败：${response.status}`);
  return body;
}

function Icon({ name }) {
  const paths = {
    cube: "M12 3 4.5 7.2v9.6L12 21l7.5-4.2V7.2L12 3Zm0 0v9m7.5-4.8L12 12l-7.5-4.8",
    project: "M6 3h9l3 3v15H6V3Zm9 0v4h4M9 11h6M9 15h6",
    search: "m21 21-4.4-4.4m2.4-5.1A7.5 7.5 0 1 1 4 11.5a7.5 7.5 0 0 1 15 0Z",
    upload: "M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14v6h14v-6",
    plus: "M12 5v14M5 12h14",
    grid: "M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z",
    list: "M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01",
    bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4",
    close: "m6 6 12 12M18 6 6 18",
    download: "M12 3v12m0 0 4-4m-4 4-4-4M5 19v2h14v-2",
    copy: "M8 8h11v12H8V8Zm-3 8H4V4h11v1",
    trash: "M4 7h16M9 7V4h6v3m3 0-1 14H7L6 7m4 4v6m4-6v6",
    arrow: "m9 18 6-6-6-6",
  };
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={paths[name] ?? paths.cube} />
    </svg>
  );
}

function DeviceVisual({ device }) {
  const model = device.modelTemplate
    ? {
        ...device.modelTemplate,
        ...(device.appearance ?? {}),
        projectAppearance: Boolean(device.appearance),
      }
    : null;
  return (
    <div
      className={`ddc-next-device-visual ${model ? "has-model" : projectVisualKind(device)}`}
    >
      {model ? (
        <ModelPreview model={model} compact />
      ) : (
        <div className="body">
          <i />
          <i />
          <i />
        </div>
      )}
      <span>{device.deviceTemplateName || "智能设备"}</span>
    </div>
  );
}

function Notice({ notice, onClose }) {
  if (!notice) return null;
  return (
    <div className={`ddc-next-notice ${notice.type}`} role="status">
      <span>{notice.type === "error" ? "!" : "✓"}</span>
      <p>{notice.message}</p>
      <button onClick={onClose} aria-label="关闭提示">
        ×
      </button>
    </div>
  );
}

function ProjectCard({ device, view, onOpen, onExport, onDelete, onCopy }) {
  const health = resolveProjectHealth(device);
  return (
    <article className="ddc-next-project-card">
      <DeviceVisual device={device} />
      <div className="ddc-next-project-body">
        <div className="ddc-next-project-main">
          <h3>{device.name}</h3>
          <p>
            {device.manufacturer || "未知厂商"} · {device.model || "未知型号"}
          </p>
          <span className={`ddc-next-health ${health.severity}`}>
            <i />
            {health.label}
          </span>
          <small>
            {device.capabilityCount ?? 0} 项能力 ·{" "}
            {device.boundDeviceCount ?? 0} 个已绑定设备 ·{" "}
            {device.entityIds?.length ?? 0} 个实体
          </small>
        </div>
        <div className="ddc-next-card-actions">
          <button className="primary" onClick={() => onOpen(device)}>
            {device.configurationIssues?.length ? "继续编辑" : "打开项目"}
          </button>
          <details>
            <summary aria-label={`${device.name}更多操作`}>•••</summary>
            <div className="ddc-next-action-menu">
              <button onClick={() => onExport(device)}>
                <Icon name="download" />
                导出设备包
              </button>
              <button onClick={() => onCopy(device)}>
                <Icon name="copy" />
                复制项目
              </button>
              <button className="danger" onClick={() => onDelete(device)}>
                <Icon name="trash" />
                删除项目
              </button>
            </div>
          </details>
        </div>
      </div>
      {view === "list" && (
        <span className="ddc-next-list-arrow">
          <Icon name="arrow" />
        </span>
      )}
    </article>
  );
}

function CreateProjectDialog({ onClose, onCreate }) {
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const submit = (event) => {
    event.preventDefault();
    const normalizedName = name.trim();
    if (normalizedName) onCreate({ name: normalizedName, description });
  };
  return (
    <div className="ddc-next-dialog-backdrop" onMouseDown={onClose}>
      <section
        className="ddc-next-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ddc-next-create-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <div>
            <h2 id="ddc-next-create-title">新建设备项目</h2>
            <p>创建一个独立的自定义设备项目，HA 设备将在基础信息步骤中绑定。</p>
          </div>
          <button onClick={onClose} aria-label="关闭">
            <Icon name="close" />
          </button>
        </header>
        <form className="ddc-next-create-form" onSubmit={submit}>
          <label>
            <span>项目名称</span>
            <input
              autoFocus
              required
              maxLength="120"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="例如：波轮洗衣机"
            />
          </label>
          <label>
            <span>项目说明</span>
            <textarea
              maxLength="300"
              rows="4"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="说明设备类型、用途或开发目标（可选）"
            />
          </label>
          <small>
            项目创建后，再到“基础信息”中设置识别规则并绑定 Home Assistant 设备。
          </small>
          <footer>
            <button type="button" onClick={onClose}>
              取消
            </button>
            <button className="primary" type="submit" disabled={!name.trim()}>
              <Icon name="plus" />
              创建项目
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

export default function DeviceDevelopmentCenter({ open, onClose }) {
  const [platform, setPlatform] = React.useState(null);
  const [devices, setDevices] = React.useState([]);
  const [query, setQuery] = React.useState("");
  const [view, setView] = React.useState(() =>
    window.localStorage.getItem(PROJECT_VIEW_KEY) === "list" ? "list" : "grid",
  );
  const [notice, setNotice] = React.useState(null);
  const [creating, setCreating] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [section, setSection] = React.useState("projects");
  const [activeProjectId, setActiveProjectId] = React.useState(null);
  const projectFlushRef = React.useRef(null);
  const registerProjectFlush = React.useCallback((callback) => {
    projectFlushRef.current = callback;
  }, []);
  const importRef = React.useRef(null);

  const reload = React.useCallback(async (message) => {
    try {
      const [nextPlatform, nextDevices] = await Promise.all([
        api("./api/device-platform"),
        api("./api/device-platform/devices"),
      ]);
      setPlatform(nextPlatform);
      setDevices(nextDevices.devices ?? []);
      if (message) setNotice({ type: "success", message });
    } catch (error) {
      setNotice({ type: "error", message: error.message });
    }
  }, []);

  React.useEffect(() => {
    if (open) reload();
  }, [open, reload]);

  React.useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(null), 5000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  if (!open) return null;
  const projects = filterDeviceProjects(
    buildCustomDeviceProjects(platform ?? {}, devices),
    query,
  );

  const setProjectView = (next) => {
    setView(next);
    window.localStorage.setItem(PROJECT_VIEW_KEY, next);
  };
  const changeSection = async (next) => {
    if (activeProjectId && projectFlushRef.current) {
      const saved = await projectFlushRef.current();
      if (saved === false) return;
    }
    setQuery("");
    setSection(next);
    setActiveProjectId(null);
  };
  const closeCenter = async () => {
    if (activeProjectId && projectFlushRef.current) {
      const saved = await projectFlushRef.current();
      if (saved === false) return;
    }
    onClose();
  };
  const createProject = async ({ name, description }) => {
    setBusy(true);
    try {
      const project = createDeviceProjectPayload({
        id: createDeviceProjectId(),
        name,
        description,
      });
      await api(
        `./api/device-platform/device-templates/${encodeURIComponent(project.id)}`,
        { method: "PUT", body: JSON.stringify(project) },
      );
      setCreating(false);
      await reload(`“${project.name}”项目已创建，请完善基础信息。`);
      setActiveProjectId(project.id);
    } catch (error) {
      setNotice({ type: "error", message: error.message });
    } finally {
      setBusy(false);
    }
  };
  const openProject = (project) => setActiveProjectId(project.id);
  const copyProject = async (project) => {
    try {
      const id = `${createDeviceProjectId()}-${Math.random().toString(36).slice(2, 6)}`;
      const now = new Date().toISOString();
      await api(
        `./api/device-platform/device-templates/${encodeURIComponent(id)}`,
        {
          method: "PUT",
          body: JSON.stringify({
            ...project,
            id,
            name: `${project.name} 副本`,
            createdAt: now,
            updatedAt: now,
          }),
        },
      );
      await reload(`“${project.name}”已复制为新项目；HA 设备绑定未复制。`);
      setActiveProjectId(id);
    } catch (error) {
      setNotice({ type: "error", message: error.message });
    }
  };
  const exportPackage = async (device, version) => {
    try {
      const bundle = await api(
        `./api/device-platform/projects/${encodeURIComponent(device.id)}/package${version ? `?version=${encodeURIComponent(version)}` : ""}`,
      );
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(bundle, null, 2)], {
          type: "application/json",
        }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = exportFilename("device", bundle.manifest?.name ?? device.name, bundle.manifest?.version, bundle.manifest?.exportedAt);
      link.click();
      URL.revokeObjectURL(url);
      setNotice({ type: "success", message: `“${device.name}”设备包已生成。` });
    } catch (error) {
      setNotice({ type: "error", message: error.message });
    }
  };
  const importPackage = (file) => {
    const reader = new FileReader();
    reader.onload = async () => {
      setBusy(true);
      try {
        const bundle = JSON.parse(reader.result);
        const single = bundle?.format === "ha3d-device-project";
        if (
          !window.confirm(
            single
              ? "导入单设备项目会创建一份未绑定 HA 的新草稿。是否继续？"
              : "导入旧版全局备份会更新设备开发中心中的自定义资源。是否继续？",
          )
        )
          return;
        const imported = await api(
          single
            ? "./api/device-platform/projects/import-package"
            : "./api/device-platform/import",
          {
            method: "POST",
            body: JSON.stringify(bundle),
          },
        );
        await reload(
          "设备包已导入。请在后续映射节点确认当前 HA 环境中的设备与实体。",
        );
        if (single && imported.projectId)
          setActiveProjectId(imported.projectId);
      } catch (error) {
        setNotice({ type: "error", message: error.message });
      } finally {
        setBusy(false);
        if (importRef.current) importRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };
  const deleteProject = async (device) => {
    const confirmation = window.prompt(
      `删除项目不会删除共享 3D 模型和控制面板。\n请输入设备名称“${device.name}”确认：`,
    );
    if (confirmation !== device.name) return;
    try {
      await api(
        `./api/device-platform/device-templates/${encodeURIComponent(device.id)}?unlink=true`,
        {
          method: "DELETE",
        },
      );
      await reload(`“${device.name}”项目已删除，共享资源已保留。`);
      if (activeProjectId === device.id) setActiveProjectId(null);
    } catch (error) {
      setNotice({ type: "error", message: error.message });
    }
  };

  return (
    <div
      className="ddc-next-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="设备开发中心"
    >
      <div className="ddc-next-shell">
        <header className="ddc-next-topbar">
          <div className="ddc-next-brand">
            <span>
              <Icon name="cube" />
            </span>
            <div>
              <h2>设备开发中心</h2>
              <small>构建属于你的智能设备体验</small>
            </div>
          </div>
          <label className="ddc-next-global-search">
            <Icon name="search" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={
                section === "controls" ? "搜索控件名称、说明、作者…" : section === "models"
                  ? "搜索模型名称、标签、作者…"
                  : "搜索设备名称、型号、厂商…"
              }
            />
          </label>
          <button className="ddc-next-icon-button" aria-label="通知">
            <Icon name="bell" />
          </button>
          <button className="ddc-next-avatar" aria-label="当前用户">
            D
          </button>
          <button
            className="ddc-next-close"
            onClick={closeCenter}
            aria-label="关闭设备开发中心"
          >
            <Icon name="close" />
          </button>
        </header>
        <aside className="ddc-next-sidebar">
          <button
            className={section === "projects" ? "active" : ""}
            onClick={() => changeSection("projects")}
          >
            <Icon name="project" />
            <span>
              <b>设备项目</b>
            </span>
          </button>
          <button
            className={section === "models" ? "active" : ""}
            onClick={() => changeSection("models")}
          >
            <Icon name="cube" />
            <span>
              <b>3D 模型资源库</b>
              <small>本地 & 已安装</small>
            </span>
          </button>
          <button className={section === "controls" ? "active" : ""} onClick={() => changeSection("controls")}>
            <Icon name="project"/><span><b>控件资源库</b><small>内置 &amp; 自定义 UI</small></span>
          </button>
        </aside>
        <main className="ddc-next-main" aria-busy={busy}>
          <Notice notice={notice} onClose={() => setNotice(null)} />
          {section === "controls" ? <ControlLibrary globalQuery={query} notify={(message,type="success")=>setNotice({message,type})} onChanged={reload}/> : section === "models" ? (
            <ModelLibrary
              platform={platform}
              reload={reload}
              globalQuery={query}
              notify={(message, type = "success") =>
                setNotice({ message, type })
              }
            />
          ) : activeProjectId && platform ? (
            <ProjectDetail
              key={activeProjectId}
              projectId={activeProjectId}
              platform={platform}
              devices={devices}
              reload={reload}
              notify={(message, type = "success") =>
                setNotice({ message, type })
              }
              onBack={() => setActiveProjectId(null)}
              onExport={exportPackage}
              onCopy={copyProject}
              onDelete={deleteProject}
              onOpenLibrary={() => void changeSection("models")}
              registerFlush={registerProjectFlush}
            />
          ) : (
            <>
              <section className="ddc-next-heading">
                <div>
                  <h1>自定义设备项目</h1>
                  <p>
                    创建、管理和开发你的智能设备，支持与 Home Assistant 深度集成
                  </p>
                </div>
                <div>
                  <button className="primary" onClick={() => setCreating(true)}>
                    <Icon name="plus" />
                    新建设备
                  </button>
                  <button onClick={() => importRef.current?.click()}>
                    <Icon name="upload" />
                    导入设备包
                  </button>
                  <input
                    ref={importRef}
                    hidden
                    type="file"
                    accept="application/json,.json"
                    onChange={(event) =>
                      event.target.files?.[0] &&
                      importPackage(event.target.files[0])
                    }
                  />
                </div>
              </section>
              <section className="ddc-next-toolbar">
                <label className="ddc-next-search">
                  <Icon name="search" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="搜索设备名称、型号、厂商…"
                  />
                </label>
                <div className="ddc-next-view-toggle" aria-label="项目展示方式">
                  <button
                    className={view === "grid" ? "active" : ""}
                    onClick={() => setProjectView("grid")}
                    aria-label="网格视图"
                  >
                    <Icon name="grid" />
                  </button>
                  <button
                    className={view === "list" ? "active" : ""}
                    onClick={() => setProjectView("list")}
                    aria-label="列表视图"
                  >
                    <Icon name="list" />
                  </button>
                </div>
              </section>
              {!platform ? (
                <div className="ddc-next-loading">
                  <span />
                  <b>正在加载设备项目…</b>
                </div>
              ) : projects.length ? (
                <section className={`ddc-next-projects ${view}`}>
                  {projects.map((device) => (
                    <ProjectCard
                      key={device.id}
                      device={device}
                      view={view}
                      onOpen={openProject}
                      onExport={exportPackage}
                      onDelete={deleteProject}
                      onCopy={copyProject}
                    />
                  ))}
                </section>
              ) : (
                <section className="ddc-next-empty">
                  <div>
                    <Icon name="project" />
                  </div>
                  <b>{query ? "没有匹配的设备项目" : "还没有自定义设备项目"}</b>
                  <span>
                    {query
                      ? "请尝试其他名称、型号或厂商关键词。"
                      : "点击“新建设备”创建第一个自定义设备项目。"}
                  </span>
                  {query && (
                    <button onClick={() => setQuery("")}>清除搜索</button>
                  )}
                </section>
              )}
            </>
          )}
        </main>
        {busy && (
          <div className="ddc-next-busy">
            <span />
            <b>正在处理设备项目…</b>
          </div>
        )}
        {creating && (
          <CreateProjectDialog
            onClose={() => !busy && setCreating(false)}
            onCreate={createProject}
          />
        )}
      </div>
    </div>
  );
}
