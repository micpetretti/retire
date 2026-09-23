/**
 * Composition: PlanInputs → PlanResult. See Specs.md §6 and §8.
 */
import {
  accumulateEtf,
  monthlyRateFromAnnual,
  monthsOfAccumulation,
  totalAtRetirement,
  yearlyPoints,
} from "./accumulate";
import {
  ageAfterMonths,
  balanceAfterMonths,
  drawdownSeries,
  monthsOfPayout,
  monthsUntilDepleted,
  splitMonths,
} from "./drawdown";
import { solveMonthlyGapFor, solveMonthlySavings, solveRetirementAge } from "./solve";
import type { Accumulation, ChartPoint, Drawdown, PlanInputs, PlanResult } from "./types";

export function computeAccumulation(inputs: PlanInputs): Accumulation {
  const months = monthsOfAccumulation(inputs.currentAge, inputs.retirementAge);
  const rate = monthlyRateFromAnnual(inputs.annualRate);
  const { final, series } = accumulateEtf(
    inputs.etf,
    inputs.monthlySavings,
    rate,
    months,
  );
  return {
    months,
    etfAtRetirement: final,
    total: totalAtRetirement(inputs.cash, final),
    etfSeries: series,
  };
}

export function computeDrawdown(inputs: PlanInputs, total: number): Drawdown {
  const months = monthsOfPayout(inputs.retirementAge, inputs.payoutEndAge);
  const endBalance = balanceAfterMonths(total, inputs.monthlyGap, months);
  const depleted = monthsUntilDepleted(total, inputs.monthlyGap);
  const runsOut = endBalance < 0;
  return {
    months,
    totalNeeded: inputs.monthlyGap * months,
    endBalance,
    monthsUntilDepleted: depleted,
    depletionAge: runsOut ? ageAfterMonths(inputs.retirementAge, depleted) : undefined,
    shortBy: runsOut ? splitMonths(months - depleted) : undefined,
    balanceSeries: drawdownSeries(total, inputs.monthlyGap, months),
  };
}

/** One chart point per year from currentAge to payoutEndAge inclusive. */
export function buildChart(
  inputs: PlanInputs,
  accumulation: Accumulation,
  drawdown: Drawdown,
): ChartPoint[] {
  const points: ChartPoint[] = [];
  const etfYearly = yearlyPoints(accumulation.etfSeries);
  etfYearly.forEach((etf, year) => {
    points.push({ age: inputs.currentAge + year, balance: inputs.cash + etf });
  });
  // Drawdown yearly points; skip index 0 because it duplicates the retirement point.
  const drawdownYearly = yearlyPoints(drawdown.balanceSeries);
  drawdownYearly.slice(1).forEach((balance, idx) => {
    points.push({ age: inputs.retirementAge + idx + 1, balance });
  });
  return points;
}

export function computePlan(inputs: PlanInputs, savingsSliderMax?: number): PlanResult {
  const accumulation = computeAccumulation(inputs);
  const drawdown = computeDrawdown(inputs, accumulation.total);
  return {
    inputs,
    accumulation,
    drawdown,
    lasts: drawdown.endBalance >= 0,
    solved: {
      monthlyGap: solveMonthlyGapFor(inputs, accumulation.total),
      monthlySavings: solveMonthlySavings(inputs, savingsSliderMax),
      retirementAge: solveRetirementAge(inputs),
    },
    chart: buildChart(inputs, accumulation, drawdown),
  };
}
