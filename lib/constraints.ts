/**
 * Age ordering rules: currentAge < retirementAge < payoutEndAge, each at least
 * MIN_AGE_GAP years apart. The slider being moved always wins; neighbours are pushed.
 * See Specs.md §5.3.
 */
import { SLIDERS, type SliderField } from "./defaults";
import type { PlanInputs } from "./finance/types";

export const MIN_AGE_GAP = 1;

export type AgeField = "currentAge" | "retirementAge" | "payoutEndAge";

export function isAgeField(field: SliderField): field is AgeField {
  return field === "currentAge" || field === "retirementAge" || field === "payoutEndAge";
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * The range a thumb can actually reach given the chain of gaps
 * (e.g. currentAge can never exceed max − 2·gap).
 */
export function effectiveAgeRange(field: AgeField): { min: number; max: number } {
  const { min, max } = SLIDERS[field];
  switch (field) {
    case "currentAge":
      return { min, max: max - 2 * MIN_AGE_GAP };
    case "retirementAge":
      return { min: min + MIN_AGE_GAP, max: max - MIN_AGE_GAP };
    case "payoutEndAge":
      return { min: min + 2 * MIN_AGE_GAP, max };
  }
}

/**
 * Returns a copy of `inputs` where the age ordering holds. `changed` names the slider
 * the user moved; the other two are pushed as little as necessary.
 */
export function applyAgeConstraints(inputs: PlanInputs, changed: AgeField): PlanInputs {
  let { currentAge: a, retirementAge: r, payoutEndAge: p } = inputs;

  switch (changed) {
    case "currentAge": {
      const range = effectiveAgeRange("currentAge");
      a = clamp(a, range.min, range.max);
      if (r < a + MIN_AGE_GAP) r = a + MIN_AGE_GAP;
      if (p < r + MIN_AGE_GAP) p = r + MIN_AGE_GAP;
      break;
    }
    case "retirementAge": {
      const range = effectiveAgeRange("retirementAge");
      r = clamp(r, range.min, range.max);
      if (a > r - MIN_AGE_GAP) a = r - MIN_AGE_GAP;
      if (p < r + MIN_AGE_GAP) p = r + MIN_AGE_GAP;
      break;
    }
    case "payoutEndAge": {
      const range = effectiveAgeRange("payoutEndAge");
      p = clamp(p, range.min, range.max);
      if (r > p - MIN_AGE_GAP) r = p - MIN_AGE_GAP;
      if (a > r - MIN_AGE_GAP) a = r - MIN_AGE_GAP;
      break;
    }
  }

  return { ...inputs, currentAge: a, retirementAge: r, payoutEndAge: p };
}

/** Which age sliders moved as a side effect of a change (for the UI flash). */
export function pushedFields(
  before: PlanInputs,
  after: PlanInputs,
  changed: AgeField,
): AgeField[] {
  const fields: AgeField[] = ["currentAge", "retirementAge", "payoutEndAge"];
  return fields.filter((f) => f !== changed && before[f] !== after[f]);
}
