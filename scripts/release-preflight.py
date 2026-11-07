"""Refuse tagging from a checkout with unreviewed or uncommitted files."""
import argparse
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def paths(*args):
    return subprocess.check_output(["git", *args, "-z"], cwd=ROOT).decode("utf-8").strip("\0").split("\0")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--exclude-local", action="append", default=[], metavar="PATH=REASON",
                        help="Explicitly reviewed untracked local file; tracked changes cannot be excluded")
    args = parser.parse_args()
    excluded = {}
    for item in args.exclude_local:
        name, separator, reason = item.partition("=")
        if not separator or not name.strip() or not reason.strip():
            parser.error("--exclude-local requires PATH=REASON")
        excluded[name.replace("\\", "/")] = reason.strip()
    tracked = [p for p in paths("diff", "--name-only", "HEAD") if p]
    untracked = [p for p in paths("ls-files", "--others", "--exclude-standard") if p]
    invalid = sorted(set(excluded) - set(untracked))
    pending = [p for p in untracked if p not in excluded]
    result = {"ok": not (tracked or pending or invalid), "uncommitted": tracked,
              "unreviewedUntracked": pending, "reviewedLocalExclusions": excluded,
              "invalidExclusions": invalid}
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if result["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
