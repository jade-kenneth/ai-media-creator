#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { classifyPath, loadSyncConfig } from './lib/foundation-config.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const CLASSIFICATIONS = ['reusable', 'product-specific', 'backported'];
const LABEL_PATTERN = /^foundation:(reusable|product-specific|backported)$/;
const TRAILER_PATTERN = /^foundation-change:\s*(reusable|product-specific|backported)\s*$/im;

function git(args) {
  return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}
function tryGit(args) { try { return git(args); } catch { return ''; } }
function normalizeRepository(value) {
  return value.trim().replace(/^git@github\.com:/, 'https://github.com/')
    .replace(/^ssh:\/\/git@github\.com\//, 'https://github.com/')
    .replace(/\.git$/, '').replace(/\/$/, '').toLowerCase();
}
function requestedBase() {
  const index = process.argv.indexOf('--base');
  return index === -1 ? process.env.BOILERPLATE_CONTRIBUTION_BASE || '' : process.argv[index + 1] || '';
}
function resolveBase() {
  const requested = requestedBase();
  if (requested) { git(['rev-parse', '--verify', requested]); return requested; }
  if (tryGit(['rev-parse', '--verify', 'origin/main'])) return git(['merge-base', 'HEAD', 'origin/main']);
  if (tryGit(['rev-parse', '--verify', 'HEAD^'])) return 'HEAD^';
  throw new Error('Unable to determine a comparison base. Pass --base <git-ref>.');
}
function writeSummary(lines) {
  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${lines.join('\n')}\n`);
  }
}

function readPullRequestEvent() {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!eventPath || !fs.existsSync(eventPath)) return null;
  try {
    const event = JSON.parse(fs.readFileSync(eventPath, 'utf8'));
    return event.pull_request || null;
  } catch {
    return null;
  }
}

function declaredClassifications(pullRequest) {
  const declared = new Set();
  for (const label of pullRequest?.labels ?? []) {
    const match = LABEL_PATTERN.exec(label?.name ?? '');
    if (match) declared.add(match[1]);
  }
  const bodyMatch = TRAILER_PATTERN.exec(pullRequest?.body ?? '');
  if (bodyMatch) declared.add(bodyMatch[1].toLowerCase());
  return [...declared];
}

const config = loadSyncConfig(ROOT);
const origin = tryGit(['remote', 'get-url', 'origin']);
if (origin && normalizeRepository(origin) === normalizeRepository('https://github.com/jade-kenneth/app-boilerplate')) {
  console.log('This is app-boilerplate itself; downstream contribution detection was skipped.');
  process.exit(0);
}
const base = resolveBase();
const output = git(['diff', '--name-only', '--diff-filter=ACMRT', base, '--']);
const untracked = tryGit(['ls-files', '--others', '--exclude-standard']);
const files = [...new Set(
  `${output}\n${untracked}`.split('\n').map((file) => file.trim()).filter(Boolean),
)];
const candidates = files.filter((file) => classifyPath(file, config) === 'foundation');

if (!candidates.length) {
  console.log('No reusable boilerplate foundation changes detected.');
  writeSummary(['## Boilerplate contribution check', '', 'No reusable foundation paths changed.']);
  process.exit(0);
}

console.log('\nBoilerplate foundation paths changed in this diff:\n');
for (const file of candidates) console.log(`- ${file}`);

const guidance = [
  '- **product-specific:** keep it only in this application.',
  '- **reusable:** port the neutral change to `app-boilerplate` (see `npm run boilerplate:contribute`).',
  '- **backported:** fix this app now and immediately port the generic fix and test upstream.',
];
const howToDeclare = [
  `Declare the classification with a PR label (${CLASSIFICATIONS.map((value) => `\`foundation:${value}\``).join(', ')})`,
  'or a `Foundation-Change: <classification>` line in the PR description.',
];

const pullRequest = readPullRequestEvent();
if (process.env.GITHUB_ACTIONS && pullRequest) {
  const declared = declaredClassifications(pullRequest);
  if (declared.length) {
    console.log(`\nFoundation change classified as: ${declared.join(', ')}.`);
    writeSummary(['## Boilerplate contribution check', '',
      `Foundation paths changed and were classified as **${declared.join(', ')}**:`, '',
      ...candidates.map((file) => `- \`${file}\``), '', ...guidance]);
    if (declared.includes('reusable') || declared.includes('backported')) {
      console.log('::notice::Remember to port the reusable foundation change to app-boilerplate.');
    }
    process.exit(0);
  }
  console.log(`\nNo classification declared. ${howToDeclare.join(' ')}`);
  writeSummary(['## Boilerplate contribution check — action required', '',
    'This PR changes reusable foundation paths but declares no classification:', '',
    ...candidates.map((file) => `- \`${file}\``), '', ...howToDeclare, '', ...guidance]);
  console.log('::error::Foundation paths changed without a foundation:* label or Foundation-Change trailer.');
  process.exit(1);
}

console.log(`\nClassify each file as product-specific, reusable, or a backport. ${howToDeclare.join(' ')}`);
writeSummary(['## Possible boilerplate contribution', '',
  'This diff changes reusable foundation paths:', '',
  ...candidates.map((file) => `- \`${file}\``), '', ...howToDeclare, '', ...guidance]);
if (process.env.GITHUB_ACTIONS) {
  console.log('::warning::Reusable foundation paths changed; classify them before merging.');
}
