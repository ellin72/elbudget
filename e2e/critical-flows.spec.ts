import { test, expect } from "@playwright/test";

const runFullE2E = process.env.RUN_E2E === "true";

test.describe("Critical user flows", () => {
  test.skip(!runFullE2E, "Set RUN_E2E=true to execute full finance E2E suite.");

  test("registration and login page availability", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByText(/create/i)).toBeVisible();

    await page.goto("/login");
    await expect(page.getByText(/sign in/i)).toBeVisible();
  });

  test("onboarding flow entry", async ({ page }) => {
    await page.goto("/onboarding");
    await expect(page.getByText(/onboarding|income|budget/i).first()).toBeVisible();
  });

  test("dashboard feature pages are routable", async ({ page }) => {
    const pages = [
      "/dashboard",
      "/transactions",
      "/budgets",
      "/goals",
      "/ai-assistant",
      "/reports",
    ];

    for (const path of pages) {
      await page.goto(path);
      await expect(page.locator("body")).toBeVisible();
    }
  });
});
