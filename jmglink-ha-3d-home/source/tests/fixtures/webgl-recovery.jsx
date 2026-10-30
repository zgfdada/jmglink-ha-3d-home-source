import {a as React} from '../../apps/web/src/vendor/react.js';
import {c as ReactDOM,g as Canvas} from '../../apps/web/src/vendor/three.js';
import RecoverableSceneCanvas from '../../apps/web/src/components/recoverable-scene-canvas.jsx';
import ApplicationBoundary from '../../apps/web/src/components/application-boundary.jsx';
let fail=false;
const getContext=HTMLCanvasElement.prototype.getContext;
HTMLCanvasElement.prototype.getContext=function(type,...args){return fail&&/webgl/.test(type)?null:getContext.call(this,type,...args);};
function App(){
  const [key,setKey]=React.useState(0),[ready,setReady]=React.useState(false),[editing,setEditing]=React.useState(false);
  return <main style={{padding:32,fontFamily:'system-ui',background:'#edf3fa',minHeight:'100vh'}}>
    <h1>车辆动效编辑 · WebGL 故障验收</h1>
    <p>隔离测试，不连接 HA，不修改用户项目。</p>
    <button onClick={()=>{fail=true;setReady(false);setKey(v=>v+1);}}>模拟持续创建失败</button>
    <button onClick={()=>{fail=false;}}>恢复 GPU 创建能力</button>
    <button onClick={()=>setEditing(v=>!v)}>打开或关闭动效编辑</button>
    <label>规则名称 <input defaultValue="离家隐藏车辆"/></label>
    <p>{editing?'动效编辑保持可用':ready?'3D 场景已正常创建':'等待 3D 场景'}</p>
    <div style={{height:360,maxWidth:900,background:'#fff',border:'1px solid #bdd0e8'}}>
      {!editing&&<RecoverableSceneCanvas key={key} Canvas={Canvas} onCreated={()=>setReady(true)} camera={{position:[0,0,4]}}>
        <ambientLight intensity={2}/><mesh><boxGeometry args={[2,.7,1]}/><meshStandardMaterial color="#50928a"/></mesh>
      </RecoverableSceneCanvas>}
    </div>
  </main>;
}
ReactDOM.createRoot(document.getElementById('root')).render(<ApplicationBoundary><App/></ApplicationBoundary>);
