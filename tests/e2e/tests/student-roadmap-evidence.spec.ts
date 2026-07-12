import { test, expect } from "@playwright/test";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loginAsStudent } from "../support/auth";
import { clientFor, CREDS, STUDENT_ID } from "../support/db";

const here = dirname(fileURLToPath(import.meta.url));
const EVIDENCE = resolve(here, "../support/fixtures/evidence.png");

test("student marks a task done with evidence — real thumbnail, task goes pending_review", async ({
  page,
}) => {
  const title = `Upload evidence ${Date.now()}`;

  // Counsellor creates a not_started task for the student (students can't).
  const counsellor = await clientFor(
    CREDS.counsellor.email,
    CREDS.counsellor.password,
  );
  const { data: task, error } = await counsellor
    .from("tasks")
    .insert({
      student_id: STUDENT_ID,
      title,
      category: "documents_admin",
      assignee: "student",
      status: "not_started",
    })
    .select("id")
    .single();
  expect(error).toBeNull();
  const taskId = task!.id as string;

  await loginAsStudent(page);
  await page.goto("/student/roadmap");

  const row = page.locator("li", { hasText: title });
  await expect(row.getByText("To do")).toBeVisible();

  // Mark done + upload evidence.
  await row.getByRole("button", { name: "Mark done" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.locator('input[name="evidence"]').setInputFiles(EVIDENCE);
  await dialog.getByRole("button", { name: "Submit for review" }).click();
  await expect(dialog).toBeHidden();

  // Task enters pending_review (same tick-then-confirm hook as the counsellor side).
  await expect(row.getByText("Waiting for counsellor review")).toBeVisible();

  // A real thumbnail renders (not a placeholder icon) — poll until the
  // signed-URL image has actually decoded, then assert it has real pixels.
  const img = row.locator('img[alt^="Evidence"]');
  await expect(img).toBeVisible();
  await expect
    .poll(
      () =>
        // Runs in the browser; type DOM props structurally so the Node-scoped
        // e2e tsconfig (no DOM lib) still checks this file.
        img.evaluate((el) => {
          const image = el as unknown as {
            complete: boolean;
            naturalWidth: number;
          };
          return image.complete ? image.naturalWidth : 0;
        }),
      { timeout: 10_000 },
    )
    .toBeGreaterThan(0);

  // Persisted: pending_review with evidence.
  const { data: after } = await counsellor
    .from("tasks")
    .select("status, evidence_url")
    .eq("id", taskId)
    .single();
  expect(after!.status).toBe("pending_review");
  expect(after!.evidence_url).not.toBeNull();
});
