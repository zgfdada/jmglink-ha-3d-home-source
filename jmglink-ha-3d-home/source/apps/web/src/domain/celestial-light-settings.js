export function normalizeCelestialSettings(value = {}) {
  const bounded=(n,max)=>typeof n==='number' && Number.isFinite(n)?Math.max(0,Math.min(max,n)):1;
  return {sunIntensity:bounded(value?.sunIntensity,3),moonIntensity:bounded(value?.moonIntensity,20),roofOcclusion:value?.roofOcclusion!==false,wallOpacity:typeof value?.wallOpacity==='number' && Number.isFinite(value.wallOpacity)?bounded(value.wallOpacity,1):0.55,starfield:value?.starfield!==false};
}
export function readCelestialSettings() {
  try{return normalizeCelestialSettings(JSON.parse(globalThis.localStorage?.getItem('ha3d.celestialLighting')??'{}'));}catch{return normalizeCelestialSettings();}
}
export function storeCelestialSettings(value) {
  try{globalThis.localStorage?.setItem('ha3d.celestialLighting',JSON.stringify(normalizeCelestialSettings(value)));}catch{}
}
export function celestialIntensity(day,moon,moonActive,settings) {
  const normalized=normalizeCelestialSettings(settings);
  return moonActive?moon*normalized.moonIntensity:day*normalized.sunIntensity;
}
