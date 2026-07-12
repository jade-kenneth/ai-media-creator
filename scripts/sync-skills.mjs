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

function hydrate(lock) {
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
  const sha = shaIndex === -1 ? '' : process.argv[shaIndex + 1] || '';
  if (sha && !SHA_PATTERN.test(sha)) {
    throw new Error('--sha must be a full 40-character commit SHA.');
  }
  return sha;
}

function check(lock) {
  hydrate(lock);
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
    const nextLock = {
      ...lock,
      sha: requestedSha() || resolveLatestSha(lock),
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
