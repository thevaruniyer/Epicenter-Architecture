"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { cleanUpNote, extractSignals, logAiAction } from "@epicenter/ai";
import { createClient } from "@/lib/supabase/server";
import { insertGoogleEvent, isGoogleCalendarConfigured } from "@/lib/google-calendar";

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

  // UC9 Screen 6: "Also add to Google Calendar" — logging that a meeting
  // happened creates a same-day Epicenter calendar event too, and pushes it to
  // Google if the counsellor has that sync direction enabled. Best-effort:
  // never blocks the note, which is already saved above.
  if (formData.get("also_add_to_google_calendar") === "true" && user) {
    try {
      const startsAt = new Date();
      const endsAt = new Date(startsAt.getTime() + 30 * 60_000);
      const { data: event } = await supabase
        .from("calendar_events")
        .insert({
          counsellor_id: user.id,
          student_id: studentId,
          title: "Meeting logged",
          starts_at: startsAt.toISOString(),
          ends_at: endsAt.toISOString(),
        })
        .select("id")
        .single();

      if (event && isGoogleCalendarConfigured()) {
        const { data: connection } = await supabase
          .from("google_calendar_connections")
          .select("access_token, push_epicenter_to_google")
          .eq("user_id", user.id)
          .maybeSingle();
        if (connection?.push_epicenter_to_google && connection.access_token) {
          const googleEventId = await insertGoogleEvent(connection.access_token, {
            title: "Meeting logged",
            startsAt: startsAt.toISOString(),
            endsAt: endsAt.toISOString(),
          });
          await supabase
            .from("calendar_events")
            .update({ google_synced: true, google_event_id: googleEventId })
            .eq("id", event.id);
        }
      }
    } catch (err) {
      Sentry.captureException(err, { tags: { feature: "google_calendar_push" } });
    }
  }

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
