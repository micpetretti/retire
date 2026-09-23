/**
 * Accumulation phase: monthly growth of the ETF balance plus monthly contributions.
 * Pure functions, time in months. See Specs.md §6.1.
 */

/** Equivalent monthly rate so that (1 + i)^12 = 1 + annualRate exactly. */
export function monthlyRateFromAnnual(annualRate: number): number {
  if (annualRate === 0) return 0;
  return Math.pow(1 + annualRate, 1 / 12) - 1;
}

/** balance · (1 + monthlyRate) */
export function growOneMonth(balance: number, monthlyRate: number): number {
  return balance * (1 + monthlyRate);
}

/** balance + one month of savings */
export function addMonthlyContribution(balance: number, monthlySavings: number): number {
  return balance + monthlySavings;
}

/** One month: grow first, then contribute at month end. */
export function accumulateMonth(
  balance: number,
  monthlyRate: number,
  monthlySavings: number,
): number {
  return addMonthlyContribution(growOneMonth(balance, monthlyRate), monthlySavings);
}

/**
 * Runs the accumulation loop for `months` months.
 * `series[k]` is the balance after `k` months (`series[0]` = starting balance).
 */
export function accumulateEtf(
  etf: number,
  monthlySavings: number,
  monthlyRate: number,
  months: number,
): { final: number; series: number[] } {
  const series: number[] = [etf];
  let balance = etf;
  for (let k = 0; k < months; k++) {
    balance = accumulateMonth(balance, monthlyRate, monthlySavings);
    series.push(balance);
  }
  return { final: balance, series };
}

/** Future value of 1 € contributed at the end of each month for `months` months. */
export function futureValueFactor(monthlyRate: number, months: number): number {
  if (monthlyRate === 0) return months;
  return (Math.pow(1 + monthlyRate, months) - 1) / monthlyRate;
}

/** Closed form of `accumulateEtf(...).final`. */
export function etfClosedForm(
  etf: number,
  monthlySavings: number,
  monthlyRate: number,
  months: number,
): number {
  const growth = Math.pow(1 + monthlyRate, months);
  return etf * growth + monthlySavings * futureValueFactor(monthlyRate, months);
}

export function totalAtRetirement(cash: number, etfAtRetirement: number): number {
  return cash + etfAtRetirement;
}

export function monthsOfAccumulation(currentAge: number, retirementAge: number): number {
  return 12 * (retirementAge - currentAge);
}

/** Picks every 12th entry of a monthly series (index 0, 12, 24, …). */
export function yearlyPoints(monthlySeries: number[]): number[] {
  const points: number[] = [];
  for (let k = 0; k < monthlySeries.length; k += 12) {
    points.push(monthlySeries[k]);
  }
  return points;
}
