#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const rootIndex = process.argv.indexOf('--root');
const ROOT = path.resolve(rootIndex === -1 ? process.cwd() : process.argv[rootIndex + 1] || '');
const DESIGN = path.join(ROOT, 'design');

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
const supportedSurfaces = new Set(['web', 'mobile', 'tablet', 'desktop']);
const screenMetadata = [];
const metadataErrors = [];

for (const file of screenContracts) {
  const html = fs.readFileSync(path.join(DESIGN, file), 'utf8');
  const surfaces = [
    ...html.matchAll(/<[a-z][^>]*\bdata-prototype-surface\s*=\s*["']([^"']+)["'][^>]*>/gi),
  ];
  const appRoots = html.match(/<[a-z][^>]*\bdata-app-root\b[^>]*>/gi) || [];

  if (surfaces.length !== 1) {
    metadataErrors.push(
      `design/${file} must declare exactly one data-prototype-surface; found ${surfaces.length}.`,
    );
  }
  const surface = surfaces[0]?.[1]?.toLowerCase() || '';
  if (surface && !supportedSurfaces.has(surface)) {
    metadataErrors.push(
      `design/${file} uses unsupported surface "${surface}"; use web, mobile, tablet, or desktop.`,
    );
  }
  if (appRoots.length !== 1) {
    metadataErrors.push(
      `design/${file} must contain exactly one data-app-root; found ${appRoots.length}.`,
    );
  }
  if (surfaces.length === 1 && supportedSurfaces.has(surface) && appRoots.length === 1) {
    screenMetadata.push({ file, surface });
  }
}

if (!screenContracts.length) {
  throw new Error(
    'No supported screen prototype contracts found under design/prototypes/. ' +
      'Import screen--*.html or *.dc.html files before running /finalize-build-docs.',
  );
}
if (metadataErrors.length) {
  throw new Error(
    'Prototype production-boundary validation failed:\n- ' + metadataErrors.join('\n- ') +
      '\nRun /adapt-design-export <project name> to prepare the compatibility pass ' +
      'for the existing Claude Design project.',
  );
}
if (referenceDocs.length !== 1 || handoffPlans.length !== 1) {
  throw new Error(
    'Claude Design must export exactly one ' +
      'design/handoff/[PROJECT] Design Reference.md and one ' +
      'design/handoff/[PROJECT] Design Handoff Plan.md before running /finalize-build-docs. ' +
      'When prototypes already exist, run /adapt-design-export <project name> first.',
  );
}

console.log('Claude Design handoff inventory:');
for (const [group, files] of Object.entries(groups)) {
  console.log(`\n${group} (${files.length})`);
  for (const file of files) console.log(`- design/${file}`);
  if (!files.length) {
    console.log(`- warning: design/${group}/ is missing or empty`);
  }
}
console.log(`\nscreen prototype contracts (${screenMetadata.length})`);
for (const { file, surface } of screenMetadata) {
  console.log(`- design/${file} [${surface}]`);
}
console.log('\ndesign handoff documents (2)');
console.log(`- design/${referenceDocs[0]}`);
console.log(`- design/${handoffPlans[0]}`);
console.log(
  '\nDesign export is ready. In Claude Code run: /finalize-build-docs <project name>\n' +
    'Finalization creates Product Specification.md and Implementation Plan.md at the repository root.',
);
