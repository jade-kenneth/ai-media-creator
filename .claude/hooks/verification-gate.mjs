#!/usr/bin/env node
// Stop hook — blocks a completion claim that has no recorded verification.
//
// The workflow requires a verification block whenever code changes (see
// conventions/workflow.md section 6 in skills-source, mirrored into the
// generated AGENTS.md). A convention only an agent can choose to follow is not
// a gate; this hook is the gate.
//
// Blocks when: source files changed in the working tree AND no verification
// block appears in the recent transcript or in a task file.
// Never blocks twice in a row (honors stop_hook_active), and can be disabled
// with CLAUDE_SKIP_VERIFICATION_GATE=1 for sessions that are not code work.

import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';

const projectDir = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();

/** Paths whose modification means "code changed" and evidence is owed. */
const SOURCE_PREFIXES = ['apps/', 'packages/', 'tools/', 'scripts/'];
const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'];

/** How far back in the transcript to look for the evidence block. */
const TRANSCRIPT_TAIL_MESSAGES = 40;

/** A verification block, in the shape the workflow defines. */
const EVIDENCE_HEADING = /^\s*#{1,4}\s*Verification\b/im;
/**
 * The block is only credible with real recorded runs. A heading alone, or a
 * heading followed by prose, is not evidence.
 */
const EVIDENCE_FIELDS = /^\s*(Checks|After|Before|Not run)\s*:/im;

function readStdin() {
  try {
    return readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

function git(args) {
  try {
    return execFileSync('git', args, {
      cwd: projectDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch {
    return '';
  }
}

function isSourcePath(file) {
  return (
    SOURCE_PREFIXES.some((prefix) => file.startsWith(prefix)) &&
    SOURCE_EXTENSIONS.some((extension) => file.endsWith(extension))
  );
}

/** Files changed in the working tree, staged or not. */
function changedSourceFiles() {
  const porcelain = git(['status', '--porcelain']);

  if (!porcelain.trim()) {
    return [];
  }

  return porcelain
    .split('\n')
    .map((line) => line.slice(3).trim())
    // A rename reads as "old -> new"; the new path is what was written.
    .map((path) => (path.includes(' -> ') ? path.split(' -> ')[1] : path))
    .filter(Boolean)
    .filter(isSourcePath);
}

function hasEvidence(text) {
  return EVIDENCE_HEADING.test(text) && EVIDENCE_FIELDS.test(text);
}

/**
 * Scans the tail of the session transcript. The transcript is JSONL, one event
 * per line; assistant text is what a completion claim would have been written
 * into.
 */
function transcriptHasEvidence(transcriptPath) {
  if (!transcriptPath || !existsSync(transcriptPath)) {
    return false;
  }

  let lines;

  try {
    lines = readFileSync(transcriptPath, 'utf8').trim().split('\n');
  } catch {
    return false;
  }

  for (const line of lines.slice(-TRANSCRIPT_TAIL_MESSAGES)) {
    let event;

    try {
      event = JSON.parse(line);
    } catch {
      continue;
    }

    const content = event?.message?.content;

    if (typeof content === 'string') {
      if (hasEvidence(content)) return true;
      continue;
    }

    if (!Array.isArray(content)) continue;

    for (const block of content) {
      if (typeof block?.text === 'string' && hasEvidence(block.text)) {
        return true;
      }
    }
  }

  return false;
}

/** Task files are the other place the workflow accepts the block. */
function taskFileHasEvidence() {
  const candidates = git(['ls-files', 'task.md', 'TASK_*.md'])
    .split('\n')
    .map((file) => file.trim())
    .filter(Boolean);

  // Include untracked task files: a task file created this session is exactly
  // where the block for this session's work would be written.
  const untracked = git(['ls-files', '--others', '--exclude-standard', 'task.md', 'TASK_*.md'])
    .split('\n')
    .map((file) => file.trim())
    .filter(Boolean);

  for (const file of [...new Set([...candidates, ...untracked])]) {
    try {
      if (hasEvidence(readFileSync(`${projectDir}/${file}`, 'utf8'))) {
        return true;
      }
    } catch {
      continue;
    }
  }

  return false;
}

function main() {
  if (process.env.CLAUDE_SKIP_VERIFICATION_GATE === '1') {
    process.exit(0);
  }

  let input = {};

  try {
    input = JSON.parse(readStdin() || '{}');
  } catch {
    input = {};
  }

  // Already blocked once this turn. Blocking again would loop.
  if (input.stop_hook_active) {
    process.exit(0);
  }

  const changed = changedSourceFiles();

  if (changed.length === 0) {
    process.exit(0);
  }

  if (transcriptHasEvidence(input.transcript_path) || taskFileHasEvidence()) {
    process.exit(0);
  }

  const preview = changed.slice(0, 10);
  const remainder = changed.length - preview.length;

  process.stderr.write(
    [
      'Verification gate: source files changed, but no verification block was recorded.',
      '',
      'Changed:',
      ...preview.map((file) => `  ${file}`),
      ...(remainder > 0 ? [`  …and ${remainder} more`] : []),
      '',
      'Record the block from the workflow (AGENTS.md section 6) in your reply or in',
      'the active task file, with output from runs that actually happened:',
      '',
      '  ## Verification',
      '  Change:   <one line>',
      '  Before:   <command> / <output showing prior behavior>',
      '  After:    <command> / <output showing new behavior>',
      '  Checks:   <command> — <pass/fail, counts>',
      '  Tenant:   <wrong-tenant result, or "n/a — why">',
      '  Not run:  <check> — <why> — <residual risk>',
      '',
      'A check that could not run belongs under "Not run" with its residual risk.',
      'Do not record a check that did not run. If this session is not code work,',
      'set CLAUDE_SKIP_VERIFICATION_GATE=1.',
    ].join('\n'),
  );

  process.exit(2);
}

main();
