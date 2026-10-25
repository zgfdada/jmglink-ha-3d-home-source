import {readFile} from 'node:fs/promises';
import {normalizeSidebar} from '../references/sidebar.js';
const filename=process.argv[2];
if(!filename){console.error('用法: node scripts/validate.mjs <布局.json>');process.exit(2);}
try{const result=normalizeSidebar((value=>value.format==='ha3d-sidebar-library-v1'?{format:'ha3d-sidebar-v1',width:380,widgets:value.widgets,pages:[{id:'preview',name:'控件库',icon:'◇',items:[]}]}:['ha3d-sidebar-widget-v1','ha3d-sidebar-page-v1'].includes(value.format)?value.config:value)(JSON.parse(await readFile(filename,'utf8'))));console.log(`校验通过：${result.widgets.length} 个控件、${result.pages.length} 个页面`);}catch(error){console.error('校验失败：'+error.message);process.exit(1);}
