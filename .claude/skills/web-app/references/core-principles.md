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

## Implementation Workflow

When generating or modifying code:

1. Match existing project patterns first.
2. Choose the simplest implementation that fits.
3. Follow `references/folder-structure.md` when deciding where new code belongs.
4. Keep code colocated by feature unless it is clearly shared.
5. Keep route entry files thin and move domain logic into features.
6. Use hooks, providers, and server-state tools consistently.
7. Prefer registry components first, then MCP-discovered components, then custom implementations.
8. Add loading, empty, and error states for async flows.
9. Avoid hydration-unstable rendering.
10. Prefer choices that protect Core Web Vitals.
11. Use inline modals or drawers for create and edit flows unless a dedicated page is clearly justified.
12. For performance changes, document the target metric and the reason.
13. For security-sensitive work, verify against the project security guidance.
14. For user-facing UI, verify responsiveness and accessibility.
15. For server mutations, prefer targeted cache updates or invalidation over reload-based solutions.

---

## Quick Pattern Selection Guide

| Situation | Pattern |
| --- | --- |
| Reusable component logic | custom hook |
| App-wide dependency or service | provider |
| Page wrapper or auth/layout concern | HOC |
| Flexible shared UI API | compound component |
| Complex local state transitions | `useReducer` |
| Shared structured state | `useReducer` + Context |
| High-frequency shared global state | Zustand or another external store |
| Server state fetching and mutations | TanStack Query, SWR, or Apollo Client |
| Simple create/edit UX in an existing workflow | modal, drawer, or inline editor |
| SEO-critical page with static content | SSG |
| SEO-critical page with periodic refresh needs | ISR |
| SEO-critical page with per-request data | SSR |

---

## Final Principle

Patterns are tools, not goals.

Choose the pattern that improves clarity, preserves consistency, supports maintainability, and avoids unnecessary complexity.
