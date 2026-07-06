#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)"
OUT_DIR="$(mktemp -d)"
trap 'rm -rf "$OUT_DIR"' EXIT

python3 "$ROOT/.claude/skills/project-learning-auditor/scripts/safe_scan.py" \
  "$ROOT" \
  --out "$OUT_DIR/manifest.json" \
  --summary-out "$OUT_DIR/manifest-summary.json" \
  --quiet

python3 - "$OUT_DIR/manifest.json" "$OUT_DIR/manifest-summary.json" <<'PY'
import json
import sys

required = {"cicd", "migrations", "automation", "ai", "third_party"}

for path in sys.argv[1:]:
    with open(path, "r", encoding="utf-8") as fh:
        data = json.load(fh)
    signals = data.get("signals", {})
    surfaces = signals.get("initiative_surfaces")
    assert isinstance(surfaces, dict), f"{path}: missing signals.initiative_surfaces"
    missing = required - set(surfaces)
    assert not missing, f"{path}: missing initiative surface keys: {sorted(missing)}"

    assert isinstance(surfaces["cicd"].get("workflows"), list), f"{path}: cicd.workflows must be a list"
    assert isinstance(surfaces["migrations"].get("package_scripts"), list), f"{path}: migrations.package_scripts must be a list"
    assert isinstance(surfaces["automation"].get("codegen_scripts"), list), f"{path}: automation.codegen_scripts must be a list"
    assert isinstance(surfaces["ai"].get("dependency_names"), list), f"{path}: ai.dependency_names must be a list"
    assert isinstance(surfaces["third_party"].get("integration_names"), list), f"{path}: third_party.integration_names must be a list"

print("project-learning-auditor selftest passed")
PY
