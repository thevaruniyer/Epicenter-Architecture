"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// `savedId` changes on every successful save so the UI can react to each save
// (not just the first). Effects keyed on a boolean would only fire once.
export type NoteState = { error?: string; savedId?: string };

// Create a meeting note. No AI clean-up yet (Phase 5) — final_text is the raw
// text. RLS lets only the student's counsellor (or head) insert; a student
// session could only ever insert a shared student_update, not a private note.
export async function createNote(
  _prev: NoteState,
  formData: FormData,
): Promise<NoteState> {
  const studentId = String(formData.get("studentId") ?? "");
  const text = String(formData.get("text") ?? "").trim();
  const visibility = String(formData.get("visibility") ?? "shared");

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
      raw_text: text,
      final_text: text,
      ai_cleaned: false,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath(`/counsellor/students/${studentId}/notes`);
  return { savedId: data.id as string };
}
