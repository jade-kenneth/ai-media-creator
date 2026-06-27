# Security Layer — Rate Limiting, CORS, Headers & Throttle Guard

> **Project:** Organization Connect API (`org-system-api`)
> **Stack:** NestJS · Express · @nestjs/throttler · Zod

---

## Table of Contents

1. [Overview](#1-overview)
2. [Security Architecture Diagram](#2-security-architecture-diagram)
3. [Rate Limiting (Throttle Guard)](#3-rate-limiting-throttle-guard)
   - [How It Works](#31-how-it-works)
   - [AppThrottlerGuard — The GraphQL Override](#32-appthrottlerguard--the-graphql-override)
   - [Skip Logic](#33-skip-logic)
   - [Configuration](#34-configuration)
4. [CORS (Cross-Origin Resource Sharing)](#4-cors-cross-origin-resource-sharing)
   - [What It Prevents](#41-what-it-prevents)
   - [How It's Configured](#42-how-its-configured)
   - [Origin Validation Flow](#43-origin-validation-flow)
5. [Security Headers](#5-security-headers)
   - [Default Production Headers](#51-default-production-headers)
   - [HSTS (HTTP Strict Transport Security)](#52-hsts-http-strict-transport-security)
   - [Middleware Flow](#53-middleware-flow)
6. [Other Hardening](#6-other-hardening)
7. [Environment Variables](#7-environment-variables)
8. [Full Request Security Flow](#8-full-request-security-flow)
9. [File Reference](#9-file-reference)

---

## 1. Overview

The API has four layers of security that every request passes through before reaching a resolver:

```
Request arrives
    │
    ▼
┌─ Layer 1: Express Hardening ──────────────────────────────┐
│  • x-powered-by disabled                                  │
│  • trust proxy (when behind reverse proxy)                │
└───────────────────────────────┬────────────────────────────┘
    │
    ▼
┌─ Layer 2: Security Headers Middleware ────────────────────┐
│  • X-Frame-Options: DENY                                  │
│  • X-Content-Type-Options: nosniff                        │
│  • Referrer-Policy: no-referrer                           │
│  • Permissions-Policy                                     │
│  • HSTS (on HTTPS)                                        │
└───────────────────────────────┬────────────────────────────┘
    │
    ▼
┌─ Layer 3: CORS ──────────────────────────────────────────┐
│  • Only allows requests from whitelisted origins          │
│  • Controls allowed methods and headers                   │
└───────────────────────────────┬───────────────────────────┘
    │
    ▼
┌─ Layer 4: Rate Limiting (Throttle Guard) ────────────────┐
│  • 100 requests per 60 seconds per client (default)       │
│  • Returns HTTP 429 when exceeded                         │
│  • Runs as global guard on EVERY request                  │
└───────────────────────────────┬───────────────────────────┘
    │
    ▼
  Auth Guards → Resolver → Response
```

All security settings are **driven by environment variables**, validated by Zod at startup, and centralized in one file: `security-config.ts`.

---

## 2. Security Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                          main.ts                                │
│                     (Application Bootstrap)                     │
│                                                                 │
│   const securityConfig = createSecurityConfig(configService);   │
│                          │                                      │
│            ┌─────────────┼─────────────────┐                    │
│            │             │                 │                    │
│            ▼             ▼                 ▼                    │
│   ┌─────────────┐ ┌──────────────┐ ┌────────────────┐          │
│   │  Security   │ │    CORS      │ │  Express       │          │
│   │  Headers    │ │   Options    │ │  Hardening     │          │
│   │  Middleware │ │              │ │                │          │
│   │             │ │ enableCors() │ │ disable        │          │
│   │ app.use()   │ │              │ │ x-powered-by   │          │
│   └─────────────┘ └──────────────┘ │ trust proxy    │          │
│                                    └────────────────┘          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        app.module.ts                            │
│                                                                 │
│   ThrottlerModule.forRootAsync({                                │
│     useFactory: (config) => createThrottlerOptions(...)         │
│   })                                                            │
│                                                                 │
│   providers: [                                                  │
│     AppThrottlerGuard,          ◄── Custom guard for GraphQL    │
│     {                                                           │
│       provide: APP_GUARD,       ◄── Makes it GLOBAL             │
│       useExisting: AppThrottlerGuard,                           │
│     },                                                          │
│   ]                                                             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      security-config.ts                         │
│                    (Central Configuration)                      │
│                                                                 │
│   createSecurityConfig()        → SecurityConfig object         │
│   createCorsOptions()           → CorsOptions for enableCors()  │
│   createSecurityHeadersMiddleware() → Express middleware        │
│   createThrottlerOptions()      → ThrottlerModuleOptions        │
│   buildProductionSecurityHeaders()  → Header key-value pairs    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Rate Limiting (Throttle Guard)

### 3.1 How It Works

The throttle guard limits how many requests a single client can make within a time window. Think of it like a ticket booth:

```
"Each person can only get 100 tickets per minute"

  Request 1    → ✅ Allowed  (1/100)
  Request 2    → ✅ Allowed  (2/100)
  ...
  Request 100  → ✅ Allowed  (100/100)
  Request 101  → ❌ HTTP 429 "Too Many Requests"
                    ⏳ Wait for window to reset...
  Window resets → ✅ Allowed  (1/100)
```

**Why it matters:**

```
Without rate limiting:

  Attacker sends 10,000 requests/second
      → Database overwhelmed → App crashes → Nobody can use it

With rate limiting:

  Attacker sends 10,000 requests/second
      → First 100 go through
      → Remaining 9,900 get 429 "Too Many Requests"
      → Database is fine → App keeps running
```

### 3.2 AppThrottlerGuard — The GraphQL Override

**File:** `src/common/guards/app-throttler.guard.ts`

The default `ThrottlerGuard` from `@nestjs/throttler` was built for REST APIs. It extracts `req`/`res` using `context.switchToHttp()`, which doesn't work for GraphQL because `req`/`res` are wrapped inside the GraphQL context object.

`AppThrottlerGuard` overrides `getRequestResponse()` to handle both transports:

```typescript
@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected override getRequestResponse(context: ExecutionContext) {
    if (context.getType<string>() === 'graphql') {
      // GraphQL: extract req/res from GraphQL context
      const gqlContext = GqlExecutionContext.create(context).getContext<{
        req: Record<string, unknown>;
        res: Record<string, unknown>;
      }>();
      return { req: gqlContext.req, res: gqlContext.res };
    }

    // REST: use default extraction
    return super.getRequestResponse(context);
  }
}
```

**This is the same pattern** used in `GraphqlAuthGuard` — any guard built for REST needs this override to work with GraphQL, because `req`/`res` live inside the GraphQL context (put there by the context bridge in `app.module.ts`).

```
┌──────────────────────────────────────────────────────────┐
│  getRequestResponse(context)                             │
│                                                          │
│  context.getType() === ?                                 │
│         │                                                │
│    ┌────┴──────────┐                                     │
│    │               │                                     │
│  'graphql'       'http'                                  │
│    │               │                                     │
│    ▼               ▼                                     │
│  GqlExecution    super.getRequest                        │
│   Context         Response()                             │
│   .create()       │                                      │
│   .getContext()    │ Uses default                         │
│    │               │ Express extraction                  │
│    ▼               │                                     │
│  { req, res }      │                                     │
│  from GraphQL      │                                     │
│  context object    │                                     │
│    │               │                                     │
│    └───────┬───────┘                                     │
│            ▼                                             │
│     { req, res } returned                                │
│     to ThrottlerGuard base class                         │
│     for IP extraction and counting                       │
└──────────────────────────────────────────────────────────┘
```

### 3.3 Skip Logic

Certain requests skip rate limiting entirely:

```typescript
function shouldSkipRateLimit(context, config): boolean {
  // 1. Rate limiting disabled via env var → skip all
  if (!config.rateLimit.enabled) return true;

  // 2. Not HTTP (e.g., WebSocket) → don't skip
  if (context.getType() !== 'http') return false;

  // 3. OPTIONS request (CORS preflight) → skip
  return request.method === 'OPTIONS';
}
```

```
┌──────────────────────────────────────────────────────────┐
│                Should this request be rate limited?       │
│                                                          │
│  RATE_LIMIT_ENABLED=false?  → No (skip all limiting)     │
│  Not an HTTP request?       → Yes (limit it)             │
│  OPTIONS method?            → No (CORS preflight)        │
│  Everything else?           → Yes (limit it)             │
└──────────────────────────────────────────────────────────┘
```

OPTIONS requests are skipped because the browser automatically sends them before real requests (CORS preflight). You don't want those eating up the user's rate limit.

### 3.4 Configuration

Registered as a **global guard** in `app.module.ts`:

```typescript
providers: [
  AppThrottlerGuard,
  {
    provide: APP_GUARD, // ← makes it run on EVERY request
    useExisting: AppThrottlerGuard,
  },
];
```

`APP_GUARD` means you never need `@UseGuards(AppThrottlerGuard)` — it automatically applies to all routes and resolvers.

Module registration:

```typescript
ThrottlerModule.forRootAsync({
  inject: [ConfigService],
  useFactory: (configService) => {
    const securityConfig = createSecurityConfig(configService);
    return createThrottlerOptions(securityConfig);
    // Returns: { skipIf: ..., throttlers: [{ limit: 100, ttl: 60000 }] }
  },
}),
```

---

## 4. CORS (Cross-Origin Resource Sharing)

### 4.1 What It Prevents

CORS controls **which websites** can make requests to your API. Without it, any website on the internet could call your API from a user's browser.

```
Without CORS:

  evil-site.com loads in user's browser
      │
      ▼
  JavaScript on evil-site.com calls POST /graphql
  using the user's cookies/auth
      │
      ▼
  Your API processes it as a legitimate request ❌


With CORS:

  evil-site.com loads in user's browser
      │
      ▼
  Browser checks: "Is evil-site.com in the API's allowed origins?"
      │
      ▼
  No → Browser BLOCKS the request before it reaches your API ✅
```

### 4.2 How It's Configured

```typescript
export function createCorsOptions(config: SecurityConfig): CorsOptions {
  return {
    credentials: true, // Allow cookies/auth headers
    allowedHeaders: ['Content-Type', 'Authorization'], // Which headers clients can send
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    maxAge: 86400, // Cache preflight for 24 hours
    optionsSuccessStatus: 204, // Response code for preflight
    origin: (origin, callback) => {
      // Dynamic origin checker
      if (!origin || config.cors.allowedOrigins.has(normalizeOrigin(origin))) {
        callback(null, true); // ✅ Allowed
      } else {
        callback(new Error(`CORS origin is not allowed: ${origin}`)); // ❌ Blocked
      }
    },
  };
}
```

### 4.3 Origin Validation Flow

```
Browser sends request with Origin header
        │
        ▼
┌───────────────────────────────────────────────────────┐
│  CORS origin check                                    │
│                                                       │
│  Origin: "https://admin.org-system.com"              │
│                                                       │
│  Allowed origins (from CORS_ORIGINS env var):         │
│  ┌─────────────────────────────────────────────┐      │
│  │ http://localhost:3000       (admin dev)     │      │
│  │ http://localhost:19006      (mobile dev)    │      │
│  │ https://admin.org-system.com (production)  │      │
│  └─────────────────────────────────────────────┘      │
│                                                       │
│  "https://admin.org-system.com" in set?              │
│       │                                               │
│  ┌────┴────┐                                          │
│  │         │                                          │
│ YES        NO                                         │
│  │         │                                          │
│  ▼         ▼                                          │
│ ✅ Allow   ❌ Error: "CORS origin is not allowed"     │
│ request    Browser blocks the response                │
└───────────────────────────────────────────────────────┘
```

**No origin** (server-to-server calls, Postman, curl) is always allowed because there's no browser enforcing CORS.

---

## 5. Security Headers

### 5.1 Default Production Headers

Applied as Express middleware on **every response** in production:

```typescript
const DEFAULT_PRODUCTION_HEADERS = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'camera=(), geolocation=(), microphone=()',
};
```

| Header                               | What It Prevents                                                                           |
| ------------------------------------ | ------------------------------------------------------------------------------------------ |
| `X-Frame-Options: DENY`              | **Clickjacking** — prevents your site from being embedded in an iframe on a malicious page |
| `X-Content-Type-Options: nosniff`    | **MIME sniffing attacks** — forces browsers to respect the declared content type           |
| `Referrer-Policy: no-referrer`       | **Information leakage** — prevents sending the URL of the page that linked to your API     |
| `Permissions-Policy: camera=(), ...` | **Feature abuse** — disables camera, geolocation, microphone access via browser APIs       |

### 5.2 HSTS (HTTP Strict Transport Security)

Only added when the request is over HTTPS:

```typescript
if (isHttps && config.hstsMaxAgeSeconds > 0) {
  headers['Strict-Transport-Security'] = `max-age=31536000; includeSubDomains`;
}
```

This tells the browser: "For the next year (31,536,000 seconds), ALWAYS use HTTPS for this domain. Never try HTTP."

**HTTPS detection:**

```typescript
function isHttpsRequest(request): boolean {
  // Direct HTTPS connection
  if (request.secure) return true;

  // Behind a reverse proxy (e.g., nginx, Cloudflare)
  // that sets X-Forwarded-Proto header
  const forwardedProto = request.headers['x-forwarded-proto'];
  return forwardedProto?.includes('https') ?? false;
}
```

### 5.3 Middleware Flow

```
Request arrives
    │
    ▼
┌───────────────────────────────────────────────────────┐
│  createSecurityHeadersMiddleware(config)               │
│                                                       │
│  Is production AND headers enabled?                   │
│       │                                               │
│  ┌────┴────┐                                          │
│  │         │                                          │
│ YES        NO (development)                           │
│  │         │                                          │
│  ▼         ▼                                          │
│  Build     Return empty {}                            │
│  headers   (no headers added)                         │
│  │                                                    │
│  ▼                                                    │
│  Is HTTPS?                                            │
│  ┌────┴────┐                                          │
│ YES        NO                                         │
│  │         │                                          │
│  ▼         ▼                                          │
│  Add HSTS  Skip HSTS                                  │
│  header                                               │
│  │         │                                          │
│  └────┬────┘                                          │
│       ▼                                               │
│  Set all headers on res                               │
│  res.set('X-Frame-Options', 'DENY')                   │
│  res.set('X-Content-Type-Options', 'nosniff')         │
│  ...                                                  │
│       │                                               │
│       ▼                                               │
│  next() → continue to CORS → Throttle → Guards        │
└───────────────────────────────────────────────────────┘
```

---

## 6. Other Hardening

### Disable `x-powered-by`

```typescript
expressApp.disable('x-powered-by');
```

By default, Express sends `X-Powered-By: Express` on every response. This reveals your tech stack to attackers. Disabling it removes this header.

### Trust Proxy

```typescript
if (securityConfig.trustProxy) {
  app.set('trust proxy', true);
}
```

When your app is behind a reverse proxy (nginx, Cloudflare, AWS ALB), the client's real IP is in the `X-Forwarded-For` header, not `req.ip`. Setting `trust proxy` tells Express to use the forwarded headers for:

- **Rate limiting** — throttle by real client IP, not proxy IP
- **HTTPS detection** — read `X-Forwarded-Proto` for HSTS
- **Logging** — log the actual client IP

---

## 7. Environment Variables

All security settings are configured via environment variables, validated by Zod at startup:

| Variable                    | Type                    | Default                                  | Purpose                                   |
| --------------------------- | ----------------------- | ---------------------------------------- | ----------------------------------------- |
| `CORS_ORIGINS`              | Comma-separated URLs    | `localhost:3000,3001,19006`              | Allowed origins for CORS                  |
| `CORS_METHODS`              | Comma-separated strings | `GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS` | Allowed HTTP methods                      |
| `CORS_ALLOWED_HEADERS`      | Comma-separated strings | `Content-Type,Authorization`             | Headers clients can send                  |
| `CORS_EXPOSED_HEADERS`      | Comma-separated strings | `[]`                                     | Headers clients can read from response    |
| `CORS_MAX_AGE_SECONDS`      | Number                  | `86400` (24h)                            | How long browsers cache preflight results |
| `RATE_LIMIT_ENABLED`        | Boolean                 | `true`                                   | Enable/disable rate limiting              |
| `RATE_LIMIT_WINDOW_SECONDS` | Number                  | `60`                                     | Time window for rate limit counter        |
| `RATE_LIMIT_MAX_REQUESTS`   | Number                  | `100`                                    | Max requests per window per client        |
| `SECURITY_HEADERS_ENABLED`  | Boolean                 | `true`                                   | Enable/disable security headers           |
| `HSTS_MAX_AGE_SECONDS`      | Number                  | `31536000` (1 year)                      | HSTS duration                             |
| `TRUST_PROXY`               | Boolean                 | `false`                                  | Trust `X-Forwarded-*` headers             |

Validation example — if `CORS_ORIGINS` has an invalid URL, the app **won't start**:

```
Config validation error: CORS_ORIGINS.0: Invalid url
```

---

## 8. Full Request Security Flow

```
Client (browser/mobile app)
    │
    POST /graphql
    Origin: https://admin.org-system.com
    Authorization: Bearer eyJ...
    │
    ▼
═══════════════════════════════════════════════════════
                 Express HTTP Server
═══════════════════════════════════════════════════════
    │
    ▼
┌─── Layer 1: Express Hardening ──────────────────────┐
│                                                     │
│   ✓ x-powered-by header removed                    │
│   ✓ trust proxy enabled (if configured)             │
│                                                     │
└──────────────────────┬──────────────────────────────┘
    │
    ▼
┌─── Layer 2: Security Headers Middleware ────────────┐
│                                                     │
│   Response headers set:                             │
│   X-Frame-Options: DENY                             │
│   X-Content-Type-Options: nosniff                   │
│   Referrer-Policy: no-referrer                      │
│   Permissions-Policy: camera=(), ...                │
│   Strict-Transport-Security: max-age=31536000       │
│                  (only if HTTPS) ▲                   │
│                                                     │
└──────────────────────┬──────────────────────────────┘
    │
    ▼
┌─── Layer 3: CORS Check ────────────────────────────┐
│                                                     │
│   Origin: https://admin.org-system.com             │
│   Is it in CORS_ORIGINS? → ✅ Yes, allow            │
│                                                     │
│   (If no → ❌ Error: "CORS origin not allowed")     │
│                                                     │
└──────────────────────┬──────────────────────────────┘
    │
    ▼
═══════════════════════════════════════════════════════
              Apollo Server + NestJS Pipeline
═══════════════════════════════════════════════════════
    │
    ▼
┌─── Layer 4: AppThrottlerGuard (GLOBAL) ────────────┐
│                                                     │
│   Skip check:                                       │
│   - Rate limiting enabled? Yes → continue           │
│   - HTTP request? Yes → continue                    │
│   - OPTIONS method? No → continue                   │
│                                                     │
│   Identify client: IP = 203.0.113.42                │
│                                                     │
│   ┌───────────────────────────────────────────┐     │
│   │ Rate limit counter for 203.0.113.42       │     │
│   │                                           │     │
│   │ Requests in last 60s: 47                  │     │
│   │ Limit: 100                                │     │
│   │                                           │     │
│   │ 47 < 100 → ✅ ALLOW                       │     │
│   │ Counter: 47 → 48                          │     │
│   └───────────────────────────────────────────┘     │
│                                                     │
│   (If 100 → ❌ HTTP 429 "Too Many Requests")        │
│                                                     │
└──────────────────────┬──────────────────────────────┘
    │
    ▼
┌─── Layer 5: Auth Guards ───────────────────────────┐
│                                                     │
│   GraphqlAuthGuard → JWT verification               │
│   RolesGuard → role check                           │
│                                                     │
│   (See: NESTJS_GRAPHQL_AUTH_PIPELINE.md)             │
│                                                     │
└──────────────────────┬──────────────────────────────┘
    │
    ▼
  Resolver → Service → Repository → MongoDB
    │
    ▼
  GraphQL JSON Response
  (with security headers attached)
```

---

## 9. File Reference

| File                                       | Purpose                                                                                   |
| ------------------------------------------ | ----------------------------------------------------------------------------------------- |
| `src/config/security-config.ts`            | Central security configuration — CORS, headers, rate limiting, all factory functions      |
| `src/config/env.schema.ts`                 | Zod schema validating all security-related environment variables at startup               |
| `src/config/runtime-config.ts`             | MongoDB connection options, env file path resolution                                      |
| `src/common/guards/app-throttler.guard.ts` | Custom throttle guard with GraphQL `req`/`res` extraction override                        |
| `src/app.module.ts`                        | Registers `ThrottlerModule` and `AppThrottlerGuard` as global `APP_GUARD`                 |
| `src/main.ts`                              | Bootstrap — applies security headers middleware, CORS, disables x-powered-by, trust proxy |
