import {resolveSolarDirection} from './solar-direction.js';

export function isMoonlightEntity(entity) {
  const attrs = entity?.attributes ?? {};
  return Object.hasOwn(attrs, 'moon_azimuth_deg') && Object.hasOwn(attrs, 'moon_altitude_deg') && Object.hasOwn(attrs, 'illumination_fraction');
}

// Lunar Phase 主实体提供同一地点、同一次计算的全量属性；不拼接不同地点的传感器。
export function resolveMoonlight(entities = {}, northAngle = 0, now = Date.now()) {
  const candidates = Object.values(entities).filter(isMoonlightEntity).sort((a,b) => (a.entityId ?? '').localeCompare(b.entityId ?? ''));
  const entity = candidates.find(value => !['unknown','unavailable'].includes(value.state));
  const absent = reason => ({available:false, active:false, intensity:0, direction:[8,14,9],reason});
  if (!entity) {
    if(candidates.length) return absent('unavailable');
    const partial=Object.values(entities).some(value=>value.integration==='lunar_phase' || ['moon_azimuth_deg','moon_altitude_deg','illumination_fraction'].some(key=>Object.hasOwn(value.attributes??{},key)));
    return absent(partial?'incomplete':'missing');
  }
  const a = entity.attributes;
  const azimuth = a.moon_azimuth_deg, elevation = a.moon_altitude_deg, percent = a.illumination_fraction;
  if (![azimuth,elevation,percent].every(value => typeof value === 'number' && Number.isFinite(value)) || percent < 0 || percent > 100) return absent('invalid');
  const stamp = Date.parse(entity.lastUpdated ?? entity.last_updated ?? '');
  if (Number.isFinite(stamp) && now-stamp > 10*60*1000) return absent('stale');
  const moon = resolveSolarDirection({'sun.sun':{attributes:{azimuth,elevation}}}, northAngle);
  const sun = resolveSolarDirection(entities,northAngle);
  if (!moon.available) return absent('invalid');
  const night = sun.available ? Math.max(0,Math.min(1,-sun.elevation/6)) : 0;
  const intensity = moon.aboveHorizon ? 0.18 * (percent/100) * Math.sqrt(Math.max(0,Math.sin(elevation*Math.PI/180))) * night : 0;
  const reason=!sun.available?'sun_unavailable':sun.aboveHorizon || sun.elevation===0?'daytime':!moon.aboveHorizon?'below_horizon':percent===0?'unlit':'active';
  return {...moon, entityId:entity.entityId, illumination:percent, active:intensity > 0, intensity,reason};
}
