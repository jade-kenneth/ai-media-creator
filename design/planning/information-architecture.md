# Information architecture

## Structure

```text
(signed out)
└── Sign in                         /sign-in

(signed in) App shell: top bar (brand → Projects · Projects · Credits · Account)
├── Projects dashboard              /projects
│   └── New video dialog            (§3.23: one card per built studio → creates the project)
└── Project workflow                /projects/:projectId  → resumes at the current step
    Affiliate Studio project (every project stored before studios is one)
    ├── Plan
    │   ├── 1 Product               /projects/:projectId/product
    │   ├── 2 Facts                 /projects/:projectId/facts
    │   ├── 3 Strategy              /projects/:projectId/strategy
    │   └── 4 Script                /projects/:projectId/script
    ├── Produce                     (Batch 2: approved, hidden until built)
    │   ├── 5 Media                 /projects/:projectId/media
    │   ├── 6 Voice                 /projects/:projectId/voice
    │   └── 7 Edit & preview        /projects/:projectId/edit
    └── Deliver
        ├── Creator brief           /projects/:projectId/brief
        └── 8 Export video          /projects/:projectId/export (Batch 2: approved, hidden until built)

    Entertainment Studio project (a story, §3.23, approved 2026-09-26)
    ├── Plan
    │   ├── 1 Story                 /projects/:projectId/story (genre · optional detail → three AI premises · cast · format)
    │   └── 2 Script                /projects/:projectId/script
    ├── Produce
    │   ├── 3 Media                 /projects/:projectId/media
    │   ├── 4 Voice                 /projects/:projectId/voice
    │   └── 5 Edit & preview        /projects/:projectId/edit
    └── Deliver
        ├── Creator brief           /projects/:projectId/brief
        └── 6 Export video          /projects/:projectId/export

    Story series (§3.25, R31, approved 2026-09-27): no route of its own
    └── Episode 1 … Episode N       each a story project above, linked in order;
                                    the Story step's Episodes card lists them and makes the next one

Public
└── Privacy policy                  /privacy-policy (adapted boilerplate page)
```

`/` redirects to `/projects` when signed in, otherwise to `/sign-in`.

## Global overlays

| Overlay | Opened from | Presentation |
| --- | --- | --- |
| Credits popover | Top-bar credits pill | Popover |
| Account menu | Top-bar avatar | Menu |
| Rename project | Project card menu | Dialog (bottom sheet below 640px) |
| New video (§3.23) | Dashboard head and empty state **New video** | Dialog, 560px (bottom sheet below 640px) |
| Add a fact | Fact review toolbar, empty state, Script "Add as a fact" | Dialog |
| Remove fact | Fact row menu (creator facts only) | Dialog |
| Remove file | Asset tile menu | Dialog |
| Approve version | Script footer | Dialog |
| Version history | Script head | Drawer (right; full width below 640px) |
| Media picker (Batch 2) | Media slot, Change on Media, Change media on an Edit & preview scene | Sheet (right 480px; full-height bottom sheet below 640px) |
| Remove recording (Batch 2) | Voice track row | Dialog |
| Reset captions (Batch 2) | Edit & preview captions | Dialog |
| Remove music (Batch 2) | Edit & preview music row | Dialog |
| Leave without saving | Any in-app navigation while an edit is unsaved | Dialog |

## Step numbering

Batch 1 shows **Plan** (1 Product, 2 Facts, 3 Strategy, 4 Script) and **Deliver** (Creator brief). The mobile step strip reads "Step n of 5: Name". When Batch 2 ships, Produce appears between them and the count becomes 9; step ids and routes do not change.

(§3.23) Each studio supplies its own intake steps before Script; Script and every later step are shared. A story shows **Plan** (1 Story, 2 Script), **Produce** (3 Media, 4 Voice, 5 Edit & preview) and **Deliver** (Creator brief, 6 Export video), and its strip reads "Step n of 7: Name" ("Step n of 3" while the video beta is off: Story, Script, Creator brief). The rail caption names the studio.

## Step access

| Step | Opens when | Locked reason (shown in the rail and on redirect) |
| --- | --- | --- |
| Product | Always | — |
| Facts | The product has a title and affiliate link and the creator has continued once | “Add the product title and link first.” |
| Strategy | No fact is unreviewed and at least one is approved | “Review every fact first.” |
| Script | A buyer and an angle are saved, or a script version exists | “Choose an angle first.” |
| Creator brief | An approved script version exists | “Approve a script first.” |
| Media (Batch 2) | An approved script version exists | “Approve a script first.” |
| Voice (Batch 2) | Every scene has media or a text card | “Choose media for every scene first.” |
| Edit & preview (Batch 2) | The voiceover is settled for the version the video uses (AI voiceover, timed recording, or No voiceover) | “Add a voiceover first.” |
| Export video (Batch 2) | Same as Edit & preview | “Add a voiceover first.” |

Opening a locked step's URL replaces it with the earliest incomplete step and shows an info banner naming the locked step and the reason.

### Step access for a story (§3.23, approved 2026-09-26)

| Step | Opens when | Locked reason (shown in the rail and on redirect) |
| --- | --- | --- |
| Story | Always (never locked) | — |
| Script | The story is done (a genre, a premise and, for Acted, at least one character), or a script version exists | “Finish the story first.” |
| Creator brief | An approved script version exists | “Approve a script first.” |
| Media, Voice, Edit & preview, Export video | As for an affiliate video (above and Design Reference §5B) | As above |

A story never needs a product, an affiliate link or an approved fact, and has no Product, Facts or Strategy step. It moves from `draft` to `script_review` when its first script is written and never enters `facts_review`.

## Terminology

Project, product, fact (claim when flagged), angle, hook, scene, script, version, creator brief, credits; Batch 2 adds media, text card, voiceover, recording, caption, music, end card, render and export (the MP4). §3.23–§3.24 adds studio, story, Story detail, genre, premise, character (in a story's cast) and end line. See [voice-content.md](../system/voice-content.md#vocabulary).
