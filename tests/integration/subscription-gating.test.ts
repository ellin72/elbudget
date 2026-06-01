import { PLAN_FEATURES } from "@/types";

describe("subscription capabilities", () => {
  it("defines strict free plan limits", () => {
    expect(PLAN_FEATURES.FREE.maxBudgets).toBe(3);
    expect(PLAN_FEATURES.FREE.maxGoals).toBe(3);
    expect(PLAN_FEATURES.FREE.maxDebts).toBe(5);
    expect(PLAN_FEATURES.FREE.aiMessagesPerMonth).toBe(30);
    expect(PLAN_FEATURES.FREE.exportFormats).toEqual(["csv"]);
  });

  it("enables premium export formats", () => {
    expect(PLAN_FEATURES.PREMIUM.exportFormats).toContain("pdf");
    expect(PLAN_FEATURES.PREMIUM.exportFormats).toContain("xlsx");
  });
});
