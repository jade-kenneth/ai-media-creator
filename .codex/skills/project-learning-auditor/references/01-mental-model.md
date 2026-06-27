# 01 — Mental model

Produce **one whole-project analogy** that a beginner can hold in their head
before reading any code. The analogy must be adapted to the apps/services the
scan actually found — never generic.

## Goal

Render a "Mental model" section in `index.html` (and the top-of-page one-line
analogy) that maps each detected part of the system to a real-world role.

## Default analogy — the barangay office

For a barangay/municipal system, use the office analogy and map nodes to detected
apps/services. Only include a node if the scan supports it; otherwise drop it or
mark it `Not detected from current files.`

| Real-world role | System part | How to confirm from the scan |
|---|---|---|
| Resident front desk | Mobile app | `markers.expo`/`react-native`, `apps/*mobile*` |
| Staff back office | Admin dashboard | `markers.nextjs`, `apps/*admin*` |
| The clerk who processes requests | Backend API | `markers.nestjs`, `apps/*api*` |
| The filing cabinet | Database | `markers.prisma`/`mongoose`, `*.schema.ts`, `*.sql` |
| The document room | File/object storage | upload/storage modules, S3/Cloudinary deps |
| The announcement speaker | Notification service | push/email/SMS modules, expo-notifications, FCM |
| The ID checker at the entrance | Authentication | `auth` module, JWT/session deps |
| The rule about which staff enters which room | Authorization / roles | guards, `@Roles`, role enums |
| Several branches sharing one office | Multi-tenancy | `tenantId`/`barangayId` markers |

## How to write it

1. **Open with one sentence** that frames the whole system in plain English,
   using the analogy. Example:
   > Think of this project like a barangay office: residents walk up to the front
   > desk (the mobile app), staff work in the back office (the admin dashboard),
   > a clerk (the API) processes every request, the filing cabinet (the database)
   > holds the records, and an ID checker (authentication) guards the entrance.

2. **Then a mapping list** — each row: analogy → real part → the file/folder that
   proves it (`apps/brgy-system-api/src/modules/auth/` etc.). Cite paths.

3. **Then the "one request, start to finish" line** in analogy terms:
   > A resident asks the front desk for a document → the clerk checks their ID →
   > checks they're allowed → pulls the right folder from the cabinet → hands back
   > a copy → the front desk shows it on screen.

4. **Adapt, don't force.** If the project is not a barangay/office system, pick an
   analogy that fits what you found (a restaurant: waiter/kitchen/pantry; a library:
   front desk/catalog/stacks). Keep the same node→role→evidence structure.

## Rules

- Every analogy node names the folder/file that justifies it.
- Drop nodes with no evidence; do not invent a storage or notification service the
  scan does not show.
- Keep it short — the analogy is the on-ramp, not the full architecture (that is §02).

## Output of this phase

- The "Mental model" HTML section content (one-line + mapping + one-request line).
- Seed `concept-map.md` (built in §02) with the analogy node list.
