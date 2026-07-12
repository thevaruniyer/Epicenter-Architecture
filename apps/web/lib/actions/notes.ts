"use server";

import { revalidatePath } from "next/cache";
import { cleanUpNote, logAiAction } from "@epicenter/ai";
import { createClient } from "@/lib/supabase/server";

// `savedId` changes on every successful save so the UI can react to each save
// (not just the first). Effects keyed on a boolean would only fire once.
export type NoteState = { error?: string; savedId?: string };

// Draft-then-approve clean-up: returns a cleaned DRAFT (never saved here). The
// counsellor reviews/edits it and only createNote() persists the approved text.
export type CleanUpState = { error?: string; cleaned?: string; at?: number };

export async function cleanUpMeetingNote(
  _prev: CleanUpState,
  formData: FormData,
): Promise<CleanUpState> {
  const raw = String(formData.get("text") ?? "").trim();
  const studentId = String(formData.get("studentId") ?? "");
  if (!raw) return { error: "Write a note before cleaning it up." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let cleaned: string;
  try {
    cleaned = await cleanUpNote(raw, "meeting");
  } catch {
    return {
      error: "AI clean-up is unavailable right now. Your note is unchanged.",
    };
  }

  // Log the AI call (audit trail, CLAUDE.md §4). Non-fatal if logging fails.
  try {
    await logAiAction(supabase, {
      feature: "clean_up",
      studentId: studentId || null,
      actorId: user?.id ?? null,
      outputText: cleaned,
    });
  } catch {
    /* logging must never block the counsellor's work */
  }

  return { cleaned, at: Date.now() };
}

// Create a meeting note. If the counsellor approved an AI clean-up, raw_text
// keeps what they originally typed (audit trail per §1.1) and final_text is the
// approved (possibly edited) cleaned text; ai_cleaned drives the permanent badge.
export async function createNote(
  _prev: NoteState,
  formData: FormData,
): Promise<NoteState> {
  const studentId = String(formData.get("studentId") ?? "");
  const text = String(formData.get("text") ?? "").trim();
  const visibility = String(formData.get("visibility") ?? "shared");
  const aiCleaned = formData.get("ai_cleaned") === "true";
  const rawText = String(formData.get("raw_text") ?? "").trim() || text;

  if (!studentId) return { error: "Missing student." };
  if (!text) return { error: "Write something before saving." };
  if (visibility !== "shared" && visibility !== "private") {
    return { error: "Invalid visibility." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("notes")
    .insert({
      student_id: studentId,
      author_id: user?.id,
      visibility,
      type: "meeting",
      raw_text: rawText,
      final_text: text,
      ai_cleaned: aiCleaned,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath(`/counsellor/students/${studentId}/notes`);
  return { savedId: data.id as string };
}
