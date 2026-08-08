---
description: Capture a verified product lesson and route it to the correct skills-source category
argument-hint: '<short lesson name>'
---

# Capture a project learning

Lesson name: $ARGUMENTS

1. Read `.skills-source/commands/capture-project-learning.md` in full. If the
   locked snapshot or command is missing, run `pnpm sync-skills` first.
2. Execute that canonical command exactly with the lesson name above, using the
   `project-learning-contributor` skill in capture mode.
3. Write the proposal only under `skill-contributions/` and validate it with
   `pnpm skills:contribution:validate -- --file <proposal path>`.
4. Never edit `.skills-source/`, generated `AGENTS.md`, or the skills-source
   repository directly from this command; merging the proposal to the default
   branch dispatches the upstream review issue.
5. Strip product identity, customer information, private URLs, credentials,
   and raw logs before writing the proposal.
