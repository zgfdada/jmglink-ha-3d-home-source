"""Publish an explicit user-document snapshot, never a source checkout/history."""
import base64
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PUBLIC_REPO = "zgf/jmglink-ha-3d-home-custom"
IMAGE_NAME = "jmglink-ha-3d-home-custom"
SERVER = "https://gitea.700117.xyz:16666"


def snapshot(root=ROOT):
    directory = root / "distribution"
    allowed = json.loads((root / "distribution-manifest.json").read_text(encoding="utf-8"))
    actual = {p.relative_to(directory).as_posix() for p in directory.rglob("*") if p.is_file()}
    if actual != set(allowed):
        raise ValueError("Public snapshot differs from explicit allowlist")
    result = {}
    for name in allowed:
        path = directory / name
        if path.is_symlink() or directory.resolve() not in path.resolve().parents:
            raise ValueError("Public snapshot path escapes distribution")
        if any((directory / Path(*Path(name).parts[:i])).is_symlink()
               for i in range(1, len(Path(name).parts))):
            raise ValueError("Public snapshot has symlink parent")
        if path.suffix not in {".md", ".yaml", ".yml", ".png", ".jpg", ".svg"}:
            raise ValueError("Executable or unsupported public file")
        if any(part.startswith(".") for part in Path(name).parts):
            raise ValueError("Hidden public file")
        content = path.read_bytes()
        result[name] = content.replace(b"\r\n", b"\n") if path.suffix in {".md", ".yaml", ".yml"} else content
    config = result["jmglink-ha-3d-home/config.yaml"].decode()
    version = re.search(r"^version: (\S+)\s*$", config, re.M).group(1)
    source_config = (root / "jmglink-ha-3d-home/config.yaml").read_text(encoding="utf-8")
    for key in ["version", "slug", "image"]:
        pattern = r"^" + key + r": (\S+)\s*$"
        if re.search(pattern, source_config, re.M).group(1) != re.search(pattern, config, re.M).group(1):
            raise ValueError("Source/public configuration mismatch: " + key)
    if "image: gitea.700117.xyz:16666/zgf/" + IMAGE_NAME not in config:
        raise ValueError("Public image endpoint changed")
    if ("image: gitea.700117.xyz:16666/zgf/" + IMAGE_NAME + ":latest") not in result["docker-compose.release.yml"].decode():
        raise ValueError("Public Compose must use latest")
    for name in ["README.md", "RELEASE_NOTES.md",
                 "jmglink-ha-3d-home/RELEASE_NOTES.md", "jmglink-ha-3d-home/CHANGELOG.md"]:
        if version not in result[name].decode():
            raise ValueError("Public version mismatch: " + name)
    changelog = result["jmglink-ha-3d-home/CHANGELOG.md"].decode()
    if not re.search(r"^## " + re.escape(version) + r"(?:\s|$)", changelog, re.M):
        raise ValueError("HAOS changelog lacks current version")
    if any(part in {"concept", "tutorials"} for name in result for part in Path(name).parts):
        raise ValueError("Local presentation materials are not release content")
    # Every relative Markdown file link must resolve in the public snapshot.
    for name, content in result.items():
        if not name.endswith(".md"):
            continue
        text = content.decode()
        if re.search(r"(?:Authorization:\s*(?:token|Bearer)\s+\S+|-----BEGIN .*PRIVATE KEY)", text):
            raise ValueError("Credential material in public text")
        for target in re.findall(r"\]\(([^)]+)\)", text):
            target = target.split("#")[0].strip("<>")
            if not target or ":" in target or not re.search(r"\.(md|ya?ml|png|jpg|svg)$", target):
                continue
            linked = (directory / name).parent / urllib.parse.unquote(target)
            relative = os.path.relpath(linked, directory).replace("\\", "/")
            if relative not in result:
                raise ValueError("Broken public link: " + name + " -> " + target)
    return result, version


class Client:
    def __init__(self, token):
        self.token = token

    def request(self, path, method="GET", data=None, missing=False):
        request = urllib.request.Request(
            SERVER + "/api/v1" + path,
            data=json.dumps(data).encode() if data is not None else None,
            method=method,
            headers={"Authorization": "token " + self.token, "Content-Type": "application/json"},
        )
        try:
            with urllib.request.urlopen(request, timeout=60) as response:
                raw = response.read()
                return json.loads(raw) if raw else None
        except urllib.error.HTTPError as error:
            if error.code == 404 and missing:
                return None
            # Do not echo remote response bodies or request headers into CI logs.
            raise RuntimeError(f"Public publication API {method} failed: HTTP {error.code}") from None


def publish(client, files, version, docs_only=False):
    repo = "/repos/" + PUBLIC_REPO
    metadata = client.request(repo)
    if metadata["private"] or metadata["owner"]["login"] != "zgf":
        raise ValueError("Installation destination must be the public zgf repository")
    tree = client.request(repo + "/git/trees/main?recursive=true")
    if tree.get("truncated"):
        raise ValueError("Incomplete installation tree")
    existing = {x["path"]: x["sha"] for x in tree["tree"] if x["type"] == "blob"}
    operations = []
    import hashlib
    for name, content in files.items():
        sha = hashlib.sha1(b"blob " + str(len(content)).encode() + b"\0" + content).hexdigest()
        if existing.get(name) == sha:
            continue
        item = {"path": name, "operation": "update" if name in existing else "create",
                "content": base64.b64encode(content).decode()}
        if name in existing:
            item["sha"] = existing[name]
        operations.append(item)
    for name in existing.keys() - files.keys():
        operations.append({"path": name, "operation": "delete", "sha": existing[name]})
    if operations:
        client.request(repo + "/contents", "POST", {
            "branch": "main", "message": f"docs(release): 更新 {version} 安装配置与用户说明",
            "files": operations,
        })
    verified = client.request(repo + "/git/trees/main?recursive=true")
    blobs = {x["path"]: x["sha"] for x in verified["tree"] if x["type"] == "blob"}
    if set(blobs) != set(files):
        raise ValueError("Published installation file set differs")
    for name, content in files.items():
        expected = hashlib.sha1(b"blob " + str(len(content)).encode() + b"\0" + content).hexdigest()
        if blobs[name] != expected:
            raise ValueError("Published content differs: " + name)
    # Wiki is regenerated only from reviewed user docs, never internal docs.
    pages = {p["title"]: p for p in (client.request(repo + "/wiki/pages", missing=True) or [])}
    wiki = {Path(name).stem: content.decode() for name, content in files.items()
            if name.startswith("docs/wiki/")}
    for title, content in wiki.items():
        payload = {"title": title, "content_base64": base64.b64encode(content.encode()).decode(),
                   "message": f"docs: 同步 {version} 使用教程"}
        if title in pages:
            slug = urllib.parse.quote(urllib.parse.unquote(pages[title]["sub_url"]), safe="")
            client.request(repo + "/wiki/page/" + slug, "PATCH", payload)
        else:
            client.request(repo + "/wiki/new", "POST", payload)
    for title, page in pages.items():
        if title not in wiki:
            slug = urllib.parse.quote(urllib.parse.unquote(page["sub_url"]), safe="")
            client.request(repo + "/wiki/page/" + slug, "DELETE")
    if docs_only:
        print(f"Updated and verified {len(files)} public installation files and {len(wiki)} Wiki pages; version tags unchanged")
        return
    tag = "v" + version
    commit = client.request(repo + "/branches/main")["commit"]["id"]
    existing_tag = client.request(repo + "/tags/" + tag, missing=True)
    if existing_tag:
        if existing_tag["commit"]["sha"] != commit:
            raise ValueError("Public version tag already points to a different snapshot")
    else:
        client.request(repo + "/tags", "POST", {"tag_name": tag, "target": commit})
    package_path = "/packages/zgf/container/" + IMAGE_NAME
    packages = client.request(package_path)
    linked = {(item.get("repository") or {}).get("full_name") for item in packages}
    if linked != {PUBLIC_REPO}:
        if any(linked):
            client.request(package_path + "/-/unlink", "POST")
        client.request(package_path + "/-/link/" + PUBLIC_REPO.split("/")[1], "POST")
    if any((item.get("repository") or {}).get("full_name") != PUBLIC_REPO
           for item in client.request(package_path)):
        raise ValueError("Package association was not persisted")
    release_notes = files["RELEASE_NOTES.md"].decode()
    match = re.search(r"^## " + re.escape(version) + r"[^\n]*\n(.*?)(?=^## |\Z)", release_notes, re.S | re.M)
    if not match:
        raise ValueError("Missing user release notes")
    image = "gitea.700117.xyz:16666/zgf/" + IMAGE_NAME + ":" + version
    body = match.group(1).strip() + f"\n\n### 容器镜像\n\n```shell\ndocker pull {image}\n```\n\n支持平台：`linux/amd64`、`linux/arm64`\n\n[查看容器软件包]({SERVER}/zgf/-/packages/container/{IMAGE_NAME}/{version})\n"
    payload = {"tag_name": tag, "name": "JMGLink HA 3D Home Custom " + tag,
               "body": body, "draft": False, "prerelease": False}
    release = client.request(repo + "/releases/tags/" + tag, missing=True)
    if release:
        client.request(repo + "/releases/" + str(release["id"]), "PATCH", payload)
    else:
        client.request(repo + "/releases", "POST", payload)
    print(f"Published and verified {len(files)} installation files, {len(wiki)} Wiki pages, {tag}")


if __name__ == "__main__":
    files, version = snapshot()
    if "--check" in sys.argv:
        print(f"Public snapshot valid: {len(files)} files, {version}")
    else:
        token = os.environ.get("INSTALLATION_TOKEN")
        if not token:
            raise SystemExit("INSTALLATION_TOKEN is required")
        publish(Client(token), files, version, docs_only="--docs-only" in sys.argv)
