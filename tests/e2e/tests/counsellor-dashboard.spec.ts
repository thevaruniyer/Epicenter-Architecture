import { test, expect } from "@playwright/test";
import { loginAsCounsellor } from "../support/auth";

// UC1 Screen 1, rebuilt Stage 6.5 Prompt 6.5.4 against Doctrine §15.3/§20's
// dashboard hierarchy. Covers structure + that list items are real,
// deep-linking records (§15.4) rather than placeholder text.
test.describe("Counsellor Dashboard", () => {
  test("shows the real dashboard hierarchy, not placeholder text", async ({ page }) => {
    await loginAsCounsellor(page);
    await page.goto("/counsellor/dashboard");

    await expect(page.getByText("Daily digest")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Today", exact: true })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Requires attention" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Overdue" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Awaiting your review" }),
    ).toBeVisible();

    // No leftover placeholder copy from the pre-6.5.4 stub.
    await expect(
      page.getByText("Open the Students grid to manage your caseload."),
    ).toHaveCount(0);

    // Stage 8 Prompt 8.3 removed "Caseload progress" outright, not just hid it.
    await expect(
      page.getByRole("heading", { name: "Caseload progress" }),
    ).toHaveCount(0);
  });

  test("an Awaiting your review item deep-links to the real record", async ({ page }) => {
    await loginAsCounsellor(page);
    await page.goto("/counsellor/dashboard");

    // Kabir Singh's seeded fixture tasks keep several tasks in pending_review
    // throughout this suite — this section is never empty for counsellor1.
    const section = page.getByRole("region", { name: "Awaiting your review" });
    const firstItem = section.getByRole("link").first();
    await expect(firstItem).toBeVisible();
    await firstItem.click();

    await expect(page).toHaveURL(/\/counsellor\/students\/[^/]+\/(roadmap|applications|shortlist)/);
  });
});
