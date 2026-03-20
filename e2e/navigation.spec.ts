import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("navigates from home to settings via nav link", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.getByText("[SETTINGS]").click({ timeout: 10_000 });
    await expect(page).toHaveURL("/settings");
    await expect(page.getByText("RPC ENDPOINTS")).toBeVisible({ timeout: 10_000 });
  });

  test("navigates from settings to home via nav link", async ({ page }) => {
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");
    await page.getByText("[DASHBOARD]").click({ timeout: 10_000 });
    await expect(page).toHaveURL("/");
  });

  test("navigates from settings to home via back button", async ({ page }) => {
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");
    await page.getByText("[BACK]").click({ timeout: 10_000 });
    await expect(page).toHaveURL("/");
  });

  test("both pages share the VaultView header", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("VAULTVIEW v0.1.0")).toBeVisible({ timeout: 10_000 });

    await page.goto("/settings");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("VAULTVIEW v0.1.0")).toBeVisible({ timeout: 10_000 });
  });

  test("settings page shows storage usage", async ({ page }) => {
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("STORAGE")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("VaultView data:")).toBeVisible({ timeout: 10_000 });
  });
});
