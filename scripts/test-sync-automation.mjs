#!/usr/bin/env node
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPTS = path.dirname(fileURLToPath(import.meta.url));
const TEMP = fs.mkdtempSync(path.join(os.tmpdir(), 'sync-automation-'));

function run(args, cwd) {
  return execFileSync(args[0], args.slice(1), {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function git(cwd, ...args) {
  return run(['git', ...args], cwd);
}

function initialize(cwd) {
  fs.mkdirSync(cwd, { recursive: true });
  git(cwd, 'init', '--quiet', '-b', 'main');
  git(cwd, 'config', 'user.email', 'sync-test@example.com');
  git(cwd, 'config', 'user.name', 'Sync Test');
}

function commit(cwd, message, { allowEmpty = false } = {}) {
  git(cwd, 'add', '.');
  git(cwd, 'commit', '--quiet', ...(allowEmpty ? ['--allow-empty'] : []), '-m', message);
  return git(cwd, 'rev-parse', 'HEAD');
}

function expectFailure(args, cwd, expectedMessage) {
  try {
    run(args, cwd);
    assert.fail(`Expected command to fail: ${args.join(' ')}`);
  } catch (error) {
    const output = `${error.stdout || ''}\n${error.stderr || ''}\n${error.message || ''}`;
    assert.match(output, expectedMessage);
  }
}

function testTemplateStartingRevision() {
  const upstream = path.join(TEMP, 'boilerplate-upstream');
  const product = path.join(TEMP, 'template-product');
  initialize(upstream);
  fs.mkdirSync(path.join(upstream, 'scripts'), { recursive: true });
  fs.copyFileSync(
    path.join(SCRIPTS, 'boilerplate-sync.mjs'),
    path.join(upstream, 'scripts', 'boilerplate-sync.mjs'),
  );
  fs.writeFileSync(
    path.join(upstream, 'boilerplate.lock.json'),
    `${JSON.stringify({ repository: upstream, ref: 'main', reviewedThroughSha: null, appliedUpdates: [] }, null, 2)}\n`,
  );
  const sourceSha = commit(upstream, 'chore: template source');

  fs.mkdirSync(path.join(product, 'scripts'), { recursive: true });
  fs.copyFileSync(
    path.join(upstream, 'scripts', 'boilerplate-sync.mjs'),
    path.join(product, 'scripts', 'boilerplate-sync.mjs'),
  );
  fs.copyFileSync(
    path.join(upstream, 'boilerplate.lock.json'),
    path.join(product, 'boilerplate.lock.json'),
  );
  initialize(product);
  commit(product, 'chore: create product from template');
  git(product, 'remote', 'add', 'origin', path.join(TEMP, 'product-origin'));

  fs.writeFileSync(path.join(upstream, 'upstream-change.md'), '# New upstream change\n');
  const latestSha = commit(upstream, 'fix: later upstream change');
  run(['node', 'scripts/boilerplate-sync.mjs', 'setup'], product);

  const lock = JSON.parse(fs.readFileSync(path.join(product, 'boilerplate.lock.json'), 'utf8'));
  assert.equal(lock.reviewedThroughSha, sourceSha);
  assert.notEqual(lock.reviewedThroughSha, latestSha);
  const report = run(['node', 'scripts/boilerplate-sync.mjs', 'check'], product);
  assert.match(report, /1 boilerplate update\(s\) are available/);
}

function testAmbiguousTemplateStartingRevision() {
  const upstream = path.join(TEMP, 'ambiguous-boilerplate-upstream');
  const product = path.join(TEMP, 'ambiguous-template-product');
  initialize(upstream);
  fs.mkdirSync(path.join(upstream, 'scripts'), { recursive: true });
  fs.copyFileSync(
    path.join(SCRIPTS, 'boilerplate-sync.mjs'),
    path.join(upstream, 'scripts', 'boilerplate-sync.mjs'),
  );
  fs.writeFileSync(
    path.join(upstream, 'boilerplate.lock.json'),
    `${JSON.stringify({ repository: upstream, ref: 'main', reviewedThroughSha: null, appliedUpdates: [] }, null, 2)}\n`,
  );
  const sourceSha = commit(upstream, 'chore: template source');
  const sourceTree = git(upstream, 'rev-parse', `${sourceSha}^{tree}`);

  fs.mkdirSync(path.join(product, 'scripts'), { recursive: true });
  fs.copyFileSync(
    path.join(upstream, 'scripts', 'boilerplate-sync.mjs'),
    path.join(product, 'scripts', 'boilerplate-sync.mjs'),
  );
  fs.copyFileSync(
    path.join(upstream, 'boilerplate.lock.json'),
    path.join(product, 'boilerplate.lock.json'),
  );
  initialize(product);
  commit(product, 'chore: create product from template');
  git(product, 'remote', 'add', 'origin', path.join(TEMP, 'ambiguous-product-origin'));

  fs.writeFileSync(path.join(upstream, 'temporary-change.md'), '# Temporary change\n');
  commit(upstream, 'feat: temporary upstream change');
  fs.rmSync(path.join(upstream, 'temporary-change.md'));
  const revertedSha = commit(upstream, 'revert: temporary upstream change');
  assert.equal(git(upstream, 'rev-parse', `${revertedSha}^{tree}`), sourceTree);

  expectFailure(
    ['node', 'scripts/boilerplate-sync.mjs', 'setup'],
    product,
    /matches multiple boilerplate revisions.*--sha/s,
  );
  const unresolvedLock = JSON.parse(
    fs.readFileSync(path.join(product, 'boilerplate.lock.json'), 'utf8'),
  );
  assert.equal(unresolvedLock.reviewedThroughSha, null);

  run(['node', 'scripts/boilerplate-sync.mjs', 'setup', '--sha', sourceSha], product);
  const lock = JSON.parse(fs.readFileSync(path.join(product, 'boilerplate.lock.json'), 'utf8'));
  assert.equal(lock.reviewedThroughSha, sourceSha);
  const report = run(['node', 'scripts/boilerplate-sync.mjs', 'check'], product);
  assert.match(report, /2 boilerplate update\(s\) are available/);
}

function testSkillsBranchMembership() {
  const upstream = path.join(TEMP, 'skills-upstream');
  const app = path.join(TEMP, 'skills-app');
  initialize(upstream);
  fs.mkdirSync(path.join(upstream, 'scripts'), { recursive: true });
  fs.writeFileSync(
    path.join(upstream, 'scripts', 'build-agents-md.js'),
    "const fs=require('fs');fs.writeFileSync(process.argv[2],`Source revision: ${process.env.SKILLS_SOURCE_SHA}\\n`);\n",
  );
  const mainSha = commit(upstream, 'chore: skills main');
  git(upstream, 'switch', '--quiet', '-c', 'unmerged');
  const unmergedSha = commit(upstream, 'test: unmerged revision', { allowEmpty: true });
  git(upstream, 'switch', '--quiet', 'main');

  fs.mkdirSync(path.join(app, 'scripts'), { recursive: true });
  fs.copyFileSync(path.join(SCRIPTS, 'sync-skills.mjs'), path.join(app, 'scripts', 'sync-skills.mjs'));
  fs.writeFileSync(
    path.join(app, 'skills-source.lock.json'),
    `${JSON.stringify({ repository: upstream, ref: 'main', sha: mainSha }, null, 2)}\n`,
  );
  fs.writeFileSync(path.join(app, 'AGENTS.md'), `Source revision: ${mainSha}\n`);

  expectFailure(
    ['node', 'scripts/sync-skills.mjs', 'update', '--sha', unmergedSha],
    app,
    /is not part of/,
  );
  expectFailure(
    ['node', 'scripts/sync-skills.mjs', 'update', '--sha'],
    app,
    /--sha must be followed by a full 40-character commit SHA/,
  );
  run(['node', 'scripts/sync-skills.mjs', 'update', '--sha', mainSha], app);
  run(['node', 'scripts/sync-skills.mjs', 'check'], app);

  const repeatHydrate = run(['node', 'scripts/sync-skills.mjs', 'hydrate'], app);
  assert.match(repeatHydrate, /already hydrated/);

  const crossShaUpdate = run(
    ['node', 'scripts/sync-skills.mjs', 'update', '--sha', unmergedSha, '--allow-unmerged'],
    app,
  );
  assert.match(crossShaUpdate, /Hydrated skills-source @/);
  run(['node', 'scripts/sync-skills.mjs', 'check'], app);
}

try {
  testTemplateStartingRevision();
  testAmbiguousTemplateStartingRevision();
  testSkillsBranchMembership();
  console.log('Synchronization automation tests passed.');
} finally {
  fs.rmSync(TEMP, { recursive: true, force: true });
}
