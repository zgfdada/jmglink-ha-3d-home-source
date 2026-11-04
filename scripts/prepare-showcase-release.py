"""Update the authorized local showcase from a same-version built frontend.
Never reads HA or the running home instance. Existing sanitized demo data stays intact.
"""
import argparse,datetime,hashlib,json,re,shutil,subprocess,tarfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def prepare(showcase,frontend,manifest,ref):
 product=showcase/'dist/product';version=json.loads((ROOT/'jmglink-ha-3d-home/source/package.json').read_text(encoding='utf-8'))['version']
 metadata=json.loads(manifest.read_text(encoding='utf-8'))
 source_package=json.loads(subprocess.check_output(['git','show',ref+':jmglink-ha-3d-home/source/package.json'],cwd=ROOT,text=True,encoding='utf-8'))
 if source_package['version']!=version:raise ValueError('Corresponding source ref version differs')
 if metadata.get('version')!=version:raise ValueError('Frontend artifact version differs')
 if not (product/'snapshot.json').is_file()or not(frontend/'index.html').is_file():raise ValueError('Missing existing demo snapshot or built frontend')
 before=digest(product/'snapshot.json');old_index=(product/'index.html').read_text(encoding='utf-8')
 csp=re.search(r'<meta http-equiv="Content-Security-Policy"[^>]+>',old_index)
 if not csp:raise ValueError('Existing network isolation CSP missing')
 for directory in ['assets','vendor','agent-skills']:
  target=(product/directory).resolve()
  if not target.is_relative_to(product.resolve()):raise ValueError('Unsafe destination')
  if (frontend/directory).is_dir():
   if target.exists():shutil.rmtree(target)
   shutil.copytree(frontend/directory,target)
 # Runtime workers may use API routes even though all real APIs are intercepted.
 if (frontend/'api/motion-runtime-worker.js').is_file():
  (product/'api').mkdir(exist_ok=True);shutil.copy2(frontend/'api/motion-runtime-worker.js',product/'api/motion-runtime-worker.js')
 html=(frontend/'index.html').read_text(encoding='utf-8').replace('<head>','<head>'+csp.group(0)+'<script src="./demo-simulation.js"></script><script src="./demo-adapter.js"></script>',1)
 (product/'index.html').write_text(html,encoding='utf-8')
 for name in ['LICENSE','NOTICE.md']:shutil.copy2(ROOT/name,product/name)
 subprocess.run(['git','archive','--format=zip','--prefix=3dhome-source/','--output',str(product/'frontend-source.zip'),ref],cwd=ROOT,check=True)
 commit=subprocess.check_output(['git','rev-parse',ref],cwd=ROOT,text=True).strip()
 capture_path=product/'capture-manifest.json';capture=json.loads(capture_path.read_text(encoding='utf-8'))
 hashes={str(p.relative_to(product)).replace('\\','/'):digest(p)for folder in ['assets','vendor','agent-skills','api']for p in (product/folder).rglob('*')if p.is_file()}
 capture.update({'appVersion':version,'sourceCommit':commit,'frontendUpdatedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'frontendHashes':hashes,'frontendFiles':len(hashes),'frontendEntrypoints':re.findall(r'assets/[^"\']+\.js',html),'frontendSourceSha256':digest(product/'frontend-source.zip'),'releaseManifestSha256':digest(manifest),'demoRevision':capture.get('demoRevision',6)+1})
 capture_path.write_text(json.dumps(capture,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 if digest(product/'snapshot.json')!=before:raise ValueError('Demo data changed')
 info={'version':version,'sourceCommit':commit,'preparedAt':capture['frontendUpdatedAt'],'releaseUrl':'https://github.com/zgfdada/jmglink-ha-3d-home-custom/releases/tag/v'+version,'demoSnapshotSha256':before,'frontendSourceSha256':capture['frontendSourceSha256'],'status':'prepared'}
 (showcase/'dist/release-info.json').write_text(json.dumps(info,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 print(json.dumps({'version':version,'sourceCommit':commit,'frontendFiles':len(hashes),'demoSnapshotUnchanged':True}))
def pack(showcase,archive,published=False):
 if archive.is_relative_to(showcase.resolve()):raise ValueError('Archive must be outside its input tree')
 info_path=showcase/'dist/release-info.json';info=json.loads(info_path.read_text(encoding='utf-8'))
 if published:info['status']='published';info_path.write_text(json.dumps(info,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 temporary=archive.with_suffix(archive.suffix+'.tmp')
 roots=['Dockerfile','compose.yaml','.dockerignore','docker','dist']
 for name in roots:
  if not(showcase/name).exists():raise ValueError('Missing package root: '+name)
 for name in roots:
  for path in [showcase/name,*((showcase/name).rglob('*')if(showcase/name).is_dir()else[])]:
   if path.is_symlink():raise ValueError('Symlinks are not release input')
 try:
  with tarfile.open(temporary,'w:gz')as bundle:
   for name in roots:bundle.add(showcase/name,arcname=name)
  temporary.replace(archive)
 finally:temporary.unlink(missing_ok=True)
 print(json.dumps({'archive':str(archive),'bytes':archive.stat().st_size,'sha256':digest(archive),'version':info['version'],'status':info['status']}))
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--showcase',type=Path,required=True);parser.add_argument('--frontend',type=Path);parser.add_argument('--manifest',type=Path);parser.add_argument('--ref',default='HEAD');parser.add_argument('--archive',type=Path);parser.add_argument('--published',action='store_true');args=parser.parse_args()
 if args.frontend:
  if not args.manifest:parser.error('--manifest is required with --frontend')
  prepare(args.showcase.resolve(),args.frontend.resolve(),args.manifest.resolve(),args.ref)
 if args.archive:pack(args.showcase.resolve(),args.archive.resolve(),args.published)
