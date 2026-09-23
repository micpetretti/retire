import type { SliderField } from "./defaults";

export type SectionId = "spending" | "timeline" | "savings";

export interface SliderCopy {
  label: string;
  /** Long label for screen readers. */
  ariaLabel: string;
  help: string;
  unit: "perMonth" | "years" | "euro";
}

export const SLIDER_COPY: Record<SliderField, SliderCopy> = {
  monthlyGap: {
    label: "Monthly gap",
    ariaLabel: "Monthly gap your savings must cover in retirement",
    help: "How much money per month you'll need from your own savings in retirement — on top of what a state pension or other income covers. In today's euros. The illustration withdraws this amount from your savings every month.",
    unit: "perMonth",
  },
  currentAge: {
    label: "Age now",
    ariaLabel: "Your current age",
    help: "Your current age in full years.",
    unit: "years",
  },
  retirementAge: {
    label: "Retire at",
    ariaLabel: "Age at which you retire",
    help: "The age at which you stop working and start living off your savings. From this point on, no more money goes into ETFs and withdrawals begin. Must be at least one year after your current age.",
    unit: "years",
  },
  payoutEndAge: {
    label: "Paid until",
    ariaLabel: "Age until which your savings must last",
    help: "The age until which your savings need to last. The default of 84 is the average life expectancy of women in Germany (women live longer than men on average, so this is the safer assumption). Must be at least one year after your retirement age.",
    unit: "years",
  },
  cash: {
    label: "Cash",
    ariaLabel: "Money you hold in cash or low-interest accounts",
    help: "Money that is not invested in the capital markets: current account, savings account, cash under the mattress, fixed deposits with low interest. The illustration assumes this money does not grow.",
    unit: "euro",
  },
  etf: {
    label: "In ETFs",
    ariaLabel: "Money you currently have invested in ETFs",
    help: "Money you already have invested in ETFs (or similar broadly diversified investments). The illustration assumes it grows by 5 % per year after inflation until you retire, compounded monthly.",
    unit: "euro",
  },
  monthlySavings: {
    label: "ETF savings",
    ariaLabel: "Monthly amount you invest into ETFs",
    help: "How much you put into ETFs every month from now until you retire. Contributions stop at retirement.",
    unit: "perMonth",
  },
};

export interface SectionCopy {
  id: SectionId;
  title: string;
  fields: SliderField[];
  accent: "sun" | "sky" | "lilac";
}

export const SECTIONS: SectionCopy[] = [
  { id: "spending", title: "Spending", fields: ["monthlyGap"], accent: "sun" },
  {
    id: "timeline",
    title: "Timeline",
    fields: ["currentAge", "retirementAge", "payoutEndAge"],
    accent: "sky",
  },
  {
    id: "savings",
    title: "Savings",
    fields: ["cash", "etf", "monthlySavings"],
    accent: "lilac",
  },
];

export const DISCLAIMER_SHORT = "For illustration only";

export const DISCLAIMER_LINE =
  "This is a simplified illustration to play with — not financial advice and not an actual calculation of your pension.";

export const HOW_IT_WORKS =
  "Until you retire, your ETF balance grows by 5 % per year (compounded monthly) and receives your monthly savings. Cash stays as it is. At retirement, the total is withdrawn month by month by your monthly gap with no further growth. The verdict tells you whether that total lasts until the age you chose.";

export const ASSUMPTIONS: string[] = [
  "All amounts are in today's euros.",
  "ETFs grow 5 % per year after inflation until retirement, compounded monthly.",
  "No growth of any kind after retirement.",
  "No taxes, fees or transaction costs.",
  "State pension or other income is not modelled — the monthly gap is what your savings must cover on top of it.",
  "Cash does not grow.",
  "Returns are constant; real markets go up and down.",
];

export const TAGLINE =
  "Move the sliders. Watch the verdict change. See what one small tweak does to your future.";
