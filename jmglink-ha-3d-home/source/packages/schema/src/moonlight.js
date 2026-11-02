import {resolveSolarDirection} from './solar-direction.js';

export function isMoonlightEntity(entity) {
  const attrs = entity?.attributes ?? {};
  return Object.hasOwn(attrs, 'moon_azimuth_deg') && Object.hasOwn(attrs, 'moon_altitude_deg') && Object.hasOwn(attrs, 'illumination_fraction');
}

// Lunar Phase 主实体提供同一地点、同一次计算的全量属性；不拼接不同地点的传感器。
export function resolveMoonlight(entities = {}, northAngle = 0, now = Date.now()) {
  const candidates = Object.values(entities).filter(isMoonlightEntity).sort((a,b) => (a.entityId ?? '').localeCompare(b.entityId ?? ''));
  const entity = candidates.find(value => !['unknown','unavailable'].includes(value.state));
  const absent = {available:false, active:false, intensity:0, direction:[8,14,9]};
  if (!entity) return absent;
  const a = entity.attributes;
  const azimuth = a.moon_azimuth_deg, elevation = a.moon_altitude_deg, percent = a.illumination_fraction;
  if (![azimuth,elevation,percent].every(value => typeof value === 'number' && Number.isFinite(value)) || percent < 0 || percent > 100) return absent;
  const stamp = Date.parse(entity.lastUpdated ?? entity.last_updated ?? '');
  if (Number.isFinite(stamp) && now-stamp > 10*60*1000) return absent;
  const moon = resolveSolarDirection({'sun.sun':{attributes:{azimuth,elevation}}}, northAngle);
  const sun = resolveSolarDirection(entities,northAngle);
  if (!moon.available) return absent;
  const night = sun.available ? Math.max(0,Math.min(1,-sun.elevation/6)) : 0;
  const intensity = moon.aboveHorizon ? 0.18 * (percent/100) * Math.sqrt(Math.max(0,Math.sin(elevation*Math.PI/180))) * night : 0;
  return {...moon, entityId:entity.entityId, illumination:percent, active:intensity > 0, intensity};
}
