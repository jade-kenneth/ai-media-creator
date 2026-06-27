---
name: explain-code
description: Explains code with visual diagrams and analogies. Use when explaining how code works, teaching about a codebase, or when the user asks "how does this work?"
---

When explaining code, always follow this structure:

## 1. Analogy First

Compare the code to something from everyday life before touching the technical detail. For complex concepts, layer multiple analogies. The analogy should make the *why* obvious, not just the *what*.

## 2. Diagram

Always produce a diagram. Choose the format based on what the code does:

| Code type | Best diagram |
|---|---|
| Data flow, request/response, event sequence | Sequence diagram (draw.io XML) |
| Module dependencies, component tree, layer boundaries | ASCII block diagram |
| State transitions, life cycles | ASCII state machine |
| Simple one-liner flow | ASCII inline arrow chain |

### When to use draw.io XML

Use draw.io XML for **flow-heavy explanations** — anything with multiple actors, steps, or messages passing between parts of the system. Follow the global XML diagram standard from `~/.claude/CLAUDE.md` exactly:

- UML sequence diagram layout (horizontal arrows, one per row)
- Actor boxes at top with plain English names + filename in `8px` grey
- Vertical dashed lifelines
- Section sidebars for logical phases
- Each arrow label: plain English sentence on line 1, `file:line — method()` in `8px` grey on line 2
- Absolute `mxPoint` coordinates — no `source=`/`target=` on message arrows
- Solid arrow = call/send, dashed arrow = return/response
- Step numbers use circled unicode: ①②③④⑤⑥⑦⑧⑨⑩

### When to use ASCII

Use ASCII for **structure-heavy explanations** — dependency trees, component hierarchies, layer boundaries, state machines — where spatial layout matters more than message sequence.

**ASCII block diagram format:**
```
┌─────────────────┐        ┌─────────────────┐
│   ComponentA    │──────▶│   ComponentB    │
│  (what it does) │        │  (what it does) │
└─────────────────┘        └─────────────────┘
         │                          │
         ▼                          ▼
┌─────────────────┐        ┌─────────────────┐
│    HookX        │        │    ServiceY     │
└─────────────────┘        └─────────────────┘
```

**ASCII sequence (simple flows only):**
```
User ──request──▶ Handler ──query──▶ DB
     ◀──response──          ◀──rows──
```

**ASCII state machine:**
```
[idle] ──submit──▶ [loading] ──success──▶ [done]
                       │
                    error
                       │
                       ▼
                   [failed] ──retry──▶ [loading]
```

Rules for ASCII diagrams:
- Use box-drawing characters (`┌ ─ ┐ │ └ ┘ ├ ┤ ┬ ┴ ┼`) for boxes
- Use `──▶` for directed arrows, `◀──` for reverse
- Label every arrow and every box
- Annotate with actual filenames in `()` where relevant

## 3. Code Walkthrough

Step through the code sequentially. For each meaningful step:
- What happens
- Why it happens (the invariant or contract driving it)
- What would break if it were skipped

Keep it tight — one short paragraph per step, not a line-by-line narration.

## 4. Gotcha

End with one concrete gotcha: a real mistake or misconception someone reading this code for the first time would likely have. Make it specific to the actual code, not generic advice.

---

**Tone:** Conversational. Write as if explaining to a smart colleague who hasn't seen this part of the codebase. Skip obvious observations — focus on the non-obvious.
