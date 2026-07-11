import { type Page } from "@playwright/test";

// Seeded fixtures (packages/db/tests/seed_rls_fixtures.sql + seed_counsellor_fixtures.sql).
export const COUNSELLOR = {
  email: "rls-counsellor1@epicenter-test.dev",
  password: "Test-Passw0rd!",
};

export async function loginAsCounsellor(page: Page): Promise<void> {
  await page.goto("/login");
  await page.fill("#email", COUNSELLOR.email);
  await page.fill("#password", COUNSELLOR.password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/counsellor/dashboard");
}
