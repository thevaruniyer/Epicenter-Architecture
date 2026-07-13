import { type Page } from "@playwright/test";

// Seeded fixtures (packages/db/tests/seed_rls_fixtures.sql + seed_counsellor_fixtures.sql).
export const COUNSELLOR = {
  email: "rls-counsellor1@epicenter-test.dev",
  password: "Test-Passw0rd!",
};

// If already authenticated as someone else, /login redirects straight to that
// user's home route before the form ever renders — #email then never appears
// and every subsequent fill times out. Log out first so a test that switches
// personas on one `page` (counsellor -> student -> counsellor, etc.) always
// lands on a real, fillable login form.
async function ensureLoggedOut(page: Page): Promise<void> {
  await page.goto("/login");
  const logoutButton = page.getByRole("button", { name: "Log out" });
  if (await logoutButton.isVisible().catch(() => false)) {
    await logoutButton.click();
    await page.waitForURL("**/login");
  }
}

export async function loginAsCounsellor(page: Page): Promise<void> {
  await ensureLoggedOut(page);
  await page.fill("#email", COUNSELLOR.email);
  await page.fill("#password", COUNSELLOR.password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/counsellor/dashboard");
}

// Kabir Singh — an onboarded student on counsellor1's caseload.
export const STUDENT = {
  email: "demo-student1@epicenter-test.dev",
  password: "Test-Passw0rd!",
};

export async function loginAsStudent(page: Page): Promise<void> {
  await ensureLoggedOut(page);
  await page.fill("#email", STUDENT.email);
  await page.fill("#password", STUDENT.password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/student/home");
}

// Priya Sharma — Head of Counselling (seed_rls_fixtures.sql + seed_counsellor_fixtures.sql).
export const HEAD = {
  email: "rls-head@epicenter-test.dev",
  password: "Test-Passw0rd!",
};

export async function loginAsHead(page: Page): Promise<void> {
  await ensureLoggedOut(page);
  await page.fill("#email", HEAD.email);
  await page.fill("#password", HEAD.password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/counsellor/dashboard");
}
