# CLAUDE.md

## Scope

This file covers the `apps/org-system-admin` Next.js application. All implementation standards, patterns, and reference docs for this app live in the `web-app` skill.

## Required Skills

### For all work in apps/org-system-admin

Before writing, reviewing, or refactoring any code in this app, invoke:

1. **`web-app`** — the full implementation standard for this app. Covers TypeScript, React patterns, server state, caching, folder structure, routing, SSR/SSG, performance, SEO, analytics, accessibility, responsive design, security, and browser compatibility. Also maps each task to the correct reference doc under `apps/org-system-admin/reference/`.
2. For any UI work, invoke **`web-ui-design`** — apply web execution rules: responsive layout, shadcn/Tailwind composition, semantic HTML, keyboard/focus behavior, visual hierarchy, dark mode, loading/empty/error states, charts, tables, dialogs, drawers, and accessibility polish.

Invoke automatically at the start of every task in `apps/org-system-admin`. Do not skip it.

## Design Skill Layering

When UI/UX recommendation skills are used with this app, keep a strict authority order:

1. **User request** — the requested page, workflow, audience, and explicit constraints.
2. **App instructions** — this file, `AGENTS.md`, `web-app`, and established app architecture.
3. **Existing implementation** — current tokens, Tailwind classes, shadcn components, routes, server-state patterns, naming, and feature folders.
4. **Web platform execution** — semantic HTML, keyboard navigation, focus states, responsive behavior, SSR/hydration safety, accessibility, dark mode, and Core Web Vitals.
5. **Design execution** — `web-ui-design` for product patterns, visual direction, accessibility, UX anti-patterns, palette/font ideas, chart guidance, and web execution rules. Adapt or reject any recommendation that conflicts with the existing admin app, Tailwind/shadcn conventions, Next.js App Router structure, SSR constraints, accessibility, or performance requirements.

### Conflict Rules

- Existing app tokens and components win over generated palettes, font stacks, icon systems, and component patterns.
- Web app architecture wins over generic design output: keep route files thin, colocate feature code, preserve server-state patterns, and avoid hydration-unstable rendering.
- Web platform behavior wins over native mobile patterns. Do not copy native bottom tabs, haptics, mobile-only gestures, or native sheet behavior unless the web app already has an equivalent pattern.
- For admin/civic/government experiences, prioritize clarity, trust, contrast, readable density, and efficient task completion over decorative spectacle.
- Keep changes scoped to the feature or app area that owns the behavior.
