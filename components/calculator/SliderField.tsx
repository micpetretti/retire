"use client";

import * as Slider from "@radix-ui/react-slider";
import { useState, type CSSProperties } from "react";
import { SLIDER_COPY } from "@/lib/copy";
import { SLIDERS, type SliderField as SliderFieldId } from "@/lib/defaults";
import { formatEuro, formatInteger, formatPercent } from "@/lib/format";
import { HelpPopover } from "./HelpPopover";

export type Accent = "sun" | "sky" | "lilac";

const accentRange: Record<Accent, string> = {
  sun: "bg-sun",
  sky: "bg-sky",
  lilac: "bg-lilac",
};

const accentThumb: Record<Accent, string> = {
  sun: "data-[dragging=true]:bg-sun",
  sky: "data-[dragging=true]:bg-sky",
  lilac: "data-[dragging=true]:bg-lilac",
};

const accentFlashVar: Record<Accent, string> = {
  sun: "var(--color-sun)",
  sky: "var(--color-sky)",
  lilac: "var(--color-lilac)",
};

interface SliderFieldProps {
  field: SliderFieldId;
  value: number;
  onChange: (value: number) => void;
  accent: Accent;
  /** Increment to trigger a flash (the slider was pushed by a neighbour). */
  flashKey?: number;
}

function formatValue(
  field: SliderFieldId,
  value: number,
): { text: string; unit: string } {
  const unit = SLIDER_COPY[field].unit;
  switch (unit) {
    case "perMonth":
      return { text: formatEuro(value), unit: "/mo" };
    case "euro":
      return { text: formatEuro(value), unit: "" };
    case "years":
      return { text: formatInteger(value), unit: " yrs" };
    case "percent":
      return { text: formatPercent(value), unit: "/yr" };
  }
}

function valueText(field: SliderFieldId, value: number): string {
  const unit = SLIDER_COPY[field].unit;
  switch (unit) {
    case "perMonth":
      return `${formatEuro(value)} per month`;
    case "euro":
      return formatEuro(value);
    case "years":
      return `${value} years`;
    case "percent":
      return `${formatPercent(value)} per year after inflation`;
  }
}

function formatRangeEnd(field: SliderFieldId, value: number): string {
  switch (SLIDER_COPY[field].unit) {
    case "years":
      return String(value);
    case "percent":
      return formatPercent(value);
    default:
      return formatEuro(value);
  }
}

export function SliderField({
  field,
  value,
  onChange,
  accent,
  flashKey = 0,
}: SliderFieldProps) {
  const copy = SLIDER_COPY[field];
  const config = SLIDERS[field];
  const [dragging, setDragging] = useState(false);

  const display = formatValue(field, value);
  const id = `slider-${field}`;

  return (
    <div
      className="relative isolate px-4 py-4 sm:px-6 sm:py-5"
      style={{ "--flash-color": accentFlashVar[accent] } as CSSProperties}
      data-testid={`field-${field}`}
    >
      {/* Re-keying restarts the CSS animation each time the slider is pushed by a neighbour. */}
      {flashKey > 0 && (
        <div
          key={flashKey}
          aria-hidden="true"
          data-testid={`flash-${field}`}
          className="animate-flash pointer-events-none absolute inset-0 -z-10"
        />
      )}
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            id={`${id}-label`}
            className="uppercase-label font-sans text-sm sm:text-base"
          >
            {copy.label}
          </span>
          <HelpPopover label={`Explain ${copy.label.toLowerCase()}`}>
            <p>{copy.help}</p>
            {copy.helpList && (
              <ul className="flex flex-col gap-1 pl-4">
                {copy.helpList.map((item) => (
                  <li key={item} className="list-[square]">
                    {item}
                  </li>
                ))}
              </ul>
            )}
            {copy.helpFooter && <p>{copy.helpFooter}</p>}
          </HelpPopover>
        </div>
        <output
          htmlFor={id}
          aria-live="off"
          className="border-brut tabular shrink-0 bg-surface px-2.5 py-1 font-mono text-lg font-bold shadow-hard-sm sm:text-xl"
          data-testid={`value-${field}`}
        >
          {display.text}
          {display.unit && (
            <span className="text-sm font-bold sm:text-base">{display.unit}</span>
          )}
        </output>
      </div>

      <Slider.Root
        id={id}
        className="relative flex h-11 w-full touch-none select-none items-center"
        min={config.min}
        max={config.max}
        step={config.step}
        value={[value]}
        onValueChange={([next]) => onChange(next)}
        onPointerDown={() => setDragging(true)}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
        onLostPointerCapture={() => setDragging(false)}
      >
        <Slider.Track className="border-brut relative h-4 grow overflow-hidden bg-surface lg:h-3">
          <Slider.Range className={["absolute h-full", accentRange[accent]].join(" ")} />
        </Slider.Track>
        <Slider.Thumb
          aria-label={copy.ariaLabel}
          aria-valuetext={valueText(field, value)}
          data-dragging={dragging}
          className={[
            "border-brut block h-8 w-8 cursor-grab rounded-full bg-surface shadow-hard-sm",
            "data-[dragging=true]:cursor-grabbing data-[dragging=true]:shadow-hard-none",
            accentThumb[accent],
          ].join(" ")}
        />
      </Slider.Root>

      <div className="mt-1 flex justify-between font-mono text-xs font-bold text-muted">
        <span>{formatRangeEnd(field, config.min)}</span>
        <span>{formatRangeEnd(field, config.max)}</span>
      </div>
    </div>
  );
}
