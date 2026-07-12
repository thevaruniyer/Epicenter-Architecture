"use server";

import { unstable_cache } from "next/cache";
import {
  generateMeetingPrep,
  logAiAction,
  type MeetingPrepContext,
} from "@epicenter/ai";
import { createClient } from "@/lib/supabase/server";

// Meeting Prep Briefing (§1.11). PULL-based — only runs when the counsellor taps
// "Prep Notes" (never auto-pushed). Cached per meeting-id so re-opening the same
// meeting doesn't re-call the model. Wired into the real Calendar UI once that
// feature is built; the function + panel exist now (per the Runbook).

export type PrepState = { error?: string; briefing?: string; at?: number };

async function assembleContext(
  studentId: string,
): Promise<{ ctx: MeetingPrepContext; actorId: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const today = new Date().toISOString().slice(0, 10);

  const [profile, userRow, tasks, notes, apps] = await Promise.all([
    supabase
      .from("student_profiles")
      .select("intended_major")
      .eq("user_id", studentId)
      .maybeSingle(),
    supabase.from("users").select("full_name").eq("id", studentId).maybeSingle(),
    supabase
      .from("tasks")
      .select("title, status, due_date")
      .eq("student_id", studentId)
      .neq("status", "complete"),
    supabase
      .from("notes")
      .select("final_text, created_at")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false })
      .limit(4),
    supabase
      .from("applications")
      .select("deposit_deadline, shortlist_entries(university_name)")
      .eq("student_id", studentId)
      .not("deposit_deadline", "is", null),
  ]);

  const openTasks =
    (tasks.data as
      | { title: string; status: string; due_date: string | null }[]
      | null) ?? [];

  const ctx: MeetingPrepContext = {
    studentName: (userRow.data?.full_name as string | null) ?? "This student",
    intendedMajor: (profile.data?.intended_major as string | null) ?? null,
    openTasks: openTasks.map((t) => ({
      title: t.title,
      status: t.status,
      due: t.due_date,
    })),
    recentNotes: (
      (notes.data as { final_text: string | null }[] | null) ?? []
    )
      .map((n) => n.final_text)
      .filter((t): t is string => Boolean(t)),
    upcomingDeadlines: [
      ...openTasks
        .filter((t) => t.due_date && t.due_date >= today)
        .map((t) => ({ label: t.title, date: t.due_date! })),
      ...(
        (apps.data as
          | {
              deposit_deadline: string | null;
              shortlist_entries: { university_name: string } | null;
            }[]
          | null) ?? []
      ).map((a) => ({
        label: `${a.shortlist_entries?.university_name ?? "Application"} deposit`,
        date: a.deposit_deadline!,
      })),
    ],
  };

  return { ctx, actorId: user?.id ?? null };
}

export async function prepareMeeting(
  _prev: PrepState,
  formData: FormData,
): Promise<PrepState> {
  const studentId = String(formData.get("studentId") ?? "");
  const meetingId = String(formData.get("meetingId") ?? "");
  if (!studentId || !meetingId) return { error: "Missing meeting." };

  const supabase = await createClient();
  const { ctx, actorId } = await assembleContext(studentId);

  let briefing: string;
  try {
    // Cached per meeting-id: the first "Prep Notes" tap for a meeting generates;
    // re-opening the same meeting returns the cached briefing (no re-call).
    const cached = unstable_cache(
      (_meetingId: string) => generateMeetingPrep(ctx),
      ["meeting-prep"],
      { revalidate: 86_400 },
    );
    briefing = await cached(meetingId);
  } catch {
    return { error: "AI prep is unavailable right now — open the full record." };
  }

  try {
    await logAiAction(supabase, {
      feature: "meeting_prep",
      studentId,
      actorId,
      inputRef: meetingId,
      outputText: briefing,
    });
  } catch {
    /* non-fatal */
  }

  return { briefing, at: Date.now() };
}
