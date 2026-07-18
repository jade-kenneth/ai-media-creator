#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LOCK_PATH = path.join(ROOT, 'skills-source.lock.json');
const SNAPSHOT_PATH = path.join(ROOT, '.skills-source');
const AGENTS_PATH = path.join(ROOT, 'AGENTS.md');
const SHA_PATTERN = /^[0-9a-f]{40}$/;

function git(args, cwd = ROOT) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
  }).trim();
}

function readLock() {
  const lock = JSON.parse(fs.readFileSync(LOCK_PATH, 'utf8'));
  if (
    typeof lock.repository !== 'string' ||
    typeof lock.ref !== 'string' ||
    !SHA_PATTERN.test(lock.sha)
  ) {
    throw new Error(
      'skills-source.lock.json must contain repository, ref, and a 40-character SHA.',
    );
  }
  return lock;
}

function writeLock(lock) {
  fs.writeFileSync(LOCK_PATH, `${JSON.stringify(lock, null, 2)}\n`);
}

function resolveLatestSha(lock) {
  const output = git([
    'ls-remote',
    lock.repository,
    `refs/heads/${lock.ref}`,
  ]);
  const sha = output.split(/\s+/)[0] || '';
  if (!SHA_PATTERN.test(sha)) {
    throw new Error(`Unable to resolve ${lock.repository}#${lock.ref}`);
  }
  return sha;
}

function atomicReplaceSnapshot(tempPath) {
  const backupPath = `${SNAPSHOT_PATH}.backup-${process.pid}`;
  fs.rmSync(backupPath, { recursive: true, force: true });

  let movedExisting = false;
  try {
    if (fs.existsSync(SNAPSHOT_PATH)) {
      fs.renameSync(SNAPSHOT_PATH, backupPath);
      movedExisting = true;
    }
    fs.renameSync(tempPath, SNAPSHOT_PATH);
    fs.rmSync(backupPath, { recursive: true, force: true });
  } catch (error) {
    fs.rmSync(SNAPSHOT_PATH, { recursive: true, force: true });
    if (movedExisting && fs.existsSync(backupPath)) {
      fs.renameSync(backupPath, SNAPSHOT_PATH);
    }
    throw error;
  }
}

function pinnedSnapshotSha() {
  try {
    return fs
      .readFileSync(path.join(SNAPSHOT_PATH, '.pinned-sha'), 'utf8')
      .trim();
  } catch {
    return '';
  }
}

function hydrate(lock) {
  if (pinnedSnapshotSha() === lock.sha) {
    console.log(`Skills snapshot already hydrated @ ${lock.sha.slice(0, 8)}`);
    return;
  }

  const tempPath = path.join(
    ROOT,
    `.skills-source.download-${process.pid}-${Date.now()}`,
  );
  fs.rmSync(tempPath, { recursive: true, force: true });
  fs.mkdirSync(tempPath, { recursive: true });

  try {
    git(['init', '--quiet'], tempPath);
    git(['remote', 'add', 'origin', lock.repository], tempPath);
    git(['fetch', '--quiet', '--depth', '1', 'origin', lock.sha], tempPath);
    git(['checkout', '--quiet', '--detach', 'FETCH_HEAD'], tempPath);

    const actualSha = git(['rev-parse', 'HEAD'], tempPath);
    if (actualSha !== lock.sha) {
      throw new Error(`Expected ${lock.sha}, but downloaded ${actualSha}`);
    }

    fs.rmSync(path.join(tempPath, '.git'), { recursive: true, force: true });
    fs.writeFileSync(path.join(tempPath, '.pinned-sha'), `${actualSha}\n`);
    atomicReplaceSnapshot(tempPath);
    console.log(`Hydrated skills-source @ ${actualSha.slice(0, 8)}`);
  } catch (error) {
    fs.rmSync(tempPath, { recursive: true, force: true });
    throw error;
  }
}

function generateAgents(lock, outputPath = AGENTS_PATH) {
  const generator = path.join(
    SNAPSHOT_PATH,
    'scripts',
    'build-agents-md.js',
  );
  if (!fs.existsSync(generator)) {
    throw new Error('The locked skills snapshot does not contain the AGENTS generator.');
  }

  execFileSync(process.execPath, [generator, outputPath], {
    cwd: ROOT,
    env: { ...process.env, SKILLS_SOURCE_SHA: lock.sha },
    stdio: 'inherit',
  });
}

function requestedSha() {
  const shaIndex = process.argv.indexOf('--sha');
  if (shaIndex === -1) return '';
  const sha = process.argv[shaIndex + 1] || '';
  if (!SHA_PATTERN.test(sha)) {
    throw new Error('--sha must be followed by a full 40-character commit SHA.');
  }
  return sha;
}

function verifyShaOnConfiguredRef(lock, sha) {
  const tempPath = path.join(
    os.tmpdir(),
    `skills-source-membership-${process.pid}-${Date.now()}`,
  );
  fs.rmSync(tempPath, { recursive: true, force: true });
  fs.mkdirSync(tempPath, { recursive: true });

  try {
    git(['init', '--quiet'], tempPath);
    git(['remote', 'add', 'origin', lock.repository], tempPath);
    git(
      [
        'fetch',
        '--quiet',
        '--no-tags',
        'origin',
        `refs/heads/${lock.ref}:refs/remotes/origin/${lock.ref}`,
      ],
      tempPath,
    );
    try {
      git(
        [
          'merge-base',
          '--is-ancestor',
          sha,
          `refs/remotes/origin/${lock.ref}`,
        ],
        tempPath,
      );
    } catch {
      throw new Error(
        `${sha} is not part of ${lock.repository}#${lock.ref}. ` +
          'Use --allow-unmerged only for an intentional, reviewed exception.',
      );
    }
  } finally {
    fs.rmSync(tempPath, { recursive: true, force: true });
  }
}

function checkCommandWrappers() {
  const wrappersDir = path.join(ROOT, '.claude', 'commands');
  if (!fs.existsSync(wrappersDir)) return;

  const referencePattern = /\.skills-source\/commands\/[A-Za-z0-9._-]+\.md/g;
  const problems = [];
  for (const entry of fs.readdirSync(wrappersDir).sort()) {
    if (!entry.endsWith('.md')) continue;
    const wrapperPath = path.join(wrappersDir, entry);
    const references =
      fs.readFileSync(wrapperPath, 'utf8').match(referencePattern) || [];
    if (references.length === 0) {
      problems.push(
        `.claude/commands/${entry} does not delegate to a canonical .skills-source/commands/ file.`,
      );
      continue;
    }
    for (const reference of new Set(references)) {
      if (!fs.existsSync(path.join(ROOT, reference))) {
        problems.push(
          `.claude/commands/${entry} references ${reference}, which is missing from the locked snapshot.`,
        );
      }
    }
  }

  if (problems.length > 0) {
    throw new Error(
      `Command wrappers are out of sync with the locked snapshot:\n- ${problems.join('\n- ')}`,
    );
  }
  console.log('Command wrappers resolve against the locked snapshot');
}

function check(lock) {
  hydrate(lock);
  checkCommandWrappers();
  const checkPath = path.join(
    os.tmpdir(),
    `app-boilerplate-AGENTS-${process.pid}.md`,
  );
  try {
    generateAgents(lock, checkPath);
    const expected = fs.readFileSync(checkPath);
    const committed = fs.readFileSync(AGENTS_PATH);
    if (!expected.equals(committed)) {
      try {
        execFileSync(
          'git',
          ['diff', '--no-index', '--', AGENTS_PATH, checkPath],
          { cwd: ROOT, stdio: 'inherit' },
        );
      } catch {
        // git diff exits with status 1 when it successfully finds a difference.
      }
      throw new Error(
        "AGENTS.md is stale. Run 'npm run sync-skills' and commit the result.",
      );
    }
    console.log(`Skills output matches lock @ ${lock.sha.slice(0, 8)}`);
  } finally {
    fs.rmSync(checkPath, { force: true });
  }
}

const command = process.argv[2] || 'sync';
const lock = readLock();

switch (command) {
  case 'hydrate':
    hydrate(lock);
    break;
  case 'sync':
    hydrate(lock);
    generateAgents(lock);
    break;
  case 'update': {
    const requested = requestedSha();
    if (requested && !process.argv.includes('--allow-unmerged')) {
      verifyShaOnConfiguredRef(lock, requested);
    }
    const nextLock = {
      ...lock,
      sha: requested || resolveLatestSha(lock),
    };
    writeLock(nextLock);
    hydrate(nextLock);
    generateAgents(nextLock);
    console.log(`Updated skills lock to ${nextLock.sha}`);
    break;
  }
  case 'check':
    check(lock);
    break;
  default:
    throw new Error(
      `Unknown command '${command}'. Use hydrate, sync, update, or check.`,
    );
}
