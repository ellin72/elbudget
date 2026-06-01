import {
  calculate5030_20,
  calculateDebtPayoffMonths,
  calculateMonthlyInterest,
  formatCurrency,
} from "@/lib/utils";

describe("utils calculations and formatting", () => {
  it("formats currency with expected symbol", () => {
    expect(formatCurrency(1234.56, "NAD")).toContain("N$");
  });

  it("computes 50/30/20 split", () => {
    const split = calculate5030_20(10000);
    expect(split.needs).toBe(5000);
    expect(split.wants).toBe(3000);
    expect(split.savings).toBe(2000);
  });

  it("computes monthly interest and payoff months", () => {
    const interest = calculateMonthlyInterest(12000, 12);
    expect(interest).toBeCloseTo(120, 2);

    const months = calculateDebtPayoffMonths(12000, 400, 12);
    expect(months).toBeGreaterThan(0);
    expect(Number.isFinite(months)).toBe(true);
  });
});
