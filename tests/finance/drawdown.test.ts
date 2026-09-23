import { describe, expect, it } from "vitest";
import {
  ageAfterMonths,
  balanceAfterMonths,
  drawdownSeries,
  monthsOfPayout,
  monthsUntilDepleted,
  splitMonths,
} from "@/lib/finance/drawdown";

describe("monthsOfPayout", () => {
  it("67 → 84 gives 204 months", () => {
    expect(monthsOfPayout(67, 84)).toBe(204);
  });
});

describe("balanceAfterMonths", () => {
  it("408.000 € with 2.000 €/month lasts exactly 204 months", () => {
    expect(balanceAfterMonths(408_000, 2_000, 204)).toBe(0);
  });

  it("goes negative once withdrawals exceed the total", () => {
    expect(balanceAfterMonths(10_000, 2_000, 6)).toBe(-2_000);
  });
});

describe("monthsUntilDepleted", () => {
  it("100.000 € with 3.000 €/month is depleted after 33 full months", () => {
    expect(monthsUntilDepleted(100_000, 3_000)).toBe(33);
  });

  it("never depleted when the monthly gap is 0", () => {
    expect(monthsUntilDepleted(100_000, 0)).toBe(Infinity);
  });
});

describe("splitMonths / ageAfterMonths", () => {
  it("splits 25 months into 2 years 1 month", () => {
    expect(splitMonths(25)).toEqual({ years: 2, months: 1 });
  });

  it("33 months after age 67 is 69 years 9 months", () => {
    expect(ageAfterMonths(67, 33)).toEqual({ years: 69, months: 9 });
  });
});

describe("drawdownSeries", () => {
  it("has months + 1 entries from total down to the end balance", () => {
    const series = drawdownSeries(6_000, 1_000, 3);
    expect(series).toEqual([6_000, 5_000, 4_000, 3_000]);
  });
});
