"""Sync readable skill resources into the service; ZIPs are made on download."""
from pathlib import Path
import argparse
import json

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "jmglink-ha-3d-home/source"
PACKAGES = ("ha3d-ha-assistant", "ha3d-hermes-telegram")

def build(name):
    files = {}
    for path in sorted((ROOT / "agent-skills" / name).rglob("*")):
        if path.is_file() and "__pycache__" not in path.parts:
            files[str(path.relative_to(ROOT / "agent-skills" / name)).replace("\\", "/")] = path.read_bytes()
    files["references/configuration.md"] = (ROOT / "docs/语音助手配置.md").read_bytes()
    for path, target in [("apps/server/src/voice-assistant/VoiceAssistant.js", "references/VoiceAssistant.js"), ("apps/web/src/domain/push-to-talk.js", "references/push-to-talk.js")]:
        files[target] = (SOURCE / path).read_bytes()
    for filename in ("voice-interaction.js", "voice-playback.js", "voice-assistant-api.js"):
        files["references/" + filename] = (SOURCE / "apps/web/src/domain" / filename).read_bytes()
    for filename in ("voice-clarification.jsx", "voice-assistant-settings.jsx"):
        files["references/" + filename] = (SOURCE / "apps/web/src/app" / filename).read_bytes()
    if name == "ha3d-hermes-telegram":
        for filename in ("plugin.yaml", "__init__.py", "test_bridge.py"):
            files["scripts/hermes-telegram-bridge/" + filename] = (ROOT / "integrations/hermes-telegram-bridge" / filename).read_bytes()
    return files

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    for name in PACKAGES:
        target = SOURCE / "apps/server/resources/agent-skills" / name
        files = build(name)
        files["manifest.json"] = (json.dumps({"name":name, "files":sorted(files)}, ensure_ascii=False, indent=2)+"\n").encode()
        for filename, data in files.items():
            destination = target / filename
            if args.check:
                if not destination.exists() or destination.read_bytes() != data:
                    raise SystemExit("Skill document is stale: " + name + "/" + filename)
            else:
                destination.parent.mkdir(parents=True, exist_ok=True)
                destination.write_bytes(data)
        print(name + ": OK")

if __name__ == "__main__":
    main()
