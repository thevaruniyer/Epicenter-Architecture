import { test, expect } from "@playwright/test";
import { loginAsStudent, loginAsCounsellor } from "../support/auth";
import { clientFor, CREDS, STUDENT_ID } from "../support/db";

// UC4 / SU4: a student suggests a university; it lands on the counsellor side as
// "Awaiting review"; the counsellor categorises + approves it; the change
// reflects straight back on the student's own shortlist — end to end through the
// real RLS boundary and both real UIs.
test("student suggests a university → counsellor categorises → reflects back", async ({
  page,
}) => {
  const uni = `Cornell ${Date.now()}`;

  // --- Student suggests via the UI (no reach/target/safety selector) ---------
  await loginAsStudent(page);
  await page.goto("/student/shortlist");
  await page.getByRole("button", { name: "+ Suggest a University" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("University").fill(uni);
  await dialog.getByLabel("Course").fill("Applied Economics");
  await dialog.getByLabel("interested").fill("Great ag-econ track.");
  await dialog.getByRole("button", { name: "Send to Counsellor" }).click();
  await expect(dialog).toBeHidden();

  const studentRow = page.locator("li", { hasText: uni });
  await expect(studentRow.getByText("Awaiting review")).toBeVisible();
  // No category yet — the student never sets reach/target/safety.
  await expect(studentRow.getByText("Reach")).toHaveCount(0);

  // --- Counsellor sees it as "Awaiting review" and approves it as Reach ------
  await page.context().clearCookies();
  await loginAsCounsellor(page);
  await page.goto(`/counsellor/students/${STUDENT_ID}/shortlist`);
  const cslRow = page.locator("li", { hasText: uni });
  await expect(cslRow.getByText("Awaiting review")).toBeVisible();
  await expect(cslRow.getByText("Great ag-econ track.")).toBeVisible();

  // Pick the category (the input is sr-only; click its label), then approve.
  await cslRow.getByText("Reach", { exact: true }).click();
  await cslRow.getByRole("button", { name: "Approve" }).click();
  await expect(cslRow.getByText("Approved")).toBeVisible();

  // --- Student sees the counsellor's categorisation reflected back -----------
  await page.context().clearCookies();
  await loginAsStudent(page);
  await page.goto("/student/shortlist");
  const backRow = page.locator("li", { hasText: uni });
  await expect(backRow.getByText("Approved")).toBeVisible();
  await expect(backRow.getByText("Reach")).toBeVisible();

  // Persisted correctly.
  const counsellor = await clientFor(
    CREDS.counsellor.email,
    CREDS.counsellor.password,
  );
  const { data: entry } = await counsellor
    .from("shortlist_entries")
    .select("id, status, category, suggested_by")
    .eq("student_id", STUDENT_ID)
    .eq("university_name", uni)
    .single();
  expect(entry!.status).toBe("approved");
  expect(entry!.category).toBe("reach");
  expect(entry!.suggested_by).toBe("student");

  // Cleanup.
  await counsellor.from("shortlist_entries").delete().eq("id", entry!.id);
});
