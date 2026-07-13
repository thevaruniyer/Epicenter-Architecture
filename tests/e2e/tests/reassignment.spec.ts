import { test, expect } from "@playwright/test";
import { loginAsHead } from "../support/auth";
import {
  clientFor,
  CREDS,
  STUDENT_ID,
  COUNSELLOR1_ID,
  COUNSELLOR2_ID,
} from "../support/db";

// UC6 full reassignment: a real note + roadmap task exist on the seeded
// student (Kabir Singh, on counsellor1's caseload) before reassigning him to
// counsellor2 through the actual Team-view UI. generateAndStoreHandoff() makes
// a live Gemini call in the background (after()) — like the Stage 5
// draft-then-approve tests, this can be blocked by Gemini free-tier daily
// quota exhaustion; that's an external constraint, not a code defect.

let marker: string | undefined;
let milestoneId: string | undefined;

// Cleanup lives in afterEach, NOT an in-body try/finally: when Playwright's
// own test.setTimeout fires (which it reliably does here whenever the
// snapshot poll below never resolves), code after that point in the test body
// does not run — including a finally block. afterEach is a separate hook with
// its own budget and Playwright guarantees it runs regardless of how the test
// ended. Restoring Kabir Singh to counsellor1 MUST happen before the
// notes/tasks/milestone deletes: those go through counsellor1's own
// RLS-scoped client, and counsels_student() (which reads
// assigned_counsellor_id) won't grant him access again until this commits.
test.afterEach(async () => {
  const head = await clientFor(CREDS.head.email, CREDS.head.password);
  const counsellor1 = await clientFor(
    CREDS.counsellor.email,
    CREDS.counsellor.password,
  );

  await head
    .from("student_profiles")
    .update({ assigned_counsellor_id: COUNSELLOR1_ID })
    .eq("user_id", STUDENT_ID);

  await Promise.allSettled([
    head.from("reassignment_snapshots").delete().eq("student_id", STUDENT_ID),
    marker
      ? counsellor1.from("notes").delete().eq("student_id", STUDENT_ID).eq("final_text", marker)
      : Promise.resolve(),
    milestoneId
      ? counsellor1.from("tasks").delete().eq("milestone_id", milestoneId)
      : Promise.resolve(),
    milestoneId
      ? counsellor1.from("roadmap_milestones").delete().eq("id", milestoneId)
      : Promise.resolve(),
  ]);

  // Sequential: caseload rows are unique on (counsellor_id, student_id), so
  // the insert must follow the delete rather than race it.
  await head.from("counsellor_caseloads").delete().eq("student_id", STUDENT_ID);
  await head
    .from("counsellor_caseloads")
    .insert({ counsellor_id: COUNSELLOR1_ID, student_id: STUDENT_ID });

  marker = undefined;
  milestoneId = undefined;
});

test("reassigning a student produces a real (non-placeholder) handoff snapshot", async ({
  page,
}) => {
  test.setTimeout(90_000);
  marker = `Reassignment test note ${Date.now()}`;
  const counsellor1 = await clientFor(
    CREDS.counsellor.email,
    CREDS.counsellor.password,
  );
  const head = await clientFor(CREDS.head.email, CREDS.head.password);

  // Fixture: a real note + milestone/task on Kabir Singh, so the handoff
  // snapshot has actual prior state to summarise (not a placeholder).
  await counsellor1.from("notes").insert({
    student_id: STUDENT_ID,
    visibility: "shared",
    type: "meeting",
    final_text: marker,
  });
  const { data: milestone } = await counsellor1
    .from("roadmap_milestones")
    .insert({ student_id: STUDENT_ID, title: `Reassignment test milestone ${Date.now()}` })
    .select("id")
    .single();
  milestoneId = milestone?.id as string | undefined;
  if (milestoneId) {
    await counsellor1.from("tasks").insert({
      milestone_id: milestoneId,
      student_id: STUDENT_ID,
      title: "Reassignment test task",
      status: "in_progress",
    });
  }

  await loginAsHead(page);
  await page.goto("/counsellor/team");

  const rohanRow = page.getByRole("button", { name: /^Rohan Mehta /i });
  const beforeText = (await rohanRow.textContent()) ?? "";
  const beforeCount = Number(beforeText.match(/(\d+)$/)?.[1]);
  expect(Number.isFinite(beforeCount)).toBe(true);

  await rohanRow.click();
  await page.getByRole("button", { name: "Reassign from Rohan Mehta" }).click();

  await page.getByRole("checkbox", { name: "Kabir Singh" }).click();
  await page.getByLabel("Move To").selectOption({ label: "Simran Kaur" });
  await page.getByRole("button", { name: "Confirm Reassignment" }).click();
  await page.getByRole("button", { name: "Reassign" }).click();

  // Caseload counts update immediately (no page reload needed) — down by
  // exactly the one student just moved.
  await expect(rohanRow).toContainText(String(beforeCount - 1));

  // The handoff snapshot generates in the background (after()) — poll for it
  // rather than assuming a fixed delay.
  await expect(async () => {
    const { data } = await head
      .from("reassignment_snapshots")
      .select("content")
      .eq("student_id", STUDENT_ID)
      .eq("generated_for_counsellor_id", COUNSELLOR2_ID)
      .maybeSingle();
    expect(data?.content).toBeTruthy();
  }).toPass({ timeout: 30_000 });

  // The receiving counsellor sees the permanent Handoff Summary card.
  await page.goto(`/counsellor/students/${STUDENT_ID}`);
  await expect(page.getByText("Handoff summary")).toBeVisible();
  await expect(page.getByText("AI-generated")).toBeVisible();
});
