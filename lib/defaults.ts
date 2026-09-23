import type { PlanInputs } from "./finance/types";

export type SliderField = keyof PlanInputs;

export interface SliderConfig {
  min: number;
  max: number;
  step: number;
  default: number;
}

/** Default expected real (after-inflation) return; slider 8. */
export const DEFAULT_ANNUAL_RATE = 0.04;

export const SLIDERS: Record<SliderField, SliderConfig> = {
  monthlyGap: { min: 0, max: 5_000, step: 50, default: 2_000 },
  currentAge: { min: 0, max: 100, step: 1, default: 35 },
  retirementAge: { min: 0, max: 100, step: 1, default: 67 },
  payoutEndAge: { min: 0, max: 100, step: 1, default: 84 },
  cash: { min: 0, max: 500_000, step: 1_000, default: 10_000 },
  etf: { min: 0, max: 500_000, step: 1_000, default: 10_000 },
  monthlySavings: { min: 0, max: 5_000, step: 50, default: 500 },
  // Stored as a fraction (0.04 = 4 %); the slider moves in 0.1 % steps.
  annualRate: { min: 0, max: 0.1, step: 0.001, default: DEFAULT_ANNUAL_RATE },
};

export const DEFAULT_INPUTS: PlanInputs = {
  monthlyGap: SLIDERS.monthlyGap.default,
  currentAge: SLIDERS.currentAge.default,
  retirementAge: SLIDERS.retirementAge.default,
  payoutEndAge: SLIDERS.payoutEndAge.default,
  cash: SLIDERS.cash.default,
  etf: SLIDERS.etf.default,
  monthlySavings: SLIDERS.monthlySavings.default,
  annualRate: SLIDERS.annualRate.default,
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
  // Guard against float noise: 379.12 / 50 = 7.5824 → ceil → 8 → 400 (intended), but
  // (400 + 1e-13) / 50 → ceil → 9 (unintended), so snap to 1e-9 before flooring/ceiling.
  const clean = mode === "nearest" ? rounded : Math[mode](Math.round(steps * 1e9) / 1e9);
  // Multiply back without float noise (0.037 rather than 0.037000000000000005).
  const decimals = stepDecimals(step);
  const snapped = Number((clean * step).toFixed(decimals));
  return Math.min(max, Math.max(min, snapped));
}

function stepDecimals(step: number): number {
  const text = step.toString();
  const dot = text.indexOf(".");
  return dot === -1 ? 0 : text.length - dot - 1;
}

/** True when the value lies outside the slider's range. */
export function isOutsideSlider(field: SliderField, value: number): boolean {
  const { min, max } = SLIDERS[field];
  return value < min || value > max;
}
