import { test, expect } from "@playwright/test";
import { loginAsHead, loginAsCounsellor } from "../support/auth";
import { clientFor, CREDS } from "../support/db";

// UC6 Team view (Stage 6): caseload bars per counsellor, Head of Counselling
// only. Counts are read from the DB independently (via the Head's own
// RLS-scoped client) rather than hardcoded, so this test stays correct
// regardless of what other specs have seeded/cleaned up.
test("Team view shows accurate caseload counts per counsellor", async ({ page }) => {
  const head = await clientFor(CREDS.head.email, CREDS.head.password);

  const { data: counsellors } = await head
    .from("users")
    .select("id, full_name, email")
    .in("role", ["counsellor", "head_of_counselling"]);
  const { data: profiles } = await head
    .from("student_profiles")
    .select("assigned_counsellor_id");

  const expectedCounts = new Map<string, number>();
  for (const p of profiles ?? []) {
    if (!p.assigned_counsellor_id) continue;
    expectedCounts.set(
      p.assigned_counsellor_id,
      (expectedCounts.get(p.assigned_counsellor_id) ?? 0) + 1,
    );
  }

  await loginAsHead(page);
  await page.goto("/counsellor/team");

  for (const c of counsellors ?? []) {
    const name = c.full_name ?? c.email;
    const expected = expectedCounts.get(c.id) ?? 0;
    const row = page.getByRole("button", { name: new RegExp(`^${name} `) });
    await expect(row).toBeVisible();
    await expect(row).toContainText(String(expected));
  }
});

test("Team view is not accessible to a regular counsellor", async ({ page }) => {
  await loginAsCounsellor(page);
  await page.goto("/counsellor/team");
  await page.waitForURL("**/counsellor/dashboard");
  await expect(page.getByRole("heading", { name: "Team" })).toHaveCount(0);
});
