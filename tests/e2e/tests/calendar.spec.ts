import { test, expect } from "@playwright/test";
import { loginAsCounsellor, loginAsStudent } from "../support/auth";
import { clientFor, CREDS, STUDENT_ID, COUNSELLOR1_ID } from "../support/db";

// UC9. Google Calendar sync isn't functional yet (no GOOGLE_CLIENT_ID/SECRET
// configured — see .env.example), so a real cross-account sync test isn't
// possible here; the REST helper logic itself is covered by
// apps/web/lib/google-calendar.test.ts (fetch mocked, per the Build Runbook's
// "mock the Google API for this"). This covers the fully native, working
// paths: adding an event and Prep Notes wiring.

let createdTitle: string | undefined;

test.afterEach(async () => {
  if (!createdTitle) return;
  const counsellor = await clientFor(CREDS.counsellor.email, CREDS.counsellor.password);
  await counsellor.from("calendar_events").delete().eq("title", createdTitle);
  createdTitle = undefined;
});

test("adding an event shows it on the month grid, and opens Prep Notes", async ({
  page,
}) => {
  const title = `Test Event ${Date.now()}`;
  createdTitle = title;

  await loginAsCounsellor(page);
  await page.goto("/counsellor/calendar");
  await page.getByRole("button", { name: "+ Add Event" }).click();

  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Title").fill(title);
  const today = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const dateStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  await dialog.locator('input[name="startsAt"]').fill(`${dateStr}T10:00`);
  await dialog.locator('input[name="endsAt"]').fill(`${dateStr}T10:30`);
  await dialog.getByLabel("Student (optional)").selectOption({ label: "Kabir Singh" });
  await dialog.getByRole("button", { name: "Add Event" }).click();
  await expect(dialog).toBeHidden();

  const chip = page.getByRole("button", { name: title });
  await expect(chip).toBeVisible();
  await chip.click();

  const detail = page.getByRole("dialog");
  await expect(detail.getByText("Prep Notes")).toBeVisible();
});

test("Connect Google Calendar shows a clear not-configured message", async ({ page }) => {
  await loginAsCounsellor(page);
  await page.goto("/counsellor/calendar");
  await page.getByRole("button", { name: "Connect Google Calendar" }).click();
  await expect(
    page.getByText("Google Calendar isn’t connected yet"),
  ).toBeVisible();
});

// Stage 6.5 Prompt 6.5.3: Calendar extended to students — their own upcoming
// meetings only, read-only (no Add Event / Connect Google Calendar controls).
test("student sees their own upcoming meeting on My Calendar and Home, read-only", async ({
  page,
}) => {
  const title = `Student Meeting ${Date.now()}`;
  createdTitle = title;

  const counsellor = await clientFor(CREDS.counsellor.email, CREDS.counsellor.password);
  const startsAt = new Date(Date.now() + 60 * 60_000);
  const endsAt = new Date(startsAt.getTime() + 30 * 60_000);
  const { error } = await counsellor.from("calendar_events").insert({
    student_id: STUDENT_ID,
    counsellor_id: COUNSELLOR1_ID,
    title,
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
  });
  expect(error).toBeNull();

  await loginAsStudent(page);

  // Home: surfaces as a distinct Meeting card, links to My Calendar.
  await page.goto("/student/home");
  await expect(page.getByText("Upcoming meeting")).toBeVisible();
  await expect(page.getByText(title)).toBeVisible();

  // My Calendar: student sees it, but no counsellor-only controls.
  await page.goto("/student/calendar");
  await expect(page.getByRole("button", { name: title })).toBeVisible();
  await expect(page.getByRole("button", { name: "+ Add Event" })).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Connect Google Calendar" }),
  ).toHaveCount(0);
});
