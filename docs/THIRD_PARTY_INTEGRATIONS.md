# Third-party integrations

Three optional integrations ship with the boilerplate: Cloudflare Turnstile bot
protection, Google sign-in, and Xendit payments. Each is off by default and
each is gated by its own `*_ENABLED` flag, so a fresh clone boots without any
third-party account. Turning a flag on makes the rest of that integration's
configuration mandatory — `apps/app-api/src/config/env.schema.ts` fails startup
rather than letting a half-configured integration run.

## Cloudflare Turnstile

### How it works

The client renders the Turnstile widget, gets a single-use token, and sends it
on the `x-turnstile-token` header. `TurnstileGuard` reads the action declared by
`@TurnstileProtected('<action>')` and asks Cloudflare to confirm the token was
minted for that action. Binding the token to an action stops a token solved on
one screen from being replayed against another.

Protected today: `login`, `registerUser`, `requestPasswordReset`, and
`POST /session/authenticate/google`.

To protect a new operation:

```ts
@Mutation('someMutation')
@UseGuards(TurnstileGuard)
@TurnstileProtected('some_action')
async someMutation() { /* ... */ }
```

Render the widget with the same action string. A token is single use, so reset
the widget after a failed attempt — the login screen does this in its shared
error handler.

### Configuration

| Variable | Where | Notes |
| --- | --- | --- |
| `TURNSTILE_ENABLED` | API | While false the guard is a no-op |
| `CLOUDFLARE_TURNSTILE_SECRET_KEY` | API | Required once enabled |
| `NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY` | Web | Blank hides the widget |

Turn the flag on in every deployed environment, not just production — a
disabled challenge is a silently unprotected login. There is no native
Turnstile SDK, so the mobile app does not render a challenge; the API accepts
mobile sign-ins because the flag is evaluated per request, not per client.

## Google sign-in

### How it works

The client obtains a Google **ID token** and sends it to the API, which
verifies the signature against Google's published keys and checks that the
audience is one of this project's own OAuth client ids.

Never send a Google `sub`, a userinfo response, or a decoded profile as proof
of identity. Those are attacker-controlled values — anyone who learns a user's
Google subject identifier could sign in as them. Only a token that survives
`GoogleIdentityService.verifyIdToken` is trusted.

Account resolution on sign-in, in order:

1. An account already linked to that Google subject signs in.
2. Otherwise, if Google reports the address as verified and an account with
   that email exists and has no Google link yet, that account adopts the
   subject and signs in.
3. Otherwise the request is rejected.

Sign-in never creates an account — registration stays explicit so every account
lands in an organization. A Google subject can be linked to exactly one
account, enforced by a partial unique index on `users.googleSub`.

### GraphQL surface

```graphql
loginWithGoogle(input: GoogleAuthInput!): AuthPayload!
linkGoogleAccount(input: GoogleAuthInput!): User!
unlinkGoogleAccount: User!
```

`User.googleLinked` exposes the current state for profile screens.
`POST /session/authenticate/google` accepts the same ID token for REST clients.

### Configuration

| Variable | Where | Notes |
| --- | --- | --- |
| `GOOGLE_OAUTH_ENABLED` | API | While false every Google mutation is rejected |
| `GOOGLE_OAUTH_CLIENT_IDS` | API | Comma separated; list every platform's client id |
| `NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID` | Web | Blank hides the Google button |
| `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` | Mobile | |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | Mobile | |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | Mobile | Used by the Expo auth proxy |

Every client id a platform may present must appear in `GOOGLE_OAUTH_CLIENT_IDS`
or its tokens are rejected as wrong-audience.

The mobile flow uses `expo-auth-session`, which is a native module: after
adding the client ids you need a new development build, not just a reload.

## Xendit payments

### How it works

`createPayment` writes a `PENDING` payment record, then asks Xendit to create a
payment request and stores the returned checkout URL. The record is written
*before* the provider call so a callback arriving mid-round-trip still finds a
payment to attach to.

The `referenceId` is generated server-side (`payment-<id>`) and is never
supplied by the caller, so every callback traces back to exactly one payment.

Amounts are integers in the currency's **smallest unit** (centavos for PHP), so
money never passes through a floating point value. The gateway converts to
major units at the Xendit boundary.

### Settlement

A redirect back from the checkout page proves nothing — only the webhook
settles a payment. `POST /payment-webhooks/xendit` authenticates the caller by
constant-time comparison against `XENDIT_CALLBACK_TOKEN`, then applies the
status with two protections:

- **Redelivery**: an event id already in `webhookEventIds` is a no-op.
- **Terminal states**: a payment that reached `SUCCEEDED`, `FAILED`, or
  `EXPIRED` is never moved again, so a late or out-of-order callback cannot
  revive a settled payment.

Clients must re-read the payment after checkout rather than trusting how the
browser closed. `usePaymentCheckout` on mobile does exactly this.

### GraphQL surface

```graphql
createPayment(input: CreatePaymentInput!): Payment!
payment(id: ID!): Payment!
myPayments: [Payment!]!
```

All three require authentication, and reads are scoped to the caller's own
payments.

### Configuration

| Variable | Where | Notes |
| --- | --- | --- |
| `XENDIT_ENABLED` | API | While false `createPayment` is rejected |
| `XENDIT_SECRET_KEY` | API | Required once enabled |
| `XENDIT_CALLBACK_TOKEN` | API | Shared secret from the Xendit dashboard |
| `PAYMENTS_CURRENCY` | API | ISO 4217, defaults to `PHP` |
| `PAYMENTS_COUNTRY` | API | ISO 3166-1 alpha-2, defaults to `PH` |
| `PAYMENTS_SUCCESS_RETURN_URL` | API | Where Xendit sends a paying customer back |
| `PAYMENTS_FAILURE_RETURN_URL` | API | |

Point the Xendit dashboard's callback URL at
`https://<your-api>/payment-webhooks/xendit` and use the same token there.

### Adding another provider

`PaymentGateway` is the contract: `createPayment` and `getPayment`, plus the
enabled flag. Add a sibling of `XenditGateway` under `gateways/` and keep
webhook envelopes and signature checks on the concrete gateway — the payments
service knows nothing about any provider's request shape.
