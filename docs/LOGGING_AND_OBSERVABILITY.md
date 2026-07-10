# Logging and observability

The API uses structured request logs so a deployment can route output to its
chosen log platform without coupling the boilerplate to a vendor.

## Request logging

`RequestLoggingMiddleware` assigns or preserves a request ID, records method,
normalized path, status, duration, client IP, user agent, and GraphQL operation
name, then emits through `AppLoggerService`.

Configuration:

| Variable | Default | Purpose |
| --- | --- | --- |
| `REQUEST_LOGGING_ENABLED` | `true` | Enables request logs |
| `REQUEST_LOGGING_INCLUDE_HEALTH` | `false` | Includes health probes |
| `SLOW_REQUEST_WARN_THRESHOLD_MS` | `1000` | Promotes slow requests to warnings |

Status 5xx logs at error, 4xx and slow responses log at warning, and successful
requests log at the normal level.

## Service logging

Log at boundaries where an operator can act: integration failures, retries,
discarded events, security decisions, and unexpected state. Include stable IDs
and operation names, but never credentials, tokens, passwords, personal profile
data, raw GraphQL variables, or presigned URLs.

```ts
private readonly logger = new Logger(ExampleService.name);

this.logger.error(
  `Operation failed for record ${recordId}: ${reason}`,
);
```

## Deployment integration

Send stdout/stderr to the platform log collector. Add metrics and tracing at the
deployment layer or behind a small adapter; avoid importing a vendor SDK into
feature services. At minimum, alert on sustained 5xx rates, latency, database
connectivity, push/email delivery failures, and scheduler lock failures.

See `apps/app-api/src/config/observability-config.ts` and its tests for the
canonical behavior.
