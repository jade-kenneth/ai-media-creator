#!/usr/bin/env node
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'validate-design-export.mjs');
const TEMP = fs.mkdtempSync(path.join(os.tmpdir(), 'design-handoff-'));

function run(expectSuccess) {
  try {
    const output = execFileSync(process.execPath, [SCRIPT, '--root', TEMP], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    if (!expectSuccess) {
      throw new Error('Expected design validation to fail, but it succeeded.');
    }
    return output;
  } catch (error) {
    if (expectSuccess) throw error;
    if (error.message === 'Expected design validation to fail, but it succeeded.') {
      throw error;
    }
    return `${error.stdout || ''}\n${error.stderr || ''}`;
  }
}

try {
  assert.match(run(false), /No supported prototype contracts found/);

  fs.mkdirSync(path.join(TEMP, 'design', 'prototypes'), { recursive: true });
  fs.writeFileSync(path.join(TEMP, 'design', 'prototypes', 'Home.dc.html'), '<main>Home</main>\n');
  assert.match(run(false), /must export exactly one/);
  fs.writeFileSync(path.join(TEMP, 'design', 'SampleReference.md'), '# Reference\n');
  fs.writeFileSync(path.join(TEMP, 'design', 'Sample Task Plan.md'), '# Task Plan\n');
  const partial = run(true);
  assert.match(partial, /prototypes \(1\)/);
  assert.match(partial, /warning: design\/system\/ is missing or empty/);
  assert.match(partial, /paired build documents \(2\)/);
  assert.match(partial, /design\/SampleReference\.md/);
  assert.match(partial, /design\/Sample Task Plan\.md/);
  assert.match(partial, /\/gen-build-docs <project name>/);

  fs.writeFileSync(path.join(TEMP, 'design', 'DuplicateReference.md'), '# Duplicate\n');
  assert.match(run(false), /must export exactly one/);
  fs.rmSync(path.join(TEMP, 'design', 'DuplicateReference.md'));

  fs.mkdirSync(path.join(TEMP, 'design', 'system'), { recursive: true });
  fs.mkdirSync(path.join(TEMP, 'design', 'planning'), { recursive: true });
  fs.writeFileSync(path.join(TEMP, 'design', 'system', 'tokens.md'), '# Tokens\n');
  fs.writeFileSync(path.join(TEMP, 'design', 'planning', 'flow.md'), '# Flow\n');
  const complete = run(true);
  assert.match(complete, /system \(1\)/);
  assert.match(complete, /planning \(1\)/);
  console.log('Design handoff tests passed.');
} finally {
  fs.rmSync(TEMP, { recursive: true, force: true });
}
