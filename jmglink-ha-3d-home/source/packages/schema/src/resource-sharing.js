// Local authoring metadata. Never included in portable code or entity bindings.
export const defaultResourceSharing = () => ({version:'1.0.0',description:'',product:{isStandard:false},previewDataUrl:'',previewMode:'auto'});
export function normalizeResourceSharing(value) {
  if(value===undefined)return undefined;
  const error=message=>{throw Object.assign(new Error(message),{statusCode:400});};
  if(!value||typeof value!=='object'||Array.isArray(value))error('资源资料格式无效');
  if(!/^(0|[1-9]\d{0,8})\.(0|[1-9]\d{0,8})\.(0|[1-9]\d{0,8})$/.test(value.version))error('可见版本应为 1.0.0 格式');
  const description=value.description??'',previewDataUrl=value.previewDataUrl??'';
  if(typeof description!=='string'||description.length>2000)error('资源介绍最多 2000 字');
  if(typeof previewDataUrl!=='string'||previewDataUrl.length>700000||(previewDataUrl&&!/^data:image\/(png|jpeg);base64,[A-Za-z0-9+/]+={0,2}$/.test(previewDataUrl)))error('预览图应为不超过 512 KiB 的 PNG/JPEG');
  const p=value.product??{isStandard:false};
  if(typeof p.isStandard!=='boolean')error('请选择是否标准品');
  const product={isStandard:p.isStandard};
  if(p.isStandard)for(const field of ['brand','model']){if(typeof p[field]!=='string'||!p[field].trim()||p[field].length>120)error('标准品需填写品牌和型号（最多 120 字）');product[field]=p[field].trim();}
  return {version:value.version,description,product,previewDataUrl,previewMode:value.previewMode==='manual'?'manual':'auto'};
}
