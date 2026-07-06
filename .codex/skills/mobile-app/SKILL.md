---
name: mobile-app
description: "Mobile app implementation standards for apps/*-mobile (React Native + Expo + TypeScript + TanStack Query + NativeWind). USE when writing, reviewing, or refactoring any code in apps/*-mobile. TRIGGERS: creating components, screens, hooks, providers, features, data fetching, forms, navigation, performance work, accessibility, analytics, caching, state management, keyboard handling, safe areas, folder structure decisions. EXAMPLES: 'add a feature', 'build a screen', 'create a hook', 'audit this component', 'where should this go?', 'set up a query', 'add a mutation', 'fix keyboard hiding input', 'improve startup time', 'add safe area handling', 'handle Android back button'."
---

# Mobile App Skill

This skill **is** the implementation standard for the `apps/*-mobile` React Native Expo application. The detailed rules live in the `references/` files mapped below — read the ones your task touches before writing or reviewing code.

`apps/*-mobile/CLAUDE.md` and `apps/*-mobile/AGENTS.md` are thin entry points: they tell any agent to invoke this skill and carry only two things of their own — the **Design Skill Layering** authority order and the **Fix & Enhancement Workflow**. They do **not** hold topic content; when a rule is needed, come here. For all design guidance invoke `mobile-native-ui-design`.

> **Portability — `apps/*-mobile`.** This skill targets the workspace under `apps/` whose folder name ends in `-mobile` (the reliable cross-repo convention, alongside `*-admin`/`*-web` and `*-api`). Paths below are written as `apps/*-mobile/…`; substitute the actual folder name for the repo you are in. Do not hardcode a project-specific app name back into this skill — keep it suffix-based so it stays reusable.

---

## How to use this skill

1. **Match existing project patterns first** before introducing anything new — established tokens, components, Expo Router structure, NativeWind conventions, and feature-folder layout are the top authority.
2. **Open the reference(s) your task touches** from the [Quick reference map](#quick-reference-map). Every rule area has a dedicated file under `references/`; that file is the canonical source, not the summaries inlined lower in this doc.
3. **Skim `apps/*-mobile/AGENTS.md`** for the Design Skill Layering authority order and the Fix & Enhancement Workflow — those two live there, not here.
4. **Invoke `mobile-native-ui-design`** for screen-level work, navigation structure, Expo Router patterns, native tabs, Reanimated animations, and design quality — typography, spacing, color, tokens, accessibility states, and motion polish. **Always invoke when the user asks to enhance, improve, or redesign any UI screen or component.**

The mobile app rules, existing app tokens/components, Expo Router structure, NativeWind conventions, accessibility requirements, and platform behavior remain the implementation authority.

---

## Quick reference map

Every rule area has a dedicated file under `references/`. Each file is self-contained and canonical for its topic — the summaries later in this doc are pointers, not substitutes. `mobile-native-ui-design` is a **separate skill** (invoke it); everything else is a path in this skill.

### Start here / working format

| Task                                         | Reference                                                                  |
| -------------------------------------------- | -------------------------------------------------------------------------- |
| Core principles + instruction priority       | `references/core-principles.md`                                            |
| Design Skill Layering + Fix & Enhancement flow | `apps/*-mobile/AGENTS.md` (or `CLAUDE.md` — identical)          |
| Audit output format                          | `references/audit-format.md`                                              |
| Q&A / project discussion format              | `references/project-discussion.md`                                        |

### Foundations — organization & tooling

| Task                                         | Reference                                                                  |
| -------------------------------------------- | -------------------------------------------------------------------------- |
| Folder structure and colocation              | `references/folder-structure.md`                                          |
| Common anti-patterns and what to do instead  | `references/common-anti-patterns.md`                                      |
| Dependency management + native-dep decisions | `references/dependency-management.md`                                     |
| ESLint, Prettier, formatting baseline        | `references/eslint-prettier.md`                                           |

### React & TypeScript

| Task                                           | Reference                                                                |
| ---------------------------------------------- | ------------------------------------------------------------------------ |
| React architecture, composition, HOCs, providers | `references/react-patterns.md`                                         |
| Mutation safety — disable in-flight actions    | `references/react-patterns.md` § Mutation Safety                          |
| `useCallback` / `useMemo` decisions, profiling | `references/react-hooks.md`                                              |
| TypeScript patterns, guards, generics, brands  | `references/typescript-patterns.md`                                      |

### State management

| Task                                           | Reference                                                                |
| ---------------------------------------------- | ------------------------------------------------------------------------ |
| State boundaries + decision guide              | `references/state-management.md`                                         |
| `useReducer` for complex local state           | `references/reducer.md`                                                  |
| `useReducer` + Context, split context, scaling | `references/reducer-context.md`                                          |

### Server state & data

| Task                                           | Reference                                                                |
| ---------------------------------------------- | ------------------------------------------------------------------------ |
| Server state, caching, invalidation, mutations | `references/caching.md`                                                  |
| Optimistic UI, rollback                        | `references/caching.md` § Optimistic UI Rules                            |
| GraphQL client, defineQuery, defineMutation    | `references/graphql-patterns.md`                                         |
| Offline detection, NetworkErrorBanner          | `references/network-connectivity.md`                                     |
| date-fns, centralized formatters, isValid      | `references/date-handling.md`                                            |

### Forms & input

| Task                                           | Reference                                                                |
| ---------------------------------------------- | ------------------------------------------------------------------------ |
| Forms (useForm + zod + useFieldArray)          | `references/forms.md`                                                    |
| Native date picker (DateTimePicker + forms)    | `references/native-date-picker.md`                                       |
| Keyboard avoidance + safe areas                | `references/layout-and-safe-areas.md`                                    |

### UI, UX & platform

| Task                                           | Reference                                                                |
| ---------------------------------------------- | ------------------------------------------------------------------------ |
| FlatList, search, inline flows, screen states, analytics | `references/ux-patterns.md`                                    |
| Responsive layout + theming (light + dark)     | `references/responsive-and-theming.md`                                   |
| Platform behavior + Expo-first + split files   | `references/platform-patterns.md`                                        |
| Write-once-feel-native design standard (deep dive) | `references/platform-design-guide.md` — see note below              |
| Rich text: plain text extraction, Prose render | `references/rich-text.md`                                                |
| Toast / showToast / ToastHost                  | `references/toast-feedback.md`                                           |
| ErrorBoundary, screen-level error states       | `references/error-handling.md`                                           |
| Accessibility rules + audit checklist          | `references/accessibility.md`                                            |
| Icons + dark mode color tokens                 | `mobile-native-ui-design` › `references/icons.md`                        |

### Auth, security & notifications

| Task                                           | Reference                                                                |
| ---------------------------------------------- | ------------------------------------------------------------------------ |
| Auth store, useAuth, AuthProvider, route guard | `references/auth-patterns.md`                                            |
| Security checklist                             | `references/security.md`                                                 |
| Push notifications (expo-notifications)        | `references/push-notifications.md`                                       |

### Performance

| Task                                           | Reference                                                                |
| ---------------------------------------------- | ------------------------------------------------------------------------ |
| Performance priority order + reporting         | `references/performance.md`                                              |

### Assets & environment setup

| Task                                           | Reference                                                                |
| ---------------------------------------------- | ------------------------------------------------------------------------ |
| Branding and push notification assets          | `references/branding-and-push-notification-assets.md`                    |
| Android ADB setup                              | `references/android-adb-setup.md`                                        |
| Android localhost fix                          | `references/android-localhost-fix.md`                                    |

> **`platform-design-guide.md` note:** this is the comprehensive "write once, feel native" design standard. Its navigation snippets use React Navigation (`createNativeStackNavigator`/`createBottomTabNavigator`) — the app uses **Expo Router**, so treat those code samples as illustrative of intent, not literal API. For navigation structure defer to `mobile-native-ui-design` and `references/platform-patterns.md`.

---

## Non-negotiables (apply every time)

Each rule lives in a dedicated reference — consult it before implementing:

| Rule area                                                         | Reference                                                                                               |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Keyboard avoidance + safe areas                                   | `references/layout-and-safe-areas.md`                                                                   |
| Server state + cache invalidation                                 | `references/caching.md`                                                                                 |
| Mutation controls disabled while pending (no double-fire)         | `references/react-patterns.md` § Mutation Safety                                                       |
| Forms (useForm + zod + useFieldArray)                             | `references/forms.md`                                                                                   |
| TypeScript (casts, assertions, boundaries)                        | `references/typescript-patterns.md`                                                                     |
| Responsive layout + light/dark theming                            | `references/responsive-and-theming.md`                                                                  |
| Platform behavior + Expo-first + platform files                   | `references/platform-patterns.md`                                                                       |
| FlatList, search debounce, inline flows, screen states, analytics | `references/ux-patterns.md`                                                                             |
| Accessibility (labels, 44×44 targets, WCAG AA, no color-only)     | `references/accessibility.md`                                                                           |
| Every async flow has loading + empty + error states               | `references/error-handling.md` · `references/ux-patterns.md` § Screen States                            |
| State signal clarity and redundancy                               | `references/common-anti-patterns.md`                                                                    |
| Icons (MaterialIcons only) + dark mode color tokens               | `mobile-native-ui-design` › `references/icons.md` (NON-NEGOTIABLE: hardcoded icon colors are a blocker) |

---

## Pattern selection guide

_At-a-glance table. Canonical detail: `references/core-principles.md` (pattern selection) and `references/state-management.md` (state boundaries + reducer thresholds)._

| Situation                                 | Pattern                                 |
| ----------------------------------------- | --------------------------------------- |
| Reusable component logic                  | custom hook                             |
| App-wide service or dependency            | provider                                |
| Screen wrapper, auth gate, layout concern | HOC                                     |
| Flexible shared UI API                    | compound component or headless pattern  |
| Complex local state transitions           | `useReducer`                            |
| Shared structured state across components | `useReducer` + Context                  |
| High-frequency shared global state        | Zustand or external store               |
| Server state fetching and mutations       | TanStack Query / SWR / Apollo           |
| Simple create/edit in an existing flow    | modal, bottom sheet, or inline editor   |
| Long lists or collections                 | `FlatList` / `SectionList`              |
| Platform-specific behavior                | `Platform.OS` guard in shared file      |
| Genuinely divergent platform UX           | `.ios.tsx` / `.android.tsx` (sparingly) |

---

## Implementation workflow

When generating or modifying code, always follow this order:

1. Match existing project patterns first.
2. Choose the simplest implementation that fits.
3. Follow `references/folder-structure.md` for placement; keep screen entry files thin.
4. Colocate code by feature unless clearly shared.
5. Invoke `mobile-native-ui-design` before writing any UI.
6. Use hooks, providers, and server-state tools consistently.
7. Check project shared components before building custom ones.
8. Add loading, empty, and error states for every async flow (`references/error-handling.md`, `references/ux-patterns.md` § Screen States).
9. Verify keyboard avoidance, safe areas, and scroll behavior on both platforms.
10. Protect perceived performance: startup first, then input responsiveness, scroll, layout stability (`references/performance.md`).
11. For performance changes, name the metric and explain why it improves.
12. For security-sensitive work, verify against `references/security.md`.
13. For user-facing UI, verify responsiveness, accessibility (`references/accessibility.md`), and both platform behaviors.
14. For server mutations, prefer targeted cache updates or invalidation over app reload.

---

## Common anti-patterns to avoid

_Canonical list with the "what to do instead" for each: `references/common-anti-patterns.md` and `references/core-principles.md`._

Do not:

- Over-abstract early
- Repeat fetch logic across components
- Dump feature logic into global utilities
- Use HOCs for logic that should be a hook
- Create unnecessary re-renders
- Force full app reload after mutations when targeted cache update suffices
- Invalidate the entire cache when only specific queries are affected
- Give stable, read-only reference lists a `staleTime` without also setting `refetchOnMount: true` when the global default is `refetchOnMount: 'always'` — they still refetch and flicker on every mount
- Silence type errors with broad `as` or `!`
- Scatter raw analytics calls across the codebase
- Treat responsive or safe area issues as optional polish
- Stack multiple UI signals that all communicate the same state unless each one adds different information
- Drill props through 3+ intermediate components
- Create effect render loops (read + write same state)
- Build custom components before checking shared primitives
- Add native dependencies when an Expo-compatible option already fits
- Copy iOS UI exactly into Android or Material UI exactly into iOS
- Create separate screens per platform unless truly required
- Use hardcoded hex colors on icon `color` props — always use `useThemeColors()` tokens
- Import Ionicons, FontAwesome, Feather, or any icon library other than MaterialIcons
- Use `expo-symbols` / SF Symbols outside an iOS-only `.ios.tsx` file
