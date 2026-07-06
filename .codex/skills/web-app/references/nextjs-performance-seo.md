# Next.js Performance and SEO Patterns

## Next.js and SSR/Hydration Rules

Use App Router and rendering strategies safely and intentionally.

- Default to server-rendered output unless client interactivity is required.
- Add `'use client'` only when required for hooks, browser APIs, event handlers, or local state.
- Keep client components small and focused.
- Do not render hydration-unstable values during SSR or initial hydration — avoid `Date.now()`, `Math.random()`, `window`, `document`, `localStorage`, `navigator` in the initial render. Defer to `useEffect` or mount guards.
- Choose rendering strategy based on freshness and SEO needs:
  - **SSG** — content that rarely changes (docs, landing pages, guides, blog)
  - **ISR** — content that benefits from static performance but needs periodic refresh (product pages, frequently updated guides)
  - **SSR** — content that must be fresh on each request (personalized dashboards, user-specific pages, request-time search)
  - **CSR** — interactive sections that do not need SEO or request-time server rendering
- Always configure a title template in the root layout metadata so page titles stay consistent and SEO-friendly.

## SEO and Metadata Standards

For user-facing pages:

- Add metadata where relevant.
- Keep canonical URLs accurate.
- Add robots rules for non-indexable pages when needed.
- Keep semantic HTML and heading structure correct.
- Use JSON-LD structured data on SEO-relevant pages such as guides, articles, how-to pages, FAQs, and similar content types.
- Keep primary SEO content server-rendered.
- Keep crawlable pages internally linked.
- Keep `sitemap.xml` and `robots.txt` aligned with the real route structure — generate from the actual site structure whenever possible.
- Keep sitemap entries current and include useful metadata such as last modified dates when available.
- Make sure `robots.txt` allows public content and blocks sensitive or non-SEO routes.
- Set `metadataBase` once in the root layout — without it, every `openGraph`/`twitter` image and canonical URL resolves to `http://localhost:3000` and breaks in production.
- **When a page is publicly shareable or indexable** (landing, marketing, legal, public content), it must declare `openGraph` + `twitter` with a 1200×630 image, and its `description` must match that page's audience. Internal/authenticated tools (admin, account pages) don't need social metadata. See § 2a. Social Sharing (Open Graph / Twitter).
- Scope `robots: noindex` to the private **segment** layouts; never place it on the root layout (it silently de-indexes public pages and can suppress link previews).
- Breadcrumbs and JSON-LD: add when they materially improve discoverability.

---

Solid Next.js performance + SEO patterns you can apply right away.
This is written for **App Router** first, with notes where behavior differs.

---

## Table of Contents

### Performance

1. [Render Less JavaScript](#1-render-less-javascript-biggest-win)
2. [Route-Level Code Splitting + Dynamic Import](#2-route-level-code-splitting--dynamic-import)
3. [Optimize Images with `next/image`](#3-optimize-images-with-nextimage)
4. [Fonts: Use `next/font`](#4-fonts-use-nextfont-to-avoid-layout-shift)
5. [Cache + Revalidate Correctly](#5-cache--revalidate-correctly-app-router)
6. [Preload Critical Resources](#6-preload-critical-resources)
7. [Reduce Third-Party Cost](#7-reduce-third-party-cost)
8. [Streaming + Suspense](#8-streaming--suspense-for-faster-perceived-load)
9. [Avoid Waterfall Fetches](#9-avoid-waterfall-fetches)
10. [Bundle Hygiene](#10-bundle-hygiene)

### SEO

1. [Metadata](#1-use-metadata-properly-app-router)
2. [Dynamic Metadata](#2-use-dynamic-metadata-per-slug-blogproduct)
3. [Canonical URLs + noindex](#3-canonical-urls--noindex-rules)
4. [Structured Data](#4-structured-data-json-ld)
5. [Sitemap + Robots](#5-sitemapxml--robotstxt)
6. [Semantic HTML + Headings](#6-semantic-html--heading-structure)
7. [Internal Linking](#7-internal-linking--crawlability)
8. [Client-Only SEO Pitfalls](#8-avoid-client-only-seo-pitfalls)

---

## Performance Patterns (Core Web Vitals)

### 1. Render Less JavaScript (Biggest Win)

**Metric targeted: INP / TBT**

Every kilobyte of JavaScript shipped to the client must be parsed, compiled, and executed. Less JavaScript = faster interactions.

| Rule                                                                                  | Reasoning                                                                                                       |
| ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Prefer **Server Components** by default                                               | Server Components ship zero client-side JavaScript. HTML is rendered on the server and streamed to the browser. |
| Add `'use client'` only when you need state, effects, event handlers, or browser APIs | This is an opt-in, not a default. Only interactive parts need client JS.                                        |
| Split interactive widgets into small client components                                | Instead of making an entire page `'use client'`, extract only the interactive piece.                            |

**How to check**: Run `next build` and look at the "First Load JS" column. Pages with high JS are candidates for Server Component extraction.

```
Route (app)                    Size     First Load JS
─────────────────────────────────────────────────────
/                              5.2 kB   92 kB         ← Good
/dashboard                     45 kB    132 kB        ← Heavy — investigate
/settings                      8.1 kB   95 kB         ← Fine
```

**Common offenders** that should be extracted into small client components:

- Theme toggles → small `'use client'` button component
- Mobile menu toggle → small `'use client'` hamburger component
- Interactive forms → `'use client'` form component, keep page shell as server
- Like/bookmark buttons → small `'use client'` component
- Search input → `'use client'` component with debounce

### 2. Route-Level Code Splitting + Dynamic Import

**Metric targeted: INP / TBT (primary), LCP (secondary)**

Next.js App Router automatically code-splits per route segment. Additionally, use `dynamic()` for heavy below-the-fold components.

```tsx
import dynamic from 'next/dynamic';

// Heavy chart library — only load when this component mounts
const HeavyChart = dynamic(() => import('./HeavyChart'), {
  ssr: false, // Only if the library crashes during SSR (canvas, WebGL, etc.)
  loading: () => <div className="h-[400px] w-full animate-pulse rounded-lg bg-muted" />,
});
```

**When to use `dynamic()`:**

| Scenario                           |      Use `dynamic()`?      |       `ssr: false`?        |
| ---------------------------------- | :------------------------: | :------------------------: |
| Chart library (recharts, chart.js) |             ✅             | Usually no (they SSR fine) |
| Code editor (Monaco)               |             ✅             |   ✅ (requires `window`)   |
| Map (Leaflet, Mapbox)              |             ✅             |  ✅ (requires `document`)  |
| Rich text editor (Tiptap, Quill)   |             ✅             |     Check library docs     |
| Modal/drawer with heavy content    |             ✅             |             No             |
| Simple below-fold section          | ❌ (just use `<Suspense>`) |             —              |
| Header/navigation                  |   ❌ (critical for LCP)    |             —              |

**Key rule**: Use `ssr: false` only when the component genuinely requires browser APIs. If you're using it to fix hydration mismatches, fix the mismatch instead.

### 3. Optimize Images with `next/image`

**Metric targeted: LCP (primary), CLS (secondary)**

`next/image` provides automatic optimization: responsive sizing, modern formats (WebP/AVIF), lazy loading, and dimension-based layout reservation.

```tsx
import Image from 'next/image';

// Hero image — LCP candidate
<Image
  src="/hero.jpg"
  alt="Hero banner showing the developer workspace"
  width={1600}
  height={900}
  priority                    // Disables lazy loading + adds preload hint
  sizes="(max-width: 768px) 100vw, 1200px"  // Critical for correct size selection
  quality={85}                // Default is 75; 85 is a good balance
  className="object-cover"
/>

// Thumbnail in a grid — lazy loaded by default
<Image
  src="/product.jpg"
  alt="Product thumbnail"
  width={300}
  height={300}
  sizes="(max-width: 640px) 50vw, 300px"
  className="rounded-lg object-cover"
/>

// Fill mode — for containers where parent controls dimensions
<div className="relative aspect-video w-full">
  <Image
    src="/banner.jpg"
    alt="Banner"
    fill
    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
    className="object-cover"
  />
</div>
```

**`sizes` reference by use case:**

| Use Case                                     | `sizes` Value                      | Explanation                                |
| -------------------------------------------- | ---------------------------------- | ------------------------------------------ |
| Full-width hero                              | `100vw`                            | Image spans the full viewport              |
| Constrained hero (max 1200px)                | `(max-width: 768px) 100vw, 1200px` | Full width on mobile, max 1200px otherwise |
| 2-column grid on mobile, 4-column on desktop | `(max-width: 640px) 50vw, 25vw`    | Each card takes 50% or 25% of viewport     |
| Fixed-size avatar (40px)                     | `40px`                             | Always 40px regardless of viewport         |
| Fixed-size card image (300px)                | `300px`                            | Always 300px                               |

**Common mistakes:**

- Missing `sizes` on `fill` images → browser downloads the largest variant
- Missing `priority` on hero image → LCP delayed by lazy loading
- Missing `alt` text → accessibility violation, Lighthouse deduction
- Using `<img>` instead of `next/image` → no optimization, no responsive sizing

### 4. Fonts: Use `next/font` to Avoid Layout Shift

**Metric targeted: CLS (primary), LCP (secondary)**

`next/font` automatically optimizes font loading: self-hosts fonts, generates `size-adjust` to minimize CLS, and adds preload hints.

```tsx
// app/layout.tsx
import { Inter, JetBrains_Mono } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // Show fallback text immediately, swap when loaded
  variable: '--font-sans', // CSS variable for Tailwind integration
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
```

**Tailwind integration (v4):**

```css
/* globals.css */
@theme {
  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);
}
```

**`font-display` options:**

| Value      | Behavior                                                      | CLS Impact              | Use When                                       |
| ---------- | ------------------------------------------------------------- | ----------------------- | ---------------------------------------------- |
| `swap`     | Show fallback immediately, swap when loaded                   | Low (size-adjust helps) | Default choice — best UX                       |
| `optional` | Show fallback, load font but only use if loaded within ~100ms | Zero                    | When CLS is critical and font is not essential |
| `block`    | Show nothing for up to 3s, then fallback                      | None (but blank text)   | Rarely — bad UX                                |
| `fallback` | Short blank period (~100ms), then fallback, swap later        | Low                     | Good alternative to `swap`                     |

### 5. Cache + Revalidate Correctly (App Router)

**Metric targeted: TTFB / LCP**

For data that does not need to be real-time, use ISR (Incremental Static Regeneration) via `revalidate` to serve cached HTML with periodic updates.

```tsx
// Static page with periodic revalidation
export const revalidate = 3600; // Revalidate at most every 1 hour

export default async function Page() {
  const data = await fetch('https://api.example.com/products', {
    next: { revalidate: 3600 }, // Per-fetch revalidation
  });
  const products = await data.json();
  return <ProductList products={products} />;
}
```

**Caching decision table:**

| Data Type                   | Strategy                       | Config                                          |
| --------------------------- | ------------------------------ | ----------------------------------------------- |
| Marketing pages, blog posts | ISR with long revalidation     | `revalidate = 3600` (1 hour) or `86400` (1 day) |
| Product listings            | ISR with moderate revalidation | `revalidate = 300` (5 minutes)                  |
| User-specific dashboard     | Dynamic (no cache)             | `export const dynamic = 'force-dynamic'`        |
| Auth-required pages         | Dynamic                        | Uses cookies/headers → auto-dynamic             |
| Search results              | Dynamic                        | Depends on query params                         |
| API routes                  | Per-endpoint                   | `NextResponse` with `Cache-Control` header      |

**Important**: If a route reads cookies, headers, or uses `searchParams`, it's automatically dynamic. You don't need `force-dynamic` for auth pages.

### 6. Preload Critical Resources

**Metric targeted: LCP**

| Resource        | Preload Method                             | When                 |
| --------------- | ------------------------------------------ | -------------------- |
| Hero image      | `next/image` with `priority`               | Always for LCP image |
| Primary font    | `next/font` (automatic)                    | Always               |
| Critical CSS    | Automatic in Next.js (inline critical CSS) | Always               |
| Above-fold data | Server Component `await`                   | Always               |

**Avoid** preloading:

- Below-fold images (use lazy loading)
- Analytics scripts (use `afterInteractive`)
- Fonts not used above the fold (load on demand)
- Resources for other routes (let `<Link>` prefetch handle this)

### 7. Reduce Third-Party Cost

**Metric targeted: TBT / INP**

Every third-party widget adds JavaScript that blocks the main thread.

```tsx
import Script from 'next/script';

// Analytics — non-blocking
<Script src="https://analytics.example.com/script.js" strategy="afterInteractive" />

// Chat widget — load after everything else
<Script src="https://chat.example.com/widget.js" strategy="lazyOnload" />

// Marketing pixel — load in worker if possible
<Script src="https://pixel.example.com/tag.js" strategy="worker" />
```

**Third-party script loading strategy:**

| Script Type                    | Strategy                                       | Reasoning                                   |
| ------------------------------ | ---------------------------------------------- | ------------------------------------------- |
| Tag Manager (GTM)              | `beforeInteractive`                            | Must capture all events including page load |
| Analytics (GA4, Mixpanel)      | `afterInteractive`                             | Not needed for rendering                    |
| Chat widgets (Intercom, Drift) | `lazyOnload`                                   | Not needed until user wants help            |
| Marketing pixels               | `afterInteractive` or `lazyOnload`             | Never blocking                              |
| A/B testing (Optimizely)       | `beforeInteractive` (if needed) or server-side | Can cause CLS if loaded late                |
| Error tracking (Sentry)        | `afterInteractive`                             | Important but not render-blocking           |

### 8. Streaming + Suspense for Faster Perceived Load

**Metric targeted: LCP / FCP**

Stream server-rendered sections progressively so users see content before all data is ready.

```tsx
import { Suspense } from 'react';

export default async function DashboardPage() {
  return (
    <div>
      {/* This renders immediately — included in initial HTML */}
      <h1>Dashboard</h1>
      <QuickStats /> {/* Fast server query */}
      {/* This streams in when ready — shows skeleton first */}
      <Suspense fallback={<RecentActivitySkeleton />}>
        <RecentActivity /> {/* Slow server query */}
      </Suspense>
      <Suspense fallback={<ChartSkeleton />}>
        <AnalyticsChart /> {/* Even slower query */}
      </Suspense>
    </div>
  );
}
```

**How streaming works:**

1. Next.js sends the initial HTML shell immediately (including fast components)
2. Slow components show their `fallback` skeleton
3. As each `<Suspense>` boundary resolves on the server, the HTML is streamed to the client
4. React replaces the fallback with the real content — no client-side fetch needed

**Rules for Suspense boundaries:**

- Each boundary should represent a meaningful loading state (not too granular)
- Fallbacks should match the expected dimensions to prevent CLS
- Don't wrap everything in Suspense — only slow or non-critical sections
- Keep the LCP content outside Suspense boundaries (it should render immediately)

### 9. Avoid Waterfall Fetches

**Metric targeted: TTFB / LCP**

When fetching multiple independent data sources in a server component, fetch in parallel:

```tsx
// BAD — sequential fetches (waterfall)
export default async function Page() {
  const products = await fetchProducts(); // 200ms
  const categories = await fetchCategories(); // 150ms
  const banners = await fetchBanners(); // 100ms
  // Total: 450ms

  return <PageContent products={products} categories={categories} banners={banners} />;
}

// GOOD — parallel fetches
export default async function Page() {
  const [products, categories, banners] = await Promise.all([
    fetchProducts(), // 200ms
    fetchCategories(), // 150ms (runs simultaneously)
    fetchBanners(), // 100ms (runs simultaneously)
  ]);
  // Total: 200ms (slowest fetch wins)

  return <PageContent products={products} categories={categories} banners={banners} />;
}
```

**When to use `Promise.all` vs `<Suspense>`:**

| Pattern                 | Use When                                                                       |
| ----------------------- | ------------------------------------------------------------------------------ |
| `Promise.all`           | All data is needed before rendering the page, and none is significantly slower |
| `<Suspense>` boundaries | Some data is fast (show immediately) and some is slow (stream in later)        |
| Combination             | Fast data with `Promise.all`, slow data in `<Suspense>`                        |

### 10. Bundle Hygiene

**Metric targeted: TBT / INP**

| Action                         | Tool                         | Frequency                                           |
| ------------------------------ | ---------------------------- | --------------------------------------------------- |
| Analyze bundle composition     | `@next/bundle-analyzer`      | Every major release or when adding new dependencies |
| Find unused exports            | `npx knip` or `npx depcheck` | Monthly or in CI                                    |
| Check individual package sizes | `bundlephobia.com`           | Before installing new dependencies                  |
| Replace heavy libraries        | Manual review                | When bundle analyzer shows bloat                    |

**Common replacements:**

| Heavy Library         | Lighter Alternative                            | Size Savings             |
| --------------------- | ---------------------------------------------- | ------------------------ |
| `moment.js` (300KB)   | `date-fns` (tree-shakeable, ~5KB per function) | ~280KB                   |
| `lodash` (full, 70KB) | `lodash-es` (tree-shakeable) or native JS      | ~50KB+                   |
| `axios` (14KB)        | `fetch` (built-in)                             | ~14KB                    |
| `classnames` (1KB)    | `clsx` (0.5KB)                                 | Minimal, but cleaner API |
| `uuid` (4KB)          | `crypto.randomUUID()` (built-in)               | ~4KB                     |

---

## SEO Patterns (High Impact)

### 1. Use Metadata Properly (App Router)

Add unique `title` and `description` per route. This is the single most important SEO action.

```tsx
// Static metadata
export const metadata: Metadata = {
  title: 'Pricing | MyApp',
  description: 'Simple, transparent pricing for teams of all sizes. Start free, scale as you grow.',
};
```

**Root layout title template (recommended):**

```tsx
// app/layout.tsx
export const metadata: Metadata = {
  title: {
    default: 'MyApp — Build Faster', // Fallback for pages without title
    template: '%s | MyApp', // Pattern for child pages
  },
  description: 'The modern developer platform for building web applications.',
  metadataBase: new URL('https://myapp.com'), // Base URL for OG images, canonical
};
```

With this template, a child page setting `title: 'Pricing'` produces `<title>Pricing | MyApp</title>`.

### 2. Use Dynamic Metadata per Slug (Blog/Product)

```tsx
// app/blog/[slug]/page.tsx
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    return { title: 'Post Not Found' };
  }

  return {
    title: post.title, // Uses template: "Post Title | MyApp"
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.publishedAt,
      authors: [post.author.name],
      images: [
        {
          url: post.ogImage, // Resolved against metadataBase
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: [post.ogImage],
    },
  };
}
```

**Open Graph image best practices:**

- Size: **1200×630px** (standard OG image size)
- Format: JPG or PNG (not WebP — some social platforms don't support it)
- Include the page title and branding in the image
- Test with: Facebook Sharing Debugger, Twitter Card Validator, LinkedIn Post Inspector

### 2a. Social Sharing (Open Graph / Twitter) — required when a page is publicly shareable

Any page that can be **shared on social media or indexed by search** (landing, marketing, legal, public content) must produce a complete preview card. Internal/authenticated tools (admin dashboards, account/settings pages) do not need this.

**Three coupled requirements — they only work together:**

1. **`metadataBase` (root layout, once).** Without it, relative `openGraph`/`twitter` image paths resolve to `http://localhost:3000` and break for every external crawler in production. Drive it from env with a production fallback:

   ```tsx
   // app/layout.tsx
   metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://example.com'),
   ```

2. **`openGraph` + `twitter` blocks.** Put the canonical site defaults in the root layout so public pages inherit them; override per page where the copy differs. Always include a 1200×630 image.

   ```tsx
   openGraph: {
     type: 'website',
     siteName: 'MyApp',
     url: siteUrl,
     title: 'MyApp',
     description: siteDescription,
     images: [{ url: '/images/og-image.png', width: 1200, height: 630, alt: 'MyApp' }],
   },
   twitter: {
     card: 'summary_large_image',
     title: 'MyApp',
     description: siteDescription,
     images: ['/images/og-image.png'],
   },
   ```

3. **A real 1200×630 image.** Either a static `public/images/og-image.png`, or generate it in code with `app/opengraph-image.tsx` using `next/og` `ImageResponse` (no design tool needed). PNG or JPG, never WebP — some platforms can't read it.

**Description must match the page's audience.** Don't let an admin/control-panel `description` leak onto a public share through inheritance — set product-facing copy on the public route (or on the root layout if the public site is the canonical surface).

**Favicon / icon hygiene.** Never wire a multi-MB logo as the favicon or OG image. Use small file-based `app/icon.png` (~256px) and `app/apple-icon.png` (180px); Next.js emits the `<link>` tags automatically — no manual `icons` block pointing at a heavy asset.

**Common failure modes (all silent — nothing errors):**

| Symptom                                       | Cause                                                                          |
| --------------------------------------------- | ------------------------------------------------------------------------------ |
| No image/description in any share             | No `openGraph`/`twitter` declared at all                                        |
| Image works locally, breaks in production     | `metadataBase` unset → `localhost` image URL                                    |
| Public page not indexed / preview suppressed  | `robots: noindex` placed on the **root** layout instead of private segments    |
| Cramped or cropped thumbnail                  | Square logo reused instead of a purpose-built 1200×630 card                     |
| Wrong / admin-flavored description on a share  | Inherited a private `description`; not overridden on the public route          |

**Verify after deploy.** Social platforms cache scrapes, so old/empty results persist until re-scraped. Confirm with the [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/), [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/), and [X Card Validator](https://cards-dev.twitter.com/validator) — use "Scrape Again" to bust the cache.

### 3. Canonical URLs + `noindex` Rules

```tsx
// Pages that should be indexed (default — most pages)
export const metadata: Metadata = {
  alternates: {
    canonical: '/pricing', // Resolved against metadataBase
  },
};

// Pages that should NOT be indexed
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};
```

**Pages to mark as `noindex`:**

| Page Type                      | Reason                                       |
| ------------------------------ | -------------------------------------------- |
| Admin/dashboard pages          | Not useful for search engines                |
| Internal search results        | Duplicate thin content                       |
| Account/settings pages         | Private user content                         |
| Preview/draft pages            | Incomplete content                           |
| Paginated list pages (page 2+) | Optional — use `canonical` to page 1 instead |

**Scope `noindex` to the segment that owns the private area — never the root `app/layout.tsx`.** A root-level `noindex` blankets every public page (landing, legal) too, silently de-indexing them and risking suppressed link previews. Put `robots: { index: false, follow: false, nocache: true }` on the private **segment** layouts (e.g. `app/admin/layout.tsx`, `app/login/layout.tsx`, the super-admin layout) and leave public/marketing/legal routes indexable by default.

### 4. Structured Data (JSON-LD)

Structured data helps search engines understand your content and can enable rich results (star ratings, FAQs, breadcrumbs, etc.).

```tsx
// app/blog/[slug]/page.tsx
export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    image: post.ogImage,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: {
      '@type': 'Person',
      name: post.author.name,
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article>
        <h1>{post.title}</h1>
        {/* ... */}
      </article>
    </>
  );
}
```

**Common schema types:**

| Page Type    | Schema                                    | Rich Result                        |
| ------------ | ----------------------------------------- | ---------------------------------- |
| Blog post    | `Article`                                 | Article snippet with author/date   |
| Product      | `Product` with `AggregateRating`, `Offer` | Star ratings, price, availability  |
| FAQ page     | `FAQPage`                                 | Expandable FAQ in search results   |
| Breadcrumbs  | `BreadcrumbList`                          | Breadcrumb trail in search results |
| Organization | `Organization`                            | Knowledge panel, logo              |
| How-to guide | `HowTo`                                   | Step-by-step snippet               |

**Validate**: Use [Google Rich Results Test](https://search.google.com/test/rich-results) and [Schema.org Validator](https://validator.schema.org/).

### 5. `sitemap.xml` + `robots.txt`

```tsx
// app/sitemap.ts
import type { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllPosts();

  const postEntries = posts.map((post) => ({
    url: `https://myapp.com/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [{ url: 'https://myapp.com', lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 }, { url: 'https://myapp.com/pricing', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 }, { url: 'https://myapp.com/about', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 }, ...postEntries];
}
```

```tsx
// app/robots.ts
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/dashboard/', '/settings/', '/account/'],
      },
    ],
    sitemap: 'https://myapp.com/sitemap.xml',
  };
}
```

### 5b. Sitemap & Robots

Ship `app/sitemap.ts` and `app/robots.ts` as the **single source of truth** for crawlability. Keep them aligned with the real route structure — when a public page is added or removed, update `sitemap.ts` in the same change.

**Base URL.** Derive the origin from the same env value used for `metadataBase`; don't hardcode the domain in more than one place:

```ts
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? '<production-origin>';
```

It resolves correctly in production only if the env var is set in the deploy environment; otherwise it falls back to the literal default.

**`sitemap.ts` lists only public, indexable routes.** Exclude:

- Private/authenticated areas — they are `noindex` and disallowed.
- Thin utility pages that must stay reachable but aren't worth indexing (e.g. an account-deletion form required by app-store policy).
- Routes pulled from the public surface.
- Empty route dirs with no `page.tsx`.

Set a sensible `priority` and `changeFrequency` per entry (higher priority for the landing page, lower/yearly for rarely-changing legal pages).

**`robots.ts`** allows `/`, disallows the private/authenticated segments, and references the sitemap:

```ts
import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? '<production-origin>';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // authenticated/private segments
      disallow: ['/admin/', '/login'],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
```

**`robots.txt` disallow ≠ de-indexing.** A disallowed URL can still be indexed if linked elsewhere. The real protection is `robots: { index: false, follow: false, nocache: true }` on the **private segment layouts** — treat `robots.txt` as crawl-budget hygiene layered on top of that, and keep both.

### 6. Semantic HTML + Heading Structure

| Rule                       | Implementation                                                                                                                                                                                               |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| One `<h1>` per page        | The page title. Should match or relate to `<title>`.                                                                                                                                                         |
| Logical heading hierarchy  | `<h1>` → `<h2>` → `<h3>`. Never skip levels (no `<h1>` → `<h3>`).                                                                                                                                            |
| Use semantic elements      | `<main>` for primary content, `<article>` for standalone content, `<nav>` for navigation, `<aside>` for sidebars, `<section>` for thematic groups, `<header>` / `<footer>` for page/section headers/footers. |
| Use `<a>` for navigation   | Not `<div onClick>` or `<button>` for page links. Crawlers follow `<a href>`.                                                                                                                                |
| Use `<button>` for actions | Not `<div onClick>` or `<a href="#">`. Screen readers and keyboard users depend on semantic elements.                                                                                                        |

### 7. Internal Linking + Crawlability

| Practice                                               | Why                                                                 |
| ------------------------------------------------------ | ------------------------------------------------------------------- |
| Link related content (blog → blog, product → category) | Helps search engines discover and understand content relationships  |
| Include key pages in navigation and footer             | Ensures no pages are orphaned (unreachable from the sitemap or nav) |
| Use descriptive link text                              | "Read the performance guide" not "Click here"                       |
| Use `next/link` for all internal links                 | Client-side navigation + automatic prefetching                      |
| Avoid `nofollow` on internal links                     | Let search engines crawl your own content freely                    |

### 8. Avoid Client-Only SEO Pitfalls

| Pitfall                                                  | Problem                                                               | Fix                                                   |
| -------------------------------------------------------- | --------------------------------------------------------------------- | ----------------------------------------------------- |
| Core page text rendered only by client JS                | Search engine bots may not execute JS, or JS errors prevent rendering | Keep primary content server-rendered                  |
| Meta tags set by client-side JS                          | Crawlers may not see dynamically set metadata                         | Use App Router `metadata` / `generateMetadata`        |
| Content behind authentication with no public alternative | Search engines can't access it                                        | Provide public summary/preview pages                  |
| Infinite scroll without URL changes                      | Crawlers can't paginate through content                               | Use URL-based pagination with `<a>` links             |
| JavaScript redirects                                     | Crawlers may not follow `window.location` redirects                   | Use `next/navigation` `redirect()` or `middleware.ts` |

---

## Quick Reference: Metric → Fix Mapping

| If This Metric Is Bad... | Check These First                                                                                    |
| ------------------------ | ---------------------------------------------------------------------------------------------------- |
| **LCP > 2.5s**           | Hero image optimization, `priority` flag, render-blocking JS, TTFB, Server Component for LCP content |
| **TBT > 200ms**          | Bundle size, heavy client components, unused dependencies, `'use client'` scope                      |
| **CLS > 0.1**            | Image dimensions, font loading, injected content, hydration stability                                |
| **FCP > 1.8s**           | TTFB, render-blocking CSS, font preloading, streaming with Suspense                                  |
| **TTFB > 800ms**         | Server response time, ISR caching, CDN, database query speed                                         |
| **SEO < 90**             | Missing metadata, heading hierarchy, missing alt text, no sitemap, broken links                      |

---

## Rendering Strategy Selection

Choose the strategy furthest left that meets your data freshness requirements.

```
SSG ──────── ISR ──────── SSR ──────── CSR
(build time)  (periodic)   (per request)  (browser only)
```

### Decision Flowchart

```
Does the page need SEO indexing?
├── No → CSR ('use client' + next/dynamic({ ssr: false }))
└── Yes
    └── Does the data change per request or per user?
        ├── Yes → SSR (force-dynamic or cookies/headers/searchParams)
        └── No
            └── Does the data change periodically (hours/days)?
                ├── Yes → ISR (generateStaticParams + revalidate: N)
                └── No → SSG (generateStaticParams, no revalidate)
```

### Strategy Quick Reference

| Strategy | When to Use | Config |
| --- | --- | --- |
| **SSG** | Docs, blog posts, marketing pages — content rarely changes | `generateStaticParams` + no `revalidate` |
| **ISR** | Product pages, content updated hourly/daily | `generateStaticParams` + `revalidate: N` |
| **SSR** | Dashboards, user profiles, search results — fresh per request | `export const dynamic = 'force-dynamic'` |
| **CSR** | Admin panels, authenticated dashboards, live editors — no SEO | `'use client'` + `next/dynamic({ ssr: false })` |

---

## Related References

- `references/core-web-vitals.md` — metric-by-metric patterns behind these rules
- `references/code-splitting.md` — implementation detail for deferring heavy client code
- `references/date-handling.md` — hydration-safe date rendering
- `references/error-boundaries.md` — route-level `error.tsx` / `global-error.tsx`
