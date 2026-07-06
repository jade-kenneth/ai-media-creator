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

- Prioritize the current codebase structure, naming, data-flow, and hook/provider/module patterns.
- If you must deviate, do so only when truly necessary, keep the change minimal, and document the rationale.
- Do not introduce or keep deprecated APIs, methods, or libraries when a maintained alternative exists; use the current supported approach.

---

## Implementation Workflow

When generating or modifying code:

1. Match existing project patterns first.
2. Choose the simplest implementation that fits.
3. Keep code colocated by feature unless it is clearly shared.
4. Keep screen entry files thin and move domain logic into features.
5. Use hooks, providers, and server-state tools consistently.
6. Add loading, empty, and error states for async flows.
7. Avoid unnecessary re-renders and unstable first renders.
8. Prefer choices that protect startup time, input responsiveness, and scroll performance.
9. Use inline modals, sheets, or focused screens for create and edit flows based on the user journey.
10. For performance changes, document the target metric and the reason.
11. For security-sensitive work, verify against the project security guidance.
12. For user-facing UI, verify responsiveness and accessibility.
13. For server mutations, prefer targeted cache updates or invalidation over reload-based solutions.

---

## Common Anti-Patterns to Avoid

Do not:

- Over-abstract early
- Repeat fetch logic across multiple components
- Dump feature-specific logic into global utilities
- Use HOCs for logic that should be a hook
- Create unnecessary re-renders
- Force full screen reload patterns after local mutations when cache update or refetch is sufficient
- Invalidate the entire cache when only a small set of queries is affected
- Silence type errors with broad `as`
- Suppress null checks with non-null assertions
- Scatter raw analytics calls across the codebase
- Treat responsive issues as optional polish
- Drill props through many intermediate components instead of using context or better state boundaries
- Create effect loops by reading and writing the same state in one effect
- Build custom components before checking existing shared primitives
- Add native dependencies when an Expo-compatible solution already fits

---

## Quick Pattern Selection Guide

| Situation | Pattern |
| --- | --- |
| Reusable component logic | custom hook |
| App-wide dependency or service | provider |
| Screen wrapper or auth/layout concern | HOC |
| Flexible shared UI API | compound component |
| Complex local state transitions | `useReducer` |
| Shared structured state | `useReducer` + Context |
| High-frequency shared global state | Zustand or another external store |
| Server state fetching and mutations | TanStack Query, SWR, or Apollo Client |
| Simple create/edit UX in an existing workflow | modal, bottom sheet, or inline editor |

---

## Final Principle

Patterns are tools, not goals.

Choose the pattern that improves clarity, preserves consistency, supports maintainability, and avoids unnecessary complexity.

---

## Related References

- `references/state-management.md` — state boundaries and the `useState` → `useReducer` → Context → external-store decision guide
- `references/folder-structure.md` — where each kind of code belongs and feature colocation
- `references/performance.md` — the perceived-performance priority order referenced in step 8 above
- `references/common-anti-patterns.md` — the same anti-patterns with the "what to do instead" for each
- `references/react-patterns.md` — the pattern implementations (custom hook, provider, HOC, compound, headless)
