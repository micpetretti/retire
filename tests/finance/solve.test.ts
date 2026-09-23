import { describe, expect, it } from "vitest";
import { DEFAULT_INPUTS } from "@/lib/defaults";
import { computePlan } from "@/lib/finance/plan";
import {
  endBalanceForAccumulationMonths,
  solveMonthlyGap,
  solveMonthlySavings,
  solveRetirementAge,
} from "@/lib/finance/solve";
import type { PlanInputs } from "@/lib/finance/types";

const defaults = DEFAULT_INPUTS;
const defaultPlan = computePlan(defaults);

describe("solveMonthlyGap", () => {
  it("519.705 € over 204 months allows ≈ 2.547,57 €/month", () => {
    expect(solveMonthlyGap(519_704.78, 204)).toBeCloseTo(2_547.57, 2);
  });

  it("feeding the solved gap back into computePlan yields an end balance of 0", () => {
    const solved = defaultPlan.solved.monthlyGap.target;
    const replan = computePlan({ ...defaults, monthlyGap: solved });
    expect(replan.drawdown.endBalance).toBeCloseTo(0, 2);
  });

  it("reports the delta relative to the current gap", () => {
    expect(defaultPlan.solved.monthlyGap.delta).toBeCloseTo(547.57, 2);
  });
});

describe("solveMonthlySavings", () => {
  it("default scenario solves to ≈ 379,12 €/month", () => {
    expect(solveMonthlySavings(defaults).target).toBeCloseTo(379.12, 2);
  });

  it("clamps to 0 and flags it when the plan already has a surplus without any savings", () => {
    const rich: PlanInputs = { ...defaults, cash: 500_000, etf: 500_000 };
    const solved = solveMonthlySavings(rich);
    expect(solved.clampedToZero).toBe(true);
    expect(solved.target).toBe(0);
    expect(solved.exact).toBeLessThan(0);
  });

  it("returns a value above 5.000 and flags it when the gap is very large", () => {
    const short: PlanInputs = {
      ...defaults,
      monthlyGap: 5_000,
      cash: 0,
      etf: 0,
      currentAge: 60,
      retirementAge: 62,
      payoutEndAge: 90,
    };
    const solved = solveMonthlySavings(short, 5_000);
    expect(solved.target).toBeGreaterThan(5_000);
    expect(solved.aboveSliderMax).toBe(true);
  });

  it("feeding the solved savings back into computePlan yields an end balance of 0", () => {
    const solved = solveMonthlySavings(defaults).target;
    const replan = computePlan({ ...defaults, monthlySavings: solved });
    expect(replan.drawdown.endBalance).toBeCloseTo(0, 2);
  });
});

describe("endBalanceForAccumulationMonths", () => {
  it("equals computePlan's end balance for the planned retirement age", () => {
    const k = 12 * (defaults.retirementAge - defaults.currentAge);
    expect(endBalanceForAccumulationMonths(defaults, k)).toBeCloseTo(
      defaultPlan.drawdown.endBalance,
      6,
    );
  });

  it("is strictly increasing in k for the default scenario", () => {
    const total = 12 * (defaults.payoutEndAge - defaults.currentAge);
    let previous = endBalanceForAccumulationMonths(defaults, 1);
    for (let k = 2; k < total; k++) {
      const current = endBalanceForAccumulationMonths(defaults, k);
      expect(current).toBeGreaterThan(previous);
      previous = current;
    }
  });
});

describe("solveRetirementAge", () => {
  it("default scenario solves to 359 months = 64 years 11 months", () => {
    const solved = solveRetirementAge(defaults);
    expect(solved.unreachable).toBe(false);
    if (solved.unreachable) return;
    expect(solved.months).toBe(359);
    expect(solved.age).toEqual({ years: 64, months: 11 });
    expect(solved.deltaMonths).toBe(-25);
    expect(solved.endBalance).toBeGreaterThanOrEqual(0);
    expect(solved.endBalance).toBeLessThan(1_000);
  });

  it("end balance at k* − 1 months is negative", () => {
    const solved = solveRetirementAge(defaults);
    if (solved.unreachable) throw new Error("expected reachable");
    expect(endBalanceForAccumulationMonths(defaults, solved.months - 1)).toBeLessThan(0);
  });

  it("returns 1 month when even retiring next month lasts", () => {
    const rich: PlanInputs = { ...defaults, cash: 500_000, monthlyGap: 100 };
    const solved = solveRetirementAge(rich);
    if (solved.unreachable) throw new Error("expected reachable");
    expect(solved.months).toBe(1);
    expect(solved.age).toEqual({ years: 35, months: 1 });
  });

  it("returns unreachable when retiring one month before payout end still runs out", () => {
    const hopeless: PlanInputs = {
      ...defaults,
      cash: 0,
      etf: 0,
      monthlySavings: 0,
      monthlyGap: 2_000,
    };
    expect(solveRetirementAge(hopeless)).toEqual({ unreachable: true });
  });

  it("feeding the solved age back yields a plan that lasts", () => {
    const solved = solveRetirementAge(defaults);
    if (solved.unreachable) throw new Error("expected reachable");
    // Whole-year slider: rounding up must still last.
    const replan = computePlan({
      ...defaults,
      retirementAge: Math.ceil(solved.ageInYears),
    });
    expect(replan.lasts).toBe(true);
  });
});
