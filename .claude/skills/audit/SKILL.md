---
name: audit
description: "Senior Frontend Audit Format. USE for every audit request across web and mobile unless explicitly overridden. TRIGGERS: 'audit this', 'review this component', 'audit this screen', 'audit this feature', 'code review', 'check this for issues'. Produces a structured Markdown report with prioritized findings (P0–P3), root cause analysis, implementation tasks, and a Definition of Done."
---

# Senior Frontend Audit Format

Apply this format to every audit request unless the user explicitly says otherwise.

---

## Step 1 — Scope and Context

Before writing findings, state:

- **Audit scope**: which files, features, or areas were reviewed
- **Stack context**: relevant frameworks, libraries, and patterns in the audited code
- **Audit type**: one of `full`, `targeted`, `regression`, `performance`, `accessibility`, `security`

If the user specifies scope, use it. If not, infer it from the files or feature context provided.

---

## Step 2 — Output Structure

Return the audit in Markdown using this structure exactly:

---

# Audit Result Tasks

## Goal

State the purpose of this audit in one or two sentences. Include what success looks like.

## Priority Legend

| Priority | Meaning | Action Required | Typical SLA |
| --- | --- | --- | --- |
| `P0` | **Critical** — Production broken, data loss risk, security vulnerability, auth bypass, or crash | Must fix before merge/deploy | Immediate |
| `P1` | **High** — Functional bugs, hydration errors, broken user flows, accessibility violations (WCAG A), significant performance regressions | Fix in current sprint/PR | 1–3 days |
| `P2` | **Medium** — UX inconsistencies, responsiveness issues, maintainability debt, minor accessibility gaps (WCAG AA), non-critical performance | Fix in next sprint or follow-up PR | 1–2 weeks |
| `P3` | **Low** — Code cleanup, naming consistency, minor style issues, documentation gaps, nice-to-have improvements | Backlog / opportunistic | Best effort |

## P0 - Critical Fixes

## P1 - High Priority Fixes

## P2 - UX / Responsiveness / Maintainability

## P3 - Cleanup / Consistency

---

## Step 3 — Finding Format

For each finding, use:

### [number]. [short task title]

- `Priority`: `P0 | P1 | P2 | P3`
- `Status`: `Open` or `Completed` or `Reviewed (No change needed)`
- `Category`: one of `Bug`, `Security`, `Performance`, `Accessibility`, `UX`, `Responsiveness`, `Type Safety`, `Architecture`, `Maintainability`, `Cleanup`
- `Affected metric` (if applicable): `LCP`, `INP`, `TBT`, `CLS`, `FID`, `WCAG Level`, `Lighthouse Score`
- `Files`:
  - `path/to/file` — brief note on what is wrong in this file
- `Root cause analysis`:
  - Clear explanation of the **real underlying issue**, not just the surface symptom
  - Include **why** this happened (missing guard, wrong assumption, incorrect API usage, copy-paste drift)
  - If the root cause affects other locations, note that explicitly
- `Impact`:
  - What users, flows, or systems are affected
  - What happens if this is not fixed (crash on mobile Safari, stale data after mutation, screen reader cannot navigate)
- `Tasks`:
  - Numbered action items, each specific enough to implement without ambiguity
  - Reference exact file paths, function names, or component names
- `Fix implemented`:
  - Include only if already fixed or if the user requested fixes
  - Show the exact change made (file, before/after summary)
  - If multiple files changed, list each
- `Best approach`:
  - Beginner-friendly implementation guidance
  - Include relevant code patterns, API references, or links to project documentation
  - If multiple valid approaches exist, state the recommended one and briefly explain why
- `Acceptance criteria`:
  - Observable expected result that can be verified manually or with a test
  - Be specific: "Modal closes on Escape key press and returns focus to the trigger button" not "Modal works correctly"

---

## Step 4 — Post-Finding Sections

After all priority sections, always include:

### Suggested Implementation Order (Recommended)

- List findings in the order they should be fixed, considering dependencies between tasks
- Group by PR when multiple findings can be fixed together
- Note any findings that are blocked by others

### Best Approach Summary

- Summarize the top 3–5 most impactful changes and their expected benefit
- If a single architectural fix resolves multiple findings, call it out explicitly

### Definition of Done (Overall)

Concrete checklist of conditions that must all be true for the audit to be considered resolved:

- [ ] All P0 findings are fixed and verified
- [ ] All P1 findings are fixed or have a documented deferral reason
- [ ] P2/P3 findings are tracked in backlog
- [ ] No new console errors or warnings introduced
- [ ] Lighthouse scores maintained or improved (state baseline if known)
- [ ] Responsive layout verified at 375px, 768px, 1280px
- [ ] (Add audit-specific items as needed)

### Root Cause Analysis and Fix Log

| # | Finding | Root Cause | Fix Summary | Status |
| --- | --- | --- | --- | --- |
| 1 | ... | ... | ... | Open/Completed |

---

## Step 5 — Backlog Sections

Add backlog sections when relevant. Each backlog section should include:

- A brief description of the category and why it matters
- Ordered list of findings with priority and effort estimate (`low`, `medium`, `high`)

Standard backlog categories:

- **Performance and Lighthouse Follow-Up** — Core Web Vitals improvements, bundle size reduction, render optimization
- **TypeScript Standards Follow-Up** — Type safety improvements, `any` removal, branded types, stricter generics
- **useCallback / useMemo Audit Findings** — Unnecessary memoization, missing memoization for expensive paths
- **Accessibility / WCAG Findings** — ARIA labels, keyboard navigation, focus management, contrast, screen reader support
- **Provider / Context Audit Findings** — Provider scope issues, unnecessary re-renders, state duplication
- **GraphQL / Codegen / Config Audit Findings** — Missing `id` selections, cache policy issues, unused operations
- **Security Findings** — Input validation gaps, exposed secrets, authorization checks, XSS vectors
- **Responsive Design Findings** — Breakpoint issues, overflow bugs, touch target sizes, mobile navigation

---

## Step 6 — File Rule

- Automatically append the full audit result to `TASK.md`
- Create `TASK.md` if it does not exist
- Never overwrite existing content unless the user explicitly asks
- Append using this separator:

```
---

## Audit Entry - [title or scope]

Date: [YYYY-MM-DD]
Scope: [files/features audited]
Type: [full/targeted/regression/performance/accessibility/security]
```

- If file writing is unavailable, return the audit normally and clearly state that `TASK.md` was not written

---

## Writing Style

- Keep it concrete, actionable, and beginner-friendly where possible
- Explain root cause, not just symptoms
- Focus on production risks, auth flow, hydration, rendering stability, maintainability, accessibility, and type safety
- Reference exact file paths and function/component names — never use vague references like "the component" or "the hook"
- When referencing a pattern or standard from project documentation, link to the specific document
- Quantify impact when possible ("affects ~3 components", "blocks all mobile users", "adds ~50kb to bundle")
- Avoid filler language — every sentence should add information or context
