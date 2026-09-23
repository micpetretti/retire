import type { PlanInputs } from "./finance/types";

export type SliderField = Exclude<keyof PlanInputs, "annualRate">;

export interface SliderConfig {
  min: number;
  max: number;
  step: number;
  default: number;
}

export const SIMPLE_ANNUAL_RATE = 0.05;

export const SLIDERS: Record<SliderField, SliderConfig> = {
  monthlyGap: { min: 0, max: 5_000, step: 50, default: 2_000 },
  currentAge: { min: 0, max: 100, step: 1, default: 35 },
  retirementAge: { min: 0, max: 100, step: 1, default: 67 },
  payoutEndAge: { min: 0, max: 100, step: 1, default: 84 },
  cash: { min: 0, max: 500_000, step: 1_000, default: 10_000 },
  etf: { min: 0, max: 500_000, step: 1_000, default: 10_000 },
  monthlySavings: { min: 0, max: 5_000, step: 50, default: 500 },
};

export const DEFAULT_INPUTS: PlanInputs = {
  monthlyGap: SLIDERS.monthlyGap.default,
  currentAge: SLIDERS.currentAge.default,
  retirementAge: SLIDERS.retirementAge.default,
  payoutEndAge: SLIDERS.payoutEndAge.default,
  cash: SLIDERS.cash.default,
  etf: SLIDERS.etf.default,
  monthlySavings: SLIDERS.monthlySavings.default,
  annualRate: SIMPLE_ANNUAL_RATE,
};

export type SnapMode = "nearest" | "floor" | "ceil";

/** Rounds to the slider step (nearest / down / up) and clamps to the slider range. */
export function snapToSlider(
  field: SliderField,
  value: number,
  mode: SnapMode = "nearest",
): number {
  const { min, max, step } = SLIDERS[field];
  const steps = value / step;
  const rounded =
    mode === "floor"
      ? Math.floor(steps)
      : mode === "ceil"
        ? Math.ceil(steps)
        : Math.round(steps);
  // Guard against float noise such as 379.12 / 50 = 7.5824 → ceil → 8 → 400 (intended),
  // but 400.0000001 / 50 → ceil → 9 (unintended): snap to 1e-9 first.
  const clean = mode === "nearest" ? rounded : Math[mode](Math.round(steps * 1e9) / 1e9);
  return Math.min(max, Math.max(min, clean * step));
}

/** True when the value lies outside the slider's range. */
export function isOutsideSlider(field: SliderField, value: number): boolean {
  const { min, max } = SLIDERS[field];
  return value < min || value > max;
}
