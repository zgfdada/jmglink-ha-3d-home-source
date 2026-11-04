import {a as React} from '../vendor/react.js';
import {createIdleRotation,bindIdleRotation} from '../domain/idle-rotation.js';

export function useIdleRotation(blocked) {
  const rootRef=React.useRef(null), controller=React.useRef(null), latestBlocked=React.useRef(blocked);
  const [running,setRunning]=React.useState(true);
  latestBlocked.current=blocked;
  React.useEffect(()=>{
    const policy=createIdleRotation(setRunning);
    controller.current=policy;
    policy.setBlocked(latestBlocked.current);
    const cleanup=bindIdleRotation(rootRef.current,policy);
    return ()=>{cleanup();controller.current=null;};
  },[]);
  React.useEffect(()=>{controller.current?.setBlocked(blocked);},[blocked]);
  return {rootRef,autoRotate:running&&!blocked};
}
