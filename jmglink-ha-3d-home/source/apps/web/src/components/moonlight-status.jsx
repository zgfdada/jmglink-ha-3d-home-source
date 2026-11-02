import {a as React} from '../vendor/react.js';
import {moonlightNotice} from '../domain/moonlight-notice.js';
export default function MoonlightStatus({moon,connection,intensity}) {
  const notice=moonlightNotice(moon,connection,intensity);
  return <div className="moonlight-status" data-status={notice.status}>
    {moon.available && notice.status!=='connection' && <p>月亮方位 {moon.azimuth.toFixed(1)}° · 高度 {moon.elevation.toFixed(1)}° · 照亮比例 {moon.illumination.toFixed(1)}%</p>}
    <p role="status">{notice.text}</p>
    {notice.installUrl && <a href={notice.installUrl} target="_blank" rel="noopener noreferrer" style={{color:'inherit',textDecoration:'underline'}}>查看 Lunar Phase 安装与配置说明 ↗</a>}
  </div>;
}
