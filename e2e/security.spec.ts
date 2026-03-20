import { test, expect } from "@playwright/test";

test.describe("Security headers", () => {
  test("serves Content-Security-Policy header", async ({ page }) => {
    const response = await page.goto("/");
    const csp = response?.headers()["content-security-policy"];
    expect(csp).toBeDefined();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-src 'none'");
    expect(csp).toContain("object-src 'none'");
  });

  test("serves X-Content-Type-Options header", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.headers()["x-content-type-options"]).toBe("nosniff");
  });

  test("serves X-Frame-Options header", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.headers()["x-frame-options"]).toBe("DENY");
  });

  test("serves Referrer-Policy header", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.headers()["referrer-policy"]).toBe(
      "strict-origin-when-cross-origin"
    );
  });

  test("serves Permissions-Policy header", async ({ page }) => {
    const response = await page.goto("/");
    const pp = response?.headers()["permissions-policy"];
    expect(pp).toContain("camera=()");
    expect(pp).toContain("hid=(self)");
  });

  test("does not expose X-Powered-By header", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.headers()["x-powered-by"]).toBeUndefined();
  });
});
