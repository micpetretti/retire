"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import {
  applyAgeConstraints,
  isAgeField,
  pushedFields,
  type AgeField,
} from "@/lib/constraints";
import { SECTIONS } from "@/lib/copy";
import {
  DEFAULT_INPUTS,
  SLIDERS,
  snapToSlider,
  type SliderField as SliderFieldId,
} from "@/lib/defaults";
import { computePlan } from "@/lib/finance/plan";
import type { PlanInputs } from "@/lib/finance/types";
import { formatEuro } from "@/lib/format";
import { MobileResultBar } from "./MobileResultBar";
import { ResultPanel, verdictHeadline } from "./ResultPanel";
import { Section } from "./Section";
import { SliderField } from "./SliderField";

interface State {
  inputs: PlanInputs;
  /** Per age field: a counter that increments whenever the field was pushed by a neighbour. */
  flashes: Record<AgeField, number>;
}

type Action = { type: "set"; field: SliderFieldId; value: number };

const initialState: State = {
  inputs: DEFAULT_INPUTS,
  flashes: { currentAge: 0, retirementAge: 0, payoutEndAge: 0 },
};

export function reducer(state: State, action: Action): State {
  // Snap to the slider step so fractional steps (the rate slider) never carry float noise.
  const value = snapToSlider(action.field, action.value);
  const candidate: PlanInputs = { ...state.inputs, [action.field]: value };
  if (!isAgeField(action.field)) {
    return { ...state, inputs: candidate };
  }
  const constrained = applyAgeConstraints(candidate, action.field);
  const pushed = pushedFields(state.inputs, constrained, action.field);
  if (pushed.length === 0) {
    return { ...state, inputs: constrained };
  }
  const flashes = { ...state.flashes };
  for (const field of pushed) flashes[field] += 1;
  return { inputs: constrained, flashes };
}

export function Calculator() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const result = useMemo(
    () => computePlan(state.inputs, SLIDERS.monthlySavings.max),
    [state.inputs],
  );

  const setField = (field: SliderFieldId, value: number) =>
    dispatch({ type: "set", field, value });

  // Screen-reader announcement, throttled so drags don't flood the live region.
  const [announcement, setAnnouncement] = useState("");
  const lastAnnounced = useRef(0);
  useEffect(() => {
    const text = `${verdictHeadline(result)}. ${formatEuro(result.drawdown.endBalance)}.`;
    const now = Date.now();
    const wait = Math.max(0, 500 - (now - lastAnnounced.current));
    const timer = window.setTimeout(() => {
      lastAnnounced.current = Date.now();
      setAnnouncement(text);
    }, wait);
    return () => window.clearTimeout(timer);
  }, [result]);

  return (
    <div className="grid gap-8 lg:grid-cols-12 lg:items-start lg:gap-10">
      <div className="flex flex-col gap-8 lg:col-span-7">
        {SECTIONS.map((section) => (
          <Section
            key={section.id}
            id={section.id}
            title={section.title}
            accent={section.accent}
          >
            {section.fields.map((field) => (
              <SliderField
                key={field}
                field={field}
                value={state.inputs[field]}
                onChange={(value) => setField(field, value)}
                accent={section.accent}
                flashKey={isAgeField(field) ? state.flashes[field] : 0}
              />
            ))}
          </Section>
        ))}
      </div>

      <div className="lg:col-span-5 lg:sticky lg:top-6">
        <ResultPanel result={result} onApply={setField} />
      </div>

      <MobileResultBar result={result} targetId="results" />

      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>
    </div>
  );
}
