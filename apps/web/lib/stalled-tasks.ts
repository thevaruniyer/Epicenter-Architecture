import { generateStalledAlert, logAiAction } from "@epicenter/ai";
import { createClient } from "@/lib/supabase/server";

// Stalled-Task Alerts detection (grounding rule, CLAUDE.md §4). Real, RLS-scoped
// query: a task that has sat in pending_review past the threshold. Gemini only
// phrases the (title, days) fact; the summary is stored so display is a plain
// read. Passive: dismiss-only, counsellor-internal.

// §1.8 threshold: 3 business days in pending review. Approximated as 3 calendar
// days here (documented approximation — weekends aren't excluded).
const STALLED_DAYS = 3;

export type ActiveStalledAlert = { id: string; taskId: string; summary: string };

/**
 * Detect and store stalled-task alerts for one student's roadmap. Idempotent:
 * a task with an existing un-dismissed alert is skipped, so re-running never
 * duplicates. Best-effort — never throws into the caller.
 */
export async function runStalledDetection(studentId: string): Promise<void> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const cutoff = new Date(
      Date.now() - STALLED_DAYS * 86_400_000,
    ).toISOString();

    const [{ data: stalledTasks }, { data: existing }] = await Promise.all([
      supabase
        .from("tasks")
        .select("id, title, pending_review_at")
        .eq("student_id", studentId)
        .eq("status", "pending_review")
        .not("pending_review_at", "is", null)
        .lte("pending_review_at", cutoff),
      supabase
        .from("stalled_task_alerts")
        .select("task_id")
        .is("dismissed_at", null),
    ]);

    const alreadyAlerted = new Set(
      ((existing as { task_id: string }[] | null) ?? []).map((r) => r.task_id),
    );

    for (const t of (stalledTasks as
      | { id: string; title: string; pending_review_at: string }[]
      | null) ?? []) {
      if (alreadyAlerted.has(t.id)) continue;
      const days = Math.floor(
        (Date.now() - new Date(t.pending_review_at).getTime()) / 86_400_000,
      );
      const summary = await generateStalledAlert(t.title, days);

      await supabase
        .from("stalled_task_alerts")
        .insert({ task_id: t.id, summary });
      await logAiAction(supabase, {
        feature: "stalled_alert",
        studentId,
        actorId: user?.id ?? null,
        inputRef: t.id,
        outputText: summary,
      });
    }
  } catch {
    /* passive background detection — swallow */
  }
}

/**
 * Un-dismissed stalled alerts for a student's roadmap. Joins through tasks to
 * scope to this student (stalled_task_alerts has no student_id of its own).
 */
export async function getActiveStalledAlerts(
  studentId: string,
): Promise<ActiveStalledAlert[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("stalled_task_alerts")
    .select("id, task_id, summary, tasks!inner(student_id)")
    .is("dismissed_at", null)
    .eq("tasks.student_id", studentId);

  return ((data as
    | { id: string; task_id: string; summary: string | null }[]
    | null) ?? []).map((r) => ({
    id: r.id,
    taskId: r.task_id,
    summary: r.summary ?? "A task has been awaiting your review.",
  }));
}
