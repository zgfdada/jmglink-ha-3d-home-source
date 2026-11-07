"""Exercise public-source isolation without credentials or network access."""
import importlib.util
import json
import shutil
import tempfile
import unittest
from pathlib import Path

SPEC = importlib.util.spec_from_file_location("publication", Path(__file__).with_name("publish-installation.py"))
M = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(M)


class PublicIsolation(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        shutil.copytree(M.ROOT / "distribution", self.root / "distribution")
        shutil.copyfile(M.ROOT / "distribution-manifest.json", self.root / "distribution-manifest.json")
        (self.root / "jmglink-ha-3d-home").mkdir()
        shutil.copyfile(M.ROOT / "jmglink-ha-3d-home/config.yaml", self.root / "jmglink-ha-3d-home/config.yaml")

    def test_private_source_and_history_are_never_exported(self):
        (self.root / "private-secret.js").write_text("secret")
        (self.root / ".git").mkdir()
        files, _ = M.snapshot(self.root)
        self.assertNotIn("private-secret.js", files)
        self.assertFalse(any(".git" in p or p.endswith(".js") for p in files))

    def test_unreviewed_file_fails(self):
        (self.root / "distribution/unreviewed.md").write_text("unreviewed")
        with self.assertRaises(ValueError):
            M.snapshot(self.root)

    def test_executable_even_if_allowlisted_fails(self):
        (self.root / "distribution/leak.js").write_text("source")
        manifest = self.root / "distribution-manifest.json"
        manifest.write_text(json.dumps(json.loads(manifest.read_text(encoding="utf-8")) + ["leak.js"]))
        with self.assertRaises(ValueError):
            M.snapshot(self.root)

    def test_wrong_public_version_fails(self):
        p = self.root / "distribution/jmglink-ha-3d-home/config.yaml"
        p.write_text(p.read_text(encoding="utf-8").replace("version: 0.1.5", "version: 9.9.9"), encoding="utf-8")
        with self.assertRaises(ValueError):
            M.snapshot(self.root)

    def test_haos_changelog_is_required_and_versioned(self):
        p = self.root / "distribution/jmglink-ha-3d-home/CHANGELOG.md"
        p.write_text("# missing version", encoding="utf-8")
        with self.assertRaises(ValueError):
            M.snapshot(self.root)

    def test_broken_user_link_fails(self):
        p = self.root / "distribution/README.md"
        p.write_text(p.read_text(encoding="utf-8") + "\n[internal](README_CODE.md)\n", encoding="utf-8")
        with self.assertRaises(ValueError):
            M.snapshot(self.root)


class WorkspaceVersions(unittest.TestCase):
    def test_clean_base_and_latest_promotion_order(self):
        root = M.ROOT
        for name in ["ci.yml", "release-addon-image.yml"]:
            workflow = (root / ".github/workflows" / name).read_text(encoding="utf-8")
            self.assertNotIn("ci-node22", workflow)
            self.assertNotIn("buildcache-", workflow)
        workflow = (root / ".github/workflows/release-addon-image.yml").read_text(encoding="utf-8")
        self.assertLess(workflow.index("验证正式 AMD64 运行镜像"), workflow.index("更新并验证 latest 镜像"))
        self.assertLess(workflow.index("更新并验证 latest 镜像"), workflow.index("同步公开安装库"))

    def test_gpl_license_survives_publication_and_future_image_builds(self):
        root = M.ROOT
        license_text = (root / "LICENSE").read_text(encoding="utf-8")
        self.assertIn("Version 3, 29 June 2007", license_text)
        self.assertIn("END OF TERMS AND CONDITIONS", license_text)
        for name in ["distribution/LICENSE", "jmglink-ha-3d-home/LICENSE", "jmglink-ha-3d-home/source/LICENSE"]:
            self.assertEqual((root / name).read_text(encoding="utf-8"), license_text)
        files, _ = M.snapshot()
        self.assertEqual(files["LICENSE"], license_text.encode())
        self.assertIn("NOTICE.md", files)
        self.assertEqual((root / "NOTICE.md").read_bytes(), (root / "jmglink-ha-3d-home/NOTICE.md").read_bytes())
        self.assertEqual((root / "NOTICE.md").read_text(encoding="utf-8").encode(), files["NOTICE.md"])
        dockerfile = (root / "jmglink-ha-3d-home/Dockerfile").read_text(encoding="utf-8")
        self.assertIn('org.opencontainers.image.licenses="GPL-3.0-only"', dockerfile)
        self.assertIn("COPY LICENSE NOTICE.md ./", dockerfile)
        source = root / "jmglink-ha-3d-home/source"
        lock = json.loads((source / "package-lock.json").read_text(encoding="utf-8"))
        for directory in ["", "apps/server", "apps/web", "packages/schema"]:
            package = json.loads((source / directory / "package.json").read_text(encoding="utf-8"))
            self.assertEqual(package["license"], "GPL-3.0-only")
            self.assertEqual(lock["packages"][directory]["license"], "GPL-3.0-only")

    def test_local_schema_dependency_matches_package(self):
        source = M.ROOT / "jmglink-ha-3d-home/source"
        schema = json.loads((source / "packages/schema/package.json").read_text(encoding="utf-8"))
        lock = json.loads((source / "package-lock.json").read_text(encoding="utf-8"))
        for name in ["apps/server", "apps/web"]:
            package = json.loads((source / name / "package.json").read_text(encoding="utf-8"))
            dependency = package.get("dependencies", {}).get("@ha3d/schema")
            if dependency:
                self.assertEqual(dependency, schema["version"])
                self.assertEqual(lock["packages"][name]["dependencies"]["@ha3d/schema"], dependency)


class McpAppPublication(unittest.TestCase):
    def test_app_includes_optional_mcp_and_persistent_private_directory(self):
        config = (M.ROOT / "jmglink-ha-3d-home/config.yaml").read_text(encoding="utf-8")
        entry = (M.ROOT / "jmglink-ha-3d-home/addon-entry.js").read_text(encoding="utf-8")
        self.assertIn("8102/tcp: null", config)
        self.assertIn("mcp_enabled: false", config)
        self.assertIn("mcp_public_port: port", config)
        self.assertIn("addonMcpEnvironment(addonOptions)", entry)
        helper = (M.ROOT / "jmglink-ha-3d-home/source/apps/server/src/config/addonMcpOptions.js").read_text(encoding="utf-8")
        self.assertIn('/config/mcp-private', helper)
    def test_public_snapshot_contains_mcp_installation_guide(self):
        files, _ = M.snapshot()
        self.assertIn("docs/MCP本地部署与使用.md", files)
        self.assertIn(b"HA3D_MCP_PUBLIC_PORT", files["docker-compose.release.yml"])


if __name__ == "__main__":
    unittest.main()
