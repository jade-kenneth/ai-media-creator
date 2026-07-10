# API security controls

The API applies transport-level controls before GraphQL resolver logic. The
defaults are suitable for local development; production values must be supplied
through environment variables.

## Request path

1. Express receives the request.
2. security headers and CORS policy are applied in `src/main.ts`.
3. `AppThrottlerGuard` enforces the global rate limit.
4. request logging records sanitized metadata.
5. tenant middleware resolves tenant context.
6. GraphQL auth and role guards authorize the operation.
7. resolver and service validation enforce operation-specific rules.

## Configuration

`apps/app-api/src/config/env.schema.ts` validates all security variables.
`security-config.ts` converts them into Nest/Express options.

| Variable | Purpose |
| --- | --- |
| `TRUST_PROXY` | Trust proxy forwarding headers only in a known deployment topology |
| `CORS_ORIGINS` | Exact comma-separated browser origins |
| `CORS_METHODS` | Allowed HTTP methods |
| `CORS_ALLOWED_HEADERS` | Request headers accepted by the API |
| `CORS_EXPOSED_HEADERS` | Response headers visible to browsers |
| `CORS_MAX_AGE_SECONDS` | Preflight cache duration |
| `RATE_LIMIT_ENABLED` | Enables the global throttler |
| `RATE_LIMIT_WINDOW_SECONDS` | Rate-limit window |
| `RATE_LIMIT_MAX_REQUESTS` | Requests allowed per window |
| `SECURITY_HEADERS_ENABLED` | Enables baseline response headers |
| `HSTS_MAX_AGE_SECONDS` | HSTS duration in production |

## Production checklist

- Use HTTPS and a long, randomly generated JWT secret.
- List exact production origins; do not use wildcard origins with credentials.
- Enable `TRUST_PROXY` only behind a trusted proxy and confirm client-IP behavior.
- Keep GraphQL introspection/playground disabled in production.
- Set limits at both the edge and application layers for internet-facing APIs.
- Never log authorization headers, refresh tokens, passwords, or upload URLs.
- Review S3 bucket policy, object ownership, allowed MIME types, and URL expiry.
- Return sanitized GraphQL errors; keep stack traces server-side.

Relevant tests live beside `security-config.ts`, the throttler guard, validation
pipe, and GraphQL error formatter.
