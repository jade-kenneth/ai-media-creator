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
const SOURCE = path.join(DIR, 'design-source.mjs');
const TEMP = fs.mkdtempSync(path.join(os.tmpdir(), 'design-release-'));

function run(script, expectSuccess, extraArgs = [], root = TEMP) {
  try {
    const output = execFileSync(process.execPath, [script, '--root', root, ...extraArgs], {
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
  assert.match(empty, /design\/system\/ must contain the normative design system export/);
  assert.match(empty, /npm run design:source -- --set spec/);

  write(
    'design/prototypes/Home.dc.html',
    '<body data-prototype-surface="mobile"><div data-preview-shell><main data-app-root>Home</main></div></body>\n',
  );
  write('design/planning/screen-inventory.md', '# Screen inventory\n');
  write('design/system/tokens.md', '# Tokens\n');
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

  // That rejected state is exactly what a product repository has committed between
  // releases, so the pull-request gate has to accept it or it fails on every PR.
  assert.match(
    run(VALIDATOR, true, ['--accept-acknowledged']),
    /design-batch-001 revision 0 \[incremental\]/,
  );

  // Accepting the settled state must not become a way to smuggle in a changed prototype.
  write(
    'design/prototypes/Home.dc.html',
    '<body data-prototype-surface="mobile"><div data-preview-shell><main data-app-root>Sneaky</main></div></body>\n',
  );
  assert.match(
    run(VALIDATOR, false, ['--accept-acknowledged']),
    /changed after design-batch-001 was synchronized/,
  );
  write(
    'design/prototypes/Home.dc.html',
    '<body data-prototype-surface="mobile"><div data-preview-shell><main data-app-root>Home</main></div></body>\n',
  );
  assert.match(run(VALIDATOR, true, ['--accept-acknowledged']), /design-batch-001 revision 0/);

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

  // Home is still on disk as the unacknowledged revision-1 content while the lock holds
  // the batch-2 content. A release that says nothing about Home must not hide that.
  write(
    'design/prototypes/Booking.dc.html',
    '<body data-prototype-surface="mobile"><main data-app-root>Booking two</main></body>\n',
  );
  write(
    'design/design-release.json',
    JSON.stringify(
      manifest({
        batch: 3,
        previousBatch: 2,
        releaseId: 'design-batch-003',
        readyForBuild: [
          { screen: 'Booking', prototype: 'prototypes/Booking.dc.html', change: 'updated' },
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
    /Home\.dc\.html changed since it was synchronized but is not listed in readyForBuild/,
  );

  // Restoring the synchronized content clears it; an undeclared prototype is fine as
  // long as it still matches what the repository accepted.
  write(
    'design/prototypes/Home.dc.html',
    '<body data-prototype-surface="mobile"><div data-preview-shell><main data-app-root>Updated home</main></div></body>\n',
  );
  assert.match(run(VALIDATOR, true), /design-batch-003 revision 0/);
  assert.match(run(ACK, true), /Acknowledged design-batch-003 revision 0/);
  const lock3 = JSON.parse(
    fs.readFileSync(path.join(TEMP, 'design/design-sync.lock.json')),
  );
  assert.equal(lock3.prototypeScreens['prototypes/Booking.dc.html'], 'Booking');

  // Deleting a synchronized prototype is only legitimate when the release retires it.
  fs.rmSync(path.join(TEMP, 'design/prototypes/Booking.dc.html'));
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
    /Booking\.dc\.html was synchronized previously but is now missing; list "Booking" in removedOrSuperseded/,
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
        removedOrSuperseded: ['Booking'],
      }),
      null,
      2,
    ) + '\n',
  );
  assert.match(run(VALIDATOR, true), /design-batch-004 revision 0/);
  assert.match(run(ACK, true), /Acknowledged design-batch-004 revision 0/);
  const lock4 = JSON.parse(
    fs.readFileSync(path.join(TEMP, 'design/design-sync.lock.json')),
  );
  assert.ok(!('prototypes/Booking.dc.html' in lock4.prototypeHashes));
  assert.ok(!('prototypes/Booking.dc.html' in lock4.prototypeScreens));

  // A logo contract has no data-app-root by design; it must still be releasable.
  write('design/prototypes/logo--brand.html', '<svg role="img"><title>Brand</title></svg>\n');
  write(
    'design/design-release.json',
    JSON.stringify(
      manifest({
        batch: 5,
        previousBatch: 4,
        releaseId: 'design-batch-005',
        readyForBuild: [
          { screen: 'Brand logo', prototype: 'prototypes/logo--brand.html', change: 'added' },
        ],
        stillInDesign: [],
        planned: [],
      }),
      null,
      2,
    ) + '\n',
  );
  assert.match(run(VALIDATOR, true), /design-batch-005 revision 0/);
  assert.match(run(ACK, true), /Acknowledged design-batch-005 revision 0/);

  // A lock written before prototype-to-screen names existed must still be able to retire
  // a prototype, otherwise the screen is stuck under contract forever.
  const legacyLock = JSON.parse(
    fs.readFileSync(path.join(TEMP, 'design/design-sync.lock.json')),
  );
  delete legacyLock.prototypeScreens;
  write('design/design-sync.lock.json', JSON.stringify(legacyLock, null, 2) + '\n');
  fs.rmSync(path.join(TEMP, 'design/prototypes/logo--brand.html'));
  write(
    'design/design-release.json',
    JSON.stringify(
      manifest({
        batch: 6,
        previousBatch: 5,
        releaseId: 'design-batch-006',
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
    /logo--brand\.html was synchronized previously but is now missing; list its screen/,
  );

  write(
    'design/design-release.json',
    JSON.stringify(
      manifest({
        batch: 6,
        previousBatch: 5,
        releaseId: 'design-batch-006',
        readyForBuild: [
          { screen: 'Home', prototype: 'prototypes/Home.dc.html', change: 'unchanged' },
        ],
        stillInDesign: [],
        planned: [],
        removedOrSuperseded: ['Brand logo'],
      }),
      null,
      2,
    ) + '\n',
  );
  assert.match(run(VALIDATOR, true), /design-batch-006 revision 0/);
  assert.match(run(ACK, true), /Acknowledged design-batch-006 revision 0/);
  const lock6 = JSON.parse(
    fs.readFileSync(path.join(TEMP, 'design/design-sync.lock.json')),
  );
  assert.ok(!('prototypes/logo--brand.html' in lock6.prototypeHashes));

  console.log('Incremental design release tests passed.');
} finally {
  fs.rmSync(TEMP, { recursive: true, force: true });
}

const SPEC = fs.mkdtempSync(path.join(os.tmpdir(), 'design-source-'));
const writeSpec = (relative, content) => {
  const file = path.join(SPEC, relative);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
};

try {
  assert.match(run(SOURCE, true, [], SPEC), /Design source: undecided/);

  // A committed release manifest keeps pre-switch Claude Design products working.
  writeSpec('design/design-release.json', JSON.stringify(manifest(), null, 2) + '\n');
  assert.match(
    run(SOURCE, true, [], SPEC),
    /Design source: claude-design \(inferred from design\/design-release\.json\)/,
  );

  // An explicit spec source wins over the manifest and makes the design gate a no-op.
  assert.match(
    run(SOURCE, true, ['--set', 'spec', '--brief', 'BRIEF.md'], SPEC),
    /Design source: spec \(from design\.config\.json\)[\s\S]*brief BRIEF\.md does not exist yet[\s\S]*is ignored while designSource is "spec"/,
  );
  assert.deepEqual(
    JSON.parse(fs.readFileSync(path.join(SPEC, 'design.config.json'), 'utf8')),
    { designSource: 'spec', brief: 'BRIEF.md' },
  );
  const specValidation = run(VALIDATOR, true, [], SPEC);
  assert.match(specValidation, /Design source is "spec"/);
  assert.match(run(VALIDATOR, true, ['--accept-acknowledged'], SPEC), /Design source is "spec"/);
  assert.match(run(ACK, false, [], SPEC), /no Claude Design release to acknowledge/);
  assert.ok(!fs.existsSync(path.join(SPEC, 'design/design-sync.lock.json')));

  writeSpec('BRIEF.md', '# Brief\n');
  const json = JSON.parse(run(SOURCE, true, ['--json'], SPEC));
  assert.equal(json.source, 'spec');
  assert.equal(json.brief, 'BRIEF.md');
  assert.ok(!json.warnings.some((warning) => warning.includes('does not exist')));

  // Invalid input fails loudly and never rewrites the committed choice.
  assert.match(
    run(SOURCE, false, ['--set', 'spec', '--brief', '../outside.md'], SPEC),
    /brief must stay inside the repository/,
  );
  assert.match(
    run(SOURCE, false, ['--set', 'claude-design', '--brief', 'BRIEF.md'], SPEC),
    /--brief is only valid with --set spec/,
  );
  assert.match(run(SOURCE, false, ['--set', 'figma'], SPEC), /must be one of: claude-design, spec/);
  assert.equal(JSON.parse(run(SOURCE, true, ['--json'], SPEC)).brief, 'BRIEF.md');

  writeSpec('design.config.json', JSON.stringify({ designSource: 'none' }) + '\n');
  assert.match(run(VALIDATOR, false, [], SPEC), /designSource must be one of/);

  assert.match(
    run(SOURCE, true, ['--set', 'claude-design'], SPEC),
    /Design source: claude-design \(from design\.config\.json\)/,
  );

  console.log('Design source tests passed.');
} finally {
  fs.rmSync(SPEC, { recursive: true, force: true });
}
