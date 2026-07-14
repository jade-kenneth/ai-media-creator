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
  assert.match(run(false), /No supported screen prototype contracts found/);

  fs.mkdirSync(path.join(TEMP, 'design', 'prototypes'), { recursive: true });
  fs.writeFileSync(path.join(TEMP, 'design', 'prototypes', 'Home.dc.html'), '<main>Home</main>\n');
  assert.match(run(false), /Prototype production-boundary validation failed/);
  assert.match(run(false), /must declare exactly one data-prototype-surface/);
  const metadataFailure = run(false);
  assert.match(metadataFailure, /must contain exactly one data-app-root/);
  assert.match(metadataFailure, /\/adapt-design-export <project name>/);
  fs.writeFileSync(
    path.join(TEMP, 'design', 'prototypes', 'Home.dc.html'),
    '<style>[data-app-root]{width:100%}</style><body data-prototype-surface="mobile"><div data-preview-shell><main data-app-root>Home</main></div><script>document.querySelector("[data-app-root]")</script></body>\n',
  );
  const handoffFailure = run(false);
  assert.match(handoffFailure, /must export exactly one/);
  assert.match(handoffFailure, /\/adapt-design-export <project name>/);
  fs.mkdirSync(path.join(TEMP, 'design', 'handoff'), { recursive: true });
  fs.writeFileSync(
    path.join(TEMP, 'design', 'handoff', 'Sample Design Reference.md'),
    '# Design Reference\n',
  );
  fs.writeFileSync(
    path.join(TEMP, 'design', 'handoff', 'Sample Design Handoff Plan.md'),
    '# Design Handoff Plan\n',
  );
  const partial = run(true);
  assert.match(partial, /prototypes \(1\)/);
  assert.match(partial, /screen prototype contracts \(1\)/);
  assert.match(partial, /design\/prototypes\/Home\.dc\.html \[mobile\]/);
  assert.match(partial, /warning: design\/system\/ is missing or empty/);
  assert.match(partial, /design handoff documents \(2\)/);
  assert.match(partial, /design\/handoff\/Sample Design Reference\.md/);
  assert.match(partial, /design\/handoff\/Sample Design Handoff Plan\.md/);
  assert.match(partial, /\/finalize-build-docs <project name>/);
  assert.match(partial, /Product Specification\.md and Implementation Plan\.md/);

  fs.writeFileSync(
    path.join(TEMP, 'design', 'prototypes', 'Home.dc.html'),
    '<body data-prototype-surface="mobile"><main data-app-root>One</main><main data-app-root>Two</main></body>\n',
  );
  assert.match(run(false), /must contain exactly one data-app-root; found 2/);
  fs.writeFileSync(
    path.join(TEMP, 'design', 'prototypes', 'Home.dc.html'),
    '<style>[data-app-root]{width:100%}</style><body data-prototype-surface="mobile"><div data-preview-shell><main data-app-root>Home</main></div><script>document.querySelector("[data-app-root]")</script></body>\n',
  );

  fs.writeFileSync(
    path.join(TEMP, 'design', 'handoff', 'Duplicate Design Reference.md'),
    '# Duplicate\n',
  );
  assert.match(run(false), /must export exactly one/);
  fs.rmSync(path.join(TEMP, 'design', 'handoff', 'Duplicate Design Reference.md'));

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
