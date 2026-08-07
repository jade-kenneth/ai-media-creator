#!/usr/bin/env node
// PostToolUse hook (Write|Edit|MultiEdit) — surfaces the tenant rule at the
// moment a tenant-owned data path is edited.
//
// A missing tenant constraint is a data-isolation incident, not a style issue,
// and it is invisible in review because the code looks correct — it just
// returns one tenant's rows to another. This hook fires on the files where
// that mistake is possible, and points at the declared classification so the
// answer is a lookup rather than a judgement call.
//
// Advisory: it never blocks. `npm run check-tenant-scope` is the gate.

import { readFileSync, existsSync } from 'node:fs';
import { relative, isAbsolute, basename } from 'node:path';

const projectDir = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
const MANIFEST = 'tenant-scope.config.json';

/** Layers that can compose or drop a tenant filter. */
const DATA_PATH = /^apps\/app-api\/src\/modules\/([^/]+)\/.*\.(ts)$/;
const DATA_PATH_SUFFIXES = ['.repository.ts', '.service.ts', '.resolver.ts', '.controller.ts'];

function readStdin() {
  try {
    return readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

function toRepoRelative(filePath) {
  if (!filePath) return '';

  const normalized = isAbsolute(filePath) ? relative(projectDir, filePath) : filePath;

  return normalized.split('\\').join('/');
}

function loadManifest() {
  const path = `${projectDir}/${MANIFEST}`;

  if (!existsSync(path)) return null;

  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

function main() {
  let input = {};

  try {
    input = JSON.parse(readStdin() || '{}');
  } catch {
    process.exit(0);
  }

  const filePath = toRepoRelative(input?.tool_input?.file_path ?? '');
  const match = filePath.match(DATA_PATH);

  if (!match || !DATA_PATH_SUFFIXES.some((suffix) => filePath.endsWith(suffix))) {
    process.exit(0);
  }

  const moduleName = match[1];
  const manifest = loadManifest();
  const declared = manifest?.modules?.[moduleName];

  if (!declared) {
    process.stderr.write(
      [
        `Tenant scope: module "${moduleName}" is not declared in ${MANIFEST}.`,
        '',
        'Every repository-backed API module must be declared either "tenant-scoped"',
        'or "global" with a reason. Add it, then run: npm run check-tenant-scope',
      ].join('\n'),
    );

    process.exit(0);
  }

  if (declared.scope === 'global') {
    process.stderr.write(
      [
        `Tenant scope: "${moduleName}" is declared global — ${declared.reason}`,
        '',
        'Adding a tenant filter here would be a defect, not a fix. If this edit',
        'introduces tenant-owned data to the module, change the declaration first.',
      ].join('\n'),
    );

    process.exit(0);
  }

  process.stderr.write(
    [
      `Tenant scope: "${moduleName}" is tenant-scoped (${basename(filePath)}).`,
      '',
      '- Read the tenant id from request context via @CurrentTenant(); never from',
      '  client-supplied input.',
      '- Compose scope with the caller filter using applyTenantFilter — add to the',
      "  filter, never replace it, and never let a caller's key overwrite it.",
      '- Thread it resolver → service → repository on reads and writes, including',
      '  count, exists, delete, and any scheduled sweep.',
      '- Evidence must cover both directions: a wrong-tenant id behaves as',
      '  not-found, and the correct tenant still resolves.',
    ].join('\n'),
  );

  process.exit(0);
}

main();
