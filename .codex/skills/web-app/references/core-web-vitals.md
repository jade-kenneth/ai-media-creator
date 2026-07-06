# Lighthouse Patterns Guide

## Performance Standards

Protect Core Web Vitals by default.

**Priority order:** LCP → INP / TBT → CLS

- Optimize the largest visible content first.
- Use `next/image` where applicable.
- Do not lazy-load above-the-fold critical content.
- Code-split heavy optional UI.
- Keep route shells and layouts as server-rendered when possible.
- Lazy-load large non-critical features such as charts, maps, editors, and large modals only when needed.
- Avoid long synchronous tasks in render paths and event handlers.
- Reduce client-side JavaScript before applying micro-optimizations.
- Reserve layout space for images, embeds, banners, and other delayed content to avoid CLS.
- Prefer preserving user context with inline flows rather than full-route transitions for common CRUD interactions.
- When making a performance-focused change, state which metric is expected to improve and why.

---

This guide summarizes practical frontend patterns that consistently improve Lighthouse scores and Core Web Vitals without wasting time on low-impact tweaks.

It is written for modern React/Next.js apps (including App Router) and should be used as a build/review checklist, not just a one-time optimization pass.

---

## Table of Contents

1. [Core Principle](#core-principle)
2. [LCP Patterns](#1-lcp-patterns-make-the-main-thing-load-fast)
3. [INP / TBT Patterns](#2-inp--tbt-patterns-keep-the-main-thread-responsive)
4. [CLS Patterns](#3-cls-patterns-keep-layout-stable)
5. [Network and Loading Patterns](#4-network-and-loading-patterns-high-impact-often-missed)
6. [React / Next.js Architecture Patterns](#5-react--nextjs-architecture-patterns-that-improve-lighthouse)
7. [Lighthouse Categories Beyond Performance](#6-lighthouse-categories-beyond-performance-fast-wins)
8. [Practical Optimization Routine](#7-a-practical-optimization-routine-per-page--feature)
9. [PR Review Checklist](#8-pr-review-checklist-lighthouse-oriented)
10. [Anti-Patterns](#9-anti-patterns-to-avoid)

---

## Core Principle

Optimize what users feel first:

| Metric   | Full Name                 | What It Measures                                 | Good Threshold | User Perception        |
| -------- | ------------------------- | ------------------------------------------------ | -------------- | ---------------------- |
| **LCP**  | Largest Contentful Paint  | How fast the main content appears                | ≤ 2.5s         | "The page loaded"      |
| **INP**  | Interaction to Next Paint | How responsive the UI feels on interaction       | ≤ 200ms        | "The UI responded"     |
| **CLS**  | Cumulative Layout Shift   | How stable the layout is during load             | ≤ 0.1          | "Nothing jumped"       |
| **TBT**  | Total Blocking Time       | How long the main thread is blocked (lab metric) | ≤ 200ms        | Proxy for INP in lab   |
| **FCP**  | First Contentful Paint    | Time to first rendered content                   | ≤ 1.8s         | "Something appeared"   |
| **TTFB** | Time to First Byte        | Server response time                             | ≤ 800ms        | "Server is responding" |

If LCP, INP, and CLS are healthy, Lighthouse performance scores usually follow.

**Important**: TBT is a lab-only metric (Lighthouse) that approximates responsiveness. INP is the real-user (field) metric that replaced FID in March 2024. Optimize for both, but prioritize INP for production.

---

## 1. LCP Patterns (Make the Main Thing Load Fast)

LCP is usually the hero image, hero section, main heading block, or largest visible text block. Identify the LCP element first — then optimize specifically for it.

### How to Identify the LCP Element

1. **Lighthouse**: Run Lighthouse → Performance tab → scroll to "Largest Contentful Paint element"
2. **Chrome DevTools**: Performance panel → reload → look for "LCP" marker in the timeline
3. **Web Vitals Extension**: Chrome extension that overlays the LCP element on the page

### Priorities

1. Make the LCP element discoverable by the browser preload scanner (no lazy-load, no JS-dependent rendering)
2. Make the LCP resource small and fast (optimized images, minimal render-blocking CSS/JS)
3. Ensure the server responds quickly (TTFB ≤ 800ms)

### Do

| Action                                | Impact     | Implementation                                                                                                                                                 |
| ------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Serve correctly sized images          | **High**   | Use responsive `srcset` or `next/image` with `sizes` prop. Don't serve a 4000px image for a 800px container.                                                   |
| Use modern image formats              | **High**   | `WebP` (95% support) or `AVIF` (85% support). `next/image` auto-converts. For static assets, convert manually with `sharp` or `squoosh`.                       |
| Preload the LCP image                 | **High**   | `<link rel="preload" as="image" href="...">` or `next/image` with `priority` prop. Only preload ONE image — the LCP candidate.                                 |
| Preload critical fonts                | **Medium** | `<link rel="preload" as="font" type="font/woff2" href="..." crossorigin>`. Only preload 1–2 fonts used above the fold. `next/font` handles this automatically. |
| Keep critical CSS small               | **Medium** | Inline critical CSS or use CSS-in-JS that extracts critical styles. Avoid importing large CSS files that block rendering.                                      |
| Defer non-critical scripts            | **Medium** | Use `next/script` with `afterInteractive` or `lazyOnload`. Move analytics, chat widgets, and tracking to `afterInteractive` at minimum.                        |
| Use Server Components for LCP content | **Medium** | In Next.js App Router, keep the hero/heading in a Server Component so it's in the initial HTML, not hydration-dependent.                                       |

### Avoid

| Anti-Pattern                                    | Why It Hurts LCP                                                                                                   |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Lazy-loading the hero image                     | Browser discovers the image late, after JavaScript runs. LCP delayed by JS parse + execute time.                   |
| Loading multiple heavy fonts before first paint | Each font is a render-blocking resource. Load only what's needed above the fold.                                   |
| Large JS bundles before LCP                     | The browser cannot paint LCP until render-blocking JS is parsed. Code-split aggressively.                          |
| Client-side rendering of LCP content            | If the hero is rendered by JavaScript (not in initial HTML), LCP waits for JS download + parse + execute + render. |
| CSS `background-image` for hero                 | The preload scanner cannot discover `background-image` URLs. Use `<img>` or `next/image` for LCP images.           |
| Chaining requests before LCP                    | Image loaded by JS → JS loaded after CSS → CSS loaded after HTML = waterfall. Preload breaks the chain.            |

### Next.js Specifics

```tsx
import Image from 'next/image';

// Hero image — LCP candidate
<Image
  src="/hero-banner.jpg"
  alt="Frontend Vault — Your Developer Workspace"
  width={1600}
  height={900}
  priority // Disables lazy loading, adds preload hint
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px" // Match actual rendered width
  className="object-cover"
/>;
```

**`sizes` prop is critical for `next/image` with `fill`**: Without it, the browser downloads the largest size variant. With it, the browser picks the correct size for the current viewport.

| Container                | `sizes` Value                                              |
| ------------------------ | ---------------------------------------------------------- |
| Full-width hero          | `100vw` or `(max-width: 768px) 100vw, 1200px`              |
| Fixed thumbnail (40px)   | `40px`                                                     |
| Fixed card image (300px) | `300px`                                                    |
| Responsive grid item     | `(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw` |

---

## 2. INP / TBT Patterns (Keep the Main Thread Responsive)

Users feel slow interaction when the main thread is blocked by JavaScript parsing, hydration, or expensive rendering work. INP measures the worst interaction delay; TBT measures total blocking during load.

### How to Identify Main Thread Bottlenecks

1. **Chrome DevTools → Performance panel**: Record a session, look for "Long Tasks" (red bars >50ms)
2. **Lighthouse → Diagnostics**: "Avoid long main-thread tasks" shows specific scripts
3. **Chrome DevTools → Coverage**: Shows what % of each JS/CSS file is actually used

### Priorities (Ordered by Impact)

1. **Reduce shipped JavaScript** — less JS = less parse/execute time = faster interactions
2. **Break up long tasks** — no single task should block the main thread for >50ms
3. **Hydrate only what needs interactivity** — Server Components by default in App Router

### Do

| Action                                     | Impact     | Implementation                                                                                                              |
| ------------------------------------------ | ---------- | --------------------------------------------------------------------------------------------------------------------------- |
| Remove unused dependencies                 | **High**   | Run `npx depcheck` or check Coverage tab. Replace heavy libraries with lighter alternatives.                                |
| Code-split at route and feature boundaries | **High**   | See `CODE_SPLITTING_DOCS.md`. Next.js does route-level splitting automatically.                                             |
| Lazy-load heavy UI below the fold          | **High**   | `dynamic(() => import('./Chart'), { loading: () => <Skeleton /> })` for charts, editors, maps, data grids                   |
| Keep `'use client'` boundaries small       | **High**   | Don't mark entire pages as client. Extract the interactive part into a small client child component.                        |
| Defer non-critical hydration               | **Medium** | Use `<Suspense>` boundaries to stream heavy server-rendered sections. Client sees content progressively.                    |
| Break expensive work into smaller chunks   | **Medium** | Use `requestIdleCallback`, `setTimeout(fn, 0)`, or `scheduler.yield()` to break long synchronous operations.                |
| Move CPU-heavy work to Web Workers         | **Low**    | For truly heavy computation (image processing, search indexing, data parsing). Usually overkill for UI work.                |
| Avoid continuous polling in visible UI     | **Medium** | Prefer event-driven sync (`visibilitychange`, `storage`, WebSocket) over `setInterval`. If polling, use adaptive intervals. |

### Avoid

| Anti-Pattern                                                | Why It Hurts INP/TBT                                                                                                |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Shipping utility-heavy bundles (`lodash` full, `moment.js`) | Full library imported when only 1–2 functions used. Use tree-shakeable alternatives (`date-fns`, `lodash-es`).      |
| Rendering large interactive trees above the fold            | 1000+ DOM nodes → slow hydration → blocked main thread. Virtualize large lists.                                     |
| Heavy computation in render path                            | Sorting/filtering large arrays in render causes 50ms+ tasks. Use `useMemo` for expensive derived values.            |
| Mounting heavy hidden UI by default                         | Rendering a complex modal/form in the DOM but hiding with CSS still costs parse + render time. Conditionally mount. |
| `'use client'` on entire page                               | All components hydrate on the client. Only the interactive pieces need client-side JavaScript.                      |
| Synchronous `localStorage` reads in render                  | `localStorage.getItem()` is synchronous and blocks the main thread. Can be 1–5ms per call. Defer to `useEffect`.    |

### React/Next.js Patterns That Help

```tsx
// GOOD: Small client island in a Server Component page
// app/dashboard/page.tsx (Server Component)
export default function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1> {/* Server-rendered, zero JS */}
      <StatsOverview /> {/* Server Component */}
      <Suspense fallback={<ChartSkeleton />}>
        <InteractiveChart /> {/* Client Component — lazy loaded */}
      </Suspense>
    </div>
  );
}
```

```tsx
// BAD: Entire page as client component
'use client'; // ← Entire page hydrates, including static content
export default function DashboardPage() {
  const [tab, setTab] = useState('overview');
  return (
    <div>
      <h1>Dashboard</h1> {/* This doesn't need JS */}
      <StatsOverview /> {/* This doesn't need JS either */}
      <Chart /> {/* Only this needs client interactivity */}
    </div>
  );
}
```

---

## 3. CLS Patterns (Keep Layout Stable)

CLS issues come from elements that change size or position after the initial render. Users experience this as content "jumping" — text shifting down, buttons moving, images popping in.

### Common CLS Sources (Ranked by Frequency)

| Source                                             | CLS Impact | Fix                                                        |
| -------------------------------------------------- | ---------- | ---------------------------------------------------------- |
| Images without dimensions                          | **High**   | Always set `width`/`height` or `aspect-ratio`              |
| Web fonts loading late                             | **High**   | Use `next/font` or `font-display: swap` with `size-adjust` |
| Dynamically injected content above fold            | **High**   | Reserve space with min-height/skeleton                     |
| Ads/embeds loading asynchronously                  | **High**   | Set explicit dimensions on containers                      |
| Client-side rendering replacing server placeholder | **Medium** | Stabilize hydration output                                 |
| Cookie consent banners                             | **Medium** | Use fixed/sticky positioning, don't push content down      |
| Lazy-loaded images above fold                      | **Medium** | Don't lazy-load above-fold images                          |

### Do

```tsx
// Always set dimensions for images
<Image src="/photo.jpg" alt="..." width={800} height={600} />

// Or use aspect-ratio for responsive containers
<div className="aspect-video w-full">
  <Image src="/video-thumb.jpg" alt="..." fill className="object-cover" />
</div>

// Reserve space for async content
<div className="min-h-[200px]">
  <Suspense fallback={<Skeleton className="h-[200px]" />}>
    <AsyncContent />
  </Suspense>
</div>
```

### Font Loading Strategy

```tsx
// next/font — zero CLS approach
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',          // Show fallback text immediately
  // next/font automatically calculates size-adjust to minimize CLS
});

// Apply to root layout
<body className={inter.className}>
```

### Avoid

- Injecting banners, alerts, or toasts ABOVE existing content without reserved space
- Loading fonts that significantly change text metrics (character width, line height)
- Rendering image containers with unknown dimensions (no width/height, no aspect-ratio)
- Using `loading="lazy"` on above-the-fold images (delays load, then shifts layout when image arrives)
- Changing element sizes based on JavaScript after hydration (for example: reading `window.innerWidth` to set width)

---

## 4. Network and Loading Patterns (High Impact, Often Missed)

### Do

| Action                                       | Impact     | Details                                                                                                                                |
| -------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Use CDN for static assets                    | **High**   | Vercel/Netlify auto-CDN. For self-hosted: CloudFront, Cloudflare. Reduces TTFB for assets.                                             |
| Immutable cache headers for versioned assets | **High**   | `Cache-Control: public, max-age=31536000, immutable` for hashed filenames. Next.js does this automatically for `/_next/static/` files. |
| Reduce total request count                   | **Medium** | Bundle SVG icons into a sprite. Inline tiny images as data URIs (<4KB). Avoid 50+ separate icon requests.                              |
| Prefetch likely next routes                  | **Medium** | Next.js `<Link>` auto-prefetches visible links. For manual: `router.prefetch('/dashboard')`. Only prefetch high-probability routes.    |
| Compress responses                           | **High**   | Enable Brotli (`br`) or gzip on the server. Vercel enables Brotli automatically. Self-hosted: configure nginx/CDN.                     |
| Use HTTP/2 or HTTP/3                         | **Medium** | Enables multiplexing — multiple requests over one connection. Most CDNs support this.                                                  |

### Avoid

| Anti-Pattern                                                        | Problem                                                                                    |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Aggressive prefetching of low-probability routes                    | Wastes bandwidth on mobile, may conflict with data saver preferences                       |
| Loading many separate icon/image requests                           | 50+ HTTP requests for UI chrome adds significant overhead even with HTTP/2                 |
| Treating cache policy as an afterthought                            | Re-downloading the same unchanged JS/CSS on every visit is the biggest missed optimization |
| Loading all analytics/vendor scripts with `beforeInteractive`       | Every blocking script adds to TBT. Only GTM legitimately needs early loading.              |
| Multiple analytics bootstraps (GTM + standalone GA4 + direct pixel) | Duplicate tracking scripts, double-counted events, unnecessary bytes                       |

---

## 5. React / Next.js Architecture Patterns That Improve Lighthouse

Performance is often a **side effect** of good architecture decisions, not a separate optimization task.

### Keep Renders Cheap

| Pattern                          | Implementation                                                                          | Impact                                             |
| -------------------------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Split large components           | Break 500+ line components into focused children                                        | Reduces re-render scope                            |
| Avoid broad context updates      | Don't put frequently changing values (mouse position, animation frame) in React Context | Prevents subtree re-renders                        |
| Use selectors for stores         | Zustand `useStore(selector)`, Redux `useSelector`                                       | Only re-render when selected slice changes         |
| Memoize expensive derived values | `useMemo` for filtering/sorting large arrays                                            | Prevents recalculation per render                  |
| Virtualize long lists            | `@tanstack/virtual`, `react-window`                                                     | Render only visible items (10–20) instead of 1000+ |

### Use the Right State for the Job

| State Type         | Where to Put It                         | Example                                      |
| ------------------ | --------------------------------------- | -------------------------------------------- |
| Server state       | Query cache (TanStack Query, Apollo)    | API data, user profile, product list         |
| Local UI state     | `useState` / `useReducer`               | Modal open/close, form inputs, active tab    |
| Global UI state    | Small store (Zustand) or scoped Context | Sidebar collapsed, theme, notification count |
| Auth/session state | Auth provider                           | Current user, permissions, tokens            |
| URL state          | URL search params                       | Filters, pagination, sort order              |

### Be Intentional With Hydration

| Rule                                    | Reasoning                                                                              |
| --------------------------------------- | -------------------------------------------------------------------------------------- |
| Default to Server Components            | Zero client JS for static content                                                      |
| Keep client components small            | Less JS to hydrate = faster INP                                                        |
| Avoid hydration-unstable logic          | `Date.now()`, `Math.random()`, `window.innerWidth` in render cause mismatches          |
| Use mount guards for browser-only UI    | `const [mounted, setMounted] = useState(false); useEffect(() => setMounted(true), [])` |
| Don't use `ssr: false` as a default fix | Fix the hydration mismatch instead of hiding the component from SSR                    |

---

## 6. Lighthouse Categories Beyond Performance (Fast Wins)

### Accessibility (Score Impact: Direct)

| Check                 | Implementation                                                | Common Miss                                |
| --------------------- | ------------------------------------------------------------- | ------------------------------------------ |
| Labels for all inputs | `<label>` with `htmlFor`, or `aria-label`                     | Icon-only buttons without `aria-label`     |
| Semantic HTML         | `<nav>`, `<main>`, `<article>`, `<button>`, `<a>`             | `<div onClick>` instead of `<button>`      |
| Keyboard access       | Tab to all interactive elements, Enter/Space to activate      | Custom dropdowns not keyboard-navigable    |
| Visible focus states  | `:focus-visible` outline on all interactive elements          | Safari not showing focus by default        |
| Color contrast        | 4.5:1 for normal text, 3:1 for large text/UI                  | Light gray text on white background        |
| Alt text for images   | Descriptive `alt` for content images, `alt=""` for decorative | Missing `alt` or placeholder `alt="image"` |

### Best Practices (Score Impact: Direct)

| Check                      | Fix                                                    |
| -------------------------- | ------------------------------------------------------ |
| No console errors          | Clean up `console.log`, handle async errors            |
| HTTPS everywhere           | No mixed content (HTTP resources on HTTPS page)        |
| No deprecated APIs         | Replace deprecated Web APIs and library methods        |
| No vulnerable dependencies | Run `npm audit`, update or replace vulnerable packages |

### SEO (Score Impact: Direct)

| Check                                | Implementation                                        |
| ------------------------------------ | ----------------------------------------------------- |
| Unique `<title>` per page            | `metadata.title` in App Router                        |
| `<meta description>` per page        | `metadata.description` in App Router                  |
| Heading hierarchy                    | Single `<h1>`, logical `<h2>` → `<h3>` nesting        |
| Crawlable links                      | Use `<a href>` not `<div onClick>` for navigation     |
| Canonical URLs                       | `metadata.alternates.canonical` for duplicate content |
| Valid `robots.txt` and `sitemap.xml` | Generate in `app/robots.ts` and `app/sitemap.ts`      |

---

## 7. A Practical Optimization Routine (Per Page / Feature)

Use this sequence to avoid premature micro-optimizations:

### Step 1: Baseline

1. Run Lighthouse on the target page (incognito, no extensions, simulated throttling)
2. Record: Performance score, LCP, TBT, CLS, FCP
3. Identify the LCP element (Lighthouse reports it)
4. Note the biggest opportunities (Lighthouse Opportunities section)

### Step 2: Fix LCP First (Biggest Visual Impact)

1. Is the LCP element an image? → Add `priority`, ensure correct `sizes`, use modern format
2. Is the LCP element text? → Ensure font loads fast (`next/font`), minimize render-blocking CSS
3. Is there render-blocking JS before LCP? → Code-split, defer non-critical scripts
4. Is TTFB slow? → Check server response time, consider ISR/caching

### Step 3: Reduce Main-Thread Blocking (TBT/INP)

1. Check bundle size — any chunks >100KB?
2. Are there heavy client components that could be server components?
3. Are there heavy below-fold components that could be lazy-loaded?
4. Are there unused dependencies that can be removed?

### Step 4: Fix Layout Stability (CLS)

1. Do all images have dimensions or `aspect-ratio`?
2. Are fonts loading with `font-display: swap`?
3. Is any content injected above existing content after load?
4. Are there hydration mismatches causing layout changes?

### Step 5: Re-measure

1. Run Lighthouse again with identical conditions
2. Compare before/after for each metric
3. **Stop when improvements become low-impact relative to effort**

### Decision Framework

| Current Score | Action                                                                                        |
| ------------- | --------------------------------------------------------------------------------------------- |
| < 50          | Major architectural issues — investigate large bundles, slow TTFB, missing image optimization |
| 50–75         | Focus on the single biggest issue (usually LCP or TBT). One fix often jumps 10–20 points.     |
| 75–90         | Targeted optimizations — specific images, specific scripts, specific CLS sources              |
| 90+           | Diminishing returns — only fix if real user metrics (CrUX) show issues                        |

---

## 8. PR Review Checklist (Lighthouse-Oriented)

For every UI-facing PR, verify:

### LCP

- [ ] Is the above-the-fold content optimized for LCP?
- [ ] Are hero/primary images using `priority` and correct `sizes`?
- [ ] Is the LCP content in the initial HTML (not dependent on client JS)?

### TBT / INP

- [ ] Are large client-only components lazy-loaded or split when possible?
- [ ] Is `'use client'` scoped to the minimum necessary component?
- [ ] Are there any new heavy dependencies added to the client bundle?

### CLS

- [ ] Are image dimensions/aspect ratios defined to prevent CLS?
- [ ] Are fonts loaded without significant layout shift?
- [ ] Is any content injected above existing content after initial render?

### General

- [ ] Are scripts and SDKs guarded and non-blocking where possible?
- [ ] Is hydration stable (no browser-only values in initial SSR render)?
- [ ] Are there unnecessary re-renders or broad state updates?
- [ ] Did the change introduce console errors/warnings?
- [ ] Are accessibility basics maintained (labels, keyboard, focus, contrast)?

---

## 9. Anti-Patterns to Avoid

| Anti-Pattern                                          | Why It's Wrong                                                 | Better Approach                                                |
| ----------------------------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------- |
| Optimizing Lighthouse score only, not user experience | Score gaming (removing real content to reduce CLS) hurts users | Optimize for real user metrics (CrUX data)                     |
| Lazy-loading critical above-the-fold content          | Delays LCP, adds loading flash                                 | Keep hero/nav/CTA in main bundle                               |
| Adding heavy client libraries for simple UI           | 200KB library for a tooltip or dropdown                        | Use native HTML, Radix primitives, or lightweight alternatives |
| Full page reloads after mutations                     | Reloads kill client cache, reset scroll, destroy UI state      | Use state updates, cache invalidation, optimistic updates      |
| Fixing hydration by disabling SSR                     | `ssr: false` hides content from search engines and delays LCP  | Stabilize render logic, use mount guards                       |
| Overusing `useMemo`/`useCallback` without profiling   | Adds complexity and runtime cost for no measurable benefit     | Profile first, optimize only when re-render cost is real       |
| Premature micro-optimizations                         | Spending hours on 5ms improvement                              | Fix the biggest bottleneck first, measure impact               |

---

## Summary

The best Lighthouse improvements usually come from:

1. **Faster LCP content delivery** — optimized hero images, minimal render-blocking resources, fast TTFB
2. **Less JavaScript and lighter hydration** — Server Components, code splitting, smaller bundles
3. **Stable layout rendering** — explicit dimensions, proper font loading, reserved space
4. **Disciplined React/Next.js architecture** — right state for the job, small client boundaries, intentional hydration

**Treat Lighthouse as feedback, not the goal.** The goal is fast, stable, responsive UI for real users on real devices and real networks.

---

## Related References

- `references/nextjs-performance-seo.md` — framework-level patterns for the same metrics
- `references/code-splitting.md` — when splitting helps (and when it hurts) each metric
- `references/responsive-design.md` — § Performance-Related Responsiveness; CLS-stable layouts
