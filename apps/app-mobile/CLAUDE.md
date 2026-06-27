# CLAUDE.md

## Scope

This file covers the `apps/org-system-mobile` React Native Expo application. All implementation standards, patterns, and reference docs for this app live in the `mobile-app` skill.

## Required Skills

### For all work in apps/org-system-mobile

Before writing, reviewing, or refactoring any code in this app, invoke:

1. **`mobile-app`** — the full implementation standard for this app. Covers TypeScript, React patterns, server state, caching, folder structure, Expo and platform rules, performance, analytics, accessibility, responsive design, security, and platform compatibility. Also maps each task to the correct reference doc under `.claude/skills/mobile-app/references/`.
2. **`mobile-native-ui-design`** — invoke for screen-level work, navigation structure, Expo Router patterns, native tabs, Reanimated animations, and design quality: typography, spacing, color, tokens, platform conventions, accessibility states, and motion polish.

Invoke automatically at the start of every task in `apps/org-system-mobile`. Do not skip it.

## Design Skill Layering

When UI/UX recommendation skills are used with this app, keep a strict authority order:

1. **User request** — the requested feature, screen, audience, and explicit constraints.
2. **App instructions** — this file, `AGENTS.md`, `mobile-app`, and established app architecture.
3. **Existing implementation** — current tokens, NativeWind classes, components, navigation structure, data flow, naming, and feature folders.
4. **Native platform execution** — iOS/Android behavior, Expo Router patterns, safe areas, touch targets, accessibility, loading/error/empty states, and motion.
5. **Design execution** — `mobile-native-ui-design` for product patterns, visual direction, accessibility, UX anti-patterns, palette/font ideas, and mobile execution rules. Adapt or reject any recommendation that conflicts with the existing mobile app, NativeWind conventions, Expo Router structure, or native platform behavior.

### Conflict Rules

- Existing app tokens and components win over generated palettes, font stacks, icon systems, and component patterns.
- Native mobile navigation wins over web-centric patterns such as floating navbars, hover-first interactions, desktop card layouts, or landing-page structures.
- Platform behavior wins over one-size-fits-all UI. Share business logic and content, but diverge iOS and Android surfaces when native expectations differ.
- For civic/government experiences, prioritize clarity, trust, contrast, readability, and efficient task completion over decorative spectacle.
- Keep changes scoped to the feature or app area that owns the behavior.
