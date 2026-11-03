"""Offline regression for GitHub publication and workflow permissions."""
import base64
import importlib.util
import io
import json
import unittest
from pathlib import Path
from unittest.mock import patch

spec = importlib.util.spec_from_file_location("publication", Path(__file__).with_name("publish-installation.py"))
M = importlib.util.module_from_spec(spec)
spec.loader.exec_module(M)


class FakeClient:
    def __init__(self, files):
        self.calls = []
        self.blobs = {M.git_blob_sha(content): content for content in files.values()}
        self.tree = {name: M.git_blob_sha(content) for name, content in files.items()}

    def request(self, path, method="GET", data=None, missing=False):
        self.calls.append((path, method, data))
        if path == "/repos/" + M.PUBLIC_REPO:
            return {"private": False, "owner": {"login": "zgfdada"}}
        if path.endswith("/git/ref/heads/main"):
            return {"object": {"sha": "old-head"}}
        if "/git/trees/" in path:
            return {"tree": [{"path": p, "type": "blob", "sha": s} for p, s in self.tree.items()]}
        if "/git/blobs/" in path:
            return {"content": base64.b64encode(self.blobs[path.rsplit("/", 1)[-1]]).decode()}
        if path.endswith("/git/blobs"):
            content = base64.b64decode(data["content"])
            sha = M.git_blob_sha(content)
            self.blobs[sha] = content
            return {"sha": sha}
        if path.endswith("/git/trees"):
            self.tree = {item["path"]: item["sha"] for item in data["tree"]}
            return {"sha": "new-tree"}
        if path.endswith("/git/commits"):
            return {"sha": "new-head"}
        if path.endswith("/git/refs/heads/main"):
            if data["force"]:
                raise AssertionError("Force push not allowed")
            return {}
        if "/git/ref/tags/" in path or "/releases/tags/" in path:
            return None
        if path.endswith("/git/refs") or path.endswith("/releases"):
            return {}
        raise AssertionError(path)


class GithubPublication(unittest.TestCase):
    def test_document_snapshot_is_exact_and_branch_update_is_non_force(self):
        files = {"README.md": b"new"}
        client = FakeClient({"README.md": b"old", "obsolete.md": b"remove"})
        M.publish(client, files, "0.0.0", docs_only=True)
        self.assertEqual(client.tree, {name: M.git_blob_sha(content) for name, content in files.items()})
        self.assertTrue(any(p.endswith("/git/refs/heads/main") and d["force"] is False for p, m, d in client.calls))
        self.assertFalse(any("/releases" in p or "/git/refs" == p for p, _, _ in client.calls))

    def test_registry_migration_requires_anonymous_pull_before_writing(self):
        old = {"jmglink-ha-3d-home/config.yaml": b"image: old.example/image\n"}
        files = {"jmglink-ha-3d-home/config.yaml": b"image: ghcr.io/zgfdada/image\n"}
        client = FakeClient(old)
        with patch.object(M, "verify_image", side_effect=ValueError("private package")):
            with self.assertRaises(ValueError):
                M.publish(client, files, "0.0.0", docs_only=True)
        self.assertFalse(any(method != "GET" for _, method, _ in client.calls))

    def test_full_release_verifies_image_before_any_api_write(self):
        files = {"RELEASE_NOTES.md": b"## 0.0.1\nrelease\n"}
        client = FakeClient(files)
        with patch.object(M, "verify_image") as verify:
            M.publish(client, files, "0.0.1")
            verify.assert_called_once_with("0.0.1")
        release = next(d for p, _, d in client.calls if p.endswith("/releases"))
        self.assertIn("ghcr.io/zgfdada/", release["body"])
        self.assertFalse(any("/api/v1" in p or "/wiki/" in p for p, _, _ in client.calls))

    def test_anonymous_manifest_requires_both_platforms(self):
        def opener(request, timeout):
            if isinstance(request, str):
                return io.BytesIO(b'{"token":"ephemeral-registry-token"}')
            return io.BytesIO(json.dumps({"manifests": [{"platform": {"os": "linux", "architecture": "amd64"}}]}).encode())
        with self.assertRaisesRegex(ValueError, "both|include"):
            M.verify_image("0.0.1", opener)

    def test_workflows_use_github_hosted_runners_and_job_scoped_packages(self):
        root = M.ROOT / ".github/workflows"
        for path in root.glob("*.yml"):
            text = path.read_text(encoding="utf-8")
            self.assertNotIn("gitea.", text)
            self.assertNotIn("linux-docker-220", text)
            self.assertNotIn("windows-x64", text)
        release = (root / "release-addon-image.yml").read_text(encoding="utf-8")
        self.assertIn("runs-on: ubuntu-24.04-arm", release)
        self.assertIn("packages: write", release)
        self.assertIn("${{ github.token }}", release)
        self.assertLess(release.index("验证 GHCR 镜像可匿名拉取"), release.index("更新并验证 latest 镜像"))
        ci = (root / "ci.yml").read_text(encoding="utf-8")
        self.assertNotIn("packages: write", ci)


if __name__ == "__main__":
    unittest.main()
