# Code Splitting Pattern (React & Modern Web Apps)

## Overview

Code splitting is a performance optimization technique that splits your JavaScript bundle into smaller chunks that load only when needed.

Instead of shipping one large JS file, your app loads:

- Only what is required for the first screen (critical path)
- Additional code when users navigate or interact (deferred path)

### Goal

Reduce initial load time, improve Time to Interactive (TTI), lower Total Blocking Time (TBT), and decrease the JavaScript payload that blocks the main thread during first paint.

### Core Web Vitals Impact

| Metric        | How Code Splitting Helps                                                       |
| ------------- | ------------------------------------------------------------------------------ |
| **INP / TBT** | Primary benefit — less JS to parse and execute means less main-thread blocking |
| **LCP**       | Indirect — deferred JS stops blocking critical rendering resources             |
| **CLS**       | Risk — lazy-loaded components without proper fallbacks can cause layout shifts |

---

## 1. Types of Code Splitting

### 1. Route-Level Splitting

Split code by pages or routes. This is the highest-impact, lowest-effort split type.

Most modern frameworks handle this automatically:

- **Next.js** — automatic per-page splitting via file-based routing
- **Remix** — automatic per-route splitting
- **React Router v6.4+** — lazy routes via `React.lazy`
- **Vite** — automatic chunk splitting on dynamic `import()`

#### React Router Example

```tsx
import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';

// Each lazy() call creates a separate chunk loaded on navigation
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Settings = lazy(() => import('./pages/Settings'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));

function App() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </Suspense>
  );
}
```

#### Next.js App Router

Next.js App Router automatically code-splits by route segment. Each `page.tsx` and `layout.tsx` produces its own chunk. No additional configuration needed.

```
app/
  dashboard/page.tsx   → separate chunk, loaded on /dashboard navigation
  settings/page.tsx    → separate chunk, loaded on /settings navigation
  admin/page.tsx       → separate chunk, loaded on /admin navigation
```

**Best candidates for route-level splitting:**

- Dashboard / Analytics pages (heavy charts, data grids)
- Admin panels (role-gated, rarely accessed by most users)
- Settings / Profile pages (not part of core flow)
- Authentication pages (login, signup, password reset)
- Report / Export pages (complex table rendering)

---

### 2. Component-Level Splitting

Split heavy or optional components within a page. Use this when a single route contains both lightweight and heavyweight UI.

**Best candidates:**

| Component                                              | Typical Size Impact | Why Split                        |
| ------------------------------------------------------ | ------------------- | -------------------------------- |
| Charts (`recharts`, `chart.js`)                        | 100–300KB           | Render library + data viz logic  |
| Maps (`leaflet`, `mapbox-gl`)                          | 200–500KB           | Map tile library + geo logic     |
| Rich text editors (`monaco-editor`, `tiptap`, `quill`) | 300–1MB+            | Full editor runtime              |
| 3D rendering (`three.js`)                              | 500KB+              | WebGL runtime                    |
| PDF viewers (`react-pdf`)                              | 200–400KB           | PDF parsing and rendering        |
| Data grids (`ag-grid`, `tanstack-table` with features) | 100–300KB           | Full grid with sorting/filtering |
| Markdown renderers with syntax highlighting            | 50–150KB            | Prism/Shiki + language grammars  |

#### React Example

```tsx
import { lazy, Suspense } from 'react';

// Chart component is in a separate chunk — only loaded when Analytics renders
const Chart = lazy(() => import('./Chart'));

function Analytics() {
  return (
    <div>
      <h2>Analytics Overview</h2>
      <p>Summary metrics loaded with the page...</p>

      {/* Chart loads separately — show skeleton while loading */}
      <Suspense fallback={<ChartSkeleton height={400} />}>
        <Chart />
      </Suspense>
    </div>
  );
}
```

#### Next.js `dynamic()` Example

```tsx
import dynamic from 'next/dynamic';

// ssr: false is appropriate here because Monaco requires browser APIs
const CodeEditor = dynamic(() => import('./CodeEditor'), {
  ssr: false,
  loading: () => <EditorSkeleton height={600} />,
});

function Playground() {
  return (
    <div>
      <h2>Code Playground</h2>
      <CodeEditor defaultLanguage="typescript" />
    </div>
  );
}
```

**When to use `ssr: false`:**

- Component requires browser-only APIs (`window`, `document`, `canvas`, `WebGL`)
- Component uses a library that crashes during SSR (Monaco, Leaflet, some chart libraries)
- **Do NOT use `ssr: false` just to fix hydration mismatches** — fix the mismatch instead

---

### 3. On-Demand (User-Triggered) Splitting

Load code only when the user explicitly interacts. This is the best ROI pattern because the code may never be needed at all.

#### Example: Modal

```tsx
import { useState, lazy, Suspense } from 'react';

// InviteModal chunk only downloads when user clicks the button
const InviteModal = lazy(() => import('./InviteModal'));

function InviteButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)}>Invite Team Member</button>

      {open && (
        <Suspense fallback={<ModalSkeleton />}>
          <InviteModal onClose={() => setOpen(false)} />
        </Suspense>
      )}
    </>
  );
}
```

#### Example: Conditional Feature

```tsx
import { useState, lazy, Suspense } from 'react';

const AdvancedFilters = lazy(() => import('./AdvancedFilters'));

function SearchPanel() {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div>
      <BasicSearchInput />
      <button onClick={() => setShowAdvanced(true)}>Advanced Filters</button>

      {showAdvanced && (
        <Suspense fallback={<FiltersSkeleton />}>
          <AdvancedFilters />
        </Suspense>
      )}
    </div>
  );
}
```

**Best candidates for on-demand splitting:**

- Modals and drawers (invite, settings, confirmation dialogs)
- Wizards and multi-step flows (onboarding, checkout)
- Advanced/expandable filter panels
- Export/download tools
- Admin-only controls within shared pages
- "View more" / expandable sections with heavy content
- Comment sections / reply forms on content pages

---

### 4. Library-Level Splitting (Dynamic Import)

Load large third-party libraries only when needed, without wrapping in a component.

```ts
// Load the PDF library only when user clicks "Export PDF"
async function exportToPDF(data: ReportData) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  doc.text(data.title, 10, 10);
  // ... build PDF
  doc.save('report.pdf');
}
```

```ts
// Load syntax highlighter only when code block is rendered
async function highlightCode(code: string, language: string) {
  const { highlight, languages } = await import('prismjs');
  await import(`prismjs/components/prism-${language}`);
  return highlight(code, languages[language], language);
}
```

**Good candidates for library-level dynamic imports:**

| Library                 | Size      | Trigger                                      |
| ----------------------- | --------- | -------------------------------------------- |
| `monaco-editor`         | ~2MB      | User opens code editor                       |
| `jspdf` / `pdfmake`     | 200–400KB | User clicks "Export PDF"                     |
| `xlsx` / `exceljs`      | 300–500KB | User clicks "Export Excel"                   |
| `chart.js` / `recharts` | 100–300KB | Chart component mounts                       |
| `leaflet` / `mapbox-gl` | 200–500KB | Map component mounts                         |
| `three.js`              | 500KB+    | 3D viewer component mounts                   |
| `prismjs` / `shiki`     | 50–200KB  | Code block renders                           |
| `date-fns` (full)       | 70KB+     | Use tree-shakeable imports instead           |
| `lodash` (full)         | 70KB+     | Import specific functions: `lodash/debounce` |

---

## 2. When To Use Code Splitting

Use code splitting when **any** of these are true:

| Condition                                   | Example                                       |
| ------------------------------------------- | --------------------------------------------- |
| Component is not needed for first paint     | Below-the-fold sections, secondary tabs       |
| Feature is rarely used                      | Export tools, admin panels, advanced settings |
| Dependency is large (>50KB gzipped)         | Chart libraries, editors, PDF generators      |
| Feature is role-based                       | Admin-only controls, premium features         |
| Feature is below the fold                   | Footer content, "Load more" sections          |
| Feature is optional or conditional          | Advanced filters, optional integrations       |
| Feature requires user interaction to access | Modals, drawers, expandable panels            |

---

## 3. When NOT To Use Code Splitting

Avoid splitting:

| Component                                         | Why Not                                                           |
| ------------------------------------------------- | ----------------------------------------------------------------- |
| Header / Navigation                               | Always visible, needed for first paint, critical for LCP          |
| Hero section / above-the-fold content             | LCP candidate — must render immediately                           |
| Primary CTA button                                | Must be interactive immediately                                   |
| Small components (<5KB)                           | Network overhead of a separate request exceeds the bundle savings |
| Frequently reused shared UI (Button, Input, Card) | Used on every page, splitting adds latency everywhere             |
| Global providers/context                          | Must be available before any child renders                        |

**Over-splitting causes:**

- **Too many network requests** — each chunk is a separate HTTP request with connection overhead
- **Request waterfalls** — chunk A loads → discovers it needs chunk B → loads chunk B (sequential, not parallel)
- **Flashing loading states** — multiple Suspense boundaries showing and hiding skeletons
- **Worse UX despite smaller bundles** — perceived performance degrades when users see loading spinners everywhere

---

## 4. Performance Strategy Pattern

### Step 1: Audit Current Bundle

Before splitting, measure what you have:

```bash
# Next.js
ANALYZE=true npx next build

# Vite
npx vite-bundle-visualizer

# Generic webpack
npx webpack-bundle-analyzer dist/stats.json
```

Look for:

- Total JS size (gzipped) — above 200KB is worth investigating
- Individual chunks larger than 100KB
- Libraries imported but barely used
- Duplicate dependencies across chunks

### Step 2: Categorize by Render Priority

| Priority Layer           | What It Contains                                                | Loading Strategy                                  |
| ------------------------ | --------------------------------------------------------------- | ------------------------------------------------- |
| **Layer 1: Critical**    | Header, hero, navigation, primary CTA, page shell               | Ship in main bundle — no lazy loading             |
| **Layer 2: Interactive** | Forms, secondary content, tabs, data grids below fold           | Lazy load on route entry or viewport intersection |
| **Layer 3: On-Demand**   | Modals, drawers, export tools, admin features, advanced filters | Load on user interaction (click, hover prefetch)  |
| **Layer 4: Rare**        | Help widgets, feedback forms, debug tools, one-time wizards     | Load on demand, accept loading delay              |

### Step 3: Split by Importance

Apply splits from highest impact to lowest:

1. **Route-level first** — ensure each page only ships its own code
2. **Large library extraction** — dynamic import for heavy dependencies
3. **Component-level for below-fold heavyweight UI** — charts, editors, maps
4. **User-triggered for modals/drawers** — only load when opened
5. **Conditional features** — role-gated, feature-flagged content

### Step 4: Measure After

```bash
# Compare before/after bundle sizes
# Run Lighthouse before and after
# Check Network tab for request count and waterfall
# Verify no CLS introduced by loading states
```

---

## 5. Common Real-World Examples

| Feature                                | Split Type                        | Trigger                 | Expected Savings   |
| -------------------------------------- | --------------------------------- | ----------------------- | ------------------ |
| Analytics dashboard charts             | Component-level                   | Tab/page mount          | 100–300KB          |
| Admin-only user management             | Route-level                       | Admin navigation        | Entire page bundle |
| Marketing page testimonials carousel   | Component-level                   | Viewport intersection   | 30–80KB            |
| Video player (YouTube embed or custom) | Component-level                   | Viewport intersection   | 50–200KB           |
| Payment / Stripe integration           | On-demand                         | Checkout button click   | 80–150KB           |
| Advanced search panel with facets      | On-demand                         | "Advanced" button click | 30–80KB            |
| Data export (CSV/PDF/Excel)            | Library-level                     | Export button click     | 200–500KB          |
| Code editor (Monaco)                   | Component-level with `ssr: false` | Editor tab mount        | 1–2MB              |
| Rich text editor (Tiptap/Quill)        | Component-level                   | Editor mount            | 100–300KB          |
| Map integration (Leaflet/Mapbox)       | Component-level with `ssr: false` | Map section mount       | 200–500KB          |

---

## 6. Code Splitting vs Performance Reality

### When It Helps Most

Code splitting has the biggest impact when:

- Your total JS bundle exceeds **200–300KB gzipped**
- A single heavy library dominates the bundle (>100KB)
- You have many features that most users don't use on every page visit
- Lighthouse TBT/INP scores are poor due to JavaScript execution time
- First paint is delayed by JS parsing on mobile devices

### When It Doesn't Help Much

- Your app is already small (<100KB total JS)
- Most components are needed immediately on every page
- You split tiny components (<5KB) — the overhead exceeds the benefit
- The bottleneck is network latency, not bundle size (in this case, focus on CDN/caching)
- The bottleneck is data fetching, not JS execution (in this case, focus on API optimization)

### Measurement Tools

| Tool                              | What It Shows                                               | When to Use                                      |
| --------------------------------- | ----------------------------------------------------------- | ------------------------------------------------ |
| **Lighthouse**                    | TBT, LCP, INP simulation, total JS                          | Before/after comparison for overall impact       |
| **Chrome DevTools → Network**     | Individual chunk sizes, request waterfall, loading timeline | Verify chunks load at the right time             |
| **Chrome DevTools → Performance** | Main thread activity, long tasks, script evaluation time    | Identify which scripts block interaction         |
| **Chrome DevTools → Coverage**    | % of JS/CSS that is actually used on the current page       | Find unused code that should be split or removed |
| **`@next/bundle-analyzer`**       | Visual treemap of Next.js bundle chunks                     | Identify large dependencies and split candidates |
| **`source-map-explorer`**         | Treemap from source maps                                    | Works with any bundler                           |
| **`bundlephobia.com`**            | Per-package size estimate                                   | Evaluate dependency size before installing       |

---

## 7. Loading Fallback Best Practices

Lazy-loaded components need loading states. Bad fallbacks hurt CLS and UX.

### Do: Match Layout Dimensions

```tsx
// Reserve the exact space the chart will occupy
<Suspense
  fallback={
    <div className="h-[400px] w-full animate-pulse rounded-lg bg-muted" />
  }
>
  <Chart />
</Suspense>
```

### Do: Use Skeleton Components

```tsx
// Skeleton that matches the modal's expected shape
<Suspense fallback={<ModalSkeleton />}>
  <SettingsModal />
</Suspense>
```

### Don't: Use Generic Spinners for Layout Content

```tsx
// BAD — spinner doesn't reserve space, causes layout shift
<Suspense fallback={<Spinner />}>
  <DataGrid />
</Suspense>
```

### Don't: Show Nothing

```tsx
// BAD — content area collapses then expands, causing CLS
<Suspense fallback={null}>
  <HeavyComponent />
</Suspense>
```

### Guidelines

| Split Type            | Recommended Fallback                                                |
| --------------------- | ------------------------------------------------------------------- |
| Route-level           | Full page skeleton / `loading.tsx` in Next.js                       |
| Component below fold  | Dimension-matched skeleton or placeholder                           |
| Modal / Drawer        | Small spinner inside modal frame (acceptable — modal is an overlay) |
| Library-level (no UI) | Button loading state / progress indicator                           |

---

## 8. Prefetching Split Chunks

Reduce perceived latency by prefetching chunks before the user needs them.

### Prefetch on Hover (Links)

```tsx
import { lazy } from 'react';

const SettingsPage = lazy(() => import('./pages/Settings'));

function NavLink() {
  const prefetch = () => {
    // Triggers the chunk download without rendering the component
    import('./pages/Settings');
  };

  return (
    <Link to="/settings" onMouseEnter={prefetch} onFocus={prefetch}>
      Settings
    </Link>
  );
}
```

### Next.js Automatic Prefetching

Next.js `<Link>` prefetches linked routes automatically when they enter the viewport (production only). This handles most route-level prefetching without additional code.

```tsx
import Link from 'next/link';

// Next.js automatically prefetches /dashboard when this link is visible
<Link href="/dashboard">Dashboard</Link>

// Disable prefetch for low-probability routes
<Link href="/admin" prefetch={false}>Admin</Link>
```

---

## 9. Mental Model

Think in layers:

```
┌─────────────────────────────────────────────┐
│  Layer 1: CRITICAL (main bundle)            │
│  Header, Nav, Hero, Primary CTA, Page Shell │
│  → Ships with initial HTML, no lazy loading │
├─────────────────────────────────────────────┤
│  Layer 2: INTERACTIVE (lazy on mount)       │
│  Below-fold sections, secondary tabs,       │
│  data grids, form-heavy content             │
│  → Lazy loaded when route/section renders   │
├─────────────────────────────────────────────┤
│  Layer 3: ON-DEMAND (lazy on interaction)   │
│  Modals, drawers, export tools, editors,    │
│  advanced features, admin controls          │
│  → Loaded when user clicks/opens            │
├─────────────────────────────────────────────┤
│  Layer 4: RARE (accept loading delay)       │
│  Debug tools, help widgets, one-time setup  │
│  → Loaded on demand, delay is acceptable    │
└─────────────────────────────────────────────┘
```

**Only Layer 1 should be in the main bundle.** Everything else should load when needed.

---

## 10. Quick Checklist

Before splitting, ask:

- [ ] Is this required for first paint? → **Don't split**
- [ ] Is this used by most users on most page loads? → **Probably don't split**
- [ ] Is this dependency heavy (>50KB gzipped)? → **Split candidate**
- [ ] Is this feature optional or rarely used? → **Split candidate**
- [ ] Is this behind a user interaction (modal, drawer, tab)? → **Strong split candidate**
- [ ] Is this role-gated (admin-only)? → **Split candidate**
- [ ] Will splitting improve UX or harm it (loading flash)? → **Measure to decide**
- [ ] Can I provide a good loading fallback without CLS? → **Required before splitting**

---

## 11. Common Mistakes

| Mistake                               | Problem                                                   | Fix                                                 |
| ------------------------------------- | --------------------------------------------------------- | --------------------------------------------------- |
| Splitting the header/nav              | Loading flash on every page, blocks first paint           | Keep in main bundle                                 |
| Lazy-loading hero/LCP content         | Hurts LCP because content loads late                      | Keep hero in main bundle, mark images as `priority` |
| `ssr: false` to fix hydration errors  | Hides the real problem, hurts SEO and LCP                 | Fix the hydration mismatch, stabilize render        |
| No loading fallback                   | Content area collapses then expands (CLS)                 | Always provide dimension-matched skeleton           |
| Over-splitting small components       | Many network requests, loading flash on every interaction | Only split when size justifies it (>50KB)           |
| Splitting without measuring           | No evidence the split helps                               | Always measure bundle size before/after             |
| Not considering the loading waterfall | Chunk A → loads → discovers it needs Chunk B → loads B    | Flatten import chains, prefetch where possible      |

---

## 12. Summary

Code splitting is about:

- **Reducing initial JS** so the browser can parse and paint faster (TBT/INP improvement)
- **Improving first load speed** by deferring non-critical code (LCP improvement when JS was blocking)
- **Loading features only when needed** to reduce bandwidth and execution cost
- **Avoiding unnecessary complexity** — split only when the benefit is measurable

### Implementation Priority

1. **Route-level splitting** — automatic in Next.js, highest impact in React Router apps
2. **Heavy library extraction** — dynamic import for >100KB dependencies
3. **Component-level splitting** — charts, editors, maps below the fold
4. **User-triggered splitting** — modals, drawers, export tools
5. **Measure before and after** — always verify the split helped

---

## Related References

- `references/core-web-vitals.md` — the metrics (LCP, TBT) splitting decisions must improve, not just move
- `references/nextjs-performance-seo.md` — Next.js `next/dynamic` usage and rendering strategy context
- `references/tiptap-richtext.md`, `references/charts-recharts.md` — the canonical heavy-import consumers in this app
