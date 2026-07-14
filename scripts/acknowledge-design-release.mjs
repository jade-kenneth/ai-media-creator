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

for (const item of release.readyForBuild) {
  const prototype = item.prototype.replaceAll('\\', '/').replace(/^design\//, '');
  prototypeHashes[prototype] = crypto
    .createHash('sha256')
    .update(fs.readFileSync(path.join(DESIGN, prototype)))
    .digest('hex');
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
};

fs.writeFileSync(LOCK_PATH, JSON.stringify(lock, null, 2) + '\n');
console.log(
  'Acknowledged ' + release.releaseId + ' revision ' + release.revision +
    ' in design/design-sync.lock.json',
);
