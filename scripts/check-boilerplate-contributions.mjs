#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONFIG_PATH = path.join(ROOT, 'boilerplate-sync.config.json');

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
function matches(file, pattern) {
  return pattern.endsWith('/**') ? file.startsWith(pattern.slice(0, -2)) : file === pattern;
}
function writeSummary(lines) {
  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${lines.join('\n')}\n`);
  }
}

const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
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
const foundation = files.filter((file) => config.foundationPaths.some((pattern) => matches(file, pattern)));
const candidates = foundation.filter((file) =>
  !config.productPaths.some((pattern) => matches(file, pattern)));

if (!candidates.length) {
  console.log('No reusable boilerplate foundation changes detected.');
  writeSummary(['## Boilerplate contribution check', '', 'No reusable foundation paths changed.']);
  process.exit(0);
}
console.log('\nPossible reusable boilerplate improvements detected:\n');
for (const file of candidates) console.log(`- ${file}`);
console.log('\nClassify each as product-specific, reusable, or an urgent backport.');
writeSummary(['## Possible boilerplate contribution', '',
  'This PR changes reusable foundation paths:', '', ...candidates.map((file) => `- \`${file}\``), '',
  '- **Product-specific:** keep it only in this application.',
  '- **Reusable:** port the neutral change to `app-boilerplate`.',
  '- **Urgent backport:** fix this app now and immediately port the generic fix and test upstream.']);
if (process.env.GITHUB_ACTIONS) {
  console.log('::warning::Reusable foundation paths changed; classify them in the PR description.');
}
