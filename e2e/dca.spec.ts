import { test, expect } from "@playwright/test";

test.describe("DCA Tracker", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    // Clear localStorage to start fresh
    await page.evaluate(() => { localStorage.clear(); });
    await page.reload();
    await page.waitForLoadState("networkidle");
  });

  test("shows DCA section with add button", async ({ page }) => {
    // The DCA tracker renders regardless of browser guard since
    // it's inside the BrowserGuard — if WebHID is unsupported,
    // the DCA tracker won't show. We need to handle both cases.
    const unsupported = page.getByText("UNSUPPORTED BROWSER");
    const addBtn = page.getByRole("button", { name: /ADD ENTRY/ });

    const isUnsupported = await unsupported.isVisible().catch(() => false);
    if (isUnsupported) {
      test.skip();
      return;
    }

    await expect(addBtn).toBeVisible({ timeout: 10_000 });
  });

  test("opens and closes add entry form", async ({ page }) => {
    const unsupported = page.getByText("UNSUPPORTED BROWSER");
    const isUnsupported = await unsupported.isVisible().catch(() => false);
    if (isUnsupported) {
      test.skip();
      return;
    }

    await page.getByRole("button", { name: /ADD ENTRY/ }).click({ timeout: 10_000 });
    await expect(page.getByText("ASSET:")).toBeVisible();

    await page.getByRole("button", { name: /CANCEL/ }).click();
    await expect(page.getByText("ASSET:")).not.toBeVisible();
  });

  test("adds and deletes a DCA entry", async ({ page }) => {
    const unsupported = page.getByText("UNSUPPORTED BROWSER");
    const isUnsupported = await unsupported.isVisible().catch(() => false);
    if (isUnsupported) {
      test.skip();
      return;
    }

    // Add
    await page.getByRole("button", { name: /ADD ENTRY/ }).click({ timeout: 10_000 });
    await page.locator('input[placeholder="ETH"]').fill("ETH");
    await page.locator('input[placeholder="0.5"]').fill("1.5");
    await page.locator('input[placeholder="2000"]').fill("2000");
    await page.getByRole("button", { name: /SAVE/ }).first().click();

    await expect(page.getByText("$3,000.00").first()).toBeVisible({ timeout: 5_000 });

    // Delete
    await page.getByRole("button", { name: "×" }).first().click();
    await expect(page.getByText("No DCA entries")).toBeVisible({ timeout: 5_000 });
  });
});
