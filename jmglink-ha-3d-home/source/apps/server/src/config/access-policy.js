import {timingSafeEqual} from 'node:crypto';

export function createAccessPolicy({token='',allowedOrigins=[]}={}) {
  const allowed=new Set(allowedOrigins.filter(Boolean).map(value=>new URL(value).origin));
  function authorize(req) {
    const headers=req.headers||{};
    if(headers.origin){
      let origin;
      try{origin=new URL(headers.origin);}catch{return {status:403,message:'无效访问来源'};}
      if(!['http:','https:'].includes(origin.protocol) || origin.username || origin.password || (headers['sec-fetch-site'] && headers['sec-fetch-site']!=='same-origin' && !allowed.has(origin.origin)) || (headers['sec-fetch-site']!=='same-origin' && origin.host!==headers.host&&!allowed.has(origin.origin)))
        return {status:403,message:'不允许跨站访问'};
    }
    if(token){
      const auth=headers.authorization||'';
      let provided=auth.startsWith('Bearer ')?auth.slice(7):'';
      if(auth.startsWith('Basic ')){
        const basic=Buffer.from(auth.slice(6),'base64').toString();
        provided=basic.slice(basic.indexOf(':')+1);
      }
      const a=Buffer.from(provided),b=Buffer.from(token);
      if(a.length!==b.length || !timingSafeEqual(a,b))return {status:401,message:'需要登录：使用访问令牌作为密码'};
    }
    return null;
  }
  return {authorize};
}

export function registerAccessPolicy(app, policy) {
  app.addHook('onRequest',async(req,reply)=>{
    if(req.url.split('?')[0]==='/api/health')return;
    const error=policy.authorize(req);
    if(error){
      if(error.status===401)reply.header('WWW-Authenticate','Basic realm="3DHome", charset="UTF-8"');
      return reply.code(error.status).send({error:error.message});
    }
  });
}
