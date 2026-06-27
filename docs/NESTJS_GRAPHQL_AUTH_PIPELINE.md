# NestJS GraphQL Auth Pipeline — Request Lifecycle & Architecture

> **Project:** Organization Connect API (`org-system-api`)
> **Stack:** NestJS · Apollo Server · Passport JWT · MongoDB · Schema-First GraphQL

---

## Table of Contents

1. [High-Level Architecture](#1-high-level-architecture)2. [The Context Bridge — Why It Matters](#2-the-context-bridge--why-it-matters)
2. [ExecutionContext — The Universal Adapter](#3-executioncontext--the-universal-adapter)
3. [Full Request Lifecycle](#4-full-request-lifecycle)
4. [Auth Guard Chain](#5-auth-guard-chain)
   - [GraphqlAuthGuard (JWT Authentication)](#51-graphqlauthguard-jwt-authentication)
   - [RolesGuard (Authorization)](#52-rolesguard-authorization)
5. [Decorators](#6-decorators)
   - [@Public()](#61-public)
   - [@Roles()](#62-roles)
   - [@CurrentUser()](#63-currentuser)
6. [JWT Strategy](#7-jwt-strategy)
7. [Supporting Types & Constants](#8-supporting-types--constants)
8. [Three Access Levels](#9-three-access-levels)
9. [Wired Diagram — End-to-End Flow](#10-wired-diagram--end-to-end-flow)
10. [File Reference](#11-file-reference)

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Web / Mobile)                    │
│                                                                 │
│   POST /graphql                                                 │
│   Headers: { Authorization: "Bearer <jwt>" }                    │
│   Body:    { query: "{ announcements { ... } }" }               │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                     EXPRESS HTTP SERVER                           │
│  (NestFactory.create → app.enableCors → app.listen)              │
│                                                                  │
│  Receives raw HTTP request with headers, cookies, body           │
│  Creates Express `req` and `res` objects                         │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                APOLLO SERVER (GraphQL Engine)                     │
│                                                                  │
│  Parses GraphQL query, validates against .gql schemas            │
│  Resolves which resolver method to call                          │
│                                                                  │
│  ★ CONTEXT BRIDGE ★                                              │
│  context: ({ req, res }) => ({ req, res })                       │
│  Passes Express objects into GraphQL context                     │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                    NESTJS PIPELINE                                │
│                                                                  │
│  ExecutionContext created → Guards → Decorators → Resolver       │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. The Context Bridge — Why It Matters

In `app.module.ts`, inside the `GraphQLModule.forRootAsync` configuration:

```typescript
context: ({ req, res }): GraphqlContext => ({ req, res }),
```

### What this line does

Apollo Server operates on its own — it receives HTTP requests, parses the GraphQL query, and calls resolvers. By default, **it does NOT pass Express's `req`/`res` objects** into the GraphQL resolver context.

This single line **bridges** the Express HTTP layer and the GraphQL execution layer:

```
Express HTTP World                    GraphQL World
─────────────────                    ───────────────
  req.headers.authorization    ──►    context.req.headers.authorization
  req.cookies                  ──►    context.req.cookies
  res.setHeader(...)           ──►    context.res.setHeader(...)
```

### Why auth breaks without it

Without this bridge:

1. `GraphqlAuthGuard.getRequest()` calls `gqlContext.getContext().req` → gets `undefined`
2. Passport's `AuthGuard('jwt')` can't extract the `Authorization` header
3. JWT is never validated
4. **Every authenticated request fails** with `UnauthorizedException`

### The type contract

```typescript
// src/modules/auth/types/auth-context.ts
export interface GraphqlContext {
  req: AuthenticatedRequest; // Express Request + optional user
  res?: Response; // Express Response
}
```

---

## 3. ExecutionContext — The Universal Adapter

`ExecutionContext` is NestJS's transport-agnostic wrapper. It is created **internally** by NestJS's `ExternalContextCreator` at the moment a request hits a handler.

```
ExecutionContext
├── getHandler()   → reference to the resolver method (e.g., createAnnouncement)
├── getClass()     → reference to the resolver class (e.g., AnnouncementsResolver)
├── getArgs()      → transport-specific arguments
├── getType()      → 'http' | 'ws' | 'rpc' | 'graphql'
└── switchToHttp() / switchToWs() / switchToRpc()
```

### In GraphQL context

Since GraphQL requests arrive via HTTP but have a different argument shape (`root`, `args`, `context`, `info`), NestJS provides `GqlExecutionContext` to properly unwrap them:

```typescript
const gqlContext = GqlExecutionContext.create(context);
gqlContext.getContext<GraphqlContext>().req; // ← Express request object
```

### Who creates it?

You **never** instantiate `ExecutionContext` yourself. NestJS creates it via `ExecutionContextHost`:

```
Incoming Request
    │
    ▼
NestJS Router / GraphQL Plugin
    │
    ▼
ExternalContextCreator.create()
    │
    ▼
new ExecutionContextHost([root, args, context, info], ResolverClass, handlerMethod)
    │
    ▼
Passed to Guards → Interceptors → Pipes → Handler
```

---

## 4. Full Request Lifecycle

```
Client sends POST /graphql
    │
    ▼
┌─── Express ──────────────────────────────────────────────────┐
│   Raw HTTP: headers, body parsed                             │
│   req.headers.authorization = "Bearer eyJhbGci..."           │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
┌─── Apollo Server ────────────────────────────────────────────┐
│   1. Parse GraphQL query string                              │
│   2. Validate against .gql schema definitions                │
│   3. Execute context function:                               │
│      context: ({ req, res }) => ({ req, res })               │
│   4. Identify resolver: AnnouncementsResolver.create...      │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
┌─── NestJS Pipeline ──────────────────────────────────────────┐
│                                                              │
│   ┌─ ExecutionContext Created ────────────────────────────┐   │
│   │  Wraps [root, args, gqlContext, info]                │   │
│   │  + handler ref + class ref                           │   │
│   └──────────────────────────┬───────────────────────────┘   │
│                              │                               │
│                              ▼                               │
│   ┌─ GUARD 1: GraphqlAuthGuard ─────────────────────────┐   │
│   │                                                      │   │
│   │  1. Check @Public() metadata → skip if true          │   │
│   │  2. getRequest(): GqlExecutionContext → context.req  │   │
│   │  3. Passport extracts JWT from Authorization header  │   │
│   │  4. JwtStrategy.validate() → lookup user in DB       │   │
│   │  5. Attach user to req.user                          │   │
│   │  6. handleRequest() → throw if no user               │   │
│   │                                                      │   │
│   │  Result: req.user = { id, email, role, isActive }    │   │
│   └──────────────────────────┬───────────────────────────┘   │
│                              │                               │
│                              ▼                               │
│   ┌─ GUARD 2: RolesGuard ───────────────────────────────┐   │
│   │                                                      │   │
│   │  1. Check @Public() metadata → skip if true          │   │
│   │  2. Read @Roles() metadata → required roles array    │   │
│   │  3. If no roles required → allow (any auth user)     │   │
│   │  4. Extract user from gqlContext.req.user            │   │
│   │  5. Check user.role ∈ requiredRoles                  │   │
│   │  6. Throw ForbiddenException if not matched          │   │
│   │                                                      │   │
│   │  Result: user has sufficient role                    │   │
│   └──────────────────────────┬───────────────────────────┘   │
│                              │                               │
│                              ▼                               │
│   ┌─ PARAM DECORATORS ──────────────────────────────────┐   │
│   │                                                      │   │
│   │  @CurrentUser() → extracts req.user from context     │   │
│   │  @Args('input') → extracts GraphQL arguments         │   │
│   │                                                      │   │
│   └──────────────────────────┬───────────────────────────┘   │
│                              │                               │
│                              ▼                               │
│   ┌─ RESOLVER METHOD ───────────────────────────────────┐   │
│   │                                                      │   │
│   │  async createAnnouncement(input, user) {             │   │
│   │    return this.service.createAnnouncement(input, ..) │   │
│   │  }                                                   │   │
│   │                                                      │   │
│   └──────────────────────────┬───────────────────────────┘   │
│                              │                               │
└──────────────────────────────┼───────────────────────────────┘
                               │
                               ▼
                    GraphQL JSON Response
                    { "data": { "createAnnouncement": { ... } } }
```

---

## 5. Auth Guard Chain

Guards execute **in order** as specified in `@UseGuards()`:

```typescript
@UseGuards(GraphqlAuthGuard, RolesGuard)  // Auth first, then roles
```

### 5.1 GraphqlAuthGuard (JWT Authentication)

**File:** `src/modules/auth/guards/graphql-auth.guard.ts`

**Purpose:** Verifies the JWT token and attaches the authenticated user to `req.user`.

```typescript
@Injectable()
export class GraphqlAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  // Step 1: Check if handler is marked @Public()
  override canActivate(context: ExecutionContext) {
    if (this.isPublic(context)) return true;
    return super.canActivate(context); // Delegates to Passport
  }

  // Step 2: Tell Passport where to find the HTTP request
  override getRequest(context: ExecutionContext) {
    const gqlContext = GqlExecutionContext.create(context);
    return gqlContext.getContext<GraphqlContext>().req; // ← uses the bridge!
  }

  // Step 3: Handle the result of Passport validation
  override handleRequest<TUser = AuthenticatedUser>(
    error: unknown,
    user: TUser | false | null,
  ): TUser {
    if (error) throw error;
    if (!user) throw new UnauthorizedException('Authentication required.');
    return user;
  }

  // Helper: read @Public() / @SetMetadata(IS_PUBLIC_KEY, true)
  private isPublic(context: ExecutionContext): boolean {
    return (
      this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? false
    );
  }
}
```

**Internal flow when `super.canActivate()` is called:**

```
super.canActivate(context)
    │
    ├── calls this.getRequest(context) → gets Express req
    │
    ├── ExtractJwt.fromAuthHeaderAsBearerToken()
    │   extracts "eyJhbGci..." from "Bearer eyJhbGci..."
    │
    ├── Verifies JWT signature + expiration using JWT_SECRET
    │
    ├── Calls JwtStrategy.validate(payload)
    │   └── Looks up user in MongoDB, checks isActive
    │   └── Returns AuthenticatedUser object
    │
    ├── Attaches result to req.user
    │
    └── Calls this.handleRequest(err, user)
        └── Throws or returns the user
```

### 5.2 RolesGuard (Authorization)

**File:** `src/modules/auth/guards/roles.guard.ts`

**Purpose:** Checks if the authenticated user has the required role(s) to access the resource.

```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Public endpoints skip role checks
    if (this.isPublic(context)) return true;

    // 2. Read @Roles() metadata
    const requiredRoles =
      this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    // 3. No @Roles() decorator → any authenticated user can access
    if (requiredRoles.length === 0) return true;

    // 4. Get user from context (attached by GraphqlAuthGuard)
    const gqlContext = GqlExecutionContext.create(context);
    const user = gqlContext.getContext<GraphqlContext>()?.req?.user;

    if (!user) throw new UnauthorizedException('Authentication required.');

    // 5. Check role match
    if (requiredRoles.includes(user.role)) return true;

    throw new ForbiddenException(
      `This action requires one of: ${requiredRoles.join(', ')}.`,
    );
  }
}
```

**Key insight:** `RolesGuard` relies on `GraphqlAuthGuard` having already run and attached `user` to `req.user`. That's why guard order matters: `@UseGuards(GraphqlAuthGuard, RolesGuard)`.

---

## 6. Decorators

### 6.1 @Public()

**File:** `src/modules/auth/decorators/public.decorator.ts`

```typescript
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

**What it does:** Attaches `{ isPublic: true }` as metadata on the handler. Both guards check for this and skip their logic entirely.

**Usage:**

```typescript
@Query('announcements')
@Public()
async getAnnouncements() { ... }
```

### 6.2 @Roles()

**File:** `src/modules/auth/decorators/roles.decorator.ts`

```typescript
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
```

**What it does:** Attaches `{ roles: ['ADMIN'] }` (or any role array) as metadata on the handler. `RolesGuard` reads this to determine required roles.

**Usage:**

```typescript
@Mutation('createAnnouncement')
@UseGuards(GraphqlAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
async createAnnouncement(...) { ... }
```

### 6.3 @CurrentUser()

**File:** `src/modules/auth/decorators/current-user.decorator.ts`

```typescript
export const CurrentUser = createParamDecorator(
  (
    _data: unknown,
    context: ExecutionContext,
  ): AuthenticatedUser | undefined => {
    const gqlContext = GqlExecutionContext.create(context);
    return gqlContext.getContext<GraphqlContext>()?.req?.user;
  },
);
```

**What it does:** Extracts the authenticated user (attached by `GraphqlAuthGuard`) from the GraphQL context and injects it as a resolver parameter.

**Usage:**

```typescript
async createAnnouncement(
  @Args('input') input: CreateAnnouncementInput,
  @CurrentUser() user: AuthenticatedUser,  // ← injected here
) { ... }
```

---

## 7. JWT Strategy

**File:** `src/modules/auth/strategies/jwt.strategy.ts`

The strategy is the **core JWT processing engine** invoked by Passport when `AuthGuard('jwt')` runs.

```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Where to find the token
      ignoreExpiration: false, // Reject expired tokens
      secretOrKey: configService.get<string>('JWT_SECRET'), // Verification key
    });
  }

  // Called AFTER token signature + expiration are verified
  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.usersService.findRecordById(payload.sub);

    if (!user) throw new UnauthorizedException('Authentication required.');
    if (!user.isActive)
      throw new UnauthorizedException('User account is inactive.');

    return toAuthenticatedUser(user); // Maps DB record → AuthenticatedUser
  }
}
```

**Token extraction flow:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NjRhYjEyMyIsImVtYWlsIjoiYWRtaW5AYnJneS5jb20iLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3MDAwMDAwMDB9.signature
                       ▲
                       │
    ExtractJwt.fromAuthHeaderAsBearerToken() extracts this part
                       │
                       ▼
              ┌─── JWT Decoded ───────────────────┐
              │  {                                │
              │    "sub": "664ab123",             │  ← user ID
              │    "email": "admin@org.com",     │
              │    "role": "ADMIN",               │
              │    "iat": 1700000000              │
              │  }                                │
              └───────────────────────────────────┘
                       │
                       ▼
              JwtStrategy.validate(payload)
                       │
                       ▼
              usersService.findRecordById("664ab123")
                       │
                       ▼
              toAuthenticatedUser(userDocument)
                       │
                       ▼
              { id: "664ab123", email: "admin@org.com", role: "ADMIN", isActive: true }
                       │
                       ▼
              Attached to req.user by Passport
```

### User Mapper

**File:** `src/modules/auth/auth-user.mapper.ts`

```typescript
export function toAuthenticatedUser(
  user: Pick<UserRecord, 'email' | 'id' | 'isActive' | 'role'>,
): AuthenticatedUser {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
  };
}
```

Ensures only safe, minimal user data is attached to the request — no password hash, no full document.

---

## 8. Supporting Types & Constants

### Constants

**File:** `src/modules/auth/auth.constants.ts`

```typescript
export const IS_PUBLIC_KEY = 'isPublic'; // Metadata key for @Public()
export const ROLES_KEY = 'roles'; // Metadata key for @Roles()
```

### Types

**File:** `src/modules/auth/types/auth-context.ts`

```typescript
// JWT token payload (what's encoded in the token)
export interface JwtPayload {
  sub: string; // User ID
  email: string;
  role: UserRole;
}

// Attached to req.user after authentication
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  isActive: boolean;
}

// Express request with optional authenticated user
export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

// The GraphQL context shape (what context bridge produces)
export interface GraphqlContext {
  req: AuthenticatedRequest;
  res?: Response;
}
```

---

## 9. Three Access Levels

Depending on which decorators are applied to a resolver method, there are exactly **three access levels**:

| Level               | Decorators                                                            | Who Can Access                | Example                       |
| ------------------- | --------------------------------------------------------------------- | ----------------------------- | ----------------------------- |
| **Public**          | `@Public()`                                                           | Anyone (no JWT needed)        | `announcements` query         |
| **Authenticated**   | `@UseGuards(GraphqlAuthGuard, RolesGuard)` — no `@Roles()`            | Any logged-in user            | `searchByAdminAnnouncements`  |
| **Role-Restricted** | `@UseGuards(GraphqlAuthGuard, RolesGuard)` + `@Roles(UserRole.ADMIN)` | Only users with matching role | `createAnnouncement` mutation |

### Example from AnnouncementsResolver

```typescript
@Resolver()
export class AnnouncementsResolver {

  // ── LEVEL 3: Role-Restricted (ADMIN only) ─────────────────────
  @Mutation('createAnnouncement')
  @UseGuards(GraphqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async createAnnouncement(
    @Args('input') input: CreateAnnouncementInput,
    @CurrentUser() user: AuthenticatedUser,
  ) { ... }

  // ── LEVEL 1: Public (no auth needed) ──────────────────────────
  @Query('announcements')
  async getAnnouncements(...) { ... }
  // No guards, no decorators → completely open

  // ── LEVEL 2: Authenticated (any logged-in user) ───────────────
  @Query('searchByAdminAnnouncements')
  @UseGuards(GraphqlAuthGuard, RolesGuard)
  // No @Roles() → RolesGuard sees empty roles → allows any auth user
  async searchByAdminAnnouncements(...) { ... }
}
```

---

## 10. Wired Diagram — End-to-End Flow

```
                           CLIENT
                             │
                POST /graphql + Bearer JWT
                             │
    ═════════════════════════╪══════════════════════════════════
                             │
                      ┌──────▼──────┐
                      │   EXPRESS    │
                      │  HTTP Layer  │
                      │              │
                      │  Creates:    │
                      │  • req obj   │
                      │  • res obj   │
                      └──────┬──────┘
                             │
                   ══════════╪══════════ Context Bridge ═══════
                             │
                      ┌──────▼──────┐
                      │   APOLLO    │
                      │   SERVER    │
                      │             │
                      │ context:    │
                      │ ({req,res}) │──► GraphqlContext { req, res }
                      │ =>({req,    │
                      │     res})   │
                      └──────┬──────┘
                             │
                   ══════════╪══════════ NestJS Pipeline ══════
                             │
                   ┌─────────▼─────────┐
                   │ ExecutionContext   │
                   │ Host              │
                   │                   │
                   │ Wraps:            │
                   │ [root, args,      │
                   │  gqlCtx, info]    │
                   │ + handler ref     │
                   │ + class ref       │
                   └─────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              │              │
     ┌────────────────┐      │              │
     │  @Public()      │      │              │
     │  metadata?     │      │              │
     │                │      │              │
     │  YES → skip    │      │              │
     │  all guards    │──────┼───────────── │ ──► straight to resolver
     │                │      │              │
     │  NO → continue │      │              │
     └────────┬───────┘      │              │
              │              │              │
              ▼              │              │
     ┌────────────────┐      │              │
     │ GraphqlAuth    │      │              │
     │ Guard          │      │              │
     │                │      │              │
     │ getRequest()   │      │              │
     │   └► ctx.req   │      │              │
     │                │      │              │
     │ Passport:      │      │              │
     │  Extract JWT   │      │              │
     │  Verify sig    │      │              │
     │  Check exp     │      │              │
     │  validate()    │◄─────┤              │
     │   └► DB lookup │      │              │
     │                │      │              │
     │ req.user =     │      │              │
     │  AuthUser      │      │              │
     └────────┬───────┘      │              │
              │              │              │
              ▼              │              │
     ┌────────────────┐      │              │
     │ RolesGuard     │      │              │
     │                │      │              │
     │ Read @Roles()  │      │              │
     │ metadata       │      │              │
     │                │      │              │
     │ No roles →     │      │              │
     │   allow        │      │              │
     │                │      │              │
     │ Has roles →    │      │              │
     │  check user    │      │              │
     │  .role match   │      │              │
     └────────┬───────┘      │              │
              │              │              │
              ▼              ▼              ▼
     ┌──────────────────────────────────────────┐
     │            RESOLVER METHOD               │
     │                                          │
     │  @CurrentUser() → extracts req.user      │
     │  @Args('input') → extracts GQL args      │
     │                                          │
     │  Calls Service → Repository → MongoDB    │
     │                                          │
     │  Returns data                            │
     └──────────────────┬───────────────────────┘
                        │
                        ▼
               GraphQL JSON Response
```

---

## 11. File Reference

| File                                                    | Purpose                                                                    |
| ------------------------------------------------------- | -------------------------------------------------------------------------- |
| `src/app.module.ts`                                     | Context bridge config (`context: ({ req, res }) => ({ req, res })`)        |
| `src/main.ts`                                           | Express server bootstrap, CORS configuration                               |
| `src/modules/auth/auth.module.ts`                       | Auth module — registers Passport, JWT, guards, strategy                    |
| `src/modules/auth/auth.constants.ts`                    | Metadata keys: `IS_PUBLIC_KEY`, `ROLES_KEY`                                |
| `src/modules/auth/types/auth-context.ts`                | TypeScript interfaces: `JwtPayload`, `AuthenticatedUser`, `GraphqlContext` |
| `src/modules/auth/strategies/jwt.strategy.ts`           | Passport JWT strategy — token extraction, verification, DB lookup          |
| `src/modules/auth/auth-user.mapper.ts`                  | Maps DB user record → minimal `AuthenticatedUser`                          |
| `src/modules/auth/guards/graphql-auth.guard.ts`         | JWT authentication guard — bridges Passport ↔ GraphQL                      |
| `src/modules/auth/guards/roles.guard.ts`                | Role-based authorization guard                                             |
| `src/modules/auth/decorators/public.decorator.ts`       | `@Public()` — marks endpoints as publicly accessible                       |
| `src/modules/auth/decorators/roles.decorator.ts`        | `@Roles()` — specifies required user roles                                 |
| `src/modules/auth/decorators/current-user.decorator.ts` | `@CurrentUser()` — injects authenticated user into resolver params         |

---

## Key Takeaways

1. **The context bridge is the linchpin.** Without `context: ({ req, res }) => ({ req, res })` in `app.module.ts`, the entire auth pipeline is disconnected from incoming HTTP requests.

2. **Guard order matters.** `GraphqlAuthGuard` must run before `RolesGuard` because the roles guard depends on `req.user` being populated.

3. **`SetMetadata` + `Reflector` is the decorator pattern.** Decorators store data on handlers; guards read it at runtime. This is how `@Public()` and `@Roles()` communicate with their corresponding guards.

4. **`ExecutionContext` is created by NestJS, not by you.** It's the universal adapter that wraps transport-specific details (HTTP, WebSocket, GraphQL) into a consistent interface.

5. **Schema-first GraphQL means no DTOs.** The `.gql` files are the contract. `generate-types.ts` produces TypeScript interfaces. GraphQL validates input types, required fields, and enums automatically.

6. **Three access tiers** cover all use cases: public (no guards), authenticated (guards, no `@Roles()`), and role-restricted (guards + `@Roles()`).
