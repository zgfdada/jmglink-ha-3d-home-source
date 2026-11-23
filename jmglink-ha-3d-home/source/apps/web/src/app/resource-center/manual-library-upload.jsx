import {a as React} from '../../vendor/react.js';
import {generateModelThumbnail} from '../device-development-center/model-thumbnail.jsx';
import {generateWidgetThumbnail} from './widget-thumbnail.jsx';

async function request(path, options) {
  const response = await fetch('./api/resource-center/' + path, options);
  const result = await response.json();
  if (!response.ok) throw Error(result.error || '上传请求失败');
  return result;
}

export default function ManualLibraryUpload({model, widget, scope, disabledReason, notify, onSaved}) {
  const [busy, setBusy] = React.useState(false);
  async function submit() {
    if (busy || disabledReason) return;
    setBusy(true);
    try {
      const status = await request('status', {cache:'no-store'});
      const owner = status.user?.username || (status.defaultUserEnabled && 'desktop-default');
      if (!status.configured || !owner) throw Error('请先连接资源中心并登录账号');
      const resource = model || widget;
      const sharing = resource.resourceSharing;
      const previewDataUrl = sharing?.previewMode === 'manual' ? sharing.previewDataUrl :
        await (model ? generateModelThumbnail(model) : generateWidgetThumbnail(widget));
      if (!previewDataUrl) throw Error('请先为资源设置预览图');
      const entry = {id:resource.id, sourceSnapshot:resource, previewDataUrl};
      const payload = model ? {models:[entry]} : {...scope, widgets:[entry]};
      const result = await request(model ? 'sync-model-library' : 'sync-sidebar-library', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({...payload, expectedOwner:owner})
      });
      const item = result.items?.[0];
      if (!item || item.error || item.skipped || item.state === 'blocked') throw Error(item?.error || '资源未能加入上传队列');
      notify(item.state === 'submitted' ? '此版本已提交审核' : '已加入上传队列，可在资源中心查看进度');
      if (onSaved) await onSaved();
    } catch (error) { notify(error.message, 'error'); }
    finally { setBusy(false); }
  }
  return <button type="button" disabled={busy || Boolean(disabledReason)} title={disabledReason || undefined} onClick={submit}>
    {busy ? '正在提交…' : '上传到资源中心'}
  </button>;
}
