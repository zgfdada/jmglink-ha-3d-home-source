// house-control lights.js/world.js, ff9e069; see public/licenses/house-control-MIT.txt.
export const REFERENCE_SPOT_ANGLE=1.2;
export const DEFAULT_FIXTURE_BEAM_ANGLE=REFERENCE_SPOT_ANGLE*360/Math.PI;
export const FIXTURE_BLOOM=Object.freeze({strength:.34,radius:.5,threshold:1,exposure:1.05});
export const FIXTURE_LIGHT_BALANCE=Object.freeze({emitter:.65,illumination:1.15});
// Same frame-independent exponential easing as LightUnit, with gentler timings.
export const FIXTURE_FADE_RATES=Object.freeze({on:4.5,off:3.5,color:6});
const PROFILES = Object.freeze({
 ceiling: {type:'spot',intensity:20,distance:0,penumbra:.75,priority:0},
 downlight: {type:'spot',intensity:20,distance:0,penumbra:.75,priority:3},
 chandelier: {type:'spot',intensity:9,distance:0,penumbra:.75,priority:1},
 wall: {type:'spot',intensity:9,distance:0,penumbra:.75,priority:4},
 floor: {type:'point',intensity:3.4,distance:0,priority:2},
 strip: {type:'point',intensity:1.6,distance:3.2,priority:9},
});
export function fixtureLightProfile(variant) { return PROFILES[variant] ?? PROFILES.ceiling; }
export function lightLevel(value) { return Number.isFinite(value) ? Math.max(0,Math.min(1,value)) : 0; }
export function transitionFactor(delta,rate) {
 return 1-Math.exp(-Math.max(0,Number.isFinite(delta)?delta:0)*rate);
}
export function advanceLightLevel(current,goal,delta) {
 const target=lightLevel(goal), start=lightLevel(current);
 const next=start+(target-start)*transitionFactor(delta,target>start?FIXTURE_FADE_RATES.on:FIXTURE_FADE_RATES.off);
 return Math.abs(next-target)<.001 ? target : next;
}
export function fixtureLightOutput(level,variant,balance=FIXTURE_LIGHT_BALANCE) {
 const value=lightLevel(level), profile=fixtureLightProfile(variant);
 return {intensity:profile.intensity*balance.illumination*Math.pow(value,1.5)};
}
export function fixtureEmissiveOutput(level,balance=FIXTURE_LIGHT_BALANCE){
 const value=lightLevel(level),t=Math.min(1,value/.12);
 // LightUnit's emitter curve, softly gated near zero to avoid its .8 jump.
 return balance.emitter*(.8+1.7*Math.pow(value,.7))*t*t*(3-2*t);
}
export function stripLightPositions(length=1){
 const span=Number.isFinite(length)?Math.max(.08,length):1,n=Math.max(5,Math.min(16,Math.ceil(span/.15)));
 return Array.from({length:n},(_,i)=>[-span/2+span/n*(i+.5),0,.05]);
}
// Reserve samplers for wall materials, sky and the existing sun/moon shadows.
export function selectFixtureShadows(lights,maxTextures,otherShadows=0){
 const cap=Math.max(0,Math.min(8,Math.floor(maxTextures)-6-otherShadows));
 const ranked=lights.filter(l=>l.variant!=='strip').sort((a,b)=>fixtureLightProfile(a.variant).priority-fixtureLightProfile(b.variant).priority);
 const selected=[],rooms=new Set();
 for(const light of ranked){if(selected.length>=cap)break;const room=light.roomId??light.id;if(!rooms.has(room)){selected.push(light.id);rooms.add(room);}}
 for(const light of ranked){if(selected.length>=cap)break;if(!selected.includes(light.id))selected.push(light.id);}
 return new Set(selected);
}
