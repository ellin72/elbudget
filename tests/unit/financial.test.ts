import {
  buildMonthlySummary,
  calculateCurrentPeriodStats,
  createMonthBuckets,
} from "@/lib/financial";

describe("financial calculations", () => {
  it("builds monthly summary with declared income override for anchor month", () => {
    const anchor = new Date("2026-06-15T00:00:00.000Z");
    const buckets = createMonthBuckets(anchor, 2);

    const txs = [
      { amount: 2000, type: "INCOME", date: new Date("2026-05-10T00:00:00.000Z") },
      { amount: 800, type: "EXPENSE", date: new Date("2026-05-12T00:00:00.000Z") },
      { amount: 1000, type: "INCOME", date: new Date("2026-06-02T00:00:00.000Z") },
      { amount: 600, type: "EXPENSE", date: new Date("2026-06-03T00:00:00.000Z") },
    ];

    const summary = buildMonthlySummary(txs as any, buckets, 5000, anchor);
    expect(summary).toHaveLength(2);
    expect(summary[1].income).toBe(5000);
    expect(summary[1].expenses).toBe(600);
    expect(summary[1].savings).toBe(4400);
  });

  it("calculates current period stats safely when income is zero", () => {
    const anchor = new Date("2026-06-15T00:00:00.000Z");
    const txs = [{ amount: 300, type: "EXPENSE", date: new Date("2026-06-05T00:00:00.000Z") }];

    const stats = calculateCurrentPeriodStats(txs as any, anchor, 0);
    expect(stats.income).toBe(0);
    expect(stats.expenses).toBe(300);
    expect(stats.savingsRate).toBe(0);
  });
});
