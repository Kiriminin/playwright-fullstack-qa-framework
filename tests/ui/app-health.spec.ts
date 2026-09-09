import { test, expect } from "@playwright/test";

test("@smoke should open the Toolshop home page", async ({ page }) => {
  const response = await page.goto("/");

  expect(response?.ok()).toBeTruthy();
  await expect(page).toHaveTitle(/Practice Software Testing/i);
});