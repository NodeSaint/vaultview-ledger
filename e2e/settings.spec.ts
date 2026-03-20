import { test, expect } from "@playwright/test";

test.describe("Settings page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");
  });

  test("renders settings sections", async ({ page }) => {
    await expect(page.getByText("RPC ENDPOINTS")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("PRICE FEED")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("DISPLAY")).toBeVisible({ timeout: 10_000 });
  });

  test("has save and reset buttons", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /SAVE/ })
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      page.getByRole("button", { name: /RESET/ })
    ).toBeVisible({ timeout: 10_000 });
  });

  test("has back link to home", async ({ page }) => {
    await page.getByText("[BACK]").click({ timeout: 10_000 });
    await expect(page).toHaveURL("/");
  });

  test("has display toggles", async ({ page }) => {
    await expect(page.getByText("CRT Scanlines")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Screen Flicker")).toBeVisible({ timeout: 10_000 });
  });
});
