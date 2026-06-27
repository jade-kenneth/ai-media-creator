# Authentication Module Implementation Guide

## What this document explains

This file explains how the current authentication infrastructure in `apps/app-api` works.

It focuses on the code that was already implemented for:

- JWT strategy
- GraphQL auth guard
- roles guard
- `@CurrentUser()`
- `@Roles()`
- `@Public()`
- request context wiring for GraphQL

It also points out what is **not** implemented yet, so this guide stays aligned with the repository.

## Simple analogy first

Think of the auth system like entering a secured building:

- `AuthModule` is the security office that installs the rules and equipment.
- `JwtStrategy` is the ID checker that knows how to read badges.
- `GraphqlAuthGuard` is the front-door guard that decides whether a request can enter.
- `RolesGuard` is the floor guard that checks whether the person is allowed into a restricted room.
- `@Public()` is a sign that says "this door is open to everyone".
- `@Roles(...)` is a sign that says "only managers can enter".
- `@CurrentUser()` is the receptionist handing the verified visitor record to the resolver.

## Current scope

The repository currently has the **authentication infrastructure**, but not the full auth feature flow yet.

Implemented now:

- JWT configuration
- JWT token validation strategy
- GraphQL request extraction
- user lookup from token payload
- role-based authorization support
- decorators for public routes, roles, and current user access

Not implemented yet:

- `registerMember`
- `login`
- `logout`
- `me`
- signing JWTs in `AuthService`
- applying guards to real resolvers

That means the "engine" is installed, but the actual login endpoints are still to be wired.

## File map

These files make up the current auth foundation:

- `apps/app-api/src/modules/auth/auth.module.ts`
- `apps/app-api/src/modules/auth/auth.constants.ts`
- `apps/app-api/src/modules/auth/auth-user.mapper.ts`
- `apps/app-api/src/modules/auth/types/auth-context.ts`
- `apps/app-api/src/modules/auth/strategies/jwt.strategy.ts`
- `apps/app-api/src/modules/auth/guards/graphql-auth.guard.ts`
- `apps/app-api/src/modules/auth/guards/roles.guard.ts`
- `apps/app-api/src/modules/auth/decorators/current-user.decorator.ts`
- `apps/app-api/src/modules/auth/decorators/roles.decorator.ts`
- `apps/app-api/src/modules/auth/decorators/public.decorator.ts`
- `apps/app-api/src/app.module.ts`

## High-level flow diagram

```text
Client sends GraphQL request
        |
        | Authorization: Bearer <jwt>
        v
GraphQLModule context() puts req/res into GraphQL context
        |
        v
Resolver uses GraphqlAuthGuard
        |
        | getRequest() converts GraphQL execution context -> req
        v
Passport JWT auth runs
        |
        v
JwtStrategy reads bearer token
        |
        v
JwtStrategy validates signature with JWT_SECRET
        |
        v
JwtStrategy loads the user from UsersService by payload.sub
        |
        +--> no user or inactive user -> UnauthorizedException
        |
        v
Mapped AuthenticatedUser is attached to req.user
        |
        v
RolesGuard optionally checks @Roles(...)
        |
        +--> wrong role -> ForbiddenException
        |
        v
Resolver can read req.user through @CurrentUser()
```

## Step-by-step implementation

## 1. `AppModule` makes GraphQL request data available

File: `apps/app-api/src/app.module.ts`

This line is the bridge between Nest GraphQL and the auth guards:

```ts
context: ({ req, res }): GraphqlContext => ({ req, res }),
```

Why this matters:

- GraphQL resolvers do not use the raw Express request directly.
- Guards and decorators still need access to the HTTP request so they can read headers and user data.
- This `context` function takes the incoming `req` and `res` and places them into the GraphQL execution context.

Without this, `GraphqlAuthGuard` would not be able to get `Authorization` headers from GraphQL requests.

### Without this -> what happens

If `context: ({ req, res }) => ({ req, res })` is missing, then GraphQL still executes resolvers, but the request object is not available in the place where your auth code expects it.

Practical result:

- `GqlExecutionContext.create(context).getContext()` will not reliably contain `req`
- `GraphqlAuthGuard.getRequest()` cannot hand a real request to Passport
- Passport cannot read `Authorization: Bearer <token>`
- the guard may fail even when the client sends a valid token

Example problem:

```text
Client sends:
Authorization: Bearer eyJ...

But GraphQL context does not expose req.

Result:
GraphqlAuthGuard cannot extract the request.
Passport sees no bearer token.
Request is treated as unauthenticated.
```

### With this -> what happens

When `AppModule` puts `req` and `res` into the GraphQL context:

- guards can access headers
- decorators can access `req.user`
- auth logic behaves in GraphQL the same way it normally behaves in HTTP

Example success path:

```text
Client sends:
Authorization: Bearer eyJ...

GraphQL context contains req.
GraphqlAuthGuard extracts req.
Passport reads the bearer token.
JwtStrategy validates it.
```

This claim is solid because `GraphqlAuthGuard` literally calls `gqlContext.getContext<GraphqlContext>().req`. If `req` is not placed there in `AppModule`, the guard has nothing to return.

## 2. `AuthModule` registers the auth infrastructure

File: `apps/app-api/src/modules/auth/auth.module.ts`

This module is marked with `@Global()`.

What that means:

- Its exported providers can be reused across the app.
- Other modules do not need to keep re-declaring the same auth providers.

### Without `@Global()` -> what happens

The auth providers still exist, but every feature module that wants to inject or reuse them must import `AuthModule` explicitly.

That creates friction:

- more repetitive module wiring
- easier to forget an import
- more chances for "Nest can’t resolve dependency" errors

### With `@Global()` -> what happens

The exported providers from `AuthModule` become reusable across the application once the module is imported in `AppModule`.

Important clarification:

- this does **not** mean "every resolver is protected"
- it only means "the auth providers are available to be used"

Inside the module:

### `PassportModule.register({ defaultStrategy: 'jwt' })`

This tells Nest Passport that JWT is the default authentication strategy for this module setup.

Why it exists:

- guards based on Passport can refer to the `jwt` strategy
- the auth system becomes standardized around one strategy name

#### Without this -> what happens

If Passport is not configured with the JWT strategy name, your guard setup becomes inconsistent.

Possible outcome:

- `AuthGuard('jwt')` looks for a strategy named `jwt`
- if the app never registers that strategy correctly, auth fails at runtime

#### With this -> what happens

Passport knows that the default auth path for this module is JWT-based, and the guard can consistently invoke the `jwt` strategy.

### `JwtModule.registerAsync(...)`

JWT configuration is loaded from `ConfigService`.

It reads:

- `JWT_SECRET`
- `JWT_EXPIRATION`

Why async registration is used:

- config values come from environment validation
- setup happens during Nest bootstrapping

#### Without this -> what happens

If `JwtModule` is not registered:

- the app has no central JWT signing/verification configuration
- later login code cannot reliably sign tokens with the same secret and expiration rules
- auth configuration becomes scattered and error-prone

If config is hardcoded instead of loaded from `ConfigService`:

- changing environments becomes dangerous
- dev and prod can accidentally use the wrong secret or expiration

#### With this -> what happens

JWT settings are resolved from validated environment variables during startup.

That means:

- invalid config fails early
- the same config source is shared across the auth system
- future token signing code can inject `JwtService` and use the same setup

Example:

```text
Without registration:
login code may sign with one secret, strategy may verify with another.

With registration:
both signing and verification can use the same JwtModule config.
```

### `parseJwtExpiration(value)`

This helper converts the environment value into something Nest JWT accepts.

Why this helper exists:

- Nest JWT accepts either a number or an `ms` duration string type
- env values arrive as plain strings
- if the env value is `"3600"`, it becomes `3600`
- if the env value is `"1d"` or `"15m"`, it stays a duration string

#### Without this -> what happens

TypeScript complains because environment values are plain strings, while Nest JWT expects a more specific type for `expiresIn`.

Actual consequence in this repo:

- `typecheck` fails
- build safety is reduced if developers bypass typing instead of normalizing the value

#### With this -> what happens

The env value is normalized into a type that `JwtModule` accepts.

Examples:

```text
Input env value: "3600"
Result passed to JwtModule: 3600

Input env value: "1d"
Result passed to JwtModule: "1d"
```

### Providers registered in the module

- `AuthService`
- `AuthResolver`
- `JwtStrategy`
- `GraphqlAuthGuard`
- `RolesGuard`

Important note:

- `AuthService` and `AuthResolver` are still placeholders
- the infrastructure is ready, but auth operations are not implemented yet

#### Without these providers -> what happens

If `JwtStrategy`, `GraphqlAuthGuard`, or `RolesGuard` are not registered as providers:

- Nest cannot instantiate them
- dependency injection fails
- auth cannot run

#### With these providers -> what happens

Nest can construct the strategy and guards with their dependencies, such as:

- `ConfigService`
- `UsersService`
- `Reflector`

### Exports

The module exports:

- `AuthService`
- `JwtModule`
- `PassportModule`
- `GraphqlAuthGuard`
- `RolesGuard`

This makes the auth building blocks reusable in other modules.

#### Without exports -> what happens

The code compiles inside `AuthModule`, but other modules cannot reuse those providers cleanly.

Example:

```text
You want to use GraphqlAuthGuard in another module.
If AuthModule does not export it, Nest cannot provide it outside AuthModule.
```

#### With exports -> what happens

Other modules can use the guards and JWT setup without redefining them.

## 3. `auth.constants.ts` defines shared metadata keys

File: `apps/app-api/src/modules/auth/auth.constants.ts`

```ts
export const IS_PUBLIC_KEY = 'isPublic';
export const ROLES_KEY = 'roles';
```

These are metadata keys used by decorators and guards.

Why this matters:

- `@Public()` writes metadata using `IS_PUBLIC_KEY`
- `GraphqlAuthGuard` and `RolesGuard` read that metadata
- `@Roles(...)` writes metadata using `ROLES_KEY`
- `RolesGuard` reads that metadata

This avoids hardcoding string literals in multiple files.

### Without this -> what happens

If every decorator and guard hardcodes its own string key, small typos break authorization silently.

Example bug:

```text
Decorator writes: "role"
Guard reads: "roles"

Result:
RolesGuard sees no metadata.
Protected route behaves like no role was required.
```

### With this -> what happens

The decorator and the guard use the exact same metadata keys from one place.

That makes the contract explicit:

- `@Public()` writes `IS_PUBLIC_KEY`
- guards read `IS_PUBLIC_KEY`
- `@Roles()` writes `ROLES_KEY`
- `RolesGuard` reads `ROLES_KEY`

## 4. `auth-context.ts` defines the request and payload contracts

File: `apps/app-api/src/modules/auth/types/auth-context.ts`

This file defines three important types.

### `JwtPayload`

```ts
{
  sub: string;
  email: string;
  role: UserRole;
}
```

This describes what the server expects to find inside the JWT payload.

Important detail:

- the strategy currently trusts `sub` the most
- it reloads the user from the database instead of trusting token fields alone

#### Without this type -> what happens

If the payload shape is left vague, developers can easily sign one payload shape and validate another.

Example mismatch:

```text
Login signs: { userId: "123" }
Strategy expects: { sub: "123" }

Result:
payload.sub is undefined
user lookup fails
authentication fails
```

#### With this type -> what happens

The intended token contract is clear: the strategy expects `sub`, `email`, and `role`.

### `AuthenticatedUser`

This is the safe user shape attached to `req.user`.

It only contains:

- `id`
- `email`
- `role`
- `isActive`

It intentionally does **not** include `passwordHash`.

#### Without this separate type -> what happens

The request might carry the raw database user shape, including fields that should not travel through resolver code.

Risk:

- resolver code may accidentally depend on `passwordHash`
- sensitive persistence fields spread too far through the app

#### With this type -> what happens

The request only carries the verified identity fields needed for authorization and resolver logic.

### `AuthenticatedRequest` and `GraphqlContext`

These types describe:

- the request after auth has attached `user`
- the shape returned by the GraphQL `context` function

This gives guards and decorators a consistent TypeScript contract.

#### Without these types -> what happens

Every file invents its own idea of what `req.user` looks like.

That usually causes:

- repeated casts
- weaker autocomplete
- more accidental mistakes

#### With these types -> what happens

All auth-related files agree on:

- where `req` lives
- what `req.user` looks like
- what token payload shape the strategy expects

## 5. `auth-user.mapper.ts` removes unnecessary user fields

File: `apps/app-api/src/modules/auth/auth-user.mapper.ts`

This mapper converts a `UserRecord` into the smaller `AuthenticatedUser` object.

Why this exists:

- repository records contain persistence-layer fields like `passwordHash`
- resolvers and guards only need a small verified user object
- the request should carry the minimum useful identity data

This is a separation-of-concerns step:

- repository model = storage shape
- authenticated request model = runtime identity shape

### Without this mapper -> what happens

Strategy code usually ends up doing one of two bad things:

- returning the whole repository object directly
- hand-building user objects repeatedly in multiple files

Problems that follow:

- duplicated mapping logic
- inconsistent request user shape
- higher chance of leaking storage-only fields

### With this mapper -> what happens

There is one place that converts a repository user into a request-safe authenticated identity.

Example:

```text
Database user:
{
  id: "u1",
  email: "a@b.com",
  role: "ADMIN",
  isActive: true,
  passwordHash: "$2b$..."
}

Mapped authenticated user:
{
  id: "u1",
  email: "a@b.com",
  role: "ADMIN",
  isActive: true
}
```

## 6. `JwtStrategy` validates the token and reloads the user

File: `apps/app-api/src/modules/auth/strategies/jwt.strategy.ts`

This is the core of authentication.

### Constructor

The strategy reads `JWT_SECRET` from `ConfigService`.

Then it configures Passport JWT:

- `jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()`
- `ignoreExpiration: false`
- `secretOrKey: secret`

What this means:

- the token must come from the `Authorization: Bearer <token>` header
- expired tokens are rejected
- the signature is checked using the configured secret

#### Without this constructor config -> what happens

If the strategy does not define where to read the token from:

- Passport does not know how to extract the JWT

If it does not define `secretOrKey`:

- Passport cannot verify the token signature

If it ignores expiration:

- expired tokens may continue to work, which weakens security

#### With this constructor config -> what happens

The strategy has a strict contract:

- only bearer tokens are accepted
- only tokens signed with the server secret are accepted
- expired tokens are rejected automatically

Example:

```text
Request header:
Authorization: Bearer eyJ...

Strategy reads the header, verifies the signature, and rejects it if expired.
```

### `validate(payload)`

This runs after the token signature and expiration are accepted.

Step by step:

1. Read `payload.sub`
2. Ask `UsersService.findById(payload.sub)` for the real user record
3. If no user exists, throw `UnauthorizedException`
4. If the user exists but `isActive` is `false`, throw `UnauthorizedException`
5. Convert the user into `AuthenticatedUser`
6. Return that value so Passport can attach it to `req.user`

Important design choice:

- the database is treated as the source of truth
- the code does not blindly trust the role/email embedded in the token

That is a good security posture.

#### Without database reload -> what happens

Suppose the token says:

```json
{ "sub": "u1", "role": "ADMIN" }
```

But the real user in the database was later changed to:

```json
{ "id": "u1", "role": "RESIDENT", "isActive": false }
```

If the strategy trusts the token only:

- the old admin privilege may continue to work
- a deactivated user may continue to access the system

#### With database reload -> what happens

The strategy checks the live record:

- missing user -> reject
- inactive user -> reject
- active user -> attach fresh identity to `req.user`

This is why the claim is correct: the code explicitly calls `usersService.findById(payload.sub)` before allowing the request to proceed.

## 7. `GraphqlAuthGuard` adapts Passport auth to GraphQL

File: `apps/app-api/src/modules/auth/guards/graphql-auth.guard.ts`

Passport auth guards are built around HTTP request objects.
GraphQL resolver execution is different, so this guard adapts the two systems.

### `canActivate(context)`

This method first checks whether the resolver or class is marked as public.

If `@Public()` metadata is found:

- the guard returns `true`
- authentication is skipped

Otherwise:

- it calls `super.canActivate(context)`
- Passport continues with the `jwt` strategy

#### Without this method -> what happens

If the guard never checks `@Public()`, then public routes still go through authentication.

Example:

```ts
@Public()
@Query('login')
login() { ... }
```

Result without the metadata check:

- the route still demands a token
- login would be blocked unless the user is already authenticated

That would be logically wrong for public operations.

#### With this method -> what happens

Public routes bypass auth, while protected routes continue to Passport JWT validation.

### `getRequest(context)`

This is the most important GraphQL-specific part.

It converts the Nest execution context into a GraphQL execution context:

```ts
const gqlContext = GqlExecutionContext.create(context);
return gqlContext.getContext<GraphqlContext>().req;
```

Why this is needed:

- Passport expects an HTTP request object
- GraphQL stores it inside its own context object
- this method extracts the real request so Passport can read headers

#### Without overriding `getRequest()` -> what happens

The default Passport guard behavior is HTTP-oriented, not GraphQL-oriented.

In practice:

- the guard may look in the wrong place for the request
- bearer token extraction fails
- valid GraphQL requests are treated as anonymous

#### With overriding `getRequest()` -> what happens

The GraphQL request is translated into the HTTP request object Passport expects.

### `handleRequest(...)`

This method controls what happens after Passport finishes.

If there is an error:

- rethrow it

If there is no authenticated user:

- throw `UnauthorizedException('Authentication required.')`

If the user exists:

- return it

That returned value becomes `req.user`.

#### Without this method -> what happens

You rely on default Passport behavior, which may return errors in a less explicit way for your GraphQL API.

That can make auth failures harder to reason about.

#### With this method -> what happens

The guard forces a clear outcome:

- error from strategy -> throw it
- no user -> throw `UnauthorizedException('Authentication required.')`
- valid user -> attach it to the request

This creates predictable behavior for downstream resolvers and decorators.

## 8. `RolesGuard` adds authorization on top of authentication

File: `apps/app-api/src/modules/auth/guards/roles.guard.ts`

Authentication answers:

- "Who is this user?"

Authorization answers:

- "Is this user allowed to do this action?"

That second question is handled by `RolesGuard`.

### `canActivate(context)`

Step by step:

1. Check `@Public()` metadata first
2. If public, allow access immediately
3. Read role metadata from `@Roles(...)`
4. If no roles are required, allow access
5. Read `req.user` from GraphQL context
6. If no user exists, throw `UnauthorizedException`
7. If the user role is in the allowed roles list, allow access
8. Otherwise throw `ForbiddenException`

Why both exceptions exist:

- `UnauthorizedException` means "you are not authenticated"
- `ForbiddenException` means "you are authenticated, but not allowed"

That distinction is important for both debugging and correct API semantics.

### Without this guard -> what happens

Authentication alone only proves identity.

Example:

```text
Member user has a valid JWT.
Route is supposed to be admin-only.

Without RolesGuard:
the member can still enter, because no role check runs.
```

### With this guard -> what happens

The request must satisfy both layers:

- authenticated identity
- allowed role

Example:

```ts
@UseGuards(GraphqlAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
```

Now the request flow becomes:

- no token -> `401 Unauthorized`
- valid token but role is `RESIDENT` -> `403 Forbidden`
- valid token and role is `ADMIN` -> resolver runs

This is why the guard is authorization, not authentication.

## 9. The decorators are just metadata writers and readers

### `@Public()`

File: `apps/app-api/src/modules/auth/decorators/public.decorator.ts`

This decorator writes:

- `IS_PUBLIC_KEY = true`

It does not skip auth by itself.
The guard must check for that metadata, which `GraphqlAuthGuard` and `RolesGuard` now do.

#### Without `@Public()` -> what happens

A route that should be open to unauthenticated users can accidentally be protected once guards are applied.

Example:

```text
login
registerMember
health-like public queries
```

Without `@Public()`, these operations would require a token once auth guards are attached.

#### With `@Public()` -> what happens

The guard sees the metadata and intentionally skips auth for that route.

### `@Roles(...roles)`

File: `apps/app-api/src/modules/auth/decorators/roles.decorator.ts`

This decorator writes:

- `ROLES_KEY = [roles...]`

`RolesGuard` reads that list and compares it to `req.user.role`.

#### Without `@Roles()` -> what happens

`RolesGuard` has no required role list to enforce, so the route behaves like "any authenticated user may enter."

That may be correct for `me`, but wrong for admin-only operations.

#### With `@Roles(UserRole.ADMIN)` -> what happens

The route clearly declares its authorization rule in the resolver itself.

### `@CurrentUser()`

File: `apps/app-api/src/modules/auth/decorators/current-user.decorator.ts`

This decorator reads:

- `req.user` from the GraphQL context

It is a convenience decorator so resolvers do not need to manually unpack:

```ts
GqlExecutionContext.create(context).getContext().req.user
```

Instead, a resolver can do this:

```ts
@CurrentUser() user: AuthenticatedUser
```

That keeps resolver code much cleaner.

#### Without `@CurrentUser()` -> what happens

Every resolver has to manually reach into the GraphQL context to get the authenticated user.

That creates:

- repetitive code
- weaker readability
- higher chance of inconsistent access patterns

#### With `@CurrentUser()` -> what happens

Resolvers ask directly for the authenticated user as a parameter.

Example:

```ts
me(@CurrentUser() user: AuthenticatedUser) {
  return user;
}
```

That is easier to read and much harder to misuse.

## 10. What happens during a protected resolver call

Here is the real runtime sequence for a protected GraphQL resolver.

```text
1. Client calls a resolver and sends Authorization: Bearer <token>
2. GraphQL context stores req/res
3. GraphqlAuthGuard runs
4. Guard checks if @Public() is present
5. If not public, Passport JWT strategy runs
6. JwtStrategy verifies signature and expiration
7. JwtStrategy loads user by payload.sub
8. Valid user is mapped to AuthenticatedUser
9. req.user is populated
10. RolesGuard reads @Roles(...) if used
11. If role matches, resolver executes
12. Resolver can access the authenticated user via @CurrentUser()
```

### Concrete request examples

#### Example A: without token

```text
Client calls:
query { me { id email } }

No Authorization header.
GraphqlAuthGuard runs.
Passport cannot extract a token.
handleRequest() throws UnauthorizedException.
Result: 401-style auth failure in GraphQL.
```

#### Example B: with invalid token

```text
Client calls:
query { me { id email } }

Authorization: Bearer invalid-token

Passport reads the token.
Signature verification fails.
JwtStrategy does not authenticate the user.
Result: UnauthorizedException.
```

#### Example C: with valid token but wrong role

```text
Client calls an admin-only resolver.
Authorization: Bearer valid-member-token

GraphqlAuthGuard succeeds.
req.user is set.
RolesGuard reads @Roles(UserRole.ADMIN).
req.user.role is RESIDENT.
Result: ForbiddenException.
```

#### Example D: with valid admin token

```text
Client calls an admin-only resolver.
Authorization: Bearer valid-admin-token

GraphqlAuthGuard succeeds.
JwtStrategy loads active admin user.
RolesGuard approves the ADMIN role.
Resolver executes normally.
```

## 11. Example usage in a resolver

This is what a future implementation might look like.

```ts
import { Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { UserRole } from 'src/graphql/generated/graphql';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { Roles } from './decorators/roles.decorator';
import { GraphqlAuthGuard } from './guards/graphql-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import type { AuthenticatedUser } from './types/auth-context';

@Resolver()
export class ExampleResolver {
  @Query('login')
  @Public()
  login() {
    return true;
  }

  @Query('me')
  @UseGuards(GraphqlAuthGuard)
  me(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }

  @Query('adminDashboard')
  @UseGuards(GraphqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  adminDashboard() {
    return true;
  }
}
```

## 12. Important gotchas

### Gotcha 1: `@Public()` does nothing unless a guard is actually running

This is the most important thing to understand in the current codebase.

Right now:

- the guards exist
- they are exported
- they are reusable

But they are **not** yet registered globally with `APP_GUARD`, and they are not yet applied on resolvers.

That means:

- `@Public()` is ready
- but it only matters once the guard is applied somewhere

### Gotcha 2: `AuthModule` being global does not mean all resolvers are protected

`@Global()` makes providers reusable.
It does **not** automatically enforce authentication everywhere.

Protection only happens when:

- a resolver uses `@UseGuards(GraphqlAuthGuard)`
- a resolver uses `@UseGuards(GraphqlAuthGuard, RolesGuard)`
- or the project later registers the guards as `APP_GUARD`

### Gotcha 3: JWT payload is not the final source of truth

The strategy still reloads the user from the database.

That is intentional because:

- a token may contain stale role data
- a user may have been deactivated after the token was issued

The code currently protects against that by checking the database.

### Gotcha 4: `AuthService` is not the full auth service yet

At the moment `AuthService` is just a placeholder with dependency wiring.

The next real auth step will likely be:

- inject `JwtService`
- hash and compare passwords
- sign tokens during `login`
- implement `me`

## 13. Why this implementation is a good foundation

This setup is solid because it keeps responsibilities separated:

- `AppModule` exposes request context
- `AuthModule` wires auth dependencies
- `JwtStrategy` authenticates identity
- `GraphqlAuthGuard` adapts Passport to GraphQL
- `RolesGuard` handles authorization
- decorators keep resolver code clean
- the mapper prevents leaking storage-only fields

That structure is maintainable and easy to extend.

## 14. Recommended next implementation steps

To complete the auth feature, the next steps should be:

1. implement `registerMember`
2. implement `login`
3. hash and compare passwords with `bcrypt`
4. sign JWTs using `JwtService`
5. implement `me`
6. apply `GraphqlAuthGuard` and `RolesGuard` to protected resolvers
7. decide whether to keep local `@UseGuards(...)` usage or move to global `APP_GUARD`

## 15. Beginner Appendix: Why `forwardRef` was needed

This part explains the dependency flow between:

- `UsersModule`
- `MembersModule`
- `UsersResolver`
- `MembersService`
- `UsersService`

This is not directly JWT logic, but it matters because the `User` and `MemberProfile` GraphQL types point to each other.

### Simple analogy

Imagine two office desks:

- Desk A says: "For this form, ask Desk B first."
- Desk B says: "For that form, ask Desk A first."

If both desks insist on the other one going first, the receptionist gets stuck.

`forwardRef` means:

"Write down the desk name now, but connect the real desk later."

### The GraphQL relationship

The schema has a two-way relationship:

```text
User -----------------------> MemberProfile
  memberProfile field         user field
```

That means:

- a `User` may need member data
- a `MemberProfile` may need user data

### The runtime dependency relationship

In the actual Nest code, that becomes:

```text
UsersResolver ----------------> MembersService
MembersService -------------> UsersService
```

Why?

- `UsersResolver` resolves `User.memberProfile`
- `MembersService` can resolve the related user for a member

### Step by step: from `User` to `MemberProfile`

File involved:

- `apps/app-api/src/modules/users/users.resolver.ts`

This resolver contains:

```ts
constructor(private readonly membersService: MembersService) {}
```

And:

```ts
@ResolveField('memberProfile')
async memberProfile(@Parent() user: User) {
  return this.membersService.findByUserId(user.id);
}
```

What this means:

1. GraphQL is currently resolving a `User`
2. The client also requested `memberProfile`
3. `UsersResolver.memberProfile(...)` runs
4. That code needs member data
5. So it calls `MembersService`

So the dependency becomes:

```text
UsersResolver -> MembersService
```

Because `UsersResolver` lives inside `UsersModule`, that forces:

```text
UsersModule -> MembersModule
```

### Step by step: from `MemberProfile` back to `User`

File involved:

- `apps/app-api/src/modules/members/members.service.ts`

This service contains:

```ts
constructor(
  ...
  private readonly usersService: UsersService,
) {}
```

And it also has logic like:

```ts
return this.usersService.findById(member.userId);
```

What this means:

1. Member logic has a `member.userId`
2. It needs to fetch the related `User`
3. So `MembersService` calls `UsersService`

So the dependency becomes:

```text
MembersService -> UsersService
```

Because `MembersService` lives inside `MembersModule`, that forces:

```text
MembersModule -> UsersModule
```

### Now the cycle becomes visible

Put both directions together:

```text
UsersModule -> MembersModule
MembersModule -> UsersModule
```

That is the circular dependency.

### Without `forwardRef` -> what happens

If both modules import each other normally, Nest tries to resolve them immediately.

The flow looks like this:

```text
1. Nest starts building UsersModule
2. UsersModule says: I need MembersModule
3. Nest starts building MembersModule
4. MembersModule says: I need UsersModule
5. But UsersModule is still being built
6. Nest hits a circular dependency problem
```

Why this breaks:

- `UsersModule` cannot finish until `MembersModule` is ready
- `MembersModule` cannot finish until `UsersModule` is ready
- both are waiting on each other at the same time

### With `forwardRef` -> what happens

When you write:

```ts
forwardRef(() => MembersModule)
```

or:

```ts
forwardRef(() => UsersModule)
```

you are telling Nest:

"Yes, I need this module, but do not resolve it immediately. Resolve it after both modules are known."

The flow becomes:

```text
1. Nest starts building UsersModule
2. It sees forwardRef(() => MembersModule)
3. It records that MembersModule will be connected later

4. Nest starts building MembersModule
5. It sees forwardRef(() => UsersModule)
6. It records that UsersModule will be connected later

7. Nest now knows both modules exist
8. Nest links the references afterward
```

That is why `forwardRef` fixes the problem: it changes the timing of resolution.

### Visual summary

```text
Without forwardRef:

UsersModule -> MembersModule -> UsersModule -> stuck


With forwardRef:

UsersModule --later--> MembersModule
MembersModule --later--> UsersModule

Nest defines both first, then links them.
```

### Important beginner distinction

There are two different kinds of circular dependency problems in Nest:

1. module circular dependency
2. provider circular dependency

What we fixed here is the **module** circular dependency.

That means:

- `UsersModule` imports `MembersModule`
- `MembersModule` imports `UsersModule`

This is different from a provider circular dependency like:

```text
UsersService -> MembersService
MembersService -> UsersService
```

That direct service-to-service cycle is not what exists right now.

Current situation:

- `UsersResolver` depends on `MembersService`
- `MembersService` depends on `UsersService`

So:

- the module cycle is real
- the direct provider cycle is not symmetrical

### Why this design happened naturally

This is not a random mistake. It happened because the data relationship itself is two-way:

- `User` can expose `memberProfile`
- `MemberProfile` can expose `user`

When two GraphQL types reference each other, it is common for the Nest modules around them to become interconnected too.

### Practical takeaway

Use `forwardRef` when:

- Module A imports Module B
- and Module B also imports Module A

Do not think of it as "special auth syntax."
It is just Nest’s way of saying:

"I know this dependency exists. Resolve it later so the app can finish bootstrapping."

## Final summary

The current auth module does **not** yet log users in, but it already provides the full structural backbone for authentication and authorization.

In plain terms:

- the app knows how to read a JWT
- verify it
- load the real user behind it
- attach that user to the request
- and optionally enforce role checks

The missing part is the business flow that creates tokens and applies these guards to actual GraphQL operations.
