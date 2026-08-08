#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const VALIDATOR = path.join(
  ROOT,
  '.skills-source',
  'skills',
  'project-learning-contributor',
  'scripts',
  'proposal.mjs',
);

if (!fs.existsSync(VALIDATOR)) {
  throw new Error(
    "The locked project-learning contributor is not hydrated. Run 'pnpm sync-skills' first.",
  );
}

const args = process.argv.slice(2);
if (!args.length) {
  throw new Error(
    'Pass validate or render followed by --file <skill-contributions/proposal.json>.',
  );
}

execFileSync(process.execPath, [VALIDATOR, ...args], {
  cwd: ROOT,
  stdio: 'inherit',
});
