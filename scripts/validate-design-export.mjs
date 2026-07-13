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

if (!prototypeContracts.length) {
  throw new Error(
    'No supported prototype contracts found under design/prototypes/. ' +
      'Import screen--*.html, logo--*.html, or *.dc.html files before running /finalize-build-docs.',
  );
}
if (referenceDocs.length !== 1 || handoffPlans.length !== 1) {
  throw new Error(
    'Claude Design must export exactly one ' +
      'design/handoff/[PROJECT] Design Reference.md and one ' +
      'design/handoff/[PROJECT] Design Handoff Plan.md before running /finalize-build-docs.',
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
console.log('\ndesign handoff documents (2)');
console.log(`- design/${referenceDocs[0]}`);
console.log(`- design/${handoffPlans[0]}`);
console.log(
  '\nDesign export is ready. In Claude Code run: /finalize-build-docs <project name>',
);
