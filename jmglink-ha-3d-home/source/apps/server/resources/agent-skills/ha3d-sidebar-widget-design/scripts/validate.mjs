import {readFile} from 'node:fs/promises';
import {normalizeSidebar} from '../references/sidebar.js';
const filename=process.argv[2];
if(!filename){console.error('用法: node scripts/validate.mjs <布局.json>');process.exit(2);}
try{const result=normalizeSidebar(JSON.parse(await readFile(filename,'utf8')));console.log(`校验通过：${result.widgets.length} 个控件、${result.pages.length} 个页面`);}catch(error){console.error('校验失败：'+error.message);process.exit(1);}
