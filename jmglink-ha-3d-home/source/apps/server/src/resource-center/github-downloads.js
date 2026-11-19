// Public Release downloads never receive gateway or GitHub credentials.
export async function githubBlobResponse(downloads,file,fetchImpl=fetch){
 if(downloads?.mode==='gateway')return null;
 if(!downloads||!/^[-A-Za-z0-9_.]+\/[-A-Za-z0-9_.]+$/.test(downloads.repository||''))return null;
 let url;try{url=new URL(downloads.files?.[file.sha256]);}catch{return null;}
 const prefix='/'+downloads.repository+'/releases/download/';
 if(url.origin!=='https://github.com'||url.username||url.password||url.search||url.hash||!url.pathname.startsWith(prefix)||!url.pathname.endsWith('/'+file.sha256+'.blob'))return null;
 const signal=AbortSignal.timeout(30000);
 for(let hop=0;hop<5;hop++){
  if(url.protocol!=='https:'||url.port||url.username||url.password||!['github.com','release-assets.githubusercontent.com','objects.githubusercontent.com'].includes(url.hostname))return null;
  let response;try{response=await fetchImpl(url.href,{redirect:'manual',signal,headers:{Accept:'application/octet-stream'}});}catch{return null;}
  if([301,302,303,307,308].includes(response.status)){const location=response.headers.get('location');await response.body?.cancel();try{url=new URL(location,url);}catch{return null;}continue;}
  if(response.ok)return response;await response.body?.cancel();return null;
 }
 return null;
}
