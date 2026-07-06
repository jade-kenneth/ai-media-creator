# 16 — UI/UX audit

Produce a static, evidence-grounded **UI/UX** audit: how the interface behaves while
the user waits, fails, taps twice, or navigates. This is not usability testing — do
**not** run the app, click through screens, take screenshots, or measure. Infer only
from scanned components, hooks, forms, and confirmed source patterns. When evidence
is absent, write `Not detected from current files.`

This section sits next to the optimization audit: optimization asks "is it fast?",
UI/UX asks "does it *feel* correct, safe, and clear while the user interacts?".

## Inputs

- `data/manifest.json`, especially the UI/UX `audit_signals`
  (`button_no_pending_disable`, `missing_loading_state`, `missing_error_state`,
  `interactive_no_a11y_label`) plus frontend file paths and sizes.
- Confirmed source reads for every UI/UX claim — open the cited component.
- Existing generated content from the frontend, tech-stack, and full-stack-flow phases.

## The headline pattern: in-flight action safety (double-submit / spam clicks)

The canonical UI/UX bug this audit must catch: **an action button that shows a
loading spinner but is never disabled while the request is in flight, so the user can
press it again and again before navigation/redirect happens.** A "Sign in" button
that flips to a spinner but stays clickable will fire the login mutation 2–5 times on
an impatient tap — duplicate requests, duplicate side effects (double OTP email,
double record), and race conditions on the redirect.

The fix pattern the project should follow:

```
const { mutate, isPending } = useSignIn();
<Button onClick={...} disabled={isPending} aria-busy={isPending}>
  {isPending ? "Signing in…" : "Sign in"}
</Button>
```

The loading indicator and the `disabled` (mobile: the touchable's `disabled` /
ignoring presses) must be driven by the **same** pending flag. A spinner without a
disable is the smell; treat it as the first thing to look for in every submit/auth/pay
/destructive action.

## Required categories

Render one compact scorecard/table plus focused cards for the categories that have
evidence:

| Category | What to inspect | Typical signals |
|---|---|---|
| Interaction safety | submit/auth/pay/delete buttons disabled while pending; double-submit guards; debounce on expensive actions | `button_no_pending_disable`, mutation with no `isPending`/`disabled`/`isSubmitting` in file |
| Loading & pending states | skeletons/spinners for queries; optimistic UI; button busy text; suspense/placeholders | `missing_loading_state`, query hook with no `isLoading`/Skeleton/Spinner/ActivityIndicator |
| Error & empty states | visible error feedback (toast/alert/inline); retry affordance; empty-list messaging vs blank screen | `missing_error_state`, fetch/mutation with no `isError`/`onError`/toast/Alert |
| Feedback & confirmation | success toasts; confirm dialogs for destructive actions; navigation/redirect feedback after submit | destructive `mutate` with no confirm step; submit with no success signal |
| Accessibility | labels on icon-only controls; focus management; keyboard/`Enter` submit; touch-target size; contrast tokens | `interactive_no_a11y_label`, icon button/touchable with no `aria-label`/`accessibilityLabel` |
| Forms & validation | inline field errors; disabled submit until valid; preserved input on error; controlled vs uncontrolled | schema validation present but no inline error rendering; no submit guard |
| Responsiveness & layout | mobile/desktop breakpoints; safe-area handling (mobile); keyboard-avoiding behavior; overflow/scroll | hardcoded widths, missing safe-area, missing keyboard avoidance on input screens |

Lean on the project's own conventions: the admin app is Next.js + shadcn/ui +
TanStack Query (look for `isPending`, `disabled`, `<Skeleton>`, `toast`,
`AlertDialog`); the mobile app is React Native + NativeWind (look for `disabled` on
`Pressable`/`TouchableOpacity`, `ActivityIndicator`, `accessibilityLabel`,
`KeyboardAvoidingView`, safe-area insets). Compare against what the app already does
well elsewhere — a strong loading/disabled pattern in one feature is the "better"
panel for a card about a weak one.

## Finding format

For each UI/UX card, include:

- **Area** — one of `interaction-safety`, `loading-states`, `error-empty-states`,
  `feedback-confirmation`, `accessibility`, `forms-validation`, `responsiveness`.
- **Priority** — use existing `P1 HIGH`, `P2 MEDIUM`, `P3 LOW` labels.
  Double-submit on an auth/payment/record-creating action is **P1** (duplicate side
  effects / data integrity). Missing loading/error states are usually P2. Cosmetic
  or single-screen polish is P3.
- **Evidence** — real `path:line` plus the exact pattern observed (e.g. the mutation
  call and the button JSX with no `disabled`).
- **User impact** — what the *user* experiences: duplicate charges, frozen-looking
  screen, silent failure, unreadable control, lost form input.
- **How to confirm** — the smallest manual check (e.g. "throttle the network in
  devtools, tap Sign in twice, watch the Network tab for duplicate `signIn`
  requests"). Do not run it yourself by default.
- **Suggested fix** — concrete next step scoped to the owning component (e.g. wire
  `disabled={isPending}` + busy label from the same flag).
- **Confidence** — `high`, `medium`, or `low`. Heuristic-only findings start
  `low`/`medium`; confirm in-file before raising.

## What to look for

- Interaction safety:
  - `useMutation`/`mutate`/`mutateAsync` (or an async `onSubmit`/`handleSubmit`)
    where the triggering control has no `disabled`/`isPending`/`isSubmitting` guard.
    This is the sign-in-spam class of bug — confirm by reading the button JSX.
  - Destructive actions (delete/remove/reset) fired directly from an `onClick`/
    `onPress` with no confirm dialog.
  - Expensive search/filter actions with no debounce/throttle.
- Loading & pending states:
  - `useQuery`/`useInfiniteQuery` (or `use*Query`) with no `isLoading`/`isPending`/
    Skeleton/Spinner/`ActivityIndicator`/Suspense anywhere in the component — the
    screen flashes blank or renders `undefined` while fetching.
  - Buttons whose label does not change to a busy state while pending.
- Error & empty states:
  - Fetches/mutations with no `isError`/`onError`/`catch` rendering, no toast/alert —
    failures are silent.
  - Lists rendered with no empty-state message (a blank screen when the array is
    empty reads as "broken").
- Accessibility:
  - Icon-only `<button>`/`Pressable`/`TouchableOpacity` with no `aria-label`/
    `accessibilityLabel`.
  - Forms not submittable by keyboard `Enter`; no visible focus ring; touch targets
    smaller than ~44px on mobile.
- Forms & validation:
  - Schema/`zod`/`class-validator` present but no inline per-field error rendering.
  - Submit not disabled until the form is valid; input cleared on a failed submit.
- Responsiveness (mobile especially):
  - Input screens without `KeyboardAvoidingView` (project rule: `behavior="padding"`).
  - Missing safe-area insets; hardcoded pixel widths that break on small screens.

**Every heuristic must be confirmed by opening the cited file.** A file that
destructures `isPending` but never wires it to the button still has the bug; a file
that has no mutation at all is a false positive — drop it.

## HTML output

Add a `#uiux` section **after** `#optimization` and **before** `#audit`. Use existing
`.card`, `.grid`, `.stat`, `.code-old`, `.code-new`, and `.topic-chat` classes. Do
not add new scripts or styles.

Suggested shape:

```html
<section id="uiux">
  <h2><span class="num">§11</span> UI/UX audit</h2>
  <p class="lede">How the interface behaves while the user waits, fails, taps twice,
  or navigates — loading and disabled states, error and empty states, feedback,
  accessibility, and forms. Evidence-based leads, not usability testing.</p>
  <!-- PLA:UIUX -->
</section>
```

Lead with an interaction-safety card for any `button_no_pending_disable` finding
(the double-submit / spam-click class), with a red **Current** panel (spinner, no
`disabled`) beside a green **Better** panel (`disabled={isPending}` + busy label).
Each UI/UX card ends with its own `.topic-chat` box scoped to that card so the learner
can ask how to reproduce or fix that specific issue.

## Markdown output

Write `uiux-report.md` with auto markers:

```markdown
<!-- pla:auto:start -->
## UI/UX scorecard
...
## Findings
...
## How to verify next
...
<!-- pla:auto:end -->
```

Keep it actionable: list the top UI/UX wins first (double-submit guards usually lead),
then grouped findings by category.

## Integration with `audit-findings.json`

UI/UX findings should also be folded into `data/audit-findings.json.findings` so they
appear in the general audit filters. Use `"category": "ux"` and add the optional
`uiux_area` + `how_to_confirm` fields:

```jsonc
{
  "category": "ux",
  "uiux_area": "interaction-safety | loading-states | error-empty-states | feedback-confirmation | accessibility | forms-validation | responsiveness",
  "how_to_confirm": "smallest manual check, e.g. throttle network and double-tap submit"
}
```

Do not fabricate screenshots, timings, or click traces. If a behavior is not visible
in the scanned source, describe the static signal and the manual check to run later.

## Output of this phase

- UI/UX section HTML for `index.html`.
- `uiux-report.md`.
- UI/UX entries folded into `data/audit-findings.json.findings` (category `ux`).
