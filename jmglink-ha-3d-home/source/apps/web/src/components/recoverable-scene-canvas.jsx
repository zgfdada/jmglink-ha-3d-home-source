import {a as React} from '../vendor/react.js';
import {reportClientError} from '../domain/browser-recovery.js';
import {isWebglFailure} from '../domain/webgl-recovery.js';

class SceneBoundary extends React.Component {
  state={error:null,attempt:0};
  host=React.createRef();
  timer=null;
  lost=event=>{
    event.preventDefault();
    this.fail(new Error('WebGL context lost'));
  };
  componentDidMount(){this.host.current?.addEventListener('webglcontextlost',this.lost,true);}
  componentWillUnmount(){clearTimeout(this.timer);this.host.current?.removeEventListener('webglcontextlost',this.lost,true);}
  static getDerivedStateFromError(error){return {error};}
  componentDidCatch(error){this.fail(error);}
  fail(error){
    reportClientError(error,'render');
    if(!isWebglFailure(error))return;
    this.setState({error});
    // R3F releases its renderer asynchronously. Let disposal finish before retrying.
    if(this.state.attempt<2&&!this.timer)this.timer=setTimeout(()=>{this.timer=null;this.retry();},1200);
  }
  retry=()=>{clearTimeout(this.timer);this.timer=null;this.setState(state=>({error:null,attempt:state.attempt+1}));};
  render(){
    const {error,attempt}=this.state;
    if(error&&!isWebglFailure(error))throw error;
    const Canvas=this.props.Canvas;
    return <div ref={this.host} style={{width:'100%',height:'100%'}}>
      {error?<div role="status" style={{padding:24,color:'#8098b6'}}>
        <p>{attempt<2?'3D 场景正在恢复…':'3D 场景暂时不可用，可继续编辑配置。'}</p>
        <button onClick={this.retry}>重试 3D 场景</button>
      </div>:<Canvas {...this.props.canvasProps} key={attempt}/>}
    </div>;
  }
}
export default function RecoverableSceneCanvas({Canvas,...canvasProps}){
  return <SceneBoundary Canvas={Canvas} canvasProps={canvasProps}/>;
}
