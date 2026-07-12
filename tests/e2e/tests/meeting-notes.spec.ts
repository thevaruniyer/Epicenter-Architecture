import { test, expect } from "@playwright/test";
import { loginAsCounsellor } from "../support/auth";

// Ananya Kapoor — seeded fixture student on counsellor1's caseload.
const STUDENT_ID = "60000000-0000-0000-0000-000000000002";

test("counsellor composes a shared and a private note; both appear correctly", async ({
  page,
}) => {
  await loginAsCounsellor(page);
  await page.goto(`/counsellor/students/${STUDENT_ID}/notes`);

  const stamp = Date.now();
  const sharedText = `Discussed shortlist ${stamp}`;
  const privateText = `Parent expectations ${stamp}`;

  // Shared note.
  await page.fill("#note-text", sharedText);
  await page.getByRole("radio", { name: "Shared" }).click();
  await page.getByRole("button", { name: "Save note" }).click();
  await expect(page.getByText(sharedText)).toBeVisible();
  // Wait for the composer to clear (settled) before composing the next note.
  await expect(page.locator("#note-text")).toHaveValue("");

  // Private note (counsellor-only).
  await page.fill("#note-text", privateText);
  await page.getByRole("radio", { name: "Counsellor only" }).click();
  await page.getByRole("button", { name: "Save note" }).click();
  await expect(page.getByText(privateText)).toBeVisible();

  // Each renders with the correct visibility marker.
  const sharedItem = page.locator("li", { hasText: sharedText });
  await expect(sharedItem.getByText("Shared", { exact: true })).toBeVisible();

  const privateItem = page.locator("li", { hasText: privateText });
  await expect(
    privateItem.getByText("Counsellor only", { exact: true }),
  ).toBeVisible();
});
