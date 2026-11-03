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
PUBLIC_REPO = "zgfdada/jmglink-ha-3d-home-custom"
IMAGE_NAME = "jmglink-ha-3d-home-custom"
SERVER = "https://api.github.com"
IMAGE = "ghcr.io/zgfdada/" + IMAGE_NAME


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
    if "image: ghcr.io/zgfdada/" + IMAGE_NAME not in config:
        raise ValueError("Public image endpoint changed")
    if ("image: ghcr.io/zgfdada/" + IMAGE_NAME + ":latest") not in result["docker-compose.release.yml"].decode():
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
            SERVER + path,
            data=json.dumps(data).encode() if data is not None else None,
            method=method,
            headers={"Authorization": "Bearer " + self.token,
                     "Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28",
                     "Content-Type": "application/json"},
        )
        try:
            with urllib.request.urlopen(request, timeout=60) as response:
                raw = response.read()
                return json.loads(raw) if raw else None
        except urllib.error.HTTPError as error:
            if error.code == 404 and missing:
                return None
            raise RuntimeError(f"GitHub publication API {method} failed: HTTP {error.code}") from None


def verify_image(version, opener=urllib.request.urlopen):
    """Require an anonymously pullable multi-arch image before changing install config."""
    query = urllib.parse.urlencode({"service": "ghcr.io", "scope": "repository:zgfdada/" + IMAGE_NAME + ":pull"})
    try:
        with opener("https://ghcr.io/token?" + query, timeout=30) as response:
            token = json.load(response)["token"]
        request = urllib.request.Request("https://ghcr.io/v2/zgfdada/" + IMAGE_NAME + "/manifests/" + version,
            headers={"Authorization": "Bearer " + token,
                     "Accept": "application/vnd.oci.image.index.v1+json, application/vnd.docker.distribution.manifest.list.v2+json"})
        with opener(request, timeout=30) as response:
            manifest = json.load(response)
    except (urllib.error.HTTPError, KeyError) as error:
        raise ValueError("GHCR image must be public and anonymously pullable; set package visibility to public before rerunning") from None
    platforms = {(m.get("platform", {}).get("os"), m.get("platform", {}).get("architecture")) for m in manifest.get("manifests", [])}
    if not {("linux", "amd64"), ("linux", "arm64")} <= platforms:
        raise ValueError("GHCR image must include linux/amd64 and linux/arm64")
    print("GHCR anonymous pull and both platforms verified")


def git_blob_sha(content):
    import hashlib
    return hashlib.sha1(b"blob " + str(len(content)).encode() + b"\0" + content).hexdigest()


def publish(client, files, version, docs_only=False):
    if not docs_only:
        verify_image(version)
    repo = "/repos/" + PUBLIC_REPO
    metadata = client.request(repo)
    if metadata["private"] or metadata["owner"]["login"] != "zgfdada":
        raise ValueError("Installation destination must be the public zgfdada repository")
    head = client.request(repo + "/git/ref/heads/main")["object"]["sha"]
    tree = client.request(repo + "/git/trees/" + head + "?recursive=1")
    if tree.get("truncated"):
        raise ValueError("Incomplete installation tree")
    existing = {x["path"]: x["sha"] for x in tree["tree"] if x["type"] == "blob"}
    if docs_only and "jmglink-ha-3d-home/config.yaml" in existing:
        old_blob = client.request(repo + "/git/blobs/" + existing["jmglink-ha-3d-home/config.yaml"])
        old_config = base64.b64decode(old_blob["content"]).decode()
        new_config = files["jmglink-ha-3d-home/config.yaml"].decode()
        if re.search(r"^image: (.+)$", old_config, re.M).group(1) != re.search(r"^image: (.+)$", new_config, re.M).group(1):
            verify_image(version)
    wanted = {name: git_blob_sha(content) for name, content in files.items()}
    if wanted != existing:
        entries = []
        for name, content in files.items():
            sha = wanted[name]
            if existing.get(name) != sha:
                created = client.request(repo + "/git/blobs", "POST", {"content": base64.b64encode(content).decode(), "encoding": "base64"})
                if created["sha"] != sha:
                    raise ValueError("GitHub blob hash mismatch")
            entries.append({"path": name, "mode": "100644", "type": "blob", "sha": sha})
        new_tree = client.request(repo + "/git/trees", "POST", {"tree": entries})
        commit = client.request(repo + "/git/commits", "POST", {"message": f"docs(release): 更新 {version} 安装配置与用户说明", "tree": new_tree["sha"], "parents": [head]})
        client.request(repo + "/git/refs/heads/main", "PATCH", {"sha": commit["sha"], "force": False})
        head = commit["sha"]
    verified = client.request(repo + "/git/trees/main?recursive=1")
    if verified.get("truncated") or {x["path"]: x["sha"] for x in verified["tree"] if x["type"] == "blob"} != wanted:
        raise ValueError("Published installation snapshot differs")
    if docs_only:
        print(f"Updated and verified {len(files)} public installation files; version tags unchanged")
        return
    tag = "v" + version
    existing_tag = client.request(repo + "/git/ref/tags/" + tag, missing=True)
    if existing_tag:
        if existing_tag["object"]["sha"] != head:
            raise ValueError("Public version tag already points to a different snapshot")
    else:
        client.request(repo + "/git/refs", "POST", {"ref": "refs/tags/" + tag, "sha": head})
    release_notes = files["RELEASE_NOTES.md"].decode()
    match = re.search(r"^## " + re.escape(version) + r"[^\n]*\n(.*?)(?=^## |\Z)", release_notes, re.S | re.M)
    if not match:
        raise ValueError("Missing user release notes")
    body = match.group(1).strip() + f"\n\n### 容器镜像\n\n```shell\ndocker pull {IMAGE}:{version}\n```\n\n支持平台：`linux/amd64`、`linux/arm64`\n\n[查看容器软件包](https://github.com/users/zgfdada/packages/container/package/{IMAGE_NAME})\n"
    payload = {"tag_name": tag, "name": "JMGLink HA 3D Home Custom " + tag, "body": body, "draft": False, "prerelease": False}
    release = client.request(repo + "/releases/tags/" + tag, missing=True)
    client.request(repo + ("/releases/" + str(release["id"]) if release else "/releases"), "PATCH" if release else "POST", payload)
    print(f"Published and verified {len(files)} installation files, versioned docs/wiki, {tag}")


if __name__ == "__main__":
    files, version = snapshot()
    if "--check" in sys.argv:
        print(f"Public snapshot valid: {len(files)} files, {version}")
    elif "--verify-image" in sys.argv:
        verify_image(version)
    else:
        token = os.environ.get("INSTALLATION_TOKEN")
        if not token:
            raise SystemExit("INSTALLATION_TOKEN is required")
        publish(Client(token), files, version, docs_only="--docs-only" in sys.argv)
