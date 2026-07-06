# Core Principles

## Core Principle

Write simple, readable, feature-focused code.

Prefer clarity over cleverness. Introduce abstraction only when repetition is real and the abstraction clearly improves maintainability.

---

## Instruction Priority

When making decisions, prefer this order:

1. Existing repository conventions
2. Safety, correctness, and maintainability
3. Simplicity and readability
4. Performance and user experience
5. Reuse and abstraction

---

## Pattern Consistency Rule

Do not introduce a new implementation pattern when an established pattern already exists in the same layer or feature.

- Prioritize the current codebase structure, naming, data-flow, and hook/module patterns.
- If you must deviate, do so only when truly necessary, keep the change minimal, and document the rationale.
- Do not introduce or keep deprecated APIs, methods, or libraries when a maintained alternative exists; use the current supported approach.

---

## Implementation Workflow and Pattern Selection

The canonical **Implementation workflow** and **Pattern selection guide** live in `SKILL.md`. This doc holds the principles behind them; do not maintain a second copy here — earlier duplicates drifted (e.g. an outdated rule that routed auth/layout gates to HOCs instead of client wrappers with `children`).

When applying the workflow, the priorities in this doc decide conflicts: existing conventions beat safety-neutral preferences, and safety/correctness beats simplicity, performance, and reuse.

---

## Final Principle

Patterns are tools, not goals.

Choose the pattern that improves clarity, preserves consistency, supports maintainability, and avoids unnecessary complexity.

---

## Related References

- `SKILL.md` — canonical non-negotiables, pattern selection guide, and implementation workflow
- `references/folder-structure.md` — where new code belongs
- `references/state-management.md` — decision entry point for state tooling
- `references/common-anti-patterns.md` — what violating these principles looks like in practice
