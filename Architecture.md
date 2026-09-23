# Architecture — "Can I afford to retire?"

Technical decisions for the retirement illustration web app. Companion documents: `Specs.md` (features) and `Design.md` (visual design).

## 1. Guiding constraints

- Deployed on **Vercel** by the project owner.
- **All calculations run client-side** in the browser. No backend, no database, no user accounts, no data leaves the device.
- Must work equally well on **mobile (touch)** and **desktop (mouse/keyboard)**.
- Results must **update live** while sliders are dragged, with no perceptible lag.
- Calculation logic must be split into **small pure functions** with descriptive unit tests.

## 2. Stack

| Concern | Decision | Why |
|---|---|---|
| Framework | **Next.js 16 (App Router, Turbopack)** with **React 19** | First-class Vercel support, zero-config deploys, file-based routing, `next/font` for self-hosted fonts. |
| Language | **TypeScript** (strict mode) | Type-safe calculation inputs/outputs; catches unit mix-ups (years vs. months, € vs. cents). |
| Package manager | **pnpm** | Fast, strict dependency resolution; supported by Vercel out of the box. |
| Styling | **Tailwind CSS v4** | Utility classes make the Neo-brutalist system (thick borders, hard offset shadows, flat colors) trivial to express and keep consistent via design tokens in CSS variables. |
| UI primitives | **Radix UI Primitives** (`@radix-ui/react-slider`, `@radix-ui/react-popover`, `@radix-ui/react-tooltip`) | Unstyled, accessible (keyboard, ARIA, touch) slider and popover; we own 100% of the visuals. |
| Icons | **lucide-react** | Small, tree-shakeable, stroke-based icons that can be rendered with heavy stroke widths to match the design. |
| Number formatting | Native **`Intl.NumberFormat`** | No dependency; `de-DE` locale for `€` and `.` thousands separators. |
| Unit tests | **Vitest** | Fast, TypeScript-native, zero config with Vite; runs in CI and locally. |
| Component tests | **Vitest + @testing-library/react** | Verify slider constraint behavior (auto-shifting of ages) in the UI layer. |
| Lint / format | **ESLint** (`eslint-config-next`) + **Prettier** | Standard Next.js tooling. |
| Node version | **Node 22 LTS** (pinned in `.nvmrc`; `engines` allows ≥ 20) | Matches Vercel's default runtime. |

Explicitly **not** used: any backend/API routes, databases, auth, analytics SDKs, state-management libraries (Redux/Zustand), CSS-in-JS runtimes, charting libraries with heavy bundles (a small inline SVG chart is sufficient, see `Specs.md`).

## 3. Rendering strategy

- The whole app is a **single page** (`/`).
- The page is **statically prerendered** at build time (no dynamic data), so Vercel serves it from the CDN edge.
- Interactive parts are **Client Components** (`"use client"`): the slider panel and result panel. Static copy (heading, disclaimer, footer) stays in Server Components to keep the client bundle minimal.
- No `next/image` remote loaders or server actions are required.

## 4. Project structure

```
retire/
├─ app/
│  ├─ layout.tsx            # fonts, metadata, global disclaimer footer
│  ├─ page.tsx              # composes <Calculator />
│  └─ globals.css           # Tailwind import + design tokens (see Design.md)
│  └─ icon.svg              # favicon (flat SVG)
├─ components/
│  ├─ calculator/
│  │  ├─ Calculator.tsx     # holds input state (reducer), derives results, lays out sections
│  │  ├─ Section.tsx        # card with accent header + Simple/Expert toggle
│  │  ├─ SliderField.tsx    # label, value badge, help (?) popover, Radix slider
│  │  ├─ HelpPopover.tsx    # the "?" icon + popover content
│  │  ├─ ResultPanel.tsx    # verdict, key numbers, "what would have to change" cards
│  │  ├─ BalanceChart.tsx   # inline SVG chart of balance over age
│  │  └─ MobileResultBar.tsx# sticky bottom verdict bar (< lg)
│  └─ ui/                   # brutalist primitives: Button, Card
├─ lib/
│  ├─ finance/
│  │  ├─ accumulate.ts      # monthly growth + contribution functions
│  │  ├─ drawdown.ts        # monthly withdrawal functions
│  │  ├─ solve.ts           # "what must change to land at exactly 0 €" solvers
│  │  ├─ plan.ts            # composition: inputs -> full result object
│  │  ├─ types.ts           # PlanInputs, PlanResult, etc.
│  │  └─ index.ts
│  ├─ constraints.ts        # age-slider ordering rules (A < R < P, 1-year gaps)
│  ├─ copy.ts               # labels, help texts, disclaimer, assumptions
│  ├─ format.ts             # currency / years / months formatting (de-DE)
│  └─ defaults.ts           # slider ranges, steps, default values, snapping
├─ tests/
│  ├─ finance/*.test.ts     # unit tests per function + composition tests
│  ├─ constraints.test.ts · format.test.ts
│  ├─ components/*.test.tsx
│  └─ setup.ts
├─ .github/workflows/ci.yml
├─ Architecture.md · Specs.md · Design.md
└─ package.json · tsconfig.json · vitest.config.mts · eslint.config.mjs · .nvmrc · .prettierrc
```

## 5. State management

- Input state is a single `PlanInputs` object held in `Calculator.tsx` via `useState`/`useReducer`.
- **Constraint enforcement happens in the reducer** (`lib/constraints.ts`): every update passes through `applyAgeConstraints(inputs, changedField)` which shifts dependent sliders (retirement age, payout-end age) instead of rejecting the change. This keeps the UI dumb and makes the rule unit-testable.
- Results are **derived**, never stored: `const result = useMemo(() => computePlan(inputs), [inputs])`. The computation is O(months) — ≤ 1.200 iterations for the accumulation loop plus ≤ 1.200 closed-form evaluations for the retirement-age solver — well under a millisecond, so it runs on every pointer-move event; no debouncing is needed.
- Per-section **Simple/Expert** mode is UI-only state (`Record<SectionId, "simple" | "expert">`), not part of `PlanInputs`.
- **Shareable state (nice-to-have, v1.1):** mirror `PlanInputs` into the URL query string (`?need=2000&age=35…`) so a configuration can be bookmarked or sent. Read once on mount, write with `history.replaceState` (no Next.js navigation) to avoid re-renders.

No persistence beyond that; a page reload resets to defaults (or to the URL state if present).

## 6. Calculation layer design rules

- Lives entirely in `lib/finance/`, **framework-free** (no React imports), so it can be tested and reasoned about in isolation.
- Every function is **pure**, takes primitives or plain objects, and returns new values.
- **Units are explicit** in names: `monthlyGap`, `annualRate`, `monthlyRate`, `monthsOfAccumulation`, `monthsOfPayout`. Money is a `number` in euros (inputs are integer euros; intermediate results may be fractional and are rounded only for display). Time inside the finance layer is always in **months**; conversion from the year-based sliders happens once at the boundary.
- Composition is layered:
  1. Primitive steps: `monthlyRateFromAnnual(rate)`, `growOneMonth(balance, monthlyRate)`, `addMonthlyContribution(balance, monthly)`.
  2. Loops: `accumulateEtf(...)` returning both the final balance and a per-month series (down-sampled to yearly points for the chart).
  3. Drawdown: `monthsUntilDepleted(total, monthlyGap)`, `balanceAfterMonths(total, monthlyGap, months)`.
  4. Solvers: `solveMonthlyGap`, `solveMonthlySavings`, `solveRetirementAge` (month-granular).
  5. `computePlan(inputs): PlanResult` composes all of the above.
- Model conventions (decided, see `Specs.md` §9.3): amounts are in today's euros with a user-set **real** return (slider, default 4 %); monthly compounding with the equivalent monthly rate `(1 + r)^(1/12) − 1`; contributions at the end of each month; no growth during drawdown.
- The Expert-mode inputs (later) are added as **optional fields with defaults** on `PlanInputs`, so Simple mode is just Expert mode with defaults — no second code path.

## 7. Testing strategy

- **Unit tests** for every function in `lib/finance/` and `lib/constraints.ts`, named as behavior sentences, e.g. `"after 12 months with no contributions equals the start balance × 1,05"`, `"raising current age above retirement age pushes retirement age to current age + 1"`.
- **Composition tests** for `computePlan` using hand-verified scenarios (including the default slider values, zero-years-to-retirement edge case, and the "runs out of money" case).
- **Property-style checks** where cheap: solving for the monthly gap and feeding it back into `computePlan` yields an end balance of `0` within rounding tolerance; the loop and the closed form agree within 1 cent.
- **Component tests** for the age-slider shifting behavior and the help popover.
- `pnpm test` runs in CI (see below). No E2E framework in v1.

## 8. Tooling, CI and deployment

- **Scripts:** `dev`, `build`, `start`, `lint`, `typecheck` (`tsc --noEmit`), `test`, `test:watch`, `format`.
- **GitHub Actions** (`.github/workflows/ci.yml`): on push/PR run `pnpm install --frozen-lockfile`, `lint`, `typecheck`, `test`, `build`.
- **Vercel:** connect the Git repository; framework preset "Next.js" is auto-detected. Every push to `main` deploys to production, every PR gets a preview URL. No environment variables are required.
- **Metadata:** `app/layout.tsx` sets title, description, and an Open Graph image so shared links look right.

## 9. Performance and accessibility targets

- Lighthouse ≥ 95 in Performance, Accessibility, Best Practices on mobile.
- Client JS budget for the page < 120 kB gzipped (Next runtime + React + Radix slider/popover + app code).
- Fonts self-hosted via `next/font` with `display: swap`; only the weights actually used are loaded.
- Sliders are operable via keyboard (arrow keys, Home/End, Page Up/Down), have `aria-label`, `aria-valuetext` (e.g. "2.000 € per month"), and touch targets ≥ 44 × 44 px.
- Colors meet WCAG AA contrast against their backgrounds (see `Design.md`).
- `prefers-reduced-motion` disables the (already minimal) transitions.

## 10. Browser support

Evergreen browsers (last 2 versions of Chrome, Edge, Firefox, Safari) plus iOS Safari 16+ and Android Chrome. No IE or legacy polyfills.

## 11. Open technical decisions

- Whether to ship URL-state sharing in v1 or v1.1 (default: v1.1).
- UI language: **decided** — English copy with `de-DE` number formatting. A German translation can be added later via a small `messages.ts` dictionary; no i18n framework is planned.
