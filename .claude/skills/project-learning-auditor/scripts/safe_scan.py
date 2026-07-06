#!/usr/bin/env python3
"""
safe_scan.py — deterministic, read-only project scanner for the
Project Learning Auditor skill.

Walks the project from a root directory, applies ignore + secret rules,
classifies every readable file, detects stack signals, collects lightweight
audit signals (path + line only — never the offending value), and emits a JSON
manifest. It NEVER prints the contents of skipped/sensitive files and it NEVER
writes anywhere except the manifest path you pass in and the adjacent
manifest-summary.json.

Usage:
    python3 safe_scan.py [PROJECT_ROOT] [--out PATH] [--max-bytes N] [--quiet]

Defaults:
    PROJECT_ROOT  current working directory
    --out         reference/project-learning-audit/data/manifest.json
    --max-bytes   2000000  (files larger than this are flagged, not read deeply)

Exit code is always 0 on a successful scan; the manifest and summary are the product.
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
AUDIT_EXTS = {".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".vue", ".svelte", ".gql", ".graphql"}
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
_RE_USE_CLIENT_DIRECTIVE = re.compile(r"^\s*['\"]use client['\"]\s*;?\s*$")
_RE_HEAVY_CLIENT_IMPORT = re.compile(
    r"\bfrom\s+['\"](@react-pdf/renderer|jspdf|pdfmake|chart\.js|recharts|three|monaco-editor|moment|lodash)['\"]"
)
_RE_AWAIT_IN_LOOP = re.compile(r"\b(for|for\s+await)\b[\s\S]{0,300}\bawait\b")
_RE_UNBOUNDED_QUERY = re.compile(r"\.(find|aggregate)\s*\(")
_RE_QUERY_BOUND = re.compile(r"\.(limit|lean|paginate|cursor|first|take|skip)\s*\(")
_RE_GRAPHQL_LIST_FIELD = re.compile(r"^\s*[A-Za-z_][A-Za-z0-9_]*\s*(\([^)]*\))?\s*:\s*\[[A-Za-z_]")
_RE_GRAPHQL_PAGINATION_ARG = re.compile(r"\b(first|after|last|before|limit|offset|cursor|page|pagination)\b")
_RE_GRAPHQL_QUERY_TYPE = re.compile(r"^\s*(extend\s+)?type\s+Query\b")

# UI/UX heuristics (frontend components only). File-level absence checks plus one
# per-line accessibility check. See references/16-uiux-audit.md.
_RE_MUTATION = re.compile(r"\buseMutation\b|\bmutateAsync\b|\bmutate\s*\(|\bonSubmit\b|\bhandleSubmit\b")
_RE_QUERY_HOOK = re.compile(r"\buse(Query|InfiniteQuery|SuspenseQuery)\b|\buse[A-Z][A-Za-z0-9]*Query\b")
_RE_PENDING_GUARD = re.compile(r"\bis(Pending|Loading|Submitting)\b|\bdisabled\s*=|\baria-busy\b|accessibilityState")
_RE_LOADING_UI = re.compile(r"\bis(Loading|Pending|Fetching|InitialLoading)\b|Skeleton|Spinner|ActivityIndicator|Suspense|placeholder|<Loading")
_RE_ERROR_UI = re.compile(r"\bisError\b|\bonError\b|\berror\b|\bcatch\s*\(|ErrorState|toast|<Alert|<Error")
_RE_INTERACTIVE_EL = re.compile(r"<(button\b|TouchableOpacity\b|TouchableHighlight\b|TouchableWithoutFeedback\b|Pressable\b)")
_RE_A11Y_LABEL = re.compile(r"aria-label|aria-labelledby|accessibilityLabel")
_RE_ICON_HINT = re.compile(r"\bIcon\b|Ionicons|Feather|MaterialIcons|MaterialCommunityIcons|AntDesign|FontAwesome|Lucide|<svg\b")

# Engineering initiative surface detection. These are intentionally static,
# dependency/name/path based maps so the generated initiatives stay evidence-led
# without reading secrets or inventing integrations.
INITIATIVE_STEP_KEYWORDS = ("lint", "test", "typecheck", "build", "deploy", "publish", "docker")
MIGRATION_SCRIPT_RE = re.compile(r"(migrat|seed|reset)", re.IGNORECASE)
CODEGEN_SCRIPT_RE = re.compile(r"(codegen|generate)", re.IGNORECASE)
MIGRATION_FRAMEWORK_DEPS = ("migrate-mongo", "umzug", "mongration", "prisma", "typeorm", "knex")
SCHEDULER_DEPS = ("@nestjs/schedule", "node-cron", "bullmq", "agenda")
SCHEDULER_SOURCE_MARKERS = (("@Cron(", "@Cron("),)
EVENT_QUEUE_DEPS = ("kafkajs", "amqplib", "bee-queue", "bullmq", "agenda")
GIT_HOOK_DEPS = ("husky", "lint-staged", "@commitlint/cli", "commitlint")
AI_SDK_DEPS = (
    "openai",
    "@anthropic-ai/sdk",
    "@google/generative-ai",
    "langchain",
    "llamaindex",
    "ollama",
)
AI_SDK_PREFIXES = ("@ai-sdk/",)

THIRD_PARTY_DEP_INTEGRATIONS = {
    "@aws-sdk/client-s3": "AWS/S3",
    "@aws-sdk/s3-request-presigner": "AWS/S3",
    "aws-sdk": "AWS/S3",
    "@getbrevo/brevo": "email provider",
    "@sendgrid/mail": "email provider",
    "resend": "email provider",
    "nodemailer": "email provider",
    "expo-notifications": "push provider",
    "firebase-admin": "push provider",
    "@react-native-firebase/messaging": "push provider",
    "kafkajs": "queue",
    "amqplib": "queue",
    "bullmq": "queue",
    "bee-queue": "queue",
    "agenda": "queue",
    "stripe": "payments",
    "paypal-rest-sdk": "payments",
    "@paypal/checkout-server-sdk": "payments",
    "twilio": "SMS",
    "posthog-js": "analytics",
    "@sentry/nextjs": "analytics",
    "@sentry/react-native": "analytics",
    "@googlemaps/google-maps-services-js": "maps",
    "@react-google-maps/api": "maps",
    "mapbox-gl": "maps",
}


def _add_audit_signal(audit: dict, kind: str, rel: str, line_no: int, note: str) -> None:
    bucket = audit.setdefault(kind, [])
    if len(bucket) >= AUDIT_PER_KIND_CAP:
        return
    bucket.append({"path": rel, "line": line_no, "note": note})


def _audit_file(rel: str, lines: list[str], audit: dict) -> None:
    """Append heuristic audit signals for one already-read text file."""
    def add(kind: str, line_no: int, note: str) -> None:
        _add_audit_signal(audit, kind, rel, line_no, note)

    text = "\n".join(lines)
    has_clear = bool(_RE_CLEAR.search(text))
    is_frontend = rel.endswith((".tsx", ".jsx", ".vue", ".svelte")) or "/app/" in rel or "/features/" in rel
    is_backend_data_file = (
        ("/src/modules/" in rel or "/src/libs/" in rel or "/repositories/" in rel)
        and not any(t in rel for t in (".spec.", ".test."))
    )
    in_graphql_query_type = False

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

    # UI/UX file-level absence checks (frontend components only, not tests).
    if is_frontend and not any(t in rel for t in (".spec.", ".test.")):
        m_mut = _RE_MUTATION.search(text)
        has_query = bool(_RE_QUERY_HOOK.search(text))
        if m_mut and not _RE_PENDING_GUARD.search(text):
            line_no = text[: m_mut.start()].count("\n") + 1
            add("button_no_pending_disable", line_no,
                "mutation/submit with no isPending/isSubmitting/disabled/aria-busy guard in file — "
                "action buttons may allow double-submit or spam clicks while the request is in flight")
        if (m_mut or has_query) and not _RE_LOADING_UI.search(text):
            anchor = m_mut or _RE_QUERY_HOOK.search(text)
            line_no = text[: anchor.start()].count("\n") + 1
            add("missing_loading_state", line_no,
                "data fetch/mutation with no loading indicator (isLoading/Skeleton/Spinner/ActivityIndicator) in file")
        if (m_mut or has_query) and not _RE_ERROR_UI.search(text):
            anchor = m_mut or _RE_QUERY_HOOK.search(text)
            line_no = text[: anchor.start()].count("\n") + 1
            add("missing_error_state", line_no,
                "data fetch/mutation with no visible error feedback (isError/onError/catch/toast/Alert) in file")

    for i, line in enumerate(lines, start=1):
        if _RE_TIMER.search(line) and not has_clear:
            add("timer_no_cleanup", i,
                "setInterval/setTimeout with no matching clear* in the same file")
        if _RE_DANGEROUS_HTML.search(line):
            add("dangerous_html", i, "dangerouslySetInnerHTML usage")
        if is_frontend and _RE_INTERACTIVE_EL.search(line):
            window = "\n".join(lines[i - 1: i + 6])
            if _RE_ICON_HINT.search(window) and not _RE_A11Y_LABEL.search(window):
                add("interactive_no_a11y_label", i,
                    "icon-only button/touchable with no aria-label/accessibilityLabel nearby — "
                    "may be unlabeled for screen readers")
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
        if _RE_USE_CLIENT_DIRECTIVE.search(line) and "/app/" in rel and re.search(r"/(page|layout|not-found|global-error)\.(tsx|jsx)$", rel):
            add("next_client_route_boundary", i,
                "Next.js route file marked use client — check bundle size and whether client boundary can move lower")
        if is_frontend and _RE_HEAVY_CLIENT_IMPORT.search(line):
            add("possible_heavy_client_import", i,
                "heavy dependency imported from UI code — check bundle impact and consider dynamic import/code splitting")
        if is_backend_data_file and _RE_UNBOUNDED_QUERY.search(line):
            window = "\n".join(lines[i - 1: i + 8])
            if not _RE_QUERY_BOUND.search(window):
                add("possible_unbounded_query", i,
                    "database find/aggregate without nearby limit/lean/pagination marker")
        if is_backend_data_file and re.search(r"\b(for|for\s+await)\b", line):
            window = "\n".join(lines[i - 1: i + 10])
            if "await" in window:
                add("possible_await_waterfall", i,
                    "await appears inside or near a loop — check for serial API/database waterfall")
        if rel.endswith((".gql", ".graphql")):
            if _RE_GRAPHQL_QUERY_TYPE.search(line):
                in_graphql_query_type = True
            elif in_graphql_query_type and line.strip().startswith("}"):
                in_graphql_query_type = False
            if in_graphql_query_type and _RE_GRAPHQL_LIST_FIELD.search(line) and not _RE_GRAPHQL_PAGINATION_ARG.search(line):
                add("graphql_list_without_pagination", i,
                    "GraphQL root list field without obvious pagination arguments")
        # Hardcoded-secret shape inside readable source (record reason, not value).
        for p in SECRET_CONTENT_PATTERNS:
            if p.search(line):
                add("hardcoded_secret_shape", i,
                    "string matching a secret/key shape found in source")
                break


# --------------------------------------------------------------------------- #
# Engineering initiative surface detection
# --------------------------------------------------------------------------- #

def _read_text(root: str, rel: str, max_bytes: int | None = None) -> str:
    full = os.path.join(root, rel)
    try:
        if max_bytes is not None and os.path.getsize(full) > max_bytes:
            return ""
        with open(full, "r", encoding="utf-8", errors="ignore") as fh:
            return fh.read()
    except OSError:
        return ""


def _first_matching_line(root: str, rel: str, needle: str) -> int:
    text = _read_text(root, rel, 500_000)
    for i, line in enumerate(text.splitlines(), start=1):
        if needle in line:
            return i
    return 1


def _workspace_from_package(rel: str) -> str:
    directory = os.path.dirname(rel)
    return directory or "."


def _script_line(root: str, rel: str, script_name: str) -> int:
    pattern = re.compile(rf'"{re.escape(script_name)}"\s*:')
    text = _read_text(root, rel, 500_000)
    for i, line in enumerate(text.splitlines(), start=1):
        if pattern.search(line):
            return i
    return 1


def _dep_line(root: str, rel: str, dep_name: str) -> int:
    pattern = re.compile(rf'"{re.escape(dep_name)}"\s*:')
    text = _read_text(root, rel, 500_000)
    for i, line in enumerate(text.splitlines(), start=1):
        if pattern.search(line):
            return i
    return 1


def _load_package_jsons(root: str, files: list[dict]) -> list[dict]:
    packages: list[dict] = []
    for entry in files:
        rel = entry["path"]
        if not rel.endswith("package.json"):
            continue
        try:
            with open(os.path.join(root, rel), "r", encoding="utf-8", errors="ignore") as fh:
                pkg = json.load(fh)
        except (OSError, ValueError):
            continue
        deps = {**pkg.get("dependencies", {}), **pkg.get("devDependencies", {})}
        packages.append({
            "workspace": _workspace_from_package(rel),
            "path": rel,
            "name": pkg.get("name") or _workspace_from_package(rel),
            "scripts": pkg.get("scripts", {}),
            "dependencies": sorted(deps.keys()),
        })
    return packages


def _extract_workflow_triggers(text: str) -> dict:
    on_block = ""
    lines = text.splitlines()
    for idx, line in enumerate(lines):
        if re.match(r"^on\s*:", line):
            inline = line.split(":", 1)[1].strip()
            collected = [inline] if inline else []
            for follow in lines[idx + 1:]:
                if follow.strip() and not follow.startswith((" ", "\t", "-")):
                    break
                collected.append(follow.strip())
            on_block = "\n".join(collected)
            break
    haystack = on_block or text
    triggers = {
        "push": bool(re.search(r"\bpush\b", haystack)),
        "pull_request": bool(re.search(r"\bpull_request\b|\bmerge_request\b", haystack)),
        "schedule": bool(re.search(r"\bschedule\b|\bcron\b", haystack)),
        "workflow_dispatch": bool(re.search(r"\bworkflow_dispatch\b|\bmanual\b", haystack)),
    }
    triggers["manual_only"] = triggers["workflow_dispatch"] and not any(
        triggers[key] for key in ("push", "pull_request", "schedule")
    )
    return triggers


def _docker_compose_services(text: str) -> list[str]:
    services: list[str] = []
    in_services = False
    for line in text.splitlines():
        if re.match(r"^services\s*:", line):
            in_services = True
            continue
        if in_services and line.strip() and not line.startswith((" ", "\t")):
            break
        match = re.match(r"^  ([A-Za-z0-9._-]+)\s*:", line)
        if in_services and match and match.group(1) not in {"image", "build", "ports", "environment", "volumes"}:
            services.append(match.group(1))
    return sorted(set(services))


def _collect_ci_surfaces(root: str, files: list[dict]) -> dict:
    workflows: list[dict] = []
    dockerfiles: list[str] = []
    docker_compose: list[dict] = []
    file_paths = {entry["path"] for entry in files}

    for rel in sorted(file_paths):
        low = rel.lower()
        name = os.path.basename(rel)
        is_workflow = (
            (rel.startswith(".github/workflows/") and low.endswith((".yml", ".yaml")))
            or rel in {".gitlab-ci.yml", "Jenkinsfile", "bitbucket-pipelines.yml"}
        )
        if is_workflow:
            text = _read_text(root, rel, 500_000)
            workflows.append({
                "path": rel,
                "line": _first_matching_line(root, rel, "on:") if rel.startswith(".github/") else 1,
                "triggers": _extract_workflow_triggers(text),
                "step_keywords": [
                    keyword for keyword in INITIATIVE_STEP_KEYWORDS
                    if re.search(rf"\b{re.escape(keyword)}\b", text, re.IGNORECASE)
                ],
            })
        if name.lower() == "dockerfile" or name.lower().startswith("dockerfile."):
            dockerfiles.append(rel)
        if name.lower() in {"docker-compose.yml", "docker-compose.yaml", "compose.yml", "compose.yaml"}:
            text = _read_text(root, rel, 500_000)
            docker_compose.append({
                "path": rel,
                "services": _docker_compose_services(text),
            })

    return {
        "workflows": workflows,
        "dockerfiles": sorted(dockerfiles),
        "docker_compose": docker_compose,
        "mobile_build": {
            "eas_json": any(path.endswith("eas.json") for path in file_paths),
            "fastlane": any("/fastlane/" in path or path.startswith("fastlane/") for path in file_paths),
        },
    }


def _collect_migration_surfaces(root: str, files: list[dict], packages: list[dict]) -> dict:
    scripts: list[dict] = []
    migration_files: list[dict] = []
    deps: dict[str, bool] = {dep: False for dep in MIGRATION_FRAMEWORK_DEPS}

    for pkg in packages:
        for name, command in pkg["scripts"].items():
            if MIGRATION_SCRIPT_RE.search(name):
                scripts.append({
                    "workspace": pkg["workspace"],
                    "path": pkg["path"],
                    "line": _script_line(root, pkg["path"], name),
                    "name": name,
                    "command": command,
                })
        for dep in MIGRATION_FRAMEWORK_DEPS:
            if dep in pkg["dependencies"]:
                deps[dep] = True

    for entry in files:
        rel = entry["path"]
        name = os.path.basename(rel)
        if "/dist/" in rel or rel.startswith("dist/"):
            continue
        if ("/scripts/" in rel or "/migrations/" in rel) and MIGRATION_SCRIPT_RE.search(name):
            migration_files.append({"path": rel, "line": 1})

    return {
        "package_scripts": sorted(scripts, key=lambda item: (item["workspace"], item["name"])),
        "files": sorted(migration_files, key=lambda item: item["path"]),
        "framework_dependencies": deps,
    }


def _collect_source_markers(root: str, files: list[dict]) -> list[dict]:
    markers: list[dict] = []
    for entry in files:
        rel = entry["path"]
        ext = entry["ext"]
        if ext not in AUDIT_EXTS or entry.get("sampled_only") or "/dist/" in rel:
            continue
        text = _read_text(root, rel, 500_000)
        for marker, label in SCHEDULER_SOURCE_MARKERS:
            if marker in text:
                markers.append({
                    "path": rel,
                    "line": _first_matching_line(root, rel, marker),
                    "marker": label,
                })
    return sorted(markers, key=lambda item: (item["path"], item["line"], item["marker"]))


def _collect_automation_surfaces(root: str, files: list[dict], packages: list[dict]) -> dict:
    codegen_scripts: list[dict] = []
    scheduler_deps: set[str] = set()
    event_queue_deps: set[str] = set()
    git_hook_tooling: set[str] = set()

    for pkg in packages:
        deps = set(pkg["dependencies"])
        scheduler_deps.update(dep for dep in SCHEDULER_DEPS if dep in deps)
        event_queue_deps.update(dep for dep in EVENT_QUEUE_DEPS if dep in deps)
        git_hook_tooling.update(dep for dep in GIT_HOOK_DEPS if dep in deps)
        for name, command in pkg["scripts"].items():
            if CODEGEN_SCRIPT_RE.search(name):
                codegen_scripts.append({
                    "workspace": pkg["workspace"],
                    "path": pkg["path"],
                    "line": _script_line(root, pkg["path"], name),
                    "name": name,
                    "command": command,
                })

    return {
        "scheduler": {
            "dependencies": sorted(scheduler_deps),
            "source_markers": _collect_source_markers(root, files),
        },
        "event_queue_dependencies": sorted(event_queue_deps),
        "git_hook_tooling": sorted(git_hook_tooling),
        "codegen_scripts": sorted(codegen_scripts, key=lambda item: (item["workspace"], item["name"])),
        "codegen_script_count": len(codegen_scripts),
    }


def _is_ai_dep(dep: str) -> bool:
    return dep in AI_SDK_DEPS or any(dep.startswith(prefix) for prefix in AI_SDK_PREFIXES)


def _is_product_workspace(workspace: str) -> bool:
    return workspace == "." or workspace.startswith("apps/") or workspace.startswith("packages/")


def _collect_ai_surfaces(packages: list[dict]) -> dict:
    by_workspace = []
    for pkg in packages:
        if not _is_product_workspace(pkg["workspace"]):
            continue
        deps = sorted(dep for dep in pkg["dependencies"] if _is_ai_dep(dep))
        if deps:
            by_workspace.append({
                "workspace": pkg["workspace"],
                "path": pkg["path"],
                "dependencies": deps,
            })
    return {
        "dependencies_by_workspace": by_workspace,
        "dependency_names": sorted({
            dep for pkg in by_workspace for dep in pkg["dependencies"]
        }),
    }


def _collect_third_party_surfaces(root: str, packages: list[dict]) -> dict:
    matches: dict[str, list[dict]] = {}
    for pkg in packages:
        for dep in pkg["dependencies"]:
            integration = THIRD_PARTY_DEP_INTEGRATIONS.get(dep)
            if not integration:
                continue
            matches.setdefault(integration, []).append({
                "workspace": pkg["workspace"],
                "path": pkg["path"],
                "line": _dep_line(root, pkg["path"], dep),
                "dependency": dep,
            })
    return {
        "matches": [
            {"integration": integration, "dependencies": sorted(items, key=lambda item: (item["workspace"], item["dependency"]))}
            for integration, items in sorted(matches.items())
        ],
        "integration_names": sorted(matches.keys()),
    }


def collect_initiative_surfaces(root: str, files: list[dict]) -> dict:
    packages = _load_package_jsons(root, files)
    return {
        "cicd": _collect_ci_surfaces(root, files),
        "migrations": _collect_migration_surfaces(root, files, packages),
        "automation": _collect_automation_surfaces(root, files, packages),
        "ai": _collect_ai_surfaces(packages),
        "third_party": _collect_third_party_surfaces(root, packages),
    }


def build_manifest_summary(manifest: dict) -> dict:
    signals = manifest.get("signals", {})
    return {
        "generated_at": manifest.get("generated_at"),
        "root": manifest.get("root"),
        "stats": manifest.get("stats"),
        "signals": {
            "package_name": signals.get("package_name"),
            "scripts": signals.get("scripts", []),
            "has_test_script": signals.get("has_test_script", False),
            "dependencies": signals.get("dependencies", []),
            "markers": signals.get("markers", {}),
            "initiative_surfaces": signals.get("initiative_surfaces", {}),
        },
    }


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
            if is_binary and ext in {".png", ".jpg", ".jpeg", ".webp", ".gif"} and size > 300_000:
                _add_audit_signal(audit, "large_asset", rel, 1,
                                  "image asset over 300 KB — check compression, sizing, and delivery path")
            collect_signals(root, rel, fn, signals)

            # Audit pass: only for code files within the size cap.
            if ext in AUDIT_EXTS and not too_big:
                try:
                    with open(full, "r", encoding="utf-8", errors="ignore") as fh:
                        lines = fh.read().splitlines()
                    _audit_file(rel, lines, audit)
                except OSError:
                    pass

    signals["initiative_surfaces"] = collect_initiative_surfaces(root, files)

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
    ap.add_argument("--summary-out", default=None)
    ap.add_argument("--max-bytes", type=int, default=2_000_000)
    ap.add_argument("--quiet", action="store_true")
    args = ap.parse_args(argv)

    manifest = scan(args.root, args.max_bytes)

    out = args.out
    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    with open(out, "w", encoding="utf-8") as fh:
        json.dump(manifest, fh, indent=2)

    summary_out = args.summary_out or os.path.join(os.path.dirname(out), "manifest-summary.json")
    with open(summary_out, "w", encoding="utf-8") as fh:
        json.dump(build_manifest_summary(manifest), fh, indent=2)

    if not args.quiet:
        s = manifest["stats"]
        print(f"scanned {s['scanned']} files, skipped {s['skipped']}")
        print("by class:", json.dumps(s["by_class"], sort_keys=True))
        if manifest["signals"].get("markers"):
            print("markers:", json.dumps(manifest["signals"]["markers"], sort_keys=True))
        print(f"audit signals: {s['audit_signal_count']}")
        print(f"manifest -> {out}")
        print(f"manifest summary -> {summary_out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
