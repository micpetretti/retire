# Specs — "Can I afford to retire?"

Feature specification for a single-page retirement illustration tool. Companion documents: `Architecture.md` (technical decisions) and `Design.md` (visual design).

> **Status of this document:** the calculation model in §6 has been reviewed (§9) and the open questions were decided with the project owner on 2026-09-23 (§9.3). The model below reflects those decisions: amounts in today's euros with 5 % real return, slider 1 is the gap savings must cover, monthly compounding, retirement-age solver in months. **v1 (Simple mode) is implemented**; the test names in §8.2 correspond to the tests under `tests/`.

---

## 1. Purpose

The user moves a handful of sliders describing their spending, timeline and savings and instantly sees whether their money would last through retirement — and what would need to change if not.

The app is **an illustration to play with, not financial advice or an actual calculation**. This is stated prominently (see §7.4).

## 2. Users and platforms

- Anyone curious about their retirement outlook; no financial knowledge assumed.
- Equal priority for **mobile** (touch, one-handed, portrait) and **desktop** (mouse, keyboard).
- No sign-up, no saved data, no network requests after page load.

## 3. Page layout

One page, three input **sections** and one **result panel**.

- **Desktop (≥ 1024 px):** two columns. Inputs on the left (scrollable), result panel sticky on the right so it stays visible while dragging sliders.
- **Mobile (< 1024 px):** single column. A compact **sticky result bar** at the bottom shows the verdict (one line, e.g. "Lasts until 91 · +42.300 €") while sliders are used; tapping it scrolls to / expands the full result panel below the inputs.

Order on the page:

1. Header: title, one-sentence tagline, disclaimer badge.
2. Section **Spending** (slider 1)
3. Section **Timeline** (sliders 2, 3, 4)
4. Section **Savings** (sliders 5, 6, 7)
5. Result panel
6. Footer: full disclaimer, assumptions summary, link to source.

## 4. Simple / Expert mode

- Every section has a toggle button in its header. It reads **"Expert"** while the section is in Simple mode and **"Simple"** while in Expert mode.
- Clicking **Expert** reveals additional inputs *below the section's sliders*; clicking **Simple** hides them again. Hidden Expert inputs keep their values but **do not affect the calculation** while hidden (Simple mode always uses the documented defaults, so the Simple result is reproducible).
- Mode is per section and not persisted.
- **v1:** the Expert toggle is rendered but disabled and labelled **"Expert — coming soon"**; no Expert inputs exist yet. The planned Expert inputs are listed in §10 so the data model can be prepared for them.

## 5. Simple mode inputs

All Simple-mode inputs are **sliders** with a default value, a short label, a live value badge, and a **"?" help icon** that opens a popover with the longer explanation. Results update on every slider movement (during drag, not only on release).

Each slider is also **keyboard operable** (arrow keys ±1 step, Shift+arrow ±10 steps, Home/End). A small text input is not part of v1 (the value badge is read-only).

### 5.1 Slider table

| # | Section | Short label | Range | Step | Default | Unit / format |
|---|---|---|---|---|---|---|
| 1 | Spending | **Monthly gap** | 0 – 5.000 | 50 | 2.000 | `€ / month` |
| 2 | Timeline | **Age now** | 0 – 100 (effective max 98, see §5.3) | 1 | 35 | `years` |
| 3 | Timeline | **Retire at** | 0 – 100 (effective 1 – 99) | 1 | 67 | `years` |
| 4 | Timeline | **Paid until** | 0 – 100 (effective 2 – 100) | 1 | 84 | `years` |
| 5 | Savings | **Cash** | 0 – 500.000 | 1.000 | 10.000 | `€` |
| 6 | Savings | **In ETFs** | 0 – 500.000 | 1.000 | 10.000 | `€` |
| 7 | Savings | **ETF savings** | 0 – 5.000 | 50 | 500 | `€ / month` |

Defaults for sliders 2 and 3 were not specified and are proposed here: 35 (a typical age to start thinking about this) and 67 (German statutory retirement age). Default for slider 4 is 84 as specified.

### 5.2 Help popover texts

Text is shown when the "?" icon next to the label is clicked/tapped (popover, closes on outside click or Escape).

1. **Monthly gap** — "How much money per month you'll need from your own savings in retirement — on top of what a state pension or other income covers. In today's euros. The illustration withdraws this amount from your savings every month."
2. **Age now** — "Your current age in full years."
3. **Retire at** — "The age at which you stop working and start living off your savings. From this point on, no more money goes into ETFs and withdrawals begin. Must be at least one year after your current age."
4. **Paid until** — "The age until which your savings need to last. The default of 84 is the average life expectancy of women in Germany (women live longer than men on average, so this is the safer assumption). Must be at least one year after your retirement age."
5. **Cash** — "Money that is *not* invested in the capital markets: current account, savings account, cash under the mattress, fixed deposits with low interest. The illustration assumes this money does not grow."
6. **In ETFs** — "Money you already have invested in ETFs (or similar broadly diversified investments). The illustration assumes it grows by 5 % per year *after inflation* until you retire, compounded monthly."
7. **ETF savings** — "How much you put into ETFs every month from now until you retire. Contributions stop at retirement."

Additionally, the result panel has a "How is this calculated?" help entry summarising §6 in plain language and listing the assumptions: all amounts are in today's euros; ETFs grow 5 % per year in real terms (after inflation) until retirement; no growth after retirement; no taxes or fees; state pension or other income is *not* modelled — slider 1 is what savings must cover on top of it.

### 5.3 Age ordering rules (sliders 2, 3, 4)

Rule: **Age now < Retire at < Paid until**, each at least one year apart.

Instead of showing errors, the slider **being moved always wins** and its neighbours are pushed:

| User moves | Condition | Effect |
|---|---|---|
| Age now (2) up | new 2 ≥ 3 | 3 := 2 + 1; then if 3 ≥ 4, 4 := 3 + 1 |
| Retire at (3) up | new 3 ≥ 4 | 4 := 3 + 1 |
| Retire at (3) down | new 3 ≤ 2 | 2 := 3 − 1 |
| Paid until (4) down | new 4 ≤ 3 | 3 := 4 − 1; then if 3 ≤ 2, 2 := 3 − 1 |
| Age now (2) down / Paid until (4) up | — | no effect on other sliders |

Because pushes chain toward the ends of the range and all three sliders share the range 0 – 100, the **effective maxima are 98 / 99 / 100** and the **effective minima are 0 / 1 / 2**. The slider tracks still display 0 – 100 for consistency; the thumb simply cannot be dragged beyond the effective limit. (Alternative under consideration: show the real effective range on each track — see §9.3.)

Pushed sliders animate to their new position (≤ 150 ms, disabled with `prefers-reduced-motion`).

## 6. Calculation model (Simple mode)

Symbols:

| Symbol | Meaning | Source |
|---|---|---|
| `W` | monthly gap to cover from savings in retirement (€, today's euros) | slider 1 |
| `A` | current age (years) | slider 2 |
| `R` | retirement age (years) | slider 3 |
| `P` | payout end age (years) | slider 4 |
| `C` | cash (€) | slider 5 |
| `E` | current ETF balance (€) | slider 6 |
| `S` | monthly ETF savings (€) | slider 7 |
| `r` | annual **real** ETF growth rate (after inflation) | fixed **0.05** in Simple mode |
| `i = (1 + r)^(1/12) − 1` | equivalent monthly growth rate (≈ 0,4074 %) | derived |
| `N = 12 · (R − A)` | months of accumulation (≥ 12) | derived |
| `m = 12 · (P − R)` | months of payout (≥ 12) | derived |

**All amounts are in today's euros.** The 5 % is interpreted as growth *after* inflation, so a 2.000 € monthly gap keeps its purchasing power throughout. This is a wording/interpretation decision, not a computation.

### 6.1 Accumulation phase (from `A` to `R`)

**Monthly compounding.** For each of the `N` months, the ETF balance grows by `i` and then receives that month's contribution `S`. Cash does not grow.

```
E₀ = E
Eₖ₊₁ = Eₖ · (1 + i) + S            for k = 0 … N−1
T = C + E_N                         total available at retirement
```

Equivalent closed form (used by the solvers, cross-checked against the loop in tests):

```
F = ((1 + i)^N − 1) / i             future value of 1 € saved per month
E_N = E · (1 + i)^N + S · F
```

Conventions:
- `i` is the **equivalent** monthly rate, so `(1 + i)^12 = 1,05` exactly and the help text "5 % per year" stays literally true. (Using `r / 12` instead would give an effective 5,12 % per year and ≈ 2 % more capital over 32 years.)
- Contributions are made at the **end of each month** (after that month's growth). Over 32 years the difference to start-of-month is ≈ 0,4 %, i.e. negligible for an illustration.

### 6.2 Drawdown phase (from `R` to `P`)

No growth of any kind. Each month `W` is withdrawn from `T`.

```
B(t) = T − W · t                    balance after t months of retirement
endBalance = B(m) = T − W · m
monthsUntilDepleted = W > 0 ? floor(T / W) : ∞
depletionAge = R + monthsUntilDepleted / 12   (only if endBalance < 0)
```

### 6.3 Verdict

- `endBalance ≥ 0` → **"Your money lasts."** Show the leftover at age `P`.
- `endBalance < 0` → **"Your money runs out."** Show the age (years + months) at which it runs out and how many years/months short of `P` that is, plus the shortfall in €.

### 6.4 "What would have to change" — solving for exactly 0 € at age `P`

Each solver changes **one** input while holding all others fixed and reports the target value and the delta from the current value.

**a) Monthly gap `W*`** (closed form)

```
W* = T / m
Δ = W* − W        (positive: "you could spend Δ more", negative: "you'd need to spend |Δ| less")
```

**b) Monthly ETF savings `S*`** (closed form, `T` is linear in `S`)

```
S* = (W · m − C − E · (1 + i)^N) / F
Δ = S* − S
```

Edge handling:
- `S* < 0` → even saving 0 €/month leaves a surplus. Report: "You could stop saving entirely and still have X € left." (clamp displayed target at 0).
- `S* > 5.000` (slider max) → report the true value anyway ("you'd need to save S* €/month — above the slider range").

**c) Retirement age `R*`** (month-granular search)

Changing `R` affects both phases: retiring later means more months of growth and contributions *and* fewer months of withdrawals. Let `k` be the number of months of accumulation (retirement happens `k` months after now, at age `A + k/12`); the payout then lasts `12 · (P − A) − k` months. `endBalance(k)` is strictly increasing in `k`, so:

```
k* = smallest integer k in [1, 12·(P−A) − 1] with endBalance(k) ≥ 0
R* = A + k*/12                          reported as "Y years M months"
```

- The search is a linear scan over ≤ 1.200 months (or a binary search — both trivial). Because the granularity is one month, `endBalance(k*)` is within one month of contributions/withdrawals of 0 €, i.e. "exactly 0" for display purposes.
- Report as "retire at **64 years 11 months** — 2 years 1 month earlier than planned".
- If no such `k` exists (even retiring one month before `P` fails) → "Retiring later alone isn't enough."
- If `k* = 1` and the current plan already lasts → "You could retire as early as next month."
- The **Apply** button (§7.3) sets the year-granular slider 3 to `ceil(R*)` (round *up*, so the applied plan still lasts) and mentions the rounding.

Each solver's result is verified in tests by feeding the solved value back into `computePlan` and asserting `endBalance ≈ 0` (a, b) or `endBalance(k*) ≥ 0` with `endBalance(k* − 1) < 0` (c).

### 6.5 Worked example (default values)

`W = 2.000, A = 35, R = 67, P = 84, C = 10.000, E = 10.000, S = 500, r = 0.05` → `i ≈ 0,00407412, N = 384, m = 204`

```
(1 + i)^384 = 1,05^32 ≈ 4,7649
F = (4,7649 − 1) / 0,00407412 ≈ 924,11
E_N ≈ 10.000 · 4,7649 + 500 · 924,11 ≈ 47.649 + 462.055 ≈ 509.705
T  ≈ 519.705
needed = W · m = 408.000
endBalance ≈ +111.705   → "Your money lasts. About 111.700 € left at 84."

W* = 519.705 / 204 ≈ 2.547,57            → "You could spend ~548 € more per month."
S* = (408.000 − 10.000 − 47.649) / 924,11 ≈ 379,12   → "You could save ~121 € less per month."
k* = 359 → R* = 64 years 11 months (endBalance ≈ +580 €)   → "You could retire 2 years 1 month earlier."
```

(Figures verified with a reference script; they become the first composition test. The retirement-age lever is steep: each month of earlier retirement removes a month of growth *and* 500 € of contributions *and* adds 2.000 € of withdrawals — roughly 4.500 € per month in this scenario.)

### 6.6 Edge cases

| Case | Behaviour |
|---|---|
| `W = 0` | Never depleted; endBalance = T; solvers a) returns `T/m`, b) returns clamped 0, c) returns `k* = 1`. |
| `T = 0` (no cash, no ETFs, no savings) | Runs out immediately at `R` (if `W > 0`). |
| `N = 12`, `m = 12` (minimum gaps) | Works; loop runs twelve times. |
| Very large values (500k cash + 500k ETFs + 5k/month over 98 years) | Numbers stay far below `Number.MAX_SAFE_INTEGER`; display uses compact formatting (e.g. `12,3 Mio. €`) above 10 M €. |
| Solver targets outside slider range | Reported truthfully with a note (never silently clamped, except `S* < 0`). |

## 7. Result panel

### 7.1 Verdict block (always visible; also mirrored in the mobile sticky bar)

- Large headline: **"Lasts until 84 ✓"** or **"Runs out at 79"**.
- Sub-line: leftover or shortfall in € and, if short, "5 years 3 months too early".

### 7.2 Key numbers

- Money at retirement `T` (split: cash + ETFs).
- Total needed for payout `W · m`.
- Difference (surplus / shortfall).

### 7.3 "To land at exactly 0 € at `P`" — three cards

| Card | Content |
|---|---|
| Spending | "Spend **548 € more** per month (2.548 € instead of 2.000 €)" |
| Retirement age | "Retire **2 years 1 month earlier** (at 64 years 11 months instead of 67)" |
| Saving | "Save **121 € less** per month (379 € instead of 500 €)" |

Each card has an **"Apply"** button that sets the corresponding slider to the solved value, rounded to the slider step **conservatively** so the applied plan still lasts (monthly gap rounded *down* to 50 €, savings rounded *up* to 50 €, retirement age rounded *up* to the next whole year). The button label shows the value that will be applied, e.g. "Apply (2.500 €)". If the target lies outside the slider range the button is disabled with a hint. Wording flips to "less / later / more" when the plan is short; when the current value is already exact the card reads "Spot on".

### 7.4 Chart

Inline SVG chart of the balance from age `A` to `P`: rising during accumulation (one point per year, taken from the monthly series every 12th month), falling linearly during drawdown, with a vertical marker at `R` and a horizontal zero line. If the balance crosses zero, the crossing age is labelled. No library; purely presentational; hidden from screen readers (the numbers are in text).

### 7.5 Disclaimer

- A badge in the header: **"For illustration only"**.
- The result panel headline is followed by the line: *"This is a simplified illustration to play with — not financial advice and not an actual calculation of your pension."*
- The footer lists all assumptions of the model: all amounts in today's euros; ETFs grow 5 % p.a. after inflation before retirement, compounded monthly; 0 % growth after retirement; no taxes or fees; state pension / other income not modelled (slider 1 is the gap savings must cover); cash does not grow.

## 8. Calculation functions and tests

All functions live in `lib/finance/` and are pure. Test names are the behaviour sentences below.

### 8.1 Functions

| Function | Signature | Purpose |
|---|---|---|
| `monthlyRateFromAnnual` | `(annualRate) → number` | `(1 + r)^(1/12) − 1`; `0 → 0` |
| `growOneMonth` | `(balance, monthlyRate) → number` | `balance · (1 + i)` |
| `addMonthlyContribution` | `(balance, monthly) → number` | `balance + S` |
| `accumulateMonth` | `(balance, monthlyRate, monthly) → number` | compose the two above |
| `accumulateEtf` | `(etf, monthly, monthlyRate, months) → { final, series: number[] }` | loop; `series[k]` = balance after month `k` (`series[0] = etf`) |
| `futureValueFactor` | `(monthlyRate, months) → number` | `((1+i)^N − 1)/i`, with `i = 0` → `N` |
| `etfClosedForm` | `(etf, monthly, monthlyRate, months) → number` | closed form of `accumulateEtf().final` |
| `totalAtRetirement` | `(cash, etfFinal) → number` | `cash + etfFinal` |
| `monthsOfAccumulation` | `(currentAge, retirementAge) → number` | `12 · (R − A)` |
| `monthsOfPayout` | `(retirementAge, payoutEndAge) → number` | `12 · (P − R)` |
| `balanceAfterMonths` | `(total, monthlyGap, months) → number` | `T − W · t` |
| `monthsUntilDepleted` | `(total, monthlyGap) → number \| Infinity` | `floor(T / W)` |
| `ageAfterMonths` | `(startAge, months) → { years, months }` | e.g. depletion age or `R*` |
| `yearlyPoints` | `(monthlySeries) → number[]` | every 12th entry, for the chart |
| `drawdownSeries` | `(total, monthlyGap, months) → number[]` | monthly balance points during payout |
| `endBalanceForAccumulationMonths` | `(inputs, k) → number` | `T(k) − W · (12·(P−A) − k)`; core of solver c |
| `solveMonthlyGap` | `(total, months) → number` | `T / m` |
| `solveMonthlySavings` | `(inputs) → { target, clampedToZero }` | §6.4 b |
| `solveRetirementAge` | `(inputs) → { months: k*, age: { years, months } } \| { unreachable: true }` | §6.4 c |
| `computePlan` | `(inputs: PlanInputs) → PlanResult` | composition of everything |
| `applyAgeConstraints` (in `lib/constraints.ts`) | `(inputs, changedField) → PlanInputs` | §5.3 |

### 8.2 Test cases (descriptive names)

**monthlyRateFromAnnual**
- 5 % per year becomes ≈ 0,40741 % per month
- compounding the monthly rate twelve times gives back exactly 5 % (±1e-12)
- 0 % per year stays 0 %

**growOneMonth**
- grows 10.000 € by the monthly rate for 5 % p.a. to ≈ 10.040,74 €
- leaves the balance unchanged at 0 % growth
- returns 0 for a 0 € balance

**addMonthlyContribution**
- adds 500 € to the balance
- adds nothing when monthly savings are 0 €

**accumulateEtf**
- returns the starting balance unchanged after 0 months
- after 1 month equals growOneMonth + one contribution
- after 2 months applies growth to the first month's contribution
- after 12 months with no contributions equals the start balance × 1,05 (±1 cent)
- series has `months + 1` entries starting with the initial balance
- matches `etfClosedForm` for 0, 1, 12, 120 and 780 months within 1 cent

**futureValueFactor**
- equals the number of months when the rate is 0
- equals `2 + i` for two months

**monthsOfAccumulation / monthsOfPayout**
- 35 → 67 gives 384 months
- 67 → 84 gives 204 months

**balanceAfterMonths / monthsUntilDepleted / ageAfterMonths**
- 408.000 € with 2.000 €/month lasts exactly 204 months
- 100.000 € with 3.000 €/month is depleted after 33 full months
- 33 months after age 67 is 69 years 9 months
- never depleted when the monthly gap is 0

**yearlyPoints**
- picks entries 0, 12, 24 … from a monthly series
- a 384-month series yields 33 yearly points

**solveMonthlyGap**
- 519.705 € over 204 months allows ≈ 2.547,57 €/month
- feeding the solved gap back into computePlan yields an end balance of 0 (±0,01 €)

**solveMonthlySavings**
- default scenario solves to ≈ 379,12 €/month
- clamps to 0 and flags it when the plan already has a surplus without any savings
- returns a value above 5.000 when the gap is very large
- feeding the solved savings back into computePlan yields an end balance of 0 (±0,01 €)

**solveRetirementAge**
- default scenario solves to 359 months = 64 years 11 months (end balance ≈ +580 €)
- end balance at `k* − 1` months is negative
- returns 1 month when even retiring next month lasts
- returns unreachable when retiring one month before `P` still runs out
- end balance is strictly increasing in `k` for the default scenario (monotonicity guard)

**computePlan (composition)**
- default scenario: T ≈ 519.705 €, endBalance ≈ +111.705 €, verdict "lasts"
- zero savings, zero ETFs, 10.000 € cash, 2.000 €/month: runs out after 5 months at 67 years 5 months
- minimum gaps (A=30, R=31, P=32): 12 months of growth, 12 months of payout
- chart series has one point per year from A to P inclusive

**applyAgeConstraints**
- raising current age to equal retirement age pushes retirement age to current age + 1
- current age cannot exceed 98 (retirement age 99, payout end 100 remain valid) — exact behaviour depends on §9.3 item 5
- raising retirement age to equal payout end age pushes payout end to retirement age + 1
- lowering payout end age below retirement age pulls retirement age down to payout end − 1
- lowering retirement age below current age pulls current age down to retirement age − 1
- lowering current age never moves the other sliders
- raising payout end age never moves the other sliders

## 9. Review of the calculation model

### 9.1 What is sound

- The model is internally consistent, deterministic and monotonic in every input, which is exactly what makes sliders feel right (moving a slider one way always moves the verdict the same way).
- Monthly compounding with monthly contributions mirrors how ETF savings plans actually work; using the equivalent monthly rate keeps "5 % per year" literally true.
- Ignoring growth during drawdown is a **conservative** simplification: real portfolios keep earning something after retirement, so the verdict errs on the side of "runs out earlier than it probably would".
- The three solvers are well-defined: two have closed forms; the retirement-age solver is monotonic so a scan over ≤ 1.200 months is trivial and lands within one month of 0 €.
- Cash not growing matches its definition in the help text.
- Interpreting all amounts as today's euros with a real return makes the monthly gap meaningful across decades without an inflation input.

### 9.2 Simplifications that are acceptable for v1 (documented, disclosed to the user)

- **No taxes or fees** (Abgeltungsteuer, Vorabpauschale, TER). Overstates the outcome by a moderate amount.
- **No growth after retirement.** Understates the outcome (see above). Planned Expert input.
- **State pension not modelled.** Handled by defining slider 1 as the gap savings must cover; an explicit pension input is the first Expert feature.
- **Fixed 5 % real return, no volatility / sequence-of-returns risk.** Inherent to a deterministic illustration; disclosed.
- **Contributions and growth stop abruptly at retirement**; no glide path.

### 9.3 Decisions taken (2026-09-23)

The following were raised as open questions because they change what the numbers *mean*; they were decided with the project owner and are reflected in §5–§8.

| # | Question | Decision |
|---|---|---|
| 1 | Inflation / purchasing power | Treat 5 % as a **real** (after-inflation) return; all amounts in today's euros; stated in help texts and footer. No inflation input in v1. |
| 2 | Statutory pension / other income | Slider 1 is the **monthly gap** savings must cover on top of pension/other income (label "Monthly gap"). Pension input becomes the first Expert feature. |
| 3 | Contribution timing / compounding | **True monthly compounding**: equivalent monthly rate `i = 1,05^(1/12) − 1`, contribution at the end of each month. |
| 4 | Retirement-age solver granularity | **Month-granular** search; result reported as "Y years M months". Apply rounds up to the next whole year. |
| 5 | Effective age-slider limits | Keep 0 – 100 visual range; thumb stops at the effective limit (98 / 99 / 100 and 0 / 1 / 2). |
| 6 | Defaults for "Age now" / "Retire at" | **35 / 67**. |
| 7 | UI language | **English** UI with `de-DE` number formatting. |

The calculation layer can now be implemented against §6 and §8.

## 10. Expert mode roadmap (not in v1)

Listed so `PlanInputs` can be designed with optional fields and defaults from day one.

| Section | Planned Expert input | Simple-mode default |
|---|---|---|
| Spending | Monthly pension / other retirement income (subtracted from total need) | 0 € |
| Spending | Toggle "amounts are nominal" + annual inflation of the monthly need | real amounts, 0 % |
| Spending | One-off expenses at retirement (e.g. paying off a mortgage) | 0 € |
| Savings | Expected ETF return before retirement | 5 % real |
| Savings | Expected return during drawdown | 0 % |
| Savings | Interest on cash | 0 % |
| Savings | Annual savings-rate increase (e.g. +2 %/year with salary) | 0 % |
| Savings | Capital gains tax on withdrawals | 0 % |

## 11. Out of scope (v1)

- Accounts, saving plans server-side, PDF export.
- Monte-Carlo / historical return simulations.
- Multiple people / households.
- Localisation beyond `de-DE` number formatting.
- Native apps.

## 12. Acceptance criteria (v1)

- All seven sliders present with the specified ranges, defaults, labels and help texts.
- Result panel and mobile sticky bar update during slider drag with no visible lag on a mid-range phone.
- Age ordering rules behave exactly as in §5.3 with no error messages.
- Verdict, key numbers, three "what would have to change" cards and chart reflect §6 for the default scenario and the edge cases in §6.6.
- All functions in §8.1 have the tests in §8.2 passing in CI.
- Disclaimer visible in header, result panel and footer.
- Expert toggles visible per section, disabled, labelled "coming soon".
- Lighthouse mobile scores ≥ 95 (Performance, Accessibility, Best Practices).
