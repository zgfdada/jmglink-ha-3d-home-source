export async function saveProjectRequest(project,{expectedVersion=project.version,fetchImpl=fetch}={}) {
  if(!Number.isSafeInteger(expectedVersion)||expectedVersion<0)throw Error('缺少有效保存版本');
  const response=await fetchImpl(`./api/projects/${encodeURIComponent(project.id)}`,{
    method:'PUT',signal:AbortSignal.timeout(15000),
    headers:{'Content-Type':'application/json','If-Match':String(expectedVersion)},
    body:JSON.stringify(project),
  });
  const body=await response.json().catch(()=>({}));
  if(!response.ok)throw Object.assign(new Error(body.error||'项目保存失败'),{statusCode:response.status});
  if(!body.project)throw Error('保存响应缺少户型');
  return body.project;
}
