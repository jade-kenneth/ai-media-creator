#!/usr/bin/env node
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootIndex = process.argv.indexOf('--root');
const ROOT = path.resolve(rootIndex === -1 ? process.cwd() : process.argv[rootIndex + 1] || '');
const DESIGN = path.join(ROOT, 'design');
const RELEASE_PATH = path.join(DESIGN, 'design-release.json');
const LOCK_PATH = path.join(DESIGN, 'design-sync.lock.json');
const VALIDATOR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'validate-design-export.mjs',
);

execFileSync(process.execPath, [VALIDATOR, '--root', ROOT], {
  stdio: ['ignore', 'pipe', 'inherit'],
});

const release = JSON.parse(fs.readFileSync(RELEASE_PATH, 'utf8'));
const previous = fs.existsSync(LOCK_PATH)
  ? JSON.parse(fs.readFileSync(LOCK_PATH, 'utf8'))
  : { prototypeHashes: {} };
const prototypeHashes = {
  ...(previous.prototypeHashes && typeof previous.prototypeHashes === 'object'
    ? previous.prototypeHashes
    : {}),
};
const prototypeScreens = {
  ...(previous.prototypeScreens && typeof previous.prototypeScreens === 'object'
    ? previous.prototypeScreens
    : {}),
};

for (const item of release.readyForBuild) {
  const prototype = item.prototype.replaceAll('\\', '/').replace(/^design\//, '');
  prototypeHashes[prototype] = crypto
    .createHash('sha256')
    .update(fs.readFileSync(path.join(DESIGN, prototype)))
    .digest('hex');
  prototypeScreens[prototype] = item.screen;
}

// Drop prototypes that are no longer on disk, so the validator stops demanding a file
// that is deliberately gone. Validation ran first and already confirmed every deletion
// was declared in removedOrSuperseded, so a missing file here is an accepted retirement.
// Keying on the file rather than the screen name also retires prototypes recorded by an
// older acknowledgement script, which stored no screen names to match against.
for (const prototype of Object.keys(prototypeHashes)) {
  if (fs.existsSync(path.join(DESIGN, prototype))) continue;
  delete prototypeHashes[prototype];
  delete prototypeScreens[prototype];
}

const lock = {
  schemaVersion: 1,
  project: release.project,
  lastSyncedBatch: release.batch,
  lastSyncedRevision: release.revision,
  releaseId: release.releaseId,
  prototypeHashes: Object.fromEntries(
    Object.entries(prototypeHashes).sort(([a], [b]) => a.localeCompare(b)),
  ),
  prototypeScreens: Object.fromEntries(
    Object.entries(prototypeScreens).sort(([a], [b]) => a.localeCompare(b)),
  ),
};

fs.writeFileSync(LOCK_PATH, JSON.stringify(lock, null, 2) + '\n');
console.log(
  'Acknowledged ' + release.releaseId + ' revision ' + release.revision +
    ' in design/design-sync.lock.json',
);
