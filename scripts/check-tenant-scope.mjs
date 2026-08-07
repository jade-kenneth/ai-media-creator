#!/usr/bin/env node
// Tenant-isolation classification gate.
//
// A missing tenant constraint is a data-isolation incident, not a functional
// defect, and it is invisible in review: the code reads correctly and simply
// returns another tenant's rows. This script makes the classification explicit
// and machine-checked, so a new module cannot reach main with an undeclared
// data path.
//
// WHAT THIS PROVES: every repository-backed module is consciously classified;
// tenant-scoped modules persist the tenant field, index it, and reference the
// scoping helper; global modules carry a stated reason.
//
// WHAT THIS DOES NOT PROVE: that every individual query composes the scope
// correctly. That is dataflow, not pattern matching, and it belongs to review
// and to the wrong-tenant tests. This gate closes the "nobody thought about it"
// failure, not the "thought about it and got it wrong" failure.
//
// Usage: node scripts/check-tenant-scope.mjs [--json]

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const MANIFEST = 'tenant-scope.config.json';
const MODULES_DIR = 'apps/app-api/src/modules';
const VALID_SCOPES = new Set(['tenant-scoped', 'global', 'no-persistence']);

const asJson = process.argv.includes('--json');
const problems = [];
const notes = [];

function fail(module, message, fix) {
  problems.push({ module, message, fix });
}

function read(path) {
  try {
    return readFileSync(join(root, path), 'utf8');
  } catch {
    return '';
  }
}

function listDirectories(path) {
  const absolute = join(root, path);

  if (!existsSync(absolute)) return [];

  return readdirSync(absolute)
    .filter((entry) => statSync(join(absolute, entry)).isDirectory())
    .sort();
}

function listFilesRecursive(path) {
  const absolute = join(root, path);

  if (!existsSync(absolute)) return [];

  const files = [];

  for (const entry of readdirSync(absolute, { withFileTypes: true })) {
    const child = join(path, entry.name);

    if (entry.isDirectory()) {
      files.push(...listFilesRecursive(child));
    } else if (entry.name.endsWith('.ts')) {
      files.push(child);
    }
  }

  return files;
}

// ── Load the manifest ────────────────────────────────────────────────────────

let manifest;

try {
  manifest = JSON.parse(read(MANIFEST));
} catch (error) {
  console.error(`✗ Could not parse ${MANIFEST}: ${error.message}`);
  process.exit(1);
}

const tenantField = manifest.tenantField;
const filterHelper = manifest.tenantFilterHelper;
const declared = manifest.modules ?? {};

if (!tenantField || !filterHelper) {
  console.error(
    `✗ ${MANIFEST} must define tenantField and tenantFilterHelper.`,
  );
  process.exit(1);
}

// ── Every module on disk must be declared, and vice versa ────────────────────

const onDisk = listDirectories(MODULES_DIR);

for (const module of onDisk) {
  if (!declared[module]) {
    fail(
      module,
      'is not declared in the tenant-scope manifest',
      `Add "${module}" to ${MANIFEST} with scope "tenant-scoped", "global", or "no-persistence".`,
    );
  }
}

for (const module of Object.keys(declared)) {
  if (!onDisk.includes(module)) {
    fail(
      module,
      'is declared in the manifest but does not exist on disk',
      `Remove "${module}" from ${MANIFEST}.`,
    );
  }
}

// ── Per-module rules ─────────────────────────────────────────────────────────

for (const module of onDisk) {
  const declaration = declared[module];

  if (!declaration) continue;

  const { scope, reason } = declaration;

  if (!VALID_SCOPES.has(scope)) {
    fail(
      module,
      `has invalid scope "${scope}"`,
      `Use one of: ${[...VALID_SCOPES].join(', ')}.`,
    );
    continue;
  }

  const moduleDir = join(MODULES_DIR, module);
  const repositoryDir = join(moduleDir, 'repositories');
  const hasRepository = existsSync(join(root, repositoryDir));

  // A stated reason is what makes a non-default classification reviewable.
  if ((scope === 'global' || scope === 'no-persistence') && !reason?.trim()) {
    fail(
      module,
      `is declared "${scope}" without a reason`,
      'State why this module deliberately holds no tenant scope. An unexplained exemption is indistinguishable from an oversight.',
    );
  }

  if (scope === 'no-persistence' && hasRepository) {
    fail(
      module,
      'is declared "no-persistence" but owns a repositories/ directory',
      `Reclassify "${module}" as tenant-scoped or global.`,
    );
  }

  if (scope !== 'tenant-scoped') continue;

  // ── tenant-scoped modules ──────────────────────────────────────────────────

  if (!hasRepository) {
    fail(
      module,
      'is declared "tenant-scoped" but owns no repository',
      'Only modules that own a collection can be tenant-scoped. Use "no-persistence" if it reads through another module.',
    );
    continue;
  }

  const repositoryFiles = listFilesRecursive(repositoryDir).filter((file) =>
    file.endsWith('.repository.ts'),
  );

  if (repositoryFiles.length === 0) {
    fail(
      module,
      'has a repositories/ directory with no *.repository.ts file',
      'Check the module layout.',
    );
    continue;
  }

  for (const file of repositoryFiles) {
    const source = read(file);

    // The record type and the schema must both carry the field: a record type
    // that declares it without a schema entry silently drops it on write.
    if (!source.includes(tenantField)) {
      fail(
        module,
        `repository does not declare "${tenantField}" (${file})`,
        `Add ${tenantField} to the record interface and to the schema definition, and index it.`,
      );
      continue;
    }

    // An unindexed tenant field turns every scoped read into a collection scan.
    const indexBlock = source.slice(source.indexOf('['), source.length);

    if (!new RegExp(`\\{\\s*${tenantField}\\s*:\\s*1`).test(indexBlock)) {
      fail(
        module,
        `does not index "${tenantField}" (${file})`,
        `Add an index beginning with ${tenantField} — an unindexed tenant filter scans the whole collection.`,
      );
    }
  }

  // The service layer is where scope is composed. Requiring the helper by name
  // keeps composition in one reviewed implementation rather than each module
  // hand-rolling a filter merge.
  const serviceFiles = listFilesRecursive(moduleDir).filter(
    (file) => file.endsWith('.service.ts') && !file.endsWith('.spec.ts'),
  );

  const servicesWithHelper = serviceFiles.filter((file) =>
    read(file).includes(filterHelper),
  );

  // A module may own tenant data and still have no tenant-scoped read: when
  // every lookup is keyed by a globally unique external identifier reached from
  // a context that carries no tenant (a provider webhook, for example). That is
  // a legitimate shape, but it has to be declared and justified rather than
  // inferred from the absence of the helper.
  const readsExempt = declaration.unscopedReads?.allReads === true;

  if (readsExempt && !declaration.unscopedReads?.reason?.trim()) {
    fail(
      module,
      'declares unscopedReads.allReads without a reason',
      'State why no read path can carry tenant context. An unexplained exemption is indistinguishable from an oversight.',
    );
  }

  if (
    serviceFiles.length > 0 &&
    servicesWithHelper.length === 0 &&
    !readsExempt
  ) {
    fail(
      module,
      `service never calls ${filterHelper}()`,
      `Compose tenant scope through ${filterHelper}(filter, tenantId) so the scope is added to the caller's filter rather than replacing it, or declare unscopedReads.allReads with a reason if no read path can carry tenant context.`,
    );
  }

  // Cross-tenant behavior is the part a static check cannot verify. Requiring
  // the test to exist is the closest enforceable proxy.
  const specFiles = listFilesRecursive(moduleDir).filter((file) =>
    file.endsWith('.spec.ts'),
  );

  const hasWrongTenantTest = specFiles.some((file) => {
    const source = read(file).toLowerCase();

    return (
      source.includes('tenant') &&
      (source.includes('wrong tenant') ||
        source.includes('another tenant') ||
        source.includes('other tenant') ||
        source.includes('different tenant') ||
        source.includes('cross-tenant'))
    );
  });

  if (!hasWrongTenantTest) {
    fail(
      module,
      'has no wrong-tenant test',
      'Add a spec asserting that a valid id belonging to another tenant behaves as not-found, and that the correct tenant still resolves.',
    );
  }
}

// ── Report ───────────────────────────────────────────────────────────────────

const summary = {
  tenantScoped: Object.values(declared).filter(
    (d) => d.scope === 'tenant-scoped',
  ).length,
  global: Object.values(declared).filter((d) => d.scope === 'global').length,
  noPersistence: Object.values(declared).filter(
    (d) => d.scope === 'no-persistence',
  ).length,
};

if (asJson) {
  console.log(
    JSON.stringify(
      { ok: problems.length === 0, summary, problems, notes },
      null,
      2,
    ),
  );
  process.exit(problems.length === 0 ? 0 : 1);
}

if (problems.length > 0) {
  console.error(
    `✗ Tenant-scope check failed with ${problems.length} problem(s):\n`,
  );

  for (const problem of problems) {
    console.error(`  ${problem.module} — ${problem.message}`);
    console.error(`    fix: ${problem.fix}\n`);
  }

  console.error(
    'A missing tenant constraint is a security defect, not a style issue.\n' +
      'Declared exemptions are fine; undeclared data paths are not.',
  );

  process.exit(1);
}

console.log(
  `✓ Tenant scope: ${summary.tenantScoped} tenant-scoped, ` +
    `${summary.global} global (declared), ${summary.noPersistence} without persistence.`,
);
console.log(
  '  Verified: classification, tenant field persisted and indexed, scoping helper used,\n' +
    '  wrong-tenant test present. Per-query composition is verified by review and tests.',
);
