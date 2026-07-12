import { test, expect } from "@playwright/test";
import { loginAsCounsellor } from "../support/auth";
import { clientFor, CREDS, STUDENT_ID } from "../support/db";

test("a task reaches complete ONLY after the counsellor explicitly confirms", async ({
  page,
}) => {
  const title = `Tick-confirm task ${Date.now()}`;

  // The counsellor creates the task (RLS: students cannot create tasks).
  const counsellor = await clientFor(
    CREDS.counsellor.email,
    CREDS.counsellor.password,
  );
  const { data: task, error: insErr } = await counsellor
    .from("tasks")
    .insert({
      student_id: STUDENT_ID,
      title,
      category: "other",
      assignee: "student",
      status: "not_started",
    })
    .select("id")
    .single();
  expect(insErr).toBeNull();
  const taskId = task!.id as string;

  // The student "marks it done" — allowed to move it to pending_review.
  const student = await clientFor(CREDS.student.email, CREDS.student.password);
  const { error: tickErr } = await student
    .from("tasks")
    .update({ status: "pending_review" })
    .eq("id", taskId);
  expect(tickErr).toBeNull();

  // The student CANNOT self-complete — RLS forbids setting complete/confirmed_by.
  await student.from("tasks").update({ status: "complete" }).eq("id", taskId);
  const { data: afterStudent } = await counsellor
    .from("tasks")
    .select("status, confirmed_by")
    .eq("id", taskId)
    .single();
  expect(afterStudent!.status).toBe("pending_review"); // still awaiting confirmation
  expect(afterStudent!.confirmed_by).toBeNull();

  // The counsellor confirms via the UI — the only path to complete.
  await loginAsCounsellor(page);
  await page.goto(`/counsellor/students/${STUDENT_ID}/roadmap`);
  const row = page.locator("li", { hasText: title });
  await expect(row.getByText("Awaiting your review")).toBeVisible();
  await row.getByRole("button", { name: "Confirm" }).click();
  await expect(row.getByText("Complete", { exact: true })).toBeVisible();

  // Persisted: complete, with confirmed_by set.
  const { data: final } = await counsellor
    .from("tasks")
    .select("status, confirmed_by")
    .eq("id", taskId)
    .single();
  expect(final!.status).toBe("complete");
  expect(final!.confirmed_by).not.toBeNull();
});
