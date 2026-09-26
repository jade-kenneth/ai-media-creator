# Roles and permissions

## Roles

| Role | Description | MVP |
| --- | --- | --- |
| Signed-out visitor | Not signed in | Can see sign-in and the privacy policy only |
| Creator | A signed-in account with the standard user role, owner of a personal workspace | The only signed-in role |
| Operator (internal) | Would see usage, cost and failures across creators | **Not designed**; open decision 3 |

## Route access

| Route | Signed-out visitor | Creator (owner) | Creator (not owner) |
| --- | --- | --- | --- |
| `/sign-in` | ✓ | Redirected to `returnTo` or `/projects` | same |
| `/projects` | → sign-in with `returnTo` | ✓ their own projects only | — |
| `/projects/:id/*` | → sign-in with `returnTo` | ✓ | *No access* state |
| `/privacy-policy` | ✓ | ✓ | ✓ |

## Control access

There is one signed-in role, so no control is hidden or retargeted by role. Controls are gated by **state**, not by role:

| Control | Disabled when | Reason shown |
| --- | --- | --- |
| Continue to facts | Title or affiliate link missing; offline | “Add a product title and affiliate link to continue” / offline banner |
| Upload dropzone | Rights not confirmed | “Confirm your rights to upload” |
| Continue to strategy | A fact is unreviewed, or none approved | “2 facts still need review” / “Approve at least one fact” |
| Suggest angles, Write hooks & script, Rewrite | Offline; not enough credits; already running | “You need 3 credits. You have 2.” / offline banner / loading state |
| Write hooks & script | Buyer or angle missing | “Add who the buyer is” / “Choose or write an angle” |
| Approve vN | Unresolved flag; no hook selected; a job is writing; offline | “Fix 1 flagged line first” / “Pick a hook first” |
| Duplicate | The draft has no product yet; (§3.23) a story has no genre yet | Menu item description: “Add a product first” / “Pick a genre first” |
| Studio card in the New video dialog (§3.23) | Offline; another card is creating | Offline banner in the dialog: “Projects can be created when you reconnect.” / the pressed card's loading state |
| Suggest premises (§3.23) | No genre; offline; not enough credits; already running | Tooltip “Pick a genre first” / offline banner / not enough credits, as Suggest angles / loading state |
| Write hooks & script on Story (§3.23) | No genre; no premise; Acted with no character; not enough credits; offline | “Pick a genre” / “Choose or write a premise” / “Add a character, or switch to Narrated” / “You need 3 credits. You have 2.” |
| Add a character (§3.23) | 4 characters | Hint “Up to 4 characters.” |
| Use this on a character photo (§3.23) | No photo selected, or the likeness box isn't ticked | The unticked required checkbox |
| Generate clip in a story (§3.23) | Not scene 1 and scene 1 has no AI clip; not enough credits; offline | “Make scene 1’s clip first” / “You need 4 credits. You have 3.” / “Reconnect to generate a clip” (no photo reason in a story) |
| Remove (fact) | The fact came from the listing | Not shown: listing facts are rejected, not removed |

## Data ownership

- Every project, product, fact, asset, strategy, script version, generation job, credit account and credit entry belongs to one creator (`ownerId`) inside that creator's workspace (`organizationId`). (§3.23) So do a story, its premise suggestions and its character items; the studio is recorded on the project.
- Every read and write checks ownership on the server. A client-side disabled state is never the only gate: workflow gates (facts reviewed, angle chosen, flags resolved) are rechecked by the server, which answers with a conflict error. (§3.23) So are the story gates (genre, premise, a character for Acted) and the studio itself: a studio's own actions are refused on another studio's project.
- Private media is served through short-lived signed URLs, only to its owner.
