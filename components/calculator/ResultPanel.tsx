"use client";

import { ArrowRight, Check, X } from "lucide-react";
import { useMemo, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DISCLAIMER_LINE, HOW_IT_WORKS } from "@/lib/copy";
import { isOutsideSlider, snapToSlider, type SliderField } from "@/lib/defaults";
import { computePlan } from "@/lib/finance/plan";
import type { PlanResult } from "@/lib/finance/types";
import {
  formatAge,
  formatEuro,
  formatMonthsLong,
  formatSignedEuro,
  formatYearsMonthsLong,
} from "@/lib/format";
import { BalanceChart } from "./BalanceChart";
import { HelpPopover } from "./HelpPopover";

interface ResultPanelProps {
  result: PlanResult;
  onApply: (field: SliderField, value: number) => void;
}

export function verdictHeadline(result: PlanResult): string {
  if (result.lasts) return `Lasts until ${result.inputs.payoutEndAge}`;
  const age = result.drawdown.depletionAge;
  return `Runs out at ${age ? formatAge(age) : result.inputs.retirementAge}`;
}

export function ResultPanel({ result, onApply }: ResultPanelProps) {
  const { inputs, accumulation, drawdown, lasts, solved } = result;

  const zeroSavingsEndBalance = useMemo(
    () =>
      solved.monthlySavings.clampedToZero
        ? computePlan({ ...inputs, monthlySavings: 0 }).drawdown.endBalance
        : undefined,
    [inputs, solved.monthlySavings.clampedToZero],
  );

  const depletionAgeInYears =
    drawdown.depletionAge !== undefined
      ? inputs.retirementAge +
        Math.min(drawdown.monthsUntilDepleted, drawdown.months) / 12
      : undefined;

  return (
    <Card shadow="lg" id="results" className="overflow-hidden" data-testid="result-panel">
      {/* Verdict */}
      <section
        className={[
          "border-brut-b px-5 py-6 sm:px-8 sm:py-8",
          lasts ? "bg-acid" : "bg-hot",
        ].join(" ")}
        aria-labelledby="verdict-heading"
      >
        <div className="mb-2 flex items-center gap-3">
          <span className="border-brut inline-flex h-9 w-9 items-center justify-center bg-surface shadow-hard-xs">
            {lasts ? (
              <Check strokeWidth={4} className="h-5 w-5" />
            ) : (
              <X strokeWidth={4} className="h-5 w-5" />
            )}
          </span>
          <span className="uppercase-label font-sans text-sm">Verdict</span>
        </div>
        <h2
          id="verdict-heading"
          className="font-display text-[2.5rem] uppercase leading-[0.95] tracking-tight sm:text-5xl lg:text-6xl"
          data-testid="verdict"
        >
          {verdictHeadline(result)}
        </h2>
        <p
          className="mt-3 font-sans text-lg font-bold sm:text-xl"
          data-testid="verdict-sub"
        >
          {lasts
            ? `About ${formatEuro(drawdown.endBalance)} left at ${inputs.payoutEndAge}.`
            : `${formatEuro(Math.abs(drawdown.endBalance))} short — ${
                drawdown.shortBy ? formatYearsMonthsLong(drawdown.shortBy) : ""
              } too early.`}
        </p>
        <p className="mt-3 font-sans text-sm italic">{DISCLAIMER_LINE}</p>
      </section>

      {/* Key numbers */}
      <section className="border-brut-b px-5 py-5 sm:px-8" aria-label="Key numbers">
        <div className="mb-3 flex items-center gap-2">
          <h3 className="uppercase-label font-sans text-sm">Key numbers</h3>
          <HelpPopover label="How is this calculated?">{HOW_IT_WORKS}</HelpPopover>
        </div>
        <dl className="divide-y-3 divide-ink">
          <KeyNumber
            label="At retirement"
            hint={`${formatEuro(inputs.cash)} cash + ${formatEuro(accumulation.etfAtRetirement)} ETFs`}
            value={formatEuro(accumulation.total)}
          />
          <KeyNumber
            label={`Needed until ${inputs.payoutEndAge}`}
            hint={`${formatEuro(inputs.monthlyGap)} × ${drawdown.months} months`}
            value={formatEuro(drawdown.totalNeeded)}
          />
          <KeyNumber
            label={lasts ? "Left over" : "Shortfall"}
            value={formatSignedEuro(drawdown.endBalance)}
            valueClass={lasts ? "bg-mint" : "bg-hot"}
          />
        </dl>
      </section>

      {/* What would have to change */}
      <section
        className="border-brut-b px-5 py-5 sm:px-8"
        aria-labelledby="change-heading"
      >
        <h3 id="change-heading" className="uppercase-label mb-1 font-sans text-sm">
          To land at exactly 0 € at {inputs.payoutEndAge}
        </h3>
        <p className="mb-4 font-sans text-sm font-medium text-muted">
          Change one thing, keep everything else.
        </p>
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
          <SpendingCard result={result} onApply={onApply} />
          <RetirementCard result={result} onApply={onApply} />
          <SavingsCard
            result={result}
            onApply={onApply}
            zeroSavingsEndBalance={zeroSavingsEndBalance}
          />
        </div>
      </section>

      {/* Chart */}
      <section className="px-5 py-5 sm:px-8" aria-label="Balance over time">
        <h3 className="uppercase-label mb-3 font-sans text-sm">
          Balance from {inputs.currentAge} to {inputs.payoutEndAge}
        </h3>
        <div className="border-brut bg-surface p-2">
          <BalanceChart
            points={result.chart}
            retirementAge={inputs.retirementAge}
            lasts={lasts}
            depletionAgeInYears={depletionAgeInYears}
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-4 font-mono text-xs font-bold">
          <Legend swatch="bg-lilac" label="Saving up" />
          <Legend swatch="bg-acid" label="Living off it" />
          {!lasts && <Legend swatch="bg-hot" label="Shortfall" />}
        </div>
      </section>
    </Card>
  );
}

function KeyNumber({
  label,
  hint,
  value,
  valueClass = "",
}: {
  label: string;
  hint?: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <dt className="min-w-0">
        <span className="uppercase-label block font-sans text-xs sm:text-sm">
          {label}
        </span>
        {hint && (
          <span className="block font-sans text-xs font-medium text-muted sm:text-sm">
            {hint}
          </span>
        )}
      </dt>
      <dd
        className={[
          "tabular shrink-0 font-mono text-xl font-bold sm:text-2xl",
          valueClass ? `border-brut px-2 py-0.5 shadow-hard-xs ${valueClass}` : "",
        ].join(" ")}
      >
        {value}
      </dd>
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={["border-brut inline-block h-4 w-4", swatch].join(" ")} />
      {label}
    </span>
  );
}

interface ChangeCardProps {
  accent: "sun" | "sky" | "lilac";
  title: string;
  headline: ReactNode;
  detail?: ReactNode;
  applyLabel?: string;
  onApply?: () => void;
  applyDisabled?: boolean;
  applyHint?: string;
  testId: string;
}

const accentStripe = { sun: "bg-sun", sky: "bg-sky", lilac: "bg-lilac" } as const;

function ChangeCard({
  accent,
  title,
  headline,
  detail,
  applyLabel = "Apply",
  onApply,
  applyDisabled,
  applyHint,
  testId,
}: ChangeCardProps) {
  return (
    <div className="border-brut flex bg-surface shadow-hard-sm" data-testid={testId}>
      <div className={["w-3 shrink-0", accentStripe[accent]].join(" ")} />
      <div className="flex flex-1 flex-col gap-3 p-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
        <div className="flex flex-col gap-1">
          <span className="uppercase-label font-sans text-xs">{title}</span>
          <p className="font-mono text-lg font-bold leading-tight">{headline}</p>
          {detail && <p className="font-sans text-sm font-medium">{detail}</p>}
        </div>
        {onApply && (
          <div className="mt-auto shrink-0 lg:mt-0">
            <Button
              size="sm"
              onClick={onApply}
              disabled={applyDisabled}
              title={applyHint}
            >
              {applyLabel} <ArrowRight strokeWidth={3} className="h-3.5 w-3.5" />
            </Button>
            {applyDisabled && applyHint && (
              <p className="mt-1 font-sans text-xs font-medium text-muted">{applyHint}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SpendingCard({ result, onApply }: ResultPanelProps) {
  const { target, delta } = result.solved.monthlyGap;
  const current = result.inputs.monthlyGap;
  const snapped = snapToSlider("monthlyGap", target, "floor");
  const outside = isOutsideSlider("monthlyGap", target);
  const onTarget = Math.abs(delta) < 1;

  return (
    <ChangeCard
      accent="sun"
      title="Spending"
      testId="change-spending"
      headline={
        onTarget ? (
          "Spot on"
        ) : (
          <>
            Spend {formatEuro(Math.abs(delta))} {delta > 0 ? "more" : "less"}
          </>
        )
      }
      detail={
        onTarget
          ? `${formatEuro(current)} per month is exactly right.`
          : `${formatEuro(target)} instead of ${formatEuro(current)} per month.`
      }
      applyLabel={`Apply (${formatEuro(snapped)})`}
      onApply={() => onApply("monthlyGap", snapped)}
      applyDisabled={outside || onTarget}
      applyHint={outside ? "Above the slider range." : undefined}
    />
  );
}

function RetirementCard({ result, onApply }: ResultPanelProps) {
  const solved = result.solved.retirementAge;
  const current = result.inputs.retirementAge;

  if (solved.unreachable) {
    return (
      <ChangeCard
        accent="sky"
        title="Retirement age"
        testId="change-retirement"
        headline="Not enough"
        detail="Retiring later alone doesn't get you there — even one month before the end."
      />
    );
  }

  const target = Math.ceil(solved.ageInYears - 1e-9);
  const snapped = snapToSlider("retirementAge", target, "ceil");
  const onTarget = solved.deltaMonths === 0;
  const direction = solved.deltaMonths < 0 ? "earlier" : "later";

  return (
    <ChangeCard
      accent="sky"
      title="Retirement age"
      testId="change-retirement"
      headline={
        onTarget ? (
          "Spot on"
        ) : (
          <>
            Retire {formatMonthsLong(solved.deltaMonths)} {direction}
          </>
        )
      }
      detail={
        onTarget
          ? `Retiring at ${current} is exactly right.`
          : `At ${formatAge(solved.age)} instead of ${current}.`
      }
      applyLabel={`Apply (${snapped})`}
      onApply={() => onApply("retirementAge", snapped)}
      applyDisabled={onTarget || snapped === current}
      applyHint={
        !onTarget && snapped === current ? "Already the closest whole year." : undefined
      }
    />
  );
}

function SavingsCard({
  result,
  onApply,
  zeroSavingsEndBalance,
}: ResultPanelProps & { zeroSavingsEndBalance?: number }) {
  const { target, delta, clampedToZero, aboveSliderMax } = result.solved.monthlySavings;
  const current = result.inputs.monthlySavings;
  const snapped = snapToSlider("monthlySavings", target, "ceil");
  const onTarget = Math.abs(delta) < 1;

  if (clampedToZero) {
    return (
      <ChangeCard
        accent="lilac"
        title="Saving"
        testId="change-savings"
        headline="Stop saving"
        detail={`Even at 0 € per month you'd still have ${formatEuro(
          zeroSavingsEndBalance ?? 0,
        )} left at ${result.inputs.payoutEndAge}.`}
        applyLabel="Apply (0 €)"
        onApply={() => onApply("monthlySavings", 0)}
        applyDisabled={current === 0}
      />
    );
  }

  return (
    <ChangeCard
      accent="lilac"
      title="Saving"
      testId="change-savings"
      headline={
        onTarget ? (
          "Spot on"
        ) : (
          <>
            Save {formatEuro(Math.abs(delta))} {delta > 0 ? "more" : "less"}
          </>
        )
      }
      detail={
        onTarget
          ? `${formatEuro(current)} per month is exactly right.`
          : `${formatEuro(target)} instead of ${formatEuro(current)} per month.`
      }
      applyLabel={`Apply (${formatEuro(snapped)})`}
      onApply={() => onApply("monthlySavings", snapped)}
      applyDisabled={aboveSliderMax || onTarget}
      applyHint={aboveSliderMax ? "Above the slider range." : undefined}
    />
  );
}
