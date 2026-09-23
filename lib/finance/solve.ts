/**
 * Solvers: change exactly one input so the balance lands at 0 € at payout end.
 * See Specs.md §6.4.
 */
import {
  etfClosedForm,
  futureValueFactor,
  monthlyRateFromAnnual,
  monthsOfAccumulation,
  totalAtRetirement,
} from "./accumulate";
import { balanceAfterMonths, monthsOfPayout, splitMonths } from "./drawdown";
import type {
  PlanInputs,
  SolvedMonthlyGap,
  SolvedMonthlySavings,
  SolvedRetirementAge,
} from "./types";

/** a) Monthly gap that spends the total down to exactly 0 € over `months`. */
export function solveMonthlyGap(total: number, months: number): number {
  return total / months;
}

export function solveMonthlyGapFor(inputs: PlanInputs, total: number): SolvedMonthlyGap {
  const months = monthsOfPayout(inputs.retirementAge, inputs.payoutEndAge);
  const target = solveMonthlyGap(total, months);
  return { target, delta: target - inputs.monthlyGap };
}

/** b) Monthly savings that make the total at retirement equal the total needed. */
export function solveMonthlySavings(
  inputs: PlanInputs,
  sliderMax = Infinity,
): SolvedMonthlySavings {
  const i = monthlyRateFromAnnual(inputs.annualRate);
  const n = monthsOfAccumulation(inputs.currentAge, inputs.retirementAge);
  const m = monthsOfPayout(inputs.retirementAge, inputs.payoutEndAge);
  const needed = inputs.monthlyGap * m;
  const growth = Math.pow(1 + i, n);
  const factor = futureValueFactor(i, n);
  const exact = (needed - inputs.cash - inputs.etf * growth) / factor;
  const clampedToZero = exact < 0;
  const target = clampedToZero ? 0 : exact;
  return {
    target,
    exact,
    delta: target - inputs.monthlySavings,
    clampedToZero,
    aboveSliderMax: target > sliderMax,
  };
}

/**
 * Balance at payout end if retirement happens `k` months from now
 * (accumulate for k months, then withdraw for the remaining months until payout end).
 */
export function endBalanceForAccumulationMonths(inputs: PlanInputs, k: number): number {
  const i = monthlyRateFromAnnual(inputs.annualRate);
  const total = totalAtRetirement(
    inputs.cash,
    etfClosedForm(inputs.etf, inputs.monthlySavings, i, k),
  );
  const totalMonths = 12 * (inputs.payoutEndAge - inputs.currentAge);
  return balanceAfterMonths(total, inputs.monthlyGap, totalMonths - k);
}

/**
 * c) Smallest number of accumulation months `k` in [1, 12·(P−A) − 1] whose end balance
 * is ≥ 0. `endBalanceForAccumulationMonths` is strictly increasing in `k`, so a binary
 * search finds it.
 */
export function solveRetirementAge(inputs: PlanInputs): SolvedRetirementAge {
  const totalMonths = 12 * (inputs.payoutEndAge - inputs.currentAge);
  let lo = 1;
  let hi = totalMonths - 1;
  if (hi < lo) return { unreachable: true };
  if (endBalanceForAccumulationMonths(inputs, hi) < 0) return { unreachable: true };

  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (endBalanceForAccumulationMonths(inputs, mid) >= 0) {
      hi = mid;
    } else {
      lo = mid + 1;
    }
  }

  const months = lo;
  const split = splitMonths(months);
  const plannedMonths = monthsOfAccumulation(inputs.currentAge, inputs.retirementAge);
  return {
    unreachable: false,
    months,
    age: { years: inputs.currentAge + split.years, months: split.months },
    ageInYears: inputs.currentAge + months / 12,
    deltaMonths: months - plannedMonths,
    endBalance: endBalanceForAccumulationMonths(inputs, months),
  };
}
