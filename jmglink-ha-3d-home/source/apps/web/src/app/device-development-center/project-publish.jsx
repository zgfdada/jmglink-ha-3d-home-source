import ProjectStepLayout from "./project-step-layout.jsx";
import { a as React } from "../../vendor/react.js";
import ModelPreview from "./model-preview.jsx";
import { DevicePanelPreview } from "./project-testing.jsx";
import { DEVICE_CATEGORIES } from "./project-basic.js";

const endpoint = (id, tail) =>
  `./api/device-platform/projects/${encodeURIComponent(id)}/${tail}`;
async function request(url, options) {
  const response = await fetch(url, {
    ...options,
    headers: options?.body ? { "Content-Type": "application/json" } : undefined,
  });
  const value = await response.json().catch(() => ({}));
  if (!response.ok)
    throw Object.assign(new Error(value.error || `请求失败 ${response.status}`), { status: response.status });
  return value;
}

export default function ProjectPublish({
  projectId,
  platform,
  notify,
  onPrevious,
  onExport,
}) {
  const project = platform.deviceTemplates.find(
    (item) => item.id === projectId,
  );
  const model = platform.modelTemplates.find(
    (item) => item.id === project?.modelTemplateId,
  );
  const panel = platform.controlPanels.find(
    (item) => item.id === project?.controlPanelTemplateId,
  );
  const [check, setCheck] = React.useState(null);
  const [release, setRelease] = React.useState(null);
  const [previewStates, setPreviewStates] = React.useState({});
  const [draft, setDraft] = React.useState(null);
  const [busy, setBusy] = React.useState(false);
  const [publishError, setPublishError] = React.useState("");
  const [selectedVersion, setSelectedVersion] = React.useState(null);
  const [versionDetail, setVersionDetail] = React.useState(null);
  const refresh = React.useCallback(async () => {
    try {
      const [checked, lifecycle, diagnostics] = await Promise.all([
        request(endpoint(projectId, "publish-check")),
        request(endpoint(projectId, "release")),
        request(endpoint(projectId, "diagnostics")),
      ]);
      setCheck(checked);
      setRelease(lifecycle);
      setPreviewStates(
        Object.fromEntries(
          diagnostics.capabilities.map((item) => [item.id, item]),
        ),
      );
      setDraft(
        (value) =>
          value ?? {
            version: lifecycle.suggestedVersion,
            channel: "local",
            visibility: lifecycle.draft?.visibility ?? "private",
            category:
              lifecycle.draft?.category ?? project?.category ?? "generic",
            subCategory:
              lifecycle.draft?.subCategory ?? project?.subCategory ?? "",
            notes: lifecycle.draft?.notes ?? "",
            options: lifecycle.draft?.options ?? {
              setCurrent: true,
              keepDraft: true,
              generatePackage: true,
              allowFork: true,
            },
          },
      );
    } catch (error) {
      notify(error.message, "error");
    }
  }, [projectId]);
  React.useEffect(() => {
    void refresh();
  }, [refresh]);
  const patch = (key, value) => setDraft((item) => ({ ...item, [key]: value }));
  const patchOption = (key, value) =>
    setDraft((item) => ({
      ...item,
      options: { ...item.options, [key]: value },
    }));
  const viewVersion = async (version) => {
    if (selectedVersion === version) {
      setSelectedVersion(null);
      setVersionDetail(null);
      return;
    }
    try {
      const detail = await request(
        endpoint(projectId, `release/${encodeURIComponent(version)}`),
      );
      setSelectedVersion(version);
      setVersionDetail(detail);
    } catch (error) {
      notify(error.message, "error");
    }
  };
  const save = async () => {
    setBusy(true);
    try {
      await request(endpoint(projectId, "release-draft"), {
        method: "PUT",
        body: JSON.stringify(draft),
      });
      await refresh();
      notify("发布草稿已保存。", "success");
      return true;
    } catch (error) {
      notify(error.message, "error");
      return false;
    } finally {
      setBusy(false);
    }
  };
  const publish = async () => {
    setPublishError("");
    if (check?.publishBlocked) return notify("请先修复发布阻断项。", "error");
    if (!(await save())) return;
    const warnings =
      check?.checks?.filter((item) => item.severity === "warning") ?? [];
    if (
      warnings.length &&
      !window.confirm(
        `存在 ${warnings.length} 条警告。确认继续发布 ${draft.version}？`,
      )
    )
      return;
    if (
      !window.confirm(
        `发布后版本 ${draft.version} 不可修改。确认将“${project.name}”发布到本地资源库？`,
      )
    )
      return;
    setBusy(true);
    try {
      await request(endpoint(projectId, "publish"), {
        method: "POST",
        body: JSON.stringify({ confirmWarnings: warnings.length > 0 }),
      });
      setDraft(null);
      await refresh();
      notify(
        `版本 ${draft.version} 已发布；后续修改将保存在新草稿中。`,
        "success",
      );
    } catch (error) {
      const interrupted = [502, 503, 504].includes(error.status) || error instanceof TypeError;
      const message = interrupted
        ? `发布请求中断（${error.status || "连接断开"}），后端可能因内存不足而退出。请检查插件／容器日志：若出现 heap out of memory，请在插件配置中将 node_max_old_space_mb 从 256 调大到 512（MiB，需主机内存充足）；Docker 部署请相应调大 Node.js 的 --max-old-space-size 或 NODE_OPTIONS。若容器设有内存限制，请同时调大容器内存限制，并为 Node.js 堆外内存预留空间。保存配置并重启插件／容器，待服务恢复后先检查版本记录，再决定是否重试。若无内存错误，请继续检查服务和代理日志。`
        : error.message;
      setPublishError(message);
      notify(message, "error");
    } finally {
      setBusy(false);
    }
  };
  return (
    <ProjectStepLayout className="ddc-lifecycle">
      <div className="ddc-lifecycle-intro">
        <h2>发布设备项目</h2>
        <p>发布前核对配置与预览。已发布版本为只读快照，编辑会进入下一草稿。</p>
      </div>
      {publishError && <div className="ddc-lifecycle-card" role="alert">{publishError}</div>}
      <div className="ddc-lifecycle-publish-grid">
        <div>
          <section className="ddc-lifecycle-card">
            <h3>
              发布检查 <button onClick={() => void refresh()}>重新检查</button>
            </h3>
            <div className="ddc-lifecycle-checks">
              {[
                "基础信息",
                "能力映射",
                "运行浮窗",
                "3D 外观",
                "控制面板",
                "联调测试",
                "设备包导出",
              ].map((name) => {
                const matching =
                  check?.checks?.filter(
                    (item) =>
                      item.page === name ||
                      (name === "能力映射" && item.capabilityId),
                  ) ?? [];
                const severity = matching.some(
                  (item) => item.severity === "error",
                )
                  ? "error"
                  : matching.length
                    ? "warning"
                    : "ok";
                return (
                  <div key={name} className={severity}>
                    {severity === "ok" ? "✓" : severity === "error" ? "✕" : "!"}
                    　{name}　{matching[0]?.reason || "已检查"}
                  </div>
                );
              })}
              {check?.checks
                ?.filter((item) => !item.page && !item.capabilityId)
                .map((item, index) => (
                  <div className={item.severity} key={index}>
                    {item.reason}
                  </div>
                ))}
            </div>
          </section>
          <section className="ddc-lifecycle-card">
            <h3>发布预览</h3>
            <div className="ddc-lifecycle-publish-previews">
              <div>
                <b>3D 外观</b>
                <div className="ddc-lifecycle-model">
                  {model ? <ModelPreview model={model} compact /> : "尚无模型"}
                </div>
              </div>
              <div>
                <b>控制面板</b>
                <DevicePanelPreview
                  project={project}
                  panel={panel}
                  states={previewStates}
                />
              </div>
            </div>
          </section>
        </div>
        <div>
          <section className="ddc-lifecycle-card">
            <h3>版本信息</h3>
            {draft && (
              <div className="ddc-lifecycle-form">
                <label>
                  版本号
                  <input
                    value={draft.version}
                    onChange={(event) => patch("version", event.target.value)}
                    placeholder="1.0.0"
                  />
                </label>
                <label>
                  发布渠道
                  <select
                    value={draft.channel}
                    onChange={(event) => patch("channel", event.target.value)}
                  >
                    <option value="local">本地设备库</option>
                  </select>
                </label>
                <label>
                  设备分类
                  <select
                    value={draft.category}
                    onChange={(event) =>
                      setDraft((item) => ({
                        ...item,
                        category: event.target.value,
                        subCategory: "",
                      }))
                    }
                  >
                    {Object.entries(DEVICE_CATEGORIES).map(([key, item]) => (
                      <option key={key} value={key}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  设备子类型
                  <select
                    value={draft.subCategory}
                    onChange={(event) =>
                      patch("subCategory", event.target.value)
                    }
                  >
                    <option value="">未指定</option>
                    {(DEVICE_CATEGORIES[draft.category]?.subtypes ?? []).map(
                      (item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ),
                    )}
                  </select>
                </label>
                <fieldset className="ddc-lifecycle-visibility">
                  <legend>可见性（本地元数据）</legend>
                  {[
                    ["private", "私有"],
                    ["team", "团队"],
                    ["public", "公开"],
                  ].map(([value, label]) => (
                    <label key={value}>
                      <input
                        type="radio"
                        name={`release-visibility-${projectId}`}
                        value={value}
                        checked={draft.visibility === value}
                        onChange={() => patch("visibility", value)}
                      />
                      {label}
                    </label>
                  ))}
                </fieldset>
                <label>
                  更新说明
                  <textarea
                    value={draft.notes}
                    onChange={(event) => patch("notes", event.target.value)}
                    rows="4"
                    maxLength="4000"
                  />
                </label>
              </div>
            )}
          </section>
          <section className="ddc-lifecycle-card">
            <h3>发布选项</h3>
            {draft && (
              <div className="ddc-lifecycle-options">
                {[
                  ["setCurrent", "发布后设为当前正式版本"],
                  ["keepDraft", "保留并创建下一草稿"],
                  ["generatePackage", "生成可导出的项目设备包"],
                  ["allowFork", "允许从该版本创建新草稿"],
                ].map(([key, label]) => (
                  <label key={key}>
                    <input
                      type="checkbox"
                      checked={draft.options?.[key] !== false}
                      onChange={(event) =>
                        patchOption(key, event.target.checked)
                      }
                    />
                    {label}
                  </label>
                ))}
              </div>
            )}
            <p className="ddc-lifecycle-note">
              当前仅发布到本地设备库；团队/公开为包内元数据，不会上传到在线服务。包不含
              HA 凭据和绑定，导入后需重新匹配。
            </p>
          </section>
          <section className="ddc-lifecycle-card">
            <h3>版本记录</h3>
            {release?.releases?.length ? (
              release.releases.map((item) => (
                <div key={item.version} className="ddc-lifecycle-version">
                  <div>
                    <b>{item.version}</b>　
                    {item.current ? "当前正式版" : "历史版本"}　
                    {new Date(item.publishedAt).toLocaleString("zh-CN")}
                  </div>
                  <small>{item.notes || "无更新说明"}</small>
                  <button onClick={() => void viewVersion(item.version)}>
                    {selectedVersion === item.version ? "收起" : "查看"}
                  </button>{" "}
                  <button
                    disabled={!item.packageAvailable}
                    onClick={() => onExport(project, item.version)}
                  >
                    {item.packageAvailable ? "导出此版本" : "未开放导出"}
                  </button>
                  {selectedVersion === item.version && versionDetail && (
                    <div className="ddc-lifecycle-version-detail">
                      只读快照：{versionDetail.project?.name} ·{" "}
                      {versionDetail.project?.manufacturer || "未设置厂商"} /{" "}
                      {versionDetail.project?.model || "未设置型号"}
                      <br />
                      能力 {versionDetail.project?.capabilities?.length ?? 0} 项
                      · 面板组件{" "}
                      {versionDetail.panel?.sections?.reduce(
                        (sum, section) => sum + section.controls.length,
                        0,
                      ) ?? 0}{" "}
                      个 · 模型 {versionDetail.model?.name || "未配置"}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="ddc-lifecycle-note">尚无已发布版本</p>
            )}
          </section>
        </div>
      </div>
      <div className="ddc-lifecycle-footer">
        <button onClick={onPrevious}>上一步</button>
        <button disabled={busy || !draft} onClick={() => void save()}>
          保存草稿
        </button>
        <button
          disabled={busy || !draft || check?.publishBlocked}
          onClick={() => void publish()}
        >
          发布版本
        </button>
      </div>
    </ProjectStepLayout>
  );
}
