# 05 — Database

Explain the data model in beginner-friendly language. Produce the database section
of `index.html`.

## The filing-cabinet analogy (open with this)

> The database is like a filing cabinet. Each table/collection is a drawer. Each
> row/document is a folder. Each field is information written inside the folder.
> Relationships are labels that connect one folder to another.

## Detect & explain

From schema files (`*.schema.ts` for Mongoose, `schema.prisma`, `*.sql`,
migrations) and model usage:

- Main tables/collections and what each stores
- Main entities/models
- Relationships: one-to-one, one-to-many, many-to-many
- Foreign keys / references (`ref:`, ObjectId refs, relation fields)
- Tenant ownership (does each record carry `barangayId`/`tenantId`?)
- Indexes (if declared)
- Query patterns (how the app reads/writes these)
- N+1 query risk (cross-check `audit_signals.possible_n1_query`)
- Soft-delete pattern (`deletedAt`, `isDeleted`)
- `createdAt` / `updatedAt` (timestamps option)
- Migration / schema-evolution pattern
- Data validation rules at the schema level

## How to present

1. **Entity list** — one line per model: name + what it stores + the file.
2. **Relationship map** — a short list ("A `Resident` belongs to one `Barangay`;
   a `Barangay` has many `Residents`") with the file/line that proves each ref.
3. **A simple text ER sketch** (optional) using boxes and `──<` style lines, or a
   small HTML/CSS diagram (see `references/09-diagrams.md`).
4. **Where data lives & moves** — tie back to the full-stack flows (§06).

## Rules

- Cite the schema file + line for every entity and relationship.
- If no schema files are detected, say `Not detected from current files.` and stop.
- Do not invent indexes or relationships that the schema does not declare.

## Output of this phase

- Database HTML section: analogy + entity list + relationship map (+ optional ER sketch).
