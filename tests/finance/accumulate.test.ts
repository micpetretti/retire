import { describe, expect, it } from "vitest";
import {
  accumulateEtf,
  accumulateMonth,
  addMonthlyContribution,
  etfClosedForm,
  futureValueFactor,
  growOneMonth,
  monthlyRateFromAnnual,
  monthsOfAccumulation,
  totalAtRetirement,
  yearlyPoints,
} from "@/lib/finance/accumulate";

const I5 = monthlyRateFromAnnual(0.05);

describe("monthlyRateFromAnnual", () => {
  it("5 % per year becomes ≈ 0,40741 % per month", () => {
    expect(I5).toBeCloseTo(0.0040741, 6);
  });

  it("compounding the monthly rate twelve times gives back exactly 5 %", () => {
    expect(Math.pow(1 + I5, 12)).toBeCloseTo(1.05, 12);
  });

  it("0 % per year stays 0 %", () => {
    expect(monthlyRateFromAnnual(0)).toBe(0);
  });
});

describe("growOneMonth", () => {
  it("grows 10.000 € by the monthly rate for 5 % p.a. to ≈ 10.040,74 €", () => {
    expect(growOneMonth(10_000, I5)).toBeCloseTo(10_040.74, 2);
  });

  it("leaves the balance unchanged at 0 % growth", () => {
    expect(growOneMonth(12_345, 0)).toBe(12_345);
  });

  it("returns 0 for a 0 € balance", () => {
    expect(growOneMonth(0, I5)).toBe(0);
  });
});

describe("addMonthlyContribution", () => {
  it("adds 500 € to the balance", () => {
    expect(addMonthlyContribution(1_000, 500)).toBe(1_500);
  });

  it("adds nothing when monthly savings are 0 €", () => {
    expect(addMonthlyContribution(1_000, 0)).toBe(1_000);
  });
});

describe("accumulateMonth", () => {
  it("grows first, then contributes at month end", () => {
    expect(accumulateMonth(10_000, I5, 500)).toBeCloseTo(10_040.74 + 500, 2);
  });
});

describe("accumulateEtf", () => {
  it("returns the starting balance unchanged after 0 months", () => {
    const { final, series } = accumulateEtf(10_000, 500, I5, 0);
    expect(final).toBe(10_000);
    expect(series).toEqual([10_000]);
  });

  it("after 1 month equals growOneMonth + one contribution", () => {
    const { final } = accumulateEtf(10_000, 500, I5, 1);
    expect(final).toBeCloseTo(growOneMonth(10_000, I5) + 500, 10);
  });

  it("after 2 months applies growth to the first month's contribution", () => {
    const { final } = accumulateEtf(0, 500, I5, 2);
    expect(final).toBeCloseTo(500 * (1 + I5) + 500, 10);
  });

  it("after 12 months with no contributions equals the start balance × 1,05", () => {
    const { final } = accumulateEtf(10_000, 0, I5, 12);
    expect(final).toBeCloseTo(10_500, 2);
  });

  it("series has months + 1 entries starting with the initial balance", () => {
    const { series } = accumulateEtf(10_000, 500, I5, 24);
    expect(series).toHaveLength(25);
    expect(series[0]).toBe(10_000);
  });

  it.each([0, 1, 12, 120, 780])(
    "matches etfClosedForm for %i months within 1 cent",
    (months) => {
      const { final } = accumulateEtf(10_000, 500, I5, months);
      expect(final).toBeCloseTo(etfClosedForm(10_000, 500, I5, months), 2);
    },
  );
});

describe("futureValueFactor", () => {
  it("equals the number of months when the rate is 0", () => {
    expect(futureValueFactor(0, 36)).toBe(36);
  });

  it("equals 2 + i for two months", () => {
    expect(futureValueFactor(I5, 2)).toBeCloseTo(2 + I5, 12);
  });
});

describe("totalAtRetirement", () => {
  it("adds cash and ETF balance", () => {
    expect(totalAtRetirement(10_000, 509_705)).toBe(519_705);
  });
});

describe("monthsOfAccumulation", () => {
  it("35 → 67 gives 384 months", () => {
    expect(monthsOfAccumulation(35, 67)).toBe(384);
  });
});

describe("yearlyPoints", () => {
  it("picks entries 0, 12, 24 … from a monthly series", () => {
    const series = Array.from({ length: 25 }, (_, k) => k);
    expect(yearlyPoints(series)).toEqual([0, 12, 24]);
  });

  it("a 384-month series yields 33 yearly points", () => {
    const { series } = accumulateEtf(10_000, 500, I5, 384);
    expect(yearlyPoints(series)).toHaveLength(33);
  });
});
