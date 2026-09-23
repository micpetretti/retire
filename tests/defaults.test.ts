import { describe, expect, it } from "vitest";
import { DEFAULT_INPUTS, SLIDERS, isOutsideSlider, snapToSlider } from "@/lib/defaults";

describe("slider configuration", () => {
  it("real return defaults to 4 % with a 0–10 % range in 0,1 % steps", () => {
    expect(SLIDERS.annualRate).toEqual({ min: 0, max: 0.1, step: 0.001, default: 0.04 });
    expect(DEFAULT_INPUTS.annualRate).toBe(0.04);
  });
});

describe("snapToSlider", () => {
  it("rounds money to the nearest step", () => {
    expect(snapToSlider("monthlyGap", 2_547.57)).toBe(2_550);
  });

  it("rounds down or up on request", () => {
    expect(snapToSlider("monthlyGap", 2_547.57, "floor")).toBe(2_500);
    expect(snapToSlider("monthlySavings", 379.12, "ceil")).toBe(400);
  });

  it("does not round up a value already on a step because of float noise", () => {
    expect(snapToSlider("monthlySavings", 400 + 1e-11, "ceil")).toBe(400);
    expect(snapToSlider("monthlyGap", 2_500 - 1e-11, "floor")).toBe(2_500);
  });

  it("clamps to the slider range", () => {
    expect(snapToSlider("monthlyGap", 9_999)).toBe(5_000);
    expect(snapToSlider("cash", -5)).toBe(0);
  });

  it("returns clean decimals for the fractional rate step", () => {
    expect(snapToSlider("annualRate", 0.037000000000000005)).toBe(0.037);
    expect(snapToSlider("annualRate", 0.04 - 3 * 0.001)).toBe(0.037);
    expect(snapToSlider("annualRate", 0.15)).toBe(0.1);
  });
});

describe("isOutsideSlider", () => {
  it("flags values beyond the range only", () => {
    expect(isOutsideSlider("monthlyGap", 5_000)).toBe(false);
    expect(isOutsideSlider("monthlyGap", 5_001)).toBe(true);
    expect(isOutsideSlider("annualRate", -0.01)).toBe(true);
  });
});
