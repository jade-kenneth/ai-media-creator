#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WRAPPER = path.join(ROOT, 'scripts', 'skill-contribution.mjs');
const FIXTURE = path.join(ROOT, '.skills-source', 'skills', 'project-learning-contributor', 'assets', 'example-proposal.json');
const output = path.join(os.tmpdir(), `skill-contribution-${process.pid}.md`);

try {
  execFileSync(process.execPath, [WRAPPER, 'validate', '--file', FIXTURE], { cwd: ROOT, stdio: 'inherit' });
  const rendered = execFileSync(process.execPath, [WRAPPER, 'render', '--file', FIXTURE], { cwd: ROOT, encoding: 'utf8' });
  fs.writeFileSync(output, rendered);
  if (!rendered.includes('Target skills:** `mobile-app`')) throw new Error('Rendered proposal is missing its categorized target.');
  console.log('Skill contribution wrapper test passed.');
} finally {
  fs.rmSync(output, { force: true });
}
