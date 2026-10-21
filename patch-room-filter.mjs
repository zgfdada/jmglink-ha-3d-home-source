import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const editorPath = path.join(
  root,
  "extracted-image/apps/web/dist/assets/FloorplanEditor-CWRaEIlm.js",
);
const cssPath = path.join(
  root,
  "extracted-image/apps/web/dist/assets/index-BkZh02gL.css",
);

let editor = fs.readFileSync(editorPath, "utf8");
let css = fs.readFileSync(cssPath, "utf8");

if (editor.includes('aria-label":"按 Home Assistant 房间筛选"')) {
  console.log("Room filter patch is already applied.");
  process.exit(0);
}

function replaceOnce(source, before, after, label) {
  const first = source.indexOf(before);
  if (first < 0) {
    throw new Error(`Patch anchor not found: ${label}`);
  }
  if (source.indexOf(before, first + before.length) >= 0) {
    throw new Error(`Patch anchor is not unique: ${label}`);
  }
  return source.slice(0, first) + after + source.slice(first + before.length);
}

editor = replaceOnce(
  editor,
  "const v=mt(e=>e.saveProject),",
  "const haAreas=mt(e=>e.areas),v=mt(e=>e.saveProject),",
  "Home Assistant areas store selector",
);

editor = replaceOnce(
  editor,
  '[qe,Hi]=x.useState(st),[Ht,zi]=x.useState(""),',
  '[qe,Hi]=x.useState(st),[roomFilter,setRoomFilter]=x.useState(st),[Ht,zi]=x.useState(""),',
  "room filter state",
);

editor = replaceOnce(
  editor,
  '})})}function dd({entity:s,active:i,onSelect:o})',
  '})})}function RoomFilterBar({options:s,activeRoom:i,onSelect:o}){return t.jsx("div",{className:"device-filter-bar device-room-filter-bar",role:"listbox","aria-label":"按 Home Assistant 房间筛选",children:s.map(d=>{const c=i===d.id;return t.jsxs("button",{type:"button",className:c?"active":"",onClick:()=>o(d.id),"aria-pressed":c,title:`显示${d.label}设备`,children:[t.jsx("span",{className:"device-filter-icon room",children:t.jsx(di,{size:14})}),t.jsx("span",{children:d.label}),t.jsx("b",{children:d.count})]},d.id)})})}function dd({entity:s,active:i,onSelect:o})',
  "room filter component",
);

editor = replaceOnce(
  editor,
  'Vs=x.useMemo(()=>(qe===st?Oe:Oe.filter(n=>n.domain===qe)).filter(n=>Qc(n,Ht)),[Oe,qe,Ht]),Xi=qe===st?"全部类型":jt(qe),jo=Ht.trim()?`${Vs.length} 个匹配`:qe===st?`${Oe.length} 个可放置`:`${Vs.length} / ${Oe.length} 个可放置`',
  'roomFilterBase=x.useMemo(()=>qe===st?Oe:Oe.filter(n=>n.domain===qe),[Oe,qe]),roomOptions=x.useMemo(()=>[{id:st,label:"全部房间",count:roomFilterBase.length},...haAreas.slice().sort((n,a)=>n.name.localeCompare(a.name,"zh-Hans-CN")).map(n=>({id:n.id,label:n.name,count:roomFilterBase.filter(a=>a.areaId===n.id).length}))],[haAreas,roomFilterBase]),Vs=x.useMemo(()=>roomFilterBase.filter(n=>roomFilter===st||n.areaId===roomFilter).filter(n=>Qc(n,Ht)),[roomFilterBase,roomFilter,Ht]),Xi=qe===st?"全部类型":jt(qe),roomLabel=roomFilter===st?"":`${roomOptions.find(n=>n.id===roomFilter)?.label??"当前房间"} · `,jo=Ht.trim()?`${Vs.length} 个匹配`:qe===st&&roomFilter===st?`${Oe.length} 个可放置`:`${Vs.length} / ${Oe.length} 个可放置`',
  "room-aware device filtering",
);

editor = replaceOnce(
  editor,
  'x.useEffect(()=>{qe!==st&&!$n.some(e=>e.domain===qe)&&Hi(st)},[qe,$n]);const yo=',
  'x.useEffect(()=>{qe!==st&&!$n.some(e=>e.domain===qe)&&Hi(st)},[qe,$n]);x.useEffect(()=>{roomFilter!==st&&!roomOptions.some(e=>e.id===roomFilter)&&setRoomFilter(st)},[roomFilter,roomOptions]);const yo=',
  "invalid room reset",
);

editor = replaceOnce(
  editor,
  '},vo=e=>{if(!ue)return;',
  '},selectRoom=e=>{setRoomFilter(e);const n=He?i[He]:void 0;n&&e!==st&&n.areaId!==e&&(Hs(void 0),B(void 0),wn(void 0))},vo=e=>{if(!ue)return;',
  "room selection handler",
);

editor = replaceOnce(
  editor,
  't.jsx(cd,{options:$n,activeDomain:qe,onSelect:yo}),Wi>0&&',
  't.jsx(cd,{options:$n,activeDomain:qe,onSelect:yo}),t.jsx(RoomFilterBar,{options:roomOptions,activeRoom:roomFilter,onSelect:selectRoom}),Wi>0&&',
  "room filter placement",
);

editor = replaceOnce(
  editor,
  'children:Ht.trim()?`没有匹配“${Ht.trim()}”的${Xi}设备。`:Oe.length?`没有${Xi}的可放置设备。`:e',
  'children:Ht.trim()?`没有匹配“${Ht.trim()}”的${roomLabel}${Xi}设备。`:Oe.length?`没有${roomLabel}${Xi}的可放置设备。`:e',
  "room-aware empty state",
);

const roomCss =
  '.device-room-filter-bar{margin-top:1px;padding-top:7px;border-top:1px solid #edf0ec}.device-room-filter-bar .device-filter-icon.room{color:#39705c;background:#eaf5ef}.device-room-filter-bar button.active .device-filter-icon.room{color:#245f9f;background:#dbebfff2}';
if (!css.includes(".device-room-filter-bar{")) {
  css += roomCss;
}

fs.writeFileSync(editorPath, editor);
fs.writeFileSync(cssPath, css);
console.log("Room filter patch applied.");
