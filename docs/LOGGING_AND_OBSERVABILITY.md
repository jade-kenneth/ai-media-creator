# Logging & Observability — Request Logging, Log Levels & AppLoggerService

> **Project:** Organization Connect API (`org-system-api`)
> **Stack:** NestJS · Express · ConsoleLogger

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture Diagram](#2-architecture-diagram)
3. [AppLoggerService — Custom Logger](#3-apploggerservice--custom-logger)
   - [Why Extend ConsoleLogger?](#31-why-extend-consolelogger)
   - [How It Becomes the Global Logger](#32-how-it-becomes-the-global-logger)
   - [bufferLogs Explained](#33-bufferlogs-explained)
4. [Request Logging Middleware](#4-request-logging-middleware)
   - [What Gets Logged](#41-what-gets-logged)
   - [Middleware Flow](#42-middleware-flow)
   - [Request ID Tracing](#43-request-id-tracing)
   - [What Gets Skipped](#44-what-gets-skipped)
5. [Log Levels — How They're Chosen](#5-log-levels--how-theyre-chosen)
6. [Observability Config](#6-observability-config)
7. [Service-Level Logging](#7-service-level-logging)
8. [Where Logs Appear](#8-where-logs-appear)
9. [Environment Variables](#9-environment-variables)
10. [File Reference](#10-file-reference)

---

## 1. Overview

The API has two types of logging:

```
┌─────────────────────────────────────────────────────────────────┐
│                       Logging Types                             │
│                                                                 │
│  1. REQUEST-LEVEL LOGGING                                       │
│     One log entry per HTTP request                              │
│     Middleware records: who, what, how long, success/fail       │
│     → Answers: "What happened on this request?"                 │
│                                                                 │
│  2. SERVICE-LEVEL LOGGING                                       │
│     Specific log calls in business logic                        │
│     Service records: errors, important events                   │
│     → Answers: "Why did this specific operation fail?"          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

Both types flow through the same `AppLoggerService`, which writes to the terminal console.

---

## 2. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                          main.ts                                │
│                                                                 │
│   NestFactory.create(AppModule, { bufferLogs: true })           │
│       │                                                         │
│       │  Startup logs buffered until logger is ready            │
│       ▼                                                         │
│   app.useLogger(app.get(AppLoggerService))                      │
│       │                                                         │
│       │  1. Gets AppLoggerService from DI container             │
│       │  2. Replaces NestJS default logger globally             │
│       │  3. Flushes buffered startup logs                       │
│       ▼                                                         │
│   App is running                                                │
└──────────────────────────┬──────────────────────────────────────┘
                           │
          ┌────────────────┼────────────────────┐
          │                │                    │
          ▼                ▼                    ▼
┌──────────────────┐ ┌──────────────┐ ┌──────────────────┐
│ Request Logging  │ │ NestJS       │ │ Service-Level    │
│ Middleware       │ │ Internals    │ │ Logging          │
│                  │ │              │ │                  │
│ Injects          │ │ Startup,     │ │ new Logger()     │
│ AppLoggerService │ │ shutdown,    │ │ in services      │
│ directly         │ │ exceptions   │ │                  │
│                  │ │              │ │ Delegates to     │
│ Logs every HTTP  │ │ Uses global  │ │ global logger    │
│ request          │ │ logger set   │ │ (AppLoggerService│
│                  │ │ by useLogger │ │  via useLogger)  │
└────────┬─────────┘ └──────┬───────┘ └────────┬─────────┘
         │                  │                   │
         └──────────────────┼───────────────────┘
                            │
                            ▼
              ┌──────────────────────────────┐
              │      AppLoggerService        │
              │  extends ConsoleLogger       │
              │                              │
              │  .log()     → stdout   🟢    │
              │  .warn()    → stdout   🟡    │
              │  .error()   → stderr   🔴    │
              │  .debug()   → stdout   🔵    │
              │  .verbose() → stdout   ⚪    │
              └──────────────┬───────────────┘
                             │
                             ▼
                   Terminal / Console
              ┌──────────────────────────────┐
              │  [Nest] LOG  [RequestLogger] │
              │    {"requestId":"a3f1..."...} │
              │  [Nest] WARN [RequestLogger] │
              │    {"requestId":"b7c2..."...} │
              │  [Nest] ERROR [Announcements │
              │    Service] "notifications   │
              │    failed: timeout"           │
              └──────────────────────────────┘
```

---

## 3. AppLoggerService — Custom Logger

**File:** `src/common/logger/app-logger.service.ts`

```typescript
@Injectable()
export class AppLoggerService extends ConsoleLogger {}
```

### 3.1 Why Extend ConsoleLogger?

```
Option A: Use ConsoleLogger directly everywhere
  ❌ Can't inject it via NestJS dependency injection
  ❌ To change formatting later → edit every file that logs

Option B: Extend it in AppLoggerService (current approach)
  ✅ Injectable via NestJS DI (@Injectable)
  ✅ Single customization point for ALL logging
  ✅ Swap to external service later without changing consumers

  Future example:
  ┌─────────────────────────────────────────────────┐
  │  export class AppLoggerService extends          │
  │    ConsoleLogger {                              │
  │                                                 │
  │    // Override to send errors to Datadog        │
  │    error(message: string, trace?, context?) {   │
  │      super.error(message, trace, context);      │
  │      datadog.send(message);  // ← added here   │
  │    }                                            │
  │  }                                              │
  │                                                 │
  │  Every consumer automatically gets Datadog      │
  │  without any code changes elsewhere.            │
  └─────────────────────────────────────────────────┘
```

Currently the class body is empty — it's a **placeholder** that gives you a centralized injection point. The moment you need custom formatting or external log shipping, you override methods here and it applies everywhere.

### 3.2 How It Becomes the Global Logger

In `main.ts`:

```typescript
const app = await NestFactory.create<NestExpressApplication>(AppModule, {
  bufferLogs: true,
});
app.useLogger(app.get(AppLoggerService));
```

`app.useLogger()` does two things:

```
1. Replaces NestJS's internal logger
   ┌──────────────────────────────────────────────────┐
   │  Before useLogger():                             │
   │  NestJS internals → default ConsoleLogger        │
   │                                                  │
   │  After useLogger():                              │
   │  NestJS internals → AppLoggerService             │
   └──────────────────────────────────────────────────┘

2. Makes new Logger() in services delegate to it
   ┌──────────────────────────────────────────────────┐
   │  private readonly logger = new Logger('MyService')│
   │                              │                    │
   │  logger.log("hello")         │                    │
   │         │                    │                    │
   │         ▼                    ▼                    │
   │  delegates to ──► AppLoggerService.log()          │
   └──────────────────────────────────────────────────┘
```

### 3.3 bufferLogs Explained

```
Without bufferLogs:

  NestFactory.create()
      │
      ▼  NestJS starts resolving modules, providers...
      │  Logs: "ModuleA resolved" → default logger (not yours)
      │  Logs: "ModuleB resolved" → default logger (not yours)
      │
      ▼  app.useLogger(AppLoggerService)
      │  Logs: "Ready" → AppLoggerService ✅
      │
      ⚠️ Early startup logs used the wrong logger!


With bufferLogs: true (current approach):

  NestFactory.create(AppModule, { bufferLogs: true })
      │
      ▼  NestJS starts resolving modules, providers...
      │  Logs: "ModuleA resolved" → BUFFERED (held in memory)
      │  Logs: "ModuleB resolved" → BUFFERED (held in memory)
      │
      ▼  app.useLogger(AppLoggerService)
      │  Flush buffer → all buffered logs go through AppLoggerService ✅
      │  Logs: "Ready" → AppLoggerService ✅
      │
      ✅ ALL logs use your custom logger, even early ones
```

---

## 4. Request Logging Middleware

**File:** `src/common/middleware/request-logging.middleware.ts`

### 4.1 What Gets Logged

Every HTTP request produces a structured JSON log entry:

```json
{
  "requestId": "a3f1c2e4-8b7d-4f6a-9c1e-2d3f4a5b6c7d",
  "method": "POST",
  "path": "/graphql",
  "statusCode": 200,
  "durationMs": 45.23,
  "ip": "192.168.1.5",
  "operationName": "createAnnouncement",
  "userAgent": "Mozilla/5.0..."
}
```

| Field           | What It Answers                                                           |
| --------------- | ------------------------------------------------------------------------- |
| `requestId`     | Which specific request was this? (for tracing)                            |
| `method`        | What HTTP method? (`POST` for all GraphQL)                                |
| `path`          | What endpoint? (`/graphql`)                                               |
| `statusCode`    | Did it succeed (200) or fail (400/500)?                                   |
| `durationMs`    | How long did the full request take?                                       |
| `ip`            | Who sent it? (client IP address)                                          |
| `operationName` | Which GraphQL operation? (`createAnnouncement`, `getAnnouncements`, etc.) |
| `userAgent`     | What app/browser sent it?                                                 |

### 4.2 Middleware Flow

Registered globally in `app.module.ts`:

```typescript
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggingMiddleware).forRoutes({
      path: '*', // ← ALL routes
      method: RequestMethod.ALL, // ← ALL methods
    });
  }
}
```

```
Request arrives
    │
    ▼
┌─── RequestLoggingMiddleware.use() ──────────────────────────┐
│                                                             │
│  Step 1: Is logging enabled?                                │
│          NO → call next(), skip everything                  │
│          YES ↓                                              │
│                                                             │
│  Step 2: Resolve request ID                                 │
│  ┌────────────────────────────────────────────────────┐     │
│  │ Does request have x-request-id header?             │     │
│  │   YES → use the provided ID (trace across services)│     │
│  │   NO  → generate new UUID via randomUUID()         │     │
│  └────────────────────────────────────────────────────┘     │
│                                                             │
│  Step 3: Record start time                                  │
│          startedAt = process.hrtime.bigint()                │
│          (nanosecond precision)                              │
│                                                             │
│  Step 4: Set x-request-id on response header                │
│          (client can reference it in bug reports)           │
│                                                             │
│  Step 5: Listen for response 'finish' event                 │
│          (fires when response is fully sent to client)      │
│                                                             │
│  Step 6: Call next()                                        │
│          Request proceeds normally through:                 │
│          Security → Throttle → Auth → Resolver → Response   │
│                                                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
    ... request is processed ...
                       │
                       ▼
┌─── response 'finish' event fires ───────────────────────────┐
│                                                             │
│  Step 7: Should we log this request?                        │
│          OPTIONS request → skip (CORS preflight)            │
│          /health or / → skip (unless configured)            │
│          Logging disabled → skip                            │
│                                                             │
│  Step 8: Calculate duration                                 │
│          durationMs = (now - startedAt) / 1,000,000         │
│          (convert nanoseconds → milliseconds)               │
│                                                             │
│  Step 9: Build JSON log message                             │
│          {requestId, method, path, statusCode,              │
│           durationMs, ip, operationName, userAgent}         │
│                                                             │
│  Step 10: Pick log level                                    │
│  ┌────────────────────────────────────────────────────┐     │
│  │ status >= 500           → logger.error()  🔴       │     │
│  │ status >= 400           → logger.warn()   🟡       │     │
│  │ durationMs >= 1000ms    → logger.warn()   🟡       │     │
│  │ everything else         → logger.log()    🟢       │     │
│  └────────────────────────────────────────────────────┘     │
│                                                             │
│  Step 11: Write log via AppLoggerService                    │
│           logger.log(message, 'RequestLogger')              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
Terminal output:
[Nest] 12345 - 04/03/2026 LOG [RequestLogger] {"requestId":"a3f1...","statusCode":200,"durationMs":45.23,"operationName":"getAnnouncements"}
```

### 4.3 Request ID Tracing

The `x-request-id` header enables **end-to-end request tracing**:

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Client     │     │   API        │     │   MongoDB    │
│              │     │              │     │              │
│  Sends:      │     │  Receives:   │     │              │
│  x-request-id│────►│  "abc-123"   │     │              │
│  "abc-123"   │     │              │     │              │
│              │     │  Logs with   │     │              │
│  OR          │     │  "abc-123"   │     │              │
│  (no header) │────►│  Generates   │     │              │
│              │     │  "def-456"   │     │              │
│              │     │              │     │              │
│  Response:   │◄────│  Sets header │     │              │
│  x-request-id│     │  "abc-123"   │     │              │
│  "abc-123"   │     │  on response │     │              │
└──────────────┘     └──────────────┘     └──────────────┘

User reports bug: "I got an error, request ID is abc-123"
Dev searches logs: grep "abc-123" → finds exact request
```

### 4.4 What Gets Skipped

```
┌────────────────────────────────────────────────────────────────┐
│  shouldLogRequest(method, path, config)                        │
│                                                                │
│  Logging disabled?          → skip ALL   (no logs at all)      │
│  OPTIONS request?           → skip       (CORS preflight)      │
│  /health or / path?         → skip       (noisy health checks) │
│  Everything else?           → LOG IT ✅                         │
│                                                                │
│  Why skip health checks?                                       │
│  Load balancers ping /health every 5-30 seconds.               │
│  That's 2,880-17,280 logs per day of "yep, still alive."       │
│  Unless you set REQUEST_LOGGING_INCLUDE_HEALTH=true.           │
└────────────────────────────────────────────────────────────────┘
```

---

## 5. Log Levels — How They're Chosen

```typescript
export function resolveRequestLogLevel(
  statusCode: number,
  durationMs: number,
  slowRequestWarnThresholdMs: number,
): 'error' | 'warn' | 'log' {
  if (statusCode >= 500) return 'error';
  if (statusCode >= 400 || durationMs >= slowRequestWarnThresholdMs)
    return 'warn';
  return 'log';
}
```

```
┌──────────────────────────────────────────────────────────────┐
│                    Log Level Decision Tree                    │
│                                                              │
│  Status code?                                                │
│       │                                                      │
│  ┌────┴──────────────────────────┐                           │
│  │                               │                           │
│  500+                            Other                       │
│  │                               │                           │
│  ▼                               ▼                           │
│  🔴 ERROR                    Status code?                    │
│  Server crashed,                 │                           │
│  unhandled exception        ┌────┴───────────┐               │
│                             │                │               │
│  Terminal:                  400-499          200-399          │
│  [ERROR] {...}              │                │               │
│                             ▼                ▼               │
│                          🟡 WARN          Duration?          │
│                          Bad request,        │               │
│                          unauthorized   ┌────┴───────┐       │
│                                         │            │       │
│                          Terminal:     >= 1000ms   < 1000ms   │
│                          [WARN] {...}   │            │        │
│                                         ▼            ▼       │
│                                      🟡 WARN     🟢 LOG     │
│                                      Slow!       Normal,     │
│                                                  healthy     │
│                                      Terminal:   Terminal:   │
│                                      [WARN]      [LOG]       │
│                                      {...}       {...}       │
└──────────────────────────────────────────────────────────────┘
```

### Real-World Examples

```
🟢 [LOG]  {"statusCode":200, "durationMs":45,   "operationName":"getAnnouncements"}
           Normal, fast → everything is fine

🟡 [WARN] {"statusCode":200, "durationMs":3200, "operationName":"adminDashboard"}
           Success but SLOW (3200ms > 1000ms threshold) → investigate performance

🟡 [WARN] {"statusCode":401, "durationMs":12,   "operationName":"createAnnouncement"}
           Unauthorized → someone sent a bad/missing token

🟡 [WARN] {"statusCode":403, "durationMs":15,   "operationName":"deleteAnnouncement"}
           Forbidden → user doesn't have the required role

🔴 [ERROR]{"statusCode":500, "durationMs":120,  "operationName":"createAnnouncement"}
           Server error → something crashed, fix it NOW
```

---

## 6. Observability Config

**File:** `src/config/observability-config.ts`

All logging behavior is driven by a single config object:

```typescript
export interface ObservabilityConfig {
  requestLogging: {
    enabled: boolean; // Master on/off switch
    includeHealthRequests: boolean; // Log /health and / requests?
    slowRequestWarnThresholdMs: number; // When to warn about slow requests
  };
}
```

### Helper Functions

| Function                        | Purpose                                                          |
| ------------------------------- | ---------------------------------------------------------------- |
| `createObservabilityConfig()`   | Reads env vars → builds config object                            |
| `shouldLogRequest()`            | Decides if a specific request should be logged                   |
| `createRequestLogMessage()`     | Builds the JSON log string from request/response data            |
| `resolveRequestLogLevel()`      | Picks `error` / `warn` / `log` based on status code and duration |
| `resolveRequestId()`            | Uses provided `x-request-id` header or generates a UUID          |
| `normalizeRequestPath()`        | Strips query string (`/graphql?foo=bar` → `/graphql`)            |
| `resolveGraphqlOperationName()` | Extracts `operationName` from the GraphQL request body           |
| `resolveUserAgent()`            | Safely extracts user-agent string                                |
| `roundDurationMs()`             | Rounds to 2 decimal places (`45.2367` → `45.24`)                 |

---

## 7. Service-Level Logging

Besides request-level logging, individual services use `Logger` for business-logic events:

```typescript
// src/modules/announcements/announcements.service.ts
import { Logger } from '@nestjs/common';

export class AnnouncementsService {
  private readonly logger = new Logger(AnnouncementsService.name);

  async publish(announcement) {
    try {
      await this.notificationsService.createAnnouncementPublishedNotifications(
        announcement,
      );
    } catch (error) {
      this.logger.error(
        `Announcement ${announcement.id} was published but notifications failed: ${reason}`,
      );
    }
  }
}
```

### How `new Logger()` Connects to AppLoggerService

```
new Logger('AnnouncementsService')
    │
    │  NestJS Logger is a static proxy
    │  It delegates to whatever was set via app.useLogger()
    │
    ▼
AppLoggerService.error(message, trace, 'AnnouncementsService')
    │
    ▼
process.stderr

Terminal:
[Nest] 12345 - 04/03/2026 ERROR [AnnouncementsService]
  Announcement 664ab123 was published but notifications failed: timeout
```

You don't inject `AppLoggerService` in services — you use `new Logger()`. NestJS internally routes `Logger` calls to whatever `app.useLogger()` set. Both paths end up at `AppLoggerService`.

```
┌──────────────────────────────────────────────────────────────┐
│  Two ways to log, same destination:                          │
│                                                              │
│  1. Direct injection (middleware uses this):                 │
│     constructor(private readonly logger: AppLoggerService)   │
│     this.logger.log(message)                                 │
│          │                                                   │
│          └──► AppLoggerService → console                     │
│                                                              │
│  2. Static Logger (services use this):                       │
│     private readonly logger = new Logger('MyService')        │
│     this.logger.log(message)                                 │
│          │                                                   │
│          └──► NestJS proxy ──► AppLoggerService → console    │
│                                                              │
│  Both end up at the same AppLoggerService instance ✅         │
└──────────────────────────────────────────────────────────────┘
```

---

## 8. Where Logs Appear

```
┌──────────────────────────────────────────────────────────────┐
│  Development                                                 │
│                                                              │
│  Your terminal (where you run npx nx serve org-system-api)  │
│  OR VS Code terminal panel at the bottom                     │
│                                                              │
│  [Nest] 12345 - 04/03/2026 LOG [NestApplication]            │
│    Nest application successfully started                     │
│  [Nest] 12345 - 04/03/2026 LOG [RequestLogger]              │
│    {"requestId":"a3f1...","statusCode":200,...}               │
│  [Nest] 12345 - 04/03/2026 WARN [RequestLogger]             │
│    {"requestId":"b7c2...","durationMs":3200,...}              │
│  [Nest] 12345 - 04/03/2026 ERROR [AnnouncementsService]     │
│    notifications failed: timeout                             │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  Production                                                  │
│                                                              │
│  stdout/stderr are captured by the deployment environment:   │
│                                                              │
│  Docker        → docker logs <container>                     │
│  AWS ECS       → CloudWatch Logs (automatic)                 │
│  Railway/Render → built-in log viewer                        │
│  PM2           → pm2 logs                                    │
│  Manual        → node dist/main.js > app.log 2>&1           │
│                                                              │
│  The app doesn't change — the environment captures stdout.   │
└──────────────────────────────────────────────────────────────┘
```

---

## 9. Environment Variables

| Variable                         | Type    | Default | Purpose                                                   |
| -------------------------------- | ------- | ------- | --------------------------------------------------------- |
| `REQUEST_LOGGING_ENABLED`        | Boolean | `true`  | Master on/off for request-level logging                   |
| `REQUEST_LOGGING_INCLUDE_HEALTH` | Boolean | `false` | Include `/health` and `/` in logs                         |
| `SLOW_REQUEST_WARN_THRESHOLD_MS` | Number  | `1000`  | Duration (ms) above which a request triggers a `WARN` log |

---

## 10. File Reference

| File                                                  | Purpose                                                                                                          |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `src/common/logger/app-logger.service.ts`             | Custom logger — extends `ConsoleLogger`, injectable, single customization point                                  |
| `src/common/middleware/request-logging.middleware.ts` | Express middleware — logs every HTTP request with timing, status, request ID                                     |
| `src/config/observability-config.ts`                  | Config + helpers — log message builder, level resolver, request ID resolver, skip logic                          |
| `src/config/env.schema.ts`                            | Zod validation for `REQUEST_LOGGING_ENABLED`, `REQUEST_LOGGING_INCLUDE_HEALTH`, `SLOW_REQUEST_WARN_THRESHOLD_MS` |
| `src/main.ts`                                         | Bootstrap — `bufferLogs: true`, `app.useLogger(AppLoggerService)`                                                |
| `src/app.module.ts`                                   | Registers `AppLoggerService` as provider, applies `RequestLoggingMiddleware` to all routes                       |
