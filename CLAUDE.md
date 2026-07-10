# CLAUDE.md

- Conventions: see AGENTS.md (generated) and .skills-source/conventions/
- Task files: task_*.md in repo root; work phase by phase, check off items as completed
- Stack skills are installed globally; prefer them over general knowledge
- After completing a phase, update the corresponding Notion task status

## Design (origin: Claude Design)

- ALL product planning and UI/UX for this project was done in Claude Design and
  exported to design/. That export is the origin of look, behavior, and scope.
  This boilerplate contributes BACKEND PLUMBING ONLY; its UI is discarded.
- design/prototypes/ — pixel-exact, behavior-exact contract. Port the markup verbatim;
  never rebuild a screen from a written description. Never loose inspiration.
- design/system/ — normative tokens/type/color/motion/voice.
- design/planning/ — context only (flows, IA, scope). Never ported as markup.
- Conflict order: prototypes > system > planning > repo conventions (code only) >
  boilerplate UI (never wins).
- [PROJECT]Reference.md + Task Plan are generated from design/ via /gen-build-docs.
  Tie-break between them: Reference wins on look/interaction, Task Plan on build order.
