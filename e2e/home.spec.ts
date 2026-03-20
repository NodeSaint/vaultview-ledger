import { test, expect } from "@playwright/test";

test.describe("Home page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Wait for client hydration
    await page.waitForLoadState("networkidle");
  });

  test("renders the VaultView header", async ({ page }) => {
    // The header is in the Shell component which is client-side
    await expect(page.getByText("VAULTVIEW v0.1.0")).toBeVisible({ timeout: 10_000 });
  });

  test("renders the CRT shell footer", async ({ page }) => {
    await expect(page.getByText("STATUS: READY")).toBeVisible({ timeout: 10_000 });
  });

  test("shows browser guard or connect button", async ({ page }) => {
    // In Playwright's Chromium, WebHID may or may not be available
    // Either the unsupported browser message OR the connect button should show
    const unsupported = page.getByText("UNSUPPORTED BROWSER");
    const connectBtn = page.getByRole("button", { name: /CONNECT LEDGER/ });

    await expect(
      unsupported.or(connectBtn)
    ).toBeVisible({ timeout: 10_000 });
  });
});
