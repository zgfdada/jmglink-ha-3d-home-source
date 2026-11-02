export function createInstanceWriteGate() {
  let exclusive = false, active = 0;
  const waiters = [];
  const enter = () => {
    if (exclusive) throw Object.assign(new Error('正在恢复实例，请稍后重试，当前编辑已保留'),{statusCode:423});
    active++;
    let released = false;
    return () => {
      if(released)return;released=true;
      if(--active===0)waiters.splice(0).forEach(resolve=>resolve());
    };
  };
  return {
    enter,
    async shared(task) {const release=enter();try{return await task();}finally{release();}},
    async exclusive(task) {
      if(exclusive)throw Object.assign(new Error('已有实例恢复正在执行'),{statusCode:423});
      exclusive=true;
      try{if(active)await new Promise(resolve=>waiters.push(resolve));return await task();}
      finally{exclusive=false;}
    },
    get busy(){return exclusive;},
  };
}

export function registerInstanceWriteGate(app, gate) {
  app.addHook('onRoute',route=>{
    const methods=Array.isArray(route.method)?route.method:[route.method];
    if(!route.url.startsWith('/api/') || methods.every(m=>['GET','HEAD','OPTIONS'].includes(m)) || route.url==='/api/instance-backup')return;
    const handler=route.handler;
    const replacement=/^\/api\/projects(?:\/[^/]+)?\/import$/.test(route.url)||/\/(restore|reset|export)$/.test(route.url);
    route.handler=function(req,reply){return gate[replacement?'exclusive':'shared'](()=>handler.call(this,req,reply));};
  });
}
