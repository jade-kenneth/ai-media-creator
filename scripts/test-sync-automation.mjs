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

function createPortFixture(name) {
  const upstream = path.join(TEMP, `${name}-upstream`);
  const product = path.join(TEMP, `${name}-product`);
  initialize(upstream);
  fs.mkdirSync(path.join(upstream, 'scripts'), { recursive: true });
  fs.copyFileSync(
    path.join(SCRIPTS, 'boilerplate-sync.mjs'),
    path.join(upstream, 'scripts', 'boilerplate-sync.mjs'),
  );
  fs.writeFileSync(path.join(upstream, 'shared.txt'), 'upstream base\n');
  fs.writeFileSync(
    path.join(upstream, 'boilerplate.lock.json'),
    `${JSON.stringify({ repository: upstream, ref: 'main', reviewedThroughSha: null, appliedUpdates: [] }, null, 2)}\n`,
  );
  const sourceSha = commit(upstream, 'chore: template source');

  run(['git', 'clone', '--quiet', upstream, product], TEMP);
  git(product, 'config', 'user.email', 'sync-test@example.com');
  git(product, 'config', 'user.name', 'Sync Test');
  git(product, 'remote', 'set-url', 'origin', path.join(TEMP, `${name}-product-origin`));
  fs.writeFileSync(
    path.join(product, 'boilerplate.lock.json'),
    `${JSON.stringify({ repository: upstream, ref: 'main', reviewedThroughSha: sourceSha, appliedUpdates: [] }, null, 2)}\n`,
  );
  commit(product, 'chore: initialize product lock');

  fs.writeFileSync(path.join(upstream, 'dependency.txt'), 'first\n');
  const firstSha = commit(upstream, 'feat: add dependency foundation');
  fs.appendFileSync(path.join(upstream, 'dependency.txt'), 'second\n');
  const secondSha = commit(upstream, 'feat: extend dependency foundation');

  return { upstream, product, sourceSha, firstSha, secondSha };
}

function portArgs(...shas) {
  return [
    'node', 'scripts/boilerplate-sync.mjs', 'port',
    ...shas.flatMap((sha) => ['--sha', sha]),
  ];
}

function testPortSafetyGuards() {
  const sourceRepository = createPortFixture('port-source-repository');
  git(sourceRepository.upstream, 'remote', 'add', 'origin', sourceRepository.upstream);
  expectFailure(
    portArgs(sourceRepository.firstSha),
    sourceRepository.upstream,
    /only used in downstream product repositories/,
  );

  const defaultBranch = createPortFixture('port-default-branch');
  expectFailure(
    portArgs(defaultBranch.firstSha),
    defaultBranch.product,
    /protected branch 'main'/,
  );

  const configuredDefault = createPortFixture('port-configured-default');
  git(configuredDefault.product, 'branch', 'develop');
  git(
    configuredDefault.product,
    'update-ref', 'refs/remotes/origin/develop',
    git(configuredDefault.product, 'rev-parse', 'develop'),
  );
  git(
    configuredDefault.product,
    'symbolic-ref', 'refs/remotes/origin/HEAD', 'refs/remotes/origin/develop',
  );
  git(configuredDefault.product, 'switch', '--quiet', 'develop');
  expectFailure(
    portArgs(configuredDefault.firstSha),
    configuredDefault.product,
    /protected branch 'develop'/,
  );

  const detached = createPortFixture('port-detached');
  git(detached.product, 'switch', '--quiet', '--detach');
  expectFailure(portArgs(detached.firstSha), detached.product, /detached HEAD/);

  const dirty = createPortFixture('port-dirty');
  git(dirty.product, 'switch', '--quiet', '-c', 'chore/port-boilerplate');
  fs.writeFileSync(path.join(dirty.product, 'dirty.txt'), 'not committed\n');
  expectFailure(portArgs(dirty.firstSha), dirty.product, /dirty worktree/);

  const invalidSha = createPortFixture('port-invalid-sha');
  git(invalidSha.product, 'switch', '--quiet', '-c', 'chore/port-boilerplate');
  expectFailure(
    portArgs(invalidSha.firstSha.slice(0, 12)),
    invalidSha.product,
    /full 40-character commit SHA/,
  );

  const outsideRange = createPortFixture('port-outside-range');
  git(outsideRange.product, 'switch', '--quiet', '-c', 'chore/port-boilerplate');
  expectFailure(
    portArgs(outsideRange.sourceSha),
    outsideRange.product,
    /outside the unreviewed boilerplate range/,
  );
}

function testMergeCommitRejection() {
  const fixture = createPortFixture('port-merge');
  git(fixture.upstream, 'switch', '--quiet', '-c', 'merge-side', fixture.firstSha);
  fs.writeFileSync(path.join(fixture.upstream, 'side.txt'), 'side\n');
  commit(fixture.upstream, 'feat: add side change');
  git(fixture.upstream, 'switch', '--quiet', 'main');
  fs.writeFileSync(path.join(fixture.upstream, 'mainline.txt'), 'mainline\n');
  commit(fixture.upstream, 'feat: add mainline change');
  git(fixture.upstream, 'merge', '--quiet', '--no-ff', 'merge-side', '-m', 'merge: combine changes');
  const mergeSha = git(fixture.upstream, 'rev-parse', 'HEAD');

  git(fixture.product, 'switch', '--quiet', '-c', 'chore/port-boilerplate');
  expectFailure(portArgs(mergeSha), fixture.product, /is a merge commit.*constituent commits/s);
}

function testPortDryRun() {
  const fixture = createPortFixture('port-dry-run');
  git(fixture.product, 'switch', '--quiet', '-c', 'chore/port-boilerplate');
  const beforeHead = git(fixture.product, 'rev-parse', 'HEAD');
  const beforeLock = fs.readFileSync(path.join(fixture.product, 'boilerplate.lock.json'), 'utf8');
  const output = run([...portArgs(fixture.firstSha), '--dry-run'], fixture.product);

  assert.match(output, /Would port 1 boilerplate commit/);
  assert.match(output, /Dry run complete/);
  assert.equal(git(fixture.product, 'rev-parse', 'HEAD'), beforeHead);
  assert.equal(fs.readFileSync(path.join(fixture.product, 'boilerplate.lock.json'), 'utf8'), beforeLock);
  assert.equal(fs.existsSync(path.join(fixture.product, 'dependency.txt')), false);
}

function testPortOrderingProvenanceAndRecording() {
  const fixture = createPortFixture('port-order');
  git(fixture.product, 'switch', '--quiet', '-c', 'chore/port-boilerplate');
  const output = run(portArgs(fixture.secondSha, fixture.firstSha), fixture.product);
  const subjects = git(fixture.product, 'log', '-2', '--format=%s').split('\n');
  const latestBody = git(fixture.product, 'log', '-1', '--format=%B');
  const lock = JSON.parse(fs.readFileSync(path.join(fixture.product, 'boilerplate.lock.json'), 'utf8'));

  assert.match(output, /Porting 2 boilerplate commit/);
  assert.deepEqual(subjects, ['feat: extend dependency foundation', 'feat: add dependency foundation']);
  assert.match(latestBody, new RegExp(`cherry picked from commit ${fixture.secondSha}`));
  assert.deepEqual(lock.appliedUpdates, [fixture.firstSha, fixture.secondSha]);
  assert.equal(lock.reviewedThroughSha, fixture.sourceSha);
  assert.equal(fs.readFileSync(path.join(fixture.product, 'dependency.txt'), 'utf8'), 'first\nsecond\n');

  commit(fixture.product, 'chore: record applied boilerplate updates');
  expectFailure(portArgs(fixture.firstSha), fixture.product, /already applied/);
}

function testPortConflictPreservesState() {
  const fixture = createPortFixture('port-conflict');
  fs.writeFileSync(path.join(fixture.upstream, 'shared.txt'), 'upstream changed\n');
  const conflictSha = commit(fixture.upstream, 'fix: change shared behavior');

  git(fixture.product, 'switch', '--quiet', '-c', 'chore/port-boilerplate');
  fs.writeFileSync(path.join(fixture.product, 'shared.txt'), 'product changed\n');
  commit(fixture.product, 'feat: customize shared behavior');

  expectFailure(
    portArgs(conflictSha, fixture.firstSha),
    fixture.product,
    /conflict.*git cherry-pick --continue.*git cherry-pick --abort/s,
  );
  assert.equal(fs.existsSync(path.join(fixture.product, '.git', 'CHERRY_PICK_HEAD')), true);
  const lock = JSON.parse(fs.readFileSync(path.join(fixture.product, 'boilerplate.lock.json'), 'utf8'));
  assert.deepEqual(lock.appliedUpdates, [fixture.firstSha]);
  assert.equal(lock.reviewedThroughSha, fixture.sourceSha);
  assert.equal(git(fixture.product, 'log', '-1', '--format=%s'), 'feat: add dependency foundation');
  expectFailure(portArgs(conflictSha), fixture.product, /unfinished cherry-pick/);
  git(fixture.product, 'cherry-pick', '--abort');
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
  testPortSafetyGuards();
  testMergeCommitRejection();
  testPortDryRun();
  testPortOrderingProvenanceAndRecording();
  testPortConflictPreservesState();
  console.log('Synchronization automation tests passed.');
} finally {
  fs.rmSync(TEMP, { recursive: true, force: true });
}
