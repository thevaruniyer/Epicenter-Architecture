"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cleanUpNote, logAiAction } from "@epicenter/ai";
import { createClient } from "@/lib/supabase/server";

export type UpdateState = { error?: string; savedId?: string };

// Draft-then-approve clean-up (light, §2.5): returns a tidied DRAFT only.
export type CleanUpState = { error?: string; cleaned?: string; at?: number };

export async function cleanUpStudentUpdate(
  _prev: CleanUpState,
  formData: FormData,
): Promise<CleanUpState> {
  const raw = String(formData.get("text") ?? "").trim();
  if (!raw) return { error: "Write an update before cleaning it up." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let cleaned: string;
  try {
    cleaned = await cleanUpNote(raw, "update");
  } catch {
    return {
      error: "AI clean-up is unavailable right now. Your update is unchanged.",
    };
  }

  try {
    await logAiAction(supabase, {
      feature: "clean_up",
      studentId: user.id,
      actorId: user.id,
      outputText: cleaned,
    });
  } catch {
    /* logging must never block the student's work */
  }

  return { cleaned, at: Date.now() };
}

// "Add an Update" (SU5): a student adds a shared note (type student_update).
// If they approved an AI clean-up, raw_text keeps their original words and
// ai_cleaned drives the permanent badge. RLS only lets a student insert a
// shared student_update for themselves.
export async function addStudentUpdate(
  _prev: UpdateState,
  formData: FormData,
): Promise<UpdateState> {
  const text = String(formData.get("text") ?? "").trim();
  const aiCleaned = formData.get("ai_cleaned") === "true";
  const rawText = String(formData.get("raw_text") ?? "").trim() || text;
  if (!text) return { error: "Write an update first." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("notes")
    .insert({
      student_id: user.id,
      author_id: user.id,
      visibility: "shared",
      type: "student_update",
      raw_text: rawText,
      final_text: text,
      ai_cleaned: aiCleaned,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  revalidatePath("/student/notes");
  return { savedId: data.id as string };
}
