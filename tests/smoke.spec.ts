import { expect, test } from "@playwright/test";

test("loads the dashboard shell", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "CT-045 PCF Lifecycle Dashboard" })).toBeVisible();
});
