import {Color,SRGBColorSpace} from 'three';
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const hex=rgb=>'#'+rgb.map(v=>Math.round(clamp(v,0,255)).toString(16).padStart(2,'0')).join('');
const valid=(v,size)=>Array.isArray(v)&&v.length>=size&&v.slice(0,size).every(Number.isFinite);
function hs([h,s]){h=((h%360)+360)%360/60;s=clamp(s/100,0,1);const c=s,x=c*(1-Math.abs(h%2-1)),m=1-c;const rgb=h<1?[c,x,0]:h<2?[x,c,0]:h<3?[0,c,x]:h<4?[0,x,c]:h<5?[x,0,c]:[c,0,x];return hex(rgb.map(v=>(v+m)*255));}
function xy([x,y]){if(y<=0||x<0||y<0||x+y>1)return null;const X=x/y,Z=(1-x-y)/y;const rgb=[1.656492*X-.354851-.255038*Z,-.707196*X+1.655397+.036152*Z,.051713*X-.121364+1.011530*Z].map(v=>Math.max(0,v));const scale=Math.max(1,...rgb);return hex(rgb.map(v=>{v/=scale;return 255*(v<=.0031308?12.92*v:1.055*Math.pow(v,1/2.4)-.055);}));}
/** Active HA mode wins over stale/derived attributes from another mode. */
export function resolveLightChromaticity(entity,temperatureColor='#fff1d3',whiteColors={warm:'#ffbe76',cold:'#d7e7ff'}){
 const a=entity?.attributes||{},mode=a.color_mode;
 if(['color_temp','white','brightness','onoff'].includes(mode))return {color:mode==='white'?'#ffffff':temperatureColor,usesColor:false};
 const read=kind=>{
  if(kind==='hs'&&valid(a.hs_color,2))return hs(a.hs_color);
  if(kind==='xy'&&valid(a.xy_color,2))return xy(a.xy_color);
  const key=kind+'_color',size=kind==='rgbww'?5:kind==='rgbw'?4:3;
  if(['rgb','rgbw','rgbww'].includes(kind)&&valid(a[key],size)){
   const values=a[key];if(size===3)return hex(values.slice(0,3));
   // White channels contribute neutral or warm/cold-white energy, not a saturated RGB tint.
   const white=new Color(0,0,0);
   const addWhite=(color,weight)=>{const c=new Color(color);white.r+=c.r*weight;white.g+=c.g*weight;white.b+=c.b*weight;};
   if(size===4)addWhite('#ffffff',values[3]/255);else{addWhite(whiteColors.cold,values[3]/255);addWhite(whiteColors.warm,values[4]/255);}
   const mixed=new Color(hex(values.slice(0,3)));mixed.r+=white.r;mixed.g+=white.g;mixed.b+=white.b;
   mixed.multiplyScalar(1/Math.max(1,mixed.r,mixed.g,mixed.b));return '#'+mixed.getHexString(SRGBColorSpace);
  }
  return null;
 };
 const color=read(mode)||(!mode?['rgb','rgbw','rgbww','hs','xy'].map(read).find(Boolean):null);
 return {color:color||temperatureColor,usesColor:!!color};
}
/** Mix illumination in linear RGB, weighted by each light's actual brightness. */
export function mixLightColors(lights){let total=0;const mixed=new Color(0,0,0);for(const light of lights){const weight=clamp(Number(light.brightness)||0,0,1);if(!weight)continue;const c=new Color(light.color);mixed.r+=c.r*weight;mixed.g+=c.g*weight;mixed.b+=c.b*weight;total+=weight;}return total?'#'+mixed.multiplyScalar(1/total).getHexString(SRGBColorSpace):'#ffffff';}
