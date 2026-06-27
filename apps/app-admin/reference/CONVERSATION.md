# Project Conversation Log

A running record of structured project discussions, technical decisions, and Q&A documentation.

Each entry follows the format defined in [`AI_PROJECT_CONVERSATION.md`](./AI_PROJECT_CONVERSATION.md).

Entries are appended chronologically. Each entry includes a date, the question, and the full structured response.

---

<!-- Append new entries below this line -->

## Entry — 2026-03-20

## Tailored Question

**The Question**  
Why does `apps/frontendvault` use modals for some create/edit flows and page routes for others?

**The Answer**  
In `frontendvault`, the current pattern is: primary content entities use dedicated `new` and `edit` routes, while short contextual actions use dialogs. That is why projects, issues, notes, packages, boilerplates, components, concepts, accessibility, and performance content use page routes, while roadmap entries, snippet saving, related-content linking, search, and delete confirmation stay in modals.

This is consistent with the repository rule in principle, even though the repository default prefers modals first. The exception clause matters here: use a dedicated page when the form is large, content-heavy, needs deep-linking, or behaves more like a full editor than a quick inline task. In `frontendvault`, the major create/edit forms match that exception. The roadmap flow is the opposite: it is lightweight and tied directly to the board context, so a modal is the better fit.

## Context

- **Relevant project context:** The projects list links to `/projects/new` and the project detail page links to `/projects/[slug]/edit`, then both pages render the same `ProjectForm`. See [projects list](/Users/jadekennethdarunday/personal/saas/apps/frontendvault/features/projects/ProjectList.tsx#L39), [project detail](/Users/jadekennethdarunday/personal/saas/apps/frontendvault/features/projects/ProjectDetail.tsx#L149), [new route](/Users/jadekennethdarunday/personal/saas/apps/frontendvault/app/(app)/projects/new/page.tsx#L4), and [edit route](/Users/jadekennethdarunday/personal/saas/apps/frontendvault/app/(app)/projects/[slug]/edit/page.tsx#L24).
- **Relevant project context:** `ProjectForm` is not a tiny inline form. It uses `react-hook-form`, `useFieldArray`, mutation handling, cache invalidation, AI tailoring, chip-entry fields, breadcrumbs, and post-save navigation. See [ProjectForm setup](/Users/jadekennethdarunday/personal/saas/apps/frontendvault/features/projects/ProjectForm.tsx#L65), [form initialization](/Users/jadekennethdarunday/personal/saas/apps/frontendvault/features/projects/ProjectForm.tsx#L92), [field arrays](/Users/jadekennethdarunday/personal/saas/apps/frontendvault/features/projects/ProjectForm.tsx#L102), [submit flow](/Users/jadekennethdarunday/personal/saas/apps/frontendvault/features/projects/ProjectForm.tsx#L181), and [AI tailoring guard](/Users/jadekennethdarunday/personal/saas/apps/frontendvault/features/projects/ProjectForm.tsx#L211).
- **Relevant project context:** The roadmap flow is the clearest modal-based create/edit example. The board opens the form in-place, and the form itself is mounted inside a dialog. See [roadmap create trigger](/Users/jadekennethdarunday/personal/saas/apps/frontendvault/features/roadmap/RoadmapBoard.tsx#L112), [roadmap dialog mount](/Users/jadekennethdarunday/personal/saas/apps/frontendvault/features/roadmap/RoadmapBoard.tsx#L317), and [RoadmapEntryForm dialog](/Users/jadekennethdarunday/personal/saas/apps/frontendvault/features/roadmap/RoadmapEntryForm.tsx#L144).
- **Relevant project context:** Other dialog flows in the app are also short and contextual, such as saving a playground snippet and linking related content. See [SaveSnippetDialog](/Users/jadekennethdarunday/personal/saas/apps/frontendvault/features/playground/snippets/SaveSnippetDialog.tsx#L216) and [LinkFromHereDialog](/Users/jadekennethdarunday/personal/saas/apps/frontendvault/features/shared/LinkFromHereDialog.tsx#L67).
- **Relevant project context:** The repo guidance says modals are preferred by default, but dedicated pages are allowed when form complexity or deep-linking justifies them. See [ENHANCEMENTS default rule](/Users/jadekennethdarunday/personal/saas/DOCUMENTATION/ENHANCEMENTS.md#L101), [exception: multi-step/large flows](/Users/jadekennethdarunday/personal/saas/DOCUMENTATION/ENHANCEMENTS.md#L120), [exception: heavy editor/upload flows](/Users/jadekennethdarunday/personal/saas/DOCUMENTATION/ENHANCEMENTS.md#L121), and [exception: deep URL sharing](/Users/jadekennethdarunday/personal/saas/DOCUMENTATION/ENHANCEMENTS.md#L122).
- **Assumptions made:** Your question is asking for the reasoning behind the current UI pattern selection, not asking for a refactor right now.
- **Scope of this answer:** This explains the current decision boundary in `frontendvault` and what should stay modal vs route going forward.

## Tools Used

- **Tool:** Next.js App Router
- **Why used:** It gives major create/edit flows stable URLs, route-level loading/error handling, and direct navigation into editing.
- **Caveats:** It adds navigation overhead and can break list/board context.
- **Pros (current setup):** Strong fit for long-form editing surfaces like projects, issues, and notes.
- **Alternatives:** Dialogs or sheets.
- **Why this approach is better:** Large knowledge-entry forms in `frontendvault` behave more like document editors than quick inline actions.

- **Tool:** Radix-based `Dialog`
- **Why used:** It keeps fast, local interactions on the same screen.
- **Caveats:** Long forms in dialogs become cramped, harder to scan, and weaker on mobile.
- **Pros (current setup):** Strong fit for roadmap entries, snippet saving, search, and quick linking.
- **Alternatives:** Dedicated pages.
- **Why this approach is better:** These tasks are short, contextual, and benefit more from preserving screen context than from owning a route.

## Architecture

- **Architecture used:** Feature-colocated Next.js App Router application with a mixed interaction model.
- **What it is called:** A modular monolith with feature-based UI boundaries.
- **Why this architecture is used:** Each domain owns its list, detail, form, types, queries, and actions, while the mounting surface for the form changes based on workflow complexity.
- **Boundaries and responsibilities:** Routes own navigation and deep-linking; feature forms own validation and mutation logic; dialogs are used where the action is subordinate to an existing page context.

## Performance / Core Web Vitals

- **LCP impact:** Keeping heavy editors off list/detail initial render helps avoid loading large form UI when the user is only browsing content.
- **INP impact:** Small dialogs improve perceived speed for quick actions because they avoid full navigation. Large dialogs would likely hurt interaction quality, especially on mobile, due to dense layouts and long internal scrolling.
- **CLS impact:** Dedicated pages are more stable for long editing surfaces. Dialogs need explicit height, overflow, and focus management to stay stable.
- **Other performance considerations:** Route-based forms also simplify back-button behavior, loading boundaries, and recovery from errors. Dialogs are best when the UI payload is small and the user should stay anchored to the current screen.

## Process Clarity

- **Problem being solved:** Deciding when create/edit should open in a modal and when it should live on its own page.

- **Why this matters:** If the rule is unclear, the app becomes inconsistent and the UX quality drops. Too many route jumps slows simple tasks. Too many large modals makes editing cramped and harder to use.

- **Step-by-step explanation:**
  1. `frontendvault` treats major content types as primary resources, so their create/edit flows get dedicated routes.
  2. Those forms are long and editor-like, so deep-linking, breadcrumbs, full-width layout, and clear navigation matter more than preserving the previous list page.
  3. Short, board-level, or utility actions stay in dialogs because the user benefits from staying in context.

- **Expected outcome:** Large knowledge-entry workflows remain readable and navigable; small supporting workflows stay fast and local.

- **Things to watch out for:** Do not move long markdown-heavy or AI-assisted forms into dialogs just for consistency. Do not create dedicated routes for tiny actions that are only meaningful from within the current page.

- **Recommended implementation direction:** Keep the current split. Use route pages for full resource editing. Use dialogs only for short contextual forms or supporting actions.

## Tradeoffs

- **What we gain:** Better usability for complex forms, direct edit URLs, clearer navigation, and less cramped editing surfaces. We also keep quick actions fast where dialogs are appropriate.
- **What we lose:** The interaction model is not purely uniform across all create/edit flows.
- **When not to use this approach:** If a resource form becomes genuinely small and contextual, it should move toward a dialog. If a dialog grows into a long multi-section editor, it should become a route.

## Project Fit

- **Why this fits the current project:** `frontendvault` is a content-heavy internal knowledge product. Many entries are closer to documents than to simple CRUD rows.
- **Maintainability impact:** Reusing one form component across `new` and `edit` routes is straightforward and keeps route wiring thin.
- **Developer experience impact:** Route-based forms are easier to debug, link to, and test in isolation.
- **User experience impact:** Users get full editing space for complex entries and quick modals only where speed matters more than navigation.

## Alternatives Considered

### Option A

- **What it is:** Use dialogs for all create/edit flows.
- **Why not chosen:** It conflicts with the actual size and complexity of most `frontendvault` forms and would create cramped, scroll-heavy overlays.

### Option B

- **What it is:** Use dedicated pages for every create/edit action, including roadmap and snippet flows.
- **Why not chosen:** It adds unnecessary route transitions for short tasks that are better handled in the current context.

## Decision Summary

- **Recommended choice:** Keep the current rule: route pages for primary content entities, dialogs for short contextual actions.
- **Confidence level:** High
- **Why:** That matches both the current code and the repository’s exception-based guidance.
- **Next step:** If you want this to be explicit instead of implied, add a small `frontendvault` local convention note that says: "Use dialogs for short contextual forms; use routes for full editor-style resource forms."

## Entry — 2026-03-20

## Tailored Question

**The Question**  
Why does `apps/frontendvault/features/playground/snippets/SnippetDetail.tsx` use `useTransition`?

**The Answer**  
`useTransition` is used here to model the delete and duplicate flows as pending UI work inside a React 19 client component. In this feature, the main benefit is not expensive rendering. The practical benefit is that it exposes `isDeleting` and `isDuplicating`, which are then used to disable the relevant controls and show progress text while the server action and follow-up navigation are running. That prevents duplicate submissions and keeps the interaction flow clear. A local `useState` loading flag would also work, but `useTransition` fits the project’s React 19 / Next App Router pattern and is already used consistently in the snippet card list as well.

## Context

- **Relevant project context:** `SnippetDetail` is a client component that wraps `deleteSnippet` and `duplicateSnippet` in separate transitions, then navigates with `router.push`. See [SnippetDetail transition setup](/Users/jadekennethdarunday/personal/saas/apps/frontendvault/features/playground/snippets/SnippetDetail.tsx#L76), [delete handler](/Users/jadekennethdarunday/personal/saas/apps/frontendvault/features/playground/snippets/SnippetDetail.tsx#L89), and [duplicate handler](/Users/jadekennethdarunday/personal/saas/apps/frontendvault/features/playground/snippets/SnippetDetail.tsx#L105).
- **Relevant project context:** The pending flags are wired directly into button disabling and loading labels. See [duplicate button](/Users/jadekennethdarunday/personal/saas/apps/frontendvault/features/playground/snippets/SnippetDetail.tsx#L182) and [delete dialog actions](/Users/jadekennethdarunday/personal/saas/apps/frontendvault/features/playground/snippets/SnippetDetail.tsx#L212).
- **Relevant project context:** The same pattern is used in the snippet list card, which suggests this is an intentional feature-level convention rather than a one-off decision. See [SnippetCard transition setup](/Users/jadekennethdarunday/personal/saas/apps/frontendvault/features/playground/snippets/SnippetCard.tsx#L47).
- **Relevant project context:** The app is on React `19.2.3` and Next `16.1.6`, so using transition-based pending UI for client-side mutation flows is aligned with the current stack. See [frontendvault package.json](/Users/jadekennethdarunday/personal/saas/apps/frontendvault/package.json#L21).
- **Assumptions made:** The question is about why this tool was chosen in the current implementation, not a request to refactor the loading pattern.
- **Scope of this answer:** This explains the current rationale for `SnippetDetail` and nearby snippet UI. It does not claim every async button in the app must use `useTransition`.

## Tools Used

- **Tool:** React `useTransition`
- **Why used:** It provides a pending signal for non-urgent UI work tied to the duplicate and delete flows.
- **Caveats:** It is not strictly required here. A local `useState` boolean would also solve loading and disable states.
- **Pros (current setup):** It keeps the mutation flow readable, matches the React 19 stack, and is already used consistently in the same feature.
- **Alternatives:** `useState` loading flags, mutation-library pending state, or no explicit pending state.
- **Why this approach is better:** For this feature, it is a lightweight built-in option that avoids extra abstraction while still giving clear pending UX.

## Architecture

- **Architecture used:** Feature-colocated client component over server actions.
- **What it is called:** A modular monolith with feature-based boundaries in a Next.js App Router app.
- **Why this architecture is used:** The feature owns its client UI, its server actions, and its navigation flow in one place.
- **Boundaries and responsibilities:** `SnippetDetail` owns the interaction state and navigation; `actions.ts` owns persistence and revalidation; the route loads the initial server data.

## Performance / Core Web Vitals

- **LCP impact:** Effectively neutral. This does not change initial content loading.
- **INP impact:** Slightly positive. The user gets immediate disabled states and progress labels, which reduces accidental repeated clicks during mutation flows.
- **CLS impact:** Neutral. The UI text changes are small and controlled inside existing button/dialog layout.
- **Other performance considerations:** The main value is perceived responsiveness and interaction safety, not render throughput optimization.

## Process Clarity

- **Problem being solved:**  
  Provide safe, explicit pending UI for destructive and duplication actions.

- **Why this matters:**  
  Without a pending state, users can trigger duplicate submissions or wonder whether the action actually started.

- **Step-by-step explanation:**
  1. Start a transition when the user clicks delete or duplicate.
  2. Run the server action and wait for the result.
  3. Use the transition pending state to disable controls, show progress text, and then navigate or toast based on the outcome.

- **Expected outcome:**  
  A clearer, safer mutation flow with less chance of repeated clicks or ambiguous feedback.

- **Things to watch out for:**  
  Do not use `useTransition` as a default for every async button. If the only need is a local spinner, `useState` can be simpler. Use transition when the UI work is better treated as non-urgent and the built-in pending model is useful.

- **Recommended implementation direction:**  
  Keep this pattern for snippet delete/duplicate flows unless the feature later moves to a dedicated mutation library that provides a stronger shared pending state model.

## Tradeoffs

- **What we gain:** Built-in pending state, consistent UX, duplicate-click protection, and alignment with existing snippet feature patterns.
- **What we lose:** Slightly more React-specific mental model compared with a plain boolean loading state.
- **When not to use this approach:** When the action is trivial and a simple local loading boolean is clearer, or when a shared mutation tool already owns the pending state.

## Project Fit

- **Why this fits the current project:** `frontendvault` already uses React 19 and follows feature-local patterns. This keeps the implementation simple and consistent inside the snippets feature.
- **Maintainability impact:** Moderate positive impact because the same pattern appears in both detail and card views.
- **Developer experience impact:** Good fit for the current stack because it keeps async action UI local and explicit.
- **User experience impact:** Users get immediate, clear feedback during duplicate and delete actions.

## Alternatives Considered

### Option A

- **What it is:** Use `useState` booleans like `isDeleting` and `isDuplicating`.
- **Why not chosen:** It would work, but `useTransition` gives the same practical outcome here with a React-native pending model already used elsewhere in the feature.

### Option B

- **What it is:** Rely only on toast feedback after the action completes, without a pending flag.
- **Why not chosen:** It leaves a gap where users can click multiple times and have no immediate visual confirmation that the action started.

## Decision Summary

- **Recommended choice:** Keep `useTransition` for the snippet delete and duplicate flows.
- **Confidence level:** High
- **Why:** It matches the current stack, the current feature convention, and the actual UX need for pending-state feedback.
- **Next step:** Apply the same reasoning case-by-case in other features instead of treating `useTransition` as mandatory for every async action.

## Entry — 2026-03-20

## Tailored Question

**The Question**  
Why not use mutation loading state or query loading/fetching state instead of `useTransition`?

**The Answer**  
In `frontendvault`, request-driven loading UI should usually come from TanStack Query state, not `useTransition`. For the boilerplate detail screen, duplicate and delete are write operations, so `mutation.isPending` is the correct source for button disabled/loading UI. Query state such as `isLoading` or `isFetching` is only correct for read/refetch lifecycle. `useTransition` is still appropriate for non-urgent UI updates like URL/search-param transitions, which is how it is used in the list screen. This is also explicitly documented in the Frontend Vault regression notes.

## Context

- **Relevant project context:** The current detail screen uses `useTransition` for duplicate and delete in [BoilerplateDetail.tsx](/Users/jadekennethdarunday/personal/saas/apps/frontendvault/features/boilerplates/BoilerplateDetail.tsx#L74) and wraps the async server-action calls inside those transitions in [BoilerplateDetail.tsx](/Users/jadekennethdarunday/personal/saas/apps/frontendvault/features/boilerplates/BoilerplateDetail.tsx#L88).
- **Relevant project context:** The same feature already has TanStack Query mutation hooks for these actions in [boilerplate-queries.ts](/Users/jadekennethdarunday/personal/saas/apps/frontendvault/features/boilerplates/boilerplate-queries.ts#L152) and [boilerplate-queries.ts](/Users/jadekennethdarunday/personal/saas/apps/frontendvault/features/boilerplates/boilerplate-queries.ts#L176).
- **Relevant project context:** The project has a feature-specific rule saying not to use `useTransition` as async request loading state in [REGRESSION.md](/Users/jadekennethdarunday/personal/saas/apps/frontendvault/REGRESSION.md#L5).
- **Relevant project context:** The list page uses `useTransition` for `router.replace` query-param updates, which is the correct kind of usage, in [BoilerplateList.tsx](/Users/jadekennethdarunday/personal/saas/apps/frontendvault/features/boilerplates/BoilerplateList.tsx#L63) and [BoilerplateList.tsx](/Users/jadekennethdarunday/personal/saas/apps/frontendvault/features/boilerplates/BoilerplateList.tsx#L95).
- **Assumptions made:** The question is asking for the correct pattern in this codebase, not asking me to refactor the file right now.
- **Scope of this answer:** This covers how to choose between mutation state, query state, and `useTransition` for this Frontend Vault flow.

## Tools Used

- **Tool:** TanStack Query `useMutation`
- **Why used:** It owns the lifecycle of duplicate/delete requests and exposes `isPending` for the full mutation duration.
- **Caveats:** It does not replace UI-priority tools. If you want a low-priority navigation after success, you can still pair it with `useTransition`.
- **Pros (current setup):** The app already uses TanStack Query as its server-state layer, and mutation hooks already exist for this feature.
- **Alternatives:** local `useState` with `try/finally`, or `useTransition`.
- **Why this approach is better:** It is the only option here that correctly models the actual write request lifecycle and matches the repository’s server-state rules.

- **Tool:** TanStack Query `useQuery`
- **Why used:** It owns boilerplate detail and list reads.
- **Caveats:** `isLoading` and `isFetching` describe reads and refetches, not delete/duplicate writes.
- **Pros (current setup):** It is already used in the detail and list screens.
- **Alternatives:** manual fetch state.
- **Why this approach is better:** It separates read state from write state cleanly.

- **Tool:** React `useTransition`
- **Why used:** It marks non-urgent UI updates so urgent interactions stay responsive.
- **Caveats:** It is not a reliable request-lifecycle source for async network work in this app, which the regression note explicitly calls out.
- **Pros (current setup):** Good fit for URL/search-param updates like the list filter flow.
- **Alternatives:** immediate state updates without transitions.
- **Why this approach is better:** It is better only when the problem is render/navigation priority, not mutation loading.

## Architecture

- **Architecture used:** Feature-colocated TanStack Query client state over Next.js App Router.
- **What it is called:** A feature-based modular monolith with separate read and write server-state responsibilities.
- **Why this architecture is used:** It keeps server reads, mutations, cache updates, and view logic close to the feature that owns them.
- **Boundaries and responsibilities:** Query hooks own server-state lifecycle; the component owns presentation and local interaction state; `useTransition` should only own render-priority concerns.

## Performance / Core Web Vitals

- **LCP impact:** Neutral. This choice does not affect first paint of the page.
- **INP impact:** Using `mutation.isPending` improves correctness of disabled/loading UI during duplicate/delete and reduces repeat clicks. `useTransition` helps INP more in list-filter navigation, where it prevents non-urgent URL updates from competing with typing.
- **CLS impact:** Neutral as long as loading labels and button widths stay stable.
- **Other performance considerations:** The main benefit here is correctness and predictable UX, not raw speed. Misusing `useTransition` can make the UI look finished before the request actually finishes, which is a behavior bug rather than a performance win.

## Process Clarity

- **Problem being solved:**  
Choose the correct source of truth for loading UI in the boilerplate detail flow.

- **Why this matters:**  
If the wrong state source is used, buttons can enable too early, loading text can end too early, and request UX becomes unreliable.

- **Step-by-step explanation:**
  1. For initial data load or background refresh, use query state such as `boilerplateQuery.isLoading` or `boilerplateQuery.isFetching`.
  2. For duplicate/delete submits, use mutation state such as `duplicateMutation.isPending` or `deleteMutation.isPending`.
  3. If post-success navigation or a large local rerender should be treated as non-urgent, wrap only that UI update in `startTransition`.

- **Expected outcome:**  
Loading indicators reflect the real request lifecycle, while `useTransition` remains reserved for UI-priority work where it is actually useful.

- **Things to watch out for:**  
Do not drive a delete button from `query.isFetching`, because a background refetch is unrelated to the delete request. Do not drive request loading from `useTransition`, because this repository already documents that it can desync from async request duration.

- **Recommended implementation direction:**  
For `BoilerplateDetail`, move duplicate/delete to the existing mutation hooks or an explicit `try/finally` async-state helper. Keep `useTransition` only if you want to make the final `router.push` low-priority after the mutation succeeds.

## Tradeoffs

- **What we gain:** Correct request-state modeling, clearer separation of concerns, and consistency with TanStack Query and the repo regression rule.
- **What we lose:** Slightly more setup if the current component uses direct server-action calls and must be wired through mutation hooks.
- **When not to use this approach:** If a flow has no shared mutation abstraction and the simplest safe solution is a local `useState` plus `try/finally`, that is still valid. The key rule is that the loading state must track the request, not the transition.

## Project Fit

- **Why this fits the current project:** `frontendvault` already standardizes on TanStack Query for server state and already ships a regression note specifically warning against request-loading misuse of `useTransition`.
- **Maintainability impact:** Better separation between read state, write state, and render-priority state makes these features easier to audit and extend.
- **Developer experience impact:** Future contributors can tell immediately whether a pending flag represents fetching, mutating, or transition work.
- **User experience impact:** Buttons and dialogs stay disabled for the real duration of the request, which reduces duplicate submissions and confusing feedback.

## Alternatives Considered

### Option A

- **What it is:** Keep using `useTransition` around the entire async mutation flow.
- **Why not chosen:** This repository already documents that pattern as a regression source for request-driven loading UI.

### Option B

- **What it is:** Use query `isLoading` or `isFetching` for duplicate/delete button state.
- **Why not chosen:** Those flags describe read/refetch work, not the write action the button is submitting.

### Option C

- **What it is:** Use local `useState` with `try/finally` instead of a mutation hook.
- **Why not chosen:** It is a valid fallback, but the feature already has TanStack Query mutation hooks, so duplicating lifecycle state locally is weaker than using the existing server-state tool.

## Code Example

- **Why this example is included:** It shows the intended split: mutation state for the request, transition state only for optional post-success UI work.

```ts
const duplicateMutation = useDuplicateBoilerplateMutation();
const [isNavigating, startTransition] = useTransition();

async function handleDuplicate() {
  const result = await duplicateMutation.mutateAsync({ id: boilerplate.id });

  if (result.status === 'error') {
    toast.error(result.message);
    return;
  }

  toast.success(result.message);
  setBoilerplateDetailCache(queryClient, result.item, result.previousSlug);

  startTransition(() => {
    router.push(`/boilerplates/${result.slug}`);
  });
}

<Button disabled={duplicateMutation.isPending || isNavigating}>
  {duplicateMutation.isPending ? 'Duplicating...' : 'Duplicate'}
</Button>
```

What this demonstrates: the mutation owns the request lifecycle, and the transition only owns the non-urgent navigation step.

Why this matters in the current project: it matches [REGRESSION.md](/Users/jadekennethdarunday/personal/saas/apps/frontendvault/REGRESSION.md#L5), preserves TanStack Query as the server-state source of truth, and keeps `useTransition` in the role it already has on the list page.

## Decision Summary

- **Recommended choice:** Use `mutation.isPending` for duplicate/delete loading UI, use query loading/fetching only for reads, and use `useTransition` only for non-urgent UI/navigation work.
- **Confidence level:** High
- **Why:** That matches the current project’s server-state architecture and its explicit regression guidance.
- **Next step:** Refactor `BoilerplateDetail` and similar detail/card mutation flows to mutation-owned pending state, while keeping `useTransition` only where it is serving render-priority concerns.
