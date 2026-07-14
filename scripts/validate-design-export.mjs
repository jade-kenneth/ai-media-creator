#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const rootIndex = process.argv.indexOf('--root');
const ROOT = path.resolve(rootIndex === -1 ? process.cwd() : process.argv[rootIndex + 1] || '');
const DESIGN = path.join(ROOT, 'design');
const allowSynced = process.argv.includes('--allow-synced');
const RELEASE_PATH = path.join(DESIGN, 'design-release.json');
const LOCK_PATH = path.join(DESIGN, 'design-sync.lock.json');
const supportedSurfaces = new Set(['web', 'mobile', 'tablet', 'desktop']);
const supportedChanges = new Set(['added', 'updated', 'unchanged']);

function filesUnder(directory) {
  if (!fs.existsSync(directory)) return [];
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...filesUnder(target));
    else if (entry.isFile()) files.push(path.relative(DESIGN, target).split(path.sep).join('/'));
  }
  return files.sort();
}

function readJson(file, label, errors) {
  if (!fs.existsSync(file)) {
    errors.push(label + ' is missing.');
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    errors.push(label + ' is not valid JSON: ' + error.message);
    return null;
  }
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function safeDesignPath(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  const normalized = value.replaceAll('\\', '/').replace(/^design\//, '');
  if (
    path.posix.isAbsolute(normalized) ||
    normalized.split('/').includes('..') ||
    !normalized.startsWith('prototypes/')
  ) return null;
  return normalized;
}

const groups = {
  prototypes: filesUnder(path.join(DESIGN, 'prototypes')),
  system: filesUnder(path.join(DESIGN, 'system')),
  planning: filesUnder(path.join(DESIGN, 'planning')),
  handoff: filesUnder(path.join(DESIGN, 'handoff')),
};
const referenceDocs = groups.handoff.filter(
  (file) => /(^|\/)[^/]+ Design Reference\.md$/i.test(file),
);
const handoffPlans = groups.handoff.filter(
  (file) => /(^|\/)[^/]+ Design Handoff Plan\.md$/i.test(file),
);
const prototypeContracts = groups.prototypes.filter(
  (file) => /(^|\/)screen--[^/]+\.html$/i.test(file) ||
    /(^|\/)logo--[^/]+\.html$/i.test(file) ||
    /\.dc\.html$/i.test(file),
);
const screenContracts = prototypeContracts.filter(
  (file) => !/(^|\/)logo--[^/]+\.html$/i.test(file),
);
const metadataErrors = [];
const releaseErrors = [];
const screenMetadata = new Map();

for (const file of screenContracts) {
  const html = fs.readFileSync(path.join(DESIGN, file), 'utf8');
  const surfaces = [
    ...html.matchAll(/<[a-z][^>]*\bdata-prototype-surface\s*=\s*["']([^"']+)["'][^>]*>/gi),
  ];
  const appRoots = html.match(/<[a-z][^>]*\bdata-app-root\b[^>]*>/gi) || [];
  const surface = surfaces[0]?.[1]?.toLowerCase() || '';

  if (surfaces.length !== 1) {
    metadataErrors.push(
      'design/' + file + ' must declare exactly one data-prototype-surface; found ' +
        surfaces.length + '.',
    );
  }
  if (surface && !supportedSurfaces.has(surface)) {
    metadataErrors.push(
      'design/' + file + ' uses unsupported surface "' + surface +
        '"; use web, mobile, tablet, or desktop.',
    );
  }
  if (appRoots.length !== 1) {
    metadataErrors.push(
      'design/' + file + ' must contain exactly one data-app-root; found ' +
        appRoots.length + '.',
    );
  }
  if (surfaces.length === 1 && supportedSurfaces.has(surface) && appRoots.length === 1) {
    screenMetadata.set(file, { surface, hash: sha256(path.join(DESIGN, file)) });
  }
}

if (!screenContracts.length) {
  releaseErrors.push(
    'No supported screen prototype contracts found under design/prototypes/. ' +
      'Import screen--*.html or *.dc.html files before synchronizing build docs.',
  );
}
if (!groups.planning.includes('planning/screen-inventory.md')) {
  releaseErrors.push(
    'design/planning/screen-inventory.md is required for incremental release status.',
  );
}
if (referenceDocs.length !== 1 || handoffPlans.length !== 1) {
  releaseErrors.push(
    'Claude Design must export exactly one design/handoff/[PROJECT] Design Reference.md ' +
      'and one design/handoff/[PROJECT] Design Handoff Plan.md.',
  );
}

const release = readJson(RELEASE_PATH, 'design/design-release.json', releaseErrors);
let lock = null;
if (fs.existsSync(LOCK_PATH)) {
  lock = readJson(LOCK_PATH, 'design/design-sync.lock.json', releaseErrors);
}

if (release) {
  if (release.schemaVersion !== 1) releaseErrors.push('design release schemaVersion must be 1.');
  if (typeof release.project !== 'string' || !release.project.trim()) {
    releaseErrors.push('design release project must be a non-empty string.');
  }
  if (!Number.isInteger(release.batch) || release.batch < 1) {
    releaseErrors.push('design release batch must be an integer greater than zero.');
  }
  if (!Number.isInteger(release.revision) || release.revision < 0) {
    releaseErrors.push('design release revision must be a non-negative integer.');
  }
  if (!Number.isInteger(release.previousBatch) || release.previousBatch < 0) {
    releaseErrors.push('design release previousBatch must be a non-negative integer.');
  }
  const expectedReleaseId = Number.isInteger(release.batch)
    ? 'design-batch-' + String(release.batch).padStart(3, '0')
    : '';
  if (release.releaseId !== expectedReleaseId) {
    releaseErrors.push('design release releaseId must be "' + expectedReleaseId + '".');
  }
  if (!['incremental', 'final'].includes(release.status)) {
    releaseErrors.push('design release status must be "incremental" or "final".');
  }

  for (const key of ['readyForBuild', 'stillInDesign', 'planned', 'removedOrSuperseded']) {
    if (!Array.isArray(release[key])) {
      releaseErrors.push('design release ' + key + ' must be an array.');
    }
  }

  const ready = Array.isArray(release.readyForBuild) ? release.readyForBuild : [];
  if (!ready.length) releaseErrors.push('design release readyForBuild must contain at least one screen.');
  const seenScreens = new Set();
  const seenPrototypes = new Set();
  const currentHashes = {};

  for (const item of ready) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      releaseErrors.push('each readyForBuild entry must be an object.');
      continue;
    }
    if (typeof item.screen !== 'string' || !item.screen.trim()) {
      releaseErrors.push('each readyForBuild entry needs a non-empty screen.');
    } else if (seenScreens.has(item.screen)) {
      releaseErrors.push('readyForBuild contains duplicate screen "' + item.screen + '".');
    } else {
      seenScreens.add(item.screen);
    }

    const prototype = safeDesignPath(item.prototype);
    if (!prototype) {
      releaseErrors.push(
        'readyForBuild screen "' + (item.screen || 'unknown') +
          '" has an invalid prototype path.',
      );
      continue;
    }
    if (seenPrototypes.has(prototype)) {
      releaseErrors.push('readyForBuild contains duplicate prototype "' + prototype + '".');
    }
    seenPrototypes.add(prototype);
    if (!prototypeContracts.includes(prototype)) {
      releaseErrors.push('readyForBuild prototype "design/' + prototype + '" does not exist.');
      continue;
    }
    if (!screenMetadata.has(prototype)) {
      releaseErrors.push(
        'readyForBuild prototype "design/' + prototype + '" has invalid screen metadata.',
      );
    }
    currentHashes[prototype] = sha256(path.join(DESIGN, prototype));

    if (!supportedChanges.has(item.change)) {
      releaseErrors.push(
        'readyForBuild screen "' + (item.screen || 'unknown') +
          '" change must be added, updated, or unchanged.',
      );
    }
  }

  const blockedNames = new Set();
  for (const key of ['stillInDesign', 'planned', 'removedOrSuperseded']) {
    for (const value of Array.isArray(release[key]) ? release[key] : []) {
      if (typeof value !== 'string' || !value.trim()) {
        releaseErrors.push('design release ' + key + ' entries must be non-empty strings.');
      } else if (blockedNames.has(value)) {
        releaseErrors.push(
          'screen "' + value + '" appears in more than one non-ready status list.',
        );
      } else {
        blockedNames.add(value);
      }
    }
  }
  for (const screen of seenScreens) {
    if (blockedNames.has(screen)) {
      releaseErrors.push(
        'screen "' + screen + '" cannot be both readyForBuild and blocked/superseded.',
      );
    }
  }

  if (
    release.status === 'final' &&
    ((release.stillInDesign?.length || 0) > 0 || (release.planned?.length || 0) > 0)
  ) {
    releaseErrors.push(
      'a final design release cannot contain stillInDesign or planned required scope.',
    );
  }

  if (!lock) {
    if (release.batch !== 1) {
      releaseErrors.push('the first unsynchronized release must be batch 1.');
    }
    if (release.previousBatch !== 0) releaseErrors.push('batch 1 previousBatch must be 0.');
    for (const item of ready) {
      if (item?.change && item.change !== 'added') {
        releaseErrors.push('every screen in the first release must use change "added".');
      }
    }
  } else {
    if (lock.schemaVersion !== 1) {
      releaseErrors.push('design sync lock schemaVersion must be 1.');
    }
    if (lock.project !== release.project) {
      releaseErrors.push('design release project does not match the synchronization lock.');
    }
    const lastBatch = lock.lastSyncedBatch;
    const lastRevision = lock.lastSyncedRevision;
    const isNextBatch = release.batch === lastBatch + 1;
    const isRevision = release.batch === lastBatch && release.revision > lastRevision;
    const isSyncedFinal =
      allowSynced &&
      release.status === 'final' &&
      release.batch === lastBatch &&
      release.revision === lastRevision &&
      release.releaseId === lock.releaseId;

    if (!isNextBatch && !isRevision && !isSyncedFinal) {
      releaseErrors.push(
        'design release ' + release.batch + ' revision ' + release.revision +
          ' is not newer than synchronized batch ' + lastBatch + ' revision ' +
          lastRevision + '; expected batch ' + (lastBatch + 1) +
          ' or a higher revision of batch ' + lastBatch + '.',
      );
    }
    const expectedPrevious = release.batch - 1;
    if (release.previousBatch !== expectedPrevious) {
      releaseErrors.push(
        'design release previousBatch must be ' + expectedPrevious +
          ' for batch ' + release.batch + '.',
      );
    }

    const priorHashes =
      lock.prototypeHashes && typeof lock.prototypeHashes === 'object'
        ? lock.prototypeHashes
        : {};
    for (const item of ready) {
      const prototype = safeDesignPath(item?.prototype);
      if (!prototype || !currentHashes[prototype]) continue;
      const previousHash = priorHashes[prototype];
      if (isSyncedFinal) {
        if (!previousHash || previousHash !== currentHashes[prototype]) {
          releaseErrors.push(
            'design/' + prototype + ' changed after the final release was synchronized.',
          );
        }
        continue;
      }
      if (item.change === 'added' && previousHash) {
        releaseErrors.push(
          'design/' + prototype + ' is not new; mark it updated or unchanged.',
        );
      }
      if (item.change === 'updated' && !previousHash) {
        releaseErrors.push(
          'design/' + prototype + ' has no synchronized version; mark it added.',
        );
      }
      if (item.change === 'updated' && previousHash === currentHashes[prototype]) {
        releaseErrors.push(
          'design/' + prototype + ' is marked updated but its content did not change.',
        );
      }
      if (item.change === 'unchanged' && !previousHash) {
        releaseErrors.push(
          'design/' + prototype + ' has no synchronized version; mark it added.',
        );
      }
      if (item.change === 'unchanged' && previousHash !== currentHashes[prototype]) {
        releaseErrors.push('design/' + prototype + ' changed; mark it updated.');
      }
    }
  }
}

const errors = [...metadataErrors, ...releaseErrors];
if (errors.length) {
  throw new Error(
    'Claude Design release validation failed:\n- ' + errors.join('\n- ') +
      '\nUse /adapt-design-export <project name> for export-contract corrections.',
  );
}

console.log('Claude Design release inventory:');
console.log(
  '- ' + release.releaseId + ' revision ' + release.revision + ' [' + release.status + ']',
);
console.log('- previous batch: ' + release.previousBatch);
console.log('- ready in this release: ' + release.readyForBuild.length);
console.log('- still in design: ' + release.stillInDesign.length);
console.log('- planned: ' + release.planned.length);
console.log('- removed or superseded: ' + release.removedOrSuperseded.length);
console.log(
  lock
    ? '- last synchronized: batch ' + lock.lastSyncedBatch +
        ' revision ' + lock.lastSyncedRevision
    : '- last synchronized: none (first release)',
);

for (const [group, files] of Object.entries(groups)) {
  console.log('\n' + group + ' (' + files.length + ')');
  for (const file of files) console.log('- design/' + file);
  if (!files.length) console.log('- warning: design/' + group + '/ is missing or empty');
}

console.log('\nRelease is valid. In Claude Code run: /sync-build-docs <project name>');
if (release.status === 'final') {
  console.log('After synchronization, run: /finalize-build-docs <project name>');
}
