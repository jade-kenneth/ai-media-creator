# MongoDB Repository Pattern & Indexing Strategy

> **Project:** Organization Connect API (`org-system-api`)
> **Stack:** NestJS · Mongoose · MongoDB · Schema-First GraphQL

---

## Table of Contents

1. [Overview](#1-overview)
2. [Repository Architecture](#2-repository-architecture)
3. [How a Repository Is Created](#3-how-a-repository-is-created)
4. [What Are MongoDB Indexes?](#4-what-are-mongodb-indexes)
5. [Index Syntax Explained](#5-index-syntax-explained)
6. [Index Catalog — All Collections](#6-index-catalog--all-collections)
   - [Announcements](#announcements)
   - [Users](#users)
   - [MemberProfiles](#memberprofiles)
   - [DocumentRequests](#documentrequests)
   - [Schedules](#schedules)
   - [EmergencyContacts](#emergencycontacts)
   - [Notifications](#notifications)
7. [How Indexes Are Registered](#7-how-indexes-are-registered)
8. [The Repository Interface](#8-the-repository-interface)
9. [MongooseRepository — Base Class](#9-mongooserepository--base-class)
10. [Query Patterns & Pagination](#10-query-patterns--pagination)
11. [Key Takeaways](#11-key-takeaways)
12. [File Reference](#12-file-reference)

---

## 1. Overview

The API uses a **generic repository pattern** built on top of Mongoose. Every collection in MongoDB is accessed through a repository instance created by a factory function. Each factory defines:

1. **Collection name** — the MongoDB collection
2. **Schema definition** — field names and their Mongoose types
3. **Indexes** — which fields to pre-sort for fast lookups

```
┌─────────────────────────────────────────────────────────────┐
│                    Repository Pattern                        │
│                                                             │
│   GraphQL Resolver                                          │
│       │                                                     │
│       ▼                                                     │
│   Service Layer                                             │
│       │                                                     │
│       ▼                                                     │
│   Repository (generic interface)                            │
│       │                                                     │
│       ▼                                                     │
│   MongooseRepository (base class implementation)            │
│       │                                                     │
│       ▼                                                     │
│   MongoDB Collection                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Repository Architecture

```
                      Repository<TEntity>          ← generic interface
                            │
                            │ implements
                            ▼
                   MongooseRepository<TSchema>      ← base class (all CRUD logic)
                            │
             ┌──────────────┼──────────────────────────────────┐
             │              │              │                    │
             ▼              ▼              ▼                    ▼
  Announcements    Users          DocumentRequests      Notifications
  Repository       Repository     Repository            Repository
  Factory          Factory        Factory               Factory
```

Each module doesn't subclass `MongooseRepository`. Instead, a **factory function** creates an instance with module-specific schema and indexes. This keeps all repositories consistent while allowing each collection to have its own fields and index strategy.

---

## 3. How a Repository Is Created

Using Announcements as an example:

```typescript
// src/modules/announcements/repositories/announcements.repository.ts

export type AnnouncementsRepository = Repository<Announcement>;

export async function AnnouncementsRepositoryFactory(
  connection: Connection,
): Promise<AnnouncementsRepository> {
  return new MongooseRepository<Announcement>(
    connection, // ← Mongoose connection to MongoDB
    'Announcements', // ← Collection name in MongoDB
    {
      // ← Schema: field names → Mongoose types
      id: Types.ObjectId,
      cursor: String,
      title: String,
      content: String,
      category: String,
      coverImageUrl: String,
      isPinned: Boolean,
      isPublished: Boolean,
      publishedAt: Date,
      createdBy: String,
      updatedBy: String,
      deletedAt: Date,
      createdAt: Date,
      updatedAt: Date,
    },
    [
      // ← Indexes: fields to optimize queries on
      [{ isPublished: 1, isPinned: -1, publishedAt: -1 }],
      [{ category: 1 }],
      [{ deletedAt: 1 }],
    ],
  );
}
```

The four constructor arguments:

```
MongooseRepository(connection, name, definition, indexes)
                      │         │       │           │
                      │         │       │           └─ Which fields to index
                      │         │       └─ Field names and their types
                      │         └─ MongoDB collection name
                      └─ Database connection
```

---

## 4. What Are MongoDB Indexes?

Think of indexes like the **index at the back of a textbook**:

```
WITHOUT an index:
  "Find all announcements where category = HEALTH"
  MongoDB reads every single document → 10,000 documents scanned 🐌

WITH an index on category:
  MongoDB jumps directly to HEALTH documents → 150 documents found 🚀
```

### The Trade-off

```
                    READ (queries)     WRITE (insert/update/delete)
─────────────────────────────────────────────────────────────────
No indexes          Slow ❌             Fast ✅
With indexes        Fast ✅             Slightly slower ⚠️
```

Writes are slightly slower because MongoDB must update every relevant index whenever a document changes. For a read-heavy app like a organization platform (members read far more than admins write), this trade-off is well worth it.

### MongoDB is smart about updates

When a field changes, only the indexes **containing that field** are updated:

```
Admin pins an announcement (isPinned: false → true)

  Index 1: { isPublished, isPinned, publishedAt }  → UPDATED (isPinned changed)
  Index 2: { category }                             → NOT touched
  Index 3: { deletedAt }                            → NOT touched
```

---

## 5. Index Syntax Explained

```typescript
[{ isPublished: 1, isPinned: -1, publishedAt: -1 }];
```

### Sort Direction

- `1` = **ascending** (A→Z, false→true, oldest→newest)
- `-1` = **descending** (Z→A, true→false, newest→oldest)

### Single vs. Compound Indexes

```
Single-field index:
  [{ category: 1 }]
  → Optimizes: "find by category"

Compound index:
  [{ isPublished: 1, isPinned: -1, publishedAt: -1 }]
  → Optimizes: "find published, pinned first, newest first"
  → Field ORDER matters — MongoDB uses left-to-right prefix matching
```

### Index Options

The second element in the tuple is optional index options:

```typescript
[{ email: 1 }, { unique: true }][({ date: 1 }, {})][{ category: 1 }]; // ← prevents duplicate emails // ← no special options // ← options omitted entirely
```

---

## 6. Index Catalog — All Collections

### Announcements

**Collection:** `Announcements`
**File:** `src/modules/announcements/repositories/announcements.repository.ts`

```typescript
[
  [{ isPublished: 1, isPinned: -1, publishedAt: -1 }],
  [{ category: 1 }],
  [{ deletedAt: 1 }],
];
```

| Index                                               | Type     | Purpose                                                               |
| --------------------------------------------------- | -------- | --------------------------------------------------------------------- |
| `{ isPublished: 1, isPinned: -1, publishedAt: -1 }` | Compound | Main feed query — published announcements, pinned first, newest first |
| `{ category: 1 }`                                   | Single   | Filter announcements by category (HEALTH, SAFETY, etc.)               |
| `{ deletedAt: 1 }`                                  | Single   | Soft delete — quickly filter out deleted records                      |

**How Index 1 pre-sorts data:**

```
isPublished │ isPinned │ publishedAt  │ Document
────────────┼──────────┼──────────────┼──────────────────────
true        │ true     │ Apr 3, 2026  │ 📌 "Flood Warning"
true        │ true     │ Mar 28, 2026 │ 📌 "Water Shutoff"
true        │ false    │ Apr 2, 2026  │ 📄 "Free Vaccines"
true        │ false    │ Apr 1, 2026  │ 📄 "Basketball Game"
false       │ false    │ Mar 30, 2026 │ (draft, excluded)
```

---

### Users

**Collection:** `Users`
**File:** `src/modules/users/repositories/users.repository.ts`

```typescript
[[{ email: 1 }, { unique: true }]];
```

| Index          | Type   | Options        | Purpose                                                         |
| -------------- | ------ | -------------- | --------------------------------------------------------------- |
| `{ email: 1 }` | Single | `unique: true` | Fast email lookup during login; **prevents duplicate accounts** |

The `unique: true` option means MongoDB will **reject** any insert/update that would create a duplicate email. This is a database-level constraint — even if application code has a bug, duplicates can't happen.

---

### MemberProfiles

**Collection:** `MemberProfiles`
**File:** `src/modules/members/repositories/members.repository.ts`

```typescript
[[{ userId: 1 }, { unique: true }]];
```

| Index           | Type   | Options        | Purpose                                                                      |
| --------------- | ------ | -------------- | ---------------------------------------------------------------------------- |
| `{ userId: 1 }` | Single | `unique: true` | Fast lookup of member profile by user ID; **ensures one profile per user** |

---

### DocumentRequests

**Collection:** `DocumentRequests`
**File:** `src/modules/document-requests/repositories/document-requests.repository.ts`

```typescript
[
  [{ referenceNumber: 1 }, { unique: true }],
  [{ memberId: 1, createdAt: -1 }],
  [{ currentStatus: 1, createdAt: -1 }],
  [{ requestType: 1, createdAt: -1 }],
  [{ updatedAt: -1 }],
];
```

| Index                                 | Type     | Options        | Purpose                                                      |
| ------------------------------------- | -------- | -------------- | ------------------------------------------------------------ |
| `{ referenceNumber: 1 }`              | Single   | `unique: true` | Lookup by reference number; prevents duplicates              |
| `{ memberId: 1, createdAt: -1 }`    | Compound | —              | "Show me MY requests, newest first" (member's own history) |
| `{ currentStatus: 1, createdAt: -1 }` | Compound | —              | Admin dashboard: "Show all PENDING requests, newest first"   |
| `{ requestType: 1, createdAt: -1 }`   | Compound | —              | Filter by type: organization clearance, certificate, etc.        |
| `{ updatedAt: -1 }`                   | Single   | —              | "Show recently updated requests" (admin activity feed)       |

**This collection has the most indexes** because document requests have the most query patterns — members check their own requests, admins filter by status/type, and the dashboard shows recently updated items.

---

### Schedules

**Collection:** `Schedules`
**File:** `src/modules/schedules/repositories/schedules.repository.ts`

```typescript
[[{ date: 1 }, {}]];
```

| Index         | Type   | Purpose                                                |
| ------------- | ------ | ------------------------------------------------------ |
| `{ date: 1 }` | Single | Query upcoming schedules by date (chronological order) |

---

### EmergencyContacts

**Collection:** `EmergencyContacts`
**File:** `src/modules/emergency-contacts/repositories/emergency-contacts.repository.ts`

```typescript
[[{ type: 1 }]];
```

| Index         | Type   | Purpose                                                         |
| ------------- | ------ | --------------------------------------------------------------- |
| `{ type: 1 }` | Single | Filter emergency contacts by type (police, fire, medical, etc.) |

---

### Notifications

**Collection:** `Notifications`
**File:** `src/modules/notifications/repositories/notifications.repository.ts`

```typescript
[
  [{ userId: 1, createdAt: -1, id: -1 }],
  [{ userId: 1, isRead: 1 }],
  [{ relatedEntityId: 1 }],
];
```

| Index                                  | Type     | Purpose                                                                                                             |
| -------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------- |
| `{ userId: 1, createdAt: -1, id: -1 }` | Compound | "Show MY notifications, newest first" — the main notification feed with stable cursor pagination (id as tiebreaker) |
| `{ userId: 1, isRead: 1 }`             | Compound | "Show MY unread notifications" / unread count badge                                                                 |
| `{ relatedEntityId: 1 }`               | Single   | Find all notifications linked to a specific entity (e.g., a document request)                                       |

---

## 7. How Indexes Are Registered

Inside the `MongooseRepository` constructor:

```typescript
// src/libs/moongose-repository.ts

constructor(
  connection: MongooseConnection,
  name: string,
  definition: SchemaDefinition,
  indexes?: [IndexDefinition, IndexOptions?][],   // ← index tuples
) {
  const existingModel = connection.models[name];  // Re-use if already registered

  if (existingModel) {
    this.model = existingModel;
    return;
  }

  const schema = new Schema<TSchema>(definition);

  // Register each index on the Mongoose schema
  for (const [indexDefinition, indexOptions] of indexes ?? []) {
    schema.index(indexDefinition, indexOptions);
  }

  this.model = connection.model<TSchema>(name, schema);
}
```

**What happens at runtime:**

```
App starts
    │
    ▼
Factory function called with Mongoose connection
    │
    ▼
new MongooseRepository(connection, 'Announcements', schema, indexes)
    │
    ├── Check if model already exists → reuse if yes
    │
    ├── Create Mongoose Schema from field definitions
    │
    ├── Loop through indexes array:
    │     schema.index({ isPublished: 1, isPinned: -1, publishedAt: -1 })
    │     schema.index({ category: 1 })
    │     schema.index({ deletedAt: 1 })
    │
    └── Register model: connection.model('Announcements', schema)
            │
            ▼
        Mongoose calls MongoDB createIndex()
        (only creates if index doesn't already exist)
```

When `autoIndex: true` (non-production), Mongoose automatically calls `createIndex()` on MongoDB for each defined index at startup. In production (`autoIndex: false`), indexes should be created manually or via migration scripts to avoid blocking the server during startup.

---

## 8. The Repository Interface

**File:** `src/libs/repository.ts`

Every repository exposes the same generic interface:

```typescript
export interface Repository<TEntity> {
  create(data: Partial<TEntity>): Promise<TEntity>;
  find(filter?: TFilter): Promise<TEntity>;
  list(filter?, options?): RepositoryList<TEntity>;
  update(filter, data): Promise<void>;
  delete(filter?): Promise<void>;
  exists(filter?): Promise<boolean>;
  count(filter?): Promise<number>;
  search(search, filter?, opts?): Promise<TEntity[]>;
}
```

The `list()` method returns a `RepositoryList` which supports multiple pagination strategies:

```typescript
export interface RepositoryList<TEntity> {
  collect(): Promise<TEntity[]>; // All matching documents
  connection(pagination?): Promise<Connection<TEntity>>; // Cursor-based (GraphQL relay)
  offset(pagination?): Promise<OffsetResult<TEntity>>; // Page/limit based
}
```

---

## 9. MongooseRepository — Base Class

**File:** `src/libs/moongose-repository.ts`

```
MongooseRepository<TSchema>
│
├── create(data)          → model.create() → deserialize → return TSchema
│
├── list(filter, options) → returns MongooseRepositoryList
│   ├── .collect()        → model.find().sort() → deserialize all
│   ├── .connection()     → cursor-based pagination (Relay style)
│   └── .offset()         → page/limit pagination
│
├── find(filter)          → model.findOne() or model.findById()
│
├── findMany(filter)      → shortcut for list().collect()
│
├── update(filter, data)  → model.updateOne() or model.updateMany()
│
├── delete(filter)        → model.deleteOne() or model.deleteMany()
│
├── exists(filter)        → model.exists()
│
├── count(filter)         → model.countDocuments()
│
└── search(query, ...)    → model.aggregate() with $search (Atlas Search)
```

### Key Helper Functions

| Function                             | Purpose                                                                                                           |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| `deserializeDocument()`              | Converts Mongoose HydratedDocument → plain object, strips `_id` and `__v`                                         |
| `serializeRepositoryFilter()`        | Converts generic filter conditions (`equal`, `in`, `greaterThan`, etc.) to Mongoose `$eq`, `$in`, `$gt` operators |
| `normalizeSort()`                    | Converts `{ field: 'ASC' }` to `[['field', 1]]`; adds `id` as tiebreaker                                          |
| `encodeCursor()` / `decodeCursor()`  | Base64 encoding for cursor-based pagination                                                                       |
| `buildAfterCursorRepositoryFilter()` | Generates the `$or` filter for "after this cursor" pagination                                                     |

---

## 10. Query Patterns & Pagination

### Cursor-Based Pagination (Relay Style)

Used by GraphQL `Connection` types. Efficient for infinite scroll / "load more":

```
Query: announcements(first: 10, after: "base64cursor")

┌──────────────────────────────────────────────────────────────┐
│  1. Decode cursor → get document ID                          │
│  2. Find cursor document in DB                               │
│  3. Build "after cursor" filter using sort fields             │
│  4. Query: find(filter).sort(sort).limit(first + 1)          │
│  5. If result count > first → hasNextPage = true             │
│  6. Return edges with cursors + pageInfo                     │
└──────────────────────────────────────────────────────────────┘

Response:
{
  "totalCount": 150,
  "edges": [
    { "cursor": "YWJj", "node": { "title": "..." } },
    { "cursor": "ZGVm", "node": { "title": "..." } }
  ],
  "pageInfo": {
    "endCursor": "ZGVm",
    "hasNextPage": true
  }
}
```

### Offset-Based Pagination

Used for admin tables with page numbers:

```
Query: documentRequests(page: 2, limit: 20)

┌──────────────────────────────────────────────────────────────┐
│  1. Calculate offset: (page - 1) × limit = 20               │
│  2. Query: find(filter).sort(sort).skip(20).limit(20)        │
│  3. Count total documents                                    │
│  4. Calculate totalPages, hasNextPage, hasPreviousPage       │
└──────────────────────────────────────────────────────────────┘

Response:
{
  "items": [...],
  "pageInfo": {
    "page": 2,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPreviousPage": true
  }
}
```

### How Indexes Help Pagination

```
Without index on { createdAt: -1 }:
  .find().sort({ createdAt: -1 }).skip(100).limit(20)
  MongoDB must: load all docs → sort all in memory → skip 100 → take 20  🐌

With index on { createdAt: -1 }:
  .find().sort({ createdAt: -1 }).skip(100).limit(20)
  MongoDB walks the pre-sorted index → jump to position 100 → take 20   🚀
```

---

## 11. Key Takeaways

1. **Index the fields you query by most.** If a field appears in `filter`, `sort`, or `WHERE` conditions frequently, it should be indexed.

2. **Don't index everything.** Each index costs memory and slows writes. Only index fields used in common query patterns.

3. **Compound index field order matters.** `{ isPublished: 1, isPinned: -1 }` supports queries filtering by `isPublished` alone, or `isPublished + isPinned`, but NOT `isPinned` alone (left-prefix rule).

4. **`unique: true` is a database-level constraint.** Even if application code has bugs, MongoDB will reject duplicate values. Used on `email` (Users) and `referenceNumber` (DocumentRequests).

5. **Soft deletes need indexes too.** Almost every query filters `WHERE deletedAt IS NULL`. Without an index on `deletedAt`, every query scans the full collection.

6. **The repository pattern decouples business logic from MongoDB.** Services never touch Mongoose directly — they use the generic `Repository<T>` interface. This makes testing easier and the database swappable.

7. **Mongoose handles index creation automatically** in development (`autoIndex: true`). It checks if the index already exists before creating it, so restarts don't cause duplicates.

---

## 12. File Reference

### Core Library

| File                              | Purpose                                                                               |
| --------------------------------- | ------------------------------------------------------------------------------------- |
| `src/libs/repository.ts`          | Generic `Repository<T>` interface, pagination types, filter types                     |
| `src/libs/moongose-repository.ts` | `MongooseRepository<T>` base class — all CRUD, pagination, search, index registration |

### Repository Factories

| File                                                                           | Collection          | Indexes                                                                |
| ------------------------------------------------------------------------------ | ------------------- | ---------------------------------------------------------------------- |
| `src/modules/announcements/repositories/announcements.repository.ts`           | `Announcements`     | 3 indexes (compound feed, category, soft delete)                       |
| `src/modules/users/repositories/users.repository.ts`                           | `Users`             | 1 index (unique email)                                                 |
| `src/modules/members/repositories/members.repository.ts`                   | `MemberProfiles`  | 1 index (unique userId)                                                |
| `src/modules/document-requests/repositories/document-requests.repository.ts`   | `DocumentRequests`  | 5 indexes (ref number, member history, status, type, recent updates) |
| `src/modules/schedules/repositories/schedules.repository.ts`                   | `Schedules`         | 1 index (date)                                                         |
| `src/modules/emergency-contacts/repositories/emergency-contacts.repository.ts` | `EmergencyContacts` | 1 index (type)                                                         |
| `src/modules/notifications/repositories/notifications.repository.ts`           | `Notifications`     | 3 indexes (user feed, unread count, related entity)                    |

### Total: 15 indexes across 7 collections
