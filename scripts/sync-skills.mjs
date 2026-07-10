#!/usr/bin/env node
// Pulls latest skills-source into this project and regenerates AGENTS.md.
import { execSync } from 'child_process';
import fs from 'fs';

const REPO = 'github:jade-kenneth/skills-source'; // degit format
execSync(`npx degit ${REPO} .skills-source --force`, { stdio: 'inherit' });

// Pin the version for reproducibility
const sha = execSync(
  `git ls-remote https://github.com/jade-kenneth/skills-source HEAD`,
)
  .toString()
  .split('\t')[0];
fs.writeFileSync('.skills-source/.pinned-sha', sha);

// Regenerate AGENTS.md for Codex
execSync(`node .skills-source/scripts/build-agents-md.js AGENTS.md`, {
  stdio: 'inherit',
});
console.log('skills synced @', sha.slice(0, 8));
