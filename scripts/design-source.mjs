#!/usr/bin/env node
import path from 'node:path';
import {
  DESIGN_CONFIG_FILENAME,
  DESIGN_SOURCES,
  resolveDesignSource,
  writeDesignSource,
} from './lib/design-source.mjs';

const USAGE = `Usage:
  npm run design:source                                 Print the resolved design source
  npm run design:source -- --set spec [--brief <path>]  Build from a written product brief
  npm run design:source -- --set claude-design          Build from the Claude Design export

Options:
  --json         Print the resolved source as JSON
  --root <dir>   Repository root (default: current directory)`;

function valueOf(flag) {
  const index = process.argv.indexOf(flag);
  if (index === -1) return undefined;
  const value = process.argv[index + 1];
  if (!value || value.startsWith('--')) throw new Error(`${flag} requires a value.`);
  return value;
}

const NEXT_STEP = {
  'claude-design':
    'Next: /prepare-claude-design <project name>, or /sync-build-docs <project name> after importing a release.',
  spec: 'Next: /sync-build-docs <project name> builds the Product Specification from the brief.',
  undecided:
    `Next: choose one with npm run design:source -- --set <${DESIGN_SOURCES.join('|')}>.`,
};

try {
  if (process.argv.includes('--help')) {
    console.log(USAGE);
    process.exit(0);
  }
  const root = path.resolve(valueOf('--root') ?? process.cwd());
  const target = valueOf('--set');
  const brief = valueOf('--brief');
  if (brief && target !== 'spec') throw new Error('--brief is only valid with --set spec.');

  const resolved = target
    ? writeDesignSource(root, target, brief)
    : resolveDesignSource(root);

  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(resolved, null, 2));
  } else {
    if (target) console.log(`Wrote ${DESIGN_CONFIG_FILENAME}.`);
    const origin = {
      config: `from ${DESIGN_CONFIG_FILENAME}`,
      'release-manifest': 'inferred from design/design-release.json',
      none: `no ${DESIGN_CONFIG_FILENAME} and no Claude Design release`,
    }[resolved.origin];
    console.log(`Design source: ${resolved.source} (${origin})`);
    if (resolved.brief) console.log(`Product brief: ${resolved.brief}`);
    for (const warning of resolved.warnings) console.log(`warning: ${warning}`);
    console.log(NEXT_STEP[resolved.source]);
  }
} catch (error) {
  console.error(error.message);
  console.error(USAGE);
  process.exit(1);
}
