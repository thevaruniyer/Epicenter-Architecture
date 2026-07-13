"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { cleanUpNote, extractSignals, logAiAction } from "@epicenter/ai";
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
  } catch (err) {
    Sentry.captureException(err, { tags: { ai_feature: "clean_up" } });
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
  } catch (err) {
    // logging must never block the counsellor's work — but a silently broken
    // audit trail (CLAUDE.md §4) still needs to be visible somewhere.
    Sentry.captureException(err, { tags: { ai_feature: "clean_up_log" } });
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

  // Async signal extraction (Flow Plan §3/§4.3): after the response is sent,
  // pull tagged signals out of the note into student_signals so the category
  // nudge is a fast table read later — never a live LLM call. Best-effort:
  // failures here must never affect the saved note.
  const noteId = data.id as string;
  after(async () => {
    try {
      const supa = await createClient();
      const signals = await extractSignals(text);
      if (signals.length) {
        await supa.from("student_signals").insert(
          signals.map((s) => ({
            student_id: studentId,
            category: s.category,
            tag_text: s.tag,
            source_note_id: noteId,
          })),
        );
        await logAiAction(supa, {
          feature: "nudge",
          studentId,
          actorId: user?.id ?? null,
          inputRef: noteId,
          outputText: JSON.stringify(signals),
        });
      }
    } catch (err) {
      // background enrichment — must never affect the saved note, but a
      // silent failure here is still worth knowing about.
      Sentry.captureException(err, { tags: { ai_feature: "nudge" } });
    }
  });

  revalidatePath(`/counsellor/students/${studentId}/notes`);
  return { savedId: noteId };
}
