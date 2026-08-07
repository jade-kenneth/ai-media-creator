#!/usr/bin/env node
// UserPromptSubmit hook — routes defect reports into the triage workflow.
//
// A defect report arrives as ordinary prose ("X is broken"), and the default
// reaction is to start fixing. The workflow requires the opposite: verify the
// report is real before changing anything. This hook injects that context at
// the moment the report arrives, rather than relying on the skill description
// being matched.
//
// stdout from this hook is added to the conversation as context.

import { readFileSync } from 'node:fs';

/**
 * Phrasings that indicate something is reported broken, as opposed to a
 * request to build. Deliberately narrow: a false positive costs tokens on
 * every prompt, so ambiguous words ("issue", "problem", "change") are omitted.
 */
const DEFECT_SIGNALS = [
  /\bbug(s|gy)?\b/i,
  /\bdefects?\b/i,
  /\bregressions?\b/i,
  /\bbroken\b/i,
  /\bbreaks\b/i,
  /\bnot working\b/i,
  /\bdoesn'?t work\b/i,
  /\bstopped working\b/i,
  /\bfails? (to|when|with|intermittently)\b/i,
  /\bfailing\b/i,
  /\bcrash(es|ing|ed)?\b/i,
  /\bincidents?\b/i,
  /\boutage\b/i,
  /\bstack ?trace\b/i,
  /\bsentry\b/i,
  /\berror (report|in production|on prod)\b/i,
  /\bwrong (value|data|total|amount|count|result)\b/i,
  /\busers? (are |is )?(report|seeing|getting)/i,
];

/** A build request that merely mentions a defect word is not a defect report. */
const BUILD_SIGNALS = [
  /\b(implement|build|create|add|design|scaffold|generate) (a|an|the|new)\b/i,
  /\bnew feature\b/i,
  /\bfrom scratch\b/i,
];

function readStdin() {
  try {
    return readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

function main() {
  let input = {};

  try {
    input = JSON.parse(readStdin() || '{}');
  } catch {
    process.exit(0);
  }

  const prompt = String(input?.prompt ?? '');

  if (!prompt.trim()) {
    process.exit(0);
  }

  const looksLikeDefect = DEFECT_SIGNALS.some((pattern) =>
    pattern.test(prompt),
  );
  const looksLikeBuild = BUILD_SIGNALS.some((pattern) => pattern.test(prompt));

  if (!looksLikeDefect || looksLikeBuild) {
    process.exit(0);
  }

  process.stdout.write(
    [
      'This reads as a defect report. Before changing any code:',
      '',
      '1. Read `.skills-source/skills/defect-triage/SKILL.md` and follow it.',
      '2. Treat the report as a hypothesis. Separate what was observed from what',
      '   the reporter concluded, and from what they proposed as a fix.',
      '3. Reproduce before diagnosing. Assign one of the six verdicts — four of',
      '   them close the item with no code change.',
      '4. Close with a verification block whose reproduction is shown failing',
      '   before the change and passing after.',
      '',
      'If any changed path reads or writes tenant-owned data, the wrong-tenant',
      'case is part of the evidence, and a missing tenant constraint is a',
      'security defect at the highest severity regardless of what was reported.',
    ].join('\n'),
  );

  process.exit(0);
}

main();
