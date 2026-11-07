import {a as React} from '../vendor/react.js';
import {useBeamSettings} from './light-beam-settings.jsx';
import {resolveBeamAngle,resolvePanelBeamFixtures,setFixtureBeamAngle,resetFixtureBeamAngle} from '../domain/light-beam-settings.js';

export default function FixtureBeamControl({project,entityId,selection}) {
 const settings=useBeamSettings();
 const fixtures=resolvePanelBeamFixtures(project,entityId,selection);
 return <>{fixtures.map(fixture=>{
  const inherited=settings.fixtures[fixture.id]===undefined;
  const angle=resolveBeamAngle(settings,fixture.modelId,fixture.id);
  return <div className="control-section" style={{background:'rgba(0,0,0,0)',boxShadow:'none'}} key={fixture.id}>
   <div className="control-section-heading"><strong>散射角度{fixtures.length>1?` · ${fixture.label}`:''}</strong><button type="button" style={{fontSize:10,padding:"4px 8px",minHeight:0,whiteSpace:"nowrap"}} disabled={inherited} onClick={()=>resetFixtureBeamAngle(fixture.id)}>恢复跟随类型</button></div>
   <label className="slider-row slider-row-compact"><span style={{display:"flex",justifyContent:"flex-end"}}><strong>{Math.round(angle)}°</strong></span><input aria-label={`${fixture.label}散射角度`} type="range" min="1" max="160" step="1" value={angle} onChange={event=>setFixtureBeamAngle(fixture.id,Number(event.target.value))}/></label>
  </div>;
 })}</>;
}
