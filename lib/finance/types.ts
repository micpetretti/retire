/**
 * Inputs to the retirement illustration. All money values are in today's euros,
 * all ages in whole years. See Specs.md §6 for the model.
 */
export interface PlanInputs {
  /** Slider 1 — monthly gap savings must cover in retirement (€/month). */
  monthlyGap: number;
  /** Slider 2 — current age (years). */
  currentAge: number;
  /** Slider 3 — retirement age (years), > currentAge. */
  retirementAge: number;
  /** Slider 4 — age until which savings must last (years), > retirementAge. */
  payoutEndAge: number;
  /** Slider 5 — cash that does not grow (€). */
  cash: number;
  /** Slider 6 — current ETF balance (€). */
  etf: number;
  /** Slider 7 — monthly ETF contributions until retirement (€/month). */
  monthlySavings: number;
  /** Annual real growth rate of ETFs before retirement. Simple mode: 0.05. */
  annualRate: number;
}

export interface YearsMonths {
  years: number;
  months: number;
}

export interface Accumulation {
  /** Months from now until retirement. */
  months: number;
  /** ETF balance at retirement. */
  etfAtRetirement: number;
  /** Cash + ETF at retirement. */
  total: number;
  /** ETF balance after each month, index 0 = today. Length = months + 1. */
  etfSeries: number[];
}

export interface Drawdown {
  /** Months from retirement until payout end. */
  months: number;
  /** Total withdrawn over the payout period (monthlyGap · months). */
  totalNeeded: number;
  /** Balance at payout end; negative = shortfall. */
  endBalance: number;
  /** Full months the money lasts; Infinity if the gap is 0. */
  monthsUntilDepleted: number;
  /** Age at which the money runs out; undefined when it lasts. */
  depletionAge?: YearsMonths;
  /** How much earlier than payout end the money runs out; undefined when it lasts. */
  shortBy?: YearsMonths;
  /** Balance after each month of retirement, index 0 = retirement. Length = months + 1. */
  balanceSeries: number[];
}

export interface SolvedMonthlyGap {
  target: number;
  delta: number;
}

export interface SolvedMonthlySavings {
  /** Savings per month that land at exactly 0 €, clamped to ≥ 0. */
  target: number;
  /** Unclamped solution (may be negative). */
  exact: number;
  delta: number;
  clampedToZero: boolean;
  /** True when the target exceeds the slider maximum (informational). */
  aboveSliderMax: boolean;
}

export type SolvedRetirementAge =
  | {
      unreachable: false;
      /** Months of accumulation from now. */
      months: number;
      /** Retirement age as years + months. */
      age: YearsMonths;
      /** Fractional retirement age in years, e.g. 64.9167. */
      ageInYears: number;
      /** Difference to the planned retirement age in months (negative = earlier). */
      deltaMonths: number;
      /** Balance at payout end when retiring at `months`. */
      endBalance: number;
    }
  | { unreachable: true };

export interface ChartPoint {
  age: number;
  balance: number;
}

export interface PlanResult {
  inputs: PlanInputs;
  accumulation: Accumulation;
  drawdown: Drawdown;
  lasts: boolean;
  solved: {
    monthlyGap: SolvedMonthlyGap;
    monthlySavings: SolvedMonthlySavings;
    retirementAge: SolvedRetirementAge;
  };
  /** One point per year from currentAge to payoutEndAge inclusive. */
  chart: ChartPoint[];
}
