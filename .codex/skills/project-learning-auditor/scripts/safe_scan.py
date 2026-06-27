#!/usr/bin/env python3
"""
safe_scan.py — deterministic, read-only project scanner for the
Project Learning Auditor skill.

Walks the project from a root directory, applies ignore + secret rules,
classifies every readable file, detects stack signals, collects lightweight
audit signals (path + line only — never the offending value), and emits a JSON
manifest. It NEVER prints the contents of skipped/sensitive files and it NEVER
writes anywhere except the manifest path you pass in.

Usage:
    python3 safe_scan.py [PROJECT_ROOT] [--out PATH] [--max-bytes N] [--quiet]

Defaults:
    PROJECT_ROOT  current working directory
    --out         reference/project-learning-audit/data/manifest.json
    --max-bytes   2000000  (files larger than this are flagged, not read deeply)

Exit code is always 0 on a successful scan; the manifest is the product.
Standard library only — no third-party dependencies.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from datetime import datetime, timezone
from fnmatch import fnmatch

# --------------------------------------------------------------------------- #
# Ignore rules
# --------------------------------------------------------------------------- #

# Directory names that are never worth scanning (generated / vendored / vcs).
IGNORE_DIRS = {
    ".git", ".hg", ".svn",
    "node_modules", "bower_components", "vendor", "Pods",
    "dist", "build", "out", "output",
    ".next", ".nuxt", ".svelte-kit", ".expo", ".expo-shared",
    ".turbo", ".cache", ".parcel-cache", ".vite",
    "coverage", ".nyc_output",
    "__pycache__", ".pytest_cache", ".mypy_cache", ".ruff_cache",
    ".gradle", ".idea", ".vscode-test",
    "DerivedData", "Carthage",
    "logs", "tmp", "temp",
    ".venv", "venv", "env", ".tox",
    ".terraform",
}

# File globs that are never read (secrets, binaries, generated bulk).
IGNORE_FILE_GLOBS = [
    ".env", ".env.*", "*.env",
    "*.pem", "*.key", "*.p12", "*.pfx", "*.crt", "*.cer", "*.der",
    "*.keystore", "*.jks", "id_rsa", "id_dsa", "id_ecdsa", "id_ed25519",
    "*.log", ".DS_Store", "Thumbs.db",
    "*.min.js", "*.min.css", "*.map",
    "*.lock",  # lockfiles are noted via name only, not deep-read
    "*.skill",  # this skill's own package artifact — not project code
]

# Binary / media / archive extensions: recorded but never content-read.
BINARY_EXTS = {
    ".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".ico", ".svgz",
    ".mp4", ".mov", ".avi", ".mkv", ".webm", ".mp3", ".wav", ".flac", ".ogg",
    ".pdf", ".zip", ".tar", ".gz", ".tgz", ".rar", ".7z", ".bz2", ".xz",
    ".woff", ".woff2", ".ttf", ".otf", ".eot",
    ".so", ".dylib", ".dll", ".a", ".o", ".class", ".jar", ".wasm",
    ".pyc", ".pyo", ".bin", ".dat", ".db", ".sqlite", ".sqlite3",
    ".node", ".exe", ".apk", ".ipa", ".aab",
}

# Secret patterns: if a file's name or a sampled line matches, it is skipped
# and only its path + reason are recorded — never its contents.
# Keep name hints narrow: broad words like "token"/"private" wrongly hide
# legitimate source (e.g. a push-tokens module, private-route components).
# Real key material is still caught by IGNORE_FILE_GLOBS + the content patterns.
SECRET_NAME_HINTS = ("secrets", "credentials", "id_rsa", "id_ed25519",
                     "service-account", "google-services")
SECRET_CONTENT_PATTERNS = [
    re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----"),
    re.compile(r"AKIA[0-9A-Z]{16}"),                       # AWS access key id
    re.compile(r"AIza[0-9A-Za-z\-_]{35}"),                 # Google API key
    re.compile(r"sk-[A-Za-z0-9]{20,}"),                    # generic secret key
    re.compile(r"ghp_[A-Za-z0-9]{36}"),                    # GitHub PAT
    re.compile(r"xox[baprs]-[A-Za-z0-9-]{10,}"),           # Slack token
    re.compile(r"(?i)(api[_-]?key|secret|password|passwd|token)\s*[:=]\s*['\"][^'\"]{8,}['\"]"),
]

# --------------------------------------------------------------------------- #
# Classification heuristics
# --------------------------------------------------------------------------- #

CONFIG_NAMES = {
    "package.json", "tsconfig.json", "jsconfig.json", "next.config.js",
    "next.config.mjs", "next.config.ts", "vite.config.ts", "vite.config.js",
    "tailwind.config.js", "tailwind.config.ts", "postcss.config.js",
    "babel.config.js", ".babelrc", "metro.config.js", "app.json", "app.config.js",
    "expo.json", "eas.json", "nx.json", "turbo.json", "pnpm-workspace.yaml",
    "nest-cli.json", "angular.json", "svelte.config.js", "nuxt.config.ts",
    "dockerfile", "docker-compose.yml", "docker-compose.yaml",
    "requirements.txt", "pyproject.toml", "setup.py", "go.mod", "cargo.toml",
    "pom.xml", "build.gradle", "build.gradle.kts", "gemfile", "composer.json",
    ".eslintrc.js", ".eslintrc.json", ".prettierrc", "vercel.json", "netlify.toml",
}

DB_HINTS = ("schema.prisma", "migration", "migrations", "seed", "knexfile",
            "ormconfig", "typeorm", "sequelize", "mongoose", "drizzle")
TEST_HINTS = (".test.", ".spec.", "__tests__", "/tests/", "/test/", "e2e", "cypress", "playwright")
INFRA_HINTS = ("dockerfile", "docker-compose", ".github/workflows", "terraform",
               ".gitlab-ci", "kubernetes", "k8s", "helm", "serverless")
DOC_EXTS = {".md", ".mdx", ".txt", ".rst", ".adoc"}

FRONTEND_EXTS = {".tsx", ".jsx", ".vue", ".svelte", ".html", ".css", ".scss",
                 ".sass", ".less", ".styl"}
CODE_EXTS = {".ts", ".js", ".mjs", ".cjs", ".py", ".go", ".rb", ".java", ".kt",
             ".rs", ".php", ".cs", ".swift", ".c", ".cpp", ".h", ".hpp"}

# Extensions we are willing to read line-by-line for audit signals.
AUDIT_EXTS = {".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".vue", ".svelte"}
# Cap audit signals per kind so the manifest stays small and reviewable.
AUDIT_PER_KIND_CAP = 60


def classify(rel_path: str, name: str, ext: str) -> str:
    low = rel_path.lower()
    if name.lower() in CONFIG_NAMES or ext in {".yml", ".yaml", ".toml", ".ini"}:
        if any(h in low for h in INFRA_HINTS):
            return "infra"
        return "config"
    if any(h in low for h in INFRA_HINTS):
        return "infra"
    if any(h in low for h in DB_HINTS) or ext == ".sql" or ".prisma" in low:
        return "database"
    if any(h in low for h in TEST_HINTS):
        return "test"
    if ext in DOC_EXTS:
        return "docs"
    if ext in FRONTEND_EXTS:
        return "frontend"
    # Heuristic: client-ish folders vs server-ish folders for shared code exts
    if ext in CODE_EXTS:
        if any(s in low for s in ("/components/", "/pages/", "/app/", "/screens/",
                                  "/hooks/", "/features/", "/ui/", "/views/", "client")):
            return "frontend"
        if any(s in low for s in ("/controllers/", "/services/", "/routes/", "/api/",
                                  "/middleware/", "/repositories/", "/resolvers/",
                                  "/modules/", "server", "backend")):
            return "backend"
        return "backend" if ext in {".py", ".go", ".rb", ".java", ".kt", ".rs", ".php", ".cs"} else "frontend"
    return "unknown"


# --------------------------------------------------------------------------- #
# Audit signal detection (read-only, regex-level, never records values)
# --------------------------------------------------------------------------- #

# Decorators / markers used to recognise NestJS server entry points & guards.
GUARD_MARKERS = ("@UseGuards", "@Roles", "@Public", "@Auth", "@SkipAuth",
                 "AuthGuard", "RolesGuard", "@CurrentUser")
RESOLVER_DECL = re.compile(r"@(Query|Mutation|Subscription|Get|Post|Put|Patch|Delete)\s*\(")
VALIDATION_MARKERS = ("class-validator", "@IsString", "@IsInt", "@IsNotEmpty",
                      "ValidationPipe", "zod", "z.object", "yup", "@Field")
TENANT_MARKERS = ("tenantId", "barangayId", "tenant_id", "barangay_id")

_RE_TIMER = re.compile(r"\b(setInterval|setTimeout)\s*\(")
_RE_CLEAR = re.compile(r"\b(clearInterval|clearTimeout)\s*\(")
_RE_USE_EFFECT = re.compile(r"\buseEffect\s*\(")
_RE_SUBSCRIBE = re.compile(r"addEventListener|\.subscribe\(|setInterval|setTimeout|new\s+WebSocket")
_RE_DANGEROUS_HTML = re.compile(r"dangerouslySetInnerHTML")
_RE_MAP = re.compile(r"\.map\s*\(")
_RE_QUERY_CALL = re.compile(r"\b(findOne|findMany|findFirst|findById|aggregate|\.exec\(|\.query\(|\.lean\()")


def _audit_file(rel: str, lines: list[str], audit: dict) -> None:
    """Append heuristic audit signals for one already-read text file."""
    def add(kind: str, line_no: int, note: str) -> None:
        bucket = audit.setdefault(kind, [])
        if len(bucket) >= AUDIT_PER_KIND_CAP:
            return
        bucket.append({"path": rel, "line": line_no, "note": note})

    text = "\n".join(lines)
    has_clear = bool(_RE_CLEAR.search(text))

    # NestJS resolver/controller without any guard decorator in the file.
    if RESOLVER_DECL.search(text):
        if not any(m in text for m in GUARD_MARKERS):
            m = RESOLVER_DECL.search(text)
            line_no = text[: m.start()].count("\n") + 1
            add("resolver_no_guard", line_no,
                "server entry point with no guard/role decorator detected in file")
        # Validation marker absence is a weaker hint.
        if not any(v in text for v in VALIDATION_MARKERS):
            m = RESOLVER_DECL.search(text)
            line_no = text[: m.start()].count("\n") + 1
            add("possible_missing_validation", line_no,
                "server entry point with no validation/DTO marker detected in file")

    for i, line in enumerate(lines, start=1):
        if _RE_TIMER.search(line) and not has_clear:
            add("timer_no_cleanup", i,
                "setInterval/setTimeout with no matching clear* in the same file")
        if _RE_DANGEROUS_HTML.search(line):
            add("dangerous_html", i, "dangerouslySetInnerHTML usage")
        if _RE_USE_EFFECT.search(line):
            # Look at the next ~25 lines for a subscription/timer with no return.
            window = "\n".join(lines[i - 1: i + 24])
            if _RE_SUBSCRIBE.search(window) and "return" not in window:
                add("effect_no_cleanup", i,
                    "useEffect creates a subscription/timer with no cleanup return nearby")
        if _RE_MAP.search(line):
            window = "\n".join(lines[i - 1: i + 6])
            if "await" in window and _RE_QUERY_CALL.search(window):
                add("possible_n1_query", i,
                    "awaited query inside a .map() — potential N+1")
        # Hardcoded-secret shape inside readable source (record reason, not value).
        for p in SECRET_CONTENT_PATTERNS:
            if p.search(line):
                add("hardcoded_secret_shape", i,
                    "string matching a secret/key shape found in source")
                break


# --------------------------------------------------------------------------- #
# Scanning
# --------------------------------------------------------------------------- #

def load_gitignore_dirs(root: str) -> set[str]:
    """Best-effort: pull simple directory names out of .gitignore to also skip."""
    extra: set[str] = set()
    gi = os.path.join(root, ".gitignore")
    try:
        with open(gi, "r", encoding="utf-8", errors="ignore") as fh:
            for line in fh:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                line = line.rstrip("/")
                if "/" not in line and "*" not in line and "." not in line[:1]:
                    extra.add(line)
    except OSError:
        pass
    return extra


def is_ignored_file(name: str) -> bool:
    lname = name.lower()
    return any(fnmatch(lname, g.lower()) for g in IGNORE_FILE_GLOBS)


def looks_secret(path: str, name: str, ext: str, max_bytes: int) -> bool:
    lname = name.lower()
    if any(h in lname for h in SECRET_NAME_HINTS):
        return True
    if ext in BINARY_EXTS:
        return False
    try:
        if os.path.getsize(path) > max_bytes:
            return False
        with open(path, "r", encoding="utf-8", errors="ignore") as fh:
            sample = fh.read(65536)
    except OSError:
        return False
    return any(p.search(sample) for p in SECRET_CONTENT_PATTERNS)


def scan(root: str, max_bytes: int) -> dict:
    root = os.path.abspath(root)
    ignore_dirs = IGNORE_DIRS | load_gitignore_dirs(root)
    # Never descend into the output folder.
    ignore_dirs.add("reference")
    ignore_dirs.add(".projectmentor")

    files: list[dict] = []
    skipped: list[dict] = []
    classes: dict[str, int] = {}
    signals: dict[str, object] = {}
    audit: dict[str, list] = {}

    for dirpath, dirnames, filenames in os.walk(root):
        # Prune ignored directories in place (also dot-dirs except a safe few).
        dirnames[:] = [
            d for d in dirnames
            if d not in ignore_dirs
            and not (d.startswith(".") and d not in {".github", ".vscode"})
        ]
        for fn in filenames:
            full = os.path.join(dirpath, fn)
            rel = os.path.relpath(full, root)
            ext = os.path.splitext(fn)[1].lower()

            if is_ignored_file(fn):
                skipped.append({"path": rel, "reason": "ignored-file-glob"})
                continue
            try:
                size = os.path.getsize(full)
            except OSError:
                skipped.append({"path": rel, "reason": "unreadable"})
                continue

            if looks_secret(full, fn, ext, max_bytes):
                skipped.append({"path": rel, "reason": "looks-sensitive"})
                continue

            is_binary = ext in BINARY_EXTS
            too_big = size > max_bytes
            cls = "generated" if is_binary else classify(rel, fn, ext)
            classes[cls] = classes.get(cls, 0) + 1
            files.append({
                "path": rel,
                "class": cls,
                "ext": ext,
                "size": size,
                "binary": is_binary,
                "sampled_only": too_big and not is_binary,
            })
            collect_signals(root, rel, fn, signals)

            # Audit pass: only for code files within the size cap.
            if ext in AUDIT_EXTS and not too_big:
                try:
                    with open(full, "r", encoding="utf-8", errors="ignore") as fh:
                        lines = fh.read().splitlines()
                    _audit_file(rel, lines, audit)
                except OSError:
                    pass

    audit_signals = [
        {"kind": kind, **entry}
        for kind, entries in sorted(audit.items())
        for entry in entries
    ]

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "root": root,
        "stats": {
            "scanned": len(files),
            "skipped": len(skipped),
            "by_class": classes,
            "audit_signal_count": len(audit_signals),
        },
        "signals": signals,
        "files": sorted(files, key=lambda f: f["path"]),
        "skipped": sorted(skipped, key=lambda s: s["path"]),
        "audit_signals": sorted(audit_signals, key=lambda a: (a["kind"], a["path"], a["line"])),
    }


def collect_signals(root: str, rel: str, name: str, signals: dict) -> None:
    """Cheap framework/stack detection from filenames + package.json deps."""
    low = rel.lower()
    markers = signals.setdefault("markers", {})

    def mark(key: str) -> None:
        markers[key] = markers.get(key, 0) + 1

    if name == "package.json":
        # Read deps for richer signal (safe, small files). Aggregate across the
        # monorepo so a workspace's deps still register.
        try:
            with open(os.path.join(root, rel), "r", encoding="utf-8", errors="ignore") as fh:
                pkg = json.load(fh)
            deps = {**pkg.get("dependencies", {}), **pkg.get("devDependencies", {})}
            is_root = "/" not in rel.strip("./")
            if is_root:
                signals["package_name"] = pkg.get("name")
                signals["scripts"] = sorted(pkg.get("scripts", {}).keys())
                signals["has_test_script"] = any(
                    "test" in s for s in pkg.get("scripts", {})
                )
            agg = set(signals.get("dependencies", []))
            agg.update(deps.keys())
            signals["dependencies"] = sorted(agg)
        except (OSError, ValueError):
            pass

    for needle, key in (
        ("next.config", "nextjs"), ("vite.config", "vite"),
        ("tailwind.config", "tailwind"), ("nest-cli", "nestjs"),
        ("app.json", "expo"), ("metro.config", "react-native"),
        ("schema.prisma", "prisma"), ("nuxt.config", "nuxt"),
        ("svelte.config", "svelte"), ("angular.json", "angular"),
        ("dockerfile", "docker"), ("docker-compose", "docker-compose"),
        (".github/workflows", "github-actions"), ("requirements.txt", "python"),
        ("pyproject.toml", "python"), ("go.mod", "go"), ("cargo.toml", "rust"),
        ("pom.xml", "java-maven"), ("build.gradle", "gradle"),
        (".graphql", "graphql"), (".gql", "graphql"), ("schema.gql", "graphql"),
    ):
        if needle in low:
            mark(key)


# --------------------------------------------------------------------------- #
# CLI
# --------------------------------------------------------------------------- #

def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(description="Safe read-only project scanner.")
    ap.add_argument("root", nargs="?", default=os.getcwd())
    ap.add_argument("--out", default=os.path.join(
        "reference", "project-learning-audit", "data", "manifest.json"))
    ap.add_argument("--max-bytes", type=int, default=2_000_000)
    ap.add_argument("--quiet", action="store_true")
    args = ap.parse_args(argv)

    manifest = scan(args.root, args.max_bytes)

    out = args.out
    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    with open(out, "w", encoding="utf-8") as fh:
        json.dump(manifest, fh, indent=2)

    if not args.quiet:
        s = manifest["stats"]
        print(f"scanned {s['scanned']} files, skipped {s['skipped']}")
        print("by class:", json.dumps(s["by_class"], sort_keys=True))
        if manifest["signals"].get("markers"):
            print("markers:", json.dumps(manifest["signals"]["markers"], sort_keys=True))
        print(f"audit signals: {s['audit_signal_count']}")
        print(f"manifest -> {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
