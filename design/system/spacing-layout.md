# Spacing and layout

## Grid and spacing

- Spacing uses the 4-pt scale in [tokens.md](tokens.md). Stacks use `--s4` (16) between related items and `--s6` (24) between sections.
- Card padding is 24px at ≥ 640px and 16px below. Card headers are 20/24px and are separated from the body by a `--border` divider.
- Field label to control: 6px. Field to field: 24px (`stack-lg`), or 12–16px inside a two-column row.

## Breakpoints

| Name | Width | Reference viewport |
| --- | --- | --- |
| `sm` (mobile web) | < 640px | 390 × 844 (tested 360–430) |
| `md` (narrow / tablet web) | 640–1023px | 820 × 1100 |
| `lg` (desktop) | ≥ 1024px | **1440 × 900** (primary) |
| `xl` layout switch | ≥ 1200px | Asides appear beside content |

Production implements these as viewport breakpoints in Tailwind: `sm` 640, `md` 768, `lg` 1024, `xl` 1280 (the 1200px aside switch is a custom `min-[1200px]` breakpoint named `aside` in the theme).

## App shell

- **Top bar:** 60px tall, sticky, white, bottom border. It holds the brand, the Projects nav, a credits pill and the account avatar. Below 640px the wordmark text hides and only the mark shows.
- **Project workflow (≥ 1024px):** a 232px stepper rail on the left, sticky and scrolling on its own, with the main column beside it. The main column is the head (breadcrumb, step title, subtitle, save state), then content (max 1120px), then a sticky footer action bar.
- **Project workflow (< 1024px):** the rail is replaced by a sticky, horizontally scrolling step tab strip under the top bar, with a “Step n of 9: Name” line under it. The footer bar stays sticky at the bottom and respects `env(safe-area-inset-bottom)`.
- **Content with aside (≥ 1200px):** a main column plus a 280–320px aside (facts summary, claim check, length). Below 1200px the aside either stacks (Script Studio shows the length and claim-check cards above the hooks) or hides when its content is repeated elsewhere (Product and Fact review help panels).

## Page layouts

| Screen | ≥ 1200px | 640–1199px | < 640px |
| --- | --- | --- | --- |
| Sign in | 1.1fr dark stage + 1fr sign-in panel | Panel only, brand shown above the title | Panel only, 16px gutters |
| Dashboard | 3-column card grid, max 1200px | 2 columns (1 below 768px) | 1 column; New button full width |
| Product | Form column + 280px sources aside | Form only | Single column; import button full width; tiles in 2 columns |
| Fact review | List + 300px aside | List only | Row actions wrap below the claim |
| Strategy | Form + 280px approved-facts aside | Form only; angles 2-up (1-up < 768px) | Single column |
| Script Studio | Main + 300px aside | Aside cards first (2-up), then hooks and scenes | Aside cards 1-up; hook rail 1.15 visible |
| Creator brief | Brief + 320px aside | Brief then aside | Brief text 12px |

## Footer action bar

- Left: a back link to the previous step (hidden below 640px, because browser back and the step strip cover it).
- Right: the gating reason (below 640px it moves into the disabled button’s accessible description), then the primary action.
- Below 640px the primary action stretches to fill the bar.

## Scroll behaviour

- The page scrolls vertically. The top bar, mobile step strip and footer are sticky, and asides are sticky from 84px.
- Horizontal scrolling happens only inside declared scrollers (see [components-states.md](components-states.md#scrollers)). The page itself never scrolls horizontally at any width from 360px up.
- Grid and flex children that contain a scroller get `min-width: 0`, so the scroller cannot widen its column.
