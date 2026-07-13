"use server";

import { unstable_cache } from "next/cache";
import * as Sentry from "@sentry/nextjs";
import { generateEssayFeedback, logAiAction } from "@epicenter/ai";
import { createClient } from "@/lib/supabase/server";

// Essay Feedback First Pass (§1.9). Counsellor-side only. Draft-then-approve:
// draftEssayFeedback() generates the first pass (cached per draft text so
// re-opening the panel on an unchanged draft never re-calls the model), and
// saveEssayFeedback() records the counsellor's reviewed version. The student
// never sees an AI badge on this feedback (confirmed decision).

export type EssayDraftState = { error?: string; feedback?: string; at?: number };
export type SaveFeedbackState = { error?: string; savedAt?: number };

export async function draftEssayFeedback(
  _prev: EssayDraftState,
  formData: FormData,
): Promise<EssayDraftState> {
  const essay = String(formData.get("essay") ?? "").trim();
  const studentId = String(formData.get("studentId") ?? "");
  if (essay.length < 40) {
    return { error: "Paste a longer draft for a useful first pass." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let feedback: string;
  try {
    // Cached per draft-version: identical draft text -> cached feedback, no
    // second model call (architecture §4 cost guardrail).
    const cached = unstable_cache(
      (text: string) => generateEssayFeedback(text),
      ["essay-feedback"],
      { revalidate: 86_400 },
    );
    feedback = await cached(essay);
  } catch (err) {
    Sentry.captureException(err, { tags: { ai_feature: "essay_feedback" } });
    return { error: "AI feedback is unavailable right now — write yours below." };
  }

  try {
    await logAiAction(supabase, {
      feature: "essay_feedback",
      studentId: studentId || null,
      actorId: user?.id ?? null,
      outputText: feedback,
    });
  } catch (err) {
    // logging must never block the counsellor — but a silently broken audit
    // trail (CLAUDE.md §4) still needs to be visible somewhere.
    Sentry.captureException(err, { tags: { ai_feature: "essay_feedback_log" } });
  }

  return { feedback, at: Date.now() };
}

export async function saveEssayFeedback(
  _prev: SaveFeedbackState,
  formData: FormData,
): Promise<SaveFeedbackState> {
  const feedback = String(formData.get("feedback") ?? "").trim();
  const studentId = String(formData.get("studentId") ?? "");
  const aiAssisted = formData.get("ai_assisted") === "true";
  const edited = formData.get("edited") === "true";
  if (!feedback) return { error: "Write feedback before saving." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // No essay-feedback storage table exists yet (the broader Documents subsystem
  // and the student-facing essay view are unmodeled and deferred). The reviewed
  // feedback is recorded as a counsellor-side audit entry with reviewed_by set.
  try {
    await logAiAction(supabase, {
      feature: "essay_feedback",
      studentId: studentId || null,
      actorId: user?.id ?? null,
      reviewedBy: user?.id ?? null,
      outputText: feedback,
      editedBeforeSave: aiAssisted ? edited : false,
    });
  } catch (err) {
    // non-fatal — but a silently broken audit trail (CLAUDE.md §4) still
    // needs to be visible somewhere.
    Sentry.captureException(err, { tags: { ai_feature: "essay_feedback_log" } });
  }

  return { savedAt: Date.now() };
}
