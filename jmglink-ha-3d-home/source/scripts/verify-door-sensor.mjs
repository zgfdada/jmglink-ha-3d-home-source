// 内存中的隔离页面验收，不连接 HA、不写用户数据。
import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import {fileURLToPath} from 'node:url';
import {normalizeFloorplanProject} from '../packages/schema/src/index.js';
import {defaultSidebar} from '../packages/schema/src/sidebar.js';
const app=Fastify();
let project=normalizeFloorplanProject({id:'door-verify',name:'门磁搜索隔离验收',floors:[{id:'floor-1',name:'一层',walls:[{id:'wall',start:[-3,0],end:[3,0],height:2.8,thickness:0.2}],rooms:[],devices:[],openings:[{id:'door',type:'door',wallId:'wall',offset:3,width:0.9,height:2.1,hasLeaf:true}]}]});
const entities=[
  {entityId:'sensor.entry_door_state',name:'入户门锁 门状态',domain:'sensor',state:'门虚掩',attributes:{device_class:'enum',options:['已上锁','已开锁','门虚掩','门未关']}},
  {entityId:'binary_sensor.balcony_contact',name:'阳台门磁',domain:'binary_sensor',state:'off',attributes:{device_class:'door'}},
  {entityId:'sensor.temperature',name:'客厅温度',domain:'sensor',state:'24',attributes:{}},
];
let calls=0;
app.get('/api/ha/status',async()=>({connected:true,configured:true,mock:false,mode:'standalone',entityCount:entities.length}));
app.get('/api/ha/entities',async()=>({entities}));
app.get('/api/ha/areas',async()=>({areas:[]}));
app.get('/api/device-platform/devices',async()=>({devices:[]}));
app.get('/api/projects/current',async()=>({project}));
app.get('/api/projects',async()=>({projects:[project]}));
app.put('/api/projects/:id',async request=>{project=normalizeFloorplanProject(request.body);return {project};});
app.get('/api/sidebar/:floorId',async()=>({revision:0,draft:defaultSidebar(),published:defaultSidebar()}));
app.post('/api/ha/services/:domain/:service',async()=>{calls++;return {ok:true};});
app.get('/verify',async()=>({calls,project}));
await app.register(fastifyStatic,{root:fileURLToPath(new URL('../apps/web/dist',import.meta.url))});
await app.listen({port:18102,host:'127.0.0.1'});
console.log('door fixture ready:18102');
process.once('SIGINT',async()=>{await app.close();process.exit(0);});
