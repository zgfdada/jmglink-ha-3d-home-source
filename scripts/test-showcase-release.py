import importlib.util,json,tarfile,tempfile,unittest
from pathlib import Path
spec=importlib.util.spec_from_file_location('showcase_release',Path(__file__).with_name('prepare-showcase-release.py'));module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
(Path.home()/'Downloads').mkdir(exist_ok=True)
class ShowcaseReleaseTests(unittest.TestCase):
 def test_pack_has_explicit_roots_version_and_no_source_private_worktree(self):
  with tempfile.TemporaryDirectory(dir=Path.home()/'Downloads',prefix='ha3d-showcase-test-')as directory:
   root=Path(directory);site=root/'site';site.mkdir()
   for name in ['Dockerfile','compose.yaml','.dockerignore']:(site/name).write_text('fixture',encoding='utf-8')
   (site/'docker').mkdir();(site/'dist').mkdir();(site/'dist/release-info.json').write_text(json.dumps({'version':'0.1.5-custom.40','status':'prepared'}),encoding='utf-8');(site/'private.txt').write_text('must not package')
   archive=root/'showcase.tar.gz';module.pack(site,archive,published=True)
   with tarfile.open(archive)as t:
    self.assertNotIn('private.txt',t.getnames());self.assertEqual(json.load(t.extractfile('dist/release-info.json'))['status'],'published')
   self.assertFalse(archive.with_suffix('.gz.tmp').exists())
 def test_archive_inside_source_tree_is_rejected(self):
  with tempfile.TemporaryDirectory(dir=Path.home()/'Downloads',prefix='ha3d-showcase-test-')as directory:
   root=Path(directory)
   with self.assertRaisesRegex(ValueError,'outside'):module.pack(root,root/'self.tar.gz')
if __name__=='__main__':unittest.main()
