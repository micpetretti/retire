import { describe, expect, it } from "vitest";
import { applyAgeConstraints, effectiveAgeRange, pushedFields } from "@/lib/constraints";
import { DEFAULT_INPUTS } from "@/lib/defaults";
import type { PlanInputs } from "@/lib/finance/types";

const base: PlanInputs = {
  ...DEFAULT_INPUTS,
  currentAge: 35,
  retirementAge: 67,
  payoutEndAge: 84,
};

describe("applyAgeConstraints", () => {
  it("raising current age to equal retirement age pushes retirement age to current age + 1", () => {
    const result = applyAgeConstraints({ ...base, currentAge: 67 }, "currentAge");
    expect(result.currentAge).toBe(67);
    expect(result.retirementAge).toBe(68);
    expect(result.payoutEndAge).toBe(84);
  });

  it("raising current age past payout end pushes both other sliders in a chain", () => {
    const result = applyAgeConstraints({ ...base, currentAge: 90 }, "currentAge");
    expect(result).toMatchObject({ currentAge: 90, retirementAge: 91, payoutEndAge: 92 });
  });

  it("current age cannot exceed 98 so that 99 and 100 remain valid", () => {
    const result = applyAgeConstraints({ ...base, currentAge: 100 }, "currentAge");
    expect(result).toMatchObject({
      currentAge: 98,
      retirementAge: 99,
      payoutEndAge: 100,
    });
  });

  it("raising retirement age to equal payout end age pushes payout end to retirement age + 1", () => {
    const result = applyAgeConstraints({ ...base, retirementAge: 84 }, "retirementAge");
    expect(result).toMatchObject({ currentAge: 35, retirementAge: 84, payoutEndAge: 85 });
  });

  it("retirement age cannot exceed 99", () => {
    const result = applyAgeConstraints({ ...base, retirementAge: 100 }, "retirementAge");
    expect(result).toMatchObject({ retirementAge: 99, payoutEndAge: 100 });
  });

  it("lowering payout end age below retirement age pulls retirement age down to payout end − 1", () => {
    const result = applyAgeConstraints({ ...base, payoutEndAge: 60 }, "payoutEndAge");
    expect(result).toMatchObject({ currentAge: 35, retirementAge: 59, payoutEndAge: 60 });
  });

  it("lowering payout end age far enough pulls current age down as well", () => {
    const result = applyAgeConstraints({ ...base, payoutEndAge: 20 }, "payoutEndAge");
    expect(result).toMatchObject({ currentAge: 18, retirementAge: 19, payoutEndAge: 20 });
  });

  it("payout end age cannot go below 2", () => {
    const result = applyAgeConstraints({ ...base, payoutEndAge: 0 }, "payoutEndAge");
    expect(result).toMatchObject({ currentAge: 0, retirementAge: 1, payoutEndAge: 2 });
  });

  it("lowering retirement age below current age pulls current age down to retirement age − 1", () => {
    const result = applyAgeConstraints({ ...base, retirementAge: 30 }, "retirementAge");
    expect(result).toMatchObject({ currentAge: 29, retirementAge: 30, payoutEndAge: 84 });
  });

  it("lowering current age never moves the other sliders", () => {
    const result = applyAgeConstraints({ ...base, currentAge: 20 }, "currentAge");
    expect(result).toMatchObject({ currentAge: 20, retirementAge: 67, payoutEndAge: 84 });
  });

  it("raising payout end age never moves the other sliders", () => {
    const result = applyAgeConstraints({ ...base, payoutEndAge: 100 }, "payoutEndAge");
    expect(result).toMatchObject({
      currentAge: 35,
      retirementAge: 67,
      payoutEndAge: 100,
    });
  });

  it("leaves already valid inputs untouched", () => {
    expect(applyAgeConstraints(base, "retirementAge")).toEqual(base);
  });

  it("does not touch non-age fields", () => {
    const result = applyAgeConstraints({ ...base, currentAge: 90 }, "currentAge");
    expect(result.monthlyGap).toBe(base.monthlyGap);
    expect(result.cash).toBe(base.cash);
  });
});

describe("effectiveAgeRange", () => {
  it("is 0–98 for current age, 1–99 for retirement age, 2–100 for payout end", () => {
    expect(effectiveAgeRange("currentAge")).toEqual({ min: 0, max: 98 });
    expect(effectiveAgeRange("retirementAge")).toEqual({ min: 1, max: 99 });
    expect(effectiveAgeRange("payoutEndAge")).toEqual({ min: 2, max: 100 });
  });
});

describe("pushedFields", () => {
  it("lists only the sliders that moved as a side effect", () => {
    const after = applyAgeConstraints({ ...base, currentAge: 90 }, "currentAge");
    expect(pushedFields(base, after, "currentAge")).toEqual([
      "retirementAge",
      "payoutEndAge",
    ]);
  });

  it("is empty when nothing else moved", () => {
    const after = applyAgeConstraints({ ...base, currentAge: 20 }, "currentAge");
    expect(pushedFields(base, after, "currentAge")).toEqual([]);
  });
});
