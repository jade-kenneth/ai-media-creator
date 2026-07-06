# GA4 + GTM Setup Guide

## Analytics Standards

Use a centralized analytics approach.

- Use GTM as the primary tag management layer.
- Use GA4 as the analytics destination where applicable.
- Load analytics with non-blocking strategies such as `afterInteractive`.
- Do not scatter inline `window.dataLayer.push` calls across the codebase — use a centralized analytics utility instead.
- Guard analytics code for browser-only execution.
- Respect consent requirements where applicable.

---

This document covers the Google Analytics 4 (GA4) and Google Tag Manager (GTM) integration patterns used in this monorepo's Next.js apps. It serves as both a reference for the current implementation and a reusable guide for future apps.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [What Was Added](#what-was-added)
3. [GTM vs GA4 — When You Need Both](#gtm-vs-ga4--when-you-need-both)
4. [Implementation Details](#implementation-details)
5. [GTM Utility Module](#gtm-utility-module)
6. [Script Loading Strategy and Performance](#script-loading-strategy-and-performance)
7. [SPA Route Change Tracking](#spa-route-change-tracking)
8. [Common Events Reference](#common-events-reference)
9. [Environment Configuration](#environment-configuration)
10. [Debugging and Verification](#debugging-and-verification)
11. [Privacy and Consent](#privacy-and-consent)
12. [Common Pitfalls](#common-pitfalls)

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│  Next.js App (Root Layout)                               │
│                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐ │
│  │ GTM <head>  │  │ GTM <body>  │  │ GA4 gtag.js      │ │
│  │ Script      │  │ <noscript>  │  │ afterInteractive  │ │
│  │ before-     │  │ fallback    │  │                    │ │
│  │ Interactive │  │             │  │                    │ │
│  └──────┬──────┘  └─────────────┘  └────────┬──────────┘ │
│         │                                     │           │
│         ▼                                     ▼           │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  window.dataLayer                                    │ │
│  │  (shared data bus for GTM and GA4)                   │ │
│  └──────────────────────┬───────────────────────────────┘ │
│                         │                                 │
│  ┌──────────────────────▼───────────────────────────────┐ │
│  │  libs/utils/gtm.ts                                   │ │
│  │  Centralized tracking utility                        │ │
│  │  • gtmPageView()  • gtmEvent()  • gtmPurchaseEvent() │ │
│  │  • Cross-platform: Web (dataLayer) + Native (Firebase)│ │
│  └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

---

## What Was Added

### 1. GTM Script in `<head>` (as high as possible)

- Placed in the root layout using `next/script` with `strategy="beforeInteractive"`
- Container ID: `GTM-TPVR9TRQ`
- **Why `beforeInteractive`**: GTM must load early to capture all dataLayer events, including those fired during page load. This strategy injects the script before Next.js hydration.
- **Performance impact**: ~20–50ms additional blocking time. Acceptable for GTM because it manages all tag firing. See [Script Loading Strategy](#script-loading-strategy-and-performance) for alternatives.

### 2. GTM `<noscript>` Fallback Right After `<body>`

- Inserted immediately after the opening `<body>` tag
- Uses the same GTM container ID: `GTM-TPVR9TRQ`
- **Purpose**: Provides basic tracking for users/bots with JavaScript disabled. The iframe sends a page hit to GTM.

### 3. GA4 gtag.js Initialization

- Loads the GA4 script with `strategy="afterInteractive"`
- Initializes `dataLayer` and calls `gtag('config', ...)`
- Measurement ID: `G-N7BZ4QRB31`
- **Why `afterInteractive`**: GA4's gtag.js is not required for page rendering. Loading after hydration avoids blocking the initial paint.

### Files Touched

- `apps/ecommerce-app/src/app/layout.tsx` — script tags and noscript fallback

---

## GTM vs GA4 — When You Need Both

| Scenario                                                 | Use GTM Only | Use GA4 Only | Use Both |
| -------------------------------------------------------- | ------------ | ------------ | -------- |
| Simple page view + event tracking                        |              | ✅           |          |
| Marketing team manages tags (Ads, Pixels, Hotjar)        | ✅           |              |          |
| Complex tag rules (conditions, triggers, sequencing)     | ✅           |              |          |
| GA4 + other vendor tags (Facebook Pixel, LinkedIn, etc.) |              |              | ✅       |
| E-commerce tracking with custom event parameters         |              |              | ✅       |
| Need to deploy tracking changes without code deploys     | ✅           |              |          |

**Current setup**: Uses both because the e-commerce app needs GA4 for analytics plus GTM for managing additional marketing/advertising tags without code changes.

**Rule**: Avoid loading both GTM and standalone GA4 gtag.js if GTM already fires GA4. This causes duplicate events. In the current setup, GTM handles vendor tags while gtag.js handles direct GA4 configuration. Verify in GTM that GA4 is not also fired as a GTM tag — this would double-count.

---

## Implementation Details

### GTM `<head>` Script

```tsx
<Script id="gtm-base" strategy="beforeInteractive">
  {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-TPVR9TRQ');`}
</Script>
```

**What this does**: Creates the `dataLayer` array, pushes a `gtm.start` event with the current timestamp, then asynchronously loads the GTM container script. The container script processes all queued `dataLayer` events and sets up trigger listeners.

### GTM `<noscript>` After `<body>`

```tsx
<noscript>
  <iframe src="https://www.googletagmanager.com/ns.html?id=GTM-TPVR9TRQ" height="0" width="0" style={{ display: 'none', visibility: 'hidden' }} />
</noscript>
```

**What this does**: For JavaScript-disabled environments, GTM loads via a hidden iframe that sends basic page tracking data. The iframe has zero dimensions and is invisible.

### GA4 gtag.js Setup

```tsx
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? 'G-N7BZ4QRB31';

<Script
  src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
  strategy="afterInteractive"
/>
<Script id="gtag-init" strategy="afterInteractive">
  {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}');`}
</Script>
```

**What this does**: Loads the gtag.js library, defines the global `gtag()` function that pushes events to `dataLayer`, sets the initialization timestamp, and configures the GA4 property with the measurement ID.

### Encapsulate the tag in one component (GA4-only apps)

When GA4 gtag.js is the only tag (no GTM), do **not** inline the `<Script>` blocks in the root layout. Wrap them in a single dedicated component and render it once from the layout, so the layout stays thin and every guard lives in one place. The component owns three rules:

- Read the measurement ID from an env var — never hardcode or scatter the raw ID.
- Return `null` unless `NODE_ENV === 'production'` **and** the ID is set, so local dev and unconfigured environments load nothing.
- Load both the `gtag.js` `<Script src>` and the `gtag('config', …)` init `<Script>` with `strategy="afterInteractive"`.

```tsx
// components/analytics/google-analytics.tsx
import Script from 'next/script';

const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export function GoogleAnalytics() {
  if (process.env.NODE_ENV !== 'production' || !measurementId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${measurementId}');`}
      </Script>
    </>
  );
}
```

Render it once in the root layout — `<GoogleAnalytics />` just before `</body>`. Because the component self-gates, the layout needs no conditional wrapper of its own.

---

## GTM Utility Module

The `libs/utils/gtm.ts` module centralizes analytics tracking so the same event calls work on both web (GTM/GA4 via `dataLayer`) and native (Capacitor via Firebase Analytics).

### Available Functions

| Function                   | Purpose                       | Parameters                                                 |
| -------------------------- | ----------------------------- | ---------------------------------------------------------- |
| `gtmPageView(params?)`     | Track page views              | Optional: `page_title`, `page_location`, `page_path`       |
| `gtmEvent(event, params?)` | Track custom events           | Event name + optional event parameters                     |
| `gtmPurchaseEvent(params)` | Track GA4 e-commerce purchase | Full purchase payload (transaction_id, value, items, etc.) |

### `gtmPageView(params?)`

Pushes a `page_view` event with:

- Page details (title, location, path)
- Device type detection
- Firebase Analytics screen tracking (on native)

```ts
// Usage
gtmPageView(); // Auto-detects page info
gtmPageView({ page_title: 'Product Detail', page_path: '/product/abc' });
```

### `gtmEvent(event, params?)`

Pushes simple named events to the dataLayer:

```ts
// Usage
gtmEvent('add_to_cart', { item_id: 'SKU123', value: 29.99, currency: 'USD' });
gtmEvent('begin_checkout');
gtmEvent('view_item', { item_id: 'SKU456', item_name: 'React Guide' });
```

Supported event names (GA4 recommended events):

- `add_to_cart`, `remove_from_cart`
- `view_item`, `view_item_list`
- `begin_checkout`, `add_payment_info`, `add_shipping_info`
- `purchase`, `refund`
- `sign_up`, `login`
- `search`
- Custom events (any string)

### `gtmPurchaseEvent(params)`

Pushes a GA4-compliant e-commerce purchase event:

```ts
// Usage
gtmPurchaseEvent({
  transaction_id: 'TXN-12345',
  value: 99.99,
  currency: 'PHP',
  tax: 10.71,
  shipping: 5.0,
  items: [{ item_id: 'SKU123', item_name: 'Product A', price: 49.99, quantity: 2 }],
});
```

**Important**: The function clears prior `ecommerce` data before pushing to prevent stale data contamination:

```ts
window.dataLayer.push({ ecommerce: null }); // Clear previous ecommerce data
window.dataLayer.push({ event: 'purchase', ecommerce: { ...params } });
```

### Cross-Platform (Capacitor / Firebase)

On native platforms (Capacitor), the utility mirrors events to Firebase Analytics:

```ts
// Inside gtmPageView — also fires on native
FirebaseAnalytics.setCurrentScreen({ screenName: pagePath });
FirebaseAnalytics.logEvent({ name: 'page_view', params: { ... } });
```

---

## Script Loading Strategy and Performance

### `next/script` Strategies

| Strategy                | When Script Loads                   | Performance Impact            | Use For                                    |
| ----------------------- | ----------------------------------- | ----------------------------- | ------------------------------------------ |
| `beforeInteractive`     | Before Next.js hydration (blocking) | **High** — delays first paint | GTM (needs to capture all events)          |
| `afterInteractive`      | After hydration completes           | **Low** — non-blocking        | GA4 gtag.js, analytics, non-critical       |
| `lazyOnload`            | After page is fully loaded + idle   | **Minimal** — loads last      | Chat widgets, feedback tools, low-priority |
| `worker` (experimental) | Offloaded to web worker             | **None** on main thread       | Non-DOM scripts (analytics processing)     |

### Performance Recommendations

1. **If using GTM as the only tag manager**: Load GTM with `beforeInteractive`, do NOT also load GA4 gtag.js separately (configure GA4 as a tag within GTM). This eliminates one script load.

2. **If GA4 is the only analytics tool**: Use `afterInteractive` for gtag.js. No need for GTM at all.

3. **If using both**: Current setup is acceptable. GTM at `beforeInteractive`, GA4 at `afterInteractive`. But verify no duplicate GA4 firing.

4. **Lighthouse impact**: Third-party scripts (GTM, GA4, ads) typically add 100–300ms to TBT. Measure with and without to understand the cost. Consider `lazyOnload` for non-essential vendor scripts.

---

## SPA Route Change Tracking

Next.js App Router uses client-side navigation for internal links. By default, GA4 with `gtag('config', ...)` tracks the initial page load but NOT subsequent client-side navigations.

### Solution: Route Change Handler

```tsx
// filepath: shared/hooks/usePageTracking.ts
'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export function usePageTracking() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!window.gtag) return;

    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');

    window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!, {
      page_path: url,
    });
  }, [pathname, searchParams]);
}
```

```tsx
// filepath: app/layout.tsx (or a layout-level client component)
'use client';

import { usePageTracking } from '@/shared/hooks/usePageTracking';

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  usePageTracking();
  return <>{children}</>;
}
```

**Important**: Wrap `useSearchParams()` in a `<Suspense>` boundary in Next.js App Router to prevent hydration bailout warnings.

---

## Common Events Reference

### GA4 Recommended Events (E-commerce)

| Event               | When to Fire                 | Key Parameters                                                      |
| ------------------- | ---------------------------- | ------------------------------------------------------------------- |
| `view_item`         | Product detail page view     | `currency`, `value`, `items[]`                                      |
| `view_item_list`    | Category/search results page | `item_list_id`, `item_list_name`, `items[]`                         |
| `add_to_cart`       | Item added to cart           | `currency`, `value`, `items[]`                                      |
| `remove_from_cart`  | Item removed from cart       | `currency`, `value`, `items[]`                                      |
| `begin_checkout`    | Checkout flow started        | `currency`, `value`, `items[]`, `coupon`                            |
| `add_payment_info`  | Payment method selected      | `currency`, `value`, `payment_type`                                 |
| `add_shipping_info` | Shipping info entered        | `currency`, `value`, `shipping_tier`                                |
| `purchase`          | Order completed              | `transaction_id`, `value`, `currency`, `tax`, `shipping`, `items[]` |

### GA4 Recommended Events (Engagement)

| Event     | When to Fire     | Key Parameters                      |
| --------- | ---------------- | ----------------------------------- |
| `login`   | User logs in     | `method` (google, email, etc.)      |
| `sign_up` | User registers   | `method`                            |
| `search`  | Search performed | `search_term`                       |
| `share`   | Content shared   | `method`, `content_type`, `item_id` |

### Items Array Structure

```ts
interface GA4Item {
  item_id: string; // SKU or product ID
  item_name: string; // Product name
  item_brand?: string; // Brand name
  item_category?: string; // Primary category
  item_variant?: string; // Color, size, etc.
  price?: number; // Unit price
  quantity?: number; // Number of units
  discount?: number; // Discount amount per unit
  index?: number; // Position in list
}
```

---

## Environment Configuration

### Required Environment Variables

```env
# .env.local
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX    # GA4 Measurement ID
NEXT_PUBLIC_GTM_CONTAINER_ID=GTM-XXXXXXX      # GTM Container ID
```

### Conditional Loading (Recommended)

Only load tracking scripts in production (or when explicitly enabled):

```tsx
// app/layout.tsx
const isProduction = process.env.NODE_ENV === 'production';
const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const GTM_ID = process.env.NEXT_PUBLIC_GTM_CONTAINER_ID;

// Only render scripts when IDs are configured
{
  isProduction && GTM_ID && (
    <Script id="gtm-base" strategy="beforeInteractive">
      {`...GTM snippet with ${GTM_ID}...`}
    </Script>
  );
}

{
  isProduction && GA_ID && (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="gtag-init" strategy="afterInteractive">
        {`...gtag config with ${GA_ID}...`}
      </Script>
    </>
  );
}
```

This prevents analytics scripts from loading during local development, which:

- Avoids polluting analytics data with dev traffic
- Speeds up local page loads
- Eliminates console errors when measurement IDs are not configured

---

## Debugging and Verification

### Browser Tools

| Tool                                 | Purpose                                   | How to Access                                               |
| ------------------------------------ | ----------------------------------------- | ----------------------------------------------------------- |
| **GTM Preview Mode**                 | Test GTM tags/triggers without publishing | GTM Dashboard → Preview button → enter site URL             |
| **GA4 DebugView**                    | Real-time event stream with parameters    | GA4 Dashboard → Admin → DebugView (enable Chrome extension) |
| **GA4 Realtime Report**              | Verify events arriving in GA4             | GA4 Dashboard → Reports → Realtime                          |
| **Chrome DevTools → Console**        | Check `dataLayer` contents                | Type `dataLayer` in console to inspect all pushed events    |
| **Chrome DevTools → Network**        | Verify script loading and requests        | Filter by `google` or `gtm` to see all analytics requests   |
| **Tag Assistant (Chrome extension)** | Validate GTM and GA4 implementation       | Install from Chrome Web Store, activate on your site        |

### Quick Console Checks

```js
// Check if dataLayer exists and see all events
console.log(window.dataLayer);

// Check if gtag is available
console.log(typeof window.gtag); // should be 'function'

// Manually push a test event
window.dataLayer.push({ event: 'test_event', test_param: 'hello' });
```

---

## Privacy and Consent

### Cookie Consent Integration

If your app requires cookie consent (GDPR, CCPA), delay analytics until consent is granted:

```ts
// Before consent: load GTM but in restricted mode
gtag('consent', 'default', {
  analytics_storage: 'denied',
  ad_storage: 'denied',
});

// After user grants consent
gtag('consent', 'update', {
  analytics_storage: 'granted',
  ad_storage: 'granted',
});
```

GTM can also be configured to respect consent signals via its built-in consent mode.

### Third-Party CMP Auto-Blocking

An alternative to wiring consent signals by hand is a Consent Management Platform (CMP) that ships an **auto-blocking** script (e.g. consentmanager.net's `data-cmp-ab="1"` variant). It renders the banner and automatically blocks known tracking scripts until the visitor consents — no per-tag `gtag('consent', …)` calls needed.

For it to block anything, it must **run before every tracking script**:

- Load it with `next/script` `strategy="beforeInteractive"` — Next.js documents cookie-consent managers as the canonical `beforeInteractive` use case. This guarantees it initializes before an `afterInteractive` analytics tag regardless of DOM order, so DOM position between the two doesn't matter (though rendering the CMP first in the layout keeps intent obvious).
- Wrap it in a dedicated component (mirrors the analytics component), and pass the vendor's `data-*` attributes straight through as props on `<Script>`.
- Gate it with the same production guard as analytics, so no banner/blocking runs in local dev.

```tsx
// components/analytics/consent-manager.tsx
import Script from 'next/script';

export function ConsentManager() {
  if (process.env.NODE_ENV !== 'production') return null;

  return (
    // App Router supports `beforeInteractive` from the root layout, and a CMP
    // auto-blocker must run before any tracking script — this legacy
    // pages-router lint rule is a false positive here.
    // eslint-disable-next-line @next/next/no-before-interactive-script-outside-document
    <Script
      id="cmp-autoblocking"
      strategy="beforeInteractive"
      src="https://cdn.<vendor>/autoblocking/<config-id>.js"
      data-cmp-ab="1"
      /* …remaining vendor data-* attributes… */
    />
  );
}
```

**Expect the lint warning**: `@next/next/no-before-interactive-script-outside-document` fires because the rule predates the App Router (it only whitelists `pages/_document.js`). `beforeInteractive` in the root layout is valid in the App Router — suppress the rule with an explanatory comment rather than downgrading to `afterInteractive`, which would let tracking scripts slip past the blocker.

---

## Common Pitfalls

| Pitfall                                             | Problem                                                                        | Fix                                                                                         |
| --------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| Loading GA4 both via GTM tag AND standalone gtag.js | Double-counted page views and events                                           | Choose one: GTM-managed GA4 tag OR standalone gtag.js                                       |
| Hardcoded measurement IDs in source code            | IDs leak to public repos, can't change per environment                         | Use `NEXT_PUBLIC_*` environment variables                                                   |
| Loading GTM in development                          | Pollutes analytics with dev traffic, slows dev server                          | Conditionally load only in production                                                       |
| Missing SPA route tracking                          | Only initial page load is tracked, navigation events are lost                  | Add route change handler (see above)                                                        |
| Not clearing ecommerce before purchase push         | Stale item data from previous interactions contaminates purchase               | Always push `{ ecommerce: null }` before ecommerce events                                   |
| Using `beforeInteractive` for everything            | All scripts block rendering, hurting LCP and TBT                               | Only GTM needs `beforeInteractive`; everything else uses `afterInteractive` or `lazyOnload` |
| Not guarding `window.gtag` / `window.dataLayer`     | Crashes during SSR or when scripts haven't loaded                              | Always check existence: `if (typeof window !== 'undefined' && window.gtag) { ... }`         |
| Tracking PII in events                              | Sending emails, names, or other personal data to GA4 violates privacy policies | Only send anonymized/aggregated data; use user IDs, not personal info                       |

---

## Latest Implementation Reference

**Commit**: `10aa9a4bff69760136ac24be7d23d32af804e33b`
**Subject**: `feat: implement Google Tag Manager utility and integrate event tracking in Cards component`
**Date**: `2026-02-11 20:50:15 +0800`

**Files changed:**

- `libs/global.d.ts` — TypeScript declarations for `window.dataLayer` and `window.gtag`
- `libs/ui/components/Cards.tsx` — Event tracking integration in product cards
- `libs/utils/gtm.ts` — Centralized GTM/GA4 utility module
- `libs/utils/index.ts` — Barrel export update

---

## Related References

- `references/core-web-vitals.md` — third-party script cost; keep analytics off the critical rendering path
- `references/nextjs-performance-seo.md` — Next.js script loading strategy
- `references/security.md` — § 10 third-party services; consent and data handling
