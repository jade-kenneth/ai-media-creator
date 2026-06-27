# The Eight Visual Design Principles — AI Critique Vocabulary

> Source/inspiration: Expo, _"How to apply professional design principles in AI app development"_ (2026). This file adapts that framework for the mobile skill.

These eight principles are the vocabulary people use when they "know good design when they see it." Every screen that reads as visually harmonious satisfies all eight. Use them as a **shared language to critique and iterate AI-generated UI** — not as one-time rules.

---

## Why AI design needs this

- **Agents have no eyes.** An agent assembles layouts and patterns from code and templates, but it cannot _see_ the result. Ask it to "align the button to the container edge" and you'll watch it crunch code trying to infer what you meant. It prepares the ingredients and tosses them in the pot — sometimes a disaster, sometimes fine, rarely great.
- **Design is not code.** A `visual-design.md` checklist alone will not fix this. The principles only bite when paired with _vision_ — you supply the eyes.
- **AI output trends sterile.** Agents are utilitarian and feature-first, which produces flat, template-shaped, "every vibe-coded app looks the same" results. Treat the first output as a **base to expand upon**, never the finished product.
- **Polish = persistence + taste + the science of design.** The principles are the science. You bring the taste. The loop below provides the persistence.

---

## The critique loop (the actual workflow)

```
1. Generate    →  Let the agent produce the screen.
2. Render      →  Run it (or build an HTML mockup) and capture a SCREENSHOT.
3. Critique    →  Feed the screenshot back and score it against the 8 principles.
                  Name the specific failure: "no high-contrast focal point",
                  "hierarchy is muddled — five elements fight for attention".
4. Revise      →  Ask for a targeted fix tied to the named principle.
5. Repeat      →  Until every principle passes. Then add ONE memorable moment.
```

The screenshot is non-negotiable — it is how you give the agent eyes. Critiquing code instead of pixels is how sterile output survives.

---

## The eight principles

| # | Principle | What it does | Failure smell (what to flag in critique) |
|---|-----------|--------------|-------------------------------------------|
| 1 | **Contrast** | Makes elements distinguishable; differences in size, color, weight, shape create hierarchy and draw the eye. | Everything competes equally; no obvious focal point; tonal clashes (e.g. B&W card next to a warm hero). |
| 2 | **Hierarchy** | Guides the eye through content in order of importance — headline before body, primary action distinct from secondary. | Wordmark, tagline, location, section label, and card title all fight for the same level of attention. |
| 3 | **Alignment** | Elements sharing an edge or axis feel related and intentional. Invisible when right; sloppy the instant it's wrong. | Ragged edges, off-axis elements, inconsistent margins. |
| 4 | **Proximity** | Groups related items and separates unrelated ones — white space replaces borders and boxes. | Three facts crammed under a wordmark; dense card stack with no breathing room between groups. |
| 5 | **Repetition / Consistency** | Reusing colors, fonts, shapes, spacing builds cohesion and teaches the system fast. | Mixed typefaces, blue icons + orange accent + B&W photo — decisions made independently. |
| 6 | **Balance** | Distributes visual weight. Symmetrical = stable/formal; asymmetrical = dynamic but resolved. | Bottom-heavy/lopsided layout; a giant text card dominating two-thirds while the hero is truncated. |
| 7 | **White space** | Negative space gives content room to breathe and signals premium/calm vs. cluttered. It is _active_, not empty. | Every pixel working; text on photo + dense stack + crowded nav = the opposite of calm. |
| 8 | **Unity** | The emergent sense that every element belongs. You get it when the other seven agree. | "A template with content poured in" — choices that don't reinforce one idea. |

> **Unity is not a separate technique.** It is the payoff when contrast, hierarchy, alignment, proximity, repetition, balance, and white space all point at the same idea.

---

## Worked example — wellness booking app, V1 → V2

The same screen, before and after a principle-driven critique pass. Use this as the model for the kind of feedback to give an agent.

| Principle | V1 (raw AI output) | V2 (after critique) |
|-----------|--------------------|--------------------|
| **Contrast** | Many colors and sizes, no high-contrast focal point; B&W card clashes with the warm hero. | A single white "Book now" pill on a dark, atmospheric background — the only thing that looks clickable. Nav uses a quiet warm-orange active state, not electric blue, so it signals state without stealing the CTA. |
| **Hierarchy** | Wordmark, tagline, location, "Our Experiences," and card titles all at similar weight. | Crisp three tiers: (1) hero image + tagline + Book now, (2) "Experiences" section label, (3) cards with name + price. Eye moves atmosphere → conversion → browse. |
| **Alignment** | Fine — one container, two lateral axes. | Kept the same structure. (Not every principle needs a fix every pass.) |
| **Proximity** | Tagline + location crammed under the wordmark over the hero; tight lead into dense cards. | Hero carries brand + mood; experiences pushed below to ease the transition into browsing. |
| **Repetition** | Sans wordmark + different body weight + blue icons + orange text + B&W photo. | One typeface family, consistent rounded pills, warm orange as the _sole_ accent, full-color photography throughout. |
| **Balance** | Bottom-heavy; a text-dense card dominates the lower two-thirds; hero truncated; eye sinks. | Asymmetrical balance: commanding hero up top, CTA as the visual fulcrum, two horizontally-scrolling cards anchoring the bottom without overwhelming. |
| **White space** | Every pixel working — cluttered, wrong for a wellness brand. | Negative space around the logo, the CTA, and between the section label and cards. The space _is_ the brand promise: restoration, calm. |
| **Unity** | "A template with content poured in." | Nighttime hero + warm orange + rounded pills + horizontal scroll + consistent margins all reinforce one idea: quiet, premium, nature-based. |

---

## Beware utilitarian AI design

Agents optimize for features and produce a sterile UX. The danger of shipping that base is that you won't stand out — not in a world where everyone can ship an app. After the eight principles pass:

- **Add nuance the agent skipped.** Example: a bare booking flow becomes far more enticing with order recaps surfaced throughout checkout.
- **Engineer one memorable moment** (ties to the skill's "design for that memory" rule): a bold header, an unexpected color, a distinctive typeface, a delightful transition.
- **Keep restraint where the product demands it.** Civic, admin, healthcare, and finance surfaces want clarity, density, and trust — the "memorable moment" there is calm legibility, not spectacle.

---

## How this connects to the rest of the skill

- **Contrast** → also governed by the WCAG ratios in _Color & Visual Design_. Aesthetic contrast and accessible contrast must both pass.
- **Hierarchy** → execute with the _Typography_ rules (3-tier max, weight before size).
- **Proximity / White space** → use the _Spacing Scale_ tokens; don't invent gaps.
- **Repetition** → enforce via _Design Token Foundation_ — one type family, one accent, token-driven radii.
- **Balance / White space / Unity** → realized through _Mobile Aesthetic Atmosphere_ (asymmetry, generous negative space, one memorable moment).
- Fold the eight-principle pass into the _Design Critique Framework_ score before shipping.
