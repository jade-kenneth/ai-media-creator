# Security Checklist

A practical checklist for reviewing application security before release. Each section includes specific checks, risk context, and implementation guidance.

**Severity key:**

| Severity | Meaning | Action |
| --- | --- | --- |
| 🔴 Critical | Exploitable, data breach risk, compliance failure | Must fix before release |
| 🟠 High | Significant vulnerability, elevated risk | Fix before release unless risk-accepted |
| 🟡 Medium | Defense-in-depth gap, potential escalation path | Fix in current sprint |
| 🟢 Low | Hardening, best practice | Fix when convenient |

---

## 01. Secrets & Configuration

| Check | Severity | Notes |
| --- | --- | --- |
| No hardcoded secrets, tokens, or API keys in the codebase | 🔴 | Use `grep -r "sk_live\|AKIA\|password\s*=" --include="*.ts" .` to scan |
| Secrets do not appear in logs, error messages, or API responses | 🔴 | Audit `console.log`, `logger.*`, and error serializers |
| Environment files (`.env*`) are not committed to git | 🔴 | Verify `.gitignore` includes `.env`, `.env.local`, `.env.production` |
| Server-only API keys are never bundled with the client app | 🔴 | Avoid including secrets in app config, constants, or bundled JS |
| CORS is restricted to trusted origins only | 🟠 | Never use `Access-Control-Allow-Origin: *` in production |
| Dependencies are checked for known vulnerabilities | 🟠 | Run `npm audit` / `pnpm audit` — fix critical/high |
| Default credentials, sample accounts, and example configs are removed | 🟠 | Search for `admin/admin`, `test@test.com`, `password123` |
| Debug mode, dev tools, and verbose error output are disabled in production | 🟠 | Next.js: ensure `NODE_ENV=production`, no React DevTools in prod bundle |
| Production and development environment variables are clearly separated | 🟡 | Use `.env.production` and `.env.development` — never share secrets across |
| Secret rotation is possible if credentials are compromised | 🟡 | Can you rotate DB credentials, API keys, JWT secrets without downtime? |
| Database credentials follow least-privilege access | 🟡 | App DB user should not have `DROP`, `CREATE`, or admin privileges |
| Backups and storage buckets are not publicly accessible | 🟠 | Verify S3/GCS bucket policies — no `public-read` unless intentional |

## 02. Authentication, Access & API

| Check | Severity | Notes |
| --- | --- | --- |
| Pages, routes, and API endpoints require proper authentication | 🔴 | Every API route must check auth — no "auth optional" endpoints unless public |
| Authorization is enforced server-side, not only in the UI | 🔴 | Hiding a button is not security — check permissions in API/middleware |
| Users cannot access other users' data by changing IDs (IDOR) | 🔴 | Always verify `resource.ownerId === session.userId` or role-based access |
| Admin routes require real role checks, not hidden URLs | 🔴 | `/admin/*` routes must validate role server-side, not rely on obscurity |
| Tokens are stored securely on the client | 🟠 | Prefer `httpOnly` cookies over `localStorage` for auth tokens |
| Session cookies use `HttpOnly`, `Secure`, and `SameSite` | 🟠 | `HttpOnly` prevents JS access, `Secure` requires HTTPS, `SameSite=Lax` prevents CSRF |
| Login/signup/reset flows do not reveal account existence | 🟡 | Use generic messages: "If an account exists, you'll receive an email" |
| Sensitive endpoints have rate limiting | 🟠 | Login, signup, password reset, OTP verification — 5–10 attempts per minute |
| Brute-force protection exists for login and reset flows | 🟠 | Lock after N failures, CAPTCHA, exponential backoff |
| Expired, revoked, or reused tokens are rejected | 🔴 | Check token expiry, blacklist revoked tokens, reject replayed tokens |
| Logout invalidates sessions or tokens correctly | 🟠 | Server-side session destruction, not just client-side cookie deletion |
| Role escalation is not possible by editing request payloads | 🔴 | Never accept `role` or `isAdmin` from client request bodies |
| API endpoints only allow intended HTTP methods | 🟡 | Return 405 for unexpected methods |
| CSRF protection is enabled for cookie-based auth | 🟠 | Use CSRF tokens or `SameSite` cookies |

### Sensitive Actions Requiring Re-authentication

| Action | Minimum protection |
| --- | --- |
| Change email | Confirm current password or re-auth |
| Change password | Confirm current password |
| Delete account | Confirm password + "type to confirm" |
| Delete important data | Confirmation dialog + backend auth check |
| Payout or billing changes | Re-authenticate + 2FA if available |
| Invite/remove team members | Role check + confirmation |

| Check | Severity |
| --- | --- |
| Error responses do not expose internal implementation details | 🟡 |
| Endpoints return only the data that is actually needed | 🟡 |

---

## 03. User Input & Output Handling

| Check | Severity | Notes |
| --- | --- | --- |
| All user input is validated on the server | 🔴 | Client validation is UX — server validation is security |
| User input is sanitized before rendering | 🔴 | Escape HTML in user-generated content |
| Unsanitized input does not reach database queries | 🔴 | Use parameterized queries / ORM — never string interpolation |
| User text cannot execute scripts in other browsers (XSS) | 🔴 | CSP headers + output encoding + sanitization |
| Rich text/markdown/HTML input is sanitized | 🔴 | Use DOMPurify or similar — strip `<script>`, `onerror`, `javascript:` |
| Hidden form fields and client-side values are never trusted | 🟠 | Re-derive pricing, permissions, IDs on the server |
| Search/filter/sort inputs validated against allowed values | 🟡 | Allowlist valid sort columns and filter operators |
| Redirect URLs validated to prevent open redirect | 🟠 | Only allow relative URLs or allowlisted domains |

### Injection Protection

| Attack vector | Protection | Severity |
| --- | --- | --- |
| SQL injection | Parameterized queries, ORM (Prisma, Drizzle) | 🔴 |
| NoSQL injection | Input validation, avoid `$where`, validate types | 🔴 |
| Command injection | Never pass user input to `exec`, `spawn` without sanitization | 🔴 |
| Template injection | Use safe template engines, avoid `eval()` | 🟠 |

### File Upload Security

| Check | Severity | Notes |
| --- | --- | --- |
| Enforce allowed file types (allowlist MIME + extension) | 🟠 | Don't rely on extension alone — check magic bytes/MIME |
| Enforce size limits | 🟡 | Set per-route limits (e.g., 5MB for images, 50MB for documents) |
| Sanitize file names before storage | 🟠 | Strip path traversal (`../`), special characters, spaces |
| Let the upload service generate storage object keys | 🟠 | Clients should send upload intent such as namespace and content type, not final shared-folder object paths |
| Scan/isolate uploaded files | 🟡 | Store in isolated bucket, never serve from app origin |
| Serve uploads from a separate domain/CDN | 🟡 | Prevents uploaded HTML/SVG from executing scripts on your origin |

---

## 04. Frontend Security

| Check | Severity | Notes |
| --- | --- | --- |
| Sensitive data never in `localStorage` unless justified | 🟠 | `localStorage` is accessible to any JS — XSS = full access |
| Browser storage usage reviewed for XSS risk | 🟠 | What's the blast radius if XSS reaches `localStorage`? |
| Client-side feature flags don't expose sensitive functionality | 🟡 | Feature-flagged code still ships in the bundle — sensitive logic belongs server-side |
| Source maps disabled or protected in production | 🟡 | Exposed source maps reveal your entire codebase |
| Admin functionality not discoverable in frontend code | 🟡 | Don't bundle admin-only routes/code in the public app bundle |
| Third-party scripts reviewed and limited | 🟠 | Each third-party script is a potential supply chain attack vector |
| Iframes and embeds restricted | 🟡 | Use `sandbox` attribute and CSP `frame-src` |

### Frontend Secret Exposure Checks

```bash
# Search for potentially leaked secrets in the client bundle
# Run after building
grep -rn "sk_live\|secret_key\|PRIVATE_KEY\|password" .next/static/
grep -rn "SUPABASE_SERVICE_ROLE\|DATABASE_URL" .next/static/

| Server-only API keys are never bundled with the client app | 🔴 | Avoid including secrets in app config, constants, or bundled JS |
# If non-public env vars appear, they're leaked
```

---

## 05. Database & Storage

| Check | Severity | Notes |
| --- | --- | --- |
| Queries use parameterized patterns or ORM | 🔴 | Prisma/Drizzle handle this by default — avoid raw SQL with interpolation |
| Record-level access control enforced | 🔴 | `WHERE userId = $currentUser` on every query, not just route-level auth |
| Sensitive fields encrypted at rest | 🟡 | PII, payment info, health data — encrypt in database or use managed encryption |
| Deleted sensitive data actually removed/anonymized | 🟡 | Soft delete may retain PII — comply with GDPR/privacy requirements |
| Database backups encrypted and access-controlled | 🟠 | Backup = copy of all data — must have same security as production |
| Storage bucket policies reviewed | 🟠 | No `public-read` on buckets with user data |
| Public IDs used instead of internal IDs | 🟡 | Use UUIDs or slugs instead of auto-increment IDs (prevents enumeration) |

---

## 06. Payments, Billing & Business Logic

| Check | Severity | Notes |
| --- | --- | --- |
| Pricing/discount logic enforced server-side | 🔴 | Never accept price from client — look up from database |
| Business rules enforced on the server | 🔴 | Quantity limits, access rules, feature gates — all server-verified |
| Users cannot bypass limits/quotas/pricing | 🔴 | Rate limit + server validation for trial limits, usage caps |
| Coupon/discount/referral abuse prevented | 🟠 | Single-use enforcement, user-level limits, rate limiting |
| Duplicate submissions handled safely | 🟠 | Idempotency keys on payment endpoints |
| Replay attacks prevented | 🟠 | Nonce/timestamp validation on sensitive requests |
| Race conditions reviewed for critical flows | 🟠 | Use database transactions + row locks for balance/inventory |
| Balances/credits/inventory protected from double-processing | 🔴 | Atomic DB operations, not read-then-write in application code |
| Webhooks verified and idempotent | 🟠 | Verify Stripe/PayPal webhook signatures, process idempotently |

### Common Payment Security Mistakes

| Mistake | Risk | Fix |
| --- | --- | --- |
| Accepting cart total from client | Customer sets price to $0 | Calculate total server-side from DB prices |
| No idempotency key on charge endpoint | Double-charge on retry | Use Stripe idempotency keys or DB-level dedup |
| Webhook endpoint without signature verification | Attacker can fake payment confirmations | Verify `stripe-signature` header |
| Discount applied without server validation | Unlimited discounts by modifying request | Validate coupon in DB, check usage limits |

---

## 07. Logging, Monitoring & Auditing

| Check | Severity | Notes |
| --- | --- | --- |
| Logs do not contain passwords, secrets, tokens, or PII | 🔴 | Audit all `logger.*` calls — redact sensitive fields |
| Security events are logged | 🟠 | See table below |
| Suspicious behavior monitored with alerting | 🟡 | Unusual login patterns, spike in 401/403, high error rates |
| Audit logs for critical admin/billing/destructive actions | 🟠 | Who did what, when, from where — immutable audit trail |
| Monitoring tools are access-restricted | 🟡 | Dashboards/log tools should require auth, not be public |
| Log retention and redaction rules defined | 🟡 | How long are logs kept? Are they redacted after N days? |

### Security Events to Log

| Event | Priority | Data to capture |
| --- | --- | --- |
| Login success/failure | 🟠 | User ID, IP, timestamp, method |
| Password reset request | 🟠 | Email, IP, timestamp |
| Permission/role changes | 🔴 | Who changed, from what, to what, by whom |
| Failed access attempts (401/403) | 🟠 | Requested path, IP, user (if authenticated) |
| Admin actions (delete, modify critical data) | 🔴 | Action, target, admin user, timestamp |
| Payment events | 🟠 | Amount, user, result, payment method |
| Account deletion/deactivation | 🔴 | User, timestamp, triggered by |

---

## 08. Deployment & Infrastructure

| Check | Severity | Notes |
| --- | --- | --- |
| All traffic uses HTTPS | 🔴 | No HTTP endpoints in production — redirect HTTP → HTTPS |
| HSTS enabled in production | 🟠 | `Strict-Transport-Security` header — prevents SSL stripping |
| Internal services/ports not exposed | 🟠 | Database ports, admin panels, debug endpoints — not accessible from internet |
| Infrastructure access follows least privilege | 🟠 | Not everyone needs production DB access or deploy permissions |
| CI/CD secrets stored securely | 🟠 | Use secret managers (GitHub Actions secrets, Vercel env vars) — not in repo |
| Build pipelines don't leak secrets in logs | 🟠 | Mask secrets in CI output, don't echo env vars |
| Staging/preview/production isolated | 🟡 | Preview deployments should not share production databases |
| Unused services/ports/cron jobs disabled | 🟡 | Reduce attack surface — disable what you don't use |
| Containers and base images updated regularly | 🟡 | Pin versions but update for security patches |
| SSRF protections for server-side fetches | 🟠 | Validate URLs — don't allow fetching `localhost`, `169.254.*`, internal IPs |

---

## 09. Account Safety

| Check | Severity | Notes |
| --- | --- | --- |
| Passwords hashed with strong algorithm | 🔴 | bcrypt (cost ≥10), scrypt, or Argon2 — never MD5/SHA1/SHA256 alone |
| Password policy matches app risk level | 🟡 | Minimum 8 characters, check against common password lists |
| MFA available for sensitive accounts | 🟠 | At minimum for admin users — TOTP (Google Auth) or WebAuthn |
| Session timeout and renewal defined | 🟡 | Idle timeout (30 min–2 hr), absolute timeout (24 hr), sliding renewal |
| Password reset tokens expire and are single-use | 🟠 | 15–60 minute expiry, invalidate after use |
| Email verification enforced | 🟡 | Before allowing sensitive actions (payment, data export) |
| Account recovery flows reviewed for abuse | 🟡 | Can an attacker take over by knowing the victim's email? |
| New device/location detection | 🟡 | Optional — alert user on login from new device/IP |

### Password Hashing Comparison

| Algorithm | Status | Cost factor | Notes |
| --- | --- | --- | --- |
| MD5 | ❌ Never | N/A | Broken — rainbow tables available |
| SHA-256 (plain) | ❌ Never | N/A | Too fast — brute-forceable with GPUs |
| bcrypt | ✅ Good | Cost 10–12 | Well-established, widely supported |
| scrypt | ✅ Good | N=16384, r=8, p=1 | Memory-hard — resists GPU attacks |
| Argon2id | ✅ Best | Memory=64MB, iterations=3 | Winner of PHC, resists all known attacks |

---

## 10. Third-Party Services & Integrations

| Check | Severity | Notes |
| --- | --- | --- |
| Integrations use minimum required permissions | 🟠 | Request only scopes you actually use |
| OAuth scopes limited to necessary | 🟠 | Don't request `admin` scope if you only need `read:profile` |
| Webhook signatures validated | 🟠 | Verify HMAC signature before processing |
| External service failures don't expose internals | 🟡 | Catch errors, return generic messages |
| Removed integrations have tokens revoked | 🟡 | When you stop using a service, revoke all access tokens |
| Third-party SDKs reviewed for data leakage | 🟡 | What data does the SDK send to the vendor? |

### Webhook Verification Example

```tsx
// filepath: app/api/webhooks/stripe/route.ts
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed');
    return new Response('Invalid signature', { status: 400 });
  }

  // Process verified event
  switch (event.type) {
    case 'checkout.session.completed':
      // Handle payment
      break;
  }

  return new Response('OK', { status: 200 });
}
```

---

## 11. Review, Testing & Maintenance

| Check | Severity | Notes |
| --- | --- | --- |
| Security checks are part of code review | 🟠 | Every PR with auth/data changes should include security review |
| Auth and authorization edge cases tested | 🟠 | Test with no token, expired token, wrong role, other user's resource |
| Common attack paths tested manually | 🟡 | IDOR, XSS, CSRF, open redirect — test from an attacker's perspective |
| Dependency audits part of regular maintenance | 🟡 | Schedule monthly `npm audit`, review and update |
| Production setup reviewed separately | 🟡 | Production != development — verify headers, env vars, debug flags |
| Old endpoints/legacy routes reviewed | 🟡 | Dead code is attack surface — remove unused API routes |
| Incident response steps documented | 🟡 | Who to contact, how to rotate secrets, how to disable compromised accounts |
| Penetration testing done when risk justifies it | 🟡 | Before handling payments, PII, or health data |

### Security Code Review Checklist (Per PR)

| Question | What to look for |
| --- | --- |
| Does this endpoint check auth? | Middleware, `getServerSession()`, token verification |
| Does this query scope to the current user? | `WHERE userId = ...` or equivalent access check |
| Is user input validated server-side? | Zod schema, manual validation, ORM constraints |
| Could this introduce XSS? | User content rendered with `dangerouslySetInnerHTML` or unsanitized |
| Are secrets handled safely? | No hardcoded values, proper env var usage |
| Could this expose data it shouldn't? | API response includes more fields than the UI needs |

---

## 12. Common High-Risk Checks

Quick pass/fail verification for the most dangerous vulnerability classes:

| Vulnerability | What to check | Severity |
| --- | --- | --- |
| **IDOR** (Insecure Direct Object Reference) | Can user A access user B's data by changing an ID in the URL/request? | 🔴 |
| **XSS** (Cross-Site Scripting) | Can user input execute JavaScript in another user's browser? | 🔴 |
| **Injection** (SQL/NoSQL/Command) | Does any user input reach a query or command without parameterization? | 🔴 |
| **Broken role checks** | Can a regular user access admin endpoints? | 🔴 |
| **Sensitive data leaks** | Are passwords, tokens, or PII in logs, responses, or error messages? | 🔴 |
| **Insecure file uploads** | Can an attacker upload executable files or overwrite existing files? | 🟠 |
| **Payment bypass** | Can a user manipulate cart/pricing/discount client-side? | 🔴 |
| **Overly broad API responses** | Does the API return more data than the UI needs (other users' data, internal fields)? | 🟠 |
| **Production debug exposure** | Are dev tools, debug endpoints, or verbose errors enabled in production? | 🟠 |
| **Secrets in client bundle** | Do bundled assets contain env vars or tokens? | 🔴 |

---

## Security Rules

Follow the project security guidance for sensitive work.

- Validate external input.
- Protect auth and permission checks on both UI and backend boundaries.
- Avoid exposing secrets in client bundles.
- Use secure storage choices appropriately for sensitive tokens when required.
- Prefer secure defaults for tokens, storage, uploads, and third-party integrations.
- Check proposed changes against this guide when work touches authentication, storage, uploads, or sensitive data.

---

## Quick Pre-Release Security Gate

**Minimum checks before any production deployment:**

1. 🔴 `npm audit` shows no critical/high vulnerabilities
2. 🔴 No hardcoded secrets in codebase (`grep` scan clean)
3. 🔴 All API endpoints require and verify authentication
4. 🔴 All data queries scope to the authenticated user
5. 🔴 Security headers configured in production
6. 🟠 User input validated on the server (not just client)
7. 🟠 Webhook endpoints verify signatures
8. 🟠 Rate limiting enabled on authentication endpoints
9. 🟡 Source maps not exposed in production
10. 🟡 Error messages don't reveal implementation details
