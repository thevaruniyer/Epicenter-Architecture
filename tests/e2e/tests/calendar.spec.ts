import { test, expect } from "@playwright/test";
import { loginAsCounsellor } from "../support/auth";
import { clientFor, CREDS } from "../support/db";

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
