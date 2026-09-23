import type { YearsMonths } from "./finance/types";

const LOCALE = "de-DE";

const euroWhole = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const euroCompact = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: "EUR",
  notation: "compact",
  maximumFractionDigits: 1,
});

const integer = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 });

/** "2.000 €"; switches to compact ("12,3 Mio. €") above 10 million. */
export function formatEuro(value: number): string {
  const rounded = Math.round(value);
  if (Math.abs(rounded) >= 10_000_000) return euroCompact.format(rounded);
  return euroWhole.format(rounded);
}

/** "+2.000 €" / "−2.000 €" with a real minus sign. */
export function formatSignedEuro(value: number): string {
  const rounded = Math.round(value);
  if (rounded === 0) return formatEuro(0);
  const sign = rounded > 0 ? "+" : "−";
  return `${sign}${formatEuro(Math.abs(rounded))}`;
}

export function formatInteger(value: number): string {
  return integer.format(Math.round(value));
}

/** "2.000 €/mo" */
export function formatEuroPerMonth(value: number): string {
  return `${formatEuro(value)}/mo`;
}

/** "64 yrs 11 mo", "67 yrs", "5 mo" */
export function formatYearsMonths({ years, months }: YearsMonths): string {
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} ${years === 1 ? "yr" : "yrs"}`);
  if (months > 0) parts.push(`${months} mo`);
  if (parts.length === 0) return "0 mo";
  return parts.join(" ");
}

/** "64 years 11 months", "1 year", "5 months" — for prose. */
export function formatYearsMonthsLong({ years, months }: YearsMonths): string {
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} ${years === 1 ? "year" : "years"}`);
  if (months > 0) parts.push(`${months} ${months === 1 ? "month" : "months"}`);
  if (parts.length === 0) return "0 months";
  return parts.join(" ");
}

/** Converts a month count to a prose duration, e.g. 25 → "2 years 1 month". */
export function formatMonthsLong(totalMonths: number): string {
  const abs = Math.abs(Math.round(totalMonths));
  return formatYearsMonthsLong({ years: Math.floor(abs / 12), months: abs % 12 });
}

/** "84" or "64 yrs 11 mo" depending on whether months are present. */
export function formatAge(age: YearsMonths): string {
  return age.months === 0 ? `${age.years}` : formatYearsMonths(age);
}
