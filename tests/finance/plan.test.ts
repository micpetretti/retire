import { describe, expect, it } from "vitest";
import { DEFAULT_INPUTS } from "@/lib/defaults";
import { computePlan } from "@/lib/finance/plan";
import type { PlanInputs } from "@/lib/finance/types";

// Reference scenario with a 5 % real return — the hand-verified numbers in Specs.md §6.5.
const FIVE_PERCENT: PlanInputs = { ...DEFAULT_INPUTS, annualRate: 0.05 };

describe("computePlan (composition)", () => {
  it("slider defaults (4 %): T ≈ 428.138 €, endBalance ≈ +20.138 €, verdict lasts", () => {
    const plan = computePlan(DEFAULT_INPUTS);
    expect(plan.inputs.annualRate).toBe(0.04);
    expect(plan.accumulation.total).toBeCloseTo(428_137.72, 1);
    expect(plan.drawdown.endBalance).toBeCloseTo(20_137.72, 1);
    expect(plan.lasts).toBe(true);
  });

  it("a higher return grows the total, a 0 % return reduces it to plain saving", () => {
    const high = computePlan({ ...DEFAULT_INPUTS, annualRate: 0.1 });
    const flat = computePlan({ ...DEFAULT_INPUTS, annualRate: 0 });
    expect(high.accumulation.total).toBeGreaterThan(
      computePlan(DEFAULT_INPUTS).accumulation.total,
    );
    // 10.000 cash + 10.000 ETF + 384 × 500 € contributions, no growth.
    expect(flat.accumulation.total).toBeCloseTo(10_000 + 10_000 + 384 * 500, 6);
  });

  it("5 % scenario: T ≈ 519.705 €, endBalance ≈ +111.705 €, verdict lasts", () => {
    const plan = computePlan(FIVE_PERCENT);
    expect(plan.accumulation.months).toBe(384);
    expect(plan.accumulation.etfAtRetirement).toBeCloseTo(509_704.78, 1);
    expect(plan.accumulation.total).toBeCloseTo(519_704.78, 1);
    expect(plan.drawdown.months).toBe(204);
    expect(plan.drawdown.totalNeeded).toBe(408_000);
    expect(plan.drawdown.endBalance).toBeCloseTo(111_704.78, 1);
    expect(plan.lasts).toBe(true);
    expect(plan.drawdown.depletionAge).toBeUndefined();
    expect(plan.drawdown.shortBy).toBeUndefined();
  });

  it("zero savings, zero ETFs, 10.000 € cash, 2.000 €/month: runs out after 5 months at 67 years 5 months", () => {
    const inputs: PlanInputs = { ...DEFAULT_INPUTS, etf: 0, monthlySavings: 0 };
    const plan = computePlan(inputs);
    expect(plan.lasts).toBe(false);
    expect(plan.accumulation.total).toBe(10_000);
    expect(plan.drawdown.monthsUntilDepleted).toBe(5);
    expect(plan.drawdown.depletionAge).toEqual({ years: 67, months: 5 });
    expect(plan.drawdown.shortBy).toEqual({ years: 16, months: 7 });
    expect(plan.drawdown.endBalance).toBe(10_000 - 408_000);
  });

  it("minimum gaps (A=30, R=31, P=32): 12 months of growth, 12 months of payout", () => {
    const inputs: PlanInputs = {
      ...DEFAULT_INPUTS,
      currentAge: 30,
      retirementAge: 31,
      payoutEndAge: 32,
    };
    const plan = computePlan(inputs);
    expect(plan.accumulation.months).toBe(12);
    expect(plan.drawdown.months).toBe(12);
    expect(plan.accumulation.etfSeries).toHaveLength(13);
    expect(plan.drawdown.balanceSeries).toHaveLength(13);
  });

  it("chart series has one point per year from A to P inclusive", () => {
    const plan = computePlan(DEFAULT_INPUTS);
    expect(plan.chart).toHaveLength(84 - 35 + 1);
    expect(plan.chart[0]).toEqual({ age: 35, balance: 20_000 });
    expect(plan.chart[32].age).toBe(67);
    expect(plan.chart[32].balance).toBeCloseTo(plan.accumulation.total, 6);
    expect(plan.chart.at(-1)?.age).toBe(84);
    expect(plan.chart.at(-1)?.balance).toBeCloseTo(plan.drawdown.endBalance, 6);
  });

  it("chart ages are strictly increasing by one year", () => {
    const plan = computePlan(DEFAULT_INPUTS);
    for (let k = 1; k < plan.chart.length; k++) {
      expect(plan.chart[k].age - plan.chart[k - 1].age).toBe(1);
    }
  });

  it("a monthly gap of 0 never depletes and solves to retiring next month", () => {
    const plan = computePlan({ ...DEFAULT_INPUTS, monthlyGap: 0 });
    expect(plan.lasts).toBe(true);
    expect(plan.drawdown.monthsUntilDepleted).toBe(Infinity);
    expect(plan.drawdown.endBalance).toBeCloseTo(plan.accumulation.total, 6);
    expect(plan.solved.monthlySavings.clampedToZero).toBe(true);
    expect(plan.solved.retirementAge).toMatchObject({ unreachable: false, months: 1 });
  });

  it("nothing saved at all runs out immediately at retirement", () => {
    const plan = computePlan({ ...DEFAULT_INPUTS, cash: 0, etf: 0, monthlySavings: 0 });
    expect(plan.accumulation.total).toBe(0);
    expect(plan.drawdown.monthsUntilDepleted).toBe(0);
    expect(plan.drawdown.depletionAge).toEqual({ years: 67, months: 0 });
  });
});
