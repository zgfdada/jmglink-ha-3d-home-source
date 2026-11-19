import './sharing-fields.css';
import {a as React} from '../../vendor/react.js';
import {defaultResourceSharing} from '../../../../../packages/schema/src/resource-sharing.js';

export default function SharingFields({value,onChange,model=false}){
  const settings=value||defaultResourceSharing(),product=settings.product||{isStandard:false};
  const patch=(key,v)=>onChange({...settings,[key]:v});
  const [error,setError]=React.useState('');
  async function choose(event){
    const file=event.target.files?.[0];if(!file)return;
    if(!['image/png','image/jpeg'].includes(file.type)||file.size>512*1024){setError('请选择不超过 512 KiB 的 PNG/JPEG');return;}
    const reader=new FileReader();reader.onload=()=>{onChange({...settings,previewDataUrl:reader.result,previewMode:'manual'});setError('');};reader.onerror=()=>setError('图片读取失败');reader.readAsDataURL(file);
  }
  return <section className="rc-sharing-fields">
    <h3>资源资料</h3>
    <label>可见版本<input aria-label="可见版本" value={settings.version} maxLength={29} placeholder="1.0.0" onChange={e=>patch('version',e.target.value)}/></label>
    <label>资源介绍<textarea aria-label="资源介绍" value={settings.description} maxLength={2000} onChange={e=>patch('description',e.target.value)}/></label>
    {model&&<><label>是否标准品<select aria-label="是否标准品" value={product.isStandard?'standard':'custom'} onChange={e=>patch('product',e.target.value==='standard'?{isStandard:true,brand:'',model:''}:{isStandard:false})}><option value="custom">否，自定义模型</option><option value="standard">是，标准品</option></select></label>{product.isStandard&&<><label>品牌<input value={product.brand||''} maxLength={120} onChange={e=>patch('product',{...product,brand:e.target.value})}/></label><label>型号<input value={product.model||''} maxLength={120} onChange={e=>patch('product',{...product,model:e.target.value})}/></label></>}</>}
    <label>分享预览图（自动生成，可替换）<input type="file" accept="image/png,image/jpeg" onChange={choose}/></label>
    {settings.previewMode==='manual'&&<button type="button" onClick={()=>onChange({...settings,previewDataUrl:'',previewMode:'auto'})}>恢复自动预览</button>}
    {settings.previewDataUrl&&<img src={settings.previewDataUrl} alt="资源分享预览" style={{maxWidth:180,maxHeight:120,objectFit:'contain'}}/>}
    {error&&<p role="alert">{error}</p>}
    <small>保存并退出或正式使用时自动同步，审核通过后公开；内部修订自动递增。按 GPL-3.0-only 分享，请勿在代码、文案或图片中包含私人信息。</small>
  </section>;
}
