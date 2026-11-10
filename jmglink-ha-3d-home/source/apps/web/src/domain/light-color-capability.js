const COLOR_MODES=new Set(['hs','xy','rgb','rgbw','rgbww']);
export function detectLightColorCapability(entity){
 const a=entity?.attributes??{};
 if(Array.isArray(a.supported_color_modes)&&a.supported_color_modes.length){
  const modes=a.supported_color_modes.filter(x=>typeof x==='string');
  const supported=modes.some(x=>COLOR_MODES.has(x));
  return {supported,status:supported?'supported':'unsupported',modes,source:'supported_color_modes'};
 }
 if(COLOR_MODES.has(a.color_mode))return {supported:true,status:'supported',modes:[a.color_mode],source:'color_mode'};
 return {supported:false,status:'unknown',modes:[],source:'unknown'};
}