import type { ChartPoint } from "@/lib/finance/types";
import { formatEuro } from "@/lib/format";

interface BalanceChartProps {
  points: ChartPoint[];
  retirementAge: number;
  lasts: boolean;
  /** Age at which the balance hits zero (fractional), if it does. */
  depletionAgeInYears?: number;
}

const W = 600;
const H = 260;
const PAD = { top: 28, right: 16, bottom: 32, left: 16 };

export function BalanceChart({
  points,
  retirementAge,
  lasts,
  depletionAgeInYears,
}: BalanceChartProps) {
  if (points.length < 2) return null;

  const ages = points.map((p) => p.age);
  const balances = points.map((p) => p.balance);
  const minAge = ages[0];
  const maxAge = ages[ages.length - 1];
  const maxBalance = Math.max(...balances, 1);
  const minBalance = Math.min(...balances, 0);

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const x = (age: number) => PAD.left + ((age - minAge) / (maxAge - minAge)) * innerW;
  const y = (balance: number) =>
    PAD.top + ((maxBalance - balance) / (maxBalance - minBalance)) * innerH;

  const zeroY = y(0);
  const retirementIndex = points.findIndex((p) => p.age === retirementAge);
  const accumulation = points.slice(0, retirementIndex + 1);
  const drawdown = points.slice(retirementIndex);

  const toPath = (pts: ChartPoint[]) =>
    pts
      .map(
        (p, i) =>
          `${i === 0 ? "M" : "L"}${x(p.age).toFixed(1)},${y(p.balance).toFixed(1)}`,
      )
      .join(" ");

  const areaPath = (pts: ChartPoint[]) => {
    if (pts.length === 0) return "";
    const first = pts[0];
    const last = pts[pts.length - 1];
    return `${toPath(pts)} L${x(last.age).toFixed(1)},${zeroY.toFixed(1)} L${x(first.age).toFixed(1)},${zeroY.toFixed(1)} Z`;
  };

  // Split the drawdown at the zero crossing so the positive part and the shortfall get different fills.
  let positiveDrawdown = drawdown;
  let negativeDrawdown: ChartPoint[] = [];
  if (!lasts && depletionAgeInYears !== undefined) {
    const crossing: ChartPoint = { age: depletionAgeInYears, balance: 0 };
    positiveDrawdown = [
      ...drawdown.filter((p) => p.age <= depletionAgeInYears),
      crossing,
    ];
    negativeDrawdown = [crossing, ...drawdown.filter((p) => p.age > depletionAgeInYears)];
  }

  const tickAges = Array.from(new Set([minAge, retirementAge, maxAge]));
  const peakLabelLeft = x(retirementAge) - PAD.left > 110;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full"
      role="img"
      aria-hidden="true"
      focusable="false"
    >
      {/* Flat area fills */}
      <path d={areaPath(accumulation)} className="fill-lilac" />
      <path d={areaPath(positiveDrawdown)} className="fill-acid" />
      {negativeDrawdown.length > 1 && (
        <path d={areaPath(negativeDrawdown)} className="fill-hot" />
      )}

      {/* Balance line */}
      <path
        d={toPath(points)}
        className="stroke-ink"
        fill="none"
        strokeWidth={3}
        strokeLinejoin="miter"
        strokeLinecap="square"
      />

      {/* Zero line */}
      <line
        x1={PAD.left}
        x2={W - PAD.right}
        y1={zeroY}
        y2={zeroY}
        className="stroke-ink"
        strokeWidth={2}
        strokeDasharray="6 6"
      />

      {/* Retirement marker */}
      <line
        x1={x(retirementAge)}
        x2={x(retirementAge)}
        y1={PAD.top - 8}
        y2={H - PAD.bottom}
        className="stroke-ink"
        strokeWidth={3}
      />
      <g transform={`translate(${x(retirementAge)}, ${PAD.top - 20})`}>
        <rect x={-34} y={-12} width={68} height={22} className="fill-ink" />
        <text
          textAnchor="middle"
          y={4}
          className="fill-paper font-mono text-[11px] font-bold uppercase"
        >
          Retire
        </text>
      </g>

      {/* Peak label: left of the retirement marker, just under the top edge so it never
          collides with the "Retire" badge above the marker. */}
      <text
        x={x(retirementAge) + (peakLabelLeft ? -8 : 8)}
        y={PAD.top + 14}
        textAnchor={peakLabelLeft ? "end" : "start"}
        className="tabular fill-ink font-mono text-[12px] font-bold"
      >
        {formatEuro(points[retirementIndex]?.balance ?? maxBalance)}
      </text>

      {/* X axis ticks */}
      {tickAges.map((age) => (
        <text
          key={age}
          x={x(age)}
          y={H - 10}
          textAnchor={age === minAge ? "start" : age === maxAge ? "end" : "middle"}
          className="tabular fill-ink font-mono text-[12px] font-bold"
        >
          {age}
        </text>
      ))}

      {/* Depletion label */}
      {!lasts && depletionAgeInYears !== undefined && (
        <g transform={`translate(${x(depletionAgeInYears)}, ${zeroY})`}>
          <circle r={6} className="fill-hot stroke-ink" strokeWidth={3} />
        </g>
      )}
    </svg>
  );
}
