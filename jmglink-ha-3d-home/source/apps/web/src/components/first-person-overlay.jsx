import {a as React} from '../vendor/react.js';
import '../styles/first-person.css';
export default function FirstPersonOverlay({mode,input,onExit,notice,locked}) {
  const [stick,setStick]=React.useState([0,0]);
  const pointer=React.useRef(null);
  const move=(event)=>{
    if(pointer.current!==event.pointerId)return;
    const rect=event.currentTarget.getBoundingClientRect(),dx=(event.clientX-rect.left-rect.width/2)/42,dy=(event.clientY-rect.top-rect.height/2)/42,scale=Math.max(1,Math.hypot(dx,dy));
    const value=[dx/scale,dy/scale];input.current.move=value;setStick(value);input.current.invalidate?.();
  };
  const release=()=>{pointer.current=null;input.current.move=[0,0];setStick([0,0]);};
  React.useEffect(()=>()=>{input.current.move=[0,0];},[]);
  return <div className="first-person-overlay">
    <section className="walk-help" aria-label="室内漫游">
      <strong>{mode==='placing'?'选择漫游起点':'室内漫游'}</strong>
      <p>{mode==='placing'?'点击房间内空地进入；Esc 取消。':'WASD／方向键移动，Shift 加速；拖动画面环顾。手机使用左侧摇杆移动。'}</p>
      {mode==='walking' && <p>{locked?'鼠标已锁定，Alt 释放鼠标操作设备；Esc 退出。':'可直接点击设备；点击“锁定鼠标”后移动鼠标环顾，Alt 释放。'}</p>}
      {notice && <p role="status">{notice}</p>}
      <div>{mode==='walking' && !locked && <button className="walk-lock" onClick={()=>input.current.lock?.()}>锁定鼠标</button>}<button onClick={onExit}>{mode==='placing'?'取消':'退出漫游'}</button></div>
    </section>
    {mode==='walking' && <div className="walk-stick" role="group" aria-label="移动摇杆" onPointerDown={event=>{pointer.current=event.pointerId;event.currentTarget.setPointerCapture(event.pointerId);move(event);}} onPointerMove={move} onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release}>
      <span className="walk-stick-handle" style={{transform:`translate(${stick[0]*34}px,${stick[1]*34}px)`}}>移动</span>
    </div>}
  </div>;
}
