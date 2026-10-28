(() => {
 const data=window.LESSON,timeline=data.timeline,actions=data.actions,q=s=>document.querySelector(s),audio=q('audio'),chapters=timeline.chapters;
 const originals=Object.fromEntries(chapters.map(c=>[c.slideId,q('#'+c.slideId).innerHTML]));let current='',applied=0,cc=true,raf;
 const issues={web:['网页打不开',['服务是否运行、是否反复退出','是否用了正确的主机地址','端口映射与防火墙是否允许访问'],'端口冲突示例：8181:8099。只改左侧，然后用新端口访问。'],ha:['网页可开，HA 未连接',['容器到 HA 地址是否可达','地址、HTTP/HTTPS 与端口是否正确','令牌是否完整、有效，是否已被撤销'],'不要把远端 HA 地址写成容器自己的 localhost。'],entities:['已连接，没有三维设备',['确认连接面板读取到真实实体','检查是否已创建或导入项目','检查房间、设备与实体绑定'],'空白项目没有模型，不等于 HA 连接失败。'],cache:['升级后仍是旧页面',['核对实际运行的应用或镜像版本','保留数据，检查升级结果','强制刷新浏览器页面'],'先确认实际版本，再排查缓存。']};
 function fit(){const scale=Math.min(innerWidth/1920,q('.stage').clientHeight/1080);q('.deck').style.transform=`translate(-50%,-50%) scale(${scale})`;}
 function reset(id){q('#'+id).innerHTML=originals[id];applied=0;}
 function go(id){if(!originals[id])return;if(current!==id){current=id;reset(id);}document.querySelectorAll('main>section').forEach(s=>{s.hidden=s.id!==id;s.inert=s.hidden;});const c=chapters.find(c=>c.slideId===id);q('#page-title').textContent=c.title;q('#page-count').textContent=String(c.index).padStart(2,'0')+' / '+String(chapters.length);q('#chapter').value=id;}
 function apply(id){const b=q(`[data-action="${id}"]`);if(!b)return;const group=b.parentElement;group.querySelectorAll(':scope>button').forEach(x=>x.classList.remove('active'));b.classList.add('active');
 if(id.startsWith('choose-')){q('#route-app').classList.toggle('active',id==='choose-app');q('#route-docker').classList.toggle('active',id==='choose-docker');}
 if(id==='repo-add')q('#repo-note').textContent='示意：添加仓库后，回到商店刷新并查找应用。';
 if(id.startsWith('app-'))q('#app-step').textContent={'app-install':'当前讲解：执行安装，等待真实进度与结果。','app-start':'当前讲解：启动应用，查看真实启动日志。','app-open':'当前讲解：点击应用提供的 Web 入口。'}[id]||'';
 if(id.startsWith('config-')){document.querySelectorAll('.yaml-line').forEach(e=>e.classList.remove('active'));document.querySelectorAll('.yaml-line.'+id.slice(7)).forEach(e=>e.classList.add('active'));}
 if(id.startsWith('cmd-'))q('#cmd-note').textContent={'cmd-pull':'先拉取镜像，等待实际下载完成。','cmd-up':'拉取完成后，后台启动容器服务。','cmd-ps':'检查实际服务状态，再打开网页验收。'}[id];
 if(id.startsWith('token-')){q('#ha-url').classList.toggle('active',id==='token-profile');q('#ha-token').classList.toggle('active',id!=='token-profile');}
 if(id==='save-connect')q('#connect-note').textContent='示意：提交配置后，检查实际是否已连接，并确认真实实体同步。';
 if(id.startsWith('check-'))b.querySelector('span').textContent='已核对（清单示意）';
 if(id.startsWith('issue-')){const x=issues[id.slice(6)];q('#issue-title').textContent=x[0];q('#issue-items').replaceChildren(...x[1].map(v=>Object.assign(document.createElement('li'),{textContent:v})));q('#issue-note').textContent=x[2];}
 if(id==='backup-docker')q('#backup-paths').textContent='./ha3d-data   → /data\n./ha3d-assets → /assets';
 if(id==='backup-app')q('#backup-paths').textContent='应用运行数据 → /data\n模型与素材   → /config/assets';
 }
 function sync(){const t=audio.currentTime||0,c=chapters.findLast(c=>t>=c.start)||chapters[0];go(c.slideId);const relevant=actions.filter(a=>a.slideId===current&&a.time<=t);if(relevant.length<applied)reset(current);for(let i=applied;i<relevant.length;i++)apply(relevant[i].id);applied=relevant.length;q('#seek').value=t;q('#time').textContent=stamp(t)+' / '+stamp(timeline.duration);const cue=timeline.captions.find(c=>t>=c.start&&t<c.end);q('.subtitle').textContent=cc&&cue?cue.text:'';if(!audio.paused)raf=requestAnimationFrame(sync);}
 function stamp(t){return Math.floor(t/60)+':'+String(Math.floor(t%60)).padStart(2,'0');}
 q('#chapter').innerHTML=chapters.map(c=>`<option value="${c.slideId}">${String(c.index).padStart(2,'0')} / ${c.title}</option>`).join('');q('#seek').max=timeline.duration;
 q('#play').onclick=()=>{if(audio.paused)audio.play().catch(()=>{q('.subtitle').textContent='请检查素材目录中的配音文件，或直接播放 MP4。'});else audio.pause();};audio.onplay=()=>{q('#play').textContent='暂停';cancelAnimationFrame(raf);sync();};audio.onpause=()=>{q('#play').textContent='播放';cancelAnimationFrame(raf);sync();};audio.onloadedmetadata=sync;
 q('#seek').oninput=()=>{if(audio.readyState>=1){audio.currentTime=Number(q('#seek').value);sync();}};q('#chapter').onchange=()=>{const id=q('#chapter').value;if(audio.readyState>=1){audio.currentTime=chapters.find(c=>c.slideId===id).start;sync();}else go(id);};q('#cc').onclick=()=>{cc=!cc;q('#cc').textContent='字幕 '+(cc?'开':'关');if(audio.readyState>=1)sync();};document.addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(b)apply(b.dataset.action);});window.addEventListener('resize',fit);fit();go(chapters[0].slideId);window.lesson={go,apply,fit,sync};
})();