# Authentication Guide

This document explains the authentication lifecycle for the app: signup, login, session validation, token refresh, and request authorization.

## Core Files Involved

- `account repository`
- `session controller`
- `apollo config`
- `jwt service`
- `auth guard`
- `refresh guard`
- `auth middleware`

These parts work together to create, validate, refresh, and authorize user sessions.

## Authentication Flow

### 1) Signup Flow (Mutation)

1. User signs up through GraphQL.
2. Frontend calls `createSession`, which sends `POST /session`.
3. Backend `session controller` creates a session record in the database with:
   - session id (`_id`)
   - account id
   - `jti`
   - `dateTimeCreated`
   - `dateTimeLastRefreshed`
4. Backend generates `accessToken` and `refreshToken` using JWT.
5. Backend returns `accessToken`, `refreshToken`, and `memberId`.
6. Frontend stores tokens in `localStorage` or cookies.

### 2) Login Flow (Mutation)

1. Frontend calls `authenticate`, which sends `POST /authenticate`.
2. Backend verifies the user password.
3. Backend deletes any previous session for that user.
4. Backend creates a new session record.
5. Backend signs a new `accessToken` and `refreshToken`.
6. Backend returns the new tokens.
7. Frontend replaces stored tokens with the new values.

### 3) Session Validation (`self` + visibility checks)

1. After successful authentication, global authenticated state becomes `true`.
2. A `self` query runs to load authenticated user data.
3. On page visibility change, frontend runs `getSession` to verify validity.
4. If required, tokens are refreshed.

### 4) Request Authorization

When authenticated, frontend attaches:

`Authorization: Bearer <accessToken>`

Backend middleware validates:

- token validity
- session existence in the database
- session is not expired or revoked

If valid, request proceeds.
If invalid, backend returns `401 Unauthorized`.

## Summary

- Authentication is session-based and uses JWT.
- Access and refresh tokens are issued on signup/login.
- Sessions are persisted in the database and can be revoked.
- Authenticated API requests include `Authorization` header.
- Backend validates session state before processing requests.
