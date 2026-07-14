#!/usr/bin/env node
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const VALIDATOR = path.join(DIR, 'validate-design-export.mjs');
const ACK = path.join(DIR, 'acknowledge-design-release.mjs');
const TEMP = fs.mkdtempSync(path.join(os.tmpdir(), 'design-release-'));

function run(script, expectSuccess, extraArgs = []) {
  try {
    const output = execFileSync(process.execPath, [script, '--root', TEMP, ...extraArgs], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    if (!expectSuccess) throw new Error('Expected command to fail, but it succeeded.');
    return output;
  } catch (error) {
    if (expectSuccess || error.message === 'Expected command to fail, but it succeeded.') {
      throw error;
    }
    return String(error.stdout || '') + '\n' + String(error.stderr || '');
  }
}

function write(relative, content) {
  const file = path.join(TEMP, relative);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

function manifest(overrides = {}) {
  return {
    schemaVersion: 1,
    project: 'Sample',
    batch: 1,
    revision: 0,
    previousBatch: 0,
    releaseId: 'design-batch-001',
    status: 'incremental',
    readyForBuild: [
      { screen: 'Home', prototype: 'prototypes/Home.dc.html', change: 'added' },
    ],
    stillInDesign: ['Payment'],
    planned: ['Support'],
    removedOrSuperseded: [],
    notes: 'First slice.',
    ...overrides,
  };
}

try {
  const empty = run(VALIDATOR, false);
  assert.match(empty, /No supported screen prototype contracts/);
  assert.match(empty, /design\/design-release\.json is missing/);

  write(
    'design/prototypes/Home.dc.html',
    '<body data-prototype-surface="mobile"><div data-preview-shell><main data-app-root>Home</main></div></body>\n',
  );
  write('design/planning/screen-inventory.md', '# Screen inventory\n');
  write('design/handoff/Sample Design Reference.md', '# Reference\n');
  write('design/handoff/Sample Design Handoff Plan.md', '# Plan\n');
  write('design/design-release.json', JSON.stringify(manifest(), null, 2) + '\n');

  const first = run(VALIDATOR, true);
  assert.match(first, /design-batch-001 revision 0 \[incremental\]/);
  assert.match(first, /last synchronized: none/);
  assert.match(first, /\/sync-build-docs <project name>/);

  assert.match(run(ACK, true), /Acknowledged design-batch-001 revision 0/);
  const lock1 = JSON.parse(
    fs.readFileSync(path.join(TEMP, 'design/design-sync.lock.json')),
  );
  assert.equal(lock1.lastSyncedBatch, 1);
  assert.equal(lock1.lastSyncedRevision, 0);
  assert.ok(lock1.prototypeHashes['prototypes/Home.dc.html']);

  assert.match(
    run(VALIDATOR, false),
    /is not newer than synchronized batch 1 revision 0/,
  );

  write(
    'design/prototypes/Home.dc.html',
    '<body data-prototype-surface="mobile"><div data-preview-shell><main data-app-root>Updated home</main></div></body>\n',
  );
  write(
    'design/prototypes/Booking.dc.html',
    '<body data-prototype-surface="mobile"><main data-app-root>Booking</main></body>\n',
  );
  write(
    'design/design-release.json',
    JSON.stringify(
      manifest({
        batch: 2,
        previousBatch: 1,
        releaseId: 'design-batch-002',
        readyForBuild: [
          { screen: 'Home', prototype: 'prototypes/Home.dc.html', change: 'updated' },
          { screen: 'Booking', prototype: 'prototypes/Booking.dc.html', change: 'added' },
        ],
        stillInDesign: ['Payment'],
        planned: [],
      }),
      null,
      2,
    ) + '\n',
  );
  assert.match(run(VALIDATOR, true), /design-batch-002 revision 0/);
  assert.match(run(ACK, true), /Acknowledged design-batch-002 revision 0/);
  const lock2 = JSON.parse(
    fs.readFileSync(path.join(TEMP, 'design/design-sync.lock.json')),
  );
  assert.equal(lock2.lastSyncedBatch, 2);
  assert.ok(lock2.prototypeHashes['prototypes/Booking.dc.html']);

  write(
    'design/design-release.json',
    JSON.stringify(
      manifest({
        batch: 2,
        previousBatch: 1,
        releaseId: 'design-batch-002',
        status: 'final',
        readyForBuild: [
          { screen: 'Home', prototype: 'prototypes/Home.dc.html', change: 'unchanged' },
          { screen: 'Booking', prototype: 'prototypes/Booking.dc.html', change: 'unchanged' },
        ],
        stillInDesign: [],
        planned: [],
      }),
      null,
      2,
    ) + '\n',
  );
  assert.match(run(VALIDATOR, false), /is not newer than synchronized batch 2 revision 0/);
  assert.match(
    run(VALIDATOR, true, ['--allow-synced']),
    /design-batch-002 revision 0 \[final\]/,
  );

  write(
    'design/design-release.json',
    JSON.stringify(
      manifest({
        batch: 4,
        previousBatch: 3,
        releaseId: 'design-batch-004',
        readyForBuild: [
          { screen: 'Home', prototype: 'prototypes/Home.dc.html', change: 'unchanged' },
        ],
        stillInDesign: [],
        planned: [],
      }),
      null,
      2,
    ) + '\n',
  );
  assert.match(
    run(VALIDATOR, false),
    /expected batch 3 or a higher revision of batch 2/,
  );

  write(
    'design/design-release.json',
    JSON.stringify(
      manifest({
        batch: 2,
        revision: 1,
        previousBatch: 1,
        releaseId: 'design-batch-002',
        readyForBuild: [
          { screen: 'Home', prototype: 'prototypes/Home.dc.html', change: 'updated' },
        ],
        stillInDesign: [],
        planned: [],
      }),
      null,
      2,
    ) + '\n',
  );
  assert.match(
    run(VALIDATOR, false),
    /marked updated but its content did not change/,
  );

  write(
    'design/prototypes/Home.dc.html',
    '<body data-prototype-surface="mobile"><main data-app-root>Revision one</main></body>\n',
  );
  assert.match(run(VALIDATOR, true), /design-batch-002 revision 1/);

  write(
    'design/design-release.json',
    JSON.stringify(
      manifest({
        batch: 3,
        previousBatch: 2,
        releaseId: 'design-batch-003',
        status: 'final',
        readyForBuild: [
          { screen: 'Home', prototype: 'prototypes/Home.dc.html', change: 'updated' },
        ],
        stillInDesign: ['Payment'],
        planned: [],
      }),
      null,
      2,
    ) + '\n',
  );
  assert.match(
    run(VALIDATOR, false),
    /final design release cannot contain stillInDesign/,
  );

  console.log('Incremental design release tests passed.');
} finally {
  fs.rmSync(TEMP, { recursive: true, force: true });
}
