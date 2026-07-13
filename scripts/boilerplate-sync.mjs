#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LOCK_PATH = path.join(ROOT, 'boilerplate.lock.json');
const SHA_PATTERN = /^[0-9a-f]{40}$/;

function git(args) {
  return execFileSync('git', args, {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function tryGit(args) {
  try {
    return git(args);
  } catch {
    return '';
  }
}

function normalizeRepository(value) {
  return value.trim().replace(/^git@github\.com:/, 'https://github.com/')
    .replace(/^ssh:\/\/git@github\.com\//, 'https://github.com/')
    .replace(/\.git$/, '').replace(/\/$/, '').toLowerCase();
}

function readLock() {
  const lock = JSON.parse(fs.readFileSync(LOCK_PATH, 'utf8'));
  if (typeof lock.repository !== 'string' || typeof lock.ref !== 'string' ||
      !Array.isArray(lock.appliedUpdates) ||
      (lock.reviewedThroughSha !== null && !SHA_PATTERN.test(lock.reviewedThroughSha))) {
    throw new Error('boilerplate.lock.json is invalid.');
  }
  return lock;
}

function writeLock(lock) {
  fs.writeFileSync(LOCK_PATH, `${JSON.stringify(lock, null, 2)}\n`);
}

function isBoilerplateRepository(lock) {
  const origin = tryGit(['remote', 'get-url', 'origin']);
  return Boolean(origin && normalizeRepository(origin) === normalizeRepository(lock.repository));
}

function ensureRemote(lock) {
  const current = tryGit(['remote', 'get-url', 'boilerplate']);
  if (!current) {
    git(['remote', 'add', 'boilerplate', lock.repository]);
    console.log(`Added boilerplate remote: ${lock.repository}`);
  } else if (normalizeRepository(current) !== normalizeRepository(lock.repository)) {
    throw new Error(`The boilerplate remote points to ${current}. Refusing to replace it automatically.`);
  } else {
    console.log('Boilerplate remote is already configured.');
  }
  git(['fetch', '--quiet', '--prune', 'boilerplate',
    `+refs/heads/${lock.ref}:refs/remotes/boilerplate/${lock.ref}`]);
  return git(['rev-parse', `refs/remotes/boilerplate/${lock.ref}`]);
}

function requestedSha() {
  const index = process.argv.indexOf('--sha');
  const sha = index === -1 ? '' : process.argv[index + 1] || '';
  if (!SHA_PATTERN.test(sha)) throw new Error('--sha must be a full 40-character commit SHA.');
  return sha;
}

function classify(subject, body) {
  if (/BREAKING CHANGE|^[a-z]+(?:\(.+\))?!:/i.test(`${subject}\n${body}`)) return 'breaking';
  if (/^(security|fix)(\(.+\))?:/i.test(subject)) return 'required';
  if (/^(feat|perf|refactor)(\(.+\))?:/i.test(subject)) return 'recommended';
  return 'maintenance';
}

function availableCommits(fromSha, toSha) {
  const delimiter = '\u001f';
  const record = '\u001e';
  const output = git(['log', '--reverse',
    `--format=%H${delimiter}%s${delimiter}%b${record}`, `${fromSha}..${toSha}`]);
  if (!output) return [];
  return output.split(record).map((item) => item.trim()).filter(Boolean).map((item) => {
    const [sha, subject, body = ''] = item.split(delimiter);
    return { sha, subject, category: classify(subject, body) };
  });
}

function writeSummary(lines) {
  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${lines.join('\n')}\n`);
  }
}

function setup() {
  const lock = readLock();
  if (isBoilerplateRepository(lock)) {
    console.log('This is the boilerplate source repository; downstream lock initialization was skipped.');
    return;
  }
  const latest = ensureRemote(lock);
  if (!lock.reviewedThroughSha) {
    writeLock({ ...lock, reviewedThroughSha: latest });
    console.log(`Initialized boilerplate lock at ${latest}.`);
  } else {
    console.log(`Reviewed through: ${lock.reviewedThroughSha}`);
    console.log(`Latest upstream: ${latest}`);
  }
}

function check() {
  const lock = readLock();
  if (isBoilerplateRepository(lock)) {
    console.log('This is the boilerplate source repository; downstream update detection was skipped.');
    return;
  }
  const latest = ensureRemote(lock);
  if (!lock.reviewedThroughSha) {
    throw new Error("Boilerplate lock is not initialized. Run 'npm run boilerplate:setup' and commit the lock file.");
  }
  try {
    git(['merge-base', '--is-ancestor', lock.reviewedThroughSha, latest]);
  } catch {
    throw new Error('The reviewed revision is not an ancestor of latest upstream. Review history manually.');
  }
  const commits = availableCommits(lock.reviewedThroughSha, latest);
  if (!commits.length) {
    console.log(`Boilerplate is current at ${latest}.`);
    writeSummary(['## Boilerplate updates', '', `Current at \`${latest}\`.`]);
    return;
  }
  console.log(`\n${commits.length} boilerplate update(s) are available:\n`);
  for (const category of ['breaking', 'required', 'recommended', 'maintenance']) {
    const matches = commits.filter((commit) => commit.category === category);
    if (!matches.length) continue;
    console.log(`${category.toUpperCase()}:`);
    for (const commit of matches) console.log(`- ${commit.sha.slice(0, 12)} ${commit.subject}`);
    console.log('');
  }
  console.log(`After review, run:\n  npm run boilerplate:ack -- --sha ${latest}`);
  writeSummary(['## Boilerplate updates available', '',
    `Reviewed through: \`${lock.reviewedThroughSha}\`  `, `Latest upstream: \`${latest}\``, '',
    ...commits.map((commit) => `- **${commit.category}** \`${commit.sha.slice(0, 12)}\` ${commit.subject}`),
    '', 'Review or port applicable commits, then acknowledge the reviewed revision:', '',
    '```bash', `npm run boilerplate:ack -- --sha ${latest}`, '```']);
  if (process.env.GITHUB_ACTIONS) {
    console.log('::warning::New app-boilerplate revisions are available; see the job summary.');
  }
}

function acknowledge() {
  const lock = readLock();
  if (isBoilerplateRepository(lock)) {
    throw new Error('Boilerplate acknowledgement is only used in downstream product repositories.');
  }
  const latest = ensureRemote(lock);
  const sha = requestedSha();
  try {
    git(['merge-base', '--is-ancestor', sha, latest]);
  } catch {
    throw new Error(`${sha} is not part of boilerplate/${lock.ref}.`);
  }
  writeLock({ ...lock, reviewedThroughSha: sha });
  console.log(`Recorded boilerplate review through ${sha}.`);
  console.log('Commit boilerplate.lock.json with the update or review PR.');
}

const command = process.argv[2] || 'check';
switch (command) {
  case 'setup': setup(); break;
  case 'check': check(); break;
  case 'acknowledge': acknowledge(); break;
  default: throw new Error(`Unknown command '${command}'. Use setup, check, or acknowledge.`);
}
