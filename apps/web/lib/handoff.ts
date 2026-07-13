import * as Sentry from "@sentry/nextjs";
import {
  generateHandoffSnapshot,
  logAiAction,
  type HandoffContext,
} from "@epicenter/ai";
import { createClient } from "@/lib/supabase/server";

// Reassignment Handoff Snapshot (§1.7). Assembles the student's real context
// through the SAME RLS-scoped connection as any request (CLAUDE.md §4 — this is
// what actually prevents cross-student leakage, not a prompt instruction), then
// generates and stores a PERMANENT snapshot for the receiving counsellor.
//
// The reassignment trigger itself is wired up in Stage 6; this function and the
// display card exist now so that phase only has to call it.

async function assembleContext(
  supabase: Awaited<ReturnType<typeof createClient>>,
  studentId: string,
): Promise<HandoffContext> {
  const [profile, user, notes, tasks, shortlist, applications] =
    await Promise.all([
      supabase
        .from("student_profiles")
        .select("grade, intended_major")
        .eq("user_id", studentId)
        .maybeSingle(),
      supabase.from("users").select("full_name").eq("id", studentId).maybeSingle(),
      supabase
        .from("notes")
        .select("visibility, final_text, created_at")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false })
        .limit(6),
      supabase
        .from("tasks")
        .select("title, status, due_date")
        .eq("student_id", studentId)
        .neq("status", "complete"),
      supabase
        .from("shortlist_entries")
        .select("university_name, category, status")
        .eq("student_id", studentId),
      supabase
        .from("applications")
        .select("status, shortlist_entries(university_name)")
        .eq("student_id", studentId),
    ]);

  return {
    studentName:
      (user.data?.full_name as string | null) ?? "This student",
    grade: (profile.data?.grade as number | null) ?? null,
    intendedMajor: (profile.data?.intended_major as string | null) ?? null,
    recentNotes: (
      (notes.data as
        | { visibility: "shared" | "private"; final_text: string | null }[]
        | null) ?? []
    )
      .filter((n) => n.final_text)
      .map((n) => ({ visibility: n.visibility, text: n.final_text! })),
    tasks: (
      (tasks.data as
        | { title: string; status: string; due_date: string | null }[]
        | null) ?? []
    ).map((t) => ({ title: t.title, status: t.status, due: t.due_date })),
    shortlist: (
      (shortlist.data as
        | { university_name: string; category: string | null; status: string }[]
        | null) ?? []
    ).map((s) => ({
      university: s.university_name,
      category: s.category,
      status: s.status,
    })),
    applications: (
      (applications.data as
        | { status: string; shortlist_entries: { university_name: string } | null }[]
        | null) ?? []
    ).map((a) => ({
      university: a.shortlist_entries?.university_name ?? "University",
      status: a.status,
    })),
  };
}

/**
 * Generate and store a permanent handoff snapshot for the receiving counsellor.
 * Called by the Stage 6 reassignment flow. Returns the stored content, or null
 * if generation/storage failed (so reassignment can proceed and retry).
 */
export async function generateAndStoreHandoff(
  studentId: string,
  forCounsellorId: string,
): Promise<string | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const ctx = await assembleContext(supabase, studentId);
    const content = await generateHandoffSnapshot(ctx);

    const { error } = await supabase.from("reassignment_snapshots").insert({
      student_id: studentId,
      generated_for_counsellor_id: forCounsellorId,
      content,
    });
    if (error) return null;

    try {
      await logAiAction(supabase, {
        feature: "reassignment_snapshot",
        studentId,
        actorId: user?.id ?? null,
        reviewedBy: forCounsellorId,
        outputText: content,
      });
    } catch (err) {
      // non-fatal — but a silently broken audit trail (CLAUDE.md §4) still
      // needs to be visible somewhere.
      Sentry.captureException(err, {
        tags: { ai_feature: "reassignment_snapshot_log" },
      });
    }
    return content;
  } catch (err) {
    // Generation/storage failure — reassignment can proceed and retry, but
    // a silent failure here still needs to be visible somewhere.
    Sentry.captureException(err, {
      tags: { ai_feature: "reassignment_snapshot" },
    });
    return null;
  }
}

export type HandoffSnapshot = { content: string; generatedAt: string };

/** The handoff snapshot generated for the current counsellor, if any. */
export async function getHandoffForMe(
  studentId: string,
): Promise<HandoffSnapshot | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("reassignment_snapshots")
    .select("content, generated_at")
    .eq("student_id", studentId)
    .eq("generated_for_counsellor_id", user.id)
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  return {
    content: data.content as string,
    generatedAt: data.generated_at as string,
  };
}
