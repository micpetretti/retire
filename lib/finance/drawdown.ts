/**
 * Drawdown phase: no growth, a fixed monthly withdrawal. See Specs.md §6.2.
 */
import type { YearsMonths } from "./types";

export function monthsOfPayout(retirementAge: number, payoutEndAge: number): number {
  return 12 * (payoutEndAge - retirementAge);
}

/** total − monthlyGap · months */
export function balanceAfterMonths(
  total: number,
  monthlyGap: number,
  months: number,
): number {
  return total - monthlyGap * months;
}

/** Full months the money lasts; Infinity when nothing is withdrawn. */
export function monthsUntilDepleted(total: number, monthlyGap: number): number {
  if (monthlyGap <= 0) return Infinity;
  return Math.floor(total / monthlyGap);
}

/** Splits a month count into years + months. */
export function splitMonths(months: number): YearsMonths {
  return { years: Math.floor(months / 12), months: months % 12 };
}

/** Age reached `months` months after `startAge` (whole years). */
export function ageAfterMonths(startAge: number, months: number): YearsMonths {
  const split = splitMonths(months);
  return { years: startAge + split.years, months: split.months };
}

/** Balance after each month of retirement; index 0 = retirement day. */
export function drawdownSeries(
  total: number,
  monthlyGap: number,
  months: number,
): number[] {
  const series: number[] = [];
  for (let t = 0; t <= months; t++) {
    series.push(balanceAfterMonths(total, monthlyGap, t));
  }
  return series;
}
