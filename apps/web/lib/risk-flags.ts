import * as Sentry from "@sentry/nextjs";
import { generateRiskFlag, logAiAction } from "@epicenter/ai";
import { createClient } from "@/lib/supabase/server";

// Risk Flagging detection (grounding rule, CLAUDE.md §4). Real, RLS-scoped
// queries over ONE student's own data — never across students. Gemini only
// phrases the detected facts (stored in trigger_snapshot.summary so display is
// a plain read, not a repeated model call).
//
// NOTE: only `pace_lag` is detected today. `grade_drop` needs a checkpoint-grade
// history table + an "Update Grades" panel that the data model does not yet
// have; it is deferred until that schema exists (the risk_flags table already
// supports the type). See the stage report.

// Flag a milestone whose actual completion trails its expected pace by ≥50
// percentage points (§1.6 threshold), once at least half its dated tasks are due.
const LAG_THRESHOLD = 0.5;
const EXPECTED_FLOOR = 0.5;

export type ActiveRiskFlag = {
  id: string;
  type: "grade_drop" | "pace_lag";
  summary: string;
};

type Snapshot = { milestone_id?: string; summary?: string };

/**
 * Detect pace-lag risks for one student and store any NEW ones. Idempotent: a
 * milestone with an existing un-dismissed flag is skipped, so re-running never
 * duplicates an active flag. Best-effort — never throws into the caller.
 */
export async function runRiskDetection(studentId: string): Promise<void> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const today = new Date().toISOString().slice(0, 10);

    const [{ data: milestones }, { data: tasks }, { data: existing }] =
      await Promise.all([
        supabase
          .from("roadmap_milestones")
          .select("id, title")
          .eq("student_id", studentId),
        supabase
          .from("tasks")
          .select("milestone_id, due_date, status")
          .eq("student_id", studentId),
        supabase
          .from("risk_flags")
          .select("trigger_snapshot")
          .eq("student_id", studentId)
          .eq("type", "pace_lag")
          .is("dismissed_at", null),
      ]);

    const activeMilestones = new Set(
      ((existing as { trigger_snapshot: Snapshot }[] | null) ?? [])
        .map((r) => r.trigger_snapshot?.milestone_id)
        .filter(Boolean),
    );

    for (const m of (milestones as { id: string; title: string }[] | null) ??
      []) {
      if (activeMilestones.has(m.id)) continue;
      const mtasks = (
        (tasks as
          | { milestone_id: string | null; due_date: string | null; status: string }[]
          | null) ?? []
      ).filter((t) => t.milestone_id === m.id && t.due_date);
      if (mtasks.length < 2) continue;

      const total = mtasks.length;
      const expected = mtasks.filter((t) => t.due_date! <= today).length / total;
      const actual = mtasks.filter((t) => t.status === "complete").length / total;
      if (expected < EXPECTED_FLOOR || expected - actual < LAG_THRESHOLD) continue;

      const expectedPct = Math.round(expected * 100);
      const actualPct = Math.round(actual * 100);
      const summary = await generateRiskFlag("pace_lag", {
        milestone: m.title,
        expected_pct: expectedPct,
        actual_pct: actualPct,
        total_tasks: total,
      });

      await supabase.from("risk_flags").insert({
        student_id: studentId,
        type: "pace_lag",
        trigger_snapshot: {
          milestone_id: m.id,
          milestone_title: m.title,
          expected_pct: expectedPct,
          actual_pct: actualPct,
          total_tasks: total,
          summary,
        },
      });
      await logAiAction(supabase, {
        feature: "risk_flag",
        studentId,
        actorId: user?.id ?? null,
        inputRef: m.id,
        outputText: summary,
      });
    }
  } catch (err) {
    // passive background detection — must never surface as a user-facing
    // error, but a silent failure here means a real risk goes unflagged.
    Sentry.captureException(err, { tags: { ai_feature: "risk_flag" } });
  }
}

/** Un-dismissed risk flags for a student, for display on their Overview tab. */
export async function getActiveRiskFlags(
  studentId: string,
): Promise<ActiveRiskFlag[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("risk_flags")
    .select("id, type, trigger_snapshot")
    .eq("student_id", studentId)
    .is("dismissed_at", null);
  return ((data as { id: string; type: ActiveRiskFlag["type"]; trigger_snapshot: Snapshot }[] | null) ??
    [])
    .map((r) => ({
      id: r.id,
      type: r.type,
      summary: r.trigger_snapshot?.summary ?? "A risk was flagged for this student.",
    }));
}
