# Design — "Can I afford to retire?"

Visual and interaction design decisions. Companion documents: `Architecture.md` and `Specs.md`.

## 1. Direction: Neo-brutalism

Raw early-web structure blended with vibrant modern pop. The interface should feel like a bold poster you can grab and move: every element sits on the page with a visible outline and a hard shadow, colors are loud and flat, type is heavy.

Five rules, applied everywhere without exception:

1. **Thick outlines** — every card, button, input, slider track, badge and popover has a solid black border.
2. **Hard shadows** — solid, unblurred black shadows offset to the bottom-right at a sharp angle.
3. **Vibrant colors** — high-contrast neon/primary fills on plain off-white or black backgrounds.
4. **Loud typography** — heavy, oversized sans-serif for headings, monospace for numbers.
5. **Zero blurs** — flat geometry only. No gradients, glows, blurred shadows, frosted glass, or soft transitions.

## 2. Design tokens

Implemented as CSS custom properties in `app/globals.css` and mapped into the Tailwind theme.

### 2.1 Colors

| Token | Value | Use |
|---|---|---|
| `--color-ink` | `#000000` | Borders, shadows, primary text, black surfaces |
| `--color-paper` | `#FFFDF5` | Page background (warm off-white; never pure white) |
| `--color-surface` | `#FFFFFF` | Card fill |
| `--color-acid` | `#C6FF00` | Primary accent: active slider fill, primary buttons, "lasts" verdict |
| `--color-hot` | `#FF3D71` | Danger/alert: "runs out" verdict, shortfall values |
| `--color-sky` | `#3D8BFF` | Secondary accent: section "Timeline", info popovers, links |
| `--color-sun` | `#FFD400` | Tertiary accent: section "Spending", disclaimer badge |
| `--color-lilac` | `#B49CFF` | Section "Savings", chart accumulation phase |
| `--color-mint` | `#4DFFB8` | Positive deltas ("spend more", surplus) |
| `--color-muted` | `#6B6B6B` | Secondary text (only on paper/surface) |

Rules:
- Text on any accent fill is always `--color-ink`. Text on `--color-ink` is `--color-paper`. All pairings above meet WCAG AA for normal text; `--color-hot` on paper is reserved for large text (≥ 18 px bold) or paired with an ink outline.
- Each **section owns one accent color** (Spending = sun, Timeline = sky, Savings = lilac) used for its header block and slider fill, so the three sections are recognisable at a glance and in the chart.
- No opacity on colors; disabled states use a diagonal black hatch pattern (`repeating-linear-gradient` with hard stops — stops are 100 % sharp, so this is still "no gradients").

### 2.2 Borders and shadows

| Token | Value |
|---|---|
| `--border-w` | `3px` (mobile) / `4px` (≥ 1024 px) |
| `--radius` | `0` (default) — cards, inputs; `--radius-pill: 999px` only for slider thumbs and badges |
| `--shadow-sm` | `4px 4px 0 0 var(--color-ink)` — badges, small buttons |
| `--shadow-md` | `8px 8px 0 0 var(--color-ink)` — cards, popovers |
| `--shadow-lg` | `12px 12px 0 0 var(--color-ink)` — result panel, hero |

Interaction pattern for anything clickable: on hover the element translates `-2px, -2px` and its shadow grows by 2 px; on press it translates `+4px, +4px` and the shadow collapses to `0`. This gives a physical "button being pushed" feel with no blur or color change. Transitions are `80ms linear` and disabled under `prefers-reduced-motion`.

### 2.3 Typography

Loaded via `next/font` (self-hosted, only used weights):

| Role | Font | Weight | Size (mobile / desktop) |
|---|---|---|---|
| Display / verdict headline | **Archivo Black** | 400 (single heavy weight) | 40 px / 72 px, `line-height 0.95`, uppercase, `letter-spacing -0.02em` |
| Section titles, buttons, labels | **Space Grotesk** | 700 | 20 px / 24 px titles; 14 px / 16 px labels, uppercase, `letter-spacing 0.04em` |
| Body / help text | **Space Grotesk** | 500 | 16 px / 17 px |
| Numbers (slider values, key figures, deltas) | **JetBrains Mono** | 700 | 24 px / 32 px values; 40 px / 56 px key figures, `font-variant-numeric: tabular-nums` |

Numbers always use tabular figures so values don't jitter horizontally while sliders move.

### 2.4 Spacing and grid

- Base unit 4 px; component padding 16 / 24 px; section gap 24 / 40 px.
- Max content width 1200 px. Desktop: 2 columns `minmax(0, 7fr) minmax(0, 5fr)` with the result column `position: sticky; top: 24px`.
- Mobile: single column, 16 px side padding, sticky bottom result bar 64 px tall (with `env(safe-area-inset-bottom)`).

## 3. Components

### 3.1 Card (section)

White surface, ink border, `--shadow-md`. The **header is a full-bleed colored block** in the section's accent color with the title in Space Grotesk 700 uppercase on the left and the **Simple/Expert toggle** on the right. The body is white with sliders stacked vertically, separated by 3 px ink rules.

### 3.2 Slider field

```
┌──────────────────────────────────────────────────────────┐
│ MONTHLY GAP  (?)                        ┌────────────┐   │
│                                         │ 2.000 €/mo │   │  ← value badge, mono, ink border, shadow-sm
│                                         └────────────┘   │
│ ┃━━━━━━━━━━━━━━━━━━━●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┃ │  ← track
│ 0 €                                              5.000 € │  ← range ends, muted
└──────────────────────────────────────────────────────────┘
```

- **Track:** 16 px tall (mobile) / 12 px (desktop), ink border, white fill; the filled part left of the thumb is the section accent color.
- **Thumb:** 32 px circle (touch target padded to 44 px), white fill, ink border, `--shadow-sm`. While dragging the thumb fills with the accent color and the shadow collapses (pressed state). Focus ring is a 3 px ink outline offset by 3 px (no glow).
- **Value badge:** mono, bold, updates live; the unit is part of the badge (`€/mo`, `yrs`, `€`).
- **Label:** short label from `Specs.md` §5.1 in uppercase Space Grotesk, followed by the help icon.
- **Help icon "?":** 24 px square, ink border, sun fill, bold "?"; opens a **popover** (white, ink border, `--shadow-md`, max-width 320 px) below/above the icon with the long description. On mobile the popover is full-width within the card. Closes on outside tap or Escape.
- **Retirement-age change card** shows a months-precise value ("64 yrs 11 mo") in mono even though the slider steps in whole years; the Apply button label reads "Apply (65)" to make the rounding explicit.
- **Pushed sliders** (age rule) flash their accent fill for 150 ms so the user notices the automatic move.

### 3.3 Buttons

- **Primary:** acid fill, ink text, ink border, `--shadow-sm`, uppercase Space Grotesk 700.
- **Secondary:** white fill, ink text, same border/shadow.
- **Toggle (Simple/Expert):** secondary style; when active shows ink fill with paper text. In v1 disabled with hatch pattern and label "EXPERT — COMING SOON".
- **Apply (in change cards):** small secondary with a `→` arrow.

### 3.4 Result panel

- Outer card with `--shadow-lg`.
- **Verdict block:** full-bleed fill, **acid** when the money lasts, **hot** when it runs out. Headline in Archivo Black ("LASTS UNTIL 84" / "RUNS OUT AT 79"), sub-line in Space Grotesk 700. A single-line italic disclaimer in 14 px underneath.
- **Key numbers:** three stacked rows, label left (uppercase, small), value right (mono, large). Surplus shown in mint, shortfall in hot, both with ink outline text-shadow-free.
- **Change cards:** three small cards in a row (desktop) / stacked (mobile), each with its section's accent as a 12 px left stripe, delta value in mono bold, one sentence of copy, "Apply" button.
- **Chart:** inline SVG, 3 px ink stroke stepped line, accumulation phase filled with lilac, drawdown phase filled with acid (or hot below zero), zero line dashed ink, vertical marker at retirement age with a small ink label badge. Axis labels mono 12 px. No anti-aliased gradients; areas are flat fills.

### 3.5 Mobile sticky result bar

Fixed to the bottom, ink border on top, fill acid/hot matching the verdict, mono text "LASTS UNTIL 84 · +111.700 €" and a chevron. Tapping scrolls to the result panel. Hidden when the panel is already in view.

### 3.6 Header and footer

- **Header:** title "CAN I AFFORD TO RETIRE?" in Archivo Black, spanning up to 3 lines on mobile; tagline in Space Grotesk; a rotated (−3°) sun-colored badge "FOR ILLUSTRATION ONLY" with ink border and shadow.
- **Footer:** ink background, paper text, lists model assumptions in a two-column mono list, link to source repository.

## 4. Motion

- Only three animations: button push (80 ms), pushed-slider flash (150 ms), chart path update (none — the path is recomputed each frame, no tweening, so it tracks the thumb 1:1).
- Everything respects `prefers-reduced-motion: reduce` (all durations → 0).

## 5. Responsive behaviour summary

| Breakpoint | Layout |
|---|---|
| < 640 px | Single column, 3 px borders, sticky bottom bar, change cards stacked, chart 200 px tall |
| 640 – 1023 px | Single column, wider padding, change cards in a row of 3 |
| ≥ 1024 px | Two columns, 4 px borders, sticky result panel, chart 280 px tall, larger display type |

## 6. Accessibility

- Every slider: `role="slider"` (from Radix), `aria-label` with the long label, `aria-valuetext` with the formatted value and unit.
- Help popovers: triggered by a real `<button aria-label="Explain monthly need">`, content with `role="dialog"`, focus moves in and returns on close.
- Verdict changes are announced through a visually hidden `aria-live="polite"` region, throttled to once per 500 ms during drags.
- Color is never the only carrier of meaning: "lasts"/"runs out" is also text and an icon (✓ / ✗ with heavy stroke).
- Focus states are always visible (3 px ink outline), never removed.

## 7. Assets

- Favicon: ink square with acid "?" — flat SVG.
- OG image (1200 × 630): paper background, title in Archivo Black, an acid card with a hard shadow showing "LASTS UNTIL 84". Static PNG in `public/`.

## 8. Anti-patterns (explicitly banned)

Gradients (except hard-stop hatch), `box-shadow` with blur radius, `backdrop-filter`, `opacity` below 1 on colors, border radii on cards/inputs, thin (1–2 px) borders, light font weights (< 500), pure white page background, hover color fades, skeleton shimmers.
