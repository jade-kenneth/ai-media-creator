# Mobile Audit Format

Use this format for every audit request unless explicitly told otherwise.

---

## Scope and Context

Before writing findings, state:

- **Audit scope**: which files, features, or areas were reviewed
- **Stack context**: relevant frameworks, libraries, and patterns in the audited code
- **Audit type**: one of `full`, `targeted`, `regression`, `performance`, `accessibility`, `security`

If scope is specified, use it. If not, infer from the files or feature context provided.

---

## Output Format

Return the audit in Markdown using this structure exactly:

# Audit Result Tasks

## Goal

State the purpose of this audit in one or two sentences. Include what success looks like.

## Priority Legend

| Priority | Meaning | Action Required | Typical SLA |
|---|---|---|---|
| `P0` | **Critical** — App crash, data loss risk, security vulnerability, auth bypass, or broken core flow | Must fix before merge/deploy | Immediate |
| `P1` | **High** — Functional bugs, broken user flows, accessibility violations (WCAG A), significant performance regressions, keyboard/safe area issues | Fix in current sprint/PR | 1–3 days |
| `P2` | **Medium** — UX inconsistencies, responsiveness issues, maintainability debt, minor accessibility gaps (WCAG AA), non-critical performance | Fix in next sprint or follow-up PR | 1–2 weeks |
| `P3` | **Low** — Code cleanup, naming consistency, minor style issues, documentation gaps, nice-to-have improvements | Backlog / opportunistic | Best effort |

## P0 - Critical Fixes

## P1 - High Priority Fixes

## P2 - UX / Responsiveness / Maintainability

## P3 - Cleanup / Consistency

---

For each finding, use:

### [number]. [short task title]

- `Priority`: `P0 | P1 | P2 | P3`
- `Status`: `Open` or `Completed` or `Reviewed (No change needed)`
- `Category`: one of `Bug`, `Security`, `Performance`, `Accessibility`, `UX`, `Responsiveness`, `Type Safety`, `Architecture`, `Maintainability`, `Cleanup`
- `Affected metric` (if applicable): `Startup Time`, `Input Latency`, `Scroll FPS`, `Layout Stability`, `Memory`, `WCAG Level`, `Interaction Jank`
- `Files`:
  - `path/to/file` — brief note on what is wrong in this file
- `Root cause analysis`:
  - Clear explanation of the **real underlying issue**, not just the surface symptom
  - Include **why** this happened (missing guard, wrong assumption, incorrect API usage, copy-paste drift, etc.)
  - If the root cause affects other locations, note that explicitly
- `Steps to reproduce` (for bugs):
  - Step-by-step on device or simulator
  - Note iOS vs Android if behavior differs
- `Recommended fix`:
  - Concrete code-level guidance
  - Prefer the simplest fix that addresses the root cause
  - Note platform-specific behavior when relevant

---

## Category Definitions

| Category | Scope |
|---|---|
| `Bug` | Incorrect behavior, broken state, wrong output |
| `Security` | Exposed secrets, insecure storage, missing auth checks |
| `Performance` | Startup regression, unnecessary re-renders, scroll jank, slow queries |
| `Accessibility` | Missing labels, insufficient contrast, broken focus, small tap targets |
| `UX` | Confusing flows, missing states (loading/empty/error), poor feedback |
| `Responsiveness` | Layout breaks on different screen sizes, safe area violations, keyboard overlap |
| `Type Safety` | Unsafe casts, suppressed errors, missing narrowing |
| `Architecture` | Wrong layer, pattern mismatch, improper colocation |
| `Maintainability` | Duplicated logic, inconsistent patterns, hard to extend |
| `Cleanup` | Dead code, unused imports, stale comments |

---

## Mobile-Specific Audit Checklist

When doing a full or targeted audit, check these mobile concerns:

### Keyboard & Input
- [ ] `KeyboardAvoidingView` uses `behavior="padding"` (not `"height"`)
- [ ] Focused inputs are visible when keyboard is open on both iOS and Android
- [ ] Correct `keyboardType` and `returnKeyType` on all text inputs
- [ ] `ScrollView` with `keyboardShouldPersistTaps="handled"` where needed

### Safe Areas
- [ ] `SafeAreaProvider` wraps the app root
- [ ] Bottom spacing includes `insets.bottom` — never hardcoded only
- [ ] Custom bottom nav, sticky CTAs, and sheets use `insets.bottom`
- [ ] Scroll content has `paddingBottom` that accounts for bottom UI height

### Screen States
- [ ] Loading state (skeleton or spinner)
- [ ] Empty state (helpful message + action)
- [ ] Error state (clear message + retry)
- [ ] Success state (confirmation + next step)

### Performance
- [ ] Long lists use `FlatList` or `SectionList`, not `ScrollView` + map
- [ ] `useMemo` / `useCallback` only where profiling shows benefit
- [ ] No unnecessary re-renders in list items
- [ ] Heavy screens / modals lazy-loaded when appropriate

### Platform Behavior
- [ ] Press feedback: iOS uses opacity, Android uses ripple
- [ ] Android back button / gesture handled correctly
- [ ] No iOS-only behavior silently failing on Android
- [ ] Platform-specific files (`.ios.tsx`, `.android.tsx`) used sparingly

### Accessibility
- [ ] Interactive elements have `accessibilityLabel`
- [ ] Tap targets are ≥ 44×44px
- [ ] Contrast meets WCAG AA (4.5:1 for text)
- [ ] Dialogs and sheets have accessible close controls

---

## Audit Rule

When asked to audit code, UI, performance, accessibility, responsiveness, or architecture:

- Use the repository audit format defined above.
- Prioritize user-facing issues affecting correctness, security, accessibility, performance, caching correctness, and responsive behavior.
- Distinguish clearly between must-fix issues, improvements, and optional refinements.
