---
name: mobile-app
description: "Mobile app implementation standards for apps/brgy-system-mobile (React Native + Expo + TypeScript + TanStack Query + NativeWind). USE when writing, reviewing, or refactoring any code in apps/brgy-system-mobile. TRIGGERS: creating components, screens, hooks, providers, features, data fetching, forms, navigation, performance work, accessibility, analytics, caching, state management, keyboard handling, safe areas, folder structure decisions. EXAMPLES: 'add a feature', 'build a screen', 'create a hook', 'audit this component', 'where should this go?', 'set up a query', 'add a mutation', 'fix keyboard hiding input', 'improve startup time', 'add safe area handling', 'handle Android back button'."
---

# Mobile App Skill

This skill enforces the implementation standard for the `apps/brgy-system-mobile` React Native Expo application. Read it fully before writing or reviewing any code in this app.

The primary standards live in `apps/brgy-system-mobile/CLAUDE.md` and `apps/brgy-system-mobile/AGENTS.md`. For all design guidance invoke `mobile-native-ui-design`.

---

## How to use this skill

1. **Read `apps/brgy-system-mobile/CLAUDE.md`** — the primary implementation standard (auto-loaded by Claude Code).
2. **Read `apps/brgy-system-mobile/AGENTS.md`** — agent behavior rules and instruction priority.
3. **Match existing project patterns first** before introducing anything new.
4. **Invoke `mobile-native-ui-design`** for screen-level work, navigation structure, Expo Router patterns, native tabs, Reanimated animations, and design quality — typography, spacing, color, tokens, accessibility states, and motion polish. **Always invoke when the user asks to enhance, improve, or redesign any UI screen or component.**

The mobile app rules, existing app tokens/components, Expo Router structure, NativeWind conventions, accessibility requirements, and platform behavior remain the implementation authority.

---

## Quick reference map

| Task                                           | Reference                                                                  |
| ---------------------------------------------- | -------------------------------------------------------------------------- |
| Onboarding / starting point                    | `apps/brgy-system-mobile/CLAUDE.md`                                        |
| Agent behavior and instruction priority        | `apps/brgy-system-mobile/AGENTS.md`                                        |
| Keyboard avoidance + safe areas                | `references/layout-and-safe-areas.md`                                      |
| Forms (useForm + zod + useFieldArray)          | `references/forms.md`                                                      |
| Responsive layout + theming                    | `references/responsive-and-theming.md`                                     |
| Platform behavior + Expo-first + split files   | `references/platform-patterns.md`                                          |
| FlatList, search, inline flows, screen states  | `references/ux-patterns.md`                                                |
| Android ADB setup                              | `references/android-adb-setup.md`                                          |
| Android localhost fix                          | `references/android-localhost-fix.md`                                      |
| Branding and push notification assets          | `references/branding-and-push-notification-assets.md`                      |
| TypeScript patterns, guards, generics          | `apps/brgy-system-mobile/AGENTS.md` § TypeScript Standards                 |
| React patterns, hooks, providers, HOCs         | `apps/brgy-system-mobile/AGENTS.md` § Preferred React Patterns             |
| Server state, caching, mutations               | `apps/brgy-system-mobile/AGENTS.md` § Server State and Data Fetching Rules |
| Optimistic UI, rollback                        | `apps/brgy-system-mobile/AGENTS.md` § Optimistic UI Rules                  |
| State management decision guide                | `apps/brgy-system-mobile/AGENTS.md` § State Management Rules               |
| Folder structure and colocation                | `apps/brgy-system-mobile/AGENTS.md` § Folder Structure Rules               |
| Performance standards                          | `apps/brgy-system-mobile/AGENTS.md` § Performance Standards                |
| Accessibility                                  | `apps/brgy-system-mobile/AGENTS.md` § Accessibility Rules                  |
| Security                                       | `apps/brgy-system-mobile/AGENTS.md` § Security Rules                       |
| Styling and design system                      | `apps/brgy-system-mobile/AGENTS.md` § Styling and Design System Rules      |
| Responsive / phone-first layout                | `apps/brgy-system-mobile/AGENTS.md` § Responsive Design Standards          |
| Theme support (light + dark)                   | `apps/brgy-system-mobile/AGENTS.md` § Theme Support Rules                  |
| Analytics                                      | `apps/brgy-system-mobile/AGENTS.md` § Analytics Standards                  |
| Expo and platform rules                        | `apps/brgy-system-mobile/AGENTS.md` § Expo and Platform Rules              |
| Icons + dark mode color tokens                 | `mobile-native-ui-design` › `references/icons.md`                          |
| Audit output format                            | `references/audit-format.md`                                               |
| Q&A / project discussion format                | `references/project-discussion.md`                                         |
| TypeScript patterns, guards, generics, brands  | `references/typescript-patterns.md`                                        |
| `useCallback` / `useMemo` decisions, profiling | `references/react-hooks.md`                                                |
| `useReducer` for complex local state           | `references/reducer.md`                                                    |
| `useReducer` + Context, split context, scaling | `references/reducer-context.md`                                            |
| TanStack Query / Apollo caching, mutations     | `references/caching.md`                                                    |
| React architecture, composition, colocation    | `references/react-patterns.md`                                             |
| Security checklist                             | `references/security.md`                                                   |
| ESLint, Prettier, formatting baseline          | `references/eslint-prettier.md`                                            |
| Common anti-patterns and what to do instead    | `references/common-anti-patterns.md`                                       |
| GraphQL client, defineQuery, defineMutation    | `references/graphql-patterns.md`                                           |
| Auth store, useAuth, AuthProvider, route guard | `references/auth-patterns.md`                                              |
| Push notifications (expo-notifications)        | `references/push-notifications.md`                                         |
| Toast / showToast / ToastHost                  | `references/toast-feedback.md`                                             |
| Offline detection, NetworkErrorBanner          | `references/network-connectivity.md`                                       |
| date-fns, centralized formatters, isValid      | `references/date-handling.md`                                              |
| ErrorBoundary, screen-level error states       | `references/error-handling.md`                                             |
| Native date picker (DateTimePicker + forms)    | `references/native-date-picker.md`                                         |
| Rich text: plain text extraction, Prose render | `references/rich-text.md`                                                  |

---

## Non-negotiables (apply every time)

Each rule lives in a dedicated reference — consult it before implementing:

| Rule area                                                         | Reference                                                                                               |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Keyboard avoidance + safe areas                                   | `references/layout-and-safe-areas.md`                                                                   |
| Server state + cache invalidation                                 | `references/caching.md`                                                                                 |
| Forms (useForm + zod + useFieldArray)                             | `references/forms.md`                                                                                   |
| TypeScript (casts, assertions, boundaries)                        | `references/typescript-patterns.md`                                                                     |
| Responsive layout + light/dark theming                            | `references/responsive-and-theming.md`                                                                  |
| Platform behavior + Expo-first + platform files                   | `references/platform-patterns.md`                                                                       |
| FlatList, search debounce, inline flows, screen states, analytics | `references/ux-patterns.md`                                                                             |
| State signal clarity and redundancy                               | `references/common-anti-patterns.md`                                                                    |
| Icons (MaterialIcons only) + dark mode color tokens               | `mobile-native-ui-design` › `references/icons.md` (NON-NEGOTIABLE: hardcoded icon colors are a blocker) |

---

## Pattern selection guide

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
3. Follow `apps/brgy-system-mobile/AGENTS.md` § Folder Structure Rules for placement; keep screen entry files thin.
4. Colocate code by feature unless clearly shared.
5. Invoke `mobile-native-ui-design` before writing any UI.
6. Use hooks, providers, and server-state tools consistently.
7. Check project shared components before building custom ones.
8. Add loading, empty, and error states for every async flow.
9. Verify keyboard avoidance, safe areas, and scroll behavior on both platforms.
10. Protect perceived performance: startup first, then input responsiveness, scroll, layout stability.
11. For performance changes, name the metric and explain why it improves.
12. For security-sensitive work, verify against `apps/brgy-system-mobile/AGENTS.md` § Security Rules.
13. For user-facing UI, verify responsiveness, accessibility, and both platform behaviors.
14. For server mutations, prefer targeted cache updates or invalidation over app reload.

---

## Common anti-patterns to avoid

Do not:

- Over-abstract early
- Repeat fetch logic across components
- Dump feature logic into global utilities
- Use HOCs for logic that should be a hook
- Create unnecessary re-renders
- Force full app reload after mutations when targeted cache update suffices
- Invalidate the entire cache when only specific queries are affected
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
