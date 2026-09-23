import { describe, expect, it } from "vitest";
import {
  formatAge,
  formatEuro,
  formatMonthsLong,
  formatSignedEuro,
  formatYearsMonths,
  formatYearsMonthsLong,
} from "@/lib/format";

// Intl output uses non-breaking spaces; normalise for readable assertions.
const plain = (s: string) => s.replace(/\u00a0|\u202f/g, " ");

describe("formatEuro", () => {
  it("formats 2000 as 2.000 €", () => {
    expect(plain(formatEuro(2_000))).toBe("2.000 €");
  });

  it("rounds to whole euros", () => {
    expect(plain(formatEuro(2_547.57))).toBe("2.548 €");
  });

  it("switches to compact notation above 10 million", () => {
    expect(plain(formatEuro(12_300_000))).toBe("12,3 Mio. €");
  });
});

describe("formatSignedEuro", () => {
  it("prefixes a plus for positive values", () => {
    expect(plain(formatSignedEuro(500))).toBe("+500 €");
  });

  it("uses a real minus sign for negative values", () => {
    expect(plain(formatSignedEuro(-500))).toBe("−500 €");
  });

  it("has no sign for zero", () => {
    expect(plain(formatSignedEuro(0))).toBe("0 €");
  });
});

describe("years/months formatting", () => {
  it("formats 64 years 11 months compactly", () => {
    expect(formatYearsMonths({ years: 64, months: 11 })).toBe("64 yrs 11 mo");
  });

  it("omits zero parts", () => {
    expect(formatYearsMonths({ years: 67, months: 0 })).toBe("67 yrs");
    expect(formatYearsMonths({ years: 0, months: 5 })).toBe("5 mo");
  });

  it("uses singular words in the long form", () => {
    expect(formatYearsMonthsLong({ years: 1, months: 1 })).toBe("1 year 1 month");
  });

  it("converts a month count to prose", () => {
    expect(formatMonthsLong(-25)).toBe("2 years 1 month");
  });

  it("formatAge shows whole years plainly", () => {
    expect(formatAge({ years: 84, months: 0 })).toBe("84");
    expect(formatAge({ years: 64, months: 11 })).toBe("64 yrs 11 mo");
  });
});
